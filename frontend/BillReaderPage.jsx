import React, { useState, useRef, useMemo, useEffect } from 'react'
import {
  Bell, CalendarDays, ChevronDown, FileText, Home, LogOut, Menu, Search,
  Upload, FileUp, FileSpreadsheet, ScanLine, AlertTriangle, Download, X, Trash2,
  BookCheck, Save,
} from 'lucide-react'
import { apiFetch } from './src/apiFetch.js'

const ACE_BLUE = '#2447d8'
const ACE_RED = '#c73b32'
const ACE_GREEN = '#0e9f6e'
const COMPANY = 'AirConnect Engineering'

const FINANCE_NAV = [
  { href: '/finance/revenue-expense', label: 'Revenue & Expense', icon: FileSpreadsheet },
  { href: '/finance/po-import', label: 'PO Import (HW)', icon: FileUp },
  { href: '/finance/dte-payments', label: 'DTE Payments', icon: FileText },
  { href: '/finance/bill-reader', label: 'Bill Reader → PV', icon: ScanLine, active: true },
  { href: '/finance/accounting', label: 'Accounting (PV Ledger)', icon: BookCheck },
]

const ID_KIND_LABEL = {
  phone: 'Phone No.', meter: 'Meter / CA No.', contract: 'Contract No.', site: 'Site / PO', none: 'Detail',
}

function initials(name) {
  return String(name || 'AC').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || 'AC'
}
function formatToday() {
  return new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
}
function IconButton({ children, label, onClick }) {
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick}
      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
      {children}
    </button>
  )
}

// อ่าน response เป็น JSON อย่างปลอดภัย (กัน HTML 413/504 ทำให้ error งงๆ)
async function readJsonSafe(res) {
  const text = await res.text()
  try { return JSON.parse(text) } catch { return { _raw: text } }
}
function httpErr(res, data, fallback) {
  if (data && data.detail) return data.detail
  if (res.status === 413) return 'File too large — please reduce the PDF size / number of pages (server upload limit)'
  if (res.status === 504 || res.status === 502) return 'Server took too long to process (OCR) — try splitting the bill into smaller files'
  return `${fallback} (HTTP ${res.status})`
}

const r2 = n => Math.round((Number(n) || 0) * 100) / 100
const fmt = n => (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function idFmt(v) {
  const d = String(v || '').replace(/\D/g, '')
  return (d.length === 10 && d[0] === '0') ? `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6)}` : (v || '')
}
function brandOf(vendor) {
  const v = String(vendor || '').toLowerCase()
  for (const b of ['AIS', 'True', 'DTAC', 'NT', 'TOT']) if (v.includes(b.toLowerCase())) return b
  if (v.includes('awn')) return 'AIS'
  return 'Bill'
}
function buildDesc(line, profile, vendor) {
  if (!profile) return line.desc || ''
  if (profile.key === 'telecom') return `${brandOf(vendor)} no.${idFmt(line.identifier)} of period ${line.period}`
  const idpart = line.identifier ? ` no.${idFmt(line.identifier)}` : ''
  const period = line.period ? ` of period ${line.period}` : ''
  return `${profile.desc_prefix || 'Service'}${idpart}${period}`.trim()
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

export default function BillReaderPage({ authenticatedUser, onLogout }) {
  const user = authenticatedUser || {}
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [error, setError] = useState('')
  const [vendor, setVendor] = useState('')
  const [header, setHeader] = useState(null)
  const [lines, setLines] = useState([])
  const [profiles, setProfiles] = useState([])
  const [billType, setBillType] = useState('')        // '' = auto-detect ก่อน extract
  const [learnedCount, setLearnedCount] = useState(0) // รายการที่เติมจาก memory รอบนี้
  const [memoryTotal, setMemoryTotal] = useState(0)   // จำนวนที่ระบบเรียนรู้สะสม
  const inputRef = useRef(null)

  const hasResult = header !== null
  const profile = useMemo(() => profiles.find(p => p.key === billType) || null, [profiles, billType])
  const whtRate = profile ? profile.wht_rate : 0.03
  const idLabel = ID_KIND_LABEL[profile?.id_kind] || 'Phone No.'

  // โหลดรายการชนิดบิล + สถิติการเรียนรู้
  function refreshStats() {
    apiFetch('/api/finance/bill-reader/stats').then(readJsonSafe).then(d => setMemoryTotal(d.total || 0)).catch(() => {})
  }
  useEffect(() => {
    apiFetch('/api/finance/bill-reader/profiles').then(readJsonSafe).then(d => setProfiles(d.profiles || [])).catch(() => {})
    refreshStats()
  }, [])

  function pickFile(f) {
    if (!f) return
    if (!/\.pdf$/i.test(f.name)) { setError('PDF files only'); return }
    setFile(f); setError('')
  }

  async function extract() {
    if (!file) return
    setBusy(true); setError(''); setHeader(null); setLines([])
    try {
      const fd = new FormData()
      fd.append('file', file)
      if (billType) fd.append('bill_type', billType)  // บังคับชนิด ถ้าผู้ใช้เลือก
      const res = await apiFetch('/api/finance/bill-reader/extract', { method: 'POST', body: fd })
      const data = await readJsonSafe(res)
      if (!res.ok) throw new Error(httpErr(res, data, 'Failed to read bill'))
      if (data.profiles) setProfiles(data.profiles)
      setBillType(data.bill_type || 'other')
      setVendor(data.vendor || '')
      setHeader(data.header || {})
      setLearnedCount(data.learned_count || 0)
      setLines((data.lines || []).map(l => {
        const identifier = l.identifier ?? l.phone ?? ''
        // _ocr = ค่าที่ OCR เดามาตอนแรก เก็บไว้ส่งกลับเป็น dataset ตอน export
        return { ...l, identifier, learned: !!l.learned, _ocr: { identifier, period: l.period, amount: l.amount, vat: l.vat } }
      }))
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  function updateLine(i, key, value) {
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [key]: value, needs_review: false } : l))
  }
  function removeLine(i) { setLines(prev => prev.filter((_, idx) => idx !== i)) }

  const rows = useMemo(() => lines.map(l => {
    const amount = Number(l.amount) || 0
    const vat = profile && profile.extract_vat === false ? 0 : (Number(l.vat) || 0)
    const wht = r2(amount * whtRate)
    return { ...l, amount, vat, wht, net: r2(amount + vat - wht) }
  }), [lines, whtRate, profile])

  const totals = useMemo(() => rows.reduce((t, r) => ({
    amount: t.amount + r.amount, vat: t.vat + r.vat, wht: t.wht + r.wht, net: t.net + r.net,
  }), { amount: 0, vat: 0, wht: 0, net: 0 }), [rows])

  const reviewCount = rows.filter(r => r.needs_review).length

  function pvFilename() {
    const pv = (header?.pv_no || 'PV').replace(/\//g, '-')
    const item = header?.item ? `-Item${header.item}` : ''
    const tag = profile?.key === 'telecom' ? brandOf(vendor) : (profile?.key || 'PV').toUpperCase()
    return `PV-${tag}-${pv}${item}`
  }

  async function generatePV() {
    setGenerating(true); setError('')
    try {
      const body = {
        vendor, header: header || {}, bill_type: billType, filename: pvFilename(),
        lines: rows.map(r => ({
          identifier: r.identifier, period: r.period, amount: r.amount, vat: r.vat,
          vendor, desc: buildDesc(r, profile, vendor), ocr: r._ocr || {},
        })),
      }
      const res = await apiFetch('/api/finance/bill-reader/export', { method: 'POST', body: JSON.stringify(body) })
      if (!res.ok) { const e = await readJsonSafe(res); throw new Error(httpErr(res, e, 'Failed to generate PV')) }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = pvFilename() + '.xlsx'
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
      refreshStats()  // อัปเดตจำนวนที่เรียนรู้หลังบันทึก
    } catch (e) { setError(e.message) }
    finally { setGenerating(false) }
  }

  async function saveToAccounting(allowDuplicate = false) {
    setSaving(true); setError(''); setSavedMsg('')
    try {
      const body = {
        vendor, header: header || {}, bill_type: billType, filename: pvFilename(),
        allow_duplicate: allowDuplicate,
        lines: rows.map(r => ({
          identifier: r.identifier, period: r.period, amount: r.amount, vat: r.vat,
          vendor, desc: buildDesc(r, profile, vendor), ocr: r._ocr || {},
        })),
      }
      const res = await apiFetch('/api/finance/accounting/vouchers', { method: 'POST', body: JSON.stringify(body) })
      const data = await readJsonSafe(res)
      // duplicate guard: backend ตอบ 409 + detail.code === 'duplicate' ให้ยืนยันก่อนบันทึกซ้ำ
      const detail = data && data.detail
      if (res.status === 409 && detail && typeof detail === 'object' && detail.code === 'duplicate') {
        setSaving(false)
        if (window.confirm(`${detail.message}`)) { return saveToAccounting(true) }
        return
      }
      if (!res.ok) throw new Error(typeof detail === 'string' ? detail : httpErr(res, data, 'Failed to save to accounting'))
      // แนบไฟล์ PDF ต้นฉบับเข้ากับ voucher (เพื่อ audit/ตรวจสอบ) — ไม่ให้ล้มถ้าแนบพลาด
      let attachNote = ''
      if (file && data.id) {
        try {
          const afd = new FormData()
          afd.append('file', file)
          const ares = await apiFetch(`/api/finance/accounting/vouchers/${data.id}/attachment`, { method: 'POST', body: afd })
          attachNote = ares.ok ? ' · original PDF attached' : ' · (PDF attach failed)'
        } catch { attachNote = ' · (PDF attach failed)' }
      }
      setSavedMsg(`Saved to accounting — ${data.doc_no || data.pv_no || 'PV'} (status: Draft)${attachNote}. View it in the PV Ledger.`)
      refreshStats()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  function reset() { setFile(null); setHeader(null); setLines([]); setVendor(''); setError(''); setSavedMsg('') }

  const HF = ([k, label]) => (
    <label key={k} className="flex flex-col gap-1">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</span>
      <input value={header?.[k] || ''} onChange={e => setHeader(h => ({ ...h, [k]: e.target.value }))}
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 focus:border-blue-400 focus:outline-none" />
    </label>
  )

  const pct = n => `${Math.round(n * 100)}%`

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
                <Search size={18} /><span className="w-full text-sm font-semibold uppercase tracking-[.08em] text-slate-400">Finance · Bill Reader</span>
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
                  <Home size={14} />{COMPANY} · Finance · Bill Reader
                </div>
                <h1 className="mt-4 text-3xl font-black text-slate-950 sm:text-4xl">Bill Reader → Payment Voucher</h1>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                  Supports multiple bill types (Telephone · Electricity/Water · Fleet card · Rental · Subcontractor) · OCR + auto-detection · VAT/WHT computed per type · auto-fills the PV form
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

            {/* Upload + bill-type selector */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)] sm:p-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: `${ACE_BLUE}12`, color: ACE_BLUE }}><ScanLine size={24} /></div>
                    <div>
                      <div className="text-base font-black text-slate-900">{file ? file.name : 'Select bill file (PDF)'}</div>
                      <div className="text-sm font-semibold text-slate-400">{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Scanned PDF — bill type is auto-detected'}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={e => pickFile(e.target.files?.[0])} />
                    <button type="button" onClick={() => inputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"><Upload size={17} />Choose file</button>
                    <button type="button" onClick={extract} disabled={!file || busy}
                      className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-black text-white shadow-sm transition disabled:opacity-50" style={{ background: ACE_BLUE }}>
                      {busy ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Reading (OCR)…</> : <><ScanLine size={17} />Read bill</>}
                    </button>
                    {hasResult && <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-500 hover:bg-slate-50"><Trash2 size={16} />Clear</button>}
                  </div>
                </div>
                {/* bill type selector */}
                <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-400">Bill type</span>
                  <select value={billType} onChange={e => setBillType(e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 focus:border-blue-400 focus:outline-none">
                    <option value="">Auto-detect</option>
                    {profiles.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                  </select>
                  {hasResult && profile && (
                    <div className="flex flex-wrap items-center gap-2 text-xs font-black">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">Detected: {profile.label}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">WHT {pct(whtRate)}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{profile.extract_vat ? 'VAT 7%' : 'No separate VAT'}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">Form {profile.pv_template?.toUpperCase()}</span>
                      {learnedCount > 0 && <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">🧠 {learnedCount} auto-filled from memory</span>}
                    </div>
                  )}
                  {memoryTotal > 0 && (
                    <span className="ml-auto rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700" title="Corrections the system has learned">
                      🧠 Memory: {memoryTotal} learned
                    </span>
                  )}
                </div>
              </div>
              {busy && <div className="mt-3 text-xs font-bold text-slate-400">OCR takes ~6 seconds per page, please wait…</div>}
            </section>

            {hasResult && (
              <>
                <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)] sm:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-sm font-black uppercase tracking-wide text-slate-700">PV Header (auto-filled · editable)</div>
                    {reviewCount > 0 && <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700"><AlertTriangle size={13} />{reviewCount} to review</span>}
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[['pv_no', 'PV No.'], ['item', 'Item'], ['date', 'Date'], ['project', 'Project'], ['name', 'Name'], ['issued', 'Issued']].map(HF)}
                  </div>
                  <label className="mt-3 flex flex-col gap-1">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Vendor (table header)</span>
                    <input value={vendor} onChange={e => setVendor(e.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 focus:border-blue-400 focus:outline-none" />
                  </label>
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
                  <div className="border-b border-slate-100 px-5 py-4 text-sm font-black uppercase tracking-wide text-slate-700">Bill items ({rows.length}) — review/edit before generating PV</div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                          <th className="px-3 py-3">#</th>
                          <th className="px-3 py-3">{idLabel}</th>
                          <th className="px-3 py-3">Period</th>
                          <th className="px-3 py-3 text-right">Amount</th>
                          <th className="px-3 py-3 text-right">Vat 7%</th>
                          <th className="px-3 py-3 text-right">WHT {pct(whtRate)}</th>
                          <th className="px-3 py-3 text-right">Net Total</th>
                          <th className="px-3 py-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, i) => (
                          <tr key={i} className={`border-t border-slate-100 ${r.needs_review ? 'bg-amber-50/60' : ''}`}>
                            <td className="px-3 py-2 font-bold text-slate-400">
                              {r.needs_review ? <AlertTriangle size={14} className="text-amber-500" />
                                : r.learned ? <span title="Auto-filled from memory" className="text-emerald-500">🧠</span>
                                : i + 1}
                            </td>
                            <td className="px-3 py-2"><input value={r.identifier} onChange={e => updateLine(i, 'identifier', e.target.value)} className="w-36 rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none" /></td>
                            <td className="px-3 py-2"><input value={r.period} onChange={e => updateLine(i, 'period', e.target.value)} className="w-44 rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none" /></td>
                            <td className="px-3 py-2 text-right"><input type="number" step="0.01" value={r.amount} onChange={e => updateLine(i, 'amount', e.target.value)} className="w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-right text-sm focus:border-blue-400 focus:outline-none" /></td>
                            <td className="px-3 py-2 text-right">
                              {profile && profile.extract_vat === false
                                ? <span className="text-slate-300">–</span>
                                : <input type="number" step="0.01" value={r.vat} onChange={e => updateLine(i, 'vat', e.target.value)} className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-right text-sm focus:border-blue-400 focus:outline-none" />}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-red-600">{r.wht ? `(${fmt(r.wht)})` : <span className="text-slate-300">–</span>}</td>
                            <td className="px-3 py-2 text-right font-black text-slate-900">{fmt(r.net)}</td>
                            <td className="px-3 py-2 text-right"><button type="button" onClick={() => removeLine(i)} className="text-slate-300 hover:text-red-500"><Trash2 size={15} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-200 bg-slate-50 font-black text-slate-900">
                          <td className="px-3 py-3" colSpan={3}>Total</td>
                          <td className="px-3 py-3 text-right">{fmt(totals.amount)}</td>
                          <td className="px-3 py-3 text-right">{totals.vat ? fmt(totals.vat) : '–'}</td>
                          <td className="px-3 py-3 text-right text-red-600">{totals.wht ? `(${fmt(totals.wht)})` : '–'}</td>
                          <td className="px-3 py-3 text-right">{fmt(totals.net)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </section>

                {savedMsg && (
                  <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                    <BookCheck size={18} />{savedMsg}
                    <a href="/finance/accounting" className="ml-2 underline underline-offset-2 hover:text-emerald-900">Open PV Ledger →</a>
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <div className="mr-auto text-sm font-semibold text-slate-400">WHT {pct(whtRate)} and Net are computed automatically per bill type · change "Bill type" above to adjust the formula/form</div>
                  <button type="button" onClick={() => saveToAccounting()} disabled={saving || rows.length === 0}
                    className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-black text-white shadow-sm transition disabled:opacity-50" style={{ background: ACE_GREEN }}>
                    {saving ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Saving…</> : <><Save size={18} />Save to Accounting</>}
                  </button>
                  <button type="button" onClick={generatePV} disabled={generating || rows.length === 0}
                    className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-black text-white shadow-sm transition disabled:opacity-50" style={{ background: ACE_RED }}>
                    {generating ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Generating…</> : <><Download size={18} />Generate PV (Download Excel)</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
