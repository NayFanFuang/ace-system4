import { useEffect, useState, Fragment } from 'react'

const STEP_LABELS = { pm: 'PM (Project Manager)', pd: 'PD (Project Director)', hr: 'HR Acknowledgement' }

const STATUS_STYLE = {
  PENDING_PM: { bg: '#fff8e1', color: '#b45309', label: 'Awaiting PM' },
  PENDING_DC: { bg: '#fff3e0', color: '#c2410c', label: 'Awaiting PD' },
  PENDING_HR: { bg: '#e8f0fe', color: '#1d4ed8', label: 'Awaiting HR' },
  APPROVED:   { bg: '#e8f5e9', color: '#16a34a', label: 'Approved' },
  REJECTED:   { bg: '#fdecea', color: '#dc2626', label: 'Rejected' },
  CANCELLED:  { bg: '#f3f4f6', color: '#6b7280', label: 'Cancelled' },
}

const FLOW_STATE_STYLE = {
  done:     { bg: '#dcfce7', color: '#166534', border: '#86efac', label: 'Done' },
  current:  { bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd', label: 'Now' },
  rejected: { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5', label: 'Rejected' },
  todo:     { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0', label: 'Pending' },
}

function leaveCategory(t = '') {
  if (['Sick Leave', 'Sick', 'Medical Leave'].includes(t)) return 'Sick'
  if (['Personal Leave', 'Personal'].includes(t)) return 'Personal'
  if (['Annual Leave', 'Vacation Leave', 'Vacation'].includes(t)) return 'Annual'
  return 'Other'
}

function flowSteps(leaveType) {
  const cat = leaveCategory(leaveType)
  if (cat === 'Sick')     return [['SUBMIT','Submit'],['HR','HR Ack.'],['APPROVED','Approved']]
  if (cat === 'Personal') return [['SUBMIT','Submit'],['PM','PM'],['APPROVED','Approved'],['ACK','HR + Boss']]
  return [['SUBMIT','Submit'],['PM','PM'],['PD','PD / Head'],['APPROVED','Approved'],['ACK','HR + Boss']]
}

function flowState(leave) {
  const steps = flowSteps(leave.leaveType)
  const rejectKey = (leave.rejectAtStep || '').replace('DC', 'PD')
  return steps.map(([k, label]) => {
    let state = 'todo'
    if (leave.status === 'REJECTED') {
      const ri = steps.findIndex(([sk]) => sk === rejectKey)
      const si = steps.findIndex(([sk]) => sk === k)
      if (k === rejectKey) state = 'rejected'
      else if (ri >= 0 && si < ri) state = 'done'
    } else if (k === 'SUBMIT') state = 'done'
    else if (k === 'ACK' && ['PENDING_PM','PENDING_DC','APPROVED'].includes(leave.status)) state = 'done'
    else if (leave.status === 'APPROVED') state = 'done'
    else if (leave.status === 'PENDING_HR') state = k === 'HR' ? 'current' : 'todo'
    else if (leave.status === 'PENDING_PM' || leave.status === 'PENDING') state = k === 'PM' ? 'current' : 'todo'
    else if (leave.status === 'PENDING_DC') {
      if (k === 'PM') state = 'done'
      else if (k === 'PD') state = 'current'
    }
    return { key: k, label, state }
  })
}

function FlowDiagram({ leave }) {
  const steps = flowState(leave)
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
      {steps.map((s, i) => {
        const st = FLOW_STATE_STYLE[s.state]
        return (
          <Fragment key={`${s.key}-${i}`}>
            <div style={{ minWidth: 96, background: st.bg, borderColor: st.border, color: st.color, border: '1px solid', borderRadius: 12, padding: '8px 10px', textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', lineHeight: 1 }}>{st.label}</div>
              <div style={{ fontSize: 12, fontWeight: 800, marginTop: 4, lineHeight: 1.25 }}>{s.label}</div>
            </div>
            {i < steps.length - 1 && <div style={{ display: 'flex', alignItems: 'center', color: '#cbd5e1', fontWeight: 800, flexShrink: 0 }}>→</div>}
          </Fragment>
        )
      })}
    </div>
  )
}

export default function LeaveApprovalPage() {
  const token = window.location.pathname.replace(/^\/leave-approval\//, '').replace(/\/$/, '')

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [rejectMode, setRejectMode] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => { reload() /* eslint-disable-line react-hooks/exhaustive-deps */ }, [])

  async function reload() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/leave/by-token/${encodeURIComponent(token)}`)
      const j = await res.json()
      if (!res.ok) { setError(j.detail || 'Cannot load this approval link.'); return }
      setData(j)
    } catch {
      setError('Cannot connect to the server.')
    } finally { setLoading(false) }
  }

  async function act(action) {
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/leave/by-token/${encodeURIComponent(token)}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reject_reason: action === 'reject' ? rejectReason.trim() : null }),
      })
      const j = await res.json()
      if (!res.ok) { setError(j.detail || `Cannot ${action} this leave.`); return }
      setResult({ ...j, action })
      setData(prev => prev ? { ...prev, leave: j.leave, can_act: false, current_status: j.leave.status } : prev)
    } catch {
      setError('Cannot connect to the server.')
    } finally { setBusy(false) }
  }

  if (loading) return <Shell><div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Loading…</div></Shell>
  if (error && !data) return <Shell><Banner type="error">{error}</Banner></Shell>
  if (!data) return null

  const { leave, token: tinfo, can_act, current_status, stats } = data
  const stepLabel = STEP_LABELS[tinfo.step] || tinfo.step
  const stStyle = STATUS_STYLE[current_status] || STATUS_STYLE.PENDING_PM

  return (
    <Shell>
      <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 8px 24px rgba(15,23,42,0.08)', padding: 28, maxWidth: 680, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>ACE Leave Approval</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>{leave.leaveType}</div>
          </div>
          <span style={{ background: stStyle.bg, color: stStyle.color, padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 800 }}>
            {stStyle.label}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', rowGap: 8, columnGap: 16, fontSize: 14, marginBottom: 16 }}>
          <Cell label="Employee">{leave.employeeName} <span style={{ color: '#94a3b8' }}>({leave.employeeCode})</span></Cell>
          <Cell label="Type">{leave.leaveType} · {leave.sessionType}</Cell>
          <Cell label="Period">{leave.startDate}{leave.endDate !== leave.startDate ? ` → ${leave.endDate}` : ''} <span style={{ color: '#94a3b8' }}>({leave.days} day{leave.days !== 1 ? 's' : ''})</span></Cell>
          <Cell label="Reason">{leave.reason || '—'}</Cell>
          {leave.pmApprovedBy && <Cell label="PM by">{leave.pmApprovedBy}</Cell>}
          {leave.dcApprovedBy && <Cell label="PD by">{leave.dcApprovedBy}</Cell>}
          {leave.hrAcknowledgedBy && <Cell label="HR ack by">{leave.hrAcknowledgedBy}</Cell>}
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 8 }}>Process Flow</div>
          <FlowDiagram leave={leave} />
        </div>

        {stats && (
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: 12, fontSize: 13, marginBottom: 18 }}>
            <div style={{ fontWeight: 800, color: '#334155', marginBottom: 6 }}>Leave Statistics — {stats.category} {stats.year}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4, color: '#475569' }}>
              <span>Entitlement: <b>{stats.entitlement_text}</b></span>
              <span>Approved used: <b>{stats.approved_used.toFixed(1)}d</b></span>
              <span>Pending: <b>{stats.pending_days.toFixed(1)}d</b></span>
              <span>Remaining: <b>{stats.remaining_after_request_text}</b></span>
            </div>
          </div>
        )}

        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: 14, marginBottom: 18, fontSize: 13 }}>
          <div style={{ fontWeight: 800, color: '#1e3a8a' }}>You are acting as: {tinfo.approver_code}</div>
          <div style={{ color: '#475569', marginTop: 4 }}>Step: <b>{stepLabel}</b> · Link expires: {new Date(tinfo.expires_at).toLocaleString()}</div>
        </div>

        {error && <Banner type="error">{error}</Banner>}

        {result && (
          <Banner type={result.action === 'approve' ? 'success' : 'warn'}>
            {result.action === 'approve'
              ? `✓ Approved — leave is now ${result.leave.status.replace('_', ' ')}.`
              : `✗ Rejected at ${result.leave.rejectAtStep}.`}
          </Banner>
        )}

        {can_act && !result && (
          <>
            {!rejectMode ? (
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setRejectMode(true)} disabled={busy}
                  style={{ background: '#fff', color: '#dc2626', border: '1.5px solid #fca5a5', borderRadius: 10, padding: '10px 20px', fontWeight: 800, cursor: 'pointer' }}>
                  ✗ Reject
                </button>
                <button onClick={() => act('approve')} disabled={busy}
                  style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(22,163,74,0.3)' }}>
                  {busy ? 'Working…' : '✓ Approve'}
                </button>
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#dc2626', marginBottom: 6 }}>
                  Reason for rejection (required)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Explain why this request is rejected…"
                  rows={3}
                  style={{ width: '100%', padding: 10, border: '1.5px solid #fca5a5', borderRadius: 10, fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }}
                />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                  <button onClick={() => { setRejectMode(false); setRejectReason('') }} disabled={busy}
                    style={{ background: '#fff', color: '#475569', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 20px', fontWeight: 800, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={() => act('reject')} disabled={busy || !rejectReason.trim()}
                    style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 800, cursor: busy || !rejectReason.trim() ? 'not-allowed' : 'pointer', opacity: busy || !rejectReason.trim() ? 0.5 : 1 }}>
                    {busy ? 'Working…' : '✗ Confirm Reject'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {!can_act && !result && (
          <Banner type="info">
            This link is no longer actionable. Current status is <b>{current_status.replace('_', ' ')}</b>.
            The leave has likely moved past this approval step.
          </Banner>
        )}
      </div>
    </Shell>
  )
}

function Shell({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#f1f5f9 0%,#e0e7ff 100%)', padding: '40px 16px', fontFamily: 'system-ui, sans-serif' }}>
      {children}
    </div>
  )
}

function Cell({ label, children }) {
  return (
    <>
      <div style={{ color: '#94a3b8', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', alignSelf: 'center' }}>{label}</div>
      <div style={{ color: '#0f172a' }}>{children}</div>
    </>
  )
}

function Banner({ type = 'info', children }) {
  const styles = {
    info:    { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
    success: { bg: '#dcfce7', color: '#166534', border: '#86efac' },
    warn:    { bg: '#fef9c3', color: '#854d0e', border: '#fde68a' },
    error:   { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' },
  }[type]
  return (
    <div style={{ background: styles.bg, color: styles.color, border: `1px solid ${styles.border}`, borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
      {children}
    </div>
  )
}
