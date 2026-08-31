/**
 * Hero.jsx — full-viewport intro hero, the first thing visitors see once
 * the loading screen exits (mounted right after <SiteHeader /> in App.jsx,
 * before the portfolio split-screen).
 *
 * Always mounted (not conditionally rendered on `loaderExited`) — visibility
 * is controlled by the `visible` prop fading opacity instead. This section
 * is 170vh of real, normal-flow document height; conditionally mounting it
 * only after the loader exits meant .site-split (and everything in it,
 * including PortfolioSection's `layout`-animated rotating-word chip) took
 * its *first* layout measurement as if this section didn't exist yet, then
 * jumped ~170vh down the moment it mounted — framer-motion's `layout` prop
 * animates that jump as a visible "slides down from the top" glitch rather
 * than it happening invisibly pre-paint. Keeping this always in the DOM
 * (hidden behind the loading screen regardless) means .site-split's true
 * position is correct from the very first layout pass.
 *

 * A centre "orbit" — two concentric glass rings around a soft gradient
 * core — with mascot image chips (herointro1/2/4/5/6.webp, public/hero-intro/)
 * that fan outward as the user scrolls, revealing a headline/subtext once
 * the centre clears. Pinned via position:sticky over a tall scroll
 * scaffold (same pattern used by ScrollAnimation.jsx and .split-left
 * elsewhere in this app), with the motion itself driven by framer-motion's
 * useScroll/useTransform against that scaffold — every frame stays off the
 * React render cycle, no manual scrollY state.
 *
 * Centre badge: herointrostart.webp sits over the core orb at rest (before
 * any scrolling) and fades/scales away early in the scroll — see
 * startOpacity/startScale below — handing off to the KAIL wordmark
 * (public/logo.svg, white fill) that fades in a little later. A soft
 * drop-shadow (styles.css) keeps the logo legible against that near-white
 * gradient without a background shape.
 */

import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import LoopMedia from './LoopMedia.jsx'

const BASE = import.meta.env.BASE_URL

// Real mascot renders (replacing the old dashed-glyph placeholders).
// herointrostart sits at the centre, visible before any scrolling, AND
// doubles as one of the six fan-out chips — so it's referenced in both
// START_IMAGE (centre badge) and CHIP_IMAGES (last chip) below.
const START_IMAGE = `${BASE}hero-intro/herointrostart.webp`
// Animated version of the same centre badge — see LoopMedia.jsx for the
// webm-first/webp-fallback protocol (Kana's standard going forward for
// every animated asset). START_IMAGE above stays as its fallback.
const START_VIDEO = `${BASE}hero-intro/herointrostart.webm`
const CHIP_IMAGES = [1, 2, 4, 5, 6].map((n) => `${BASE}hero-intro/herointro${n}.webp`).concat(START_IMAGE)
const CHIP_VIDEOS = [1, 2, 4, 5, 6].map((n) => `${BASE}hero-intro/herointro${n}.webm`).concat(START_VIDEO)

const CHIP_COUNT = CHIP_IMAGES.length
const MOBILE_MQ  = '(max-width: 640px)'

// Chip size is no longer a fixed constant — see chipSize/radius below in
// the component. It's solved for from the actually-available space so
// that, by construction, chips are always spaced a fixed multiple of their
// own size apart (SPACING) — guaranteeing no overlap AND no clipping
// regardless of viewport, rather than picking a fixed px size and hoping
// there's enough room. CHIP_SIZE_MAX is just the ceiling: on a roomy
// viewport chips grow up to this size and no further.
const CHIP_SIZE_MAX_DESKTOP = 215
const CHIP_SIZE_MAX_MOBILE  = 160
const CHIP_EDGE_MARGIN      = 8    // px breathing room past the chip's own edge, at the sticky container's boundary
const CHIP_SPACING          = 1.25 // radius, as a multiple of chip size — >1 keeps adjacent chips from touching

// Evenly spaced around the circle, starting from the top (-90°).
const CHIPS = CHIP_IMAGES.map((img, i) => ({
  id: i,
  img,
  video: CHIP_VIDEOS[i],
  label: `Work ${i + 1}`,
  angle: -Math.PI / 2 + i * ((2 * Math.PI) / CHIP_COUNT),
}))

function useIsHeroMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_MQ).matches
  )
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ)
    const onChange = (e) => setIsMobile(e.matches)
    mq.addEventListener ? mq.addEventListener('change', onChange) : mq.addListener(onChange)
    return () => {
      mq.removeEventListener ? mq.removeEventListener('change', onChange) : mq.removeListener(onChange)
    }
  }, [])
  return isMobile
}

// One mascot chip. `radius` is a shared motion value (0 → max px) — each
// chip derives its own x/y from it via its fixed angle, so the whole
// fan-out is one scroll-linked value driving five cheap per-chip transforms
// rather than five independent scroll listeners. `opacity` is likewise
// shared (see chipOpacity below) — chips start fully transparent, so only
// herointrostart shows at rest, then fade in together as they expand.
//
// `size` is also dynamic now (see chipSize in Hero() below), so this bakes
// its own self-centering offset (-size/2) directly into the x/y transform
// rather than relying on a fixed CSS `top: calc(50% - halfsize)` — the CSS
// side just anchors at top:50%/left:50% and lets this handle the rest,
// since the actual pixel half-size isn't known until measured/solved here.
function HeroChip({ angle, label, img, video, size, radius, opacity }) {
  const x = useTransform(radius, (r) => r * Math.cos(angle) - size / 2)
  const y = useTransform(radius, (r) => r * Math.sin(angle) - size / 2)
  return (
    <motion.div
      className="hero-intro-chip"
      style={{ x, y, opacity, width: size, height: size }}
      aria-hidden="true"
      title={label}
    >
      <LoopMedia
        webmSrc={video}
        webpSrc={img}
        alt=""
        className="hero-intro-chip-img"
      />
    </motion.div>
  )
}

export default function Hero({ visible }) {
  const sectionRef = useRef(null)
  const stickyRef   = useRef(null)
  const isMobile    = useIsHeroMobile()

  // Progress 0→1 across the tall scaffold below — reachable and robust
  // since there's plenty of page after this section (HeroSequence engages,
  // then the portfolio grid), unlike the footer wordmark's page-end case.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })

  // Both chip SIZE and the fan-out RADIUS used to be fixed px constants,
  // unrelated to how much room was actually available. That cut two ways
  // depending on the viewport: too large and chips got pushed outside
  // .hero-intro-sticky's bounds and clipped (it's the one with
  // overflow:hidden); or — after an earlier fix capped the radius to fit
  // — chips ended up crowded close enough together to visibly overlap,
  // since capping the radius alone doesn't guarantee it's still large
  // relative to the (still-fixed) chip size.
  //
  // Solving for chip size directly from the measured space fixes both at
  // once: radius is always exactly CHIP_SPACING × chipSize (so overlap
  // between adjacent chips can't happen, by construction, at ANY size),
  // and chipSize itself is solved so that radius + half a chip + margin
  // never exceeds what .hero-intro-sticky (the actual clip boundary —
  // not .hero-intro-orbit, that decorative ring is deliberately sized
  // *tight* around the logo and too small a reference here) can hold.
  // Chips simply shrink together on a tight viewport instead of either
  // overlapping or clipping.
  const [stickySize, setStickySize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const el = stickyRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([entry]) => {
      setStickySize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const chipSizeMax = isMobile ? CHIP_SIZE_MAX_MOBILE : CHIP_SIZE_MAX_DESKTOP
  const availSize    = Math.min(stickySize.width, stickySize.height)
  // chipSize * SPACING + chipSize/2 + margin ≤ availSize/2, solved for chipSize:
  const chipSizeFit  = Math.max(0, (availSize / 2 - CHIP_EDGE_MARGIN) / (CHIP_SPACING + 0.5))
  const chipSize     = Math.min(chipSizeMax, chipSizeFit)
  const maxRadius    = chipSize * CHIP_SPACING
  const radius = useTransform(scrollYProgress, [0.08, 0.62], [0, maxRadius], { clamp: true })

  // Chips are invisible at radius:0 (rest) and fade in as they expand —
  // fully faded in by 40% of the way to full radius, well before the fan-
  // out itself finishes — so only herointrostart shows at the very start,
  // and the chips reveal themselves as part of the expansion rather than
  // popping in or (previously) relying on the start badge just happening
  // to be large enough to cover them.
  const chipOpacity = useTransform(radius, [0, maxRadius * 0.4], [0, 1], { clamp: true })

  const ringScale   = useTransform(scrollYProgress, [0, 0.3],  [0.9, 1])
  const ringOpacity = useTransform(scrollYProgress, [0, 0.18], [0, 1])
  const logoOpacity = useTransform(scrollYProgress, [0.4, 0.62], [0, 1])
  const logoY       = useTransform(scrollYProgress, [0.4, 0.62], [14, 0])
  const hintOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0])

  // herointrostart occupies the centre badge before any scrolling, then
  // fades/scales away early — well before the chips finish fanning out
  // (0.62) and before the logo starts fading in (0.4) — so there's a clean
  // handoff: start mascot visible at rest, gone by the time the logo takes
  // its spot.
  const startOpacity = useTransform(scrollYProgress, [0, 0.22], [1, 0], { clamp: true })
  const startScale    = useTransform(scrollYProgress, [0, 0.22], [1, 0.9], { clamp: true })

  return (
    <motion.section
      className="hero-intro"
      ref={sectionRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="hero-intro-sticky" ref={stickyRef}>
        <div className="hero-intro-orbit">
          <motion.div
            className="hero-intro-ring hero-intro-ring--outer"
            style={{ opacity: ringOpacity, scale: ringScale }}
            aria-hidden="true"
          />
          <motion.div
            className="hero-intro-ring hero-intro-ring--inner"
            style={{ opacity: ringOpacity, scale: ringScale }}
            aria-hidden="true"
          />

          <div className="hero-intro-core-orb" aria-hidden="true" />

          {/* Chips render (and so paint) BEFORE the start badge below, and
              are fully transparent at rest (chipOpacity, tied to radius —
              see above) — belt-and-braces with the paint order so only
              herointrostart shows at the very start. They fade in together
              as scroll actually fans them outward. */}
          {CHIPS.map((chip) => (
            <HeroChip key={chip.id} angle={chip.angle} label={chip.label} img={chip.img} video={chip.video} size={chipSize} radius={radius} opacity={chipOpacity} />
          ))}

          <motion.div
            className="hero-intro-start-badge"
            style={{ opacity: startOpacity, scale: startScale }}
            aria-hidden="true"
          >
            <LoopMedia
              webmSrc={START_VIDEO}
              webpSrc={START_IMAGE}
              alt=""
              className="hero-intro-start-img"
            />
          </motion.div>

          <motion.div className="hero-intro-logo-badge" style={{ opacity: logoOpacity, y: logoY }}>
            <div className="logo-group">
              <img
                src={`${import.meta.env.BASE_URL}logo.svg`}
                alt="Studio KAIL"
                className="hero-intro-logo-img"
                draggable={false}
              />
              <p className="logo-byline"><span>by</span><span>kana</span><span>raja</span></p>
            </div>
          </motion.div>
        </div>

        <motion.p className="hero-intro-hint" style={{ opacity: hintOpacity }} aria-hidden="true">
          Scroll to explore
        </motion.p>
      </div>
    </motion.section>
  )
}
