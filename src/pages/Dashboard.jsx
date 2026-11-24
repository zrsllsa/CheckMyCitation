import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { getMe, getQuota, getHistory, getDetail, deleteVerification, describeError } from '../lib/api'
import ResultCard, { STATUS_KEYS, TONE } from '../components/ResultCard'

export default function Dashboard() {
  const { user, loading, call } = useAuth()
  const { t, locale } = useI18n()
  const loc = useLocation()
  const [me, setMe] = useState(null)
  const [quota, setQuota] = useState(null)
  const [items, setItems] = useState(null)
  const [more, setMore] = useState(false)
  const [error, setError] = useState(null) // galat mentah; diterjemahkan saat render
  const [detail, setDetail] = useState(null) // {loading} | {data} | {error}
  const [confirmId, setConfirmId] = useState(null)

  const fmt = (iso) => new Date(iso).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })
  const msg = (e) => describeError(e, t, locale)

  const load = useCallback(async (offset = 0) => {
    try {
      const { data } = await call((tok) => getHistory(tok, offset))
      setItems((prev) => (offset ? [...prev, ...data.items] : data.items))
      setMore(data.has_more)
    } catch (e) { setError(e) }
  }, [call])

  useEffect(() => {
    if (!user) return
    call(getMe).then((r) => setMe(r.data)).catch(() => {})
    call(getQuota).then((r) => setQuota(r.data)).catch(() => {})
    load()
  }, [user, call, load])

  if (loading) return null
  if (!user) return <Navigate to="/login" replace state={{ from: loc }} />

  const open = async (id) => {
    setDetail({ loading: true })
    try { setDetail({ data: (await call((tok) => getDetail(tok, id))).data }) }
    catch (e) { setDetail({ error: e }) }
  }
  const remove = async (id) => {
    try {
      await call((tok) => deleteVerification(tok, id))
      setItems((p) => p.filter((x) => x.id !== id))
    } catch (e) { setError(e) }
    setConfirmId(null)
  }

  const err = error && msg(error)
  const derr = detail?.error && msg(detail.error)

  return (
    <section className="wrap dash">
      <div className="dash-top">
        <div>
          <p className="eyebrow">{t('dash.tag')}</p>
          <h1 className="h1s">{me?.display_name || me?.email || user.email}</h1>
        </div>
        <div className="card quota">
          <small className="muted">{t('dash.quotaToday')}</small>
          <b>{quota ? t('dash.left', { n: quota.remaining }) : '…'}</b>
          <div className="bar"><motion.i initial={{ width: 0 }} animate={{ width: quota ? `${(quota.used / quota.limit) * 100}%` : 0 }} transition={{ duration: 1, ease: 'easeOut' }} /></div>
          <small className="muted">{quota ? t('dash.used', { u: quota.used, l: quota.limit, when: fmt(quota.reset_at) }) : ''}</small>
        </div>
      </div>

      {err && <div className="card alert"><b>{err.title}</b><p>{err.text}</p></div>}

      <h2 className="h2s">{t('dash.history')}</h2>
      {items === null ? (
        <div className="skeletons">{[0, 1, 2].map((i) => <div key={i} className="skel" />)}</div>
      ) : items.length === 0 ? (
        <div className="card empty">
          <p>{t('dash.empty')}</p>
          <Link className="btn btn-primary" to="/">{t('dash.check')}</Link>
        </div>
      ) : (
        <motion.ul className="hist" initial="h" animate="v" variants={{ v: { transition: { staggerChildren: 0.05 } } }}>
          <AnimatePresence initial={false}>
            {items.map((it) => {
              const k = STATUS_KEYS.includes(it.status) ? it.status : 'not_found'
              return (
                <motion.li key={it.id} layout variants={{ h: { opacity: 0, y: 16 }, v: { opacity: 1, y: 0 } }} exit={{ opacity: 0, x: -40 }} className="card hist-item" whileHover={{ x: 4 }}>
                  <button className="hist-main" onClick={() => open(it.id)}>
                    <span className={`badge sm ${TONE[k]}`}>{t(`status.${k}.label`)}</span>
                    <p>{it.citation_text}</p>
                    <small className="muted">{it.style.toUpperCase()} · {fmt(it.created_at)}{it.match_score != null && ` · ${t('dash.score', { n: Math.round(it.match_score) })}`}</small>
                  </button>
                  {confirmId === it.id ? (
                    <span className="row">
                      <button className="btn btn-danger" onClick={() => remove(it.id)}>{t('dash.del')}</button>
                      <button className="btn btn-ghost" onClick={() => setConfirmId(null)}>{t('dash.cancel')}</button>
                    </span>
                  ) : (
                    <button className="btn btn-ghost" onClick={() => setConfirmId(it.id)} aria-label={t('dash.delAria')}>✕</button>
                  )}
                </motion.li>
              )
            })}
          </AnimatePresence>
        </motion.ul>
      )}
      {more && <button className="btn btn-ghost loadmore" onClick={() => load(items.length)}>{t('dash.more')}</button>}
      <p className="fine">{t('dash.note')}</p>

      <AnimatePresence>
        {detail && (
          <>
            <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDetail(null)} />
            <motion.aside className="drawer" data-lenis-prevent initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 260, damping: 32 }}>
              <button className="btn btn-ghost" onClick={() => setDetail(null)}>{t('dash.close')}</button>
              {detail.loading && <div className="skel tall" />}
              {derr && <div className="card alert"><b>{derr.title}</b><p>{derr.text}</p></div>}
              {detail.data && <><p className="citation-q">{detail.data.citation_text}</p><ResultCard r={detail.data} /></>}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </section>
  )
}
