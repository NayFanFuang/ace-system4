// SystemMonitorPage — built on the ACE UI Kit pattern (local sidebar + sticky topbar
// + UI primitives), matching the look of /hr/employees and /ui-kit.
// DO NOT wrap in PlatformShell — that injects the global app sidebar which
// duplicates navigation and is explicitly unwanted on this admin monitor page.
import React, { useEffect, useMemo, useState } from 'react'
import {
  Activity, AlertTriangle, Bell, Bug, CheckCircle2, ChevronRight, Circle, CircleDashed,
  Clock as ClockIcon, Command, Database, FileWarning, HardDrive, KeyRound,
  LayoutDashboard, Lock, LogIn, LogOut, Mail, Menu, RefreshCw, Search, Shield, ShieldCheck,
  Sparkles, UserPlus, UserX, Users, X, XCircle,
} from 'lucide-react'
import {
  Alert, Badge, Button, Card, Drawer, EmptyState, LineChart, Progress, Spinner, StatCard, Table,
} from './src/ui/index.jsx'
import { apiFetch } from './src/apiFetch.js'
import { formatDateTime24 } from './src/dateFormat.js'

const ACE_BLUE = '#2447d8'
const ACE_RED  = '#c0392b'
const ACE_GRADIENT = `linear-gradient(135deg, ${ACE_BLUE} 0%, #6d3f8f 48%, ${ACE_RED} 100%)`

const AUDIT_ROLES = new Set(['SUPER_ADMIN', 'SYSTEM_ADMIN', 'HR_ADMIN', 'DIRECTOR'])
const ERROR_ROLES = ['SUPER_ADMIN', 'SYSTEM_ADMIN']

const SM_NAV = [
  { id: 'overview', label: 'Overview',      icon: LayoutDashboard },
  { id: 'health',   label: 'Health',        icon: Activity },
  { id: 'data',     label: 'Data Quality',  icon: Database },
  { id: 'security', label: 'Security',      icon: Shield },
  { id: 'email',    label: 'Email',         icon: Mail },
  { id: 'welcome',  label: 'Welcome Email', icon: ShieldCheck },
  { id: 'storage',  label: 'Storage',       icon: HardDrive, roles: ERROR_ROLES },
  { id: 'errors',   label: 'Errors',        icon: Bug, roles: ERROR_ROLES },
]

function initials(name = '') {
  return name.split(' ').map(x => x[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'SM'
}

export default function SystemMonitorPage({ authenticatedUser = null, onLogout = null }) {
  const [activeNav, setActiveNav] = useState('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [welcome, setWelcome] = useState(null)
  const [welcomeLoading, setWelcomeLoading] = useState(false)
  const [welcomeError, setWelcomeError] = useState('')
  const [detailCode, setDetailCode] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [errors, setErrors] = useState(null)
  const [errorsLoading, setErrorsLoading] = useState(false)
  const [errorsErr, setErrorsErr] = useState('')
  const [errorId, setErrorId] = useState(null)
  const [errorDetail, setErrorDetail] = useState(null)
  const [errorDetailLoading, setErrorDetailLoading] = useState(false)
  const [errorDetailErr, setErrorDetailErr] = useState('')
  const [storage, setStorage] = useState(null)
  const [storageLoading, setStorageLoading] = useState(false)
  const [storageErr, setStorageErr] = useState('')

  async function load() {
    setLoading(true); setError('')
    try {
      const r = await apiFetch('/api/system/monitor')
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.detail || 'Cannot load system monitor')
      setData(j)
    } catch (err) {
      setError(err?.message || 'Cannot load system monitor')
    } finally { setLoading(false) }
  }

  async function loadWelcome() {
    setWelcomeLoading(true); setWelcomeError('')
    try {
      const r = await apiFetch('/api/system/monitor/welcome-emails')
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.detail || 'Cannot load welcome email monitor')
      setWelcome(j)
    } catch (err) {
      setWelcomeError(err?.message || 'Cannot load welcome email monitor')
    } finally { setWelcomeLoading(false) }
  }

  async function loadErrors() {
    setErrorsLoading(true); setErrorsErr('')
    try {
      const r = await apiFetch('/api/system/monitor/errors')
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.detail || 'Cannot load error monitor')
      setErrors(j)
    } catch (err) {
      setErrorsErr(err?.message || 'Cannot load error monitor')
    } finally { setErrorsLoading(false) }
  }

  async function loadStorage() {
    setStorageLoading(true); setStorageErr('')
    try {
      const r = await apiFetch('/api/system/monitor/storage')
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.detail || 'Cannot load storage monitor')
      setStorage(j)
    } catch (err) {
      setStorageErr(err?.message || 'Cannot load storage monitor')
    } finally { setStorageLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { if (activeNav === 'welcome' && !welcome && !welcomeLoading) loadWelcome() }, [activeNav])
  useEffect(() => { if (activeNav === 'errors' && !errors && !errorsLoading) loadErrors() }, [activeNav])
  useEffect(() => { if (activeNav === 'storage' && !storage && !storageLoading) loadStorage() }, [activeNav])

  function openError(id) {
    if (id == null) return
    setErrorId(id); setErrorDetail(null); setErrorDetailErr(''); setErrorDetailLoading(true)
    apiFetch(`/api/system/monitor/errors/${id}`)
      .then(async r => {
        const j = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(j.detail || 'Cannot load error detail')
        setErrorDetail(j)
      })
      .catch(err => setErrorDetailErr(err?.message || 'Cannot load error detail'))
      .finally(() => setErrorDetailLoading(false))
  }
  function closeError() { setErrorId(null); setErrorDetail(null); setErrorDetailErr('') }
  async function toggleResolve(id) {
    try {
      const r = await apiFetch(`/api/system/monitor/errors/${id}/resolve`, { method: 'POST' })
      if (r.ok) { loadErrors(); if (errorDetail?.id === id) openError(id) }
    } catch { /* ignore */ }
  }

  function openDetail(employeeCode) {
    if (!employeeCode) return
    setDetailCode(employeeCode); setDetail(null); setDetailError(''); setDetailLoading(true)
    apiFetch(`/api/system/monitor/welcome-emails/${encodeURIComponent(employeeCode)}`)
      .then(async r => {
        const j = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(j.detail || 'Cannot load detail')
        setDetail(j)
      })
      .catch(err => setDetailError(err?.message || 'Cannot load detail'))
      .finally(() => setDetailLoading(false))
  }
  function closeDetail() { setDetailCode(null); setDetail(null); setDetailError('') }

  const canViewAudit = AUDIT_ROLES.has(authenticatedUser?.role)
  const nav = useMemo(() => SM_NAV.filter(n => !n.roles || n.roles.includes(authenticatedUser?.role)), [authenticatedUser])
  const isWelcomeTab = activeNav === 'welcome'
  const isErrorTab = activeNav === 'errors'
  const isStorageTab = activeNav === 'storage'
  const refreshing = isWelcomeTab ? welcomeLoading : isErrorTab ? errorsLoading : isStorageTab ? storageLoading : loading
  const onRefresh = isWelcomeTab ? loadWelcome : isErrorTab ? loadErrors : isStorageTab ? loadStorage : load

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="flex min-h-screen">
        <SMSidebar
          nav={nav}
          activeNav={activeNav}
          setActiveNav={id => { setActiveNav(id); setMobileMenuOpen(false) }}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />

        {mobileMenuOpen && (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/86 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <IconButton label="Open menu" onClick={() => setMobileMenuOpen(true)}>
                <Menu size={19} />
              </IconButton>
              <div className="hidden min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-400 md:flex">
                <Search size={18} />
                <span className="text-sm font-semibold">System Monitor · {nav.find(n => n.id === activeNav)?.label}</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="hidden text-xs font-bold text-slate-500 sm:inline">
                  {data?.generated_at ? formatDateTime24(data.generated_at, true) : '-'}
                </span>
                <Button
                  variant="primary"
                  icon={RefreshCw}
                  loading={refreshing}
                  onClick={onRefresh}
                >
                  Refresh
                </Button>
                <IconButton label="Notifications">
                  <Bell size={18} />
                </IconButton>
                <button className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:bg-slate-50 sm:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-black text-white" style={{ background: ACE_BLUE }}>
                    {initials(authenticatedUser?.name || 'Sys Admin')}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black text-slate-900">{authenticatedUser?.name || 'Sys Admin'}</div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{authenticatedUser?.role || 'Monitor'}</div>
                  </div>
                </button>
                {onLogout && (
                  <IconButton label="Logout" onClick={onLogout}>
                    <LogOut size={18} />
                  </IconButton>
                )}
              </div>
            </div>
          </header>

          <div className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-1">
              <h1 className="text-3xl font-black tracking-tight text-slate-950">System Monitoring</h1>
              <p className="text-sm font-semibold text-slate-500">
                Health, security, email, HR sync, project sync, and clock data quality.
              </p>
            </div>

            {error && <div className="mb-4"><Alert tone="error" icon={AlertTriangle}>{error}</Alert></div>}

            <OverviewMetrics data={data} />

            <div className="mt-6">
              {loading && !data ? (
                <Card className="p-12 text-center">
                  <Spinner /><div className="mt-3 text-sm font-bold text-slate-500">Loading system status…</div>
                </Card>
              ) : isWelcomeTab ? (
                <WelcomeEmailSection welcome={welcome} loading={welcomeLoading} error={welcomeError} onRefresh={loadWelcome} onOpenDetail={openDetail} />
              ) : isErrorTab ? (
                <ErrorsSection errors={errors} loading={errorsLoading} error={errorsErr} onRefresh={loadErrors} onOpenError={openError} onToggleResolve={toggleResolve} />
              ) : isStorageTab ? (
                <StorageSection storage={storage} loading={storageLoading} error={storageErr} onRefresh={loadStorage} />
              ) : (
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  {(activeNav === 'overview' || activeNav === 'security') && <LoginTrendPanel />}
                  {(activeNav === 'overview' || activeNav === 'data')     && <ClockTrendPanel />}
                  {(activeNav === 'overview' || activeNav === 'health')   && <HealthPanel data={data} />}
                  {(activeNav === 'overview' || activeNav === 'data')     && <DataQualityPanel data={data} />}
                  {(activeNav === 'overview' || activeNav === 'security') && <SecurityPanel data={data} canViewAudit={canViewAudit} />}
                  {(activeNav === 'overview' || activeNav === 'email')    && <EmailPanel data={data} />}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <WelcomeDetailDrawer
        open={!!detailCode}
        code={detailCode}
        detail={detail}
        loading={detailLoading}
        error={detailError}
        onClose={closeDetail}
      />

      <ErrorDetailDrawer
        open={errorId != null}
        detail={errorDetail}
        loading={errorDetailLoading}
        error={errorDetailErr}
        onClose={closeError}
        onToggleResolve={toggleResolve}
      />
    </div>
  )
}

/* ---------- Local sidebar ---------- */
function SMSidebar({ nav = SM_NAV, activeNav, setActiveNav, mobileOpen, onMobileClose }) {
  return (
    <aside className={`${mobileOpen ? 'fixed inset-y-0 left-0 z-40 flex' : 'hidden'} w-72 flex-col border-r border-slate-200 bg-white/95 p-5 shadow-lg backdrop-blur lg:sticky lg:top-0 lg:flex lg:h-screen lg:shadow-none lg:overflow-y-auto`}>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: ACE_GRADIENT }}>
          <Command size={24} />
        </div>
        <div className="min-w-0">
          <div className="text-base font-black text-slate-950">ACE System Monitor</div>
          <div className="text-xs font-bold text-slate-400">Operations Health</div>
        </div>
        <button
          onClick={onMobileClose}
          className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 lg:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="mt-9 space-y-1">
        {nav.map(item => {
          const active = item.id === activeNav
          const Icon = item.icon || Activity
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveNav(item.id)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-sm font-black transition ${
                active ? 'bg-blue-50 text-[#2447d8] shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-sm font-black text-slate-900">
          <Sparkles size={18} style={{ color: ACE_BLUE }} />
          Monitor Workspace
        </div>
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
          Backend health · Security · Email queue · Welcome activation tracking.
        </p>
      </div>
    </aside>
  )
}

function IconButton({ children, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-[#2447d8] hover:shadow-md active:translate-y-0"
    >
      {children}
    </button>
  )
}

/* ---------- Overview metric strip ---------- */
function OverviewMetrics({ data }) {
  const cards = useMemo(() => {
    const m = data?.metrics; const h = data?.health
    if (!m || !h) return []
    return [
      { label: 'Backend API', value: h.backend === 'ok' ? 'OK' : 'Error',
        accent: h.backend === 'ok' ? '#16a34a' : '#dc2626', hint: 'FastAPI health' },
      { label: 'Database', value: h.database === 'ok' ? 'OK' : 'Error',
        accent: h.database === 'ok' ? '#16a34a' : '#dc2626', hint: 'Postgres connection' },
      { label: 'SMTP', value: h.email_configured ? 'Configured' : 'Missing',
        accent: h.email_configured ? '#16a34a' : '#d97706', hint: h.smtp?.host || 'No SMTP host' },
      { label: 'Employees', value: m.employees.total, accent: ACE_BLUE,
        hint: `${m.employees.without_login} without login`,
        hintTone: m.employees.without_login ? 'down' : 'muted' },
      { label: 'Clock Today', value: m.clock.today,
        accent: m.clock.stuck ? '#dc2626' : '#16a34a',
        hint: `${m.clock.active} active, ${m.clock.stuck} stuck`,
        hintTone: m.clock.stuck ? 'down' : 'muted' },
      { label: 'Email Queue', value: m.email.failed,
        accent: m.email.failed ? '#dc2626' : m.email.pending ? '#d97706' : '#16a34a',
        hint: `${m.email.pending} pending, ${m.email.sent} sent`,
        hintTone: m.email.failed ? 'down' : 'muted' },
      { label: 'Security', value: m.auth_users.failed_login_today,
        accent: (m.auth_users.locked || m.auth_users.rate_limited_today) ? '#dc2626'
              : m.auth_users.failed_login_today ? '#d97706' : '#16a34a',
        hint: `${m.auth_users.successful_login_today || 0} ok, ${m.auth_users.locked} locked` },
      { label: 'Risk Score', value: data?.audit?.system_risk_score ?? 0,
        accent: (data?.audit?.system_risk_score || 0) > 60 ? '#dc2626'
              : (data?.audit?.system_risk_score || 0) > 25 ? '#d97706' : '#16a34a',
        hint: 'Audit + access risk' },
    ]
  }, [data])

  if (!cards.length) return null
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-8">
      {cards.map(c => (
        <StatCard key={c.label} label={c.label} value={c.value} accent={c.accent}
                  hint={c.hint} hintTone={c.hintTone || 'muted'} />
      ))}
    </div>
  )
}

/* ---------- Panels ---------- */
function LoginTrendPanel() {
  const [trend, setTrend] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true); setErr('')
    apiFetch('/api/system/monitor/login-trend?days=14')
      .then(async r => {
        const j = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(j.detail || 'Cannot load login trend')
        if (!cancelled) setTrend(j)
      })
      .catch(e => { if (!cancelled) setErr(e?.message || 'Cannot load login trend') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const t = trend?.totals || {}
  const series = trend?.series || []
  const labels = series.map(s => s.label)
  const usersData = series.map(s => s.users)
  const loginsData = series.map(s => s.logins)
  // Show ~7 x-axis ticks max so labels don't crowd.
  const tickEvery = Math.max(1, Math.ceil(labels.length / 7))

  return (
    <PanelCard icon={LogIn} title="Daily Logins — Users & Sessions (14d)" className="xl:col-span-2">
      {loading ? (
        <div className="py-10 text-center"><Spinner /></div>
      ) : err ? (
        <Alert tone="error" icon={AlertTriangle}>{err}</Alert>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MiniStat label="Users Today" value={t.users_today ?? 0} tone={t.users_today ? 'green' : 'amber'} />
            <MiniStat label="Logins Today" value={t.logins_today ?? 0} />
            <MiniStat label="Peak Users (14d)" value={t.peak_users ?? 0} />
            <MiniStat label="Avg Users / Day" value={t.avg_users ?? 0} />
          </div>

          <div className="mb-2 flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: ACE_BLUE }} /> Distinct Users</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: '#16a34a' }} /> Total Logins</span>
          </div>

          <LineChart
            height={200}
            labels={labels}
            series={[
              { name: 'Distinct Users', data: usersData, color: ACE_BLUE, fill: true },
              { name: 'Total Logins', data: loginsData, color: '#16a34a' },
            ]}
          />

          <div className="mt-1 flex justify-between">
            {labels.map((lb, i) => (
              <span key={i} className="text-[10px] font-semibold text-slate-400">
                {i % tickEvery === 0 ? lb : ''}
              </span>
            ))}
          </div>

          <div className="mt-2 text-[11px] font-semibold text-slate-400">
            Blue = unique people who logged in · Green = total login sessions (one person can log in many times)
          </div>
        </>
      )}
    </PanelCard>
  )
}

function ClockTrendPanel() {
  const [trend, setTrend] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true); setErr('')
    apiFetch('/api/system/monitor/clock-trend?days=30')
      .then(async r => {
        const j = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(j.detail || 'Cannot load clock trend')
        if (!cancelled) setTrend(j)
      })
      .catch(e => { if (!cancelled) setErr(e?.message || 'Cannot load clock trend') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const t = trend?.totals || {}
  const series = trend?.series || []
  const labels = series.map(s => s.label)
  const workersData = series.map(s => s.workers)
  const sessionsData = series.map(s => s.sessions)
  const tickEvery = Math.max(1, Math.ceil(labels.length / 8))

  return (
    <PanelCard icon={ClockIcon} title="Daily Active — Workers & Sessions (30d)" className="xl:col-span-2">
      {loading ? (
        <div className="py-10 text-center"><Spinner /></div>
      ) : err ? (
        <Alert tone="error" icon={AlertTriangle}>{err}</Alert>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MiniStat label="Active Today" value={t.workers_today ?? 0} tone={t.workers_today ? 'green' : 'amber'} />
            <MiniStat label="Sessions Today" value={t.sessions_today ?? 0} />
            <MiniStat label="Peak Active (30d)" value={t.peak_workers ?? 0} />
            <MiniStat label="Avg Active / Day" value={t.avg_workers ?? 0} />
          </div>

          <div className="mb-2 flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: ACE_BLUE }} /> Active Workers</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: '#16a34a' }} /> Clock Sessions</span>
          </div>

          <LineChart
            height={200}
            labels={labels}
            series={[
              { name: 'Active Workers', data: workersData, color: ACE_BLUE, fill: true },
              { name: 'Clock Sessions', data: sessionsData, color: '#16a34a' },
            ]}
          />

          <div className="mt-1 flex justify-between">
            {labels.map((lb, i) => (
              <span key={i} className="text-[10px] font-semibold text-slate-400">
                {i % tickEvery === 0 ? lb : ''}
              </span>
            ))}
          </div>

          <div className="mt-2 text-[11px] font-semibold text-slate-400">
            Blue = distinct employees who clocked in · Green = total clock sessions that day
          </div>
        </>
      )}
    </PanelCard>
  )
}

function HealthPanel({ data }) {
  const h = data?.health || {}
  return (
    <PanelCard icon={Activity} title="Health Status">
      <KeyValueList rows={[
        ['Backend API',     <StatusPill ok={h.backend === 'ok'} text={h.backend || '-'} />],
        ['Database',        <StatusPill ok={h.database === 'ok'} text={h.database || '-'} />],
        ['SMTP Configured', <Badge tone={h.email_configured ? 'green' : 'amber'} dot>{h.email_configured ? 'Yes' : 'No'}</Badge>],
        ['SMTP Host',       h.smtp?.host || '-'],
        ['SMTP Missing',    h.smtp?.missing?.length ? <Badge tone="red" dot>{h.smtp.missing.join(', ')}</Badge> : '-'],
      ]} />
    </PanelCard>
  )
}

function DataQualityPanel({ data }) {
  const m = data?.metrics || {}
  return (
    <PanelCard icon={Database} title="Data Quality">
      <KeyValueList rows={[
        ['Employees',                  `${m.employees?.active || 0} active / ${m.employees?.total || 0} total`],
        ['Employees Without Login',    m.employees?.without_login || 0],
        ['Auth Users',                 `${m.auth_users?.active || 0} active / ${m.auth_users?.total || 0} total`],
        ['Projects',                   m.projects?.total || 0],
        ['Assignments',                m.projects?.assignments || 0],
        ['Sites',                      m.projects?.sites || 0],
        ['PO Records',                 m.projects?.pos || 0],
        ['Clock Missing Photo Today',  m.clock?.missing_photo_today || 0],
      ]} />
    </PanelCard>
  )
}

function SecurityPanel({ data, canViewAudit }) {
  const failures = data?.issues?.auth_failures || []
  const attempts = data?.issues?.login_attempts || []
  const revoked  = data?.issues?.token_revoked_users || []
  const audit    = canViewAudit ? data?.audit : null

  return (
    <PanelCard icon={Shield} title="Security Watch" className="xl:col-span-2">
      <KeyValueList rows={[
        ['Successful Login Today', data?.metrics?.auth_users?.successful_login_today || 0],
        ['Failed Login Today',     data?.metrics?.auth_users?.failed_login_today || 0],
        ['Rate Limited Today',     data?.metrics?.auth_users?.rate_limited_today || 0],
        ['Locked Accounts',        data?.metrics?.auth_users?.locked || 0],
        ['Auth Users', `${data?.metrics?.auth_users?.active || 0} active / ${data?.metrics?.auth_users?.total || 0} total`],
      ]} />

      <SubTitle>Recent Login Attempts</SubTitle>
      <DsTable
        head={['Result', 'Identifier', 'Employee', 'IP', 'Reason', 'Time']}
        rows={attempts.map(r => [
          r.success ? <Badge tone="green" dot>Success</Badge> : <Badge tone="red" dot>Failed</Badge>,
          r.identifier || '-', r.employee_code || '-', r.ip_address || '-',
          r.failure_reason || '-', r.created_at ? formatDateTime24(r.created_at, true) : '-',
        ])}
        empty={{ icon: CheckCircle2, title: 'No login attempts recorded' }}
      />

      <SubTitle>Recent Failures</SubTitle>
      <DsTable
        head={['Identifier', 'Employee', 'IP', 'Reason', 'User Agent', 'Time']}
        rows={failures.map(r => [
          r.identifier || '-', r.employee_code || '-', r.ip_address || '-',
          r.detail || '-', compactAgent(r.user_agent),
          r.created_at ? formatDateTime24(r.created_at, true) : '-',
        ])}
        empty={{ icon: CheckCircle2, title: 'No recent login failures' }}
      />

      <SubTitle>Token Version / Force Logout</SubTitle>
      <DsTable
        head={['Employee', 'Name', 'Role', 'Token Ver.', 'Active', 'Locked Until']}
        rows={revoked.map(r => [
          r.employee_code || '-', r.name || '-', r.role || '-', r.token_version || 1,
          r.is_active ? <Badge tone="green" dot>Yes</Badge> : <Badge tone="slate">No</Badge>,
          r.locked_until ? formatDateTime24(r.locked_until, true) : '-',
        ])}
        empty={{ icon: CheckCircle2, title: 'No token-version changes' }}
      />

      {audit && <AuditSummary audit={audit} />}
    </PanelCard>
  )
}

function AuditSummary({ audit }) {
  const logs = audit?.recent_critical_logs || []
  const riskTone = (audit.system_risk_score || 0) > 60 ? 'red'
                 : (audit.system_risk_score || 0) > 25 ? 'amber' : 'green'
  return (
    <div className="mt-6 border-t border-slate-100 pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-black text-slate-900">Audit Summary</div>
          <div className="mt-1 text-xs font-semibold text-slate-500">High-level audit signals and recent critical events only.</div>
        </div>
        <a href="/admin/audit-logs" className="inline-flex items-center justify-center rounded-2xl px-4 py-2 text-xs font-black text-white no-underline shadow-sm transition hover:opacity-90" style={{ background: ACE_BLUE }}>
          View All Audit Logs
        </a>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <MiniStat label="Audit Events Today"  value={audit.today_events || 0} />
        <MiniStat label="System Risk Score"   value={audit.system_risk_score || 0} tone={riskTone} />
        <MiniStat label="Critical Today"      value={audit.critical_events_today || 0} tone={audit.critical_events_today ? 'red' : 'green'} />
        <MiniStat label="Employee Changes"    value={audit.employee_changes_today || 0} />
        <MiniStat label="Access Changes"      value={audit.access_changes_today || 0} />
        <MiniStat label="Role Changes"        value={audit.role_changes_today || 0} tone={audit.role_changes_today ? 'amber' : 'green'} />
        <MiniStat label="Failed Sensitive"    value={audit.failed_sensitive_actions_today || 0} tone={audit.failed_sensitive_actions_today ? 'red' : 'green'} />
      </div>
      <SubTitle>Recent Critical Audit Logs</SubTitle>
      <DsTable
        head={['Time', 'Severity', 'Action', 'Actor', 'Target', 'Source', 'IP']}
        rows={logs.map(r => [
          r.created_at ? formatDateTime24(r.created_at, true) : '-',
          <Badge tone={r.severity === 'critical' ? 'red' : r.severity === 'warning' ? 'amber' : 'slate'} dot>{r.severity || '-'}</Badge>,
          r.action_label || r.action || '-',
          r.actor_name || r.actor_email || '-',
          r.target_label || r.target_type || '-',
          r.source || '-', r.ip_address || '-',
        ])}
        empty={{ icon: CheckCircle2, title: 'No recent critical audit logs' }}
      />
    </div>
  )
}

function EmailPanel({ data }) {
  const failed = data?.issues?.email_failed || []
  return (
    <PanelCard icon={Mail} title="Email Outbox">
      <KeyValueList rows={[
        ['Pending', data?.metrics?.email?.pending || 0],
        ['Failed',  data?.metrics?.email?.failed || 0],
        ['Sent',    data?.metrics?.email?.sent || 0],
      ]} />
      <SubTitle>Recent Failures</SubTitle>
      <DsTable
        head={['Recipient', 'Subject', 'Error', 'Time']}
        rows={failed.map(r => [r.recipient, r.subject, r.error_code || '-', r.created_at ? formatDateTime24(r.created_at, true) : '-'])}
        empty={{ icon: CheckCircle2, title: 'No failed email' }}
      />
    </PanelCard>
  )
}

/* ---------- Welcome Email ---------- */
function WelcomeEmailSection({ welcome, loading, error, onRefresh, onOpenDetail }) {
  if (loading && !welcome) {
    return (
      <Card className="p-12 text-center">
        <Spinner /><div className="mt-3 text-sm font-bold text-slate-500">Loading welcome email monitor…</div>
      </Card>
    )
  }
  if (error) {
    return (
      <Alert tone="error" icon={AlertTriangle}>
        {error}
        <Button variant="ghost" className="ml-3" onClick={onRefresh}>Retry</Button>
      </Alert>
    )
  }
  if (!welcome) return null

  const s = welcome.summary || {}
  const groups = welcome.failed_by_group || {}
  const failed = welcome.failed || []
  const pending = welcome.pending_activation || []
  const noWelcome = welcome.no_welcome_sent || []

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Total Welcome" value={s.total || 0} accent={ACE_BLUE}
                  hint={`${s.sent || 0} sent, ${s.failed || 0} failed`} />
        <StatCard label="Sent"   value={s.sent || 0}   accent="#16a34a" hint="Delivered to SMTP" hintTone="up" />
        <StatCard label="Failed" value={s.failed || 0} accent={s.failed ? '#dc2626' : '#94a3b8'}
                  hint="Rejected or invalid" hintTone={s.failed ? 'down' : 'muted'} />
        <StatCard label="Pending Activation" value={pending.length} accent={pending.length ? '#d97706' : '#94a3b8'}
                  hint="Sent but never logged in" hintTone={pending.length ? 'down' : 'muted'} />
        <StatCard label="Active w/o Welcome" value={noWelcome.length} accent={noWelcome.length ? '#d97706' : '#94a3b8'}
                  hint="No outbox record" hintTone={noWelcome.length ? 'down' : 'muted'} />
      </div>

      <PanelCard icon={FileWarning} title={`Failed Welcome Emails (${failed.length})`}>
        {Object.keys(groups).length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {Object.entries(groups).map(([name, count]) => (
              <Badge key={name} tone="red" dot>{name}: {count}</Badge>
            ))}
          </div>
        )}
        <DsTable
          head={['Status', 'Reason Group', 'Recipient', 'Employee', 'Name', 'Emp. Status', 'Error', 'Att.', 'Created', '']}
          rows={failed.map(r => [
            <Badge tone={r.status === 'FAILED' ? 'red' : 'amber'} dot>{r.status}</Badge>,
            <Badge tone={reasonTone(r.reason_group)}>{r.reason_group}</Badge>,
            r.recipient || '-', r.employee_code || '-', r.employee_name || '-',
            r.employee_status ? <Badge tone={r.employee_status === 'TERMINATED' ? 'slate' : 'blue'}>{r.employee_status}</Badge> : '-',
            r.error_code ? <span title={r.error_message}>{r.error_code}</span> : (r.error_message || '-'),
            r.attempts ?? 0,
            r.created_at ? formatDateTime24(r.created_at, true) : '-',
            <RowDetailButton code={r.employee_code} onClick={onOpenDetail} />,
          ])}
          empty={{ icon: CheckCircle2, title: 'No failed welcome emails' }}
        />
      </PanelCard>

      <PanelCard icon={UserX} title={`Pending Activation — Sent but Never Logged In (${pending.length})`}>
        <DsTable
          head={['Employee', 'Name', 'Email', 'Role', 'Welcome Sent', 'Days', 'Must Change Pwd', '']}
          rows={pending.map(r => [
            r.employee_code || '-', r.name || '-', r.email || '-', r.role || '-',
            r.welcome_sent_at ? formatDateTime24(r.welcome_sent_at, true) : '-',
            <Badge tone={r.days_since_sent >= 14 ? 'red' : r.days_since_sent >= 7 ? 'amber' : 'slate'}>
              {r.days_since_sent ?? '-'}
            </Badge>,
            r.must_change_password ? <Badge tone="amber" dot>Yes</Badge> : <Badge tone="slate">No</Badge>,
            <RowDetailButton code={r.employee_code} onClick={onOpenDetail} />,
          ])}
          empty={{ icon: CheckCircle2, title: 'All users have logged in', desc: 'No pending activations.' }}
        />
      </PanelCard>

      <PanelCard icon={Users} title={`Active Users Without Welcome Email (${noWelcome.length})`}>
        <DsTable
          head={['Employee', 'Name', 'Email', 'Role', 'Emp. Status', 'Last Login', 'Account Created', '']}
          rows={noWelcome.map(r => [
            r.employee_code || '-', r.name || '-', r.email || '-', r.role || '-',
            r.employee_status ? <Badge tone={r.employee_status === 'TERMINATED' ? 'slate' : 'blue'}>{r.employee_status}</Badge> : '-',
            r.last_login_at ? formatDateTime24(r.last_login_at, true) : <Badge tone="slate">Never</Badge>,
            r.created_at ? formatDateTime24(r.created_at, true) : '-',
            <RowDetailButton code={r.employee_code} onClick={onOpenDetail} />,
          ])}
          empty={{ icon: CheckCircle2, title: 'All active users have a welcome email' }}
        />
      </PanelCard>

      <div className="text-xs font-bold text-slate-500">
        Generated: {welcome.generated_at ? formatDateTime24(welcome.generated_at, true) : '-'}
      </div>
    </div>
  )
}

/* ---------- Storage ---------- */
function StorageSection({ storage, loading, error, onRefresh }) {
  if (loading && !storage) {
    return (
      <Card className="p-12 text-center">
        <Spinner /><div className="mt-3 text-sm font-bold text-slate-500">Loading storage monitor…</div>
      </Card>
    )
  }
  if (error) {
    return (
      <Alert tone="error" icon={AlertTriangle}>
        {error}
        <Button variant="ghost" className="ml-3" onClick={onRefresh}>Retry</Button>
      </Alert>
    )
  }
  if (!storage) return null

  const disks = storage.disks || []
  const db = storage.database || {}
  const photos = storage.photos || {}
  const app = storage.app_footprint || {}
  const tables = storage.tables || []
  const maxTable = Math.max(1, ...tables.map(t => t.size_bytes || 0))

  return (
    <div className="flex flex-col gap-6">
      {/* ===== App-only storage (ของแอปเราล้วน) ===== */}
      <div>
        <SectionHeader
          icon={Database}
          title="App Storage"
          subtitle="ของแอปเราล้วน — เฉพาะข้อมูลที่ระบบนี้สร้าง"
          badge={<Badge tone="blue" dot>This app only</Badge>}
        />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="App Footprint" value={app.size_pretty || '-'} accent={ACE_BLUE} hint="DB + photos combined" />
          <StatCard label="Database Size" value={db.size_pretty || '-'} accent="#2447d8" hint="PostgreSQL logical size" />
          <StatCard label="Clock Photos" value={photos.size_pretty || '-'} accent="#16a34a" hint={`${photos.count ?? 0} files`} />
          <StatCard label="Largest Table" value={tables[0]?.size_pretty || '-'} accent="#d97706" hint={tables[0]?.name || '-'} />
        </div>

        <div className="mt-4">
          <PanelCard icon={Database} title="Largest Database Tables">
            {tables.length === 0 ? (
              <EmptyChip text="No table statistics available." />
            ) : (
              <div className="flex flex-col gap-2.5">
                {tables.map(t => (
                  <div key={t.name} className="flex items-center gap-3">
                    <div className="w-44 shrink-0 truncate font-mono text-xs font-bold text-slate-700" title={t.name}>{t.name}</div>
                    <div className="flex-1">
                      <Progress value={(t.size_bytes / maxTable) * 100} color={ACE_BLUE} />
                    </div>
                    <div className="w-20 shrink-0 text-right text-xs font-black text-slate-900">{t.size_pretty}</div>
                    <div className="w-24 shrink-0 text-right text-[11px] font-semibold text-slate-400">{t.rows.toLocaleString()} rows</div>
                  </div>
                ))}
              </div>
            )}
          </PanelCard>
        </div>
      </div>

      {/* ===== Whole-server disk (shared) ===== */}
      <div>
        <SectionHeader
          icon={HardDrive}
          title="Server Disk"
          subtitle="พื้นที่ดิสก์ทั้งเครื่อง — แชร์กับทุก service/process บน server (ไม่ใช่เฉพาะแอปนี้)"
          badge={<Badge tone="amber" dot>Shared — whole machine</Badge>}
        />
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {disks.map(d => <DiskCard key={d.path} disk={d} />)}
        </div>
        <div className="mt-2 text-[11px] font-semibold text-slate-400">
          ตัวเลข % คือพื้นที่ของดิสก์ทั้งก้อนบน server — รวมของ service อื่น/OS ด้วย ไม่ได้แปลว่าแอปนี้ใช้ไปเท่านั้น
        </div>
      </div>

      {/* ===== Database health ===== */}
      <div>
        <SectionHeader
          icon={Activity}
          title="Database Health"
          subtitle="connections · table bloat · locks · slow queries"
          badge={<Badge tone="blue" dot>PostgreSQL</Badge>}
        />
        <DbHealthPanel />
      </div>

      <div className="text-[11px] font-semibold text-slate-400">
        Generated: {storage.generated_at ? formatDateTime24(storage.generated_at, true) : '-'}
      </div>
    </div>
  )
}

function DbHealthPanel() {
  const [h, setH] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true); setErr('')
    apiFetch('/api/system/monitor/db-health')
      .then(async r => {
        const j = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(j.detail || 'Cannot load DB health')
        if (!cancelled) setH(j)
      })
      .catch(e => { if (!cancelled) setErr(e?.message || 'Cannot load DB health') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) return <Card className="p-10 text-center"><Spinner /></Card>
  if (err) return <Alert tone="error" icon={AlertTriangle}>{err}</Alert>
  if (!h) return null

  const c = h.connections || {}
  const locks = h.locks || {}
  const bloat = h.bloat || []
  const slow = h.slow_queries

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="DB Connections" value={`${c.total ?? 0} / ${c.max ?? 0}`} accent={c.percent >= 80 ? '#dc2626' : ACE_BLUE} hint={`${c.percent ?? 0}% of max`} />
        <StatCard label="Idle in Transaction" value={c.idle_in_transaction ?? 0} accent={c.idle_in_transaction ? '#dc2626' : '#16a34a'} hint="0 = healthy" />
        <StatCard label="Locks Waiting" value={locks.waiting ?? 0} accent={locks.waiting ? '#dc2626' : '#16a34a'} hint={`${locks.total ?? 0} total locks`} />
        <StatCard label="Slow-Query Tracking" value={h.slow_query_tracking ? 'On' : 'Off'} accent={h.slow_query_tracking ? '#16a34a' : '#d97706'} hint="pg_stat_statements" />
      </div>

      <PanelCard icon={Database} title="Table Bloat (dead tuples)">
        {bloat.length === 0 ? (
          <EmptyChip text="No dead tuples — tables are clean." />
        ) : (
          <DsTable
            head={['Table', 'Dead %', 'Dead / Live', 'Size', 'Last Autovacuum']}
            rows={bloat.map(b => [
              <span className="font-mono text-xs font-bold">{b.name}</span>,
              <Badge tone={b.dead_pct >= 50 ? 'red' : b.dead_pct >= 20 ? 'amber' : 'slate'}>{b.dead_pct}%</Badge>,
              `${b.dead.toLocaleString()} / ${b.live.toLocaleString()}`,
              b.size_pretty,
              b.last_autovacuum ? formatDateTime24(b.last_autovacuum, true) : <Badge tone="amber">never</Badge>,
            ])}
            empty={{ icon: CheckCircle2, title: 'No bloat' }}
          />
        )}
      </PanelCard>

      <PanelCard icon={ClockIcon} title="Slowest Queries (by mean time)">
        {slow === null ? (
          <EmptyChip text="pg_stat_statements not installed — slow-query tracking unavailable." />
        ) : slow.length === 0 ? (
          <EmptyChip text="No query statistics yet." />
        ) : (
          <DsTable
            head={['Mean (ms)', 'Calls', 'Total (ms)', 'Query']}
            rows={slow.map(q => [
              <Badge tone={q.mean_ms >= 100 ? 'red' : q.mean_ms >= 20 ? 'amber' : 'green'}>{q.mean_ms}</Badge>,
              q.calls.toLocaleString(),
              q.total_ms.toLocaleString(),
              <span className="font-mono text-[11px] text-slate-600">{q.query}</span>,
            ])}
            empty={{ icon: CheckCircle2, title: 'No slow queries' }}
          />
        )}
      </PanelCard>
    </div>
  )
}

function SectionHeader({ icon: Icon, title, subtitle, badge }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-3">
      {Icon && <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900 text-white"><Icon size={18} /></span>}
      <div className="min-w-0">
        <div className="text-lg font-black tracking-tight text-slate-950">{title}</div>
        {subtitle && <div className="text-xs font-semibold text-slate-500">{subtitle}</div>}
      </div>
      {badge && <div className="ml-auto">{badge}</div>}
    </div>
  )
}

function DiskCard({ disk }) {
  const pct = disk.percent_used ?? 0
  const tone = pct >= 90 ? '#dc2626' : pct >= 75 ? '#d97706' : '#16a34a'
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-[#2447d8]"><HardDrive size={18} /></span>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-black text-slate-900">{disk.label}</span>
            <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-700">shared</span>
          </div>
          <div className="font-mono text-[11px] font-semibold text-slate-400">{disk.path}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-2xl font-black" style={{ color: tone }}>{pct}%</div>
          <div className="text-[11px] font-bold text-slate-400">used (whole disk)</div>
        </div>
      </div>
      <Progress value={pct} color={tone} />
      <div className="mt-3 flex justify-between text-xs font-bold">
        <span className="text-slate-500">Used <b className="text-slate-900">{disk.used_pretty}</b></span>
        <span className="text-slate-500">Free <b className="text-green-700">{disk.free_pretty}</b></span>
        <span className="text-slate-500">Total <b className="text-slate-900">{disk.total_pretty}</b></span>
      </div>
    </Card>
  )
}

/* ---------- Errors ---------- */
function ErrorsSection({ errors, loading, error, onRefresh, onOpenError, onToggleResolve }) {
  if (loading && !errors) {
    return (
      <Card className="p-12 text-center">
        <Spinner /><div className="mt-3 text-sm font-bold text-slate-500">Loading error monitor…</div>
      </Card>
    )
  }
  if (error) {
    return (
      <Alert tone="error" icon={AlertTriangle}>
        {error}
        <Button variant="ghost" className="ml-3" onClick={onRefresh}>Retry</Button>
      </Alert>
    )
  }
  if (!errors) return null

  const s = errors.summary || {}
  const byType = errors.by_type || []
  const byEndpoint = errors.by_endpoint || []
  const recent = errors.recent || []

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Errors Today" value={s.today || 0} accent={s.today ? '#dc2626' : '#16a34a'}
                  hint="Unhandled 500s captured today" hintTone={s.today ? 'down' : 'muted'} />
        <StatCard label="Last 7 Days" value={s.last_7d || 0} accent={s.last_7d ? '#d97706' : '#16a34a'} hint="Rolling 7-day window" />
        <StatCard label="Unresolved" value={s.unresolved || 0} accent={s.unresolved ? '#dc2626' : '#16a34a'}
                  hint="Not yet marked resolved" hintTone={s.unresolved ? 'down' : 'muted'} />
        <StatCard label="Total Captured" value={s.total || 0} accent={ACE_BLUE} hint="All-time" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <PanelCard icon={Bug} title="Top Error Types (7d)">
          {byType.length === 0
            ? <EmptyChip text="No errors in the last 7 days." />
            : (
              <div className="flex flex-col gap-2">
                {byType.map(t => (
                  <div key={t.error_type} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2">
                    <span className="truncate text-sm font-bold text-slate-700">{t.error_type}</span>
                    <Badge tone="red">{t.count}</Badge>
                  </div>
                ))}
              </div>
            )}
        </PanelCard>

        <PanelCard icon={Activity} title="Top Failing Endpoints (7d)">
          {byEndpoint.length === 0
            ? <EmptyChip text="No failing endpoints in the last 7 days." />
            : (
              <div className="flex flex-col gap-2">
                {byEndpoint.map(e => (
                  <div key={e.path} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2">
                    <span className="truncate font-mono text-xs font-bold text-slate-600" title={e.path}>{e.path}</span>
                    <Badge tone="amber">{e.count}</Badge>
                  </div>
                ))}
              </div>
            )}
        </PanelCard>
      </div>

      <PanelCard icon={AlertTriangle} title={`Recent Errors (${recent.length})`}>
        <DsTable
          head={['Time', 'Status', 'Type', 'Endpoint', 'User', 'IP', 'State', '']}
          rows={recent.map(r => [
            r.created_at ? formatDateTime24(r.created_at, true) : '-',
            <Badge tone="red" dot>{r.status_code}</Badge>,
            <span title={r.error_message}>{r.error_type}</span>,
            <span className="font-mono text-[11px]">{r.method} {r.path}</span>,
            r.employee_code || '-',
            r.ip_address || '-',
            r.resolved ? <Badge tone="green" dot>Resolved</Badge> : <Badge tone="amber" dot>Open</Badge>,
            <RowDetailButton code={r.id} onClick={onOpenError} />,
          ])}
          empty={{ icon: CheckCircle2, title: 'No errors captured', desc: 'The system has not logged any unhandled exceptions.' }}
        />
      </PanelCard>
    </div>
  )
}

function ErrorDetailDrawer({ open, detail, loading, error, onClose, onToggleResolve }) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={detail ? `${detail.error_type} · #${detail.id}` : 'Error Detail'}
      footer={
        <>
          {detail && (
            <Button variant={detail.resolved ? 'ghost' : 'primary'} className="flex-1" onClick={() => onToggleResolve(detail.id)}>
              {detail.resolved ? 'Mark as Open' : 'Mark Resolved'}
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </>
      }
    >
      {loading && !detail && (
        <div className="py-10 text-center"><Spinner /><div className="mt-3 text-sm font-bold text-slate-500">Loading…</div></div>
      )}
      {error && <Alert tone="error" icon={AlertTriangle}>{error}</Alert>}
      {detail && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="red" dot>{detail.status_code}</Badge>
              <span className="text-sm font-black text-red-800">{detail.error_type}</span>
              {detail.resolved && <Badge tone="green" dot>Resolved</Badge>}
            </div>
            <div className="mt-2 text-xs font-bold leading-relaxed text-red-700">{detail.error_message}</div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <DetailChip label="Method" value={detail.method} />
            <DetailChip label="When" value={detail.created_at ? formatDateTime24(detail.created_at, true) : '-'} />
            <DetailChip label="User" value={detail.employee_code || '-'} />
            <DetailChip label="IP" value={detail.ip_address || '-'} />
          </div>

          <div>
            <div className="mb-1 text-xs font-black uppercase tracking-wider text-slate-500">Endpoint</div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs font-bold text-slate-700 break-all">
              {detail.method} {detail.path}
            </div>
          </div>

          {detail.user_agent && (
            <div>
              <div className="mb-1 text-xs font-black uppercase tracking-wider text-slate-500">User Agent</div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-600 break-all">
                {detail.user_agent}
              </div>
            </div>
          )}

          <div>
            <div className="mb-1 text-xs font-black uppercase tracking-wider text-slate-500">Traceback</div>
            <pre className="max-h-[420px] overflow-auto rounded-xl border border-slate-800 bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-100">
              {detail.traceback || 'No traceback recorded.'}
            </pre>
          </div>
        </div>
      )}
    </Drawer>
  )
}

/* ---------- Shared bits ---------- */
function PanelCard({ icon: Icon, title, className = '', children }) {
  return (
    <Card className={`p-5 ${className}`}>
      <div className="mb-4 flex items-center gap-2">
        {Icon && <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-[#2447d8]"><Icon size={18} /></span>}
        <div className="text-base font-black text-slate-900">{title}</div>
      </div>
      {children}
    </Card>
  )
}

function KeyValueList({ rows }) {
  return (
    <div>
      {rows.map(([k, v], i) => (
        <div key={i} className="flex items-center justify-between gap-4 border-b border-slate-100 py-2.5 text-sm last:border-b-0">
          <span className="text-slate-500">{k}</span>
          <span className="text-right font-bold text-slate-900">{v}</span>
        </div>
      ))}
    </div>
  )
}

function SubTitle({ children }) {
  return <div className="mb-2 mt-5 text-sm font-black text-slate-900">{children}</div>
}

function DsTable({ head, rows, empty }) {
  if (!rows.length) {
    const E = empty || {}
    return (
      <div className="mt-2">
        <EmptyState icon={E.icon} title={E.title || 'No records'} desc={E.desc} />
      </div>
    )
  }
  return <Table head={head} rows={rows} />
}

function StatusPill({ ok, text }) {
  return <Badge tone={ok ? 'green' : 'red'} dot>{text}</Badge>
}

function MiniStat({ label, value, tone }) {
  const color = tone === 'red' ? 'text-red-700'
              : tone === 'amber' ? 'text-amber-700'
              : tone === 'green' ? 'text-green-700' : 'text-slate-900'
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <div className="text-[.68rem] font-black uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-1 text-xl font-black ${color}`}>{value}</div>
    </div>
  )
}

function reasonTone(group) {
  const g = (group || '').toLowerCase()
  if (g.includes('terminated')) return 'slate'
  if (g.includes('invalid')) return 'red'
  if (g.includes('no matching')) return 'amber'
  return 'red'
}

function compactAgent(value) {
  if (!value) return '-'
  return value.length > 42 ? `${value.slice(0, 42)}…` : value
}

/* ---------- Per-employee detail drawer ---------- */
function RowDetailButton({ code, onClick }) {
  if (!code) return <span className="text-xs font-bold text-slate-400">—</span>
  return (
    <button
      type="button"
      onClick={() => onClick?.(code)}
      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-black text-[#2447d8] shadow-sm transition hover:bg-blue-50"
    >
      View <ChevronRight size={12} />
    </button>
  )
}

function WelcomeDetailDrawer({ open, code, detail, loading, error, onClose }) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={detail?.employee?.name ? `${detail.employee.name} · ${detail.employee.employee_code}` : (code || 'Welcome Email Detail')}
      footer={<Button variant="primary" className="flex-1" onClick={onClose}>Close</Button>}
    >
      {loading && !detail && (
        <div className="py-10 text-center"><Spinner /><div className="mt-3 text-sm font-bold text-slate-500">Loading…</div></div>
      )}
      {error && <Alert tone="error" icon={AlertTriangle}>{error}</Alert>}
      {detail && <DrawerBody detail={detail} />}
    </Drawer>
  )
}

function DrawerBody({ detail }) {
  const { employee, account, timeline = [] } = detail
  const empStatusTone = employee.status === 'ACTIVE' ? 'green' : employee.status === 'TERMINATED' ? 'slate' : 'amber'

  const events = useMemo(() => buildEventTimeline(detail), [detail])
  // Pipeline steps not yet completed (no real timestamp) — what the user is still waiting on.
  const upcoming = (timeline || []).filter(s => (s.state === 'pending' || s.state === 'blocked') && !s.at)

  return (
    <div className="flex flex-col gap-5">
      {/* Identity card */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-black text-white" style={{ background: ACE_BLUE }}>
            {initials(employee.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-base font-black text-slate-950">{employee.name}</div>
              <Badge tone={empStatusTone} dot>{employee.status}</Badge>
            </div>
            <div className="mt-1 text-xs font-bold text-slate-500">{employee.employee_code} · {employee.email || 'no email'}</div>
          </div>
        </div>

        {account ? (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <DetailChip label="Login" value={account.is_active ? 'Active' : 'Inactive'} tone={account.is_active ? 'green' : 'slate'} />
            <DetailChip label="Role" value={account.role} />
            <DetailChip label="Must change pwd" value={account.must_change_password ? 'Yes' : 'No'} tone={account.must_change_password ? 'amber' : 'green'} />
            <DetailChip label="Failed logins" value={account.failed_login_count} tone={account.failed_login_count ? 'red' : 'slate'} />
            <DetailChip label="Locked" value={account.locked ? 'Yes' : 'No'} tone={account.locked ? 'red' : 'green'} />
            <DetailChip label="Last login" value={account.last_login_at ? formatDateTime24(account.last_login_at, true) : 'Never'} tone={account.last_login_at ? 'green' : 'amber'} />
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
            No auth_user record — this employee cannot log in.
          </div>
        )}
      </div>

      {/* Unified chronological timeline */}
      <DrawerSection title="Activation Timeline" icon={ClockIcon}>
        <ol className="relative ml-1 border-l-2 border-slate-200 pl-5">
          {events.length === 0 && <EmptyChip text="No timestamped events on record." />}
          {events.map((ev, i) => {
            const Icon = ev.icon
            return (
              <li key={i} className="relative pb-5 last:pb-0">
                <span
                  className="absolute -left-[27px] top-0 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white"
                  style={{ background: EVENT_BG[ev.tone] || '#e2e8f0' }}
                >
                  <Icon size={13} className="text-white" />
                </span>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-sm font-black text-slate-900">{ev.title}</span>
                  <span className="text-[11px] font-bold text-slate-400">{ev.at ? formatDateTime24(ev.at, true) : ''}</span>
                </div>
                {ev.detail && <div className="mt-0.5 text-xs font-semibold text-slate-500">{ev.detail}</div>}
                {ev.error && (
                  <div className="mt-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-[11px] font-bold leading-relaxed text-red-700">
                    {ev.error}
                  </div>
                )}
                {ev.meta && <div className="mt-1 text-[11px] font-semibold text-slate-400">{ev.meta}</div>}
              </li>
            )
          })}

          {/* Upcoming / blocked steps — what's still pending */}
          {upcoming.map((step, i) => (
            <li key={`up-${i}`} className="relative pb-5 last:pb-0">
              <span className="absolute -left-[27px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-white ring-4 ring-white">
                {step.state === 'blocked'
                  ? <Circle size={20} className="text-slate-300" />
                  : <CircleDashed size={20} className="text-amber-400" />}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-black text-slate-400">{step.label}</span>
                <Badge tone={step.state === 'blocked' ? 'slate' : 'amber'}>{step.state === 'blocked' ? 'Blocked' : 'Waiting'}</Badge>
              </div>
              {step.note && <div className="mt-0.5 text-xs font-semibold text-slate-400">{step.note}</div>}
            </li>
          ))}
        </ol>
      </DrawerSection>

      <div className="text-[11px] font-semibold text-slate-400">
        Generated: {detail.generated_at ? formatDateTime24(detail.generated_at, true) : '-'}
      </div>
    </div>
  )
}

/* Background color per event tone (for the timeline node dot). */
const EVENT_BG = {
  green: '#16a34a',
  red:   '#dc2626',
  amber: '#d97706',
  blue:  '#2447d8',
  slate: '#94a3b8',
}

/* Merge every data source into one chronological (oldest→newest) event list. */
function buildEventTimeline(detail) {
  const { employee = {}, account, emails = [], login_attempts = [], auth_audit = [], audit_log = [] } = detail
  const events = []

  if (employee.created_at) {
    events.push({ at: employee.created_at, tone: 'green', icon: UserPlus,
      title: 'Employee record created', detail: employee.name })
  }
  if (account?.created_at) {
    events.push({ at: account.created_at, tone: 'green', icon: ShieldCheck,
      title: 'Login account created', detail: `Role: ${account.role}` })
  }

  emails.forEach(e => {
    if (e.status === 'SENT') {
      events.push({ at: e.sent_at || e.created_at, tone: 'green', icon: Mail,
        title: 'Welcome email sent', detail: `To ${e.recipient}`,
        meta: `Attempts: ${e.attempts ?? 0}${e.provider ? ` · ${e.provider}` : ''}` })
    } else if (e.status === 'FAILED') {
      events.push({ at: e.created_at, tone: 'red', icon: XCircle,
        title: 'Welcome email failed', detail: `To ${e.recipient}`,
        error: e.error_code ? `${e.error_code}: ${e.error_message}` : e.error_message,
        meta: `Attempts: ${e.attempts ?? 0}` })
    } else {
      events.push({ at: e.created_at, tone: e.status === 'PENDING' ? 'amber' : 'slate', icon: Mail,
        title: `Welcome email ${(e.status || '').toLowerCase()}`, detail: `To ${e.recipient}` })
    }
  })

  login_attempts.forEach(r => {
    if (r.success) {
      events.push({ at: r.created_at, tone: 'green', icon: LogIn,
        title: 'Login success', detail: `${r.identifier || ''}${r.ip_address ? ` · ${r.ip_address}` : ''}` })
    } else {
      events.push({ at: r.created_at, tone: 'red', icon: LogIn,
        title: 'Login failed', detail: `${r.identifier || ''}${r.ip_address ? ` · ${r.ip_address}` : ''}`,
        error: r.failure_reason || undefined })
    }
  })

  auth_audit.forEach(r => {
    events.push({ at: r.created_at, tone: r.success ? 'blue' : 'red', icon: KeyRound,
      title: prettyAction(r.action), detail: r.detail || (r.actor_employee_code ? `By ${r.actor_employee_code}` : undefined) })
  })

  audit_log.forEach(r => {
    events.push({ at: r.created_at, tone: 'slate', icon: Shield,
      title: r.action_label || prettyAction(r.action),
      detail: [r.actor_name && `By ${r.actor_name}`, r.source].filter(Boolean).join(' · ') || undefined,
      meta: r.ip_address || undefined })
  })

  // Account locked (future timestamp) — surface as a current alert at the end.
  if (account?.locked && account.locked_until) {
    events.push({ at: account.locked_until, tone: 'red', icon: Lock,
      title: 'Account locked', detail: `Locked until ${formatDateTime24(account.locked_until, true)}`,
      meta: `failed_login_count = ${account.failed_login_count}` })
  }

  return events
    .filter(e => e.at)
    .sort((a, b) => new Date(a.at) - new Date(b.at))
}

function prettyAction(action) {
  if (!action) return 'Event'
  return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function DrawerSection({ title, icon: Icon, children }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        {Icon && <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-blue-50 text-[#2447d8]"><Icon size={16} /></span>}
        <div className="text-sm font-black text-slate-900">{title}</div>
      </div>
      {children}
    </section>
  )
}

function DetailChip({ label, value, tone = 'slate' }) {
  const color = tone === 'green' ? 'text-green-700 bg-green-50 border-green-100'
              : tone === 'red'   ? 'text-red-700 bg-red-50 border-red-100'
              : tone === 'amber' ? 'text-amber-700 bg-amber-50 border-amber-100'
              : 'text-slate-700 bg-white border-slate-200'
  return (
    <div className={`rounded-xl border px-2.5 py-1.5 ${color}`}>
      <div className="text-[10px] font-black uppercase tracking-wider opacity-70">{label}</div>
      <div className="mt-0.5 text-xs font-black">{value}</div>
    </div>
  )
}

function EmptyChip({ text }) {
  return <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-500">{text}</div>
}
