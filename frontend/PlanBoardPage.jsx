// PlanBoardPage — Multi-Stack Gantt + Duration Picker for Plan DTE
// Mounted inside PreSiteMonitorPage as the "PLAN_BOARD" nav.
//
// Features:
//   - DTE (rows) × 14-day window (cols)
//   - Multiple sites per cell (stacked), heat-color background
//   - Multi-day spans (rounded to whole cells, dur > 1)
//   - Partial-day bars (< 1d) shown as striped + width-scaled
//   - Click bar/pool card → DurationModal (0.3-7.0 day, presets + custom)
//   - Drag pool → cell, drag bar → cell
//   - Pool sidebar (unscheduled)
//   - Workload "day-load" footer
//
// Backend wiring:
//   - GET  /api/employees?contract_type=Subcontractor%20Per-Site
//   - GET  /api/project-pos
//   - PATCH /api/project-pos/{id}/plan { planned_dte_codes, planned_dte_names,
//                                         planned_start_date, planned_duration_days }
//   - POST /api/presite/cluster-plan   (PAC cluster — set DTE for whole cluster)
//
// 30-day max future window is enforced both client-side and server-side.

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { CalendarRange, Map as MapIcon, X } from 'lucide-react'
import { apiFetch } from './src/apiFetch.js'

// ── Constants ──────────────────────────────────────────────────────────────
const ACE_BLUE = '#2447d8'
const PURPLE   = '#7c3aed'
const DAYS = 14
const CELL_W = 78
const MAX_STACK = 3
const DURATION_MIN = 0.3
const DURATION_MAX = 7.0
const MAX_FUTURE_DAYS = 30

const DTE_PALETTE = [
  { bg: '#2447d8', cls: 'dte-c1' },
  { bg: '#0ea5e9', cls: 'dte-c2' },
  { bg: '#10b981', cls: 'dte-c3' },
  { bg: '#f59e0b', cls: 'dte-c4' },
  { bg: '#c73b32', cls: 'dte-c5' },
]

const QUICK_DURATIONS = [
  { val: 0.3, label: '0.3d', hint: '~2.4 ชม.', partial: true },
  { val: 0.5, label: '0.5d', hint: 'ครึ่งวัน', partial: true },
  { val: 1,   label: '1d',   hint: '1 วัน',    partial: false },
  { val: 2,   label: '2d',   hint: '2 วัน',    partial: false },
  { val: 3,   label: '3d',   hint: '3 วัน',    partial: false },
  { val: 5,   label: '5d',   hint: '5 วัน',    partial: false },
  { val: 7,   label: '7d',   hint: '1 สัปดาห์', partial: false },
]

// Default duration when no plan exists yet:
//   - SSV = 0.3 day (quick site verification check)
//   - PAC = 1.0 day (cluster work, usually multi-day, but we start at 1)
function defaultDurationFor(workType) {
  return workType === 'SSV' ? 0.3 : 1.0
}

// Pre-Site workflow stages → display config
const STAGE_CONFIG = {
  FULL_ONAIR:    { label: 'Full On-Air', color: '#0ea5e9', bg: '#e0f2fe', short: 'OA' },
  CLUSTER_READY: { label: 'Cluster Ready', color: '#0ea5e9', bg: '#e0f2fe', short: 'CR' },
  DT_STARTED:    { label: 'DT Started',  color: '#2447d8', bg: '#dbeafe', short: 'DT' },
  DT_DONE:       { label: 'DT Done',     color: '#10b981', bg: '#d1fae5', short: 'DD' },
  REPORT_DONE:   { label: 'Report Done', color: '#10b981', bg: '#d1fae5', short: 'RD' },
  CHECKING:      { label: 'Checking',    color: '#f59e0b', bg: '#fef3c7', short: 'CK' },
  ACE_APPROVED:  { label: 'ACE Approved',color: '#059669', bg: '#a7f3d0', short: '✓' },
}
function stageBadge(stage) {
  return STAGE_CONFIG[stage] || { label: stage || '—', color: '#64748b', bg: '#f1f5f9', short: '?' }
}

// ── Date helpers ──────────────────────────────────────────────────────────
function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}
function addDays(d, n) {
  return new Date(d.getTime() + n * 86400000)
}
// ⚠ Use LOCAL date components — toISOString() would return UTC and shift the
// date back by 1 in TZ+07 (Bangkok). Bug fixed 2026-05-28: dragging to day +3
// was saving as day +2 because UTC midnight of 28/05 +07 = 17:00 of 27/05 UTC.
function fmtIso(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function parseIso(s) {
  if (!s) return null
  // Split YYYY-MM-DD → construct local midnight directly (avoids any TZ ambiguity)
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d, 0, 0, 0, 0)
}
function dayDiff(d, ref) {
  return Math.round((d.getTime() - ref.getTime()) / 86400000)
}
function fmtDayLabel(d, offset) {
  if (offset === 0) return 'Today'
  return d.toLocaleDateString('en-GB', { weekday: 'short' })
}
function fmtDateShort(d) {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}
function fmtDuration(dur) {
  if (dur == null) return ''
  if (Number.isInteger(dur)) return `${dur}d`
  return `${dur.toFixed(1)}d`
}

// ── Toast helper (lightweight) ────────────────────────────────────────────
let toastTimer = null
function showToast(msg, kind = 'success') {
  let el = document.getElementById('planboard-toast')
  if (!el) {
    el = document.createElement('div')
    el.id = 'planboard-toast'
    el.style.cssText = 'position:fixed;bottom:24px;right:24px;border-radius:12px;padding:12px 20px;color:#fff;font-weight:700;font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,.3);opacity:0;transition:opacity .25s;pointer-events:none;z-index:9999;max-width:90vw'
    document.body.appendChild(el)
  }
  el.textContent = msg
  el.style.background = kind === 'error' ? '#c73b32' : kind === 'info' ? '#475569' : '#059669'
  el.style.opacity = '1'
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { el.style.opacity = '0' }, 2200)
}

// ── Detect Per-Site DTE ───────────────────────────────────────────────────
function isPerSiteDte(emp) {
  return String(emp.contract_type || '').toLowerCase().includes('per-site')
}

// ── Site occupancy helpers ────────────────────────────────────────────────
function siteOccupiesDay(s, dayOffset) {
  if (s.startDay == null) return false
  const cells = Math.max(1, Math.ceil(s.dur || 1))
  return s.startDay <= dayOffset && dayOffset <= s.startDay + cells - 1
}

function heatClassForCount(n) {
  if (n === 0) return ''
  if (n === 1) return 'heat-1'
  if (n === 2) return 'heat-2'
  if (n === 3) return 'heat-3'
  return 'heat-4'
}

// ── Main component ────────────────────────────────────────────────────────
export default function PlanBoardPage() {
  const today = useMemo(() => startOfToday(), [])
  const [rawPos, setRawPos] = useState([])
  const [employees, setEmployees] = useState([])
  const [siteCoords, setSiteCoords] = useState({})  // { SITE_CODE: { lat, lng, name } }
  const [trackingMap, setTrackingMap] = useState({})  // { KEY: { stage, dte, fullOnAirAt, clusterReadyAt } }
  const [activeTypes, setActiveTypes] = useState(() => new Set(['SSV', 'PAC']))
  const [loading, setLoading] = useState(true)
  const [editingSite, setEditingSite] = useState(null)
  const [savingIds, setSavingIds] = useState(() => new Set())
  // Tracks the site being dragged FROM a Gantt cell (scheduled bar).
  // Used to: (a) highlight Pool as a drop target, (b) recognise pool-drop as "unschedule".
  const [draggingScheduledId, setDraggingScheduledId] = useState(null)
  const [poolDropOver, setPoolDropOver] = useState(false)
  const [poolSearch, setPoolSearch] = useState('')
  const [poolTypes, setPoolTypes] = useState(() => new Set(['SSV', 'PAC']))  // independent from Gantt activeTypes
  const [poolSortDesc, setPoolSortDesc] = useState(false)  // false = ascending (oldest date first)
  const [poolPreSiteOnly, setPoolPreSiteOnly] = useState(false)  // show only items in pre-site workflow

  // Inject CSS once
  useEffect(() => {
    if (document.getElementById('planboard-css')) return
    const style = document.createElement('style')
    style.id = 'planboard-css'
    style.textContent = `
      .pb-grid {
        display: grid;
        grid-template-columns: 200px repeat(${DAYS}, ${CELL_W}px);
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        overflow: hidden;
        position: relative;
      }
      .pb-header {
        height: 56px;
        background: #1e293b;
        color: #fff;
        border-right: 1px solid rgba(255,255,255,.1);
        position: sticky; top: 0; z-index: 3;
        display: flex; flex-direction: column; justify-content: center; align-items: center;
      }
      .pb-header.today { background: #2447d8; }
      .pb-header.weekend { background: #334155; }
      .pb-header-label {
        height: 56px;
        background: #0f172a; color: #fff;
        border-right: 2px solid #1e293b;
        position: sticky; left: 0; top: 0; z-index: 5;
        display: flex; align-items: center; justify-content: space-between;
        padding: 0 12px;
      }
      .pb-label {
        min-height: 64px;
        padding: 8px 12px;
        background: #f8fafc;
        border-right: 2px solid #e2e8f0;
        border-top: 1px solid #e2e8f0;
        position: sticky; left: 0; z-index: 2;
        display: flex; align-items: flex-start; gap: 8px;
      }
      .pb-cell {
        min-height: 64px;
        border-right: 1px solid #f1f5f9;
        border-top: 1px solid #e2e8f0;
        position: relative;
        cursor: pointer;
        padding: 3px;
        display: flex; flex-direction: column; gap: 3px;
      }
      .pb-cell:hover { background: rgba(36,71,216,0.04); }
      .pb-cell.today-col { background: rgba(36,71,216,0.05); }
      .pb-cell.weekend { background: #f8fafc; }
      .pb-cell.drag-over { background: rgba(36,71,216,0.18) !important; outline: 2px dashed ${ACE_BLUE}; outline-offset: -3px; }
      .pb-cell.heat-1 { background: linear-gradient(180deg, rgba(16,185,129,.04), rgba(16,185,129,.08)); }
      .pb-cell.heat-2 { background: linear-gradient(180deg, rgba(36,71,216,.05), rgba(36,71,216,.10)); }
      .pb-cell.heat-3 { background: linear-gradient(180deg, rgba(245,158,11,.06), rgba(245,158,11,.12)); }
      .pb-cell.heat-4 { background: linear-gradient(180deg, rgba(199,59,50,.07), rgba(199,59,50,.14)); }
      .pb-pill {
        height: 22px;
        border-radius: 6px;
        padding: 0 6px;
        color: #fff;
        font-size: 10px;
        font-weight: 800;
        display: flex; align-items: center; gap: 4px;
        cursor: pointer;
        box-shadow: 0 1px 4px rgba(15,23,42,.18);
        overflow: hidden;
        user-select: none;
        transition: transform 100ms;
      }
      .pb-pill:hover { transform: translateY(-1px); z-index: 5; }
      .pb-pill.dragging { opacity: .35; }
      .pb-pill.saving { animation: pb-pulse 1s infinite; }
      @keyframes pb-pulse {
        0%,100% { opacity: 1; }
        50% { opacity: .5; }
      }
      .pb-pill.ssv { background: linear-gradient(135deg, #2447d8, #1e40af); }
      .pb-pill.pac { background: linear-gradient(135deg, #7c3aed, #6d28d9); }
      .pb-pill.partial.ssv {
        background:
          repeating-linear-gradient(45deg, transparent 0 6px, rgba(255,255,255,0.2) 6px 8px),
          linear-gradient(135deg, #2447d8, #1e40af);
      }
      .pb-pill.partial.pac {
        background:
          repeating-linear-gradient(45deg, transparent 0 6px, rgba(255,255,255,0.2) 6px 8px),
          linear-gradient(135deg, #7c3aed, #6d28d9);
      }
      .pb-pill.multiday {
        position: absolute;
        left: 3px;
        top: 3px;
        z-index: 2;
      }
      .pb-dur-badge {
        background: rgba(255,255,255,.25);
        padding: 0 4px;
        border-radius: 3px;
        font-size: 9px;
        font-weight: 900;
      }
      .pb-overflow {
        height: 22px;
        border-radius: 6px;
        padding: 0 6px;
        background: rgba(199,59,50,.15);
        border: 1px dashed #c73b32;
        color: #c73b32;
        font-size: 10px;
        font-weight: 900;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
      }
      .pb-now {
        position: absolute;
        top: 0; bottom: 0;
        width: 2px;
        background: #c73b32;
        z-index: 4;
        pointer-events: none;
      }
      .pb-now::before {
        content: 'NOW';
        position: absolute;
        top: 60px; left: 4px;
        background: #c73b32; color: #fff;
        font-size: 9px; font-weight: 900;
        padding: 2px 6px; border-radius: 4px;
      }
      .pb-cell-badge {
        position: absolute;
        top: 2px; right: 4px;
        font-size: 9px; font-weight: 900; color: #64748b;
        pointer-events: none;
      }
      .pb-avatar {
        width: 32px; height: 32px;
        border-radius: 50%;
        color: #fff;
        font-size: 12px; font-weight: 900;
        display: inline-flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .pb-pool-card {
        cursor: grab;
        transition: transform 150ms;
      }
      .pb-pool-card:hover { transform: translateY(-2px); }
      .pb-pool-card.dragging { opacity: 0.4; }
      .pb-chip {
        transition: all 120ms;
        user-select: none;
      }
      .pb-chip:hover { transform: translateY(-1px); }
      .pb-chip.active {
        background: ${ACE_BLUE};
        color: #fff;
        box-shadow: 0 4px 12px rgba(36,71,216,.4);
      }
      .pb-modal-backdrop {
        position: fixed; inset: 0;
        background: rgba(15,23,42,.6);
        backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center;
        z-index: 100;
      }
    `
    document.head.appendChild(style)
  }, [])

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const [empRes, posRes, sitesRes, trackRes] = await Promise.all([
        apiFetch('/api/employees?status=ACTIVE').then(r => r.json()).catch(() => ({ data: [] })),
        apiFetch('/api/project-pos').then(r => r.json()).catch(() => ({ data: [] })),
        apiFetch('/api/sites?referenced_only=true').then(r => r.json()).catch(() => ({ data: [] })),
        apiFetch('/api/presite/tracking').then(r => r.json()).catch(() => ({ data: [] })),
      ])
      const dtes = (empRes.data || []).filter(isPerSiteDte)
      setEmployees(dtes)
      setRawPos(posRes.data || [])
      // Build site code → coordinate lookup for the map + sort metadata
      const coords = {}
      ;(sitesRes.data || []).forEach(s => {
        if (!s.site_code) return
        coords[String(s.site_code).toUpperCase()] = {
          lat: s.lat != null ? Number(s.lat) : null,
          lng: s.lng != null ? Number(s.lng) : null,
          name: s.site_name || s.site_code,
          fullOnAir: s.full_on_air || null,
          clusterReady: s.cluster_ready || null,
          rfClusterName: s.rf_cluster_name || null,
        }
      })
      setSiteCoords(coords)
      // Build tracking map — keyed by site_code (SSV) or cluster_key (PAC), uppercase
      const tmap = {}
      ;(trackRes.data || []).forEach(t => {
        const key = String((t.work_type === 'PAC' ? (t.cluster_key || t.site_code) : t.site_code) || '').toUpperCase()
        if (!key) return
        tmap[key] = {
          stage: t.current_stage,
          dte: t.assigned_dte_code,
          dteName: t.assigned_dte_name,
          fullOnAirAt: t.full_onair_at ? t.full_onair_at.slice(0, 10) : null,
          clusterReadyAt: t.cluster_ready_at ? t.cluster_ready_at.slice(0, 10) : null,
          slaBreached: !!t.sla_breached,
          workType: t.work_type,
        }
      })
      setTrackingMap(tmap)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  // Assign each DTE a stable color
  const dteList = useMemo(() => employees.map((e, i) => ({
    code: e.employee_code,
    name: e.full_name || e.employee_code,
    short: (e.full_name || e.employee_code).split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase().slice(0, 2),
    palette: DTE_PALETTE[i % DTE_PALETTE.length],
    baseLat: e.base_lat,
    baseLng: e.base_lng,
  })), [employees])

  // Sites = project_pos rows we care about (SSV + PAC).
  // Synthesise startDay (offset from today) from planned_start_date.
  const allSites = useMemo(() => {
    return (rawPos || [])
      .filter(p => p.work_type === 'SSV' || p.work_type === 'PAC')
      .map(p => {
        let startDay = null
        if (p.planned_start_date) {
          const d = parseIso(p.planned_start_date)
          if (d) startDay = dayDiff(d, today)
        }
        // Match tracking row by site_code (SSV) or cluster_site (PAC)
        const trackKey = String(
          (p.work_type === 'PAC' ? (p.cluster_site || p.site_code) : p.site_code) || ''
        ).toUpperCase()
        const track = trackKey ? trackingMap[trackKey] : null
        // Resolve RF Cluster Name (ISDP Col I) for PAC: cluster_site (full) → siteCoords
        const rfClusterName = p.work_type === 'PAC'
          ? (siteCoords[String(p.cluster_site || '').toUpperCase()]?.rfClusterName || null)
          : null
        return {
          id: p.id,
          code: p.site_code || p.cluster_site || `PO-${p.id}`,
          name: p.cluster_site || p.item_dis || '',
          rfClusterName,
          type: p.work_type,
          dte: p.planned_dte_codes ? String(p.planned_dte_codes).split(',')[0].trim() : null,
          startDay,
          dur: p.planned_duration_days != null ? Number(p.planned_duration_days) : defaultDurationFor(p.work_type),
          clusterSite: p.cluster_site,
          workflowStatus: p.workflow_status,
          // Pre-Site tracking enrichment (optional — null if PO not in workflow yet)
          preSiteStage: track?.stage || null,
          preSiteDte: track?.dte || null,
          preSiteFullOnAirAt: track?.fullOnAirAt || null,
          preSiteClusterReadyAt: track?.clusterReadyAt || null,
          preSiteSlaBreached: track?.slaBreached || false,
        }
      })
      .filter(s => activeTypes.has(s.type))
  }, [rawPos, activeTypes, today, trackingMap, siteCoords])

  // Sites in pool = no DTE OR no start date OR start in past (we treat past as unscheduled)
  const poolSites = useMemo(
    () => allSites.filter(s => !s.dte || s.startDay == null || s.startDay < 0 || s.startDay > 30),
    [allSites]
  )
  // Scheduled = SSV per-PO; PAC grouped into 1 bar per (cluster, dte, startDay)
  // so a whole cluster scheduled together shows as ONE Gantt bar (not N).
  const scheduledSites = useMemo(() => {
    const sched = allSites.filter(s => s.dte && s.startDay != null && s.startDay >= 0 && s.startDay <= 30)
    const entries = []
    const map = new Map()
    sched.forEach(s => {
      if (s.type === 'PAC' && s.rfClusterName) {
        const key = `C:${s.rfClusterName}@${s.dte}@${s.startDay}`
        let e = map.get(key)
        if (!e) {
          e = { ...s, id: key, code: s.rfClusterName, name: s.rfClusterName, childIds: [], childCount: 0 }
          map.set(key, e)
          entries.push(e)
        }
        e.childIds.push(s.id)
        e.childCount += 1
      } else {
        entries.push({ ...s, childIds: [s.id], childCount: 1 })
      }
    })
    return entries
  }, [allSites])

  // Filtered + sorted pool for the sidebar.
  // - filter: by search text (code/name) + type toggle
  // - sort: SSV by sites.full_on_air, PAC by sites.cluster_ready
  //   (sites without a date go to the END regardless of asc/desc)
  const filteredPoolSites = useMemo(() => {
    const q = poolSearch.trim().toLowerCase()
    const filtered = poolSites.filter(s => {
      if (!poolTypes.has(s.type)) return false
      if (poolPreSiteOnly && !s.preSiteStage) return false
      if (!q) return true
      const code = String(s.code || '').toLowerCase()
      const name = String(s.name || '').toLowerCase()
      const cluster = String(s.clusterSite || '').toLowerCase()
      const rfCluster = String(s.rfClusterName || '').toLowerCase()
      return code.includes(q) || name.includes(q) || cluster.includes(q) || rfCluster.includes(q)
    })
    // Sort: SSV → full_on_air (tracking preferred over site table), PAC → cluster_ready
    const dateKey = s => {
      if (s.type === 'PAC') {
        return s.preSiteClusterReadyAt || (siteCoords[String(s.code).toUpperCase()]?.clusterReady) || null
      }
      return s.preSiteFullOnAirAt || (siteCoords[String(s.code).toUpperCase()]?.fullOnAir) || null
    }
    filtered.sort((a, b) => {
      const da = dateKey(a)
      const db = dateKey(b)
      // sites without a date go last (regardless of direction)
      if (!da && !db) return String(a.code).localeCompare(String(b.code))
      if (!da) return 1
      if (!db) return -1
      const cmp = da.localeCompare(db)  // YYYY-MM-DD strings sort correctly
      return poolSortDesc ? -cmp : cmp
    })
    return filtered
  }, [poolSites, poolSearch, poolTypes, siteCoords, poolSortDesc, poolPreSiteOnly])

  // Pool ENTRIES — SSV stays 1 card per PO; PAC groups into 1 card per RF Cluster
  // Name (e.g. EAS-FLASH-0012 = 1 card representing its N child POs). Preserves
  // the sorted order from filteredPoolSites.
  const poolEntries = useMemo(() => {
    const entries = []
    const clusterMap = new Map()
    filteredPoolSites.forEach(s => {
      const groupable = s.type === 'PAC' && s.rfClusterName
      if (groupable) {
        const key = `C:${s.rfClusterName}`
        let e = clusterMap.get(key)
        if (!e) {
          e = {
            id: key, type: 'PAC', code: s.rfClusterName, rfClusterName: s.rfClusterName,
            name: s.rfClusterName, clusterSite: s.rfClusterName,
            childIds: [], childCount: 0, dur: s.dur, dte: null, startDay: null,
            preSiteStage: s.preSiteStage, preSiteSlaBreached: s.preSiteSlaBreached,
            preSiteClusterReadyAt: s.preSiteClusterReadyAt, preSiteDte: s.preSiteDte,
            clusterReadyDate: s.preSiteClusterReadyAt || siteCoords[String(s.code).toUpperCase()]?.clusterReady || null,
          }
          clusterMap.set(key, e)
          entries.push(e)
        }
        e.childIds.push(s.id)
        e.childCount += 1
      } else {
        entries.push({ ...s, childIds: [s.id], childCount: 1 })
      }
    })
    return entries
  }, [filteredPoolSites, siteCoords])

  // ── Save plan via API ─────────────────────────────────────────────────
  const savePlan = useCallback(async (site, { dteCode, startDay, dur }) => {
    setSavingIds(prev => new Set(prev).add(site.id))
    try {
      const dteObj = dteList.find(d => d.code === dteCode)
      const startDate = startDay != null ? fmtIso(addDays(today, startDay)) : null
      const body = {
        planned_dte_codes: dteCode || null,
        planned_dte_names: dteObj ? dteObj.name : (site.dte && !dteCode ? null : (dteCode || null)),
        planned_start_date: startDate,
        planned_end_date: null,  // let backend compute from duration
        planned_duration_days: dur != null ? dur : site.dur,
      }
      const res = await apiFetch(`/api/project-pos/${site.id}/plan`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `HTTP ${res.status}`)
      }
      showToast(`✓ ${site.code} saved`, 'success')
      await reload()
    } catch (err) {
      showToast(`✗ Save failed: ${err.message || 'network'}`, 'error')
    } finally {
      setSavingIds(prev => {
        const next = new Set(prev)
        next.delete(site.id)
        return next
      })
    }
  }, [dteList, today, reload])

  // Schedule a pool ENTRY (SSV = 1 PO; PAC = whole cluster = N child POs).
  // Applies the same DTE + start + duration to every child PO, one reload at the end.
  const schedulePlan = useCallback(async (entry, { dteCode, startDay, dur }) => {
    const ids = (entry.childIds && entry.childIds.length) ? entry.childIds : [entry.id].filter(v => typeof v === 'number')
    if (!ids.length) return
    setSavingIds(prev => { const n = new Set(prev); ids.forEach(i => n.add(i)); return n })
    const dteObj = dteList.find(d => d.code === dteCode)
    const startDate = startDay != null ? fmtIso(addDays(today, startDay)) : null
    let ok = 0, fail = 0
    for (const id of ids) {
      try {
        const res = await apiFetch(`/api/project-pos/${id}/plan`, {
          method: 'PATCH',
          body: JSON.stringify({
            planned_dte_codes: dteCode || null,
            planned_dte_names: dteObj ? dteObj.name : null,
            planned_start_date: startDate,
            planned_end_date: null,
            planned_duration_days: dur != null ? dur : entry.dur,
          }),
        })
        if (!res.ok) throw new Error()
        ok++
      } catch { fail++ }
    }
    const label = ids.length > 1 ? `${entry.code} (${ids.length} PO)` : entry.code
    showToast(fail ? `⚠ ${entry.code}: ${ok} ok · ${fail} failed` : `✓ ${label} saved`, fail ? 'error' : 'success')
    await reload()
    setSavingIds(prev => { const n = new Set(prev); ids.forEach(i => n.delete(i)); return n })
  }, [dteList, today, reload])

  // ── Drag & Drop ──────────────────────────────────────────────────────
  const handleCellDrop = useCallback((e, dteCode, dayOffset) => {
    e.preventDefault()
    const raw = e.dataTransfer.getData('text/plain')
    if (!raw) return
    // Resolve to a schedulable target with childIds + dur + code.
    // Pool drag → pool entry (cluster 'C:...' or SSV po id).
    // Gantt pill drag (move) → scheduled entry ('C:...@dte@day' or po id).
    let target = poolEntries.find(en => String(en.id) === raw)
      || scheduledSites.find(en => String(en.id) === raw)
    if (!target) {
      const id = parseInt(raw, 10)
      const site = allSites.find(s => s.id === id)
      if (!site) return
      target = { id, code: site.code, dur: site.dur, childIds: [id] }
    }
    if (dayOffset > MAX_FUTURE_DAYS) {
      showToast(`✗ เกิน ${MAX_FUTURE_DAYS} วัน`, 'error')
      return
    }
    if (dayOffset + Math.ceil(target.dur) - 1 > MAX_FUTURE_DAYS) {
      showToast(`✗ Duration ${target.dur}d จะเกิน ${MAX_FUTURE_DAYS} วัน — ลด duration ก่อน`, 'error')
      return
    }
    schedulePlan(target, { dteCode, startDay: dayOffset, dur: target.dur })
  }, [poolEntries, scheduledSites, allSites, schedulePlan])

  // ── Render days/header ────────────────────────────────────────────────
  const days = useMemo(() => {
    const out = []
    for (let i = 0; i < DAYS; i++) {
      const d = addDays(today, i)
      out.push({
        offset: i,
        date: d,
        iso: fmtIso(d),
        isToday: i === 0,
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      })
    }
    return out
  }, [today])

  // Stats
  const stats = useMemo(() => {
    const totalDays = scheduledSites.reduce((a, s) => a + (s.dur || 0), 0)
    let heavy = 0
    dteList.forEach(d => {
      for (let i = 0; i < DAYS; i++) {
        const n = scheduledSites.filter(s => s.dte === d.code && siteOccupiesDay(s, i)).length
        if (n >= 3) heavy++
      }
    })
    return {
      pool: poolSites.length,
      sched: scheduledSites.length,
      totalDays: totalDays.toFixed(1),
      heavy,
    }
  }, [scheduledSites, poolSites, dteList])

  if (loading && rawPos.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow">
        <div className="text-sm font-bold text-slate-500">Loading Plan Board…</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-black text-indigo-700">
            <CalendarRange size={14} />
            Plan Board · Multi-Stack Gantt + Duration
          </div>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Plan DTE — {DAYS} day window
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Drag pool → cell · Click bar → set duration (0.3-7 day) · Max +{MAX_FUTURE_DAYS} days ahead
          </p>
        </div>
        <button
          onClick={reload}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-50"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 shadow">
        <span className="text-[.62rem] font-black uppercase tracking-wider text-slate-500">Type:</span>
        <button
          onClick={() => setActiveTypes(prev => {
            const n = new Set(prev)
            if (n.has('SSV')) n.delete('SSV'); else n.add('SSV')
            return n
          })}
          className={`rounded-lg px-3 py-1.5 text-xs font-black text-white ${activeTypes.has('SSV') ? 'bg-blue-600' : 'bg-blue-600/40'}`}
        >● SSV</button>
        <button
          onClick={() => setActiveTypes(prev => {
            const n = new Set(prev)
            if (n.has('PAC')) n.delete('PAC'); else n.add('PAC')
            return n
          })}
          className={`rounded-lg px-3 py-1.5 text-xs font-black text-white ${activeTypes.has('PAC') ? 'bg-purple-600' : 'bg-purple-600/40'}`}
        >● PAC</button>
        <span className="h-6 w-px bg-slate-200 mx-1"></span>
        <span className="text-[.62rem] font-black uppercase tracking-wider text-slate-500">Heat:</span>
        {[
          ['linear-gradient(180deg, rgba(16,185,129,.4), rgba(16,185,129,.7))', '1'],
          ['linear-gradient(180deg, rgba(36,71,216,.4), rgba(36,71,216,.7))', '2'],
          ['linear-gradient(180deg, rgba(245,158,11,.5), rgba(245,158,11,.85))', '3'],
          ['linear-gradient(180deg, rgba(199,59,50,.5), rgba(199,59,50,.85))', '4+'],
        ].map(([bg, label]) => (
          <span key={label} className="inline-flex items-center gap-1 text-[.62rem] font-bold text-slate-600">
            <span style={{ display: 'inline-block', width: 18, height: 12, borderRadius: 3, background: bg, border: '1px solid #e2e8f0' }} />{label}
          </span>
        ))}
        <span className="h-6 w-px bg-slate-200 mx-1"></span>
        <div className="flex items-center gap-4 text-xs font-bold">
          <span className="text-amber-700">⚠ {stats.pool} pool</span>
          <span className="text-blue-700">📅 {stats.sched} scheduled</span>
          <span className="text-emerald-700">⏱ {stats.totalDays} total days</span>
          {stats.heavy > 0 && <span className="text-red-700">🚨 {stats.heavy} heavy days</span>}
        </div>
        <div className="ml-auto text-[.62rem] font-bold text-slate-500">
          💡 Drag → cell · Click bar to set duration
        </div>
      </div>

      {/* Workload heatmap — moved to TOP for quick overview */}
      <WorkloadHeatmap dteList={dteList} scheduledSites={scheduledSites} days={days} />

      {/* Main: Gantt + Pool */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        <div style={{ overflow: 'auto', maxHeight: '78vh' }} className="rounded-2xl">
          <div className="pb-grid">
            {/* Header */}
            <div className="pb-header-label">
              <span className="text-[.62rem] font-black uppercase tracking-wider">DTE Engineer</span>
              <span className="text-[.55rem] font-bold opacity-70">{DAYS} days →</span>
            </div>
            {days.map(d => (
              <div key={d.offset} className={`pb-header ${d.isToday ? 'today' : d.isWeekend ? 'weekend' : ''}`}>
                <div className="text-[.55rem] font-black uppercase opacity-80">
                  {d.isToday ? 'TODAY' : d.date.toLocaleDateString('en-GB', { weekday: 'short' })}
                </div>
                <div className="text-xs font-black">{fmtDateShort(d.date)}</div>
              </div>
            ))}

            {/* Rows per DTE */}
            {dteList.map(dte => {
              const sites = scheduledSites.filter(s => s.dte === dte.code)
              const totalDur = sites.reduce((a, s) => a + (s.dur || 0), 0)
              let peak = 0
              for (let i = 0; i < DAYS; i++) {
                const n = sites.filter(s => siteOccupiesDay(s, i)).length
                if (n > peak) peak = n
              }
              return (
                <React.Fragment key={dte.code}>
                  <div className="pb-label">
                    <span className="pb-avatar" style={{ background: dte.palette.bg }}>{dte.short}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-slate-900 truncate">{dte.name}</div>
                      <div className="text-[.55rem] font-bold text-slate-400 font-mono">{dte.code}</div>
                      <div className="mt-1 text-[.6rem] font-black text-slate-600">
                        {sites.length} sites · {totalDur.toFixed(1)}d
                        {peak > 1 && ` · peak ${peak}/d`}
                      </div>
                    </div>
                  </div>
                  {days.map(d => (
                    <GanttCell
                      key={`${dte.code}-${d.offset}`}
                      dte={dte}
                      day={d}
                      sites={sites}
                      savingIds={savingIds}
                      onDrop={(e) => handleCellDrop(e, dte.code, d.offset)}
                      onPillClick={(site) => setEditingSite(site)}
                      onOverflowClick={(items) => {/* expand modal */ setEditingSite({ __expand: true, items, dte, day: d.offset })}}
                      onPillDragStart={(siteId) => setDraggingScheduledId(siteId)}
                      onPillDragEnd={() => { setDraggingScheduledId(null); setPoolDropOver(false) }}
                    />
                  ))}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* Pool sidebar — also a drop target: dropping a scheduled bar here = ↩ Unschedule */}
        <aside
          className={`rounded-2xl border-2 p-4 shadow self-start transition ${
            poolDropOver
              ? 'border-red-400 bg-red-50 ring-4 ring-red-200'
              : draggingScheduledId
                ? 'border-red-300 border-dashed bg-amber-50'
                : 'border-amber-200 bg-amber-50'
          }`}
          onDragOver={(e) => {
            if (!draggingScheduledId) return
            e.preventDefault()
            e.dataTransfer.dropEffect = 'move'
            setPoolDropOver(true)
          }}
          onDragLeave={() => setPoolDropOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setPoolDropOver(false)
            const raw = e.dataTransfer.getData('text/plain')
            if (!raw) return
            // Resolve a scheduled entry (cluster 'C:...@dte@day' or single po id).
            let target = scheduledSites.find(en => String(en.id) === raw)
            if (!target) {
              const id = parseInt(raw, 10)
              const site = allSites.find(s => s.id === id)
              if (!site) return
              target = { ...site, childIds: [site.id] }
            }
            // Only unschedule if it was actually scheduled (avoid no-op on pool-to-pool drag)
            if (target.dte != null && target.startDay != null) {
              schedulePlan(target, { dteCode: null, startDay: null, dur: target.dur })
            }
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-amber-800">
              {draggingScheduledId ? '↩ Drop = Unschedule' : '⚠ Pool'}
            </h3>
            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[.62rem] font-black text-amber-800">
              {poolEntries.length} item{poolEntries.length !== poolSites.length ? ` · ${poolSites.length} PO` : ''}
            </span>
          </div>

          {/* Search */}
          <input
            type="text"
            value={poolSearch}
            onChange={(e) => setPoolSearch(e.target.value)}
            placeholder="🔍 Search site code / name"
            className="w-full mb-2 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
          />

          {/* Type toggles */}
          <div className="mb-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => setPoolTypes(prev => {
                const n = new Set(prev)
                if (n.has('SSV')) n.delete('SSV'); else n.add('SSV')
                if (n.size === 0) n.add('SSV').add('PAC')  // never empty
                return n
              })}
              className={`flex-1 rounded-lg px-2 py-1 text-[.62rem] font-black text-white transition ${poolTypes.has('SSV') ? 'bg-blue-600' : 'bg-slate-300'}`}
            >SSV</button>
            <button
              type="button"
              onClick={() => setPoolTypes(prev => {
                const n = new Set(prev)
                if (n.has('PAC')) n.delete('PAC'); else n.add('PAC')
                if (n.size === 0) n.add('SSV').add('PAC')
                return n
              })}
              className={`flex-1 rounded-lg px-2 py-1 text-[.62rem] font-black text-white transition ${poolTypes.has('PAC') ? 'bg-purple-600' : 'bg-slate-300'}`}
            >PAC</button>
            <button
              type="button"
              onClick={() => setPoolSortDesc(!poolSortDesc)}
              title={poolSortDesc ? 'Newest first — click for oldest' : 'Oldest first — click for newest'}
              className="rounded-lg px-2 py-1 text-[.62rem] font-black bg-white border border-amber-200 text-amber-800 hover:bg-amber-100"
            >{poolSortDesc ? '↓ New' : '↑ Old'}</button>
          </div>

          {/* Pre-Site only toggle */}
          <button
            type="button"
            onClick={() => setPoolPreSiteOnly(v => !v)}
            className={`mb-2 w-full rounded-lg px-2 py-1.5 text-[.62rem] font-black transition ${
              poolPreSiteOnly
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50'
            }`}
            title="Show only items in Pre-Site workflow (have a tracking record)"
          >
            {poolPreSiteOnly ? '✓ Pre-Site Only' : '☐ Pre-Site Only'}
          </button>

          <p className="mb-3 text-[.6rem] font-bold text-amber-700/80">
            {draggingScheduledId
              ? '🎯 ปล่อยที่นี่เพื่อ Unschedule'
              : 'Sort: SSV→Full On-Air · PAC→Cluster Ready'}
          </p>

          {poolEntries.length === 0 ? (
            <div className="text-center text-xs font-bold text-amber-400 py-8">
              {poolSites.length === 0 ? '✓ All scheduled' : '— no match —'}
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {poolEntries.map(s => {
                const isCluster = s.type === 'PAC'
                const coord = siteCoords[String(s.code).toUpperCase()]
                // Prefer tracking dates (live) over project_site dates (RF master)
                const sortDate = isCluster
                  ? (s.clusterReadyDate || s.preSiteClusterReadyAt || coord?.clusterReady)
                  : (s.preSiteFullOnAirAt || coord?.fullOnAir)
                const sortLabel = isCluster ? 'Cluster Ready' : 'Full On-Air'
                const stage = s.preSiteStage ? stageBadge(s.preSiteStage) : null
                return (
                  <div
                    key={s.id}
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(s.id)); e.currentTarget.classList.add('dragging') }}
                    onDragEnd={(e) => e.currentTarget.classList.remove('dragging')}
                    onClick={() => setEditingSite(s)}
                    className={`pb-pool-card rounded-xl border-l-4 ${s.type === 'SSV' ? 'border-blue-500 bg-white' : 'border-purple-500 bg-purple-50'} p-3 shadow-sm`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className={`truncate font-black text-slate-900 ${isCluster ? 'text-xs text-purple-800' : 'font-mono text-xs'}`}>
                          {isCluster ? `⬡ ${s.code}` : s.code}
                        </div>
                        <div className="text-[.62rem] font-bold text-slate-500 truncate">
                          {isCluster ? `${s.childCount} PO · ${s.childCount} sites` : (s.name || '—')}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[.55rem] font-black px-1.5 py-0.5 rounded ${s.type === 'SSV' ? 'text-blue-700 bg-blue-100' : 'text-purple-700 bg-purple-100'}`}>
                          {isCluster ? `PAC · ${s.childCount}` : s.type}
                        </span>
                        {stage && (
                          <span
                            className="text-[.55rem] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5"
                            style={{ color: stage.color, background: stage.bg }}
                            title={`Pre-Site stage: ${stage.label}${s.preSiteSlaBreached ? ' (SLA breached!)' : ''}`}
                          >
                            {s.preSiteSlaBreached && '🚨'}
                            {stage.label}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-1.5 text-[.58rem] font-bold text-slate-500 flex items-center gap-1">
                      <span className="text-slate-400">{sortLabel}:</span>
                      <span className={sortDate ? 'text-slate-800' : 'text-slate-300'}>{sortDate || '—'}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[.6rem] font-bold">
                      <span className="text-slate-400">{s.dte ? `→ ${s.dte}` : (s.preSiteDte ? `(track: ${s.preSiteDte})` : 'no DTE')}</span>
                      <span className="text-slate-700">⏱ {fmtDuration(s.dur)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </aside>
      </div>

      {/* Geo Map — DTE home bases + sites colored by assignment */}
      <PlanMap
        dteList={dteList}
        scheduledSites={scheduledSites}
        poolSites={poolSites}
        siteCoords={siteCoords}
      />

      {/* Edit Modal */}
      {editingSite && !editingSite.__expand && (
        <DurationModal
          site={editingSite}
          today={today}
          dteList={dteList}
          onClose={() => setEditingSite(null)}
          onSave={async ({ dteCode, startDay, dur }) => {
            await schedulePlan(editingSite, { dteCode, startDay, dur })
            setEditingSite(null)
          }}
          onUnschedule={async () => {
            await schedulePlan(editingSite, { dteCode: null, startDay: null, dur: editingSite.dur })
            setEditingSite(null)
          }}
        />
      )}
      {editingSite && editingSite.__expand && (
        <ExpandModal
          items={editingSite.items}
          dte={editingSite.dte}
          dayOffset={editingSite.day}
          today={today}
          onClose={() => setEditingSite(null)}
          onEditSite={(s) => setEditingSite(s)}
        />
      )}
    </div>
  )
}

// ── Gantt cell with stack of pills + drag/drop ───────────────────────────
function GanttCell({ dte, day, sites, savingIds, onDrop, onPillClick, onOverflowClick, onPillDragStart, onPillDragEnd }) {
  const [dragOver, setDragOver] = useState(false)
  const occupying = sites.filter(s => siteOccupiesDay(s, day.offset))
  const starts = sites.filter(s => s.startDay === day.offset)
  const visible = starts.slice(0, MAX_STACK)
  const overflow = starts.length - visible.length
  let cls = 'pb-cell'
  if (day.isToday) cls += ' today-col'
  if (day.isWeekend) cls += ' weekend'
  cls += ' ' + heatClassForCount(occupying.length)
  if (dragOver) cls += ' drag-over'

  return (
    <div
      className={cls}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { setDragOver(false); onDrop(e) }}
    >
      {occupying.length > 0 && <span className="pb-cell-badge">{occupying.length}</span>}
      {visible.map(s => {
        const isPartial = s.dur < 1
        const isMultiDay = s.dur > 1
        const isSaving = savingIds.has(s.id)
        const handleClick = (e) => { e.stopPropagation(); if (!isSaving) onPillClick(s) }
        const handleDragStart = (e) => {
          e.dataTransfer.setData('text/plain', String(s.id))
          e.dataTransfer.effectAllowed = 'move'
          e.currentTarget.classList.add('dragging')
          onPillDragStart?.(s.id)
        }
        const handleDragEnd = (e) => {
          e.currentTarget.classList.remove('dragging')
          onPillDragEnd?.()
        }

        // Rich multi-line tooltip — combines plan + pre-site track info.
        // The browser native `title` attribute keeps it accessible and works on touch.
        const planDate = s.startDay != null
          ? new Date(Date.now() + (s.startDay) * 86400000).toISOString().slice(0, 10)  // approximate
          : null
        const tooltipLines = [
          `${s.code}${s.name ? ` — ${s.name}` : ''}`,
          `Type: ${s.type}  ·  Duration: ${fmtDuration(s.dur)}`,
        ]
        if (s.type === 'PAC' && s.preSiteClusterReadyAt) tooltipLines.push(`Cluster Ready: ${s.preSiteClusterReadyAt}`)
        if (s.type === 'SSV' && s.preSiteFullOnAirAt)    tooltipLines.push(`Full On-Air: ${s.preSiteFullOnAirAt}`)
        if (s.preSiteStage)  tooltipLines.push(`Pre-Site Stage: ${stageBadge(s.preSiteStage).label}${s.preSiteSlaBreached ? '  🚨 SLA BREACHED' : ''}`)
        if (s.dte)           tooltipLines.push(`DTE: ${s.dte}`)
        const richTooltip = tooltipLines.join('\n')

        // Tiny stage dot (visible without hovering) — shows pre-site workflow stage
        const stageDot = s.preSiteStage ? (
          <span
            className="inline-block rounded-full"
            style={{ width: 6, height: 6, background: stageBadge(s.preSiteStage).color, flexShrink: 0 }}
          />
        ) : null

        if (isMultiDay) {
          const cells = Math.ceil(s.dur)
          const width = cells * CELL_W - 6
          return (
            <div
              key={s.id}
              draggable={!isSaving}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onClick={handleClick}
              className={`pb-pill multiday ${s.type.toLowerCase()} ${isSaving ? 'saving' : ''}`}
              style={{ width }}
              title={richTooltip}
            >
              {stageDot}
              <span className="truncate flex-1">{s.code}</span>
              <span className="pb-dur-badge">{fmtDuration(s.dur)}</span>
            </div>
          )
        } else if (isPartial) {
          const w = Math.max(28, (CELL_W - 6) * s.dur)
          return (
            <div
              key={s.id}
              draggable={!isSaving}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onClick={handleClick}
              className={`pb-pill partial ${s.type.toLowerCase()} ${isSaving ? 'saving' : ''}`}
              style={{ width: w }}
              title={richTooltip}
            >
              {stageDot}
              <span className="truncate flex-1">{s.code}</span>
              <span className="pb-dur-badge">{fmtDuration(s.dur)}</span>
            </div>
          )
        } else {
          return (
            <div
              key={s.id}
              draggable={!isSaving}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onClick={handleClick}
              className={`pb-pill ${s.type.toLowerCase()} ${isSaving ? 'saving' : ''}`}
              title={richTooltip}
            >
              {stageDot}
              <span className="truncate flex-1">{s.code}</span>
              <span className="pb-dur-badge">1d</span>
            </div>
          )
        }
      })}
      {overflow > 0 && (
        <div
          className="pb-overflow"
          onClick={(e) => { e.stopPropagation(); onOverflowClick(starts) }}
        >+{overflow} more</div>
      )}
    </div>
  )
}

// ── Duration Picker Modal ─────────────────────────────────────────────────
function DurationModal({ site, today, dteList, onClose, onSave, onUnschedule }) {
  const [dur, setDur] = useState(site.dur || 1)
  const [dteCode, setDteCode] = useState(site.dte || '')
  const [startDay, setStartDay] = useState(site.startDay)
  const isScheduled = site.startDay != null && site.dte
  const dteObj = dteList.find(d => d.code === dteCode)
  const start = startDay != null ? addDays(today, startDay) : null
  const end = start ? addDays(start, Math.max(0, Math.ceil(dur) - 1)) : null
  const maxIso = fmtIso(addDays(today, MAX_FUTURE_DAYS))
  const todayIso = fmtIso(today)

  const setStartFromIso = (iso) => {
    if (!iso) { setStartDay(null); return }
    const d = parseIso(iso)
    setStartDay(dayDiff(d, today))
  }

  return (
    <div className="pb-modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[.6rem] font-black uppercase tracking-widest text-slate-500">⏱ Plan + Duration</div>
            <div className="mt-1 flex items-center gap-2">
              <span className={`text-[.55rem] font-black px-1.5 py-0.5 rounded ${site.type === 'SSV' ? 'text-blue-700 bg-blue-100' : 'text-purple-700 bg-purple-100'}`}>{site.type}</span>
              <span className="text-base font-black text-slate-900 font-mono">{site.code}</span>
            </div>
            <div className="text-xs font-bold text-slate-500">{site.name || '—'}</div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl font-black"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* DTE selector */}
          <div>
            <label className="text-[.6rem] font-black uppercase tracking-wider text-slate-500 block mb-1.5">DTE</label>
            <select
              value={dteCode}
              onChange={(e) => setDteCode(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900"
            >
              <option value="">— Select DTE —</option>
              {dteList.map(d => (
                <option key={d.code} value={d.code}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="text-[.6rem] font-black uppercase tracking-wider text-slate-500 block mb-1.5">Start Date</label>
            <input
              type="date"
              min={todayIso}
              max={maxIso}
              value={startDay != null ? fmtIso(addDays(today, startDay)) : ''}
              onChange={(e) => setStartFromIso(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900"
            />
            <div className="mt-1 text-[.6rem] font-bold text-slate-500">Max +{MAX_FUTURE_DAYS} days from today</div>
          </div>

          {/* Duration chips */}
          <div>
            <label className="text-[.6rem] font-black uppercase tracking-wider text-slate-500 block mb-2">Quick presets (วัน)</label>
            <div className="grid grid-cols-4 gap-2">
              {QUICK_DURATIONS.map(q => (
                <button
                  key={q.val}
                  type="button"
                  onClick={() => setDur(q.val)}
                  className={`pb-chip rounded-lg border border-slate-200 px-2 py-2 text-center ${dur === q.val ? 'active' : 'bg-slate-50'}`}
                >
                  <div className={`text-xs font-black ${dur === q.val ? '' : 'text-slate-700'}`}>{q.label}</div>
                  <div className={`text-[.55rem] font-bold ${dur === q.val ? 'text-white/80' : 'text-slate-500'}`}>{q.hint}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom */}
          <div>
            <label className="text-[.6rem] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
              Custom ({DURATION_MIN} - {DURATION_MAX} step 0.1)
            </label>
            <input
              type="number"
              min={DURATION_MIN}
              max={DURATION_MAX}
              step={0.1}
              value={dur}
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                if (!isNaN(v)) setDur(Math.round(v * 10) / 10)
              }}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900"
            />
            <div className="mt-1 text-[.6rem] font-bold text-slate-500">
              Equivalent: <span className="font-black text-slate-700">{(dur * 8).toFixed(1)} ชม.</span> (สมมติ 8 ชม./วัน)
            </div>
          </div>

          {/* Preview */}
          {dteObj && start && (
            <div className="rounded-xl bg-slate-50 p-3 flex items-center gap-3 border border-slate-200">
              <span className="pb-avatar" style={{ background: dteObj.palette.bg }}>{dteObj.short}</span>
              <div>
                <div className="text-xs font-black text-slate-900">{dteObj.name}</div>
                <div className="text-[.6rem] font-bold text-slate-500">
                  {fmtDateShort(start)} → {fmtDateShort(end)} · ⏱ {fmtDuration(dur)}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-[.65rem] font-bold text-blue-800">
            💡 <b>Partial day (&lt;1d)</b> = ลายเฉียง — quick visit, integration check<br />
            💡 <b>Full day(s)</b> = แถบทึบ — DT scan, troubleshooting, PAC cluster
          </div>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex flex-wrap gap-2 justify-end">
          <button onClick={onClose} className="rounded-lg border border-slate-200 bg-white text-slate-700 px-4 py-2 text-xs font-black">Cancel</button>
          {isScheduled && (
            <button onClick={onUnschedule} className="rounded-lg border border-slate-200 bg-white text-amber-700 px-4 py-2 text-xs font-black">↩ Unschedule</button>
          )}
          <button
            onClick={() => onSave({ dteCode: dteCode || null, startDay, dur })}
            disabled={!dteCode || startDay == null}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 text-white px-4 py-2 text-xs font-black"
          >Save Plan</button>
        </div>
      </div>
    </div>
  )
}

// ── Expand modal ("+N more" cell drill-down) ─────────────────────────────
function ExpandModal({ items, dte, dayOffset, today, onClose, onEditSite }) {
  const date = addDays(today, dayOffset)
  return (
    <div className="pb-modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[.6rem] font-black uppercase tracking-widest text-slate-500">Cell Detail</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="pb-avatar" style={{ background: dte.palette.bg, width: 28, height: 28, fontSize: 11 }}>{dte.short}</span>
              <span className="text-base font-black text-slate-900">{dte.name} · {fmtDateShort(date)}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-2">
          {items.map(s => (
            <div key={s.id} className={`rounded-xl border-l-4 ${s.type === 'SSV' ? 'border-blue-500 bg-blue-50' : 'border-purple-500 bg-purple-50'} p-3`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-mono text-sm font-black text-slate-900">{s.code}</div>
                  <div className="text-xs font-bold text-slate-600">{s.name || '—'}</div>
                  <div className="mt-1 text-[.6rem] font-bold text-slate-400">
                    {fmtDateShort(addDays(today, s.startDay))} · ⏱ {fmtDuration(s.dur)}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[.55rem] font-black px-1.5 py-0.5 rounded ${s.type === 'SSV' ? 'text-blue-700 bg-blue-100' : 'text-purple-700 bg-purple-100'}`}>{s.type}</span>
                  <button
                    onClick={() => onEditSite(s)}
                    className="text-[.6rem] font-black text-indigo-600 hover:underline"
                  >edit ⏱</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 rounded-b-2xl text-[.62rem] font-bold text-slate-500">
          {items.length} sites · {items.length >= 4 ? '🔴 Overload' : items.length >= 3 ? '🟡 Heavy' : '🟢 Manageable'}
        </div>
      </div>
    </div>
  )
}

// ── Workload Heatmap ──────────────────────────────────────────────────────
function WorkloadHeatmap({ dteList, scheduledSites, days }) {
  if (dteList.length === 0) return null
  return (
    <div className="rounded-2xl bg-white p-5 shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">📊 DTE Workload · Day-load per Day</h3>
        <div className="flex items-center gap-2 text-[.6rem] font-bold text-slate-500">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-4 rounded bg-emerald-500" />0-1d
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-4 rounded bg-blue-600" />1-2d
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-4 rounded bg-amber-500" />2-3d
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-4 rounded bg-red-600" />3+d
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white text-left py-2 px-2 text-[.6rem] font-black uppercase text-slate-400" style={{ minWidth: 140 }}>DTE / Day</th>
              {days.map(d => (
                <th key={d.offset} className={`text-center py-2 px-1 text-[.55rem] font-black uppercase ${d.isToday ? 'text-blue-700' : 'text-slate-400'}`} style={{ minWidth: 42 }}>
                  {d.isToday ? 'TODAY' : d.date.toLocaleDateString('en-GB', { weekday: 'short' })}
                  <br /><span className="text-slate-500 font-bold">{d.date.getDate()}</span>
                </th>
              ))}
              <th className="text-center py-2 px-2 text-[.6rem] font-black uppercase text-slate-700">Total</th>
            </tr>
          </thead>
          <tbody>
            {dteList.map(dte => {
              let totalLoad = 0
              const cellLoads = days.map(d => {
                const items = scheduledSites.filter(s => s.dte === dte.code && siteOccupiesDay(s, d.offset))
                let dayDur = 0
                items.forEach(s => {
                  if (s.dur < 1) dayDur += s.dur
                  else if (s.dur === Math.floor(s.dur)) dayDur += 1
                  else {
                    const off = d.offset - s.startDay
                    const cellsN = Math.ceil(s.dur)
                    if (off === cellsN - 1) dayDur += s.dur - (cellsN - 1)
                    else dayDur += 1
                  }
                })
                totalLoad += dayDur
                return dayDur
              })
              return (
                <tr key={dte.code} className="border-t border-slate-100">
                  <td className="sticky left-0 bg-white py-2 px-2 font-bold text-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="pb-avatar" style={{ background: dte.palette.bg, width: 24, height: 24, fontSize: 10 }}>{dte.short}</span>
                      {dte.name}
                    </div>
                  </td>
                  {cellLoads.map((load, i) => {
                    let cls = 'text-slate-300'
                    let val = '·'
                    if (load > 0) {
                      val = load.toFixed(1)
                      if (load <= 0.5) cls = 'bg-emerald-300 text-white'
                      else if (load <= 1) cls = 'bg-emerald-500 text-white'
                      else if (load <= 2) cls = 'bg-blue-600 text-white'
                      else if (load <= 3) cls = 'bg-amber-500 text-white'
                      else cls = 'bg-red-600 text-white'
                    }
                    return (
                      <td key={i} className="text-center py-1">
                        {load > 0
                          ? <span className={`inline-block min-w-[24px] px-1 rounded text-[.6rem] font-black ${cls}`}>{val}</span>
                          : <span className="text-slate-300">·</span>}
                      </td>
                    )
                  })}
                  <td className="text-center py-2 font-mono font-black text-slate-900">{totalLoad.toFixed(1)}d</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Geo Map ───────────────────────────────────────────────────────────────
// Shows DTE home bases as colored circles + scheduled sites colored by DTE +
// unscheduled (pool) sites in amber. Uses Leaflet via window.L (loaded globally).
function PlanMap({ dteList, scheduledSites, poolSites, siteCoords }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const layerRef = useRef(null)
  const [ready, setReady] = useState(!!window.L)

  useEffect(() => {
    if (window.L) { setReady(true); return }
    const t = setInterval(() => { if (window.L) { clearInterval(t); setReady(true) } }, 100)
    setTimeout(() => clearInterval(t), 8000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!ready || !mapRef.current || mapInstance.current) return
    const L = window.L
    const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OSM' }).addTo(map)
    map.setView([13.7563, 100.5018], 7)
    mapInstance.current = map
    layerRef.current = L.layerGroup().addTo(map)
    const handleResize = () => map.invalidateSize()
    window.addEventListener('resize', handleResize)
    setTimeout(() => map.invalidateSize(), 100)
    return () => window.removeEventListener('resize', handleResize)
  }, [ready])

  useEffect(() => {
    if (!mapInstance.current || !window.L) return
    const L = window.L
    layerRef.current.clearLayers()
    const bounds = []

    dteList.forEach(dte => {
      if (dte.baseLat == null || dte.baseLng == null) return
      L.circle([dte.baseLat, dte.baseLng], {
        radius: 10000,
        color: dte.palette.bg,
        weight: 1.5,
        fillColor: dte.palette.bg,
        fillOpacity: 0.08,
        dashArray: '4 4',
      }).bindTooltip(`${dte.name} · 10km coverage`, { sticky: true }).addTo(layerRef.current)
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:${dte.palette.bg};color:#fff;border:2px solid #fff;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;box-shadow:0 3px 8px rgba(0,0,0,.3)">${dte.short}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      })
      L.marker([dte.baseLat, dte.baseLng], { icon }).bindPopup(
        `<div style="min-width:180px"><b style="color:${dte.palette.bg}">${dte.name}</b><br/><span style="font-family:monospace;font-size:11px;color:#94a3b8">${dte.code}</span></div>`
      ).addTo(layerRef.current)
      const dLat = 10 / 111
      const dLng = 10 / (111 * Math.cos(dte.baseLat * Math.PI / 180))
      bounds.push([dte.baseLat - dLat, dte.baseLng - dLng])
      bounds.push([dte.baseLat + dLat, dte.baseLng + dLng])
    })

    scheduledSites.forEach(s => {
      const c = siteCoords[String(s.code).toUpperCase()]
      if (!c || c.lat == null || c.lng == null) return
      const dte = dteList.find(d => d.code === s.dte)
      const color = dte ? dte.palette.bg : '#64748b'
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:${color};color:#fff;border:2px solid #fff;border-radius:4px;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;box-shadow:0 2px 4px rgba(0,0,0,.25)">${s.type === 'PAC' ? 'P' : 'S'}</div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      })
      L.marker([c.lat, c.lng], { icon }).bindPopup(
        `<div style="min-width:200px"><b style="color:${color}">${s.code}</b> · <span style="font-size:10px;color:#94a3b8">${s.type}</span><br/>${c.name || ''}<br/><span style="font-size:10px;color:#475569">DTE: <b style="color:${color}">${dte ? dte.name : s.dte}</b></span><br/><span style="font-size:10px;color:#10b981;font-weight:700">✓ Scheduled · ⏱ ${fmtDuration(s.dur)}</span></div>`
      ).addTo(layerRef.current)
      bounds.push([c.lat, c.lng])
    })

    poolSites.forEach(s => {
      const c = siteCoords[String(s.code).toUpperCase()]
      if (!c || c.lat == null || c.lng == null) return
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:#fef3c7;color:#b45309;border:2px dashed #b45309;border-radius:4px;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900">?</div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      })
      L.marker([c.lat, c.lng], { icon }).bindPopup(
        `<div style="min-width:200px"><b style="color:#b45309">${s.code}</b> · <span style="font-size:10px;color:#94a3b8">${s.type}</span><br/>${c.name || ''}<br/><span style="font-size:10px;color:#b45309;font-weight:700">⚠ Unscheduled</span></div>`
      ).addTo(layerRef.current)
      bounds.push([c.lat, c.lng])
    })

    if (bounds.length) {
      try { mapInstance.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 11 }) } catch {}
    }
  }, [dteList, scheduledSites, poolSites, siteCoords])

  const hasCoords = s => { const c = siteCoords[String(s.code).toUpperCase()]; return c && c.lat != null && c.lng != null }
  const mappableScheduled = scheduledSites.filter(hasCoords).length
  const mappablePool = poolSites.filter(hasCoords).length

  return (
    <div className="rounded-2xl bg-white shadow-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <MapIcon size={14} /> Geo View · DTE Bases + Sites
          </h3>
          <div className="mt-1 text-[.65rem] font-bold text-slate-500">
            {dteList.length} DTE bases · {mappableScheduled} scheduled with GPS · {mappablePool} unscheduled with GPS
          </div>
        </div>
        <div className="flex items-center gap-3 text-[.62rem] font-bold text-slate-600 flex-wrap">
          {dteList.slice(0, 5).map(d => (
            <span key={d.code} className="inline-flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: d.palette.bg }} />
              {d.name.split(' ')[0]}
            </span>
          ))}
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: '#fef3c7', border: '2px dashed #b45309' }} />
            Unsched
          </span>
        </div>
      </div>
      <div ref={mapRef} style={{ width: '100%', height: 480, background: '#e2e8f0' }} />
      {!ready && (
        <div className="text-center text-xs font-bold text-slate-400 py-3">Loading map…</div>
      )}
    </div>
  )
}
