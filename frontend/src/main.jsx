import React, { useMemo, useState } from 'react'
import { apiFetch } from './apiFetch.js'
import { createRoot } from 'react-dom/client'
import ClockApp from '../ClockApp.jsx'
import LeaveApprovalPage from '../LeaveApprovalPage.jsx'
import RoomDisplayPage from '../RoomDisplayPage.jsx'
import ProjectPage from '../ProjectPage.jsx'
import ProjectWorkSplitPage from '../ProjectWorkSplitPage.jsx'
import HREmployeePage from '../HREmployeePage.jsx'
import AllPages from '../AllPages.jsx'
import KPIPage from '../KPIPage.jsx'
import SelfAssessmentPage from '../SelfAssessmentPage.jsx'
import ClockMonitorPage from '../ClockMonitorPage.jsx'
import ClockWallboardPage from '../ClockWallboardPage.jsx'
import RevenueExpensePage from '../RevenueExpensePage.jsx'
import SystemMonitorPage from '../SystemMonitorPage.jsx'
import RawDataPage from '../RawDataPage.jsx'
import AuditLogsPage from '../AuditLogsPage.jsx'
import ExecutiveDashboard from '../ExecutiveDashboard.jsx'
import HWPOImportPage from '../HWPOImportPage.jsx'
import RFMonitorPage from '../RFMonitorPage.jsx'
import PreSiteMonitorPage from '../PreSiteMonitorPage.jsx'
import PreSiteMonitorDtaPage from '../PreSiteMonitorDtaPage.jsx'
import ReportUploadPage from '../ReportUploadPage.jsx'
import DtePaymentsPage from '../DtePaymentsPage.jsx'
import POTrackingDashboard from '../POTrackingDashboard.jsx'
import BillReaderPage from '../BillReaderPage.jsx'
import DailyWorklogPage from '../DailyWorklogPage.jsx'
import MeetingRoomPage from '../MeetingRoomPage.jsx'
import OfficeStorePage from '../OfficeStorePage.jsx'
import VirtualOfficePage from '../VirtualOfficePage.jsx'
import EmailFlowPage from '../EmailFlowPage.jsx'
import KpiAccessPage from '../KpiAccessPage.jsx'
import UiKitPage from './UiKitPage.jsx'
import {
  AdminRolesPage,
  AdminSettingsPage,
  AdminUsersPage,
  DocumentCenterPage,
  HelpPage,
  HRAnalyticsPage,
  IntegrationMonitorPage,
  MasterDataPage,
  MyProfilePage,
  NotificationCenterPage,
  ReportCenterPage,
  WorkflowCenterPage,
} from '../PlatformPages.jsx'
import { canAccessRoute, expandRouteDefinitions } from './platformRoutes.js'
import './styles.css'

const AUTH_STORAGE_KEY = 'ace_system_auth_user_v1'


const COMPONENTS = {
  AdminRolesPage,
  AdminSettingsPage,
  AdminUsersPage,
  AllPages,
  AuditLogsPage,
  ClockApp,
  ClockMonitorPage,
  ClockWallboardPage,
  DailyWorklogPage,
  MeetingRoomPage,
  RoomDisplayPage,
  OfficeStorePage,
  VirtualOfficePage,
  DocumentCenterPage,
  EmailFlowPage,
  KpiAccessPage,
  ExecutiveDashboard,
  HelpPage,
  HWPOImportPage,
  HRAnalyticsPage,
  RFMonitorPage,
  PreSiteMonitorPage,
  PreSiteMonitorDtaPage,
  HREmployeePage,
  IntegrationMonitorPage,
  KPIPage,
  SelfAssessmentPage,
  MasterDataPage,
  MyProfilePage,
  NotificationCenterPage,
  ProjectPage,
  ProjectWorkSplitPage,
  ReportCenterPage,
  ReportUploadPage,
  DtePaymentsPage,
  POTrackingDashboard,
  BillReaderPage,
  RevenueExpensePage,
  SystemMonitorPage,
  RawDataPage,
  UiKitPage,
  WorkflowCenterPage,
}

const ROUTES = expandRouteDefinitions()

function AppRouter() {
  const rawPath = window.location.pathname.replace(/\/$/, '') || '/overview'
  if (rawPath.startsWith('/leave-approval/')) {
    return <LeaveApprovalPage />
  }
  // Public door-display kiosk — no login required.
  if (rawPath === '/room-display') {
    return <RoomDisplayPage />
  }
  const route = ROUTES[rawPath] || ROUTES['/overview']
  const Page = COMPONENTS[route.component] || AllPages
  return (
    <AuthGate>
      {({ user, onLogout }) => (
        canAccessRoute(user, route)
          ? <Page authenticatedUser={user} onLogout={onLogout} />
          : <AccessDenied user={user} onLogout={onLogout} route={route} />
      )}
    </AuthGate>
  )
}

function AuthGate({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = window.localStorage.getItem(AUTH_STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const displayName = useMemo(() => user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim(), [user])

  function handleLogin(nextUser) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
  }

  function handleLogout() {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    setUser(null)
  }

  if (!user) {
    return <SystemLogin onLogin={handleLogin} />
  }
  if (user.mustChangePassword) {
    return <ForcePasswordChange user={user} onChanged={handleLogin} onLogout={handleLogout} />
  }

  return children({ user: { ...user, name: displayName }, onLogout: handleLogout })
}

function AccessDenied({ user, onLogout, route }) {
  return (
    <div className="ace-login-page">
      <section className="ace-login-card">
        <div className="ace-login-hero">
          <div className="ace-login-brand">Access Restricted</div>
          <div className="ace-login-subtitle">{user?.name} does not have permission for {route?.title || 'this page'}.</div>
        </div>
        <div className="ace-login-form">
          <a href="/overview" style={{ textAlign: 'center', color: '#2447d8', fontWeight: 900 }}>Go to Overview</a>
          <a href="/ClockApp" style={{ textAlign: 'center', color: '#2447d8', fontWeight: 900 }}>Go to Clock App</a>
          <button type="button" onClick={onLogout}>Logout</button>
        </div>
      </section>
    </div>
  )
}

function SystemLogin({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })
      const data = await res.json()
      if (!res.ok) {
        const detail = data.detail
        setError(typeof detail === 'string' ? detail : 'Email or password is incorrect.')
        return
      }
      onLogin({ ...data.user, token: data.access_token })
    } catch {
      setError('Cannot connect to server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ace-login-page">
      <section className="ace-login-card">
        <div className="ace-login-hero">
          <div className="ace-login-brand">ACE System Login</div>
          <div className="ace-login-subtitle">Sign in once to access Clock, Project, and HR pages</div>
        </div>
        <form className="ace-login-form" onSubmit={submit}>
          <label>Email</label>
          <input
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="Email หรือ Employee Code"
            type="text"
            autoComplete="username"
          />

          <label>Password</label>
          <input
            value={password}
            onChange={event => setPassword(event.target.value)}
            type="password"
            placeholder="Password"
            autoComplete="current-password"
          />

          {error && <div className="ace-login-error">{error}</div>}

          <button type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Login'}</button>

        </form>
      </section>
    </div>
  )
}

function ForcePasswordChange({ user, onChanged, onLogout }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const hasLetter  = /[a-zA-Z]/.test(newPassword)
  const hasNumber  = /[0-9]/.test(newPassword)
  const isLongEnough = newPassword.length >= 8
  const policyOk   = hasLetter && hasNumber && isLongEnough
  const matchOk    = newPassword === confirmPassword && confirmPassword.length > 0

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (!policyOk) { setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัว และมีทั้งตัวอักษรและตัวเลข'); return }
    if (!matchOk)  { setError('รหัสผ่านใหม่ไม่ตรงกัน'); return }
    setLoading(true)
    try {
      const response = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.detail || 'ไม่สามารถเปลี่ยนรหัสผ่านได้')
        return
      }
      // Backend bumps token_version on change-password, so the current token is now revoked.
      // Silently re-login with the new password to get a fresh token before continuing.
      try {
        const loginIdentifier = (user.email || user.employeeCode || '').toLowerCase()
        const reauth = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loginIdentifier, password: newPassword }),
        })
        if (reauth.ok) {
          const fresh = await reauth.json()
          onChanged({ ...fresh.user, token: fresh.access_token, mustChangePassword: false })
          return
        }
      } catch {
        // fall through to logout fallback below
      }
      // Fallback: cannot silently re-login → force a clean login screen
      onLogout()
    } catch {
      setError('ไม่สามารถเชื่อมต่อ server กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  const Rule = ({ ok, text }) => (
    <div style={{ fontSize: 12, color: ok ? '#16a34a' : '#94a3b8', display: 'flex', alignItems: 'center', gap: 5 }}>
      <span>{ok ? '✓' : '○'}</span>{text}
    </div>
  )

  return (
    <div className="ace-login-page">
      <section className="ace-login-card">
        <div className="ace-login-hero">
          <div className="ace-login-brand">เปลี่ยนรหัสผ่าน</div>
          <div className="ace-login-subtitle">กรุณาตั้งรหัสผ่านใหม่ก่อนเข้าใช้งาน</div>
        </div>
        <form className="ace-login-form" onSubmit={submit}>
          <label>รหัสผ่านปัจจุบัน</label>
          <input value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} type="password" autoComplete="current-password" placeholder="ACE1234" />
          <label>รหัสผ่านใหม่</label>
          <input value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" autoComplete="new-password" placeholder="ตัวอักษร + ตัวเลข อย่างน้อย 8 ตัว" />
          {newPassword.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: -8 }}>
              <Rule ok={isLongEnough} text="อย่างน้อย 8 ตัวอักษร" />
              <Rule ok={hasLetter}    text="มีตัวอักษร (a-z, A-Z)" />
              <Rule ok={hasNumber}    text="มีตัวเลข (0-9)" />
            </div>
          )}
          <label>ยืนยันรหัสผ่านใหม่</label>
          <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password" autoComplete="new-password" placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง" />
          {error && <div className="ace-login-error">{error}</div>}
          <button type="submit" disabled={loading}>{loading ? 'กำลังบันทึก…' : 'บันทึกรหัสผ่าน'}</button>
          <button type="button" onClick={onLogout} style={{ background: '#fff', color: '#344054', border: '1px solid #d8dee8' }}>ออกจากระบบ</button>
        </form>
      </section>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>,
)
