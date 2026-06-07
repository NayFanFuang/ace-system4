// ACE UI Kit - production showcase for the shared design system.
// Route: /ui-kit
import React, { useMemo, useState } from 'react'
import {
  Activity, AlertTriangle, Bell, BriefcaseBusiness, CalendarDays, Check,
  ChevronDown, CircleCheck, CircleX, ClipboardCheck, Clock, Command, Download, Eye,
  FileText, Filter, Gauge as GaugeIcon, GitBranch, Inbox, Layers, LayoutDashboard, LayoutGrid,
  LogOut, MapPin, Menu, Moon, RefreshCw, Search, Settings, ShieldCheck, SlidersHorizontal, Sun,
  TriangleAlert, UserCheck, Users, Wallet, X,
} from 'lucide-react'
import {
  Alert, Avatar, Badge, BarChart, Button, Card, Checkbox, CommandPalette,
  Donut, Drawer, EmptyState, Field, Gauge, Input, LineChart, MapView, Modal, Progress,
  Radio, Select, Sidebar, SidebarBrand, SidebarSection, Skeleton, Sparkline,
  Spinner, StatCard, StatusBadge, Switch, Table, Tabs, Timeline, Tooltip, CodeBlock,
  toast, useDarkMode,
} from './ui/index.jsx'

const TOKENS = [
  { name: 'Brand', value: '#2447d8', usage: 'Primary action, active state, links' },
  { name: 'Brand hover', value: '#1d3bb8', usage: 'Primary hover state' },
  { name: 'Accent', value: '#c73b32', usage: 'ACE accent, not error' },
  { name: 'Success', value: '#16a34a', usage: 'Ready, active, approved' },
  { name: 'Warning', value: '#d97706', usage: 'Pending, probation, attention' },
  { name: 'Error', value: '#dc2626', usage: 'Blocked, failed, destructive' },
  { name: 'Ink', value: '#0f172a', usage: 'Primary text' },
  { name: 'Surface', value: '#f5f7fb', usage: 'Application background' },
]

const NAV = [
  ['overview', 'Overview'],
  ['infographic', 'Infographic'],
  ['tokens', 'Design Tokens'],
  ['patterns', 'Production Patterns'],
  ['components', 'Components'],
  ['templates', 'Page Templates'],
  ['presite', 'Pre-Site Workflow'],
  ['maps', 'Map Gallery'],
  ['analytics', 'Analytics'],
  ['charts', 'Chart Gallery'],
  ['data', 'Data Display'],
  ['states', 'States'],
  ['overlays', 'Overlays'],
  ['guidance', 'Guidance'],
]

const STATUS_ROWS = [
  ['ACE056', 'Peerapol Piamsri', 'HWT2304', '07:48', <StatusBadge status="On Site" />],
  ['ACE112', 'Somchai Wong', 'HWT2604', '08:02', <StatusBadge status="Office" />],
  ['ACE201', 'Niran Chaisri', 'HWT2304', '08:15', <StatusBadge status="Off Site" />],
  ['ACE318', 'Achara Suk', 'HWT2604', '-', <StatusBadge status="Pending" />],
]

function cx(...items) {
  return items.filter(Boolean).join(' ')
}

function jumpTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function Shell({ children }) {
  return (
    <div className="ace-ui-kit-scale min-h-screen bg-[#f5f7fb] text-slate-950">
      {children}
    </div>
  )
}

function UiKitSidebar({ activeId, mobileOpen, onMobileClose, onJump }) {
  return (
    <aside className={`${mobileOpen ? 'fixed inset-y-0 left-0 z-40 flex' : 'hidden'} w-72 flex-col border-r border-slate-200 bg-white/95 p-5 shadow-2xl backdrop-blur lg:sticky lg:top-0 lg:flex lg:h-screen lg:shadow-none lg:overflow-y-auto`}>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #2447d8, #c73b32)' }}>
          <Command size={24} />
        </div>
        <div className="min-w-0">
          <div className="text-base font-extrabold text-slate-950">ACE UI Suite</div>
          <div className="text-xs font-bold text-slate-400">Design System Library</div>
        </div>
        <button
          onClick={onMobileClose}
          className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 lg:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="mt-9 space-y-1.5">
        {NAV.map(([id, label]) => {
          const active = id === activeId
          const Icon = {
            overview: LayoutDashboard,
            infographic: Layers,
            tokens: SlidersHorizontal,
            patterns: ClipboardCheck,
            components: Settings,
            templates: BriefcaseBusiness,
            presite: GitBranch,
            maps: MapPin,
            analytics: Activity,
            charts: GaugeIcon,
            data: FileText,
            states: AlertTriangle,
            overlays: Command,
            guidance: ShieldCheck,
          }[id] || LayoutDashboard
          return (
            <button
              key={id}
              type="button"
              onClick={() => { onJump?.(id); onMobileClose?.() }}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-sm font-bold transition ${active ? 'bg-blue-50 text-[#2447d8] shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          )
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <SparklesIcon />
          UI Kit Workspace
        </div>
        <p className="mt-2 text-xs font-medium leading-5 text-slate-500">
          Tokens · Components · Patterns · Page examples for ACE System 4.
        </p>
      </div>
    </aside>
  )
}

function SparklesIcon() {
  return <Layers size={18} style={{ color: '#2447d8' }} />
}

function UiKitTopHeader({ isDark, toggle, onCommand, onMenu }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/86 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          title="Open menu"
          aria-label="Open menu"
          onClick={onMenu}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-[#2447d8] hover:shadow-md active:translate-y-0 lg:hidden"
        >
          <Menu size={19} />
        </button>
        <div className="hidden min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-400 md:flex">
          <Search size={18} />
          <button onClick={onCommand} className="w-full border-0 bg-transparent text-left text-sm font-medium text-slate-500 outline-none">
            Search components, patterns, charts...
          </button>
          <span className="ds-kbd">Ctrl K</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            title="Refresh"
            aria-label="Refresh"
            onClick={() => toast('UI Kit refreshed', 'ok')}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-[#2447d8] hover:shadow-md active:translate-y-0"
          >
            <RefreshCw size={18} />
          </button>
          <button
            type="button"
            title="Theme"
            aria-label="Toggle theme"
            onClick={toggle}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-[#2447d8] hover:shadow-md active:translate-y-0"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:bg-slate-50 sm:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-black text-white" style={{ background: '#2447d8' }}>
              UI
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-slate-900">UI Admin</div>
              <div className="text-xs font-bold text-slate-400">Design System</div>
            </div>
            <ChevronDown size={16} className="text-slate-400" />
          </button>
          <button
            type="button"
            title="Logout"
            aria-label="Logout"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-[#2447d8] hover:shadow-md active:translate-y-0"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}

function Section({ id, eyebrow, title, desc, children }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-4 flex flex-col gap-1">
        {eyebrow && <div className="text-[11px] font-extrabold uppercase tracking-[.14em] text-[#2447d8]">{eyebrow}</div>}
        <h2 className="text-xl font-extrabold tracking-normal text-slate-950">{title}</h2>
        {desc && <p className="max-w-3xl text-sm font-medium leading-6 text-slate-500 ds-muted-text">{desc}</p>}
      </div>
      {children}
    </section>
  )
}

function PreviewCard({ title, desc, icon: Icon, children, className, code }) {
  return (
    <Card className={cx('overflow-hidden', className)}>
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div>
          <div className="text-sm font-bold text-slate-950">{title}</div>
          {desc && <div className="mt-1 text-xs font-medium leading-5 text-slate-500 ds-muted-text">{desc}</div>}
        </div>
        {Icon && (
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#eef2ff] text-[#2447d8]">
            <Icon size={19} />
          </div>
        )}
      </div>
      <div className="p-5">
        {children}
        {code && <CodeBlock code={code} />}
      </div>
    </Card>
  )
}

function Hero({ onCommand }) {
  return (
    <section id="overview" className="scroll-mt-24">
      <div className="overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-0 xl:grid-cols-[1fr_420px]">
          <div className="p-6 lg:p-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-[#2447d8]">
              <Layers size={14} />
              Shared product language for ACE System 4
            </div>
            <h1 className="max-w-3xl text-3xl font-black tracking-normal text-slate-950 sm:text-4xl">
              Professional operations UI for HR, Clock, Project, KPI, and Finance workflows.
            </h1>
            <p className="mt-4 max-w-3xl text-sm font-medium leading-6 text-slate-500 ds-muted-text">
              This page is the source of truth for components, visual tokens, production patterns, and page templates. Use it to keep every screen consistent without changing business logic.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button variant="primary" icon={Eye} onClick={() => jumpTo('patterns')}>View patterns</Button>
              <Button variant="ghost" icon={Command} onClick={onCommand}>Open command</Button>
              <Button variant="soft" icon={Download} onClick={() => toast('Copy package guide from /design-mocks/UI_KIT_ALL_PAGES_PROMPT.md', 'info')}>Usage prompt</Button>
            </div>
          </div>
          <div className="border-t border-slate-200 bg-slate-50 p-5 xl:border-l xl:border-t-0">
            <Card className="overflow-hidden">
              <div className="ds-hero px-5 py-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold">Operational Preview</div>
                    <div className="text-[11px] font-bold uppercase tracking-[.12em] text-white/70">Live control panel</div>
                  </div>
                  <Badge tone="green" dot>Online</Badge>
                </div>
              </div>
              <div className="grid gap-3 p-4">
                <div className="grid grid-cols-3 gap-2">
                  <MiniMetric label="Clocked" value="142" color="#2447d8" />
                  <MiniMetric label="On site" value="83%" color="#16a34a" />
                  <MiniMetric label="Issues" value="7" color="#d97706" />
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <LineChart height={112}
                    labels={['06', '07', '08', '09', '10', '11', '12']}
                    series={[
                      { name: 'Today', data: [4, 28, 86, 142, 151, 155, 158], color: '#2447d8', fill: true },
                      { name: 'Target', data: [3, 22, 75, 132, 145, 148, 150], color: '#c73b32', dashed: true },
                    ]}
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}

function MiniMetric({ label, value, color }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="text-[11px] font-extrabold uppercase text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-black" style={{ color }}>{value}</div>
    </div>
  )
}

function UiKitInfographic() {
  const pillars = [
    { title: 'Brand Tokens', note: 'Color, surface, text, border, elevation', color: '#2447d8', icon: Layers },
    { title: 'Core Components', note: 'Buttons, fields, cards, badges, tables', color: '#16a34a', icon: LayoutDashboard },
    { title: 'Page Patterns', note: 'Header, toolbar, metrics, matrix, drawer', color: '#d97706', icon: ClipboardCheck },
    { title: 'Domain Examples', note: 'HR, Clock, Finance, Pre-Site, Analytics', color: '#c73b32', icon: BriefcaseBusiness },
  ]
  const rules = [
    ['One Shell', 'Use PlatformShell for authenticated pages'],
    ['One Primary', 'Keep one main action per workflow'],
    ['Semantic Status', 'Green, amber, red, blue, slate mean the same everywhere'],
    ['Dense & Clear', 'Operational pages optimize scanning and repeated use'],
  ]

  return (
    <Card className="overflow-hidden">
      <div className="grid gap-0 xl:grid-cols-[360px_1fr]">
        <div className="ds-hero p-6 text-white lg:p-7">
          <div className="text-[11px] font-extrabold uppercase tracking-[.16em] text-white/70">Design System Map</div>
          <div className="mt-3 text-3xl font-black leading-tight tracking-normal">ACE UI Kit Infographic</div>
          <p className="mt-4 text-sm font-medium leading-6 text-white/78">
            A one-screen summary of how the UI kit turns brand rules into reusable operations screens.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <InfoStat label="Tokens" value="8" />
            <InfoStat label="Patterns" value="12+" />
            <InfoStat label="Domains" value="5" />
            <InfoStat label="Shell" value="1" />
          </div>
        </div>

        <div className="bg-slate-50 p-5 lg:p-6">
          <div className="grid gap-4 xl:grid-cols-4">
            {pillars.map((pillar, index) => {
              const Icon = pillar.icon
              return (
                <div key={pillar.title} className="relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="grid h-11 w-11 place-items-center rounded-lg text-white" style={{ background: pillar.color }}>
                      <Icon size={20} />
                    </div>
                    <span className="ds-mono text-xs font-black text-slate-300">0{index + 1}</span>
                  </div>
                  <div className="text-sm font-bold text-slate-950">{pillar.title}</div>
                  <div className="mt-2 min-h-[44px] text-xs font-medium leading-5 text-slate-500">{pillar.note}</div>
                  {index < pillars.length - 1 && (
                    <div className="absolute -right-3 top-1/2 hidden h-px w-6 bg-slate-300 xl:block" />
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_340px]">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 text-xs font-extrabold uppercase tracking-[.1em] text-slate-400">Infographic Flow</div>
              <div className="grid gap-3 md:grid-cols-4">
                <FlowNode label="Token" value="#2447d8" color="#2447d8" />
                <FlowNode label="Component" value="Button" color="#16a34a" />
                <FlowNode label="Pattern" value="Toolbar" color="#d97706" />
                <FlowNode label="Page" value="Pre-Site" color="#c73b32" />
              </div>
              <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs font-bold leading-5 text-slate-500">
                Tokens define meaning, components make it reusable, patterns compose workflows, and pages stay consistent across ACE System 4.
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 text-xs font-extrabold uppercase tracking-[.1em] text-slate-400">Design Rules</div>
              <div className="grid gap-2">
                {rules.map(([title, desc]) => (
                  <div key={title} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                    <div className="text-xs font-bold text-slate-900">{title}</div>
                    <div className="mt-1 text-[11px] font-medium leading-4 text-slate-500">{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

function InfoStat({ label, value }) {
  return (
    <div className="rounded-lg border border-white/20 bg-white/12 p-3">
      <div className="text-[10px] font-black uppercase tracking-[.1em] text-white/60">{label}</div>
      <div className="mt-1 text-2xl font-black">{value}</div>
    </div>
  )
}

function FlowNode({ label, value, color }) {
  return (
    <div className="relative rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-2 h-1 rounded-full" style={{ background: color }} />
      <div className="text-[10px] font-extrabold uppercase tracking-[.1em] text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-bold text-slate-900">{value}</div>
    </div>
  )
}

function TokenGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {TOKENS.map(token => (
        <Card key={token.name} className="p-4">
          <div className="mb-3 h-12 rounded-lg border border-slate-200" style={{ background: token.value }} />
          <div className="flex items-center justify-between gap-3">
            <div className="font-bold text-slate-950">{token.name}</div>
            <span className="ds-mono rounded bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-500">{token.value}</span>
          </div>
          <div className="mt-2 text-xs font-medium leading-5 text-slate-500 ds-muted-text">{token.usage}</div>
        </Card>
      ))}
    </div>
  )
}

function ProductionPatterns() {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <PreviewCard title="Page Header" desc="Title, context, and primary actions in one predictable row." icon={LayoutDashboard} className="xl:col-span-2">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black text-[#2447d8]">
              <BriefcaseBusiness size={13} />
              Project Operations
            </div>
            <div className="text-2xl font-extrabold tracking-normal text-slate-950">RF Project Monitor</div>
            <div className="mt-1 max-w-xl text-sm font-medium text-slate-500 ds-muted-text">Track site readiness, team progress, exceptions, and export-ready status in one workspace.</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" icon={Filter}>Filter</Button>
            <Button variant="primary" icon={Download}>Export</Button>
          </div>
        </div>
      </PreviewCard>
      <PreviewCard title="Status Language" desc="Use semantic colors consistently across every workflow." icon={ShieldCheck}>
        <div className="grid gap-2">
          <StatusBadge status="Approved" />
          <StatusBadge status="Pending" />
          <StatusBadge status="Off Site" />
          <StatusBadge status="Draft" />
        </div>
      </PreviewCard>
      <PreviewCard title="Toolbar Pattern" desc="Search, filters, segmented view, and actions." icon={SlidersHorizontal} className="xl:col-span-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
          <Field label="Search" icon={Search}><Input placeholder="Employee, code, site, project..." /></Field>
          <Field label="Department"><Select><option>All departments</option><option>HR</option><option>Project</option><option>Finance</option></Select></Field>
          <Field label="Status"><Select><option>All status</option><option>Active</option><option>Pending</option><option>Blocked</option></Select></Field>
          <div className="flex gap-2 xl:ml-auto">
            <Button variant="ghost" icon={Filter}>Advanced</Button>
            <Button variant="primary" icon={UserCheck}>Apply</Button>
          </div>
        </div>
      </PreviewCard>
    </div>
  )
}

function ComponentsGallery({ tab, setTab, sw, setSw, ck, setCk, rd, setRd }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <PreviewCard title="Buttons" desc="Clear command hierarchy. Use primary for one main action." icon={Check}
        code={`<Button variant="primary" icon={Download}>Export</Button>
<Button variant="ghost" icon={Filter}>Filter</Button>
<Button variant="success" icon={CircleCheck}>Approve</Button>
<Button variant="danger" icon={X}>Reject</Button>
<Button variant="primary" loading>Saving</Button>`}>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" icon={Download}>Export</Button>
          <Button variant="ghost" icon={Filter}>Filter</Button>
          <Button variant="soft" icon={Bell}>Notify</Button>
          <Button variant="success" icon={CircleCheck}>Approve</Button>
          <Button variant="danger" icon={X}>Reject</Button>
          <Button variant="primary" loading>Saving</Button>
        </div>
      </PreviewCard>
      <PreviewCard title="Inputs" desc="Compact, predictable controls for dense operational screens." icon={Settings}
        code={`<Field label="Search" icon={Search}><Input placeholder="ACE056..." /></Field>
<Field label="Clock type"><Select><option>Per-site</option></Select></Field>
<Switch checked={v} onChange={fn} label="GPS required" />
<Checkbox checked={v} onChange={fn} label="Photo" />
<Radio name="mode" checked={v} onChange={fn} label="Site" />`}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Search employee" icon={Search}><Input placeholder="ACE056..." /></Field>
          <Field label="Clock type"><Select><option>Per-site</option><option>Daily</option><option>Office</option></Select></Field>
          <Switch checked={sw} onChange={() => setSw(!sw)} label="GPS required" />
          <div className="flex flex-wrap gap-3">
            <Checkbox checked={ck} onChange={() => setCk(!ck)} label="Photo" />
            <Radio name="clock-mode" checked={rd === 'site'} onChange={() => setRd('site')} label="Site" />
            <Radio name="clock-mode" checked={rd === 'daily'} onChange={() => setRd('daily')} label="Daily" />
          </div>
        </div>
      </PreviewCard>
      <PreviewCard title="Tabs" desc="Use for views in the same workflow, not global navigation." icon={Layers}
        code={`<Tabs value={tab} onChange={setTab} items={[
  { value: 'daily', label: 'Daily' },
  { value: 'leave', label: 'Leave', badge: 5 },
]} />`}>
        <Tabs value={tab} onChange={setTab} items={[
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'leave', label: 'Leave', badge: 5 },
          { value: 'audit', label: 'Audit' },
        ]} />
      </PreviewCard>
      <PreviewCard title="Alerts" desc="Use short, actionable messages tied to the current workflow." icon={AlertTriangle}
        code={`<Alert tone="info" icon={Info}>Data refreshes every 30s.</Alert>
<Alert tone="success" icon={CircleCheck}>Profile saved.</Alert>
<Alert tone="warn" icon={TriangleAlert}>Missing documents.</Alert>
<Alert tone="error" icon={CircleX}>Import failed.</Alert>`}>
        <div className="grid gap-2">
          <Alert tone="info" icon={Activity}>Data refreshes every 30 seconds.</Alert>
          <Alert tone="success" icon={CircleCheck}>Employee profile saved.</Alert>
          <Alert tone="warn" icon={TriangleAlert}>3 employees have missing documents.</Alert>
          <Alert tone="error" icon={CircleX}>PO import failed. Check the template columns.</Alert>
        </div>
      </PreviewCard>
    </div>
  )
}

function PageTemplates({ onOpenDrawer }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <PreviewCard title="HR Employee Register" desc="A compact register layout with KPIs, filters, table, and detail drawer." icon={Users}>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Total" value={214} hint="All profiles" accent="#2447d8" />
            <StatCard label="Active" value={188} hint="87.8%" accent="#16a34a" />
            <StatCard label="Probation" value={12} hint="Review" accent="#d97706" />
            <StatCard label="Missing" value={9} hint="Needs action" hintTone="down" accent="#dc2626" />
          </div>
          <Table head={['Code', 'Name', 'Team', 'Status']} rows={[
            ['ACE056', <b>Peerapol Piamsri</b>, 'RF', <StatusBadge status="Active" />],
            ['ACE112', <b>Somchai Wong</b>, 'TE', <StatusBadge status="Pending" />],
            ['ACE201', <b>Niran Chaisri</b>, 'RF', <StatusBadge status="Draft" />],
          ]} />
          <Button variant="primary" icon={Eye} onClick={onOpenDrawer}>Open detail drawer</Button>
        </div>
      </PreviewCard>
      <PreviewCard title="Finance Review Board" desc="A review screen for income, expense, variance, and approval state." icon={Wallet}>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <MiniMetric label="Revenue" value="4.82M" color="#2447d8" />
            <MiniMetric label="Expense" value="3.41M" color="#c73b32" />
            <MiniMetric label="Margin" value="29%" color="#16a34a" />
            <MiniMetric label="Pending" value="11" color="#d97706" />
          </div>
          <BarChart height={185} data={[
            { label: 'RF', value: 92 },
            { label: 'TE', value: 78 },
            { label: 'Solar', value: 61 },
            { label: 'Enterprise', value: 84 },
          ]} />
        </div>
      </PreviewCard>
      <PreviewCard title="Clock Monitor Timeline" desc="Operational timeline for attendance and field movement." icon={Clock} className="xl:col-span-2">
        <Timeline start={6} end={18} step={2} rows={[
          { label: 'ACE056', segments: [{ from: 7.8, to: 12.2, color: '#16a34a', label: 'On site' }, { from: 13, to: 17.5, color: '#16a34a', label: 'On site' }] },
          { label: 'ACE112', segments: [{ from: 8.03, to: 12, color: '#2447d8', label: 'Office' }, { from: 13, to: 17, color: '#2447d8', label: 'Office' }] },
          { label: 'ACE201', segments: [{ from: 8.25, to: 11.5, color: '#dc2626', label: 'Off site' }] },
          { label: 'ACE418', segments: [{ from: 7.5, to: 16.7, color: '#16a34a', label: 'On site' }] },
        ]} />
      </PreviewCard>
    </div>
  )
}

const PRESITE_STAGES = [
  { label: 'Full On-Air', date: '31 May', tone: '#64748b', state: 'done' },
  { label: 'DT Started', date: '01 Jun 08:12', tone: '#d97706', state: 'done' },
  { label: 'DT Done', date: '01 Jun 11:44', tone: '#2447d8', state: 'done' },
  { label: 'Report Done', date: '02 Jun', tone: '#2447d8', state: 'current' },
  { label: 'Check Pass', date: 'pending', tone: '#16a34a', state: 'pending' },
]

const PRESITE_ROWS = [
  {
    site: 'BKK-RF-014',
    po: 'PO-2304 L12',
    dte: 'Peerapol P.',
    plan: '2026-06-01',
    rounds: ['pass', 'pass', 'progress'],
    stage: 'Report Done',
    sla: '2d / 3d',
    risk: 'green',
  },
  {
    site: 'BKK-RF-022',
    po: 'PO-2304 L18',
    dte: 'Niran C.',
    plan: '2026-06-01',
    rounds: ['pass', 'fail', 'planned'],
    stage: 'Rework',
    sla: '4d / 3d',
    risk: 'red',
  },
  {
    site: 'CNX-RF-002',
    po: 'PO-2604 L03',
    dte: 'Somchai W.',
    plan: '2026-06-02',
    rounds: ['planned', 'planned', 'planned', 'planned', 'planned', 'planned'],
    stage: 'DT Plan',
    sla: '1d / 3d',
    risk: 'amber',
  },
]

function PreSiteWorkflowPatterns({ onOpenDrawer }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <PreviewCard title="Stage Pipeline" desc="SSV/PAC workflow stages with done, current, pending, and failed states." icon={GitBranchIcon}>
          <PreSiteStagePipeline stages={PRESITE_STAGES} />
        </PreviewCard>
        <PreviewCard title="SLA / Aging Indicators" desc="Compact indicators for 3-day SLA, aging, breach, and rework pressure." icon={Clock}>
          <div className="grid gap-3 sm:grid-cols-3">
            <SlaTile label="Healthy" value="2d / 3d" tone="green" desc="Within target" />
            <SlaTile label="At Risk" value="3d / 3d" tone="amber" desc="Due today" />
            <SlaTile label="Breach" value="5d / 3d" tone="red" desc="Escalate" />
          </div>
        </PreviewCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <PreviewCard title="Round Badges" desc="PAC/SSV round state language: pass, fail, in progress, planned, and overflow." icon={ClipboardCheck}>
          <div className="grid gap-4">
            <RoundBadgeSet label="SSV rounds" rounds={['pass', 'pass', 'progress']} />
            <RoundBadgeSet label="PAC rounds" rounds={['pass', 'fail', 'planned', 'planned', 'planned', 'planned', 'planned']} />
            <RoundBadgeSet label="No rounds" rounds={[]} />
          </div>
        </PreviewCard>

        <PreviewCard title="Action Gate" desc="Actions change by stage and permission. Keep primary approval obvious." icon={ShieldCheck}>
          <div className="grid gap-3">
            <ActionGate current="Report Done" actions={[
              ['Check Pass', '#16a34a', true],
              ['Check Fail', '#dc2626', true],
              ['Report Done', '#2447d8', false],
            ]} />
            <ActionGate current="DT Started" actions={[
              ['End DT', '#2447d8', true],
              ['Report Done', '#2447d8', false],
              ['Check Pass', '#16a34a', false],
            ]} />
          </div>
        </PreviewCard>

        <PreviewCard title="Map Layer Legend" desc="Pre-Site map needs layer toggles, marker language, and coverage context." icon={MapPin}>
          <div className="grid gap-3">
            <MapLayerRow label="DTE home base" count={18} color="#2447d8" shape="circle" checked />
            <MapLayerRow label="SSV unplanned" count={42} color="#d97706" shape="square" checked />
            <MapLayerRow label="PAC unplanned" count={21} color="#7c3aed" shape="square" checked />
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs font-bold leading-5 text-slate-500">
              Include radius rings, layer toggles, selected engineer filter, and a visible legend before the map.
            </div>
          </div>
        </PreviewCard>
      </div>

      <PreviewCard title="Workflow Matrix" desc="Dense Pre-Site tables need stage columns, plan dates, rounds, SLA, rework, and row-level drill-in." icon={LayoutGrid}>
        <div className="overflow-x-auto ds-scroll">
          <table className="ds-table min-w-[980px]">
            <thead>
              <tr>
                {['Site', 'PO', 'DTE', 'DT Plan', 'Rounds', 'Stage', 'SLA', 'Rework', ''].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {PRESITE_ROWS.map(row => (
                <tr key={row.site}>
                  <td><span className="font-black text-[#2447d8]">{row.site}</span></td>
                  <td><span className="ds-mono text-xs font-bold text-slate-500">{row.po}</span></td>
                  <td><span className="font-bold">{row.dte}</span></td>
                  <td><PlanDate date={row.plan} duration="2d" /></td>
                  <td><RoundBadges rounds={row.rounds} /></td>
                  <td><StagePill label={row.stage} /></td>
                  <td><SlaInline value={row.sla} tone={row.risk} /></td>
                  <td>{row.risk === 'red' ? <Badge tone="red">x1</Badge> : <span className="text-slate-300">-</span>}</td>
                  <td><Button variant="ghost" icon={Eye} onClick={onOpenDrawer} aria-label={`Open ${row.site}`} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PreviewCard>

      <PreviewCard title="Site Detail Pattern" desc="Detail drawers should combine stage history, round evidence, billing reference, actions, and audit log." icon={FileText}>
        <div className="grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
          <div className="grid gap-3">
            <MiniMetric label="Site" value="BKK-RF-014" color="#2447d8" />
            <MiniMetric label="SLA" value="2d / 3d" color="#16a34a" />
            <MiniMetric label="Billing" value="Ready" color="#d97706" />
          </div>
          <div className="grid gap-3">
            <PreSiteStagePipeline compact stages={PRESITE_STAGES} />
            <RoundBadgeSet label="Round evidence" rounds={['pass', 'pass', 'progress']} />
            <div className="flex flex-wrap gap-2">
              <Button variant="success" icon={Check}>Check Pass</Button>
              <Button variant="danger" icon={X}>Check Fail</Button>
              <Button variant="ghost" icon={HistoryIcon}>Audit log</Button>
            </div>
          </div>
        </div>
      </PreviewCard>
    </div>
  )
}

function GitBranchIcon(props) {
  return <GitBranch {...props} />
}

function HistoryIcon(props) {
  return <Clock {...props} />
}

function PreSiteStagePipeline({ stages, compact = false }) {
  return (
    <div className={cx('grid gap-2', compact ? '' : 'lg:grid-cols-5')}>
      {stages.map((stage, index) => (
        <div key={stage.label} className="relative rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full text-xs font-black text-white" style={{ background: stage.state === 'pending' ? '#cbd5e1' : stage.tone }}>
              {stage.state === 'pending' ? index + 1 : <Check size={14} />}
            </span>
            <div className="min-w-0">
              <div className="truncate text-xs font-bold text-slate-900">{stage.label}</div>
              <div className="text-[11px] font-bold text-slate-400">{stage.date}</div>
            </div>
          </div>
          {stage.state === 'current' && <div className="mt-2 h-1 rounded-full bg-[#2447d8]" />}
        </div>
      ))}
    </div>
  )
}

function SlaTile({ label, value, tone, desc }) {
  const color = { green: '#16a34a', amber: '#d97706', red: '#dc2626' }[tone]
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-[11px] font-extrabold uppercase text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-black ds-mono" style={{ color }}>{value}</div>
      <div className="mt-1 text-xs font-bold text-slate-500">{desc}</div>
    </div>
  )
}

function RoundBadgeSet({ label, rounds }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 text-xs font-extrabold uppercase text-slate-500">{label}</div>
      <RoundBadges rounds={rounds} />
    </div>
  )
}

function RoundBadges({ rounds }) {
  if (!rounds.length) return <span className="text-xs font-bold italic text-slate-300">no rounds planned</span>
  const visible = rounds.slice(0, 5)
  const extra = Math.max(0, rounds.length - visible.length)
  return (
    <div className="inline-flex items-center gap-1">
      {visible.map((state, i) => {
        const cfg = {
          pass: ['#16a34a', '#fff', 'P'],
          fail: ['#dc2626', '#fff', 'F'],
          progress: ['#d97706', '#fff', i + 1],
          planned: ['#e2e8f0', '#64748b', i + 1],
        }[state] || ['#e2e8f0', '#64748b', i + 1]
        return <span key={`${state}-${i}`} className="grid h-6 min-w-6 place-items-center rounded-md px-1.5 text-[11px] font-black" style={{ background: cfg[0], color: cfg[1] }}>{cfg[2]}</span>
      })}
      {extra > 0 && <span className="ml-1 text-xs font-black text-amber-600">+{extra}</span>}
    </div>
  )
}

function ActionGate({ current, actions }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-2 text-xs font-extrabold uppercase text-slate-500">Current: {current}</div>
      <div className="flex flex-wrap gap-2">
        {actions.map(([label, color, enabled]) => (
          <button
            key={label}
            disabled={!enabled}
            className="rounded-md border px-3 py-1.5 text-xs font-black"
            style={{ borderColor: enabled ? color : '#e2e8f0', color: enabled ? color : '#cbd5e1', background: enabled ? '#fff' : '#f8fafc' }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

function MapLayerRow({ label, count, color, shape, checked }) {
  return (
    <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600">
      <input type="checkbox" checked={checked} readOnly className="ds-check" />
      <span className={shape === 'circle' ? 'h-3 w-3 rounded-full' : 'h-3 w-3 rounded-sm'} style={{ background: color }} />
      <span className="flex-1">{label}</span>
      <span className="ds-mono text-xs text-slate-400">{count}</span>
    </label>
  )
}

const MAP_MARKERS = [
  { lat: 13.7825, lng: 100.545, name: 'BKK-RF-014 - Peerapol P.', status: 'on' },
  { lat: 13.7367, lng: 100.5231, name: 'BKK-RF-022 - Rework', status: 'off' },
  { lat: 13.7563, lng: 100.5018, name: 'ACE Head Office', status: 'office' },
  { lat: 13.7047, lng: 100.6061, name: 'BKK-PAC-07 - PAC round 2', status: 'on' },
  { lat: 13.8212, lng: 100.5584, name: 'BKK-SSV-31 - Pending route', status: 'off' },
]

function MapGallery() {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
        <PreviewCard title="Live Operations Map" desc="Operational map pattern for HR clocking, Pre-Site assignments, site health, and selected engineer context." icon={MapPin}>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <div className="text-sm font-bold text-slate-950">Bangkok Field View</div>
                <div className="text-xs font-bold text-slate-500">5 active markers · live route context · SLA overlay ready</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="green">On Site 2</Badge>
                <Badge tone="red">Off Site 2</Badge>
                <Badge tone="blue">Office 1</Badge>
              </div>
            </div>
            <MapView center={[13.7563, 100.5018]} zoom={11} markers={MAP_MARKERS} height={380} tileTone="gray" />
          </div>
        </PreviewCard>

        <div className="grid gap-4">
          <PreviewCard title="Map Layer Control" desc="Keep layers explicit so dense maps stay understandable." icon={Layers}>
            <div className="grid gap-3">
              <MapLayerRow label="Employee clock-in" count={128} color="#16a34a" shape="circle" checked />
              <MapLayerRow label="Off-radius alert" count={9} color="#dc2626" shape="circle" checked />
              <MapLayerRow label="Pre-Site backlog" count={42} color="#d97706" shape="square" checked />
              <MapLayerRow label="Office / depot" count={4} color="#2447d8" shape="circle" checked />
            </div>
          </PreviewCard>

          <PreviewCard title="Map KPI Stack" desc="A small decision panel should sit beside the map, not below the fold." icon={Activity}>
            <div className="grid gap-3">
              <MapKpi label="Coverage" value="94%" hint="within assigned radius" tone="#16a34a" />
              <MapKpi label="Route risk" value="9" hint="needs PM review" tone="#dc2626" />
              <MapKpi label="Open sites" value="63" hint="SSV/PAC today" tone="#2447d8" />
            </div>
          </PreviewCard>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
        <PreviewCard title="Site Risk Heatlist" desc="Map markers need a paired list for scanning, filtering, and drill-in actions." icon={AlertTriangle}>
          <div className="grid gap-2">
            {[
              ['BKK-RF-022', 'Off-radius · PAC fail round 2', 'Critical', '#dc2626'],
              ['BKK-SSV-31', 'Pending DT plan · due today', 'At risk', '#d97706'],
              ['BKK-PAC-07', 'On site · evidence uploading', 'Healthy', '#16a34a'],
              ['ACE-HQ', 'Office support team available', 'Support', '#2447d8'],
            ].map(([site, detail, state, color]) => (
              <div key={site} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg text-white" style={{ background: color }}><MapPin size={17} /></span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-slate-950">{site}</div>
                  <div className="truncate text-xs font-bold text-slate-500">{detail}</div>
                </div>
                <span className="text-xs font-bold" style={{ color }}>{state}</span>
              </div>
            ))}
          </div>
        </PreviewCard>

        <PreviewCard title="Map Usage Pattern" desc="Reusable structure for every page that needs a map: filter rail, map canvas, marker list, and selected detail drawer." icon={LayoutGrid}>
          <div className="grid gap-3 lg:grid-cols-4">
            {[
              ['1', 'Filter rail', 'Project, team, status, radius, date'],
              ['2', 'Map canvas', 'Markers, clusters, geofence rings, selected pin'],
              ['3', 'Insight side panel', 'KPI stack, layer toggles, heatlist'],
              ['4', 'Detail drawer', 'Site profile, evidence, route history, actions'],
            ].map(([step, title, desc]) => (
              <div key={step} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#2447d8] text-xs font-black text-white">{step}</div>
                <div className="mt-3 text-sm font-bold text-slate-950">{title}</div>
                <div className="mt-1 text-xs font-bold leading-5 text-slate-500">{desc}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-900">
            Use this map composition for HR employees, Pre-Site Monitor, project site tracking, and field-service dashboards so every geo workflow feels like the same ACE product.
          </div>
        </PreviewCard>
      </div>
    </div>
  )
}

function MapKpi({ label, value, hint, tone }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="text-[11px] font-extrabold uppercase text-slate-400">{label}</div>
      <div className="mt-1 ds-mono text-2xl font-black" style={{ color: tone }}>{value}</div>
      <div className="text-xs font-bold text-slate-500">{hint}</div>
    </div>
  )
}

function PlanDate({ date, duration }) {
  return (
    <div>
      <div className="text-xs font-black text-[#2447d8]">{date}</div>
      <div className="text-[11px] font-bold text-slate-400">{duration}</div>
    </div>
  )
}

function StagePill({ label }) {
  const tone = label === 'Rework' ? 'red' : label === 'DT Plan' ? 'amber' : 'blue'
  return <Badge tone={tone}>{label}</Badge>
}

function SlaInline({ value, tone }) {
  const color = { green: '#16a34a', amber: '#d97706', red: '#dc2626' }[tone] || '#64748b'
  return <span className="inline-flex items-center gap-1 text-xs font-black ds-mono" style={{ color }}>{tone === 'red' && <AlertTriangle size={13} />}{value}</span>
}

function AnalyticsWorkbench() {
  const insightRows = [
    { label: 'Clock compliance improved', value: '+6.8%', tone: 'green', detail: 'Compared with previous 7 days' },
    { label: 'Missing documents risk', value: '9', tone: 'amber', detail: 'Mostly subcontractor profiles' },
    { label: 'Off-radius clusters', value: '3', tone: 'red', detail: 'Requires PM review today' },
    { label: 'Revenue variance', value: '+1.42M', tone: 'blue', detail: 'RF and Enterprise above target' },
  ]
  const funnel = [
    ['Imported', 214, '#2447d8'],
    ['Validated', 198, '#0ea5e9'],
    ['Ready', 184, '#16a34a'],
    ['Blocked', 14, '#dc2626'],
  ]

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <PreviewCard title="Analytics Workbench" desc="A production-grade analytics composition for executive and operational pages." icon={Activity}>
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MiniMetric label="Headcount" value="214" color="#2447d8" />
              <MiniMetric label="Ready" value="86%" color="#16a34a" />
              <MiniMetric label="Blocked" value="14" color="#dc2626" />
              <MiniMetric label="Variance" value="+8.2%" color="#d97706" />
            </div>
            <LineChart height={230}
              labels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']}
              series={[
                { name: 'Readiness', data: [68, 72, 75, 78, 82, 85, 86, 88], color: '#2447d8', fill: true },
                { name: 'Compliance', data: [61, 66, 70, 76, 77, 82, 84, 86], color: '#16a34a' },
                { name: 'Exception rate', data: [18, 16, 15, 13, 11, 9, 8, 7], color: '#dc2626', dashed: true },
              ]}
            />
          </div>
        </PreviewCard>

        <PreviewCard title="Insight Stack" desc="Readable signals before raw data. Keep insights short and ranked." icon={Bell}>
          <div className="grid gap-3">
            {insightRows.map(item => (
              <InsightRow key={item.label} {...item} />
            ))}
          </div>
        </PreviewCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <PreviewCard title="KPI Intelligence" desc="Use mixed charts when each panel answers a different question." icon={GaugeIcon}>
          <div className="grid gap-4">
            <Gauge value={83} />
            <div className="grid gap-2">
              <Row label="Target" value={<span className="ds-mono font-black">85%</span>} />
              <Row label="Forecast" value={<Badge tone="amber">At risk</Badge>} />
              <Row label="Confidence" value={<span className="ds-mono font-black">0.78</span>} />
            </div>
          </div>
        </PreviewCard>

        <PreviewCard title="Funnel" desc="Compact pipeline view for onboarding, PO, import, and readiness flows." icon={ClipboardCheck}>
          <div className="grid gap-2">
            {funnel.map(([label, value, color], index) => {
              const width = Math.max(28, Math.round((value / funnel[0][1]) * 100))
              return (
                <div key={label} className="grid gap-1">
                  <div className="flex justify-between text-xs font-black text-slate-500 ds-muted-text">
                    <span>{index + 1}. {label}</span>
                    <span className="ds-mono">{value}</span>
                  </div>
                  <div className="h-8 overflow-hidden rounded-lg bg-slate-100">
                    <div className="flex h-full items-center justify-end rounded-lg px-3 text-xs font-black text-white" style={{ width: `${width}%`, background: color }}>
                      {width >= 45 ? `${width}%` : ''}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </PreviewCard>

        <PreviewCard title="Variance Panel" desc="Pair a chart with exact deltas so managers know what changed." icon={Wallet}>
          <div className="grid gap-4">
            <BarChart height={160} data={[
              { label: 'RF', value: 118 },
              { label: 'TE', value: 92 },
              { label: 'Solar', value: 74 },
              { label: 'ENT', value: 101 },
            ]} />
            <div className="grid grid-cols-3 gap-2">
              <DeltaPill label="Revenue" value="+12%" tone="green" />
              <DeltaPill label="Expense" value="-4%" tone="blue" />
              <DeltaPill label="Risk" value="+3" tone="red" />
            </div>
          </div>
        </PreviewCard>
      </div>
    </div>
  )
}

function ChartGallery() {
  const sparkRows = [
    ['HR', '#2447d8', [18, 24, 22, 31, 34, 39, 42, 38, 44, 47, 51, 56]],
    ['Clock', '#16a34a', [82, 85, 88, 84, 91, 93, 89, 94, 96, 97, 95, 98]],
    ['Finance', '#c73b32', [41, 38, 44, 49, 46, 52, 58, 55, 61, 64, 67, 72]],
    ['Pre-Site', '#d97706', [9, 12, 14, 13, 18, 17, 21, 24, 22, 28, 31, 35]],
  ]

  return (
    <div className="grid gap-4">
      <Card className="overflow-hidden">
        <div className="grid gap-0 xl:grid-cols-[1.2fr_.8fr]">
          <div className="p-5 lg:p-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[.14em] text-[#2447d8]">Executive Chart Board</div>
                <div className="mt-2 text-2xl font-black tracking-normal text-slate-950">Performance Snapshot</div>
                <div className="mt-1 max-w-2xl text-sm font-medium leading-6 text-slate-500 ds-muted-text">
                  High-value charts should pair visualization with exact KPI deltas, legend, and a short management insight.
                </div>
              </div>
              <ChartLegend items={[
                ['Readiness', '#2447d8'],
                ['Compliance', '#16a34a'],
                ['Exception', '#dc2626'],
              ]} />
            </div>
            <LineChart height={285}
              labels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']}
              series={[
                { name: 'Readiness', data: [62, 66, 70, 73, 78, 82, 86, 88, 91], color: '#2447d8', fill: true },
                { name: 'Compliance', data: [58, 63, 65, 71, 74, 79, 83, 86, 89], color: '#16a34a' },
                { name: 'Exceptions', data: [21, 19, 18, 16, 13, 11, 9, 8, 6], color: '#dc2626', dashed: true },
              ]}
            />
          </div>
          <div className="border-t border-slate-200 bg-slate-50 p-5 xl:border-l xl:border-t-0">
            <div className="grid gap-3">
              <ChartInsight title="Chart Insight" value="+13%" desc="Readiness improved since May after Pre-Site workflow cleanup." tone="green" />
              <ChartInsight title="Exception Rate" value="-7" desc="Open exceptions dropped across Clock and HR data quality." tone="blue" />
              <ChartInsight title="Action Needed" value="9" desc="Profiles and site rounds still need PM/HR follow-up." tone="amber" />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <ChartHeroCard title="Multi-Series Trend" kicker="Trend" desc="Executive trends, compliance history, and target-vs-actual comparison." icon={Activity}
          meta={<ChartLegend items={[['Readiness', '#2447d8'], ['Compliance', '#16a34a'], ['Exceptions', '#dc2626']]} />}>
          <LineChart height={245}
            labels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']}
            series={[
              { name: 'Readiness', data: [62, 66, 70, 73, 78, 82, 86, 88, 91], color: '#2447d8', fill: true },
              { name: 'Compliance', data: [58, 63, 65, 71, 74, 79, 83, 86, 89], color: '#16a34a' },
              { name: 'Exceptions', data: [21, 19, 18, 16, 13, 11, 9, 8, 6], color: '#dc2626', dashed: true },
            ]}
          />
        </ChartHeroCard>

        <ChartHeroCard title="Donut Breakdown" kicker="Composition" desc="Status mix, contract type, workflow outcome." icon={GaugeIcon}
          meta={<DeltaPill label="Ready" value="72%" tone="green" />}>
          <Donut data={[
            { label: 'Ready', value: 184, color: '#16a34a' },
            { label: 'In progress', value: 42, color: '#2447d8' },
            { label: 'At risk', value: 18, color: '#d97706' },
            { label: 'Blocked', value: 9, color: '#dc2626' },
          ]} />
        </ChartHeroCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartHeroCard title="Vertical Bar" kicker="Ranking" desc="Project ranking and categorical comparison." icon={LayoutDashboard}>
          <BarChart height={220} data={[
            { label: 'RF', value: 118, color: '#2447d8' },
            { label: 'TE', value: 92, color: '#16a34a' },
            { label: 'PAC', value: 74, color: '#d97706' },
            { label: 'SSV', value: 101, color: '#0ea5e9' },
            { label: 'ENT', value: 63, color: '#7c3aed' },
          ]} />
        </ChartHeroCard>

        <ChartHeroCard title="Gauge" kicker="Target" desc="Single percent against a target." icon={GaugeIcon}>
          <div className="grid gap-4">
            <Gauge value={87} />
            <div className="grid grid-cols-3 gap-2">
              <DeltaPill label="Target" value="85%" tone="blue" />
              <DeltaPill label="Delta" value="+2%" tone="green" />
              <DeltaPill label="Risk" value="Low" tone="amber" />
            </div>
          </div>
        </ChartHeroCard>

        <ChartHeroCard title="Mini Trend Cards" kicker="Inline" desc="Sparklines for compact dashboards and table rows." icon={Activity}>
          <div className="grid gap-3">
            {sparkRows.map(([label, color, data]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">{label}</span>
                  <span className="ds-mono text-xs font-black" style={{ color }}>{data[data.length - 1]}</span>
                </div>
                <Sparkline color={color} data={data} />
              </div>
            ))}
          </div>
        </ChartHeroCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[.95fr_1.05fr]">
        <ChartHeroCard title="Timeline / Gantt" kicker="Schedule" desc="Clock sessions, Pre-Site rounds, phases, and resource windows." icon={Clock}>
          <Timeline start={6} end={20} step={2} rows={[
            { label: 'ACE056', segments: [{ from: 7.5, to: 12.2, color: '#16a34a', label: 'On site' }, { from: 13, to: 18.5, color: '#16a34a', label: 'On site' }] },
            { label: 'ACE112', segments: [{ from: 8, to: 17, color: '#2447d8', label: 'Office' }] },
            { label: 'RF-014', segments: [{ from: 9, to: 11.5, color: '#d97706', label: 'DT' }, { from: 14, to: 16.5, color: '#2447d8', label: 'Report' }] },
            { label: 'PAC-07', segments: [{ from: 10, to: 13, color: '#7c3aed', label: 'Round 1' }, { from: 15, to: 18, color: '#7c3aed', label: 'Round 2' }] },
          ]} />
        </ChartHeroCard>

        <ChartHeroCard title="Chart Dashboard Composition" kicker="Board" desc="Combine chart types when each panel answers a different management question." icon={Layers}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="p-4">
              <div className="mb-2 text-xs font-extrabold uppercase text-slate-400">Status</div>
              <Donut size={118} thickness={16} data={[
                { label: 'Pass', value: 72, color: '#16a34a' },
                { label: 'Fail', value: 9, color: '#dc2626' },
                { label: 'Pending', value: 19, color: '#d97706' },
              ]} />
            </Card>
            <Card className="p-4">
              <div className="mb-2 text-xs font-extrabold uppercase text-slate-400">Volume</div>
              <BarChart height={150} data={[
                { label: 'M', value: 34 },
                { label: 'T', value: 46 },
                { label: 'W', value: 52 },
                { label: 'T', value: 44 },
                { label: 'F', value: 61 },
              ]} />
            </Card>
          </div>
        </ChartHeroCard>
      </div>
    </div>
  )
}

function ChartHeroCard({ title, kicker, desc, icon: Icon, meta, children }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 bg-gradient-to-r from-white to-slate-50 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#2447d8]">{kicker}</div>
            <div className="mt-1 text-base font-bold tracking-normal text-slate-950">{title}</div>
            {desc && <div className="mt-1 text-xs font-medium leading-5 text-slate-500 ds-muted-text">{desc}</div>}
          </div>
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eef2ff] text-[#2447d8]">
            {Icon && <Icon size={19} />}
          </div>
        </div>
        {meta && <div className="mt-3">{meta}</div>}
      </div>
      <div className="p-5">{children}</div>
    </Card>
  )
}

function ChartLegend({ items }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map(([label, color]) => (
        <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500 shadow-sm">
          <span className="h-2 w-2 rounded-full" style={{ background: color }} />
          {label}
        </span>
      ))}
    </div>
  )
}

function ChartInsight({ title, value, desc, tone }) {
  const color = { green: '#16a34a', blue: '#2447d8', red: '#dc2626', amber: '#d97706' }[tone] || '#2447d8'
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">{title}</div>
      <div className="mt-2 text-3xl font-black ds-mono" style={{ color }}>{value}</div>
      <div className="mt-2 text-xs font-medium leading-5 text-slate-500">{desc}</div>
    </div>
  )
}

function InsightRow({ label, value, detail, tone }) {
  const toneMap = {
    green: ['#16a34a', 'bg-green-50', 'border-green-100'],
    amber: ['#d97706', 'bg-amber-50', 'border-amber-100'],
    red: ['#dc2626', 'bg-red-50', 'border-red-100'],
    blue: ['#2447d8', 'bg-blue-50', 'border-blue-100'],
  }
  const [color, bg, border] = toneMap[tone] || toneMap.blue
  return (
    <div className={cx('rounded-lg border px-3 py-3', bg, border)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-slate-900">{label}</div>
          <div className="mt-1 text-xs font-medium text-slate-500">{detail}</div>
        </div>
        <div className="shrink-0 text-lg font-black ds-mono" style={{ color }}>{value}</div>
      </div>
    </div>
  )
}

function DeltaPill({ label, value, tone }) {
  const color = { green: '#16a34a', blue: '#2447d8', red: '#dc2626', amber: '#d97706' }[tone] || '#2447d8'
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
      <div className="text-[10px] font-extrabold uppercase text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-black ds-mono" style={{ color }}>{value}</div>
    </div>
  )
}

function DataDisplay() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <PreviewCard title="Operational Table" desc="Tables must be scannable, dense, and action-ready." icon={ClipboardCheck}>
        <Table head={['Code', 'Employee', 'Project', 'Clock In', 'Status']} rows={STATUS_ROWS} />
      </PreviewCard>
      <PreviewCard title="Analytics Cards" desc="Charts use ACE semantic colors and restrained motion." icon={GaugeIcon}>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-4">
            <div className="mb-3 text-sm font-bold">Project coverage</div>
            <BarChart height={160} data={[
              { label: 'RF14', value: 92 },
              { label: 'RF22', value: 87 },
              { label: 'RF07', value: 78 },
              { label: 'RF31', value: 84 },
              { label: 'RF40', value: 68 },
            ]} />
          </Card>
          <Card className="p-4">
            <div className="mb-3 text-sm font-bold">Status split</div>
            <Donut data={[
              { label: 'On Site', value: 118, color: '#16a34a' },
              { label: 'Office', value: 24, color: '#2447d8' },
              { label: 'Off Site', value: 24, color: '#dc2626' },
              { label: 'Leave', value: 5, color: '#d97706' },
            ]} />
          </Card>
        </div>
      </PreviewCard>
      <PreviewCard title="Trend Panel" desc="Use line charts for temporal comparisons." icon={Activity} className="xl:col-span-2">
        <LineChart height={220}
          labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
          series={[
            { name: 'Clocked in', data: [138, 142, 155, 151, 149, 82, 64], color: '#2447d8', fill: true },
            { name: 'On site', data: [112, 118, 128, 123, 121, 52, 41], color: '#16a34a' },
            { name: 'Exceptions', data: [8, 7, 9, 6, 11, 3, 2], color: '#dc2626', dashed: true },
          ]}
        />
      </PreviewCard>
    </div>
  )
}

function StatesPanel() {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <PreviewCard title="Empty" desc="Give the next useful action." icon={Inbox}>
        <EmptyState icon={Inbox} title="No records yet" desc="Run a sync or adjust filters to see results." action={<Button variant="soft" icon={Download}>Sync data</Button>} />
      </PreviewCard>
      <PreviewCard title="Loading" desc="Use skeletons for structured content." icon={Activity}>
        <div className="grid gap-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full" />
          <div className="flex items-center gap-3 text-sm font-bold text-slate-500"><Spinner /> Loading employees...</div>
        </div>
      </PreviewCard>
      <PreviewCard title="Error" desc="Make recovery obvious." icon={CircleX}>
        <EmptyState tone="error" icon={CircleX} title="Cannot load data" desc="The server returned an error." action={<Button variant="ghost" icon={Download}>Retry</Button>} />
      </PreviewCard>
    </div>
  )
}

function OverlaysPanel({ setModal, setDrawer, setCmdk }) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <PreviewCard title="Modal" desc="Short tasks with clear confirmation." icon={FileText}>
        <Button variant="primary" onClick={() => setModal(true)}>Open modal</Button>
      </PreviewCard>
      <PreviewCard title="Drawer" desc="Use for profile detail without losing table context." icon={Users}>
        <Button variant="ghost" onClick={() => setDrawer(true)}>Open drawer</Button>
      </PreviewCard>
      <PreviewCard title="Command Palette" desc="Fast navigation and power-user commands." icon={Command}>
        <Button variant="soft" onClick={() => setCmdk(true)}>Open Ctrl K</Button>
      </PreviewCard>
    </div>
  )
}

function Guidance() {
  const dos = [
    'Use PlatformShell for authenticated pages.',
    'Keep one primary action per page header.',
    'Use semantic status colors consistently.',
    'Prefer ds-* components before adding local styles.',
  ]
  const donts = [
    'Do not create a second sidebar for normal pages.',
    'Do not use large decorative shadows on every card.',
    'Do not use brand red as error unless it is a true error.',
    'Do not turn operational pages into marketing hero pages.',
  ]
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-black text-[#16a34a]"><CircleCheck size={18} /> Do</div>
        <div className="grid gap-3">
          {dos.map(item => <div key={item} className="rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm font-bold text-green-800">{item}</div>)}
        </div>
      </Card>
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-black text-[#dc2626]"><CircleX size={18} /> Do not</div>
        <div className="grid gap-3">
          {donts.map(item => <div key={item} className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-bold text-red-800">{item}</div>)}
        </div>
      </Card>
      <PreviewCard title="Sidebar building blocks" desc="Available for constrained demos or special layouts. Normal pages should use PlatformShell." icon={LayoutDashboard} className="xl:col-span-2">
        <div className="flex flex-col gap-5 lg:flex-row">
          <Sidebar className="h-auto overflow-hidden rounded-xl border" width={260}>
            <SidebarBrand />
            <div className="py-1">
              <SidebarSection>Overview</SidebarSection>
              <SideLink icon={LayoutDashboard} active>Executive Dashboard</SideLink>
              <SidebarSection>Operations</SidebarSection>
              <SideLink icon={Clock}>Clock Monitor</SideLink>
              <SideLink icon={Users}>Employees</SideLink>
              <SideLink icon={Wallet}>Finance</SideLink>
            </div>
          </Sidebar>
          <div className="grid flex-1 content-start gap-3 text-sm font-medium leading-6 text-slate-500 ds-muted-text">
            <p>Use navigation blocks only when composing prototypes or specialized admin surfaces. For production pages, prefer `PlatformShell` to avoid duplicated navigation behavior.</p>
            <div className="grid grid-cols-2 gap-3">
              <MiniMetric label="Radius" value="8-14" color="#2447d8" />
              <MiniMetric label="Shadow" value="sm" color="#64748b" />
              <MiniMetric label="Density" value="High" color="#16a34a" />
              <MiniMetric label="Charts" value="SVG" color="#d97706" />
            </div>
          </div>
        </div>
      </PreviewCard>
    </div>
  )
}

function SideLink({ icon: Icon, active, children }) {
  return (
    <a className={cx('ds-side-link', active && 'ds-active')} href="#guidance" onClick={e => e.preventDefault()}>
      <span className="ds-ic flex"><Icon size={17} /></span>
      <span className="flex-1">{children}</span>
    </a>
  )
}

export default function UiKitPage() {
  const { isDark, toggle } = useDarkMode()
  const [tab, setTab] = useState('daily')
  const [sw, setSw] = useState(true)
  const [ck, setCk] = useState(true)
  const [rd, setRd] = useState('site')
  const [modal, setModal] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [cmdk, setCmdk] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')

  function goSection(id) {
    setActiveSection(id)
    jumpTo(id)
  }

  const commands = useMemo(() => [
    ...NAV.map(([id, title]) => ({ group: 'Jump to', title, icon: LayoutDashboard, action: () => goSection(id) })),
    { group: 'Theme', title: isDark ? 'Switch to light mode' : 'Switch to dark mode', icon: isDark ? Sun : Moon, action: toggle },
    { group: 'Feedback', title: 'Show success toast', icon: CircleCheck, action: () => toast('Action completed', 'ok') },
  ], [isDark, toggle])

  return (
    <Shell>
      <div className="flex min-h-screen">
        <UiKitSidebar
          activeId={activeSection}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
          onJump={goSection}
        />

        {mobileMenuOpen && (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <main className="min-w-0 flex-1">
          <UiKitTopHeader
            isDark={isDark}
            toggle={toggle}
            onCommand={() => setCmdk(true)}
            onMenu={() => setMobileMenuOpen(true)}
          />

          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 flex flex-col gap-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-[#2447d8]">
                  <Layers size={14} />
                  AirConnect Engineering · UI Kit · Design System
                </div>
                <h1 className="mt-4 text-3xl font-black tracking-normal text-slate-950 sm:text-4xl">
                  ACE UI Kit
                </h1>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
                  Professional operations UI patterns for HR, Clock, Project, Pre-Site, Analytics, and Finance pages.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-sm">
                  <CalendarDays size={17} style={{ color: '#c73b32' }} />
                  UI Kit v1.1
                </div>
                <button onClick={() => setCmdk(true)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50">
                  <Command size={17} />
                  Command
                </button>
                <button onClick={() => goSection('guidance')} className="inline-flex items-center gap-2 rounded-2xl bg-[#2447d8] px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#1d3bb8]">
                  <ShieldCheck size={17} />
                  Usage Rules
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Sections" value={NAV.length} hint="UI kit catalog" accent="#2447d8" />
              <StatCard label="Tokens" value={TOKENS.length} hint="canonical colors" accent="#16a34a" />
              <StatCard label="Patterns" value={18} hint="page/workflow examples" accent="#d97706" />
              <StatCard label="Domains" value={5} hint="HR · Clock · Project · Finance · KPI" accent="#c73b32" />
            </div>

            <div className="space-y-10">
              <Hero onCommand={() => setCmdk(true)} />

          <Section id="infographic" eyebrow="Overview" title="UI Kit Infographic" desc="A visual summary for presenting the ACE design direction to teams before they inspect individual components.">
            <UiKitInfographic />
          </Section>

          <Section id="tokens" eyebrow="Foundation" title="Design Tokens" desc="Canonical color, surface, and semantic tokens for ACE operational screens. Keep these stable across every page.">
            <TokenGrid />
          </Section>

          <Section id="patterns" eyebrow="Production" title="Production Patterns" desc="Reusable page patterns that make operational workflows feel consistent and professional.">
            <ProductionPatterns />
          </Section>

          <Section id="components" eyebrow="Primitives" title="Components" desc="The shared primitives from `src/ui/index.jsx`. Compose these before adding page-specific styling.">
            <ComponentsGallery tab={tab} setTab={setTab} sw={sw} setSw={setSw} ck={ck} setCk={setCk} rd={rd} setRd={setRd} />
          </Section>

          <Section id="templates" eyebrow="Examples" title="Page Templates" desc="Higher-fidelity examples for the main ACE workflow families. These are intentionally dense and built for repeated daily use.">
            <PageTemplates onOpenDrawer={() => setDrawer(true)} />
          </Section>

          <Section id="presite" eyebrow="Project Workflow" title="Pre-Site Workflow Patterns" desc="Reusable SSV/PAC patterns from the Pre-Site Monitor: stage pipeline, SLA pressure, rounds, action gates, map layers, and dense workflow tables.">
            <PreSiteWorkflowPatterns onOpenDrawer={() => setDrawer(true)} />
          </Section>

          <Section id="maps" eyebrow="Geo Operations" title="Map Gallery" desc="Map patterns for HR employees, Pre-Site Monitor, project sites, field coverage, layer control, and risk drill-in.">
            <MapGallery />
          </Section>

          <Section id="analytics" eyebrow="Intelligence" title="Analytics" desc="Executive-ready analytics patterns for KPI, HR readiness, finance variance, and operational insight pages.">
            <AnalyticsWorkbench />
          </Section>

          <Section id="charts" eyebrow="Visualization" title="Chart Gallery" desc="Chart Types for ACE dashboards: trends, bars, donuts, gauges, sparklines, timelines, and composed analytics cards.">
            <ChartGallery />
          </Section>

          <Section id="data" eyebrow="Analytics" title="Data Display" desc="Tables and charts should be compact, readable, and semantic. Use them to support decisions, not decoration.">
            <DataDisplay />
          </Section>

          <Section id="states" eyebrow="Feedback" title="States" desc="Professional pages handle loading, empty, success, and error states with the same care as the happy path.">
            <StatesPanel />
          </Section>

          <Section id="overlays" eyebrow="Interaction" title="Overlays" desc="Use overlays sparingly for focused tasks, profile detail, and command navigation.">
            <OverlaysPanel setModal={setModal} setDrawer={setDrawer} setCmdk={setCmdk} />
          </Section>

          <Section id="guidance" eyebrow="Usage" title="Guidance" desc="Rules that keep the UI consistent as new pages are added.">
            <Guidance />
          </Section>

              <footer className="pb-8 text-center text-xs font-bold text-slate-400 ds-muted-text">
                ACE UI Kit - components from <span className="ds-mono">src/ui/index.jsx</span> - tokens from <span className="ds-mono">src/ui/ds.css</span>
              </footer>
            </div>
          </div>
        </main>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} width={520}>
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-blue-50 text-[#2447d8]"><FileText size={21} /></div>
          <div>
            <div className="text-lg font-extrabold text-slate-950">Create review note</div>
            <div className="mt-1 text-sm font-medium text-slate-500 ds-muted-text">Modal pattern for short, contained tasks.</div>
          </div>
        </div>
        <div className="mt-5 grid gap-3">
          <Field label="Title"><Input defaultValue="Missing document follow-up" /></Field>
          <Field label="Owner"><Select><option>HR Admin</option><option>Project Manager</option><option>Finance</option></Select></Field>
          <Field label="Priority"><Select><option>Normal</option><option>High</option><option>Critical</option></Select></Field>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => { setModal(false); toast('Review note saved', 'ok') }}>Save note</Button>
        </div>
      </Modal>

      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        title="Employee detail"
        footer={<><Button variant="ghost" className="flex-1" onClick={() => setDrawer(false)}>Close</Button><Button variant="primary" className="flex-1" onClick={() => { setDrawer(false); toast('Opening employee profile', 'info') }}>Open profile</Button></>}
      >
        <div className="flex items-center gap-3">
          <Avatar name="Peerapol Piamsri" size={58} />
          <div>
            <div className="text-lg font-extrabold text-slate-950">Peerapol Piamsri</div>
            <div className="text-xs font-bold text-slate-500 ds-muted-text ds-mono">ACE056 - DTE - HWT2304</div>
          </div>
        </div>
        <Card className="p-4">
          <div className="grid gap-3 text-sm">
            <Row label="Status" value={<StatusBadge status="On Site" />} />
            <Row label="Clock in" value={<span className="ds-mono font-black">07:48</span>} />
            <Row label="Site" value={<span className="font-bold">BKK-RF-014</span>} />
            <Row label="Readiness" value={<Progress value={92} color="#16a34a" />} />
          </div>
        </Card>
        <Card className="p-4">
          <div className="mb-3 text-sm font-bold">Weekly activity</div>
          <Sparkline color="#2447d8" data={[22, 31, 29, 42, 38, 46, 51, 44, 58, 61, 57, 66]} />
        </Card>
      </Drawer>

      <CommandPalette open={cmdk} onClose={() => setCmdk(false)} commands={commands} />
    </Shell>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0">
      <span className="text-sm font-bold text-slate-500 ds-muted-text">{label}</span>
      <span className="min-w-0 text-right">{value}</span>
    </div>
  )
}
