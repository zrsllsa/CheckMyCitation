import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
// null jika env belum diisi: aplikasi tetap jalan dalam mode tamu.
export const supabase = url && key ? createClient(url, key, { auth: { flowType: 'pkce', detectSessionInUrl: false } }) : null

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(!!supabase)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  // Jalankan panggilan API dengan token segar; refresh sekali jika 401.
  const call = async (fn) => {
    const token = (await supabase.auth.getSession()).data.session?.access_token
    try {
      return await fn(token)
    } catch (e) {
      if (e.status !== 401) throw e
      const { data, error } = await supabase.auth.refreshSession()
      if (!error && data.session) return fn(data.session.access_token)
      try { sessionStorage.setItem('sessionExpired', '1') } catch {}
      await supabase.auth.signOut()
      throw e
    }
  }

  const value = {
    enabled: !!supabase,
    user: session?.user ?? null,
    loading,
    call,
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signUp: (email, password) =>
      supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/auth/callback` } }),
    google: () => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/auth/callback` } }),
    resend: (email) => supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${location.origin}/auth/callback` } }),
    resetPassword: (email) => supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/reset` }),
    updatePassword: (password) => supabase.auth.updateUser({ password }),
    exchange: (code) => supabase.auth.exchangeCodeForSession(code),
    signOut: () => supabase.auth.signOut(),
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
