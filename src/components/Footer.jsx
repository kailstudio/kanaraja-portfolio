/**
 * Footer.jsx — light-themed editorial footer
 *
 * Layout:
 *   Top bar:  "Studio KAIL" label (left)
 *   Cards:    Socials / Portfolios / Contact, as tall "design board" cards
 *             in a loose overlapping stack pinned to the footer's top-right
 *             corner, protruding up past the footer's own top edge (see
 *             FooterCardStack) — each card rotated a few degrees, hover
 *             lifts + wiggles it and gives its neighbours a small physical
 *             nudge. Each card also rises into place independently as the
 *             footer scrolls into view, on its own staggered slice of
 *             scroll progress (see useCardsReveal) rather than all at once.
 *             Stays the same protruding, overlapping stack at every
 *             breakpoint — CSS just scales the whole stack down for
 *             narrower viewports (see the scale steps in styles.css).
 *             Below 820px the hover wiggle simply doesn't apply, since
 *             taps replace hover on touch.
 *   Wordmark: KAIL logo, at the bottom (full-bleed, bottom-bled), letter by
 *             letter. Parallax-lags behind normal scroll and each letter
 *             rises into place left-to-right as you approach the bottom of
 *             the page — no timers, driven directly off scroll position.
 *
 * The four letters below are the individual pieces of public/logo.svg
 * (same 1590×460 viewBox), split out so each can be animated separately.
 *
 * Scroll maths note: progress is driven off how close the page is to its
 * absolute maximum scroll (document height minus viewport height), NOT off
 * this element's own on-screen position. Because the wordmark is the very
 * last thing on the page, there's no content below it for a position-based
 * "element's top travels from A to B" measurement to resolve against — at
 * max scroll there's simply nowhere left for its top to go, so that style of
 * range can end up partially or fully unreachable. Distance-from-bottom
 * sidesteps that entirely: progress is guaranteed to hit exactly 0 far from
 * the bottom and exactly 1 at the true bottom, regardless of page length,
 * footer height, or where in the footer this sits.
 */

import { useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

const BASE = import.meta.env.BASE_URL

// ── Wordmark scroll behaviour ────────────────────────────────────────
// Hand-rolled scroll listener (same technique as LogoSequence/HeroSequence
// elsewhere in this app) rather than framer-motion's element-offset
// useScroll.
//
// `progress` (0→1) is driven off distance-from-the-absolute-bottom-of-the-
// page, not off this element's own getBoundingClientRect(). Since the
// wordmark is the last thing on the page, a position-based range has
// nothing to resolve against once there's no more page left to scroll —
// distance-from-bottom instead guarantees progress reaches exactly 1 at
// the true max scroll and exactly 0 once you're WORDMARK_TRAVEL_PX or
// further away from it, regardless of page length or footer height.
//
// Two things happen off that same progress value:
//   1. Parallax lag — the whole wordmark trails behind normal scroll by up
//      to WORDMARK_LAG_PX, easing into its resting spot as progress → 1.
//   2. Per-letter reveal — each letter rises its own WORDMARK_RISE_PX,
//      staggered left→right, riding a narrower slice of that same progress.
const WORDMARK_TRAVEL_PX = 560   // px of scroll, ending exactly at page bottom, over which progress runs 0→1
const WORDMARK_LAG_PX    = 70    // how far the whole group trails normal scroll (scaled down with the now-smaller wordmark)
const WORDMARK_RISE_PX   = 44    // how far each letter itself still has to rise (scaled down with the now-smaller wordmark)
// STAGGER close to SPAN is what makes this read as "one letter, then the
// next" instead of "all four drifting up together". With 4 letters,
// 3×STAGGER + SPAN = 1 exactly, so K/A/I/L divide the full progress range
// into four clearly sequential (barely-overlapping) chunks with no dead
// zone — the last letter (L) still fully completes right as progress hits 1.
const WORDMARK_STAGGER   = 0.24  // progress offset between each letter's reveal start
const WORDMARK_SPAN      = 0.28  // progress width of each letter's own reveal

// Symmetric ease (slow-in, slow-out) rather than ease-OUT — ease-out front-
// loads most of the movement into the first moments a letter's threshold is
// crossed, which reads as a "pop" rather than a gradual rise.
function easeInOutCubic(p) {
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
}

function useWordmarkScroll(groupRef, letterRefs) {
  useEffect(() => {
    let rafId = null
    let scheduled = false

    const update = () => {
      scheduled = false
      const group = groupRef.current
      if (!group) return

      const doc               = document.documentElement
      const maxScroll          = Math.max(doc.scrollHeight - window.innerHeight, 1)
      const distanceFromBottom = Math.max(maxScroll - window.scrollY, 0)

      let progress = 1 - Math.min(distanceFromBottom / WORDMARK_TRAVEL_PX, 1)
      progress = Math.min(1, Math.max(0, progress))

      // No manual "bleed" offset needed any more — .footer-wordmark-wrap
      // now has a fixed height that's shorter than the letters' natural
      // full-width height (see styles.css), so the crop happens
      // structurally: the group sits top-aligned and whatever doesn't fit
      // just runs off the bottom edge. Parallax lag is the only thing
      // still driving this transform, easing to translateY(0) — the
      // group's true top-aligned rest position — as progress completes.
      group.style.transform = `translateY(${WORDMARK_LAG_PX * (1 - progress)}px)`

      // Letter-by-letter reveal, cascading left → right off the same progress.
      letterRefs.current.forEach((el, i) => {
        if (!el) return
        const start = i * WORDMARK_STAGGER
        const end   = start + WORDMARK_SPAN
        let p = (progress - start) / (end - start)
        p = Math.min(1, Math.max(0, p))
        const eased = easeInOutCubic(p)
        el.style.transform = `translateY(${WORDMARK_RISE_PX * (1 - eased)}px)`
      })
    }

    const onScrollOrResize = () => {
      if (scheduled) return
      scheduled = true
      rafId = requestAnimationFrame(update)
    }

    update() // set correct initial state on mount, before any scroll fires
    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [groupRef, letterRefs])
}

const LETTERS = [
  {
    id: 'K',
    shapes: (
      <>
        <rect x="25.83" y="40" width="180" height="380" />
        <circle cx="317.17" cy="128.67" r="88.67" />
        <path d="M406.17,420c0-110.46-80.74-200-180.33-200v200h180.33Z" />
      </>
    ),
  },
  {
    id: 'A',
    shapes: (
      <>
        <rect x="605.83" y="40" width="180" height="380" />
        <path d="M585.83,420c-99.76,0-180.63-85.07-180.63-190s80.87-190,180.63-190" />
      </>
    ),
  },
  {
    id: 'I',
    shapes: (
      <>
        <rect x="805.83" y="268" width="180" height="152" />
        <circle cx="894.5" cy="154" r="88.67" />
      </>
    ),
  },
  {
    id: 'L',
    shapes: (
      <>
        <polygon points="1185.83 242.67 1185.83 40 1005.83 40 1005.83 420 1031.55 420 1185.83 420 1365.83 420 1365.83 242.67 1185.83 242.67" />
        <circle cx="1474.17" cy="330" r="90" />
      </>
    ),
  },
]

// ── Existing verified accounts ───────────────────────────────────────
const YOUTUBE = {
  name: 'YouTube',
  href: 'https://www.youtube.com/@kail.studio',
  icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
}
const INSTAGRAM = {
  name: 'Instagram',
  href: 'https://www.instagram.com/__ka.il',
  icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
    </svg>
  ),
}
const BEHANCE = {
  name: 'Behance',
  href: 'https://www.behance.net/ka-il',
  icon: (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M4.654 3c.461 0 .887.035 1.278.14.39.07.711.216.996.391.286.176.497.426.641.747.14.32.216.711.216 1.137 0 .496-.106.922-.356 1.242-.215.32-.566.606-.997.746.606.176 1.067.496 1.348.922.281.426.461.957.461 1.563 0 .496-.105.922-.285 1.278a2.317 2.317 0 0 1-.782.887c-.32.215-.711.39-1.137.496a5.329 5.329 0 0 1-1.278.176L0 12.803V3h4.654zm-.285 3.978c.39 0 .71-.105.957-.285.246-.18.355-.497.355-.887 0-.216-.035-.426-.105-.567a.981.981 0 0 0-.32-.355 1.84 1.84 0 0 0-.461-.176 2.264 2.264 0 0 0-.567-.07H1.668v2.34h2.7zm.105 4.193c.215 0 .426-.035.567-.07.176-.035.32-.106.461-.216s.25-.215.356-.356c.07-.14.105-.32.105-.566 0-.47-.14-.82-.425-1.067-.25-.215-.641-.32-1.137-.32H1.668v2.595h2.806zm6.957.035c.286.285.711.426 1.278.426.39 0 .746-.106 1.032-.286.285-.215.46-.426.53-.641h1.74c-.286.851-.712 1.457-1.278 1.848-.566.355-1.243.567-2.06.567a4.135 4.135 0 0 1-1.527-.285 2.827 2.827 0 0 1-1.137-.796 2.884 2.884 0 0 1-.712-1.172 4.515 4.515 0 0 1-.25-1.493c0-.536.07-1.032.25-1.493.18-.46.426-.852.747-1.172.32-.32.711-.566 1.137-.746.46-.181.957-.286 1.493-.286.606 0 1.137.105 1.598.355.46.25.851.567 1.137.992.285.391.496.852.641 1.348.07.496.105.996.07 1.563h-5.15c0 .58.21 1.11.461 1.351zm2.24-3.732c-.25-.25-.641-.39-1.137-.39-.32 0-.606.07-.817.178-.215.105-.39.25-.496.39a1.813 1.813 0 0 0-.285.497c-.036.175-.07.32-.07.461h3.196c-.07-.526-.25-.886-.39-1.136zm-3.127-3.728h3.978v.957h-3.978V3.746z"/>
    </svg>
  ),
}
const DRIBBBLE = {
  name: 'Dribbble',
  href: 'https://dribbble.com/ka-il',
  icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 6.628 5.374 12 12 12 6.628 0 12-5.372 12-12 0-6.627-5.372-12-12-12zm7.92 5.666a10.1 10.1 0 0 1 2.303 5.62c-.337-.066-3.713-.753-7.11-.326-.077-.185-.146-.378-.224-.57a34.64 34.64 0 0 0-.687-1.56c3.781-1.545 5.507-3.767 5.718-4.164zM12 1.99a10.07 10.07 0 0 1 6.842 2.669c-.174.366-1.742 2.45-5.388 3.813-1.686-3.093-3.556-5.625-3.843-6.01A10.17 10.17 0 0 1 12 1.99zM7.793 3.12c.276.37 2.119 2.912 3.827 5.942C6.9 10.254 2.606 10.24 2.15 10.238A10.127 10.127 0 0 1 7.793 3.12zM1.968 12.013v-.26c.44.01 5.448.072 10.154-1.412.284.555.55 1.118.797 1.682-.127.036-.258.073-.385.114-4.868 1.572-7.454 5.868-7.672 6.246A10.067 10.067 0 0 1 1.968 12zm10.032 10.04a10.08 10.08 0 0 1-6.268-2.186c.174-.36 2.142-4.15 7.503-6.02l.063-.022c1.35 3.507 1.903 6.447 2.046 7.293a10.08 10.08 0 0 1-3.344.935zm5.214-1.756c-.098-.588-.609-3.39-1.863-6.84 3.21-.513 6.02.33 6.371.437a10.14 10.14 0 0 1-4.508 6.403z"/>
    </svg>
  ),
}

// ── New additions — placeholders until real links/marks are supplied ──
const MAIL = {
  name: 'Email',
  href: 'mailto:hello@kail.studio',
  icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4.5" width="20" height="15" rx="2.5" />
      <path d="M3 6.5 12 13l9-6.5" />
    </svg>
  ),
}
const UPWORK = {
  name: 'Upwork',
  href: 'https://www.upwork.com/freelancers/~01c78193322f89a4a7?mp_source=share',
  icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228-1.076.008-.042c.207-1.143.849-3.06 2.839-3.06 1.492 0 2.703 1.212 2.703 2.703-.001 1.489-1.212 2.702-2.704 2.702zm0-8.14c-2.539 0-4.51 1.649-5.31 4.366-1.22-1.834-2.148-4.036-2.687-5.892H7.828v7.112c-.002 1.406-1.141 2.546-2.547 2.546-1.405 0-2.543-1.14-2.543-2.546V3.492H0v7.112c0 2.914 2.37 5.303 5.281 5.303 2.913 0 5.283-2.389 5.283-5.303v-1.19c.529 1.107 1.182 2.229 1.974 3.221l-1.673 7.873h2.797l1.213-5.71c1.063.679 2.285 1.109 3.686 1.109 3 0 5.439-2.452 5.439-5.45 0-3-2.439-5.439-5.439-5.439z"/>
    </svg>
  ),
}

// ── Card groups shown in the footer ────────────────────────────────
// `image` — real artwork from public/footer/*.webp, labelled to match each
// card. Falls back to the dashed placeholder glyph (see CardBody) for any
// card without one, so a future card added without art yet doesn't break.
// `accent` — which of the site's two brand colours (see --lime/--lilac in
// styles.css) this card turns solid to when expanded/centred (see
// FooterCardExpanded); alternating lilac/lime/lilac matches the same
// "alternating accent" language the project cards use elsewhere.
//
// `video` — looping webm counterpart to `image` (see FooterCardMedia
// below), used where one exists in public/footer/*.webm; `image` then
// doubles as its poster frame and fallback.
const CARDS = [
  { id: 'socials',    title: 'Socials',    items: [YOUTUBE, INSTAGRAM], image: `${BASE}footer/footer-socials.webp`,  video: `${BASE}footer/footercard-socials.webm`,  accent: 'lilac' },
  { id: 'portfolios', title: 'Portfolios', items: [BEHANCE, DRIBBBLE],  image: `${BASE}footer/footer-portfolio.webp`, video: `${BASE}footer/footercard-portfolio.webm`, accent: 'lime' },
  { id: 'contact',    title: 'Contact',    items: [UPWORK, MAIL],       image: `${BASE}footer/footer-contact.webp`,  video: `${BASE}footer/footercard-contact.webm`,   accent: 'lilac' },
]

// How long to go with NO load progress before giving up and dropping back
// to the plain still. This is a stall detector, not a flat "must finish by
// X" deadline (see armLoadTimeout below) — all three stack cards mount and
// start downloading their video at once, at page load, competing with
// everything else on the page (hero video/images, the portfolio-type clips,
// etc.) for bandwidth. A flat from-mount deadline meant the bigger of these
// files (footercard-contact.webm, ~2.8MB vs. portfolio's ~1.2MB) was the
// one most likely to still be genuinely, healthily downloading — just
// slower, not stuck — when the timer fired, so it got locked onto its still
// frame forever even though the video was fine and would've finished a
// moment later. Resetting the timer on every `progress` tick means a slow
// download that keeps making progress is never penalised, only one that
// truly stalls.
const VIDEO_LOAD_TIMEOUT = 6000

// Only actually start downloading a card's video once it's about to be on
// screen (rootMargin gives it a head start before it's literally visible),
// rather than the moment it mounts. All three stack cards mount at page
// load, together with the hero video/images, the portfolio-type clips,
// etc. — with every card's video requesting eagerly at once, the bigger
// files were the ones most likely to still be genuinely downloading (not
// stuck, just slow due to that contention) when the small card's own
// stall-timeout fired, permanently locking it onto its still frame even
// though the file was fine. The expanded/centred view never had this
// problem, since it only ever mounts on demand, well after page load, once
// most other above-the-fold requests are long finished — gating the small
// cards' load the same way (start only once actually approaching view)
// gives them the same real-world reliability instead of racing everything
// else on the page.
function useNearViewport(ref, enabled) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    if (!enabled || inView) return
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true) // no IO support — just fall back to loading eagerly
      return
    }
    const io = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) setInView(true) },
      { rootMargin: '600px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [enabled, inView, ref])
  return inView
}

// Card art — plays `video`'s looping webm when there is one, falling back
// to the plain still `image` (used as the video's poster while it loads,
// and what actually renders instead if the video errors, if the browser
// can't play webm at all, or if its download genuinely stalls) — or the
// dashed placeholder glyph as the last resort if a card has neither.
function FooterCardMedia({ video, image }) {
  const [videoFailed, setVideoFailed] = useState(false)
  const timeoutRef = useRef(null)
  const wrapRef = useRef(null)
  const canLoadVideo = useNearViewport(wrapRef, !!video)

  const clearLoadTimeout = () => {
    if (timeoutRef.current != null) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  // (Re)arms the stall detector — called on mount and again on every
  // `progress` event, so the deadline keeps sliding forward as long as
  // bytes are still actually arriving.
  const armLoadTimeout = () => {
    clearLoadTimeout()
    timeoutRef.current = setTimeout(() => setVideoFailed(true), VIDEO_LOAD_TIMEOUT)
  }

  useEffect(() => {
    if (!video || !canLoadVideo) return
    armLoadTimeout()
    return clearLoadTimeout
  }, [video, canLoadVideo])

  return (
    <div ref={wrapRef} className="footer-card-media-wrap">
      {video && canLoadVideo && !videoFailed ? (
        <video
          className="footer-card-glyph-img"
          src={video}
          poster={image}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onProgress={armLoadTimeout}
          onCanPlay={clearLoadTimeout}
          onError={() => { clearLoadTimeout(); setVideoFailed(true) }}
        />
      ) : image ? (
        <img src={image} alt="" className="footer-card-glyph-img" draggable={false} />
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="9" cy="9.5" r="1.8" />
          <path d="M21 15.5 15.5 10 6 19" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  )
}

// ── Card stack — loose, hand-scattered pile of tall "design board" cards,
// pinned to the footer's top-right corner and protruding up past the
// footer's own top edge ────────────────────────────────────────────────
// Deliberately uneven x/y/rotate per card (not a clean 0/50/100 progression)
// so it reads as tossed down rather than mechanically arranged. All
// positioning is transform-only (translate + rotate + scale) — every card
// sits at the stack's origin (top:0; left:0) and gets placed purely by
// transform, which keeps the whole interaction on the compositor thread.
// x-offsets are ~68% of the card width apart so each card's title (top of
// the card) always clears the one in front of it.
const STACK_PLACEMENT = [
  { x: 0,   y: 31, rotate: -7 },
  { x: 163, y: -14, rotate: 6 },
  { x: 326, y: 37, rotate: -4 },
]

const STACK_HOVER_LIFT     = 24  // px the hovered card rises on hover
const STACK_HOVER_SCALE    = 1.1
const STACK_NEIGHBOR_NUDGE = 12  // px neighbouring cards shift away from the hovered one

// Spring used for the "resting" states (initial placement, neighbour nudge,
// and the graceful return once the cursor leaves) — soft, no overshoot-y
// snap. The hover wiggle itself uses its own keyframe transition, scoped
// inside `whileHover` below, so it doesn't replay on the way back out.
const STACK_SPRING = { type: 'spring', stiffness: 260, damping: 22, mass: 0.7 }

// Below this width the stack keeps its overlapping/rotated layout (CSS
// scales the whole thing down to fit — see styles.css) but drops the hover
// wiggle/lift/neighbour-nudge choreography, which doesn't mean much on touch.
const STACK_MOBILE_MQ = '(max-width: 820px)'

function useIsStackMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(STACK_MOBILE_MQ).matches
  )
  useEffect(() => {
    const mq = window.matchMedia(STACK_MOBILE_MQ)
    const onChange = (e) => setIsMobile(e.matches)
    mq.addEventListener ? mq.addEventListener('change', onChange) : mq.addListener(onChange)
    return () => {
      mq.removeEventListener ? mq.removeEventListener('change', onChange) : mq.removeListener(onChange)
    }
  }, [])
  return isMobile
}

// Shared innards (title / glyph / link row) for a card — used both by the
// small in-stack card and its blown-up mobile tap-to-expand twin below, so
// the two stay visually identical without duplicating the markup.
// Links stop propagation so tapping an actual social/mail icon just
// navigates rather than also toggling the card's own expand/close handler.
function CardBody({ title, items, image, video }) {
  return (
    <>
      <span className="footer-card-title">{title}</span>

      {/* Real artwork where available (CARDS' `image`/`video`), dashed
          glassmorphism placeholder otherwise — see FooterCardMedia. */}
      <div className="footer-card-glyph" aria-hidden="true">
        <FooterCardMedia video={video} image={image} />
      </div>

      <div className="footer-card-row">
        {items.map(({ name, href, icon }) => (
          <a
            key={name}
            href={href}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="footer-card-btn"
            aria-label={name}
            title={name}
            onClick={(e) => e.stopPropagation()}
          >
            {icon}
          </a>
        ))}
      </div>
    </>
  )
}

function FooterStackCard({ title, items, image, video, place, index, hoveredIndex, isMobile, onHoverStart, onHoverEnd, onExpand }) {
  const hasSibling  = hoveredIndex !== null && hoveredIndex !== index
  const nudge       = hasSibling ? (index < hoveredIndex ? -STACK_NEIGHBOR_NUDGE : STACK_NEIGHBOR_NUDGE) : 0

  return (
    <motion.div
      className="footer-stack-card"
      animate={{
        x: place.x + nudge,
        y: place.y,
        rotate: place.rotate,
        scale: 1,
      }}
      // Gentle wiggle on entry — tiny rotation jitter settling into a
      // slightly-nudged final tilt, as if lightly bumped by hand. Scale/
      // position use a clean spring so the "lift toward the user" still
      // feels smooth even while rotate is doing its own thing.
      whileHover={isMobile ? undefined : {
        x: place.x,
        y: place.y - STACK_HOVER_LIFT,
        scale: STACK_HOVER_SCALE,
        rotate: [place.rotate, place.rotate + 5, place.rotate - 4, place.rotate + 2, place.rotate + 1.5],
        transition: {
          x:      STACK_SPRING,
          y:      STACK_SPRING,
          scale:  STACK_SPRING,
          rotate: { duration: 0.5, times: [0, 0.2, 0.4, 0.65, 1], ease: 'easeInOut' },
        },
      }}
      transition={STACK_SPRING}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      // Click-to-expand — same enlarged, centered, dimmed-background
      // overlay on every breakpoint now (see FooterCardExpanded). Used to
      // be mobile-only (tap was the only way to see a card clearly there,
      // with no hover), but desktop gets the same "select a card" moment
      // on click too, on top of its existing hover lift/wiggle.
      onClick={() => onExpand(index)}
    >
      <CardBody title={title} items={items} image={image} video={video} />
    </motion.div>
  )
}

// Renders whichever card was clicked again, much larger and centered in
// the viewport over a dimmed backdrop, in a portal on <body> — on every
// breakpoint now (used to be mobile-only, since tap was the only way to
// see a card clearly there with no hover; desktop now gets the same
// "select a card" moment on click, on top of its existing hover). A portal
// (rather than repositioning the card in place) is necessary because
// .footer-card-stack is scaled down via CSS `transform` on mobile (see
// styles.css), and a transformed ancestor becomes the containing block for
// any `position: fixed` descendant — so a fixed-position element left
// inside it would be pinned to that shrunken stack instead of the real
// viewport. Escaping to <body> sidesteps that entirely and keeps true
// fixed/centered behaviour regardless of the stack's own transform.
function FooterCardExpanded({ card, onClose }) {
  useEffect(() => {
    if (!card) return
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [card, onClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {card && (
        <motion.div
          className="footer-card-expand-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={onClose}
        >
          <motion.div
            className={`footer-stack-card footer-stack-card--expanded footer-stack-card--expanded-${card.accent}`}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.7, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.82, y: 8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          >
            <button
              type="button"
              className="footer-card-expand-close"
              onClick={onClose}
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <CardBody title={card.title} items={card.items} image={card.image} video={card.video} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

function FooterCardStack() {
  const [hoveredIndex, setHoveredIndex]   = useState(null)
  const [expandedIndex, setExpandedIndex] = useState(null)
  const isMobile = useIsStackMobile()
  const stackRef = useRef(null)

  return (
    <div className="footer-card-stack" ref={stackRef}>
      {CARDS.map((card, i) => (
        <div
          key={card.id}
          className="footer-card-reveal"
          style={{ zIndex: hoveredIndex === i ? 20 : i + 1 }}
        >
          <FooterStackCard
            title={card.title}
            items={card.items}
            image={card.image}
            video={card.video}
            place={STACK_PLACEMENT[i]}
            index={i}
            hoveredIndex={isMobile ? null : hoveredIndex}
            isMobile={isMobile}
            onHoverStart={() => setHoveredIndex(i)}
            onHoverEnd={() => setHoveredIndex((h) => (h === i ? null : h))}
            onExpand={setExpandedIndex}
          />
        </div>
      ))}

      <FooterCardExpanded
        card={expandedIndex !== null ? CARDS[expandedIndex] : null}
        onClose={() => setExpandedIndex(null)}
      />
    </div>
  )
}

export default function Footer() {
  // groupRef: the element the parallax lag transform is written to.
  const wordmarkGroupRef = useRef(null)
  const letterRefs       = useRef([])
  useWordmarkScroll(wordmarkGroupRef, letterRefs)

  return (
    <footer className="site-footer">
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="footer-top">
        <span className="footer-label">
          Studio KAIL
          <span className="footer-label-byline">by kana raja</span>
        </span>
      </div>

      {/* ── Socials / Portfolios / Contact — loose overlapping stack,
           pinned to the footer's top-right corner ── */}
      <FooterCardStack />

      {/* ── Full-bleed logo graphic — back at the bottom of the footer.
           Parallax-lags behind normal scroll and reveals letter by letter,
           left to right, completing right as you hit the bottom of the page. ── */}
      <div className="footer-wordmark-wrap" aria-hidden="true">
        <div className="footer-wordmark-letters" ref={wordmarkGroupRef}>
          {LETTERS.map(({ id, shapes }, i) => (
            <svg
              key={id}
              ref={(el) => { letterRefs.current[i] = el }}
              viewBox="0 0 1590 460"
              className="footer-wordmark-letter"
              fill="currentColor"
            >
              {shapes}
            </svg>
          ))}
        </div>
      </div>
    </footer>
  )
}
