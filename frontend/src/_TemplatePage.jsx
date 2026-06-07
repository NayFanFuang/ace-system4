// ============================================================
// ACE — New Page Template (copy this file to start a new page)
// Built on PlatformShell + the ACE UI Kit (src/ui/index.jsx).
//
// To wire a new page:
//   1) Copy this file -> e.g. frontend/src/MyFeaturePage.jsx, rename the component.
//   2) Register a route in frontend/src/platformRoutes.js (path, roles, component name).
//   3) Import + add to COMPONENTS in frontend/src/main.jsx.
//   4) Replace the TODO sections with real data / apiFetch calls.
// ============================================================
import React, { useState } from 'react'
import { Download, Filter, Plus } from 'lucide-react'
import PlatformShell from './PlatformShell.jsx'
import {
  Button, Card, StatCard, Tabs, StatusBadge, Table, Field, Input, Select,
  Modal, Drawer, EmptyState, LineChart, toast,
} from './ui/index.jsx'
// import { apiFetch } from './apiFetch.js'   // <- use for real data

export default function TemplatePage({ authenticatedUser, onLogout }) {
  const [tab, setTab] = useState('overview')
  const [filterOpen, setFilterOpen] = useState(false)
  const [sel, setSel] = useState(null)

  // TODO: load real data
  // useEffect(() => { apiFetch('/api/...').then(r => r.json()).then(setData) }, [])

  return (
    // active = this page's route path (highlights the sidebar item)
    <PlatformShell user={authenticatedUser} onLogout={onLogout} active="/my-feature" breadcrumb="Group" title="Page Title">

      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Page Title</h1>
          <p className="text-sm text-slate-500 ds-muted-text mt-1">Short description of what this page does.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" icon={Filter} onClick={() => setFilterOpen(true)}>Filter</Button>
          <Button variant="primary" icon={Plus} onClick={() => toast('Created', 'ok')}>New</Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Metric A" value={142} hint="↑ 8 vs last" hintTone="up" accent="#2447d8" />
        <StatCard label="Metric B" value={118} hint="83%" accent="#16a34a" />
        <StatCard label="Metric C" value={24} hint="↑ 4" hintTone="down" accent="#c73b32" />
        <StatCard label="Metric D" value={7} hint="detail" accent="#d97706" />
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <Tabs value={tab} onChange={setTab} items={[
          { value: 'overview', label: 'Overview' },
          { value: 'detail', label: 'Detail' },
          { value: 'reports', label: 'Reports', badge: 3 },
        ]} />
      </div>

      {/* A chart card */}
      <Card className="p-5 mb-6">
        <div className="font-bold mb-3">Trend</div>
        <LineChart height={180}
          labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri']}
          series={[{ name: 'This week', data: [120, 134, 128, 142, 138], color: '#2447d8', fill: true }]} />
      </Card>

      {/* A table card */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="font-bold">Records</div>
          <Button variant="primary" icon={Download} onClick={() => toast('Exported', 'ok')}>Export</Button>
        </div>
        {/* If no data: <EmptyState .../> */}
        <Table
          head={['Name', 'Code', 'Status', '']}
          rows={[
            ['Peerapol Piamsri', 'ACE056', <StatusBadge status="On Site" />, <Button variant="ghost" onClick={() => setSel('ACE056')}>View</Button>],
            ['Niran Chaisri', 'ACE201', <StatusBadge status="Off Site" />, <Button variant="ghost" onClick={() => setSel('ACE201')}>View</Button>],
          ]}
        />
      </Card>

      {/* Filter modal */}
      <Modal open={filterOpen} onClose={() => setFilterOpen(false)}>
        <div className="font-black text-lg mb-4">Filter</div>
        <div className="space-y-4">
          <Field label="Search"><Input placeholder="Search…" /></Field>
          <Field label="Type"><Select><option>All</option></Select></Field>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setFilterOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => { setFilterOpen(false); toast('Filter applied', 'ok') }}>Apply</Button>
        </div>
      </Modal>

      {/* Detail drawer */}
      <Drawer open={!!sel} onClose={() => setSel(null)} title="Details"
        footer={<Button variant="primary" className="flex-1" onClick={() => setSel(null)}>Close</Button>}>
        <div className="text-sm">Selected: <b>{sel}</b></div>
      </Drawer>

    </PlatformShell>
  )
}
