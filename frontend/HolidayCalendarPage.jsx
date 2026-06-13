'use client'
/**
 * ACE Company Calendar — Holiday Calendar Page (Mockup)
 *
 * MVP read-only view of company holidays for the year.
 *   - Top: title + year selector + Add/Import (HR only)
 *   - Stat row: counts by type
 *   - Main: big month grid (left) + upcoming list (right)
 *   - Bottom: year overview (12 mini-months)
 *
 * Status: MOCK — all data is in SEED_HOLIDAYS below. No backend yet.
 *         Once /api/holidays is live, swap SEED_HOLIDAYS → apiFetch.
 *
 * Text convention: primary English, Thai in parentheses on a second line.
 */

import React, { useState, useMemo } from 'react'
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Edit2, Trash2,
  X, Flag, Building2, Sparkles, Sun,
} from 'lucide-react'

const ACE_BLUE = '#2447d8'
const ACE_RED  = '#c0392b'

// ───────────────────────── Mock seed (Thai public holidays 2026) ─────────────
const SEED_HOLIDAYS = [
  { id: 1,  date: '2026-01-01', name_en: "New Year's Day",                 name_th: 'วันขึ้นปีใหม่',                          type: 'PUBLIC' },
  { id: 2,  date: '2026-02-12', name_en: 'Makha Bucha Day',                name_th: 'วันมาฆบูชา (ประมาณ)',                    type: 'RELIGIOUS' },
  { id: 3,  date: '2026-04-06', name_en: 'Chakri Memorial Day',            name_th: 'วันจักรี',                              type: 'PUBLIC' },
  { id: 4,  date: '2026-04-13', name_en: 'Songkran Festival',              name_th: 'วันสงกรานต์',                            type: 'PUBLIC' },
  { id: 5,  date: '2026-04-14', name_en: 'Songkran Festival',              name_th: 'วันสงกรานต์',                            type: 'PUBLIC' },
  { id: 6,  date: '2026-04-15', name_en: 'Songkran Festival',              name_th: 'วันสงกรานต์',                            type: 'PUBLIC' },
  { id: 7,  date: '2026-05-01', name_en: 'National Labour Day',            name_th: 'วันแรงงานแห่งชาติ',                       type: 'PUBLIC' },
  { id: 8,  date: '2026-05-04', name_en: 'Coronation Day',                 name_th: 'วันฉัตรมงคล',                            type: 'PUBLIC' },
  { id: 9,  date: '2026-05-11', name_en: 'Visakha Bucha Day',              name_th: 'วันวิสาขบูชา (ประมาณ)',                   type: 'RELIGIOUS' },
  { id: 10, date: '2026-06-03', name_en: "Queen Suthida's Birthday",       name_th: 'วันเฉลิมพระชนมพรรษาพระราชินี',           type: 'PUBLIC' },
  { id: 11, date: '2026-07-28', name_en: "King's Birthday",                name_th: 'วันเฉลิมพระชนมพรรษา ร.10',                type: 'PUBLIC' },
  { id: 12, date: '2026-07-29', name_en: 'Asalha Puja Day',                name_th: 'วันอาสาฬหบูชา',                          type: 'RELIGIOUS' },
  { id: 13, date: '2026-07-30', name_en: 'Buddhist Lent Day',              name_th: 'วันเข้าพรรษา',                           type: 'RELIGIOUS' },
  { id: 14, date: '2026-08-12', name_en: "Mother's Day",                   name_th: 'วันแม่แห่งชาติ',                          type: 'PUBLIC' },
  { id: 15, date: '2026-10-13', name_en: 'Bhumibol Memorial Day',          name_th: 'วันคล้ายวันสวรรคต ร.9',                  type: 'PUBLIC' },
  { id: 16, date: '2026-10-23', name_en: 'Chulalongkorn Day',              name_th: 'วันปิยมหาราช',                            type: 'PUBLIC' },
  { id: 17, date: '2026-12-05', name_en: "Father's Day",                   name_th: 'วันพ่อแห่งชาติ',                          type: 'PUBLIC' },
  { id: 18, date: '2026-12-07', name_en: "Father's Day (Substitute)",      name_th: 'วันหยุดชดเชย วันพ่อแห่งชาติ',             type: 'SUBSTITUTE' },
  { id: 19, date: '2026-12-10', name_en: 'Constitution Day',               name_th: 'วันรัฐธรรมนูญ',                          type: 'PUBLIC' },
  { id: 20, date: '2026-12-31', name_en: "New Year's Eve",                 name_th: 'วันสิ้นปี',                              type: 'PUBLIC' },
  { id: 21, date: '2026-12-28', name_en: 'Year-end Company Break',         name_th: 'หยุดยาวปลายปี (บริษัท)',                  type: 'COMPANY' },
  { id: 22, date: '2026-12-29', name_en: 'Year-end Company Break',         name_th: 'หยุดยาวปลายปี (บริษัท)',                  type: 'COMPANY' },
  { id: 23, date: '2026-12-30', name_en: 'Year-end Company Break',         name_th: 'หยุดยาวปลายปี (บริษัท)',                  type: 'COMPANY' },
]

const TYPE_META = {
  PUBLIC:     { label_en: 'Public',     label_th: 'วันหยุดราชการ',    color: '#dc2626', bg: '#fee2e2', icon: Flag },
  SUBSTITUTE: { label_en: 'Substitute', label_th: 'วันหยุดชดเชย',     color: '#ea580c', bg: '#ffedd5', icon: Sun },
  COMPANY:    { label_en: 'Company',    label_th: 'หยุดบริษัท',        color: '#2447d8', bg: '#dbeafe', icon: Building2 },
  RELIGIOUS:  { label_en: 'Religious',  label_th: 'วันสำคัญทางศาสนา', color: '#a16207', bg: '#fef3c7', icon: Sparkles },
}

const MONTHS_EN       = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTHS_EN_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHS_TH       = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                         'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']
const DOW_EN_SHORT    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

// ───────────────────────── Helpers ──────────────────────────────────────────
function todayISO() {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

function isoFromYMD(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function daysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate()
}

function firstDOW(y, m) {
  return new Date(y, m, 1).getDay() // 0=Sun
}

function buildMonthGrid(y, m) {
  const dim = daysInMonth(y, m)
  const first = firstDOW(y, m)
  const cells = []
  const prevDim = daysInMonth(y, m - 1)
  for (let i = first - 1; i >= 0; i--) {
    const dom = prevDim - i
    cells.push({ iso: isoFromYMD(m === 0 ? y - 1 : y, m === 0 ? 11 : m - 1, dom), inMonth: false, dom })
  }
  for (let d = 1; d <= dim; d++) {
    cells.push({ iso: isoFromYMD(y, m, d), inMonth: true, dom: d })
  }
  let nextD = 1
  while (cells.length < 42) {
    cells.push({ iso: isoFromYMD(m === 11 ? y + 1 : y, m === 11 ? 0 : m + 1, nextD), inMonth: false, dom: nextD })
    nextD++
  }
  return cells
}

function daysUntil(iso) {
  const today = new Date(todayISO() + 'T00:00:00')
  const target = new Date(iso + 'T00:00:00')
  return Math.round((target - today) / (1000 * 60 * 60 * 24))
}

// ───────────────────────── Sub-components ───────────────────────────────────

function TypeBadge({ type, size = 'sm' }) {
  const meta = TYPE_META[type] || TYPE_META.PUBLIC
  const Icon = meta.icon
  return (
    <span title={meta.label_th} style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: size === 'sm' ? '2px 8px' : '4px 10px',
      borderRadius: 999,
      background: meta.bg, color: meta.color,
      fontSize: size === 'sm' ? 11 : 12, fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      <Icon size={size === 'sm' ? 10 : 12} />
      {meta.label_en}
    </span>
  )
}

function StatCard({ label_en, label_th, value, color, icon: Icon }) {
  return (
    <div style={{
      flex: 1, minWidth: 160,
      padding: 16, borderRadius: 12,
      background: 'white', border: '1px solid #e2e8f0',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: color + '15', color,
        display: 'grid', placeItems: 'center', flexShrink: 0,
      }}>
        <Icon size={20} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, color: '#475569', fontWeight: 600, lineHeight: 1.3 }}>{label_en}</div>
        {label_th && <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.2 }}>({label_th})</div>}
        <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', lineHeight: 1.1, marginTop: 2 }}>{value}</div>
      </div>
    </div>
  )
}

function MonthGrid({ year, month, holidaysByDate, today, onCellClick }) {
  const cells = buildMonthGrid(year, month)
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '0 0 12px 12px', overflow: 'hidden', background: 'white' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        {DOW_EN_SHORT.map((d, i) => (
          <div key={i} style={{
            padding: '10px 8px', textAlign: 'center', fontSize: 11, fontWeight: 700,
            color: i === 0 || i === 6 ? '#dc2626' : '#475569', letterSpacing: 0.5,
          }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {cells.map((cell, idx) => {
          const list = holidaysByDate[cell.iso] || []
          const isToday = cell.iso === today
          const dow = new Date(cell.iso + 'T00:00:00').getDay()
          const isWeekend = dow === 0 || dow === 6
          const isHoliday = list.length > 0
          return (
            <div
              key={idx}
              onClick={() => onCellClick && onCellClick(cell.iso)}
              style={{
                minHeight: 100, padding: 8,
                borderRight: ((idx + 1) % 7) ? '1px solid #f1f5f9' : 'none',
                borderTop: idx >= 7 ? '1px solid #f1f5f9' : 'none',
                background: !cell.inMonth ? '#fafafa' : (isHoliday ? '#fff7f7' : 'white'),
                opacity: cell.inMonth ? 1 : 0.45,
                cursor: 'pointer', position: 'relative',
              }}
            >
              <div style={{
                display: 'inline-flex', width: 26, height: 26, borderRadius: '50%',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: isToday ? 700 : 500,
                background: isToday ? ACE_BLUE : 'transparent',
                color: isToday ? 'white' : (isHoliday ? '#dc2626' : (isWeekend ? '#dc2626' : '#0f172a')),
                marginBottom: 4,
              }}>{cell.dom}</div>
              {list.slice(0, 2).map(h => {
                const meta = TYPE_META[h.type] || TYPE_META.PUBLIC
                return (
                  <div key={h.id} title={`${h.name_en} — ${h.name_th}`} style={{
                    marginTop: 3, padding: '3px 6px', borderRadius: 4,
                    background: meta.bg, color: meta.color,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      fontSize: 10, lineHeight: 1.2, fontWeight: 700,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{h.name_en}</div>
                    <div style={{
                      fontSize: 9, lineHeight: 1.2, opacity: 0.85,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>({h.name_th})</div>
                  </div>
                )
              })}
              {list.length > 2 && (
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 3, fontWeight: 500 }}>
                  +{list.length - 2} more
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MiniMonth({ year, month, holidaysByDate, isActive, onClick }) {
  const cells = buildMonthGrid(year, month)
  const today = todayISO()
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left', padding: 10, borderRadius: 10,
        border: isActive ? `2px solid ${ACE_BLUE}` : '1px solid #e2e8f0',
        background: isActive ? '#f0f5ff' : 'white',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? ACE_BLUE : '#0f172a', lineHeight: 1.2 }}>
          {MONTHS_EN[month]}
        </div>
        <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.2 }}>({MONTHS_TH[month]})</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
        {DOW_EN_SHORT.map((d, i) => (
          <div key={i} style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center', fontWeight: 600 }}>{d[0]}</div>
        ))}
        {cells.map((c, idx) => {
          const isHol = !!holidaysByDate[c.iso]
          const isToday = c.iso === today
          return (
            <div key={idx} style={{
              fontSize: 9, textAlign: 'center', padding: '1px 0',
              background: isToday ? ACE_BLUE : (isHol ? '#fee2e2' : 'transparent'),
              borderRadius: isToday || isHol ? 3 : 0,
              fontWeight: isHol || isToday ? 700 : 400,
              color: isToday ? 'white' : (!c.inMonth ? '#cbd5e1' : (isHol ? '#dc2626' : '#475569')),
            }}>{c.dom}</div>
          )
        })}
      </div>
    </button>
  )
}

function HolidayListItem({ h, isPast, canEdit, onEdit, onDelete }) {
  const meta = TYPE_META[h.type] || TYPE_META.PUBLIC
  const du = daysUntil(h.date)
  const monthIdx = Number(h.date.slice(5, 7)) - 1
  const day = Number(h.date.slice(8, 10))
  return (
    <div style={{
      padding: 12, borderRadius: 10,
      background: isPast ? '#f8fafc' : 'white',
      border: '1px solid #e2e8f0',
      display: 'flex', gap: 12, alignItems: 'flex-start',
      opacity: isPast ? 0.65 : 1,
    }}>
      <div style={{
        flex: '0 0 56px', textAlign: 'center', padding: 6, borderRadius: 8,
        background: meta.bg, color: meta.color,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{MONTHS_EN_SHORT[monthIdx]}</div>
        <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>{day}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, lineHeight: 1.3 }}>{h.name_en}</div>
        <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.3, marginBottom: 6 }}>({h.name_th})</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <TypeBadge type={h.type} />
          {!isPast && du <= 30 && du >= 0 && (
            <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>
              {du === 0 ? 'Today' : `in ${du} day${du === 1 ? '' : 's'}`}
            </span>
          )}
        </div>
      </div>
      {canEdit && (
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => onEdit(h)} title="Edit (แก้ไข)" style={{
            padding: 6, borderRadius: 6, border: 'none', background: 'transparent',
            color: '#64748b', cursor: 'pointer',
          }}><Edit2 size={14} /></button>
          <button onClick={() => onDelete(h)} title="Delete (ลบ)" style={{
            padding: 6, borderRadius: 6, border: 'none', background: 'transparent',
            color: '#dc2626', cursor: 'pointer',
          }}><Trash2 size={14} /></button>
        </div>
      )}
    </div>
  )
}

function AddEditModal({ holiday, onSave, onCancel }) {
  const [form, setForm] = useState(holiday || {
    date: todayISO(), name_en: '', name_th: '', type: 'COMPANY',
  })
  const isEdit = !!holiday?.id
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
      display: 'grid', placeItems: 'center', zIndex: 100,
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: 14, padding: 24, width: 480, maxWidth: '92vw',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>
              {isEdit ? 'Edit Holiday' : 'Add Holiday'}
            </h3>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>({isEdit ? 'แก้ไขวันหยุด' : 'เพิ่มวันหยุด'})</div>
          </div>
          <button onClick={onCancel} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Date <span style={{ color: '#94a3b8', fontWeight: 400 }}>(วันที่)</span></span>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14 }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Name in English <span style={{ color: '#94a3b8', fontWeight: 400 }}>(ชื่อภาษาอังกฤษ)</span></span>
            <input type="text" value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))}
              placeholder="e.g., New Year's Day"
              style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14 }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Name in Thai <span style={{ color: '#94a3b8', fontWeight: 400 }}>(ชื่อภาษาไทย)</span></span>
            <input type="text" value={form.name_th} onChange={e => setForm(f => ({ ...f, name_th: e.target.value }))}
              placeholder="เช่น วันขึ้นปีใหม่"
              style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14 }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Type <span style={{ color: '#94a3b8', fontWeight: 400 }}>(ประเภท)</span></span>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14, background: 'white' }}>
              {Object.entries(TYPE_META).map(([k, m]) => (
                <option key={k} value={k}>{m.label_en} ({m.label_th})</option>
              ))}
            </select>
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onCancel} style={{
            padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: 8,
            background: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#475569',
          }}>Cancel</button>
          <button onClick={() => onSave(form)} style={{
            padding: '8px 16px', border: 'none', borderRadius: 8,
            background: ACE_BLUE, color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600,
          }}>{isEdit ? 'Save' : 'Add'}</button>
        </div>
      </div>
    </div>
  )
}

// ───────────────────────── Main page ────────────────────────────────────────

export default function HolidayCalendarPage() {
  const [holidays, setHolidays] = useState(SEED_HOLIDAYS)
  const [year, setYear] = useState(2026)
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth())
  const [filter, setFilter] = useState('ALL')
  const [editing, setEditing] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const today = todayISO()

  // Pretend the logged-in user is HR_ADMIN for the mockup — toggle to see read-only mode.
  const canEdit = true

  const holidaysOfYear = useMemo(() =>
    holidays
      .filter(h => h.date.startsWith(String(year)))
      .filter(h => filter === 'ALL' || h.type === filter)
      .sort((a, b) => a.date.localeCompare(b.date)),
    [holidays, year, filter])

  const holidaysByDate = useMemo(() => {
    const m = {}
    for (const h of holidaysOfYear) {
      if (!m[h.date]) m[h.date] = []
      m[h.date].push(h)
    }
    return m
  }, [holidaysOfYear])

  const stats = useMemo(() => {
    const counts = { PUBLIC: 0, SUBSTITUTE: 0, COMPANY: 0, RELIGIOUS: 0 }
    for (const h of holidaysOfYear) counts[h.type] = (counts[h.type] || 0) + 1
    return counts
  }, [holidaysOfYear])

  const upcoming = useMemo(() =>
    holidaysOfYear.filter(h => h.date >= today).slice(0, 8),
    [holidaysOfYear, today])

  const past = useMemo(() =>
    holidaysOfYear.filter(h => h.date < today).slice(-5),
    [holidaysOfYear, today])

  const nextHoliday = upcoming[0]
  const daysToNext = nextHoliday ? daysUntil(nextHoliday.date) : null

  function handleSave(form) {
    if (form.id) {
      setHolidays(hs => hs.map(h => h.id === form.id ? form : h))
    } else {
      const id = Math.max(0, ...holidays.map(h => h.id)) + 1
      setHolidays(hs => [...hs, { ...form, id }])
    }
    setShowModal(false)
    setEditing(null)
  }

  function handleEdit(h) { setEditing(h); setShowModal(true) }
  function handleDelete(h) {
    if (confirm(`Delete holiday "${h.name_en}" (${h.name_th}) ?`)) {
      setHolidays(hs => hs.filter(x => x.id !== h.id))
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: `linear-gradient(135deg, ${ACE_BLUE}, ${ACE_RED})`,
                display: 'grid', placeItems: 'center', color: 'white',
              }}><CalendarIcon size={22} /></div>
              <div>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>Company Calendar</h1>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.3 }}>Holiday & company-event calendar</div>
                <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.3 }}>(ปฏิทินวันหยุดและกิจกรรมของบริษัท)</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={year} onChange={e => setYear(Number(e.target.value))} style={{
              padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8,
              background: 'white', fontSize: 14, fontWeight: 600, color: '#0f172a',
            }}>
              <option value={2025}>2025 (B.E. 2568)</option>
              <option value={2026}>2026 (B.E. 2569)</option>
              <option value={2027}>2027 (B.E. 2570)</option>
            </select>
            <select value={filter} onChange={e => setFilter(e.target.value)} style={{
              padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8,
              background: 'white', fontSize: 14, color: '#475569',
            }}>
              <option value="ALL">All types (ทุกประเภท)</option>
              {Object.entries(TYPE_META).map(([k, m]) => (
                <option key={k} value={k}>{m.label_en} ({m.label_th})</option>
              ))}
            </select>
            {canEdit && (
              <button onClick={() => { setEditing(null); setShowModal(true) }} style={{
                padding: '8px 14px', border: 'none', borderRadius: 8,
                background: ACE_BLUE, color: 'white', cursor: 'pointer',
                fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                <Plus size={16} /> Add Holiday
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <StatCard label_en="Total Holidays" label_th="วันหยุดทั้งหมดในปี" value={holidaysOfYear.length} color={ACE_BLUE} icon={CalendarIcon} />
          <StatCard label_en="Public" label_th="วันหยุดราชการ" value={stats.PUBLIC || 0} color="#dc2626" icon={Flag} />
          <StatCard label_en="Religious" label_th="วันสำคัญทางศาสนา" value={stats.RELIGIOUS || 0} color="#a16207" icon={Sparkles} />
          <StatCard label_en="Company" label_th="หยุดบริษัท" value={stats.COMPANY || 0} color={ACE_BLUE} icon={Building2} />
          {nextHoliday && (
            <StatCard
              label_en={`Next: ${nextHoliday.name_en}`}
              label_th={nextHoliday.name_th}
              value={daysToNext === 0 ? 'Today!' : `in ${daysToNext} day${daysToNext === 1 ? '' : 's'}`}
              color="#ea580c" icon={Sun}
            />
          )}
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>

          {/* Month calendar */}
          <div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px', background: 'white',
              borderRadius: '12px 12px 0 0', border: '1px solid #e2e8f0', borderBottom: 'none',
            }}>
              <button onClick={() => {
                if (activeMonth === 0) { setActiveMonth(11); setYear(y => y - 1) }
                else setActiveMonth(m => m - 1)
              }} style={{
                padding: 6, border: '1px solid #e2e8f0', borderRadius: 6,
                background: 'white', cursor: 'pointer', color: '#475569',
              }}><ChevronLeft size={18} /></button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                  {MONTHS_EN[activeMonth]} {year}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.2 }}>
                  ({MONTHS_TH[activeMonth]} {year + 543})
                </div>
              </div>
              <button onClick={() => {
                if (activeMonth === 11) { setActiveMonth(0); setYear(y => y + 1) }
                else setActiveMonth(m => m + 1)
              }} style={{
                padding: 6, border: '1px solid #e2e8f0', borderRadius: 6,
                background: 'white', cursor: 'pointer', color: '#475569',
              }}><ChevronRight size={18} /></button>
            </div>
            <MonthGrid year={year} month={activeMonth} holidaysByDate={holidaysByDate} today={today} />
          </div>

          {/* Sidebar: upcoming + past */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 1.2 }}>
                  Upcoming Holidays
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.2 }}>(วันหยุดที่จะถึง)</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcoming.length === 0 ? (
                  <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: 13, background: 'white', borderRadius: 10, border: '1px dashed #e2e8f0' }}>
                    No upcoming holidays this year<br/>
                    <span style={{ fontSize: 11 }}>(ไม่มีวันหยุดเหลือในปีนี้)</span>
                  </div>
                ) : upcoming.map(h => (
                  <HolidayListItem key={h.id} h={h} isPast={false} canEdit={canEdit} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </div>
            </div>
            {past.length > 0 && (
              <div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 1.2 }}>
                    Past Holidays
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.2 }}>(ผ่านมาแล้ว)</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {past.map(h => (
                    <HolidayListItem key={h.id} h={h} isPast={true} canEdit={canEdit} onEdit={handleEdit} onDelete={handleDelete} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Year overview */}
        <div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 1.2 }}>
              Year Overview {year}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.2 }}>(ภาพรวมทั้งปี พ.ศ. {year + 543})</div>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10,
          }}>
            {Array.from({ length: 12 }, (_, m) => (
              <MiniMonth
                key={m}
                year={year}
                month={m}
                holidaysByDate={holidaysByDate}
                isActive={m === activeMonth}
                onClick={() => setActiveMonth(m)}
              />
            ))}
          </div>
        </div>

        {showModal && (
          <AddEditModal
            holiday={editing}
            onSave={handleSave}
            onCancel={() => { setShowModal(false); setEditing(null) }}
          />
        )}
      </div>
    </div>
  )
}
