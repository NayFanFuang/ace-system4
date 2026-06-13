import React, { useEffect, useMemo, useState } from 'react'
import { apiFetch } from './src/apiFetch.js'
import {
  Activity, AlertTriangle, BarChart3, CalendarRange, CalendarDays, CheckCircle2, ChevronRight, Clock,
  Command, Crown, GitBranch, Gauge as GaugeIcon, Layers, LayoutGrid, LogOut, Map as MapIcon, MapPin,
  RefreshCw, Search, Sparkles, Target, TrendingUp, TrendingDown, Trophy, Users, UserPlus, Wallet, Check,
} from 'lucide-react'
import {
  Card, StatCard, Badge, Button, Tabs, Table, Gauge, MapView,
  LineChart, Progress, Field, Input, Select, Drawer, EmptyState,
} from './src/ui/index.jsx'
import { CLUSTERS, AS_OF } from './clusterMockData.js'

/* ============================================================
   Pre-Site Monitor (DTA) — Cluster Timeline Workflow
   Source: TRUE MERGE EAS (Internal) Master Progress Report v5.1
   Sheets: "Cluster Level" (289 clusters) + "Discussion" (KPI)
   Refactored onto the ACE UI Kit (/ui-kit) design system.
   ============================================================ */

const BRAND  = '#2447d8'
const GREEN  = '#16a34a'
const AMBER  = '#d97706'
const RED    = '#dc2626'
const PURPLE = '#7c3aed'
const SLATE  = '#64748b'

/* ---------- 11 Milestones of Cluster Lifecycle ---------- */
const MILESTONES = [
  { id: 1,  key: 'site_onair',    label: 'Site OnAir',                 short: 'Site',   zone: 'A' },
  { id: 2,  key: 'cluster_ready', label: 'Cluster Ready',              short: 'Ready',  zone: 'A' },
  { id: 3,  key: 'dt_gen',        label: 'DT Route Gen',               short: 'DT-G',   zone: 'A' },
  { id: 4,  key: 'dt_approved',   label: 'DT Route Appr',              short: 'DT-A',   zone: 'A' },
  { id: 5,  key: 'init_test',     label: 'Initial Test',               short: 'Init',   zone: 'B' },
  { id: 6,  key: 'pa_open',       label: 'PA Open Discuss (40%)',      short: 'PA-O',   zone: 'B', isPay: true },
  { id: 7,  key: 'pa_loop',       label: 'PA Loop — Tuning & Discuss R1-4', short: 'Loop', zone: 'B' },
  { id: 8,  key: 'tuning_closed', label: 'Tuning Closed',              short: 'Tune',   zone: 'C' },
  { id: 9,  key: 'pac_report',    label: 'PAC Report',                 short: 'PAC-R',  zone: 'C' },
  { id: 10, key: 'pac_submit',    label: 'PAC Submit',                 short: 'PAC-S',  zone: 'C' },
  { id: 11, key: 'pac_approved',  label: 'PAC Approved (60%)',         short: '60%',    zone: 'C', isPay: true },
]
const DONE_PHASE = 11
const PA_LOOP_MAX = 4

/* ---------- Cluster data ---------- */
// Live from /api/presite/dta/clusters (DB, imported from "Cluster Level" sheet).
// Falls back to the bundled static snapshot if the API is unreachable.
// `let` so the fetch can swap in live data; views read it at render time.
let MOCK_CLUSTERS = CLUSTERS

/* ---------- Discussion sheet KPI (ISDP Milestone on PAC Approval) ---------- */
const MOCK_MILESTONE_KPI = [
  { key: '01', label: 'Open PA Report Approval',            target: 16, success: 19, ongoing: 2 },
  { key: '02', label: 'Tuning Report Approval (PA Closed)', target: 29, success: 26, ongoing: 6 },
  { key: '03', label: 'PAC Submitted to TRUE',             target: 31, success: 27, ongoing: 1 },
  { key: '04', label: 'PAC Approve to TRUE',               target: 31, success: 22, ongoing: 5 },
]
const MOCK_SITE_KPI = { label: 'Open PA Report Approval (Site Level)', target: 108, success: 22 }

const MOCK_SCURVE = [
  { day: '01', planPA: 200, actualPA: 200, planPAT: 150, actualPAT: 150 },
  { day: '02', planPA: 220, actualPA: 200, planPAT: 150, actualPAT: 150 },
  { day: '03', planPA: 235, actualPA: 210, planPAT: 213, actualPAT: 168 },
  { day: '04', planPA: 286, actualPA: 235, planPAT: 257, actualPAT: 190 },
  { day: '05', planPA: 301, actualPA: 262, planPAT: 311, actualPAT: 224 },
  { day: '06', planPA: 318, actualPA: 290, planPAT: 344, actualPAT: 258 },
  { day: '07', planPA: 332, actualPA: 315, planPAT: 360, actualPAT: 295 },
]

/* ---------- Date helpers ---------- */
const PHASE_DAY_OFFSET = [0, 3, 6, 9, 12, 16, 18, 22, 30, 35, 40, 45]

function fmtDate(d) {
  if (!d) return null
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}
function fmtDateFull(d) {
  if (!d) return null
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
function milestoneDates(cluster) {
  const real = cluster.dates || {}
  const base = cluster.started ? new Date(cluster.started + 'T00:00:00') : null
  const out = {}
  MILESTONES.forEach((m, i) => {
    if (real[m.id]) {
      out[m.id] = new Date(real[m.id] + 'T00:00:00')        // real date from sheet
    } else if (m.id <= cluster.current_phase && base) {
      const d = new Date(base)                               // fill gaps for reached phases
      d.setDate(d.getDate() + (PHASE_DAY_OFFSET[i] || 0))
      out[m.id] = d
    } else {
      out[m.id] = null
    }
  })
  return out
}

/* ---------- Schedule variance: Plan vs Actual (cols EV/EW/EX from sheet) ---------- */
let AS_OF_DATE = new Date((AS_OF || '2026-05-30') + 'T00:00:00')
const dayDiff = (a, b) => Math.round((a - b) / 86400000)
const toDate = s => new Date(s + 'T00:00:00')
const VAR_MILESTONES = [11, 8, 6]                  // PAC Approved → PA Closed/Tuning → PA Open
const VAR_LABEL = { 11: 'PAC Approved (60%)', 8: 'PA Closed', 6: 'PA Open (40%)' }

// days = actual − plan : <0 ahead of plan, >0 behind plan
function scheduleVariance(cluster) {
  const plan = cluster.plan || {}, act = cluster.dates || {}
  for (const mid of VAR_MILESTONES) {              // latest milestone having both plan + actual
    if (plan[mid] && act[mid]) return { mid, days: dayDiff(toDate(act[mid]), toDate(plan[mid])), done: true }
  }
  for (const mid of [...VAR_MILESTONES].reverse()) { // not reached → compare plan vs today (overdue?)
    if (plan[mid] && !act[mid]) return { mid, days: dayDiff(AS_OF_DATE, toDate(plan[mid])), done: false }
  }
  return null
}

function VarianceBadge({ v }) {
  if (!v) return null
  const d = v.days
  if (v.done) {
    if (d <= 0) return <Badge tone="green">{Math.abs(d)}d ahead</Badge>
    return <Badge tone={d > 7 ? 'red' : 'amber'}>{d}d behind</Badge>
  }
  if (d > 0) return <Badge tone="red">{d}d overdue</Badge>
  return <Badge tone="slate">{Math.abs(d)}d left</Badge>
}

/* ---------- Misc helpers ---------- */
const HEALTH_TONE = { green: 'green', amber: 'amber', red: 'red' }
const HEALTH_LABEL = { green: 'HEALTHY', amber: 'WATCH', red: 'AT RISK' }
function healthColor(h) { return h === 'green' ? GREEN : h === 'amber' ? AMBER : RED }
function dotColor(phaseId, currentPhase, health) {
  if (phaseId < currentPhase) return GREEN
  if (phaseId === currentPhase) return health === 'red' ? RED : (health === 'amber' ? AMBER : BRAND)
  return '#cbd5e1'
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
const NAV_ITEMS = [
  { id: 'EXEC',      label: 'Executive Summary',   desc: 'One-screen overview',   icon: Crown },
  { id: 'TIMELINE',  label: 'Cluster Timeline',    desc: '12-step lifecycle',     icon: GitBranch },
  { id: 'DASHBOARD', label: 'Milestone Dashboard', desc: 'KPI · Plan vs Actual',  icon: GaugeIcon },
  { id: 'SCORECARD', label: 'Monthly Scorecard',   desc: 'Owner × Month',         icon: Target },
  { id: 'FUNNEL',    label: 'Pipeline Funnel',     desc: 'Where clusters stand',  icon: BarChart3 },
  { id: 'BOARD',     label: 'Owner Board',         desc: 'Kanban by owner',       icon: LayoutGrid },
  { id: 'ASSIGN',    label: 'Owner (Assign)',      desc: 'มอบหมาย DTA ให้ cluster', icon: UserPlus },
  { id: 'GANTT',     label: 'Gantt Timeline',      desc: 'Plan vs Actual bars',   icon: CalendarRange },
  { id: 'MAP',       label: 'Map View',            desc: 'Geo by health',         icon: MapIcon },
]

export default function PreSiteMonitorDtaPage({ authenticatedUser, onLogout }) {
  const [tab, setTab] = useState('EXEC')
  const [drawerCluster, setDrawerCluster] = useState(null)
  const [dataReady, setDataReady] = useState(false)   // re-render once live data lands

  // Pull live cluster data from the API; keep the static snapshot as fallback.
  useEffect(() => {
    let alive = true
    apiFetch('/api/presite/dta/clusters')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => {
        if (!alive || !d?.clusters?.length) return
        MOCK_CLUSTERS = d.clusters
        if (d.as_of) AS_OF_DATE = new Date(d.as_of + 'T00:00:00')
        setDataReady(x => !x)
      })
      .catch(() => {})   // offline → keep bundled snapshot
    return () => { alive = false }
  }, [])

  const current = NAV_ITEMS.find(n => n.id === tab)
  const role = authenticatedUser?.role || 'EMPLOYEE'
  const canManageMasterData = !['EMPLOYEE'].includes(role)

  return (
    <div className="flex min-h-screen bg-[#f5f7fb] text-slate-950">
      <DtaSidebar active={tab} onChange={setTab} />

      <div className="flex-1 min-w-0">
        <DtaTopBar user={authenticatedUser} onLogout={onLogout} />

        <main className="px-5 py-6 lg:px-8">
          {/* mobile nav (sidebar is lg-only) */}
          <div className="mb-4 lg:hidden">
            <Tabs items={NAV_ITEMS.map(n => ({ value: n.id, label: n.label }))} value={tab} onChange={setTab} />
          </div>

          {canManageMasterData && <MissingDataBanner />}

          <div className="mb-5">
            <div className="text-[11px] font-black uppercase tracking-[.14em] text-[#2447d8]">Cluster Lifecycle</div>
            <h1 className="mt-1 text-2xl font-black text-slate-950">{current?.label}</h1>
          </div>

          {/* key on dataReady so views recompute their memoized data when live data lands */}
          <div key={String(dataReady)}>
            {tab === 'EXEC'      && <ExecutiveView onOpen={setDrawerCluster} />}
            {tab === 'TIMELINE'  && <TimelineView onOpen={setDrawerCluster} />}
            {tab === 'DASHBOARD' && <DashboardView />}
            {tab === 'SCORECARD' && <ScorecardView />}
            {tab === 'FUNNEL'    && <FunnelView />}
            {tab === 'BOARD'     && <OwnerBoardView onOpen={setDrawerCluster} />}
            {tab === 'ASSIGN'    && <AssignView />}
            {tab === 'GANTT'     && <GanttView onOpen={setDrawerCluster} />}
            {tab === 'MAP'       && <MapViewPanel onOpen={setDrawerCluster} />}
          </div>
        </main>
      </div>

      <Drawer
        open={!!drawerCluster}
        onClose={() => setDrawerCluster(null)}
        title={drawerCluster?.code}
      >
        {drawerCluster && <ClusterDetail cluster={drawerCluster} />}
      </Drawer>
    </div>
  )
}

function MissingDataBanner() {
  const [data, setData] = useState(null)
  useEffect(() => {
    apiFetch('/api/data-imports/last')
      .then(r => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => {})
  }, [])
  if (!data) return null
  const isdpTotals = data.totals?.ISDP
  if (!isdpTotals?.sites) return null
  const missing = isdpTotals.sites - isdpTotals.with_rf_cluster
  if (missing < 50) return null  // small gaps aren't actionable
  const pct = Math.round((missing / isdpTotals.sites) * 100)
  const lastIsdp = data.data?.ISDP
  const stale = !lastIsdp || (Date.now() - new Date(lastIsdp.uploaded_at || 0).getTime()) > 14 * 24 * 3600 * 1000
  return (
    <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-amber-100 p-2 text-amber-700">
          <AlertTriangle size={20} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-black text-amber-900">
            RF Cluster Name missing on {missing.toLocaleString()} sites ({pct}%){stale ? ' · ISDP feed stale' : ''}
          </div>
          <div className="text-xs font-semibold text-amber-700">
            Cluster grouping relies on ISDP mapping. Re-upload the latest rollout plan to refresh.
          </div>
        </div>
      </div>
      <a
        href="/projects/manage"
        onClick={e => { e.preventDefault(); try { localStorage.setItem('ace_project_active_nav', 'master_data') } catch {}; window.location.href = '/projects/manage' }}
        className="ml-auto inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-amber-700"
      >
        Open Master Data <ChevronRight size={14} />
      </a>
    </div>
  )
}

/* ============================================================
   PAGE-LOCAL SIDEBAR + TOPBAR (self-contained, no PlatformShell)
   ============================================================ */
function DtaSidebar({ active, onChange }) {
  return (
    <aside className="hidden lg:sticky lg:top-0 lg:flex h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg"
             style={{ background: 'linear-gradient(135deg, #2447d8, #c73b32)' }}>
          <Command size={24} />
        </div>
        <div className="min-w-0">
          <div className="text-base font-black text-slate-950">Pre-Site (DTA)</div>
          <div className="text-xs font-bold text-slate-400">TRUE-MERGE · EAS Cluster</div>
        </div>
      </div>

      <nav className="mt-8 space-y-2">
        {NAV_ITEMS.map(item => {
          const on = item.id === active
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition ${on ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'}`}
            >
              <Icon size={19} />
              <span className="flex min-w-0 flex-col">
                <span>{item.label}</span>
                <span className={`text-[.66rem] font-semibold ${on ? 'text-blue-600/80' : 'text-slate-400'}`}>{item.desc}</span>
              </span>
            </button>
          )
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-sm font-black text-slate-900">
          <Sparkles size={18} style={{ color: '#2447d8' }} /> Cluster Workspace
        </div>
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
          289 clusters · lifecycle, schedule health, owner scorecard.
        </p>
      </div>
    </aside>
  )
}

function DtaTopBar({ user, onLogout }) {
  const initials = (user?.full_name || user?.employee_code || 'U').slice(0, 2).toUpperCase()
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 px-5 py-3 backdrop-blur lg:px-8">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">Project · TRUE-MERGE</div>
          <div className="truncate text-sm font-black text-slate-900">Pre-Site Monitor (DTA)</div>
        </div>
        <Button variant="ghost" icon={RefreshCw} onClick={() => window.location.reload()}>Refresh</Button>
        {user && (
          <span className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 sm:flex">
            <span className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-black text-white" style={{ background: '#2447d8' }}>{initials}</span>
            <span className="text-xs font-bold text-slate-700">{user.full_name || user.employee_code}</span>
          </span>
        )}
        {onLogout && <Button variant="ghost" icon={LogOut} onClick={onLogout} aria-label="Logout" />}
      </div>
    </header>
  )
}

/* ============================================================
   TIMELINE VIEW
   ============================================================ */
const MONTH_ORDER = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function TimelineView({ onOpen }) {
  const [filterOwner, setFilterOwner] = useState('ALL')
  const [filterMonth, setFilterMonth] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [search, setSearch] = useState('')

  const owners = useMemo(() => Array.from(new Set(MOCK_CLUSTERS.map(c => c.owner))).sort(), [])
  const months = useMemo(() => Array.from(new Set(MOCK_CLUSTERS.map(c => c.target_month).filter(m => m && m !== '—')))
    .sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b)), [])

  const filtered = useMemo(() => MOCK_CLUSTERS.filter(c => {
    if (filterOwner !== 'ALL' && c.owner !== filterOwner) return false
    if (filterMonth !== 'ALL' && c.target_month !== filterMonth) return false
    if (filterStatus === 'DONE' && c.current_phase < DONE_PHASE) return false
    if (filterStatus === 'INPROG' && (c.current_phase >= DONE_PHASE || c.current_phase < 5)) return false
    if (filterStatus === 'AT_RISK' && c.health === 'green') return false
    if (filterStatus === 'EARLY' && c.current_phase >= 5) return false
    if (filterStatus === 'DTE_READY' && !c.dte_ready_at) return false
    if (search && !c.code.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [filterOwner, filterMonth, filterStatus, search])

  const stats = useMemo(() => ({
    total: MOCK_CLUSTERS.length,
    done: MOCK_CLUSTERS.filter(c => c.current_phase >= DONE_PHASE).length,
    inProg: MOCK_CLUSTERS.filter(c => c.current_phase < DONE_PHASE && c.current_phase >= 5).length,
    atRisk: MOCK_CLUSTERS.filter(c => c.health !== 'green').length,
    early: MOCK_CLUSTERS.filter(c => c.current_phase < 5).length,
  }), [])

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Total Active" value={stats.total} accent={BRAND} icon={Layers} />
        <StatCard label="Done (PAT)" value={stats.done} hint="PAT Approved" accent={GREEN} icon={CheckCircle2} />
        <StatCard label="In Progress" value={stats.inProg} accent={BRAND} icon={Activity} />
        <StatCard label="At Risk" value={stats.atRisk} hint="needs review" hintTone="down" accent={RED} icon={AlertTriangle} />
        <StatCard label="Early Stage" value={stats.early} accent={AMBER} icon={Clock} />
      </div>

      <Card className="p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
          <Field label="Search" icon={Search}>
            <Input placeholder="Search EAS code..." value={search} onChange={e => setSearch(e.target.value)} />
          </Field>
          <Field label="Owner">
            <Select value={filterOwner} onChange={e => setFilterOwner(e.target.value)}>
              <option value="ALL">All Owners</option>
              {owners.map(o => <option key={o} value={o}>{o}</option>)}
            </Select>
          </Field>
          <Field label="Target Month">
            <Select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
              <option value="ALL">All Months</option>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="ALL">All Status</option>
              <option value="DONE">Done</option>
              <option value="INPROG">In Progress</option>
              <option value="AT_RISK">At Risk</option>
              <option value="EARLY">Early Stage</option>
              <option value="DTE_READY">DTE Ready (handoff)</option>
            </Select>
          </Field>
          <div className="xl:ml-auto text-xs font-black text-slate-500">
            <span className="text-[#2447d8] text-base">{filtered.length}</span> clusters found
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={Layers} title="No clusters match the filters" desc="Try adjusting the filters or search" />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filtered.map(c => <ClusterCard key={c.code} cluster={c} onOpen={onOpen} />)}
        </div>
      )}
    </div>
  )
}

function ClusterCard({ cluster: c, onOpen }) {
  const dates = milestoneDates(c)
  const currentDate = dates[c.current_phase]
  return (
    <Card className="cursor-pointer p-5 transition hover:-translate-y-0.5 hover:shadow-md" >
      <div onClick={() => onOpen(c)}>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-base font-black text-slate-950">{c.code}</div>
              <Badge tone={HEALTH_TONE[c.health]} dot>{HEALTH_LABEL[c.health]}</Badge>
              {c.dte_ready_at && <Badge tone="green" dot>DTE Ready</Badge>}
              {c.pa_round > 0 && <Badge tone="purple">PA R{c.pa_round}/{PA_LOOP_MAX}</Badge>}
              <VarianceBadge v={scheduleVariance(c)} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-slate-500">
              <span className="flex items-center gap-1"><Users size={11} />{c.owner}</span>
              <span className="flex items-center gap-1"><CalendarDays size={11} />Target {c.target_month}</span>
              <span className="flex items-center gap-1"><MapPin size={11} />{c.site_count} sites · {Math.round(c.readiness*100)}%</span>
              <span className="flex items-center gap-1"><Clock size={11} />Start {c.started ? fmtDateFull(new Date(c.started + 'T00:00:00')) : '—'}</span>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-300" />
        </div>

        <div className="mt-5">
          <TimelineStepper currentPhase={c.current_phase} health={c.health} paRound={c.pa_round} dates={dates} />
        </div>

        <div className="mt-4 flex items-baseline gap-4">
          <CardStat label="Phase" value={MILESTONES[c.current_phase - 1].label} color={healthColor(c.health)} />
          <CardStat label="Total Age" value={`${c.age_total}d`} />
          <CardStat label="Stuck" value={`${c.age_at_phase}d`} color={c.age_at_phase > 7 ? RED : SLATE} />
          <CardStat label="Since" value={fmtDate(currentDate) || '—'} />
        </div>

        <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-600">
          <span className="text-slate-400">Status:</span> {c.status}
          <div className="mt-0.5 text-slate-500">→ {c.last_action}</div>
        </div>
      </div>
    </Card>
  )
}

function CardStat({ label, value, color = '#0f172a' }) {
  return (
    <div>
      <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-sm font-black" style={{ color }}>{value}</div>
    </div>
  )
}

function TimelineStepper({ currentPhase, health, paRound = 0, dates = {} }) {
  return (
    <div className="relative">
      <div className="absolute left-0 right-0 top-3 h-1 rounded bg-slate-200" />
      <div
        className="absolute left-0 top-3 h-1 rounded"
        style={{ width: `${Math.max(0, (currentPhase - 1) / (MILESTONES.length - 1)) * 100}%`, background: `linear-gradient(90deg, ${GREEN}, ${BRAND})` }}
      />
      <div className="relative flex items-start justify-between">
        {MILESTONES.map(m => {
          const color = dotColor(m.id, currentPhase, health)
          const done = m.id < currentPhase
          const here = m.id === currentPhase
          const isLoop = m.key === 'pa_loop'
          const showRound = isLoop && paRound > 0 && currentPhase >= m.id
          const loopLabel = isLoop && paRound > 0 ? `R${paRound}/${PA_LOOP_MAX}` : m.short
          return (
            <div key={m.id} className="flex flex-col items-center" style={{ width: `${100/MILESTONES.length}%` }}>
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${here ? 'ring-4 ring-blue-100' : ''} ${showRound ? 'ring-2 ring-purple-200' : ''}`}
                style={{ background: showRound ? PURPLE : (done || here ? color : 'white'), borderColor: showRound ? PURPLE : color }}
              >
                {showRound ? <span className="text-[.6rem] font-black text-white leading-none">{paRound}</span> : (
                  <>
                    {done && <CheckCircle2 size={12} className="text-white" />}
                    {here && !done && <Activity size={11} className="text-white" />}
                    {m.isPay && <Wallet size={10} className={done || here ? 'text-white' : 'text-slate-300'} />}
                  </>
                )}
              </div>
              <div className={`mt-1.5 text-[.55rem] font-bold ${showRound ? 'text-purple-700' : here ? 'text-blue-700' : done ? 'text-slate-600' : 'text-slate-300'}`}>{loopLabel}</div>
              <div className="mt-0.5 h-3 text-[.5rem] font-semibold leading-none text-slate-400">{fmtDate(dates[m.id]) || ''}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ============================================================
   CLUSTER DETAIL (inside Drawer)
   ============================================================ */
// Expandable per-round detail for the PA Loop milestone (Tuning & Discuss R1-4)
function PaRounds({ rounds }) {
  const Step = ({ label, date }) => (
    <div className="flex flex-col items-center text-center" style={{ minWidth: 58 }}>
      <span className={`h-2 w-2 rounded-full ${date ? 'bg-purple-500' : 'bg-slate-300'}`} />
      <span className="mt-1 text-[9px] font-black uppercase text-slate-400">{label}</span>
      <span className="text-[10px] font-bold" style={{ color: date ? '#334155' : '#cbd5e1' }}>{date ? fmtDate(toDate(date)) : '—'}</span>
    </div>
  )
  return (
    <div className="mt-1.5 ml-4 grid gap-2 border-l-2 border-purple-200 pl-4">
      {rounds.map(r => (
        <div key={r.round} className="rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-purple-600 text-[11px] font-black text-white">{r.round}</span>
            <span className="text-xs font-black text-purple-900">Round {r.round}</span>
            <div className="ml-auto flex gap-1">
              {r.pa_closed != null && <Badge tone="green">-{r.pa_closed} closed</Badge>}
              {r.pa_added != null && r.pa_added > 0 && <Badge tone="amber">+{r.pa_added} added</Badge>}
            </div>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <Step label="CR Impl" date={r.cr} />
            <Step label="Tuning" date={r.tuning_done} />
            <Step label="Compare" date={r.compare_done} />
            <Step label="Discuss" date={r.discuss_date} />
          </div>
        </div>
      ))}
    </div>
  )
}

// Cross-system links: open this cluster in Project PO / Pre-Site (DTE) / Billing.
function ClusterLinks({ cluster }) {
  const enc = encodeURIComponent(cluster.code)
  // PO uses the EAS prefix (PO list searches site names that contain it); presite matches rf_cluster_name exactly
  const eas = cluster.code.split('-')[0]
  const links = [
    { label: 'Project PO', href: `/projects/manage`, hint: `ค้นหา "${eas}" ในหน้า PO` },
    { label: 'Pre-Site (DTE)', href: `/project/presite-monitor?cluster=${enc}`, hint: 'เปิด + auto-search cluster' },
    { label: 'Billing', href: `/finance/dta-billing`, hint: 'หน้าเก็บเงิน PAC/SSV' },
  ]
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-black uppercase tracking-wide text-slate-400">เปิดใน:</span>
      {links.map(l => (
        <a key={l.label} href={l.href} title={l.hint}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">
          <Layers size={13} /> {l.label}
        </a>
      ))}
    </div>
  )
}

function ClusterDetail({ cluster }) {
  const dates = milestoneDates(cluster)
  const [loopOpen, setLoopOpen] = useState(true)
  const rounds = cluster.pa_rounds || []
  return (
    <div className="grid gap-5">
      <ClusterLinks cluster={cluster} />
      <section>
        <h3 className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">Lifecycle Timeline</h3>
        <Card className="bg-slate-50 p-5">
          <TimelineStepper currentPhase={cluster.current_phase} health={cluster.health} paRound={cluster.pa_round} dates={dates} />
        </Card>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <StatCard label="Total Age" value={`${cluster.age_total}d`} accent={SLATE} />
        <StatCard label="Stuck Here" value={`${cluster.age_at_phase}d`} accent={cluster.age_at_phase > 7 ? RED : SLATE} />
        <StatCard label="PA Round" value={cluster.pa_round ? `${cluster.pa_round}/${PA_LOOP_MAX}` : '—'} accent={cluster.pa_round > 2 ? AMBER : SLATE} />
      </section>

      {(() => {
        const v = scheduleVariance(cluster)
        if (!v) return null
        return (
          <Card className="flex items-center justify-between p-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">Schedule vs Plan</div>
              <div className="text-xs font-bold text-slate-600">
                {VAR_LABEL[v.mid]} · plan {fmtDate(toDate(cluster.plan[v.mid]))}
                {v.done ? ` → actual ${fmtDate(toDate(cluster.dates[v.mid]))}` : ' (not reached)'}
              </div>
            </div>
            <VarianceBadge v={v} />
          </Card>
        )
      })()}

      <section>
        <h3 className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">Phase Detail</h3>
        <div className="grid gap-2">
          {MILESTONES.map(m => {
            const done = m.id < cluster.current_phase
            const here = m.id === cluster.current_phase
            const tone = done ? 'green' : here ? 'blue' : 'slate'
            const statusTxt = done ? 'DONE' : here ? 'CURRENT' : 'PENDING'
            const isLoop = m.key === 'pa_loop'
            const expandable = isLoop && rounds.length > 0
            return (
              <div key={m.id}>
                <div
                  onClick={expandable ? () => setLoopOpen(o => !o) : undefined}
                  className={`flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-2.5 ${here ? 'ring-2 ring-blue-200' : ''} ${expandable ? 'cursor-pointer hover:border-purple-300 hover:bg-purple-50/40' : ''}`}
                >
                  <div className="grid h-8 w-8 place-items-center rounded-full text-xs font-black"
                       style={{ background: done ? GREEN : here ? BRAND : '#e2e8f0', color: done || here ? '#fff' : SLATE }}>
                    {m.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900">{m.label}</span>
                      {isLoop && cluster.pa_round > 0 && <Badge tone="purple">Round {cluster.pa_round}/{PA_LOOP_MAX}</Badge>}
                      {expandable && (
                        <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-black text-purple-600">
                          {rounds.length} rounds {loopOpen ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400">Zone {m.zone}{m.isPay && ' · Payment Trigger'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black" style={{ color: dates[m.id] ? '#334155' : '#cbd5e1' }}>{fmtDate(dates[m.id]) || '—'}</div>
                    {cluster.plan?.[m.id] && <div className="text-[10px] font-bold text-slate-400">plan {fmtDate(toDate(cluster.plan[m.id]))}</div>}
                    <Badge tone={tone}>{statusTxt}</Badge>
                  </div>
                </div>
                {expandable && loopOpen && <PaRounds rounds={rounds} />}
              </div>
            )
          })}
        </div>
      </section>

      {cluster.dte_ready_at && (
        <section>
          <Card className="border-emerald-200 bg-emerald-50/60 p-4">
            <div className="flex items-center gap-2 text-sm font-black text-emerald-800">
              <Badge tone="green" dot>DTE Ready</Badge> DTE ส่งงานต่อแล้ว — พร้อมทำ tuning/PA
            </div>
            <div className="mt-1 text-xs font-bold text-emerald-700/80">
              DTE จบ (ACE Approved) เมื่อ {fmtDate(toDate(cluster.dte_ready_at.slice(0, 10)))}
              {cluster.dte_ready_by && ` · โดย ${cluster.dte_ready_by}`}
            </div>
          </Card>
        </section>
      )}

      <section>
        <h3 className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Current Status</h3>
        <Card className="bg-slate-50 p-4 text-sm font-bold text-slate-700">
          <div>{cluster.status}</div>
          <div className="mt-1 text-xs text-slate-500">→ {cluster.last_action}</div>
        </Card>
      </section>
    </div>
  )
}

/* ============================================================
   DASHBOARD VIEW (from sheet "Discussion")
   ============================================================ */
function DashboardView() {
  const totalTarget = MOCK_MILESTONE_KPI.reduce((a, m) => a + m.target, 0)
  const totalSuccess = MOCK_MILESTONE_KPI.reduce((a, m) => a + m.success, 0)
  const totalOngoing = MOCK_MILESTONE_KPI.reduce((a, m) => a + m.ongoing, 0)
  const overallPct = Math.round((totalSuccess / totalTarget) * 100)
  const days = MOCK_SCURVE.map(d => d.day)

  return (
    <div className="grid gap-4">
      {/* Overall + milestone comparison */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5grid place-items-center text-center">
          <div className="mb-2 self-start text-xs font-black uppercase tracking-wide text-slate-500">Overall Success Rate</div>
          <Gauge value={overallPct} />
          <div className="mt-2 text-xs font-bold text-slate-500">{totalSuccess} done / {totalTarget} target · {totalOngoing} ongoing</div>
        </Card>

        <Card className="p-5lg:col-span-2">
          <div className="mb-4 text-xs font-black uppercase tracking-wide text-slate-500">Milestone — Target vs Success (Cluster Level)</div>
          <div className="grid gap-3">
            {MOCK_MILESTONE_KPI.map(m => {
              const pct = (m.success / m.target) * 100
              const tone = pct >= 100 ? 'green' : pct >= 90 ? 'amber' : 'red'
              return (
                <div key={m.key} className="grid gap-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span><span className="ds-mono text-slate-400">{m.key}</span> {m.label}</span>
                    <span className="ds-mono">{m.success}/{m.target}{m.ongoing > 0 && <span className="text-slate-400"> · {m.ongoing} ongoing</span>}</span>
                  </div>
                  <Progress value={pct} color={tone === 'green' ? GREEN : tone === 'amber' ? AMBER : RED} />
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* SPI cards */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-xs font-black uppercase tracking-wide text-slate-500">Schedule Performance — ahead or behind plan?</div>
          <span className="text-[11px] font-bold text-slate-400">SPI = Success ÷ Target · ≥100% = on plan</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {MOCK_MILESTONE_KPI.map(m => <SpiCard key={m.key} m={m} />)}
        </div>
      </Card>

      {/* S-Curves */}
      <div className="grid gap-4 xl:grid-cols-2">
        <SCurveCard title="S-Curve · PA Closed (Plan vs Actual)" hint="Actual line below Plan = running behind schedule" days={days} plan={MOCK_SCURVE.map(d=>d.planPA)} actual={MOCK_SCURVE.map(d=>d.actualPA)} />
        <SCurveCard title="S-Curve · PAT Submit (Plan vs Actual)" hint="Vertical gap = how many are lagging the plan" days={days} plan={MOCK_SCURVE.map(d=>d.planPAT)} actual={MOCK_SCURVE.map(d=>d.actualPAT)} />
      </div>

      {/* Site-level bottleneck */}
      <Card className="p-5">
        <div className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">Site-Level Bottleneck</div>
        <div className="flex items-center justify-between text-xs font-bold text-slate-600">
          <span>{MOCK_SITE_KPI.label}</span>
          <span className="ds-mono">{MOCK_SITE_KPI.success} / {MOCK_SITE_KPI.target} sites</span>
        </div>
        <div className="mt-1"><Progress value={(MOCK_SITE_KPI.success / MOCK_SITE_KPI.target) * 100} color={RED} /></div>
        <div className="mt-3 rounded-xl border border-dashed border-rose-300 bg-rose-50/60 px-4 py-2.5 text-xs font-bold text-rose-800">
          🔴 Biggest weak point: Site-Level PA approval is only {Math.round((MOCK_SITE_KPI.success/MOCK_SITE_KPI.target)*100)}% — while Cluster-Level is at {overallPct}%
        </div>
      </Card>

      <p className="text-[11px] font-semibold text-slate-400">Sample data from sheet "Discussion" (as of 29 May) + "Daily Progress" — will auto-refresh once the live API is connected</p>
    </div>
  )
}

function SpiCard({ m }) {
  const spi = m.success / m.target
  const ahead = spi >= 1
  const onTrack = spi >= 0.9
  const tone = ahead ? 'green' : onTrack ? 'amber' : 'red'
  const color = ahead ? GREEN : onTrack ? AMBER : RED
  const gap = m.target - m.success
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-wide text-slate-400">{m.key}</span>
        {ahead ? <TrendingUp size={16} style={{ color }} /> : <TrendingDown size={16} style={{ color }} />}
      </div>
      <div className="mt-1 h-8 text-xs font-bold leading-tight text-slate-700">{m.label}</div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-black" style={{ color }}>{Math.round(spi*100)}%</span>
        <span className="ds-mono text-[11px] font-bold text-slate-400">SPI {spi.toFixed(2)}</span>
      </div>
      <div className="mt-2"><Badge tone={tone}>{ahead ? `ahead +${m.success - m.target}` : `behind by ${gap}`}</Badge></div>
    </Card>
  )
}

function SCurveCard({ title, hint, days, plan, actual }) {
  const behind = plan[plan.length - 1] - actual[actual.length - 1]
  return (
    <Card className="p-5">
      <div className="text-xs font-black uppercase tracking-wide text-slate-500">{title}</div>
      <p className="mt-0.5 mb-2 text-[11px] font-semibold text-slate-400">{hint}</p>
      <LineChart
        height={210}
        labels={days}
        series={[
          { name: 'Plan', data: plan, color: '#94a3b8', dashed: true },
          { name: 'Actual', data: actual, color: BRAND, fill: true },
        ]}
      />
      <div className="mt-1 flex items-center gap-4 text-[11px] font-bold text-slate-500">
        <span className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-slate-400" />Plan</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-4" style={{ background: BRAND }} />Actual</span>
        <span className="ml-auto font-black" style={{ color: behind > 0 ? RED : GREEN }}>{behind > 0 ? `${behind} behind plan` : 'On plan ✓'}</span>
      </div>
    </Card>
  )
}

/* ============================================================
   SCORECARD VIEW
   ============================================================ */
function ScorecardView() {
  const [month, setMonth] = useState('ALL')
  const months = useMemo(() => Array.from(new Set(MOCK_CLUSTERS.map(c => c.target_month).filter(m => m && m !== '—')))
    .sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b)), [])

  // build scorecard per DTA (real owner) from actual cluster data
  const rows = useMemo(() => {
    const owners = Array.from(new Set(MOCK_CLUSTERS.map(c => c.owner))).sort()
    return owners.map(owner => {
      const list = MOCK_CLUSTERS.filter(c => c.owner === owner && (month === 'ALL' || c.target_month === month))
      const plan = list.length                                        // assigned clusters = target
      const actual = list.filter(c => c.current_phase >= DONE_PHASE).length  // completed (PAC Approved)
      const atRisk = list.filter(c => c.health !== 'green' && c.current_phase < DONE_PHASE).length
      return { owner, plan, actual, gap: actual - plan, pct: plan ? (actual / plan) * 100 : 0, atRisk }
    }).filter(r => r.plan > 0)
  }, [month, months])

  const total = rows.reduce((a, r) => ({ plan: a.plan + r.plan, actual: a.actual + r.actual, atRisk: a.atRisk + r.atRisk }), { plan: 0, actual: 0, atRisk: 0 })
  total.gap = total.actual - total.plan
  total.pct = total.plan ? (total.actual / total.plan) * 100 : 0

  const gapCell = g => <span className="ds-mono font-black" style={{ color: g < 0 ? RED : GREEN }}>{g >= 0 ? '+' : ''}{g}</span>
  const pctCell = p => (
    <div className="flex items-center gap-2">
      <Progress value={p} color={p >= 100 ? GREEN : p >= 80 ? BRAND : p >= 50 ? AMBER : RED} />
      <span className="ds-mono w-10 text-right text-xs font-black text-slate-600">{Math.round(p)}%</span>
    </div>
  )

  const head = ['DTA', 'Assigned', 'Completed', 'Gap', 'At Risk', '% Complete']
  const tableRows = rows.map(r => [
    <b>{r.owner}</b>,
    <span className="ds-mono">{r.plan}</span>,
    <span className="ds-mono font-black text-[#2447d8]">{r.actual}</span>,
    gapCell(r.gap),
    r.atRisk > 0 ? <Badge tone="amber">{r.atRisk}</Badge> : <span className="text-slate-300">—</span>,
    pctCell(r.pct),
  ])
  tableRows.push([
    <b>TOTAL</b>,
    <span className="ds-mono font-black">{total.plan}</span>,
    <span className="ds-mono font-black text-[#2447d8]">{total.actual}</span>,
    gapCell(total.gap),
    total.atRisk > 0 ? <Badge tone="amber">{total.atRisk}</Badge> : <span className="text-slate-300">—</span>,
    pctCell(total.pct),
  ])

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <Field label="Target Month">
          <Select value={month} onChange={e => setMonth(e.target.value)}>
            <option value="ALL">All months</option>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </Select>
        </Field>
      </div>
      <Card><Table head={head} rows={tableRows} /></Card>
      <Card className="border-dashed bg-blue-50/40 p-4 text-xs font-bold text-blue-900">
        💡 Per DTA · Assigned = clusters owned · Completed = reached PAC Approved · At Risk = not green and not yet completed
      </Card>
    </div>
  )
}

/* ============================================================
   FUNNEL VIEW
   ============================================================ */
function FunnelView() {
  const total = MOCK_CLUSTERS.length
  // reached = clusters that have passed/are at this milestone (current_phase >= m.id) → true funnel
  // current = clusters sitting exactly at this milestone right now (the queue/backlog there)
  const buckets = MILESTONES.map(m => ({
    ...m,
    reached: MOCK_CLUSTERS.filter(c => c.current_phase >= m.id).length,
    current: MOCK_CLUSTERS.filter(c => c.current_phase === m.id).length,
  }))
  const zoneTone = { A: BRAND, B: AMBER, C: GREEN }
  const maxCurrent = Math.max(1, ...buckets.map(b => b.current))
  // biggest backlog phase (excluding the final done bucket)
  const bottleneck = buckets.filter(b => b.id < DONE_PHASE).reduce((a, b) => b.current > a.current ? b : a, { current: 0 })

  return (
    <div className="grid gap-4">
      <Card className="p-5">
        <div className="mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Pipeline Funnel — clusters reaching each stage</div>
        <p className="mb-4 text-[11px] font-semibold text-slate-400">
          Bar = % of all {total} clusters that have reached this stage (cumulative). The pill on the right = how many are sitting at that stage right now.
        </p>
        <div className="grid gap-2">
          {buckets.map(b => {
            const w = (b.reached / total) * 100
            return (
              <div key={b.id} className="flex items-center gap-3">
                <div className="w-44 shrink-0">
                  <div className="text-xs font-black text-slate-800">{b.id}. {b.label}</div>
                  <div className="text-[10px] font-bold text-slate-400">Zone {b.zone}{b.isPay && ' · 💰'}</div>
                </div>
                <div className="relative h-8 flex-1 overflow-hidden rounded-lg bg-slate-100">
                  <div className="flex h-full items-center rounded-lg px-3 text-xs font-black text-white" style={{ width: `${Math.max(w, 6)}%`, background: zoneTone[b.zone] }}>
                    {b.reached} <span className="ml-1 opacity-75">({Math.round(w)}%)</span>
                  </div>
                </div>
                <div className="w-28 shrink-0 text-right">
                  {b.current > 0
                    ? <Badge tone={b.id === DONE_PHASE ? 'green' : b.current >= 10 ? 'red' : b.current > 3 ? 'amber' : 'slate'}>{b.current} here now</Badge>
                    : <span className="text-[11px] font-bold text-slate-300">—</span>}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card className="border-dashed bg-amber-50/50 p-4 text-xs font-bold text-amber-800">
        🚨 Bottleneck: <b>{bottleneck.current}</b> clusters are stuck at <b>{bottleneck.label}</b> (the largest backlog before completion).
        {bottleneck.current >= 10 && ' This exceeds the 10-cluster alert threshold.'}
      </Card>
    </div>
  )
}

/* ============================================================
   OWNER BOARD VIEW (Kanban by owner)
   ============================================================ */
function OwnerBoardView({ onOpen }) {
  const owners = useMemo(() => Array.from(new Set(MOCK_CLUSTERS.map(c => c.owner))).sort(), [])
  const byOwner = useMemo(() => {
    const m = {}
    owners.forEach(o => { m[o] = [] })
    MOCK_CLUSTERS.forEach(c => { (m[c.owner] = m[c.owner] || []).push(c) })
    // sort each column: at-risk first, then by variance (worst behind first)
    Object.values(m).forEach(list => list.sort((a, b) => {
      const va = scheduleVariance(a)?.days ?? -999
      const vb = scheduleVariance(b)?.days ?? -999
      return vb - va
    }))
    return m
  }, [owners])

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {owners.map(owner => {
        const list = byOwner[owner] || []
        const risk = list.filter(c => c.health !== 'green').length
        const done = list.filter(c => c.current_phase >= DONE_PHASE).length
        return (
          <div key={owner} className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50/60">
            <div className="sticky top-0 rounded-t-2xl border-b border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                  <span className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-black text-white" style={{ background: BRAND }}>
                    {owner.split(' ').map(x => x[0]).join('').slice(0, 2)}
                  </span>
                  {owner}
                </div>
                <span className="ds-mono text-xs font-black text-slate-500">{list.length}</span>
              </div>
              <div className="mt-2 flex gap-1.5">
                <Badge tone="green">{done} done</Badge>
                {risk > 0 && <Badge tone="red">{risk} risk</Badge>}
              </div>
            </div>
            <div className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto p-3">
              {list.map(c => {
                const v = scheduleVariance(c)
                return (
                  <button key={c.code} type="button" onClick={() => onOpen(c)}
                    className="rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-black text-slate-900">{c.code}</span>
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: healthColor(c.health) }} />
                    </div>
                    <div className="mt-1 text-[11px] font-bold text-slate-400">
                      {MILESTONES[c.current_phase - 1].label} · {c.site_count} sites
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.pa_round > 0 && <Badge tone="purple">R{c.pa_round}</Badge>}
                      <VarianceBadge v={v} />
                    </div>
                  </button>
                )
              })}
              {!list.length && <div className="py-6 text-center text-xs font-bold text-slate-400">No clusters</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ============================================================
   GANTT VIEW (Plan vs Actual horizontal bars)
   ============================================================ */
const GANTT_OPEN_MID = 6   // PA Open (40%) — span start
const GANTT_END_MID = 11   // PAC Approved (60%) — span end

function GanttView({ onOpen }) {
  const [scope, setScope] = useState('ALL')   // ALL | RISK | INPROG

  // each row spans PA Open → PAC Approved, plan vs actual on separate tracks
  const rows = useMemo(() => MOCK_CLUSTERS
    .map(c => {
      const planStart = c.plan?.[GANTT_OPEN_MID] ? toDate(c.plan[GANTT_OPEN_MID]) : null
      const planEnd   = c.plan?.[GANTT_END_MID]  ? toDate(c.plan[GANTT_END_MID])  : null
      const actStart  = c.dates?.[GANTT_OPEN_MID] ? toDate(c.dates[GANTT_OPEN_MID]) : null
      const actEnd    = c.dates?.[GANTT_END_MID]  ? toDate(c.dates[GANTT_END_MID])  : null
      return { c, planStart, planEnd, actStart, actEnd, v: scheduleVariance(c) }
    })
    .filter(r => r.planStart || r.actStart)           // need at least one timeline
    .filter(r => {
      if (scope === 'RISK') return r.c.health !== 'green'
      if (scope === 'INPROG') return r.c.current_phase < DONE_PHASE
      return true
    })
    .sort((a, b) => (a.planStart || a.actStart) - (b.planStart || b.actStart)), [scope])

  const { min, max } = useMemo(() => {
    const all = rows.flatMap(r => [r.planStart, r.planEnd, r.actStart, r.actEnd].filter(Boolean))
    if (!all.length) return { min: new Date(), max: new Date() }
    return { min: new Date(Math.min(...all)), max: new Date(Math.max(...all, AS_OF_DATE)) }
  }, [rows])

  const span = Math.max(1, dayDiff(max, min))
  const left = d => `${Math.max(0, dayDiff(d, min) / span) * 100}%`
  const width = (a, b) => `${Math.max(1.5, dayDiff(b, a) / span * 100)}%`
  const ticks = useMemo(() => {
    const out = []
    const d = new Date(min.getFullYear(), min.getMonth(), 1)
    while (d <= max) { out.push(new Date(d)); d.setMonth(d.getMonth() + 1) }
    return out
  }, [min, max])
  const todayLeft = left(AS_OF_DATE)

  return (
    <Card className="p-5">
      <div className="mb-3 flex flex-wrap items-center gap-4">
        <div className="text-xs font-black uppercase tracking-wide text-slate-500">Plan vs Actual (PA Open → PAC Approved)</div>
        <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
          <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-5 rounded bg-slate-300" />Plan</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-5 rounded" style={{ background: BRAND }} />Actual</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-5 rounded" style={{ background: RED }} />Behind plan</span>
        </div>
        <select value={scope} onChange={e => setScope(e.target.value)} className="ml-auto rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700">
          <option value="ALL">All ({MOCK_CLUSTERS.length})</option>
          <option value="INPROG">In progress</option>
          <option value="RISK">At risk</option>
        </select>
      </div>

      {!rows.length ? (
        <div className="py-12 text-center text-sm font-bold text-slate-400">No clusters with plan/actual dates in this scope</div>
      ) : (
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          {/* month axis */}
          <div className="relative ml-44 h-5 border-b border-slate-200">
            {ticks.map((t, i) => (
              <div key={i} className="absolute -translate-x-1/2 text-[10px] font-bold text-slate-400" style={{ left: left(t) }}>
                {t.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}
              </div>
            ))}
          </div>

          {/* rows */}
          <div className="mt-1 space-y-1.5">
            {rows.map(({ c, planStart, planEnd, actStart, actEnd, v }) => {
              const over = v?.done && v.days > 0
              return (
                <button key={c.code} type="button" onClick={() => onOpen(c)}
                  className="flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left hover:bg-slate-50">
                  <div className="w-44 shrink-0 truncate text-xs font-black text-slate-800">{c.code}</div>
                  <div className="relative h-6 flex-1 rounded bg-slate-50">
                    {/* today marker */}
                    <div className="absolute bottom-0 top-0 w-px bg-rose-300" style={{ left: todayLeft }} />
                    {/* plan bar (top track) */}
                    {planStart && planEnd && <div className="absolute top-0.5 h-2 rounded bg-slate-300" style={{ left: left(planStart), width: width(planStart, planEnd) }} title={`Plan ${fmtDate(planStart)} → ${fmtDate(planEnd)}`} />}
                    {/* actual bar (bottom track) */}
                    {actStart && actEnd && <div className="absolute top-3 h-2 rounded" style={{ left: left(actStart), width: width(actStart, actEnd), background: over ? RED : BRAND }} title={`Actual ${fmtDate(actStart)} → ${fmtDate(actEnd)}`} />}
                    {/* actual ongoing (no end yet) → from actStart to today */}
                    {actStart && !actEnd && <div className="absolute top-3 h-2 rounded opacity-60" style={{ left: left(actStart), width: width(actStart, AS_OF_DATE), background: BRAND }} title={`Actual ${fmtDate(actStart)} → now (ongoing)`} />}
                  </div>
                  <div className="w-24 shrink-0 text-right"><VarianceBadge v={v} /></div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
      )}

      <p className="mt-3 text-[11px] font-semibold text-slate-400">
        Top bar = plan · bottom bar = actual (faded = still ongoing) · red = finished behind plan · rose line = today ({fmtDate(AS_OF_DATE)}) · click a row for details
      </p>
    </Card>
  )
}

/* ============================================================
   MAP VIEW (real coords from project_sites via /api/presite/cluster-geo)
   ============================================================ */
// fallback when a cluster has no geocoded site in the DB → scatter around Bangkok
function mockLatLng(code) {
  let h = 0
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) >>> 0
  const lat = 13.55 + ((h % 1000) / 1000) * 0.55
  const lng = 100.35 + (((h >> 10) % 1000) / 1000) * 0.55
  return { lat, lng }
}
const HEALTH_MAP_STATUS = { green: 'on', amber: 'office', red: 'off' }

function MapViewPanel({ onOpen }) {
  const [geo, setGeo] = useState(null)       // { [rf_cluster_name]: {lat,lng,sites,...} }
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [onlyGeo, setOnlyGeo] = useState(false)

  useEffect(() => {
    let alive = true
    apiFetch('/api/presite/cluster-geo')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => { if (alive) { setGeo(d.clusters || {}); setLoading(false) } })
      .catch(() => { if (alive) { setGeo({}); setLoading(false) } })
    return () => { alive = false }
  }, [])

  // join cluster data with real coords — prefer the cluster's own lat/lng (from
  // /api/presite/dta/clusters), then the cluster-geo endpoint, then a mock point.
  const rows = useMemo(() => {
    const g = geo || {}
    return MOCK_CLUSTERS.map(c => {
      const own = (c.lat != null && c.lng != null) ? { lat: c.lat, lng: c.lng } : null
      const ext = g[c.code]
      const real = own || ext
      const pos = real || mockLatLng(c.code)
      return { c, lat: pos.lat, lng: pos.lng, real: !!real, sites: ext?.sites ?? c.site_count }
    })
  }, [geo])

  const filtered = useMemo(() => rows.filter(({ c, real }) => {
    if (onlyGeo && !real) return false
    if (search) {
      const q = search.toLowerCase()
      if (!c.code.toLowerCase().includes(q) && !(c.status || '').toLowerCase().includes(q) && !(c.owner || '').toLowerCase().includes(q)) return false
    }
    return true
  }), [rows, search, onlyGeo])

  const markers = useMemo(() => filtered.map(({ c, lat, lng, real, sites }) => ({
    lat, lng,
    name: `${c.code} · ${MILESTONES[c.current_phase - 1].label} · ${sites} sites${real ? '' : ' (approx)'}`,
    status: HEALTH_MAP_STATUS[c.health],
  })), [filtered])

  const geoCount = rows.filter(r => r.real).length
  const center = useMemo(() => {
    const real = filtered.filter(r => r.real)
    if (!real.length) return [13.79, 100.6]
    return [real.reduce((s, r) => s + r.lat, 0) / real.length, real.reduce((s, r) => s + r.lng, 0) / real.length]
  }, [filtered])

  const counts = {
    green: filtered.filter(r => r.c.health === 'green').length,
    amber: filtered.filter(r => r.c.health === 'amber').length,
    red: filtered.filter(r => r.c.health === 'red').length,
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[2.4fr_.6fr]">
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <div className="text-sm font-black text-slate-950">Cluster Geo View</div>
            <div className="text-xs font-bold text-slate-500">
              {loading ? 'Loading real coordinates…' : `${markers.length} shown · ${geoCount}/${rows.length} with real PAC coords`}
            </div>
          </div>
          <div className="flex gap-2">
            <Badge tone="green" dot>Healthy {counts.green}</Badge>
            <Badge tone="amber" dot>Watch {counts.amber}</Badge>
            <Badge tone="red" dot>At Risk {counts.red}</Badge>
          </div>
        </div>

        {/* search / filter bar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search PAC cluster / status / DTA…"
              className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400"
            />
          </div>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <input type="checkbox" className="ds-check" checked={onlyGeo} onChange={e => setOnlyGeo(e.target.checked)} />
            Real coords only
          </label>
        </div>

        {loading
          ? <div className="grid h-[72vh] place-items-center text-sm font-bold text-slate-400">Loading map…</div>
          : <MapView center={center} zoom={9} markers={markers} height={Math.round(typeof window !== 'undefined' ? window.innerHeight * 0.72 : 720)} tileTone="gray" fitToMarkers />}
      </Card>

      <Card className="p-5">
        <div className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">
          {search ? `Results (${filtered.length})` : `At-Risk Clusters`}
        </div>
        <div className="grid max-h-[68vh] gap-2 overflow-y-auto">
          {(search ? filtered : filtered.filter(r => r.c.health !== 'green')).map(({ c, real, sites }) => (
            <button key={c.code} type="button" onClick={() => onOpen(c)}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left hover:shadow-md">
              <span className="grid h-9 w-9 place-items-center rounded-lg text-white" style={{ background: healthColor(c.health) }}>
                <MapPin size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-black text-slate-900">{c.code}</span>
                  {!real && <Badge tone="slate">approx</Badge>}
                </div>
                <div className="truncate text-[11px] font-bold text-slate-400">{c.owner} · {sites} sites · {c.status}</div>
              </div>
              <VarianceBadge v={scheduleVariance(c)} />
            </button>
          ))}
          {!filtered.length && <div className="py-6 text-center text-xs font-bold text-slate-400">No clusters match</div>}
          {!search && !filtered.some(r => r.c.health !== 'green') && (
            <div className="py-6 text-center text-xs font-bold text-slate-400">No at-risk clusters 🎉</div>
          )}
        </div>
        <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-[11px] font-bold text-slate-500">
          📍 Real coordinates from <b>project_sites</b> (centroid per PAC cluster). Clusters without a geocoded site fall back to an approximate point (tagged <b>approx</b>).
        </div>
      </Card>
    </div>
  )
}

/* ============================================================
   EXECUTIVE VIEW — one-screen summary for directors / senior PMs
   ============================================================ */
// previous-month figures are mocked (sheet is a single snapshot) until history exists in the DB
const EXEC_PREV = { progress: 85, onPlan: 86, atRisk: 11, avgLife: 43, doneRate: 78 }

function ExecutiveView({ onOpen }) {
  const exec = useMemo(() => {
    const all = MOCK_CLUSTERS
    const total = all.length
    const done = all.filter(c => c.current_phase >= DONE_PHASE).length
    const atRisk = all.filter(c => c.health !== 'green').length
    const avgLife = Math.round(all.reduce((s, c) => s + (c.age_total || 0), 0) / (total || 1))

    // on-plan rate from schedule variance (ahead or on-time)
    let withPlan = 0, onPlan = 0
    all.forEach(c => {
      const v = scheduleVariance(c)
      if (v) { withPlan++; if (v.days <= 0) onPlan++ }
    })
    const onPlanRate = withPlan ? Math.round((onPlan / withPlan) * 100) : 0

    // completion rate (whole sample): assigned vs completed
    const plan = all.length
    const act = done

    // owner leaderboard
    const owners = Array.from(new Set(all.map(c => c.owner)))
    const board = owners.map(o => {
      const list = all.filter(c => c.owner === o)
      const d = list.filter(c => c.current_phase >= DONE_PHASE).length
      const risk = list.filter(c => c.health !== 'green').length
      const pct = list.length ? Math.round((d / list.length) * 100) : 0
      return { owner: o, total: list.length, done: d, risk, pct }
    }).sort((a, b) => b.pct - a.pct || b.done - a.done)

    // top risks
    const risks = all
      .filter(c => c.health !== 'green')
      .map(c => ({ c, v: scheduleVariance(c) }))
      .sort((a, b) => (b.v?.days ?? 0) - (a.v?.days ?? 0))
      .slice(0, 5)

    return {
      total, done, atRisk, avgLife,
      progress: Math.round((done / (total || 1)) * 100),
      onPlanRate, monthPlan: plan, monthAct: act,
      monthPct: plan ? Math.round((act / plan) * 100) : 0,
      board, risks,
    }
  }, [])

  return (
    <div className="grid gap-4">
      {/* ROW 1 — headline KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <ExecKpi label="Overall Progress" value={`${exec.progress}%`} prev={EXEC_PREV.progress} cur={exec.progress} suffix="%" goodUp />
        <ExecKpi label="On-Plan Rate" value={`${exec.onPlanRate}%`} prev={EXEC_PREV.onPlan} cur={exec.onPlanRate} suffix="%" goodUp />
        <ExecKpi label="At-Risk Clusters" value={exec.atRisk} prev={EXEC_PREV.atRisk} cur={exec.atRisk} goodUp={false} accent={RED} />
        <ExecKpi label="Avg Cluster Life" value={`${exec.avgLife}d`} prev={EXEC_PREV.avgLife} cur={exec.avgLife} suffix="d" goodUp={false} />
        <ExecKpi label="Completed" value={`${exec.monthAct}/${exec.monthPlan}`} prev={EXEC_PREV.doneRate} cur={exec.monthPct} suffix="%" goodUp />
      </div>

      {/* ROW 2 — S-curve forecast + milestone funnel */}
      <div className="grid gap-4 xl:grid-cols-2">
        <ExecForecastCard />
        <Card className="p-5">
          <div className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">Milestone Funnel (ISDP)</div>
          <div className="grid gap-3">
            {MOCK_MILESTONE_KPI.map(m => {
              const pct = Math.round((m.success / m.target) * 100)
              const tone = pct >= 100 ? GREEN : pct >= 90 ? AMBER : RED
              return (
                <div key={m.key} className="grid gap-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span><span className="ds-mono text-slate-400">{m.key}</span> {m.label}</span>
                    <span className="ds-mono">{pct}%</span>
                  </div>
                  <Progress value={pct} color={tone} />
                </div>
              )
            })}
          </div>
          <div className="mt-3 rounded-xl bg-rose-50/60 px-3 py-2 text-[11px] font-bold text-rose-800">
            Bottleneck: <b>PAC Approve to TRUE</b> — lowest at {Math.round((22/31)*100)}%
          </div>
        </Card>
      </div>

      {/* ROW 3 — leaderboard + top risks */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
            <Trophy size={15} className="text-amber-500" /> Owner Leaderboard
          </div>
          <div className="grid gap-2">
            {exec.board.map((b, i) => (
              <div key={b.owner} className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2">
                <span className="w-6 text-center text-sm font-black" style={{ color: i === 0 ? '#d97706' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#cbd5e1' }}>
                  {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                </span>
                <span className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-black text-white" style={{ background: BRAND }}>
                  {b.owner.replace('TH_', '').slice(0, 2).toUpperCase()}
                </span>
                <span className="flex-1 text-sm font-bold text-slate-800">{b.owner}</span>
                {b.risk > 0 && <Badge tone="red">{b.risk}</Badge>}
                <span className="ds-mono text-xs font-bold text-slate-400">{b.done}/{b.total}</span>
                <div className="w-24"><Progress value={b.pct} color={b.pct >= 80 ? GREEN : b.pct >= 50 ? AMBER : RED} /></div>
                <span className="ds-mono w-10 text-right text-xs font-black text-slate-600">{b.pct}%</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
            <AlertTriangle size={15} className="text-rose-500" /> Top Risks
          </div>
          <div className="grid gap-2">
            {exec.risks.map(({ c, v }) => (
              <button key={c.code} type="button" onClick={() => onOpen(c)}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left hover:shadow-md">
                <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ background: healthColor(c.health) }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900">{c.code}</span>
                    {c.pa_round > 0 && <Badge tone="purple">R{c.pa_round}</Badge>}
                  </div>
                  <div className="truncate text-[11px] font-bold text-slate-400">{c.owner} · {c.status}</div>
                </div>
                <VarianceBadge v={v} />
              </button>
            ))}
            {!exec.risks.length && <div className="py-6 text-center text-xs font-bold text-slate-400">No at-risk clusters 🎉</div>}
          </div>
        </Card>
      </div>

      {/* ROW 4 — health donut + revenue placeholder */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">Health Distribution</div>
          <div className="flex items-center gap-6">
            <Gauge value={exec.progress} />
            <div className="grid flex-1 gap-2 text-xs font-bold">
              <HealthRow label="Healthy" n={MOCK_CLUSTERS.filter(c => c.health === 'green').length} total={exec.total} color={GREEN} />
              <HealthRow label="Watch"   n={MOCK_CLUSTERS.filter(c => c.health === 'amber').length} total={exec.total} color={AMBER} />
              <HealthRow label="At Risk" n={MOCK_CLUSTERS.filter(c => c.health === 'red').length}   total={exec.total} color={RED} />
            </div>
          </div>
        </Card>

        <Card className="grid place-items-center border-dashed p-5 text-center">
          <Wallet size={26} className="text-slate-300" />
          <div className="mt-2 text-sm font-black text-slate-600">Revenue Impact</div>
          <div className="mt-1 text-xs font-semibold text-slate-400">At-risk revenue & payment-trigger forecast</div>
          <Badge tone="amber">Coming soon</Badge>
        </Card>
      </div>

      <p className="text-[11px] font-semibold text-slate-400">
        Sample of {exec.total} clusters · month-over-month trend figures are mocked until history exists in the DB
      </p>
    </div>
  )
}

function ExecKpi({ label, value, prev, cur, suffix = '', goodUp = true, accent }) {
  const delta = cur - prev
  const up = delta > 0
  const good = goodUp ? up : !up
  const flat = delta === 0
  return (
    <Card className="p-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-black" style={accent ? { color: accent } : undefined}>{value}</div>
      <div className={`mt-2 flex items-center gap-1 text-[11px] font-black ${flat ? 'text-slate-400' : good ? 'text-emerald-600' : 'text-rose-600'}`}>
        {!flat && (up ? <TrendingUp size={13} /> : <TrendingDown size={13} />)}
        {flat ? 'no change' : `${up ? '+' : ''}${delta}${suffix} vs last mo.`}
      </div>
    </Card>
  )
}

function HealthRow({ label, n, total, color }) {
  const pct = total ? Math.round((n / total) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span className="w-16 text-slate-600">{label}</span>
      <div className="flex-1"><Progress value={pct} color={color} /></div>
      <span className="ds-mono w-14 text-right text-slate-500">{n} · {pct}%</span>
    </div>
  )
}

// Project-level S-curve with a dashed forecast tail extrapolated from current run-rate
function ExecForecastCard() {
  const labels = MOCK_SCURVE.map(d => d.day).concat(['F1', 'F2', 'F3'])
  const actual = MOCK_SCURVE.map(d => d.actualPA)
  const plan = MOCK_SCURVE.map(d => d.planPA).concat([350, 365, 380])
  // forecast: continue at the avg daily rate of the last 3 actual points
  const a = MOCK_SCURVE.map(d => d.actualPA)
  const rate = (a[a.length - 1] - a[a.length - 4]) / 3
  const last = a[a.length - 1]
  const forecast = actual.concat([Math.round(last + rate), Math.round(last + rate * 2), Math.round(last + rate * 3)])
  const target = 380
  const etaDays = rate > 0 ? Math.ceil((target - last) / rate) : null

  return (
    <Card className="p-5">
      <div className="mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Project S-Curve + Forecast</div>
      <p className="mb-3 text-[11px] font-semibold text-slate-400">Actual run-rate projected forward (dashed) vs plan</p>
      <LineChart
        height={210}
        labels={labels}
        series={[
          { name: 'Plan', data: plan, color: '#94a3b8', dashed: true },
          { name: 'Actual', data: actual, color: BRAND, fill: true },
          { name: 'Forecast', data: forecast, color: GREEN, dashed: true },
        ]}
      />
      <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-600">
        📈 At current run-rate (~{Math.round(rate)}/day), target {target} reached in ~<b>{etaDays ?? '—'} days</b>
      </div>
    </Card>
  )
}

/* ============================================================
   OWNER (ASSIGN) — มอบหมาย DTA ให้แต่ละ cluster (PoC, client-side)
   ยังไม่เขียน DB — เก็บใน state ก่อน เพื่อดู flow การมอบหมาย
   ============================================================ */
// Official DTA team — these are the people clusters can be assigned to.
const DTA_TEAM = [
  'TH_Choowong',
  'TH_Khanchit',
  'TH_Natdanai',
  'TH_Thachatham',
  'TH_Thatsanai',
  'TH_Yodsawee',
]

function AssignView() {
  const dtaList = DTA_TEAM

  // local override map: { [clusterCode]: dtaName } — pending edits before Apply
  const [assign, setAssign] = useState({})
  const [filterDta, setFilterDta] = useState('ALL')
  const [search, setSearch] = useState('')
  const [savedFlash, setSavedFlash] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const ownerOf = c => assign[c.code] ?? c.owner ?? 'Unassigned'

  const rows = useMemo(() => MOCK_CLUSTERS.filter(c => {
    const owner = ownerOf(c)
    if (filterDta === 'UNASSIGNED' && owner !== 'Unassigned') return false
    if (filterDta !== 'ALL' && filterDta !== 'UNASSIGNED' && owner !== filterDta) return false
    if (search && !c.code.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [assign, filterDta, search])

  // workload per DTA (after pending assignment)
  const workload = useMemo(() => {
    const m = {}
    MOCK_CLUSTERS.forEach(c => { const o = ownerOf(c); m[o] = (m[o] || 0) + 1 })
    return m
  }, [assign])

  const pendingCount = Object.keys(assign).filter(k => assign[k] !== (MOCK_CLUSTERS.find(c => c.code === k)?.owner)).length

  function setOwner(code, dta) {
    setAssign(a => ({ ...a, [code]: dta }))
  }
  async function applyAll() {
    // only changed clusters
    const items = Object.keys(assign)
      .filter(code => assign[code] !== (MOCK_CLUSTERS.find(c => c.code === code)?.owner))
      .map(code => ({ cluster: code, dta_name: assign[code] }))
    if (!items.length) return
    setSaving(true); setError('')
    try {
      const r = await apiFetch('/api/presite/dta/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments: items }),
      })
      if (!r.ok) throw new Error(r.status === 403 ? 'No permission to assign' : `Save failed (${r.status})`)
      const data = await r.json()
      // reflect saved owner into the in-memory data so the table shows the new owner
      items.forEach(it => {
        const c = MOCK_CLUSTERS.find(x => x.code === it.cluster)
        if (c) c.owner = (it.dta_name && it.dta_name.toLowerCase() !== 'unassigned') ? it.dta_name : 'Unassigned'
      })
      setAssign({})
      setSavedFlash(`Saved ${data.updated} cluster${data.updated === 1 ? '' : 's'}`)
      setTimeout(() => setSavedFlash(false), 3000)
    } catch (e) {
      setError(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }
  function resetAll() { setAssign({}); setError('') }

  return (
    <div className="grid gap-4">
      {/* workload summary per DTA */}
      <Card className="p-5">
        <div className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">DTA Workload (after pending assignment)</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(workload).sort((a, b) => b[1] - a[1]).map(([dta, n]) => (
            <button key={dta} type="button" onClick={() => setFilterDta(dta)}
              className={'flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition ' +
                (filterDta === dta ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50')}>
              <span className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-black text-white" style={{ background: dta === 'Unassigned' ? '#94a3b8' : BRAND }}>
                {dta === 'Unassigned' ? '—' : dta.replace('TH_', '').replace('KH_', '').replace('PH_', '').slice(0, 2).toUpperCase()}
              </span>
              {dta}
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600">{n}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* toolbar */}
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search EAS code..."
            className="rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400" />
        </div>
        <select value={filterDta} onChange={e => setFilterDta(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700">
          <option value="ALL">All DTA</option>
          <option value="UNASSIGNED">Unassigned only</option>
          {dtaList.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <div className="ml-auto flex items-center gap-2">
          {pendingCount > 0 && <Badge tone="amber">{pendingCount} pending</Badge>}
          {savedFlash && <Badge tone="green">{typeof savedFlash === 'string' ? savedFlash : 'Saved'}</Badge>}
          {error && <Badge tone="red">{error}</Badge>}
          <Button variant="ghost" onClick={resetAll} disabled={!pendingCount || saving}>Reset</Button>
          <Button variant="primary" icon={Check} onClick={applyAll} disabled={!pendingCount || saving} loading={saving}>Apply assignment</Button>
        </div>
      </Card>

      {/* assignment table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left">Cluster</th>
                <th className="px-4 py-2 text-left">Phase</th>
                <th className="px-4 py-2 text-left">Sites</th>
                <th className="px-4 py-2 text-left">Current Owner</th>
                <th className="px-4 py-2 text-left">Assign to DTA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(c => {
                const cur = c.owner || 'Unassigned'
                const next = ownerOf(c)
                const changed = next !== cur
                return (
                  <tr key={c.code} className={changed ? 'bg-amber-50/40' : 'hover:bg-slate-50'}>
                    <td className="px-4 py-2 font-black text-slate-900">{c.code}</td>
                    <td className="px-4 py-2"><Badge tone={c.current_phase >= DONE_PHASE ? 'green' : 'slate'}>{MILESTONES[c.current_phase - 1].short}</Badge></td>
                    <td className="px-4 py-2 font-mono text-slate-500">{c.site_count}</td>
                    <td className="px-4 py-2 font-bold text-slate-600">{cur}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <select value={next} onChange={e => setOwner(c.code, e.target.value)}
                          className={'rounded-lg border px-2 py-1 text-xs font-bold ' + (changed ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-slate-200 text-slate-700')}>
                          <option value="Unassigned">— Unassigned —</option>
                          {dtaList.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        {changed && <ChevronRight size={13} className="text-amber-500" />}
                        {changed && <span className="text-[10px] font-bold text-amber-600">{cur} → {next}</span>}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!rows.length && <tr><td colSpan={5} className="py-8 text-center text-xs font-bold text-slate-400">No clusters match</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="border-dashed bg-blue-50/40 p-4 text-xs font-bold text-blue-900">
        💡 เลือก DTA ในแต่ละแถว แล้วกด "Apply assignment" เพื่อบันทึกลง DB จริง (owner_source=MANUAL). การมอบหมายเองจะไม่ถูก ETL ทับเมื่อ import sheet ใหม่ — เลือก "Unassigned" เพื่อคืนค่าให้ใช้ owner จาก sheet
      </Card>
    </div>
  )
}
