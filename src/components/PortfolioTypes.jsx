/**
 * PortfolioTypes.jsx — "fanned deck" story section: an intro cover card
 * (INTRO_PANEL below) plus one card per portfolio discipline (Brand /
 * Motion / Packaging / Web — reusing the real CATEGORIES data from
 * PortfolioSection.jsx, so the copy here is the same source of truth as
 * the carousel further down, not invented placeholder text). Sits
 * directly below Hero, above the portfolio links section.
 *
 * Each card is a tall photo card — the discipline's picture fills the top
 * of the card uncropped by any overlay, with a separate glass panel
 * (eyebrow/heading/tagline) sitting below it, not on top of it, so the
 * full picture is always visible.
 *
 * Effect: the intro card is the only thing resting in view the moment
 * this section is reached — pulled left of centre (FAN_START_X in
 * PortfolioTypeCard) rather than dead-centre, so the fan has visible room
 * to spread into as the rest of the deck arrives. As the user scrolls,
 * each following card slides in from off-screen right and settles into a
 * loose fanned stack (cascading slightly down-and-right, alternating
 * tilt) in front of the ones already there — repeats card by card until
 * all PANELS.length cards have arrived, at which point continued
 * scrolling carries past this section into whatever comes next.
 *
 * Mechanics:
 *   One scroll range for the whole deck — useScroll targets the outer
 *   .ptypes-section (height = PANELS.length × 100vh) with the same
 *   ['start start','end end'] pattern Hero.jsx uses, giving one 0→1
 *   `deckProgress`. That's sliced into (PANELS.length − 1) equal CYCLEs,
 *   one per card-to-card transition. Each CYCLE is itself split into a
 *   dwell portion (DWELL_FRACTION, the front card just sits there, fully
 *   settled) followed by a slide portion (the next card actually moves in)
 *   — so cards don't hand off back-to-back the instant one arrives; every
 *   card gets a real pause in the middle first. Card i (i ≥ 1) slides in
 *   during the tail end of card (i-1)'s cycle
 *   [(i-1)*CYCLE + DWELL_FRACTION*CYCLE, i*CYCLE] — 0 at that window's
 *   start (fully off-screen right, holding there through the preceding
 *   dwell) to 1 at its end (settled in its resting fan position), clamped
 *   so it simply holds at whichever end it's closest to outside that
 *   window. Card 0 (the intro) has no window of its own — it's mapped to
 *   a constant `entryP` of 1 the whole time, i.e. always "already
 *   arrived"; ITS dwell-then-cede-the-spotlight timing instead comes from
 *   its own dimP window (see below), same as every other card.
 *   Each card's rendered offset = its fixed "resting" fan position (small
 *   x/y/rotate, growing with index so later cards cascade further) PLUS
 *   its own entrance motion — the two are combined into a single
 *   transform per card rather than fought over by two separate ones (same
 *   reasoning as everywhere else transform ownership matters in this
 *   codebase: one owner per property, no CSS/JS fighting). z-index climbs
 *   with index so later arrivals land in front of earlier ones, matching
 *   the visual order they slide in.
 *
 * Mobile (≤900px, matching the site's main layout breakpoint): identical
 * mechanic — `isMobile` only tightens the resting fan offsets for a
 * narrow viewport. Stage sizing itself is handled by CSS.
 */

import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, useMotionValue, animate } from 'framer-motion'
import { CATEGORIES } from './PortfolioSection.jsx'
import PTypesBanner from './PTypesBanner.jsx'

const BASE = import.meta.env.BASE_URL

const MOBILE_MQ   = '(max-width: 900px)'
const ENTRY_X     = 1400  // px off-screen to the right an arriving card starts from
const ENTRY_ROTATE = 14   // extra deg an arriving card sheds on its way in

// ── Hover lift/wiggle/enlarge (desktop only — see isMobile checks below) ──
// Same interaction language as the footer's card stack (STACK_HOVER_LIFT/
// STACK_HOVER_SCALE/STACK_SPRING in Footer.jsx), scaled down a bit since
// these are much larger, frame-filling photo cards rather than small
// "design board" cards with room to visibly lift clear of their neighbours.
const CARD_HOVER_LIFT   = 14   // px the hovered card rises on hover
const CARD_HOVER_SCALE  = 1.035
const CARD_HOVER_SPRING = { type: 'spring', stiffness: 260, damping: 22, mass: 0.7 }

// Real card art, keyed by panel id — public/portfolio-types/*.webp. Falls
// back to IMAGE_ICON (below) for any panel without an entry here, so a
// future discipline card added without art yet doesn't break.
const PANEL_IMAGES = {
  intro:     `${BASE}portfolio-types/portfoliotype-intro.webp`,
  brand:     `${BASE}portfolio-types/portfoliotype-branding.webp`,
  motion:    `${BASE}portfolio-types/portfoliotype-motion.webp`,
  packaging: `${BASE}portfolio-types/portfoliotype-packaging.webp`,
  web:       `${BASE}portfolio-types/portfoliotype-web.webp`,
  outro:     `${BASE}portfolio-types/portfoliotype-final.webp`,
}

// Animated counterpart to PANEL_IMAGES, keyed the same way — public/
// portfolio-types/*.webm. Any panel without an entry here just always
// shows its still PANEL_IMAGES picture instead. See CardMedia below for
// how the still is also what these videos fall back to (poster while
// loading, and the actual rendered element if the video errors or is
// taking too long).
const PANEL_VIDEOS = {
  intro:     `${BASE}portfolio-types/portfoliotypes-intro.webm`,
  brand:     `${BASE}portfolio-types/portfoliotypes-branding.webm`,
  motion:    `${BASE}portfolio-types/portfoliotypes-motion.webm`,
  packaging: `${BASE}portfolio-types/portfoliotypes-packaging.webm`,
  web:       `${BASE}portfolio-types/portfoliotypes-web.webm`,
  outro:     `${BASE}portfolio-types/portfoliotypes-final.webm`,
}

// Cover card ahead of the four discipline cards — same shape as a
// CATEGORIES entry (so PortfolioTypeCard doesn't need special-casing).
// Colours reuse the site's own blue/lilac aurora tones as a neutral
// lead-in rather than borrowing any one discipline's accent.
// `body` is the intro paragraph formerly shown in a .pf-body-glass panel
// at the top of the portfolio links section (PortfolioSection.jsx) — moved
// here so it reads as part of the studio's opening pitch, alongside the
// rest of the deck's story-telling, rather than repeated further down.
const INTRO_PANEL = {
  id: 'intro',
  eyebrow: 'Portfolio',
  name: 'We specialise in 4 distinct areas of design.',
  tagline: 'A closer look at how Studio KAIL works, discipline by discipline.',
  body: 'We design strategic brand foundations across identity, websites, animation, print, and packaging: building cohesive systems that work seamlessly across digital and physical spaces.',
  accent: '#C4B8F0',
  accentDark: '#3d5cff',
}

// Closing card after the four discipline cards — a CTA rather than another
// discipline photo, capping the deck by pointing at the real project list
// further down the page (PortfolioSection.jsx, id="work"). `cta: true`
// flags it for PortfolioTypeCard's special-cased render (the button below
// the usual photo/video). Has real art now (PANEL_IMAGES.outro/
// PANEL_VIDEOS.outro — see CardMedia), same full-bleed treatment as every
// other card. accent/accentDark use the site's actual brand lime (#e0f87d
// — the same paler "KAIL lime" the PTypesBanner ribbon uses, see
// styles.css), not the more saturated --lime UI-accent token elsewhere on
// the site — accentDark is a darker shade of that same hue so the card's
// thin brand-coloured edge (borderTint below) matches its lime fill.
const OUTRO_PANEL = {
  id: 'outro',
  cta: true,
  eyebrow: 'Explore',
  name: 'See Our Work',
  tagline: 'Every discipline above, in practice. Browse the individual projects.',
  accent: '#e0f87d',
  accentDark: '#9aab52',
}

// Scrolls to the real project list (PortfolioSection.jsx, id="work") —
// same plain scrollIntoView pattern used site-wide for this kind of jump,
// no custom transition.
function scrollToPortfolioLinks() {
  document.getElementById('work')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Combined, normalised list PortfolioTypeCard actually renders — the
// intro card, every real category (each given an `eyebrow` label derived
// from its id), then the outro CTA card.
const PANELS = [
  INTRO_PANEL,
  ...CATEGORIES.map((cat) => ({
    ...cat,
    eyebrow: cat.id.charAt(0).toUpperCase() + cat.id.slice(1),
  })),
  OUTRO_PANEL,
]

// Exported so other sections (HeroSequence's "start when the last card
// arrives" scroll math) can derive the deck's exit-window fractions
// without hardcoding the panel count separately.
export const PANEL_COUNT = PANELS.length

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// Generic "image" placeholder glyph — same one used for the footer's
// placeholder cards and the hero orbit's chips, so "artwork coming later"
// reads as one consistent language across the whole site.
const IMAGE_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="9" cy="9.5" r="1.8" />
    <path d="M21 15.5 15.5 10 6 19" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// If a video hasn't fired 'canplay' within this long, treat it as "taking
// too long to load" and drop back to the plain still — a slow/stalled
// video (bad connection, etc.) would otherwise just sit frozen on its
// poster frame indefinitely instead of ever settling on a working image.
const VIDEO_LOAD_TIMEOUT = 4000

// Card art — full-bleed cover fill. Plays the looping webm when available,
// falls back to the still (poster while loading, or on error/timeout), or
// the IMAGE_ICON glyph as a last resort.
function CardMedia({ video, image }) {
  const [videoFailed, setVideoFailed] = useState(false)
  const timeoutRef = useRef(null)

  useEffect(() => {
    if (!video) return
    timeoutRef.current = setTimeout(() => setVideoFailed(true), VIDEO_LOAD_TIMEOUT)
    return () => clearTimeout(timeoutRef.current)
  }, [video])

  const clearLoadTimeout = () => {
    if (timeoutRef.current != null) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  if (video && !videoFailed) {
    return (
      <video
        className="ptypes-image-slot-img"
        src={video}
        poster={image}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onCanPlay={clearLoadTimeout}
        onError={() => { clearLoadTimeout(); setVideoFailed(true) }}
      />
    )
  }

  if (image) {
    return <img src={image} alt="" className="ptypes-image-slot-img" draggable={false} />
  }

  return <span className="ptypes-image-slot-icon">{IMAGE_ICON}</span>
}

function useIsPTypesMobile() {
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

function PortfolioTypeCard({ cat, index, total, deckProgress, isMobile }) {
  const isFirst = index === 0

  // Resting fan position once a card has fully arrived — cascades toward
  // the bottom-right as index grows (the direction cards arrive FROM),
  // with a gentle alternating tilt so it reads as hand-fanned rather than
  // a rigid grid. The intro card starts the fan pulled left of centre
  // (FAN_START_X) rather than sitting dead-centre, so there's visibly more
  // room for the rest of the deck to spread out across as it arrives,
  // instead of bunching toward one side. Tighter on mobile so it doesn't
  // push cards past a narrow viewport's edges.
  const FAN_START_X = isMobile ? -26 : -70
  const FAN_STEP_X  = isMobile ? 16 : 34
  const stackX      = FAN_START_X + index * FAN_STEP_X
  const stackY      = index * (isMobile ? 9 : 16)
  const stackRotate = (index % 2 === 0 ? -1 : 1) * (isMobile ? 1 + index * 0.5 : 1.5 + index * 0.8)

  // Each card-to-card transition owns one equal CYCLE of the overall deck
  // scroll ([i/(N-1), (i+1)/(N-1)]). That used to be spent entirely on the
  // slide — the moment one card finished arriving, the next was already
  // due to start, so nothing ever got to just sit there. Now each cycle
  // is split: the front card dwells, fully settled, for the first
  // DWELL_FRACTION of it, THEN the next card slides in during the
  // remainder — so every card (including the intro one, at the very start
  // of the whole scroll) gets a real pause in the middle before ceding
  // the spotlight, rather than transitions running back-to-back.
  const CYCLE = 1 / (total - 1)
  const DWELL_FRACTION = 0.45

  // The intro card is already "arrived" the instant this section is
  // reached — entryP is pinned to a constant 1 for it (output range
  // [1, 1], so whatever deckProgress is doesn't matter). Every other
  // card's own entrance is the SLIDE portion of the PREVIOUS cycle
  // ((index-1)'s cycle) — i.e. it stays put until that cycle's dwell
  // portion has passed, then runs 0→1 for the rest of it, clamped so it
  // simply holds at 0 before that and 1 after — no special-casing needed
  // for "not yet due" vs "already settled".
  const prevCycleStart = (index - 1) * CYCLE
  const segStart = isFirst ? 0 : prevCycleStart + DWELL_FRACTION * CYCLE
  const segEnd   = isFirst ? 1 : prevCycleStart + CYCLE
  const entryP   = useTransform(deckProgress, [segStart, segEnd], isFirst ? [1, 1] : [0, 1], { clamp: true })

  const x          = useTransform(entryP, (v) => stackX + (1 - v) * ENTRY_X)
  const baseRotate = useTransform(entryP, (v) => stackRotate + (1 - v) * (index % 2 === 0 ? ENTRY_ROTATE : -ENTRY_ROTATE))
  const baseScale  = useTransform(entryP, [0, 1], [0.94, 1])

  // Own fade-in as this card arrives (0 while off-screen, 1 once settled).
  const enterOpacity = useTransform(entryP, [0, 0.4, 1], [0, 1, 1])

  // Once the NEXT card starts sliding in (i.e. once THIS card's own cycle
  // has dwelled and reached its slide portion), this one dims to a low
  // opacity instead of staying fully opaque underneath it — with several
  // cards fanned out and overlapping, every earlier card sitting at full
  // opacity made the frontmost one hard to read against all that stacked
  // text/photo behind it. Dimming tracks the next card's own entry window
  // exactly (the slide portion of THIS card's cycle), so the old card
  // fades down in sync with the new one fading/sliding in — staying fully
  // visible through its own dwell period first — and (clamp:true) holds
  // it at 0.2 once that's done rather than only dimming momentarily. The
  // very last card has no "next" card to cede the spotlight to, so it
  // never dims.
  const isLast = index === total - 1
  const ownCycleStart = index * CYCLE
  const dimP = useTransform(
    deckProgress,
    [ownCycleStart + DWELL_FRACTION * CYCLE, ownCycleStart + CYCLE],
    isLast ? [1, 1] : [1, 0.2],
    { clamp: true }
  )

  const opacity = useTransform([enterOpacity, dimP], ([enter, dim]) => enter * dim)

  // Thin brand-coloured edge, mixed from this category's own accentDark
  // (same colours the carousel further down uses) — the only per-card
  // tint now, since the photo (not a flat wash) is the card's main visual.
  const borderTint = { borderColor: hexToRgba(cat.accentDark, 0.28) }

  // Hover lift/wiggle/enlarge, layered on top of the scroll-driven base
  // values above rather than fighting them. x/rotate/scale/y all already
  // have to be single MotionValues feeding `style` below (same "one owner
  // per property" rule the rest of this file follows) — framer-motion's
  // whileHover can't safely target a property that's already being driven
  // by an externally-created MotionValue like baseRotate/baseScale above,
  // so instead of a second, competing animation system, these are three
  // more plain motion values, animated imperatively via animate() on
  // hover, then combined with the scroll-driven ones via useTransform —
  // still just one final owner per property, it just now has two inputs.
  const hoverLift   = useMotionValue(0)  // px, eases toward -CARD_HOVER_LIFT on hover
  const hoverScale  = useMotionValue(1)  // extra multiplier on top of baseScale
  const hoverWiggle = useMotionValue(0)  // deg, added on top of baseRotate

  const y      = useTransform(hoverLift, (lift) => stackY + lift)
  const rotate = useTransform([baseRotate, hoverWiggle], ([r, w]) => r + w)
  const scale  = useTransform([baseScale, hoverScale], ([s, h]) => s * h)

  const handleHoverStart = () => {
    if (isMobile) return
    animate(hoverLift, -CARD_HOVER_LIFT, CARD_HOVER_SPRING)
    animate(hoverScale, CARD_HOVER_SCALE, CARD_HOVER_SPRING)
    // Same "settle into a slightly-nudged tilt" wiggle the footer stack
    // uses (see STACK_HOVER_LIFT's whileHover in Footer.jsx) — a few
    // keyframes back toward 0 rather than holding a tilt, so it reads as
    // a physical jostle rather than the card just staying crooked.
    animate(hoverWiggle, [0, 3, -2.4, 1.4, 0], {
      duration: 0.5, times: [0, 0.2, 0.4, 0.65, 1], ease: 'easeInOut',
    })
  }
  const handleHoverEnd = () => {
    if (isMobile) return
    animate(hoverLift, 0, CARD_HOVER_SPRING)
    animate(hoverScale, 1, CARD_HOVER_SPRING)
    animate(hoverWiggle, 0, CARD_HOVER_SPRING)
  }

  return (
    <motion.div
      className={`ptypes-card${cat.cta ? ' ptypes-card--outro' : ''}`}
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      style={{
        ...borderTint,
        zIndex: index + 1,
        x,
        y,
        rotate,
        opacity,
        scale,
      }}
    >
      {/* Full-bleed image/video — fills the entire card above the label strip */}
      <div className="ptypes-image-slot" aria-hidden="true">
        <CardMedia video={PANEL_VIDEOS[cat.id]} image={PANEL_IMAGES[cat.id]} />
      </div>

      {/* Glass label strip pinned to the bottom of the card */}
      <div className="ptypes-card-label">
        <span className="ptypes-card-label-eyebrow">
          {String(index + 1).padStart(2, '0')} · {cat.eyebrow}
          {cat.comingSoon && <span className="pf-coming-soon-label" style={{ marginLeft: 8 }}>Coming soon</span>}
        </span>
        <h2 className="ptypes-card-label-name">{cat.name}</h2>
        {cat.cta && (
          <button
            type="button"
            className="ptypes-cta-btn"
            onClick={scrollToPortfolioLinks}
          >
            View projects
            <span className="ptypes-cta-btn-arrow" aria-hidden="true">↓</span>
          </button>
        )}
      </div>
    </motion.div>
  )
}

export default function PortfolioTypes() {
  const isMobile   = useIsPTypesMobile()
  const sectionRef = useRef(null)

  const { scrollYProgress: deckProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })

  // On mobile, momentum scrolling burns through 100vh-per-card too fast
  // for any card to be readable. Bumping to 160vh per panel gives the dwell
  // window ~44% more scroll distance, so fast swipes still settle on each
  // card long enough to read it before the next arrives.
  const panelVh = isMobile ? 160 : 100

  return (
    <section
      className="ptypes-section"
      ref={sectionRef}
      style={{ height: `${PANELS.length * panelVh}vh` }}
      aria-label="Portfolio disciplines"
    >
      <div className="ptypes-sticky">
        <PTypesBanner />
        <div className="ptypes-stage">
          {PANELS.map((cat, i) => (
            <PortfolioTypeCard
              key={cat.id}
              cat={cat}
              index={i}
              total={PANELS.length}
              deckProgress={deckProgress}
              isMobile={isMobile}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
