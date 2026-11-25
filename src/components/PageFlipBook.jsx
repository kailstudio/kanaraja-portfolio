/**
 * PageFlipBook.jsx — Flipsnack-style booklet viewer built from page images.
 *
 * Pages are laid out as real sheets: each sheet has a front (right-hand page)
 * and a back (left-hand page once turned), and turns around the spine with a
 * 3D rotateY. The closed cover sits centred; open spreads fill the frame.
 * On narrow screens it switches to one page at a time.
 *
 * Props:
 *   pages     — array of image URLs, in reading order (cover first)
 *   title     — label shown in the toolbar
 *   ratio     — page height / width (A4 = 1.4142)
 *   pdfUrl    — optional, adds a download button
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useTransform, animate } from 'framer-motion'

const NARROW = '(max-width: 680px)'

function useNarrow() {
  const [n, setN] = useState(() => typeof window !== 'undefined' && window.matchMedia(NARROW).matches)
  useEffect(() => {
    const mq = window.matchMedia(NARROW)
    const on = (e) => setN(e.matches)
    mq.addEventListener ? mq.addEventListener('change', on) : mq.addListener(on)
    return () => (mq.removeEventListener ? mq.removeEventListener('change', on) : mq.removeListener(on))
  }, [])
  return n
}

const Arrow = ({ dir }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {dir === 'left' ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
  </svg>
)

// A natural page turn: slow lift, quicker middle, soft landing.
const TURN_EASE = [0.55, 0.02, 0.18, 1]
const TURN_TIME = 1.05

function Sheet({ index, total, turned, front, back, onNext, onPrev, reduce, eager }) {
  const target = turned ? -180 : 0
  const rot = useMotionValue(target)
  const [moving, setMoving] = useState(false)

  useEffect(() => {
    if (rot.get() === target) return
    if (reduce) { rot.set(target); return }
    setMoving(true)
    const c = animate(rot, target, { duration: TURN_TIME, ease: TURN_EASE, onComplete: () => setMoving(false) })
    return () => c.stop()
  }, [target, reduce, rot])

  // 0 when flat, 1 when standing upright at the spine
  const lift = useTransform(rot, (r) => Math.sin((-r * Math.PI) / 180))
  const z = useTransform(lift, (l) => l * 28)
  const frontShade = useTransform(rot, [0, -90], [0, 0.42])
  const backShade = useTransform(rot, [-90, -180], [0.42, 0])
  const gloss = useTransform(rot, [0, -40, -90, -140, -180], [0, 0.28, 0, 0.22, 0])
  const shadow = useTransform(lift, (l) => `0 ${8 + 18 * l}px ${26 + 44 * l}px rgba(10, 12, 40, ${0.32 + 0.18 * l})`)

  // resting: earlier sheets on top of the right-hand pile, later sheets on top of the left
  const base = turned ? index + 1 : total * 2 - index
  const zIndex = moving ? 500 + (turned ? index : total - index) : base

  return (
    <motion.div className="fb-sheet" style={{ zIndex, rotateY: rot, z }}>
      <motion.div className="fb-face fb-face--front" style={{ boxShadow: shadow }} onClick={onNext}>
        <img src={front} alt={`Page ${2 * index + 1}`} draggable={false} loading={eager ? 'eager' : 'lazy'} />
        <span className="fb-shade fb-shade--front" />
        <motion.span className="fb-light fb-light--dark" style={{ opacity: frontShade }} />
        <motion.span className="fb-light fb-light--gloss" style={{ opacity: gloss }} />
      </motion.div>
      <motion.div className="fb-face fb-face--back" style={{ boxShadow: shadow }} onClick={onPrev}>
        {back && <img src={back} alt={`Page ${2 * index + 2}`} draggable={false} loading="lazy" />}
        <span className="fb-shade fb-shade--back" />
        <motion.span className="fb-light fb-light--dark fb-light--back" style={{ opacity: backShade }} />
        <motion.span className="fb-light fb-light--gloss fb-light--back" style={{ opacity: gloss }} />
      </motion.div>
    </motion.div>
  )
}

export default function PageFlipBook({ pages, title = 'Booklet', ratio = 1.4142, pdfUrl }) {
  const reduce = useReducedMotion()
  const narrow = useNarrow()
  const wrapRef = useRef(null)
  const n = pages.length
  const sheets = Math.ceil(n / 2)              // sheet i: front = page 2i, back = page 2i+1
  const maxTurn = n % 2 === 0 ? sheets : sheets - 1
  const [turned, setTurned] = useState(0)      // spread mode: sheets turned
  const [single, setSingle] = useState(0)      // single-page mode: page index
  const [isFull, setIsFull] = useState(false)

  // keep both modes roughly in sync when the layout switches
  useEffect(() => {
    if (narrow) setSingle(turned === 0 ? 0 : Math.min(n - 1, turned * 2 - 1))
    else setTurned(Math.min(maxTurn, Math.ceil(single / 2)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [narrow])

  const next = useCallback(() => (narrow ? setSingle((s) => Math.min(n - 1, s + 1)) : setTurned((t) => Math.min(maxTurn, t + 1))), [narrow, n, maxTurn])
  const prev = useCallback(() => (narrow ? setSingle((s) => Math.max(0, s - 1)) : setTurned((t) => Math.max(0, t - 1))), [narrow])
  const atStart = narrow ? single === 0 : turned === 0
  const atEnd = narrow ? single === n - 1 : turned === maxTurn

  const onKey = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); next() }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
  }

  useEffect(() => {
    const on = () => setIsFull(document.fullscreenElement === wrapRef.current)
    document.addEventListener('fullscreenchange', on)
    return () => document.removeEventListener('fullscreenchange', on)
  }, [])
  const toggleFull = () => {
    const el = wrapRef.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen?.()
    else el.requestFullscreen?.()
  }

  // label
  let label
  if (narrow) label = `${single + 1} / ${n}`
  else if (turned === 0) label = `1 / ${n}`
  else {
    const l = turned * 2, r = turned * 2 + 1
    label = r <= n ? `${l}–${r} / ${n}` : `${l} / ${n}`
  }

  // centre the closed cover, and a lone last page
  const shift = narrow ? 0 : turned === 0 ? -25 : (turned * 2 >= n ? 25 : 0)
  const dur = reduce ? 0 : TURN_TIME

  return (
    <div ref={wrapRef} className={`fb${isFull ? ' fb--full' : ''}`} tabIndex={0} onKeyDown={onKey}
         role="region" aria-roledescription="booklet" aria-label={title}>
      <div className="fb-bar">
        <span className="fb-title">{title}</span>
        <span className="fb-count" aria-live="polite">{label}</span>
        <div className="fb-tools">
          {pdfUrl && (
            <a className="fb-tool" href={pdfUrl} download aria-label="Download PDF" title="Download PDF">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>
            </a>
          )}
          <button className="fb-tool" onClick={toggleFull} aria-label={isFull ? 'Exit full screen' : 'Full screen'} title={isFull ? 'Exit full screen' : 'Full screen'}>
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isFull ? <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /> : <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}
            </svg>
          </button>
        </div>
      </div>

      <div className="fb-stage">
        <button className="fb-nav fb-nav--prev" onClick={prev} disabled={atStart} aria-label="Previous page"><Arrow dir="left" /></button>

        {narrow ? (
          <div className="fb-single" style={{ aspectRatio: `1 / ${ratio}` }} onClick={next}>
            <AnimatePresence initial={false} mode="popLayout">
              <motion.img key={single} src={pages[single]} alt={`Page ${single + 1}`} className="fb-single-img"
                initial={{ opacity: 0, x: reduce ? 0 : 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reduce ? 0 : -30 }}
                transition={{ duration: reduce ? 0.15 : 0.35, ease: [0.16, 1, 0.3, 1] }} draggable={false} />
            </AnimatePresence>
          </div>
        ) : (
          <div className="fb-book-wrap" style={{ aspectRatio: `2 / ${ratio}` }}>
            <motion.div className="fb-book" animate={{ x: `${shift}%` }} transition={{ duration: dur * 0.9, ease: [0.45, 0, 0.2, 1] }}>
              {Array.from({ length: sheets }, (_, i) => (
                <Sheet key={i} index={i} total={sheets} turned={i < turned}
                  front={pages[2 * i]} back={pages[2 * i + 1]}
                  onNext={next} onPrev={prev} reduce={reduce} eager={i < 2} />
              ))}
            </motion.div>
          </div>
        )}

        <button className="fb-nav fb-nav--next" onClick={next} disabled={atEnd} aria-label="Next page"><Arrow dir="right" /></button>
      </div>

      <div className="fb-thumbs" role="tablist" aria-label="Jump to page">
        {pages.map((src, i) => {
          const spreadOf = i === 0 ? 0 : Math.min(maxTurn, Math.ceil(i / 2))
          const active = narrow ? single === i : spreadOf === turned
          return (
            <button key={i} role="tab" aria-selected={active} aria-label={`Page ${i + 1}`}
              className={`fb-thumb${active ? ' is-active' : ''}`}
              onClick={() => (narrow ? setSingle(i) : setTurned(spreadOf))}>
              <img src={src} alt="" loading="lazy" draggable={false} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
