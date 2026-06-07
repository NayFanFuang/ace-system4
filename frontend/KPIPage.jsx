'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Gauge, ClipboardCheck, ClipboardList, TrendingUp, LayoutDashboard, Settings, Plus,
  Sparkles, Search, Scale, CheckCircle2, Target, CalendarDays, Lock, Unlock, LogOut,
  Award, ChevronDown, ChevronRight, AlertTriangle, Users, Clock, Percent,
  FileSpreadsheet, FileText, X, Save, Trash2, Loader, RotateCcw,
} from 'lucide-react'
import { apiFetch } from './src/apiFetch.js'
import {
  KPI_EMPLOYEES,
  KPI_EVALUATE_ITEMS,
  KPI_EMPLOYEE_PERIOD_ITEMS,
  KPI_EVALUATIONS,
  KPI_SOURCE_SUMMARY,
} from './kpiSeed.js'

const PERIODS = ['2026-03', '2026-02', '2026-01', '2025-12', '2025-11', '2025-10']
const SOURCE_PERIODS = KPI_SOURCE_SUMMARY.periods?.length ? KPI_SOURCE_SUMMARY.periods : PERIODS

const KPI_LIBRARY = {
  'Drive Test Engineer': [
    ['KPI-0001', 'Clock in-out and Completion Time', 'Clock In-Out timestamp', 5, 26],
    ['KPI-0002', 'Complainted', 'Complain', 5, 5],
    ['KPI-0003', 'Monpower Score', 'Special Support', 5, 5],
    ['KPI-0004', 'Monpower Score', 'Technical skills / Problem Solve', 5, 5],
    ['KPI-0005', 'Task Completion Time & Problem Resolution Time', 'Monitor 1st time PAC DT Done', 15, 42],
    ['KPI-0006', 'Task Completion Time & Problem Resolution Time', 'Monitor 1st time SSV DT Done', 15, 303],
    ['KPI-0007', 'Task On Time Delivery', 'Monitor PAC DT', 20, 422],
    ['KPI-0008', 'Task On Time Delivery', 'Monitor SSV DT', 20, 150],
    ['KPI-0009', 'Task On Time Delivery', 'Planning Task DT', 10, 572],
  ],
  'Drive Test Analysis Engineer': [
    ['KPI-0010', 'Clock in-out and Completion Time', 'Clock In-Out timestamp', 5, 26],
    ['KPI-0012', 'Complainted', 'Internal Complain', 5, 5],
    ['KPI-0013', 'Monpower Score', 'Negotiation skills with customers', 3, 5],
    ['KPI-0014', 'Monpower Score', 'Special Support', 3, 5],
    ['KPI-0015', 'Monpower Score', 'Technical skills', 4, 5],
    ['KPI-0018', 'Task Completion Time & Problem Resolution Time', 'Close PA 1st time Approve', 15, 23],
    ['KPI-0020', 'Task Completion Time & Problem Resolution Time', 'Open PA 1st time Approve', 15, 44],
    ['KPI-0021', 'Task Completion Time & Problem Resolution Time', 'PAC 1st time Approve', 10, 13],
    ['KPI-0025', 'Task On Time Delivery', 'Closed PA Discussion with SLA', 15, 35],
    ['KPI-0027', 'Task On Time Delivery', 'Open PA Submission with SLA', 15, 35],
    ['KPI-0028', 'Task On Time Delivery', 'PAC Submission with SLA', 10, 35],
  ],
  'Report Preparation': [
    ['KPI-0114', 'Clock in-out and Completion Time', 'Clock In-Out timestamp', 5, 26],
    ['KPI-0115', 'Complainted', 'Complain', 5, 5],
    ['KPI-0117', 'Monpower Score', 'Special Support', 5, 5],
    ['KPI-0118', 'Monpower Score', 'Technical skills / Problem Solve', 5, 5],
    ['KPI-0123', 'Task Completion Time & Problem Resolution Time', 'SSV DT Report 1st time Approve', 30, 57],
    ['KPI-0127', 'Task On Time Delivery', 'Submit SSV DT Report', 40, 70],
    ['KPI-0128', 'Task On Time Delivery', 'Upload Report to server', 10, 57],
  ],
  default: [
    ['KPI-9001', 'Clock in-out and Completion Time', 'Clock In-Out timestamp', 5, 26],
    ['KPI-9002', 'Complainted', 'External/Internal Complain', 5, 100],
    ['KPI-9003', 'Monpower Score', 'Problem solve/Decision making', 10, 100],
    ['KPI-9004', 'Task Completion Time & Problem Resolution Time', 'Task completed with SLA', 30, 100],
    ['KPI-9005', 'Task On Time Delivery', 'Delivery with SLA', 30, 100],
    ['KPI-9006', 'Response', 'Special Support', 20, 100],
  ],
}

function rowsForPosition(position) {
  return (KPI_LIBRARY[position] || KPI_LIBRARY.default).map(([itemId, mainEvaluate, evaluateItem, weight, target]) => ({
    itemId,
    mainEvaluate,
    evaluateItem,
    weight,
    target,
    actual: '',
    score: '',
    manual: false,
  }))
}

// Employee position → KPI catalog position (mirror of backend POSITION_ALIAS / KPI_Position_Mapping.csv)
const KPI_POSITION_ALIAS = {
  'drive test analysis engineer': 'Drive Test Analysis',
  'senior site supervisor': 'Sr.Supervisor',
  'store officer': 'Inventory Management',
  'site engineer': 'Site Supervisor',
  'dte': 'Drive Test Engineer',
  'project coordinator and store officer': 'Inventory Management',
}
function resolveKpiPosition(value) {
  return KPI_POSITION_ALIAS[String(value || '').trim().toLowerCase()] || (value || '')
}

// Positions whose KPI is a rollup (average of their project-group team), not item-based
const ROLLUP_POSITIONS = new Set(['project director'])

function normalizeName(value) {
  return String(value || '').trim().toUpperCase()
}

// Display stored names (uppercase in KPI data) in proper Title Case
function titleCase(value) {
  return String(value || '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

function normalizePeriod(value) {
  const text = String(value || '').trim()
  return text.length >= 7 ? text.slice(0, 7) : text
}

function buildRealKpiRows(employee, period) {
  if (!employee) return []
  const nameKey = normalizeName(employee.name)
  const itemMap = new Map(KPI_EVALUATE_ITEMS.map(item => [item.itemId, item]))
  const requestedPeriod = normalizePeriod(period)
  const employeePeriodItems = KPI_EMPLOYEE_PERIOD_ITEMS
    .filter(row => normalizeName(row.employeeName) === nameKey && row.active !== false)
    .map(row => ({ ...row, period: normalizePeriod(row.period) }))

  const availablePeriods = [...new Set(employeePeriodItems.map(row => row.period).filter(Boolean))].sort().reverse()
  const resolvedPeriod = availablePeriods.includes(requestedPeriod) ? requestedPeriod : availablePeriods[0]
  const mappedItems = employeePeriodItems.filter(row => row.period === resolvedPeriod)

  const baseRows = mappedItems.length
    ? mappedItems.map(mapRow => {
        const lib = itemMap.get(mapRow.itemId) || {}
        return {
          itemId: mapRow.itemId,
          mainEvaluate: lib.mainEvaluate || '',
          evaluateItem: lib.evaluateItem || '',
          weight: mapRow.weight || lib.weight || 0,
          target: lib.target || 0,
          actual: '',
          score: '',
          manual: false,
          sourcePeriod: resolvedPeriod,
        }
      })
    : (KPI_EVALUATE_ITEMS
        .filter(item => item.active !== false && String(item.position || '').trim() === String(employee.position || '').trim())
        .map(item => ({
          itemId: item.itemId,
          mainEvaluate: item.mainEvaluate,
          evaluateItem: item.evaluateItem,
          weight: item.weight || 0,
          target: item.target || 0,
          actual: '',
          score: '',
          manual: false,
          sourcePeriod: requestedPeriod,
        })))

  const evaluationRows = KPI_EVALUATIONS.filter(row =>
    normalizeName(row.employeeName) === nameKey &&
    normalizePeriod(row.period) === requestedPeriod
  )
  const evalMap = new Map(evaluationRows.map(row => [row.itemId, row]))

  return baseRows.map(row => {
    const evaluated = evalMap.get(row.itemId)
    if (!evaluated) return row
    const weight = evaluated.weight || row.weight
    const target = evaluated.target || row.target
    const actual = evaluated.actual ?? ''
    const auto = autoScore(weight, target, actual)
    const score = auto !== '' ? auto : (evaluated.score ?? '')
    return {
      ...row,
      mainEvaluate: evaluated.mainEvaluate || row.mainEvaluate,
      evaluateItem: evaluated.evaluateItem || row.evaluateItem,
      weight,
      target,
      actual,
      score,
      manual: false,
      evaluated: true,
      updatedAt: evaluated.updatedAt || '',
    }
  })
}

function evaluationTotalFor(employeeName, period) {
  const rows = KPI_EVALUATIONS.filter(row =>
    normalizeName(row.employeeName) === normalizeName(employeeName) &&
    normalizePeriod(row.period) === normalizePeriod(period)
  )
  return rows.reduce((sum, row) => sum + Number(row.score || 0), 0)
}

function autoScore(weight, target, actual) {
  const w = Number(weight)
  const t = Number(target)
  const a = Number(actual)
  if (!Number.isFinite(w) || !Number.isFinite(t) || !Number.isFinite(a) || t <= 0 || actual === '') return ''
  return Math.round(Math.min(a / t, 1) * w * 100) / 100
}

function calcGrade(total) {
  if (total >= 90) return 'A'
  if (total >= 80) return 'B'
  if (total >= 70) return 'C'
  return 'D'
}

// ─── Tailwind-styled helpers (matches HR Employees design) ────────────────────
const KPI_INPUT_CLS = 'w-full rounded border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-[#2447d8] focus:ring-2 focus:ring-[#2447d8]/10'

function KpiField({ label, children }) {
  return (
    <div className="flex flex-col gap-1 min-w-[180px] flex-1">
      <label className="text-[.68rem] font-black uppercase text-slate-500">{label}</label>
      {children}
    </div>
  )
}

function KpiMetric({ label, value, color = '#2447d8', icon: Icon = Gauge }) {
  return (
    <div className="rounded border border-[#e4e7ec] bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-black uppercase text-slate-500">{label}</div>
        {Icon && <Icon size={16} className="text-slate-300" />}
      </div>
      <div className="mt-2 text-2xl font-black leading-none" style={{ color }}>{value}</div>
    </div>
  )
}

const KPI_NAV = [
  { id: 'main',    label: 'Evaluate KPI',     icon: ClipboardCheck },
  { id: 'trend',   label: 'Employee Trend',   icon: TrendingUp },
  { id: 'summary', label: 'Executive Summary', icon: LayoutDashboard },
]

function KpiSidebarNew({ page, setPage, setStatus, openManage, openAddLib }) {
  return (
    <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white/95 p-5 shadow-2xl backdrop-blur lg:sticky lg:top-0 lg:flex lg:h-screen lg:shadow-none lg:overflow-y-auto">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #2447d8, #c73b32)' }}>
          <Gauge size={24} />
        </div>
        <div className="min-w-0">
          <div className="text-base font-black text-slate-950">ACE KPI Suite</div>
          <div className="text-xs font-bold text-slate-400">Performance Management</div>
        </div>
      </div>

      <nav className="mt-9 space-y-1">
        {KPI_NAV.map(item => {
          const active = item.id === page
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => { setPage(item.id); setStatus(`Switched to ${item.label}`) }}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-sm font-black transition ${active ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="mt-6 border-t border-slate-100 pt-4 space-y-1">
        <div className="px-4 text-[.65rem] font-black uppercase tracking-wider text-slate-400 mb-2">Tools</div>
        <button onClick={openManage} className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-sm font-black text-slate-500 transition hover:bg-slate-50 hover:text-slate-950">
          <Settings size={18} /> Manage Items
        </button>
        <button onClick={openAddLib} className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-sm font-black text-slate-500 transition hover:bg-slate-50 hover:text-slate-950">
          <Plus size={18} /> Add to Library
        </button>
      </div>

      <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-sm font-black text-slate-900">
          <Sparkles size={18} style={{ color: '#2447d8' }} /> KPI Workspace
        </div>
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
          Performance evaluation · Trend analysis · Project rollup.
        </p>
      </div>
    </aside>
  )
}

export default function KPIPage({ authenticatedUser = null, onLogout = null }) {
  const [dbEmployees, setDbEmployees] = useState([])
  const [dbPeriods, setDbPeriods] = useState([])
  const [periodDetails, setPeriodDetails] = useState([])  // [{period, count}]
  const [dbItems, setDbItems] = useState([])      // KpiItem library from DB
  const [dbEvals, setDbEvals] = useState([])       // KpiEvaluation from DB (for trend/summary)
  const [seeded, setSeeded] = useState(false)

  // Seed DB from kpiSeed.js on first load if DB is empty
  useEffect(() => {
    apiFetch('/api/kpi/periods')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.periods && data.periods.length > 0) {
          setDbPeriods(data.periods)
          setSeeded(true)
          return
        }
        // DB empty — seed now
        setStatus('Importing KPI data to database...')
        apiFetch('/api/kpi/import', {
          method: 'POST',
          body: JSON.stringify({
            items: KPI_EVALUATE_ITEMS.map(r => ({
              itemId: r.itemId, position: r.position, mainEvaluate: r.mainEvaluate,
              evaluateItem: r.evaluateItem, weight: r.weight, target: r.target,
              active: r.active !== false, updatedAt: r.updatedAt || '',
            })),
            period_items: KPI_EMPLOYEE_PERIOD_ITEMS.map(r => ({
              period: r.period, employeeName: r.employeeName, position: r.position,
              itemId: r.itemId, weight: r.weight, active: r.active !== false, updatedAt: r.updatedAt || '',
            })),
            evaluations: KPI_EVALUATIONS.map(r => ({
              evalId: r.evalId, employeeName: r.employeeName, position: r.position,
              period: r.period, itemId: r.itemId, mainEvaluate: r.mainEvaluate,
              evaluateItem: r.evaluateItem, weight: r.weight, target: r.target,
              actual: r.actual, score: r.score, remark: r.remark, updatedAt: r.updatedAt || '',
            })),
          }),
        })
          .then(r => r.ok ? r.json() : null)
          .then(result => {
            if (result?.success) {
              setStatus(`Imported: ${result.inserted.items} items, ${result.inserted.period_items} period items, ${result.inserted.evaluations} evaluations`)
              setSeeded(true)
            }
          })
          .catch(() => setSeeded(true))
      })
      .catch(() => setSeeded(true))
  }, [])

  // Fetch employees and periods from DB after seed
  useEffect(() => {
    if (!seeded) return
    apiFetch('/api/kpi/employees')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.employees?.length) setDbEmployees(data.employees) })
      .catch(() => {})
    apiFetch('/api/kpi/periods')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.periods?.length) setDbPeriods(data.periods)
        if (data?.details?.length) setPeriodDetails(data.details)
      })
      .catch(() => {})
  }, [seeded])

  // Merge DB employees with seed employees (DB takes priority)
  const employees = useMemo(() => {
    const base = dbEmployees.length > 0
      ? dbEmployees
      : KPI_EMPLOYEES.map(r => ({ name: r.name, projectName: r.projectName, projectCode: r.projectCode, position: r.position, email: r.email || '', active: r.active !== false }))
    return base
      .filter(r => r.active !== false)
      .map((r, i) => ({ ...r, id: i + 1 }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [dbEmployees])

  // Current month is the default evaluation period (PM evaluates every month)
  const currentMonth = new Date().toISOString().slice(0, 7)  // YYYY-MM
  // Period options = current month + any period that already has data (deduped, newest first)
  const availablePeriods = useMemo(() => {
    const base = dbPeriods.length > 0 ? dbPeriods : SOURCE_PERIODS
    return [...new Set([currentMonth, ...base])].sort().reverse()
  }, [dbPeriods, currentMonth])

  const [page, setPage] = useState('main')
  const [employeeId, setEmployeeId] = useState('')
  const [period, setPeriod] = useState(currentMonth)
  const [remark, setRemark] = useState('')
  const [status, setStatus] = useState('Ready')
  const [itemsByEmployee, setItemsByEmployee] = useState({})
  const [showManage, setShowManage] = useState(false)
  const [showAddLib, setShowAddLib] = useState(false)
  const [showWork, setShowWork] = useState(false)
  const [reEval, setReEval] = useState(null)
  const [locked, setLocked] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState(null)   // { ok: boolean, text: string }

  // Set default employee once list loads
  useEffect(() => {
    if (!employeeId && employees.length > 0) setEmployeeId(employees[0].id)
  }, [employees])

  const employee = employees.find(emp => emp.id === Number(employeeId)) || employees[0]
  // Rollup positions: score = average of their project-group team (no own KPI items)
  const isRollup = ROLLUP_POSITIONS.has((employee?.position || '').trim().toLowerCase())
  const items = itemsByEmployee[employee?.id] || []
  const totalScore = items.reduce((sum, row) => sum + Number(row.score || autoScore(row.weight, row.target, row.actual) || 0), 0)
  const totalWeight = items.reduce((sum, row) => sum + Number(row.weight || 0), 0)
  const scoredCount = items.filter(row => row.score !== '' || row.actual !== '').length
  const groups = groupBy(items, row => row.mainEvaluate || 'Others')

  async function loadItems() {
    if (!employee) return
    setStatus('Loading KPI from database...')
    try {
      // Fetch period-items and evaluate-items from DB
      const [piRes, itemRes, evalRes] = await Promise.all([
        apiFetch(`/api/kpi/period-items?employee_name=${encodeURIComponent(employee.name)}`).then(r => r.ok ? r.json() : null),
        apiFetch(`/api/kpi/items${employee.position ? `?position=${encodeURIComponent(employee.position)}` : ''}`).then(r => r.ok ? r.json() : null),
        apiFetch(`/api/kpi/evaluations?employee_name=${encodeURIComponent(employee.name)}&period=${encodeURIComponent(period)}`).then(r => r.ok ? r.json() : null),
      ])

      const periodItems = piRes?.periodItems || []
      const itemList = itemRes?.items || []
      const itemLib = new Map(itemList.map(i => [i.itemId, i]))
      const evaluations = evalRes?.evaluations || []
      // Split official (PM) vs the employee's self-assessment (SELF)
      const evalMap = new Map(evaluations.filter(e => (e.raterType || 'PM') !== 'SELF').map(e => [e.itemId, e]))
      const selfMap = new Map(evaluations.filter(e => (e.raterType || '') === 'SELF').map(e => [e.itemId, e]))

      // Find closest period with data
      const allPeriods = [...new Set(periodItems.map(r => r.period))].sort().reverse()
      const resolvedPeriod = allPeriods.includes(period) ? period : allPeriods[0]
      const matchItems = periodItems.filter(r => r.period === resolvedPeriod)

      let baseRows = matchItems.length
        ? matchItems.map(pi => {
            const lib = itemLib.get(pi.itemId) || {}
            return {
              itemId: pi.itemId,
              mainEvaluate: pi.mainEvaluate || lib.mainEvaluate || '',
              evaluateItem: pi.evaluateItem || lib.evaluateItem || '',
              weight: pi.weight || lib.weight || 0,
              target: pi.target || lib.target || 100,
              actual: '', score: '', manual: false,
              sourcePeriod: resolvedPeriod,
            }
          })
        : (itemList.length
            ? itemList.map(it => ({   // no period-items → live KPI catalog by position (same source the Self-Assessment uses)
                itemId: it.itemId,
                mainEvaluate: it.mainEvaluate || '',
                evaluateItem: it.evaluateItem || '',
                weight: it.weight || 0,
                target: it.target || 100,
                actual: '', score: '', manual: false,
                sourcePeriod: '',
              }))
            : buildRealKpiRows(employee, period))  // last resort: local seed

      const rows = baseRows.map(row => {
        const sv = selfMap.get(row.itemId)
        const ev = evalMap.get(row.itemId)
        // Target of record for the round: PM's explicit target if evaluated, else the
        // target the employee set on their Self-Assessment, else the library default.
        const weight = ev?.weight || row.weight
        const target = ev?.target || sv?.target || row.target
        const actual = ev ? (ev.actual ?? '') : ''
        const pmAuto = autoScore(weight, target, actual)
        const score = ev ? (pmAuto !== '' ? pmAuto : (ev.score ?? '')) : ''
        // Self (reference): mirror exactly what the employee submitted — their own
        // weight/target/actual — so it matches their Self-Assessment screen.
        let selfActual, selfScore
        if (sv) {
          selfActual = sv.actual ?? ''
          selfScore = autoScore(sv.weight || weight, sv.target || target, selfActual)
          if (selfScore === '') selfScore = sv.score ?? ''
        } else {
          selfActual = actual
          selfScore = score
        }
        return {
          ...row,
          selfActual,
          selfScore,
          mainEvaluate: ev?.mainEvaluate || row.mainEvaluate,
          evaluateItem: ev?.evaluateItem || row.evaluateItem,
          weight,
          target,
          actual,
          score,
          manual: false,
          evaluated: !!ev,
          updatedAt: ev?.updatedAt || '',
        }
      })

      setItemsByEmployee(prev => ({ ...prev, [employee.id]: rows.length ? rows : rowsForPosition(employee.position) }))
      const note = resolvedPeriod !== period ? ` (using ${resolvedPeriod})` : ''
      setStatus(`KPI loaded from DB (Period: ${period}${note})`)
    } catch {
      // Fallback to seed data
      const realRows = buildRealKpiRows(employee, period)
      setItemsByEmployee(prev => ({ ...prev, [employee.id]: realRows.length ? realRows : rowsForPosition(employee.position) }))
      setStatus(`KPI loaded from seed (Period: ${period})`)
    }
  }

  // Auto-load KPI items whenever the selected employee or period changes (no manual button)
  useEffect(() => {
    if (!seeded || !employee?.id) return
    loadItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee?.id, period, seeded])

  // Check finalize-lock status for the selected employee + period
  useEffect(() => {
    if (!employee?.name || !period) { setLocked(false); return }
    apiFetch(`/api/kpi/locks?period=${encodeURIComponent(period)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const set = new Set((d?.locks || []).map(l => (l.employeeName || '').toUpperCase()))
        setLocked(set.has((employee.name || '').toUpperCase()))
      })
      .catch(() => setLocked(false))
  }, [employee?.id, period])

  async function finalizePeriod() {
    if (!confirm(`Finalize ${employee?.name} @ ${period}? This locks the evaluation from further edits.`)) return
    const r = await apiFetch('/api/kpi/lock', { method: 'POST', body: JSON.stringify({ employee_name: employee?.name, period }) })
    if (r.ok) { setLocked(true); setStatus(`Finalized & locked: ${period}`) } else setStatus('Finalize failed.')
  }
  async function unlockPeriod() {
    const r = await apiFetch('/api/kpi/lock', { method: 'DELETE', body: JSON.stringify({ employee_name: employee?.name, period }) })
    if (r.ok) { setLocked(false); setStatus(`Unlocked: ${period}`) } else setStatus('Unlock failed.')
  }

  function updateItem(index, patch, auto = true) {
    const next = items.map((row, rowIndex) => {
      if (rowIndex !== index) return row
      const merged = { ...row, ...patch }
      // PM score (official) auto-derived from PM actual
      if (auto && !merged.manual) merged.score = autoScore(merged.weight, merged.target, merged.actual)
      // Self score auto-derived from self actual (reference only; frontend preview until backend stores it)
      if ('selfActual' in patch || 'weight' in patch || 'target' in patch) {
        merged.selfScore = autoScore(merged.weight, merged.target, merged.selfActual)
      }
      return merged
    })
    setItemsByEmployee(prev => ({ ...prev, [employee.id]: next }))
  }

  async function saveAll() {
    const warn = text => { setSaveMsg({ ok: false, text }); setStatus(text) }
    if (locked) return warn('Period is finalized (locked). Unlock to edit.')
    if (!items.length) return warn('No KPI items for this selection.')
    const wsum = items.reduce((s, r) => s + Number(r.weight || 0), 0)
    if (wsum !== 100) return warn(`Total weight must equal 100 (now ${wsum}). Adjust in Manage Items.`)
    const incomplete = items.filter(row => (row.score === '' || row.score == null) && (row.actual === '' || row.actual == null))
    if (incomplete.length) return warn(`Please enter Actual for all items — ${incomplete.length} of ${items.length} still empty.`)
    setSaving(true); setSaveMsg(null)
    try {
      const payload = items.map(row => ({
        employee_name: employee.name,
        employee_code: employee.employeeCode || null,
        position: employee.position || null,
        period: period,
        item_id: row.itemId,
        main_evaluate: row.mainEvaluate,
        evaluate_item: row.evaluateItem,
        weight: Number(row.weight) || 0,
        target: Number(row.target) || 100,
        actual: row.actual !== '' ? Number(row.actual) : null,
        score: row.score !== '' ? Number(row.score) : null,
        remark: remark || null,
        evaluated_by: authenticatedUser?.employeeCode || null,
        rater_type: 'PM',
      }))
      const res = await apiFetch('/api/kpi/evaluations', { method: 'POST', body: JSON.stringify(payload) })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setSaveMsg({ ok: true, text: `Saved ${data.saved} items — ${employee.name} @ ${period}` })
        setStatus(`Saved to DB: ${data.saved} rows — ${employee.name} @ ${period}`)
      } else {
        setSaveMsg({ ok: false, text: data.detail || `Save failed (HTTP ${res.status})` })
      }
    } catch {
      setSaveMsg({ ok: false, text: 'Save failed — check your connection and try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="ace-kpi-page min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="flex min-h-screen">
        <KpiSidebarNew
          page={page}
          setPage={setPage}
          setStatus={setStatus}
          openManage={() => setShowManage(true)}
          openAddLib={() => setShowAddLib(true)}
        />

        <main className="min-w-0 flex-1">
          {/* Sticky top header — matches HR */}
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/86 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="hidden min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-400 md:flex">
                <Search size={18} />
                <input
                  placeholder="Search employee, KPI item, period..."
                  className="w-full border-0 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:bg-slate-50 sm:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-black text-white" style={{ background: '#2447d8' }}>
                    {(authenticatedUser?.name || 'KP').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black text-slate-900">{authenticatedUser?.name || 'KPI Admin'}</div>
                    <div className="text-xs font-bold text-slate-400">{authenticatedUser?.positionName || 'Performance Management'}</div>
                  </div>
                </button>
                {onLogout && (
                  <button onClick={onLogout} title="Logout" className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-600 shadow-sm hover:bg-slate-50"><LogOut size={16} /></button>
                )}
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto bg-[#f5f7fb]">
            {page === 'main' && (
              <div className="flex flex-col gap-5 p-4 md:p-7">
                {/* Title section — HR style */}
                <section className="flex shrink-0 flex-col gap-3 xl:flex-row xl:items-center">
                  <div className="min-w-0 xl:mr-auto">
                    <div className="text-[1.45rem] font-black leading-tight text-[#1d2939]">KPI Evaluation</div>
                    <div className="mt-1 text-[.82rem] text-slate-500">Monthly performance evaluation · Score = min(actual/target, 1) × weight · Edit Score to override.</div>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded border border-[#e4e7ec] bg-white px-3 py-2 text-xs font-bold text-slate-600">
                    <CalendarDays size={14} /> {new Date().toLocaleDateString('en-CA')}
                  </div>
                </section>

                {/* Metric cards (item-based — hidden for rollup roles) */}
                {!isRollup && (
                <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <KpiMetric label="KPI Items"   value={items.length}                    color="#2447d8" icon={ClipboardList} />
                  <KpiMetric label="Total Weight" value={totalWeight.toFixed(0)}         color="#6d3f8f" icon={Scale} />
                  <KpiMetric label="Scored"      value={`${scoredCount}/${items.length || 0}`} color="#16a34a" icon={CheckCircle2} />
                  <KpiMetric label="Total Score" value={totalScore.toFixed(1)}          color="#dc2626" icon={Target} />
                </section>
                )}

                {/* Monthly Team Status — who's evaluated this period */}
                <MonthlyTeamStatus
                  period={period}
                  employees={employees}
                  currentEmployeeId={employee?.id}
                  refreshKey={itemsByEmployee[employee?.id]}
                  onSelect={id => { setEmployeeId(id); setStatus('Loaded from team status.') }}
                />

                {/* Employee Selector Card — HR style */}
                <section className="rounded border border-[#e4e7ec] bg-white p-5">
                  <div className="text-xs font-black uppercase text-slate-500 mb-3">Employee &amp; Period</div>
                  <div className="flex flex-wrap items-end gap-3">
                    <KpiField label="Employee">
                      <select className={KPI_INPUT_CLS} value={employeeId} onChange={event => setEmployeeId(event.target.value)}>
                        <option value="">— Select Employee —</option>
                        {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                      </select>
                    </KpiField>
                    <KpiField label="Project">
                      <input className={KPI_INPUT_CLS + ' bg-slate-50'} readOnly value={employee?.projectName || ''} placeholder="— Auto —" />
                    </KpiField>
                    <KpiField label="Position">
                      <input className={KPI_INPUT_CLS + ' bg-slate-50'} readOnly value={employee?.position || ''} placeholder="— Auto —" />
                    </KpiField>
                    <KpiField label="Period">
                      <select className={KPI_INPUT_CLS} value={period} onChange={event => setPeriod(event.target.value)}>
                        {availablePeriods.map((prd) => {
                          const detail = periodDetails.find(d => d.period === prd)
                          const cnt = detail?.count ? ` · ${detail.count}` : ''
                          const tag = prd === currentMonth ? ' (this month)' : ''
                          return <option key={prd} value={prd}>{prd}{cnt}{tag}</option>
                        })}
                      </select>
                    </KpiField>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#edf0f5] pt-3">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[.68rem] font-black text-blue-700 border border-blue-100">{items.length} items</span>
                    <div className="text-[.72rem] font-bold text-slate-500">{status}</div>
                  </div>
                </section>

                {/* Performance History — embedded mini-trend (hidden for rollup roles) */}
                {!isRollup && <EmployeeTrendMini employee={employee} />}

                {/* Rollup positions (e.g. Project Director): score = team average, no item entry */}
                {isRollup ? <RollupScoreCard employee={employee} period={period} /> : (<>

                {/* KPI Items Table — HR style */}
                {items.length ? (
                  <section className="min-h-0 overflow-hidden rounded border border-[#e4e7ec] bg-white">
                    <div className="flex items-center justify-between border-b border-[#edf0f5] px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="font-black text-[#1d2939]">KPI Items</div>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[.6rem] font-black text-slate-500 border border-slate-200">Self = employee self-assessment</span>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-500">{items.length}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1180px] border-collapse text-[.76rem]">
                        <thead className="bg-slate-50 text-left text-[.68rem] uppercase text-slate-500">
                          <tr>
                            <th className="px-3 py-2 font-black" rowSpan={2}>Main Evaluate</th>
                            <th className="px-3 py-2 font-black" rowSpan={2}>Evaluate Item</th>
                            <th className="px-2 py-2 font-black text-center w-16" rowSpan={2}>Weight</th>
                            <th className="px-2 py-2 font-black text-center w-20" rowSpan={2}>Target</th>
                            <th className="px-2 py-1.5 font-black text-center bg-slate-100 text-slate-500" colSpan={2}>Self (reference)</th>
                            <th className="px-2 py-1.5 font-black text-center bg-blue-50 text-blue-700" colSpan={2}>PM (official)</th>
                            <th className="px-2 py-2 font-black text-center w-20" rowSpan={2}>Gap</th>
                          </tr>
                          <tr>
                            <th className="px-2 py-2 font-black text-center w-24 bg-slate-100">Actual</th>
                            <th className="px-2 py-2 font-black text-center w-20 bg-slate-100">Score</th>
                            <th className="px-2 py-2 font-black text-center w-24 bg-blue-50">Actual</th>
                            <th className="px-2 py-2 font-black text-center w-20 bg-blue-50">Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...groups.entries()].map(([main, rows]) => rows.map((row, localIndex) => {
                            const index = items.findIndex(item => item.itemId === row.itemId)
                            const sScore = row.selfScore === '' || row.selfScore == null ? null : Number(row.selfScore)
                            const pScore = row.score === '' || row.score == null ? null : Number(row.score)
                            const gap = (sScore != null && pScore != null) ? Math.round((pScore - sScore) * 100) / 100 : null
                            const gapColor = gap == null ? 'text-slate-300' : Math.abs(gap) < 0.01 ? 'text-slate-400' : Math.abs(gap) >= 2 ? (gap > 0 ? 'text-emerald-600' : 'text-red-600') : (gap > 0 ? 'text-emerald-500' : 'text-amber-600')
                            return (
                              <tr key={row.itemId} className="border-t border-slate-100 hover:bg-slate-50/60 transition">
                                {localIndex === 0 && (
                                  <td rowSpan={rows.length} className="px-3 py-3 align-top border-r border-slate-100 bg-slate-50/40">
                                    <div className="font-black text-slate-900">{main}</div>
                                    <div className="text-[.68rem] text-slate-500 mt-0.5">{rows.length} items</div>
                                  </td>
                                )}
                                <td className="px-3 py-3">
                                  <div className="font-black text-slate-900">{row.evaluateItem}</div>
                                  <div className="text-[.65rem] text-slate-400 font-mono mt-0.5">{row.itemId}</div>
                                </td>
                                <td className="px-2 py-3 text-center">
                                  <input className="w-16 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-center text-xs font-bold" value={row.weight} readOnly />
                                </td>
                                <td className="px-2 py-3 text-center">
                                  <input className="w-20 rounded border border-slate-200 px-2 py-1 text-center text-xs outline-none focus:border-[#2447d8]" type="number" value={row.target} onChange={event => updateItem(index, { target: event.target.value })} />
                                </td>
                                {/* Self — read-only reference from the employee's self-assessment */}
                                <td className="px-2 py-3 text-center bg-slate-50/40">
                                  <input className="w-20 rounded border border-slate-200 bg-slate-100 px-2 py-1 text-center text-xs text-slate-600 cursor-not-allowed" type="number" value={row.selfActual ?? ''} placeholder="—" readOnly tabIndex={-1} />
                                </td>
                                <td className="px-2 py-3 text-center bg-slate-50/40">
                                  <input className="w-16 rounded border border-slate-200 bg-slate-100 px-2 py-1 text-center text-xs font-black text-slate-600 cursor-not-allowed" type="number" value={row.selfScore ?? ''} placeholder="( )" readOnly tabIndex={-1} />
                                </td>
                                {/* PM — official */}
                                <td className="px-2 py-3 text-center bg-blue-50/30">
                                  <input className="w-20 rounded border border-slate-200 px-2 py-1 text-center text-xs outline-none focus:border-[#2447d8] disabled:bg-slate-100 disabled:cursor-not-allowed" type="number" value={row.actual} placeholder="—" disabled={locked} onChange={event => updateItem(index, { actual: event.target.value })} />
                                </td>
                                <td className="px-2 py-3 text-center bg-blue-50/30">
                                  <input className="w-16 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-center text-xs font-black text-blue-800 cursor-not-allowed" type="number" value={row.score} placeholder="( )" readOnly tabIndex={-1} />
                                </td>
                                {/* Gap PM − Self */}
                                <td className="px-2 py-3 text-center">
                                  <span className={`text-xs font-black ${gapColor}`}>{gap == null ? '—' : (gap > 0 ? '+' : '') + gap}</span>
                                </td>
                              </tr>
                            )
                          }))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                ) : (
                  <section className="rounded border-2 border-dashed border-[#e4e7ec] bg-slate-50/50 p-12 text-center">
                    <ClipboardList size={36} className="mx-auto mb-3 text-slate-300" />
                    <div className="font-black text-slate-600 text-sm">No KPI items for this selection</div>
                    <div className="text-xs text-slate-400 mt-1">Select an <b>employee</b> and <b>period</b> — items load automatically</div>
                  </section>
                )}

                {/* Save Row — HR style */}
                <section className="rounded border border-[#e4e7ec] bg-white p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-black uppercase text-slate-500">Save Evaluation</div>
                    {locked && <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[.68rem] font-black text-red-700 border border-red-200"><Lock size={12} /> Finalized — locked for {period}</span>}
                  </div>
                  <div className="flex flex-wrap items-end gap-3">
                    <KpiField label="Remark (optional)">
                      <input className={KPI_INPUT_CLS} value={remark} onChange={event => setRemark(event.target.value)} placeholder="Add remark, performance note, etc." disabled={locked} />
                    </KpiField>
                    <button onClick={saveAll} disabled={locked || saving}
                      className="inline-flex items-center gap-1.5 rounded bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    ><Save size={14} className={saving ? 'animate-pulse' : ''} /> {saving ? 'Saving…' : 'Save Evaluation'}</button>
                    {locked
                      ? <button onClick={unlockPeriod} className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"><Unlock size={14} /> Unlock</button>
                      : <button onClick={finalizePeriod} className="inline-flex items-center gap-1.5 rounded border border-red-200 bg-white px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition"><Lock size={14} /> Finalize</button>
                    }
                  </div>
                  {saveMsg && (
                    <div className={`mt-3 flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-xs font-bold ${saveMsg.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                      {saveMsg.ok ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                      <span>{saveMsg.ok ? '✓ บันทึกสำเร็จ — ' : 'ยังบันทึกไม่ได้ — '}{saveMsg.text}</span>
                    </div>
                  )}
                </section>

                {items.length > 0 && <SummaryScore totalScore={totalScore} totalWeight={totalWeight} scoredCount={scoredCount} items={items} period={period} />}
                </>)}
              </div>
            )}

            {page === 'trend' && <EmployeeTrend employees={employees} periods={availablePeriods} periodDetails={periodDetails} />}
            {page === 'summary' && <ProjectSummary employees={employees} itemsByEmployee={itemsByEmployee} period={period} periods={availablePeriods} periodDetails={periodDetails} currentMonth={currentMonth} setShowWork={setShowWork} setReEval={setReEval} />}

            <div className="px-4 py-6 sm:px-6 lg:px-8 text-center text-xs font-bold text-slate-400">
              © 2026 Air Connect Engineering (Thailand) Co., Ltd.<br />
              Designed by Peerapol Piemsri · Consultant Narong Saemaphakdee
            </div>
          </div>
        </main>
      </div>

      {showManage && <ManageModal employee={employee} employees={employees} employeeId={employeeId} setEmployeeId={setEmployeeId} items={items} updateItem={updateItem} loadItems={loadItems} period={period} onClose={() => setShowManage(false)} />}
      {showAddLib && <AddLibraryModal onClose={() => setShowAddLib(false)} />}
      {showWork && <WorkingModal onClose={() => setShowWork(false)} />}
      {reEval && <ReEvalModal data={reEval} onClose={() => setReEval(null)} />}
    </div>
  )
}

function SummaryScore({ totalScore, totalWeight, scoredCount, items, period }) {
  const grouped = [...groupBy(items, row => row.mainEvaluate).entries()].map(([main, rows]) => {
    const max = rows.reduce((sum, row) => sum + Number(row.weight || 0), 0)
    const actual = rows.reduce((sum, row) => sum + Number(row.score || autoScore(row.weight, row.target, row.actual) || 0), 0)
    return { main, max, actual, pct: max ? Math.round((actual / max) * 100) : 0 }
  }).sort((a, b) => b.max - a.max)

  const grade = calcGrade(totalScore)
  const gradeColor = totalScore >= 90 ? '#16a34a' : totalScore >= 80 ? '#22c55e' : totalScore >= 70 ? '#ca8a04' : '#dc2626'

  return (
    <section className="overflow-hidden rounded border border-[#e4e7ec] bg-white">
      <div className="flex items-center justify-between border-b border-[#edf0f5] px-4 py-3">
        <div className="font-black text-[#1d2939]">Summary Score (by Main Evaluate)</div>
        <span className="text-[.72rem] font-bold text-slate-500">Period: <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[.7rem] text-slate-700">{period}</code></span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)_minmax(0,1.05fr)] gap-5 p-5 items-stretch">
        {/* Score Box — HR style */}
        <div className="rounded border border-[#e4e7ec] bg-white p-5 flex flex-col items-center justify-center text-center">
          <div className="text-xs font-black uppercase text-slate-500">Total Score</div>
          <div className="mt-2 flex items-end gap-2">
            <div className="text-5xl font-black leading-none" style={{ color: gradeColor }}>{totalScore.toFixed(1)}</div>
            <div className="pb-1 text-lg font-black text-slate-400">/{totalWeight.toFixed(0)}</div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Grade</span>
            <span className="rounded px-3 py-1 text-base font-black text-white" style={{ background: gradeColor }}>{grade}</span>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full" style={{ width: `${Math.min((totalScore / Math.max(totalWeight, 1)) * 100, 100)}%`, background: gradeColor }} />
          </div>
          <div className="w-full mt-4 pt-4 border-t border-slate-100 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs">Max (Total Weight)</span>
              <code className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">{totalWeight.toFixed(1)}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs">Coverage</span>
              <code className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">{scoredCount} / {items.length}</code>
            </div>
          </div>
        </div>

        {/* Spider — Self vs PM (by Main Evaluate) */}
        <KpiCompareRadar groups={groupBy(items, row => row.mainEvaluate)} />

        {/* Achievement (%) per Main Evaluate */}
        <div className="rounded border border-[#e4e7ec] bg-white p-5 flex flex-col justify-center">
          <div className="text-xs font-black uppercase text-slate-500 mb-4">Achievement (%) per Main Evaluate</div>
          <div className="space-y-2.5">
            {grouped.map(row => {
              const color = row.pct >= 80 ? 'bg-emerald-500' : row.pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
              return (
                <div key={row.main}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[.78rem] font-bold text-slate-700">{row.main}</span>
                    <code className="text-[.7rem] font-black text-slate-500">{row.actual.toFixed(1)} / {row.max} · {row.pct}%</code>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full ${color} transition-all`} style={{ width: `${Math.min(row.pct, 100)}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

// Rollup score for director-type roles — average of their project-group team
function RollupScoreCard({ employee, period }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!period) return
    setLoading(true)
    apiFetch(`/api/kpi/summary?period=${encodeURIComponent(period)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [period])

  const group = (data?.projects || []).find(p => (p.projectCode || '') === (employee?.projectCode || ''))
  const members = (group?.employees || []).filter(e => (e.name || '').trim().toUpperCase() !== (employee?.name || '').trim().toUpperCase())
  const evaluated = members.filter(m => m.evaluated)
  const avg = evaluated.length ? evaluated.reduce((s, m) => s + Number(m.score || 0), 0) / evaluated.length : 0
  const grade = calcGrade(avg)
  const gradeColor = avg >= 90 ? '#16a34a' : avg >= 80 ? '#22c55e' : avg >= 70 ? '#ca8a04' : '#dc2626'
  const ranked = [...members].sort((a, b) => Number(b.score || 0) - Number(a.score || 0))

  return (
    <section className="rounded border border-[#e4e7ec] bg-white">
      <div className="flex items-center justify-between border-b border-[#edf0f5] px-4 py-3">
        <div className="flex items-center gap-2">
          <LayoutDashboard size={18} className="text-[#2447d8]" />
          <div className="font-black text-[#1d2939]">Rollup Score — {employee?.position}</div>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[.66rem] font-black text-blue-700">{employee?.projectName || employee?.projectCode}</span>
        </div>
        <span className="text-[.72rem] font-bold text-slate-500">Period {period}</span>
      </div>
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-bold">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 p-5">
          <div className="rounded border border-[#e4e7ec] bg-white p-5 flex flex-col items-center text-center">
            <div className="text-xs font-black uppercase text-slate-500">Score = Team Average</div>
            <div className="mt-2 flex items-end gap-2">
              <div className="text-5xl font-black leading-none" style={{ color: gradeColor }}>{avg.toFixed(1)}</div>
              <div className="pb-1 text-lg font-black text-slate-400">/100</div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Grade</span>
              <span className="rounded px-3 py-1 text-base font-black text-white" style={{ background: gradeColor }}>{grade}</span>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full" style={{ width: `${Math.min(avg, 100)}%`, background: gradeColor }} />
            </div>
            <div className="mt-3 text-[.72rem] font-bold text-slate-500">{evaluated.length}/{members.length} team members evaluated</div>
          </div>
          <div className="rounded border border-[#e4e7ec] bg-white p-5">
            <div className="text-xs font-black uppercase text-slate-500 mb-3">Team — {group?.projectName || employee?.projectCode || '—'}</div>
            {ranked.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-sm">No team members found in this group</div>
            ) : (
              <div className="space-y-1.5">
                {ranked.map((m, i) => {
                  const col = m.score >= 80 ? '#16a34a' : m.score >= 60 ? '#ca8a04' : '#dc2626'
                  return (
                    <div key={m.employeeCode || m.name} className="flex items-center justify-between gap-2 rounded px-2 py-1.5 hover:bg-slate-50">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 text-center text-[.7rem] font-black text-slate-400">{i + 1}</span>
                        <div className="min-w-0">
                          <div className="truncate text-[.8rem] font-black text-slate-900">{m.name}</div>
                          <div className="truncate text-[.64rem] text-slate-400">{m.position || '—'}</div>
                        </div>
                      </div>
                      {m.evaluated
                        ? <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[.68rem] font-black" style={{ color: col }}>{Number(m.score || 0).toFixed(1)}</span>
                        : <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[.62rem] font-black text-amber-700">Pending</span>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function MonthlyTeamStatus({ period, employees, currentEmployeeId, refreshKey, onSelect }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)   // collapsed (▶) by default
  const [filter, setFilter] = useState('all')   // all | pending | done
  const [q, setQ] = useState('')

  useEffect(() => {
    if (!period) return
    setLoading(true)
    apiFetch(`/api/kpi/summary?period=${encodeURIComponent(period)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [period, refreshKey])

  const flat = useMemo(() => {
    const rows = []
    for (const p of (data?.projects || [])) {
      for (const e of (p.employees || [])) rows.push({ ...e, projectCode: p.projectCode })
    }
    return rows.sort((a, b) => Number(a.evaluated) - Number(b.evaluated) || a.name.localeCompare(b.name))
  }, [data])

  const total = flat.length
  const done = flat.filter(e => e.evaluated).length
  const pct = total ? Math.round((done / total) * 100) : 0

  // Resolve a summary employee to the selector's synthetic id (match by code, then name)
  const idFor = (e) => {
    const byCode = e.employeeCode && employees.find(x => (x.employeeCode || '').toUpperCase() === String(e.employeeCode).toUpperCase())
    if (byCode) return byCode.id
    return employees.find(x => (x.name || '').trim().toUpperCase() === (e.name || '').trim().toUpperCase())?.id
  }

  const visible = flat.filter(e => {
    if (filter === 'pending' && e.evaluated) return false
    if (filter === 'done' && !e.evaluated) return false
    if (q.trim()) {
      const s = q.toLowerCase()
      return (e.name || '').toLowerCase().includes(s) || (e.employeeCode || '').toLowerCase().includes(s) || (e.projectCode || '').toLowerCase().includes(s)
    }
    return true
  })

  return (
    <section className="rounded border border-[#e4e7ec] bg-white">
      <button onClick={() => setOpen(o => !o)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <div className="flex items-center gap-3">
          {open ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
          <span className="font-black text-[#1d2939]">Monthly Team Status</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[.68rem] font-black text-slate-500">{period}</span>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[.68rem] font-black ${pct >= 100 ? 'bg-emerald-50 text-emerald-700' : pct > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{done}/{total} done · {pct}%</span>
      </button>
      {open && (
        <div className="border-t border-[#edf0f5] p-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 mb-3">
            <div className="h-full rounded-full bg-[#2447d8] transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name / code / project..."
                   className="flex-1 min-w-[200px] rounded border border-slate-200 px-3 py-1.5 text-xs font-semibold outline-none focus:border-[#2447d8]" />
            <div className="inline-flex rounded border border-slate-200 bg-white p-0.5">
              {[{ id: 'all', label: 'All' }, { id: 'pending', label: 'Pending' }, { id: 'done', label: 'Done' }].map(t => (
                <button key={t.id} onClick={() => setFilter(t.id)}
                        className={`px-2.5 py-1 rounded text-[.7rem] font-black transition ${filter === t.id ? 'bg-[#2447d8] text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{t.label}</button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="py-8 text-center text-slate-400 text-sm font-bold">Loading…</div>
          ) : visible.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">No employees for this filter</div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-[320px] overflow-y-auto pr-1">
              {visible.map(e => {
                const id = idFor(e)
                const active = id === currentEmployeeId
                return (
                  <button key={e.employeeCode || e.name} onClick={() => id && onSelect(id)} disabled={!id}
                          className={`flex items-center justify-between gap-2 rounded border px-3 py-2 text-left transition ${active ? 'border-[#2447d8] bg-blue-50/40' : 'border-slate-200 hover:border-[#2447d8]'} ${!id ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <div className="min-w-0">
                      <div className="truncate text-[.8rem] font-black text-slate-900">{e.name}</div>
                      <div className="truncate text-[.66rem] text-slate-400">{e.projectCode} · {e.position || '—'}</div>
                    </div>
                    {e.evaluated
                      ? <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[.62rem] font-black text-emerald-700">✓ {Number(e.score || 0).toFixed(0)}</span>
                      : <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[.62rem] font-black text-amber-700">Pending</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

// Compact, collapsible trend of the currently-selected employee — embedded in the Evaluation tab
// Spider/radar chart comparing Self (reference) vs PM (official) achievement % per Main-Evaluate category.
function KpiCompareRadar({ groups }) {
  const num = v => (v === '' || v == null ? null : Number(v))
  const cats = [...groups.entries()].map(([main, rows]) => {
    const w = rows.reduce((s, r) => s + Number(r.weight || 0), 0)
    const pmSum = rows.reduce((s, r) => s + (num(r.score) || 0), 0)
    const selfSum = rows.reduce((s, r) => s + (num(r.selfScore) || 0), 0)
    return {
      main,
      pm: w ? Math.round(pmSum / w * 1000) / 10 : 0,
      self: w ? Math.round(selfSum / w * 1000) / 10 : 0,
      hasPm: rows.some(r => num(r.score) != null),
      hasSelf: rows.some(r => num(r.selfScore) != null),
    }
  })
  const n = cats.length
  if (n < 3) return null  // a radar needs at least 3 axes
  const anyPm = cats.some(c => c.hasPm)
  const anySelf = cats.some(c => c.hasSelf)
  if (!anyPm && !anySelf) return null

  const VW = 340, VH = 290, cx = VW / 2, cy = 142, R = 88
  const pt = (i, frac) => {
    const ang = -Math.PI / 2 + i * 2 * Math.PI / n
    return [cx + R * frac * Math.cos(ang), cy + R * frac * Math.sin(ang)]
  }
  const ptsFor = key => cats.map((c, i) => {
    const [x, y] = pt(i, Math.max(0, Math.min((c[key] || 0) / 100, 1)))
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  const ring = frac => cats.map((_, i) => { const [x, y] = pt(i, frac); return `${x.toFixed(1)},${y.toFixed(1)}` }).join(' ')
  const avg = key => {
    const vals = cats.filter(c => (key === 'pm' ? c.hasPm : c.hasSelf)).map(c => c[key])
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : null
  }
  const wrap = (label, width = 15, max = 2) => {
    const words = String(label).split(' ')
    const lines = []; let cur = ''
    for (const w of words) {
      if (cur && (cur + ' ' + w).length > width) { lines.push(cur); cur = w; if (lines.length === max) break }
      else cur = cur ? cur + ' ' + w : w
    }
    if (cur && lines.length < max) lines.push(cur)
    if (!lines.length) lines.push(String(label))
    if (String(label).length > lines.join(' ').length) lines[lines.length - 1] = lines[lines.length - 1].replace(/.$/, '…')
    return lines
  }

  return (
    <div className="rounded border border-[#e4e7ec] bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="text-xs font-black uppercase text-slate-500">Self vs PM — Spider</div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[.64rem] font-black text-blue-700"><span className="inline-block w-4 h-[2px] rounded bg-[#2447d8]" />PM (official){avg('pm') != null ? ` · ${avg('pm')}%` : ''}</span>
          <span className="flex items-center gap-1.5 text-[.64rem] font-black text-amber-600"><span className="inline-block w-4 border-t-2 border-dashed border-amber-500" />Self (reference){avg('self') != null ? ` · ${avg('self')}%` : ''}</span>
        </div>
      </div>
      <div className="flex flex-col items-center">
        {!anySelf && <div className="mb-2 text-[.68rem] font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded px-2.5 py-1">No self-assessment submitted — showing PM only.</div>}
        {!anyPm && <div className="mb-2 text-[.68rem] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded px-2.5 py-1">No PM evaluation yet — showing Self only.</div>}
        <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: '100%', maxWidth: 420 }}>
          {[0.25, 0.5, 0.75, 1].map((f, k) => (
            <polygon key={k} points={ring(f)} fill="none" stroke={f === 1 ? '#cbd5e1' : '#eef2f6'} strokeWidth={f === 1 ? 1 : 0.8} />
          ))}
          {[25, 50, 75].map((v, k) => { const [, y] = pt(0, v / 100); return <text key={k} x={cx + 3} y={y + 3} fontSize="7" fill="#cbd5e1" textAnchor="start">{v}</text> })}
          {cats.map((_, i) => { const [x, y] = pt(i, 1); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#e2e8f0" strokeWidth="0.6" /> })}
          {anySelf && <polygon points={ptsFor('self')} fill="rgba(245,158,11,0.10)" stroke="#f59e0b" strokeWidth="1.6" strokeDasharray="4 3" />}
          {anyPm && <polygon points={ptsFor('pm')} fill="rgba(36,71,216,0.15)" stroke="#2447d8" strokeWidth="2" />}
          {anySelf && cats.map((c, i) => { const [x, y] = pt(i, Math.max(0, Math.min(c.self / 100, 1))); return <circle key={i} cx={x} cy={y} r="2.2" fill="#f59e0b" stroke="#fff" strokeWidth="0.8" /> })}
          {anyPm && cats.map((c, i) => { const [x, y] = pt(i, Math.max(0, Math.min(c.pm / 100, 1))); return <circle key={i} cx={x} cy={y} r="2.6" fill="#2447d8" stroke="#fff" strokeWidth="0.8" /> })}
          {cats.map((c, i) => {
            const [x, y] = pt(i, 1.17)
            const anchor = x < cx - 6 ? 'end' : x > cx + 6 ? 'start' : 'middle'
            const lines = wrap(c.main)
            const y0 = y - (lines.length - 1) * 4.5
            return (
              <text key={i} x={x} y={y0} fontSize="8.5" fontWeight="700" fill="#64748b" textAnchor={anchor} dominantBaseline="middle">
                <title>{c.main}{anyPm ? ` · PM ${c.pm}%` : ''}{anySelf ? ` · Self ${c.self}%` : ''}</title>
                {lines.map((ln, k) => <tspan key={k} x={x} dy={k === 0 ? 0 : 9}>{ln}</tspan>)}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

function EmployeeTrendMini({ employee }) {
  const [open, setOpen] = useState(false)
  const [evals, setEvals] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!employee?.name) { setEvals([]); return }
    setLoading(true)
    apiFetch(`/api/kpi/evaluations?employee_name=${encodeURIComponent(employee.name)}`)
      .then(r => r.ok ? r.json() : { evaluations: [] })
      .then(d => { setEvals(d.evaluations || []); setLoading(false) })
      .catch(() => { setEvals([]); setLoading(false) })
  }, [employee?.name])

  // Fixed window: last 6 calendar months ending at the current month (gaps shown for months with no data)
  const series = useMemo(() => {
    const byPeriod = new Map()
    evals.filter(e => (e.raterType || 'PM') !== 'SELF')
      .forEach(e => byPeriod.set(e.period, (byPeriod.get(e.period) || 0) + Number(e.score || 0)))
    const now = new Date()
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
      months.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`)
    }
    return months.map(p => ({ period: p, has: byPeriod.has(p), score: byPeriod.has(p) ? Math.round(byPeriod.get(p) * 10) / 10 : null }))
  }, [evals])

  const evaluated = series.filter(s => s.has)
  const avg = evaluated.length ? evaluated.reduce((a, b) => a + b.score, 0) / evaluated.length : 0
  const best = evaluated.length ? Math.max(...evaluated.map(s => s.score)) : 0
  const latest = [...evaluated].reverse()[0]
  const latestGrade = latest ? calcGrade(latest.score) : '—'

  const W = 520, H = 120, padL = 26, padR = 14, padT = 18, padB = 22
  const maxScore = Math.max(...evaluated.map(s => s.score), 100)
  const innerW = W - padL - padR, innerH = H - padT - padB
  const xAt = i => padL + (i / (series.length - 1)) * innerW
  const yAt = v => padT + innerH - (Math.min(v, maxScore) / maxScore) * innerH
  const pts = series.map((s, i) => ({ ...s, cx: xAt(i), cy: s.has ? yAt(s.score) : null }))
  const line = pts.filter(p => p.has)
  const path = line.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.cx.toFixed(1)} ${p.cy.toFixed(1)}`).join(' ')

  return (
    <section className="rounded border border-[#e4e7ec] bg-white">
      <button onClick={() => setOpen(o => !o)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <div className="flex items-center gap-3">
          {open ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
          <TrendingUp size={16} className="text-slate-400" />
          <span className="font-black text-[#1d2939]">Performance History</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[.66rem] font-black text-slate-500">{employee?.name || '—'}</span>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[.66rem] font-black text-blue-700">Avg {avg.toFixed(1)}</span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[.66rem] font-black text-emerald-700">Best {best.toFixed(1)}</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[.66rem] font-black text-slate-600">Grade {latestGrade}</span>
        </div>
      </button>
      {open && (
        <div className="border-t border-[#edf0f5] p-4">
          {loading ? (
            <div className="py-6 text-center text-slate-400 text-sm font-bold">Loading…</div>
          ) : evaluated.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-sm">No evaluation history in the last 6 months</div>
          ) : (
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 120 }} preserveAspectRatio="none">
              {/* grid + Y labels */}
              {[0, 0.5, 1].map(g => {
                const gy = padT + innerH - g * innerH
                return (
                  <g key={g}>
                    <line x1={padL} y1={gy} x2={W - padR} y2={gy} stroke="#eef0f4" strokeDasharray="3 3" />
                    <text x={padL - 5} y={gy + 3} textAnchor="end" fontSize="8" fill="#cbd5e1" fontWeight="700">{Math.round(g * maxScore)}</text>
                  </g>
                )
              })}
              {/* trend line (connects evaluated months) */}
              {path && <path d={path} fill="none" stroke="#2447d8" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
              {pts.map(p => (
                <g key={p.period}>
                  {p.has
                    ? <>
                        <circle cx={p.cx} cy={p.cy} r={3.5} fill="#fff" stroke={p.score >= 80 ? '#16a34a' : p.score >= 60 ? '#ca8a04' : '#dc2626'} strokeWidth={2.5} />
                        <text x={p.cx} y={p.cy - 7} textAnchor="middle" fontSize="9" fill="#1d2939" fontWeight="900">{p.score.toFixed(0)}</text>
                      </>
                    : <circle cx={p.cx} cy={padT + innerH} r={2} fill="#e2e8f0" />}
                  <text x={p.cx} y={H - 6} textAnchor="middle" fontSize="8.5" fill={p.has ? '#64748b' : '#cbd5e1'} fontWeight="700">{p.period.slice(2)}</text>
                </g>
              ))}
            </svg>
          )}
        </div>
      )}
    </section>
  )
}

function EmployeeTrend({ employees, periods = SOURCE_PERIODS, periodDetails = [] }) {
  const [employeeId, setEmployeeId] = useState(employees[0]?.id || '')
  const months = 6  // trend window fixed at 6 months
  const [allEvals, setAllEvals] = useState([])
  const [loading, setLoading] = useState(false)

  const emp = employees.find(item => item.id === Number(employeeId))

  // Fetch all evaluations for this employee from DB
  useEffect(() => {
    if (!emp?.name) return
    setLoading(true)
    apiFetch(`/api/kpi/evaluations?employee_name=${encodeURIComponent(emp.name)}`)
      .then(r => r.ok ? r.json() : { evaluations: [] })
      .then(d => { setAllEvals(d.evaluations || []); setLoading(false) })
      .catch(() => { setAllEvals([]); setLoading(false) })
  }, [emp?.name])

  // Build per-period score totals — split PM (official) vs Self (reference)
  const periodWindow = periods.slice(0, Number(months))
  const isSelfEval = e => (e.raterType || '') === 'SELF'
  const seriesFor = wantSelf => periodWindow.map(prd => {
    const evs = allEvals.filter(e => e.period === prd && (wantSelf ? isSelfEval(e) : !isSelfEval(e)))
    const score = evs.reduce((sum, e) => sum + Number(e.score || 0), 0)
    return { period: prd, score, itemCount: evs.length, grade: score > 0 ? calcGrade(score) : '-', evaluated: evs.length > 0 }
  })
  const rows = seriesFor(false)       // PM / official
  const selfRows = seriesFor(true)    // Self / reference
  const latest = rows[0]
  const evaluatedRows = rows.filter(row => row.evaluated)
  const average = evaluatedRows.length ? evaluatedRows.reduce((sum, row) => sum + row.score, 0) / evaluatedRows.length : 0
  const best = evaluatedRows.length ? Math.max(...evaluatedRows.map(row => row.score)) : 0
  const latestEvaluatedPeriod = evaluatedRows[0]?.period

  // Latest breakdown by Main Evaluate (from DB data)
  const breakdownMap = new Map()
  allEvals
    .filter(row => row.period === latestEvaluatedPeriod)
    .forEach(row => {
      const key = row.mainEvaluate || 'Others'
      if (!breakdownMap.has(key)) breakdownMap.set(key, { label: key, score: 0, weight: 0 })
      const item = breakdownMap.get(key)
      item.score += Number(row.score || 0)
      item.weight += Number(row.weight || 0)
    })
  const breakdown = [...breakdownMap.values()].sort((a, b) => b.weight - a.weight)

  // SVG line-chart geometry for Monthly Score Trend (oldest → latest)
  const TREND = (() => {
    const data = rows.slice().reverse()
    const selfData = selfRows.slice().reverse()
    const W = 520, H = 200, padL = 34, padR = 14, padT = 18, padB = 26
    const maxScore = Math.max(...data.map(r => r.score || 0), ...selfData.map(r => r.score || 0), 100)
    const innerW = W - padL - padR, innerH = H - padT - padB
    const xAt = i => padL + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW)
    const yAt = v => padT + innerH - (Math.min(Math.max(v, 0), maxScore) / maxScore) * innerH
    const buildLine = series => {
      const pts = series.map((r, i) => ({ ...r, cx: xAt(i), cy: yAt(r.score) }))
      const evalPts = pts.filter(p => p.evaluated)
      const path = evalPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.cx.toFixed(1)} ${p.cy.toFixed(1)}`).join(' ')
      return { points: pts, path, has: evalPts.length > 1 }
    }
    const pm = buildLine(data)
    const self = buildLine(selfData)
    const gridYs = [0, 0.25, 0.5, 0.75, 1].map(g => ({ key: g, gy: padT + innerH - g * innerH, label: Math.round(g * maxScore) }))
    return {
      W, H, gridYs,
      points: pm.points, linePath: pm.path, hasLine: pm.has,
      selfPoints: self.points, selfPath: self.path, hasSelf: self.points.some(p => p.evaluated),
    }
  })()

  return (
    <div className="flex flex-col gap-5 p-4 md:p-7">
      {/* Title — HR style */}
      <section className="flex shrink-0 flex-col gap-3 xl:flex-row xl:items-center">
        <div className="min-w-0 xl:mr-auto">
          <div className="text-[1.45rem] font-black leading-tight text-[#1d2939]">Employee Monthly Trend</div>
          <div className="mt-1 text-[.82rem] text-slate-500">Historical performance across periods · {emp?.name || '—'} · {emp?.position || '—'}</div>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <KpiField label="Employee">
            <select className={KPI_INPUT_CLS} value={employeeId} onChange={event => setEmployeeId(event.target.value)}>
              {employees.map(item => <option key={item.id} value={item.id}>{item.name} — {item.position}</option>)}
            </select>
          </KpiField>
        </div>
      </section>

      {/* Metric cards */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiMetric label="Average Score"    value={average.toFixed(1)}          color="#2447d8" icon={Gauge} />
        <KpiMetric label="Best Score"       value={best.toFixed(1)}             color="#16a34a" icon={Award} />
        <KpiMetric label="Latest Grade"     value={evaluatedRows[0]?.grade || '—'} color="#6d3f8f" icon={Target} />
        <KpiMetric label="Evaluated Months" value={`${evaluatedRows.length}/${rows.length}`} color="#dc2626" icon={CalendarDays} />
      </section>

      {loading && <div className="rounded border border-[#e4e7ec] bg-white p-12 text-center text-slate-400 font-bold">Loading trend…</div>}

      {!loading && (
        <>
          {/* Trend chart + Latest Breakdown */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Monthly Score Trend (SVG line chart) */}
            <section className="rounded border border-[#e4e7ec] bg-white p-5">
              <div className="flex items-start justify-between mb-3 gap-3">
                <div>
                  <div className="text-xs font-black uppercase text-slate-500">Monthly Score Trend</div>
                  <div className="mt-1 text-[.7rem] text-slate-500">Score total per period (oldest → latest)</div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <span className="flex items-center gap-1.5 text-[.64rem] font-black text-slate-700"><span className="inline-block w-4 h-[2px] rounded bg-[#2447d8]" />PM (official)</span>
                  <span className="flex items-center gap-1.5 text-[.64rem] font-black text-amber-600"><span className="inline-block w-4 border-t-2 border-dashed border-amber-500" />Self (reference)</span>
                </div>
              </div>
              {evaluatedRows.length === 0 && !TREND.hasSelf ? (
                <div className="text-center text-slate-400 py-12 text-sm">No evaluations yet for this employee</div>
              ) : (
                <svg viewBox={`0 0 ${TREND.W} ${TREND.H}`} className="w-full" style={{ height: 200 }} preserveAspectRatio="none">
                  {/* grid lines + Y-axis labels */}
                  {TREND.gridYs.map(g => (
                    <g key={g.key}>
                      <line x1={34} y1={g.gy} x2={TREND.W - 14} y2={g.gy} stroke="#eef0f4" strokeDasharray="3 3" />
                      <text x={28} y={g.gy + 3} textAnchor="end" fontSize="9" fill="#94a3b8" fontWeight="700">{g.label}</text>
                    </g>
                  ))}
                  {/* Self line (dashed, drawn under PM) */}
                  {TREND.hasSelf && <path d={TREND.selfPath} fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5 4" strokeLinejoin="round" strokeLinecap="round" />}
                  {TREND.selfPoints.filter(p => p.evaluated).map(p => (
                    <g key={'self' + p.period}>
                      <circle cx={p.cx} cy={p.cy} r={3} fill="#fff" stroke="#f59e0b" strokeWidth={2} />
                      <text x={p.cx} y={p.cy + 15} textAnchor="middle" fontSize="8" fill="#b45309" fontWeight="800">{p.score.toFixed(0)}</text>
                    </g>
                  ))}
                  {/* PM line (official, on top) */}
                  {TREND.hasLine && <path d={TREND.linePath} fill="none" stroke="#2447d8" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
                  {TREND.points.map(p => {
                    const color = p.score >= 80 ? '#16a34a' : p.score >= 60 ? '#ca8a04' : p.score > 0 ? '#dc2626' : '#cbd5e1'
                    return (
                      <g key={p.period}>
                        <circle cx={p.cx} cy={p.cy} r={p.evaluated ? 4 : 3} fill="#fff" stroke={color} strokeWidth={p.evaluated ? 2.5 : 1.5} />
                        {p.evaluated && <text x={p.cx} y={p.cy - 9} textAnchor="middle" fontSize="9" fill="#1d2939" fontWeight="900">{p.score.toFixed(0)}</text>}
                        <text x={p.cx} y={TREND.H - 8} textAnchor="middle" fontSize="8.5" fill="#64748b" fontWeight="700">{p.period}</text>
                      </g>
                    )
                  })}
                </svg>
              )}
            </section>

            {/* Latest Breakdown */}
            <section className="rounded border border-[#e4e7ec] bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs font-black uppercase text-slate-500">Latest Breakdown</div>
                  <div className="mt-1 text-[.7rem] text-slate-500">By Main Evaluate · period {latestEvaluatedPeriod || '—'}</div>
                </div>
              </div>
              {breakdown.length === 0 ? (
                <div className="text-center text-slate-400 py-12 text-sm">No evaluations yet for this employee</div>
              ) : (
                <div className="space-y-2">
                  {breakdown.map(row => {
                    const pct = row.weight ? Math.round((row.score / row.weight) * 100) : 0
                    return (
                      <div key={row.label}>
                        <div className="flex items-center justify-between text-[.78rem] font-bold mb-1">
                          <span className="text-slate-800">{row.label}</span>
                          <code className="text-slate-500 text-[.72rem]">{row.score.toFixed(1)} / {row.weight}</code>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Monthly Detail Table — HR style */}
          <section className="min-h-0 overflow-hidden rounded border border-[#e4e7ec] bg-white">
            <div className="flex items-center justify-between border-b border-[#edf0f5] px-4 py-3">
              <div className="font-black text-[#1d2939]">Monthly Detail</div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-500">{rows.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[.76rem]">
                <thead className="bg-slate-50 text-left text-[.68rem] uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2.5 font-black">Period</th>
                    <th className="px-3 py-2.5 font-black text-center">Score</th>
                    <th className="px-3 py-2.5 font-black text-center">Grade</th>
                    <th className="px-3 py-2.5 font-black text-center">Items</th>
                    <th className="px-3 py-2.5 font-black text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.period} className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="px-3 py-3 font-black text-slate-900">{row.period}</td>
                      <td className="px-3 py-3 text-center font-black" style={{ color: row.score >= 80 ? '#16a34a' : row.score >= 60 ? '#ca8a04' : row.score > 0 ? '#dc2626' : '#94a3b8' }}>
                        {row.evaluated ? row.score.toFixed(1) : '—'}
                      </td>
                      <td className="px-3 py-3 text-center font-black">{row.grade}</td>
                      <td className="px-3 py-3 text-center text-slate-500">{row.itemCount || '—'}</td>
                      <td className="px-3 py-3 text-center">
                        {row.evaluated
                          ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-[.68rem] font-black text-emerald-700">Evaluated</span>
                          : <span className="rounded-full bg-slate-100 px-2 py-1 text-[.68rem] font-black text-slate-500">No data</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function ProjectSummary({ employees, itemsByEmployee, period, periods = SOURCE_PERIODS, periodDetails = [], currentMonth, setShowWork, setReEval }) {
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [userPicked, setUserPicked] = useState(false)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState({})
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')  // all | evaluated | pending
  const [showUnmatched, setShowUnmatched] = useState(false)

  // Executive view defaults to the latest COMPLETED month (skip current month — still in progress).
  // Stops auto-overriding once the user picks a period manually.
  useEffect(() => {
    if (userPicked) return
    const completed = periods.find(p => p !== currentMonth)
    setSelectedPeriod(completed || periods[0] || period || '')
  }, [period, periods, currentMonth, userPicked])

  function load(p) {
    setLoading(true)
    apiFetch(`/api/kpi/summary?period=${encodeURIComponent(p)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { if (selectedPeriod) load(selectedPeriod) }, [selectedPeriod])

  const projects = data?.projects || []
  const totalEmp = projects.reduce((sum, p) => sum + p.total, 0)
  const totalEval = projects.reduce((sum, p) => sum + p.evaluated, 0)
  const totalPending = Math.max(totalEmp - totalEval, 0)
  const totalPct = totalEmp ? Math.round((totalEval / totalEmp) * 100) : 0
  const overallAvgScore = projects.reduce((sum, p) => sum + (p.totalScore || 0), 0) / (totalEval || 1)

  // Executive aggregates — flatten evaluated employees across all projects
  const evaluatedEmployees = useMemo(() => {
    const rows = []
    for (const p of (data?.projects || [])) for (const e of (p.employees || [])) if (e.evaluated) rows.push({ ...e, projectCode: p.projectCode })
    return rows
  }, [data])
  const avgEvalScore = evaluatedEmployees.length ? evaluatedEmployees.reduce((s, e) => s + Number(e.score || 0), 0) / evaluatedEmployees.length : 0
  const avgColor = avgEvalScore >= 90 ? '#16a34a' : avgEvalScore >= 80 ? '#22c55e' : avgEvalScore >= 70 ? '#ca8a04' : '#dc2626'
  const gradeDist = useMemo(() => {
    const g = { A: 0, B: 0, C: 0, D: 0 }
    evaluatedEmployees.forEach(e => { g[calcGrade(Number(e.score || 0))]++ })
    return g
  }, [evaluatedEmployees])

  function toggleProject(code) { setCollapsed(c => ({ ...c, [code]: !c[code] })) }

  // Download the KPI Scorecard PDF for one employee + the selected period
  async function downloadScorecard(employeeName) {
    try {
      const r = await apiFetch(`/api/kpi/export/scorecard?employee_name=${encodeURIComponent(employeeName)}&period=${encodeURIComponent(selectedPeriod)}`)
      if (!r.ok) { const d = await r.json().catch(() => ({})); alert(d.detail || 'No evaluation to export'); return }
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `KPI_${employeeName}_${selectedPeriod}.pdf`.replace(/\s+/g, '_')
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch { alert('Export failed. Check connection.') }
  }

  return (
    <div className="flex flex-col gap-5 p-4 md:p-7">
      {/* Title — HR style */}
      <section className="flex shrink-0 flex-col gap-3 xl:flex-row xl:items-center">
        <div className="min-w-0 xl:mr-auto">
          <div className="text-[1.45rem] font-black leading-tight text-[#1d2939]">Executive KPI Summary</div>
          <div className="mt-1 text-[.82rem] text-slate-500">Company-wide performance: scores, grade mix, top &amp; bottom performers, and coverage per project.</div>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <KpiField label="Period">
            <select className={KPI_INPUT_CLS} value={selectedPeriod} onChange={e => { setUserPicked(true); setSelectedPeriod(e.target.value) }}>
              {periods.map((p) => {
                const d = periodDetails.find(x => x.period === p)
                const cnt = d?.count ? ` · ${d.count}` : ''
                const tag = p === currentMonth ? ' (this month)' : ''
                return <option key={p} value={p}>{p}{cnt}{tag}</option>
              })}
            </select>
          </KpiField>
          <button className="inline-flex items-center gap-1.5 rounded bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"><FileSpreadsheet size={14} /> Export Excel</button>
        </div>
      </section>

      {/* Search + Filter toolbar — HR style */}
      <section className="rounded border border-[#e4e7ec] bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search employee name / code / position..."
            className="flex-1 min-w-[260px] rounded border border-slate-200 px-3 py-2 text-xs font-semibold outline-none focus:border-[#2447d8]"
          />
          <div className="inline-flex rounded border border-slate-200 bg-white p-0.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'evaluated', label: 'Evaluated' },
              { id: 'pending', label: 'Pending' },
            ].map(t => (
              <button key={t.id} onClick={() => setStatusFilter(t.id)}
                className={`px-3 py-1.5 rounded text-xs font-black transition ${statusFilter === t.id ? 'bg-[#2447d8] text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                {t.label}
              </button>
            ))}
          </div>
          {search && (
            <button onClick={() => setSearch('')} className="text-xs font-bold text-slate-500 hover:text-slate-800">Clear</button>
          )}
        </div>
      </section>

      {/* Metric cards */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <KpiMetric label="Period"          value={selectedPeriod} color="#0891b2" icon={CalendarDays} />
        <KpiMetric label="Total Employees" value={totalEmp}        color="#2447d8" icon={Users} />
        <KpiMetric label="Evaluated"       value={totalEval}       color="#16a34a" icon={CheckCircle2} />
        <KpiMetric label="Pending"         value={totalPending}    color="#dc2626" icon={Clock} />
        <KpiMetric label="Coverage"        value={`${totalPct}%`}  color="#6d3f8f" icon={Percent} />
      </section>

      {loading && <div className="rounded border border-[#e4e7ec] bg-white p-12 text-center text-slate-400 font-bold">Loading…</div>}

      {!loading && data && (
        <>
          {/* Executive overview band */}
          <section className="grid grid-cols-1 gap-3 lg:grid-cols-[260px_1fr]">
            <div className="rounded border border-[#e4e7ec] bg-white p-5">
              <div className="text-xs font-black uppercase text-slate-500">Avg Score (evaluated)</div>
              <div className="mt-2 flex items-end gap-2">
                <div className="text-5xl font-black leading-none" style={{ color: avgColor }}>{avgEvalScore.toFixed(1)}</div>
                <div className="pb-1 text-base font-black text-slate-400">/100</div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Overall grade</span>
                <span className="rounded px-3 py-1 text-base font-black text-white" style={{ background: avgColor }}>{calcGrade(avgEvalScore)}</span>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full" style={{ width: `${Math.min(avgEvalScore, 100)}%`, background: avgColor }} />
              </div>
              <div className="mt-3 text-[.7rem] font-bold text-slate-500">{totalEval}/{totalEmp} evaluated · {totalPct}% coverage</div>
            </div>
            <div className="rounded border border-[#e4e7ec] bg-white p-5">
              <div className="text-xs font-black uppercase text-slate-500 mb-4">Grade Distribution</div>
              <div className="space-y-2.5">
                {[['A', '≥90', '#16a34a'], ['B', '80–89', '#22c55e'], ['C', '70–79', '#ca8a04'], ['D', '<70', '#dc2626']].map(([g, range, col]) => {
                  const n = gradeDist[g]
                  const pc = evaluatedEmployees.length ? Math.round(n / evaluatedEmployees.length * 100) : 0
                  return (
                    <div key={g}>
                      <div className="flex items-center justify-between mb-1 text-[.78rem] font-bold">
                        <span className="text-slate-700">Grade {g} <span className="font-normal text-slate-400">{range}</span></span>
                        <code className="text-[.7rem] font-black text-slate-500">{n} · {pc}%</code>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pc}%`, background: col }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* Unmatched warning — clickable */}
          {data.unmatched_count > 0 && (
            <button
              onClick={() => setShowUnmatched(true)}
              className="rounded border border-amber-300 bg-amber-50 p-3 text-xs font-bold text-amber-900 hover:bg-amber-100 transition text-left flex items-center justify-between gap-3"
            >
              <span className="inline-flex items-center gap-1.5"><AlertTriangle size={14} /> <b>{data.unmatched_count}</b> name(s) in KPI evaluations don't match the employees table (excluded from summary)</span>
              <span className="rounded bg-amber-600 px-2 py-1 text-[.66rem] font-black text-white">View List →</span>
            </button>
          )}
          {showUnmatched && (
            <KpiModalShell title="Unmatched Employees" subtitle={`${data.unmatched_count} names in KPI but not in employees table`} icon={AlertTriangle} onClose={() => setShowUnmatched(false)}>
              <div className="text-[.78rem] text-slate-600 mb-3">
                These names appear in KPI evaluations but cannot be linked to a current employee. Likely former staff, vendors, or outsource workers.
              </div>
              <div className="rounded border border-[#e4e7ec] max-h-[60vh] overflow-y-auto">
                <table className="w-full border-collapse text-[.76rem]">
                  <thead className="sticky top-0 bg-slate-50 text-left text-[.68rem] uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2.5 font-black">#</th>
                      <th className="px-3 py-2.5 font-black">Employee Name (in KPI)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.unmatched_names || []).map((n, i) => (
                      <tr key={n} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                        <td className="px-3 py-2 text-[.82rem] font-bold text-slate-700">{titleCase(n)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-[.7rem] text-slate-500 mt-3">
                ℹ To link these — add them as employees in HR Employees page, then their KPI history will auto-match by name.
              </div>
            </KpiModalShell>
          )}

          {/* Project overview strip — HR style */}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {projects.map(p => (
              <button key={p.projectCode}
                onClick={() => document.getElementById(`kpi-proj-${p.projectCode}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="rounded border border-[#e4e7ec] bg-white p-4 hover:border-[#2447d8] transition text-left">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-slate-900 truncate" title={p.projectCode}>{p.projectCode}</div>
                  <div className={`text-xs font-black ${p.pct >= 80 ? 'text-emerald-600' : p.pct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{p.pct}%</div>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full ${p.pct >= 80 ? 'bg-emerald-500' : p.pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${p.pct}%` }} />
                </div>
                <div className="mt-2 text-[.7rem] font-bold text-slate-500">{p.evaluated}/{p.total} evaluated</div>
                <div className="text-[.66rem] text-slate-400">Avg: {p.avgScore ? p.avgScore.toFixed(1) : '—'}</div>
              </button>
            ))}
          </section>

          {/* Per-Project tables — HR style */}
          {projects.map(p => (
            <section key={p.projectCode} id={`kpi-proj-${p.projectCode}`} className="min-h-0 overflow-hidden rounded border border-[#e4e7ec] bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0f5] px-4 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleProject(p.projectCode)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">
                      {collapsed[p.projectCode] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <span className="font-black text-[#1d2939]">{p.projectCode}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[.66rem] font-black ${p.pct >= 80 ? 'bg-emerald-50 text-emerald-700' : p.pct >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{p.pct}%</span>
                  </div>
                  <div className="text-[.7rem] font-bold text-slate-500 mt-1">{p.projectName} · {p.evaluated}/{p.total} evaluated · avg {p.avgScore ? p.avgScore.toFixed(1) : '—'}</div>
                </div>
                <button onClick={() => setShowWork(true)} className="inline-flex items-center gap-1.5 rounded bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"><FileText size={12} /> PDF (Project)</button>
              </div>
              {!collapsed[p.projectCode] && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[.76rem]">
                    <thead className="bg-slate-50 text-left text-[.68rem] uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2.5 font-black">Employee</th>
                        <th className="px-3 py-2.5 font-black">Code</th>
                        <th className="px-3 py-2.5 font-black">Position</th>
                        <th className="px-3 py-2.5 font-black text-center">Score</th>
                        <th className="px-3 py-2.5 font-black text-center">Items</th>
                        <th className="px-3 py-2.5 font-black text-center">Status</th>
                        <th className="px-3 py-2.5 font-black text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.employees.filter(emp => {
                        if (statusFilter === 'evaluated' && !emp.evaluated) return false
                        if (statusFilter === 'pending' && emp.evaluated) return false
                        if (search.trim()) {
                          const q = search.toLowerCase()
                          return (emp.name || '').toLowerCase().includes(q)
                            || (emp.employeeCode || '').toLowerCase().includes(q)
                            || (emp.position || '').toLowerCase().includes(q)
                        }
                        return true
                      }).map(emp => (
                        <tr key={emp.employeeCode || emp.name} className="border-t border-slate-100 hover:bg-slate-50/60">
                          <td className="px-3 py-3 font-black text-slate-900">{emp.name}</td>
                          <td className="px-3 py-3 font-mono text-[.72rem] text-slate-500">{emp.employeeCode || '—'}</td>
                          <td className="px-3 py-3 text-slate-600">{emp.position}</td>
                          <td className="px-3 py-3 text-center font-black" style={{ color: emp.score >= 80 ? '#16a34a' : emp.score >= 60 ? '#ca8a04' : '#dc2626' }}>
                            {emp.evaluated ? emp.score.toFixed(1) : '—'}
                          </td>
                          <td className="px-3 py-3 text-center text-slate-500">{emp.items || '—'}</td>
                          <td className="px-3 py-3 text-center">
                            {emp.evaluated
                              ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-[.68rem] font-black text-emerald-700">Evaluated</span>
                              : <span className="rounded-full bg-amber-50 px-2 py-1 text-[.68rem] font-black text-amber-700">Pending</span>
                            }
                          </td>
                          <td className="px-3 py-3 text-right">
                            <button onClick={() => downloadScorecard(emp.name)} disabled={!emp.evaluated} className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-[.7rem] font-black text-[#2447d8] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"><FileText size={11} /> PDF</button>
                            {emp.evaluated && (
                              <button onClick={() => setReEval({ employee: emp.name, period: selectedPeriod })} className="ml-1 inline-flex items-center gap-1 rounded border border-red-200 px-2 py-1 text-[.7rem] font-black text-red-600 hover:bg-red-50"><RotateCcw size={11} /> Re-Eval</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </>
      )}
    </div>
  )
}

function KpiModalShell({ title, subtitle, danger, wide, icon: Icon, children, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4"
         onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-[0_25px_50px_rgba(15,23,42,0.25)] flex flex-col max-h-[92vh] w-full"
           style={{ maxWidth: wide ? 1100 : 540 }}>
        <div className="flex items-center justify-between border-b border-[#edf0f5] px-5 py-4">
          <div className="flex items-center gap-2.5">
            {Icon && <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${danger ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-[#2447d8]'}`}><Icon size={17} /></span>}
            <div>
              <div className={`font-black text-base ${danger ? 'text-red-600' : 'text-[#1d2939]'}`}>{title}</div>
              {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
            </div>
          </div>
          <button onClick={onClose} className="rounded w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}

function ManageModal({ employee, employees = [], employeeId, setEmployeeId, items, updateItem, loadItems, period, onClose }) {
  const [showAddItem, setShowAddItem] = useState(false)
  const [savingItem, setSavingItem] = useState(null)
  const [statusMsg, setStatusMsg] = useState('')

  // Only ACTIVE items count toward the period set (removed items are excluded), matching savePeriodSet's check.
  const totalWeight = items.filter(r => r.active !== false).reduce((sum, row) => sum + Number(row.weight || 0), 0)
  const balanced = totalWeight === 100
  // Base = the latest period the loaded set came from; Target = the period being evaluated
  const basePeriod = items.find(i => i.sourcePeriod)?.sourcePeriod || period || '—'
  const samePeriod = basePeriod === period

  // Edit a weight but never let the total exceed 100 (clamp to the remaining headroom)
  function setWeight(index, value) {
    const others = items.reduce((s, r, i) => s + (i === index || r.active === false ? 0 : Number(r.weight || 0)), 0)
    const max = Math.max(0, 100 - others)
    const v = Math.min(Math.max(parseInt(value, 10) || 0, 0), max)
    updateItem(index, { weight: v })
  }

  // Remove an item from THIS period's set (local only — persisted on Save Set)
  function deactivateItem(itemId) {
    const idx = items.findIndex(i => i.itemId === itemId)
    if (idx >= 0) updateItem(idx, { active: false })
  }

  // Persist the WHOLE curated set as per-period items (kpi_period_items) — never touches the global catalog
  async function savePeriodSet() {
    const active = items.filter(r => r.active !== false)
    const wsum = active.reduce((s, r) => s + Number(r.weight || 0), 0)
    if (wsum !== 100) { setStatusMsg(`⚠ Total weight must equal 100 (now ${wsum})`); return }
    setSavingItem('__SET__'); setStatusMsg('')
    try {
      for (const row of items) {
        const r = await apiFetch('/api/kpi/period-items', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employee_name: employee?.name, period, item_id: row.itemId, position: employee?.position || null, weight: parseInt(row.weight, 10) || 0, active: row.active !== false }),
        })
        if (!r.ok) throw new Error((await r.json()).detail || 'Failed')
      }
      setStatusMsg(`✓ Saved ${active.length} items as the ${period} set`)
    } catch (e) {
      setStatusMsg(`⚠ ${e.message}`)
    } finally {
      setSavingItem(null)
    }
  }

  return (
    <KpiModalShell title="Manage Evaluate Items" subtitle="Loads the latest period's KPI set — adjust it for this period" icon={Settings} wide onClose={onClose}>
      {showAddItem && (
        <AddLibraryModal
          defaultPosition={employee?.position || ''}
          onClose={() => setShowAddItem(false)}
          onSaved={() => { setStatusMsg('✓ Item added'); loadItems() }}
        />
      )}
      {statusMsg && <div className={`rounded p-2 text-xs font-bold mb-3 ${statusMsg.startsWith('✓') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>{statusMsg}</div>}

      <div className="rounded border border-[#e4e7ec] bg-slate-50 p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <KpiField label="Employee">
            <select className={KPI_INPUT_CLS + ' bg-white'} value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}{emp.position ? ` · ${emp.position}` : ''}</option>)}
            </select>
          </KpiField>
          <div className="flex flex-col gap-1">
            <label className="text-[.68rem] font-black uppercase text-slate-500">Period</label>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1.5 text-[.72rem] font-black text-slate-600" title="Base from latest period with data">Base {basePeriod}</span>
              <span className="text-slate-400 text-xs">→</span>
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1.5 text-[.72rem] font-black text-blue-700 border border-blue-100" title="Period being adjusted">Target {period || '—'}</span>
            </div>
          </div>
          <button onClick={() => setShowAddItem(true)} className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-[#2447d8] hover:bg-blue-50 transition"><Plus size={14} /> Add KPI Item</button>
          <button onClick={savePeriodSet} disabled={!balanced || savingItem === '__SET__'} className="inline-flex items-center gap-1.5 rounded bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition"><Save size={14} /> {savingItem === '__SET__' ? 'Saving…' : `Save Set (${period})`}</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[.68rem] font-black text-blue-700 border border-blue-100">{items.filter(i => i.active !== false).length} items</span>
          <span className={`rounded-full px-2.5 py-1 text-[.68rem] font-black ${balanced ? 'bg-emerald-50 text-emerald-700' : totalWeight > 100 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
            Total Weight: {totalWeight} / 100 {balanced ? '✓' : totalWeight > 100 ? '✕ over' : `· ${100 - totalWeight} left`}
          </span>
          <span className="text-[.7rem] text-slate-500">Adjust weights/items, then Save Set for this period</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded border border-[#e4e7ec]">
        <table className="w-full border-collapse text-[.76rem]">
          <thead className="bg-slate-50 text-left text-[.68rem] uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2.5 font-black w-12">#</th>
              <th className="px-3 py-2.5 font-black">ItemID</th>
              <th className="px-3 py-2.5 font-black">Main Evaluate</th>
              <th className="px-3 py-2.5 font-black">Evaluate Item</th>
              <th className="px-3 py-2.5 font-black text-center w-32">Weight</th>
              <th className="px-3 py-2.5 font-black text-center w-24">Status</th>
              <th className="px-3 py-2.5 font-black text-right w-32">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row, index) => {
              const inactive = row.active === false
              return (
                <tr key={row.itemId} className={`border-t border-slate-100 hover:bg-slate-50/60 ${inactive ? 'opacity-50' : ''}`}>
                  <td className="px-3 py-3 text-slate-500">{index + 1}</td>
                  <td className="px-3 py-3 font-mono text-[.72rem] text-slate-500">{row.itemId}</td>
                  <td className="px-3 py-3 font-bold text-slate-700">{row.mainEvaluate}</td>
                  <td className="px-3 py-3 text-slate-700">{row.evaluateItem}</td>
                  <td className="px-3 py-3 text-center">
                    <input type="number" min={0} max={100} value={row.weight} onChange={e => setWeight(index, e.target.value)} disabled={inactive}
                           className="w-16 rounded border border-slate-200 px-2 py-1 text-center text-xs font-bold outline-none focus:border-[#2447d8] disabled:opacity-40" />
                  </td>
                  <td className="px-3 py-3 text-center">
                    {inactive
                      ? <span className="rounded-full bg-slate-100 px-2 py-1 text-[.68rem] font-black text-slate-500">Inactive</span>
                      : <span className="rounded-full bg-emerald-50 px-2 py-1 text-[.68rem] font-black text-emerald-700">Active</span>
                    }
                  </td>
                  <td className="px-3 py-3 text-right">
                    {inactive
                      ? <button onClick={() => updateItem(index, { active: true })} className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-white px-2 py-1 text-[.7rem] font-black text-emerald-700 hover:bg-emerald-50"><RotateCcw size={12} /> Restore</button>
                      : <button onClick={() => deactivateItem(row.itemId)} className="inline-flex items-center gap-1 rounded border border-red-200 bg-white px-2 py-1 text-[.7rem] font-black text-red-600 hover:bg-red-50"><Trash2 size={12} /> Remove</button>
                    }
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </KpiModalShell>
  )
}

function AddLibraryModal({ onClose, onSaved, defaultPosition = '' }) {
  const [form, setForm] = useState({ position: resolveKpiPosition(defaultPosition), main_evaluate: '', evaluate_item: '', weight: 10, target: 100 })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [lib, setLib] = useState([])   // existing items → suggestions + ID preview
  const [newPos, setNewPos] = useState(false)    // typing a brand-new position
  const [newMain, setNewMain] = useState(false)  // typing a brand-new Main Evaluate category

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  // Load existing library for autocomplete + next-ID preview
  useEffect(() => {
    apiFetch('/api/kpi/items')
      .then(r => r.ok ? r.json() : null)
      .then(d => setLib(d?.items || []))
      .catch(() => {})
  }, [])

  // Concept: Position → Main Evaluate (categories belong to a position) → Evaluate Item
  const positionOptions = [...new Set(lib.map(i => i.position).filter(Boolean))].sort()
  const mainForPosition = [...new Set(lib.filter(i => (i.position || '') === form.position).map(i => i.mainEvaluate).filter(Boolean))].sort()
  const groupItems = (form.position && form.main_evaluate.trim())
    ? lib.filter(i => (i.position || '') === form.position && (i.mainEvaluate || '').trim().toUpperCase() === form.main_evaluate.trim().toUpperCase())
    : []
  const itemOptions = [...new Set(groupItems.map(i => i.evaluateItem).filter(Boolean))].sort()
  const nextId = (() => {
    const max = lib.reduce((m, i) => {
      const n = parseInt(String(i.itemId || '').replace(/[^0-9]/g, ''), 10)
      return Number.isFinite(n) && n > m ? n : m
    }, 0)
    return `KPI-${String(max + 1).padStart(4, '0')}`
  })()

  function pickPosition(v) {
    if (v === '__NEW__') { setNewPos(true); set('position', '') }
    else { setNewPos(false); set('position', v) }
    setNewMain(false); set('main_evaluate', '')   // categories depend on position → reset
  }
  function pickMain(v) {
    if (v === '__NEW__') { setNewMain(true); set('main_evaluate', '') }
    else { setNewMain(false); set('main_evaluate', v) }
  }
  const positionChosen = !!(form.position.trim() || newPos)

  async function handleSave() {
    if (!form.position.trim()) {
      setError('Position is required (KPI belongs to a position)')
      return
    }
    if (!form.main_evaluate.trim() || !form.evaluate_item.trim()) {
      setError('Main Evaluate and Evaluate Item are required')
      return
    }
    setSaving(true); setError(''); setSuccess('')
    try {
      const r = await apiFetch('/api/kpi/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position: form.position.trim() || null,
          main_evaluate: form.main_evaluate.trim(),
          evaluate_item: form.evaluate_item.trim(),
          weight: parseInt(form.weight, 10) || 10,
          target: parseInt(form.target, 10) || 100,
          active: true,
        }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.detail || 'Save failed')
      setSuccess(`✓ Created: ${d.itemId}`)
      onSaved?.(d)
      setTimeout(() => onClose(), 1000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <KpiModalShell title="Add KPI to Library" subtitle="Define a new evaluate item to be reusable" icon={Plus} onClose={onClose}>
      {error && <div className="rounded bg-red-50 border border-red-200 p-3 text-sm font-bold text-red-700 mb-3">⚠ {error}</div>}
      {success && <div className="rounded bg-emerald-50 border border-emerald-200 p-3 text-sm font-bold text-emerald-700 mb-3">{success}</div>}

      {/* Step 1 — Position drives the Main Evaluate categories */}
      <div className="rounded border border-blue-100 bg-blue-50/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[.68rem] font-black uppercase tracking-wider text-blue-700">KPI Identity</div>
          <div className="inline-flex items-center gap-2 rounded border border-slate-200 bg-white px-2.5 py-1">
            <span className="text-[.58rem] font-black text-slate-400">ITEM ID</span>
            <span className="font-mono text-xs font-black text-[#2447d8]">{nextId}</span>
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[.54rem] font-black text-slate-500">AUTO</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Position */}
          <KpiField label="① Position *">
            {newPos ? (
              <div className="flex gap-1">
                <input className={KPI_INPUT_CLS} placeholder="New position name…" value={form.position} onChange={e => set('position', e.target.value)} autoFocus />
                <button type="button" onClick={() => { setNewPos(false); set('position', '') }} className="rounded border border-slate-200 px-2 text-xs font-black text-slate-500 hover:bg-slate-100">✕</button>
              </div>
            ) : (
              <select className={KPI_INPUT_CLS} value={form.position} onChange={e => pickPosition(e.target.value)}>
                <option value="">— Select position —</option>
                {positionOptions.map(o => <option key={o} value={o}>{o}</option>)}
                <option value="__NEW__">➕ New position…</option>
              </select>
            )}
          </KpiField>

          {/* Main Evaluate — filtered by position */}
          <KpiField label="② Main Evaluate * (by position)">
            {(newMain || newPos) ? (
              <div className="flex gap-1">
                <input className={KPI_INPUT_CLS} placeholder="New category name…" value={form.main_evaluate} onChange={e => set('main_evaluate', e.target.value)} autoFocus />
                {!newPos && <button type="button" onClick={() => { setNewMain(false); set('main_evaluate', '') }} className="rounded border border-slate-200 px-2 text-xs font-black text-slate-500 hover:bg-slate-100">✕</button>}
              </div>
            ) : (
              <select className={KPI_INPUT_CLS + (positionChosen ? '' : ' opacity-50')} value={form.main_evaluate} disabled={!positionChosen} onChange={e => pickMain(e.target.value)}>
                <option value="">{positionChosen ? '— Select category —' : 'Select position first'}</option>
                {mainForPosition.map(o => <option key={o} value={o}>{o}</option>)}
                <option value="__NEW__">➕ New category…</option>
              </select>
            )}
          </KpiField>
        </div>

        {/* Evaluate Item — the adjustable detail */}
        <div className="mt-3">
          <KpiField label="③ Evaluate Item * (adjustable)">
            <input list="kpi-item-options" className={KPI_INPUT_CLS} placeholder="e.g. Technical skills / Problem Solve" value={form.evaluate_item} onChange={e => set('evaluate_item', e.target.value)} />
            <datalist id="kpi-item-options">{itemOptions.map(o => <option key={o} value={o} />)}</datalist>
          </KpiField>
        </div>

        {/* Existing items in this Position + Main Evaluate */}
        {form.position && form.main_evaluate.trim() && (
          <div className="mt-3 border-t border-blue-100 pt-2">
            <div className="text-[.62rem] font-black uppercase text-slate-400 mb-1.5">
              {groupItems.length ? `Already in "${form.main_evaluate.trim()}" (${groupItems.length})` : `New category "${form.main_evaluate.trim()}"`}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {groupItems.slice(0, 12).map(i => (
                <span key={i.itemId} className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[.62rem] font-bold text-slate-600">
                  <span className="font-mono text-slate-400">{i.itemId}</span> · {i.evaluateItem}
                </span>
              ))}
              {groupItems.length > 12 && <span className="text-[.62rem] font-bold text-slate-400 self-center">+{groupItems.length - 12} more</span>}
            </div>
          </div>
        )}
      </div>

      {/* Defaults */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <KpiField label="Default Weight">
          <input className={KPI_INPUT_CLS} type="number" value={form.weight} onChange={e => set('weight', e.target.value)} />
        </KpiField>
        <KpiField label="Default Target">
          <input className={KPI_INPUT_CLS} type="number" value={form.target} onChange={e => set('target', e.target.value)} />
        </KpiField>
      </div>

      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-[#edf0f5]">
        <button onClick={onClose} className="rounded border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1.5 rounded bg-[#2447d8] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#1e3bb8] disabled:opacity-60 transition">
          <Plus size={14} /> {saving ? 'Saving…' : `Add ${nextId}`}
        </button>
      </div>
    </KpiModalShell>
  )
}

function WorkingModal({ onClose }) {
  return (
    <KpiModalShell title="Processing…" icon={Loader} onClose={onClose}>
      <div className="bg-slate-900 text-emerald-300 rounded p-4 font-mono text-sm whitespace-pre-line min-h-[140px]">
        Working...{'\n'}Generating PDF...{'\n'}PDF ready for download.
      </div>
      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-[#edf0f5]">
        <button onClick={onClose} className="rounded border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition">Close</button>
      </div>
    </KpiModalShell>
  )
}

function ReEvalModal({ data, onClose, onDeleted }) {
  const [reason, setReason] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleDelete() {
    if (reason.trim().length < 3) {
      setError('Reason is required (min 3 chars)')
      return
    }
    setDeleting(true); setError('')
    try {
      const r = await apiFetch('/api/kpi/evaluations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_name: data.employee,
          period: data.period,
          reason: reason.trim(),
        }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.detail || 'Delete failed')
      setSuccess(`✓ Soft-deleted ${d.rows_deleted} evaluation rows — can be restored by admin`)
      onDeleted?.()
      setTimeout(() => onClose(), 1500)
    } catch (e) {
      setError(e.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <KpiModalShell title="Admin: Re-Evaluate" subtitle="Soft delete — recoverable via admin" icon={AlertTriangle} danger onClose={onClose}>
      {error && <div className="rounded bg-red-50 border border-red-200 p-3 text-sm font-bold text-red-700 mb-3">⚠ {error}</div>}
      {success && <div className="rounded bg-emerald-50 border border-emerald-200 p-3 text-sm font-bold text-emerald-700 mb-3">{success}</div>}
      <div className="rounded border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-900 mb-4">
        ⚠ This will <b>soft-delete</b> evaluation records for this employee + period. Records are marked deleted (recoverable) and you can re-evaluate this period.
      </div>
      <div className="flex flex-col gap-3">
        <KpiField label="Employee">
          <input className={KPI_INPUT_CLS + ' bg-slate-50'} readOnly value={data.employee} />
        </KpiField>
        <KpiField label="Period">
          <input className={KPI_INPUT_CLS + ' bg-slate-50'} readOnly value={data.period} />
        </KpiField>
        <KpiField label="Reason (required, min 3 chars)">
          <input className={KPI_INPUT_CLS} placeholder="Explain why you are re-evaluating..." value={reason} onChange={e => setReason(e.target.value)} />
        </KpiField>
      </div>
      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-[#edf0f5]">
        <button onClick={onClose} className="rounded border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition">Cancel</button>
        <button onClick={handleDelete} disabled={deleting || reason.trim().length < 3}
                className="inline-flex items-center gap-1.5 rounded bg-red-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60 transition">
          <Trash2 size={14} /> {deleting ? 'Deleting…' : 'Delete & Unlock'}
        </button>
      </div>
    </KpiModalShell>
  )
}

function groupBy(arr, keyFn) {
  const map = new Map()
  arr.forEach(item => {
    const key = keyFn(item)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(item)
  })
  return map
}
