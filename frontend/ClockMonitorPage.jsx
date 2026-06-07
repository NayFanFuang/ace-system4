'use client'

import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, CalendarDays, CalendarRange, CalendarClock, ChartColumn, Circle,
  CircleCheck, ClipboardCheck, ClipboardPen, Clock, Crosshair, Image as ImageIcon,
  Info, LocateFixed, Lock, LogOut, Map as MapIcon, MapPin, MapPinned, RefreshCw,
  Route, Save, Search, Siren, Sparkles, Stethoscope, Timer, Trash2, TreePalm,
  TriangleAlert, UserRound, Users, X,
} from 'lucide-react'
import { apiFetch } from './src/apiFetch.js'
import { formatDateYmd, formatTime24 } from './src/dateFormat.js'
import { exportPdf, exportExcel, colorForPct } from './src/exportUtils.js'

const ACE_BLUE = '#2447d8'
const ACE_RED = '#c0392b'
const ACE_GRADIENT = `linear-gradient(135deg, ${ACE_BLUE} 0%, ${ACE_RED} 100%)`
const ACE_TW_GRADIENT = 'bg-[linear-gradient(135deg,#1d4ed8_0%,#dc2626_100%)]'
const PROJECT_COLORS = ['#1d4ed8', '#dc2626', '#16a34a', '#9333ea', '#0891b2', '#f59e0b', '#475569']

const NAV = [
  ['daily', 'Daily Monitor'],
  ['manualEntry', 'Manual Entry (Admin)'],
  ['workLocations', 'Work Locations (Admin)'],
  ['attendance', 'Attendance Tracker'],
  ['movement', 'Movement & Coverage'],
  ['admin', 'Admin Attention'],
  ['health', 'Health'],
  ['leave', 'Leave Requests'],
]

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'SYSTEM_ADMIN', 'HR_ADMIN', 'PROJECT_ADMIN'])

function todayISO() {
  return formatDateYmd(new Date())
}

function monthISO(date = todayISO()) {
  return String(date || '').slice(0, 7)
}

function dateOnly(value) {
  if (!value) return ''
  return formatDateYmd(value)
}

function timeOnly(value) {
  if (!value) return ''
  return formatTime24(value, true)
}

function norm(value) {
  return String(value || '').trim().toLowerCase()
}

function isStart(status) {
  return /start|clock in|^in$/i.test(String(status || ''))
}

function isStop(status) {
  return /stop|clock out|complete|end/i.test(String(status || ''))
}

function secFromTime(value) {
  const t = timeOnly(value)
  const m = t.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/)
  if (!m) return null
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3] || 0)
}

function hms(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '-'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}:${String(m).padStart(2, '0')}`
}

function percent(value) {
  const n = Number(value || 0)
  return `${Math.round(n * 1000) / 10}%`
}

function projectColor(project) {
  const key = String(project || 'UNKNOWN')
  let hash = 0
  for (let i = 0; i < key.length; i += 1) hash += key.charCodeAt(i)
  return PROJECT_COLORS[hash % PROJECT_COLORS.length]
}

function groupBy(list, keyFn) {
  const map = new Map()
  list.forEach(item => {
    const key = keyFn(item)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(item)
  })
  return map
}

function latestByEmail(events) {
  const map = new Map()
  events.forEach(event => {
    const key = norm(event.email) || norm(event.name)
    if (!key) return
    const current = map.get(key)
    if (!current || String(event.time) > String(current.time)) map.set(key, event)
  })
  return map
}

function sessionsFromEvents(events) {
  const grouped = groupBy(events, event => `${dateOnly(event.time)}|${norm(event.email) || norm(event.name)}`)
  return [...grouped.values()].map(rows => {
    const sorted = rows.slice().sort((a, b) => String(a.time).localeCompare(String(b.time)))
    const start = sorted.find(row => isStart(row.status)) || sorted[0]
    const end = sorted.slice().reverse().find(row => isStop(row.status))
    const startSec = secFromTime(start?.time)
    const endSec = secFromTime(end?.time)
    return {
      date: dateOnly(start?.time),
      name: start?.name || end?.name || '',
      email: start?.email || end?.email || '',
      projectCode: start?.projectCode || end?.projectCode || '',
      job: start?.job || end?.job || '',
      start,
      end,
      duration: startSec != null && endSec != null ? endSec - startSec : null,
    }
  }).sort((a, b) => String(b.date).localeCompare(String(a.date)))
}

function filterByTeam(row, team) {
  const t = String(team || 'ALL').toUpperCase()
  if (t === 'ALL') return true
  const project = String(row.projectCode || row.project || row.team || row.source || '').toUpperCase()
  if (t === 'DTE') return row.source === 'DTE' || project === 'DTE' || /DTE/.test(String(row.position || ''))
  return project === t
}

export default function ClockMonitorPage({ authenticatedUser = null, onLogout = null }) {
  const [page, setPage] = useState('daily')
  const [team, setTeam] = useState('ALL')
  const [date, setDate] = useState(todayISO())
  const [month, setMonth] = useState(() => todayISO().slice(0, 7))
  const [project, setProject] = useState('')
  const [query, setQuery] = useState('')
  const [personEmail, setPersonEmail] = useState('')
  const [liveEvents, setLiveEvents] = useState([])
  const [liveRoster, setLiveRoster] = useState([])
  const [latestDataDate, setLatestDataDate] = useState(null)

  function calcRange(p, d, m) {
    if (p === 'monthly' || p === 'individual' || p === 'executive') {
      const [y, mo] = m.split('-').map(Number)
      const last = new Date(y, mo, 0).getDate()
      return { from: `${m}-01`, to: `${m}-${String(last).padStart(2, '0')}` }
    }
    if (p === 'weekly') return { from: d, to: addDays(d, 6) }
    return { from: d, to: d }
  }

  function fetchEvents(p, d, m) {
    const { from, to } = calcRange(p, d, m)
    apiFetch(`/api/clock/monitor/events?date_from=${from}&date_to=${to}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.events) setLiveEvents(data.events) })
      .catch(() => {})
  }

  // Initial load
  useEffect(() => {
    apiFetch('/api/clock/monitor/roster')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.roster) setLiveRoster(data.roster) })
      .catch(() => {})

    // Jump date/month to latest day with data so the page doesn't land empty.
    // Only nudges if today has no data — never overrides a user-picked date.
    apiFetch('/api/clock/monitor/latest-date')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const latest = data?.latestDate
        if (!latest) { fetchEvents(page, date, month); return }
        setLatestDataDate(latest)
        if (latest !== todayISO()) {
          setDate(latest)
          setMonth(latest.slice(0, 7))
        } else {
          fetchEvents(page, date, month)
        }
      })
      .catch(() => { fetchEvents(page, date, month) })
  }, [])

  // Re-fetch when view type / date / month changes (team & project are client-side filters)
  useEffect(() => { fetchEvents(page, date, month) }, [page, date, month])

  // Live DB data is the source of truth. Seed files are kept only for legacy health/reference panels.
  const allEvents = useMemo(() => {
    return liveEvents
  }, [liveEvents])

  const allRoster = useMemo(() => {
    return liveRoster
  }, [liveRoster])

  const projects = useMemo(() => [...new Set([
    ...allEvents.map(row => row.projectCode).filter(Boolean),
    ...allRoster.map(row => row.projectCode || row.team).filter(Boolean),
  ])].sort(), [allEvents, allRoster])

  const baseEvents = useMemo(() => allEvents.filter(row => filterByTeam(row, team)), [allEvents, team])
  const filteredEvents = useMemo(() => {
    const q = norm(query)
    return baseEvents.filter(row => {
      if (project && row.projectCode !== project) return false
      if (!q) return true
      return [row.name, row.email, row.job, row.projectCode, row.status].some(value => norm(value).includes(q))
    })
  }, [baseEvents, project, query])

  const dailyEvents = filteredEvents.filter(row => dateOnly(row.time) === date)
  const weeklyEvents = filteredEvents.filter(row => {
    const d = dateOnly(row.time)
    return d >= date && d <= addDays(date, 6)
  })
  const monthEvents = filteredEvents.filter(row => monthISO(row.time) === month)
  const activeEvents = page === 'weekly' ? weeklyEvents : page === 'monthly' ? monthEvents : dailyEvents
  const sessions = sessionsFromEvents(activeEvents)
  const latest = latestByEmail(activeEvents)
  const roster = allRoster.filter(row => filterByTeam(row, team)).filter(row => !project || row.projectCode === project || row.team === project)
  const people = roster.map(row => ({ ...row, latest: latest.get(norm(row.email) || norm(row.name)) })).filter(row => {
    const q = norm(query)
    return !q || [row.name, row.email, row.projectCode, row.position].some(value => norm(value).includes(q))
  })
  const started = people.filter(row => row.latest && isStart(row.latest.status)).length
  const completed = sessions.filter(row => row.end).length
  const missing = Math.max(people.length - started, 0)
  const personOptions = useMemo(() => {
    const map = new Map()
    allRoster.forEach(row => {
      const key = row.employeeCode || row.email
      if (key && !map.has(key)) map.set(key, row)
    })
    return [...map.values()].sort((a, b) => String(a.name).localeCompare(String(b.name)))
  }, [allRoster])
  // Use employeeCode as selector key — falls back to email for legacy
  const selectedEmail = personEmail || personOptions[0]?.employeeCode || personOptions[0]?.email || ''

  const navItem = NAV.find(n => n[0] === page)
  const navLabel = navItem ? navItem[1] : 'Clock Monitor'

  return (
    <div className="ace-clock-monitor-page min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="flex min-h-screen">
        <Sidebar page={page} setPage={setPage} user={authenticatedUser} />

        <main className="min-w-0 flex-1">
          {/* Sticky top header — HR style */}
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/86 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="hidden min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-400 md:flex">
                <Search size={16} />
                <input
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="Search name / email / job / project / status..."
                  className="w-full border-0 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    title="Clear search"
                    className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                  ><X size={14} /></button>
                )}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-[.74rem] font-extrabold text-blue-700">
                  <CalendarDays size={14} /> {todayISO()}
                </span>
                <button className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:bg-slate-50 sm:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-black text-white" style={{ background: ACE_BLUE }}>
                    {(authenticatedUser?.name || 'CM').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black text-slate-900">{authenticatedUser?.name || 'Clock Admin'}</div>
                    <div className="text-xs font-bold text-slate-400">{authenticatedUser?.positionName || 'Clock Monitor'}</div>
                  </div>
                </button>
                {onLogout && (
                  <button onClick={onLogout} className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-600 shadow-sm hover:bg-slate-50">
                    <LogOut size={14} /> Logout
                  </button>
                )}
              </div>
            </div>
          </header>

          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 flex flex-col gap-4">
            {/* Title section */}
            <section className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-[#2447d8]">
                  <Timer size={13} strokeWidth={2.5} /> ACE · Operations · Clock Monitor
                </div>
                <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-950 sm:text-4xl">{navLabel}</h1>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                  Daily attendance · Compliance entry · Work locations · Attendance tracker · Movement · Admin follow-up.
                </p>
                {latestDataDate && latestDataDate !== todayISO() && (
                  <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-amber-700">
                    <Info size={13} /> Today ({todayISO()}) has no clock data — showing latest: <span className="font-black">{latestDataDate}</span>
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setPage('health')} className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-600 shadow-sm hover:bg-slate-50">
                  <Stethoscope size={15} /> Health
                </button>
                <button
                  onClick={() => fetchEvents(page, date, month)}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white shadow-md transition hover:-translate-y-0.5 hover:bg-blue-700"
                ><RefreshCw size={15} /> Refresh</button>
              </div>
            </section>

            {page !== 'workLocations' && (
              <Controls
                page={page} team={team} setTeam={setTeam}
                date={date} setDate={setDate}
                month={month} setMonth={setMonth}
                project={project} setProject={setProject}
                projects={projects}
                onToday={() => {
                  const t = todayISO()
                  const mo = t.slice(0, 7)
                  setDate(t); setMonth(mo)
                }}
              />
            )}

            {['daily', 'weekly', 'todayExec', 'mapLive', 'admin', 'movement', 'dailyCheck'].includes(page) && (
              <MetricGrid
                metrics={[
                  ['Roster', people.length, 'People in filter'],
                  ['Started', started, 'Start only'],
                  ['Complete', completed, 'Start to end rows'],
                  ['Missing', missing, 'No start signal'],
                ]}
              />
            )}

            {(page === 'daily' || page === 'weekly') && (
              <DailyWeeklyPanel people={people} sessions={sessions} events={activeEvents} rangeLabel={page === 'weekly' ? `${date} to ${addDays(date, 6)}` : date} />
            )}

            {page === 'monthly' && (
              <MonthlyPanel month={month} people={people} events={monthEvents} sessions={sessions} selectedEmail={selectedEmail} setPersonEmail={setPersonEmail} personOptions={personOptions} />
            )}

            {page === 'individual' && (
              <IndividualPanel month={month} team={team} selectedEmail={selectedEmail} setPersonEmail={setPersonEmail} personOptions={personOptions} />
            )}

            {page === 'dailyCheck' && (
              <DailyCheckPanel team={team} date={date} />
            )}

            {page === 'manualEntry' && (
              <ManualEntryPanel team={team} date={date} personOptions={personOptions} authenticatedUser={authenticatedUser} />
            )}

            {page === 'workLocations' && (
              <WorkLocationsPanel team={team} authenticatedUser={authenticatedUser} />
            )}

            {page === 'executive' && (
              <ExecutivePanel month={month} team={team} />
            )}

            {page === 'todayExec' && (
              <TodayExecutivePanel team={team} date={date} />
            )}

            {page === 'mapLive' && (
              <MapLivePanel team={team} date={date} />
            )}

            {page === 'attendance' && (
              <AttendanceTrackerPanel month={month} team={team} />
            )}

            {page === 'movement' && (
              <MovementPanel date={date} team={team} />
            )}

            {page === 'admin' && (
              <AdminAttentionPanel team={team} date={date} />
            )}

            {page === 'health' && <HealthPanel />}
            {page === 'leave' && <LeaveAdminPanel />}
          </div>
        </main>
      </div>
    </div>
  )
}

const CM_INPUT_CLS = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200'

function CmField({ label, children }) {
  return (
    <div className="flex flex-col gap-1 min-w-[140px] flex-1">
      <label className="text-[.68rem] font-black uppercase tracking-wider text-slate-500">{label}</label>
      {children}
    </div>
  )
}

function Controls({ page, team, setTeam, date, setDate, month, setMonth, project, setProject, projects, onToday }) {
  const isMonthView = page === 'monthly' || page === 'individual' || page === 'executive' || page === 'attendance'
  const [departments, setDepartments] = useState([])

  useEffect(() => {
    apiFetch('/api/clock/monitor/departments')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.departments) setDepartments(d.departments) })
      .catch(() => {})
  }, [])

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        <CmField label="Department">
          <select className={CM_INPUT_CLS} value={team} onChange={event => setTeam(event.target.value)}>
            <option value="ALL">ALL</option>
            {departments.map(d => (
              <option key={d.value} value={d.value}>
                {d.label}{d.count ? ` (${d.count})` : ''}
              </option>
            ))}
          </select>
        </CmField>
        <CmField label={isMonthView ? 'Month' : 'Date'}>
          {isMonthView
            ? <input className={CM_INPUT_CLS} type="month" value={month} onChange={event => setMonth(event.target.value)} />
            : <input className={CM_INPUT_CLS} type="date"  value={date}  onChange={event => setDate(event.target.value)} />}
        </CmField>
        <CmField label="Project">
          <select className={CM_INPUT_CLS} value={project} onChange={event => setProject(event.target.value)}>
            <option value="">All Projects</option>
            {projects.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </CmField>
        <button onClick={onToday} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600 shadow-sm hover:bg-slate-50">
          <CalendarDays size={15} /> Today
        </button>
      </div>
    </section>
  )
}

function PersonDrilldownModal({ person, onClose, onOpenPhoto }) {
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!person) return
    const code = person.employeeCode || person.email
    if (!code) { setLoading(false); return }
    setLoading(true)
    // Fetch last 30 days of events for this employee
    const today = todayISO()
    const past = formatDateYmd(new Date(Date.now() - 30 * 86400000))
    apiFetch(`/api/clock/monitor/events?date_from=${past}&date_to=${today}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.events) { setHistory([]); return }
        // Filter for this person
        const mine = data.events.filter(e =>
          norm(e.employeeCode) === norm(person.employeeCode) ||
          norm(e.email) === norm(person.email)
        )
        const personSessions = sessionsFromEvents(mine)
        setHistory(personSessions)
      })
      .catch(() => setHistory([]))
      .finally(() => setLoading(false))
  }, [person?.employeeCode || person?.email])

  if (!person) return null

  const todayStr = todayISO()
  const todaySessions = (history || []).filter(s => s.date === todayStr)
  const last7Days = []
  for (let i = 6; i >= 0; i--) {
    const d = formatDateYmd(new Date(Date.now() - i * 86400000))
    const day = (history || []).filter(s => s.date === d)
    last7Days.push({ date: d, sessions: day.length, hasStart: day.some(s => s.start), hasEnd: day.some(s => s.end) })
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
         onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] w-full max-w-5xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-black">
              {(person.name || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-black text-base">{person.name}</div>
              <div className="text-xs opacity-85 mt-0.5">
                {person.projectCode || person.team || '—'} · {person.position || person.job || '—'} · {person.employeeCode || person.email}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 text-white font-black">✕</button>
        </div>
        <div className="overflow-y-auto p-5 space-y-4">
          {loading && <div className="text-center text-slate-400 font-bold py-8">Loading history…</div>}

          {!loading && history && (
            <>
              {/* Last 7 days strip */}
              <section>
                <div className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Last 7 Days</div>
                <div className="grid grid-cols-7 gap-2">
                  {last7Days.map(d => {
                    const isToday = d.date === todayStr
                    const status = d.hasStart && d.hasEnd ? 'complete' : d.hasStart ? 'incomplete' : 'absent'
                    const colorCls = status === 'complete' ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                                  : status === 'incomplete' ? 'bg-amber-100 border-amber-300 text-amber-700'
                                  : 'bg-slate-100 border-slate-200 text-slate-400'
                    return (
                      <div key={d.date} className={`rounded-lg border-2 p-2 text-center ${colorCls} ${isToday ? 'ring-2 ring-blue-400' : ''}`}>
                        <div className="text-[.6rem] font-bold opacity-70">{d.date.slice(5)}</div>
                        <div className="text-lg font-black mt-1">{d.sessions || '—'}</div>
                        <div className="text-[.6rem] font-bold mt-0.5">
                          {status === 'complete' ? '✓' : status === 'incomplete' ? '◐' : '—'}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex gap-3 mt-2 text-[.66rem] text-slate-500">
                  <span><span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1"></span>Complete</span>
                  <span><span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1"></span>Not clocked out</span>
                  <span><span className="inline-block w-2 h-2 rounded-full bg-slate-300 mr-1"></span>Absent</span>
                </div>
              </section>

              {/* Today's sessions */}
              <section>
                <div className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                  Today's Sessions {todaySessions.length > 0 && <span className="text-slate-400">({todaySessions.length})</span>}
                </div>
                {todaySessions.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-amber-700 font-bold">
                    ⚠ No sessions today
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todaySessions.map((s, i) => {
                      const lm = lateMinutes(s.start?.time)
                      const isLate = lm != null && lm > 0
                      const isForgotten = isForgottenClockOut(s)
                      const photoUrl = s.start?.photo1 || s.end?.photo1
                      return (
                        <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:border-blue-400 hover:shadow transition cursor-pointer" onClick={() => onOpenPhoto?.(s)}>
                          <PhotoThumb url={photoUrl} alt={s.name} onClick={() => onOpenPhoto?.(s)} />
                          <div className="flex-1 min-w-0">
                            <div className="font-black text-slate-900 text-sm">
                              {timeOnly(s.start?.time)} → {timeOnly(s.end?.time) || '—'}
                              {isLate && <span className="ml-2 rounded bg-amber-200 px-1.5 py-0.5 text-[.62rem] font-black text-amber-900">Late {lm}m</span>}
                              {isForgotten && <span className="ml-2 rounded bg-red-200 px-1.5 py-0.5 text-[.62rem] font-black text-red-900">Active {hoursSince(s.start?.time)}h</span>}
                            </div>
                            <div className="text-[.72rem] text-slate-500 mt-0.5">
                              {s.projectCode || '—'} · {s.job || '—'} · Duration: <code className="font-bold">{hms(s.duration) || 'In progress'}</code>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>

              {/* Recent history (past 30 days) */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Recent History (30 days) <span className="text-slate-400">({history.length} sessions)</span>
                  </div>
                  <ExportMenu
                    filename={`person-${person.employeeCode || person.email}-history`}
                    title={`${person.name} — Clock History`}
                    subtitle={`${person.projectCode || ''} · ${person.position || person.job || ''} · last 30 days`}
                    columns={EVENT_EXPORT_COLS}
                    rows={history.map(s => ({
                      date: s.date,
                      name: s.name,
                      email: s.email,
                      employee_code: s.start?.employeeCode || s.end?.employeeCode || person.employeeCode || '',
                      start: timeOnly(s.start?.time) || '',
                      end: timeOnly(s.end?.time) || '',
                      duration: hms(s.duration) || '',
                      project: s.projectCode || '',
                      job: s.job || '',
                      lat: s.start?.lat || '',
                      lng: s.start?.lng || '',
                      status: s.end?.status || s.start?.status || '',
                      late_min: (() => { const lm = lateMinutes(s.start?.time); return lm > 0 ? lm : '' })(),
                    }))}
                    signatures={[
                      { label: '(_________________)', line2: 'Director' },
                      { label: '(_________________)', line2: 'HR Manager' },
                    ]}
                  />
                </div>
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2 text-left text-[.7rem] font-black uppercase text-slate-600 w-12"></th>
                        <th className="px-3 py-2 text-left text-[.7rem] font-black uppercase text-slate-600">Date</th>
                        <th className="px-3 py-2 text-left text-[.7rem] font-black uppercase text-slate-600">In → Out</th>
                        <th className="px-3 py-2 text-left text-[.7rem] font-black uppercase text-slate-600">Duration</th>
                        <th className="px-3 py-2 text-left text-[.7rem] font-black uppercase text-slate-600">Project</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {history.slice(0, 30).map((s, i) => (
                        <tr key={i} className="hover:bg-slate-50 cursor-pointer" onClick={() => onOpenPhoto?.(s)}>
                          <td className="px-2 py-1.5 text-center" onClick={e => e.stopPropagation()}>
                            <PhotoThumb url={s.start?.photo1 || s.end?.photo1} alt={s.name} onClick={() => onOpenPhoto?.(s)} />
                          </td>
                          <td className="px-3 py-2 font-mono text-[.74rem] text-slate-700">{s.date}</td>
                          <td className="px-3 py-2 text-[.78rem] text-slate-700">{timeOnly(s.start?.time)} → {timeOnly(s.end?.time) || '—'}</td>
                          <td className="px-3 py-2 font-mono text-[.72rem] text-slate-500">{hms(s.duration) || '—'}</td>
                          <td className="px-3 py-2 text-[.76rem] text-slate-600">{s.projectCode || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function PhotoThumb({ url, alt = 'photo', onClick }) {
  if (!url) {
    return <div className="w-10 h-10 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-300 text-base">—</div>
  }
  return (
    <button
      onClick={onClick}
      className="w-10 h-10 rounded overflow-hidden border border-slate-200 hover:border-blue-400 hover:shadow transition focus:outline-none focus:ring-2 focus:ring-blue-300"
      title="Click to enlarge"
    >
      <img src={url} alt={alt} className="w-full h-full object-cover" loading="lazy" onError={e => { e.target.style.display = 'none' }} />
    </button>
  )
}

function PhotoViewerModal({ session, onClose }) {
  if (!session) return null
  const startUrl = session.start?.photo1
  const endUrl = session.end?.photo1
  const gpsIn = session.start?.lat && session.start?.lng ? `${session.start.lat}, ${session.start.lng}` : null
  const gpsOut = session.end?.lat && session.end?.lng ? `${session.end.lat}, ${session.end.lng}` : null

  return (
    <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
         onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] w-full max-w-4xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-2xl">
          <div>
            <div className="font-black text-base">📸 {session.name}</div>
            <div className="text-xs opacity-85 mt-0.5">
              {session.date} · {session.projectCode || session.job || '—'} · {session.email}
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 text-white font-black">✕</button>
        </div>
        <div className="overflow-y-auto p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Clock IN */}
            <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 overflow-hidden">
              <div className="px-3 py-2 bg-emerald-600 text-white flex items-center justify-between">
                <span className="font-black text-sm">▶ Clock IN</span>
                <span className="font-mono text-[.78rem]">{timeOnly(session.start?.time) || '—'}</span>
              </div>
              {startUrl ? (
                <a href={startUrl} target="_blank" rel="noreferrer">
                  <img src={startUrl} alt="clock in" className="w-full max-h-[400px] object-contain bg-slate-900" />
                </a>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400 font-bold">No photo</div>
              )}
              <div className="p-3 text-[.78rem] space-y-1">
                <div className="flex justify-between"><span className="text-slate-500">Time</span><code className="font-bold">{session.start?.time?.slice(0, 19).replace('T', ' ') || '—'}</code></div>
                <div className="flex justify-between"><span className="text-slate-500">Status</span><span className="font-bold">{session.start?.status || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">GPS</span>
                  {gpsIn
                    ? <a href={`https://www.google.com/maps?q=${gpsIn}`} target="_blank" rel="noreferrer" className="font-mono text-blue-600 hover:underline">{gpsIn}</a>
                    : <span className="text-slate-400">—</span>}
                </div>
              </div>
            </div>

            {/* Clock OUT */}
            <div className="rounded-xl border-2 border-red-200 bg-red-50/50 overflow-hidden">
              <div className="px-3 py-2 bg-red-600 text-white flex items-center justify-between">
                <span className="font-black text-sm">■ Clock OUT</span>
                <span className="font-mono text-[.78rem]">{timeOnly(session.end?.time) || '—'}</span>
              </div>
              {endUrl ? (
                <a href={endUrl} target="_blank" rel="noreferrer">
                  <img src={endUrl} alt="clock out" className="w-full max-h-[400px] object-contain bg-slate-900" />
                </a>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400 font-bold">
                  {session.end ? 'No photo' : 'Not clocked out yet'}
                </div>
              )}
              <div className="p-3 text-[.78rem] space-y-1">
                <div className="flex justify-between"><span className="text-slate-500">Time</span><code className="font-bold">{session.end?.time?.slice(0, 19).replace('T', ' ') || '—'}</code></div>
                <div className="flex justify-between"><span className="text-slate-500">Status</span><span className="font-bold">{session.end?.status || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">GPS</span>
                  {gpsOut
                    ? <a href={`https://www.google.com/maps?q=${gpsOut}`} target="_blank" rel="noreferrer" className="font-mono text-blue-600 hover:underline">{gpsOut}</a>
                    : <span className="text-slate-400">—</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Duration */}
          {session.duration != null && (
            <div className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-center">
              <span className="text-[.7rem] uppercase tracking-wider text-slate-500 mr-2">Total Duration</span>
              <span className="font-black text-2xl text-slate-900">{hms(session.duration)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CmCard({ title, badge, badgeStyle, subtitle, children, actions, className = '' }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden ${className}`}>
      {(title || badge || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <div className="min-w-0">
            {title && <div className="font-black text-slate-900 text-sm">{title}</div>}
            {subtitle && <div className="text-[.7rem] text-slate-500 mt-0.5">{subtitle}</div>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {badge && <span className={`rounded-full px-2.5 py-1 text-[.7rem] font-bold ${badgeStyle || 'bg-blue-50 text-blue-700'}`}>{badge}</span>}
            {actions}
          </div>
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  )
}

const EVENT_EXPORT_COLS = [
  { header: 'Date',     dataKey: 'date',          width: 12 },
  { header: 'Code',     dataKey: 'employee_code', width: 12 },
  { header: 'Name',     dataKey: 'name',          width: 24 },
  { header: 'Email',    dataKey: 'email',         width: 24 },
  { header: 'Start',    dataKey: 'start',         width: 10, align: 'center' },
  { header: 'End',      dataKey: 'end',           width: 10, align: 'center' },
  { header: 'Duration', dataKey: 'duration',      width: 12, align: 'center' },
  { header: 'Project',  dataKey: 'project',       width: 14 },
  { header: 'Job/Site', dataKey: 'job',           width: 16 },
  { header: 'Status',   dataKey: 'status',        width: 12 },
  { header: 'Late (m)', dataKey: 'late_min',      width: 10, align: 'center', color: row => row.late_min ? 'EA580C' : null },
  { header: 'Lat',      dataKey: 'lat',           width: 12 },
  { header: 'Lng',      dataKey: 'lng',           width: 12 },
]

function ExportMenu({ filename, title, subtitle, columns, rows, signatures = null }) {
  const [open, setOpen] = useState(false)

  function handleCsv() {
    const headers = columns.map(c => c.header)
    const escapeCsv = v => {
      if (v == null) return ''
      const s = String(v)
      if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
      return s
    }
    const lines = [
      headers.map(escapeCsv).join(','),
      ...rows.map(r => columns.map(c => escapeCsv(r[c.dataKey])).join(',')),
    ]
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${filename}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
    setOpen(false)
  }

  function handlePdf() {
    exportPdf({ title, subtitle, filename: `${filename}.pdf`, columns, rows, signatures, landscape: columns.length > 7 })
    setOpen(false)
  }

  function handleExcel() {
    exportExcel({ title, subtitle, filename: `${filename}.xlsx`, columns, rows })
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600 shadow-sm hover:bg-slate-50 transition"
      >
        📥 Export ▾
      </button>
      {open && (
        <>
          <button className="fixed inset-0 z-30 cursor-default" onClick={() => setOpen(false)} aria-label="close" />
          <div className="absolute right-0 top-full mt-1 z-40 w-44 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
            <button onClick={handleCsv} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
              <span>📄</span> CSV (.csv)
            </button>
            <button onClick={handleExcel} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100">
              <span>📊</span> Excel (styled)
            </button>
            <button onClick={handlePdf} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100">
              <span>📕</span> PDF {signatures && <span className="text-[.6rem] text-slate-400">(+sign)</span>}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function CmTable({ headers, children }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>{headers.map(h => (
            <th key={h.key || h.label} className={`px-3 py-2 text-${h.align || 'left'} text-[.7rem] font-black uppercase tracking-wider text-slate-600 ${h.width || ''}`}>
              {h.label}
            </th>
          ))}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  )
}

const LATE_HOUR = 8
const LATE_MIN = 30           // เริ่มงาน 08:30
const FORGOTTEN_HOURS = 12    // session active เกิน 12 ชม.

function lateMinutes(timeStr) {
  if (!timeStr) return null
  const m = String(timeStr).match(/T(\d{2}):(\d{2})/) || String(timeStr).match(/(\d{2}):(\d{2})/)
  if (!m) return null
  const total = Number(m[1]) * 60 + Number(m[2])
  const limit = LATE_HOUR * 60 + LATE_MIN
  return total - limit
}

function isForgottenClockOut(session) {
  if (!session.start || session.end) return false
  const startTime = session.start?.time
  if (!startTime) return false
  const startMs = new Date(startTime).getTime()
  const hoursAgo = (Date.now() - startMs) / 3600000
  return hoursAgo > FORGOTTEN_HOURS
}

function hoursSince(timeStr) {
  if (!timeStr) return 0
  return Math.round((Date.now() - new Date(timeStr).getTime()) / 3600000)
}

function DailyWeeklyPanel({ people, sessions, events, rangeLabel }) {
  const [photoSession, setPhotoSession] = useState(null)
  const [drilldownPerson, setDrilldownPerson] = useState(null)

  const startedPeople = people.filter(row => row.latest && isStart(row.latest.status))
  const notClockedIn = people.filter(row => !row.latest || !isStart(row.latest.status))
  const startEvents = events.filter(row => isStart(row.status))
  const startEventsWithGps = startEvents.filter(r =>
    r.lat != null && r.lng != null &&
    Number.isFinite(Number(r.lat)) && Number.isFinite(Number(r.lng)))
  const byProject = [...groupBy(people, row => row.projectCode || row.team || 'UNKNOWN').entries()].map(([label, rows]) => ({
    label,
    value: rows.filter(row => row.latest).length,
    total: rows.length,
  }))

  // Compute late / forgotten counts
  const lateSessions = sessions.filter(s => {
    const lm = lateMinutes(s.start?.time)
    return lm != null && lm > 0
  })
  const forgottenSessions = sessions.filter(isForgottenClockOut)

  return (
    <>
      {/* BIG MAP — full width, prominent */}
      <CmCard
        title="🗺 Live Location Map — Clocked-In Today"
        subtitle={`${startEventsWithGps.length} of ${startedPeople.length} people have GPS · Range: ${rangeLabel}`}
        badge={`${startedPeople.length} started · ${notClockedIn.length} missing`}
        badgeStyle={notClockedIn.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}
      >
        <PseudoMap events={startEvents} height={680} maxPoints={300} projectStats={byProject} />
      </CmCard>

      {/* 2-COL: Not Clocked In (warning) + Clocked In (success) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 mt-4">
        <CmCard
          title={`⚠ Not Clocked In Yet (${notClockedIn.length})`}
          subtitle="People without start signal today"
          badge={notClockedIn.length === 0 ? '✓ All in' : `${notClockedIn.length} pending`}
          badgeStyle={notClockedIn.length === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}
        >
          {notClockedIn.length === 0 ? (
            <div className="text-center text-emerald-600 font-bold py-8">🎉 Everyone has clocked in!</div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <CmTable headers={[
                { label: 'Name' }, { label: 'Project' }, { label: 'Job' },
              ]}>
                {notClockedIn.slice(0, 100).map(row => (
                  <tr key={`${row.email}-${row.name}`} className="hover:bg-amber-100/60 bg-amber-50/30 cursor-pointer" onClick={() => setDrilldownPerson(row)}>
                    <td className="px-3 py-2">
                      <div className="font-black text-slate-900 text-[.82rem] hover:text-blue-600">{row.name}</div>
                      <div className="text-[.66rem] font-mono text-slate-400">{row.email}</div>
                    </td>
                    <td className="px-3 py-2 text-[.78rem] text-slate-600">{row.projectCode || row.team || '—'}</td>
                    <td className="px-3 py-2 text-[.78rem] text-slate-600">{row.position || '—'}</td>
                  </tr>
                ))}
              </CmTable>
              {notClockedIn.length > 100 && (
                <div className="text-center text-[.7rem] text-slate-400 mt-2">… and {notClockedIn.length - 100} more</div>
              )}
            </div>
          )}
        </CmCard>

        <CmCard
          title={`✓ Clocked In (${startedPeople.length})`}
          subtitle="People who started work today"
          badge={`${startedPeople.length} active`}
          badgeStyle="bg-emerald-100 text-emerald-700"
        >
          <div className="max-h-96 overflow-y-auto">
            <CmTable headers={[
              { label: 'Name' }, { label: 'Start', align: 'center', width: 'w-20' },
              { label: 'Project' }, { label: 'Job' },
            ]}>
              {startedPeople.slice(0, 100).map(row => {
                const lm = lateMinutes(row.latest?.time)
                const isLate = lm != null && lm > 0
                return (
                  <tr key={`${row.email}-${row.name}`} className={`cursor-pointer ${isLate ? 'bg-amber-50/40 hover:bg-amber-100/40' : 'hover:bg-emerald-50/40'}`} onClick={() => setDrilldownPerson(row)}>
                    <td className="px-3 py-2">
                      <div className="font-black text-slate-900 text-[.82rem] hover:text-blue-600">{row.name}</div>
                      <div className="text-[.66rem] font-mono text-slate-400">{row.email}</div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="font-mono text-[.75rem] font-black text-emerald-700">{timeOnly(row.latest?.time) || '—'}</div>
                      {isLate && <div className="text-[.6rem] font-black text-amber-700 mt-0.5">Late {lm}m</div>}
                    </td>
                    <td className="px-3 py-2 text-[.78rem] text-slate-600">{row.latest?.projectCode || row.projectCode || row.team}</td>
                    <td className="px-3 py-2 text-[.78rem] text-slate-600">{row.latest?.job || row.position || '—'}</td>
                  </tr>
                )
              })}
            </CmTable>
          </div>
        </CmCard>
      </div>

      {/* Late/Forgotten alert banner */}
      {(lateSessions.length > 0 || forgottenSessions.length > 0) && (
        <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {lateSessions.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
              <div className="text-2xl">⏰</div>
              <div className="flex-1">
                <div className="font-black text-amber-900">{lateSessions.length} Late Today</div>
                <div className="text-[.72rem] text-amber-700 font-bold">Clock in after {String(LATE_HOUR).padStart(2,'0')}:{String(LATE_MIN).padStart(2,'0')}</div>
              </div>
            </div>
          )}
          {forgottenSessions.length > 0 && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
              <div className="text-2xl">🚨</div>
              <div className="flex-1">
                <div className="font-black text-red-900">{forgottenSessions.length} Forgotten Clock-out</div>
                <div className="text-[.72rem] text-red-700 font-bold">Active session &gt; {FORGOTTEN_HOURS}h ago</div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Events Table (Start → End) */}
      <CmCard
        title="📋 Events"
        subtitle={`Start → End · Total: ${sessions.length} · Click 📷 to view photos`}
        className="mt-4"
        actions={<ExportMenu
          filename={`ace-clock-events-${rangeLabel}`}
          title={`ACE Clock Events`}
          subtitle={`Range: ${rangeLabel} · ${sessions.length} sessions`}
          columns={EVENT_EXPORT_COLS}
          rows={sessions.map(s => ({
            date: s.date,
            name: s.name,
            email: s.email,
            employee_code: s.start?.employeeCode || s.end?.employeeCode || '',
            start: timeOnly(s.start?.time) || '',
            end: timeOnly(s.end?.time) || '',
            duration: hms(s.duration) || '',
            project: s.projectCode || '',
            job: s.job || '',
            lat: s.start?.lat || '',
            lng: s.start?.lng || '',
            status: s.end?.status || (s.start?.status || ''),
            late_min: (() => { const lm = lateMinutes(s.start?.time); return lm > 0 ? lm : '' })(),
          }))}
        />}
      >
        <CmTable headers={[
          { label: '📷', align: 'center', width: 'w-12' },
          { label: 'Date', width: 'w-24' }, { label: 'Name' },
          { label: 'Status (Start → End)' }, { label: 'Job' },
          { label: 'Project' }, { label: 'Location' },
        ]}>
          {sessions.slice(0, 150).map(row => {
            const lm = lateMinutes(row.start?.time)
            const isLate = lm != null && lm > 0
            const isForgotten = isForgottenClockOut(row)
            const rowBg = isForgotten ? 'bg-red-50/50 hover:bg-red-100/40' : isLate ? 'bg-amber-50/40 hover:bg-amber-100/30' : 'hover:bg-slate-50/60'
            const photoUrl = row.start?.photo1 || row.end?.photo1
            return (
              <tr key={`${row.date}-${row.email}-${row.name}`} className={`${rowBg} cursor-pointer`} onClick={() => setPhotoSession(row)}>
                <td className="px-2 py-1.5 text-center" onClick={e => e.stopPropagation()}>
                  <PhotoThumb url={photoUrl} alt={row.name} onClick={() => setPhotoSession(row)} />
                </td>
                <td className="px-3 py-2 font-mono text-[.74rem] text-slate-700">{row.date}</td>
                <td className="px-3 py-2">
                  <div className="font-black text-slate-900 text-[.82rem]">{row.name}</div>
                  <div className="text-[.66rem] font-mono text-slate-400">{row.email}</div>
                </td>
                <td className="px-3 py-2 text-[.78rem] text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <span>{timeOnly(row.start?.time)} → {timeOnly(row.end?.time) || '—'}</span>
                    {isLate && <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[.62rem] font-black text-amber-900">Late {lm}m</span>}
                    {isForgotten && <span className="rounded bg-red-200 px-1.5 py-0.5 text-[.62rem] font-black text-red-900">Active {hoursSince(row.start?.time)}h ago</span>}
                  </div>
                  <div className="text-[.66rem] font-mono text-slate-400">{hms(row.duration)}</div>
                </td>
                <td className="px-3 py-2 text-[.78rem] text-slate-600">{row.job || '—'}</td>
                <td className="px-3 py-2 text-[.78rem] text-slate-600">{row.projectCode}</td>
                <td className="px-3 py-2 font-mono text-[.7rem] text-slate-500">
                  {row.start?.lat && row.start?.lng
                    ? <a href={`https://www.google.com/maps?q=${row.start.lat},${row.start.lng}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="hover:text-blue-600 hover:underline">{Number(row.start.lat).toFixed(4)}, {Number(row.start.lng).toFixed(4)}</a>
                    : '—'}
                </td>
              </tr>
            )
          })}
        </CmTable>
      </CmCard>

      {photoSession && <PhotoViewerModal session={photoSession} onClose={() => setPhotoSession(null)} />}
      {drilldownPerson && (
        <PersonDrilldownModal
          person={drilldownPerson}
          onClose={() => setDrilldownPerson(null)}
          onOpenPhoto={(s) => setPhotoSession(s)}
        />
      )}
    </>
  )
}

function MonthlyPanel({ month, people, events, sessions, selectedEmail, setPersonEmail, personOptions }) {
  const selected = personOptions.find(row => (row.employeeCode || row.email) === selectedEmail)
  const personSessions = sessions.filter(row => norm(row.email) === norm(selected?.email || selectedEmail) || norm(row.employeeCode) === norm(selectedEmail))
  const points = events.filter(row => (norm(row.email) === norm(selected?.email || selectedEmail) || norm(row.employeeCode) === norm(selectedEmail)) && isStart(row.status))
  return (
    <>
      <CmCard title="🗂 Monthly Monitor (Person only)" subtitle="Pick a month and person. Summary uses full month data.">
        <select className={CM_INPUT_CLS + ' max-w-md'} value={selectedEmail} onChange={event => setPersonEmail(event.target.value)}>
          {personOptions.map(row => <option key={row.employeeCode || row.email} value={row.employeeCode || row.email}>{(row.projectCode || row.project || '') + ' — ' + row.name}</option>)}
        </select>
      </CmCard>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 mt-4">
        <CmCard title="📊 Monthly Summary" badge={month}>
          <MetricGrid compact metrics={[
            ['Person', selected?.name || '—', 'Selected'],
            ['Clock Days', personSessions.length, 'Rows'],
            ['Start Points', points.length, 'Map points'],
            ['Avg Total', avgDuration(personSessions), 'HH:MM'],
          ]} />
          <div className="mt-4"><MiniTimeline sessions={personSessions} /></div>
        </CmCard>
        <CmCard title="📍 Monthly Map" subtitle="Points = Start only">
          <PseudoMap events={points.slice(0, 100)} />
        </CmCard>
      </div>
      <CmCard title="📋 Monthly Events" subtitle={`${personSessions.length} rows · Start + End merged`} className="mt-4">
        <SessionTable rows={personSessions.slice(0, 120)} />
      </CmCard>
    </>
  )
}

function IndividualPanel({ month, team, selectedEmail, setPersonEmail, personOptions }) {
  const [personDays, setPersonDays] = useState([])
  const [timeSummary, setTimeSummary] = useState(null)
  const [personSummary, setPersonSummary] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedEmail) return
    setLoading(true)
    Promise.all([
      apiFetch(`/api/clock/monitor/person-compliance?month=${month}&employee_code=${selectedEmail}`).then(r => r.ok ? r.json() : null),
      apiFetch(`/api/clock/monitor/time-summary?month=${month}&team=${team}`).then(r => r.ok ? r.json() : null),
      apiFetch(`/api/clock/monitor/person-summary?month=${month}&team=${team}`).then(r => r.ok ? r.json() : null),
    ]).then(([pc, ts, ps]) => {
      if (pc?.days) setPersonDays(pc.days)
      if (ts) setTimeSummary(ts)
      if (ps?.rows) setPersonSummary(ps.rows)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [selectedEmail, month, team])

  const dayRows = personDays.filter(d => d.send !== null)
  const avgSend  = dayRows.length ? dayRows.reduce((s, d) => s + (d.send  || 0), 0) / dayRows.length : 0
  const avgLoc   = dayRows.length ? dayRows.reduce((s, d) => s + (d.loc   || 0), 0) / dayRows.length : 0
  const avgClock = dayRows.length ? dayRows.reduce((s, d) => s + (d.clock || 0), 0) / dayRows.length : 0

  return (
    <>
      <CmCard title="👤 Individual Summary (Monthly)" subtitle="Send to Line / Location Work / Status Clock per day with cumulative score">
        <select className={CM_INPUT_CLS + ' max-w-md mb-4'} value={selectedEmail} onChange={event => setPersonEmail(event.target.value)}>
          {personOptions.map(row => <option key={row.employeeCode || row.email} value={row.employeeCode || row.email}>{(row.projectCode || row.project || '') + ' — ' + row.name}</option>)}
        </select>
        {loading ? <div className="text-center text-slate-400 font-bold py-8">Loading…</div> : <PersonDaysChart days={personDays} />}
        <div className="mt-4">
          <MetricGrid compact metrics={[
            ['Work Days', dayRows.length, 'Days with data'],
            ['Avg Location', `${Math.round(avgLoc * 100)}%`, 'GPS captured'],
            ['Avg Clock', `${Math.round(avgClock * 100)}%`, 'Has clock-out'],
            ['Score', `${Math.round((avgSend + avgLoc + avgClock) / 3 * 100)}%`, 'Combined avg'],
          ]} />
        </div>
      </CmCard>

      {timeSummary && (
        <CmCard title="⏱ Monthly Time Summary" subtitle={`StartWork / StopWork / TotalTime rankings · ${month}`} className="mt-4">
          <TimeSummaryTables data={timeSummary} />
        </CmCard>
      )}

      <CmCard title="📊 Monthly Person Summary" subtitle={`${personSummary.length} people · ${month}`} className="mt-4">
        <LivePersonSummaryTable rows={personSummary} />
      </CmCard>
    </>
  )
}

function ExecutivePanel({ month, team }) {
  const [compliance, setCompliance] = useState(null)
  const [headcountData, setHeadcountData] = useState([])
  const [personSummary, setPersonSummary] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      apiFetch(`/api/clock/monitor/compliance?month=${month}&team=${team}`).then(r => r.ok ? r.json() : null),
      apiFetch(`/api/clock/monitor/headcount?months=12`).then(r => r.ok ? r.json() : null),
      apiFetch(`/api/clock/monitor/person-summary?month=${month}&team=${team}`).then(r => r.ok ? r.json() : null),
    ]).then(([c, h, ps]) => {
      if (c) setCompliance(c)
      if (h?.months) setHeadcountData(h.months)
      if (ps?.rows) setPersonSummary(ps.rows)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [month, team])

  const avg = compliance?.avg || {}
  const rows = (compliance?.rows || []).filter(r => r.headcount > 0)

  return (
    <>
      <CmCard title="📊 Executive Dashboard" subtitle="Headcount and Monthly Compliance — computed from clock sessions" badge={`Month: ${month}`}>
        {loading ? <div className="text-center text-slate-400 font-bold py-8">Loading…</div> : (
          <MetricGrid metrics={[
            ['Avg Score',    `${avg.scorePct ?? '—'}%`,  'Monthly compliance'],
            ['Send / Clock', `${avg.sendPct  ?? '—'}%`,  'Clocked-in %'],
            ['Location',     `${avg.locPct   ?? '—'}%`,  'GPS captured %'],
            ['Clock-out',    `${avg.clockPct ?? '—'}%`,  'Completed sessions'],
          ]} />
        )}
      </CmCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 mt-4">
        <CmCard title={`📈 Daily Compliance % — ${month}`} subtitle="Location / Clock-out / Score by day">
          <DailyComplianceChart rows={rows} />
        </CmCard>
        <CmCard title="📊 Headcount by Month" subtitle="RF / TE / DTE / NPM active starters">
          <HeadcountChart rows={headcountData.slice(-10)} />
          <div className="mt-3"><HeadcountTable rows={headcountData.slice(-10)} /></div>
        </CmCard>
      </div>

      <CmCard
        title="👥 Monthly Person Summary"
        subtitle={`${personSummary.length} people · ${month}`}
        className="mt-4"
        actions={<ExportMenu
          filename={`ace-person-summary-${month}-${team}`}
          title={`Monthly Person Summary — ${month}`}
          subtitle={`Team: ${team} · ${personSummary.length} people`}
          columns={PERSON_SUMMARY_COLS}
          rows={personSummary}
          signatures={[
            { label: '(_________________)', line2: 'Director' },
            { label: '(_________________)', line2: 'HR Manager' },
          ]}
        />}
      >
        <LivePersonSummaryTable rows={personSummary} />
      </CmCard>
    </>
  )
}

const PERSON_SUMMARY_COLS = [
  { header: 'Code',     dataKey: 'employeeCode', width: 12 },
  { header: 'Name',     dataKey: 'name',         width: 24 },
  { header: 'Project',  dataKey: 'projectCode',  width: 14 },
  { header: 'Role',     dataKey: 'role',         width: 12 },
  { header: 'Days',     dataKey: 'workDays',     width: 8, align: 'center' },
  { header: 'Loc %',    dataKey: 'locPct',       width: 10, align: 'center', color: row => colorForPct(row.locPct) },
  { header: 'Clock %',  dataKey: 'clockPct',     width: 10, align: 'center', color: row => colorForPct(row.clockPct) },
  { header: 'Score %',  dataKey: 'scorePct',     width: 10, align: 'center', color: row => colorForPct(row.scorePct) },
  { header: 'Total Time', dataKey: 'totalTime',  width: 12, align: 'center' },
]

function DailyCheckPanel({ team, date }) {
  const [people, setPeople] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(false)
  const [lastSync, setLastSync] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // ALL | PASS | FAIL_ANY
  const [photoTarget, setPhotoTarget] = useState(null)

  function load() {
    setLoading(true)
    const qs = `team=${team}${date ? `&date_iso=${date}` : ''}`
    apiFetch(`/api/clock/monitor/today-map?${qs}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) { setPeople(d.people || []); setMeta(d.meta || null) }
        setLastSync(new Date().toLocaleTimeString('th-TH'))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [team, date])

  // Derive 3 checks per person
  const rows = useMemo(() => people.map(p => {
    const sendOk = !!(p.photoIn && p.photoIn.length > 0)
    const locOk = p.status === 'on_site'
    const locPartial = p.status === 'no_site' || p.status === 'no_gps' // not "wrong" — just unverifiable
    const clockOk = !!p.clockOutISO
    const passAll = sendOk && locOk && clockOk
    return { ...p, sendOk, locOk, locPartial, clockOk, passAll }
  }), [people])

  const filtered = useMemo(() => {
    if (statusFilter === 'PASS') return rows.filter(r => r.passAll)
    if (statusFilter === 'FAIL_ANY') return rows.filter(r => !r.passAll)
    return rows
  }, [rows, statusFilter])

  const counts = useMemo(() => ({
    total: rows.length,
    sendOk: rows.filter(r => r.sendOk).length,
    locOk: rows.filter(r => r.locOk).length,
    clockOk: rows.filter(r => r.clockOk).length,
    passAll: rows.filter(r => r.passAll).length,
  }), [rows])
  const pct = n => rows.length ? Math.round(n / rows.length * 100) : 0

  return (
    <>
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 flex-wrap gap-3">
          <div>
            <div className="font-black text-slate-900 text-sm inline-flex items-center gap-2">
              <ClipboardCheck size={16} className="text-blue-600" /> Daily Compliance Check — {meta?.dateISO || date}
            </div>
            <div className="text-[.7rem] text-slate-500 mt-0.5">
              Per-person daily check: Send to Line (photo) · Location Work (geofence) · Status Clock (complete) · Sync: {lastSync || '—'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="ALL">All ({counts.total})</option>
              <option value="PASS">✓ Pass all ({counts.passAll})</option>
              <option value="FAIL_ANY">✗ Any fail ({counts.total - counts.passAll})</option>
            </select>
            <button onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-60">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </div>
        <div className="p-5">
          <MetricGrid metrics={[
            ['People Started', counts.total, meta?.team ? `Team: ${meta.team}` : ''],
            ['Send to Line', `${counts.sendOk} (${pct(counts.sendOk)}%)`, 'Photo uploaded'],
            ['Location Work', `${counts.locOk} (${pct(counts.locOk)}%)`, 'GPS within site'],
            ['Status Clock', `${counts.clockOk} (${pct(counts.clockOk)}%)`, 'Clock-out complete'],
          ]} />
        </div>
      </section>

      <CmCard
        title="People — Daily Checks"
        badge={`${filtered.length} / ${rows.length}`}
        className="mt-4"
      >
        {loading ? (
          <div className="text-center text-slate-400 font-bold py-8">Loading…</div>
        ) : !filtered.length ? (
          <div className="text-center text-slate-400 font-bold py-8">
            {rows.length === 0 ? 'No one clocked in on this date.' : 'No people match this filter.'}
          </div>
        ) : (
          <CmTable headers={[
            { label: '#', width: 'w-10', align: 'center' },
            { label: 'Name / Code' },
            { label: 'Project' },
            { label: 'Site' },
            { label: 'Send to Line', align: 'center', width: 'w-28' },
            { label: 'Location Work', align: 'center', width: 'w-36' },
            { label: 'Status Clock', align: 'center', width: 'w-28' },
            { label: 'Overall', align: 'center', width: 'w-20' },
          ]}>
            {filtered.map((r, i) => (
              <tr key={r.employeeCode} className="hover:bg-slate-50/60">
                <td className="px-3 py-2 text-center text-[.72rem] text-slate-500">{i + 1}</td>
                <td className="px-3 py-2">
                  <div className="font-black text-slate-900 text-[.82rem]">{r.name}</div>
                  <div className="text-[.66rem] font-mono text-slate-400">{r.employeeCode}</div>
                </td>
                <td className="px-3 py-2 text-[.74rem] text-slate-600">{r.projectCode || '—'}</td>
                <td className="px-3 py-2 text-[.74rem] text-slate-600">{r.siteName || r.siteCode || '—'}</td>
                <td className="px-3 py-2 text-center">
                  <CheckBadge ok={r.sendOk} label={r.sendOk ? 'Photo' : 'No photo'} />
                  {r.sendOk && r.photoIn && (
                    <button onClick={() => setPhotoTarget({ url: r.photoIn, name: r.name })} className="ml-1 text-[.68rem] font-bold text-blue-600 hover:underline">view</button>
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  <LocationBadge status={r.status} distanceM={r.distanceM} />
                </td>
                <td className="px-3 py-2 text-center">
                  <CheckBadge ok={r.clockOk} label={r.clockOk ? 'Complete' : 'No clock-out'} />
                </td>
                <td className="px-3 py-2 text-center">
                  {r.passAll
                    ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[.7rem] font-black text-emerald-700"><CircleCheck size={12} /> PASS</span>
                    : <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[.7rem] font-black text-red-700"><X size={12} /> FAIL</span>}
                </td>
              </tr>
            ))}
          </CmTable>
        )}
      </CmCard>

      {photoTarget && (
        <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={e => e.target === e.currentTarget && setPhotoTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-black text-slate-900 text-sm">{photoTarget.name}</div>
              <button onClick={() => setPhotoTarget(null)} className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"><X size={16} /></button>
            </div>
            <img src={photoTarget.url} alt={photoTarget.name} className="w-full rounded-xl object-contain max-h-[70vh] bg-slate-100" />
          </div>
        </div>
      )}
    </>
  )
}

function CheckBadge({ ok, label }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[.7rem] font-black text-emerald-700">
      <CircleCheck size={12} /> {label}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[.7rem] font-black text-red-700">
      <X size={12} /> {label}
    </span>
  )
}

function LocationBadge({ status, distanceM }) {
  const distLabel = (distanceM != null) ? ` · ${Math.round(distanceM)} m` : ''
  if (status === 'on_site') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[.7rem] font-black text-emerald-700"><MapPin size={12} /> On-site{distLabel}</span>
  }
  if (status === 'off_site') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[.7rem] font-black text-red-700"><MapPin size={12} /> Off-site{distLabel}</span>
  }
  if (status === 'no_site') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[.7rem] font-black text-slate-600"><Circle size={12} /> No site link</span>
  }
  return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[.7rem] font-black text-slate-500"><X size={12} /> No GPS</span>
}

function ManualEntryPanel({ team, date, personOptions, authenticatedUser }) {
  const isAdmin = ADMIN_ROLES.has(authenticatedUser?.role)
  const [workDate, setWorkDate] = useState(date || todayISO())
  const [entriesByCode, setEntriesByCode] = useState({}) // employeeCode -> manual entry
  const [autoByCode, setAutoByCode] = useState({})       // employeeCode -> { timeISO, clockOutISO, status }
  const [listLoading, setListLoading] = useState(false)
  const [rowState, setRowState] = useState({}) // employeeCode -> 'saving'|'saved'|'error'
  const [filter, setFilter] = useState('')
  const [onlyMarked, setOnlyMarked] = useState(false)
  const [bulkBusy, setBulkBusy] = useState(false)

  useEffect(() => { if (date) setWorkDate(date) }, [date])

  async function loadEntries() {
    if (!workDate) return
    setListLoading(true)
    try {
      const [manualRes, autoRes] = await Promise.all([
        apiFetch(`/api/clock/monitor/manual-check?date_iso=${workDate}`),
        apiFetch(`/api/clock/monitor/today-map?team=ALL&date_iso=${workDate}`),
      ])
      const manualData = manualRes.ok ? await manualRes.json() : null
      const autoData = autoRes.ok ? await autoRes.json() : null
      const manualMap = {}
      for (const e of (manualData?.entries || [])) manualMap[e.employeeCode] = e
      const autoMap = {}
      for (const p of (autoData?.people || [])) {
        autoMap[p.employeeCode] = {
          timeISO: p.timeISO,
          clockOutISO: p.clockOutISO,
          status: p.status,
          distanceM: p.distanceM,
          locationSource: p.locationSource,
          locationName: p.locationName || p.siteName || p.siteCode,
          hasPhotoIn: !!(p.photoIn && String(p.photoIn).length > 0),
          sharedToLine: !!p.sharedToLine,
          sharedAtISO: p.sharedAtISO || null,
        }
      }
      setEntriesByCode(manualMap)
      setAutoByCode(autoMap)
    } catch (_) { /* no-op */ }
    setListLoading(false)
  }
  useEffect(() => { loadEntries() }, [workDate])

  // Auto-derived "Status Clock" — true only when real clock-in + clock-out both exist
  function autoClockComplete(code) {
    const a = autoByCode[code]
    return !!(a && a.timeISO && a.clockOutISO)
  }
  function autoClockState(code) {
    const a = autoByCode[code]
    if (!a || !a.timeISO) return 'none'
    if (a.clockOutISO) return 'complete'
    return 'partial'
  }
  // Auto-derived "Location Work" — GPS within site/office geofence at clock-in
  function autoLocationOk(code) {
    const a = autoByCode[code]
    return a?.status === 'on_site'
  }
  function autoLocationState(code) {
    const a = autoByCode[code]
    if (!a) return 'none'
    return a.status // on_site | off_site | no_site | no_gps
  }
  // Auto signal for "Send to Line" — employee tapped Share on the clock summary (intent to send).
  // (Clock-in photo is a weaker secondary hint shown in the cell, not the pre-tick driver.)
  function autoShared(code) {
    return !!autoByCode[code]?.sharedToLine
  }

  function getRow(code) {
    const m = entriesByCode[code]
    if (m) return m
    // Defaults: Status Clock + Location Work auto-fill (read-only); Send pre-fills from
    // the Share tap but stays editable (hybrid).
    return { sendToLine: autoShared(code), locationWork: autoLocationOk(code), statusClock: autoClockComplete(code), notes: '' }
  }

  // Filter roster by team prop + search filter
  const visiblePeople = useMemo(() => {
    const q = filter.trim().toLowerCase()
    return personOptions.filter(p => {
      if (team && team !== 'ALL' && (p.team || p.projectCode) && p.team !== team && p.projectCode !== team) {
        // team prop is loose — keep all if not matching to avoid hiding everyone when team is a project
      }
      if (onlyMarked && !entriesByCode[p.employeeCode]) return false
      if (!q) return true
      return [p.name, p.employeeCode, p.email, p.projectCode, p.team]
        .some(v => String(v || '').toLowerCase().includes(q))
    })
  }, [personOptions, filter, onlyMarked, entriesByCode, team])

  async function persist(code, patch) {
    const current = getRow(code)
    const next = { ...current, ...patch }
    // Status Clock + Location Work are ALWAYS derived from real clock data, never user-edited
    const derivedStatusClock = autoClockComplete(code)
    const derivedLocationWork = autoLocationOk(code)
    // optimistic update — mark saving
    setRowState(s => ({ ...s, [code]: 'saving' }))
    setEntriesByCode(m => ({ ...m, [code]: { ...current, ...patch, statusClock: derivedStatusClock, locationWork: derivedLocationWork } }))
    try {
      const res = await apiFetch('/api/clock/monitor/manual-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_code: code,
          work_date: workDate,
          send_to_line: !!next.sendToLine,
          location_work: derivedLocationWork,
          status_clock: derivedStatusClock,
          notes: next.notes || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.entry) {
        setEntriesByCode(m => ({ ...m, [code]: data.entry }))
        setRowState(s => ({ ...s, [code]: 'saved' }))
        setTimeout(() => setRowState(s => ({ ...s, [code]: undefined })), 1200)
      } else {
        setRowState(s => ({ ...s, [code]: 'error' }))
      }
    } catch (_) {
      setRowState(s => ({ ...s, [code]: 'error' }))
    }
  }

  async function bulkSetAll(field, value) {
    // Only "Send to Line" is bulk-editable; Location & Clock are auto-derived.
    if (field !== 'send') return
    if (!confirm(`${value ? 'Check' : 'Uncheck'} "Send to Line" for ${visiblePeople.length} people?`)) return
    setBulkBusy(true)
    for (const p of visiblePeople) {
      const code = p.employeeCode || p.email
      if (!code) continue
      const current = getRow(code)
      if (current.sendToLine === value) continue
      await persist(code, { sendToLine: value })
    }
    setBulkBusy(false)
  }

  // Counts — Send is "effective" (admin's saved choice, else auto photo signal);
  // Location & Clock auto from real data across the roster.
  const counts = useMemo(() => {
    const list = Object.values(entriesByCode)
    let sendCount = 0
    let autoClockCount = 0
    let autoLocCount = 0
    for (const p of personOptions) {
      const code = p.employeeCode || p.email
      const a = autoByCode[code]
      if (a?.timeISO && a?.clockOutISO) autoClockCount++
      if (a?.status === 'on_site') autoLocCount++
      const saved = entriesByCode[code]
      const effectiveSend = saved ? saved.sendToLine : !!a?.sharedToLine
      if (effectiveSend) sendCount++
    }
    return {
      total: list.length,
      send: sendCount,
      loc: autoLocCount,
      clock: autoClockCount,
    }
  }, [entriesByCode, autoByCode, personOptions])

  if (!isAdmin) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
        <Lock size={32} className="mx-auto text-amber-600" />
        <div className="mt-3 text-sm font-black text-amber-800">Admin access required</div>
        <div className="mt-1 text-xs font-bold text-amber-700">
          Your role <code className="rounded bg-amber-100 px-1.5 py-0.5">{authenticatedUser?.role || 'EMPLOYEE'}</code> cannot edit manual compliance entries.
          Allowed: SUPER_ADMIN, SYSTEM_ADMIN, HR_ADMIN, PROJECT_ADMIN.
        </div>
      </section>
    )
  }

  return (
    <>
      {/* HEADER */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <div>
            <div className="font-black text-slate-900 text-sm inline-flex items-center gap-2">
              <ClipboardPen size={16} className="text-blue-600" /> Manual Entry — Daily Compliance
            </div>
            <div className="text-[.7rem] text-slate-500 mt-0.5">
              Send to Line auto-fills when employee tapped Share (editable) · Location & Status auto from GPS/clock · auto-saves · {counts.total} reviewed
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700"
              value={workDate}
              onChange={e => setWorkDate(e.target.value)}
            />
            <button onClick={loadEntries} disabled={listLoading} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-60">
              <RefreshCw size={13} className={listLoading ? 'animate-spin' : ''} /> {listLoading ? 'Loading…' : 'Reload'}
            </button>
          </div>
        </div>

        {/* SUMMARY METRICS */}
        <div className="p-5">
          <MetricGrid metrics={[
            ['People in List', visiblePeople.length, `${personOptions.length} total`],
            ['Send to Line', counts.send, `${personOptions.length ? Math.round(counts.send/personOptions.length*100) : 0}% · share tap + override`],
            ['Location Work (auto)', counts.loc, `${personOptions.length ? Math.round(counts.loc/personOptions.length*100) : 0}% on-site · from GPS`],
            ['Status Clock (auto)', counts.clock, `${personOptions.length ? Math.round(counts.clock/personOptions.length*100) : 0}% complete · from clock data`],
          ]} />
        </div>
      </section>

      {/* TOOLBAR */}
      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
            <Search size={14} className="text-slate-400" />
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Search name / code / project"
              className="w-full border-0 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
            />
            {filter && <button onClick={() => setFilter('')} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>}
          </div>
          <label className="inline-flex items-center gap-1.5 text-xs font-black text-slate-600 cursor-pointer">
            <input type="checkbox" checked={onlyMarked} onChange={e => setOnlyMarked(e.target.checked)} className="h-4 w-4 accent-blue-600" />
            Only show marked ({counts.total})
          </label>
          <div className="ml-auto flex items-center gap-1 text-[.7rem] font-bold text-slate-500">
            <span>Bulk Send to Line:</span>
            <button disabled={bulkBusy} onClick={() => bulkSetAll('send', true)} className="rounded-md border border-slate-200 bg-white px-2 py-1 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50">All ✓</button>
            <button disabled={bulkBusy} onClick={() => bulkSetAll('send', false)} className="rounded-md border border-slate-200 bg-white px-2 py-1 hover:bg-red-50 hover:text-red-700 disabled:opacity-50">Clear</button>
          </div>
        </div>
      </section>

      {/* LIST */}
      <CmCard
        title="Roster — Send to Line pre-filled from Share tap (editable) · Location & Clock auto"
        subtitle={`Date: ${workDate} · Send pre-ticks when the employee tapped Share — uncheck to override · Location/Clock from GPS + clock data · auto-save`}
        badge={`${visiblePeople.length} / ${personOptions.length}`}
        className="mt-4"
      >
        {!visiblePeople.length ? (
          <div className="text-center text-slate-400 font-bold py-8">
            {personOptions.length === 0 ? 'No people in roster.' : 'No people match this filter.'}
          </div>
        ) : (
          <CmTable headers={[
            { label: '#', width: 'w-10', align: 'center' },
            { label: 'Name / Code' },
            { label: 'Project', width: 'w-24' },
            { label: 'Send to Line', align: 'center', width: 'w-28' },
            { label: 'Location Work (auto)', align: 'center', width: 'w-40' },
            { label: 'Status Clock (auto)', align: 'center', width: 'w-36' },
            { label: 'Notes' },
            { label: '', align: 'center', width: 'w-16' },
          ]}>
            {visiblePeople.map((p, i) => {
              const code = p.employeeCode || p.email
              const row = getRow(code)
              const state = rowState[code]
              const auto = autoByCode[code]
              const clockState = autoClockState(code)
              const locState = autoLocationState(code)
              const hasAnyMark = row.sendToLine || locState === 'on_site' || clockState === 'complete'
              return (
                <tr key={code} className={`hover:bg-slate-50/60 ${hasAnyMark ? 'bg-emerald-50/30' : ''}`}>
                  <td className="px-3 py-2 text-center text-[.72rem] text-slate-500">{i + 1}</td>
                  <td className="px-3 py-2">
                    <div className="font-black text-slate-900 text-[.82rem]">{p.name}</div>
                    <div className="text-[.66rem] font-mono text-slate-400">{code}</div>
                  </td>
                  <td className="px-3 py-2 text-[.74rem] text-slate-600">{p.projectCode || p.team || '—'}</td>
                  <td className="px-3 py-2 text-center">
                    <SendToLineCell
                      checked={!!row.sendToLine}
                      shared={!!auto?.sharedToLine}
                      sharedAt={auto?.sharedAtISO}
                      hasPhoto={!!auto?.hasPhotoIn}
                      overridden={!!entriesByCode[code] && entriesByCode[code].sendToLine !== !!auto?.sharedToLine}
                      onChange={v => persist(code, { sendToLine: v })}
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <AutoLocationBadge locState={locState} auto={auto} />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <AutoStatusClockBadge clockState={clockState} auto={auto} />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.notes || ''}
                      onChange={e => setEntriesByCode(m => ({ ...m, [code]: { ...getRow(code), notes: e.target.value } }))}
                      onBlur={e => {
                        const current = getRow(code)
                        if ((current.notes || '') !== (e.target.value || '')) persist(code, { notes: e.target.value })
                      }}
                      placeholder="Optional notes…"
                      className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[.74rem] text-slate-700 focus:border-blue-400 focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <RowStateBadge state={state} />
                  </td>
                </tr>
              )
            })}
          </CmTable>
        )}
      </CmCard>
    </>
  )
}

function RowCheckbox({ checked, onChange }) {
  return (
    <label className="inline-flex items-center justify-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="h-5 w-5 accent-emerald-600 cursor-pointer"
      />
    </label>
  )
}

// Hybrid "Send to Line": editable checkbox, pre-ticked when the employee tapped Share
// (intent to send to LINE). A clock-in photo without a Share tap is a weaker hint.
function SendToLineCell({ checked, shared, sharedAt, hasPhoto, overridden, onChange }) {
  const t = sharedAt ? timeOnly(sharedAt) : null
  const caption = overridden ? 'manual'
    : shared ? `auto · shared${t ? ` ${t}` : ''}`
    : hasPhoto ? 'photo only'
    : null
  const captionColor = overridden ? 'text-blue-600'
    : shared ? 'text-emerald-600'
    : 'text-amber-600'
  const tooltip = shared
    ? `Tapped Share${t ? ` at ${t}` : ''} — recorded as sent to LINE. Uncheck to override.`
    : hasPhoto
    ? 'Has clock-in photo but did NOT tap Share. Tick only if confirmed sent to LINE.'
    : 'No Share tap — tick if sent to LINE manually.'
  return (
    <span className="inline-flex flex-col items-center gap-0.5" title={tooltip}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="h-5 w-5 accent-emerald-600 cursor-pointer"
      />
      {caption && (
        <span className={`text-[.6rem] font-bold uppercase tracking-wide ${captionColor}`}>
          {caption}
        </span>
      )}
    </span>
  )
}

function RowStateBadge({ state }) {
  if (state === 'saving') return <RefreshCw size={14} className="inline animate-spin text-slate-400" />
  if (state === 'saved') return <CircleCheck size={14} className="inline text-emerald-500" />
  if (state === 'error') return <TriangleAlert size={14} className="inline text-red-500" />
  return <span className="text-slate-300 text-xs">—</span>
}

function AutoStatusClockBadge({ clockState, auto }) {
  const inT = auto?.timeISO ? timeOnly(auto.timeISO) : null
  const outT = auto?.clockOutISO ? timeOnly(auto.clockOutISO) : null
  const checked = clockState === 'complete'
  const tooltip = clockState === 'complete' ? `Auto: clock-in ${inT}, clock-out ${outT}`
    : clockState === 'partial' ? `Auto: clock-in ${inT}, no clock-out yet`
    : 'No clock activity'
  const subLabel = clockState === 'complete' ? 'auto'
    : clockState === 'partial' ? `started ${inT}`
    : null
  return (
    <span className="inline-flex flex-col items-center gap-0.5" title={tooltip}>
      <input
        type="checkbox"
        checked={checked}
        readOnly
        disabled
        className="h-5 w-5 accent-emerald-600 cursor-not-allowed opacity-90"
      />
      {subLabel && (
        <span className={`text-[.6rem] font-bold uppercase tracking-wide ${clockState === 'complete' ? 'text-emerald-600' : 'text-amber-600'}`}>
          {subLabel}
        </span>
      )}
    </span>
  )
}

function AutoLocationBadge({ locState, auto }) {
  const dist = (auto?.distanceM != null) ? `${Math.round(auto.distanceM)}m` : null
  const src = auto?.locationSource === 'office' ? 'office' : auto?.locationSource === 'site' ? 'site' : null
  const checked = locState === 'on_site'
  const tooltip = locState === 'on_site' ? `On-site (${src}${dist ? `, ${dist}` : ''})${auto?.locationName ? ` — ${auto.locationName}` : ''}`
    : locState === 'off_site' ? `Off-site${dist ? ` — ${dist} from ${src}` : ''}${auto?.locationName ? ` (${auto.locationName})` : ''}`
    : locState === 'no_site' ? 'No geofence set (no site / no work location)'
    : locState === 'no_gps' ? 'No GPS captured at clock-in'
    : 'No clock activity'
  const subLabel = locState === 'on_site' ? (src || 'on-site')
    : locState === 'off_site' ? `off · ${dist || ''}`.trim()
    : locState === 'no_site' ? 'no zone'
    : locState === 'no_gps' ? 'no gps'
    : null
  const subColor = locState === 'on_site' ? 'text-emerald-600'
    : locState === 'off_site' ? 'text-red-600'
    : 'text-slate-400'
  return (
    <span className="inline-flex flex-col items-center gap-0.5" title={tooltip}>
      <input
        type="checkbox"
        checked={checked}
        readOnly
        disabled
        className="h-5 w-5 accent-emerald-600 cursor-not-allowed opacity-90"
      />
      {subLabel && (
        <span className={`text-[.6rem] font-bold uppercase tracking-wide ${subColor}`}>{subLabel}</span>
      )}
    </span>
  )
}

function WorkLocationsPanel({ team, authenticatedUser }) {
  const isAdmin = ADMIN_ROLES.has(authenticatedUser?.role)
  const [view, setView] = useState('map') // 'map' | 'list'

  if (!isAdmin) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
        <Lock size={32} className="mx-auto text-amber-600" />
        <div className="mt-3 text-sm font-black text-amber-800">Admin access required</div>
        <div className="mt-1 text-xs font-bold text-amber-700">
          Allowed: SUPER_ADMIN, SYSTEM_ADMIN, HR_ADMIN, PROJECT_ADMIN.
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setView('map')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-black transition ${view === 'map' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <MapIcon size={14} /> Map View
          </button>
          <button
            onClick={() => setView('list')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-black transition ${view === 'list' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <ClipboardCheck size={14} /> List View (bulk edit)
          </button>
          <span className="ml-auto text-[.7rem] text-slate-500 px-2">
            Map: assign people/projects by clicking · List: tabular bulk edit
          </span>
        </div>
      </section>

      <div className="mt-4">
        {view === 'map'
          ? <WorkLocationsMapView team={team} />
          : <WorkLocationsListView team={team} />}
      </div>
    </>
  )
}

function WorkLocationsListView({ team }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('')
  const [onlyNoLocation, setOnlyNoLocation] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [editingCode, setEditingCode] = useState(null) // single edit
  const [bulkOpen, setBulkOpen] = useState(false)
  const [msg, setMsg] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/clock/monitor/work-locations?team=${team || 'ALL'}`)
      const data = res.ok ? await res.json() : null
      setUsers(data?.users || [])
    } catch (_) { /* no-op */ }
    setLoading(false)
  }
  useEffect(() => { load() }, [team])

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase()
    return users.filter(u => {
      if (onlyNoLocation && u.hasLocation) return false
      if (!q) return true
      return [u.name, u.employeeCode, u.workLocationName, u.projectTeam]
        .some(v => String(v || '').toLowerCase().includes(q))
    })
  }, [users, filter, onlyNoLocation])

  // Selected codes that are still visible (so toggling filter doesn't apply to hidden rows)
  const selectedVisible = useMemo(() => {
    const set = new Set()
    for (const u of visible) if (selected.has(u.employeeCode)) set.add(u.employeeCode)
    return set
  }, [selected, visible])

  function toggleOne(code) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code); else next.add(code)
      return next
    })
  }
  function toggleAll() {
    if (selectedVisible.size === visible.length && visible.length) {
      // Clear visible from selection
      setSelected(prev => {
        const next = new Set(prev)
        for (const u of visible) next.delete(u.employeeCode)
        return next
      })
    } else {
      setSelected(prev => {
        const next = new Set(prev)
        for (const u of visible) next.add(u.employeeCode)
        return next
      })
    }
  }

  async function saveSingle(code, patch) {
    setMsg(null)
    try {
      const res = await apiFetch(`/api/clock/monitor/work-locations/${encodeURIComponent(code)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          work_lat: patch.workLat ?? null,
          work_lng: patch.workLng ?? null,
          work_location_name: patch.workLocationName ?? null,
          allowed_radius_m: patch.allowedRadiusM ?? null,
        }),
      })
      if (res.ok) {
        setMsg({ ok: true, text: `Saved for ${code}` })
        load()
      } else {
        const data = await res.json().catch(() => ({}))
        setMsg({ ok: false, text: data.detail || `Error (${res.status})` })
      }
    } catch (e) { setMsg({ ok: false, text: e?.message || 'Network error' }) }
  }

  async function saveBulk(patch) {
    if (!selected.size) return
    setMsg(null)
    try {
      const res = await apiFetch('/api/clock/monitor/work-locations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_codes: [...selected],
          work_lat: patch.workLat ?? null,
          work_lng: patch.workLng ?? null,
          work_location_name: patch.workLocationName ?? null,
          allowed_radius_m: patch.allowedRadiusM ?? null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setMsg({ ok: true, text: `Updated ${data.updated} people${data.missing?.length ? ` · missing: ${data.missing.join(', ')}` : ''}` })
        setSelected(new Set())
        setBulkOpen(false)
        load()
      } else {
        setMsg({ ok: false, text: data.detail || `Error (${res.status})` })
      }
    } catch (e) { setMsg({ ok: false, text: e?.message || 'Network error' }) }
  }

  const counts = {
    total: users.length,
    located: users.filter(u => u.hasLocation).length,
    none: users.filter(u => !u.hasLocation).length,
    daily: users.filter(u => u.clockType === 'DAILY').length,
  }
  const editingUser = users.find(u => u.employeeCode === editingCode)

  return (
    <>
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <div>
            <div className="font-black text-slate-900 text-sm inline-flex items-center gap-2">
              <MapPinned size={16} className="text-blue-600" /> Work Locations — DAILY Clock Geofence
            </div>
            <div className="text-[.7rem] text-slate-500 mt-0.5">
              ClockApp validates DAILY clock-in against these coordinates · supports single edit + group assignment
            </div>
          </div>
          <button onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-60">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> {loading ? 'Loading…' : 'Reload'}
          </button>
        </div>
        <div className="p-5">
          <MetricGrid metrics={[
            ['Total Users', counts.total, 'Active auth users'],
            ['Location Set', counts.located, `${counts.total ? Math.round(counts.located/counts.total*100) : 0}% of total`],
            ['No Location', counts.none, 'GPS check skipped'],
            ['DAILY Type', counts.daily, 'Geofence applies'],
          ]} />
        </div>
      </section>

      {/* TOOLBAR */}
      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
            <Search size={14} className="text-slate-400" />
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Search name / code / location / team"
              className="w-full border-0 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
            />
            {filter && <button onClick={() => setFilter('')} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>}
          </div>
          <label className="inline-flex items-center gap-1.5 text-xs font-black text-slate-600 cursor-pointer">
            <input type="checkbox" checked={onlyNoLocation} onChange={e => setOnlyNoLocation(e.target.checked)} className="h-4 w-4 accent-blue-600" />
            Only show "no location" ({counts.none})
          </label>
          <div className="ml-auto inline-flex items-center gap-2">
            <span className="text-[.72rem] font-bold text-slate-500">{selected.size} selected</span>
            <button
              disabled={!selected.size}
              onClick={() => setBulkOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-black text-white hover:bg-blue-700 disabled:opacity-40"
            >
              <Users size={13} /> Apply to {selected.size}
            </button>
            <button
              disabled={!selected.size}
              onClick={() => { if (confirm(`Clear location for ${selected.size} people?`)) saveBulk({}) }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-black text-red-700 hover:bg-red-100 disabled:opacity-40"
            >
              <Trash2 size={13} /> Clear
            </button>
          </div>
        </div>
        {msg && (
          <div className={`mt-2 rounded-lg px-3 py-2 text-sm font-bold ${msg.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {msg.text}
          </div>
        )}
      </section>

      {/* TABLE */}
      <CmCard
        title="Users — Work Locations"
        badge={`${visible.length} / ${users.length}`}
        className="mt-4"
      >
        {loading ? (
          <div className="text-center text-slate-400 font-bold py-8">Loading…</div>
        ) : !visible.length ? (
          <div className="text-center text-slate-400 font-bold py-8">No users match filter.</div>
        ) : (
          <CmTable headers={[
            { label: <input type="checkbox" checked={visible.length && selectedVisible.size === visible.length} onChange={toggleAll} className="h-4 w-4 accent-blue-600" />, width: 'w-10', align: 'center' },
            { label: 'Name / Code' },
            { label: 'Team', width: 'w-24' },
            { label: 'Type', width: 'w-20', align: 'center' },
            { label: 'Location Name' },
            { label: 'Lat, Lng', width: 'w-36' },
            { label: 'Radius', align: 'center', width: 'w-20' },
            { label: '', align: 'center', width: 'w-20' },
          ]}>
            {visible.map(u => {
              const checked = selected.has(u.employeeCode)
              return (
                <tr key={u.employeeCode} className={`hover:bg-slate-50/60 ${checked ? 'bg-blue-50/40' : ''}`}>
                  <td className="px-3 py-2 text-center">
                    <input type="checkbox" checked={checked} onChange={() => toggleOne(u.employeeCode)} className="h-4 w-4 accent-blue-600 cursor-pointer" />
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-black text-slate-900 text-[.82rem]">{u.name}</div>
                    <div className="text-[.66rem] font-mono text-slate-400">{u.employeeCode}</div>
                  </td>
                  <td className="px-3 py-2 text-[.74rem] text-slate-600">{u.projectTeam || '—'}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[.66rem] font-black ${u.clockType === 'DAILY' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>{u.clockType}</span>
                  </td>
                  <td className="px-3 py-2 text-[.78rem] text-slate-700">
                    {u.workLocationName || <span className="text-slate-300 italic">— not set —</span>}
                  </td>
                  <td className="px-3 py-2 text-[.7rem] text-slate-600 font-mono">
                    {u.hasLocation ? `${u.workLat.toFixed(5)}, ${u.workLng.toFixed(5)}` : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-3 py-2 text-center text-[.74rem] font-bold text-slate-700">{u.allowedRadiusM} m</td>
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => setEditingCode(u.employeeCode)} title="Edit" className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50">
                      <ClipboardPen size={14} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </CmTable>
        )}
      </CmCard>

      {/* SINGLE EDIT MODAL */}
      {editingUser && (
        <WorkLocationEditor
          title={`Edit — ${editingUser.name}`}
          subtitle={`${editingUser.employeeCode} · ${editingUser.projectTeam || '—'}`}
          initial={editingUser}
          onClose={() => setEditingCode(null)}
          onSave={async patch => { await saveSingle(editingUser.employeeCode, patch); setEditingCode(null) }}
        />
      )}

      {/* BULK MODAL */}
      {bulkOpen && (
        <WorkLocationEditor
          title={`Apply to ${selected.size} people`}
          subtitle="All selected users will share this location"
          initial={{ workLat: null, workLng: null, workLocationName: '', allowedRadiusM: 300 }}
          onClose={() => setBulkOpen(false)}
          onSave={async patch => { await saveBulk(patch) }}
        />
      )}
    </>
  )
}

function WorkLocationsMapView({ team }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedCodes, setSelectedCodes] = useState(() => new Set())
  const [paletteTab, setPaletteTab] = useState('unassigned') // 'unassigned' | 'projects' | 'all'
  const [paletteQuery, setPaletteQuery] = useState('')
  const [assignTarget, setAssignTarget] = useState(null)  // { zone } when clicking marker
  const [createTarget, setCreateTarget] = useState(null)  // { lat, lng, prefill? } when clicking empty map
  const [zoneDrawer, setZoneDrawer] = useState(null)      // zone shown in members drawer
  const [pendingZones, setPendingZones] = useState([])    // in-memory zones not yet saved
  const [addLocationOpen, setAddLocationOpen] = useState(false)
  const [draggingCount, setDraggingCount] = useState(0)   // for drag UI feedback
  const [msg, setMsg] = useState(null)
  const mapRef = useRef(null)
  const leafletRef = useRef({ map: null, markers: new Map(), circles: new Map() })
  const dragCodesRef = useRef([])   // codes carried by current drag

  async function load() {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/clock/monitor/work-locations?team=${team || 'ALL'}`)
      const data = res.ok ? await res.json() : null
      setUsers(data?.users || [])
    } catch (_) { /* no-op */ }
    setLoading(false)
  }
  useEffect(() => { load() }, [team])

  // Derive zones from users — group by name + rounded lat/lng (5 decimals = ~1m precision)
  const zones = useMemo(() => {
    const byKey = new Map()
    for (const u of users) {
      if (!u.hasLocation) continue
      const lat = Number(u.workLat).toFixed(5)
      const lng = Number(u.workLng).toFixed(5)
      const name = u.workLocationName || `(${lat},${lng})`
      const key = `${name}|${lat}|${lng}`
      if (!byKey.has(key)) byKey.set(key, {
        key, name, lat: Number(lat), lng: Number(lng),
        // radius mode = the most-common radius across members (or first if all unique)
        radius: u.allowedRadiusM, members: [],
      })
      byKey.get(key).members.push(u)
    }
    // Compute radius = mode across members
    for (const z of byKey.values()) {
      const counts = new Map()
      for (const m of z.members) counts.set(m.allowedRadiusM, (counts.get(m.allowedRadiusM) || 0) + 1)
      let best = z.radius, bestN = 0
      for (const [r, n] of counts) if (n > bestN) { best = r; bestN = n }
      z.radius = best
    }
    return [...byKey.values()].sort((a, b) => b.members.length - a.members.length)
  }, [users])

  // All zones for map = real + pending (pending has 0 members until someone is dropped)
  const allZones = useMemo(() => {
    return [...zones, ...pendingZones.map(p => ({ ...p, members: [], isPending: true }))]
  }, [zones, pendingZones])

  // Drive Test Engineer detection (field role).
  const isDte = u => u.positionCode === 'DTE' || /drive test engineer/i.test(u.position || '')
  // True Pre-Site staff = contract "Subcontractor Per-Site" (matches the ACE Pre-Site page).
  // clock_type=PER_SITE alone is NOT enough — some are mis-configured.
  const isPerSiteSubcon = u => u.contractType === 'Subcontractor Per-Site'

  // Pre-Site subcontractors → tied to ACE Pre-Site plan, no fixed work location needed.
  const perSiteStaff = useMemo(() => users.filter(isPerSiteSubcon), [users])
  // DTE who are NOT Pre-Site subcontractors and have no location → "Review": admin decides.
  // (Includes DAILY DTE + DTE mis-set to PER_SITE without a Pre-Site contract.)
  const reviewDte = useMemo(
    () => users.filter(u => isDte(u) && !isPerSiteSubcon(u) && !u.hasLocation),
    [users],
  )
  // "Unassigned" = office staff (non-DTE, non-Pre-Site) without a location yet — genuinely need one.
  const unassigned = useMemo(
    () => users.filter(u => !u.hasLocation && !isPerSiteSubcon(u) && !isDte(u)),
    [users],
  )
  const projectGroups = useMemo(() => {
    const map = new Map()
    for (const u of unassigned) {
      const k = u.projectTeam || 'NO_TEAM'
      if (!map.has(k)) map.set(k, [])
      map.get(k).push(u)
    }
    return [...map.entries()].map(([team, list]) => ({ team, list })).sort((a, b) => b.list.length - a.list.length)
  }, [unassigned])

  // Palette items based on tab
  const paletteItems = useMemo(() => {
    const q = paletteQuery.trim().toLowerCase()
    let pool = []
    if (paletteTab === 'unassigned') pool = unassigned
    else if (paletteTab === 'review') pool = reviewDte
    else if (paletteTab === 'persite') pool = perSiteStaff
    else if (paletteTab === 'all') pool = users
    else if (paletteTab === 'projects') return []
    if (!q) return pool
    return pool.filter(u => [u.name, u.employeeCode, u.projectTeam].some(v => String(v || '').toLowerCase().includes(q)))
  }, [paletteTab, paletteQuery, unassigned, reviewDte, perSiteStaff, users])

  function togglePerson(code) {
    setSelectedCodes(prev => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code); else next.add(code)
      return next
    })
  }
  function toggleProject(group) {
    setSelectedCodes(prev => {
      const next = new Set(prev)
      const allIn = group.list.every(u => next.has(u.employeeCode))
      if (allIn) for (const u of group.list) next.delete(u.employeeCode)
      else for (const u of group.list) next.add(u.employeeCode)
      return next
    })
  }
  function clearSelection() { setSelectedCodes(new Set()) }

  // ── Drag start helpers ──
  // If dragged code is already in selection, drag all selected. Otherwise drag just that code.
  function effectiveDragCodes(code) {
    if (selectedCodes.has(code) && selectedCodes.size > 0) return [...selectedCodes]
    return [code]
  }
  function onPersonDragStart(e, code) {
    const codes = effectiveDragCodes(code)
    dragCodesRef.current = codes
    setDraggingCount(codes.length)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', codes.join(','))
  }
  function onProjectDragStart(e, group) {
    const codes = group.list.map(u => u.employeeCode)
    dragCodesRef.current = codes
    setDraggingCount(codes.length)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', codes.join(','))
  }
  function onDragEnd() {
    setDraggingCount(0)
    // dragCodesRef intentionally retained briefly so drop handlers can read it
    setTimeout(() => { dragCodesRef.current = [] }, 0)
  }

  // ── Leaflet init ──
  useEffect(() => {
    if (!mapRef.current || !window.L) return
    const map = window.L.map(mapRef.current, { scrollWheelZoom: true }).setView([13.7563, 100.5018], 11)
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OSM' }).addTo(map)
    leafletRef.current.map = map
    map.on('click', e => {
      // empty area click → if any selection, prompt create; if no selection, hint
      const sel = leafletRef.current.selectedRef
      if (sel && sel.size > 0) setCreateTarget({ lat: e.latlng.lat, lng: e.latlng.lng })
    })
    return () => { map.remove(); leafletRef.current = { map: null, markers: new Map(), circles: new Map() } }
  }, [])

  // Keep latest selection in ref for use inside Leaflet click handler
  useEffect(() => { leafletRef.current.selectedRef = selectedCodes }, [selectedCodes])

  // ── Refresh markers when zones change ──
  useEffect(() => {
    const map = leafletRef.current.map
    if (!map || !window.L) return
    const { markers, circles } = leafletRef.current
    // remove stale
    for (const [k, mk] of markers) if (!allZones.find(z => z.key === k)) { mk.remove(); markers.delete(k) }
    for (const [k, c] of circles) if (!allZones.find(z => z.key === k)) { c.remove(); circles.delete(k) }
    for (const z of allZones) {
      const count = z.members.length
      const pending = !!z.isPending
      const bg = pending
        ? 'background:#fff; color:#2447d8; border:2px dashed #2447d8;'
        : 'background: linear-gradient(135deg,#2447d8,#c0392b); color:#fff; border:2px solid transparent;'
      const shadow = pending ? '' : 'box-shadow:0 4px 12px rgba(36,71,216,.4);'
      const badge = pending
        ? `<span style="background:#fef3c7; color:#92400e; border-radius:9999px; padding:0 6px; margin-left:4px; font-size:.66rem;">pending</span>`
        : `<span style="background:rgba(255,255,255,.25); border-radius:9999px; padding:0 6px; margin-left:4px;">${count}</span>`
      const html = `<div style="${bg}${shadow} border-radius:9999px; padding:4px 10px; font-weight:900; font-size:.74rem; white-space:nowrap;">📍 ${z.name} ${badge}</div>`
      const icon = window.L.divIcon({ className: pending ? 'wl-marker wl-marker-pending' : 'wl-marker', html, iconSize: null, iconAnchor: [60, 18] })
      const circleStyle = pending
        ? { radius: z.radius, color: '#2447d8', fillOpacity: 0.04, weight: 1.5, dashArray: '6,4' }
        : { radius: z.radius, color: '#2447d8', fillOpacity: 0.06, weight: 1 }
      if (markers.has(z.key)) {
        markers.get(z.key).setIcon(icon).setLatLng([z.lat, z.lng])
        circles.get(z.key).setLatLng([z.lat, z.lng]).setRadius(z.radius).setStyle(circleStyle)
      } else {
        const m = window.L.marker([z.lat, z.lng], { icon }).addTo(map)
        const c = window.L.circle([z.lat, z.lng], circleStyle).addTo(map)
        m.on('click', e => {
          window.L.DomEvent.stopPropagation(e)
          const sel = leafletRef.current.selectedRef
          if (sel && sel.size > 0) setAssignTarget({ zone: z })
          else if (!pending) setZoneDrawer(z)
          // pending + no selection → no-op (drag people onto it to fill)
        })
        markers.set(z.key, m)
        circles.set(z.key, c)
      }
      // Attach drop handlers on marker DOM
      const el = markers.get(z.key).getElement()
      if (el && !el._wlDropAttached) {
        el._wlDropAttached = true
        // Leaflet sets transform: translate3d(...) for positioning — preserve it.
        // Store the base transform once and apply highlight via a CSS class.
        el.addEventListener('dragenter', ev => { ev.preventDefault(); el.classList.add('wl-drop-hover') })
        el.addEventListener('dragover', ev => { ev.preventDefault(); ev.dataTransfer.dropEffect = 'move' })
        el.addEventListener('dragleave', ev => {
          // dragleave fires on child elements too — only clear when leaving the marker entirely
          if (!el.contains(ev.relatedTarget)) el.classList.remove('wl-drop-hover')
        })
        el.addEventListener('drop', ev => {
          ev.preventDefault()
          el.classList.remove('wl-drop-hover')
          const codes = dragCodesRef.current.length ? dragCodesRef.current : (ev.dataTransfer.getData('text/plain') || '').split(',').filter(Boolean)
          if (!codes.length) return
          // Set selection to the dropped codes so the modal carries them
          setSelectedCodes(new Set(codes))
          setTimeout(() => setAssignTarget({ zone: z }), 0)
        })
      }
    }
    // Fit bounds on first load
    if (allZones.length && !leafletRef.current.didFit) {
      const grp = window.L.featureGroup([...markers.values()])
      try { map.fitBounds(grp.getBounds().pad(0.3), { maxZoom: 14 }) } catch (_) {}
      leafletRef.current.didFit = true
    }
  }, [allZones])

  // Container-level drop handler — for drop on empty map area
  useEffect(() => {
    const el = mapRef.current
    if (!el) return
    function over(ev) { ev.preventDefault(); ev.dataTransfer.dropEffect = 'move' }
    function drop(ev) {
      // If target is a marker, marker handler already handled it
      if (ev.target.closest && ev.target.closest('.leaflet-marker-icon')) return
      ev.preventDefault()
      const codes = dragCodesRef.current.length ? dragCodesRef.current : (ev.dataTransfer.getData('text/plain') || '').split(',').filter(Boolean)
      if (!codes.length) return
      const map = leafletRef.current.map
      if (!map) return
      const rect = el.getBoundingClientRect()
      const pt = window.L.point(ev.clientX - rect.left, ev.clientY - rect.top)
      const latlng = map.containerPointToLatLng(pt)
      setSelectedCodes(new Set(codes))
      setTimeout(() => setCreateTarget({ lat: latlng.lat, lng: latlng.lng }), 0)
    }
    el.addEventListener('dragover', over)
    el.addEventListener('drop', drop)
    return () => { el.removeEventListener('dragover', over); el.removeEventListener('drop', drop) }
  }, [])

  async function bulkApply(patch) {
    const { workLat, workLng, workLocationName, allowedRadiusM } = patch
    setMsg(null)
    try {
      const res = await apiFetch('/api/clock/monitor/work-locations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_codes: [...selectedCodes],
          work_lat: workLat,
          work_lng: workLng,
          work_location_name: workLocationName,
          allowed_radius_m: allowedRadiusM,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setMsg({ ok: true, text: `Assigned ${data.updated} people` })
        setSelectedCodes(new Set())
        setAssignTarget(null)
        setCreateTarget(null)
        // If the saved zone matches a pending zone, remove it (now real)
        if (workLat != null && workLng != null) {
          const lat5 = Number(workLat).toFixed(5)
          const lng5 = Number(workLng).toFixed(5)
          setPendingZones(prev => prev.filter(p => !(p.name === workLocationName && p.lat.toFixed(5) === lat5 && p.lng.toFixed(5) === lng5)))
        }
        load()
      } else {
        setMsg({ ok: false, text: data.detail || `Error (${res.status})` })
      }
    } catch (e) { setMsg({ ok: false, text: e?.message || 'Network error' }) }
  }

  async function removeFromZone(employeeCode) {
    setMsg(null)
    try {
      const res = await apiFetch(`/api/clock/monitor/work-locations/${encodeURIComponent(employeeCode)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ work_lat: null, work_lng: null, work_location_name: null, allowed_radius_m: null }),
      })
      if (res.ok) { setMsg({ ok: true, text: `Removed ${employeeCode}` }); load() }
    } catch (e) { setMsg({ ok: false, text: e?.message || 'Network error' }) }
  }

  async function clearAllInZone(zone) {
    if (!zone?.members?.length) return
    if (!confirm(`Clear all ${zone.members.length} employees from "${zone.name}"?\nThey will become Unassigned.`)) return
    setMsg(null)
    try {
      const res = await apiFetch('/api/clock/monitor/work-locations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_codes: zone.members.map(m => m.employeeCode),
          work_lat: null,
          work_lng: null,
          work_location_name: null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setMsg({ ok: true, text: `Cleared ${data.updated} employees from "${zone.name}"` })
        setZoneDrawer(null)
        load()
      } else {
        setMsg({ ok: false, text: data.detail || `Error (${res.status})` })
      }
    } catch (e) { setMsg({ ok: false, text: e?.message || 'Network error' }) }
  }

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* PALETTE */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col">
          <div className="border-b border-slate-100 px-4 py-3">
            <div className="font-black text-slate-900 text-sm inline-flex items-center gap-2">
              <Users size={15} className="text-blue-600" /> People Palette
            </div>
            <div className="text-[.7rem] text-slate-500 mt-0.5">
              Pick people or a project, then click a marker on the map.
            </div>
          </div>

          <div className="flex border-b border-slate-100 overflow-x-auto">
            <PaletteTab active={paletteTab === 'unassigned'} onClick={() => setPaletteTab('unassigned')} label="Unassigned" count={unassigned.length} />
            <PaletteTab active={paletteTab === 'review'} onClick={() => setPaletteTab('review')} label="Review" count={reviewDte.length} />
            <PaletteTab active={paletteTab === 'projects'} onClick={() => setPaletteTab('projects')} label="Projects" count={projectGroups.length} />
            <PaletteTab active={paletteTab === 'persite'} onClick={() => setPaletteTab('persite')} label="DTE" count={perSiteStaff.length} />
            <PaletteTab active={paletteTab === 'all'} onClick={() => setPaletteTab('all')} label="All" count={users.length} />
          </div>

          {paletteTab === 'review' && (
            <div className="px-3 py-2 bg-blue-50 border-b border-blue-100 text-[.68rem] font-bold text-blue-800 flex items-start gap-1.5">
              <Info size={13} className="shrink-0 mt-0.5" />
              <span>DAILY-configured Drive Test Engineers — gray zone. Assign an office only if they actually work fixed; otherwise leave unassigned (they go to site). Admin decides.</span>
            </div>
          )}

          {paletteTab === 'persite' && (
            <div className="px-3 py-2 bg-amber-50 border-b border-amber-100 text-[.68rem] font-bold text-amber-800 flex items-start gap-1.5">
              <Info size={13} className="shrink-0 mt-0.5" />
              <span>Per-site (DTE) staff clock in per site, tied to the ACE Pre-Site plan — no fixed work location needed. Excluded from geofence assignment.</span>
            </div>
          )}

          {paletteTab !== 'projects' && (
            <div className="p-3 border-b border-slate-100">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                <Search size={13} className="text-slate-400" />
                <input
                  value={paletteQuery}
                  onChange={e => setPaletteQuery(e.target.value)}
                  placeholder="Search name / code"
                  className="w-full border-0 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                />
                {paletteQuery && <button onClick={() => setPaletteQuery('')}><X size={13} className="text-slate-400" /></button>}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5" style={{ maxHeight: 'calc(100vh - 360px)', minHeight: 380 }}>
            {paletteTab === 'projects' ? (
              projectGroups.length === 0 ? (
                <div className="text-center text-slate-400 text-xs font-bold py-6">No unassigned projects.</div>
              ) : projectGroups.map(g => {
                const allIn = g.list.every(u => selectedCodes.has(u.employeeCode))
                return (
                  <button
                    key={g.team}
                    draggable
                    onDragStart={e => onProjectDragStart(e, g)}
                    onDragEnd={onDragEnd}
                    onClick={() => toggleProject(g)}
                    className={`w-full text-left rounded-lg border px-3 py-2 transition cursor-grab active:cursor-grabbing ${allIn ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-black text-slate-900">{g.team}</div>
                        <div className="text-[.66rem] text-slate-500">{g.list.length} unassigned</div>
                      </div>
                      {allIn && <CircleCheck size={14} className="text-blue-600" />}
                    </div>
                  </button>
                )
              })
            ) : paletteItems.length === 0 ? (
              <div className="text-center text-slate-400 text-xs font-bold py-6">
                {paletteTab === 'unassigned' ? 'No unassigned people 🎉'
                  : paletteTab === 'review' ? 'No DTE to review.'
                  : paletteTab === 'persite' ? 'No per-site staff.'
                  : 'No people match.'}
              </div>
            ) : paletteItems.map(u => {
              const checked = selectedCodes.has(u.employeeCode)
              const perSiteSubcon = isPerSiteSubcon(u)
              const dteReview = isDte(u) && !perSiteSubcon
              // Pre-Site subcontractor chips are read-only — no fixed location needed.
              if (paletteTab === 'persite' || (paletteTab === 'all' && perSiteSubcon)) {
                return (
                  <div
                    key={u.employeeCode}
                    className="w-full rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-[.78rem] font-black text-slate-700 truncate">{u.name}</div>
                        <div className="text-[.66rem] font-mono text-slate-400 truncate">{u.employeeCode} · {u.projectTeam || '—'}</div>
                      </div>
                      <span className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-[.6rem] font-black text-purple-700">PER-SITE</span>
                    </div>
                  </div>
                )
              }
              return (
                <button
                  key={u.employeeCode}
                  draggable
                  onDragStart={e => onPersonDragStart(e, u.employeeCode)}
                  onDragEnd={onDragEnd}
                  onClick={() => togglePerson(u.employeeCode)}
                  className={`w-full text-left rounded-lg border px-3 py-2 transition cursor-grab active:cursor-grabbing ${checked ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-[.78rem] font-black text-slate-900 truncate">{u.name}</div>
                      <div className="text-[.66rem] font-mono text-slate-400 truncate">{u.employeeCode} · {u.projectTeam || '—'}</div>
                      {u.hasLocation && (
                        <div className="text-[.62rem] text-emerald-600 truncate">→ {u.workLocationName}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {dteReview && <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[.55rem] font-black text-purple-700">DTE</span>}
                      {checked && <CircleCheck size={14} className="text-blue-600" />}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {selectedCodes.size > 0 && (
            <div className="border-t border-blue-200 bg-blue-50 px-3 py-2 flex items-center gap-2">
              <span className="text-xs font-black text-blue-700">{selectedCodes.size} selected</span>
              <button onClick={clearSelection} className="ml-auto text-[.7rem] font-black text-blue-700 hover:underline">Clear</button>
            </div>
          )}
        </section>

        {/* MAP */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-100 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="font-black text-slate-900 text-sm inline-flex items-center gap-2">
                <MapPinned size={15} className="text-blue-600" /> Zones — {zones.length} locations · {users.filter(u => u.hasLocation).length} assigned · {unassigned.length} need location{reviewDte.length ? ` · ${reviewDte.length} review (DTE)` : ''}{perSiteStaff.length ? ` · ${perSiteStaff.length} per-site` : ''}
              </div>
              <div className="text-[.7rem] text-slate-500 mt-0.5">
                {selectedCodes.size === 0
                  ? 'Click a marker to view members.'
                  : `Click a marker → assign ${selectedCodes.size} people, or click empty map → create new zone.`}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAddLocationOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-black text-white shadow hover:bg-emerald-700"
              >
                <MapPinned size={13} /> + Add Location
              </button>
              <button onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-60">
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Reload
              </button>
            </div>
          </div>
          <div className="relative">
            <div ref={mapRef} style={{ height: 'calc(100vh - 180px)', minHeight: 540 }} />
            {draggingCount > 0 && (
              <div className="pointer-events-none absolute inset-0 z-[600] flex items-start justify-center pt-3">
                <div className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-black text-white shadow-lg">
                  Dragging {draggingCount} · drop on marker to assign, or empty area to create
                </div>
              </div>
            )}
          </div>
          {msg && (
            <div className={`border-t px-4 py-2 text-sm font-bold ${msg.ok ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {msg.text}
            </div>
          )}
        </section>
      </div>

      {/* ASSIGN-TO-EXISTING-ZONE MODAL */}
      {assignTarget && (
        <ConfirmModal
          title={`Assign to ${assignTarget.zone.name}`}
          subtitle={`${selectedCodes.size} selected people → ${assignTarget.zone.name} (${assignTarget.zone.lat.toFixed(5)}, ${assignTarget.zone.lng.toFixed(5)} · ${assignTarget.zone.radius}m)`}
          onClose={() => setAssignTarget(null)}
          onConfirm={() => bulkApply({
            workLat: assignTarget.zone.lat,
            workLng: assignTarget.zone.lng,
            workLocationName: assignTarget.zone.name,
            allowedRadiusM: assignTarget.zone.radius,
          })}
          confirmLabel="Apply"
        />
      )}

      {/* CREATE-ZONE MODAL */}
      {createTarget && (
        <CreateZoneModal
          lat={createTarget.lat}
          lng={createTarget.lng}
          count={selectedCodes.size}
          onClose={() => setCreateTarget(null)}
          onConfirm={({ name, radius }) => bulkApply({
            workLat: createTarget.lat,
            workLng: createTarget.lng,
            workLocationName: name,
            allowedRadiusM: radius,
          })}
        />
      )}

      {/* ZONE MEMBERS DRAWER */}
      {zoneDrawer && (
        <ZoneMembersDrawer
          zone={zoneDrawer}
          onClose={() => setZoneDrawer(null)}
          onRemove={async code => { await removeFromZone(code); setZoneDrawer(z => z ? { ...z, members: z.members.filter(m => m.employeeCode !== code) } : null) }}
          onClearAll={() => clearAllInZone(zoneDrawer)}
        />
      )}

      {/* + ADD LOCATION MODAL */}
      {addLocationOpen && (
        <AddLocationModal
          mapCenter={(() => {
            const map = leafletRef.current.map
            if (!map) return { lat: 13.7563, lng: 100.5018 }
            const c = map.getCenter()
            return { lat: c.lat, lng: c.lng }
          })()}
          onClose={() => setAddLocationOpen(false)}
          onCreate={({ name, lat, lng, radius }) => {
            const key = `pending|${name}|${lat.toFixed(5)}|${lng.toFixed(5)}`
            setPendingZones(prev => [...prev, { key, name, lat, lng, radius }])
            setAddLocationOpen(false)
            const map = leafletRef.current.map
            if (map) map.setView([lat, lng], Math.max(map.getZoom(), 14))
            setMsg({ ok: true, text: `Pending zone "${name}" added — drag people onto it to assign` })
          }}
        />
      )}
    </>
  )
}

function AddLocationModal({ mapCenter, onClose, onCreate }) {
  const [name, setName] = useState('')
  const [lat, setLat] = useState(mapCenter?.lat?.toFixed(6) || '')
  const [lng, setLng] = useState(mapCenter?.lng?.toFixed(6) || '')
  const [radius, setRadius] = useState(300)
  const [err, setErr] = useState(null)
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const circleRef = useRef(null)
  const skipRecenterRef = useRef(false)  // set when map click/drag already positioned the view

  // Init map once
  useEffect(() => {
    if (!mapRef.current || !window.L) return
    const map = window.L.map(mapRef.current, { scrollWheelZoom: true })
      .setView([Number(lat) || 13.7563, Number(lng) || 100.5018], 13)
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OSM' }).addTo(map)
    mapInstanceRef.current = map
    map.on('click', e => {
      skipRecenterRef.current = true  // user clicked map → keep their view
      setLat(e.latlng.lat.toFixed(6)); setLng(e.latlng.lng.toFixed(6))
    })
    return () => { map.remove(); mapInstanceRef.current = null; markerRef.current = null; circleRef.current = null }
  }, [])

  // Place / move marker + recenter map whenever lat/lng changes (e.g. manual typing → fly to it)
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !window.L) return
    const la = Number(lat), ln = Number(lng)
    if (!la || !ln) {
      if (markerRef.current) { markerRef.current.remove(); markerRef.current = null }
      if (circleRef.current) { circleRef.current.remove(); circleRef.current = null }
      return
    }
    if (!markerRef.current) {
      markerRef.current = window.L.marker([la, ln], { draggable: true }).addTo(map)
      markerRef.current.on('dragend', () => {
        const p = markerRef.current.getLatLng()
        skipRecenterRef.current = true  // marker already where the user dropped it
        setLat(p.lat.toFixed(6)); setLng(p.lng.toFixed(6))
      })
      circleRef.current = window.L.circle([la, ln], { radius: Number(radius) || 300, color: '#2447d8', fillOpacity: 0.08 }).addTo(map)
    } else {
      markerRef.current.setLatLng([la, ln])
      circleRef.current.setLatLng([la, ln])
    }
    if (skipRecenterRef.current) {
      skipRecenterRef.current = false
    } else {
      map.setView([la, ln], Math.max(map.getZoom(), 15))  // manual lat/lng entry → jump there
    }
  }, [lat, lng])

  // Live-update the geofence circle radius without recentering
  useEffect(() => {
    if (circleRef.current) circleRef.current.setRadius(Number(radius) || 300)
  }, [radius])

  function useGps() {
    if (!navigator.geolocation) { setErr('GPS not available'); return }
    navigator.geolocation.getCurrentPosition(
      p => { setLat(p.coords.latitude.toFixed(6)); setLng(p.coords.longitude.toFixed(6)); setErr(null) },
      e => setErr(`GPS error: ${e.message}`),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  function submit() {
    if (!name.trim()) { setErr('Name is required'); return }
    if (!Number(lat) || !Number(lng)) { setErr('Pick a point on the map'); return }
    onCreate({ name: name.trim(), lat: Number(lat), lng: Number(lng), radius: Math.max(0, Number(radius) || 0) })
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col">
        <div className="border-b border-slate-100 px-5 py-3 flex items-center justify-between">
          <div>
            <div className="font-black text-slate-900 text-sm inline-flex items-center gap-2">
              <MapPinned size={16} className="text-emerald-600" /> Add Location (Pending)
            </div>
            <div className="text-[.7rem] text-slate-500 mt-0.5">
              Creates a marker on the map. Drag people onto it to make it real (zones are stored via their assigned users).
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"><X size={16} /></button>
        </div>
        <div className="p-5 overflow-y-auto">
          <div className="grid gap-3 md:grid-cols-2">
            <CmField label="Name">
              <input className={CM_INPUT_CLS} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. NT RYG Zone" autoFocus />
            </CmField>
            <CmField label="Radius (m)">
              <input type="number" min="0" className={CM_INPUT_CLS} value={radius} onChange={e => setRadius(e.target.value)} />
            </CmField>
            <CmField label="Latitude">
              <input type="number" step="any" className={CM_INPUT_CLS} value={lat} onChange={e => setLat(e.target.value)} />
            </CmField>
            <CmField label="Longitude">
              <input type="number" step="any" className={CM_INPUT_CLS} value={lng} onChange={e => setLng(e.target.value)} />
            </CmField>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button type="button" onClick={useGps} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700 hover:bg-blue-100">
              <LocateFixed size={13} /> Use my current GPS
            </button>
            <span className="text-[.7rem] text-slate-500">or click the map to set</span>
          </div>
          <div ref={mapRef} className="mt-3 rounded-xl border border-slate-200 overflow-hidden" style={{ height: 280 }} />
          {err && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700 border border-red-200">{err}</div>}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3 bg-slate-50/50">
          <button onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={submit} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow-md hover:bg-emerald-700">
            <MapPinned size={14} /> Add Pending
          </button>
        </div>
      </div>
    </div>
  )
}

function PaletteTab({ active, onClick, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-3 py-2 text-xs font-black transition border-b-2 ${active ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
    >
      {label} <span className="ml-1 rounded-full bg-slate-200/70 px-1.5 py-0.5 text-[.6rem]">{count}</span>
    </button>
  )
}

function ConfirmModal({ title, subtitle, onClose, onConfirm, confirmLabel = 'Confirm' }) {
  const [busy, setBusy] = useState(false)
  async function go() { setBusy(true); try { await onConfirm() } finally { setBusy(false) } }
  return (
    <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5">
        <div className="font-black text-slate-900 text-base">{title}</div>
        <div className="text-[.78rem] text-slate-500 mt-1">{subtitle}</div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-50">Cancel</button>
          <button disabled={busy} onClick={go} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-md hover:bg-blue-700 disabled:opacity-50">
            <Save size={14} /> {busy ? 'Applying…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateZoneModal({ lat, lng, count, onClose, onConfirm }) {
  const [name, setName] = useState('')
  const [radius, setRadius] = useState(300)
  const [busy, setBusy] = useState(false)
  async function go() {
    if (!name.trim()) return
    setBusy(true); try { await onConfirm({ name: name.trim(), radius: Math.max(0, Number(radius) || 0) }) } finally { setBusy(false) }
  }
  return (
    <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5">
        <div className="font-black text-slate-900 text-base inline-flex items-center gap-2">
          <MapPinned size={16} className="text-blue-600" /> Create New Zone
        </div>
        <div className="text-[.78rem] text-slate-500 mt-1">
          Assign {count} selected people to a new zone at <span className="font-mono">{lat.toFixed(5)}, {lng.toFixed(5)}</span>
        </div>
        <div className="mt-4 grid gap-3">
          <CmField label="Zone Name">
            <input className={CM_INPUT_CLS} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. AIS BKK Zone" autoFocus />
          </CmField>
          <CmField label="Radius (m)">
            <input type="number" min="0" className={CM_INPUT_CLS} value={radius} onChange={e => setRadius(e.target.value)} />
          </CmField>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-50">Cancel</button>
          <button disabled={busy || !name.trim()} onClick={go} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-md hover:bg-blue-700 disabled:opacity-50">
            <Save size={14} /> {busy ? 'Creating…' : 'Create & Assign'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ZoneMembersDrawer({ zone, onClose, onRemove, onClearAll }) {
  return (
    <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full flex flex-col max-h-[80vh]">
        <div className="border-b border-slate-100 px-5 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-black text-slate-900 text-sm inline-flex items-center gap-2">
              <MapPinned size={15} className="text-blue-600" /> {zone.name}
            </div>
            <div className="text-[.7rem] text-slate-500 mt-0.5 font-mono truncate">{zone.lat.toFixed(5)}, {zone.lng.toFixed(5)} · {zone.radius}m · {zone.members.length} members</div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {zone.members.length > 0 && onClearAll && (
              <button
                onClick={onClearAll}
                title={`Clear all ${zone.members.length} employees from this zone`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-black text-red-700 hover:bg-red-100"
              >
                <Trash2 size={13} /> Clear all
              </button>
            )}
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"><X size={16} /></button>
          </div>
        </div>
        <div className="overflow-y-auto p-3 space-y-1.5">
          {zone.members.map(m => (
            <div key={m.employeeCode} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-black text-slate-900 truncate">{m.name}</div>
                <div className="text-[.66rem] font-mono text-slate-400 truncate">{m.employeeCode} · {m.projectTeam || '—'}</div>
              </div>
              <button onClick={() => { if (confirm(`Remove ${m.name} from ${zone.name}?`)) onRemove(m.employeeCode) }} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-red-500 hover:bg-red-50" title="Remove from zone">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function WorkLocationEditor({ title, subtitle, initial, onClose, onSave }) {
  const [name, setName] = useState(initial?.workLocationName || '')
  const [lat, setLat] = useState(initial?.workLat ?? '')
  const [lng, setLng] = useState(initial?.workLng ?? '')
  const [radius, setRadius] = useState(initial?.allowedRadiusM ?? 300)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const mapRef = useRef(null)

  // Init Leaflet map
  useEffect(() => {
    if (!mapRef.current || !window.L) return
    const map = window.L.map(mapRef.current, { scrollWheelZoom: true }).setView(
      [Number(lat) || 13.7563, Number(lng) || 100.5018],
      Number(lat) ? 16 : 12,
    )
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OSM' }).addTo(map)
    let marker = null
    let circle = null
    function place(la, ln) {
      if (marker) marker.remove(); if (circle) circle.remove()
      marker = window.L.marker([la, ln], { draggable: true }).addTo(map)
      circle = window.L.circle([la, ln], { radius: Number(radius) || 300, color: '#2447d8', fillOpacity: 0.08 }).addTo(map)
      marker.on('dragend', () => {
        const p = marker.getLatLng(); setLat(p.lat.toFixed(6)); setLng(p.lng.toFixed(6))
      })
    }
    if (Number(lat) && Number(lng)) place(Number(lat), Number(lng))
    map.on('click', e => {
      setLat(e.latlng.lat.toFixed(6)); setLng(e.latlng.lng.toFixed(6))
      place(e.latlng.lat, e.latlng.lng)
    })
    return () => map.remove()
  }, []) // initialize once

  function useMyGps() {
    if (!navigator.geolocation) { setErr('GPS not available'); return }
    navigator.geolocation.getCurrentPosition(
      p => { setLat(p.coords.latitude.toFixed(6)); setLng(p.coords.longitude.toFixed(6)); setErr(null) },
      e => setErr(`GPS error: ${e.message}`),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  async function submit() {
    setBusy(true); setErr(null)
    const payload = {
      workLat: lat === '' ? null : Number(lat),
      workLng: lng === '' ? null : Number(lng),
      workLocationName: (name || '').trim() || null,
      allowedRadiusM: Math.max(0, Number(radius) || 0),
    }
    if ((payload.workLat == null) !== (payload.workLng == null)) {
      setErr('Provide both lat & lng, or neither.'); setBusy(false); return
    }
    try { await onSave(payload) } catch (_) { /* parent already shows error */ }
    setBusy(false)
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div>
            <div className="font-black text-slate-900 text-sm inline-flex items-center gap-2">
              <MapPinned size={16} className="text-blue-600" /> {title}
            </div>
            <div className="text-[.7rem] text-slate-500 mt-0.5">{subtitle}</div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"><X size={16} /></button>
        </div>

        <div className="p-5 overflow-y-auto">
          <div className="grid gap-4 md:grid-cols-2">
            <CmField label="Location Name">
              <input className={CM_INPUT_CLS} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. AIS BKK Zone" />
            </CmField>
            <CmField label="Radius (m)">
              <input type="number" min="0" className={CM_INPUT_CLS} value={radius} onChange={e => setRadius(e.target.value)} />
            </CmField>
            <CmField label="Latitude">
              <input type="number" step="any" className={CM_INPUT_CLS} value={lat} onChange={e => setLat(e.target.value)} placeholder="13.7563" />
            </CmField>
            <CmField label="Longitude">
              <input type="number" step="any" className={CM_INPUT_CLS} value={lng} onChange={e => setLng(e.target.value)} placeholder="100.5018" />
            </CmField>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button type="button" onClick={useMyGps} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700 hover:bg-blue-100">
              <LocateFixed size={13} /> Use my current GPS
            </button>
            <span className="text-[.7rem] text-slate-500">or click the map to set</span>
          </div>

          <div ref={mapRef} className="mt-3 rounded-xl border border-slate-200 overflow-hidden" style={{ height: 320 }} />

          {err && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700 border border-red-200">{err}</div>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3 bg-slate-50/50">
          <button onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-50">Cancel</button>
          <button
            disabled={busy}
            onClick={submit}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
          ><Save size={14} /> {busy ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}

function TodayExecutivePanel({ team, date }) {
  const [list, setList] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(false)
  const [lastSync, setLastSync] = useState('')

  function load() {
    setLoading(true)
    const qs = `team=${team}${date ? `&date_iso=${date}` : ''}`
    apiFetch(`/api/clock/monitor/today-executive?${qs}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) { setList(data.list || []); setMeta(data.meta || null) }
        setLastSync(new Date().toLocaleTimeString('th-TH'))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [team, date])

  const projects = [...groupBy(list, row => row.projectCode || 'UNKNOWN').entries()]
    .map(([label, rows]) => ({ label, value: rows.length, total: list.length }))
  const mapEvents = list.map(r => ({ ...r, lat: r.lat, lng: r.lng, time: r.timeISO, status: 'Start Work' }))

  return (
    <>
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div>
            <div className="font-black text-slate-900 text-sm">📍 People — Today Executive (Latest Start)</div>
            <div className="text-[.7rem] text-slate-500 mt-0.5">Latest clock-in per person today · Sync: {lastSync || '—'}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[.7rem] font-bold text-blue-700">📅 {meta?.dateISO || todayISO()}</span>
            <button onClick={load} disabled={loading} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-60">
              {loading ? '⏳ Loading…' : '↺ Refresh'}
            </button>
          </div>
        </div>
        <div className="p-5">
          <MetricGrid metrics={[
            ['People Started', list.length, 'Clocked in today'],
            ['Projects', projects.length, 'Active projects'],
            ['With GPS', list.filter(r => r.lat && r.lng).length, 'Map points'],
            ['No GPS', list.filter(r => !r.lat || !r.lng).length, 'Without location'],
          ]} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 mt-4">
        <CmCard title="🗺 Map — Latest Start Today" subtitle="Color = Project">
          <PseudoMap events={mapEvents} />
          <div className="mt-3"><ProjectBars rows={projects} /></div>
        </CmCard>
        <CmCard
          title="👥 People Table"
          badge={`${list.length} people`}
          actions={<ExportMenu
            filename={`ace-today-executive-${todayISO()}`}
            title={`Today Executive — ${todayISO()}`}
            subtitle={`Team: ${team} · ${list.length} people clocked in today`}
            columns={[
              { header: 'Code',    dataKey: 'employeeCode', width: 12 },
              { header: 'Name',    dataKey: 'name',         width: 24 },
              { header: 'Project', dataKey: 'projectCode',  width: 14 },
              { header: 'Start',   dataKey: 'startTime',    width: 10, align: 'center' },
              { header: 'Job',     dataKey: 'job',          width: 16 },
              { header: 'Lat',     dataKey: 'lat',          width: 12 },
              { header: 'Lng',     dataKey: 'lng',          width: 12 },
            ]}
            rows={list.map(r => ({ ...r, startTime: r.timeISO ? timeOnly(r.timeISO) : '' }))}
          />}
        >
          <CmTable headers={[
            { label: 'Name' }, { label: 'Project' },
            { label: 'Start Time', align: 'center', width: 'w-24' },
            { label: 'Job' }, { label: 'Location' },
          ]}>
            {list.map(row => (
              <tr key={row.employeeCode} className="hover:bg-slate-50/60">
                <td className="px-3 py-2">
                  <div className="font-black text-slate-900 text-[.82rem]">{row.name}</div>
                  <div className="text-[.66rem] font-mono text-slate-400">{row.employeeCode}</div>
                </td>
                <td className="px-3 py-2 text-[.78rem] text-slate-600">{row.projectCode}</td>
                <td className="px-3 py-2 text-center font-mono text-[.74rem] text-slate-700">{row.timeISO ? timeOnly(row.timeISO) : '—'}</td>
                <td className="px-3 py-2 text-[.78rem] text-slate-600">{row.job || '—'}</td>
                <td className="px-3 py-2 font-mono text-[.7rem] text-slate-500">{row.lat && row.lng ? `${Number(row.lat).toFixed(4)}, ${Number(row.lng).toFixed(4)}` : '—'}</td>
              </tr>
            ))}
          </CmTable>
        </CmCard>
      </div>
    </>
  )
}

const STATUS_META = {
  on_site:  { label: 'On-site',  color: '#16a34a', bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: '🟢' },
  off_site: { label: 'Off-site', color: '#dc2626', bg: 'bg-red-50',      text: 'text-red-700',     dot: '🔴' },
  no_site:  { label: 'No-site',  color: '#64748b', bg: 'bg-slate-100',   text: 'text-slate-600',   dot: '⚪' },
  no_gps:   { label: 'No GPS',   color: '#9ca3af', bg: 'bg-slate-100',   text: 'text-slate-500',   dot: '⚫' },
}

function LeafletMap({ people, sites, focusKey, onFocus }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const layerRef = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    function ensureLeaflet() {
      if (window.L) { if (!cancelled) setReady(true); return }
      const t = setInterval(() => {
        if (window.L) { clearInterval(t); if (!cancelled) setReady(true) }
      }, 100)
      setTimeout(() => clearInterval(t), 8000)
    }
    ensureLeaflet()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!ready || !mapRef.current || mapInstance.current) return
    const L = window.L
    const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(map)
    map.setView([13.7563, 100.5018], 11) // Bangkok default
    mapInstance.current = map
    layerRef.current = L.layerGroup().addTo(map)
  }, [ready])

  useEffect(() => {
    if (!mapInstance.current || !layerRef.current || !window.L) return
    const L = window.L
    const layer = layerRef.current
    layer.clearLayers()

    sites.forEach(site => {
      if (site.lat == null || site.lng == null) return
      L.circle([site.lat, site.lng], {
        radius: site.radiusM || 500,
        color: '#1d4ed8',
        weight: 1,
        fillColor: '#1d4ed8',
        fillOpacity: 0.08,
      }).bindPopup(`<b>${site.siteName || site.siteCode}</b><br/>${site.siteCode}<br/>Radius: ${site.radiusM}m`).addTo(layer)
    })

    const bounds = []
    people.forEach(p => {
      if (p.lat == null || p.lng == null) return
      const meta = STATUS_META[p.status] || STATUS_META.no_gps
      const icon = L.divIcon({
        className: 'ace-pin',
        html: `<div style="background:${meta.color};color:#fff;border:2px solid #fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;box-shadow:0 2px 6px rgba(0,0,0,.3)">${(p.name||'?').charAt(0)}</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      })
      const distLabel = p.distanceM != null ? `${Math.round(p.distanceM)}m from site` : 'No site link'
      const marker = L.marker([p.lat, p.lng], { icon }).bindPopup(
        `<div style="min-width:200px"><b>${p.name}</b><br/>` +
        `<span style="font-family:monospace;font-size:11px">${p.employeeCode}</span><br/>` +
        `Project: ${p.projectCode || '—'}<br/>` +
        `Status: <b style="color:${meta.color}">${meta.label}</b><br/>` +
        `Site: ${p.siteName || p.siteCode || '—'}<br/>` +
        `${distLabel}<br/>` +
        `Time: ${p.timeISO ? new Date(p.timeISO).toLocaleTimeString('th-TH') : '—'}` +
        `</div>`
      )
      marker.on('click', () => onFocus && onFocus(p.employeeCode))
      marker.addTo(layer)
      bounds.push([p.lat, p.lng])
    })

    if (bounds.length > 0) {
      try { mapInstance.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 }) } catch {}
    }
  }, [people, sites, ready])

  useEffect(() => {
    if (!focusKey || !mapInstance.current) return
    const target = people.find(p => p.employeeCode === focusKey)
    if (target && target.lat != null && target.lng != null) {
      mapInstance.current.setView([target.lat, target.lng], 16, { animate: true })
    }
  }, [focusKey])

  return (
    <div className="relative">
      <div ref={mapRef} style={{ width: '100%', height: 520, borderRadius: 12, overflow: 'hidden', background: '#e2e8f0' }} />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500 font-bold pointer-events-none">
          ⏳ Loading map…
        </div>
      )}
    </div>
  )
}

function MapLivePanel({ team, date }) {
  const [data, setData] = useState({ people: [], sites: [], meta: null })
  const [loading, setLoading] = useState(false)
  const [lastSync, setLastSync] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [focusCode, setFocusCode] = useState(null)

  function load() {
    setLoading(true)
    const qs = `team=${team}${date ? `&date_iso=${date}` : ''}`
    apiFetch(`/api/clock/monitor/today-map?${qs}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) setData({ people: d.people || [], sites: d.sites || [], meta: d.meta || null })
        setLastSync(new Date().toLocaleTimeString('th-TH'))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [team, date])

  const meta = data.meta || {}
  const filteredPeople = statusFilter === 'ALL'
    ? data.people
    : data.people.filter(p => p.status === statusFilter)
  const onSitePct = meta.totalPeople ? Math.round((meta.onSite || 0) / meta.totalPeople * 100) : 0

  return (
    <>
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div>
            <div className="font-black text-slate-900 text-sm">🗺 Live Map — Geofence Compliance</div>
            <div className="text-[.7rem] text-slate-500 mt-0.5">
              {meta.dateISO || '—'} · {meta.totalPeople || 0} people · {meta.onSite || 0} on-site ({onSitePct}%) · Sync {lastSync || '—'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-700"
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="ALL">All ({data.people.length})</option>
              <option value="on_site">🟢 On-site ({meta.onSite || 0})</option>
              <option value="off_site">🔴 Off-site ({meta.offSite || 0})</option>
              <option value="no_site">⚪ No-site ({meta.noSite || 0})</option>
              <option value="no_gps">⚫ No GPS ({meta.noGPS || 0})</option>
            </select>
            <button onClick={load} disabled={loading} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-60">
              {loading ? '⏳ Loading…' : '↺ Refresh'}
            </button>
          </div>
        </div>
        <div className="p-5">
          <MetricGrid metrics={[
            ['Total People', meta.totalPeople || 0, 'Started today'],
            ['On-site', meta.onSite || 0, `${onSitePct}% within geofence`],
            ['Off-site', meta.offSite || 0, 'Outside geofence radius'],
            ['No GPS / No Site', (meta.noGPS || 0) + (meta.noSite || 0), 'Cannot verify location'],
          ]} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 mt-4 xl:grid-cols-[2fr_1fr]">
        <CmCard title="🗺 Map — People & Geofences" subtitle={`Blue circles = site geofence · pin color = status`}>
          <LeafletMap people={filteredPeople} sites={data.sites} focusKey={focusCode} onFocus={setFocusCode} />
        </CmCard>

        <CmCard
          title="👥 People"
          badge={`${filteredPeople.length}`}
          subtitle="คลิกชื่อเพื่อ zoom ไปยังตำแหน่ง"
          actions={<ExportMenu
            filename={`ace-map-${meta.dateISO || todayISO()}`}
            title={`Map Live — ${meta.dateISO || todayISO()}`}
            subtitle={`Team: ${team} · ${filteredPeople.length} people`}
            columns={[
              { header: 'Code',     dataKey: 'employeeCode', width: 12 },
              { header: 'Name',     dataKey: 'name',         width: 22 },
              { header: 'Project',  dataKey: 'projectCode',  width: 12 },
              { header: 'Site',     dataKey: 'siteCode',     width: 18 },
              { header: 'Status',   dataKey: 'statusLabel',  width: 10 },
              { header: 'Distance', dataKey: 'distanceText', width: 10, align: 'right' },
              { header: 'Time',     dataKey: 'timeText',     width: 10, align: 'center' },
              { header: 'Lat',      dataKey: 'lat',          width: 10 },
              { header: 'Lng',      dataKey: 'lng',          width: 10 },
            ]}
            rows={filteredPeople.map(r => ({
              ...r,
              statusLabel: (STATUS_META[r.status] || STATUS_META.no_gps).label,
              distanceText: r.distanceM != null ? `${Math.round(r.distanceM)} m` : '—',
              timeText: r.timeISO ? timeOnly(r.timeISO) : '',
            }))}
          />}
        >
          <div className="max-h-[480px] overflow-y-auto">
            <CmTable headers={[
              { label: 'Person' },
              { label: 'Status',   align: 'center', width: 'w-24' },
              { label: 'Distance', align: 'right',  width: 'w-20' },
            ]}>
              {filteredPeople.map(row => {
                const m = STATUS_META[row.status] || STATUS_META.no_gps
                return (
                  <tr
                    key={row.employeeCode}
                    className={`hover:bg-blue-50/40 cursor-pointer ${focusCode === row.employeeCode ? 'bg-blue-50' : ''}`}
                    onClick={() => setFocusCode(row.employeeCode)}>
                    <td className="px-3 py-2">
                      <div className="font-black text-slate-900 text-[.78rem]">{row.name}</div>
                      <div className="text-[.66rem] text-slate-400">
                        {row.projectCode || '—'} · {row.siteCode || 'No site'}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-[.66rem] font-black ${m.bg} ${m.text}`}>
                        {m.label}
                      </span>
                    </td>
                    <td className={`px-3 py-2 text-right font-mono text-[.72rem] font-black ${row.status === 'off_site' ? 'text-red-600' : 'text-slate-600'}`}>
                      {row.distanceM != null ? `${Math.round(row.distanceM)} m` : '—'}
                    </td>
                  </tr>
                )
              })}
              {filteredPeople.length === 0 && (
                <tr><td colSpan={3} className="px-3 py-8 text-center text-sm text-slate-400">ไม่มีข้อมูลในตัวกรองนี้</td></tr>
              )}
            </CmTable>
          </div>
        </CmCard>
      </div>
    </>
  )
}

function AttendanceTrackerPanel({ month, team }) {
  const [data, setData] = useState({ summary: null, people: [], trend: [] })
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('')

  function load() {
    setLoading(true)
    apiFetch(`/api/clock/monitor/attendance-tracker?month=${month}&team=${team}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData({ summary: d.summary, people: d.people || [], trend: d.trend || [] }) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [month, team])

  const s = data.summary || {}
  const f = filter.trim().toLowerCase()
  const rows = data.people.filter(r => !f || [r.name, r.employeeCode, r.project].some(v => String(v || '').toLowerCase().includes(f)))
  const maxLate = Math.max(1, ...data.trend.map(t => t.avgLateMin ?? 0))

  return (
    <>
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div>
            <div className="font-black text-slate-900 text-sm">⏰ Attendance Tracker — {month}</div>
            <div className="text-[.7rem] text-slate-500 mt-0.5">
              เวลามาตรฐาน {s.workStart || '08:30'}–{s.workEnd || '17:00'} · สาย = ช้ากว่า {s.lateGraceMin || 15} นาที · วันทำงาน Mon-Sat ({s.calendarWorkdays || 0} วัน)
            </div>
          </div>
          <div className="flex gap-2">
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="🔎 ชื่อ/รหัส/โปรเจกต์"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700" />
            <button onClick={load} disabled={loading} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-60">
              {loading ? '⏳' : '↺ Refresh'}
            </button>
          </div>
        </div>
        <div className="p-5">
          <MetricGrid metrics={[
            ['People', s.people || 0, `Team ${team}`],
            ['Calendar Workdays', s.calendarWorkdays || 0, 'Mon-Sat in month'],
            ['Total Late Days', s.totalLateDays || 0, `> ${s.lateGraceMin || 15} min`],
            ['Total Early Leaves', s.totalEarlyLeaveDays || 0, `Before ${s.workEnd || '17:00'}`],
            ['Avg Attendance', `${s.avgAttendancePct || 0}%`, 'Working / calendar'],
          ]} />
        </div>
      </section>

      <CmCard title="📈 Punctuality Trend" subtitle={`Avg minutes late per day (across team) · Sunday = grey`} className="mt-4">
        <div className="flex items-end gap-1 px-2 py-3 h-40 border-b border-slate-100">
          {data.trend.map(t => {
            const h = t.sunday ? 6 : Math.max(4, Math.min(140, (t.avgLateMin || 0) / maxLate * 140))
            const color = t.sunday ? '#e2e8f0' : (t.avgLateMin > 15 ? '#dc2626' : t.avgLateMin > 5 ? '#f59e0b' : '#16a34a')
            return (
              <div key={t.day} className="flex flex-col items-center justify-end flex-1 min-w-[18px]" title={t.sunday ? 'Sunday' : `Day ${t.day}: ${t.avgLateMin} min late · ${t.lateCount}/${t.totalCount} late`}>
                <div style={{ height: h, background: color, width: '100%', borderRadius: '4px 4px 0 0' }} />
                <div className="text-[.55rem] font-bold text-slate-400 mt-1">{t.day}</div>
              </div>
            )
          })}
        </div>
        <div className="flex gap-4 px-3 py-2 text-[.68rem] font-bold text-slate-500">
          <span><span className="inline-block w-3 h-3 rounded mr-1" style={{ background: '#16a34a' }} /> on-time (≤5)</span>
          <span><span className="inline-block w-3 h-3 rounded mr-1" style={{ background: '#f59e0b' }} /> mild late (5-15)</span>
          <span><span className="inline-block w-3 h-3 rounded mr-1" style={{ background: '#dc2626' }} /> late (&gt;15)</span>
          <span><span className="inline-block w-3 h-3 rounded mr-1" style={{ background: '#e2e8f0' }} /> sunday</span>
        </div>
      </CmCard>

      <CmCard
        title="👥 Per-Person Attendance"
        badge={`${rows.length} คน`}
        className="mt-4"
        actions={<ExportMenu
          filename={`ace-attendance-${month}`}
          title={`Attendance Tracker — ${month}`}
          subtitle={`Team: ${team}`}
          columns={[
            { header: 'Code',         dataKey: 'employeeCode',     width: 12 },
            { header: 'Name',         dataKey: 'name',             width: 22 },
            { header: 'Project',      dataKey: 'project',          width: 10 },
            { header: 'Working Days', dataKey: 'workingDays',      width: 8,  align: 'center' },
            { header: 'Attendance %', dataKey: 'attendancePct',    width: 8,  align: 'right' },
            { header: 'Late Days',    dataKey: 'lateDays',         width: 8,  align: 'center' },
            { header: 'Avg Late Min', dataKey: 'avgLatePerLateDay',width: 10, align: 'right' },
            { header: 'Early Leaves', dataKey: 'earlyLeaveDays',   width: 10, align: 'center' },
            { header: 'Avg Clock In', dataKey: 'avgClockIn',       width: 10, align: 'center' },
            { header: 'Avg Clock Out',dataKey: 'avgClockOut',      width: 10, align: 'center' },
            { header: 'Total Hours',  dataKey: 'totalHours',       width: 10, align: 'right' },
          ]}
          rows={rows}
        />}>
        <CmTable headers={[
          { label: 'Person' },
          { label: 'Working / Calendar', align: 'center', width: 'w-32' },
          { label: 'Attend %', align: 'right',  width: 'w-24' },
          { label: 'Late Days', align: 'center', width: 'w-24' },
          { label: 'Avg Late', align: 'right',  width: 'w-24' },
          { label: 'Early Leaves', align: 'center', width: 'w-24' },
          { label: 'Avg In',  align: 'center', width: 'w-20' },
          { label: 'Avg Out', align: 'center', width: 'w-20' },
          { label: 'Total Hrs', align: 'right', width: 'w-24' },
        ]}>
          {rows.map(r => (
            <tr key={r.employeeCode} className="hover:bg-slate-50/60">
              <td className="px-3 py-2">
                <div className="font-black text-slate-900 text-[.82rem]">{r.name}</div>
                <div className="text-[.66rem] font-mono text-slate-400">{r.employeeCode} · {r.project}</div>
              </td>
              <td className="px-3 py-2 text-center font-mono text-[.76rem]">{r.workingDays}/{r.calendarWorkdays}</td>
              <td className="px-3 py-2 text-right font-black text-[.78rem]" style={{ color: r.attendancePct >= 95 ? '#16a34a' : r.attendancePct >= 80 ? '#f59e0b' : '#dc2626' }}>
                {r.attendancePct}%
              </td>
              <td className="px-3 py-2 text-center">
                {r.lateDays > 0
                  ? <span className="rounded-full bg-red-50 px-2 py-0.5 text-[.7rem] font-bold text-red-700">{r.lateDays} วัน</span>
                  : <span className="text-slate-400 text-[.7rem]">0</span>}
              </td>
              <td className={`px-3 py-2 text-right font-mono text-[.76rem] ${r.avgLatePerLateDay > 15 ? 'text-red-600 font-black' : 'text-slate-700'}`}>
                {r.lateDays > 0 ? `${r.avgLatePerLateDay} min` : '—'}
              </td>
              <td className="px-3 py-2 text-center">
                {r.earlyLeaveDays > 0
                  ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[.7rem] font-bold text-amber-700">{r.earlyLeaveDays} วัน</span>
                  : <span className="text-slate-400 text-[.7rem]">0</span>}
              </td>
              <td className="px-3 py-2 text-center font-mono text-[.74rem] text-slate-700">{r.avgClockIn}</td>
              <td className="px-3 py-2 text-center font-mono text-[.74rem] text-slate-700">{r.avgClockOut}</td>
              <td className="px-3 py-2 text-right font-mono text-[.76rem] font-black text-slate-800">{r.totalHours} hr</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={9} className="px-3 py-8 text-center text-sm text-slate-400">ไม่มีข้อมูล</td></tr>
          )}
        </CmTable>
      </CmCard>
    </>
  )
}


function MovementMap({ people, focusCode }) {
  const mapEl = useRef(null)
  const mapInstance = useRef(null)
  const layerRef = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const poll = setInterval(() => {
      if (window.L) { clearInterval(poll); if (!cancelled) setReady(true) }
    }, 100)
    setTimeout(() => clearInterval(poll), 8000)
    return () => { cancelled = true; clearInterval(poll) }
  }, [])

  useEffect(() => {
    if (!ready || !mapEl.current || mapInstance.current) return
    const L = window.L
    const map = L.map(mapEl.current, { zoomControl: true, scrollWheelZoom: true })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OSM' }).addTo(map)
    map.setView([13.7563, 100.5018], 6)
    mapInstance.current = map
    layerRef.current = L.layerGroup().addTo(map)
  }, [ready])

  useEffect(() => {
    if (!mapInstance.current || !layerRef.current || !window.L) return
    const L = window.L
    layerRef.current.clearLayers()
    const bounds = []
    const visible = focusCode ? people.filter(p => p.employeeCode === focusCode) : people

    visible.forEach((p, idx) => {
      const color = projectColor(p.project || p.employeeCode)
      const pts = (p.trail || []).filter(t => t.lat != null && t.lng != null).map(t => [t.lat, t.lng])
      if (pts.length >= 2) {
        L.polyline(pts, { color, weight: 3, opacity: 0.7, dashArray: '4 4' }).addTo(layerRef.current)
      }
      p.trail.forEach((t, i) => {
        if (t.lat == null || t.lng == null) return
        const isStart = i === 0
        const isEnd = i === p.trail.length - 1
        const size = isStart ? 16 : isEnd ? 14 : 10
        const label = isStart ? 'S' : isEnd ? 'E' : (i + 1)
        const html = `<div style="background:${color};color:#fff;border:2px solid #fff;border-radius:50%;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;box-shadow:0 2px 4px rgba(0,0,0,.4)">${label}</div>`
        const icon = L.divIcon({ className: 'ace-trail', html, iconSize: [size, size], iconAnchor: [size / 2, size / 2] })
        L.marker([t.lat, t.lng], { icon })
          .bindPopup(`<b>${p.name}</b><br/>${t.type === 'in' ? 'Clock In' : 'Clock Out'}<br/>${new Date(t.time).toLocaleTimeString('th-TH')}<br/>${t.siteCode || ''}`)
          .addTo(layerRef.current)
        bounds.push([t.lat, t.lng])
      })
    })
    if (bounds.length > 0) {
      try { mapInstance.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 }) } catch {}
    }
  }, [people, focusCode, ready])

  return (
    <div className="relative">
      <div ref={mapEl} style={{ width: '100%', height: 480, borderRadius: 12, background: '#e2e8f0' }} />
      {!ready && <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-500 pointer-events-none">⏳ Loading map…</div>}
    </div>
  )
}

function CoverageMap({ points }) {
  const mapEl = useRef(null)
  const mapInstance = useRef(null)
  const layerRef = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const poll = setInterval(() => {
      if (window.L) { clearInterval(poll); if (!cancelled) setReady(true) }
    }, 100)
    setTimeout(() => clearInterval(poll), 8000)
    return () => { cancelled = true; clearInterval(poll) }
  }, [])

  useEffect(() => {
    if (!ready || !mapEl.current || mapInstance.current) return
    const L = window.L
    const map = L.map(mapEl.current, { zoomControl: true, scrollWheelZoom: true })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OSM' }).addTo(map)
    map.setView([13.7563, 100.5018], 6)
    mapInstance.current = map
    layerRef.current = L.layerGroup().addTo(map)
  }, [ready])

  useEffect(() => {
    if (!mapInstance.current || !layerRef.current || !window.L) return
    const L = window.L
    layerRef.current.clearLayers()
    const bounds = []
    const maxW = Math.max(1, ...points.map(p => p.weight))
    points.forEach(p => {
      const intensity = p.weight / maxW
      const radius = 40 + intensity * 200
      const color = intensity > 0.66 ? '#dc2626' : intensity > 0.33 ? '#f59e0b' : '#1d4ed8'
      L.circle([p.lat, p.lng], {
        radius,
        color,
        weight: 0,
        fillColor: color,
        fillOpacity: 0.25 + intensity * 0.35,
      }).bindPopup(`${p.weight} clock-ins<br/>${p.lat}, ${p.lng}`).addTo(layerRef.current)
      bounds.push([p.lat, p.lng])
    })
    if (bounds.length > 0) {
      try { mapInstance.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 }) } catch {}
    }
  }, [points, ready])

  return (
    <div className="relative">
      <div ref={mapEl} style={{ width: '100%', height: 480, borderRadius: 12, background: '#e2e8f0' }} />
      {!ready && <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-500 pointer-events-none">⏳ Loading map…</div>}
    </div>
  )
}

function MovementPanel({ date, team }) {
  const [data, setData] = useState({ meta: null, people: [] })
  const [coverage, setCoverage] = useState({ meta: null, points: [] })
  const [loading, setLoading] = useState(false)
  const [focusCode, setFocusCode] = useState(null)
  const [coverageDays, setCoverageDays] = useState(30)
  const [tab, setTab] = useState('trail')

  function load() {
    setLoading(true)
    apiFetch(`/api/clock/monitor/movement?date_iso=${date}&team=${team}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData({ meta: d.meta, people: d.people || [] }) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  function loadCoverage() {
    apiFetch(`/api/clock/monitor/coverage?days=${coverageDays}&team=${team}${focusCode ? `&employee_code=${focusCode}` : ''}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setCoverage({ meta: d.meta, points: d.points || [] }) })
      .catch(() => {})
  }
  useEffect(() => { load() }, [date, team])
  useEffect(() => { if (tab === 'coverage') loadCoverage() }, [tab, coverageDays, team, focusCode])

  const meta = data.meta || {}
  const people = data.people
  const focused = focusCode ? people.find(p => p.employeeCode === focusCode) : null

  return (
    <>
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div>
            <div className="font-black text-slate-900 text-sm">🛣 Movement & Coverage — {meta.dateISO || date}</div>
            <div className="text-[.7rem] text-slate-500 mt-0.5">Trail / Time-at-site / Travel / Sites visited / Coverage heatmap</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setTab('trail')} className={`rounded-lg px-3 py-1.5 text-xs font-black ${tab === 'trail' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>🛣 Trail (Today)</button>
            <button onClick={() => setTab('coverage')} className={`rounded-lg px-3 py-1.5 text-xs font-black ${tab === 'coverage' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>🔥 Coverage</button>
            <button onClick={tab === 'trail' ? load : loadCoverage} disabled={loading} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-60">↺</button>
          </div>
        </div>
        <div className="p-5">
          {tab === 'trail' ? (
            <MetricGrid metrics={[
              ['People', meta.people || 0, `On ${date}`],
              ['Total Sites Visited', meta.totalSites || 0, 'Sum across team'],
              ['Total Distance', `${meta.totalDistanceKm || 0} km`, 'Inter-site travel'],
              ['Focus', focused ? focused.name : '— All —', focused ? `${focused.sitesVisited} sites` : 'Click a person'],
            ]} />
          ) : (
            <MetricGrid metrics={[
              ['Coverage Days', coverage.meta?.days || coverageDays, `${coverage.meta?.from || ''} → ${coverage.meta?.to || ''}`],
              ['Total Clock-Ins', coverage.meta?.totalClockIns || 0, 'All sessions'],
              ['Unique Points', coverage.meta?.totalPoints || 0, '~11m grid'],
              ['Focus', focusCode || '— All people —', focusCode ? 'Single person' : 'Whole team'],
            ]} />
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 mt-4 xl:grid-cols-[2fr_1fr]">
        <CmCard title={tab === 'trail' ? `🛣 Daily Trail Map` : `🔥 Coverage Heatmap (${coverageDays} วันล่าสุด)`}>
          {tab === 'trail' ? (
            <MovementMap people={people} focusCode={focusCode} />
          ) : (
            <>
              <div className="flex gap-2 mb-3">
                {[7, 30, 90, 365].map(d => (
                  <button key={d} onClick={() => setCoverageDays(d)} className={`rounded-lg px-3 py-1 text-xs font-black ${coverageDays === d ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
                    {d} วัน
                  </button>
                ))}
                {focusCode && <button onClick={() => setFocusCode(null)} className="rounded-lg px-3 py-1 text-xs font-black bg-slate-100 text-slate-600">✕ Clear focus</button>}
              </div>
              <CoverageMap points={coverage.points} />
            </>
          )}
        </CmCard>

        <CmCard title="👥 Per-Person Movement"
          badge={`${people.length}`}
          actions={<ExportMenu
            filename={`ace-movement-${date}`}
            title={`Movement — ${date}`}
            subtitle={`Team: ${team}`}
            columns={[
              { header: 'Code',           dataKey: 'employeeCode',  width: 12 },
              { header: 'Name',           dataKey: 'name',          width: 22 },
              { header: 'Project',        dataKey: 'project',       width: 10 },
              { header: 'Sites Visited',  dataKey: 'sitesVisited',  width: 10, align: 'center' },
              { header: 'Sessions',       dataKey: 'sessionCount',  width: 8,  align: 'center' },
              { header: 'Time at Site',   dataKey: 'timeAtSiteText',width: 12, align: 'center' },
              { header: 'Travel Time',    dataKey: 'travelText',    width: 12, align: 'center' },
              { header: 'Distance (km)',  dataKey: 'distanceKm',    width: 12, align: 'right' },
            ]}
            rows={people}
          />}>
          <div className="max-h-[460px] overflow-y-auto">
            <CmTable headers={[
              { label: 'Person' },
              { label: 'Sites', align: 'center', width: 'w-16' },
              { label: 'At Site', align: 'center', width: 'w-24' },
              { label: 'Travel', align: 'center', width: 'w-20' },
              { label: 'KM', align: 'right', width: 'w-16' },
            ]}>
              {people.map(p => (
                <tr key={p.employeeCode}
                  onClick={() => setFocusCode(focusCode === p.employeeCode ? null : p.employeeCode)}
                  className={`cursor-pointer hover:bg-blue-50/40 ${focusCode === p.employeeCode ? 'bg-blue-50' : ''}`}>
                  <td className="px-3 py-2">
                    <div className="font-black text-slate-900 text-[.78rem]">{p.name}</div>
                    <div className="text-[.66rem] font-mono text-slate-400">{p.employeeCode} · {p.project}</div>
                  </td>
                  <td className="px-3 py-2 text-center font-mono text-[.76rem] font-black text-slate-800">{p.sitesVisited}</td>
                  <td className="px-3 py-2 text-center font-mono text-[.72rem] text-slate-700">{p.timeAtSiteText || '—'}</td>
                  <td className="px-3 py-2 text-center font-mono text-[.72rem] text-slate-600">{p.travelText || '—'}</td>
                  <td className="px-3 py-2 text-right font-mono text-[.72rem] font-black text-slate-800">{p.distanceKm}</td>
                </tr>
              ))}
              {people.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-sm text-slate-400">ไม่มีข้อมูลในวันนี้</td></tr>
              )}
            </CmTable>
          </div>
        </CmCard>
      </div>
    </>
  )
}


function AdminAttentionPanel({ team, date }) {
  const [data, setData] = useState({ notClockedInToday: [], incompleteYesterday: [], meta: null })
  const [loading, setLoading] = useState(false)
  const [lastSync, setLastSync] = useState('')
  const [filter, setFilter] = useState('')

  function load() {
    setLoading(true)
    const qs = `team=${team}${date ? `&date_iso=${date}` : ''}`
    apiFetch(`/api/clock/monitor/admin-attention?${qs}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) setData({
          notClockedInToday: d.notClockedInToday || [],
          incompleteYesterday: d.incompleteYesterday || [],
          meta: d.meta || null,
        })
        setLastSync(new Date().toLocaleTimeString('th-TH'))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [team, date])

  const f = filter.trim().toLowerCase()
  const matchRow = row => !f || [row.name, row.employeeCode, row.project, row.position]
    .some(v => String(v || '').toLowerCase().includes(f))

  const notIn = data.notClockedInToday.filter(matchRow)
  const incomp = data.incompleteYesterday.filter(matchRow)
  const meta = data.meta || {}
  const headcount = meta.activeHeadcount || 0
  const inPct = headcount ? Math.round((headcount - data.notClockedInToday.length) / headcount * 100) : 0

  return (
    <>
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div>
            <div className="font-black text-slate-900 text-sm">🚨 Admin Attention — รายชื่อที่ต้องตรวจสอบ</div>
            <div className="text-[.7rem] text-slate-500 mt-0.5">
              วันนี้ {meta.today || '—'} · เมื่อวาน {meta.yesterday || '—'} · Team: {team} · Sync: {lastSync || '—'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="🔎 ค้นหาชื่อ/รหัส/โปรเจกต์"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-200"
            />
            <button onClick={load} disabled={loading} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-60">
              {loading ? '⏳ Loading…' : '↺ Refresh'}
            </button>
          </div>
        </div>
        <div className="p-5">
          <MetricGrid metrics={[
            ['Active Headcount', headcount, `Team ${team}`],
            ['Clocked-in Today', headcount - data.notClockedInToday.length, `${inPct}%`],
            ['ยังไม่ Clock-in วันนี้', data.notClockedInToday.length, 'ต้องตรวจ/ตามด่วน'],
            ['เมื่อวานทำไม่ครบ', data.incompleteYesterday.length, 'ขาดออก/ขาด GPS'],
          ]} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 mt-4">
        <CmCard
          title={`❌ ยังไม่ Clock-in วันนี้ (${meta.today || '—'})`}
          badge={`${notIn.length} คน`}
          badgeStyle={notIn.length > 0 ? { background: '#fee2e2', color: '#991b1b' } : { background: '#dcfce7', color: '#166534' }}
          subtitle="พนักงาน ACTIVE ที่ระบบยังไม่มีบันทึก clock-in สำหรับวันนี้"
          actions={<ExportMenu
            filename={`ace-not-clocked-in-${meta.today || todayISO()}`}
            title={`ยังไม่ Clock-in วันนี้ — ${meta.today || todayISO()}`}
            subtitle={`Team: ${team} · ${notIn.length} คน`}
            columns={[
              { header: 'Code',     dataKey: 'employeeCode', width: 14 },
              { header: 'Name',     dataKey: 'name',         width: 26 },
              { header: 'Project',  dataKey: 'project',      width: 12 },
              { header: 'Position', dataKey: 'position',     width: 18 },
              { header: 'Email',    dataKey: 'email',        width: 24 },
            ]}
            rows={notIn}
          />}
        >
          {notIn.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm font-bold text-emerald-700 bg-emerald-50/50 rounded-xl border border-emerald-100">
              ✓ ทุกคนใน Team {team} clock-in ครบแล้ววันนี้
            </div>
          ) : (
            <CmTable headers={[
              { label: 'Code',     width: 'w-28' },
              { label: 'Name' },
              { label: 'Project',  width: 'w-24' },
              { label: 'Position' },
              { label: 'Email' },
            ]}>
              {notIn.map(row => (
                <tr key={row.employeeCode} className="hover:bg-red-50/30">
                  <td className="px-3 py-2 font-mono text-[.72rem] text-slate-700">{row.employeeCode}</td>
                  <td className="px-3 py-2 font-black text-slate-900 text-[.82rem]">{row.name}</td>
                  <td className="px-3 py-2 text-[.78rem] text-slate-600">{row.project || '—'}</td>
                  <td className="px-3 py-2 text-[.76rem] text-slate-600">{row.position || '—'}</td>
                  <td className="px-3 py-2 text-[.74rem] text-slate-500">{row.email || '—'}</td>
                </tr>
              ))}
            </CmTable>
          )}
        </CmCard>

        <CmCard
          title={`⚠ เมื่อวานทำไม่ครบ (${meta.yesterday || '—'})`}
          badge={`${incomp.length} เซสชัน`}
          badgeStyle={incomp.length > 0 ? { background: '#fef3c7', color: '#92400e' } : { background: '#dcfce7', color: '#166534' }}
          subtitle="เซสชันเมื่อวานที่ขาด clock-out หรือไม่มี GPS"
          actions={<ExportMenu
            filename={`ace-incomplete-${meta.yesterday || todayISO()}`}
            title={`เมื่อวานทำไม่ครบ — ${meta.yesterday || todayISO()}`}
            subtitle={`Team: ${team} · ${incomp.length} เซสชัน`}
            columns={[
              { header: 'Code',      dataKey: 'employeeCode', width: 14 },
              { header: 'Name',      dataKey: 'name',         width: 24 },
              { header: 'Project',   dataKey: 'project',      width: 12 },
              { header: 'Clock In',  dataKey: 'clockIn',      width: 12, align: 'center' },
              { header: 'Clock Out', dataKey: 'clockOut',     width: 12, align: 'center' },
              { header: 'GPS',       dataKey: 'gpsLabel',     width: 8,  align: 'center' },
              { header: 'Site',      dataKey: 'site',         width: 18 },
              { header: 'Issues',    dataKey: 'issuesText',   width: 24 },
            ]}
            rows={incomp.map(r => ({ ...r, gpsLabel: r.hasGPS ? 'Yes' : 'No', issuesText: (r.issues || []).join(', ') }))}
          />}
        >
          {incomp.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm font-bold text-emerald-700 bg-emerald-50/50 rounded-xl border border-emerald-100">
              ✓ เมื่อวานทุกคน clock-in/out ครบและมี GPS
            </div>
          ) : (
            <CmTable headers={[
              { label: 'Code',     width: 'w-28' },
              { label: 'Name' },
              { label: 'Project',  width: 'w-24' },
              { label: 'Clock In',  align: 'center', width: 'w-24' },
              { label: 'Clock Out', align: 'center', width: 'w-24' },
              { label: 'GPS',       align: 'center', width: 'w-16' },
              { label: 'Site' },
              { label: 'Issues' },
            ]}>
              {incomp.map(row => (
                <tr key={row.sessionId} className="hover:bg-amber-50/40">
                  <td className="px-3 py-2 font-mono text-[.72rem] text-slate-700">{row.employeeCode}</td>
                  <td className="px-3 py-2">
                    <div className="font-black text-slate-900 text-[.82rem]">{row.name}</div>
                    {row.position && <div className="text-[.66rem] text-slate-400">{row.position}</div>}
                  </td>
                  <td className="px-3 py-2 text-[.78rem] text-slate-600">{row.project || '—'}</td>
                  <td className="px-3 py-2 text-center font-mono text-[.74rem] text-slate-700">{row.clockIn || '—'}</td>
                  <td className={`px-3 py-2 text-center font-mono text-[.74rem] ${row.clockOut ? 'text-slate-700' : 'text-red-600 font-black'}`}>
                    {row.clockOut || 'MISSING'}
                  </td>
                  <td className="px-3 py-2 text-center text-[.74rem]">
                    {row.hasGPS
                      ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[.68rem] font-bold text-emerald-700">✓</span>
                      : <span className="rounded-full bg-red-50 px-2 py-0.5 text-[.68rem] font-bold text-red-700">✗</span>}
                  </td>
                  <td className="px-3 py-2 text-[.74rem] text-slate-600">{row.site || '—'}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {(row.issues || []).map(iss => (
                        <span key={iss} className="rounded-full bg-amber-100 px-2 py-0.5 text-[.66rem] font-bold text-amber-800">
                          {iss}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </CmTable>
          )}
        </CmCard>
      </div>
    </>
  )
}

function HealthPanel() {
  const [health, setHealth] = useState(null)
  const [lastChecked, setLastChecked] = useState(null)

  function runHealthCheck() {
    setHealth(null)
    const today = todayISO()
    const month = today.slice(0, 7)
    Promise.all([
      apiFetch(`/api/clock/monitor/events?date_from=${today}&date_to=${today}`).then(r => r.ok ? r.json() : null),
      apiFetch('/api/clock/monitor/roster').then(r => r.ok ? r.json() : null),
      apiFetch('/api/clock/monitor/headcount?months=12').then(r => r.ok ? r.json() : null),
      apiFetch(`/api/clock/monitor/compliance?month=${month}`).then(r => r.ok ? r.json() : null),
      apiFetch(`/api/clock/monitor/today-executive?team=ALL`).then(r => r.ok ? r.json() : null),
    ]).then(([ev, roster, hc, cmp, today_exec]) => {
      setHealth({
        events: ev?.events?.length ?? ev?.count ?? 0,
        roster: roster?.roster?.length ?? 0,
        headcount: hc?.months?.length ?? 0,
        compliance: cmp?.avg?.totalHeadcount ?? 0,
        today_exec: today_exec?.data?.length ?? 0,
      })
      setLastChecked(new Date())
    }).catch(() => {})
  }

  useEffect(() => { runHealthCheck() }, [])

  const today = todayISO()
  const month = today.slice(0, 7)
  const checks = health ? [
    [`Clock Sessions (${today})`,    health.events > 0,      `${health.events} events`,      '/api/clock/monitor/events'],
    ['Employee Roster',              health.roster > 0,      `${health.roster} employees`,   '/api/clock/monitor/roster'],
    ['Headcount Data (12 months)',   health.headcount > 0,   `${health.headcount} months`,   '/api/clock/monitor/headcount'],
    [`Compliance (${month})`,        health.compliance > 0,  `${health.compliance} sessions`, '/api/clock/monitor/compliance'],
    ['Today Executive feed',         health.today_exec > 0,  `${health.today_exec} people`,  '/api/clock/monitor/today-executive'],
  ] : []

  const okCount = checks.filter(c => c[1]).length
  const overallOk = checks.length > 0 && okCount === checks.length

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="font-black text-slate-900 text-sm">🩺 Health Check</div>
          {health && (
            <span className={`rounded-full px-2.5 py-1 text-[.7rem] font-black ${overallOk ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {overallOk ? `✓ All systems OK (${okCount}/${checks.length})` : `⚠ ${okCount}/${checks.length} OK`}
            </span>
          )}
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[.7rem] font-bold text-blue-700">Asia/Bangkok (UTC+7)</span>
        </div>
        <div className="flex items-center gap-2">
          {lastChecked && <span className="text-[.7rem] text-slate-500">Last check: {lastChecked.toLocaleTimeString()}</span>}
          <button onClick={runHealthCheck} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-50">↻ Re-check</button>
        </div>
      </div>
      {!health ? (
        <div className="p-12 text-center text-slate-400 font-bold">Running health checks…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2 text-left text-[.7rem] font-black uppercase tracking-wider text-slate-600">Source</th>
                <th className="px-4 py-2 text-center text-[.7rem] font-black uppercase tracking-wider text-slate-600 w-24">Status</th>
                <th className="px-4 py-2 text-left text-[.7rem] font-black uppercase tracking-wider text-slate-600">Info</th>
                <th className="px-4 py-2 text-left text-[.7rem] font-black uppercase tracking-wider text-slate-600">Endpoint</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {checks.map(([label, ok, info, endpoint]) => (
                <tr key={label} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2 font-bold text-slate-900 text-[.82rem]">{label}</td>
                  <td className="px-4 py-2 text-center">
                    {ok
                      ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[.66rem] font-black text-emerald-700">✓ OK</span>
                      : <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[.66rem] font-black text-amber-700">⚠ Missing</span>
                    }
                  </td>
                  <td className="px-4 py-2 font-mono text-[.78rem] text-slate-600">{info}</td>
                  <td className="px-4 py-2 font-mono text-[.7rem] text-slate-400">{endpoint}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

const LEAVE_STATUS_STYLE = {
  PENDING_PM:  { bg: '#fff8e1', color: '#f59e0b', label: 'Pending PM' },
  PENDING_SPM: { bg: '#fff3cd', color: '#d97706', label: 'Pending Senior PM' },
  PENDING_DC:  { bg: '#fff3e0', color: '#ea8a00', label: 'Pending PD' },
  PENDING_HR:  { bg: '#e8f0fe', color: '#2447d8', label: 'Pending HR' },
  APPROVED:    { bg: '#e8f5e9', color: '#16a34a', label: 'Approved' },
  REJECTED:    { bg: '#fdecea', color: '#dc2626', label: 'Rejected' },
  CANCELLED:   { bg: '#f3f4f6', color: '#6b7280', label: 'Cancelled' },
  PENDING:     { bg: '#fff8e1', color: '#f59e0b', label: 'Pending PM' },
}

const SICK_TYPES = ['Sick Leave', 'Sick', 'Medical Leave']

function ApprovalChain({ lv, chainMode }) {
  const isSick = SICK_TYPES.includes(lv.leaveType)
  const needsPD = !isSick && lv.leaveType !== 'Personal Leave'
  const steps = [
    { key: 'pm',  label: 'PM', byField: 'pmApprovedBy', show: !isSick },
    { key: 'pd',  label: 'PD', byField: 'dcApprovedBy', show: needsPD },
    { key: 'hr',  label: 'HR', byField: 'hrAcknowledgedBy', show: isSick },
    { key: 'ack', label: 'HR+Boss', byField: 'reviewedBy', show: !isSick },
  ]
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
      {steps.filter(st => st.show).map(st => {
        const done = !!lv[st.byField]
        const rejected = lv.status === 'REJECTED' && lv.rejectAtStep === st.label
        return (
          <span key={st.key} title={lv[st.byField] || ''}
            style={{ fontSize: '.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: 10,
              background: rejected ? '#fdecea' : done ? '#e8f5e9' : '#f1f5f9',
              color: rejected ? '#dc2626' : done ? '#16a34a' : '#94a3b8' }}>
            {st.label} {rejected ? '✗' : done ? '✓' : '…'}
          </span>
        )
      })}
      {isSick && <span style={{ fontSize: '.68rem', color: '#94a3b8', padding: '1px 4px' }}>Sick: HR only</span>}
    </div>
  )
}

function LeaveAdminPanel() {
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCode, setFilterCode] = useState('')
  const [rejectId, setRejectId] = useState(null)
  const [rejectStep, setRejectStep] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [actorCode, setActorCode] = useState('Admin')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  async function fetchLeaves() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.set('status', filterStatus)
      if (filterCode) params.set('employee_code', filterCode)
      const res = await apiFetch(`/api/leave/admin?${params}`)
      if (res.ok) { const data = await res.json(); setLeaves(data.leaves || []) }
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => { fetchLeaves() }, [filterStatus, filterCode])

  async function stepAction(endpoint, id, extraBody = {}) {
    setBusy(true); setMsg(null)
    try {
      const res = await apiFetch(`/api/leave/${id}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor_code: actorCode, ...extraBody }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) { setMsg({ ok: true, text: 'Done.' }); fetchLeaves() }
      else { setMsg({ ok: false, text: data.detail || 'Error' }) }
    } catch (e) { setMsg({ ok: false, text: e?.message || 'Network error' }) }
    setBusy(false)
  }

  async function confirmReject() {
    if (!rejectReason.trim()) { setMsg({ ok: false, text: 'Reject reason is required.' }); return }
    await stepAction(rejectStep, rejectId, { reject_reason: rejectReason })
    setRejectId(null); setRejectStep(''); setRejectReason('')
  }

  const pending = leaves.filter(l => ['PENDING_PM', 'PENDING_DC', 'PENDING_HR', 'PENDING'].includes(l.status))

  const ACT_BTN = 'rounded-lg px-2.5 py-1 text-[.7rem] font-black text-white shadow-sm transition disabled:opacity-50'

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-3">
        <div className="font-black text-slate-900 text-sm">🌴 Leave Requests</div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[.7rem] font-bold text-blue-700">{leaves.length} total · {pending.length} pending</span>
        <span className="ml-auto text-[.72rem] text-slate-500 font-semibold">Sick: HR · Personal: PM · Annual/Other: PM→PD</span>
      </div>

      <div className="p-5">
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <CmField label="Status">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={CM_INPUT_CLS}>
              <option value="">All Status</option>
              {['PENDING_PM', 'PENDING_DC', 'PENDING_HR', 'APPROVED', 'REJECTED', 'CANCELLED'].map(v =>
                <option key={v} value={v}>{LEAVE_STATUS_STYLE[v]?.label || v}</option>
              )}
            </select>
          </CmField>
          <CmField label="Employee Code">
            <input value={filterCode} onChange={e => setFilterCode(e.target.value)} placeholder="ACE..." className={CM_INPUT_CLS} />
          </CmField>
          <CmField label="Your Code (Approver)">
            <input value={actorCode} onChange={e => setActorCode(e.target.value)} placeholder="Approver code…" className={CM_INPUT_CLS} title="Your employee code — recorded as approver" />
          </CmField>
          <button onClick={fetchLeaves} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600 shadow-sm hover:bg-slate-50">↻ Refresh</button>
        </div>

        {msg && (
          <div className={`mb-3 rounded-xl px-3 py-2 text-sm font-bold ${msg.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {msg.text}
          </div>
        )}

        {loading ? (
          <div className="text-center text-slate-400 font-bold py-8">Loading…</div>
        ) : leaves.length === 0 ? (
          <div className="text-center text-slate-400 font-bold py-8">No leave requests found.</div>
        ) : (
          <CmTable headers={[
            { label: 'ID', width: 'w-12' }, { label: 'Employee' }, { label: 'Type' },
            { label: 'Dates' }, { label: 'Days', align: 'center', width: 'w-12' },
            { label: 'Status / Chain' }, { label: 'Reason' }, { label: 'Actions' },
          ]}>
            {leaves.map(lv => {
              const st = LEAVE_STATUS_STYLE[lv.status] || LEAVE_STATUS_STYLE.PENDING_PM
              return (
                <Fragment key={lv.id}>
                  <tr className="hover:bg-slate-50/60">
                    <td className="px-3 py-2 font-mono text-[.7rem] text-slate-500">{lv.id}</td>
                    <td className="px-3 py-2">
                      <div className="font-black text-slate-900 text-[.82rem]">{lv.employeeName}</div>
                      <div className="text-[.66rem] font-mono text-slate-400">{lv.employeeCode}</div>
                    </td>
                    <td className="px-3 py-2 text-[.78rem] text-slate-700">
                      {lv.leaveType}
                      <div className="text-[.66rem] text-slate-400">{lv.sessionType}</div>
                    </td>
                    <td className="px-3 py-2 text-[.74rem] text-slate-600">
                      {lv.startDate}{lv.endDate !== lv.startDate && <><br /><span className="text-slate-400">→ {lv.endDate}</span></>}
                    </td>
                    <td className="px-3 py-2 text-center font-black text-slate-900 text-[.82rem]">{lv.days}</td>
                    <td className="px-3 py-2">
                      <span className="rounded-full px-2 py-0.5 text-[.7rem] font-bold" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                      <ApprovalChain lv={lv} />
                    </td>
                    <td className="px-3 py-2 text-[.74rem] text-slate-600 max-w-[180px] break-words">
                      {lv.reason || '—'}
                      {lv.status === 'REJECTED' && lv.rejectReason && <div className="text-red-600 mt-1">↳ {lv.rejectReason}</div>}
                    </td>
                    <td className="px-3 py-2">
                      {(lv.status === 'PENDING_PM' || lv.status === 'PENDING') && (
                        <div className="flex flex-wrap gap-1">
                          <button disabled={busy} onClick={() => stepAction('pm-approve', lv.id)} className={`${ACT_BTN} bg-emerald-600 hover:bg-emerald-700`}>PM ✓</button>
                          <button disabled={busy} onClick={() => { setRejectId(lv.id); setRejectStep('pm-reject'); setRejectReason(''); setMsg(null) }} className={`${ACT_BTN} bg-red-600 hover:bg-red-700`}>PM ✗</button>
                        </div>
                      )}
                      {lv.status === 'PENDING_DC' && (
                        <div className="flex flex-wrap gap-1">
                          <button disabled={busy} onClick={() => stepAction('pd-approve', lv.id)} className={`${ACT_BTN} bg-amber-600 hover:bg-amber-700`}>PD ✓</button>
                          <button disabled={busy} onClick={() => { setRejectId(lv.id); setRejectStep('pd-reject'); setRejectReason(''); setMsg(null) }} className={`${ACT_BTN} bg-red-600 hover:bg-red-700`}>PD ✗</button>
                        </div>
                      )}
                      {lv.status === 'PENDING_HR' && (
                        <button disabled={busy} onClick={() => stepAction('hr-acknowledge', lv.id)} className={`${ACT_BTN} bg-blue-600 hover:bg-blue-700`}>HR Ack</button>
                      )}
                      {lv.status === 'APPROVED' && <span className="text-[.72rem] font-bold text-emerald-600">✓ Approved</span>}
                      {lv.status === 'REJECTED' && <span className="text-[.72rem] font-bold text-red-600">✗ Rejected at {lv.rejectAtStep}</span>}
                    </td>
                  </tr>
                  {rejectId === lv.id && (
                    <tr>
                      <td colSpan={8} className="bg-red-50 px-3 py-3">
                        <div className="flex items-center gap-2">
                          <input
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="Reject reason (required)…"
                            className={CM_INPUT_CLS + ' flex-1'}
                          />
                          <button disabled={busy} onClick={confirmReject} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-black text-white shadow hover:bg-red-700 disabled:opacity-50">Confirm Reject</button>
                          <button onClick={() => { setRejectId(null); setRejectStep('') }} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-600 hover:bg-slate-50">Cancel</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </CmTable>
        )}
      </div>
    </section>
  )
}

const NAV_ICONS = {
  daily: CalendarDays, weekly: CalendarRange, monthly: CalendarClock, individual: UserRound,
  dailyCheck: ClipboardCheck, manualEntry: ClipboardPen, workLocations: MapPinned,
  executive: ChartColumn, todayExec: MapPin, mapLive: MapIcon, attendance: Clock,
  movement: Route, admin: Siren, health: Stethoscope, leave: TreePalm,
}

function Sidebar({ page, setPage, user }) {
  return (
    <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white/95 p-5 shadow-2xl backdrop-blur lg:sticky lg:top-0 lg:flex lg:h-screen lg:shadow-none lg:overflow-y-auto">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${ACE_BLUE}, ${ACE_RED})` }}>
          <Timer size={22} strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <div className="text-base font-black text-slate-950">ACE Clock Monitor</div>
          <div className="text-xs font-bold text-slate-400">DTE / RF / TE Operations</div>
        </div>
      </div>

      <nav className="mt-9 space-y-1">
        {NAV.map(([id, label]) => {
          const active = id === page
          const Icon = NAV_ICONS[id]
          return (
            <button
              key={id}
              type="button"
              onClick={() => setPage(id)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-sm font-black transition ${active ? 'bg-blue-50 text-[#2447d8] shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'}`}
            >
              {Icon ? <Icon size={18} strokeWidth={active ? 2.5 : 2} /> : <span>•</span>}
              <span>{label}</span>
            </button>
          )
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-sm font-black text-slate-900">
          <Sparkles size={16} className="text-blue-600" /> Operations Workspace
        </div>
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
          Real-time attendance · GPS · Photo verification · Daily executive view.
        </p>
      </div>
    </aside>
  )
}

const METRIC_COLORS = ['#2447d8', '#16a34a', '#0891b2', '#dc2626', '#6d3f8f', '#ca8a04']
const METRIC_ICONS = [Users, CircleCheck, MapPin, TriangleAlert]

function MetricGrid({ metrics, compact = false }) {
  return (
    <section className={compact ? 'grid grid-cols-1 gap-3 sm:grid-cols-2' : 'grid grid-cols-2 gap-3 sm:grid-cols-4'}>
      {metrics.map(([label, value, note], i) => {
        const Icon = METRIC_ICONS[i % METRIC_ICONS.length]
        const color = METRIC_COLORS[i % METRIC_COLORS.length]
        return (
          <div key={label} className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_24px_70px_rgba(36,71,216,0.12)]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `${color}12`, color }}>
                <Icon size={21} strokeWidth={2.3} />
              </div>
            </div>
            <div className="mt-5 truncate text-sm font-bold text-slate-500">{label}</div>
            <div className="mt-2 text-3xl font-black leading-none tracking-normal" style={{ color }}>{value}</div>
            {note && <div className="mt-2 min-h-[16px] text-xs font-semibold text-slate-400">{note}</div>}
          </div>
        )
      })}
    </section>
  )
}

function PseudoMap({ events, height = 240, maxPoints = 200, projectStats = null }) {
  const [showOverlay, setShowOverlay] = useState(true)
  const [showProjectPanel, setShowProjectPanel] = useState(true)
  const mapEl = useRef(null)
  const mapInstance = useRef(null)
  const layerRef = useRef(null)
  const [ready, setReady] = useState(false)

  const points = events
    .filter(row => row.lat != null && row.lng != null)
    .map(row => ({ ...row, lat: Number(row.lat), lng: Number(row.lng) }))
    .filter(row => Number.isFinite(row.lat) && Number.isFinite(row.lng) && row.lat !== 0 && row.lng !== 0)
    .slice(0, maxPoints)

  const latest = points.length
    ? points.slice().sort((a, b) => String(b.time || '').localeCompare(String(a.time || '')))[0]
    : null

  // Wait for Leaflet CDN script to be ready
  useEffect(() => {
    let cancelled = false
    function check() {
      if (window.L) { if (!cancelled) setReady(true); return }
      const t = setInterval(() => {
        if (window.L) { clearInterval(t); if (!cancelled) setReady(true) }
      }, 100)
      setTimeout(() => clearInterval(t), 8000)
    }
    check()
    return () => { cancelled = true }
  }, [])

  // Initialize map once
  useEffect(() => {
    if (!ready || !mapEl.current || mapInstance.current) return
    const L = window.L
    const map = L.map(mapEl.current, { zoomControl: true, scrollWheelZoom: true })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '© OpenStreetMap',
    }).addTo(map)
    map.setView([13.7563, 100.5018], 6) // Thailand default
    mapInstance.current = map
    layerRef.current = L.layerGroup().addTo(map)
  }, [ready])

  // Update markers when points or showOverlay change
  useEffect(() => {
    if (!mapInstance.current || !layerRef.current || !window.L) return
    const L = window.L
    const layer = layerRef.current
    layer.clearLayers()

    if (!showOverlay || points.length === 0) {
      if (points.length === 0) {
        mapInstance.current.setView([13.7563, 100.5018], 6)
      }
      return
    }

    const bounds = []
    points.forEach((p, idx) => {
      const color = projectColor(p.projectCode)
      const isLatest = p === latest
      const size = isLatest ? 14 : 10
      const html = `<div style="background:${color};border:2px solid #fff;border-radius:50%;width:${size}px;height:${size}px;box-shadow:0 1px 4px rgba(0,0,0,.4);${isLatest ? 'animation:acePulse 1.8s ease-out infinite;' : ''}"></div>`
      const icon = L.divIcon({ className: 'ace-pin', html, iconSize: [size, size], iconAnchor: [size / 2, size / 2] })
      const popup =
        `<div style="min-width:180px"><b>${p.name || p.email || '—'}</b><br/>` +
        `<span style="font-family:monospace;font-size:11px;color:#64748b">${p.employeeCode || ''}</span><br/>` +
        `Project: ${p.projectCode || '—'}<br/>` +
        `Time: ${timeOnly(p.time) || '—'}<br/>` +
        `<span style="font-family:monospace;font-size:11px">${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}</span></div>`
      L.marker([p.lat, p.lng], { icon }).bindPopup(popup).addTo(layer)
      bounds.push([p.lat, p.lng])
    })

    if (bounds.length > 0) {
      try { mapInstance.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 }) } catch {}
    }
  }, [points, showOverlay, ready])

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
      <div className="relative" style={{ height }}>
        <style>{`@keyframes acePulse { 0%{transform:scale(1);opacity:.95} 50%{transform:scale(1.4);opacity:.6} 100%{transform:scale(1);opacity:.95} }`}</style>
        <div ref={mapEl} style={{ width: '100%', height: '100%' }} />

        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 text-sm font-bold text-slate-500 pointer-events-none">
            ⏳ Loading map…
          </div>
        )}

        {points.length === 0 && ready && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="rounded-xl bg-white/95 backdrop-blur px-6 py-4 shadow-xl text-center">
              <div className="text-3xl mb-2">🗺</div>
              <div className="text-sm font-black text-slate-700">No GPS points yet</div>
              <div className="text-[.72rem] text-slate-500 mt-1">No one has clocked in with GPS today</div>
            </div>
          </div>
        )}

        {/* Top-left counter (only when no project panel covering it) */}
        {(!projectStats || projectStats.length === 0 || !showProjectPanel) && (
          <div className="absolute top-2 left-2 z-[400] rounded-lg bg-white/90 backdrop-blur px-3 py-1.5 shadow-md text-[.72rem] font-bold text-slate-700 pointer-events-none">
            📍 {points.length} GPS points
          </div>
        )}

        {/* Top-right latest */}
        {latest && (
          <div className="absolute top-2 right-2 z-[400] rounded-lg bg-white/90 backdrop-blur px-3 py-1.5 shadow-md text-[.72rem] font-bold text-slate-700 pointer-events-none">
            Latest: {latest.name || latest.email || '—'} · {timeOnly(latest.time) || '—'}
          </div>
        )}

        {/* Bottom-right toggle */}
        <div className="absolute bottom-2 right-2 z-[400] flex gap-2">
          <button
            onClick={() => setShowOverlay(v => !v)}
            className="rounded-lg bg-white/90 backdrop-blur px-3 py-1.5 shadow-md text-[.72rem] font-bold text-slate-700 hover:bg-white"
          >
            {showOverlay ? '👁 Hide pins' : '👁 Show pins'}
          </button>
        </div>

        {/* Project overlay panel — left side */}
        {projectStats && projectStats.length > 0 && showProjectPanel && (
          <ProjectOverlayPanel rows={projectStats} onToggle={() => setShowProjectPanel(false)} />
        )}
        {projectStats && projectStats.length > 0 && !showProjectPanel && (
          <button
            onClick={() => setShowProjectPanel(true)}
            className="absolute top-14 left-2 z-[450] rounded-lg bg-white/95 backdrop-blur px-3 py-1.5 shadow-md text-[.72rem] font-bold text-slate-700 hover:bg-white"
          >
            📊 Show Projects ({projectStats.length})
          </button>
        )}
      </div>
    </div>
  )
}

function ProjectOverlayPanel({ rows, onToggle }) {
  const total = rows.reduce((s, r) => s + (r.total || 0), 0)
  const totalActive = rows.reduce((s, r) => s + (r.value || 0), 0)
  const overallPct = total ? Math.round((totalActive / total) * 100) : 0
  return (
    <div className="absolute top-14 left-2 w-72 max-h-[calc(100%-80px)] rounded-xl bg-white/95 backdrop-blur shadow-xl border border-slate-200 overflow-hidden flex flex-col" style={{ zIndex: 500 }}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div>
          <div className="text-[.7rem] uppercase tracking-wider opacity-80">Projects</div>
          <div className="text-sm font-black">{totalActive}/{total} started · {overallPct}%</div>
        </div>
        <button onClick={onToggle} className="rounded-md w-6 h-6 flex items-center justify-center bg-white/20 hover:bg-white/30 text-white text-xs font-black">✕</button>
      </div>
      <div className="overflow-y-auto p-2 space-y-1.5">
        {rows.map(row => {
          const pct = row.total ? Math.round(((row.value || 0) / row.total) * 100) : 0
          const color = projectColor(row.label)
          return (
            <div key={row.label} className="text-[.7rem]">
              <div className="flex items-center justify-between mb-0.5">
                <span className="flex items-center gap-1.5 font-bold text-slate-700 truncate">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }}></span>
                  <span className="truncate" title={row.label}>{row.label}</span>
                </span>
                <span className="font-mono font-black text-slate-900 shrink-0 ml-2">{row.value || 0}/{row.total || 0}</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full transition-all" style={{ width: `${pct}%`, background: color }}></div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ProjectBars({ rows }) {
  const max = Math.max(...rows.map(row => row.total || row.value || 1), 1)
  return <div style={s.projectBars}>{rows.slice(0, 16).map(row => <div key={row.label} style={s.projectBarRow}><div style={s.projectBarLabel}>{row.label}</div><div style={s.projectBarTrack}><div style={{ ...s.projectBarFill, width: `${((row.value || 0) / max) * 100}%`, background: projectColor(row.label) }} /></div><code>{row.value}/{row.total || max}</code></div>)}</div>
}

function SessionTable({ rows }) {
  return <div style={s.tableWrap}><table style={s.table}><thead><tr><th>Date</th><th>Name</th><th>Clock In</th><th>Clock Out</th><th>Duration</th><th>Project</th></tr></thead><tbody>{rows.map(row => <tr key={`${row.date}-${row.email}`}><td>{row.date}</td><td><b>{row.name}</b><div style={s.mono}>{row.email}</div></td><td>{timeOnly(row.start?.time)}</td><td>{timeOnly(row.end?.time) || '-'}</td><td>{hms(row.duration)}</td><td>{row.projectCode}</td></tr>)}</tbody></table></div>
}

function MiniTimeline({ sessions }) {
  return <div style={s.timeline}>{sessions.slice(0, 24).map(row => {
    const start = Math.max(6 * 3600, secFromTime(row.start?.time) || 6 * 3600)
    const end = Math.min(22 * 3600, secFromTime(row.end?.time) || start + 3600)
    const left = ((start - 6 * 3600) / (16 * 3600)) * 100
    const width = Math.max(4, ((end - start) / (16 * 3600)) * 100)
    return <div key={`${row.date}-${row.email}`} style={s.timelineRow}><span>{row.date.slice(5)}</span><div style={s.timelineTrack}><div style={{ ...s.timelineFill, left: `${left}%`, width: `${width}%` }} /></div><code>{hms(row.duration)}</code></div>
  })}</div>
}

function HeadcountChart({ rows }) {
  const max = Math.max(...rows.flatMap(row => [row.RF, row.TE, row.DTE, row.NPM]).map(Number), 1)
  return <div style={s.headChart}>{rows.map(row => <div key={row.month} style={s.headRow}><span>{row.month}</span>{['RF', 'TE', 'DTE', 'NPM'].map((key, i) => <div key={key} style={s.headBarTrack}><span style={{ ...s.headBarFill, height: `${(Number(row[key] || 0) / max) * 100}%`, background: PROJECT_COLORS[i] }} /></div>)}</div>)}</div>
}

function PersonDaysChart({ days }) {
  const hasDays = days.some(d => d.send !== null)
  if (!hasDays) return <div style={{ ...s.muted, padding: '24px 0', textAlign: 'center' }}>No data for this person / month.</div>
  return (
    <div style={{ overflowX: 'auto', marginBottom: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${days.filter(d => d.send !== null).length}, minmax(22px, 1fr))`, gap: 3, minWidth: 480 }}>
        {days.filter(d => d.send !== null).map(d => (
          <div key={d.day} style={{ display: 'grid', gap: 2, textAlign: 'center' }}>
            <span style={{ fontSize: '.65rem', color: '#667085' }}>{d.day}</span>
            <div style={{ height: 18, borderRadius: 4, background: d.loc ? '#16a34a' : '#fee2e2', border: '1px solid rgba(0,0,0,.06)' }} title={`Day ${d.day}: Loc=${d.loc}`} />
            <div style={{ height: 18, borderRadius: 4, background: d.clock ? '#6d28d9' : '#fee2e2', border: '1px solid rgba(0,0,0,.06)' }} title={`Day ${d.day}: Clock=${d.clock}`} />
            <div style={{ height: 18, borderRadius: 4, background: `rgba(29,78,216,${Math.min(1, (d.score || 0) * 1.2)})`, border: '1px solid rgba(0,0,0,.06)' }} title={`Score ${Math.round((d.score || 0) * 100)}%`} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '.75rem', color: '#667085' }}>
        <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#16a34a', borderRadius: 2, marginRight: 4 }} />Location</span>
        <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#6d28d9', borderRadius: 2, marginRight: 4 }} />Clock-out</span>
        <span><span style={{ display: 'inline-block', width: 12, height: 12, background: ACE_BLUE, borderRadius: 2, marginRight: 4 }} />Score</span>
      </div>
    </div>
  )
}

function DailyComplianceChart({ rows }) {
  if (!rows.length) return <div style={{ ...s.muted, padding: '24px 0', textAlign: 'center' }}>No data</div>
  const maxHead = Math.max(...rows.map(r => r.headcount), 1)
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 200, minWidth: 480, padding: '0 4px' }}>
        {rows.map(r => (
          <div key={r.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1, flex: 1, justifyContent: 'flex-end' }}>
              <div style={{ background: '#0ea5e9', height: `${(r.locPct || 0) * 1.6}px`, borderRadius: '2px 2px 0 0', minHeight: 2 }} title={`Loc: ${r.locPct}%`} />
              <div style={{ background: '#6d28d9', height: `${(r.clockPct || 0) * 1.6}px`, borderRadius: '2px 2px 0 0', minHeight: 2 }} title={`Clock: ${r.clockPct}%`} />
            </div>
            <span style={{ fontSize: '.6rem', color: '#94a3b8', transform: 'rotate(-45deg)', transformOrigin: 'right center', whiteSpace: 'nowrap', marginTop: 4 }}>{r.day}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '.75rem', color: '#667085' }}>
        <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#0ea5e9', borderRadius: 2, marginRight: 4 }} />Location</span>
        <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#6d28d9', borderRadius: 2, marginRight: 4 }} />Clock-out</span>
      </div>
    </div>
  )
}

function HeadcountTable({ rows }) {
  return (
    <div style={{ ...s.tableWrap, maxHeight: 260, marginTop: 12 }}>
      <table style={s.table}>
        <thead><tr><th>Month</th><th style={{ textAlign: 'right' }}>DTE</th><th style={{ textAlign: 'right' }}>RF</th><th style={{ textAlign: 'right' }}>TE</th><th style={{ textAlign: 'right' }}>NPM</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
        <tbody>
          {[...rows].reverse().map(r => (
            <tr key={r.month}>
              <td>{r.month}</td>
              <td style={{ textAlign: 'right' }}>{r.DTE || 0}</td>
              <td style={{ textAlign: 'right' }}>{r.RF  || 0}</td>
              <td style={{ textAlign: 'right' }}>{r.TE  || 0}</td>
              <td style={{ textAlign: 'right' }}>{r.NPM || 0}</td>
              <td style={{ textAlign: 'right', fontWeight: 700 }}>{r.total || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LivePersonSummaryTable({ rows }) {
  if (!rows.length) return <div style={{ ...s.muted, padding: '18px 0', textAlign: 'center' }}>No data</div>
  return (
    <div style={s.tableWrap}>
      <table style={s.table}>
        <thead>
          <tr><th>#</th><th>Project</th><th>Name</th><th style={{ textAlign: 'center' }}>Location</th><th style={{ textAlign: 'center' }}>Clock-out</th><th style={{ textAlign: 'center' }}>Score</th><th style={{ textAlign: 'center' }}>Days</th><th style={{ textAlign: 'center' }}>Total Time</th></tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.employeeCode}-${i}`}>
              <td>{i + 1}</td>
              <td>{row.project}</td>
              <td><b>{row.name}</b><div style={s.mono}>{row.employeeCode}</div></td>
              <td style={{ textAlign: 'center' }}><PctBadge val={row.locPct} /></td>
              <td style={{ textAlign: 'center' }}><PctBadge val={row.clockPct} /></td>
              <td style={{ textAlign: 'center' }}><PctBadge val={row.scorePct} /></td>
              <td style={{ textAlign: 'center' }}>{row.days}</td>
              <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>{row.totalTime || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PctBadge({ val }) {
  const n = Number(val || 0)
  const bg = n >= 90 ? '#dcfce7' : n >= 70 ? '#fef3c7' : '#fee2e2'
  const color = n >= 90 ? '#166534' : n >= 70 ? '#92400e' : '#991b1b'
  return <span style={{ background: bg, color, borderRadius: 999, padding: '3px 8px', fontWeight: 800, fontSize: '.76rem' }}>{n.toFixed(1)}%</span>
}

function TimeSummaryTables({ data }) {
  const sections = [
    { label: 'StartWork (Clock In) — Min / Avg / Max', rows: data.startWork, hint: 'Earlier = better' },
    { label: 'StopWork (Clock Out) — Min / Avg / Max', rows: data.stopWork, hint: 'Later = better' },
    { label: 'TotalTime — Min / Avg / Max', rows: data.totalTime, hint: 'Longer = better' },
  ]
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {sections.map(({ label, rows, hint }) => (
        <div key={label}>
          <div style={{ fontWeight: 700, fontSize: '.82rem', marginBottom: 6 }}>{label} <span style={s.muted}>({hint})</span></div>
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead><tr><th style={{ width: 48 }}>#</th><th>Name</th><th>Project</th><th>Min</th><th>Avg</th><th>Max</th></tr></thead>
              <tbody>
                {(rows || []).map(r => (
                  <tr key={r._id}>
                    <td style={{ fontWeight: 700 }}>{r.rank}</td>
                    <td><b>{r.name}</b></td>
                    <td>{r.project}</td>
                    <td style={{ fontFamily: 'monospace' }}>{r.min || '—'}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{r.avg || '—'}</td>
                    <td style={{ fontFamily: 'monospace' }}>{r.max || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

function addDays(iso, days) {
  const date = new Date(`${iso}T00:00:00`)
  date.setDate(date.getDate() + days)
  return formatDateYmd(date)
}

function avgDuration(sessions) {
  const nums = sessions.map(row => row.duration).filter(n => Number.isFinite(n) && n > 0)
  return nums.length ? hms(nums.reduce((sum, n) => sum + n, 0) / nums.length) : '-'
}


const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg, #ebe7e2 0%, #c9dbe6 100%)', padding: 36, color: '#0f172a' },
  shell: { height: 'calc(100vh - 72px)', maxWidth: 1680, margin: '0 auto', display: 'flex', overflow: 'hidden', borderRadius: 10, boxShadow: '0 24px 80px rgba(16,24,40,.18)', background: '#f2f6fb' },
  sidebar: { width: 260, flexShrink: 0, background: '#182231', display: 'flex', flexDirection: 'column' },
  sidebarBrand: { padding: 24, display: 'flex', alignItems: 'center', gap: 12 },
  sidebarLogo: { width: 42, height: 42, borderRadius: 8, display: 'grid', placeItems: 'center', color: '#fff', background: ACE_GRADIENT, fontWeight: 900 },
  sidebarTitle: { color: '#fff', fontWeight: 900, fontSize: '1.02rem' },
  sidebarSub: { color: '#cbd5e1', fontSize: '.78rem', marginTop: 2 },
  sidebarNav: { padding: '6px 14px', display: 'grid', gap: 8 },
  sidebarButton: { width: '100%', border: 'none', borderRadius: 6, padding: '12px 14px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.86rem' },
  sidebarAdmin: { marginTop: 'auto', margin: 18, borderRadius: 8, background: 'rgba(255,255,255,.06)', padding: 14, border: '1px solid rgba(255,255,255,.08)' },
  workspace: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topbar: { background: '#fff', color: '#344054', padding: '14px 28px', flexShrink: 0, borderBottom: '1px solid #edf0f5', display: 'flex', alignItems: 'center', gap: 16 },
  searchBox: { display: 'flex', alignItems: 'center', gap: 12, flex: 1, maxWidth: 560 },
  searchInput: { border: 'none', outline: 'none', width: '100%', color: '#667085', fontSize: '.82rem', fontWeight: 650 },
  topAccount: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 },
  accountName: { fontSize: '.78rem', fontWeight: 900, color: '#344054' },
  accountRole: { fontSize: '.68rem', color: '#98a2b3', fontWeight: 700 },
  topLogout: { padding: '9px 12px', borderRadius: 6, border: '1px solid #e4e7ec', color: '#344054', background: '#fff', fontWeight: 800, cursor: 'pointer' },
  content: { flex: 1, overflow: 'auto', padding: 28 },
  hero: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 16 },
  title: { fontSize: '1.5rem', fontWeight: 950, color: '#1d2939', lineHeight: 1.1 },
  subtitle: { fontSize: '.83rem', color: '#667085', marginTop: 5 },
  heroActions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  card: { marginBottom: 16, border: '1px solid #d8dee8', borderRadius: 8, boxShadow: '0 10px 32px rgba(16,24,40,.08)', background: '#fff', padding: 16 },
  controls: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, alignItems: 'end' },
  field: { display: 'grid', gap: 7, fontSize: '.82rem', fontWeight: 850, color: '#344054' },
  input: { width: '100%', border: '1px solid #d8dee8', borderRadius: 6, background: '#fff', padding: '10px 12px', color: '#1d2939', outline: 'none' },
  primaryBtn: { border: 'none', borderRadius: 6, padding: '10px 14px', color: '#fff', background: ACE_GRADIENT, fontWeight: 900, cursor: 'pointer', boxShadow: '0 10px 22px rgba(36,71,216,.18)' },
  filterBtn: { border: 'none', borderRadius: 6, padding: '10px 14px', color: '#fff', background: ACE_GRADIENT, fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap' },
  secondaryBtn: { border: '1px solid #d8dee8', borderRadius: 6, padding: '10px 14px', color: '#344054', background: '#fff', fontWeight: 850, cursor: 'pointer' },
  metricGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 16 },
  metricGridCompact: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginBottom: 12 },
  metric: { border: '1px solid #d8dee8', borderRadius: 8, padding: 14, background: '#fff' },
  metricLabel: { color: '#667085', fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 900 },
  metricValue: { marginTop: 6, color: '#111827', fontSize: '1.55rem', fontWeight: 950, lineHeight: 1 },
  metricNote: { marginTop: 7, color: '#8a96ad', fontSize: '.74rem', fontWeight: 650 },
  gridTwo: { display: 'grid', gridTemplateColumns: 'minmax(360px, .9fr) minmax(0, 1.35fr)', gap: 16, alignItems: 'stretch' },
  sectionHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 },
  muted: { color: '#667085', fontSize: '.82rem', fontWeight: 650 },
  pill: { border: '1px solid #d8dee8', background: '#eef3ff', color: ACE_BLUE, borderRadius: 999, padding: '6px 10px', fontSize: '.74rem', fontWeight: 850 },
  tableWrap: { overflow: 'auto', maxHeight: 560 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '.82rem', color: '#344054' },
  mono: { color: '#667085', fontSize: '.72rem', fontFamily: 'ui-monospace, Menlo, Consolas, monospace' },
  goodBadge: { border: '1px solid #bbf7d0', background: '#dcfce7', color: '#166534', borderRadius: 999, padding: '4px 9px', fontWeight: 800, fontSize: '.76rem' },
  warnBadge: { border: '1px solid #fde68a', background: '#fef3c7', color: '#92400e', borderRadius: 999, padding: '4px 9px', fontWeight: 800, fontSize: '.76rem' },
  map: { position: 'relative', minHeight: 380, borderRadius: 8, overflow: 'hidden', border: '1px solid #d8dee8', background: '#e2e8f0' },
  mapFrame: { width: '100%', minHeight: 380, border: 0, display: 'block' },
  mapEmpty: { minHeight: 380, borderRadius: 8, border: '1px solid #d8dee8', display: 'grid', placeItems: 'center', background: '#f8fafc' },
  mapWatermark: { position: 'absolute', right: 14, bottom: 12, color: '#475569', background: 'rgba(255,255,255,.78)', border: '1px solid #d8dee8', borderRadius: 999, padding: '6px 10px', fontSize: '.75rem', fontWeight: 850 },
  projectBars: { display: 'grid', gap: 9, marginTop: 12 },
  projectBarRow: { display: 'grid', gridTemplateColumns: '96px minmax(0,1fr) 64px', gap: 9, alignItems: 'center', fontSize: '.78rem' },
  projectBarLabel: { fontWeight: 900, color: '#344054', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  projectBarTrack: { height: 10, borderRadius: 999, background: '#e4e7ec', overflow: 'hidden' },
  projectBarFill: { height: '100%', borderRadius: 999, background: ACE_GRADIENT },
  timeline: { display: 'grid', gap: 8, marginTop: 12 },
  timelineRow: { display: 'grid', gridTemplateColumns: '48px 1fr 46px', gap: 8, alignItems: 'center', fontSize: '.76rem' },
  timelineTrack: { position: 'relative', height: 12, background: '#e4e7ec', borderRadius: 999, overflow: 'hidden' },
  timelineFill: { position: 'absolute', top: 0, bottom: 0, borderRadius: 999, background: ACE_GRADIENT },
  statusChart: { display: 'grid', gap: 8 },
  statusRow: { display: 'grid', gridTemplateColumns: '56px 62px 62px 62px minmax(0, 1fr) 54px', gap: 8, alignItems: 'center', fontSize: '.76rem' },
  boolCell: { borderRadius: 999, padding: '4px 7px', fontWeight: 850, textAlign: 'center' },
  scoreBar: { height: 10, borderRadius: 999, background: '#e4e7ec', overflow: 'hidden' },
  scoreFill: { height: '100%', background: ACE_GRADIENT },
  lineChart: { position: 'relative', height: 310, borderLeft: '1px solid #d8dee8', borderBottom: '1px solid #d8dee8', background: 'linear-gradient(180deg,#fff,#fbfcff)', margin: '8px 8px 28px' },
  lineSeries: { position: 'absolute', inset: 0 },
  linePoint: { position: 'absolute', width: 10, height: 10, borderRadius: '50%', border: '2px solid #fff', transform: 'translate(-50%, 50%)', boxShadow: '0 0 0 2px rgba(29,78,216,.12)' },
  lineAxis: { position: 'absolute', left: 0, right: 0, bottom: -24, display: 'flex', justifyContent: 'space-between', color: '#667085', fontSize: '.7rem' },
  groupChart: { display: 'grid', gap: 12 },
  groupRow: { display: 'grid', gridTemplateColumns: '80px repeat(4, minmax(0,1fr))', gap: 9, alignItems: 'center', fontSize: '.78rem' },
  groupBarTrack: { height: 18, borderRadius: 999, background: '#e4e7ec', overflow: 'hidden' },
  groupBarFill: { display: 'block', height: '100%', borderRadius: 999 },
  headChart: { display: 'grid', gridTemplateColumns: 'repeat(10, minmax(0,1fr))', gap: 8, alignItems: 'end', minHeight: 310 },
  headRow: { height: 280, display: 'grid', gridTemplateRows: '18px 1fr', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, alignItems: 'end', fontSize: '.68rem', color: '#667085' },
  headBarTrack: { height: '100%', background: '#e4e7ec', borderRadius: 999, display: 'flex', alignItems: 'end', overflow: 'hidden' },
  headBarFill: { width: '100%', borderRadius: 999 },
}
