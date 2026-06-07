// RawDataPage — built on the ACE UI Kit pattern (local sidebar + sticky topbar
// + UI primitives). Read-only generic table browser for SUPER_ADMIN.
// Pulls /api/admin/raw-data/sources, then /api/admin/raw-data/{source} per tab.
import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle, ArrowDownAZ, ArrowUpAZ, ArrowUpDown, ChevronLeft, ChevronRight,
  Command, Database, Download, Filter, LogOut, Menu, Plus, RefreshCw, Search,
  Sparkles, Table as TableIcon, X,
} from 'lucide-react'
import { Alert, Button, Card, Spinner } from './src/ui/index.jsx'
import { apiFetch } from './src/apiFetch.js'

const ACE_BLUE = '#2447d8'
const ACE_RED  = '#c0392b'
const ACE_GRADIENT = `linear-gradient(135deg, ${ACE_BLUE} 0%, #6d3f8f 48%, ${ACE_RED} 100%)`

const PAGE_SIZE = 50

function initials(name = '') {
  return name.split(' ').map(x => x[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'AD'
}

function fmtCell(value) {
  if (value === null || value === undefined) return <span className="text-slate-300">—</span>
  if (typeof value === 'boolean') {
    return <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${value ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{String(value)}</span>
  }
  if (typeof value === 'object') {
    const s = JSON.stringify(value)
    return <span className="font-mono text-[11px] text-slate-600" title={s}>{s.length > 60 ? s.slice(0, 57) + '…' : s}</span>
  }
  const s = String(value)
  if (s.length > 80) {
    return <span title={s}>{s.slice(0, 77) + '…'}</span>
  }
  return s
}

export default function RawDataPage({ authenticatedUser = null, onLogout = null }) {
  const [sources, setSources] = useState([])
  const [activeKey, setActiveKey] = useState(null)
  const [sourcesLoading, setSourcesLoading] = useState(true)
  const [sourcesErr, setSourcesErr] = useState('')

  const [rows, setRows] = useState(null)
  const [rowsLoading, setRowsLoading] = useState(false)
  const [rowsErr, setRowsErr] = useState('')

  const [searchInput, setSearchInput] = useState('')
  const [q, setQ] = useState('')
  const [offset, setOffset] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  // Sort: { col, dir } where dir is 'ASC' | 'DESC'. null = backend default.
  const [sort, setSort] = useState(null)
  // Filters: array of { col, value } — sent as ?filter=col:value (ANDed server-side)
  const [filters, setFilters] = useState([])
  const [filterDraftCol, setFilterDraftCol] = useState('')
  const [filterDraftVal, setFilterDraftVal] = useState('')
  const [filterPickerOpen, setFilterPickerOpen] = useState(false)

  async function loadSources() {
    setSourcesLoading(true); setSourcesErr('')
    try {
      const r = await apiFetch('/api/admin/raw-data/sources')
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.detail || 'Cannot load sources')
      setSources(j.data || [])
      if (!activeKey && j.data?.length) setActiveKey(j.data[0].key)
    } catch (err) {
      setSourcesErr(err?.message || 'Cannot load sources')
    } finally { setSourcesLoading(false) }
  }

  async function loadRows() {
    if (!activeKey) return
    setRowsLoading(true); setRowsErr('')
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) })
      if (q) params.set('q', q)
      if (sort?.col) params.set('order_by', `${sort.col} ${sort.dir}`)
      filters.forEach(f => params.append('filter', `${f.col}:${f.value}`))
      const r = await apiFetch(`/api/admin/raw-data/${encodeURIComponent(activeKey)}?${params.toString()}`)
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.detail || 'Cannot load rows')
      setRows(j)
    } catch (err) {
      setRowsErr(err?.message || 'Cannot load rows'); setRows(null)
    } finally { setRowsLoading(false) }
  }

  useEffect(() => { loadSources() }, [])
  useEffect(() => {
    setRows(null); setOffset(0); setQ(''); setSearchInput('')
    setSort(null); setFilters([]); setFilterPickerOpen(false)
    setFilterDraftCol(''); setFilterDraftVal('')
  }, [activeKey])
  useEffect(() => { loadRows() }, [activeKey, q, offset, sort, filters])

  const activeSource = sources.find(s => s.key === activeKey)
  const total = rows?.total ?? 0
  const page = Math.floor(offset / PAGE_SIZE) + 1
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function submitSearch(e) {
    e?.preventDefault()
    setOffset(0); setQ(searchInput.trim())
  }

  function toggleSort(col) {
    setOffset(0)
    setSort(prev => {
      if (!prev || prev.col !== col) return { col, dir: 'ASC' }
      if (prev.dir === 'ASC') return { col, dir: 'DESC' }
      return null // third click clears
    })
  }

  function addFilter() {
    const col = filterDraftCol
    const value = filterDraftVal.trim()
    if (!col || !value) return
    setOffset(0)
    setFilters(prev => [...prev.filter(f => f.col !== col), { col, value }])
    setFilterDraftCol(''); setFilterDraftVal(''); setFilterPickerOpen(false)
  }

  function removeFilter(col) {
    setOffset(0)
    setFilters(prev => prev.filter(f => f.col !== col))
  }

  function clearAll() {
    setOffset(0); setQ(''); setSearchInput('')
    setSort(null); setFilters([])
  }

  function exportCsv() {
    if (!activeKey) return
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (sort?.col) params.set('order_by', `${sort.col} ${sort.dir}`)
    filters.forEach(f => params.append('filter', `${f.col}:${f.value}`))
    const url = `/api/admin/raw-data/${encodeURIComponent(activeKey)}/export${params.toString() ? '?' + params.toString() : ''}`
    // Token is in localStorage; use apiFetch + blob to honor the Bearer header
    apiFetch(url).then(async r => {
      if (!r.ok) {
        const j = await r.json().catch(() => ({}))
        alert(j.detail || 'Export failed'); return
      }
      const blob = await r.blob()
      const dlUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = dlUrl
      a.download = (rows?.table || activeKey) + '.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(dlUrl)
    })
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="flex min-h-screen">
        <RDSidebar
          sources={sources}
          activeKey={activeKey}
          setActiveKey={k => { setActiveKey(k); setMobileMenuOpen(false) }}
          loading={sourcesLoading}
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
              <IconButton label="Open menu" onClick={() => setMobileMenuOpen(true)}>
                <Menu size={19} />
              </IconButton>
              <form
                onSubmit={submitSearch}
                className="hidden min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 md:flex"
              >
                <Search size={18} className="text-slate-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder={activeSource ? `Search ${activeSource.label}…` : 'Search…'}
                  className="flex-1 bg-transparent text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none"
                />
                {q && (
                  <button type="button" onClick={() => { setSearchInput(''); setQ(''); setOffset(0) }} className="text-slate-400 hover:text-slate-600">
                    <X size={16} />
                  </button>
                )}
              </form>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="ghost" icon={Download} onClick={exportCsv} disabled={!rows || !rows.data?.length}>
                  Export CSV
                </Button>
                <Button variant="primary" icon={RefreshCw} loading={rowsLoading} onClick={loadRows}>
                  Refresh
                </Button>
                <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm sm:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-black text-white" style={{ background: ACE_BLUE }}>
                    {initials(authenticatedUser?.name || 'Admin')}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black text-slate-900">{authenticatedUser?.name || 'Admin'}</div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{authenticatedUser?.role || 'Admin'}</div>
                  </div>
                </div>
                {onLogout && (
                  <IconButton label="Logout" onClick={onLogout}>
                    <LogOut size={18} />
                  </IconButton>
                )}
              </div>
            </div>
          </header>

          <div className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-1">
              <h1 className="text-3xl font-black tracking-tight text-slate-950">Raw Data Viewer</h1>
              <p className="text-sm font-semibold text-slate-500">
                Read-only browser for every backing table — for debugging & data audits.
                Sensitive columns (password hashes) are hidden server-side.
              </p>
            </div>

            {sourcesErr && <div className="mb-4"><Alert tone="error" icon={AlertTriangle}>{sourcesErr}</Alert></div>}
            {rowsErr && <div className="mb-4"><Alert tone="error" icon={AlertTriangle}>{rowsErr}</Alert></div>}

            {activeSource && (
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-lg font-black text-slate-900">
                    <TableIcon size={18} style={{ color: ACE_BLUE }} />
                    {activeSource.label}
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">{activeSource.table}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-500">
                    {total.toLocaleString()} rows total
                    {rows?.columns && <span> · {rows.columns.length} columns</span>}
                    {q && <span> · filtered by &ldquo;{q}&rdquo;</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    icon={ChevronLeft}
                    onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                    disabled={offset === 0 || rowsLoading}
                  >
                    Prev
                  </Button>
                  <span className="text-xs font-bold text-slate-600">
                    Page {page} / {pageCount}
                  </span>
                  <Button
                    variant="ghost"
                    iconRight={ChevronRight}
                    onClick={() => setOffset(offset + PAGE_SIZE)}
                    disabled={offset + PAGE_SIZE >= total || rowsLoading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* Filter chips toolbar */}
            {rows && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <Filter size={14} /> Filters
                </div>
                {filters.map(f => (
                  <span key={f.col} className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#2447d8]">
                    <span className="font-mono">{f.col}</span>
                    <span className="text-slate-400">~</span>
                    <span>{f.value}</span>
                    <button onClick={() => removeFilter(f.col)} className="ml-1 text-blue-400 hover:text-blue-700" aria-label="Remove filter">
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {sort?.col && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700">
                    {sort.dir === 'ASC' ? <ArrowUpAZ size={12} /> : <ArrowDownAZ size={12} />}
                    <span className="font-mono">{sort.col}</span>
                    <button onClick={() => setSort(null)} className="ml-1 text-purple-400 hover:text-purple-700" aria-label="Clear sort">
                      <X size={12} />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setFilterPickerOpen(v => !v)}
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-xs font-bold text-slate-500 hover:border-blue-300 hover:text-[#2447d8]"
                >
                  <Plus size={12} /> Add filter
                </button>
                {(filters.length > 0 || sort?.col || q) && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-xs font-bold text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}

            {/* Filter picker popover */}
            {filterPickerOpen && rows && (
              <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <select
                  value={filterDraftCol}
                  onChange={e => setFilterDraftCol(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm font-bold text-slate-700"
                >
                  <option value="">— select column —</option>
                  {rows.columns.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={filterDraftVal}
                  onChange={e => setFilterDraftVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addFilter() }}
                  placeholder="value (ILIKE %value%)"
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm font-semibold text-slate-700"
                />
                <Button variant="primary" onClick={addFilter} disabled={!filterDraftCol || !filterDraftVal.trim()}>Add</Button>
                <Button variant="ghost" onClick={() => setFilterPickerOpen(false)}>Cancel</Button>
              </div>
            )}

            {/* Mobile-only search (header search is desktop) */}
            <form onSubmit={submitSearch} className="mb-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 md:hidden">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder={activeSource ? `Search ${activeSource.label}…` : 'Search…'}
                className="flex-1 bg-transparent text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
              {q && (
                <button type="button" onClick={() => { setSearchInput(''); setQ(''); setOffset(0) }} className="text-slate-400">
                  <X size={16} />
                </button>
              )}
            </form>

            <Card className="overflow-hidden p-0">
              {rowsLoading && !rows ? (
                <div className="p-12 text-center">
                  <Spinner /><div className="mt-3 text-sm font-bold text-slate-500">Loading rows…</div>
                </div>
              ) : !rows ? (
                <div className="p-12 text-center text-sm font-bold text-slate-500">
                  {sourcesLoading ? 'Loading sources…' : 'Select a table'}
                </div>
              ) : rows.data.length === 0 ? (
                <div className="p-12 text-center text-sm font-bold text-slate-500">No rows.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr>
                        {rows.columns.map(c => {
                          const isSortCol = sort?.col === c.name
                          const SortIcon = !isSortCol ? ArrowUpDown : (sort.dir === 'ASC' ? ArrowUpAZ : ArrowDownAZ)
                          return (
                            <th
                              key={c.name}
                              onClick={() => toggleSort(c.name)}
                              title={`Sort by ${c.name}`}
                              className={`group cursor-pointer select-none whitespace-nowrap px-3 py-2 text-left text-[11px] font-black uppercase tracking-wider transition ${
                                isSortCol ? 'bg-purple-50 text-purple-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span>{c.name}</span>
                                <SortIcon size={11} className={isSortCol ? 'text-purple-500' : 'text-slate-300 group-hover:text-slate-500'} />
                              </div>
                              <div className="text-[10px] font-semibold normal-case tracking-normal text-slate-300">{c.type}</div>
                            </th>
                          )
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.data.map((row, i) => (
                        <tr key={i} className="border-b border-slate-100 hover:bg-blue-50/30">
                          {rows.columns.map(c => (
                            <td key={c.name} className="whitespace-nowrap px-3 py-1.5 align-top font-mono text-[12px] text-slate-700">
                              {fmtCell(row[c.name])}
                            </td>
                          ))}
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
    </div>
  )
}

function RDSidebar({ sources, activeKey, setActiveKey, loading, mobileOpen, onMobileClose }) {
  return (
    <aside className={`${mobileOpen ? 'fixed inset-y-0 left-0 z-40 flex' : 'hidden'} w-72 flex-col border-r border-slate-200 bg-white/95 p-5 shadow-lg backdrop-blur lg:sticky lg:top-0 lg:flex lg:h-screen lg:shadow-none lg:overflow-y-auto`}>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: ACE_GRADIENT }}>
          <Database size={24} />
        </div>
        <div className="min-w-0">
          <div className="text-base font-black text-slate-950">Raw Data Viewer</div>
          <div className="text-xs font-bold text-slate-400">Postgres tables · read-only</div>
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
        {loading ? (
          <div className="px-4 py-3 text-xs font-bold text-slate-400">Loading…</div>
        ) : sources.map(s => {
          const active = s.key === activeKey
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setActiveKey(s.key)}
              className={`flex w-full items-center justify-between gap-2 rounded-2xl px-4 py-2.5 text-left text-sm font-black transition ${
                active ? 'bg-blue-50 text-[#2447d8] shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'
              }`}
            >
              <span className="flex items-center gap-3">
                <TableIcon size={16} />
                <span className="truncate">{s.label}</span>
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? 'bg-white text-[#2447d8]' : 'bg-slate-100 text-slate-500'}`}>
                {s.total >= 0 ? s.total.toLocaleString() : '—'}
              </span>
            </button>
          )
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-sm font-black text-slate-900">
          <Sparkles size={18} style={{ color: ACE_BLUE }} />
          Admin Workspace
        </div>
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
          Whitelisted tables only. PII columns are hidden server-side.
        </p>
      </div>
    </aside>
  )
}

function IconButton({ children, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-[#2447d8] hover:shadow-md active:translate-y-0"
    >
      {children}
    </button>
  )
}
