/**
 * HeroSequence.jsx — bubble ecosystem (scroll-driven character animation removed)
 */

import { useEffect, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

// ── Bubble data ──────────────────────────────────────────────────────
// parallax/drift are the px each bubble has travelled once the user has
// scrolled BUBBLE_PARALLAX_RANGE px — a fixed, fairly short distance
// (not "the whole document"), so the effect reads clearly within the
// first page or so of scrolling rather than smearing out across a very
// long page.
const BUBBLE_PARALLAX_RANGE = 1400

const BUBBLES = [
  // Background — large, slow
  { id:  1, size: 320, x:  9, baseY: 33, parallax:  -38, drift:   8, blur: 0, speed: 24 },
  { id:  2, size: 300, x: 77, baseY: 46, parallax:  -43, drift:  13, blur: 0, speed: 26 },
  { id:  3, size: 265, x: 88, baseY: 16, parallax:  -59, drift:  -9, blur: 1, speed: 29 },
  { id:  4, size: 240, x: 30, baseY: 74, parallax:  -51, drift:  12, blur: 0, speed: 21 },
  // Midground
  { id:  5, size: 188, x: 20, baseY: 54, parallax: -128, drift: -14, blur: 2, speed: 22 },
  { id:  6, size: 168, x: 44, baseY: 19, parallax: -146, drift:  18, blur: 2, speed: 25 },
  { id:  7, size: 200, x: 82, baseY: 62, parallax: -132, drift: -17, blur: 2, speed: 22 },
  { id:  8, size: 172, x: 66, baseY: 27, parallax: -151, drift:  21, blur: 3, speed: 25 },
  { id:  9, size: 185, x: 55, baseY: 82, parallax: -162, drift:  14, blur: 2, speed: 27 },
  // Foreground — small, fast
  { id: 10, size:  88, x: 12, baseY: 78, parallax: -270, drift:  23, blur: 5, speed: 18 },
  { id: 11, size:  72, x: 37, baseY: 46, parallax: -313, drift: -17, blur: 6, speed: 24 },
  { id: 12, size: 104, x: 50, baseY: 14, parallax: -240, drift:  12, blur: 4, speed: 20 },
  { id: 13, size:  96, x: 72, baseY: 51, parallax: -257, drift:  26, blur: 5, speed: 18 },
  { id: 14, size:  74, x: 82, baseY: 12, parallax: -321, drift: -21, blur: 7, speed: 24 },
  { id: 15, size: 110, x: 88, baseY: 38, parallax: -230, drift:  16, blur: 4, speed: 21 },
  { id: 16, size:  60, x: 62, baseY: 91, parallax: -351, drift: -23, blur: 8, speed: 26 },
]

function ParallaxBubble({ size, x, baseY, blur, speed, parallax, drift = 0, scrollY }) {
  const y  = useTransform(scrollY, [0, BUBBLE_PARALLAX_RANGE], [0, parallax], { clamp: true })
  const dx = useTransform(scrollY, [0, BUBBLE_PARALLAX_RANGE], [0, drift],    { clamp: true })
  return (
    <div style={{ position: 'absolute', left: `${x}%`, top: `${baseY}%`,
      transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
      <motion.div style={{ x: dx, y }}>
        <div className="bubble-visual" style={{
          width: size, height: size,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          animationDuration: `${speed}s`,
        }} />
      </motion.div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────
export default function HeroSequence() {
  const { scrollY } = useScroll()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Brief delay so bubbles fade in on mount
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <motion.div
      className="hero-bubbles-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 1.0, ease: 'easeOut', delay: 0.2 }}
    >
      {BUBBLES.map((b) => (
        <ParallaxBubble key={b.id} {...b} scrollY={scrollY} />
      ))}
    </motion.div>
  )
}
