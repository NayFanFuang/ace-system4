import React, { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Download,
  Eye,
  FileDown,
  Filter,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react'
import { apiFetch } from './src/apiFetch.js'
import { formatDateTime24 } from './src/dateFormat.js'

const ACE_GRADIENT = 'bg-[linear-gradient(135deg,#2447d8_0%,#c73b32_100%)]'
const CARD = 'rounded-lg border border-slate-200 bg-white shadow-[0_14px_38px_rgba(16,24,40,.08)]'
const SEVERITY_OPTIONS = ['', 'critical', 'warning', 'info']
const SOURCE_OPTIONS = ['', 'api', 'ui', 'system', 'auth', 'employee', 'data_quality']
const ACTION_OPTIONS = [
  '',
  'employee_created',
  'employee_profile_updated',
  'employee_contract_updated',
  'employee_status_changed',
  'employee_terminated',
  'document_uploaded',
  'document_deleted',
  'login_created',
  'login_deactivated',
  'welcome_email_sent',
  'welcome_email_failed',
  'password_reset_requested',
  'data_quality_issue_detected',
  'data_quality_issue_resolved',
  'data_quality_issue_ignored',
]

export default function AuditLogsPage({ authenticatedUser, onLogout }) {
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    severity: '',
    action: '',
    actor: '',
    target: '',
    source: '',
  })
  const [rows, setRows] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [exporting, setExporting] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    load()
  }, [filters.dateFrom, filters.dateTo, filters.severity, filters.action, filters.actor, filters.target, filters.source])

  const visibleRows = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(row => [
      row.action,
      row.action_label,
      row.employee_code,
      row.employee_name,
      row.changed_by_name,
      row.changed_by_email,
      row.target_label,
      row.source,
      row.ip_address,
    ].join(' ').toLowerCase().includes(q))
  }, [rows, filters.search])

  const summary = useMemo(() => {
    const total = visibleRows.length
    const critical = visibleRows.filter(row => row.severity === 'critical').length
    const warning = visibleRows.filter(row => row.severity === 'warning').length
    const access = visibleRows.filter(row => /login|welcome|password|role/i.test(row.action || '')).length
    return { total, critical, warning, access }
  }, [visibleRows])

  function updateFilter(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  async function load() {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ limit: '300' })
      if (filters.dateFrom) params.set('date_from', filters.dateFrom)
      if (filters.dateTo) params.set('date_to', filters.dateTo)
      if (filters.severity) params.set('severity', filters.severity)
      if (filters.action) params.set('action', filters.action)
      if (filters.actor) params.set('changed_by', filters.actor)
      if (filters.target) params.set('target', filters.target)
      if (filters.source) params.set('source', filters.source)
      const res = await apiFetch(`/api/hr/audit-logs?${params.toString()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Cannot load audit logs.')
      setRows(data.data || [])
    } catch (err) {
      setError(err.message || 'Cannot load audit logs.')
    } finally {
      setLoading(false)
    }
  }

  async function openDetail(row) {
    setSelected(row)
    setDetail(row)
    setDetailLoading(true)
    try {
      const res = await apiFetch(`/api/hr/audit-logs/${row.id}`)
      const data = await res.json()
      if (res.ok) setDetail(data)
    } finally {
      setDetailLoading(false)
    }
  }

  async function exportReport(format) {
    setExporting(format)
    setError('')
    try {
      const res = await apiFetch(`/api/hr/reports/export?report=audit-log&format=${format}`, {
        headers: { Accept: format === 'pdf' ? 'application/pdf' : '*/*' },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Cannot export audit logs.')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `audit-log.${format}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message || 'Cannot export audit logs.')
    } finally {
      setExporting('')
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#ebe7e2_0%,#c9dbe6_100%)] p-4 text-[#101828] md:p-8">
      <main className="mx-auto max-w-[1480px]">
        <header className={`rounded-lg p-5 text-white shadow-[0_18px_55px_rgba(16,24,40,.14)] ${ACE_GRADIENT}`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <a href="/SystemMonitorPage" className="mb-3 inline-flex items-center gap-2 text-xs font-black text-white/85 no-underline hover:text-white">
                <ArrowLeft size={15} /> System Monitor
              </a>
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white/15">
                  <ShieldAlert size={23} />
                </div>
                <div>
                  <h1 className="m-0 text-2xl font-black leading-tight">Audit Logs</h1>
                  <p className="m-0 mt-1 text-sm font-semibold text-white/80">System-wide audit trail, sensitive actions, and before/after review</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-white/15 px-3 py-2 text-xs font-black text-white/85">{authenticatedUser?.role || 'System Access'}</span>
              <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-md border border-white/35 bg-white/15 px-3.5 py-2.5 text-sm font-black text-white disabled:opacity-60">
                <RefreshCw size={16} /> {loading ? 'Loading...' : 'Refresh'}
              </button>
              {onLogout && (
                <button onClick={onLogout} className="rounded-md border border-white/35 bg-white/10 px-3.5 py-2.5 text-sm font-black text-white">
                  Logout
                </button>
              )}
            </div>
          </div>
        </header>

        {error && <div className="mt-4 rounded-lg bg-red-100 p-3.5 font-extrabold text-red-800">{error}</div>}

        <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric label="Visible Events" value={summary.total} />
          <Metric label="Critical" value={summary.critical} tone={summary.critical ? 'bad' : 'good'} />
          <Metric label="Warning" value={summary.warning} tone={summary.warning ? 'warn' : 'good'} />
          <Metric label="Access Actions" value={summary.access} tone={summary.access ? 'warn' : 'neutral'} />
        </section>

        <section className={`${CARD} mt-4 p-4`}>
          <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900">
            <Filter size={17} /> Filters
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <FilterInput icon={<Search size={16} />} label="Search" value={filters.search} onChange={value => updateFilter('search', value)} placeholder="Action, employee, actor, IP" />
            <FilterInput label="Date From" type="date" value={filters.dateFrom} onChange={value => updateFilter('dateFrom', value)} />
            <FilterInput label="Date To" type="date" value={filters.dateTo} onChange={value => updateFilter('dateTo', value)} />
            <FilterSelect label="Severity" value={filters.severity} onChange={value => updateFilter('severity', value)} options={SEVERITY_OPTIONS} />
            <FilterSelect label="Action" value={filters.action} onChange={value => updateFilter('action', value)} options={ACTION_OPTIONS} />
            <FilterInput label="Actor" value={filters.actor} onChange={value => updateFilter('actor', value)} placeholder="Name or email" />
            <FilterInput label="Target" value={filters.target} onChange={value => updateFilter('target', value)} placeholder="Employee, entity, ID" />
            <FilterSelect label="Source" value={filters.source} onChange={value => updateFilter('source', value)} options={SOURCE_OPTIONS} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {['csv', 'xlsx', 'pdf'].map(format => (
              <button
                key={format}
                onClick={() => exportReport(format)}
                disabled={Boolean(exporting)}
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-700 hover:border-blue-200 hover:bg-blue-50 disabled:opacity-60"
              >
                {format === 'pdf' ? <FileDown size={15} /> : <Download size={15} />}
                {exporting === format ? 'Exporting...' : `Export ${format.toUpperCase()}`}
              </button>
            ))}
          </div>
        </section>

        <section className={`${CARD} mt-4 overflow-hidden`}>
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <div className="text-sm font-black text-slate-900">Audit Table</div>
              <div className="mt-1 text-xs font-bold text-slate-500">Showing latest {visibleRows.length} matching events</div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-sm">
              <thead>
                <tr>
                  {['Date/Time', 'Severity', 'Action', 'Employee', 'Changed By', 'Changed Fields', 'Source', 'IP Address', 'Detail'].map(header => (
                    <th key={header} className="border-b border-slate-200 bg-slate-50 px-3 py-3 text-left text-[.68rem] font-black uppercase text-slate-600">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="px-4 py-10 text-center font-black text-slate-500">Loading audit logs...</td></tr>
                ) : visibleRows.length ? visibleRows.map(row => (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="whitespace-nowrap px-3 py-3 font-bold text-slate-700">{row.created_at ? formatDateTime24(row.created_at, true) : '-'}</td>
                    <td className="px-3 py-3"><SeverityBadge value={row.severity} /></td>
                    <td className="px-3 py-3">
                      <div className="font-black text-slate-900">{row.action_label || prettify(row.action)}</div>
                      <div className="mt-1 text-xs font-bold text-slate-500">{row.action || '-'}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-black text-slate-800">{row.employee_name || '-'}</div>
                      <div className="text-xs font-bold text-slate-500">{row.employee_code || row.target_label || '-'}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-bold text-slate-800">{row.changed_by_name || '-'}</div>
                      <div className="text-xs font-bold text-slate-500">{row.changed_by_email || '-'}</div>
                    </td>
                    <td className="px-3 py-3 text-xs font-bold text-slate-600">{listFields(row.changed_fields)}</td>
                    <td className="px-3 py-3"><span className="rounded bg-slate-100 px-2 py-1 text-xs font-black text-slate-600">{row.source || '-'}</span></td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs font-bold text-slate-600">{row.ip_address || '-'}</td>
                    <td className="px-3 py-3">
                      <button onClick={() => openDetail(row)} className="inline-flex items-center gap-1.5 rounded-md bg-[#2447d8] px-3 py-2 text-xs font-black text-white hover:bg-[#1d38ae]">
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={9} className="px-4 py-10 text-center font-black text-slate-500">No audit logs match these filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {selected && (
        <DetailDrawer
          row={detail || selected}
          loading={detailLoading}
          onClose={() => {
            setSelected(null)
            setDetail(null)
          }}
        />
      )}
    </div>
  )
}

function Metric({ label, value, tone = 'neutral' }) {
  const color = tone === 'bad' ? 'text-red-700' : tone === 'warn' ? 'text-amber-700' : tone === 'good' ? 'text-green-700' : 'text-slate-950'
  return (
    <div className={`${CARD} p-4`}>
      <div className="text-[.68rem] font-black uppercase text-slate-500">{label}</div>
      <div className={`mt-2 text-2xl font-black ${color}`}>{value}</div>
    </div>
  )
}

function FilterInput({ label, value, onChange, placeholder = '', type = 'text', icon = null }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-black text-slate-600">{label}</span>
      <span className="relative block">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={event => onChange(event.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-[#2447d8] focus:ring-2 focus:ring-blue-100 ${icon ? 'pl-9' : ''}`}
        />
      </span>
    </label>
  )
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-black text-slate-600">{label}</span>
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-[#2447d8] focus:ring-2 focus:ring-blue-100"
      >
        {options.map(option => <option key={option || 'all'} value={option}>{option ? prettify(option) : 'All'}</option>)}
      </select>
    </label>
  )
}

function SeverityBadge({ value }) {
  const classes = value === 'critical'
    ? 'bg-red-100 text-red-700'
    : value === 'warning'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-blue-100 text-blue-700'
  return <span className={`rounded-full px-2.5 py-1 text-xs font-black ${classes}`}>{value || 'info'}</span>
}

function DetailDrawer({ row, loading, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
      <aside className="flex h-full w-full max-w-[720px] flex-col bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <div className="flex items-center gap-2">
              <SeverityBadge value={row.severity} />
              {loading && <span className="text-xs font-black text-slate-400">Loading detail...</span>}
            </div>
            <h2 className="m-0 mt-3 text-xl font-black text-slate-950">{row.action_label || prettify(row.action)}</h2>
            <p className="m-0 mt-1 text-sm font-bold text-slate-500">{row.created_at ? formatDateTime24(row.created_at, true) : '-'}</p>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50">
            <X size={18} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-auto p-5">
          <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Info label="Employee" value={`${row.employee_code || '-'} ${row.employee_name || ''}`.trim()} />
            <Info label="Changed By" value={`${row.changed_by_name || '-'} ${row.changed_by_email || ''}`.trim()} />
            <Info label="Entity" value={row.target_label || `${row.entity_type || '-'}:${row.entity_id || '-'}`} />
            <Info label="Source / IP" value={`${row.source || '-'} / ${row.ip_address || '-'}`} />
            <Info label="Changed Fields" value={listFields(row.changed_fields)} wide />
            <Info label="User Agent" value={row.user_agent || '-'} wide />
          </section>
          <section className="mt-5">
            <div className="mb-3 text-sm font-black text-slate-900">Before / After Diff</div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <ValueBlock title="Before" value={row.old_value} tone="old" />
              <ValueBlock title="After" value={row.new_value} tone="new" />
            </div>
          </section>
        </div>
      </aside>
    </div>
  )
}

function Info({ label, value, wide = false }) {
  return (
    <div className={`rounded-md border border-slate-100 bg-slate-50 p-3 ${wide ? 'md:col-span-2' : ''}`}>
      <div className="text-[.68rem] font-black uppercase text-slate-500">{label}</div>
      <div className="mt-1 break-words text-sm font-bold text-slate-900">{value || '-'}</div>
    </div>
  )
}

function ValueBlock({ title, value, tone }) {
  const text = stringifyValue(value)
  const border = tone === 'old' ? 'border-red-100 bg-red-50/50' : 'border-green-100 bg-green-50/50'
  return (
    <div className={`rounded-md border ${border}`}>
      <div className="border-b border-inherit px-3 py-2 text-xs font-black uppercase text-slate-600">{title}</div>
      <pre className="m-0 max-h-[360px] overflow-auto whitespace-pre-wrap break-words p-3 text-xs leading-6 text-slate-800">{text}</pre>
    </div>
  )
}

function listFields(value) {
  if (!value) return '-'
  if (Array.isArray(value)) return value.length ? value.join(', ') : '-'
  if (typeof value === 'object') return Object.keys(value).join(', ') || '-'
  return String(value)
}

function stringifyValue(value) {
  if (value == null || value === '') return '-'
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2)
    } catch {
      return value
    }
  }
  return JSON.stringify(value, null, 2)
}

function prettify(value) {
  return String(value || '').replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
}
