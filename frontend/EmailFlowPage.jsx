// EmailFlowPage — Admin console for email-notification & approval-chain rules.
// Route: /admin/email-flow
//
// Visual language aligned with HREmployeePage (eyebrow chip + h1 + rounded-2xl
// MetricCards + section cards with shadow).
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Mail, Workflow, GitBranch, ShieldCheck, Users, UserCheck, Crown,
  ArrowRight, Save, RefreshCcw, Info, CalendarClock, Send, Layers,
  Megaphone, BellRing, FileWarning, ClipboardCheck, Home, ArrowLeft, LogOut,
  Plus, Trash2, RotateCcw, MousePointer2, UsersRound, Target, Zap, Handshake, Eye, X,
  Maximize2, Minimize2,
} from 'lucide-react'
import { apiFetch } from './src/apiFetch.js'

const ACE_BLUE = '#2447d8'
const ACE_RED  = '#c73b32'

// ── Static knowledge of the chain (mirrors app/routers/leave.py) ─────────────
const LEAVE_TYPES = [
  { key: 'Annual Leave',   label: 'Annual Leave',   tone: 'blue',   color: '#2447d8', chain: ['REQ', 'PM', 'PD', 'HR', 'BOSS'] },
  { key: 'Other Leave',    label: 'Other Leave',    tone: 'slate',  color: '#64748b', chain: ['REQ', 'PM', 'PD', 'HR', 'BOSS'] },
  { key: 'Personal Leave', label: 'Personal Leave', tone: 'amber',  color: '#d97706', chain: ['REQ', 'PM', 'PD', 'HR', 'BOSS'] },
  { key: 'Sick Leave',     label: 'Sick Leave',     tone: 'red',    color: '#dc2626', chain: ['REQ', 'PM', 'HR', 'BOSS'] },
]

const NODE_META = {
  REQ:  { title: 'Requester',         desc: 'Employee submits the request',      icon: Users,       color: '#64748b' },
  PM:   { title: 'PM',                desc: 'Direct manager (role PM fallback)', icon: UserCheck,   color: '#2447d8' },
  SPM:  { title: 'SPM',               desc: 'Senior PM — FULL chain only',       icon: UserCheck,   color: '#1d3bb8' },
  PD:   { title: 'PD / DC',           desc: 'Project Director / DC role',        icon: ShieldCheck, color: '#7c3aed' },
  HR:   { title: 'HR',                desc: 'HR_ADMIN + HR users',               icon: Mail,        color: '#16a34a' },
  BOSS: { title: 'Managing Director', desc: 'Seng Bun Lay (CC on approve)',      icon: Crown,       color: '#d97706' },
}

const EMAIL_TRIGGERS = [
  { event: 'Leave submitted', to: 'PM (or HR if Sick)', cc: 'Requester + HR + Boss',  icon: Send,        tone: 'bg-blue-50 text-[#2447d8] border-blue-200' },
  { event: 'PM approved',     to: 'PD / DC',            cc: 'Requester + HR + Boss',  icon: GitBranch,   tone: 'bg-blue-50 text-[#2447d8] border-blue-200' },
  { event: 'PD/DC approved',  to: 'HR',                 cc: 'Requester + Boss',       icon: GitBranch,   tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { event: 'HR acknowledged', to: 'Requester',          cc: 'PM + PD + Boss',         icon: BellRing,    tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { event: 'Rejected (any)',  to: 'Requester',          cc: 'All previous approvers', icon: FileWarning, tone: 'bg-red-50 text-red-700 border-red-200' },
]

// ── Reusable components (HR visual language) ─────────────────────────────────
function MetricCard({ label, value, note, color = ACE_BLUE, icon: Icon = Workflow }) {
  return (
    <div className="group min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_24px_70px_rgba(36,71,216,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `${color}12`, color }}>
          <Icon size={21} strokeWidth={2.3} />
        </div>
      </div>
      <div className="mt-5 truncate text-sm font-bold text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-black leading-none tracking-normal text-slate-950">{value}</div>
      {note && <div className="mt-2 min-h-[16px] text-xs font-semibold text-slate-400">{note}</div>}
    </div>
  )
}

function SectionCard({ children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.04)]">
      {children}
    </section>
  )
}

function SectionHead({ eyebrow, title, desc, right }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-[.1em] text-[#2447d8]">
            {eyebrow}
          </div>
        )}
        <h2 className="mt-2 text-xl font-black tracking-normal text-slate-950">{title}</h2>
        {desc && <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-slate-500">{desc}</p>}
      </div>
      {right}
    </div>
  )
}

function StepNode({ code }) {
  const meta = NODE_META[code]
  if (!meta) return null
  const Icon = meta.icon
  return (
    <div className="relative shrink-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm w-[136px]">
      <div className="mb-2 h-1 rounded-full" style={{ background: meta.color }} />
      <div className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-2xl text-white" style={{ background: meta.color }}>
          <Icon size={16} />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-[.08em] text-slate-400">{code}</div>
          <div className="text-xs font-black text-slate-900 leading-tight truncate">{meta.title}</div>
        </div>
      </div>
      <div className="mt-2 text-[10.5px] font-semibold leading-4 text-slate-500">{meta.desc}</div>
    </div>
  )
}

// ── Interactive Flow Editor ──────────────────────────────────────────────────
const FLOW_STORAGE_KEY = 'ace_email_flow_leave_v2'
const NODE_W = 150
const NODE_H = 92

const LEAVE_FLOWS = [
  { key: 'Sick',     label: 'Sick Leave',     color: '#dc2626', tone: 'bg-red-50 text-red-700 border-red-200' },
  { key: 'Personal', label: 'Personal Leave', color: '#d97706', tone: 'bg-amber-50 text-amber-800 border-amber-200' },
  { key: 'Annual',   label: 'Annual Leave',   color: '#2447d8', tone: 'bg-blue-50 text-[#2447d8] border-blue-200' },
  { key: 'Other',    label: 'Other Leave',    color: '#64748b', tone: 'bg-slate-100 text-slate-700 border-slate-300' },
]

// Per-leave-type default node layout + recommended edges.
// type: 'APPROVE' = solid blue, can reject, blocks flow.
// type: 'ACK'     = dashed gray, just informed, doesn't block.
//
// All four leave types share the same 5-column matrix:
//   Employee | PM | PD | HR | Boss
// Only the edges (and which approvers fire) differ.
const STANDARD_COLS = {
  REQ:  { x: 40,  y: 280 },
  PM:   { x: 220, y: 280 },
  PD:   { x: 400, y: 280 },
  HR:   { x: 580, y: 280 },
  BOSS: { x: 760, y: 280 },
}
const STANDARD_NODES = [
  { id: 'REQ',  role: 'REQ',  ...STANDARD_COLS.REQ },
  { id: 'PM',   role: 'PM',   ...STANDARD_COLS.PM },
  { id: 'PD',   role: 'PD',   ...STANDARD_COLS.PD },
  { id: 'HR',   role: 'HR',   ...STANDARD_COLS.HR },
  { id: 'BOSS', role: 'BOSS', ...STANDARD_COLS.BOSS },
]

const DEFAULT_FLOWS = {
  // Sick — HR is the only approver (mirrors backend leave.py: initial_status =
  // PENDING_HR for sick). PM / PD / Boss are CC'd at submit (so manager knows
  // to plan cover) and again at HR's decision (everyone closes the loop).
  Sick: {
    nodes: STANDARD_NODES,
    edges: [
      { from: 'REQ', to: 'HR',   type: 'APPROVE' },
      { from: 'REQ', to: 'PM',   type: 'ACK' },
      { from: 'REQ', to: 'PD',   type: 'ACK' },
      { from: 'REQ', to: 'BOSS', type: 'ACK' },
      { from: 'HR',  to: 'REQ',  type: 'ACK' },
      { from: 'HR',  to: 'PM',   type: 'ACK' },
    ],
  },
  // Personal / Annual / Other — 2-level approval (PM → PD), then PD CCs everyone.
  Personal: {
    nodes: STANDARD_NODES,
    edges: [
      { from: 'REQ', to: 'PM',   type: 'APPROVE' },
      { from: 'PM',  to: 'PD',   type: 'APPROVE' },
      { from: 'PD',  to: 'HR',   type: 'ACK' },
      { from: 'PD',  to: 'BOSS', type: 'ACK' },
      { from: 'PD',  to: 'REQ',  type: 'ACK' },
    ],
  },
  Annual: {
    nodes: STANDARD_NODES,
    edges: [
      { from: 'REQ', to: 'PM',   type: 'APPROVE' },
      { from: 'PM',  to: 'PD',   type: 'APPROVE' },
      { from: 'PD',  to: 'HR',   type: 'ACK' },
      { from: 'PD',  to: 'BOSS', type: 'ACK' },
      { from: 'PD',  to: 'REQ',  type: 'ACK' },
    ],
  },
  Other: {
    nodes: STANDARD_NODES,
    edges: [
      { from: 'REQ', to: 'PM',   type: 'APPROVE' },
      { from: 'PM',  to: 'PD',   type: 'APPROVE' },
      { from: 'PD',  to: 'HR',   type: 'ACK' },
      { from: 'PD',  to: 'BOSS', type: 'ACK' },
      { from: 'PD',  to: 'REQ',  type: 'ACK' },
    ],
  },
}

function normalizeEdge(e) {
  return { from: e.from, to: e.to, type: e.type === 'ACK' ? 'ACK' : 'APPROVE' }
}

// Migration registry — list keys here to force-reset specific tabs once per
// user. Bump a new key whenever the canonical default for that tab changes.
const FLOW_MIGRATIONS_KEY = 'ace_email_flow_migrations_v1'
const PENDING_MIGRATIONS = {
  // Re-seeds Sick with the new linear chain (superseded by matrix_v1).
  'sick_linear_chain_2026_05': 'Sick',
  // Matrix alignment from the ER diagram — 5-column layout, PD skipped on Sick.
  'matrix_v1_sick_2026_05':     'Sick',
  'matrix_v1_personal_2026_05': 'Personal',
  'matrix_v1_annual_2026_05':   'Annual',
  'matrix_v1_other_2026_05':    'Other',
  // v2 — Sick "skipped" PD still gets a CC for awareness.
  'matrix_v2_sick_2026_05':     'Sick',
  // v3 — Sick aligned to backend: HR is the approver, PM/PD/Boss are CC at submit
  //       and again at HR's decision (closes Peerapol E2E gap).
  'matrix_v3_sick_align_backend_2026_05': 'Sick',
}

function loadAllFlows() {
  try {
    // Apply any pending migrations (one-shot per user / per migration key)
    let migrations = {}
    try { migrations = JSON.parse(localStorage.getItem(FLOW_MIGRATIONS_KEY) || '{}') } catch {}
    let stored = null
    try { stored = JSON.parse(localStorage.getItem(FLOW_STORAGE_KEY) || 'null') } catch {}
    let mutated = false
    for (const [migKey, tabKey] of Object.entries(PENDING_MIGRATIONS)) {
      if (migrations[migKey]) continue
      stored = stored || {}
      stored[tabKey] = DEFAULT_FLOWS[tabKey]
      migrations[migKey] = new Date().toISOString().slice(0, 10)
      mutated = true
    }
    if (mutated) {
      try { localStorage.setItem(FLOW_MIGRATIONS_KEY, JSON.stringify(migrations)) } catch {}
      try { localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(stored)) } catch {}
    }

    if (!stored || typeof stored !== 'object') return null
    const result = {}
    for (const key of Object.keys(DEFAULT_FLOWS)) {
      const slot = stored[key]
      if (slot?.nodes && slot?.edges) {
        result[key] = {
          nodes: slot.nodes,
          edges: slot.edges.map(normalizeEdge),
        }
      } else {
        result[key] = DEFAULT_FLOWS[key]
      }
    }
    return result
  } catch {
    return null
  }
}

function saveAllFlows(flows) {
  try { localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(flows)) } catch {}
}

function initials(name) {
  return String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase() || '').join('')
}

// Stable hue from a string — so each person keeps a consistent color
function hashHue(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h % 360
}
function personColor(code) {
  const hue = hashHue(String(code || ''))
  return `hsl(${hue} 65% 45%)`
}

// Team approval policy: how does a TEAM node resolve when used on an APPROVE line?
const TEAM_POLICIES = [
  { key: 'LEAD', label: 'Team Lead', short: 'LEAD', icon: Target,    color: '#2447d8', desc: 'Lead decides on behalf of the team (fast)' },
  { key: 'ANY',  label: 'Any-of',    short: 'ANY',  icon: Zap,       color: '#d97706', desc: 'First member to act approves (flexible)' },
  { key: 'ALL',  label: 'All-of',    short: 'ALL',  icon: Handshake, color: '#dc2626', desc: 'Every member must approve (slow, high-stakes)' },
]
const POLICY_BY_KEY = Object.fromEntries(TEAM_POLICIES.map(p => [p.key, p]))

function teamColor(code) {
  const hue = hashHue(`TEAM:${code}`)
  return `hsl(${hue} 55% 40%)`
}

function FlowEditor() {
  const initial = useMemo(() => loadAllFlows() || DEFAULT_FLOWS, [])
  const [flows, setFlows]         = useState(initial)
  const [activeLeave, setActive]  = useState('Annual')
  const [newEdgeType, setNewType] = useState('APPROVE')
  const [connectFrom, setConnectFrom] = useState(null)
  const [hoverEdge, setHoverEdge]     = useState(null)
  const [employees, setEmployees]     = useState([])
  const [employeesLoading, setEmployeesLoading] = useState(false)
  const [pickerOpen, setPickerOpen]   = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')
  const [teamPickerOpen, setTeamPickerOpen] = useState(false)
  const [viewingTeam, setViewingTeam] = useState(null)
  const [fullscreen, setFullscreen] = useState(false)
  const canvasRef = useRef(null)
  const dragRef   = useRef(null)
  const pickerRef = useRef(null)
  const teamPickerRef = useRef(null)

  const current = flows[activeLeave] || DEFAULT_FLOWS[activeLeave]
  const nodes = current.nodes
  const edges = current.edges

  const setNodes = updater => setFlows(prev => {
    const cur = prev[activeLeave] || DEFAULT_FLOWS[activeLeave]
    const next = typeof updater === 'function' ? updater(cur.nodes) : updater
    return { ...prev, [activeLeave]: { ...cur, nodes: next } }
  })
  const setEdges = updater => setFlows(prev => {
    const cur = prev[activeLeave] || DEFAULT_FLOWS[activeLeave]
    const next = typeof updater === 'function' ? updater(cur.edges) : updater
    return { ...prev, [activeLeave]: { ...cur, edges: next } }
  })

  useEffect(() => { saveAllFlows(flows) }, [flows])

  // Esc cancels connect mode / pickers / modal / fullscreen
  useEffect(() => {
    const h = e => {
      if (e.key === 'Escape') {
        if (viewingTeam) { setViewingTeam(null); return }
        if (pickerOpen || teamPickerOpen) { setPickerOpen(false); setTeamPickerOpen(false); return }
        if (connectFrom) { setConnectFrom(null); return }
        if (fullscreen) { setFullscreen(false); return }
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [viewingTeam, pickerOpen, teamPickerOpen, connectFrom, fullscreen])

  // Lock body scroll in fullscreen
  useEffect(() => {
    if (!fullscreen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [fullscreen])

  // Click outside closes pickers
  useEffect(() => {
    if (!pickerOpen) return
    const h = e => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false)
    }
    window.addEventListener('mousedown', h)
    return () => window.removeEventListener('mousedown', h)
  }, [pickerOpen])

  useEffect(() => {
    if (!teamPickerOpen) return
    const h = e => {
      if (teamPickerRef.current && !teamPickerRef.current.contains(e.target)) setTeamPickerOpen(false)
    }
    window.addEventListener('mousedown', h)
    return () => window.removeEventListener('mousedown', h)
  }, [teamPickerOpen])

  // Load employees once when any picker or team viewer opens
  useEffect(() => {
    if ((!pickerOpen && !teamPickerOpen && !viewingTeam) || employees.length || employeesLoading) return
    setEmployeesLoading(true)
    apiFetch('/api/employees')
      .then(r => r.ok ? r.json() : { data: [] })
      .then(d => setEmployees(Array.isArray(d.data) ? d.data : []))
      .catch(() => setEmployees([]))
      .finally(() => setEmployeesLoading(false))
  }, [pickerOpen, teamPickerOpen, viewingTeam, employees.length, employeesLoading])

  // Derive teams from loaded employees by grouping on `project_team`
  const teams = useMemo(() => {
    const map = new Map()
    employees.forEach(e => {
      const code = (e.project_team || '').trim()
      if (!code) return
      const slot = map.get(code) || { code, count: 0, departments: new Set(), members: [] }
      slot.count += 1
      if (e.department) slot.departments.add(e.department)
      slot.members.push({ employee_code: e.employee_code, full_name: e.full_name, position: e.position })
      map.set(code, slot)
    })
    return Array.from(map.values())
      .map(t => ({ ...t, departments: Array.from(t.departments) }))
      .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code))
  }, [employees])

  function nextFreeSlot() {
    // simple grid placement, top-left scanning
    const cols = 6, padX = 30, padY = 30, stepX = NODE_W + 30, stepY = NODE_H + 30
    for (let i = 0; i < 60; i++) {
      const x = padX + (i % cols) * stepX
      const y = padY + Math.floor(i / cols) * stepY
      const taken = nodes.some(n => Math.abs(n.x - x) < 20 && Math.abs(n.y - y) < 20)
      if (!taken) return { x, y }
    }
    return { x: 40 + (nodes.length % 10) * 20, y: 40 + (nodes.length % 10) * 20 }
  }

  function addEmployeeNode(emp) {
    const id = `EMP:${emp.employee_code}`
    if (nodes.find(n => n.id === id)) {
      setPickerOpen(false)
      setPickerSearch('')
      return
    }
    const slot = nextFreeSlot()
    setNodes(prev => [...prev, {
      id,
      role: 'EMPLOYEE',
      label: emp.full_name || emp.employee_code,
      sub:   emp.position || emp.job_title || emp.department || '',
      code:  emp.employee_code,
      ...slot,
    }])
    setPickerOpen(false)
    setPickerSearch('')
  }

  function addTeamNode(team) {
    const id = `TEAM:${team.code}`
    if (nodes.find(n => n.id === id)) {
      setTeamPickerOpen(false)
      return
    }
    const slot = nextFreeSlot()
    setNodes(prev => [...prev, {
      id,
      role: 'TEAM',
      teamCode: team.code,
      label: `${team.code} Team`,
      sub:    team.departments[0] || 'Project team',
      members: team.count,
      policy: 'LEAD',
      ...slot,
    }])
    setTeamPickerOpen(false)
  }

  function cycleTeamPolicy(id) {
    setNodes(prev => prev.map(n => {
      if (n.id !== id || n.role !== 'TEAM') return n
      const idx = TEAM_POLICIES.findIndex(p => p.key === (n.policy || 'LEAD'))
      const next = TEAM_POLICIES[(idx + 1) % TEAM_POLICIES.length]
      return { ...n, policy: next.key }
    }))
  }

  function removeNode(id) {
    setNodes(prev => prev.filter(n => n.id !== id))
    setEdges(prev => prev.filter(e => e.from !== id && e.to !== id))
    if (connectFrom === id) setConnectFrom(null)
  }

  const filteredEmployees = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase()
    if (!q) return employees.slice(0, 200)
    return employees.filter(e => {
      const hay = `${e.full_name || ''} ${e.employee_code || ''} ${e.position || ''} ${e.department || ''}`.toLowerCase()
      return hay.includes(q)
    }).slice(0, 200)
  }, [employees, pickerSearch])

  function onNodeMouseDown(e, node) {
    if (e.button !== 0) return
    if (e.target.closest('[data-handle]')) return // handle has its own click
    const rect = canvasRef.current.getBoundingClientRect()
    dragRef.current = {
      id: node.id,
      offsetX: e.clientX - rect.left - node.x,
      offsetY: e.clientY - rect.top - node.y,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
    }
  }

  function onCanvasMouseMove(e) {
    const d = dragRef.current
    if (!d) return
    if (!d.moved && (Math.abs(e.clientX - d.startX) > 3 || Math.abs(e.clientY - d.startY) > 3)) {
      d.moved = true
    }
    if (!d.moved) return
    const rect = canvasRef.current.getBoundingClientRect()
    const nx = Math.max(0, Math.min(rect.width - NODE_W,  e.clientX - rect.left - d.offsetX))
    const ny = Math.max(0, Math.min(rect.height - NODE_H, e.clientY - rect.top  - d.offsetY))
    setNodes(prev => prev.map(n => n.id === d.id ? { ...n, x: nx, y: ny } : n))
  }

  function onNodeMouseUp(e, node) {
    const d = dragRef.current
    dragRef.current = null
    if (d && !d.moved && connectFrom && connectFrom !== node.id) {
      if (!edges.some(ed => ed.from === connectFrom && ed.to === node.id)) {
        setEdges(prev => [...prev, { from: connectFrom, to: node.id, type: newEdgeType }])
      }
      setConnectFrom(null)
    }
  }

  function onCanvasMouseUp() {
    dragRef.current = null
  }

  function toggleEdge(idx) {
    setEdges(prev => prev.map((e, i) =>
      i === idx ? { ...e, type: e.type === 'APPROVE' ? 'ACK' : 'APPROVE' } : e
    ))
  }

  function removeEdge(idx) {
    setEdges(prev => prev.filter((_, i) => i !== idx))
  }

  function resetGraph() {
    const lt = LEAVE_FLOWS.find(l => l.key === activeLeave)
    if (!confirm(`Reset "${lt?.label}" flow to recommended default?`)) return
    setFlows(prev => ({ ...prev, [activeLeave]: DEFAULT_FLOWS[activeLeave] }))
    setConnectFrom(null)
  }

  function clearEdges() {
    if (!confirm('Remove all connections in this flow?')) return
    setEdges([])
  }

  // Move (toX, toY) back toward (fromX, fromY) until it touches the bounding box
  // around (toX, toY). Used so arrowheads aren't hidden by the destination card.
  function trimToBox(fromX, fromY, toX, toY, halfW, halfH) {
    const dx = fromX - toX, dy = fromY - toY
    if (dx === 0 && dy === 0) return { x: toX, y: toY }
    const sx = Math.abs(dx) > 0 ? halfW / Math.abs(dx) : Infinity
    const sy = Math.abs(dy) > 0 ? halfH / Math.abs(dy) : Infinity
    const s  = Math.min(sx, sy, 1)
    return { x: toX + dx * s, y: toY + dy * s }
  }

  function curvePath(a, b) {
    const cx1 = a.x + NODE_W / 2, cy1 = a.y + NODE_H / 2
    const cx2 = b.x + NODE_W / 2, cy2 = b.y + NODE_H / 2
    const start = trimToBox(cx2, cy2, cx1, cy1, NODE_W / 2, NODE_H / 2)
    const end   = trimToBox(cx1, cy1, cx2, cy2, NODE_W / 2 + 8, NODE_H / 2 + 8)
    const dx = Math.max(30, Math.abs(end.x - start.x) * 0.4)
    return `M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${end.x - dx} ${end.y}, ${end.x} ${end.y}`
  }

  function edgeMidpoint(a, b) {
    return { x: (a.x + b.x) / 2 + NODE_W / 2, y: (a.y + b.y) / 2 + NODE_H / 2 }
  }

  const activeLeaveMeta = LEAVE_FLOWS.find(l => l.key === activeLeave) || LEAVE_FLOWS[0]
  const approveCount = edges.filter(e => e.type === 'APPROVE').length
  const ackCount     = edges.length - approveCount

  return (
    <div className={fullscreen ? 'fixed inset-0 z-50 bg-[#f5f7fb] overflow-y-auto p-4 sm:p-6' : ''}>
      {/* ── Leave-type tabs ─────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
        <span className="px-2 text-[10.5px] font-black uppercase tracking-[.12em] text-slate-400">Leave type</span>
        {LEAVE_FLOWS.map(lt => {
          const isActive = lt.key === activeLeave
          return (
            <button key={lt.key} onClick={() => { setActive(lt.key); setConnectFrom(null) }}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[12.5px] font-black transition
                      ${isActive ? 'border-transparent bg-white shadow-sm' : 'border-transparent text-slate-500 hover:bg-white/70'}`}
                    style={isActive ? { color: lt.color, boxShadow: `inset 0 0 0 1px ${lt.color}30, 0 1px 2px rgba(15,23,42,.06)` } : undefined}>
              <span className="h-2 w-2 rounded-full" style={{ background: lt.color }} />
              {lt.label}
            </button>
          )
        })}
      </div>

      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black ${activeLeaveMeta.tone}`}>
          <MousePointer2 size={13} />
          Editing <strong>{activeLeaveMeta.label}</strong> · drag node · click + then another node to connect
        </div>
        <div className="ml-auto flex gap-2 relative">
          <div ref={pickerRef} className="relative">
            <button onClick={() => setPickerOpen(o => !o)}
                    className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-black shadow-sm transition
                      ${pickerOpen ? 'border-[#2447d8] bg-blue-50 text-[#2447d8]' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
              <Plus size={14} /> Add person
            </button>
            {pickerOpen && (
              <div className="absolute right-0 top-full z-30 mt-2 w-[360px] rounded-2xl border border-slate-200 bg-white shadow-xl">
                <div className="border-b border-slate-100 p-3">
                  <input
                    autoFocus
                    value={pickerSearch}
                    onChange={e => setPickerSearch(e.target.value)}
                    placeholder="Search by name, code, position, dept…"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none focus:border-[#2447d8] focus:bg-white focus:ring-4 focus:ring-blue-100" />
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  {employeesLoading ? (
                    <div className="px-4 py-6 text-center text-xs font-bold text-slate-400">Loading employees…</div>
                  ) : filteredEmployees.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs font-bold text-slate-400">
                      {employees.length ? 'No match' : 'No employees loaded'}
                    </div>
                  ) : (
                    filteredEmployees.map(emp => {
                      const id = `EMP:${emp.employee_code}`
                      const already = nodes.some(n => n.id === id)
                      return (
                        <button key={emp.employee_code}
                                disabled={already}
                                onClick={() => addEmployeeNode(emp)}
                                className={`flex w-full items-center gap-3 border-b border-slate-50 px-3 py-2.5 text-left transition last:border-0
                                  ${already ? 'cursor-not-allowed opacity-40' : 'hover:bg-blue-50'}`}>
                          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[11px] font-black text-white"
                               style={{ background: personColor(emp.employee_code) }}>
                            {initials(emp.full_name) || '?'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[13px] font-black text-slate-900">{emp.full_name || emp.employee_code}</div>
                            <div className="truncate text-[11px] font-semibold text-slate-500">
                              {emp.position || emp.job_title || '—'}
                              {emp.department ? ` · ${emp.department}` : ''}
                            </div>
                          </div>
                          <div className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-black text-slate-500">
                            {emp.employee_code}
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
                <div className="border-t border-slate-100 bg-slate-50 px-3 py-2 text-[10.5px] font-bold text-slate-500">
                  {employees.length} loaded · click to add to canvas
                </div>
              </div>
            )}
          </div>

          {/* Add team picker */}
          <div ref={teamPickerRef} className="relative">
            <button onClick={() => setTeamPickerOpen(o => !o)}
                    className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-black shadow-sm transition
                      ${teamPickerOpen ? 'border-[#2447d8] bg-blue-50 text-[#2447d8]' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
              <UsersRound size={14} /> Add team
            </button>
            {teamPickerOpen && (
              <div className="absolute right-0 top-full z-30 mt-2 w-[320px] rounded-2xl border border-slate-200 bg-white shadow-xl">
                <div className="border-b border-slate-100 px-3 py-2 text-[10.5px] font-black uppercase tracking-[.12em] text-slate-400">
                  Project teams (from /api/employees)
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  {employeesLoading ? (
                    <div className="px-4 py-6 text-center text-xs font-bold text-slate-400">Loading teams…</div>
                  ) : teams.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs font-bold text-slate-400">
                      No teams found in employee data
                    </div>
                  ) : (
                    teams.map(t => {
                      const id = `TEAM:${t.code}`
                      const already = nodes.some(n => n.id === id)
                      return (
                        <button key={t.code}
                                disabled={already}
                                onClick={() => addTeamNode(t)}
                                className={`flex w-full items-center gap-3 border-b border-slate-50 px-3 py-2.5 text-left transition last:border-0
                                  ${already ? 'cursor-not-allowed opacity-40' : 'hover:bg-blue-50'}`}>
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl text-white"
                               style={{ background: teamColor(t.code) }}>
                            <UsersRound size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[13px] font-black text-slate-900">{t.code} Team</div>
                            <div className="truncate text-[11px] font-semibold text-slate-500">
                              {t.departments.join(' · ') || '—'}
                            </div>
                          </div>
                          <div className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-black text-slate-600">
                            {t.count} ppl
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
                <div className="border-t border-slate-100 bg-slate-50 px-3 py-2 text-[10.5px] font-bold text-slate-500">
                  {teams.length} teams · default policy = LEAD
                </div>
              </div>
            )}
          </div>

          <button onClick={clearEdges}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm transition hover:bg-slate-50">
            <Trash2 size={14} /> Clear lines
          </button>
          <button onClick={resetGraph}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm transition hover:bg-slate-50">
            <RotateCcw size={14} /> Reset
          </button>
          <button onClick={() => setFullscreen(f => !f)}
                  title={fullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-black shadow-sm transition
                    ${fullscreen ? 'border-[#2447d8] bg-blue-50 text-[#2447d8]' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
            {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            {fullscreen ? 'Exit' : 'Fullscreen'}
          </button>
        </div>
      </div>

      {/* ── Edge-type selector + legend ─────────────────────── */}
      <div className="mb-3 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <span className="text-[10.5px] font-black uppercase tracking-[.12em] text-slate-400">New line type</span>
        <button onClick={() => setNewType('APPROVE')}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[12px] font-black transition
                  ${newEdgeType === 'APPROVE' ? 'border-[#2447d8] bg-blue-50 text-[#2447d8]' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>
          <svg width="28" height="6" viewBox="0 0 28 6"><line x1="0" y1="3" x2="28" y2="3" stroke="#2447d8" strokeWidth="2.5" /></svg>
          อนุมัติ (Approve)
        </button>
        <button onClick={() => setNewType('ACK')}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[12px] font-black transition
                  ${newEdgeType === 'ACK' ? 'border-slate-400 bg-slate-100 text-slate-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>
          <svg width="28" height="6" viewBox="0 0 28 6"><line x1="0" y1="3" x2="28" y2="3" stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="5 3" /></svg>
          รับทราบ (CC)
        </button>
        <div className="ml-auto flex items-center gap-3 text-[11px] font-bold text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#2447d8]" />
            {approveCount} approve
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            {ackCount} ack
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        onMouseMove={onCanvasMouseMove}
        onMouseUp={onCanvasMouseUp}
        onMouseLeave={onCanvasMouseUp}
        style={{ height: fullscreen ? 'calc(100vh - 320px)' : 760 }}
        className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.06)_1px,transparent_0)] [background-size:20px_20px] bg-slate-50">

        {/* Edges (SVG) */}
        <svg className="absolute inset-0 h-full w-full" style={{ pointerEvents: 'none' }}>
          <defs>
            <marker id="ace-arrow-approve" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="11" markerHeight="11" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
              <path d="M 0 0 L 12 6 L 0 12 L 3 6 z" fill="#2447d8" />
            </marker>
            <marker id="ace-arrow-ack" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="11" markerHeight="11" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
              <path d="M 0 0 L 12 6 L 0 12 L 3 6 z" fill="#94a3b8" />
            </marker>
          </defs>
          {edges.map((e, idx) => {
            const from = nodes.find(n => n.id === e.from)
            const to   = nodes.find(n => n.id === e.to)
            if (!from || !to) return null
            const mid = edgeMidpoint(from, to)
            const isApprove = e.type !== 'ACK'
            const color  = isApprove ? '#2447d8' : '#94a3b8'
            const dash   = isApprove ? undefined : '8 5'
            const isHover = hoverEdge === idx
            return (
              <g key={`${e.from}-${e.to}-${idx}`}
                 style={{ pointerEvents: 'auto' }}
                 onMouseEnter={() => setHoverEdge(idx)}
                 onMouseLeave={() => setHoverEdge(h => h === idx ? null : h)}>
                {/* hit area (toggle on click) */}
                <path d={curvePath(from, to)} stroke="transparent" strokeWidth="20" fill="none"
                      className="cursor-pointer"
                      onClick={() => toggleEdge(idx)}>
                  <title>{isApprove ? 'Approve — click to switch to CC' : 'CC — click to switch to Approve'}</title>
                </path>
                {/* visible line */}
                <path d={curvePath(from, to)}
                      stroke={color} strokeWidth={isApprove ? 2.6 : 2}
                      strokeDasharray={dash} fill="none"
                      markerEnd={`url(#ace-arrow-${isApprove ? 'approve' : 'ack'})`}
                      style={{ pointerEvents: 'none' }} />
                {/* mid label */}
                <g transform={`translate(${mid.x}, ${mid.y})`} style={{ pointerEvents: 'none' }}>
                  <rect x="-22" y="-9" width="44" height="18" rx="9"
                        fill="#fff" stroke={color} strokeWidth="1.3" />
                  <text x="0" y="3.5" textAnchor="middle" fontSize="9.5" fontWeight="900"
                        fill={color} style={{ fontFamily: 'inherit', letterSpacing: '.05em' }}>
                    {isApprove ? 'APPROVE' : 'CC'}
                  </text>
                </g>
                {/* hover delete button */}
                {isHover && (
                  <g transform={`translate(${mid.x + 32}, ${mid.y})`} style={{ pointerEvents: 'auto' }}
                     className="cursor-pointer"
                     onClick={(ev) => { ev.stopPropagation(); removeEdge(idx) }}>
                    <circle r="10" fill="#dc2626" />
                    <path d="M -4 -4 L 4 4 M 4 -4 L -4 4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
                    <title>Delete connection</title>
                  </g>
                )}
              </g>
            )
          })}

          {/* Pending connect line follows nothing; show a hint dot on source */}
          {connectFrom && (() => {
            const n = nodes.find(x => x.id === connectFrom)
            if (!n) return null
            return (
              <circle cx={n.x + NODE_W / 2} cy={n.y + NODE_H / 2} r="60"
                      fill="none" stroke="#2447d8" strokeWidth="2" strokeDasharray="6 5">
                <animate attributeName="r" from="40" to="60" dur="1.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.8" to="0" dur="1.2s" repeatCount="indefinite" />
              </circle>
            )
          })()}
        </svg>

        {/* Nodes */}
        {nodes.map(n => {
          const meta = NODE_META[n.role]
          const isEmployee = n.role === 'EMPLOYEE'
          const isTeam     = n.role === 'TEAM'
          const color = isEmployee ? personColor(n.code)
                       : isTeam    ? teamColor(n.teamCode)
                                   : (meta?.color || '#64748b')
          const Icon  = meta?.icon
          const topLabel = isEmployee ? (n.code || 'STAFF')
                         : isTeam     ? `TEAM · ${n.teamCode}`
                                       : n.role
          const title    = isEmployee || isTeam ? n.label : (meta?.title || n.role)
          const sub      = isEmployee ? (n.sub || 'Employee')
                         : isTeam     ? `${n.members || 0} members${n.sub ? ` · ${n.sub}` : ''}`
                                       : (meta?.desc || '')
          const policy = isTeam ? POLICY_BY_KEY[n.policy || 'LEAD'] : null
          const PolicyIcon = policy?.icon
          const isFrom   = connectFrom === n.id
          const isTarget = connectFrom && connectFrom !== n.id
          return (
            <div key={n.id}
                 onMouseDown={e => onNodeMouseDown(e, n)}
                 onMouseUp={e => onNodeMouseUp(e, n)}
                 className={`group absolute select-none rounded-2xl border bg-white p-3 shadow-md transition
                   ${isFrom    ? 'border-[#2447d8] ring-4 ring-blue-200' : 'border-slate-200'}
                   ${isTarget  ? 'cursor-pointer hover:border-emerald-400 hover:ring-4 hover:ring-emerald-100' : 'cursor-grab active:cursor-grabbing'}
                 `}
                 style={{ left: n.x, top: n.y, width: NODE_W, height: NODE_H }}>
              <div className="mb-2 h-1 rounded-full" style={{ background: color }} />
              <div className="flex items-center gap-2">
                {isTeam ? (
                  <div className="relative h-9 w-9 shrink-0">
                    {/* Stacked avatars hint */}
                    <div className="absolute right-0 top-0 grid h-8 w-8 place-items-center rounded-2xl text-white" style={{ background: color }}>
                      <UsersRound size={14} />
                    </div>
                    <div className="absolute left-0 bottom-0 grid h-6 w-6 place-items-center rounded-xl bg-white text-[9px] font-black shadow border border-slate-200" style={{ color }}>
                      +{Math.max(0, (n.members || 1) - 1)}
                    </div>
                  </div>
                ) : (
                  <div className="grid h-9 w-9 place-items-center rounded-2xl text-white shrink-0 text-[11px] font-black"
                       style={{ background: color }}>
                    {isEmployee ? (initials(n.label) || '?') : Icon ? <Icon size={16} /> : '?'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-[.08em] text-slate-400 truncate">{topLabel}</div>
                  <div className="text-xs font-black text-slate-900 leading-tight truncate" title={title}>{title}</div>
                  <div className="text-[10px] font-semibold text-slate-500 truncate" title={sub}>{sub}</div>
                </div>
              </div>

              {/* Bottom action pill (TEAM nodes only): view members + policy */}
              {isTeam && policy && (
                <div data-handle
                     className="absolute -bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center overflow-hidden rounded-full border-2 border-white shadow-md">
                  <button onMouseDown={e => e.stopPropagation()}
                          onClick={e => { e.stopPropagation(); setViewingTeam(n) }}
                          title="View team members"
                          className="grid h-6 w-7 place-items-center bg-slate-800 text-white transition hover:bg-slate-950">
                    <Eye size={11} />
                  </button>
                  <button onMouseDown={e => e.stopPropagation()}
                          onClick={e => { e.stopPropagation(); cycleTeamPolicy(n.id) }}
                          title={`${policy.label} — ${policy.desc}. Click to cycle.`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black text-white transition hover:brightness-110"
                          style={{ background: policy.color }}>
                    {PolicyIcon && <PolicyIcon size={10} />}
                    {policy.short}
                  </button>
                </div>
              )}

              {/* Delete handle (top-left) */}
              <button data-handle
                      onMouseDown={e => e.stopPropagation()}
                      onClick={e => { e.stopPropagation(); removeNode(n.id) }}
                      className="absolute -left-2.5 -top-2.5 grid h-6 w-6 place-items-center rounded-full bg-white text-slate-400 shadow border border-slate-200 opacity-0 transition hover:bg-red-50 hover:text-red-600 hover:border-red-200 group-hover:opacity-100"
                      title="Remove node">
                <Trash2 size={11} />
              </button>

              {/* Connect handle (top-right) */}
              <button data-handle
                      onMouseDown={e => e.stopPropagation()}
                      onClick={e => { e.stopPropagation(); setConnectFrom(isFrom ? null : n.id) }}
                      className={`absolute -right-2.5 -top-2.5 grid h-7 w-7 place-items-center rounded-full text-white shadow-lg transition
                        ${isFrom ? 'bg-red-500 hover:bg-red-600' : 'bg-[#2447d8] hover:bg-[#1d3bb8]'}`}
                      title={isFrom ? 'Cancel' : 'Connect to another node'}>
                {isFrom ? <span className="text-[14px] font-black leading-none">×</span> : <Plus size={14} />}
              </button>
            </div>
          )
        })}

        {/* Bottom helper */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="rounded-xl bg-white/90 px-3 py-1.5 text-[11px] font-bold text-slate-500 shadow-sm backdrop-blur">
            <strong className="font-black" style={{ color: activeLeaveMeta.color }}>{activeLeaveMeta.label}</strong>
            &nbsp;· {nodes.length} nodes · {approveCount} approve · {ackCount} CC
          </div>
          {connectFrom && (
            <div className={`rounded-xl px-3 py-1.5 text-[11.5px] font-black text-white shadow-lg pointer-events-auto
              ${newEdgeType === 'APPROVE' ? 'bg-[#2447d8]' : 'bg-slate-500'}`}>
              Click target → creates <strong>{newEdgeType === 'APPROVE' ? 'APPROVE' : 'CC'}</strong> line ·&nbsp;
              <button onClick={() => setConnectFrom(null)} className="underline">Esc</button>
            </div>
          )}
        </div>
      </div>

      {/* Adjacency summary — split Approve vs CC */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {nodes.map(n => {
          const meta = NODE_META[n.role]
          const isEmployee = n.role === 'EMPLOYEE'
          const isTeam     = n.role === 'TEAM'
          const color = isEmployee ? personColor(n.code)
                       : isTeam    ? teamColor(n.teamCode)
                                   : (meta?.color || '#64748b')
          const title = isEmployee || isTeam ? n.label : (meta?.title || n.role)
          const nameOf = id => {
            const m = nodes.find(x => x.id === id)
            if (!m) return id
            if (m.role === 'EMPLOYEE') return m.label
            if (m.role === 'TEAM') {
              const p = POLICY_BY_KEY[m.policy || 'LEAD']
              return `${m.label} [${p?.short || 'LEAD'}]`
            }
            return NODE_META[m.role]?.title || m.role
          }
          const out = edges.filter(e => e.from === n.id)
          const inn = edges.filter(e => e.to   === n.id)
          const outApprove = out.filter(e => e.type !== 'ACK').map(e => nameOf(e.to))
          const outAck     = out.filter(e => e.type === 'ACK').map(e => nameOf(e.to))
          const inApprove  = inn.filter(e => e.type !== 'ACK').map(e => nameOf(e.from))
          const inAck      = inn.filter(e => e.type === 'ACK').map(e => nameOf(e.from))
          const Pill = ({ tone, label }) => (
            <span className={`mr-1 inline-block rounded-md px-1.5 py-0.5 text-[10.5px] font-black
              ${tone === 'approve' ? 'bg-blue-50 text-[#2447d8]' : 'bg-slate-100 text-slate-600'}`}>{label}</span>
          )
          return (
            <div key={n.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-lg text-white text-[10px] font-black" style={{ background: color }}>
                  {isEmployee ? (initials(n.label) || '?')
                              : isTeam ? <UsersRound size={13} />
                                       : (meta?.icon ? <meta.icon size={13} /> : '?')}
                </div>
                <div className="text-xs font-black text-slate-900 truncate" title={title}>{title}</div>
                {isTeam && (() => {
                  const p = POLICY_BY_KEY[n.policy || 'LEAD']
                  return (
                    <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9.5px] font-black text-white"
                          style={{ background: p.color }} title={p.desc}>
                      {p.short}
                    </span>
                  )
                })()}
                <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-black text-slate-500">
                  {isEmployee ? n.code : isTeam ? `${n.members}p` : n.role}
                </span>
              </div>
              <div className="mt-2 grid gap-1.5 text-[11.5px] font-semibold">
                <div className="text-slate-600">
                  <span className="font-black text-slate-400">→ Approves: </span>
                  {outApprove.length ? outApprove.map(x => <Pill key={x} tone="approve" label={x} />) : <span className="text-slate-300">—</span>}
                </div>
                <div className="text-slate-600">
                  <span className="font-black text-slate-400">→ Informs (CC): </span>
                  {outAck.length ? outAck.map(x => <Pill key={x} tone="ack" label={x} />) : <span className="text-slate-300">—</span>}
                </div>
                <div className="text-slate-600">
                  <span className="font-black text-slate-400">← Needs approval from: </span>
                  {inApprove.length ? inApprove.map(x => <Pill key={x} tone="approve" label={x} />) : <span className="text-slate-300">—</span>}
                </div>
                <div className="text-slate-600">
                  <span className="font-black text-slate-400">← Informed by: </span>
                  {inAck.length ? inAck.map(x => <Pill key={x} tone="ack" label={x} />) : <span className="text-slate-300">—</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Team Members Modal ────────────────────────────────── */}
      {viewingTeam && (
        <TeamMembersModal team={viewingTeam}
                          employees={employees}
                          loading={employeesLoading}
                          onClose={() => setViewingTeam(null)} />
      )}
    </div>
  )
}

function TeamMembersModal({ team, employees, loading, onClose }) {
  const [search, setSearch] = useState('')
  const members = useMemo(() => {
    const q = search.trim().toLowerCase()
    const base = employees.filter(e => (e.project_team || '').trim() === team.teamCode)
    if (!q) return base
    return base.filter(e => {
      const hay = `${e.full_name || ''} ${e.employee_code || ''} ${e.position || ''} ${e.department || ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [employees, team.teamCode, search])

  const policy = POLICY_BY_KEY[team.policy || 'LEAD']
  const totalForTeam = employees.filter(e => (e.project_team || '').trim() === team.teamCode).length

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
         onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
           style={{ maxHeight: '85vh' }}>
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <div className="grid h-11 w-11 place-items-center rounded-2xl text-white shadow"
               style={{ background: teamColor(team.teamCode) }}>
            <UsersRound size={19} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-base font-black text-slate-950 leading-tight">{team.label}</div>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] font-bold text-slate-500">
              <span>{totalForTeam} member{totalForTeam === 1 ? '' : 's'}</span>
              <span className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-black text-white"
                    style={{ background: policy.color }}>
                {React.createElement(policy.icon, { size: 9 })}
                {policy.short}
              </span>
            </div>
          </div>
          <button onClick={onClose}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                  aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-slate-100 p-3">
          <input value={search} onChange={e => setSearch(e.target.value)}
                 autoFocus
                 placeholder="Search members by name, code, position…"
                 className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900 outline-none transition focus:border-[#2447d8] focus:bg-white focus:ring-4 focus:ring-blue-100" />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-10 text-center text-xs font-bold text-slate-400">Loading members…</div>
          ) : members.length === 0 ? (
            <div className="px-4 py-10 text-center text-xs font-bold text-slate-400">
              {totalForTeam === 0
                ? `No employees with project_team = "${team.teamCode}"`
                : 'No member matches the search.'}
            </div>
          ) : (
            members.map(emp => (
              <div key={emp.employee_code}
                   className="flex items-center gap-3 border-b border-slate-50 px-4 py-2.5 last:border-0 hover:bg-slate-50">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[11px] font-black text-white"
                     style={{ background: personColor(emp.employee_code) }}>
                  {initials(emp.full_name) || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-black text-slate-900">{emp.full_name || emp.employee_code}</div>
                  <div className="truncate text-[11px] font-semibold text-slate-500">
                    {emp.position || emp.job_title || '—'}
                    {emp.department ? ` · ${emp.department}` : ''}
                  </div>
                </div>
                <div className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-black text-slate-500">
                  {emp.employee_code}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-[11px] font-bold text-slate-500">
          Showing {members.length} of {totalForTeam} · policy&nbsp;
          <span className="font-black" style={{ color: policy.color }}>{policy.label}</span>
          &nbsp;decides who actually gets approve emails (CC always goes to all).
        </div>
      </div>
    </div>
  )
}

function ChainRow({ chain, mode }) {
  const expanded = []
  chain.forEach((c, i) => {
    expanded.push(c)
    if (c === 'PM' && mode === 'FULL' && chain[i + 1] === 'PD') expanded.push('SPM')
  })
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {expanded.map((c, i) => (
        <React.Fragment key={`${c}-${i}`}>
          <StepNode code={c} />
          {i < expanded.length - 1 && <ArrowRight className="text-slate-300 shrink-0" size={18} />}
        </React.Fragment>
      ))}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function EmailFlowPage({ authenticatedUser, onLogout }) {
  const [mode, setMode]                         = useState('SHORT')
  const [originalMode, setOriginalMode]         = useState('SHORT')
  const [entitlements, setEntitlements]         = useState({})
  const [originalEntitlements, setOriginalEnt]  = useState({})
  const [loading, setLoading]                   = useState(true)
  const [saving, setSaving]                     = useState(false)
  const [flash, setFlash]                       = useState(null)

  function showFlash(msg, type = 'ok') {
    setFlash({ msg, type })
    setTimeout(() => setFlash(null), 3200)
  }

  async function load() {
    setLoading(true)
    try {
      const [chainRes, policyRes] = await Promise.all([
        apiFetch('/api/leave/chain-mode'),
        apiFetch('/api/leave/policy'),
      ])
      const chain  = await chainRes.json().catch(() => ({}))
      const policy = await policyRes.json().catch(() => ({}))
      const nextMode = (chain.mode || 'SHORT').toUpperCase()
      const nextEnt  = { ...(policy.entitlements || {}) }
      setMode(nextMode); setOriginalMode(nextMode)
      setEntitlements(nextEnt); setOriginalEnt({ ...nextEnt })
    } catch {
      showFlash('Failed to load settings', 'err')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const dirty = useMemo(() => {
    if (mode !== originalMode) return true
    const norm = obj => JSON.stringify(
      Object.keys(obj).sort().reduce((acc, k) => {
        const v = obj[k]
        acc[k] = v == null || v === '' ? null : Number(v)
        return acc
      }, {})
    )
    return norm(entitlements) !== norm(originalEntitlements)
  }, [mode, originalMode, entitlements, originalEntitlements])

  async function save() {
    setSaving(true)
    try {
      const work = []
      if (mode !== originalMode) {
        work.push(apiFetch('/api/leave/chain-mode', { method: 'POST', body: JSON.stringify({ mode }) }))
      }
      work.push(apiFetch('/api/leave/policy', { method: 'PUT', body: JSON.stringify({ entitlements }) }))
      const results = await Promise.all(work)
      for (const r of results) if (!r.ok) throw new Error('save failed')
      showFlash('Saved email-flow settings', 'ok')
      setOriginalMode(mode)
      setOriginalEnt({ ...entitlements })
    } catch {
      showFlash('Save failed', 'err')
    } finally {
      setSaving(false)
    }
  }

  const displayName = authenticatedUser?.name
    || `${authenticatedUser?.firstName || ''} ${authenticatedUser?.lastName || ''}`.trim()
    || authenticatedUser?.employeeCode
    || 'User'

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-950">
      {/* ── Topbar ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1600px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <img src="/ace-logo.png" alt="ACE" width="36" height="36"
               className="rounded-lg bg-white object-contain p-0.5 shadow-sm" />
          <div className="min-w-0">
            <div className="text-sm font-black text-slate-950">ACE System 4</div>
            <div className="text-[11px] font-bold uppercase tracking-[.1em] text-slate-400">
              Email Flow &amp; Approval Chain
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <a href="/overview"
               className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-600 shadow-sm transition hover:bg-slate-50">
              <ArrowLeft size={16} /> Overview
            </a>
            {authenticatedUser && (
              <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm sm:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black text-white" style={{ background: ACE_BLUE }}>
                  {displayName.split(' ').map(x => x[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="text-left">
                  <div className="text-xs font-black text-slate-900 leading-tight">{displayName}</div>
                  <div className="text-[11px] font-bold text-slate-400 leading-tight">{authenticatedUser.role || 'User'}</div>
                </div>
              </div>
            )}
            {onLogout && (
              <button onClick={onLogout}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50"
                      aria-label="Logout">
                <LogOut size={17} />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 flex flex-col gap-6">

        {/* ── Title section ─────────────────────────────────────── */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-[#2447d8]">
              <Home size={14} />
              ACE · Admin · Notification Control
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-normal text-slate-950 sm:text-4xl">
              Email Flow &amp; Approval Chain
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
              Visualise every email triggered by leave requests and control chain mode, recipients, and yearly entitlements from one screen.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 shadow-sm">
              <GitBranch size={17} style={{ color: ACE_RED }} />
              {mode} chain
            </div>
            <button onClick={load} disabled={loading}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 disabled:opacity-60">
              <RefreshCcw size={17} /> Reload
            </button>
            <button onClick={save} disabled={!dirty || saving}
                    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition hover:-translate-y-0.5
                      ${dirty
                        ? 'bg-[#2447d8] text-white shadow-lg hover:bg-[#1d3bb8]'
                        : 'border border-slate-200 bg-white text-slate-400 shadow-sm cursor-not-allowed hover:translate-y-0 hover:bg-white'}`}>
              <Save size={17} />
              {dirty ? (saving ? 'Saving…' : 'Save changes') : 'Saved'}
            </button>
          </div>
        </div>

        {/* ── Flash banner ──────────────────────────────────────── */}
        {flash && (
          <div className={`rounded-2xl px-4 py-3 text-sm font-bold shadow-sm
            ${flash.type === 'ok' ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                                  : 'border border-red-200 bg-red-50 text-red-800'}`}>
            {flash.msg}
          </div>
        )}

        {/* ── Metric cards ──────────────────────────────────────── */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Leave types"     value={LEAVE_TYPES.length}            note="Distinct workflows"        color={ACE_BLUE} icon={ClipboardCheck} />
          <MetricCard label="Email events"    value={EMAIL_TRIGGERS.length}         note="Transitions tracked"       color="#16a34a"  icon={Mail} />
          <MetricCard label="Roles in chain"  value={Object.keys(NODE_META).length} note="Distinct actors"           color="#d97706"  icon={Users} />
          <MetricCard label="Active mode"     value={mode}                          note={mode === 'FULL' ? 'PM → SPM → DC → HR → Boss' : 'PM → DC → HR → Boss'} color={ACE_RED} icon={GitBranch} />
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-sm font-bold text-slate-500">Loading…</div>
          </div>
        ) : (
          <>
            {/* ── 01 · Chain Mode ─────────────────────────────── */}
            <SectionCard>
              <SectionHead
                eyebrow="01 · Routing"
                title="Approval Chain Mode"
                desc="FULL adds an extra Senior PM step between PM and the Project Director. Applies to Annual / Other leave."
              />
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[.1em] text-slate-400">
                      <GitBranch size={13} /> Currently active
                    </div>
                    <div className="mt-1 text-base font-black text-slate-900">
                      {mode === 'FULL' ? 'PM → SPM → DC → HR → Boss' : 'PM → DC → HR → Boss'}
                    </div>
                    <div className="mt-1 text-[12px] font-semibold text-slate-500">
                      Stored in&nbsp;
                      <span className="rounded bg-white border border-slate-200 px-1.5 py-0.5 font-mono text-[11px] text-slate-700">
                        system_settings.leave_chain_mode
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm shrink-0">
                    <button onClick={() => setMode('SHORT')}
                            className={`rounded-xl px-3 py-1.5 text-[12.5px] font-black transition
                              ${mode === 'SHORT' ? 'bg-[#2447d8] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                      SHORT
                    </button>
                    <button onClick={() => setMode('FULL')}
                            className={`rounded-xl px-3 py-1.5 text-[12.5px] font-black transition
                              ${mode === 'FULL' ? 'bg-[#2447d8] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                      FULL
                    </button>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* ── 02 · Interactive Leave-Flow Editor ─────────── */}
            <SectionCard>
              <SectionHead
                eyebrow="02 · Leave Flow Editor"
                title="Design Email Flow per Leave Type"
                desc='Pick a leave type, drag nodes, draw lines: solid blue = อนุมัติ (can reject, blocks flow), dashed gray = รับทราบ (CC, doesn&rsquo;t block). Click line to switch type, hover line to delete.'
              />
              <FlowEditor />
            </SectionCard>

            {/* ── 02b · Static reference flow per leave type ───── */}
            <SectionCard>
              <SectionHead
                eyebrow="02b · Reference"
                title="Default Flow per Leave Type"
                desc="Read-only reference — the built-in approval chain hard-coded in the backend for each leave type."
              />
              <div className="grid gap-3">
                {LEAVE_TYPES.map(lt => (
                  <div key={lt.key} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black"
                              style={{ background: `${lt.color}15`, color: lt.color }}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: lt.color }} />
                          {lt.label}
                        </span>
                        <span className="rounded bg-white border border-slate-200 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-600">
                          {lt.chain.join(' → ')}
                        </span>
                      </div>
                      <span className="text-[10.5px] font-black uppercase tracking-[.1em] text-slate-400">
                        Email at every transition
                      </span>
                    </div>
                    <ChainRow chain={lt.chain} mode={mode} />
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* ── 03 · Email matrix ───────────────────────────── */}
            <SectionCard>
              <SectionHead
                eyebrow="03 · Recipients"
                title="Email Trigger Matrix"
                desc="TO is the actionable recipient. CC keeps stakeholders informed."
              />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-[.1em] font-black text-slate-400 border-b border-slate-200">
                      <th className="py-3 pr-3">Event</th>
                      <th className="py-3 pr-3">TO (primary)</th>
                      <th className="py-3 pr-3">CC (stakeholders)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {EMAIL_TRIGGERS.map(t => {
                      const Icon = t.icon
                      return (
                        <tr key={t.event} className="align-middle">
                          <td className="py-3.5 pr-3">
                            <div className="flex items-center gap-2 font-black text-slate-800">
                              <Icon size={15} className="text-slate-400 shrink-0" />{t.event}
                            </div>
                          </td>
                          <td className="py-3.5 pr-3">
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-black ${t.tone}`}>
                              {t.to}
                            </span>
                          </td>
                          <td className="py-3.5 pr-3 text-slate-600 font-semibold">{t.cc}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-900">
                <Info size={18} className="mt-0.5 shrink-0 text-[#2447d8]" />
                <div className="font-semibold leading-6">
                  Each approver receives a <strong>personal signed link</strong> (7-day JWT,&nbsp;
                  <span className="rounded bg-white border border-blue-200 px-1.5 py-0.5 font-mono text-[11.5px]">aud=leave-approval</span>).
                  Per-recipient delivery is required for audit integrity — never CC multiple approvers on the same link.
                </div>
              </div>
            </SectionCard>

            {/* ── 04 · Entitlements ───────────────────────────── */}
            <SectionCard>
              <SectionHead
                eyebrow="04 · Policy"
                title="Yearly Leave Entitlements"
                desc="Days per calendar year. Leave blank for policy-based (no hard cap)."
              />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {LEAVE_TYPES.map(lt => {
                  const value = entitlements[lt.key]
                  return (
                    <div key={lt.key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-slate-700">{lt.label}</span>
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: lt.color }} />
                      </div>
                      <div className="mt-3 relative">
                        <input type="number" min="0" step="0.5"
                               placeholder="Policy-based"
                               value={value == null ? '' : value}
                               onChange={e => {
                                 const raw = e.target.value
                                 setEntitlements(prev => ({
                                   ...prev,
                                   [lt.key]: raw === '' ? null : Number(raw),
                                 }))
                               }}
                               className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-[#2447d8] focus:bg-white focus:ring-4 focus:ring-blue-100" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">days / yr</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </SectionCard>

            {/* ── 05 · Role legend ────────────────────────────── */}
            <SectionCard>
              <SectionHead
                eyebrow="05 · Reference"
                title="Role Legend"
                desc="The six logical actors in the approval chain and how the backend resolves their email."
              />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Object.entries(NODE_META).map(([code, meta]) => {
                  const Icon = meta.icon
                  return (
                    <div key={code} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-white" style={{ background: meta.color }}>
                          <Icon size={20} />
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-[11px] font-black text-slate-500">{code}</span>
                      </div>
                      <div className="text-base font-black text-slate-950">{meta.title}</div>
                      <div className="mt-1.5 text-[12.5px] font-semibold leading-5 text-slate-500">{meta.desc}</div>
                    </div>
                  )
                })}
              </div>
            </SectionCard>
          </>
        )}
      </div>
    </div>
  )
}
