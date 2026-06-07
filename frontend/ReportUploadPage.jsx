// ReportUploadPage — DTE Per-Site uploads a .rar report for the site they tested.
// Mounted at /project/report-upload. Auth handled by AuthGate (main.jsx).
// Matches the platform design language (Card / StatCard / header chip / lucide).
//
// Backend:
//   GET  /api/presite/my-sites                     → own sites only (DT_DONE+)
//   POST /api/presite/tracking/{id}/upload-report  → multipart, .rar only, max 500MB
//
// PM downloads from the SSV/PAC Pre-Site "Report" column (no separate page).

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  UploadCloud, Package, RefreshCw, LogOut, FileArchive, CheckCircle2,
  AlertTriangle, Clock, Layers, Wifi, X, FolderUp, Wallet, TrendingUp, CalendarDays,
} from 'lucide-react'
import { apiFetch } from './src/apiFetch.js'

const ACE_BLUE = '#2447d8'
const PURPLE   = '#7c3aed'
const AMBER    = '#b45309'
const GREEN    = '#16a34a'
const COMPANY  = 'AirConnect Engineering'
const MAX_MB   = 500

function fmtBaht(n) {
  if (n == null) return '—'
  return '฿' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
function monthLabel(ym) {
  // "2026-05" → "May 2026"
  if (!ym) return ym
  const [y, m] = ym.split('-')
  const names = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${names[parseInt(m, 10)] || m} ${y}`
}
function weekLabel(yw) {
  // "2026-W22" → "Week 22 · 2026"
  if (!yw) return yw
  const [y, w] = yw.split('-W')
  return `Week ${w} · ${y}`
}
function currentYearMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function fmtSize(bytes) {
  if (bytes == null) return ''
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`
}
function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
function initials(name) {
  return String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || '?'
}

function Card({ children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.06)] ${className}`}>
      {children}
    </section>
  )
}

function StatCard({ label, value, helper, tone = ACE_BLUE, icon: Icon }) {
  return (
    <Card className="p-5 transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_24px_70px_rgba(36,71,216,0.12)]">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `${tone}12`, color: tone }}>
        <Icon size={21} strokeWidth={2.3} />
      </div>
      <div className="mt-5 text-xs font-black uppercase tracking-[.08em] text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-black tracking-normal text-slate-950">{value}</div>
      {helper && <div className="mt-1 text-xs font-semibold text-slate-400">{helper}</div>}
    </Card>
  )
}

export default function ReportUploadPage({ authenticatedUser, onLogout }) {
  const [sites, setSites] = useState([])
  const [monthly, setMonthly] = useState([])
  const [weekly, setWeekly] = useState([])
  const [incomeView, setIncomeView] = useState('month')  // 'month' | 'week'
  const [tab, setTab] = useState('summary')              // 'summary' | 'upload'
  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState('')
  const [modalSite, setModalSite] = useState(null)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/presite/my-sites')
      const data = await res.json()
      setSites(data.data || [])
      setMonthly(data.monthly || [])
      setWeekly(data.weekly || [])
      setMe(data.employee_code || authenticatedUser?.employeeCode || '')
    } catch {
      setSites([])
      setMonthly([])
      setWeekly([])
    } finally {
      setLoading(false)
    }
  }, [authenticatedUser])

  useEffect(() => { reload() }, [reload])

  const name = authenticatedUser?.name
    || `${authenticatedUser?.firstName || ''} ${authenticatedUser?.lastName || ''}`.trim()

  // Stats
  const total = sites.length
  const uploaded = sites.filter(s => s.has_report).length
  const pending = sites.filter(s => s.dt_done && !s.has_report).length

  // Revenue
  const thisMonth = currentYearMonth()
  const thisMonthRow = monthly.find(m => m.month === thisMonth)
  const thisMonthRevenue = thisMonthRow ? thisMonthRow.revenue : 0
  const totalRevenue = monthly.reduce((a, m) => a + (m.revenue || 0), 0)
  const paidRevenue = monthly.reduce((a, m) => a + (m.paid || 0), 0)
  const unpaidRevenue = monthly.reduce((a, m) => a + (m.unpaid || 0), 0)

  // Income breakdown view (month | week)
  const incomeRows = incomeView === 'week' ? weekly : monthly
  const labelKey = incomeView === 'week' ? 'week' : 'month'
  const labelFn = incomeView === 'week' ? weekLabel : monthLabel

  // Upload tab: only sites that are DT done (actionable)
  const uploadSites = sites.filter(s => s.dt_done)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-lg"
                 style={{ background: `linear-gradient(135deg, ${ACE_BLUE}, ${PURPLE})` }}>
              <FolderUp size={20} />
            </div>
            <div>
              <div className="text-sm font-black text-slate-950">Report Upload</div>
              <div className="text-[.65rem] font-bold text-slate-400">DTE Per-Site · Desktop</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-black text-slate-900">{name || me}</div>
              <div className="text-[.65rem] font-bold text-slate-400 font-mono">{me}</div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full text-white text-sm font-black"
                 style={{ background: ACE_BLUE }}>{initials(name || me)}</div>
            <button onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-50">
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col gap-6">
          {/* Page heading */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
              <UploadCloud size={14} />
              {COMPANY} · Report Submission
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-normal text-slate-950 sm:text-4xl">My Workspace</h1>
          </div>

          {/* Tabs */}
          <div className="inline-flex gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            {[
              { id: 'summary', label: 'Income / Summary', icon: Wallet },
              { id: 'upload', label: 'Upload Reports', icon: UploadCloud, badge: pending },
            ].map(t => {
              const active = tab === t.id
              const Icon = t.icon
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition ${active ? 'text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
                  style={active ? { background: `linear-gradient(135deg, ${ACE_BLUE}, ${PURPLE})` } : {}}>
                  <Icon size={16} /> {t.label}
                  {t.badge > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[.6rem] font-black ${active ? 'bg-white/25' : 'bg-amber-100 text-amber-700'}`}>{t.badge}</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* ════════ TAB: SUMMARY ════════ */}
          {tab === 'summary' && (
            <>
              <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard label="Total Income" value={fmtBaht(totalRevenue)}   helper={`${total} sites · all periods`} tone={ACE_BLUE} icon={TrendingUp} />
                <StatCard label="Paid"         value={fmtBaht(paidRevenue)}    helper="Already paid"     tone={GREEN}  icon={CheckCircle2} />
                <StatCard label="Unpaid"       value={fmtBaht(unpaidRevenue)}  helper="Awaiting payment" tone={AMBER}  icon={Clock} />
                <StatCard label="This Month"   value={fmtBaht(thisMonthRevenue)} helper={`${monthLabel(thisMonth)} income`} tone={PURPLE} icon={Wallet} />
              </section>

              {/* Income breakdown — Month/Week toggle */}
              {incomeRows.length > 0 && (
                <Card className="overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h3 className="inline-flex items-center gap-2 text-base font-black text-slate-950">
                      <CalendarDays size={18} style={{ color: PURPLE }} /> Income Breakdown
                    </h3>
                    <div className="inline-flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                      {[['month', 'Month'], ['week', 'Week']].map(([v, l]) => (
                        <button key={v} onClick={() => setIncomeView(v)}
                          className={`rounded-md px-3 py-1 text-xs font-black transition ${incomeView === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{l}</button>
                      ))}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full" style={{ fontSize: '.82rem' }}>
                      <thead>
                        <tr className="bg-slate-50 text-left text-[.62rem] font-black uppercase tracking-wide text-slate-500">
                          <th className="px-6 py-3">{incomeView === 'week' ? 'Week' : 'Month'}</th>
                          <th className="px-6 py-3 text-center">Sites</th>
                          <th className="px-6 py-3 text-center">Uploaded</th>
                          <th className="px-6 py-3 text-right">Total</th>
                          <th className="px-6 py-3 text-right">Paid</th>
                          <th className="px-6 py-3 text-right">Unpaid</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incomeRows.map(r => {
                          const key = r[labelKey]
                          const isCurrent = incomeView === 'month' && key === thisMonth
                          return (
                            <tr key={key} className={`border-t border-slate-100 ${isCurrent ? 'bg-emerald-50/50' : ''}`}>
                              <td className="px-6 py-3 font-black text-slate-900">
                                {labelFn(key)}
                                {isCurrent && <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[.55rem] font-black text-emerald-700">THIS MONTH</span>}
                              </td>
                              <td className="px-6 py-3 text-center font-bold text-slate-700">{r.sites}</td>
                              <td className="px-6 py-3 text-center font-bold text-blue-700">{r.uploaded}</td>
                              <td className="px-6 py-3 text-right font-mono font-black text-slate-900">{fmtBaht(r.revenue)}</td>
                              <td className="px-6 py-3 text-right font-mono font-bold text-emerald-700">{r.paid > 0 ? fmtBaht(r.paid) : '—'}</td>
                              <td className="px-6 py-3 text-right font-mono font-bold text-amber-600">{r.unpaid > 0 ? fmtBaht(r.unpaid) : '—'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-200 bg-slate-50">
                          <td className="px-6 py-3 font-black text-slate-900">Total ({incomeRows.length} {incomeView === 'week' ? 'weeks' : 'months'})</td>
                          <td className="px-6 py-3 text-center font-black text-slate-700">{incomeRows.reduce((a,r)=>a+r.sites,0)}</td>
                          <td className="px-6 py-3 text-center font-black text-blue-700">{incomeRows.reduce((a,r)=>a+r.uploaded,0)}</td>
                          <td className="px-6 py-3 text-right font-mono font-black text-slate-900">{fmtBaht(totalRevenue)}</td>
                          <td className="px-6 py-3 text-right font-mono font-black text-emerald-700">{fmtBaht(paidRevenue)}</td>
                          <td className="px-6 py-3 text-right font-mono font-black text-amber-600">{fmtBaht(unpaidRevenue)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </Card>
              )}

              {/* All sites — read-only history */}
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                  <h3 className="text-base font-black text-slate-950">All My Sites · History</h3>
                  <button onClick={reload}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-50">
                    <RefreshCw size={14} /> Refresh
                  </button>
                </div>
                {loading ? (
                  <div className="p-12 text-center text-sm font-bold text-slate-400">Loading…</div>
                ) : sites.length === 0 ? (
                  <div className="p-12 text-center">
                    <Package size={40} className="mx-auto text-slate-300" />
                    <div className="mt-3 text-sm font-bold text-slate-400">No sites assigned to you yet</div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full" style={{ fontSize: '.82rem' }}>
                      <thead>
                        <tr className="bg-slate-50 text-left text-[.62rem] font-black uppercase tracking-wide text-slate-500">
                          <th className="px-6 py-3">Site</th>
                          <th className="px-6 py-3">Type / Rate</th>
                          <th className="px-6 py-3">DT Date</th>
                          <th className="px-6 py-3">Stage</th>
                          <th className="px-6 py-3">Approved</th>
                          <th className="px-6 py-3">Report</th>
                          <th className="px-6 py-3 text-center">Payment</th>
                          <th className="px-6 py-3 text-right">Income</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sites.map(s => {
                          const isPac = s.work_type === 'PAC'
                          const siteLabel = s.cluster_key || s.site_code || `#${s.id}`
                          const color = isPac ? PURPLE : ACE_BLUE
                          return (
                            <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                              <td className="px-6 py-4 font-mono font-black" style={{ color }}>{siteLabel}</td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[.6rem] font-black" style={{ background: `${color}14`, color }}>
                                  {isPac ? <Layers size={11} /> : <Wifi size={11} />} {s.work_type}
                                </span>
                                {s.income?.category && (
                                  <div className="mt-1 text-[.6rem] font-bold text-slate-400">{s.income.category}{s.income.site_count > 1 ? ` ×${s.income.site_count}` : ''}</div>
                                )}
                              </td>
                              <td className="px-6 py-4 text-xs font-bold text-slate-500">{s.revenue_date || '—'}</td>
                              <td className="px-6 py-4">
                                {s.current_stage === 'ACE_APPROVED'
                                  ? <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700"><CheckCircle2 size={13} /> Approved</span>
                                  : <span className="text-xs font-bold text-slate-600">{s.current_stage}</span>}
                              </td>
                              <td className="px-6 py-4">
                                {s.approved_at ? (
                                  <div>
                                    <div className="text-xs font-bold text-slate-700">{(s.approved_at || '').slice(0, 10)}</div>
                                    {s.approved_by_name && <div className="text-[.58rem] font-bold text-slate-400">by {s.approved_by_name}</div>}
                                  </div>
                                ) : <span className="text-xs font-bold text-slate-300">—</span>}
                              </td>
                              <td className="px-6 py-4">
                                {s.has_report
                                  ? <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700"><FileArchive size={13} /> v{s.report_version}</span>
                                  : <span className="text-xs font-bold text-slate-300">—</span>}
                              </td>
                              <td className="px-6 py-4 text-center">
                                {s.paid
                                  ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[.6rem] font-black text-emerald-700" title={s.dte_paid_at ? `Paid ${fmtDate(s.dte_paid_at)}${s.dte_payment_ref ? ' · ' + s.dte_payment_ref : ''}` : 'Paid'}><CheckCircle2 size={11} /> Paid</span>
                                  : <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[.6rem] font-black text-amber-700"><Clock size={11} /> Unpaid</span>}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="font-mono font-black text-slate-900">{fmtBaht(s.income?.total)}</div>
                                {s.income?.total > 0 && <div className="text-[.58rem] font-bold text-slate-400">DT {fmtBaht(s.income.dt)} + Rep {fmtBaht(s.income.report)}</div>}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </>
          )}

          {/* ════════ TAB: UPLOAD ════════ */}
          {tab === 'upload' && (
            <>
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs font-bold text-amber-800 flex items-center gap-2">
                🔒 Upload the drive-test report (<b>.rar</b> only, max {MAX_MB} MB) for sites you've completed (DT Done). File is sent to the team FTP server.
              </div>
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                  <h3 className="text-base font-black text-slate-950">Sites Ready for Upload</h3>
                  <button onClick={reload}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-50">
                    <RefreshCw size={14} /> Refresh
                  </button>
                </div>
                {loading ? (
                  <div className="p-12 text-center text-sm font-bold text-slate-400">Loading…</div>
                ) : uploadSites.length === 0 ? (
                  <div className="p-12 text-center">
                    <CheckCircle2 size={40} className="mx-auto text-emerald-300" />
                    <div className="mt-3 text-sm font-bold text-slate-400">No sites pending upload — all DT-done sites have reports</div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full" style={{ fontSize: '.82rem' }}>
                      <thead>
                        <tr className="bg-slate-50 text-left text-[.62rem] font-black uppercase tracking-wide text-slate-500">
                          <th className="px-6 py-3">Site</th>
                          <th className="px-6 py-3">Type</th>
                          <th className="px-6 py-3">DT Done</th>
                          <th className="px-6 py-3">Current Report</th>
                          <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadSites.map(s => {
                          const isPac = s.work_type === 'PAC'
                          const siteLabel = s.cluster_key || s.site_code || `#${s.id}`
                          const color = isPac ? PURPLE : ACE_BLUE
                          return (
                            <tr key={s.id} className={`border-t border-slate-100 hover:bg-slate-50/60 ${!s.has_report ? 'bg-amber-50/30' : ''}`}>
                              <td className="px-6 py-4 font-mono font-black" style={{ color }}>{siteLabel}</td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[.6rem] font-black" style={{ background: `${color}14`, color }}>
                                  {isPac ? <Layers size={11} /> : <Wifi size={11} />} {s.work_type}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-xs font-bold text-slate-500">{s.revenue_date || '—'}</td>
                              <td className="px-6 py-4">
                                {s.has_report
                                  ? <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700"><FileArchive size={13} /> v{s.report_version} · {fmtSize(s.report_file_size)} · {fmtDate(s.report_uploaded_at)}</span>
                                  : <span className="text-xs font-bold text-amber-600">No report yet</span>}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {s.has_report ? (
                                  <button onClick={() => setModalSite(s)}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">
                                    <RefreshCw size={14} /> Re-upload v{(s.report_version || 0) + 1}
                                  </button>
                                ) : (
                                  <button onClick={() => setModalSite(s)}
                                    className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black text-white hover:opacity-90"
                                    style={{ background: ACE_BLUE }}>
                                    <UploadCloud size={14} /> Upload .rar
                                  </button>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </main>

      {modalSite && (
        <UploadModal
          site={modalSite}
          onClose={() => setModalSite(null)}
          onDone={() => { setModalSite(null); reload() }}
        />
      )}
    </div>
  )
}

function UploadModal({ site, onClose, onDone }) {
  const [file, setFile] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)
  const siteLabel = site.cluster_key || site.site_code || `#${site.id}`

  function pickFile(f) {
    setErr('')
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.rar')) {
      setErr(`Only .rar files are allowed (got '${f.name}')`)
      setFile(null)
      return
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setErr(`File exceeds the ${MAX_MB} MB limit`)
      setFile(null)
      return
    }
    setFile(f)
  }

  async function submit() {
    if (!file) return
    setBusy(true)
    setErr('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await apiFetch(`/api/presite/tracking/${site.id}/upload-report`, { method: 'POST', body: fd })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.detail || `HTTP ${res.status}`)
      }
      onDone()
    } catch (e) {
      setErr(e.message || 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <div className="text-[.6rem] font-black uppercase tracking-widest text-slate-500">Upload Report</div>
            <div className="text-lg font-black text-slate-900">Site: <span className="font-mono text-blue-700">{siteLabel}</span></div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
        </div>
        <div className="space-y-4 p-5">
          <input ref={inputRef} type="file" accept=".rar" className="hidden" onChange={e => pickFile(e.target.files?.[0])} />
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files?.[0]) }}
            className={`cursor-pointer rounded-2xl border-[3px] border-dashed p-10 text-center transition ${dragOver ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50'}`}
          >
            <Package size={44} className="mx-auto text-slate-400" />
            <div className="mt-2 text-base font-black text-slate-700">Drop your <b>.rar</b> file here</div>
            <div className="mt-1 text-xs font-bold text-slate-500">or click to browse · .rar only · max {MAX_MB} MB</div>
          </div>

          {file && (
            <div className="flex items-center justify-between rounded-xl border-2 border-emerald-300 bg-emerald-50 p-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white"><FileArchive size={18} /></div>
                <div className="min-w-0">
                  <div className="truncate font-mono text-xs font-black text-slate-900">{file.name}</div>
                  <div className="text-[.62rem] font-bold text-slate-600">{fmtSize(file.size)} · ready</div>
                </div>
              </div>
              <button onClick={() => setFile(null)} className="text-slate-400 hover:text-red-600"><X size={16} /></button>
            </div>
          )}

          {err && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
              <AlertTriangle size={15} /> {err}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 rounded-b-2xl border-t border-slate-100 bg-slate-50 px-5 py-3">
          <button onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700">Cancel</button>
          <button onClick={submit} disabled={!file || busy}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500">
            <UploadCloud size={14} /> {busy ? 'Uploading…' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}
