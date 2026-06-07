'use client'

import { useEffect, useMemo, useState } from 'react'
import { ClipboardList, LogOut, Save } from 'lucide-react'
import { apiFetch } from './src/apiFetch.js'

const INPUT = 'w-full rounded border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-[#2447d8] focus:ring-2 focus:ring-[#2447d8]/10'

function autoScore(weight, target, actual) {
  const w = Number(weight), t = Number(target), a = Number(actual)
  if (!Number.isFinite(w) || !Number.isFinite(t) || !Number.isFinite(a) || t <= 0 || actual === '' || actual == null) return ''
  return Math.round(Math.min(a / t, 1) * w * 100) / 100
}

function groupBy(arr, keyFn) {
  const map = new Map()
  arr.forEach(item => { const k = keyFn(item); if (!map.has(k)) map.set(k, []); map.get(k).push(item) })
  return map
}

export default function SelfAssessmentPage({ authenticatedUser = null, onLogout = null }) {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const [period, setPeriod] = useState(currentMonth)
  const [info, setInfo] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('Ready')

  async function load() {
    setLoading(true); setStatus('Loading…')
    try {
      const r = await apiFetch(`/api/kpi/self?period=${encodeURIComponent(period)}`)
      const d = await r.json()
      if (!r.ok) throw new Error(d.detail || 'Load failed')
      setInfo(d.employee)
      setRows((d.items || []).map(it => ({ ...it, actual: it.actual ?? '' })))
      setStatus(`Loaded ${d.items?.length || 0} items`)
    } catch (e) {
      setStatus(e.message || 'Load failed')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [period])

  function setActual(itemId, value) {
    setRows(rs => rs.map(r => r.itemId === itemId ? { ...r, actual: value } : r))
  }

  function setTarget(itemId, value) {
    setRows(rs => rs.map(r => r.itemId === itemId ? { ...r, target: value } : r))
  }

  const totalWeight = rows.reduce((s, r) => s + Number(r.weight || 0), 0)
  const totalScore = rows.reduce((s, r) => s + Number(autoScore(r.weight, r.target, r.actual) || 0), 0)
  const filledCount = rows.filter(r => r.actual !== '' && r.actual != null).length
  const groups = useMemo(() => groupBy(rows, r => r.mainEvaluate || 'Others'), [rows])

  async function submit() {
    if (!rows.length) return setStatus('No KPI items to submit.')
    try {
      const payload = {
        period,
        rows: rows.map(r => ({
          item_id: r.itemId, main_evaluate: r.mainEvaluate, evaluate_item: r.evaluateItem,
          weight: Number(r.weight) || 0, target: Number(r.target) || 100,
          actual: r.actual !== '' ? Number(r.actual) : null,
          score: autoScore(r.weight, r.target, r.actual) === '' ? null : autoScore(r.weight, r.target, r.actual),
        })),
      }
      const r = await apiFetch('/api/kpi/self', { method: 'POST', body: JSON.stringify(payload) })
      const d = await r.json()
      if (r.ok) setStatus(`✓ Submitted ${d.saved} items for ${period}`)
      else setStatus(`Submit failed: ${d.detail || 'error'}`)
    } catch {
      setStatus('Submit failed. Check connection.')
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <div className="text-[1.25rem] font-black leading-tight text-[#1d2939]">My KPI — Self-Assessment</div>
            <div className="text-[.78rem] text-slate-500">{info ? `${info.name} · ${info.position || '—'}` : 'Your monthly self-evaluation'}</div>
          </div>
          {onLogout && (
            <button onClick={onLogout} title="Logout" className="ml-auto inline-flex items-center rounded border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"><LogOut size={15} /></button>
          )}
        </div>
      </header>

      <main className="flex flex-col gap-5 p-4 md:p-7">
        {/* Metric cards */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[['KPI Items', rows.length, '#2447d8'], ['Total Weight', totalWeight, '#6d3f8f'], ['Filled', `${filledCount}/${rows.length || 0}`, '#16a34a'], ['Self Score', totalScore.toFixed(1), '#dc2626']].map(([label, val, col]) => (
            <div key={label} className="rounded border border-[#e4e7ec] bg-white p-4">
              <div className="text-xs font-black uppercase text-slate-500">{label}</div>
              <div className="mt-2 text-2xl font-black leading-none" style={{ color: col }}>{val}</div>
            </div>
          ))}
        </section>

        {/* Period selector */}
        <section className="rounded border border-[#e4e7ec] bg-white p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[.68rem] font-black uppercase text-slate-500">Period</label>
              <input type="month" className={INPUT + ' w-[160px]'} value={period} onChange={e => setPeriod(e.target.value)} />
            </div>
            <button onClick={submit} className="inline-flex items-center gap-1.5 rounded bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"><Save size={14} /> Submit Self-Assessment</button>
            <span className="ml-auto text-[.72rem] font-bold text-slate-500">{status}</span>
          </div>
        </section>

        {/* KPI table */}
        {loading ? (
          <div className="rounded border border-[#e4e7ec] bg-white p-12 text-center text-slate-400 font-bold">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="rounded border-2 border-dashed border-[#e4e7ec] bg-slate-50/50 p-12 text-center">
            <ClipboardList size={36} className="mx-auto mb-3 text-slate-300" />
            <div className="font-black text-slate-600 text-sm">No KPI items for this period</div>
          </div>
        ) : (
          <section className="overflow-hidden rounded border border-[#e4e7ec] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-[.76rem]">
                <thead className="bg-slate-50 text-left text-[.68rem] uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2.5 font-black">Main Evaluate</th>
                    <th className="px-3 py-2.5 font-black">Evaluate Item</th>
                    <th className="px-3 py-2.5 font-black text-center w-20">Weight</th>
                    <th className="px-3 py-2.5 font-black text-center w-24">Target</th>
                    <th className="px-3 py-2.5 font-black text-center w-28">My Actual</th>
                    <th className="px-3 py-2.5 font-black text-center w-24">My Score</th>
                  </tr>
                </thead>
                <tbody>
                  {[...groups.entries()].map(([main, list]) => list.map((row, li) => (
                    <tr key={row.itemId} className="border-t border-slate-100 hover:bg-slate-50/60">
                      {li === 0 && (
                        <td rowSpan={list.length} className="px-3 py-3 align-top border-r border-slate-100 bg-slate-50/40">
                          <div className="font-black text-slate-900">{main}</div>
                          <div className="text-[.68rem] text-slate-500 mt-0.5">{list.length} items</div>
                        </td>
                      )}
                      <td className="px-3 py-3">
                        <div className="font-black text-slate-900">{row.evaluateItem}</div>
                        <div className="text-[.65rem] text-slate-400 font-mono mt-0.5">{row.itemId}</div>
                      </td>
                      <td className="px-2 py-3 text-center">
                        <input className="w-16 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-center text-xs font-bold" value={row.weight} readOnly />
                      </td>
                      <td className="px-2 py-3 text-center">
                        <input type="number" className="w-20 rounded border border-slate-200 px-2 py-1 text-center text-xs outline-none focus:border-[#2447d8]" value={row.target} onChange={e => setTarget(row.itemId, e.target.value)} title="You can set your own target for this round" />
                      </td>
                      <td className="px-2 py-3 text-center">
                        <input type="number" className="w-24 rounded border border-slate-200 px-2 py-1 text-center text-xs outline-none focus:border-[#2447d8]" value={row.actual} placeholder="—" onChange={e => setActual(row.itemId, e.target.value)} />
                      </td>
                      <td className="px-2 py-3 text-center">
                        <input className="w-16 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-center text-xs font-black text-slate-700 cursor-not-allowed" value={autoScore(row.weight, row.target, row.actual)} placeholder="( )" readOnly tabIndex={-1} />
                      </td>
                    </tr>
                  )))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 bg-slate-50 font-black text-slate-900">
                    <td colSpan={2} className="px-3 py-3 text-right uppercase tracking-wider text-[.7rem] text-slate-600">Total Score</td>
                    <td className="px-2 py-3 text-center">{totalWeight}</td>
                    <td className="px-2 py-3"></td>
                    <td className="px-2 py-3 text-center text-[.68rem] text-slate-500">{filledCount}/{rows.length} filled</td>
                    <td className="px-2 py-3 text-center text-sm text-emerald-700">{totalScore.toFixed(2)} <span className="text-[.62rem] font-bold text-slate-400">/ {totalWeight}</span></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        )}

        <div className="text-center text-xs font-bold text-slate-400">Score = min(actual / target, 1) × weight · auto-calculated</div>
      </main>
    </div>
  )
}
