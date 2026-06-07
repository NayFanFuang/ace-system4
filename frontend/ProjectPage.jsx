'use client'
/**
 * ACE — Project Management Page
 * Next.js + Tailwind CSS
 *
 * Sections:
 *   - Project List (search, filter by customer/type/status)
 *   - Project Detail Panel (info, sites, assignments)
 *   - Assignment Management (add/end employee)
 *   - Site list with GPS info
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import React from 'react'
import {
  Bell, Briefcase, ClipboardList, Command, Database, FileText, FilePlus, FolderKanban,
  Home, Inbox, Layers, LayoutDashboard, LogOut, MapPin, Menu, Search, Settings,
  Sparkles, Split, TrendingUp, Upload, Users, X, AlertCircle, CheckCircle2, Loader2,
  Wallet,
} from 'lucide-react'
import { buildProjectEmployeesFromExcel, buildProjectsFromExcel } from './employeeSeed.js'
import { PO_SYSTEM_LINES } from './poSystemSeed.js'
import { apiFetch } from './src/apiFetch.js'
import { formatDateYmd } from './src/dateFormat.js'
import ProjectWorkSplitPage from './ProjectWorkSplitPage.jsx'

const PROJECT_EMPLOYEE_STORAGE_KEY = 'ace_project_employees_v2'
const API_BASE = '/api'

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_PROJECTS = [
  {
    id: 1, project_code: 'AIS-DTE-BKK-2025',
    project_name: 'AIS Drive Test Bangkok 2025',
    project_type: 'DTE', status: 'ACTIVE',
    start_date: '2025-01-01', end_date: '2025-12-31',
    customer: { id: 1, code: 'AIS', name: 'Advanced Info Service (AIS)' },
    team: { code: 'RF', name: 'RF Team' },
    headcount: 3, site_count: 12,
  },
  {
    id: 2, project_code: 'TRUE-TE-NNT-2025',
    project_name: 'True TE Nonthaburi 2025',
    project_type: 'TE', status: 'ACTIVE',
    start_date: '2025-03-01', end_date: '2025-09-30',
    customer: { id: 2, code: 'TRUE', name: 'True Corporation' },
    team: { code: 'TE', name: 'TE Team' },
    headcount: 2, site_count: 3,
  },
  {
    id: 3, project_code: 'AIS-DTA-2025',
    project_name: 'AIS Drive Test Analysis 2025',
    project_type: 'DTA', status: 'ACTIVE',
    start_date: '2025-01-01', end_date: '2025-12-31',
    customer: { id: 1, code: 'AIS', name: 'Advanced Info Service (AIS)' },
    team: { code: 'RF', name: 'RF Team' },
    headcount: 2, site_count: 0,
  },
  {
    id: 4, project_code: 'NT-DTE-RYG-2024',
    project_name: 'NT Drive Test Rangsit 2024',
    project_type: 'DTE', status: 'COMPLETED',
    start_date: '2024-01-01', end_date: '2024-12-31',
    customer: { id: 3, code: 'NT', name: 'National Telecom (NT)' },
    team: { code: 'RF', name: 'RF Team' },
    headcount: 0, site_count: 8,
  },
]

MOCK_PROJECTS.push(...buildProjectsFromExcel(MOCK_PROJECTS))
MOCK_PROJECTS.splice(0, 4)

const MOCK_ASSIGNMENTS = {
  1: [
    { id: 1, project_id: 1, user_id: 1, employee_code: 'ACE-001', full_name: 'Peerapol Piamsri', email: 'peerapol.p@airconnect-e.com', position_name: 'RF', role_in_project: 'DTE', start_date: '2025-01-01', end_date: null, allocation_pct: 100, is_active: true },
    { id: 2, project_id: 1, user_id: 4, employee_code: 'VD-001', full_name: 'Ake Subcontract', email: 'ake.sub@vendor-co.com', position_name: 'RF', role_in_project: 'DTA', start_date: '2025-01-01', end_date: null, allocation_pct: 100, is_active: true },
    { id: 4, project_id: 1, user_id: 9, employee_code: 'ACE-008', full_name: 'Kannika Phanit', email: 'kannika.p@airconnect-e.com', position_name: 'RF', role_in_project: 'REPORT_PREP', start_date: '2025-01-01', end_date: null, allocation_pct: 60, is_active: true },
  ],
  2: [
    { id: 3, project_id: 2, user_id: 3, employee_code: 'ACE-003', full_name: 'Wanchai Kamnan', email: 'wanchai.k@airconnect-e.com', position_name: 'TE', role_in_project: 'TE', start_date: '2025-03-01', end_date: null, allocation_pct: 100, is_active: true },
  ],
  3: [
    { id: 5, project_id: 3, user_id: 1, employee_code: 'ACE-001', full_name: 'Peerapol Piamsri', email: 'peerapol.p@airconnect-e.com', position_name: 'RF', role_in_project: 'DTA', start_date: '2025-01-01', end_date: null, allocation_pct: 80, is_active: true },
    { id: 6, project_id: 3, user_id: 9, employee_code: 'ACE-008', full_name: 'Kannika Phanit', email: 'kannika.p@airconnect-e.com', position_name: 'RF', role_in_project: 'REPORT_PREP', start_date: '2025-01-01', end_date: null, allocation_pct: 70, is_active: true },
  ],
}

const MOCK_SITES = {
  1: [
    { id: 1, site_code: 'SITE-AIS-BKK-0421', site_name: 'Sukhumvit 21', customer_id: 1, latitude: 13.7433, longitude: 100.5588, gps_radius_m: 500, province: 'Bangkok', district: 'Watthana', is_active: true },
    { id: 2, site_code: 'SITE-AIS-BKK-0422', site_name: 'Asok BTS Area',  customer_id: 1, latitude: 13.7456, longitude: 100.5602, gps_radius_m: 300, province: 'Bangkok', district: 'Khlong Toei', is_active: true },
    { id: 3, site_code: 'SITE-AIS-BKK-0423', site_name: 'Phrom Phong',    customer_id: 1, latitude: 13.7300, longitude: 100.5700, gps_radius_m: 400, province: 'Bangkok', district: 'Khlong Toei', is_active: true },
  ],
  2: [
    { id: 4, site_code: 'SITE-TRUE-NNT-0118', site_name: 'Nonthaburi Tower', customer_id: 2, latitude: 13.8591, longitude: 100.5134, gps_radius_m: 500, province: 'Nonthaburi', district: 'Mueang', is_active: true },
  ],
}

const DEFAULT_PROJECT_EMPLOYEES = [
  ...buildProjectEmployeesFromExcel(),
]

function loadStoredProjectEmployees() {
  if (typeof window === 'undefined') return []
  try {
    const saved = JSON.parse(window.localStorage.getItem(PROJECT_EMPLOYEE_STORAGE_KEY) || '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

function mergeProjectEmployees(stored) {
  const map = new Map()
  DEFAULT_PROJECT_EMPLOYEES.forEach(e => map.set(e.employee_code, e))
  stored.forEach(e => map.set(e.employee_code, e))
  return Array.from(map.values())
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  DTE:         { label: 'DTE',         color: '#7c3aed', bg: '#ede9fe' },
  DTA:         { label: 'DTA',         color: '#0369a1', bg: '#e0f2fe' },
  TE:          { label: 'TE',          color: '#047857', bg: '#d1fae5' },
  RF:          { label: 'RF',          color: '#b45309', bg: '#fef3c7' },
  MAINTENANCE: { label: 'Maintenance', color: '#475569', bg: '#f1f5f9' },
  OTHER:       { label: 'Other',       color: '#475569', bg: '#f1f5f9' },
}

const STATUS_CONFIG = {
  PLANNING:  { label: 'Planning',   color: '#1d4ed8', bg: '#dbeafe' },
  ACTIVE:    { label: 'Active',     color: '#15803d', bg: '#dcfce7' },
  ON_HOLD:   { label: 'On Hold',    color: '#92400e', bg: '#fef3c7' },
  COMPLETED: { label: 'Completed',  color: '#475569', bg: '#f1f5f9' },
  CANCELLED: { label: 'Cancelled',  color: '#b91c1c', bg: '#fee2e2' },
}

const ROLE_CONFIG = {
  DTE:         { label: 'DTE',                color: '#dc2626' },
  DTA:         { label: 'DTA',                color: '#2563eb' },
  REPORT_PREP: { label: 'Report Preparation', color: '#047857' },
  TE:          { label: 'TE',                 color: '#7c3aed' },
  TEAM_LEAD:   { label: 'Team Lead',          color: '#b45309' },
  SUPERVISOR:  { label: 'Supervisor',         color: '#475569' },
  OTHER:       { label: 'Other',              color: '#475569' },
}

const CLOCK_TYPE_CONFIG = {
  DAILY:    { label: 'Daily',    color: '#2563eb', bg: '#dbeafe' },
  PER_SITE: { label: 'Per-Site', color: '#dc2626', bg: '#fee2e2' },
}

const PROJECT_NAV = [
  { id: 'overview',       label: 'Overview',     icon: LayoutDashboard },
  { id: 'project_board',  label: 'Project',      icon: FolderKanban    },
  { id: 'progress',       label: 'Progress',     icon: TrendingUp      },
  { id: 'staff_roster',   label: 'Staff Roster', icon: Users           },
  { id: 'projects',       label: 'Projects',     icon: Briefcase       },
]

const PROJECT_BOTTOM_NAV = [
  { id: 'project_po',  label: 'Project PO',  icon: Inbox    },
  { id: 'billing',     label: 'Billing',     icon: Wallet   },
  { id: 'work_split',  label: 'Work Split',  icon: Split    },
  { id: 'master_data', label: 'Master Data', icon: Database },
]

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type] || { label: type, color: '#475569', bg: '#f1f5f9' }
  return (
    <span style={{ background: cfg.bg, color: cfg.color, fontSize: '.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
      {cfg.label}
    </span>
  )
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: '#475569', bg: '#f1f5f9' }
  return (
    <span style={{ background: cfg.bg, color: cfg.color, fontSize: '.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
      {cfg.label}
    </span>
  )
}

function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.OTHER
  return (
    <span style={{ background: cfg.color + '18', color: cfg.color, fontSize: '.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 99 }}>
      {cfg.label}
    </span>
  )
}

function ClockTypeBadge({ clockType }) {
  const cfg = CLOCK_TYPE_CONFIG[clockType || 'DAILY'] || CLOCK_TYPE_CONFIG.DAILY
  return (
    <span style={{ background: cfg.bg, color: cfg.color, fontSize: '.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: 99 }}>
      {cfg.label}
    </span>
  )
}

function normalizeClockType(role, clockType) {
  return role === 'DTE' ? (clockType || 'PER_SITE') : 'DAILY'
}

function CustomerTag({ customer }) {
  const colors = { AIS: '#dc2626', TRUE: '#7c3aed', NT: '#0369a1', DTAC: '#047857' }
  const color = colors[customer.code] || '#475569'
  return (
    <span style={{ fontWeight: 800, fontSize: '.72rem', color, letterSpacing: '.03em' }}>{customer.code}</span>
  )
}

function MiniStat({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.72rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
      <span style={{ fontSize: '.8rem' }}>{icon}</span>
      <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{value}</span>
      <span>{label}</span>
    </div>
  )
}

function Avatar({ name, size = 32 }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const colors   = ['#7c3aed','#0369a1','#047857','#c0392b','#b45309']
  const color    = colors[name.charCodeAt(0) % colors.length]
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: size * 0.36, flexShrink: 0 }}>
      {initials}
    </div>
  )
}

function ProgressBar({ value, max = 100, color = '#7c3aed' }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div style={{ height: 4, background: 'var(--color-border-tertiary)', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width .4s' }} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT LIST
// ─────────────────────────────────────────────────────────────────────────────
function ProjectList({ projects, onSelect, selected }) {
  const [search, setSearch]   = useState('')
  const [typeFilter, setType] = useState('')
  const [statusFilter, setSt] = useState('ACTIVE')

  const filtered = projects.filter(p => {
    const q = search.toLowerCase()
    const ms = !q || p.project_code.toLowerCase().includes(q) || p.project_name.toLowerCase().includes(q) || p.customer.code.toLowerCase().includes(q)
    const mt = !typeFilter || p.project_type === typeFilter
    const mst = !statusFilter || p.status === statusFilter
    return ms && mt && mst
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--color-border-tertiary)' }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 10 }}>
          Projects
          <span style={{ marginLeft: 8, fontSize: '.72rem', fontWeight: 600, color: 'var(--color-text-secondary)', background: 'var(--color-background-secondary)', padding: '2px 8px', borderRadius: 99 }}>
            {filtered.length}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search project code / name / customer…" style={INPUT_SM} />
          <div style={{ display: 'flex', gap: 6 }}>
            <select value={typeFilter} onChange={e => setType(e.target.value)} style={{ ...INPUT_SM, flex: 1 }}>
              <option value="">All Types</option>
              {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setSt(e.target.value)} style={{ ...INPUT_SM, flex: 1 }}>
              <option value="">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.map(p => (
          <div
            key={p.id}
            onClick={() => onSelect(p)}
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--color-border-tertiary)',
              cursor: 'pointer',
              background: selected?.id === p.id ? 'var(--color-background-secondary)' : 'transparent',
              borderLeft: `3px solid ${selected?.id === p.id ? (TYPE_CONFIG[p.project_type]?.color || '#7c3aed') : 'transparent'}`,
              transition: 'background .15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <CustomerTag customer={p.customer} />
                  <TypeBadge type={p.project_type} />
                  <StatusBadge status={p.status} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '.88rem', marginTop: 4, color: 'var(--color-text-primary)' }}>
                  {p.project_code}
                </div>
                <div style={{ fontSize: '.75rem', color: 'var(--color-text-secondary)', marginTop: 1 }}>
                  {p.project_name}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
              <MiniStat icon="👥" label="people" value={p.headcount} />
              <MiniStat icon="📍" label="sites"  value={p.site_count} />
              <MiniStat icon="📅" label=""       value={`${p.start_date} → ${p.end_date || '∞'}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT DETAIL PANEL
// ─────────────────────────────────────────────────────────────────────────────
function ProjectPanel({ project, onClose, projectEmployees, allProjects }) {
  const [tab, setTab]           = useState('assignments')
  const [assignments, setAsgn]  = useState([])
  const [sites, setSites]       = useState([])
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [showSiteForm, setShowSiteForm]     = useState(false)
  const [editTarget, setEditTarget]         = useState(null)
  const [moveTarget, setMoveTarget]         = useState(null)
  const [histTarget, setHistTarget]         = useState(null)

  const loadAssignments = () =>
    apiFetch(`${API_BASE}/projects/${encodeURIComponent(project.project_code)}/assignments`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(payload => setAsgn(payload.data || []))
      .catch(() => setAsgn([]))

  useEffect(() => {
    if (!project) return
    loadAssignments()
    apiFetch(`${API_BASE}/projects/${encodeURIComponent(project.project_code)}/sites`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Sites unavailable')))
      .then(payload => setSites(payload.data || []))
      .catch(() => setSites([]))
    setTab('assignments')
  }, [project?.id])

  async function handleEnd(a) {
    if (!window.confirm(`End assignment for ${a.full_name}?`)) return
    try {
      const today = new Date().toISOString().slice(0, 10)
      const r = await apiFetch(`${API_BASE}/projects/${encodeURIComponent(project.project_code)}/assignments/${a.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ end_date: today, is_active: false }),
      })
      if (!r.ok) throw new Error((await r.json()).detail || 'Failed')
      const updated = await r.json()
      setAsgn(rows => rows.map(row => row.id === updated.id ? updated : row))
    } catch (err) { alert(err.message) }
  }

  if (!project) return null

  const typeCfg = TYPE_CONFIG[project.project_type] || {}

  const TABS = [
    { id: 'assignments', label: `People (${assignments.filter(a => a.is_active).length})` },
    { id: 'sites',       label: `Sites (${sites.length})` },
    { id: 'info',        label: 'Info' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', borderLeft: '1px solid var(--color-border-tertiary)', position: 'relative' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border-tertiary)', borderLeft: `4px solid ${typeCfg.color || '#7c3aed'}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <CustomerTag customer={project.customer} />
              <TypeBadge type={project.project_type} />
              <StatusBadge status={project.status} />
            </div>
            <div style={{ fontWeight: 800, fontSize: '1rem', marginTop: 4 }}>{project.project_code}</div>
            <div style={{ fontSize: '.78rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>{project.project_name}</div>
            {project.team && (
              <div style={{ fontSize: '.72rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                Team: {project.team.name}
              </div>
            )}
            <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
              <MiniStat icon="👥" label="people" value={assignments.filter(a => a.is_active).length} />
              <MiniStat icon="📍" label="sites"  value={sites.length} />
              <MiniStat icon="📅" label=""       value={`${project.start_date} → ${project.end_date || '∞'}`} />
            </div>
          </div>
          <button onClick={onClose} style={ICON_BTN}>✕</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-tertiary)', padding: '0 20px' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '10px 14px', fontSize: '.8rem',
              fontWeight: tab === t.id ? 700 : 500,
              color: tab === t.id ? (typeCfg.color || '#7c3aed') : 'var(--color-text-secondary)',
              borderBottom: `2px solid ${tab === t.id ? (typeCfg.color || '#7c3aed') : 'transparent'}`,
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {tab === 'assignments' && (
          <AssignmentsTab
            assignments={assignments}
            projectColor={typeCfg.color}
            onAdd={() => setShowAssignForm(true)}
            onEnd={handleEnd}
            onEdit={a => setEditTarget(a)}
            onMove={a => setMoveTarget(a)}
            onHistory={(code, name) => setHistTarget({ employee_code: code, full_name: name })}
          />
        )}
        {tab === 'sites' && (
          <SitesTab sites={sites} onAdd={() => setShowSiteForm(true)} />
        )}
        {tab === 'info' && <ProjectInfoTab project={project} />}
      </div>

      {showAssignForm && (
        <AssignFormModal
          color={typeCfg.color}
          project={project}
          employees={projectEmployees}
          onSaved={row => { setAsgn(rows => [row, ...rows]); setShowAssignForm(false) }}
          onClose={() => setShowAssignForm(false)}
        />
      )}
      {showSiteForm && (
        <SiteFormModal
          project={project}
          onSaved={row => { setSites(rows => [row, ...rows]); setShowSiteForm(false) }}
          onClose={() => setShowSiteForm(false)}
        />
      )}
      {editTarget && (
        <EditAssignModal
          assignment={editTarget}
          color={typeCfg.color}
          projectCode={project.project_code}
          onSaved={updated => { setAsgn(rows => rows.map(r => r.id === updated.id ? updated : r)); setEditTarget(null) }}
          onClose={() => setEditTarget(null)}
        />
      )}
      {moveTarget && (
        <MoveModal
          assignment={moveTarget}
          allProjects={allProjects || []}
          color={typeCfg.color}
          onSaved={({ ended }) => { setAsgn(rows => rows.map(r => r.id === ended.id ? ended : r)); setMoveTarget(null) }}
          onClose={() => setMoveTarget(null)}
        />
      )}
      {histTarget && (
        <HistoryModal
          employee={histTarget}
          color={typeCfg.color}
          onClose={() => setHistTarget(null)}
        />
      )}
    </div>
  )
}

// ─── Assignments Tab ─────────────────────────────────────────────
function AssignmentsTab({ assignments, projectColor, onAdd, onEnd, onEdit, onMove, onHistory }) {
  const [showHistory, setShowHistory] = useState(false)
  const active = assignments.filter(a => a.is_active)
  const ended  = assignments.filter(a => !a.is_active)
  const shown  = showHistory ? assignments : active
  const c = projectColor || '#7c3aed'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: '.88rem' }}>Project Members</span>
          <span style={{ fontSize: '.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: '#f1f5f9', color: '#475569' }}>{active.length} active</span>
          {ended.length > 0 && (
            <button
              onClick={() => setShowHistory(h => !h)}
              style={{ fontSize: '.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99, border: `1px solid ${showHistory ? c : 'var(--color-border-secondary)'}`, background: showHistory ? (c + '18') : 'transparent', color: showHistory ? c : 'var(--color-text-secondary)', cursor: 'pointer' }}
            >
              {showHistory ? 'Hide ended' : `+ ${ended.length} ended`}
            </button>
          )}
        </div>
        <button onClick={onAdd} style={{ ...BTN_PRIMARY, background: c }}>+ Assign</button>
      </div>

      {shown.length === 0 && (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-secondary)', fontSize: '.82rem' }}>No members yet</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {shown.map(a => {
          const isEnded = !a.is_active
          return (
            <div key={a.id} style={{ ...CARD_STYLE, display: 'flex', alignItems: 'flex-start', gap: 10, opacity: isEnded ? 0.6 : 1 }}>
              <Avatar name={a.full_name} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '.85rem' }}>{a.full_name}</span>
                  <RoleBadge role={a.role_in_project} />
                  {a.role_in_project === 'DTE' && <ClockTypeBadge clockType={a.clock_type} />}
                  {a.job_level && <span style={{ fontSize: '.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: '#f1f5f9', color: '#475569' }}>{a.job_level}</span>}
                  {isEnded && <span style={{ fontSize: '.65rem', color: '#94a3b8', fontWeight: 600, padding: '2px 6px', borderRadius: 99, background: '#f1f5f9' }}>Ended</span>}
                </div>
                <div style={{ fontSize: '.72rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  {a.employee_code}{a.position_name ? ` · ${a.position_name}` : ''}
                </div>
                <div style={{ fontSize: '.7rem', color: 'var(--color-text-secondary)', marginTop: 3 }}>
                  {a.start_date || '—'} → {a.end_date || (isEnded ? '—' : 'Ongoing')}
                </div>
                {!isEnded && <ProgressBar value={a.allocation_pct} color={c} />}
                {!isEnded && <div style={{ fontSize: '.65rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>{a.allocation_pct}% allocation</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                {!isEnded && <>
                  <button onClick={() => onEdit(a)} style={{ ...ICON_BTN, fontSize: '.68rem', padding: '3px 8px', borderRadius: 8, border: '1px solid var(--color-border-secondary)' }}>Edit</button>
                  <button onClick={() => onMove(a)} style={{ ...ICON_BTN, fontSize: '.68rem', padding: '3px 8px', borderRadius: 8, border: `1px solid ${c}`, color: c }}>Move</button>
                  <button onClick={() => onEnd(a)} style={{ ...ICON_BTN, fontSize: '.68rem', padding: '3px 8px', borderRadius: 8, border: '1px solid #dc2626', color: '#dc2626' }}>End</button>
                </>}
                <button onClick={() => onHistory(a.employee_code, a.full_name)} style={{ ...ICON_BTN, fontSize: '.68rem', padding: '3px 8px', borderRadius: 8, border: '1px solid var(--color-border-secondary)', color: 'var(--color-text-secondary)' }}>History</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Sites Tab ───────────────────────────────────────────────────
function SitesTab({ sites, onAdd }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontWeight: 700, fontSize: '.88rem' }}>Sites</span>
        <button onClick={onAdd} style={BTN_PRIMARY}>+ Add Site</button>
      </div>

      {sites.length === 0 && (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-secondary)', fontSize: '.82rem' }}>No sites registered</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sites.map(s => (
          <div key={s.id} style={CARD_STYLE}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '.85rem' }}>{s.site_code}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  {s.site_name} · {s.province}{s.district ? ` / ${s.district}` : ''}
                </div>
              </div>
              <span style={{ fontSize: '.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: s.is_active ? '#dcfce7' : '#f1f5f9', color: s.is_active ? '#15803d' : '#64748b' }}>
                {s.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            {s.latitude && (
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <div style={{ fontSize: '.72rem', color: 'var(--color-text-secondary)' }}>
                  🛰️ {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                </div>
                <div style={{ fontSize: '.72rem', color: 'var(--color-text-secondary)' }}>
                  Radius: {s.gps_radius_m}m
                </div>
                <a
                  href={`https://maps.google.com/?q=${s.latitude},${s.longitude}`}
                  target="_blank" rel="noreferrer"
                  style={{ fontSize: '.72rem', color: '#7c3aed', fontWeight: 600, textDecoration: 'none' }}
                >
                  Maps ↗
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Project Info Tab ────────────────────────────────────────────
function ProjectInfoTab({ project }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <InfoSection title="Project Details">
        <InfoGrid rows={[
          ['Code',        project.project_code],
          ['Name',        project.project_name],
          ['Type',        project.project_type],
          ['Customer',    `${project.customer.code} — ${project.customer.name}`],
          ['Team',        project.team?.name || '—'],
          ['Status',      project.status],
          ['Start Date',  project.start_date],
          ['End Date',    project.end_date || 'Ongoing'],
        ]} />
      </InfoSection>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MODALS
// ─────────────────────────────────────────────────────────────────────────────

function AssignFormModal({ color, project, employees = [], onSaved, onClose }) {
  const [form, setForm] = useState({ employee_code: '', role_in_project: 'DTE', clock_type: 'PER_SITE', start_date: formatDateYmd(new Date()), allocation_pct: 100 })
  const [error, setError] = useState('')
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  function setRole(role) {
    setForm(p => ({ ...p, role_in_project: role, clock_type: normalizeClockType(role, p.clock_type) }))
  }

  async function save() {
    setError('')
    try {
      const response = await apiFetch(`${API_BASE}/projects/${encodeURIComponent(project.project_code)}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, clock_type: normalizeClockType(form.role_in_project, form.clock_type) }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.detail || 'Cannot assign employee')
      onSaved(payload)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--color-background-primary)', borderRadius: 16, padding: 24, width: 400, boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 16 }}>Assign Employee</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <FormField label="Employee">
            <select value={form.employee_code} onChange={e => set('employee_code', e.target.value)} style={INPUT}>
              <option value="">Select employee…</option>
              {employees.map(emp => (
                <option key={emp.employee_code} value={emp.employee_code}>
                  {emp.employee_code} - {emp.full_name} ({emp.project_team || emp.position_name || 'Project'})
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Role in Project">
            <select value={form.role_in_project} onChange={e => setRole(e.target.value)} style={INPUT}>
              {Object.entries(ROLE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </FormField>
          {form.role_in_project === 'DTE' && (
            <FormField label="Clock Mode">
              <select value={form.clock_type} onChange={e => set('clock_type', e.target.value)} style={INPUT}>
                <option value="PER_SITE">Per-Site</option>
                <option value="DAILY">Daily</option>
              </select>
            </FormField>
          )}
          <FormField label="Level (optional)">
            <select value={form.job_level || ''} onChange={e => set('job_level', e.target.value || null)} style={INPUT}>
              <option value="">— none —</option>
              {['L1', 'L2', 'L3', 'L4', 'L5'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </FormField>
          <FormField label="Start Date"><input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} style={INPUT} /></FormField>
          <FormField label={`Allocation: ${form.allocation_pct}%`}>
            <input type="range" min={10} max={100} step={10} value={form.allocation_pct}
              onChange={e => set('allocation_pct', +e.target.value)}
              style={{ width: '100%', accentColor: color || '#7c3aed' }}
            />
          </FormField>
        </div>
        {error && <div style={{ marginTop: 10, color: '#dc2626', fontSize: '.76rem', fontWeight: 800 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={BTN_SECONDARY}>Cancel</button>
          <button onClick={save} disabled={!form.employee_code} style={{ ...BTN_PRIMARY, background: color || '#7c3aed', opacity: form.employee_code ? 1 : .55 }}>Assign</button>
        </div>
      </div>
    </div>
  )
}

// ─── Edit Assignment Modal ────────────────────────────────────────
function EditAssignModal({ assignment, color, projectCode, onSaved, onClose }) {
  const [form, setForm] = useState({
    role_in_project: assignment.role_in_project,
    clock_type: normalizeClockType(assignment.role_in_project, assignment.clock_type),
    job_level: assignment.job_level || '',
    allocation_pct: assignment.allocation_pct,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const c = color || '#7c3aed'

  function setRole(role) {
    setForm(p => ({ ...p, role_in_project: role, clock_type: normalizeClockType(role, p.clock_type) }))
  }

  async function save() {
    setSaving(true); setError('')
    try {
      const r = await apiFetch(`${API_BASE}/projects/${encodeURIComponent(projectCode)}/assignments/${assignment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, clock_type: normalizeClockType(form.role_in_project, form.clock_type), job_level: form.job_level || null }),
      })
      const payload = await r.json()
      if (!r.ok) throw new Error(payload.detail || 'Failed')
      onSaved(payload)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--color-background-primary)', borderRadius: 16, padding: 24, width: 380, boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 2 }}>Edit Assignment</div>
        <div style={{ fontSize: '.78rem', color: 'var(--color-text-secondary)', marginBottom: 14 }}>{assignment.full_name}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <FormField label="Role in Project">
            <select value={form.role_in_project} onChange={e => setRole(e.target.value)} style={INPUT}>
              {Object.entries(ROLE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </FormField>
          {form.role_in_project === 'DTE' && (
            <FormField label="Clock Mode">
              <select value={form.clock_type} onChange={e => set('clock_type', e.target.value)} style={INPUT}>
                <option value="PER_SITE">Per-Site</option>
                <option value="DAILY">Daily</option>
              </select>
            </FormField>
          )}
          <FormField label="Level">
            <select value={form.job_level} onChange={e => set('job_level', e.target.value)} style={INPUT}>
              <option value="">— none —</option>
              {['L1','L2','L3','L4','L5'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </FormField>
          <FormField label={`Allocation: ${form.allocation_pct}%`}>
            <input type="range" min={10} max={100} step={10} value={form.allocation_pct} onChange={e => set('allocation_pct', +e.target.value)} style={{ width: '100%', accentColor: c }} />
          </FormField>
        </div>
        {error && <div style={{ marginTop: 10, color: '#dc2626', fontSize: '.76rem', fontWeight: 800 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={BTN_SECONDARY}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ ...BTN_PRIMARY, background: c }}>Save</button>
        </div>
      </div>
    </div>
  )
}

// ─── Move Modal ───────────────────────────────────────────────────
function MoveModal({ assignment, allProjects, color, onSaved, onClose }) {
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    to_project_code: '',
    role_in_project: assignment.role_in_project,
    clock_type: normalizeClockType(assignment.role_in_project, assignment.clock_type),
    job_level: assignment.job_level || '',
    start_date: today,
    end_date: today,
    allocation_pct: assignment.allocation_pct,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const c = color || '#7c3aed'

  function setRole(role) {
    setForm(p => ({ ...p, role_in_project: role, clock_type: normalizeClockType(role, p.clock_type) }))
  }

  const targets = allProjects.filter(p => p.project_code !== assignment.project_code && p.status === 'ACTIVE')

  async function save() {
    if (!form.to_project_code) { setError('Select a target project'); return }
    setSaving(true); setError('')
    try {
      const r = await apiFetch(`${API_BASE}/employees/${encodeURIComponent(assignment.employee_code)}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_assignment_id: assignment.id,
          to_project_code: form.to_project_code,
          role_in_project: form.role_in_project,
          clock_type: normalizeClockType(form.role_in_project, form.clock_type),
          job_level: form.job_level || null,
          start_date: form.start_date,
          end_date: form.end_date,
          allocation_pct: form.allocation_pct,
        }),
      })
      const payload = await r.json()
      if (!r.ok) throw new Error(payload.detail || 'Failed')
      onSaved(payload)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--color-background-primary)', borderRadius: 16, padding: 24, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 2 }}>Move to Project</div>
        <div style={{ fontSize: '.78rem', color: 'var(--color-text-secondary)', marginBottom: 14 }}>
          {assignment.full_name} · from <b>{assignment.project_code}</b>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <FormField label="Target Project">
            <select value={form.to_project_code} onChange={e => set('to_project_code', e.target.value)} style={INPUT}>
              <option value="">Select project…</option>
              {targets.map(p => (
                <option key={p.project_code} value={p.project_code}>{p.project_code} — {p.project_name}</option>
              ))}
            </select>
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <FormField label="Role in Project">
              <select value={form.role_in_project} onChange={e => setRole(e.target.value)} style={INPUT}>
                {Object.entries(ROLE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </FormField>
            {form.role_in_project === 'DTE' && (
              <FormField label="Clock Mode">
                <select value={form.clock_type} onChange={e => set('clock_type', e.target.value)} style={INPUT}>
                  <option value="PER_SITE">Per-Site</option>
                  <option value="DAILY">Daily</option>
                </select>
              </FormField>
            )}
            <FormField label="Level">
              <select value={form.job_level} onChange={e => set('job_level', e.target.value)} style={INPUT}>
                <option value="">— none —</option>
                {['L1','L2','L3','L4','L5'].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <FormField label="End Current (date)">
              <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} style={INPUT} />
            </FormField>
            <FormField label="Start New (date)">
              <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} style={INPUT} />
            </FormField>
          </div>
          <FormField label={`Allocation: ${form.allocation_pct}%`}>
            <input type="range" min={10} max={100} step={10} value={form.allocation_pct} onChange={e => set('allocation_pct', +e.target.value)} style={{ width: '100%', accentColor: c }} />
          </FormField>
        </div>
        {error && <div style={{ marginTop: 10, color: '#dc2626', fontSize: '.76rem', fontWeight: 800 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={BTN_SECONDARY}>Cancel</button>
          <button onClick={save} disabled={saving || !form.to_project_code} style={{ ...BTN_PRIMARY, background: c, opacity: form.to_project_code ? 1 : .55 }}>Move</button>
        </div>
      </div>
    </div>
  )
}

// ─── History Modal ────────────────────────────────────────────────
function HistoryModal({ employee, color, onClose }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const c = color || '#7c3aed'

  useEffect(() => {
    apiFetch(`${API_BASE}/employees/${encodeURIComponent(employee.employee_code)}/assignment-history`)
      .then(r => r.json())
      .then(payload => { setHistory(payload.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [employee.employee_code])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--color-background-primary)', borderRadius: 16, padding: 24, width: 520, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>Project History</div>
          <button onClick={onClose} style={ICON_BTN}>✕</button>
        </div>
        <div style={{ fontSize: '.78rem', color: 'var(--color-text-secondary)', marginBottom: 16 }}>{employee.full_name} · {employee.employee_code}</div>

        {loading && <div style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-secondary)', fontSize: '.82rem' }}>Loading…</div>}

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {history.map(h => (
            <div key={h.id} style={{ ...CARD_STYLE, opacity: h.is_active ? 1 : 0.7, borderLeft: `3px solid ${h.is_active ? c : '#94a3b8'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: '.85rem' }}>{h.project_code}</span>
                <RoleBadge role={h.role_in_project} />
                {h.job_level && <span style={{ fontSize: '.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: '#f1f5f9', color: '#475569' }}>{h.job_level}</span>}
                {h.is_active
                  ? <span style={{ fontSize: '.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: '#dcfce7', color: '#16a34a' }}>Active</span>
                  : <span style={{ fontSize: '.65rem', fontWeight: 600, padding: '2px 6px', borderRadius: 99, background: '#f1f5f9', color: '#94a3b8' }}>Ended</span>
                }
              </div>
              {h.project_name && h.project_name !== h.project_code && (
                <div style={{ fontSize: '.72rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>{h.project_name}</div>
              )}
              <div style={{ fontSize: '.7rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                {h.start_date || '—'} → {h.end_date || (h.is_active ? 'Ongoing' : '—')}
                {h.allocation_pct ? ` · ${h.allocation_pct}% allocation` : ''}
              </div>
            </div>
          ))}
          {!loading && history.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-secondary)', fontSize: '.82rem' }}>No assignment history found</div>
          )}
        </div>
      </div>
    </div>
  )
}

function SiteFormModal({ project, onSaved, onClose }) {
  const [form, setForm] = useState({
    site_code: '',
    site_name: '',
    customer: project.customer?.code || '',
    lat: '',
    lng: '',
    gps_radius_m: 500,
    province: '',
    district: '',
  })
  const [error, setError] = useState('')
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  async function save() {
    setError('')
    try {
      const response = await apiFetch(`${API_BASE}/projects/${encodeURIComponent(project.project_code)}/sites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          lat: form.lat === '' ? null : Number(form.lat),
          lng: form.lng === '' ? null : Number(form.lng),
          gps_radius_m: Number(form.gps_radius_m || 500),
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.detail || 'Cannot add site')
      onSaved(payload)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--color-background-primary)', borderRadius: 16, padding: 24, width: 400, boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 16 }}>Add Site</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <FormField label="Site Code"><input value={form.site_code} onChange={e => set('site_code', e.target.value)} placeholder="SITE-AIS-BKK-0424" style={INPUT} /></FormField>
          <FormField label="Site Name"><input value={form.site_name} onChange={e => set('site_name', e.target.value)} placeholder="Location name" style={INPUT} /></FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <FormField label="Latitude"><input value={form.lat} onChange={e => set('lat', e.target.value)} type="number" placeholder="13.7563" style={INPUT} /></FormField>
            <FormField label="Longitude"><input value={form.lng} onChange={e => set('lng', e.target.value)} type="number" placeholder="100.5018" style={INPUT} /></FormField>
          </div>
          <FormField label="GPS Radius (m)"><input value={form.gps_radius_m} onChange={e => set('gps_radius_m', e.target.value)} type="number" style={INPUT} /></FormField>
          <FormField label="Province"><input value={form.province} onChange={e => set('province', e.target.value)} placeholder="Bangkok" style={INPUT} /></FormField>
        </div>
        {error && <div style={{ marginTop: 10, color: '#dc2626', fontSize: '.76rem', fontWeight: 800 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={BTN_SECONDARY}>Cancel</button>
          <button onClick={save} disabled={!form.site_code} style={{ ...BTN_PRIMARY, opacity: form.site_code ? 1 : .55 }}>Add Site</button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED
// ─────────────────────────────────────────────────────────────────────────────

function InfoSection({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--color-text-secondary)', marginBottom: 8 }}>{title}</div>
      <div style={CARD_STYLE}>{children}</div>
    </div>
  )
}

function InfoGrid({ rows }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 7, columnGap: 12 }}>
      {rows.map(([label, val]) => (
        <>
          <span key={label+'l'} style={{ fontSize: '.75rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{label}</span>
          <span key={label+'v'} style={{ fontSize: '.78rem', fontWeight: 600 }}>{val}</span>
        </>
      ))}
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  )
}

function MetricCard({ label, value, note, color }) {
  return (
    <div className="min-h-[82px] rounded-md border border-[#e5e7eb] bg-white px-[18px] py-4">
      <div className="text-[.72rem] font-black text-slate-500">{label}</div>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[1.65rem] font-black leading-none text-slate-950">{value}</span>
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      </div>
      <div className="mt-1.5 text-xs text-slate-400">{note}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EXECUTIVE SUMMARY PAGE
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_LABELS = {
  DTA: 'Drive Test Analysis Eng.', DTE: 'Drive Test Engineer',
  RF_PRO: 'RF Professional', OSS: 'OSS Engineer', OMC: 'OMC Engineer',
  REPORT_PREP: 'Report Preparation', SE: 'Systems/Site Engineer',
  SS: 'Site Supervisor', SSR: 'Rigger', TEAM_LEAD: 'Team Leader (RF)',
  PM: 'Project Manager', SPM: 'Sr. Project Manager',
  PD: 'Project Director', MD: 'Managing Director', OTHER: 'Support / Admin',
}

function normalizeEmpType(t) {
  if (!t) return 'Unknown'
  const u = t.toLowerCase()
  if (u === 'permanent') return 'Permanent'
  if (u === 'outsource') return 'Outsource'
  if (u.includes('contract')) return 'Outsource'
  return 'Other'
}

function isProjectManagementEmployee(employee) {
  return String(employee?.department || '').trim().toLowerCase() === 'project management'
}

function SummaryBar({ label, value, max, color = ACE_BLUE, suffix = '' }) {
  const pct = max > 0 ? Math.max(3, (value / max) * 100) : 0
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.74rem', fontWeight: 800, color: '#344054', marginBottom: 3 }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, paddingRight: 8 }}>{label}</span>
        <span style={{ color, fontWeight: 900, flexShrink: 0 }}>{value}{suffix}</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: '#f1f5f9', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99 }} />
      </div>
    </div>
  )
}

function KpiCard({ label, value, note, color, accent }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e4e7ec', borderRadius: 2, padding: 22, minWidth: 0, boxShadow: '0 8px 16px rgba(16,24,40,.04)' }}>
      <div style={{ fontSize: '.76rem', color: '#64748b', fontWeight: 700 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
        <span style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{value}</span>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: accent || color || ACE_BLUE, flexShrink: 0 }} />
      </div>
      <div style={{ fontSize: '.72rem', color: '#94a3b8', marginTop: 8 }}>{note}</div>
    </div>
  )
}

function isPendingProjectAssignment(employee) {
  return !employee?.project_code || !employee?.project_role || employee?.project_team === 'UNASSIGNED'
}

function PendingAssignmentAlert({ pending, onOpenProjects }) {
  if (!pending.length) return null
  return (
    <section style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderLeft: `4px solid ${ACE_RED}`, borderRadius: 4, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: '.88rem', fontWeight: 950, color: '#9a3412' }}>
          {pending.length} employee{pending.length > 1 ? 's' : ''} waiting for project assignment
        </div>
        <div style={{ fontSize: '.76rem', color: '#9a3412', marginTop: 3 }}>
          Latest: {pending.slice(0, 3).map(emp => `${emp.employee_code} ${emp.full_name}`).join(', ')}
        </div>
      </div>
      <button onClick={onOpenProjects} style={{ ...BTN_PRIMARY, borderRadius: 4, background: ACE_RED, whiteSpace: 'nowrap' }}>
        Review Assignment
      </button>
    </section>
  )
}

function PendingAssignmentReviewModal({ pending, projects, onSaved, onClose }) {
  const [form, setForm] = useState({
    employee_code: pending[0]?.employee_code || '',
    project_code: projects.find(p => p.status === 'ACTIVE')?.project_code || projects[0]?.project_code || '',
    role_in_project: 'DTE',
    clock_type: 'PER_SITE',
    job_level: '',
    start_date: formatDateYmd(new Date()),
    allocation_pct: 100,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  function setRole(role) {
    setForm(p => ({ ...p, role_in_project: role, clock_type: normalizeClockType(role, p.clock_type) }))
  }

  async function save() {
    if (!form.employee_code || !form.project_code) {
      setError('Select employee and project')
      return
    }
    setSaving(true)
    setError('')
    try {
      const response = await apiFetch(`${API_BASE}/projects/${encodeURIComponent(form.project_code)}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_code: form.employee_code,
          role_in_project: form.role_in_project,
          clock_type: normalizeClockType(form.role_in_project, form.clock_type),
          job_level: form.job_level || null,
          start_date: form.start_date,
          allocation_pct: form.allocation_pct,
          is_active: true,
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.detail || 'Cannot assign employee')
      onSaved(payload)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(15,23,42,.42)', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ width: 520, maxWidth: '94vw', background: '#fff', borderRadius: 8, boxShadow: '0 28px 80px rgba(15,23,42,.25)', overflow: 'hidden' }}>
        <div style={{ background: ACE_GRADIENT, color: '#fff', padding: '18px 22px' }}>
          <div style={{ fontSize: '1rem', fontWeight: 950 }}>Review Project Assignment</div>
          <div style={{ fontSize: '.76rem', color: 'rgba(255,255,255,.78)', marginTop: 3 }}>
            Assign pending HR employee to project role, team, and job level.
          </div>
        </div>
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <FormField label="Pending Employee">
            <select value={form.employee_code} onChange={e => set('employee_code', e.target.value)} style={INPUT}>
              {pending.map(emp => (
                <option key={emp.employee_code} value={emp.employee_code}>
                  {emp.employee_code} - {emp.full_name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Project Code">
            <select value={form.project_code} onChange={e => set('project_code', e.target.value)} style={INPUT}>
              <option value="">Select project...</option>
              {projects.map(project => (
                <option key={project.project_code} value={project.project_code}>
                  {project.project_code} - {project.project_name}
                </option>
              ))}
            </select>
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Role / Position">
              <select value={form.role_in_project} onChange={e => setRole(e.target.value)} style={INPUT}>
                {Object.entries(ROLE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </FormField>
            {form.role_in_project === 'DTE' && (
              <FormField label="Clock Mode">
                <select value={form.clock_type} onChange={e => set('clock_type', e.target.value)} style={INPUT}>
                  <option value="PER_SITE">Per-Site</option>
                  <option value="DAILY">Daily</option>
                </select>
              </FormField>
            )}
            <FormField label="Job Level">
              <select value={form.job_level} onChange={e => set('job_level', e.target.value)} style={INPUT}>
                <option value="">— none —</option>
                {['L1', 'L1.5', 'L1.8', 'L2', 'L3', 'L4', 'L5'].map(level => <option key={level} value={level}>{level}</option>)}
              </select>
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Start Date">
              <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} style={INPUT} />
            </FormField>
            <FormField label={`Allocation ${form.allocation_pct}%`}>
              <input type="range" min={10} max={100} step={10} value={form.allocation_pct} onChange={e => set('allocation_pct', +e.target.value)} style={{ width: '100%', accentColor: ACE_BLUE }} />
            </FormField>
          </div>
          {error && <div style={{ color: '#b91c1c', background: '#fee2e2', borderRadius: 6, padding: '8px 10px', fontSize: '.78rem', fontWeight: 800 }}>{error}</div>}
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid #edf0f5', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ ...BTN_SECONDARY, background: '#fff' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ ...BTN_PRIMARY, borderRadius: 4, minWidth: 120, opacity: saving ? .6 : 1 }}>
            {saving ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 3 — Portfolio Overview
// Project-centric KPI cards + risk surface + customer rollup. All metrics are
// derived client-side from the already-loaded projects / employees / poRows
// (no extra round-trip; we only fetch /api/data-imports/last for ISDP staleness).
// ─────────────────────────────────────────────────────────────────────────────

function customerOfProject(p) {
  const upper = (p.project_code || '').toUpperCase()
  for (const prefix of ['AIS', 'TRUE', 'HWT', 'HW', 'ZTE', 'NBTC', 'NT', 'WW', 'DTAC']) {
    if (upper.startsWith(prefix)) return prefix
  }
  return p.customer?.code || p.customer?.name || 'Other'
}

function PortfolioOverviewPanel({ projects, allEmployees, poRows, onJumpToNav, onOpenProject }) {
  const [isdpInfo, setIsdpInfo] = useState(null)
  useEffect(() => {
    apiFetch('/api/data-imports/last')
      .then(r => r.ok ? r.json() : null)
      .then(setIsdpInfo)
      .catch(() => {})
  }, [])

  // Per-project aggregates ---------------------------------------------------
  const perProject = useMemo(() => {
    const empByProj = {}
    allEmployees.forEach(e => { if (e.project_code) empByProj[e.project_code] = (empByProj[e.project_code] || 0) + 1 })

    const posByProj = {}
    poRows.forEach(p => {
      const code = p.ace_project_code
      if (!code) return
      if (!posByProj[code]) posByProj[code] = { rows: [], amount: 0, billed: 0, billedAmt: 0, pending: 0, pendingAmt: 0, pacClusters: new Set(), ssvCount: 0 }
      const g = posByProj[code]
      g.rows.push(p)
      g.amount += Number(p.line_amount || 0)
      const wt = String(p.work_type || '').toUpperCase()
      if (wt === 'PAC') {
        const key = (p.cluster_site || p.du_id || `po-${p.id}`).toString().toUpperCase()
        g.pacClusters.add(key)
      } else if (wt === 'SSV') {
        g.ssvCount += 1
      }
      if (p.hw_billed_at) { g.billed += 1; g.billedAmt += Number(p.line_amount || 0) }
      else                { g.pending += 1; g.pendingAmt += Number(p.line_amount || 0) }
    })

    const today = Date.now()
    return projects.map(proj => {
      const g = posByProj[proj.project_code] || { rows: [], amount: 0, billed: 0, billedAmt: 0, pending: 0, pendingAmt: 0, pacClusters: new Set(), ssvCount: 0 }
      // Risks
      let agingCount = 0
      g.rows.forEach(p => {
        if (p.hw_billed_at) return
        const ref = p.last_action_at || p.finance_checked_at || p.approved_at || p.expected_release_date
        if (!ref) return
        const days = (today - new Date(ref).getTime()) / (24 * 3600 * 1000)
        if (days > 30) agingCount += 1
      })
      const totalPos = g.rows.length
      const progressPct = totalPos ? Math.round((g.billed / totalPos) * 100) : 0
      return {
        code: proj.project_code,
        name: proj.project_name || proj.project_code,
        customer: customerOfProject(proj),
        status: proj.status || 'ACTIVE',
        team: proj.team?.code || '',
        headcount: empByProj[proj.project_code] || 0,
        poTotal: totalPos,
        poBilled: g.billed,
        poPending: g.pending,
        amountTotal: g.amount,
        amountBilled: g.billedAmt,
        amountPending: g.pendingAmt,
        pacClusters: g.pacClusters.size,
        ssvCount: g.ssvCount,
        progressPct,
        agingCount,
      }
    })
    .filter(x => x.poTotal > 0 || x.headcount > 0)
    .sort((a, b) => (b.amountTotal - a.amountTotal) || (b.poTotal - a.poTotal))
  }, [projects, allEmployees, poRows])

  // Portfolio totals + risk surface ------------------------------------------
  const totals = useMemo(() => {
    return perProject.reduce((acc, p) => ({
      projects:     acc.projects + 1,
      activeProjects: acc.activeProjects + (p.status === 'ACTIVE' ? 1 : 0),
      headcount:    acc.headcount + p.headcount,
      amountTotal:  acc.amountTotal + p.amountTotal,
      amountBilled: acc.amountBilled + p.amountBilled,
      amountPending: acc.amountPending + p.amountPending,
      pacClusters:  acc.pacClusters + p.pacClusters,
      ssvCount:     acc.ssvCount + p.ssvCount,
      agingCount:   acc.agingCount + p.agingCount,
    }), { projects: 0, activeProjects: 0, headcount: 0, amountTotal: 0, amountBilled: 0, amountPending: 0, pacClusters: 0, ssvCount: 0, agingCount: 0 })
  }, [perProject])

  // Customer rollup ----------------------------------------------------------
  const byCustomer = useMemo(() => {
    const m = {}
    perProject.forEach(p => {
      const c = p.customer
      if (!m[c]) m[c] = { customer: c, projects: 0, amount: 0, billed: 0, pacClusters: 0, headcount: 0 }
      m[c].projects += 1
      m[c].amount += p.amountTotal
      m[c].billed += p.amountBilled
      m[c].pacClusters += p.pacClusters
      m[c].headcount += p.headcount
    })
    return Object.values(m).sort((a, b) => b.amount - a.amount)
  }, [perProject])

  // ISDP staleness flag ------------------------------------------------------
  const isdpStale = (() => {
    const t = isdpInfo?.totals?.ISDP
    if (!t) return false
    const missing = t.sites - t.with_rf_cluster
    return missing > 100
  })()
  const isdpMissing = isdpInfo?.totals?.ISDP ? (isdpInfo.totals.ISDP.sites - isdpInfo.totals.ISDP.with_rf_cluster) : 0

  const fmtAmt = v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : Math.round(v).toLocaleString()

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Risk / Alert bar */}
      {(totals.agingCount > 0 || isdpStale) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px 14px', borderRadius: 12, background: '#fff7ed', border: '1px solid #fed7aa', alignItems: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '.78rem', fontWeight: 900, color: '#9a3412' }}>
            ⚠ Portfolio Risk
          </span>
          {totals.agingCount > 0 && (
            <PortfolioChip color="#c2410c" bg="#fed7aa">
              {totals.agingCount} PO aging &gt; 30 d
            </PortfolioChip>
          )}
          {isdpStale && (
            <PortfolioChip color="#b45309" bg="#fde68a" onClick={() => onJumpToNav?.('master_data')}>
              ISDP missing {isdpMissing.toLocaleString()} sites → Master Data
            </PortfolioChip>
          )}
        </div>
      )}

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12 }}>
        <PortfolioKpi label="Active Projects" value={totals.activeProjects} note={`of ${totals.projects} total`} accent={ACE_BLUE} />
        <PortfolioKpi label="Pipeline ฿" value={`฿${fmtAmt(totals.amountTotal)}`} note={`${totals.headcount} people`} accent="#7c3aed" />
        <PortfolioKpi label="Billed ฿" value={`฿${fmtAmt(totals.amountBilled)}`} note={`฿${fmtAmt(totals.amountPending)} pending`} accent="#16a34a" />
        <PortfolioKpi label="PAC Clusters" value={totals.pacClusters} note={`${totals.ssvCount} SSV PO`} accent={ACE_RED} />
      </div>

      {/* Project cards grid */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#1d2939', margin: 0 }}>Project Portfolio</h2>
          <span style={{ fontSize: '.72rem', color: '#94a3b8', fontWeight: 700 }}>Click a card to open Project Detail</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {perProject.slice(0, 18).map(p => (
            <PortfolioProjectCard key={p.code} project={p} onOpen={() => onOpenProject ? onOpenProject(p.code) : onJumpToNav?.('project_board')} fmtAmt={fmtAmt} />
          ))}
          {perProject.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: 28, borderRadius: 12, background: '#fff', border: '1px dashed #cbd5e1', textAlign: 'center', color: '#94a3b8', fontWeight: 700, fontSize: '.85rem' }}>
              No active project with POs yet
            </div>
          )}
        </div>
        {perProject.length > 18 && (
          <div style={{ marginTop: 8, fontSize: '.72rem', color: '#94a3b8', fontWeight: 700, textAlign: 'right' }}>
            +{perProject.length - 18} more projects · Open Project Board to view all
          </div>
        )}
      </div>

      {/* Customer rollup */}
      {byCustomer.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e4e7ec', borderRadius: 12, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 900, color: '#1d2939', margin: 0 }}>Customer Rollup</h2>
            <span style={{ fontSize: '.7rem', color: '#94a3b8', fontWeight: 700 }}>{byCustomer.length} customers</span>
          </div>
          <table style={{ width: '100%', fontSize: '.78rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#64748b', fontWeight: 800, borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '8px 8px', textAlign: 'left' }}>Customer</th>
                <th style={{ padding: '8px 8px', textAlign: 'right' }}>Projects</th>
                <th style={{ padding: '8px 8px', textAlign: 'right' }}>People</th>
                <th style={{ padding: '8px 8px', textAlign: 'right' }}>PAC Clusters</th>
                <th style={{ padding: '8px 8px', textAlign: 'right' }}>Pipeline</th>
                <th style={{ padding: '8px 8px', textAlign: 'right' }}>Billed</th>
              </tr>
            </thead>
            <tbody>
              {byCustomer.map(c => (
                <tr key={c.customer} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '9px 8px', fontWeight: 900, color: ACE_BLUE }}>{c.customer}</td>
                  <td style={{ padding: '9px 8px', textAlign: 'right', color: '#1d2939', fontWeight: 800 }}>{c.projects}</td>
                  <td style={{ padding: '9px 8px', textAlign: 'right', color: '#475569' }}>{c.headcount}</td>
                  <td style={{ padding: '9px 8px', textAlign: 'right', color: '#7c3aed', fontWeight: 800 }}>{c.pacClusters}</td>
                  <td style={{ padding: '9px 8px', textAlign: 'right', color: '#1d2939', fontWeight: 800 }}>฿{fmtAmt(c.amount)}</td>
                  <td style={{ padding: '9px 8px', textAlign: 'right', color: '#16a34a', fontWeight: 800 }}>฿{fmtAmt(c.billed)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function PortfolioKpi({ label, value, note, accent }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e4e7ec', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontSize: '.66rem', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 950, color: accent || '#1d2939', marginTop: 4, lineHeight: 1.1 }}>{value}</div>
      {note && <div style={{ fontSize: '.7rem', color: '#94a3b8', fontWeight: 700, marginTop: 4 }}>{note}</div>}
    </div>
  )
}

function PortfolioChip({ children, color, bg, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      style={{
        background: bg, color, border: 'none', borderRadius: 999, padding: '4px 12px',
        fontSize: '.7rem', fontWeight: 900, cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {children}
    </button>
  )
}

function PortfolioProjectCard({ project, onOpen, fmtAmt }) {
  const statusBg = project.status === 'ACTIVE' ? '#dcfce7' : project.status === 'COMPLETED' ? '#e2e8f0' : '#fef3c7'
  const statusFg = project.status === 'ACTIVE' ? '#15803d' : project.status === 'COMPLETED' ? '#475569' : '#a16207'
  return (
    <button
      onClick={onOpen}
      style={{
        background: '#fff', border: '1px solid #e4e7ec', borderRadius: 12, padding: 14,
        textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10,
        boxShadow: '0 4px 14px rgba(15,23,42,.04)', transition: 'transform .12s, box-shadow .12s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(15,23,42,.08)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 14px rgba(15,23,42,.04)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '.95rem', fontWeight: 900, color: ACE_BLUE }}>{project.code}</div>
          <div style={{ fontSize: '.7rem', color: '#64748b', fontWeight: 700, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>{project.name}</div>
        </div>
        <span style={{ background: statusBg, color: statusFg, fontSize: '.62rem', fontWeight: 900, padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap' }}>{project.status}</span>
      </div>

      <div style={{ display: 'flex', gap: 6, fontSize: '.66rem', fontWeight: 800 }}>
        <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: 999 }}>{project.customer}</span>
        {project.team && <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 999 }}>{project.team}</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: '.7rem' }}>
        <PortfolioStat label="People"      value={project.headcount}    fg="#1d2939" />
        <PortfolioStat label="POs"         value={project.poTotal}      fg="#1d2939" />
        <PortfolioStat label="PAC"         value={project.pacClusters}  fg="#7c3aed" sub="clusters" />
        <PortfolioStat label="SSV"         value={project.ssvCount}     fg="#16a34a" sub="PO" />
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.7rem', fontWeight: 800, marginBottom: 4 }}>
          <span style={{ color: '#64748b' }}>Billed</span>
          <span style={{ color: '#1d2939' }}>฿{fmtAmt(project.amountBilled)} / ฿{fmtAmt(project.amountTotal)}</span>
        </div>
        <div style={{ height: 6, borderRadius: 99, background: '#f1f5f9', overflow: 'hidden' }}>
          <div style={{ width: `${Math.max(2, project.progressPct)}%`, height: '100%', background: '#16a34a' }} />
        </div>
        <div style={{ fontSize: '.62rem', color: '#94a3b8', fontWeight: 700, marginTop: 4 }}>{project.progressPct}% billed · {project.poPending} PO pending</div>
      </div>

      {project.agingCount > 0 && (
        <div style={{ background: '#fef3c7', color: '#a16207', padding: '4px 10px', borderRadius: 999, fontSize: '.66rem', fontWeight: 900, alignSelf: 'flex-start' }}>
          ⚠ {project.agingCount} aging &gt; 30 d
        </div>
      )}
    </button>
  )
}

function PortfolioStat({ label, value, fg, sub }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: 8, padding: '6px 10px' }}>
      <div style={{ fontSize: '.6rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</div>
      <div style={{ fontSize: '1.05rem', fontWeight: 950, color: fg, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: '.58rem', color: '#94a3b8', fontWeight: 700 }}>{sub}</div>}
    </div>
  )
}


// ─────────────────────────────────────────────────────────────────────────────
// Phase 4 — Project Detail (Layer 2)
// 5 tabs: People / PO / Pre-Site / Billing / Timeline. All data is derived
// client-side from data already loaded by ProjectPage (projects/employees/POs)
// plus on-mount fetch of the project's sites for cluster_ready milestones.
// ─────────────────────────────────────────────────────────────────────────────
const PD_TABS = [
  { id: 'people',   label: 'People',   icon: Users },
  { id: 'po',       label: 'PO',       icon: FileText },
  { id: 'presite',  label: 'Pre-Site', icon: ClipboardList },
  { id: 'billing',  label: 'Billing',  icon: Sparkles },
  { id: 'timeline', label: 'Timeline', icon: TrendingUp },
]

function ProjectDetailPage({ projectCode, projects, allEmployees, projectEmployees, poRows, onBack, onJumpToNav }) {
  const [tab, setTab] = useState('people')
  const [sites, setSites] = useState([])

  const project = useMemo(
    () => projects.find(p => p.project_code === projectCode) || { project_code: projectCode, project_name: projectCode, status: 'UNKNOWN' },
    [projects, projectCode]
  )

  const people = useMemo(
    () => allEmployees.filter(e => e.project_code === projectCode),
    [allEmployees, projectCode]
  )

  const projectPos = useMemo(
    () => poRows.filter(p => p.ace_project_code === projectCode),
    [poRows, projectCode]
  )

  useEffect(() => {
    apiFetch(`/api/projects/${encodeURIComponent(projectCode)}/sites`)
      .then(r => r.ok ? r.json() : { data: [] })
      .then(d => setSites(d.data || []))
      .catch(() => setSites([]))
  }, [projectCode])

  // Aggregates for the header
  const stats = useMemo(() => {
    const total = projectPos.length
    const billed = projectPos.filter(p => p.hw_billed_at).length
    const billedAmt = projectPos.filter(p => p.hw_billed_at).reduce((s, p) => s + Number(p.line_amount || 0), 0)
    const totalAmt = projectPos.reduce((s, p) => s + Number(p.line_amount || 0), 0)
    const pacClusters = new Set(projectPos.filter(p => (p.work_type || '').toUpperCase() === 'PAC').map(p => (p.cluster_site || p.du_id || `po-${p.id}`).toString().toUpperCase())).size
    const ssvCount = projectPos.filter(p => (p.work_type || '').toUpperCase() === 'SSV').length
    return { total, billed, billedAmt, totalAmt, pacClusters, ssvCount, progressPct: total ? Math.round((billed / total) * 100) : 0 }
  }, [projectPos])

  const customer = customerOfProject(project)
  const status = project.status || 'UNKNOWN'
  const statusBg = status === 'ACTIVE' ? '#dcfce7' : status === 'COMPLETED' ? '#e2e8f0' : '#fef3c7'
  const statusFg = status === 'ACTIVE' ? '#15803d' : status === 'COMPLETED' ? '#475569' : '#a16207'

  function openPreSite() {
    try { localStorage.setItem('ace_presite_project_v1', projectCode) } catch {}
    window.location.href = '/project/presite-monitor'
  }

  return (
    <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-5">

        {/* Header — back + project info + KPI strip */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onBack}
            className="inline-flex w-fit items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50"
          >
            ← Back to Portfolio
          </button>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-[#2447d8]">
                <Briefcase size={14} /> Project Detail
              </div>
              <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{project.project_code}</h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">{project.project_name || project.project_code}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-black">
                <span className="rounded-full px-2.5 py-0.5" style={{ background: statusBg, color: statusFg }}>{status}</span>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[#1d4ed8]">{customer}</span>
                {project.team?.code && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600">{project.team.code}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <PdKpi label="People"   value={people.length} accent={ACE_BLUE} />
          <PdKpi label="POs"      value={`${stats.billed} / ${stats.total}`} sub={`${stats.progressPct}% billed`} accent="#16a34a" />
          <PdKpi label="PAC Clusters" value={stats.pacClusters} sub={`${stats.ssvCount} SSV PO`} accent="#7c3aed" />
          <PdKpi label="Pipeline" value={`฿${stats.totalAmt >= 1000000 ? (stats.totalAmt/1000000).toFixed(1) + 'M' : Math.round(stats.totalAmt).toLocaleString()}`} sub={`฿${stats.billedAmt >= 1000000 ? (stats.billedAmt/1000000).toFixed(1) + 'M' : Math.round(stats.billedAmt).toLocaleString()} billed`} accent={ACE_RED} />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-slate-200/80 bg-white p-1 shadow-sm">
          {PD_TABS.map(t => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition ${active ? 'bg-blue-50 text-[#2447d8] shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Icon size={15} /> {t.label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        {tab === 'people'   && <PdPeopleTab people={people} />}
        {tab === 'po'       && <PdPoTab pos={projectPos} />}
        {tab === 'presite'  && <PdPreSiteTab projectCode={projectCode} stats={stats} openPreSite={openPreSite} onJumpToNav={onJumpToNav} />}
        {tab === 'billing'  && <PdBillingTab pos={projectPos} />}
        {tab === 'timeline' && <PdTimelineTab pos={projectPos} sites={sites} />}
      </div>
    </main>
  )
}

function PdKpi({ label, value, sub, accent }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.04)]">
      <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-black tracking-tight" style={{ color: accent || '#1d2939' }}>{value}</div>
      {sub && <div className="mt-1 text-xs font-bold text-slate-500">{sub}</div>}
    </div>
  )
}

function PdPeopleTab({ people }) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return people
    return people.filter(e =>
      (e.full_name || '').toLowerCase().includes(q) ||
      (e.employee_code || '').toLowerCase().includes(q) ||
      (e.position || e.job_title || '').toLowerCase().includes(q)
    )
  }, [people, search])

  if (people.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center text-sm font-bold text-slate-400">
        No people assigned to this project yet
      </div>
    )
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
        <div className="text-sm font-black text-slate-900">{people.length} people</div>
        <div className="ml-auto flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-400">
          <Search size={14} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Name / code / position…"
            className="w-48 border-0 bg-transparent text-xs font-semibold text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>
      <div className="max-h-[560px] overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-3 py-2.5 text-left font-bold">Code</th>
              <th className="px-3 py-2.5 text-left font-bold">Name</th>
              <th className="px-3 py-2.5 text-left font-bold">Position</th>
              <th className="px-3 py-2.5 text-left font-bold">Section</th>
              <th className="px-3 py-2.5 text-left font-bold">Team</th>
              <th className="px-3 py-2.5 text-left font-bold">Type</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => (
              <tr key={e.employee_code} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2.5 font-mono text-[11px] font-bold text-[#2447d8]">{e.employee_code}</td>
                <td className="px-3 py-2.5 font-bold text-slate-800">{e.full_name}</td>
                <td className="px-3 py-2.5 text-slate-600">{e.position || e.job_title || '—'}</td>
                <td className="px-3 py-2.5 text-slate-600">{e.section_name || '—'}</td>
                <td className="px-3 py-2.5 text-slate-600">{e.project_team || '—'}</td>
                <td className="px-3 py-2.5 text-slate-600">{e.employment_type || '—'}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-12 text-center text-sm font-bold text-slate-400">No match for "{search}"</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PdPoTab({ pos }) {
  const groups = useMemo(() => {
    const pac = pos.filter(p => (p.work_type || '').toUpperCase() === 'PAC')
    const ssv = pos.filter(p => (p.work_type || '').toUpperCase() === 'SSV')
    const non = pos.filter(p => !['PAC', 'SSV'].includes((p.work_type || '').toUpperCase()))
    // Group PAC by cluster_site
    const pacMap = new Map()
    pac.forEach(p => {
      const key = (p.cluster_site || p.du_id || `po-${p.id}`).toString()
      if (!pacMap.has(key)) pacMap.set(key, { key, pos: [], amount: 0 })
      pacMap.get(key).pos.push(p)
      pacMap.get(key).amount += Number(p.line_amount || 0)
    })
    return {
      pac: Array.from(pacMap.values()).sort((a, b) => b.pos.length - a.pos.length),
      ssv,
      non,
    }
  }, [pos])

  const [openClusters, setOpenClusters] = useState(() => new Set())
  const fmtAmt = v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : Math.round(v).toLocaleString()

  if (pos.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center text-sm font-bold text-slate-400">
        No POs for this project
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {groups.pac.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.04)]">
          <div className="border-b border-slate-100 bg-purple-50/40 px-4 py-3 text-sm font-black text-purple-800 sm:px-5">
            PAC · {groups.pac.length} cluster · {groups.pac.reduce((s, c) => s + c.pos.length, 0)} PO
          </div>
          <div className="divide-y divide-slate-100">
            {groups.pac.map(c => {
              const isOpen = openClusters.has(c.key)
              return (
                <div key={c.key}>
                  <button
                    onClick={() => setOpenClusters(prev => { const n = new Set(prev); n.has(c.key) ? n.delete(c.key) : n.add(c.key); return n })}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-xs hover:bg-slate-50 sm:px-5"
                  >
                    <Layers size={14} className="text-purple-600" />
                    <div className="min-w-0 flex-1 truncate font-black text-slate-900">{c.key}</div>
                    <div className="text-slate-500 font-bold">{c.pos.length} PO</div>
                    <div className="font-black text-slate-800">฿{fmtAmt(c.amount)}</div>
                  </button>
                  {isOpen && (
                    <table className="w-full bg-slate-50/40 text-[11px]">
                      <tbody>
                        {c.pos.map(p => (
                          <tr key={p.id} className="border-t border-slate-100">
                            <td className="px-5 py-1.5 font-mono text-slate-700">{p.po_number || '—'}-{p.po_line || ''}</td>
                            <td className="px-3 py-1.5 font-mono text-slate-600">{p.du_id || '—'}</td>
                            <td className="px-3 py-1.5 truncate text-slate-600">{p.item_dis || '—'}</td>
                            <td className="px-3 py-1.5 text-right font-bold text-slate-800">฿{fmtAmt(Number(p.line_amount || 0))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {groups.ssv.length > 0 && (
        <PdPoFlat title={`SSV · ${groups.ssv.length} PO`} bgClass="bg-emerald-50/40" textClass="text-emerald-800" rows={groups.ssv} fmtAmt={fmtAmt} />
      )}
      {groups.non.length > 0 && (
        <PdPoFlat title={`Non-DT · ${groups.non.length} PO`} bgClass="bg-slate-50" textClass="text-slate-700" rows={groups.non} fmtAmt={fmtAmt} />
      )}
    </div>
  )
}

function PdPoFlat({ title, bgClass, textClass, rows, fmtAmt }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.04)]">
      <div className={`border-b border-slate-100 ${bgClass} px-4 py-3 text-sm font-black ${textClass} sm:px-5`}>
        {title}
      </div>
      <div className="max-h-[400px] overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left font-bold">PO No.</th>
              <th className="px-3 py-2 text-left font-bold">DU ID</th>
              <th className="px-3 py-2 text-left font-bold">Item Description</th>
              <th className="px-3 py-2 text-right font-bold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(p => (
              <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-1.5 font-mono text-[11px] font-bold text-slate-700">{p.po_number || '—'}-{p.po_line || ''}</td>
                <td className="px-3 py-1.5 font-mono text-[11px] text-slate-600">{p.du_id || '—'}</td>
                <td className="max-w-[400px] truncate px-3 py-1.5 text-slate-600" title={p.item_dis || ''}>{p.item_dis || '—'}</td>
                <td className="px-3 py-1.5 text-right font-bold text-slate-800">฿{fmtAmt(Number(p.line_amount || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PdPreSiteTab({ projectCode, stats, openPreSite, onJumpToNav }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-2 text-sm font-black text-slate-900">
          <ClipboardList size={18} className="text-emerald-600" /> SSV Pre-Site (DTE)
        </div>
        <p className="mt-2 text-xs font-semibold text-slate-500">
          Per-site drive test queue for SSV POs. Workflow: On-Air → DT Started → DT Done → Report → Check Pass.
        </p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-emerald-700">{stats.ssvCount}</span>
          <span className="text-xs font-bold text-slate-500">SSV POs in this project</span>
        </div>
        <button
          onClick={openPreSite}
          className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-emerald-700"
        >
          Open Pre-Site Monitor (DTE) →
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-2 text-sm font-black text-slate-900">
          <Layers size={18} className="text-purple-600" /> PAC Cluster (DTA)
        </div>
        <p className="mt-2 text-xs font-semibold text-slate-500">
          Cluster-level drive test + KPI analysis for PAC. Done = cluster_ready signed off.
        </p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-purple-700">{stats.pacClusters}</span>
          <span className="text-xs font-bold text-slate-500">PAC clusters in this project</span>
        </div>
        <a
          href="/project/presite-monitor-dta"
          className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-purple-600 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-purple-700"
        >
          Open Pre-Site Monitor (DTA) →
        </a>
      </div>

      <div className="lg:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800">
        Pre-Site tracking rows for <b>{projectCode}</b> live in their own monitor pages. Clicking either button above opens the correct queue with this project pre-selected.
      </div>
    </div>
  )
}

function PdBillingTab({ pos }) {
  const fmtAmt = v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : Math.round(v).toLocaleString()
  const stats = useMemo(() => {
    const total = pos.length
    const totalAmt = pos.reduce((s, p) => s + Number(p.line_amount || 0), 0)
    const billed = pos.filter(p => p.hw_billed_at).length
    const billedAmt = pos.filter(p => p.hw_billed_at).reduce((s, p) => s + Number(p.line_amount || 0), 0)
    const dtePaid = pos.filter(p => p.dte_paid_at).length
    const dtePaidAmt = pos.filter(p => p.dte_paid_at).reduce((s, p) => s + Number(p.line_amount || 0), 0)
    const pendingAmt = totalAmt - billedAmt
    return { total, totalAmt, billed, billedAmt, dtePaid, dtePaidAmt, pendingAmt }
  }, [pos])

  // Sort rows by billing state — pending first to highlight what needs attention
  const sorted = useMemo(() => {
    return [...pos].sort((a, b) => {
      const ab = a.hw_billed_at ? 1 : 0
      const bb = b.hw_billed_at ? 1 : 0
      if (ab !== bb) return ab - bb
      return Number(b.line_amount || 0) - Number(a.line_amount || 0)
    })
  }, [pos])

  if (pos.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center text-sm font-bold text-slate-400">
        No POs to bill
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <PdKpi label="Total Pipeline" value={`฿${fmtAmt(stats.totalAmt)}`} sub={`${stats.total} PO`} accent={ACE_BLUE} />
        <PdKpi label="HW Billed" value={`฿${fmtAmt(stats.billedAmt)}`} sub={`${stats.billed} / ${stats.total} PO`} accent="#16a34a" />
        <PdKpi label="DTE Paid" value={`฿${fmtAmt(stats.dtePaidAmt)}`} sub={`${stats.dtePaid} / ${stats.total} PO`} accent="#7c3aed" />
        <PdKpi label="Pending" value={`฿${fmtAmt(stats.pendingAmt)}`} sub={`${stats.total - stats.billed} PO`} accent={ACE_RED} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.04)]">
        <div className="border-b border-slate-100 px-4 py-3 text-sm font-black text-slate-900 sm:px-5">
          PO Billing Status · {pos.length} PO
        </div>
        <div className="max-h-[500px] overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left font-bold">PO No.</th>
                <th className="px-3 py-2 text-left font-bold">Type</th>
                <th className="px-3 py-2 text-right font-bold">Amount</th>
                <th className="px-3 py-2 text-left font-bold">DTE Paid</th>
                <th className="px-3 py-2 text-left font-bold">HW Billed</th>
                <th className="px-3 py-2 text-left font-bold">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(p => {
                const wt = (p.work_type || 'NON').toUpperCase()
                const wtColor = wt === 'PAC' ? 'text-purple-700 bg-purple-50' : wt === 'SSV' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 bg-slate-100'
                return (
                  <tr key={p.id} className={`border-t border-slate-100 hover:bg-slate-50 ${!p.hw_billed_at ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-3 py-2 font-mono text-[11px] font-bold text-slate-700">{p.po_number || '—'}-{p.po_line || ''}</td>
                    <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${wtColor}`}>{wt}</span></td>
                    <td className="px-3 py-2 text-right font-bold text-slate-800">฿{fmtAmt(Number(p.line_amount || 0))}</td>
                    <td className="px-3 py-2 text-slate-600">{p.dte_paid_at ? <span className="text-emerald-700 font-bold">✓ {String(p.dte_paid_at).slice(0, 10)}</span> : <span className="text-slate-400">—</span>}</td>
                    <td className="px-3 py-2 text-slate-600">{p.hw_billed_at ? <span className="text-emerald-700 font-bold">✓ {String(p.hw_billed_at).slice(0, 10)}</span> : <span className="text-amber-700 font-bold">Pending</span>}</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-slate-600">{p.hw_invoice_no || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function PdTimelineTab({ pos, sites }) {
  const milestones = useMemo(() => {
    const items = []
    // Cluster-level milestones from project_sites
    sites.forEach(s => {
      if (s.cluster_ready) items.push({ kind: 'cluster_ready', date: s.cluster_ready, label: s.rf_cluster_name || s.site_code, sub: 'Cluster ready' })
      if (s.full_on_air)   items.push({ kind: 'full_on_air',   date: s.full_on_air,   label: s.site_code,                       sub: 'Full On-Air' })
    })
    // PO-level milestones from project_pos
    pos.forEach(p => {
      if (p.on_air)         items.push({ kind: 'po_on_air',  date: p.on_air,         label: `${p.po_number || ''}-${p.po_line || ''}`, sub: 'PO On-Air' })
      if (p.hw_billed_at)   items.push({ kind: 'billed',     date: p.hw_billed_at,   label: `${p.po_number || ''}-${p.po_line || ''}`, sub: `HW Billed${p.hw_invoice_no ? ' · ' + p.hw_invoice_no : ''}` })
    })
    return items
      .filter(m => m.date)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, 60)
  }, [pos, sites])

  if (milestones.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center text-sm font-bold text-slate-400">
        No milestones recorded yet — ISDP / billing data hasn't populated dates for this project
      </div>
    )
  }

  const kindStyle = {
    cluster_ready: { color: '#7c3aed', bg: 'bg-purple-50', label: 'Cluster Ready' },
    full_on_air:   { color: '#16a34a', bg: 'bg-emerald-50', label: 'Full On-Air' },
    po_on_air:     { color: '#2447d8', bg: 'bg-blue-50', label: 'PO On-Air' },
    billed:        { color: '#0369a1', bg: 'bg-sky-50', label: 'Billed' },
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.04)]">
      <div className="border-b border-slate-100 px-4 py-3 text-sm font-black text-slate-900 sm:px-5">
        Recent milestones · showing latest {milestones.length}
      </div>
      <ul className="divide-y divide-slate-100">
        {milestones.map((m, idx) => {
          const s = kindStyle[m.kind] || kindStyle.po_on_air
          return (
            <li key={idx} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${s.bg}`} style={{ color: s.color }}>
                <CheckCircle2 size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-black text-slate-900">{m.label}</div>
                <div className="text-xs font-semibold text-slate-500">{s.label} · {m.sub}</div>
              </div>
              <div className="text-xs font-bold text-slate-600 font-mono">{String(m.date).slice(0, 10)}</div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}


function ExecutiveSummaryPage({ allEmployees, projects, projectEmployees = [], poRows = [], onOpenProjects, onNewProject, onJumpToNav, onOpenProject }) {
  const [rosterFilter, setRosterFilter] = useState({ dept: '', section: '', type: '', search: '' })
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  const emp = allEmployees.filter(isProjectManagementEmployee)
  const total = emp.length

  // Employment type
  const byType = {}
  emp.forEach(e => { const t = normalizeEmpType(e.employment_type); byType[t] = (byType[t] || 0) + 1 })
  const permanent = byType['Permanent'] || 0
  const outsource = byType['Outsource'] || 0

  // By section
  const bySection = {}
  emp.forEach(e => { const s = e.section_name || 'Unknown'; bySection[s] = (bySection[s] || 0) + 1 })
  const sectionRows = Object.entries(bySection).sort((a, b) => b[1] - a[1])
  const maxSection = sectionRows[0]?.[1] || 1

  // By department
  const byDept = {}
  emp.forEach(e => { const d = e.department || 'Unknown'; byDept[d] = (byDept[d] || 0) + 1 })
  const deptRows = Object.entries(byDept).sort((a, b) => b[1] - a[1])

  // By role
  const byRole = {}
  emp.forEach(e => { const r = e.project_role || 'OTHER'; byRole[r] = (byRole[r] || 0) + 1 })
  const roleRows = Object.entries(byRole).sort((a, b) => b[1] - a[1])
  const maxRole = roleRows[0]?.[1] || 1

  // By project (from employee.project_code)
  const byProject = {}
  emp.filter(e => e.project_code).forEach(e => { byProject[e.project_code] = (byProject[e.project_code] || 0) + 1 })

  const activeProjects = projects.filter(p => p.status === 'ACTIVE').sort((a, b) => (b.headcount || 0) - (a.headcount || 0))
  const rfCount = emp.filter(e => e.project_team === 'RF').length
  const teCount = emp.filter(e => e.project_team === 'TE').length
  const noProject = emp.filter(e => !e.project_code).length
  const pendingAssignments = projectEmployees.filter(isPendingProjectAssignment)

  // Filtered roster
  const rosterEmp = emp.filter(e => {
    const q = rosterFilter.search.toLowerCase()
    if (q && !e.full_name?.toLowerCase().includes(q) && !e.employee_code?.toLowerCase().includes(q) && !e.position?.toLowerCase().includes(q)) return false
    if (rosterFilter.dept && e.department !== rosterFilter.dept) return false
    if (rosterFilter.section && e.section_name !== rosterFilter.section) return false
    if (rosterFilter.type && normalizeEmpType(e.employment_type) !== rosterFilter.type) return false
    return true
  })

  const allDepts    = [...new Set(emp.map(e => e.department).filter(Boolean))].sort()
  const allSections = [...new Set(emp.map(e => e.section_name).filter(Boolean))].sort()

  const TYPE_COLORS = { Permanent: '#16a34a', Outsource: '#d97706', Contract: '#0369a1', Other: '#94a3b8', Unknown: '#94a3b8' }

  return (
    <main style={{ flex: 1, overflow: 'auto', padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Phase 3 — Portfolio Overview (project-centric) ─────── */}
      <PortfolioOverviewPanel
        projects={projects}
        allEmployees={allEmployees}
        poRows={poRows}
        onJumpToNav={onJumpToNav}
        onOpenProject={onOpenProject}
      />

      {/* ── Header ───────────────────────────────────────────────── */}
      <section style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <div style={{ minWidth: 0, marginRight: 'auto' }}>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#1d2939', lineHeight: 1.1 }}>Workforce Summary</div>
          <div style={{ fontSize: '.8rem', color: '#667085', marginTop: 4 }}>Project Management staff breakdown · As of {today}</div>
        </div>
        <button style={{ ...BTN_SECONDARY, background: '#fff', border: '1px solid #e4e7ec', color: '#344054' }}>Export</button>
        <button onClick={onNewProject} style={{ ...BTN_PRIMARY, borderRadius: 4 }}>+ New Project</button>
      </section>

      <PendingAssignmentAlert pending={pendingAssignments} onOpenProjects={onOpenProjects} />

      {/* ── KPI Strip ────────────────────────────────────────────── */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, flexShrink: 0 }}>
        <KpiCard label="Project Staff" value={total} note="Project Management only" color="#1d2939" accent={ACE_BLUE} />
        <KpiCard label="Active Projects" value={activeProjects.length} note="Running project codes" color={ACE_BLUE} accent="#16a34a" />
        <KpiCard label="RF Team" value={rfCount} note="RF project section" color={ACE_RED} accent={ACE_RED} />
        <KpiCard label="TE Team" value={teCount} note="TE project section" color="#7c3aed" accent="#7c3aed" />
      </section>

      {/* ── 3-Col breakdown ──────────────────────────────────────── */}
      <section style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 14, flexShrink: 0 }}>

        {/* Section breakdown */}
        <div style={{ background: '#fff', border: '1px solid #e4e7ec', borderRadius: 4, padding: 16 }}>
          <div style={{ fontSize: '.82rem', fontWeight: 900, color: '#1d2939', marginBottom: 14 }}>Headcount by Section</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {sectionRows.map(([section, count]) => (
              <SummaryBar key={section} label={section} value={count} max={maxSection} color={ACE_BLUE} suffix={` (${Math.round((count/total)*100)}%)`} />
            ))}
          </div>
        </div>

        {/* Employment type */}
        <div style={{ background: '#fff', border: '1px solid #e4e7ec', borderRadius: 4, padding: 16 }}>
          <div style={{ fontSize: '.82rem', fontWeight: 900, color: '#1d2939', marginBottom: 14 }}>Employment Type</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(byType).sort((a,b) => b[1]-a[1]).map(([type, count]) => {
              const color = TYPE_COLORS[type] || '#94a3b8'
              const pct = Math.round((count / total) * 100)
              return (
                <div key={type}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.76rem', fontWeight: 800, color: '#344054', marginBottom: 3 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 99, background: color, flexShrink: 0, display: 'inline-block' }} />
                      {type}
                    </span>
                    <span style={{ color, fontWeight: 900 }}>{count} <span style={{ color: '#94a3b8', fontWeight: 700 }}>({pct}%)</span></span>
                  </div>
                  <div style={{ height: 8, borderRadius: 99, background: '#f1f5f9', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.max(3, pct)}%`, height: '100%', background: color, borderRadius: 99 }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {deptRows.map(([dept, cnt]) => (
              <div key={dept} style={{ background: '#f8fafc', borderRadius: 6, padding: '8px 10px' }}>
                <div style={{ fontSize: '.64rem', color: '#94a3b8', fontWeight: 900 }}>{dept}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 950, color: '#1d2939' }}>{cnt}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Role distribution */}
        <div style={{ background: '#fff', border: '1px solid #e4e7ec', borderRadius: 4, padding: 16 }}>
          <div style={{ fontSize: '.82rem', fontWeight: 900, color: '#1d2939', marginBottom: 14 }}>Role Distribution <span style={{ fontSize: '.68rem', color: '#94a3b8', fontWeight: 700 }}>(Project Dept.)</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {roleRows.map(([role, count]) => (
              <SummaryBar key={role} label={ROLE_LABELS[role] || role} value={count} max={maxRole} color={role === 'DTA' ? '#2563eb' : role === 'DTE' ? ACE_RED : role === 'RF_PRO' ? '#7c3aed' : '#475569'} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Project Roster Table ──────────────────────────────────── */}
      <section style={{ background: '#fff', border: '1px solid #e4e7ec', borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontWeight: 900, color: '#1d2939', fontSize: '.9rem', flex: 1 }}>Active Projects — Headcount Roster</div>
          <span style={{ fontSize: '.72rem', color: '#94a3b8', fontWeight: 700 }}>{activeProjects.length} projects</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.78rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                {['Project Code', 'Project Name', 'Team', 'Headcount', 'Field Staff', 'Sites', 'Customer'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#667085', fontWeight: 900, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeProjects.map((p, i) => {
                const empInProject = emp.filter(e => e.project_code === p.project_code)
                const fieldStaff   = empInProject.filter(e => ['DTE','DTA','RF_PRO','OSS','OMC','SE','SS','SSR'].includes(e.project_role)).length
                const teamColor    = p.team?.code === 'RF' ? { bg: '#fee2e2', color: ACE_RED } : p.team?.code === 'TE' ? { bg: '#dbeafe', color: ACE_BLUE } : { bg: '#f1f5f9', color: '#475569' }
                return (
                  <tr key={p.project_code} style={{ borderBottom: i < activeProjects.length - 1 ? '1px solid #f8fafc' : 'none', transition: 'background .1s' }}>
                    <td style={{ ...PO_CELL, fontWeight: 900, color: ACE_BLUE }}>{p.project_code}</td>
                    <td style={{ padding: '10px 14px', color: '#344054', fontWeight: 650, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.project_name}</td>
                    <td style={PO_CELL}>
                      <span style={{ fontSize: '.68rem', fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: teamColor.bg, color: teamColor.color }}>{p.team?.code || '—'}</span>
                    </td>
                    <td style={PO_CELL}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 950, fontSize: '.95rem', color: '#1d2939', minWidth: 24 }}>{p.headcount || 0}</span>
                        <div style={{ width: 80, height: 5, borderRadius: 99, background: '#f1f5f9', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, ((p.headcount || 0) / 30) * 100)}%`, height: '100%', background: teamColor.color, borderRadius: 99, opacity: .7 }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ ...PO_CELL, color: fieldStaff > 0 ? '#1d2939' : '#94a3b8' }}>{fieldStaff > 0 ? fieldStaff : '—'}</td>
                    <td style={PO_CELL}>{p.site_count || 0}</td>
                    <td style={{ ...PO_CELL, fontWeight: 700, color: '#667085' }}>{p.customer?.code || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Staff Roster ─────────────────────────────────────────── */}
      <section style={{ background: '#fff', border: '1px solid #e4e7ec', borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 900, color: '#1d2939', fontSize: '.9rem', marginRight: 4 }}>
              Staff Roster
              <span style={{ marginLeft: 8, fontSize: '.72rem', fontWeight: 700, color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: 99 }}>{rosterEmp.length} of {total}</span>
            </div>
            <input
              placeholder="Search name / code / position…"
              value={rosterFilter.search}
              onChange={e => setRosterFilter(f => ({ ...f, search: e.target.value }))}
              style={{ ...INPUT_SM, width: 220 }}
            />
            <select value={rosterFilter.dept} onChange={e => setRosterFilter(f => ({ ...f, dept: e.target.value }))} style={{ ...INPUT_SM, width: 180 }}>
            <option value="">Project Management</option>
              {allDepts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={rosterFilter.section} onChange={e => setRosterFilter(f => ({ ...f, section: e.target.value }))} style={{ ...INPUT_SM, width: 180 }}>
              <option value="">All Sections</option>
              {allSections.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={rosterFilter.type} onChange={e => setRosterFilter(f => ({ ...f, type: e.target.value }))} style={{ ...INPUT_SM, width: 140 }}>
              <option value="">All Types</option>
              {['Permanent','Outsource'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {(rosterFilter.dept || rosterFilter.section || rosterFilter.type || rosterFilter.search) && (
              <button onClick={() => setRosterFilter({ dept: '', section: '', type: '', search: '' })} style={{ ...BTN_SECONDARY, padding: '5px 10px', fontSize: '.72rem' }}>Clear</button>
            )}
          </div>
        </div>
        <div style={{ overflowX: 'auto', maxHeight: 420, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.77rem' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                {['#', 'Employee ID', 'Name', 'Department', 'Section', 'Position', 'Role', 'Lv', 'Project', 'Type'].map(h => (
                  <th key={h} style={{ padding: '9px 12px', textAlign: 'left', color: '#667085', fontWeight: 900, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rosterEmp.map((e, i) => {
                const typeColor = TYPE_COLORS[normalizeEmpType(e.employment_type)] || '#94a3b8'
                return (
                  <tr key={e.employee_code} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '8px 12px', color: '#94a3b8', fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 900, color: ACE_BLUE, whiteSpace: 'nowrap' }}>{e.employee_code}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#1d2939', whiteSpace: 'nowrap' }}>{e.full_name}</td>
                    <td style={{ padding: '8px 12px', color: '#667085', whiteSpace: 'nowrap' }}>{e.department || '—'}</td>
                    <td style={{ padding: '8px 12px', color: '#667085', whiteSpace: 'nowrap' }}>{e.section_name || '—'}</td>
                    <td style={{ padding: '8px 12px', color: '#344054', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.position || e.job_title || '—'}</td>
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                      {e.project_role && e.project_role !== 'OTHER'
                        ? <span style={{ fontSize: '.68rem', fontWeight: 900, padding: '2px 7px', borderRadius: 99, background: e.project_role === 'DTA' ? '#dbeafe' : e.project_role === 'DTE' ? '#fee2e2' : '#f1f5f9', color: e.project_role === 'DTA' ? '#1d4ed8' : e.project_role === 'DTE' ? ACE_RED : '#475569' }}>{e.project_role}</span>
                        : <span style={{ color: '#94a3b8' }}>—</span>
                      }
                    </td>
                    <td style={{ padding: '8px 12px', color: '#475569', fontWeight: 700, whiteSpace: 'nowrap' }}>{e.job_level || '—'}</td>
                    <td style={{ padding: '8px 12px', color: '#667085', fontWeight: 700, whiteSpace: 'nowrap' }}>{e.project_code || '—'}</td>
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '.68rem', fontWeight: 900, padding: '2px 7px', borderRadius: 99, background: typeColor + '20', color: typeColor }}>{normalizeEmpType(e.employment_type)}</span>
                    </td>
                  </tr>
                )
              })}
              {rosterEmp.length === 0 && (
                <tr><td colSpan={10} style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: '.82rem' }}>No employees match the filter</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

    </main>
  )
}

function countBy(list, keyFn) {
  return list.reduce((acc, item) => {
    const key = keyFn(item) || 'Other'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
}

function normalizeProjectRole(employee) {
  const text = `${employee.project_role || ''} ${employee.position_name || ''}`.toUpperCase()
  if (text.includes('REPORT')) return 'Report Prep'
  if (text.includes('DTA') || text.includes('ANALYSIS') || text.includes('ANALYST')) return 'DTA'
  if (text.includes('DTE') || text.includes('DRIVE TEST ENGINEER')) return 'DTE'
  if (text.includes('TE') || text.includes('SITE') || text.includes('SYSTEM')) return 'TE'
  if (text.includes('PM') || text.includes('MANAGER')) return 'Project Manager'
  if (text.includes('ADMIN')) return 'Project Admin'
  return employee.project_role || employee.project_team || 'Other'
}

function DistributionPanel({ title, rows, colorMap = {} }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0) || 1
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: 14, minWidth: 0 }}>
      <div style={{ fontSize: '.82rem', fontWeight: 950, color: '#1d2939', marginBottom: 10 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.length === 0 && <div style={{ color: '#98a2b3', fontSize: '.78rem', fontWeight: 700 }}>No data</div>}
        {rows.map(row => {
          const color = colorMap[row.label] || ACE_BLUE
          return (
            <div key={row.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: '.76rem', fontWeight: 850, color: '#344054' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.label}</span>
                <span>{row.value}</span>
              </div>
              <div style={{ height: 7, borderRadius: 99, background: '#eef2f7', overflow: 'hidden', marginTop: 5 }}>
                <div style={{ width: `${Math.max(4, (row.value / total) * 100)}%`, height: '100%', background: color, borderRadius: 99 }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ProjectWorkforceInsights({ employees, projects, totalEmployees, poRows }) {
  const activeProjectEmployees = employees.filter(e => (e.status || 'ACTIVE') === 'ACTIVE')
  const assignedEmployees = employees.filter(e => e.project_code)
  const unassignedEmployees = employees.length - assignedEmployees.length
  const teamCounts = countBy(employees, e => e.project_team || 'Other')
  const roleCounts = countBy(employees, normalizeProjectRole)
  const statusCounts = countBy(employees, e => e.status || 'ACTIVE')
  const projectCounts = countBy(assignedEmployees, e => e.project_code)
  const topProjects = Object.entries(projectCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value]) => ({ label, value }))
  const roleRows = Object.entries(roleCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }))
  const teamRows = ['RF', 'TE', 'Other'].map(label => ({ label, value: teamCounts[label] || 0 })).filter(row => row.value > 0)
  const statusRows = Object.entries(statusCounts).map(([label, value]) => ({ label, value }))
  const siteCount = projects.reduce((sum, project) => sum + Number(project.site_count || 0), 0)
  const activeProjects = projects.filter(project => project.status === 'ACTIVE').length

  return (
    <section style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr 1fr', gap: 12, flexShrink: 0 }}>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: 14 }}>
        <div style={{ fontSize: '.82rem', fontWeight: 950, color: '#1d2939' }}>Workforce Summary</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginTop: 12 }}>
          {[
            ['Project Mgmt Staff', totalEmployees || employees.length, 'Project Management only'],
            ['Project People', employees.length, 'Department Project'],
            ['Active Project', activeProjectEmployees.length, 'Ready workforce'],
            ['Unassigned', unassignedEmployees, 'Need project code'],
            ['Active Projects', activeProjects, 'Running project codes'],
            ['Sites / PO', `${siteCount} / ${poRows.length}`, 'Operations scope'],
          ].map(([label, value, note]) => (
            <div key={label} style={{ border: '1px solid #edf0f5', borderRadius: 6, padding: 10, background: '#f8fafc' }}>
              <div style={{ fontSize: '.68rem', color: '#667085', fontWeight: 850 }}>{label}</div>
              <div style={{ fontSize: '1.12rem', color: '#0f172a', fontWeight: 950, marginTop: 4 }}>{value}</div>
              <div style={{ fontSize: '.66rem', color: '#98a2b3', fontWeight: 700, marginTop: 2 }}>{note}</div>
            </div>
          ))}
        </div>
      </div>
      <DistributionPanel
        title="By Project Team"
        rows={teamRows}
        colorMap={{ RF: ACE_RED, TE: ACE_BLUE, Other: '#6d3f8f' }}
      />
      <DistributionPanel
        title="By Position / Role"
        rows={roleRows.slice(0, 8)}
        colorMap={{ DTE: ACE_BLUE, DTA: ACE_RED, TE: '#16a34a', 'Report Prep': '#9333ea', 'Project Manager': '#d97706', 'Project Admin': '#475569' }}
      />
      <DistributionPanel title="Top Project Headcount" rows={topProjects} colorMap={{}} />
      <DistributionPanel title="Employment Status" rows={statusRows} colorMap={{ ACTIVE: '#16a34a', PROBATION: '#d97706', INACTIVE: ACE_RED }} />
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: 14 }}>
        <div style={{ fontSize: '.82rem', fontWeight: 950, color: '#1d2939', marginBottom: 10 }}>Recommended Checks</div>
        {[
          [unassignedEmployees, 'Employees without project code'],
          [employees.filter(e => !e.project_role).length, 'Employees without project role'],
          [projects.filter(p => Number(p.headcount || 0) === 0).length, 'Projects without headcount'],
          [projects.filter(p => Number(p.site_count || 0) === 0).length, 'Projects without sites'],
        ].map(([value, label]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '.76rem', color: '#344054', fontWeight: 850 }}>
            <span>{label}</span>
            <b style={{ color: value ? ACE_RED : '#16a34a' }}>{value}</b>
          </div>
        ))}
      </div>
    </section>
  )
}

function ProjectWorkforce({ employees }) {
  const pending = employees.filter(emp => !emp.project_role || emp.project_team === 'UNASSIGNED' || !emp.project_code)
  const displayEmployees = [...pending, ...employees.filter(emp => !pending.some(p => p.employee_code === emp.employee_code))]
  return (
    <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #edf0f5', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontWeight: 900, color: '#1d2939' }}>Project Workforce</div>
        <span style={{ fontSize: '.72rem', fontWeight: 800, color: '#667085', background: '#f2f4f7', borderRadius: 99, padding: '2px 8px' }}>{employees.length}</span>
        {pending.length > 0 && (
          <span style={{ fontSize: '.72rem', fontWeight: 900, color: ACE_RED, background: '#fee2e2', borderRadius: 99, padding: '2px 8px' }}>
            {pending.length} Pending Assignment
          </span>
        )}
        <div style={{ marginLeft: 'auto', fontSize: '.74rem', color: '#667085' }}>Synced from HR Employee Management</div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760, fontSize: '.78rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #edf0f5' }}>
              {['Employee', 'Code', 'Project Team', 'Role / Position', 'Job Level', 'Email', 'Status'].map(h => (
                <th key={h} style={{ padding: '9px 12px', textAlign: 'left', color: '#667085', fontWeight: 900, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayEmployees.slice(0, 8).map((emp, index) => (
              <tr key={emp.employee_code} style={{ borderBottom: index < Math.min(displayEmployees.length, 8) - 1 ? '1px solid #edf0f5' : 'none', background: isPendingProjectAssignment(emp) ? '#fff7ed' : '#fff' }}>
                <td style={PO_CELL}>{emp.full_name}</td>
                <td style={PO_CELL}>{emp.employee_code}</td>
                <td style={PO_CELL}>{emp.project_team === 'UNASSIGNED' ? 'Pending' : (emp.project_team || 'Project')}</td>
                <td style={PO_CELL}>{emp.position_name || emp.project_role || 'Pending Project Assignment'}</td>
                <td style={PO_CELL}>{emp.job_level || '-'}</td>
                <td style={PO_CELL}>{emp.email || '-'}</td>
                <td style={PO_CELL}>{emp.status || 'ACTIVE'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ProjectSidebar({ activeNav, setActiveNav, mobileOpen, onMobileClose }) {
  return (
    <aside className={`${mobileOpen ? 'fixed inset-y-0 left-0 z-40 flex' : 'hidden'} w-72 flex-col border-r border-slate-200 bg-white/95 p-5 shadow-lg backdrop-blur lg:sticky lg:top-0 lg:flex lg:h-screen lg:shadow-none lg:overflow-y-auto`}>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${ACE_BLUE}, ${ACE_RED})` }}>
          <Command size={24} />
        </div>
        <div className="min-w-0">
          <div className="text-base font-black text-slate-950">ACE Project Suite</div>
          <div className="text-xs font-bold text-slate-400">Project Operations</div>
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
        {PROJECT_NAV.map(item => {
          const active = item.id === activeNav
          const Icon = item.icon || Home
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

      <div className="mt-6 border-t border-slate-200 pt-4 space-y-1">
        {PROJECT_BOTTOM_NAV.map(item => {
          const active = item.id === activeNav
          const Icon = item.icon || Home
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
      </div>

      <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-sm font-black text-slate-900">
          <Sparkles size={18} style={{ color: ACE_BLUE }} />
          Project Workspace
        </div>
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
          Project profiles · PO inbox · Workforce assignments &amp; reporting.
        </p>
      </div>
    </aside>
  )
}

function ProjectIconButton({ children, label, onClick, disabled = false }) {
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

function projectInitials(name) {
  return String(name || 'PM').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || 'PM'
}

function PlaceholderPage({ label }) {
  return (
    <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: '#94a3b8' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#475569' }}>{label}</div>
        <div style={{ fontSize: '.82rem', marginTop: 6 }}>Coming soon</div>
      </div>
    </div>
  )
}

export function AddPOPage({ projects, authenticatedUser, onLogout }) {
  const [poRows, setPoRows] = useState([])
  const [activeTab, setActiveTab] = useState('overview')   // overview | finance | pm | billing | all
  const [projectFilter, setProjectFilter] = useState('')   // filter by project_code
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [confirmEdit, setConfirmEdit] = useState({})
  const [invoiceEdit, setInvoiceEdit] = useState({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [importFile, setImportFile] = useState(null)       // File object
  const [importBusy, setImportBusy] = useState(false)
  const [importResult, setImportResult] = useState(null)   // { imported, skipped, ... } after upload
  const [importError, setImportError] = useState('')

  function loadPoRows() {
    apiFetch(`${API_BASE}/project-pos`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(payload => setPoRows(payload.data || []))
      .catch(() => setPoRows([]))
  }

  useEffect(() => { loadPoRows() }, [])

  async function workflowAction(row, action, extra = {}) {
    setBusyId(row.id)
    setError('')
    try {
      const response = await apiFetch(`${API_BASE}/project-pos/${row.id}/workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.detail || 'Workflow update failed')
      setPoRows(rows => rows.map(item => item.id === row.id ? data : item))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function submitImportPO() {
    if (!importFile) return
    setImportBusy(true)
    setImportError('')
    setImportResult(null)
    try {
      const formData = new FormData()
      formData.append('file', importFile)
      const res = await apiFetch(`${API_BASE}/project-pos/import`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail || 'Import failed')
      setImportResult(data)
      if (data.imported > 0) loadPoRows()
    } catch (err) {
      setImportError(err.message)
    } finally {
      setImportBusy(false)
    }
  }

  function openImportModal() {
    setImportFile(null)
    setImportResult(null)
    setImportError('')
    setShowAddModal(true)
  }

  // ── computed ──────────────────────────────────────────────────────────────
  const filtered = projectFilter ? poRows.filter(r => r.project_code === projectFilter) : poRows

  const FINANCE_Q  = ['NEW','AUTO_MAPPED','NEED_REVIEW','NEED_MAPPING_REVIEW','FINANCE_CHECKING','FINANCE_HOLD','RETURNED_TO_FINANCE']
  const PM_Q       = ['PENDING_SITE_MAP','SITE_MAPPED','PLANNED','IN_PROGRESS','WORK_DONE','LEADER_CHECKING','LEADER_APPROVED','PENDING_PAYMENT']
  const BILLING_Q  = ['PENDING_BILLING','DTE_PAID','HW_BILLED','CLOSED']

  const financeRows = filtered.filter(r => FINANCE_Q.includes(r.workflow_status))
  const pmRows      = filtered.filter(r => PM_Q.includes(r.workflow_status))
  const billingRows = filtered.filter(r => BILLING_Q.includes(r.workflow_status))
  const allRows     = filtered

  const needAction  = filtered.filter(r => ['AUTO_MAPPED','NEED_REVIEW','RETURNED_TO_FINANCE'].includes(r.workflow_status)).length
  const pmPending   = filtered.filter(r => r.workflow_status === 'PENDING_SITE_MAP').length
  const billPending = filtered.filter(r => r.workflow_status === 'PENDING_BILLING').length
  const payPending  = filtered.filter(r => r.workflow_status === 'PENDING_PAYMENT').length
  const billed      = filtered.filter(r => ['HW_BILLED','CLOSED'].includes(r.workflow_status)).length

  // by-project summary
  const projectSummary = Object.entries(
    poRows.reduce((acc, r) => {
      const pc = r.project_code || 'Unassigned'
      if (!acc[pc]) acc[pc] = { total: 0, finance: 0, pm: 0, billing: 0, billed: 0 }
      acc[pc].total++
      if (FINANCE_Q.includes(r.workflow_status)) acc[pc].finance++
      else if (PM_Q.includes(r.workflow_status)) acc[pc].pm++
      else if (r.workflow_status === 'PENDING_BILLING') acc[pc].billing++
      else if (['HW_BILLED','CLOSED'].includes(r.workflow_status)) acc[pc].billed++
      return acc
    }, {})
  ).sort(([a], [b]) => a.localeCompare(b))

  const sTone = s => {
    if (!s||s==='NEW')            return { bg:'#f1f5f9',fg:'#475569' }
    if (s==='AUTO_MAPPED')        return { bg:'#dbeafe',fg:'#1e40af' }
    if (s==='NEED_REVIEW')        return { bg:'#fef3c7',fg:'#92400e' }
    if (s==='FINANCE_HOLD')       return { bg:'#fee2e2',fg:'#991b1b' }
    if (s==='RETURNED_TO_FINANCE')return { bg:'#fee2e2',fg:'#b91c1c' }
    if (s==='PENDING_SITE_MAP')   return { bg:'#e0f2fe',fg:'#0369a1' }
    if (s==='SITE_MAPPED')        return { bg:'#dcfce7',fg:'#166534' }
    if (s==='PLANNED')            return { bg:'#fef9c3',fg:'#854d0e' }
    if (s==='IN_PROGRESS')        return { bg:'#fed7aa',fg:'#9a3412' }
    if (s==='WORK_DONE')          return { bg:'#d1fae5',fg:'#065f46' }
    if (s==='LEADER_CHECKING')    return { bg:'#ede9fe',fg:'#5b21b6' }
    if (s==='LEADER_APPROVED')    return { bg:'#ddd6fe',fg:'#4c1d95' }
    if (s==='PENDING_PAYMENT')    return { bg:'#bfdbfe',fg:'#1d4ed8' }
    if (s==='PENDING_BILLING')    return { bg:'#e9d5ff',fg:'#6b21a8' }
    if (s==='DTE_PAID')           return { bg:'#cffafe',fg:'#0e7490' }
    if (s==='HW_BILLED')          return { bg:'#ede9fe',fg:'#4c1d95' }
    if (s==='CLOSED')             return { bg:'#dcfce7',fg:'#14532d' }
    return { bg:'#f1f5f9',fg:'#475569' }
  }

  function SBadge({ s }) {
    const t = sTone(s)
    return <span style={{ background:t.bg, color:t.fg, fontSize:'.65rem', fontWeight:900, padding:'2px 8px', borderRadius:99, whiteSpace:'nowrap' }}>{s||'NEW'}</span>
  }
  function WBadge({ wt }) {
    if (!wt) return <span style={{ color:'#cbd5e1',fontSize:'.68rem' }}>—</span>
    return <span style={{ background:wt==='SSV'?'#dbeafe':'#f3e8ff', color:wt==='SSV'?'#1e40af':'#6b21a8', fontSize:'.65rem', fontWeight:900, padding:'2px 8px', borderRadius:99 }}>{wt}</span>
  }

  // ── shared table renderer ─────────────────────────────────────────────────
  const COLS = ['PO Number','Type','Status','Project','DU-ID','Site','On-air','Action']
  function POTable({ rows, emptyMsg = 'ไม่มีรายการ' }) {
    if (!rows.length) return <div style={{ padding:'32px', textAlign:'center', color:'#94a3b8', fontSize:'.82rem', fontWeight:700 }}>{emptyMsg}</div>
    return (
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.78rem' }}>
          <thead>
            <tr style={{ background:'#f8fafc', borderBottom:'1px solid #e5e7eb' }}>
              {COLS.map(h => <th key={h} style={{ padding:'9px 12px', textAlign:'left', color:'#667085', fontWeight:900, whiteSpace:'nowrap' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const busy = busyId === row.id
              const ce = confirmEdit[row.id] || {}
              const needsFill = !row.project_code || !row.work_type
              const canConfirm = (ce.project_code||row.project_code) && (ce.work_type||row.work_type)
              return (
                <tr key={row.id} style={{ borderBottom: i<rows.length-1?'1px solid #edf0f5':'none' }}>
                  <td style={PO_CELL}>
                    <div style={{ fontWeight:700 }}>{row.po_number}</div>
                    <div style={{ fontSize:'.68rem', color:'#94a3b8' }}>{row.po_line}</div>
                  </td>
                  <td style={PO_CELL}><WBadge wt={row.work_type} /></td>
                  <td style={PO_CELL}><SBadge s={row.workflow_status} /></td>
                  <td style={{ ...PO_CELL, fontWeight:800, color:ACE_BLUE }}>{row.project_code || <span style={{color:'#fbbf24'}}>—</span>}</td>
                  <td style={PO_CELL}>{row.du_id||'—'}</td>
                  <td style={PO_CELL}>{row.site_code||<span style={{color:'#cbd5e1'}}>—</span>}</td>
                  <td style={PO_CELL}>{row.on_air||'—'}</td>
                  <td style={{ ...PO_CELL, minWidth:260 }}>
                    {/* Finance queue: confirm / hold */}
                    {FINANCE_Q.includes(row.workflow_status) && (
                      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                        {needsFill && (
                          <div style={{ display:'flex', gap:4 }}>
                            <select value={ce.project_code??(row.project_code||'')} onChange={e=>setConfirmEdit(p=>({...p,[row.id]:{...p[row.id],project_code:e.target.value}}))} style={{...INPUT_SM,flex:1}}>
                              <option value="">— Project —</option>
                              {[...new Set(projects.map(p=>p.project_code).filter(Boolean))].sort().map(c=><option key={c} value={c}>{c}</option>)}
                            </select>
                            <select value={ce.work_type??(row.work_type||'')} onChange={e=>setConfirmEdit(p=>({...p,[row.id]:{...p[row.id],work_type:e.target.value}}))} style={{...INPUT_SM,width:68}}>
                              <option value="">Type</option>
                              <option value="SSV">SSV</option>
                              <option value="PAC">PAC</option>
                            </select>
                          </div>
                        )}
                        <div style={{ display:'flex', gap:4 }}>
                          <button disabled={busy||!canConfirm} onClick={()=>{workflowAction(row,'FINANCE_CONFIRM',{project_code:ce.project_code||row.project_code,work_type:ce.work_type||row.work_type});setConfirmEdit(p=>{const n={...p};delete n[row.id];return n})}} style={{...BTN_PRIMARY,padding:'5px 10px',fontSize:'.68rem',background:'#0284c7',opacity:canConfirm?1:0.5}}>✓ Confirm → PM</button>
                          <button disabled={busy} onClick={()=>workflowAction(row,'HOLD',{hold_reason:'Finance hold'})} style={{...BTN_SECONDARY,padding:'5px 8px',fontSize:'.68rem'}}>Hold</button>
                        </div>
                      </div>
                    )}
                    {/* PM queue: read-only progress */}
                    {PM_Q.includes(row.workflow_status) && (
                      <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                        {row.planned_dte_names && <span style={{ fontSize:'.67rem', color:'#475569' }}>DTE: {row.planned_dte_names}</span>}
                        {row.planned_start_date && <span style={{ fontSize:'.65rem', color:'#94a3b8' }}>{row.planned_start_date}{row.planned_end_date?` → ${row.planned_end_date}`:''}</span>}
                        {/* Finance: pay DTE if PENDING_PAYMENT */}
                        {row.workflow_status === 'PENDING_PAYMENT' && (
                          <button disabled={busy} onClick={()=>workflowAction(row,'PAY_DTE')} style={{...BTN_PRIMARY,padding:'5px 8px',fontSize:'.67rem',background:'#0284c7',marginTop:2}}>💰 จ่าย DTE</button>
                        )}
                      </div>
                    )}
                    {/* Billing queue */}
                    {row.workflow_status === 'PENDING_BILLING' && (
                      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                        <input placeholder="Invoice No." value={invoiceEdit[row.id]||''} onChange={e=>setInvoiceEdit(p=>({...p,[row.id]:e.target.value}))} style={{...INPUT_SM,fontSize:'.67rem'}} />
                        <button disabled={busy||!invoiceEdit[row.id]} onClick={()=>workflowAction(row,'BILL_HW',{hw_invoice_no:invoiceEdit[row.id]})} style={{...BTN_PRIMARY,padding:'5px 8px',fontSize:'.68rem',background:'#7c3aed',opacity:invoiceEdit[row.id]?1:0.5}}>📤 วางบิล HW</button>
                      </div>
                    )}
                    {row.workflow_status === 'DTE_PAID' && <span style={{fontSize:'.68rem',color:'#0284c7',fontWeight:700}}>✓ จ่าย DTE แล้ว</span>}
                    {row.workflow_status === 'HW_BILLED' && (
                      <div>
                        <div style={{fontSize:'.68rem',color:'#7c3aed',fontWeight:700}}>✓ วางบิล HW แล้ว</div>
                        {row.hw_invoice_no && <div style={{fontSize:'.65rem',color:'#64748b'}}>{row.hw_invoice_no}</div>}
                      </div>
                    )}
                    {row.workflow_status === 'CLOSED' && <span style={{fontSize:'.68rem',color:'#16a34a',fontWeight:700}}>✓ ปิดครบทั้งคู่ 🔒</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  // ── nav tabs config ──────────────────────────────────────────────────────
  const NAV_TABS = [
    { id:'overview', label:'ภาพรวม' },
    { id:'finance',  label:'Finance Review', count: financeRows.length, alert: needAction > 0 },
    { id:'pm',       label:'กับ PM',         count: pmRows.length },
    { id:'billing',  label:'วางบิล',         count: billingRows.length, alert: billPending > 0 },
    { id:'all',      label:'ทั้งหมด',        count: allRows.length },
  ]

  return (
    <div style={FIN_STYLES.page}>

      {/* ═══ SIDEBAR ═══════════════════════════════════════════════════════ */}
      <aside style={FIN_STYLES.sidebar}>
        {/* Brand */}
        <div style={FIN_STYLES.brandBlock}>
          <div style={FIN_STYLES.logo}>FIN</div>
          <div>
            <div style={FIN_STYLES.brandTitle}>PO Control Center</div>
            <div style={FIN_STYLES.brandSub}>Finance — PO Workflow</div>
          </div>
        </div>

        {/* Tab nav */}
        <nav style={FIN_STYLES.nav}>
          {NAV_TABS.map(t => (
            <button key={t.id} type="button" onClick={()=>setActiveTab(t.id)}
              style={{ ...FIN_STYLES.navButton, ...(activeTab===t.id ? FIN_STYLES.navButtonActive : {}) }}>
              <span style={{ flex:1, textAlign:'left' }}>{t.label}</span>
              {t.count !== undefined && (
                <span style={{ ...FIN_STYLES.navBadge, background: activeTab===t.id ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.12)', color: t.alert ? '#fbbf24' : 'rgba(255,255,255,.8)' }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Project filter */}
        <div style={{ borderTop:'1px solid rgba(255,255,255,.12)', paddingTop:16 }}>
          <div style={{ fontSize:'.62rem', fontWeight:900, color:'rgba(255,255,255,.45)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8, paddingLeft:4 }}>โปรเจค</div>
          <button onClick={()=>setProjectFilter('')} style={{ ...FIN_STYLES.navButton, ...(projectFilter==='' ? FIN_STYLES.navButtonActive : {}), justifyContent:'space-between' }}>
            <span>ทั้งหมด</span><span style={FIN_STYLES.navBadge}>{poRows.length}</span>
          </button>
          {projectSummary.map(([pc, s]) => (
            <button key={pc} type="button" onClick={()=>setProjectFilter(projectFilter===pc?'':pc)}
              style={{ ...FIN_STYLES.navButton, ...(projectFilter===pc ? FIN_STYLES.navButtonActive : {}), flexDirection:'column', alignItems:'flex-start', gap:5 }}>
              <div style={{ display:'flex', justifyContent:'space-between', width:'100%' }}>
                <span>{pc}</span>
                <span style={FIN_STYLES.navBadge}>{s.total}</span>
              </div>
              <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
                {s.finance > 0 && <span style={FIN_STYLES.miniChip('#bfdbfe','#1e40af')}>F {s.finance}</span>}
                {s.pm > 0     && <span style={FIN_STYLES.miniChip('#bae6fd','#0369a1')}>PM {s.pm}</span>}
                {s.billing > 0 && <span style={FIN_STYLES.miniChip('#e9d5ff','#6b21a8')}>บิล {s.billing}</span>}
                {s.billed > 0  && <span style={FIN_STYLES.miniChip('#bbf7d0','#166534')}>✓ {s.billed}</span>}
              </div>
            </button>
          ))}
        </div>

        {/* Quick links to other pages */}
        <div style={{ borderTop:'1px solid rgba(255,255,255,.12)', paddingTop:16, marginTop:8, display:'grid', gap:4 }}>
          <div style={{ fontSize:'.62rem', fontWeight:900, color:'rgba(255,255,255,.45)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6, paddingLeft:4 }}>ไปยังหน้าอื่น</div>
          <a href="/projects/monitor" style={{ ...FIN_STYLES.navButton, textDecoration:'none', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:'.78rem' }}>↗</span> Project Monitor
          </a>
          <a href="/overview" style={{ ...FIN_STYLES.navButton, textDecoration:'none', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:'.78rem' }}>⊞</span> Platform Overview
          </a>
        </div>

        {/* User box */}
        <div style={FIN_STYLES.userBox}>
          <div style={FIN_STYLES.userName}>{authenticatedUser?.name || 'Finance User'}</div>
          <div style={FIN_STYLES.userRole}>{authenticatedUser?.role || 'ACCOUNTING'}</div>
          {onLogout && <button type="button" onClick={onLogout} style={FIN_STYLES.logoutButton}>Logout</button>}
        </div>
      </aside>

      {/* ═══ MAIN ══════════════════════════════════════════════════════════ */}
      <main style={FIN_STYLES.main}>

        {/* Header banner */}
        <header style={FIN_STYLES.header}>
          <div>
            <div style={FIN_STYLES.eyebrow}>Finance — PO Workflow</div>
            <h1 style={FIN_STYLES.title}>PO Control Center</h1>
            <p style={FIN_STYLES.subtitle}>ติดตามสถานะ PO ทุกขั้นตอน ตั้งแต่ Finance รับ จนถึงปิดบิล HW</p>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <button onClick={loadPoRows} style={FIN_STYLES.headerBtn}>↻ Refresh</button>
            <button onClick={openImportModal} style={{ ...FIN_STYLES.headerBtn, background:'rgba(255,255,255,.28)', fontWeight:900 }}>+ Import PO</button>
          </div>
          <div style={FIN_STYLES.headerPanel}>
            <div style={FIN_STYLES.headerPanelLabel}>Total PO Lines</div>
            <div style={FIN_STYLES.headerPanelValue}>{filtered.length}{projectFilter ? ` / ${poRows.length}` : ''}</div>
            <div style={FIN_STYLES.headerPanelMeta}>
              {needAction > 0 ? `⚠ ${needAction} รายการรอ Finance Confirm` : '✓ Finance queue ว่างอยู่'}
            </div>
          </div>
        </header>

        {/* Stats grid */}
        <section style={FIN_STYLES.statsGrid}>
          {[
            { label:'รอ Finance Confirm', val:needAction,  note:'AUTO_MAPPED / NEED_REVIEW', tone:'red'   },
            { label:'PM กำลังทำงาน',     val:pmPending,   note:'รอ Map Site → Execute',     tone:'blue'  },
            { label:'รอจ่าย DTE',        val:payPending,  note:'Leader อนุมัติแล้ว',        tone:'amber' },
            { label:'รอวางบิล HW',       val:billPending, note:'หลักฐาน HW ครบแล้ว',       tone:'amber' },
            { label:'วางบิลแล้ว',        val:billed,      note:'HW_BILLED / CLOSED',        tone:'green' },
          ].map(k => {
            const tones = { blue:{c:ACE_BLUE,bg:'#eef3ff'}, red:{c:'#dc2626',bg:'#fef2f2'}, amber:{c:'#b45309',bg:'#fff7ed'}, green:{c:'#047857',bg:'#ecfdf3'} }
            const t = tones[k.tone] || tones.blue
            return (
              <div key={k.label} style={FIN_STYLES.statCard}>
                <div style={{ display:'inline-grid', minWidth:52, minHeight:34, placeItems:'center', padding:'0 10px', borderRadius:8, fontSize:'1.1rem', fontWeight:950, background:t.bg, color:t.c }}>{k.val}</div>
                <div style={{ marginTop:10, color:'#475467', fontSize:'.76rem', fontWeight:850 }}>{k.label}</div>
                <div style={{ marginTop:5, color:'#667085', fontSize:'.72rem', fontWeight:650 }}>{k.note}</div>
              </div>
            )
          })}
        </section>

        {error && <div style={{ padding:'10px 16px', color:'#dc2626', fontSize:'.78rem', fontWeight:800, background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:6, marginTop:4 }}>{error}</div>}

        {/* Content section */}
        <section style={FIN_STYLES.section}>
          {activeTab === 'overview' && (
            <>
              <div style={FIN_STYLES.sectionHeader}>
                <div>
                  <h2 style={FIN_STYLES.sectionTitle}>สถานะแต่ละโปรเจค</h2>
                  <div style={FIN_STYLES.sectionSub}>คลิกที่โปรเจคเพื่อดูรายละเอียดทั้งหมด</div>
                </div>
              </div>
              <div style={{ width:'100%', overflowX:'auto', border:'1px solid #edf0f5', borderRadius:8 }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.78rem' }}>
                  <thead>
                    <tr style={{ background:'#f8fafc', borderBottom:'1px solid #e5e7eb' }}>
                      {['Project','Total PO','Finance Review','กับ PM','รอวางบิล','วางบิลแล้ว','Progress'].map(h=>(
                        <th key={h} style={{ padding:'9px 12px', textAlign:'left', color:'#667085', fontWeight:900, whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {projectSummary.map(([pc, s]) => {
                      const pct = s.total > 0 ? Math.round((s.billed/s.total)*100) : 0
                      return (
                        <tr key={pc} style={{ borderBottom:'1px solid #edf0f5', cursor:'pointer' }} onClick={()=>{setProjectFilter(pc);setActiveTab('all')}}>
                          <td style={{ ...PO_CELL, fontWeight:800, color:ACE_BLUE }}>{pc}</td>
                          <td style={PO_CELL}>{s.total}</td>
                          <td style={PO_CELL}>{s.finance > 0 ? <span style={{color:'#0284c7',fontWeight:700}}>{s.finance}</span> : <span style={{color:'#cbd5e1'}}>—</span>}</td>
                          <td style={PO_CELL}>{s.pm > 0 ? <span style={{color:'#6366f1',fontWeight:700}}>{s.pm}</span> : <span style={{color:'#cbd5e1'}}>—</span>}</td>
                          <td style={PO_CELL}>{s.billing > 0 ? <span style={{color:'#7c3aed',fontWeight:700}}>{s.billing}</span> : <span style={{color:'#cbd5e1'}}>—</span>}</td>
                          <td style={PO_CELL}>{s.billed > 0 ? <span style={{color:'#16a34a',fontWeight:700}}>{s.billed}</span> : <span style={{color:'#cbd5e1'}}>—</span>}</td>
                          <td style={{ ...PO_CELL, minWidth:120 }}>
                            <div style={{ height:6, background:'#e5e7eb', borderRadius:99, overflow:'hidden' }}>
                              <div style={{ height:'100%', width:`${pct}%`, background:'#16a34a', borderRadius:99 }} />
                            </div>
                            <div style={{ fontSize:'.65rem', color:'#94a3b8', marginTop:2 }}>{pct}%</div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'finance' && (
            <>
              <div style={FIN_STYLES.sectionHeader}>
                <div>
                  <h2 style={FIN_STYLES.sectionTitle}>Finance Review</h2>
                  <div style={FIN_STYLES.sectionSub}>
                    {needAction > 0 ? `⚠ ${needAction} รายการรอ Confirm — เลือก Project + Work Type แล้วกด Confirm → PM` : '✓ Finance queue ว่างอยู่'}
                  </div>
                </div>
              </div>
              <POTable rows={financeRows} emptyMsg="ไม่มีรายการรอ Finance" />
            </>
          )}

          {activeTab === 'pm' && (
            <>
              <div style={FIN_STYLES.sectionHeader}>
                <div>
                  <h2 style={FIN_STYLES.sectionTitle}>กับ PM</h2>
                  <div style={FIN_STYLES.sectionSub}>
                    {pmPending > 0 ? `📍 ${pmPending} รายการรอ PM Map Site` : 'PM Queue — ดูความคืบหน้าแต่ละ PO'}
                  </div>
                </div>
              </div>
              <POTable rows={pmRows} emptyMsg="ไม่มีรายการกับ PM" />
            </>
          )}

          {activeTab === 'billing' && (
            <>
              <div style={FIN_STYLES.sectionHeader}>
                <div>
                  <h2 style={FIN_STYLES.sectionTitle}>วางบิล</h2>
                  <div style={FIN_STYLES.sectionSub}>
                    {billPending > 0 ? `🧾 ${billPending} รายการรอวางบิล — กรอก Invoice No. แล้วกด วางบิล HW` : '✓ ไม่มีรายการรอวางบิล'}
                  </div>
                </div>
              </div>
              <POTable rows={billingRows} emptyMsg="ไม่มีรายการในส่วน billing" />
            </>
          )}

          {activeTab === 'all' && (
            <>
              <div style={FIN_STYLES.sectionHeader}>
                <div>
                  <h2 style={FIN_STYLES.sectionTitle}>ทั้งหมด</h2>
                  <div style={FIN_STYLES.sectionSub}>{allRows.length} รายการ{projectFilter ? ` — กรอง: ${projectFilter}` : ''}</div>
                </div>
                {projectFilter && (
                  <button onClick={()=>setProjectFilter('')} style={{ ...BTN_SECONDARY, fontSize:'.72rem', padding:'5px 10px' }}>✕ ยกเลิกกรอง</button>
                )}
              </div>
              <POTable rows={allRows} emptyMsg="ไม่มีรายการ" />
            </>
          )}
        </section>

      {/* ── Import PO Modal ── */}
      {showAddModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={e=>{if(e.target===e.currentTarget&&!importBusy)setShowAddModal(false)}}>
          <div style={{ background:'#fff', borderRadius:10, width:520, padding:28, boxShadow:'0 8px 40px rgba(0,0,0,.18)', maxHeight:'85vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>

            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'1.05rem', fontWeight:900, color:'#1d2939' }}>Import PO จากไฟล์ Excel</div>
                <div style={{ fontSize:'.72rem', color:'#94a3b8', marginTop:2 }}>รองรับ .xlsx — ระบบจะข้าม PO ที่มีอยู่แล้ว (duplicate)</div>
              </div>
              <button onClick={()=>{if(!importBusy)setShowAddModal(false)}} style={{ border:'none', background:'none', fontSize:'1.2rem', cursor:'pointer', color:'#94a3b8' }}>✕</button>
            </div>

            <div style={{ overflowY:'auto', flex:1 }}>

              {/* File drop zone */}
              {!importResult && (
                <>
                  <label style={{ display:'block', border:`2px dashed ${importFile?'#2447d8':'#cbd5e1'}`, borderRadius:8, padding:'32px 20px', textAlign:'center', cursor:'pointer', background:importFile?'#eef3ff':'#f8fafc', transition:'all .15s' }}>
                    <input type="file" accept=".xlsx,.xls" style={{ display:'none' }} onChange={e=>{setImportFile(e.target.files[0]||null);setImportError('')}} />
                    {importFile ? (
                      <div>
                        <div style={{ fontSize:'2rem', marginBottom:8 }}>📄</div>
                        <div style={{ fontWeight:900, color:'#1d2939', fontSize:'.88rem' }}>{importFile.name}</div>
                        <div style={{ fontSize:'.72rem', color:'#94a3b8', marginTop:4 }}>{(importFile.size/1024).toFixed(1)} KB — คลิกเพื่อเปลี่ยนไฟล์</div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize:'2.2rem', marginBottom:8 }}>📂</div>
                        <div style={{ fontWeight:800, color:'#344054', fontSize:'.88rem' }}>คลิกเพื่อเลือกไฟล์ Excel</div>
                        <div style={{ fontSize:'.72rem', color:'#94a3b8', marginTop:4 }}>รองรับ .xlsx (Excel 2007+)</div>
                      </div>
                    )}
                  </label>

                  {/* Column hint */}
                  <div style={{ marginTop:14, padding:'10px 14px', background:'#f8fafc', borderRadius:6, border:'1px solid #e5e7eb' }}>
                    <div style={{ fontSize:'.68rem', fontWeight:900, color:'#667085', marginBottom:6 }}>คอลัมน์ที่ระบบอ่านได้ (row 1 = header)</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                      {['PO Number *','PO Line','Vendor','Project Code','Work Type','DU ID','Item Description','On Air'].map(c=>(
                        <span key={c} style={{ fontSize:'.63rem', background:c.includes('*')?'#dbeafe':'#e5e7eb', color:c.includes('*')?'#1e40af':'#475569', fontWeight:800, padding:'2px 7px', borderRadius:99 }}>{c}</span>
                      ))}
                    </div>
                    <div style={{ fontSize:'.65rem', color:'#94a3b8', marginTop:6 }}>* จำเป็น — Vendor: HW หรือ ZTE</div>
                  </div>

                  {importError && (
                    <div style={{ marginTop:10, padding:'10px 14px', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:6, color:'#dc2626', fontSize:'.78rem', fontWeight:700 }}>
                      {importError}
                    </div>
                  )}
                </>
              )}

              {/* Result panel */}
              {importResult && (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {/* Summary */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                    <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, padding:'14px', textAlign:'center' }}>
                      <div style={{ fontSize:'1.6rem', fontWeight:900, color:'#16a34a' }}>{importResult.imported}</div>
                      <div style={{ fontSize:'.72rem', fontWeight:800, color:'#166534', marginTop:4 }}>นำเข้าสำเร็จ</div>
                    </div>
                    <div style={{ background:'#fffbeb', border:'1px solid #fed7aa', borderRadius:8, padding:'14px', textAlign:'center' }}>
                      <div style={{ fontSize:'1.6rem', fontWeight:900, color:'#d97706' }}>{importResult.skipped}</div>
                      <div style={{ fontSize:'.72rem', fontWeight:800, color:'#92400e', marginTop:4 }}>ซ้ำ (ข้ามไป)</div>
                    </div>
                    <div style={{ background: importResult.errors > 0 ? '#fef2f2':'#f8fafc', border:`1px solid ${importResult.errors>0?'#fca5a5':'#e5e7eb'}`, borderRadius:8, padding:'14px', textAlign:'center' }}>
                      <div style={{ fontSize:'1.6rem', fontWeight:900, color:importResult.errors>0?'#dc2626':'#94a3b8' }}>{importResult.errors}</div>
                      <div style={{ fontSize:'.72rem', fontWeight:800, color:importResult.errors>0?'#991b1b':'#94a3b8', marginTop:4 }}>Error</div>
                    </div>
                  </div>

                  {/* Skipped list */}
                  {importResult.skipped_rows?.length > 0 && (
                    <div>
                      <div style={{ fontSize:'.72rem', fontWeight:900, color:'#92400e', marginBottom:6 }}>รายการที่ซ้ำ (ไม่ได้นำเข้า)</div>
                      <div style={{ maxHeight:160, overflowY:'auto', border:'1px solid #fed7aa', borderRadius:6 }}>
                        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.72rem' }}>
                          <thead>
                            <tr style={{ background:'#fffbeb' }}>
                              <th style={{ padding:'6px 10px', textAlign:'left', fontWeight:900, color:'#92400e' }}>PO Number</th>
                              <th style={{ padding:'6px 10px', textAlign:'left', fontWeight:900, color:'#92400e' }}>Line</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importResult.skipped_rows.map((r, i) => (
                              <tr key={i} style={{ borderTop:'1px solid #fef3c7' }}>
                                <td style={{ padding:'5px 10px', fontWeight:700 }}>{r.po_number}</td>
                                <td style={{ padding:'5px 10px', color:'#94a3b8' }}>{r.po_line || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Error list */}
                  {importResult.error_rows?.length > 0 && (
                    <div>
                      <div style={{ fontSize:'.72rem', fontWeight:900, color:'#dc2626', marginBottom:6 }}>รายการที่มี Error</div>
                      <div style={{ maxHeight:120, overflowY:'auto', border:'1px solid #fca5a5', borderRadius:6, padding:'8px 10px' }}>
                        {importResult.error_rows.map((r, i) => (
                          <div key={i} style={{ fontSize:'.68rem', color:'#dc2626', marginBottom:3 }}>Row {r.row}: {r.po_number} — {r.error}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div style={{ display:'flex', gap:8, marginTop:20, justifyContent:'flex-end', borderTop:'1px solid #f1f5f9', paddingTop:16 }}>
              {!importResult ? (
                <>
                  <button onClick={()=>setShowAddModal(false)} style={{...BTN_SECONDARY}} disabled={importBusy}>ยกเลิก</button>
                  <button
                    disabled={!importFile || importBusy}
                    onClick={submitImportPO}
                    style={{...BTN_PRIMARY, opacity:!importFile||importBusy?0.5:1}}
                  >
                    {importBusy ? 'กำลัง Import…' : `นำเข้าไฟล์${importFile?` "${importFile.name}"`:''}` }
                  </button>
                </>
              ) : (
                <>
                  <button onClick={()=>{setImportResult(null);setImportFile(null)}} style={{...BTN_SECONDARY}}>Import ไฟล์อื่น</button>
                  <button onClick={()=>setShowAddModal(false)} style={{...BTN_PRIMARY}}>ปิด</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Billing — HW revenue Plan vs Actual, split by Project × Month, per AC milestone
// ─────────────────────────────────────────────────────────────────────────────
function flattenMilestones(pos) {
  const out = []
  pos.forEach(p => {
    const amt = Number(p.line_amount || 0)
    const parts = String(p.payment_terms || '').split('/').map(s => parseFloat(s)).filter(n => !isNaN(n))
    const ac1 = parts[0] ?? 100
    const ac2 = parts[1] ?? null
    const project = p.ace_project_code || p.project_code || '—'
    const site = p.site_code || p.cluster_site || '—'
    const vendor = p.vendor || 'HW'
    const base = { poId: p.id, project, site, vendor, hw_id: p.hw_id, work_type: p.work_type, po_number: p.po_number }
    out.push({ ...base, key: `${p.id}-ac1`, ac: 'ac1', pct: ac1, amount: amt * ac1 / 100, billed_at: p.ac1_billed_at || null, invoice_no: p.ac1_invoice_no || '' })
    if (ac2 != null) out.push({ ...base, key: `${p.id}-ac2`, ac: 'ac2', pct: ac2, amount: amt * ac2 / 100, billed_at: p.ac2_billed_at || null, invoice_no: p.ac2_invoice_no || '' })
  })
  return out
}

const MONTH_LABEL = ym => { const [y, mo] = ym.split('-'); return new Date(y, mo - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }) }
const FMT_THB = v => '฿' + Number(v || 0).toLocaleString('th-TH', { maximumFractionDigits: 0 })

function BillingPage({ authenticatedUser }) {
  const [pos, setPos] = useState([])
  const [plans, setPlans] = useState([])          // billing_plan target rows
  const [tab, setTab] = useState('plan')          // 'plan' | 'actual'
  const [vendor, setVendor] = useState('HW')      // HW | ERICSSON | NBTC
  const [draft, setDraft] = useState({})          // in-progress edits: `${project}|${month}` → string
  const [error, setError] = useState('')

  const load = useCallback(() => {
    apiFetch(`${API_BASE}/project-pos`).then(r => r.ok ? r.json() : { data: [] }).then(d => setPos(d.data || [])).catch(() => setPos([]))
    apiFetch(`${API_BASE}/billing-plan`).then(r => r.ok ? r.json() : { data: [] }).then(d => setPlans(d.data || [])).catch(() => setPlans([]))
  }, [])
  useEffect(() => { load() }, [load])

  // Save a target cell (top-down plan). amount empty/0 = clear to 0.
  async function savePlan(project, month, amount) {
    try {
      const res = await apiFetch(`${API_BASE}/billing-plan`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ace_project_code: project, month, vendor, planned_amount: Number(amount) || 0 }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed')
      const row = await res.json()
      setPlans(rows => { const i = rows.findIndex(r => r.ace_project_code === project && r.vendor === vendor && r.month === month); return i >= 0 ? rows.map((r, j) => j === i ? row : r) : [...rows, row] })
    } catch (e) { setError(e.message) }
  }

  // Mark/clear actual billing on a PO AC milestone
  async function updateBilling(poId, ac, patch) {
    try {
      const res = await apiFetch(`${API_BASE}/project-pos/${poId}/billing`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestone: ac, ...patch }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed')
      const updated = await res.json()
      setPos(rows => rows.map(r => r.id === poId ? updated : r))
    } catch (e) { setError(e.message) }
  }

  const milestones = useMemo(() => flattenMilestones(pos).filter(m => m.vendor === vendor), [pos, vendor])
  const projects = useMemo(() => [...new Set(milestones.map(m => m.project))].sort(), [milestones])

  const months = useMemo(() => {
    const set = new Set()
    const now = new Date()
    for (let i = -1; i <= 6; i++) { const d = new Date(now.getFullYear(), now.getMonth() + i, 1); set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`) }
    plans.filter(p => p.vendor === vendor).forEach(p => set.add(p.month))
    milestones.forEach(m => { if (m.billed_at) set.add(String(m.billed_at).slice(0, 7)) })
    return [...set].sort()
  }, [plans, milestones, vendor])

  // Plan targets (top-down) keyed by project|month
  const planMap = useMemo(() => {
    const m = {}
    plans.filter(p => p.vendor === vendor).forEach(p => { m[`${p.ace_project_code}|${p.month}`] = Number(p.planned_amount || 0) })
    return m
  }, [plans, vendor])

  // Actual billed (bottom-up) per project → month
  const actualMap = useMemo(() => {
    const m = {}
    milestones.forEach(ms => { if (!ms.billed_at) return; const k = `${ms.project}|${String(ms.billed_at).slice(0, 7)}`; m[k] = (m[k] || 0) + ms.amount })
    return m
  }, [milestones])

  const totals = useMemo(() => {
    const plan = Object.values(planMap).reduce((s, v) => s + v, 0)
    const actual = Object.values(actualMap).reduce((s, v) => s + v, 0)
    const pipeline = milestones.reduce((s, m) => s + m.amount, 0)
    return { plan, actual, pipeline }
  }, [planMap, actualMap, milestones])

  const showActual = tab === 'actual'

  return (
    <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-[#2447d8]"><Wallet size={14} /> Project · Billing</div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Revenue — Plan vs Actual</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">Set a monthly revenue target per project (Plan), then bill specific POs (Actual).</p>
          </div>
          <select value={vendor} onChange={e => setVendor(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700">
            {['HW', 'ERICSSON', 'NBTC'].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <PdKpi label="Pipeline (PO value)" value={FMT_THB(totals.pipeline)} sub={`${vendor} · ${milestones.length} milestones`} accent={ACE_BLUE} />
          <PdKpi label="Plan Target" value={FMT_THB(totals.plan)} sub={`${Math.round(totals.plan / (totals.pipeline || 1) * 100)}% of pipeline`} accent="#7c3aed" />
          <PdKpi label="Actual Billed" value={FMT_THB(totals.actual)} sub={`${Math.round(totals.actual / (totals.plan || 1) * 100)}% of plan`} accent="#16a34a" />
          <PdKpi label="Plan − Actual" value={FMT_THB(totals.plan - totals.actual)} sub="outstanding vs plan" accent={ACE_RED} />
        </div>

        <div className="flex w-fit items-center gap-1 rounded-2xl border border-slate-200/80 bg-white p-1 shadow-sm">
          {[['plan', 'Plan (targets)'], ['actual', 'Actual (bill POs)']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`rounded-xl px-5 py-2 text-sm font-black transition ${tab === id ? 'bg-blue-50 text-[#2447d8] shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>{label}</button>
          ))}
        </div>

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700">{error}</div>}

        {/* Matrix: Project × Month */}
        <div className="overflow-auto rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.04)]">
          <table className="w-full text-xs" style={{ minWidth: 820 }}>
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2.5 text-left font-bold">Project</th>
                {months.map(mo => <th key={mo} className="px-3 py-2.5 text-right font-bold whitespace-nowrap">{MONTH_LABEL(mo)}</th>)}
                <th className="px-3 py-2.5 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => {
                const rowTotal = months.reduce((s, mo) => s + (showActual ? (actualMap[`${p}|${mo}`] || 0) : (planMap[`${p}|${mo}`] || 0)), 0)
                return (
                  <tr key={p} className="border-t border-slate-100">
                    <td className="sticky left-0 z-10 bg-white px-3 py-2.5 font-black text-[#2447d8] whitespace-nowrap">{p}</td>
                    {months.map(mo => {
                      const key = `${p}|${mo}`
                      const planVal = planMap[key] || 0
                      const actualVal = actualMap[key] || 0
                      if (showActual) {
                        return (
                          <td key={mo} className="px-3 py-2.5 text-right whitespace-nowrap">
                            {actualVal > 0 ? <b className="text-emerald-700">{FMT_THB(actualVal)}</b> : <span className="text-slate-200">—</span>}
                            {planVal > 0 && <div className="text-[10px] font-bold text-slate-400">/ {FMT_THB(planVal)}</div>}
                          </td>
                        )
                      }
                      // Plan tab: editable target cell
                      return (
                        <td key={mo} className="px-2 py-1.5 text-right">
                          <input
                            type="number" min="0" placeholder="—"
                            value={draft[key] ?? (planVal || '')}
                            onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
                            onBlur={e => { const v = e.target.value; setDraft(d => { const n = { ...d }; delete n[key]; return n }); if (Number(v || 0) !== planVal) savePlan(p, mo, v) }}
                            className="w-20 rounded border border-slate-200 px-1.5 py-1 text-right text-[11px] font-bold text-slate-800 focus:border-blue-300"
                          />
                        </td>
                      )
                    })}
                    <td className="px-3 py-2.5 text-right font-black text-slate-900 whitespace-nowrap">{FMT_THB(rowTotal)}</td>
                  </tr>
                )
              })}
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-black">
                <td className="sticky left-0 z-10 bg-slate-50 px-3 py-2.5 text-slate-900">Total</td>
                {months.map(mo => { const t = projects.reduce((s, p) => s + (showActual ? (actualMap[`${p}|${mo}`] || 0) : (planMap[`${p}|${mo}`] || 0)), 0); return <td key={mo} className="px-3 py-2.5 text-right text-slate-900 whitespace-nowrap">{t > 0 ? FMT_THB(t) : <span className="text-slate-300">—</span>}</td> })}
                <td className="px-3 py-2.5 text-right text-slate-900">{FMT_THB(showActual ? totals.actual : totals.plan)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {showActual
          ? <BillingActualList milestones={milestones} updateBilling={updateBilling} />
          : <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-4 text-xs font-semibold text-slate-500">
              💡 กรอกตัวเลขเป้าวางบิลต่อ Project × Month ในตารางด้านบน (top-down) — ไม่ต้องระบุ PO · ไปแท็บ <b>Actual</b> เพื่อเลือก PO มาวางบิลจริง
            </div>}
      </div>
    </main>
  )
}

// Actual tab: pick specific POs to bill (sets ac billed_at + invoice). Searchable.
function BillingActualList({ milestones, updateBilling }) {
  const [q, setQ] = useState('')
  const [onlyUnbilled, setOnlyUnbilled] = useState(false)
  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase()
    return milestones.filter(m => {
      if (onlyUnbilled && m.billed_at) return false
      if (!ql) return true
      return [m.project, m.site, m.po_number, m.hw_id].filter(Boolean).join(' ').toLowerCase().includes(ql)
    }).sort((a, b) => (a.billed_at ? 1 : 0) - (b.billed_at ? 1 : 0) || a.project.localeCompare(b.project))
  }, [milestones, q, onlyUnbilled])

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
        <span className="text-sm font-black text-slate-900">Bill POs · {rows.length}</span>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search PO / Site / HW ID…" className="flex-1 max-w-xs rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold outline-none" />
        <button onClick={() => setOnlyUnbilled(v => !v)} className={`rounded-xl px-3 py-1.5 text-xs font-black ${onlyUnbilled ? 'bg-blue-50 text-[#2447d8]' : 'border border-slate-200 text-slate-500'}`}>Unbilled only</button>
      </div>
      <div className="max-h-[460px] overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left font-bold">Project</th>
              <th className="px-3 py-2 text-left font-bold">Site / Cluster</th>
              <th className="px-3 py-2 text-left font-bold">PO No.</th>
              <th className="px-3 py-2 text-left font-bold">AC</th>
              <th className="px-3 py-2 text-right font-bold">Amount</th>
              <th className="px-3 py-2 text-left font-bold">Billing</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(m => (
              <tr key={m.key} className={`border-t border-slate-100 hover:bg-slate-50 ${m.billed_at ? 'bg-emerald-50/30' : ''}`}>
                <td className="px-3 py-2 font-black text-[#2447d8] whitespace-nowrap">{m.project}</td>
                <td className="max-w-[200px] truncate px-3 py-2 text-slate-600" title={m.site}>{m.site}</td>
                <td className="px-3 py-2 font-mono text-[11px] text-slate-500 whitespace-nowrap">{m.po_number || '—'}</td>
                <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${m.ac === 'ac1' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>{m.ac.toUpperCase()} · {m.pct}%</span></td>
                <td className="px-3 py-2 text-right font-bold text-slate-900 whitespace-nowrap">{FMT_THB(m.amount)}</td>
                <td className="px-3 py-2">
                  {m.billed_at
                    ? <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-emerald-700">✓ {m.invoice_no || 'billed'} <span className="font-semibold text-slate-400">{String(m.billed_at).slice(0, 10)}</span>
                        <button onClick={() => updateBilling(m.poId, m.ac, { billed: false })} className="text-slate-300 hover:text-red-500">✕</button></span>
                    : <button onClick={() => { const inv = window.prompt('HW Invoice No. (optional):', ''); updateBilling(m.poId, m.ac, { billed: true, ...(inv ? { invoice_no: inv } : {}) }) }} className="rounded-lg bg-[#2447d8] px-3 py-1 text-[11px] font-black text-white">Bill</button>}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="px-3 py-10 text-center text-sm font-bold text-slate-400">No POs</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ProjectPOInboxPage({ projects }) {
  const [poRows, setPoRows] = useState([])
  const [sitesByProject, setSitesByProject] = useState({})  // { project_code: [sites] }
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  // per-row mapping state: { [po_id]: { project_code, site_code } }
  const [mapState, setMapState] = useState({})
  // per-row plan DTE state: { [po_id]: { dte_codes, dte_names, start_date, end_date } }
  const [planState, setPlanState] = useState({})
  // DTE employees loaded from API
  const [dteEmployees, setDteEmployees] = useState([])
  // All-PO list filters
  const [poSearch, setPoSearch] = useState('')
  const [poProjectFilter, setPoProjectFilter] = useState('')
  const [poTypeFilter, setPoTypeFilter] = useState('')
  const [poChangeFilter, setPoChangeFilter] = useState('')   // '' | NEW | CHANGED | OLD
  const [poVendorFilter, setPoVendorFilter] = useState('')   // '' | HW | ERICSSON | NBTC

  function loadPoRows() {
    apiFetch(`${API_BASE}/project-pos`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(payload => setPoRows(payload.data || []))
      .catch(() => setPoRows([]))
  }

  async function loadSites(project_code) {
    if (!project_code || sitesByProject[project_code]) return
    try {
      const r = await apiFetch(`${API_BASE}/projects/${project_code}/sites`)
      const data = await r.json()
      setSitesByProject(prev => ({ ...prev, [project_code]: data.data || [] }))
    } catch { /* ignore */ }
  }

  async function loadDteEmployees() {
    if (dteEmployees.length > 0) return
    try {
      const r = await apiFetch(`${API_BASE}/employees?status=ACTIVE&limit=300`)
      const data = await r.json()
      const dte = (data.data || []).filter(e => ['DTE', 'DTA', 'RF'].includes(e.project_team) || e.project_role === 'DTE')
      setDteEmployees(dte)
    } catch { /* ignore */ }
  }

  function setPlan(id, key, val) {
    setPlanState(prev => ({ ...prev, [id]: { ...prev[id], [key]: val } }))
  }

  useEffect(() => { loadPoRows() }, [])

  // Update HW billing plan/actual for one AC milestone, patch row in place
  async function updateBilling(poId, milestone, patch) {
    try {
      const res = await apiFetch(`${API_BASE}/project-pos/${poId}/billing`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestone, ...patch }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed')
      const updated = await res.json()
      setPoRows(rows => rows.map(r => r.id === poId ? updated : r))
    } catch (err) { setError(err.message) }
  }

  async function workflowAction(row, action, extra = {}) {
    setBusyId(row.id)
    setError('')
    try {
      const res = await apiFetch(`${API_BASE}/project-pos/${row.id}/workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail || 'Failed')
      setPoRows(rows => rows.map(item => item.id === row.id ? data : item))
      setMapState(prev => { const n = { ...prev }; delete n[row.id]; return n })
    } catch (err) { setError(err.message) }
    finally { setBusyId(null) }
  }

  function setMap(id, key, val) {
    setMapState(prev => ({ ...prev, [id]: { ...prev[id], [key]: val } }))
  }

  const projectCodes = [...new Set(projects.map(p => p.project_code).filter(Boolean))].sort()

  // All-PO inventory (every HW PO line) + filters
  const poProjectOptions = [...new Set(poRows.map(r => r.ace_project_code || r.project_code).filter(Boolean))].sort()
  const fmtTHB = v => v != null ? Number(v).toLocaleString('th-TH', { maximumFractionDigits: 0 }) : '—'
  // Latest import batch = newest hw_first_seen date → POs first seen in that
  // batch are "NEW"; POs whose hw_status_changed_at is set are "CHANGED"
  // (show prev → current). Everything else = old/unchanged.
  const latestSeenDay = poRows.reduce((mx, r) => {
    const d = (r.hw_first_seen_at || '').slice(0, 10)
    return d > mx ? d : mx
  }, '')
  // changeOf(po): { kind: 'NEW' | 'CHANGED' | 'OLD', from, to }
  const changeOf = r => {
    if (r.hw_status_changed_at) return { kind: 'CHANGED', from: r.hw_prev_status || '?', to: r.hw_po_status || '?', at: String(r.hw_status_changed_at).slice(0, 10) }
    if (latestSeenDay && (r.hw_first_seen_at || '').slice(0, 10) === latestSeenDay) return { kind: 'NEW', at: latestSeenDay }
    return { kind: 'OLD' }
  }
  const poVendorOptions = [...new Set(poRows.map(r => r.vendor || 'HW'))].sort()
  // Vendor tabs: fixed order + dynamic extras, with per-vendor PO counts
  const VENDOR_ORDER = ['HW', 'ERICSSON', 'NBTC']
  const vendorTabs = [...VENDOR_ORDER, ...poVendorOptions.filter(v => !VENDOR_ORDER.includes(v))]
  const vendorCounts = poRows.reduce((acc, r) => { const v = r.vendor || 'HW'; acc[v] = (acc[v] || 0) + 1; return acc }, {})
  const vendorTone = v => v === 'HW' ? { bg: '#fee2e2', fg: '#b91c1c' } : v === 'ERICSSON' ? { bg: '#dbeafe', fg: '#1e40af' } : v === 'NBTC' ? { bg: '#dcfce7', fg: '#166534' } : { bg: '#f1f5f9', fg: '#475569' }
  const filteredAllPos = poRows.filter(r => {
    const proj = r.ace_project_code || r.project_code || ''
    if (poProjectFilter && proj !== poProjectFilter) return false
    if (poVendorFilter && (r.vendor || 'HW') !== poVendorFilter) return false
    const wt = (r.work_type || 'NON').toUpperCase()
    if (poTypeFilter && (poTypeFilter === 'NON' ? !!r.work_type : wt !== poTypeFilter)) return false
    if (poChangeFilter && changeOf(r).kind !== poChangeFilter) return false
    const q = poSearch.trim().toLowerCase()
    if (q) {
      const hay = [r.po_number, r.po_line, r.du_id, r.cluster_site, r.site_code, r.item_dis, proj].filter(Boolean).join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
  const allPoTotal = filteredAllPos.reduce((s, r) => s + Number(r.line_amount || 0), 0)
  // counts per change kind (for filter labels)
  const changeCounts = poRows.reduce((acc, r) => { const k = changeOf(r).kind; acc[k] = (acc[k] || 0) + 1; return acc }, {})
  // Split payment_terms ("100" | "70/30") into AC1 / AC2 milestone percentages
  const parseAC = terms => {
    const parts = String(terms || '').split('/').map(p => parseFloat(p)).filter(n => !isNaN(n))
    return { ac1: parts[0] ?? null, ac2: parts[1] ?? null }
  }

  // Queue A: no project_code → Project must assign
  const queueA = poRows.filter(r => r.workflow_status === 'NEED_MAPPING_REVIEW')
  // Queue B: has project_code → Project must map site
  const queueB = poRows.filter(r => r.workflow_status === 'PENDING_SITE_MAP')
  // Queue C: site mapped → ready to plan DTE
  const queueC = poRows.filter(r => r.workflow_status === 'SITE_MAPPED')
  // Queue D: planned / in-progress / work done → Leader reviews
  const queueD = poRows.filter(r => ['PLANNED', 'IN_PROGRESS', 'WORK_DONE', 'LEADER_CHECKING', 'LEADER_APPROVED'].includes(r.workflow_status))

  const statusTone = status => {
    if (status === 'APPROVED')          return { bg: '#dcfce7', fg: '#166534' }
    if (status === 'PENDING_APPROVAL')  return { bg: '#ede9fe', fg: '#5b21b6' }
    if (status === 'SITE_MAPPED')       return { bg: '#dcfce7', fg: '#166534' }
    if (status === 'PENDING_SITE_MAP')  return { bg: '#dbeafe', fg: '#1e40af' }
    if (status === 'NEED_MAPPING_REVIEW') return { bg: '#fef3c7', fg: '#92400e' }
    return { bg: '#f1f5f9', fg: '#475569' }
  }

  const COL_HDR = { padding: '10px 12px', textAlign: 'left', color: '#667085', fontWeight: 900, whiteSpace: 'nowrap' }

  function PoRow({ row, showProjectDrop }) {
    const busy = busyId === row.id
    const ms = mapState[row.id] || {}
    const tone = statusTone(row.workflow_status)
    const sitesForRow = sitesByProject[ms.project_code || row.project_code] || []

    return (
      <tr style={{ borderBottom: '1px solid #edf0f5' }}>
        <td style={PO_CELL}>
          {row.work_type && <span style={{ background: row.work_type === 'SSV' ? '#dbeafe' : '#f3e8ff', color: row.work_type === 'SSV' ? '#1e40af' : '#6b21a8', fontSize: '.62rem', fontWeight: 900, padding: '1px 6px', borderRadius: 99, marginRight: 4 }}>{row.work_type}</span>}
          {row.po_number}
        </td>
        <td style={PO_CELL}>{row.po_line || '-'}</td>
        <td style={{ ...PO_CELL, color: ACE_BLUE, fontWeight: 900 }}>{row.project_code || <span style={{ color: '#fbbf24' }}>Unassigned</span>}</td>
        <td style={PO_CELL}><span style={{ background: tone.bg, color: tone.fg, fontSize: '.65rem', fontWeight: 900, padding: '2px 8px', borderRadius: 99 }}>{row.workflow_status}</span></td>
        <td style={PO_CELL}>{row.site_code ? <span style={{ fontWeight: 900, color: '#16a34a' }}>{row.site_code}</span> : <span style={{ color: '#cbd5e1' }}>—</span>}</td>
        <td style={PO_CELL}>{row.du_id || '-'}</td>
        <td style={PO_CELL}>{row.cluster_site || '-'}</td>
        <td style={{ ...PO_CELL, color: Number(row.aging_days || 0) >= 3 ? ACE_RED : '#667085', fontWeight: 900 }}>{row.aging_days || 0}d</td>
        <td style={{ ...PO_CELL, minWidth: 360 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* Queue A: assign project_code */}
            {showProjectDrop && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <select
                  value={ms.project_code || ''}
                  onChange={e => { setMap(row.id, 'project_code', e.target.value); loadSites(e.target.value) }}
                  style={{ ...INPUT_SM, flex: 1 }}
                >
                  <option value="">— เลือก Project —</option>
                  {projectCodes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
            {/* Site dropdown — shown when project_code is known */}
            {(ms.project_code || row.project_code) && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <select
                  value={ms.site_code || ''}
                  onChange={e => setMap(row.id, 'site_code', e.target.value)}
                  onFocus={() => loadSites(ms.project_code || row.project_code)}
                  style={{ ...INPUT_SM, flex: 1 }}
                >
                  <option value="">— เลือก Site —</option>
                  {sitesForRow.map(s => (
                    <option key={s.site_code} value={s.site_code}>{s.site_code}{s.site_name ? ` — ${s.site_name}` : ''}</option>
                  ))}
                </select>
              </div>
            )}
            <div style={{ display: 'flex', gap: 6 }}>
              {showProjectDrop ? (
                <button
                  disabled={busy || !ms.project_code}
                  onClick={() => workflowAction(row, 'ASSIGN_PROJECT', { project_code: ms.project_code, site_code: ms.site_code || undefined })}
                  style={{ ...BTN_PRIMARY, padding: '5px 12px', fontSize: '.68rem' }}
                >
                  Assign & Map
                </button>
              ) : (
                <button
                  disabled={busy || !ms.site_code}
                  onClick={() => workflowAction(row, 'MAP_SITE', { site_code: ms.site_code })}
                  style={{ ...BTN_PRIMARY, padding: '5px 12px', fontSize: '.68rem' }}
                >
                  Confirm Map
                </button>
              )}
              <button
                disabled={busy}
                onClick={() => workflowAction(row, 'RETURN_FINANCE', { note: 'Project: ข้อมูล PO ไม่ถูกต้อง' })}
                style={{ ...BTN_SECONDARY, padding: '5px 8px', fontSize: '.68rem' }}
              >
                Return Finance
              </button>
            </div>
          </div>
        </td>
      </tr>
    )
  }

  const WK_BADGE = { SSV: { bg: '#dbeafe', fg: '#1e40af' }, PAC: { bg: '#f3e8ff', fg: '#6b21a8' } }
  function WTypeBadge({ wt }) {
    if (!wt) return null
    const c = WK_BADGE[wt] || { bg: '#f1f5f9', fg: '#475569' }
    return <span style={{ background: c.bg, color: c.fg, fontSize: '.62rem', fontWeight: 900, padding: '1px 6px', borderRadius: 99, marginRight: 4 }}>{wt}</span>
  }

  function SiteMappedRow({ row }) {
    const tone = statusTone(row.workflow_status)
    const busy = busyId === row.id
    const ps = planState[row.id] || {}
    const canPlan = ps.dte_codes && ps.start_date
    return (
      <tr style={{ borderBottom: '1px solid #edf0f5' }}>
        <td style={PO_CELL}><WTypeBadge wt={row.work_type} />{row.po_number}</td>
        <td style={PO_CELL}>{row.po_line || '-'}</td>
        <td style={{ ...PO_CELL, color: ACE_BLUE, fontWeight: 900 }}>{row.project_code}</td>
        <td style={PO_CELL}><span style={{ background: tone.bg, color: tone.fg, fontSize: '.65rem', fontWeight: 900, padding: '2px 8px', borderRadius: 99 }}>{row.workflow_status}</span></td>
        <td style={{ ...PO_CELL, color: '#16a34a', fontWeight: 900 }}>{row.site_code}</td>
        <td style={PO_CELL}>{row.du_id || '-'}</td>
        <td style={PO_CELL}>{row.cluster_site || '-'}</td>
        <td style={{ ...PO_CELL, color: Number(row.aging_days || 0) >= 3 ? ACE_RED : '#667085', fontWeight: 900 }}>{row.aging_days || 0}d</td>
        <td style={{ ...PO_CELL, minWidth: 280 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', gap: 5 }}>
              <select
                value={ps.dte_codes || ''}
                onChange={e => {
                  const emp = dteEmployees.find(d => d.employee_code === e.target.value)
                  setPlan(row.id, 'dte_codes', e.target.value)
                  setPlan(row.id, 'dte_names', emp ? emp.full_name || emp.employee_code : e.target.value)
                }}
                onFocus={loadDteEmployees}
                style={{ ...INPUT_SM, flex: 1, minWidth: 120 }}
              >
                <option value="">— เลือก DTE —</option>
                {dteEmployees.map(e => <option key={e.employee_code} value={e.employee_code}>{e.full_name || e.employee_code}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              <input type="date" value={ps.start_date || ''} onChange={e => setPlan(row.id, 'start_date', e.target.value)} style={{ ...INPUT_SM, width: 120 }} />
              <span style={{ alignSelf: 'center', color: '#94a3b8', fontSize: '.72rem' }}>ถึง</span>
              <input type="date" value={ps.end_date || ''} onChange={e => setPlan(row.id, 'end_date', e.target.value)} style={{ ...INPUT_SM, width: 120 }} />
            </div>
            <button
              disabled={busy || !canPlan}
              onClick={() => workflowAction(row, 'PLAN_DTE', {
                planned_dte_codes: ps.dte_codes,
                planned_dte_names: ps.dte_names,
                planned_start_date: ps.start_date,
                planned_end_date: ps.end_date,
              })}
              style={{ ...BTN_PRIMARY, padding: '5px 12px', fontSize: '.68rem', opacity: canPlan ? 1 : 0.5 }}
            >📋 Assign DTE</button>
          </div>
        </td>
      </tr>
    )
  }

  const TABLE_HEADERS = ['PO / Type', 'Line', 'Project', 'Status', 'Site', 'DU-ID', 'Cluster - Site', 'Aging', 'Action']

  return (
    <main style={{ flex: 1, overflow: 'auto', padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <section style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <div style={{ minWidth: 0, marginRight: 'auto' }}>
          <div style={{ fontSize: '.76rem', color: '#667085', fontWeight: 800, marginBottom: 7 }}>HW Purchase Orders</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#1d2939', lineHeight: 1.1 }}>Project PO</div>
          <div style={{ fontSize: '.82rem', color: '#667085', marginTop: 4 }}>All HW POs — ฿{fmtTHB(allPoTotal)} · {filteredAllPos.length} items</div>
        </div>
        <button onClick={loadPoRows} style={{ ...BTN_SECONDARY, background: '#fff', border: '1px solid #e4e7ec', color: '#344054' }}>Refresh</button>
      </section>

      {error && <div style={{ padding: '10px 18px', color: ACE_RED, fontSize: '.78rem', fontWeight: 800, background: '#fff', border: '1px solid #fca5a5', borderRadius: 6 }}>{error}</div>}

      {/* ── PO inventory by vendor ──────────────────────────────── */}
      <section style={{ background: '#fff', border: '1px solid #e4e7ec', borderRadius: 8, overflow: 'hidden' }}>
        {/* Vendor tab strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderBottom: '1px solid #edf0f5', background: '#fbfcfe', overflowX: 'auto' }}>
          {[{ v: '', label: 'All Vendors', count: poRows.length }, ...vendorTabs.map(v => ({ v, label: v, count: vendorCounts[v] || 0 }))].map(({ v, label, count }) => {
            const active = poVendorFilter === v
            const tone = v ? vendorTone(v) : { bg: '#eef2ff', fg: ACE_BLUE }
            return (
              <button
                key={v || 'all'}
                onClick={() => setPoVendorFilter(v)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                  border: active ? `1.5px solid ${tone.fg}` : '1.5px solid transparent',
                  background: active ? tone.bg : 'transparent', color: active ? tone.fg : '#667085',
                  fontSize: '.82rem', fontWeight: 900, whiteSpace: 'nowrap', transition: 'all .12s',
                }}
              >
                {label}
                <span style={{ background: active ? '#fff' : '#eef2f6', color: active ? tone.fg : '#94a3b8', fontSize: '.66rem', fontWeight: 900, padding: '1px 8px', borderRadius: 99 }}>{count}</span>
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '12px 16px', borderBottom: '1px solid #edf0f5' }}>
          <span style={{ fontSize: '.85rem', fontWeight: 900, color: '#1d2939' }}>{poVendorFilter || 'All'} PO ({filteredAllPos.length})</span>
          <input
            value={poSearch}
            onChange={e => setPoSearch(e.target.value)}
            placeholder="Search PO / DU / Site / item…"
            style={{ flex: '1 1 220px', maxWidth: 320, padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '.8rem', outline: 'none' }}
          />
          <select value={poProjectFilter} onChange={e => setPoProjectFilter(e.target.value)} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '.8rem', fontWeight: 700 }}>
            <option value="">All Projects</option>
            {poProjectOptions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={poTypeFilter} onChange={e => setPoTypeFilter(e.target.value)} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '.8rem', fontWeight: 700 }}>
            <option value="">All Types</option>
            <option value="PAC">PAC</option>
            <option value="SSV">SSV</option>
            <option value="NON">Non-DT</option>
          </select>
          <select value={poChangeFilter} onChange={e => setPoChangeFilter(e.target.value)} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '.8rem', fontWeight: 700 }}>
            <option value="">All Changes</option>
            <option value="NEW">🆕 New ({changeCounts.NEW || 0})</option>
            <option value="CHANGED">⟳ Changed ({changeCounts.CHANGED || 0})</option>
            <option value="OLD">Unchanged ({changeCounts.OLD || 0})</option>
          </select>
          <span style={{ marginLeft: 'auto', fontSize: '.8rem', fontWeight: 900, color: '#1d2939' }}>฿{fmtTHB(allPoTotal)}</span>
        </div>
        <div style={{ overflow: 'auto', maxHeight: 540 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1080, fontSize: '.78rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                {['Project', 'Vendor', 'Type', 'ID (HW)', 'PO Status', 'Change', 'Site Code / Cluster', 'Item Description', 'Amount', 'AC1', 'AC2', 'Billed'].map((h, i) => (
                  <th key={h} style={{ ...COL_HDR, textAlign: (i === 8 || i === 9 || i === 10) ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAllPos.map(r => {
                const wt = (r.work_type || '').toUpperCase()
                const wtStyle = wt === 'SSV' ? { bg: '#dbeafe', fg: '#1e40af' } : wt === 'PAC' ? { bg: '#f3e8ff', fg: '#6b21a8' } : { bg: '#f1f5f9', fg: '#475569' }
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ ...PO_CELL, color: ACE_BLUE, fontWeight: 900, whiteSpace: 'nowrap' }}>{r.ace_project_code || r.project_code || <span style={{ color: '#fbbf24' }}>—</span>}</td>
                    <td style={PO_CELL}>{(() => { const v = r.vendor || 'HW'; const vs = v === 'HW' ? { bg: '#fee2e2', fg: '#b91c1c' } : v === 'ERICSSON' ? { bg: '#dbeafe', fg: '#1e40af' } : { bg: '#dcfce7', fg: '#166534' }; return <span style={{ background: vs.bg, color: vs.fg, fontSize: '.6rem', fontWeight: 900, padding: '2px 7px', borderRadius: 99, whiteSpace: 'nowrap' }}>{v}</span> })()}</td>
                    <td style={PO_CELL}><span style={{ background: wtStyle.bg, color: wtStyle.fg, fontSize: '.6rem', fontWeight: 900, padding: '2px 7px', borderRadius: 99 }}>{wt || 'Non-DT'}</span></td>
                    <td style={{ ...PO_CELL, fontFamily: 'monospace', fontSize: '.68rem', color: '#0f766e', fontWeight: 700, whiteSpace: 'nowrap' }} title={r.hw_id || ''}>{r.hw_id || '—'}</td>
                    <td style={PO_CELL}>{(() => { const st = r.hw_po_status || r.hw_data?.['PO Status'] || '—'; const cancel = /cancel/i.test(st); const done = /complete|accept|finish|done/i.test(st); const bg = cancel ? '#fee2e2' : done ? '#dcfce7' : '#f1f5f9'; const fg = cancel ? '#b91c1c' : done ? '#166534' : '#475569'; return <span style={{ background: bg, color: fg, fontSize: '.62rem', fontWeight: 900, padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap' }}>{st}</span> })()}</td>
                    <td style={PO_CELL}>{(() => { const c = changeOf(r); if (c.kind === 'NEW') return <span style={{ background: '#dbeafe', color: '#1e40af', fontSize: '.6rem', fontWeight: 900, padding: '2px 8px', borderRadius: 99 }} title={`First seen in import ${c.at}`}>🆕 NEW</span>; if (c.kind === 'CHANGED') return <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '.6rem', fontWeight: 900, padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap' }} title={`Changed ${c.at}`}>⟳ {c.from}→{c.to}</span>; return <span style={{ color: '#cbd5e1', fontSize: '.66rem' }}>—</span> })()}</td>
                    <td style={{ ...PO_CELL, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#475569' }} title={r.site_code || r.cluster_site || ''}>{r.site_code || r.cluster_site || '—'}</td>
                    <td style={{ ...PO_CELL, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#94a3b8' }} title={r.item_dis || ''}>{r.item_dis || '—'}</td>
                    {(() => {
                      const amt = Number(r.line_amount || 0)
                      const { ac1, ac2 } = parseAC(r.payment_terms)
                      const cell = (pct) => pct == null ? <span style={{ color: '#cbd5e1' }}>—</span> : (
                        <span><b style={{ color: '#0f172a' }}>฿{fmtTHB(amt * pct / 100)}</b> <span style={{ color: '#94a3b8', fontSize: '.66rem', fontWeight: 700 }}>{pct}%</span></span>
                      )
                      return (<>
                        <td style={{ ...PO_CELL, textAlign: 'right', fontWeight: 800, color: '#1d2939', whiteSpace: 'nowrap' }}>฿{fmtTHB(amt)}</td>
                        <td style={{ ...PO_CELL, textAlign: 'right', whiteSpace: 'nowrap' }}>{cell(ac1)}</td>
                        <td style={{ ...PO_CELL, textAlign: 'right', whiteSpace: 'nowrap', background: ac2 != null ? '#fffbeb' : undefined }}>{cell(ac2)}</td>
                      </>)
                    })()}
                    <td style={PO_CELL}>{r.hw_billed_at ? <span style={{ color: '#16a34a', fontWeight: 800 }}>✓ {String(r.hw_billed_at).slice(0, 10)}</span> : <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                  </tr>
                )
              })}
              {filteredAllPos.length === 0 && (
                <tr><td colSpan={12} style={{ padding: 28, textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>No POs match the filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 10, flexShrink: 0 }}>
        <KpiCard label="Need Project" value={queueA.length} note="No project_code" color="#d97706" accent="#d97706" />
        <KpiCard label="Need Site Map" value={queueB.length} note="Has project · pick site" color={ACE_BLUE} accent={ACE_BLUE} />
        <KpiCard label="Mapped — Plan DTE" value={queueC.length} note="Site mapped · assign DTE" color="#16a34a" accent="#16a34a" />
        <KpiCard label="Plan / Execute / Review" value={queueD.length} note="DTE working / Leader review" color="#7c3aed" accent="#7c3aed" />
      </section>

      {/* Queue A: NEED_MAPPING_REVIEW */}
      {queueA.length > 0 && (
        <section style={{ background: '#fff', border: '1px solid #fde68a', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid #fde68a', background: '#fffbeb', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '.82rem', fontWeight: 900, color: '#92400e' }}>⚠ Need Project Code ({queueA.length})</span>
            <span style={{ fontSize: '.76rem', color: '#b45309' }}>Finance ใส่ PO มาโดยไม่ระบุ Project — Project ต้องเลือก project + site</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1200, fontSize: '.78rem' }}>
              <thead><tr style={{ background: '#fefce8', borderBottom: '1px solid #fde68a' }}>
                {TABLE_HEADERS.map(h => <th key={h} style={{ ...COL_HDR }}>{h}</th>)}
              </tr></thead>
              <tbody>{queueA.map(row => <PoRow key={row.id} row={row} showProjectDrop={true} />)}</tbody>
            </table>
          </div>
        </section>
      )}

      {/* Queue B: PENDING_SITE_MAP */}
      {queueB.length > 0 && (
        <section style={{ background: '#fff', border: '1px solid #bfdbfe', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid #bfdbfe', background: '#eff6ff', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '.82rem', fontWeight: 900, color: '#1e40af' }}>📍 Need Site Map ({queueB.length})</span>
            <span style={{ fontSize: '.76rem', color: '#3b82f6' }}>Finance ระบุ Project แล้ว — Project เลือก site_code ที่ตรงกับ PO</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1200, fontSize: '.78rem' }}>
              <thead><tr style={{ background: '#eff6ff', borderBottom: '1px solid #bfdbfe' }}>
                {TABLE_HEADERS.map(h => <th key={h} style={{ ...COL_HDR }}>{h}</th>)}
              </tr></thead>
              <tbody>{queueB.map(row => <PoRow key={row.id} row={row} showProjectDrop={false} />)}</tbody>
            </table>
          </div>
        </section>
      )}

      {/* Queue C: SITE_MAPPED */}
      {queueC.length > 0 && (
        <section style={{ background: '#fff', border: '1px solid #bbf7d0', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid #bbf7d0', background: '#f0fdf4', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '.82rem', fontWeight: 900, color: '#166534' }}>✓ Mapped — Plan DTE ({queueC.length})</span>
            <span style={{ fontSize: '.76rem', color: '#16a34a' }}>Site mapping เสร็จแล้ว รอ PM assign DTE และกำหนดวันที่ (Step 3)</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1200, fontSize: '.78rem' }}>
              <thead><tr style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}>
                {TABLE_HEADERS.map(h => <th key={h} style={{ ...COL_HDR }}>{h}</th>)}
              </tr></thead>
              <tbody>{queueC.map(row => <SiteMappedRow key={row.id} row={row} />)}</tbody>
            </table>
          </div>
        </section>
      )}

      {/* Queue D: PLANNED / IN_PROGRESS / WORK_DONE / LEADER_CHECKING / LEADER_APPROVED */}
      {queueD.length > 0 && (
        <section style={{ background: '#fff', border: '1px solid #e9d5ff', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid #e9d5ff', background: '#faf5ff', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '.82rem', fontWeight: 900, color: '#6b21a8' }}>🔧 Plan / Execute / Leader Review ({queueD.length})</span>
            <span style={{ fontSize: '.76rem', color: '#7c3aed' }}>DTE working or Leader reviewing</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1400, fontSize: '.78rem' }}>
              <thead><tr style={{ background: '#faf5ff', borderBottom: '1px solid #e9d5ff' }}>
                {['PO / Type', 'Line', 'Project', 'Status', 'Site', 'DTE Team', 'Plan', 'Aging', 'Action'].map(h => <th key={h} style={{ ...COL_HDR }}>{h}</th>)}
              </tr></thead>
              <tbody>{queueD.map(row => {
                const tone = statusTone(row.workflow_status)
                const busy = busyId === row.id
                return (
                  <tr key={row.id} style={{ borderBottom: '1px solid #edf0f5' }}>
                    <td style={PO_CELL}><WTypeBadge wt={row.work_type} />{row.po_number}</td>
                    <td style={PO_CELL}>{row.po_line || '-'}</td>
                    <td style={{ ...PO_CELL, color: ACE_BLUE, fontWeight: 900 }}>{row.project_code}</td>
                    <td style={PO_CELL}><span style={{ background: tone.bg, color: tone.fg, fontSize: '.65rem', fontWeight: 900, padding: '2px 8px', borderRadius: 99 }}>{row.workflow_status}</span></td>
                    <td style={PO_CELL}>{row.site_code || '-'}</td>
                    <td style={PO_CELL}>{row.planned_dte_names || <span style={{ color: '#cbd5e1' }}>-</span>}</td>
                    <td style={PO_CELL}>
                      {row.planned_start_date ? `${row.planned_start_date}${row.planned_end_date ? ` → ${row.planned_end_date}` : ''}` : <span style={{ color: '#cbd5e1' }}>-</span>}
                    </td>
                    <td style={{ ...PO_CELL, color: Number(row.aging_days || 0) >= 3 ? ACE_RED : '#667085', fontWeight: 900 }}>{row.aging_days || 0}d</td>
                    <td style={{ ...PO_CELL, minWidth: 220 }}>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {row.workflow_status === 'PLANNED' && (
                          <button disabled={busy} onClick={() => workflowAction(row, 'START_WORK')} style={{ ...BTN_PRIMARY, padding: '5px 10px', fontSize: '.68rem', background: '#d97706' }}>▶ Start Work</button>
                        )}
                        {row.workflow_status === 'IN_PROGRESS' && (
                          <button disabled={busy} onClick={() => workflowAction(row, 'WORK_DONE')} style={{ ...BTN_PRIMARY, padding: '5px 10px', fontSize: '.68rem', background: '#16a34a' }}>✓ Work Done</button>
                        )}
                        {row.workflow_status === 'WORK_DONE' && (
                          <button disabled={busy} onClick={() => workflowAction(row, 'LEADER_REVIEW')} style={{ ...BTN_PRIMARY, padding: '5px 10px', fontSize: '.68rem', background: '#7c3aed' }}>🔍 Leader Review</button>
                        )}
                        {row.workflow_status === 'LEADER_CHECKING' && (<>
                          <button disabled={busy} onClick={() => workflowAction(row, 'LEADER_APPROVE')} style={{ ...BTN_PRIMARY, padding: '5px 10px', fontSize: '.68rem', background: '#16a34a' }}>✓ Approve</button>
                          <button disabled={busy} onClick={() => workflowAction(row, 'LEADER_RETURN', { note: 'Leader: ต้องแก้ไขงาน' })} style={{ ...BTN_SECONDARY, padding: '5px 8px', fontSize: '.68rem', color: ACE_RED }}>↩ Return DTE</button>
                        </>)}
                        {row.workflow_status === 'LEADER_APPROVED' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <button disabled={busy} onClick={() => workflowAction(row, 'CONFIRM_TIMESHEET')} style={{ ...BTN_PRIMARY, padding: '5px 10px', fontSize: '.68rem', background: '#0284c7' }}>📋 Confirm Timesheet → Pay DTE</button>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <input
                                placeholder="HW Evidence URL"
                                style={{ ...INPUT_SM, flex: 1, fontSize: '.65rem' }}
                                onBlur={e => e.target.value && setPlan(row.id, 'hw_evidence_url', e.target.value)}
                                defaultValue={row.hw_evidence_url || ''}
                              />
                              <button
                                disabled={busy}
                                onClick={() => workflowAction(row, 'CONFIRM_HW_EVIDENCE', { hw_evidence_url: planState[row.id]?.hw_evidence_url || row.hw_evidence_url })}
                                style={{ ...BTN_PRIMARY, padding: '5px 8px', fontSize: '.65rem', background: '#7c3aed', whiteSpace: 'nowrap' }}
                              >📎 Confirm HW → Bill</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}</tbody>
            </table>
          </div>
        </section>
      )}

      {queueA.length === 0 && queueB.length === 0 && queueC.length === 0 && queueD.length === 0 && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: 48, textAlign: 'center', color: '#94a3b8', fontWeight: 800 }}>
          ไม่มี PO ที่รอ mapping ตอนนี้
        </div>
      )}
    </main>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT BOARD — Card Grid View
// ─────────────────────────────────────────────────────────────────────────────

const TEAM_COLORS = {
  RF:          { bg: '#fef3c7', border: '#fde68a', text: '#b45309', dot: '#f59e0b' },
  TE:          { bg: '#d1fae5', border: '#6ee7b7', text: '#047857', dot: '#10b981' },
  Enterprise:  { bg: '#ede9fe', border: '#c4b5fd', text: '#6d28d9', dot: '#8b5cf6' },
  Solar:       { bg: '#fef9c3', border: '#fef08a', text: '#854d0e', dot: '#eab308' },
  AI:          { bg: '#dbeafe', border: '#93c5fd', text: '#1e40af', dot: '#3b82f6' },
  HO:          { bg: '#f1f5f9', border: '#cbd5e1', text: '#475569', dot: '#94a3b8' },
}

const CUSTOMER_COLORS = {
  AIS:  { bg: '#fff7ed', text: '#c2410c' },
  TRUE: { bg: '#fdf4ff', text: '#7e22ce' },
  HWT:  { bg: '#f0fdf4', text: '#166534' },
  NT:   { bg: '#eff6ff', text: '#1d4ed8' },
  ZTE:  { bg: '#fff1f2', text: '#be123c' },
  ACE:  { bg: '#f8fafc', text: '#475569' },
}

const PROJECT_ROLE_LABELS = {
  DTE: 'DTE', DTA: 'DTA', OSS: 'OSS', OMC: 'OMC',
  REPORT_PREP: 'RPE', TEAM_LEAD: 'TL', SS: 'SS', SSR: 'SSR',
  SE: 'SE', PM: 'PM', SPM: 'SPM', PD: 'PD', OTHER: 'Other',
}

// ─────────────────────────────────────────────────────────────────────────────
// STAFF ROSTER PAGE
// ─────────────────────────────────────────────────────────────────────────────
function StaffRosterPage({ allEmployees, projects, onRefresh }) {
  const [filter, setFilter] = useState({ search: '', dept: '', section: '', team: '', type: '', project: '', role: '' })
  const [drawerEmp, setDrawerEmp]   = useState(null)
  const [showRelocate, setShowRelocate] = useState(false)
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  const emp = allEmployees.filter(isProjectManagementEmployee)
  const total = emp.length

  const byType = {}
  emp.forEach(e => { const t = normalizeEmpType(e.employment_type); byType[t] = (byType[t] || 0) + 1 })
  const permanent = byType['Permanent'] || 0
  const outsource = byType['Outsource'] || 0

  const bySection = {}
  emp.forEach(e => { const s = e.section_name || 'Unknown'; bySection[s] = (bySection[s] || 0) + 1 })
  const sectionRows = Object.entries(bySection).sort((a, b) => b[1] - a[1])
  const maxSection = sectionRows[0]?.[1] || 1

  const byRole = {}
  emp.forEach(e => { const r = e.project_role || 'OTHER'; byRole[r] = (byRole[r] || 0) + 1 })
  const roleRows = Object.entries(byRole).sort((a, b) => b[1] - a[1])
  const maxRole = roleRows[0]?.[1] || 1

  const unassigned = emp.filter(e => !e.project_code).length
  const rfCount = emp.filter(e => e.project_team === 'RF').length
  const teCount = emp.filter(e => e.project_team === 'TE').length

  const allDepts    = [...new Set(emp.map(e => e.department).filter(Boolean))].sort()
  const allSections = [...new Set(emp.map(e => e.section_name).filter(Boolean))].sort()
  const allTeams    = [...new Set(emp.map(e => e.project_team).filter(Boolean))].sort()
  const allProjects = [...new Set(emp.map(e => e.project_code).filter(Boolean))].sort()
  const allRoles    = [...new Set(emp.map(e => e.project_role).filter(Boolean))].sort()

  const filtered = emp.filter(e => {
    const q = filter.search.toLowerCase()
    if (q && !e.full_name?.toLowerCase().includes(q) && !e.employee_code?.toLowerCase().includes(q) && !e.position?.toLowerCase().includes(q) && !e.project_code?.toLowerCase().includes(q)) return false
    if (filter.dept    && e.department     !== filter.dept)    return false
    if (filter.section && e.section_name   !== filter.section) return false
    if (filter.team    && e.project_team   !== filter.team)    return false
    if (filter.type    && normalizeEmpType(e.employment_type) !== filter.type) return false
    if (filter.project && e.project_code   !== filter.project) return false
    if (filter.role    && e.project_role   !== filter.role)    return false
    return true
  })

  const anyFilter = Object.values(filter).some(Boolean)
  const TYPE_COLORS = { Permanent: '#16a34a', Outsource: '#d97706', Contract: '#0369a1', Other: '#94a3b8', Unknown: '#94a3b8' }

  const ROLE_COLOR = r => r === 'DTA' ? { bg: '#dbeafe', fg: '#1d4ed8' } : r === 'DTE' ? { bg: '#fee2e2', fg: ACE_RED } : r === 'RF_PRO' ? { bg: '#ede9fe', fg: '#7c3aed' } : { bg: '#f1f5f9', fg: '#475569' }

  return (
    <main style={{ flex: 1, overflow: 'auto', padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <section style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <div style={{ minWidth: 0, marginRight: 'auto' }}>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#1d2939', lineHeight: 1.1 }}>Staff Roster</div>
          <div style={{ fontSize: '.8rem', color: '#667085', marginTop: 4 }}>All active employees · As of {today}</div>
        </div>
        <button style={{ ...BTN_SECONDARY, background: '#fff', border: '1px solid #e4e7ec', color: '#344054' }}>Export</button>
      </section>

      {/* KPI Strip */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 10, flexShrink: 0 }}>
        <KpiCard label="Total Staff"   value={total}     note="All departments"    color="#1d2939" accent={ACE_BLUE} />
        <KpiCard label="Permanent"     value={permanent} note="Permanent contracts" color="#16a34a" accent="#16a34a" />
        <KpiCard label="Outsource"     value={outsource} note="Outsource / vendor"  color="#d97706" accent="#d97706" />
        <KpiCard label="RF Team"       value={rfCount}   note="RF project section"  color={ACE_RED}  accent={ACE_RED} />
        <KpiCard label="TE Team"       value={teCount}   note="TE project section"  color="#7c3aed" accent="#7c3aed" />
        <KpiCard label="Unassigned"    value={unassigned} note="No project code"   color="#94a3b8" accent="#94a3b8" />
      </section>

      {/* Breakdown charts */}
      <section style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 14, flexShrink: 0 }}>

        {/* By Section */}
        <div style={{ background: '#fff', border: '1px solid #e4e7ec', borderRadius: 4, padding: 16 }}>
          <div style={{ fontSize: '.82rem', fontWeight: 900, color: '#1d2939', marginBottom: 14 }}>Headcount by Section</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {sectionRows.map(([section, count]) => (
              <SummaryBar key={section} label={section} value={count} max={maxSection} color={ACE_BLUE} suffix={` (${Math.round((count / total) * 100)}%)`} />
            ))}
          </div>
        </div>

        {/* Employment Type */}
        <div style={{ background: '#fff', border: '1px solid #e4e7ec', borderRadius: 4, padding: 16 }}>
          <div style={{ fontSize: '.82rem', fontWeight: 900, color: '#1d2939', marginBottom: 14 }}>Employment Type</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
              const color = TYPE_COLORS[type] || '#94a3b8'
              const pct = Math.round((count / total) * 100)
              return (
                <div key={type}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.76rem', fontWeight: 800, color: '#344054', marginBottom: 3 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 99, background: color, flexShrink: 0, display: 'inline-block' }} />
                      {type}
                    </span>
                    <span style={{ color, fontWeight: 900 }}>{count} <span style={{ color: '#94a3b8', fontWeight: 700 }}>({pct}%)</span></span>
                  </div>
                  <div style={{ height: 8, borderRadius: 99, background: '#f1f5f9', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.max(3, pct)}%`, height: '100%', background: color, borderRadius: 99 }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Role Distribution */}
        <div style={{ background: '#fff', border: '1px solid #e4e7ec', borderRadius: 4, padding: 16 }}>
          <div style={{ fontSize: '.82rem', fontWeight: 900, color: '#1d2939', marginBottom: 14 }}>Role Distribution</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {roleRows.map(([role, count]) => (
              <SummaryBar key={role} label={ROLE_LABELS[role] || role} value={count} max={maxRole}
                color={role === 'DTA' ? '#2563eb' : role === 'DTE' ? ACE_RED : role === 'RF_PRO' ? '#7c3aed' : '#475569'} />
            ))}
          </div>
        </div>
      </section>

      {/* Full Roster — Card Grid */}
      <section style={{ flexShrink: 0 }}>
        {/* Filter bar */}
        <div style={{ background: '#fff', border: '1px solid #e4e7ec', borderRadius: 4, padding: '14px 20px', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 900, color: '#1d2939', fontSize: '.9rem', marginRight: 4 }}>
              Full Roster
              <span style={{ marginLeft: 8, fontSize: '.72rem', fontWeight: 700, color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: 99 }}>{filtered.length} of {total}</span>
            </div>
            <input
              placeholder="Search name / ID / position / project…"
              value={filter.search}
              onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
              style={{ ...INPUT_SM, width: 230 }}
            />
            <select value={filter.dept}    onChange={e => setFilter(f => ({ ...f, dept:    e.target.value }))} style={{ ...INPUT_SM, width: 160 }}>
              <option value="">All Departments</option>
              {allDepts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={filter.section} onChange={e => setFilter(f => ({ ...f, section: e.target.value }))} style={{ ...INPUT_SM, width: 150 }}>
              <option value="">All Sections</option>
              {allSections.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filter.team}    onChange={e => setFilter(f => ({ ...f, team:    e.target.value }))} style={{ ...INPUT_SM, width: 110 }}>
              <option value="">All Teams</option>
              {allTeams.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={filter.type}    onChange={e => setFilter(f => ({ ...f, type:    e.target.value }))} style={{ ...INPUT_SM, width: 120 }}>
              <option value="">All Types</option>
              {['Permanent', 'Outsource', 'Contract'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={filter.project} onChange={e => setFilter(f => ({ ...f, project: e.target.value }))} style={{ ...INPUT_SM, width: 150 }}>
              <option value="">All Projects</option>
              {allProjects.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={filter.role}    onChange={e => setFilter(f => ({ ...f, role:    e.target.value }))} style={{ ...INPUT_SM, width: 115 }}>
              <option value="">All Roles</option>
              {allRoles.map(r => <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>)}
            </select>
            {anyFilter && (
              <button onClick={() => setFilter({ search: '', dept: '', section: '', team: '', type: '', project: '', role: '' })}
                style={{ ...BTN_SECONDARY, padding: '5px 10px', fontSize: '.72rem' }}>Clear</button>
            )}
          </div>
        </div>

        {/* Card grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '.85rem', padding: 48, background: '#fff', border: '1px solid #e4e7ec', borderRadius: 4 }}>No employees match the filter</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {filtered.map(e => {
              const tc   = TYPE_COLORS[normalizeEmpType(e.employment_type)] || '#94a3b8'
              const rc   = ROLE_COLOR(e.project_role || '')
              const team = e.project_team
              const teamBg    = team === 'RF' ? '#fee2e2' : team === 'TE' ? '#dbeafe' : team === 'HO' ? '#fef9c3' : '#f1f5f9'
              const teamColor = team === 'RF' ? ACE_RED   : team === 'TE' ? ACE_BLUE  : team === 'HO' ? '#92400e' : '#475569'
              const initials  = (e.first_name?.[0] || '') + (e.last_name?.[0] || '') || e.full_name?.slice(0, 2).toUpperCase() || '?'
              const avatarBg  = team === 'RF' ? ACE_RED : team === 'TE' ? ACE_BLUE : '#475569'
              return (
                <div key={e.employee_code || e.id} onClick={() => setDrawerEmp(e)} style={{
                  background: '#fff', border: '1px solid #e4e7ec', borderRadius: 6,
                  overflow: 'hidden', display: 'flex', flexDirection: 'column',
                  transition: 'box-shadow .15s, border-color .15s', cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,.04)',
                }}>
                  {/* Top color stripe */}
                  <div style={{ height: 4, background: avatarBg, flexShrink: 0 }} />

                  <div style={{ padding: '14px 14px 12px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                    {/* Avatar + name row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 99, background: avatarBg,
                        color: '#fff', fontWeight: 950, fontSize: '.95rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>{initials}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 850, color: '#1d2939', fontSize: '.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.full_name}</div>
                        <div style={{ fontSize: '.72rem', color: ACE_BLUE, fontWeight: 900, marginTop: 1 }}>{e.employee_code}</div>
                      </div>
                    </div>

                    {/* Position */}
                    <div style={{ fontSize: '.75rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.position || e.job_title || <span style={{ color: '#94a3b8' }}>No position</span>}
                    </div>

                    {/* Badges row */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {team && (
                        <span style={{ fontSize: '.65rem', fontWeight: 900, padding: '2px 7px', borderRadius: 99, background: teamBg, color: teamColor }}>{team}</span>
                      )}
                      {e.project_role && e.project_role !== 'OTHER' && (
                        <span style={{ fontSize: '.65rem', fontWeight: 900, padding: '2px 7px', borderRadius: 99, background: rc.bg, color: rc.fg }}>{e.project_role}</span>
                      )}
                      {e.job_level && (
                        <span style={{ fontSize: '.65rem', fontWeight: 900, padding: '2px 7px', borderRadius: 99, background: '#f8fafc', color: '#64748b' }}>{e.job_level}</span>
                      )}
                      <span style={{ fontSize: '.65rem', fontWeight: 900, padding: '2px 7px', borderRadius: 99, background: tc + '22', color: tc }}>{normalizeEmpType(e.employment_type)}</span>
                    </div>

                    {/* Footer: section + project */}
                    <div style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ fontSize: '.7rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 700 }}>Section: </span>{e.section_name || '—'}
                      </div>
                      <div style={{ fontSize: '.7rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 700 }}>Project: </span>
                        {e.project_code
                          ? <span style={{ color: ACE_BLUE, fontWeight: 800 }}>{e.project_code}</span>
                          : <span style={{ color: '#cbd5e1' }}>Unassigned</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Employee drawer */}
      <EmployeeDrawer
        employee={drawerEmp}
        projects={projects}
        onClose={() => { setDrawerEmp(null); setShowRelocate(false) }}
        onRelocate={() => setShowRelocate(true)}
      />

      {/* Relocate modal */}
      {showRelocate && drawerEmp && (
        <RelocateModal
          employee={drawerEmp}
          projects={projects}
          onClose={() => setShowRelocate(false)}
          onSaved={() => {
            setShowRelocate(false)
            setDrawerEmp(null)
            onRefresh?.()
          }}
        />
      )}

    </main>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS PAGE
// ─────────────────────────────────────────────────────────────────────────────
function hashCode(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

const PHASES = ['Planning', 'Kick-off', 'Field Work', 'Reporting', 'Completed']
const PHASE_COLOR = {
  Planning:   { bg: '#eff6ff', fg: '#1d4ed8', bar: '#3b82f6' },
  'Kick-off': { bg: '#fef9c3', fg: '#92400e', bar: '#f59e0b' },
  'Field Work':{ bg: '#fce7f3', fg: '#9d174d', bar: '#ec4899' },
  Reporting:  { bg: '#ede9fe', fg: '#5b21b6', bar: '#7c3aed' },
  Completed:  { bg: '#dcfce7', fg: '#166534', bar: '#16a34a' },
}
const STATUS_COLOR = {
  'On Track': { bg: '#dcfce7', fg: '#166534' },
  'At Risk':  { bg: '#fef9c3', fg: '#92400e' },
  'Delayed':  { bg: '#fee2e2', fg: '#991b1b' },
}

function seedProgress(project) {
  const h = hashCode(project.project_code || project.id?.toString() || '0')
  const pct        = 10 + (h % 85)
  const phaseIdx   = pct < 15 ? 0 : pct < 35 ? 1 : pct < 60 ? 2 : pct < 85 ? 3 : 4
  const phase      = PHASES[phaseIdx]
  const statusIdx  = h % 10
  const status     = statusIdx < 6 ? 'On Track' : statusIdx < 8 ? 'At Risk' : 'Delayed'
  const sitesTotal = project.site_count || (3 + (h % 18))
  const sitesDone  = Math.min(sitesTotal, Math.round((pct / 100) * sitesTotal))
  const monthsAgo  = 1 + (h % 10)
  const durationMo = 6 + (h % 12)
  const start = new Date()
  start.setMonth(start.getMonth() - monthsAgo)
  const end = new Date(start)
  end.setMonth(end.getMonth() + durationMo)
  return { pct, phase, status, sitesTotal, sitesDone, start, end }
}

function cleanPoDate(value) {
  const text = String(value || '').trim()
  if (!text || text.toUpperCase() === 'N/A') return ''
  return text.slice(0, 10)
}

function poSiteKey(row) {
  return row.siteId || row.siteCode || row.du_id || row.cluster_site || row.id
}

function poProjectCode(row) {
  return row.systemProjectCode || row.project_code || row.project
}

function buildPoProgressByProject(dbPoRows = []) {
  const map = new Map()
  const ensure = projectCode => {
    const key = String(projectCode || '').trim()
    if (!key) return null
    if (!map.has(key)) {
      map.set(key, {
        projectCode: key,
        lineCount: 0,
        siteKeys: new Set(),
        doneSiteKeys: new Set(),
        clusterKeys: new Set(),
        readyClusterKeys: new Set(),
        latestDate: '',
      })
    }
    return map.get(key)
  }

  PO_SYSTEM_LINES.forEach(row => {
    const group = ensure(poProjectCode(row))
    if (!group) return
    group.lineCount += 1
    const isPac = row.workType === 'PAC'
    const doneDate = cleanPoDate(isPac ? row.clusterReadyDate : row.fullOnAirDate)
    if (isPac) {
      const clusterKey = row.rfClusterName || row.siteCode || row.id
      group.clusterKeys.add(clusterKey)
      if (doneDate) group.readyClusterKeys.add(clusterKey)
    } else {
      const siteKey = poSiteKey(row)
      group.siteKeys.add(siteKey)
      if (doneDate) group.doneSiteKeys.add(siteKey)
    }
    if (doneDate && doneDate > group.latestDate) group.latestDate = doneDate
  })

  dbPoRows.forEach(row => {
    const group = ensure(poProjectCode(row))
    if (!group) return
    group.lineCount += 1
    const siteKey = poSiteKey(row)
    group.siteKeys.add(siteKey)
    const doneDate = cleanPoDate(row.on_air)
    if (doneDate) {
      group.doneSiteKeys.add(siteKey)
      if (doneDate > group.latestDate) group.latestDate = doneDate
    }
  })

  const result = {}
  map.forEach((group, projectCode) => {
    const sitesTotal = group.siteKeys.size
    const sitesDone = group.doneSiteKeys.size
    const clustersTotal = group.clusterKeys.size
    const clustersDone = group.readyClusterKeys.size
    const sitePct = sitesTotal ? sitesDone / sitesTotal : 0
    const clusterPct = clustersTotal ? clustersDone / clustersTotal : sitePct
    const weightedPct = clustersTotal ? (sitePct * 0.7) + (clusterPct * 0.3) : sitePct
    const pct = Math.round(weightedPct * 100)
    const phase = pct >= 100 ? 'Completed' : pct >= 75 ? 'Reporting' : pct > 0 ? 'Field Work' : group.lineCount ? 'Kick-off' : 'Planning'
    const status = pct >= 75 ? 'On Track' : pct >= 30 ? 'At Risk' : 'Delayed'
    result[projectCode] = {
      pct,
      phase,
      status,
      sitesTotal,
      sitesDone,
      clustersTotal,
      clustersDone,
      lineCount: group.lineCount,
      latestDate: group.latestDate,
      hasPo: group.lineCount > 0,
    }
  })
  return result
}

// ─────────────────────────────────────────────────────────────────────────────
// RELOCATE MODAL
// ─────────────────────────────────────────────────────────────────────────────
function RelocateModal({ employee, projects, onClose, onSaved }) {
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    to_project_code: '',
    effective_date: today,
    reason: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!form.effective_date) { setError('Effective date is required'); return }
    setSaving(true); setError('')
    try {
      const r = await apiFetch(`${API_BASE}/relocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_code: employee.employee_code,
          to_project_code: form.to_project_code || null,
          effective_date: form.effective_date,
          reason: form.reason || null,
          notes: form.notes || null,
        }),
      })
      if (!r.ok) { const e = await r.json(); throw new Error(e.detail || 'Save failed'); }
      onSaved()
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const activeProjects = projects.filter(p => p.status === 'ACTIVE' && p.project_code !== employee.project_code)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 8, width: 460, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,.25)', zIndex: 1 }}>
        <div style={{ fontSize: '1rem', fontWeight: 900, color: '#1d2939', marginBottom: 4 }}>Relocate Project</div>
        <div style={{ fontSize: '.78rem', color: '#667085', marginBottom: 20 }}>
          Moving <b style={{ color: '#1d2939' }}>{employee.full_name}</b>
        </div>

        {/* From */}
        <div style={{ background: '#f8fafc', border: '1px solid #e4e7ec', borderRadius: 6, padding: '10px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: '.68rem', color: '#94a3b8', fontWeight: 800, marginBottom: 3 }}>CURRENT PROJECT</div>
          <div style={{ fontSize: '.85rem', fontWeight: 900, color: employee.project_code ? ACE_BLUE : '#94a3b8' }}>
            {employee.project_code || 'Unassigned'}
          </div>
          {employee.project_name && <div style={{ fontSize: '.72rem', color: '#667085', marginTop: 2 }}>{employee.project_name}</div>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: '.76rem', fontWeight: 800, color: '#344054', display: 'block', marginBottom: 5 }}>To Project</label>
            <select value={form.to_project_code} onChange={e => setForm(f => ({ ...f, to_project_code: e.target.value }))}
              style={{ ...INPUT_SM, width: '100%', height: 36 }}>
              <option value="">— Unassign (no project) —</option>
              {activeProjects.map(p => (
                <option key={p.project_code} value={p.project_code}>{p.project_code} — {p.project_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '.76rem', fontWeight: 800, color: '#344054', display: 'block', marginBottom: 5 }}>Effective Date <span style={{ color: ACE_RED }}>*</span></label>
            <input type="date" value={form.effective_date} onChange={e => setForm(f => ({ ...f, effective_date: e.target.value }))}
              style={{ ...INPUT_SM, width: '100%', height: 36 }} />
          </div>
          <div>
            <label style={{ fontSize: '.76rem', fontWeight: 800, color: '#344054', display: 'block', marginBottom: 5 }}>Reason</label>
            <input placeholder="e.g. Project completed, reassignment…" value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              style={{ ...INPUT_SM, width: '100%', height: 36 }} />
          </div>
          <div>
            <label style={{ fontSize: '.76rem', fontWeight: 800, color: '#344054', display: 'block', marginBottom: 5 }}>Notes</label>
            <textarea rows={2} placeholder="Additional notes…" value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              style={{ ...INPUT_SM, width: '100%', resize: 'vertical', paddingTop: 8 }} />
          </div>
        </div>

        {error && <div style={{ marginTop: 12, fontSize: '.76rem', color: ACE_RED, fontWeight: 700 }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ ...BTN_SECONDARY }}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            style={{ ...BTN_PRIMARY, opacity: saving ? .6 : 1 }}>{saving ? 'Saving…' : 'Confirm Relocation'}</button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEE DRAWER  (Timeline + Relocate)
// ─────────────────────────────────────────────────────────────────────────────
function EmployeeDrawer({ employee, projects, onClose, onRelocate }) {
  const [history, setHistory] = useState(null)

  useEffect(() => {
    if (!employee) return
    apiFetch(`${API_BASE}/employees/${encodeURIComponent(employee.employee_code)}/relocations`)
      .then(r => r.ok ? r.json() : { data: [] })
      .then(payload => setHistory(payload.data || []))
      .catch(() => setHistory([]))
  }, [employee?.employee_code])

  if (!employee) return null

  const tc   = { Permanent: '#16a34a', Outsource: '#d97706', Contract: '#0369a1' }[normalizeEmpType(employee.employment_type)] || '#94a3b8'
  const team = employee.project_team
  const teamBg    = team === 'RF' ? '#fee2e2' : team === 'TE' ? '#dbeafe' : '#f1f5f9'
  const teamColor = team === 'RF' ? ACE_RED   : team === 'TE' ? ACE_BLUE  : '#475569'

  const fmtDate = iso => iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  return (
    <>
      {/* Backdrop */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 8000, background: 'rgba(0,0,0,.3)' }} onClick={onClose} />
      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 8001,
        width: 420, background: '#fff', boxShadow: '-8px 0 40px rgba(0,0,0,.18)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 99, background: team === 'RF' ? ACE_RED : team === 'TE' ? ACE_BLUE : '#475569',
              color: '#fff', fontWeight: 950, fontSize: '1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {(employee.first_name?.[0] || '') + (employee.last_name?.[0] || '') || employee.full_name?.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 900, color: '#1d2939', fontSize: '.95rem' }}>{employee.full_name}</div>
              <div style={{ fontSize: '.75rem', color: ACE_BLUE, fontWeight: 800, marginTop: 1 }}>{employee.employee_code}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                {team && <span style={{ fontSize: '.65rem', fontWeight: 900, padding: '2px 7px', borderRadius: 99, background: teamBg, color: teamColor }}>{team}</span>}
                {employee.project_role && employee.project_role !== 'OTHER' && (
                  <span style={{ fontSize: '.65rem', fontWeight: 900, padding: '2px 7px', borderRadius: 99, background: '#f1f5f9', color: '#475569' }}>{employee.project_role}</span>
                )}
                {employee.job_level && <span style={{ fontSize: '.65rem', fontWeight: 900, padding: '2px 7px', borderRadius: 99, background: '#f8fafc', color: '#64748b' }}>{employee.job_level}</span>}
                <span style={{ fontSize: '.65rem', fontWeight: 900, padding: '2px 7px', borderRadius: 99, background: tc + '22', color: tc }}>{normalizeEmpType(employee.employment_type)}</span>
              </div>
            </div>
            <button onClick={onClose} style={{ color: '#94a3b8', fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', flexShrink: 0 }}>✕</button>
          </div>

          {/* Current project */}
          <div style={{ marginTop: 14, background: '#f8fafc', borderRadius: 6, padding: '10px 14px' }}>
            <div style={{ fontSize: '.66rem', color: '#94a3b8', fontWeight: 800, marginBottom: 3 }}>CURRENT PROJECT</div>
            <div style={{ fontWeight: 900, color: employee.project_code ? ACE_BLUE : '#94a3b8', fontSize: '.85rem' }}>
              {employee.project_code || 'Unassigned'}
            </div>
            {employee.project_name && <div style={{ fontSize: '.72rem', color: '#667085', marginTop: 1 }}>{employee.project_name}</div>}
          </div>

          <button onClick={onRelocate}
            style={{ ...BTN_PRIMARY, marginTop: 12, width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}>
            ⇄ Relocate Project
          </button>
        </div>

        {/* Timeline */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 24px' }}>
          <div style={{ fontSize: '.82rem', fontWeight: 900, color: '#1d2939', marginBottom: 16 }}>Project History</div>

          {history === null && (
            <div style={{ color: '#94a3b8', fontSize: '.78rem', textAlign: 'center', padding: 32 }}>Loading…</div>
          )}
          {history !== null && history.length === 0 && (
            <div style={{ color: '#94a3b8', fontSize: '.78rem', textAlign: 'center', padding: 32, border: '1px dashed #e4e7ec', borderRadius: 6 }}>
              No relocation history yet.<br />Use "Relocate Project" to start tracking.
            </div>
          )}
          {history !== null && history.length > 0 && (
            <div style={{ position: 'relative' }}>
              {/* vertical line */}
              <div style={{ position: 'absolute', left: 11, top: 12, bottom: 12, width: 2, background: '#e4e7ec', zIndex: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {history.map((r, i) => (
                  <div key={r.id} style={{ display: 'flex', gap: 14, position: 'relative', paddingBottom: i < history.length - 1 ? 20 : 0 }}>
                    {/* dot */}
                    <div style={{
                      width: 24, height: 24, borderRadius: 99, flexShrink: 0,
                      background: i === 0 ? ACE_BLUE : '#e4e7ec',
                      border: `3px solid ${i === 0 ? ACE_BLUE : '#cbd5e1'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
                      marginTop: 2,
                    }}>
                      {i === 0 && <div style={{ width: 8, height: 8, borderRadius: 99, background: '#fff' }} />}
                    </div>
                    {/* content */}
                    <div style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
                      <div style={{ fontSize: '.7rem', color: '#94a3b8', fontWeight: 800, marginBottom: 4 }}>
                        {fmtDate(r.effective_date)}
                        {i === 0 && <span style={{ marginLeft: 8, fontSize: '.65rem', background: '#dbeafe', color: ACE_BLUE, fontWeight: 900, padding: '1px 6px', borderRadius: 99 }}>Latest</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '.75rem', fontWeight: 900, color: r.from_project_code ? '#475569' : '#94a3b8' }}>
                          {r.from_project_code || 'Unassigned'}
                        </span>
                        <span style={{ color: '#94a3b8', fontSize: '.8rem' }}>→</span>
                        <span style={{ fontSize: '.75rem', fontWeight: 900, color: r.to_project_code ? ACE_BLUE : '#94a3b8' }}>
                          {r.to_project_code || 'Unassigned'}
                        </span>
                      </div>
                      {r.to_project_name && (
                        <div style={{ fontSize: '.7rem', color: '#667085', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.to_project_name}</div>
                      )}
                      {r.reason && (
                        <div style={{ marginTop: 5, fontSize: '.7rem', color: '#475569', background: '#f8fafc', borderRadius: 4, padding: '4px 8px', borderLeft: `3px solid ${ACE_BLUE}` }}>{r.reason}</div>
                      )}
                      {r.notes && (
                        <div style={{ marginTop: 4, fontSize: '.68rem', color: '#94a3b8' }}>{r.notes}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function ProgressPage({ projects, allEmployees }) {
  const [search, setSearch]       = useState('')
  const [teamFilter, setTeamFilter]   = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [phaseFilter, setPhaseFilter]  = useState('')
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  const active = projects.filter(p => p.status === 'ACTIVE')

  const withProgress = active.map(p => ({ ...p, ...seedProgress(p) }))

  const empByProject = {}
  allEmployees.filter(isProjectManagementEmployee).forEach(e => {
    if (e.project_code) {
      if (!empByProject[e.project_code]) empByProject[e.project_code] = 0
      empByProject[e.project_code]++
    }
  })

  const filtered = withProgress.filter(p => {
    const q = search.toLowerCase()
    if (q && !p.project_code?.toLowerCase().includes(q) && !p.project_name?.toLowerCase().includes(q)) return false
    if (teamFilter   && p.team?.code !== teamFilter)   return false
    if (statusFilter && p.status_label !== statusFilter) return false
    if (phaseFilter  && p.phase !== phaseFilter)       return false
    return true
  }).map(p => ({ ...p, status_label: p.status_label || p.status_progress }))

  // re-derive status_label after map
  const rows = withProgress.filter(p => {
    const q = search.toLowerCase()
    if (q && !p.project_code?.toLowerCase().includes(q) && !p.project_name?.toLowerCase().includes(q)) return false
    if (teamFilter   && p.team?.code !== teamFilter)    return false
    if (statusFilter && p.status !== statusFilter)      return false
    if (phaseFilter  && p.phase !== phaseFilter)        return false
    return true
  })

  const allTeams    = [...new Set(active.map(p => p.team?.code).filter(Boolean))].sort()
  const avgPct      = rows.length ? Math.round(rows.reduce((s, p) => s + p.pct, 0) / rows.length) : 0
  const onTrack     = rows.filter(p => p.status === 'On Track').length
  const atRisk      = rows.filter(p => p.status === 'At Risk').length
  const delayed     = rows.filter(p => p.status === 'Delayed').length

  const byPhase = {}
  withProgress.forEach(p => { byPhase[p.phase] = (byPhase[p.phase] || 0) + 1 })

  const fmtDate = d => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })

  return (
    <main style={{ flex: 1, overflow: 'auto', padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <section style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <div style={{ minWidth: 0, marginRight: 'auto' }}>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#1d2939', lineHeight: 1.1 }}>Progress Tracker</div>
          <div style={{ fontSize: '.8rem', color: '#667085', marginTop: 4 }}>Active project status & milestone overview · As of {today}</div>
        </div>
        <span style={{ fontSize: '.72rem', fontWeight: 800, padding: '4px 12px', borderRadius: 99, background: '#fef9c3', color: '#92400e' }}>Demo Data</span>
        <button style={{ ...BTN_SECONDARY, background: '#fff', border: '1px solid #e4e7ec', color: '#344054' }}>Export</button>
      </section>

      {/* KPI strip */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 10, flexShrink: 0 }}>
        <KpiCard label="Active Projects" value={active.length}  note="Currently running"    color="#1d2939" accent={ACE_BLUE} />
        <KpiCard label="Avg Progress"    value={`${Math.round(withProgress.reduce((s,p)=>s+p.pct,0)/(withProgress.length||1))}%`} note="Overall completion" color={ACE_BLUE} accent={ACE_BLUE} />
        <KpiCard label="On Track"        value={withProgress.filter(p=>p.status==='On Track').length}  note="Progressing normally" color="#16a34a" accent="#16a34a" />
        <KpiCard label="At Risk"         value={withProgress.filter(p=>p.status==='At Risk').length}   note="Needs attention"      color="#d97706" accent="#d97706" />
        <KpiCard label="Delayed"         value={withProgress.filter(p=>p.status==='Delayed').length}   note="Behind schedule"      color={ACE_RED} accent={ACE_RED} />
      </section>

      {/* Phase summary bar */}
      <section style={{ background: '#fff', border: '1px solid #e4e7ec', borderRadius: 4, padding: '14px 20px', flexShrink: 0 }}>
        <div style={{ fontSize: '.82rem', fontWeight: 900, color: '#1d2939', marginBottom: 12 }}>Projects by Phase</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {PHASES.map(ph => {
            const count = byPhase[ph] || 0
            const c = PHASE_COLOR[ph]
            return (
              <div key={ph} onClick={() => setPhaseFilter(phaseFilter === ph ? '' : ph)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 6, background: phaseFilter === ph ? c.bg : '#f8fafc', border: `1.5px solid ${phaseFilter === ph ? c.bar : '#e4e7ec'}`, cursor: 'pointer', transition: 'all .15s' }}>
                <div style={{ width: 10, height: 10, borderRadius: 99, background: c.bar, flexShrink: 0 }} />
                <span style={{ fontSize: '.78rem', fontWeight: 900, color: '#344054' }}>{ph}</span>
                <span style={{ fontSize: '.82rem', fontWeight: 950, color: c.fg, minWidth: 20, textAlign: 'center' }}>{count}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flexShrink: 0 }}>
        <input placeholder="Search project code / name…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...INPUT_SM, width: 240 }} />
        <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)} style={{ ...INPUT_SM, width: 120 }}>
          <option value="">All Teams</option>
          {allTeams.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...INPUT_SM, width: 130 }}>
          <option value="">All Status</option>
          {['On Track','At Risk','Delayed'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(search || teamFilter || statusFilter || phaseFilter) && (
          <button onClick={() => { setSearch(''); setTeamFilter(''); setStatusFilter(''); setPhaseFilter('') }}
            style={{ ...BTN_SECONDARY, padding: '5px 10px', fontSize: '.72rem' }}>Clear</button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '.76rem', color: '#94a3b8', fontWeight: 700 }}>{rows.length} projects</span>
      </div>

      {/* Project progress cards */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
        {rows.length === 0 && (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '.85rem', padding: 48, background: '#fff', border: '1px solid #e4e7ec', borderRadius: 4 }}>No projects match the filter</div>
        )}
        {rows.map(p => {
          const tc   = p.team?.code
          const teamBg    = tc === 'RF' ? '#fee2e2' : tc === 'TE' ? '#dbeafe' : '#f1f5f9'
          const teamColor = tc === 'RF' ? ACE_RED   : tc === 'TE' ? ACE_BLUE  : '#475569'
          const ph   = PHASE_COLOR[p.phase] || PHASE_COLOR['Planning']
          const st   = STATUS_COLOR[p.status] || STATUS_COLOR['On Track']
          const staff = empByProject[p.project_code] || p.headcount || 0
          const phasePassed = PHASES.indexOf(p.phase)
          return (
            <div key={p.project_code} style={{ background: '#fff', border: '1px solid #e4e7ec', borderRadius: 6, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
              {/* Top stripe */}
              <div style={{ height: 4, background: ph.bar }} />

              <div style={{ padding: '14px 20px' }}>
                {/* Row 1: code + badges + status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 950, color: ACE_BLUE, fontSize: '.88rem' }}>{p.project_code}</span>
                  <span style={{ fontSize: '.65rem', fontWeight: 900, padding: '2px 7px', borderRadius: 99, background: teamBg, color: teamColor }}>{tc || '—'}</span>
                  <span style={{ fontSize: '.65rem', fontWeight: 900, padding: '2px 7px', borderRadius: 99, background: ph.bg, color: ph.fg }}>{p.phase}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '.66rem', fontWeight: 900, padding: '2px 9px', borderRadius: 99, background: st.bg, color: st.fg }}>{p.status}</span>
                </div>

                {/* Row 2: project name */}
                <div style={{ fontSize: '.82rem', fontWeight: 700, color: '#344054', marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.project_name}</div>

                {/* Progress bar */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', fontWeight: 900, color: '#344054', marginBottom: 5 }}>
                    <span>Progress</span>
                    <span style={{ color: p.pct >= 80 ? '#16a34a' : p.pct >= 50 ? ACE_BLUE : '#d97706' }}>{p.pct}%</span>
                  </div>
                  <div style={{ height: 10, borderRadius: 99, background: '#f1f5f9', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ width: `${p.pct}%`, height: '100%', background: p.pct >= 80 ? '#16a34a' : p.pct >= 50 ? ACE_BLUE : '#f59e0b', borderRadius: 99, transition: 'width .4s' }} />
                  </div>
                </div>

                {/* Milestone stepper */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 14 }}>
                  {PHASES.map((ph2, idx) => {
                    const done    = idx < phasePassed
                    const current = idx === phasePassed
                    const phC = PHASE_COLOR[ph2]
                    return (
                      <div key={ph2} style={{ display: 'flex', alignItems: 'center', flex: idx < PHASES.length - 1 ? '1 1 auto' : '0 0 auto' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                          <div style={{
                            width: current ? 14 : 10, height: current ? 14 : 10, borderRadius: 99,
                            background: done ? '#16a34a' : current ? phC.bar : '#e4e7ec',
                            border: current ? `2px solid ${phC.bar}` : 'none',
                            transition: 'all .2s',
                          }} />
                          <div style={{ fontSize: '.58rem', fontWeight: current ? 900 : 700, color: current ? phC.fg : done ? '#16a34a' : '#94a3b8', marginTop: 3, whiteSpace: 'nowrap' }}>{ph2}</div>
                        </div>
                        {idx < PHASES.length - 1 && (
                          <div style={{ flex: 1, height: 2, background: done ? '#16a34a' : '#e4e7ec', margin: '0 2px', marginBottom: 14 }} />
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Stats footer */}
                <div style={{ display: 'flex', gap: 20, fontSize: '.74rem', color: '#667085', fontWeight: 700, borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                  <span>📍 Sites: <b style={{ color: '#1d2939' }}>{p.sitesDone}/{p.sitesTotal}</b></span>
                  <span>👤 Staff: <b style={{ color: '#1d2939' }}>{staff}</b></span>
                  <span>🏢 Customer: <b style={{ color: '#1d2939' }}>{p.customer?.code || '—'}</b></span>
                  <span style={{ marginLeft: 'auto' }}>
                    <span style={{ color: '#94a3b8' }}>Start </span><b style={{ color: '#344054' }}>{fmtDate(p.start)}</b>
                    <span style={{ color: '#94a3b8', margin: '0 6px' }}>→</span>
                    <span style={{ color: '#94a3b8' }}>Target </span><b style={{ color: '#344054' }}>{fmtDate(p.end)}</b>
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </section>

    </main>
  )
}

function ProjectBoardPage({ projects, allEmployees, onNewProject }) {
  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('ACTIVE')
  const [selected, setSelected] = useState(null)

  // Build per-project employee stats from allEmployees.project_code
  const empByProject = useMemo(() => {
    const map = {}
    allEmployees.forEach(e => {
      if (!e.project_code) return
      if (!map[e.project_code]) map[e.project_code] = []
      map[e.project_code].push(e)
    })
    return map
  }, [allEmployees])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return projects.filter(p => {
      if (q && !p.project_code.toLowerCase().includes(q) && !p.project_name.toLowerCase().includes(q) && !(p.customer?.code || '').toLowerCase().includes(q)) return false
      if (teamFilter && p.team?.code !== teamFilter) return false
      if (statusFilter && p.status !== statusFilter) return false
      return true
    })
  }, [projects, search, teamFilter, statusFilter])

  const teams = [...new Set(projects.map(p => p.team?.code).filter(Boolean))].sort()

  return (
    <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 28, display: 'flex', flexDirection: 'column', gap: 20, background: '#f4f7fb' }}>

      {/* Header */}
      <section style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, flexWrap: 'wrap' }}>
        <div style={{ marginRight: 'auto' }}>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#1d2939', lineHeight: 1.1 }}>Project Board</div>
          <div style={{ fontSize: '.8rem', color: '#667085', marginTop: 3 }}>{filtered.length} projects · ACE Project Catalog</div>
        </div>
        <button onClick={onNewProject} style={{ ...BTN_PRIMARY, borderRadius: 6, padding: '8px 18px' }}>+ New Project</button>
      </section>

      {/* Filters */}
      <section style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flexShrink: 0 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search code / name / customer…"
          style={{ ...INPUT_SM, width: 240 }}
        />
        <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)} style={{ ...INPUT_SM, width: 150 }}>
          <option value="">All Teams</option>
          {teams.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['', 'All'], ['ACTIVE', 'Active'], ['PLANNING', 'Planning'], ['ON_HOLD', 'On Hold'], ['COMPLETED', 'Completed']].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setStatusFilter(k)}
              style={{
                padding: '5px 14px', borderRadius: 99, fontSize: '.76rem', fontWeight: 700, cursor: 'pointer', border: '1px solid',
                background: statusFilter === k ? ACE_BLUE : '#fff',
                color: statusFilter === k ? '#fff' : '#475569',
                borderColor: statusFilter === k ? ACE_BLUE : '#e2e8f0',
              }}
            >{label}</button>
          ))}
        </div>
      </section>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: '#94a3b8' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>📋</div>
            <div style={{ fontWeight: 800, color: '#475569' }}>No projects found</div>
            <div style={{ fontSize: '.82rem', marginTop: 4 }}>Try adjusting the search or filters</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map(p => (
            <ProjectCard
              key={p.id}
              project={p}
              employees={empByProject[p.project_code] || []}
              onSelect={() => setSelected(p)}
            />
          ))}
        </div>
      )}

      {/* Detail panel overlay */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 9999, display: 'flex', justifyContent: 'flex-end', backdropFilter: 'blur(2px)' }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}>
          <div style={{ width: 520, maxWidth: '95vw', background: '#fff', height: '100%', overflowY: 'auto', boxShadow: '-8px 0 32px rgba(0,0,0,.18)' }}>
            <ProjectPanel
              project={selected}
              projectEmployees={allEmployees.filter(e => e.project_code === selected.project_code)}
              allProjects={projects}
              onClose={() => setSelected(null)}
            />
          </div>
        </div>
      )}
    </main>
  )
}

function ProjectCard({ project: p, employees, onSelect }) {
  const teamCfg = TEAM_COLORS[p.team?.code] || TEAM_COLORS.HO
  const custCfg = CUSTOMER_COLORS[p.customer?.code] || CUSTOMER_COLORS.ACE
  const statusCfg = STATUS_CONFIG[p.status] || { label: p.status, color: '#475569', bg: '#f1f5f9' }

  // Role breakdown from allEmployees
  const roleCount = {}
  employees.forEach(e => {
    const r = e.project_role || 'OTHER'
    roleCount[r] = (roleCount[r] || 0) + 1
  })
  const roleRows = Object.entries(roleCount)
    .map(([role, count]) => ({ role, label: PROJECT_ROLE_LABELS[role] || role, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  const headcount = employees.length > 0 ? employees.length : (p.headcount || 0)
  const permanent = employees.filter(e => {
    const t = String(e.employment_type || '').toUpperCase()
    return t === 'PERMANENT' || t === 'FULL_TIME' || t === 'FULLTIME'
  }).length
  const outsource = headcount - permanent

  return (
    <div
      onClick={onSelect}
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        boxShadow: '0 4px 16px rgba(15,23,42,.06)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'box-shadow .15s, transform .15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 10px 32px rgba(15,23,42,.13)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,23,42,.06)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {/* Team color stripe + header */}
      <div style={{ background: teamCfg.bg, borderBottom: `1px solid ${teamCfg.border}`, padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Customer tag */}
            <span style={{ background: custCfg.bg, color: custCfg.text, fontSize: '.68rem', fontWeight: 900, padding: '2px 8px', borderRadius: 99, border: `1px solid ${custCfg.text}22` }}>
              {p.customer?.code || 'ACE'}
            </span>
            {/* Team tag */}
            <span style={{ background: '#fff', color: teamCfg.text, fontSize: '.68rem', fontWeight: 900, padding: '2px 8px', borderRadius: 99, border: `1px solid ${teamCfg.border}` }}>
              {p.team?.code || '—'}
            </span>
            {/* Status */}
            <span style={{ background: statusCfg.bg, color: statusCfg.color, fontSize: '.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: 99 }}>
              {statusCfg.label}
            </span>
          </div>
          <span style={{ fontSize: '.7rem', fontWeight: 800, color: teamCfg.text, background: '#fff8', padding: '2px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>
            {p.project_code}
          </span>
        </div>
        <div style={{ fontWeight: 900, fontSize: '.96rem', color: '#1d2939', marginTop: 10, lineHeight: 1.3 }}>
          {p.project_name || p.project_code}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid #f1f5f9' }}>
        {[
          { label: 'Headcount', value: headcount, color: '#1d2939' },
          { label: 'Sites',     value: p.site_count || 0, color: '#0369a1' },
          { label: 'Outsource', value: outsource,  color: '#d97706' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ padding: '12px 0', textAlign: 'center', borderRight: label !== 'Outsource' ? '1px solid #f1f5f9' : 'none' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '.68rem', color: '#94a3b8', fontWeight: 700, marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Role breakdown */}
      <div style={{ padding: '12px 18px', flex: 1 }}>
        {roleRows.length > 0 ? (
          <>
            <div style={{ fontSize: '.68rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Team Composition</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {roleRows.map(({ role, label, count }) => (
                <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 8px' }}>
                  <span style={{ fontSize: '.72rem', fontWeight: 900, color: '#344054' }}>{label}</span>
                  <span style={{ fontSize: '.72rem', fontWeight: 700, color: '#fff', background: teamCfg.dot || ACE_BLUE, borderRadius: 99, minWidth: 18, textAlign: 'center', padding: '0 5px', lineHeight: '18px' }}>{count}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ fontSize: '.76rem', color: '#cbd5e1', fontStyle: 'italic' }}>No staff assigned yet</div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 18px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '.7rem', color: '#94a3b8', fontWeight: 600 }}>
          {p.start_date} → {p.end_date || 'Ongoing'}
        </span>
        <span style={{ fontSize: '.7rem', color: ACE_BLUE, fontWeight: 800 }}>View details →</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW PROJECT MODAL
// ─────────────────────────────────────────────────────────────────────────────

const TEAM_OPTIONS = [
  { value: 'RF',         label: 'RF Project' },
  { value: 'TE',         label: 'TE Project' },
  { value: 'Enterprise', label: 'Enterprise Project' },
  { value: 'Solar',      label: 'Solar Energy' },
  { value: 'AI',         label: 'Computer Vision (AI)' },
  { value: 'HO',         label: 'Head Office' },
]

function NewProjectModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ project_code: '', project_name: '', team: 'RF', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  async function handleSubmit() {
    if (!form.project_code.trim()) { setError('Project Code is required'); return }
    if (!form.project_name.trim()) { setError('Project Name is required'); return }
    setSaving(true)
    setError('')
    try {
      const res = await apiFetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_code: form.project_code.trim().toUpperCase(),
          project_name: form.project_name.trim(),
          team: form.team,
          notes: form.notes || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Error ${res.status}`)
      }
      onSaved()
    } catch (e) {
      setError(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 480, boxShadow: '0 24px 60px rgba(0,0,0,.18)', display: 'flex', flexDirection: 'column', gap: 18 }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#1d2939' }}>New Project</div>
            <div style={{ fontSize: '.76rem', color: '#94a3b8', marginTop: 2 }}>Add a new project to the catalog</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#94a3b8' }}>✕</button>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', borderRadius: 8, padding: '8px 12px', fontSize: '.78rem', fontWeight: 700 }}>⚠ {error}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Project Code *</label>
              <input
                value={form.project_code}
                onChange={e => set('project_code', e.target.value.toUpperCase())}
                placeholder="AIS2601"
                maxLength={20}
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 10px', fontSize: '.82rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', textTransform: 'uppercase' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Team *</label>
              <select
                value={form.team}
                onChange={e => set('team', e.target.value)}
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 10px', fontSize: '.82rem', outline: 'none', fontFamily: 'inherit', background: '#fff' }}
              >
                {TEAM_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Project Name *</label>
            <input
              value={form.project_name}
              onChange={e => set('project_name', e.target.value)}
              placeholder="e.g. AIS BMA Coverage Expansion 2026"
              style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 10px', fontSize: '.82rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Notes</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={2}
              placeholder="Optional description…"
              style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 10px', fontSize: '.82rem', outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{ padding: '8px 22px', borderRadius: 8, border: 'none', background: saving ? '#94a3b8' : '#16a34a', color: '#fff', fontWeight: 700, fontSize: '.82rem', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
          >
            {saving ? 'Creating…' : '✓ Create Project'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const ACE_GRADIENT = 'linear-gradient(135deg, #2447d8 0%, #6d3f8f 48%, #c0392b 100%)'
const ACE_BLUE     = '#2447d8'
const ACE_RED      = '#c0392b'
const ADMIN_NAVY   = '#1f2937'

// ── Finance PO page style (ProjectMonitorPage-compatible) ─────────────────────
const FIN_STYLES = {
  page:    { minHeight:'100vh', display:'grid', gridTemplateColumns:'260px minmax(0,1fr)', background:'#f5f7fb', color:'#1d2939' },
  sidebar: { position:'sticky', top:0, height:'100vh', display:'flex', flexDirection:'column', gap:0, padding:20, paddingBottom:0, color:'#fff', background:ACE_GRADIENT, overflowY:'auto' },
  brandBlock: { display:'flex', alignItems:'center', gap:12, marginBottom:22 },
  logo:    { width:44, height:44, display:'grid', placeItems:'center', borderRadius:8, color:ACE_BLUE, background:'#fff', fontSize:'.88rem', fontWeight:950, flexShrink:0 },
  brandTitle: { fontSize:'.95rem', fontWeight:950 },
  brandSub: { marginTop:2, color:'rgba(255,255,255,.7)', fontSize:'.7rem', fontWeight:700 },
  nav:     { display:'grid', gap:4, marginBottom:16 },
  navButton: { display:'flex', alignItems:'center', gap:8, padding:'10px 12px', border:0, borderRadius:6, color:'rgba(255,255,255,.78)', background:'transparent', fontSize:'.8rem', fontWeight:850, cursor:'pointer', fontFamily:'inherit', width:'100%' },
  navButtonActive: { color:'#1d2939', background:'#fff' },
  navBadge: { padding:'1px 7px', borderRadius:99, fontSize:'.65rem', fontWeight:900, background:'rgba(255,255,255,.15)', color:'rgba(255,255,255,.8)', flexShrink:0 },
  miniChip: () => ({ fontSize:'.58rem', background:'rgba(255,255,255,.18)', color:'rgba(255,255,255,.85)', fontWeight:800, padding:'1px 5px', borderRadius:99 }),
  userBox: { marginTop:'auto', padding:'14px 0', borderTop:'1px solid rgba(255,255,255,.15)', paddingTop:14, marginBottom:0 },
  userName: { fontSize:'.84rem', fontWeight:900, paddingLeft:4 },
  userRole: { marginTop:3, color:'rgba(255,255,255,.7)', fontSize:'.7rem', fontWeight:700, paddingLeft:4 },
  logoutButton: { width:'100%', marginTop:12, minHeight:34, border:'1px solid rgba(255,255,255,.3)', borderRadius:6, color:'#fff', background:'rgba(255,255,255,.1)', fontWeight:850, cursor:'pointer', fontFamily:'inherit', fontSize:'.76rem' },
  main:    { minWidth:0, padding:24, display:'flex', flexDirection:'column', gap:16 },
  header:  { display:'flex', alignItems:'center', gap:16, padding:'22px 26px', borderRadius:8, color:'#fff', background:ACE_GRADIENT, boxShadow:'0 14px 42px rgba(16,24,40,.14)' },
  eyebrow: { color:'rgba(255,255,255,.7)', fontSize:'.72rem', fontWeight:900, textTransform:'uppercase', letterSpacing:'.05em' },
  title:   { margin:'5px 0 0', fontSize:'1.75rem', lineHeight:1.15, fontWeight:950 },
  subtitle: { margin:'8px 0 0', color:'rgba(255,255,255,.82)', fontSize:'.84rem', lineHeight:1.5, fontWeight:600 },
  headerBtn: { minHeight:34, padding:'0 14px', border:'1px solid rgba(255,255,255,.3)', borderRadius:6, color:'#fff', background:'rgba(255,255,255,.15)', cursor:'pointer', fontFamily:'inherit', fontSize:'.76rem', fontWeight:850, whiteSpace:'nowrap' },
  headerPanel: { marginLeft:'auto', minWidth:220, padding:'14px 18px', borderRadius:8, border:'1px solid rgba(255,255,255,.25)', background:'rgba(255,255,255,.12)', flexShrink:0 },
  headerPanelLabel: { color:'rgba(255,255,255,.7)', fontSize:'.72rem', fontWeight:850 },
  headerPanelValue: { marginTop:6, fontSize:'1.5rem', fontWeight:950 },
  headerPanelMeta: { marginTop:6, color:'rgba(255,255,255,.75)', fontSize:'.76rem', fontWeight:700 },
  statsGrid: { display:'grid', gridTemplateColumns:'repeat(5,minmax(0,1fr))', gap:12 },
  statCard:  { padding:16, border:'1px solid #edf0f5', borderRadius:8, background:'#fff', boxShadow:'0 10px 28px rgba(16,24,40,.06)' },
  section:   { padding:20, border:'1px solid #edf0f5', borderRadius:8, background:'#fff', boxShadow:'0 10px 28px rgba(16,24,40,.06)' },
  sectionHeader: { display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, marginBottom:14 },
  sectionTitle:  { margin:0, color:'#1d2939', fontSize:'1.02rem', fontWeight:950 },
  sectionSub:    { marginTop:4, color:'#667085', fontSize:'.76rem', fontWeight:650 },
}

const INPUT = {
  width: '100%', border: '1px solid var(--color-border-secondary)',
  borderRadius: 10, padding: '8px 10px', fontSize: '.82rem',
  color: 'var(--color-text-primary)', background: 'var(--color-background-primary)',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
}
const INPUT_SM = { ...INPUT, padding: '6px 10px', fontSize: '.78rem', background: '#fff', borderRadius: 6 }
const BTN_PRIMARY = {
  padding: '7px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
  background: ACE_BLUE, color: '#fff', fontWeight: 700, fontSize: '.78rem', fontFamily: 'inherit',
}
const BTN_SECONDARY = {
  ...BTN_PRIMARY, background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-secondary)',
}
const ICON_BTN = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--color-text-secondary)', fontSize: '1rem', padding: 4,
}
const TOP_ICON = { width: 34, height: 34, borderRadius: 99, border: '1px solid #edf0f5', background: '#f8fafc', color: '#667085', cursor: 'pointer', display: 'grid', placeItems: 'center' }
const PO_CELL = { padding: '10px 12px', color: '#344054', fontWeight: 650, whiteSpace: 'nowrap' }
const CARD_STYLE = {
  background: 'var(--color-background-secondary)',
  border: '1px solid var(--color-border-tertiary)',
  borderRadius: 12, padding: '12px 14px',
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Master Data — central hub for the 3 file uploads that feed the system
//   1. PO       (Huawei Excel)  → project_pos
//   2. ISDP     (Rollout Plan)  → project_sites.rf_cluster_name / cluster_ready
//   3. MasterDB (Site ID sheet) → project_sites.lat / lng / province
// ─────────────────────────────────────────────────────────────────────────────

const MD_TYPES = [
  {
    key: 'PO',
    label: 'PO (Huawei Excel)',
    endpoint: '/api/project-pos/import-hw',
    accept: '.xlsx',
    sheetHint: 'HW PO format · name-based + alias column matching',
    color: '#2447d8',
    icon: FilePlus,
    totalLabel: 'POs',
    coverage: t => t ? `${t.with_project.toLocaleString()} / ${t.pos.toLocaleString()} have ACE project` : '—',
    coverageRatio: t => t && t.pos ? t.with_project / t.pos : null,
  },
  {
    key: 'ISDP',
    label: 'ISDP (Site Rollout Plan)',
    endpoint: '/api/sites/import-rollout-plan',
    accept: '.xlsx,.xlsm',
    sheetHint: 'Sheet "Site Rollout Plan" · Col B Site · Col C DU ID · Col I RF Cluster',
    color: '#7c3aed',
    icon: Layers,
    totalLabel: 'sites',
    coverage: t => t ? `${t.with_rf_cluster.toLocaleString()} / ${t.sites.toLocaleString()} have RF Cluster Name` : '—',
    coverageRatio: t => t && t.sites ? t.with_rf_cluster / t.sites : null,
  },
  {
    key: 'MASTERDB',
    label: 'Master Site DB',
    endpoint: '/api/sites/import-masterdb',
    accept: '.xlsx',
    sheetHint: 'Sheet "Site ID" · Site ID / Latitude / Longitude / Province',
    color: '#16a34a',
    icon: MapPin,
    totalLabel: 'sites',
    coverage: t => t ? `${t.with_gps.toLocaleString()} / ${t.sites.toLocaleString()} have GPS coords` : '—',
    coverageRatio: t => t && t.sites ? t.with_gps / t.sites : null,
  },
]

function relativeTime(iso) {
  if (!iso) return null
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60)   return 'just now'
  if (diff < 3600) return `${Math.round(diff / 60)} min ago`
  if (diff < 86400) return `${Math.round(diff / 3600)} h ago`
  return `${Math.round(diff / 86400)} d ago`
}

function MasterDataPage({ authenticatedUser }) {
  const [data, setData] = useState({ last: {}, totals: {} })
  const [loading, setLoading] = useState(true)
  const [uploadingKey, setUploadingKey] = useState(null)
  const [toast, setToast] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    apiFetch('/api/data-imports/last')
      .then(r => r.ok ? r.json() : { data: {}, totals: {} })
      .then(j => setData({ last: j.data || {}, totals: j.totals || {} }))
      .catch(() => setData({ last: {}, totals: {} }))
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  function showToast(msg, kind = 'success') {
    setToast({ msg, kind })
    setTimeout(() => setToast(null), 4000)
  }

  async function upload(type, file) {
    if (!file) return
    setUploadingKey(type.key)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await apiFetch(type.endpoint, { method: 'POST', body: fd })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j.detail || `Upload failed (${res.status})`)
      const ins = j.inserted ?? j.imported ?? 0
      const upd = j.updated ?? 0
      showToast(`${type.label}: +${ins} new · ${upd} updated`)
      load()
    } catch (e) {
      showToast(e.message || 'Upload failed', 'error')
    } finally {
      setUploadingKey(null)
    }
  }

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-[#2447d8]">
              <Database size={14} /> Project · Master Data
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Master Data</h1>
            <p className="mt-1 max-w-2xl text-sm font-semibold text-slate-500">
              Upload sources that feed every downstream page. <span className="text-[#2447d8]">PO</span> drives Work Split + Pre-Site queue · <span className="text-purple-700">ISDP</span> adds RF Cluster Name grouping · <span className="text-emerald-700">Master Site DB</span> populates GPS coords for clock-in &amp; map views.
            </p>
          </div>
          <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-50">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {MD_TYPES.map(type => {
            const last = data.last?.[type.key]
            const totals = data.totals?.[type.key]
            const isUploading = uploadingKey === type.key
            const ratio = type.coverageRatio(totals)
            const ratioPct = ratio == null ? null : Math.round(ratio * 100)
            return (
              <MasterDataCard
                key={type.key}
                type={type}
                last={last}
                totals={totals}
                ratioPct={ratioPct}
                isUploading={isUploading}
                onPick={file => upload(type, file)}
              />
            )
          })}
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.04)]">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-amber-50 p-2 text-amber-600">
              <AlertCircle size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-black text-slate-900">Recommended upload order</div>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
                <li><b>Master Site DB</b> first — establishes site_code + GPS for every site</li>
                <li><b>ISDP</b> next — adds RF Cluster Name + rollout dates on top of existing sites</li>
                <li><b>PO</b> last — incoming Huawei POs auto-resolve to canonical RF Cluster Name via lookup</li>
              </ol>
              <p className="mt-2 text-xs font-semibold text-slate-500">
                Out of order is fine — re-uploading any file later will refresh the affected fields. The page will re-fetch totals after each upload so you can verify coverage immediately.
              </p>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold shadow-lg ${toast.kind === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {toast.kind === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          {toast.msg}
        </div>
      )}
    </div>
  )
}

function MasterDataCard({ type, last, totals, ratioPct, isUploading, onPick }) {
  const inputRef = React.useRef(null)
  const Icon = type.icon
  const stale = last && (Date.now() - new Date(last.uploaded_at).getTime()) > 14 * 24 * 3600 * 1000
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: `${type.color}14`, color: type.color }}>
          <Icon size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-black text-slate-900">{type.label}</div>
          <div className="mt-0.5 text-xs font-semibold text-slate-500">{type.sheetHint}</div>
        </div>
      </div>

      <div className="rounded-xl bg-slate-50 p-3.5">
        <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Current coverage</div>
        <div className="mt-1.5 text-xs font-bold text-slate-700">{type.coverage(totals)}</div>
        {ratioPct != null && (
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div className="h-full transition-all" style={{ width: `${ratioPct}%`, background: type.color }} />
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 p-3.5">
        <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Last upload</div>
        {last ? (
          <>
            <div className="mt-1.5 text-sm font-black text-slate-900">{relativeTime(last.uploaded_at)}</div>
            <div className="mt-0.5 text-xs font-semibold text-slate-500">
              {new Date(last.uploaded_at).toLocaleString('en-GB')} · {last.uploaded_by_name || last.uploaded_by_code || 'unknown'}
            </div>
            <div className="mt-1 text-xs font-bold text-slate-600">
              +{last.inserted.toLocaleString()} new · {last.updated.toLocaleString()} updated{last.skipped ? ` · ${last.skipped} skipped` : ''}
            </div>
            {stale && (
              <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                <AlertCircle size={11} /> &gt; 14 d ago
              </div>
            )}
          </>
        ) : (
          <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
            <AlertCircle size={12} /> Never uploaded
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={type.accept}
        className="hidden"
        onChange={e => { onPick(e.target.files?.[0]); if (inputRef.current) inputRef.current.value = '' }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-300"
        style={{ background: isUploading ? undefined : type.color }}
      >
        {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        {isUploading ? 'Uploading…' : `Upload ${type.key === 'MASTERDB' ? 'Master DB' : type.key}`}
      </button>
    </div>
  )
}

export default function ProjectPage({ authenticatedUser = null, onLogout = null }) {
  const [selected, setSelected] = useState(null)
  const [activeNav, setActiveNav] = useState(() => {
    // Deep-link hint: other pages (e.g. Pre-Site Monitor missing-data banner)
    // can drop a one-shot key in localStorage to land the user on a specific
    // sub-tab here.
    try {
      const hint = localStorage.getItem('ace_project_active_nav')
      if (hint) { localStorage.removeItem('ace_project_active_nav'); return hint }
    } catch {}
    return 'overview'
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [dbProjectEmployees, setDbProjectEmployees] = useState([])
  const [dbProjects, setDbProjects] = useState([])
  const [allEmployees, setAllEmployees] = useState([])
  const [totalEmployees, setTotalEmployees] = useState(0)
  const [poRows, setPoRows] = useState([])
  const [showPendingReview, setShowPendingReview] = useState(false)
  const [showNewProject, setShowNewProject] = useState(false)
  // Phase 4: when a Portfolio card is clicked, we drill into the project detail
  // view (5 tabs: People / PO / Pre-Site / Billing / Timeline). null = no drill.
  const [selectedProjectCode, setSelectedProjectCode] = useState(null)
  const navItem = [...PROJECT_NAV, ...PROJECT_BOTTOM_NAV].find(n => n.id === activeNav)
  const projectEmployees = dbProjectEmployees
  const projectManagementEmployees = useMemo(() => allEmployees.filter(isProjectManagementEmployee), [allEmployees])
  const pendingAssignments = useMemo(() => projectEmployees.filter(isPendingProjectAssignment), [projectEmployees])
  const metricCounts = useMemo(() => ({
    total: dbProjects.length,
    active: dbProjects.filter(p => p.status === 'ACTIVE').length,
    rf: dbProjects.filter(p => p.team?.code === 'RF').length,
    sites: dbProjects.reduce((sum, p) => sum + Number(p.site_count || 0), 0),
  }), [dbProjects])

  function loadProjectData() {
    apiFetch(`${API_BASE}/project-employees`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('API unavailable')))
      .then(payload => {
        setDbProjectEmployees((payload.data || []).map(row => ({
          id: row.id,
          employee_code: row.employee_code,
          full_name: row.full_name,
          email: row.email,
          project_team: row.project_team,
          position_name: row.position || row.job_title || row.project_role || row.project_team,
          project_role: row.project_role,
          project_code: row.project_code,
          project_name: row.project_name,
          job_level: row.job_level,
          status: row.status,
        })))
      })
      .catch(() => setDbProjectEmployees([]))
    apiFetch(`${API_BASE}/projects`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Projects unavailable')))
      .then(payload => setDbProjects(payload.data || []))
      .catch(() => setDbProjects([]))
    apiFetch(`${API_BASE}/employees?status=ACTIVE&limit=300`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(payload => {
        const data = payload.data || []
        setAllEmployees(data)
        setTotalEmployees(payload.total || data.length)
      })
      .catch(() => { setAllEmployees([]); setTotalEmployees(0) })
    apiFetch(`${API_BASE}/project-pos`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('PO unavailable')))
      .then(payload => setPoRows(payload.data || []))
      .catch(() => setPoRows([]))
  }

  useEffect(() => {
    loadProjectData()
  }, [])

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="flex min-h-screen">
        <ProjectSidebar
          activeNav={activeNav}
          setActiveNav={id => { setActiveNav(id); setSelected(null) }}
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
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/86 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <ProjectIconButton label="Open menu" onClick={() => setMobileMenuOpen(true)}>
                <Menu size={19} />
              </ProjectIconButton>
              <div className="hidden min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-400 md:flex">
                <Search size={18} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search projects, sites, employees..."
                  className="w-full border-0 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
              <div className="ml-auto flex items-center gap-2">
                <ProjectIconButton label="Notifications">
                  <Bell size={18} />
                </ProjectIconButton>
                <button className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:bg-slate-50 sm:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-black text-white" style={{ background: ACE_BLUE }}>
                    {projectInitials(authenticatedUser?.name || 'Project Admin')}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black text-slate-900">{authenticatedUser?.name || 'Project Admin'}</div>
                    <div className="text-xs font-bold text-slate-400">{authenticatedUser?.positionName || 'Project Database'}</div>
                  </div>
                </button>
                {onLogout && (
                  <ProjectIconButton label="Logout" onClick={onLogout}>
                    <LogOut size={18} />
                  </ProjectIconButton>
                )}
              </div>
            </div>
          </header>

          {selectedProjectCode ? (
            <ProjectDetailPage
              projectCode={selectedProjectCode}
              projects={dbProjects}
              allEmployees={allEmployees}
              projectEmployees={projectEmployees}
              poRows={poRows}
              onBack={() => setSelectedProjectCode(null)}
              onJumpToNav={id => { setSelectedProjectCode(null); setActiveNav(id) }}
            />
          ) : activeNav === 'overview' ? (
            <ExecutiveSummaryPage
              allEmployees={allEmployees}
              projects={dbProjects}
              projectEmployees={projectEmployees}
              poRows={poRows}
              onOpenProjects={() => setShowPendingReview(true)}
              onNewProject={() => setShowNewProject(true)}
              onJumpToNav={setActiveNav}
              onOpenProject={code => setSelectedProjectCode(code)}
            />
          ) : activeNav === 'project_board' ? (
            <ProjectBoardPage
              projects={dbProjects}
              allEmployees={allEmployees}
              onNewProject={() => setShowNewProject(true)}
            />
          ) : activeNav === 'progress' ? (
            <ProgressPage projects={dbProjects} allEmployees={allEmployees} />
          ) : activeNav === 'staff_roster' ? (
            <StaffRosterPage allEmployees={allEmployees} projects={dbProjects} onRefresh={loadProjectData} />
          ) : activeNav === 'project_po' ? (
            <ProjectPOInboxPage projects={dbProjects} />
          ) : activeNav === 'billing' ? (
            <BillingPage authenticatedUser={authenticatedUser} />
          ) : activeNav === 'work_split' ? (
            <div className="flex-1 overflow-auto p-4 md:p-7"><ProjectWorkSplitPage authenticatedUser={authenticatedUser} embedded /></div>
          ) : activeNav === 'master_data' ? (
            <MasterDataPage authenticatedUser={authenticatedUser} />
          ) : activeNav !== 'projects' ? (
            <PlaceholderPage label={navItem?.label} />
          ) : (
            <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6 lg:p-8">
              <section className="flex shrink-0 flex-col gap-3 md:flex-row md:items-center">
                <div className="min-w-0 md:mr-auto">
                  <div className="text-[1.45rem] font-black leading-tight text-[#1d2939]">
                    Project Management
                  </div>
                  <div className="mt-1 text-[.82rem] text-slate-500">
                    ACE Project Operations · RF/TE Workforce
                  </div>
                </div>
                <button className="rounded border border-[#e4e7ec] bg-white px-3.5 py-2 text-xs font-bold text-[#344054]">Export</button>
                <button onClick={() => setShowNewProject(true)} className="rounded bg-[#2447d8] px-3.5 py-2 text-xs font-bold text-white">+ New Project</button>
              </section>

              <PendingAssignmentAlert pending={pendingAssignments} onOpenProjects={() => setShowPendingReview(true)} />

              <section className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Total Projects" value={metricCounts.total} note="All project profiles" color={ACE_BLUE} />
                <MetricCard label="Active" value={metricCounts.active} note="Currently running" color="#16a34a" />
                <MetricCard label="RF Projects" value={metricCounts.rf} note="RF team workload" color={ACE_RED} />
                <MetricCard label="Project Employees" value={projectEmployees.length} note="Synced from HR" color="#6d3f8f" />
              </section>

              <ProjectWorkforceInsights
                employees={projectEmployees}
                projects={dbProjects}
                totalEmployees={projectManagementEmployees.length || totalEmployees}
                poRows={poRows}
              />

              <ProjectWorkforce employees={projectEmployees} />

              <section className={['grid min-h-0 flex-1 gap-3.5 overflow-hidden', selected ? 'grid-cols-1 xl:grid-cols-[390px_minmax(0,1fr)]' : 'grid-cols-1'].join(' ')}>
                <div className="min-h-0 overflow-hidden rounded-md border border-[#e5e7eb] bg-white">
                  <ProjectList projects={dbProjects} onSelect={setSelected} selected={selected} />
                </div>
                {selected && (
                  <div className="min-h-0 overflow-hidden rounded-md border border-[#e5e7eb] bg-white">
                    <ProjectPanel project={selected} projectEmployees={projectEmployees} allProjects={dbProjects} onClose={() => setSelected(null)} />
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>
      {showPendingReview && (
        <PendingAssignmentReviewModal
          pending={pendingAssignments}
          projects={dbProjects}
          onClose={() => setShowPendingReview(false)}
          onSaved={() => {
            setShowPendingReview(false)
            setActiveNav('projects')
            loadProjectData()
          }}
        />
      )}
      {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onSaved={() => { setShowNewProject(false); loadProjectData() }}
        />
      )}
    </div>
  )
}
