// ACE Design System — React component primitives.
// Styling lives in ds.css (classes prefixed `ds-`). Components stay thin.
import React, { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

import './ds.css'
export { toast } from './toast.js'
export { useDarkMode, applyTheme, getTheme } from './theme.js'
export { MapView } from './MapView.jsx'
export { Sparkline, BarChart, LineChart, Donut, Gauge, Timeline } from './Charts.jsx'

const cx = (...a) => a.filter(Boolean).join(' ')

/* ---------- Button ---------- */
export function Button({ variant = 'ghost', icon: Icon, iconRight: IconR, loading, children, className, ...rest }) {
  return (
    <button className={cx('ds-btn', `ds-btn-${variant}`, !children && 'ds-btn-icon', className)} disabled={loading || rest.disabled} {...rest}>
      {loading ? <span className="ds-spinner ds-spinner-on-dark" style={{ width: 14, height: 14, borderWidth: 2 }} /> : Icon && <Icon size={16} />}
      {children}
      {IconR && <IconR size={16} />}
    </button>
  )
}

/* ---------- Card ---------- */
export function Card({ hover, className, children, ...rest }) {
  return <div className={cx('ds-card', hover && 'ds-card-hover', 'ds-surface', className)} {...rest}>{children}</div>
}

/* ---------- Badge ---------- */
const TONE = { green: 'ds-b-green', red: 'ds-b-red', blue: 'ds-b-blue', amber: 'ds-b-amber', purple: 'ds-b-purple', slate: 'ds-b-slate' }
const DOT = { green: '#16a34a', red: '#dc2626', blue: '#2447d8', amber: '#d97706', purple: '#7c3aed', slate: '#94a3b8' }
export function Badge({ tone = 'slate', dot, children }) {
  return <span className={cx('ds-badge', TONE[tone])}>{dot && <span className="ds-dot" style={{ background: DOT[tone] }} />}{children}</span>
}

/* ---------- StatCard (with count-up) ---------- */
export function StatCard({ label, value, hint, hintTone = 'muted', accent }) {
  const n = useCountUp(typeof value === 'number' ? value : null)
  const hintColor = { up: 'text-emerald-600', down: 'text-red-600', muted: 'text-slate-500' }[hintTone]
  return (
    <Card hover className="p-5">
      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 ds-muted-text">{label}</div>
      <div className="text-3xl font-black tracking-tight mt-2" style={accent ? { color: accent } : undefined}>{n ?? value}</div>
      {hint && <div className={cx('text-xs mt-2 font-bold', hintColor)}>{hint}</div>}
    </Card>
  )
}
function useCountUp(target) {
  const [v, setV] = useState(target == null ? null : 0)
  useEffect(() => {
    if (target == null) return
    let raf, start
    const step = t => { if (!start) start = t; const p = Math.min(1, (t - start) / 900); setV(Math.round(target * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(step) }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target])
  return v
}

/* ---------- Field / Input / Select / Switch ---------- */
export function Field({ label, icon: Icon, children }) {
  return (
    <label className="block">
      {label && <span className="text-xs font-bold text-slate-600 ds-muted-text block mb-1.5">{label}</span>}
      {Icon ? <span className="ds-field-icon"><span className="ds-field-ico"><Icon size={16} /></span>{children}</span> : children}
    </label>
  )
}
export const Input = props => <input className="ds-field" {...props} />
export const Select = props => <select className="ds-field" {...props} />
export function Switch({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <span className="ds-switch"><input type="checkbox" checked={checked} onChange={onChange} /><span className="ds-slider" /></span>
      {label && <span className="text-sm">{label}</span>}
    </label>
  )
}
export function Checkbox({ checked, onChange, label }) {
  return <label className="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" className="ds-check" checked={checked} onChange={onChange} />{label}</label>
}
export function Radio({ checked, onChange, label, name }) {
  return <label className="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name={name} className="ds-radio" checked={checked} onChange={onChange} />{label}</label>
}

/* ---------- CodeBlock (copy-to-clipboard) ---------- */
export function CodeBlock({ code = '' }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    try { navigator.clipboard.writeText(code) } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="ds-code">
      <button type="button" className="ds-code-copy" onClick={copy} aria-label="Copy code">{copied ? '✓ Copied' : 'Copy'}</button>
      <pre><code>{code}</code></pre>
    </div>
  )
}

/* ---------- Tooltip (hover) ---------- */
export function Tooltip({ label, children }) {
  return <span className="ds-tooltip">{children}<span className="ds-tooltip-body">{label}</span></span>
}

/* ---------- Alert ---------- */
export function Alert({ tone = 'info', icon: Icon, children }) {
  return <div className={cx('ds-alert', `ds-alert-${tone}`)}>{Icon && <Icon size={18} />}<div>{children}</div></div>
}

/* ---------- Progress ---------- */
export function Progress({ value = 0, color }) {
  const w = Math.max(0, Math.min(100, value))
  return <div className="ds-bar"><i style={{ width: `${w}%`, ...(color ? { background: color } : {}) }} /></div>
}

/* ---------- StatusBadge (semantic) ---------- */
const STATUS_TONE = {
  'on site': 'green', 'on-site': 'green', onsite: 'green', active: 'green', approved: 'green', received: 'green', done: 'green',
  office: 'blue', 'in office': 'blue',
  'off site': 'red', 'off-site': 'red', offsite: 'red', rejected: 'red', overdue: 'red', error: 'red',
  leave: 'amber', pending: 'amber', warning: 'amber',
  'not yet': 'slate', notyet: 'slate', inactive: 'slate', draft: 'slate',
}
export function StatusBadge({ status }) {
  const tone = STATUS_TONE[String(status || '').toLowerCase()] || 'slate'
  return <Badge tone={tone} dot>{status}</Badge>
}

/* ---------- Table (simple) ---------- */
export function Table({ head = [], rows = [] }) {
  return (
    <div className="overflow-x-auto ds-scroll">
      <table className="ds-table">
        <thead><tr>{head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}

/* ---------- Tabs ---------- */
export function Tabs({ items, value, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto ds-scroll pb-1">
      {items.map(it => (
        <button key={it.value} className={cx('ds-tab', value === it.value && 'ds-active')} onClick={() => onChange(it.value)}>
          {it.label}{it.badge != null && <span className="ds-badge ds-b-amber ml-1">{it.badge}</span>}
        </button>
      ))}
    </div>
  )
}

/* ---------- Spinner / Skeleton ---------- */
export const Spinner = ({ size = 22 }) => <span className="ds-spinner" style={{ width: size, height: size }} />
export const Skeleton = ({ className, style }) => <div className={cx('ds-skel', className)} style={style} />

/* ---------- Avatar ---------- */
export function Avatar({ name = '', color = '#2447d8', size = 32 }) {
  const init = name.split(' ').map(x => x[0]).filter(Boolean).slice(0, 2).join('')
  return <span className="ds-avatar" style={{ background: color, width: size, height: size, fontSize: size * 0.38 }}>{init}</span>
}

/* ---------- Menu building blocks (no forced layout) ---------- */
export function Sidebar({ children, width = 256, className }) {
  return <aside className={cx('ds-sidebar bg-white border-r border-slate-200 flex flex-col', className)} style={{ width }}>{children}</aside>
}
export function SidebarBrand({ title = 'ACE', subtitle = 'System 4', logo = '/ace-logo.png' }) {
  return (
    <div className="ds-hero text-white px-5 py-5 flex items-center gap-3">
      <img src={logo} width="40" height="40" className="rounded-lg bg-white/95 p-1 object-contain shrink-0" alt={title} />
      <div>
        <div className="text-2xl font-black tracking-tight leading-none">{title}</div>
        <div className="text-[11px] uppercase tracking-[.18em] opacity-80 mt-1">{subtitle}</div>
      </div>
    </div>
  )
}
export function SidebarSection({ children }) {
  return <div className="ds-side-section">{children}</div>
}
export function NavItem({ icon: Icon, active, badge, children, ...rest }) {
  return (
    <a className={cx('ds-side-link', active && 'ds-active')} {...rest}>
      {Icon && <span className="ds-ic flex"><Icon size={17} /></span>}
      <span className="flex-1">{children}</span>
      {badge != null && <span className="ds-badge ds-b-amber">{badge}</span>}
    </a>
  )
}

/* ---------- EmptyState ---------- */
export function EmptyState({ icon: Icon, title, desc, action, tone }) {
  return (
    <div className="ds-empty">
      <div className="ds-empty-ic" style={tone === 'error' ? { background: '#fee2e2', color: '#b91c1c' } : undefined}>{Icon && <Icon size={28} />}</div>
      <div className="font-bold">{title}</div>
      {desc && <div className="text-sm text-slate-500 ds-muted-text">{desc}</div>}
      {action}
    </div>
  )
}

/* ---------- Modal ---------- */
export function Modal({ open, onClose, children, width }) {
  useEscClose(open, onClose)
  if (!open) return null
  return (
    <div className="ds-overlay" onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div className="ds-modal" style={width ? { width } : undefined}>{children}</div>
    </div>
  )
}

/* ---------- Drawer (slides from right) ---------- */
export function Drawer({ open, onClose, title, children, footer }) {
  useEscClose(open, onClose)
  if (!open) return null
  return (
    <>
      <div className="ds-drawer-ovr" onClick={onClose} />
      <aside className="ds-drawer">
        <div className="p-5 border-b border-slate-200 ds-border flex items-center justify-between">
          <div className="font-black text-lg">{title}</div>
          <Button onClick={onClose} aria-label="Close"><X size={18} /></Button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto flex-1 ds-scroll">{children}</div>
        {footer && <div className="p-4 border-t border-slate-200 ds-border flex gap-2">{footer}</div>}
      </aside>
    </>
  )
}

function useEscClose(open, onClose) {
  useEffect(() => {
    if (!open) return
    const h = e => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
}

/* ---------- Command palette (⌘K) ---------- */
export function CommandPalette({ open, onClose, commands }) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const inputRef = useRef(null)
  const filtered = commands.filter(c => c.title.toLowerCase().includes(q.toLowerCase()))

  useEffect(() => { if (open) { setQ(''); setSel(0); setTimeout(() => inputRef.current?.focus(), 40) } }, [open])
  useEffect(() => { setSel(0) }, [q])
  useEffect(() => {
    if (!open) return
    const h = e => {
      if (e.key === 'Escape') onClose?.()
      else if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, filtered.length - 1)) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(s - 1, 0)) }
      else if (e.key === 'Enter') { e.preventDefault(); run(filtered[sel]) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, filtered, sel])

  function run(cmd) { if (!cmd) return; onClose?.(); setTimeout(() => cmd.action?.(), 120) }
  if (!open) return null

  let lastGroup = null
  return (
    <div className="ds-cmdk" onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div className="ds-cmdk-box">
        <input ref={inputRef} className="ds-cmdk-input" placeholder="Search pages, components or commands…" value={q} onChange={e => setQ(e.target.value)} />
        <div className="ds-cmdk-list ds-scroll">
          {filtered.length === 0 && <div className="ds-empty" style={{ padding: 24 }}><div className="text-sm text-slate-500">No results</div></div>}
          {filtered.map((c, i) => {
            const header = c.group !== lastGroup ? c.group : null
            lastGroup = c.group
            const Icon = c.icon
            return (
              <React.Fragment key={c.title + i}>
                {header && <div className="ds-cmdk-group">{header}</div>}
                <div className={cx('ds-cmdk-item', i === sel && 'ds-sel')} onMouseEnter={() => setSel(i)} onClick={() => run(c)}>
                  {Icon && <span className="ds-ic"><Icon size={17} /></span>}<span>{c.title}</span>
                </div>
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}
