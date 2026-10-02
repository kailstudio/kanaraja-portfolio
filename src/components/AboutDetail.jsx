/**
 * AboutDetail.jsx — "About" overlay, opened from the site menu
 *
 * Reuses the project-detail shell (.pd-overlay / .pd-sheet / .pd-header) and
 * the case-study glass sections (.cs-wrap .cs-section), so it reads as one
 * more page in the same system as the projects. Page-specific styles are the
 * .about-* rules at the end of styles.css.
 *
 * All copy below comes from the CV — edit the constants to update the page.
 */

import { motion } from 'framer-motion'
import { Reveal, CSSection, CSCTA } from './ProjectDetail.jsx'
import { CATEGORIES } from './PortfolioSection.jsx'

const BASE = import.meta.env.BASE_URL

// ── Transitions (same as ProjectDetail) ──────────────────────────────
const OVERLAY = {
  initial: { opacity: 0, pointerEvents: 'none' },
  animate: { opacity: 1, pointerEvents: 'auto', transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, pointerEvents: 'none', transition: { duration: 0.26, ease: [0.4, 0, 0.2, 1] } },
}

const CONTENT = {
  initial: { opacity: 0, y: 24, scale: 0.97, filter: 'blur(8px)' },
  animate: { opacity: 1, y:  0, scale: 1.00, filter: 'blur(0px)',
             transition: { duration: 0.44, ease: [0.16, 1, 0.3, 1], delay: 0.06 } },
  exit:    { opacity: 0, y: 10, scale: 0.98, filter: 'blur(6px)',
             transition: { duration: 0.26, ease: [0.4, 0, 0.2, 1] } },
}

// ── Content ──────────────────────────────────────────────────────────
const HERO_PILLS = ['Brand', 'Motion', 'UI Design', 'Digital Products']

const SUMMARY =
  'Creative digital designer with an engineering background and over six years of experience delivering user-focused products. Experienced in developing brand principles and assets, animations, user interface elements, and digital products from concept to launch.'

// `link` is [category id, slide id] of the matching case study in CATEGORIES.
// `linkLabel` overrides the button text (default: "View case study").
// `highlights` is a row of link pills, each opening a case study.
const EXPERIENCE = [
  {
    role:  'Digital Designer',
    org:   'Spurgeons',
    dates: 'May 2023 – Present',
    points: [
      'Design and deliver a range of digital products supporting families across the UK.',
      'Lead the full creative process, including research, prototyping, UI design, testing, and implementation, ensuring accessibility and alignment with the organisation’s values.',
    ],
    projects: [
      {
        name: 'Disordered Eating Toolkit',
        body: 'Designed the user interface and produced all animations and digital publications in collaboration with healthcare specialists.',
        link: ['motion', 2],
        linkLabel: 'View animations',
      },
      {
        name: 'Parenting Courses',
        body: 'Developed interactive course materials, including animations and user journeys for parenting programmes, improving engagement and learning outcomes.',
        link: ['motion', 11],
        linkLabel: 'View animations',
      },
      {
        name: 'Digital Family Hub',
        body: 'Led the design and development of online resources, applying user research and accessibility principles to improve navigation and create a consistent experience across services.',
        link: ['brand', 7],
        linkLabel: 'View branding case study',
      },
      {
        name: 'Support Platform',
        note: 'Prototype',
        body: 'Designed and built a clickable prototype in two days, turning a product definition paper into something leadership and testers can use. It helps practitioners find and share quality-assured resources with families, and gives each family a private space to return to them.',
        link: ['web', 3],
      },
    ],
  },
  {
    role:  'Junior Designer',
    org:   'Swingers',
    dates: 'Jun 2022 – Mar 2023',
    points: [
      'Coordinated design briefs across multiple departments to maintain consistency and efficient workflows.',
      'Produced digital and print assets including social media animations, event materials, and brand guidelines.',
      'Liaised with suppliers and ensured brand alignment across marketing and internal communications.',
    ],
  },
  {
    role:  'Freelance Designer',
    org:   'Studio KAIL',
    dates: 'Jun 2019 – Present',
    points: [
      'Established and managed an independent design studio delivering over 100 projects for international clients.',
      'Oversaw branding, digital presence, and creative strategy from concept through to delivery.',
    ],
    highlights: [
      { label: 'Portfolio Website', link: ['web', 1] },
      { label: 'Studio Intro',      link: ['motion', 1] },
      { label: 'PGM',               link: ['brand', 2] },
      { label: 'Well Lab',          link: ['motion', 8] },
    ],
  },
]

const SKILLS = [
  {
    title: 'Design + AI',
    items: ['Figma', 'Adobe Illustrator', 'Photoshop', 'InDesign', 'After Effects', 'Canva', 'Claude', 'Generative AI Tools'],
  },
  {
    title: 'Technical',
    items: ['HTML / CSS', 'JavaScript', 'Python', 'C++', 'Verilog', 'MATLAB'],
  },
  {
    title: 'Languages',
    items: ['English', 'Tamil', 'Korean', 'Mandarin'],
  },
]

const DEGREE = {
  title: 'BSc Engineering',
  org:   'University of Warwick',
  dates: 'Aug 2014 – Jun 2019',
  projects: [
    {
      name: 'Individual Project',
      body: 'Designed an IoT environmental quality sensor integrating hardware, software, and a cloud backend. Conducted research into optimal environmental conditions to guide sensor selection and calibration, and programmed the microcontroller in C++ to translate raw sensor data.',
    },
    {
      name: 'Engineering Business Management',
      body: 'Examined the integration of engineering principles with business strategy and operations.',
    },
    {
      name: 'Design for Function',
      body: 'Focused on the application of engineering and design principles to develop solutions that effectively meet user and performance requirements.',
    },
  ],
}

const A_LEVELS = {
  title: 'A Levels',
  org:   'Duff Miller College',
  dates: 'Sep 2011 – Jul 2013',
  subjects: ['Maths', 'Economics', 'English Literature', 'Further Maths'],
}

const COURSES = [
  { provider: 'Google',                 name: 'UX Design' },
  { provider: 'IBM',                    name: 'Generative AI for UI/UX Design' },
  { provider: 'Anthropic',              name: 'AI Fluency: Framework & Foundations' },
  { provider: 'IBM',                    name: 'Introduction to HTML, CSS, & JavaScript' },
  { provider: 'University of Colorado', name: 'Packaging Design for the Circular Economy' },
]

// Resolve a [category id, slide id] pair to the real objects ProjectDetail expects.
function findProject([catId, slideId]) {
  const cat   = CATEGORIES.find((c) => c.id === catId)
  const slide = cat?.slides.find((s) => s.id === slideId)
  return cat && slide?.caseStudy ? { cat, slide } : null
}

// ── Sections ─────────────────────────────────────────────────────────
function AboutHero() {
  return (
    <CSSection className="about-hero">
      <div className="about-hero-grid">
        <div className="about-hero-copy">
          <Reveal delay={0.04}>
            <div className="cs-hero-pills">
              {HERO_PILLS.map((t) => (
                <span key={t} className="cs-hero-pill about-pill">{t}</span>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="cs-hero-title about-hero-title">Kana Raja</h1>
            <p className="about-hero-role">Digital Designer</p>
            <p className="about-hero-lede">{SUMMARY}</p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="cs-hero-status about-hero-status">
              <span className="cs-status-dot" />
              <span className="cs-status-text">Digital Designer at Spurgeons · Freelance at Studio KAIL</span>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.14} className="about-portrait">
          <div className="about-portrait-frame">
            <img src={`${BASE}headshot.jpeg`} alt="Portrait of Kana Raja" width="400" height="400" />
          </div>
          <div className="about-float about-float--a"><strong>6+</strong><span>years in design</span></div>
          <div className="about-float about-float--b"><strong>100+</strong><span>freelance projects</span></div>
        </Reveal>
      </div>
    </CSSection>
  )
}

function AboutExperience({ onOpen }) {
  return (
    <CSSection title="Design Experience">
      <div className="about-timeline">
        {EXPERIENCE.map(({ role, org, dates, points, projects, highlights }, i) => (
          <Reveal key={org} delay={0.06 + i * 0.06} className="about-role">
            <div className="about-role-meta">
              <span className="about-eyebrow">{dates}</span>
              <span className="about-role-org">{org}</span>
            </div>
            <div className="cs-bc about-card">
              <h3 className="cs-bc-head">{role}</h3>
              <ul className="about-list">
                {points.map((p) => <li key={p}>{p}</li>)}
              </ul>
              {projects && (
                <>
                  <span className="about-eyebrow about-eyebrow--muted about-sub">Relevant projects</span>
                  <div className="about-projects">
                    {projects.map(({ name, note, body, link, linkLabel }) => {
                      const target = link && findProject(link)
                      return (
                        <div key={name} className="about-proj">
                          <h4 className="about-proj-name">
                            {name}
                            {note && <span className="about-proj-note">{note}</span>}
                          </h4>
                          <p className="about-proj-body">{body}</p>
                          {target && (
                            <button className="about-proj-link" onClick={() => onOpen(target.cat, target.slide)}>
                              {linkLabel ?? 'View case study'} <span aria-hidden="true">&#8594;</span>
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
              {highlights && (
                <>
                  <span className="about-eyebrow about-eyebrow--muted about-sub">Highlighted projects</span>
                  <div className="about-links">
                    {highlights.map(({ label, link }) => {
                      const target = findProject(link)
                      return target && (
                        <button key={label} className="about-proj-link" onClick={() => onOpen(target.cat, target.slide)}>
                          {label} <span aria-hidden="true">&#8594;</span>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </CSSection>
  )
}

function AboutSkills() {
  return (
    <CSSection title="Skills" variant="dark">
      <div className="about-skills">
        {SKILLS.map(({ title, items }, i) => (
          <Reveal key={title} delay={0.06 + i * 0.08} className="about-skill-card">
            <span className="about-eyebrow about-eyebrow--lime">{title}</span>
            <div className="about-chips">
              {items.map((s) => <span key={s} className="about-chip">{s}</span>)}
            </div>
          </Reveal>
        ))}
      </div>
    </CSSection>
  )
}

function AboutEducation() {
  return (
    <CSSection title="Education" className="cs-tone--lilac">
      <div className="about-edu-grid">
        <Reveal delay={0.06} className="cs-bc about-card">
          <span className="about-eyebrow">{DEGREE.dates}</span>
          <h3 className="cs-bc-head">{DEGREE.title}</h3>
          <p className="cs-bc-sub">{DEGREE.org}</p>
          <span className="about-eyebrow about-eyebrow--muted about-sub">Relevant projects</span>
          <ul className="about-list about-list--stacked">
            {DEGREE.projects.map(({ name, body }) => (
              <li key={name}><strong>{name}</strong>{body}</li>
            ))}
          </ul>
        </Reveal>

        <div className="about-edu-side">
          <Reveal delay={0.12} className="cs-bc about-card">
            <span className="about-eyebrow">{A_LEVELS.dates}</span>
            <h3 className="cs-bc-head">{A_LEVELS.title}</h3>
            <p className="cs-bc-sub">{A_LEVELS.org}</p>
            <div className="about-chips">
              {A_LEVELS.subjects.map((s) => <span key={s} className="about-chip about-chip--light">{s}</span>)}
            </div>
          </Reveal>

          <Reveal delay={0.18} className="cs-bc about-card">
            <span className="about-eyebrow">Professional courses</span>
            <ul className="about-courses">
              {COURSES.map(({ provider, name }) => (
                <li key={name}>
                  <span className="about-course-name">{name}</span>
                  <span className="about-course-provider">{provider}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </CSSection>
  )
}

// ═══════════════════════════════════════════════════════════════════════
//  MAIN OVERLAY EXPORT
// ═══════════════════════════════════════════════════════════════════════

export default function AboutDetail({ onClose, onProjectOpen }) {
  return (
    <motion.div
      className="pd-overlay"
      data-lenis-prevent
      role="dialog"
      aria-modal="true"
      aria-label="About Kana Raja"
      {...OVERLAY}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div className="pd-sheet" {...CONTENT}>

        <header className="pd-header">
          <button className="pd-back" onClick={onClose} aria-label="Close">&#8592; Back</button>
          <img src={`${BASE}logo.svg`} alt="Studio KAIL" className="pd-header-logo" />
          <button className="pd-close" onClick={onClose} aria-label="Close">&#215;</button>
        </header>

        <div className="cs-wrap about-cs">
          <AboutHero />
          <AboutExperience onOpen={onProjectOpen} />
          <AboutSkills />
          <AboutEducation />
          <CSCTA lineOne="Have a project" lineTwo="in mind?" />
        </div>

      </motion.div>
    </motion.div>
  )
}
