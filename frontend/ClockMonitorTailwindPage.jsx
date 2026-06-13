'use client'

// Clock Monitor — Tailwind + ACE UI Kit rebuild (experimental, served at /clock/monitor).
// The original inline-styled page remains at /clock/monitor-classic.
// All sections share the kit primitives in src/ui (ds-* tokens) — no style objects.

import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays, ChartColumn, Clock, LogOut, Map as MapIcon,
  RefreshCw, Siren, Timer, UserRound, Users,
} from 'lucide-react'
import { apiFetch } from './src/apiFetch.js'
import { formatDateYmd } from './src/dateFormat.js'
import {
  Alert, Avatar, Badge, Button, Card, EmptyState, Select, Spinner, StatCard,
  Sidebar, SidebarBrand, SidebarLink, SidebarSection,
} from './src/ui/index.jsx'
import { Sparkline } from './src/ui/Charts.jsx'
import { MapView } from './src/ui/MapView.jsx'

const ACE_BLUE = '#2447d8'

const NAV = [
  { id: 'overview',   label: 'Overview',          icon: ChartColumn },
  { id: 'attendance', label: 'Attendance',        icon: Clock },
  { id: 'individual', label: 'Individual',        icon: UserRound },
  { id: 'admin',      label: 'Admin Attention',   icon: Siren },
  { id: 'map',        label: 'Live Map',          icon: MapIcon },
]

const todayISO = () => formatDateYmd(new Date())
const monthISO = () => todayISO().slice(0, 7)

export default function ClockMonitorTailwindPage({ authenticatedUser, onLogout }) {
  const [nav, setNav] = useState('overview')
  const [team, setTeam] = useState('ALL')
  const [month, setMonth] = useState(monthISO())
  const [departments, setDepartments] = useState([])

  useEffect(() => {
    apiFetch('/api/clock/monitor/departments')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.departments) setDepartments(d.departments) })
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="flex min-h-screen">
        <Sidebar className="sticky top-0 hidden h-screen shrink-0 lg:flex">
          <SidebarBrand title="ACE" subtitle="Clock Monitor" />
          <SidebarSection>
            {NAV.map(item => (
              <SidebarLink
                key={item.id}
                icon={item.icon}
                active={nav === item.id}
                href="#"
                onClick={e => { e.preventDefault(); setNav(item.id) }}
              >{item.label}</SidebarLink>
            ))}
          </SidebarSection>
          <div className="mt-auto p-4">
            <Card className="p-4">
              <div className="text-xs font-black text-slate-900">Tailwind rebuild</div>
              <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-500">
                Experimental UI-Kit version. Classic page: <a href="/clock/monitor-classic" className="font-black text-[#2447d8]">/clock/monitor-classic</a>
              </p>
            </Card>
          </div>
        </Sidebar>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/86 px-4 py-3 backdrop-blur-xl sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 lg:hidden">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: ACE_BLUE }}><Timer size={18} /></span>
                <span className="text-sm font-black">Clock Monitor</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Badge tone="blue" dot>{todayISO()}</Badge>
                <span className="hidden items-center gap-2 sm:flex">
                  <Avatar name={authenticatedUser?.name || 'CM'} />
                  <span className="text-sm font-black text-slate-900">{authenticatedUser?.name || 'Clock Admin'}</span>
                </span>
                {onLogout && <Button variant="ghost" icon={LogOut} onClick={onLogout}>Logout</Button>}
              </div>
            </div>
          </header>

          <div className="flex flex-col gap-4 px-4 py-6 sm:px-6">
            <section className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <Badge tone="blue">⏱ ACE · Operations · Clock Monitor</Badge>
                <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{NAV.find(n => n.id === nav)?.label}</h1>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <label className="block">
                  <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-500">Department</span>
                  <Select value={team} onChange={e => setTeam(e.target.value)}>
                    <option value="ALL">ALL</option>
                    {departments.map(d => <option key={d.value} value={d.value}>{d.label}{d.count ? ` (${d.count})` : ''}</option>)}
                  </Select>
                </label>
                {(nav === 'attendance' || nav === 'individual') && (
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-500">Month</span>
                    <input type="month" className="ds-field" value={month} onChange={e => setMonth(e.target.value)} />
                  </label>
                )}
              </div>
            </section>

            {nav === 'overview'   && <OverviewSection team={team} />}
            {nav === 'attendance' && <AttendanceSection team={team} month={month} />}
            {nav === 'individual' && <IndividualSection team={team} month={month} />}
            {nav === 'admin'      && <AdminSection team={team} />}
            {nav === 'map'        && <MapSection team={team} />}
          </div>
        </main>
      </div>
    </div>
  )
}

/* ───────────────────────── Overview ───────────────────────── */

function OverviewSection({ team }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    apiFetch(`/api/clock/monitor/today-executive?team=${team}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(load, [team])

  const people = data?.people || []
  const started = people.length
  const meta = data?.meta || {}

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Clocked-in Today" value={started} hint={`Team ${team}`} accent={ACE_BLUE} />
        <StatCard label="With GPS" value={people.filter(p => p.lat != null).length} hint="Location captured" />
        <StatCard label="Sites" value={new Set(people.map(p => p.siteCode).filter(Boolean)).size} hint="Distinct sites" />
        <StatCard label="Date" value={meta.dateISO || todayISO()} hint="Bangkok time" />
      </div>

      <Card className="p-0">
        <SectionHeader title="Latest clock-in per person" badge={`${started} people`} onRefresh={load} loading={loading} />
        {loading ? <CenterSpinner /> : started === 0 ? (
          <EmptyState title="No clock-ins today" desc={`No-one in team ${team} has clocked in yet.`} />
        ) : (
          <div className="ds-scroll overflow-x-auto">
            <table className="ds-table">
              <thead><tr><th>Person</th><th>Team</th><th>Site</th><th>Time</th><th>GPS</th></tr></thead>
              <tbody>
                {people.map(p => (
                  <tr key={p.employeeCode}>
                    <td>
                      <div className="font-black text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-400">{p.employeeCode}</div>
                    </td>
                    <td>{p.projectCode || '—'}</td>
                    <td>{p.siteName || p.siteCode || '—'}</td>
                    <td className="ds-mono">{p.time || '—'}</td>
                    <td>{p.lat != null ? <Badge tone="green" dot>GPS</Badge> : <Badge tone="slate">No GPS</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}

/* ───────────────────────── Attendance ───────────────────────── */

const TREND_SERIES = [
  { key: 'sendPct',  label: 'Send to Line',  bar: 'bg-blue-500',    tone: 'blue' },
  { key: 'locPct',   label: 'Location Work', bar: 'bg-emerald-500', tone: 'green' },
  { key: 'clockPct', label: 'Status Clock',  bar: 'bg-violet-600',  tone: 'purple' },
]

function AttendanceSection({ team, month }) {
  const [data, setData] = useState({ summary: null, people: [], trend: [] })
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    apiFetch(`/api/clock/monitor/attendance-tracker?month=${month}&team=${team}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData({ summary: d.summary, people: d.people || [], trend: d.trend || [] }) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(load, [team, month])

  const s = data.summary || {}

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="People" value={s.people || 0} hint={`Team ${team}`} />
        <StatCard label="Send to Line" value={`${s.avgSendPct || 0}%`} hint="Avg · tapped Share" accent="#3b82f6" />
        <StatCard label="Location Work" value={`${s.avgLocPct || 0}%`} hint="Avg · on-site (GPS)" accent="#10b981" />
        <StatCard label="Status Clock" value={`${s.avgClockPct || 0}%`} hint="Avg · clock complete" accent="#7c3aed" />
      </div>

      <Card className="p-0">
        <SectionHeader title={`Daily compliance trend — ${month}`} badge="hover · click to pin" onRefresh={load} loading={loading} />
        <div className="p-4">
          {loading ? <CenterSpinner /> : <TrendBars trend={data.trend} />}
        </div>
      </Card>

      <Card className="p-0">
        <SectionHeader title="Per-person compliance" badge={`${data.people.length} people`} />
        {loading ? <CenterSpinner /> : data.people.length === 0 ? (
          <EmptyState title="No data" desc="No sessions recorded this month." />
        ) : (
          <div className="ds-scroll overflow-x-auto">
            <table className="ds-table">
              <thead><tr><th>Person</th><th>Days</th><th>Send</th><th>Location</th><th>Clock</th><th>Avg In</th><th>Avg Out</th><th>Hours</th></tr></thead>
              <tbody>
                {data.people.map(r => (
                  <tr key={r.employeeCode}>
                    <td>
                      <div className="font-black text-slate-900">{r.name}</div>
                      <div className="text-[11px] text-slate-400">{r.employeeCode} · {r.project}</div>
                    </td>
                    <td className="ds-mono">{r.workingDays}</td>
                    <td><PctBadge pct={r.sendPct} /></td>
                    <td><PctBadge pct={r.locPct} /></td>
                    <td><PctBadge pct={r.clockPct} /></td>
                    <td className="ds-mono">{r.avgClockIn}</td>
                    <td className="ds-mono">{r.avgClockOut}</td>
                    <td className="ds-mono font-black">{r.totalHours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}

// Grouped Tailwind bar chart with hover/click-pin detail row.
function TrendBars({ trend }) {
  const [hoverDay, setHoverDay] = useState(null)
  const [pinnedDay, setPinnedDay] = useState(null)
  if (!trend || trend.length === 0) return <EmptyState title="No data" />

  const N = trend.length
  const activeDay = pinnedDay ?? hoverDay
  const active = activeDay != null ? trend.find(t => t.day === activeDay) : null
  const avg = TREND_SERIES.map(sr => {
    const vals = trend.map(t => t[sr.key]).filter(v => v != null)
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0
  })

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {TREND_SERIES.map((sr, i) => <Badge key={sr.key} tone={sr.tone} dot>{sr.label} · avg {avg[i]}%</Badge>)}
        </div>
        {pinnedDay != null && <Button variant="ghost" onClick={() => setPinnedDay(null)}>✕ Unpin day {pinnedDay}</Button>}
      </div>

      <div className={`ds-card mb-2 px-4 py-2 ${active ? 'bg-slate-50' : ''}`} style={!active ? { borderStyle: 'dashed' } : undefined}>
        {active ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="text-[11px] font-extrabold tracking-wide text-slate-900">Day {String(active.day).padStart(2, '0')}{active.sunday ? ' · Sunday' : ''}</span>
            {pinnedDay != null && <Badge tone="blue">📌 pinned</Badge>}
            {active.sunday ? <Badge tone="slate">Non-workday</Badge>
              : active.totalCount > 0 ? (
                <>
                  {TREND_SERIES.map(sr => <Badge key={sr.key} tone={sr.tone}>{sr.label}: {active[sr.key] != null ? `${active[sr.key]}%` : '—'}</Badge>)}
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-slate-500"><Users size={12} /> {active.totalCount} clocked</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-slate-500"><Clock size={12} /> {active.lateCount} late · avg {active.avgLateMin ?? 0} min</span>
                </>
              ) : <Badge tone="slate">No-one clocked this day</Badge>}
          </div>
        ) : (
          <span className="text-[11px] font-extrabold text-slate-400">Hover a bar to preview · click to pin details</span>
        )}
      </div>

      <div className="ds-scroll overflow-x-auto">
        <div className="min-w-[560px]" onMouseLeave={() => setHoverDay(null)}>
          <div className="flex">
            <div className="relative h-56 w-9 shrink-0">
              {[0, 25, 50, 75, 100].map(p => (
                <span key={p} className="absolute right-2 translate-y-1/2 text-[10px] font-semibold leading-none text-slate-400" style={{ bottom: `${p}%` }}>{p}%</span>
              ))}
            </div>
            <div className="relative h-56 flex-1">
              {[0, 25, 50, 75, 100].map(p => (
                <div key={p} className={`absolute inset-x-0 border-t ${p === 0 ? 'border-slate-200' : 'border-slate-100'}`} style={{ bottom: `${p}%` }} />
              ))}
              <div className="absolute inset-0 flex">
                {trend.map(t => {
                  const isActive = activeDay === t.day
                  return (
                    <div
                      key={t.day}
                      onMouseEnter={() => setHoverDay(t.day)}
                      onClick={() => setPinnedDay(p => p === t.day ? null : t.day)}
                      className={`flex flex-1 cursor-pointer items-end justify-center transition-colors ${isActive ? 'bg-blue-50/80' : t.sunday ? 'bg-slate-50' : 'hover:bg-slate-50/60'}`}
                    >
                      <div className="flex h-full w-[70%] items-end justify-center gap-px">
                        {TREND_SERIES.map(sr => {
                          const v = t[sr.key]
                          if (v == null) return <div key={sr.key} className="flex-1" />
                          return <div key={sr.key} className={`flex-1 rounded-t-sm ${sr.bar} ${isActive ? '' : 'opacity-85'}`} style={{ height: v > 0 ? `${v}%` : '2px' }} />
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="ml-9 mt-1 flex">
            {trend.map((t, i) => {
              const isActive = activeDay === t.day
              const show = isActive || i % 2 === 0 || i === N - 1
              return (
                <div key={t.day} className="flex-1 text-center">
                  {show && <span className={`text-[10px] leading-none ${isActive ? 'font-extrabold text-blue-700' : t.sunday ? 'font-semibold text-slate-300' : 'font-semibold text-slate-400'}`}>{t.day}</span>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── Individual ───────────────────────── */

function IndividualSection({ team, month }) {
  const [options, setOptions] = useState([])
  const [code, setCode] = useState('')
  const [profile, setProfile] = useState(null)
  const [days, setDays] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    apiFetch('/api/clock/monitor/roster')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.roster) setOptions(d.roster) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!code) { setProfile(null); setDays([]); return }
    setLoading(true)
    Promise.all([
      apiFetch(`/api/clock/monitor/person-profile?employee_code=${code}&months=12`).then(r => r.ok ? r.json() : null),
      apiFetch(`/api/clock/monitor/person-compliance?month=${month}&employee_code=${code}`).then(r => r.ok ? r.json() : null),
    ]).then(([prof, pc]) => {
      if (prof?.ok) setProfile(prof)
      if (pc?.days) setDays(pc.days)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [code, month])

  const filtered = useMemo(() => {
    const t = (team || 'ALL').toUpperCase()
    if (t === 'ALL') return options
    return options.filter(o => String(o.team || o.projectCode || '').toUpperCase() === t)
  }, [options, team])

  const p = profile?.profile
  const k = profile?.kpis
  const trendVals = (profile?.trend || []).map(t => t.scorePct).filter(v => v != null)

  return (
    <>
      <Card className="p-4">
        <label className="block max-w-md">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-500">Person · {filtered.length} in team {team}</span>
          <Select value={code} onChange={e => setCode(e.target.value)}>
            <option value="">— Select person —</option>
            {filtered.map(o => (
              <option key={o.employeeCode || o.email} value={o.employeeCode || o.email}>
                {(o.team || o.projectCode || '—')} · {o.employeeCode} — {o.name}
              </option>
            ))}
          </Select>
        </label>
      </Card>

      {loading && <CenterSpinner />}

      {!loading && !code && (
        <EmptyState icon={UserRound} title="Select a person" desc="Profile · Attendance · Risk score · 12-month trend · Flags" />
      )}

      {!loading && p && (
        <>
          <Card className="p-4">
            <div className="flex flex-wrap items-start gap-4">
              <Avatar name={p.name} size={56} />
              <div className="min-w-[220px] flex-1">
                <div className="text-lg font-black text-slate-950">{p.name}</div>
                <div className="mt-0.5 text-xs font-bold text-slate-500">{p.employeeCode} · {p.position || '—'} · Team {p.team || '—'}</div>
                {(p.managerName || p.managerCode) && (
                  <div className="mt-1 text-[11px] font-semibold text-slate-500">Manager: {p.managerName || '—'} {p.managerCode && `(${p.managerCode})`}</div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Badge tone={p.status === 'ACTIVE' ? 'green' : 'slate'} dot>{p.status}</Badge>
                {p.hireDate && <span className="text-[11px] font-bold text-slate-500">Hired {p.hireDate} · {p.tenureText}</span>}
                {profile.lastClock
                  ? <span className="text-[11px] font-bold text-slate-600">Last clock {profile.lastClock.date} {profile.lastClock.time}</span>
                  : <span className="text-[11px] font-bold text-slate-400">No clock records</span>}
              </div>
            </div>
          </Card>

          {k && (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <StatCard label="Attendance" value={`${k.attendancePct}%`} hint={`${k.clockedDays}/${k.workdays} days`} />
              <StatCard label="Avg Hours" value={k.avgHoursText || '—'} hint={`${k.completedDays} complete days`} />
              <StatCard label="Late" value={k.lateDays} hint="≥ 09:00" accent={k.lateDays >= 3 ? '#d97706' : undefined} />
              <StatCard label="Missed" value={k.missedDays} hint="No clock at all" accent={k.missedDays >= 2 ? '#dc2626' : undefined} />
              <StatCard
                label="Risk Score"
                value={k.riskScore}
                hint={k.riskLevel.toUpperCase()}
                accent={k.riskLevel === 'high' ? '#dc2626' : k.riskLevel === 'medium' ? '#d97706' : '#16a34a'}
              />
            </div>
          )}

          {trendVals.length > 1 && (
            <Card className="p-4">
              <div className="mb-1 flex items-center justify-between">
                <div className="text-sm font-black text-slate-900">12-month trend</div>
                <Badge tone="blue">{trendVals[trendVals.length - 1]}%</Badge>
              </div>
              <Sparkline data={trendVals} height={56} />
            </Card>
          )}

          {profile.flags?.length > 0 ? (
            <Card className="p-4">
              <div className="mb-2 text-sm font-black text-slate-900">Anomaly flags ({profile.flags.length})</div>
              <div className="flex flex-col gap-1.5">
                {profile.flags.map((f, i) => (
                  <Alert key={i} tone={f.severity === 'high' ? 'error' : 'warn'}>
                    <span className="font-bold">{f.label}</span>
                    <span className="ml-2 text-xs text-slate-500 ds-mono">{f.date || (f.from && `${f.from} → ${f.to}`) || ''}</span>
                  </Alert>
                ))}
              </div>
            </Card>
          ) : (
            <Alert tone="success">No flags in the last 14 days — no consecutive misses, late ≥ 30 min, no-GPS, or off-site.</Alert>
          )}

          {days.length > 0 && <PersonTimeline days={days} month={month} />}
          {days.length > 0 && <DailyTriple days={days} month={month} />}
        </>
      )}
    </>
  )
}

// Per-day clock-in → clock-out span, plotted on a shared 06:00–22:00 axis.
function PersonTimeline({ days, month }) {
  const fmtHM = (sec) => {
    if (sec == null) return '—'
    const s = Math.max(0, Math.min(86399, Math.round(sec)))
    return `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}`
  }
  const fmtDur = (sec) => {
    if (sec == null || sec <= 0) return '—'
    return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`
  }
  const HOUR_START = 6, HOUR_END = 22, HOUR_SPAN = HOUR_END - HOUR_START
  const HOURS = [6, 8, 10, 12, 14, 16, 18, 20, 22]
  const pctOfSec = (sec) => {
    const h = Math.max(HOUR_START, Math.min(HOUR_END, sec / 3600))
    return ((h - HOUR_START) / HOUR_SPAN) * 100
  }
  const pctOfHour = (h) => ((h - HOUR_START) / HOUR_SPAN) * 100

  return (
    <Card className="p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-black text-slate-900">Timeline — Clock-in → Clock-out ({month})</div>
          <div className="text-[11px] font-semibold text-slate-500">Blue bar = clock-in → clock-out span · dashed row = no record that day</div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="blue" dot>Completed</Badge>
          <Badge tone="amber" dot>No clock-out</Badge>
          <Badge tone="slate" dot>Missed</Badge>
        </div>
      </div>
      <div className="ds-scroll overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="mb-1 flex">
            <div className="w-10 shrink-0" />
            <div className="relative h-4 flex-1">
              {HOURS.map((h, i) => (
                <span
                  key={h}
                  className={`absolute text-[10px] font-semibold leading-none text-slate-400 ${i === 0 ? '' : i === HOURS.length - 1 ? '-translate-x-full' : '-translate-x-1/2'}`}
                  style={{ left: `${pctOfHour(h)}%` }}
                >{String(h).padStart(2, '0')}:00</span>
              ))}
            </div>
          </div>
          <div className="flex">
            <div className="flex w-10 shrink-0 flex-col gap-[3px]">
              {days.map(d => {
                const dow = d.dayISO ? new Date(d.dayISO).getDay() : -1
                return (
                  <div key={d.day} className="flex h-[26px] items-center justify-end pr-2">
                    <span className={`text-[10px] font-semibold leading-none ${dow === 0 ? 'text-slate-300' : 'text-slate-400'}`}>{String(d.day).padStart(2, '0')}</span>
                  </div>
                )
              })}
            </div>
            <div className="relative flex-1">
              {HOURS.map(h => (
                <div
                  key={h}
                  className={`absolute inset-y-0 border-l ${h % 6 === 0 ? 'border-slate-200' : 'border-dashed border-slate-100'}`}
                  style={{ left: `${pctOfHour(h)}%` }}
                />
              ))}
              <div className="flex flex-col gap-[3px]">
                {days.map(d => {
                  const dayLabel = String(d.day).padStart(2, '0')
                  const dow = d.dayISO ? new Date(d.dayISO).getDay() : -1
                  const isSun = dow === 0
                  const hasIn = d.ciSec != null
                  const hasOut = d.coSec != null && d.ttSec != null && d.ttSec > 0 && d.ttSec < 86400
                  const ci = hasIn ? Math.max(0, Math.min(86400, d.ciSec)) : null
                  const co = hasOut ? Math.max(0, Math.min(86400, d.coSec)) : null
                  const validBar = ci != null && co != null && co > ci
                  const left = ci != null ? pctOfSec(ci) : null
                  const width = validBar ? Math.max(0.5, pctOfSec(co) - pctOfSec(ci)) : null
                  return (
                    <div key={d.day} className={`relative h-[26px] rounded ${isSun ? 'bg-slate-50' : 'border border-dashed border-slate-100 bg-slate-50/40'}`}>
                      {validBar && (
                        <div
                          className="absolute bottom-[3px] top-[3px] flex items-center justify-center overflow-hidden rounded bg-[#2447d8]"
                          style={{ left: `${left}%`, width: `${width}%` }}
                          title={`Day ${dayLabel}  ${fmtHM(ci)} → ${fmtHM(co)}  (${fmtDur(d.ttSec)})`}
                        >
                          {width > 12 && (
                            <span className="whitespace-nowrap text-[10px] font-extrabold leading-none text-white">{fmtHM(ci)}–{fmtHM(co)}</span>
                          )}
                        </div>
                      )}
                      {!validBar && hasIn && (
                        <div
                          className="absolute inset-y-0 flex items-center gap-1.5"
                          style={{ left: `${left}%` }}
                          title={`Day ${dayLabel}  Clock-in ${fmtHM(ci)} · no clock-out`}
                        >
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500 ring-2 ring-white" />
                          <span className="whitespace-nowrap text-[10px] font-extrabold leading-none text-amber-800">{fmtHM(ci)} — no clock-out</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

// Compact Tailwind daily Send/Loc/Clock grid.
function DailyTriple({ days, month }) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-black text-slate-900">Daily — Send / Location / Clock ({month})</div>
        <div className="flex items-center gap-2">
          <Badge tone="blue" dot>Send</Badge>
          <Badge tone="green" dot>Location</Badge>
          <Badge tone="purple" dot>Clock-out</Badge>
        </div>
      </div>
      <div className="ds-scroll overflow-x-auto">
        <div className="grid min-w-[640px] gap-1" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(20px, 1fr))` }}>
          {days.map(d => {
            const dow = d.dayISO ? new Date(d.dayISO).getDay() : -1
            const cell = (val, on) => val == null ? 'bg-slate-100' : val ? on : 'bg-red-200'
            return (
              <div key={d.day} className="text-center">
                <div className="mb-1 text-[10px] font-black text-slate-500">{String(d.day).padStart(2, '0')}</div>
                <div className="grid gap-[3px]">
                  <div title={`Day ${d.day}: Send=${d.send ?? '—'}`} className={`h-5 rounded ${cell(d.send, 'bg-blue-500')}`} />
                  <div title={`Day ${d.day}: Location=${d.loc ?? '—'}`} className={`h-5 rounded ${cell(d.loc, 'bg-emerald-500')}`} />
                  <div title={`Day ${d.day}: Clock=${d.clock ?? '—'}`} className={`h-5 rounded ${cell(d.clock, 'bg-violet-600')}`} />
                </div>
                <div className={`mt-1 text-[9px] font-bold ${dow === 0 ? 'text-slate-300' : 'text-slate-400'}`}>{['Su', 'M', 'T', 'W', 'Th', 'F', 'Sa'][dow] || ''}</div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

/* ───────────────────────── Admin Attention ───────────────────────── */

function AdminSection({ team }) {
  const [data, setData] = useState({ notClockedInToday: [], incompleteYesterday: [], meta: null })
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    apiFetch(`/api/clock/monitor/admin-attention?team=${team}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) setData({ notClockedInToday: d.notClockedInToday || [], incompleteYesterday: d.incompleteYesterday || [], meta: d.meta || null })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(load, [team])

  const meta = data.meta || {}
  const headcount = meta.activeHeadcount || 0
  const notIn = data.notClockedInToday
  const inToday = headcount - notIn.length

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Active Headcount" value={headcount} hint={`Team ${team}`} />
        <StatCard label="Clocked-in Today" value={inToday} hint={headcount ? `${Math.round(inToday / headcount * 100)}%` : '—'} accent="#16a34a" />
        <StatCard label="Not Clocked-in" value={notIn.length} hint="Needs follow-up" accent={notIn.length > 0 ? '#dc2626' : undefined} />
        <StatCard label="Incomplete Yesterday" value={data.incompleteYesterday.length} hint="Missing out / GPS" accent={data.incompleteYesterday.length > 0 ? '#d97706' : undefined} />
      </div>

      <Card className="p-0">
        <SectionHeader title={`Not clocked-in today (${meta.today || '—'})`} badge={`${notIn.length} people`} onRefresh={load} loading={loading} />
        {loading ? <CenterSpinner /> : notIn.length === 0 ? (
          <EmptyState title="All in" desc={`Everyone in team ${team} clocked in today.`} />
        ) : (
          <div className="ds-scroll overflow-x-auto">
            <table className="ds-table">
              <thead><tr><th>Code</th><th>Name</th><th>Project</th><th>Position</th><th>Email</th></tr></thead>
              <tbody>
                {notIn.map(r => (
                  <tr key={r.employeeCode}>
                    <td className="ds-mono">{r.employeeCode}</td>
                    <td className="font-black text-slate-900">{r.name}</td>
                    <td>{r.project || '—'}</td>
                    <td>{r.position || '—'}</td>
                    <td className="text-slate-500">{r.email || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-0">
        <SectionHeader title={`Incomplete yesterday (${meta.yesterday || '—'})`} badge={`${data.incompleteYesterday.length} sessions`} />
        {loading ? <CenterSpinner /> : data.incompleteYesterday.length === 0 ? (
          <EmptyState title="Nothing incomplete" desc="All sessions yesterday had clock-out and GPS." />
        ) : (
          <div className="ds-scroll overflow-x-auto">
            <table className="ds-table">
              <thead><tr><th>Person</th><th>Site</th><th>In</th><th>Out</th><th>Issues</th></tr></thead>
              <tbody>
                {data.incompleteYesterday.map(r => (
                  <tr key={r.sessionId}>
                    <td>
                      <div className="font-black text-slate-900">{r.name}</div>
                      <div className="text-[11px] text-slate-400">{r.employeeCode} · {r.project}</div>
                    </td>
                    <td>{r.site || '—'}</td>
                    <td className="ds-mono">{r.clockIn || '—'}</td>
                    <td className="ds-mono">{r.clockOut || '—'}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {(r.issues || []).map(issue => <Badge key={issue} tone={issue === 'No clock-out' ? 'amber' : 'red'}>{issue}</Badge>)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}

/* ───────────────────────── Live Map ───────────────────────── */

const MAP_STATUS = {
  on_site:  { tone: 'green', label: 'On-site',  color: '#16a34a' },
  off_site: { tone: 'red',   label: 'Off-site', color: '#dc2626' },
  no_site:  { tone: 'slate', label: 'No site',  color: '#64748b' },
  no_gps:   { tone: 'slate', label: 'No GPS',   color: '#94a3b8' },
}

function MapSection({ team }) {
  const [data, setData] = useState({ people: [], workLocations: [], meta: null })
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    apiFetch(`/api/clock/monitor/today-map?team=${team}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData({ people: d.people || [], workLocations: d.workLocations || [], meta: d.meta || null }) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(load, [team])

  const meta = data.meta || {}
  const markers = data.people
    .filter(p => p.lat != null && p.lng != null)
    .map(p => ({
      lat: p.lat, lng: p.lng,
      label: `${p.name} · ${p.siteName || p.siteCode || '—'}`,
      color: (MAP_STATUS[p.status] || MAP_STATUS.no_gps).color,
    }))

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="People Today" value={meta.totalPeople || 0} hint={meta.dateISO || ''} />
        <StatCard label="On-site" value={meta.onSite || 0} hint="Within geofence" accent="#16a34a" />
        <StatCard label="Off-site" value={meta.offSite || 0} hint="Outside radius" accent={meta.offSite > 0 ? '#dc2626' : undefined} />
        <StatCard label="Work Locations" value={data.workLocations.length} hint="Office geofences" accent="#d97706" />
      </div>

      <Card className="p-0">
        <SectionHeader title="Live location map" badge={`${markers.length} pins`} onRefresh={load} loading={loading} />
        <div className="p-4">
          {loading ? <CenterSpinner /> : markers.length === 0 ? (
            <EmptyState icon={MapIcon} title="No GPS points today" desc="No-one with location data has clocked in yet." />
          ) : (
            <MapView markers={markers} height={460} fitToMarkers />
          )}
        </div>
      </Card>
    </>
  )
}

/* ───────────────────────── Shared bits ───────────────────────── */

function SectionHeader({ title, badge, onRefresh, loading }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-black text-slate-900">{title}</span>
        {badge && <Badge tone="slate">{badge}</Badge>}
      </div>
      {onRefresh && <Button variant="ghost" icon={RefreshCw} loading={loading} onClick={onRefresh}>Refresh</Button>}
    </div>
  )
}

function CenterSpinner() {
  return <div className="flex items-center justify-center py-10"><Spinner /></div>
}

function PctBadge({ pct }) {
  const n = Number(pct || 0)
  return <Badge tone={n >= 90 ? 'green' : n >= 60 ? 'amber' : 'red'}>{n}%</Badge>
}
