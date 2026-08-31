/**
 * LogoSequence.jsx — scroll-driven logo animation pinned to top of screen
 *
 * Mirrors HeroSequence: frames only advance while scrolling, freeze when
 * the user stops. Uses its own shorter scroll range so it completes
 * (and freezes on the last frame) when the portfolio section is reached.
 *
 * Also mirrors the footer-avoidance pattern from HeroSequence: a scroll
 * listener adjusts `top` so the animation sticks just above the portfolio
 * panel and never overlaps it.
 */

import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion'

const FRAME_COUNT    = 121
const FRAME_PREFIX   = `${import.meta.env.BASE_URL}logo-frames/logo-animation_`
const MOBILE_BREAKPT = 900

// Logo animation plays over the first portion of scroll — ends roughly
// when the portfolio section becomes the primary focus.
const LOGO_SCROLL_RANGE_DESKTOP = 1400
const LOGO_SCROLL_RANGE_MOBILE  = 1200

function framePath(i) {
  return `${FRAME_PREFIX}${String(i).padStart(5, '0')}.png`
}
function preloadAll() {
  for (let i = 0; i < FRAME_COUNT; i++) {
    const img = new Image(); img.src = framePath(i)
  }
}
const ALL_FRAMES = Array.from({ length: FRAME_COUNT }, (_, i) => framePath(i))

export default function LogoSequence() {
  const [frameIndex, setFrameIndex] = useState(0)
  const [frameReady, setFrameReady] = useState(false)
  const elRef = useRef(null)

  const { scrollY } = useScroll()
  const [scrollRange, setScrollRange] = useState(LOGO_SCROLL_RANGE_DESKTOP)

  useEffect(() => {
    const update = () => {
      setScrollRange(
        window.innerWidth <= MOBILE_BREAKPT
          ? LOGO_SCROLL_RANGE_MOBILE
          : LOGO_SCROLL_RANGE_DESKTOP
      )
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Scroll-driven frame advancement — clamp: true freezes at last frame
  const animProgress = useTransform(scrollY, [0, scrollRange], [0, 1], { clamp: true })

  useMotionValueEvent(animProgress, 'change', (p) => {
    setFrameIndex(Math.round(p * (FRAME_COUNT - 1)))
  })

  // Gate visibility until frame 0 is decoded
  useEffect(() => {
    let cancelled = false
    const img = new Image()
    const markReady = () => { if (!cancelled) setFrameReady(true) }
    img.onload = () => {
      if (img.decode) img.decode().then(markReady).catch(markReady)
      else markReady()
    }
    img.onerror = markReady
    img.src = framePath(0)
    const cap = setTimeout(markReady, 2000)
    return () => { cancelled = true; clearTimeout(cap) }
  }, [])

  useEffect(() => { preloadAll() }, [])

  // Lift the logo animation so it doesn't scroll past the portfolio panel.
  // Reads the split-left panel top and adjusts our `top` to stay above it.
  useEffect(() => {
    const el = elRef.current
    const portfolio = document.querySelector('.split-left')
    if (!el || !portfolio) return

    const update = () => {
      const headerH  = parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--header-h')) || 64
      const panelTop = portfolio.getBoundingClientRect().top
      // Once the portfolio panel reaches the header, freeze logo at that point
      const newTop   = Math.max(headerH, panelTop)
      el.style.top   = `${newTop}px`
    }

    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <motion.div
      ref={elRef}
      className="logo-seq"
      initial={{ opacity: 0 }}
      animate={{ opacity: frameReady ? 1 : 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      aria-hidden="true"
    >
      <img
        src={ALL_FRAMES[frameIndex]}
        alt=""
        className="logo-seq-img"
        draggable={false}
      />
    </motion.div>
  )
}
