import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, Bell, CalendarDays, CalendarRange, Check, ChevronDown, ChevronLeft, ChevronRight,
  ClipboardList, Clock, Command, DoorOpen, Hash, Home, ImagePlus, LogOut, MapPin, Menu, Plus, Search,
  Sparkles, User, UserPlus, Users, X,
} from 'lucide-react'
import { apiFetch } from './src/apiFetch.js'
import { Badge, Button, Card, EmptyState, Modal, Spinner, StatCard } from './src/ui/index.jsx'

const ACE_BLUE = '#2447d8'
const ACE_RED  = '#c0392b'
const COMPANY  = 'AirConnect Engineering'
const DEFAULT_COLOR = '#475569'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function todayISO() {
  const d = new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

function addDays(iso, n) {
  // Use UTC math so toISOString() doesn't shift the date in non-UTC timezones.
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

function mondayOf(iso) {
  const d = new Date(iso + 'T00:00:00Z')
  const dow = (d.getUTCDay() + 6) % 7 // Mon=0 … Sun=6
  d.setUTCDate(d.getUTCDate() - dow)
  return d.toISOString().slice(0, 10)
}

function weekdayLabel(iso) {
  try {
    return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: 'short' })
  } catch { return '' }
}

function dayMonth(iso) {
  try {
    return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short' })
  } catch { return iso }
}

function prettyDate(iso) {
  try {
    return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', {
      timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    })
  } catch {
    return iso
  }
}

function formatToday() {
  return new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
}

function initials(name) {
  return String(name || 'Me').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || 'ME'
}

// Time options every 30 min, 07:00–21:00
const TIME_OPTIONS = (() => {
  const out = []
  for (let h = 7; h <= 21; h++) {
    for (const m of [0, 30]) {
      out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return out
})()

// Timeline grid config (for drag-to-book) — horizontal axis: time runs left→right.
const DAY_START_MIN = 7 * 60   // 07:00
const DAY_END_MIN   = 21 * 60  // 21:00
const SLOT_MIN      = 30       // 30-minute granularity
const SLOT_W        = 48       // pixel width per slot (time axis)
const ROW_H         = 60       // pixel height per room row
const LABEL_W       = 176      // room-name column width (w-44)
const NUM_SLOTS     = (DAY_END_MIN - DAY_START_MIN) / SLOT_MIN
const TRACK_W       = NUM_SLOTS * SLOT_W
const PX_PER_MIN    = SLOT_W / SLOT_MIN

function timeToMin(t) {
  const [h, m] = String(t || '0:0').split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

function minToTime(min) {
  const clamped = Math.max(DAY_START_MIN, Math.min(DAY_END_MIN, min))
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function slotToMin(slot) {
  return DAY_START_MIN + slot * SLOT_MIN
}

const ROOM_NAV = [
  { id: 'schedule',   label: 'Schedule',       icon: CalendarRange },
  { id: 'mine',       label: 'My Bookings',    icon: Clock },
  { id: 'summary',    label: 'Meeting Summary', icon: ClipboardList },
  { id: 'rooms',      label: 'Rooms',          icon: DoorOpen },
]

// ---------------------------------------------------------------------------
// Sidebar (local — sections of this page only)
// ---------------------------------------------------------------------------
function MeetingRoomSidebar({ activeNav, setActiveNav, mobileOpen, onMobileClose }) {
  return (
    <aside className={`${mobileOpen ? 'fixed inset-y-0 left-0 z-40 flex' : 'hidden'} w-72 flex-col border-r border-slate-200 bg-white/95 p-5 shadow-lg backdrop-blur lg:sticky lg:top-0 lg:flex lg:h-screen lg:shadow-none lg:overflow-y-auto`}>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${ACE_BLUE}, ${ACE_RED})` }}>
          <Command size={24} />
        </div>
        <div className="min-w-0">
          <div className="text-base font-black text-slate-950">ACE Meeting Rooms</div>
          <div className="text-xs font-bold text-slate-400">Office Workspace</div>
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
        {ROOM_NAV.map(item => {
          const active = item.id === activeNav
          const Icon = item.icon || Activity
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => { setActiveNav(item.id); onMobileClose?.() }}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-sm font-black transition ${active ? 'bg-blue-50 text-[#2447d8] shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'}`}
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
          Room Booking
        </div>
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
          Automatic conflict check · Pick a room · See the day at a glance
        </p>
      </div>
    </aside>
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
      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-[#2447d8] hover:shadow-md disabled:opacity-50"
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Booking modal — reuses shared Modal primitive
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Attendee picker — search & link employees from the directory
// ---------------------------------------------------------------------------
function AttendeePicker({ value, onChange }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const blurTimer = useRef(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const res = await apiFetch(`/api/meeting-attendees?search=${encodeURIComponent(query.trim())}&limit=20`)
        const data = await res.json().catch(() => ({}))
        if (active) setResults(data.employees || [])
      } catch {
        if (active) setResults([])
      }
      if (active) setLoading(false)
    }, 250)
    return () => { active = false; clearTimeout(t) }
  }, [query])

  const selectedCodes = useMemo(() => new Set(value.map(v => v.code)), [value])

  function add(emp) {
    if (!selectedCodes.has(emp.code)) onChange([...value, { code: emp.code, name: emp.name }])
    setQuery('')
  }
  function remove(code) {
    onChange(value.filter(v => v.code !== code))
  }

  return (
    <div className="relative">
      {/* Selected chips */}
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {value.map(a => (
            <span key={a.code}
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#2447d8]">
              {a.name}
              <button type="button" onClick={() => remove(a.code)}
                className="text-[#2447d8]/60 hover:text-[#2447d8]" aria-label={`Remove ${a.name}`}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2">
        <Search size={15} className="text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { clearTimeout(blurTimer.current); setOpen(true) }}
          onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 150) }}
          placeholder="Search by name or employee code…"
          className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>

      {/* Results dropdown */}
      {open && (
        <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl">
          {loading ? (
            <div className="px-3 py-3 text-xs font-semibold text-slate-400">Searching…</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-3 text-xs font-semibold text-slate-400">No employees found</div>
          ) : (
            results.map(emp => {
              const picked = selectedCodes.has(emp.code)
              return (
                <button
                  key={emp.code}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => add(emp)}
                  disabled={picked}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition ${picked ? 'cursor-default bg-slate-50 text-slate-400' : 'hover:bg-blue-50'}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-slate-800">{emp.name}</span>
                    <span className="block truncate text-[11px] font-semibold text-slate-400">
                      {emp.code}{emp.department ? ` · ${emp.department}` : ''}{emp.position ? ` · ${emp.position}` : ''}
                    </span>
                  </span>
                  {picked
                    ? <Check size={15} className="shrink-0 text-emerald-500" />
                    : <UserPlus size={15} className="shrink-0 text-slate-300" />}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

function BookingModal({ open, rooms, date, editing, prefill, presetRoomId, presetStart, presetEnd, onClose, onSaved }) {
  const isEdit = !!editing
  const isRebook = !isEdit && !!prefill
  const [roomId, setRoomId] = useState('')
  const [title, setTitle] = useState('')
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('10:00')
  const [bookDate, setBookDate] = useState(date)   // chosen date when rebooking
  const [attendeeList, setAttendeeList] = useState([])
  const [notes, setNotes] = useState('')
  const [sendInvite, setSendInvite] = useState(true)
  const [repeat, setRepeat] = useState('none')
  const [repeatCount, setRepeatCount] = useState(4)
  const [series, setSeries] = useState(null) // { count, next, last_date }
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (editing) {
      setRoomId(editing.room_id || (rooms[0] && rooms[0].id) || '')
      setTitle(editing.title || '')
      setStart(editing.start_time || '09:00')
      setEnd(editing.end_time || '10:00')
      setAttendeeList((editing.attendee_list || []).map(a => ({ code: a.code, name: a.name })))
      setNotes(editing.notes || '')
    } else if (prefill) {
      setRoomId(prefill.roomId || (rooms[0] && rooms[0].id) || '')
      setTitle(prefill.title || '')
      setStart(prefill.start || '09:00')
      setEnd(prefill.end || '10:00')
      setAttendeeList(prefill.attendeeList || [])
      setNotes(prefill.notes || '')
    } else {
      setRoomId(presetRoomId || (rooms[0] && rooms[0].id) || '')
      setTitle(''); setStart(presetStart || '09:00'); setEnd(presetEnd || '10:00')
      setAttendeeList([]); setNotes('')
    }
    setBookDate(date)
    setSendInvite(true); setError(''); setSaving(false); setSeries(null)
    setRepeat('none'); setRepeatCount(4)
  }, [open, editing, prefill, presetRoomId, presetStart, presetEnd, rooms, date])

  // Live "meeting #N" lookup as the topic is typed.
  useEffect(() => {
    if (!open) return
    const q = title.trim()
    if (!q) { setSeries(null); return }
    let active = true
    const t = setTimeout(async () => {
      try {
        const qs = `title=${encodeURIComponent(q)}${editing ? `&exclude_id=${editing.id}` : ''}`
        const res = await apiFetch(`/api/room-bookings/series?${qs}`)
        const data = await res.json().catch(() => ({}))
        if (active) setSeries(data)
      } catch {
        if (active) setSeries(null)
      }
    }, 300)
    return () => { active = false; clearTimeout(t) }
  }, [title, open, editing])

  // Date being edited may differ from the page's current date; rebooking lets
  // the user pick a new date.
  const effectiveDate = editing?.booking_date || (isRebook ? bookDate : date)

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (start >= end) { setError('End time must be after start time'); return }
    setSaving(true)
    try {
      const payload = {
        room_id: Number(roomId),
        booking_date: effectiveDate,
        start_time: start,
        end_time: end,
        title: title.trim(),
        attendee_codes: attendeeList.map(a => a.code),
        notes: notes.trim() || null,
        send_invite: sendInvite,
      }
      if (!isEdit && repeat !== 'none') {
        payload.repeat = repeat
        payload.repeat_count = Number(repeatCount)
      }
      const res = await apiFetch(
        isEdit ? `/api/room-bookings/${editing.id}` : '/api/room-bookings',
        { method: isEdit ? 'PATCH' : 'POST', body: JSON.stringify(payload) },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.detail || (isEdit ? 'Failed to save changes' : 'Booking failed')); setSaving(false); return }
      onSaved(data)
    } catch {
      setError('Connection error. Please try again.')
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} width={480}>
      <form onSubmit={submit}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="text-base font-black text-slate-900">{isEdit ? 'Edit Booking' : isRebook ? 'Book Again' : 'Book a Room'}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3 px-5 py-4">
          {isRebook ? (
            <label className="block">
              <span className="text-xs font-bold text-slate-600">Date</span>
              <input type="date" value={bookDate} onChange={(e) => setBookDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700" />
              <span className="mt-1 block text-[11px] font-medium text-slate-400">Reusing the same topic and attendees — pick a new date.</span>
            </label>
          ) : (
            <div className="text-sm text-slate-500">
              Date <span className="font-bold text-slate-700">{prettyDate(effectiveDate)}</span>
            </div>
          )}

          <label className="block">
            <span className="text-xs font-bold text-slate-600">Room</span>
            <select value={roomId} onChange={(e) => setRoomId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}{r.capacity ? ` (${r.capacity} seats)` : ''}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-bold text-slate-600">Meeting topic</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200}
              placeholder="e.g. RF Team Sync"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            {series && title.trim() && (
              <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                <Hash size={12} />
                {editing
                  ? `This topic has met ${series.count + 1} time(s)`
                  : `This will be meeting #${series.next}`}
                {series.count > 0 && series.last_date && (
                  <span className="font-semibold text-amber-600">· last {prettyDate(series.last_date)}</span>
                )}
              </div>
            )}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-bold text-slate-600">Start</span>
              <select value={start} onChange={(e) => setStart(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-600">End</span>
              <select value={end} onChange={(e) => setEnd(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          </div>

          <div className="block">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Attendees (from Employees)</span>
              {attendeeList.length > 0 && (
                <span className="text-[11px] font-bold text-slate-400">{attendeeList.length} people</span>
              )}
            </div>
            <div className="mt-1">
              <AttendeePicker value={attendeeList} onChange={setAttendeeList} />
            </div>
          </div>

          <label className="block">
            <span className="text-xs font-bold text-slate-600">Notes (optional)</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={2000}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>

          {!isEdit && (
            <div className="block">
              <span className="text-xs font-bold text-slate-600">Repeat</span>
              <div className="mt-1 grid grid-cols-2 gap-3">
                <select value={repeat} onChange={(e) => setRepeat(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="none">Does not repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                {repeat !== 'none' && (
                  <label className="flex items-center gap-2 text-sm">
                    <input type="number" min={2} max={26} value={repeatCount}
                      onChange={(e) => setRepeatCount(e.target.value)}
                      className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                    <span className="text-xs font-semibold text-slate-500">occurrences</span>
                  </label>
                )}
              </div>
              {repeat !== 'none' && (
                <div className="mt-1.5 text-[11px] font-semibold text-slate-400">
                  Creates {repeatCount} bookings — every {repeat === 'daily' ? 'day' : repeat === 'weekly' ? 'week' : 'month'} at the same time. Booking is blocked if any date conflicts.
                </div>
              )}
            </div>
          )}

          <label className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5">
            <input type="checkbox" checked={sendInvite} onChange={(e) => setSendInvite(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#2447d8]" />
            <span className="text-xs font-semibold text-slate-600">
              Send email invitation + calendar event (Outlook)
              <span className="block text-[11px] font-medium text-slate-400">
                {isEdit
                  ? 'Email an update and refresh the calendar event for attendees'
                  : 'Email a calendar invite to the organizer and attendees with an email on file'}
              </span>
            </span>
          </label>

          {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</div>}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving…' : (isEdit ? 'Save changes' : 'Confirm booking')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Timeline grid (drag-to-book) — rooms as rows, time on the horizontal axis.
// Drag sideways across a room row to select a time range; release to open modal.
// ---------------------------------------------------------------------------
function TimelineGrid({ rooms, byRoom, onCreate, onCancel, onEdit, onConflict }) {
  const [drag, setDrag] = useState(null) // { roomId, anchorSlot, curSlot }
  const dragRef = useRef(null)           // live value for pointer handlers (avoids stale closures)
  const rowRefs = useRef({})

  function setDragState(next) {
    dragRef.current = next
    setDrag(next)
  }

  // Does the slot range [lo..hi] overlap any existing booking in this room?
  function selectionConflict(roomId, lo, hi) {
    const list = byRoom.get(roomId) || []
    const s = slotToMin(lo)
    const e = slotToMin(hi + 1)
    return list.some(b => timeToMin(b.start_time) < e && timeToMin(b.end_time) > s)
  }

  function slotFromEvent(e, roomId) {
    const el = rowRefs.current[roomId]
    if (!el) return 0
    const x = e.clientX - el.getBoundingClientRect().left
    return Math.max(0, Math.min(NUM_SLOTS - 1, Math.floor(x / SLOT_W)))
  }

  function onPointerDown(e, room) {
    if (e.button != null && e.button !== 0) return
    const slot = slotFromEvent(e, room.id)
    try { e.currentTarget.setPointerCapture?.(e.pointerId) } catch { /* synthetic/inactive pointer */ }
    setDragState({ roomId: room.id, anchorSlot: slot, curSlot: slot })
  }

  function onPointerMove(e, room) {
    const d = dragRef.current
    if (!d || d.roomId !== room.id) return
    const slot = slotFromEvent(e, room.id)
    if (slot !== d.curSlot) setDragState({ ...d, curSlot: slot })
  }

  function onPointerUp(e, room) {
    const d = dragRef.current
    if (!d || d.roomId !== room.id) { setDragState(null); return }
    const lo = Math.min(d.anchorSlot, d.curSlot)
    const hi = Math.max(d.anchorSlot, d.curSlot)
    setDragState(null)
    if (selectionConflict(room.id, lo, hi)) { onConflict?.(); return }
    onCreate(room.id, minToTime(slotToMin(lo)), minToTime(slotToMin(hi + 1)))
  }

  const HOUR_LABELS = Array.from({ length: NUM_SLOTS + 1 }, (_, i) => i).filter(i => i % 2 === 0)

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="min-w-max">
        {/* Header row — time axis */}
        <div className="flex border-b border-slate-200 bg-slate-50/80">
          <div className="sticky left-0 z-10 shrink-0 border-r border-slate-200 bg-slate-50/80"
            style={{ width: LABEL_W }} />
          <div className="relative" style={{ width: TRACK_W, height: 30 }}>
            {HOUR_LABELS.map(i => (
              <div key={i}
                className="absolute top-1/2 -translate-y-1/2 pl-1 text-[11px] font-bold text-slate-400"
                style={{ left: i * SLOT_W }}>
                {minToTime(slotToMin(i))}
              </div>
            ))}
          </div>
        </div>

        {/* Body — one row per room */}
        {rooms.map(room => {
          const list = byRoom.get(room.id) || []
          const color = room.color || DEFAULT_COLOR
          return (
            <div key={room.id} className="flex border-b border-slate-100 last:border-b-0">
              {/* Room label (sticky on horizontal scroll) */}
              <div className="sticky left-0 z-10 flex shrink-0 flex-col justify-center border-r border-slate-200 bg-white px-3"
                style={{ width: LABEL_W, height: ROW_H, borderLeft: `3px solid ${color}` }}>
                <div className="truncate text-sm font-black text-slate-900">{room.name}</div>
                <div className="truncate text-[11px] font-bold text-slate-400">
                  {room.location || '—'}{room.capacity ? ` · ${room.capacity} seats` : ''}
                </div>
              </div>

              {/* Time track */}
              <div
                ref={el => { rowRefs.current[room.id] = el }}
                className="relative cursor-pointer select-none"
                style={{ width: TRACK_W, height: ROW_H, touchAction: 'none' }}
                onPointerDown={e => onPointerDown(e, room)}
                onPointerMove={e => onPointerMove(e, room)}
                onPointerUp={e => onPointerUp(e, room)}
                onPointerCancel={() => setDragState(null)}
              >
                {/* Slot grid lines */}
                {Array.from({ length: NUM_SLOTS }, (_, i) => (
                  <div key={i}
                    className={`absolute top-0 bottom-0 ${i % 2 === 0 ? 'border-l border-slate-200' : 'border-l border-dashed border-slate-100'}`}
                    style={{ left: i * SLOT_W, width: SLOT_W }} />
                ))}

                {/* Existing bookings */}
                {list.map(b => {
                  const left = (timeToMin(b.start_time) - DAY_START_MIN) * PX_PER_MIN
                  const w = Math.max(28, (timeToMin(b.end_time) - timeToMin(b.start_time)) * PX_PER_MIN)
                  return (
                    <div key={b.id}
                      onPointerDown={e => e.stopPropagation()}
                      onClick={() => b.is_mine && onEdit?.(b)}
                      title={`${b.start_time}–${b.end_time} · ${b.title}`
                        + (b.occurrence ? ` (#${b.occurrence}${b.series_total > 1 ? `/${b.series_total}` : ''})` : '')
                        + (b.is_mine ? ' · click to edit' : (b.booked_by_name ? ` · ${b.booked_by_name}` : ''))}
                      className={`absolute top-1 bottom-1 overflow-hidden rounded-lg px-2 py-1 text-white shadow-sm ${b.is_mine ? 'cursor-pointer ring-1 ring-white/40' : ''}`}
                      style={{ left: left + 1, width: w - 2, background: color }}>
                      <div className="text-[10px] font-black leading-tight">{b.start_time}–{b.end_time}</div>
                      <div className="truncate text-[11px] font-bold leading-tight">{b.title}</div>
                      {(b.booked_by_name || b.booked_by) && (
                        <div className="mt-0.5 flex items-center gap-1 truncate text-[10px] font-semibold leading-tight text-white/85">
                          <User size={10} className="shrink-0" />
                          <span className="truncate">{b.booked_by_name || b.booked_by}</span>
                        </div>
                      )}
                      {b.is_mine && (
                        <button
                          onClick={e => { e.stopPropagation(); onCancel(b) }}
                          onPointerDown={e => e.stopPropagation()}
                          title="Cancel booking"
                          className="absolute right-1 top-1 inline-flex h-4 w-4 items-center justify-center rounded bg-white/25 text-[10px] font-black leading-none hover:bg-white/45">
                          ✕
                        </button>
                      )}
                    </div>
                  )
                })}

                {/* Drag selection overlay — red when it overlaps a booking */}
                {drag && drag.roomId === room.id && (() => {
                  const lo = Math.min(drag.anchorSlot, drag.curSlot)
                  const hi = Math.max(drag.anchorSlot, drag.curSlot)
                  const conflict = selectionConflict(room.id, lo, hi)
                  const tone = conflict ? '#dc2626' : '#2447d8'
                  return (
                    <div className="pointer-events-none absolute top-1 bottom-1 flex items-center rounded-lg border-2 border-dashed"
                      style={{ left: lo * SLOT_W, width: (hi - lo + 1) * SLOT_W, borderColor: tone, background: `${tone}26` }}>
                      <div className="px-1.5 text-[10px] font-black whitespace-nowrap" style={{ color: tone }}>
                        {conflict ? '✕ ' : ''}{minToTime(slotToMin(lo))}–{minToTime(slotToMin(hi + 1))}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function MeetingRoomPage({ authenticatedUser, onLogout }) {
  const [activeNav, setActiveNav] = useState('schedule')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [date, setDate] = useState(todayISO())
  const [rooms, setRooms] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [presetRoomId, setPresetRoomId] = useState(null)
  const [presetStart, setPresetStart] = useState(null)
  const [presetEnd, setPresetEnd] = useState(null)
  const [banner, setBanner] = useState('')
  const [search, setSearch] = useState('')
  const [scheduleView, setScheduleView] = useState('day')
  const [canManageRooms, setCanManageRooms] = useState(false)
  const [prefill, setPrefill] = useState(null)

  const loadRooms = useCallback(async () => {
    const res = await apiFetch('/api/meeting-rooms')
    const data = await res.json().catch(() => ({}))
    setRooms(data.rooms || [])
    setCanManageRooms(!!data.can_manage)
  }, [])

  const loadBookings = useCallback(async (d) => {
    setLoading(true)
    const res = await apiFetch(`/api/room-bookings?date=${d}`)
    const data = await res.json().catch(() => ({}))
    setBookings(data.bookings || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadRooms() }, [loadRooms])
  useEffect(() => { loadBookings(date) }, [date, loadBookings])

  const byRoom = useMemo(() => {
    const map = new Map(rooms.map((r) => [r.id, []]))
    for (const b of bookings) {
      if (!map.has(b.room_id)) map.set(b.room_id, [])
      map.get(b.room_id).push(b)
    }
    return map
  }, [rooms, bookings])

  const filteredRooms = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rooms
    return rooms.filter(r =>
      String(r.name || '').toLowerCase().includes(q) ||
      String(r.location || '').toLowerCase().includes(q)
    )
  }, [rooms, search])

  const myBookings = useMemo(
    () => bookings.filter(b => b.is_mine).sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [bookings]
  )

  const stats = useMemo(() => {
    const totalRooms = rooms.length
    const totalBookings = bookings.length
    const mine = myBookings.length
    const free = rooms.filter(r => (byRoom.get(r.id) || []).length === 0).length
    return { totalRooms, totalBookings, mine, free }
  }, [rooms, bookings, myBookings, byRoom])

  async function cancel(b) {
    if (!window.confirm(`Cancel booking "${b.title}" (${b.start_time}–${b.end_time})?`)) return
    const res = await apiFetch(`/api/room-bookings/${b.id}`, { method: 'DELETE' })
    if (res.ok) {
      setBanner('Booking cancelled')
      loadBookings(date)
      setTimeout(() => setBanner(''), 2500)
    } else {
      const data = await res.json().catch(() => ({}))
      window.alert(data.detail || 'Failed to cancel')
    }
  }

  function openNew(roomId, startTime, endTime) {
    setEditing(null)
    setPrefill(null)
    setPresetRoomId(roomId || null)
    setPresetStart(startTime || null)
    setPresetEnd(endTime || null)
    setShowModal(true)
  }

  function openEdit(booking) {
    if (!booking?.is_mine) return
    setPrefill(null)
    setEditing(booking)
    setShowModal(true)
  }

  // "Book again" — reuse the same topic + same attendees (and room/time as a
  // starting point) to schedule a fresh meeting on a new date.
  function openRebook(src) {
    setEditing(null)
    setPresetRoomId(null); setPresetStart(null); setPresetEnd(null)
    setPrefill({
      title: src.title || '',
      attendeeList: (src.attendee_list || src.last_attendees || []).map(a => ({ code: a.code, name: a.name })),
      roomId: src.roomId ?? src.room_id ?? src.last_room_id ?? null,
      start: src.start ?? src.start_time ?? src.last_start ?? null,
      end: src.end ?? src.end_time ?? src.last_end ?? null,
      notes: src.notes ?? src.last_notes ?? '',
    })
    setShowModal(true)
  }

  const navLabel = ROOM_NAV.find(n => n.id === activeNav)?.label || 'Schedule'

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="flex min-h-screen">
        <MeetingRoomSidebar
          activeNav={activeNav}
          setActiveNav={setActiveNav}
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
          {/* Sticky topbar */}
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
                  placeholder="Search room · floor · location..."
                  className="w-full border-0 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
              <div className="ml-auto flex items-center gap-2">
                <IconButton label="Notifications">
                  <Bell size={18} />
                </IconButton>
                <button className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:bg-slate-50 sm:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-black text-white" style={{ background: ACE_BLUE }}>
                    {initials(authenticatedUser?.name || 'Me')}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black text-slate-900">{authenticatedUser?.name || 'Me'}</div>
                    <div className="text-xs font-bold text-slate-400">{authenticatedUser?.positionName || 'Meeting Rooms'}</div>
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

          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 flex flex-col gap-6">
            {/* Title row */}
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-[#2447d8]">
                  <Home size={14} />
                  {COMPANY} · Office · {navLabel}
                </div>
                <h1 className="mt-4 text-3xl font-black tracking-normal text-slate-950 sm:text-4xl">
                  Meeting Rooms
                </h1>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                  Room Booking · automatic conflict check · pick a room and review the day at a glance
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 shadow-sm">
                  <CalendarDays size={17} style={{ color: ACE_RED }} />
                  {formatToday()}
                </div>
                <button
                  onClick={() => openNew(null)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#2447d8] px-4 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#1d3bb8]"
                >
                  <Plus size={17} />
                  Book a room
                </button>
              </div>
            </div>

            {/* Stat cards */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total Rooms"     value={stats.totalRooms}    hint="in the system"   accent={ACE_BLUE} />
              <StatCard label="Bookings Today"  value={stats.totalBookings} hint={prettyDate(date)} accent="#16a34a" />
              <StatCard label="Free All Day"    value={stats.free}          hint="available"       accent="#d97706" />
              <StatCard label="My Bookings"     value={stats.mine}          hint="today"           accent={ACE_RED} />
            </section>

            {banner && (
              <div className={`rounded-xl border px-4 py-2.5 text-sm font-bold ${banner.startsWith('⚠')
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                {banner}
              </div>
            )}

            {/* Section content */}
            {activeNav === 'schedule' && (
              <ScheduleSection
                date={date}
                setDate={setDate}
                view={scheduleView}
                setView={setScheduleView}
                loading={loading}
                rooms={filteredRooms}
                byRoom={byRoom}
                onNewBooking={openNew}
                onCancel={cancel}
                onEdit={openEdit}
                onConflict={() => { setBanner('⚠ That time overlaps an existing booking'); setTimeout(() => setBanner(''), 2500) }}
              />
            )}

            {activeNav === 'mine' && (
              <MyBookingsSection
                date={date}
                setDate={setDate}
                loading={loading}
                rooms={rooms}
                bookings={myBookings}
                onCancel={cancel}
                onEdit={openEdit}
                onRebook={openRebook}
                onNewBooking={() => openNew(null)}
              />
            )}

            {activeNav === 'summary' && (
              <SummarySection search={search} onRebook={openRebook} />
            )}

            {activeNav === 'rooms' && (
              <RoomsListSection
                rooms={filteredRooms}
                byRoom={byRoom}
                onNewBooking={openNew}
                canManage={canManageRooms}
                onChanged={() => { loadRooms(); setBanner('Rooms updated'); setTimeout(() => setBanner(''), 2000) }}
              />
            )}
          </div>
        </main>
      </div>

      <BookingModal
        open={showModal}
        rooms={rooms}
        date={date}
        editing={editing}
        prefill={prefill}
        presetRoomId={presetRoomId}
        presetStart={presetStart}
        presetEnd={presetEnd}
        onClose={() => { setShowModal(false); setPrefill(null) }}
        onSaved={(data) => {
          const wasEdit = !!editing
          const n = data?.created_count || 1
          setShowModal(false); setEditing(null); setPrefill(null)
          setBanner(wasEdit ? 'Changes saved' : (n > 1 ? `${n} bookings created` : 'Booking confirmed'))
          loadBookings(date); setTimeout(() => setBanner(''), 2500)
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-sections
// ---------------------------------------------------------------------------
function DateNav({ date, setDate }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <IconButton label="Previous day" onClick={() => setDate(addDays(date, -1))}>
        <ChevronLeft size={18} />
      </IconButton>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm"
      />
      <IconButton label="Next day" onClick={() => setDate(addDays(date, 1))}>
        <ChevronRight size={18} />
      </IconButton>
      <button
        onClick={() => setDate(todayISO())}
        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#2447d8]"
      >
        Today
      </button>
      <span className="ml-1 text-sm font-bold text-slate-600">{prettyDate(date)}</span>
    </div>
  )
}

function ViewToggle({ view, setView }) {
  return (
    <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
      {[['day', 'Day'], ['week', 'Week']].map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => setView(id)}
          className={`rounded-xl px-4 py-1.5 text-sm font-bold transition ${view === id ? 'bg-[#2447d8] text-white shadow' : 'text-slate-500 hover:text-slate-900'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function WeekNav({ weekStart, setDate }) {
  const end = addDays(weekStart, 6)
  return (
    <div className="flex flex-wrap items-center gap-2">
      <IconButton label="Previous week" onClick={() => setDate(addDays(weekStart, -7))}>
        <ChevronLeft size={18} />
      </IconButton>
      <IconButton label="Next week" onClick={() => setDate(addDays(weekStart, 7))}>
        <ChevronRight size={18} />
      </IconButton>
      <button
        onClick={() => setDate(todayISO())}
        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#2447d8]"
      >
        This week
      </button>
      <span className="ml-1 text-sm font-bold text-slate-600">{dayMonth(weekStart)} – {prettyDate(end)}</span>
    </div>
  )
}

function ScheduleSection({ date, setDate, view, setView, loading, rooms, byRoom, onNewBooking, onCancel, onEdit, onConflict }) {
  const weekStart = mondayOf(date)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {view === 'day' ? <DateNav date={date} setDate={setDate} /> : <WeekNav weekStart={weekStart} setDate={setDate} />}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-[#2447d8]">
            <CalendarRange size={14} />
            {view === 'day' ? 'Drag across a row to book · click to edit' : 'Click a day to open it · click a booking to edit'}
          </div>
          <ViewToggle view={view} setView={setView} />
        </div>
      </div>

      {rooms.length === 0 ? (
        <Card className="py-2">
          <EmptyState
            icon={DoorOpen}
            title="No meeting rooms"
            desc="No rooms match the current filter"
          />
        </Card>
      ) : view === 'week' ? (
        <WeekGrid
          weekStart={weekStart}
          rooms={rooms}
          onOpenDay={(d) => { setDate(d); setView('day') }}
          onCellCreate={(d, roomId) => { setDate(d); onNewBooking(roomId) }}
          onEdit={onEdit}
        />
      ) : loading ? (
        <Card className="flex items-center justify-center gap-3 py-16 text-sm font-bold text-slate-400">
          <Spinner size={20} />
          Loading…
        </Card>
      ) : (
        <TimelineGrid rooms={rooms} byRoom={byRoom} onCreate={onNewBooking} onCancel={onCancel} onEdit={onEdit} onConflict={onConflict} />
      )}
    </div>
  )
}

function WeekGrid({ weekStart, rooms, onOpenDay, onCellCreate, onEdit }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      try {
        const from = weekStart
        const to = addDays(weekStart, 6)
        const res = await apiFetch(`/api/room-bookings/range?date_from=${from}&date_to=${to}`)
        const data = await res.json().catch(() => ({}))
        if (active) setRows(data.bookings || [])
      } catch {
        if (active) setRows([])
      }
      if (active) setLoading(false)
    })()
    return () => { active = false }
  }, [weekStart])

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const today = todayISO()

  const byCell = useMemo(() => {
    const m = new Map()
    for (const b of rows) {
      const k = `${b.room_id}|${b.booking_date}`
      if (!m.has(k)) m.set(k, [])
      m.get(k).push(b)
    }
    for (const arr of m.values()) arr.sort((a, b) => a.start_time.localeCompare(b.start_time))
    return m
  }, [rows])

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="min-w-max">
        {/* Header — day columns */}
        <div className="flex border-b border-slate-200 bg-slate-50/80">
          <div className="sticky left-0 z-10 shrink-0 border-r border-slate-200 bg-slate-50/80" style={{ width: LABEL_W }} />
          {days.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onOpenDay(d)}
              className={`shrink-0 border-l border-slate-100 px-3 py-2.5 text-left transition hover:bg-blue-50 ${d === today ? 'bg-blue-50/60' : ''}`}
              style={{ width: 168 }}
              title="Open this day"
            >
              <div className={`text-xs font-black ${d === today ? 'text-[#2447d8]' : 'text-slate-500'}`}>{weekdayLabel(d)}</div>
              <div className={`text-sm font-bold ${d === today ? 'text-[#2447d8]' : 'text-slate-800'}`}>{dayMonth(d)}</div>
            </button>
          ))}
        </div>

        {/* Body — one row per room */}
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-sm font-bold text-slate-400">
            <Spinner size={20} /> Loading…
          </div>
        ) : rooms.map((room) => {
          const color = room.color || DEFAULT_COLOR
          return (
            <div key={room.id} className="flex border-b border-slate-100 last:border-b-0">
              <div className="sticky left-0 z-10 flex shrink-0 flex-col justify-center border-r border-slate-200 bg-white px-3"
                style={{ width: LABEL_W, minHeight: 84, borderLeft: `3px solid ${color}` }}>
                <div className="truncate text-sm font-black text-slate-900">{room.name}</div>
                <div className="truncate text-[11px] font-bold text-slate-400">
                  {room.location || '—'}{room.capacity ? ` · ${room.capacity} seats` : ''}
                </div>
              </div>
              {days.map((d) => {
                const list = byCell.get(`${room.id}|${d}`) || []
                return (
                  <div key={d} className="group relative shrink-0 border-l border-slate-100 p-1.5" style={{ width: 168, minHeight: 84 }}>
                    {list.slice(0, 3).map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => b.is_mine && onEdit?.(b)}
                        title={`${b.start_time}–${b.end_time} · ${b.title}${b.is_mine ? ' · click to edit' : ''}`}
                        className={`mb-1 block w-full overflow-hidden rounded-md px-2 py-1 text-left ${b.is_mine ? 'cursor-pointer' : 'cursor-default'}`}
                        style={{ background: `${color}1a`, borderLeft: `3px solid ${color}` }}
                      >
                        <div className="text-[10px] font-black" style={{ color }}>{b.start_time}–{b.end_time}</div>
                        <div className="truncate text-[11px] font-bold text-slate-700">{b.title}</div>
                      </button>
                    ))}
                    {list.length > 3 && (
                      <button type="button" onClick={() => onOpenDay(d)} className="block w-full text-left text-[10px] font-bold text-slate-400 hover:text-[#2447d8]">
                        +{list.length - 3} more
                      </button>
                    )}
                    {list.length === 0 && (
                      <button
                        type="button"
                        onClick={() => onCellCreate(d, room.id)}
                        className="flex h-full min-h-[72px] w-full items-center justify-center rounded-md text-slate-300 opacity-0 transition group-hover:opacity-100 hover:bg-blue-50 hover:text-[#2447d8]"
                        title="Book this room"
                      >
                        <Plus size={16} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MyBookingsSection({ date, setDate, loading, rooms, bookings, onCancel, onEdit, onRebook, onNewBooking }) {
  const roomById = useMemo(() => new Map(rooms.map(r => [r.id, r])), [rooms])
  return (
    <div className="flex flex-col gap-4">
      <DateNav date={date} setDate={setDate} />

      {loading ? (
        <Card className="flex items-center justify-center gap-3 py-16 text-sm font-bold text-slate-400">
          <Spinner size={20} />
          Loading…
        </Card>
      ) : bookings.length === 0 ? (
        <Card className="py-2">
          <EmptyState
            icon={Clock}
            title="You have no bookings today"
            desc="Book a room and it will appear here"
            action={<Button variant="primary" icon={Plus} onClick={onNewBooking}>Book a room</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {bookings.map(b => {
            const room = roomById.get(b.room_id)
            const color = (room && room.color) || DEFAULT_COLOR
            return (
              <Card key={b.id} className="overflow-hidden">
                <div className="flex items-start justify-between gap-3 px-5 py-4"
                  style={{ borderLeft: `4px solid ${color}` }}>
                  <div className="min-w-0">
                    <div className="text-xs font-black uppercase tracking-wider text-slate-400">
                      {room?.name || `Room #${b.room_id}`}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-lg font-black text-slate-900">{b.title}</span>
                      {b.occurrence && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-700">
                          <Hash size={11} />#{b.occurrence}{b.series_total > 1 ? `/${b.series_total}` : ''}
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} />{b.start_time}–{b.end_time}
                      </span>
                      {b.attendees ? (
                        <span className="inline-flex items-center gap-1">
                          <Users size={12} />{b.attendees} people
                        </span>
                      ) : null}
                      <Badge tone="blue">{prettyDate(b.booking_date || date)}</Badge>
                    </div>
                    {b.attendee_list && b.attendee_list.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {b.attendee_list.map(a => (
                          <span key={a.code}
                            className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-[#2447d8]">
                            {a.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {b.notes && <div className="mt-2 text-xs text-slate-500">{b.notes}</div>}
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <button
                      onClick={() => onEdit?.(b)}
                      className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#2447d8] hover:bg-blue-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onRebook?.(b)}
                      title="Schedule again with the same topic and attendees"
                      className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-100"
                    >
                      Book again
                    </button>
                    <button
                      onClick={() => onCancel(b)}
                      className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SummarySection({ search, onRebook }) {
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      try {
        const res = await apiFetch('/api/room-bookings/summary')
        const data = await res.json().catch(() => ({}))
        if (active) setTopics(data.topics || [])
      } catch {
        if (active) setTopics([])
      }
      if (active) setLoading(false)
    })()
    return () => { active = false }
  }, [])

  const filtered = useMemo(() => {
    const q = (search || '').trim().toLowerCase()
    if (!q) return topics
    return topics.filter(t => String(t.title || '').toLowerCase().includes(q))
  }, [topics, search])

  const totalMeetings = useMemo(() => topics.reduce((s, t) => s + (t.count || 0), 0), [topics])

  if (loading) {
    return (
      <Card className="flex items-center justify-center gap-3 py-16 text-sm font-bold text-slate-400">
        <Spinner size={20} />
        Loading…
      </Card>
    )
  }
  if (topics.length === 0) {
    return (
      <Card className="py-2">
        <EmptyState icon={ClipboardList} title="No meeting data yet" desc="Once rooms are booked, each topic count is summarized automatically" />
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Meeting Topics" value={topics.length} hint="all topics" accent={ACE_BLUE} />
        <StatCard label="Total Meetings" value={totalMeetings} hint="all bookings" accent="#16a34a" />
        <StatCard label="Most Frequent" value={topics.reduce((m, t) => Math.max(m, t.count || 0), 0)} hint="top topic count" accent="#d97706" />
      </section>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3 text-sm font-black text-slate-900">
          Meeting summary by topic
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-black uppercase tracking-wide text-slate-400">
                <th className="px-5 py-2.5">Topic</th>
                <th className="px-3 py-2.5 text-center">Meetings</th>
                <th className="px-3 py-2.5">First</th>
                <th className="px-3 py-2.5">Latest</th>
                <th className="px-5 py-2.5 text-center">Next</th>
                <th className="px-5 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-5 py-3 font-bold text-slate-800">
                    {t.title}
                    {t.last_attendees && t.last_attendees.length > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                        <Users size={11} />{t.last_attendees.length}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-black text-amber-700">
                      <Hash size={11} />{t.count} times
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-500">{prettyDate(t.first_date)}</td>
                  <td className="px-3 py-3 text-slate-500">{prettyDate(t.last_date)}</td>
                  <td className="px-5 py-3 text-center font-black text-[#2447d8]">#{t.next_occurrence}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => onRebook?.(t)}
                      title="Schedule again with the same topic and attendees"
                      className="inline-flex items-center gap-1 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#2447d8] hover:bg-blue-100">
                      <CalendarRange size={13} />Book again
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-sm font-semibold text-slate-400">No topics match your search</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

const ROOM_COLORS = ['#2563eb', '#16a34a', '#9333ea', '#b45309', '#dc2626', '#0891b2', '#db2777', '#475569']

function RoomFormModal({ open, room, onClose, onSaved }) {
  const isEdit = !!(room && room.id)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [capacity, setCapacity] = useState('')
  const [color, setColor] = useState(ROOM_COLORS[0])
  const [isActive, setIsActive] = useState(true)
  const [imageUrl, setImageUrl] = useState(null)   // existing saved image
  const [imageFile, setImageFile] = useState(null) // newly chosen file
  const [imagePreview, setImagePreview] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(room?.name || '')
    setLocation(room?.location || '')
    setCapacity(room?.capacity != null ? String(room.capacity) : '')
    setColor(room?.color || ROOM_COLORS[0])
    setIsActive(room?.is_active !== false)
    setImageUrl(room?.image_url || null)
    setImageFile(null); setImagePreview(null)
    setError(''); setSaving(false)
  }, [open, room])

  function pickImage(e) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) { setError('Image too large (max 5 MB)'); return }
    setImageFile(f)
    setImagePreview(URL.createObjectURL(f))
    setError('')
  }
  function clearImage() {
    setImageFile(null); setImagePreview(null); setImageUrl(null)
  }
  const shownImage = imagePreview || imageUrl

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Room name is required'); return }
    setSaving(true)
    try {
      const body = {
        name: name.trim(),
        location: location.trim() || null,
        capacity: capacity ? Number(capacity) : null,
        color,
        image_url: imageUrl, // preserve/clear existing; new uploads set below
        is_active: isActive,
      }
      const res = await apiFetch(
        isEdit ? `/api/meeting-rooms/${room.id}` : '/api/meeting-rooms',
        { method: isEdit ? 'PATCH' : 'POST', body: JSON.stringify(body) },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.detail || 'Failed to save room'); setSaving(false); return }
      // Upload the chosen photo to the (now-existing) room.
      const roomId = isEdit ? room.id : data.id
      if (imageFile && roomId) {
        const fd = new FormData()
        fd.append('file', imageFile)
        const up = await apiFetch(`/api/meeting-rooms/${roomId}/image`, { method: 'POST', body: fd })
        if (!up.ok) { const d = await up.json().catch(() => ({})); setError(d.detail || 'Saved, but image upload failed'); setSaving(false); return }
      }
      onSaved()
    } catch {
      setError('Connection error. Please try again.')
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} width={460}>
      <form onSubmit={submit}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="text-base font-black text-slate-900">{isEdit ? 'Edit Room' : 'Add Room'}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <div className="space-y-3 px-5 py-4">
          {/* Room photo */}
          <div className="block">
            <span className="text-xs font-bold text-slate-600">Room photo</span>
            <div className="mt-1.5 overflow-hidden rounded-xl border border-slate-200">
              {shownImage ? (
                <div className="relative">
                  <img src={shownImage} alt="Room" className="h-36 w-full object-cover" />
                  <div className="absolute right-2 top-2 flex gap-2">
                    <label className="cursor-pointer rounded-lg bg-black/55 px-2.5 py-1 text-xs font-bold text-white backdrop-blur hover:bg-black/70">
                      Change
                      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={pickImage} className="hidden" />
                    </label>
                    <button type="button" onClick={clearImage}
                      className="rounded-lg bg-black/55 px-2.5 py-1 text-xs font-bold text-white backdrop-blur hover:bg-rose-600">
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex h-36 cursor-pointer flex-col items-center justify-center gap-2 bg-slate-50 text-slate-400 transition hover:bg-blue-50 hover:text-[#2447d8]">
                  <ImagePlus size={26} />
                  <span className="text-xs font-bold">Upload room photo (JPG/PNG/WebP, ≤5 MB)</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={pickImage} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <label className="block">
            <span className="text-xs font-bold text-slate-600">Room name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120}
              placeholder="e.g. Meeting Room 3"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-bold text-slate-600">Location</span>
              <input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={200}
                placeholder="e.g. Floor 2"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-600">Capacity</span>
              <input type="number" min={0} value={capacity} onChange={(e) => setCapacity(e.target.value)}
                placeholder="seats"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </label>
          </div>
          <div className="block">
            <span className="text-xs font-bold text-slate-600">Colour</span>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {ROOM_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full transition ${color === c ? 'ring-2 ring-offset-2 ring-slate-900' : ''}`}
                  style={{ background: c }} aria-label={`Colour ${c}`} />
              ))}
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                className="h-8 w-10 cursor-pointer rounded border border-slate-300" title="Custom colour" />
            </div>
          </div>
          {isEdit && (
            <label className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 accent-[#2447d8]" />
              <span className="text-xs font-semibold text-slate-600">Active (available for booking)</span>
            </label>
          )}
          {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</div>}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving…' : (isEdit ? 'Save changes' : 'Add room')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function RoomsListSection({ rooms, byRoom, onNewBooking, canManage, onChanged }) {
  const [managed, setManaged] = useState(null) // admin: full list incl. inactive
  const [formOpen, setFormOpen] = useState(false)
  const [editRoom, setEditRoom] = useState(null)
  const [tick, setTick] = useState(0)

  // Admins manage the full catalog (including inactive rooms); others see the
  // active rooms passed from the page.
  useEffect(() => {
    if (!canManage) { setManaged(null); return }
    let active = true
    ;(async () => {
      try {
        const res = await apiFetch('/api/meeting-rooms?include_inactive=true')
        const data = await res.json().catch(() => ({}))
        if (active) setManaged(data.rooms || [])
      } catch {
        if (active) setManaged([])
      }
    })()
    return () => { active = false }
  }, [canManage, tick])

  const list = canManage ? (managed || []) : rooms

  async function deactivate(room) {
    if (!window.confirm(`Deactivate "${room.name}"? It will be hidden from new bookings (existing bookings are kept).`)) return
    const res = await apiFetch(`/api/meeting-rooms/${room.id}`, { method: 'DELETE' })
    if (res.ok) { setTick(t => t + 1); onChanged?.() }
    else { const d = await res.json().catch(() => ({})); window.alert(d.detail || 'Failed to deactivate') }
  }

  async function activate(room) {
    const res = await apiFetch(`/api/meeting-rooms/${room.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: room.name, location: room.location, capacity: room.capacity, color: room.color, image_url: room.image_url || null, is_active: true }),
    })
    if (res.ok) { setTick(t => t + 1); onChanged?.() }
    else { const d = await res.json().catch(() => ({})); window.alert(d.detail || 'Failed to activate') }
  }

  function openAdd() { setEditRoom(null); setFormOpen(true) }
  function openEdit(room) { setEditRoom(room); setFormOpen(true) }

  return (
    <div className="flex flex-col gap-4">
      {canManage && (
        <div className="flex justify-end">
          <Button variant="primary" icon={Plus} onClick={openAdd}>Add room</Button>
        </div>
      )}

      {list.length === 0 ? (
        <Card className="py-2">
          <EmptyState
            icon={DoorOpen}
            title="No meeting rooms"
            desc="No meeting rooms in the system"
            action={canManage ? <Button variant="primary" icon={Plus} onClick={openAdd}>Add room</Button> : undefined}
          />
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {list.map(room => {
            const used = (byRoom.get(room.id) || []).length
            const color = room.color || DEFAULT_COLOR
            const inactive = room.is_active === false
            return (
              <Card key={room.id} className={`overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg ${inactive ? 'opacity-60' : ''}`}>
                {/* Photo header (falls back to a brand gradient with an icon) */}
                <div className="relative h-36 w-full overflow-hidden">
                  {room.image_url ? (
                    <img src={room.image_url} alt={room.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${color}, ${color}b3)` }}>
                      <DoorOpen size={40} className="text-white/85" />
                    </div>
                  )}
                  <div className="absolute right-3 top-3">
                    {inactive
                      ? <Badge tone="slate">Inactive</Badge>
                      : <Badge tone={used > 0 ? 'amber' : 'green'} dot>{used > 0 ? `${used} bookings` : 'Free'}</Badge>}
                  </div>
                </div>
                <div className="px-5 py-4" style={{ borderTop: `3px solid ${color}` }}>
                  <div className="min-w-0">
                    <div className="truncate text-base font-black text-slate-900">{room.name}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                      {room.location && (
                        <span className="inline-flex items-center gap-1"><MapPin size={12} />{room.location}</span>
                      )}
                      {room.capacity ? (
                        <span className="inline-flex items-center gap-1"><Users size={12} />{room.capacity} seats</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    {canManage && (
                      <>
                        <button onClick={() => openEdit(room)}
                          className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#2447d8] hover:bg-blue-100">
                          Edit
                        </button>
                        {inactive ? (
                          <button onClick={() => activate(room)}
                            className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100">
                            Activate
                          </button>
                        ) : (
                          <button onClick={() => deactivate(room)}
                            className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100">
                            Deactivate
                          </button>
                        )}
                      </>
                    )}
                    {!inactive && (
                      <Button variant="primary" icon={Plus} onClick={() => onNewBooking(room.id)}>Book</Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <RoomFormModal
        open={formOpen}
        room={editRoom}
        onClose={() => setFormOpen(false)}
        onSaved={() => { setFormOpen(false); setTick(t => t + 1); onChanged?.() }}
      />
    </div>
  )
}
