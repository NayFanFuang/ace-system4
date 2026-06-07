import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Command,
  Download,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
  XCircle,
} from 'lucide-react'
import { apiFetch } from './src/apiFetch.js'

const COMPANY = 'AirConnect Engineering'
const BRAND_BLUE = '#2447d8'
const BRAND_RED = '#c73b32'

const revenueSeries = [
  { month: 'Nov', plan: 11.2, actual: 10.8 },
  { month: 'Dec', plan: 12.0, actual: 11.5 },
  { month: 'Jan', plan: 12.5, actual: 13.1 },
  { month: 'Feb', plan: 13.0, actual: 12.4 },
  { month: 'Mar', plan: 13.5, actual: 14.0 },
  { month: 'Apr', plan: 14.0, actual: 14.2 },
]

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'Projects', icon: BriefcaseBusiness },
  { label: 'Finance', icon: CircleDollarSign },
  { label: 'Workforce', icon: UsersRound },
  { label: 'Governance', icon: ShieldCheck },
]

const fallbackActivities = [
  { title: 'Milestone M4 delivered', owner: 'Project Office', type: 'success', time: '1h ago', amount: 'Approved' },
  { title: 'Budget utilization review', owner: 'Finance', type: 'warning', time: '3h ago', amount: '62%' },
  { title: 'Client report waiting sign-off', owner: 'Operations', type: 'info', time: '5h ago', amount: 'Due today' },
  { title: 'NT project schedule risk', owner: 'PMO', type: 'error', time: '1d ago', amount: 'Review' },
]

function hashCode(value) {
  let hash = 0
  const text = String(value || '')
  for (let i = 0; i < text.length; i++) hash = (Math.imul(31, hash) + text.charCodeAt(i)) | 0
  return Math.abs(hash)
}

function enrichProject(project) {
  const code = project.project_code || 'ACE'
  const progress = 32 + (hashCode(code) % 62)
  const budget = +(2 + (hashCode(`${code}-budget`) % 90) / 10).toFixed(1)
  const spent = +(budget * (progress / 100) * (0.82 + (hashCode(`${code}-spent`) % 24) / 100)).toFixed(1)
  return {
    code,
    name: project.project_name || code,
    customer: project.customer?.name || 'ACE',
    team: project.team?.code || project.project_type || 'OPS',
    headcount: project.headcount || 0,
    sites: project.site_count || 0,
    progress,
    budget,
    spent,
    status: progress >= 72 ? 'On Track' : progress >= 48 ? 'Watch' : 'Risk',
  }
}

function formatToday() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function initials(name) {
  return String(name || 'EX')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || 'EX'
}

function Card({ children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.06)] ${className}`}>
      {children}
    </section>
  )
}

function IconButton({ children, label, onClick }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md active:translate-y-0"
    >
      {children}
    </button>
  )
}

function StatCard({ label, value, helper, delta, tone, icon: Icon, loading }) {
  const isPositive = !String(delta).startsWith('-')
  return (
    <Card className="group p-5 transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_24px_70px_rgba(36,71,216,0.12)]">
      {loading ? (
        <div className="space-y-4">
          <div className="h-10 w-10 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
          <div className="h-8 w-32 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-40 animate-pulse rounded bg-slate-100" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `${tone}12`, color: tone }}>
              <Icon size={21} strokeWidth={2.3} />
            </div>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {delta}
            </span>
          </div>
          <div className="mt-5 text-sm font-bold text-slate-500">{label}</div>
          <div className="mt-2 text-3xl font-black tracking-normal text-slate-950">{value}</div>
          <div className="mt-2 text-sm font-semibold text-slate-400">{helper}</div>
        </>
      )}
    </Card>
  )
}

function RevenueChart({ loading, empty }) {
  const max = Math.max(...revenueSeries.flatMap(item => [item.plan, item.actual]))

  if (loading) {
    return (
      <Card className="p-6">
        <div className="mb-8 flex items-center justify-between">
          <div className="h-6 w-44 animate-pulse rounded bg-slate-100" />
          <div className="h-9 w-28 animate-pulse rounded-full bg-slate-100" />
        </div>
        <div className="flex h-72 items-end gap-4">
          {revenueSeries.map(item => (
            <div key={item.month} className="flex flex-1 items-end justify-center gap-2">
              <div className="h-32 w-full animate-pulse rounded-t-2xl bg-slate-100" />
              <div className="h-48 w-full animate-pulse rounded-t-2xl bg-slate-100" />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (empty) {
    return (
      <Card className="flex min-h-80 items-center justify-center p-8 text-center">
        <div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <BarChart3 size={24} />
          </div>
          <h3 className="mt-4 text-lg font-black text-slate-950">No chart data</h3>
          <p className="mt-2 max-w-sm text-sm font-semibold text-slate-500">Revenue and plan data will appear here after the first reporting sync.</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-black uppercase text-slate-400">
            <BarChart3 size={17} />
            Chart Section
          </div>
          <h2 className="mt-2 text-xl font-black text-slate-950">Monthly Revenue</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">Plan vs actual performance in THB million.</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
          <Download size={16} />
          Export
        </button>
      </div>

      <div className="mt-8 h-72 rounded-2xl bg-slate-50/80 p-4">
        <div className="flex h-full items-end gap-3 sm:gap-5">
          {revenueSeries.map(item => (
            <div key={item.month} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-3">
              <div className="flex h-56 w-full items-end justify-center gap-1.5 sm:gap-2">
                <div
                  className="w-full max-w-8 rounded-t-2xl bg-blue-200 transition hover:bg-blue-300"
                  style={{ height: `${Math.max(8, (item.plan / max) * 100)}%` }}
                  title={`Plan ${item.plan}M`}
                />
                <div
                  className="w-full max-w-8 rounded-t-2xl transition hover:brightness-95"
                  style={{
                    height: `${Math.max(8, (item.actual / max) * 100)}%`,
                    background: item.actual >= item.plan ? '#22c55e' : BRAND_RED,
                  }}
                  title={`Actual ${item.actual}M`}
                />
              </div>
              <span className="truncate text-xs font-black text-slate-500">{item.month}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

function StatusPill({ type, children }) {
  const styles = {
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    warning: 'bg-amber-50 text-amber-700 ring-amber-100',
    info: 'bg-blue-50 text-blue-700 ring-blue-100',
    error: 'bg-red-50 text-red-700 ring-red-100',
  }
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black ring-1 ${styles[type] || styles.info}`}>{children}</span>
}

function ActivityIcon({ type }) {
  const config = {
    success: { Icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-600' },
    warning: { Icon: AlertTriangle, className: 'bg-amber-50 text-amber-600' },
    info: { Icon: Clock3, className: 'bg-blue-50 text-blue-600' },
    error: { Icon: XCircle, className: 'bg-red-50 text-red-600' },
  }[type] || { Icon: Activity, className: 'bg-slate-100 text-slate-600' }

  return (
    <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${config.className}`}>
      <config.Icon size={18} />
    </div>
  )
}

function RecentActivityTable({ loading, error, activities }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <div className="flex items-center gap-2 text-sm font-black uppercase text-slate-400">
            <Activity size={17} />
            Recent Activity
          </div>
          <h2 className="mt-2 text-xl font-black text-slate-950">Operational Updates</h2>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-black text-slate-500">
          <Sparkles size={14} style={{ color: BRAND_BLUE }} />
          Live + mockup
        </div>
      </div>

      {error ? (
        <div className="p-8">
          <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-red-700">
            <div className="flex items-center gap-2 font-black"><AlertTriangle size={18} />Unable to load dashboard data</div>
            <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>
          </div>
        </div>
      ) : loading ? (
        <div className="space-y-3 p-5 sm:p-6">
          {[0, 1, 2, 3].map(item => (
            <div key={item} className="grid grid-cols-[44px_1fr_90px] items-center gap-3 rounded-2xl border border-slate-100 p-3">
              <div className="h-9 w-9 animate-pulse rounded-2xl bg-slate-100" />
              <div className="space-y-2">
                <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
              </div>
              <div className="h-7 animate-pulse rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="flex min-h-64 items-center justify-center p-8 text-center">
          <div>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Activity size={23} />
            </div>
            <h3 className="mt-4 text-lg font-black text-slate-950">No recent activity</h3>
            <p className="mt-2 max-w-sm text-sm font-semibold text-slate-500">Once project updates arrive, they will be listed here for quick executive review.</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 text-xs font-black uppercase text-slate-400">
                <th className="px-6 py-4">Activity</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4 text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((item, index) => (
                <tr key={`${item.title}-${index}`} className="border-t border-slate-100 transition hover:bg-blue-50/45">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <ActivityIcon type={item.type} />
                      <div className="min-w-0">
                        <div className="truncate font-black text-slate-900">{item.title}</div>
                        <div className="mt-1 text-xs font-semibold text-slate-400">Executive dashboard feed</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-600">{item.owner}</td>
                  <td className="px-6 py-4"><StatusPill type={item.type}>{item.type}</StatusPill></td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-500">{item.time}</td>
                  <td className="px-6 py-4 text-right text-sm font-black text-slate-900">{item.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

export default function ExecutiveDashboard({ authenticatedUser = null, onLogout = null }) {
  const [projects, setProjects] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      setLoading(true)
      setError('')
      try {
        const [projectResponse, employeeResponse] = await Promise.all([
          apiFetch('/api/projects'),
          apiFetch('/api/employees?status=ACTIVE'),
        ])

        if (!projectResponse.ok || !employeeResponse.ok) {
          throw new Error('Server responded with an error while loading projects or employees.')
        }

        const [projectData, employeeData] = await Promise.all([
          projectResponse.json(),
          employeeResponse.json(),
        ])

        if (!cancelled) {
          setProjects((projectData.data || []).map(enrichProject))
          setEmployees(employeeData.data || [])
        }
      } catch (err) {
        if (!cancelled) {
          setProjects([])
          setEmployees([])
          setError(err?.message || 'Cannot connect to dashboard services.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadDashboard()
    return () => { cancelled = true }
  }, [])

  const stats = useMemo(() => {
    const activeProjects = projects.length
    const headcount = employees.length
    const totalBudget = projects.reduce((sum, project) => sum + project.budget, 0)
    const totalSpent = projects.reduce((sum, project) => sum + project.spent, 0)
    const utilization = totalBudget ? Math.round((totalSpent / totalBudget) * 100) : 87

    return [
      { label: 'Revenue MTD', value: '฿14.2M', helper: 'Actual vs plan this month', delta: '+8.4%', tone: BRAND_BLUE, icon: CircleDollarSign },
      { label: 'Active Projects', value: String(activeProjects), helper: 'Live data from project DB', delta: '+3', tone: '#16a34a', icon: BriefcaseBusiness },
      { label: 'Total Headcount', value: String(headcount), helper: 'Active employees in system', delta: '+6', tone: '#7c3aed', icon: UsersRound },
      { label: 'Utilization', value: `${utilization}%`, helper: 'Budget usage ratio', delta: utilization > 92 ? '+5.2%' : '+2.1%', tone: BRAND_RED, icon: Activity },
    ]
  }, [employees, projects])

  const activities = useMemo(() => {
    if (!projects.length) return error ? [] : fallbackActivities
    return projects.slice(0, 6).map(project => ({
      title: `${project.code} ${project.status === 'Risk' ? 'requires review' : 'progress updated'}`,
      owner: project.customer,
      type: project.status === 'Risk' ? 'error' : project.status === 'Watch' ? 'warning' : 'success',
      time: `${1 + (hashCode(project.code) % 8)}h ago`,
      amount: `${project.progress}%`,
    }))
  }, [error, projects])

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="flex min-h-screen">
        <aside className={`${mobileMenuOpen ? 'fixed inset-y-0 left-0 z-40 flex' : 'hidden'} w-72 flex-col border-r border-slate-200 bg-white/95 p-5 shadow-2xl backdrop-blur lg:sticky lg:top-0 lg:flex lg:h-screen lg:shadow-none`}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${BRAND_BLUE}, ${BRAND_RED})` }}>
              <Command size={24} />
            </div>
            <div>
              <div className="text-base font-black text-slate-950">ACE System</div>
              <div className="text-xs font-bold text-slate-400">Executive Suite</div>
            </div>
          </div>

          <nav className="mt-9 space-y-2">
            {navItems.map(item => (
              <button
                key={item.label}
                type="button"
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition ${item.active ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'}`}
              >
                <item.icon size={19} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm font-black text-slate-900">
              <ShieldCheck size={18} style={{ color: BRAND_BLUE }} />
              Premium View
            </div>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">Clean executive monitoring with live project and workforce signals.</p>
          </div>
        </aside>

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
                <span className="text-sm font-semibold">Search projects, customers, people...</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <IconButton label="Refresh dashboard">
                  <RefreshCw size={18} />
                </IconButton>
                <IconButton label="Notifications">
                  <Bell size={18} />
                </IconButton>
                <button className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:bg-slate-50 sm:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-black text-white" style={{ background: BRAND_BLUE }}>
                    {initials(authenticatedUser?.name)}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black text-slate-900">{authenticatedUser?.name || 'Executive'}</div>
                    <div className="text-xs font-bold text-slate-400">{authenticatedUser?.positionName || 'Dashboard'}</div>
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

          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mb-7 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
                  <Home size={14} />
                  {COMPANY}
                </div>
                <h1 className="mt-4 text-3xl font-black tracking-normal text-slate-950 sm:text-4xl">Executive Dashboard</h1>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                  Modern SaaS overview for revenue, projects, workforce, and recent operational signals.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 shadow-sm">
                  <CalendarDays size={17} style={{ color: BRAND_RED }} />
                  {formatToday()}
                </div>
                <button className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-white shadow-[0_18px_40px_rgba(36,71,216,0.25)] transition hover:-translate-y-0.5 hover:brightness-105" style={{ background: BRAND_BLUE }}>
                  <Sparkles size={17} />
                  Board Snapshot
                </button>
              </div>
            </div>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map(item => <StatCard key={item.label} {...item} loading={loading} />)}
            </section>

            <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.85fr)]">
              <RevenueChart loading={loading} empty={!error && !loading && revenueSeries.length === 0} />
              <Card className="p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-black uppercase text-slate-400">
                      <UsersRound size={17} />
                      Team Mix
                    </div>
                    <h2 className="mt-2 text-xl font-black text-slate-950">Workforce Health</h2>
                  </div>
                  <StatusPill type={error ? 'error' : 'success'}>{error ? 'error' : 'live'}</StatusPill>
                </div>
                <div className="mt-7 space-y-5">
                  {[
                    { label: 'RF Project', value: employees.filter(e => e.project_team === 'RF').length, color: BRAND_RED },
                    { label: 'TE Project', value: employees.filter(e => e.project_team === 'TE').length, color: BRAND_BLUE },
                    { label: 'Head Office', value: employees.filter(e => String(e.department || '').toLowerCase().includes('head')).length, color: '#7c3aed' },
                  ].map(item => {
                    const pct = employees.length ? Math.round((item.value / employees.length) * 100) : 0
                    return (
                      <div key={item.label}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-black text-slate-700">{item.label}</span>
                          <span className="font-black text-slate-500">{item.value} people</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: item.color }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </section>

            <section className="mt-6">
              <RecentActivityTable loading={loading} error={error} activities={activities} />
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
