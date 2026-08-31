import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Lenis from 'lenis'
import Hero from './components/Hero.jsx'
import HeroSequence from './components/HeroSequence.jsx'
import PortfolioSection from './components/PortfolioSection.jsx'
import PortfolioTypes from './components/PortfolioTypes.jsx'
import ProjectDetail from './components/ProjectDetail.jsx'
import SiteHeader from './components/SiteHeader.jsx'
import LoadingScreen from './components/LoadingScreen.jsx'
import PasswordGate from './components/PasswordGate.jsx'
import Footer from './components/Footer.jsx'
import './styles.css'

const SESSION_KEY = 'kail_unlocked'

export default function App() {
  const [unlocked,     setUnlocked]     = useState(() => sessionStorage.getItem(SESSION_KEY) === '1')
  const [siteReady,    setSiteReady]    = useState(false)
  const [loaderExited, setLoaderExited] = useState(false)
  const [detailProject, setDetailProject] = useState(null) // { cat, slide }

  const handleReady      = useCallback(() => setSiteReady(true),    [])
  const handleLoaderDone = useCallback(() => setLoaderExited(true), [])

  // Fire a GA4 event every time a project detail panel is opened so you can
  // see click counts per project in Analytics → Events → project_open.
  const openProject = useCallback((cat, slide) => {
    setDetailProject({ cat, slide })
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'project_open', {
        project_name:     slide.label,
        project_category: cat.id,
        project_id:       slide.id,
      })
    }
  }, [])

  const ease = [0.16, 1, 0.3, 1]

  // ── Lenis smooth scroll (desktop / mouse only) ────────────────────
  // Mobile browsers have native momentum scrolling — Lenis intercepts
  // touch events and replaces that with JS easing, which feels sluggish
  // or erratic compared to the platform's own physics. Skip it on touch.
  useEffect(() => {
    const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches
    if (isTouch) return

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    let rafId
    function raf(time) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [])

  // ── Custom cursor ──────────────────────────────────────────────────
  // Floats toward the pointer with time-based exponential smoothing rather
  // than snapping straight to it — gives the dot a light sense of weight/
  // inertia. Using elapsed-time (not a fixed per-frame factor) keeps the
  // easing feeling identical on 60Hz and 120Hz+ displays alike, and an
  // exponential approach never overshoots or jitters — it just settles.
  const cursorRef = useRef(null)
  useEffect(() => {
    const el = cursorRef.current
    if (!el || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    // Target = real pointer position. Rendered = eased position that chases it.
    let tx = -60, ty = -60
    let cx = -60, cy = -60
    let lastTime = null
    let rafId

    // Smoothing "time constant" in ms — roughly how long the cursor takes
    // to close most of the gap to the pointer. Higher = softer/laggier,
    // lower = snappier. 100ms reads as a subtle, premium float rather than
    // a sluggish trail.
    const EASE_TAU = 100

    // Scale via CSS `scale` property + class toggle — CSS handles that easing.
    const onMove = (e) => { tx = e.clientX; ty = e.clientY }

    const tick = (now) => {
      if (lastTime === null) lastTime = now
      const dt = Math.min(now - lastTime, 100) // clamp to avoid a big jump after a tab is backgrounded
      lastTime = now

      const t = 1 - Math.exp(-dt / EASE_TAU)
      cx += (tx - cx) * t
      cy += (ty - cy) * t

      el.style.translate = `${cx - 15}px ${cy - 15}px`
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    const onOver = (e) => {
      if (e.target.closest('a, button, [role="button"], .pj-card, .pf-pill, .footer-card-btn'))
        el.classList.add('is-hover')
    }
    const onOut = (e) => {
      if (e.target.closest('a, button, [role="button"], .pj-card, .pf-pill, .footer-card-btn'))
        el.classList.remove('is-hover')
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout',  onOut)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout',  onOut)
    }
  }, [])

  return (
    <>
    <AnimatePresence>
      {!unlocked && (
        <PasswordGate key="pg" onUnlocked={() => setUnlocked(true)} />
      )}
    </AnimatePresence>

    <main className="app" style={{ visibility: unlocked ? 'visible' : 'hidden' }}>
      {/* Custom cursor */}
      <div className="custom-cursor" ref={cursorRef} aria-hidden="true" />

      {/* Aurora gradient */}
      <div className="app-bg" aria-hidden="true" />

      {/* Fixed glass header */}
      <SiteHeader onProjectOpen={openProject} />

      {/* Hero — first thing shown once the loader exits. Always mounted
          (like .site-split below) rather than conditionally rendered, so
          its 170vh of real document height is accounted for from the very
          first layout pass — mounting it late caused .site-split to jump
          down by that same amount right as the loader exited, which
          framer-motion's `layout` prop on the portfolio's rotating-word
          chip visibly animated as a "starts at the top, slides down" glitch.
          Visibility itself is just an opacity fade via the `visible` prop. */}
      <Hero visible={loaderExited} />

      {/* HeroSequence mounts only after loader fully exits */}
      {loaderExited && <HeroSequence />}

      {/* Portfolio types — stacked pinned story panels */}
      <PortfolioTypes />

      {/* Page content fades in once loader has exited */}
      <motion.div
        className="site-split"
        initial={{ opacity: 0, y: 14 }}
        animate={loaderExited ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
        transition={{ duration: 0.72, ease }}
      >
        <div className="split-left">
          <PortfolioSection onProjectOpen={openProject} />
        </div>
        <div className="split-right" aria-hidden="true" />
      </motion.div>

      {/* Footer */}
      <Footer />

      {/* Project detail panel */}
      <AnimatePresence>
        {detailProject && (
          <ProjectDetail
            key={`${detailProject.cat.id}-${detailProject.slide?.id ?? 'cat'}`}
            cat={detailProject.cat}
            slide={detailProject.slide}
            onClose={() => setDetailProject(null)}
          />
        )}
      </AnimatePresence>

      {/* Loading screen — onExitComplete triggers HeroSequence mount */}
      <AnimatePresence onExitComplete={handleLoaderDone}>
        {!siteReady && (
          <LoadingScreen key="loader" onDone={handleReady} />
        )}
      </AnimatePresence>
    </main>
    </>
  )
}
