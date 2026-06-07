'use client'

import { navigationForUser } from './src/platformRoutes.js'

export default function AllPages({ authenticatedUser = null, onLogout = null }) {
  const navSections = navigationForUser(authenticatedUser)

  const readySections = []
  const comingSoonItems = []
  navSections.forEach(section => {
    const readyItems = []
    section.items.forEach(item => {
      if (item.comingSoon) {
        comingSoonItems.push({ ...item, group: section.group })
      } else {
        readyItems.push(item)
      }
    })
    if (readyItems.length) readySections.push({ group: section.group, items: readyItems })
  })

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.header}>
          <div>
            <div style={styles.title}>ACE System Overview</div>
            <div style={styles.subtitle}>Clock, Project, and HR pages in one workspace</div>
          </div>
          <div style={styles.account}>
            <div style={{ textAlign: 'right' }}>
              <div style={styles.accountName}>{authenticatedUser?.name || 'ACE User'}</div>
              <div style={styles.accountRole}>{authenticatedUser?.positionName || 'System Access'}</div>
            </div>
            {onLogout && (
              <button onClick={onLogout} style={styles.logout}>
                Logout
              </button>
            )}
          </div>
        </header>

        <section style={styles.navPanel}>
          {readySections.map(section => (
            <div key={section.group} style={styles.navGroup}>
              <div style={styles.navGroupTitle}>{section.group}</div>
              <div style={styles.navLinks}>
                {section.items.map(item => (
                  <a key={item.path} href={item.path} style={styles.navLink}>{item.title}</a>
                ))}
              </div>
            </div>
          ))}
        </section>

        {comingSoonItems.length > 0 && (
          <section style={styles.comingSoonPanel}>
            <div style={styles.comingSoonHeader}>
              <span style={styles.comingSoonTitle}>Coming Soon</span>
              <span style={styles.comingSoonSubtitle}>
                หน้าที่ยังพัฒนาไม่เสร็จ — เปิดดูได้แต่ยังไม่พร้อมใช้งานจริง
              </span>
            </div>
            <div style={styles.comingSoonLinks}>
              {comingSoonItems.map(item => (
                <a key={item.path} href={item.path} style={styles.comingSoonLink} title={item.group}>
                  {item.title}
                  <span style={styles.comingSoonBadge}>WIP</span>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #ebe7e2 0%, #c9dbe6 100%)',
    padding: 28,
    color: '#0f172a',
  },
  shell: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
    maxWidth: 1760,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 18,
    padding: '18px 22px',
    borderRadius: 10,
    color: '#fff',
    background: 'linear-gradient(135deg, #2447d8 0%, #c73b32 100%)',
    boxShadow: '0 18px 55px rgba(16,24,40,.16)',
    flexShrink: 0,
  },
  navPanel: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 12,
    padding: 14,
    borderRadius: 10,
    background: '#fff',
    boxShadow: '0 12px 32px rgba(16,24,40,.08)',
    flexShrink: 0,
  },
  navGroup: {
    border: '1px solid #edf0f5',
    borderRadius: 8,
    padding: 12,
    background: '#fbfcff',
  },
  navGroupTitle: {
    marginBottom: 8,
    color: '#667085',
    fontSize: '.68rem',
    fontWeight: 950,
    letterSpacing: '.08em',
    textTransform: 'uppercase',
  },
  navLinks: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  navLink: {
    padding: '7px 9px',
    borderRadius: 6,
    color: '#2447d8',
    background: '#eef3ff',
    textDecoration: 'none',
    fontSize: '.75rem',
    fontWeight: 900,
  },
  title: {
    fontSize: '1.55rem',
    fontWeight: 900,
    lineHeight: 1.1,
  },
  subtitle: {
    marginTop: 5,
    color: 'rgba(255,255,255,.82)',
    fontSize: '.88rem',
    fontWeight: 650,
  },
  account: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  accountName: {
    fontSize: '.84rem',
    fontWeight: 900,
  },
  accountRole: {
    marginTop: 2,
    color: 'rgba(255,255,255,.72)',
    fontSize: '.72rem',
    fontWeight: 700,
  },
  logout: {
    padding: '10px 13px',
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,.35)',
    color: '#fff',
    background: 'rgba(255,255,255,.12)',
    fontWeight: 850,
    cursor: 'pointer',
  },
  comingSoonPanel: {
    padding: 14,
    borderRadius: 10,
    background: '#f4f5f8',
    border: '1px dashed #c8cdd6',
    flexShrink: 0,
    opacity: 0.85,
  },
  comingSoonHeader: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 12,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  comingSoonTitle: {
    color: '#667085',
    fontSize: '.7rem',
    fontWeight: 950,
    letterSpacing: '.08em',
    textTransform: 'uppercase',
  },
  comingSoonSubtitle: {
    color: '#98a2b3',
    fontSize: '.72rem',
    fontWeight: 600,
  },
  comingSoonLinks: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  comingSoonLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 9px',
    borderRadius: 6,
    color: '#667085',
    background: '#ffffff',
    border: '1px solid #e4e7ec',
    textDecoration: 'none',
    fontSize: '.75rem',
    fontWeight: 700,
  },
  comingSoonBadge: {
    padding: '1px 6px',
    borderRadius: 4,
    background: '#fff7e6',
    color: '#b54708',
    fontSize: '.6rem',
    fontWeight: 900,
    letterSpacing: '.06em',
  },
}
