import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { Eye } from './Login'

const MIN = 8

// Tujuan tautan "reset kata sandi": Supabase menukar kode di URL menjadi sesi, lalu user mengisi sandi baru.
export default function Reset() {
  const { user, updatePassword, exchange } = useAuth()
  const { t } = useI18n()
  const nav = useNavigate()
  const loc = useLocation()
  const ran = useRef(false)
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('') // kunci kamus: eSame | eSave
  const [waited, setWaited] = useState(false)

  // Tautan reset membawa ?code=; tukar jadi sesi sebelum menampilkan form sandi baru.
  useEffect(() => {
    if (ran.current) return
    ran.current = true
    const code = new URLSearchParams(loc.search).get('code')
    if (code) exchange(code)
  }, [exchange, loc.search])

  // Beri waktu penukaran kode sebelum menyatakan tautan tidak valid.
  useEffect(() => { const id = setTimeout(() => setWaited(true), 3000); return () => clearTimeout(id) }, [])

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    const { error } = await updatePassword(password)
    setBusy(false)
    if (error) return setErr(error.code === 'same_password' ? 'eSame' : 'eSave')
    nav('/', { replace: true })
  }

  return (
    <section className="wrap auth">
      <div className="card auth-card">
        {user ? (
          <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
            <h2>{t('auth.newPw')}</h2>
            <label className="label">{t('auth.password')}
              <span className="pw">
                <input type={show ? 'text' : 'password'} required minLength={MIN} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" className="eye" onClick={() => setShow((s) => !s)} aria-label={show ? t('auth.hide') : t('auth.show')}><Eye off={show} /></button>
              </span>
              <small className="muted">{t('auth.min', { n: MIN })}</small>
            </label>
            {err && <p className="note err">{t(`auth.${err}`)}</p>}
            <button className="btn btn-primary full" disabled={busy}>{busy && <span className="spin" />}{t('auth.savePw')}</button>
          </form>
        ) : waited ? (
          <>
            <h2>{t('auth.badLinkTitle')}</h2>
            <p className="muted">{t('auth.badLinkText')}</p>
            <Link className="btn btn-primary full" to="/login">{t('auth.toLoginPage')}</Link>
          </>
        ) : (
          <p className="muted">{t('auth.checking')}</p>
        )}
      </div>
    </section>
  )
}
