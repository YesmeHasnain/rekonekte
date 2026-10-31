// Tiny client for the Laravel API. Same-origin session cookies (Sanctum SPA auth):
// fetch the CSRF cookie once, then send it back as X-XSRF-TOKEN on writes.
let csrfReady = null

function xsrf() {
  const m = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : ''
}

export class ApiError extends Error {
  constructor(status, body) {
    const first = body?.errors && Object.values(body.errors)[0]?.[0]
    super(first || body?.message || 'Something went wrong. Please try again.')
    this.status = status
    this.errors = body?.errors || {}
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  if (method !== 'GET') {
    csrfReady ||= fetch('/sanctum/csrf-cookie', { credentials: 'same-origin' })
    await csrfReady
  }
  const res = await fetch('/api' + path, {
    method,
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-Locale': localStorage.getItem('rk-lang') || 'en',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(method !== 'GET' ? { 'X-XSRF-TOKEN': xsrf() } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 419) { csrfReady = null } // stale CSRF token: next call fetches a fresh one
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (data?.suspended) window.location.assign('/login') // the session has just been ended
  if (!res.ok) throw new ApiError(res.status, data)
  return data
}
