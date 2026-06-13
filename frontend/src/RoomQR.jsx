// Printable QR poster for a meeting room. Each room's QR points to its public
// door-display page (/room-display?room=<id>), so anyone scanning the sign on
// the door sees who is using / has booked the room — no login required.
import React, { useMemo, useState } from 'react'
import { Printer, Download, Link2, Check, X, QrCode } from 'lucide-react'
import { Modal, Button } from './ui/index.jsx'
import { makeQR, ECLevel } from './vendor/qrcode.js'
import { ACE_LOGO_DATA_URI } from './vendor/aceLogo.js'

const ACE_BLUE = '#2447d8'
const ACE_RED = '#c0392b'
const COMPANY = 'AirConnect Engineering'
// Posters are printed to hang on real doors, so the QR must target the public
// production site regardless of where an admin previews it (e.g. localhost).
const PUBLIC_BASE = 'https://ace.airconnect-e.com'

export function roomDisplayUrl(roomId) {
  return `${PUBLIC_BASE}/room-display?room=${roomId}`
}

// --- QR rendering helpers ----------------------------------------------------
function qrMatrix(text) {
  // Level Q = ~25% recovery; robust for a door sign that may get scuffed.
  return makeQR(text, { ecLevel: ECLevel.Q })
}

// Crisp, resolution-independent SVG. One merged path keeps the markup small.
export function qrSvg(text, { margin = 4, dark = '#0f172a', light = '#ffffff' } = {}) {
  const { matrix, size } = qrMatrix(text)
  const dim = size + margin * 2
  let d = ''
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) d += `M${c + margin} ${r + margin}h1v1h-1z`
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${dim}" shape-rendering="crispEdges" width="100%" height="100%"><rect width="${dim}" height="${dim}" fill="${light}"/><path d="${d}" fill="${dark}"/></svg>`
}

// Rasterise to a PNG data URL for download.
function qrPngDataUrl(text, modulePx = 16, margin = 4, dark = '#0f172a') {
  const { matrix, size } = qrMatrix(text)
  const dim = (size + margin * 2) * modulePx
  const canvas = document.createElement('canvas')
  canvas.width = dim
  canvas.height = dim
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, dim, dim)
  ctx.fillStyle = dark
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) ctx.fillRect((c + margin) * modulePx, (r + margin) * modulePx, modulePx, modulePx)
    }
  }
  return canvas.toDataURL('image/png')
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]))
}

// Full standalone A5 poster document — used both for the on-screen preview
// (inside an iframe) and for printing, so what you see is what prints.
function posterHtml(room, url) {
  const color = room.color || ACE_BLUE
  const svg = qrSvg(url, { dark: '#0f172a' })
  const name = escapeHtml(room.name)
  const location = escapeHtml(room.location || '')
  const capacity = room.capacity ? `${room.capacity} seats` : ''
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<style>
  @page { size: A5 portrait; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { height: 100%; font-family: 'Sarabun', 'Segoe UI', system-ui, sans-serif; }
  .sheet { width: 148mm; height: 210mm; margin: 0 auto; display: flex; flex-direction: column; align-items: center;
           padding: 14mm 12mm; background: #fff; position: relative; }
  .bar { position: absolute; top: 0; left: 0; right: 0; height: 8mm; background: linear-gradient(90deg, ${ACE_BLUE}, ${ACE_RED}); }
  .brand { display: flex; align-items: center; gap: 3mm; margin-top: 6mm; }
  .brand img { height: 11mm; width: auto; }
  .brand .co { font-size: 11pt; font-weight: 800; color: #0f172a; letter-spacing: .2px; }
  .brand .sub { font-size: 8pt; font-weight: 700; color: #64748b; }
  .label { margin-top: 9mm; font-size: 12pt; font-weight: 700; color: ${color}; letter-spacing: 1px; }
  .room { margin-top: 1mm; font-size: 30pt; font-weight: 900; color: #0f172a; text-align: center; line-height: 1.05; }
  .meta { margin-top: 3mm; font-size: 12pt; font-weight: 700; color: #475569; text-align: center; }
  .qrwrap { margin-top: 8mm; padding: 6mm; border: 3px solid ${color}; border-radius: 6mm; }
  .qr { width: 72mm; height: 72mm; }
  .cta { margin-top: 8mm; font-size: 17pt; font-weight: 900; color: #0f172a; text-align: center; }
  .cta2 { margin-top: 1.5mm; font-size: 10pt; font-weight: 700; color: #64748b; text-align: center; }
  .foot { position: absolute; bottom: 9mm; left: 0; right: 0; text-align: center; font-size: 8.5pt; font-weight: 700; color: #94a3b8; }
</style></head>
<body><div class="sheet">
  <div class="bar"></div>
  <div class="brand">
    <img src="${ACE_LOGO_DATA_URI}" onerror="this.style.display='none'" alt="">
    <div><div class="co">${escapeHtml(COMPANY)}</div><div class="sub">Meeting Room</div></div>
  </div>
  <div class="label">MEETING ROOM</div>
  <div class="room">${name}</div>
  <div class="meta">${[location, capacity].filter(Boolean).join('  ·  ')}</div>
  <div class="qrwrap"><div class="qr">${svg}</div></div>
  <div class="cta">Scan to see who's using this room</div>
  <div class="cta2">Today's bookings &amp; live availability — no login needed</div>
  <div class="foot">${escapeHtml(url)}</div>
</div></body></html>`
}

export function RoomQRModal({ open, room, onClose }) {
  const [copied, setCopied] = useState(false)
  const url = room ? roomDisplayUrl(room.id) : ''
  const html = useMemo(() => (room ? posterHtml(room, url) : ''), [room, url])

  if (!room) return null

  function print() {
    const w = window.open('', '_blank', 'width=720,height=960')
    if (!w) { window.alert('Could not open the print window — please allow pop-ups.'); return }
    w.document.open()
    w.document.write(html)
    w.document.close()
    // Give the logo image a moment to load before the print dialog.
    w.onload = () => { w.focus(); w.print() }
    setTimeout(() => { try { w.focus(); w.print() } catch { /* onload already fired */ } }, 600)
  }

  function downloadPng() {
    const a = document.createElement('a')
    a.href = qrPngDataUrl(url)
    a.download = `qr-${room.name.replace(/[^\w฀-๿-]+/g, '_')}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch { window.prompt('Copy this link:', url) }
  }

  return (
    <Modal open={open} onClose={onClose} width={560}>
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-2 text-lg font-black text-slate-900">
          <QrCode size={20} style={{ color: ACE_BLUE }} /> Door QR poster
        </div>
        <button onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Close">
          <X size={18} />
        </button>
      </div>

      <div className="px-5 pb-3 pt-1 text-xs font-semibold text-slate-500">
        {room.name} — scanning opens <span className="font-mono text-[11px] text-slate-600">{url}</span>
      </div>

      {/* Live preview — same document that prints */}
      <div className="mx-5 mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
        <iframe title="QR poster preview" srcDoc={html} className="block h-[420px] w-full border-0 bg-white" />
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-4">
        <Button variant="ghost" icon={copied ? Check : Link2} onClick={copyLink}>{copied ? 'Copied' : 'Copy link'}</Button>
        <Button variant="ghost" icon={Download} onClick={downloadPng}>Download QR (PNG)</Button>
        <Button variant="primary" icon={Printer} onClick={print}>Print poster</Button>
      </div>
    </Modal>
  )
}

export default RoomQRModal
