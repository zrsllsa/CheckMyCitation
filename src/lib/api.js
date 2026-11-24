// Dev: path relatif, diteruskan proxy Vite ke VITE_API_BASE_URL. Produksi: langsung ke URL tersebut.
const BASE = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL ?? '')

async function req(path, { token, method = 'GET', body, credentials } = {}) {
  let res
  try {
    res = await fetch(BASE + path, {
      method,
      credentials,
      headers: {
        ...(body && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body && JSON.stringify(body),
    })
  } catch {
    throw { status: 0, code: 'NETWORK' }
  }
  if (!res.ok) {
    // Balasan non-JSON (mis. halaman "endpoint offline" ngrok) = backend tidak terjangkau, bukan galat domain.
    if (!res.headers.get('content-type')?.includes('json')) throw { status: 0, code: 'NETWORK' }
    const e = await res.json().catch(() => ({}))
    const d = e.detail
    const obj = d && typeof d === 'object' && !Array.isArray(d) ? d : { detail: Array.isArray(d) ? d.map((x) => x.msg).join('; ') : d }
    throw { status: res.status, ...obj, retryAfter: res.headers.get('Retry-After') }
  }
  return {
    data: res.status === 204 ? null : await res.json(),
    historySaved: res.headers.get('X-History-Saved') !== 'false',
  }
}

export const verifyGuest = (citation, style) =>
  req('/api/v1/verifications/guest', { method: 'POST', body: { citation, style }, credentials: 'include' })
export const verifyAuth = (token, citation, style) =>
  req('/api/v1/verifications/preview', { token, method: 'POST', body: { citation, style } })
export const getMe = (token) => req('/api/v1/me', { token })
export const getQuota = (token) => req('/api/v1/quota', { token })
export const getHistory = (token, offset = 0, limit = 20) =>
  req(`/api/v1/verifications/history?limit=${limit}&offset=${offset}`, { token })
export const getDetail = (token, id) => req(`/api/v1/verifications/${id}`, { token })
export const deleteVerification = (token, id) => req(`/api/v1/verifications/${id}`, { token, method: 'DELETE' })

// Peta error backend -> pesan UI (t = fungsi terjemahan). `login: true` memicu ajakan daftar/login.
export function describeError(e, t, locale = 'id-ID') {
  const pick = (k, extra = {}) => ({ title: t(`err.${k}.title`), text: t(`err.${k}.text`), ...extra })
  if (e.code === 'NETWORK' || e.status === 0) return pick('network', { retry: true })
  if (e.code === 'DAILY_QUOTA_EXCEEDED') {
    const when = e.reset_at ? new Date(e.reset_at).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) : t('err.quota.resetFallback')
    return { title: t('err.quota.title'), text: t('err.quota.text', { when }) }
  }
  if (e.code === 'GUEST_RETRY_LIMIT_EXCEEDED') return pick('retryLimit', { login: true })
  if (e.code?.startsWith('GUEST_IP')) return pick('ipLimit', { login: true })
  if (e.code === 'GUEST_TRIAL_USED') return pick('trialUsed', { login: true })
  if (e.status === 401 || e.status === 403) return pick('session', { login: true })
  if (e.status === 422) return pick('invalid')
  if (e.status === 503) return pick('unavailable', { retry: true })
  if (e.status === 404) return pick('notFound')
  return pick('generic', { retry: true })
}
