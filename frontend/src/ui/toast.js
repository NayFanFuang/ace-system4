// Imperative toast — framework-agnostic, no provider needed.
// Usage: import { toast } from './ui/toast.js'; toast('บันทึกแล้ว', 'ok')
let wrap = null

function ensureWrap() {
  if (wrap && document.body.contains(wrap)) return wrap
  wrap = document.createElement('div')
  wrap.className = 'ds-toast-wrap'
  document.body.appendChild(wrap)
  return wrap
}

const ICON = {
  ok: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  err: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
}

export function toast(message, type = 'info') {
  const el = document.createElement('div')
  el.className = 'ds-toast' + (type === 'ok' ? ' ds-toast-ok' : type === 'err' ? ' ds-toast-err' : '')
  el.innerHTML = (ICON[type] || ICON.info) + `<span>${message}</span>`
  ensureWrap().appendChild(el)
  requestAnimationFrame(() => el.classList.add('ds-show'))
  setTimeout(() => {
    el.classList.remove('ds-show')
    setTimeout(() => el.remove(), 400)
  }, 2600)
}
