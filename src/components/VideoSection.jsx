/**
 * VideoSection.jsx — contained showreel with glassmorphism controls + progress bar
 */

import { useState, useRef, useEffect, useCallback } from 'react'

const VIDEO_SRC = `${import.meta.env.BASE_URL}showreel.mp4`

// ── SVG icons ────────────────────────────────────────────────────────
const IconPlay = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
)
const IconPause = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
)
const IconMuted = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25a6.06 6.06 0 0 1-2.25 1.18v2.06a8.07 8.07 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3ZM12 4l-2.09 2.09L12 8.18V4Zm6.5 8a4.5 4.5 0 0 0-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63Zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71Z" />
  </svg>
)
const IconUnmuted = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 9v6h4l5 5V4L7 9H3Zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02ZM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77Z" />
  </svg>
)
const IconFullscreen = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
  </svg>
)
const IconExitFullscreen = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
  </svg>
)

// ── Component ─────────────────────────────────────────────────────────
export default function VideoSection() {
  const videoRef                      = useRef(null)
  const wrapperRef                    = useRef(null)
  const progressRef                   = useRef(null)
  const [playing,    setPlaying]      = useState(true)
  const [muted,      setMuted]        = useState(true)
  const [fullscreen, setFullscreen]   = useState(false)
  const [progress,   setProgress]     = useState(0)   // 0–1
  const [dragging,   setDragging]     = useState(false)

  // Play / pause sync
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onPlay  = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    v.addEventListener('play',  onPlay)
    v.addEventListener('pause', onPause)
    return () => { v.removeEventListener('play', onPlay); v.removeEventListener('pause', onPause) }
  }, [])

  // Progress tracking
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onTime = () => {
      if (!dragging && v.duration) setProgress(v.currentTime / v.duration)
    }
    v.addEventListener('timeupdate', onTime)
    return () => v.removeEventListener('timeupdate', onTime)
  }, [dragging])

  // Fullscreen sync
  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  // ── Seek helpers ────────────────────────────────────────────────────
  const seekFromEvent = useCallback((e) => {
    const bar = progressRef.current
    const v   = videoRef.current
    if (!bar || !v || !v.duration) return
    const rect = bar.getBoundingClientRect()
    const x    = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
    const pct  = Math.min(Math.max(x / rect.width, 0), 1)
    v.currentTime = pct * v.duration
    setProgress(pct)
  }, [])

  const onBarMouseDown = (e) => {
    setDragging(true)
    seekFromEvent(e)
  }
  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => seekFromEvent(e)
    const onUp   = ()  => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend',  onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend',  onUp)
    }
  }, [dragging, seekFromEvent])

  // ── Controls ────────────────────────────────────────────────────────
  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    v.paused ? v.play() : v.pause()
  }
  const toggleMute = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }
  const toggleFullscreen = () => {
    const el = wrapperRef.current
    if (!el) return
    document.fullscreenElement
      ? document.exitFullscreen().catch(() => {})
      : el.requestFullscreen().catch(() => {})
  }

  return (
    <section className="video-section">
      <div className="video-wrapper" ref={wrapperRef}>
        <video
          ref={videoRef}
          className="video-player"
          src={VIDEO_SRC}
          autoPlay muted loop playsInline preload="metadata"
        />

        {/* Controls: buttons row */}
        <div className="video-controls">
          <button className="video-btn" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? <IconPause /> : <IconPlay />}
          </button>
          <button className="video-btn" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
            {muted ? <IconMuted /> : <IconUnmuted />}
          </button>
          <button className="video-btn" onClick={toggleFullscreen} aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
            {fullscreen ? <IconExitFullscreen /> : <IconFullscreen />}
          </button>
        </div>

        {/* Progress bar */}
        <div
          className="video-progress-wrap"
          ref={progressRef}
          onMouseDown={onBarMouseDown}
          onTouchStart={(e) => { setDragging(true); seekFromEvent(e) }}
          role="slider"
          aria-label="Video progress"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="video-progress-track">
            <div className="video-progress-fill" style={{ width: `${progress * 100}%` }} />
            <div className="video-progress-thumb" style={{ left: `${progress * 100}%` }} />
          </div>
        </div>
      </div>
    </section>
  )
}
