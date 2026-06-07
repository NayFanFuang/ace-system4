// KpiAccessPage — Admin console for KPI visibility / access control.
// Route: /admin/kpi-access
//
// Defines an ACL graph: "X can see / manage Y's KPI".
//   • Edge VIEW   (solid blue)  — read-only, sees scores
//   • Edge MANAGE (solid purple) — read + write, can score KPI
// Same drag-and-connect editor pattern as EmailFlowPage.
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Eye, Edit3, Target, ShieldCheck, Users, UserCheck, Crown, User,
  ArrowRight, Save, RefreshCcw, Info, Layers, Home, ArrowLeft, LogOut,
  Plus, Trash2, RotateCcw, MousePointer2, UsersRound,
  Target as TargetIcon, Zap, Handshake, X as XIcon,
  Maximize2, Minimize2,
} from 'lucide-react'
import { apiFetch } from './src/apiFetch.js'

const ACE_BLUE = '#2447d8'
const ACE_RED  = '#c73b32'

// ── Logical roles (mirrors KPI scope in deps.py) ─────────────────────────────
const ROLE_META = {
  SELF: { title: 'Employee',          desc: 'KPI owner (sees own only)',          icon: User,        color: '#64748b' },
  PM:   { title: 'PM',                desc: 'Project Manager · direct reports',   icon: UserCheck,   color: '#2447d8' },
  PD:   { title: 'PD / DC',           desc: 'Project Director',                   icon: ShieldCheck, color: '#7c3aed' },
  HR:   { title: 'HR',                desc: 'HR Admin · analytics',               icon: Target,      color: '#16a34a' },
  BOSS: { title: 'Managing Director', desc: 'Top-level oversight (read-only)',    icon: Crown,       color: '#d97706' },
}

// Edge access types
const ACCESS_TYPES = [
  { key: 'VIEW',   label: 'ดู (View)',       short: 'VIEW',   color: '#2447d8', dash: undefined,  desc: 'Read-only — can see scores, no edit' },
  { key: 'MANAGE', label: 'จัดการ (Manage)', short: 'MANAGE', color: '#7c3aed', dash: undefined,  desc: 'Read + write — can score KPI' },
]
const ACCESS_BY_KEY = Object.fromEntries(ACCESS_TYPES.map(a => [a.key, a]))

// Team approval policy (reused for TEAM nodes)
const TEAM_POLICIES = [
  { key: 'LEAD', label: 'Team Lead', short: 'LEAD', icon: TargetIcon, color: '#2447d8', desc: 'Lead has access on behalf of the team' },
  { key: 'ANY',  label: 'Any-of',    short: 'ANY',  icon: Zap,        color: '#d97706', desc: 'Any member has access' },
  { key: 'ALL',  label: 'All-of',    short: 'ALL',  icon: Handshake,  color: '#dc2626', desc: 'All members have access' },
]
const POLICY_BY_KEY = Object.fromEntries(TEAM_POLICIES.map(p => [p.key, p]))

// ── Storage ──────────────────────────────────────────────────────────────────
const KPI_STORAGE_KEY = 'ace_kpi_access_graph_v1'
const NODE_W = 150
const NODE_H = 92

const DEFAULT_GRAPH = {
  nodes: [
    { id: 'SELF', role: 'SELF', x: 40,  y: 280 },
    { id: 'PM',   role: 'PM',   x: 220, y: 280 },
    { id: 'PD',   role: 'PD',   x: 400, y: 280 },
    { id: 'HR',   role: 'HR',   x: 580, y: 280 },
    { id: 'BOSS', role: 'BOSS', x: 760, y: 280 },
  ],
  edges: [
    // PM scores their direct reports
    { from: 'PM',   to: 'SELF', type: 'MANAGE' },
    // PD has visibility on PM + reports
    { from: 'PD',   to: 'PM',   type: 'VIEW' },
    { from: 'PD',   to: 'SELF', type: 'VIEW' },
    // HR has admin override on everyone
    { from: 'HR',   to: 'PM',   type: 'MANAGE' },
    { from: 'HR',   to: 'PD',   type: 'MANAGE' },
    { from: 'HR',   to: 'SELF', type: 'MANAGE' },
    // Boss sees all (read-only)
    { from: 'BOSS', to: 'PD',   type: 'VIEW' },
    { from: 'BOSS', to: 'PM',   type: 'VIEW' },
    { from: 'BOSS', to: 'SELF', type: 'VIEW' },
  ],
}

function normalizeEdge(e) {
  return { from: e.from, to: e.to, type: e.type === 'MANAGE' ? 'MANAGE' : 'VIEW' }
}

function loadGraph() {
  try {
    const raw = localStorage.getItem(KPI_STORAGE_KEY)
    if (!raw) return DEFAULT_GRAPH
    const p = JSON.parse(raw)
    if (!p?.nodes || !p?.edges) return DEFAULT_GRAPH
    return { nodes: p.nodes, edges: p.edges.map(normalizeEdge) }
  } catch {
    return DEFAULT_GRAPH
  }
}
function saveGraph(g) { try { localStorage.setItem(KPI_STORAGE_KEY, JSON.stringify(g)) } catch {} }

// ── Utils ────────────────────────────────────────────────────────────────────
function initials(name) {
  return String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase() || '').join('')
}
function hashHue(str) { let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return h % 360 }
function personColor(code) { return `hsl(${hashHue(String(code || ''))} 65% 45%)` }
function teamColor(code)  { return `hsl(${hashHue(`TEAM:${code}`)} 55% 40%)` }

// ── HR-style helpers ─────────────────────────────────────────────────────────
function MetricCard({ label, value, note, color = ACE_BLUE, icon: Icon = Target }) {
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

function SectionHead({ eyebrow, title, desc }) {
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
    </div>
  )
}

// ── Editor ───────────────────────────────────────────────────────────────────
function AccessEditor() {
  const initial = useMemo(() => loadGraph(), [])
  const [nodes, setNodes] = useState(initial.nodes)
  const [edges, setEdges] = useState(initial.edges)
  const [newEdgeType, setNewType] = useState('VIEW')
  const [connectFrom, setConnectFrom] = useState(null)
  const [hoverEdge, setHoverEdge] = useState(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [employees, setEmployees] = useState([])
  const [employeesLoading, setEmployeesLoading] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')
  const [teamPickerOpen, setTeamPickerOpen] = useState(false)
  const [viewingTeam, setViewingTeam] = useState(null)
  const canvasRef = useRef(null)
  const dragRef = useRef(null)
  const pickerRef = useRef(null)
  const teamPickerRef = useRef(null)

  useEffect(() => { saveGraph({ nodes, edges }) }, [nodes, edges])

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

  useEffect(() => {
    if (!fullscreen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [fullscreen])

  useEffect(() => {
    if (!pickerOpen) return
    const h = e => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false) }
    window.addEventListener('mousedown', h)
    return () => window.removeEventListener('mousedown', h)
  }, [pickerOpen])

  useEffect(() => {
    if (!teamPickerOpen) return
    const h = e => { if (teamPickerRef.current && !teamPickerRef.current.contains(e.target)) setTeamPickerOpen(false) }
    window.addEventListener('mousedown', h)
    return () => window.removeEventListener('mousedown', h)
  }, [teamPickerOpen])

  useEffect(() => {
    if ((!pickerOpen && !teamPickerOpen && !viewingTeam) || employees.length || employeesLoading) return
    setEmployeesLoading(true)
    apiFetch('/api/employees')
      .then(r => r.ok ? r.json() : { data: [] })
      .then(d => setEmployees(Array.isArray(d.data) ? d.data : []))
      .catch(() => setEmployees([]))
      .finally(() => setEmployeesLoading(false))
  }, [pickerOpen, teamPickerOpen, viewingTeam, employees.length, employeesLoading])

  const teams = useMemo(() => {
    const map = new Map()
    employees.forEach(e => {
      const code = (e.project_team || '').trim()
      if (!code) return
      const slot = map.get(code) || { code, count: 0, departments: new Set() }
      slot.count += 1
      if (e.department) slot.departments.add(e.department)
      map.set(code, slot)
    })
    return Array.from(map.values())
      .map(t => ({ ...t, departments: Array.from(t.departments) }))
      .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code))
  }, [employees])

  function nextFreeSlot() {
    const cols = 6, padX = 30, padY = 30, stepX = NODE_W + 30, stepY = NODE_H + 30
    for (let i = 0; i < 60; i++) {
      const x = padX + (i % cols) * stepX
      const y = padY + Math.floor(i / cols) * stepY
      if (!nodes.some(n => Math.abs(n.x - x) < 20 && Math.abs(n.y - y) < 20)) return { x, y }
    }
    return { x: 40 + (nodes.length % 10) * 20, y: 40 + (nodes.length % 10) * 20 }
  }

  function addEmployeeNode(emp) {
    const id = `EMP:${emp.employee_code}`
    if (nodes.find(n => n.id === id)) { setPickerOpen(false); setPickerSearch(''); return }
    setNodes(prev => [...prev, {
      id, role: 'EMPLOYEE',
      label: emp.full_name || emp.employee_code,
      sub:   emp.position || emp.job_title || emp.department || '',
      code:  emp.employee_code,
      ...nextFreeSlot(),
    }])
    setPickerOpen(false); setPickerSearch('')
  }

  function addTeamNode(team) {
    const id = `TEAM:${team.code}`
    if (nodes.find(n => n.id === id)) { setTeamPickerOpen(false); return }
    setNodes(prev => [...prev, {
      id, role: 'TEAM',
      teamCode: team.code,
      label: `${team.code} Team`,
      sub:    team.departments[0] || 'Project team',
      members: team.count,
      policy: 'LEAD',
      ...nextFreeSlot(),
    }])
    setTeamPickerOpen(false)
  }

  function cycleTeamPolicy(id) {
    setNodes(prev => prev.map(n => {
      if (n.id !== id || n.role !== 'TEAM') return n
      const idx = TEAM_POLICIES.findIndex(p => p.key === (n.policy || 'LEAD'))
      return { ...n, policy: TEAM_POLICIES[(idx + 1) % TEAM_POLICIES.length].key }
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
    if (e.target.closest('[data-handle]')) return
    const rect = canvasRef.current.getBoundingClientRect()
    dragRef.current = {
      id: node.id,
      offsetX: e.clientX - rect.left - node.x,
      offsetY: e.clientY - rect.top - node.y,
      startX: e.clientX, startY: e.clientY, moved: false,
    }
  }
  function onCanvasMouseMove(e) {
    const d = dragRef.current
    if (!d) return
    if (!d.moved && (Math.abs(e.clientX - d.startX) > 3 || Math.abs(e.clientY - d.startY) > 3)) d.moved = true
    if (!d.moved) return
    const rect = canvasRef.current.getBoundingClientRect()
    const nx = Math.max(0, Math.min(rect.width - NODE_W, e.clientX - rect.left - d.offsetX))
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
  function onCanvasMouseUp() { dragRef.current = null }

  function toggleEdge(idx) {
    setEdges(prev => prev.map((e, i) => i === idx ? { ...e, type: e.type === 'VIEW' ? 'MANAGE' : 'VIEW' } : e))
  }
  function removeEdge(idx) { setEdges(prev => prev.filter((_, i) => i !== idx)) }
  function resetGraph() { if (!confirm('Reset to default hierarchy?')) return; setNodes(DEFAULT_GRAPH.nodes); setEdges(DEFAULT_GRAPH.edges); setConnectFrom(null) }
  function clearEdges() { if (!confirm('Remove all access connections?')) return; setEdges([]) }

  // Move (toX, toY) back toward (fromX, fromY) until it touches the axis-aligned
  // bounding box (half-w × half-h) around (toX, toY). Used to clip line endpoints
  // to node edges so arrowheads aren't hidden under the card.
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
    // start touches the source node edge; end is 8px beyond target edge so the
    // arrowhead has room to render outside the card.
    const start = trimToBox(cx2, cy2, cx1, cy1, NODE_W / 2, NODE_H / 2)
    const end   = trimToBox(cx1, cy1, cx2, cy2, NODE_W / 2 + 8, NODE_H / 2 + 8)
    const dx = Math.max(30, Math.abs(end.x - start.x) * 0.4)
    return `M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${end.x - dx} ${end.y}, ${end.x} ${end.y}`
  }
  function edgeMidpoint(a, b) { return { x: (a.x + b.x) / 2 + NODE_W / 2, y: (a.y + b.y) / 2 + NODE_H / 2 } }

  const viewCount   = edges.filter(e => e.type !== 'MANAGE').length
  const manageCount = edges.length - viewCount

  return (
    <div className={fullscreen ? 'fixed inset-0 z-50 bg-[#f5f7fb] overflow-y-auto p-4 sm:p-6' : ''}>
      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-[#2447d8]">
          <MousePointer2 size={13} />
          Drag node · Click + then another node to grant access · Click line to switch View/Manage
        </div>
        <div className="ml-auto flex gap-2 relative">
          {/* Add person */}
          <div ref={pickerRef} className="relative">
            <button onClick={() => setPickerOpen(o => !o)}
                    className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-black shadow-sm transition
                      ${pickerOpen ? 'border-[#2447d8] bg-blue-50 text-[#2447d8]' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
              <Plus size={14} /> Add person
            </button>
            {pickerOpen && (
              <div className="absolute right-0 top-full z-30 mt-2 w-[360px] rounded-2xl border border-slate-200 bg-white shadow-xl">
                <div className="border-b border-slate-100 p-3">
                  <input autoFocus value={pickerSearch} onChange={e => setPickerSearch(e.target.value)}
                         placeholder="Search name, code, position…"
                         className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none focus:border-[#2447d8] focus:bg-white focus:ring-4 focus:ring-blue-100" />
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  {employeesLoading ? <div className="px-4 py-6 text-center text-xs font-bold text-slate-400">Loading…</div>
                   : filteredEmployees.length === 0 ? <div className="px-4 py-6 text-center text-xs font-bold text-slate-400">{employees.length ? 'No match' : 'No employees loaded'}</div>
                   : filteredEmployees.map(emp => {
                       const id = `EMP:${emp.employee_code}`
                       const already = nodes.some(n => n.id === id)
                       return (
                         <button key={emp.employee_code} disabled={already} onClick={() => addEmployeeNode(emp)}
                                 className={`flex w-full items-center gap-3 border-b border-slate-50 px-3 py-2.5 text-left transition last:border-0 ${already ? 'cursor-not-allowed opacity-40' : 'hover:bg-blue-50'}`}>
                           <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[11px] font-black text-white" style={{ background: personColor(emp.employee_code) }}>{initials(emp.full_name) || '?'}</div>
                           <div className="min-w-0 flex-1">
                             <div className="truncate text-[13px] font-black text-slate-900">{emp.full_name || emp.employee_code}</div>
                             <div className="truncate text-[11px] font-semibold text-slate-500">{emp.position || emp.job_title || '—'}{emp.department ? ` · ${emp.department}` : ''}</div>
                           </div>
                           <div className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-black text-slate-500">{emp.employee_code}</div>
                         </button>
                       )
                     })}
                </div>
              </div>
            )}
          </div>
          {/* Add team */}
          <div ref={teamPickerRef} className="relative">
            <button onClick={() => setTeamPickerOpen(o => !o)}
                    className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-black shadow-sm transition
                      ${teamPickerOpen ? 'border-[#2447d8] bg-blue-50 text-[#2447d8]' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
              <UsersRound size={14} /> Add team
            </button>
            {teamPickerOpen && (
              <div className="absolute right-0 top-full z-30 mt-2 w-[320px] rounded-2xl border border-slate-200 bg-white shadow-xl">
                <div className="border-b border-slate-100 px-3 py-2 text-[10.5px] font-black uppercase tracking-[.12em] text-slate-400">Project teams</div>
                <div className="max-h-[320px] overflow-y-auto">
                  {employeesLoading ? <div className="px-4 py-6 text-center text-xs font-bold text-slate-400">Loading…</div>
                   : teams.length === 0 ? <div className="px-4 py-6 text-center text-xs font-bold text-slate-400">No teams loaded</div>
                   : teams.map(t => {
                       const id = `TEAM:${t.code}`
                       const already = nodes.some(n => n.id === id)
                       return (
                         <button key={t.code} disabled={already} onClick={() => addTeamNode(t)}
                                 className={`flex w-full items-center gap-3 border-b border-slate-50 px-3 py-2.5 text-left transition last:border-0 ${already ? 'cursor-not-allowed opacity-40' : 'hover:bg-blue-50'}`}>
                           <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl text-white" style={{ background: teamColor(t.code) }}><UsersRound size={16} /></div>
                           <div className="min-w-0 flex-1">
                             <div className="truncate text-[13px] font-black text-slate-900">{t.code} Team</div>
                             <div className="truncate text-[11px] font-semibold text-slate-500">{t.departments.join(' · ') || '—'}</div>
                           </div>
                           <div className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-black text-slate-600">{t.count} ppl</div>
                         </button>
                       )
                     })}
                </div>
              </div>
            )}
          </div>
          <button onClick={clearEdges} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm transition hover:bg-slate-50"><Trash2 size={14} /> Clear lines</button>
          <button onClick={resetGraph} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm transition hover:bg-slate-50"><RotateCcw size={14} /> Reset</button>
          <button onClick={() => setFullscreen(f => !f)}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-black shadow-sm transition ${fullscreen ? 'border-[#2447d8] bg-blue-50 text-[#2447d8]' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
            {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}{fullscreen ? 'Exit' : 'Fullscreen'}
          </button>
        </div>
      </div>

      {/* Edge-type selector */}
      <div className="mb-3 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <span className="text-[10.5px] font-black uppercase tracking-[.12em] text-slate-400">New line type</span>
        <button onClick={() => setNewType('VIEW')}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[12px] font-black transition
                  ${newEdgeType === 'VIEW' ? 'border-[#2447d8] bg-blue-50 text-[#2447d8]' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>
          <svg width="28" height="6" viewBox="0 0 28 6"><line x1="0" y1="3" x2="28" y2="3" stroke="#2447d8" strokeWidth="2.5" /></svg>
          ดู (View)
        </button>
        <button onClick={() => setNewType('MANAGE')}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[12px] font-black transition
                  ${newEdgeType === 'MANAGE' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>
          <svg width="28" height="6" viewBox="0 0 28 6"><line x1="0" y1="3" x2="28" y2="3" stroke="#7c3aed" strokeWidth="2.5" /></svg>
          จัดการ (Manage)
        </button>
        <div className="ml-auto flex items-center gap-3 text-[11px] font-bold text-slate-500">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#2447d8]" />{viewCount} view</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-purple-600" />{manageCount} manage</span>
        </div>
      </div>

      {/* Canvas */}
      <div ref={canvasRef}
           onMouseMove={onCanvasMouseMove} onMouseUp={onCanvasMouseUp} onMouseLeave={onCanvasMouseUp}
           style={{ height: fullscreen ? 'calc(100vh - 320px)' : 760 }}
           className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.06)_1px,transparent_0)] [background-size:20px_20px] bg-slate-50">

        <svg className="absolute inset-0 h-full w-full" style={{ pointerEvents: 'none' }}>
          <defs>
            <marker id="kpi-arrow-view"   viewBox="0 0 12 12" refX="10" refY="6" markerWidth="11" markerHeight="11" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
              <path d="M 0 0 L 12 6 L 0 12 L 3 6 z" fill="#2447d8" />
            </marker>
            <marker id="kpi-arrow-manage" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="11" markerHeight="11" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
              <path d="M 0 0 L 12 6 L 0 12 L 3 6 z" fill="#7c3aed" />
            </marker>
          </defs>
          {edges.map((e, idx) => {
            const from = nodes.find(n => n.id === e.from)
            const to   = nodes.find(n => n.id === e.to)
            if (!from || !to) return null
            const mid = edgeMidpoint(from, to)
            const isView = e.type !== 'MANAGE'
            const color = isView ? '#2447d8' : '#7c3aed'
            const isHover = hoverEdge === idx
            return (
              <g key={`${e.from}-${e.to}-${idx}`} style={{ pointerEvents: 'auto' }}
                 onMouseEnter={() => setHoverEdge(idx)} onMouseLeave={() => setHoverEdge(h => h === idx ? null : h)}>
                <path d={curvePath(from, to)} stroke="transparent" strokeWidth="20" fill="none" className="cursor-pointer" onClick={() => toggleEdge(idx)}>
                  <title>{isView ? 'View — click to switch to Manage' : 'Manage — click to switch to View'}</title>
                </path>
                <path d={curvePath(from, to)} stroke={color} strokeWidth="2.6" fill="none"
                      markerEnd={`url(#kpi-arrow-${isView ? 'view' : 'manage'})`} style={{ pointerEvents: 'none' }} />
                <g transform={`translate(${mid.x}, ${mid.y})`} style={{ pointerEvents: 'none' }}>
                  <rect x="-26" y="-9" width="52" height="18" rx="9" fill="#fff" stroke={color} strokeWidth="1.3" />
                  <text x="0" y="3.5" textAnchor="middle" fontSize="9.5" fontWeight="900" fill={color} style={{ fontFamily: 'inherit', letterSpacing: '.05em' }}>
                    {isView ? 'VIEW' : 'MANAGE'}
                  </text>
                </g>
                {isHover && (
                  <g transform={`translate(${mid.x + 36}, ${mid.y})`} style={{ pointerEvents: 'auto' }} className="cursor-pointer" onClick={(ev) => { ev.stopPropagation(); removeEdge(idx) }}>
                    <circle r="10" fill="#dc2626" />
                    <path d="M -4 -4 L 4 4 M 4 -4 L -4 4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
                    <title>Remove access</title>
                  </g>
                )}
              </g>
            )
          })}
          {connectFrom && (() => {
            const n = nodes.find(x => x.id === connectFrom)
            if (!n) return null
            return (
              <circle cx={n.x + NODE_W / 2} cy={n.y + NODE_H / 2} r="60" fill="none" stroke="#2447d8" strokeWidth="2" strokeDasharray="6 5">
                <animate attributeName="r" from="40" to="60" dur="1.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.8" to="0" dur="1.2s" repeatCount="indefinite" />
              </circle>
            )
          })()}
        </svg>

        {nodes.map(n => {
          const meta = ROLE_META[n.role]
          const isEmployee = n.role === 'EMPLOYEE'
          const isTeam     = n.role === 'TEAM'
          const color = isEmployee ? personColor(n.code) : isTeam ? teamColor(n.teamCode) : (meta?.color || '#64748b')
          const Icon  = meta?.icon
          const topLabel = isEmployee ? (n.code || 'STAFF') : isTeam ? `TEAM · ${n.teamCode}` : n.role
          const title    = isEmployee || isTeam ? n.label : (meta?.title || n.role)
          const sub      = isEmployee ? (n.sub || 'Employee') : isTeam ? `${n.members || 0} members${n.sub ? ` · ${n.sub}` : ''}` : (meta?.desc || '')
          const policy = isTeam ? POLICY_BY_KEY[n.policy || 'LEAD'] : null
          const PolicyIcon = policy?.icon
          const isFrom = connectFrom === n.id
          const isTarget = connectFrom && connectFrom !== n.id
          return (
            <div key={n.id}
                 onMouseDown={e => onNodeMouseDown(e, n)} onMouseUp={e => onNodeMouseUp(e, n)}
                 className={`group absolute select-none rounded-2xl border bg-white p-3 shadow-md transition
                   ${isFrom ? 'border-[#2447d8] ring-4 ring-blue-200' : 'border-slate-200'}
                   ${isTarget ? 'cursor-pointer hover:border-emerald-400 hover:ring-4 hover:ring-emerald-100' : 'cursor-grab active:cursor-grabbing'}`}
                 style={{ left: n.x, top: n.y, width: NODE_W, height: NODE_H }}>
              <div className="mb-2 h-1 rounded-full" style={{ background: color }} />
              <div className="flex items-center gap-2">
                {isTeam ? (
                  <div className="relative h-9 w-9 shrink-0">
                    <div className="absolute right-0 top-0 grid h-8 w-8 place-items-center rounded-2xl text-white" style={{ background: color }}><UsersRound size={14} /></div>
                    <div className="absolute left-0 bottom-0 grid h-6 w-6 place-items-center rounded-xl bg-white text-[9px] font-black shadow border border-slate-200" style={{ color }}>+{Math.max(0, (n.members || 1) - 1)}</div>
                  </div>
                ) : (
                  <div className="grid h-9 w-9 place-items-center rounded-2xl text-white shrink-0 text-[11px] font-black" style={{ background: color }}>
                    {isEmployee ? (initials(n.label) || '?') : Icon ? <Icon size={16} /> : '?'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-[.08em] text-slate-400 truncate">{topLabel}</div>
                  <div className="text-xs font-black text-slate-900 leading-tight truncate" title={title}>{title}</div>
                  <div className="text-[10px] font-semibold text-slate-500 truncate" title={sub}>{sub}</div>
                </div>
              </div>
              {isTeam && policy && (
                <div data-handle className="absolute -bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center overflow-hidden rounded-full border-2 border-white shadow-md">
                  <button onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); setViewingTeam(n) }} title="View team members" className="grid h-6 w-7 place-items-center bg-slate-800 text-white transition hover:bg-slate-950"><Eye size={11} /></button>
                  <button onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); cycleTeamPolicy(n.id) }} title={`${policy.label} — click to cycle`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black text-white transition hover:brightness-110" style={{ background: policy.color }}>
                    {PolicyIcon && <PolicyIcon size={10} />}{policy.short}
                  </button>
                </div>
              )}
              <button data-handle onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); removeNode(n.id) }}
                      className="absolute -left-2.5 -top-2.5 grid h-6 w-6 place-items-center rounded-full bg-white text-slate-400 shadow border border-slate-200 opacity-0 transition hover:bg-red-50 hover:text-red-600 hover:border-red-200 group-hover:opacity-100"
                      title="Remove node"><Trash2 size={11} /></button>
              <button data-handle onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); setConnectFrom(isFrom ? null : n.id) }}
                      className={`absolute -right-2.5 -top-2.5 grid h-7 w-7 place-items-center rounded-full text-white shadow-lg transition ${isFrom ? 'bg-red-500 hover:bg-red-600' : 'bg-[#2447d8] hover:bg-[#1d3bb8]'}`}
                      title={isFrom ? 'Cancel' : 'Grant access to another node'}>
                {isFrom ? <span className="text-[14px] font-black leading-none">×</span> : <Plus size={14} />}
              </button>
            </div>
          )
        })}

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="rounded-xl bg-white/90 px-3 py-1.5 text-[11px] font-bold text-slate-500 shadow-sm backdrop-blur">
            {nodes.length} nodes · {viewCount} view · {manageCount} manage
          </div>
          {connectFrom && (
            <div className={`rounded-xl px-3 py-1.5 text-[11.5px] font-black text-white shadow-lg pointer-events-auto ${newEdgeType === 'VIEW' ? 'bg-[#2447d8]' : 'bg-purple-600'}`}>
              Click target → grants <strong>{newEdgeType}</strong> access · <button onClick={() => setConnectFrom(null)} className="underline">Esc</button>
            </div>
          )}
        </div>
      </div>

      {/* Adjacency summary */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {nodes.map(n => {
          const meta = ROLE_META[n.role]
          const isEmployee = n.role === 'EMPLOYEE'
          const isTeam     = n.role === 'TEAM'
          const color = isEmployee ? personColor(n.code) : isTeam ? teamColor(n.teamCode) : (meta?.color || '#64748b')
          const title = isEmployee || isTeam ? n.label : (meta?.title || n.role)
          const nameOf = id => {
            const m = nodes.find(x => x.id === id)
            if (!m) return id
            if (m.role === 'EMPLOYEE') return m.label
            if (m.role === 'TEAM') return `${m.label} [${POLICY_BY_KEY[m.policy || 'LEAD']?.short || 'LEAD'}]`
            return ROLE_META[m.role]?.title || m.role
          }
          const out = edges.filter(e => e.from === n.id)
          const inn = edges.filter(e => e.to   === n.id)
          const outManage = out.filter(e => e.type === 'MANAGE').map(e => nameOf(e.to))
          const outView   = out.filter(e => e.type !== 'MANAGE').map(e => nameOf(e.to))
          const inManage  = inn.filter(e => e.type === 'MANAGE').map(e => nameOf(e.from))
          const inView    = inn.filter(e => e.type !== 'MANAGE').map(e => nameOf(e.from))
          const Pill = ({ tone, label }) => (
            <span className={`mr-1 inline-block rounded-md px-1.5 py-0.5 text-[10.5px] font-black ${tone === 'manage' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-[#2447d8]'}`}>{label}</span>
          )
          return (
            <div key={n.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-lg text-white text-[10px] font-black" style={{ background: color }}>
                  {isEmployee ? (initials(n.label) || '?') : isTeam ? <UsersRound size={13} /> : (meta?.icon ? <meta.icon size={13} /> : '?')}
                </div>
                <div className="text-xs font-black text-slate-900 truncate" title={title}>{title}</div>
                {isTeam && (() => {
                  const p = POLICY_BY_KEY[n.policy || 'LEAD']
                  return <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9.5px] font-black text-white" style={{ background: p.color }} title={p.desc}>{p.short}</span>
                })()}
                <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-black text-slate-500">
                  {isEmployee ? n.code : isTeam ? `${n.members}p` : n.role}
                </span>
              </div>
              <div className="mt-2 grid gap-1.5 text-[11.5px] font-semibold">
                <div className="text-slate-600">
                  <span className="font-black text-slate-400">→ Manages KPI of: </span>
                  {outManage.length ? outManage.map(x => <Pill key={x} tone="manage" label={x} />) : <span className="text-slate-300">—</span>}
                </div>
                <div className="text-slate-600">
                  <span className="font-black text-slate-400">→ Can view KPI of: </span>
                  {outView.length ? outView.map(x => <Pill key={x} tone="view" label={x} />) : <span className="text-slate-300">—</span>}
                </div>
                <div className="text-slate-600">
                  <span className="font-black text-slate-400">← Managed by: </span>
                  {inManage.length ? inManage.map(x => <Pill key={x} tone="manage" label={x} />) : <span className="text-slate-300">—</span>}
                </div>
                <div className="text-slate-600">
                  <span className="font-black text-slate-400">← Visible to: </span>
                  {inView.length ? inView.map(x => <Pill key={x} tone="view" label={x} />) : <span className="text-slate-300">—</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {viewingTeam && (
        <TeamMembersModal team={viewingTeam} employees={employees} loading={employeesLoading} onClose={() => setViewingTeam(null)} />
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
    return base.filter(e => `${e.full_name || ''} ${e.employee_code || ''} ${e.position || ''}`.toLowerCase().includes(q))
  }, [employees, team.teamCode, search])
  const policy = POLICY_BY_KEY[team.policy || 'LEAD']
  const total = employees.filter(e => (e.project_team || '').trim() === team.teamCode).length
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" style={{ maxHeight: '85vh' }}>
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <div className="grid h-11 w-11 place-items-center rounded-2xl text-white shadow" style={{ background: teamColor(team.teamCode) }}><UsersRound size={19} /></div>
          <div className="min-w-0 flex-1">
            <div className="text-base font-black text-slate-950 leading-tight">{team.label}</div>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] font-bold text-slate-500">
              <span>{total} member{total === 1 ? '' : 's'}</span>
              <span className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-black text-white" style={{ background: policy.color }}>
                {React.createElement(policy.icon, { size: 9 })}{policy.short}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"><XIcon size={16} /></button>
        </div>
        <div className="border-b border-slate-100 p-3">
          <input value={search} onChange={e => setSearch(e.target.value)} autoFocus placeholder="Search members…"
                 className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-[#2447d8] focus:bg-white focus:ring-4 focus:ring-blue-100" />
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? <div className="px-4 py-10 text-center text-xs font-bold text-slate-400">Loading…</div>
           : members.length === 0 ? <div className="px-4 py-10 text-center text-xs font-bold text-slate-400">{total === 0 ? `No employees with project_team = "${team.teamCode}"` : 'No member matches.'}</div>
           : members.map(emp => (
              <div key={emp.employee_code} className="flex items-center gap-3 border-b border-slate-50 px-4 py-2.5 last:border-0 hover:bg-slate-50">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[11px] font-black text-white" style={{ background: personColor(emp.employee_code) }}>{initials(emp.full_name) || '?'}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-black text-slate-900">{emp.full_name || emp.employee_code}</div>
                  <div className="truncate text-[11px] font-semibold text-slate-500">{emp.position || emp.job_title || '—'}{emp.department ? ` · ${emp.department}` : ''}</div>
                </div>
                <div className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-black text-slate-500">{emp.employee_code}</div>
              </div>
             ))}
        </div>
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-[11px] font-bold text-slate-500">
          policy <span className="font-black" style={{ color: policy.color }}>{policy.label}</span> decides who in the team actually gets the access permission.
        </div>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function KpiAccessPage({ authenticatedUser, onLogout }) {
  const displayName = authenticatedUser?.name
    || `${authenticatedUser?.firstName || ''} ${authenticatedUser?.lastName || ''}`.trim()
    || authenticatedUser?.employeeCode || 'User'

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1600px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <img src="/ace-logo.png" alt="ACE" width="36" height="36" className="rounded-lg bg-white object-contain p-0.5 shadow-sm" />
          <div className="min-w-0">
            <div className="text-sm font-black text-slate-950">ACE System 4</div>
            <div className="text-[11px] font-bold uppercase tracking-[.1em] text-slate-400">KPI Access Control</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <a href="/overview" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-600 shadow-sm transition hover:bg-slate-50"><ArrowLeft size={16} /> Overview</a>
            {authenticatedUser && (
              <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm sm:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black text-white" style={{ background: ACE_BLUE }}>
                  {initials(displayName).toUpperCase()}
                </div>
                <div className="text-left">
                  <div className="text-xs font-black text-slate-900 leading-tight">{displayName}</div>
                  <div className="text-[11px] font-bold text-slate-400 leading-tight">{authenticatedUser.role || 'User'}</div>
                </div>
              </div>
            )}
            {onLogout && (
              <button onClick={onLogout} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50" aria-label="Logout"><LogOut size={17} /></button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 flex flex-col gap-6">
        {/* Title */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-[#2447d8]">
              <Home size={14} /> ACE · Admin · KPI Access Control
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-normal text-slate-950 sm:text-4xl">KPI Access &amp; Visibility</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
              Define who can see — or score — whose KPI. Each person sees only the people / teams they need to see.
            </p>
          </div>
        </div>

        {/* Metric cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Roles in graph"  value={Object.keys(ROLE_META).length} note="Built-in actors" color={ACE_BLUE} icon={Users} />
          <MetricCard label="Access types"    value={ACCESS_TYPES.length}            note="View · Manage"  color="#7c3aed"  icon={Eye} />
          <MetricCard label="Default coverage" value="Hierarchy"                     note="Boss → all"     color="#16a34a"  icon={ShieldCheck} />
          <MetricCard label="Storage"         value="Browser"                        note="localStorage v1" color={ACE_RED} icon={Edit3} />
        </section>

        {/* Editor */}
        <SectionCard>
          <SectionHead
            eyebrow="01 · Access Editor"
            title="Drag &amp; Connect — KPI Visibility Graph"
            desc='Solid blue = ดู (View, read-only). Solid purple = จัดการ (Manage, can score). Click line to switch type, hover to delete.'
          />
          <AccessEditor />
        </SectionCard>

        {/* How it works */}
        <SectionCard>
          <SectionHead eyebrow="02 · Reference" title="How access is interpreted" desc="The graph encodes who can see what. Edges are evaluated whenever a user opens the KPI page." />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
              <div className="flex items-center gap-2 text-sm font-black text-[#2447d8]"><Eye size={16} /> View (ดู)</div>
              <p className="mt-2 text-[12.5px] font-semibold leading-5 text-slate-600">
                Read-only access. User can open the target's KPI page, see scores, charts, history — but cannot edit or evaluate.
              </p>
            </div>
            <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-4">
              <div className="flex items-center gap-2 text-sm font-black text-purple-700"><Edit3 size={16} /> Manage (จัดการ)</div>
              <p className="mt-2 text-[12.5px] font-semibold leading-5 text-slate-600">
                Read + write. User can evaluate, set targets, change weights, sign off self-assessments. Manage implies View.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
              <div className="flex items-center gap-2 text-sm font-black text-slate-700"><Info size={16} /> SELF node</div>
              <p className="mt-2 text-[12.5px] font-semibold leading-5 text-slate-600">
                Every user implicitly has View on their own KPI — no explicit edge needed.&nbsp;
                The <strong>SELF</strong> node in the graph represents <em>"any employee that isn't otherwise modeled"</em>.
                Drawing an edge <strong>PM → SELF (MANAGE)</strong> means "PMs can score the KPI of all employees they manage".
              </p>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
