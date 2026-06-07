import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  Activity, AlertTriangle, Bell, CalendarDays, CalendarRange, ChevronDown, CheckCircle2,
  ClipboardList, ClipboardCheck, ClipboardX, FileText, Filter, GitBranch, Home,
  LogOut, RefreshCw, Search, X, ChevronRight, AlertOctagon, Send, Eye, Award,
  Clock, History, Command, Sparkles, Menu, Layers, LayoutGrid,
  Wifi, Map as MapIcon, CalendarCheck, Users, LogIn, AlertCircle,
  UserCircle, Phone, Mail, MapPin, Briefcase,
} from 'lucide-react'
import { apiFetch } from './src/apiFetch.js'
import { Card, Badge, EmptyState } from './src/ui/index.jsx'
import RFMonitorPage from './RFMonitorPage.jsx'
import PlanBoardPage from './PlanBoardPage.jsx'

const ACE_BLUE = '#2447d8'
const ACE_RED  = '#c73b32'
const GREEN    = '#16a34a'
const AMBER    = '#b45309'
const RED      = '#dc2626'
const PURPLE   = '#7c3aed'
const SLATE    = '#64748b'
const COMPANY  = 'AirConnect Engineering'

function formatToday() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  })
}

function initials(name) {
  return String(name || 'PS').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || 'PS'
}

const PRESITE_NAV = [
  { id: 'DAILY',     label: 'Daily',           desc: 'Today\'s DT activity log',   icon: CalendarCheck },
  { id: 'SSV_PRE',   label: 'SSV Pre-Site',    desc: 'SSV per-site workflow',      icon: LayoutGrid },
  { id: 'PAC_PRE',   label: 'PAC Pre-Site',    desc: 'PAC per-site workflow',      icon: LayoutGrid },
  { id: 'SSV',       label: 'SSV',             desc: 'Single Site Verification',   icon: Wifi },
  { id: 'PAC',       label: 'PAC',             desc: 'SSOA / Cluster',             icon: Layers },
  { id: 'PLAN_BOARD',label: 'Plan Board',      desc: 'Drag-drop · duration · map · workload', icon: CalendarRange },
  { id: 'MAP',       label: 'Map',             desc: 'Geo view of sites & stages', icon: MapIcon },
  { id: 'DTE_LIST',  label: 'DTE Details',     desc: 'Engineer profile & workload', icon: UserCircle },
  { id: 'JOB_ASGN',  label: 'Job Assignment',  desc: '10-day plan overview',       icon: ClipboardCheck },
]

const PIPELINE_NAVS = new Set(['SSV_PRE', 'PAC_PRE'])

function PreSiteSidebar({ activeNav, setActiveNav, counts, mobileOpen, onMobileClose, projectShort = 'HWT2304' }) {
  return (
    <aside className={`${mobileOpen ? 'fixed inset-y-0 left-0 z-40 flex' : 'hidden'} w-72 flex-col border-r border-slate-200 bg-white/95 p-5 shadow-lg backdrop-blur lg:sticky lg:top-0 lg:flex lg:h-screen lg:shadow-none lg:overflow-y-auto`}>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${ACE_BLUE}, ${ACE_RED})` }}>
          <Command size={24} />
        </div>
        <div className="min-w-0">
          <div className="text-base font-black text-slate-950">ACE Pre-Site</div>
          <div className="text-xs font-bold text-slate-400">{projectShort} · DTE Workflow</div>
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
        {PRESITE_NAV.map(item => {
          const active = item.id === activeNav
          const Icon = item.icon || Activity
          const cnt = counts?.[item.id]
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => { setActiveNav(item.id); onMobileClose?.() }}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-sm font-black transition ${active ? `bg-blue-50 text-[${ACE_BLUE}] shadow-sm` : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'}`}
            >
              <Icon size={18} />
              <span className="flex min-w-0 flex-col">
                <span>{item.label}</span>
                <span className={`text-[.66rem] font-semibold ${active ? 'text-blue-600/80' : 'text-slate-400'}`}>{item.desc}</span>
              </span>
              {cnt != null && cnt !== 0 && (
                <span className={`ml-auto rounded-full px-2 py-0.5 text-[.66rem] font-bold ${active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                  {cnt}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-sm font-black text-slate-900">
          <Sparkles size={18} style={{ color: ACE_BLUE }} />
          Pre-Site Workspace
        </div>
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
          DTE Per-Site Workflow · SLA 3 days from Full On-Air to Check Pass.
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
      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0 active:translate-y-0"
    >
      {children}
    </button>
  )
}

const SLA_DAYS = 3

const STAGES = [
  { key: 'FULL_ONAIR',     label: '① Full On-Air',  short: 'On-Air',   color: '#94a3b8' },
  { key: 'DT_STARTED',     label: '② DT Started',   short: 'Start',    color: AMBER },
  { key: 'DT_DONE',        label: '③ DT Done',      short: 'End',      color: ACE_BLUE },
  { key: 'REPORT_DONE',    label: '④ Report Done',  short: 'Report',   color: ACE_BLUE },
  { key: 'ACE_APPROVED',   label: '⑤ Check Pass',   short: 'Check',    color: GREEN },
]

const STAGE_INDEX = Object.fromEntries(STAGES.map((s, i) => [s.key, i]))

// PAC-specific late-stage columns (replace the single Check column in PAC view)
const PAC_LATE_STAGES = [
  { key: 'PA_OPEN',         label: 'PA Open',          color: AMBER,    atField: 'pa_open_at',         byField: 'pa_open_by' },
  { key: 'PA_CLOSED',       label: 'PA Closed',        color: ACE_BLUE, atField: 'pa_closed_at',       byField: 'pa_closed_by' },
  { key: 'REPORT_SUBMIT',   label: 'Report Submitted', color: PURPLE,   atField: 'report_submit_at',   byField: 'report_submit_by' },
  { key: 'REPORT_APPROVED', label: 'Report Approved',  color: GREEN,    atField: 'report_approved_at', byField: 'report_approved_by' },
]

function getPacLateStages(row) {
  return PAC_LATE_STAGES.map(s => ({
    ...s,
    at: row[s.atField] || null,
    by: row[s.byField] || null,
    done: !!row[s.atField],
  }))
}

function getClusterName(row) {
  return row.rf_cluster_name || '—'
}

function getSiteOwner(row) {
  return { code: row.dta_code || null, name: row.dta_name || row.dta_code || '—' }
}

function SiteOwnerBadge({ row }) {
  const dta = getSiteOwner(row)
  if (!dta.code) return <span className="text-slate-300 text-xs">—</span>
  return (
    <span className="inline-flex flex-col whitespace-nowrap text-[.7rem] text-slate-600">
      <span className="font-bold">{dta.name}</span>
      <span className="font-mono text-[.6rem] text-slate-400">{dta.code}</span>
    </span>
  )
}

function PacLateStageBadge({ stage }) {
  const tone = stage.done ? stage.color : '#cbd5e1'
  const bg   = stage.done ? `${stage.color}1a` : '#f1f5f9'
  return (
    <span style={{ background: bg, color: tone }}
      className="inline-flex flex-col items-start rounded-md px-2 py-1 text-[.65rem] font-black leading-tight whitespace-nowrap min-w-[68px]">
      <span>{stage.done ? fmtDate(stage.at) : '—'}</span>
    </span>
  )
}

// Site status options (DB column site_status)
const SITE_STATUS_OPTIONS = [
  { key: 'OK',               label: 'OK',               bg: '#dcfce7', fg: '#15803d' },
  { key: 'CROSS',            label: 'Cross',            bg: '#fee2e2', fg: '#dc2626' },
  { key: 'ALARM',            label: 'Alarm',            bg: '#fef3c7', fg: '#b45309' },
  { key: 'WAIT_SITE_ACCESS', label: 'Wait Site Access', bg: '#e0e7ff', fg: '#4338ca' },
]

// PAC rounds — DB has no cap. UI displays max 5; overflow shown as "+N" indicator.
const PAC_MAX_DISPLAY_ROUNDS = 5

function getActualPacRoundCount(row) {
  const sessions = Array.isArray(row.sessions) ? row.sessions : []
  return Math.max(sessions.length, Number(row.total_rounds) || 0)
}

function getPacRoundCount(row) {
  return Math.min(getActualPacRoundCount(row), PAC_MAX_DISPLAY_ROUNDS)
}

function getPacRounds(row) {
  const sessions = Array.isArray(row.sessions) ? row.sessions : []
  const byRound = {}
  sessions.forEach(s => { byRound[s.round] = s })
  const count = getPacRoundCount(row)
  if (count === 0) return []
  const out = []
  for (let i = 1; i <= count; i++) {
    const s = byRound[i] || { round: i, started_at: null, ended_at: null, status: 'PENDING' }
    out.push(s)
  }
  return out
}

function DailyTestSchedule({ rows }) {
  // Group rounds by date (YYYY-MM-DD)
  const byDay = {}
  rows.forEach(row => {
    const onAir = row.full_onair_at ? new Date(row.full_onair_at).getTime() : Date.now()
    const rounds = getPacRounds(row)
    rounds.forEach(r => {
      const dt = r.started_at ? new Date(r.started_at) : new Date(onAir + r.round * 86400000)
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
      if (!byDay[key]) byDay[key] = []
      byDay[key].push({ row, round: r.round, status: r.status, time: dt })
    })
  })
  const days = Object.keys(byDay).sort()
  if (!days.length) return null
  const today = new Date().toISOString().slice(0, 10)
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[.08em] text-slate-500">Daily Test Schedule</div>
          <div className="text-sm font-bold text-slate-700">{days.length} testing days · {rows.length} sites · variable rounds</div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {days.map(day => {
          const entries = byDay[day]
          const doneCount = entries.filter(e => e.status === 'DONE').length
          const isPast = day < today
          const isToday = day === today
          return (
            <div key={day} className={`rounded-2xl border p-3 ${isToday ? 'border-amber-200 bg-amber-50/50' : isPast ? 'border-emerald-100 bg-emerald-50/40' : 'border-slate-200 bg-slate-50/60'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-slate-900">{day}</span>
                <span className={`rounded-full px-2 py-0.5 text-[.62rem] font-black ${isToday ? 'bg-amber-100 text-amber-700' : isPast ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                  {isToday ? 'TODAY' : isPast ? `${doneCount}/${entries.length} done` : `${entries.length} planned`}
                </span>
              </div>
              <div className="mt-2 flex flex-col gap-1">
                {entries.slice(0, 4).map((e, i) => (
                  <div key={i} className="flex items-center gap-2 text-[.72rem]">
                    <span className={`inline-flex h-4 w-4 items-center justify-center rounded text-[.6rem] font-black text-white`} style={{ background: e.status === 'DONE' ? GREEN : e.status === 'IN_PROGRESS' ? AMBER : '#94a3b8' }}>
                      {e.round}
                    </span>
                    <span className="truncate font-bold text-slate-700">{e.row.site_code}</span>
                    <span className="ml-auto text-[.62rem] text-slate-400">{e.row.assigned_dte_code}</span>
                  </div>
                ))}
                {entries.length > 4 && (
                  <div className="text-[.66rem] font-bold text-slate-400">+{entries.length - 4} more sites…</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function SsvRoundsBadges({ row }) {
  const sessions = Array.isArray(row.sessions) ? row.sessions : []
  if (sessions.length === 0) {
    return <span className="text-[.66rem] font-bold text-slate-300 italic">no rounds</span>
  }
  return (
    <div className="inline-flex items-center gap-1">
      {sessions.slice(0, 5).map(s => {
        const result = s.check_result || ''
        const bg = result === 'PASS' ? GREEN : result === 'FAIL' ? RED : s.status === 'IN_PROGRESS' ? AMBER : '#e2e8f0'
        const fg = result || s.status === 'IN_PROGRESS' ? '#fff' : '#94a3b8'
        const label = result === 'PASS' ? '✓' : result === 'FAIL' ? '✕' : s.round
        return (
          <span
            key={s.round}
            title={`Round ${s.round} · ${result || s.status || 'PENDING'}${s.check_at ? ' · ' + fmtDate(s.check_at) : ''}`}
            style={{ background: bg, color: fg }}
            className="inline-flex h-5 w-5 items-center justify-center rounded-md text-[.62rem] font-black"
          >
            {label}
          </span>
        )
      })}
      <span className="ml-1 text-[.66rem] font-bold text-slate-500">
        {sessions.filter(s => s.check_result === 'PASS').length}/{sessions.length}
        {sessions.length > 5 && <span className="ml-1 text-amber-600 font-black">+{sessions.length - 5}</span>}
      </span>
    </div>
  )
}

function PacRoundsBadges({ row }) {
  const rounds = getPacRounds(row)
  const totalActual = getActualPacRoundCount(row)
  const overflow = Math.max(0, totalActual - PAC_MAX_DISPLAY_ROUNDS)
  if (rounds.length === 0) {
    return <span className="text-[.66rem] font-bold text-slate-300 italic">no rounds planned</span>
  }
  // Mock plan dates — even if not started yet, show the planned day
  const planDate = (round) => {
    const onAir = row.full_onair_at ? new Date(row.full_onair_at).getTime() : Date.now()
    return new Date(onAir + round * 86400000)
  }
  return (
    <div className="inline-flex items-end gap-1">
      {rounds.map(r => {
        const isDone   = r.status === 'DONE'
        const isActive = r.status === 'IN_PROGRESS'
        const bg = isDone ? GREEN : isActive ? AMBER : '#e2e8f0'
        const fg = isDone || isActive ? '#fff' : '#94a3b8'
        const d = r.started_at ? new Date(r.started_at) : planDate(r.round)
        const mmdd = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        return (
          <div key={r.round} className="flex flex-col items-center" title={`Round ${r.round} · ${fmtDate(d.toISOString())}${r.started_at ? '' : ' (planned)'}`}>
            <span
              style={{ background: bg, color: fg }}
              className="inline-flex h-5 w-6 items-center justify-center rounded-md text-[.62rem] font-black"
            >
              {r.round}
            </span>
            <span className="mt-0.5 text-[.58rem] font-bold leading-none text-slate-400">
              {mmdd}
            </span>
          </div>
        )
      })}
      <span className="ml-1 self-center text-[.66rem] font-bold text-slate-500">
        {(Array.isArray(row.sessions) ? row.sessions : []).filter(r => r.status === 'DONE').length}/{totalActual}
        {overflow > 0 && <span className="ml-1 text-[.62rem] text-amber-600 font-black" title={`${overflow} more rounds beyond display cap`}>+{overflow}</span>}
      </span>
    </div>
  )
}

// Layers from DB (parsed from PO item_dis by seed_tracking_from_po)
function getLayers(row) {
  return (typeof row.layers === 'number' && row.layers > 0) ? row.layers : null
}

function SiteStatusBadge({ row }) {
  const key = row.site_status || 'OK'
  const opt = SITE_STATUS_OPTIONS.find(o => o.key === key) || SITE_STATUS_OPTIONS[0]
  return (
    <span style={{
      display: 'inline-block', padding: '3px 8px', borderRadius: 6,
      background: opt.bg, color: opt.fg, fontSize: '.68rem', fontWeight: 700,
      whiteSpace: 'nowrap',
    }}>{opt.label}</span>
  )
}

function roleCan(role, action) {
  const DTE = ['EMPLOYEE', 'PROJECT_ADMIN', 'PM', 'SUPER_ADMIN', 'SYSTEM_ADMIN']
  const TL  = ['PROJECT_ADMIN', 'PM', 'SUPER_ADMIN', 'SYSTEM_ADMIN']
  const M = {
    'dt-start': DTE, 'dt-done': DTE, 'report-done': DTE,
    'check-pass': TL, 'check-fail': TL,
  }
  return (M[action] || []).includes(role)
}

function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toISOString().slice(0, 10)
}

function fmtDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toISOString().slice(0, 16).replace('T', ' ')
}

function fmtTime(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString().slice(11, 16)
}

function fmtDuration(startIso, endIso) {
  if (!startIso || !endIso) return null
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime()
  if (Number.isNaN(ms) || ms < 0) return null
  const totalMin = Math.round(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h${m}m`
}

function daysSince(iso) {
  if (!iso) return null
  const d = new Date(iso).getTime()
  if (Number.isNaN(d)) return null
  return Math.max(0, Math.floor((Date.now() - d) / 86400000))
}

function StatCard({ label, value, helper, tone = ACE_BLUE, icon: Icon = Activity }) {
  return (
    <Card className="group p-5 transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_24px_70px_rgba(36,71,216,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `${tone}12`, color: tone }}>
          <Icon size={21} strokeWidth={2.3} />
        </div>
      </div>
      <div className="mt-5 text-xs font-black uppercase tracking-[.08em] text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-black tracking-normal text-slate-950">{value}</div>
      {helper && <div className="mt-1 text-xs font-semibold text-slate-400">{helper}</div>}
    </Card>
  )
}

function StageBadge({ stage, row }) {
  const idx = STAGE_INDEX[stage.key] ?? -1
  const curIdx = STAGE_INDEX[row.current_stage] ?? -1
  const reached = curIdx >= idx
  const failed = stage.key === 'ACE_APPROVED' && row.check_result === 'FAIL'
  const tone = reached ? stage.color : '#cbd5e1'
  const bg = reached ? `${stage.color}1a` : '#f1f5f9'
  const ts = (() => {
    switch (stage.key) {
      case 'FULL_ONAIR':    return fmtDate(row.full_onair_at)
      case 'DT_STARTED':
        if (!row.dt_started_at) return '—'
        return `${fmtDate(row.dt_started_at)} ${fmtTime(row.dt_started_at)}`
      case 'DT_DONE':
        if (!row.dt_done_at) return '—'
        return `${fmtDate(row.dt_done_at)} ${fmtTime(row.dt_done_at)}`
      case 'REPORT_DONE':   return row.report_done_at ? fmtDate(row.report_done_at) : '—'
      case 'ACE_APPROVED':
        if (row.check_result === 'PASS' && row.check_at)
          return fmtDate(row.check_at)
        if (row.check_result === 'FAIL')
          return 'FAIL'
        return reached ? 'pending' : '—'
      default: return '—'
    }
  })()
  return (
    <span style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start',
      padding: '4px 8px', borderRadius: 6, background: failed ? '#fee2e2' : bg,
      color: failed ? RED : tone, fontSize: '.68rem', fontWeight: 700,
      lineHeight: 1.2, whiteSpace: 'nowrap', minWidth: 70,
    }}>
      <span style={{ fontSize: '.65rem', fontWeight: 600 }}>{ts}</span>
    </span>
  )
}

function SLAIndicator({ row }) {
  if (!row.full_onair_at) return <span style={{ color: '#cbd5e1' }}>—</span>
  const days = daysSince(row.full_onair_at)
  const breached = row.sla_breached
  if (row.current_stage === 'ACE_APPROVED' && row.check_result === 'PASS') {
    return <span style={{ color: GREEN, fontWeight: 700, fontSize: '.7rem' }}>✓ {days}d</span>
  }
  const color = breached ? RED : (days >= SLA_DAYS ? AMBER : GREEN)
  return (
    <span style={{
      fontSize: '.7rem', fontWeight: 700, color,
      display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      {breached && <AlertOctagon size={12} />}
      {days}d / {SLA_DAYS}d
    </span>
  )
}

function AgingIndicator({ row }) {
  if (!row.full_onair_at) return <span style={{ color: '#cbd5e1' }}>—</span>
  const days = daysSince(row.full_onair_at)
  // Tone: green ≤7d, amber 8–14d, red >14d
  const color = days <= 7 ? GREEN : days <= 14 ? AMBER : RED
  return (
    <span style={{ color }} className="text-[.72rem] font-black">
      {days}d
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// SSV Full On-Air — 14-day window (today = position 11) + recent map
// ─────────────────────────────────────────────────────────────────────────
function injectPulseCss() {
  if (document.getElementById('ace-pulse-css')) return
  const style = document.createElement('style')
  style.id = 'ace-pulse-css'
  style.textContent = `
    @keyframes ace-pulse {
      0%   { box-shadow: 0 0 0 0 rgba(22,163,74,0.55); }
      70%  { box-shadow: 0 0 0 14px rgba(22,163,74,0); }
      100% { box-shadow: 0 0 0 0 rgba(22,163,74,0); }
    }
    .ace-onair-pin {
      animation: ace-pulse 1.6s ease-out infinite;
    }
  `
  document.head.appendChild(style)
}

function SsvOnAirMap({ sites }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const layerRef = useRef(null)
  const [ready, setReady] = useState(!!window.L)

  useEffect(() => {
    injectPulseCss()
    if (window.L) { setReady(true); return }
    const t = setInterval(() => { if (window.L) { clearInterval(t); setReady(true) } }, 100)
    setTimeout(() => clearInterval(t), 8000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!ready || !mapRef.current || mapInstance.current) return
    const L = window.L
    const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OSM' }).addTo(map)
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
    sites.forEach(s => {
      if (s.lat == null || s.lng == null) return
      const icon = L.divIcon({
        className: '',
        html: `<div class="ace-onair-pin" style="background:${GREEN};color:#fff;border:2px solid #fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900">●</div>`,
        iconSize: [22, 22], iconAnchor: [11, 11],
      })
      const popup = `
        <div style="min-width:200px;font-family:system-ui,sans-serif">
          <div style="font-weight:900;color:${ACE_BLUE};font-size:13px">${s.site_code || '—'}</div>
          ${s.site_name ? `<div style="font-size:11px;color:#64748b">${s.site_name}</div>` : ''}
          <div style="margin-top:6px;font-size:11px;color:#475569">
            Full On-Air: <b style="color:${GREEN}">${fmtDate(s.full_on_air)}</b>
          </div>
          ${s.rf_cluster_name ? `<div style="font-size:10px;color:#64748b">Cluster: ${s.rf_cluster_name}</div>` : ''}
        </div>
      `
      L.marker([s.lat, s.lng], { icon }).bindPopup(popup).addTo(layer)
      bounds.push([s.lat, s.lng])
    })
    if (bounds.length) {
      try { mapInstance.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 11 }) } catch {}
    }
  }, [sites, ready])

  return <div ref={mapRef} style={{ width: '100%', height: 280, background: '#e2e8f0', borderRadius: 8 }} />
}

function SsvOnAirChart() {
  const [sites, setSites] = useState([])
  useEffect(() => {
    apiFetch('/api/sites?referenced_only=true').then(r => r.json()).then(d => setSites(d.data || [])).catch(() => {})
  }, [])

  const days = useMemo(() => {
    const out = []
    const today = new Date(); today.setHours(0, 0, 0, 0)
    // Position 11 = today → offsets -10..+3
    for (let i = -10; i <= 3; i++) {
      const d = new Date(today.getTime() + i * 86400000)
      out.push({
        offset: i, iso: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        weekday: d.toLocaleDateString('en-GB', { weekday: 'short' }),
        isToday: i === 0, isPast: i < 0,
      })
    }
    return out
  }, [])

  const byDay = useMemo(() => {
    const m = {}
    days.forEach(d => { m[d.iso] = 0 })
    sites.forEach(s => {
      if (!s.full_on_air) return
      const iso = String(s.full_on_air).slice(0, 10)
      if (iso in m) m[iso]++
    })
    return m
  }, [sites, days])

  const total = Object.values(byDay).reduce((a, b) => a + b, 0)
  const maxValue = Math.max(1, ...Object.values(byDay))

  // Sites that became Full On-Air in the last 3 days (Today-3 to Today inclusive)
  const recentSites = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const cutoff = new Date(today.getTime() - 3 * 86400000).toISOString().slice(0, 10)
    const todayIso = today.toISOString().slice(0, 10)
    return sites.filter(s => {
      if (!s.full_on_air) return false
      const iso = String(s.full_on_air).slice(0, 10)
      return iso >= cutoff && iso <= todayIso
    })
  }, [sites])
  const recentWithGps = recentSites.filter(s => s.lat != null && s.lng != null)

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      {/* Chart — 2/3 width on xl */}
      <Card className="p-6 xl:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[.08em] text-slate-500">Full On-Air — 14-Day Window</div>
            <h3 className="mt-1 text-base font-black text-slate-950">Sites per day · {total} in window</h3>
          </div>
          <div className="text-xs font-black">
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ background: GREEN }} />Full On-Air</span>
          </div>
        </div>

        <div className="flex gap-1.5" style={{ height: 280 }}>
          {days.map(d => {
            const count = byDay[d.iso] || 0
            const BAR_AREA = 200
            const barH = count > 0 ? Math.max(8, (count / maxValue) * BAR_AREA) : 4
            return (
              <div key={d.iso} className="flex flex-1 flex-col items-center justify-end gap-1.5">
                <div className={`text-sm font-black ${d.isToday ? 'text-amber-700' : count > 0 ? 'text-slate-700' : 'text-slate-300'}`}>
                  {count}
                </div>
                <div
                  className={`w-full overflow-hidden rounded-t-lg ${d.isToday ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}
                  style={{
                    height: barH,
                    background: count > 0 ? GREEN : '#e2e8f0',
                    opacity: count > 0 && !d.isToday ? 0.32 : 1,
                  }}
                  title={`${d.label}: ${count} site${count === 1 ? '' : 's'}`}
                />
                <div className={`text-center text-[.6rem] font-black uppercase ${d.isToday ? 'text-amber-700' : d.isPast ? 'text-slate-400' : 'text-slate-500'}`}>
                  <div className="opacity-60">{d.weekday}</div>
                  <div>{d.label}</div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Map — 1/3 width on xl */}
      <Card className="p-6 xl:col-span-1">
        <div className="mb-3">
          <div className="text-xs font-black uppercase tracking-[.08em] text-slate-500">Recent On-Air Map</div>
          <h3 className="mt-1 text-base font-black text-slate-950">
            Last 3 days · {recentSites.length} site{recentSites.length === 1 ? '' : 's'}
            {recentSites.length !== recentWithGps.length && (
              <span className="ml-1 text-xs font-bold text-slate-400">({recentWithGps.length} with GPS)</span>
            )}
          </h3>
        </div>
        <SsvOnAirMap sites={recentWithGps} />
      </Card>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Job Assignment — 10-day plan window (today = position 7)
// ─────────────────────────────────────────────────────────────────────────
function JobAssignmentPage() {
  const [pos, setPos] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    apiFetch('/api/project-pos').then(r => r.json())
      .then(d => setPos(d.data || []))
      .finally(() => setLoading(false))
  }, [])

  // Mock plan dates spread across the 10-day window (today = position 7)
  // Positions 1..10 → offsets -6..+3 from today
  function mockPlanOffset(po) {
    if (po.planned_start_date) {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const d = new Date(po.planned_start_date); d.setHours(0, 0, 0, 0)
      const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
      return Math.max(-6, Math.min(3, diff))
    }
    // Deterministic spread by id
    const id = po.id || 0
    return (id % 10) - 6  // -6..+3
  }

  const days = useMemo(() => {
    const out = []
    const today = new Date(); today.setHours(0, 0, 0, 0)
    for (let i = -6; i <= 3; i++) {
      const d = new Date(today.getTime() + i * 86400000)
      out.push({
        offset: i,
        date: d,
        iso: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }),
        isToday: i === 0,
        isPast: i < 0,
        isFuture: i > 0,
      })
    }
    return out
  }, [])

  const planned = useMemo(() => pos.filter(p => p.planned_dte_codes && (p.work_type === 'SSV' || p.work_type === 'PAC')), [pos])

  const byDay = useMemo(() => {
    const m = {}
    days.forEach(d => { m[d.iso] = { SSV: 0, PAC: 0 } })
    planned.forEach(p => {
      const off = mockPlanOffset(p)
      const iso = days.find(d => d.offset === off)?.iso
      if (iso) m[iso][p.work_type] = (m[iso][p.work_type] || 0) + 1
    })
    return m
  }, [planned, days])

  const maxValue = useMemo(() => {
    let max = 0
    Object.values(byDay).forEach(v => { max = Math.max(max, v.SSV + v.PAC) })
    return Math.max(1, max)
  }, [byDay])

  const totals = useMemo(() => {
    const ssv = planned.filter(p => p.work_type === 'SSV').length
    const pac = planned.filter(p => p.work_type === 'PAC').length
    const unplanned = pos.filter(p => !p.planned_dte_codes && (p.work_type === 'SSV' || p.work_type === 'PAC')).length
    return { ssv, pac, total: ssv + pac, unplanned }
  }, [planned, pos])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
            <Home size={14} />
            {COMPANY} · Job Assignment
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-normal text-slate-950 sm:text-4xl">
            Job Assignment Overview
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
            DT plan distribution across a 10-day window. Today is at position 7 (6 past + today + 3 future days).
          </p>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Plans"   value={totals.total}     helper="SSV + PAC assigned" tone={ACE_BLUE} icon={ClipboardCheck} />
        <StatCard label="SSV Plans"     value={totals.ssv}       helper="Single Site"        tone={ACE_BLUE} icon={Wifi} />
        <StatCard label="PAC Plans"     value={totals.pac}       helper="SSOA / Cluster"     tone={PURPLE}   icon={Layers} />
        <StatCard label="Unplanned"     value={totals.unplanned} helper="no DTE yet"         tone={AMBER}    icon={AlertOctagon} />
      </section>

      {/* 10-day chart */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[.08em] text-slate-500">10-Day Plan Distribution</div>
            <h3 className="mt-1 text-base font-black text-slate-950">Sites planned per day</h3>
          </div>
          <div className="flex gap-3 text-xs font-black">
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ background: ACE_BLUE }} />SSV</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ background: PURPLE }} />PAC</span>
          </div>
        </div>

        <div className="flex gap-2" style={{ height: 320 }}>
          {days.map((d, idx) => {
            const v = byDay[d.iso] || { SSV: 0, PAC: 0 }
            const total = v.SSV + v.PAC
            const BAR_AREA = 220  // pixels — fixed bar area height
            const barH = total > 0 ? Math.max(8, (total / maxValue) * BAR_AREA) : 4
            const ssvH = total ? (v.SSV / total) * barH : 0
            const pacH = total ? (v.PAC / total) * barH : 0
            const position = idx + 1
            return (
              <div key={d.iso} className="flex flex-1 flex-col items-center justify-end gap-2">
                {/* Total count + SSV%/PAC% above the bar */}
                <div className="flex flex-col items-center leading-tight">
                  <div className={`text-sm font-black ${d.isToday ? 'text-amber-700' : total > 0 ? 'text-slate-700' : 'text-slate-300'}`}>
                    {total}
                  </div>
                  {total > 0 ? (
                    <div className="text-[.6rem] font-black flex gap-1">
                      <span style={{ color: ACE_BLUE }}>{Math.round((v.SSV / total) * 100)}%</span>
                      <span className="text-slate-300">/</span>
                      <span style={{ color: PURPLE }}>{Math.round((v.PAC / total) * 100)}%</span>
                    </div>
                  ) : <div className="text-[.6rem] text-slate-300">—</div>}
                </div>

                {/* Bar — fixed pixel heights stack from bottom */}
                <div
                  className={`w-full overflow-hidden rounded-t-lg ${d.isToday ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}
                  style={{
                    height: barH,
                    background: total > 0 ? 'transparent' : '#e2e8f0',
                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                  }}
                  title={`${d.label}: SSV ${v.SSV} · PAC ${v.PAC}`}
                >
                  {v.PAC > 0 && <div style={{ height: pacH, background: PURPLE, opacity: d.isToday ? 1 : 0.32 }} />}
                  {v.SSV > 0 && <div style={{ height: ssvH, background: ACE_BLUE, opacity: d.isToday ? 1 : 0.32 }} />}
                </div>

                {/* Date label */}
                <div className={`text-center text-[.62rem] font-black uppercase tracking-[.02em] ${d.isToday ? 'text-amber-700' : d.isPast ? 'text-slate-400' : 'text-slate-500'}`}>
                  <div>{d.label}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Per-day breakdown */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-[.74rem]">
            <thead>
              <tr className="text-left">
                <th className="border-b border-slate-200 py-2 pr-3 text-xs font-black uppercase tracking-[.04em] text-slate-500">Pos</th>
                <th className="border-b border-slate-200 py-2 pr-3 text-xs font-black uppercase tracking-[.04em] text-slate-500">Day</th>
                <th className="border-b border-slate-200 py-2 pr-3 text-xs font-black uppercase tracking-[.04em] text-slate-500" style={{ color: ACE_BLUE }}>SSV</th>
                <th className="border-b border-slate-200 py-2 pr-3 text-xs font-black uppercase tracking-[.04em] text-slate-500" style={{ color: ACE_BLUE }}>SSV %</th>
                <th className="border-b border-slate-200 py-2 pr-3 text-xs font-black uppercase tracking-[.04em] text-slate-500" style={{ color: PURPLE }}>PAC</th>
                <th className="border-b border-slate-200 py-2 pr-3 text-xs font-black uppercase tracking-[.04em] text-slate-500" style={{ color: PURPLE }}>PAC %</th>
                <th className="border-b border-slate-200 py-2 pr-3 text-xs font-black uppercase tracking-[.04em] text-slate-500">Total</th>
                <th className="border-b border-slate-200 py-2 text-xs font-black uppercase tracking-[.04em] text-slate-500">SSV / PAC mix</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d, i) => {
                const v = byDay[d.iso] || { SSV: 0, PAC: 0 }
                const tot = v.SSV + v.PAC
                const pct = totals.total ? (tot / totals.total) * 100 : 0
                const ssvPct = tot ? (v.SSV / tot) * 100 : 0
                const pacPct = tot ? (v.PAC / tot) * 100 : 0
                return (
                  <tr key={d.iso} className={d.isToday ? 'bg-amber-50/60' : ''}>
                    <td className="py-1.5 pr-3 font-mono text-xs font-bold text-slate-400">{i + 1}</td>
                    <td className="py-1.5 pr-3 font-bold text-slate-700">
                      {d.label}
                    </td>
                    <td className="py-1.5 pr-3 font-black" style={{ color: v.SSV ? ACE_BLUE : '#cbd5e1' }}>{v.SSV}</td>
                    <td className="py-1.5 pr-3 font-black" style={{ color: v.SSV ? ACE_BLUE : '#cbd5e1' }}>{tot ? `${ssvPct.toFixed(0)}%` : '—'}</td>
                    <td className="py-1.5 pr-3 font-black" style={{ color: v.PAC ? PURPLE : '#cbd5e1' }}>{v.PAC}</td>
                    <td className="py-1.5 pr-3 font-black" style={{ color: v.PAC ? PURPLE : '#cbd5e1' }}>{tot ? `${pacPct.toFixed(0)}%` : '—'}</td>
                    <td className="py-1.5 pr-3 font-black text-slate-700">{tot}</td>
                    <td className="py-1.5">
                      {tot > 0 ? (
                        <div className="flex h-4 w-32 overflow-hidden rounded-full bg-slate-100">
                          <div style={{ width: `${ssvPct}%`, background: ACE_BLUE }} title={`SSV ${ssvPct.toFixed(0)}%`} />
                          <div style={{ width: `${pacPct}%`, background: PURPLE }} title={`PAC ${pacPct.toFixed(0)}%`} />
                        </div>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {loading && <div className="text-xs font-bold text-slate-400">Loading…</div>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// DTE Details — engineer profile, workload, recent activity
// ─────────────────────────────────────────────────────────────────────────
function avatarInitials(name) {
  return String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

function DTECard({ dte, workload, stats, onOpen }) {
  const overload = workload >= 10
  return (
    <button
      onClick={() => onOpen(dte)}
      className="text-left rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_24px_70px_rgba(36,71,216,0.12)]"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-base font-black text-white shadow-md" style={{ background: overload ? '#d97706' : ACE_BLUE }}>
          {avatarInitials(dte.full_name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-black text-slate-950">{dte.full_name || dte.employee_code}</div>
          <div className="font-mono text-[.66rem] font-bold text-slate-400">{dte.employee_code}</div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[.7rem] font-black ${overload ? 'bg-amber-100 text-amber-700' : workload > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
          {workload}{overload ? ' ⚠' : ''}
        </span>
      </div>
      <div className="mt-3 flex flex-col gap-1 text-[.7rem]">
        <div className="flex items-center gap-2">
          <Briefcase size={12} className="text-slate-400" />
          <span className="truncate font-bold text-slate-600">{dte.position || dte.job_title || 'Drive Test Engineer'}</span>
        </div>
        {dte.address && (
          <div className="flex items-start gap-2 text-slate-500">
            <MapPin size={12} className="mt-0.5 shrink-0 text-slate-400" />
            <span className="truncate" title={dte.address}>{dte.address}</span>
          </div>
        )}
      </div>

      {/* Test statistics (30d) */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-blue-50 px-2 py-1.5 text-center">
          <div className="text-base font-black text-blue-700">{stats.totalSessions}</div>
          <div className="text-[.58rem] font-bold uppercase tracking-[.05em] text-blue-600">Sessions</div>
        </div>
        <div className="rounded-lg bg-emerald-50 px-2 py-1.5 text-center">
          <div className="text-base font-black text-emerald-700">{stats.completionRate}%</div>
          <div className="text-[.58rem] font-bold uppercase tracking-[.05em] text-emerald-600">Complete</div>
        </div>
        <div className="rounded-lg bg-purple-50 px-2 py-1.5 text-center">
          <div className="text-base font-black text-purple-700">{stats.distinctSites}</div>
          <div className="text-[.58rem] font-bold uppercase tracking-[.05em] text-purple-600">Sites</div>
        </div>
      </div>
      <div className="mt-2 text-[.62rem] font-bold text-slate-400">
        {stats.daysActive}d active · {stats.totalHours}h logged (last 30d)
      </div>
    </button>
  )
}

function HomeBaseEditor({ dte }) {
  const [editing, setEditing] = useState(false)
  const [lat, setLat] = useState(dte.base_lat ?? '')
  const [lng, setLng] = useState(dte.base_lng ?? '')
  const [address, setAddress] = useState(dte.address ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedAt, setSavedAt] = useState(null)
  // Reset local state when switching DTE
  useEffect(() => {
    setLat(dte.base_lat ?? '')
    setLng(dte.base_lng ?? '')
    setAddress(dte.address ?? '')
    setEditing(false); setError(''); setSavedAt(null)
  }, [dte.employee_code])

  const hasCoords = dte.base_lat != null && dte.base_lng != null

  async function save() {
    setError('')
    setSaving(true)
    const body = {}
    const parsedLat = lat === '' ? null : parseFloat(lat)
    const parsedLng = lng === '' ? null : parseFloat(lng)
    if (lat !== '' && (Number.isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90)) {
      setError('Lat must be a number in [-90, 90]'); setSaving(false); return
    }
    if (lng !== '' && (Number.isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180)) {
      setError('Lng must be a number in [-180, 180]'); setSaving(false); return
    }
    body.base_lat = parsedLat
    body.base_lng = parsedLng
    body.address = address || null
    try {
      const res = await apiFetch(`/api/employees/by-code/${encodeURIComponent(dte.employee_code)}/base-location`, {
        method: 'PATCH', body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `HTTP ${res.status}`)
      }
      const updated = await res.json()
      // Reflect back into the drawer DTE object so other panels pick it up
      dte.base_lat = updated.base_lat
      dte.base_lng = updated.base_lng
      dte.address  = updated.address
      setSavedAt(new Date())
      setEditing(false)
    } catch (e) {
      setError(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-black uppercase tracking-[.08em] text-slate-500">Home Base (for planning)</div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[.66rem] font-black uppercase tracking-wider text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            {hasCoords || dte.address ? 'Edit' : 'Set'}
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 text-sm">
        {editing ? (
          <>
            <label className="flex flex-col gap-1">
              <span className="text-[.62rem] font-black uppercase tracking-wider text-slate-500">Address</span>
              <input
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. 123 Sukhumvit Rd, Bangkok"
                className="rounded-md border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-[.62rem] font-black uppercase tracking-wider text-slate-500">Latitude</span>
                <input
                  value={lat}
                  onChange={e => setLat(e.target.value)}
                  inputMode="decimal"
                  placeholder="13.7563"
                  className="rounded-md border border-slate-200 px-2 py-1.5 text-sm font-mono outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[.62rem] font-black uppercase tracking-wider text-slate-500">Longitude</span>
                <input
                  value={lng}
                  onChange={e => setLng(e.target.value)}
                  inputMode="decimal"
                  placeholder="100.5018"
                  className="rounded-md border border-slate-200 px-2 py-1.5 text-sm font-mono outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200"
                />
              </label>
            </div>
            <div className="flex items-center gap-2 text-[.66rem] text-slate-500">
              <span>Tip: open in Google Maps → right-click → click coordinates to copy.</span>
            </div>
            {error && <div className="rounded-md bg-red-50 px-2 py-1 text-xs font-bold text-red-700">{error}</div>}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setEditing(false); setError(''); setLat(dte.base_lat ?? ''); setLng(dte.base_lng ?? ''); setAddress(dte.address ?? '') }}
                disabled={saving}
                className="rounded-md border border-slate-200 px-3 py-1 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="rounded-md bg-blue-600 px-3 py-1 text-xs font-black text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start gap-2">
              <MapPin size={14} className="mt-0.5 shrink-0 text-slate-400" />
              <span className="text-slate-700 leading-snug">{dte.address || <span className="italic text-slate-400">no address set</span>}</span>
            </div>
            {hasCoords ? (
              <div className="ml-6 flex items-center gap-2 text-[.66rem] text-slate-400 font-mono">
                <span>{Number(dte.base_lat).toFixed(4)}, {Number(dte.base_lng).toFixed(4)}</span>
                <a
                  href={`https://www.google.com/maps?q=${dte.base_lat},${dte.base_lng}`}
                  target="_blank" rel="noreferrer"
                  className="text-blue-600 font-bold hover:underline"
                >
                  open in maps ↗
                </a>
              </div>
            ) : (
              <div className="ml-6 text-[.66rem] text-slate-400 italic">no coordinates set — click <strong>Set</strong> to add</div>
            )}
            {savedAt && (
              <div className="ml-6 text-[.62rem] font-bold text-green-700">✓ saved {savedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}


function DTEDetailDrawer({ dte, workload, recentSessions, stats, onClose }) {
  if (!dte) return null
  const overload = workload >= 10
  const avgMins = Math.round(stats.avgDurationMs / 60000)
  const avgH = Math.floor(avgMins / 60)
  const avgM = avgMins % 60
  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 520,
      background: '#fff', boxShadow: '-4px 0 12px rgba(15,23,42,.12)',
      zIndex: 100, overflowY: 'auto', borderLeft: '1px solid #e2e8f0',
    }}>
      <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-black text-white shadow-md" style={{ background: overload ? '#d97706' : ACE_BLUE }}>
            {avatarInitials(dte.full_name)}
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-[.08em] text-slate-500">DTE Engineer</div>
            <h2 className="text-xl font-black text-slate-950">{dte.full_name || dte.employee_code}</h2>
            <div className="font-mono text-xs font-bold text-slate-400">{dte.employee_code}</div>
          </div>
        </div>
        <button onClick={onClose} className="rounded-md p-1 hover:bg-slate-100">
          <X size={20} className="text-slate-500" />
        </button>
      </div>

      <div className="flex flex-col gap-5 px-5 py-5">
        {/* Profile */}
        <div>
          <div className="text-xs font-black uppercase tracking-[.08em] text-slate-500 mb-2">Profile</div>
          <div className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 text-sm">
            <div className="flex items-center gap-2">
              <Briefcase size={14} className="text-slate-400" />
              <span className="font-bold text-slate-700">{dte.position || dte.job_title || 'Drive Test Engineer'}</span>
              {dte.contract_type && (
                <span className="ml-auto rounded-full bg-purple-50 px-2 py-0.5 text-[.62rem] font-black text-purple-700">{dte.contract_type}</span>
              )}
            </div>
            {dte.email && <div className="flex items-center gap-2"><Mail size={14} className="text-slate-400" /><span className="text-slate-600">{dte.email}</span></div>}
            {dte.personal_email && dte.personal_email !== dte.email && <div className="flex items-center gap-2"><Mail size={14} className="text-slate-300" /><span className="text-slate-500 text-xs">{dte.personal_email} (personal)</span></div>}
            {dte.phone && <div className="flex items-center gap-2"><Phone size={14} className="text-slate-400" /><span className="text-slate-600">{dte.phone}</span></div>}
            {(dte.team || dte.project_team) && <div className="flex items-center gap-2"><Users size={14} className="text-slate-400" /><span className="text-slate-600">{dte.team || dte.project_team}</span></div>}
            {(dte.project_code || dte.project_name) && <div className="flex items-center gap-2"><Home size={14} className="text-slate-400" /><span className="text-slate-600">{dte.project_code || dte.project_name}</span></div>}
            {dte.work_location && <div className="flex items-center gap-2"><MapPin size={14} className="text-slate-400" /><span className="text-slate-600">Work: {dte.work_location}</span></div>}
            {dte.hire_date && <div className="flex items-center gap-2"><CalendarDays size={14} className="text-slate-400" /><span className="text-slate-600 text-xs">Hired: {dte.hire_date}{dte.contract_end_date ? ` · ends ${dte.contract_end_date}` : ''}</span></div>}
          </div>
        </div>

        {/* Home Base — editable (for planning) */}
        <HomeBaseEditor dte={dte} />


        {/* Workload */}
        <div className="grid grid-cols-3 gap-2">
          <StatChip label="Active PO"      value={workload}                                        tone={overload ? '#d97706' : ACE_BLUE} sub={overload ? 'overloaded' : 'currently assigned'} />
          <StatChip label="Sites (30d)"    value={stats.distinctSites}                             tone={PURPLE} sub="distinct" />
          <StatChip label="Days Active"    value={stats.daysActive}                                tone={GREEN}  sub="last 30d" />
        </div>

        {/* Testing Statistics */}
        <div>
          <div className="text-xs font-black uppercase tracking-[.08em] text-slate-500 mb-2">Testing Statistics (Last 30 Days)</div>
          <div className="grid grid-cols-2 gap-2">
            <StatChip label="Total Sessions"   value={stats.totalSessions} tone={ACE_BLUE}  sub={`${stats.ongoing} ongoing`} />
            <StatChip label="Completion Rate" value={`${stats.completionRate}%`} tone={GREEN}    sub={`${stats.complete}/${stats.closedSessions} closed`} />
            <StatChip label="Total Hours"     value={`${stats.totalHours}h`}     tone={AMBER}    sub="logged on-site" />
            <StatChip label="Avg Duration"    value={avgMins ? `${avgH}h${avgM}m` : '—'}        tone={SLATE}   sub="per session" />
          </div>

          {/* Outcome breakdown */}
          <div className="mt-3">
            <div className="text-[.62rem] font-black uppercase tracking-[.06em] text-slate-500 mb-1">Outcome Breakdown</div>
            <div className="flex h-6 w-full overflow-hidden rounded-full bg-slate-100">
              {stats.complete > 0 && (
                <div style={{ width: `${(stats.complete / Math.max(1, stats.closedSessions)) * 100}%`, background: GREEN }} title={`Complete: ${stats.complete}`} />
              )}
              {stats.stop > 0 && (
                <div style={{ width: `${(stats.stop / Math.max(1, stats.closedSessions)) * 100}%`, background: AMBER }} title={`Stop: ${stats.stop}`} />
              )}
              {stats.issue > 0 && (
                <div style={{ width: `${(stats.issue / Math.max(1, stats.closedSessions)) * 100}%`, background: RED }} title={`Issue: ${stats.issue}`} />
              )}
            </div>
            <div className="mt-1 flex gap-3 text-[.66rem] font-bold">
              <span style={{ color: GREEN }}>● Complete {stats.complete}</span>
              <span style={{ color: AMBER }}>● Stop {stats.stop}</span>
              <span style={{ color: RED }}>● Issue {stats.issue}</span>
            </div>
          </div>

          {/* Weekday distribution */}
          <div className="mt-4">
            <div className="text-[.62rem] font-black uppercase tracking-[.06em] text-slate-500 mb-2">Sessions by Day of Week</div>
            <WeekdayBars perWeekday={stats.perWeekday} />
          </div>
        </div>

        {/* Recent sessions */}
        <div>
          <div className="text-xs font-black uppercase tracking-[.08em] text-slate-500 mb-2">Recent Sessions</div>
          {recentSessions.length === 0 ? (
            <div className="text-sm font-bold text-slate-400 text-center py-4">No site sessions in last 30 days</div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {recentSessions.slice(0, 25).map(s => (
                <div key={s.sessionId} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 text-xs">
                  <div className="flex flex-col">
                    <span className="font-black" style={{ color: ACE_BLUE }}>{s.site_code || '—'}</span>
                    <span className="text-[.66rem] font-bold text-slate-400">{fmtDate(s.clock_in_at)} · {fmtHourMin(s.clock_in_at)}–{fmtHourMin(s.clock_out_at)}</span>
                  </div>
                  <OutcomeBadge outcome={s.outcome} clockType={s.clockType} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function computeDteStats(sessions) {
  // Only PER_SITE sessions with completed clock
  const perSite = sessions.filter(s => s.clockType !== 'DAILY')
  const closed  = perSite.filter(s => s.clock_in_at && s.clock_out_at)
  const complete = closed.filter(s => s.outcome === 'COMPLETE' || s.outcome === 'COMPLETED').length
  const stop     = closed.filter(s => s.outcome === 'STOP').length
  const issue    = closed.filter(s => s.outcome === 'ISSUE').length
  const ongoing  = perSite.filter(s => !s.clock_out_at).length

  const durations = closed
    .map(s => new Date(s.clock_out_at).getTime() - new Date(s.clock_in_at).getTime())
    .filter(d => Number.isFinite(d) && d > 0)
  const totalMs = durations.reduce((a, b) => a + b, 0)
  const avgMs   = durations.length ? totalMs / durations.length : 0

  const distinctSites = new Set(perSite.map(s => s.site_code).filter(Boolean))
  const daysActive    = new Set(perSite.map(s => (s.clock_in_at || '').slice(0, 10)).filter(Boolean))
  const completionRate = closed.length ? Math.round((complete / closed.length) * 100) : 0

  // Sessions per weekday (0=Sun..6=Sat) for mini bar chart
  const perWeekday = [0, 0, 0, 0, 0, 0, 0]
  perSite.forEach(s => {
    if (!s.clock_in_at) return
    const d = new Date(s.clock_in_at).getDay()
    perWeekday[d]++
  })

  return {
    totalSessions: perSite.length,
    closedSessions: closed.length,
    complete, stop, issue, ongoing,
    distinctSites: distinctSites.size,
    daysActive: daysActive.size,
    avgDurationMs: avgMs,
    totalHours: Math.round((totalMs / 3600000) * 10) / 10,
    completionRate,
    perWeekday,
  }
}

function StatChip({ label, value, tone = ACE_BLUE, sub }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="text-[.62rem] font-black uppercase tracking-[.06em] text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-black" style={{ color: tone }}>{value}</div>
      {sub && <div className="text-[.62rem] font-bold text-slate-400">{sub}</div>}
    </div>
  )
}

function WeekdayBars({ perWeekday }) {
  const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const max = Math.max(1, ...perWeekday)
  return (
    <div className="flex items-end gap-2 h-20">
      {perWeekday.map((v, i) => {
        const h = (v / max) * 100
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div className="w-full flex-1 flex items-end">
              <div
                className="w-full rounded-t-md"
                style={{ height: `${h}%`, background: v ? ACE_BLUE : '#e2e8f0', minHeight: 2 }}
                title={`${labels[i]}: ${v}`}
              />
            </div>
            <div className="text-[.6rem] font-black text-slate-400">{labels[i]}</div>
            <div className="text-[.62rem] font-bold text-slate-700">{v}</div>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Plan DTE — combined map: DTE home bases (blue) + unplanned sites (amber/purple)
// ─────────────────────────────────────────────────────────────────────────
function PlanDteMap() {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const dteLayer = useRef(null)
  const siteLayer = useRef(null)
  const [dtes, setDtes] = useState([])
  const [sites, setSites] = useState([])
  const [pos, setPos] = useState([])
  const [showDte, setShowDte] = useState(true)
  const [showSsv, setShowSsv] = useState(true)
  const [showPac, setShowPac] = useState(true)
  const [selectedDteCodes, setSelectedDteCodes] = useState(null)  // null = all
  const [ready, setReady] = useState(!!window.L)

  function toggleDte(code) {
    setSelectedDteCodes(prev => {
      const base = prev || new Set(dtes.map(d => d.employee_code))
      const next = new Set(base)
      if (next.has(code)) next.delete(code); else next.add(code)
      return next
    })
  }
  function selectAllDte() { setSelectedDteCodes(null) }
  function selectNoneDte() { setSelectedDteCodes(new Set()) }
  const isDteSelected = code => selectedDteCodes === null || selectedDteCodes.has(code)

  useEffect(() => {
    Promise.all([
      apiFetch('/api/employees?project_team=RF&status=ACTIVE').then(r => r.json()).catch(() => ({ data: [] })),
      apiFetch('/api/sites?referenced_only=true').then(r => r.json()).catch(() => ({ data: [] })),
      apiFetch('/api/project-pos').then(r => r.json()).catch(() => ({ data: [] })),
    ]).then(([empRes, sitesRes, posRes]) => {
      const isPerSite = e => String(e.contract_type || '').toLowerCase() === 'subcontractor per-site' ||
        (String(e.clock_type || '').toUpperCase() === 'PER_SITE' && !String(e.position || '').toLowerCase().includes('analysis'))
      setDtes((empRes.data || []).filter(isPerSite))
      setSites(sitesRes.data || [])
      setPos(posRes.data || [])
    })
  }, [])

  useEffect(() => {
    if (window.L) { setReady(true); return }
    const t = setInterval(() => { if (window.L) { clearInterval(t); setReady(true) } }, 100)
    setTimeout(() => clearInterval(t), 8000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!ready || !mapRef.current || mapInstance.current) return
    const L = window.L
    const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OSM' }).addTo(map)
    map.setView([13.7563, 100.5018], 7)
    mapInstance.current = map
    dteLayer.current = L.layerGroup().addTo(map)
    siteLayer.current = L.layerGroup().addTo(map)
    const handleResize = () => map.invalidateSize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [ready])

  const unplannedSites = useMemo(() => {
    const siteByCode = {}
    sites.forEach(s => { if (s.site_code) siteByCode[s.site_code.toUpperCase()] = s })
    const seen = new Set()
    const out = []
    pos.forEach(p => {
      if (p.planned_dte_codes) return
      const siteKey = String(p.site_code || (p.cluster_site || '').split('_')[0] || '').toUpperCase()
      if (!siteKey || seen.has(siteKey)) return
      const s = siteByCode[siteKey]
      if (!s || s.lat == null || s.lng == null) return
      seen.add(siteKey)
      out.push({ ...s, work_type: p.work_type })
    })
    return out
  }, [pos, sites])

  useEffect(() => {
    if (!mapInstance.current || !window.L) return
    const L = window.L
    dteLayer.current.clearLayers()
    siteLayer.current.clearLayers()
    const bounds = []
    if (showDte) {
      dtes.forEach(d => {
        if (d.base_lat == null || d.base_lng == null) return
        if (!isDteSelected(d.employee_code)) return
        const init = (d.full_name || d.employee_code).split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase()
        // 10km coverage circle
        L.circle([d.base_lat, d.base_lng], {
          radius: 10000,
          color: ACE_BLUE,
          weight: 1.5,
          fillColor: ACE_BLUE,
          fillOpacity: 0.08,
          dashArray: '4 4',
        }).bindTooltip(`${d.full_name || d.employee_code} · 10km radius`, { sticky: true }).addTo(dteLayer.current)
        const icon = L.divIcon({
          className: '',
          html: `<div style="background:${ACE_BLUE};color:#fff;border:2px solid #fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;box-shadow:0 3px 8px rgba(0,0,0,.3)">${init}</div>`,
          iconSize: [34, 34], iconAnchor: [17, 17],
        })
        L.marker([d.base_lat, d.base_lng], { icon }).bindPopup(
          `<div style="min-width:180px;font-family:system-ui"><b style="color:${ACE_BLUE}">${d.full_name}</b><br/><span style="font-family:monospace;font-size:11px;color:#94a3b8">${d.employee_code}</span><br/><span style="font-size:11px;color:#475569;margin-top:4px;display:inline-block">📍 ${d.address || '—'}</span><br/><span style="font-size:11px;color:${ACE_BLUE};font-weight:700;margin-top:4px;display:inline-block">⊙ 10km coverage</span></div>`
        ).addTo(dteLayer.current)
        // Extend bounds to include the circle's edge (~10km in lat ≈ 0.09 deg)
        const dLat = 10 / 111
        const dLng = 10 / (111 * Math.cos(d.base_lat * Math.PI / 180))
        bounds.push([d.base_lat - dLat, d.base_lng - dLng])
        bounds.push([d.base_lat + dLat, d.base_lng + dLng])
      })
    }
    unplannedSites.forEach(s => {
      const wt = (s.work_type || '').toUpperCase()
      if (wt === 'SSV' && !showSsv) return
      if (wt === 'PAC' && !showPac) return
      if (wt !== 'SSV' && wt !== 'PAC') return  // skip unknown types
      const color = wt === 'PAC' ? PURPLE : AMBER
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:${color};color:#fff;border:2px solid #fff;border-radius:4px;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900">${wt}</div>`,
        iconSize: [18, 18], iconAnchor: [9, 9],
      })
      L.marker([s.lat, s.lng], { icon }).bindPopup(
        `<div style="min-width:180px;font-family:system-ui"><b style="color:${color}">${s.site_code}</b> · <span style="font-size:10px;color:#94a3b8">${wt}</span><br/>${s.site_name || ''}<br/><span style="font-size:10px;color:#94a3b8">Cluster: ${s.rf_cluster_name || '—'}</span><br/><span style="font-size:10px;color:${AMBER};font-weight:700">⚠ Unplanned</span></div>`
      ).addTo(siteLayer.current)
      bounds.push([s.lat, s.lng])
    })
    if (bounds.length) {
      try { mapInstance.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 11 }) } catch {}
    }
  }, [dtes, unplannedSites, showDte, showSsv, showPac, selectedDteCodes, ready])

  const dteWithGps = dtes.filter(d => d.base_lat != null).length
  const ssvCount = unplannedSites.filter(s => (s.work_type || '').toUpperCase() === 'SSV').length
  const pacCount = unplannedSites.filter(s => (s.work_type || '').toUpperCase() === 'PAC').length

  const visibleDteCount = dtes.filter(d => d.base_lat != null && isDteSelected(d.employee_code)).length

  return (
    <Card className="overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <div className="text-xs font-black uppercase tracking-[.08em] text-slate-500">Plan DTE — Map</div>
        <h3 className="mt-1 text-base font-black text-slate-950">
          {visibleDteCount}/{dteWithGps} engineers · {ssvCount + pacCount} unplanned sites
        </h3>
      </div>
      <div className="relative">
        <div ref={mapRef} style={{ width: '100%', height: 480, background: '#e2e8f0' }} />

        {/* Floating filter panel — top-right overlay */}
        <div
          className="absolute top-3 right-3 max-h-[440px] w-64 overflow-auto rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur-sm"
          style={{ zIndex: 500 }}
        >
          {/* Type filters */}
          <div className="text-[.62rem] font-black uppercase tracking-[.06em] text-slate-500 mb-2">Layers</div>
          <div className="flex flex-col gap-1.5">
            <label className="inline-flex items-center gap-2 cursor-pointer rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-black text-blue-700">
              <input type="checkbox" checked={showDte} onChange={e => setShowDte(e.target.checked)} className="accent-blue-600" />
              <span className="h-3 w-3 rounded-full" style={{ background: ACE_BLUE }} />
              DTE ({dteWithGps})
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer rounded-md bg-amber-50 px-2.5 py-1.5 text-xs font-black text-amber-700">
              <input type="checkbox" checked={showSsv} onChange={e => setShowSsv(e.target.checked)} className="accent-amber-600" />
              <span className="h-3 w-3 rounded-sm" style={{ background: AMBER }} />
              SSV ({ssvCount})
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer rounded-md bg-purple-50 px-2.5 py-1.5 text-xs font-black text-purple-700">
              <input type="checkbox" checked={showPac} onChange={e => setShowPac(e.target.checked)} className="accent-purple-600" />
              <span className="h-3 w-3 rounded-sm" style={{ background: PURPLE }} />
              PAC ({pacCount})
            </label>
          </div>

          {/* DTE individual checkboxes */}
          {showDte && dtes.length > 0 && (
            <>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-[.62rem] font-black uppercase tracking-[.06em] text-slate-500">DTE Engineers</span>
                <div className="flex gap-1">
                  <button onClick={selectAllDte} className="rounded bg-slate-100 px-1.5 py-0.5 text-[.6rem] font-black text-slate-600 hover:bg-slate-200">All</button>
                  <button onClick={selectNoneDte} className="rounded bg-slate-100 px-1.5 py-0.5 text-[.6rem] font-black text-slate-600 hover:bg-slate-200">None</button>
                </div>
              </div>
              <div className="mt-1.5 flex flex-col gap-1">
                {dtes.filter(d => d.base_lat != null).map(d => {
                  const init = (d.full_name || d.employee_code).split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase()
                  const checked = isDteSelected(d.employee_code)
                  return (
                    <label key={d.employee_code} className={`inline-flex items-center gap-2 cursor-pointer rounded-md px-2 py-1 text-[.72rem] ${checked ? 'bg-blue-50' : 'bg-slate-50'}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleDte(d.employee_code)} className="accent-blue-600" />
                      <span className="flex h-5 w-5 items-center justify-center rounded-full text-white text-[.6rem] font-black" style={{ background: checked ? ACE_BLUE : '#cbd5e1' }}>
                        {init}
                      </span>
                      <span className="truncate font-bold text-slate-700">{d.full_name || d.employee_code}</span>
                    </label>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}

function DTEHomeMap({ dtes, onSelectDte }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const layerRef = useRef(null)
  const [ready, setReady] = useState(!!window.L)

  useEffect(() => {
    if (window.L) { setReady(true); return }
    const t = setInterval(() => { if (window.L) { clearInterval(t); setReady(true) } }, 100)
    setTimeout(() => clearInterval(t), 8000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!ready || !mapRef.current || mapInstance.current) return
    const L = window.L
    const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OSM' }).addTo(map)
    map.setView([13.7563, 100.5018], 8)
    mapInstance.current = map
    layerRef.current = L.layerGroup().addTo(map)
    // Re-fit map when window resizes (e.g., drawer opens and shrinks content)
    const handleResize = () => map.invalidateSize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [ready])

  useEffect(() => {
    if (!mapInstance.current || !layerRef.current || !window.L) return
    const L = window.L
    const layer = layerRef.current
    layer.clearLayers()
    const bounds = []
    dtes.forEach(d => {
      if (d.base_lat == null || d.base_lng == null) return
      const initials = (d.full_name || d.employee_code || '?').split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase()
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:${ACE_BLUE};color:#fff;border:2px solid #fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;box-shadow:0 3px 8px rgba(0,0,0,.3);cursor:pointer">${initials}</div>`,
        iconSize: [32, 32], iconAnchor: [16, 16],
      })
      const popup = `
        <div style="min-width:200px;font-family:system-ui,sans-serif">
          <div style="font-weight:900;color:${ACE_BLUE};font-size:13px">${d.full_name || d.employee_code}</div>
          <div style="font-family:monospace;font-size:11px;color:#94a3b8">${d.employee_code}</div>
          ${d.address ? `<div style="margin-top:6px;font-size:11px;color:#475569">📍 ${d.address}</div>` : ''}
        </div>
      `
      const marker = L.marker([d.base_lat, d.base_lng], { icon }).bindPopup(popup)
      marker.on('click', () => onSelectDte && onSelectDte(d))
      marker.addTo(layer)
      bounds.push([d.base_lat, d.base_lng])
    })
    if (bounds.length) {
      try { mapInstance.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 11 }) } catch {}
    }
  }, [dtes, ready, onSelectDte])

  const withGps = dtes.filter(d => d.base_lat != null).length
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-5 border-b border-slate-100">
        <div>
          <div className="text-xs font-black uppercase tracking-[.08em] text-slate-500">DTE Home Locations</div>
          <h3 className="mt-1 text-base font-black text-slate-950">
            {withGps} of {dtes.length} engineers on map
          </h3>
        </div>
        <div className="text-xs font-bold text-slate-400">click marker → open profile</div>
      </div>
      <div ref={mapRef} style={{ width: '100%', height: 360, background: '#e2e8f0' }} />
    </Card>
  )
}

function DTEListPage() {
  const [dtes, setDtes] = useState([])
  const [sessions, setSessions] = useState([])
  const [pos, setPos] = useState([])
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')
  const [openDte, setOpenDte] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const today = new Date()
      const monthAgo = new Date(today.getTime() - 30 * 86400000)
      const from = monthAgo.toISOString().slice(0, 10)
      const to = today.toISOString().slice(0, 10)
      const [empRes, evtRes, posRes] = await Promise.all([
        apiFetch('/api/employees?project_team=RF&status=ACTIVE').then(r => r.json()),
        apiFetch(`/api/clock/monitor/events?date_from=${from}&date_to=${to}`).then(r => r.json()),
        apiFetch('/api/project-pos').then(r => r.json()).catch(() => ({ data: [] })),
      ])
      // ONLY Subcontractor Per-Site DTE engineers
      const isDtePerSite = e => {
        const contract = String(e.contract_type || '').toLowerCase()
        if (contract === 'subcontractor per-site') return true
        const ct = String(e.clock_type || '').toUpperCase()
        if (ct === 'PER_SITE') {
          const pos = String(e.position || e.job_title || '').toLowerCase()
          if (pos.includes('analysis')) return false
          return true
        }
        return false
      }
      const list = (empRes.data || [])
        .filter(isDtePerSite)
        .sort((a, b) => String(a.full_name || '').localeCompare(String(b.full_name || ''), 'en'))
      setDtes(list)
      setSessions(pairEventsToSessions(evtRes.events || []))
      setPos(posRes.data || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Workload per DTE = count of POs where planned_dte_codes contains employee_code and not done
  const workloadByDte = useMemo(() => {
    const m = {}
    pos.forEach(p => {
      if (p.approved_at) return  // already done
      const codes = String(p.planned_dte_codes || '').split(',').map(c => c.trim()).filter(Boolean)
      codes.forEach(c => { m[c] = (m[c] || 0) + 1 })
    })
    return m
  }, [pos])

  const sessionsByDte = useMemo(() => {
    const m = {}
    sessions.filter(s => s.clockType !== 'DAILY').forEach(s => {
      if (!m[s.employeeCode]) m[s.employeeCode] = []
      m[s.employeeCode].push(s)
    })
    return m
  }, [sessions])

  const statsByDte = useMemo(() => {
    const out = {}
    Object.entries(sessionsByDte).forEach(([code, ss]) => {
      out[code] = computeDteStats(ss)
    })
    return out
  }, [sessionsByDte])

  const emptyStats = useMemo(() => computeDteStats([]), [])

  const filtered = useMemo(() => {
    const ql = q.toLowerCase()
    if (!ql) return dtes
    return dtes.filter(d =>
      (d.full_name || '').toLowerCase().includes(ql) ||
      (d.employee_code || '').toLowerCase().includes(ql) ||
      (d.email || '').toLowerCase().includes(ql)
    )
  }, [dtes, q])

  const stats = useMemo(() => {
    const total = dtes.length
    const active = dtes.filter(d => (workloadByDte[d.employee_code] || 0) > 0).length
    const overload = dtes.filter(d => (workloadByDte[d.employee_code] || 0) >= 10).length
    const idle = total - active
    // Aggregate testing stats
    let totalSessions = 0, totalHours = 0, totalComplete = 0, totalClosed = 0, totalSites = 0
    dtes.forEach(d => {
      const s = statsByDte[d.employee_code] || emptyStats
      totalSessions += s.totalSessions
      totalHours    += s.totalHours
      totalComplete += s.complete
      totalClosed   += s.closedSessions
      totalSites    += s.distinctSites
    })
    const teamCompletionRate = totalClosed ? Math.round((totalComplete / totalClosed) * 100) : 0
    return { total, active, overload, idle, totalSessions, totalHours: Math.round(totalHours), totalSites, teamCompletionRate }
  }, [dtes, workloadByDte, statsByDte, emptyStats])

  // Re-fit the map when drawer opens/closes so leaflet re-measures container width
  useEffect(() => {
    setTimeout(() => { window.dispatchEvent(new Event('resize')) }, 250)
  }, [openDte])

  return (
    <div
      className="flex flex-col gap-6 transition-all duration-200"
      style={{ paddingRight: openDte ? 540 : 0 }}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
            <Home size={14} />
            {COMPANY} · DTE Engineers
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-normal text-slate-950 sm:text-4xl">
            DTE Details
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
            Drive Test Engineer profiles, current workload, and recent site activity.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <Search size={14} className="text-slate-400" />
          <input
            placeholder="Search name / code / email…"
            value={q}
            onChange={e => setQ(e.target.value)}
            className="border-0 bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400"
            style={{ width: 240 }}
          />
        </div>
      </div>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total DTE"    value={stats.total}    helper="active engineers" tone={ACE_BLUE} icon={Users} />
        <StatCard label="Working"      value={stats.active}   helper="≥1 PO assigned"   tone={GREEN}    icon={Briefcase} />
        <StatCard label="Idle"         value={stats.idle}     helper="no assignments"   tone={SLATE}    icon={UserCircle} />
        <StatCard label="Overloaded"   value={stats.overload} helper="≥10 PO"           tone={AMBER}    icon={AlertOctagon} />
      </section>

      {/* Team testing statistics — last 30 days */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Sessions"    value={stats.totalSessions}      helper="last 30d"      tone={ACE_BLUE} icon={Activity} />
        <StatCard label="Sites Tested"      value={stats.totalSites}         helper="distinct sites" tone={PURPLE}   icon={LayoutGrid} />
        <StatCard label="Team Completion"   value={`${stats.teamCompletionRate}%`} helper="avg across DTE" tone={GREEN}    icon={CheckCircle2} />
        <StatCard label="Hours Logged"      value={`${stats.totalHours}h`}   helper="on-site time"   tone={AMBER}    icon={Clock} />
      </section>

      {/* Home locations map — for planning */}
      {dtes.filter(d => d.base_lat != null).length > 0 && (
        <DTEHomeMap dtes={filtered} onSelectDte={setOpenDte} />
      )}

      <div className="text-xs font-bold text-slate-400">
        {filtered.length} engineer{filtered.length === 1 ? '' : 's'} {loading && '· loading…'}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-sm font-bold text-slate-400">No DTE engineers found</Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(d => {
            const wl = workloadByDte[d.employee_code] || 0
            const st = statsByDte[d.employee_code] || emptyStats
            return (
              <DTECard key={d.employee_code} dte={d} workload={wl} stats={st} onOpen={setOpenDte} />
            )
          })}
        </div>
      )}

      {openDte && (
        <DTEDetailDrawer
          dte={openDte}
          workload={workloadByDte[openDte.employee_code] || 0}
          recentSessions={sessionsByDte[openDte.employee_code] || []}
          stats={statsByDte[openDte.employee_code] || emptyStats}
          onClose={() => setOpenDte(null)}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Daily DT activity log — pairs clock-in / clock-out events into sessions
// ─────────────────────────────────────────────────────────────────────────
function pairEventsToSessions(events) {
  const map = {}
  events.forEach(e => {
    const id = e.sessionId
    if (!map[id]) {
      map[id] = {
        sessionId: id, employeeCode: e.employeeCode, name: e.name, email: e.email,
        team: e.team, role: e.role, clockType: e.clockType,
        site_code: e.clockType !== 'DAILY' ? e.projectCode : null,
        site_name: e.job, project: e.projectCode,
        clock_in_at: null, clock_out_at: null,
        lat: null, lng: null,
        outcome: null,
      }
    }
    const s = map[id]
    if (e.status === 'Clock In' || e.status === 'Start Work') {
      s.clock_in_at = e.time
      if (e.lat != null && e.lng != null) { s.lat = e.lat; s.lng = e.lng }
    } else {
      s.clock_out_at = e.time
      s.outcome = e.status === 'Clock Out' ? 'COMPLETE' : e.status.toUpperCase()
      if (s.lat == null && e.lat != null) { s.lat = e.lat; s.lng = e.lng }
    }
  })
  return Object.values(map)
}

function fmtHourMin(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toTimeString().slice(0, 5)
}

function OutcomeBadge({ outcome, clockType }) {
  if (!outcome) {
    return <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[.62rem] font-black text-amber-700">In Progress</span>
  }
  const map = {
    COMPLETE: { bg: 'bg-emerald-50', fg: 'text-emerald-700', label: clockType === 'DAILY' ? 'Complete' : 'Site Done' },
    COMPLETED:{ bg: 'bg-emerald-50', fg: 'text-emerald-700', label: 'Complete' },
    STOP:     { bg: 'bg-amber-50',   fg: 'text-amber-700',   label: 'Stop' },
    ISSUE:    { bg: 'bg-red-50',     fg: 'text-red-700',     label: 'Issue' },
  }
  const c = map[outcome] || { bg: 'bg-slate-50', fg: 'text-slate-700', label: outcome }
  return <span className={`rounded-full ${c.bg} ${c.fg} px-2 py-0.5 text-[.62rem] font-black`}>{c.label}</span>
}

function DailyMap({ sessions }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const layerRef = useRef(null)
  const [ready, setReady] = useState(!!window.L)

  useEffect(() => {
    if (window.L) { setReady(true); return }
    const t = setInterval(() => { if (window.L) { clearInterval(t); setReady(true) } }, 100)
    setTimeout(() => clearInterval(t), 8000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!ready || !mapRef.current || mapInstance.current) return
    const L = window.L
    const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '© OpenStreetMap',
    }).addTo(map)
    map.setView([13.7563, 100.5018], 6) // Thailand center
    mapInstance.current = map
    layerRef.current = L.layerGroup().addTo(map)
  }, [ready])

  useEffect(() => {
    if (!mapInstance.current || !layerRef.current || !window.L) return
    const L = window.L
    const layer = layerRef.current
    layer.clearLayers()

    const outcomeColor = (o) => {
      if (o === 'COMPLETE' || o === 'COMPLETED') return GREEN
      if (o === 'STOP') return AMBER
      if (o === 'ISSUE') return RED
      return ACE_BLUE  // in progress
    }
    const outcomeLabel = (o) => {
      if (o === 'COMPLETE' || o === 'COMPLETED') return 'Site Done'
      if (o === 'STOP') return 'Stop'
      if (o === 'ISSUE') return 'Issue'
      return 'In Progress'
    }

    const bounds = []
    sessions.forEach(s => {
      if (s.lat == null || s.lng == null) return
      const color = outcomeColor(s.outcome)
      const icon = L.divIcon({
        className: 'ace-daily-pin',
        html: `<div style="background:${color};color:#fff;border:2px solid #fff;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;box-shadow:0 2px 6px rgba(0,0,0,.3)">${(s.name || '?').charAt(0).toUpperCase()}</div>`,
        iconSize: [26, 26], iconAnchor: [13, 13],
      })
      const popup = `
        <div style="min-width:220px;font-family:system-ui,sans-serif">
          <div style="font-weight:900;color:${ACE_BLUE};font-size:13px">${s.site_code || '—'}</div>
          ${s.site_name ? `<div style="font-size:11px;color:#64748b">${s.site_name}</div>` : ''}
          <div style="margin-top:6px;font-size:11px">
            <b>${s.name || '—'}</b> <span style="color:#94a3b8;font-family:monospace">(${s.employeeCode})</span>
          </div>
          <div style="margin-top:4px;font-size:11px;color:#475569">
            ${fmtHourMin(s.clock_in_at)} – ${fmtHourMin(s.clock_out_at)}
            ${fmtDuration(s.clock_in_at, s.clock_out_at) ? ` · <b>${fmtDuration(s.clock_in_at, s.clock_out_at)}</b>` : ''}
          </div>
          <div style="margin-top:6px"><span style="background:${color};color:#fff;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:900">${outcomeLabel(s.outcome)}</span></div>
          ${s.team ? `<div style="margin-top:4px;font-size:10px;color:#64748b">Team: ${s.team}</div>` : ''}
        </div>
      `
      L.marker([s.lat, s.lng], { icon }).bindPopup(popup).addTo(layer)
      bounds.push([s.lat, s.lng])
    })

    if (bounds.length) {
      try { mapInstance.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 }) } catch {}
    }
  }, [sessions, ready])

  const counts = useMemo(() => {
    const m = { COMPLETE: 0, STOP: 0, ISSUE: 0, IN_PROGRESS: 0, NO_GPS: 0 }
    sessions.forEach(s => {
      if (s.lat == null) { m.NO_GPS++; return }
      if (s.outcome === 'COMPLETE' || s.outcome === 'COMPLETED') m.COMPLETE++
      else if (s.outcome === 'STOP') m.STOP++
      else if (s.outcome === 'ISSUE') m.ISSUE++
      else m.IN_PROGRESS++
    })
    return m
  }, [sessions])

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.08em] text-slate-500">
            <MapIcon size={14} /> Daily Test Map
          </div>
          <h3 className="mt-1 text-base font-black text-slate-950">
            {sessions.filter(s => s.lat != null).length} site{sessions.length === 1 ? '' : 's'} on map
            {counts.NO_GPS > 0 && <span className="ml-2 text-xs font-bold text-slate-400">(+{counts.NO_GPS} without GPS)</span>}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2 text-[.66rem] font-black">
          <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-1">● Done {counts.COMPLETE}</span>
          <span className="rounded-full bg-amber-50  text-amber-700  px-2 py-1">● Stop {counts.STOP}</span>
          <span className="rounded-full bg-red-50    text-red-700    px-2 py-1">● Issue {counts.ISSUE}</span>
          <span className="rounded-full bg-blue-50   text-blue-700   px-2 py-1">● In Progress {counts.IN_PROGRESS}</span>
        </div>
      </div>
      <div ref={mapRef} style={{ width: '100%', height: 460, background: '#e2e8f0' }} />
    </Card>
  )
}

function DailyPage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')
  const [outcomeFilter, setOutcomeFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/clock/monitor/events?date_from=${date}&date_to=${date}`).then(r => r.json())
      setSessions(pairEventsToSessions(res.events || []))
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => { load() }, [load])

  // Daily DT Activity shows site-testing only. Hide:
  //  - DAILY office clock-ins (clockType === 'DAILY')
  //  - PER_SITE rows where site_code equals the project_team (e.g. "RF") — placeholder/erroneous entries,
  //    not real DU/cluster site tests. Counted separately as `nonSite`.
  function _isRealSiteTest(s) {
    if (s.clockType === 'DAILY') return false
    if (!s.site_code) return false
    const sc = String(s.site_code).trim().toUpperCase()
    const team = String(s.team || '').trim().toUpperCase()
    if (sc === team) return false       // DTE entered team code as site
    return true
  }
  const perSite = useMemo(() => sessions.filter(_isRealSiteTest), [sessions])
  const daily   = useMemo(() => sessions.filter(s => s.clockType === 'DAILY'), [sessions])
  const nonSite = useMemo(() => sessions.filter(s => s.clockType !== 'DAILY' && !_isRealSiteTest(s)), [sessions])

  const filteredPerSite = useMemo(() => {
    const ql = q.toLowerCase()
    return perSite.filter(s => {
      if (outcomeFilter === 'IN_PROGRESS' && s.outcome) return false
      if (outcomeFilter && outcomeFilter !== 'IN_PROGRESS' && s.outcome !== outcomeFilter) return false
      if (ql && !(`${s.site_code || ''} ${s.site_name || ''} ${s.name || ''} ${s.employeeCode || ''}`.toLowerCase().includes(ql))) return false
      return true
    })
  }, [perSite, q, outcomeFilter])

  const stats = useMemo(() => {
    const uniqueSites = new Set(perSite.map(s => s.site_code).filter(Boolean))
    const uniqueDtes  = new Set(perSite.map(s => s.employeeCode).filter(Boolean))
    return {
      sitesTested: uniqueSites.size,
      activeDtes:  uniqueDtes.size,
      complete:    perSite.filter(s => s.outcome === 'COMPLETE' || s.outcome === 'COMPLETED').length,
      issues:      perSite.filter(s => s.outcome === 'ISSUE' || s.outcome === 'STOP').length,
      dailyClockins: daily.length,
    }
  }, [perSite, daily])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
            <Home size={14} />
            {COMPANY} · Daily DT Log
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-normal text-slate-950 sm:text-4xl">
            Daily DT Activity
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
            Who tested which site today. Sites that finish here flow into SSV / PAC Pre-Site.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 shadow-sm">
            <CalendarDays size={17} style={{ color: ACE_RED }} />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border-0 bg-transparent outline-none" />
          </div>
          <button
            onClick={() => setDate(new Date().toISOString().slice(0, 10))}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            Today
          </button>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Sites Tested" value={stats.sitesTested}  helper="distinct sites" tone={ACE_BLUE} icon={LayoutGrid} />
        <StatCard label="Active DTEs"  value={stats.activeDtes}   helper="engineers in field" tone={PURPLE}   icon={Users} />
        <StatCard label="Site Done"    value={stats.complete}     helper="outcome = COMPLETE" tone={GREEN}    icon={CheckCircle2} />
        <StatCard label="Issues/Stop"  value={stats.issues}       helper="needs attention" tone={RED}      icon={AlertCircle} />
        <StatCard label="Daily Clock-in" value={stats.dailyClockins} helper="office/non-site"  tone={SLATE}    icon={LogIn} />
      </section>

      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-[.08em] text-slate-500">Outcome</span>
            <select value={outcomeFilter} onChange={e => setOutcomeFilter(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-blue-300">
              <option value="">All</option>
              <option value="COMPLETE">Site Done</option>
              <option value="STOP">Stop</option>
              <option value="ISSUE">Issue</option>
              <option value="IN_PROGRESS">In Progress</option>
            </select>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Search size={14} className="text-slate-400" />
            <input
              placeholder="Site / DTE / name…"
              value={q}
              onChange={e => setQ(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-blue-300"
            />
          </div>
          <span className="text-xs font-bold text-slate-400">{filteredPerSite.length} per-site sessions {loading && '· loading…'}</span>
        </div>
      </Card>

      {filteredPerSite.length > 0 && <DailyMap sessions={filteredPerSite} />}

      {filteredPerSite.length === 0 ? (
        <Card className="p-10 text-center text-sm font-bold text-slate-400">No PER_SITE sessions on this date</Card>
      ) : (
        <Card className="overflow-hidden">
          <div style={{ overflowX: 'auto' }}>
            <table className="w-full border-collapse text-[.78rem]">
              <thead className="bg-slate-50">
                <tr>
                  {['#', 'Site', 'DTE', 'Team', 'Clock In', 'Clock Out', 'Duration', 'Outcome', 'Pre-Site Sync'].map(h => (
                    <th key={h} className="border-b border-slate-200 px-3 py-2 text-left text-xs font-black uppercase tracking-[.04em] text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPerSite.map((s, i) => {
                  const dur = fmtDuration(s.clock_in_at, s.clock_out_at)
                  const isDone = s.outcome === 'COMPLETE' || s.outcome === 'COMPLETED'
                  return (
                    <tr key={s.sessionId} className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'} hover:bg-blue-50/40`}>
                      <td className="px-3 py-2 text-[.66rem] text-slate-300">{i + 1}</td>
                      <td className="px-3 py-2 font-black whitespace-nowrap" style={{ color: ACE_BLUE }}>
                        {s.site_code || '—'}
                        {s.site_name && <div className="text-[.62rem] font-bold text-slate-400">{s.site_name}</div>}
                      </td>
                      <td className="px-3 py-2 text-slate-700 whitespace-nowrap">
                        <div className="font-bold">{s.name}</div>
                        <div className="font-mono text-[.6rem] text-slate-400">{s.employeeCode}</div>
                      </td>
                      <td className="px-3 py-2 text-xs font-bold text-slate-500 whitespace-nowrap">{s.team || s.role || '—'}</td>
                      <td className="px-3 py-2 font-mono text-xs text-slate-600 whitespace-nowrap">{fmtHourMin(s.clock_in_at)}</td>
                      <td className="px-3 py-2 font-mono text-xs text-slate-600 whitespace-nowrap">{fmtHourMin(s.clock_out_at)}</td>
                      <td className="px-3 py-2 text-xs font-black whitespace-nowrap" style={{ color: AMBER }}>{dur || <span className="text-slate-300 font-normal">—</span>}</td>
                      <td className="px-3 py-2 whitespace-nowrap"><OutcomeBadge outcome={s.outcome} clockType={s.clockType} /></td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {isDone ? (
                          <span title="Auto-promoted to Pre-Site tracking on clock-out" className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[.62rem] font-black text-emerald-700">
                            <CheckCircle2 size={11} /> Auto
                          </span>
                        ) : s.outcome === 'STOP' || s.outcome === 'ISSUE' ? (
                          <span title="Email alert sent to PM" className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[.62rem] font-black text-red-700">
                            <Mail size={11} /> Alert
                          </span>
                        ) : (
                          <span className="text-[.62rem] text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {(daily.length > 0 || nonSite.length > 0) && (
        <div className="text-xs font-semibold text-slate-400 px-2">
          {daily.length > 0 && <>+ {daily.length} DAILY office clock-in (not site testing) — hidden</>}
          {daily.length > 0 && nonSite.length > 0 && <span className="mx-2">·</span>}
          {nonSite.length > 0 && <>+ {nonSite.length} PER_SITE w/ team-code (no DU) — hidden</>}
        </div>
      )}
    </div>
  )
}

// Download an uploaded report via authenticated fetch (JWT in header → blob).
// A plain <a href> won't include the Bearer token, so we fetch + trigger download.
async function downloadReport(trackingId, filename) {
  try {
    const res = await apiFetch(`/api/presite/tracking/${trackingId}/download-report`)
    if (!res.ok) {
      alert('ไม่สามารถดาวน์โหลดได้ (HTTP ' + res.status + ')')
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `report_${trackingId}.rar`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch {
    alert('เกิดข้อผิดพลาดในการดาวน์โหลด')
  }
}

function PreSiteTable({ rows, onOpen, viewType = 'SSV', posById = {}, posByClusterSite = {} }) {
  const isPac = viewType === 'PAC'
  if (!rows.length) {
    return <Card className="p-10"><EmptyState icon={ClipboardList} title="No tracking rows" desc="No PAC clusters or SSV sites are at this stage yet." /></Card>
  }
  // For PAC, tracking has no single po_id. Use O(1) cluster-site index instead of O(N) scan per row.
  const planForRow = (r) => {
    let p = r.po_id != null ? posById[r.po_id] : null
    if (!p && isPac && r.cluster_key) {
      p = posByClusterSite[String(r.cluster_key).toUpperCase()]
    }
    if (!p) return null
    return {
      startDate: p.planned_start_date,
      endDate: p.planned_end_date,
      duration: p.planned_duration_days,
    }
  }
  return (
    <Card className="overflow-hidden">
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.76rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {(isPac
                ? ['#', 'RF Cluster Name', 'DTE', 'Site Owner', 'Cluster Ready', 'DT Plan', 'Rounds', ...PAC_LATE_STAGES.map(s => s.label), 'Aging', '']
                : ['#', 'Site', 'DTE', STAGES[0].short, 'DT Plan', 'Site Status', 'Rounds', STAGES[1].short, STAGES[2].short, 'Duration', 'Layers', ...STAGES.slice(3).map(s => s.short), 'SLA', 'Rework', '']
              ).map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: SLATE, fontWeight: 700, borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const done = r.current_stage === 'ACE_APPROVED'
              const isPlan = r.__synthetic || r.current_stage === 'PLAN'
              // Background: done=green / plan=light blue / alternating
              const rowBg = done ? '#f0fdf4' : isPlan ? '#eff6ff' : (i % 2 === 0 ? '#fff' : '#fafbfc')
              return (
                <tr key={r.id} onClick={() => isPlan ? null : onOpen(r)} style={{ borderBottom: '1px solid #f1f5f9', cursor: isPlan ? 'default' : 'pointer', background: rowBg }}>
                  <td style={{ padding: '6px 10px', color: '#cbd5e1', fontSize: '.66rem' }}>{i + 1}</td>
                  <td style={{ padding: '6px 10px', fontWeight: 700, color: isPac ? PURPLE : ACE_BLUE, whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isPlan && (
                        <span style={{
                          fontSize: '.55rem', fontWeight: 900, padding: '2px 6px', borderRadius: 4,
                          background: '#dbeafe', color: '#1d4ed8', letterSpacing: '.04em',
                        }}>PLAN</span>
                      )}
                      <span>{isPac ? getClusterName(r) : (r.site_code || '—')}</span>
                    </div>
                    <div style={{ fontSize: '.62rem', color: '#94a3b8', fontWeight: 400 }}>
                      {isPac
                        ? `${r.site_code || '—'} · ${r.po_number} L${r.po_line}`
                        : `${r.po_number} L${r.po_line}`}
                    </div>
                  </td>
                  <td style={{ padding: '6px 10px', color: '#475569', whiteSpace: 'nowrap' }}>
                    {r.assigned_dte_name || <span style={{ color: '#cbd5e1' }}>—</span>}
                    {r.assigned_dte_code && (
                      <div style={{ fontSize: '.6rem', color: '#94a3b8', fontFamily: 'monospace' }}>{r.assigned_dte_code}</div>
                    )}
                  </td>
                  {isPac && (
                    <td style={{ padding: '5px 6px' }}>
                      <SiteOwnerBadge row={r} />
                    </td>
                  )}
                  <td style={{ padding: '5px 6px' }}>
                    <StageBadge stage={STAGES[0]} row={r} />
                  </td>
                  {/* 🆕 Plan Date column — DTE planned visit date + duration */}
                  <td style={{ padding: '6px 10px', whiteSpace: 'nowrap', fontSize: '.7rem' }}>
                    {(() => {
                      const plan = planForRow(r)
                      if (!plan || !plan.startDate) {
                        return <span style={{ color: '#cbd5e1', fontWeight: 400 }}>—</span>
                      }
                      return (
                        <div title={`Planned: ${plan.startDate}${plan.endDate && plan.endDate !== plan.startDate ? ` → ${plan.endDate}` : ''}\nDuration: ${plan.duration || '—'} day(s)`}>
                          <div style={{ fontWeight: 700, color: '#2447d8' }}>{plan.startDate}</div>
                          {plan.duration != null && (
                            <div style={{ fontSize: '.62rem', color: '#64748b' }}>⏱ {plan.duration}d</div>
                          )}
                        </div>
                      )
                    })()}
                  </td>
                  {!isPac && (
                    <td style={{ padding: '5px 6px' }}>
                      <SiteStatusBadge row={r} />
                    </td>
                  )}
                  {isPac ? (
                    <td style={{ padding: '5px 8px' }}>
                      <PacRoundsBadges row={r} />
                    </td>
                  ) : (
                    <>
                      <td style={{ padding: '5px 8px' }}>
                        <SsvRoundsBadges row={r} />
                      </td>
                      <td style={{ padding: '5px 6px' }}>
                        <StageBadge stage={STAGES[1]} row={r} />
                      </td>
                      <td style={{ padding: '5px 6px' }}>
                        <StageBadge stage={STAGES[2]} row={r} />
                      </td>
                      <td style={{ padding: '6px 10px', whiteSpace: 'nowrap', fontSize: '.72rem', fontWeight: 700, color: AMBER }}>
                        {fmtDuration(r.dt_started_at, r.dt_done_at) || <span style={{ color: '#cbd5e1', fontWeight: 400 }}>—</span>}
                      </td>
                    </>
                  )}
                  {!isPac && (
                    <td style={{ padding: '6px 10px', whiteSpace: 'nowrap' }}>
                      {getLayers(r) != null ? (
                        <span style={{
                          display: 'inline-block', padding: '3px 8px', borderRadius: 6,
                          background: '#eef2ff', color: '#4338ca',
                          fontSize: '.7rem', fontWeight: 700,
                        }}>{getLayers(r)} layers</span>
                      ) : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                  )}
                  {isPac
                    ? getPacLateStages(r).map(ls => (
                        <td key={ls.key} style={{ padding: '5px 6px' }}>
                          <PacLateStageBadge stage={ls} />
                        </td>
                      ))
                    : STAGES.slice(3).map(s => {
                        // Report cell — download the uploaded .rar if present
                        if (s.key === 'REPORT_DONE') {
                          const hasFile = r.has_report || r.report_file_path
                          const dlUrl = hasFile ? `/api/presite/tracking/${r.id}/download-report` : null
                          const sizeMb = r.report_file_size != null
                            ? (r.report_file_size / (1024 * 1024) >= 1
                                ? `${(r.report_file_size / (1024 * 1024)).toFixed(1)} MB`
                                : `${(r.report_file_size / 1024).toFixed(0)} KB`)
                            : ''
                          return (
                            <td key={s.key} style={{ padding: '5px 6px' }}>
                              {dlUrl ? (
                                <button
                                  type="button"
                                  onClick={e => { e.stopPropagation(); downloadReport(r.id, r.report_filename) }}
                                  className="inline-flex flex-col items-start gap-0.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 hover:bg-emerald-100 transition cursor-pointer"
                                  title={`Download ${r.report_filename || 'report.rar'}`}
                                >
                                  <span className="inline-flex items-center gap-1 text-[.68rem] font-black text-emerald-700">
                                    📎 <span className="underline">{r.report_uploaded_at ? fmtDate(r.report_uploaded_at) : 'report'}</span>
                                  </span>
                                  <span className="text-[.55rem] font-bold text-emerald-600">
                                    v{r.report_version || 1}{sizeMb ? ` · ${sizeMb}` : ''}
                                  </span>
                                </button>
                              ) : (
                                <StageBadge stage={s} row={r} />
                              )}
                            </td>
                          )
                        }
                        return (
                          <td key={s.key} style={{ padding: '5px 6px' }}>
                            <StageBadge stage={s} row={r} />
                          </td>
                        )
                      })}
                  <td style={{ padding: '6px 10px', whiteSpace: 'nowrap' }}>
                    {isPac ? <AgingIndicator row={r} /> : <SLAIndicator row={r} />}
                  </td>
                  {!isPac && (
                    <td style={{ padding: '6px 10px', whiteSpace: 'nowrap', fontSize: '.7rem', color: r.rework_count > 0 ? RED : '#cbd5e1', fontWeight: 700 }}>
                      {r.rework_count > 0 ? `×${r.rework_count}` : '—'}
                    </td>
                  )}
                  <td style={{ padding: '6px 10px' }}>
                    <ChevronRight size={16} color="#94a3b8" />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function extractSiteKey(s) {
  if (!s) return ''
  return String(s).split('_')[0].toUpperCase()
}

function StatusChip({ status }) {
  // Map workflow_status → UI Kit Badge tones (defined in ds.css)
  const s = String(status || '').toUpperCase()
  const toneMap = {
    NEW:              'slate',
    PENDING_SITE_MAP: 'amber',
    AUTO_MAPPED:      'blue',
    SITE_MAPPED:      'blue',
    PLANNED:          'purple',
    LEADER_CHECKING:  'amber',
    LEADER_APPROVED:  'green',
    WORK_DONE:        'green',
    CLOSED:           'slate',
  }
  return <Badge tone={toneMap[s] || 'slate'}>{s || '—'}</Badge>
}

function POTable({ rows }) {
  if (!rows.length) {
    return <Card className="p-10"><EmptyState icon={FileText} title="No PO lines" desc="No POs match this filter." /></Card>
  }
  return (
    <Card className="overflow-hidden">
      <div style={{ overflowX: 'auto' }}>
        <table className="w-full border-collapse text-[.78rem]">
          <thead className="bg-slate-50">
            <tr>
              {['#', 'PO Number', 'Line', 'Site', 'Cluster Site', 'Workflow Status', 'Planned DTE'].map(h => (
                <th key={h} className="border-b border-slate-200 px-3 py-2 text-left text-xs font-black uppercase tracking-[.04em] text-slate-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr key={p.id} className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'} hover:bg-blue-50/40`}>
                <td className="px-3 py-2 text-[.66rem] text-slate-300">{i + 1}</td>
                <td className="px-3 py-2 font-mono text-xs font-bold text-slate-700 whitespace-nowrap">{p.po_number}</td>
                <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">L{p.po_line}</td>
                <td className="px-3 py-2 font-black whitespace-nowrap" style={{ color: ACE_BLUE }}>
                  {p.site_code || <span className="text-slate-300">—</span>}
                </td>
                <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">{p.cluster_site || '—'}</td>
                <td className="px-3 py-2 whitespace-nowrap"><StatusChip status={p.workflow_status} /></td>
                <td className="px-3 py-2 text-xs text-slate-600 whitespace-nowrap">
                  {p.planned_dte_names || <span className="text-slate-300">unassigned</span>}
                  {p.planned_dte_codes && <div className="mt-0.5 font-mono text-[.62rem] text-slate-400">{p.planned_dte_codes}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function ClusterTable({ clusters }) {
  if (!clusters.length) {
    return <Card className="p-10"><EmptyState icon={Layers} title="No PAC clusters" desc="No PAC clusters yet." /></Card>
  }
  return (
    <Card className="overflow-hidden">
      <div style={{ overflowX: 'auto' }}>
        <table className="w-full border-collapse text-[.78rem]">
          <thead className="bg-slate-50">
            <tr>
              {['#', 'Cluster Site', 'PO Lines', 'Sites', 'Planned DTE', 'Status'].map(h => (
                <th key={h} className="border-b border-slate-200 px-3 py-2 text-left text-xs font-black uppercase tracking-[.04em] text-slate-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clusters.map((c, i) => (
              <tr key={c.name} className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                <td className="px-3 py-2 text-[.66rem] text-slate-300">{i + 1}</td>
                <td className="px-3 py-2 font-black whitespace-nowrap" style={{ color: PURPLE }}>{c.name}</td>
                <td className="px-3 py-2 text-xs text-slate-600 whitespace-nowrap">{c.count} lines</td>
                <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">{c.siteCount} sites</td>
                <td className="px-3 py-2 text-xs text-slate-600 whitespace-nowrap">
                  {c.dteName || <span className="text-slate-300">unassigned</span>}
                  {c.dteCode && <div className="mt-0.5 font-mono text-[.62rem] text-slate-400">{c.dteCode}</div>}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {c.allPlanned
                    ? <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[.62rem] font-black text-emerald-700">All Planned</span>
                    : <span className="inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[.62rem] font-black text-amber-700">{c.planned}/{c.count} Planned</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function MapPlaceholder() {
  return (
    <Card className="p-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: `${ACE_BLUE}12`, color: ACE_BLUE }}>
        <MapIcon size={28} strokeWidth={2.3} />
      </div>
      <h3 className="mt-6 text-2xl font-black text-slate-950">Map</h3>
      <p className="mx-auto mt-3 max-w-lg text-sm font-semibold leading-6 text-slate-500">
        Interactive map with stage-coloured markers. Backend integration pending.
      </p>
    </Card>
  )
}

function ActionButton({ label, action, color, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '6px 12px', borderRadius: 6,
        border: `1px solid ${disabled ? '#e2e8f0' : color}`,
        background: disabled ? '#f8fafc' : '#fff',
        color: disabled ? '#cbd5e1' : color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '.75rem', fontWeight: 700, whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

function SiteDetailDrawer({ row, onClose, role, currentUser, onAction, viewType = 'SSV' }) {
  const isPac = viewType === 'PAC'
  const [history, setHistory] = useState([])
  const [billingPos, setBillingPos] = useState([])
  const [busy, setBusy] = useState(false)
  const [notes, setNotes] = useState('')
  const [showFailModal, setShowFailModal] = useState(false)

  // Perf #5: cancel stale drawer fetches when user clicks rows quickly
  useEffect(() => {
    if (!row) return
    let cancelled = false
    apiFetch(`/api/presite/tracking/${row.id}/history`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setHistory(d.data || []) })
      .catch(() => { if (!cancelled) setHistory([]) })
    apiFetch(`/api/presite/tracking/${row.id}/billing-pos`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setBillingPos(d.data || []) })
      .catch(() => { if (!cancelled) setBillingPos([]) })
    return () => { cancelled = true }
  }, [row?.id])

  if (!row) return null

  const stage = row.current_stage
  const canPass = (stage === 'REPORT_DONE' || stage === 'CHECKING') && roleCan(role, 'check-pass')
  const canFail = (stage === 'REPORT_DONE' || stage === 'CHECKING') && roleCan(role, 'check-fail')

  async function fire(action, extra = {}) {
    setBusy(true)
    try {
      const res = await apiFetch(`/api/presite/tracking/${row.id}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes: notes || undefined, ...extra }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(`Action failed: ${err.detail || res.status}`)
      } else {
        const updated = await res.json()
        onAction(updated)
      }
    } finally {
      setBusy(false)
      setNotes('')
      setShowFailModal(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 480,
      background: '#fff', boxShadow: '-4px 0 12px rgba(15,23,42,.12)',
      zIndex: 100, overflowY: 'auto', borderLeft: '1px solid #e2e8f0',
    }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '.7rem', color: SLATE, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>Pre-Site Tracking</div>
          <h2 style={{ margin: '4px 0', fontSize: '1.4rem', fontWeight: 800, color: ACE_BLUE }}>{row.site_code || '—'}</h2>
          <div style={{ fontSize: '.78rem', color: SLATE }}>
            PO {row.po_number} · Line {row.po_line}
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <X size={20} color={SLATE} />
        </button>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '.78rem' }}>
          <div>
            <div style={{ color: SLATE, fontSize: '.7rem' }}>Project</div>
            <div style={{ fontWeight: 700 }}>{row.ace_project_code || '—'}</div>
          </div>
          <div>
            <div style={{ color: SLATE, fontSize: '.7rem' }}>Assigned DTE</div>
            <div style={{ fontWeight: 700 }}>{row.assigned_dte_name || '—'}</div>
            <div style={{ fontSize: '.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>{row.assigned_dte_code}</div>
          </div>
          <div>
            <div style={{ color: SLATE, fontSize: '.7rem' }}>{isPac ? 'Cluster Ready (Day 0)' : 'Full On-Air (Day 0)'}</div>
            <div style={{ fontWeight: 700 }}>{fmtDateTime(row.full_onair_at)}</div>
          </div>
          <div>
            <div style={{ color: SLATE, fontSize: '.7rem' }}>SLA</div>
            <SLAIndicator row={row} />
          </div>
        </div>

        {/* Stage timeline */}
        <div style={{ marginTop: 4 }}>
          <div style={{ fontSize: '.72rem', color: SLATE, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Stage Timeline</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {STAGES.map(s => {
              const ts = (() => {
                switch (s.key) {
                  case 'FULL_ONAIR':   return row.full_onair_at
                  case 'DT_STARTED':   return row.dt_started_at
                  case 'DT_DONE':      return row.dt_done_at
                  case 'REPORT_DONE':  return row.report_done_at
                  case 'ACE_APPROVED': return row.check_at
                  default: return null
                }
              })()
              const actor = (() => {
                switch (s.key) {
                  case 'DT_STARTED':   return row.dt_started_by
                  case 'DT_DONE':      return row.dt_done_by
                  case 'REPORT_DONE':  return row.report_done_by
                  case 'ACE_APPROVED': return row.check_by
                  default: return null
                }
              })()
              const extra = s.key === 'DT_DONE' ? fmtDuration(row.dt_started_at, row.dt_done_at) : null
              const isFail = s.key === 'ACE_APPROVED' && row.check_result === 'FAIL'
              return (
                <div key={s.key} style={{
                  display: 'flex', justifyContent: 'space-between', padding: '6px 8px',
                  background: ts ? `${s.color}10` : '#f8fafc',
                  borderLeft: `3px solid ${ts ? s.color : '#e2e8f0'}`,
                  borderRadius: 4, fontSize: '.78rem',
                }}>
                  <span style={{ fontWeight: 700, color: ts ? s.color : '#94a3b8' }}>
                    {isPac && s.key === 'FULL_ONAIR' ? '① Cluster Ready' : s.label} {isFail && <span style={{ color: RED, marginLeft: 6 }}>FAIL</span>}
                  </span>
                  <span style={{ color: ts ? '#475569' : '#cbd5e1', fontSize: '.72rem' }}>
                    {ts ? fmtDateTime(ts) : '—'}
                    {extra && <span style={{ color: AMBER, marginLeft: 6, fontWeight: 700 }}>· {extra}</span>}
                    {actor && <span style={{ color: '#94a3b8', marginLeft: 6 }}>by {actor}</span>}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {row.check_notes && (
          <div style={{ background: '#fef3c7', padding: '8px 12px', borderRadius: 6, borderLeft: `3px solid ${AMBER}`, fontSize: '.76rem' }}>
            <div style={{ color: AMBER, fontWeight: 700, fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>
              Last check notes ({row.check_result})
            </div>
            <div style={{ color: '#78350f', whiteSpace: 'pre-wrap' }}>{row.check_notes}</div>
          </div>
        )}

        {/* Rounds — shared SSV/PAC: shows plan / test / check per round */}
        {Array.isArray(row.sessions) && row.sessions.length > 0 && (
          <div>
            <div style={{ fontSize: '.72rem', color: SLATE, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
              {isPac ? 'PAC' : 'SSV'} Rounds ({row.sessions.filter(s => s.check_result === 'PASS' || (s.status === 'DONE' && !isPac && !s.check_result)).length}/{row.sessions.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {row.sessions.map(s => {
                const isPass = s.check_result === 'PASS'
                const isFail = s.check_result === 'FAIL'
                const isDone = s.status === 'DONE'
                const isActive = s.status === 'IN_PROGRESS'
                const tone = isPass ? GREEN : isFail ? RED : isActive ? AMBER : isDone ? PURPLE : '#94a3b8'
                const bg = isPass ? `${GREEN}10` : isFail ? `${RED}10` : isActive ? `${AMBER}10` : isDone ? `${PURPLE}10` : '#f8fafc'
                const dur = fmtDuration(s.started_at, s.ended_at)
                return (
                  <div key={s.round} style={{
                    padding: '8px 10px', background: bg, borderLeft: `3px solid ${tone}`,
                    borderRadius: 4, fontSize: '.74rem',
                  }}>
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontWeight: 800, color: tone }}>Round {s.round}</span>
                      {isPass && <span className="rounded-full px-2 py-0.5 text-[.62rem] font-black" style={{ background: GREEN, color: '#fff' }}>✓ PASS</span>}
                      {isFail && <span className="rounded-full px-2 py-0.5 text-[.62rem] font-black" style={{ background: RED, color: '#fff' }}>✕ FAIL</span>}
                      {!isPass && !isFail && isActive && <span className="rounded-full px-2 py-0.5 text-[.62rem] font-black" style={{ background: AMBER, color: '#fff' }}>In Progress</span>}
                      {!isPass && !isFail && !isActive && !isDone && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[.62rem] font-black text-slate-600">Planned</span>}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[.7rem]">
                      <div>
                        <div className="text-[.6rem] font-bold text-slate-400 uppercase">Plan</div>
                        <div className="text-slate-700 font-bold">{s.planned_at ? fmtDate(s.planned_at) : '—'}</div>
                      </div>
                      <div>
                        <div className="text-[.6rem] font-bold text-slate-400 uppercase">Test</div>
                        <div className="text-slate-700 font-bold">
                          {s.started_at ? `${fmtDate(s.started_at)} ${fmtHourMin(s.started_at)}` : '—'}
                          {s.ended_at && <span className="text-slate-400">–{fmtHourMin(s.ended_at)}</span>}
                          {dur && <span className="ml-1 font-black" style={{ color: AMBER }}>({dur})</span>}
                        </div>
                      </div>
                      <div>
                        <div className="text-[.6rem] font-bold text-slate-400 uppercase">Check</div>
                        <div className="font-bold" style={{ color: isPass ? GREEN : isFail ? RED : '#94a3b8' }}>
                          {s.check_at ? fmtDate(s.check_at) : '—'}
                          {s.check_by && <span className="text-slate-400 ml-1">{s.check_by}</span>}
                        </div>
                      </div>
                    </div>
                    {s.check_notes && (
                      <div className="mt-1 text-[.66rem] italic" style={{ color: isFail ? RED : SLATE }}>
                        “{s.check_notes}”
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Billing Reference — child POs (SSV: 1 PO, PAC: N POs in cluster) */}
        {billingPos.length > 0 && (
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
            <div style={{ fontSize: '.72rem', color: SLATE, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={13} /> Billing Reference ({billingPos.length} {billingPos.length === 1 ? 'item' : 'items'})
              </span>
              {(() => {
                const total = billingPos.reduce((s, p) => s + (parseFloat(p.line_amount) || 0), 0)
                if (total > 0) return <span style={{ fontSize: '.72rem', color: '#1e293b', fontWeight: 800 }}>฿{total.toLocaleString()}</span>
                return null
              })()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto' }}>
              {billingPos.map(p => (
                <div key={p.po_id} style={{
                  padding: '6px 10px',
                  background: row.current_stage === 'ACE_APPROVED' ? '#f0fdf4' : '#f8fafc',
                  borderLeft: `3px solid ${row.current_stage === 'ACE_APPROVED' ? GREEN : PURPLE}`,
                  borderRadius: 4, fontSize: '.72rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
                      <span style={{ fontWeight: 800, color: isPac ? PURPLE : ACE_BLUE, whiteSpace: 'nowrap' }}>
                        {p.du_id || '—'}
                      </span>
                      <span style={{ fontSize: '.62rem', color: '#94a3b8', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.po_number} L{p.po_line}
                      </span>
                    </div>
                    {p.line_amount != null && (
                      <span style={{ fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap' }}>
                        ฿{parseFloat(p.line_amount).toLocaleString()}
                        {p.payment_terms && <span style={{ fontSize: '.6rem', color: '#94a3b8', marginLeft: 4 }}>{p.payment_terms}</span>}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                    {p.hw_id ? (
                      <span style={{ fontSize: '.62rem', color: '#64748b', fontFamily: 'monospace' }}>
                        HW: <span style={{ fontWeight: 700 }}>{p.hw_id}</span>
                      </span>
                    ) : (
                      <span style={{ fontSize: '.62rem', color: '#cbd5e1', fontStyle: 'italic' }}>HW ID: —</span>
                    )}
                  </div>
                  {p.item_dis && (
                    <div style={{ fontSize: '.62rem', color: '#64748b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.item_dis}>
                      {p.item_dis}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {row.current_stage === 'ACE_APPROVED' && (
              <div style={{ marginTop: 8, padding: '6px 10px', background: '#dcfce7', borderRadius: 4, fontSize: '.7rem', color: '#15803d', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={13} /> Ready for billing handoff
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
          <div style={{ fontSize: '.72rem', color: SLATE, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Actions ({role})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {stage === 'FULL_ONAIR' && (
              <ActionButton label="① Start DT" color={AMBER} disabled={busy || !roleCan(role, 'dt-start')} onClick={() => fire('dt-start')} />
            )}
            {stage === 'DT_STARTED' && (
              <ActionButton label="② End DT (Done)" color={ACE_BLUE} disabled={busy || !roleCan(role, 'dt-done')} onClick={() => fire('dt-done')} />
            )}
            {(stage === 'DT_DONE' || (stage === 'CHECKING' && row.check_result === 'FAIL')) && (
              <ActionButton label="③ Mark Report Done" color={ACE_BLUE} disabled={busy || !roleCan(role, 'report-done')} onClick={() => fire('report-done')} />
            )}
            {canPass && (
              <ActionButton
                label={`④ Check Pass — Approve as ${currentUser?.name || currentUser?.employeeCode || '—'}`}
                color={GREEN}
                disabled={busy}
                onClick={() => fire('check-pass')}
              />
            )}
            {canFail && <ActionButton label="④ Check Fail (Rework)" color={RED} disabled={busy} onClick={() => setShowFailModal(true)} />}
            {stage === 'ACE_APPROVED' && (
              <div style={{ color: GREEN, fontWeight: 700, padding: '6px 0' }}>
                ✓ Approved {fmtDateTime(row.check_at)} by {row.check_by}
              </div>
            )}
          </div>
        </div>

        {/* History */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
          <div style={{ fontSize: '.72rem', color: SLATE, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <History size={13} /> Audit log
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto' }}>
            {history.length === 0 && <div style={{ fontSize: '.72rem', color: '#94a3b8' }}>No entries</div>}
            {history.map(h => (
              <div key={h.id} style={{ padding: '6px 8px', background: '#f8fafc', borderRadius: 4, fontSize: '.72rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, color: ACE_BLUE }}>{h.action}</span>
                  <span style={{ color: '#94a3b8' }}>{fmtDateTime(h.at)}</span>
                </div>
                <div style={{ color: '#475569' }}>
                  {h.actor_name || h.actor_code || 'system'} → {h.stage}
                </div>
                {h.notes && <div style={{ color: '#78350f', marginTop: 2 }}>{h.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fail rework modal */}
      {showFailModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, width: 400 }}>
            <h3 style={{ margin: 0, marginBottom: 10, color: RED }}>Check Fail (Rework Required)</h3>
            <p style={{ fontSize: '.78rem', color: SLATE, margin: '4px 0 12px' }}>
              Reason / rework notes (required). DTE will need to redo Step 2 (Report Done).
            </p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. KPI calculation incorrect, missing photos…"
              style={{ width: '100%', minHeight: 100, padding: 8, border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '.78rem', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <ActionButton label="Cancel" color={SLATE} onClick={() => { setShowFailModal(false); setNotes('') }} />
              <ActionButton label="Submit Fail" color={RED} disabled={!notes.trim() || busy} onClick={() => fire('check-fail')} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const PROJECT_OPTIONS = [
  { value: '',         label: 'All Projects', short: 'All Projects',     desc: 'HWT2304 + HWT2604' },
  { value: 'HWT2304',  label: 'HWT2304',      short: 'HWT2304',          desc: "Project B_ (B-prefix item_dis)" },
  { value: 'HWT2604',  label: 'HWT2604',      short: 'HWT2604',          desc: "Project A_ (A-prefix item_dis)" },
]
const PROJECT_KEY = 'ace_presite_project_v1'

export default function PreSiteMonitorPage({ authenticatedUser, onLogout }) {
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [project, setProject] = useState(() => {
    try { return localStorage.getItem(PROJECT_KEY) ?? '' } catch { return '' }
  })
  useEffect(() => {
    try { localStorage.setItem(PROJECT_KEY, project || '') } catch {}
  }, [project])
  const [stageFilter, setStageFilter] = useState('')
  const [slaOnly, setSlaOnly] = useState(false)
  const [q, setQ] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')
  const [activeNav, setActiveNav] = useState('DAILY')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [pos, setPos] = useState([])
  const [siteMap, setSiteMap] = useState({})
  const [openRow, setOpenRow] = useState(null)
  const [loading, setLoading] = useState(false)
  // Dynamic project list — derived from POs that actually exist (with counts),
  // so the switcher always reflects real data instead of a stale hardcoded list.
  const [projectList, setProjectList] = useState([])

  const role = authenticatedUser?.role || 'EMPLOYEE'

  useEffect(() => {
    apiFetch('/api/project-pos')
      .then(r => r.ok ? r.json() : { data: [] })
      .then(d => {
        const counts = {}
        ;(d.data || []).forEach(p => {
          const code = (p.ace_project_code || '').trim()
          if (code) counts[code] = (counts[code] || 0) + 1
        })
        setProjectList(Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, count })))
      })
      .catch(() => setProjectList([]))
  }, [])

  // Build the dropdown options: "All Projects" + every project with POs.
  const projectOptions = useMemo(() => {
    const dynamic = projectList.map(p => ({ value: p.value, label: `${p.value} (${p.count})`, short: p.value }))
    return [{ value: '', label: 'All Projects', short: 'All Projects' }, ...dynamic]
  }, [projectList])
  const projectInfo = projectOptions.find(o => o.value === project) || projectOptions[0]

  // ── Phase 2: Work queue scope ─────────────────────────────────────────────
  // timeScope: 'active' (default) hides rows finished > 7 days ago so the page
  //   answers "what do I do next?" rather than "show me everything".
  //   'last7d' includes done within 7 days. 'all' shows full history.
  // userScope: 'my' default for plain EMPLOYEE (DTE/DTA) so field workers see
  //   only their assignments; broader roles default to 'all' (PM / leads
  //   monitor everyone). 'team' is currently same as 'all' (no team grouping
  //   yet) — kept for future team-scoping.
  const isPlainEmployee = role === 'EMPLOYEE'
  const [timeScope, setTimeScope] = useState('active')
  const [userScope, setUserScope] = useState(isPlainEmployee ? 'my' : 'all')
  const myCode = (authenticatedUser?.employeeCode || authenticatedUser?.code || '').toUpperCase()

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (project) params.set('ace_project_code', project)
    if (stageFilter) params.set('stage', stageFilter)
    if (slaOnly) params.set('sla_breach', 'true')
    if (q) params.set('q', q)
    try {
      const sumPath = project ? `/api/presite/summary?ace_project_code=${project}` : '/api/presite/summary'
      // Perf #1: filter /project-pos by project_code (was unfiltered, ~1500 rows)
      const posPath = project ? `/api/project-pos?ace_project_code=${project}` : '/api/project-pos'
      // Perf #1b: only fetch PO-referenced sites (project_sites can hold 100k+
      // rows after ISDP import). Cache per scope key on window.
      const sitesUrl = project
        ? `/api/sites?project_code=${encodeURIComponent(project)}`
        : '/api/sites?referenced_only=true'
      const cacheKey = `__acePresiteSites__${project || 'ALL'}`
      const sitesPromise = window[cacheKey]
        ? Promise.resolve(window[cacheKey])
        : apiFetch(sitesUrl).then(r => r.json()).catch(() => ({ data: [] }))
          .then(d => { window[cacheKey] = d; return d })
      const [trackRes, sumRes, posRes, sitesRes] = await Promise.all([
        apiFetch(`/api/presite/tracking?${params.toString()}`).then(r => r.json()),
        apiFetch(sumPath).then(r => r.json()),
        apiFetch(posPath).then(r => r.json()).catch(() => ({ data: [] })),
        sitesPromise,
      ])
      setRows(trackRes.data || [])
      setSummary(sumRes || null)
      setPos(posRes.data || [])
      const sm = {}
      ;(sitesRes.data || []).forEach(s => {
        if (s.site_code) sm[s.site_code.toUpperCase()] = {
          site_name: s.site_name,
          rf_cluster_name: s.rf_cluster_name,
          full_on_air: s.full_on_air,
        }
      })
      setSiteMap(sm)
    } finally {
      setLoading(false)
    }
  }, [project, stageFilter, slaOnly, q])

  useEffect(() => { load() }, [load])

  const filteredRows = useMemo(() => {
    const from = dateFrom ? new Date(dateFrom + 'T00:00:00Z').getTime() : null
    const to   = dateTo   ? new Date(dateTo   + 'T23:59:59Z').getTime() : null
    const wantedWorkType = activeNav === 'SSV_PRE' ? 'SSV' : activeNav === 'PAC_PRE' ? 'PAC' : null
    const isPac = activeNav === 'PAC_PRE'

    // For SSV_PRE / PAC_PRE views, merge synthetic "PLAN" rows from project_pos.
    // These are POs that have planned_dte_codes set but no tracking yet (workflow=PLANNED).
    // Lets PM see the workplan items BEFORE Leader approves.
    let merged = rows
    if (wantedWorkType) {
      // Build set of identifiers already in tracking — skip these from synthetic add
      const trackedKeys = new Set(
        rows.filter(r => r.work_type === wantedWorkType)
            .map(r => isPac ? r.cluster_key : r.site_code)
            .filter(Boolean)
            .map(k => String(k).toUpperCase())
      )
      const seenPlanKeys = new Set()
      const synthetic = []
      pos.forEach(p => {
        if (p.work_type !== wantedWorkType) return
        if (!p.planned_dte_codes) return
        // PAC identity = canonical RF Cluster Name (ISDP), resolved from siteMap via
        // the PO's cluster_site. Falls back to raw cluster_site if unmapped. This
        // groups a cluster's N POs into ONE synthetic row (e.g. EAS-FLASH-0012),
        // matching the tracking row's cluster_key — instead of N raw RYG#### rows.
        const pacCluster = isPac
          ? (siteMap[String(p.cluster_site || '').toUpperCase()]?.rf_cluster_name || p.cluster_site)
          : null
        const key = String((isPac ? pacCluster : (p.site_code || p.cluster_site)) || '').toUpperCase()
        if (!key) return
        if (trackedKeys.has(key)) return    // already in tracking
        if (seenPlanKeys.has(key)) return   // dedupe PAC clusters (1 cluster = many POs)
        seenPlanKeys.add(key)
        synthetic.push({
          id: `plan-${p.id}`,
          __synthetic: true,
          po_id: p.id,
          po_number: p.po_number,
          po_line: p.po_line,
          site_code: isPac ? pacCluster : (p.site_code || ''),
          cluster_key: isPac ? pacCluster : null,
          rf_cluster_name: isPac ? pacCluster : null,
          work_type: p.work_type,
          assigned_dte_code: String(p.planned_dte_codes).split(',')[0].trim(),
          assigned_dte_name: p.planned_dte_names || p.planned_dte_codes,
          current_stage: 'PLAN',  // synthetic stage — not in STAGE_INDEX → all STAGES show grey
          full_onair_at: null,
          dt_started_at: null,
          dt_done_at: null,
          report_done_at: null,
          check_at: null,
          check_result: null,
          sla_breached: false,
          total_rounds: 0,
          rework_count: 0,
        })
      })
      merged = [...synthetic, ...rows]  // PLAN rows first (earliest in workflow)
    }

    const sevenDaysAgo = Date.now() - 7 * 24 * 3600 * 1000

    return merged.filter(r => {
      // work_type filter for Pre-Site views
      if (wantedWorkType && r.work_type && r.work_type !== wantedWorkType) return false
      // Date filter — synthetic PLAN rows have no full_onair_at; pass through when date set
      if (from !== null || to !== null) {
        if (r.__synthetic) return true  // include PLAN rows regardless of date filter
        if (!r.full_onair_at) return false
        const t = new Date(r.full_onair_at).getTime()
        if (from !== null && t < from) return false
        if (to   !== null && t > to)   return false
      }
      // Phase 2: timeScope — hide rows that finished long ago from the default
      //   work queue. "active" = not done OR done within 7d. "last7d" same as
      //   active but explicitly named. "all" = no filter.
      if (timeScope !== 'all') {
        const isDone = r.current_stage === 'ACE_APPROVED'
        if (isDone) {
          const doneAt = r.report_approved_at || r.pa_closed_at || r.check_at || r.report_done_at || r.dt_done_at
          if (doneAt) {
            const t = new Date(doneAt).getTime()
            if (t < sevenDaysAgo) return false
          }
        }
      }
      // Phase 2: userScope — "my" filters to rows assigned to the logged-in
      //   DTE. 'team' / 'all' don't filter (no team grouping yet).
      if (userScope === 'my' && myCode) {
        const dte = String(r.assigned_dte_code || '').toUpperCase()
        if (dte !== myCode) return false
      }
      return true
    })
  }, [rows, pos, siteMap, dateFrom, dateTo, activeNav, timeScope, userScope, myCode])

  // PO lookup by id — used by PreSiteTable to show planned date+duration per tracking row
  const posById = useMemo(() => {
    const m = {}
    pos.forEach(p => { if (p.id != null) m[p.id] = p })
    return m
  }, [pos])

  // Perf #2: pre-index POs by uppercased cluster_site (PAC planForRow needs this — was O(N) per row)
  const posByClusterSite = useMemo(() => {
    const m = {}
    pos.forEach(p => {
      if (p.cluster_site) {
        const key = String(p.cluster_site).toUpperCase()
        if (!m[key]) m[key] = p   // first PO of cluster is enough for plan-row metadata
      }
    })
    return m
  }, [pos])

  // ── Derived: SSV / PAC / Plan DTE rows from raw PO list ────────────────────
  const ssvRows = useMemo(
    () => pos.filter(p => (p.work_type || '').toUpperCase() === 'SSV')
             .sort((a, b) => String(a.po_number).localeCompare(String(b.po_number))),
    [pos]
  )

  const pacRows = useMemo(
    () => pos.filter(p => (p.work_type || '').toUpperCase() === 'PAC'),
    [pos]
  )

  const planRows = useMemo(
    () => pos.filter(p => !p.planned_dte_codes)
             .sort((a, b) => String(a.po_number).localeCompare(String(b.po_number))),
    [pos]
  )

  const pacClusters = useMemo(() => {
    const grouped = {}
    pacRows.forEach(p => {
      const key = p.cluster_site || extractSiteKey(p.site_code) || '—'
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(p)
    })
    return Object.entries(grouped).map(([name, items]) => {
      const planned = items.filter(p => p.planned_dte_codes).length
      const codes = items.map(p => p.planned_dte_codes || '').filter(Boolean)
      const allSame = codes.length === items.length && codes.every(c => c === codes[0])
      const dteCode = allSame && codes.length ? codes[0] : ''
      const dteName = allSame && items[0].planned_dte_names ? items[0].planned_dte_names : ''
      const siteSet = new Set(items.map(p => extractSiteKey(p.site_code)).filter(Boolean))
      return {
        name,
        count: items.length,
        siteCount: siteSet.size,
        planned,
        allPlanned: planned === items.length,
        dteCode,
        dteName,
      }
    }).sort((a, b) => a.name.localeCompare(b.name))
  }, [pacRows])

  const navCounts = useMemo(() => ({
    SSV_PRE: rows.length,
    PAC_PRE: rows.length,
    SSV:     ssvRows.length,
    PAC:     pacClusters.length,
    PLAN:    planRows.length,
  }), [rows, ssvRows, pacClusters, planRows])

  function handleAction(updatedRow) {
    setRows(prev => prev.map(r => r.id === updatedRow.id ? updatedRow : r))
    setOpenRow(updatedRow)
    load()
  }

  const user = authenticatedUser || {}

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="flex min-h-screen">
        <PreSiteSidebar
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          counts={navCounts}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
          projectShort={projectInfo.short}
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
      {/* Sticky top header */}
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/86 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <IconButton label="Open menu" onClick={() => setMobileMenuOpen(true)}>
            <Menu size={19} />
          </IconButton>
          <div className="hidden min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-400 md:flex">
            <Search size={18} />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search Site / DTE..."
              className="w-full border-0 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* Project switcher */}
            <div className="relative">
              <select
                value={project}
                onChange={e => setProject(e.target.value)}
                title="Filter by project"
                className="appearance-none rounded-2xl border border-slate-200 bg-white pl-3 pr-8 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {projectOptions.map(o => (
                  <option key={o.value || 'all'} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <IconButton label="Refresh" onClick={() => load()} disabled={loading}>
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </IconButton>
            <IconButton label="Notifications">
              <Bell size={18} />
            </IconButton>
            <button className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:bg-slate-50 sm:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-black text-white" style={{ background: ACE_BLUE }}>
                {initials(user.name || user.firstName || user.employeeCode)}
              </div>
              <div className="text-left">
                <div className="text-sm font-black text-slate-900">{user.name || user.firstName || user.employeeCode || 'User'}</div>
                <div className="text-xs font-bold text-slate-400">{user.positionName || user.role || 'Project Access'}</div>
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
        {/* Title section (pre-site views only) */}
        {PIPELINE_NAVS.has(activeNav) && (
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
              <Home size={14} />
              {COMPANY} · Pre-Site · {projectInfo.short}
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-normal text-slate-950 sm:text-4xl">
              {PRESITE_NAV.find(n => n.id === activeNav)?.label || 'Pre-Site Monitor'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
              {PRESITE_NAV.find(n => n.id === activeNav)?.desc || 'DTE Per-Site Workflow'} · SLA {SLA_DAYS} days from On-Air to Check Pass.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 shadow-sm">
              <CalendarDays size={17} style={{ color: ACE_RED }} />
              {formatToday()}
            </div>
            <button
              onClick={() => setSlaOnly(v => !v)}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition hover:-translate-y-0.5 ${slaOnly ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-200 bg-white text-slate-600'}`}
            >
              <Filter size={15} />
              {slaOnly ? '✓ SLA Breach' : '○ SLA Breach'}
            </button>
          </div>
        </div>
        )}

        {/* Metric cards (pipeline views only) */}
        {PIPELINE_NAVS.has(activeNav) && (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Active" value={summary?.active ?? '—'} helper="not yet approved" tone={ACE_BLUE} icon={Activity} />
            <StatCard label="Awaiting Check" value={summary?.awaiting_check ?? '—'} helper="TL action required" tone={AMBER} icon={ClipboardCheck} />
            <StatCard label="SLA Breach" value={summary?.sla_breach ?? '—'} helper={`> ${SLA_DAYS} days from On-Air`} tone={RED} icon={AlertOctagon} />
            <StatCard label="Approved (7d)" value={summary?.approved_this_week ?? '—'} helper="last 7 days" tone={GREEN} icon={CheckCircle2} />
          </section>
        )}

        {/* Phase 2: missing-data banner (pipeline views only) */}
        {PIPELINE_NAVS.has(activeNav) && (() => {
          const siteList = Object.values(siteMap)
          const totalKnown = siteList.length
          const missingRf  = siteList.filter(s => !s.rf_cluster_name).length
          // Banner shows only when there's a real signal: > 50 sites without RF
          // Cluster Name AND user is at a role that can act on it. Hidden for
          // plain DTE/DTA — they shouldn't be asked to fix master data.
          const canAct = !isPlainEmployee
          if (!canAct || missingRf < 50) return null
          const pct = totalKnown ? Math.round((missingRf / totalKnown) * 100) : 0
          return (
            <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-amber-100 p-2 text-amber-700">
                  <AlertTriangle size={20} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-black text-amber-900">RF Cluster Name missing on {missingRf.toLocaleString()} sites ({pct}%)</div>
                  <div className="text-xs font-semibold text-amber-700">
                    PAC clusters cannot consolidate without ISDP mapping. Upload the latest ISDP rollout plan to refresh.
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
        })()}

        {/* Filters card (pipeline views only) */}
        {PIPELINE_NAVS.has(activeNav) && (
        <Card className="p-5">
          <div className="flex flex-wrap items-center gap-4">
            {/* Phase 2: Time scope */}
            <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-1 text-xs font-black">
              {[
                { id: 'active',  label: 'Active' },
                { id: 'last7d',  label: 'Last 7d' },
                { id: 'all',     label: 'All' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setTimeScope(opt.id)}
                  className={`rounded-xl px-3 py-1.5 transition ${timeScope === opt.id ? 'bg-blue-50 text-[#2447d8] shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {/* Phase 2: User scope */}
            <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-1 text-xs font-black">
              {[
                { id: 'my',   label: 'My Work' },
                { id: 'team', label: 'Team' },
                { id: 'all',  label: 'All' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setUserScope(opt.id)}
                  disabled={opt.id === 'my' && !myCode}
                  className={`rounded-xl px-3 py-1.5 transition disabled:cursor-not-allowed disabled:opacity-40 ${userScope === opt.id ? 'bg-blue-50 text-[#2447d8] shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-[.08em] text-slate-500">Stage</span>
              <select
                value={stageFilter}
                onChange={e => setStageFilter(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-blue-300"
              >
                <option value="">All stages</option>
                {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-[.08em] text-slate-500">Date</span>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-blue-300"
              />
              <span className="text-xs font-bold text-slate-400">→</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-blue-300"
              />
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => { setDateFrom(''); setDateTo('') }}
                  title="Clear date"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <span className="ml-auto text-xs font-bold text-slate-400">
              {filteredRows.length} rows{loading && ' · loading…'}
            </span>
          </div>
        </Card>
        )}

        {/* Views by activeNav */}
        {activeNav === 'DAILY' && <DailyPage />}
        {activeNav === 'DTE_LIST' && <DTEListPage />}
        {activeNav === 'JOB_ASGN' && <JobAssignmentPage />}
        {PIPELINE_NAVS.has(activeNav) && (
          <PreSiteTable
            rows={filteredRows}
            onOpen={setOpenRow}
            viewType={activeNav === 'PAC_PRE' ? 'PAC' : 'SSV'}
            posById={posById}
            posByClusterSite={posByClusterSite}
          />
        )}
        {activeNav === 'SSV' && <SsvOnAirChart />}
        {activeNav === 'PLAN_BOARD' && <PlanBoardPage />}
        {['SSV', 'PAC', 'MAP'].includes(activeNav) && (
          <RFMonitorPage
            embedded
            forceActiveNav={activeNav}
            project={project}
            authenticatedUser={authenticatedUser}
            onLogout={onLogout}
          />
        )}
      </div>
        </main>
      </div>

      {openRow && (
        <SiteDetailDrawer
          row={openRow}
          onClose={() => setOpenRow(null)}
          currentUser={authenticatedUser}
          role={role}
          onAction={handleAction}
          viewType={activeNav === 'PAC_PRE' ? 'PAC' : 'SSV'}
        />
      )}
    </div>
  )
}
