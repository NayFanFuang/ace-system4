// ACE charts — pure SVG, no chart lib, dark-mode aware (grid uses var(--ds-line)) + hover tooltip
import React, { useState } from 'react'

const PALETTE = ['#2447d8', '#16a34a', '#c73b32', '#d97706', '#0ea5e9', '#7c3aed']

function ChartTip({ x, y = 8, children }) {
  return <div className="ds-charttip" style={{ left: `${x}%`, top: y }}>{children}</div>
}

/* Sparkline — tiny inline line */
export function Sparkline({ data = [], color = '#2447d8', height = 36, fill = true }) {
  if (!data.length) return null
  const w = 120, h = height
  const max = Math.max(...data), min = Math.min(...data), range = (max - min) || 1
  const pts = data.map((v, i) => [(i / (data.length - 1 || 1)) * w, h - ((v - min) / range) * (h - 4) - 2])
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={height} preserveAspectRatio="none">
      {fill && <path d={`${line} L ${w} ${h} L 0 ${h} Z`} fill={color} opacity=".12" />}
      <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  )
}

/* BarChart — vertical bars + hover tooltip */
export function BarChart({ data = [], color = '#2447d8', height = 180 }) {
  const [hi, setHi] = useState(null)
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="relative" style={{ height }} onMouseLeave={() => setHi(null)}>
      <div className="flex items-end gap-2 h-full">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full min-w-0 cursor-pointer" onMouseEnter={() => setHi(i)}>
            <div className="w-full rounded-t" style={{
              height: `${(d.value / max) * 100}%`, background: d.color || color, minHeight: 2,
              transition: 'height .6s cubic-bezier(.2,.7,.3,1), filter .15s',
              filter: hi === i ? 'brightness(1.12)' : 'none', boxShadow: hi === i ? '0 6px 14px -6px rgba(36,71,216,.5)' : 'none',
            }} />
            <div className="text-[10px] text-slate-500 ds-muted-text truncate w-full text-center">{d.label}</div>
          </div>
        ))}
      </div>
      {hi != null && (
        <ChartTip x={((hi + 0.5) / data.length) * 100} y={-4}>
          <div className="font-bold">{data[hi].label}</div>
          <div className="ds-mono">{data[hi].value}</div>
        </ChartTip>
      )}
    </div>
  )
}

/* LineChart — single/multi series + grid + hover (guide line + dots + tooltip) */
export function LineChart({ series = [], labels = [], height = 200 }) {
  const [hi, setHi] = useState(null)
  const W = 560, H = height, pad = { l: 8, r: 8, t: 12, b: 8 }
  const all = series.flatMap(s => s.data)
  if (!all.length) return null
  const max = Math.max(...all), min = Math.min(...all, 0), range = (max - min) || 1
  const plotW = W - pad.l - pad.r, plotH = H - pad.t - pad.b
  const n = Math.max(...series.map(s => s.data.length), 2)
  const x = i => pad.l + (i / (n - 1)) * plotW
  const y = v => pad.t + plotH - ((v - min) / range) * plotH
  function onMove(e) {
    const r = e.currentTarget.getBoundingClientRect()
    const idx = Math.round(((e.clientX - r.left) / r.width) * (n - 1))
    setHi(Math.max(0, Math.min(n - 1, idx)))
  }
  return (
    <div className="relative" style={{ height }} onMouseMove={onMove} onMouseLeave={() => setHi(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} preserveAspectRatio="none">
        {[0, .25, .5, .75, 1].map((g, i) => (
          <line key={i} x1={pad.l} x2={W - pad.r} y1={pad.t + g * plotH} y2={pad.t + g * plotH} style={{ stroke: 'var(--ds-line)' }} strokeWidth="1" vectorEffect="non-scaling-stroke" />
        ))}
        {series.map((s, si) => {
          const color = s.color || PALETTE[si % PALETTE.length]
          const d = s.data.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ')
          return <React.Fragment key={si}>
            {s.fill && <path d={`${d} L ${x(s.data.length - 1)} ${pad.t + plotH} L ${pad.l} ${pad.t + plotH} Z`} fill={color} opacity=".1" />}
            <path d={d} fill="none" stroke={color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeDasharray={s.dashed ? '6 4' : undefined} />
          </React.Fragment>
        })}
        {hi != null && <>
          <line x1={x(hi)} x2={x(hi)} y1={pad.t} y2={pad.t + plotH} style={{ stroke: 'var(--ds-line)' }} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          {series.map((s, si) => s.data[hi] != null && (
            <circle key={si} cx={x(hi)} cy={y(s.data[hi])} r="3.2" fill="#fff" stroke={s.color || PALETTE[si % PALETTE.length]} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          ))}
        </>}
      </svg>
      {hi != null && (
        <ChartTip x={(hi / (n - 1)) * 100} y={-4}>
          {labels[hi] != null && <div className="font-bold mb-0.5">{labels[hi]}</div>}
          {series.map((s, si) => (
            <div key={si} className="flex items-center gap-1.5">
              <span style={{ width: 7, height: 7, borderRadius: 99, background: s.color || PALETTE[si % PALETTE.length], display: 'inline-block' }} />
              <span>{s.name || `Series ${si + 1}`}</span>
              <span className="ds-mono ml-2">{s.data[hi]}</span>
            </div>
          ))}
        </ChartTip>
      )}
    </div>
  )
}

/* Donut — hover grows segment + shows center value */
export function Donut({ data = [], size = 150, thickness = 20 }) {
  const [hi, setHi] = useState(null)
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const r = (size - thickness - 6) / 2, c = size / 2, circ = 2 * Math.PI * r
  let offset = 0
  const center = hi != null ? data[hi] : null
  return (
    <div className="flex items-center gap-5 flex-wrap">
      <div className="relative" style={{ width: size, height: size }} onMouseLeave={() => setHi(null)}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={c} cy={c} r={r} fill="none" style={{ stroke: 'var(--ds-line)' }} strokeWidth={thickness} />
          {data.map((d, i) => {
            const dash = (d.value / total) * circ
            const seg = (
              <circle key={i} cx={c} cy={c} r={r} fill="none" stroke={d.color || PALETTE[i % PALETTE.length]}
                strokeWidth={hi === i ? thickness + 5 : thickness} strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset}
                transform={`rotate(-90 ${c} ${c})`} style={{ transition: 'stroke-width .15s', cursor: 'pointer' }}
                onMouseEnter={() => setHi(i)} />
            )
            offset += dash
            return seg
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center pointer-events-none text-center">
          <div>
            <div className="text-xl font-black leading-none">{center ? center.value : total}</div>
            <div className="text-[10px] text-slate-500 ds-muted-text mt-0.5">{center ? center.label : 'Total'}</div>
          </div>
        </div>
      </div>
      <div className="space-y-1.5 text-xs min-w-[120px]">
        {data.map((d, i) => (
          <div key={i} className={'flex items-center gap-2 cursor-pointer rounded px-1 ' + (hi === i ? 'bg-slate-100' : '')} onMouseEnter={() => setHi(i)} onMouseLeave={() => setHi(null)}>
            <span className="ds-dot" style={{ background: d.color || PALETTE[i % PALETTE.length] }} />
            <span>{d.label}</span>
            <span className="ml-auto ds-mono text-slate-500 ds-muted-text">{d.value} · {Math.round(d.value / total * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* Timeline — Gantt-style time bars (clock sessions / phases) + hover tooltip */
function fmtHour(h) {
  const hh = Math.floor(h), mm = Math.round((h - hh) * 60)
  return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0')
}
export function Timeline({ start = 6, end = 18, step = 2, rows = [], labelWidth = 96 }) {
  const span = (end - start) || 1
  const pct = h => ((h - start) / span) * 100
  const ticks = []
  for (let h = start; h <= end; h += step) ticks.push(h)
  return (
    <div className="text-xs w-full">
      <div className="flex">
        <div className="shrink-0" style={{ width: labelWidth }} />
        <div className="relative flex-1 h-5">
          {ticks.map(h => <span key={h} className="absolute -translate-x-1/2 text-slate-400 ds-muted-text ds-mono" style={{ left: `${pct(h)}%` }}>{fmtHour(h)}</span>)}
        </div>
      </div>
      {rows.map((r, ri) => (
        <div key={ri} className="flex items-center mb-1.5">
          <div className="shrink-0 truncate font-bold pr-2" style={{ width: labelWidth }}>{r.label}</div>
          <div className="relative flex-1 rounded" style={{ height: 16, background: 'var(--ds-line)' }}>
            {ticks.map(h => <span key={h} className="absolute top-0 bottom-0 w-px" style={{ left: `${pct(h)}%`, background: 'rgba(148,163,184,.25)' }} />)}
            {r.segments.map((s, si) => {
              const left = pct(s.from), width = Math.max(0, pct(s.to) - pct(s.from))
              return (
                <div key={si} className="ds-tl-seg absolute top-0 h-full rounded" style={{ left: `${left}%`, width: `${width}%`, background: s.color || '#2447d8' }}>
                  <span className="ds-tl-tip">{s.label ? `${s.label} · ` : ''}{fmtHour(s.from)}–{fmtHour(s.to)}</span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

/* Gauge */
export function Gauge({ value = 0, height = 100 }) {
  const v = Math.max(0, Math.min(100, value))
  const off = 220 - (v / 100) * 220
  const angle = -90 + v * 1.8
  return (
    <div className="grid place-items-center">
      <svg width={height * 1.8} height={height} viewBox="0 0 160 90">
        <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" style={{ stroke: 'var(--ds-line)' }} strokeWidth="14" strokeLinecap="round" />
        <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke="url(#dsGauge)" strokeWidth="14" strokeLinecap="round"
          strokeDasharray="220" strokeDashoffset={off} style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.2,.6,.3,1)' }} />
        <defs><linearGradient id="dsGauge" x1="0" x2="1"><stop offset="0" stopColor="#dc2626" /><stop offset=".5" stopColor="#d97706" /><stop offset="1" stopColor="#16a34a" /></linearGradient></defs>
        <line x1="80" y1="80" x2="80" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          transform={`rotate(${angle} 80 80)`} style={{ transition: 'transform 1s cubic-bezier(.2,.6,.3,1)' }} />
        <circle cx="80" cy="80" r="5" fill="currentColor" />
      </svg>
      <div className="text-2xl font-black ds-mono -mt-1">{v}%</div>
    </div>
  )
}
