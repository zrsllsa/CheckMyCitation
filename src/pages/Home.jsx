import { useLayoutEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { gsap } from '../lib/gsap'
import { useI18n } from '../lib/i18n'
import Verifier from '../components/Verifier'

export default function Home() {
  const root = useRef(null)
  const { t, lang } = useI18n()

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } })
      tl.from('.hero-word', { yPercent: 115, duration: 1.1, stagger: 0.07 })
        .from('.hero-fade', { y: 24, opacity: 0, duration: 0.8, stagger: 0.12 }, '-=0.6')

      gsap.utils.toArray('.reveal').forEach((el) =>
        gsap.from(el, { y: 56, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } }),
      )
      gsap.utils.toArray('.step').forEach((el, i) =>
        gsap.from(el, { y: 70, opacity: 0, duration: 0.9, delay: i * 0.1, ease: 'power3.out', scrollTrigger: { trigger: '.steps', start: 'top 80%' } }),
      )
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={root}>
      <section className="hero hero-full wrap">
        <h1 key={lang}>
          {t('hero.title').map((w, i) => (
            <span className="mask" key={i}><span className="hero-word">{w}&nbsp;</span></span>
          ))}
        </h1>
        <div className="hero-fade hero-form"><Verifier /></div>
      </section>

      <section className="wrap section">
        <h2 className="reveal">{t('home.stepsTitle')}</h2>
        <div className="steps">
          {t('home.steps').map((s, i) => (
            <motion.div className="card step" key={i} whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
              <span className="num">{String(i + 1).padStart(2, '0')}</span>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}
