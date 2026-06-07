import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from './src/apiFetch.js'
import { navigationForUser } from './src/platformRoutes.js'
import { AddPOPage } from './ProjectPage.jsx'

const statusTone = {
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  INACTIVE: 'bg-slate-100 text-slate-600',
  LOCKED: 'bg-red-50 text-red-700',
}

function PlatformShell({ authenticatedUser, onLogout, title, subtitle, children }) {
  const nav = navigationForUser(authenticatedUser)
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/overview'

  return (
    <div className="min-h-screen bg-[#eef3f8] text-[#101828]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[286px] shrink-0 flex-col bg-[#182230] text-white lg:flex">
          <div className="border-b border-white/10 px-6 py-6">
            <div className="text-lg font-black">ACE Platform</div>
            <div className="mt-1 text-xs font-bold text-slate-400">Integrated Workspace</div>
          </div>
          <nav className="flex-1 overflow-y-auto px-4 py-5">
            {nav.map(section => (
              <div key={section.group} className="mb-5">
                <div className="mb-2 px-2 text-[.68rem] font-black uppercase tracking-widest text-slate-500">{section.group}</div>
                <div className="grid gap-1">
                  {section.items.map(item => {
                    const active = currentPath === item.path || currentPath === item.canonicalPath
                    return (
                      <a
                        key={item.path}
                        href={item.path}
                        className={[
                          'rounded-md px-3 py-2.5 text-sm font-extrabold no-underline transition',
                          active ? 'bg-white text-[#182230]' : 'text-slate-300 hover:bg-white/10 hover:text-white',
                        ].join(' ')}
                      >
                        {item.title}
                      </a>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
          <div className="border-t border-white/10 p-4">
            <div className="rounded-md bg-white/8 p-3">
              <div className="truncate text-sm font-black">{authenticatedUser?.name || 'ACE User'}</div>
              <div className="mt-1 truncate text-xs font-bold text-slate-400">{authenticatedUser?.role || 'EMPLOYEE'}</div>
              {onLogout && (
                <button type="button" onClick={onLogout} className="mt-3 w-full rounded border border-white/20 bg-white/10 px-3 py-2 text-xs font-black text-white">
                  Logout
                </button>
              )}
            </div>
          </div>
        </aside>
        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
            <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4">
              <div>
                <div className="text-xl font-black text-slate-950">{title}</div>
                <div className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</div>
              </div>
              <a href="/overview" className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 no-underline lg:hidden">Menu</a>
            </div>
          </header>
          <div className="mx-auto max-w-[1480px] p-5">{children}</div>
        </main>
      </div>
    </div>
  )
}

function PlaceholderPage({ authenticatedUser, onLogout, title, subtitle, cards = [] }) {
  return (
    <PlatformShell authenticatedUser={authenticatedUser} onLogout={onLogout} title={title} subtitle={subtitle}>
      <div className="grid gap-4 md:grid-cols-3">
        {(cards.length ? cards : [
          ['Scope', 'This workspace is reserved for this module workflow.'],
          ['Data Owner', 'The page will consume existing ACE APIs and will not duplicate master ownership.'],
          ['Next Step', 'Add production actions after route and access boundaries are stable.'],
        ]).map(([label, value]) => (
          <section key={label} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</div>
            <div className="mt-2 text-sm font-bold leading-6 text-slate-700">{value}</div>
          </section>
        ))}
      </div>
    </PlatformShell>
  )
}

export function FinancePOPage({ authenticatedUser, onLogout }) {
  const [projects, setProjects] = useState([])

  useEffect(() => {
    apiFetch('/api/projects')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setProjects(d.data || []))
      .catch(() => {})
  }, [])

  return (
    <AddPOPage
      projects={projects}
      authenticatedUser={authenticatedUser}
      onLogout={onLogout}
    />
  )
}

export function MyProfilePage({ authenticatedUser, onLogout }) {
  const rows = [
    ['Name', authenticatedUser?.name],
    ['Employee Code', authenticatedUser?.employeeCode || authenticatedUser?.employee_code],
    ['Email', authenticatedUser?.email],
    ['Role', authenticatedUser?.role],
    ['Position', authenticatedUser?.positionName || authenticatedUser?.position_name],
  ]
  return (
    <PlatformShell authenticatedUser={authenticatedUser} onLogout={onLogout} title="My Profile" subtitle="Account, role, and access summary">
      <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="rounded-md bg-slate-50 p-4">
              <div className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</div>
              <div className="mt-1 text-sm font-black text-slate-800">{value || '-'}</div>
            </div>
          ))}
        </div>
      </section>
    </PlatformShell>
  )
}

const CLOCK_ROLES = [
  { key: 'DTE',       label: 'DTE · Per-Site',     desc: 'Drive Test Engineer (field, multi-site/day)' },
  { key: 'DTE_DAILY', label: 'DTE · Daily',         desc: 'DTE in office mode (single session/day)' },
  { key: 'TE',        label: 'TE',                  desc: 'Telecom Engineer' },
  { key: 'DTA',       label: 'DTA',                 desc: 'Drive Test Analyst (office)' },
  { key: 'OTHER',     label: 'Office Staff',        desc: 'All other roles' },
]
const CLOCK_TOGGLES = [
  { key: 'enabled',       label: 'Enabled',     hint: 'Allow this role to clock in/out' },
  { key: 'gpsRequired',   label: 'GPS',         hint: 'Require GPS location' },
  { key: 'photoRequired', label: 'Photo',       hint: 'Require selfie photo' },
  { key: 'enforceRadius', label: 'Radius',      hint: 'Block clock if out of site/work radius' },
]

function ClockSettingsCard() {
  const [config, setConfig] = useState(null)
  const [original, setOriginal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedAt, setSavedAt] = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)

  async function load() {
    setLoading(true); setError('')
    try {
      const res = await apiFetch('/api/admin/clock-settings')
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail || 'Cannot load clock settings')
      setConfig(json.config); setOriginal(json.config); setUpdatedAt(json.updated_at)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function toggle(role, field) {
    setConfig(prev => ({ ...prev, [role]: { ...prev[role], [field]: !prev[role][field] } }))
  }

  async function save() {
    setSaving(true); setError('')
    try {
      const res = await apiFetch('/api/admin/clock-settings', {
        method: 'PUT',
        body: JSON.stringify({ config }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail || 'Save failed')
      setConfig(json.config); setOriginal(json.config); setSavedAt(new Date())
    } catch (e) { setError(e.message) }
    setSaving(false)
  }

  function reset() { setConfig(original) }
  const dirty = JSON.stringify(config) !== JSON.stringify(original)

  return (
    <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <div className="text-sm font-black text-slate-900">⏰ Clock Rules</div>
          <div className="text-xs font-semibold text-slate-500">
            Per-role toggles for GPS, Photo, Radius enforcement, and enable/disable
            {updatedAt && <span className="ml-2 text-slate-400">· last updated {new Date(updatedAt).toLocaleString('en-GB')}</span>}
            {savedAt && <span className="ml-2 text-emerald-600">· ✓ saved {savedAt.toLocaleTimeString('en-GB')}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          {dirty && <button type="button" onClick={reset} className="rounded border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600">Reset</button>}
          <button type="button" onClick={save} disabled={!dirty || saving}
            className={`rounded px-3 py-2 text-xs font-black text-white ${dirty && !saving ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'}`}>
            {saving ? 'Saving…' : dirty ? 'Save Changes' : 'Saved'}
          </button>
        </div>
      </div>
      {error && <div className="border-b border-red-200 bg-red-50 px-5 py-2 text-xs font-bold text-red-700">{error}</div>}
      {loading || !config ? (
        <div className="p-6 text-sm text-slate-500">Loading…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-3">Role</th>
                {CLOCK_TOGGLES.map(t => (
                  <th key={t.key} className="p-3 text-center" title={t.hint}>{t.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CLOCK_ROLES.map(role => {
                const rc = config[role.key] || {}
                return (
                  <tr key={role.key} className="border-t border-slate-100">
                    <td className="p-3">
                      <div className="font-black text-slate-800">{role.label}</div>
                      <div className="text-xs font-semibold text-slate-400">{role.desc}</div>
                    </td>
                    {CLOCK_TOGGLES.map(t => (
                      <td key={t.key} className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggle(role.key, t.key)}
                          title={t.hint}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${rc[t.key] ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        >
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${rc[t.key] ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export function AdminUsersPage({ authenticatedUser, onLogout }) {
  const [rows, setRows] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [usersRes, rolesRes] = await Promise.all([
        apiFetch('/api/admin/users'),
        apiFetch('/api/admin/roles'),
      ])
      const usersJson = await usersRes.json().catch(() => ({}))
      const rolesJson = await rolesRes.json().catch(() => ({}))
      if (!usersRes.ok) throw new Error(usersJson.detail || 'Cannot load users')
      if (!rolesRes.ok) throw new Error(rolesJson.detail || 'Cannot load roles')
      setRows(usersJson.data || [])
      setRoles(rolesJson.data || [])
    } catch (err) {
      setError(err?.message || 'Cannot load users')
    } finally {
      setLoading(false)
    }
  }

  async function updateRole(userId, role) {
    const res = await apiFetch(`/api/admin/users/${userId}/roles`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    })
    if (res.ok) load()
  }

  useEffect(() => { load() }, [])

  return (
    <PlatformShell authenticatedUser={authenticatedUser} onLogout={onLogout} title="User Management" subtitle="Login accounts, active status, token version, role assignment, and clock rules">
      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
      <div className="mb-5">
        <ClockSettingsCard />
      </div>
      <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="text-sm font-black text-slate-900">Auth Users</div>
          <button type="button" onClick={load} className="rounded border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600">Refresh</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="p-3">Employee</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3">Token</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="p-4 text-slate-500" colSpan="5">Loading...</td></tr>
              ) : rows.map(row => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="p-3 font-black text-slate-800">{row.name || row.employee_code}<div className="text-xs font-bold text-slate-400">{row.employee_code}</div></td>
                  <td className="p-3 font-semibold text-slate-600">{row.email || '-'}</td>
                  <td className="p-3">
                    <select value={row.role || 'EMPLOYEE'} onChange={event => updateRole(row.id, event.target.value)} className="rounded border border-slate-200 px-2 py-1 text-xs font-bold">
                      {roles.map(role => <option key={role.role} value={role.role}>{role.label}</option>)}
                    </select>
                  </td>
                  <td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-black ${row.is_active ? statusTone.ACTIVE : statusTone.INACTIVE}`}>{row.is_active ? 'ACTIVE' : 'INACTIVE'}</span></td>
                  <td className="p-3 font-mono text-xs text-slate-500">v{row.token_version || 1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PlatformShell>
  )
}

export function AdminRolesPage({ authenticatedUser, onLogout }) {
  const [roles, setRoles] = useState([])
  const [error, setError] = useState('')
  useEffect(() => {
    apiFetch('/api/admin/roles')
      .then(res => res.json().then(json => {
        if (!res.ok) throw new Error(json.detail || 'Cannot load roles')
        setRoles(json.data || [])
      }))
      .catch(err => setError(err?.message || 'Cannot load roles'))
  }, [])

  return (
    <PlatformShell authenticatedUser={authenticatedUser} onLogout={onLogout} title="Role Management" subtitle="Current role-to-scope matrix from backend authorization">
      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
      <div className="grid gap-4 lg:grid-cols-2">
        {roles.map(role => (
          <section key={role.role} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-base font-black text-slate-900">{role.label}</div>
                <div className="text-xs font-bold text-slate-400">{role.role}</div>
              </div>
              <div className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">{role.scopes?.length || 0} scopes</div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(role.scopes || []).map(scope => <span key={scope} className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{scope}</span>)}
            </div>
          </section>
        ))}
      </div>
    </PlatformShell>
  )
}

export function HRAnalyticsPage(props) {
  return <PlaceholderPage {...props} title="HR Analytics" subtitle="Workforce, data quality, readiness, and HR trend analytics" cards={[
    ['Owner', 'HR owns employee analytics and workforce readiness.'],
    ['Source APIs', '/api/hr/analytics/summary, /api/hr/data-quality, /api/hr/project-readiness'],
    ['Boundary', 'Does not edit employee records; edits remain in HR Employees.'],
  ]} />
}

export function WorkflowCenterPage({ authenticatedUser, onLogout }) {
  const [rows, setRows] = useState([])
  const [statusFilter, setStatusFilter] = useState('PENDING_APPROVAL')
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  async function load() {
    setError('')
    try {
      const res = await apiFetch('/api/project-pos')
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.detail || 'Cannot load approval queue')
      setRows(json.data || [])
    } catch (err) {
      setError(err?.message || 'Cannot load approval queue')
    }
  }

  async function action(row, workflowAction, note = '') {
    setBusyId(row.id)
    setError('')
    try {
      const res = await apiFetch(`/api/project-pos/${row.id}/workflow`, {
        method: 'POST',
        body: JSON.stringify({ action: workflowAction, note }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.detail || 'Workflow update failed')
      setRows(current => current.map(item => item.id === row.id ? json : item))
    } catch (err) {
      setError(err?.message || 'Workflow update failed')
    } finally {
      setBusyId(null)
    }
  }

  useEffect(() => { load() }, [])

  const statusOptions = [
    ['PENDING_APPROVAL', 'Pending Approval'],
    ['APPROVED', 'Approved'],
    ['REJECTED', 'Rejected'],
    ['RETURNED_TO_FINANCE', 'Returned Finance'],
    ['RETURNED_TO_PROJECT', 'Returned Project'],
    ['', 'All PO Workflow'],
  ]
  const visibleRows = rows.filter(row => !statusFilter || row.workflow_status === statusFilter)
  const pending = rows.filter(row => row.workflow_status === 'PENDING_APPROVAL').length
  const approved = rows.filter(row => row.workflow_status === 'APPROVED').length
  const returned = rows.filter(row => ['RETURNED_TO_FINANCE', 'RETURNED_TO_PROJECT', 'REJECTED'].includes(row.workflow_status)).length
  const aging = rows.filter(row => row.workflow_status === 'PENDING_APPROVAL' && Number(row.aging_days || 0) >= 3).length
  const tone = status => {
    if (status === 'APPROVED') return 'bg-emerald-50 text-emerald-700'
    if (status === 'PENDING_APPROVAL') return 'bg-violet-50 text-violet-700'
    if (status === 'REJECTED') return 'bg-red-50 text-red-700'
    if (String(status || '').startsWith('RETURNED')) return 'bg-amber-50 text-amber-700'
    return 'bg-slate-100 text-slate-600'
  }

  return (
    <PlatformShell authenticatedUser={authenticatedUser} onLogout={onLogout} title="Workflow / Approval Center" subtitle="PO approval queue with audit-ready scope packet">
      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}

      <div className="mb-4 grid gap-3 md:grid-cols-4">
        {[
          ['Pending Approval', pending, 'Awaiting approver action'],
          ['Approved', approved, 'Locked PO scope'],
          ['Returned / Rejected', returned, 'Needs rework'],
          ['Aging >= 3d', aging, 'Approval SLA watch'],
        ].map(([label, value, note]) => (
          <section key={label} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</div>
            <div className="mt-2 text-2xl font-black text-slate-950">{value}</div>
            <div className="mt-1 text-xs font-bold text-slate-500">{note}</div>
          </section>
        ))}
      </div>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-5 py-4">
          <div className="mr-auto">
            <div className="text-sm font-black text-slate-900">PO Approval Packet</div>
            <div className="mt-1 text-xs font-bold text-slate-500">{visibleRows.length} item(s) in this view</div>
          </div>
          <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="rounded border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">
            {statusOptions.map(([value, label]) => <option key={label} value={value}>{label}</option>)}
          </select>
          <button type="button" onClick={load} className="rounded border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600">Refresh</button>
        </div>

        <div className="grid gap-3 p-4">
          {visibleRows.length === 0 && (
            <div className="rounded-md border border-dashed border-slate-200 p-8 text-center text-sm font-bold text-slate-400">No approval items in this queue.</div>
          )}
          {visibleRows.map(row => {
            const busy = busyId === row.id
            const canApprove = row.workflow_status === 'PENDING_APPROVAL'
            return (
              <article key={row.id} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black text-blue-700">{row.po_number}</span>
                      <span className="text-xs font-black text-slate-400">Line {row.po_line || '-'}</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-black ${tone(row.workflow_status)}`}>{row.workflow_status || 'NEW'}</span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">v{row.revision || 1}{row.locked ? ' locked' : ''}</span>
                    </div>
                    <div className="mt-2 text-sm font-black text-slate-900">{row.item_dis || 'PO scope item'}</div>
                    <div className="mt-1 text-xs font-bold text-slate-500">{row.cluster_site || row.du_id || '-'}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button disabled={busy || !canApprove} onClick={() => action(row, 'APPROVE')} className="rounded bg-emerald-600 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300">Approve</button>
                    <button disabled={busy || !canApprove} onClick={() => action(row, 'RETURN_PROJECT', 'Approver requests Project rework')} className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-700 disabled:cursor-not-allowed disabled:opacity-50">Return Project</button>
                    <button disabled={busy || !canApprove} onClick={() => action(row, 'RETURN_FINANCE', 'Approver requests Finance recheck')} className="rounded border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Return Finance</button>
                    <button disabled={busy || !canApprove} onClick={() => action(row, 'REJECT', 'Rejected by approver')} className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700 disabled:cursor-not-allowed disabled:opacity-50">Reject</button>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 text-xs md:grid-cols-4">
                  {[
                    ['Project', row.project_code || '-'],
                    ['Mapping', `${row.mapping_confidence || 0}% · ${row.mapping_rule || '-'}`],
                    ['Owner', `${row.current_owner_role || '-'}${row.current_owner_user ? ` · ${row.current_owner_user}` : ''}`],
                    ['Aging', `${row.aging_days || 0} day(s)`],
                    ['DU-ID', row.du_id || '-'],
                    ['Owner Name', row.owner || '-'],
                    ['On-air', row.on_air || '-'],
                    ['Hold / Return', row.hold_reason || '-'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded bg-slate-50 p-3">
                      <div className="font-black uppercase tracking-wide text-slate-400">{label}</div>
                      <div className="mt-1 break-words font-bold text-slate-700">{value}</div>
                    </div>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </PlatformShell>
  )
}

export function NotificationCenterPage(props) {
  return <PlaceholderPage {...props} title="Notification Center" subtitle="System, email, task, and operational notifications" />
}

export function ReportCenterPage(props) {
  return <PlaceholderPage {...props} title="Report Center" subtitle="Central exports and scheduled reports across HR, clock, project, finance, and audit" />
}

export function MasterDataPage(props) {
  return <PlaceholderPage {...props} title="Master Data" subtitle="Customers, departments, positions, project types, expense categories, and shared dictionaries" />
}

export function AdminSettingsPage(props) {
  return <PlaceholderPage {...props} title="Admin Settings" subtitle="Platform-wide settings and controlled configuration" />
}

export function IntegrationMonitorPage(props) {
  return <PlaceholderPage {...props} title="Integration / API Monitor" subtitle="SMTP, external APIs, import jobs, maps, and connector health" />
}

export function DocumentCenterPage(props) {
  return <PlaceholderPage {...props} title="Document Center" subtitle="HR, project, PO, finance, and contract document index" />
}

export function HelpPage(props) {
  return <PlaceholderPage {...props} title="Help / SOP" subtitle="Operating procedures, onboarding guides, and support references" />
}
