import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const PLACEHOLDER_IMAGES = [
  { id: 1, bg: '#c8b8e8', label: 'Project 01' },
  { id: 2, bg: '#b8d0e8', label: 'Project 02' },
  { id: 3, bg: '#e8c8d8', label: 'Project 03' },
  { id: 4, bg: '#c8e8d0', label: 'Project 04' },
]

export default function PortfolioCarousel({ category, onClose }) {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)

  const slides = category?.slides || PLACEHOLDER_IMAGES

  const go = useCallback((dir) => {
    setDirection(dir)
    setCurrent((c) => (c + dir + slides.length) % slides.length)
  }, [slides.length])

  // Keyboard nav
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft')  go(-1)
      if (e.key === 'Escape')     onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [go, onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const variants = {
    enter: (d) => ({ x: d > 0 ? '60%' : '-60%', opacity: 0, scale: 0.92 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit:  (d) => ({ x: d > 0 ? '-60%' : '60%', opacity: 0, scale: 0.92 }),
  }

  const slide = slides[current]

  return (
    <motion.div
      className="carousel-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="carousel-modal"
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="carousel-header">
          <span className="carousel-category">{category?.name}</span>
          <button className="carousel-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Slide */}
        <div className="carousel-stage">
          <AnimatePresence custom={direction} mode="popLayout">
            <motion.div
              key={current}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', damping: 30, stiffness: 280 }}
              className="carousel-slide"
              style={{ background: slide.bg || '#c8b8e8' }}
            >
              {slide.src ? (
                slide.src.endsWith('.mp4') ? (
                  <video src={slide.src} autoPlay loop muted playsInline className="slide-media" />
                ) : (
                  <img src={slide.src} alt={slide.label} className="slide-media" />
                )
              ) : (
                <div className="slide-placeholder">
                  <span>{slide.label}</span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Nav */}
        <div className="carousel-nav">
          <button className="carousel-arrow" onClick={() => go(-1)} aria-label="Previous">
            ←
          </button>
          <div className="carousel-dots">
            {slides.map((_, i) => (
              <button
                key={i}
                className={`carousel-dot ${i === current ? 'active' : ''}`}
                onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i) }}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
          <button className="carousel-arrow" onClick={() => go(1)} aria-label="Next">
            →
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
