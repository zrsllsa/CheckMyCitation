import { useState } from 'react'
import { motion } from 'motion/react'
import { useI18n } from '../lib/i18n'

export default function FAQ() {
  const { t } = useI18n()
  const [open, setOpen] = useState(0)
  return (
    <section className="wrap page">
      <p className="eyebrow">FAQ</p>
      <h1 className="page-title">{t('faq.title')}</h1>
      <div className="faq">
        {t('faq.items').map(({ q, a }, i) => (
          <motion.div key={i} className="card faq-item" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <button className="faq-q" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
              {q}
              <motion.span animate={{ rotate: open === i ? 45 : 0 }}>+</motion.span>
            </button>
            <motion.div initial={false} animate={{ height: open === i ? 'auto' : 0, opacity: open === i ? 1 : 0 }} transition={{ duration: 0.3 }} style={{ overflow: 'hidden' }}>
              <p className="faq-a">{a}</p>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
