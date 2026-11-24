import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { scroll } from '../lib/lenis'
import { verifyGuest, verifyAuth, getQuota, describeError } from '../lib/api'
import ResultCard from './ResultCard'

const STYLES = ['apa', 'ieee', 'mla', 'chicago', 'harvard', 'vancouver']

export default function Verifier() {
  const { user, call, enabled } = useAuth()
  const { t, locale } = useI18n()
  const limit = user ? 2000 : 500
  const [text, setText] = useState('')
  const [style, setStyle] = useState('apa')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null) // galat mentah; diterjemahkan saat render agar ikut ganti bahasa
  const [notice, setNotice] = useState(false)
  const [quota, setQuota] = useState(null)
  const outRef = useRef(null)

  // Kuota langsung ditampilkan saat user login (mis. 9/10), bukan baru setelah verifikasi.
  useEffect(() => {
    if (!user) return setQuota(null)
    call(getQuota).then((r) => setQuota(r.data)).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `call` dibuat ulang tiap render; cukup ikuti user
  }, [user?.id])

  const blank = !text.trim()
  const over = text.length > limit
  const exhausted = quota && quota.remaining <= 0
  const err = error && describeError(error, t, locale)

  // Setelah hasil/galat muncul, gulirkan halaman ke sana.
  useEffect(() => {
    if (!result && !error) return
    const id = setTimeout(() => {
      const el = outRef.current
      if (!el) return
      if (scroll.lenis) scroll.lenis.scrollTo(el, { offset: -96, duration: 1.1 })
      else el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 250)
    return () => clearTimeout(id)
  }, [result, error])

  const submit = async (e) => {
    e.preventDefault()
    if (blank || over || busy) return
    setBusy(true)
    setError(null)
    setNotice(false)
    try {
      const { data, historySaved } = user
        ? await call((tok) => verifyAuth(tok, text.trim(), style))
        : await verifyGuest(text.trim(), style)
      setResult(data)
      if (user && !historySaved) setNotice(true)
      if (user) call(getQuota).then((r) => setQuota(r.data)).catch(() => {})
    } catch (e2) {
      setResult(null)
      setError(e2)
      if (e2.code === 'DAILY_QUOTA_EXCEEDED') setQuota({ used: 10, remaining: 0, limit: 10, reset_at: e2.reset_at })
    } finally {
      setBusy(false)
    }
  }

  const [g1, g2, g3] = t('verify.guestHint')
  const [o1, o2, o3] = t('verify.over500')

  return (
    <div id="verify">
      <form className="card verifier" onSubmit={submit}>
        <label htmlFor="cit" className="label">{t('verify.label')}</label>
        <textarea id="cit" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder={t('verify.placeholder')} />
        {over && (
          <p className="note">
            {user ? t('verify.over2000') : <>{o1} <Link to="/login" className="link">{o2}</Link> {o3}</>}
          </p>
        )}
        <small className="muted style-cap">{t('verify.styleCap')}</small>
        <div className="row between">
          <div className="pills" role="radiogroup" aria-label={t('verify.styleAria')}>
            {STYLES.map((s) => (
              <button type="button" key={s} role="radio" aria-checked={style === s} className={`pill ${style === s ? 'on' : ''}`} onClick={() => setStyle(s)}>
                {style === s && <motion.span layoutId="pill" className="pill-bg" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                <span>{s.toUpperCase()}</span>
              </button>
            ))}
          </div>
          <span className={`count ${over ? 'bad' : ''}`}>{text.length}/{limit}</span>
        </div>
        <div className="row between">
          <small className="muted">
            {user ? (
              quota ? t('verify.quotaLeft', { r: quota.remaining, l: quota.limit }) : t('verify.userHint')
            ) : (
              <>{g1} <Link to="/login" className="link">{g2}</Link> {g3}</>
            )}
          </small>
          <motion.button className={`btn btn-primary ${busy ? 'loading' : ''}`} aria-busy={busy} disabled={blank || over || busy || exhausted} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
            {busy ? <span className="spin" /> : null}
            {busy ? t('verify.busy') : t('verify.submit')}
          </motion.button>
        </div>
      </form>

      <div ref={outRef}>
        <AnimatePresence mode="wait">
          {err && (
            <motion.div key="err" className="card alert" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <b>{err.title}</b>
              <p>{err.text}</p>
              <div className="row">
                {err.login && enabled && <Link className="btn btn-primary" to="/login">{t('verify.signup')}</Link>}
                {err.retry && <button className="btn btn-ghost" onClick={submit}>{t('verify.retry')}</button>}
              </div>
            </motion.div>
          )}
          {result && (
            <motion.div key={JSON.stringify(result.input) + result.status} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {notice && <p className="toast">{t('verify.historyFail')}</p>}
              <ResultCard r={result} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
