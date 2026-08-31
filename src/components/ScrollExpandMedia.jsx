/**
 * ScrollExpandMedia.jsx
 *
 * Adapted from Next.js / TypeScript / Tailwind → plain React / Vite / CSS.
 * Place assets in /public/ and pass their paths as props:
 *   mediaSrc  — video or image path  (e.g. /kanaraja-portfolio/showreel.mp4)
 *   bgImageSrc — background image    (e.g. /kanaraja-portfolio/scroll-hero-bg.jpg)
 *   posterSrc  — video poster image  (optional)
 *
 * The component intercepts wheel / touch scroll until the media is fully
 * expanded, then releases normal page scroll.
 */

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

export default function ScrollExpandMedia({
  mediaType   = 'video',
  mediaSrc,
  posterSrc,
  bgImageSrc,
  title       = '',
  date,
  scrollToExpand = 'Scroll to expand',
  textBlend   = false,
  children,
}) {
  const [scrollProgress,     setScrollProgress]     = useState(0)
  const [showContent,        setShowContent]        = useState(false)
  const [mediaFullyExpanded, setMediaFullyExpanded] = useState(false)
  const [touchStartY,        setTouchStartY]        = useState(0)
  const [isMobile,           setIsMobile]           = useState(false)
  const [vpW,                setVpW]                = useState(390)
  const [vpH,                setVpH]                = useState(800)
  const sectionRef = useRef(null)
  const videoRef   = useRef(null)

  // ── Viewport + mobile detection ──────────────────────────────────────
  useEffect(() => {
    const update = () => {
      setIsMobile(window.innerWidth < 768)
      setVpW(window.innerWidth)
      setVpH(window.innerHeight)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // ── Reset on mediaType change ────────────────────────────────────────
  useEffect(() => {
    setScrollProgress(0)
    setShowContent(false)
    setMediaFullyExpanded(false)
  }, [mediaType])


  // ── Scroll interception ─────────────────────────────────────────────
  useEffect(() => {
    const handleWheel = (e) => {
      // If already expanded and user scrolls back up at top: collapse
      if (mediaFullyExpanded && e.deltaY < 0 && window.scrollY <= 5) {
        setMediaFullyExpanded(false)
        e.preventDefault()
        return
      }
      if (!mediaFullyExpanded) {
        e.preventDefault()
        const delta    = e.deltaY * 0.0009
        const next     = Math.min(Math.max(scrollProgress + delta, 0), 1)
        setScrollProgress(next)
        if (next >= 1) { setMediaFullyExpanded(true); setShowContent(true) }
        else if (next < 0.75) { setShowContent(false) }
      }
    }

    const handleTouchStart = (e) => { setTouchStartY(e.touches[0].clientY) }

    const handleTouchMove = (e) => {
      if (!touchStartY) return
      const touchY = e.touches[0].clientY
      const deltaY = touchStartY - touchY
      if (mediaFullyExpanded && deltaY < -20 && window.scrollY <= 5) {
        setMediaFullyExpanded(false)
        e.preventDefault()
        return
      }
      if (!mediaFullyExpanded) {
        e.preventDefault()
        const factor = deltaY < 0 ? 0.008 : 0.005
        const next   = Math.min(Math.max(scrollProgress + deltaY * factor, 0), 1)
        setScrollProgress(next)
        if (next >= 1) { setMediaFullyExpanded(true); setShowContent(true) }
        else if (next < 0.75) { setShowContent(false) }
        setTouchStartY(touchY)
      }
    }

    const handleTouchEnd = () => setTouchStartY(0)

    // Keep page locked at 0 while media is expanding
    const handleScroll = () => { if (!mediaFullyExpanded) window.scrollTo(0, 0) }

    window.addEventListener('wheel',      handleWheel,      { passive: false })
    window.addEventListener('scroll',     handleScroll)
    window.addEventListener('touchstart', handleTouchStart, { passive: false })
    window.addEventListener('touchmove',  handleTouchMove,  { passive: false })
    window.addEventListener('touchend',   handleTouchEnd)

    return () => {
      window.removeEventListener('wheel',      handleWheel)
      window.removeEventListener('scroll',     handleScroll)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove',  handleTouchMove)
      window.removeEventListener('touchend',   handleTouchEnd)
    }
  }, [scrollProgress, mediaFullyExpanded, touchStartY])

  // ── Computed values ─────────────────────────────────────────────────
  // Mobile starts 50% smaller; expands to fill the full viewport
  const startW = isMobile ? 200 : 400
  const startH = isMobile ? 120 : 240
  const mediaW = startW + scrollProgress * (isMobile ? (vpW + 40 - startW) : 1150)
  const mediaH = startH + scrollProgress * (isMobile ? (vpH + 40 - startH) : 560)
  // Border-radius: 999px pill → 0 at full expansion
  const mediaBorderRadius = Math.round(999 * (1 - scrollProgress))
  const textTranslateX  = scrollProgress * (isMobile ? 180 : 150)
  const veilOpacity     = Math.max(0, 0.5 - scrollProgress * 0.3)

  // Title split: first word left, rest right
  const words     = title.trim().split(' ')
  const leftWord  = words[0] || ''
  const rightWord = words.slice(1).join(' ')

  return (
    <div ref={sectionRef} className="sem-root">
      <section className="sem-section">
        {/* No background — aurora gradient + bubbles show through from fixed layers */}

        {/* ── Main layout ── */}
        <div className="sem-container">
          {/* Stage: expanding media + flying title */}
          <div className="sem-stage">

            {/* Expanding media box — starts pill-shaped, opens to full screen */}
            <div
              className="sem-media-wrap"
              style={{
                width: `${mediaW}px`,
                height: `${mediaH}px`,
                borderRadius: `${mediaBorderRadius}px`,
              }}
            >
              {mediaType === 'video' ? (
                mediaSrc && mediaSrc.includes('youtube.com') ? (
                  /* ── YouTube embed ── */
                  <div className="sem-media-inner sem-no-pointer">
                    <iframe
                      width="100%" height="100%"
                      src={
                        mediaSrc.includes('embed')
                          ? `${mediaSrc}${mediaSrc.includes('?') ? '&' : '?'}autoplay=1&mute=1&loop=1&controls=0`
                          : `${mediaSrc.replace('watch?v=', 'embed/')}?autoplay=1&mute=1&loop=1&controls=0&playlist=${mediaSrc.split('v=')[1]}`
                      }
                      className="sem-media-frame"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={title}
                    />
                    <div className="sem-media-veil" style={{ opacity: veilOpacity }} />
                  </div>
                ) : (
                  /* ── MP4 / local video ── */
                  <div className="sem-media-inner sem-no-pointer">
                    <video
                      ref={videoRef}
                      src={mediaSrc}
                      poster={posterSrc}
                      autoPlay muted playsInline preload="auto"
                      className="sem-media-video"
                      onEnded={(e) => {
                        // Seek to last frame and stay there
                        const v = e.currentTarget
                        v.currentTime = v.duration - 0.001
                        v.pause()
                      }}
                    />
                    <div className="sem-media-veil" style={{ opacity: veilOpacity }} />
                  </div>
                )
              ) : (
                /* ── Image ── */
                <div className="sem-media-inner">
                  <img src={mediaSrc} alt={title || 'Media'} className="sem-media-img" />
                  <div className="sem-media-veil" style={{ opacity: veilOpacity }} />
                </div>
              )}

              {/* Date + hint row below media */}
              <div className="sem-labels">
                {date && (
                  <p
                    className="sem-date"
                    style={{ transform: `translateX(-${textTranslateX}vw)` }}
                  >
                    {date}
                  </p>
                )}
                {scrollToExpand && !mediaFullyExpanded && (
                  <p
                    className="sem-hint"
                    style={{ transform: `translateX(${textTranslateX}vw)` }}
                  >
                    {scrollToExpand}
                  </p>
                )}
              </div>
            </div>

            {/* Flying title words */}
            {title && (
              <div className={`sem-title-row${textBlend ? ' sem-blend-diff' : ''}`}>
                <h2
                  className="sem-title"
                  style={{ transform: `translateX(-${textTranslateX}vw)` }}
                >
                  {leftWord}
                </h2>
                {rightWord && (
                  <h2
                    className="sem-title"
                    style={{ transform: `translateX(${textTranslateX}vw)` }}
                  >
                    {rightWord}
                  </h2>
                )}
              </div>
            )}
          </div>

          {/* Content revealed after full expansion */}
          {children && (
            <motion.div
              className="sem-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: showContent ? 1 : 0 }}
              transition={{ duration: 0.7 }}
            >
              {children}
            </motion.div>
          )}
        </div>
      </section>
    </div>
  )
}
