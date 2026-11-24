import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useAuth } from '../lib/auth'
import GooeyNav from './GooeyNav'
import { useI18n } from '../lib/i18n'

const LINKS = [['/', 'Home'], ['/about', 'About'], ['/faq', 'FAQ']]
const PERSON = (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
)

export default function Nav() {
  const { user, signOut } = useAuth()
  const { t } = useI18n()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const [mopen, setMopen] = useState(false)
  const mref = useRef(null)

  useEffect(() => { setOpen(false); setMopen(false) }, [pathname])
  useEffect(() => {
    const close = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false)
      if (!mref.current?.contains(e.target)) setMopen(false)
    }
    addEventListener('pointerdown', close)
    return () => removeEventListener('pointerdown', close)
  }, [])

  const items = LINKS.map(([, label]) => ({ label }))
  const found = LINKS.findIndex(([to]) => to === pathname)
  const active = found >= 0 ? found : 0

  return (
    <motion.header className="nav" initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
      <div className="burger-wrap" ref={mref}>
        <button className="burger" aria-label="Menu" aria-expanded={mopen} onClick={() => setMopen((o) => !o)}>
          <i style={mopen ? { rotate: '45deg', translate: '0 7px' } : undefined} />
          <i style={mopen ? { opacity: 0 } : undefined} />
          <i style={mopen ? { rotate: '-45deg', translate: '0 -7px' } : undefined} />
        </button>
        <AnimatePresence>
          {mopen && (
            <motion.nav className="menu card mnav" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              {LINKS.map(([to, label]) => <Link key={to} to={to} className={to === pathname ? 'on' : ''}>{label}</Link>)}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>

      <Link to="/" className="logo">
        <img className="logo-img" src="/logo.png" alt="" /><span className="logo-text">Check My Citation</span>
      </Link>

      <div className="nav-links">
        <GooeyNav
          items={items}
          activeIndex={active}
          onChange={(i) => navigate(LINKS[i][0])}
          theme="dark" size="md" frame particleCount={15} spread={56} animationTime={600} timeVariance={300} gooeyness={0.5} wobble={0.5} hoverEffect
        />
      </div>

      <div className="nav-right" ref={ref}>
        <button
          className={`profile-btn ${pathname === '/login' || pathname === '/dashboard' ? 'on' : ''}`}
          aria-label={user ? t('nav.menu') : t('nav.login')}
          aria-expanded={user ? open : undefined}
          onClick={() => (user ? setOpen((o) => !o) : navigate('/login', { state: { from: { pathname } } }))}
        >
          {PERSON}
        </button>
        <AnimatePresence>
          {user && open && (
            <motion.div className="menu card" role="menu" initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }} transition={{ duration: 0.18 }}>
              <div className="menu-head">
                <small className="muted">{t('nav.signedAs')}</small>
                <b>{user.email}</b>
              </div>
              <Link to="/dashboard" role="menuitem">{t('nav.history')}</Link>
              <Link to="/dashboard" role="menuitem">{t('nav.quota')}</Link>
              <Link to="/" role="menuitem">{t('nav.newVerify')}</Link>
              <button role="menuitem" className="danger" onClick={async () => { await signOut(); navigate('/') }}>{t('nav.logout')}</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  )
}
