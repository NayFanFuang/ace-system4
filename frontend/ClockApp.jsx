'use client'
/**
 * ACE Clock System 2.0
 * React/Next.js + Tailwind CSS
 * Converted from GAS + index.html
 *
 * New in 2.0:
 *   - Universal Clock: role switcher (DTE / DTA / Other)
 *   - DTE: site selector, GPS radius check, multi-session per day
 *   - DAILY: single clock-in/out per day (DTA, TE, Office)
 *   - Photo: required only for DTE (photo_required = true)
 *   - JWT-based auth (replace google.script.run)
 *
 * Usage:  Place in app/clock/page.jsx  or  pages/clock.jsx
 * Deps:   npm install react (Next.js already includes)
 *         npm install html2canvas (for summary image export)
 */

import { Fragment, useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { apiFetch } from './src/apiFetch.js'
import { formatDateTime24, formatDateYmd, formatTime24, pad2 as pad } from './src/dateFormat.js'

// ─────────────────────────────────────────────────────────────────────────────
// ROLE CONFIGS  — Universal Clock drives UI from here
// ─────────────────────────────────────────────────────────────────────────────
const ROLE_CONFIGS = {
  DTE: {
    label: 'DTE',
    fullLabel: 'Drive Test Engineer',
    clockType: 'PER_SITE',    // multiple sessions/day, each tied to a site
    gpsRequired: true,
    photoRequired: true,
    accentColor: '#7c3aed',
    bgColor: '#ede9fe',
  },
  DTE_DAILY: {
    label: 'DTE',
    fullLabel: 'Drive Test Engineer',
    clockType: 'DAILY',
    gpsRequired: true,
    photoRequired: true,
    accentColor: '#2563eb',
    bgColor: '#dbeafe',
  },
  TE: {
    label: 'TE',
    fullLabel: 'Telecom Engineer',
    clockType: 'DAILY',
    gpsRequired: true,
    photoRequired: true,
    accentColor: '#b91c1c',
    bgColor: '#fee2e2',
  },
  DTA: {
    label: 'DTA',
    fullLabel: 'Drive Test Analyst',
    clockType: 'DAILY',       // one session/day, no site
    gpsRequired: true,
    photoRequired: true,
    accentColor: '#0369a1',
    bgColor: '#e0f2fe',
  },
  OTHER: {
    label: 'Other',
    fullLabel: 'Office Staff',
    clockType: 'DAILY',
    gpsRequired: true,
    photoRequired: true,
    accentColor: '#047857',
    bgColor: '#d1fae5',
  },
}

function isAdminUser(user) {
  return user?.role === 'SUPER_ADMIN' || user?.positionCode === 'ADMIN'
}

function roleFromUser(user) {
  if (isAdminUser(user)) return 'DTE'
  if (user?.positionCode === 'DTE' && user?.clockType === 'DAILY') return 'DTE_DAILY'
  return ROLE_CONFIGS[user?.positionCode] ? user.positionCode : 'OTHER'
}

function allowedRolesForUser(user) {
  if (isAdminUser(user)) return Object.keys(ROLE_CONFIGS)
  return [roleFromUser(user)]
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function formatTime(date) {
  if (!date) return '--:--'
  return formatTime24(date)
}

function formatTimeWithSeconds(date) {
  if (!date) return '--:--:--'
  return formatTime24(date, true)
}

function formatMinutes(mins) {
  if (!mins || mins <= 0) return '0:00'
  return `${Math.floor(mins / 60)}:${pad(mins % 60)}`
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000, toRad = d => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDistance(m) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(2)} km`
}

const SITE_OUTCOMES = {
  COMPLETE: { label: 'Complete', color: '#15803d', bg: '#dcfce7' },
  STOP: { label: 'Stop', color: '#b45309', bg: '#fef3c7' },
  ISSUE: { label: 'Issue', color: '#b91c1c', bg: '#fee2e2' },
  COMPLETED: { label: 'Complete', color: '#15803d', bg: '#dcfce7' },
}

function siteOutcomeLabel(status) {
  return SITE_OUTCOMES[status]?.label || (status === 'ACTIVE' ? 'Active' : 'Complete')
}

// ─────────────────────────────────────────────────────────────────────────────
// API LAYER
// ─────────────────────────────────────────────────────────────────────────────
async function apiClockIn({ employeeCode, userId, lat, lng, siteId, photoBase64, clockType }) {
  const res = await apiFetch('/api/clock/in', {
    method: 'POST',
    body: JSON.stringify({
      employee_code: employeeCode,
      user_id: userId ?? null,
      clock_type: clockType || 'DAILY',
      site_id: siteId ?? null,
      lat: lat ?? null,
      lng: lng ?? null,
      photo_base64: photoBase64 ?? null,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Clock in failed')
  }
  return res.json()
}

async function apiClockOut({ sessionId, lat, lng, photoBase64, outcome }) {
  const res = await apiFetch(`/api/clock/out/${sessionId}`, {
    method: 'POST',
    body: JSON.stringify({
      lat: lat ?? null,
      lng: lng ?? null,
      photo_base64: photoBase64 ?? null,
      outcome: outcome ?? 'COMPLETE',
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Clock out failed')
  }
  return res.json()
}

async function apiGetTodaySessions(employeeCode) {
  const res = await apiFetch(`/api/clock/today?employee_code=${encodeURIComponent(employeeCode)}`)
  if (!res.ok) throw new Error('Could not load today sessions')
  return res.json()
}

async function apiGetClockHistory(employeeCode, limit = 30) {
  const res = await apiFetch(`/api/clock/history?employee_code=${encodeURIComponent(employeeCode)}&limit=${limit}`)
  if (!res.ok) throw new Error('Could not load attendance history')
  return res.json()
}

async function apiGetClockPermissions(employeeCode) {
  const res = await apiFetch(`/api/clock-permissions/${encodeURIComponent(employeeCode)}`)
  if (!res.ok) throw new Error('Could not load clock permissions')
  return res.json()
}

async function apiMarkShared(sessionId) {
  if (!sessionId) return
  try {
    await apiFetch(`/api/clock/sessions/${sessionId}/share`, { method: 'POST' })
  } catch (_) { /* best-effort: don't block the share UX on a tracking failure */ }
}

function parseClockDate(value) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function photoToBlob(dataUrl) {
  const [meta, b64] = dataUrl.split(',')
  const mime = meta.match(/data:(.*);base64/)?.[1] || 'image/jpeg'
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

/** Header — gradient matching original design */
function Header({ dateStr }) {
  return (
    <div className="ace-clock-header px-5 pb-7 pt-5 relative z-10 shrink-0">
      <div className="flex items-center justify-center gap-2.5 mb-1.5">
        <span className="ace-clock-title text-2xl font-extrabold text-white">
          ACE Clock System
        </span>
      </div>
      <div className="ace-clock-date text-center text-sm font-semibold text-white/90">
        {dateStr || '-'}
      </div>
    </div>
  )
}

function isMobileDevice() {
  if (typeof navigator === 'undefined') return false
  // Dev-mode override: ?desktop=1 or localStorage flag bypasses the mobile-only check
  try {
    if (window.location.search.includes('desktop=1')) return true
    if (localStorage.getItem('clockapp_allow_desktop') === '1') return true
  } catch {}
  const ua = navigator.userAgent || ''
  if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) return true
  // some tablets / iPad pretending to be desktop — fall back to touch + narrow viewport
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 1
  const narrowViewport = window.innerWidth <= 820
  return hasTouch && narrowViewport
}

function DesktopBlockedScreen() {
  const url = typeof window !== 'undefined' ? window.location.href : ''
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#f1f5f9 0%,#e0e7ff 100%)', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 8px 24px rgba(15,23,42,0.08)', padding: 32, maxWidth: 460, textAlign: 'center' }}>
        <div style={{ fontSize: 48 }}>📱</div>
        <h2 style={{ margin: '12px 0 4px', color: '#0f172a' }}>กรุณาใช้งานผ่านมือถือ</h2>
        <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: '8px 0 18px' }}>
          ClockApp ต้องใช้ GPS และกล้องเซลฟี่ — เปิดบนคอมพิวเตอร์ไม่ได้
        </p>
        <div style={{ background: '#f1f5f9', borderRadius: 10, padding: 12, fontSize: 12, color: '#475569', wordBreak: 'break-all' }}>
          เปิดลิ้งนี้บนมือถือ:<br />
          <b style={{ color: '#2447d8' }}>{url}</b>
        </div>
        <p style={{ marginTop: 16, fontSize: 12, color: '#94a3b8' }}>
          Admin/HR สามารถใช้ <a href="/ClockMonitor" style={{ color: '#2447d8', fontWeight: 700 }}>ClockMonitor</a> บนคอมพิวเตอร์ได้
        </p>
        <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px dashed #e2e8f0' }}>
          <button
            onClick={() => { try { localStorage.setItem('clockapp_allow_desktop', '1') } catch {}; window.location.reload() }}
            style={{ background: '#fff7ed', color: '#b45309', border: '1px solid #fdba74', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            🛠 Dev: ใช้บนคอมพิวเตอร์ (testing)
          </button>
          <div style={{ marginTop: 6, fontSize: 11, color: '#94a3b8' }}>
            หรือเพิ่ม <code>?desktop=1</code> ที่ URL
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ClockApp({ authenticatedUser = null, onLogout = null }) {
  const [currentUser, setCurrentUser] = useState(authenticatedUser)
  const [mobileOk] = useState(() => isMobileDevice())

  useEffect(() => {
    if (authenticatedUser) setCurrentUser(authenticatedUser)
  }, [authenticatedUser])

  if (!mobileOk) {
    return <DesktopBlockedScreen />
  }

  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui, sans-serif', background: '#f1f5f9' }}>
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 8px 24px rgba(15,23,42,0.08)', padding: 28, maxWidth: 380, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🔒</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Please sign in</div>
          <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5, margin: '0 0 16px' }}>
            ClockApp requires a signed-in user. Open the login page to continue.
          </p>
          <a href="/login" style={{ display: 'inline-block', background: '#2447d8', color: '#fff', padding: '10px 18px', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: 13 }}>
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <ClockWorkspace
      currentUser={currentUser}
      onLogout={onLogout || (() => setCurrentUser(null))}
    />
  )
}

/** Tab bar */
function TabBar({ active, onChange, pendingCount = 0 }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'leave',     label: 'Leave'     },
    { id: 'approvals', label: 'Approvals', badge: pendingCount },
    { id: 'history',   label: 'History'   },
  ]
  return (
    <div className="ace-clock-tabs bg-white flex items-center px-4 sticky top-0 z-20 border-b border-gray-100">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 text-sm font-medium transition-colors duration-200 cursor-pointer border-none ${active === tab.id ? 'ace-clock-tab-active' : 'ace-clock-tab-idle'}`}
        >
          {tab.label}
          {tab.badge > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-extrabold bg-red-500 text-white align-middle">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

function AccountBar({ user, onLogout }) {
  return (
    <div className="ace-clock-card rounded-2xl p-3 mb-3.5 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-extrabold" style={{ background: ROLE_CONFIGS[roleFromUser(user)].accentColor }}>
        {user.firstName[0]}{user.lastName[0]}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-extrabold text-gray-900 truncate">{user.name}</div>
        <div className="text-xs font-semibold text-gray-500 truncate">{user.employeeCode} · {user.positionName}</div>
      </div>
      <button onClick={onLogout} className="ace-clock-logout-button px-3 py-2 rounded-lg text-xs font-bold border cursor-pointer">
        Logout
      </button>
    </div>
  )
}

/** ── Universal Clock Role Selector ── NEW in 2.0 */
function RoleSelector({ role, onChange, allowedRoles = Object.keys(ROLE_CONFIGS) }) {
  const roleEntries = Object.entries(ROLE_CONFIGS).filter(([key]) => allowedRoles.includes(key))
  return (
    <div className="bg-white rounded-2xl p-4 mb-3.5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-bold text-gray-900">Universal Clock Mode</span>
        <span
          className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: ROLE_CONFIGS[role].bgColor, color: ROLE_CONFIGS[role].accentColor }}
        >
          {ROLE_CONFIGS[role].clockType === 'PER_SITE' ? 'Per Site' : 'Daily'}
        </span>
      </div>

      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${roleEntries.length}, minmax(0, 1fr))` }}>
        {roleEntries.map(([key, cfg]) => {
          const isActive = role === key
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className="py-2.5 rounded-xl text-sm transition-all duration-200 cursor-pointer border"
              style={{
                fontWeight: 700,
                background:   isActive ? cfg.accentColor : '#f8fafc',
                color:        isActive ? '#fff'          : '#64748b',
                borderColor:  isActive ? cfg.accentColor : '#e2e8f0',
                boxShadow:    isActive ? `0 4px 14px ${cfg.accentColor}44` : 'none',
                transform:    isActive ? 'scale(1.04)'  : 'scale(1)',
              }}
            >
              <div>{cfg.label}</div>
              <div className="text-xs font-medium mt-0.5" style={{ color: isActive ? 'rgba(255,255,255,0.75)' : '#94a3b8' }}>
                {cfg.clockType === 'PER_SITE' ? 'Per Site' : 'Daily'}
              </div>
            </button>
          )
        })}
      </div>

      {/* Feature flags row */}
      <div className="flex gap-2 mt-3">
        {[
          { label: 'Photo', on: ROLE_CONFIGS[role].photoRequired },
          { label: 'GPS Check', on: ROLE_CONFIGS[role].gpsRequired },
          { label: 'Multi Session', on: ROLE_CONFIGS[role].clockType === 'PER_SITE' },
        ].map(f => (
          <div
            key={f.label}
            className="flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: f.on ? '#f0fdf4' : '#f8fafc', color: f.on ? '#15803d' : '#94a3b8' }}
          >
            <span>{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** ── DTE Site Selector ── NEW in 2.0 */
function PlannedSitesPanel({ sites, selected, onSelect, dteActive, gpsLat, gpsLng }) {
  const withDist = sites.map(s => {
    let distKm = null
    if (gpsLat != null && gpsLng != null && s.lat != null && s.lng != null) {
      const R = 6371
      const toRad = d => (d * Math.PI) / 180
      const dLat = toRad(s.lat - gpsLat)
      const dLng = toRad(s.lng - gpsLng)
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(gpsLat)) * Math.cos(toRad(s.lat)) * Math.sin(dLng / 2) ** 2
      distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    }
    return { ...s, distKm }
  }).sort((a, b) => {
    if (a.distKm == null && b.distKm == null) return 0
    if (a.distKm == null) return 1
    if (b.distKm == null) return -1
    return a.distKm - b.distKm
  })

  const statusColor = (statuses = []) => {
    if (statuses.includes('IN_PROGRESS')) return { bg: '#fef3c7', fg: '#92400e', label: 'In Progress' }
    if (statuses.includes('WORK_DONE'))   return { bg: '#d1fae5', fg: '#065f46', label: 'Work Done' }
    return { bg: '#dbeafe', fg: '#1d4ed8', label: 'Planned' }
  }

  return (
    <div className="mb-3 rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">📋</span>
          <span className="text-sm font-extrabold text-blue-900">My Planned Sites</span>
        </div>
        <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[.65rem] font-bold text-white">
          {sites.length}
        </span>
      </div>
      <div className="text-[.66rem] text-blue-700 mb-2">
        Sites assigned to you via Plan DTE — tap to select for clock-in
      </div>
      <div className="grid grid-cols-1 gap-2 max-h-[280px] overflow-y-auto">
        {withDist.map(s => {
          const isSelected = selected?.siteCode === s.siteCode
          const sc = statusColor(s.workflowStatuses)
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              disabled={!dteActive}
              className={[
                'w-full text-left rounded-lg border px-3 py-2 transition',
                isSelected
                  ? 'border-blue-600 bg-blue-100 shadow-sm'
                  : 'border-blue-200 bg-white hover:bg-blue-50',
                !dteActive ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[.78rem] font-bold text-slate-900 truncate">{s.siteCode}</div>
                  {s.siteName && <div className="text-[.66rem] text-slate-500 truncate">{s.siteName}</div>}
                  <div className="mt-1 flex flex-wrap gap-1.5 text-[.6rem]">
                    {s.workType && (
                      <span className="rounded bg-purple-100 px-1.5 py-0.5 font-bold text-purple-700">{s.workType}</span>
                    )}
                    <span className="rounded px-1.5 py-0.5 font-bold" style={{ background: sc.bg, color: sc.fg }}>
                      {sc.label}
                    </span>
                    {s.poCount > 1 && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-bold text-slate-600">{s.poCount} POs</span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {s.distKm != null && (
                    <div className="text-[.66rem] font-bold text-slate-600">{s.distKm.toFixed(1)} km</div>
                  )}
                  {s.plannedStartDate && (
                    <div className="text-[.6rem] text-slate-400">{s.plannedStartDate}</div>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
      {!dteActive && (
        <div className="mt-2 text-[.62rem] text-amber-700 italic">
          Tap the clock-in button below first to start your day
        </div>
      )}
    </div>
  )
}

function SiteSelector({ sites, selected, onSelect, gpsLat, gpsLng }) {
  const [query, setQuery] = useState('')

  const withDist = sites.map(site => {
    const dist = gpsLat && gpsLng && site.lat && site.lng
      ? haversineDistance(gpsLat, gpsLng, site.lat, site.lng)
      : null
    return { ...site, dist, inRange: dist !== null ? dist <= site.gpsRadiusM : null }
  })

  const filtered = query.trim()
    ? withDist.filter(s =>
        s.siteCode.toLowerCase().includes(query.toLowerCase()) ||
        (s.siteName || '').toLowerCase().includes(query.toLowerCase())
      )
    : withDist

  // Sort: in-range first, then by distance, then alphabetical
  const sorted = [...filtered].sort((a, b) => {
    if (a.inRange && !b.inRange) return -1
    if (!a.inRange && b.inRange) return 1
    if (a.dist !== null && b.dist !== null) return a.dist - b.dist
    return a.siteCode.localeCompare(b.siteCode)
  })

  return (
    <div
      className="bg-white rounded-2xl p-4 mb-3.5"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)', borderLeft: '3px solid #7c3aed' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-bold text-gray-900">Select Site to Start</span>
        <span className="ml-auto text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
          {sites.length} sites
        </span>
      </div>

      {/* Search */}
      {sites.length > 5 && (
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search site code or cluster…"
          className="w-full mb-3 px-3 py-2 text-sm rounded-xl border border-gray-200 outline-none focus:border-purple-400"
          style={{ background: '#f8fafc' }}
        />
      )}

      <div className="flex flex-col gap-2" style={{ maxHeight: 320, overflowY: 'auto' }}>
        {sorted.length === 0 && (
          <div className="text-xs text-gray-400 text-center py-4">No sites match "{query}"</div>
        )}
        {sorted.map(site => {
          const isSelected = selected?.id === site.id
          return (
            <button
              key={site.id}
              onClick={() => onSelect(site)}
              className="w-full text-left rounded-xl p-3 border transition-all duration-200 cursor-pointer"
              style={{
                background:   isSelected ? '#f5f3ff' : '#f8fafc',
                borderColor:  isSelected ? '#7c3aed' : '#e2e8f0',
                boxShadow:    isSelected ? '0 0 0 2px rgba(124,58,237,0.15)' : 'none',
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <div className="text-sm font-bold text-gray-800 truncate">{site.siteCode}</div>
                    {isSelected && <span className="text-xs font-bold text-purple-600">Selected</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{site.siteName} · {site.customer}</div>
                </div>

                {site.dist !== null ? (
                  <div
                    className="text-xs font-bold px-2 py-1 rounded-full shrink-0"
                    style={{
                      background: site.inRange ? '#dcfce7' : '#fee2e2',
                      color:      site.inRange ? '#15803d' : '#b91c1c',
                    }}
                  >
                    {formatDistance(site.dist)} · {site.inRange ? 'In range' : 'Out'}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 px-2">within {site.gpsRadiusM}m</div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** ── DTE Active Session Banner ── */
function ActiveSiteBanner({ session, outcome, onOutcomeChange }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.round((new Date() - session.clockIn) / 60000))
    }, 30000)
    setElapsed(Math.round((new Date() - session.clockIn) / 60000))
    return () => clearInterval(id)
  }, [session.clockIn])

  return (
    <div
      className="rounded-2xl p-4 mb-3.5 flex items-center gap-3"
      style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}
    >
      <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" style={{ animation: 'pulse 2s infinite' }} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-blue-900">{session.siteCode}</div>
        <div className="text-xs text-blue-500 mt-0.5">
          {session.siteName} · Active since {formatTime(session.clockIn)}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <div
          className="text-sm font-bold px-3 py-1.5 rounded-full"
          style={{ background: '#1d4ed8', color: '#fff' }}
        >
          {formatMinutes(elapsed)}
        </div>
        <div className="flex gap-1">
          {['COMPLETE', 'STOP', 'ISSUE'].map(key => {
            const cfg = SITE_OUTCOMES[key]
            const active = outcome === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => onOutcomeChange(key)}
                className="text-xs font-bold px-2 py-1 rounded-full border cursor-pointer"
                style={{
                  background: active ? cfg.bg : '#fff',
                  color: active ? cfg.color : '#64748b',
                  borderColor: active ? cfg.color : '#dbe3ef',
                }}
              >
                {cfg.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/** ── DTE Sessions List (multiple per day) ── */
function DteSessionsList({ sessions, onComplete, disabled }) {
  if (!sessions.length) return null
  const totalMins = sessions.reduce((acc, s) => {
    if (!s.clockIn) return acc
    const end = s.clockOut || new Date()
    return acc + Math.max(0, Math.round((end - s.clockIn) / 60000))
  }, 0)

  return (
    <div className="bg-white rounded-2xl p-4 mb-3.5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base font-bold text-gray-900">Today's Sites</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {sessions.length} session{sessions.length > 1 ? 's' : ''}
          </span>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
            {formatMinutes(totalMins)} total
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {sessions.map((s, i) => {
          const mins = s.clockIn
            ? Math.max(0, Math.round(((s.clockOut || new Date()) - s.clockIn) / 60000))
            : 0
          return (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: s.clockOut ? '#2e7d32' : '#2563eb' }}
                />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-gray-800 truncate">{s.siteCode}</div>
                  <div className="text-xs text-gray-400">
                    {formatTime(s.clockIn)} to {s.clockOut ? formatTime(s.clockOut) : 'ongoing'}
                    {s.clockOut && s.status && ` · ${siteOutcomeLabel(s.status)}`}
                  </div>
                </div>
              </div>
              {s.clockOut ? (
                <div
                  className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ml-2"
                  style={{
                    background: SITE_OUTCOMES[s.status]?.bg || '#dcfce7',
                    color: SITE_OUTCOMES[s.status]?.color || '#15803d',
                  }}
                >
                  {siteOutcomeLabel(s.status)}
                </div>
              ) : (
                <div className="flex gap-1 shrink-0 ml-2">
                  {['COMPLETE', 'STOP', 'ISSUE'].map(key => {
                    const cfg = SITE_OUTCOMES[key]
                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={disabled}
                        onClick={() => onComplete?.(s.sessionId, key)}
                        className="text-xs font-bold px-2 py-1 rounded-full border cursor-pointer disabled:opacity-50"
                        style={{
                          background: cfg.bg,
                          color: cfg.color,
                          borderColor: cfg.color,
                        }}
                      >
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** User Card — same as original */
function UserCard({ user, locationText, distanceLabel, statusIn }) {
  return (
    <div className="bg-white rounded-2xl p-4 mb-3.5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-xl font-extrabold text-gray-900" style={{ letterSpacing: '-0.01em', lineHeight: 1.2 }}>
            {user.name}
          </div>
          <div className="text-sm font-medium text-gray-400 mt-0.5 mb-2">
            {user.positionName} · {user.employeeCode}
          </div>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 mb-2">
            <span className="text-sm truncate">{locationText || '-'}</span>
          </div>
          {distanceLabel && (
            <div
              className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full"
              style={{ background: '#e8f5e9', color: '#2e7d32' }}
            >
              {distanceLabel}
            </div>
          )}
        </div>
        <div
          className="text-sm font-bold px-4 py-2 rounded-lg text-white shrink-0"
          style={{ background: statusIn ? '#c0392b' : '#1a1a2e', whiteSpace: 'nowrap' }}
        >
          {statusIn ? 'On Duty' : 'Ready to Work'}
        </div>
      </div>
    </div>
  )
}

/** Clock In/Out Button — same 160px circle as original */
function ClockButton({ isOut, onPress, disabled, roleConfig, actionLabel }) {
  const [pressed, setPressed] = useState(false)
  const inStyle  = { background: 'linear-gradient(145deg, #4a6de5, #2c4fd4)', boxShadow: '0 8px 30px rgba(44,79,212,0.45), 0 3px 8px rgba(0,0,0,0.15)' }
  const outStyle = { background: 'linear-gradient(145deg, #e55555, #c0392b)', boxShadow: '0 8px 30px rgba(192,57,43,0.45), 0 3px 8px rgba(0,0,0,0.15)' }

  return (
    <div className="flex justify-center py-3 pb-1.5">
      <button
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onTouchStart={() => setPressed(true)}
        onTouchEnd={() => setPressed(false)}
        onClick={onPress}
        disabled={disabled}
        className="flex flex-col items-center justify-center gap-1.5 rounded-full border-none cursor-pointer transition-transform duration-150 disabled:opacity-60"
        style={{
          width: 160, height: 160,
          ...(isOut ? outStyle : inStyle),
          transform: pressed ? 'scale(0.92)' : 'scale(1)',
        }}
      >
        <span className="text-white font-extrabold uppercase" style={{ fontSize: '1rem', letterSpacing: '0.06em' }}>
          {actionLabel || (isOut ? 'Clock Out' : 'Clock In')}
        </span>
        {roleConfig?.clockType === 'PER_SITE' && (
          <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.65)', fontWeight: 600, letterSpacing: '0.05em' }}>
            per site
          </span>
        )}
      </button>
    </div>
  )
}

/** Today's Summary — adapts for PER_SITE (sum all sessions) */
function TodaySummary({ clockIn, clockOut, totalMinutes, dteSessions, clockType }) {
  const isPer = clockType === 'PER_SITE'
  const totalMins = isPer
    ? dteSessions.reduce((acc, s) => {
        if (!s.clockIn) return acc
        return acc + Math.max(0, Math.round(((s.clockOut || new Date()) - s.clockIn) / 60000))
      }, 0)
    : totalMinutes
  const firstIn = isPer ? (clockIn || dteSessions[0]?.clockIn || null) : clockIn
  const lastOut = isPer
    ? (dteSessions.every(s => s.clockOut) ? dteSessions[dteSessions.length - 1]?.clockOut : null)
    : clockOut

  return (
    <div className="bg-white rounded-2xl p-4 mb-3.5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
      <div className="flex items-center gap-2 font-bold text-gray-900 mb-4" style={{ fontSize: '1rem' }}>
        Today's Summary
      </div>
      <div className="grid grid-cols-3 gap-0">
        <SumCol label={isPer ? 'First In' : 'Clock In'}  value={formatTime(firstIn)} valueClass="in-green"  />
        <SumCol label={isPer ? 'Last Out' : 'Clock Out'} value={formatTime(lastOut)} valueClass="out-red"   divider />
        <SumCol label="Total Hours" value={formatMinutes(totalMins)} valueClass="hrs-blue" divider />
      </div>
    </div>
  )
}

function SumCol({ label, value, valueClass, divider }) {
  const colors = { 'in-green': '#2e7d32', 'out-red': '#c0392b', 'hrs-blue': '#2c4fd4' }
  return (
    <div className={`flex flex-col items-center gap-1.5 px-1 ${divider ? 'border-l border-gray-100' : ''}`}>
      <span className="text-xs font-semibold text-gray-400 uppercase" style={{ letterSpacing: '0.02em' }}>{label}</span>
      <span className="text-base font-bold" style={{ color: colors[valueClass], fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em' }}>
        {value}
      </span>
    </div>
  )
}

// ─── Camera Section ────────────────────────────────────────────────────────────
function CameraSection({ action, onCapture, onCancel, roleConfig, currentUser, gpsPos, gpsPlaceName, selectedSite }) {
  const videoRef    = useRef(null)
  const canvasRef   = useRef(null)
  const streamRef   = useRef(null)
  const fileInputRef = useRef(null)
  const [mode, setMode]         = useState('loading')    // loading | live | fallback | preview
  const [preview, setPreview]   = useState(null)
  const [pendingB64, setPendingB64] = useState(null)

  const isOut = action === 'Clock Out'

  useEffect(() => {
    // Track whether this effect instance has been cleaned up; in React StrictMode dev,
    // the effect runs twice and an in-flight getUserMedia from the first run could resolve
    // after cleanup, leaking a camera stream.
    let aborted = false

    if (!navigator.mediaDevices?.getUserMedia) {
      setMode('fallback')
    } else {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        .then(s => {
          if (aborted) { s.getTracks().forEach(t => t.stop()); return }
          streamRef.current = s
          setMode('live')
        })
        .catch(() => {
          if (aborted) return
          setMode('fallback')
          setTimeout(() => { if (!aborted) fileInputRef.current?.click() }, 300)
        })
    }

    return () => {
      aborted = true
      stopCamera()
    }
  }, [])

  // Attach stream after video element is mounted in DOM (fixes iOS black screen)
  useEffect(() => {
    if (mode === 'live' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(() => {})
    }
  }, [mode])

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  function compressCanvas(canvas, maxLong, quality) {
    const { width: w, height: h } = canvas
    const scale = Math.min(1, maxLong / Math.max(w, h))
    const tmp = document.createElement('canvas')
    tmp.width = Math.round(w * scale); tmp.height = Math.round(h * scale)
    tmp.getContext('2d').drawImage(canvas, 0, 0, tmp.width, tmp.height)
    return tmp.toDataURL('image/jpeg', quality).split(',')[1]
  }

  function drawStamp(canvas, ctx) {
    const w = canvas.width, h = canvas.height
    const scale = w / 400

    const now = new Date()
    const pad2 = n => String(n).padStart(2, '0')
    const dateStr = `${now.getFullYear()}-${pad2(now.getMonth()+1)}-${pad2(now.getDate())}`
    const timeStr = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`
    const name = currentUser?.name || `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim()
    const project = currentUser?.projectName || selectedSite?.siteName || '-'
    const location = gpsPlaceName
      || (gpsPos ? `${gpsPos.lat.toFixed(5)}, ${gpsPos.lng.toFixed(5)}` : 'Unavailable')

    const rows = [
      { label: 'Action',   value: action },
      { label: 'DateTime', value: `${dateStr}  ${timeStr}` },
      { label: 'Name',     value: name },
      { label: 'Project',  value: project },
      { label: 'Location', value: location },
    ]

    const fontSize   = Math.round(11.5 * scale)
    const lineH      = Math.round(19 * scale)
    const pad        = Math.round(10 * scale)
    const labelW     = Math.round(68 * scale)
    const stampH     = lineH * rows.length + pad * 2

    ctx.save()

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.68)'
    ctx.fillRect(0, h - stampH, w, stampH)

    // Top divider
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'
    ctx.lineWidth = Math.max(1, Math.round(scale))
    ctx.beginPath(); ctx.moveTo(0, h - stampH); ctx.lineTo(w, h - stampH); ctx.stroke()

    rows.forEach(({ label, value }, i) => {
      const y = h - stampH + pad + i * lineH

      // Label (dim)
      ctx.font = `${fontSize}px Arial, sans-serif`
      ctx.fillStyle = 'rgba(255,255,255,0.55)'
      ctx.textBaseline = 'top'
      ctx.fillText(`${label} :`, pad, y)

      // Value (white, bold for Action)
      ctx.font = `${label === 'Action' ? 'bold ' : ''}${fontSize}px Arial, sans-serif`
      ctx.fillStyle = label === 'Action'
        ? (action === 'Clock In' ? '#6ee7b7' : '#fca5a5')
        : '#ffffff'
      ctx.fillText(value, pad + labelW, y)
    })

    ctx.restore()
  }

  function captureFromVideo() {
    const video = videoRef.current, canvas = canvasRef.current
    if (!video || !canvas) return
    const vw = video.videoWidth, vh = video.videoHeight
    let tw = vh * 3 / 4, th = vh, cx = (vw - tw) / 2, cy = 0
    if (tw > vw) { tw = vw; th = vw * 4 / 3; cx = 0; cy = (vh - th) / 2 }
    canvas.width = tw; canvas.height = th
    const ctx = canvas.getContext('2d')
    ctx.save(); ctx.translate(tw, 0); ctx.scale(-1, 1)
    ctx.drawImage(video, cx, cy, tw, th, 0, 0, tw, th); ctx.restore()
    drawStamp(canvas, ctx)
    const b64 = compressCanvas(canvas, 1200, 0.82)
    stopCamera()
    setPreview('data:image/jpeg;base64,' + b64)
    setPendingB64(b64)
    setMode('preview')
  }

  function handleFileInput(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        const { width: sw, height: sh } = img
        let tw, th, cx, cy
        if (sh / sw >= 4 / 3) { tw = sw; th = sw * 4 / 3; cx = 0; cy = (sh - th) / 2 }
        else                    { th = sh; tw = sh * 3 / 4; cx = (sw - tw) / 2; cy = 0 }
        canvas.width = tw; canvas.height = th
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, cx, cy, tw, th, 0, 0, tw, th)
        drawStamp(canvas, ctx)
        const b64 = compressCanvas(canvas, 1200, 0.82)
        setPreview('data:image/jpeg;base64,' + b64)
        setPendingB64(b64)
        setMode('preview')
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div
      className="absolute inset-0 z-[9998] bg-black"
      style={{ minHeight: '100%', overflow: 'hidden' }}
    >
      {/* Full-screen camera */}
      <div className="absolute inset-0 bg-black">
        {mode === 'preview' && preview && (
          <img src={preview} alt="captured" className="w-full h-full object-cover" />
        )}
        {mode === 'live' && (
          <video
            ref={videoRef} autoPlay playsInline muted
            className="w-full h-full object-cover"
            onLoadedMetadata={e => e.target.play().catch(() => {})}
          />
        )}
        {(mode === 'loading' || mode === 'fallback') && (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <span className="text-sm font-semibold text-center px-4" style={{ color: 'rgba(255,255,255,.78)' }}>
              {mode === 'loading' ? 'Starting camera...' : 'Tap Capture to open camera'}
            </span>
          </div>
        )}
      </div>

      {/* Top overlay */}
      <div
        className="absolute left-0 right-0 top-0 px-5 pt-5 pb-8"
        style={{ background: 'linear-gradient(rgba(0,0,0,.72), rgba(0,0,0,0))', paddingTop: 'max(20px, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-full text-sm font-bold border-none cursor-pointer"
            style={{ background: 'rgba(255,255,255,.16)', color: '#fff', backdropFilter: 'blur(10px)' }}
          >
            Cancel
          </button>
          <div className="text-center">
            <div className="text-base font-extrabold text-white">Selfie Verification</div>
            <div className="text-xs font-semibold mt-0.5" style={{ color: 'rgba(255,255,255,.68)' }}>Align your face in the frame</div>
          </div>
          <div
            className="px-3 py-1 rounded-full text-xs font-bold uppercase"
            style={{
              background: isOut ? 'rgba(220,38,38,.9)' : 'rgba(29,78,216,.9)',
              color: '#fff',
              letterSpacing: '0.06em',
            }}
          >
            {action}
          </div>
        </div>
      </div>

      {/* Face guide */}
      {mode !== 'preview' && (
        <div
          className="absolute left-1/2 top-1/2 pointer-events-none"
          style={{
            width: 'min(74vw, 320px)',
            height: 'min(94vw, 420px)',
            transform: 'translate(-50%, -53%)',
            border: '2px solid rgba(255,255,255,.72)',
            borderRadius: '999px',
            boxShadow: '0 0 0 9999px rgba(0,0,0,.12), inset 0 0 32px rgba(255,255,255,.08)',
          }}
        />
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <input
        ref={fileInputRef} type="file"
        accept="image/*" capture="user"
        style={{ display: 'none' }}
        onChange={handleFileInput}
      />

      {/* Bottom controls */}
      <div
        className="absolute left-0 right-0 bottom-0 px-6 pt-10 pb-7"
        style={{ background: 'linear-gradient(rgba(0,0,0,0), rgba(0,0,0,.82))', paddingBottom: 'max(28px, env(safe-area-inset-bottom))' }}
      >
        {mode === 'preview' ? (
          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-2xl text-sm font-bold border-none cursor-pointer"
              style={{ background: 'rgba(255,255,255,.18)', color: '#fff', backdropFilter: 'blur(10px)' }}
            >
              Close
            </button>
            <button
              onClick={() => onCapture(pendingB64)}
              className="flex-1 py-3 rounded-2xl text-sm font-bold border-none cursor-pointer"
              style={{ background: isOut ? '#dc2626' : '#1d4ed8', color: '#fff' }}
            >
              Confirm {action}
            </button>
          </div>
        ) : (
          <>
            <div className="text-center text-xs font-semibold mb-5" style={{ color: 'rgba(255,255,255,.72)' }}>
              This photo will be saved with your {action.toLowerCase()} record.
            </div>
            <button
              onClick={mode === 'live' ? captureFromVideo : () => fileInputRef.current?.click()}
              className="mx-auto flex items-center justify-center rounded-full border-none cursor-pointer transition-transform duration-150 active:scale-95"
              style={
                isOut
                  ? { width: 82, height: 82, background: '#dc2626', boxShadow: '0 0 0 7px rgba(255,255,255,.22), 0 12px 34px rgba(220,38,38,.36)' }
                  : { width: 82, height: 82, background: '#1d4ed8', boxShadow: '0 0 0 7px rgba(255,255,255,.22), 0 12px 34px rgba(29,78,216,.36)' }
              }
              aria-label="Capture selfie"
            >
              <span className="block rounded-full" style={{ width: 58, height: 58, border: '3px solid rgba(255,255,255,.88)' }} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Summary View ─────────────────────────────────────────────────────────────
function SummaryView({ photo, data, onClose, onNotify }) {
  const rows = [
    { label: 'Action',       val: data.action      },
    { label: 'Time',         val: data.time        },
    { label: 'Name',         val: data.name        },
    { label: 'Project Code', val: data.projectCode },
    { label: 'Site',         val: data.site        },
    { label: 'Location',     val: data.location    },
  ].filter(r => r.val)

  function savePhoto() {
    const a = document.createElement('a')
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    a.href = photo
    a.download = `ace-clock-${stamp}.jpg`
    document.body.appendChild(a)
    a.click()
    a.remove()
    onNotify?.('Summary photo saved.')
  }

  async function sharePhoto() {
    try {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-')
      const file = new File([photoToBlob(photo)], `ace-${stamp}.jpg`, { type: 'image/jpeg' })
      // No title/text → share dialog shows only the image, no caption text
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] })
        // Share completed (not aborted) → record intent to send to LINE
        await apiMarkShared(data.sessionId)
        onNotify?.('Shared. Recorded as Send to Line.')
        return
      }
      // Browser can't share files → save the photo locally so user can attach manually
      savePhoto()
      onNotify?.('Sharing files is not supported here. Saved the photo instead.')
    } catch (err) {
      if (err?.name !== 'AbortError') onNotify?.('Unable to share this summary.')
    }
  }

  return (
    <div className="flex flex-col items-center px-3.5 pt-4 pb-24 gap-3.5">
      <div className="w-full max-w-sm rounded-2xl overflow-hidden relative"
           style={{ aspectRatio: '3/4', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
        <img src={photo} alt="Clock summary" className="w-full h-full object-cover" />
        <div
          className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-7"
          style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}
        >
          {rows.map(r => (
            <div key={r.label} className="flex gap-2 mb-1" style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.9)', lineHeight: 1.4 }}>
              <span style={{ color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap' }}>{r.label}</span>
              <span style={{ color: '#fff', fontWeight: 600 }}>{r.val}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2.5 w-full max-w-sm">
        <button onClick={savePhoto}
                className="flex-1 py-3 rounded-xl text-sm font-bold border-none cursor-pointer active:scale-95"
                style={{ background: '#fff3e0', color: '#e65100' }}>Save</button>
        <button onClick={sharePhoto}
                className="flex-1 py-3 rounded-xl text-sm font-bold border-none cursor-pointer active:scale-95"
                style={{ background: '#e3f2fd', color: '#1565c0' }}>Share</button>
        <button onClick={onClose}
                className="flex-1 py-3 rounded-xl text-sm font-bold border-none cursor-pointer active:scale-95"
                style={{ background: '#fdecea', color: '#c0392b' }}>Close</button>
      </div>
    </div>
  )
}

// ─── Leave Tab ────────────────────────────────────────────────────────────────
const LEAVE_STATUS_STYLE = {
  PENDING:   { bg: '#fff8e1', color: '#f59e0b', label: 'Pending PM' },
  PENDING_PM: { bg: '#fff8e1', color: '#f59e0b', label: 'Pending PM' },
  PENDING_DC: { bg: '#fff3e0', color: '#ea8a00', label: 'Pending PD' },
  PENDING_HR: { bg: '#e8f0fe', color: '#2447d8', label: 'Pending HR' },
  APPROVED:  { bg: '#e8f5e9', color: '#16a34a', label: 'Approved' },
  REJECTED:  { bg: '#fdecea', color: '#dc2626', label: 'Rejected' },
  CANCELLED: { bg: '#f3f4f6', color: '#6b7280', label: 'Cancelled' },
}

const DEFAULT_LEAVE_ENTITLEMENTS = {
  'Sick Leave': 30,
  'Personal Leave': 3,
  'Annual Leave': 6,
  'Other Leave': null,
}

function leaveCategory(type = '') {
  if (['Sick Leave', 'Sick', 'Medical Leave'].includes(type)) return 'Sick Leave'
  if (['Personal Leave', 'Personal'].includes(type)) return 'Personal Leave'
  if (['Annual Leave', 'Vacation Leave', 'Vacation'].includes(type)) return 'Annual Leave'
  return 'Other Leave'
}

function leaveFlowSteps(leaveType) {
  const category = leaveCategory(leaveType)
  if (category === 'Sick Leave') return [
    { key: 'SUBMIT', label: 'Submit' },
    { key: 'HR', label: 'HR Ack.' },
    { key: 'APPROVED', label: 'Approved' },
  ]
  if (category === 'Personal Leave') return [
    { key: 'SUBMIT', label: 'Submit' },
    { key: 'PM', label: 'PM' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'ACK', label: 'HR + Boss' },
  ]
  return [
    { key: 'SUBMIT', label: 'Submit' },
    { key: 'PM', label: 'PM' },
    { key: 'PD', label: 'PD / Head' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'ACK', label: 'HR + Boss' },
  ]
}

function flowStepState(leaveType, status = 'DRAFT', rejectAtStep = '') {
  const steps = leaveFlowSteps(leaveType)
  const rejectedKey = rejectAtStep === 'DC' ? 'PD' : rejectAtStep
  return steps.map(step => {
    if (status === 'DRAFT') return { ...step, state: step.key === 'SUBMIT' ? 'current' : 'todo' }
    if (status === 'REJECTED') {
      if (step.key === rejectedKey) return { ...step, state: 'rejected' }
      const rejectIndex = steps.findIndex(s => s.key === rejectedKey)
      const stepIndex = steps.findIndex(s => s.key === step.key)
      return { ...step, state: rejectIndex >= 0 && stepIndex < rejectIndex ? 'done' : 'todo' }
    }
    if (step.key === 'ACK' && ['PENDING', 'PENDING_PM', 'PENDING_DC', 'APPROVED'].includes(status)) {
      return { ...step, state: 'done' }
    }
    if (step.key === 'SUBMIT') return { ...step, state: 'done' }
    if (status === 'PENDING_HR') return { ...step, state: step.key === 'HR' ? 'current' : 'todo' }
    if (status === 'PENDING_PM' || status === 'PENDING') return { ...step, state: step.key === 'PM' ? 'current' : 'todo' }
    if (status === 'PENDING_DC') {
      if (step.key === 'PM') return { ...step, state: 'done' }
      return { ...step, state: step.key === 'PD' ? 'current' : 'todo' }
    }
    if (status === 'APPROVED') return { ...step, state: 'done' }
    if (status === 'CANCELLED') return { ...step, state: step.key === 'SUBMIT' ? 'done' : 'todo' }
    return { ...step, state: 'todo' }
  })
}

function LeaveFlowDiagram({ leaveType, status = 'DRAFT', rejectAtStep = '' }) {
  const stateStyle = {
    done: { bg: '#dcfce7', color: '#166534', border: '#86efac', label: 'Done' },
    current: { bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd', label: 'Now' },
    rejected: { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5', label: 'Rejected' },
    todo: { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0', label: 'Pending' },
  }
  const steps = flowStepState(leaveType, status, rejectAtStep)
  return (
    <div className="flex items-stretch gap-1.5 overflow-x-auto pb-1">
      {steps.map((step, idx) => {
        const st = stateStyle[step.state]
        return (
          <Fragment key={`${step.key}-${idx}`}>
            <div
              className="shrink-0 rounded-xl border px-2.5 py-2 text-center"
              style={{ minWidth: 82, background: st.bg, borderColor: st.border, color: st.color }}
            >
              <div className="text-[10px] font-extrabold uppercase leading-none">{st.label}</div>
              <div className="text-xs font-extrabold leading-tight mt-1">{step.label}</div>
            </div>
            {idx < steps.length - 1 && <div className="shrink-0 flex items-center text-gray-300 font-extrabold">→</div>}
          </Fragment>
        )
      })}
    </div>
  )
}

// ─── Approvals Tab ────────────────────────────────────────────────────────────
function ApprovalsTab({ user, highlightId, onCountChange }) {
  const myCode = user.employeeCode || user.employee_code
  const [loading, setLoading]   = useState(true)
  const [data, setData]         = useState({ pending: [], recent: [], approver: null })
  const [busyId, setBusyId]     = useState(null)
  const [rejectFor, setRejectFor] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [msg, setMsg]           = useState(null)
  const highlightRef = useRef(null)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/leave/pending-for-me?employee_code=${encodeURIComponent(myCode)}`)
      if (res.ok) {
        const j = await res.json()
        setData(j)
        onCountChange?.((j.pending || []).length)
      }
    } catch {}
    setLoading(false)
  }, [myCode, onCountChange])

  useEffect(() => { reload() }, [reload])

  useEffect(() => {
    if (!highlightId || !highlightRef.current) return
    highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlightId, data])

  function stepForStatus(status) {
    if (status === 'PENDING_PM') return 'pm-approve'
    if (status === 'PENDING_DC') return 'pd-approve'
    if (status === 'PENDING_HR') return 'hr-acknowledge'
    return null
  }

  async function act(leaveId, action, reason) {
    setBusyId(leaveId)
    setMsg(null)
    const lv = data.pending.find(l => l.id === leaveId)
    if (!lv) { setBusyId(null); return }
    let endpoint = stepForStatus(lv.status)
    if (!endpoint) { setBusyId(null); return }
    if (action === 'reject') {
      endpoint = endpoint === 'hr-acknowledge' ? null : endpoint.replace('-approve', '-reject')
      if (!endpoint) { setMsg({ ok:false, text:'HR step cannot be rejected directly.' }); setBusyId(null); return }
    }
    try {
      const res = await apiFetch(`/api/leave/${leaveId}/${endpoint}`, {
        method: 'POST',
        body: JSON.stringify({ actor_code: myCode, ...(action === 'reject' ? { reject_reason: reason } : {}) }),
      })
      const j = await res.json().catch(() => ({}))
      if (res.ok) {
        setMsg({ ok:true, text: action === 'approve' ? `Approved leave #${leaveId}.` : `Rejected leave #${leaveId}.` })
        setRejectFor(null); setRejectReason('')
        reload()
      } else {
        setMsg({ ok:false, text: j.detail || 'Action failed.' })
      }
    } catch {
      setMsg({ ok:false, text: 'Cannot reach server.' })
    }
    setBusyId(null)
  }

  if (loading && !data.approver) {
    return <div className="p-4 text-center text-sm text-gray-400">Loading approvals…</div>
  }
  if (data.approver && data.pending.length === 0 && data.recent.length === 0 && data.approver.direct_reports_count === 0
      && !['SUPER_ADMIN','SYSTEM_ADMIN','HR_ADMIN','DIRECTOR'].includes(data.approver.role || '')) {
    return (
      <div className="bg-white rounded-2xl p-6 m-4 text-center" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        <div className="text-3xl mb-2">📭</div>
        <div className="font-bold text-gray-700">You are not an approver</div>
        <div className="text-sm text-gray-400 mt-1">No team members report to you, and you do not hold an HR/Director role.</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold text-gray-900" style={{ fontSize: '1rem' }}>
            Pending Your Approval ({data.pending.length})
          </div>
          <button onClick={reload} className="text-xs text-teal-600 font-bold border-none bg-transparent cursor-pointer">Refresh</button>
        </div>

        {msg && (
          <div className={`mb-2 px-3 py-2 rounded-lg text-sm font-semibold ${msg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</div>
        )}

        {data.pending.length === 0 ? (
          <div className="py-4 text-center text-sm text-gray-400">No leaves awaiting your action 🎉</div>
        ) : (
          <div className="flex flex-col gap-2">
            {data.pending.map(lv => {
              const st = LEAVE_STATUS_STYLE[lv.status] || LEAVE_STATUS_STYLE.PENDING
              const isHl = highlightId && String(highlightId) === String(lv.id)
              return (
                <div
                  key={lv.id}
                  ref={isHl ? highlightRef : null}
                  className={`border rounded-xl p-3 ${isHl ? 'border-blue-400 bg-blue-50' : 'border-gray-100'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-extrabold text-gray-900">{lv.employeeName} <span className="text-gray-400 font-bold">({lv.employeeCode})</span></span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                  <div className="text-xs text-gray-600 font-semibold mb-1">{lv.leaveType} · {lv.sessionType}</div>
                  <div className="text-xs text-gray-500">{lv.startDate}{lv.endDate !== lv.startDate ? ` → ${lv.endDate}` : ''} · {lv.days} day(s)</div>
                  {lv.reason && <div className="text-xs text-gray-400 mt-1 italic">"{lv.reason}"</div>}
                  <div className="mt-2"><LeaveFlowDiagram leaveType={lv.leaveType} status={lv.status} /></div>

                  {rejectFor === lv.id ? (
                    <div className="mt-2 flex flex-col gap-1.5">
                      <textarea
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        placeholder="Reason for rejection (required)…"
                        rows={2}
                        className="w-full text-xs p-2 rounded-lg border border-red-300 resize-y"
                      />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => { setRejectFor(null); setRejectReason('') }} disabled={busyId === lv.id} className="text-xs px-3 py-1 rounded-lg font-bold border border-gray-200 bg-white text-gray-600">Cancel</button>
                        <button
                          onClick={() => act(lv.id, 'reject', rejectReason.trim())}
                          disabled={busyId === lv.id || !rejectReason.trim()}
                          className="text-xs px-3 py-1 rounded-lg font-bold border-none bg-red-600 text-white disabled:opacity-50"
                        >{busyId === lv.id ? '…' : 'Confirm Reject'}</button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 flex gap-2 justify-end">
                      {lv.status !== 'PENDING_HR' && (
                        <button
                          onClick={() => { setRejectFor(lv.id); setRejectReason(''); setMsg(null) }}
                          disabled={busyId === lv.id}
                          className="text-xs px-3 py-1 rounded-lg font-bold border border-red-300 text-red-600 bg-white"
                        >✗ Reject</button>
                      )}
                      <button
                        onClick={() => act(lv.id, 'approve')}
                        disabled={busyId === lv.id}
                        className="text-xs px-3 py-1 rounded-lg font-bold border-none bg-emerald-600 text-white disabled:opacity-50"
                      >{busyId === lv.id ? '…' : (lv.status === 'PENDING_HR' ? '✓ Acknowledge' : '✓ Approve')}</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {data.recent.length > 0 && (
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
          <div className="font-bold text-gray-900 mb-3" style={{ fontSize: '1rem' }}>Recently Decided ({data.recent.length})</div>
          <div className="flex flex-col gap-1.5">
            {data.recent.map(lv => {
              const st = LEAVE_STATUS_STYLE[lv.status] || LEAVE_STATUS_STYLE.PENDING
              return (
                <div key={lv.id} className="border border-gray-100 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-gray-800 truncate">{lv.employeeName} <span className="text-gray-400 font-medium">— {lv.leaveType}</span></div>
                    <div className="text-[11px] text-gray-500">{lv.startDate}{lv.endDate !== lv.startDate ? ` → ${lv.endDate}` : ''} · {lv.days}d</div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}


function LeaveTab({ user }) {
  const [leaveType, setLeaveType] = useState('Sick Leave')
  const [session, setSession]     = useState('Full Day')
  const today = formatDateYmd(new Date())
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate]     = useState(today)
  const [reason, setReason]       = useState('')
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg]   = useState(null) // { ok, text }
  const [myLeaves, setMyLeaves]     = useState([])
  const [leavesLoading, setLeavesLoading] = useState(false)
  const [leaveEntitlements, setLeaveEntitlements] = useState(DEFAULT_LEAVE_ENTITLEMENTS)

  function calcDays() {
    const s = new Date(startDate), e = new Date(endDate)
    if (!s || !e || e < s) return 0
    const d = Math.round((e - s) / 86400000) + 1
    return session !== 'Full Day' ? (d === 1 ? 0.5 : d - 0.5) : d
  }
  const days = calcDays()

  const policyHint =
    leaveType === 'Personal Leave' ? 'Must submit at least 1 day in advance' :
    leaveType === 'Annual Leave' ? 'Must submit at least 3 days in advance' :
    leaveType === 'Sick Leave' && days > 2 ? 'Over 2 days - supporting document required' :
    'Select dates to validate'
  const selectedCategory = leaveCategory(leaveType)
  const selectedEntitlement = leaveEntitlements[selectedCategory]
  const selectedYear = new Date(startDate).getFullYear()
  const categoryLeaves = myLeaves.filter(lv => {
    const lvYear = new Date(lv.startDate).getFullYear()
    return lvYear === selectedYear && leaveCategory(lv.leaveType) === selectedCategory
  })
  const approvedUsed = categoryLeaves
    .filter(lv => lv.status === 'APPROVED')
    .reduce((sum, lv) => sum + Number(lv.days || 0), 0)
  const pendingUsed = categoryLeaves
    .filter(lv => ['PENDING', 'PENDING_PM', 'PENDING_DC', 'PENDING_HR'].includes(lv.status))
    .reduce((sum, lv) => sum + Number(lv.days || 0), 0)
  const remainingAfterRequest = selectedEntitlement == null ? null : selectedEntitlement - approvedUsed - pendingUsed - days
  const entitlementText = selectedEntitlement == null ? 'Policy-based' : `${selectedEntitlement.toFixed(1)} day(s)`
  const remainingText = remainingAfterRequest == null ? 'Policy-based' : `${remainingAfterRequest.toFixed(1)} day(s)`

  const SELECT_CLS = "w-full border border-gray-200 rounded-xl px-3 py-3 text-sm font-semibold text-gray-800 bg-white outline-none"
  const LABEL_CLS  = "block text-xs font-bold text-gray-400 uppercase mb-1.5"

  const fetchMyLeaves = useCallback(async () => {
    if (!user?.employeeCode) return
    setLeavesLoading(true)
    try {
      const res = await apiFetch(`/api/leave/my?employee_code=${encodeURIComponent(user.employeeCode)}`)
      if (res.ok) {
        const data = await res.json()
        setMyLeaves(data.leaves || [])
      }
    } catch (_) {}
    setLeavesLoading(false)
  }, [user?.employeeCode])

  const fetchLeavePolicy = useCallback(async () => {
    try {
      const res = await apiFetch('/api/leave/policy')
      if (res.ok) {
        const data = await res.json()
        setLeaveEntitlements({ ...DEFAULT_LEAVE_ENTITLEMENTS, ...(data.entitlements || {}) })
      }
    } catch (_) {}
  }, [])

  useEffect(() => { fetchMyLeaves() }, [fetchMyLeaves])
  useEffect(() => { fetchLeavePolicy() }, [fetchLeavePolicy])

  async function handleSubmit() {
    if (days <= 0) { setSubmitMsg({ ok: false, text: 'End date must be on or after start date.' }); return }
    setSubmitting(true)
    setSubmitMsg(null)
    try {
      const res = await apiFetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_code: user.employeeCode,
          employee_name: user.name,
          leave_type: leaveType,
          session_type: session,
          start_date: startDate,
          end_date: endDate,
          days,
          reason: reason || null,
          attachment_url: attachmentUrl || null,
        }),
      })
      if (res.ok) {
        setSubmitMsg({ ok: true, text: 'Leave request submitted successfully.' })
        setReason('')
        setAttachmentUrl('')
        fetchMyLeaves()
      } else {
        const err = await res.json().catch(() => ({}))
        setSubmitMsg({ ok: false, text: err.detail || 'Failed to submit leave request.' })
      }
    } catch (e) {
      setSubmitMsg({ ok: false, text: e?.message || 'Network error.' })
    }
    setSubmitting(false)
  }

  async function handleCancel(leaveId) {
    try {
      const res = await apiFetch(`/api/leave/${leaveId}/cancel?employee_code=${encodeURIComponent(user.employeeCode)}`, { method: 'POST' })
      if (res.ok) fetchMyLeaves()
    } catch (_) {}
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Form */}
      <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        <div className="flex items-center gap-2 font-bold text-gray-900 mb-3.5" style={{ fontSize: '1rem' }}>Submit Leave Request</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLS}>Leave Type</label>
            <select value={leaveType} onChange={e => setLeaveType(e.target.value)} className={SELECT_CLS}>
              {['Sick Leave', 'Personal Leave', 'Annual Leave', 'Other Leave'].map(t => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL_CLS}>Session</label>
            <select value={session} onChange={e => setSession(e.target.value)} className={SELECT_CLS}>
              {['Full Day', 'Morning Half', 'Afternoon Half'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL_CLS}>Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={SELECT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={SELECT_CLS} />
          </div>
          <div className="col-span-2">
            <label className={LABEL_CLS}>Reason</label>
            <textarea
              value={reason} onChange={e => setReason(e.target.value)} rows={3}
              placeholder="Briefly explain the reason"
              className={`${SELECT_CLS} resize-none`}
            />
          </div>
          <div className="col-span-2">
            <label className={LABEL_CLS}>Attachment URL <span className="normal-case text-gray-300">(optional)</span></label>
            <input type="url" value={attachmentUrl} onChange={e => setAttachmentUrl(e.target.value)}
              placeholder="Medical cert or supporting file URL"
              className={SELECT_CLS}
            />
            <div className="text-xs text-gray-400 mt-1">Required for sick leave over 2 days</div>
          </div>
        </div>

        {submitMsg && (
          <div className="mt-3 px-3 py-2.5 rounded-xl text-sm font-semibold"
               style={{ background: submitMsg.ok ? '#e8f5e9' : '#fdecea', color: submitMsg.ok ? '#16a34a' : '#dc2626' }}>
            {submitMsg.text}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full mt-4 py-3.5 rounded-2xl text-sm font-extrabold text-white border-none cursor-pointer active:scale-95"
          style={{ background: submitting ? '#9ca3af' : 'linear-gradient(135deg, #0f766e, #0ea5a4)', boxShadow: '0 8px 24px rgba(15,118,110,0.22)' }}
        >
          {submitting ? 'Submitting…' : 'Submit Leave Request'}
        </button>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        <div className="flex items-center gap-2 font-bold text-gray-900 mb-3" style={{ fontSize: '1rem' }}>Request Summary</div>
        {[
          { label: 'Employee',       value: user.name },
          { label: 'Team',           value: `${user.team} · ${user.department}` },
          { label: 'Leave Category',  value: selectedCategory },
          { label: 'Calculated Days', value: `${days.toFixed(1)} day(s)` },
          { label: 'Guidance',       value: policyHint },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
            <span className="text-sm text-gray-400 font-semibold">{row.label}</span>
            <span className="text-sm font-extrabold text-gray-900 text-right max-w-[60%]">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Leave Balance */}
      <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold text-gray-900" style={{ fontSize: '1rem' }}>Leave Statistics</div>
          <span className="text-xs font-extrabold text-gray-400">{selectedYear}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Entitlement', value: entitlementText },
            { label: 'Approved Used', value: `${approvedUsed.toFixed(1)} day(s)` },
            { label: 'Pending', value: `${pendingUsed.toFixed(1)} day(s)` },
            { label: 'Remaining After Request', value: remainingText, strong: true },
          ].map(item => (
            <div key={item.label} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <div className="text-[11px] font-bold uppercase text-gray-400 leading-tight">{item.label}</div>
              <div className="text-sm font-extrabold mt-1" style={{ color: item.strong ? '#0f766e' : '#111827' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Process Flow */}
      <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        <div className="flex items-center gap-2 font-bold text-gray-900 mb-3" style={{ fontSize: '1rem' }}>Process Flow Diagram</div>
        <LeaveFlowDiagram leaveType={leaveType} />
      </div>

      {/* My Leave Requests */}
      <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold text-gray-900" style={{ fontSize: '1rem' }}>My Leave Requests</div>
          <button onClick={fetchMyLeaves} className="text-xs text-teal-600 font-bold border-none bg-transparent cursor-pointer">Refresh</button>
        </div>
        {leavesLoading ? (
          <div className="py-4 text-center text-sm text-gray-400">Loading…</div>
        ) : myLeaves.length === 0 ? (
          <div className="py-4 text-center text-sm text-gray-400">No leave requests yet.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {myLeaves.map(lv => {
              const st = LEAVE_STATUS_STYLE[lv.status] || LEAVE_STATUS_STYLE.PENDING
              return (
                <div key={lv.id} className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-extrabold text-gray-900">{lv.leaveType}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                  <div className="text-xs text-gray-500">{lv.startDate} → {lv.endDate} · {lv.days} day(s) · {lv.sessionType}</div>
                  {lv.reason && <div className="text-xs text-gray-400 mt-0.5 truncate">{lv.reason}</div>}
                  {lv.status === 'REJECTED' && lv.rejectReason && (
                    <div className="text-xs mt-1 font-semibold" style={{ color: '#dc2626' }}>Reason: {lv.rejectReason}</div>
                  )}
                  {lv.reviewedBy && (
                    <div className="text-xs text-gray-400 mt-0.5">Reviewed by {lv.reviewedBy}</div>
                  )}
                  <div className="mt-2">
                    <LeaveFlowDiagram leaveType={lv.leaveType} status={lv.status} rejectAtStep={lv.rejectAtStep} />
                  </div>
                  {['PENDING', 'PENDING_PM', 'PENDING_DC', 'PENDING_HR'].includes(lv.status) && (
                    <button
                      onClick={() => handleCancel(lv.id)}
                      className="mt-2 text-xs font-bold px-3 py-1 rounded-lg border-none cursor-pointer"
                      style={{ background: '#f3f4f6', color: '#6b7280' }}
                    >Cancel</button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Leave Rules */}
      <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        <div className="flex items-center gap-2 font-bold text-gray-900 mb-3" style={{ fontSize: '1rem' }}>Leave Rules</div>
        <div className="flex flex-col gap-2">
          {[
            { title: 'Personal Leave',  desc: 'Submit at least 1 day in advance' },
            { title: 'Annual Leave',    desc: 'Submit at least 3 days in advance' },
            { title: 'Sick Leave',      desc: 'Over 2 days requires supporting document' },
            { title: 'Overlap Check',   desc: 'System blocks overlapping leave or attendance' },
          ].map(r => (
            <div key={r.title} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
              <div className="text-sm font-extrabold text-gray-900 mb-0.5">{r.title}</div>
              <div className="text-xs text-gray-500 leading-snug">{r.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── History Tab ──────────────────────────────────────────────────────────────
function HistoryTab({ employeeCode }) {
  const [groups, setGroups] = useState([])   // [{ dateLabel, dateKey, sessions }]
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')
  const [selectedSession, setSelectedSession] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    apiGetClockHistory(employeeCode)
      .then(res => {
        if (cancelled) return
        // Build session rows
        const sessions = (res.sessions || []).map(s => ({
          id: s.id,
          dateKey: s.work_date || (s.clock_in_at ? s.clock_in_at.slice(0, 10) : ''),
          clockIn:  s.clock_in_at  ? new Date(s.clock_in_at)  : null,
          clockOut: s.clock_out_at ? new Date(s.clock_out_at) : null,
          site: s.site_code || s.site_name || null,
          siteCode: s.site_code || '',
          siteName: s.site_name || '',
          status: s.status,
          clockType: s.clock_type,
          latIn: s.lat_in,
          lngIn: s.lng_in,
          latOut: s.lat_out,
          lngOut: s.lng_out,
          photoIn: s.id && s.photo_in ? `/api/clock/photos/${s.id}/in` : null,
          photoOut: s.id && s.photo_out ? `/api/clock/photos/${s.id}/out` : null,
        })).filter(s => s.clockIn)

        // Group by dateKey, newest date first
        const map = {}
        sessions.forEach(s => {
          if (!map[s.dateKey]) map[s.dateKey] = []
          map[s.dateKey].push(s)
        })
        const sorted = Object.keys(map).sort((a, b) => b.localeCompare(a)).map(dateKey => {
          const d = new Date(dateKey + 'T00:00:00')
          const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
          const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
          const today = new Date(); today.setHours(0,0,0,0)
          const yesterday = new Date(today); yesterday.setDate(today.getDate()-1)
          d.setHours(0,0,0,0)
          let label
          if (d.getTime() === today.getTime()) label = 'Today'
          else if (d.getTime() === yesterday.getTime()) label = 'Yesterday'
          else label = `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`
          return { dateKey, label, sessions: map[dateKey].sort((a,b) => a.clockIn - b.clockIn) }
        })
        setGroups(sorted)
      })
      .catch(err => { if (!cancelled) setError(err?.message || 'Could not load attendance history') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [employeeCode])

  function totalDayMinutes(sessions) {
    return sessions.reduce((acc, s) => {
      if (s.clockIn && s.clockOut) acc += Math.max(0, Math.round((s.clockOut - s.clockIn) / 60000))
      return acc
    }, 0)
  }

  function sessionMinutes(s) {
    if (!s.clockIn || !s.clockOut) return 0
    return Math.max(0, Math.round((s.clockOut - s.clockIn) / 60000))
  }

  function statusMeta(s) {
    if (!s.clockOut || s.status === 'ACTIVE' || s.status === 'CLOCK_IN') return { label: 'Active', bg: '#fff7ed', color: '#c2410c' }
    const outcome = s.outcome || s.status
    if (outcome === 'ISSUE') return { label: 'Issue', bg: '#fee2e2', color: '#b91c1c' }
    if (outcome === 'STOP') return { label: 'Stopped', bg: '#fef3c7', color: '#b45309' }
    if (outcome === 'COMPLETE' || outcome === 'COMPLETED' || s.status === 'CLOSED' || s.clockOut) return { label: 'Complete', bg: '#dcfce7', color: '#166534' }
    return { label: outcome || 'Unknown', bg: '#f1f5f9', color: '#475569' }
  }

  const flatSessions = groups.flatMap(group => group.sessions.map(s => ({ ...s, dateLabel: group.label, dateKey: group.dateKey })))
  const filteredSessions = flatSessions.filter(s => {
    if (dateFrom && s.dateKey < dateFrom) return false
    if (dateTo && s.dateKey > dateTo) return false
    const q = search.trim().toLowerCase()
    if (!q) return true
    return [s.site, s.siteCode, s.siteName, s.clockType, s.status, s.dateLabel, s.dateKey]
      .filter(Boolean)
      .some(v => String(v).toLowerCase().includes(q))
  })
  const filteredGroups = Object.values(filteredSessions.reduce((acc, s) => {
    if (!acc[s.dateKey]) acc[s.dateKey] = { dateKey: s.dateKey, label: s.dateLabel, sessions: [] }
    acc[s.dateKey].sessions.push(s)
    return acc
  }, {})).sort((a, b) => b.dateKey.localeCompare(a.dateKey))

  const now = new Date()
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0,0,0,0)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const completedFiltered = filteredSessions.filter(s => s.clockOut)
  const weekSessions = filteredSessions.filter(s => s.clockIn >= weekStart)
  const monthSessions = filteredSessions.filter(s => s.clockIn >= monthStart)
  const summaryCards = [
    { label: 'Filtered Sessions', value: filteredSessions.length, note: `${completedFiltered.length} complete` },
    { label: 'Filtered Hours', value: formatMinutes(filteredSessions.reduce((sum, s) => sum + sessionMinutes(s), 0)), note: 'Completed sessions' },
    { label: 'This Week', value: formatMinutes(weekSessions.reduce((sum, s) => sum + sessionMinutes(s), 0)), note: `${weekSessions.length} session(s)` },
    { label: 'This Month', value: formatMinutes(monthSessions.reduce((sum, s) => sum + sessionMinutes(s), 0)), note: `${monthSessions.length} session(s)` },
  ]

  function exportCsv() {
    const rows = [
      ['Date', 'Clock In', 'Clock Out', 'Duration', 'Clock Type', 'Site', 'Status', 'Lat In', 'Lng In', 'Lat Out', 'Lng Out'],
      ...filteredSessions.map(s => [
        s.dateKey,
        s.clockIn ? formatTime24(s.clockIn) : '',
        s.clockOut ? formatTime24(s.clockOut) : '',
        s.clockOut ? formatMinutes(sessionMinutes(s)) : 'Active',
        s.clockType === 'PER_SITE' ? 'Site clock' : 'Daily clock',
        s.site || '',
        statusMeta(s).label,
        s.latIn ?? '',
        s.lngIn ?? '',
        s.latOut ?? '',
        s.lngOut ?? '',
      ]),
    ]
    const csv = rows.map(row => row.map(v => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ace-clock-history-${employeeCode || 'employee'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="font-bold text-gray-900" style={{ fontSize: '1rem' }}>History Tools</div>
          <button onClick={exportCsv} disabled={!filteredSessions.length} className="text-xs font-extrabold px-3 py-2 rounded-xl border-none cursor-pointer disabled:opacity-50" style={{ background: '#0f766e', color: '#fff' }}>Export CSV</button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search site, status, type..." className="col-span-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {summaryCards.map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-3" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <div className="text-[11px] font-bold uppercase text-gray-400">{card.label}</div>
            <div className="text-base font-extrabold text-gray-900 mt-1">{card.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{card.note}</div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="bg-white rounded-2xl p-4 text-center text-sm font-semibold text-gray-400" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
          Loading attendance history...
        </div>
      )}
      {!loading && error && (
        <div className="rounded-2xl px-4 py-3 text-sm font-semibold" style={{ background: '#fee2e2', color: '#b91c1c' }}>
          {error}
        </div>
      )}
      {!loading && !error && groups.length === 0 && (
        <div className="bg-white rounded-2xl p-4 text-center text-sm font-semibold text-gray-400" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
          No attendance records found.
        </div>
      )}
      {!loading && !error && groups.length > 0 && filteredGroups.length === 0 && (
        <div className="bg-white rounded-2xl p-4 text-center text-sm font-semibold text-gray-400" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
          No records match the current filters.
        </div>
      )}
      {!loading && !error && filteredGroups.map(group => {
        const mins = totalDayMinutes(group.sessions)
        const hasComplete = group.sessions.some(s => s.clockOut)
        return (
          <div key={group.dateKey} className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            {/* Day header */}
            <div className="flex items-center justify-between px-4 py-2.5" style={{ background: '#f8f9fb', borderBottom: '1px solid #f0f1f4' }}>
              <span className="text-sm font-extrabold text-gray-700">{group.label}</span>
              {hasComplete && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#e8f5e9', color: '#2e7d32' }}>
                  {formatMinutes(mins)}
                </span>
              )}
            </div>
            {/* Sessions */}
            <div className="divide-y divide-gray-50">
              {group.sessions.map(s => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                  {/* In/Out times */}
                  <div className="flex flex-col items-center gap-1 shrink-0" style={{ minWidth: 48 }}>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: '#2e7d32', display: 'inline-block' }} />
                      <span className="text-xs font-bold text-gray-800">{formatTime24(s.clockIn)}</span>
                    </div>
                    {s.clockOut ? (
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ background: '#c0392b', display: 'inline-block' }} />
                        <span className="text-xs font-bold text-gray-800">{formatTime24(s.clockOut)}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ background: '#f59e0b', display: 'inline-block' }} />
                        <span className="text-xs font-semibold text-amber-500">Active</span>
                      </div>
                    )}
                  </div>
                  {/* Divider */}
                  <div style={{ width: 1, alignSelf: 'stretch', background: '#e5e7eb' }} />
                  {/* Site & duration */}
                  <div className="flex-1 min-w-0">
                    {s.site && <div className="text-xs font-bold text-gray-700 truncate">{s.site}</div>}
                    <div className="text-xs text-gray-400">{s.clockType === 'PER_SITE' ? 'Site clock' : 'Daily clock'}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full" style={{ background: statusMeta(s).bg, color: statusMeta(s).color }}>{statusMeta(s).label}</span>
                      {(s.latIn != null && s.lngIn != null) && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">GPS In</span>}
                      {(s.photoIn || s.photoOut) && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Photo</span>}
                    </div>
                  </div>
                  {/* Duration */}
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    {s.clockIn && s.clockOut && <div className="text-xs font-bold text-gray-500">{formatMinutes(sessionMinutes(s))}</div>}
                    <button onClick={() => setSelectedSession(s)} className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg border-none cursor-pointer" style={{ background: '#eef2ff', color: '#2447d8' }}>View</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
      {selectedSession && (
        <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-4 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-base font-extrabold text-gray-900">Session Detail</div>
                <div className="text-xs text-gray-400">{selectedSession.dateLabel} · {selectedSession.clockType === 'PER_SITE' ? 'Site clock' : 'Daily clock'}</div>
              </div>
              <button onClick={() => setSelectedSession(null)} className="w-8 h-8 rounded-full border-none bg-gray-100 text-gray-500 font-bold">×</button>
            </div>
            <div className="flex flex-col gap-2">
              {[
                ['Status', statusMeta(selectedSession).label],
                ['Site', selectedSession.site || '-'],
                ['Clock In', selectedSession.clockIn ? formatDateTime24(selectedSession.clockIn, true) : '-'],
                ['Clock Out', selectedSession.clockOut ? formatDateTime24(selectedSession.clockOut, true) : 'Active'],
                ['Duration', selectedSession.clockOut ? formatMinutes(sessionMinutes(selectedSession)) : 'Active'],
                ['Location In', selectedSession.latIn != null && selectedSession.lngIn != null ? `${Number(selectedSession.latIn).toFixed(5)}, ${Number(selectedSession.lngIn).toFixed(5)}` : '-'],
                ['Location Out', selectedSession.latOut != null && selectedSession.lngOut != null ? `${Number(selectedSession.latOut).toFixed(5)}, ${Number(selectedSession.lngOut).toFixed(5)}` : '-'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-3 border-b border-gray-50 py-2">
                  <span className="text-xs font-bold uppercase text-gray-400">{label}</span>
                  <span className="text-sm font-extrabold text-gray-800 text-right">{value}</span>
                </div>
              ))}
              {(selectedSession.photoIn || selectedSession.photoOut) && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {selectedSession.photoIn && <AuthImage src={selectedSession.photoIn} alt="Clock in" className="w-full rounded-xl object-cover" />}
                  {selectedSession.photoOut && <AuthImage src={selectedSession.photoOut} alt="Clock out" className="w-full rounded-xl object-cover" />}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Auth Image ───────────────────────────────────────────────────────────────
// The photo endpoint (/api/clock/photos/{id}/{dir}) requires a JWT, but a plain
// <img src> never sends the Authorization header → 401 → broken image. Fetch the
// bytes via apiFetch (JWT attached), turn them into an object URL, and render that.
// Renders nothing if the photo is missing or the request fails.
function AuthImage({ src, alt, className }) {
  const [url, setUrl] = useState(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let cancelled = false
    let objUrl = null
    setUrl(null); setFailed(false)
    if (!src) return
    ;(async () => {
      try {
        const r = await apiFetch(src)
        if (!r.ok) { if (!cancelled) setFailed(true); return }
        const blob = await r.blob()
        objUrl = URL.createObjectURL(blob)
        if (cancelled) { URL.revokeObjectURL(objUrl); return }
        setUrl(objUrl)
      } catch { if (!cancelled) setFailed(true) }
    })()
    return () => { cancelled = true; if (objUrl) URL.revokeObjectURL(objUrl) }
  }, [src])
  if (failed) return null
  if (!url) {
    return (
      <div className={`${className} flex items-center justify-center bg-slate-100`} style={{ minHeight: 120 }}>
        <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Loading…</span>
      </div>
    )
  }
  return <img src={url} alt={alt} className={className} />
}

// ─── Loading Overlay ──────────────────────────────────────────────────────────
function LoadingOverlay({ visible, text }) {
  if (!visible) return null
  return (
    <div className="ace-clock-loading-backdrop fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="ace-clock-loading-panel bg-white rounded-2xl text-center">
        <div className="ace-clock-spinner w-9 h-9 rounded-full mx-auto mb-3" />
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {text || 'Processing...'}
        </div>
      </div>
    </div>
  )
}

// ─── Alert Modal ──────────────────────────────────────────────────────────────
function AlertModal({ visible, message, onOk }) {
  if (!visible) return null
  return (
    <div className="ace-clock-modal-backdrop fixed inset-0 z-[10000] flex items-end justify-center p-4">
      <div className="ace-clock-modal-sheet bg-white w-full max-w-md">
        <div className="w-9 h-1 rounded-full bg-gray-200 mx-auto mb-5" />
        <div className="text-base font-medium text-gray-700 text-center mb-5 leading-relaxed">{message}</div>
        <button
          onClick={onOk}
          className="ace-clock-ok-button w-full py-3.5 rounded-xl text-sm font-bold text-white border-none cursor-pointer"
        >
          OK
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function ClockWorkspace({ currentUser, onLogout }) {
  // ── Navigation state ──
  // Read ?tab=approvals&id=N from URL for email deep-links
  const _initialTab = (() => {
    try {
      const sp = new URLSearchParams(window.location.search)
      const t = sp.get('tab')
      if (t === 'approvals' || t === 'leave' || t === 'history') return t
    } catch {}
    return 'dashboard'
  })()
  const _highlightLeaveId = (() => {
    try { return new URLSearchParams(window.location.search).get('id') } catch { return null }
  })()
  const [activeTab,    setActiveTab]    = useState(_initialTab)
  const [pendingApprovals, setPendingApprovals] = useState(0)
  const [view,         setView]         = useState('main')      // main | camera | summary
  const [currentAction, setCurrentAction] = useState('Clock In')
  const [siteOutcome, setSiteOutcome] = useState('COMPLETE')

  // ── Universal Clock role ──
  const allowedRoles = allowedRolesForUser(currentUser)
  const [clockRole, setClockRole] = useState(roleFromUser(currentUser))            // DTE | DTA | OTHER
  // roleConfig is the *effective* config (defaults + admin overrides from /api/admin/clock-settings)
  // Defined later via useMemo below — declared with let so it's hoisted-compatible
  // Note: actual value comes from effectiveRoleConfig useMemo
  const [clockPermissions, setClockPermissions] = useState(null)

  // ── DAILY clock state (DTA / OTHER) ──
  const [isClockingOut,  setIsClockingOut]  = useState(false)
  const [todayIn,        setTodayIn]        = useState(null)
  const [todayOut,       setTodayOut]       = useState(null)
  const [totalMinutes,   setTotalMinutes]   = useState(0)
  const [dailySessionId, setDailySessionId] = useState(null)

  // ── PER_SITE clock state (DTE) ──
  const [dteSessions,    setDteSessions]    = useState([])     // { siteCode, siteName, clockIn, clockOut }
  const [dteDayClockedIn, setDteDayClockedIn] = useState(false)
  const [selectedSite,   setSelectedSite]   = useState(null)
  const [sites,          setSites]          = useState([])  // loaded from API
  const [plannedSites,   setPlannedSites]   = useState([])  // sites planned for this DTE
  const [clockSettings,  setClockSettings]  = useState(null) // per-role overrides

  // ── GPS ──
  const [gpsPos,       setGpsPos]       = useState(null)   // { lat, lng, accuracy }
  const [gpsPlaceName, setGpsPlaceName] = useState('')

  // ── Summary after successful clock ──
  const [capturedPhoto,  setCapturedPhoto]  = useState(null)
  const [summaryData,    setSummaryData]    = useState(null)

  // ── UI ──
  const [loading,      setLoading]      = useState(false)
  const [loadingText,  setLoadingText]  = useState('')
  const [alert,        setAlert]        = useState(null)
  const [dateStr,      setDateStr]      = useState('')

  // ── Clock ticker ──
  useEffect(() => {
    function tick() {
      const now  = new Date()
      setDateStr(formatDateTime24(now, true))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // ── Pending-approvals badge counter (poll every 60s) ──
  useEffect(() => {
    const code = currentUser?.employeeCode || currentUser?.employee_code
    if (!code) return
    let cancelled = false
    async function load() {
      try {
        const res = await apiFetch(`/api/leave/pending-for-me?employee_code=${encodeURIComponent(code)}`)
        if (!res.ok || cancelled) return
        const j = await res.json()
        setPendingApprovals((j.pending || []).length)
      } catch {}
    }
    load()
    const id = setInterval(load, 60000)
    return () => { cancelled = true; clearInterval(id) }
  }, [currentUser])

  // ── GPS watch ──
  useEffect(() => {
    if (!navigator.geolocation) {
      setAlert('GPS is not available on this device.')
      return
    }
    const id = navigator.geolocation.watchPosition(
      pos => setGpsPos({ lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy }),
      () => setGpsPos(null),
      { enableHighAccuracy: true, maximumAge: 30000 }
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [])

  // ── Reverse geocode when GPS position changes ──
  useEffect(() => {
    if (!gpsPos) return
    const { lat, lng } = gpsPos
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&accept-language=en`, {
      headers: { 'Accept-Language': 'en' }
    })
      .then(r => r.json())
      .then(data => {
        const a = data.address || {}
        const parts = [
          a.quarter || a.neighbourhood || a.village,
          a.suburb || a.city_district || a.district,
          a.city || a.town || a.county || a.state,
        ].filter(Boolean)
        setGpsPlaceName(parts.join(', ') || data.display_name?.split(',').slice(0, 3).join(',').trim() || '')
      })
      .catch(() => setGpsPlaceName(''))
  }, [gpsPos ? `${gpsPos.lat.toFixed(3)},${gpsPos.lng.toFixed(3)}` : null])

  // ── Load sites from API (DTE) ──
  useEffect(() => {
    const employeeCode = currentUser.employeeCode || currentUser.employee_code || String(currentUser.id)
    apiGetClockPermissions(employeeCode)
      .then(data => {
        setClockPermissions(data)
        const userNativeRole = roleFromUser(currentUser)
        if (data.roles?.includes('DTE') && data.clock_type === 'PER_SITE') setClockRole('DTE')
        else if (data.roles?.includes('DTE')) setClockRole('DTE_DAILY')
        else if (data.roles?.includes('TE')) setClockRole('TE')
        else if (data.clock_type === 'DAILY' && userNativeRole === 'OTHER') setClockRole('OTHER')
        // else: keep the role already set from the user's own positionCode (DTE, DTA, etc.)
        setSites((data.sites || []).map(s => ({
            id: s.id,
            siteCode: s.site_code,
            siteName: s.site_name,
            customer: s.customer,
            lat: s.lat,
            lng: s.lng,
            gpsRadiusM: s.gpsRadiusM || s.gps_radius_m,
          })))
        setPlannedSites((data.planned_sites || []).map(s => ({
            id: s.id,
            siteCode: s.site_code,
            siteName: s.site_name,
            customer: s.customer,
            lat: s.lat,
            lng: s.lng,
            gpsRadiusM: s.gpsRadiusM || s.gps_radius_m,
            workflowStatuses: s.workflow_statuses || [],
            workType: s.work_type,
            plannedStartDate: s.planned_start_date,
            plannedEndDate: s.planned_end_date,
            poCount: s.planned_po_count || 0,
            itemDescription: s.item_description,
          })))
      })
      .catch(() => {})
    apiFetch('/api/admin/clock-settings').then(r => r.json())
      .then(d => setClockSettings(d.config || null)).catch(() => {})
  }, [currentUser.employeeCode])

  // ── Compute the effective role config (defaults overridden by clockSettings) ──
  const roleConfig = useMemo(() => {
    const base = ROLE_CONFIGS[clockRole] || ROLE_CONFIGS.OTHER
    const override = clockSettings?.[clockRole]
    if (!override) return { ...base, enforceRadius: true, enabled: true }
    return {
      ...base,
      gpsRequired:   typeof override.gpsRequired   === 'boolean' ? override.gpsRequired   : base.gpsRequired,
      photoRequired: typeof override.photoRequired === 'boolean' ? override.photoRequired : base.photoRequired,
      enforceRadius: typeof override.enforceRadius === 'boolean' ? override.enforceRadius : true,
      enabled:       typeof override.enabled       === 'boolean' ? override.enabled       : true,
    }
  }, [clockRole, clockSettings])

  // ── Reset and load today's sessions when role changes ──
  useEffect(() => {
    let cancelled = false

    setIsClockingOut(false)
    setTodayIn(null); setTodayOut(null); setTotalMinutes(0); setDailySessionId(null)
    setDteSessions([]); setDteDayClockedIn(false); setSelectedSite(null)

    async function loadTodaySessions() {
      setLoading(true)
      setLoadingText('Loading today...')
      try {
        const res = await apiGetTodaySessions(currentUser.employeeCode || currentUser.employee_code || String(currentUser.id))
        if (cancelled) return
        const sessions = (res.sessions || []).map(s => ({
          ...s,
          clockIn: parseClockDate(s.clockIn || s.clock_in_at),
          clockOut: parseClockDate(s.clockOut || s.clock_out_at),
        }))

        if (ROLE_CONFIGS[clockRole].clockType === 'PER_SITE') {
          setDteDayClockedIn(sessions.some(s => s.clockIn))
          setTodayIn(sessions.find(s => s.clockIn)?.clockIn || null)
          setDteSessions(sessions.filter(s => s.site_id || s.siteCode || s.site_code).map(s => ({
            sessionId: s.sessionId || s.id,
            siteCode: s.siteCode || s.site_code || s.site?.siteCode || s.site?.site_code || 'Selected Site',
            siteName: s.siteName || s.site_name || s.site?.siteName || s.site?.site_name || '',
            clockIn: s.clockIn,
            clockOut: s.clockOut,
            status: s.status || s.outcome || null,
          })).filter(s => s.clockIn))
          return
        }

        // Find active session (no clockOut) — may have multiple sessions per day
        const activeSession    = sessions.find(s => s.clockIn && !s.clockOut)
        const completedSessions = sessions.filter(s => s.clockIn && s.clockOut)
        const totalMins = completedSessions.reduce(
          (acc, s) => acc + Math.max(0, Math.round((s.clockOut - s.clockIn) / 60000)), 0
        )

        if (activeSession) {
          setDailySessionId(activeSession.sessionId || activeSession.id || null)
          setTodayIn(activeSession.clockIn)
          setTodayOut(null)
          setIsClockingOut(true)
          setTotalMinutes(totalMins)
        } else if (completedSessions.length > 0) {
          const last = completedSessions[completedSessions.length - 1]
          setDailySessionId(null)
          setTodayIn(completedSessions[0].clockIn)
          setTodayOut(last.clockOut)
          setIsClockingOut(false)
          setTotalMinutes(totalMins)
        }
      } catch (err) {
        if (!cancelled) setAlert('Could not load today clock status. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadTodaySessions()
    return () => { cancelled = true }
  }, [clockRole, currentUser.employeeCode])

  // ── Derived: active DTE sessions (multiple sites may run in parallel) ──
  // A session is active when it has a clockIn but no clockOut. Status field is for
  // displaying outcome after completion, not for filtering active state.
  const activeDteSessions = dteSessions.filter(s => s.clockIn && !s.clockOut)
  const activeDteSession = activeDteSessions[0] || null
  const isPerSiteClock = roleConfig.clockType === 'PER_SITE'

  // ── DTE main button starts sites; each active row has its own complete buttons ──
  const dteIsOut = false
  const clockActionLabel = isPerSiteClock
    ? (dteDayClockedIn ? 'Start Site' : 'Clock In')
    : (isClockingOut ? 'Clock Out' : 'Clock In')

  // ── Distance label for user card ──
  const distLabel = (() => {
    if (!gpsPos) return 'Fetching location…'
    if (isPerSiteClock && selectedSite?.lat) {
      const d = haversineDistance(gpsPos.lat, gpsPos.lng, selectedSite.lat, selectedSite.lng)
      return `${formatDistance(d)} from ${selectedSite.siteName}`
    }
    if (currentUser.workLat) {
      const d = haversineDistance(gpsPos.lat, gpsPos.lng, currentUser.workLat, currentUser.workLng)
      const inRange = !currentUser.allowedRadiusM || d <= currentUser.allowedRadiusM
      return `${formatDistance(d)} from ${currentUser.workLocationName} · ${inRange ? 'In range' : 'Out of range'}`
    }
    return 'GPS Active'
  })()

  // ── Handle clock button press ──
  function handleClockPress() {
    const action = isPerSiteClock
      ? (dteDayClockedIn ? 'Start Site' : 'Clock In')
      : (isClockingOut ? 'Clock Out' : 'Clock In')

    // Role-level enable toggle (admin can disable an entire role)
    if (roleConfig.enabled === false) {
      setAlert('Clock-in is disabled for your role. Please contact admin.')
      return
    }

    // Policy: GPS is required for EVERY clock-in/out, all clock_types
    if (!gpsPos) {
      setAlert('GPS location is required. Please enable location access and wait for GPS to lock on.')
      return
    }

    // PER_SITE: validate site selected + within radius (warn if out of range — record for compliance)
    if (isPerSiteClock && action === 'Start Site') {
      if (!selectedSite) { setAlert('Please select a site before starting work.'); return }
      if (roleConfig.enforceRadius !== false && selectedSite.lat != null && selectedSite.lng != null) {
        const d = haversineDistance(gpsPos.lat, gpsPos.lng, selectedSite.lat, selectedSite.lng)
        if (d > selectedSite.gpsRadiusM) {
          setAlert(`You are ${formatDistance(d)} from the site.\nMust be within ${selectedSite.gpsRadiusM}m to clock in.`)
          return
        }
      }
    }

    // DAILY: validate within work_location radius
    if (!isPerSiteClock && roleConfig.enforceRadius !== false && currentUser.workLat != null) {
      const d = haversineDistance(gpsPos.lat, gpsPos.lng, currentUser.workLat, currentUser.workLng)
      const limit = currentUser.allowedRadiusM || 500
      if (d > limit) {
        setAlert(`You are ${formatDistance(d)} from ${currentUser.workLocationName || 'your work location'}.\nMust be within ${limit}m to clock.`)
        return
      }
    }

    setCurrentAction(action)

    // DTE Start Site / End Site: identity already verified at day-open → skip camera
    const isDteSiteAction = isPerSiteClock && (action === 'Start Site' || (isClockingOut && dteDayClockedIn))
    if (isDteSiteAction) {
      submitClock(action, null)
      return
    }

    // Photo disabled for this role (admin override) → skip camera
    if (!roleConfig.photoRequired) {
      submitClock(action, null)
      return
    }

    setView('camera')
  }

  // ── Photo captured from camera ──
  function handlePhotoCapture(base64) {
    setCapturedPhoto('data:image/jpeg;base64,' + base64)
    submitClock(currentAction, base64)
  }

  // ── Submit clock (calls API, updates state) ──
  async function submitClock(action, photoBase64) {
    setLoading(true)
    setLoadingText(
      isPerSiteClock
        ? (action === 'Clock In' || action === 'Start Site' ? 'Starting site...' : 'Completing site...')
        : (action === 'Clock In' ? 'Clocking in...' : 'Clocking out...')
    )
    setView('main')

    const isIn = action === 'Clock In' || action === 'Start Site'
    const sessionId = isPerSiteClock ? activeDteSession?.sessionId : dailySessionId
    if (!isIn && !sessionId) {
      setLoading(false)
      setAlert('Could not find an active clock session. Please refresh ClockApp and try again.')
      return
    }

    // Build API payload
    const payload = {
      employeeCode: currentUser.employeeCode || currentUser.employee_code || String(currentUser.id),
      userId: currentUser.id ?? null,
      clockType: roleConfig.clockType,
      lat: gpsPos?.lat,
      lng: gpsPos?.lng,
      siteId: isPerSiteClock && action === 'Start Site' ? selectedSite?.id : null,
      photoBase64,
      outcome: isPerSiteClock ? siteOutcome : 'COMPLETE',
    }

    try {
      const res = isIn ? await apiClockIn(payload) : await apiClockOut({ sessionId, ...payload })
      if (!res.success) { setAlert('Server error. Please try again.'); return }

      const now = new Date()

      if (isPerSiteClock) {
        if (action === 'Clock In') {
          setDteDayClockedIn(true)
          setTodayIn(now)
        } else if (isIn) {
          setDteSessions(prev => [...prev, {
            sessionId: res.sessionId,
            siteCode: selectedSite.siteCode,
            siteName: selectedSite.siteName,
            clockIn: now, clockOut: null,
            status: 'ACTIVE',
          }])
          setSelectedSite(null)
        }
      } else {
        if (isIn) {
          setDailySessionId(res.sessionId)
          setTodayIn(now); setIsClockingOut(true)
        } else {
          setTodayOut(now)
          setTotalMinutes(prev => prev + Math.max(0, Math.round((now - todayIn) / 60000)))
          setIsClockingOut(false)
          setDailySessionId(null)
        }
      }

      setSummaryData({
        action: isPerSiteClock && !isIn ? siteOutcomeLabel(res.outcome || siteOutcome) : action,
        time: formatTimeWithSeconds(now),
        name: currentUser.name,
        projectCode: currentUser.projectCode || null,
        site: isPerSiteClock ? (isIn ? selectedSite?.siteCode : activeDteSession?.siteCode) : null,
        location: gpsPos ? (gpsPlaceName || `${gpsPos.lat.toFixed(5)}, ${gpsPos.lng.toFixed(5)}`) : 'Location unavailable',
        sessionId: isIn ? res.sessionId : sessionId,
      })

      setLoading(false)
      if (photoBase64) {
        setView('summary')
      } else {
        setAlert(`${action} recorded at ${formatTime(now)}`)
      }
    } catch (err) {
      setAlert(err?.message || 'Could not save clock record. Please check the connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  async function completeDteSession(sessionId, outcome) {
    if (!sessionId) return
    setLoading(true)
    setLoadingText(`${siteOutcomeLabel(outcome)} site...`)
    try {
      const res = await apiClockOut({
        sessionId,
        lat: gpsPos?.lat,
        lng: gpsPos?.lng,
        photoBase64: null,
        outcome,
      })
      if (!res.success) { setAlert('Server error. Please try again.'); return }
      const now = new Date()
      setDteSessions(prev => prev.map(s => (
        s.sessionId === sessionId ? { ...s, clockOut: now, status: res.outcome || outcome } : s
      )))
      setAlert(`${siteOutcomeLabel(res.outcome || outcome)} recorded at ${formatTime(now)}`)
    } catch (err) {
      setAlert(err?.message || 'Could not complete site. Please check the connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="ace-clock-page">
        <div className="ace-phone-shell">

          {/* ── Camera View (full-screen overlay) ── */}
          {view === 'camera' && (
            <>
              <Header dateStr={dateStr} />
              <div className="ace-clock-scroll">
                <CameraSection
                  action={currentAction}
                  onCapture={handlePhotoCapture}
                  onCancel={() => setView('main')}
                  roleConfig={roleConfig}
                  currentUser={currentUser}
                  gpsPos={gpsPos}
                  gpsPlaceName={gpsPlaceName}
                  selectedSite={selectedSite}
                />
              </div>
            </>
          )}

          {/* ── Summary View ── */}
          {view === 'summary' && summaryData && capturedPhoto && (
            <>
              <Header dateStr={dateStr} />
              <div className="ace-clock-scroll">
                <SummaryView
                  photo={capturedPhoto}
                  data={summaryData}
                  onClose={() => setView('main')}
                  onNotify={setAlert}
                />
              </div>
            </>
          )}

          {/* ── Main View ── */}
          {view === 'main' && (
            <>
              <Header dateStr={dateStr} />
              <TabBar active={activeTab} onChange={setActiveTab} pendingCount={pendingApprovals} />

              <div className="ace-clock-main-scroll">

                {/* ── DASHBOARD TAB ── */}
                {activeTab === 'dashboard' && (
                  <>
                    <AccountBar user={currentUser} onLogout={onLogout} />

                    {/* User Card */}
                    <UserCard
                      user={currentUser}
                      locationText={gpsPos ? (gpsPlaceName || `${gpsPos.lat.toFixed(4)}, ${gpsPos.lng.toFixed(4)}`) : 'Getting location…'}
                      distanceLabel={distLabel}
                      statusIn={isPerSiteClock ? !!activeDteSession : isClockingOut}
                    />

                    {/* DTE: Planned sites for today (from Plan DTE) */}
                    {isPerSiteClock && plannedSites.length > 0 && (
                      <PlannedSitesPanel
                        sites={plannedSites}
                        selected={selectedSite}
                        onSelect={setSelectedSite}
                        dteActive={dteDayClockedIn}
                        gpsLat={gpsPos?.lat}
                        gpsLng={gpsPos?.lng}
                      />
                    )}

                    {/* DTE: empty state — no planned sites assigned yet */}
                    {isPerSiteClock && plannedSites.length === 0 && (
                      <div className="mb-3 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-4 text-center">
                        <div className="text-2xl mb-1">📋</div>
                        <div className="text-sm font-extrabold text-amber-900">No sites planned for you yet</div>
                        <div className="mt-1 text-[.72rem] text-amber-700">
                          Please contact your PM to get a site assigned before clocking in.
                        </div>
                      </div>
                    )}


                    {/* Clock In/Out Button */}
                    <ClockButton
                      isOut={isPerSiteClock ? dteIsOut : isClockingOut}
                      onPress={handleClockPress}
                      disabled={loading}
                      roleConfig={roleConfig}
                      actionLabel={clockActionLabel}
                    />

                    {/* Today's Summary */}
                    <TodaySummary
                      clockIn={todayIn}
                      clockOut={todayOut}
                      totalMinutes={totalMinutes}
                      dteSessions={dteSessions}
                      clockType={roleConfig.clockType}
                    />

                    {/* DTE: All sessions list */}
                    {isPerSiteClock && (
                      <DteSessionsList
                        sessions={dteSessions}
                        onComplete={completeDteSession}
                        disabled={loading}
                      />
                    )}
                  </>
                )}

                {/* ── LEAVE TAB ── */}
                {activeTab === 'leave' && <LeaveTab user={currentUser} />}

                {/* ── APPROVALS TAB ── */}
                {activeTab === 'approvals' && (
                  <ApprovalsTab user={currentUser} highlightId={_highlightLeaveId} onCountChange={setPendingApprovals} />
                )}

                {/* ── HISTORY TAB ── */}
                {activeTab === 'history' && (
                  <HistoryTab employeeCode={currentUser.employeeCode || currentUser.employee_code || String(currentUser.id)} />
                )}

              </div>
            </>
          )}

          {/* ── Footer ── */}
          <div className="ace-clock-footer">
            <div className="ace-clock-footer-company">
              Airconnect Engineering (Thailand) Co., Ltd.
            </div>
            <div className="ace-clock-footer-version">
              ACE Clock System 2.0
            </div>
          </div>

        </div>
      </div>

      <LoadingOverlay visible={loading} text={loadingText} />
      <AlertModal visible={!!alert} message={alert} onOk={() => setAlert(null)} />
    </>
  )
}
