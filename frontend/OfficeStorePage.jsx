import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { apiFetch } from './src/apiFetch.js'

const STATUS_META = {
  PENDING: { label: 'รออนุมัติ', cls: 'bg-amber-100 text-amber-700' },
  APPROVED: { label: 'อนุมัติแล้ว', cls: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'ไม่อนุมัติ', cls: 'bg-rose-100 text-rose-700' },
  CANCELLED: { label: 'ยกเลิก', cls: 'bg-slate-100 text-slate-500' },
}

function fmtDateTime(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) }
  catch { return iso }
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status, cls: 'bg-slate-100 text-slate-600' }
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${m.cls}`}>{m.label}</span>
}

// ===========================================================================
// Item editor modal (admin)
// ===========================================================================
function ItemModal({ item, onClose, onSaved }) {
  const editing = !!item
  const [name, setName] = useState(item?.name || '')
  const [sku, setSku] = useState(item?.sku || '')
  const [category, setCategory] = useState(item?.category || '')
  const [unit, setUnit] = useState(item?.unit || 'ชิ้น')
  const [minQty, setMinQty] = useState(item?.min_qty ?? 0)
  const [quantity, setQuantity] = useState(0)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setSaving(true); setError('')
    const payload = {
      name: name.trim(), sku: sku.trim() || null, category: category.trim() || null,
      unit: unit.trim() || 'ชิ้น', min_qty: Number(minQty) || 0, is_active: true,
    }
    if (!editing) payload.quantity = Number(quantity) || 0
    const res = await apiFetch(editing ? `/api/stock-items/${item.id}` : '/api/stock-items', {
      method: editing ? 'PATCH' : 'POST', body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { setError(data.detail || 'บันทึกไม่สำเร็จ'); setSaving(false); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h3 className="text-lg font-semibold text-slate-800">{editing ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <div className="space-y-3 px-5 py-4">
          <label className="block"><span className="text-xs font-medium text-slate-600">ชื่อสินค้า</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={160}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-xs font-medium text-slate-600">รหัส (SKU)</span>
              <input value={sku} onChange={(e) => setSku(e.target.value)} maxLength={60}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
            <label className="block"><span className="text-xs font-medium text-slate-600">หมวดหมู่</span>
              <input value={category} onChange={(e) => setCategory(e.target.value)} maxLength={80}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className="block"><span className="text-xs font-medium text-slate-600">หน่วย</span>
              <input value={unit} onChange={(e) => setUnit(e.target.value)} maxLength={30}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
            <label className="block"><span className="text-xs font-medium text-slate-600">ขั้นต่ำ (เตือน)</span>
              <input type="number" min={0} value={minQty} onChange={(e) => setMinQty(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
            {!editing && (
              <label className="block"><span className="text-xs font-medium text-slate-600">จำนวนเริ่มต้น</span>
                <input type="number" min={0} value={quantity} onChange={(e) => setQuantity(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
            )}
          </div>
          {editing && <p className="text-xs text-slate-400">* ปรับจำนวนสต็อกได้ที่ปุ่ม “รับเข้า/ปรับ” ในตาราง</p>}
          {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
        </div>
        <div className="flex justify-end gap-2 border-t px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">ยกเลิก</button>
          <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'กำลังบันทึก…' : 'บันทึก'}</button>
        </div>
      </form>
    </div>
  )
}

// ===========================================================================
// Inventory tab
// ===========================================================================
function InventoryTab({ items, canManage, onChanged, notify }) {
  const [editItem, setEditItem] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((i) => (i.name || '').toLowerCase().includes(q) || (i.sku || '').toLowerCase().includes(q))
  }, [items, search])

  async function adjust(item) {
    const raw = window.prompt(`ปรับสต็อก "${item.name}" (คงเหลือ ${item.quantity} ${item.unit})\nใส่จำนวน + เพื่อรับเข้า, - เพื่อหักออก:`, '')
    if (raw === null) return
    const delta = parseInt(raw, 10)
    if (!delta) { window.alert('กรุณาใส่จำนวนที่ไม่ใช่ 0'); return }
    const res = await apiFetch(`/api/stock-items/${item.id}/adjust`, { method: 'POST', body: JSON.stringify({ delta }) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { window.alert(data.detail || 'ปรับไม่สำเร็จ'); return }
    notify('ปรับสต็อกแล้ว'); onChanged()
  }

  async function remove(item) {
    if (!window.confirm(`ปิดใช้งานสินค้า "${item.name}"?`)) return
    const res = await apiFetch(`/api/stock-items/${item.id}`, { method: 'DELETE' })
    if (res.ok) { notify('ปิดใช้งานแล้ว'); onChanged() }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาสินค้า / SKU…"
          className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        {canManage && <button onClick={() => setShowNew(true)}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">+ เพิ่มสินค้า</button>}
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">สินค้า</th>
              <th className="px-4 py-2">หมวด</th>
              <th className="px-4 py-2 text-right">คงเหลือ</th>
              <th className="px-4 py-2 text-right">ขั้นต่ำ</th>
              {canManage && <th className="px-4 py-2 text-right">จัดการ</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={canManage ? 5 : 4} className="px-4 py-10 text-center text-slate-300">ไม่มีสินค้า</td></tr>
            ) : filtered.map((i) => (
              <tr key={i.id} className={i.low_stock ? 'bg-rose-50/40' : ''}>
                <td className="px-4 py-2">
                  <div className="font-medium text-slate-700">{i.name}</div>
                  <div className="text-xs text-slate-400">{i.sku || '—'}</div>
                </td>
                <td className="px-4 py-2 text-slate-500">{i.category || '—'}</td>
                <td className="px-4 py-2 text-right">
                  <span className={`font-semibold ${i.low_stock ? 'text-rose-600' : 'text-slate-700'}`}>{i.quantity}</span>
                  <span className="ml-1 text-xs text-slate-400">{i.unit}</span>
                  {i.low_stock && <span className="ml-2 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-medium text-rose-600">ใกล้หมด</span>}
                </td>
                <td className="px-4 py-2 text-right text-slate-400">{i.min_qty}</td>
                {canManage && (
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button onClick={() => adjust(i)} className="rounded-md px-2 py-1 text-xs text-blue-600 hover:bg-blue-50">รับเข้า/ปรับ</button>
                    <button onClick={() => setEditItem(i)} className="rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100">แก้ไข</button>
                    <button onClick={() => remove(i)} className="rounded-md px-2 py-1 text-xs text-rose-500 hover:bg-rose-50">ปิด</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showNew && <ItemModal onClose={() => setShowNew(false)} onSaved={() => { setShowNew(false); onChanged() }} />}
      {editItem && <ItemModal item={editItem} onClose={() => setEditItem(null)} onSaved={() => { setEditItem(null); onChanged() }} />}
    </div>
  )
}

// ===========================================================================
// New request (cart) modal
// ===========================================================================
function RequestModal({ items, onClose, onSaved }) {
  const [cart, setCart] = useState([])      // [{item_id, qty}]
  const [note, setNote] = useState('')
  const [picker, setPicker] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const available = items.filter((i) => !cart.some((c) => c.item_id === i.id))
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items])

  function addItem(id) {
    if (!id) return
    setCart((c) => [...c, { item_id: Number(id), qty: 1 }])
    setPicker('')
  }
  function setQty(id, qty) { setCart((c) => c.map((x) => x.item_id === id ? { ...x, qty } : x)) }
  function removeLine(id) { setCart((c) => c.filter((x) => x.item_id !== id)) }

  async function submit(e) {
    e.preventDefault()
    if (cart.length === 0) { setError('กรุณาเลือกสินค้าอย่างน้อย 1 รายการ'); return }
    if (cart.some((c) => !c.qty || c.qty < 1)) { setError('จำนวนต้องมากกว่า 0'); return }
    setSaving(true); setError('')
    const res = await apiFetch('/api/stock-requests', {
      method: 'POST',
      body: JSON.stringify({ note: note.trim() || null, lines: cart.map((c) => ({ item_id: c.item_id, qty: Number(c.qty) })) }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { setError(data.detail || 'ส่งคำขอไม่สำเร็จ'); setSaving(false); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h3 className="text-lg font-semibold text-slate-800">เบิกของ</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <div className="space-y-3 px-5 py-4">
          <div className="flex gap-2">
            <select value={picker} onChange={(e) => addItem(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">+ เลือกสินค้าเพิ่ม…</option>
              {available.map((i) => <option key={i.id} value={i.id}>{i.name} (คงเหลือ {i.quantity} {i.unit})</option>)}
            </select>
          </div>

          {cart.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">ยังไม่มีรายการ</div>
          ) : (
            <div className="space-y-2">
              {cart.map((c) => {
                const it = byId.get(c.item_id)
                const over = it && c.qty > it.quantity
                return (
                  <div key={c.item_id} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-medium text-slate-700">{it?.name}</div>
                      <div className="text-xs text-slate-400">คงเหลือ {it?.quantity} {it?.unit}</div>
                    </div>
                    <input type="number" min={1} value={c.qty} onChange={(e) => setQty(c.item_id, e.target.value)}
                      className={`w-20 rounded-lg border px-2 py-1 text-sm ${over ? 'border-rose-400 text-rose-600' : 'border-slate-300'}`} />
                    <button type="button" onClick={() => removeLine(c.item_id)} className="text-rose-400 hover:text-rose-600">✕</button>
                  </div>
                )
              })}
            </div>
          )}

          <label className="block"><span className="text-xs font-medium text-slate-600">หมายเหตุ (ไม่บังคับ)</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={2000}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
        </div>
        <div className="flex justify-end gap-2 border-t px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">ยกเลิก</button>
          <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'กำลังส่ง…' : 'ส่งคำขอเบิก'}</button>
        </div>
      </form>
    </div>
  )
}

// ===========================================================================
// Request card (shared by My Requests + Approvals)
// ===========================================================================
function RequestCard({ req, showRequester, actions }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-700">คำขอ #{req.id}</div>
          {showRequester && <div className="text-xs text-slate-400">{req.requested_by_name || req.requested_by}</div>}
          <div className="text-xs text-slate-400">{fmtDateTime(req.created_at)}</div>
        </div>
        <StatusBadge status={req.status} />
      </div>
      <ul className="mb-2 space-y-1">
        {req.lines.map((l, idx) => (
          <li key={idx} className="flex justify-between text-sm text-slate-600">
            <span>{l.item_name}</span><span className="font-medium">{l.qty} {l.unit}</span>
          </li>
        ))}
      </ul>
      {req.note && <div className="mb-2 rounded bg-slate-50 px-2 py-1 text-xs text-slate-500">📝 {req.note}</div>}
      {req.status !== 'PENDING' && req.decided_by_name && (
        <div className="text-xs text-slate-400">
          {STATUS_META[req.status]?.label} โดย {req.decided_by_name} · {fmtDateTime(req.decided_at)}
          {req.decision_note && <span> — {req.decision_note}</span>}
        </div>
      )}
      {actions && <div className="mt-3 flex justify-end gap-2">{actions}</div>}
    </div>
  )
}

// ===========================================================================
// Main page
// ===========================================================================
export default function OfficeStorePage({ authenticatedUser }) {
  const [tab, setTab] = useState('request')
  const [items, setItems] = useState([])
  const [canManage, setCanManage] = useState(false)
  const [myReqs, setMyReqs] = useState([])
  const [allReqs, setAllReqs] = useState([])
  const [pendingCount, setPendingCount] = useState(0)
  const [showRequest, setShowRequest] = useState(false)
  const [banner, setBanner] = useState('')
  const [loading, setLoading] = useState(true)

  const notify = useCallback((msg) => { setBanner(msg); setTimeout(() => setBanner(''), 2500) }, [])

  const loadItems = useCallback(async () => {
    const res = await apiFetch('/api/stock-items')
    const data = await res.json().catch(() => ({}))
    setItems(data.items || [])
    setCanManage(!!data.can_manage)
  }, [])

  const loadMine = useCallback(async () => {
    const res = await apiFetch('/api/stock-requests?scope=mine')
    const data = await res.json().catch(() => ({}))
    setMyReqs(data.requests || [])
    setPendingCount(data.pending_count || 0)
  }, [])

  const loadAll = useCallback(async () => {
    const res = await apiFetch('/api/stock-requests?scope=all')
    if (!res.ok) return
    const data = await res.json().catch(() => ({}))
    setAllReqs(data.requests || [])
    setPendingCount(data.pending_count || 0)
  }, [])

  const refreshAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([loadItems(), loadMine()])
    setLoading(false)
  }, [loadItems, loadMine])

  useEffect(() => { refreshAll() }, [refreshAll])
  useEffect(() => { if (canManage) loadAll() }, [canManage, loadAll])

  async function cancelMine(req) {
    if (!window.confirm(`ยกเลิกคำขอ #${req.id}?`)) return
    const res = await apiFetch(`/api/stock-requests/${req.id}/cancel`, { method: 'POST' })
    if (res.ok) { notify('ยกเลิกคำขอแล้ว'); loadMine() }
    else { const d = await res.json().catch(() => ({})); window.alert(d.detail || 'ยกเลิกไม่สำเร็จ') }
  }

  async function decide(req, action) {
    let note = null
    if (action === 'reject') { note = window.prompt('เหตุผลที่ไม่อนุมัติ (ไม่บังคับ):', '') ; if (note === null) return }
    const res = await apiFetch(`/api/stock-requests/${req.id}/decision`, { method: 'POST', body: JSON.stringify({ action, note }) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { window.alert(data.detail || 'ดำเนินการไม่สำเร็จ'); return }
    notify(action === 'approve' ? 'อนุมัติแล้ว (ตัดสต็อกเรียบร้อย)' : 'ปฏิเสธแล้ว')
    await Promise.all([loadAll(), loadItems(), loadMine()])
  }

  const pendingReqs = allReqs.filter((r) => r.status === 'PENDING')
  const TABS = [
    { id: 'request', label: 'เบิกของ' },
    { id: 'inventory', label: 'คลังสินค้า' },
    ...(canManage ? [{ id: 'approve', label: `อนุมัติ${pendingCount ? ` (${pendingCount})` : ''}` }] : []),
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-800">📦 สโตร์ Office</h1>
          <p className="text-sm text-slate-500">Office Store — เบิกของ / คลังสินค้า / อนุมัติ</p>
        </div>

        {/* Tabs */}
        <div className="mb-5 flex gap-1 border-b border-slate-200">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {banner && <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{banner}</div>}

        {loading ? <div className="py-16 text-center text-slate-400">กำลังโหลด…</div> : (
          <>
            {/* --- Request tab --- */}
            {tab === 'request' && (
              <div>
                <div className="mb-4">
                  <button onClick={() => setShowRequest(true)}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700">+ เบิกของ</button>
                </div>
                {myReqs.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-400">ยังไม่มีคำขอเบิก</div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {myReqs.map((r) => (
                      <RequestCard key={r.id} req={r}
                        actions={r.status === 'PENDING' ? (
                          <button onClick={() => cancelMine(r)} className="rounded-md px-3 py-1.5 text-xs text-rose-500 hover:bg-rose-50">ยกเลิก</button>
                        ) : null} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* --- Inventory tab --- */}
            {tab === 'inventory' && (
              <InventoryTab items={items} canManage={canManage} onChanged={loadItems} notify={notify} />
            )}

            {/* --- Approve tab --- */}
            {tab === 'approve' && canManage && (
              <div>
                {pendingReqs.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-400">ไม่มีคำขอรออนุมัติ</div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {pendingReqs.map((r) => (
                      <RequestCard key={r.id} req={r} showRequester
                        actions={<>
                          <button onClick={() => decide(r, 'reject')} className="rounded-md border border-rose-200 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50">ไม่อนุมัติ</button>
                          <button onClick={() => decide(r, 'approve')} className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">อนุมัติ</button>
                        </>} />
                    ))}
                  </div>
                )}
                {/* History */}
                {allReqs.some((r) => r.status !== 'PENDING') && (
                  <>
                    <h3 className="mb-2 mt-6 text-sm font-semibold text-slate-600">ประวัติ</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {allReqs.filter((r) => r.status !== 'PENDING').map((r) => (
                        <RequestCard key={r.id} req={r} showRequester />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {showRequest && (
        <RequestModal items={items} onClose={() => setShowRequest(false)}
          onSaved={() => { setShowRequest(false); notify('ส่งคำขอเบิกแล้ว รออนุมัติ'); loadMine() }} />
      )}
    </div>
  )
}
