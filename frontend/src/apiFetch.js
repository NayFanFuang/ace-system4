const AUTH_STORAGE_KEY = 'ace_system_auth_user_v1'

function getToken() {
  try {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY)
    return stored ? JSON.parse(stored)?.token : null
  } catch {
    return null
  }
}

// Sliding session: if the backend returned a refreshed token, persist it so the next
// request carries a token with a fresh expiry (idle timeout = JWT_EXPIRE_HOURS).
function storeRefreshedToken(res) {
  try {
    const fresh = res.headers.get('X-Refreshed-Token')
    if (!fresh) return
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (!stored) return
    const user = JSON.parse(stored)
    if (user && user.token !== fresh) {
      user.token = fresh
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
    }
  } catch {
    /* non-fatal */
  }
}

/**
 * fetch wrapper that auto-attaches Bearer token from localStorage.
 * Usage: apiFetch('/api/clock/in', { method: 'POST', body: JSON.stringify({...}) })
 */
export async function apiFetch(url, options = {}) {
  const token = getToken()
  const isFormData = options.body instanceof FormData
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  // Token expired (idle > JWT_EXPIRE_HOURS) → clear storage and reload to login screen
  if (res.status === 401) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    window.location.reload()
    return res
  }

  // Slide the session forward on any authenticated, non-401 response.
  storeRefreshedToken(res)
  return res
}
