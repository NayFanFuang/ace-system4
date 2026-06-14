// POTrackingDashboard — PO Collection Tracking between Accounting & Project.
// Answers: what's collected (billed to HW), what's pending, what's rejected,
// who's holding each PO now, and what's aging. Both money legs are shown:
//   • Collection IN — billing Huawei (hw_billed / AC1 / AC2)
//   • Payment OUT   — paying the DTE field engineer (dte_paid)
// Mounted at /finance/po-tracking. Role-gated (Accounting/Project/Exec).

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Banknote, TrendingUp, Clock, CheckCircle2, AlertTriangle, RefreshCw,
  Filter, FileSpreadsheet, FileText, Search, XCircle, Hourglass, CircleDollarSign,
  GitBranch, Users, Building2, Layers, Wallet, ChevronRight,
} from 'lucide-react'
import { apiFetch } from './src/apiFetch.js'
import { exportExcel, exportPdf } from './src/exportUtils.js'

const ACE_BLUE = '#2447d8'
const PURPLE   = '#7c3aed'
const AMBER    = '#b45309'
const GREEN    = '#16a34a'
const RED      = '#dc2626'
const SLATE    = '#475569'
const CYAN     = '#0891b2'

function fmtBaht(n) {
  if (n == null) return '—'
  return '฿' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}
function fmtNum(n) {
  if (n == null) return '0'
  return Number(n).toLocaleString('en-US')
}
// ASCII money for PDF (jsPDF default font has no Thai glyphs / ฿ symbol)
function fmtTHB(n) {
  return 'THB ' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })
}
function dateShort(iso) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) } catch { return '—' }
}

// --- Collection state styling ---------------------------------------------
const BILLING_META = {
  BILLED:     { label: 'เก็บแล้ว',       th: 'Collected',   tone: GREEN },
  PARTIAL:    { label: 'เก็บบางส่วน',    th: 'Partial (AC1)', tone: AMBER },
  NOT_BILLED: { label: 'ยังไม่เก็บ',     th: 'Not billed',  tone: SLATE },
  REJECTED:   { label: 'ถูก Reject',     th: 'Rejected',    tone: RED },
}
const PAY_META = {
  PAID:   { label: 'จ่ายแล้ว',  tone: GREEN },
  UNPAID: { label: 'ค้างจ่าย',  tone: AMBER },
  'N/A':  { label: '—',         tone: SLATE },
}
const PHASE_META = {
  FINANCE_REVIEW: { label: 'รีวิวบัญชี',     tone: ACE_BLUE },
  PROJECT_PLAN:   { label: 'วางแผนโปรเจกต์', tone: CYAN },
  APPROVAL:       { label: 'อนุมัติ',        tone: PURPLE },
  EXECUTION:      { label: 'หน้างาน',        tone: AMBER },
  CLOSE_OUT:      { label: 'ปิดบิล/จ่าย',    tone: GREEN },
  HOLD:           { label: 'พักไว้',         tone: SLATE },
  REJECTED:       { label: 'Reject',         tone: RED },
}
const OWNER_LABELS = {
  FINANCE: 'บัญชี (Finance)', PROJECT: 'โปรเจกต์', APPROVER: 'ผู้อนุมัติ',
  DTE: 'DTE', LEADER: 'หัวหน้าทีม',
}
const PHASE_ORDER = ['FINANCE_REVIEW', 'PROJECT_PLAN', 'APPROVAL', 'EXECUTION', 'CLOSE_OUT', 'HOLD', 'REJECTED']

function Card({ children, className = '' }) {
  return <section className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.06)] ${className}`}>{children}</section>
}
function StatCard({ label, value, helper, tone = ACE_BLUE, icon: Icon, onClick }) {
  return (
    <Card className={`p-5 ${onClick ? 'cursor-pointer transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(15,23,42,0.12)]' : ''}`}>
      <button type="button" onClick={onClick} disabled={!onClick} className="block w-full text-left disabled:cursor-default">
        <div className="flex items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `${tone}12`, color: tone }}>
            <Icon size={21} strokeWidth={2.3} />
          </div>
          {onClick && <ChevronRight size={16} className="text-slate-300" />}
        </div>
        <div className="mt-5 text-xs font-black uppercase tracking-[.08em] text-slate-500">{label}</div>
        <div className="mt-2 text-3xl font-black text-slate-950">{value}</div>
        {helper && <div className="mt-1 text-xs font-semibold text-slate-400">{helper}</div>}
      </button>
    </Card>
  )
}
function Badge({ meta }) {
  if (!meta) return <span className="text-slate-400">—</span>
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[.7rem] font-black"
      style={{ background: `${meta.tone}14`, color: meta.tone }}>
      {meta.label}
    </span>
  )
}

// Horizontal stacked bar for collection mix
function CollectionMixBar({ summary, onSegment }) {
  const segs = [
    { k: 'BILLED',     v: summary.billed_value,     ...BILLING_META.BILLED },
    { k: 'PARTIAL',    v: summary.partial_value,    ...BILLING_META.PARTIAL },
    { k: 'NOT_BILLED', v: summary.not_billed_value, ...BILLING_META.NOT_BILLED },
    { k: 'REJECTED',   v: summary.rejected_value,   ...BILLING_META.REJECTED },
  ]
  const total = segs.reduce((a, s) => a + (s.v || 0), 0) || 1
  return (
    <div>
      <div className="flex h-5 w-full overflow-hidden rounded-full bg-slate-100">
        {segs.map(s => s.v > 0 && (
          <div key={s.k} onClick={() => onSegment && onSegment(s.k)} className={onSegment ? 'cursor-pointer hover:opacity-80' : ''}
            style={{ width: `${(s.v / total) * 100}%`, background: s.tone }} title={`${s.label}: ${fmtBaht(s.v)} — คลิกเพื่อดูรายการ`} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {segs.map(s => (
          <div key={s.k} onClick={() => onSegment && onSegment(s.k)}
            className={`flex items-center gap-2 ${onSegment ? 'cursor-pointer rounded-lg p-1 hover:bg-slate-50' : ''}`}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.tone }} />
            <div className="text-xs">
              <div className="font-black text-slate-700">{s.label}</div>
              <div className="font-bold text-slate-400">{fmtBaht(s.v)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Pipeline funnel — count per phase
function PipelineFunnel({ byPhase }) {
  const map = Object.fromEntries((byPhase || []).map(p => [p.key, p]))
  const max = Math.max(1, ...(byPhase || []).map(p => p.count))
  return (
    <div className="space-y-2.5">
      {PHASE_ORDER.filter(ph => map[ph]).map(ph => {
        const p = map[ph]
        const meta = PHASE_META[ph] || { label: ph, tone: SLATE }
        return (
          <div key={ph} className="flex items-center gap-3">
            <div className="w-32 shrink-0 text-right text-xs font-black text-slate-600">{meta.label}</div>
            <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-slate-100">
              <div className="flex h-full items-center justify-end rounded-lg px-2 text-[.7rem] font-black text-white"
                style={{ width: `${Math.max(8, (p.count / max) * 100)}%`, background: meta.tone }}>
                {p.count}
              </div>
            </div>
            <div className="w-24 shrink-0 text-right text-xs font-bold text-slate-400">{fmtBaht(p.value)}</div>
          </div>
        )
      })}
    </div>
  )
}

// Monthly trend — plan (target) vs collected (bill HW) vs DTE paid, per month
function MonthlyTrend({ monthly }) {
  if (!monthly || monthly.length === 0) {
    return <div className="py-8 text-center text-sm font-bold text-slate-400">ยังไม่มีข้อมูลการเก็บเงิน/จ่ายรายเดือน</div>
  }
  const max = Math.max(1, ...monthly.map(m => Math.max(m.plan || 0, m.collected, m.dte_paid)))
  const months = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
  const mLabel = ym => { const [y, m] = (ym || '').split('-'); return `${months[parseInt(m, 10)] || m} ${(y || '').slice(2)}` }
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs font-black">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border-2 border-slate-300" /> เป้า (Plan)</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: GREEN }} /> เก็บเงินได้</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: CYAN }} /> จ่าย DTE</span>
      </div>
      <div className="flex items-end gap-3 overflow-x-auto pb-2" style={{ minHeight: 160 }}>
        {monthly.map(m => (
          <div key={m.month} className="flex shrink-0 flex-col items-center gap-1" style={{ width: 66 }}>
            <div className="flex h-32 items-end gap-1">
              <div className="w-4 rounded-t border-2 border-slate-300 bg-slate-50" style={{ height: `${((m.plan || 0) / max) * 100}%` }} title={`เป้า ${fmtBaht(m.plan)}`} />
              <div className="w-4 rounded-t" style={{ height: `${(m.collected / max) * 100}%`, background: GREEN }} title={`เก็บได้ ${fmtBaht(m.collected)}`} />
              <div className="w-4 rounded-t" style={{ height: `${(m.dte_paid / max) * 100}%`, background: CYAN }} title={`จ่าย DTE ${fmtBaht(m.dte_paid)}`} />
            </div>
            <div className="text-[.62rem] font-black text-slate-500">{mLabel(m.month)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Breakdown table (owner / vendor / project)
function BreakdownTable({ title, icon: Icon, tone, rows, keyLabel, onRow }) {
  if (!rows || rows.length === 0) return null
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <Icon size={18} style={{ color: tone }} />
        <h3 className="text-base font-black text-slate-950">{title}</h3>
      </div>
      <table className="w-full" style={{ fontSize: '.82rem' }}>
        <thead>
          <tr className="bg-slate-50 text-left text-[.62rem] font-black uppercase text-slate-500">
            <th className="px-5 py-2.5">{keyLabel}</th>
            <th className="px-5 py-2.5 text-center">PO</th>
            <th className="px-5 py-2.5 text-right">มูลค่า</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.key} onClick={() => onRow && onRow(r.key)}
              className={`border-t border-slate-50 ${onRow ? 'cursor-pointer hover:bg-indigo-50/40' : ''}`}>
              <td className="px-5 py-2.5 font-bold text-slate-700">{keyLabel === 'เจ้าของงาน' ? (OWNER_LABELS[r.key] || r.key) : r.key}</td>
              <td className="px-5 py-2.5 text-center font-black text-slate-600">{r.count}</td>
              <td className="px-5 py-2.5 text-right font-black text-slate-900">{fmtBaht(r.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

const EMPTY = {
  summary: {}, by_status: [], by_phase: [], by_owner: [], by_vendor: [], by_project: [],
  project_rollup: [], monthly: [], aging_watch: [], data: [],
}

export default function POTrackingDashboard({ authenticatedUser, onLogout }) {
  const [d, setD] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')  // overview | detail | aging
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState(null)

  const canAct = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'ACCOUNTING', 'PROJECT_ADMIN'].includes(authenticatedUser?.role)

  // Server-side filters
  const [aceProject, setAceProject] = useState('')
  const [workType, setWorkType] = useState('')
  const [vendor, setVendor] = useState('')
  const [ownerRole, setOwnerRole] = useState('')
  const [billingState, setBillingState] = useState('')
  const [payState, setPayState] = useState('')
  const [monthFrom, setMonthFrom] = useState('')
  const [monthTo, setMonthTo] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (aceProject) params.set('ace_project_code', aceProject)
      if (workType) params.set('work_type', workType)
      if (vendor) params.set('vendor', vendor)
      if (ownerRole) params.set('owner_role', ownerRole)
      if (billingState) params.set('billing_state', billingState)
      if (payState) params.set('dte_pay_state', payState)
      if (monthFrom) params.set('month_from', monthFrom)
      if (monthTo) params.set('month_to', monthTo)
      const res = await apiFetch(`/api/project-pos/collection-dashboard?${params.toString()}`)
      const json = await res.json()
      setD({ ...EMPTY, ...json })
    } catch {
      setD(EMPTY)
    } finally {
      setLoading(false)
    }
  }, [aceProject, workType, vendor, ownerRole, billingState, payState, monthFrom, monthTo])

  useEffect(() => { reload() }, [reload])

  const s = d.summary || {}

  // Project filter options — defaults + any project present in the data
  const projectOptions = useMemo(() => {
    const keys = new Set(['HWT2304', 'HWT2604'])
    ;(d.project_rollup || []).forEach(p => { if (p.ace_project_code && p.ace_project_code !== '—') keys.add(p.ace_project_code) })
    if (aceProject) keys.add(aceProject)
    return Array.from(keys).sort().map(k => [k, k])
  }, [d.project_rollup, aceProject])

  function drillProject(code) {
    setAceProject(code === '—' ? '' : code)
    setTab('detail')
  }

  // Drill from a KPI card / mix segment → apply the matching filter + show rows
  function focusBilling(state) { setBillingState(state); setPayState(''); setTab('detail') }
  function focusPay(state) { setPayState(state); setBillingState(''); setTab('detail') }

  // Client-side search across PO number / site / project
  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return d.data
    return d.data.filter(r =>
      (r.po_number || '').toLowerCase().includes(q) ||
      (r.cluster_site || '').toLowerCase().includes(q) ||
      (r.site_code || '').toLowerCase().includes(q) ||
      (r.ace_project_code || '').toLowerCase().includes(q) ||
      (r.hw_invoice_no || '').toLowerCase().includes(q)
    )
  }, [d.data, search])

  async function doAction(row, action) {
    let invoice_no = null, payment_ref = null
    if (action === 'bill_ac1' || action === 'bill_ac2') {
      invoice_no = window.prompt(`เลขที่ Invoice (HW) สำหรับ ${action === 'bill_ac1' ? 'AC1' : 'AC2'}:`, '')
      if (invoice_no === null) return
    } else if (action === 'mark_dte_paid') {
      payment_ref = window.prompt('อ้างอิงการจ่าย DTE (ไม่บังคับ):', '')
      if (payment_ref === null) return
    } else if (action.startsWith('unbill') || action === 'unmark_dte_paid') {
      if (!window.confirm('ยืนยันยกเลิกรายการนี้?')) return
    }
    setBusyId(row.id)
    try {
      const res = await apiFetch(`/api/project-pos/${row.id}/collection-action`, {
        method: 'POST', body: JSON.stringify({ action, invoice_no, payment_ref }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); alert(e.detail || 'ทำรายการไม่สำเร็จ'); return }
      await reload()
    } finally { setBusyId(null) }
  }

  function doExport() {
    const rows = (tab === 'aging' ? d.aging_watch : visibleRows)
    exportExcel({
      title: 'PO Collection Tracking',
      subtitle: `Exported ${new Date().toLocaleString()} · ${rows.length} rows`,
      filename: `PO_Collection_${new Date().toISOString().slice(0, 10)}.xlsx`,
      columns: [
        { header: 'PO Number', dataKey: 'po_number', width: 16 },
        { header: 'Line', dataKey: 'po_line', width: 8 },
        { header: 'Site', dataKey: 'cluster_site', width: 22 },
        { header: 'Vendor', dataKey: 'vendor', width: 10 },
        { header: 'Type', dataKey: 'work_type', width: 8 },
        { header: 'Project', dataKey: 'ace_project_code', width: 12 },
        { header: 'Amount', dataKey: 'line_amount', width: 14, align: 'right' },
        { header: 'Owner', dataKey: 'current_owner_role', width: 12 },
        { header: 'Status', dataKey: 'workflow_status', width: 18 },
        { header: 'Collection', dataKey: 'billing_state', width: 14,
          color: r => ({ BILLED: '16A34A', PARTIAL: 'B45309', NOT_BILLED: '94A3B8', REJECTED: 'DC2626' }[r.billing_state]) },
        { header: 'DTE Pay', dataKey: 'dte_pay_state', width: 10 },
        { header: 'Invoice No', dataKey: 'hw_invoice_no', width: 16 },
        { header: 'Aging (days)', dataKey: 'aging_days', width: 12, align: 'center' },
      ],
      rows,
    })
  }

  function scopeLabel() {
    const parts = [
      aceProject || 'All projects', workType || 'All types', vendor || 'All vendors',
    ]
    if (monthFrom || monthTo) parts.push(`${monthFrom || '…'} to ${monthTo || '…'}`)
    return 'Scope: ' + parts.join(' / ')
  }

  function doExportPdf() {
    const today = new Date().toISOString().slice(0, 10)
    exportPdf({
      title: 'PO Collection Report',
      subtitle: `${scopeLabel()}  |  Plan ${fmtTHB(s.total_plan)} - Collected ${fmtTHB(s.billed_value)} (${s.collection_rate || 0}%) - Outstanding ${fmtTHB(s.outstanding_value)} - Rejected ${fmtTHB(s.rejected_value)}`,
      filename: `PO_Collection_Report_${today}.pdf`,
      landscape: true,
      columns: [
        { header: 'Project', dataKey: 'ace_project_code', width: 26 },
        { header: 'POs', dataKey: 'count', width: 14 },
        { header: 'Total', dataKey: 'f_total', width: 32 },
        { header: 'Collected', dataKey: 'f_billed', width: 32 },
        { header: 'Outstanding', dataKey: 'f_out', width: 32 },
        { header: 'Rejected', dataKey: 'f_rej', width: 30 },
        { header: 'Collect %', dataKey: 'collection_rate', width: 22 },
        { header: 'Plan', dataKey: 'f_plan', width: 32 },
        { header: 'vs Plan %', dataKey: 'plan_rate', width: 22 },
      ],
      rows: (d.project_rollup || []).map(r => ({
        ...r,
        f_total: fmtTHB(r.total), f_billed: fmtTHB(r.billed),
        f_out: fmtTHB(r.outstanding), f_rej: fmtTHB(r.rejected), f_plan: fmtTHB(r.plan),
      })),
      signatures: [{ label: 'Prepared by (Finance)' }, { label: 'Approved by (Management)' }],
    })
  }

  function clearFilters() {
    setAceProject(''); setWorkType(''); setVendor(''); setOwnerRole(''); setBillingState(''); setPayState(''); setSearch('')
    setMonthFrom(''); setMonthTo('')
  }
  const hasFilters = aceProject || workType || vendor || ownerRole || billingState || payState || search || monthFrom || monthTo

  const name = authenticatedUser?.name || ''

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-lg"
              style={{ background: `linear-gradient(135deg, ${ACE_BLUE}, ${PURPLE})` }}>
              <CircleDollarSign size={20} />
            </div>
            <div>
              <div className="text-sm font-black text-slate-950">PO Collection Tracking</div>
              <div className="text-[.65rem] font-bold text-slate-400">บัญชี ↔ โปรเจกต์ · ติดตามการเก็บเงิน PO</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {name && <span className="hidden text-xs font-bold text-slate-400 sm:inline">{name}</span>}
            <a href="/overview" className="text-xs font-black text-slate-500 hover:text-slate-800">Overview</a>
            <button onClick={onLogout} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-50">Logout</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col gap-6">
          {/* Heading */}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-black text-indigo-700">
                <Banknote size={14} /> ติดตามสถานะ PO · เก็บเงิน / จ่าย DTE / Reject
              </div>
              <h1 className="mt-4 text-3xl font-black text-slate-950 sm:text-4xl">PO Collection Dashboard</h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                ภาพรวมว่า PO ไหน <b>เก็บเงินแล้ว</b> / <b>ยังไม่เก็บ</b> / <b>ถูก Reject</b> ตอนนี้ค้างอยู่ที่บัญชีหรือโปรเจกต์ และตัวไหนค้างนาน (aging)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={reload} disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> รีเฟรช
              </button>
              <button onClick={doExportPdf}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-600 shadow-sm hover:bg-slate-50">
                <FileText size={16} /> PDF Report
              </button>
              <button onClick={doExport}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black text-white shadow-lg hover:opacity-90"
                style={{ background: GREEN }}>
                <FileSpreadsheet size={16} /> Export Excel
              </button>
            </div>
          </div>

          {/* KPI cards */}
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="มูลค่า PO รวม" value={fmtBaht(s.total_value)} helper={`${fmtNum(s.total)} PO`} tone={ACE_BLUE} icon={Layers} onClick={() => { clearFilters(); setTab('detail') }} />
            <StatCard label="เก็บเงินแล้ว" value={fmtBaht(s.billed_value)} helper={`${fmtNum(s.billed)} PO · ${s.collection_rate || 0}% collection`} tone={GREEN} icon={CheckCircle2} onClick={() => focusBilling('BILLED')} />
            <StatCard label="ค้างเก็บ" value={fmtBaht(s.outstanding_value)} helper={`${fmtNum((s.not_billed || 0) + (s.partial || 0))} PO (รวมบางส่วน)`} tone={AMBER} icon={Hourglass} onClick={() => focusBilling('NOT_BILLED')} />
            <StatCard label="ถูก Reject" value={fmtBaht(s.rejected_value)} helper={`${fmtNum(s.rejected)} PO`} tone={RED} icon={XCircle} onClick={() => focusBilling('REJECTED')} />
          </section>
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="จ่าย DTE แล้ว" value={fmtBaht(s.dte_paid_value)} helper={`${fmtNum(s.dte_paid)} PO · ${s.dte_pay_rate || 0}% paid`} tone={CYAN} icon={Wallet} onClick={() => focusPay('PAID')} />
            <StatCard label="ค้างจ่าย DTE" value={fmtBaht(s.dte_unpaid_value)} helper={`${fmtNum(s.dte_unpaid)} PO`} tone={PURPLE} icon={Clock} onClick={() => focusPay('UNPAID')} />
            <StatCard label="เก็บบางส่วน (AC1)" value={fmtBaht(s.partial_value)} helper={`${fmtNum(s.partial)} PO`} tone={AMBER} icon={TrendingUp} onClick={() => focusBilling('PARTIAL')} />
            <StatCard label="ค้างนาน > 14 วัน" value={fmtNum((d.aging_watch || []).filter(a => a.aging_days > 14).length)} helper="PO ที่ต้องเร่งติดตาม" tone={RED} icon={AlertTriangle} onClick={() => setTab('aging')} />
          </section>

          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500"><Filter size={14} /> ตัวกรอง</span>
              <Select value={aceProject} onChange={setAceProject} placeholder="ทุกโปรเจกต์"
                options={projectOptions} />
              <Select value={workType} onChange={setWorkType} placeholder="ทุกประเภท"
                options={[['SSV', 'SSV'], ['PAC', 'PAC']]} />
              <Select value={vendor} onChange={setVendor} placeholder="ทุก Vendor"
                options={[['HW', 'HW'], ['ERICSSON', 'ERICSSON'], ['NBTC', 'NBTC']]} />
              <Select value={ownerRole} onChange={setOwnerRole} placeholder="ทุกเจ้าของงาน"
                options={[['FINANCE', 'บัญชี'], ['PROJECT', 'โปรเจกต์'], ['APPROVER', 'ผู้อนุมัติ'], ['DTE', 'DTE'], ['LEADER', 'หัวหน้าทีม']]} />
              <Select value={billingState} onChange={setBillingState} placeholder="สถานะเก็บเงิน"
                options={[['NOT_BILLED', 'ยังไม่เก็บ'], ['PARTIAL', 'เก็บบางส่วน'], ['BILLED', 'เก็บแล้ว'], ['REJECTED', 'Reject']]} />
              <Select value={payState} onChange={setPayState} placeholder="สถานะจ่าย DTE"
                options={[['UNPAID', 'ค้างจ่าย'], ['PAID', 'จ่ายแล้ว']]} />
              <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1">
                <span className="text-[.62rem] font-black text-slate-400">เดือน</span>
                <input type="month" value={monthFrom} onChange={e => setMonthFrom(e.target.value)}
                  className="w-[7.5rem] bg-transparent text-xs font-bold text-slate-700 outline-none" />
                <span className="text-slate-300">–</span>
                <input type="month" value={monthTo} onChange={e => setMonthTo(e.target.value)}
                  className="w-[7.5rem] bg-transparent text-xs font-bold text-slate-700 outline-none" />
              </div>
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหา PO / ไซต์ / invoice"
                  className="w-52 rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400" />
              </div>
              {hasFilters && (
                <button onClick={clearFilters} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-500 hover:bg-slate-50">ล้างตัวกรอง</button>
              )}
            </div>
          </Card>

          {/* Tabs */}
          <div className="flex gap-2">
            {[['overview', 'ภาพรวม'], ['projects', `รายโปรเจกต์ (${(d.project_rollup || []).length})`], ['detail', `รายการ PO (${visibleRows.length})`], ['aging', `ค้างนาน (${(d.aging_watch || []).length})`]].map(([k, label]) => (
              <button key={k} onClick={() => setTab(k)}
                className={`rounded-xl px-4 py-2 text-sm font-black transition ${tab === k ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
                {label}
              </button>
            ))}
          </div>

          {loading && <div className="py-12 text-center text-sm font-bold text-slate-400">กำลังโหลด…</div>}

          {!loading && tab === 'overview' && (
            <>
              <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card className="p-5">
                  <h3 className="mb-4 inline-flex items-center gap-2 text-base font-black text-slate-950"><CircleDollarSign size={18} style={{ color: GREEN }} /> สัดส่วนการเก็บเงิน (มูลค่า)</h3>
                  <CollectionMixBar summary={s} onSegment={focusBilling} />
                </Card>
                <Card className="p-5">
                  <h3 className="mb-4 inline-flex items-center gap-2 text-base font-black text-slate-950"><GitBranch size={18} style={{ color: ACE_BLUE }} /> Pipeline — PO อยู่ขั้นไหน</h3>
                  <PipelineFunnel byPhase={d.by_phase} />
                </Card>
              </section>
              <Card className="p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="inline-flex items-center gap-2 text-base font-black text-slate-950"><TrendingUp size={18} style={{ color: GREEN }} /> แนวโน้มรายเดือน — เป้า / เก็บได้ / จ่าย DTE</h3>
                  {s.total_plan > 0 && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                      เป้ารวม {fmtBaht(s.total_plan)} · เก็บได้ <span style={{ color: s.plan_collection_rate >= 80 ? GREEN : s.plan_collection_rate >= 50 ? AMBER : RED }}>{s.plan_collection_rate || 0}%</span>
                    </span>
                  )}
                </div>
                <MonthlyTrend monthly={d.monthly} />
              </Card>
              <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <BreakdownTable title="ค้างอยู่ที่ใคร" icon={Users} tone={PURPLE} rows={d.by_owner} keyLabel="เจ้าของงาน"
                  onRow={k => { setOwnerRole(k); setTab('detail') }} />
                <BreakdownTable title="แยกตาม Vendor" icon={Building2} tone={CYAN} rows={d.by_vendor} keyLabel="Vendor"
                  onRow={k => { setVendor(k); setTab('detail') }} />
                <BreakdownTable title="แยกตามโปรเจกต์" icon={Layers} tone={ACE_BLUE} rows={d.by_project} keyLabel="Project"
                  onRow={drillProject} />
              </section>
            </>
          )}

          {!loading && tab === 'projects' && (
            <Card className="overflow-hidden">
              <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
                <Layers size={18} style={{ color: ACE_BLUE }} />
                <h3 className="text-base font-black text-slate-950">สรุปการเก็บเงินรายโปรเจกต์</h3>
                <span className="text-xs font-bold text-slate-400">— คลิกแถวเพื่อเจาะดูรายการ PO</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full" style={{ fontSize: '.8rem' }}>
                  <thead>
                    <tr className="bg-slate-50 text-left text-[.6rem] font-black uppercase text-slate-500">
                      <th className="px-4 py-3">โปรเจกต์</th>
                      <th className="px-4 py-3 text-center">PO</th>
                      <th className="px-4 py-3 text-right">มูลค่ารวม</th>
                      <th className="px-4 py-3 text-right">เก็บแล้ว</th>
                      <th className="px-4 py-3 text-right">ค้างเก็บ</th>
                      <th className="px-4 py-3 text-right">Reject</th>
                      <th className="px-4 py-3">% เก็บได้</th>
                      <th className="px-4 py-3 text-right">เป้า (Plan)</th>
                      <th className="px-4 py-3 text-center">vs เป้า</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(d.project_rollup || []).map(r => (
                      <tr key={r.ace_project_code} onClick={() => drillProject(r.ace_project_code)}
                        className="cursor-pointer border-t border-slate-50 hover:bg-indigo-50/40">
                        <td className="px-4 py-3 font-black text-slate-800">{r.ace_project_code}</td>
                        <td className="px-4 py-3 text-center font-bold text-slate-500">{r.count}</td>
                        <td className="px-4 py-3 text-right font-black text-slate-900">{fmtBaht(r.total)}</td>
                        <td className="px-4 py-3 text-right font-bold" style={{ color: GREEN }}>{fmtBaht(r.billed)}</td>
                        <td className="px-4 py-3 text-right font-bold" style={{ color: AMBER }}>{fmtBaht(r.outstanding)}</td>
                        <td className="px-4 py-3 text-right font-bold" style={{ color: r.rejected ? RED : '#cbd5e1' }}>{r.rejected ? fmtBaht(r.rejected) : '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                              <div className="h-full rounded-full" style={{ width: `${Math.min(100, r.collection_rate)}%`, background: r.collection_rate >= 80 ? GREEN : r.collection_rate >= 50 ? AMBER : RED }} />
                            </div>
                            <span className="text-xs font-black text-slate-600">{r.collection_rate}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-500">{r.plan ? fmtBaht(r.plan) : '—'}</td>
                        <td className="px-4 py-3 text-center font-black" style={{ color: !r.plan ? '#cbd5e1' : r.plan_rate >= 80 ? GREEN : r.plan_rate >= 50 ? AMBER : RED }}>{r.plan ? `${r.plan_rate}%` : '—'}</td>
                        <td className="px-4 py-3 text-right text-slate-300"><ChevronRight size={16} /></td>
                      </tr>
                    ))}
                    {(d.project_rollup || []).length === 0 && (
                      <tr><td colSpan={10} className="px-4 py-12 text-center text-sm font-bold text-slate-400">ไม่มีข้อมูลโปรเจกต์</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {!loading && tab === 'detail' && (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full" style={{ fontSize: '.8rem' }}>
                  <thead>
                    <tr className="bg-slate-50 text-left text-[.6rem] font-black uppercase text-slate-500">
                      <th className="px-4 py-3">PO / Line</th>
                      <th className="px-4 py-3">ไซต์</th>
                      <th className="px-4 py-3">Vendor/Type</th>
                      <th className="px-4 py-3 text-right">มูลค่า</th>
                      <th className="px-4 py-3">เจ้าของงาน</th>
                      <th className="px-4 py-3">สถานะ</th>
                      <th className="px-4 py-3">เก็บเงิน</th>
                      <th className="px-4 py-3 text-center">AC1/AC2</th>
                      <th className="px-4 py-3">จ่าย DTE</th>
                      <th className="px-4 py-3 text-center">ค้าง(วัน)</th>
                      {canAct && <th className="px-4 py-3 text-right">ทำรายการ</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map(r => (
                      <tr key={r.id} className="border-t border-slate-50 hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <div className="font-black text-slate-800">{r.po_number}</div>
                          <div className="text-[.68rem] font-bold text-slate-400">{r.po_line || '—'}{r.hw_invoice_no ? ` · ${r.hw_invoice_no}` : ''}</div>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-600">{r.cluster_site || r.site_code || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-700">{r.vendor || 'HW'}</div>
                          <div className="text-[.68rem] font-bold text-slate-400">{r.work_type || '—'} · {r.ace_project_code || '—'}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-black text-slate-900">{r.line_amount ? fmtBaht(r.line_amount) : '—'}</td>
                        <td className="px-4 py-3 font-bold text-slate-600">{OWNER_LABELS[r.current_owner_role] || r.current_owner_role || '—'}</td>
                        <td className="px-4 py-3"><span className="text-[.7rem] font-bold text-slate-500">{r.workflow_status}</span></td>
                        <td className="px-4 py-3"><Badge meta={BILLING_META[r.billing_state]} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <Dot on={!!r.ac1_billed_at} label="AC1" />
                            {(r.payment_terms || '').includes('/') && <Dot on={!!r.ac2_billed_at} label="AC2" />}
                          </div>
                        </td>
                        <td className="px-4 py-3"><Badge meta={PAY_META[r.dte_pay_state]} /></td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-black ${r.aging_days > 14 ? 'text-red-600' : r.aging_days > 7 ? 'text-amber-600' : 'text-slate-400'}`}>{r.aging_days}</span>
                        </td>
                        {canAct && (
                          <td className="px-4 py-3">
                            <RowActions row={r} busy={busyId === r.id} onAction={doAction} />
                          </td>
                        )}
                      </tr>
                    ))}
                    {visibleRows.length === 0 && (
                      <tr><td colSpan={canAct ? 11 : 10} className="px-4 py-12 text-center text-sm font-bold text-slate-400">ไม่พบ PO ตามตัวกรอง</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {!loading && tab === 'aging' && (
            <Card className="overflow-hidden">
              <div className="flex items-center gap-2 border-b border-slate-100 bg-red-50/50 px-5 py-4">
                <AlertTriangle size={18} className="text-red-600" />
                <h3 className="text-base font-black text-slate-950">PO ค้างเก็บ — เรียงตามจำนวนวันที่ค้าง</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full" style={{ fontSize: '.8rem' }}>
                  <thead>
                    <tr className="bg-slate-50 text-left text-[.6rem] font-black uppercase text-slate-500">
                      <th className="px-4 py-3 text-center">ค้าง(วัน)</th>
                      <th className="px-4 py-3">PO / Line</th>
                      <th className="px-4 py-3">ไซต์</th>
                      <th className="px-4 py-3">Vendor/Type</th>
                      <th className="px-4 py-3 text-right">มูลค่า</th>
                      <th className="px-4 py-3">สถานะ</th>
                      <th className="px-4 py-3">ค้างที่ใคร</th>
                      <th className="px-4 py-3">เก็บเงิน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(d.aging_watch || []).map(r => (
                      <tr key={r.id} className="border-t border-slate-50 hover:bg-slate-50/60">
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex h-8 w-12 items-center justify-center rounded-lg font-black text-white`}
                            style={{ background: r.aging_days > 14 ? RED : r.aging_days > 7 ? AMBER : SLATE }}>{r.aging_days}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-black text-slate-800">{r.po_number}</div>
                          <div className="text-[.68rem] font-bold text-slate-400">{r.po_line || '—'}</div>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-600">{r.cluster_site || r.site_code || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-700">{r.vendor || 'HW'}</div>
                          <div className="text-[.68rem] font-bold text-slate-400">{r.work_type || '—'} · {r.ace_project_code || '—'}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-black text-slate-900">{r.line_amount ? fmtBaht(r.line_amount) : '—'}</td>
                        <td className="px-4 py-3"><span className="text-[.7rem] font-bold text-slate-500">{r.workflow_status}</span></td>
                        <td className="px-4 py-3 font-bold text-slate-600">{OWNER_LABELS[r.current_owner_role] || r.current_owner_role || '—'}</td>
                        <td className="px-4 py-3"><Badge meta={BILLING_META[r.billing_state]} /></td>
                      </tr>
                    ))}
                    {(d.aging_watch || []).length === 0 && (
                      <tr><td colSpan={8} className="px-4 py-12 text-center text-sm font-bold text-slate-400">ไม่มี PO ค้างเก็บ 🎉</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400">
      <option value="">{placeholder}</option>
      {options.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
    </select>
  )
}
function RowActions({ row, busy, onAction }) {
  const hasAc2 = (row.payment_terms || '').includes('/')
  const btn = 'rounded-lg px-2 py-1 text-[.66rem] font-black transition disabled:opacity-40'
  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {!row.ac1_billed_at
        ? <button disabled={busy} onClick={() => onAction(row, 'bill_ac1')} className={`${btn} bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}>บิล AC1</button>
        : <button disabled={busy} onClick={() => onAction(row, 'unbill_ac1')} className={`${btn} bg-slate-100 text-slate-500 hover:bg-slate-200`}>↩ AC1</button>}
      {hasAc2 && (!row.ac2_billed_at
        ? <button disabled={busy} onClick={() => onAction(row, 'bill_ac2')} className={`${btn} bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}>บิล AC2</button>
        : <button disabled={busy} onClick={() => onAction(row, 'unbill_ac2')} className={`${btn} bg-slate-100 text-slate-500 hover:bg-slate-200`}>↩ AC2</button>)}
      {row.dte_pay_state !== 'N/A' && (row.dte_pay_state !== 'PAID'
        ? <button disabled={busy} onClick={() => onAction(row, 'mark_dte_paid')} className={`${btn} bg-cyan-50 text-cyan-700 hover:bg-cyan-100`}>จ่าย DTE</button>
        : <button disabled={busy} onClick={() => onAction(row, 'unmark_dte_paid')} className={`${btn} bg-slate-100 text-slate-500 hover:bg-slate-200`}>↩ DTE</button>)}
    </div>
  )
}
function Dot({ on, label }) {
  return (
    <span className="inline-flex items-center gap-1 text-[.62rem] font-black"
      style={{ color: on ? GREEN : '#cbd5e1' }} title={`${label} ${on ? 'billed' : 'pending'}`}>
      <span className="h-2 w-2 rounded-full" style={{ background: on ? GREEN : '#cbd5e1' }} />{label}
    </span>
  )
}
