export const ROLES = {
  ALL_STAFF: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'HR_ADMIN', 'HR_VIEWER', 'PROJECT_ADMIN', 'PM', 'DIRECTOR', 'ACCOUNTING', 'EMPLOYEE'],
  OPS: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'HR_ADMIN', 'HR_VIEWER', 'PROJECT_ADMIN', 'PM', 'DIRECTOR', 'ACCOUNTING'],
  HR: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'HR_ADMIN', 'HR_VIEWER', 'DIRECTOR'],
  HR_WRITE: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'HR_ADMIN'],
  PROJECT: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'PROJECT_ADMIN', 'PM', 'HR_ADMIN', 'DIRECTOR'],
  CLOCK_MONITOR: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'PROJECT_ADMIN', 'PM', 'HR_ADMIN', 'HR_VIEWER', 'DIRECTOR'],
  KPI: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'PROJECT_ADMIN', 'PM', 'HR_ADMIN', 'DIRECTOR'],
  FINANCE: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'PROJECT_ADMIN', 'HR_ADMIN', 'DIRECTOR', 'ACCOUNTING'],
  EXECUTIVE: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'HR_ADMIN', 'HR_VIEWER', 'PROJECT_ADMIN', 'PM', 'DIRECTOR', 'ACCOUNTING'],
  ADMIN: ['SUPER_ADMIN', 'SYSTEM_ADMIN'],
  ADMIN_HR: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'HR_ADMIN'],
  AUDIT: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'HR_ADMIN', 'DIRECTOR'],
  SYSTEM_MONITOR: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'HR_ADMIN', 'PROJECT_ADMIN', 'DIRECTOR'],
}

export const ROUTE_DEFINITIONS = {
  '/overview': {
    title: 'Overview',
    group: 'Overview',
    legacy: ['/AllPages', '/OverviewPage'],
    roles: ROLES.OPS,
    component: 'AllPages',
  },
  '/me': {
    title: 'My Profile',
    group: 'My Workspace',
    legacy: ['/account'],
    roles: ROLES.ALL_STAFF,
    component: 'MyProfilePage',
  },
  '/ClockApp': {
    title: 'Clock App',
    group: 'My Workspace',
    roles: ROLES.ALL_STAFF,
    component: 'ClockApp',
    protectedFromNormalization: true,
  },
  '/worklog/me': {
    title: 'Daily Work Log',
    group: 'KPI',
    roles: ROLES.ALL_STAFF,
    component: 'DailyWorklogPage',
  },
  '/office': {
    title: 'Virtual Office',
    group: 'My Workspace',
    roles: ROLES.ALL_STAFF,
    component: 'VirtualOfficePage',
  },
  '/approvals': {
    title: 'My Tasks / Approvals',
    group: 'My Workspace',
    legacy: ['/workflows'],
    roles: ROLES.ALL_STAFF,
    component: 'WorkflowCenterPage',
  },
  '/notifications': {
    title: 'Notifications',
    group: 'My Workspace',
    roles: ROLES.ALL_STAFF,
    component: 'NotificationCenterPage',
    comingSoon: true,
  },
  '/hr/employees': {
    title: 'HR Employees',
    group: 'HR',
    legacy: ['/HREmployeePage'],
    roles: ROLES.HR,
    component: 'HREmployeePage',
  },
  '/hr/analytics': {
    title: 'HR Analytics',
    group: 'HR',
    roles: ROLES.HR,
    component: 'HRAnalyticsPage',
    comingSoon: true,
  },
  '/clock/monitor': {
    title: 'Clock Monitor',
    group: 'Clock',
    legacy: ['/ClockMonitorPage'],
    roles: ROLES.CLOCK_MONITOR,
    // Per-user allowlist (in addition to roles above):
    // AE106 — Tipparat Buntaweelert (RF Project Admin, EMPLOYEE role)
    allowedEmployees: ['AE106'],
    component: 'ClockMonitorPage',
  },
  '/ui-kit': {
    title: 'ACE UI Kit',
    group: 'Support',
    roles: ROLES.ALL_STAFF,
    component: 'UiKitPage',
  },
  '/clock/wallboard': {
    title: 'Live Wallboard',
    group: 'Clock',
    roles: ROLES.CLOCK_MONITOR,
    component: 'ClockWallboardPage',
    protectedFromNormalization: true,
  },
  '/projects/manage': {
    title: 'Project Management',
    group: 'Project',
    legacy: ['/ProjectPage', '/ProjectPageManagement'],
    roles: ROLES.PROJECT,
    component: 'ProjectPage',
  },
  '/kpi/evaluation': {
    title: 'KPI Evaluation',
    group: 'KPI',
    legacy: ['/KPIPage'],
    roles: ROLES.KPI,
    component: 'KPIPage',
  },
  '/kpi/self-assessment': {
    title: 'My KPI (Self-Assessment)',
    group: 'KPI',
    roles: ROLES.ALL_STAFF,
    component: 'SelfAssessmentPage',
  },
  '/finance/revenue-expense': {
    title: 'Revenue & Expense',
    group: 'Finance',
    legacy: ['/RevenueExpensePage'],
    roles: ROLES.FINANCE,
    component: 'RevenueExpensePage',
  },
  '/finance/po-import': {
    title: 'นำเข้า PO (HW)',
    group: 'Finance',
    roles: ROLES.FINANCE,
    component: 'HWPOImportPage',
  },
  '/finance/dte-payments': {
    title: 'DTE Payments',
    group: 'Finance',
    roles: ROLES.FINANCE,
    component: 'DtePaymentsPage',
  },
  '/finance/bill-reader': {
    title: 'Bill Reader → PV',
    group: 'Finance',
    roles: ROLES.FINANCE,
    component: 'BillReaderPage',
  },
  '/finance/dta-billing': {
    title: 'DTA Billing (PAC)',
    group: 'Finance',
    roles: ROLES.FINANCE,
    component: 'DtaBillingPage',
  },
  '/finance/accounting': {
    title: 'Accounting (PV Ledger)',
    group: 'Finance',
    roles: ROLES.FINANCE,
    component: 'AccountingPage',
  },
  '/project/rf-monitor': {
    title: 'RF Monitor — HWT2304',
    group: 'Project',
    roles: ROLES.PROJECT,
    component: 'RFMonitorPage',
  },
  '/project/presite-monitor': {
    title: 'Pre-Site Monitor (DTE)',
    group: 'Project',
    roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'PROJECT_ADMIN', 'PM', 'DIRECTOR', 'HR_ADMIN', 'EMPLOYEE'],
    component: 'PreSiteMonitorPage',
  },
  '/project/presite-monitor-dta': {
    title: 'Pre-Site Monitor (DTA)',
    group: 'Project',
    roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'PROJECT_ADMIN', 'PM', 'DIRECTOR', 'HR_ADMIN', 'EMPLOYEE'],
    component: 'PreSiteMonitorDtaPage',
  },
  '/project/presite-monitor-dta/update': {
    title: 'DTA — Update My Progress',
    group: 'Project',
    roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'PROJECT_ADMIN', 'PM', 'DIRECTOR', 'HR_ADMIN', 'EMPLOYEE'],
    component: 'DtaUpdatePage',
  },
  '/project/report-upload': {
    title: 'Report Upload (DTE)',
    group: 'Project',
    roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'PROJECT_ADMIN', 'PM', 'DIRECTOR', 'HR_ADMIN', 'EMPLOYEE'],
    component: 'ReportUploadPage',
  },
  '/office/meeting-rooms': {
    title: 'จองห้องประชุม',
    group: 'Office',
    roles: ROLES.ALL_STAFF,
    component: 'MeetingRoomPage',
  },
  '/office/store': {
    title: 'สโตร์ Office',
    group: 'Office',
    roles: ROLES.ALL_STAFF,
    component: 'OfficeStorePage',
  },
  '/room-display': {
    title: 'Room Display (Kiosk)',
    group: 'Office',
    roles: ROLES.ALL_STAFF,
    component: 'RoomDisplayPage',
    protectedFromNormalization: true,
  },
  '/reports': {
    title: 'Report Center',
    group: 'Reports',
    roles: ROLES.OPS,
    component: 'ReportCenterPage',
    comingSoon: true,
  },
  '/executive/dashboard': {
    title: 'Executive Dashboard',
    group: 'Executive',
    legacy: ['/ExecutiveDashboard'],
    roles: ROLES.EXECUTIVE,
    component: 'ExecutiveDashboard',
  },
  '/admin/system-monitor': {
    title: 'System Monitor',
    group: 'Admin',
    legacy: ['/SystemMonitorPage'],
    roles: ROLES.SYSTEM_MONITOR,
    component: 'SystemMonitorPage',
  },
  '/admin/audit-logs': {
    title: 'Audit Logs',
    group: 'Admin',
    roles: ROLES.AUDIT,
    component: 'AuditLogsPage',
    comingSoon: true,
  },
  '/admin/users': {
    title: 'User Management',
    group: 'Admin',
    roles: ROLES.ADMIN_HR,
    component: 'AdminUsersPage',
  },
  '/admin/roles': {
    title: 'Role Management',
    group: 'Admin',
    roles: ROLES.ADMIN_HR,
    component: 'AdminRolesPage',
  },
  '/admin/email-flow': {
    title: 'Email Flow & Approval',
    group: 'Admin',
    roles: ROLES.ADMIN_HR,
    component: 'EmailFlowPage',
  },
  '/admin/kpi-access': {
    title: 'KPI Access Control',
    group: 'Admin',
    roles: ROLES.ADMIN_HR,
    component: 'KpiAccessPage',
  },
  '/admin/raw-data': {
    title: 'Raw Data Viewer',
    group: 'Admin',
    roles: ROLES.ADMIN,
    component: 'RawDataPage',
  },
  '/admin/master-data': {
    title: 'Master Data',
    group: 'Admin',
    roles: ROLES.ADMIN_HR,
    component: 'MasterDataPage',
    comingSoon: true,
  },
  '/admin/settings': {
    title: 'Settings',
    group: 'Admin',
    roles: ROLES.ADMIN,
    component: 'AdminSettingsPage',
    comingSoon: true,
  },
  '/admin/integrations': {
    title: 'Integration / API Monitor',
    group: 'Admin',
    roles: ROLES.ADMIN,
    component: 'IntegrationMonitorPage',
    comingSoon: true,
  },
  '/documents': {
    title: 'Document Center',
    group: 'Support',
    roles: ROLES.OPS,
    component: 'DocumentCenterPage',
    comingSoon: true,
  },
  '/help': {
    title: 'Help / SOP',
    group: 'Support',
    roles: ROLES.ALL_STAFF,
    component: 'HelpPage',
    comingSoon: true,
  },
}

export const NAV_GROUP_ORDER = [
  'Overview',
  'My Workspace',
  'HR',
  'Clock',
  'Project',
  'KPI',
  'Finance',
  'Office',
  'Reports',
  'Executive',
  'Admin',
  'Support',
]

export function expandRouteDefinitions() {
  const expanded = {}
  Object.entries(ROUTE_DEFINITIONS).forEach(([path, definition]) => {
    expanded[path] = { ...definition, path, canonicalPath: path }
    ;(definition.legacy || []).forEach(legacyPath => {
      expanded[legacyPath] = { ...definition, path: legacyPath, canonicalPath: path, isLegacy: true }
    })
  })
  return expanded
}

export function canAccessRoute(user, definition) {
  if (!definition) return false
  const role = user?.role || 'EMPLOYEE'
  if ((definition.roles || []).includes(role)) return true
  // Per-user override: allow specific employee codes regardless of their role.
  // Useful when one EMPLOYEE-role person needs targeted access to a single page
  // without granting them a broader role like PROJECT_ADMIN.
  const code = user?.employeeCode || user?.employee_code
  if (code && (definition.allowedEmployees || []).includes(code)) return true
  return false
}

export function navigationForUser(user) {
  const grouped = new Map(NAV_GROUP_ORDER.map(group => [group, []]))
  Object.entries(ROUTE_DEFINITIONS).forEach(([path, definition]) => {
    if (!canAccessRoute(user, definition)) return
    const group = definition.group || 'Support'
    if (!grouped.has(group)) grouped.set(group, [])
    grouped.get(group).push({ ...definition, path })
  })
  return Array.from(grouped.entries())
    .map(([group, items]) => ({ group, items }))
    .filter(section => section.items.length)
}
