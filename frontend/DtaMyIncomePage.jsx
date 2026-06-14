// DtaMyIncomePage — DTA self view of their own cluster income + pay status.
// Mounted at /project/dta-income. Read-only (Finance marks paid). Mirrors the
// income summary of ReportUploadPage but DTA earns a flat per-cluster rate and
// has no report upload.

import React, { useState, useEffect, useCallback } from 'react'
import {
  Wallet, TrendingUp, Clock, CheckCircle2, Layers, RefreshCw, CalendarDays, Package,
} from 'lucide-react'
import { apiFetch } from './src/apiFetch.js'

const ACE_BLUE = '#2447d8'
const PURPLE   = '#7c3aed'
const AMBER    = '#b45309'
const GREEN    = '#16a34a'

function fmtBaht(n) {
  if (n == null) return '—'
  return '฿' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}
function monthLabel(ym) {
  if (!ym) return ym
  const [y, m] = ym.split('-')
  const names = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${names[parseInt(m, 10)] || m} ${y}`
}
function currentYearMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
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

export default function DtaMyIncomePage({ authenticatedUser, onLogout }) {
  const [rows, setRows] = useState([])
  const [byCycle, setByCycle] = useState([])
  const [monthly, setMonthly] = useState([])
  const [currentCycle, setCurrentCycle] = useState(null)
  const [incomeView, setIncomeView] = useState('cycle')  // 'cycle' | 'month'
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/presite/dta/my-income')
      const d = await res.json()
      setRows(d.data || [])
      setByCycle(d.by_cycle || [])
      setMonthly(d.monthly || [])
      setCurrentCycle(d.current_cycle || null)
    } catch {
      setRows([]); setByCycle([]); setMonthly([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  const name = authenticatedUser?.name
    || `${authenticatedUser?.firstName || ''} ${authenticatedUser?.lastName || ''}`.trim()

  const thisMonth = currentYearMonth()
  const totalIncome = rows.reduce((a, r) => a + (r.income || 0), 0)
  const paidIncome = rows.reduce((a, r) => a + (r.paid ? r.income : 0), 0)
  const unpaidIncome = totalIncome - paidIncome
  const thisCycleRow = byCycle.find(c => c.cycle === currentCycle?.cycle)

  const incomeRows = incomeView === 'cycle' ? byCycle : monthly
  const labelKey = incomeView === 'cycle' ? 'cycle' : 'month'

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
              <div className="text-sm font-black text-slate-950">My DTA Income</div>
              <div className="text-[.65rem] font-bold text-slate-400">{name || 'DTA'} · cluster earnings & pay status</div>
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
              <Layers size={14} /> DTA · My Clusters
            </div>
            <h1 className="mt-4 text-3xl font-black text-slate-950 sm:text-4xl">My DTA Income</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
              Fixed per-cluster rate on PAC work. Finance pays in two monthly rounds by approval date.
            </p>
          </div>

          <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Total Income" value={fmtBaht(totalIncome)} helper={`${rows.length} clusters · all periods`} tone={ACE_BLUE} icon={TrendingUp} />
            <StatCard label="Paid" value={fmtBaht(paidIncome)} helper="Already paid" tone={GREEN} icon={CheckCircle2} />
            <StatCard label="Unpaid" value={fmtBaht(unpaidIncome)} helper="Awaiting payment" tone={AMBER} icon={Clock} />
            <StatCard label="This Round" value={fmtBaht(thisCycleRow ? thisCycleRow.total : 0)} helper={currentCycle ? `${currentCycle.cycle} · pay ${currentCycle.pay_date}` : ''} tone={PURPLE} icon={Wallet} />
          </section>

          {/* Income breakdown — Round / Month toggle */}
          {incomeRows.length > 0 && (
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <h3 className="inline-flex items-center gap-2 text-base font-black text-slate-950"><CalendarDays size={18} style={{ color: PURPLE }} /> Income Breakdown</h3>
                <div className="inline-flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                  {[['cycle', 'Round'], ['month', 'Month']].map(([v, l]) => (
                    <button key={v} onClick={() => setIncomeView(v)}
                      className={`rounded-md px-3 py-1 text-xs font-black transition ${incomeView === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{l}</button>
                  ))}
                </div>
              </div>
              {incomeView === 'cycle' && currentCycle?.cycle && (
                <div className="border-b border-slate-100 bg-blue-50/40 px-6 py-2 text-[.7rem] font-bold text-slate-500">
                  Pay rounds: <b>R1</b> = approved 1–15 (pay 15th) · <b>R2</b> = approved 16–end (pay month-end). Current: <b className="text-slate-700">{currentCycle.cycle}</b> · next pay {currentCycle.pay_date}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full" style={{ fontSize: '.82rem' }}>
                  <thead>
                    <tr className="bg-slate-50 text-left text-[.62rem] font-black uppercase tracking-wide text-slate-500">
                      <th className="px-6 py-3">{incomeView === 'cycle' ? 'Round' : 'Month'}</th>
                      <th className="px-6 py-3 text-center">Clusters</th>
                      <th className="px-6 py-3 text-right">Total</th>
                      <th className="px-6 py-3 text-right">Paid</th>
                      <th className="px-6 py-3 text-right">Unpaid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomeRows.map(r => {
                      const key = r[labelKey]
                      const isCurrent = (incomeView === 'month' && key === thisMonth)
                        || (incomeView === 'cycle' && key === currentCycle?.cycle)
                      return (
                        <tr key={key} className={`border-t border-slate-100 ${isCurrent ? 'bg-emerald-50/50' : ''}`}>
                          <td className="px-6 py-3 font-black text-slate-900">
                            {incomeView === 'cycle' ? key : monthLabel(key)}
                            {incomeView === 'cycle' && r.pay_date && <span className="ml-2 text-[.58rem] font-bold text-slate-400">pay {r.pay_date}</span>}
                            {isCurrent && <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[.55rem] font-black text-emerald-700">CURRENT</span>}
                          </td>
                          <td className="px-6 py-3 text-center font-bold text-slate-700">{r.sites}</td>
                          <td className="px-6 py-3 text-right font-mono font-black text-slate-900">{fmtBaht(r.total)}</td>
                          <td className="px-6 py-3 text-right font-mono font-bold text-emerald-700">{r.paid > 0 ? fmtBaht(r.paid) : '—'}</td>
                          <td className="px-6 py-3 text-right font-mono font-bold text-amber-600">{r.unpaid > 0 ? fmtBaht(r.unpaid) : '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 bg-slate-50">
                      <td className="px-6 py-3 font-black text-slate-900">Total ({incomeRows.length} {incomeView === 'cycle' ? 'rounds' : 'months'})</td>
                      <td className="px-6 py-3 text-center font-black text-slate-700">{incomeRows.reduce((a,r)=>a+r.sites,0)}</td>
                      <td className="px-6 py-3 text-right font-mono font-black text-slate-900">{fmtBaht(totalIncome)}</td>
                      <td className="px-6 py-3 text-right font-mono font-black text-emerald-700">{fmtBaht(paidIncome)}</td>
                      <td className="px-6 py-3 text-right font-mono font-black text-amber-600">{fmtBaht(unpaidIncome)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          )}

          {/* All clusters — read-only history */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-base font-black text-slate-950">All My Clusters · History</h3>
              <button onClick={reload}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-50">
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
            {loading ? (
              <div className="p-12 text-center text-sm font-bold text-slate-400">Loading…</div>
            ) : rows.length === 0 ? (
              <div className="p-12 text-center">
                <Package size={40} className="mx-auto text-slate-300" />
                <div className="mt-3 text-sm font-bold text-slate-400">No clusters assigned to you yet</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" style={{ fontSize: '.82rem' }}>
                  <thead>
                    <tr className="bg-slate-50 text-left text-[.62rem] font-black uppercase tracking-wide text-slate-500">
                      <th className="px-6 py-3">Cluster</th>
                      <th className="px-6 py-3">Rate Category</th>
                      <th className="px-6 py-3">Approved</th>
                      <th className="px-6 py-3">Pay Round</th>
                      <th className="px-6 py-3 text-center">Payment</th>
                      <th className="px-6 py-3 text-right">Income</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(r => (
                      <tr key={r.tracking_id} className="border-t border-slate-100 hover:bg-slate-50/60">
                        <td className="px-6 py-4 font-mono font-black" style={{ color: PURPLE }}>{r.site_code}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[.6rem] font-black" style={{ background: `${PURPLE}14`, color: PURPLE }}>
                            <Layers size={11} /> {r.category}{r.site_count > 1 ? ` ×${r.site_count}` : ''}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {r.approved_at
                            ? <div className="text-xs font-bold text-slate-700">{(r.approved_at || '').slice(0, 10)}</div>
                            : <span className="text-xs font-bold text-slate-300">—</span>}
                        </td>
                        <td className="px-6 py-4">
                          {r.cycle
                            ? <div><div className="font-mono text-[.66rem] font-black text-slate-700">{r.cycle}</div><div className="text-[.56rem] font-bold text-slate-400">pay {r.pay_date}</div></div>
                            : <span className="text-xs font-bold text-slate-300">—</span>}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {r.paid
                            ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[.6rem] font-black text-emerald-700" title={r.dta_paid_at ? `Paid ${fmtDate(r.dta_paid_at)}${r.dta_payment_ref ? ' · ' + r.dta_payment_ref : ''}` : 'Paid'}><CheckCircle2 size={11} /> Paid</span>
                            : <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[.6rem] font-black text-amber-700"><Clock size={11} /> Unpaid</span>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="font-mono font-black text-slate-900">{fmtBaht(r.income)}</div>
                          {r.site_count > 1 && <div className="text-[.58rem] font-bold text-slate-400">{fmtBaht(r.rate)} ×{r.site_count}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}
