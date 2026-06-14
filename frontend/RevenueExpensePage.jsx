'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Wallet, LayoutDashboard, LineChart as LineChartIcon, BarChart3, TrendingUp,
  CalendarRange, Receipt, ClipboardList, GitCompare, Target, FileText, Settings,
  Menu, X, LogOut, Sparkles, Activity, ScanLine,
} from 'lucide-react'
import { apiFetch } from './src/apiFetch.js'

// Live feed: posted Payment Vouchers (scanned bills saved to Accounting) as
// the bottom-up "Expense Actual". Additive banner — the hardcoded plan/actual
// arrays below are historical; this pulls real posted expenses from the ledger.
function ScannedBillsBanner() {
  const [s, setS] = useState(null)
  useEffect(() => {
    let alive = true
    apiFetch('/api/finance/accounting/summary')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (alive) setS(d) })
      .catch(() => {})
    return () => { alive = false }
  }, [])
  if (!s || !(s.months && s.months.length)) return null
  const fmtB = n => `฿${(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14,
      padding: '14px 18px', borderRadius: 16, marginBottom: 18,
      border: '1px solid #bfdbfe', background: 'linear-gradient(135deg,#eff6ff,#f0fdf4)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ display: 'grid', placeItems: 'center', width: 38, height: 38, borderRadius: 12, background: '#2447d814', color: ACE_BLUE }}><ScanLine size={20} /></span>
        <div>
          <div style={{ fontSize: '.7rem', fontWeight: 850, letterSpacing: '.04em', color: '#64748b', textTransform: 'uppercase' }}>Expense Actual from Scanned Bills</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#020617' }}>{fmtB(s.total_expense_actual)}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {s.months.slice(-6).map(m => (
          <span key={m.month} style={{ padding: '4px 10px', borderRadius: 999, background: '#fff', border: '1px solid #e2e8f0', fontSize: '.72rem', fontWeight: 800, color: '#334155' }}>
            {m.month}: {fmtB(m.expense_actual)}
          </span>
        ))}
      </div>
      <a href="/finance/accounting" style={{ marginLeft: 'auto', fontSize: '.78rem', fontWeight: 850, color: ACE_BLUE, textDecoration: 'underline', textUnderlineOffset: 3 }}>Open PV Ledger →</a>
    </div>
  )
}

const ACE_BLUE = '#2447d8'
const ACE_RED = '#c73b32'
const ACE_GRADIENT = `linear-gradient(135deg, ${ACE_BLUE} 0%, ${ACE_RED} 100%)`

const NAV = [
  ['dashboard', 'Dashboard'],
  ['executive', 'Executive View'],
  ['financial', 'Financial Report'],
  ['revenue', 'Revenue'],
  ['revenuePlan', 'Revenue Plan'],
  ['expense', 'Expense'],
  ['expensePlan', 'Expense Plans'],
  ['compare', 'Rev vs Exp'],
  ['planActual', 'Plan vs Actual'],
  ['reports', 'Reports & Export'],
  ['admin', 'Admin Settings'],
]

const NAV_ICONS = {
  dashboard: LayoutDashboard,
  executive: LineChartIcon,
  financial: BarChart3,
  revenue: TrendingUp,
  revenuePlan: CalendarRange,
  expense: Receipt,
  expensePlan: ClipboardList,
  compare: GitCompare,
  planActual: Target,
  reports: FileText,
  admin: Settings,
}

function initials(name) {
  return String(name || '').trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('') || 'F'
}

// ACE brand logo — uses the real PNG at /ace-logo.png, with an inline-SVG fallback
// if the file is not present yet (so the UI never shows a broken image).
function AceLogo({ className = '', title = 'ACE' }) {
  const [imgOk, setImgOk] = useState(true)
  if (imgOk) {
    return (
      <img
        src="/ace-logo.png"
        alt={title}
        className={className}
        onError={() => setImgOk(false)}
      />
    )
  }
  return (
    <svg viewBox="0 0 126 68" className={className} role="img" aria-label={title} xmlns="http://www.w3.org/2000/svg">
      <text
        x="1" y="41"
        fontFamily="'Segoe UI', system-ui, -apple-system, Arial, sans-serif"
        fontSize="46" fontWeight="900" letterSpacing="-1.5"
        fill={ACE_BLUE}
      >ACE</text>
      <rect x="3" y="49" width="93" height="9" rx="4.5" fill={ACE_RED} />
      <polygon points="94,45.5 121,53.5 94,61.5" fill={ACE_RED} />
    </svg>
  )
}

const FINANCIAL_MONTHS = [
  '2025-Dec', '2026-Jan', '2026-Feb', '2026-Mar', '2026-Apr', '2026-May',
  '2026-Jun', '2026-Jul', '2026-Aug', '2026-Sep', '2026-Oct', '2026-Nov', '2026-Dec',
]

const FINANCIAL_SUBSETS = [
  { key: 'all', label: 'Revenue ALL', title: 'Financial Report | Revenue ALL', chartTitle: 'Revenue Overall' },
  { key: 'rf', label: 'Revenue RF', title: 'Financial Report | Revenue RF Account', chartTitle: 'Revenue RF' },
  { key: 'te', label: 'Revenue TE', title: 'Financial Report | Revenue TE Account', chartTitle: 'Revenue TE' },
]

const FINANCIAL_DATA = {
  all: {
    planRevenue:    [null, 2630000, 8590000, 13620000, 10880000, 10016000, 13506000, 11480000, 13468000, 18272000, 12128000, 11660000, 10542000],
    planExpense:    [null, 5165000, 6882600, 7642000, 7157000, 6527000, 5417000, 6965000, 8105000, 8105000, 8285000, 6985000, 5185000],
    revenueActual:  [4465743.20, 5117867.68, 8172340.07, 5975104.74, 5161676.17, null, null, null, null, null, null, null, null],
    expenseActual:  [null, 4183343.02, 4369349.18, 4475304.63, 4615755.48, null, null, null, null, null, null, null, null],
    accInvoiceDone: [2838269.30, 3260195.01, 6261235.95, 2880917.79, 1294068.94, null, null, null, null, null, null, null, null],
  },
  rf: {
    planRevenue:    [null, 1230000, 4470000, 8450000, 5618000, 5796000, 10636000, 6030000, 6118000, 10922000, 4478000, 4460000, 6342000],
    planExpense:    [null, 4325000, 4815000, 5140000, 4625000, 3995000, 3695000, 3695000, 3695000, 3695000, 3695000, 2665000, 2665000],
    revenueActual:  [4465743.20, 4663950.88, 6612342.34, 5552593.74, 3536292.13, null, null, null, null, null, null, null, null],
    expenseActual:  [null, 3211874.14, 3379456.83, 3247954.23, 3080944.63, null, null, null, null, null, null, null, null],
    accInvoiceDone: [2838269.30, 2807071.21, 4786527.34, 2777628.69, 132218.90, null, null, null, null, null, null, null, null],
  },
  te: {
    planRevenue:    [null, 1400000, 4120000, 5170000, 4470000, 4220000, 2870000, 5450000, 7350000, 7350000, 7650000, 7200000, 4200000],
    planExpense:    [null, 840000, 2067600, 2502000, 2532000, 2532000, 1722000, 3270000, 4100000, 4100000, 4590000, 4320000, 2520000],
    revenueActual:  [null, 453916.80, 1559997.73, 422511.00, 1625384.04, null, null, null, null, null, null, null, null],
    expenseActual:  [null, 707579.37, 726002.85, 963460.90, 1270921.35, null, null, null, null, null, null, null, null],
    accInvoiceDone: [null, 453123.80, 1474708.23, 103289.10, 1161850.04, null, null, null, null, null, null, null, null],
  },
}

// Real monthly actual trend (Dec 2025 – Apr 2026) for the dashboard line chart.
const FINANCIAL_MONTHLY_TREND = FINANCIAL_MONTHS
  .map((label, i) => ({
    label: label.replace(/^20\d\d-/, ''),
    revenue: FINANCIAL_DATA.all.revenueActual[i] || 0,
    expense: FINANCIAL_DATA.all.expenseActual[i] || 0,
  }))
  .filter(row => row.revenue || row.expense)

const FINANCIAL_BAR_SERIES = [
  { key: 'planRevenue', label: 'Plan Revenue', color: '#86c89a' },
  { key: 'planExpense', label: 'Plan Expense', color: '#f4a868' },
  { key: 'revenueActual', label: 'Revenue Actual', color: '#3b82f6' },
  { key: 'expenseActual', label: 'Expense Actual', color: '#ef4444' },
  { key: 'accInvoiceDone', label: 'Acc Invoice Done', color: '#a855f7' },
]

const FINANCIAL_LINE_SERIES = [
  { key: 'planRevenue', label: 'Cum_Plan Revenue', color: '#86c89a' },
  { key: 'planExpense', label: 'Cum_Plan Expense', color: '#f4a868' },
  { key: 'revenueActual', label: 'Cum_Revenue Actual', color: '#3b82f6' },
  { key: 'expenseActual', label: 'Cum_Expense Actual', color: '#ef4444' },
  { key: 'accInvoiceDone', label: 'Cum_Acc Invoice Done', color: '#a855f7' },
]

// Real Q1 project data from "Graph Revenue 2026-05-11.pptx" (slide 9: Target Q1 vs Actual Q1).
// Reconciled to PPTX subtotals: RF actual revenue 19,191,164.16 / TE 1,994,825.53 = grand total 21,185,989.69.
const PROJECTS = [
  { id: 'RF-EEC', code: 'RF-EEC', name: 'AIS EEC Expansion', account: 'RF', program: 'Huawei', pm: '-', status: 'Active', start: '2026-01-01', end: '2026-03-31', target: 320000, actualRevenue: 814301.00, actualExpense: 1133718.00, outOfTarget: true },
  { id: 'RF-TRE', code: 'RF-TRE', name: 'TRUE East Expansion', account: 'RF', program: 'Huawei', pm: '-', status: 'Active', start: '2026-01-01', end: '2026-03-31', target: 4600000, actualRevenue: 1652772.84, actualExpense: 1205925.62, outOfTarget: true },
  { id: 'RF-NPM', code: 'RF-NPM', name: 'All NPM Package East', account: 'RF', program: 'Huawei', pm: '-', status: 'Active', start: '2026-01-01', end: '2026-03-31', target: 2160000, actualRevenue: 6006771.00, actualExpense: 3463340.00, outOfTarget: false },
  { id: 'RF-TRS', code: 'RF-TRS', name: 'TRUE South Expansion', account: 'RF', program: 'ZTE', pm: '-', status: 'Active', start: '2026-01-01', end: '2026-03-31', target: 180000, actualRevenue: 607324.49, actualExpense: 340761.00, outOfTarget: false },
  { id: 'RF-NSA', code: 'RF-NSA', name: 'NSA/SA Benchmarking', account: 'RF', program: 'NBTC', pm: '-', status: 'Active', start: '2026-01-01', end: '2026-03-31', target: 3000000, actualRevenue: 2560378.12, actualExpense: 663066.81, outOfTarget: true },
  { id: 'RF-QOS', code: 'RF-QOS', name: 'QoS Drone Project', account: 'RF', program: 'NBTC', pm: '-', status: 'Active', start: '2026-01-01', end: '2026-03-31', target: 1400000, actualRevenue: 1149616.71, actualExpense: 544858.33, outOfTarget: true },
  { id: 'RF-BMA', code: 'RF-BMA', name: 'AIS BMA Optimization Service', account: 'RF', program: 'AIS', pm: '-', status: 'Active', start: '2026-01-01', end: '2026-03-31', target: 4000000, actualRevenue: 6400000.00, actualExpense: 2411373.45, outOfTarget: false },
  { id: 'RF-IBC', code: 'RF-IBC', name: 'IBC Walk Test', account: 'RF', program: 'Others', pm: '-', status: 'Active', start: '2026-01-01', end: '2026-03-31', target: 300000, actualRevenue: 0, actualExpense: 0, outOfTarget: false },
  { id: 'TE-MBB', code: 'TE-MBB', name: 'AIS MBB Expansion', account: 'TE', program: 'Huawei', pm: '-', status: 'Active', start: '2026-01-01', end: '2026-03-31', target: 320000, actualRevenue: 260074.60, actualExpense: 298594.49, outOfTarget: true },
  { id: 'TE-TMB', code: 'TE-TMB', name: 'TRUE MBB Expansion', account: 'TE', program: 'TRUE', pm: '-', status: 'Active', start: '2026-01-01', end: '2026-03-31', target: 1200000, actualRevenue: 0, actualExpense: 525374.65, outOfTarget: true },
  { id: 'TE-ZTE', code: 'TE-ZTE', name: 'ZTE Project (TE)', account: 'TE', program: 'ZTE', pm: '-', status: 'Active', start: '2026-01-01', end: '2026-03-31', target: 570000, actualRevenue: 0, actualExpense: 0, outOfTarget: false },
  { id: 'TE-BAT', code: 'TE-BAT', name: 'BAT Project', account: 'TE', program: 'WW', pm: '-', status: 'Active', start: '2026-01-01', end: '2026-03-31', target: 1200000, actualRevenue: 1256481.90, actualExpense: 0, outOfTarget: false },
  { id: 'TE-BAS', code: 'TE-BAS', name: 'Bateries/Rectifier Swap', account: 'TE', program: 'WW', pm: '-', status: 'Active', start: '2026-01-01', end: '2026-03-31', target: 400000, actualRevenue: 0, actualExpense: 0, outOfTarget: false },
  { id: 'TE-OR13', code: 'TE-OR13', name: 'OR13 Project', account: 'TE', program: 'WW', pm: '-', status: 'Active', start: '2026-01-01', end: '2026-03-31', target: 2000000, actualRevenue: 473469.03, actualExpense: 1313132.04, outOfTarget: true },
  { id: 'TE-OTH', code: 'TE-OTH', name: 'Others Project', account: 'TE', program: 'Others', pm: '-', status: 'Active', start: '2026-01-01', end: '2026-03-31', target: 0, actualRevenue: 4800.00, actualExpense: 0, outOfTarget: false },
]

const CATEGORIES = [
  { key: '01-001', category: 'Revenue', item: 'Service Income', account: '4100', budgetType: 'Revenue', active: 'Y' },
  { key: '02-001', category: 'Travel', item: 'Fuel / Tollway', account: '5201', budgetType: 'OPEX', active: 'Y' },
  { key: '02-002', category: 'Travel', item: 'Hotel / Allowance', account: '5202', budgetType: 'OPEX', active: 'Y' },
  { key: '03-001', category: 'Equipment', item: 'RF Tools / Rental', account: '5301', budgetType: 'CAPEX', active: 'Y' },
  { key: '04-001', category: 'Subcontract', item: 'Vendor Service', account: '5401', budgetType: 'OPEX', active: 'Y' },
  { key: '05-001', category: 'Office', item: 'Documents / Printing', account: '5501', budgetType: 'OPEX', active: 'Y' },
]

const DETAILS = [
  { detailKey: 'SIM-001', expenseKey: '02-001', usage: 'Drive Test', sub: 'Data SIM', detail: 'AIS DTE SIM Package', active: 'Y' },
  { detailKey: 'CAR-001', expenseKey: '02-001', usage: 'Vehicle', sub: 'Fuel', detail: 'Fuel reimbursement', active: 'Y' },
  { detailKey: 'HOTEL-001', expenseKey: '02-002', usage: 'Field Trip', sub: 'Hotel', detail: 'Provincial hotel', active: 'Y' },
  { detailKey: 'VENDOR-001', expenseKey: '04-001', usage: 'Subcontract', sub: 'RF Survey', detail: 'Vendor field service', active: 'Y' },
]

// Q1 actual revenue (work approved) per project — from PPTX slide 9, dated to Q1 close (2026-03-31).
const REVENUES = [
  { id: 'REV-RF-EEC', date: '2026-03-31', projectId: 'RF-EEC', expenseKey: '01-001', amount: 814301.00, description: 'Q1 actual revenue — AIS EEC Expansion' },
  { id: 'REV-RF-TRE', date: '2026-03-31', projectId: 'RF-TRE', expenseKey: '01-001', amount: 1652772.84, description: 'Q1 actual revenue — TRUE East Expansion' },
  { id: 'REV-RF-NPM', date: '2026-03-31', projectId: 'RF-NPM', expenseKey: '01-001', amount: 6006771.00, description: 'Q1 actual revenue — All NPM Package East' },
  { id: 'REV-RF-TRS', date: '2026-03-31', projectId: 'RF-TRS', expenseKey: '01-001', amount: 607324.49, description: 'Q1 actual revenue — TRUE South Expansion' },
  { id: 'REV-RF-NSA', date: '2026-03-31', projectId: 'RF-NSA', expenseKey: '01-001', amount: 2560378.12, description: 'Q1 actual revenue — NSA/SA Benchmarking' },
  { id: 'REV-RF-QOS', date: '2026-03-31', projectId: 'RF-QOS', expenseKey: '01-001', amount: 1149616.71, description: 'Q1 actual revenue — QoS Drone Project' },
  { id: 'REV-RF-BMA', date: '2026-03-31', projectId: 'RF-BMA', expenseKey: '01-001', amount: 6400000.00, description: 'Q1 actual revenue — AIS BMA Optimization Service' },
  { id: 'REV-TE-MBB', date: '2026-03-31', projectId: 'TE-MBB', expenseKey: '01-001', amount: 260074.60, description: 'Q1 actual revenue — AIS MBB Expansion' },
  { id: 'REV-TE-BAT', date: '2026-03-31', projectId: 'TE-BAT', expenseKey: '01-001', amount: 1256481.90, description: 'Q1 actual revenue — BAT Project' },
  { id: 'REV-TE-OR13', date: '2026-03-31', projectId: 'TE-OR13', expenseKey: '01-001', amount: 473469.03, description: 'Q1 actual revenue — OR13 Project' },
  { id: 'REV-TE-OTH', date: '2026-03-31', projectId: 'TE-OTH', expenseKey: '01-001', amount: 4800.00, description: 'Q1 actual revenue — Others Project' },
]

// Q1 actual expense per project — from PPTX slide 9. VAT not broken out in source (vatPct: 0).
const EXPENSES = [
  { id: 'EXP-RF-EEC', date: '2026-03-31', projectId: 'RF-EEC', expenseKey: '04-001', detailKey: '', vendor: '-', billNo: '', amount: 1133718.00, vatPct: 0, status: 'Approved', description: 'Q1 actual expense — AIS EEC Expansion' },
  { id: 'EXP-RF-TRE', date: '2026-03-31', projectId: 'RF-TRE', expenseKey: '04-001', detailKey: '', vendor: '-', billNo: '', amount: 1205925.62, vatPct: 0, status: 'Approved', description: 'Q1 actual expense — TRUE East Expansion' },
  { id: 'EXP-RF-NPM', date: '2026-03-31', projectId: 'RF-NPM', expenseKey: '04-001', detailKey: '', vendor: '-', billNo: '', amount: 3463340.00, vatPct: 0, status: 'Approved', description: 'Q1 actual expense — All NPM Package East' },
  { id: 'EXP-RF-TRS', date: '2026-03-31', projectId: 'RF-TRS', expenseKey: '04-001', detailKey: '', vendor: '-', billNo: '', amount: 340761.00, vatPct: 0, status: 'Approved', description: 'Q1 actual expense — TRUE South Expansion' },
  { id: 'EXP-RF-NSA', date: '2026-03-31', projectId: 'RF-NSA', expenseKey: '04-001', detailKey: '', vendor: '-', billNo: '', amount: 663066.81, vatPct: 0, status: 'Approved', description: 'Q1 actual expense — NSA/SA Benchmarking' },
  { id: 'EXP-RF-QOS', date: '2026-03-31', projectId: 'RF-QOS', expenseKey: '04-001', detailKey: '', vendor: '-', billNo: '', amount: 544858.33, vatPct: 0, status: 'Approved', description: 'Q1 actual expense — QoS Drone Project' },
  { id: 'EXP-RF-BMA', date: '2026-03-31', projectId: 'RF-BMA', expenseKey: '04-001', detailKey: '', vendor: '-', billNo: '', amount: 2411373.45, vatPct: 0, status: 'Approved', description: 'Q1 actual expense — AIS BMA Optimization Service' },
  { id: 'EXP-TE-MBB', date: '2026-03-31', projectId: 'TE-MBB', expenseKey: '04-001', detailKey: '', vendor: '-', billNo: '', amount: 298594.49, vatPct: 0, status: 'Approved', description: 'Q1 actual expense — AIS MBB Expansion' },
  { id: 'EXP-TE-TMB', date: '2026-03-31', projectId: 'TE-TMB', expenseKey: '04-001', detailKey: '', vendor: '-', billNo: '', amount: 525374.65, vatPct: 0, status: 'Approved', description: 'Q1 actual expense — TRUE MBB Expansion' },
  { id: 'EXP-TE-OR13', date: '2026-03-31', projectId: 'TE-OR13', expenseKey: '04-001', detailKey: '', vendor: '-', billNo: '', amount: 1313132.04, vatPct: 0, status: 'Approved', description: 'Q1 actual expense — OR13 Project' },
]

// Q1 budget envelope per project = Target Q1 from PPTX slide 9 (used as planned/budget baseline).
const EXPENSE_PLANS = [
  { id: 'PLN-RF-EEC', month: 3, year: 2026, projectId: 'RF-EEC', expenseKey: '04-001', plannedAmount: 320000, description: 'Q1 budget (target) — AIS EEC Expansion' },
  { id: 'PLN-RF-TRE', month: 3, year: 2026, projectId: 'RF-TRE', expenseKey: '04-001', plannedAmount: 4600000, description: 'Q1 budget (target) — TRUE East Expansion' },
  { id: 'PLN-RF-NPM', month: 3, year: 2026, projectId: 'RF-NPM', expenseKey: '04-001', plannedAmount: 2160000, description: 'Q1 budget (target) — All NPM Package East' },
  { id: 'PLN-RF-TRS', month: 3, year: 2026, projectId: 'RF-TRS', expenseKey: '04-001', plannedAmount: 180000, description: 'Q1 budget (target) — TRUE South Expansion' },
  { id: 'PLN-RF-NSA', month: 3, year: 2026, projectId: 'RF-NSA', expenseKey: '04-001', plannedAmount: 3000000, description: 'Q1 budget (target) — NSA/SA Benchmarking' },
  { id: 'PLN-RF-QOS', month: 3, year: 2026, projectId: 'RF-QOS', expenseKey: '04-001', plannedAmount: 1400000, description: 'Q1 budget (target) — QoS Drone Project' },
  { id: 'PLN-RF-BMA', month: 3, year: 2026, projectId: 'RF-BMA', expenseKey: '04-001', plannedAmount: 4000000, description: 'Q1 budget (target) — AIS BMA Optimization Service' },
  { id: 'PLN-RF-IBC', month: 3, year: 2026, projectId: 'RF-IBC', expenseKey: '04-001', plannedAmount: 300000, description: 'Q1 budget (target) — IBC Walk Test' },
  { id: 'PLN-TE-MBB', month: 3, year: 2026, projectId: 'TE-MBB', expenseKey: '04-001', plannedAmount: 320000, description: 'Q1 budget (target) — AIS MBB Expansion' },
  { id: 'PLN-TE-TMB', month: 3, year: 2026, projectId: 'TE-TMB', expenseKey: '04-001', plannedAmount: 1200000, description: 'Q1 budget (target) — TRUE MBB Expansion' },
  { id: 'PLN-TE-ZTE', month: 3, year: 2026, projectId: 'TE-ZTE', expenseKey: '04-001', plannedAmount: 570000, description: 'Q1 budget (target) — ZTE Project (TE)' },
  { id: 'PLN-TE-BAT', month: 3, year: 2026, projectId: 'TE-BAT', expenseKey: '04-001', plannedAmount: 1200000, description: 'Q1 budget (target) — BAT Project' },
  { id: 'PLN-TE-BAS', month: 3, year: 2026, projectId: 'TE-BAS', expenseKey: '04-001', plannedAmount: 400000, description: 'Q1 budget (target) — Bateries/Rectifier Swap' },
  { id: 'PLN-TE-OR13', month: 3, year: 2026, projectId: 'TE-OR13', expenseKey: '04-001', plannedAmount: 2000000, description: 'Q1 budget (target) — OR13 Project' },
]

// Q1 revenue target per project — status: Received = met target, Overdue = out of target, Pending = under target.
const REVENUE_PLANS = [
  { id: 'RPL-RF-EEC', projectId: 'RF-EEC', plannedDate: '2026-03-31', plannedAmount: 320000, status: 'Overdue', remark: 'Out of target' },
  { id: 'RPL-RF-TRE', projectId: 'RF-TRE', plannedDate: '2026-03-31', plannedAmount: 4600000, status: 'Overdue', remark: 'Out of target' },
  { id: 'RPL-RF-NPM', projectId: 'RF-NPM', plannedDate: '2026-03-31', plannedAmount: 2160000, status: 'Received', remark: 'Above target' },
  { id: 'RPL-RF-TRS', projectId: 'RF-TRS', plannedDate: '2026-03-31', plannedAmount: 180000, status: 'Received', remark: 'Above target' },
  { id: 'RPL-RF-NSA', projectId: 'RF-NSA', plannedDate: '2026-03-31', plannedAmount: 3000000, status: 'Overdue', remark: 'Out of target' },
  { id: 'RPL-RF-QOS', projectId: 'RF-QOS', plannedDate: '2026-03-31', plannedAmount: 1400000, status: 'Overdue', remark: 'Out of target' },
  { id: 'RPL-RF-BMA', projectId: 'RF-BMA', plannedDate: '2026-03-31', plannedAmount: 4000000, status: 'Received', remark: 'Above target' },
  { id: 'RPL-RF-IBC', projectId: 'RF-IBC', plannedDate: '2026-03-31', plannedAmount: 300000, status: 'Pending', remark: 'No revenue yet' },
  { id: 'RPL-TE-MBB', projectId: 'TE-MBB', plannedDate: '2026-03-31', plannedAmount: 320000, status: 'Overdue', remark: 'Out of target' },
  { id: 'RPL-TE-TMB', projectId: 'TE-TMB', plannedDate: '2026-03-31', plannedAmount: 1200000, status: 'Overdue', remark: 'Out of target' },
  { id: 'RPL-TE-ZTE', projectId: 'TE-ZTE', plannedDate: '2026-03-31', plannedAmount: 570000, status: 'Pending', remark: 'No revenue yet' },
  { id: 'RPL-TE-BAT', projectId: 'TE-BAT', plannedDate: '2026-03-31', plannedAmount: 1200000, status: 'Received', remark: 'Above target' },
  { id: 'RPL-TE-BAS', projectId: 'TE-BAS', plannedDate: '2026-03-31', plannedAmount: 400000, status: 'Pending', remark: 'No revenue yet' },
  { id: 'RPL-TE-OR13', projectId: 'TE-OR13', plannedDate: '2026-03-31', plannedAmount: 2000000, status: 'Overdue', remark: 'Out of target' },
]

const USERS = [
  { email: 'finance@airconnect-e.com', name: 'Finance Admin', role: 'admin', created: '2026-01-01' },
  { email: 'project@airconnect-e.com', name: 'Project Admin', role: 'editor', created: '2026-01-10' },
  { email: 'hr@airconnect-e.com', name: 'HR Admin', role: 'viewer', created: '2026-02-01' },
]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function money(value) {
  return `฿${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

function projectName(id) {
  const project = PROJECTS.find(item => item.id === id)
  return project ? project.code : id || '-'
}

function categoryName(key) {
  const category = CATEGORIES.find(item => item.key === key)
  return category ? category.item : key || '-'
}

function vatAmount(row) {
  return Number(row.amount || 0) * Number(row.vatPct || 0) / 100
}

function sum(list, fn) {
  return list.reduce((total, item) => total + Number(fn(item) || 0), 0)
}

function monthIndex(date) {
  const parts = String(date || '').split('-')
  return Math.max(0, Number(parts[1] || 1) - 1)
}

function groupMonthly(revenues, expenses, plans) {
  return MONTHS.map((label, index) => {
    const revenue = sum(revenues.filter(row => monthIndex(row.date) === index), row => row.amount)
    const expense = sum(expenses.filter(row => monthIndex(row.date) === index), row => row.amount + vatAmount(row))
    const planned = sum(plans.filter(row => Number(row.month) === index + 1), row => row.plannedAmount)
    return { label, revenue, expense, planned, profit: revenue - expense }
  })
}

function chartPoints(rows, key, width = 500, height = 170) {
  const values = rows.map(row => Number(row[key] || 0))
  const max = Math.max(1, ...values)
  return values.map((value, index) => {
    const x = rows.length === 1 ? width / 2 : (index / (rows.length - 1)) * width
    const y = height - (value / max) * height
    return `${x},${y}`
  }).join(' ')
}

function axisMoney(value) {
  const abs = Math.abs(value)
  if (abs >= 1e6) return `฿${(value / 1e6).toFixed(1)}M`
  if (abs >= 1e3) return `฿${Math.round(value / 1e3)}K`
  return `฿${Math.round(value)}`
}

// Catmull-Rom → cubic bezier for a smooth line through all points.
function smoothLinePath(points) {
  if (!points.length) return ''
  if (points.length < 3) return 'M ' + points.map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ')
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] || p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

function FinanceSidebar({ page, setPage, mobileOpen, onMobileClose }) {
  return (
    <aside className={`${mobileOpen ? 'fixed inset-y-0 left-0 z-40 flex' : 'hidden'} w-72 flex-col border-r border-slate-200 bg-white/95 p-5 shadow-lg backdrop-blur lg:sticky lg:top-0 lg:flex lg:h-screen lg:shadow-none lg:overflow-y-auto`}>
      <div className="flex items-center gap-3">
        <AceLogo className="h-10 w-auto shrink-0" />
        <div className="min-w-0 border-l border-slate-200 pl-3">
          <div className="text-sm font-black text-slate-950">Finance Suite</div>
          <div className="text-xs font-bold text-slate-400">Revenue &amp; Expense</div>
        </div>
        <button
          onClick={onMobileClose}
          className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 lg:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="mt-9 space-y-1">
        {NAV.map(([key, label]) => {
          const active = page === key
          const Icon = NAV_ICONS[key] || Activity
          return (
            <button
              key={key}
              type="button"
              onClick={() => { setPage(key); onMobileClose?.() }}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-sm font-black transition ${active ? 'bg-blue-50 text-[#2447d8] shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          )
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-sm font-black text-slate-900">
          <Sparkles size={18} style={{ color: ACE_BLUE }} />
          Finance Workspace
        </div>
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
          Revenue · Expense · Plans · Project profitability &amp; reports.
        </p>
      </div>
    </aside>
  )
}

function PageShell({ page, setPage, authenticatedUser, onLogout, children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <div className="ace-revenue-expense-page min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="flex min-h-screen">
        <FinanceSidebar
          page={page}
          setPage={id => { setPage(id); setMobileOpen(false) }}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        {mobileOpen && (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <main className="min-w-0 flex-1">
          {/* Sticky top header */}
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/86 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 lg:hidden"
                aria-label="Open menu"
              >
                <Menu size={19} />
              </button>
              <div className="hidden text-sm font-black text-slate-500 sm:block">ACE Finance · Revenue &amp; Expense</div>
              <div className="ml-auto flex items-center gap-2">
                <a
                  href="/overview"
                  className="hidden items-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-50 sm:inline-flex"
                >
                  Overview
                </a>
                <button className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:bg-slate-50 sm:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-black text-white" style={{ background: ACE_BLUE }}>
                    {initials(authenticatedUser?.name || 'Finance')}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black text-slate-900">{authenticatedUser?.name || 'Finance Admin'}</div>
                    <div className="text-xs font-bold text-slate-400">{authenticatedUser?.positionName || 'Revenue & Expense'}</div>
                  </div>
                </button>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                    aria-label="Logout"
                  >
                    <LogOut size={18} />
                  </button>
                )}
              </div>
            </div>
          </header>

          <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  )
}

function Header({ title, subtitle, children }) {
  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-[#2447d8]">
          <Wallet size={14} /> ACE · Finance · Revenue &amp; Expense
        </div>
        <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">{subtitle}</p>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2.5">{children}</div>
    </div>
  )
}

function StatCard({ label, value, sub, tone = 'blue' }) {
  const color = tone === 'red' ? ACE_RED : tone === 'green' ? '#16a34a' : tone === 'amber' ? '#d97706' : ACE_BLUE
  return (
    <section style={styles.statCard}>
      <div style={styles.statLabel}>{label}</div>
      <div style={{ ...styles.statValue, color }}>{value}</div>
      <div style={styles.statSub}>{sub}</div>
    </section>
  )
}

function Panel({ title, action, children, wide = false }) {
  return (
    <section style={{ ...styles.panel, ...(wide ? { gridColumn: '1 / -1' } : {}) }}>
      <div style={styles.panelHead}>
        <div style={styles.panelTitle}>{title}</div>
        {action}
      </div>
      {children}
    </section>
  )
}

function StatusPill({ status }) {
  const s = String(status || '')
  const color = /approved|received|active/i.test(s) ? '#16a34a' : /overdue|pending/i.test(s) ? '#b42318' : '#475467'
  const bg = /approved|received|active/i.test(s) ? '#dcfce7' : /overdue|pending/i.test(s) ? '#fee4e2' : '#f2f4f7'
  return <span style={{ ...styles.pill, color, background: bg }}>{s}</span>
}

function BarCompare({ rows, leftKey = 'revenue', rightKey = 'expense' }) {
  const W = 560
  const H = 240
  const pad = { left: 54, right: 16, top: 16, bottom: 30 }
  const plotW = W - pad.left - pad.right
  const plotH = H - pad.top - pad.bottom
  const baseY = pad.top + plotH
  const data = rows && rows.length ? rows : [{ label: '-', [leftKey]: 0, [rightKey]: 0 }]
  const n = data.length
  const max = Math.max(1, ...data.flatMap(row => [Number(row[leftKey] || 0), Number(row[rightKey] || 0)]))
  const bandW = plotW / n
  const barW = Math.max(4, Math.min(16, bandW * 0.30))
  const gap = Math.max(2, barW * 0.3)
  const cx = i => pad.left + (i + 0.5) * bandW
  const yAt = value => pad.top + (1 - Number(value || 0) / max) * plotH
  const tickCount = 4
  const gridValues = Array.from({ length: tickCount + 1 }, (_, i) => (max / tickCount) * i)

  const [hover, setHover] = useState(null)
  const tipW = 152
  const tipH = 64
  const hoverRow = hover != null ? data[hover] : null
  const tipX = hover != null ? Math.max(pad.left, Math.min(W - pad.right - tipW, cx(hover) - tipW / 2)) : 0
  const tipY = pad.top + 4
  const showLabel = n <= 14

  return (
    <div style={styles.lineChart}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <linearGradient id="bc-rev-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACE_BLUE} stopOpacity="0.95" />
            <stop offset="100%" stopColor={ACE_BLUE} stopOpacity="0.72" />
          </linearGradient>
          <linearGradient id="bc-exp-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACE_RED} stopOpacity="0.95" />
            <stop offset="100%" stopColor={ACE_RED} stopOpacity="0.72" />
          </linearGradient>
        </defs>
        {gridValues.map((value, i) => {
          const y = yAt(value)
          return (
            <g key={i}>
              <line x1={pad.left} y1={y} x2={W - pad.right} y2={y} stroke="#eef1f6" strokeWidth="1" />
              <text x={pad.left - 8} y={y + 3} textAnchor="end" fontSize="9.5" fill="#98a2b3">{axisMoney(value)}</text>
            </g>
          )
        })}
        <line x1={pad.left} y1={baseY} x2={W - pad.right} y2={baseY} stroke="#cbd2dc" strokeWidth="1" />
        {data.map((row, i) => {
          const lv = Number(row[leftKey] || 0)
          const rv = Number(row[rightKey] || 0)
          const dim = hover != null && hover !== i ? 0.4 : 1
          return (
            <g key={i} style={{ transition: 'opacity .15s ease' }} opacity={dim}>
              {lv > 0 && <rect x={cx(i) - gap / 2 - barW} y={yAt(lv)} width={barW} height={Math.max(0, baseY - yAt(lv))} rx="2.5" fill="url(#bc-rev-fill)" />}
              {rv > 0 && <rect x={cx(i) + gap / 2} y={yAt(rv)} width={barW} height={Math.max(0, baseY - yAt(rv))} rx="2.5" fill="url(#bc-exp-fill)" />}
            </g>
          )
        })}
        {showLabel && data.map((row, i) => (
          <text key={`l${i}`} x={cx(i)} y={H - 10} textAnchor="middle" fontSize="9.5" fill={hover === i ? '#1d2939' : '#98a2b3'} fontWeight={hover === i ? 800 : 600}>{row.label}</text>
        ))}
        {data.map((row, i) => (
          <rect key={`h${i}`} x={pad.left + i * bandW} y={pad.top} width={bandW} height={plotH} fill="transparent"
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
        ))}
        {hoverRow && (
          <g pointerEvents="none">
            <rect x={tipX} y={tipY} width={tipW} height={tipH} rx="7" fill="#fff" stroke="#e2e8f0" strokeWidth="1" opacity="0.97" />
            <text x={tipX + 10} y={tipY + 17} fontSize="10.5" fontWeight="800" fill="#1d2939">{hoverRow.label}</text>
            <circle cx={tipX + 13} cy={tipY + 33} r="3.5" fill={ACE_BLUE} />
            <text x={tipX + 22} y={tipY + 36} fontSize="10" fill="#475467">Revenue {money(hoverRow[leftKey])}</text>
            <circle cx={tipX + 13} cy={tipY + 50} r="3.5" fill={ACE_RED} />
            <text x={tipX + 22} y={tipY + 53} fontSize="10" fill="#475467">Expense {money(hoverRow[rightKey])}</text>
          </g>
        )}
      </svg>
      <div style={styles.chartLegend}>
        <span><b style={{ background: ACE_BLUE }} />Revenue</span>
        <span><b style={{ background: ACE_RED }} />Expense</span>
      </div>
    </div>
  )
}

function LineChart({ rows }) {
  const W = 560
  const H = 240
  const pad = { left: 54, right: 16, top: 16, bottom: 30 }
  const plotW = W - pad.left - pad.right
  const plotH = H - pad.top - pad.bottom
  const baseY = pad.top + plotH
  const data = rows && rows.length ? rows : [{ label: '-', revenue: 0, expense: 0 }]
  const n = data.length
  const max = Math.max(1, ...data.flatMap(row => [Number(row.revenue || 0), Number(row.expense || 0)]))
  const xAt = i => pad.left + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW)
  const yAt = value => pad.top + (1 - Number(value || 0) / max) * plotH
  const revPoints = data.map((row, i) => ({ x: xAt(i), y: yAt(row.revenue) }))
  const expPoints = data.map((row, i) => ({ x: xAt(i), y: yAt(row.expense) }))
  const revLine = smoothLinePath(revPoints)
  const expLine = smoothLinePath(expPoints)
  const areaOf = (line, points) => line ? `${line} L ${points[n - 1].x.toFixed(1)} ${baseY} L ${points[0].x.toFixed(1)} ${baseY} Z` : ''
  const tickCount = 4
  const gridValues = Array.from({ length: tickCount + 1 }, (_, i) => (max / tickCount) * i)

  const svgRef = useRef(null)
  const [hover, setHover] = useState(null)
  function handleMove(event) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    if (!rect.width) return
    const svgX = ((event.clientX - rect.left) / rect.width) * W
    let idx = Math.round(((svgX - pad.left) / plotW) * (n - 1))
    idx = Math.max(0, Math.min(n - 1, idx))
    setHover(idx)
  }

  const tipW = 150
  const tipH = 64
  const hoverRow = hover != null ? data[hover] : null
  const hoverX = hover != null ? xAt(hover) : 0
  const tipX = Math.max(pad.left, Math.min(W - pad.right - tipW, hoverX - tipW / 2))
  const tipY = pad.top + 4

  return (
    <div style={styles.lineChart}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: 'auto', display: 'block' }}
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="lc-rev-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACE_BLUE} stopOpacity="0.26" />
            <stop offset="100%" stopColor={ACE_BLUE} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lc-exp-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACE_RED} stopOpacity="0.20" />
            <stop offset="100%" stopColor={ACE_RED} stopOpacity="0" />
          </linearGradient>
        </defs>
        {gridValues.map((value, i) => {
          const y = yAt(value)
          return (
            <g key={i}>
              <line x1={pad.left} y1={y} x2={W - pad.right} y2={y} stroke="#eef1f6" strokeWidth="1" />
              <text x={pad.left - 8} y={y + 3} textAnchor="end" fontSize="9.5" fill="#98a2b3">{axisMoney(value)}</text>
            </g>
          )
        })}
        {data.map((row, i) => (
          <text key={i} x={xAt(i)} y={H - 10} textAnchor="middle" fontSize="9.5" fill={hover === i ? '#1d2939' : '#98a2b3'} fontWeight={hover === i ? 800 : 600}>{row.label}</text>
        ))}
        {expLine && <path d={areaOf(expLine, expPoints)} fill="url(#lc-exp-fill)" />}
        {revLine && <path d={areaOf(revLine, revPoints)} fill="url(#lc-rev-fill)" />}
        <path d={expLine} fill="none" stroke={ACE_RED} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <path d={revLine} fill="none" stroke={ACE_BLUE} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {expPoints.map((p, i) => <circle key={`e${i}`} cx={p.x} cy={p.y} r="3.2" fill="#fff" stroke={ACE_RED} strokeWidth="2" />)}
        {revPoints.map((p, i) => <circle key={`r${i}`} cx={p.x} cy={p.y} r="3.2" fill="#fff" stroke={ACE_BLUE} strokeWidth="2" />)}
        {hoverRow && (
          <g pointerEvents="none">
            <line x1={hoverX} y1={pad.top} x2={hoverX} y2={baseY} stroke="#cbd2dc" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={hoverX} cy={yAt(hoverRow.expense)} r="4.5" fill={ACE_RED} stroke="#fff" strokeWidth="1.5" />
            <circle cx={hoverX} cy={yAt(hoverRow.revenue)} r="4.5" fill={ACE_BLUE} stroke="#fff" strokeWidth="1.5" />
            <rect x={tipX} y={tipY} width={tipW} height={tipH} rx="7" fill="#fff" stroke="#e2e8f0" strokeWidth="1" opacity="0.97" />
            <text x={tipX + 10} y={tipY + 17} fontSize="10.5" fontWeight="800" fill="#1d2939">{hoverRow.label}</text>
            <circle cx={tipX + 13} cy={tipY + 33} r="3.5" fill={ACE_BLUE} />
            <text x={tipX + 22} y={tipY + 36} fontSize="10" fill="#475467">Revenue {money(hoverRow.revenue)}</text>
            <circle cx={tipX + 13} cy={tipY + 50} r="3.5" fill={ACE_RED} />
            <text x={tipX + 22} y={tipY + 53} fontSize="10" fill="#475467">Expense {money(hoverRow.expense)}</text>
          </g>
        )}
      </svg>
      <div style={styles.chartLegend}>
        <span><b style={{ background: ACE_BLUE }} />Revenue</span>
        <span><b style={{ background: ACE_RED }} />Expense</span>
      </div>
    </div>
  )
}

function Dashboard({ data }) {
  const received = sum(data.revenuePlans.filter(row => row.status === 'Received'), row => row.plannedAmount)
  const pending = sum(data.revenuePlans.filter(row => row.status === 'Pending'), row => row.plannedAmount)
  const overdue = sum(data.revenuePlans.filter(row => row.status === 'Overdue'), row => row.plannedAmount)
  const categoryRows = CATEGORIES
    .filter(row => row.budgetType !== 'Revenue')
    .map(cat => ({ ...cat, amount: sum(data.expenses.filter(exp => exp.expenseKey === cat.key), exp => exp.amount + vatAmount(exp)) }))
    .filter(row => row.amount > 0)
    .sort((a, b) => b.amount - a.amount)

  return (
    <>
      <div style={styles.statsGrid}>
        <StatCard label="TOTAL REVENUE" value={money(data.totalRevenue)} sub={`${data.revenues.length} revenue records`} />
        <StatCard label="TOTAL EXPENSES" value={money(data.totalExpense)} sub="Actual spending" tone="red" />
        <StatCard label="NET PROFIT" value={money(data.netProfit)} sub={`Margin ${data.margin.toFixed(1)}%`} tone="green" />
        <StatCard label="BUDGET UTILIZATION" value={`${data.utilization.toFixed(1)}%`} sub={`${money(data.totalExpense)} / ${money(data.totalPlanned)}`} tone="amber" />
      </div>

      <div style={styles.revenueStrip}>
        <div>
          <div style={styles.stripTitle}>REVENUE COLLECTION PLAN</div>
          <div style={styles.stripSub}>Planned, received, pending and overdue billing</div>
        </div>
        <div style={styles.stripMetric}><span>Planned</span><strong>{money(sum(data.revenuePlans, r => r.plannedAmount))}</strong></div>
        <div style={styles.stripMetric}><span>Received</span><strong>{money(received)}</strong></div>
        <div style={styles.stripMetric}><span>Pending</span><strong>{money(pending)}</strong></div>
        <div style={styles.stripMetric}><span>Overdue</span><strong>{money(overdue)}</strong></div>
      </div>

      <div style={styles.contentGrid}>
        <Panel title="Monthly Revenue vs Expenses">
          <LineChart rows={FINANCIAL_MONTHLY_TREND} />
        </Panel>
        <Panel title="Expense by Category">
          <div style={styles.categoryList}>
            {categoryRows.map(row => (
              <div key={row.key} style={styles.categoryRow}>
                <div>
                  <strong>{row.category}</strong>
                  <span>{row.item}</span>
                </div>
                <div>{money(row.amount)}</div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="By Project">
          <BarCompare rows={data.byProject.map(row => ({ label: row.code, revenue: row.revenue, expense: row.expense }))} />
        </Panel>
        <Panel title="Recent Transactions">
          <div style={styles.txList}>
            {data.recent.map(tx => (
              <div key={tx.id} style={styles.txRow}>
                <div>
                  <strong>{tx.type}</strong>
                  <span>{tx.date} · {projectName(tx.projectId)} · {tx.description}</span>
                </div>
                <b style={{ color: tx.type === 'Revenue' ? ACE_BLUE : ACE_RED }}>{money(tx.amount)}</b>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  )
}

function Executive({ data }) {
  return (
    <>
      <div style={{ ...styles.statsGrid, gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' }}>
        <StatCard label="Revenue" value={money(data.totalRevenue)} sub="Actual" />
        <StatCard label="Expenses" value={money(data.totalExpense)} sub="Actual" tone="red" />
        <StatCard label="Net Profit" value={money(data.netProfit)} sub="Revenue - expense" tone="green" />
        <StatCard label="Margin" value={`${data.margin.toFixed(1)}%`} sub="Profit ratio" />
        <StatCard label="Planned" value={money(data.totalPlanned)} sub="Expense plan" tone="amber" />
        <StatCard label="Variance" value={money(data.totalPlanned - data.totalExpense)} sub="Plan - actual" tone="green" />
      </div>
      <div style={styles.contentGrid}>
        <Panel title="Revenue Trend">
          <LineChart rows={FINANCIAL_MONTHLY_TREND} />
        </Panel>
        <Panel title="Profit Waterfall">
          <BarCompare rows={data.monthly.map(row => ({ label: row.label, revenue: Math.max(row.profit, 0), expense: Math.abs(Math.min(row.profit, 0)) }))} />
        </Panel>
        <Panel title="Project Performance Matrix" wide>
          <DataTable
            headers={['Project', 'Revenue', 'Expense', 'Profit', 'Margin', 'Status']}
            rows={data.byProject.map(row => [
              `${row.code} · ${row.name}`,
              money(row.revenue),
              money(row.expense),
              money(row.profit),
              `${row.margin.toFixed(1)}%`,
              <StatusPill status={row.profit >= 0 ? 'Profitable' : 'Loss'} />,
            ])}
          />
        </Panel>
      </div>
    </>
  )
}

function DataTable({ headers, rows }) {
  return (
    <div style={styles.tableWrap}>
      <table>
        <thead>
          <tr>{headers.map(header => <th key={header}>{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RecordsPage({ type, data }) {
  if (type === 'revenue') {
    return (
      <Panel title="Revenue Records" action={<button style={styles.primaryButton}>+ Add Revenue</button>} wide>
        <DataTable
          headers={['Date', 'Project', 'Category', 'Amount', 'Description', 'Status']}
          rows={data.revenues.map(row => [row.date, projectName(row.projectId), categoryName(row.expenseKey), money(row.amount), row.description, <StatusPill status="Received" />])}
        />
      </Panel>
    )
  }

  if (type === 'revenuePlan') {
    return (
      <Panel title="Revenue Plan" action={<button style={styles.primaryButton}>+ Add Plan</button>} wide>
        <DataTable
          headers={['ID', 'Project', 'Planned Date', 'Planned Amount', 'Status', 'Remark']}
          rows={data.revenuePlans.map(row => [row.id, projectName(row.projectId), row.plannedDate, money(row.plannedAmount), <StatusPill status={row.status} />, row.remark])}
        />
      </Panel>
    )
  }

  if (type === 'expensePlan') {
    return (
      <Panel title="Expense Plans" action={<button style={styles.primaryButton}>+ Add Plan</button>} wide>
        <DataTable
          headers={['Month/Year', 'Project', 'Category', 'Planned', 'Description']}
          rows={data.expensePlans.map(row => [`${MONTHS[row.month - 1]} ${row.year}`, projectName(row.projectId), categoryName(row.expenseKey), money(row.plannedAmount), row.description])}
        />
      </Panel>
    )
  }

  return null
}

function ExpensePage({ data }) {
  const [tab, setTab] = useState('actual')
  const totalVat = sum(data.expenses, vatAmount)
  return (
    <>
      <div style={styles.segment}>
        <button type="button" onClick={() => setTab('actual')} style={tab === 'actual' ? styles.segmentActive : styles.segmentButton}>Expense Actual</button>
        <button type="button" onClick={() => setTab('submit')} style={tab === 'submit' ? styles.segmentActive : styles.segmentButton}>Submit Expense</button>
      </div>
      {tab === 'actual' ? (
        <Panel title="Expense Actual" action={<button style={styles.primaryButton}>+ Add Row</button>} wide>
          <div style={styles.inlineSummary}>
            <strong>{data.expenses.length} rows</strong>
            <span>Amount: {money(sum(data.expenses, row => row.amount))}</span>
            <span>VAT: {money(totalVat)}</span>
            <span>Grand Total: {money(data.totalExpense)}</span>
          </div>
          <DataTable
            headers={['Date', 'Project', 'Expense Key', 'Vendor', 'Bill No', 'Amount', 'VAT', 'Total', 'Status']}
            rows={data.expenses.map(row => [row.date, projectName(row.projectId), categoryName(row.expenseKey), row.vendor, row.billNo, money(row.amount), money(vatAmount(row)), money(row.amount + vatAmount(row)), <StatusPill status={row.status} />])}
          />
        </Panel>
      ) : (
        <Panel title="Submit Expense" action={<button style={styles.primaryButton}>Submit All</button>} wide>
          <div style={styles.formGrid}>
            <Field label="Project" value="RF-EEC" />
            <Field label="Expense Key" value="Fuel / Tollway" />
            <Field label="Vendor" value="PTT" />
            <Field label="Bill No" value="B-1007" />
            <Field label="Amount" value="12500" />
            <Field label="VAT %" value="7" />
            <Field label="Description" value="Field trip fuel reimbursement" wide />
          </div>
        </Panel>
      )}
    </>
  )
}

function Field({ label, value, wide = false }) {
  return (
    <label style={{ ...styles.fieldLabel, ...(wide ? { gridColumn: '1 / -1' } : {}) }}>
      <span>{label}</span>
      <input value={value} readOnly />
    </label>
  )
}

function ComparePage({ data, mode }) {
  const byProjectRows = data.byProject.map(row => [
    `${row.code} · ${row.name}`,
    money(row.revenue),
    money(row.expense),
    money(row.planned),
    money(row.planned - row.expense),
  ])
  return (
    <div style={styles.contentGrid}>
      <Panel title={mode === 'plan' ? 'Plan vs Actual Expenses' : 'Revenue vs Expenses'}>
        <BarCompare rows={data.monthly.map(row => ({ label: row.label, revenue: mode === 'plan' ? row.planned : row.revenue, expense: row.expense }))} />
      </Panel>
      <Panel title="Monthly Summary">
        <DataTable
          headers={['Month', mode === 'plan' ? 'Planned' : 'Revenue', 'Expense', 'Profit / Variance']}
          rows={data.monthly.filter(row => row.revenue || row.expense || row.planned).map(row => [
            row.label,
            money(mode === 'plan' ? row.planned : row.revenue),
            money(row.expense),
            money(mode === 'plan' ? row.planned - row.expense : row.profit),
          ])}
        />
      </Panel>
      <Panel title="Project Breakdown" wide>
        <DataTable headers={['Project', 'Revenue', 'Expense', 'Planned', 'Variance']} rows={byProjectRows} />
      </Panel>
    </div>
  )
}

function ReportsPage({ data }) {
  return (
    <div style={styles.contentGrid}>
      <Panel title="Export Data">
        <div style={styles.exportGrid}>
          {['Revenue', 'Expenses', 'Plans', 'Categories'].map(item => (
            <button key={item} style={styles.exportButton}>{item} CSV</button>
          ))}
        </div>
      </Panel>
      <Panel title="Report Summary">
        <DataTable
          headers={['Metric', 'Value']}
          rows={[
            ['Revenue records', data.revenues.length],
            ['Expense records', data.expenses.length],
            ['Revenue plan records', data.revenuePlans.length],
            ['Expense plan records', data.expensePlans.length],
            ['Projects', PROJECTS.length],
          ]}
        />
      </Panel>
    </div>
  )
}

function AdminPage() {
  const [tab, setTab] = useState('projects')
  return (
    <>
      <div style={styles.segment}>
        {['projects', 'categories', 'details', 'users'].map(item => (
          <button key={item} type="button" onClick={() => setTab(item)} style={tab === item ? styles.segmentActive : styles.segmentButton}>
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>
      {tab === 'projects' && (
        <Panel title="Projects" wide>
          <DataTable headers={['Code', 'Name', 'PM', 'Status', 'Start', 'End']} rows={PROJECTS.map(row => [row.code, row.name, row.pm, <StatusPill status={row.status} />, row.start, row.end])} />
        </Panel>
      )}
      {tab === 'categories' && (
        <Panel title="Expense Keys" wide>
          <DataTable headers={['Key', 'Category', 'Item', 'Account', 'Budget', 'Active']} rows={CATEGORIES.map(row => [row.key, row.category, row.item, row.account, row.budgetType, <StatusPill status={row.active === 'Y' ? 'Active' : 'Inactive'} />])} />
        </Panel>
      )}
      {tab === 'details' && (
        <Panel title="Expense Details" wide>
          <DataTable headers={['Detail Key', 'Expense Key', 'Usage', 'Sub Category', 'Detail', 'Active']} rows={DETAILS.map(row => [row.detailKey, row.expenseKey, row.usage, row.sub, row.detail, <StatusPill status={row.active === 'Y' ? 'Active' : 'Inactive'} />])} />
        </Panel>
      )}
      {tab === 'users' && (
        <Panel title="System Users" wide>
          <DataTable headers={['Email', 'Name', 'Role', 'Created']} rows={USERS.map(row => [row.email, row.name, row.role, row.created])} />
        </Panel>
      )}
    </>
  )
}

function financialMoney(value) {
  if (value == null) return ''
  return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function cumulativeSeries(values) {
  let lastIdx = -1
  values.forEach((v, i) => { if (v != null) lastIdx = i })
  if (lastIdx < 0) return values.map(() => null)
  let running = 0
  let started = false
  return values.map((value, i) => {
    if (i > lastIdx) return null
    if (value != null) {
      started = true
      running += Number(value)
      return running
    }
    return started ? running : null
  })
}

function niceCeil(value) {
  if (!value || value <= 0) return 1
  const pow = Math.pow(10, Math.floor(Math.log10(value)))
  const normalized = value / pow
  let step = 10
  if (normalized <= 1) step = 1
  else if (normalized <= 2) step = 2
  else if (normalized <= 5) step = 5
  return step * pow
}

function abbreviateNumber(value) {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return (value / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2) + 'M'
  if (abs >= 1_000) return (value / 1_000).toFixed(0) + 'K'
  return value.toFixed(0)
}

function axisTickLabel(value) {
  if (value === 0) return '0'
  if (Math.abs(value) >= 1_000_000) return (value / 1_000_000).toFixed(0) + 'M'
  if (Math.abs(value) >= 1_000) return (value / 1_000).toFixed(0) + 'K'
  return value.toFixed(0)
}

function FinancialChart({ subset, hiddenBars, hiddenLines, showValues, onToggleBar, onToggleLine, onToggleValues }) {
  const dataset = FINANCIAL_DATA[subset]
  const months = FINANCIAL_MONTHS
  const cumulative = {}
  FINANCIAL_LINE_SERIES.forEach(s => { cumulative[s.key] = cumulativeSeries(dataset[s.key]) })

  const visibleBars = FINANCIAL_BAR_SERIES.filter(s => !hiddenBars.has(s.key))
  const visibleLines = FINANCIAL_LINE_SERIES.filter(s => !hiddenLines.has(s.key))

  const barMaxRaw = Math.max(0, ...visibleBars.flatMap(s => dataset[s.key].map(v => v || 0)))
  const lineMaxRaw = Math.max(0, ...visibleLines.flatMap(s => cumulative[s.key].map(v => v || 0)))
  const barMax = niceCeil(barMaxRaw) || 20000000
  const lineMax = niceCeil(lineMaxRaw) || 150000000

  const width = 1280
  const height = 440
  const pad = { top: 24, right: 96, bottom: 56, left: 96 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom
  const groupW = innerW / months.length
  const barSlot = visibleBars.length || 1
  const barW = Math.max(3, (groupW * 0.72) / barSlot)
  const groupStart = i => pad.left + i * groupW + (groupW - barW * barSlot) / 2

  const yBar = v => pad.top + innerH - (Math.max(0, v) / barMax) * innerH
  const yLine = v => pad.top + innerH - (Math.max(0, v) / lineMax) * innerH
  const xCenter = i => pad.left + groupW * i + groupW / 2

  const linePath = values => {
    const points = []
    values.forEach((v, i) => {
      if (v == null) return
      points.push(`${xCenter(i).toFixed(1)},${yLine(v).toFixed(1)}`)
    })
    return points.length > 1 ? 'M' + points.join(' L') : ''
  }

  const ticks = [0, 0.25, 0.5, 0.75, 1]

  return (
    <div style={styles.financialChartWrap}>
      <div style={styles.financialToolbar}>
        <div style={styles.financialToolbarHint}>คลิกที่ legend เพื่อปิด/เปิด series</div>
        <label style={styles.financialToolbarLabel}>
          <input type="checkbox" checked={showValues} onChange={onToggleValues} style={{ accentColor: ACE_BLUE }} />
          <span>Show values</span>
        </label>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" style={styles.financialSvg}>
        <defs>
          {FINANCIAL_BAR_SERIES.map(s => (
            <linearGradient key={`grad-${s.key}`} id={`fin-bar-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.95" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.7" />
            </linearGradient>
          ))}
        </defs>
        <rect x={pad.left} y={pad.top} width={innerW} height={innerH} fill="#fbfcfe" />
        {ticks.map(t => {
          const y = pad.top + innerH - t * innerH
          return (
            <g key={t}>
              <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray={t === 0 ? '' : '3 4'} />
              <text x={pad.left - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#667085" fontWeight="600">{axisTickLabel(barMax * t)}</text>
              <text x={width - pad.right + 10} y={y + 4} textAnchor="start" fontSize="11" fill="#667085" fontWeight="600">{axisTickLabel(lineMax * t)}</text>
            </g>
          )
        })}
        <line x1={pad.left} x2={pad.left} y1={pad.top} y2={pad.top + innerH} stroke="#e2e8f0" />
        <line x1={width - pad.right} x2={width - pad.right} y1={pad.top} y2={pad.top + innerH} stroke="#e2e8f0" />
        {months.map((label, i) => (
          <text key={label} x={xCenter(i)} y={height - pad.bottom + 20} textAnchor="middle" fontSize="11" fill="#475467" fontWeight="700">{label}</text>
        ))}
        {months.map((_, monthIdx) => (
          <g key={monthIdx}>
            {visibleBars.map((s, seriesIdx) => {
              const value = dataset[s.key][monthIdx]
              if (value == null || value <= 0) return null
              const x = groupStart(monthIdx) + seriesIdx * barW
              const y = yBar(value)
              const h = pad.top + innerH - y
              return (
                <g key={s.key}>
                  <rect x={x} y={y} width={barW - 0.6} height={Math.max(1, h)} fill={`url(#fin-bar-${s.key})`} rx={Math.min(1.5, barW / 3)}>
                    <title>{`${s.label} · ${months[monthIdx]}: ${financialMoney(value)}`}</title>
                  </rect>
                  {showValues && h > 14 && (
                    <text x={x + (barW - 0.6) / 2} y={y - 4} textAnchor="middle" fontSize="9" fill="#1d2939" fontWeight="800" transform={`rotate(-90 ${x + (barW - 0.6) / 2} ${y - 4})`}>{abbreviateNumber(value)}</text>
                  )}
                </g>
              )
            })}
          </g>
        ))}
        {visibleLines.map(s => {
          const d = linePath(cumulative[s.key])
          if (!d) return null
          return (
            <g key={s.key}>
              <path d={d} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.95" />
              {cumulative[s.key].map((v, i) => {
                if (v == null) return null
                return (
                  <g key={i}>
                    <circle cx={xCenter(i)} cy={yLine(v)} r={3.5} fill="#fff" stroke={s.color} strokeWidth="2">
                      <title>{`${s.label} · ${months[i]}: ${financialMoney(v)}`}</title>
                    </circle>
                    {showValues && (
                      <text x={xCenter(i)} y={yLine(v) - 9} textAnchor="middle" fontSize="9" fill={s.color} fontWeight="800">{abbreviateNumber(v)}</text>
                    )}
                  </g>
                )
              })}
            </g>
          )
        })}
        <text x={26} y={pad.top + innerH / 2} transform={`rotate(-90 26 ${pad.top + innerH / 2})`} textAnchor="middle" fontSize="11" fill="#475467" fontWeight="800" letterSpacing="0.04em">BAR CHART</text>
        <text x={width - 26} y={pad.top + innerH / 2} transform={`rotate(90 ${width - 26} ${pad.top + innerH / 2})`} textAnchor="middle" fontSize="11" fill="#475467" fontWeight="800" letterSpacing="0.04em">LINE CHART (CUMULATIVE)</text>
      </svg>
      <div style={styles.financialLegend}>
        {FINANCIAL_BAR_SERIES.map(s => {
          const off = hiddenBars.has(s.key)
          return (
            <button key={`bar-${s.key}`} type="button" onClick={() => onToggleBar(s.key)} style={{ ...styles.financialLegendBtn, ...(off ? styles.financialLegendBtnOff : {}) }}>
              <i style={{ ...styles.financialLegendBar, background: s.color, opacity: off ? 0.35 : 1 }} />
              <span style={{ textDecoration: off ? 'line-through' : 'none' }}>{s.label}</span>
            </button>
          )
        })}
        <span style={styles.financialLegendDivider} />
        {FINANCIAL_LINE_SERIES.map(s => {
          const off = hiddenLines.has(s.key)
          return (
            <button key={`line-${s.key}`} type="button" onClick={() => onToggleLine(s.key)} style={{ ...styles.financialLegendBtn, ...(off ? styles.financialLegendBtnOff : {}) }}>
              <i style={{ ...styles.financialLegendLine, background: s.color, opacity: off ? 0.35 : 1 }} />
              <span style={{ textDecoration: off ? 'line-through' : 'none' }}>{s.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function FinancialTable({ subset }) {
  const dataset = FINANCIAL_DATA[subset]
  const cumulative = {}
  FINANCIAL_LINE_SERIES.forEach(s => { cumulative[s.key] = cumulativeSeries(dataset[s.key]) })
  const rows = [
    ['Plan Revenue', dataset.planRevenue, false],
    ['Plan Expense', dataset.planExpense, false],
    ['Revenue Actual', dataset.revenueActual, false],
    ['Expense Actual', dataset.expenseActual, false],
    ['Acc Invoice Done', dataset.accInvoiceDone, false],
    ['Cum_Plan Revenue', cumulative.planRevenue, true],
    ['Cum_Plan Expense', cumulative.planExpense, true],
    ['Cum_Revenue Actual', cumulative.revenueActual, true],
    ['Cum_Expense Actual', cumulative.expenseActual, true],
    ['Cum_Actual Invoice Done', cumulative.accInvoiceDone, true],
  ]
  return (
    <div style={styles.financialTableWrap}>
      <table style={styles.financialTable}>
        <thead>
          <tr>
            <th style={styles.financialHeadLeft}></th>
            {FINANCIAL_MONTHS.map(month => <th key={month} style={styles.financialHeadMonth}>{month}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, values, isCumulative], rowIdx) => {
            const isFirstCum = isCumulative && rowIdx > 0 && !rows[rowIdx - 1][2]
            const labelStyle = {
              ...styles.financialLabelCell,
              ...(isCumulative ? { background: '#f5f7fb', color: '#475467' } : {}),
              ...(isFirstCum ? { borderTop: '2px solid #e2e8f0' } : {}),
            }
            const cellStyle = {
              ...styles.financialCell,
              ...(isCumulative ? { color: '#475467', background: '#fcfdff' } : {}),
              ...(isFirstCum ? { borderTop: '2px solid #e2e8f0' } : {}),
            }
            return (
              <tr key={label}>
                <td style={labelStyle}>{label}</td>
                {values.map((value, i) => (
                  <td key={i} style={cellStyle}>{financialMoney(value)}</td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function FinancialReportPage({ subset, setSubset }) {
  const active = FINANCIAL_SUBSETS.find(item => item.key === subset) || FINANCIAL_SUBSETS[0]
  const [hiddenBars, setHiddenBars] = useState(() => new Set())
  const [hiddenLines, setHiddenLines] = useState(() => new Set())
  const [showValues, setShowValues] = useState(false)

  const toggle = (collection, setCollection) => key => {
    const next = new Set(collection)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setCollection(next)
  }

  const reportVersion = useMemo(() => {
    const now = new Date()
    const pad = n => String(n).padStart(2, '0')
    return `${String(now.getFullYear()).slice(2)}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}.${pad(now.getHours())}.${pad(now.getMinutes())}`
  }, [subset])

  return (
    <div style={styles.financialReport}>
      <div style={styles.financialReportHead}>
        <div>
          <div style={styles.financialReportTitle}>
            <span style={styles.financialReportTitlePrefix}>Financial Report</span>
            <span style={styles.financialReportTitleSep}>|</span>
            <span style={styles.financialReportTitleSubset}>{active.label === 'Revenue ALL' ? 'Revenue ALL' : `${active.label} Account`}</span>
          </div>
          <div style={styles.financialReportSubtitle}>The Document confidential for financial</div>
        </div>
        <div style={styles.financialReportVersion}>Version {reportVersion}</div>
      </div>

      <div style={styles.financialSubsetSwitch}>
        {FINANCIAL_SUBSETS.map(item => (
          <button
            key={item.key}
            type="button"
            onClick={() => setSubset(item.key)}
            style={subset === item.key ? styles.financialSubsetActive : styles.financialSubsetButton}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section style={styles.financialCard}>
        <div style={styles.financialCardHead}>
          <div style={styles.financialCardTitle}>{active.chartTitle}</div>
        </div>
        <FinancialChart
          subset={subset}
          hiddenBars={hiddenBars}
          hiddenLines={hiddenLines}
          showValues={showValues}
          onToggleBar={toggle(hiddenBars, setHiddenBars)}
          onToggleLine={toggle(hiddenLines, setHiddenLines)}
          onToggleValues={() => setShowValues(v => !v)}
        />
      </section>

      <section style={styles.financialCard}>
        <div style={styles.financialCardHead}>
          <div style={styles.financialCardTitle}>{active.label} — Monthly Detail</div>
        </div>
        <FinancialTable subset={subset} />
      </section>
    </div>
  )
}

export default function RevenueExpensePage({ authenticatedUser = null, onLogout = null }) {
  const [page, setPage] = useState('dashboard')
  const [year, setYear] = useState('2026')
  const [projectId, setProjectId] = useState('')
  const [financialSubset, setFinancialSubset] = useState('all')

  const data = useMemo(() => {
    const match = row => {
      const date = row.date || row.plannedDate || `${row.year}-${String(row.month).padStart(2, '0')}-01`
      if (year && String(date).slice(0, 4) !== year) return false
      if (projectId && row.projectId !== projectId) return false
      return true
    }
    const revenues = REVENUES.filter(match)
    const expenses = EXPENSES.filter(match)
    const expensePlans = EXPENSE_PLANS.filter(match)
    const revenuePlans = REVENUE_PLANS.filter(match)
    const monthly = groupMonthly(revenues, expenses, expensePlans)
    const byProject = PROJECTS.map(project => {
      const revenue = sum(revenues.filter(row => row.projectId === project.id), row => row.amount)
      const expense = sum(expenses.filter(row => row.projectId === project.id), row => row.amount + vatAmount(row))
      const planned = sum(expensePlans.filter(row => row.projectId === project.id), row => row.plannedAmount)
      const profit = revenue - expense
      return { ...project, revenue, expense, planned, profit, margin: revenue ? (profit / revenue) * 100 : 0 }
    }).filter(row => row.revenue || row.expense || row.planned)
    const totalRevenue = sum(revenues, row => row.amount)
    const totalExpense = sum(expenses, row => row.amount + vatAmount(row))
    const totalPlanned = sum(expensePlans, row => row.plannedAmount)
    const netProfit = totalRevenue - totalExpense
    const recent = [
      ...revenues.map(row => ({ ...row, type: 'Revenue' })),
      ...expenses.map(row => ({ ...row, type: 'Expense' })),
    ].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 8)
    return {
      revenues,
      expenses,
      expensePlans,
      revenuePlans,
      monthly,
      byProject,
      totalRevenue,
      totalExpense,
      totalPlanned,
      netProfit,
      margin: totalRevenue ? (netProfit / totalRevenue) * 100 : 0,
      utilization: totalPlanned ? (totalExpense / totalPlanned) * 100 : 0,
      recent,
    }
  }, [year, projectId])

  const meta = {
    dashboard: ['Revenue & Expense', 'Financial dashboard, plans, actuals, and project profitability'],
    executive: ['Executive View', 'Management summary for revenue, spending, profit and variance'],
    financial: ['Financial Report', 'Monthly plan vs actual with cumulative revenue, expense and invoice tracking'],
    revenue: ['Revenue', 'Actual revenue records and received transactions'],
    revenuePlan: ['Revenue Plan', 'Expected billing and collection tracking'],
    expense: ['Expense', 'Expense actual and submit expense workflow'],
    expensePlan: ['Expense Plans', 'Monthly planned spending by project and category'],
    compare: ['Rev vs Exp', 'Revenue and expense comparison analysis'],
    planActual: ['Plan vs Actual', 'Expense budget variance tracking'],
    reports: ['Reports & Export', 'Export and summary reports'],
    admin: ['Admin Settings', 'Projects, expense keys, details and user access'],
  }[page]

  return (
    <PageShell page={page} setPage={setPage} authenticatedUser={authenticatedUser} onLogout={onLogout}>
      <Header title={meta[0]} subtitle={meta[1]}>
        <select value={year} onChange={event => setYear(event.target.value)} style={styles.select}>
          <option value="2026">2026</option>
          <option value="2025">2025</option>
        </select>
        <select value={projectId} onChange={event => setProjectId(event.target.value)} style={styles.select}>
          <option value="">All Projects</option>
          {PROJECTS.map(project => <option key={project.id} value={project.id}>{project.code}</option>)}
        </select>
        <button type="button" style={styles.headerButton}>+ Add Transaction</button>
      </Header>
      <section style={styles.body}>
        {(page === 'dashboard' || page === 'expense') && <ScannedBillsBanner />}
        {page === 'dashboard' && <Dashboard data={data} />}
        {page === 'executive' && <Executive data={data} />}
        {page === 'financial' && <FinancialReportPage subset={financialSubset} setSubset={setFinancialSubset} />}
        {page === 'revenue' && <RecordsPage type="revenue" data={data} />}
        {page === 'revenuePlan' && <RecordsPage type="revenuePlan" data={data} />}
        {page === 'expense' && <ExpensePage data={data} />}
        {page === 'expensePlan' && <RecordsPage type="expensePlan" data={data} />}
        {page === 'compare' && <ComparePage data={data} mode="compare" />}
        {page === 'planActual' && <ComparePage data={data} mode="plan" />}
        {page === 'reports' && <ReportsPage data={data} />}
        {page === 'admin' && <AdminPage />}
      </section>
    </PageShell>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    background: '#f5f7fb',
    color: '#0f172a',
  },
  sidebar: {
    width: 232,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    padding: 14,
    background: 'rgba(255,255,255,.95)',
    borderRight: '1px solid #e2e8f0',
    color: '#0f172a',
  },
  brandBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '6px 4px 18px',
  },
  logo: {
    width: 38,
    height: 38,
    display: 'grid',
    placeItems: 'center',
    borderRadius: 12,
    background: ACE_GRADIENT,
    color: '#fff',
    fontWeight: 900,
    fontSize: '.86rem',
    boxShadow: '0 8px 18px rgba(36,71,216,.26)',
  },
  brandTitle: { fontSize: '.9rem', fontWeight: 900, color: '#020617' },
  brandSub: { marginTop: 2, color: '#94a3b8', fontSize: '.68rem', fontWeight: 800 },
  navLabel: { margin: '4px 6px 8px', color: '#94a3b8', fontSize: '.66rem', fontWeight: 850, letterSpacing: '.04em' },
  nav: { display: 'grid', gap: 3 },
  navButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: '7px 11px',
    border: 'none',
    borderRadius: 12,
    color: '#64748b',
    background: 'transparent',
    textAlign: 'left',
    fontWeight: 800,
    fontSize: '.82rem',
    cursor: 'pointer',
    transition: 'background .15s ease, color .15s ease',
  },
  navButtonActive: {
    color: '#2447d8',
    background: '#eff6ff',
    boxShadow: '0 1px 2px rgba(15,23,42,.06)',
  },
  adminCard: {
    marginTop: 'auto',
    padding: 12,
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    background: '#f5f7fb',
  },
  adminTitle: { fontSize: '.76rem', fontWeight: 900, color: '#0f172a' },
  adminMail: { marginTop: 4, color: '#64748b', fontSize: '.72rem', overflow: 'hidden', textOverflow: 'ellipsis' },
  logout: {
    width: '100%',
    marginTop: 12,
    padding: '9px 10px',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    color: '#334155',
    background: '#fff',
    cursor: 'pointer',
    fontWeight: 850,
  },
  main: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' },
  header: {
    minHeight: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    padding: '14px 20px',
    color: '#0f172a',
    background: 'transparent',
    borderBottom: '1px solid #e2e8f0',
  },
  h1: { margin: 0, fontSize: '1.12rem', lineHeight: 1.15, fontWeight: 850, letterSpacing: '-0.01em', color: '#020617' },
  subtitle: { margin: '4px 0 0', color: '#64748b', fontSize: '.76rem', fontWeight: 650 },
  headerActions: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' },
  select: {
    height: 38,
    width: 150,
    minWidth: 128,
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    padding: '0 10px',
    color: '#1d2939',
    background: '#fff',
    fontWeight: 750,
  },
  headerButton: {
    height: 38,
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    padding: '0 14px',
    color: '#2447d8',
    background: '#eff6ff',
    fontWeight: 900,
    cursor: 'pointer',
  },
  body: {},
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    minHeight: 84,
    padding: 14,
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    background: '#fff',
    boxShadow: '0 6px 16px rgba(15,23,42,.06)',
  },
  statLabel: { color: '#52637a', fontSize: '.66rem', fontWeight: 900, letterSpacing: '.03em' },
  statValue: { marginTop: 6, fontSize: '1.2rem', lineHeight: 1.1, fontWeight: 800, letterSpacing: '-0.01em' },
  statSub: { marginTop: 5, color: '#8a97aa', fontSize: '.7rem', fontWeight: 650 },
  revenueStrip: {
    display: 'grid',
    gridTemplateColumns: '1.3fr repeat(4, minmax(0, 1fr))',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    padding: 14,
    border: '1px solid #e2e8f0',
    borderLeft: `4px solid ${ACE_BLUE}`,
    borderRadius: 14,
    background: '#fff',
    boxShadow: '0 6px 16px rgba(15,23,42,.06)',
  },
  stripTitle: { color: ACE_BLUE, fontSize: '.78rem', fontWeight: 950, letterSpacing: '.04em' },
  stripSub: { marginTop: 5, color: '#8a97aa', fontSize: '.76rem', fontWeight: 650 },
  stripMetric: { display: 'grid', gap: 6 },
  contentGrid: { display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 },
  panel: {
    minWidth: 0,
    padding: 16,
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    background: '#fff',
    boxShadow: '0 6px 16px rgba(15,23,42,.06)',
  },
  panelHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 },
  panelTitle: { color: '#1d2939', fontWeight: 800, fontSize: '.88rem' },
  primaryButton: {
    border: 'none',
    borderRadius: 6,
    padding: '9px 12px',
    color: '#fff',
    background: ACE_GRADIENT,
    fontSize: '.78rem',
    fontWeight: 900,
    cursor: 'pointer',
  },
  barChart: { height: 220, display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', alignItems: 'end', gap: 10, paddingTop: 16 },
  barGroup: { height: '100%', minWidth: 0, display: 'grid', gridTemplateRows: '1fr auto', gap: 8 },
  barPair: { height: '100%', display: 'flex', alignItems: 'end', justifyContent: 'center', gap: 4, borderBottom: '1px solid #e2e8f0' },
  bar: { width: 10, borderRadius: '5px 5px 0 0', minHeight: 4 },
  barLabel: { color: '#667085', fontSize: '.68rem', textAlign: 'center', fontWeight: 750 },
  lineChart: { width: '100%', maxWidth: 480, margin: '0 auto' },
  svgChart: { width: '100%', height: 190, background: 'linear-gradient(180deg,#fff 0%,#f5f7fb 100%)' },
  chartLegend: { display: 'flex', gap: 18, marginTop: 10, color: '#667085', fontSize: '.78rem', fontWeight: 800 },
  categoryList: { display: 'grid', gap: 10 },
  categoryRow: { display: 'flex', justifyContent: 'space-between', gap: 12, padding: 12, border: '1px solid #edf0f5', borderRadius: 7 },
  txList: { display: 'grid', gap: 10 },
  txRow: { display: 'flex', justifyContent: 'space-between', gap: 12, padding: 11, borderBottom: '1px solid #edf0f5' },
  tableWrap: { overflowX: 'auto' },
  pill: { display: 'inline-flex', alignItems: 'center', minHeight: 24, padding: '4px 9px', borderRadius: 999, fontSize: '.72rem', fontWeight: 900 },
  segment: { display: 'inline-flex', gap: 4, padding: 4, marginBottom: 16, borderRadius: 8, background: '#e2e8f0' },
  segmentButton: { border: 'none', borderRadius: 6, padding: '9px 13px', color: '#52637a', background: 'transparent', fontWeight: 850, cursor: 'pointer' },
  segmentActive: { border: 'none', borderRadius: 6, padding: '9px 13px', color: '#fff', background: ACE_GRADIENT, fontWeight: 900, cursor: 'pointer' },
  inlineSummary: { display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 14, color: '#667085', fontSize: '.82rem' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 },
  fieldLabel: { display: 'grid', gap: 6, color: '#344054', fontSize: '.78rem', fontWeight: 850 },
  exportGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 },
  exportButton: { padding: 16, border: '1px solid #d8dee8', borderRadius: 7, background: '#f5f7fb', color: ACE_BLUE, fontWeight: 900, cursor: 'pointer' },
  financialReport: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 18 },
  financialReportHead: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
    padding: '14px 20px 16px',
    borderBottom: '1px solid #e2e8f0',
    background: 'linear-gradient(180deg,#fff 0%,#f5f7fb 100%)',
    borderRadius: '16px 16px 0 0',
  },
  financialReportTitle: { display: 'flex', alignItems: 'baseline', gap: 8, fontSize: '1.3rem', fontWeight: 900, letterSpacing: '-0.01em' },
  financialReportTitlePrefix: { color: ACE_BLUE },
  financialReportTitleSep: { color: '#475467', fontWeight: 400 },
  financialReportTitleSubset: { color: '#0ea5b7' },
  financialReportSubtitle: { marginTop: 4, color: '#8a97aa', fontSize: '.78rem', fontWeight: 600, letterSpacing: '.02em' },
  financialReportVersion: { color: '#8a97aa', fontSize: '.74rem', fontWeight: 700, letterSpacing: '.04em' },
  financialSubsetSwitch: {
    display: 'inline-flex',
    gap: 4,
    padding: 4,
    borderRadius: 8,
    background: '#e2e8f0',
    alignSelf: 'flex-start',
  },
  financialSubsetButton: {
    border: 'none',
    borderRadius: 6,
    padding: '9px 18px',
    color: '#475467',
    background: 'transparent',
    fontSize: '.82rem',
    fontWeight: 800,
    letterSpacing: '.02em',
    cursor: 'pointer',
  },
  financialSubsetActive: {
    border: 'none',
    borderRadius: 6,
    padding: '9px 18px',
    color: '#fff',
    background: ACE_GRADIENT,
    fontSize: '.82rem',
    fontWeight: 900,
    letterSpacing: '.02em',
    cursor: 'pointer',
    boxShadow: '0 8px 18px rgba(36,71,216,.18)',
  },
  financialCard: {
    minWidth: 0,
    padding: 14,
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    background: '#fff',
    boxShadow: '0 6px 16px rgba(15,23,42,.06)',
  },
  financialCardHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
    paddingBottom: 12,
    borderBottom: '1px solid #eef0f4',
  },
  financialCardTitle: { color: '#1d2939', fontWeight: 900, fontSize: '1rem', letterSpacing: '.01em' },
  financialChartWrap: { display: 'grid', gap: 14 },
  financialSvg: { width: '100%', height: 'auto', background: '#fff', borderRadius: 6 },
  financialToolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    padding: '8px 12px',
    border: '1px solid #eef0f4',
    borderRadius: 8,
    background: '#f5f7fb',
    color: '#475467',
    fontSize: '.78rem',
    fontWeight: 700,
  },
  financialToolbarLabel: { display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#1d2939' },
  financialToolbarHint: { color: '#8a97aa', fontWeight: 600, fontSize: '.74rem' },
  financialLegend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    padding: '10px 6px 4px',
    borderTop: '1px dashed #eef0f4',
  },
  financialLegendBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: 999,
    background: '#fff',
    color: '#1d2939',
    fontSize: '.76rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background .15s ease, border-color .15s ease',
  },
  financialLegendBtnOff: {
    background: '#f2f4f7',
    color: '#98a2b3',
    borderColor: '#e2e8f0',
  },
  financialLegendDivider: { width: 1, height: 18, background: '#e2e8f0', alignSelf: 'center', margin: '0 4px' },
  financialLegendBar: { display: 'inline-block', width: 14, height: 12, borderRadius: 3 },
  financialLegendLine: { display: 'inline-block', width: 22, height: 3, borderRadius: 2 },
  financialTableWrap: { minWidth: 0, maxWidth: '100%', overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 },
  financialTable: { width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '.78rem' },
  financialHeadLeft: {
    position: 'sticky',
    left: 0,
    zIndex: 2,
    padding: '10px 12px',
    background: '#fff7ed',
    color: '#7c2d12',
    textAlign: 'left',
    borderBottom: '2px solid #f4a868',
    minWidth: 200,
    fontSize: '.74rem',
    fontWeight: 900,
    letterSpacing: '.03em',
  },
  financialHeadMonth: {
    padding: '10px 12px',
    background: '#fff7ed',
    color: '#7c2d12',
    textAlign: 'right',
    borderBottom: '2px solid #f4a868',
    whiteSpace: 'nowrap',
    fontSize: '.74rem',
    fontWeight: 900,
    letterSpacing: '.03em',
  },
  financialLabelCell: {
    position: 'sticky',
    left: 0,
    zIndex: 1,
    padding: '8px 12px',
    background: '#fff',
    borderBottom: '1px solid #edf0f5',
    fontWeight: 800,
    color: '#1d2939',
    whiteSpace: 'nowrap',
  },
  financialCell: {
    padding: '8px 12px',
    borderBottom: '1px solid #edf0f5',
    borderLeft: '1px solid #f2f4f7',
    textAlign: 'right',
    color: '#1d2939',
    whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums',
  },
}
