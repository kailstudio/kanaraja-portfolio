/**
 * SiteHeader.jsx — Fixed glassmorphism navigation header
 *
 * Desktop: Logo left, category nav right. Hovering a category reveals a
 *   glassmorphism dropdown panel with all projects in that category.
 *
 * Mobile (≤600px): Logo left, hamburger right. Tapping opens a full-screen
 *   dark-glass overlay. Categories are accordion rows — tap to expand and
 *   reveal project thumbnails in a 2-col grid. Same spring transitions as
 *   the desktop dropdown, adapted for touch.
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CATEGORIES } from './PortfolioSection.jsx'

const BASE = import.meta.env.BASE_URL

// Short nav labels derived from category id
const NAV_LABEL = { brand: 'Brand', motion: 'Motion', packaging: 'Print', web: 'Web' }

// ── Desktop dropdown variants ────────────────────────────────────────────────
// Whimsical spring — grows out of the label with a noticeable overshoot and
// a slight tilt that corrects itself, so it feels alive rather than mechanical.
const DROPDOWN_VARIANTS = {
  hidden: {
    scaleY: 0,
    scaleX: 0.65,
    rotate: -2.5,
    opacity: 0,
    transition: { duration: 0.14, ease: [0.4, 0, 1, 1] },
  },
  visible: {
    scaleY: 1,
    scaleX: 1,
    rotate: 0,
    opacity: 1,
    transition: {
      scaleY: { type: 'spring', stiffness: 260, damping: 17, mass: 0.7 },
      scaleX: { type: 'spring', stiffness: 380, damping: 20, mass: 0.55 },
      rotate: { type: 'spring', stiffness: 300, damping: 18, mass: 0.6 },
      opacity: { duration: 0.06 },
    },
  },
}

// Desktop project card stagger
const PROJECT_VARIANTS = {
  hidden: { opacity: 0, scale: 0.82, y: 6 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 420,
      damping: 22,
      mass: 0.6,
      delay: 0.06 + i * 0.045,
    },
  }),
}

// ── Mobile menu variants ─────────────────────────────────────────────────────
// Full overlay slides down and fades in from just below the header
const MOBILE_MENU_VARIANTS = {
  hidden: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 28,
      mass: 0.8,
    },
  },
}

// Each category row staggers in after the overlay opens
const MOBILE_CAT_VARIANTS = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 380,
      damping: 26,
      mass: 0.6,
      delay: 0.05 + i * 0.07,
    },
  }),
}

// Accordion body for each expanded category
const MOBILE_PROJECTS_VARIANTS = {
  hidden: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
  },
  visible: {
    opacity: 1,
    height: 'auto',
    transition: {
      height: { type: 'spring', stiffness: 260, damping: 28, mass: 0.9 },
      opacity: { duration: 0.16, delay: 0.05 },
    },
  },
}

// Individual project cards pop in with a stagger
const MOBILE_PROJECT_VARIANTS = {
  hidden: { opacity: 0, scale: 0.86, y: 8 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 22,
      mass: 0.6,
      delay: i * 0.055,
    },
  }),
}

// SiteHeader renders the header bar + the portalised MobileMenu below it.
export default function SiteHeader({ onProjectOpen }) {
  // Desktop hover nav
  const [activeId, setActiveId] = useState(null)
  const [dropdownPage, setDropdownPage] = useState(0)

  // Mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileCatOpen, setMobileCatOpen]   = useState(null)

  // ── Desktop hover handlers ──────────────────────────────────────────────
  // Hover opens the dropdown; it stays open until a click outside closes it.
  const navRef = useRef(null)

  const openMenu = useCallback((id) => {
    setActiveId((prev) => {
      if (prev !== id) setDropdownPage(0)
      return id
    })
  }, [])

  // Click outside the entire nav closes the active dropdown
  useEffect(() => {
    if (!activeId) return
    const handleClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setActiveId(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [activeId])

  // ── Mobile menu handlers ────────────────────────────────────────────────
  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => {
      if (prev) setMobileCatOpen(null)
      return !prev
    })
  }, [])

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false)
    setMobileCatOpen(null)
  }, [])

  // Close mobile menu on Escape
  useEffect(() => {
    if (!mobileMenuOpen) return
    const onKey = (e) => { if (e.key === 'Escape') closeMobileMenu() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileMenuOpen, closeMobileMenu])

  // Prevent body scroll while mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  const scrollToWork = () => {
    document.getElementById('work')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
    <motion.header
      className="site-header"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
      aria-label="Studio KAIL site navigation"
    >
      <div className="site-header-inner">
        {/* Logo — scrolls to top */}
        <button
          className="site-header-logo-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
        >
          <div className="logo-group">
            <img
              src={`${BASE}logo.svg`}
              alt="Studio KAIL"
              className="site-header-logo"
              draggable={false}
            />
            <p className="logo-byline"><span>by</span><span>kana</span><span>raja</span></p>
          </div>
        </button>

        {/* Desktop category nav — hidden on mobile via CSS */}
        <nav className="site-nav" aria-label="Portfolio categories" ref={navRef}>
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="site-nav-item"
              onMouseEnter={() => openMenu(cat.id)}
            >
              <button
                className={`site-nav-btn${activeId === cat.id ? ' is-active' : ''}`}
                onClick={scrollToWork}
                aria-expanded={activeId === cat.id}
                aria-haspopup="true"
              >
                {NAV_LABEL[cat.id] ?? cat.id}
                <svg className="site-nav-chevron" viewBox="0 0 10 6" fill="none" aria-hidden="true">
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <AnimatePresence>
                {activeId === cat.id && cat.slides?.length > 0 && (
                  <motion.div
                    className="site-nav-dropdown"
                    role="menu"
                    variants={DROPDOWN_VARIANTS}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    style={{ transformOrigin: 'top center' }}
                  >
                    {(() => {
                      const PAGE_SIZE = 4
                      const totalPages = Math.ceil(cat.slides.length / PAGE_SIZE)
                      const page = dropdownPage
                      const visible = cat.slides.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
                      return (
                        <>
                          <div className="site-nav-dropdown-grid">
                            {visible.map((slide, i) => (
                              <motion.button
                                key={slide.id}
                                className={`site-nav-project${slide.comingSoon ? ' site-nav-project--soon' : ''}`}
                                role="menuitem"
                                custom={i}
                                variants={PROJECT_VARIANTS}
                                disabled={slide.comingSoon}
                                onClick={() => {
                                  if (slide.comingSoon) return
                                  setActiveId(null)
                                  onProjectOpen?.(cat, slide)
                                }}
                              >
                                {slide.comingSoon ? (
                                  <div className="site-nav-project-soon-placeholder">Coming Soon</div>
                                ) : (
                                  <div
                                    className="site-nav-project-thumb"
                                    style={{ background: slide.bg || '#e8e4f8' }}
                                  >
                                    {slide.img && (
                                      <img src={`${BASE}${slide.img}`} alt="" className="site-nav-project-img" />
                                    )}
                                    <span className="site-nav-project-label">{slide.label}</span>
                                  </div>
                                )}
                              </motion.button>
                            ))}
                          </div>
                          {totalPages > 1 && (
                            <div className="site-nav-dropdown-pager">
                              <button
                                className="site-nav-pager-btn"
                                disabled={page === 0}
                                onClick={(e) => { e.stopPropagation(); setDropdownPage((p) => p - 1) }}
                                aria-label="Previous projects"
                              >
                                ‹
                              </button>
                              <span className="site-nav-pager-count">{page + 1} / {totalPages}</span>
                              <button
                                className="site-nav-pager-btn"
                                disabled={page === totalPages - 1}
                                onClick={(e) => { e.stopPropagation(); setDropdownPage((p) => p + 1) }}
                                aria-label="Next projects"
                              >
                                ›
                              </button>
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </nav>

        {/* Mobile hamburger — only visible ≤600px via CSS */}
        <button
          className={`site-mobile-menu-btn${mobileMenuOpen ? ' is-open' : ''}`}
          onClick={toggleMobileMenu}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          {/* Three lines → X morphing via CSS transitions */}
          <span className="site-mobile-hamburger" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>

    </motion.header>

    {/* Mobile overlay — portalled to body to escape the header's backdrop-filter
        stacking context, which would otherwise hijack position:fixed and trap
        the overlay inside the header's 52px box. */}
    <MobileMenu
      isOpen={mobileMenuOpen}
      mobileCatOpen={mobileCatOpen}
      setMobileCatOpen={setMobileCatOpen}
      onClose={closeMobileMenu}
      onProjectOpen={onProjectOpen}
    />
  </>
  )
}

// ── Mobile overlay — rendered via portal so backdrop-filter on the header
//    doesn't hijack `position:fixed` and trap it inside the header's 52px box.
function MobileMenu({ isOpen, mobileCatOpen, setMobileCatOpen, onClose, onProjectOpen }) {
  const scrollToWork = () => {
    document.getElementById('work')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="site-mobile-menu"
          variants={MOBILE_MENU_VARIANTS}
          initial="hidden"
          animate="visible"
          exit="hidden"
          aria-label="Mobile navigation"
        >
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.id}
              className="site-mobile-cat"
              custom={i}
              variants={MOBILE_CAT_VARIANTS}
              initial="hidden"
              animate="visible"
            >
              <button
                className={`site-mobile-cat-btn${mobileCatOpen === cat.id ? ' is-open' : ''}`}
                onClick={() => setMobileCatOpen((prev) => prev === cat.id ? null : cat.id)}
                aria-expanded={mobileCatOpen === cat.id}
              >
                <span className="site-mobile-cat-label">{NAV_LABEL[cat.id] ?? cat.id}</span>
                <svg className="site-mobile-cat-chevron" viewBox="0 0 10 6" fill="none" aria-hidden="true">
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <AnimatePresence>
                {mobileCatOpen === cat.id && cat.slides?.length > 0 && (
                  <motion.div
                    className="site-mobile-cat-projects"
                    variants={MOBILE_PROJECTS_VARIANTS}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="site-mobile-projects-grid">
                      {cat.slides.map((slide, j) => (
                        <motion.button
                          key={slide.id}
                          className={`site-mobile-project${slide.comingSoon ? ' site-mobile-project--soon' : ''}`}
                          custom={j}
                          variants={MOBILE_PROJECT_VARIANTS}
                          initial="hidden"
                          animate="visible"
                          disabled={slide.comingSoon}
                          onClick={() => {
                            if (slide.comingSoon) return
                            onClose()
                            onProjectOpen?.(cat, slide)
                          }}
                        >
                          {slide.comingSoon ? (
                            <div className="site-mobile-project-soon">Coming Soon</div>
                          ) : (
                            <>
                              <div
                                className="site-mobile-project-thumb"
                                style={{ background: slide.bg || '#e8e4f8' }}
                              >
                                {slide.img && (
                                  <img
                                    src={`${BASE}${slide.img}`}
                                    alt=""
                                    className="site-mobile-project-img"
                                  />
                                )}
                              </div>
                              <span className="site-mobile-project-label">{slide.label}</span>
                            </>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}

        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
