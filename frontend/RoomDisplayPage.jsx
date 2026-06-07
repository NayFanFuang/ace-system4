// Public door-mounted room display (kiosk). No authentication required.
// Open at /room-display?room=<id> on the screen outside a meeting room.
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, Clock, DoorOpen, MapPin, Users } from 'lucide-react'

const DEFAULT_COLOR = '#2447d8'

function todayISO() {
  const d = new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

function toMin(hhmm) {
  const [h, m] = String(hhmm || '0:0').split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return now
}

function getRoomParam() {
  try {
    return new URLSearchParams(window.location.search).get('room')
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Room picker (shown when no ?room= is set)
// ---------------------------------------------------------------------------
function RoomPicker() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch('/api/public/rooms')
        const data = await res.json().catch(() => ({}))
        if (active) setRooms(data.rooms || [])
      } catch {
        if (active) setRooms([])
      }
      if (active) setLoading(false)
    })()
    return () => { active = false }
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
            <DoorOpen size={26} />
          </div>
          <div>
            <div className="text-2xl font-black">Room Display</div>
            <div className="text-sm font-semibold text-white/50">Select a room to show on its door screen</div>
          </div>
        </div>
        {loading ? (
          <div className="py-20 text-center text-white/40">Loading…</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((r) => (
              <a
                key={r.id}
                href={`/room-display?room=${r.id}`}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:bg-white/10"
                style={{ borderTop: `4px solid ${r.color || DEFAULT_COLOR}` }}
              >
                <div className="text-xl font-black">{r.name}</div>
                <div className="mt-2 flex flex-wrap gap-3 text-sm font-semibold text-white/50">
                  {r.location && <span className="inline-flex items-center gap-1"><MapPin size={14} />{r.location}</span>}
                  {r.capacity ? <span className="inline-flex items-center gap-1"><Users size={14} />{r.capacity} seats</span> : null}
                </div>
              </a>
            ))}
            {rooms.length === 0 && <div className="text-white/40">No active rooms.</div>}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main kiosk display for one room
// ---------------------------------------------------------------------------
export default function RoomDisplayPage() {
  const roomId = getRoomParam()
  const now = useClock()
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    if (!roomId) return
    try {
      const res = await fetch(`/api/public/room-display?room_id=${roomId}&date=${todayISO()}`)
      if (!res.ok) { setError(true); return }
      const json = await res.json().catch(() => null)
      if (json) { setData(json); setError(false) }
    } catch {
      setError(true)
    }
  }, [roomId])

  // Initial + 30s auto-refresh; also reload when the day rolls over.
  useEffect(() => {
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [load])

  const dayKey = todayISO()
  useEffect(() => { load() }, [dayKey, load])

  const nowMin = now.getHours() * 60 + now.getMinutes()
  const bookings = data?.bookings || []

  const { current, next } = useMemo(() => {
    let cur = null
    let nxt = null
    for (const b of bookings) {
      const s = toMin(b.start_time)
      const e = toMin(b.end_time)
      if (nowMin >= s && nowMin < e) cur = b
      else if (s > nowMin && !nxt) nxt = b
    }
    return { current: cur, next: nxt }
  }, [bookings, nowMin])

  if (!roomId) return <RoomPicker />

  const room = data?.room
  const color = room?.color || DEFAULT_COLOR
  const busy = !!current
  const accent = busy ? '#dc2626' : '#16a34a'
  const accentDark = busy ? '#7f1d1d' : '#14532d'

  const clock = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const dateLabel = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const statusLine = busy
    ? `In use until ${current.end_time}`
    : next
      ? `Available until ${next.start_time}`
      : 'Available for the rest of the day'

  return (
    <div className="flex min-h-screen flex-col text-white"
      style={{ background: `linear-gradient(160deg, ${accent}, ${accentDark})` }}>
      {/* Header */}
      <div className="flex items-start justify-between px-10 pt-8">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[.2em] text-white/70">
            <span className="inline-block h-3 w-3 rounded-full" style={{ background: color }} />
            Meeting Room
          </div>
          <div className="mt-1 truncate text-5xl font-black sm:text-6xl">{room?.name || `Room #${roomId}`}</div>
          <div className="mt-3 flex flex-wrap gap-5 text-lg font-bold text-white/75">
            {room?.location && <span className="inline-flex items-center gap-2"><MapPin size={20} />{room.location}</span>}
            {room?.capacity ? <span className="inline-flex items-center gap-2"><Users size={20} />{room.capacity} seats</span> : null}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-6xl font-black tabular-nums sm:text-7xl">{clock}</div>
          <div className="mt-1 text-base font-bold text-white/70">{dateLabel}</div>
        </div>
      </div>

      {/* Status hero */}
      <div className="flex flex-1 flex-col items-center justify-center px-10 text-center">
        <div className="rounded-full bg-white/15 px-8 py-3 text-2xl font-black uppercase tracking-[.25em] backdrop-blur">
          {error ? 'Offline' : busy ? 'In Use' : 'Available'}
        </div>
        <div className="mt-6 text-3xl font-black sm:text-4xl">{statusLine}</div>
        {busy && (
          <div className="mt-6 max-w-3xl">
            <div className="text-xl font-bold text-white/70">Now</div>
            <div className="mt-1 truncate text-4xl font-black sm:text-5xl">{current.title}</div>
            <div className="mt-2 text-2xl font-bold text-white/80">
              {current.start_time}–{current.end_time}
              {current.booked_by_name ? ` · ${current.booked_by_name}` : ''}
            </div>
          </div>
        )}
        {!busy && next && (
          <div className="mt-6 max-w-3xl">
            <div className="text-xl font-bold text-white/70">Up next</div>
            <div className="mt-1 truncate text-3xl font-black">{next.title}</div>
            <div className="mt-1 text-xl font-bold text-white/80">
              {next.start_time}–{next.end_time}
              {next.booked_by_name ? ` · ${next.booked_by_name}` : ''}
            </div>
          </div>
        )}
      </div>

      {/* Today's schedule */}
      <div className="bg-black/25 px-10 py-6 backdrop-blur">
        <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[.2em] text-white/70">
          <CalendarDays size={16} /> Today’s Schedule
        </div>
        {bookings.length === 0 ? (
          <div className="text-lg font-bold text-white/60">No bookings today — walk right in.</div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {bookings.map((b, i) => {
              const isNow = current && b.start_time === current.start_time && b.title === current.title
              const past = toMin(b.end_time) <= nowMin
              return (
                <div key={i}
                  className={`flex min-w-[200px] items-center gap-3 rounded-2xl px-4 py-2.5 ${isNow ? 'bg-white text-slate-900' : past ? 'bg-white/5 text-white/40' : 'bg-white/15 text-white'}`}>
                  <Clock size={18} className="shrink-0" />
                  <div className="min-w-0">
                    <div className="text-base font-black tabular-nums">{b.start_time}–{b.end_time}</div>
                    <div className="truncate text-sm font-bold opacity-80">{b.title}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
