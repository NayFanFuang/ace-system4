'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { apiFetch } from './src/apiFetch.js'

const ACE_BLUE = '#2447d8'
const ACE_RED = '#c73b32'
const ACE_GRADIENT = `linear-gradient(135deg, ${ACE_BLUE} 0%, ${ACE_RED} 100%)`

const STATUS = {
  on_site:  { label: 'ON SITE',  color: '#16a34a', chipBg: 'bg-emerald-50', chipText: 'text-emerald-700' },
  off_site: { label: 'OFF SITE', color: '#dc2626', chipBg: 'bg-red-50',     chipText: 'text-red-700' },
  no_site:  { label: 'OFFICE',   color: '#3b82f6', chipBg: 'bg-blue-50',    chipText: 'text-blue-700' },
  no_gps:   { label: 'NO GPS',   color: '#94a3b8', chipBg: 'bg-slate-100',  chipText: 'text-slate-600' },
}

const REFRESH_MS = 30_000
const CYCLE_MS   = 6_000

function timeText(iso) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) } catch { return '—' }
}

function fullClock() {
  return new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function photoSrc(raw) {
  if (!raw) return ''
  if (raw.startsWith('data:') || raw.startsWith('http') || raw.startsWith('/')) return raw
  return `data:image/jpeg;base64,${raw}`
}

function thaiDate() {
  return new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]))
}

function WallboardMap({ people }) {
  const mapEl = useRef(null)
  const mapInstance = useRef(null)
  const layerRef = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (window.L) { setReady(true); return }
    const t = setInterval(() => {
      if (cancelled) { clearInterval(t); return }
      if (window.L) { clearInterval(t); setReady(true) }
    }, 100)
    const timeout = setTimeout(() => clearInterval(t), 10000)
    return () => { cancelled = true; clearInterval(t); clearTimeout(timeout) }
  }, [])

  useEffect(() => {
    if (!ready || !mapEl.current || mapInstance.current) return
    const L = window.L
    const map = L.map(mapEl.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: true })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)
    map.setView([13.7563, 100.5018], 6)
    mapInstance.current = map
    layerRef.current = L.layerGroup().addTo(map)
  }, [ready])

  useEffect(() => {
    if (!mapInstance.current || !layerRef.current || !window.L) return
    const L = window.L
    const layer = layerRef.current
    layer.clearLayers()

    const bounds = []
    people.forEach(p => {
      if (p.lat == null || p.lng == null) return
      const meta = STATUS[p.status] || STATUS.no_gps
      const initial = escapeHtml((p.name || '?').charAt(0).toUpperCase())
      const pulse = p.status === 'off_site' ? 'animation:acePulseRed 1.5s ease-out infinite;' : ''
      const html =
        `<div style="position:relative;width:30px;height:30px">
          <div style="position:absolute;inset:0;background:${meta.color};color:#fff;border:3px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;box-shadow:0 3px 8px rgba(0,0,0,.35);${pulse}">${initial}</div>
        </div>`
      const icon = L.divIcon({ className: 'ace-wb-pin', html, iconSize: [30, 30], iconAnchor: [15, 15] })
      L.marker([p.lat, p.lng], { icon })
        .bindTooltip(`<b>${escapeHtml(p.name)}</b><br/>${meta.label}`, { direction: 'top', offset: [0, -15] })
        .addTo(layer)
      bounds.push([p.lat, p.lng])
    })

    if (bounds.length > 0) {
      try { mapInstance.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 }) } catch {}
    }
  }, [people, ready])

  return (
    <div className="relative w-full h-full">
      <style>{`
        @keyframes acePulseRed {
          0%   { box-shadow: 0 0 0 0 rgba(220,38,38,.7), 0 3px 8px rgba(0,0,0,.35); }
          70%  { box-shadow: 0 0 0 14px rgba(220,38,38,0), 0 3px 8px rgba(0,0,0,.35); }
          100% { box-shadow: 0 0 0 0 rgba(220,38,38,0),  0 3px 8px rgba(0,0,0,.35); }
        }
        .ace-wb-pin { background: transparent !important; border: 0 !important; }
      `}</style>
      <div ref={mapEl} className="w-full h-full" style={{ background: '#e2e8f0' }} />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xl font-bold pointer-events-none">
          ⏳ Loading map…
        </div>
      )}
    </div>
  )
}

function PersonCard({ person, onPhotoClick }) {
  if (!person) return null
  const meta = STATUS[person.status] || STATUS.no_gps
  const time = timeText(person.timeISO)
  const dist = person.distanceM != null ? `${Math.round(person.distanceM).toLocaleString()} m` : null

  return (
    <div className="rounded-2xl bg-white/60 border border-white/70 shadow-xl overflow-hidden backdrop-blur-md">
      <div className="relative aspect-[4/3] bg-slate-100/40 cursor-pointer" onClick={() => person.photoIn && onPhotoClick(person.photoIn)}>
        {person.photoIn ? (
          <img
            src={photoSrc(person.photoIn)}
            alt={person.name}
            className="w-full h-full object-cover"
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-7xl font-black text-slate-400/60">{(person.name || '?').charAt(0).toUpperCase()}</div>
          </div>
        )}
        <div className="absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-black tracking-wide text-white shadow-md" style={{ background: meta.color }}>
          ● {meta.label}
        </div>
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent px-4 py-3">
          <div className="text-2xl font-black text-white truncate">{person.name}</div>
          <div className="text-xs font-mono text-slate-200">{person.employeeCode}{person.position ? ` · ${person.position}` : ''}</div>
        </div>
      </div>
      <div className="p-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-[.65rem] font-black uppercase tracking-wider text-slate-600">Time</div>
          <div className="text-xl font-black text-slate-900 tabular-nums">{time}</div>
        </div>
        <div>
          <div className="text-[.65rem] font-black uppercase tracking-wider text-slate-600">Project</div>
          <div className="text-base font-black text-slate-900 truncate">{person.projectCode || '—'}</div>
        </div>
        <div className="col-span-2">
          <div className="text-[.65rem] font-black uppercase tracking-wider text-slate-600">Site</div>
          <div className="text-sm font-bold text-slate-800 truncate">{person.siteName || person.siteCode || (person.clockType === 'DAILY' ? 'Office / Daily clock' : '—')}</div>
        </div>
        {dist && (
          <div className="col-span-2">
            <div className="text-[.65rem] font-black uppercase tracking-wider text-slate-600">Distance from site</div>
            <div className={`text-base font-black ${person.status === 'off_site' ? 'text-red-600' : 'text-emerald-600'}`}>{dist}</div>
          </div>
        )}
      </div>
    </div>
  )
}

function MiniRow({ person, active, onClick }) {
  const meta = STATUS[person.status] || STATUS.no_gps
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full text-left flex items-center gap-3 rounded-xl border px-3 py-2 transition',
        active
          ? 'bg-blue-50 border-blue-300 shadow-sm'
          : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
      ].join(' ')}
    >
      <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 text-white" style={{ background: meta.color }}>
        {(person.name || '?').charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-black text-slate-900 truncate">{person.name}</div>
        <div className="text-[.65rem] font-mono text-slate-500 truncate">{timeText(person.timeISO)} · {person.siteCode || person.projectCode || '—'}</div>
      </div>
      <div className={`text-[.6rem] font-black px-1.5 py-0.5 rounded ${meta.chipBg} ${meta.chipText}`}>
        {meta.label}
      </div>
    </button>
  )
}

function PhotoModal({ src, onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  if (!src) return null
  return (
    <div className="fixed inset-0 z-[1000] bg-black/80 flex items-center justify-center p-6" onClick={onClose}>
      <img
        src={photoSrc(src)}
        alt="Clock-in"
        className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      />
    </div>
  )
}

export default function ClockWallboardPage({ authenticatedUser, onLogout }) {
  const [data, setData] = useState({ people: [], meta: null })
  const [lastSync, setLastSync] = useState('')
  const [clock, setClock] = useState(fullClock())
  const [activeIdx, setActiveIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const [photoModal, setPhotoModal] = useState(null)
  const [team, setTeam] = useState('ALL')
  const [loadError, setLoadError] = useState(false)
  const [departments, setDepartments] = useState([])

  useEffect(() => {
    let cancelled = false
    apiFetch('/api/clock/monitor/departments')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (!cancelled && d?.departments) setDepartments(d.departments) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const r = await apiFetch(`/api/clock/monitor/today-map?team=${encodeURIComponent(team)}`)
        if (cancelled) return
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const d = await r.json()
        if (cancelled) return
        setData({ people: d.people || [], meta: d.meta || null })
        setLastSync(new Date().toLocaleTimeString('th-TH'))
        setLoadError(false)
      } catch {
        if (!cancelled) setLoadError(true)
      }
    }
    load()
    const t = setInterval(load, REFRESH_MS)
    return () => { cancelled = true; clearInterval(t) }
  }, [team])

  useEffect(() => {
    const t = setInterval(() => setClock(fullClock()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (paused || data.people.length === 0) return
    const t = setInterval(() => {
      setActiveIdx(i => (i + 1) % data.people.length)
    }, CYCLE_MS)
    return () => clearInterval(t)
  }, [paused, data.people.length])

  useEffect(() => {
    if (activeIdx >= data.people.length) setActiveIdx(0)
  }, [activeIdx, data.people.length])

  const people = data.people
  const meta = data.meta || {}
  const active = people[activeIdx] || null

  const counts = useMemo(() => {
    const c = { on_site: 0, off_site: 0, no_site: 0, no_gps: 0 }
    people.forEach(p => { c[p.status] = (c[p.status] || 0) + 1 })
    return c
  }, [people])

  return (
    <div className="h-screen flex flex-col bg-[#f5f7fb] text-slate-950 overflow-hidden">
      {/* TOP BAR — white with ACE gradient accent */}
      <header className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl text-white text-base font-black shadow-md" style={{ background: ACE_GRADIENT }}>
            ⏱
          </div>
          <div>
            <div className="text-base font-black text-slate-950 leading-tight">ACE Operations — Live Wallboard</div>
            <div className="text-xs font-bold text-slate-500">{thaiDate()}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={team}
            onChange={e => setTeam(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-800 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-200"
          >
            <option value="ALL">All Departments</option>
            {departments.map(d => (
              <option key={d.value} value={d.value}>
                {d.label}{d.count != null ? ` (${d.count})` : ''}
              </option>
            ))}
          </select>
          <div className="text-3xl font-black font-mono tabular-nums tracking-tight text-slate-900">{clock}</div>
        </div>
      </header>

      {/* KPI STRIP — white cards */}
      <div className="shrink-0 grid grid-cols-5 gap-3 px-6 py-3 border-b border-slate-200 bg-slate-50/60">
        <KpiBox label="Total Today" value={meta.totalPeople || 0} accent={ACE_BLUE} />
        <KpiBox label="On-site"     value={counts.on_site}  accent={STATUS.on_site.color} />
        <KpiBox label="Off-site"    value={counts.off_site} accent={STATUS.off_site.color} pulse={counts.off_site > 0} />
        <KpiBox label="Office"      value={counts.no_site}  accent={STATUS.no_site.color} />
        <KpiBox label="No GPS"      value={counts.no_gps}   accent={STATUS.no_gps.color} />
      </div>

      {/* BODY */}
      <div className="flex-1 min-h-0 grid grid-cols-[1fr_360px] gap-0">
        <div className="relative border-r border-slate-200">
          <WallboardMap people={people} />
          {loadError && (
            <div className="absolute top-4 left-4 z-[500] rounded-lg bg-red-600 text-white px-4 py-2 text-sm font-black shadow-lg">
              ⚠ Failed to load data — retrying every {REFRESH_MS / 1000}s
            </div>
          )}
          {!loadError && people.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-2xl font-black pointer-events-none">
              No one has clocked in today
            </div>
          )}

          {/* Featured card overlay — glass effect on map */}
          <div className="absolute top-4 right-4 z-[500] w-[360px] max-w-[40vw]">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="text-xs font-black uppercase tracking-widest text-slate-700 bg-white/70 backdrop-blur px-2 py-0.5 rounded">
                Featured · {people.length ? `${activeIdx + 1}/${people.length}` : '0/0'}
              </div>
              <button
                onClick={() => setPaused(p => !p)}
                className="text-xs font-black text-slate-700 hover:text-slate-900 px-2.5 py-1 rounded-lg border border-white/70 bg-white/70 hover:bg-white/90 backdrop-blur shadow-sm"
              >
                {paused ? '▶ Resume' : '⏸ Pause'}
              </button>
            </div>
            {active ? (
              <PersonCard person={active} onPhotoClick={setPhotoModal} />
            ) : (
              <div className="aspect-[4/3] rounded-2xl bg-white/60 backdrop-blur border border-white/70 flex items-center justify-center text-slate-500 font-bold shadow-xl">
                No data
              </div>
            )}
          </div>
        </div>

        <aside className="flex flex-col bg-white">
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/40">
            <div className="text-xs font-black uppercase tracking-widest text-slate-500 px-1 mb-1 pt-1">
              All people today ({people.length})
            </div>
            {people.map((p, i) => (
              <MiniRow
                key={`${p.employeeCode}-${i}`}
                person={p}
                active={i === activeIdx}
                onClick={() => { setActiveIdx(i); setPaused(true) }}
              />
            ))}
          </div>

          <div className="px-4 py-2 border-t border-slate-200 bg-white text-[.7rem] font-bold text-slate-500 flex justify-between">
            <span>Auto-refresh every {REFRESH_MS / 1000}s</span>
            <span>Last sync: {lastSync || '—'}</span>
          </div>
        </aside>
      </div>

      <PhotoModal src={photoModal} onClose={() => setPhotoModal(null)} />
    </div>
  )
}

function KpiBox({ label, value, accent, pulse = false }) {
  return (
    <div className="rounded-xl bg-white border border-slate-200 shadow-sm px-4 py-2 flex items-center gap-3">
      <div
        className={`w-2.5 h-12 rounded-full ${pulse ? 'animate-pulse' : ''}`}
        style={{ background: accent }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-[.65rem] font-black uppercase tracking-widest text-slate-500">{label}</div>
        <div className="text-3xl font-black tabular-nums text-slate-900">{value}</div>
      </div>
    </div>
  )
}
