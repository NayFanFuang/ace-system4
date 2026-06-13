import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, AlertTriangle, ArrowLeft, CalendarDays, CalendarPlus, Check, ChevronDown, ChevronRight,
  Database, Layers, Lock, LogOut, MapPin, Menu, Pencil, Plus, Search, Trash2, X,
  Sparkles, ClipboardList,
} from 'lucide-react'
import { Card, Badge, Button, Field, Input, EmptyState, Spinner, Alert, MapView } from './src/ui/index.jsx'
import { apiFetch } from './src/apiFetch.js'

/* ============================================================
   DTA — Update My Progress  (MOCKUP / UI preview only)
   New self-service route: /project/presite-monitor-dta/update
   - Lists the clusters the logged-in DTA owns.
   - Edit milestone dates + status + PA-loop rounds (Tuning & Discuss).
   - On save the cluster becomes "system-native" (progress_source=MANUAL).
   NOTE: this is a static mockup — no API calls yet. recompute() mirrors the
   server-side derivation so the live phase/health preview is realistic.
   ============================================================ */

const BRAND  = '#2447d8'
const GREEN  = '#16a34a'
const AMBER  = '#d97706'
const RED    = '#dc2626'
const PURPLE = '#7c3aed'
const SLATE  = '#64748b'

// 11-step lifecycle (kept in sync with PreSiteMonitorDtaPage MILESTONES).
// id 7 "pa_loop" is COMPUTED from the rounds, not a stored date → not editable.
// labels + sheet column refs match "Cluster Level" exactly (the key date the ETL reads).
const MILESTONES = [
  { id: 1,  key: 'site_onair',    label: 'Site On-Air',                zone: 'Setup' },
  { id: 2,  key: 'cluster_ready', label: 'Cluster Readiness',          col: 'W',  zone: 'Setup' },
  { id: 3,  key: 'dt_gen',        label: 'DT Route Generated',         col: 'Q',  zone: 'Setup' },
  { id: 4,  key: 'dt_approved',   label: 'DT Route Approved',          col: 'T',  zone: 'Setup' },
  { id: 5,  key: 'init_test',     label: 'Initial Test Done',          col: 'AC', zone: 'Setup' },
  { id: 6,  key: 'pa_open',       label: 'PA Open Discussion',         col: 'AG', zone: 'PA Tuning', payPct: 40 },
  { id: 7,  key: 'pa_loop',       label: 'PA Loop — Tuning & Discuss', col: 'AL–EC', zone: 'PA Tuning', computed: true },
  { id: 8,  key: 'tuning_closed', label: 'Tuning Report Approved',     col: 'ED', zone: 'PA Tuning' },
  { id: 9,  key: 'pac_report',    label: 'PAC Test Done',              col: 'EJ', zone: 'PAC' },
  { id: 10, key: 'pac_submit',    label: 'PAC Report Submit to HW',    col: 'EM', zone: 'PAC' },
  { id: 11, key: 'pac_approved',  label: 'PAC Approved (TRUE)',        col: 'EQ', zone: 'PAC', payPct: 60 },
]
const ZONE_ICON = { Setup: 'A', 'PA Tuning': 'B', PAC: 'C' }
const KEY_BY_ID = Object.fromEntries(MILESTONES.map(m => [m.id, m.key]))
// stampable milestones in lifecycle order (id 7 PA-Loop is computed from rounds, not stamped)
const STAMP_ORDER = [1, 2, 3, 4, 5, 6, 8, 9, 10, 11]
const PA_LOOP_MAX = 4
const PHASE_LABEL = id => (MILESTONES.find(m => m.id === id)?.label) || `Phase ${id}`
const MS_BY_ID = id => MILESTONES.find(m => m.id === id)

// the single next step the DTA should act on (or null when everything is done)
function nextActionable(ms, rounds) {
  const firstEmpty = STAMP_ORDER.find(id => !ms[KEY_BY_ID[id]])
  if (!firstEmpty) return null
  if (firstEmpty === 8 && !rounds.some(r => r.cr_date)) return MS_BY_ID(7) // do PA loop first
  return MS_BY_ID(firstEmpty)
}

/* ---------- recompute (mirror of app/services/dta_progress.py) ---------- */
function statusPhase(status) {
  if (!status) return 1
  const n = parseInt(String(status).trim().slice(0, 2), 10)
  if (isNaN(n)) return 1
  const map = { 14: 11, 13: 11, 12: 10, 11: 10, 10: 10, 9: 9, 8: 8, 7: 7, 6: 7, 5: 7, 4: 7, 3: 7, 2: 7, 1: 5, 0: 1 }
  return map[n] ?? 1
}
function healthOf(status, age) {
  const s = (status || '').slice(0, 2)
  if (s === '14') return 'green'
  if (s === '00') return 'red'
  if (age != null && age > 21) return 'red'
  if (['08', '11', '12', '13'].includes(s)) return 'green'
  return 'amber'
}
function recompute(ms, rounds, status) {
  const dates = {}
  MILESTONES.forEach(m => { if (m.id !== 7 && ms[m.key]) dates[m.id] = ms[m.key] })
  const crs = rounds.map(r => r.cr_date).filter(Boolean).sort()
  if (crs.length) dates[7] = crs[crs.length - 1]
  if (dates[2] && !dates[1]) dates[1] = dates[3] || dates[2]
  const ids = Object.keys(dates).map(Number)
  const datePhase = ids.length ? Math.max(1, ...ids) : 1
  const phase = Math.min(Math.max(datePhase, statusPhase(status), 1), 11)
  const dvals = Object.values(dates).sort()
  const started = dates[2] || dates[3] || dates[5] || dates[1]
  const last = dvals.length ? dvals[dvals.length - 1] : started
  let age = last ? Math.max(0, Math.round((Date.now() - new Date(last + 'T00:00:00')) / 86400000)) : null
  if (phase >= 11 && (status || '').slice(0, 2) === '14' && age != null) age = Math.min(age, 3)
  return { current_phase: phase, pa_round: crs.length, health: healthOf(status, age), age_at_phase: age }
}

// status label auto-derived from the milestone-driven phase (no manual typing).
// prefixes chosen so statusPhase(label) ≤ phase → status never pushes phase past the milestones.
const STATUS_BY_PHASE = {
  1: 'Not started',
  2: 'Cluster readiness',
  3: 'DT route generated',
  4: 'DT route approved',
  5: 'Initial test done',
  6: 'PA Open — discussion',
  7: '07. PA loop — tuning & discuss',
  8: 'Tuning report approved',
  9: 'PAC test done',
  10: 'PAC report submitted to HW',
  11: '14. PAC Approved (TRUE)',
}
// phase from milestones+rounds ONLY (status='' so it can't inflate), then label that phase
const derivedStatus = (ms, rounds) => STATUS_BY_PHASE[recompute(ms, rounds, '').current_phase] || ''
// recompute using the auto-derived status; returns derived fields + the status string
function recomputeAuto(ms, rounds) {
  const status = derivedStatus(ms, rounds)
  return { ...recompute(ms, rounds, status), status }
}

const HEALTH_COLOR = { green: GREEN, amber: AMBER, red: RED }
const HEALTH_TONE  = { green: 'green', amber: 'amber', red: 'red' }

/* ---------- date helpers + press-to-stamp control ---------- */
const todayISO = () => new Date().toISOString().slice(0, 10)
function fmtShort(iso) {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
const dayDiff = (aISO, bISO) => Math.round((new Date(aISO + 'T00:00:00') - new Date(bISO + 'T00:00:00')) / 86400000)

// Tap "Mark today" = stamp today (fast path). Calendar icon = pick a real (back-dated) date.
// When set: chip shows the date, tap to edit; "clear" removes it. Optional confirm on stamp/clear.
function DateStamp({ value, onChange, prominent, canClear = true, confirmStamp, confirmClear }) {
  const [editing, setEditing] = useState(false)
  const stampToday = () => { if (confirmStamp && !window.confirm(confirmStamp)) return; onChange(todayISO()) }
  const clear = () => { if (confirmClear && !window.confirm(confirmClear)) return; onChange('') }

  if (editing) {
    return (
      <input type="date" autoFocus defaultValue={value || todayISO()}
        onChange={e => { if (e.target.value) onChange(e.target.value); setEditing(false) }}
        onBlur={() => setEditing(false)}
        className="rounded-xl border border-blue-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none" />
    )
  }
  if (value) {
    return (
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setEditing(true)} title="Edit date"
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-100">
          <Check size={12} /> {fmtShort(value)} <Pencil size={10} className="opacity-50" />
        </button>
        {canClear && <button type="button" onClick={clear} className="text-[11px] font-black text-slate-400 hover:text-rose-500">clear</button>}
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={stampToday}
        className={prominent
          ? 'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-black text-white shadow-sm transition hover:brightness-110'
          : 'inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-400 transition hover:border-blue-400 hover:text-blue-600'}
        style={prominent ? { background: BRAND } : undefined}>
        <CalendarDays size={13} /> Mark today
      </button>
      <button type="button" onClick={() => setEditing(true)} title="Pick a past date"
        className="grid h-7 w-7 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-blue-400 hover:text-blue-600">
        <CalendarPlus size={13} />
      </button>
    </div>
  )
}

// Plan vs Actual chip: compares the actual stamp (or today, if not yet done) to the plan date.
function PlanChip({ plan, actual }) {
  if (!plan) return null
  if (actual) {
    const d = dayDiff(actual, plan)
    return d <= 0
      ? <span className="text-[11px] font-bold text-emerald-600">on time</span>
      : <span className="text-[11px] font-bold text-amber-600">{d}d late</span>
  }
  const d = dayDiff(todayISO(), plan)
  return d <= 0
    ? <span className="text-[11px] font-bold text-slate-400">due in {-d}d</span>
    : <span className="text-[11px] font-bold text-rose-600">{d}d overdue</span>
}

// cluster-level plan status across the 3 plan milestones (PA Open / Tuning Closed / PAC Approved)
const PLAN_KEYS = ['pa_open', 'tuning_closed', 'pac_approved']
function planStatus(c) {
  let overdue = 0, late = false
  for (const k of PLAN_KEYS) {
    const plan = c.plan?.[k]
    if (!plan) continue
    const actual = c.milestones[k]
    if (actual) { if (dayDiff(actual, plan) > 0) late = true }       // completed after plan
    else { const d = dayDiff(todayISO(), plan); if (d > 0) overdue = Math.max(overdue, d) }  // not done & past plan
  }
  if (overdue > 0) return { kind: 'overdue', days: overdue }
  if (late) return { kind: 'late' }
  return { kind: 'ontrack' }
}

/* ---------- mock data (clusters "owned" by the logged-in DTA) ---------- */
const MOCK_MY_CLUSTERS = [
  {
    code: 'EAS0066-SSOA-1', owner: 'Peerapol Piamsri', site_count: 1, target_month: 'May',
    progress_source: 'EXCEL', status: '07. Wait Discuss to Close PA',
    plan: { pa_open: '2026-05-12', tuning_closed: '2026-06-05', pac_approved: '2026-06-20' },
    milestones: {
      site_onair: '2026-04-28', cluster_ready: '2026-04-28', dt_gen: '2026-05-04',
      dt_approved: '2026-05-07', init_test: '2026-05-07', pa_open: '2026-05-15',
      tuning_closed: '', pac_report: '', pac_submit: '', pac_approved: '',
    },
    rounds: [
      { round_no: 1, cr_date: '2026-05-22', tuning_done: '2026-05-25', compare_done: '2026-05-04', discuss_date: '2026-06-08', pa_closed: 3, pa_added: 1, test_engineer: 'EAS01' },
      { round_no: 2, cr_date: '2026-06-08', tuning_done: '2026-06-10', compare_done: '2026-06-10', discuss_date: '2026-06-11', pa_closed: 2, pa_added: 0, test_engineer: 'EAS05' },
    ],
  },
  {
    code: 'EAS0142-Full-1', owner: 'Peerapol Piamsri', site_count: 1, target_month: 'Jun',
    progress_source: 'MANUAL', status: '14. PAC Approved (TRUE)',
    plan: { pa_open: '2026-05-20', tuning_closed: '2026-06-05', pac_approved: '2026-06-18' },
    milestones: {
      site_onair: '2026-05-02', cluster_ready: '2026-05-02', dt_gen: '2026-05-06',
      dt_approved: '2026-05-09', init_test: '2026-05-10', pa_open: '2026-05-18',
      tuning_closed: '2026-06-09', pac_report: '2026-06-10', pac_submit: '2026-06-11', pac_approved: '2026-06-12',
    },
    rounds: [
      { round_no: 1, cr_date: '2026-05-21', tuning_done: '2026-05-26', compare_done: '2026-05-22', discuss_date: '2026-05-30', pa_closed: 4, pa_added: 2, test_engineer: 'EAS03' },
      { round_no: 2, cr_date: '2026-06-04', tuning_done: '2026-06-07', compare_done: '2026-06-06', discuss_date: '2026-06-09', pa_closed: 1, pa_added: 0, test_engineer: 'EAS03' },
    ],
  },
  {
    code: 'EAS0211-SSOA-2', owner: 'Peerapol Piamsri', site_count: 2, target_month: 'Jun',
    progress_source: 'EXCEL', status: '05. Initial test done',
    plan: { pa_open: '2026-06-01', tuning_closed: '2026-06-20', pac_approved: '2026-07-05' },
    milestones: {
      site_onair: '2026-05-20', cluster_ready: '2026-05-21', dt_gen: '2026-05-25',
      dt_approved: '2026-05-28', init_test: '2026-05-30', pa_open: '',
      tuning_closed: '', pac_report: '', pac_submit: '', pac_approved: '',
    },
    rounds: [],
  },
]

const emptyRound = no => ({ round_no: no, cr_date: '', tuning_done: '', compare_done: '', discuss_date: '', pa_closed: null, pa_added: null, test_engineer: '' })

// DB / data-source context (mock — will come from GET /api/presite/dta/clusters → {count, as_of})
const DB_STATS = { total_clusters: 290, total_rounds: 612, as_of: '2026-06-08', source: 'TRUE-MERGE EAS v5.1', db: 'ace_system' }

/* ---------- API ↔ component shape mappers ---------- */
const MS_KEYS = MILESTONES.filter(m => !m.computed).map(m => m.key)
const ID2KEY = { 1: 'site_onair', 2: 'cluster_ready', 3: 'dt_gen', 4: 'dt_approved', 5: 'init_test', 6: 'pa_open', 8: 'tuning_closed', 9: 'pac_report', 10: 'pac_submit', 11: 'pac_approved' }
const PLAN_ID2KEY = { 6: 'pa_open', 8: 'tuning_closed', 11: 'pac_approved' }
const iso10 = v => (v ? String(v).slice(0, 10) : '')

// /dta/my-clusters cluster → the shape the page components expect
function fromApi(c) {
  const milestones = Object.fromEntries(MS_KEYS.map(k => [k, '']))
  Object.entries(c.dates || {}).forEach(([id, v]) => { const k = ID2KEY[id]; if (k) milestones[k] = iso10(v) })
  const plan = {}
  Object.entries(c.plan || {}).forEach(([id, v]) => { const k = PLAN_ID2KEY[id]; if (k) plan[k] = iso10(v) })
  const rounds = (c.pa_rounds || []).map(r => ({
    round_no: r.round, cr_date: iso10(r.cr), tuning_done: iso10(r.tuning_done), compare_done: iso10(r.compare_done),
    discuss_date: iso10(r.discuss_date), pa_closed: r.pa_closed, pa_added: r.pa_added, test_engineer: r.test_engineer || '',
  }))
  const sites = (c.sites || []).map(s => ({
    site_code: s.site_code, site_name: s.site_name, province: s.province,
    lat: typeof s.lat === 'number' ? s.lat : null, lng: typeof s.lng === 'number' ? s.lng : null,
  }))
  return {
    code: c.code, owner: c.owner || 'Unassigned', site_count: c.site_count || 1, target_month: c.target_month || '—',
    progress_source: c.progress_source || 'EXCEL', plan, milestones, rounds, sites,
    dte_ready_at: c.dte_ready_at || null, dte_ready_by: c.dte_ready_by || null,
  }
}

// component milestones + rounds + plan → PUT /progress body ('' → null)
function toPayload(ms, rounds, plan = {}) {
  const body = {}
  MS_KEYS.forEach(k => { body[k] = ms[k] || null })
  body.plan_pa_open = plan.pa_open || null
  body.plan_pa_closed = plan.tuning_closed || null
  body.plan_pac_approved = plan.pac_approved || null
  body.rounds = rounds.map(r => ({
    round_no: r.round_no, cr_date: r.cr_date || null, tuning_done: r.tuning_done || null,
    compare_done: r.compare_done || null, discuss_date: r.discuss_date || null,
    pa_closed: r.pa_closed, pa_added: r.pa_added, test_engineer: r.test_engineer || null,
  }))
  return body
}

/* ============================================================ */
const ACE_RED = '#c0392b'
const FILTERS = [
  { id: 'all',    label: 'All clusters', icon: Layers },
  { id: 'active', label: 'In progress',  icon: Activity },
  { id: 'done',   label: 'Completed',    icon: Check },
  { id: 'risk',   label: 'At risk',      icon: AlertTriangle },
]
const initials = n => (n || 'U').split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()
function readAuthUser() {
  try { return JSON.parse(localStorage.getItem('ace_system_auth_user_v1') || 'null') } catch { return null }
}
function IconButton({ label, onClick, children }) {
  return (
    <button type="button" aria-label={label} onClick={onClick}
      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50">
      {children}
    </button>
  )
}

export default function DtaUpdatePage({ authenticatedUser, onLogout }) {
  const [clusters, setClusters] = useState([])
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)
  const [activeCode, setActiveCode] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const active = clusters.find(c => c.code === activeCode) || null
  const user = authenticatedUser || readAuthUser()
  const canEditPlan = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'PROJECT_ADMIN', 'PM', 'DIRECTOR'].includes(user?.role)

  // load my clusters from the API (fall back to sample data if backend is unreachable)
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const r = await apiFetch('/api/presite/dta/my-clusters')
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const d = await r.json()
        if (alive) setClusters((d.clusters || []).map(fromApi))
      } catch (_) {
        if (alive) { setClusters(MOCK_MY_CLUSTERS); setOffline(true) }
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  // save: optimistic local update, then PUT /progress and reconcile with the server response
  async function saveCluster(updated) {
    setClusters(cs => cs.map(c => (c.code === updated.code ? updated : c)))
    if (offline) return
    try {
      const r = await apiFetch(`/api/presite/dta/clusters/${encodeURIComponent(updated.code)}/progress`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPayload(updated.milestones, updated.rounds, updated.plan)),
      })
      // PUT response has no `sites` (only /my-clusters attaches them) — keep the ones we already have
      if (r.ok) { const d = await r.json(); setClusters(cs => cs.map(c => (c.code === d.code ? { ...fromApi(d), sites: c.sites } : c))) }
    } catch (_) { /* keep optimistic state */ }
  }

  const counts = useMemo(() => {
    const c = { all: clusters.length, active: 0, done: 0, risk: 0 }
    clusters.forEach(cl => {
      const next = nextActionable(cl.milestones, cl.rounds)
      if (next) c.active++; else c.done++
      if (recomputeAuto(cl.milestones, cl.rounds).health === 'red' || planStatus(cl).kind === 'overdue') c.risk++
    })
    return c
  }, [clusters])

  const filtered = useMemo(() => clusters.filter(cl => {
    if (search && !cl.code.toLowerCase().includes(search.toLowerCase())) return false
    if (filter === 'all') return true
    const next = nextActionable(cl.milestones, cl.rounds)
    if (filter === 'active') return !!next
    if (filter === 'done') return !next
    if (filter === 'risk') return recomputeAuto(cl.milestones, cl.rounds).health === 'red' || planStatus(cl).kind === 'overdue'
    return true
  }), [clusters, filter, search])

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="flex min-h-screen">
        <DtaSidebar filter={filter} counts={counts} mobileOpen={mobileOpen}
          setFilter={f => { setFilter(f); setActiveCode(null) }}
          onMobileClose={() => setMobileOpen(false)} />

        {mobileOpen && (
          <button type="button" className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
        )}

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/86 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <IconButton label="Open menu" onClick={() => setMobileOpen(true)}><Menu size={19} /></IconButton>
              <div className="hidden min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-400 md:flex">
                <Search size={18} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cluster code…"
                  className="w-full border-0 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400" />
              </div>
              <Badge tone="amber">Mockup</Badge>
              <div className="ml-auto flex items-center gap-2">
                <button className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:bg-slate-50 sm:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-black text-white" style={{ background: BRAND }}>{initials(user?.name || 'DTA')}</div>
                  <div className="text-left">
                    <div className="text-sm font-black text-slate-900">{user?.name || 'DTA'}</div>
                    <div className="text-xs font-bold text-slate-400">{user?.positionName || 'Pre-Site DTA'}</div>
                  </div>
                  <ChevronDown size={16} className="text-slate-400" />
                </button>
                {onLogout && <IconButton label="Logout" onClick={onLogout}><LogOut size={18} /></IconButton>}
              </div>
            </div>
          </header>

          <div className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto grid max-w-3xl gap-3">
              {offline && <Alert tone="warning" icon={AlertTriangle}>Backend unreachable — showing sample data (changes won’t be saved).</Alert>}
              {loading
                ? <div className="grid place-items-center py-24"><Spinner size={26} /></div>
                : active
                  ? <ClusterEditor key={active.code} cluster={active} canEditPlan={canEditPlan} onBack={() => setActiveCode(null)} onSave={saveCluster} />
                  : <ClusterList clusters={filtered} onPick={setActiveCode} />}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

/* ---------- local sidebar (ACE UI Kit) — filter nav ---------- */
function DtaSidebar({ filter, setFilter, counts, mobileOpen, onMobileClose }) {
  return (
    <aside className={`${mobileOpen ? 'fixed inset-y-0 left-0 z-40 flex' : 'hidden'} w-72 flex-col border-r border-slate-200 bg-white/95 p-5 shadow-lg backdrop-blur lg:sticky lg:top-0 lg:flex lg:h-screen lg:shadow-none lg:overflow-y-auto`}>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${BRAND}, ${ACE_RED})` }}>
          <ClipboardList size={24} />
        </div>
        <div className="min-w-0">
          <div className="text-base font-black text-slate-950">ACE DTA</div>
          <div className="text-xs font-bold text-slate-400">Pre-Site · Update</div>
        </div>
        <button onClick={onMobileClose} className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 lg:hidden" aria-label="Close menu"><X size={18} /></button>
      </div>

      <nav className="mt-9 space-y-1">
        {FILTERS.map(item => {
          const on = item.id === filter
          const Icon = item.icon
          return (
            <button key={item.id} type="button" onClick={() => { setFilter(item.id); onMobileClose?.() }}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-sm font-black transition ${on ? 'bg-blue-50 text-[#2447d8] shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'}`}>
              <Icon size={18} /><span>{item.label}</span>
              <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-black ${on ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{counts[item.id] ?? 0}</span>
            </button>
          )
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-sm font-black text-slate-900"><Sparkles size={18} style={{ color: BRAND }} /> DTA Workspace</div>
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">Update milestones, PA-loop rounds &amp; status — saved system-native.</p>
      </div>
    </aside>
  )
}

/* ---------- list of my clusters ---------- */
function ClusterList({ clusters, onPick }) {
  if (!clusters.length) {
    return <EmptyState icon={Layers} title="No clusters here"
      desc="Try a different filter or search, or ask a PM to assign you as the DTA owner of a cluster." />
  }
  const rows = clusters.map(c => ({ c, d: recomputeAuto(c.milestones, c.rounds), next: nextActionable(c.milestones, c.rounds) }))
  const plan = { ontrack: 0, late: 0, overdue: 0 }
  rows.forEach(({ c }) => { plan[planStatus(c).kind]++ })

  return (
    <div className="grid gap-3">
      {/* Plan vs Actual summary (top) */}
      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
          <CalendarDays size={14} style={{ color: BRAND }} /> Plan vs Actual
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[['On track', plan.ontrack, GREEN], ['Behind plan', plan.late, AMBER], ['Overdue', plan.overdue, RED]].map(([label, n, color]) => (
            <div key={label} className="rounded-xl bg-slate-50 px-3 py-2.5 text-center">
              <div className="text-xl font-black" style={{ color }}>{n}</div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
        <Sparkles size={14} style={{ color: BRAND }} /> My Clusters ({clusters.length})
      </div>

      {/* DB / data-source context */}
      <div className="grid grid-cols-4 gap-2">
        <Preview label="My clusters" value={clusters.length} />
        <Preview label="In database" value={DB_STATS.total_clusters} />
        <Preview label="PA rounds" value={DB_STATS.total_rounds} />
        <Preview label="As of" value={fmtShort(DB_STATS.as_of)} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-slate-400">
        <Database size={12} /> Source: <span className="text-slate-600">{DB_STATS.source}</span>
        <span className="text-slate-300">·</span> DB <span className="font-mono text-slate-600">{DB_STATS.db}</span>
      </div>

      {rows.map(({ c, d, next }) => {
        const pct = Math.round((d.current_phase / 11) * 100)
        return (
          <button key={c.code} type="button" onClick={() => onPick(c.code)}
            className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: HEALTH_COLOR[d.health] }} />
              <span className="truncate text-sm font-black text-slate-900">{c.code}</span>
              {c.progress_source === 'MANUAL' ? <Badge tone="blue">In-app</Badge> : <Badge tone="slate">Excel</Badge>}
              {d.pa_round > 0 && <Badge tone="purple">PA R{d.pa_round}/{PA_LOOP_MAX}</Badge>}
              {(() => { const ps = planStatus(c); return ps.kind === 'overdue' ? <Badge tone="red">{ps.days}d overdue</Badge> : ps.kind === 'late' ? <Badge tone="amber">behind plan</Badge> : null })()}
              <ChevronRight size={18} className="ml-auto shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-400" />
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${BRAND},${GREEN})` }} />
              </div>
              <span className="shrink-0 font-mono text-[10px] font-black text-slate-400">{d.current_phase}/11</span>
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
              {next
                ? <><span className="text-blue-500">Next:</span> <span className="truncate text-slate-600">{next.label}</span></>
                : <span className="text-emerald-600">✓ All steps complete</span>}
              <span className="ml-auto shrink-0 text-slate-300">{c.site_count} site{c.site_count > 1 ? 's' : ''} · {c.target_month}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

/* ---------- single cluster editor ---------- */
function ClusterEditor({ cluster, canEditPlan, onBack, onSave }) {
  const [ms, setMs] = useState({ ...cluster.milestones })
  const [rounds, setRounds] = useState(cluster.rounds.map(r => ({ ...r })))
  const [plan, setPlan] = useState({ ...(cluster.plan || {}) })
  const [saveState, setSaveState] = useState('idle')   // idle | saving | saved

  const derived = useMemo(() => recomputeAuto(ms, rounds), [ms, rounds])
  const status = derived.status   // auto-derived from milestones — not typed

  // ── auto-save (debounced; skips the initial mount render) ──
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    setSaveState('saving')
    const t = setTimeout(() => {
      onSave({ ...cluster, milestones: ms, rounds, plan, progress_source: 'MANUAL', ...recomputeAuto(ms, rounds) })
      setSaveState('saved')
    }, 600)
    return () => clearTimeout(t)
  }, [ms, rounds, plan]) // eslint-disable-line react-hooks/exhaustive-deps
  const setPlanDate = (key, v) => setPlan(p => ({ ...p, [key]: v }))

  function setDate(key, v) { setMs(m => ({ ...m, [key]: v })) }
  function setRound(i, field, v) { setRounds(rs => rs.map((r, idx) => (idx === i ? { ...r, [field]: v } : r))) }
  function addRound() { if (rounds.length < PA_LOOP_MAX) setRounds(rs => [...rs, emptyRound(rs.length + 1)]) }
  function removeRound(i) { setRounds(rs => rs.filter((_, idx) => idx !== i).map((r, idx) => ({ ...r, round_no: idx + 1 }))) }

  // ── sequential gating — a step unlocks only when every earlier step is done ──
  const reachedLoop = rounds.some(r => r.cr_date)
  function prereqMet(id) {
    const idx = STAMP_ORDER.indexOf(id)
    if (!STAMP_ORDER.slice(0, idx).every(pid => ms[KEY_BY_ID[pid]])) return false
    if (id === 8) return reachedLoop                 // Tuning Closed needs ≥1 PA-loop round
    return true
  }
  const stepState = id => (ms[KEY_BY_ID[id]] ? 'done' : prereqMet(id) ? 'current' : 'locked')
  // clearable only if it's the latest done step (no later step done) → no gaps
  const clearable = id => {
    const idx = STAMP_ORDER.indexOf(id)
    return ms[KEY_BY_ID[id]] && STAMP_ORDER.slice(idx + 1).every(nid => !ms[KEY_BY_ID[nid]])
  }
  const pct = Math.round((derived.current_phase / 11) * 100)
  const next = nextActionable(ms, rounds)
  function doNext() {
    if (!next) return
    if (next.id === 7) addRound()
    else setDate(next.key, todayISO())
  }

  return (
    <div className="grid gap-4 pb-6">
      {/* header + auto-save indicator */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50">
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-base font-black text-slate-900">{cluster.code}</span>
            {cluster.progress_source === 'MANUAL' ? <Badge tone="blue">In-app</Badge> : <Badge tone="slate">Excel-synced</Badge>}
          </div>
          <div className="text-[11px] font-bold text-slate-400">{cluster.owner} · {cluster.site_count} site{cluster.site_count > 1 ? 's' : ''} · Target {cluster.target_month}</div>
        </div>
        <SaveIndicator state={saveState} />
      </div>

      {/* NEXT-STEP call to action — the one thing to do now */}
      {next
        ? (
          <Card className="flex items-center gap-3 border-blue-200 bg-blue-50/60 p-4">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white" style={{ background: next.id === 7 ? PURPLE : BRAND }}>
              {next.id === 7 ? <Layers size={16} /> : <CalendarDays size={16} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-blue-500">Next step</div>
              <div className="truncate text-sm font-black text-slate-800">{next.label}</div>
            </div>
            <Button variant="primary" onClick={doNext} className="shrink-0">
              {next.id === 7 ? 'Add PA round' : 'Mark today'}
            </Button>
          </Card>
        )
        : (
          <Card className="flex items-center gap-3 border-emerald-200 bg-emerald-50/60 p-4">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white"><Check size={18} /></div>
            <div className="text-sm font-black text-emerald-700">All 11 steps complete — PAC Approved 🎉</div>
          </Card>
        )}

      {/* DTE → DTA handoff signal (cluster-level; set when a DTE finishes a site of this cluster) */}
      {cluster.dte_ready_at && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-[11px] font-bold text-emerald-700">
          <Check size={14} /> DTE Ready — handed off{cluster.dte_ready_by ? ` by ${cluster.dte_ready_by}` : ''}{` · ${fmtShort(String(cluster.dte_ready_at).slice(0, 10))}`}
        </div>
      )}

      {/* derived stats + progress */}
      <Card className="p-4">
        <div className="mb-3 grid grid-cols-3 gap-3">
          <Preview label="Phase" value={`${derived.current_phase}/11`} hint={PHASE_LABEL(derived.current_phase)} />
          <Preview label="PA Round" value={derived.pa_round ? `${derived.pa_round}/${PA_LOOP_MAX}` : '—'} />
          <Preview label="Health" badge={<Badge tone={HEALTH_TONE[derived.health]} dot>{derived.health}</Badge>}
            hint={derived.age_at_phase != null ? `${derived.age_at_phase}d at phase` : null} />
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${BRAND},${GREEN})` }} />
        </div>
      </Card>

      {/* guided stepper — must be done in order, grouped by zone */}
      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
          <CalendarDays size={13} style={{ color: BRAND }} /> Lifecycle — in order (no skipping)
        </div>
        <ol className="relative">
          {MILESTONES.map((m, i) => {
            const last = i === MILESTONES.length - 1
            const zoneHead = i === 0 || m.zone !== MILESTONES[i - 1].zone ? m.zone : null
            const node = m.id === 7
              ? <LoopNode key="loop" last={last} unlocked={!!ms.pa_open} closed={!!ms.tuning_closed}
                  rounds={rounds} paRound={derived.pa_round} onAdd={addRound} onRemove={removeRound} onSet={setRound} />
              : <StepNode key={m.id} m={m} state={stepState(m.id)} last={last} clearable={clearable(m.id)}
                  date={ms[m.key]} plan={plan[m.key]} canEditPlan={canEditPlan}
                  onSet={v => setDate(m.key, v)} onSetPlan={v => setPlanDate(m.key, v)} />
            if (!zoneHead) return node
            return (
              <React.Fragment key={`z${m.id}`}>
                <li className="mb-2 ml-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <span className="grid h-4 w-4 place-items-center rounded bg-slate-200 text-[9px] text-slate-500">{ZONE_ICON[m.zone]}</span>
                  {m.zone}
                </li>
                {node}
              </React.Fragment>
            )
          })}
        </ol>
      </Card>

      {/* status — auto-derived from the milestones above (read-only) */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status (PAC simulate)</div>
            <div className="mt-1 truncate text-sm font-black text-slate-800">{status || '—'}</div>
          </div>
          <Badge tone="slate" dot>auto</Badge>
        </div>
        <p className="mt-2 text-[11px] font-semibold text-slate-400">Derived automatically from the milestones above — no manual entry.</p>
      </Card>

      {/* sites that make up this cluster */}
      {cluster.sites?.length > 0 && (
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
            <MapPin size={14} style={{ color: BRAND }} /> Sites in cluster ({cluster.sites.length})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-black uppercase tracking-wide text-slate-400">
                  <th className="w-8 py-1.5 pr-2">#</th>
                  <th className="py-1.5 pr-3">Site Code</th>
                  <th className="py-1.5 pr-3">Site Name</th>
                  <th className="py-1.5 pr-2">Province</th>
                  <th className="py-1.5 text-center">📍</th>
                </tr>
              </thead>
              <tbody>
                {cluster.sites.map((s, i) => (
                  <tr key={s.site_code} className="border-b border-slate-100 last:border-0">
                    <td className="py-1.5 pr-2 text-slate-400">{i + 1}</td>
                    <td className="py-1.5 pr-3 font-mono font-bold text-slate-700">{s.site_code}</td>
                    <td className="py-1.5 pr-3 text-slate-500">{s.site_name || '—'}</td>
                    <td className="py-1.5 pr-2 text-slate-500">{s.province || '—'}</td>
                    <td className="py-1.5 text-center">{s.lat != null && s.lng != null ? <span title="geocoded" className="text-emerald-500">●</span> : <span className="text-slate-300">○</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(() => {
            const geo = cluster.sites.filter(s => s.lat != null && s.lng != null)
            if (!geo.length) return <div className="mt-3 rounded-xl bg-slate-50 py-3 text-center text-[11px] font-bold text-slate-400">No geocoded sites to map</div>
            return (
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                <MapView height={260} fitToMarkers center={[geo[0].lat, geo[0].lng]}
                  markers={geo.map(s => ({ lat: s.lat, lng: s.lng, name: s.site_code, status: 'office' }))} />
              </div>
            )
          })()}
        </Card>
      )}
    </div>
  )
}

function SaveIndicator({ state }) {
  if (state === 'saving') return <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400"><Spinner size={12} /> Saving…</span>
  if (state === 'saved')  return <span className="flex items-center gap-1.5 text-[11px] font-black text-emerald-600"><Check size={13} /> Saved</span>
  return <Badge tone="slate" dot>auto-save</Badge>
}

const STEP_RING = { done: GREEN, current: BRAND, locked: '#cbd5e1' }

// one milestone row in the vertical timeline
function StepNode({ m, state, last, clearable, date, plan, canEditPlan, onSet, onSetPlan }) {
  const isCurrent = state === 'current'
  const planSlot = PLAN_KEYS.includes(m.key)   // PA Open / Tuning Closed / PAC Approved have plan targets
  return (
    <li className="relative flex gap-2.5 pb-2.5 last:pb-0">
      {!last && <span className="absolute left-[11px] top-7 bottom-0 w-px" style={{ background: state === 'done' ? GREEN : '#e2e8f0' }} />}
      <div className="z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-black text-white shadow-sm"
        style={{ background: STEP_RING[state], boxShadow: isCurrent ? `0 0 0 4px ${BRAND}22` : undefined }}>
        {state === 'done' ? <Check size={13} /> : state === 'locked' ? <Lock size={11} /> : m.id}
      </div>
      <div className={`min-w-0 flex-1 ${isCurrent ? 'rounded-xl bg-blue-50/70 px-3 py-2 -mt-1 ring-1 ring-blue-100' : ''}`}>
        <div className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold text-slate-800">
          {m.label}
          {m.col && <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-400">{m.col}</span>}
        </div>
        <div className="mt-1.5">
          {state === 'locked'
            ? <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-300"><Lock size={11} /> Unlocks after the previous step</span>
            : <DateStamp value={date} onChange={onSet} prominent={isCurrent} canClear={clearable}
                confirmStamp={m.id === 11 ? 'Mark PAC Approved (TRUE)? This is the final milestone.' : undefined}
                confirmClear="Clear this date?" />}
        </div>
        {planSlot && (
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] font-bold">
            <span className="text-slate-400">Plan</span>
            {canEditPlan
              ? <DateStamp value={plan || ''} onChange={onSetPlan} />
              : <span className="text-slate-600">{plan ? fmtShort(plan) : '—'}</span>}
            {plan && <PlanChip plan={plan} actual={date} />}
          </div>
        )}
      </div>
    </li>
  )
}

// the PA-Loop node (id 7) — rounds editor, unlocked only after PA Open
function LoopNode({ last, unlocked, closed, rounds, paRound, onAdd, onRemove, onSet }) {
  const color = closed ? GREEN : unlocked ? PURPLE : '#cbd5e1'
  return (
    <li className="relative flex gap-2.5 pb-2.5 last:pb-0">
      {!last && <span className="absolute left-[11px] top-7 bottom-0 w-px" style={{ background: closed ? GREEN : '#e2e8f0' }} />}
      <div className="z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-black text-white shadow-sm" style={{ background: color }}>
        {closed ? <Check size={13} /> : unlocked ? <Layers size={12} /> : <Lock size={11} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[13px] font-bold text-slate-800">
          PA Loop — Tuning &amp; Discuss
          {unlocked && <Badge tone="purple">R{paRound}/{PA_LOOP_MAX}</Badge>}
        </div>
        {!unlocked && <div className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-300"><Lock size={12} /> Unlocks after “PA Open” is done</div>}
        {unlocked && (
          <div className="mt-2 grid gap-2">
            {rounds.map((r, i) => (
              <div key={i} className="rounded-2xl border border-purple-100 bg-purple-50/40 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-black text-purple-900">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-purple-600 text-[10px] text-white">{r.round_no}</span> Round {r.round_no}
                  </span>
                  <button onClick={() => onRemove(i)} className="grid h-7 w-7 place-items-center rounded-lg text-rose-500 hover:bg-rose-50"><Trash2 size={14} /></button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Field label="CR Date"><DateStamp value={r.cr_date || ''} onChange={v => onSet(i, 'cr_date', v)} /></Field>
                  <Field label="Tuning Done"><DateStamp value={r.tuning_done || ''} onChange={v => onSet(i, 'tuning_done', v)} /></Field>
                  <Field label="Compare Done"><DateStamp value={r.compare_done || ''} onChange={v => onSet(i, 'compare_done', v)} /></Field>
                  <Field label="Discuss Date"><DateStamp value={r.discuss_date || ''} onChange={v => onSet(i, 'discuss_date', v)} /></Field>
                  <Field label="PA Closed"><Input type="number" value={r.pa_closed ?? ''} onChange={e => onSet(i, 'pa_closed', e.target.value === '' ? null : Number(e.target.value))} /></Field>
                  <Field label="PA Added"><Input type="number" value={r.pa_added ?? ''} onChange={e => onSet(i, 'pa_added', e.target.value === '' ? null : Number(e.target.value))} /></Field>
                  {/* Test Engineer — auto-linked per round from the DTE test session (read-only) */}
                  <div className="sm:col-span-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Test Engineer</span>
                    {r.test_engineer
                      ? <><span className="text-xs font-black text-slate-700">{r.test_engineer}</span><Badge tone="blue">from DTE</Badge></>
                      : <span className="text-xs font-bold text-slate-400">— linked from DTE session</span>}
                    <Database size={13} className="ml-auto text-slate-300" />
                  </div>
                </div>
              </div>
            ))}
            <Button variant="ghost" icon={Plus} onClick={onAdd} disabled={rounds.length >= PA_LOOP_MAX} className="justify-center">
              Add round {rounds.length ? `(${rounds.length}/${PA_LOOP_MAX})` : ''}
            </Button>
          </div>
        )}
      </div>
    </li>
  )
}

function Preview({ label, value, hint, badge }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-center">
      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-black text-slate-900">{badge || value}</div>
      {hint && <div className="mt-0.5 truncate text-[10px] font-bold text-slate-400">{hint}</div>}
    </div>
  )
}
