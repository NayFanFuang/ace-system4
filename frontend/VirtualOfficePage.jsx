import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * ACE Telecom — Virtual Pixel Office.
 *
 * A 2D pixel office where staff walk around (WASD / arrows), chat by typing, and talk
 * over proximity voice (WebRTC peer-to-peer). Designed for a telecom company: separate
 * project rooms, a big meeting room, a NOC war room, HR / Finance / Director offices,
 * a canteen and a lounge.
 *
 * Audio rules (computed entirely client-side so the server stays light):
 *   - same enclosed room  -> full volume (project rooms are sound-isolated = privacy)
 *   - different rooms      -> muted (walls block sound)
 *   - corridor involved    -> proximity falloff by distance
 *   - social zones (Lobby / Canteen / Lounge) behave as one room: whole-zone audio
 *
 * Everything realtime flows over a single WebSocket at /api/ws/office. Voice itself is
 * P2P and never hits the backend.
 */

const TILE = 32
const MAP_W = 56
const MAP_H = 40
const SPEED = 2.6
const BODY = 18 // collision box half-size-ish

const AUTH_KEY = 'ace_system_auth_user_v1'

// ── Floor plan ────────────────────────────────────────────────────────────────
// x,y = top-left tile of the room (walls included). Doors are gaps carved into walls.
const ROOMS = [
  { id: 'rf', name: 'RF Project', th: 'ห้อง RF Project', x: 1, y: 1, w: 13, h: 12, color: '#1e3a8a',
    doors: [{ side: 'right', at: 6, len: 2 }] },
  { id: 'lobby', name: 'Lobby', th: 'โถงต้อนรับ', x: 16, y: 1, w: 12, h: 12, color: '#334155', social: true,
    doors: [{ side: 'left', at: 6, len: 2 }, { side: 'right', at: 6, len: 2 }, { side: 'bottom', at: 21, len: 2 }] },
  { id: 'pac', name: 'PAC / SSV', th: 'ห้องโปรเจกต์ PAC/SSV', x: 30, y: 1, w: 12, h: 12, color: '#065f46',
    doors: [{ side: 'left', at: 6, len: 2 }] },
  { id: 'director', name: 'Director', th: 'ห้องผู้บริหาร', x: 44, y: 1, w: 11, h: 12, color: '#7c2d12',
    doors: [{ side: 'left', at: 6, len: 2 }] },

  { id: 'survey', name: 'Site Survey / DTE', th: 'ห้องสำรวจไซต์', x: 1, y: 15, w: 13, h: 11, color: '#155e75',
    doors: [{ side: 'right', at: 19, len: 2 }] },
  { id: 'meeting', name: 'Meeting Room', th: 'ห้องประชุมใหญ่', x: 16, y: 15, w: 12, h: 11, color: '#5b21b6',
    doors: [{ side: 'top', at: 21, len: 2 }, { side: 'left', at: 19, len: 2 }] },
  { id: 'hr', name: 'HR Room', th: 'ห้องบุคคล (HR)', x: 30, y: 15, w: 12, h: 11, color: '#9d174d',
    doors: [{ side: 'left', at: 19, len: 2 }] },
  { id: 'finance', name: 'Finance', th: 'ห้องการเงิน', x: 44, y: 15, w: 11, h: 11, color: '#854d0e',
    doors: [{ side: 'left', at: 19, len: 2 }] },

  { id: 'noc', name: 'NOC / War Room', th: 'ศูนย์เฝ้าระวังเครือข่าย', x: 1, y: 28, w: 13, h: 11, color: '#831843',
    doors: [{ side: 'right', at: 29, len: 2 }] }, // moved up: console desk sits along y32
  { id: 'canteen', name: 'Canteen', th: 'แคนทีน / โรงอาหาร', x: 16, y: 28, w: 26, h: 11, color: '#92400e', social: true,
    doors: [{ side: 'left', at: 32, len: 2 }, { side: 'right', at: 32, len: 2 }] }, // side doors: top wall holds the kitchen counter
  { id: 'lounge', name: 'Lounge', th: 'โซนพักผ่อน', x: 44, y: 28, w: 11, h: 11, color: '#3f6212', social: true,
    doors: [{ side: 'left', at: 32, len: 2 }] },
]

// Build a wall grid from rooms + outer border, then carve doors.
function buildWalls() {
  const wall = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(false))
  for (let x = 0; x < MAP_W; x++) { wall[0][x] = true; wall[MAP_H - 1][x] = true }
  for (let y = 0; y < MAP_H; y++) { wall[y][0] = true; wall[y][MAP_W - 1] = true }
  for (const r of ROOMS) {
    for (let x = r.x; x < r.x + r.w; x++) { wall[r.y][x] = true; wall[r.y + r.h - 1][x] = true }
    for (let y = r.y; y < r.y + r.h; y++) { wall[y][r.x] = true; wall[y][r.x + r.w - 1] = true }
  }
  for (const r of ROOMS) {
    for (const d of r.doors) {
      for (let i = 0; i < d.len; i++) {
        if (d.side === 'top') wall[r.y][d.at + i] = false
        else if (d.side === 'bottom') wall[r.y + r.h - 1][d.at + i] = false
        else if (d.side === 'left') wall[d.at + i][r.x] = false
        else if (d.side === 'right') wall[d.at + i][r.x + r.w - 1] = false
      }
    }
  }
  return wall
}

function roomAt(px, py) {
  const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE)
  for (const r of ROOMS) {
    if (tx > r.x && tx < r.x + r.w - 1 && ty > r.y && ty < r.y + r.h - 1) return r
  }
  return null
}

// ── Furniture ───────────────────────────────────────────────────────────────
// Each room gets a furniture layout. Big pieces are "solid" (block walking).
const TR = (tx, ty, tw, th) => ({ x: tx * TILE, y: ty * TILE, w: tw * TILE, h: th * TILE })
const rectsOverlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y

// Keep-clear zones in front of every door (door span + ~1.6 tiles inward) so furniture
// never blocks an entrance.
function doorClearRects(r) {
  const rects = []
  for (const d of r.doors) {
    if (d.side === 'right') rects.push(TR(r.x + r.w - 1 - 1.6, d.at - 0.3, 2.6, d.len + 0.6))
    else if (d.side === 'left') rects.push(TR(r.x - 0.4, d.at - 0.3, 2.6, d.len + 0.6))
    else if (d.side === 'top') rects.push(TR(d.at - 0.3, r.y - 0.4, d.len + 0.6, 2.6))
    else if (d.side === 'bottom') rects.push(TR(d.at - 0.3, r.y + r.h - 1 - 1.6, d.len + 0.6, 2.6))
  }
  return rects
}

function workRoom(r, add) {
  // open-plan: two columns of desks (desk + monitor + chair), plant in a corner.
  // Skip a whole workstation if its desk would land in a doorway (keeps the door clear).
  const clears = doorClearRects(r)
  const free = (rect) => !clears.some((c) => rectsOverlap(c, rect))
  const rows = Math.floor((r.h - 4) / 2)
  const leftX = r.x + 1.4, rightX = r.x + r.w - 1 - 2 - 0.4
  for (let i = 0; i < rows; i++) {
    const ty = r.y + 2.6 + i * 2
    const ld = TR(leftX, ty, 2, 1)
    if (free(ld)) {
      add({ type: 'desk', ...ld }, true)
      add({ type: 'monitor', ...TR(leftX + 0.5, ty - 0.15, 0.9, 0.7), dir: 'down' })
      add({ type: 'chair', ...TR(leftX + 0.6, ty + 1.0, 0.8, 0.8), dir: 'up' })
    }
    const rd = TR(rightX, ty, 2, 1)
    if (free(rd)) {
      add({ type: 'desk', ...rd }, true)
      add({ type: 'monitor', ...TR(rightX + 0.6, ty - 0.15, 0.9, 0.7), dir: 'down' })
      add({ type: 'chair', ...TR(rightX + 0.6, ty + 1.0, 0.8, 0.8), dir: 'up' })
    }
  }
  add({ type: 'plant', ...TR(r.x + r.w - 2.1, r.y + r.h - 2.1, 0.9, 0.9) })
  add({ type: 'cabinet', ...TR(r.x + 1.1, r.y + r.h - 2.2, 1.6, 0.8) }, true)
}

const LAYOUTS = {
  rf: workRoom, pac: workRoom, survey: workRoom, hr: workRoom, finance: workRoom,

  lobby(r, add) {
    add({ type: 'rug', ...TR(r.x + r.w / 2 - 2, r.y + r.h / 2 - 1.6, 4, 3.2), color: '#1e293b' })
    add({ type: 'logo', ...TR(r.x + r.w / 2 - 1.5, r.y + r.h / 2 - 0.4, 3, 1) })
    add({ type: 'reception', ...TR(r.x + r.w / 2 - 2, r.y + 2.3, 4, 1.2) }, true)
    add({ type: 'chair', ...TR(r.x + r.w / 2 - 0.4, r.y + 3.6, 0.9, 0.9), dir: 'up' })
    add({ type: 'sofa', ...TR(r.x + 1.4, r.y + r.h - 3.2, 2.6, 1), dir: 'down' }, true)
    add({ type: 'sofa', ...TR(r.x + r.w - 4, r.y + r.h - 3.2, 2.6, 1), dir: 'down' }, true)
    add({ type: 'ctable', ...TR(r.x + r.w / 2 - 0.7, r.y + r.h - 3.0, 1.4, 0.9) })
    add({ type: 'plant', ...TR(r.x + 1, r.y + 1.8, 1, 1) })
    add({ type: 'plant', ...TR(r.x + r.w - 2, r.y + 1.8, 1, 1) })
  },

  meeting(r, add) {
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2 + 0.6
    const tw = Math.min(6, r.w - 4)
    add({ type: 'mtable', ...TR(cx - tw / 2, cy - 1.2, tw, 2.4) }, true)
    const n = Math.floor(tw)
    for (let i = 0; i < n; i++) {
      const chx = cx - tw / 2 + 0.5 + i
      add({ type: 'chair', ...TR(chx, cy - 2.1, 0.8, 0.8), dir: 'down' })
      add({ type: 'chair', ...TR(chx, cy + 1.3, 0.8, 0.8), dir: 'up' })
    }
    add({ type: 'screen', ...TR(cx - 1.6, r.y + 1.05, 3.2, 0.55) })
    add({ type: 'plant', ...TR(r.x + 1, r.y + r.h - 2, 0.9, 0.9) })
  },

  director(r, add) {
    add({ type: 'rug', ...TR(r.x + 1, r.y + r.h - 4.6, r.w - 2, 3.4), color: '#3f2a1a' })
    add({ type: 'desk', ...TR(r.x + r.w / 2 - 1.6, r.y + 2.8, 3.2, 1.2) }, true)
    add({ type: 'monitor', ...TR(r.x + r.w / 2 - 0.45, r.y + 2.65, 0.9, 0.7), dir: 'down' })
    add({ type: 'chair', ...TR(r.x + r.w / 2 - 0.45, r.y + 4.1, 1, 1), dir: 'up', boss: true })
    add({ type: 'chair', ...TR(r.x + r.w / 2 - 2.1, r.y + 2.0, 0.8, 0.8), dir: 'down' })
    add({ type: 'chair', ...TR(r.x + r.w / 2 + 1.2, r.y + 2.0, 0.8, 0.8), dir: 'down' })
    add({ type: 'sofa', ...TR(r.x + 1.4, r.y + r.h - 3, 3, 1), dir: 'down' }, true)
    add({ type: 'ctable', ...TR(r.x + 2.3, r.y + r.h - 4.1, 1.3, 0.9) })
    add({ type: 'plant', ...TR(r.x + r.w - 2.1, r.y + r.h - 2.3, 1, 1) })
    add({ type: 'cabinet', ...TR(r.x + r.w - 2.4, r.y + 2, 1.4, 0.8) }, true)
  },

  canteen(r, add) {
    add({ type: 'counter', ...TR(r.x + 1, r.y + 1.4, r.w - 4.5, 1) }, true)
    add({ type: 'fridge', ...TR(r.x + r.w - 2.3, r.y + 1.4, 1.1, 1.6) }, true)
    add({ type: 'watercooler', ...TR(r.x + r.w - 3.7, r.y + 1.5, 0.9, 1.3) }, true)
    const cols = Math.max(1, Math.floor((r.w - 3) / 5))
    const rows = Math.max(1, Math.floor((r.h - 5) / 3))
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const tx = r.x + 3 + i * 5, ty = r.y + 4.8 + j * 3
      add({ type: 'rtable', ...TR(tx, ty, 1.6, 1.6) }, true)
      add({ type: 'chair', ...TR(tx + 0.4, ty - 1.0, 0.8, 0.8), dir: 'down' })
      add({ type: 'chair', ...TR(tx + 0.4, ty + 1.6, 0.8, 0.8), dir: 'up' })
      add({ type: 'chair', ...TR(tx - 1.0, ty + 0.4, 0.8, 0.8), dir: 'right' })
      add({ type: 'chair', ...TR(tx + 1.6, ty + 0.4, 0.8, 0.8), dir: 'left' })
    }
  },

  noc(r, add) {
    for (let i = 0; i < 3; i++) add({ type: 'screen', ...TR(r.x + 1.3 + i * 3.4, r.y + 1.05, 3, 0.65) })
    add({ type: 'desk', ...TR(r.x + 1.8, r.y + 4, r.w - 3.6, 1.1) }, true)
    for (let i = 0; i < 3; i++) {
      add({ type: 'monitor', ...TR(r.x + 2.8 + i * 2.7, r.y + 3.85, 0.9, 0.7), dir: 'down' })
      add({ type: 'chair', ...TR(r.x + 3.0 + i * 2.7, r.y + 5.3, 0.9, 0.9), dir: 'up' })
    }
    for (let i = 0; i < 4; i++) add({ type: 'rack', ...TR(r.x + 1.5 + i * 1.5, r.y + r.h - 2.6, 1.1, 1.6) }, true)
    add({ type: 'plant', ...TR(r.x + r.w - 2, r.y + r.h - 2.3, 0.9, 0.9) })
  },

  lounge(r, add) {
    add({ type: 'rug', ...TR(r.x + 1.4, r.y + 3, r.w - 2.8, 2.6), color: '#1f3a1f' })
    add({ type: 'tv', ...TR(r.x + r.w / 2 - 1.6, r.y + 1.05, 3.2, 0.6) })
    add({ type: 'sofa', ...TR(r.x + 1.5, r.y + 2.6, 3, 1), dir: 'down' }, true)
    add({ type: 'ctable', ...TR(r.x + 2.5, r.y + 4.1, 1.5, 1) })
    add({ type: 'plant', ...TR(r.x + 1, r.y + r.h - 2.2, 1, 1) })
    add({ type: 'plant', ...TR(r.x + r.w - 2, r.y + r.h - 2.2, 1, 1) })
    add({ type: 'cabinet', ...TR(r.x + r.w - 2.5, r.y + 2.4, 1.5, 0.8) }, true)
  },
}

function buildFurniture() {
  const items = [], solids = []
  const add = (it, solid = false) => { items.push(it); if (solid) solids.push({ x: it.x, y: it.y, w: it.w, h: it.h }) }
  for (const r of ROOMS) LAYOUTS[r.id]?.(r, add)
  // Safety net: a solid must never overlap any door's keep-clear zone, or that room
  // becomes unreachable. Drop the collision (the piece still draws) if it does.
  const clears = ROOMS.flatMap(doorClearRects)
  const safeSolids = solids.filter((s) => !clears.some((c) => rectsOverlap(c, s)))
  return { items, solids: safeSolids }
}
const FURNITURE = buildFurniture()

// Color per role for the avatar.
const ROLE_COLOR = {
  SUPER_ADMIN: '#f43f5e', SYSTEM_ADMIN: '#f43f5e',
  HR_ADMIN: '#ec4899', HR_VIEWER: '#ec4899',
  PROJECT_ADMIN: '#22c55e', PM: '#22c55e',
  DIRECTOR: '#f59e0b', ACCOUNTING: '#06b6d4',
  EMPLOYEE: '#60a5fa',
}
const avatarColor = (role) => ROLE_COLOR[role] || '#60a5fa'

export default function VirtualOfficePage() {
  const [phase, setPhase] = useState('idle') // idle | connecting | live | error
  const [error, setError] = useState('')
  const [online, setOnline] = useState(0)
  const [currentRoom, setCurrentRoom] = useState(null)
  const [muted, setMuted] = useState(false)
  const [noMic, setNoMic] = useState(false)
  const [chatLog, setChatLog] = useState([])
  const [chatText, setChatText] = useState('')
  const [chatOpen, setChatOpen] = useState(true)

  const canvasRef = useRef(null)
  const wrapRef = useRef(null)

  // Mutable game state (kept in refs to avoid re-rendering every frame).
  const G = useRef({
    me: null,                 // { id, name, role, x, y, dir }
    players: new Map(),       // id -> { id,name,role,x,y,dir,room,muted,bubble,level }
    walls: buildWalls(),
    keys: {},
    ws: null,
    localStream: null,
    pcs: new Map(),           // id -> RTCPeerConnection
    audioEls: new Map(),      // id -> HTMLAudioElement
    analysers: new Map(),     // id -> { analyser, data }
    audioCtx: null,
    lastSent: 0,
    raf: 0,
    mutedRef: false,
  }).current

  const token = (() => {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY) || '{}')?.token || '' } catch { return '' }
  })()

  // ── WebRTC ────────────────────────────────────────────────────────────────
  const sendSignal = (to, data) => {
    G.ws?.readyState === 1 && G.ws.send(JSON.stringify({ type: 'signal', to, data }))
  }

  const attachAnalyser = (id, stream) => {
    try {
      if (!G.audioCtx) G.audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const src = G.audioCtx.createMediaStreamSource(stream)
      const analyser = G.audioCtx.createAnalyser()
      analyser.fftSize = 256
      src.connect(analyser)
      G.analysers.set(id, { analyser, data: new Uint8Array(analyser.frequencyBinCount) })
    } catch { /* analyser is cosmetic (speaking ring); ignore failures */ }
  }

  const createPeer = (id, initiator) => {
    if (G.pcs.has(id)) return G.pcs.get(id)
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    G.pcs.set(id, pc)
    if (G.localStream) G.localStream.getTracks().forEach((t) => pc.addTrack(t, G.localStream))
    else pc.addTransceiver('audio', { direction: 'recvonly' }) // no mic → listen-only
    pc.onicecandidate = (e) => { if (e.candidate) sendSignal(id, { candidate: e.candidate }) }
    pc.ontrack = (e) => {
      let el = G.audioEls.get(id)
      if (!el) { el = new Audio(); el.autoplay = true; G.audioEls.set(id, el) }
      el.srcObject = e.streams[0]
      el.play().catch(() => {})
      attachAnalyser(id, e.streams[0])
    }
    if (initiator) {
      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)
          sendSignal(id, { sdp: pc.localDescription })
        } catch { /* ignore */ }
      }
    }
    return pc
  }

  const onSignal = async (from, data) => {
    const pc = createPeer(from, false)
    try {
      if (data.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
        if (data.sdp.type === 'offer') {
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          sendSignal(from, { sdp: pc.localDescription })
        }
      } else if (data.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate))
      }
    } catch { /* ignore malformed signaling */ }
  }

  const closePeer = (id) => {
    G.pcs.get(id)?.close(); G.pcs.delete(id)
    const el = G.audioEls.get(id); if (el) { el.srcObject = null; G.audioEls.delete(id) }
    G.analysers.delete(id)
  }

  // ── Connect ──────────────────────────────────────────────────────────────
  const enter = useCallback(async () => {
    setError(''); setPhase('connecting')
    try {
      G.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      attachAnalyser('me', G.localStream)
    } catch {
      // No mic (declined / unavailable) → still join in listen-only mode. You can
      // walk and chat, hear others, but can't talk. Reflected in the mic button.
      G.localStream = null
      setNoMic(true); setMuted(true)
    }

    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${proto}//${location.host}/api/ws/office?token=${encodeURIComponent(token)}`)
    G.ws = ws

    ws.onopen = () => setPhase('live')
    ws.onclose = () => { if (phase !== 'error') { setPhase('error'); setError('การเชื่อมต่อหลุด') } }
    ws.onerror = () => {}
    ws.onmessage = (ev) => {
      let m; try { m = JSON.parse(ev.data) } catch { return }
      if (m.type === 'init') {
        G.me = { id: m.id, name: m.you.name, role: m.you.role, x: m.you.x, y: m.you.y, dir: 'down' }
        G.players.clear()
        for (const p of m.players) {
          G.players.set(p.id, { ...p, bubble: null, level: 0 })
          createPeer(p.id, true) // newcomer initiates to everyone already here
        }
        setOnline(G.players.size + 1)
      } else if (m.type === 'join') {
        G.players.set(m.player.id, { ...m.player, bubble: null, level: 0 })
        setOnline(G.players.size + 1)
      } else if (m.type === 'leave') {
        G.players.delete(m.id); closePeer(m.id); setOnline(G.players.size + 1)
      } else if (m.type === 'move') {
        const p = G.players.get(m.id); if (p) { p.x = m.x; p.y = m.y; p.dir = m.dir; p.room = m.room }
      } else if (m.type === 'state') {
        const p = G.players.get(m.id); if (p) p.muted = m.muted
      } else if (m.type === 'chat') {
        const p = G.players.get(m.id)
        const text = m.text
        if (p) p.bubble = { text, until: performance.now() + 5000 }
        else if (G.me && m.id === G.me.id) { /* echo of mine handled below */ }
        setChatLog((log) => [...log.slice(-49), { name: m.name, text, self: G.me && m.id === G.me.id }])
        if (G.me && m.id === G.me.id) { /* show my own bubble */
          // attach bubble to self via a special marker
          G.myBubble = { text, until: performance.now() + 5000 }
        }
      } else if (m.type === 'signal') {
        onSignal(m.from, m.data)
      }
    }
  }, [token, phase]) // eslint-disable-line

  // ── Game loop ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'live') return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const resize = () => {
      const r = wrapRef.current.getBoundingClientRect()
      canvas.width = r.width
      canvas.height = r.height
    }
    resize()
    window.addEventListener('resize', resize)

    const canMove = (x, y) => {
      const pts = [
        [x - BODY / 2, y - BODY / 2], [x + BODY / 2, y - BODY / 2],
        [x - BODY / 2, y + BODY / 2], [x + BODY / 2, y + BODY / 2],
      ]
      for (const [px, py] of pts) {
        const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE)
        if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H || G.walls[ty][tx]) return false
      }
      for (const s of FURNITURE.solids) {
        if (x + BODY / 2 > s.x && x - BODY / 2 < s.x + s.w && y + BODY / 2 > s.y && y - BODY / 2 < s.y + s.h) return false
      }
      return true
    }

    const loop = () => {
      const me = G.me
      if (me) {
        let dx = 0, dy = 0
        if (G.keys['arrowup'] || G.keys['w']) dy -= 1
        if (G.keys['arrowdown'] || G.keys['s']) dy += 1
        if (G.keys['arrowleft'] || G.keys['a']) dx -= 1
        if (G.keys['arrowright'] || G.keys['d']) dx += 1
        if (dx || dy) {
          const len = Math.hypot(dx, dy) || 1
          const nx = me.x + (dx / len) * SPEED
          const ny = me.y + (dy / len) * SPEED
          if (canMove(nx, me.y)) me.x = nx
          if (canMove(me.x, ny)) me.y = ny
          me.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')
          const now = performance.now()
          if (now - G.lastSent > 70 && G.ws?.readyState === 1) {
            G.lastSent = now
            const rm = roomAt(me.x, me.y)
            G.ws.send(JSON.stringify({ type: 'move', x: Math.round(me.x), y: Math.round(me.y), dir: me.dir, room: rm?.id || null }))
          }
        }
        const rm = roomAt(me.x, me.y)
        if ((rm?.id || null) !== (G._lastRoom || null)) { G._lastRoom = rm?.id || null; setCurrentRoom(rm || null) }
      }

      // speaking levels
      G.analysers.forEach((a, id) => {
        a.analyser.getByteFrequencyData(a.data)
        let sum = 0; for (let i = 0; i < a.data.length; i++) sum += a.data[i]
        const lvl = sum / a.data.length / 255
        if (id === 'me') { if (me) G.myLevel = lvl } else { const p = G.players.get(id); if (p) p.level = lvl }
      })

      // audio volumes by proximity / zone
      if (me) {
        const myRoom = roomAt(me.x, me.y)
        G.players.forEach((p, id) => {
          const el = G.audioEls.get(id); if (!el) return
          el.volume = calcVolume(me, myRoom, p)
        })
      }

      render(ctx, canvas, G, me)
      G.raf = requestAnimationFrame(loop)
    }
    // Dev hook: force one synchronous frame (headless preview pauses rAF when hidden).
    if (import.meta.env.DEV) { window.__office = G; G._renderOnce = () => render(ctx, canvas, G, G.me) }
    G.raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(G.raf); window.removeEventListener('resize', resize) }
  }, [phase]) // eslint-disable-line

  // keyboard
  useEffect(() => {
    const down = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      const k = e.key.toLowerCase()
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault()
      G.keys[k] = true
    }
    const up = (e) => { G.keys[e.key.toLowerCase()] = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, []) // eslint-disable-line

  // cleanup on unmount
  useEffect(() => () => {
    try { G.ws?.close() } catch {}
    G.pcs.forEach((pc) => pc.close())
    G.localStream?.getTracks().forEach((t) => t.stop())
    try { G.audioCtx?.close() } catch {}
  }, []) // eslint-disable-line

  const toggleMute = async () => {
    if (noMic) {
      // try to get the mic now (user may grant on second ask)
      try {
        G.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        attachAnalyser('me', G.localStream)
        G.pcs.forEach((pc) => G.localStream.getTracks().forEach((t) => pc.addTrack(t, G.localStream)))
        setNoMic(false); setMuted(false)
        G.ws?.readyState === 1 && G.ws.send(JSON.stringify({ type: 'state', muted: false }))
      } catch { setError('ยังเปิดไมค์ไม่ได้ — ตรวจสิทธิ์ไมโครโฟนในเบราว์เซอร์') }
      return
    }
    const next = !muted
    setMuted(next)
    G.localStream?.getAudioTracks().forEach((t) => (t.enabled = !next))
    G.ws?.readyState === 1 && G.ws.send(JSON.stringify({ type: 'state', muted: next }))
  }

  const sendChat = (e) => {
    e.preventDefault()
    const text = chatText.trim()
    if (!text || G.ws?.readyState !== 1) return
    G.ws.send(JSON.stringify({ type: 'chat', text }))
    setChatText('')
  }

  // ── Render: entry screen ────────────────────────────────────────────────────
  if (phase !== 'live') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 p-6">
        <div className="max-w-md w-full text-center bg-slate-800/60 border border-slate-700 rounded-2xl p-8">
          <div className="text-5xl mb-3">🏢</div>
          <h1 className="text-2xl font-bold mb-1">ACE Telecom — Virtual Office</h1>
          <p className="text-slate-400 text-sm mb-6">
            ออฟฟิศ pixel เดินคุยกันได้จริง — เดินด้วย <b>WASD / ลูกศร</b>, คุยเสียงเมื่อเข้าใกล้,
            พิมพ์แชทได้ ห้องโปรเจกต์แต่ละห้องเสียงไม่หลุดออก
          </p>
          {phase === 'error' && <div className="mb-4 text-rose-400 text-sm">{error}</div>}
          <button
            onClick={enter}
            disabled={phase === 'connecting'}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-900 font-semibold transition"
          >
            {phase === 'connecting' ? 'กำลังเชื่อมต่อ…' : '🎧 เข้าออฟฟิศ (ขออนุญาตไมค์)'}
          </button>
          <p className="text-xs text-slate-500 mt-4">
            ต้องอนุญาตไมโครโฟน · ใช้ได้ดีบน Chrome/Edge · เปิดหลายแท็บเพื่อทดสอบหลายคน
          </p>
        </div>
      </div>
    )
  }

  // ── Render: live ────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden select-none">
      {/* top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2 bg-slate-900/80 backdrop-blur border-b border-slate-800 text-slate-100">
        <div className="flex items-center gap-3">
          <span className="font-bold">🏢 ACE Telecom Office</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700">🟢 {online} ออนไลน์</span>
          {currentRoom && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: currentRoom.color }}>
              📍 {currentRoom.th}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleMute}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium ${noMic ? 'bg-amber-500 text-slate-900' : muted ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-slate-900'}`}>
            {noMic ? '🚫 ฟังอย่างเดียว — แตะเปิดไมค์' : muted ? '🔇 ไมค์ปิด' : '🎤 ไมค์เปิด'}
          </button>
          <button onClick={() => setChatOpen((v) => !v)} className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 text-slate-100">
            💬 แชท
          </button>
        </div>
      </div>

      <div ref={wrapRef} className="absolute inset-0">
        <canvas ref={canvasRef} className="block w-full h-full" />
      </div>

      {/* chat panel */}
      {chatOpen && (
        <div className="absolute bottom-3 left-3 z-20 w-80 max-w-[80vw] bg-slate-900/85 backdrop-blur border border-slate-800 rounded-xl flex flex-col">
          <div className="flex-1 max-h-48 overflow-y-auto px-3 py-2 space-y-1 text-sm">
            {chatLog.length === 0 && <div className="text-slate-500 text-xs">ยังไม่มีข้อความ — พิมพ์ทักทายเพื่อนร่วมงาน 👋</div>}
            {chatLog.map((c, i) => (
              <div key={i} className="text-slate-200">
                <span className={`font-semibold ${c.self ? 'text-emerald-400' : 'text-sky-400'}`}>{c.self ? 'คุณ' : c.name}:</span>{' '}
                <span>{c.text}</span>
              </div>
            ))}
          </div>
          <form onSubmit={sendChat} className="flex gap-2 p-2 border-t border-slate-800">
            <input
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="พิมพ์ข้อความ… (Enter ส่ง)"
              maxLength={300}
              className="flex-1 bg-slate-800 text-slate-100 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 ring-emerald-500"
            />
            <button className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-900 text-sm font-medium">ส่ง</button>
          </form>
        </div>
      )}

      {/* help */}
      <div className="absolute bottom-3 right-3 z-20 text-[11px] text-slate-400 bg-slate-900/70 px-3 py-1.5 rounded-lg">
        WASD / ลูกศร เดิน · เข้าใกล้เพื่อคุย · ห้องโปรเจกต์เสียงไม่หลุด
      </div>
    </div>
  )
}

// Volume between me and a peer, based on zones + distance. 0..1.
function calcVolume(me, myRoom, p) {
  if (p.muted) return 0
  const pRoom = roomAt(p.x, p.y)
  if (myRoom && pRoom) {
    if (myRoom.id === pRoom.id) return 1 // same room
    if (myRoom.social && pRoom.social) { /* fall through to proximity */ }
    else return 0 // walls between enclosed rooms block sound
  }
  const d = Math.hypot(me.x - p.x, me.y - p.y)
  const NEAR = 90, FAR = 340
  if (d <= NEAR) return 1
  if (d >= FAR) return 0
  return 1 - (d - NEAR) / (FAR - NEAR)
}

// ── Isometric canvas drawing ─────────────────────────────────────────────────
// World coords (x,y px) are the flat floor plane (same plane movement/collision use).
// We project to a 2:1 isometric screen and extrude walls/furniture into cuboids.
const rrect = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r) }
const ISO = { kx: 0.7, ky: 0.35, kz: 0.7 }
const WALL_H = 36
const isoP = (wx, wy, z, off) => ({ x: (wx - wy) * ISO.kx + off.x, y: (wx + wy) * ISO.ky - z * ISO.kz + off.y })

function roomAtTile(tx, ty) {
  for (const r of ROOMS) if (tx > r.x && tx < r.x + r.w - 1 && ty > r.y && ty < r.y + r.h - 1) return r
  return null
}

function quad(ctx, p1, p2, p3, p4, color) {
  ctx.fillStyle = color
  ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.closePath(); ctx.fill()
}

// extrude a floor rect into a cuboid; draw the two camera-facing side faces + top
function drawBox(ctx, wx, wy, w, h, height, base, off) {
  const B = isoP(wx + w, wy, 0, off), C = isoP(wx + w, wy + h, 0, off), D = isoP(wx, wy + h, 0, off)
  const At = isoP(wx, wy, height, off), Bt = isoP(wx + w, wy, height, off)
  const Ct = isoP(wx + w, wy + h, height, off), Dt = isoP(wx, wy + h, height, off)
  quad(ctx, D, C, Ct, Dt, shade(base, -0.34)) // south face
  quad(ctx, B, C, Ct, Bt, shade(base, -0.18)) // east face
  quad(ctx, At, Bt, Ct, Dt, base)             // top
}

function fillQuad(ctx, it, off, color) {
  const A = isoP(it.x, it.y, 0, off), B = isoP(it.x + it.w, it.y, 0, off)
  const C = isoP(it.x + it.w, it.y + it.h, 0, off), D = isoP(it.x, it.y + it.h, 0, off)
  quad(ctx, A, B, C, D, color)
}

function render(ctx, canvas, G, me) {
  const cw = canvas.width, ch = canvas.height
  ctx.fillStyle = '#0c111b'; ctx.fillRect(0, 0, cw, ch)
  const ref = me || { x: MAP_W * TILE / 2, y: MAP_H * TILE / 2 }
  const c0 = isoP(ref.x, ref.y, 0, { x: 0, y: 0 })
  const off = { x: cw / 2 - c0.x, y: ch / 2 - c0.y + 40 }
  const vis = (sx, sy, m = 160) => sx > -m && sx < cw + m && sy > -m && sy < ch + m

  // 1) floor tiles (diamonds)
  for (let ty = 0; ty < MAP_H; ty++) for (let tx = 0; tx < MAP_W; tx++) {
    if (G.walls[ty][tx]) continue
    const a = isoP(tx * TILE, ty * TILE, 0, off), cc = isoP((tx + 1) * TILE, (ty + 1) * TILE, 0, off)
    if (!vis(a.x, a.y) && !vis(cc.x, cc.y)) continue
    const rm = roomAtTile(tx, ty)
    fillQuad(ctx, { x: tx * TILE, y: ty * TILE, w: TILE, h: TILE }, off, rm ? shade(rm.color, -0.4) : '#3b4351')
  }
  // 2) flat decals (rugs / floor logo)
  for (const it of FURNITURE.items) {
    if (it.type === 'rug') fillQuad(ctx, it, off, it.color || '#1e293b')
    else if (it.type === 'logo') {
      const cp = isoP(it.x + it.w / 2, it.y + it.h / 2, 0.5, off)
      ctx.save(); ctx.fillStyle = 'rgba(150,190,255,0.25)'; ctx.textAlign = 'center'
      ctx.font = 'bold 15px sans-serif'; ctx.fillText('ACE TELECOM', cp.x, cp.y); ctx.restore()
    }
  }

  // 3) depth-sorted cuboids + avatars (painter's algorithm by world x+y)
  const list = []
  for (let ty = 0; ty < MAP_H; ty++) for (let tx = 0; tx < MAP_W; tx++) {
    if (G.walls[ty][tx]) list.push({ d: tx + ty, t: 'w', tx, ty })
  }
  for (const it of FURNITURE.items) {
    if (it.type === 'rug' || it.type === 'logo') continue
    list.push({ d: (it.x + it.w + it.y + it.h) / TILE, t: 'f', it })
  }
  G.players.forEach((p) => { stepAnim(p); list.push({ d: (p.x + p.y) / TILE + 0.01, t: 'a', p, isMe: false }) })
  if (me) { stepAnim(me); list.push({ d: (me.x + me.y) / TILE + 0.02, t: 'a', p: me, isMe: true }) }
  list.sort((a, b) => a.d - b.d)

  for (const o of list) {
    if (o.t === 'w') {
      const { tx, ty } = o
      if (tx === MAP_W - 1 || ty === MAP_H - 1) continue // cutaway: drop the two near walls so we see inside
      const a = isoP(tx * TILE, ty * TILE, 0, off)
      if (!vis(a.x, a.y, 280)) continue
      const perim = tx === 0 || ty === 0
      if (perim) drawBox(ctx, tx * TILE, ty * TILE, TILE, TILE, WALL_H, '#8a93a0', off) // tall concrete back walls
      else { // low glass partition
        ctx.globalAlpha = 0.5
        drawBox(ctx, tx * TILE, ty * TILE, TILE, TILE, 15, '#bcd2e8', off)
        ctx.globalAlpha = 1
      }
    } else if (o.t === 'f') {
      drawFurnIso(ctx, o.it, off)
    } else {
      const s = isoP(o.p.x, o.p.y, 0, off)
      const bubble = o.isMe ? G.myBubble : o.p.bubble
      const level = o.isMe ? (G.myLevel || 0) : (o.p.level || 0)
      const muted = o.isMe ? false : o.p.muted
      const name = o.isMe ? (o.p.name + ' (คุณ)') : o.p.name
      charSprite(ctx, s.x, s.y, { ...o.p, name }, o.isMe, bubble, level, muted)
    }
  }

  // 4) room name tags (screen space, floating at wall height)
  ctx.textAlign = 'center'
  for (const r of ROOMS) {
    const cp = isoP((r.x + r.w / 2) * TILE, (r.y + r.h / 2) * TILE, WALL_H + 6, off)
    if (!vis(cp.x, cp.y)) continue
    ctx.font = 'bold 12px sans-serif'
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.strokeText(r.name, cp.x, cp.y)
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillText(r.name, cp.x, cp.y)
  }
}

const FURN_H = { desk: 12, cabinet: 20, reception: 15, counter: 17, mtable: 12, rtable: 11, monitor: 17, chair: 13, sofa: 13, ctable: 7, plant: 22, rack: 30, fridge: 33, watercooler: 19, screen: 20, tv: 20 }
const FURN_COLOR = { desk: '#6e573e', cabinet: '#6b7280', reception: '#3f4b5e', counter: '#aeb8c6', mtable: '#5d4129', rtable: '#8c6a48', monitor: '#10243a', chair: '#3a4660', sofa: '#4d5a70', ctable: '#3a2a1c', plant: '#7c4a2d', rack: '#13203a', fridge: '#cbd5e1', watercooler: '#cfe8f5', screen: '#0e2a44', tv: '#13357a' }

function drawFurnIso(ctx, it, off) {
  const hgt = FURN_H[it.type] || 12
  const base = (it.type === 'chair' && it.boss) ? '#3b2a4d' : (FURN_COLOR[it.type] || '#64748b')
  drawBox(ctx, it.x, it.y, it.w, it.h, hgt, base, off)
  if (it.type === 'plant') {
    const cp = isoP(it.x + it.w / 2, it.y + it.h / 2, hgt + 7, off)
    ctx.fillStyle = '#2f8f4e'; ctx.beginPath(); ctx.ellipse(cp.x, cp.y, it.w * 0.55, it.w * 0.4, 0, 0, 7); ctx.fill()
    ctx.fillStyle = '#3da862'; ctx.beginPath(); ctx.ellipse(cp.x - 2, cp.y - 3, it.w * 0.3, it.w * 0.22, 0, 0, 7); ctx.fill()
  } else if (it.type === 'monitor') {
    const cp = isoP(it.x + it.w / 2, it.y + it.h, hgt * 0.85, off)
    ctx.fillStyle = '#7dd3fc'; ctx.beginPath(); ctx.ellipse(cp.x, cp.y - 2, it.w * 0.34, hgt * 0.18, 0, 0, 7); ctx.fill()
  }
}

// advance a tiny walk-cycle when a player's position changed this frame
function stepAnim(p) {
  const moved = p._ax !== undefined && (Math.abs(p.x - p._ax) > 0.15 || Math.abs(p.y - p._ay) > 0.15)
  p._ax = p.x; p._ay = p.y
  p._moving = moved
  p._anim = moved ? (p._anim || 0) + 0.3 : 0
}

const HAIR = ['#2b2b2b', '#3a2417', '#52341f', '#15110e', '#4a4a4a', '#5b3a29', '#6b4f2a']
function hairFor(seed) {
  let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return HAIR[h % HAIR.length]
}

// billboard character drawn at screen feet position (sx, sy) — faces the camera
function charSprite(ctx, sx, sy, p, isMe, bubble, level, muted) {
  const x = sx
  const footY = sy
  const anim = p._anim || 0, moving = p._moving
  const bob = moving ? Math.abs(Math.sin(anim)) * 1.5 : 0
  const dir = p.dir || 'down'
  const skin = '#f0c8a0', shirt = avatarColor(p.role), pants = '#374151'
  const hair = hairFor(p.code || p.name || '')

  // floor shadow + speaking ring
  ctx.beginPath(); ctx.ellipse(x, footY + 2, 9, 3.2, 0, 0, 7); ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fill()
  if (!muted && level > 0.05) {
    ctx.beginPath(); ctx.ellipse(x, footY + 2, 13 + level * 8, 5 + level * 3, 0, 0, 7)
    ctx.strokeStyle = `rgba(52,211,153,${Math.min(0.85, 0.35 + level)})`; ctx.lineWidth = 2.5; ctx.stroke()
  }

  const swing = moving ? Math.sin(anim) * 2.2 : 0
  // legs + shoes
  ctx.fillStyle = pants
  ctx.fillRect(x - 4.3, footY - 6 - bob, 3.4, 7 + swing)
  ctx.fillRect(x + 0.9, footY - 6 - bob, 3.4, 7 - swing)
  ctx.fillStyle = '#111827'
  ctx.fillRect(x - 4.6, footY + 0.4 - bob + Math.max(0, swing), 3.9, 2.2)
  ctx.fillRect(x + 0.7, footY + 0.4 - bob + Math.max(0, -swing), 3.9, 2.2)

  // torso + arms + hands
  const torsoY = footY - 16 - bob
  ctx.fillStyle = shirt; rrect(ctx, x - 6.5, torsoY, 13, 12, 3); ctx.fill()
  ctx.fillStyle = shade(shirt, 0.12); rrect(ctx, x - 6.5, torsoY, 13, 3, 2); ctx.fill() // shoulder light
  const armSwing = moving ? Math.sin(anim) * 2 : 0
  ctx.fillStyle = shade(shirt, -0.18)
  ctx.fillRect(x - 7.6, torsoY + 1 + armSwing, 2.6, 8.5)
  ctx.fillRect(x + 5.0, torsoY + 1 - armSwing, 2.6, 8.5)
  ctx.fillStyle = skin
  ctx.fillRect(x - 7.5, torsoY + 8.5 + armSwing, 2.6, 2.4)
  ctx.fillRect(x + 4.9, torsoY + 8.5 - armSwing, 2.6, 2.4)

  // head + hair + face
  const headY = torsoY - 5
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(x, headY, 6.3, 0, 7); ctx.fill()
  ctx.fillStyle = hair
  if (dir === 'up') { ctx.beginPath(); ctx.arc(x, headY, 6.5, 0, 7); ctx.fill() }
  else {
    ctx.beginPath(); ctx.arc(x, headY - 0.6, 6.6, Math.PI * 1.02, Math.PI * 1.98); ctx.fill()
    ctx.fillRect(x - 6.4, headY - 2, 1.9, 3.6); ctx.fillRect(x + 4.5, headY - 2, 1.9, 3.6)
  }
  if (dir !== 'up') {
    ctx.fillStyle = '#1f2937'
    if (dir === 'left') ctx.fillRect(x - 4.6, headY - 0.5, 1.7, 1.9)
    else if (dir === 'right') ctx.fillRect(x + 2.9, headY - 0.5, 1.7, 1.9)
    else { ctx.fillRect(x - 3.3, headY - 0.5, 1.6, 1.9); ctx.fillRect(x + 1.7, headY - 0.5, 1.6, 1.9) }
  }

  // "you" marker
  if (isMe) {
    ctx.fillStyle = '#34d399'
    ctx.beginPath(); ctx.moveTo(x, headY - 10); ctx.lineTo(x - 4, headY - 15); ctx.lineTo(x + 4, headY - 15); ctx.closePath(); ctx.fill()
  }
  if (muted) { ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🔇', x + 9, headY - 3) }

  // name
  const nameY = headY - 13
  ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'
  const nm = p.name || ''
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.strokeText(nm, x, nameY)
  ctx.fillStyle = isMe ? '#6ee7b7' : '#e8eef6'; ctx.fillText(nm, x, nameY)

  // chat bubble
  if (bubble && bubble.until > performance.now()) {
    const txt = bubble.text.length > 40 ? bubble.text.slice(0, 39) + '…' : bubble.text
    ctx.font = '12px sans-serif'
    const w = ctx.measureText(txt).width + 16
    const bx = x - w / 2, by = nameY - 30
    ctx.fillStyle = 'rgba(255,255,255,0.96)'
    rrect(ctx, bx, by, w, 22, 8); ctx.fill()
    ctx.beginPath(); ctx.moveTo(x - 5, by + 22); ctx.lineTo(x + 5, by + 22); ctx.lineTo(x, by + 28); ctx.fill()
    ctx.fillStyle = '#0f172a'; ctx.textAlign = 'center'; ctx.fillText(txt, x, by + 15)
  }
}


// lighten/darken a hex color. amt -1..1
function shade(hex, amt) {
  const h = hex.replace('#', '')
  let r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16)
  const f = (c) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)))
  return `rgb(${f(r)},${f(g)},${f(b)})`
}
