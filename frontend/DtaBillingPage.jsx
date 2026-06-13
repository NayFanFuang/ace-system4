import React, { useEffect, useState } from 'react'
import { Wallet, Command, RefreshCw, LogOut } from 'lucide-react'
import { apiFetch } from './src/apiFetch.js'
import { Card, StatCard, Badge, Button, EmptyState } from './src/ui/index.jsx'

const BRAND = '#2447d8'
const GREEN = '#16a34a'
const SLATE = '#64748b'

function fmtTHB(n) {
  return '฿' + (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function AcCell({ pct, amount, billed, invoice }) {
  if (!pct) return <span className="text-slate-300">—</span>
  return (
    <div>
      <div className="font-black text-slate-800">{fmtTHB(amount)}</div>
      <div className="text-[10px] font-bold text-slate-400">{pct}%</div>
      {billed
        ? <Badge tone="blue">Billed {invoice || ''}</Badge>
        : <Badge tone="amber">Not billed</Badge>}
    </div>
  )
}

function BillingView() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [workType, setWorkType] = useState('PAC')   // PAC | SSV | ALL
  const [readyOnly, setReadyOnly] = useState(false)
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    let alive = true
    setLoading(true)
    apiFetch(`/api/presite/dta/billing?work_type=${workType}&ready_only=${readyOnly}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => { if (alive) { setData(d); setLoading(false) } })
      .catch(() => { if (alive) { setData({ groups: [], summary: {} }); setLoading(false) } })
    return () => { alive = false }
  }, [workType, readyOnly])

  const groups = data?.groups || []

  function exportCsv() {
    if (!groups.length) return
    const rows = []
    groups.forEach(g => g.lines.forEach(l => rows.push([
      g.kind, g.key, g.owner || '', g.done_date || '', g.ready ? 'READY' : 'NOT READY',
      l.billing_ref, l.site, l.cluster_site || '', l.du_id, l.item_dis || '', l.po_number, l.po_line, l.amount.toFixed(2),
      l.ac1_pct, l.ac1_amount.toFixed(2), l.ac1_billed ? 'BILLED' : 'NOT BILLED', l.ac1_invoice_no || '',
      l.ac2_pct, l.ac2_amount.toFixed(2), l.ac2_billed ? 'BILLED' : 'NOT BILLED', l.ac2_invoice_no || '',
    ])))
    const head = ['Type', 'Group', 'Owner', 'Done Date', 'Ready', 'Billing Ref (hw_id)', 'Site', 'DU ID (Name)', 'DU ID (Site ID)', 'Item Dis', 'PO Number', 'PO Line',
      'Amount', 'AC1 %', 'AC1 Amount', 'AC1 Status', 'AC1 Invoice', 'AC2 %', 'AC2 Amount', 'AC2 Status', 'AC2 Invoice']
    const csv = [head, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `DTA_Billing_${workType}_${readyOnly ? 'ready' : 'all'}.csv`
    a.click()
  }

  const s = data?.summary || {}
  const hasAnyAc2 = groups.some(g => g.lines.some(l => l.has_ac2))

  return (
    <div className="grid gap-4">
      {/* summary cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Groups" value={s.group_count ?? 0} accent={BRAND} />
        <StatCard label="Lines (hw_id)" value={s.line_count ?? 0} accent={SLATE} />
        <StatCard label="AC1 Total" value={fmtTHB(s.ac1_total)} accent={BRAND} />
        <StatCard label="AC2 Total" value={fmtTHB(s.ac2_total)} accent={'#7c3aed'} />
        <StatCard label="Grand Total" value={fmtTHB(s.grand_total)} accent={GREEN} />
      </div>

      {/* toolbar */}
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <div className="flex gap-1">
          {['PAC', 'SSV', 'ALL'].map(wt => (
            <button key={wt} type="button" onClick={() => setWorkType(wt)}
              className={'rounded-xl px-3 py-1.5 text-xs font-black ' + (workType === wt ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')}>
              {wt}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
          <input type="checkbox" className="ds-check" checked={readyOnly} onChange={e => setReadyOnly(e.target.checked)} />
          Ready to collect only
        </label>
        <div className="ml-auto">
          <Button variant="primary" icon={Wallet} onClick={exportCsv} disabled={!groups.length}>Export CSV</Button>
        </div>
      </Card>

      {loading ? (
        <div className="py-12 text-center text-sm font-bold text-slate-400">Loading billing data…</div>
      ) : !groups.length ? (
        <EmptyState icon={Wallet} title="No billable items" desc={`No ${workType} PO matched yet`} />
      ) : (
        <div className="grid gap-3">
          {groups.map(g => {
            const open = expanded[g.key]
            const readyLabel = g.kind === 'PAC'
              ? (g.ready ? `PAC Approved ${g.done_date || ''}` : `Not ready (phase ${g.phase})`)
              : (g.ready ? `ACE Approved ${g.done_date || ''}` : 'Not ready')
            return (
              <Card key={`${g.kind}-${g.key}`} className="overflow-hidden">
                <button type="button" onClick={() => setExpanded(e => ({ ...e, [g.key]: !e[g.key] }))}
                  className="flex w-full flex-wrap items-center gap-3 px-5 py-4 text-left hover:bg-slate-50">
                  <Badge tone={g.kind === 'PAC' ? 'blue' : 'purple'}>{g.kind}</Badge>
                  <span className="text-base font-black text-slate-900">{g.key}</span>
                  {g.ready ? <Badge tone="green">{readyLabel}</Badge> : <Badge tone="amber">{readyLabel}</Badge>}
                  <span className="text-xs font-bold text-slate-400">{g.owner || '—'} · PO {g.po_number}</span>
                  <div className="ml-auto flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-500">{g.lines.length} lines</span>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-400">AC1 {fmtTHB(g.ac1_total)}{g.ac2_total > 0 && ` · AC2 ${fmtTHB(g.ac2_total)}`}</div>
                      <div className="text-lg font-black" style={{ color: g.ready ? GREEN : SLATE }}>{fmtTHB(g.total_amount)}</div>
                    </div>
                    <span className="text-[10px] font-black text-slate-400">{open ? '▲' : '▼'}</span>
                  </div>
                </button>

                {open && (
                  <div className="overflow-x-auto border-t border-slate-200">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-4 py-2 text-left">Billing Ref (hw_id)</th>
                          <th className="px-4 py-2 text-left">Site</th>
                          <th className="px-4 py-2 text-left">DU ID</th>
                          <th className="px-4 py-2 text-left">Item Dis</th>
                          <th className="px-4 py-2 text-left">PO Line</th>
                          <th className="px-4 py-2 text-right">Amount</th>
                          <th className="px-4 py-2 text-left">AC1</th>
                          <th className="px-4 py-2 text-left">AC2</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {g.lines.map(l => (
                          <tr key={l.billing_ref} className="hover:bg-slate-50">
                            <td className="px-4 py-2 font-mono font-bold text-slate-700">{l.billing_ref}</td>
                            <td className="px-4 py-2 font-bold text-[#2447d8]">{l.site}</td>
                            <td className="px-4 py-2 max-w-[260px]">
                              <div className="font-bold text-slate-700 truncate" title={l.cluster_site}>{l.cluster_site || l.site}</div>
                              <div className="font-mono text-[10px] text-slate-400">{l.du_id}</div>
                            </td>
                            <td className="px-4 py-2 text-slate-600 max-w-[280px]"><span title={l.item_dis}>{l.item_dis || '—'}</span></td>
                            <td className="px-4 py-2 font-mono text-slate-500">{l.po_line}</td>
                            <td className="px-4 py-2 text-right font-black text-slate-800">{fmtTHB(l.amount)}</td>
                            <td className="px-4 py-2"><AcCell pct={l.ac1_pct} amount={l.ac1_amount} billed={l.ac1_billed} invoice={l.ac1_invoice_no} /></td>
                            <td className="px-4 py-2"><AcCell pct={l.ac2_pct} amount={l.ac2_amount} billed={l.ac2_billed} invoice={l.ac2_invoice_no} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <Card className="border-dashed bg-blue-50/40 p-4 text-xs font-bold text-blue-900">
        💡 1 hw_id = 1 line, split into installments: <b>AC1</b> (70% or 100%) + <b>AC2</b> (30%, when applicable).
        PAC bills at "PAC Approved"; SSV bills at "ACE Approved". {hasAnyAc2 ? 'Some lines have a 2-installment (70/30) term.' : 'All current lines are single-installment (100%).'}
      </Card>
    </div>
  )
}

/* ============================================================
   PAGE SHELL — DTA Billing (Finance)
   ============================================================ */
export default function DtaBillingPage({ authenticatedUser, onLogout }) {
  const initials = (authenticatedUser?.full_name || authenticatedUser?.employee_code || 'U').slice(0, 2).toUpperCase()
  return (
    <div className="flex min-h-screen bg-[#f5f7fb] text-slate-950">
      <aside className="hidden lg:sticky lg:top-0 lg:flex h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #2447d8, #16a34a)' }}>
            <Wallet size={24} />
          </div>
          <div className="min-w-0">
            <div className="text-base font-black text-slate-950">DTA Billing</div>
            <div className="text-xs font-bold text-slate-400">Finance · Collection</div>
          </div>
        </div>
        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-semibold leading-5 text-slate-500">
          PAC-approved clusters ready to invoice. 1 hw_id = 1 collectible line. Export CSV to send Accounting.
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 px-5 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">Finance · Collection</div>
              <div className="truncate text-sm font-black text-slate-900">DTA Billing — PAC ready to collect</div>
            </div>
            <Button variant="ghost" icon={RefreshCw} onClick={() => window.location.reload()}>Refresh</Button>
            {authenticatedUser && (
              <span className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 sm:flex">
                <span className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-black text-white" style={{ background: BRAND }}>{initials}</span>
                <span className="text-xs font-bold text-slate-700">{authenticatedUser.full_name || authenticatedUser.employee_code}</span>
              </span>
            )}
            {onLogout && <Button variant="ghost" icon={LogOut} onClick={onLogout} aria-label="Logout" />}
          </div>
        </header>

        <main className="px-5 py-6 lg:px-8">
          <div className="mb-5">
            <div className="text-[11px] font-black uppercase tracking-[.14em] text-[#2447d8]">Finance</div>
            <h1 className="mt-1 text-2xl font-black text-slate-950">DTA Billing (Collection)</h1>
          </div>
          <BillingView />
        </main>
      </div>
    </div>
  )
}
