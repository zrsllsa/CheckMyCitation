import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'

const MIN = 8

// sessionStorage bisa melempar error di mode privat: bungkus agar tidak merusak halaman.
const store = {
  get: (k) => { try { return sessionStorage.getItem(k) } catch { return null } },
  set: (k, v) => { try { sessionStorage.setItem(k, v) } catch { /* abaikan */ } },
  take: (k) => { const v = store.get(k); try { sessionStorage.removeItem(k) } catch { /* abaikan */ } return v },
}

export const Eye = ({ off }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M4 4l16 16" />}
  </svg>
)

// Mengembalikan kunci kamus (auth.<k>), diterjemahkan saat render agar ikut ganti bahasa.
function authError(e) {
  if (e.code === 'email_not_confirmed') return { k: 'eUnverified', unverified: true }
  if (e.code === 'invalid_credentials') return { k: 'eBad' }
  if (e.code === 'weak_password') return { k: 'eWeak' }
  if (e.status === 429 || e.code?.includes('rate_limit')) return { k: 'eRate' }
  if (e.code === 'email_address_not_authorized') return { k: 'eServer' }
  // AuthRetryableFetchError dipakai untuk koneksi putus (status 0) DAN respons 5xx server.
  if (e.name === 'AuthRetryableFetchError') return { k: e.status ? 'eServer' : 'eNet' }
  return { k: 'eGeneric' }
}

export default function Login({ callback }) {
  const { user, loading, enabled, signIn, signUp, google, resend, resetPassword, exchange } = useAuth()
  const { t } = useI18n()
  const nav = useNavigate()
  const loc = useLocation()
  const [mode, setMode] = useState('login') // login | register | forgot
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [sent, setSent] = useState(null) // {type:'verify'|'reset', email}
  const [resent, setResent] = useState(false)
  const [expired] = useState(() => !!store.take('sessionExpired'))

  // Halaman callback: tukar ?code= dari Google/email menjadi sesi; galatnya ditampilkan, bukan menunggu selamanya.
  const [cbErr, setCbErr] = useState(null)
  const [late, setLate] = useState(false)
  const ran = useRef(false)
  useEffect(() => {
    if (!callback || ran.current || !enabled) return
    ran.current = true
    const code = new URLSearchParams(loc.search).get('code')
    if (code) exchange(code).then(({ error }) => { if (error) setCbErr(error.message) })
  }, [callback, enabled, exchange, loc.search])
  // Timer terpisah: efek di atas hanya jalan sekali (guard ref), jadi cleanup-nya tidak boleh membawa timer.
  useEffect(() => {
    if (!callback) return
    const id = setTimeout(() => setLate(true), 8000)
    return () => clearTimeout(id)
  }, [callback])

  const raw = loc.state?.from?.pathname ?? store.get('authFrom') ?? '/'
  const from = ['/login', '/auth/callback', '/auth/reset'].includes(raw) ? '/' : raw

  // Sesi muncul (login biasa atau callback OAuth/verifikasi) -> kembali ke halaman tujuan.
  useEffect(() => {
    if (user) { store.take('authFrom'); nav(from, { replace: true }) }
  }, [user, from, nav])

  if (callback) {
    const q = new URLSearchParams(loc.hash.slice(1) + '&' + loc.search.slice(1))
    const failed = q.get('error_description') || cbErr || (late && !user ? t('auth.cbTimeout') : null)
    return (
      <section className="wrap auth">
        <div className="card auth-card">
          {failed ? (
            <>
              <h2>{t('auth.cbFailed')}</h2>
              <p className="note err">{String(failed).replace(/\+/g, ' ')}</p>
              <Link className="btn btn-primary full" to="/login">{t('auth.cbBack')}</Link>
            </>
          ) : (
            <p className="muted">{loading || !user ? t('auth.cbFinishing') : ''}</p>
          )}
        </div>
      </section>
    )
  }

  if (!enabled)
    return <section className="wrap auth"><div className="card auth-card"><h2>{t('auth.noConfigTitle')}</h2><p className="muted">{t('auth.noConfigText')}</p></div></section>

  const submit = async (e) => {
    e.preventDefault()
    setErr(null)
    setBusy(true)
    store.set('authFrom', from)
    try {
      if (mode === 'forgot') {
        const { error } = await resetPassword(email)
        if (error) throw error
        setSent({ type: 'reset', email })
      } else if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) throw error
      } else {
        const { data, error } = await signUp(email, password)
        if (error) throw error
        // Email sudah terdaftar: Supabase mengembalikan user tanpa identities.
        if (data.user?.identities?.length === 0) return setErr({ k: 'eExists' })
        if (!data.session) setSent({ type: 'verify', email }) // verifikasi email aktif
      }
    } catch (e2) {
      console.error('[auth]', e2.name, e2.status, e2.code, e2.message)
      setErr(authError(e2))
    } finally {
      setBusy(false)
    }
  }

  const doResend = async (to) => {
    setResent(true)
    const { error } = await resend(to)
    if (error) { setResent(false); setErr(authError(error)) }
    else setTimeout(() => setResent(false), 30000) // cegah kirim berulang
  }

  const switchMode = (m) => { setMode(m); setErr(null); setSent(null) }
  const title = { login: t('auth.welcome'), register: t('auth.create'), forgot: t('auth.forgot') }[mode]
  const errText = err && t(`auth.${err.k}`, { n: MIN })
  const [v1, v2] = t('auth.verifyBody')
  const [r1, r2] = t('auth.resetBody')

  return (
    <section className="wrap auth">
      <motion.div className="card auth-card" initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 22 }}>
        {sent ? (
          <>
            <h2>{t('auth.checkTitle')}</h2>
            <p className="muted">
              {sent.type === 'verify' ? <>{v1} <b>{sent.email}</b>{v2}</> : <>{r1} <b>{sent.email}</b> {r2}</>}
            </p>
            {sent.type === 'verify' && (
              <button className="btn btn-ghost full" disabled={resent} onClick={() => doResend(sent.email)}>{resent ? t('auth.resent') : t('auth.resend')}</button>
            )}
            {err && <p className="note err">{errText}</p>}
            <button type="button" className="textbtn" onClick={() => switchMode('login')}>{t('auth.backToLoginPage')}</button>
          </>
        ) : (
          <form onSubmit={submit} className="auth-form" style={{ display: 'grid', gap: 14 }}>
            <h2>{title}</h2>
            <p className="muted">{mode === 'forgot' ? t('auth.subForgot') : t('auth.sub')}</p>
            {expired && mode === 'login' && <p className="note">{t('auth.expired')}</p>}

            {mode !== 'forgot' && (
              <>
                <button type="button" className="btn btn-ghost full" onClick={() => { store.set('authFrom', from); google() }}>{t('auth.google')}</button>
                <div className="or"><span>{t('auth.or')}</span></div>
              </>
            )}

            <label className="label">{t('auth.email')}<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>

            {mode !== 'forgot' && (
              <label className="label">{t('auth.password')}
                <span className="pw">
                  <input type={show ? 'text' : 'password'} required minLength={mode === 'register' ? MIN : undefined} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" className="eye" onClick={() => setShow((s) => !s)} aria-label={show ? t('auth.hide') : t('auth.show')}><Eye off={show} /></button>
                </span>
                {mode === 'register' && <small className="muted">{t('auth.min', { n: MIN })}</small>}
              </label>
            )}

            <AnimatePresence>
              {err && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                  <p className="note err">{errText}</p>
                  {err.unverified && <button type="button" className="btn btn-ghost sm" style={{ marginTop: 10 }} disabled={resent} onClick={() => doResend(email)}>{resent ? t('auth.resent') : t('auth.resendVerify')}</button>}
                </motion.div>
              )}
            </AnimatePresence>

            <button className="btn btn-primary full" disabled={busy}>
              {busy && <span className="spin" />}
              {mode === 'login' ? t('auth.login') : mode === 'register' ? t('auth.register') : t('auth.sendReset')}
            </button>

            <div className="auth-row">
              <button type="button" className="textbtn" onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>
                {mode === 'login' ? t('auth.toRegister') : mode === 'register' ? t('auth.toLogin') : t('auth.backToLogin')}
              </button>
              {mode === 'login' && <button type="button" className="textbtn" onClick={() => switchMode('forgot')}>{t('auth.forgotLink')}</button>}
            </div>
          </form>
        )}
      </motion.div>
    </section>
  )
}
