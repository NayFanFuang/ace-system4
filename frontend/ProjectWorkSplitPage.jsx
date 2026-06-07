// Project Work Split — ACE UI Kit edition
// Per ACE project, split POs into PAC / SSV / Non-DT.
//   PAC: grouped by cluster (cluster_site)  — 1 cluster = N POs
//   SSV: 1 row per PO                       — 1 PO = 1 DU + 1 item_dis
//   Non-DT: flat row list (→ Finance only)
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Activity, ArrowRight, Layers, FileText,
  Folder, Search, Sparkles, Loader2, CheckCircle2, AlertCircle,
} from 'lucide-react'
import { apiFetch } from './src/apiFetch.js'

const ACE_BLUE = '#2447d8'
const ACE_RED  = '#c0392b'

const THB = new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
const fmtAmt = v => (v != null ? THB.format(v) : '—')

const BUCKETS = [
  { key: 'PAC',      label: 'PAC',     route: '→ Pre-Site DTA', color: '#7c3aed', bg: 'bg-purple-50',  text: 'text-purple-700',  ring: 'ring-purple-200' },
  { key: 'SSV',      label: 'SSV',     route: '→ Pre-Site DTE', color: '#16a34a', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  { key: '__NONE__', label: 'Non-DT',  route: '→ Finance only', color: '#64748b', bg: 'bg-slate-100',  text: 'text-slate-600',   ring: 'ring-slate-200'   },
]

function wtKey(p) {
  const w = (p.work_type || '').toUpperCase()
  return (w === 'PAC' || w === 'SSV') ? w : '__NONE__'
}

// PAC cluster identity = RF Cluster Name (ISDP Col I).
// ISDP import populates project_sites with BOTH Col B (Site Code) and Col C
// (DU ID, e.g. "RYG7235_Flash_RAN_EAS R3") as site_code keys → both map to the
// same rf_cluster_name (Col I, e.g. "EAS-FLASH-0012").
// The PAC PO row carries that DU-ID value in `cluster_site` (site_code is null
// for raw HW POs). So we look up by cluster_site first, then site_code, then
// fall back to cluster_site as the group key when no mapping exists yet.
function clusterKey(p, siteRfClusterByCode) {
  const csUpper = (p.cluster_site || '').toUpperCase()
  const scUpper = (p.site_code    || '').toUpperCase()
  const fromMap = siteRfClusterByCode?.get(csUpper) || siteRfClusterByCode?.get(scUpper)
  const k = (fromMap || p.cluster_site || p.hw_data?.['Cluster - Site'] || p.du_id || `po-${p.id}`).toString().trim()
  return k || `po-${p.id}`
}

function poSiteLabel(p) {
  const d = p.hw_data || {}
  return d['Site Code'] || p.site_code || p.cluster_site || '—'
}

export default function ProjectWorkSplitPage({ authenticatedUser, onLogout, embedded = false }) {
  const [pos, setPos]           = useState([])
  const [sites, setSites]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [project, setProject]   = useState('')
  const [activeTab, setActiveTab] = useState('PAC')
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(() => new Set())
  const [moveTarget, setMoveTarget] = useState('')
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      apiFetch('/api/project-pos').then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
      apiFetch('/api/sites?referenced_only=true').then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
    ])
      .then(([poRes, siteRes]) => {
        setPos((poRes.data || []).filter(p => (p.ace_project_code || '').trim()))
        setSites(siteRes.data || [])
      })
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  // site_code (UPPER) → rf_cluster_name (from ISDP Col I)
  const siteRfClusterByCode = useMemo(() => {
    const m = new Map()
    sites.forEach(s => {
      const code = (s.site_code || '').toUpperCase()
      if (code && s.rf_cluster_name) m.set(code, s.rf_cluster_name)
    })
    return m
  }, [sites])

  // distinct ACE projects (with PO counts)
  const projects = useMemo(() => {
    const m = {}
    pos.forEach(p => { const c = p.ace_project_code; m[c] = (m[c] || 0) + 1 })
    return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([code, count]) => ({ code, count }))
  }, [pos])

  useEffect(() => { if (!project && projects.length) setProject(projects[0].code) }, [projects, project])

  const inProject = useMemo(() => pos.filter(p => p.ace_project_code === project), [pos, project])

  const buckets = useMemo(() => {
    const b = { PAC: [], SSV: [], __NONE__: [] }
    inProject.forEach(p => b[wtKey(p)].push(p))
    return b
  }, [inProject])

  // Group PAC POs by RF Cluster Name (resolved from site lookup, fallback to cluster_site/du_id)
  const pacClusters = useMemo(() => {
    const m = new Map()
    buckets.PAC.forEach(p => {
      const k = clusterKey(p, siteRfClusterByCode)
      if (!m.has(k)) m.set(k, { key: k, label: k, pos: [], amount: 0 })
      const g = m.get(k)
      g.pos.push(p)
      g.amount += (p.line_amount || 0)
    })
    return Array.from(m.values()).sort((a, b) => b.pos.length - a.pos.length)
  }, [buckets.PAC, siteRfClusterByCode])

  const stats = useMemo(() => ({
    pacClusters: pacClusters.length,
    pacPos:      buckets.PAC.length,
    pacAmount:   buckets.PAC.reduce((s, p) => s + (p.line_amount || 0), 0),
    ssvPos:      buckets.SSV.length,
    ssvAmount:   buckets.SSV.reduce((s, p) => s + (p.line_amount || 0), 0),
    nonPos:      buckets.__NONE__.length,
    nonAmount:   buckets.__NONE__.reduce((s, p) => s + (p.line_amount || 0), 0),
    totalAmount: inProject.reduce((s, p) => s + (p.line_amount || 0), 0),
  }), [buckets, pacClusters, inProject])

  function matchSearch(p) {
    const q = search.trim().toLowerCase()
    if (!q) return true
    const d = p.hw_data || {}
    return [p.po_number, p.cluster_site, p.du_id, p.item_dis, d['Site Name'], d['Site Code'], d['Subproject Code']]
      .filter(Boolean).join(' ').toLowerCase().includes(q)
  }

  function changeProject(code) {
    setProject(code); setSelected(new Set()); setMoveTarget('')
  }
  function changeTab(k) {
    setActiveTab(k); setSelected(new Set()); setMoveTarget('')
  }
  function toggleSelect(id) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleClusterSelect(cluster) {
    const ids = cluster.pos.map(p => p.id)
    const allIn = ids.every(id => selected.has(id))
    setSelected(prev => {
      const n = new Set(prev)
      if (allIn) ids.forEach(id => n.delete(id))
      else ids.forEach(id => n.add(id))
      return n
    })
  }
  function showToast(msg, kind = 'success') {
    setToast({ msg, kind })
    setTimeout(() => setToast(null), 3500)
  }

  async function doMove() {
    if (!selected.size || !moveTarget) return
    setSaving(true)
    try {
      const res = await apiFetch('/api/project-pos/reassign-work-type', {
        method: 'POST',
        body: JSON.stringify({ po_ids: Array.from(selected), work_type: moveTarget === '__NONE__' ? null : moveTarget }),
      })
      if (!res.ok) throw new Error('Save failed')
      const newLabel = BUCKETS.find(b => b.key === moveTarget)?.label
      showToast(`Moved ${selected.size} PO → ${newLabel}`)
      setSelected(new Set()); setMoveTarget(''); load()
    } catch (e) {
      showToast(e.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const inner = (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-5">
      {/* Title + concept legend */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-[#2447d8]">
            <Layers size={14} /> Project · Work Split
          </div>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Project Work Split</h1>
          <p className="mt-1 max-w-2xl text-sm font-semibold text-slate-500">
            Split each project's POs by work type. <span className="text-purple-700">PAC</span> groups N POs by <b>RF Cluster Name</b> (from ISDP) · <span className="text-emerald-700">SSV</span> is one PO per DU + item_dis · <span className="text-slate-600">Non-DT</span> goes to Finance only.
          </p>
        </div>
        {!embedded && onLogout && (
          <button onClick={onLogout} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50">
            Logout
          </button>
        )}
      </div>

      {/* Filters: project + search */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5 text-xs font-black uppercase tracking-wider text-slate-500">
          <Folder size={16} style={{ color: ACE_BLUE }} /> ACE Project
        </div>
        <select
          value={project}
          onChange={e => changeProject(e.target.value)}
          className="min-w-[220px] rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-blue-300 focus:bg-white"
        >
          {projects.map(p => <option key={p.code} value={p.code}>{p.code} ({p.count} PO)</option>)}
          {projects.length === 0 && <option value="">— no projects —</option>}
        </select>
        <div className="ml-auto flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-400 sm:max-w-sm">
          <Search size={16} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search PO / DU / Site / item…"
            className="w-full border-0 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatBlock label="PAC Clusters" value={stats.pacClusters} hint={`${stats.pacPos} PO · ฿${fmtAmt(stats.pacAmount)}`} accent="#7c3aed" icon={Layers} />
        <StatBlock label="SSV POs"      value={stats.ssvPos}      hint={`฿${fmtAmt(stats.ssvAmount)}`}                                       accent="#16a34a" icon={FileText} />
        <StatBlock label="Non-DT POs"   value={stats.nonPos}      hint={`฿${fmtAmt(stats.nonAmount)}`}                                       accent="#64748b" icon={AlertCircle} />
        <StatBlock label="Total Amount" value={`฿${fmtAmt(stats.totalAmount)}`} hint={`${inProject.length} PO in project`}              accent={ACE_BLUE} icon={Sparkles} valueIsString />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-slate-200/80 bg-white p-1 shadow-sm">
        {BUCKETS.map(b => {
          const count = b.key === 'PAC' ? `${stats.pacClusters} clusters` : b.key === 'SSV' ? `${stats.ssvPos} PO` : `${stats.nonPos} PO`
          const active = activeTab === b.key
          return (
            <button
              key={b.key}
              onClick={() => changeTab(b.key)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition ${active ? `${b.bg} ${b.text} shadow-sm ring-1 ${b.ring}` : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <span className="inline-flex h-2 w-2 rounded-full" style={{ background: b.color }} />
              {b.label}
              <span className="text-xs font-bold opacity-70">· {count}</span>
              <span className="text-xs font-semibold text-slate-400">{b.route}</span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-16 text-slate-400">
          <Loader2 size={28} className="animate-spin" />
          <div className="text-sm font-bold">Loading project POs…</div>
        </div>
      ) : activeTab === 'PAC' ? (
        <PacClusterTable
          clusters={pacClusters}
          search={search}
          matchSearch={matchSearch}
          selected={selected}
          onToggleClusterSelect={toggleClusterSelect}
          onSelectAll={list => {
            const allIds = list.flatMap(c => c.pos.map(p => p.id))
            const allIn = allIds.length > 0 && allIds.every(id => selected.has(id))
            setSelected(allIn ? new Set() : new Set(allIds))
          }}
        />
      ) : (
        <FlatPoTable
          rows={(buckets[activeTab] || []).filter(matchSearch)}
          selected={selected}
          onToggleSelect={toggleSelect}
          onSelectAll={list => setSelected(new Set(list.map(p => p.id)))}
          variant={activeTab}
        />
      )}

      {/* Sticky action bar */}
      {selected.size > 0 && (
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-[0_18px_55px_rgba(15,23,42,0.16)]">
          <div className="flex items-center gap-2 text-sm font-black text-slate-900">
            <CheckCircle2 size={18} style={{ color: ACE_BLUE }} />
            {selected.size} PO selected
          </div>
          <ArrowRight size={16} className="text-slate-400" />
          <select
            value={moveTarget}
            onChange={e => setMoveTarget(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-blue-300 focus:bg-white"
          >
            <option value="">Move to…</option>
            {BUCKETS.filter(b => b.key !== activeTab).map(b => (
              <option key={b.key} value={b.key}>{b.label} {b.route}</option>
            ))}
          </select>
          <button
            onClick={doMove}
            disabled={!moveTarget || saving}
            className="rounded-2xl px-4 py-2 text-sm font-black text-white shadow-sm transition disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            style={{ background: (!moveTarget || saving) ? undefined : ACE_BLUE }}
          >
            {saving ? 'Saving…' : 'Apply'}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto rounded-2xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50"
          >
            Clear
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold shadow-lg ${toast.kind === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {toast.kind === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          {toast.msg}
        </div>
      )}
    </div>
  )

  if (embedded) return inner
  return (
    <div className="min-h-screen bg-[#f5f7fb] p-6 lg:p-10">
      {inner}
    </div>
  )
}

function StatBlock({ label, value, hint, accent, icon: Icon = Activity, valueIsString }) {
  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_24px_70px_rgba(36,71,216,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `${accent}12`, color: accent }}>
          <Icon size={20} />
        </div>
      </div>
      <div className="mt-4 text-xs font-black uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-1 font-black tracking-tight text-slate-950 ${valueIsString ? 'text-xl' : 'text-3xl'}`} style={{ color: accent }}>{value}</div>
      {hint && <div className="mt-2 text-xs font-bold text-slate-500">{hint}</div>}
    </div>
  )
}

function PacClusterTable({ clusters, search, matchSearch, selected, onToggleClusterSelect, onSelectAll }) {
  const filtered = useMemo(() => {
    if (!search.trim()) return clusters
    const q = search.trim().toLowerCase()
    return clusters
      .map(c => ({ ...c, pos: c.pos.filter(matchSearch) }))
      .filter(c => c.pos.length > 0 || c.key.toLowerCase().includes(q))
  }, [clusters, search, matchSearch])

  if (filtered.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center text-sm font-bold text-slate-400">
        No PAC clusters in this project
      </div>
    )
  }

  const allIds = filtered.flatMap(c => c.pos.map(p => p.id))
  const allSel = allIds.length > 0 && allIds.every(id => selected.has(id))

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
        <input
          type="checkbox"
          checked={allSel}
          onChange={() => onSelectAll(filtered)}
          className="h-4 w-4 cursor-pointer accent-[#2447d8]"
        />
        <div className="text-sm font-black text-slate-900">{filtered.length} RF Cluster · {allIds.length} PO</div>
        <button
          onClick={() => onSelectAll(filtered)}
          className="ml-auto rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
        >
          Select all
        </button>
      </div>
      <div className="max-h-[560px] overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-slate-50 text-slate-500">
            <tr>
              <th className="w-8 px-3 py-2.5"></th>
              <th className="px-3 py-2.5 text-left font-bold">RF Cluster Name</th>
              <th className="px-3 py-2.5 text-center font-bold">จำนวน PO</th>
              <th className="px-3 py-2.5 text-center font-bold">DU</th>
              <th className="px-3 py-2.5 text-left font-bold">Sample DU ID</th>
              <th className="px-3 py-2.5 text-left font-bold">Sample Item</th>
              <th className="px-3 py-2.5 text-right font-bold">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const ids = c.pos.map(p => p.id)
              const allInRow = ids.length > 0 && ids.every(id => selected.has(id))
              const partInRow = !allInRow && ids.some(id => selected.has(id))
              const sampleDu = c.pos[0]?.du_id || c.pos[0]?.cluster_site || '—'
              const sampleItem = c.pos[0]?.item_dis || '—'
              const duCount = new Set(c.pos.map(p => p.du_id).filter(Boolean)).size || c.pos.length
              return (
                <tr
                  key={c.key}
                  onClick={() => onToggleClusterSelect(c)}
                  className={`cursor-pointer border-t border-slate-100 transition ${allInRow ? 'bg-blue-50' : partInRow ? 'bg-blue-50/40' : 'hover:bg-slate-50'}`}
                >
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={allInRow}
                      ref={el => { if (el) el.indeterminate = partInRow }}
                      readOnly
                      className="h-3.5 w-3.5 accent-[#2447d8]"
                    />
                  </td>
                  <td className="px-3 py-2.5 font-black text-purple-700">
                    <span className="inline-flex items-center gap-1.5">
                      <Layers size={13} /> {c.label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center font-black text-slate-900">{c.pos.length}</td>
                  <td className="px-3 py-2.5 text-center font-bold text-slate-500">{duCount}</td>
                  <td className="max-w-[180px] truncate px-3 py-2.5 font-mono text-[11px] text-slate-600">{sampleDu}</td>
                  <td className="max-w-[320px] truncate px-3 py-2.5 text-slate-600" title={sampleItem}>{sampleItem}</td>
                  <td className="px-3 py-2.5 text-right font-bold text-slate-800">{fmtAmt(c.amount)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FlatPoTable({ rows, selected, onToggleSelect, onSelectAll, variant }) {
  const isSsv = variant === 'SSV'
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center text-sm font-bold text-slate-400">
        No POs in this bucket
      </div>
    )
  }
  const allSel = rows.length > 0 && rows.every(p => selected.has(p.id))
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
        <input
          type="checkbox"
          checked={allSel}
          onChange={() => onSelectAll(allSel ? [] : rows)}
          className="h-4 w-4 cursor-pointer accent-[#2447d8]"
        />
        <div className="text-sm font-black text-slate-900">{rows.length} PO</div>
        <button
          onClick={() => onSelectAll(rows)}
          className="ml-auto rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
        >
          Select all
        </button>
      </div>
      <div className="max-h-[560px] overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-slate-50 text-slate-500">
            <tr>
              <th className="w-8 px-3 py-2.5"></th>
              <th className="px-3 py-2.5 text-left font-bold">PO No.</th>
              <th className="px-3 py-2.5 text-left font-bold">Line</th>
              {isSsv && <th className="px-3 py-2.5 text-left font-bold">DU ID</th>}
              <th className="px-3 py-2.5 text-left font-bold">Site</th>
              <th className="px-3 py-2.5 text-left font-bold">Item Description</th>
              <th className="px-3 py-2.5 text-right font-bold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(p => {
              const sel = selected.has(p.id)
              const d = p.hw_data || {}
              return (
                <tr
                  key={p.id}
                  onClick={() => onToggleSelect(p.id)}
                  className={`cursor-pointer border-t border-slate-100 transition ${sel ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                >
                  <td className="px-3 py-2.5"><input type="checkbox" checked={sel} readOnly className="h-3.5 w-3.5 accent-[#2447d8]" /></td>
                  <td className="px-3 py-2.5 font-mono text-[11px] font-bold text-slate-700">{d['PO NO.'] || p.po_number || '—'}</td>
                  <td className="px-3 py-2.5 text-center font-bold text-slate-500">{d['PO Line NO.'] || p.po_line || '—'}</td>
                  {isSsv && <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600">{p.du_id || '—'}</td>}
                  <td className="max-w-[180px] truncate px-3 py-2.5 text-slate-600">{poSiteLabel(p)}</td>
                  <td className="max-w-[360px] truncate px-3 py-2.5 text-slate-600" title={p.item_dis || ''}>{p.item_dis || '—'}</td>
                  <td className="px-3 py-2.5 text-right font-bold text-slate-800">{fmtAmt(p.line_amount)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
