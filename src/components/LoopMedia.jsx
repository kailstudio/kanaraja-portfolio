/**
 * LoopMedia.jsx — looping background animation with a static-image
 * fallback. This is the standard protocol for every animated asset going
 * forward (Kana's own words: "webm as default, on loop - if browser
 * doesn't support fall back to webp"): try the .webm first, autoplaying
 * muted on an infinite loop; fall back to the still .webp if —
 *   1. the browser can't play webm at all (checked once via
 *      HTMLMediaElement.canPlayType, cached — most browsers either fully
 *      support it or don't, no need to re-probe per instance),
 *   2. the <video> actually errors while loading, or
 *   3. it simply hasn't become playable within LOAD_TIMEOUT_MS — a slow
 *      connection shouldn't leave a blank gap where the animation belongs
 *      for several seconds; better to just show the static art.
 * Once a fallback triggers, it stays on the image for that mount — no
 * retrying mid-session.
 *
 * className is applied to BOTH the <video> and the <img> so existing
 * sizing/object-fit CSS (written against an <img> selector, e.g.
 * .hero-intro-start-img) keeps working unchanged regardless of which one
 * ends up rendering — video and img respond to width/height/object-fit
 * identically.
 */

import { useState, useRef, useEffect } from 'react'

const LOAD_TIMEOUT_MS = 2500

let webmSupported = null
function supportsWebm() {
  if (webmSupported != null) return webmSupported
  if (typeof document === 'undefined') return false
  const probe = document.createElement('video')
  const can = probe.canPlayType && probe.canPlayType('video/webm; codecs="vp9"')
  webmSupported = !!can && can !== ''
  return webmSupported
}

export default function LoopMedia({ webmSrc, webpSrc, className, alt = '' }) {
  const [showFallback, setShowFallback] = useState(() => !supportsWebm())
  const videoRef = useRef(null)

  useEffect(() => {
    if (showFallback) return // already decided (unsupported), nothing to watch
    const video = videoRef.current
    if (!video) return

    let settled = false
    const markReady = () => { settled = true }
    const fallBack = () => {
      if (settled) return
      settled = true
      setShowFallback(true)
    }

    video.addEventListener('loadeddata', markReady)
    video.addEventListener('error', fallBack)
    const timer = setTimeout(fallBack, LOAD_TIMEOUT_MS)

    return () => {
      video.removeEventListener('loadeddata', markReady)
      video.removeEventListener('error', fallBack)
      clearTimeout(timer)
    }
  }, [showFallback, webmSrc])

  if (showFallback) {
    return <img src={webpSrc} alt={alt} className={className} draggable={false} />
  }

  return (
    <video
      ref={videoRef}
      className={className}
      src={webmSrc}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      aria-hidden={alt === '' ? 'true' : undefined}
    >
      {/* Native fallback for the rare case a browser doesn't understand
          <video> at all (rather than just lacking webm support, which the
          JS check above already handles) — belt-and-braces. */}
      <img src={webpSrc} alt={alt} className={className} draggable={false} />
    </video>
  )
}
