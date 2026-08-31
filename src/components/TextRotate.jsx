/**
 * TextRotate.jsx
 * Adapted from the shadcn/motion TextRotate component.
 * Converted from TypeScript to JSX; Tailwind classes replaced with
 * className props (styled in styles.css) and minimal inline styles.
 * Uses framer-motion (already installed in this project).
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// ── Helpers ──────────────────────────────────────────────────────────
function splitIntoCharacters(text) {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const seg = new Intl.Segmenter('en', { granularity: 'grapheme' })
    return Array.from(seg.segment(text), ({ segment }) => segment)
  }
  return Array.from(text)
}

// ── Component ─────────────────────────────────────────────────────────
const TextRotate = forwardRef(function TextRotate(
  {
    texts,
    transition       = { type: 'spring', damping: 25, stiffness: 300 },
    initial          = { y: '100%', opacity: 0 },
    animate          = { y: 0, opacity: 1 },
    exit             = { y: '-120%', opacity: 0 },
    animatePresenceMode    = 'wait',
    animatePresenceInitial = false,
    rotationInterval  = 2000,
    staggerDuration   = 0,
    staggerFrom       = 'first',
    loop = true,
    auto = true,
    splitBy = 'characters',
    onNext,
    mainClassName,
    mainStyle,
    splitLevelClassName,
    splitLevelStyle,
    elementLevelClassName,
    elementLevelStyle,
  },
  ref
) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const elements = useMemo(() => {
    const text = texts[currentIndex]
    if (splitBy === 'characters') {
      return text.split(' ').map((word, i, arr) => ({
        characters: splitIntoCharacters(word),
        needsSpace: i !== arr.length - 1,
      }))
    }
    const raw = splitBy === 'words'
      ? text.split(' ')
      : splitBy === 'lines'
        ? text.split('\n')
        : text.split(splitBy)
    return raw.map((el, i, arr) => ({
      characters: [el],
      needsSpace: i !== arr.length - 1,
    }))
  }, [texts, currentIndex, splitBy])

  const getDelay = useCallback((idx, total) => {
    if (staggerFrom === 'first')  return idx * staggerDuration
    if (staggerFrom === 'last')   return (total - 1 - idx) * staggerDuration
    if (staggerFrom === 'center') return Math.abs(Math.floor(total / 2) - idx) * staggerDuration
    if (staggerFrom === 'random') return Math.abs(Math.floor(Math.random() * total) - idx) * staggerDuration
    return Math.abs(staggerFrom - idx) * staggerDuration
  }, [staggerFrom, staggerDuration])

  const changeIndex = useCallback((next) => {
    setCurrentIndex(next)
    onNext?.(next)
  }, [onNext])

  const next = useCallback(() => {
    const n = currentIndex === texts.length - 1 ? (loop ? 0 : currentIndex) : currentIndex + 1
    if (n !== currentIndex) changeIndex(n)
  }, [currentIndex, texts.length, loop, changeIndex])

  const previous = useCallback(() => {
    const p = currentIndex === 0 ? (loop ? texts.length - 1 : currentIndex) : currentIndex - 1
    if (p !== currentIndex) changeIndex(p)
  }, [currentIndex, texts.length, loop, changeIndex])

  const jumpTo  = useCallback((i) => { const v = Math.max(0, Math.min(i, texts.length - 1)); if (v !== currentIndex) changeIndex(v) }, [texts.length, currentIndex, changeIndex])
  const reset   = useCallback(() => { if (currentIndex !== 0) changeIndex(0) }, [currentIndex, changeIndex])

  useImperativeHandle(ref, () => ({ next, previous, jumpTo, reset }), [next, previous, jumpTo, reset])

  useEffect(() => {
    if (!auto) return
    const id = setInterval(next, rotationInterval)
    return () => clearInterval(id)
  }, [next, rotationInterval, auto])

  const totalChars = elements.reduce((s, w) => s + w.characters.length, 0)

  return (
    <span
      className={mainClassName}
      style={{ display: 'inline-flex', flexWrap: 'wrap', whiteSpace: 'pre-wrap', ...mainStyle }}
    >
      {/* Screen-reader text */}
      <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' }}>
        {texts[currentIndex]}
      </span>

      <AnimatePresence mode={animatePresenceMode} initial={animatePresenceInitial}>
        <div
          key={currentIndex}
          style={{ display: 'inline-flex', flexWrap: 'wrap' }}
          aria-hidden="true"
        >
          {elements.map((wordObj, wordIdx, arr) => {
            const prevCount = arr.slice(0, wordIdx).reduce((s, w) => s + w.characters.length, 0)
            return (
              <span
                key={wordIdx}
                className={splitLevelClassName}
                style={{ display: 'inline-flex', overflow: 'hidden', ...splitLevelStyle }}
              >
                {wordObj.characters.map((char, charIdx) => (
                  <motion.span
                    key={charIdx}
                    initial={initial}
                    animate={animate}
                    exit={exit}
                    transition={{ ...transition, delay: getDelay(prevCount + charIdx, totalChars) }}
                    className={elementLevelClassName}
                    style={{ display: 'inline-block', ...elementLevelStyle }}
                  >
                    {char}
                  </motion.span>
                ))}
                {wordObj.needsSpace && <span style={{ whiteSpace: 'pre' }}> </span>}
              </span>
            )
          })}
        </div>
      </AnimatePresence>
    </span>
  )
})

export { TextRotate }
