// PlatformShell — sidebar + topbar chrome shared by every authenticated page.
// Wrap a page:  <PlatformShell user={user} onLogout={fn} active="/clock/monitor" title="Clock Monitor">…</PlatformShell>
import React, { useEffect, useState } from 'react'
import {
  Menu, Search, Moon, Sun, Bell, LogOut, ChevronDown,
  LayoutDashboard, Briefcase, Users, Clock, Folder, Target, Wallet, FileText, TrendingUp, Settings, LifeBuoy,
} from 'lucide-react'
import { navigationForUser } from './platformRoutes.js'
import { Avatar, CommandPalette, useDarkMode } from './ui/index.jsx'

const GROUP_ICON = {
  Overview: LayoutDashboard, 'My Workspace': Briefcase, HR: Users, Clock: Clock,
  Project: Folder, KPI: Target, Finance: Wallet, Reports: FileText,
  Executive: TrendingUp, Admin: Settings, Support: LifeBuoy,
}

export default function PlatformShell({ user, onLogout, active, title, breadcrumb, children }) {
  const nav = navigationForUser(user)
  const { isDark, toggle } = useDarkMode()
  const [sideOpen, setSideOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [cmdkOpen, setCmdkOpen] = useState(false)

  // ⌘K / Ctrl+K
  useEffect(() => {
    const h = e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCmdkOpen(o => !o) } }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const go = path => { window.location.href = path }
  const commands = [
    ...nav.flatMap(s => s.items.map(it => ({ group: 'Pages', title: it.title, icon: GROUP_ICON[s.group] || Folder, action: () => go(it.path) }))),
    { group: 'Commands', title: isDark ? 'Light mode' : 'Dark mode', icon: isDark ? Sun : Moon, action: toggle },
    { group: 'Commands', title: 'Log out', icon: LogOut, action: onLogout },
  ]

  const displayName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.employeeCode || 'User'

  return (
    <div className="ds-app flex min-h-screen">
      {/* mobile overlay */}
      {sideOpen && <div className="fixed inset-0 bg-slate-900/45 z-[80] lg:hidden" onClick={() => setSideOpen(false)} />}

      {/* SIDEBAR */}
      <aside className={`ds-sidebar bg-white border-r border-slate-200 flex flex-col shrink-0 w-64 z-[90]
        max-lg:fixed max-lg:top-0 max-lg:left-0 max-lg:h-screen transition-transform
        ${sideOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'}`}>
        <div className="ds-hero text-white px-5 py-5 flex items-center gap-3">
          <img src="/ace-logo.png" alt="ACE" width="40" height="40" className="rounded-lg bg-white/95 p-1 object-contain shrink-0" />
          <div>
            <div className="text-2xl font-black tracking-tight leading-none">ACE</div>
            <div className="text-[11px] uppercase tracking-[.18em] opacity-80 mt-1">System 4</div>
          </div>
          <button className="ml-auto text-white/80 lg:hidden" onClick={() => setSideOpen(false)} aria-label="Close menu">✕</button>
        </div>

        <nav className="flex-1 overflow-y-auto ds-scroll py-1">
          {nav.map(section => {
            const Icon = GROUP_ICON[section.group] || Folder
            return (
              <div key={section.group}>
                <div className="ds-side-section">{section.group}</div>
                {section.items.map(it => (
                  <a key={it.path} href={it.path}
                     className={`ds-side-link ${it.path === active ? 'ds-active' : ''}`}
                     onClick={e => { if (it.comingSoon) e.preventDefault() }}>
                    <span className="ds-ic flex"><Icon size={17} /></span>
                    <span className="flex-1">{it.title}</span>
                    {it.comingSoon && <span className="ds-badge ds-b-slate">soon</span>}
                  </a>
                ))}
              </div>
            )
          })}
        </nav>

        <div className="px-4 py-3 border-t border-slate-200 flex items-center gap-3">
          <Avatar name={displayName} />
          <div className="leading-tight flex-1 min-w-0">
            <div className="text-sm font-bold truncate">{displayName}</div>
            <div className="text-[11px] text-slate-500 ds-muted-text">{user?.role}</div>
          </div>
          <button className="text-slate-400 hover:text-slate-900" onClick={onLogout} aria-label="Log out"><LogOut size={16} /></button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="ds-topbar bg-white/85 backdrop-blur border-b border-slate-200 px-5 lg:px-8 h-16 flex items-center gap-4 sticky top-0 z-30">
          <button className="ds-btn ds-btn-ghost ds-btn-icon shrink-0 lg:hidden" onClick={() => setSideOpen(true)} aria-label="Open menu"><Menu size={18} /></button>
          <div className="text-xs text-slate-500 ds-muted-text hidden sm:flex items-center gap-2 min-w-0">
            {breadcrumb && <><span className="truncate">{breadcrumb}</span><span className="text-slate-300">/</span></>}
            <span className="text-slate-900 font-bold truncate">{title}</span>
          </div>
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <button className="ds-btn ds-btn-ghost hidden sm:inline-flex" onClick={() => setCmdkOpen(true)}>
              <Search size={16} /> Search <span className="ds-kbd">⌘K</span>
            </button>
            <button className="ds-btn ds-btn-ghost ds-btn-icon" onClick={toggle} aria-label="Toggle theme">{isDark ? <Sun size={18} /> : <Moon size={18} />}</button>
            <button className="ds-btn ds-btn-ghost ds-btn-icon relative" aria-label="Notifications"><Bell size={18} /></button>
            <div className="relative">
              <button className="flex items-center gap-1.5" onClick={() => setMenuOpen(o => !o)}>
                <Avatar name={displayName} size={34} /><ChevronDown size={14} className="text-slate-400" />
              </button>
              {menuOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white ds-surface border border-slate-200 rounded-xl shadow-xl py-1.5 w-44 z-20">
                  <a href="/me" className="block px-4 py-2 text-sm hover:bg-slate-50">Profile</a>
                  <a href="/admin/settings" className="block px-4 py-2 text-sm hover:bg-slate-50">Settings</a>
                  <div className="border-t border-slate-100 my-1" />
                  <button onClick={onLogout} className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-red-600">Log out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-5 lg:p-8">{children}</div>
      </main>

      <CommandPalette open={cmdkOpen} onClose={() => setCmdkOpen(false)} commands={commands} />
    </div>
  )
}
