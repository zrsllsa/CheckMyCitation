import { useEffect, useRef } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Lenis from 'lenis'
import { AnimatePresence, motion } from 'motion/react'
import { gsap, ScrollTrigger } from './lib/gsap'
import Nav from './components/Nav'
import Footer from './components/Footer'
import { scroll } from './lib/lenis'
import Home from './pages/Home'
import Login from './pages/Login'
import Reset from './pages/Reset'
import Dashboard from './pages/Dashboard'
import About from './pages/About'
import FAQ from './pages/FAQ'

export default function App() {
  const location = useLocation()
  const lenis = useRef(null)

  
  useEffect(() => {
    const l = new Lenis({ smoothWheel: false }) 
    lenis.current = l
    scroll.lenis = l
    l.on('scroll', ScrollTrigger.update)
    const tick = (t) => l.raf(t * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(tick)
      l.destroy()
      scroll.lenis = null
    }
  }, [])

  useEffect(() => {
    lenis.current?.scrollTo(0, { immediate: true })
  }, [location.pathname])

  return (
    <>
      <Nav />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<Login callback />} />
            <Route path="/auth/reset" element={<Reset />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </motion.main>
      </AnimatePresence>
      <Footer />
    </>
  )
}
