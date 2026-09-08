/**
 * ProjectDetail.jsx — Project detail overlay
 *
 * Two modes:
 *  1. 8-card bento grid  — default for category-level cards
 *  2. Premium case study — when slide.caseStudy is present
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { PDFFlipbook } from './PDFFlipbook'

// ── Transitions ──────────────────────────────────────────────────────
const OVERLAY = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, transition: { duration: 0.26, ease: [0.4, 0, 0.2, 1] } },
}

const CONTENT = {
  initial: { opacity: 0, y: 24, scale: 0.97, filter: 'blur(8px)' },
  animate: { opacity: 1, y:  0, scale: 1.00, filter: 'blur(0px)',
             transition: { duration: 0.44, ease: [0.16, 1, 0.3, 1], delay: 0.06 } },
  exit:    { opacity: 0, y: 10, scale: 0.98, filter: 'blur(6px)',
             transition: { duration: 0.26, ease: [0.4, 0, 0.2, 1] } },
}

const CARD = {
  initial: { opacity: 0, y: 16 },
  animate: (i) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.48, ease: [0.16, 1, 0.3, 1], delay: 0.12 + i * 0.055 },
  }),
}

// ── CBS brand palette ────────────────────────────────────────────────
const CBS = {
  espresso: '#332824',
  cream:    '#F9F0E6',
  blue:     '#86A3B3',
  mint:     '#B1D1CE',
  peach:    '#F9C595',
}

// ═══════════════════════════════════════════════════════════════════════
//  UTILITY COMPONENTS
// ═══════════════════════════════════════════════════════════════════════

// CBS Logo — real image with SVG fallback
function CBSLogo({ size = 120 }) {
  const base = import.meta.env.BASE_URL
  return (
    <img
      src={`${base}cbs/cbs-logo.webp`}
      alt="Care-Based Safety logo"
      width={size}
      height={size}
      style={{ objectFit: 'contain', display: 'block' }}
      onError={(e) => { e.currentTarget.style.display = 'none' }}
    />
  )
}

// 16-ray sunburst SVG (kept as fallback/accent element)
function SunburstSVG({ size = 120, color = '#FFFFFF' }) {
  const rays = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2
    return {
      x1: 100 + 22 * Math.cos(a), y1: 100 + 22 * Math.sin(a),
      x2: 100 + 78 * Math.cos(a), y2: 100 + 78 * Math.sin(a),
    }
  })
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true">
      {rays.map((r, i) => (
        <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2}
          stroke={color} strokeWidth="4.5" strokeLinecap="round" />
      ))}
      <circle cx="100" cy="100" r="10" fill={color} />
    </svg>
  )
}

// Animated counter — counts up when scrolled into view
function Counter({ to, suffix = '', prefix = '' }) {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [val, setVal] = useState(0)
  const target = parseInt(to)
  const isNum  = !isNaN(target)

  useEffect(() => {
    if (!inView || !isNum) return
    const dur = 1600
    const t0  = performance.now()
    const tick = (t) => {
      const p = Math.min((t - t0) / dur, 1)
      const e = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(e * target))
      if (p < 1) requestAnimationFrame(tick)
      else setVal(target)
    }
    requestAnimationFrame(tick)
  }, [inView, target, isNum])

  return <span ref={ref}>{prefix}{isNum ? val : to}{suffix}</span>
}

// Scroll-reveal motion wrapper
function Reveal({ children, delay = 0, className }) {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  )
}

// Section wrapper — title only (numbering removed)
function CSSection({ label, title, children, variant = 'light', className }) {
  const cls = ['cs-section', `cs-section--${variant}`, className].filter(Boolean).join(' ')
  return (
    <section className={cls}>
      {title && (
        <Reveal>
          <div className="cs-section-header">
            {title && <h2 className="cs-section-title">{title}</h2>}
          </div>
        </Reveal>
      )}
      {children}
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════
//  EXISTING BENTO-GRID CARDS (non-case-study projects)
// ═══════════════════════════════════════════════════════════════════════

function VisualCard({ cat }) {
  return (
    <motion.div className="pdc pdc-visual" custom={0} variants={CARD}
      style={{ background: `linear-gradient(148deg, ${cat.accentDark} 0%, ${cat.accent} 58%, ${cat.accent}bb 100%)` }}>
      <div className="pdc-ring pdc-ring--1" />
      <div className="pdc-ring pdc-ring--2" />
      <div className="pdc-ring pdc-ring--3" />
      <span className="pdc-initial">{cat.id[0].toUpperCase()}</span>
      <div className="pdc-visual-footer">
        <span className="pdc-visual-studio">Studio KAIL</span>
        <span className="pdc-visual-service">{cat.slides[0].label}</span>
      </div>
    </motion.div>
  )
}

function DarkIntroCard({ cat }) {
  return (
    <motion.div className="pdc pdc-dark" custom={1} variants={CARD}>
      <span className="pdc-dark-pill">Studio KAIL</span>
      <span className="pdc-dark-star" style={{ color: cat.accent }}>✦</span>
      <p className="pdc-dark-text">{cat.tagline}</p>
    </motion.div>
  )
}

function DeliverablesCard({ cat }) {
  return (
    <motion.div className="pdc pdc-tags" custom={2} variants={CARD}>
      <span className="pdc-eyebrow">Deliverables</span>
      <div className="pdc-chips">
        {cat.slides.map((s) => (
          <span key={s.id} className="pdc-chip"
            style={{ color: cat.accentDark, background: `${cat.accent}28` }}>{s.label}</span>
        ))}
      </div>
    </motion.div>
  )
}

function AboutCard({ cat }) {
  return (
    <motion.div className="pdc pdc-about" custom={3} variants={CARD}>
      <span className="pdc-eyebrow">About</span>
      <p className="pdc-about-body">{cat.description}</p>
    </motion.div>
  )
}

function ScopeCard({ cat }) {
  return (
    <motion.div className="pdc pdc-scope" custom={4} variants={CARD}>
      <span className="pdc-eyebrow pdc-eyebrow--light">Our Scope</span>
      <ul className="pdc-scope-list">
        {cat.slides.map((s, i) => (
          <li key={s.id} className="pdc-scope-item">
            <span className="pdc-scope-num">0{i + 1}</span>{s.label}
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

function StatLightCard({ cat }) {
  const s = cat.stats[0]
  return (
    <motion.div className="pdc pdc-stat-lt" custom={5} variants={CARD}>
      <span className="pdc-eyebrow">Impact</span>
      <span className="pdc-big-num" style={{ color: cat.accentDark }}>{s.value}</span>
      <span className="pdc-stat-label">{s.label}</span>
    </motion.div>
  )
}

function StatDarkCard({ cat }) {
  const s = cat.stats[1]
  return (
    <motion.div className="pdc pdc-stat-dk" custom={6} variants={CARD}>
      <span className="pdc-eyebrow pdc-eyebrow--light">Result</span>
      <span className="pdc-big-num pdc-big-num--white">{s.value}</span>
      <span className="pdc-stat-label pdc-stat-label--muted">{s.label}</span>
    </motion.div>
  )
}

function CtaCard({ cat }) {
  const s = cat.stats[2]
  return (
    <motion.div className="pdc pdc-cta" custom={7} variants={CARD}>
      <span className="pdc-cta-stat-val">{s.value}</span>
      <span className="pdc-cta-stat-lbl">{s.label}</span>
      <div className="pdc-cta-divider" />
      <p className="pdc-cta-heading">Ready to build something exceptional?</p>
      <a href="mailto:hello@kail.studio" className="pdc-cta-arrow-btn" aria-label="Get in touch">↗</a>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
//  PREMIUM CASE STUDY SECTIONS
// ═══════════════════════════════════════════════════════════════════════

// ── 01 Hero ─────────────────────────────────────────────────────────
function CSHero({ cs, slide }) {
  return (
    <CSSection variant="dark" className="cs-hero">
      <Reveal delay={0.04}>
        <div className="cs-hero-pills">
          {(slide.tags || []).map((t) => (
            <span key={t} className="cs-hero-pill">{t}</span>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <h1 className="cs-hero-title">{slide.label}</h1>
        <p className="cs-hero-subtitle">{cs.subtitle}</p>
      </Reveal>

      <Reveal delay={0.18}>
        <div className="cs-hero-visual">
          <div className="cs-hero-img">
            <div className="cs-hero-img-bg">
              <CBSLogo size={220} />
              <p className="cs-ph-label">Brand Identity System, Care-Based Safety</p>
            </div>
          </div>
          <div className="cs-float cs-float--tl">
            <span className="cs-float-l">Client</span>
            <span className="cs-float-v">Care-Based Safety</span>
          </div>
          <div className="cs-float cs-float--tr">
            <span className="cs-float-l">Year</span>
            <span className="cs-float-v">{cs.year}</span>
          </div>
          <div className="cs-float cs-float--bl">
            <span className="cs-float-l">Duration</span>
            <span className="cs-float-v">{cs.duration}</span>
          </div>
          <div className="cs-float cs-float--br">
            <span className="cs-float-l">Location</span>
            <span className="cs-float-v">Michigan, USA</span>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.28}>
        <div className="cs-hero-status">
          <span className="cs-status-dot" />
          <span className="cs-status-text">{cs.status}</span>
        </div>
      </Reveal>
    </CSSection>
  )
}

// ── 02 Project Overview Bento ────────────────────────────────────────
function CSOverview({ cs }) {
  return (
    <CSSection label="01" title="Project Overview">
      <div className="cs-bento">
        <Reveal delay={0.08} className="cs-bc cs-bc--wide cs-bc--dark">
          <span className="cs-bc-eye">Overview</span>
          <p className="cs-bc-body cs-bc-body--light">
            A community-rooted organisation in Washtenaw County, Michigan: building and advocating for non-police crisis response, prevention-first systems, and community-led approaches to public safety grounded in abolitionist principles.
          </p>
          <div className="cs-bc-tag">Abolitionist · Community-led · Prevention-first</div>
        </Reveal>

      </div>
    </CSSection>
  )
}

// ── 03 The Brief ─────────────────────────────────────────────────────
const BRIEF_CARDS = [
  { icon: '⌘', title: 'The Challenge', body: 'Build a brand for radically different rooms: from someone reaching out in crisis to a government funding partner.' },
  { icon: '◎', title: 'User Needs', body: 'Warmth and directness for community members. Rigour and credibility for funders. Results-led clarity for government.' },
  { icon: '✦', title: 'Business Goals', body: 'Six structured phases. A complete visual system. Deployable immediately across every touchpoint: social, print, digital, campaign.' },
  { icon: '◈', title: 'Success Metrics', body: 'Same conviction. Same warmth. Same clarity: whether the audience is a funder in a boardroom or a person reaching out for help.' },
]

function CSBrief({ cs }) {
  const brief = cs.sections.find((s) => s.id === 'brief')
  const lead  = brief?.body?.split('\n\n')[0] ?? ''
  return (
    <CSSection label="02" title="The Brief" variant="accent">
      <Reveal delay={0.08}>
        <p className="cs-lead">{lead}</p>
      </Reveal>
      <div className="cs-brief-grid">
        {BRIEF_CARDS.map(({ icon, title, body }, i) => (
          <Reveal key={title} delay={0.1 + i * 0.07} className="cs-brief-card">
            <span className="cs-brief-icon">{icon}</span>
            <h4 className="cs-brief-title">{title}</h4>
            <p className="cs-brief-body">{body}</p>
          </Reveal>
        ))}
      </div>
    </CSSection>
  )
}

// ── 04 Research & Strategy ───────────────────────────────────────────
const TRAITS = ['Abolitionist', 'Compassionate', 'Imaginative', 'Co-created', 'Trustworthy', 'Calm but firm', 'Relational']

function CSStrategy({ cs }) {
  const strategy = cs.sections.find((s) => s.id === 'strategy')
  const lead = strategy?.body?.split('\n\n')[0] ?? ''
  return (
    <CSSection label="03" title="Research & Strategy">
      <Reveal delay={0.08}>
        <p className="cs-lead cs-lead--sm">{lead}</p>
      </Reveal>
      <div className="cs-strategy-grid">
        <Reveal delay={0.12} className="cs-strat-card cs-strat-card--dark">
          <span className="cs-strat-label">Discovery</span>
          <h4 className="cs-strat-head">Existing materials, communications + competitor landscape.</h4>
          <p className="cs-strat-body">Key insight: step entirely outside the iconographic vocabulary of conventional public safety.</p>
        </Reveal>
        <Reveal delay={0.18} className="cs-strat-card cs-strat-card--tiers">
          <span className="cs-strat-label">3 Audience Tiers</span>
          <div className="cs-tier-list">
            {[
              { n: '01', head: 'Community Members', body: 'Direct, plain, with care. Meeting people where they are.' },
              { n: '02', head: 'Funders & Activists', body: 'Values connected to measurable outcomes.' },
              { n: '03', head: 'Government & Public', body: 'Results-led. Care as common sense, not ideology.' },
            ].map(({ n, head, body }) => (
              <div key={n} className="cs-tier">
                <span className="cs-tier-n">{n}</span>
                <div><strong>{head}</strong><p>{body}</p></div>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.24} className="cs-strat-card cs-strat-card--light">
          <span className="cs-strat-label">Brand Personality</span>
          <div className="cs-trait-cloud">
            {TRAITS.map((t) => <span key={t} className="cs-trait">{t}</span>)}
          </div>
          <p className="cs-strat-body" style={{ marginTop: 14 }}>Calm but firm. Relational, not institutional.</p>
        </Reveal>
      </div>
    </CSSection>
  )
}

// ── 05 Visual Identity ───────────────────────────────────────────────
function CSVisualIdentity({ cs }) {
  const visual = cs.sections.find((s) => s.id === 'visual')
  const logo   = visual?.subsections?.[0]
  const colour = visual?.subsections?.[1]
  const palette = [
    { hex: CBS.espresso, name: 'Espresso',   usage: 'Primary anchor: authority, depth' },
    { hex: CBS.cream,    name: 'Warm Cream', usage: 'Primary ground: warmth, openness' },
    { hex: CBS.blue,     name: 'Steel Blue', usage: 'Trust, calm, secondary voice' },
    { hex: CBS.mint,     name: 'Soft Mint',  usage: 'Growth, care, optimism' },
    { hex: CBS.peach,    name: 'Warm Peach', usage: 'Warmth, celebration, energy' },
  ]
  return (
    <CSSection label="04" title="Visual Identity" variant="dark">
      <Reveal delay={0.1} className="cs-logo-showcase">
        <div className="cs-logo-visual">
          <div className="cs-logo-ring"><CBSLogo size={160} /></div>
          <div className="cs-logo-wordmark">
            <span className="cs-logo-name" style={{ color: '#FFFFFF' }}>Care-Based Safety</span>
            <span className="cs-logo-tag" style={{ color: '#D4C7FF' }}>Safety is relational.</span>
          </div>
        </div>
        <div className="cs-logo-copy">
          <h4 className="cs-vi-sub" style={{ color: '#D4C7FF' }}>The Mark</h4>
          <p className="cs-vi-body" style={{ color: 'rgba(255,255,255,0.80)' }}>{logo?.body?.substring(0, 320)}...</p>
          <div className="cs-logo-specs">
            {['16 rays', 'Circular grid', 'Hand-drawn strokes', 'Community at centre'].map((s) => (
              <span key={s} className="cs-logo-spec">{s}</span>
            ))}
          </div>
        </div>
      </Reveal>
      <Reveal delay={0.14}>
        <div className="cs-vi-divider" />
        <h4 className="cs-vi-sub" style={{ color: '#D4C7FF', marginBottom: 8 }}>Colour Palette</h4>
        <p className="cs-vi-body" style={{ color: 'rgba(255,255,255,0.80)', marginBottom: 28 }}>{colour?.body?.split('.')[0]}.</p>
        <div className="cs-palette">
          {palette.map(({ hex, name, usage }, i) => (
            <Reveal key={hex} delay={0.06 + i * 0.06} className="cs-swatch-card">
              <div className="cs-swatch-colour" style={{ background: hex, border: hex === '#F9F0E6' ? '1px solid rgba(255,255,255,0.15)' : 'none' }} />
              <div className="cs-swatch-info">
                <span className="cs-swatch-hex">{hex}</span>
                <span className="cs-swatch-name">{name}</span>
                <span className="cs-swatch-usage">{usage}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </Reveal>
      <Reveal delay={0.2} className="cs-type-card">
        <h4 className="cs-vi-sub" style={{ color: '#D4C7FF' }}>Typography</h4>
        <div className="cs-type-rows">
          <div className="cs-type-row">
            <span className="cs-type-demo cs-type-demo--bold" style={{ color: '#FFFFFF' }}>Aa</span>
            <div>
              <strong style={{ color: '#FFFFFF' }}>Montserrat SemiBold</strong>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>Headers: confidence, structural clarity</p>
            </div>
          </div>
          <div className="cs-type-row">
            <span className="cs-type-demo cs-type-demo--light" style={{ color: '#FFFFFF' }}>Aa</span>
            <div>
              <strong style={{ color: '#FFFFFF' }}>Montserrat Light</strong>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>Body: openness, 6th-grade accessibility</p>
            </div>
          </div>
        </div>
        <p className="cs-type-sample" style={{ color: 'rgba(255,255,255,0.40)' }}>"Safety is relational. It grows through care, connection, and shared power."</p>
      </Reveal>
    </CSSection>
  )
}

// ── 06 Process Timeline ──────────────────────────────────────────────
const PHASES = [
  { n: '01', name: 'Discovery',         desc: 'Brand audit, audience mapping, competitive landscape' },
  { n: '02', name: 'Logo Development',  desc: 'Two creative directions: Beam selected and refined' },
  { n: '03', name: 'Colour & Type',     desc: 'Earthy palette finalised, Montserrat system set' },
  { n: '04', name: 'Imagery',           desc: 'Illustration style, photography direction, icon system' },
  { n: '05', name: 'Voice & Messaging', desc: 'Messaging architecture, tone of voice, campaign lines' },
  { n: '06', name: 'Handover',          desc: 'Brand guidelines, all assets, complete file delivery' },
]

function CSTimeline() {
  return (
    <CSSection title="Our Process" variant="light">
      <div className="cs-timeline">
        {PHASES.map(({ n, name, desc }, i) => (
          <Reveal key={n} delay={0.06 + i * 0.07} className="cs-tl-item">
            <div className="cs-tl-connector" aria-hidden="true" />
            <div className="cs-tl-dot"><span>{n}</span></div>
            <div className="cs-tl-body">
              <h4 className="cs-tl-name">{name}</h4>
              <p className="cs-tl-desc">{desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </CSSection>
  )
}

// ── 07 Gallery ───────────────────────────────────────────────────────
const BASE = import.meta.env.BASE_URL

const GALLERY_ITEMS = [
  { label: 'Brand Photography',    cls: 'wide', src: `${BASE}cbs/imagery/CBS1.jpg` },
  { label: 'Community in Action',  cls: 'std',  src: `${BASE}cbs/imagery/CBS2.jpg` },
  { label: 'People & Place',       cls: 'std',  src: `${BASE}cbs/imagery/CBS3.jpg` },
  { label: 'Social Media Content', cls: 'std',  src: `${BASE}cbs/social/1.webp` },
  { label: 'Social Media Content', cls: 'std',  src: `${BASE}cbs/social/2.webp` },
  { label: 'Illustration System',  cls: 'wide', src: `${BASE}cbs/illustrations/Illustration1.webp` },
  { label: 'Illustration Detail',  cls: 'std',  src: `${BASE}cbs/illustrations/Illustration2.webp` },
  { label: 'Campaign Graphics',    cls: 'std',  src: `${BASE}cbs/illustrations/Illustration3.webp` },
]

function GalImg({ src, label }) {
  return (
    <img
      src={src}
      alt={label}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 'inherit' }}
      loading="lazy"
    />
  )
}

// ── Shared: Accordion image gallery ──────────────────────────────────
// Desktop already gets the "one grows, the rest shrink to fit" accordion
// via :hover (see .img-gallery-item:hover in styles.css) — but hover never
// fires on touch, so on mobile every item just sat at its small resting
// width with no way to open one up. `activeIndex` gives touch (and click,
// generally) the same effect: tapping an item pins it open.
//
// Ordinary flex-shrink alone isn't enough to make that visible with 6
// items on a phone-width row — their resting sizes already use up nearly
// all the available width, so there's no free space left for the active
// item to grow into. So every OTHER item also gets an explicit
// `--collapsed` class while one is active, shrinking them well past their
// resting size (see .img-gallery-item--collapsed in styles.css) — that's
// what actually frees up the room the active item grows into, and is also
// what keeps all six items fitting inside the row instead of pushing the
// later ones off the right edge.
function ImageGallery({ images, colors = [] }) {
  const [activeIndex, setActiveIndex] = useState(null)
  if (!images || images.length === 0) return null
  const hasActive = activeIndex !== null
  return (
    <div className="img-gallery-row">
      {images.map((src, i) => {
        const isActive = activeIndex === i
        const state = isActive ? ' img-gallery-item--active' : hasActive ? ' img-gallery-item--collapsed' : ''
        return (
          <div
            key={i}
            className={`img-gallery-item${state}`}
            style={{ background: colors[i % colors.length] || 'transparent' }}
            onClick={() => setActiveIndex((cur) => (cur === i ? null : i))}
          >
            <img src={src} alt={`Illustration ${i + 1}`} loading="lazy" />
          </div>
        )
      })}
    </div>
  )
}

// Brand-tinted gallery backgrounds
const CBS_GALLERY_COLORS = [
  'rgba(224,248,125,0.10)',
  'rgba(212,199,255,0.14)',
  'rgba(51,92,255,0.09)',
  'rgba(224,248,125,0.07)',
  'rgba(212,199,255,0.10)',
  'rgba(51,92,255,0.07)',
]

// Brand-tinted gallery backgrounds
const PGM_GALLERY_COLORS = [
  'rgba(51,92,255,0.10)',
  'rgba(212,199,255,0.14)',
  'rgba(224,248,125,0.09)',
  'rgba(51,92,255,0.07)',
  'rgba(212,199,255,0.10)',
  'rgba(51,92,255,0.12)',
]

// ── Shared: Custom Illustrations & Iconography section ────────────────
function IllustrationsSection({ label = '05', images = [], colors = [] }) {
  return (
    <CSSection label={label} title="Custom Illustrations & Iconography">
      <ImageGallery images={images} colors={colors} />
    </CSSection>
  )
}

// ── 08 Impact Stats ──────────────────────────────────────────────────
const IMPACT_STATS = [
  { to: '6',   suffix: '',     label: 'Phases completed',      desc: 'End-to-end delivery' },
  { to: '5',   suffix: '',     label: 'Brand colours',          desc: 'Earthy & natural palette' },
  { to: '16',  suffix: ' ray', label: 'Sunburst mark',          desc: 'Precision geometry' },
  { to: '3',   suffix: '',     label: 'Audience tiers',         desc: 'Community · Funders · Govt' },
  { to: '120', suffix: '+',    label: 'Brand assets delivered', desc: 'Ready for immediate use' },
  { to: '1',   suffix: ' mo',  label: 'Timeline',               desc: 'Concept to guidelines' },
]

function CSImpact() {
  return (
    <CSSection label="06" title="Outcomes" variant="dark">
      <div className="cs-impact-grid">
        {IMPACT_STATS.map(({ to, suffix, label, desc }, i) => (
          <Reveal key={label} delay={0.06 + i * 0.07} className="cs-impact-card">
            <div className="cs-impact-num" style={{ color: '#E0F87D' }}>
              <Counter to={to} suffix={suffix} />
            </div>
            <div className="cs-impact-label" style={{ color: '#FFFFFF' }}>{label}</div>
            <div className="cs-impact-desc" style={{ color: 'rgba(255,255,255,0.35)' }}>{desc}</div>
          </Reveal>
        ))}
      </div>
    </CSSection>
  )
}

// ── 09 Brand Guidelines Flipbook ─────────────────────────────────────
const BOOK_PAGES = [
  {
    bg: '#333333', color: '#FFFFFF',
    content: (
      <div className="cs-book-cover">
        <SunburstSVG size={72} color="#FFFFFF" />
        <h3>Care-Based Safety</h3>
        <p>Brand Guidelines</p>
        <span>2024 Edition</span>
      </div>
    ),
  },
  {
    bg: '#FFFFFF', color: '#333333',
    content: (
      <div className="cs-book-inner">
        <span className="cs-book-pg">02</span>
        <h4>Our Mission</h4>
        <p>Building and advocating for non-police crisis response, prevention-first systems, and community-led approaches to public safety rooted in care.</p>
      </div>
    ),
  },
  {
    bg: '#FFFFFF', color: '#333333',
    content: (
      <div className="cs-book-inner">
        <span className="cs-book-pg">03</span>
        <h4>The Logo</h4>
        <div style={{ margin: '12px 0' }}><SunburstSVG size={52} color="#333333" /></div>
        <p>16 rays. Precision geometry. Hand-drawn strokes. Community at the centre.</p>
      </div>
    ),
  },
  {
    bg: '#D4C7FF', color: '#333333',
    content: (
      <div className="cs-book-inner">
        <span className="cs-book-pg">04</span>
        <h4>Colour Palette</h4>
        <div className="cs-book-swatches">
          {[CBS.espresso, CBS.cream, CBS.blue, CBS.mint, CBS.peach].map((hex) => (
            <div key={hex} style={{ background: hex, width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }} />
          ))}
        </div>
        <p>Earthy and Natural: stability and warmth, never clinical.</p>
      </div>
    ),
  },
  {
    bg: '#FFFFFF', color: '#333333',
    content: (
      <div className="cs-book-inner">
        <span className="cs-book-pg">05</span>
        <h4>Typography</h4>
        <div style={{ fontSize: 24, fontWeight: 600, margin: '10px 0 4px' }}>Montserrat SemiBold</div>
        <div style={{ fontSize: 13, fontWeight: 300, lineHeight: 1.6 }}>Montserrat Light: body text at 6th-grade reading level</div>
      </div>
    ),
  },
  {
    bg: '#333333', color: '#FFFFFF',
    content: (
      <div className="cs-book-inner">
        <span className="cs-book-pg" style={{ color: 'rgba(255,255,255,0.35)' }}>06</span>
        <h4>Brand Voice</h4>
        <div className="cs-book-lines">
          <p>"Care keeps communities safe."</p>
          <p>"Safety is relational."</p>
          <p>"You deserve care, not punishment."</p>
        </div>
      </div>
    ),
  },
]

function CSFlipbook() {
  const pdfUrl = `${import.meta.env.BASE_URL}guidelines/cbs-guidelines.pdf`
  return (
    <div className="cs-flipbook-wrap">
      <PDFFlipbook
        pdfUrl={pdfUrl}
        accentColor="#335CFF"
        totalHint={17}
      />
    </div>
  )
}

// ── CBS Flipbook (legacy inline pages, kept as fallback) ─────────────
function CSFlipbookLegacy() {
  const [page, setPage] = useState(0)
  const [dir,  setDir]  = useState(1)

  const go = (d) => {
    const next = page + d
    if (next < 0 || next >= BOOK_PAGES.length) return
    setDir(d)
    setPage(next)
  }

  const current = BOOK_PAGES[page]

  return (
    <CSSection label="07" title="Brand Guidelines" variant="light">
      <Reveal delay={0.1} className="cs-flipbook">
        <div className="cs-book-viewer">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={page}
              className="cs-book-page"
              style={{ background: current.bg, color: current.color }}
              initial={{ opacity: 0, x: dir * 36 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -36 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              {current.content}
            </motion.div>
          </AnimatePresence>
          <button className="cs-book-btn cs-book-btn--prev" onClick={() => go(-1)} disabled={page === 0} aria-label="Previous">&#8249;</button>
          <button className="cs-book-btn cs-book-btn--next" onClick={() => go(1)} disabled={page === BOOK_PAGES.length - 1} aria-label="Next">&#8250;</button>
        </div>
        <div className="cs-book-thumbs">
          {BOOK_PAGES.map((p, i) => (
            <button key={i}
              className={`cs-book-thumb${i === page ? ' cs-book-thumb--active' : ''}`}
              style={{ background: p.bg }}
              onClick={() => { setDir(i > page ? 1 : -1); setPage(i) }}
              aria-label={`Page ${i + 1}`}
            />
          ))}
        </div>
        <p className="cs-book-note">Page {page + 1} of {BOOK_PAGES.length}. Replace with final PDF when ready.</p>
      </Reveal>
    </CSSection>
  )
}

// ═══════════════════════════════════════════════════════════════════════
//  PHOTO STACK — adapted from InteractivePhotoStack (TypeScript/Tailwind → JSX/CSS)
// ═══════════════════════════════════════════════════════════════════════

function generateNonOverlappingTransforms(items) {
  const positions = []
  const displayed = items.slice(0, 5)
  const cardWidthVW  = 25
  const cardHeightVH = 45
  const maxRetries   = 100
  const rng = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

  displayed.forEach(() => {
    let pos, collision, retries = 0
    do {
      collision = false
      pos = { x: rng(-40, 40), y: rng(-22, 22), r: rng(-22, 22) }
      for (const p of positions) {
        if (Math.abs(pos.x - p.x) < cardWidthVW && Math.abs(pos.y - p.y) < cardHeightVH) {
          collision = true; break
        }
      }
      retries++
    } while (collision && retries < maxRetries)
    positions.push(pos)
  })
  return positions.map(p => `translate(${p.x}vw, ${p.y}vh) rotate(${p.r}deg)`)
}

const BASE_ROTATIONS = [0, -2, 4, -4, 6]

function PhotoStack({ items, title, accentColor }) {
  const [topIndex,       setTopIndex]       = useState(0)
  const [hovered,        setHovered]        = useState(false)
  const [clickedIndex,   setClickedIndex]   = useState(null)
  const [spreadXforms,   setSpreadXforms]   = useState([])

  const displayed = items.slice(0, 5)
  const numItems  = displayed.length

  const handleEnter = useCallback(() => {
    setSpreadXforms(generateNonOverlappingTransforms(items))
    setHovered(true)
  }, [items])

  const handleLeave = useCallback(() => {
    if (clickedIndex === null) setHovered(false)
  }, [clickedIndex])

  const handleClick = useCallback((index) => {
    if (hovered) {
      setClickedIndex(index)
      setTimeout(() => {
        setHovered(false)
        setTopIndex(index)
        setClickedIndex(null)
      }, 650)
    } else {
      setTopIndex(index)
    }
  }, [hovered])

  return (
    <div className="pstack">
      <div className="pstack-area" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
        <div className="pstack-inner">
          {displayed.map((item, i) => {
            let stackPos = i - topIndex
            if (stackPos < 0) stackPos += numItems
            const isTop     = i === topIndex
            const isClicked = i === clickedIndex

            const transform = hovered
              ? (spreadXforms[i] || 'translate(0,0) rotate(0deg)')
              : `translateY(${stackPos * 8}px) scale(${1 - stackPos * 0.05}) rotate(${isTop ? 0 : BASE_ROTATIONS[stackPos]}deg)`

            const zIndex = isClicked ? 200 : hovered ? 100 : isTop ? numItems : numItems - stackPos

            return (
              <div
                key={item.name}
                className={`pstack-card${isClicked ? ' pstack-card--spin' : ''}${hovered ? ' pstack-card--spread' : ''}`}
                style={{ transform, zIndex }}
                onClick={() => handleClick(i)}
              >
                <div className="pstack-img">
                  <img src={item.src} alt={item.name} loading="lazy" />
                </div>
                <div className="pstack-label">
                  <span>{item.name}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {title && (
        <div className="pstack-footer">
          <h3 className="pstack-title" style={accentColor ? { color: accentColor } : {}}>{title}</h3>
          <p className="pstack-hint">Hover to explore · click to select</p>
        </div>
      )}
    </div>
  )
}

// ── 10 Applications ──────────────────────────────────────────────────
const CBS_STACK_ITEMS = [
  { src: `${BASE}cbs/social/1.webp`,      name: 'Social Campaign'     },
  { src: `${BASE}cbs/imagery/CBS4.jpg`,  name: 'Brand Photography'   },
  { src: `${BASE}cbs/social/4.webp`,      name: 'Digital Content'     },
  { src: `${BASE}cbs/imagery/CBS6.jpg`,  name: 'Community'           },
  { src: `${BASE}cbs/social/7.webp`,      name: 'Campaign Materials'  },
]

function CSApplications() {
  return (
    <CSSection title="Applications" variant="accent">
      <PhotoStack
        items={CBS_STACK_ITEMS}
        title="Brand in the World"
        accentColor="#335CFF"
      />
    </CSSection>
  )
}

// ── 11 Outcome ───────────────────────────────────────────────────────
function CSOutcome({ cs }) {
  const outcome = cs.sections.find((s) => s.id === 'outcome')
  const paras   = outcome?.body?.split('\n\n') ?? []
  return (
    <CSSection label="09" title="Outcome">
      <div className="cs-outcome-wrap">
        <Reveal delay={0.1} className="cs-outcome-body">
          {paras.map((p, i) => <p key={i}>{p}</p>)}
        </Reveal>
        <Reveal delay={0.2} className="cs-outcome-callout">
          <CBSLogo size={44} />
          <p>"A complete strategic and creative work, built with intention, delivered without compromise."</p>
        </Reveal>
      </div>
    </CSSection>
  )
}

// ── 12 Reflection ────────────────────────────────────────────────────
function CSReflection({ cs }) {
  const sec = cs.sections.find((s) => s.id === 'reflection')
  return (
    <section className="cs-reflection">
      <div className="cs-reflection-inner">
        <Reveal delay={0.06}><span className="cs-reflection-label">07 / Reflection</span></Reveal>
        <Reveal delay={0.14}><p className="cs-reflection-body">{sec?.body}</p></Reveal>
        <Reveal delay={0.22}><div style={{ opacity: 0.25, marginTop: 32 }}><SunburstSVG size={48} color="#FFFFFF" /></div></Reveal>
      </div>
    </section>
  )
}

// ── 13 Final CTA ─────────────────────────────────────────────────────
const CTA_CONTACTS = [
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/__ka.il',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
      </svg>
    ),
  },
  {
    name: 'Upwork',
    href: 'https://www.upwork.com/freelancers/~01c78193322f89a4a7?mp_source=share',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228-1.076.008-.042c.207-1.143.849-3.06 2.839-3.06 1.492 0 2.703 1.212 2.703 2.703-.001 1.489-1.212 2.702-2.704 2.702zm0-8.14c-2.539 0-4.51 1.649-5.31 4.366-1.22-1.834-2.148-4.036-2.687-5.892H7.828v7.112c-.002 1.406-1.141 2.546-2.547 2.546-1.405 0-2.543-1.14-2.543-2.546V3.492H0v7.112c0 2.914 2.37 5.303 5.281 5.303 2.913 0 5.283-2.389 5.283-5.303v-1.19c.529 1.107 1.182 2.229 1.974 3.221l-1.673 7.873h2.797l1.213-5.71c1.063.679 2.285 1.109 3.686 1.109 3 0 5.439-2.452 5.439-5.45 0-3-2.439-5.439-5.439-5.439z"/>
      </svg>
    ),
  },
  {
    name: 'Email',
    href: 'mailto:hello@kail.studio',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="4.5" width="20" height="15" rx="2.5" />
        <path d="M3 6.5 12 13l9-6.5" />
      </svg>
    ),
  },
]

// ── CTA banner constants (mirrors PTypesBanner physics) ───────────────
const CTA_BANNER_LABEL    = 'Get in touch'
const CTA_BANNER_WORDS    = CTA_BANNER_LABEL.split(' ')
const CTA_BANNER_SEP      = '   •   '
const CTA_BANNER_REPEATS  = 12
const CTA_BANNER_PERIOD   = 820
const CTA_BANNER_PT_SPACE = 16
const CTA_BANNER_PUSH_R   = 280
const CTA_BANNER_SETTLE   = 0.09
const CTA_BANNER_EPSILON  = 0.05

const CTA_BANNER_SEGMENTS = []
for (let r = 0; r < CTA_BANNER_REPEATS; r++) {
  CTA_BANNER_WORDS.forEach((word, i) => {
    CTA_BANNER_SEGMENTS.push({
      key: `cta-${r}-${i}`,
      text: i < CTA_BANNER_WORDS.length - 1 ? `${word} ` : word,
    })
  })
  CTA_BANNER_SEGMENTS.push({ key: `cta-${r}-sep`, text: CTA_BANNER_SEP })
}

// ── CTABanner — same wave/push/drag physics as PTypesRibbon ──────────
function CTABanner() {
  const trackRef      = useRef(null)
  const svgRef        = useRef(null)
  const pathRef       = useRef(null)
  const pointsRef     = useRef([])
  const targetXRef    = useRef(null)
  const dirRef        = useRef(1)
  const rafRef        = useRef(null)
  const dragLayerRef  = useRef(null)
  const dragOffsetRef = useRef(0)
  const pushAmountRef = useRef(80)

  useEffect(() => {
    const track = trackRef.current
    const svg   = svgRef.current
    const path  = pathRef.current
    if (!track || !svg || !path) return

    const rebuild = () => {
      const rect       = track.getBoundingClientRect()
      const width      = rect.width || window.innerWidth
      const height     = rect.height || 160
      const totalWidth = width + CTA_BANNER_PERIOD * 2
      const centerY    = height / 2
      const amplitude  = 0  // straight line

      svg.setAttribute('viewBox', `${-CTA_BANNER_PERIOD} 0 ${totalWidth} ${height}`)
      svg.setAttribute('width', totalWidth)
      svg.setAttribute('height', height)
      path.setAttribute('stroke-width', height * 0.4)
      track.style.setProperty('--cta-banner-font', `${height * 0.16}px`)
      pushAmountRef.current = height * 0.08

      const points = []
      for (let x = -CTA_BANNER_PERIOD; x <= totalWidth - CTA_BANNER_PERIOD; x += CTA_BANNER_PT_SPACE) {
        points.push({ x, baseY: centerY + Math.sin((x / CTA_BANNER_PERIOD) * Math.PI * 2) * amplitude, push: 0 })
      }
      pointsRef.current = points

      let d = ''
      for (let i = 0; i < points.length; i++) {
        const p = points[i]
        d += `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${(p.baseY + p.push).toFixed(1)} `
      }
      path.setAttribute('d', d)
    }
    rebuild()

    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(rebuild)
    ro.observe(track)
    return () => ro.disconnect()
  }, [])

  useEffect(() => () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
  }, [])

  const startLoop = useCallback(() => {
    if (rafRef.current != null) return
    const tick = () => {
      const points  = pointsRef.current
      const targetX = targetXRef.current
      const dir     = dirRef.current
      const pushAmt = pushAmountRef.current
      let maxAbsPush = 0

      for (let i = 0; i < points.length; i++) {
        const p = points[i]
        let target = 0
        if (targetX != null) {
          const dist = Math.abs(p.x - targetX)
          if (dist < CTA_BANNER_PUSH_R) {
            const falloff = 0.5 * (1 + Math.cos((dist / CTA_BANNER_PUSH_R) * Math.PI))
            target = falloff * pushAmt * dir
          }
        }
        p.push += (target - p.push) * CTA_BANNER_SETTLE
        const abs = Math.abs(p.push)
        if (abs > maxAbsPush) maxAbsPush = abs
      }

      let d = ''
      for (let i = 0; i < points.length; i++) {
        const p = points[i]
        d += `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${(p.baseY + p.push).toFixed(1)} `
      }
      if (pathRef.current) pathRef.current.setAttribute('d', d)

      if (targetX != null || maxAbsPush > CTA_BANNER_EPSILON) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        rafRef.current = null
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const handleMouseMove = useCallback((e) => {
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    targetXRef.current = e.clientX - rect.left
    dirRef.current = (e.clientY - rect.top) < rect.height / 2 ? 1 : -1
    startLoop()
  }, [startLoop])

  const handleMouseLeave = useCallback(() => {
    targetXRef.current = null
    startLoop()
  }, [startLoop])

  const handlePointerDown = useCallback((e) => {
    if (e.button !== undefined && e.button !== 0) return
    const layer = dragLayerRef.current
    if (!layer) return
    const startClientX = e.clientX
    const startOffset  = dragOffsetRef.current
    layer.style.cursor = 'grabbing'
    const onMove = (ev) => {
      let next = startOffset + (ev.clientX - startClientX)
      while (next <= -CTA_BANNER_PERIOD) next += CTA_BANNER_PERIOD
      while (next >= CTA_BANNER_PERIOD)  next -= CTA_BANNER_PERIOD
      dragOffsetRef.current = next
      layer.style.transform = `translateX(${next}px)`
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      layer.style.cursor = ''
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }, [])

  return (
    <div className="cs-cta-banner-slot">
      <div
        className="cs-cta-banner-drag-layer"
        ref={dragLayerRef}
        onPointerDown={handlePointerDown}
      >
        <div
          className="cs-cta-banner-track"
          ref={trackRef}
          style={{ '--cta-period': `${CTA_BANNER_PERIOD}px` }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <svg ref={svgRef} className="cs-cta-banner-svg" preserveAspectRatio="none">
            <path ref={pathRef} id="ctaBannerWavePath" className="cs-cta-banner-ribbon" fill="none" strokeLinecap="round" />
            <text className="cs-cta-banner-text" dominantBaseline="central">
              <textPath href="#ctaBannerWavePath" startOffset="0">
                {CTA_BANNER_SEGMENTS.map((seg) => (
                  <tspan key={seg.key} className="cs-cta-banner-word">{seg.text}</tspan>
                ))}
              </textPath>
            </text>
          </svg>
        </div>
      </div>
    </div>
  )
}

function CSCTA() {
  return (
    <section className="cs-end-cta">
      {/* Background image — large, right-anchored, bottom may be clipped */}
      <div className="cs-cta-img-wrap" aria-hidden="true">
        <img src={`${BASE}footer/getintouch.webp`} alt="" className="cs-cta-img cs-cta-img--desktop" />
      </div>
      <div className="cs-cta-img-wrap cs-cta-img-wrap--mobile" aria-hidden="true">
        <img src={`${BASE}footer/getintouch-mobile.webp`} alt="" className="cs-cta-img" />
      </div>
      {/* Foreground content: heading + links */}
      <div className="cs-cta-content">
        <Reveal delay={0.06}>
          <p className="cs-cta-eyebrow"><span style={{ fontWeight: 300, display: 'block' }}>Working on</span><span style={{ fontWeight: 400, display: 'block' }}>something similar?</span></p>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="cs-cta-links">
            {CTA_CONTACTS.map(({ name, href, icon }) => (
              <a
                key={name}
                href={href}
                target={name === 'Email' ? undefined : '_blank'}
                rel="noopener noreferrer"
                className="cs-cta-link"
              >
                <span className="cs-cta-link-icon">{icon}</span>
                <span className="cs-cta-link-label">{name}</span>
              </a>
            ))}
          </div>
        </Reveal>
      </div>
      {/* Banner pinned across the bottom */}
      <div className="cs-cta-banner-wrap" aria-hidden="true">
        <CTABanner />
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════
//  PGM BRAND PALETTE
// ═══════════════════════════════════════════════════════════════════════

const PGM = {
  slate:   '#2C365E',
  teal:    '#4F8C8C',
  orange:  '#E76235',
  ochre:   '#EBB363',
  linen:   '#F0EDE7',
}

// ── PGM Logo mark (4 figures in a circle) ───────────────────────────
function PGMLogoSVG({ size = 120, color = '#F0EDE7' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Four abstract figures forming a circle */}
      {[0,90,180,270].map((deg, i) => {
        const rad = (deg * Math.PI) / 180
        const cx  = 60 + 28 * Math.sin(rad)
        const cy  = 60 - 28 * Math.cos(rad)
        return (
          <g key={i} transform={`rotate(${deg}, 60, 60)`}>
            {/* Head */}
            <circle cx={60} cy={24} r={7} fill={color} opacity={0.9} />
            {/* Body arc reaching toward center */}
            <path
              d={`M ${60} ${31} Q ${60} ${50} ${60 - 10} ${54}`}
              stroke={color} strokeWidth={4} strokeLinecap="round" fill="none"
            />
            {/* Arm reaching to neighbour */}
            <path
              d={`M ${60 - 10} ${54} Q ${44} ${60} ${50} ${68}`}
              stroke={color} strokeWidth={3.5} strokeLinecap="round" fill="none" opacity={0.7}
            />
          </g>
        )
      })}
      {/* Central connection ring */}
      <circle cx={60} cy={60} r={8} fill={color} opacity={0.3} />
      <circle cx={60} cy={60} r={4} fill={color} opacity={0.7} />
    </svg>
  )
}


// PGM Logo — real image with SVG fallback
function PGMLogoImg({ size = 120 }) {
  const base = import.meta.env.BASE_URL
  return (
    <img
      src={`${base}pgm/pgm-logo.webp`}
      alt="PGM logo"
      width={size}
      height={size}
      style={{ objectFit: 'contain', display: 'block' }}
      onError={(e) => { e.currentTarget.style.display = 'none' }}
    />
  )
}

// ── PGM 01 Hero ──────────────────────────────────────────────────────
function PGMHero({ cs, slide }) {
  return (
    <CSSection variant="dark" className="cs-hero pgm-hero">
      <Reveal delay={0.04}>
        <div className="cs-hero-pills">
          {(slide.tags || []).map((t) => (
            <span key={t} className="cs-hero-pill pgm-pill">{t}</span>
          ))}
        </div>
      </Reveal>
      <Reveal delay={0.1}>
        <h1 className="cs-hero-title pgm-hero-title">Participatory<br />Grantmaking<br />Community</h1>
        <p className="cs-hero-subtitle">{cs.subtitle}</p>
      </Reveal>
      <Reveal delay={0.18}>
        <div className="cs-hero-visual pgm-hero-visual">
          <div className="cs-hero-img pgm-hero-img">
            <div className="cs-hero-img-bg pgm-hero-img-bg">
              <PGMLogoImg size={200} />
              <p className="cs-ph-label" style={{ color: '#E0F87D' }}>Brand Identity System, PGM Global</p>
            </div>
          </div>
          <div className="cs-float cs-float--tl pgm-float">
            <span className="cs-float-l">Client</span><span className="cs-float-v">PGM Global</span>
          </div>
          <div className="cs-float cs-float--tr pgm-float">
            <span className="cs-float-l">Year</span><span className="cs-float-v">{cs.year}</span>
          </div>
          <div className="cs-float cs-float--bl pgm-float">
            <span className="cs-float-l">Duration</span><span className="cs-float-v">{cs.duration}</span>
          </div>
          <div className="cs-float cs-float--br pgm-float">
            <span className="cs-float-l">Reach</span><span className="cs-float-v">Global</span>
          </div>
        </div>
      </Reveal>
      <Reveal delay={0.28}>
        <div className="cs-hero-status">
          <span className="cs-status-dot pgm-status-dot" />
          <span className="cs-status-text">{cs.status}</span>
        </div>
      </Reveal>
    </CSSection>
  )
}

// ── PGM 02 Bento Overview ────────────────────────────────────────────
function PGMOverview({ cs }) {
  const overview = cs.sections.find((s) => s.id === 'overview')
  const body = overview?.body?.split('\n\n') ?? []
  return (
    <CSSection label="01" title="Project Overview">
      <div className="cs-bento pgm-bento">
        <Reveal delay={0.08} className="cs-bc cs-bc--wide pgm-bc--slate">
          <span className="cs-bc-eye" style={{ color: '#E0F87D' }}>Overview</span>
          <p className="cs-bc-body cs-bc-body--light">{body[0]}</p>
          <div className="cs-bc-tag" style={{ background: 'rgba(212,199,255,0.20)', color: '#D4C7FF' }}>
            Community-centred · Power-shifting · Global
          </div>
        </Reveal>
      </div>
    </CSSection>
  )
}

// ── PGM 03 The Brief ─────────────────────────────────────────────────
const PGM_BRIEF_CARDS = [
  { icon: '◎', title: 'The Challenge',  body: 'Build a brand that serves grassroots activists, experienced funders, and complete newcomers: simultaneously, credibly.' },
  { icon: '⌘', title: 'User Needs',     body: 'Warmth and solidarity for community leaders. Rigour and peer respect for philanthropy professionals. Clarity for newcomers.' },
  { icon: '✦', title: 'Business Goals', body: 'Six structured phases. A complete visual system. Deployable across every touchpoint: social, reports, presentations, events.' },
  { icon: '◈', title: 'Success',        body: 'A brand that practises what PGM preaches: participatory in spirit, clear without jargon, warm without sentimentality.' },
]

function PGMBrief({ cs }) {
  const brief = cs.sections.find((s) => s.id === 'brief')
  const lead  = brief?.body?.split('\n\n')[0] ?? ''
  return (
    <CSSection label="02" title="The Brief" variant="accent">
      <Reveal delay={0.06}><p className="cs-lead">{lead}</p></Reveal>
      <div className="cs-brief-grid">
        {PGM_BRIEF_CARDS.map(({ icon, title, body }, i) => (
          <Reveal key={title} delay={0.1 + i * 0.07} className="cs-brief-card pgm-brief-card">
            <span className="cs-brief-icon" style={{ color: '#335CFF' }}>{icon}</span>
            <h4 className="cs-brief-title">{title}</h4>
            <p className="cs-brief-body">{body}</p>
          </Reveal>
        ))}
      </div>
    </CSSection>
  )
}

// ── PGM Our Process ──────────────────────────────────────────────────
const PGM_PHASES = [
  {
    n: '01', name: 'Brand Discovery & Direction',
    desc: 'Review of existing materials, competitor research, and moodboard directions.',
    deliverable: 'Brand overview draft · Visual direction moodboard · Project roadmap',
  },
  {
    n: '02', name: 'Logo Refinement, Colour & Type',
    desc: 'Logo concept exploration, colour and typography pairings, scalability testing.',
    deliverable: 'Refined primary logo · Logo guidelines · Colour & Typography system',
  },
  {
    n: '03', name: 'Colour & Typography Systems',
    desc: 'Full palette development across HEX, RGB, CMYK and Pantone. Typeface hierarchy finalised.',
    deliverable: 'Completed colour palette · Typography section · Updated sample layouts',
  },
  {
    n: '04', name: 'Imagery, Graphics & Iconography',
    desc: 'Photography style guidelines, graphic shapes, icon system and cohesion mockups.',
    deliverable: 'Imagery style guide · Iconography section · Sample applications',
  },
  {
    n: '05', name: 'Voice, Messaging & Applications',
    desc: 'Tone of voice, messaging pillars, sample copy, and brand application templates.',
    deliverable: 'Voice & Messaging section · Brand Applications section · Final templates',
  },
  {
    n: '06', name: 'Final Guidelines & Handover',
    desc: 'Full document assembly, proofing, consistency checks and asset export.',
    deliverable: 'Brand guidelines PDF · Editable source files · Asset library · Implementation notes',
  },
]

function PGMProcess() {
  return (
    <CSSection title="Our Process" variant="light">
      <div className="cs-timeline pgm-timeline">
        {PGM_PHASES.map(({ n, name, desc, deliverable }, i) => (
          <Reveal key={n} delay={0.06 + i * 0.08} className="cs-tl-item pgm-tl-item">
            <div className="cs-tl-dot pgm-tl-dot" style={{ borderColor: 'rgba(51,92,255,0.33)' }}>
              <span style={{ color: '#335CFF' }}>{n}</span>
            </div>
            <div className="cs-tl-body">
              <h4 className="cs-tl-name pgm-tl-name" style={{ color: '#333333' }}>{name}</h4>
              <p className="cs-tl-desc" style={{ color: 'rgba(51,51,51,0.67)' }}>{desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </CSSection>
  )
}

// ── PGM 04 Research & Strategy ───────────────────────────────────────
const PGM_TRAITS = [
  { label: 'Conversational', sub: 'not corporate'       },
  { label: 'Warm',           sub: 'not institutional'   },
  { label: 'Clear',          sub: 'not academic'        },
  { label: 'Encouraging',    sub: 'not prescriptive'    },
  { label: 'Grounded',       sub: 'in joy & possibility'},
]

function PGMStrategy({ cs }) {
  const strategy = cs.sections.find((s) => s.id === 'strategy')
  const paras    = strategy?.body?.split('\n\n') ?? []
  return (
    <CSSection label="03" title="Research & Strategy" variant="dark">
      <div className="pgm-strategy-grid">
        <div className="pgm-strat-main">
          {paras.map((p, i) => (
            <Reveal key={i} delay={0.06 + i * 0.1}>
              <p className="cs-lead cs-lead--sm pgm-strat-para">{p}</p>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.2} className="pgm-strat-side">
          <span className="cs-strat-label" style={{ color: '#E0F87D' }}>Brand Personality</span>
          <div className="pgm-traits">
            {PGM_TRAITS.map(({ label, sub }) => (
              <div key={label} className="pgm-trait">
                <span className="pgm-trait-main" style={{ color: '#FFFFFF' }}>{label}</span>
                <span className="pgm-trait-sub">{sub}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
      <Reveal delay={0.32}>
        <div className="pgm-audience-tiers">
          {[
            { audience: 'Community Leaders',         tone: 'Affirming · Solidarity-driven', color: '#335CFF' },
            { audience: 'Philanthropy Professionals', tone: 'Practical · Peer-to-peer',      color: '#D4C7FF' },
            { audience: 'Industry Newcomers',         tone: 'Clear · Encouraging',           color: '#E0F87D' },
          ].map(({ audience, tone, color }) => (
            <div key={audience} className="pgm-tier" style={{ borderLeftColor: color }}>
              <span className="pgm-tier-label" style={{ color }}>{audience}</span>
              <span className="pgm-tier-tone">{tone}</span>
            </div>
          ))}
        </div>
      </Reveal>
    </CSSection>
  )
}

// ── PGM 05 Visual Identity ───────────────────────────────────────────
function PGMVisualIdentity({ cs }) {
  const visual = cs.sections.find((s) => s.id === 'visual')
  const subs   = visual?.subsections ?? []

  const palette = [
    { hex: PGM.slate,  name: 'Midnight Slate', usage: 'Primary anchor: depth, authority'    },
    { hex: PGM.teal,   name: 'Muted Teal',     usage: 'Calm, connection, secondary voice'   },
    { hex: PGM.orange, name: 'Burnt Orange',   usage: 'Energy, joy, urgency'                },
    { hex: PGM.ochre,  name: 'Golden Ochre',   usage: 'Warmth, optimism, celebration'       },
    { hex: PGM.linen,  name: 'Linen White',    usage: 'Open ground, breathing room'         },
  ]

  return (
    <CSSection title="Visual Identity" variant="dark">
      {/* Logo showcase */}
      <Reveal delay={0.06} className="cs-logo-showcase pgm-logo-showcase">
        <div className="pgm-logo-ring">
          <PGMLogoImg size={260} />
        </div>
        <div className="cs-logo-desc">
          <h4 className="cs-vi-sub" style={{ color: '#E0F87D' }}>The Logo</h4>
          <p className="cs-vi-body" style={{ color: 'rgba(255,255,255,0.80)' }}>{subs[0]?.body}</p>
          <div className="cs-logo-specs">
            {['4 abstract figures', 'Continuous circle', 'Equal balance', 'Community at centre'].map((s) => (
              <span key={s} className="cs-logo-spec" style={{ borderColor: 'rgba(212,199,255,0.27)', color: 'rgba(255,255,255,0.67)' }}>{s}</span>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Colour palette */}
      <Reveal delay={0.14}>
        <div className="cs-vi-divider" style={{ borderColor: 'rgba(240,237,231,0.12)' }} />
        <h4 className="cs-vi-sub" style={{ color: '#E0F87D', marginBottom: 8 }}>Colour Palette</h4>
        <p className="cs-vi-body" style={{ color: 'rgba(255,255,255,0.80)', marginBottom: 28 }}>
          A warm, grounded palette balancing depth with optimism across every touchpoint.
        </p>
        <div className="cs-palette">
          {palette.map(({ hex, name, usage }, i) => (
            <Reveal key={hex} delay={0.06 + i * 0.06} className="cs-swatch-card">
              <div className="cs-swatch-colour" style={{ background: hex, border: hex === PGM.linen ? '1px solid rgba(255,255,255,0.15)' : 'none' }} />
              <div className="cs-swatch-info">
                <span className="cs-swatch-hex">{hex}</span>
                <span className="cs-swatch-name">{name}</span>
                <span className="cs-swatch-usage">{usage}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </Reveal>

      {/* Typography */}
      <Reveal delay={0.2} className="cs-type-card">
        <h4 className="cs-vi-sub" style={{ color: '#E0F87D' }}>Typography</h4>
        <div className="cs-type-rows">
          <div className="cs-type-row">
            <span className="pgm-type-demo-display" style={{ color: '#FFFFFF', fontSize: '2.8rem', lineHeight: 1 }}>Aa</span>
            <div>
              <strong style={{ color: '#FFFFFF' }}>Cal Sans Regular</strong>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>Display: warmth, humanity, contemporary feel</p>
            </div>
          </div>
          <div className="cs-type-row">
            <span className="pgm-type-demo-body" style={{ color: '#FFFFFF', fontSize: '2.4rem', lineHeight: 1, fontWeight: 400 }}>Aa</span>
            <div>
              <strong style={{ color: '#FFFFFF' }}>Darker Grotesque</strong>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>Body: clarity, legibility across all reading levels</p>
            </div>
          </div>
        </div>
        <p className="cs-type-sample" style={{ color: 'rgba(255,255,255,0.33)' }}>
          "Shifting power in philanthropy by centring community knowledge."
        </p>
      </Reveal>
    </CSSection>
  )
}

// PGMGallery replaced by shared IllustrationsSection (see below)

// ── PGM 08 Impact Stats ──────────────────────────────────────────────
const PGM_STATS = [
  { value: 6,  suffix: '',  label: 'Phases Delivered'      },
  { value: 17, suffix: '',  label: 'Guideline Pages'       },
  { value: 15, suffix: '',  label: 'Illustrations'         },
  { value: 4,  suffix: '',  label: 'Logo Variations'       },
  { value: 5,  suffix: '',  label: 'Brand Colours'         },
  { value: 4,  suffix: '',  label: 'Brand Values'          },
]

function PGMImpact() {
  return (
    <CSSection title="Outcome">
      <div className="cs-impact-grid pgm-impact-grid">
        {PGM_STATS.map(({ value, suffix, label }, i) => (
          <Reveal key={label} delay={0.08 + i * 0.1} className="cs-impact-card pgm-impact-card">
            <span className="cs-impact-num">
              <Counter to={value} suffix={suffix} />
            </span>
            <span className="cs-impact-label" style={{ color: '#D4C7FF' }}>{label}</span>
          </Reveal>
        ))}
      </div>
    </CSSection>
  )
}

// ── PGM 09 Brand Guidelines — real PDF flipbook ──────────────────────
function PGMFlipbook() {
  const base   = import.meta.env.BASE_URL
  const pdfUrl = `${base}guidelines/pgm-guidelines.pdf`
  return (
    <div className="cs-flipbook-wrap">
      <PDFFlipbook
        pdfUrl={pdfUrl}
        accentColor="#335CFF"
        totalHint={17}
      />
    </div>
  )
}

// ── PGM 10 Applications ──────────────────────────────────────────────
const PGM_STACK_ITEMS = [
  { src: `${BASE}pgm/applications/mug.webp`,              name: 'Brand Merchandise'   },
  { src: `${BASE}pgm/applications/tote.webp`,             name: 'Brand Collateral'    },
  { src: `${BASE}pgm/illustrations/Illustration2.webp`,  name: 'Illustration System' },
  { src: `${BASE}pgm/illustrations/Illustration5.webp`,  name: 'Campaign Graphics'   },
  { src: `${BASE}pgm/illustrations/Illustration8.webp`,  name: 'Custom Icons'        },
]

function PGMApplications() {
  return (
    <CSSection title="Applications" variant="accent">
      <PhotoStack
        items={PGM_STACK_ITEMS}
        title="Brand in the World"
        accentColor="#335CFF"
      />
    </CSSection>
  )
}

// ── PGM 11 Outcome ───────────────────────────────────────────────────
function PGMOutcome({ cs }) {
  const outcome = cs.sections.find((s) => s.id === 'outcome')
  const paras   = outcome?.body?.split('\n\n') ?? []
  return (
    <CSSection label="10" title="Outcome">
      <div className="cs-outcome-wrap pgm-outcome-wrap">
        <Reveal delay={0.1} className="cs-outcome-body">
          {paras.map((p, i) => <p key={i}>{p}</p>)}
        </Reveal>
        <Reveal delay={0.2} className="cs-outcome-callout pgm-outcome-callout">
          <PGMLogoImg size={44} />
          <p style={{ color: '#333333' }}>
            "A brand that practises what PGM preaches: speaking with communities, not about them."
          </p>
        </Reveal>
      </div>
    </CSSection>
  )
}

// ── PGM 12 Reflection ────────────────────────────────────────────────
function PGMReflection({ cs }) {
  const sec   = cs.sections.find((s) => s.id === 'reflection')
  const paras = sec?.body?.split('\n\n') ?? []
  return (
    <section className="cs-reflection pgm-reflection">
      <div className="cs-reflection-inner">
        <Reveal delay={0.06}>
          <span className="cs-reflection-label" style={{ color: '#E0F87D' }}>07 / Reflection</span>
        </Reveal>
        {paras.map((p, i) => (
          <Reveal key={i} delay={0.14 + i * 0.1}>
            <p className="cs-reflection-body" style={{ color: '#FFFFFF' }}>{p}</p>
          </Reveal>
        ))}
        <Reveal delay={0.36}>
          <div style={{ opacity: 0.25, marginTop: 32 }}>
            <PGMLogoSVG size={48} color="#FFFFFF" />
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════
//  PACKAGING CASE STUDIES — generic component system
// ═══════════════════════════════════════════════════════════════════════

// ── Shared icon SVGs ──────────────────────────────────────────────────
const BehanceSVG = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="currentColor">
    <path d="M8.5 10.5C9.6 10.5 10.5 9.6 10.5 8.5S9.6 6.5 8.5 6.5H4v8h4.8c1.25 0 2.2-.95 2.2-2.2 0-1-.63-1.6-1.5-1.75-.31-.04-.65-.05-1-.05zM5.5 8H8c.83 0 1.5.67 1.5 1.5S8.83 11 8 11H5.5V8zm3 5H5.5v-1H8.5c.55 0 1 .45 1 1s-.45 1-1 1zM15.5 9.5c-1.5 0-3 1-3 2.5h6c0-1.5-1.5-2.5-3-2.5zm-2.5 4c.3.8 1.3 1 2 1s1.8-.3 2.1-1h1.5c-.5 1.5-1.6 2.5-3.3 2.5-1.9 0-3.5-1.5-3.5-3.5S13 9 15 9c2.2 0 3.5 1.5 3.5 3.5v1h-5.5zM13.5 6h4v1h-4V6z"/>
  </svg>
)
const DribbbleSVG = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.6"/>
    <path d="M3.5 9c2.3 0 5-1 7-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M18.5 9c-2 .5-4.5 2.5-5.5 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M7 18c1.5-3 4-6 11-6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
)
const GlobeSVG = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.6"/>
    <ellipse cx="11" cy="11" rx="3.5" ry="8" stroke="currentColor" strokeWidth="1.4"/>
    <line x1="3" y1="11" x2="19" y2="11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <line x1="4" y1="7.5" x2="18" y2="7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="4" y1="14.5" x2="18" y2="14.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)
const AmazonSVG = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="currentColor">
    <path d="M4.5 14.5C8 17 14 17 17.5 14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <path d="M16 15.5l2-1-1 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <text x="4" y="12" fontSize="7" fontWeight="700" fontFamily="sans-serif" fill="currentColor">amazon</text>
  </svg>
)
const VimeoSVG = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197c1.185-1.044 2.351-2.084 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.48 4.807z"/>
  </svg>
)

// ── Generic Pkg components ────────────────────────────────────────────

function PkgHero({ cs, slide, cfg, heroContent }) {
  const { accent, dark, heroSrc, heroLabel } = cfg
  const visual = heroContent ?? (heroSrc ? <img src={heroSrc} alt={heroLabel ?? slide.label} className="pkg-hero-img" /> : null)
  return (
    <CSSection className="pkg-hero">
      <Reveal delay={0.04}>
        <div className="cs-hero-pills">
          {(slide.tags || []).map((t) => (
            <span key={t} className="cs-hero-pill" style={{ background: 'rgba(51,92,255,0.10)', color: '#335CFF', borderColor: 'rgba(51,92,255,0.35)' }}>{t}</span>
          ))}
        </div>
      </Reveal>
      <Reveal delay={0.1}>
        <h1 className="cs-hero-title" style={{ color: dark }}>{slide.label}</h1>
        <p className="cs-hero-subtitle" style={{ color: dark + '88' }}>{cs.subtitle}</p>
      </Reveal>
      {visual && (
        <Reveal delay={0.18}>
          <div className="pkg-hero-visual">
            {visual}
          </div>
        </Reveal>
      )}
      <Reveal delay={0.28}>
        <div className="cs-hero-status">
          <span className="cs-status-dot" style={{ background: accent }} />
          <span className="cs-status-text" style={{ color: dark + 'aa' }}>{cs.status}</span>
        </div>
      </Reveal>
    </CSSection>
  )
}

function PkgOverview({ cs, cfg }) {
  const { accent, dark, specs } = cfg
  const overview = cs.sections.find((s) => s.id === 'overview')
  const paras    = overview?.body?.split('\n\n') ?? []
  return (
    <CSSection title="Project Overview">
      <div className="pkg-overview-grid">
        <Reveal delay={0.08} className="pkg-overview-text">
          {paras.map((p, i) => <p key={i} style={{ color: dark + 'bb', lineHeight: 1.85, marginBottom: 14 }}>{p}</p>)}
        </Reveal>
        <Reveal delay={0.16} className="pkg-spec-stack" style={{ '--pkg-accent': accent }}>
          {specs.map(({ label, value }) => (
            <div key={label} className="pkg-spec-row">
              <span className="pkg-spec-label">{label}</span>
              <span className="pkg-spec-value" style={{ color: dark }}>{value}</span>
            </div>
          ))}
        </Reveal>
      </div>
    </CSSection>
  )
}

function PkgGallery({ cfg }) {
  const { images, galleryLayout = 'two-then-one' } = cfg
  const [a, b, c] = images
  return (
    <CSSection title="The Work">
      <Reveal delay={0.06} className="pkg-gallery">
        {galleryLayout === 'two-then-one' ? (
          <>
            <div className="pkg-gallery-row">
              <div className="pkg-gallery-item pkg-gallery-item--half"><img src={a.src} alt={a.alt} /></div>
              <div className="pkg-gallery-item pkg-gallery-item--half"><img src={b.src} alt={b.alt} /></div>
            </div>
            {c && <div className="pkg-gallery-item pkg-gallery-item--full"><img src={c.src} alt={c.alt} /></div>}
          </>
        ) : galleryLayout === 'one-then-two' ? (
          <>
            <div className="pkg-gallery-item pkg-gallery-item--full"><img src={a.src} alt={a.alt} /></div>
            <div className="pkg-gallery-row">
              {b && <div className="pkg-gallery-item pkg-gallery-item--half"><img src={b.src} alt={b.alt} /></div>}
              {c && <div className="pkg-gallery-item pkg-gallery-item--half"><img src={c.src} alt={c.alt} /></div>}
            </div>
          </>
        ) : (
          // three equal
          <div className="pkg-gallery-row pkg-gallery-row--three">
            {images.map((img) => <div key={img.src} className="pkg-gallery-item pkg-gallery-item--third"><img src={img.src} alt={img.alt} /></div>)}
          </div>
        )}
      </Reveal>
    </CSSection>
  )
}

function PkgHighlights({ cfg }) {
  const { highlights, highlightsTitle, highlightsBody } = cfg
  if (!highlights?.length) return null
  return (
    <CSSection title={highlightsTitle ?? 'Details'} variant="dark">
      {highlightsBody && (
        <Reveal delay={0.06}>
          <p className="cs-vi-body" style={{ color: 'rgba(255,255,255,0.65)', marginBottom: 24 }}>{highlightsBody}</p>
        </Reveal>
      )}
      <div className="pkg-highlights">
        {highlights.map(({ name, sub, color }, i) => (
          <Reveal key={name} delay={0.06 + i * 0.05} className="pkg-hl-card">
            {color && <div className="pkg-hl-swatch" style={{ background: color }} />}
            <div className="pkg-hl-info">
              <span className="pkg-hl-name">{name}</span>
              {sub && <span className="pkg-hl-sub">{sub}</span>}
            </div>
          </Reveal>
        ))}
      </div>
    </CSSection>
  )
}

function PkgImpact({ cfg }) {
  const { stats } = cfg
  return (
    <CSSection title="At a Glance" variant="dark">
      <div className="pkg-stats">
        {stats.map(({ value, label }, i) => (
          <Reveal key={label} delay={0.06 + i * 0.08} className="pkg-stat">
            <span className="pkg-stat-value" style={{ color: '#E0F87D' }}>{value}</span>
            <span className="pkg-stat-label" style={{ color: 'rgba(255,255,255,0.55)' }}>{label}</span>
          </Reveal>
        ))}
      </div>
    </CSSection>
  )
}

function PkgLinks({ cs, cfg }) {
  const { linksBody } = cfg
  const links = [
    cs.behance  && { href: cs.behance,  Icon: BehanceSVG,  label: 'Behance'  },
    cs.dribbble && { href: cs.dribbble, Icon: DribbbleSVG, label: 'Dribbble' },
    cs.website  && { href: cs.website,  Icon: GlobeSVG,    label: cs.client ? `${cs.client} Website` : 'Website' },
    cs.amazon   && { href: cs.amazon,   Icon: AmazonSVG,   label: 'View on Amazon' },
    cs.article  && { href: cs.article,  Icon: GlobeSVG,    label: 'Read Article' },
    cs.vimeo    && { href: cs.vimeo,    Icon: VimeoSVG,    label: 'Watch on Vimeo' },
  ].filter(Boolean)
  if (!links.length) return null
  return (
    <CSSection title="View the Project" variant="dark">
      {linksBody && (
        <Reveal delay={0.06}>
          <p className="cs-vi-body" style={{ color: 'rgba(255,255,255,0.65)', marginBottom: 28 }}>{linksBody}</p>
        </Reveal>
      )}
      <Reveal delay={0.12} className="pkg-links">
        {links.map(({ href, Icon, label }) => (
          <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="pkg-link-btn">
            <span className="pkg-link-icon"><Icon /></span>
            <span className="pkg-link-label">{label}</span>
            <span className="pkg-link-arrow">↗</span>
          </a>
        ))}
      </Reveal>
    </CSSection>
  )
}

// ── Per-project configs ───────────────────────────────────────────────

const WOODCO_CFG = {
  accent: '#335CFF', dark: '#333333', light: '#FFFFFF',
  heroSrc: `${BASE}woodco/woodco3.webp`,
  heroLabel: 'WOODCO candle packaging, all 6 labels',
  images: [
    { src: `${BASE}woodco/woodco1.webp`, alt: 'Spiced Citrus, Spring Rain and Wild Garden lifestyle shot' },
    { src: `${BASE}woodco/woodco2.webp`, alt: 'Nightlight, Negroni and Waves lifestyle shot' },
    { src: `${BASE}woodco/woodco3.webp`, alt: 'All 6 WOODCO candle labels flat lay' },
  ],
  galleryLayout: 'two-then-one',
  specs: [
    { label: 'Client',    value: 'WOODCO' },
    { label: 'Sector',    value: 'Lifestyle / Home' },
    { label: 'Location',  value: 'Hong Kong' },
    { label: 'Timeline',  value: 'May 2021' },
    { label: 'Duration',  value: '2 Weeks' },
    { label: 'Revisions', value: '4 Rounds' },
  ],
  highlights: [
    { name: 'Spiced Citrus', sub: 'Sandalwood · Ginger Flower · Grapefruit', color: '#335CFF' },
    { name: 'Spring Rain',   sub: 'Matcha · Guava · Rain',                   color: '#D4C7FF' },
    { name: 'Wild Garden',   sub: 'Patchouli · Cypress · Yellow Rose',       color: '#E0F87D' },
    { name: 'Nightlight',    sub: 'Cedar · Fig · Ylang Ylang',               color: '#333333' },
    { name: 'Negroni',       sub: 'Ispahan Wood · Cinnamon · Orange',        color: '#335CFF' },
    { name: 'Waves',         sub: 'Sea Salt · Ocean · Coconut',              color: '#D4C7FF' },
  ],
  highlightsTitle: 'The Collection',
  highlightsBody: 'Six fragrance blends, each with its own visual identity built from the same abstract shape language and contrasting colour palette.',
  stats: [
    { value: 6,  label: 'Scent Labels'    },
    { value: 2,  label: 'Weeks Timeline'  },
    { value: 4,  label: 'Revision Rounds' },
  ],
  linksBody: 'See the full project on Behance and Dribbble, or visit WOODCO\'s website.',
}

const LTR_CFG = {
  accent: '#335CFF', dark: '#333333', light: '#FFFFFF',
  heroSrc: `${BASE}la-terra-rossa/laterrarossa3.webp`,
  heroLabel: 'La Terra Rossa coffee packaging spread',
  images: [
    { src: `${BASE}la-terra-rossa/laterrarossa1.webp`, alt: 'La Terra Rossa Farewell Blend bags, mountain illustration' },
    { src: `${BASE}la-terra-rossa/laterrarossa2.webp`, alt: 'La Terra Rossa Farewell Blend bags, abstract illustration' },
    { src: `${BASE}la-terra-rossa/laterrarossa3.webp`, alt: 'La Terra Rossa full packaging spread' },
  ],
  galleryLayout: 'two-then-one',
  specs: [
    { label: 'Client',    value: 'La Terra Rossa' },
    { label: 'Sector',    value: 'Food & Beverage' },
    { label: 'Location',  value: 'Portland, Oregon' },
    { label: 'Includes',  value: 'Logo Redesign + Packaging' },
    { label: 'Duration',  value: '1 Week' },
    { label: 'Product',   value: 'Coffee Bags' },
  ],
  stats: [
    { value: 2,  label: 'Packaging Designs'  },
    { value: 1,  label: 'Logo Illustration'  },
    { value: 1,  label: 'Week Delivered'     },
  ],
  linksBody: 'Visit the La Terra Rossa website.',
}

const OC_CFG = {
  accent: '#335CFF', dark: '#333333', light: '#FFFFFF',
  heroSrc: `${BASE}oracle-cards/oracle1.webp`,
  heroLabel: 'Self Awakening Oracle Cards, card samples',
  images: [
    { src: `${BASE}oracle-cards/oracle1.webp`, alt: 'Oracle cards: Protection, Truthfulness, Acceptance, Healing' },
    { src: `${BASE}oracle-cards/oracle2.webp`, alt: 'Oracle cards: Perseverance, Balance, Resilience, Sorrow' },
    { src: `${BASE}oracle-cards/oracle3.webp`, alt: 'Oracle cards: Self-Awakening, Judgement, Frustration, Rituals' },
  ],
  galleryLayout: 'one-then-two',
  specs: [
    { label: 'Client',    value: 'Annalisa Brizzante' },
    { label: 'Sector',    value: 'Publishing / Wellness' },
    { label: 'Format',    value: 'Book Illustrations' },
    { label: 'Cards',     value: '41 Unique Illustrations' },
    { label: 'Duration',  value: '2 Months' },
    { label: 'Style',     value: 'Mixed Media' },
  ],
  stats: [
    { value: 41, label: 'Unique Illustrations'    },
    { value: 2,  label: 'Months of Work'         },
    { value: 1,  label: 'Published Book'         },
    { value: 4,  label: 'Illustration Styles'    },
  ],
  linksBody: 'Find the book on Amazon.',
}

const SB_CFG = {
  accent: '#335CFF', dark: '#333333', light: '#FFFFFF',
  heroSrc: `${BASE}signature-balm/southshorn1.webp`,
  heroLabel: 'Signature Balm piercing care tin packaging',
  images: [
    { src: `${BASE}signature-balm/southshorn1.webp`, alt: 'Signature Balm single tin, angled view' },
    { src: `${BASE}signature-balm/southshorn2.webp`, alt: 'Signature Balm, multiple tins' },
    { src: `${BASE}signature-balm/southshorn3.webp`, alt: 'Signature Balm tin, top view' },
  ],
  galleryLayout: 'one-then-two',
  specs: [
    { label: 'Client',    value: 'SouthShore Adornments' },
    { label: 'Sector',    value: 'Wellness / Body Jewellery' },
    { label: 'Location',  value: 'United Kingdom' },
    { label: 'Product',   value: 'Signature Balm 20ml' },
    { label: 'Duration',  value: '2 Weeks' },
    { label: 'Format',    value: 'Tin Packaging' },
  ],
  stats: [
    { value: 1,  label: 'Tin Packaging Design' },
    { value: 2,  label: 'Weeks Delivered'      },
    { value: 1,  label: 'Pattern System'       },
    { value: 1,  label: 'Happy Client'         },
  ],
  linksBody: 'Visit SouthShore Adornments to see the product.',
}

const SPURGEONS_CFG = {
  accent: '#335CFF', dark: '#333333', light: '#FFFFFF',
  heroSrc: null,
  specs: [
    { label: 'Client',    value: 'Spurgeons' },
    { label: 'Sector',    value: 'Charity / Children' },
    { label: 'Location',  value: 'United Kingdom' },
    { label: 'Videos',    value: '5 Explainer Videos' },
    { label: 'Duration',  value: '4 Months' },
    { label: 'Campaign',  value: 'ED Awareness Week' },
  ],
  stats: [
    { value: 5,    label: 'Explainer Videos'  },
    { value: 60,   label: 'Illustrations Made' },
    { value: 4,    label: 'Month Timeline'     },
    { value: '2-3', label: 'Min per Video'     },
  ],
  linksBody: 'Read the full article on the Spurgeons website or watch the videos on their Vimeo channel.',
}

// ── Per-project case study views ──────────────────────────────────────

const SPURGEONS_MEDIA = {
  previews: [1, 2, 3].map(n => `${BASE}spurgeons-ed/spurgeons${n}.webm`),
}

function SpurgeonsEDCaseStudyView({ cat, cs, slide }) {
  const { previews } = SPURGEONS_MEDIA
  return (
    <div className="cs-wrap pkg-case-study">
      <PkgHero
        cs={cs}
        slide={slide}
        cfg={SPURGEONS_CFG}
        heroContent={<VimeoEmbed videoId="800539377" title="Spurgeons ED Awareness" />}
      />

      <CSSection title="Snapshots" variant="dark">
        <div className="wl-grid-3">
          <Reveal delay={0.06}><WLMedia src={previews[0]} alt="Spurgeons preview 1" /></Reveal>
          <Reveal delay={0.12}><WLMedia src={previews[1]} alt="Spurgeons preview 2" /></Reveal>
          <Reveal delay={0.18}><WLMedia src={previews[2]} alt="Spurgeons preview 3" /></Reveal>
        </div>
      </CSSection>

      <PkgOverview cs={cs} cfg={SPURGEONS_CFG} />
      <PkgImpact cfg={SPURGEONS_CFG} />
      <PkgLinks cs={cs} cfg={SPURGEONS_CFG} />
      <CSCTA cat={cat} />
    </div>
  )
}

function WoodcoCaseStudyView({ cat, cs, slide }) {
  return (
    <div className="cs-wrap pkg-case-study">
      <PkgHero cs={cs} slide={slide} cfg={WOODCO_CFG} />
      <PkgOverview cs={cs} cfg={WOODCO_CFG} />
      <PkgGallery cfg={WOODCO_CFG} />
      <PkgHighlights cfg={WOODCO_CFG} />
      <PkgImpact cfg={WOODCO_CFG} />
      <PkgLinks cs={cs} cfg={WOODCO_CFG} />
      <CSCTA cat={cat} />
    </div>
  )
}

function LTRCaseStudyView({ cat, cs, slide }) {
  return (
    <div className="cs-wrap pkg-case-study">
      <PkgHero cs={cs} slide={slide} cfg={LTR_CFG} />
      <PkgOverview cs={cs} cfg={LTR_CFG} />
      <PkgGallery cfg={LTR_CFG} />
      <PkgImpact cfg={LTR_CFG} />
      <PkgLinks cs={cs} cfg={LTR_CFG} />
      <CSCTA cat={cat} />
    </div>
  )
}

function OCCaseStudyView({ cat, cs, slide }) {
  return (
    <div className="cs-wrap pkg-case-study">
      <PkgHero cs={cs} slide={slide} cfg={OC_CFG} />
      <PkgOverview cs={cs} cfg={OC_CFG} />
      <PkgGallery cfg={OC_CFG} />
      <PkgImpact cfg={OC_CFG} />
      <PkgLinks cs={cs} cfg={OC_CFG} />
      <CSCTA cat={cat} />
    </div>
  )
}

function SBCaseStudyView({ cat, cs, slide }) {
  return (
    <div className="cs-wrap pkg-case-study">
      <PkgHero cs={cs} slide={slide} cfg={SB_CFG} />
      <PkgOverview cs={cs} cfg={SB_CFG} />
      <PkgGallery cfg={SB_CFG} />
      <PkgLinks cs={cs} cfg={SB_CFG} />
      <CSCTA cat={cat} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
//  MOTION CASE STUDIES
// ═══════════════════════════════════════════════════════════════════════

// ── YouTube embed ─────────────────────────────────────────────────────
function YouTubeEmbed({ videoId, title }) {
  if (!videoId || videoId === 'placeholder') {
    return (
      <div className="yt-placeholder">
        <div className="yt-placeholder-inner">
          <span className="yt-placeholder-play">▶</span>
          <p className="yt-placeholder-text">Video coming soon, check back shortly.</p>
        </div>
      </div>
    )
  }
  return (
    <div className="yt-embed-wrap">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
        title={title || 'Project video'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}

function VimeoEmbed({ videoId, title }) {
  return (
    <div className="yt-embed-wrap yt-embed-wrap--vimeo">
      <iframe
        src={`https://player.vimeo.com/video/${videoId}?badge=0&autopause=0&player_id=0&app_id=58479`}
        title={title || 'Project video'}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}

// ── Generic motion components ─────────────────────────────────────────

function MotionHero({ cs, slide, cfg }) {
  const { accent, lightAccent, dark } = cfg
  const la = lightAccent ?? accent
  return (
    <CSSection className="pkg-hero">
      <Reveal delay={0.04}>
        <div className="cs-hero-pills">
          {(slide.tags || []).map((t) => (
            <span key={t} className="cs-hero-pill"
              style={{ background: la + '18', color: la, borderColor: la + '44' }}>
              {t}
            </span>
          ))}
        </div>
      </Reveal>
      <Reveal delay={0.1}>
        <h1 className="cs-hero-title" style={{ color: dark }}>{slide.label}</h1>
        <p className="cs-hero-subtitle" style={{ color: dark + '88' }}>{cs.subtitle}</p>
      </Reveal>
      <Reveal delay={0.28}>
        <div className="cs-hero-status">
          <span className="cs-status-dot" style={{ background: la }} />
          <span className="cs-status-text" style={{ color: dark + 'aa' }}>{cs.status}</span>
        </div>
      </Reveal>
    </CSSection>
  )
}

function MotionVideo({ slide, cfg, title = 'The Work' }) {
  const youtube = cfg.youtube ?? slide.caseStudy?.youtube
  return (
    <CSSection title={title} variant="dark">
      <Reveal delay={0.08}>
        <YouTubeEmbed videoId={youtube} title={slide.label} />
      </Reveal>
    </CSSection>
  )
}

function MotionOverview({ cs, cfg, children }) {
  const { accent, lightAccent, dark, specs } = cfg
  const la = lightAccent ?? accent
  const overview = cs.sections?.find((s) => s.id === 'overview')
  const paras = overview?.body?.split('\n\n') ?? []
  return (
    <CSSection title="Project Overview">
      <div className="pkg-overview-grid">
        <Reveal delay={0.08} className="pkg-overview-text">
          {paras.map((p, i) => (
            <p key={i} style={{ color: dark + 'bb', lineHeight: 1.85, marginBottom: 14 }}>{p}</p>
          ))}
        </Reveal>
        {specs?.length > 0 && (
          <Reveal delay={0.16} className="pkg-spec-stack" style={{ '--pkg-accent': la }}>
            {specs.map(({ label, value }) => (
              <div key={label} className="pkg-spec-row">
                <span className="pkg-spec-label">{label}</span>
                <span className="pkg-spec-value" style={{ color: dark }}>{value}</span>
              </div>
            ))}
          </Reveal>
        )}
      </div>
      {children && <div style={{ marginTop: 24 }}>{children}</div>}
    </CSSection>
  )
}

function MotionStats({ cfg }) {
  const { stats } = cfg
  if (!stats?.length) return null
  return (
    <CSSection title="At a Glance" variant="dark">
      <div className="pkg-stats">
        {stats.map(({ value, label }, i) => (
          <Reveal key={label} delay={0.06 + i * 0.08} className="pkg-stat">
            <span className="pkg-stat-value" style={{ color: '#E0F87D' }}>{value}</span>
            <span className="pkg-stat-label" style={{ color: 'rgba(255,255,255,0.55)' }}>{label}</span>
          </Reveal>
        ))}
      </div>
    </CSSection>
  )
}

// ── Per-project configs ───────────────────────────────────────────────

const BASE_CHARS = import.meta.env.BASE_URL

const STUDIO_INTRO_CHARACTERS = [
  {
    name: 'Kiko',
    img: `${BASE_CHARS}studio-intro/kiko.jpg`,
    bio: 'A curious dreamer at the beginning of something new. Full of ideas but unsure where to begin, Kiko carries the spark and looks for guidance to shape it into something real.',
  },
  {
    name: 'Poppy',
    img: `${BASE_CHARS}studio-intro/poppy.jpg`,
    bio: 'A quiet and intuitive presence who stays close without asking for attention. Poppy senses what is missing and brings balance to every idea, adding the final touch that makes things feel complete.',
  },
  {
    name: 'Ila',
    img: `${BASE_CHARS}studio-intro/ila.jpg`,
    bio: 'Always by Ika\'s side, a small and curious wanderer who notices what others overlook. Ily explores gently and gathers details that bring depth, care, and meaning to each idea.',
  },
  {
    name: 'Doti',
    img: `${BASE_CHARS}studio-intro/doty.jpg`,
    bio: 'Doti may not always understand the plan, but their warmth and unwavering support makes them impossible not to love. Always there, nodding along and listening, cheerful and steady when it matters.',
  },
  {
    name: 'Ika',
    img: `${BASE_CHARS}studio-intro/ika.jpg`,
    bio: 'A bright spark that appears at just the right moment. Ika helps organise scattered thoughts and guides ideas into form, turning imagination into something tangible.',
  },
  {
    name: 'Bexley',
    img: `${BASE_CHARS}studio-intro/bexley.jpg`,
    bio: 'Composed, exacting, and not easily impressed. Bexley holds a high standard and expects work to be thoughtful, refined, and considered. Their approval is hard to earn, but when it comes, it truly means something.',
  },
]

const STUDIO_INTRO_PALETTE = [
  { hex: '#335CFF', name: 'Cobalt'  },
  { hex: '#FFFFFF', name: 'White'   },
  { hex: '#333333', name: 'Dark'    },
  { hex: '#E0F87D', name: 'Lime'    },
  { hex: '#D4C7FF', name: 'Lilac'   },
]

const STUDIO_INTRO_MEDIA = {
  previews: [1, 2, 3].map(n => `${BASE}studio-intro/studio-intro-preview${n}.webm`),
}

const STUDIO_INTRO_CFG = {
  accent: '#335CFF', dark: '#333333',
  youtube: '-kHVMfDEKjo',
  specs: [
    { label: 'Year',    value: '2026' },
    { label: 'Type',    value: 'Studio Rebrand' },
    { label: 'Style',   value: '3D Dimensional' },
    { label: 'Status',  value: 'In Production' },
  ],
  stats: [
    { value: '2026', label: 'Rebrand Year'    },
    { value: '3D',   label: 'Animation Style' },
    { value: 6,      label: 'Characters'      },
    { value: 4,      label: 'Weeks'           },
  ],
}

const GEOMETRIC_CFG = {
  accent: '#E0F87D', lightAccent: '#335CFF', dark: '#333333',
  youtube: 'E1lDvWBNlKM',
  specs: [
    { label: 'Year',    value: '2022' },
    { label: 'Type',    value: 'Self-Initiated' },
    { label: 'Views',   value: '45,000+' },
    { label: 'Likes',   value: '800+' },
  ],
  stats: [
    { value: '45K+',  label: 'YouTube Views' },
    { value: '800+',  label: 'Likes' },
    { value: '#1',    label: 'Top Performing' },
  ],
  palette: [
    { hex: '#1A537B', name: 'Deep Blue'   },
    { hex: '#FAE3D1', name: 'Light Cream' },
    { hex: '#FCE1D9', name: 'Pale Blush'  },
    { hex: '#F6AEA1', name: 'Soft Coral'  },
  ],
}

const GEOMETRIC_MEDIA = {
  previews: [1, 2].map(n => `${BASE}geometric/geometric${n}.gif`),
}

const STEPS_CFG = {
  accent: '#335CFF', dark: '#333333',
  youtube: 'B47H1UDrQcc',
  specs: [
    { label: 'Year',  value: '2022' },
    { label: 'Type',  value: 'Self-Initiated' },
    { label: 'Style', value: 'Experimental' },
  ],
  stats: [
    { value: '2022',  label: 'Year'       },
    { value: 3,       label: 'Characters' },
    { value: 1,       label: 'Backdrop'   },
    { value: '11K+',  label: 'Views'      },
  ],
  palette: [
    { hex: '#F2E6E1', name: 'Warm Off-White'  },
    { hex: '#F17765', name: 'Light Coral'      },
    { hex: '#D75546', name: 'Terracotta Red'   },
    { hex: '#C24519', name: 'Burnt Orange'     },
    { hex: '#483D3C', name: 'Dark Charcoal'    },
  ],
}

const STEPS_MEDIA = {
  previews: [1, 2, 3, 4].map(n => `${BASE}steps/steps-preview${n}.webm`),
  large: `${BASE}steps/steps-preview-large.webm`,
}

const ATOZ_CFG = {
  accent: '#E0F87D', lightAccent: '#335CFF', dark: '#333333',
  youtube: 'JdLVq-FHkfg',
  specs: [
    { label: 'Year',   value: '2023' },
    { label: 'Type',   value: 'Self-Initiated' },
    { label: 'Style',  value: 'Typographic Motion' },
    { label: 'Count',  value: '26 Letters' },
  ],
  stats: [
    { value: '26',   label: 'Letters Animated' },
    { value: '2023', label: 'Year' },
  ],
}

const BLOOM_CFG = {
  accent: '#D4C7FF', dark: '#333333',
  youtube: 'Yjuj-ODZfPY',
  specs: [
    { label: 'Year',  value: '2022' },
    { label: 'Type',  value: 'Self-Initiated' },
    { label: 'Style', value: 'Organic Motion' },
  ],
  stats: [
    { value: '2022',    label: 'Year' },
    { value: 'Organic', label: 'Motion Style' },
  ],
}

// ── Per-project view functions ────────────────────────────────────────

function StudioIntroCaseStudyView({ cat, cs, slide }) {
  const accent = STUDIO_INTRO_CFG.accent
  const { previews } = STUDIO_INTRO_MEDIA
  return (
    <div className="cs-wrap pkg-case-study">
      <MotionHero cs={cs} slide={slide} cfg={STUDIO_INTRO_CFG} />
      <MotionVideo slide={slide} cfg={STUDIO_INTRO_CFG} />

      {/* Preview clips — all three on one line */}
      <CSSection title="Snapshots">
        <div className="wl-grid-3">
          {previews.map((src, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <WLMedia src={src} />
            </Reveal>
          ))}
        </div>
      </CSSection>

      {/* Palette */}
      <CSSection title="Brand Palette">
        <Reveal>
          <div className="cs-palette-row">
            {STUDIO_INTRO_PALETTE.map((swatch) => (
              <div key={swatch.hex} className="cs-palette-swatch">
                <div
                  className="cs-palette-chip"
                  style={{
                    background: swatch.hex,
                    border: swatch.hex === '#FFFFFF' ? '1px solid rgba(0,0,0,0.1)' : 'none',
                  }}
                />
                <span className="cs-palette-hex">{swatch.hex}</span>
                <span className="cs-palette-name">{swatch.name}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </CSSection>

      {/* Characters */}
      <CSSection title="Meet the Characters">
        <div className="si-characters-grid">
          {STUDIO_INTRO_CHARACTERS.map((char, i) => (
            <Reveal key={char.name} delay={i * 0.06}>
              <div className="si-character-card">
                <div className="si-character-avatar">
                  {char.img
                    ? <img src={char.img} alt={char.name} className="si-character-avatar-img" draggable={false} />
                    : <span className="si-character-avatar-initial" style={{ color: accent }}>{char.name[0]}</span>
                  }
                </div>
                <h3 className="si-character-name" style={{ color: accent }}>{char.name}</h3>
                <p className="si-character-bio">{char.bio}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </CSSection>

      <MotionOverview cs={cs} cfg={STUDIO_INTRO_CFG} />
      <MotionStats cfg={STUDIO_INTRO_CFG} />
      <CSCTA cat={cat} />
    </div>
  )
}



function GeometricCaseStudyView({ cat, cs, slide }) {
  const { previews } = GEOMETRIC_MEDIA
  const { palette } = GEOMETRIC_CFG
  return (
    <div className="cs-wrap pkg-case-study">
      <MotionHero cs={cs} slide={slide} cfg={GEOMETRIC_CFG} />
      <MotionVideo slide={slide} cfg={GEOMETRIC_CFG} />
      <MotionOverview cs={cs} cfg={GEOMETRIC_CFG} />

      {/* Previews */}
      <CSSection title="Snapshots" variant="dark">
        <div className="wl-grid-2">
          <Reveal delay={0.06}><WLMedia src={previews[0]} alt="Geometric preview 1" /></Reveal>
          <Reveal delay={0.14}><WLMedia src={previews[1]} alt="Geometric preview 2" /></Reveal>
        </div>
      </CSSection>

      {/* Palette */}
      <CSSection title="The Palette">
        <div className="cs-palette-row">
          {palette.map(({ hex, name }) => (
            <div key={hex} className="cs-palette-swatch">
              <div className="cs-palette-chip" style={{ background: hex }} />
              <span className="cs-palette-hex">{hex}</span>
              <span className="cs-palette-name">{name}</span>
            </div>
          ))}
        </div>
      </CSSection>

      <MotionStats cfg={GEOMETRIC_CFG} />
      <CSCTA cat={cat} />
    </div>
  )
}

function StepsCaseStudyView({ cat, cs, slide }) {
  const { previews, large } = STEPS_MEDIA
  const { palette } = STEPS_CFG
  return (
    <div className="cs-wrap pkg-case-study">
      <MotionHero cs={cs} slide={slide} cfg={STEPS_CFG} />
      <MotionVideo slide={slide} cfg={STEPS_CFG} />
      <MotionOverview cs={cs} cfg={STEPS_CFG} />

      {/* Previews — 4 small on one line, large on its own */}
      <CSSection title="The Work" variant="dark">
        <div className="wl-grid-4" style={{ marginBottom: 12 }}>
          {previews.map((src, i) => (
            <Reveal key={src} delay={0.06 + i * 0.06}>
              <WLMedia src={src} alt={`Steps preview ${i + 1}`} />
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.06}>
          <WLMedia src={large} alt="Steps large preview" className="wl-full" />
        </Reveal>
      </CSSection>

      {/* Palette */}
      <CSSection title="The Palette">
        <div className="cs-palette-row">
          {palette.map(({ hex, name }) => (
            <div key={hex} className="cs-palette-swatch">
              <div className="cs-palette-chip" style={{ background: hex }} />
              <span className="cs-palette-hex">{hex}</span>
              <span className="cs-palette-name">{name}</span>
            </div>
          ))}
        </div>
      </CSSection>

      <MotionStats cfg={STEPS_CFG} />
      <CSCTA cat={cat} />
    </div>
  )
}

function AtoZCaseStudyView({ cat, cs, slide }) {
  return (
    <div className="cs-wrap pkg-case-study">
      <MotionHero cs={cs} slide={slide} cfg={ATOZ_CFG} />
      <MotionVideo slide={slide} cfg={ATOZ_CFG} />
      <MotionOverview cs={cs} cfg={ATOZ_CFG} />
      <MotionStats cfg={ATOZ_CFG} />
      <CSCTA cat={cat} />
    </div>
  )
}

const BLOOM_MEDIA = {
  anims:    ['bloom-inmotion', 'bloom-inmotion2'].map(n => `${BASE}bloom/${n}.webm`),
  palettes: ['bloom-palette', 'bloom-palette2'].map(n => `${BASE}bloom/${n}.webp`),
  swatches: ['bloom-actualpallete', 'bloom-actualpallete2'].map(n => `${BASE}bloom/${n}.webp`),
  stills:   ['bloom-still', 'bloom-still2', 'bloom-still3'].map(n => `${BASE}bloom/${n}.webp`),
}

function BloomCaseStudyView({ cat, cs, slide }) {
  const { stills } = BLOOM_MEDIA
  return (
    <div className="cs-wrap pkg-case-study">
      <MotionHero cs={cs} slide={slide} cfg={BLOOM_CFG} />
      <MotionVideo slide={slide} cfg={BLOOM_CFG} />
      <MotionOverview cs={cs} cfg={BLOOM_CFG}>
        <div className="wl-grid-3">
          <Reveal delay={0.06}><WLMedia src={stills[0]} alt="Bloom still 1" /></Reveal>
          <Reveal delay={0.12}><WLMedia src={stills[1]} alt="Bloom still 2" /></Reveal>
          <Reveal delay={0.18}><WLMedia src={stills[2]} alt="Bloom still 3" /></Reveal>
        </div>
      </MotionOverview>

      <CSCTA cat={cat} />
    </div>
  )
}

const WELL_LAB_CFG = {
  accent: '#335CFF', lightAccent: '#335CFF', dark: '#333333',
  youtube: 'placeholder',
  specs: [
    { label: 'Client',  value: 'Well Lab'              },
    { label: 'Year',    value: '2023'                  },
    { label: 'Type',    value: 'Commission'             },
    { label: 'Sector',  value: 'Health & Wellbeing'    },
    { label: 'Clients', value: 'NHS, UCL'              },
    { label: 'Format',  value: 'Explainer Video'       },
  ],
  stats: [
    { value: '2 min', label: 'Video Length'      },
    { value: '6+',    label: 'Scenes'            },
    { value: 1,       label: 'Introductory Film' },
    { value: 'NHS',   label: 'Client Reached'    },
  ],
}

const WL = {
  vids:    [1, 3, 4].map(n => `${BASE}well-lab/well-lab${n}.webm`),
  statics: [2, 3, 4].map(n => `${BASE}well-lab/well-lab-static${n}.webp`),
  full:    `${BASE}well-lab/well%20lab%20full%20video.mp4`,
}

// ── Pill-shaped glassmorphism video player ───────────────────────────
function WellLabPlayer() {
  const videoRef  = useRef(null)
  const [playing, setPlaying]   = useState(false)
  const [muted,   setMuted]     = useState(false)
  const [progress, setProgress] = useState(0)
  const [current,  setCurrent]  = useState(0)
  const [duration, setDuration] = useState(0)
  const [showCtrl, setShowCtrl] = useState(true)
  const hideTimer = useRef(null)

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setPlaying(true) }
    else          { v.pause(); setPlaying(false) }
  }

  const toggleMute = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }

  const onTimeUpdate = () => {
    const v = videoRef.current
    if (!v || !v.duration) return
    setCurrent(v.currentTime)
    setProgress((v.currentTime / v.duration) * 100)
  }

  const onLoadedMetadata = () => {
    setDuration(videoRef.current?.duration ?? 0)
  }

  const onEnded = () => setPlaying(false)

  const seek = (e) => {
    const v = videoRef.current
    if (!v) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct  = (e.clientX - rect.left) / rect.width
    v.currentTime = pct * v.duration
  }

  const revealControls = () => {
    setShowCtrl(true)
    clearTimeout(hideTimer.current)
    if (playing) {
      hideTimer.current = setTimeout(() => setShowCtrl(false), 2800)
    }
  }

  useEffect(() => () => clearTimeout(hideTimer.current), [])

  const toggleFullscreen = () => {
    const el = videoRef.current
    if (!el) return
    if (!document.fullscreenElement) el.requestFullscreen?.()
    else document.exitFullscreen?.()
  }

  return (
    <div className="wlp-outer" onMouseMove={revealControls} onMouseLeave={() => playing && setShowCtrl(false)}>
      {/* pill video shell */}
      <div className="wlp-shell">
        <video
          ref={videoRef}
          className="wlp-video"
          src={WL.full}
          playsInline
          preload="metadata"
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          onEnded={onEnded}
          onClick={togglePlay}
        />

        {/* big centre play/pause */}
        <button
          className={`wlp-centre-btn${playing ? ' wlp-centre-btn--hidden' : ''}`}
          onClick={togglePlay}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>

        {/* glassmorphism control bar */}
        <div className={`wlp-bar${showCtrl ? ' wlp-bar--visible' : ''}`}>
          {/* play/pause pill */}
          <button className="wlp-btn" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? (
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>

          {/* time */}
          <span className="wlp-time">{fmt(current)} / {fmt(duration)}</span>

          {/* scrubber */}
          <div className="wlp-track" onClick={seek} role="slider" aria-label="Seek">
            <div className="wlp-fill" style={{ width: `${progress}%` }} />
            <div className="wlp-thumb" style={{ left: `${progress}%` }} />
          </div>

          {/* mute */}
          <button className="wlp-btn" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
            {muted ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 010 14.14"/><path d="M15.54 8.46a5 5 0 010 7.07"/></svg>
            )}
          </button>

          {/* fullscreen */}
          <button className="wlp-btn" onClick={toggleFullscreen} aria-label="Fullscreen">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}

function WLMedia({ src, alt, className = '' }) {
  const isVideo = src.endsWith('.webm') || src.endsWith('.mp4')
  return (
    <div className={`wl-media-wrap ${className}`}>
      {isVideo ? (
        <video
          className="wl-media-img"
          src={src}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
      ) : (
        <img src={src} alt={alt} className="wl-media-img" loading="lazy" />
      )}
    </div>
  )
}

function WellLabCaseStudyView({ cat, cs, slide }) {
  const [g, s] = [WL.vids, WL.statics]
  return (
    <div className="cs-wrap pkg-case-study">
      <MotionHero cs={cs} slide={slide} cfg={WELL_LAB_CFG} />

      {/* Full video — pill glassmorphism player */}
      <CSSection title="Full Film" variant="dark">
        <Reveal delay={0.08}>
          <WellLabPlayer />
        </Reveal>
      </CSSection>

      <CSSection title="The Work" variant="dark">
        {/* Three videos */}
        <div className="wl-grid-3">
          <Reveal delay={0.06}><WLMedia src={g[0]} alt="Well Lab animation 1" /></Reveal>
          <Reveal delay={0.12}><WLMedia src={g[1]} alt="Well Lab animation 2" /></Reveal>
          <Reveal delay={0.18}><WLMedia src={g[2]} alt="Well Lab animation 3" /></Reveal>
        </div>
        {/* Three stills */}
        <div className="wl-grid-3">
          <Reveal delay={0.06}><WLMedia src={s[0]} alt="Well Lab still 1" /></Reveal>
          <Reveal delay={0.12}><WLMedia src={s[1]} alt="Well Lab still 2" /></Reveal>
          <Reveal delay={0.18}><WLMedia src={s[2]} alt="Well Lab still 3" /></Reveal>
        </div>
      </CSSection>

      <MotionOverview cs={cs} cfg={WELL_LAB_CFG} />
      <MotionStats cfg={WELL_LAB_CFG} />
      <CSCTA cat={cat} />
    </div>
  )
}

// ── Spurgeons: Counselling ────────────────────────────────────────────

const SPURGEONS_COUNSELLING_CFG = {
  accent: '#335CFF', lightAccent: '#D4C7FF', dark: '#333333',
  specs: [
    { label: 'Client',   value: 'Spurgeons'             },
    { label: 'Sector',   value: 'Charity / Counselling' },
    { label: 'Location', value: 'United Kingdom'        },
    { label: 'Videos',   value: '3 Social Videos'       },
    { label: 'Format',   value: 'Vertical (9:16)'       },
    { label: 'Year',     value: '2025'                  },
  ],
  stats: [
    { value: 3,     label: 'Films Produced'        },
    { value: 3,     label: 'Voices / Narrators'    },
    { value: '12+', label: 'Custom Illustrations'  },
    { value: '9:16', label: 'Social Format'        },
  ],
}

const SPURGEONS_COUNSELLING_VIDEOS = {
  james:    `${BASE}spurgeons-counselling/CounsellingVideo_James.mp4`,
  lizzie:   `${BASE}spurgeons-counselling/Lizzie_CounsellingVideoPortrait_with%20sound.mp4`,
  selfharm: `${BASE}spurgeons-counselling/SelfHarmAnimation_V3_20250902.mp4`,
}

const SPURGEONS_COUNSELLING_NARRATORS = [
  {
    name: 'James',
    topic: 'School-Based Counselling',
    description: 'James, a school-based counsellor at Spurgeons, speaks about the importance of accessible mental health support for children and young people within school settings, meeting them where they already are.',
    video: 'james',
    avatar: 'james.jpg',
  },
  {
    name: 'Lizzie',
    topic: 'Counselling Services',
    description: "Lizzie shares her perspective on Spurgeons' therapeutic approach, reflecting on the depth and range of support the charity provides to children, families, and young people navigating difficult circumstances.",
    video: 'lizzie',
    avatar: 'lizzie.jpg',
  },
  {
    name: 'Nadine',
    topic: 'Self-Harm Support',
    description: "Nadine talks about the charity's work supporting children and young people affected by self-harm, one of the most challenging topics in children's mental health. Custom illustrations guide viewers through the subject with care, clarity, and compassion.",
    video: 'selfharm',
    avatar: 'nadine.jpg',
  },
]

function CounsellingVideoPlayer({ src, label }) {
  const videoRef  = useRef(null)
  const [playing,  setPlaying]  = useState(false)
  const [muted,    setMuted]    = useState(false)
  const [progress, setProgress] = useState(0)
  const [current,  setCurrent]  = useState(0)
  const [duration, setDuration] = useState(0)
  const [showCtrl, setShowCtrl] = useState(true)
  const hideTimer = useRef(null)

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setPlaying(true) }
    else          { v.pause(); setPlaying(false) }
  }

  const toggleMute = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }

  const onTimeUpdate = () => {
    const v = videoRef.current
    if (!v || !v.duration) return
    setCurrent(v.currentTime)
    setProgress((v.currentTime / v.duration) * 100)
  }

  const onLoadedMetadata = () => {
    setDuration(videoRef.current?.duration ?? 0)
  }

  const onEnded = () => setPlaying(false)

  const seek = (e) => {
    const v = videoRef.current
    if (!v) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct  = (e.clientX - rect.left) / rect.width
    v.currentTime = pct * v.duration
  }

  const revealControls = () => {
    setShowCtrl(true)
    clearTimeout(hideTimer.current)
    if (playing) {
      hideTimer.current = setTimeout(() => setShowCtrl(false), 2800)
    }
  }

  useEffect(() => () => clearTimeout(hideTimer.current), [])

  const toggleFullscreen = () => {
    const el = videoRef.current
    if (!el) return
    if (!document.fullscreenElement) el.requestFullscreen?.()
    else document.exitFullscreen?.()
  }

  return (
    <div className="cvp-outer" onMouseMove={revealControls} onMouseLeave={() => playing && setShowCtrl(false)}>
      <div className="cvp-shell">
        <video
          ref={videoRef}
          className="cvp-video"
          src={src}
          playsInline
          preload="metadata"
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          onEnded={onEnded}
          onClick={togglePlay}
        />

        {/* big centre play button */}
        <button
          className={`cvp-centre-btn${playing ? ' cvp-centre-btn--hidden' : ''}`}
          onClick={togglePlay}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>

        {/* glassmorphism control bar */}
        <div className={`cvp-bar${showCtrl ? ' cvp-bar--visible' : ''}`}>
          <button className="cvp-btn" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? (
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>

          <span className="cvp-time">{fmt(current)} / {fmt(duration)}</span>

          <div className="cvp-track" onClick={seek} role="slider" aria-label="Seek">
            <div className="cvp-fill" style={{ width: `${progress}%` }} />
            <div className="cvp-thumb" style={{ left: `${progress}%` }} />
          </div>

          <button className="cvp-btn" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
            {muted ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 010 14.14"/><path d="M15.54 8.46a5 5 0 010 7.07"/></svg>
            )}
          </button>

          <button className="cvp-btn" onClick={toggleFullscreen} aria-label="Fullscreen">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>
          </button>
        </div>
      </div>
      {label && (
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 8, textAlign: 'center', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</p>
      )}
    </div>
  )
}

function SpurgeonsCounsellingCaseStudyView({ cat, cs, slide }) {
  const { james, lizzie, selfharm } = SPURGEONS_COUNSELLING_VIDEOS
  const cfg = SPURGEONS_COUNSELLING_CFG
  return (
    <div className="cs-wrap pkg-case-study">
      <MotionHero cs={cs} slide={slide} cfg={cfg} />

      {/* Three vertical social videos */}
      <CSSection title="The Films" variant="dark">
        <div className="cvp-grid-3">
          <Reveal delay={0.06}>
            <CounsellingVideoPlayer src={james}    label="James · School-Based Counselling" />
          </Reveal>
          <Reveal delay={0.12}>
            <CounsellingVideoPlayer src={lizzie}   label="Lizzie · Counselling Services" />
          </Reveal>
          <Reveal delay={0.18}>
            <CounsellingVideoPlayer src={selfharm} label="Self-Harm Support · Animation" />
          </Reveal>
        </div>
      </CSSection>

      {/* Narrator cards */}
      <CSSection title="Three Voices">
        <div className="si-characters-grid">
          {SPURGEONS_COUNSELLING_NARRATORS.map((n, i) => (
            <Reveal key={n.name} delay={i * 0.08}>
              <div className="si-character-card">
                <div className="si-character-avatar">
                  {n.avatar
                    ? <img src={`${BASE}spurgeons-counselling/${n.avatar}`} alt={n.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '999px' }} />
                    : <span className="si-character-avatar-initial" style={{ color: cfg.lightAccent }}>{n.name[0]}</span>
                  }
                </div>
                <h3 className="si-character-name" style={{ color: cfg.lightAccent }}>{n.name}</h3>
                <p className="si-character-bio" style={{ fontStyle: 'italic', fontSize: 12, opacity: 0.6, marginBottom: 6 }}>{n.topic}</p>
                <p className="si-character-bio">{n.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </CSSection>

      <MotionOverview cs={cs} cfg={cfg} />
      <MotionStats cfg={cfg} />
      <CSCTA cat={cat} />
    </div>
  )
}

// ── Spurgeons: PAS Advert ─────────────────────────────────────────────

const SPURGEONS_PAS_CFG = {
  accent: '#335CFF', lightAccent: '#E0F87D', dark: '#333333',
  specs: [
    { label: 'Client',   value: 'Spurgeons'             },
    { label: 'Sector',   value: 'Charity / Family'      },
    { label: 'Location', value: 'United Kingdom'        },
    { label: 'Format',   value: 'Vertical (9:16)'       },
    { label: 'Platform', value: 'Social Media'          },
    { label: 'Year',     value: '2025'                  },
  ],
  stats: [
    { value: 1,     label: 'Social Advert'       },
    { value: '9:16', label: 'Vertical Format'    },
    { value: 'PAS', label: 'Course Campaign'     },
    { value: 'Animated', label: 'Characters'     },
  ],
}

const SPURGEONS_PAS_VIDEO = `${BASE}spurgeons-pas/PAS_Advert.mp4`

const PAS_COURSE_URL = 'https://spurgeons.org/resources-and-courses/courses/parenting-after-separation/'

const PAS_COURSE_DETAILS = [
  {
    heading: 'Who it is for',
    body: 'Separated parents, or those going through a separation, who want to put their children first and navigate family breakdown with confidence and care.',
  },
  {
    heading: 'What it covers',
    body: "Managing personal wellbeing after family breakdown, recognising children's emotional needs, building positive parent-child bonds, managing behaviour with structure and praise, and establishing routines that give children stability.",
  },
  {
    heading: 'How it is delivered',
    body: 'A self-paced online course developed by Spurgeons\' parenting and counselling experts. Each module includes animated educational videos, post-video quizzes, and downloadable reference sheets for use at home.',
  },
]

function SpurgeonsPASCaseStudyView({ cat, cs, slide }) {
  const cfg = SPURGEONS_PAS_CFG
  return (
    <div className="cs-wrap pkg-case-study">
      <MotionHero cs={cs} slide={slide} cfg={cfg} />

      {/* The advert */}
      <CSSection title="The Advert" variant="dark">
        <div style={{ maxWidth: 360, margin: '0 auto' }}>
          <CounsellingVideoPlayer src={SPURGEONS_PAS_VIDEO} label="Spurgeons PAS · Social Advert" />
        </div>
      </CSSection>

      {/* About the course */}
      <CSSection title="The Brief">
        <div style={{ maxWidth: 740, margin: '0 auto' }}>
          <p style={{ fontSize: 16, lineHeight: 1.75, opacity: 0.85, marginBottom: 32 }}>
            Spurgeons commissioned this short-form vertical advert to raise awareness of their Parenting After Separation course — a self-paced online programme built to support parents through one of the most emotionally complex transitions a family can experience.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.75, opacity: 0.85, marginBottom: 48 }}>
            The goal was to communicate warmth, accessibility, and hope. Animated characters were designed and built specifically for this piece, giving a human face to a course that deals with very real and sensitive family circumstances.
          </p>
          <div className="si-characters-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
            {PAS_COURSE_DETAILS.map((item, i) => (
              <Reveal key={item.heading} delay={i * 0.08}>
                <div className="si-character-card">
                  <h3 className="si-character-name" style={{ color: cfg.lightAccent, fontSize: 14, marginBottom: 8 }}>{item.heading}</h3>
                  <p className="si-character-bio">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </CSSection>

      {/* Link to course */}
      <CSSection title="The Course" variant="dark">
        <div style={{ textAlign: 'center', padding: '8px 0 24px' }}>
          <p style={{ fontSize: 16, lineHeight: 1.75, opacity: 0.8, maxWidth: 560, margin: '0 auto 32px' }}>
            Developed by Spurgeons' parenting and counselling experts, the Parenting After Separation course is available online and free to access for all separated parents.
          </p>
          <a
            href={PAS_COURSE_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '14px 36px',
              borderRadius: 999,
              background: `linear-gradient(135deg, ${cfg.accent}, ${cfg.lightAccent})`,
              color: '#fff',
              fontFamily: 'Raleway, sans-serif',
              fontWeight: 400,
              fontSize: 14,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(51,92,255,0.30)',
              transition: 'opacity 0.2s ease, transform 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'scale(1.04)' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)' }}
          >
            View the PAS Course
          </a>
        </div>
      </CSSection>

      <MotionOverview cs={cs} cfg={cfg} />
      <MotionStats cfg={cfg} />
      <CSCTA cat={cat} />
    </div>
  )
}

// ── Spurgeons Connect ─────────────────────────────────────────────────

function SCVideoPlayer({ src, label }) {
  const videoRef  = useRef(null)
  const [playing,  setPlaying]  = useState(false)
  const [muted,    setMuted]    = useState(false)
  const [progress, setProgress] = useState(0)
  const [current,  setCurrent]  = useState(0)
  const [duration, setDuration] = useState(0)
  const [showCtrl, setShowCtrl] = useState(true)
  const hideTimer = useRef(null)

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  const togglePlay = () => {
    const v = videoRef.current; if (!v) return
    if (v.paused) { v.play(); setPlaying(true) } else { v.pause(); setPlaying(false) }
  }
  const toggleMute = () => {
    const v = videoRef.current; if (!v) return
    v.muted = !v.muted; setMuted(v.muted)
  }
  const onTimeUpdate = () => {
    const v = videoRef.current; if (!v || !v.duration) return
    setCurrent(v.currentTime); setProgress((v.currentTime / v.duration) * 100)
  }
  const onLoadedMetadata = () => { setDuration(videoRef.current?.duration ?? 0) }
  const onEnded = () => setPlaying(false)
  const seek = (e) => {
    const v = videoRef.current; if (!v) return
    const rect = e.currentTarget.getBoundingClientRect()
    v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration
  }
  const revealControls = () => {
    setShowCtrl(true); clearTimeout(hideTimer.current)
    if (playing) hideTimer.current = setTimeout(() => setShowCtrl(false), 2800)
  }
  useEffect(() => () => clearTimeout(hideTimer.current), [])
  const toggleFullscreen = () => {
    const el = videoRef.current; if (!el) return
    if (!document.fullscreenElement) el.requestFullscreen?.()
    else document.exitFullscreen?.()
  }

  return (
    <div className="scp-outer" onMouseMove={revealControls} onMouseLeave={() => playing && setShowCtrl(false)}>
      <div className="scp-shell">
        <video
          ref={videoRef} className="scp-video" src={src}
          playsInline preload="metadata"
          onTimeUpdate={onTimeUpdate} onLoadedMetadata={onLoadedMetadata}
          onEnded={onEnded} onClick={togglePlay}
        />
        <button className={`scp-centre-btn${playing ? ' scp-centre-btn--hidden' : ''}`} onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
          {playing
            ? <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
            : <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path d="M8 5v14l11-7z"/></svg>}
        </button>
        <div className={`scp-bar${showCtrl ? ' scp-bar--visible' : ''}`}>
          <button className="scp-btn" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
            {playing
              ? <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
              : <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M8 5v14l11-7z"/></svg>}
          </button>
          <span className="scp-time">{fmt(current)} / {fmt(duration)}</span>
          <div className="scp-track" onClick={seek} role="slider" aria-label="Seek">
            <div className="scp-fill" style={{ width: `${progress}%` }} />
            <div className="scp-thumb" style={{ left: `${progress}%` }} />
          </div>
          <button className="scp-btn" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
            {muted
              ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 010 14.14"/><path d="M15.54 8.46a5 5 0 010 7.07"/></svg>}
          </button>
          <button className="scp-btn" onClick={toggleFullscreen} aria-label="Fullscreen">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>
          </button>
        </div>
      </div>
      {label && (
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 10, textAlign: 'center', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</p>
      )}
    </div>
  )
}

const SPURGEONS_CONNECT_CFG = {
  accent: '#335CFF', lightAccent: '#D4C7FF', dark: '#333333',
  specs: [
    { label: 'Client',   value: 'Spurgeons'              },
    { label: 'Sector',   value: 'Charity / Education'    },
    { label: 'Location', value: 'United Kingdom'         },
    { label: 'Videos',   value: '8+ (and growing)'       },
    { label: 'Tracks',   value: '3 Specialist Courses'   },
    { label: 'Year',     value: '2025'                   },
  ],
  stats: [
    { value: '8+',  label: 'Videos Produced'    },
    { value: 4,     label: 'More In Development' },
    { value: 3,     label: 'Course Tracks'       },
    { value: '50+',  label: 'Custom Illustrations' },
  ],
}

const SPURGEONS_CONNECT_VIDEOS = {
  tc3: `${BASE}spurgeons-tc/TC Animation 3 Full.mp4`,
  tc4: `${BASE}spurgeons-tc/TC Animation 4 Full.mp4`,
}

const CONNECT_COURSE_URL = 'https://spurgeons.org/support-us/spurgeons-connect/'

const CONNECT_TRACKS = [
  {
    name: 'Primary',
    description: 'Practical guidance for parents of primary-age children, covering everyday challenges, communication, and building a stable home environment.',
  },
  {
    name: 'Teens',
    description: "Tailored content supporting parents of teenagers, helping them navigate the emotional complexity of adolescence and maintain strong relationships through the teen years.",
  },
  {
    name: 'Neurodiverse Children',
    description: 'Specialist videos designed for parents of children with neurodivergent needs, offering informed, compassionate strategies developed with Spurgeons\' SEND practitioners.',
  },
]

function SpurgeonsConnectCaseStudyView({ cat, cs, slide }) {
  const cfg = SPURGEONS_CONNECT_CFG
  const { tc3, tc4 } = SPURGEONS_CONNECT_VIDEOS
  return (
    <div className="cs-wrap pkg-case-study">
      <MotionHero cs={cs} slide={slide} cfg={cfg} />

      {/* Featured videos */}
      <CSSection title="From the Teen Course" variant="dark">
        <div className="scp-grid-2">
          <Reveal delay={0.06}>
            <SCVideoPlayer src={tc3} label="Teen Course · Animation 3" />
          </Reveal>
          <Reveal delay={0.12}>
            <SCVideoPlayer src={tc4} label="Teen Course · Animation 4" />
          </Reveal>
        </div>
      </CSSection>

      {/* The three tracks */}
      <CSSection title="The Series">
        <div style={{ maxWidth: 740, margin: '0 auto' }}>
          <p style={{ fontSize: 16, lineHeight: 1.75, opacity: 0.85, marginBottom: 48 }}>
            Spurgeons Connect is an ongoing animated series produced to equip parents and carers with practical tools and emotional support. The series spans three specialist course tracks, each developed by Spurgeons' family support practitioners.
          </p>
          <div className="si-characters-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
            {CONNECT_TRACKS.map((track, i) => (
              <Reveal key={track.name} delay={i * 0.08}>
                <div className="si-character-card">
                  <h3 className="si-character-name" style={{ color: cfg.lightAccent, fontSize: 14, marginBottom: 8 }}>{track.name}</h3>
                  <p className="si-character-bio">{track.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </CSSection>

      {/* Link */}
      <CSSection title="Spurgeons Connect" variant="dark">
        <div style={{ textAlign: 'center', padding: '8px 0 24px' }}>
          <p style={{ fontSize: 16, lineHeight: 1.75, opacity: 0.8, maxWidth: 560, margin: '0 auto 32px' }}>
            Spurgeons Connect equips churches and communities to become safe, relational spaces where families can access practical help and emotional support. Find out more about the programme and the courses behind these videos.
          </p>
          <a
            href={CONNECT_COURSE_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '14px 36px',
              borderRadius: 999,
              background: `linear-gradient(135deg, ${cfg.accent}, ${cfg.lightAccent})`,
              color: '#fff',
              fontFamily: 'Raleway, sans-serif',
              fontWeight: 400,
              fontSize: 14,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(51,92,255,0.30)',
              transition: 'opacity 0.2s ease, transform 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'scale(1.04)' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)' }}
          >
            Visit Spurgeons Connect
          </a>
        </div>
      </CSSection>

      <MotionOverview cs={cs} cfg={cfg} />
      <MotionStats cfg={cfg} />
      <CSCTA cat={cat} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
//  CASE STUDY VIEWS — routes to CBS or PGM based on slide.id
// ═══════════════════════════════════════════════════════════════════════

const CBS_ILLUS_IMAGES = [1, 2, 3, 4, 5, 6].map(
  (n) => `${BASE}cbs/illustrations/Illustration${n}.webp`
)

function CBSCaseStudyView({ cat, cs, slide }) {
  return (
    <div className="cs-wrap">
      <CSHero           cs={cs} slide={slide} />
      <CSFlipbook />
      <CSOverview       cs={cs} />
      <CSBrief          cs={cs} />
      <CSTimeline />
      <CSStrategy       cs={cs} />
      <CSVisualIdentity cs={cs} />
      <IllustrationsSection images={CBS_ILLUS_IMAGES} colors={CBS_GALLERY_COLORS} />
      <CSImpact />
      <CSCTA            cat={cat} />
    </div>
  )
}

const PGM_ILLUS_IMAGES = [1, 2, 3, 4, 5, 6].map(
  (n) => `${BASE}pgm/illustrations/Illustration${n}.webp`
)

function PGMCaseStudyView({ cat, cs, slide }) {
  return (
    <div className="cs-wrap pgm-case-study">
      <PGMHero           cs={cs} slide={slide} />
      <PGMFlipbook />
      <PGMOverview       cs={cs} />
      <PGMBrief          cs={cs} />
      <PGMProcess />
      <PGMStrategy       cs={cs} />
      <PGMVisualIdentity cs={cs} />
      <IllustrationsSection images={PGM_ILLUS_IMAGES} colors={PGM_GALLERY_COLORS} />
      <PGMImpact />
      <CSCTA             cat={cat} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
//  BRAND PROJECTS — slides 3–7
// ═══════════════════════════════════════════════════════════════════════

function BrandPlaceholder({ label, aspect = '4/3', accent = '#C4B8F0' }) {
  return (
    <div style={{
      aspectRatio: aspect,
      background: `color-mix(in srgb, ${accent} 12%, transparent)`,
      border: `1.5px dashed color-mix(in srgb, ${accent} 40%, transparent)`,
      borderRadius: 12,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 8, padding: '1.5rem', textAlign: 'center',
    }}>
      <span style={{ fontSize: '1.8rem', opacity: 0.35 }}>🎨</span>
      <span style={{ fontSize: '0.78rem', opacity: 0.5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
    </div>
  )
}

// ── Buttons Preschool ─────────────────────────────────────────────────

const PRESCHOOLS_CFG = {
  accent: '#F9D48B', lightAccent: '#F9D48B', dark: '#333333',
  specs: [
    { label: 'Client',     value: 'Spurgeons' },
    { label: 'Year',       value: '2022' },
    { label: 'Type',       value: 'Brand Identity' },
    { label: 'Output',     value: 'Logos · Collateral · Signage · Merch' },
    { label: 'Location',   value: 'Kent, UK' },
    { label: 'Status',     value: 'Now Closed' },
  ],
  stats: [
    { value: '3',         label: 'Preschool settings branded for Spurgeons' },
    { value: '7+',        label: 'Merch designs across both schools' },
    { value: '10+',       label: 'Signage and print pieces produced' },
    { value: 'Quarterly', label: 'Brand consultations to keep the identity consistent' },
  ],
}

function PreschoolsCaseStudyView({ cat, cs, slide }) {
  const cfg = PRESCHOOLS_CFG
  const B = `${BASE}spurgeons-preschools/`
  const logoStyle = { width: '100%', height: '200px', borderRadius: 16, background: '#fff', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', padding: '2rem', objectFit: 'contain', display: 'block' }
  return (
    <div className="cs-wrap pkg-case-study">
      <PkgHero cs={cs} slide={slide} cfg={cfg} />
      <PkgOverview cs={cs} cfg={cfg} />

      <CSSection title="The Brief" variant="dark">
        <Reveal>
          <p style={{ lineHeight: 1.8, maxWidth: 720, color: '#fff', marginBottom: '2rem' }}>
            Spurgeons commissioned Studio KAIL to develop brand identities for two of their early years settings across Kent. Each had its own character, audience, and tone, but both shared a commitment to warmth, safety, and professional care.
          </p>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          <Reveal delay={0.08}>
            <h4 style={{ color: cfg.accent, marginBottom: '0.5rem', fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Buttons Preschool</h4>
            <p style={{ lineHeight: 1.7, color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem' }}>
              With sites in Maidstone and Ramsgate, Buttons needed a brand parents could trust at first glance: warm, playful, and professional in equal measure. Studio KAIL ran close feedback loops with the Buttons team throughout, ensuring the final system genuinely reflected how they wanted to show up for families across Kent.
            </p>
          </Reveal>
          <Reveal delay={0.14}>
            <h4 style={{ color: cfg.accent, marginBottom: '0.5rem', fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Little Lambs</h4>
            <p style={{ lineHeight: 1.7, color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem' }}>
              A smaller community setting, Little Lambs needed a softer, more intimate identity: gentle and approachable, with a visual language that communicated safety and care from the very first point of contact. The school has since closed, but the brand served its families throughout its operation.
            </p>
          </Reveal>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <Reveal delay={0.2}>
            <h4 style={{ color: cfg.accent, marginBottom: '0.5rem', fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Audience</h4>
            <p style={{ lineHeight: 1.7, color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem' }}>
              Parents and carers of children aged 2 to 5, often making their first childcare decision. Staff, local authorities, and Ofsted inspectors formed a secondary audience, requiring each identity to carry credibility well beyond the nursery gate.
            </p>
          </Reveal>
          <Reveal delay={0.26}>
            <h4 style={{ color: cfg.accent, marginBottom: '0.5rem', fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Tone of Voice</h4>
            <p style={{ lineHeight: 1.7, color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem' }}>
              Warm without being whimsical. Playful without being chaotic. The visual tone aimed to put anxious parents at ease, approachable and friendly, while retaining the confidence that signals professional care. Nothing precious, nothing cold.
            </p>
          </Reveal>
        </div>
      </CSSection>

      <CSSection title="The Logos" variant="light">
        <Reveal><p style={{ lineHeight: 1.8, color: cfg.dark, marginBottom: '2.5rem', maxWidth: 720 }}>
          Each setting received its own distinct mark, siblings in spirit but distinct in character. All three were designed to work across signage, print, digital, and merchandise without losing their integrity at any scale.
        </p></Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem' }}>
          <Reveal delay={0}>
            <div>
              <img src={`${B}Buttons%20LOGO.png`} alt="Buttons Preschool primary logo" style={logoStyle} />
              <h4 style={{ marginTop: '1rem', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 600, color: cfg.dark }}>Buttons: Primary Mark</h4>
              <p style={{ lineHeight: 1.6, fontSize: '0.9rem', color: '#555' }}>The main Buttons logo, used across all printed material, signage, and digital communication for the Maidstone and Ramsgate sites. The mark incorporates a playful button motif that gives the identity its name and personality, sitting naturally on uniforms, tote bags, and stationery without feeling forced at any size.</p>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div>
              <img src={`${B}Buttons%20ABC%20Logo.png`} alt="Buttons ABC variant logo" style={logoStyle} />
              <h4 style={{ marginTop: '1rem', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 600, color: cfg.dark }}>Buttons ABC: Secondary Mark</h4>
              <p style={{ lineHeight: 1.6, fontSize: '0.9rem', color: '#555' }}>A secondary variant built for classroom materials, letterheads, and stationery where a more educational tone was needed. The ABC lockup reinforces the early years learning focus and gives teachers a logo that feels at home on worksheets, welcome packs, and room signage without competing with the primary mark.</p>
            </div>
          </Reveal>
          <Reveal delay={0.16}>
            <div>
              <img src={`${B}LittleLambs%20Logo.png`} alt="Little Lambs logo" style={logoStyle} />
              <h4 style={{ marginTop: '1rem', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 600, color: cfg.dark }}>Little Lambs: Logo</h4>
              <p style={{ lineHeight: 1.6, fontSize: '0.9rem', color: '#555' }}>A gentler, more intimate mark built around a playful lamb illustration. The character is soft and expressive without tipping into clip-art territory, giving the setting a face that felt genuinely welcoming to young children and their families. Where Buttons is bright and confident, Little Lambs is warm and reassuring, a visual language centred on comfort and care.</p>
            </div>
          </Reveal>
        </div>
      </CSSection>

      <CSSection title="Merch & Collateral" variant="dark">
        <Reveal>
          <p style={{ color: 'rgba(255,255,255,0.80)', lineHeight: 1.7, marginBottom: '1.5rem', maxWidth: 640, fontSize: '0.95rem' }}>
            Both schools received a suite of branded merchandise: items designed to feel considered rather than off-the-shelf, giving staff and families something tangible to connect with. Each piece carries the school's identity into everyday life, from tote bags and lanyards to keyrings and water bottles.
          </p>
        </Reveal>
        <div style={{ columns: '2 200px', columnGap: '1rem' }}>
          {[
            { src: `${B}merch.png`,               alt: 'Buttons branded merchandise',       delay: 0 },
            { src: `${B}merch2.jpg`,              alt: 'Buttons branded merchandise detail', delay: 0.06 },
            { src: `${B}little-lambs-merch1.jpg`, alt: 'Little Lambs merchandise',           delay: 0.12 },
            { src: `${B}little-lambs-merch2.jpg`, alt: 'Little Lambs merchandise',           delay: 0.18 },
            { src: `${B}little-lambs-merch3.jpg`, alt: 'Little Lambs merchandise',           delay: 0.24 },
            { src: `${B}little-lambs-merch4.jpg`, alt: 'Little Lambs merchandise',           delay: 0.30 },
          ].map(({ src, alt, delay }) => (
            <Reveal key={src} delay={delay}>
              <div style={{ breakInside: 'avoid', marginBottom: '1rem' }}>
                <img src={src} alt={alt} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 12 }} />
              </div>
            </Reveal>
          ))}
        </div>
      </CSSection>

      <CSSection title="Signage & Print" variant="light">
        <Reveal>
          <p style={{ lineHeight: 1.7, color: cfg.dark, marginBottom: '1.5rem', maxWidth: 640, fontSize: '0.95rem' }}>
            From A5 handouts to large-format banners, the print suite gave Buttons a consistent presence across waiting room tables, nursery walls, and outdoor spaces. Each piece was designed to work hard in the real world, not just on screen.
          </p>
        </Reveal>
        <div style={{ columns: '2 200px', columnGap: '1rem', marginBottom: '1rem' }}>
          <Reveal delay={0}>
            <div style={{ breakInside: 'avoid', marginBottom: '1rem' }}>
              <img src={`${B}Banner_Mockup1.jpg`} alt="Buttons banner mockup" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 12 }} />
            </div>
          </Reveal>
          <Reveal delay={0.07}>
            <div style={{ breakInside: 'avoid', marginBottom: '1rem' }}>
              <img src={`${B}Banner_Mockup2.png`} alt="Buttons banner mockup" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 12 }} />
            </div>
          </Reveal>
          <Reveal delay={0.14}>
            <div style={{ breakInside: 'avoid', marginBottom: '1rem' }}>
              <img src={`${B}A5%20flyer.png`} alt="Buttons A5 flyer" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 12 }} />
            </div>
          </Reveal>
          <Reveal delay={0.21}>
            <div style={{ breakInside: 'avoid', marginBottom: '1rem', borderRadius: 12, overflow: 'hidden', maxHeight: 360 }}>
              <img src={`${B}A2%20Sign.jpg`} alt="Buttons A2 sign" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
          </Reveal>
        </div>
        <Reveal delay={0.28}>
          <img src={`${B}Banner.png`} alt="Buttons banner design" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 12 }} />
        </Reveal>
      </CSSection>

      <MotionStats cfg={cfg} />
      <PkgLinks cs={cs} cfg={cfg} />
      <CSCTA cat={cat} />
    </div>
  )
}

// ── Invisible Walls ───────────────────────────────────────────────────

const INVISIBLE_WALLS_CFG = {
  accent: '#335CFF', lightAccent: '#335CFF', dark: '#333333',
  specs: [
    { label: 'Client',     value: 'Spurgeons' },
    { label: 'Years',      value: '2022–2024' },
    { label: 'Type',       value: 'Brand Identity · Print' },
    { label: 'Output',     value: 'Logo · Leaflets · Illustration · Signage' },
    { label: 'Location',   value: 'HMP Winchester' },
    { label: 'Status',     value: 'Live' },
  ],
  stats: [
    { value: '11+', label: 'Years Invisible Walls has operated at HMP Winchester' },
    { value: '1',   label: 'Unifying brand identity built to serve a sensitive, complex environment' },
    { value: '∞',   label: 'Families supported in maintaining bonds across the prison divide' },
  ],
}

function InvisibleWallsCaseStudyView({ cat, cs, slide }) {
  const cfg = INVISIBLE_WALLS_CFG
  const IW = `${BASE}spurgeons-iw/`
  const logoStyle = { width: '100%', height: '200px', borderRadius: 16, background: '#fff', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', padding: '2rem', objectFit: 'contain', display: 'block' }
  return (
    <div className="cs-wrap pkg-case-study">
      <PkgHero cs={cs} slide={slide} cfg={cfg} />
      <PkgOverview cs={cs} cfg={cfg} />

      <CSSection title="The Brief" variant="dark">
        <Reveal>
          <p style={{ lineHeight: 1.8, maxWidth: 720, color: '#fff' }}>
            Invisible Walls is Spurgeons' programme at HMP Winchester, helping imprisoned
            fathers stay connected with their children through parenting courses, family
            visits, and resettlement support. The brief was to give this long-running and
            deeply important programme a visual identity that reflected its humanity: a mark
            and communications system built on connection, not incarceration.
          </p>
        </Reveal>
      </CSSection>

      <CSSection title="The Logo" variant="light">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem', alignItems: 'start' }}>
          <Reveal delay={0}>
            <img src={`${IW}IW%20logo.png`} alt="Invisible Walls logo" style={logoStyle} />
          </Reveal>
          <Reveal delay={0.08}>
            <p style={{ lineHeight: 1.7, color: cfg.dark, fontSize: '0.95rem' }}>
              The Invisible Walls logo centres on connection: two figures reaching toward each other, evoking the bond between a father and child separated by circumstance rather than choice. The figures also pay homage to the Spurgeons organisational logo and its symbolism of people in relationship, grounding Invisible Walls firmly within the wider Spurgeons family while giving the programme its own distinct voice. The mark deliberately avoids any imagery associated with incarceration, instead drawing on warmth, presence, and continuity. It works quietly across the programme's materials: leaflets, signage, and printed resources used within the prison environment, without ever overpowering the human stories it exists to support.
            </p>
          </Reveal>
        </div>
      </CSSection>

      <CSSection title="Merch & Print" variant="dark">
        <Reveal>
          <p style={{ color: 'rgba(255,255,255,0.80)', lineHeight: 1.7, marginBottom: '1.5rem', maxWidth: 640, fontSize: '0.95rem' }}>
            Every piece of printed material was designed with the sensitivity the context demands: clear, human, and accessible for fathers, families, and prison staff alike.
          </p>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {[
            { src: `${IW}merch1.jpg`,   alt: 'Invisible Walls merchandise',  delay: 0 },
            { src: `${IW}merch2.jpg`,   alt: 'Invisible Walls merchandise',  delay: 0.07 },
            { src: `${IW}merch3.jpg`,   alt: 'Invisible Walls merchandise',  delay: 0.14 },
            { src: `${IW}merch4.jpg`,   alt: 'Invisible Walls merchandise',  delay: 0.21 },
          ].map(({ src, alt, delay }) => (
            <Reveal key={src} delay={delay}>
              <div style={{ borderRadius: 12, overflow: 'hidden', height: '220px' }}>
                <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            </Reveal>
          ))}
        </div>
      </CSSection>

      <PkgLinks cs={cs} cfg={cfg} />
      <CSCTA cat={cat} />
    </div>
  )
}

// ── Parents Connect ───────────────────────────────────────────────────

const PARENTS_CONNECT_CFG = {
  accent: '#D4C7FF', lightAccent: '#D4C7FF', dark: '#333333',
  specs: [
    { label: 'Client',   value: 'Spurgeons' },
    { label: 'Year',     value: '2023' },
    { label: 'Type',     value: 'Brand Identity · Digital' },
    { label: 'Output',   value: 'Logo · Animated Logo · Digital Collateral' },
    { label: 'Status',   value: 'Live' },
  ],
  stats: [
    { value: '3',    label: 'Ready-to-run parenting courses covered under the Parents Connect brand' },
    { value: '1',    label: 'Animated logo bringing the brand to life in video and digital contexts' },
    { value: '∞',    label: 'Families supported by volunteers trained through Parents Connect' },
  ],
}

function ParentsConnectCaseStudyView({ cat, cs, slide }) {
  const cfg = PARENTS_CONNECT_CFG
  return (
    <div className="cs-wrap pkg-case-study">
      <PkgHero cs={cs} slide={slide} cfg={cfg} />
      <PkgOverview cs={cs} cfg={cfg} />

      <CSSection title="The Brief" variant="dark">
        <Reveal>
          <p style={{ lineHeight: 1.8, maxWidth: 720 }}>
            Parents Connect is Spurgeons' suite of three evidence-based parenting courses,
            designed to be run by church and community volunteers. The brand needed to feel
            welcoming and accessible for both facilitators and the families they support —
            professional enough for institutional contexts, warm enough for community settings.
            An animated logo was also required for use in the course video content.
          </p>
        </Reveal>
      </CSSection>

      <CSSection title="Logo & Animation" variant="light">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          {['Logo Static', 'Logo Animated', 'Colour System', 'Digital Collateral', 'Course Materials'].map((l, i) => (
            <Reveal key={l} delay={i * 0.07}><BrandPlaceholder label={l} accent={cfg.accent} /></Reveal>
          ))}
        </div>
      </CSSection>

      <MotionStats cfg={cfg} />
      <PkgLinks cs={cs} cfg={cfg} />
      <CSCTA cat={cat} />
    </div>
  )
}

// ── Digital Family Hub ────────────────────────────────────────────────

const DFH_CFG = {
  accent: '#E0F87D', lightAccent: '#335CFF', dark: '#333333',
  specs: [
    { label: 'Client',   value: 'Spurgeons' },
    { label: 'Year',     value: '2026' },
    { label: 'Type',     value: 'Brand Identity · Digital' },
    { label: 'Output',   value: 'Logo · Animated Logo · Digital Collateral' },
    { label: 'Status',   value: 'Live · Ongoing' },
  ],
  stats: [
    { value: '2026', label: 'Year the Digital Family Hub launched as its own team' },
    { value: '1',    label: 'Full-time studio presence — embedded from day one' },
    { value: '∞',    label: 'Families accessing free expert support through the Hub' },
  ],
}

function DFHCaseStudyView({ cat, cs, slide }) {
  const cfg = DFH_CFG
  return (
    <div className="cs-wrap pkg-case-study">
      <PkgHero cs={cs} slide={slide} cfg={cfg} />
      <PkgOverview cs={cs} cfg={cfg} />

      <CSSection title="The Brief" variant="dark">
        <Reveal>
          <p style={{ lineHeight: 1.8, maxWidth: 720 }}>
            In 2026, Spurgeons established the Digital Family Hub as a standalone team —
            and Studio KAIL moved there full time from Spurgeons' central marketing function.
            The brief was to build the DFH brand from scratch: a mark that communicated
            expert, trusted, and genuinely accessible — capable of representing a free online
            platform serving parents, carers, and professionals across a wide range of
            complex family circumstances.
          </p>
        </Reveal>
      </CSSection>

      <CSSection title="Identity & Animation" variant="light">
        <Reveal><p style={{ lineHeight: 1.8, color: cfg.dark, marginBottom: '2rem', maxWidth: 720 }}>
          The identity was built to flex across the full range of DFH outputs: logo marks for
          digital and print, an animated logo for video content and the platform itself, and
          a suite of digital collateral templates enabling the team to produce consistently
          on-brand content across the hub's growing library of courses and resources.
        </p></Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          {['Logo Mark', 'Logo Animated', 'Colour System', 'Digital Collateral', 'Platform Assets'].map((l, i) => (
            <Reveal key={l} delay={i * 0.07}><BrandPlaceholder label={l} accent="#E0F87D" /></Reveal>
          ))}
        </div>
      </CSSection>

      <MotionStats cfg={cfg} />
      <PkgLinks cs={cs} cfg={cfg} />
      <CSCTA cat={cat} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
//  PORTFOLIO WEBSITE — Web category, slide 1
// ═══════════════════════════════════════════════════════════════════════

const PORTFOLIO_WEB_CFG = {
  accent:      '#335CFF',
  lightAccent: '#335CFF',
  dark:        '#333333',
  specs: [
    { label: 'Framework',   value: 'React 18 + Vite'  },
    { label: 'Animation',   value: 'Framer Motion'     },
    { label: 'Scrolling',   value: 'Lenis'             },
    { label: 'Styling',     value: 'Custom CSS'        },
    { label: 'Deployment',  value: 'GitHub Pages'      },
    { label: 'Font',        value: 'Raleway'           },
    { label: 'Status',      value: 'Live'              },
  ],
  stats: [
    { value: '4',       label: 'Core stack: React 18, Vite, Framer Motion, Lenis'         },
    { value: '17+',     label: 'Projects showcased across four disciplines'                },
    { value: '16',      label: 'Full case studies with custom-built views'                 },
    { value: '4',       label: 'Disciplines: Brand, Motion, Packaging, Web'               },
    { value: '100%',    label: 'Custom CSS — not a single UI framework used'              },
    { value: '5',       label: 'Brand colours in the complete system'                      },
    { value: '0',       label: 'External component libraries'                              },
    { value: '1',       label: 'Designer and developer — built solo, start to finish'     },
    { value: 'Raleway', label: 'Single typeface — three weights, all the range needed'    },
    { value: 'Glass',   label: 'Glassmorphism token system across every surface'          },
    { value: 'GitHub',  label: 'Version controlled and deployed via GitHub Pages'         },
    { value: '∞',       label: 'Iterations — and still going'                            },
  ],
}

const PORTFOLIO_WEB_STACK = [
  {
    icon: '⚛',
    name: 'React 18 + Vite',
    body: "Component-based architecture with near-instant hot reload in development. Vite's optimised production build ensures fast page loads with tree-shaken, minified output.",
  },
  {
    icon: '◎',
    name: 'Framer Motion',
    body: 'Powers every scroll-triggered reveal, page transition, and entrance animation. Custom easing curves and staggered delays give each section its own rhythm without repeating.',
  },
  {
    icon: '⌇',
    name: 'Lenis',
    body: 'Smooth, inertia-based scrolling wired into a React context. Provides the characteristic butter-feel that lets content breathe and animations land with more impact.',
  },
  {
    icon: '✦',
    name: 'Custom CSS',
    body: 'Every layout, surface, and effect is written from first principles: glass tokens, bento grids, motion curves, dark/light variants, and responsive breakpoints — no Tailwind, no Bootstrap.',
  },
]

const PORTFOLIO_WEB_HERO_INTRO_NUMS = [1, 2, 4, 5, 6]

function PortfolioWebsiteCaseStudyView({ cat, cs, slide }) {
  return (
    <div className="cs-wrap pkg-case-study">
      <MotionHero cs={cs} slide={slide} cfg={PORTFOLIO_WEB_CFG} />

      {/* Project Overview */}
      <MotionOverview cs={cs} cfg={PORTFOLIO_WEB_CFG} />

      {/* The Stack */}
      <CSSection title="The Stack" variant="dark">
        <div className="si-characters-grid">
          {PORTFOLIO_WEB_STACK.map((item, i) => (
            <Reveal key={item.name} delay={i * 0.08}>
              <div className="si-character-card" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(224,248,125,0.15)' }}>
                <div className="si-character-avatar" style={{ background: 'rgba(51,92,255,0.25)', borderColor: 'rgba(51,92,255,0.4)' }}>
                  <span style={{ fontSize: 22, lineHeight: 1 }}>{item.icon}</span>
                </div>
                <h3 className="si-character-name" style={{ color: '#E0F87D' }}>{item.name}</h3>
                <p className="si-character-bio" style={{ color: 'rgba(224,248,125,0.75)' }}>{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </CSSection>

      {/* Site Palette */}
      <CSSection title="The Palette">
        <div className="cs-palette-row">
          {STUDIO_INTRO_PALETTE.map(({ hex, name }) => (
            <div key={hex} className="cs-palette-swatch">
              <div className="cs-palette-chip" style={{ background: hex, border: hex === '#FFFFFF' ? '1px solid #e0e0e0' : 'none' }} />
              <span className="cs-palette-hex">{hex}</span>
              <span className="cs-palette-name">{name}</span>
            </div>
          ))}
        </div>
      </CSSection>

      {/* Custom Illustrations — the six characters */}
      <CSSection title="Custom Illustrations">
        <Reveal delay={0.06}>
          <p style={{ color: 'rgba(51,51,51,0.7)', lineHeight: 1.85, marginBottom: 28, maxWidth: 600 }}>
            Six original characters were created as part of the Studio KAIL 2026 rebrand and are woven through the entire site. They orbit the studio mark in the animated hero section, each appearing in turn as an introduction to the studio and its values. They reappear in the footer, anchoring the navigation links with the same warmth and personality. Together they give the portfolio a sense of continuity — the same cast, in different moments, across every page.
          </p>
        </Reveal>

        {/* All six hero-intro images on one row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginTop: 16 }}>
          <Reveal delay={0.04}>
            <WLMedia src={`${BASE}hero-intro/herointrostart.webp`} alt="Studio KAIL characters group" />
          </Reveal>
          {PORTFOLIO_WEB_HERO_INTRO_NUMS.map((n, i) => (
            <Reveal key={n} delay={0.06 + i * 0.06}>
              <WLMedia src={`${BASE}hero-intro/herointro${n}.webp`} alt={`Studio KAIL character ${n}`} />
            </Reveal>
          ))}
        </div>

        {/* Character roster */}
        <div className="si-characters-grid" style={{ marginTop: 32 }}>
          {STUDIO_INTRO_CHARACTERS.map((c, i) => (
            <Reveal key={c.name} delay={i * 0.07}>
              <div className="si-character-card">
                <div className="si-character-avatar">
                  <img src={c.img} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '999px' }} />
                </div>
                <h3 className="si-character-name" style={{ color: '#335CFF' }}>{c.name}</h3>
                <p className="si-character-bio">{c.bio}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </CSSection>

      {/* In the Site — footer images */}
      <CSSection title="In the Site" variant="dark">
        <Reveal delay={0.06}>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginBottom: 24, lineHeight: 1.7, maxWidth: 560 }}>
            The characters carry through to the footer, each appearing alongside a different navigation link — portfolio, contact, socials — so that the base of every page feels like an extension of the same world introduced at the top.
          </p>
        </Reveal>
        <div className="wl-grid-3">
          <Reveal delay={0.06}><WLMedia src={`${BASE}footer/footer-portfolio.webp`} alt="Footer · Portfolio" /></Reveal>
          <Reveal delay={0.12}><WLMedia src={`${BASE}footer/footer-contact.webp`}   alt="Footer · Contact"   /></Reveal>
          <Reveal delay={0.18}><WLMedia src={`${BASE}footer/footer-socials.webp`}   alt="Footer · Socials"   /></Reveal>
        </div>
      </CSSection>

      {/* Logo */}
      <CSSection title="The Studio Mark">
        <Reveal delay={0.08}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '32px 0' }}>
            <img
              src={`${BASE}logo.svg`}
              alt="Studio KAIL logo"
              style={{ height: 64, objectFit: 'contain' }}
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <p style={{ color: 'rgba(51,51,51,0.55)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center' }}>
              Studio KAIL · Designed in Figma · Built in React
            </p>
          </div>
        </Reveal>
      </CSSection>

      <MotionStats cfg={PORTFOLIO_WEB_CFG} />
      <CSCTA cat={cat} />
    </div>
  )
}

// ── Spurgeons: Signage ────────────────────────────────────────────────

const SPURGEONS_SIGNAGE_CFG = {
  accent: '#335CFF', lightAccent: '#335CFF', dark: '#333333',
  specs: [
    { label: 'Client',    value: 'Spurgeons'     },
    { label: 'Years',     value: '2022–2025'      },
    { label: 'Duration',  value: '3.5 Years'      },
    { label: 'Type',      value: 'Print / Signage' },
    { label: 'Scale',     value: 'Outdoor & Indoor' },
    { label: 'Status',    value: 'Ongoing'         },
  ],
  stats: [
    { value: '3.5',   label: 'Years of ongoing signage and print output for Spurgeons' },
    { value: '12+',   label: 'Individual assets across banners, posters, flags and signage' },
    { value: '4',     label: 'Distinct material types: festival banners, pull-ups, building signage, posters' },
    { value: '∞',     label: 'Community events supported through visible, on-brand presence' },
  ],
}

function SpurgeonsSignageCaseStudyView({ cat, cs, slide }) {
  const cfg = SPURGEONS_SIGNAGE_CFG
  const BASE_S = `${BASE}spurgeons-signage/`
  return (
    <div className="cs-wrap pkg-case-study">
      <PkgHero cs={cs} slide={slide} cfg={cfg} />
      <PkgOverview cs={cs} cfg={cfg} />

      {/* Festival & Event Banners */}
      <CSSection title="Festival & Event Banners" variant="dark">
        <Reveal>
          <p style={{ marginBottom: '2rem', lineHeight: 1.7 }}>
            Spurgeons attends community festivals and public events throughout the year.
            These large-format banners serve as the charity's visible presence at those moments —
            bold enough to cut through a busy outdoor environment, warm enough to invite approach.
          </p>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {['banner1.png','banner2.png','banner3.png','banner4.png'].map((f, i) => (
            <Reveal key={f} delay={i * 0.08}>
              <img
                src={`${BASE_S}${f}`}
                alt={`Festival banner ${i + 1}`}
                style={{ width: '100%', borderRadius: 12, display: 'block' }}
              />
            </Reveal>
          ))}
        </div>
      </CSSection>

      {/* Posters & Pull-ups */}
      <CSSection title="Posters & Pull-up Banners" variant="light">
        <Reveal>
          <p style={{ marginBottom: '2rem', lineHeight: 1.7, color: cfg.dark }}>
            Pull-up banners and large format posters designed for indoor events, community spaces,
            and reception areas — carrying Spurgeons' brand with clarity and confidence whether
            displayed solo or alongside other materials.
          </p>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          {['bigposter.png','bigposter_1.png','squarepull1.png'].map((f, i) => (
            <Reveal key={f} delay={i * 0.08}>
              <img
                src={`${BASE_S}${f}`}
                alt={`Poster ${i + 1}`}
                style={{ width: '100%', borderRadius: 12, display: 'block' }}
              />
            </Reveal>
          ))}
        </div>
      </CSSection>

      {/* Building & Location Signage */}
      <CSSection title="Building & Location Signage" variant="dark">
        <Reveal>
          <p style={{ marginBottom: '2rem', lineHeight: 1.7 }}>
            Permanent and semi-permanent signage for Spurgeons' physical locations — from
            neighbourhood-specific banners to large building-mounted graphics that establish
            the charity's presence in the communities it serves.
          </p>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {['HodgeHillBanner.png','WaltonSignage_8x25.png'].map((f, i) => (
            <Reveal key={f} delay={i * 0.08}>
              <img
                src={`${BASE_S}${f}`}
                alt={`Location signage ${i + 1}`}
                style={{ width: '100%', borderRadius: 12, display: 'block' }}
              />
            </Reveal>
          ))}
        </div>
      </CSSection>

      {/* Flags & Digital */}
      <CSSection title="Flags & Digital Assets" variant="light">
        <Reveal>
          <p style={{ marginBottom: '2rem', lineHeight: 1.7, color: cfg.dark }}>
            Outdoor flags and social media graphics rounding out the suite — ensuring
            Spurgeons is visible whether at a street-level event or across an Instagram feed.
          </p>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          {['flag1.png','flag2.png','ig.png'].map((f, i) => (
            <Reveal key={f} delay={i * 0.08}>
              <img
                src={`${BASE_S}${f}`}
                alt={`Flag / digital asset ${i + 1}`}
                style={{ width: '100%', borderRadius: 12, display: 'block' }}
              />
            </Reveal>
          ))}
        </div>
      </CSSection>

      <MotionStats cfg={cfg} />
      <CSCTA cat={cat} />
    </div>
  )
}

// ── Spurgeons: Merch ──────────────────────────────────────────────────

const SPURGEONS_MERCH_CFG = {
  accent: '#335CFF', lightAccent: '#D4C7FF', dark: '#333333',
  specs: [
    { label: 'Client',   value: 'Spurgeons'             },
    { label: 'Years',    value: '2023–2025'              },
    { label: 'Type',     value: 'Merch / Apparel'        },
    { label: 'Items',    value: 'Totes, Tees, Vests'     },
    { label: 'Status',   value: 'Ongoing'                },
  ],
  stats: [
    { value: '3+',   label: 'Apparel types: tote bags, t-shirts, running vests' },
    { value: '∞',    label: 'Supporters wearing Spurgeons at events and marathons' },
    { value: '100%', label: 'On-brand across every piece — nothing generic' },
  ],
}

// Placeholder tile component
function MerchPlaceholder({ label, aspect = '1 / 1' }) {
  return (
    <div style={{
      aspectRatio: aspect,
      background: 'rgba(212,199,255,0.18)',
      border: '1.5px dashed rgba(212,199,255,0.45)',
      borderRadius: 12,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 8,
      padding: '1.5rem',
      textAlign: 'center',
    }}>
      <span style={{ fontSize: '2rem', opacity: 0.4 }}>📷</span>
      <span style={{ fontSize: '0.8rem', opacity: 0.55, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
    </div>
  )
}

function SpurgeonsMerchCaseStudyView({ cat, cs, slide }) {
  const cfg = SPURGEONS_MERCH_CFG
  return (
    <div className="cs-wrap pkg-case-study">
      <PkgHero cs={cs} slide={slide} cfg={cfg} />
      <PkgOverview cs={cs} cfg={cfg} />

      {/* Tote Bags */}
      <CSSection title="Tote Bags" variant="light">
        <Reveal>
          <p style={{ marginBottom: '2rem', lineHeight: 1.7, color: cfg.dark }}>
            Everyday carry with purpose. Spurgeons tote bags put the charity's brand in
            the hands of supporters, volunteers, and families — a simple thing that travels
            far and says a lot about who Spurgeons is in the community.
          </p>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          {['Tote — Front', 'Tote — Back', 'Tote — Detail'].map((l, i) => (
            <Reveal key={l} delay={i * 0.08}><MerchPlaceholder label={l} /></Reveal>
          ))}
        </div>
      </CSSection>

      {/* T-Shirts */}
      <CSSection title="T-Shirts" variant="dark">
        <Reveal>
          <p style={{ marginBottom: '2rem', lineHeight: 1.7 }}>
            Staff, volunteers, and event crews wearing Spurgeons on their backs. Clean,
            comfortable, and unmistakably on-brand — designed to work as uniform and as
            something people actually want to put on.
          </p>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          {['T-Shirt — Front', 'T-Shirt — Back', 'T-Shirt — Detail'].map((l, i) => (
            <Reveal key={l} delay={i * 0.08}><MerchPlaceholder label={l} /></Reveal>
          ))}
        </div>
      </CSSection>

      {/* Marathon Vests */}
      <CSSection title="Marathon Running Vests" variant="light">
        <Reveal>
          <p style={{ marginBottom: '2rem', lineHeight: 1.7, color: cfg.dark }}>
            Spurgeons fields runners in sponsored marathons to raise funds and awareness.
            These vests carry the charity's name across the finish line — designed for
            performance and visibility, keeping supporters proud to race in Spurgeons colours.
          </p>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          {['Vest — Front', 'Vest — Back', 'Vest — On the Run'].map((l, i) => (
            <Reveal key={l} delay={i * 0.08}><MerchPlaceholder label={l} aspect="2 / 3" /></Reveal>
          ))}
        </div>
      </CSSection>

      <MotionStats cfg={cfg} />
      <CSCTA cat={cat} />
    </div>
  )
}

// ── Spurgeons: Course Portal ──────────────────────────────────────────

const SPURGEONS_PORTAL_CFG = {
  accent: '#335CFF', lightAccent: '#335CFF', dark: '#333333',
  specs: [
    { label: 'Client',    value: 'Spurgeons'       },
    { label: 'Year',      value: '2024'            },
    { label: 'Type',      value: 'UX / UI Redesign' },
    { label: 'Tool',      value: 'Figma'           },
    { label: 'Testing',   value: 'User Testing'    },
    { label: 'Status',    value: 'Delivered'       },
  ],
  stats: [
    { value: '80%',  label: 'Of users found the redesigned sign-on page easier to use in testing' },
    { value: '1',    label: 'Key friction point identified and resolved: the sign-on flow' },
    { value: '100%', label: 'Custom UI — no off-the-shelf component library' },
    { value: '∞',    label: 'Families and professionals now able to access Spurgeons courses with less friction' },
  ],
}

function SpurgeonsCoursePortalCaseStudyView({ cat, cs, slide }) {
  const cfg = SPURGEONS_PORTAL_CFG
  return (
    <div className="cs-wrap pkg-case-study">
      <PkgHero cs={cs} slide={slide} cfg={cfg} />
      <PkgOverview cs={cs} cfg={cfg} />

      {/* The Problem */}
      <CSSection title="The Problem" variant="dark">
        <Reveal>
          <p style={{ lineHeight: 1.8, maxWidth: 720 }}>
            Spurgeons' online course portal was generating consistent complaints: users were
            struggling to sign on, losing access to courses they'd already paid for, and
            dropping off before completing registration. The interface was functional but
            unintuitive — form fields were unclear, error states were unhelpful, and the
            overall visual design felt cold and clinical for an organisation built on warmth
            and community.
          </p>
        </Reveal>
      </CSSection>

      {/* User Testing */}
      <CSSection title="User Testing" variant="light">
        <Reveal>
          <p style={{ lineHeight: 1.8, color: cfg.dark, marginBottom: '2rem', maxWidth: 720 }}>
            Before touching a single pixel, the studio ran user testing sessions with a
            representative sample of Spurgeons' actual course users — parents, carers, and
            professionals. Participants were asked to complete common tasks: find a course,
            create an account, and sign back in after a break. The sessions were observed and
            recorded to identify where confusion entered the flow and at what point users gave up.
          </p>
          <p style={{ lineHeight: 1.8, color: cfg.dark, marginBottom: '2rem', maxWidth: 720 }}>
            The findings were clear: the sign-on screen was the single biggest source of
            friction. Users were unsure whether they needed to create an account or had one
            already, the password requirements were hidden until after submission, and the
            visual hierarchy gave no indication of where to start.
          </p>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginTop: '1rem' }}>
          {['Testing Session Notes', 'User Flow Map', 'Drop-off Points'].map((l, i) => (
            <Reveal key={l} delay={i * 0.08}>
              <div style={{
                aspectRatio: '4/3',
                background: 'rgba(51,92,255,0.08)',
                border: '1.5px dashed rgba(51,92,255,0.3)',
                borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 8, padding: '1.5rem', textAlign: 'center',
              }}>
                <span style={{ fontSize: '1.8rem', opacity: 0.35 }}>📋</span>
                <span style={{ fontSize: '0.78rem', opacity: 0.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: cfg.dark }}>{l}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </CSSection>

      {/* The Redesign */}
      <CSSection title="The Redesign" variant="dark">
        <Reveal>
          <p style={{ lineHeight: 1.8, marginBottom: '2rem', maxWidth: 720 }}>
            With the pain points mapped, the interface was redesigned from scratch in Figma.
            The sign-on screen received the most attention: a clear visual split between
            "new user" and "returning user" journeys, inline validation with helpful (not
            punishing) error messages, and a warmer visual language that aligned with
            Spurgeons' identity rather than feeling like a generic SaaS login form.
          </p>
          <p style={{ lineHeight: 1.8, marginBottom: '2.5rem', maxWidth: 720 }}>
            The wider portal UI was also refreshed — updated typography, improved colour
            contrast for accessibility, clearer course cards with progress indicators, and
            a navigation structure that surfaces the most common tasks immediately.
          </p>
        </Reveal>
        {/* Figma Embed */}
        <Reveal>
          <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)' }}>
            <iframe
              style={{ border: 'none', display: 'block' }}
              width="100%"
              height="450"
              src="https://embed.figma.com/proto/LZmViGkPxNh7X1w2u8yw7M/Sign-On-Screen?node-id=1-4&embed-host=share"
              allowFullScreen
              title="Spurgeons Course Portal — Sign On Screen"
            />
          </div>
        </Reveal>
      </CSSection>

      {/* Before / After placeholders */}
      <CSSection title="Before & After" variant="light">
        <Reveal>
          <p style={{ lineHeight: 1.8, color: cfg.dark, marginBottom: '2rem', maxWidth: 720 }}>
            Side-by-side comparison of the original sign-on screen versus the redesigned version,
            highlighting the hierarchy, label clarity, and visual warmth changes.
          </p>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          {['Before', 'After'].map((l, i) => (
            <Reveal key={l} delay={i * 0.1}>
              <div style={{
                aspectRatio: '4/3',
                background: i === 0 ? 'rgba(51,92,255,0.06)' : 'rgba(51,92,255,0.14)',
                border: `1.5px dashed rgba(51,92,255,${i === 0 ? 0.2 : 0.4})`,
                borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 8,
              }}>
                <span style={{ fontSize: '1.8rem', opacity: 0.35 }}>🖥</span>
                <span style={{ fontSize: '0.9rem', opacity: 0.55, letterSpacing: '0.05em', textTransform: 'uppercase', color: cfg.dark }}>{l}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </CSSection>

      {/* Result */}
      <CSSection title="The Result" variant="dark">
        <Reveal>
          <p style={{ lineHeight: 1.8, maxWidth: 720 }}>
            A second round of user testing with the redesigned interface showed that
            <strong style={{ color: '#E0F87D' }}> 80% of participants found the sign-on page
            easier to use</strong> — a significant improvement from the baseline. The redesign
            reduced drop-off at the most critical point in the user journey and gave Spurgeons
            a portal that reflects their values: warm, accessible, and built around the people
            who use it.
          </p>
        </Reveal>
      </CSSection>

      <MotionStats cfg={cfg} />
      <CSCTA cat={cat} />
    </div>
  )
}

// ── Spurgeons: Flyers & Posters ──────────────────────────────────────

const SPURGEONS_FLYERS_CFG = {
  accent: '#335CFF', lightAccent: '#335CFF', dark: '#333333',
  specs: [
    { label: 'Client',   value: 'Spurgeons'              },
    { label: 'Years',    value: '2022–2025'               },
    { label: 'Type',     value: 'Print / Editorial'       },
    { label: 'Formats',  value: 'A5 · A4 · A3 · A2'      },
    { label: 'Status',   value: 'Ongoing'                 },
  ],
  stats: [
    { value: '3+',  label: 'Years of ongoing flyer and poster output for Spurgeons' },
    { value: '∞',   label: 'Families, carers and professionals reached through print' },
    { value: '100%', label: 'On-brand across every format and campaign' },
    { value: '4',   label: 'Distinct audiences addressed: families, professionals, communities, funders' },
  ],
}

function PrintPlaceholder({ label, aspect = '3 / 4' }) {
  return (
    <div style={{
      aspectRatio: aspect,
      background: 'rgba(240,228,200,0.18)',
      border: '1.5px dashed rgba(240,228,200,0.45)',
      borderRadius: 12,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 8,
      padding: '1.5rem',
      textAlign: 'center',
    }}>
      <span style={{ fontSize: '2rem', opacity: 0.4 }}>🖨</span>
      <span style={{ fontSize: '0.75rem', opacity: 0.5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
    </div>
  )
}

function SpurgeonsFlyersCaseStudyView({ cat, cs, slide }) {
  const cfg = SPURGEONS_FLYERS_CFG
  return (
    <div className="cs-wrap pkg-case-study">
      <PkgHero cs={cs} slide={slide} cfg={cfg} />
      <PkgOverview cs={cs} cfg={cfg} />

      {/* Course & Service Flyers */}
      <CSSection title="Course & Service Flyers" variant="dark">
        <Reveal>
          <p style={{ marginBottom: '2rem', lineHeight: 1.7 }}>
            Single-sheet A5 and A4 flyers promoting Spurgeons' courses and services to
            families and professionals. Designed to live in waiting rooms, community hubs,
            and GP surgeries — clear enough to read at a glance, warm enough to actually
            pick up.
          </p>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.25rem' }}>
          {['Course Flyer — A5', 'Course Flyer — A5', 'Service Flyer — A4', 'Service Flyer — A4'].map((l, i) => (
            <Reveal key={l + i} delay={i * 0.07}>
              <PrintPlaceholder label={l} />
            </Reveal>
          ))}
        </div>
      </CSSection>

      {/* Campaign Posters */}
      <CSSection title="Campaign Posters" variant="light">
        <Reveal>
          <p style={{ marginBottom: '2rem', lineHeight: 1.7, color: cfg.dark }}>
            Larger-format posters designed for community noticeboards, event spaces, and
            public-facing displays. Campaign work often sits alongside Spurgeons' wider
            awareness drives — so these need to carry the message independently and hold
            their own at a distance.
          </p>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          {['A3 Poster', 'A3 Poster', 'A2 Poster'].map((l, i) => (
            <Reveal key={l + i} delay={i * 0.08}>
              <PrintPlaceholder label={l} aspect="2 / 3" />
            </Reveal>
          ))}
        </div>
      </CSSection>

      {/* Awareness & Campaign Materials */}
      <CSSection title="Awareness & Campaign Materials" variant="dark">
        <Reveal>
          <p style={{ marginBottom: '2rem', lineHeight: 1.7 }}>
            One-off and seasonal campaign pieces: awareness days, fundraising drives,
            and community initiatives. Each designed to feel timely and relevant while
            staying unmistakably Spurgeons — consistent enough to be trusted, human enough
            to be felt.
          </p>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
          {['Campaign — A4', 'Campaign — A5', 'Campaign — Square', 'Campaign — A4'].map((l, i) => (
            <Reveal key={l + i} delay={i * 0.07}>
              <PrintPlaceholder label={l} aspect={l.includes('Square') ? '1 / 1' : '3 / 4'} />
            </Reveal>
          ))}
        </div>
      </CSSection>

      <MotionStats cfg={cfg} />
      <CSCTA cat={cat} />
    </div>
  )
}

function CaseStudyView({ cat, slide }) {
  const cs = slide.caseStudy
  if (cat.id === 'packaging') {
    if (slide.id === 1) return <WoodcoCaseStudyView    cat={cat} cs={cs} slide={slide} />
    if (slide.id === 2) return <LTRCaseStudyView       cat={cat} cs={cs} slide={slide} />
    if (slide.id === 3) return <OCCaseStudyView        cat={cat} cs={cs} slide={slide} />
    if (slide.id === 4) return <SBCaseStudyView        cat={cat} cs={cs} slide={slide} />
    if (slide.id === 5) return <SpurgeonsSignageCaseStudyView cat={cat} cs={cs} slide={slide} />
    if (slide.id === 6) return <SpurgeonsMerchCaseStudyView   cat={cat} cs={cs} slide={slide} />
    if (slide.id === 7) return <SpurgeonsFlyersCaseStudyView  cat={cat} cs={cs} slide={slide} />
  }
  if (cat.id === 'motion') {
    if (slide.id === 1) return <StudioIntroCaseStudyView  cat={cat} cs={cs} slide={slide} />
    if (slide.id === 2) return <SpurgeonsEDCaseStudyView  cat={cat} cs={cs} slide={slide} />
    if (slide.id === 4) return <GeometricCaseStudyView    cat={cat} cs={cs} slide={slide} />
    if (slide.id === 5) return <StepsCaseStudyView        cat={cat} cs={cs} slide={slide} />
    if (slide.id === 6) return <AtoZCaseStudyView         cat={cat} cs={cs} slide={slide} />
    if (slide.id === 7) return <BloomCaseStudyView                   cat={cat} cs={cs} slide={slide} />
    if (slide.id === 8) return <WellLabCaseStudyView                 cat={cat} cs={cs} slide={slide} />
    if (slide.id === 9)  return <SpurgeonsCounsellingCaseStudyView cat={cat} cs={cs} slide={slide} />
    if (slide.id === 10) return <SpurgeonsPASCaseStudyView     cat={cat} cs={cs} slide={slide} />
    if (slide.id === 11) return <SpurgeonsConnectCaseStudyView cat={cat} cs={cs} slide={slide} />
  }
  if (cat.id === 'web' && slide.id === 1) return <PortfolioWebsiteCaseStudyView    cat={cat} cs={cs} slide={slide} />
  if (cat.id === 'web' && slide.id === 2) return <SpurgeonsCoursePortalCaseStudyView cat={cat} cs={cs} slide={slide} />
  if (cat.id === 'brand' && slide.id === 2) return <PGMCaseStudyView           cat={cat} cs={cs} slide={slide} />
  if (cat.id === 'brand' && slide.id === 3) return <PreschoolsCaseStudyView      cat={cat} cs={cs} slide={slide} />
  if (cat.id === 'brand' && slide.id === 5) return <InvisibleWallsCaseStudyView cat={cat} cs={cs} slide={slide} />
  if (cat.id === 'brand' && slide.id === 6) return <ParentsConnectCaseStudyView cat={cat} cs={cs} slide={slide} />
  if (cat.id === 'brand' && slide.id === 7) return <DFHCaseStudyView            cat={cat} cs={cs} slide={slide} />
  return <CBSCaseStudyView cat={cat} cs={cs} slide={slide} />
}

// ═══════════════════════════════════════════════════════════════════════
//  MAIN OVERLAY EXPORT
// ═══════════════════════════════════════════════════════════════════════

export default function ProjectDetail({ cat, slide: initialSlide, onClose }) {
  const csSlides = cat.slides.filter(s => s.caseStudy)
  const [currentSlide, setCurrentSlide] = useState(initialSlide)
  const hasCaseStudy = Boolean(currentSlide?.caseStudy)
  const overlayRef = useRef(null)

  const currentIdx = csSlides.findIndex(s => s.id === currentSlide?.id)
  const prevSlide  = currentIdx > 0                   ? csSlides[currentIdx - 1] : null
  const nextSlide  = currentIdx < csSlides.length - 1 ? csSlides[currentIdx + 1] : null

  const navigate = (slide) => {
    setCurrentSlide(slide)
    overlayRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <motion.div
      ref={overlayRef}
      className="pd-overlay"
      data-lenis-prevent
      role="dialog"
      aria-modal="true"
      aria-label={currentSlide?.label ?? cat.name}
      {...OVERLAY}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div className="pd-sheet" {...CONTENT}>

        <header className="pd-header">
          <button className="pd-back" onClick={onClose} aria-label="Close">&#8592; Back</button>
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Studio KAIL" className="pd-header-logo" />
          <button className="pd-close" onClick={onClose} aria-label="Close">&#215;</button>
        </header>

        {!hasCaseStudy && (
          <div className="pd-hero">
            <h1 className="pd-title">{cat.name}</h1>
            <p className="pd-tagline">{cat.tagline}</p>
          </div>
        )}

        {hasCaseStudy ? (
          <CaseStudyView cat={cat} slide={currentSlide} />
        ) : (
          <motion.div className="pd-grid-8" initial="initial" animate="animate" exit="exit">
            <VisualCard       cat={cat} />
            <DarkIntroCard    cat={cat} />
            <DeliverablesCard cat={cat} />
            <AboutCard        cat={cat} />
            <ScopeCard        cat={cat} />
            <StatLightCard    cat={cat} />
            <StatDarkCard     cat={cat} />
            <CtaCard          cat={cat} />
          </motion.div>
        )}

        {hasCaseStudy && csSlides.length > 1 && (
          <div className="pd-project-nav">
            {prevSlide ? (
              <button className="pd-pnav-float pd-pnav-float--prev" onClick={() => navigate(prevSlide)} aria-label={`Previous: ${prevSlide.label}`}>
                <span className="pd-pnav-arrow">&#8592;</span>
                <span className="pd-pnav-text">
                  <span className="pd-pnav-eyebrow">Previous</span>
                  <span className="pd-pnav-label">{prevSlide.label}</span>
                </span>
              </button>
            ) : <span />}
            {nextSlide ? (
              <button className="pd-pnav-float pd-pnav-float--next" onClick={() => navigate(nextSlide)} aria-label={`Next: ${nextSlide.label}`}>
                <span className="pd-pnav-text">
                  <span className="pd-pnav-eyebrow">Next</span>
                  <span className="pd-pnav-label">{nextSlide.label}</span>
                </span>
                <span className="pd-pnav-arrow">&#8594;</span>
              </button>
            ) : <span />}
          </div>
        )}

      </motion.div>
    </motion.div>
  )
}