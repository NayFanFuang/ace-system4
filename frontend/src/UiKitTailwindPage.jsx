// Tailwind-only ACE UI Kit demo page.
// Route: /ui-kit-tailwind
import React, { useState } from 'react'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Command,
  FileText,
  Gauge,
  GitBranch,
  Layers,
  LayoutDashboard,
  MapPin,
  Menu,
  Moon,
  Search,
  ShieldCheck,
  Sun,
  Users,
  X,
} from 'lucide-react'

const NAV = [
  ['overview', 'Overview', LayoutDashboard],
  ['tokens', 'Tokens', Layers],
  ['components', 'Components', ClipboardCheck],
  ['charts', 'Charts', BarChart3],
  ['map', 'Map', MapPin],
  ['workflow', 'Workflow', GitBranch],
  ['states', 'States', AlertTriangle],
  ['rules', 'Rules', ShieldCheck],
]

const BARS = [
  ['HR', 'h-[68%]', 'bg-[#2447d8]'],
  ['Clock', 'h-[88%]', 'bg-[#16a34a]'],
  ['Project', 'h-[74%]', 'bg-[#c73b32]'],
  ['Finance', 'h-[52%]', 'bg-[#d97706]'],
  ['KPI', 'h-[92%]', 'bg-[#0ea5e9]'],
  ['Admin', 'h-[44%]', 'bg-[#7c3aed]'],
]

const TOKENS = [
  ['Brand', '#2447d8', 'bg-[#2447d8]'],
  ['Success', '#16a34a', 'bg-[#16a34a]'],
  ['Accent', '#c73b32', 'bg-[#c73b32]'],
  ['Warning', '#d97706', 'bg-[#d97706]'],
  ['Info', '#0ea5e9', 'bg-[#0ea5e9]'],
  ['Ink', '#0f172a', 'bg-[#0f172a]'],
]

function jumpTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function cx(...items) {
  return items.filter(Boolean).join(' ')
}

export default function UiKitTailwindPage() {
  const [active, setActive] = useState('overview')
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(false)

  function go(id) {
    setActive(id)
    setOpen(false)
    jumpTo(id)
  }

  return (
    <div className={cx('min-h-screen font-sans text-slate-950', dark ? 'bg-slate-950 text-white' : 'bg-[#f5f7fb]')}>
      {open && <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden" />}

      <div className="flex min-h-screen">
        <aside className={cx(open ? 'fixed inset-y-0 left-0 z-40 flex' : 'hidden', 'w-72 flex-col border-r border-slate-200 bg-white/95 p-5 shadow-2xl backdrop-blur lg:sticky lg:top-0 lg:flex lg:h-screen lg:shadow-none', dark && 'border-slate-800 bg-slate-900/95')}>
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#2447d8] text-white shadow-lg shadow-blue-900/20">
              <Command className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="text-base font-extrabold tracking-tight">ACE Tailwind Kit</div>
              <div className={cx('text-xs font-bold', dark ? 'text-slate-400' : 'text-slate-400')}>100% utility layout</div>
            </div>
            <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="ml-auto grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 lg:hidden">
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="mt-9 space-y-1.5">
            {NAV.map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => go(id)}
                className={cx(
                  'flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-sm font-semibold transition',
                  active === id ? 'bg-blue-50 text-[#2447d8] shadow-sm' : dark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950',
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className={cx('mt-auto rounded-2xl border p-4', dark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50')}>
            <div className="flex items-center gap-2 text-sm font-bold">
              <ShieldCheck className="h-4 w-4 text-[#2447d8]" />
              Page Standard
            </div>
            <p className={cx('mt-2 text-xs font-medium leading-5', dark ? 'text-slate-400' : 'text-slate-500')}>
              No ds components, no custom chart CSS, no inline style.
            </p>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className={cx('sticky top-0 z-20 border-b px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8', dark ? 'border-slate-800 bg-slate-950/85' : 'border-slate-200/80 bg-white/85')}>
            <div className="flex items-center gap-3">
              <button type="button" aria-label="Open menu" onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm lg:hidden">
                <Menu className="h-5 w-5" />
              </button>
              <div className={cx('hidden min-w-0 flex-1 items-center gap-3 rounded-2xl border px-4 py-2.5 md:flex', dark ? 'border-slate-800 bg-slate-900 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-400')}>
                <Search className="h-4 w-4" />
                <span className="text-sm font-medium">Search tokens, charts, states...</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button type="button" aria-label="Notifications" className={cx('grid h-10 w-10 place-items-center rounded-2xl border shadow-sm', dark ? 'border-slate-800 bg-slate-900 text-slate-300' : 'border-slate-200 bg-white text-slate-600')}>
                  <Bell className="h-5 w-5" />
                </button>
                <button type="button" aria-label="Toggle theme" onClick={() => setDark(v => !v)} className={cx('grid h-10 w-10 place-items-center rounded-2xl border shadow-sm', dark ? 'border-slate-800 bg-slate-900 text-amber-300' : 'border-slate-200 bg-white text-slate-600')}>
                  {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </header>

          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <section id="overview" className="scroll-mt-24">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-extrabold text-[#2447d8]">
                    <Layers className="h-4 w-4" />
                    Tailwind CSS Page System
                  </div>
                  <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">
                    ACE UI Kit, rebuilt as a Tailwind-only page
                  </h1>
                  <p className={cx('mt-3 max-w-3xl text-sm font-medium leading-6', dark ? 'text-slate-400' : 'text-slate-500')}>
                    A production-style reference page for future screens: sidebar, header, metrics, components, charts, map, workflow, and states using Tailwind utility classes.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Pill icon={CheckCircle2} label="Tailwind utilities" />
                  <Pill icon={BarChart3} label="SVG charts" />
                  <Pill icon={ShieldCheck} label="No custom classes" />
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label="Sections" value="8" hint="page modules" color="text-[#2447d8]" />
                <Metric label="Charts" value="5" hint="tailwind svg/div" color="text-[#16a34a]" />
                <Metric label="States" value="4" hint="ready patterns" color="text-[#d97706]" />
                <Metric label="Scale" value="90%" hint="same as UI Kit" color="text-[#c73b32]" />
              </div>
            </section>

            <div className="mt-10 space-y-10">
              <Section id="tokens" title="Design Tokens" eyebrow="Foundation">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {TOKENS.map(([name, value, bg]) => (
                    <Card key={name} dark={dark}>
                      <div className="flex items-start gap-4">
                        <div className={cx('h-14 w-14 rounded-2xl shadow-sm', bg)} />
                        <div>
                          <div className="text-sm font-bold">{name}</div>
                          <div className={cx('mt-1 font-mono text-xs font-bold', dark ? 'text-slate-400' : 'text-slate-500')}>{value}</div>
                          <div className={cx('mt-2 text-xs font-medium leading-5', dark ? 'text-slate-400' : 'text-slate-500')}>Use as a semantic utility color, not one-off decoration.</div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Section>

              <Section id="components" title="Components" eyebrow="Primitives">
                <div className="grid gap-4 xl:grid-cols-3">
                  <Card dark={dark}>
                    <PanelTitle icon={Users} title="Employee Card" desc="Compact HR profile pattern" dark={dark} />
                    <div className="mt-5 flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-[#2447d8] text-sm font-black text-white">PP</div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold">Peerapol Piamsri</div>
                        <div className={cx('text-xs font-medium', dark ? 'text-slate-400' : 'text-slate-500')}>ACE056 · DTE · HWT2304</div>
                      </div>
                      <span className="ml-auto rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700">On Site</span>
                    </div>
                  </Card>
                  <Card dark={dark}>
                    <PanelTitle icon={FileText} title="Toolbar" desc="Search, filter and actions" dark={dark} />
                    <div className="mt-5 flex flex-wrap gap-2">
                      <button className="inline-flex items-center gap-2 rounded-xl bg-[#2447d8] px-3 py-2 text-sm font-bold text-white shadow-sm"><Search className="h-4 w-4" /> Search</button>
                      <button className={cx('rounded-xl border px-3 py-2 text-sm font-bold', dark ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-600')}>Filter</button>
                      <button className={cx('rounded-xl border px-3 py-2 text-sm font-bold', dark ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-600')}>Export</button>
                    </div>
                  </Card>
                  <Card dark={dark}>
                    <PanelTitle icon={Activity} title="Progress Stack" desc="Status and readiness" dark={dark} />
                    <div className="mt-5 space-y-3">
                      <Progress label="Readiness" value="w-[92%]" text="92%" color="bg-[#16a34a]" dark={dark} />
                      <Progress label="Compliance" value="w-[78%]" text="78%" color="bg-[#2447d8]" dark={dark} />
                      <Progress label="Risk Clear" value="w-[64%]" text="64%" color="bg-[#d97706]" dark={dark} />
                    </div>
                  </Card>
                </div>
              </Section>

              <Section id="charts" title="Chart Gallery" eyebrow="Visualization">
                <div className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
                  <Card dark={dark}>
                    <PanelTitle icon={BarChart3} title="Executive Trend" desc="Pure Tailwind + SVG classes" dark={dark} />
                    <LinePreview />
                  </Card>
                  <Card dark={dark}>
                    <PanelTitle icon={Gauge} title="Target Gauge" desc="KPI status pattern" dark={dark} />
                    <GaugePreview />
                  </Card>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-3">
                  <Card dark={dark}>
                    <PanelTitle icon={BarChart3} title="Vertical Bars" desc="Category ranking" dark={dark} />
                    <BarPreview />
                  </Card>
                  <Card dark={dark}>
                    <PanelTitle icon={Activity} title="Donut Mix" desc="Status composition" dark={dark} />
                    <DonutPreview />
                  </Card>
                  <Card dark={dark}>
                    <PanelTitle icon={GitBranch} title="Timeline" desc="Operational windows" dark={dark} />
                    <TimelinePreview dark={dark} />
                  </Card>
                </div>
              </Section>

              <Section id="map" title="Map Pattern" eyebrow="Geo Operations">
                <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
                  <Card dark={dark} className="overflow-hidden">
                    <PanelTitle icon={MapPin} title="Grey Operations Map" desc="Static Tailwind map composition" dark={dark} />
                    <div className="relative mt-5 h-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-200">
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px)] bg-[size:44px_44px]" />
                      <div className="absolute left-[12%] top-[20%] h-24 w-48 rotate-[-12deg] rounded-full border border-white/70 bg-white/25" />
                      <div className="absolute right-[10%] top-[18%] h-40 w-56 rotate-[18deg] rounded-full border border-white/70 bg-white/25" />
                      <MapMarker className="left-[32%] top-[34%]" color="bg-[#16a34a]" label="BKK-RF-014" />
                      <MapMarker className="left-[58%] top-[42%]" color="bg-[#dc2626]" label="BKK-RF-022" />
                      <MapMarker className="left-[46%] top-[60%]" color="bg-[#2447d8]" label="HQ" />
                    </div>
                  </Card>
                  <Card dark={dark}>
                    <PanelTitle icon={Layers} title="Layer Control" desc="Map side panel" dark={dark} />
                    <div className="mt-5 space-y-3">
                      <Layer label="Employee clock-in" count="128" color="bg-[#16a34a]" />
                      <Layer label="Off-radius alert" count="9" color="bg-[#dc2626]" />
                      <Layer label="Pre-Site backlog" count="42" color="bg-[#d97706]" />
                      <Layer label="Office / depot" count="4" color="bg-[#2447d8]" />
                    </div>
                  </Card>
                </div>
              </Section>

              <Section id="workflow" title="Workflow Pattern" eyebrow="Project">
                <Card dark={dark}>
                  <div className="grid gap-3 lg:grid-cols-5">
                    {['DT Plan', 'DT Started', 'Report Done', 'Check Pass', 'Billing Ready'].map((step, index) => (
                      <div key={step} className={cx('rounded-2xl border p-4', dark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50')}>
                        <div className={cx('grid h-9 w-9 place-items-center rounded-xl text-xs font-black text-white', index < 3 ? 'bg-[#2447d8]' : index === 3 ? 'bg-[#16a34a]' : 'bg-slate-300')}>
                          {index + 1}
                        </div>
                        <div className="mt-3 text-sm font-bold">{step}</div>
                        <div className={cx('mt-1 text-xs font-medium', dark ? 'text-slate-400' : 'text-slate-500')}>Reusable stage state</div>
                      </div>
                    ))}
                  </div>
                </Card>
              </Section>

              <Section id="states" title="States" eyebrow="Feedback">
                <div className="grid gap-4 xl:grid-cols-3">
                  <StateCard dark={dark} icon={CheckCircle2} title="Success" tone="text-[#16a34a]" body="Action completed and audit trail saved." />
                  <StateCard dark={dark} icon={AlertTriangle} title="Warning" tone="text-[#d97706]" body="SLA is close to breach and needs review." />
                  <StateCard dark={dark} icon={ShieldCheck} title="Protected" tone="text-[#2447d8]" body="Permission and role checks are visible." />
                </div>
              </Section>

              <Section id="rules" title="Usage Rules" eyebrow="Guidance">
                <Card dark={dark}>
                  <div className="grid gap-3 md:grid-cols-2">
                    {[
                      'Use sidebar + sticky header for operational pages.',
                      'Use text-sm body, text-xs labels, and bold only for emphasis.',
                      'Use semantic color for status, not decoration.',
                      'Keep chart panels compact and decision-oriented.',
                    ].map(rule => (
                      <div key={rule} className={cx('flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium', dark ? 'border-slate-800 bg-slate-900 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-600')}>
                        <CheckCircle2 className="h-4 w-4 text-[#16a34a]" />
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </Section>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function Section({ id, eyebrow, title, children }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-4">
        <div className="text-[11px] font-extrabold uppercase tracking-[.14em] text-[#2447d8]">{eyebrow}</div>
        <h2 className="mt-1 text-xl font-extrabold tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function Card({ dark, className = '', children }) {
  return (
    <div className={cx('rounded-2xl border p-5 shadow-sm', dark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white', className)}>
      {children}
    </div>
  )
}

function Pill({ icon: Icon, label }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-sm">
      <Icon className="h-4 w-4 text-[#2447d8]" />
      {label}
    </div>
  )
}

function Metric({ label, value, hint, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">{label}</div>
      <div className={cx('mt-2 font-mono text-3xl font-black', color)}>{value}</div>
      <div className="mt-2 text-xs font-medium text-slate-500">{hint}</div>
    </div>
  )
}

function PanelTitle({ icon: Icon, title, desc, dark }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-sm font-bold">{title}</div>
        <div className={cx('mt-1 text-xs font-medium leading-5', dark ? 'text-slate-400' : 'text-slate-500')}>{desc}</div>
      </div>
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#2447d8]">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  )
}

function Progress({ label, value, text, color, dark }) {
  return (
    <div>
      <div className={cx('mb-1 flex justify-between text-xs font-bold', dark ? 'text-slate-400' : 'text-slate-500')}>
        <span>{label}</span>
        <span>{text}</span>
      </div>
      <div className={cx('h-2 overflow-hidden rounded-full', dark ? 'bg-slate-800' : 'bg-slate-100')}>
        <div className={cx('h-full rounded-full', value, color)} />
      </div>
    </div>
  )
}

function LinePreview() {
  return (
    <svg viewBox="0 0 560 240" className="mt-5 h-[260px] w-full">
      {[40, 90, 140, 190].map(y => <line key={y} x1="10" x2="550" y1={y} y2={y} className="stroke-slate-200" />)}
      <path d="M 12 188 L 90 150 L 168 166 L 246 112 L 324 126 L 402 76 L 480 92 L 548 48" className="fill-none stroke-[#2447d8] stroke-[4]" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 12 210 L 90 170 L 168 178 L 246 150 L 324 142 L 402 112 L 480 120 L 548 90" className="fill-none stroke-[#16a34a] stroke-[3]" strokeLinecap="round" strokeLinejoin="round" />
      {[12, 90, 168, 246, 324, 402, 480, 548].map((x, i) => <circle key={x} cx={x} cy={[188, 150, 166, 112, 126, 76, 92, 48][i]} r="4" className="fill-white stroke-[#2447d8] stroke-[3]" />)}
    </svg>
  )
}

function GaugePreview() {
  return (
    <div className="mt-8 grid place-items-center">
      <svg viewBox="0 0 160 90" className="h-[120px] w-full max-w-[230px] text-slate-950">
        <path d="M 10 80 A 70 70 0 0 1 150 80" className="fill-none stroke-slate-200 stroke-[14]" strokeLinecap="round" />
        <path d="M 10 80 A 70 70 0 0 1 150 80" className="fill-none stroke-[#16a34a] stroke-[14]" strokeLinecap="round" strokeDasharray="220" strokeDashoffset="38" />
        <line x1="80" y1="80" x2="80" y2="22" className="stroke-slate-950 stroke-[3]" strokeLinecap="round" transform="rotate(42 80 80)" />
        <circle cx="80" cy="80" r="5" className="fill-slate-950" />
      </svg>
      <div className="font-mono text-3xl font-black text-[#16a34a]">83%</div>
      <div className="text-xs font-bold text-slate-500">Target readiness</div>
    </div>
  )
}

function BarPreview() {
  return (
    <div className="mt-5 flex h-[220px] items-end gap-3">
      {BARS.map(([label, height, color]) => (
        <div key={label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
          <div className={cx('w-full rounded-t-lg', height, color)} />
          <div className="w-full truncate text-center text-[10px] font-medium text-slate-500">{label}</div>
        </div>
      ))}
    </div>
  )
}

function DonutPreview() {
  return (
    <div className="mt-6 flex items-center gap-5">
      <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
        <circle cx="60" cy="60" r="42" className="fill-none stroke-slate-200 stroke-[18]" />
        <circle cx="60" cy="60" r="42" className="fill-none stroke-[#2447d8] stroke-[18]" strokeDasharray="112 264" />
        <circle cx="60" cy="60" r="42" className="fill-none stroke-[#16a34a] stroke-[18]" strokeDasharray="78 264" strokeDashoffset="-112" />
        <circle cx="60" cy="60" r="42" className="fill-none stroke-[#d97706] stroke-[18]" strokeDasharray="48 264" strokeDashoffset="-190" />
      </svg>
      <div className="space-y-2 text-xs">
        <Legend color="bg-[#2447d8]" label="Ready" value="42%" />
        <Legend color="bg-[#16a34a]" label="Active" value="30%" />
        <Legend color="bg-[#d97706]" label="Pending" value="18%" />
      </div>
    </div>
  )
}

function TimelinePreview({ dark }) {
  return (
    <div className="mt-6 space-y-3">
      {[
        ['SSV', 'w-[40%]', 'ml-[8%]', 'bg-[#2447d8]'],
        ['PAC', 'w-[34%]', 'ml-[28%]', 'bg-[#16a34a]'],
        ['Report', 'w-[28%]', 'ml-[55%]', 'bg-[#d97706]'],
      ].map(([label, width, margin, color]) => (
        <div key={label} className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-3">
          <div className="truncate text-xs font-bold">{label}</div>
          <div className={cx('h-4 rounded-full', dark ? 'bg-slate-800' : 'bg-slate-100')}>
            <div className={cx('h-full rounded-full', width, margin, color)} />
          </div>
        </div>
      ))}
    </div>
  )
}

function Legend({ color, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cx('h-2 w-2 rounded-full', color)} />
      <span className="min-w-[58px] text-slate-500">{label}</span>
      <span className="font-mono font-bold">{value}</span>
    </div>
  )
}

function MapMarker({ className, color, label }) {
  return (
    <div className={cx('absolute', className)}>
      <div className={cx('h-4 w-4 rounded-full ring-4 ring-white/80', color)} />
      <div className="mt-2 rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-slate-600 shadow-sm">{label}</div>
    </div>
  )
}

function Layer({ label, count, color }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600">
      <span className={cx('h-3 w-3 rounded-full', color)} />
      <span className="flex-1">{label}</span>
      <span className="font-mono text-xs text-slate-400">{count}</span>
      <ChevronRight className="h-4 w-4 text-slate-300" />
    </div>
  )
}

function StateCard({ dark, icon: Icon, title, tone, body }) {
  return (
    <Card dark={dark}>
      <Icon className={cx('h-8 w-8', tone)} />
      <div className="mt-4 text-sm font-bold">{title}</div>
      <div className={cx('mt-2 text-xs font-medium leading-5', dark ? 'text-slate-400' : 'text-slate-500')}>{body}</div>
    </Card>
  )
}
