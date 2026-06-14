import React, { useEffect, useMemo, useState } from 'react'
import {
  Bell, BookCheck, CalendarDays, CheckCircle2, ChevronDown, Coins, Download,
  FileSpreadsheet, FileText, FileUp, Home, LogOut, Menu, RotateCcw, ScanLine,
  Search, Trash2, Wallet, X, AlertTriangle,
} from 'lucide-react'
import { apiFetch } from './src/apiFetch.js'

const ACE_BLUE = '#2447d8'
const ACE_RED = '#c73b32'
const COMPANY = 'AirConnect Engineering'

const FINANCE_NAV = [
  { href: '/finance/revenue-expense', label: 'Revenue & Expense', icon: FileSpreadsheet },
  { href: '/finance/po-import', label: 'PO Import (HW)', icon: FileUp },
  { href: '/finance/dte-payments', label: 'DTE Payments', icon: FileText },
  { href: '/finance/bill-reader', label: 'Bill Reader → PV', icon: ScanLine },
  { href: '/finance/accounting', label: 'Accounting (PV Ledger)', icon: BookCheck, active: true },
]

const STATUS_META = {
  DRAFT: { label: 'Draft', th: 'ร่าง', cls: 'bg-slate-100 text-slate-600' },
  APPROVED: { label: 'Approved', th: 'อนุมัติแล้ว', cls: 'bg-blue-50 text-blue-700' },
  PAID: { label: 'Paid', th: 'จ่ายแล้ว', cls: 'bg-emerald-50 text-emerald-700' },
}

const fmt = n => (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
function initials(name) {
  return String(name || 'AC').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || 'AC'
}
function formatToday() {
  return new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
}
async function readJsonSafe(res) {
  const text = await res.text()
  try { return JSON.parse(text) } catch { return { _raw: text } }
}

function IconButton({ children, label, onClick }) {
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick}
      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
      {children}
    </button>
  )
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status, cls: 'bg-slate-100 text-slate-600' }
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black ${m.cls}`}>{m.label}</span>
}

function FinanceSidebar({ mobileOpen, onClose }) {
  return (
    <aside className={`${mobileOpen ? 'fixed inset-y-0 left-0 z-40 flex' : 'hidden'} w-72 flex-col border-r border-slate-200 bg-white/95 p-5 shadow-2xl backdrop-blur lg:sticky lg:top-0 lg:flex lg:h-screen lg:shadow-none`}>
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-base font-black text-white" style={{ background: ACE_BLUE }}>AC</div>
        <div>
          <div className="text-sm font-black text-slate-900">{COMPANY}</div>
          <div className="text-xs font-bold text-slate-400">Finance Suite</div>
        </div>
        <button type="button" className="ml-auto lg:hidden" onClick={onClose}><X size={18} /></button>
      </div>
      <nav className="mt-9 space-y-2">
        <div className="px-2 text-xs font-black uppercase tracking-[.12em] text-slate-400">Finance</div>
        {FINANCE_NAV.map(item => {
          const Icon = item.icon
          return (
            <a key={item.href} href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${item.active ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Icon size={18} />{item.label}
            </a>
          )
        })}
      </nav>
    </aside>
  )
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `${color}14`, color }}><Icon size={20} /></div>
        <div className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</div>
      </div>
      <div className="mt-3 text-2xl font-black text-slate-900">{value}</div>
      {sub && <div className="mt-1 text-xs font-bold text-slate-400">{sub}</div>}
    </div>
  )
}

export default function AccountingPage({ authenticatedUser, onLogout }) {
  const user = authenticatedUser || {}
  const role = user.role || ''
  const canApprove = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'DIRECTOR', 'ACCOUNTING'].includes(role)
  const canPay = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'ACCOUNTING'].includes(role)

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [vouchers, setVouchers] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [q, setQ] = useState('')
  const [detail, setDetail] = useState(null)
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (q.trim()) params.set('q', q.trim())
      const [vRes, sRes] = await Promise.all([
        apiFetch(`/api/finance/accounting/vouchers?${params}`).then(readJsonSafe),
        apiFetch('/api/finance/accounting/summary').then(readJsonSafe),
      ])
      setVouchers(vRes.vouchers || [])
      setSummary(sRes || null)
    } catch (e) { setError(e.message || 'Failed to load') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [statusFilter])

  async function doTransition(id, action, payment_ref = '') {
    setBusyId(id); setError('')
    try {
      const res = await apiFetch(`/api/finance/accounting/vouchers/${id}/transition`, {
        method: 'POST', body: JSON.stringify({ action, payment_ref }),
      })
      const data = await readJsonSafe(res)
      if (!res.ok) throw new Error(data.detail || 'Failed to change status')
      if (detail && detail.id === id) setDetail(data)
      await load()
    } catch (e) { setError(e.message) }
    finally { setBusyId(null) }
  }

  async function removeVoucher(id) {
    if (!window.confirm('Delete this draft voucher? This cannot be undone.')) return
    setBusyId(id); setError('')
    try {
      const res = await apiFetch(`/api/finance/accounting/vouchers/${id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await readJsonSafe(res); throw new Error(d.detail || 'Failed to delete') }
      if (detail && detail.id === id) setDetail(null)
      await load()
    } catch (e) { setError(e.message) }
    finally { setBusyId(null) }
  }

  async function openDetail(id) {
    setError('')
    try {
      const data = await apiFetch(`/api/finance/accounting/vouchers/${id}`).then(readJsonSafe)
      setDetail(data)
    } catch (e) { setError(e.message) }
  }

  function exportVoucher(id) {
    apiFetch(`/api/finance/accounting/vouchers/${id}/export`).then(async res => {
      if (!res.ok) { const d = await readJsonSafe(res); throw new Error(d.detail || 'Export failed') }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `PV-${id}.xlsx`
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
    }).catch(e => setError(e.message))
  }

  const filtered = useMemo(() => {
    if (!q.trim()) return vouchers
    const t = q.trim().toLowerCase()
    return vouchers.filter(v => [v.pv_no, v.vendor, v.project].some(x => String(x || '').toLowerCase().includes(t)))
  }, [vouchers, q])

  const byStatus = summary?.by_status || {}
  const counts = {
    DRAFT: byStatus.DRAFT?.count || 0,
    APPROVED: byStatus.APPROVED?.count || 0,
    PAID: byStatus.PAID?.count || 0,
  }

  function rowActions(v) {
    return (
      <div className="flex items-center justify-end gap-1.5">
        {v.status === 'DRAFT' && canApprove && (
          <button type="button" disabled={busyId === v.id} onClick={() => doTransition(v.id, 'approve')}
            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-black text-blue-700 hover:bg-blue-100 disabled:opacity-50">
            <CheckCircle2 size={14} />Approve</button>
        )}
        {v.status === 'APPROVED' && canPay && (
          <button type="button" disabled={busyId === v.id} onClick={() => {
            const ref = window.prompt('Payment reference (cheque/transfer no.) — optional:') || ''
            doTransition(v.id, 'pay', ref)
          }}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-black text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
            <Wallet size={14} />Pay</button>
        )}
        {v.status === 'APPROVED' && canApprove && (
          <button type="button" disabled={busyId === v.id} onClick={() => doTransition(v.id, 'revert')}
            title="Revert to draft"
            className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1.5 text-xs font-black text-amber-700 hover:bg-amber-100 disabled:opacity-50">
            <RotateCcw size={14} /></button>
        )}
        <button type="button" onClick={() => exportVoucher(v.id)} title="Download Excel PV"
          className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-200">
          <Download size={14} /></button>
        {v.status === 'DRAFT' && (
          <button type="button" disabled={busyId === v.id} onClick={() => removeVoucher(v.id)} title="Delete draft"
            className="inline-flex items-center rounded-lg px-2 py-1.5 text-xs font-black text-slate-300 hover:text-red-500 disabled:opacity-50">
            <Trash2 size={14} /></button>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="flex min-h-screen">
        <FinanceSidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        {mobileMenuOpen && <button type="button" className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)} />}

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/86 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <IconButton label="Open menu" onClick={() => setMobileMenuOpen(true)}><Menu size={19} /></IconButton>
              <div className="hidden min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-400 md:flex">
                <Search size={18} /><span className="w-full text-sm font-semibold uppercase tracking-[.08em] text-slate-400">Finance · Accounting</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <IconButton label="Notifications"><Bell size={18} /></IconButton>
                <button className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm sm:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-black text-white" style={{ background: ACE_BLUE }}>{initials(user.name || user.firstName)}</div>
                  <div className="text-left">
                    <div className="text-sm font-black text-slate-900">{user.name || user.firstName || 'User'}</div>
                    <div className="text-xs font-bold text-slate-400">{user.positionName || user.role || 'Finance Access'}</div>
                  </div>
                  <ChevronDown size={16} className="text-slate-400" />
                </button>
                {onLogout && <IconButton label="Logout" onClick={onLogout}><LogOut size={18} /></IconButton>}
              </div>
            </div>
          </header>

          <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
                  <Home size={14} />{COMPANY} · Finance · Accounting
                </div>
                <h1 className="mt-4 text-3xl font-black text-slate-950 sm:text-4xl">Accounting — Payment Voucher Ledger</h1>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                  Bills scanned in the Bill Reader are saved here as Payment Vouchers · workflow Draft → Approved → Paid · approved/paid amounts feed the monthly Expense Actual on Revenue &amp; Expense
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 shadow-sm">
                <CalendarDays size={17} style={{ color: ACE_RED }} />{formatToday()}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                <AlertTriangle size={18} />{error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={FileText} label="Draft" value={counts.DRAFT} sub="awaiting approval" color="#64748b" />
              <StatCard icon={CheckCircle2} label="Approved" value={counts.APPROVED} sub="ready to pay" color={ACE_BLUE} />
              <StatCard icon={Wallet} label="Paid" value={counts.PAID} sub="completed" color="#0e9f6e" />
              <StatCard icon={Coins} label="Expense Actual (posted)" value={`฿${fmt(summary?.total_expense_actual)}`} sub="approved + paid · base, excl. input VAT" color={ACE_RED} />
            </div>

            {/* Monthly expense actual feed */}
            {summary?.months?.length > 0 && (
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)] sm:p-6">
                <div className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700">Monthly Expense Actual → Revenue &amp; Expense</div>
                <div className="flex flex-wrap gap-3">
                  {summary.months.map(m => (
                    <div key={m.month} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="text-xs font-black uppercase tracking-wide text-slate-400">{m.month}</div>
                      <div className="mt-1 text-lg font-black text-slate-900">฿{fmt(m.expense_actual)}</div>
                      <div className="text-xs font-bold text-slate-400">{m.count} voucher(s) · VAT ฿{fmt(m.input_vat)} · paid ฿{fmt(m.net_paid)}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <Search size={16} className="text-slate-400" />
                <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()}
                  placeholder="Search PV no. / vendor / project" className="w-64 text-sm font-semibold text-slate-700 focus:outline-none" />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none">
                <option value="">All statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="APPROVED">Approved</option>
                <option value="PAID">Paid</option>
              </select>
            </div>

            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
              <div className="border-b border-slate-100 px-5 py-4 text-sm font-black uppercase tracking-wide text-slate-700">
                Payment Vouchers ({filtered.length})
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3">Doc No.</th>
                      <th className="px-4 py-3">Vendor / Project</th>
                      <th className="px-4 py-3">Month</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-right">WHT</th>
                      <th className="px-4 py-3 text-right">Net</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={8} className="px-4 py-10 text-center text-sm font-bold text-slate-400">Loading…</td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-10 text-center text-sm font-bold text-slate-400">No vouchers yet — scan a bill in Bill Reader and click “Save to Accounting”.</td></tr>
                    ) : filtered.map(v => (
                      <tr key={v.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <button type="button" onClick={() => openDetail(v.id)} className="font-black text-blue-700 hover:underline">{v.doc_no || `PV-${v.id}`}</button>
                          <div className="text-xs font-semibold text-slate-400">{v.pv_no ? `Ref ${v.pv_no}` : ''}{v.item ? ` · Item ${v.item}` : ''}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-800">{v.vendor || '—'}</div>
                          <div className="text-xs font-semibold text-slate-400">{v.project || ''}</div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-600">{v.period_month}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-800">{fmt(v.amount_total)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-red-600">{v.wht_total ? `(${fmt(v.wht_total)})` : '–'}</td>
                        <td className="px-4 py-3 text-right font-black text-slate-900">{fmt(v.net_total)}</td>
                        <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                        <td className="px-4 py-3">{rowActions(v)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* Detail drawer */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30" onClick={() => setDetail(null)}>
          <div className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-wide text-slate-400">Payment Voucher</div>
                <div className="text-2xl font-black text-slate-900">{detail.doc_no || `PV-${detail.id}`}</div>
                <div className="mt-1"><StatusBadge status={detail.status} /></div>
              </div>
              <button type="button" onClick={() => setDetail(null)}><X size={20} className="text-slate-400 hover:text-slate-700" /></button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              {[['Ref No.', detail.pv_no], ['Vendor', detail.vendor], ['Project', detail.project], ['Item', detail.item], ['Month', detail.period_month], ['Date', detail.pv_date], ['Requester', detail.requester], ['Issued by', detail.issued_by], ['Source', detail.source_filename]].map(([k, val]) => (
                <div key={k}>
                  <div className="text-xs font-black uppercase tracking-wide text-slate-400">{k}</div>
                  <div className="font-bold text-slate-800">{val || '—'}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2">#</th><th className="px-3 py-2">Detail</th>
                    <th className="px-3 py-2 text-right">Amount</th><th className="px-3 py-2 text-right">VAT</th>
                    <th className="px-3 py-2 text-right">WHT</th><th className="px-3 py-2 text-right">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {(detail.lines || []).map(l => (
                    <tr key={l.seq} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-bold text-slate-400">{l.seq}</td>
                      <td className="px-3 py-2 text-slate-700">{l.description}</td>
                      <td className="px-3 py-2 text-right">{fmt(l.amount)}</td>
                      <td className="px-3 py-2 text-right">{l.vat ? fmt(l.vat) : '–'}</td>
                      <td className="px-3 py-2 text-right text-red-600">{l.wht ? `(${fmt(l.wht)})` : '–'}</td>
                      <td className="px-3 py-2 text-right font-black text-slate-900">{fmt(l.net)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50 font-black text-slate-900">
                    <td className="px-3 py-2" colSpan={2}>Total</td>
                    <td className="px-3 py-2 text-right">{fmt(detail.amount_total)}</td>
                    <td className="px-3 py-2 text-right">{detail.vat_total ? fmt(detail.vat_total) : '–'}</td>
                    <td className="px-3 py-2 text-right text-red-600">{detail.wht_total ? `(${fmt(detail.wht_total)})` : '–'}</td>
                    <td className="px-3 py-2 text-right">{fmt(detail.net_total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-4 space-y-1 text-xs font-semibold text-slate-400">
              <div>Created by {detail.created_by || '—'}</div>
              {detail.approved_by && <div>Approved by {detail.approved_by}</div>}
              {detail.paid_by && <div>Paid by {detail.paid_by}{detail.payment_ref ? ` · ref ${detail.payment_ref}` : ''}</div>}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {detail.status === 'DRAFT' && canApprove && (
                <button type="button" disabled={busyId === detail.id} onClick={() => doTransition(detail.id, 'approve')}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black text-white disabled:opacity-50" style={{ background: ACE_BLUE }}><CheckCircle2 size={16} />Approve</button>
              )}
              {detail.status === 'APPROVED' && canPay && (
                <button type="button" disabled={busyId === detail.id} onClick={() => {
                  const ref = window.prompt('Payment reference (cheque/transfer no.) — optional:') || ''
                  doTransition(detail.id, 'pay', ref)
                }}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50"><Wallet size={16} />Mark Paid</button>
              )}
              {detail.status === 'APPROVED' && canApprove && (
                <button type="button" disabled={busyId === detail.id} onClick={() => doTransition(detail.id, 'revert')}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-100 px-4 py-2.5 text-sm font-black text-amber-700 disabled:opacity-50"><RotateCcw size={16} />Revert to Draft</button>
              )}
              <button type="button" onClick={() => exportVoucher(detail.id)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700"><Download size={16} />Excel PV</button>
              {detail.status === 'DRAFT' && (
                <button type="button" disabled={busyId === detail.id} onClick={() => removeVoucher(detail.id)}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black text-red-500 hover:bg-red-50 disabled:opacity-50"><Trash2 size={16} />Delete</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
