/**
 * ScrollAnimation.jsx
 *
 * PNG image-sequence player driven entirely by scroll position.
 *
 * ─── HOW TO ADD YOUR FRAMES ────────────────────────────────────────
 *  1. Place all PNG frames inside:   /public/frames/
 *  2. Name them sequentially:        frame_00000.png … frame_00120.png
 *     (adjust FRAME_COUNT and FRAME_PREFIX below if your naming differs)
 *  3. Run `npm run dev` — frames preload automatically on mount.
 * ────────────────────────────────────────────────────────────────────
 *
 * Scroll behaviour
 *  - Frame advances ONLY while the user scrolls (never autoplays).
 *  - Stops on whatever frame is current the moment scrolling stops.
 *  - Scroll progress is mapped across the full SCROLL_HEIGHT of the
 *    section, so the animation feels smooth and cinematic.
 *
 * Layering
 *  - The frame <img> is rendered in a FIXED container (z-index: 9999).
 *  - pointer-events: none so it never blocks clicks.
 *  - Bubbles, logo, and portfolio content all sit beneath it.
 */

import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion'

// ─── Configuration ─────────────────────────────────────────────────
const FRAME_COUNT  = 121           // total number of PNG frames (0 … 120)
const FRAME_PREFIX = `${import.meta.env.BASE_URL}frames/frame_`  // path prefix inside /public
const FRAME_PAD    = 5             // zero-padding digits  (frame_00000.png)
const SCROLL_HEIGHT = '500vh'      // how tall the scroll section is
// ───────────────────────────────────────────────────────────────────

/** Build the full path for a given frame index */
function framePath(index) {
  return `${FRAME_PREFIX}${String(index).padStart(FRAME_PAD, '0')}.png`
}

/** Preload an array of image URLs and return a promise that resolves when done */
function preloadImages(urls) {
  return Promise.all(
    urls.map(
      (src) =>
        new Promise((resolve) => {
          const img = new Image()
          img.onload  = resolve
          img.onerror = resolve   // don't block if a frame is missing
          img.src = src
        })
    )
  )
}

// Pre-build all frame paths once (avoids re-creating them on every render)
const ALL_FRAMES = Array.from({ length: FRAME_COUNT }, (_, i) => framePath(i))

export default function ScrollAnimation() {
  const sectionRef = useRef(null)
  const [frameIndex, setFrameIndex] = useState(0)
  const [loaded, setLoaded]         = useState(false)
  const [charX, setCharX]           = useState('0%')

  // ── Scroll progress tied to this section ──
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })

  // ── Drive frame index from scroll ──
  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    // Clamp to [0, 1]
    const p = Math.max(0, Math.min(1, progress))

    // Map progress → frame index (integer)
    const idx = Math.round(p * (FRAME_COUNT - 1))
    setFrameIndex(idx)

    // ── Slide character to the left during the last 20% of scroll ──
    // progress 0.80 → 0% offset   (centred)
    // progress 1.00 → -22% offset (nudged left)
    if (p >= 0.8) {
      const t = (p - 0.8) / 0.2          // 0 → 1
      setCharX(`${-22 * t}%`)
    } else {
      setCharX('0%')
    }
  })

  // ── Preload all frames on mount ──
  useEffect(() => {
    preloadImages(ALL_FRAMES).then(() => setLoaded(true))
  }, [])

  // ── Lavender background bleed at the bottom of the section ──
  // We compute this from scrollYProgress for the overlay div
  const lavenderOpacity = useTransform(scrollYProgress, [0.8, 1], [0, 1])

  return (
    <>
      {/*
       * ── FIXED frame overlay ──────────────────────────────────────
       * Sits above everything (z-index: 9999). pointer-events: none
       * so it never swallows clicks below.
       */}
      <div
        className="seq-fixed-overlay"
        style={{ transform: `translateX(${charX})` }}
        aria-hidden="true"
      >
        {loaded ? (
          <img
            key={frameIndex}                    // re-renders only on frame change
            src={ALL_FRAMES[frameIndex]}
            alt=""
            className="seq-frame"
            draggable={false}
          />
        ) : (
          /* Loading indicator — replace or remove once frames are cached */
          <div className="seq-loading" />
        )}
      </div>

      {/*
       * ── Scroll scaffold ──────────────────────────────────────────
       * This section provides the scroll distance that drives the
       * frame index above. Its sticky child keeps the background
       * pinned while the user scrolls through it.
       */}
      <section
        ref={sectionRef}
        className="seq-scroll-section"
        style={{ height: SCROLL_HEIGHT }}
      >
        <div className="seq-sticky-bg">
          {/* Lavender wash that bleeds in as the section ends */}
          <motion.div
            className="seq-lavender-overlay"
            style={{ opacity: lavenderOpacity }}
          />

          {/* Scroll hint — fades out quickly */}
          <motion.p
            className="scroll-hint"
            style={{
              opacity: useTransform(scrollYProgress, [0, 0.12], [1, 0]),
            }}
          >
            scroll to continue ↓
          </motion.p>
        </div>
      </section>
    </>
  )
}
