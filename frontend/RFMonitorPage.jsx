import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  Activity, AlertTriangle, ArrowUpRight, ArrowDownRight,
  Bell, CalendarDays, CheckCircle2, ChevronDown, ClipboardList,
  Command, Home, LogOut, Map as MapIcon, Menu, RefreshCw, Search,
  Sparkles, Wifi, Layers, GitBranch, Users, Filter, X,
} from 'lucide-react'
import { apiFetch } from './src/apiFetch.js'

const ACE_BLUE  = '#2447d8'
const ACE_RED   = '#c73b32'
const GREEN     = '#16a34a'
const ADMIN_NAVY = '#1f2937'
const COMPANY = 'AirConnect Engineering'

const RF_NAV = [
  { id: 'SSV',  label: 'SSV',      desc: 'Single Site Verification',     icon: Wifi },
  { id: 'PAC',  label: 'PAC',      desc: 'SSOA / Cluster',                icon: Layers },
  { id: 'PLAN', label: 'Plan DTE', desc: 'DTE Planning',                  icon: ClipboardList },
  { id: 'PIPE', label: 'Pipeline', desc: 'SSV → DT → Report → Done',      icon: GitBranch },
  { id: 'MAP',  label: 'Map',      desc: 'Geo view of sites & stages',    icon: MapIcon },
]

const STATUS_COLOR = {
  OPEN:      { bg: '#dcfce7', text: '#15803d' },
  CLOSED:    { bg: '#f1f5f9', text: '#64748b' },
  CANCELLED: { bg: '#fee2e2', text: '#dc2626' },
}

function extractSite(siteCode) {
  if (!siteCode) return '—'
  return siteCode.split('_')[0] || siteCode
}

// Resolve a PO's RF Cluster Name (ISDP Col I) from the site lookup.
// ISDP stores project_sites.site_code = FULL "Site Code" (e.g. "RYG7235_Flash_RAN_EAS R3"),
// so we match ONLY on the full value. We deliberately do NOT fall back to a
// truncated short key (extractSite "RYG7235") — that would wrongly attach the PO
// to an unrelated MasterDB cluster (e.g. bare site RYG7235 → EAS0070-Full-1)
// instead of its real ISDP cluster (EAS-FLASH-0012). When no full-key mapping
// exists yet, the PO stays ungrouped under its own full Site Code (marked "รอ ISDP").
function resolveClusterName(p, siteMap) {
  const full = (p.hw_data?.['Site Code'] || p.cluster_site || '').trim()
  const fullKey = full.toUpperCase()
  const fromFull = siteMap[fullKey]?.rf_cluster_name
  if (fromFull) return { clusterName: fromFull, matched: true, fullKey }
  return { clusterName: full || '—', matched: false, fullKey }
}

// Resolve a site's geo/date info from siteMap. ISDP rows are keyed by the FULL
// Site Code (e.g. "RYG7343_Relocate_East R3") and carry full_on_air/cluster_ready;
// MasterDB rows are keyed by the SHORT code (e.g. "RYG7343") and carry lat/lng.
// So: dates come from the full-key row (fallback short), coords from whichever
// has them, and rf_cluster_name ONLY from the full key (never the short key,
// which would attach a wrong/unrelated MasterDB cluster).
function siteGeo(rawSite, siteMap) {
  const gf = siteMap[(rawSite || '').toUpperCase()] || {}
  const gs = siteMap[extractSite(rawSite || '').toUpperCase()] || {}
  return {
    full_on_air:     gf.full_on_air   ?? gs.full_on_air,
    cluster_ready:   gf.cluster_ready ?? gs.cluster_ready,
    rf_cluster_name: gf.rf_cluster_name,
    lat:             gf.lat ?? gs.lat,
    lng:             gf.lng ?? gs.lng,
  }
}

function extractLayers(itemDis) {
  if (!itemDis) return '—'
  const m = itemDis.match(/for\s+(.+?)\s+layer/i)
  if (!m) return '—'
  const raw = m[1]
  if (/^\d+~\d+$/.test(raw)) return `${raw} layers`
  const nums = raw.match(/\d+/g)
  if (nums) return `${nums[nums.length - 1]} layers`
  return `${raw} layers`
}

function statusChip(status) {
  const s = (status || '').toUpperCase()
  const c = STATUS_COLOR[s] || { bg: '#f8fafc', text: '#94a3b8' }
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 99,
      fontSize: '.65rem', fontWeight: 700, background: c.bg, color: c.text,
    }}>{s || '—'}</span>
  )
}

function Avatar({ name, size = 36 }) {
  const safe = name || 'User'
  const initials = safe.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const colors = ['#7c3aed', '#0369a1', '#047857', '#c0392b', '#b45309']
  const color  = colors[safe.charCodeAt(0) % colors.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color, color: '#fff', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: size * 0.36, flexShrink: 0,
    }}>{initials}</div>
  )
}

function Card({ children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.06)] ${className}`}>
      {children}
    </section>
  )
}

function IconButton({ children, label, onClick, disabled = false }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0 active:translate-y-0"
    >
      {children}
    </button>
  )
}

function StatCard({ label, value, helper, tone = ACE_BLUE, icon: Icon = Activity, delta = null, deltaTone = 'positive' }) {
  return (
    <Card className="group p-5 transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_24px_70px_rgba(36,71,216,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `${tone}12`, color: tone }}>
          <Icon size={21} strokeWidth={2.3} />
        </div>
        {delta != null && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${deltaTone === 'positive' ? 'bg-emerald-50 text-emerald-700' : deltaTone === 'warn' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
            {deltaTone === 'positive' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {delta}
          </span>
        )}
      </div>
      <div className="mt-5 text-sm font-bold text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-black tracking-normal text-slate-950">{value}</div>
      {helper && <div className="mt-2 text-sm font-semibold text-slate-400">{helper}</div>}
    </Card>
  )
}

function initials(name) {
  return String(name || 'RF')
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map(p => p[0]).join('').toUpperCase() || 'RF'
}

function formatToday() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  })
}

function RFSidebar({ activeNav, setActiveNav, counts, mobileOpen, onMobileClose }) {
  return (
    <aside className={`${mobileOpen ? 'fixed inset-y-0 left-0 z-40 flex' : 'hidden'} w-72 flex-col border-r border-slate-200 bg-white/95 p-5 shadow-2xl backdrop-blur lg:sticky lg:top-0 lg:flex lg:h-screen lg:shadow-none`}>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${ACE_BLUE}, ${ACE_RED})` }}>
          <Command size={24} />
        </div>
        <div className="min-w-0">
          <div className="text-base font-black text-slate-950">ACE RF Monitor</div>
          <div className="text-xs font-bold text-slate-400">HWT2304 · PO Tracking</div>
        </div>
        <button
          onClick={onMobileClose}
          className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 lg:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="mt-9 space-y-2">
        {RF_NAV.map(item => {
          const active = item.id === activeNav
          const Icon = item.icon || Activity
          const cnt = counts?.[item.id]
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => { setActiveNav(item.id); onMobileClose?.() }}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition ${active ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'}`}
            >
              <Icon size={19} />
              <span className="flex min-w-0 flex-col">
                <span>{item.label}</span>
                <span className={`text-[.66rem] font-semibold ${active ? 'text-blue-600/80' : 'text-slate-400'}`}>{item.desc}</span>
              </span>
              {cnt != null && cnt !== 0 && (
                <span className={`ml-auto rounded-full px-2 py-0.5 text-[.66rem] font-bold ${active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                  {cnt}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-sm font-black text-slate-900">
          <Sparkles size={18} style={{ color: ACE_BLUE }} />
          RF Workspace
        </div>
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
          True Merge / EAS Rollout · Drive Test planning &amp; pipeline tracking.
        </p>
      </div>
    </aside>
  )
}

export default function RFMonitorPage({ authenticatedUser, onLogout, embedded = false, forceActiveNav = null, project = '' }) {
  const [activeNav, setActiveNav] = useState(forceActiveNav || 'SSV')
  useEffect(() => { if (forceActiveNav) setActiveNav(forceActiveNav) }, [forceActiveNav])
  // Project scope — '' means "all projects". When embedded in PreSiteMonitorPage,
  // the parent's project switcher drives this; standalone it defaults to all.
  const projShort = project || 'All Projects'
  const matchesProject = useCallback(
    (p) => !project || p.ace_project_code === project,
    [project]
  )
  const [rows, setRows]       = useState({ SSV: [], PAC: [] })
  const [siteMap, setSiteMap] = useState({})
  const [dteList, setDteList] = useState([])
  const [planMap, setPlanMap]         = useState({})        // SSV (per po_id)
  const [planMapPac, setPlanMapPac]   = useState({})        // PAC (per cluster_name)
  const [pipeline, setPipeline]       = useState([])        // SSV pipeline rows
  const [pipelinePac, setPipelinePac] = useState([])        // PAC pipeline rows (PO lines)
  const [loading, setLoading]         = useState(false)
  const [search, setSearch]           = useState('')
  const [filterOnAir, setFilterOnAir] = useState(true)
  const [filterUnplanned, setFilterUnplanned] = useState(false)
  const [toast, setToast]             = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  // Map state
  const [mapWorkType, setMapWorkType] = useState('ALL')   // 'ALL' | 'SSV' | 'PAC'
  const [mapStage,    setMapStage]    = useState('ALL')   // 'ALL' | 'UNPLANNED' | 'PLANNED' | 'DT' | 'REPORT' | 'DONE'
  const [selectedMarker, setSelectedMarker] = useState(null)
  const saveTimers     = useRef({})
  const pacSaveTimers  = useRef({})
  const toastTimer     = useRef(null)
  const user = authenticatedUser || {}

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }, [])

  const [trackingLockMap, setTrackingLockMap] = useState({})
  // Workflow-done map (tracking reached ⑤ Check Pass = ACE_APPROVED).
  // SSV keyed by po_id, PAC keyed by upper(cluster_key). Drives the "✓ Done" badge
  // on the SSV/PAC inventory tables, which otherwise only show the raw HW PO Status.
  const [trackingDone, setTrackingDone] = useState({ poId: {}, cluster: {} })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Pipeline endpoint requires a project_code; when scope is "all" we skip
      // the plan overlay (inventory below still shows every project's rows).
      const pipeQ = project ? `ace_project_code=${encodeURIComponent(project)}&` : ''
      const trackQ = project ? `?ace_project_code=${encodeURIComponent(project)}` : ''
      // Sites: only the ones referenced by POs (project-scoped if a project is
      // selected). Avoids pulling the full 100k+ project_sites table just to
      // resolve cluster names. Cached per scope.
      const sitesUrl = project
        ? `/api/sites?project_code=${encodeURIComponent(project)}`
        : '/api/sites?referenced_only=true'
      const [posRes, sitesRes, empRes, pipeRes, pipePacRes, trackRes] = await Promise.all([
        apiFetch('/api/project-pos').then(r => r.json()),
        apiFetch(sitesUrl).then(r => r.json()),
        apiFetch('/api/employees?project_team=RF&status=ACTIVE').then(r => r.json()),
        project ? apiFetch(`/api/project-pos/pipeline?${pipeQ}work_type=SSV`).then(r => r.json()).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        project ? apiFetch(`/api/project-pos/pipeline?${pipeQ}work_type=PAC`).then(r => r.json()).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        apiFetch(`/api/presite/tracking${trackQ}`).then(r => r.json()).catch(() => ({ data: [] })),
      ])
      setPipeline(pipeRes.data || [])
      setPipelinePac(pipePacRes.data || [])

      // Build lock map: po_id → {locked, reason} for Plan DTE re-plan rules
      // SSV: locked when check_at IS NOT NULL (check done)
      // PAC: locked when report_approved_at IS NOT NULL
      const lockMap = {}
      const doneByPo = {}
      const doneByCluster = {}
      ;(trackRes.data || []).forEach(t => {
        // Workflow Done = reached ⑤ Check Pass. PAC tracking has po_id=NULL → key by cluster.
        if ((t.current_stage || '').toUpperCase() === 'ACE_APPROVED') {
          if (t.po_id) doneByPo[t.po_id] = true
          if (t.cluster_key) doneByCluster[t.cluster_key.toUpperCase()] = true
        }
        if (!t.po_id) return
        const wt = (t.work_type || '').toUpperCase()
        if (wt === 'SSV' && t.check_at) {
          lockMap[t.po_id] = { locked: true, reason: t.check_result === 'PASS' ? 'Check passed' : 'Checked' }
        } else if (wt === 'PAC' && t.report_approved_at) {
          lockMap[t.po_id] = { locked: true, reason: 'Report Approved' }
        }
      })
      setTrackingLockMap(lockMap)
      setTrackingDone({ poId: doneByPo, cluster: doneByCluster })

      const sm = {}
      ;(sitesRes.data || []).forEach(s => {
        if (s.site_code) sm[s.site_code.toUpperCase()] = {
          lat: s.lat, lng: s.lng,
          full_on_air:      s.full_on_air,
          cluster_ready:    s.cluster_ready,
          rf_cluster_name:  s.rf_cluster_name,
          rf_cluster_owner: s.rf_cluster_owner,
        }
      })
      setSiteMap(sm)

      // DTE Per-Site = ONLY Subcontractor Per-Site contract_type
      // (excludes Permanent / Contract DTE who clock DAILY)
      const isDtePerSite = e => {
        const contract = String(e.contract_type || '').toLowerCase()
        if (contract === 'subcontractor per-site') return true
        // Fallback: explicit clock_type=PER_SITE
        const ct = String(e.clock_type || '').toUpperCase()
        if (ct === 'PER_SITE') {
          const pos = String(e.position || e.job_title || '').toLowerCase()
          if (pos.includes('analysis')) return false
          return true
        }
        return false
      }
      const dte = (empRes.data || [])
        .filter(isDtePerSite)
        .map(e => ({
          employee_code: e.employee_code,
          full_name:     e.full_name || e.employee_code,
          position_name: e.position || e.job_title || 'Drive Test Engineer',
        }))
        .sort((a, b) => String(a.full_name || '').localeCompare(String(b.full_name || ''), 'en'))
      setDteList(dte)

      const hwPos = (posRes.data || []).filter(p => p.hw_data)
      const ssv = hwPos.filter(p => {
        if (p.ace_project_code && p.work_type)
          return matchesProject(p) && p.work_type === 'SSV'
        const item = p.hw_data?.['Item Description'] ?? p.item_dis ?? ''
        return item.startsWith('B_Single Site Verification')
      })
      const pac = hwPos.filter(p => {
        if (p.ace_project_code && p.work_type)
          return matchesProject(p) && p.work_type === 'PAC'
        const item = p.hw_data?.['Item Description'] ?? p.item_dis ?? ''
        return item.startsWith('B_SSOA') || item.startsWith('B_Cluster')
      })
      setRows({ SSV: ssv, PAC: pac })

      const pm = {}
      ssv.forEach(p => {
        pm[p.id] = {
          code: p.planned_dte_codes || '',
          name: p.planned_dte_names || '',
          saving: false, saved: !!p.planned_dte_codes,
        }
      })
      setPlanMap(pm)

      // Init PAC plan map — keyed by cluster name; pick code shared across all PAC POs in cluster
      const pmPac = {}
      const grouped = {}
      pac.forEach(p => {
        const k = extractSite(p.hw_data?.['Site Code'] || p.cluster_site || '').toUpperCase()
        const clusterName = (sm[k] || {}).rf_cluster_name
        if (!clusterName) return
        if (!grouped[clusterName]) grouped[clusterName] = []
        grouped[clusterName].push(p)
      })
      Object.entries(grouped).forEach(([clusterName, items]) => {
        const codes = items.map(p => p.planned_dte_codes || '').filter(Boolean)
        const allSame = codes.length === items.length && codes.every(c => c === codes[0])
        const code = allSame && codes.length ? codes[0] : ''
        const item = items.find(p => p.planned_dte_codes === code)
        pmPac[clusterName] = {
          code,
          name: item?.planned_dte_names || '',
          saving: false,
          saved: !!code,
          mixed: !allSame && codes.length > 0,
        }
      })
      setPlanMapPac(pmPac)

    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [project, matchesProject])

  useEffect(() => { load() }, [load])

  async function savePlan(poId, code, name) {
    setPlanMap(prev => ({ ...prev, [poId]: { ...prev[poId], saving: true, saved: false } }))
    try {
      const res = await apiFetch(`/api/project-pos/${poId}/plan`, {
        method: 'PATCH',
        body: JSON.stringify({ planned_dte_codes: code || null, planned_dte_names: name || null }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setPlanMap(prev => ({ ...prev, [poId]: { ...prev[poId], saving: false, saved: true } }))
      if (!code) showToast('Plan removed', 'success')
    } catch (err) {
      setPlanMap(prev => ({ ...prev, [poId]: { ...prev[poId], saving: false, saved: false } }))
      showToast(`Failed to save DTE plan: ${err.message || 'network error'}`, 'error')
    }
  }

  function onDteChange(poId, code) {
    const found = dteList.find(e => (e.employee_code || e.employeeCode) === code)
    const name  = found ? found.full_name || found.fullName || '' : ''
    setPlanMap(prev => ({ ...prev, [poId]: { code, name, saving: false, saved: false } }))
    clearTimeout(saveTimers.current[poId])
    saveTimers.current[poId] = setTimeout(() => savePlan(poId, code, name), 600)
  }

  async function savePlanPac(clusterName, poIds, code, name) {
    // PAC cluster-level plan: 1 cluster = 1 DTE → API fanouts to all POs + seeds tracking
    setPlanMapPac(prev => ({ ...prev, [clusterName]: { ...prev[clusterName], saving: true, saved: false } }))
    try {
      if (code) {
        // Assign DTE to cluster
        const res = await apiFetch('/api/presite/cluster-plan', {
          method: 'POST',
          body: JSON.stringify({
            cluster_key: clusterName,
            dte_code: code,
            dte_name: name || code,
          }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const result = await res.json()
        setPlanMapPac(prev => ({ ...prev, [clusterName]: { ...prev[clusterName], saving: false, saved: true, mixed: false } }))
        showToast(`Cluster "${clusterName}": ${name || code} assigned to ${result.pos_updated} POs (tracking #${result.tracking_id})`, 'success')
      } else {
        // Remove plan via cluster-unplan API (atomic + auto-cleans tracking if FULL_ONAIR)
        const res = await apiFetch('/api/presite/cluster-unplan', {
          method: 'POST',
          body: JSON.stringify({ cluster_key: clusterName }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          if (res.status === 409) {
            // Work in progress — confirm force delete
            const ok = window.confirm(
              `Cluster "${clusterName}" has work in progress.\n\n${err.detail || ''}\n\nForce unplan (deletes tracking + history)?`
            )
            if (!ok) {
              setPlanMapPac(prev => ({ ...prev, [clusterName]: { ...prev[clusterName], saving: false, saved: false } }))
              return
            }
            const forceRes = await apiFetch('/api/presite/cluster-unplan', {
              method: 'POST',
              body: JSON.stringify({ cluster_key: clusterName, force: true }),
            })
            if (!forceRes.ok) throw new Error(`force unplan failed: HTTP ${forceRes.status}`)
            const forceResult = await forceRes.json()
            setPlanMapPac(prev => ({ ...prev, [clusterName]: { ...prev[clusterName], saving: false, saved: true, mixed: false } }))
            showToast(`Cluster "${clusterName}": ${forceResult.pos_unplanned} POs cleared (tracking forcibly deleted)`, 'success')
            return
          }
          throw new Error(`HTTP ${res.status}: ${err.detail || 'unknown'}`)
        }
        const result = await res.json()
        setPlanMapPac(prev => ({ ...prev, [clusterName]: { ...prev[clusterName], saving: false, saved: true, mixed: false } }))
        const msg = `Cluster "${clusterName}": ${result.pos_unplanned} POs unplanned${result.tracking_deleted ? ' (tracking deleted)' : ''}`
        showToast(msg, 'success')
      }
    } catch (err) {
      setPlanMapPac(prev => ({ ...prev, [clusterName]: { ...prev[clusterName], saving: false, saved: false } }))
      showToast(`Failed to save cluster "${clusterName}": ${err.message || 'network error'}`, 'error')
    }
  }

  async function reloadPipelines() {
    if (!project) { setPipeline([]); setPipelinePac([]); return }
    const pipeQ = `ace_project_code=${encodeURIComponent(project)}&`
    const [ssv, pac] = await Promise.all([
      apiFetch(`/api/project-pos/pipeline?${pipeQ}work_type=SSV`).then(r => r.json()).catch(() => ({ data: [] })),
      apiFetch(`/api/project-pos/pipeline?${pipeQ}work_type=PAC`).then(r => r.json()).catch(() => ({ data: [] })),
    ])
    setPipeline(ssv.data || [])
    setPipelinePac(pac.data || [])
  }

  async function markPipelineStage(poId, action) {
    const labels = {
      'mark-reported':   'Marked as Reported',
      'mark-done':       'Marked as Done',
      'unmark-reported': 'Reported flag removed',
      'unmark-done':     'Done flag removed',
    }
    try {
      let url, opts
      if (action.startsWith('unmark-')) {
        const stage = action.replace('unmark-', '')
        url = `/api/project-pos/${poId}/unmark?stage=${stage}`
        opts = { method: 'PATCH' }
      } else {
        url = `/api/project-pos/${poId}/${action}`
        opts = { method: 'PATCH', body: JSON.stringify({}) }
      }
      const res = await apiFetch(url, opts)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      showToast(labels[action] || 'Updated', 'success')
      await reloadPipelines()
    } catch (err) {
      showToast(`Failed: ${err.message || 'network error'}`, 'error')
    }
  }

  async function markPipelineCluster(clusterName, poIds, action) {
    const labels = {
      'mark-reported':   `Cluster "${clusterName}" reported`,
      'mark-done':       `Cluster "${clusterName}" closed`,
      'unmark-reported': `Cluster "${clusterName}" report flag removed`,
      'unmark-done':     `Cluster "${clusterName}" done flag removed`,
    }
    try {
      const results = await Promise.all(poIds.map(poId => {
        if (action.startsWith('unmark-')) {
          const stage = action.replace('unmark-', '')
          return apiFetch(`/api/project-pos/${poId}/unmark?stage=${stage}`, { method: 'PATCH' })
        }
        return apiFetch(`/api/project-pos/${poId}/${action}`, { method: 'PATCH', body: JSON.stringify({}) })
      }))
      const failed = results.filter(r => !r.ok).length
      if (failed > 0) {
        showToast(`${labels[action]} — ${failed}/${poIds.length} failed`, 'error')
      } else {
        showToast(`${labels[action]} — ${poIds.length} PO lines`, 'success')
      }
      await reloadPipelines()
    } catch (err) {
      showToast(`Failed: ${err.message || 'network error'}`, 'error')
    }
  }

  function onPacDteChange(clusterName, poIds, code) {
    const found = dteList.find(e => (e.employee_code || e.employeeCode) === code)
    const name  = found ? found.full_name || found.fullName || '' : ''
    setPlanMapPac(prev => ({ ...prev, [clusterName]: { code, name, saving: false, saved: false, mixed: false } }))
    clearTimeout(pacSaveTimers.current[clusterName])
    pacSaveTimers.current[clusterName] = setTimeout(() => savePlanPac(clusterName, poIds, code, name), 600)
  }

  const isMon = activeNav === 'SSV' || activeNav === 'PAC'
  const data  = activeNav === 'PLAN' ? rows.SSV : (rows[activeNav] || [])
  const q     = search.toLowerCase()
  const base  = q
    ? data.filter(p => {
        const d = p.hw_data || {}
        return (d['ID'] || '').toLowerCase().includes(q) ||
               (d['Site Code'] || p.cluster_site || '').toLowerCase().includes(q) ||
               (d['PO NO.'] || p.po_number || '').toLowerCase().includes(q) ||
               (d['Item Description'] || p.item_dis || '').toLowerCase().includes(q)
      })
    : data

  const sortBySiteDate = (arr, field) => [...arr].sort((a, b) => {
    const ga = siteGeo(a.hw_data?.['Site Code'] || a.cluster_site || '', siteMap)
    const gb = siteGeo(b.hw_data?.['Site Code'] || b.cluster_site || '', siteMap)
    if (!ga[field] && !gb[field]) return 0
    if (!ga[field]) return 1
    if (!gb[field]) return -1
    return gb[field].localeCompare(ga[field])
  })

  const sorted = activeNav === 'PAC'
    ? sortBySiteDate(base, 'cluster_ready')
    : sortBySiteDate(base, 'full_on_air')

  let filtered = sorted
  if (activeNav === 'PLAN' && filterOnAir) {
    filtered = filtered.filter(p => {
      const key = extractSite(p.hw_data?.['Site Code'] || p.cluster_site || '').toUpperCase()
      return !!(siteMap[key] || {}).full_on_air
    })
  }
  if (activeNav === 'PLAN' && filterUnplanned) {
    filtered = filtered.filter(p => !planMap[p.id]?.code)
  }

  const statusSummary = isMon ? data.reduce((acc, p) => {
    const s = (p.hw_data?.['PO Status'] || p.hw_po_status || 'UNKNOWN').toUpperCase()
    acc[s] = (acc[s] || 0) + 1
    return acc
  }, {}) : {}

  const planDone  = Object.values(planMap).filter(v => v.code).length
  const planTotal = rows.SSV.length

  // PAC clusters — group by RF Cluster Name, only clusters that have at least one site with cluster_ready
  const pacClusters = useMemo(() => {
    const groups = {}
    rows.PAC.forEach(p => {
      const siteKey = extractSite(p.hw_data?.['Site Code'] || p.cluster_site || '').toUpperCase()
      const geo = siteMap[siteKey] || {}
      const clusterName = geo.rf_cluster_name
      if (!clusterName) return
      if (!groups[clusterName]) {
        groups[clusterName] = {
          name: clusterName,
          poIds: [],
          sites: new Set(),
          readyDates: [],
          poStatuses: {},
        }
      }
      groups[clusterName].poIds.push(p.id)
      groups[clusterName].sites.add(siteKey)
      if (geo.cluster_ready) groups[clusterName].readyDates.push(geo.cluster_ready)
      const st = (p.hw_data?.['PO Status'] || p.hw_po_status || '—').toUpperCase()
      groups[clusterName].poStatuses[st] = (groups[clusterName].poStatuses[st] || 0) + 1
    })
    return Object.values(groups)
      .filter(g => g.readyDates.length > 0)
      .map(g => ({
        ...g,
        cluster_ready: g.readyDates.sort().slice(-1)[0],   // latest cluster_ready
        siteCount: g.sites.size,
        lineCount: g.poIds.length,
      }))
      .sort((a, b) => String(b.cluster_ready || '').localeCompare(String(a.cluster_ready || '')))
  }, [rows.PAC, siteMap])

  const pacClustersFiltered = useMemo(() => {
    let arr = pacClusters
    if (q) arr = arr.filter(c => c.name.toLowerCase().includes(q))
    if (filterUnplanned) arr = arr.filter(c => !planMapPac[c.name]?.code)
    return arr
  }, [pacClusters, q, filterUnplanned, planMapPac])

  const pacPlanDone  = pacClusters.filter(c => planMapPac[c.name]?.code).length
  const pacPlanTotal = pacClusters.length

  // DTE workload — count SSV sites + PAC clusters per DTE code
  const dteWorkload = useMemo(() => {
    const counts = {}
    Object.values(planMap).forEach(v => {
      if (v.code) counts[v.code] = (counts[v.code] || 0) + 1
    })
    // PAC: count clusters (each cluster = 1 unit of planning load)
    Object.values(planMapPac).forEach(v => {
      if (v.code) {
        counts[v.code] = counts[v.code] || 0
        counts[v.code] += 0.5  // half-weight: cluster is grouped, not 1 site
      }
    })
    const out = {}
    Object.entries(counts).forEach(([code, n]) => { out[code] = Math.round(n) })
    return out
  }, [planMap, planMapPac])

  // Decorate dteList with workload counts
  const dteListWithLoad = useMemo(() => (
    dteList.map(d => ({ ...d, workload: dteWorkload[d.employee_code] || 0 }))
  ), [dteList, dteWorkload])

  // Pipeline aggregation — SSV (per-site stats)
  const pipelineStages = useMemo(() => {
    let plan = 0, dt = 0, report = 0, done = 0
    pipeline.forEach(p => {
      if (p.planned_dte_codes) plan++
      if (p.dt_done_at)        dt++
      if (p.reported_at)       report++
      if (p.done_at || (p.workflow_status || '').toUpperCase() === 'LEADER_APPROVED' || (p.workflow_status || '').toUpperCase() === 'CLOSED') done++
    })
    return { plan, dt, report, done, total: pipeline.length }
  }, [pipeline])

  // Pipeline PAC — group PO lines by RF Cluster Name
  const pipelinePacClusters = useMemo(() => {
    const groups = {}
    pipelinePac.forEach(p => {
      const sk = (p.site_key || extractSite(p.site_code || '').toUpperCase())
      const clusterName = (siteMap[sk] || {}).rf_cluster_name
      if (!clusterName) return
      if (!groups[clusterName]) {
        groups[clusterName] = {
          name: clusterName,
          poIds: [],
          sites: new Set(),
          dteSet: new Set(),
          dteName: null,
          stats: { plan: 0, dt: 0, report: 0, done: 0, total: 0 },
          clusterReadyDates: [],
        }
      }
      const g = groups[clusterName]
      g.poIds.push(p.po_id)
      g.sites.add(sk)
      g.stats.total++
      if (p.planned_dte_codes) { g.stats.plan++; g.dteSet.add(p.planned_dte_codes); g.dteName = p.planned_dte_names || g.dteName }
      if (p.dt_done_at)        g.stats.dt++
      if (p.reported_at)       g.stats.report++
      const wf = (p.workflow_status || '').toUpperCase()
      if (p.done_at || wf === 'LEADER_APPROVED' || wf === 'CLOSED') g.stats.done++
      if ((siteMap[sk] || {}).cluster_ready) g.clusterReadyDates.push(siteMap[sk].cluster_ready)
    })
    return Object.values(groups)
      .map(g => ({
        ...g,
        siteCount: g.sites.size,
        dteCodes: Array.from(g.dteSet),
        dteMixed: g.dteSet.size > 1,
        cluster_ready: g.clusterReadyDates.sort().slice(-1)[0] || null,
      }))
      .sort((a, b) => String(b.cluster_ready || '').localeCompare(String(a.cluster_ready || '')))
  }, [pipelinePac, siteMap])

  // Map markers — combine SSV (per-site) + PAC (representative site per cluster)
  const mapMarkers = useMemo(() => {
    const markers = []

    const stageOf = (p) => {
      const wf = (p.workflow_status || '').toUpperCase()
      if (p.done_at || wf === 'LEADER_APPROVED' || wf === 'CLOSED') return 'DONE'
      if (p.reported_at || wf === 'LEADER_CHECKING')                return 'REPORT'
      if (p.dt_done_at)                                              return 'DT'
      if (p.planned_dte_codes)                                       return 'PLANNED'
      return 'UNPLANNED'
    }
    const stageOfCluster = (g) => {
      const total = g.stats.total
      if (g.stats.done   === total && total > 0) return 'DONE'
      if (g.stats.report === total && total > 0) return 'REPORT'
      if (g.stats.dt     === total && total > 0) return 'DT'
      if (g.stats.plan   > 0)                    return 'PLANNED'
      return 'UNPLANNED'
    }

    if (mapWorkType === 'ALL' || mapWorkType === 'SSV') {
      pipeline.forEach(p => {
        const sk = (p.site_key || extractSite(p.site_code || '').toUpperCase())
        // Lookup coords by FULL site_code first (ISDP Col E/F lands there),
        // fallback short key (MasterDB). extractSite-only missed full-name sites.
        const geo = siteGeo(p.site_code || sk, siteMap)
        if (geo.lat == null || geo.lng == null) return
        markers.push({
          key: `SSV-${p.po_id}`,
          work_type: 'SSV',
          lat: Number(geo.lat),
          lng: Number(geo.lng),
          site_code: p.site_code,
          site_key: sk,
          stage: stageOf(p),
          dte_name: p.planned_dte_names,
          dte_code: p.planned_dte_codes,
          po_count: 1,
          full_on_air: geo.full_on_air,
          cluster_name: geo.rf_cluster_name,
          po_id: p.po_id,
          po_number: p.po_number,
          dt_done_at: p.dt_done_at,
          reported_at: p.reported_at,
          done_at: p.done_at,
          workflow_status: p.workflow_status,
        })
      })
    }
    if (mapWorkType === 'ALL' || mapWorkType === 'PAC') {
      pipelinePacClusters.forEach(g => {
        // Pick representative coords — first site in cluster with lat/lng
        let lat = null, lng = null, repSiteCode = null
        for (const sk of g.sites) {
          const geo = siteMap[sk] || {}
          if (geo.lat != null && geo.lng != null) {
            lat = Number(geo.lat); lng = Number(geo.lng); repSiteCode = sk
            break
          }
        }
        if (lat == null || lng == null) return
        markers.push({
          key: `PAC-${g.name}`,
          work_type: 'PAC',
          lat, lng,
          site_code: repSiteCode,
          cluster_name: g.name,
          stage: stageOfCluster(g),
          dte_name: g.dteName,
          dte_code: g.dteCodes[0],
          dte_mixed: g.dteMixed,
          po_count: g.stats.total,
          site_count: g.siteCount,
          cluster_ready: g.cluster_ready,
          stats: g.stats,
          po_ids: g.poIds,
        })
      })
    }

    return markers.filter(m => mapStage === 'ALL' || mapStage === m.stage)
  }, [pipeline, pipelinePacClusters, siteMap, mapWorkType, mapStage])

  // PAC pipeline aggregate counts for metric card
  const pipelinePacStages = useMemo(() => {
    let plan = 0, dt = 0, report = 0, done = 0
    pipelinePacClusters.forEach(g => {
      const total = g.stats.total
      if (g.stats.plan   === total && total > 0) plan++
      if (g.stats.dt     === total && total > 0) dt++
      if (g.stats.report === total && total > 0) report++
      if (g.stats.done   === total && total > 0) done++
    })
    return { plan, dt, report, done, total: pipelinePacClusters.length }
  }, [pipelinePacClusters])

  const navCounts = useMemo(() => {
    const totalDone  = planDone + pacPlanDone
    const totalTotal = planTotal + pacPlanTotal
    return {
      SSV: rows.SSV.length,
      PAC: rows.PAC.length,
      PLAN: totalTotal ? `${totalDone}/${totalTotal}` : 0,
      PIPE: (pipelineStages.total + pipelinePacStages.total)
        ? `${pipelineStages.done + pipelinePacStages.done}/${pipelineStages.total + pipelinePacStages.total}`
        : 0,
      MAP: mapMarkers.length,
    }
  }, [rows.SSV.length, rows.PAC.length, planDone, planTotal, pacPlanDone, pacPlanTotal, pipelineStages, pipelinePacStages, mapMarkers.length])

  const metrics = useMemo(() => {
    const onAirCount = rows.SSV.filter(p => {
      const k = extractSite(p.hw_data?.['Site Code'] || p.cluster_site || '').toUpperCase()
      return !!(siteMap[k] || {}).full_on_air
    }).length
    const openCount = rows.SSV.filter(p => (p.hw_data?.['PO Status'] || p.hw_po_status || '').toUpperCase() === 'OPEN').length
    return { onAirCount, openCount }
  }, [rows.SSV, siteMap])

  const navTitle = RF_NAV.find(n => n.id === activeNav)?.label || 'RF Monitor'

  return (
    <div className={embedded ? 'text-slate-950' : 'min-h-screen bg-[#f5f7fb] text-slate-950'}>
      <div className={embedded ? '' : 'flex min-h-screen'}>
        {!embedded && (
          <RFSidebar
            activeNav={activeNav}
            setActiveNav={setActiveNav}
            counts={navCounts}
            mobileOpen={mobileMenuOpen}
            onMobileClose={() => setMobileMenuOpen(false)}
          />
        )}

        {!embedded && mobileMenuOpen && (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <main className="min-w-0 flex-1">
          {/* Sticky top header */}
          {!embedded && (
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/86 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <IconButton label="Open menu" onClick={() => setMobileMenuOpen(true)}>
                <Menu size={19} />
              </IconButton>
              <div className="hidden min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-400 md:flex">
                <Search size={18} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search ID / Site / PO / Item..."
                  className="w-full border-0 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
              <div className="ml-auto flex items-center gap-2">
                <IconButton label="Refresh data" onClick={load} disabled={loading}>
                  <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </IconButton>
                <IconButton label="Notifications">
                  <Bell size={18} />
                </IconButton>
                <button className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:bg-slate-50 sm:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-black text-white" style={{ background: ACE_BLUE }}>
                    {initials(user.name || user.firstName)}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black text-slate-900">{user.name || user.firstName || 'User'}</div>
                    <div className="text-xs font-bold text-slate-400">{user.positionName || user.role || 'Project Access'}</div>
                  </div>
                  <ChevronDown size={16} className="text-slate-400" />
                </button>
                {onLogout && (
                  <IconButton label="Logout" onClick={onLogout}>
                    <LogOut size={18} />
                  </IconButton>
                )}
              </div>
            </div>
          </header>
          )}

          <div className={embedded ? 'flex flex-col gap-6' : 'px-4 py-6 sm:px-6 lg:px-8 lg:py-8 flex flex-col gap-6'}>
            {/* Title section — eyebrow + heading + actions */}
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
                  <Home size={14} />
                  {COMPANY} · RF · {projShort}
                </div>
                <h1 className="mt-4 text-3xl font-black tracking-normal text-slate-950 sm:text-4xl">
                  {navTitle}
                </h1>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                  {activeNav === 'PLAN'
                    ? 'Assign DTE engineers to SSV sites and PAC clusters that are ready for field execution.'
                    : activeNav === 'PIPE'
                    ? 'Track every PO from planning through drive test, reporting, and final closure.'
                    : activeNav === 'MAP'
                    ? 'Geographic view of all sites with stage-coloured markers and cluster overlays.'
                    : 'PO Tracking · HW Export · True / DTAC RF Rollout 2026.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 shadow-sm">
                  <CalendarDays size={17} style={{ color: ACE_RED }} />
                  {formatToday()}
                </div>
                {activeNav === 'PLAN' && (
                  <>
                    <button
                      onClick={() => setFilterOnAir(v => !v)}
                      className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition hover:-translate-y-0.5 ${filterOnAir ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600'}`}
                    >
                      <Filter size={15} />
                      {filterOnAir ? '✓ Full On-Air' : '○ Full On-Air'}
                    </button>
                    <button
                      onClick={() => setFilterUnplanned(v => !v)}
                      className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition hover:-translate-y-0.5 ${filterUnplanned ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-600'}`}
                    >
                      <Filter size={15} />
                      {filterUnplanned ? '✓ Unplanned' : '○ Unplanned'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Metric cards */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {activeNav === 'PLAN' ? (
                <>
                  <StatCard label="SSV LINES"     value={rows.SSV.length}  helper={`${projShort} · SSV PO`}   tone={ACE_BLUE} icon={Wifi} />
                  <StatCard label="FULL ON-AIR"   value={metrics.onAirCount} helper="SSV sites ready for work" tone={GREEN}    icon={CheckCircle2} />
                  <StatCard label="SSV PLANNED"   value={`${planDone} / ${planTotal}`} helper="DTE assigned per site"     tone="#0891b2" icon={ClipboardList} delta={planTotal ? `${Math.round(planDone/planTotal*100)}%` : null} deltaTone={planDone === planTotal ? 'positive' : 'warn'} />
                  <StatCard label="PAC CLUSTERS"  value={`${pacPlanDone} / ${pacPlanTotal}`} helper="DTE assigned per cluster" tone="#7c3aed" icon={Layers} delta={pacPlanTotal ? `${Math.round(pacPlanDone/pacPlanTotal*100)}%` : null} deltaTone={pacPlanDone === pacPlanTotal ? 'positive' : 'warn'} />
                </>
              ) : activeNav === 'PIPE' ? (
                <>
                  <StatCard label="SSV PLANNED" value={`${pipelineStages.plan} / ${pipelineStages.total}`}        helper="Sites with DTE assigned" tone={ACE_BLUE} icon={ClipboardList} />
                  <StatCard label="SSV DONE"    value={`${pipelineStages.done} / ${pipelineStages.total}`}        helper="SSV sites closed"        tone={GREEN}    icon={CheckCircle2} />
                  <StatCard label="PAC PLANNED" value={`${pipelinePacStages.plan} / ${pipelinePacStages.total}`}  helper="Clusters fully planned"  tone="#7c3aed"  icon={Layers} />
                  <StatCard label="PAC DONE"    value={`${pipelinePacStages.done} / ${pipelinePacStages.total}`}  helper="Clusters closed"         tone="#166534"  icon={CheckCircle2} />
                </>
              ) : activeNav === 'MAP' ? (
                <>
                  <StatCard label="MARKERS SHOWN" value={mapMarkers.length} helper={`${mapWorkType} · ${mapStage}`} tone={ACE_BLUE} icon={MapIcon} />
                  <StatCard label="SSV WITH GPS"  value={pipeline.filter(p => { const sk=(p.site_key||extractSite(p.site_code||'').toUpperCase()); return (siteMap[sk]||{}).lat != null }).length} helper="Sites with coords"   tone={GREEN}    icon={CheckCircle2} />
                  <StatCard label="PAC CLUSTERS"  value={pipelinePacClusters.length} helper="With ≥1 GPS site" tone="#7c3aed" icon={Layers} />
                  <StatCard label="TOTAL SITES"   value={pipeline.length + pipelinePacClusters.length} helper="SSV sites + PAC clusters" tone="#0891b2" icon={Activity} />
                </>
              ) : (
                <>
                  <StatCard label="SSV LINES"   value={rows.SSV.length}  helper={`${projShort} · SSV PO`}    tone={ACE_BLUE} icon={Wifi} />
                  <StatCard label="PAC LINES"   value={rows.PAC.length}  helper="SSOA / Cluster"              tone="#7c3aed" icon={Layers} />
                  <StatCard label="FULL ON-AIR" value={metrics.onAirCount} helper="SSV sites ready for work" tone={GREEN}   icon={CheckCircle2} />
                  <StatCard label="DTE PLANNED" value={`${planDone} / ${planTotal}`} helper="Plan DTE assigned" tone="#0891b2" icon={ClipboardList} delta={planTotal ? `${Math.round(planDone/planTotal*100)}%` : null} deltaTone={planDone === planTotal ? 'positive' : 'warn'} />
                </>
              )}
            </section>

            {/* Status chips (SSV/PAC only) */}
            {Object.keys(statusSummary).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(statusSummary).sort((a, b) => b[1] - a[1]).map(([s, cnt]) => {
                  const c = STATUS_COLOR[s] || { bg: '#f1f5f9', text: '#475569' }
                  return (
                    <span
                      key={s}
                      className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-black ring-1 ring-inset"
                      style={{ background: c.bg, color: c.text, ringColor: c.text + '30' }}
                    >
                      {s} · {cnt}
                    </span>
                  )
                })}
              </div>
            )}

            {/* DTE Workload summary — Plan tab only */}
            {activeNav === 'PLAN' && dteListWithLoad.some(d => d.workload > 0) && (
              <Card className="p-5 sm:p-6">
                <div className="flex items-center gap-2 text-sm font-black uppercase text-slate-400">
                  <Users size={17} /> DTE Workload
                </div>
                <h2 className="mt-2 text-xl font-black text-slate-950">Active assignments per engineer</h2>
                <div className="mt-5 flex flex-wrap gap-2">
                  {dteListWithLoad
                    .filter(d => d.workload > 0)
                    .sort((a, b) => b.workload - a.workload)
                    .map(d => {
                      const overload = d.workload >= 10
                      return (
                        <span
                          key={d.employee_code}
                          className={`inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-black ${overload ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-blue-100 bg-blue-50 text-blue-700'}`}
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-full text-white text-[.6rem]" style={{ background: overload ? '#d97706' : ACE_BLUE }}>
                            {initials(d.full_name)}
                          </span>
                          {d.full_name}
                          <span className={`rounded-full px-2 py-0.5 text-[.65rem] ${overload ? 'bg-amber-200/70' : 'bg-blue-200/70'}`}>
                            {d.workload}{overload ? ' ⚠' : ''}
                          </span>
                        </span>
                      )
                    })
                  }
                </div>
              </Card>
            )}

            {/* Content table card */}
            {activeNav === 'MAP' ? (
              <Card className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-black uppercase text-slate-400">
                      <MapIcon size={17} /> Geo View
                    </div>
                    <h2 className="mt-2 text-xl font-black text-slate-950">Map — {projShort} · {mapMarkers.length} markers</h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select value={mapWorkType} onChange={e => setMapWorkType(e.target.value)} className="rounded border border-[#d8dee8] bg-white px-2.5 py-1.5 text-[.75rem] font-bold text-slate-700 outline-none">
                      <option value="ALL">All types</option>
                      <option value="SSV">SSV only</option>
                      <option value="PAC">PAC only</option>
                    </select>
                    <select value={mapStage} onChange={e => setMapStage(e.target.value)} className="rounded border border-[#d8dee8] bg-white px-2.5 py-1.5 text-[.75rem] font-bold text-slate-700 outline-none">
                      <option value="ALL">All stages</option>
                      <option value="UNPLANNED">Unplanned</option>
                      <option value="PLANNED">Planned</option>
                      <option value="DT">DT Done</option>
                      <option value="REPORT">Reported</option>
                      <option value="DONE">Closed</option>
                    </select>
                  </div>
                </div>
                {loading ? (
                  <div className="px-6 py-16 text-center text-sm font-semibold text-slate-400">⏳ Loading…</div>
                ) : (
                  <MapPanel
                    markers={mapMarkers}
                    selected={selectedMarker}
                    onSelect={setSelectedMarker}
                  />
                )}
              </Card>
            ) : activeNav === 'PIPE' ? (
              <div className="flex flex-col gap-5">
                {/* Pipeline SSV */}
                <Card className="overflow-hidden">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-black uppercase text-slate-400">
                        <Wifi size={17} /> SSV Pipeline
                      </div>
                      <h2 className="mt-2 text-xl font-black text-slate-950">By Site · {pipeline.filter(p => !q || (p.site_code || '').toLowerCase().includes(q) || (p.planned_dte_codes || '').toLowerCase().includes(q) || (p.planned_dte_names || '').toLowerCase().includes(q)).length} sites</h2>
                    </div>
                    {loading && <div className="text-xs font-semibold text-slate-400">⏳ Loading…</div>}
                  </div>
                  {loading ? (
                    <div className="px-6 py-16 text-center text-sm font-semibold text-slate-400">⏳ Loading…</div>
                  ) : (
                    <PipelineTable
                      rows={pipeline.filter(p => !q || (p.site_code || '').toLowerCase().includes(q) || (p.planned_dte_codes || '').toLowerCase().includes(q) || (p.planned_dte_names || '').toLowerCase().includes(q))}
                      onMark={markPipelineStage}
                    />
                  )}
                </Card>

                {/* Pipeline PAC */}
                <Card className="overflow-hidden">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-black uppercase text-slate-400">
                        <Layers size={17} /> PAC Pipeline
                      </div>
                      <h2 className="mt-2 text-xl font-black text-slate-950">By RF Cluster · {pipelinePacClusters.filter(g => !q || g.name.toLowerCase().includes(q) || (g.dteName || '').toLowerCase().includes(q)).length} clusters</h2>
                    </div>
                    {loading && <div className="text-xs font-semibold text-slate-400">⏳ Loading…</div>}
                  </div>
                  {loading ? (
                    <div className="px-6 py-16 text-center text-sm font-semibold text-slate-400">⏳ Loading…</div>
                  ) : (
                    <PipelinePacTable
                      clusters={pipelinePacClusters.filter(g => !q || g.name.toLowerCase().includes(q) || (g.dteName || '').toLowerCase().includes(q))}
                      onMark={markPipelineCluster}
                    />
                  )}
                </Card>
              </div>
            ) : activeNav === 'PLAN' ? (
              <div className="flex flex-col gap-5">
                {/* Plan SSV — by Site */}
                <Card className="overflow-hidden">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-black uppercase text-slate-400">
                        <Wifi size={17} /> Plan SSV
                      </div>
                      <h2 className="mt-2 text-xl font-black text-slate-950">By Site · {filtered.length} items</h2>
                    </div>
                    {loading && <div className="text-xs font-semibold text-slate-400">⏳ Loading…</div>}
                  </div>
                  {loading ? (
                    <div className="px-6 py-16 text-center text-sm font-semibold text-slate-400">⏳ Loading…</div>
                  ) : (
                    <PlanDteTable
                      rows={filtered}
                      siteMap={siteMap}
                      dteList={dteListWithLoad}
                      planMap={planMap}
                      onDteChange={onDteChange}
                      lockMap={trackingLockMap}
                    />
                  )}
                </Card>

                {/* Plan PAC — by RF Cluster */}
                <Card className="overflow-hidden">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-black uppercase text-slate-400">
                        <Layers size={17} /> Plan PAC
                      </div>
                      <h2 className="mt-2 text-xl font-black text-slate-950">By RF Cluster · {pacClustersFiltered.length} clusters with Cluster Ready</h2>
                    </div>
                    {loading && <div className="text-xs font-semibold text-slate-400">⏳ Loading…</div>}
                  </div>
                  {loading ? (
                    <div className="px-6 py-16 text-center text-sm font-semibold text-slate-400">⏳ Loading…</div>
                  ) : (
                    <PlanPacTable
                      clusters={pacClustersFiltered}
                      dteList={dteListWithLoad}
                      planMapPac={planMapPac}
                      onPacDteChange={onPacDteChange}
                      lockMap={trackingLockMap}
                    />
                  )}
                </Card>
              </div>
            ) : (
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-black uppercase text-slate-400">
                      {activeNav === 'SSV' ? <Wifi size={17} /> : <Layers size={17} />}
                      {activeNav === 'SSV' ? 'Single Site Verification' : 'PAC · SSOA / Cluster'}
                    </div>
                    <h2 className="mt-2 text-xl font-black text-slate-950">{projShort} · {filtered.length} {activeNav === 'PAC' ? 'PO lines (grouped by cluster)' : 'items'}</h2>
                  </div>
                  {loading && <div className="text-xs font-semibold text-slate-400">⏳ Loading…</div>}
                </div>
                {loading ? (
                  <div className="px-6 py-16 text-center text-sm font-semibold text-slate-400">⏳ Loading…</div>
                ) : activeNav === 'PAC' ? (
                  <PacClusterTable
                    filtered={filtered}
                    siteMap={siteMap}
                    trackingDone={trackingDone}
                  />
                ) : (
                  <MonitorTable
                    activeTab={activeNav}
                    filtered={filtered}
                    siteMap={siteMap}
                    trackingDone={trackingDone}
                  />
                )}
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-7 left-1/2 z-[999] flex max-w-[min(560px,90vw)] -translate-x-1/2 items-center gap-3 rounded-2xl px-5 py-3 text-sm font-black text-white shadow-[0_24px_70px_rgba(15,23,42,0.25)] ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}
        >
          {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  )
}

/* ── SSV / PAC monitor table ── */
function DoneBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3, marginLeft: 6,
      padding: '2px 8px', borderRadius: 99, fontSize: '.65rem', fontWeight: 800,
      background: '#dcfce7', color: '#15803d',
    }}>✓ Done</span>
  )
}

// PAC inventory grouped by RF Cluster Name — 1 row per Cluster (e.g.
// EAS-FLASH-0012), expandable to show the child POs (Site Codes) inside.
function PacClusterTable({ filtered, siteMap, trackingDone = { poId: {}, cluster: {} } }) {
  const [openClusters, setOpenClusters] = useState(() => new Set())

  const clusters = useMemo(() => {
    const groups = new Map()
    filtered.forEach(p => {
      const { clusterName, matched } = resolveClusterName(p, siteMap)
      if (!groups.has(clusterName)) {
        groups.set(clusterName, { name: clusterName, matched, pos: [], readyDates: [], owner: null })
      }
      const g = groups.get(clusterName)
      g.pos.push(p)
      const geo = siteMap[(p.hw_data?.['Site Code'] || p.cluster_site || '').toUpperCase()] || {}
      if (geo.cluster_ready) g.readyDates.push(geo.cluster_ready)
      if (!g.owner && geo.rf_cluster_owner) g.owner = geo.rf_cluster_owner
    })
    return Array.from(groups.values())
      .map(g => ({ ...g, cluster_ready: g.readyDates.sort().slice(-1)[0] || null }))
      .sort((a, b) => b.pos.length - a.pos.length || String(a.name).localeCompare(String(b.name)))
  }, [filtered, siteMap])

  function toggle(name) {
    setOpenClusters(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n })
  }

  if (clusters.length === 0) {
    return <div className="px-6 py-16 text-center text-sm font-semibold text-slate-400">No data</div>
  }

  // Original PAC headers (same as MonitorTable PAC) — column 1 doubles as expand toggle.
  const headers = ['#', 'ID', 'Site Code', 'PO NO.', 'RF Cluster Name', 'Cluster Owner', 'Cluster Ready', 'Latitude', 'Longitude', 'Item Description']

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.76rem' }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            {headers.map(h => (
              <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 700, borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {clusters.map(c => {
            const open = openClusters.has(c.name)
            const clusterDone = !!trackingDone.cluster[(c.name || '').toUpperCase()]
            const first = c.pos[0]?.hw_data || {}
            return (
              <React.Fragment key={c.name}>
                {/* Cluster parent row — 1 line per RF Cluster */}
                <tr
                  onClick={() => toggle(c.name)}
                  style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: open ? '#f5f3ff' : '#fff', fontWeight: 700 }}
                >
                  <td style={{ padding: '8px 12px', color: '#7c3aed', fontWeight: 900 }}>{open ? '▾' : '▸'}</td>
                  <td style={{ padding: '8px 12px', color: '#94a3b8', fontSize: '.7rem' }}>{c.pos.length} PO</td>
                  <td style={{ padding: '8px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>{c.pos.length} sites</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: '.72rem', color: '#64748b', whiteSpace: 'nowrap' }}>{first['PO NO.'] || c.pos[0]?.po_number || '—'}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 900, color: c.matched ? '#6d28d9' : '#475569', whiteSpace: 'nowrap' }}>
                    {c.name}
                    {clusterDone && <span style={{ marginLeft: 8 }}><DoneBadge /></span>}
                    {!c.matched && <span style={{ marginLeft: 8, fontSize: '.6rem', fontWeight: 800, color: '#b45309', background: '#fef3c7', padding: '1px 7px', borderRadius: 99 }}>รอ ISDP</span>}
                  </td>
                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', color: c.owner ? '#334155' : '#cbd5e1', fontWeight: 600 }}>{c.owner || '—'}</td>
                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', color: c.cluster_ready ? '#1e40af' : '#cbd5e1', fontWeight: 700 }}>{c.cluster_ready ? String(c.cluster_ready).slice(0, 10) : '—'}</td>
                  <td style={{ padding: '8px 12px', color: '#cbd5e1' }}>—</td>
                  <td style={{ padding: '8px 12px', color: '#cbd5e1' }}>—</td>
                  <td style={{ padding: '8px 12px', color: '#cbd5e1' }}>—</td>
                </tr>
                {/* Child PO rows — original per-PO columns */}
                {open && c.pos.map(p => {
                  const d = p.hw_data || {}
                  const geo = siteGeo(d['Site Code'] || p.cluster_site || '', siteMap)
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f8fafc', background: '#fbfaff' }}>
                      <td />
                      <td style={{ padding: '5px 12px', fontFamily: 'monospace', fontSize: '.68rem', color: '#475569', whiteSpace: 'nowrap' }}>{d['ID'] || '—'}</td>
                      <td style={{ padding: '5px 12px 5px 24px', color: '#64748b', whiteSpace: 'nowrap', fontSize: '.72rem' }}>{d['Site Code'] || p.cluster_site || '—'}</td>
                      <td style={{ padding: '5px 12px', fontFamily: 'monospace', fontSize: '.72rem', whiteSpace: 'nowrap' }}>{d['PO NO.'] || p.po_number || '—'}</td>
                      <td style={{ padding: '5px 12px', color: '#cbd5e1' }}>↳</td>
                      <td style={{ padding: '5px 12px', color: '#cbd5e1' }}>—</td>
                      <td style={{ padding: '5px 12px', color: '#cbd5e1' }}>—</td>
                      <td style={{ padding: '5px 12px', textAlign: 'right', fontFamily: 'monospace', fontSize: '.7rem', color: geo.lat != null ? '#0891b2' : '#cbd5e1' }}>{geo.lat != null ? Number(geo.lat).toFixed(6) : '—'}</td>
                      <td style={{ padding: '5px 12px', textAlign: 'right', fontFamily: 'monospace', fontSize: '.7rem', color: geo.lng != null ? '#0891b2' : '#cbd5e1' }}>{geo.lng != null ? Number(geo.lng).toFixed(6) : '—'}</td>
                      <td style={{ padding: '5px 12px', color: '#94a3b8', fontSize: '.72rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320 }}>{d['Item Description'] || p.item_dis || '—'}</td>
                    </tr>
                  )
                })}
              </React.Fragment>
            )
          })}
        </tbody>
        <tfoot>
          <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
            <td colSpan={headers.length} style={{ padding: '7px 12px', color: '#64748b', fontSize: '.72rem', fontWeight: 700 }}>
              {clusters.length} cluster · {filtered.length} PO lines
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function MonitorTable({ activeTab, filtered, siteMap, trackingDone = { poId: {}, cluster: {} } }) {
  const headers = activeTab === 'SSV'
    ? ['#', 'ID', 'Site', 'Site Code', 'PO Status', 'Layers', 'Full On-Air', 'Latitude', 'Longitude', 'Item Description']
    : ['#', 'ID', 'Site Code', 'PO Status', 'RF Cluster Name', 'Cluster Ready', 'Item Description']
  const colSpan = activeTab === 'SSV' ? 10 : 7

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.76rem' }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            {headers.map(h => (
              <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Latitude' || h === 'Longitude' ? 'right' : 'left', color: '#64748b', fontWeight: 700, borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((p, i) => {
            const d        = p.hw_data || {}
            const rawSite  = d['Site Code'] || p.cluster_site || ''
            const poStatus = d['PO Status'] || p.hw_po_status
            const itemDis  = d['Item Description'] || p.item_dis || ''
            const geo      = siteGeo(rawSite, siteMap)
            // Workflow Done (⑤ Check Pass): SSV keyed by po_id, PAC by cluster_site.
            const isDone   = activeTab === 'SSV'
              ? !!trackingDone.poId[p.id]
              : !!trackingDone.cluster[(p.cluster_site || rawSite || '').toUpperCase()]
            return (
              <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                <td style={{ padding: '6px 12px', color: '#cbd5e1', fontSize: '.68rem' }}>{i + 1}</td>
                <td style={{ padding: '6px 12px', fontFamily: 'monospace', fontSize: '.7rem', color: '#475569', whiteSpace: 'nowrap' }}>{d['ID'] || '—'}</td>

                {activeTab === 'SSV' && (
                  <td style={{ padding: '6px 12px', fontWeight: 700, color: ACE_BLUE, whiteSpace: 'nowrap' }}>{extractSite(rawSite)}</td>
                )}

                <td style={{ padding: '6px 12px', color: '#64748b', fontSize: '.72rem', whiteSpace: 'nowrap' }}>{rawSite || '—'}</td>
                <td style={{ padding: '6px 12px', whiteSpace: 'nowrap' }}>{statusChip(poStatus)}{isDone && <DoneBadge />}</td>

                {activeTab === 'SSV' ? (<>
                  <td style={{ padding: '6px 12px', whiteSpace: 'nowrap', fontWeight: 600, color: '#7c3aed' }}>{extractLayers(itemDis)}</td>
                  <td style={{ padding: '6px 12px', whiteSpace: 'nowrap', color: geo.full_on_air ? GREEN : '#cbd5e1', fontWeight: geo.full_on_air ? 600 : 400 }}>{geo.full_on_air || '—'}</td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: 'monospace', fontSize: '.72rem', color: geo.lat != null ? '#0891b2' : '#cbd5e1' }}>{geo.lat != null ? geo.lat.toFixed(6) : '—'}</td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: 'monospace', fontSize: '.72rem', color: geo.lng != null ? '#0891b2' : '#cbd5e1' }}>{geo.lng != null ? geo.lng.toFixed(6) : '—'}</td>
                </>) : (<>
                  <td style={{ padding: '6px 12px', whiteSpace: 'nowrap', color: geo.rf_cluster_name ? '#1e40af' : '#cbd5e1', fontWeight: geo.rf_cluster_name ? 600 : 400 }}>{geo.rf_cluster_name || '—'}</td>
                  <td style={{ padding: '6px 12px', whiteSpace: 'nowrap', color: geo.cluster_ready ? GREEN : '#cbd5e1', fontWeight: geo.cluster_ready ? 600 : 400 }}>{geo.cluster_ready || '—'}</td>
                </>)}

                <td style={{ padding: '6px 12px', color: '#475569', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={itemDis}>{itemDis || '—'}</td>
              </tr>
            )
          })}
          {filtered.length === 0 && (
            <tr><td colSpan={colSpan} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No data</td></tr>
          )}
        </tbody>
        {filtered.length > 0 && (
          <tfoot>
            <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
              <td colSpan={colSpan} style={{ padding: '7px 12px', color: '#64748b', fontSize: '.72rem' }}>Total {filtered.length} items</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}

/* ── Pipeline Gantt table — Site SSV → DT Done → Reporting → Done ── */
function fmtDate(iso) {
  if (!iso) return null
  return String(iso).slice(0, 10)
}
function daysBetween(a, b) {
  if (!a || !b) return null
  const da = new Date(a).getTime()
  const db = new Date(b).getTime()
  if (Number.isNaN(da) || Number.isNaN(db)) return null
  return Math.max(0, Math.round((db - da) / (1000 * 60 * 60 * 24)))
}

function StageBadge({ tone, label, sub }) {
  const tones = {
    blue:   { bg: '#dbeafe', fg: '#1d4ed8' },
    green:  { bg: '#dcfce7', fg: '#15803d' },
    amber:  { bg: '#fef3c7', fg: '#92400e' },
    dark:   { bg: '#d1fae5', fg: '#065f46' },
    muted:  { bg: '#f1f5f9', fg: '#94a3b8' },
    purple: { bg: '#f3e8ff', fg: '#7c3aed' },
  }
  const t = tones[tone] || tones.muted
  return (
    <span style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start',
      padding: '4px 8px', borderRadius: 6,
      background: t.bg, color: t.fg, fontSize: '.7rem', fontWeight: 700,
      lineHeight: 1.2, whiteSpace: 'nowrap',
    }}>
      <span>{label}</span>
      {sub && <span style={{ fontSize: '.62rem', fontWeight: 600, opacity: .85 }}>{sub}</span>}
    </span>
  )
}

function stageInfo(row) {
  const st = (row.workflow_status || '').toUpperCase()
  const outcome = (row.dt_outcome || '').toUpperCase()
  const stages = []
  // Stage 1: Plan
  if (row.planned_dte_codes) {
    stages.push({ tone: 'blue',  label: '① Plan', sub: row.planned_dte_names || row.planned_dte_codes })
  } else {
    stages.push({ tone: 'muted', label: '① Plan', sub: 'not assigned' })
  }
  // Stage 2: DT
  if (row.dt_done_at) {
    if (outcome === 'ISSUE') {
      stages.push({ tone: 'amber', label: '② DT Issue ⚠', sub: fmtDate(row.dt_done_at) })
    } else if (outcome === 'STOP') {
      stages.push({ tone: 'amber', label: '② DT Stopped', sub: fmtDate(row.dt_done_at) })
    } else {
      stages.push({ tone: 'green', label: '② DT Done', sub: fmtDate(row.dt_done_at) })
    }
  } else if (row.dt_started_at) {
    stages.push({ tone: 'amber', label: '② DT…', sub: `started ${fmtDate(row.dt_started_at)}` })
  } else {
    stages.push({ tone: 'muted', label: '② DT', sub: '—' })
  }
  // Stage 3: Reporting (Phase 2 will set reported_at / workflow_status=LEADER_CHECKING)
  if (row.reported_at || st === 'LEADER_APPROVED' || st === 'CLOSED') {
    stages.push({ tone: 'purple', label: '③ Reported', sub: fmtDate(row.reported_at) || '—' })
  } else if (st === 'LEADER_CHECKING' || row.dt_done_at) {
    stages.push({ tone: 'amber', label: '③ Report…', sub: 'in review' })
  } else {
    stages.push({ tone: 'muted', label: '③ Report', sub: '—' })
  }
  // Stage 4: Done
  if (row.done_at || st === 'CLOSED' || st === 'LEADER_APPROVED') {
    stages.push({ tone: 'dark', label: '④ Done', sub: fmtDate(row.done_at) || st })
  } else {
    stages.push({ tone: 'muted', label: '④ Done', sub: '—' })
  }
  return stages
}

function PipelineActions({ row, onMark }) {
  const hasDtDone   = !!row.dt_done_at
  const hasReported = !!row.reported_at
  const hasDone     = !!row.done_at
  const btn = (label, action, color, disabled = false) => (
    <button
      onClick={() => !disabled && onMark(row.po_id, action)}
      disabled={disabled}
      style={{
        padding: '3px 8px', borderRadius: 5,
        border: `1px solid ${disabled ? '#e2e8f0' : color}`,
        color: disabled ? '#cbd5e1' : color,
        background: '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '.7rem', fontWeight: 700, whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
  if (hasDone) {
    return (
      <div style={{ display: 'flex', gap: 4 }}>
        <span style={{ fontSize: '.7rem', color: '#16a34a', fontWeight: 700 }}>✓ Closed</span>
        {btn('Undo', 'unmark-done', '#94a3b8')}
      </div>
    )
  }
  if (hasReported) {
    return (
      <div style={{ display: 'flex', gap: 4 }}>
        {btn('Mark Done', 'mark-done', '#166534')}
        {btn('Undo', 'unmark-reported', '#94a3b8')}
      </div>
    )
  }
  if (hasDtDone) {
    return btn('Mark Reported', 'mark-reported', '#b45309')
  }
  return <span style={{ fontSize: '.7rem', color: '#cbd5e1', fontStyle: 'italic' }}>waiting DT…</span>
}

function PipelineTable({ rows, onMark }) {
  const headers = ['#', 'Site', 'DTE', 'Plan', 'DT', 'Report', 'Done', 'Lead Time', 'PO', 'Action']
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.76rem' }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            {headers.map(h => (
              <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 700, borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((p, i) => {
            const stages = stageInfo(p)
            const leadTime = daysBetween(p.planned_at, p.done_at) ?? daysBetween(p.planned_at, p.dt_done_at) ?? null
            const completed = p.done_at || (p.workflow_status || '').toUpperCase() === 'LEADER_APPROVED' || (p.workflow_status || '').toUpperCase() === 'CLOSED'
            return (
              <tr key={p.po_id} style={{ borderBottom: '1px solid #f1f5f9', background: completed ? '#f0fdf4' : (i % 2 === 0 ? '#fff' : '#fafbfc') }}>
                <td style={{ padding: '6px 12px', color: '#cbd5e1', fontSize: '.68rem' }}>{i + 1}</td>
                <td style={{ padding: '6px 12px', fontWeight: 700, color: ACE_BLUE, whiteSpace: 'nowrap' }}>
                  {extractSite(p.site_code)}
                  <div style={{ fontSize: '.65rem', color: '#94a3b8', fontWeight: 400 }}>{p.site_code}</div>
                </td>
                <td style={{ padding: '6px 12px', color: '#475569', whiteSpace: 'nowrap' }}>
                  {p.planned_dte_names || <span style={{ color: '#cbd5e1' }}>—</span>}
                  {p.planned_dte_codes && (
                    <div style={{ fontSize: '.62rem', color: '#94a3b8', fontFamily: 'monospace' }}>{p.planned_dte_codes}</div>
                  )}
                </td>
                {stages.map((s, idx) => (
                  <td key={idx} style={{ padding: '6px 8px' }}>
                    <StageBadge tone={s.tone} label={s.label} sub={s.sub} />
                  </td>
                ))}
                <td style={{ padding: '6px 12px', color: '#475569', whiteSpace: 'nowrap', fontWeight: 600 }}>
                  {leadTime != null ? `${leadTime}d` : '—'}
                </td>
                <td style={{ padding: '6px 12px', color: '#64748b', fontSize: '.7rem', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                  {p.po_number}
                  <div style={{ fontSize: '.62rem', color: '#94a3b8' }}>Line {p.po_line}</div>
                </td>
                <td style={{ padding: '6px 12px', whiteSpace: 'nowrap' }}>
                  <PipelineActions row={p} onMark={onMark} />
                </td>
              </tr>
            )
          })}
          {rows.length === 0 && (
            <tr><td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No pipeline data</td></tr>
          )}
        </tbody>
        {rows.length > 0 && (
          <tfoot>
            <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
              <td colSpan={10} style={{ padding: '7px 12px', color: '#64748b', fontSize: '.72rem' }}>
                Total {rows.length} sites
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}

/* ── Pipeline PAC table — group by RF Cluster Name with bulk actions ── */
function StageProgress({ count, total, tone }) {
  const tones = {
    blue:   { bg: '#dbeafe', fg: '#1d4ed8' },
    green:  { bg: '#dcfce7', fg: '#15803d' },
    amber:  { bg: '#fef3c7', fg: '#92400e' },
    dark:   { bg: '#d1fae5', fg: '#065f46' },
    muted:  { bg: '#f1f5f9', fg: '#94a3b8' },
    purple: { bg: '#f3e8ff', fg: '#7c3aed' },
  }
  let resolved = tone
  if (!resolved) {
    if (total === 0)        resolved = 'muted'
    else if (count === 0)   resolved = 'muted'
    else if (count < total) resolved = 'amber'
    else                    resolved = 'green'
  }
  const t = tones[resolved] || tones.muted
  return (
    <span style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start',
      padding: '4px 8px', borderRadius: 6,
      background: t.bg, color: t.fg, fontSize: '.72rem', fontWeight: 700,
      lineHeight: 1.2, whiteSpace: 'nowrap', minWidth: 50, textAlign: 'left',
    }}>
      <span>{count}/{total}</span>
      <span style={{ fontSize: '.62rem', fontWeight: 600, opacity: .85 }}>
        {total === 0 ? '—' : count === total ? '✓ done' : count === 0 ? 'pending' : `${Math.round((count / total) * 100)}%`}
      </span>
    </span>
  )
}

function PipelinePacActions({ cluster, onMark }) {
  const total = cluster.stats.total
  const allDt       = cluster.stats.dt     === total && total > 0
  const allReported = cluster.stats.report === total && total > 0
  const allDone     = cluster.stats.done   === total && total > 0
  const btn = (label, action, color, disabled = false) => (
    <button
      onClick={() => !disabled && onMark(cluster.name, cluster.poIds, action)}
      disabled={disabled}
      style={{
        padding: '3px 8px', borderRadius: 5,
        border: `1px solid ${disabled ? '#e2e8f0' : color}`,
        color: disabled ? '#cbd5e1' : color,
        background: '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '.7rem', fontWeight: 700, whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
  if (allDone) {
    return (
      <div style={{ display: 'flex', gap: 4 }}>
        <span style={{ fontSize: '.7rem', color: '#16a34a', fontWeight: 700 }}>✓ All closed</span>
        {btn('Undo all', 'unmark-done', '#94a3b8')}
      </div>
    )
  }
  if (allReported) {
    return (
      <div style={{ display: 'flex', gap: 4 }}>
        {btn(`Mark all Done (${total})`, 'mark-done', '#166534')}
        {btn('Undo report', 'unmark-reported', '#94a3b8')}
      </div>
    )
  }
  if (allDt) {
    return btn(`Mark all Reported (${total})`, 'mark-reported', '#b45309')
  }
  return <span style={{ fontSize: '.7rem', color: '#cbd5e1', fontStyle: 'italic' }}>waiting DT… ({cluster.stats.dt}/{total})</span>
}

function PipelinePacTable({ clusters, onMark }) {
  const headers = ['#', 'Cluster', 'DTE', 'Sites', '① Plan', '② DT', '③ Report', '④ Done', 'Cluster Ready', 'Action']
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.76rem' }}>
        <thead>
          <tr style={{ background: '#faf5ff' }}>
            {headers.map(h => (
              <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#7c3aed', fontWeight: 700, borderBottom: '2px solid #e9d5ff', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {clusters.map((g, i) => {
            const total = g.stats.total
            const allDone = g.stats.done === total && total > 0
            return (
              <tr key={g.name} style={{ borderBottom: '1px solid #f1f5f9', background: allDone ? '#f0fdf4' : (i % 2 === 0 ? '#fff' : '#fafbfc') }}>
                <td style={{ padding: '6px 12px', color: '#cbd5e1', fontSize: '.68rem' }}>{i + 1}</td>
                <td style={{ padding: '6px 12px', fontWeight: 700, color: '#1e40af', whiteSpace: 'nowrap' }}>
                  {g.name}
                  <div style={{ fontSize: '.62rem', color: '#94a3b8', fontWeight: 400 }}>{total} PO line{total !== 1 ? 's' : ''}</div>
                </td>
                <td style={{ padding: '6px 12px', color: '#475569', whiteSpace: 'nowrap' }}>
                  {g.dteName || <span style={{ color: '#cbd5e1' }}>—</span>}
                  {g.dteCodes.length > 0 && (
                    <div style={{ fontSize: '.62rem', color: g.dteMixed ? '#b45309' : '#94a3b8', fontFamily: 'monospace', fontWeight: g.dteMixed ? 700 : 400 }}>
                      {g.dteMixed ? `${g.dteCodes.length} DTEs (mixed)` : g.dteCodes[0]}
                    </div>
                  )}
                </td>
                <td style={{ padding: '6px 12px', textAlign: 'center', color: '#475569', fontWeight: 600 }}>{g.siteCount}</td>
                <td style={{ padding: '6px 8px' }}><StageProgress count={g.stats.plan}   total={total} tone={g.stats.plan === total && total > 0 ? 'blue' : undefined} /></td>
                <td style={{ padding: '6px 8px' }}><StageProgress count={g.stats.dt}     total={total} /></td>
                <td style={{ padding: '6px 8px' }}><StageProgress count={g.stats.report} total={total} tone={g.stats.report === total && total > 0 ? 'purple' : undefined} /></td>
                <td style={{ padding: '6px 8px' }}><StageProgress count={g.stats.done}   total={total} tone={g.stats.done === total && total > 0 ? 'dark' : undefined} /></td>
                <td style={{ padding: '6px 12px', whiteSpace: 'nowrap', color: g.cluster_ready ? GREEN : '#cbd5e1', fontWeight: 600 }}>
                  {g.cluster_ready || '—'}
                </td>
                <td style={{ padding: '6px 12px', whiteSpace: 'nowrap' }}>
                  <PipelinePacActions cluster={g} onMark={onMark} />
                </td>
              </tr>
            )
          })}
          {clusters.length === 0 && (
            <tr><td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No PAC clusters</td></tr>
          )}
        </tbody>
        {clusters.length > 0 && (
          <tfoot>
            <tr style={{ background: '#faf5ff', fontWeight: 700 }}>
              <td colSpan={10} style={{ padding: '7px 12px', color: '#7c3aed', fontSize: '.72rem' }}>
                Total {clusters.length} clusters · {clusters.reduce((s, g) => s + g.stats.total, 0)} PO lines
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}

/* ── Map Panel — OSM tile renderer with stage-colored markers ── */
const MAP_TILE_SIZE  = 256
const MAP_DEF_ZOOM   = 8
const MAP_W          = 980
const MAP_H          = 520

const STAGE_COLOR = {
  UNPLANNED: '#94a3b8',
  PLANNED:   '#2447d8',
  DT:        '#16a34a',
  REPORT:    '#7c3aed',
  DONE:      '#065f46',
}
const STAGE_LABEL = {
  UNPLANNED: 'Unplanned',
  PLANNED:   'Planned',
  DT:        'DT Done',
  REPORT:    'Reported',
  DONE:      'Closed',
}

function lonLatToWorld(lng, lat, zoom) {
  const scale = MAP_TILE_SIZE * 2 ** zoom
  const sinLat = Math.sin((Number(lat) * Math.PI) / 180)
  const x = ((Number(lng) + 180) / 360) * scale
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale
  return { x, y }
}

function MapPanel({ markers, selected, onSelect }) {
  const [zoom, setZoom] = useState(MAP_DEF_ZOOM)
  const [pan,  setPan]  = useState({ x: 0, y: 0 })
  const [drag, setDrag] = useState(null)

  const center = useMemo(() => {
    if (!markers.length) return { lat: 13.7563, lng: 100.5018 }   // Bangkok fallback
    const lats = markers.map(m => m.lat)
    const lngs = markers.map(m => m.lng)
    return {
      lat: (Math.min(...lats) + Math.max(...lats)) / 2,
      lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
    }
  }, [markers])

  const tileMap = useMemo(() => {
    const c = lonLatToWorld(center.lng, center.lat, zoom)
    const leftWorld = c.x - MAP_W / 2 + pan.x
    const topWorld  = c.y - MAP_H / 2 + pan.y
    const startTileX = Math.floor(leftWorld / MAP_TILE_SIZE)
    const startTileY = Math.floor(topWorld  / MAP_TILE_SIZE)
    const endTileX   = Math.floor((leftWorld + MAP_W) / MAP_TILE_SIZE)
    const endTileY   = Math.floor((topWorld  + MAP_H) / MAP_TILE_SIZE)
    const tiles = []
    for (let x = startTileX; x <= endTileX; x += 1) {
      for (let y = startTileY; y <= endTileY; y += 1) {
        tiles.push({
          key: `${zoom}-${x}-${y}`,
          left: x * MAP_TILE_SIZE - leftWorld,
          top:  y * MAP_TILE_SIZE - topWorld,
          src:  `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`,
        })
      }
    }
    return { leftWorld, topWorld, tiles }
  }, [center, zoom, pan])

  const placedMarkers = useMemo(() => (
    markers.map(m => {
      const w = lonLatToWorld(m.lng, m.lat, zoom)
      return { ...m, x: w.x - tileMap.leftWorld, y: w.y - tileMap.topWorld }
    }).filter(m => m.x >= -20 && m.x <= MAP_W + 20 && m.y >= -20 && m.y <= MAP_H + 20)
  ), [markers, tileMap, zoom])

  function changeZoom(next) { setZoom(Math.max(6, Math.min(13, next))) }
  function onWheel(e) { e.preventDefault(); changeZoom(zoom + (e.deltaY > 0 ? -1 : 1)) }
  function onPointerDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDrag({ pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y })
  }
  function onPointerMove(e) {
    if (!drag) return
    setPan({
      x: drag.panX - (e.clientX - drag.startX),
      y: drag.panY - (e.clientY - drag.startY),
    })
  }
  function onPointerUp(e) { if (drag?.pointerId === e.pointerId) setDrag(null) }
  function recenter() { setPan({ x: 0, y: 0 }); setZoom(MAP_DEF_ZOOM) }

  const counts = useMemo(() => {
    const c = { UNPLANNED: 0, PLANNED: 0, DT: 0, REPORT: 0, DONE: 0 }
    markers.forEach(m => { c[m.stage] = (c[m.stage] || 0) + 1 })
    return c
  }, [markers])

  return (
    <div style={{ padding: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: 12 }}>
        {/* Map */}
        <div
          style={{
            position: 'relative', width: '100%', height: MAP_H, overflow: 'hidden',
            border: '1px solid #edf0f5', borderRadius: 8, background: '#eef3f8',
            touchAction: 'none', cursor: drag ? 'grabbing' : 'grab',
          }}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {tileMap.tiles.map(t => (
            <img key={t.key} src={t.src} alt=""
              style={{ position: 'absolute', left: t.left, top: t.top, width: MAP_TILE_SIZE, height: MAP_TILE_SIZE, userSelect: 'none', pointerEvents: 'none' }}
              draggable={false}
            />
          ))}

          {placedMarkers.map(m => {
            const color = STAGE_COLOR[m.stage] || '#64748b'
            const isSel = selected?.key === m.key
            const size = m.work_type === 'PAC' ? 14 : 11
            return (
              <button
                key={m.key}
                onClick={(e) => { e.stopPropagation(); onSelect(m) }}
                title={`${m.work_type} · ${m.site_code || m.cluster_name} · ${STAGE_LABEL[m.stage]}`}
                style={{
                  position: 'absolute',
                  left: m.x, top: m.y,
                  width: isSel ? size + 6 : size, height: isSel ? size + 6 : size,
                  border: m.work_type === 'PAC' ? '2px solid #fff' : '2px solid #fff',
                  borderRadius: m.work_type === 'PAC' ? 4 : 99,    // SSV=circle, PAC=square
                  background: color,
                  boxShadow: isSel ? '0 0 0 3px rgba(36,71,216,.35)' : '0 2px 8px rgba(16,24,40,.35)',
                  transform: 'translate(-50%, -50%)',
                  cursor: 'pointer', padding: 0, zIndex: isSel ? 5 : 2,
                }}
              />
            )
          })}

          <button
            onClick={recenter}
            title="Recenter map"
            style={{
              position: 'absolute', right: 8, top: 8, zIndex: 4,
              padding: '5px 10px', borderRadius: 6,
              border: '1px solid #d8dee8', background: 'rgba(255,255,255,.92)',
              cursor: 'pointer', fontSize: '.72rem', fontWeight: 800, color: '#344054',
            }}
          >↻ Recenter</button>

          <div style={{ position: 'absolute', right: 8, bottom: 6, zIndex: 3, padding: '3px 6px', borderRadius: 4, color: '#475467', background: 'rgba(255,255,255,.82)', fontSize: '.66rem', fontWeight: 700 }}>
            © OpenStreetMap · scroll to zoom · drag to pan
          </div>
        </div>

        {/* Side panel: legend + selected detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          {/* Legend */}
          <div style={{ padding: 12, borderRadius: 8, border: '1px solid #edf0f5', background: '#fff' }}>
            <div style={{ fontSize: '.74rem', fontWeight: 900, color: '#1d2939', marginBottom: 8 }}>Legend</div>
            <div style={{ display: 'grid', gap: 5 }}>
              {Object.entries(STAGE_COLOR).map(([key, color]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.72rem', color: '#475569', fontWeight: 700 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 99, background: color, display: 'inline-block', border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
                  <span>{STAGE_LABEL[key]}</span>
                  <span style={{ marginLeft: 'auto', color: '#94a3b8', fontWeight: 600 }}>{counts[key] || 0}</span>
                </div>
              ))}
              <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px dashed #e2e8f0', fontSize: '.66rem', color: '#94a3b8' }}>
                ● SSV (circle) · ■ PAC (square)
              </div>
            </div>
          </div>

          {/* Selected detail */}
          {selected ? (
            <div style={{ padding: 12, borderRadius: 8, border: '1px solid #c7d2fe', background: '#f5f7ff' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: '.78rem', fontWeight: 900, color: '#1e40af' }}>
                  {selected.work_type === 'PAC' ? '🔧 PAC Cluster' : '📡 SSV Site'}
                </div>
                <button onClick={() => onSelect(null)} style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid #d8dee8', background: '#fff', cursor: 'pointer', fontSize: '.78rem' }}>✕</button>
              </div>
              <div style={{ display: 'grid', gap: 4, fontSize: '.72rem' }}>
                <div><span style={{ color: '#94a3b8', fontWeight: 700 }}>Site/Cluster: </span><span style={{ color: '#1d2939', fontWeight: 800 }}>{selected.site_code || selected.cluster_name}</span></div>
                {selected.cluster_name && selected.work_type === 'SSV' && (
                  <div><span style={{ color: '#94a3b8', fontWeight: 700 }}>RF Cluster: </span><span style={{ color: '#1d2939', fontWeight: 700 }}>{selected.cluster_name}</span></div>
                )}
                <div><span style={{ color: '#94a3b8', fontWeight: 700 }}>Stage: </span>
                  <span style={{ background: STAGE_COLOR[selected.stage], color: '#fff', padding: '2px 8px', borderRadius: 4, fontWeight: 800, fontSize: '.66rem' }}>
                    {STAGE_LABEL[selected.stage]}
                  </span>
                </div>
                <div><span style={{ color: '#94a3b8', fontWeight: 700 }}>DTE: </span>
                  <span style={{ color: '#1d2939', fontWeight: 700 }}>
                    {selected.dte_name || selected.dte_code || <span style={{ color: '#cbd5e1' }}>—</span>}
                    {selected.dte_mixed && <span style={{ color: '#b45309', marginLeft: 5 }}> (mixed)</span>}
                  </span>
                </div>
                {selected.work_type === 'SSV' && selected.full_on_air && (
                  <div><span style={{ color: '#94a3b8', fontWeight: 700 }}>Full On-Air: </span><span style={{ color: GREEN, fontWeight: 700 }}>{selected.full_on_air}</span></div>
                )}
                {selected.work_type === 'PAC' && (
                  <>
                    {selected.cluster_ready && (
                      <div><span style={{ color: '#94a3b8', fontWeight: 700 }}>Cluster Ready: </span><span style={{ color: GREEN, fontWeight: 700 }}>{selected.cluster_ready}</span></div>
                    )}
                    <div><span style={{ color: '#94a3b8', fontWeight: 700 }}>PO Lines: </span><span style={{ color: '#7c3aed', fontWeight: 800 }}>{selected.po_count}</span></div>
                    <div><span style={{ color: '#94a3b8', fontWeight: 700 }}>Sites: </span><span style={{ color: '#1d2939', fontWeight: 700 }}>{selected.site_count}</span></div>
                  </>
                )}
                {selected.work_type === 'SSV' && selected.po_number && (
                  <div><span style={{ color: '#94a3b8', fontWeight: 700 }}>PO No.: </span><span style={{ color: '#1d2939', fontFamily: 'monospace', fontSize: '.7rem' }}>{selected.po_number}</span></div>
                )}
                <div><span style={{ color: '#94a3b8', fontWeight: 700 }}>Coords: </span><span style={{ color: '#0891b2', fontFamily: 'monospace', fontSize: '.7rem' }}>{selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}</span></div>
              </div>
            </div>
          ) : (
            <div style={{ padding: 12, borderRadius: 8, border: '1px solid #edf0f5', background: '#fbfcff', textAlign: 'center', color: '#94a3b8', fontSize: '.72rem' }}>
              Click a marker to view details
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Plan PAC table — grouped by RF Cluster Name ── */
function PlanPacTable({ clusters, dteList, planMapPac, onPacDteChange, lockMap = {} }) {
  const headers = ['#', 'RF Cluster Name', 'Cluster Ready', 'Sites', 'PO Lines', 'DTE']
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.76rem' }}>
        <thead>
          <tr style={{ background: '#faf5ff' }}>
            {headers.map(h => (
              <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Sites' || h === 'PO Lines' ? 'center' : 'left', color: '#7c3aed', fontWeight: 700, borderBottom: '2px solid #e9d5ff', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {clusters.map((c, i) => {
            const plan = planMapPac[c.name] || {}
            return (
              <tr key={c.name} style={{ borderBottom: '1px solid #f1f5f9', background: plan.code ? (i % 2 === 0 ? '#f0fdf4' : '#ecfdf5') : (i % 2 === 0 ? '#fff' : '#fafbfc') }}>
                <td style={{ padding: '6px 12px', color: '#cbd5e1', fontSize: '.68rem' }}>{i + 1}</td>

                <td style={{ padding: '6px 12px', fontWeight: 700, color: '#1e40af', whiteSpace: 'nowrap' }}>
                  {c.name}
                </td>

                <td style={{ padding: '6px 12px', whiteSpace: 'nowrap', color: GREEN, fontWeight: 600 }}>
                  {c.cluster_ready || '—'}
                </td>

                <td style={{ padding: '6px 12px', textAlign: 'center', fontWeight: 600, color: '#475569' }}>
                  {c.siteCount}
                </td>

                <td style={{ padding: '6px 12px', textAlign: 'center', fontWeight: 600, color: '#7c3aed' }}>
                  {c.lineCount}
                </td>

                <td style={{ padding: '6px 12px', minWidth: 220 }}>
                  {(c.poIds || []).some(id => lockMap[id]?.locked) ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        flex: 1, padding: '4px 8px', borderRadius: 6,
                        background: '#f1f5f9', color: '#475569',
                        fontSize: '.72rem', fontWeight: 600,
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                      }}>
                        🔒 {plan.name || plan.code || '—'}
                      </span>
                      <span style={{ fontSize: '.62rem', color: '#94a3b8', fontWeight: 700 }}>Report Approved</span>
                    </div>
                  ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <select
                      value={plan.code || ''}
                      onChange={e => onPacDteChange(c.name, c.poIds, e.target.value)}
                      style={{
                        padding: '4px 8px', borderRadius: 6, border: plan.mixed ? '1px solid #f59e0b' : '1px solid #e2e8f0',
                        fontSize: '.75rem', background: '#fff', cursor: 'pointer',
                        color: plan.code ? ADMIN_NAVY : '#94a3b8', flex: 1,
                        outline: 'none',
                      }}>
                      <option value="">{plan.mixed ? '— Mixed (overwrite) —' : '— Select DTE —'}</option>
                      {dteList.map(e => {
                        const code = e.employee_code || e.employeeCode
                        const name = e.full_name || e.fullName || ''
                        const load = e.workload || 0
                        const loadLabel = load > 0 ? ` · ${load} site${load !== 1 ? 's' : ''}${load >= 10 ? ' ⚠' : ''}` : ''
                        return <option key={code} value={code}>{name} ({code}){loadLabel}</option>
                      })}
                    </select>
                    {(plan.code || plan.mixed) && !plan.saving && (
                      <button
                        onClick={() => onPacDteChange(c.name, c.poIds, '')}
                        title="Clear plan for all PO lines in this cluster"
                        style={{
                          width: 22, height: 22, borderRadius: 5,
                          border: '1px solid #fecaca', color: '#dc2626', background: '#fff',
                          cursor: 'pointer', fontSize: '.78rem', fontWeight: 700,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                        }}
                      >✕</button>
                    )}
                    {plan.saving && <span style={{ fontSize: '.65rem', color: '#0891b2' }}>⏳</span>}
                    {!plan.saving && plan.saved && plan.code && <span style={{ fontSize: '.65rem', color: GREEN }}>✓</span>}
                    {plan.mixed && !plan.saving && <span style={{ fontSize: '.62rem', color: '#b45309', fontWeight: 700 }}>mixed</span>}
                  </div>
                  )}
                </td>
              </tr>
            )
          })}
          {clusters.length === 0 && (
            <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No PAC clusters with Cluster Ready date</td></tr>
          )}
        </tbody>
        {clusters.length > 0 && (
          <tfoot>
            <tr style={{ background: '#faf5ff', fontWeight: 700 }}>
              <td colSpan={6} style={{ padding: '7px 12px', color: '#7c3aed', fontSize: '.72rem' }}>
                Total {clusters.length} clusters · Planned {clusters.filter(c => planMapPac[c.name]?.code).length} clusters
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}

/* ── Plan DTE table ── */
function PlanDteTable({ rows, siteMap, dteList, planMap, onDteChange, lockMap = {} }) {
  const headers = ['#', 'Site Code', 'Latitude', 'Longitude', 'Layers', 'Full On-Air', 'DTE']
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.76rem' }}>
        <thead>
          <tr style={{ background: '#f0f9ff' }}>
            {headers.map(h => (
              <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Latitude' || h === 'Longitude' ? 'right' : 'left', color: '#0891b2', fontWeight: 700, borderBottom: '2px solid #bae6fd', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((p, i) => {
            const d       = p.hw_data || {}
            const rawSite = d['Site Code'] || p.cluster_site || ''
            const itemDis = d['Item Description'] || p.item_dis || ''
            const siteKey = extractSite(rawSite).toUpperCase()
            const geo     = siteMap[siteKey] || {}
            const plan    = planMap[p.id] || {}
            const hasGeo  = geo.lat != null && geo.lng != null
            return (
              <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', background: plan.code ? (i % 2 === 0 ? '#f0fdf4' : '#ecfdf5') : (i % 2 === 0 ? '#fff' : '#fafbfc') }}>
                <td style={{ padding: '6px 12px', color: '#cbd5e1', fontSize: '.68rem' }}>{i + 1}</td>

                <td style={{ padding: '6px 12px', fontWeight: 700, color: ACE_BLUE, whiteSpace: 'nowrap' }}>
                  {extractSite(rawSite)}
                  <div style={{ fontSize: '.65rem', color: '#94a3b8', fontWeight: 400 }}>{rawSite}</div>
                </td>

                <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: 'monospace', fontSize: '.72rem', color: hasGeo ? '#0891b2' : '#cbd5e1' }}>
                  {geo.lat != null ? geo.lat.toFixed(6) : '—'}
                </td>
                <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: 'monospace', fontSize: '.72rem', color: hasGeo ? '#0891b2' : '#cbd5e1' }}>
                  {geo.lng != null ? geo.lng.toFixed(6) : '—'}
                </td>

                <td style={{ padding: '6px 12px', whiteSpace: 'nowrap', fontWeight: 600, color: '#7c3aed' }}>
                  {extractLayers(itemDis)}
                </td>

                <td style={{ padding: '6px 12px', whiteSpace: 'nowrap', color: geo.full_on_air ? GREEN : '#cbd5e1', fontWeight: geo.full_on_air ? 600 : 400 }}>
                  {geo.full_on_air || '—'}
                </td>

                <td style={{ padding: '6px 12px', minWidth: 200 }}>
                  {lockMap[p.id]?.locked ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        flex: 1, padding: '4px 8px', borderRadius: 6,
                        background: '#f1f5f9', color: '#475569',
                        fontSize: '.72rem', fontWeight: 600,
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                      }}>
                        🔒 {plan.name || plan.code || '—'}
                      </span>
                      <span title={`Locked: ${lockMap[p.id].reason}`} style={{ fontSize: '.62rem', color: '#94a3b8', fontWeight: 700 }}>
                        {lockMap[p.id].reason}
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <select
                        value={plan.code || ''}
                        onChange={e => onDteChange(p.id, e.target.value)}
                        style={{
                          padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0',
                          fontSize: '.75rem', background: '#fff', cursor: 'pointer',
                          color: plan.code ? ADMIN_NAVY : '#94a3b8', flex: 1,
                          outline: 'none',
                        }}>
                        <option value="">— Select DTE —</option>
                        {dteList.map(e => {
                          const code = e.employee_code || e.employeeCode
                          const name = e.full_name || e.fullName || ''
                          const load = e.workload || 0
                          const loadLabel = load > 0 ? ` · ${load} site${load !== 1 ? 's' : ''}${load >= 10 ? ' ⚠' : ''}` : ''
                          return <option key={code} value={code}>{name} ({code}){loadLabel}</option>
                        })}
                      </select>
                      {plan.code && !plan.saving && (
                        <button
                          onClick={() => onDteChange(p.id, '')}
                          title="Clear plan"
                          style={{
                            width: 22, height: 22, borderRadius: 5,
                            border: '1px solid #fecaca', color: '#dc2626', background: '#fff',
                            cursor: 'pointer', fontSize: '.78rem', fontWeight: 700,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                          }}
                        >✕</button>
                      )}
                      {plan.saving && <span style={{ fontSize: '.65rem', color: '#0891b2' }}>⏳</span>}
                      {!plan.saving && plan.saved && plan.code && <span style={{ fontSize: '.65rem', color: GREEN }}>✓</span>}
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
          {rows.length === 0 && (
            <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No data</td></tr>
          )}
        </tbody>
        {rows.length > 0 && (
          <tfoot>
            <tr style={{ background: '#f0f9ff', fontWeight: 700 }}>
              <td colSpan={7} style={{ padding: '7px 12px', color: '#0891b2', fontSize: '.72rem' }}>
                Total {rows.length} items · Planned {Object.values(planMap).filter(v => v.code).length} items
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
