import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import idA from './locales/id'
import idB from './locales/id2'
import enA from './locales/en'
import enB from './locales/en2'

const DICT = { id: { ...idA, ...idB }, en: { ...enA, ...enB } }
const COOKIE = 'cmc_lang'
// Zona waktu Indonesia dipakai sebagai petunjuk negara tanpa memanggil layanan IP pihak ketiga.
const ID_ZONES = /^Asia\/(Jakarta|Makassar|Jayapura|Pontianak)$/

const readCookie = () => document.cookie.split('; ').find((c) => c.startsWith(`${COOKIE}=`))?.split('=')[1]
const writeCookie = (l) => {
  document.cookie = `${COOKIE}=${l}; Max-Age=31536000; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
}

// Urutan: pilihan tersimpan di cookie > zona waktu Indonesia / bahasa browser "id" > Inggris.
function detect() {
  const saved = readCookie()
  if (saved === 'id' || saved === 'en') return saved
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const first = (navigator.languages?.[0] ?? navigator.language ?? '').toLowerCase()
  return ID_ZONES.test(zone) || first.startsWith('id') ? 'id' : 'en'
}

const pick = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj)

const Ctx = createContext(null)
export const useI18n = () => useContext(Ctx)

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detect)
  useEffect(() => { document.documentElement.lang = lang }, [lang])

  const setLang = (l) => { writeCookie(l); setLangState(l) } // cookie hanya ditulis saat user memilih sendiri

  const t = useCallback((key, vars) => {
    const v = pick(DICT[lang], key) ?? pick(DICT.id, key) ?? key
    return typeof v === 'string' && vars ? v.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '') : v
  }, [lang])

  return <Ctx.Provider value={{ lang, setLang, t, locale: lang === 'id' ? 'id-ID' : 'en-US' }}>{children}</Ctx.Provider>
}
