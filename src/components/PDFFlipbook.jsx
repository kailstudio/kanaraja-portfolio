/**
 * PDFFlipbook.jsx — Real PDF viewer with page-flip UI
 *
 * Uses PDF.js loaded from CDN (no npm install required).
 * Props:
 *   pdfUrl       — path to PDF, e.g. `${import.meta.env.BASE_URL}guidelines/pgm-guidelines.pdf`
 *   title        — label shown in the header
 *   accentColor  — hex used for active dots / buttons
 *   totalHint    — optional expected page count (shows while loading)
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174'

// "Is this a phone" — checked against the LARGER of the two viewport
// dimensions rather than plain width. A plain `max-width: 620px` match
// media query flips false the moment a phone is rotated to landscape
// (most phones land somewhere around 660–930px wide in landscape), which
// used to be a real bug here: the mobile fullscreen viewer explicitly
// prompts "Rotate your device for the best viewing experience", and the
// moment you did, isMobile went false and the safety-net effect below
// (`if (mobileFullscreen && !isMobile) setMobileFullscreen(false)`) slammed
// the fullscreen viewer shut and dumped you back into the small embedded
// view — i.e. exactly the "not full screen on mobile" complaint, and it
// fired on the one interaction the UI itself was telling you to do.
// 960px comfortably covers the widest phones in landscape (~930px on the
// largest current models) while still excluding tablets, whose shortest
// side alone already exceeds that.
const MOBILE_MAX_DIMENSION = 960

function useIsMobile() {
  const getIsMobile = () =>
    typeof window !== 'undefined' &&
    Math.max(window.innerWidth, window.innerHeight) <= MOBILE_MAX_DIMENSION

  const [isMobile, setIsMobile] = useState(getIsMobile)
  useEffect(() => {
    const onChange = () => setIsMobile(getIsMobile())
    window.addEventListener('resize', onChange)
    window.addEventListener('orientationchange', onChange)
    onChange() // re-check immediately (covers the resize/orientation race on some browsers)
    return () => {
      window.removeEventListener('resize', onChange)
      window.removeEventListener('orientationchange', onChange)
    }
  }, [])
  return isMobile
}

// Load PDF.js once and cache the promise
let pdfJsPromise = null
function getPdfJs() {
  if (pdfJsPromise) return pdfJsPromise
  pdfJsPromise = new Promise((resolve, reject) => {
    if (window['pdfjs-dist/build/pdf']) {
      const lib = window['pdfjs-dist/build/pdf']
      lib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.js`
      return resolve(lib)
    }
    const script = document.createElement('script')
    script.src = `${PDFJS_CDN}/pdf.min.js`
    script.onload = () => {
      const lib = window['pdfjs-dist/build/pdf']
      lib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.js`
      resolve(lib)
    }
    script.onerror = reject
    document.head.appendChild(script)
  })
  return pdfJsPromise
}

export function PDFFlipbook({ pdfUrl, title = 'Brand Guidelines', accentColor = '#2C365E', totalHint }) {
  const [pdf,         setPdf]         = useState(null)
  const [pageNum,     setPageNum]     = useState(1)
  const [totalPages,  setTotalPages]  = useState(totalHint ?? 0)
  const [status,      setStatus]      = useState('loading') // loading | ready | error | rendering
  const [dir,         setDir]         = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mobileFullscreen, setMobileFullscreen] = useState(false)

  const canvasRef    = useRef(null)
  const renderTask   = useRef(null)
  const containerRef = useRef(null)

  const isMobile = useIsMobile()

  // Mobile fullscreen viewer — separate canvas + container so it can be
  // sized independently of the embedded viewer (and rendered via portal).
  const mfsCanvasRef      = useRef(null)
  const mfsContainerRef   = useRef(null)
  const mfsRenderTask     = useRef(null)

  // Load PDF.js + open document
  useEffect(() => {
    setStatus('loading')
    getPdfJs()
      .then((lib) => lib.getDocument(pdfUrl).promise)
      .then((doc) => {
        setPdf(doc)
        setTotalPages(doc.numPages)
        setPageNum(1)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [pdfUrl])

  // Render a page onto the canvas
  const renderPage = useCallback(async (num, pdfDoc) => {
    if (!pdfDoc || !canvasRef.current) return
    setStatus('rendering')
    if (renderTask.current) {
      try { renderTask.current.cancel() } catch (_) {}
    }
    try {
      const page    = await pdfDoc.getPage(num)
      const canvas  = canvasRef.current
      const ctx     = canvas.getContext('2d')

      // Scale to fill the viewer width (600px max), capped at 2×
      const container = containerRef.current
      const maxW      = container ? container.clientWidth - 2 : 600
      const baseVP    = page.getViewport({ scale: 1 })
      const scale     = Math.min(2, maxW / baseVP.width)
      const vp        = page.getViewport({ scale })

      canvas.width  = vp.width
      canvas.height = vp.height
      renderTask.current = page.render({ canvasContext: ctx, viewport: vp })
      await renderTask.current.promise
      setStatus('ready')
    } catch (e) {
      if (e?.name !== 'RenderingCancelledException') setStatus('error')
    }
  }, [])

  useEffect(() => {
    if (pdf) renderPage(pageNum, pdf)
  }, [pageNum, pdf, renderPage])

  // Render a page onto the mobile fullscreen canvas — fits within both the
  // width AND height of its container (which swaps between portrait/landscape
  // shapes via CSS), so the page never overflows or gets clipped.
  const renderMobilePage = useCallback(async (num, pdfDoc) => {
    if (!pdfDoc || !mfsCanvasRef.current || !mfsContainerRef.current) return
    if (mfsRenderTask.current) {
      try { mfsRenderTask.current.cancel() } catch (_) {}
    }
    try {
      const page      = await pdfDoc.getPage(num)
      const canvas    = mfsCanvasRef.current
      const ctx       = canvas.getContext('2d')
      const container = mfsContainerRef.current
      const maxW      = Math.max(container.clientWidth - 32, 100)
      const maxH      = Math.max(container.clientHeight - 32, 100)
      const baseVP    = page.getViewport({ scale: 1 })
      const scale     = Math.min(3, maxW / baseVP.width, maxH / baseVP.height)
      const vp        = page.getViewport({ scale })

      canvas.width  = vp.width
      canvas.height = vp.height
      mfsRenderTask.current = page.render({ canvasContext: ctx, viewport: vp })
      await mfsRenderTask.current.promise
    } catch (e) {
      if (e?.name !== 'RenderingCancelledException') { /* leave last good frame on screen */ }
    }
  }, [])

  // Re-render the mobile page whenever it's open, the page changes, or the
  // device is rotated (container swaps orientation, so scale must be recomputed).
  useEffect(() => {
    if (!mobileFullscreen || !pdf) return
    renderMobilePage(pageNum, pdf)
    const onResize = () => renderMobilePage(pageNum, pdf)
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [mobileFullscreen, pageNum, pdf, renderMobilePage])

  // Lock background scroll while the mobile fullscreen viewer is open
  useEffect(() => {
    if (!mobileFullscreen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prevOverflow }
  }, [mobileFullscreen])

  // If the viewport grows past the mobile breakpoint while open, close it
  useEffect(() => {
    if (mobileFullscreen && !isMobile) setMobileFullscreen(false)
  }, [isMobile, mobileFullscreen])

  const go = useCallback((d) => {
    setPageNum((p) => {
      const next = p + d
      if (next < 1 || next > totalPages) return p
      setDir(d)
      return next
    })
  }, [totalPages])

  // Keyboard navigation (only when viewer is in view — or always, while
  // either fullscreen mode is open, since the embedded container may be
  // scrolled out of view behind an overlay)
  useEffect(() => {
    const onKey = (e) => {
      if (mobileFullscreen) {
        if (e.key === 'ArrowLeft')  go(-1)
        if (e.key === 'ArrowRight') go(1)
        if (e.key === 'Escape') setMobileFullscreen(false)
        return
      }
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const inView = rect.top < window.innerHeight && rect.bottom > 0
      if (!inView) return
      if (e.key === 'ArrowLeft')  go(-1)
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'Escape' && isFullscreen) exitFullscreen()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, isFullscreen, mobileFullscreen])

  // Fullscreen API
  const enterFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen
    if (req) req.call(el).catch(() => {})
  }, [])

  const exitFullscreen = useCallback(() => {
    const exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen
    if (exit) exit.call(document).catch(() => {})
  }, [])

  // On mobile, the native Fullscreen API is unreliable (iOS Safari doesn't
  // support it for non-video elements at all), so use a custom full-viewport
  // overlay instead. Desktop/tablet keep the original native-fullscreen behaviour.
  const toggleFullscreen = useCallback(() => {
    if (isMobile) {
      setMobileFullscreen((v) => !v)
      return
    }
    if (isFullscreen) exitFullscreen()
    else enterFullscreen()
  }, [isMobile, isFullscreen, enterFullscreen, exitFullscreen])

  useEffect(() => {
    const onChange = () => {
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement
      setIsFullscreen(!!fsEl && fsEl === containerRef.current)
    }
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [])

  // Thumbnail dots — clamped to max 17 dots
  const DOT_MAX   = 17
  const dotCount  = Math.min(totalPages, DOT_MAX)
  const dotPages  = Array.from({ length: dotCount }, (_, i) =>
    totalPages <= DOT_MAX ? i + 1 : Math.round(1 + (i / (DOT_MAX - 1)) * (totalPages - 1))
  )

  const isLoading  = status === 'loading'
  const isError    = status === 'error'
  const isRendering = status === 'rendering'

  // ── Mobile: first-page preview + download button ───────────────────────
  // Rendering a 40+ page interactive flipbook on a phone is heavy and the
  // UX is poor (small tap targets, awkward scrolling). Instead we render
  // only page 1 to a canvas as a visual preview, and give the user a
  // prominent download button to open the full PDF in their native viewer.
  if (isMobile) {
    return (
      <div className="pdff-mobile-preview">
        {/* Page 1 canvas */}
        <div className="pdff-mobile-preview-canvas-wrap" ref={containerRef}>
          {isLoading && (
            <div className="pdff-mobile-preview-loading">
              <div className="pdff-spinner" style={{ borderTopColor: accentColor }} />
              <span>Loading preview…</span>
            </div>
          )}
          {isError && (
            <div className="pdff-mobile-preview-loading">
              <span style={{ opacity: 0.5 }}>⚠ Preview unavailable</span>
            </div>
          )}
          {!isLoading && !isError && (
            <>
              <canvas ref={canvasRef} className="pdff-mobile-preview-canvas" />
              {/* Page count pill */}
              {totalPages > 0 && (
                <span className="pdff-mobile-preview-badge"
                  style={{ background: `${accentColor}22`, color: accentColor, borderColor: `${accentColor}44` }}>
                  {totalPages} pages
                </span>
              )}
            </>
          )}
        </div>

        {/* Download CTA */}
        <a
          href={pdfUrl}
          download
          className="pdff-mobile-download-btn"
          aria-label={`Download ${title} PDF`}
        >
          <span className="pdff-mobile-download-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </span>
          <span className="pdff-mobile-download-text">
            <span className="pdff-mobile-download-label">Download PDF</span>
            <span className="pdff-mobile-download-sub">{title}</span>
          </span>
        </a>
      </div>
    )
  }

  return (
    <>
    <div className={`pdff${isFullscreen ? ' pdff--fullscreen' : ''}`} ref={containerRef}>
      {/* Header */}
      <div className="pdff-header">
        {title && <span className="pdff-title">{title}</span>}
        <div className="pdff-header-right">
          <span className="pdff-count" style={{ color: accentColor }}>
            {isLoading ? '…' : `${pageNum} / ${totalPages}`}
          </span>
          <button
            className={`pdff-fullscreen-btn${isMobile ? ' pdff-fullscreen-btn--mobile' : ''}`}
            onClick={toggleFullscreen}
            aria-label={(isFullscreen || mobileFullscreen) ? 'Exit fullscreen' : 'View full screen'}
            title={(isFullscreen || mobileFullscreen) ? 'Exit fullscreen' : 'View full screen'}
          >
            {(isFullscreen || mobileFullscreen) ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M5.5 0v1.5H2.56L6 4.94 4.94 6 1.5 2.56V5.5H0V0h5.5zM10.5 0H16v5.5h-1.5V2.56L11.06 6 10 4.94l3.44-3.44H10.5V0zM6 11.06l-3.44 3.44H5.5V16H0v-5.5h1.5v2.94L4.94 10 6 11.06zM10 11.06l1.06-1.06 3.44 3.44V10.5H16V16h-5.5v-1.5h2.94L10 11.06z"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1.5 1h4V0H0v5.5h1.5V1zM14.5 1v4.5H16V0h-5.5v1.5h4zM14.5 15h-4v1.5H16V11h-1.5v4zM1.5 11H0v5h5.5v-1.5h-4V11z"/>
              </svg>
            )}
            {isMobile && !mobileFullscreen && (
              <span className="pdff-fullscreen-btn-label">View Full Screen</span>
            )}
          </button>
        </div>
      </div>

      {/* Viewer */}
      <div className="pdff-viewer">
        {isLoading && (
          <div className="pdff-state">
            <div className="pdff-spinner" style={{ borderTopColor: accentColor }} />
            <p>Loading guidelines…</p>
          </div>
        )}

        {isError && (
          <div className="pdff-state pdff-state--error">
            <span>⚠</span>
            <p>Couldn't load the PDF.<br />Check the file is in <code>public/guidelines/</code></p>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="pdff-canvas-wrap">
            {isRendering && <div className="pdff-rendering" style={{ borderTopColor: accentColor }} />}
            <canvas ref={canvasRef} className="pdff-canvas" />
          </div>
        )}

        {/* Nav arrows */}
        <button
          className="pdff-arrow pdff-arrow--prev"
          onClick={() => go(-1)}
          disabled={pageNum <= 1}
          aria-label="Previous page"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="10 12 6 8 10 4" />
          </svg>
        </button>
        <button
          className="pdff-arrow pdff-arrow--next"
          onClick={() => go(1)}
          disabled={pageNum >= totalPages}
          aria-label="Next page"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 4 10 8 6 12" />
          </svg>
        </button>
      </div>

      {/* Footer — dot strip */}
      <div className="pdff-footer">
        <button className="pdff-nav-btn" onClick={() => go(-1)} disabled={pageNum <= 1}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="10 12 6 8 10 4" /></svg>
          Prev
        </button>
        <div className="pdff-dots" role="tablist">
          {dotPages.map((p, i) => {
            const active = Math.abs(p - pageNum) <= (totalPages <= DOT_MAX ? 0 : Math.floor(totalPages / DOT_MAX / 2))
            return (
              <button
                key={i}
                role="tab"
                aria-selected={active}
                aria-label={`Page ${p}`}
                className={`pdff-dot${p === pageNum ? ' pdff-dot--active' : ''}`}
                style={p === pageNum ? { background: accentColor } : {}}
                onClick={() => { setDir(p > pageNum ? 1 : -1); setPageNum(p) }}
              />
            )
          })}
        </div>
        <button className="pdff-nav-btn" onClick={() => go(1)} disabled={pageNum >= totalPages}>
          Next
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 4 10 8 6 12" /></svg>
        </button>
      </div>
    </div>

    {/* Mobile fullscreen viewer — portaled to <body> so it truly covers the
        viewport regardless of any transformed ancestors, and rotated 90°
        via CSS so a quick physical turn of the phone yields a large
        landscape reading view. */}
    {typeof document !== 'undefined' && createPortal(
      <AnimatePresence>
        {mobileFullscreen && (
          <motion.div
            className="pdff-mfs"
            role="dialog"
            aria-modal="true"
            aria-label={`${title} full screen`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.button
              className="pdff-mfs-close"
              onClick={() => setMobileFullscreen(false)}
              aria-label="Close full screen"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.08 }}
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="2" y1="2" x2="14" y2="14" />
                <line x1="14" y1="2" x2="2" y2="14" />
              </svg>
            </motion.button>

            <div className="pdff-mfs-rotator">
              <div className="pdff-mfs-inner">
                <div className="pdff-mfs-hint">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 8a6 6 0 1 1 2.2 4.65" />
                    <polyline points="2 12 2 15 5 15" />
                  </svg>
                  <span>Rotate your device for the best viewing experience</span>
                </div>

                <div className="pdff-mfs-canvas-wrap" ref={mfsContainerRef}>
                  <canvas ref={mfsCanvasRef} className="pdff-mfs-canvas" />
                </div>

                <div className="pdff-mfs-nav">
                  <button
                    className="pdff-mfs-arrow"
                    onClick={() => go(-1)}
                    disabled={pageNum <= 1}
                    aria-label="Previous page"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="10 12 6 8 10 4" />
                    </svg>
                  </button>
                  <span className="pdff-mfs-count">{pageNum} / {totalPages}</span>
                  <button
                    className="pdff-mfs-arrow"
                    onClick={() => go(1)}
                    disabled={pageNum >= totalPages}
                    aria-label="Next page"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 4 10 8 6 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </>
  )
}
