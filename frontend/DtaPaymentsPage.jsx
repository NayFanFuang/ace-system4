// DtaPaymentsPage — Finance monitor for DTA payments.
// Who to pay · how much · details · mark paid. Mounted at /finance/dta-payments.
// Role-gated (Finance/PM/Admin) via platformRoutes. Mirrors DtePaymentsPage,
// but DTA earns a flat per-cluster rate on PAC work (no DT/Report split, no .rar).

import React, { useState, useEffect, useCallback } from 'react'
import {
  Wallet, Clock, CheckCircle2, Users, RefreshCw, Layers,
  Filter, BadgeCheck, BarChart3, PieChart, FileSpreadsheet, Printer,
} from 'lucide-react'
import { apiFetch } from './src/apiFetch.js'

const ACE_BLUE = '#2447d8'
const PURPLE   = '#7c3aed'
const AMBER    = '#b45309'
const GREEN    = '#16a34a'
const RED      = '#dc2626'

function fmtBaht(n) {
  if (n == null) return '—'
  return '฿' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}
function monthLabel(ym) {
  if (!ym) return 'All months'
  const [y, m] = ym.split('-')
  const names = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${names[parseInt(m, 10)] || m} ${y}`
}

function Card({ children, className = '' }) {
  return <section className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.06)] ${className}`}>{children}</section>
}
function StatCard({ label, value, helper, tone = ACE_BLUE, icon: Icon }) {
  return (
    <Card className="p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `${tone}12`, color: tone }}>
        <Icon size={21} strokeWidth={2.3} />
      </div>
      <div className="mt-5 text-xs font-black uppercase tracking-[.08em] text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-black text-slate-950">{value}</div>
      {helper && <div className="mt-1 text-xs font-semibold text-slate-400">{helper}</div>}
    </Card>
  )
}

export default function DtaPaymentsPage({ authenticatedUser, onLogout }) {
  const [rows, setRows] = useState([])
  const [byDta, setByDta] = useState([])
  const [monthly, setMonthly] = useState([])
  const [byCycle, setByCycle] = useState([])
  const [currentCycle, setCurrentCycle] = useState(null)
  const [totals, setTotals] = useState({})
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')  // all | paid | unpaid
  const [monthFilter, setMonthFilter] = useState('')
  const [cycleFilter, setCycleFilter] = useState('')
  const [dtaFilter, setDtaFilter] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [assigningId, setAssigningId] = useState(null)  // row id showing the picker

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      if (monthFilter) params.set('month', monthFilter)
      if (cycleFilter) params.set('cycle', cycleFilter)
      if (dtaFilter) params.set('dta_code', dtaFilter)
      const res = await apiFetch(`/api/presite/dta/finance/payments?${params.toString()}`)
      const d = await res.json()
      setRows(d.data || [])
      setByDta(d.by_dta || [])
      setMonthly(d.monthly || [])
      setByCycle(d.by_cycle || [])
      setCurrentCycle(d.current_cycle || null)
      setTotals(d.totals || {})
    } catch {
      setRows([]); setByDta([]); setMonthly([]); setByCycle([]); setTotals({})
    } finally {
      setLoading(false)
    }
  }, [statusFilter, monthFilter, cycleFilter, dtaFilter])

  useEffect(() => { reload() }, [reload])

  // DTA candidates for the assign dropdown (active login users)
  useEffect(() => {
    apiFetch('/api/presite/dta-candidates')
      .then(r => r.ok ? r.json() : { data: [] })
      .then(d => setCandidates(d.data || []))
      .catch(() => setCandidates([]))
  }, [])

  const monthsAvailable = Array.from(new Set(rows.map(r => r.month).filter(Boolean))).sort().reverse()

  async function markPaid(id) {
    const ref = window.prompt('Payment reference (optional):', '')
    if (ref === null) return
    setBusyId(id)
    try {
      const res = await apiFetch(`/api/presite/tracking/${id}/dta-mark-paid`, {
        method: 'POST', body: JSON.stringify({ payment_ref: ref || null }),
      })
      if (!res.ok) { const e = await res.json().catch(()=>({})); alert(e.detail || 'Failed'); return }
      await reload()
    } finally { setBusyId(null) }
  }
  async function unmarkPaid(id) {
    if (!window.confirm('Revert this payment to UNPAID?')) return
    setBusyId(id)
    try {
      const res = await apiFetch(`/api/presite/tracking/${id}/dta-unmark-paid`, { method: 'POST' })
      if (!res.ok) { const e = await res.json().catch(()=>({})); alert(e.detail || 'Failed'); return }
      await reload()
    } finally { setBusyId(null) }
  }

  // Assign / change / clear the DTA for a cluster row (code from the dropdown)
  async function assignDta(id, code) {
    setBusyId(id)
    setAssigningId(null)
    try {
      const res = await apiFetch(`/api/presite/tracking/${id}/assign-dta`, {
        method: 'POST', body: JSON.stringify({ dta_code: code || null }),
      })
      if (!res.ok) { const e = await res.json().catch(()=>({})); alert(e.detail || 'Failed'); return }
      await reload()
    } finally { setBusyId(null) }
  }

  // Batch-pay every payable cluster in one cycle (Round 1 / Round 2)
  async function payWholeCycle(cycle, payableAmount) {
    if (!cycle) return
    const ref = window.prompt(`Pay ALL ready clusters in cycle ${cycle} (${fmtBaht(payableAmount)}).\nPayment reference (optional):`, cycle)
    if (ref === null) return
    setBusyId(`cycle:${cycle}`)
    try {
      const res = await apiFetch('/api/presite/dta/finance/pay-cycle', {
        method: 'POST', body: JSON.stringify({ cycle, payment_ref: ref || null, dte_code: dtaFilter || null }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { alert(d.detail || 'Failed'); return }
      alert(`Paid ${d.paid_count} cluster(s) · ${fmtBaht(d.total)}${d.skipped ? ` · ${d.skipped} skipped (not ready)` : ''}`)
      await reload()
    } finally { setBusyId(null) }
  }

  async function exportExcel() {
    const params = new URLSearchParams()
    if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
    if (monthFilter) params.set('month', monthFilter)
    if (cycleFilter) params.set('cycle', cycleFilter)
    if (dtaFilter) params.set('dta_code', dtaFilter)
    try {
      const res = await apiFetch(`/api/presite/dta/finance/payments/export?${params.toString()}`)
      if (!res.ok) { alert('Export failed (HTTP ' + res.status + ')'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `DTA_Payments_${monthFilter || 'all'}_${statusFilter}.xlsx`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    } catch { alert('Export error') }
  }

  // PDF voucher for one DTA — open a printable window (Save as PDF)
  function printVoucher(dtaCode) {
    const items = rows.filter(r => r.dta_code === dtaCode)
    if (items.length === 0) { alert('No rows for this DTA'); return }
    const dtaName = items[0].dta_name || dtaCode
    const total = items.reduce((a, r) => a + r.income, 0)
    const paid = items.reduce((a, r) => a + (r.paid ? r.income : 0), 0)
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const rowsHtml = items.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${r.site_code}</td>
        <td>${r.category}</td>
        <td style="text-align:center">${r.site_count || 1}</td>
        <td>${(r.approved_at || '').slice(0,10) || '-'}</td>
        <td>${r.cycle || '-'}</td>
        <td style="text-align:right">${fmtBaht(r.income)}</td>
        <td style="text-align:center">${r.paid ? 'PAID' : (r.payable ? 'READY' : 'UNPAID')}</td>
        <td>${r.dta_payment_ref || ''}</td>
      </tr>`).join('')
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>DTA Payment Voucher — ${dtaName}</title>
      <style>
        body{font-family:-apple-system,'Segoe UI',Tahoma,sans-serif;padding:32px;color:#0f172a}
        h1{font-size:20px;margin:0}
        .muted{color:#64748b;font-size:12px}
        .box{border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-top:16px}
        table{width:100%;border-collapse:collapse;margin-top:12px;font-size:12px}
        th,td{border:1px solid #e2e8f0;padding:6px 8px;text-align:left}
        th{background:#1e293b;color:#fff;font-size:11px}
        tfoot td{font-weight:800;background:#f8fafc}
        .tots{display:flex;gap:24px;margin-top:16px;font-size:14px}
        .tots b{font-size:18px}
        .sign{margin-top:48px;display:flex;justify-content:space-between}
        .sign div{width:40%;border-top:1px solid #0f172a;padding-top:6px;text-align:center;font-size:12px}
        @media print{.noprint{display:none}}
      </style></head><body>
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div><h1>DTA Payment Voucher</h1><div class="muted">AirConnect Engineering · HWT2304</div></div>
        <div class="muted" style="text-align:right">Issued: ${today}<br/>Voucher: PVA-${dtaCode}-${Date.now().toString().slice(-6)}</div>
      </div>
      <div class="box">
        <div><b>Payee (DTA):</b> ${dtaName} <span class="muted">(${dtaCode})</span></div>
        <div class="muted">${items.length} cluster(s) · rate = fixed per cluster (per DTA rate sheet)</div>
      </div>
      <table>
        <thead><tr><th>#</th><th>Cluster</th><th>Rate Category</th><th>Sites</th><th>Approved</th><th>Cycle</th><th style="text-align:right">Income (THB)</th><th>Status</th><th>Pay Ref</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
        <tfoot><tr><td colspan="6">TOTAL</td><td style="text-align:right">${fmtBaht(total)}</td><td colspan="2"></td></tr></tfoot>
      </table>
      <div class="tots">
        <div>Total: <b>${fmtBaht(total)}</b></div>
        <div style="color:#16a34a">Paid: <b>${fmtBaht(paid)}</b></div>
        <div style="color:#b45309">Unpaid: <b>${fmtBaht(total - paid)}</b></div>
      </div>
      <div class="sign">
        <div>Prepared by (Finance)</div>
        <div>Received by (DTA)</div>
      </div>
      <div class="noprint" style="margin-top:24px;text-align:center">
        <button onclick="window.print()" style="padding:10px 24px;font-weight:800;background:#2447d8;color:#fff;border:0;border-radius:8px;cursor:pointer">🖨 Print / Save as PDF</button>
      </div>
      <script>window.onload=()=>setTimeout(()=>window.print(),400)</script>
      </body></html>`
    const w = window.open('', '_blank')
    if (!w) { alert('Popup blocked — please allow popups'); return }
    w.document.write(html); w.document.close()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-lg"
                 style={{ background: `linear-gradient(135deg, ${PURPLE}, ${ACE_BLUE})` }}>
              <Wallet size={20} />
            </div>
            <div>
              <div className="text-sm font-black text-slate-950">DTA Payments Monitor</div>
              <div className="text-[.65rem] font-bold text-slate-400">Finance · who to pay & how much</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/overview" className="text-xs font-black text-slate-500 hover:text-slate-800">Overview</a>
            <button onClick={onLogout} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-50">Logout</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700">
              <Wallet size={14} /> Finance · DTA Payments
            </div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="mt-4 text-3xl font-black text-slate-950 sm:text-4xl">DTA Payments Monitor</h1>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                  DTA earns a fixed per-cluster rate on PAC work. Track what needs paying, to whom, and mark paid once disbursed.
                </p>
              </div>
              <button onClick={exportExcel}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black text-white shadow-lg hover:opacity-90"
                style={{ background: GREEN }}>
                <FileSpreadsheet size={16} /> Export Excel (evidence)
              </button>
            </div>
          </div>

          <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="To Pay (Unpaid)" value={fmtBaht(totals.unpaid)} helper={`${totals.sites || 0} clusters total`} tone={AMBER} icon={Clock} />
            <StatCard label="Ready to Pay" value={fmtBaht(totals.payable)} helper="Approved + unpaid" tone={RED} icon={BadgeCheck} />
            <StatCard label="Paid" value={fmtBaht(totals.paid)} helper="Already disbursed" tone={GREEN} icon={CheckCircle2} />
            <StatCard label="DTAs" value={totals.dtas || 0} helper="With records" tone={PURPLE} icon={Users} />
          </section>

          {/* Pay cycles — Round 1 (1–15) / Round 2 (16–EOM), by approval date */}
          {byCycle.length > 0 && (
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <h3 className="inline-flex items-center gap-2 text-base font-black text-slate-950"><Clock size={18} style={{ color: ACE_BLUE }} /> Pay Cycles</h3>
                {currentCycle?.cycle && <span className="text-[.66rem] font-bold text-slate-400">Current: <b className="text-slate-600">{currentCycle.cycle}</b> · next pay {currentCycle.pay_date}</span>}
              </div>
              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                {byCycle.map(c => {
                  const active = cycleFilter === c.cycle
                  const busy = busyId === `cycle:${c.cycle}`
                  return (
                    <div key={c.cycle} className={`rounded-xl border p-4 ${active ? 'border-blue-400 bg-blue-50/40' : 'border-slate-200 bg-white'}`}>
                      <div className="flex items-center justify-between">
                        <button onClick={() => setCycleFilter(active ? '' : c.cycle)} className="text-left">
                          <div className="font-mono text-sm font-black text-slate-900">{c.cycle}</div>
                          <div className="text-[.6rem] font-bold text-slate-400">pay {c.pay_date} · {c.sites} cluster(s)</div>
                        </button>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[.58rem] font-black text-slate-500">{active ? 'FILTERED' : 'filter'}</span>
                      </div>
                      <div className="mt-3 flex items-end justify-between">
                        <div>
                          <div className="text-[.58rem] font-bold uppercase text-slate-400">Ready to pay</div>
                          <div className="font-mono text-lg font-black" style={{ color: c.payable > 0 ? RED : '#94a3b8' }}>{fmtBaht(c.payable)}</div>
                        </div>
                        <button disabled={busy || c.payable <= 0} onClick={() => payWholeCycle(c.cycle, c.payable)}
                          title={c.payable <= 0 ? 'Nothing ready to pay in this cycle' : `Pay all ready clusters in ${c.cycle}`}
                          className="rounded-lg px-3 py-1.5 text-xs font-black text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40" style={{ background: GREEN }}>
                          {busy ? '…' : 'Pay cycle'}
                        </button>
                      </div>
                      <div className="mt-2 flex gap-3 text-[.58rem] font-bold text-slate-400">
                        <span className="text-emerald-600">paid {fmtBaht(c.paid)}</span>
                        <span className="text-amber-600">unpaid {fmtBaht(c.unpaid)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2">
              <h3 className="mb-4 inline-flex items-center gap-2 text-base font-black text-slate-950"><BarChart3 size={18} style={{ color: ACE_BLUE }} /> Monthly — Paid vs Unpaid</h3>
              <MonthlyBars monthly={monthly} />
            </Card>
            <Card className="p-5">
              <h3 className="mb-4 inline-flex items-center gap-2 text-base font-black text-slate-950"><PieChart size={18} style={{ color: GREEN }} /> Paid vs Unpaid</h3>
              <PaidDonut paid={totals.paid || 0} unpaid={totals.unpaid || 0} />
            </Card>
          </section>

          {/* By-DTA summary */}
          {byDta.length > 0 && (
            <Card className="overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4">
                <h3 className="inline-flex items-center gap-2 text-base font-black text-slate-950"><Users size={18} style={{ color: PURPLE }} /> Summary by DTA</h3>
              </div>
              <div className="px-6 py-4 border-b border-slate-100">
                <DtaBars byDta={byDta} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full" style={{ fontSize: '.82rem' }}>
                  <thead>
                    <tr className="bg-slate-50 text-left text-[.62rem] font-black uppercase text-slate-500">
                      <th className="px-6 py-3">DTA</th>
                      <th className="px-6 py-3 text-center">Clusters</th>
                      <th className="px-6 py-3 text-right">Total</th>
                      <th className="px-6 py-3 text-right">Paid</th>
                      <th className="px-6 py-3 text-right">Unpaid</th>
                      <th className="px-6 py-3 text-right">Ready to Pay</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byDta.map(b => (
                      <tr key={b.dta_code} className="border-t border-slate-100 hover:bg-slate-50/60">
                        <td className="px-6 py-3 font-black text-slate-900">{b.dta_name}<div className="text-[.6rem] font-mono font-bold text-slate-400">{b.dta_code}</div></td>
                        <td className="px-6 py-3 text-center font-bold text-slate-700">{b.sites}</td>
                        <td className="px-6 py-3 text-right font-mono font-bold text-slate-700">{fmtBaht(b.total)}</td>
                        <td className="px-6 py-3 text-right font-mono font-bold text-emerald-700">{b.paid > 0 ? fmtBaht(b.paid) : '—'}</td>
                        <td className="px-6 py-3 text-right font-mono font-black text-amber-600">{b.unpaid > 0 ? fmtBaht(b.unpaid) : '—'}</td>
                        <td className="px-6 py-3 text-right font-mono font-black" style={{ color: b.payable > 0 ? RED : '#cbd5e1' }}>{b.payable > 0 ? fmtBaht(b.payable) : '—'}</td>
                        <td className="px-6 py-3 text-right">
                          <div className="inline-flex gap-1.5">
                            <button onClick={() => setDtaFilter(b.dta_code === dtaFilter ? '' : b.dta_code)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-black ${dtaFilter === b.dta_code ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                              {dtaFilter === b.dta_code ? 'Filtered' : 'View'}
                            </button>
                            <button onClick={() => printVoucher(b.dta_code)} title="PDF payment voucher"
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-50">
                              <Printer size={13} /> Voucher
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Detail table */}
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
              <h3 className="inline-flex items-center gap-2 text-base font-black text-slate-950"><Filter size={18} style={{ color: ACE_BLUE }} /> Payment Detail</h3>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                  {[['all', 'All'], ['unpaid', 'Unpaid'], ['paid', 'Paid']].map(([v, l]) => (
                    <button key={v} onClick={() => setStatusFilter(v)}
                      className={`rounded-md px-3 py-1 text-xs font-black ${statusFilter === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{l}</button>
                  ))}
                </div>
                <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700">
                  <option value="">All months</option>
                  {monthsAvailable.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
                </select>
                {dtaFilter && (
                  <button onClick={() => setDtaFilter('')} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">DTA: {dtaFilter} ✕</button>
                )}
                <button onClick={reload} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-50"><RefreshCw size={14} /> Refresh</button>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-sm font-bold text-slate-400">Loading…</div>
            ) : rows.length === 0 ? (
              <div className="p-12 text-center text-sm font-bold text-slate-400">No payments match the filters</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" style={{ fontSize: '.8rem' }}>
                  <thead>
                    <tr className="bg-slate-50 text-left text-[.6rem] font-black uppercase text-slate-500">
                      <th className="px-4 py-3">Cluster</th>
                      <th className="px-4 py-3">DTA</th>
                      <th className="px-4 py-3">Rate Category</th>
                      <th className="px-4 py-3">DT Date</th>
                      <th className="px-4 py-3">Approved</th>
                      <th className="px-4 py-3">Cycle</th>
                      <th className="px-4 py-3 text-right">Income</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(r => (
                      <tr key={r.tracking_id} className={`border-t border-slate-100 hover:bg-slate-50/60 ${r.payable ? 'bg-red-50/30' : ''}`}>
                        <td className="px-4 py-3 font-mono font-black" style={{ color: PURPLE }}>{r.site_code}</td>
                        <td className="px-4 py-3">
                          {r.dta_code
                            ? <div className="font-bold text-slate-700">{r.dta_name}<div className="text-[.58rem] font-mono text-slate-400">{r.dta_code}</div></div>
                            : <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[.58rem] font-black text-rose-600">unassigned</span>}
                          {!r.paid && (assigningId === r.tracking_id ? (
                            <select autoFocus defaultValue={r.dta_code || ''} disabled={busyId === r.tracking_id}
                              onChange={e => assignDta(r.tracking_id, e.target.value)}
                              onBlur={() => setAssigningId(null)}
                              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-1.5 py-1 text-[.62rem] font-bold text-slate-700">
                              <option value="">— clear —</option>
                              {candidates.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
                            </select>
                          ) : (
                            <button onClick={() => setAssigningId(r.tracking_id)}
                              className="mt-1 block text-[.58rem] font-black text-blue-600 hover:underline">
                              {r.dta_code ? 'change' : '+ assign DTA'}
                            </button>
                          ))}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[.6rem] font-black" style={{ background: `${PURPLE}14`, color: PURPLE }}>
                            <Layers size={10} /> {r.category}{r.site_count > 1 ? ` ×${r.site_count}` : ''}
                          </span>
                          {r.needs_review && <div className="mt-0.5 text-[.56rem] font-black text-amber-600" title={r.review_reason || 'Rate is a best-guess default — verify before paying'}>⚠ verify rate</div>}
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-500">{r.dt_done_date || '—'}</td>
                        <td className="px-4 py-3">
                          {r.approved_at
                            ? <div><div className="text-xs font-bold text-emerald-700">{(r.approved_at||'').slice(0,10)}</div><div className="text-[.56rem] font-bold text-slate-400">{r.approved_by_name}</div></div>
                            : <span className="text-xs font-bold text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {r.cycle
                            ? <div><div className="font-mono text-[.66rem] font-black text-slate-700">{r.cycle}</div><div className="text-[.56rem] font-bold text-slate-400">pay {r.pay_date}</div></div>
                            : <span className="text-xs font-bold text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-mono font-black text-slate-900">{fmtBaht(r.income)}</div>
                          <div className="text-[.56rem] font-bold text-slate-400">{fmtBaht(r.rate)}{r.site_count > 1 ? ` ×${r.site_count}` : ''}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {r.paid
                            ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[.6rem] font-black text-emerald-700" title={r.dta_payment_ref ? `Ref ${r.dta_payment_ref}` : ''}><CheckCircle2 size={11} /> Paid</span>
                            : r.payable
                              ? <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[.6rem] font-black text-red-700"><BadgeCheck size={11} /> Ready</span>
                              : <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[.6rem] font-black text-amber-700"><Clock size={11} /> Unpaid</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {r.paid
                            ? <button disabled={busyId === r.tracking_id} onClick={() => unmarkPaid(r.tracking_id)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-500 hover:bg-slate-50">Unmark</button>
                            : <button disabled={busyId === r.tracking_id || !r.payable} onClick={() => markPaid(r.tracking_id)} title={!r.payable ? 'Not ready: needs ACE approval' : ''} className="rounded-lg px-3 py-1.5 text-xs font-black text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40" style={{ background: GREEN }}>{busyId === r.tracking_id ? '…' : 'Mark Paid'}</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 bg-slate-50">
                      <td className="px-4 py-3 font-black text-slate-900" colSpan={6}>Total ({rows.length} clusters)</td>
                      <td className="px-4 py-3 text-right font-mono font-black text-slate-900">{fmtBaht(rows.reduce((a,r)=>a+r.income,0))}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}

// ── Charts (pure CSS/SVG, no dependency) ────────────────────────────────────

function MonthlyBars({ monthly }) {
  if (!monthly || monthly.length === 0) return <div className="py-8 text-center text-sm font-bold text-slate-300">No data</div>
  const max = Math.max(1, ...monthly.map(m => m.total))
  return (
    <div>
      <div className="flex items-end gap-4" style={{ height: 200 }}>
        {monthly.map(m => {
          const paidH = (m.paid / max) * 170
          const unpaidH = (m.unpaid / max) * 170
          return (
            <div key={m.month} className="flex flex-1 flex-col items-center justify-end gap-1" style={{ minWidth: 40 }}>
              <div className="text-[.6rem] font-black text-slate-700">{fmtBaht(m.total)}</div>
              <div className="flex w-full flex-col items-stretch justify-end" style={{ height: 170 }}>
                {m.unpaid > 0 && (
                  <div title={`Unpaid ${fmtBaht(m.unpaid)}`} style={{ height: Math.max(2, unpaidH), background: AMBER, borderRadius: m.paid > 0 ? '6px 6px 0 0' : 6 }} />
                )}
                {m.paid > 0 && (
                  <div title={`Paid ${fmtBaht(m.paid)}`} style={{ height: Math.max(2, paidH), background: GREEN, borderRadius: m.unpaid > 0 ? '0 0 6px 6px' : 6 }} />
                )}
              </div>
              <div className="text-[.62rem] font-black text-slate-500">{monthLabel(m.month).split(' ')[0]}</div>
              <div className="text-[.55rem] font-bold text-slate-400">{m.sites} clusters</div>
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex items-center justify-center gap-4 text-[.62rem] font-bold text-slate-500">
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded" style={{ background: GREEN }} /> Paid</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded" style={{ background: AMBER }} /> Unpaid</span>
      </div>
    </div>
  )
}

function PaidDonut({ paid, unpaid }) {
  const total = paid + unpaid
  const pct = total > 0 ? (paid / total) : 0
  const R = 54, C = 2 * Math.PI * R
  const dash = C * pct
  return (
    <div className="flex flex-col items-center">
      <svg width="150" height="150" viewBox="0 0 150 150">
        <circle cx="75" cy="75" r={R} fill="none" stroke={AMBER} strokeWidth="18" />
        <circle cx="75" cy="75" r={R} fill="none" stroke={GREEN} strokeWidth="18"
          strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={C * 0.25} transform="rotate(-90 75 75)" strokeLinecap="round" />
        <text x="75" y="70" textAnchor="middle" className="fill-slate-900" style={{ fontSize: 24, fontWeight: 900 }}>{Math.round(pct * 100)}%</text>
        <text x="75" y="92" textAnchor="middle" className="fill-slate-400" style={{ fontSize: 10, fontWeight: 700 }}>PAID</text>
      </svg>
      <div className="mt-3 w-full space-y-1.5 text-xs font-bold">
        <div className="flex items-center justify-between"><span className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full" style={{ background: GREEN }} /> Paid</span><span className="font-mono text-emerald-700">{fmtBaht(paid)}</span></div>
        <div className="flex items-center justify-between"><span className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full" style={{ background: AMBER }} /> Unpaid</span><span className="font-mono text-amber-600">{fmtBaht(unpaid)}</span></div>
        <div className="flex items-center justify-between border-t border-slate-100 pt-1.5"><span className="text-slate-500">Total</span><span className="font-mono font-black text-slate-900">{fmtBaht(total)}</span></div>
      </div>
    </div>
  )
}

function DtaBars({ byDta }) {
  if (!byDta || byDta.length === 0) return null
  const max = Math.max(1, ...byDta.map(b => b.total))
  return (
    <div className="space-y-3">
      {byDta.map(b => {
        const paidPct = (b.paid / max) * 100
        const unpaidPct = (b.unpaid / max) * 100
        return (
          <div key={b.dta_code}>
            <div className="mb-1 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700">{b.dta_name}</span>
              <span className="font-mono text-slate-500">{fmtBaht(b.total)}</span>
            </div>
            <div className="flex h-5 w-full overflow-hidden rounded-lg bg-slate-100">
              {b.paid > 0 && <div title={`Paid ${fmtBaht(b.paid)}`} style={{ width: `${paidPct}%`, background: GREEN }} />}
              {b.unpaid > 0 && <div title={`Unpaid ${fmtBaht(b.unpaid)}`} style={{ width: `${unpaidPct}%`, background: AMBER }} />}
            </div>
          </div>
        )
      })}
      <div className="flex items-center justify-end gap-4 pt-1 text-[.62rem] font-bold text-slate-500">
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded" style={{ background: GREEN }} /> Paid</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded" style={{ background: AMBER }} /> Unpaid</span>
      </div>
    </div>
  )
}
