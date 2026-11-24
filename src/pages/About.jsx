import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { gsap, ScrollTrigger } from '../lib/gsap'
import { scroll } from '../lib/lenis'
import { useI18n } from '../lib/i18n'
import { STATUS_KEYS } from '../components/ResultCard'

// Isi sebelum rilis: alamat kontak dan nama pembuat. Kosong = bagian itu tidak ditampilkan.
const CONTACT_EMAIL = 'checkmycitation@houselab.my.id'
const CREATOR = ''

const IDS = ['apa', 'kenapa', 'cara', 'baca', 'sumber', 'batasan', 'tersedia', 'privasi', 'kontak']
const FACT_NUMS = [1, 6, 1, 10]

// Memecah teks jadi kata agar bisa "menyala" mengikuti scroll.
const Words = ({ children }) => children.split(' ').map((w, i) => <span className="w" key={i}>{w} </span>)

function Sec({ id, n, title, children }) {
  return (
    <section id={id} className="ab-sec">
      <header className="ab-head ab-fade"><span>{String(n).padStart(2, '0')}</span><h2>{title}</h2></header>
      {children}
    </section>
  )
}

export default function About() {
  const root = useRef(null)
  const { t, lang } = useI18n()
  const [active, setActive] = useState(0)
  const nav = t('about.nav')

  // lang sebagai dependensi: teks berganti panjang, jadi posisi ScrollTrigger dihitung ulang.
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.ab-hero > *', { y: 40, opacity: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out' })
      gsap.utils.toArray('.ab-sec').forEach((el, i) =>
        ScrollTrigger.create({ trigger: el, start: 'top 50%', end: 'bottom 50%', onToggle: (s) => s.isActive && setActive(i) }),
      )
      gsap.utils.toArray('.ab-scrub').forEach((p) =>
        gsap.fromTo(p.querySelectorAll('.w'), { opacity: 0.18 }, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: p, start: 'top 85%', end: 'bottom 55%', scrub: true } }),
      )
      gsap.fromTo('.ab-line i', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.ab-steps', start: 'top 70%', end: 'bottom 60%', scrub: true } })
      gsap.utils.toArray('.ab-num').forEach((el) => {
        const o = { v: 0 }
        gsap.to(o, { v: +el.dataset.to, duration: 1.2, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true }, onUpdate: () => (el.textContent = Math.round(o.v)) })
      })
      gsap.utils.toArray('.ab-fade').forEach((el) =>
        gsap.from(el, { y: 28, opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } }),
      )
    }, root)
    return () => ctx.revert()
  }, [lang])

  const go = (id) => (scroll.lenis ? scroll.lenis.scrollTo(`#${id}`, { offset: -110 }) : document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }))

  return (
    <div className="wrap ab" ref={root}>
      <div className="ab-hero">
        <h1>{t('about.title')}</h1>
      </div>

      <div className="ab-grid">
        <aside className="ab-side" aria-label={t('about.sideAria')}>
          {IDS.map((id, i) => (
            <button key={id} className={i === active ? 'on' : ''} onClick={() => go(id)}>
              <span>{String(i + 1).padStart(2, '0')}</span>{nav[i]}
            </button>
          ))}
        </aside>

        <div className="ab-main" key={lang}>
          <Sec id="apa" n={1} title={nav[0]}>
            <p className="ab-big ab-scrub"><Words>{t('about.what')}</Words></p>
          </Sec>

          <Sec id="kenapa" n={2} title={nav[1]}>
            <p className="ab-big ab-scrub"><Words>{t('about.why')}</Words></p>
          </Sec>

          <Sec id="cara" n={3} title={nav[2]}>
            <ol className="ab-steps">
              <span className="ab-line" aria-hidden="true"><i /></span>
              {t('about.steps').map(([title, d], i) => (
                <motion.li key={i} whileHover={{ x: 8 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }}>
                  <span className="dot">{i + 1}</span>
                  <h3>{title}</h3>
                  <p>{d}</p>
                </motion.li>
              ))}
            </ol>
          </Sec>

          <Sec id="baca" n={4} title={nav[3]}>
            <p className="ab-text ab-fade">{t('home.readLead')}</p>
            <div className="status-list ab-fade">
              {STATUS_KEYS.map((k, i) => (
                <motion.div key={k} className="status-row" whileHover={{ x: 6 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }}>
                  <span className="idx">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{t(`status.${k}.label`)}</h3>
                  <p>{t(`status.${k}.text`)}</p>
                </motion.div>
              ))}
            </div>
          </Sec>

          <Sec id="sumber" n={5} title={nav[4]}>
            <div className="ab-sources ab-fade">
              {['Crossref', 'OpenAlex'].map((s) => (
                <motion.div key={s} whileHover={{ y: -4 }}><b>{s}</b><span>{t('about.open')}</span></motion.div>
              ))}
            </div>
            <p className="ab-text ab-fade">{t('about.coverage')}</p>
          </Sec>

          <Sec id="batasan" n={6} title={nav[5]}>
            <p className="ab-big ab-scrub"><Words>{t('about.limitsLead')}</Words></p>
            <ul className="ab-limits">
              {t('about.limits').map((l) => <motion.li key={l} className="ab-fade" whileHover={{ x: 8 }}>{l}</motion.li>)}
            </ul>
          </Sec>

          <Sec id="tersedia" n={7} title={nav[6]}>
            <div className="ab-facts">
              {t('about.facts').map((label, i) => (
                <div key={label} className="ab-fade"><b className="ab-num" data-to={FACT_NUMS[i]}>0</b><span>{label}</span></div>
              ))}
            </div>
            <p className="ab-text ab-fade">{t('about.factsNote')}</p>
          </Sec>

          <Sec id="privasi" n={8} title={nav[7]}>
            <p className="ab-text ab-fade">{t('about.privacy')}</p>
          </Sec>

          <Sec id="kontak" n={9} title={nav[8]}>
            <p className="ab-text ab-fade">
              {t('about.contact')}{' '}
              {CONTACT_EMAIL ? <a className="link" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> : t('about.contactSoon')}
              {CREATOR && <><br />{t('about.madeBy', { n: CREATOR })}</>}
            </p>
          </Sec>

          <div className="ab-cta-wrap ab-fade">
            <Link to="/" className="ab-cta">
              <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>{t('about.cta')} <i>→</i></motion.span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
