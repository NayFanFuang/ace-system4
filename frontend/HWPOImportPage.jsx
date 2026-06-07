import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Activity, ArrowUpRight, ArrowDownRight,
  Bell, CalendarDays, ChevronDown, ChevronRight,
  Command, FileSpreadsheet, FileUp, Home, LogOut, Menu, RefreshCw, Search,
  Sparkles, Upload, Database, Eye, X, MapPin, FileText, LayoutGrid,
} from 'lucide-react'
import { apiFetch } from './src/apiFetch.js'

const ACE_BLUE = '#2447d8'
const ACE_RED  = '#c73b32'
const BLUE     = '#2447d8'
const NAVY     = '#1f2937'
const COMPANY  = 'AirConnect Engineering'

function Card({ children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.06)] ${className}`}>
      {children}
    </section>
  )
}

function IconButton({ children, label, onClick, disabled = false }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0 active:translate-y-0"
    >
      {children}
    </button>
  )
}

function StatCard({ label, value, helper, tone = ACE_BLUE, icon: Icon = Activity, delta = null, deltaTone = 'positive' }) {
  return (
    <Card className="group p-5 transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_24px_70px_rgba(36,71,216,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `${tone}12`, color: tone }}>
          <Icon size={21} strokeWidth={2.3} />
        </div>
        {delta != null && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${deltaTone === 'positive' ? 'bg-emerald-50 text-emerald-700' : deltaTone === 'warn' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
            {deltaTone === 'positive' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {delta}
          </span>
        )}
      </div>
      <div className="mt-5 text-sm font-bold text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-black tracking-normal text-slate-950">{value}</div>
      {helper && <div className="mt-2 text-sm font-semibold text-slate-400">{helper}</div>}
    </Card>
  )
}

function initials(name) {
  return String(name || 'AC').split(/\s+/).filter(Boolean).slice(0, 2)
    .map(p => p[0]).join('').toUpperCase() || 'AC'
}

function formatToday() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  })
}

const ACE_PROJECT_RULES = [
  {
    ace_code: 'HWT2304',
    ace_name: 'HWT2304',
    types: [
      { type: 'SSV', label: 'SSV', match: item => (item||'').startsWith('B_Single Site Verification') },
      { type: 'PAC', label: 'PAC', match: item => (item||'').startsWith('B_SSOA') || (item||'').startsWith('B_Cluster') },
    ],
  },
  {
    ace_code: 'HWT2604',
    ace_name: 'HWT2604',
    types: [
      { type: 'SSV', label: 'SSV', match: item => (item||'').startsWith('A_Single Site Verification') },
      { type: 'PAC', label: 'PAC', match: item => (item||'').startsWith('A_SSOA') || (item||'').startsWith('A_Cluster') },
    ],
  },
]

const HW_COLUMN_MAP = [
  { hw: 'Project Code',    db: 'project_code',  note: 'Project code' },
  { hw: 'PO NO.',          db: 'po_number',      note: 'PO number (primary key)' },
  { hw: 'PO Line NO.',     db: 'po_line',        note: 'PO line number (secondary key)' },
  { hw: 'Site Code',       db: 'cluster_site',   note: 'Site code from HW' },
  { hw: 'Site ID',         db: 'du_id',          note: 'DU-ID / Internal Site ID' },
  { hw: 'Item Description',db: 'item_dis',       note: 'Work item description' },
  { hw: 'Acceptance Date', db: 'on_air',         note: 'Acceptance date (On-Air)' },
  { hw: '(auto)',          db: 'po_target = RF', note: 'Set all rows as RF' },
  { hw: '(auto)',          db: 'work_type',      note: '"Single Site Verification" → SSV' },
]

const STATUS_COLOR = {
  NEW: '#64748b', AUTO_MAPPED: '#2447d8', NEED_REVIEW: '#d97706',
  PENDING_SITE_MAP: '#7c3aed', SITE_MAPPED: '#0891b2',
  PLANNED: '#059669', IN_PROGRESS: '#16a34a', WORK_DONE: '#15803d',
  LEADER_CHECKING: '#b45309', LEADER_APPROVED: '#166534',
  PENDING_PAYMENT: '#9a3412', PENDING_BILLING: '#7f1d1d',
  DTE_PAID: '#134e4a', HW_BILLED: '#1e3a5f', CLOSED: '#374151',
}

const S = {
  card: {
    background: '#fff', borderRadius: 16,
    border: '1px solid rgba(226,232,240,0.8)',
    boxShadow: '0 18px 55px rgba(15,23,42,0.06)',
    overflow: 'hidden',
  },
  cardHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #f1f5f9',
    fontWeight: 900,
    fontSize: '.92rem',
    color: NAVY,
    background: '#fff',
  },
  cardBody: { padding: 20 },
  dropZone: (drag) => ({
    border: `2px dashed ${drag ? BLUE : '#cbd5e1'}`,
    borderRadius: 10, padding: '32px 24px', textAlign: 'center',
    background: drag ? 'rgba(36,71,216,.04)' : '#fafbfc',
    cursor: 'pointer', transition: 'all .15s',
  }),
  tag: (color) => ({
    display: 'inline-block', padding: '2px 8px', borderRadius: 99,
    fontSize: '.68rem', fontWeight: 700,
    background: color + '1a', color: color,
  }),
}

function StatPill({ label, value, color, small }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', boxShadow: '0 4px 14px rgba(15,23,42,0.06)', border: '1px solid rgba(226,232,240,0.8)', textAlign: 'center' }}>
      <div style={{ fontSize: small ? '1.1rem' : '1.9rem', fontWeight: 900, color, lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: '.76rem', fontWeight: 800, color: NAVY, marginTop: 4 }}>{label}</div>
    </div>
  )
}

// ─── MasterDB Import Card ────────────────────────────────────
function MasterDBImportCard() {
  const [file, setFile]     = useState(null)
  const [busy, setBusy]     = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError]   = useState('')
  const fileRef = useRef()

  async function doImport() {
    if (!file) return
    setBusy(true); setError(''); setResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res  = await apiFetch('/api/sites/import-masterdb', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Import failed')
      setResult(data)
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  return (
    <div style={S.card}>
      <div style={S.cardHeader}>🗺️ Import MasterDB — Site Lat/Lng</div>
      <div style={S.cardBody}>
        <div style={{ fontSize: '.76rem', color: '#64748b', marginBottom: 12 }}>
          MasterDB file (.xlsx) → Sheet <strong>Site ID</strong> → columns: Site ID, Latitude, Longitude, Province
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <input ref={fileRef} type="file" accept=".xlsx" style={{ display: 'none' }}
            onChange={e => { setFile(e.target.files?.[0] || null); setResult(null); setError('') }} />
          <button onClick={() => fileRef.current?.click()}
            style={{ padding: '7px 16px', borderRadius: 7, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '.78rem', fontWeight: 600 }}>
            📂 Choose file
          </button>
          {file && <span style={{ fontSize: '.76rem', color: NAVY, fontWeight: 600 }}>{file.name}</span>}
          <button onClick={doImport} disabled={!file || busy}
            style={{ padding: '7px 20px', borderRadius: 7, border: 'none', background: file && !busy ? '#0891b2' : '#cbd5e1', color: '#fff', cursor: file && !busy ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: '.78rem' }}>
            {busy ? '⏳ Importing…' : '🚀 Import'}
          </button>
        </div>

        {error && <div style={{ marginTop: 10, padding: '8px 12px', background: '#fef2f2', borderRadius: 7, border: '1px solid #fecaca', color: '#b91c1c', fontSize: '.78rem' }}>⚠️ {error}</div>}

        {result && (
          <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ padding: '4px 12px', borderRadius: 99, background: '#dcfce7', color: '#15803d', fontSize: '.76rem', fontWeight: 700 }}>Inserted {result.inserted}</span>
            <span style={{ padding: '4px 12px', borderRadius: 99, background: '#dbeafe', color: '#1d4ed8', fontSize: '.76rem', fontWeight: 700 }}>Updated {result.updated}</span>
            <span style={{ padding: '4px 12px', borderRadius: 99, background: '#f1f5f9', color: '#64748b', fontSize: '.76rem', fontWeight: 700 }}>Skipped {result.skipped}</span>
            <span style={{ padding: '4px 12px', borderRadius: 99, background: '#f0fdf4', color: '#166534', fontSize: '.76rem', fontWeight: 700 }}>Total {result.total} sites</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Rollout Plan Import Card ────────────────────────────────
function RolloutPlanImportCard() {
  const [file, setFile]     = useState(null)
  const [busy, setBusy]     = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError]   = useState('')
  const fileRef = useRef()

  async function doImport() {
    if (!file) return
    setBusy(true); setError(''); setResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res  = await apiFetch('/api/sites/import-rollout-plan', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Import failed')
      setResult(data)
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  return (
    <div style={S.card}>
      <div style={S.cardHeader}>📅 Import Rollout Plan — Full On-Air</div>
      <div style={S.cardBody}>
        <div style={{ fontSize: '.76rem', color: '#64748b', marginBottom: 12 }}>
          ISDP file (.xlsm / .xlsx) → Sheet <strong>Site Rollout Plan</strong> → col B = Site Code · col O = Full On-Air Actual
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <input ref={fileRef} type="file" accept=".xlsx,.xlsm" style={{ display: 'none' }}
            onChange={e => { setFile(e.target.files?.[0] || null); setResult(null); setError('') }} />
          <button onClick={() => fileRef.current?.click()}
            style={{ padding: '7px 16px', borderRadius: 7, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '.78rem', fontWeight: 600 }}>
            📂 Choose file
          </button>
          {file && <span style={{ fontSize: '.76rem', color: NAVY, fontWeight: 600 }}>{file.name}</span>}
          <button onClick={doImport} disabled={!file || busy}
            style={{ padding: '7px 20px', borderRadius: 7, border: 'none', background: file && !busy ? '#059669' : '#cbd5e1', color: '#fff', cursor: file && !busy ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: '.78rem' }}>
            {busy ? '⏳ Importing…' : '🚀 Import'}
          </button>
        </div>

        {error && <div style={{ marginTop: 10, padding: '8px 12px', background: '#fef2f2', borderRadius: 7, border: '1px solid #fecaca', color: '#b91c1c', fontSize: '.78rem' }}>⚠️ {error}</div>}

        {result && (
          <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ padding: '4px 12px', borderRadius: 99, background: '#dbeafe', color: '#1d4ed8', fontSize: '.76rem', fontWeight: 700 }}>Updated {result.updated} sites</span>
            <span style={{ padding: '4px 12px', borderRadius: 99, background: '#dcfce7', color: '#15803d', fontSize: '.76rem', fontWeight: 700 }}>Inserted {result.inserted} sites</span>
            <span style={{ padding: '4px 12px', borderRadius: 99, background: '#f0fdf4', color: '#166534', fontSize: '.76rem', fontWeight: 700 }}>Total {result.total_sites_in_file} sites in file</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Import Tab ──────────────────────────────────────────────
function ImportTab() {
  const [drag, setDrag]         = useState(false)
  const [file, setFile]         = useState(null)
  const [busy, setBusy]         = useState(false)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState('')
  const [showUpd, setShowUpd]   = useState(false)
  const [showSkip, setShowSkip] = useState(false)
  const [showErr, setShowErr]   = useState(false)
  const [logs, setLogs]         = useState([])
  const [preview, setPreview]   = useState(null)   // dry-run result
  const [previewing, setPreviewing] = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    apiFetch('/api/project-pos/import-hw/logs')
      .then(r => r.json()).then(d => setLogs(d.data || [])).catch(() => {})
  }, [])

  function handleFiles(files) {
    const f = files?.[0]
    if (!f) return
    if (!f.name.match(/\.(xlsx|xlsm)$/i)) { setError('Only .xlsx / .xlsm supported'); return }
    setFile(f); setResult(null); setError(''); setPreview(null)
    doPreview(f)   // auto dry-run to show column mapping + counts
  }

  async function doPreview(f) {
    setPreviewing(true); setError('')
    try {
      const fd = new FormData()
      fd.append('file', f)
      const res = await apiFetch('/api/project-pos/import-hw?dry_run=true', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Preview failed')
      setPreview(data)
    } catch (e) { setError(e.message); setPreview(null) }
    finally { setPreviewing(false) }
  }

  async function doImport() {
    if (!file) return
    setBusy(true); setError(''); setResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await apiFetch('/api/project-pos/import-hw', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Import failed')
      setResult(data); setPreview(null)
      apiFetch('/api/project-pos/import-hw/logs')
        .then(r => r.json()).then(d => setLogs(d.data || [])).catch(() => {})
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  function reset() { setFile(null); setResult(null); setError(''); setShowSkip(false); setShowErr(false); setPreview(null) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Column mapping */}
      <div style={S.card}>
        <div style={S.cardHeader}>📋 Column Mapping — HW Format → ACE System</div>
        <div style={S.cardBody}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.78rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['HW Column','DB Field','Note'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'6px 12px', color:'#64748b', fontWeight:700, borderBottom:'1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HW_COLUMN_MAP.map((m, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding:'5px 12px', fontFamily:'monospace', color: m.hw==='(auto)' ? '#94a3b8' : NAVY }}>{m.hw}</td>
                  <td style={{ padding:'5px 12px' }}><span style={S.tag(BLUE)}>{m.db}</span></td>
                  <td style={{ padding:'5px 12px', color:'#64748b' }}>{m.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 8, fontSize: '.72rem', color: '#94a3b8' }}>
            * Duplicate key: (PO NO. + PO Line NO.) — duplicates are auto-skipped without modifying existing records
          </div>
        </div>
      </div>

      {/* Upload */}
      <div style={S.card}>
        <div style={S.cardHeader}>📁 Select Excel file (HW Format)</div>
        <div style={S.cardBody}>
          {!file ? (
            <div
              style={S.dropZone(drag)}
              onDragOver={e => { e.preventDefault(); setDrag(true) }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files) }}
              onClick={() => fileRef.current?.click()}
            >
              <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>📂</div>
              <div style={{ fontWeight: 700, color: NAVY, marginBottom: 4 }}>Drag &amp; drop or click to choose a file</div>
              <div style={{ fontSize: '.76rem', color: '#64748b' }}>Supports .xlsx / .xlsm · HW Format only</div>
              <input ref={fileRef} type="file" accept=".xlsx,.xlsm" style={{ display:'none' }} onChange={e => handleFiles(e.target.files)} />
            </div>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'#f0fdf4', borderRadius:8, border:'1px solid #bbf7d0' }}>
              <div style={{ fontSize:'1.4rem' }}>📗</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, color:'#15803d', fontSize:'.86rem' }}>{file.name}</div>
                <div style={{ fontSize:'.72rem', color:'#16a34a', marginTop:1 }}>{(file.size/1024).toFixed(0)} KB · ready to import</div>
              </div>
              <button onClick={reset} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer' }}>✕</button>
            </div>
          )}

          {error && (
            <div style={{ marginTop:10, padding:'9px 13px', background:'#fef2f2', borderRadius:8, border:'1px solid #fecaca', color:'#b91c1c', fontSize:'.8rem' }}>⚠️ {error}</div>
          )}

          {previewing && (
            <div style={{ marginTop:12, padding:'10px 14px', color:'#64748b', fontSize:'.8rem' }}>⏳ Checking columns &amp; duplicates…</div>
          )}

          {/* Preview (dry-run) — column mapping + what will happen */}
          {preview && !result && (
            <div style={{ marginTop:14, borderRadius:12, border:`1px solid ${preview.mapping.ok ? '#bbf7d0' : '#fecaca'}`, overflow:'hidden' }}>
              <div style={{ padding:'10px 14px', background: preview.mapping.ok ? '#f0fdf4' : '#fef2f2', fontWeight:800, fontSize:'.82rem', color: preview.mapping.ok ? '#15803d' : '#b91c1c' }}>
                {preview.mapping.ok ? '✓ Preview — ready to import' : '✗ Cannot import — required column missing'}
              </div>
              <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:10 }}>
                {/* what-if counts */}
                <div style={{ display:'flex', gap:18, flexWrap:'wrap', fontSize:'.8rem' }}>
                  <span><b style={{ color:'#16a34a' }}>{preview.imported}</b> new</span>
                  <span><b style={{ color:'#7c3aed' }}>{preview.updated}</b> status update</span>
                  <span><b style={{ color:'#d97706' }}>{preview.skipped}</b> duplicate (skip)</span>
                  <span><b style={{ color:'#dc2626' }}>{preview.errors}</b> error</span>
                </div>
                {/* matched columns */}
                <div style={{ fontSize:'.74rem', color:'#475569' }}>
                  <b>Mapped {preview.mapping.matched.length} columns:</b>{' '}
                  {preview.mapping.matched.map((m,i) => (
                    <span key={i} style={{ ...S.tag('#16a34a'), margin:'2px', fontSize:'.66rem' }} title={`→ ${m.field}`}>{m.column}</span>
                  ))}
                </div>
                {preview.mapping.missing_fields.length > 0 && (
                  <div style={{ fontSize:'.74rem', color:'#d97706' }}>
                    <b>Not found (optional):</b> {preview.mapping.missing_fields.join(', ')}
                  </div>
                )}
                {preview.mapping.required_missing.length > 0 && (
                  <div style={{ fontSize:'.74rem', color:'#dc2626', fontWeight:700 }}>
                    ⚠️ Required missing: {preview.mapping.required_missing.join(', ')}
                  </div>
                )}
                {preview.mapping.duplicate_headers.length > 0 && (
                  <div style={{ fontSize:'.74rem', color:'#d97706' }}>
                    ⚠️ Duplicate headers (first used): {preview.mapping.duplicate_headers.join(', ')}
                  </div>
                )}
                {preview.imported === 0 && preview.updated === 0 && preview.mapping.ok && (
                  <div style={{ fontSize:'.74rem', color:'#d97706', fontWeight:700 }}>
                    ℹ️ Nothing new — this file looks already imported ({preview.skipped} duplicates).
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ marginTop:14, display:'flex', gap:10 }}>
            <button
              onClick={doImport}
              disabled={!file || busy || previewing || !(preview && preview.mapping.ok)}
              style={{ padding:'9px 26px', borderRadius:8, border:'none',
                cursor:(file && !busy && preview?.mapping?.ok) ? 'pointer' : 'not-allowed',
                background:(file && !busy && preview?.mapping?.ok) ? BLUE : '#cbd5e1', color:'#fff', fontWeight:700, fontSize:'.86rem' }}>
              {busy ? '⏳ Importing…' : '🚀 Confirm Import'}
            </button>
            {result && <button onClick={reset} style={{ padding:'9px 18px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontWeight:600, fontSize:'.84rem', color:NAVY }}>New Import</button>}
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
            <StatPill label="Newly Inserted" value={result.imported} color="#16a34a" />
            <StatPill label="Status Updated" value={result.updated || 0} color="#7c3aed" />
            <StatPill label="No Change" value={result.skipped} color="#d97706" />
            <StatPill label="Error" value={result.errors} color="#dc2626" />
          </div>

          {(result.updated || 0) > 0 && (
            <div style={S.card}>
              <div style={{ ...S.cardHeader, display:'flex', justifyContent:'space-between' }}>
                <span>🔄 Status Updated ({result.updated})</span>
                <button onClick={() => setShowUpd(v=>!v)} style={{ background:'none', border:'none', cursor:'pointer', color:'#7c3aed', fontWeight:700, fontSize:'.78rem' }}>{showUpd?'Hide':'Show'}</button>
              </div>
              {showUpd && (
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.76rem' }}>
                  <thead><tr style={{ background:'#f5f3ff' }}>
                    {['PO Number','Line','Old Status','New Status'].map(h=><th key={h} style={{ padding:'6px 14px', textAlign:'left', color:'#5b21b6', fontWeight:700 }}>{h}</th>)}
                  </tr></thead>
                  <tbody>{(result.updated_rows||[]).map((r,i)=>(
                    <tr key={i} style={{ borderBottom:'1px solid #ede9fe' }}>
                      <td style={{ padding:'5px 14px', fontFamily:'monospace' }}>{r.po_number}</td>
                      <td style={{ padding:'5px 14px' }}>{r.po_line}</td>
                      <td style={{ padding:'5px 14px', color:'#94a3b8' }}>{r.old_status || '—'}</td>
                      <td style={{ padding:'5px 14px', fontWeight:700, color: r.new_status==='CANCELLED'?'#dc2626':r.new_status==='OPEN'?'#16a34a':'#64748b' }}>{r.new_status}</td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </div>
          )}

          {result.skipped > 0 && (
            <div style={S.card}>
              <div style={{ ...S.cardHeader, display:'flex', justifyContent:'space-between' }}>
                <span>⏭ No Change ({result.skipped})</span>
                <button onClick={() => setShowSkip(v=>!v)} style={{ background:'none', border:'none', cursor:'pointer', color:BLUE, fontWeight:700, fontSize:'.78rem' }}>{showSkip?'Hide':'Show'}</button>
              </div>
              {showSkip && (
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.76rem' }}>
                  <thead><tr style={{ background:'#fffbeb' }}>
                    {['PO Number','Line','Reason'].map(h=><th key={h} style={{ padding:'6px 14px', textAlign:'left', color:'#92400e', fontWeight:700 }}>{h}</th>)}
                  </tr></thead>
                  <tbody>{result.skipped_rows.map((r,i)=>(
                    <tr key={i} style={{ borderBottom:'1px solid #fef3c7' }}>
                      <td style={{ padding:'5px 14px', fontFamily:'monospace' }}>{r.po_number}</td>
                      <td style={{ padding:'5px 14px' }}>{r.po_line}</td>
                      <td style={{ padding:'5px 14px', color:'#d97706' }}>{r.reason}</td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </div>
          )}

          {result.errors > 0 && (
            <div style={S.card}>
              <div style={{ ...S.cardHeader, display:'flex', justifyContent:'space-between' }}>
                <span>❌ Error ({result.errors})</span>
                <button onClick={() => setShowErr(v=>!v)} style={{ background:'none', border:'none', cursor:'pointer', color:BLUE, fontWeight:700, fontSize:'.78rem' }}>{showErr?'Hide':'Show'}</button>
              </div>
              {showErr && (
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.76rem' }}>
                  <thead><tr style={{ background:'#fef2f2' }}>
                    {['Row','PO Number','Error'].map(h=><th key={h} style={{ padding:'6px 14px', textAlign:'left', color:'#991b1b', fontWeight:700 }}>{h}</th>)}
                  </tr></thead>
                  <tbody>{result.error_rows.map((r,i)=>(
                    <tr key={i} style={{ borderBottom:'1px solid #fee2e2' }}>
                      <td style={{ padding:'5px 14px' }}>{r.row}</td>
                      <td style={{ padding:'5px 14px', fontFamily:'monospace' }}>{r.po_number}</td>
                      <td style={{ padding:'5px 14px', color:'#dc2626' }}>{r.error}</td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </div>
          )}

          {result.imported > 0 && (
            <div style={S.card}>
              <div style={S.cardHeader}>✅ Imported {result.imported} rows successfully (showing first 20)</div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.76rem' }}>
                  <thead><tr style={{ background:'#f0fdf4' }}>
                    {['PO Number','Line','Project','ACE Project','Work Type','Item Description'].map(h=><th key={h} style={{ padding:'6px 14px', textAlign:'left', color:'#166534', fontWeight:700 }}>{h}</th>)}
                  </tr></thead>
                  <tbody>{result.imported_rows.slice(0,20).map((r,i)=>(
                    <tr key={i} style={{ borderBottom:'1px solid #dcfce7' }}>
                      <td style={{ padding:'5px 14px', fontFamily:'monospace', fontSize:'.72rem' }}>{r.po_number}</td>
                      <td style={{ padding:'5px 14px' }}>{r.po_line}</td>
                      <td style={{ padding:'5px 14px', fontWeight:700, color:BLUE }}>{r.project_code}</td>
                      <td style={{ padding:'5px 14px', fontWeight:700, color:'#7c3aed' }}>{r.ace_project_code || '—'}</td>
                      <td style={{ padding:'5px 14px' }}>{r.work_type ? <span style={S.tag('#16a34a')}>{r.work_type}</span> : <span style={{ color:'#94a3b8' }}>—</span>}</td>
                      <td style={{ padding:'5px 14px', color:'#475569', maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.item_dis}</td>
                    </tr>
                  ))}</tbody>
                </table>
                {result.imported > 20 && <div style={{ padding:'7px 14px', fontSize:'.72rem', color:'#94a3b8', borderTop:'1px solid #dcfce7' }}>… and {result.imported-20} more rows</div>}
              </div>
            </div>
          )}
        </>
      )}

      <MasterDBImportCard />
      <RolloutPlanImportCard />

      {/* Import history */}
      {logs.length > 0 && (
        <div style={S.card}>
          <div style={S.cardHeader}>🕒 Import History (last 50)</div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.76rem' }}>
              <thead>
                <tr style={{ background:'#f8fafc' }}>
                  {['Date/Time','File','Size','Inserted','Updated','Skipped','Error','By'].map(h => (
                    <th key={h} style={{ padding:'6px 12px', textAlign:'left', color:'#64748b', fontWeight:700, borderBottom:'1px solid #e2e8f0', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => {
                  const dt = log.imported_at ? new Date(log.imported_at) : null
                  const dtStr = dt ? dt.toLocaleString('en-GB', { dateStyle:'short', timeStyle:'short' }) : '—'
                  return (
                    <tr key={log.id} style={{ borderBottom:'1px solid #f1f5f9', background: i%2===0 ? '#fff' : '#fafbfc' }}>
                      <td style={{ padding:'5px 12px', whiteSpace:'nowrap', color:'#475569' }}>{dtStr}</td>
                      <td style={{ padding:'5px 12px', color:NAVY, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{log.file_name || '—'}</td>
                      <td style={{ padding:'5px 12px', color:'#64748b', whiteSpace:'nowrap' }}>{log.file_size_kb ? `${log.file_size_kb} KB` : '—'}</td>
                      <td style={{ padding:'5px 12px', fontWeight:700, color:'#16a34a' }}>{log.imported}</td>
                      <td style={{ padding:'5px 12px', fontWeight:700, color:'#7c3aed' }}>{log.updated || 0}</td>
                      <td style={{ padding:'5px 12px', color:'#d97706' }}>{log.skipped}</td>
                      <td style={{ padding:'5px 12px', color: log.errors > 0 ? '#dc2626' : '#94a3b8' }}>{log.errors}</td>
                      <td style={{ padding:'5px 12px', color:'#64748b' }}>{log.imported_by || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

const THB = new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function fmtAmt(val) { return val != null ? THB.format(val) : '—' }

function splitAmounts(line_amount, payment_terms) {
  if (line_amount == null) return { ac1: null, ac2: null }
  if (!payment_terms || payment_terms === '100') return { ac1: line_amount, ac2: null }
  const parts = payment_terms.split('/')
  if (parts.length === 2) {
    const p1 = parseFloat(parts[0]) / 100
    const p2 = parseFloat(parts[1]) / 100
    return { ac1: line_amount * p1, ac2: line_amount * p2 }
  }
  return { ac1: line_amount, ac2: null }
}

// ─── Sidebar ─────────────────────────────────────────────────
function FinanceSidebar({ tab, setTab, mobileOpen, onMobileClose }) {
  const nav = [
    { id: 'overview', label: 'PO Overview',        desc: 'By ACE Project',             icon: LayoutGrid },
    { id: 'import',   label: 'Import PO (HW)',     desc: 'Import from HW Excel format', icon: FileUp },
  ]
  return (
    <aside className={`${mobileOpen ? 'fixed inset-y-0 left-0 z-40 flex' : 'hidden'} w-72 flex-col border-r border-slate-200 bg-white/95 p-5 shadow-2xl backdrop-blur lg:sticky lg:top-0 lg:flex lg:h-screen lg:shadow-none lg:overflow-y-auto`}>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${ACE_BLUE}, ${ACE_RED})` }}>
          <Command size={24} />
        </div>
        <div className="min-w-0">
          <div className="text-base font-black text-slate-950">ACE Finance</div>
          <div className="text-xs font-bold text-slate-400">HW PO Import System</div>
        </div>
        <button
          onClick={onMobileClose}
          className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 lg:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="mt-9 space-y-2">
        {nav.map(item => {
          const active = item.id === tab
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => { setTab(item.id); onMobileClose?.() }}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition ${active ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'}`}
            >
              <Icon size={19} />
              <span className="flex min-w-0 flex-col">
                <span>{item.label}</span>
                <span className={`text-[.66rem] font-semibold ${active ? 'text-blue-600/80' : 'text-slate-400'}`}>{item.desc}</span>
              </span>
            </button>
          )
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-sm font-black text-slate-900">
          <Sparkles size={18} style={{ color: ACE_BLUE }} />
          Finance Workspace
        </div>
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
          HW Export · True / DTAC · PO import &amp; review workspace.
        </p>
      </div>
    </aside>
  )
}

// ─── Overview Tab — PO classification by ACE Project ─────────
// Phase 1: every PO is assigned an ACE project_code via the import rule.
// This view shows the breakdown so Finance can verify before drilling in.
const ACE_PROJECT_META = [
  { code: 'HWT2304', label: 'TRUE · B_ (before Jun 5)', color: '#2447d8' },
  { code: 'HWT2601', label: 'TRUE · B_ (from Jun 5)',   color: '#0891b2' },
  { code: 'HWT2604', label: 'AIS + A_ items',           color: '#7c3aed' },
  { code: '__REVIEW__', label: 'Unassigned',            color: '#d97706' },
]

// Columns shown in the expanded PO detail table (raw HW field names from hw_data)
const PO_DETAIL_COLS = [
  'ID', 'Project Name', 'Project Code', 'Site Code', 'PO NO.', 'PO Line NO.',
  'Item Description', 'PO Status', 'Site Name', 'Site ID', 'Sub Contract NO.',
  'PR NO.', 'Item Code', 'Unit Price', 'Line Amount', 'Unit', 'Tax Rate',
  'Currency', 'Payment Terms', 'Subproject Code', 'Start Date', 'End Date',
  'Publish Date', 'Acceptance Date',
]
const PO_NUM_COLS = new Set(['Unit Price', 'Line Amount', 'Tax Rate'])
const PO_DATE_COLS = new Set(['Start Date', 'End Date', 'Publish Date', 'Acceptance Date'])
// For POs without hw_data (older sync_po_true imports), fall back to DB fields
const PO_DB_FALLBACK = {
  'ID': p => p.id,
  'Project Code': p => p.project_code,
  'Site Code': p => p.cluster_site,
  'PO NO.': p => p.po_number,
  'PO Line NO.': p => p.po_line,
  'Item Description': p => p.item_dis,
  'Subproject Code': p => p.subproject_code,
}

function OverviewTab() {
  const [pos, setPos]         = useState([])
  const [projMap, setProjMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)   // ace code currently expanded
  const [selected, setSelected] = useState(() => new Set())  // selected PO ids
  const [moveTarget, setMoveTarget] = useState('')
  const [saving, setSaving]   = useState(false)
  const [search, setSearch]   = useState('')

  // Match a PO against the search query (PO NO. / Site / Item / Project / hw_data)
  function matchSearch(p) {
    const q = search.trim().toLowerCase()
    if (!q) return true
    const d = p.hw_data || {}
    const hay = [
      p.po_number, p.cluster_site, p.item_dis, p.project_code, p.du_id,
      d['PO NO.'], d['Site Code'], d['Site Name'], d['Item Description'],
      d['Subproject Code'], d['ID'], d['PR NO.'],
    ].filter(Boolean).join(' ').toLowerCase()
    return hay.includes(q)
  }

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      apiFetch('/api/projects').then(r => r.ok ? r.json() : { data: [] }),
      apiFetch('/api/project-pos').then(r => r.ok ? r.json() : { data: [] }),
    ]).then(([pj, po]) => {
      const m = {}
      ;(pj.data || []).forEach(p => { m[p.project_code] = p.project_name || p.name || p.project_code })
      setProjMap(m)
      setPos(po.data || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  function toggleExpand(code) {
    setExpanded(prev => prev === code ? null : code)
    setSelected(new Set())
    setMoveTarget('')
  }
  function toggleSelect(id) {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }
  async function doMove() {
    if (!selected.size || !moveTarget) return
    setSaving(true)
    try {
      const body = JSON.stringify({
        po_ids: Array.from(selected),
        ace_project_code: moveTarget === '__REVIEW__' ? null : moveTarget,
      })
      const res = await apiFetch('/api/project-pos/reassign-ace-project', { method: 'POST', body })
      if (!res.ok) throw new Error('move failed')
      setSelected(new Set()); setMoveTarget('')
      load()
    } catch (_) { /* ignore */ }
    finally { setSaving(false) }
  }

  // ACE project codes available as move targets (from project catalog)
  const aceOptions = useMemo(() => {
    const set = new Set(ACE_PROJECT_META.filter(m => m.code !== '__REVIEW__').map(m => m.code))
    Object.keys(projMap).forEach(c => { if (c) set.add(c) })
    return Array.from(set).sort()
  }, [projMap])

  const groups = useMemo(() => {
    const g = {}
    ACE_PROJECT_META.forEach(m => { g[m.code] = { count: 0, amount: 0 } })
    pos.forEach(p => {
      const key = (p.ace_project_code && p.ace_project_code.trim()) ? p.ace_project_code : '__REVIEW__'
      const b = g[key] || (g[key] = { count: 0, amount: 0 })
      b.count++
      b.amount += p.line_amount || 0
    })
    return g
  }, [pos])

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>⏳ Loading POs…</div>
  }

  const total = pos.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Big cards per ACE project */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
        {ACE_PROJECT_META.map(meta => {
          const g = groups[meta.code] || { count: 0, amount: 0, byHw: {} }
          const pct = total ? Math.round((g.count / total) * 100) : 0
          return (
            <div key={meta.code} style={{ ...S.card, padding: '18px 20px', borderTop: `4px solid ${meta.color}` }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 900, color: meta.color }}>
                  {meta.code === '__REVIEW__' ? 'NEED REVIEW' : meta.code}
                </span>
                <span style={{ fontSize: '.7rem', fontWeight: 700, color: '#94a3b8' }}>{pct}%</span>
              </div>
              <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#64748b', marginTop: 2 }}>{meta.label}</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: NAVY, marginTop: 10, lineHeight: 1 }}>{g.count}</div>
              <div style={{ fontSize: '.7rem', fontWeight: 700, color: '#94a3b8', marginTop: 2 }}>PO · ฿{fmtAmt(g.amount)}</div>
            </div>
          )
        })}
      </div>

      {/* Summary table: click a project to expand & reassign its POs */}
      <div style={S.card}>
        <div style={{ ...S.cardHeader, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <span>Summary by ACE Project ({total} POs) · click a code to reassign</span>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search PO / Site / Item…"
              style={{ padding: '6px 10px 6px 30px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '.78rem', width: 240, outline: 'none', fontWeight: 600 }}
            />
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.8rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['ACE Project', 'PO Count', 'Amount (฿)'].map((h, i) => (
                  <th key={h} style={{ padding: '9px 16px', textAlign: i >= 1 ? 'right' : 'left', color: '#64748b', fontWeight: 800, borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ACE_PROJECT_META.map(meta => {
                const g = groups[meta.code] || { count: 0, amount: 0 }
                const isOpen = expanded === meta.code
                const rowsForCode = isOpen
                  ? pos.filter(p => ((p.ace_project_code && p.ace_project_code.trim()) ? p.ace_project_code : '__REVIEW__') === meta.code).filter(matchSearch)
                  : []
                const matchCount = search.trim()
                  ? pos.filter(p => ((p.ace_project_code && p.ace_project_code.trim()) ? p.ace_project_code : '__REVIEW__') === meta.code).filter(matchSearch).length
                  : null
                return (
                  <React.Fragment key={meta.code}>
                    <tr
                      onClick={() => toggleExpand(meta.code)}
                      style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: isOpen ? '#f8fafc' : '#fff' }}
                    >
                      <td style={{ padding: '9px 16px', fontWeight: 800, color: meta.color }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <ChevronRight size={14} style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }} />
                          {meta.code === '__REVIEW__' ? 'NEED REVIEW' : meta.code}
                        </span>
                      </td>
                      <td style={{ padding: '9px 16px', textAlign: 'right', fontWeight: 700 }}>
                        {matchCount != null
                          ? <span style={{ color: matchCount ? ACE_BLUE : '#cbd5e1' }}>{matchCount}<span style={{ color: '#cbd5e1', fontWeight: 600 }}> / {g.count}</span></span>
                          : g.count}
                      </td>
                      <td style={{ padding: '9px 16px', textAlign: 'right', color: NAVY }}>{fmtAmt(g.amount)}</td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={3} style={{ padding: 0, background: '#fbfcfe' }}>
                          {/* Move controls */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid #eef2f7', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '.74rem', fontWeight: 700, color: '#64748b' }}>
                              {selected.size} selected
                            </span>
                            <span style={{ color: '#cbd5e1' }}>→</span>
                            <select
                              value={moveTarget}
                              onChange={e => setMoveTarget(e.target.value)}
                              style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '.76rem', outline: 'none' }}
                            >
                              <option value="">Move to…</option>
                              {aceOptions.filter(c => c !== meta.code).map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                              {meta.code !== '__REVIEW__' && <option value="__REVIEW__">NEED REVIEW (unassign)</option>}
                            </select>
                            <button
                              onClick={doMove}
                              disabled={!selected.size || !moveTarget || saving}
                              style={{
                                padding: '5px 14px', borderRadius: 6, border: 'none', fontSize: '.76rem', fontWeight: 700,
                                cursor: (!selected.size || !moveTarget || saving) ? 'not-allowed' : 'pointer',
                                background: (!selected.size || !moveTarget || saving) ? '#e2e8f0' : ACE_BLUE,
                                color: (!selected.size || !moveTarget || saving) ? '#94a3b8' : '#fff',
                              }}
                            >
                              {saving ? 'Moving…' : 'Move'}
                            </button>
                            <button
                              onClick={() => setSelected(new Set(rowsForCode.map(p => p.id)))}
                              style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '.72rem', fontWeight: 700, background: '#fff', color: '#64748b', cursor: 'pointer' }}
                            >
                              Select all
                            </button>
                          </div>
                          {/* PO list — full HW columns */}
                          <div style={{ maxHeight: 380, overflow: 'auto' }}>
                            <table style={{ borderCollapse: 'collapse', fontSize: '.7rem', whiteSpace: 'nowrap' }}>
                              <thead>
                                <tr style={{ background: '#f1f5f9' }}>
                                  <th style={{ padding: '5px 10px', position: 'sticky', left: 0, background: '#f1f5f9', zIndex: 2 }}></th>
                                  {PO_DETAIL_COLS.map((h, i) => (
                                    <th key={i} style={{ padding: '5px 10px', textAlign: PO_NUM_COLS.has(h) ? 'right' : 'left', color: '#64748b', fontWeight: 700 }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {rowsForCode.map(p => {
                                  const d = p.hw_data || {}
                                  const sel = selected.has(p.id)
                                  return (
                                    <tr key={p.id} onClick={() => toggleSelect(p.id)}
                                        style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: sel ? '#eff6ff' : '#fff' }}>
                                      <td style={{ padding: '4px 10px', position: 'sticky', left: 0, background: sel ? '#eff6ff' : '#fff', zIndex: 1 }}>
                                        <input type="checkbox" checked={sel} readOnly />
                                      </td>
                                      {PO_DETAIL_COLS.map((col, ci) => {
                                        let val
                                        if (col === 'Line Amount') {
                                          val = fmtAmt(p.line_amount)
                                        } else if (d[col] != null && d[col] !== '') {
                                          val = String(d[col])
                                        } else if (PO_DB_FALLBACK[col]) {
                                          const fb = PO_DB_FALLBACK[col](p)
                                          val = (fb != null && fb !== '') ? String(fb) : '—'
                                        } else {
                                          val = '—'
                                        }
                                        const show = PO_DATE_COLS.has(col) ? val.slice(0, 10) : val
                                        return (
                                          <td key={ci} style={{ padding: '4px 10px', textAlign: PO_NUM_COLS.has(col) ? 'right' : 'left', color: '#475569', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }} title={show}>{show}</td>
                                        )
                                      })}
                                    </tr>
                                  )
                                })}
                                {rowsForCode.length === 0 && (
                                  <tr><td colSpan={PO_DETAIL_COLS.length + 1} style={{ padding: '14px', textAlign: 'center', color: '#cbd5e1' }}>No POs</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
              <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                <td style={{ padding: '9px 16px', fontWeight: 900, color: NAVY }}>Total</td>
                <td style={{ padding: '9px 16px', textAlign: 'right', fontWeight: 900, color: NAVY }}>{total}</td>
                <td style={{ padding: '9px 16px', textAlign: 'right', fontWeight: 900, color: NAVY }}>{fmtAmt(pos.reduce((s, p) => s + (p.line_amount || 0), 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────
export default function HWPOImportPage({ authenticatedUser, onLogout }) {
  const [tab, setTab]                   = useState('overview')
  const [projects, setProjects]         = useState([])
  const [selectedProject, setSelected]  = useState(null)
  const [aceFilter, setAceFilter]       = useState(null)
  const [aceCounts, setAceCounts]       = useState({})
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const user = authenticatedUser || {}

  function selectProject(code) { setSelected(code); setAceFilter(null) }
  function selectAce(ace_code, typeObj) {
    setAceFilter({ ace_code, type: typeObj.type, label: typeObj.label, match: typeObj.match })
    setSelected(null)
  }

  useEffect(() => {
    if (tab !== 'view') return
    Promise.all([
      apiFetch('/api/projects').then(r => r.json()),
      apiFetch('/api/project-pos').then(r => r.json()),
    ]).then(([projData, poData]) => {
      const projMap = {}
      ;(projData.data || []).forEach(p => { projMap[p.project_code] = p.project_name || p.name || p.project_code })

      const hwPos = (poData.data || []).filter(p => p.hw_data)

      const counts = {}
      hwPos.forEach(p => { if (p.project_code) counts[p.project_code] = (counts[p.project_code]||0)+1 })
      const list = Object.keys(counts)
        .sort((a, b) => (counts[b]||0) - (counts[a]||0))
        .map(code => ({ code, name: projMap[code] || code, po_count: counts[code] || 0 }))
      setProjects(list)
      if (list.length > 0 && !selectedProject && !aceFilter) setSelected(list[0].code)

      const ac = {}
      ACE_PROJECT_RULES.forEach(rule => {
        rule.types.forEach(t => {
          const key = `${rule.ace_code}|${t.type}`
          ac[key] = hwPos.filter(p => matchAce(p, rule.ace_code, t)).length
        })
      })
      setAceCounts(ac)
    }).catch(() => {})
  }, [tab])

  const totalHw    = useMemo(() => Object.values(aceCounts).reduce((s, n) => s + (n || 0), 0), [aceCounts])
  const ssvTotal   = useMemo(() => Object.entries(aceCounts).filter(([k]) => k.endsWith('|SSV')).reduce((s, [, n]) => s + (n || 0), 0), [aceCounts])
  const pacTotal   = useMemo(() => Object.entries(aceCounts).filter(([k]) => k.endsWith('|PAC')).reduce((s, [, n]) => s + (n || 0), 0), [aceCounts])

  const pageTitle = tab === 'overview'
    ? 'PO Overview — by ACE Project'
    : tab === 'import'
    ? 'Import HW PO System'
    : aceFilter ? `${aceFilter.ace_code} — ${aceFilter.label}`
    : selectedProject ? `View PO — ${selectedProject}`
    : 'View PO by Project'

  const pageSub = tab === 'overview'
    ? 'Each PO is assigned to an ACE Project'
    : tab === 'import'
    ? 'Supports HW Format · "PO 2026.xlsx" and similar layouts · Auto duplicate detection'
    : aceFilter ? `ACE Project ${aceFilter.ace_code} · Work type ${aceFilter.label}`
    : (projects.find(p => p.code === selectedProject)?.name || 'Select a project from the left menu to view POs')

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="flex min-h-screen">
        <FinanceSidebar
          tab={tab}
          setTab={setTab}
          aceFilter={aceFilter}
          selectAce={selectAce}
          aceCounts={aceCounts}
          selectedProject={selectedProject}
          selectProject={selectProject}
          projects={projects}
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
          {/* Sticky top header */}
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/86 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <IconButton label="Open menu" onClick={() => setMobileMenuOpen(true)}>
                <Menu size={19} />
              </IconButton>
              <div className="hidden min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-400 md:flex">
                <Search size={18} />
                <span className="w-full text-sm font-semibold uppercase tracking-[.08em] text-slate-400">
                  Finance · HW PO {tab === 'import' ? 'Import' : 'Viewer'}
                </span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <IconButton label="Notifications">
                  <Bell size={18} />
                </IconButton>
                <button className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:bg-slate-50 sm:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-black text-white" style={{ background: ACE_BLUE }}>
                    {initials(user.name || user.firstName)}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black text-slate-900">{user.name || user.firstName || 'User'}</div>
                    <div className="text-xs font-bold text-slate-400">{user.positionName || user.role || 'Finance Access'}</div>
                  </div>
                  <ChevronDown size={16} className="text-slate-400" />
                </button>
                {onLogout && (
                  <IconButton label="Logout" onClick={onLogout}>
                    <LogOut size={18} />
                  </IconButton>
                )}
              </div>
            </div>
          </header>

          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 flex flex-col gap-6">
            {/* Title section — eyebrow + heading + actions */}
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
                  <Home size={14} />
                  {COMPANY} · Finance · HW PO
                </div>
                <h1 className="mt-4 text-3xl font-black tracking-normal text-slate-950 sm:text-4xl">
                  {pageTitle}
                </h1>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                  {pageSub}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 shadow-sm">
                  <CalendarDays size={17} style={{ color: ACE_RED }} />
                  {formatToday()}
                </div>
              </div>
            </div>

            {/* View tab metric cards */}
            {tab === 'view' && totalHw > 0 && (
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="TOTAL HW PO"  value={totalHw}          helper="HW Format · mapped"        tone={ACE_BLUE}  icon={FileSpreadsheet} />
                <StatCard label="TOTAL SSV"    value={ssvTotal}         helper="Single Site Verification"  tone="#16a34a"   icon={MapPin} />
                <StatCard label="TOTAL PAC"    value={pacTotal}         helper="SSOA / Cluster"            tone="#7c3aed"   icon={Database} />
                <StatCard label="HW PROJECTS"  value={projects.length}  helper="Project codes in file"     tone="#0891b2"   icon={FileText} />
              </section>
            )}

            {/* Tab content */}
            <section>
              {tab === 'overview'
                ? <OverviewTab />
                : tab === 'import'
                ? <ImportTab />
                : <ViewTab selectedProject={selectedProject} aceFilter={aceFilter} />}
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
