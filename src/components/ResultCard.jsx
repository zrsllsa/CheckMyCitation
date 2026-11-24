import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useI18n } from '../lib/i18n'

// Teks status ada di kamus (status.<kunci>.label/text); di sini hanya penanda monokrom + kunci kelas.
export const STATUS_KEYS = ['verified_match', 'possible_match', 'metadata_mismatch', 'not_found', 'verification_unavailable']
export const GLYPH = { verified_match: '✓', possible_match: '≈', metadata_mismatch: '≠', not_found: '?', verification_unavailable: '!' }
export const TONE = { verified_match: 'green', possible_match: 'amber', metadata_mismatch: 'orange', not_found: 'gray', verification_unavailable: 'blue' }

const MARK = { match: ['✓', 'match', 'ok'], mismatch: ['≠', 'mismatch', 'bad'], partial: ['≈', 'partial', 'bad'], unavailable: ['–', 'unavailable', ''] }

const doi = (d) => d?.replace(/^https?:\/\/(dx\.)?doi\.org\//, '')

// Satu baris perbandingan. Nilai yang cocok tampil sekali; yang beda menampilkan kandidat + coretan input Anda.
function Row({ k, input, cand, v, pct, list, plain }) {
  const { t } = useI18n()
  const [all, setAll] = useState(false)
  const has = (x) => (Array.isArray(x) ? x.length > 0 : x != null && x !== '')
  const bad = v === 'mismatch' || v === 'partial'
  const shown = has(cand) ? cand : input
  const text = (x) => (Array.isArray(x) ? (all ? x : x.slice(0, 3)).join(', ') : x)
  const extra = list && Array.isArray(shown) && shown.length > 3 ? shown.length - 3 : 0
  const [glyph, wordKey, cls] = MARK[v] ?? MARK.unavailable

  return (
    <div className={`rs-row ${bad ? 'bad' : ''}`}>
      <span className="rs-k">{k}</span>
      <div className={`rs-v ${v === 'unavailable' || !has(shown) ? 'dim' : ''}`}>
        {has(shown) ? text(shown) : '—'}
        {extra > 0 && <button type="button" className="rs-more" onClick={() => setAll((a) => !a)}>{all ? t('result.collapse') : t('result.more', { n: extra })}</button>}
        {bad && has(input) && <span className="was">{t('result.wrote')} <s>{text(input)}</s></span>}
        {v === 'unavailable' && !has(input) && has(cand) && <span className="was">{t('result.notInInput')}</span>}
      </div>
      <span className={`rs-mark ${cls}`}>{!plain && <>{glyph} {t(`result.mark.${wordKey}`)}{pct != null && v !== 'unavailable' ? ` · ${Math.round(pct)}%` : ''}</>}</span>
    </div>
  )
}

export default function ResultCard({ r }) {
  const { t } = useI18n()
  const [showWhy, setShowWhy] = useState(false)
  const key = STATUS_KEYS.includes(r.status) ? r.status : 'not_found'
  const inp = r.input ?? {}
  const bm = r.best_match
  const ma = r.metadata_assessment ?? {}
  const cmp = r.comparison ?? {}
  const score = Math.max(0, Math.min(100, r.match_score ?? 0))
  const showScore = bm && r.match_score != null && r.status !== 'verification_unavailable'
  const showRows = bm || r.status === 'not_found'
  const f = (k) => t(`result.fields.${k}`)

  return (
    <motion.article className="card rs" initial="h" animate="v" variants={{ v: { transition: { staggerChildren: 0.07 } } }}>
      <motion.div className="rs-top" variants={fade}>
        <div className="rs-verdict">
          <span className="rs-glyph" aria-hidden="true">{GLYPH[key]}</span>
          <div>
            <h3 className="rs-title">{t(`status.${key}.label`)}</h3>
            <p className="rs-sub">{t(`status.${key}.text`)}</p>
          </div>
        </div>
        {showScore && (
          <div className="rs-score" aria-label={`${t('result.score')} ${Math.round(score)}`}>
            <b>{Math.round(score)}</b>
            <div className="rs-bar"><motion.i initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }} /></div>
            <small>{t('result.score')}</small>
          </div>
        )}
      </motion.div>

      {r.status === 'metadata_mismatch' && r.identity_assessment && (
        <motion.p className="note" variants={fade}>{t(`result.identity.${['same', 'different'].includes(r.identity_assessment.result) ? r.identity_assessment.result : 'uncertain'}`)}</motion.p>
      )}

      {showRows && (
        <motion.div className="rs-fields" variants={fade}>
          {!bm && <p className="rs-cap">{t('result.read')}</p>}
          <Row k={f('title')} plain={!bm} input={inp.title} cand={bm?.title} v={bm ? ma.title : 'unavailable'} pct={cmp.title_similarity} />
          <Row k={f('authors')} plain={!bm} input={inp.authors} cand={bm?.authors} v={bm ? ma.authors : 'unavailable'} pct={cmp.author_match} list />
          <Row k={f('year')} plain={!bm} input={inp.year} cand={bm?.year} v={bm ? ma.year : 'unavailable'} />
          <Row k={f('doi')} plain={!bm} input={doi(inp.doi)} cand={doi(bm?.doi)} v={bm ? ma.doi : 'unavailable'} />
        </motion.div>
      )}

      {(r.reasons?.length > 0 || bm?.source_url) && (
        <motion.div className="rs-foot" variants={fade}>
          {r.reasons?.length > 0 && <button type="button" className="rs-more" onClick={() => setShowWhy((x) => !x)}>{showWhy ? t('result.hideWhy') : t('result.showWhy', { n: r.reasons.length })}</button>}
          {bm?.source_url && <a className="link" href={bm.source_url} target="_blank" rel="noreferrer">{t('result.openAt', { s: bm.source })} ↗</a>}
        </motion.div>
      )}
      <AnimatePresence initial={false}>
        {showWhy && (
          <motion.ul key="why" className="rs-why" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
            {r.reasons.map((x, i) => <li key={i}>{x}</li>)}
          </motion.ul>
        )}
      </AnimatePresence>

    </motion.article>
  )
}

const fade = { h: { opacity: 0, y: 12 }, v: { opacity: 1, y: 0 } }
