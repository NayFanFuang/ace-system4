// DailyWorklogPage — daily work summary log for DAILY clock_type employees.
// Mounted at /worklog/me. Auth handled by AuthGate.
//
// Backend:
//   GET    /api/worklog/me?month=YYYY-MM       → logs + sessions + missing dates
//   GET    /api/worklog/me/{YYYY-MM-DD}        → one day's log + clock sessions
//   PUT    /api/worklog/me/{YYYY-MM-DD}        → upsert summary
//   GET    /api/worklog/me/signature           → uploaded signature PNG
//   PUT    /api/worklog/me/signature           → upload signature
//   DELETE /api/worklog/me/signature           → remove signature
//   GET    /api/worklog/me/export/timesheet    → PDF timesheet

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Save, ClipboardList, CalendarDays, CheckCircle2, AlertTriangle } from 'lucide-react'
import { apiFetch } from './src/apiFetch.js'
import { formatDateYmd, formatTime24, pad2 } from './src/dateFormat.js'

const ACE_BLUE = '#2447d8'

function currentYearMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`
}

function todayYmd() {
  return formatDateYmd(new Date())
}

function monthLabel(ym) {
  if (!ym) return ym
  const [y, m] = ym.split('-')
  const names = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${names[parseInt(m, 10)] || m} ${y}`
}

function shiftMonth(ym, delta) {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`
}

function buildCalendar(ym) {
  const [y, m] = ym.split('-').map(Number)
  const first = new Date(y, m - 1, 1)
  const last = new Date(y, m, 0)
  const cells = []
  for (let i = 0; i < first.getDay(); i++) cells.push(null)
  for (let d = 1; d <= last.getDate(); d++) {
    cells.push(`${y}-${pad2(m)}-${pad2(d)}`)
  }
  return cells
}

function fmtTime(iso) {
  if (!iso) return '—'
  return formatTime24(new Date(iso))
}

function fmtHoursBetween(inIso, outIso) {
  if (!inIso || !outIso) return null
  const ms = new Date(outIso) - new Date(inIso)
  if (ms <= 0) return null
  const h = Math.floor(ms / 3600000)
  const min = Math.floor((ms % 3600000) / 60000)
  return `${h}h ${pad2(min)}m`
}

function fmtLongDate(ymd) {
  if (!ymd) return ''
  const d = new Date(`${ymd}T00:00:00`)
  if (Number.isNaN(d.getTime())) return ymd
  const day = d.toLocaleDateString('en-US', { weekday: 'long' })
  const month = d.toLocaleDateString('en-US', { month: 'short' })
  return `${day}, ${d.getDate()} ${month} ${d.getFullYear()}`
}

export default function DailyWorklogPage({ authenticatedUser, onLogout }) {
  const [month, setMonth] = useState(currentYearMonth())
  const [view, setView] = useState('worklog')   // worklog | kpi
  const [data, setData] = useState({ logs: [], sessions_by_date: {}, missing: [] })
  const [selectedDate, setSelectedDate] = useState(todayYmd())
  const [dayData, setDayData] = useState({ log: null, sessions: [] })
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saveMsg, setSaveMsg] = useState('')
  const [exporting, setExporting] = useState(false)
  const [startDay, setStartDay] = useState(26)
  const [signatureUrl, setSignatureUrl] = useState(null)
  const [signatureLoading, setSignatureLoading] = useState(false)
  const [projects, setProjects] = useState([])
  const [lastSaved, setLastSaved] = useState('')
  const [autoStatus, setAutoStatus] = useState('idle')   // idle | dirty | saving | saved | error
  const autoTimerRef = useRef(null)
  const lastSavedRef = useRef('')
  const selectedDateRef = useRef(selectedDate)
  selectedDateRef.current = selectedDate

  const loadProjects = useCallback(async () => {
    try {
      const res = await apiFetch('/api/worklog/me/projects')
      if (!res.ok) return
      setProjects(await res.json())
    } catch { /* ignore */ }
  }, [])

  const loadSignature = useCallback(async () => {
    try {
      const res = await apiFetch('/api/worklog/me/signature')
      if (!res.ok) {
        setSignatureUrl(null)
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setSignatureUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url })
    } catch {
      setSignatureUrl(null)
    }
  }, [])

  async function handleSignatureUpload(file) {
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setError('Signature file exceeds 2MB'); return }
    setSignatureLoading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await apiFetch('/api/worklog/me/signature', { method: 'PUT', body: fd })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.detail || 'Failed to upload signature')
      await loadSignature()
    } catch (e) {
      setError(e.message || 'Failed to upload signature')
    } finally {
      setSignatureLoading(false)
    }
  }

  async function handleSignatureDelete() {
    if (!window.confirm('Delete signature?')) return
    setSignatureLoading(true)
    setError('')
    try {
      const res = await apiFetch('/api/worklog/me/signature', { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete signature')
      if (signatureUrl) URL.revokeObjectURL(signatureUrl)
      setSignatureUrl(null)
    } catch (e) {
      setError(e.message || 'Failed to delete signature')
    } finally {
      setSignatureLoading(false)
    }
  }

  const loadMonth = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch(`/api/worklog/me?month=${month}`)
      if (!res.ok) throw new Error('Failed to load month data')
      setData(await res.json())
    } catch (e) {
      setError(e.message || 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }, [month])

  const loadDay = useCallback(async (d) => {
    setError('')
    setSaveMsg('')
    // Cancel any pending auto-save when switching days
    if (autoTimerRef.current) { clearTimeout(autoTimerRef.current); autoTimerRef.current = null }
    try {
      const res = await apiFetch(`/api/worklog/me/${d}`)
      if (!res.ok) throw new Error('Failed to load day data')
      const json = await res.json()
      setDayData(json)
      const loaded = json.log?.summary || ''
      setSummary(loaded)
      setLastSaved(loaded)
      lastSavedRef.current = loaded
      setAutoStatus('idle')
    } catch (e) {
      setError(e.message || 'Unexpected error')
    }
  }, [])

  // Perform a save for the given date with the given text. Returns true on success.
  const persistSummary = useCallback(async (forDate, text) => {
    const trimmed = text.trim()
    if (!trimmed) return false
    const res = await apiFetch(`/api/worklog/me/${forDate}`, {
      method: 'PUT',
      body: JSON.stringify({ summary: trimmed }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      throw new Error(j.detail || 'Save failed')
    }
    return true
  }, [])

  // Copy yesterday's summary into the current editor
  async function handleCopyYesterday() {
    setError('')
    const [y, m, d] = selectedDate.split('-').map(Number)
    const prev = new Date(y, m - 1, d - 1)
    const prevYmd = `${prev.getFullYear()}-${pad2(prev.getMonth() + 1)}-${pad2(prev.getDate())}`
    try {
      const res = await apiFetch(`/api/worklog/me/${prevYmd}`)
      if (!res.ok) throw new Error('Failed to load yesterday')
      const json = await res.json()
      const prevSummary = json.log?.summary
      if (!prevSummary) { setError(`No log on ${prevYmd}`); return }
      setSummary(prevSummary)
    } catch (e) {
      setError(e.message || 'Failed to copy yesterday')
    }
  }

  useEffect(() => { loadMonth() }, [loadMonth])
  useEffect(() => { if (selectedDate) loadDay(selectedDate) }, [selectedDate, loadDay])
  useEffect(() => { loadSignature() }, [loadSignature])
  useEffect(() => { loadProjects() }, [loadProjects])

  useEffect(() => {
    if (!selectedDate.startsWith(month)) {
      const today = todayYmd()
      setSelectedDate(today.startsWith(month) ? today : `${month}-01`)
    }
  }, [month, selectedDate])

  const cells = useMemo(() => buildCalendar(month), [month])
  const today = todayYmd()
  const isFutureSelected = selectedDate > today
  // Detail Work is only editable when the day's clock is complete (in AND out).
  const clockComplete = dayData.clock_complete === true
  const editingDisabled = isFutureSelected || !clockComplete

  const logDates = useMemo(() => new Set(data.logs.map(l => l.work_date)), [data.logs])
  const sessionDates = useMemo(() => new Set(Object.keys(data.sessions_by_date)), [data.sessions_by_date])

  const filledCount = data.logs.length
  const totalWorkedDays = sessionDates.size

  // Debounced auto-save: 1.5s after last keystroke
  useEffect(() => {
    if (editingDisabled) return
    const trimmed = summary.trim()
    if (!trimmed) return
    if (trimmed === lastSavedRef.current.trim()) return
    setAutoStatus('dirty')
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current)
    const dateAtSchedule = selectedDateRef.current
    autoTimerRef.current = setTimeout(async () => {
      if (selectedDateRef.current !== dateAtSchedule) return  // moved away
      setAutoStatus('saving')
      try {
        await persistSummary(dateAtSchedule, summary)
        if (selectedDateRef.current !== dateAtSchedule) return
        lastSavedRef.current = summary
        setLastSaved(summary)
        setAutoStatus('saved')
        loadMonth()
        setTimeout(() => setAutoStatus(s => s === 'saved' ? 'idle' : s), 1800)
      } catch (e) {
        setAutoStatus('error')
        setError(e.message || 'Auto-save failed')
      }
    }, 1500)
    return () => { if (autoTimerRef.current) clearTimeout(autoTimerRef.current) }
  }, [summary, isFutureSelected, persistSummary, loadMonth])

  async function handleExport() {
    if (!signatureUrl) {
      setError('Please upload your signature before exporting the Timesheet.')
      return
    }
    setExporting(true)
    setError('')
    try {
      const res = await apiFetch(`/api/worklog/me/export/timesheet?month=${month}&start_day=${startDay}`)
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.detail || 'Export failed')
      }
      const blob = await res.blob()
      const cd = res.headers.get('Content-Disposition') || ''
      const match = cd.match(/filename="([^"]+)"/)
      const filename = match ? match[1] : `TimeSheet_${month}.pdf`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e.message || 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  async function handleSave() {
    if (!summary.trim()) { setError('Please enter work detail'); return }
    if (isFutureSelected) { setError('Cannot save future dates'); return }
    if (!clockComplete) { setError('Clock is incomplete for this day — cannot save Detail Work'); return }
    if (autoTimerRef.current) { clearTimeout(autoTimerRef.current); autoTimerRef.current = null }
    setSaving(true)
    setError('')
    setSaveMsg('')
    try {
      await persistSummary(selectedDate, summary)
      lastSavedRef.current = summary
      setLastSaved(summary)
      setAutoStatus('saved')
      setSaveMsg('Saved')
      await loadMonth()
      await loadDay(selectedDate)
      setTimeout(() => setSaveMsg(''), 2000)
    } catch (e) {
      setError(e.message || 'Save failed')
      setAutoStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const sessionsForDay = dayData.sessions || []
  const firstIn = sessionsForDay.length ? sessionsForDay[0].clock_in_at : null
  const lastOut = sessionsForDay.length ? [...sessionsForDay].reverse().find(s => s.clock_out_at)?.clock_out_at : null
  const totalHours = fmtHoursBetween(firstIn, lastOut)

  function insertProjectPrefix(code) {
    if (!code) return
    const prefix = `${code} | `
    // If summary already starts with any "CODE | ", replace just that prefix
    const m = summary.match(/^([A-Z0-9-]+)\s*\|\s*/)
    if (m) {
      setSummary(prefix + summary.slice(m[0].length))
    } else {
      setSummary(prefix + summary)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="text-xl font-black tracking-tight text-slate-950">Daily Work Log</div>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-700">Timesheet</span>
            </div>
            <div className="mt-0.5 text-xs font-semibold text-slate-500">
              {authenticatedUser?.name || authenticatedUser?.employeeCode} · {authenticatedUser?.positionName || authenticatedUser?.role}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Period start</span>
              <select
                value={startDay}
                onChange={e => setStartDay(Number(e.target.value))}
                className="bg-transparent text-xs font-black text-slate-800 outline-none"
              >
                <option value={26}>26 · Payroll cycle</option>
                <option value={1}>1 · Calendar month</option>
              </select>
            </label>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || !signatureUrl}
              style={{ background: ACE_BLUE }}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-black text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              title={
                !signatureUrl
                  ? 'Upload your signature first to enable export'
                  : startDay === 26
                    ? `Export Timesheet (26 ${monthLabel(shiftMonth(month, -1)).slice(0, 3)} – 25 ${monthLabel(month).slice(0, 3)})`
                    : `Export Timesheet (1 ${monthLabel(month).slice(0, 3)} – end of month)`
              }
            >
              <span aria-hidden="true">↓</span>
              {exporting ? 'Exporting…' : 'Export PDF'}
            </button>
            <a href="/overview" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 no-underline shadow-sm hover:bg-slate-50">Overview</a>
            {onLogout && (
              <button type="button" onClick={onLogout} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm hover:bg-slate-50">Logout</button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1320px] px-6 py-5">
        {/* Tabs: Daily Work Log | Monthly KPI (Self) */}
        <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          {[{ id: 'worklog', label: 'Daily Work Log' }, { id: 'kpi', label: 'Monthly KPI (Self)' }].map(t => (
            <button key={t.id} type="button" onClick={() => setView(t.id)}
              className={`rounded-md px-4 py-1.5 text-xs font-black transition ${view === t.id ? 'bg-[#2447d8] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>{t.label}</button>
          ))}
        </div>

        <div className={view === 'kpi' ? 'hidden' : ''}>
        {/* Top row: stats + signature */}
        <div className="mb-4 grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Filled" value={filledCount} accent="emerald" hint="this month" />
            <StatCard label="Worked days" value={totalWorkedDays} accent="blue" hint="with clock data" />
            <StatCard label="Missing" value={data.missing.length} accent={data.missing.length ? 'red' : 'slate'} hint="needs detail" />
            <StatCard label="Month" value={monthLabel(month).split(' ')[0]} sub={monthLabel(month).split(' ')[1]} accent="slate" />
          </div>

          {/* Signature card */}
          <div className={`flex items-center gap-3 rounded-xl border bg-white p-3 shadow-sm ${signatureUrl ? 'border-slate-200' : 'border-red-300 ring-1 ring-red-200'}`}>
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                My signature
                {!signatureUrl && <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-700">Required</span>}
              </div>
              <div className="mt-1">
                {signatureUrl ? (
                  <img src={signatureUrl} alt="Signature" className="h-12 max-w-[160px] rounded border border-slate-200 bg-white object-contain px-2" />
                ) : (
                  <div className="flex h-12 w-40 items-center justify-center rounded border border-dashed border-red-300 bg-red-50 text-center text-[10px] font-bold text-red-500">Upload to enable Export</div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-1.5 text-center text-xs font-black text-slate-700 shadow-sm hover:bg-slate-50">
                {signatureLoading ? 'Working…' : (signatureUrl ? 'Replace' : 'Upload')}
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  disabled={signatureLoading}
                  onChange={e => { handleSignatureUpload(e.target.files?.[0]); e.target.value = '' }}
                />
              </label>
              {signatureUrl && (
                <button
                  type="button"
                  onClick={handleSignatureDelete}
                  disabled={signatureLoading}
                  className="rounded-md border border-red-200 bg-white px-3 py-1 text-xs font-black text-red-600 shadow-sm hover:bg-red-50 disabled:opacity-50"
                >Delete</button>
              )}
            </div>
          </div>
        </div>

        {data.missing.length > 0 && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50/70 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-black text-red-700">
              <span aria-hidden="true">⚠</span>
              {data.missing.length} day{data.missing.length > 1 ? 's' : ''} missing detail this month
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {data.missing.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDate(d)}
                  className="rounded-md border border-red-300 bg-white px-2 py-1 text-xs font-bold text-red-700 transition hover:bg-red-100"
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          {/* Calendar */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMonth(shiftMonth(month, -1))}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
                aria-label="Previous month"
              >‹</button>
              <div className="text-base font-black tracking-tight text-slate-950">{monthLabel(month)}</div>
              <button
                type="button"
                onClick={() => setMonth(shiftMonth(month, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
                aria-label="Next month"
              >›</button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {cells.map((cellDate, i) => {
                if (!cellDate) return <div key={`pad-${i}`} />
                const isToday = cellDate === today
                const isSelected = cellDate === selectedDate
                const hasLog = logDates.has(cellDate)
                const hasSession = sessionDates.has(cellDate)
                const isFuture = cellDate > today
                let tone = 'bg-slate-50 text-slate-400 border-transparent'
                if (hasLog) tone = 'bg-emerald-100 text-emerald-800 border-emerald-300'
                else if (hasSession && !isFuture) tone = 'bg-red-100 text-red-800 border-red-300'
                else if (hasSession) tone = 'bg-amber-50 text-amber-700 border-amber-200'
                const selectedRing = isSelected ? 'ring-2 ring-offset-1 ring-[#2447d8]' : ''
                const todayDot = isToday ? 'font-black' : 'font-bold'
                return (
                  <button
                    key={cellDate}
                    type="button"
                    onClick={() => setSelectedDate(cellDate)}
                    className={`aspect-square rounded-md border ${tone} ${selectedRing} ${todayDot} text-sm transition hover:brightness-95`}
                  >
                    {parseInt(cellDate.slice(-2), 10)}
                  </button>
                )
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-[10px] font-bold text-slate-600">
              <Legend swatch="bg-emerald-100 border-emerald-300" label="Filled" />
              <Legend swatch="bg-red-100 border-red-300" label="Missing" />
              <Legend swatch="bg-amber-50 border-amber-200" label="Future clock" />
              <Legend swatch="bg-slate-50 border-slate-200" label="No clock" />
            </div>
            {loading && <div className="mt-3 text-xs font-bold text-slate-400">Loading…</div>}
          </div>

          {/* Editor */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Selected date</div>
                <div className="mt-0.5 text-2xl font-black tracking-tight text-slate-950">{fmtLongDate(selectedDate)}</div>
              </div>
              <div className="text-xs font-bold text-slate-500">{selectedDate}</div>
            </div>

            {/* Clock info */}
            <div className={`mt-4 rounded-lg border p-3 ${clockComplete ? 'border-slate-200 bg-slate-50' : 'border-amber-300 bg-amber-50'}`}>
              {sessionsForDay.length === 0 ? (
                <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                  <span aria-hidden="true">○</span> No clock-in/out for this day
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                  <Pill label="Clock-in" value={fmtTime(firstIn)} />
                  <Pill label="Clock-out" value={fmtTime(lastOut)} />
                  {totalHours && (
                    <span style={{ background: ACE_BLUE }} className="rounded-md px-2 py-0.5 text-xs font-black text-white">Total {totalHours}</span>
                  )}
                  <span className="text-xs font-bold text-slate-500">{sessionsForDay.length} session{sessionsForDay.length > 1 ? 's' : ''}</span>
                </div>
              )}
              {!clockComplete && !isFutureSelected && (
                <div className="mt-2 flex items-center gap-1.5 text-xs font-black text-amber-700">
                  <span aria-hidden="true">⚠</span>
                  {sessionsForDay.length === 0
                    ? 'No clock record — Detail Work is locked until you clock in and out.'
                    : 'Clock is incomplete (missing clock-out) — Detail Work is locked.'}
                </div>
              )}
            </div>

            {/* Detail Work */}
            <div className="mt-5 flex flex-wrap items-end justify-between gap-2">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                Detail Work <span className="text-red-600">*</span>
                <span className="ml-2 font-bold normal-case tracking-normal text-slate-400">(printed on Timesheet — keep it brief)</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyYesterday}
                  disabled={editingDisabled}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  title="Copy yesterday's Detail Work into this day"
                >↩ Copy yesterday</button>
                {projects.length > 0 && (
                  <select
                    value=""
                    onChange={e => { insertProjectPrefix(e.target.value); e.target.value = '' }}
                    disabled={editingDisabled}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-black text-slate-700 outline-none focus:border-[#2447d8] disabled:opacity-50"
                  >
                    <option value="">+ Project prefix</option>
                    {projects.map(p => (
                      <option key={p.project_code} value={p.project_code}>
                        {p.project_code}{p.project_name ? ` — ${p.project_name}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <textarea
              value={summary}
              onChange={e => setSummary(e.target.value)}
              disabled={editingDisabled}
              placeholder={
                isFutureSelected
                  ? 'Future date'
                  : !clockComplete
                    ? 'Locked — complete your clock-in and clock-out for this day first'
                    : 'e.g.  NBTC2502 | Analysis Cell Estimation, Update Frequency Allocation'
              }
              rows={3}
              className="mt-2 w-full resize-none rounded-lg border border-slate-300 bg-white p-3 text-sm leading-relaxed text-slate-900 outline-none transition focus:border-[#2447d8] focus:ring-2 focus:ring-[#2447d8]/20 disabled:cursor-not-allowed disabled:bg-slate-100"
              maxLength={500}
            />
            <div className="mt-1 flex items-center justify-between text-xs font-bold text-slate-500">
              <div className="flex items-center gap-2">
                <span className={summary.length > 450 ? 'text-amber-600' : ''}>{summary.length} / 500</span>
                <AutoStatusPill status={autoStatus} />
              </div>
              {dayData.log?.updated_at && (
                <span>Updated: {new Date(dayData.log.updated_at).toLocaleString('en-GB')}</span>
              )}
            </div>

            {error && <div className="mt-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</div>}
            {saveMsg && <div className="mt-3 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">✓ {saveMsg}</div>}

            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || editingDisabled || !summary.trim()}
                style={{ background: ACE_BLUE }}
                className="rounded-lg px-6 py-2.5 text-sm font-black text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Saving…' : (dayData.log ? 'Update' : 'Save')}
              </button>
              {isFutureSelected && (
                <span className="text-xs font-bold text-amber-700">Future date — cannot save</span>
              )}
              {!isFutureSelected && !clockComplete && (
                <span className="text-xs font-bold text-amber-700">Clock incomplete — cannot save</span>
              )}
            </div>
          </div>
        </div>
        </div>{/* end Daily Work Log view */}

        {view === 'kpi' && <SelfKpiPanel period={month} monthLbl={monthLabel(month)} />}
      </div>
    </div>
  )
}

// ── Monthly KPI Self-Assessment (embedded tab) ───────────────────────────────
function selfAuto(weight, target, actual) {
  const w = Number(weight), t = Number(target), a = Number(actual)
  if (!Number.isFinite(w) || !Number.isFinite(t) || !Number.isFinite(a) || t <= 0 || actual === '' || actual == null) return ''
  return Math.round(Math.min(a / t, 1) * w * 100) / 100
}

function SelfKpiPanel({ period, monthLbl }) {
  const [rows, setRows] = useState([])
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState(null)   // { ok: boolean, text: string }

  useEffect(() => {
    if (!period) return
    setLoading(true); setStatus('Loading…')
    apiFetch(`/api/kpi/self?period=${encodeURIComponent(period)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) { setStatus('Load failed'); setRows([]); return }
        setInfo(d.employee)
        setRows((d.items || []).map(it => ({ ...it, actual: it.actual ?? '' })))
        setStatus(`${d.items?.length || 0} items`)
      })
      .catch(() => { setStatus('Load failed'); setRows([]) })
      .finally(() => setLoading(false))
  }, [period])

  const totalWeight = rows.reduce((s, r) => s + Number(r.weight || 0), 0)
  const totalScore = rows.reduce((s, r) => s + Number(selfAuto(r.weight, r.target, r.actual) || 0), 0)
  const filled = rows.filter(r => r.actual !== '' && r.actual != null).length
  const setActual = (id, v) => setRows(rs => rs.map(r => r.itemId === id ? { ...r, actual: v } : r))
  const setTarget = (id, v) => setRows(rs => rs.map(r => r.itemId === id ? { ...r, target: v } : r))

  const groups = useMemo(() => {
    const m = new Map()
    rows.forEach(r => { const k = r.mainEvaluate || 'Others'; if (!m.has(k)) m.set(k, []); m.get(k).push(r) })
    return [...m.entries()]
  }, [rows])

  async function submit() {
    if (!rows.length) { setSubmitMsg({ ok: false, text: 'No KPI items to submit.' }); return }
    setSubmitting(true); setSubmitMsg(null)
    try {
      const payload = {
        period,
        rows: rows.map(r => ({
          item_id: r.itemId, main_evaluate: r.mainEvaluate, evaluate_item: r.evaluateItem,
          weight: Number(r.weight) || 0, target: Number(r.target) || 100,
          actual: r.actual !== '' ? Number(r.actual) : null,
          score: selfAuto(r.weight, r.target, r.actual) === '' ? null : selfAuto(r.weight, r.target, r.actual),
        })),
      }
      const r = await apiFetch('/api/kpi/self', { method: 'POST', body: JSON.stringify(payload) })
      const d = await r.json().catch(() => ({}))
      if (r.ok) {
        setSubmitMsg({ ok: true, text: `Submitted ${d.saved} items for ${monthLbl}` })
        setStatus(`✓ Submitted ${d.saved} items for ${monthLbl}`)
      } else {
        setSubmitMsg({ ok: false, text: d.detail || `Submit failed (HTTP ${r.status})` })
      }
    } catch {
      setSubmitMsg({ ok: false, text: 'Submit failed — check your connection and try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <ClipboardList size={18} className="text-[#2447d8]" />
          <div>
            <div className="text-sm font-black text-slate-900">My KPI — Self-Assessment</div>
            <div className="text-[.72rem] font-semibold text-slate-500"><CalendarDays size={11} className="inline -mt-0.5" /> {monthLbl} · {info ? `${info.name} · ${info.position || '—'}` : 'your monthly self-evaluation'}</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[.66rem] font-black text-blue-700">{rows.length} items</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[.66rem] font-black text-slate-600">Weight {totalWeight}</span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[.66rem] font-black text-emerald-700">Filled {filled}/{rows.length}</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[.66rem] font-black text-slate-600">Self {totalScore.toFixed(1)}</span>
          <button onClick={submit} disabled={submitting || !rows.length} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"><Save size={14} className={submitting ? 'animate-pulse' : ''} /> {submitting ? 'Submitting…' : 'Submit'}</button>
        </div>
      </div>

      {submitMsg && (
        <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold shadow-sm ${submitMsg.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {submitMsg.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{submitMsg.ok ? 'บันทึกสำเร็จ — ' : 'บันทึกไม่สำเร็จ — '}{submitMsg.text}</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-400 font-bold shadow-sm">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <ClipboardList size={36} className="mx-auto mb-3 text-slate-300" />
          <div className="font-black text-slate-600 text-sm">No KPI items for {monthLbl}</div>
          <div className="text-xs text-slate-400 mt-1">{status}</div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-[.78rem]">
              <thead className="bg-slate-50 text-left text-[.68rem] uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2.5 font-black">Main Evaluate</th>
                  <th className="px-3 py-2.5 font-black">Evaluate Item</th>
                  <th className="px-3 py-2.5 font-black text-center w-20">Weight</th>
                  <th className="px-3 py-2.5 font-black text-center w-24">Target</th>
                  <th className="px-3 py-2.5 font-black text-center w-28">My Actual</th>
                  <th className="px-3 py-2.5 font-black text-center w-24">My Score</th>
                </tr>
              </thead>
              <tbody>
                {groups.map(([main, list]) => list.map((row, li) => (
                  <tr key={row.itemId} className="border-t border-slate-100 hover:bg-slate-50/60">
                    {li === 0 && (
                      <td rowSpan={list.length} className="px-3 py-3 align-top border-r border-slate-100 bg-slate-50/40">
                        <div className="font-black text-slate-900">{main}</div>
                        <div className="text-[.68rem] text-slate-500 mt-0.5">{list.length} items</div>
                      </td>
                    )}
                    <td className="px-3 py-3">
                      <div className="font-black text-slate-900">{row.evaluateItem}</div>
                      <div className="text-[.65rem] text-slate-400 font-mono mt-0.5">{row.itemId}</div>
                    </td>
                    <td className="px-2 py-3 text-center"><input className="w-16 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-center text-xs font-bold" value={row.weight} readOnly /></td>
                    <td className="px-2 py-3 text-center"><input type="number" className="w-20 rounded border border-slate-200 px-2 py-1 text-center text-xs outline-none focus:border-[#2447d8]" value={row.target} onChange={e => setTarget(row.itemId, e.target.value)} title="You can set your own target for this round" /></td>
                    <td className="px-2 py-3 text-center"><input type="number" className="w-24 rounded border border-slate-200 px-2 py-1 text-center text-xs outline-none focus:border-[#2447d8]" value={row.actual} placeholder="—" onChange={e => setActual(row.itemId, e.target.value)} /></td>
                    <td className="px-2 py-3 text-center"><input className="w-16 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-center text-xs font-black text-slate-700 cursor-not-allowed" value={selfAuto(row.weight, row.target, row.actual)} placeholder="( )" readOnly tabIndex={-1} /></td>
                  </tr>
                )))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-50 font-black text-slate-900">
                  <td colSpan={2} className="px-3 py-3 text-right uppercase tracking-wider text-[.7rem] text-slate-600">Total Score</td>
                  <td className="px-2 py-3 text-center">{totalWeight}</td>
                  <td className="px-2 py-3"></td>
                  <td className="px-2 py-3 text-center text-[.68rem] text-slate-500">{filled}/{rows.length} filled</td>
                  <td className="px-2 py-3 text-center text-sm text-emerald-700">{totalScore.toFixed(2)} <span className="text-[.62rem] font-bold text-slate-400">/ {totalWeight}</span></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="border-t border-slate-100 px-4 py-2.5 text-[.72rem] font-bold text-slate-500">{status} · Score = min(actual / target, 1) × weight (auto)</div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, sub, hint, accent = 'slate' }) {
  const accents = {
    emerald: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    blue: 'text-blue-700 bg-blue-50 border-blue-200',
    red: 'text-red-700 bg-red-50 border-red-200',
    slate: 'text-slate-700 bg-white border-slate-200',
  }
  return (
    <div className={`rounded-xl border ${accents[accent]} p-3 shadow-sm`}>
      <div className="text-[10px] font-black uppercase tracking-wider opacity-70">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <div className="text-2xl font-black leading-none">{value}</div>
        {sub && <div className="text-xs font-bold opacity-70">{sub}</div>}
      </div>
      {hint && <div className="mt-1 text-[10px] font-bold opacity-60">{hint}</div>}
    </div>
  )
}

function Legend({ swatch, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded border ${swatch}`} />{label}
    </span>
  )
}

function AutoStatusPill({ status }) {
  if (status === 'idle') return null
  const map = {
    dirty:  { txt: '● Unsaved',      cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    saving: { txt: '⟳ Auto-saving…', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    saved:  { txt: '✓ Auto-saved',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    error:  { txt: '✕ Auto-save failed', cls: 'bg-red-50 text-red-700 border-red-200' },
  }
  const m = map[status]
  if (!m) return null
  return <span className={`rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${m.cls}`}>{m.txt}</span>
}

function Pill({ label, value }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-xs font-bold text-slate-500">{label}:</span>
      <span className="font-black text-slate-950">{value}</span>
    </span>
  )
}
