export const pad2 = value => String(value).padStart(2, '0')

export function formatDateYmd(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function formatTime24(value = new Date(), withSeconds = false) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return withSeconds ? '--:--:--' : '--:--'
  const base = `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
  return withSeconds ? `${base}:${pad2(date.getSeconds())}` : base
}

export function formatDateTime24(value = new Date(), withSeconds = true) {
  return `${formatDateYmd(value)} ${formatTime24(value, withSeconds)}`
}
