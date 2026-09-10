/**
 * PortfolioSection.jsx
 *
 * Left column: headline → subtitle → body → accordion category pills.
 * Each pill expands a RAF-driven infinite auto-scroll carousel.
 * Cards: lime / lilac alternating, oval image, tag chips, bordered title pill.
 * Mobile: native horizontal swipe, no auto-scroll.
 */

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { motion, useMotionValue, LayoutGroup } from 'framer-motion'
import { TextRotate } from './TextRotate'

// ── Carousel constants ───────────────────────────────────────────────
const CARD_W    = 210   // px: card width inside the track
const CARD_GAP  = 12    // px: gap between cards
const SPEED_PPS = 24    // px/s ≈ one card every 8–9 s

// ── Brand colour classes (tints applied via CSS on glass cards) ──────
// Even → lilac tint  |  Odd → blue tint

// Converts hex → rgba for tinted oval placeholders
function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// ── Category + project data ──────────────────────────────────────────
export const CATEGORIES = [
  {
    id: 'brand',
    name: 'Brand Strategy, Voice & Identity',
    tagline: 'Purposeful identity for organisations that mean what they say.',
    description:
      'We craft brand foundations for mission-driven organisations: building positioning, visual identity, messaging architecture, and tone of voice into cohesive systems that scale across every touchpoint and stand the test of time.',
    accent: '#C4B8F0',
    accentDark: '#7050d8',
    stats: [
      { label: 'Brands Developed', value: '2+' },
      { label: 'Mission Alignment', value: '100%' },
      { label: 'Repeat Clients',   value: '✦' },
    ],
    slides: [
      {
        id: 6, bg: '#D4C7FF', img: 'projects/parents-connect.jpg', label: 'Parents Connect',
        tags: ['Logo', 'Animated Logo', 'Digital Collateral'],
        caseStudy: {
          subtitle: 'Logo · Animated Logo · Digital Collateral',
          year: '2023',
          duration: 'Completed',
          status: 'Live',
          client: 'Spurgeons',
          website: 'https://spurgeons.org/resources-and-courses/courses/parents-connect/',
          sections: [
            {
              id: 'overview',
              title: 'Project Overview',
              body: `Parents Connect is Spurgeons' suite of three ready-to-run parenting courses, equipping church and community volunteers to support families through different life stages, covering primary years, the teenage years, and neurodiversity. Each course comes with complete facilitator materials and expert-led video content.\n\nStudio KAIL designed the Parents Connect identity: a logo that communicates warmth and accessibility, an animated version for use in digital and video contexts, and a suite of digital collateral ensuring the brand carries consistently across course materials, social media, and promotional content.`,
            },
          ],
        },
      },
      {
        id: 3, bg: '#F9D48B', img: 'projects/spurgeons-preschools.jpg', label: 'Spurgeons: Preschools',
        tags: ['Logo', 'Brand Identity', 'Collateral'],
        caseStudy: {
          subtitle: 'Logo · Brand Sheet · Collateral · Signage',
          year: '2022',
          duration: 'Ongoing',
          status: 'Now Closed',
          client: 'Spurgeons',
          website: 'https://spurgeons.org/how-we-help/family-life/early-years-and-family-support/buttons-preschools/',
          sections: [
            {
              id: 'overview',
              title: 'Project Overview',
              body: `Spurgeons runs a family of Ofsted-rated early years settings across Kent. Studio KAIL developed brand identities for two of their preschools: Buttons, with sites in Maidstone and Ramsgate, and Little Lambs, a community setting that has since closed.\n\nBoth brands were built to feel genuinely warm and child-centred without tipping into the generic: a mark, colour system, and collateral suite that parents and carers could trust at first glance.`,
            },
          ],
        },
      },

      {
        id: 1, bg: '#C4B8F0', img: 'projects/cbs.webp', label: 'Care-Based Safety',
        tags: ['Brand Strategy', 'Visual Identity', 'Tone of Voice'],
        caseStudy: {
          subtitle: 'Brand Strategy · Visual Identity · Tone of Voice',
          year: '2024',
          duration: '1 month',
          location: 'Washtenaw County, Michigan',
          status: 'Completed: organisation closed before launch',
          sections: [
            {
              id: 'overview',
              label: '01',
              title: 'Project Overview',
              body: `Care-Based Safety was a community-rooted organisation operating in Washtenaw County, Michigan: building and advocating for non-police crisis response, prevention-first systems, and community-led approaches to public safety. Grounded in abolitionist principles, CBS held a conviction that safety is fundamentally relational: something that grows through care, connection, and shared power rather than surveillance or enforcement.\n\nTheir work was urgent and necessary. But their brand hadn't yet caught up with the depth of that conviction. As CBS's advocacy grew more sophisticated and their audience more varied: from people reaching out in crisis to institutional funders to government partners: they needed an identity that could carry all of it: warmth and rigour, accessibility and credibility, community-rootedness and strategic ambition.`,
            },
            {
              id: 'brief',
              label: '02',
              title: 'The Brief',
              body: `Studio KAIL was engaged to develop a complete brand identity and visual system from the ground up, working across six structured phases: Discovery, Logo Development, Colour & Typography, Imagery & Iconography, Voice & Messaging, and Final Handover.\n\nThe brief was clear: build a brand with enough humanity to feel trustworthy to someone reaching out in a moment of crisis, enough credibility to earn the attention of funders and policy partners, and enough visual coherence to deploy consistently across every touchpoint: social, digital, print, campaign, and community resources. Success meant a brand that could communicate the same conviction, with the same integrity, across radically different rooms.`,
            },
            {
              id: 'strategy',
              label: '03',
              title: 'Research & Strategy',
              body: `The discovery phase began with a thorough review of CBS's existing materials, communications, and public presence, combined with audience and competitor research to map the landscape of peer organisations. The key insight: CBS's visual language needed to step entirely outside the iconographic vocabulary of conventional public safety: no shields, no badges, no enforcement symbols: and find a register grounded in care, growth, and collective energy instead.\n\nThree audience tiers shaped the messaging architecture. For community members and service users, the brand speaks directly, plainly, and with care: meeting people where they are. For funders, partners, and activists, it connects abolitionist values to measurable outcomes. For government agencies and more sceptical public audiences, it leads with results, framing care as common sense rather than ideology. The brand personality across all three: abolitionist, compassionate, imaginative, co-created, and trustworthy. Calm but firm. Relational, not institutional.`,
            },
            {
              id: 'visual',
              label: '04',
              title: 'Visual Identity',
              subsections: [
                {
                  title: 'The Logo',
                  body: `The creative exploration opened with two directions. Beam proposed a radiating circular form with hand-drawn expressive strokes: evoking warmth, collective energy, and care radiating outward from community. Root proposed a tree with visible roots, referencing ancestral knowledge and long-term investment in community flourishing.\n\nThe Beam direction was selected and refined into the final mark: a 16-ray sunburst built on a precise circular grid, with organic hand-drawn strokes softening the geometry. The radiating forms read simultaneously as sunbeams, flower petals, and ribbons: warmth, growth, and celebration layered into a single symbol. At the centre sits a single point: community as the source from which safety radiates outward. Beneath the expressiveness lies rigorous geometry: all proportions scaling from a single base measurement, 16 segments distributed evenly across 360°. This combination of organic mark-making and architectural precision mirrors CBS's own approach: compassion working within thoughtful frameworks to create collective safety.`,
                },
                {
                  title: 'Colour Palette',
                  body: `Four palette directions were explored, from Modern & Confident (electric blues and purples) to Ancestral & Calm (sage and warm yellows). The final selection was the Earthy & Natural palette: deep espresso (#332824) as anchor, warm cream (#F9F0E6) as the primary ground, with muted steel blue, soft mint, and warm peach completing the system. The palette communicates stability and warmth without institutional coldness: grounded and approachable, never clinical.`,
                  swatches: ['#332824', '#F9F0E6', '#86A3B3', '#B1D1CE', '#F9C595'],
                },
                {
                  title: 'Typography',
                  body: `Montserrat SemiBold carries headers with clarity and confidence. Montserrat Light handles subheadings and body text with the openness required for a 6th-grade reading level: ensuring the brand communicates equally well in a funding application and a community resource leaflet.`,
                },
                {
                  title: 'Illustration & Iconography',
                  body: `Soft, rounded character illustrations drawn in the brand palette keep visuals human and accessible. Flat forms and minimal linework avoid visual noise. Scenes centre human connection and mutual support over authority: figures portrayed with dignity, strength, and autonomy. Never as passive recipients of care. The icon system reinforces the same vocabulary: communication, partnership, health, home, growth, and advocacy, rendered with consistent warmth and purpose.`,
                },
                {
                  title: 'Photography Direction',
                  body: `Candid, community-rooted, and dignity-centred. Soft natural light, minimal staging, genuine moments of connection and ease. People are portrayed with strength and agency: never as subjects of care, always as participants within it. Place-based imagery from Washtenaw County reinforces local trust and community ownership.`,
                },
              ],
            },
            {
              id: 'applications',
              label: '05',
              title: 'Applications',
              body: `The identity was designed to scale across every surface CBS needed. Social media content (illustrated tiles, photography-led posts, campaign messaging: "Care keeps communities safe", "Safety is relational", "You deserve care, not punishment"). A responsive website built around the brand headline. Print collateral, merchandise, and community resource documents. Presentations for funders and policy partners. Each application holds the same conviction: the same warmth, the same clarity, the same belief that safety begins with care.`,
            },
            {
              id: 'outcome',
              label: '06',
              title: 'Outcome',
              body: `The project was completed in full across all six phases: brand guidelines delivered, logo system finalised, visual language codified, messaging architecture established. Care-Based Safety closed before the new identity could be launched, due to funding constraints outside the organisation's control.\n\nThe rebrand remains a complete strategic and creative work: a full brand system, built with intention, that demonstrates what it looks like when an organisation's values are translated into visual language without compromise.`,
            },
            {
              id: 'reflection',
              label: '07',
              title: 'Reflection',
              body: `This project is a reminder of what design is actually for. CBS's work asked for a visual language capable of holding real contradiction: warm enough for crisis, rigorous enough for policy, radical enough for its mission, legible enough for everyone. Meeting that brief demanded genuine stake, not just craft.\n\nIt demonstrates what becomes possible when strategy, empathy, and visual systems are built together without compromise: and continues to shape how I approach work with organisations creating real change, regardless of whether that work ever sees the light of day.`,
            },
          ],
        },
      },
      {
        id: 2, bg: '#2C365E', img: 'projects/pgm.webp', label: 'PGM',
        tags: ['Brand Strategy', 'Community Design', 'Visual Identity'],
        caseStudy: {
          subtitle: 'Brand Strategy · Visual Identity · Community Voice',
          year: '2024',
          duration: '6 Phases',
          location: 'Global',
          status: 'Delivered',
          sections: [
            {
              id: 'overview',
              label: '01',
              title: 'Project Overview',
              body: `The Participatory Grantmaking Community (PGM) is a global movement working to shift power in philanthropy by centring the knowledge and decision-making of communities. It represents a more equitable and transparent approach to funding: through peer learning, resource sharing, and advocacy, grounded in values of self-determination, accountability, care, and collective learning.\n\nPGM challenges traditional top-down systems by amplifying lived experience and supporting communities to shape the decisions that affect them, while fostering trust, openness, and continuous reflection across the sector. Its visual identity needed to be warm, human, and grounded in real environments: and its tone conversational, clear, and inclusive, speaking with communities rather than about them.`,
            },
            {
              id: 'brief',
              label: '02',
              title: 'The Brief',
              body: `Studio KAIL was engaged to develop a complete set of brand guidelines for PGM across six structured phases: Brand Discovery & Direction, Logo Refinement & Colour & Typography Systems, Imagery & Photography Style, Graphics & Iconography, Voice Messaging & Brand Applications, and Final Guidelines & Handover.\n\nThe brief demanded a visual identity that could serve an extraordinarily broad coalition: from grassroots activists and community leaders to experienced funders exploring power-sharing, to newcomers to participatory practice. The brand needed to feel simultaneously global and intimate, rigorous and warm, principled and accessible. A document that practitioners worldwide could reach for: and find themselves represented within it.`,
            },
            {
              id: 'strategy',
              label: '03',
              title: 'Research & Strategy',
              body: `The discovery phase began with an audit of PGM's existing materials, communications, and public presence, combined with research into peer organisations working across participatory philanthropy and community grantmaking. The key strategic challenge: building a brand that could speak credibly and warmly to four distinct audience segments simultaneously: activists, philanthropy professionals, industry newcomers, and social media audiences.\n\nThree audience tiers shaped the messaging architecture. For community leaders: affirming, respectful, solidarity-driven: acknowledging their leadership as powerful. For philanthropy professionals: practical, encouraging, peer-to-peer. For newcomers: it normalises experimentation and frames complexity accessibly. Across all: conversational, not corporate. Warm, not institutional. Clear, not academic. Grounded in joy and possibility.`,
            },
            {
              id: 'visual',
              label: '04',
              title: 'Visual Identity',
              subsections: [
                {
                  title: 'The Logo',
                  body: `The PGM logo symbol is built on the principles of connection, equality, and movement. It is formed by four abstract figures interlinked in a continuous circle: representing people coming together to share power and shape decisions collectively. Built on a circular structure to represent inclusivity, equality, and wholeness, with symmetrical balance creating a sense of trust, stability, and collective strength. The arms connect in a seamless rhythm to show collaboration and continuous relationship.`,
                },
                {
                  title: 'Colour Palette',
                  body: `The PGM palette is warm and grounded. Midnight Slate (#2C365E) anchors the identity with depth and authority: the gravity of principled work. Muted Teal (#4F8C8C) brings calm and connection. Burnt Orange (#E76235) introduces energy, joy, and urgency without alarm. Golden Ochre (#EBB363) adds warmth and optimism. Linen White (#F0EDE7) provides breathing room: the open, airy ground on which the community gathers.`,
                  swatches: ['#2C365E', '#4F8C8C', '#E76235', '#EBB363', '#F0EDE7'],
                },
                {
                  title: 'Typography',
                  body: `Cal Sans Regular carries headlines with warmth and a hint of informality that resists institutional coldness: a humanist display face that feels contemporary without feeling corporate. Darker Grotesque handles body text and subheadings with clarity and legibility across all reading levels. The pairing balances ambition with accessibility, reflecting PGM's commitment to speaking clearly with communities rather than at them.`,
                },
                {
                  title: 'Illustration & Graphics',
                  body: `Flat vector illustration style with minimal shading and clean, solid colour fills. Simplified geometric character forms with minimal facial detail allow for inclusive representation across age, ability, and identity. Warm, muted palette with soft contrast. Editorial, storytelling compositions focused on collaboration and community. Light, airy layouts with generous white space and soft organic accents.`,
                },
              ],
            },
            {
              id: 'applications',
              label: '05',
              title: 'Applications',
              body: `The PGM identity was designed to scale across the full range of surfaces a global community network requires. Social media content: posts, templates, and campaign graphics for community-building and sector influence. Report and document templates maintaining consistent voice and visual quality across all publications. Presentation decks for practitioners sharing knowledge. Business card and letterhead systems creating professional cohesion across a distributed team. The illustrations and graphic language extend into iconography, infographics, and editorial layouts: ensuring every touchpoint carries the same warmth and clarity as the core brand.`,
            },
            {
              id: 'outcome',
              label: '06',
              title: 'Outcome',
              body: `The project was delivered in full across all six phases: comprehensive brand guidelines completed, logo system finalised with clear variations and usage rules, colour and typography systems codified, imagery and illustration direction established, voice and messaging framework built, and brand application templates produced.\n\nPGM now has a visual identity that reflects the depth and ambition of its work: warm enough to welcome newcomers, rigorous enough for sector credibility, flexible enough to work across a genuinely global community operating across many contexts and languages. A brand that speaks with communities: not about them.`,
            },
            {
              id: 'reflection',
              label: '07',
              title: 'Reflection',
              body: `PGM asked something unusual of visual design: not simply to represent an organisation, but to embody a methodology. A brand for participatory grantmaking must itself be participatory in spirit: open, clear, accessible, and centred on the people it serves rather than the institution behind it.\n\nThe result is a visual system that practises what PGM preaches: clear language without jargon, warmth without sentimentality, ambition without hierarchy. It continues to remind me that the most powerful brand work is invisible: not because it disappears, but because it makes what matters most feel inevitable.`,
            },
          ],
        },
      },
      {
        id: 7, bg: '#335CFF', img: 'projects/dfh.png', label: 'Digital Family Hub',
        tags: ['Logo', 'Animated Logo', 'Digital Collateral'],
        caseStudy: {
          subtitle: 'Logo · Animated Logo · Digital Collateral',
          year: '2026',
          duration: 'Ongoing',
          status: 'Live',
          client: 'Spurgeons',
          website: 'https://spurgeons.org/resources-and-courses/',
          sections: [
            {
              id: 'overview',
              title: 'Project Overview',
              body: `Spurgeons' Digital Family Hub is a free online platform offering courses and downloadable resources for parents and professionals supporting children and young people, covering everything from mental health and additional needs to parenting after separation and the impact of parental imprisonment.\n\nIn 2026, the Digital Family Hub was established as its own team and Studio KAIL moved there full time from Spurgeons' central marketing function. Since conception, Studio KAIL has been the sole design presence within the team, responsible for all design work: conceiving the initial brand and logo, producing custom illustrations and animations, designing handouts and course materials, and managing all print and packaging. From the ground up, the studio designed the DFH identity and continues to lead every creative output the Hub produces.`,
            },
          ],
        },
      },

      {
        id: 5, bg: '#B8C8D8', img: 'projects/spurgeons-iw.jpg', label: 'Spurgeons: Invisible Walls',
        tags: ['Logo', 'Leaflets', 'Illustration', 'Signage'],
        caseStudy: {
          subtitle: 'Logo · Leaflets · Illustrations · Signage',
          year: '2022–2024',
          duration: 'Ongoing',
          status: 'Now Closed',
          client: 'Spurgeons',
          website: 'https://spurgeons.org/how-we-help/affected-by-imprisonment/hmp-winchester/',
          sections: [
            {
              id: 'overview',
              title: 'Project Overview',
              body: `Invisible Walls is Spurgeons' programme at HMP Winchester, operating since 2011 to support imprisoned fathers in maintaining meaningful relationships with their children. The service delivers parenting courses, family visits with dedicated children's activities, and resettlement support, with the belief that prisoners are parents first.\n\nStudio KAIL developed the brand identity for Invisible Walls: a logo built around connection and humanity rather than incarceration, supported by a suite of leaflets, illustrations, and signage used across the prison environment. Every design decision was made with the sensitivity the context demands.`,
            },
          ],
        },
      },    ],
  },
  {
    id: 'motion',
    name: 'Motion Design & Animation',
    tagline: 'Animation that moves minds, not just pixels.',
    description:
      'From charity sector explainers to brand reels and mindfulness toolkits, we create motion work that communicates complex ideas with warmth, clarity, and lasting impact: across digital platforms, presentations, and broadcast.',
    accent: '#A8C4EC',
    accentDark: '#2a60c8',
    stats: [
      { label: 'Projects Delivered', value: '7+' },
      { label: 'Sectors',            value: '3+' },
      { label: 'Client Repeat Rate', value: '80%' },
    ],
    slides: [
      {
        id: 12, bg: '#A8C8B8', img: 'leaves/leaves-thumb.webp', label: 'Spurgeons: Leaves on a Stream',
        tags: ['Motion Design', 'Mindfulness', 'Animation', 'Charity'],
        caseStudy: {
          subtitle: 'Motion Design · Mindfulness Animation · Mental Health',
          year: '2024',
          duration: 'Commission',
          status: 'Delivered',
          sections: [
            {
              id: 'overview',
              body: "A calming mindfulness animation created for Spurgeons as part of their mental health resource library. Based on the Leaves on a Stream technique from Acceptance and Commitment Therapy (ACT), the piece guides viewers through a gentle visualisation exercise: imagining thoughts as leaves drifting along a stream, observing them without attachment or judgement.\n\nDesigned to reduce anxiety and lower cortisol, the animation provides a tool for moments of stress or overwhelm. Studio KAIL translated the therapeutic technique into a warm, accessible motion piece that lives on the Spurgeons website alongside their broader mindfulness and breathing resources.",
            },
          ],
        },
      },
      {
        id: 1, bg: '#B8D4EC', img: 'projects/studio-intro.webp', label: 'Studio Intro',
        tags: ['Motion Design', '3D Animation', 'Studio Rebrand'],
        caseStudy: {
          subtitle: 'Motion Design · 3D Animation · Studio Rebrand',
          year: '2026',
          duration: 'Ongoing',
          status: 'Published',
          sections: [
            {
              id: 'overview',
              body: "Studio Intro marks the launch of the Studio KAIL 2026 rebrand, a complete visual refresh built around a new cast of 3D characters that embody the studio's identity, values, and creative direction.\n\nThe animation introduces these characters for the first time, following their journey through a world that reflects the studio's evolved visual language: dimensional, expressive, and deliberately crafted. Each character is designed to carry the studio's personality: curious, purposeful, and never predictable.\n\nA companion brand book documents the characters' design system, the new studio aesthetic, and the creative decisions behind the rebrand. Together, the film and the book form the studio's visual manifesto for 2026 and beyond.",
            },
          ],
        },
      },
      {
        id: 5, bg: '#A8C0E4', img: 'projects/steps.webp', label: 'STEPS',
        tags: ['Motion Design', 'Experimental', 'Self-Initiated'],
        caseStudy: {
          subtitle: 'Motion Design · Experimental Animation · Self-Initiated',
          year: '2022',
          duration: 'Self-Initiated',
          status: 'Published',
          youtube: 'B47H1UDrQcc',
          sections: [
            {
              id: 'overview',
              body: "Steps is a self-initiated motion study exploring the foundations of character animation through a simple walk cycle. Created using abstract shapes to represent people and animals, the project focuses on how even the most minimal forms can communicate personality, weight, and movement.\n\nThe animation demonstrates the core principles of motion design, including timing, spacing, easing, balance, and simple physics. By stripping the character back to its most essential forms, the project highlights how thoughtful movement alone can create life, rhythm, and expression.\n\nSince its release, Steps has become one of Studio KAIL's signature pieces, receiving over 10,000 views on YouTube. It continues to serve as a showcase of the studio's approach to motion craft, demonstrating how strong animation is built on mastering the fundamentals.",
            },
          ],
        },
      },
      {
        id: 11, bg: '#B8C8E8', img: 'projects/pc-animations.webp', label: 'PC Course Animations',
        tags: ['Motion Design', 'Animation', 'Educational', 'Charity'],
        caseStudy: {
          subtitle: 'Motion Design · Educational Animation · Parenting Series',
          year: '2025',
          duration: 'Ongoing Commission',
          status: 'In Production',
          sections: [
            {
              id: 'overview',
              body: "An ongoing series of educational animated videos produced for Spurgeons Connect, equipping parents and carers with practical tools and emotional support across three specialist tracks: Primary, Teens, and Neurodiverse Children.\n\nOver 8 videos have been produced to date, with 4 more planned for release in the coming year. The two featured here are from the Teen course, addressing the unique challenges parents face when supporting teenagers through difficult periods.\n\nAnimation and character design by Studio KAIL, developed in close collaboration with Spurgeons' family support practitioners.",
            },
          ],
        },
      },
      {
        id: 8, bg: '#C8D8CC', img: 'projects/well-lab.webp', label: 'Well Lab',
        tags: ['Motion Design', 'Explainer Video', 'Brand Animation'],
        caseStudy: {
          subtitle: 'Motion Design · Brand Animation · Client Commission',
          year: '2023',
          duration: 'Commission',
          status: 'Delivered',
          sections: [
            {
              id: 'overview',
              body: "An introductory video for UK-based organisation Well Lab, a consultancy tackling burnout in the workplace. Well Lab works with employers and organisations including the NHS and UCL to support employees' mental health and wellbeing, helping them build sustainable approaches to work.\n\nFollowing the organisation's brand guidelines, the studio translated their shapes and colour palette into a series of whimsical and dynamic movements, with workers and scientists represented as coloured circles falling in and out of balance. The video aims to capture the interest of potential partners by differentiating Well Lab from other firms through sleek, modern design and an abstract approach to human representation.\n\nVoiceover and branding guidelines including shapes and colour palette provided by Well Lab.",
            },
          ],
        },
      },
      {
        id: 7, bg: '#D4CCE8', img: 'projects/bloom.webp', label: 'BLOOM',
        tags: ['Motion Design', 'Organic', 'Experimental'],
        caseStudy: {
          subtitle: 'Motion Design · Organic Animation · Self-Initiated',
          year: '2022',
          duration: 'Self-Initiated',
          status: 'Published',
          youtube: 'Yjuj-ODZfPY',
          sections: [
            {
              id: 'overview',
              body: "Bloom is a self-initiated motion study following the simple lifecycle of a flower as it blooms. Designed with a playful, cartoon-inspired aesthetic, the project explores how colour, timing, and movement can transform a simple illustration into a warm, expressive animation.\n\nThe piece begins with a sepia-toned palette, evoking a nostalgic, vintage feel before gradually transitioning into a vibrant blue colour scheme as the flower comes to life. Through subtle easing, organic motion, and thoughtful colour progression, Bloom demonstrates how animation can create emotion and tell a visual story using the simplest of subjects.\n\nWith its softer, vintage-inspired art direction, Bloom showcases a different side of Studio KAIL's motion work while highlighting the studio's ability to combine expressive illustration, colour, and animation into charming, characterful pieces.",
            },
          ],
        },
      },
      {
        id: 10, bg: '#E8C4A0', img: 'projects/pas-advert.webp', label: 'Spurgeons: PAS Advert',
        tags: ['Motion Design', 'Animated Characters', 'Social Content', 'Charity'],
        caseStudy: {
          subtitle: 'Motion Design · Animated Characters · Social Media Advert',
          year: '2025',
          duration: 'Commission',
          status: 'Delivered',
          sections: [
            {
              id: 'overview',
              body: "A short-form vertical social media advert commissioned by Spurgeons to promote their Parenting After Separation (PAS) course. The course was developed by Spurgeons' parenting and counselling experts to support parents navigating family breakdown, helping them prioritise their children's wellbeing through one of the most challenging transitions a family can face.\n\nThe advert uses animated characters to bring warmth, accessibility, and emotional resonance to a sensitive subject. Custom character design and animation by Studio KAIL, working within Spurgeons' brand guidelines.",
            },
          ],
        },
      },
      {
        id: 9, bg: '#B8D4C8', img: 'spurgeons-counselling/thumbnail.jpg', label: 'Spurgeons: Counselling',
        tags: ['Motion Design', 'Illustration', 'Social Content', 'Charity'],
        caseStudy: {
          subtitle: 'Motion Design · Custom Illustration · Social Media Campaign',
          year: '2025',
          duration: 'Commission',
          status: 'Delivered',
          sections: [
            {
              id: 'overview',
              body: "A set of three short-form vertical videos commissioned by Spurgeons, the UK children's charity, to promote their counselling services across social media. Each video features a different voice from within the organisation, a counsellor or specialist speaking candidly about their area of expertise, with custom illustrations and animations bringing their words to life.\n\nThe series spans three of the charity's most significant counselling specialisms: self-harm support, school-based counselling, and the wider therapeutic services Spurgeons offers to children and young people. Designed to reach families, young people, and professionals across Instagram and other social platforms, each piece balances the weight of its subject matter with Spurgeons' signature warmth and accessibility.\n\nCustom illustrations, character design, and animation by Studio KAIL. Voiceover and branding guidelines provided by Spurgeons.",
            },
          ],
        },
      },
      {
        id: 2, bg: '#F0C8B0', img: 'projects/spurgeons-ed.webp', label: 'Spurgeons ED',
        tags: ['Motion Design', 'Explainer Video', 'Charity'],
        caseStudy: {
          subtitle: 'Motion Design · Explainer Video · Charity Awareness',
          year: '2021',
          duration: '4 Months',
          status: 'Delivered · Successful Campaign',
          article: 'https://spurgeons.org/about-us/news-stories-events/news/spurgeons-tackles-eating-disorder-myths-as-rates-climb-among-children/',
          vimeo: 'https://vimeo.com/spurgeonscharity',
          sections: [
            {
              id: 'overview',
              body: "A set of five videos and around sixty illustrations made for UK-based children's charity, Spurgeons. Founded in 1867, the charity has supported vulnerable children and families for over 150 years by providing a range of services including support programs, parenting courses, child and family therapy, and children's centres. This campaign was launched for Eating Disorder Awareness Week to bring attention to eating disorders in teenagers and children.\n\nSpurgeons' branding is designed to convey warmth, approachability, and compassion, reflecting the charity's mission to support some of the most vulnerable members of society. This translated into a series of inclusive, friendly characters of all races, sizes, and disabilities. The videos were designed to be accessible for parents of all ages. Through five videos each around five minutes in length, the characters are seen interacting: talking, eating together, going for walks, as well as navigating situations of distress. Teenagers are shown having a complicated relationship with food and body image, with the series aiming to shed light on a serious matter while remaining inclusive and easy to understand.\n\nVoiceover and branding guidelines provided by Spurgeons. Original illustrations by upklyak.",
            },
          ],
        },
      },
      {
        id: 4, bg: '#C0D4B8', img: 'projects/geometric.webp', label: 'Geometric Showcase',
        tags: ['Motion Design', 'Abstract', 'Experimental'],
        caseStudy: {
          subtitle: 'Motion Design · Abstract · Experimental Animation',
          year: '2022',
          duration: 'Self-Initiated',
          status: 'Published · 45,000+ Views',
          youtube: 'E1lDvWBNlKM',
          sections: [
            {
              id: 'overview',
              body: "A purely abstract motion piece built from precise geometry. No narrative, no character, just form, rhythm, and mathematics in motion.\n\nGeometric Showcase became the studio's highest-performing piece on YouTube, accumulating over 45,000 views and 800+ likes from audiences drawn to its minimal precision. The piece demonstrates what becomes possible when animation is stripped to its essentials: exact timing, controlled movement, and the satisfaction of shapes behaving exactly as they should.",
            },
          ],
        },
      },
      {
        id: 6, bg: '#B4D0A8', img: 'projects/atoz.webp', label: 'A to Z',
        tags: ['Motion Design', 'Typography', 'Experimental'],
        caseStudy: {
          subtitle: 'Motion Design · Typographic Animation · Self-Initiated',
          year: '2023',
          duration: 'Self-Initiated',
          status: 'Published',
          youtube: 'JdLVq-FHkfg',
          sections: [
            {
              id: 'overview',
              body: "A to Z is a self-initiated typographic motion project exploring animation through every letter of the alphabet. Each of the twenty-six letters presents a unique opportunity to experiment with different transitions, timing, rhythm, and visual techniques while maintaining a cohesive overall style.\n\nThe project demonstrates a broad range of motion design principles, showcasing how typography can be transformed through movement alone. From playful transformations to seamless transitions, each animation explores a different approach, creating a collection that highlights versatility, technical craft, and attention to detail.",
            },
          ],
        },
      }
    ],
  },
  {
    id: 'packaging',
    name: 'Print & Physical Design',
    tagline: 'Tactile design with shelf presence and soul.',
    description:
      'From artisan food brands to wellness products and spiritual tools, we craft packaging and print that earns attention on shelf, communicates quality at a glance, and tells a story worth holding.',
    accent: '#A8D4BC',
    accentDark: '#3a9068',
    stats: [
      { label: 'Products Designed', value: '5+' },
      { label: 'Countries',         value: '3+' },
      { label: 'Sectors',           value: '3' },
    ],
    slides: [
      {
        id: 1, bg: '#C8B898', img: 'projects/woodco.webp', label: 'Woodco',
        tags: ['Packaging', 'Label Design', 'Visual Identity'],
        caseStudy: {
          subtitle: 'Packaging Design · Label Design · Visual Identity',
          year: '2021',
          duration: '2 Weeks',
          location: 'Hong Kong',
          status: 'Delivered · May 2021',
          client: 'WOODCO',
          revisions: '4',
          behance: 'https://www.behance.net/gallery/119242921/WOODCO-Packaging-Deisgn',
          dribbble: 'https://dribbble.com/shots/15646024-WOODCO-Candle-Packaging',
          website: 'http://thisiswoodco.com',
          sections: [
            {
              id: 'overview',
              title: 'Project Overview',
              body: `A set of 6 packaging labels were created for Hong Kong-based candle manufacturer, WOODCO. Paired with their fragrance blends using premium fragrance and essential oils, their scented candles are made to achieve a feeling of home and a sense of calmness.\n\nThese labels were created with a focus on simple, abstract shapes and bright, contrasting colours. These colours can be associated with modernity, innovation, and the notion of being forward-thinking. As WOODCO wanted to convey a strong impression while still displaying features of subtlety and femininity, this comes through in clean, elementary shapes with signs of rigidity to symbolise human-like imperfection.`,
            },
          ],
        },
      },
      {
        id: 2, bg: '#E8B098', img: 'projects/la-terra-rossa.webp', label: 'La Terra Rossa',
        tags: ['Packaging', 'Label Design', 'Brand Identity'],
        caseStudy: {
          subtitle: 'Packaging Design · Logo Redesign · Brand Identity',
          year: '2021',
          duration: '1 Week',
          location: 'Portland, Oregon',
          status: 'Delivered',
          client: 'La Terra Rossa',
          website: 'https://laterrarossacoffee.com/',
          sections: [
            {
              id: 'overview',
              title: 'Project Overview',
              body: `Along with a logo redesign, a couple of coffee packaging designs were made for the Oregon-based coffee company, La Terra Rossa. La Terra Rossa produces a range of tea and coffee, offering single-payment and subscription services, as well as merchandise such as stickers, mugs, clothing pieces and coffee accessories. Their message focuses on the concept of authenticity, quality, and tradition.\n\nThe branding focuses on a simple, clean design with an earth-tone palette that emphasizes the company's commitment to giving back to the community. The packaging pieces as well as the logo are based on Van Gogh's "The Sower", a representation of the cycle of life, growth, and renewal. The farmer sowing seeds represents the human effort to cultivate and nurture the land, while the setting sun suggests the passage of time and the inevitability of change.`,
            },
          ],
        },
      },
      {
        id: 3, bg: '#C8A8D8', img: 'projects/oracle-cards.webp', label: 'Oracle Cards',
        tags: ['Print', 'Book Design', 'Illustration'],
        caseStudy: {
          subtitle: 'Book Illustration · Print Design · Mixed Media',
          year: '2022',
          duration: '2 Months',
          location: 'Remote',
          status: 'Published',
          client: 'Annalisa Brizzante',
          amazon: 'https://www.amazon.co.uk/SELF-AWAKENING-ORACLE-CARDS-potential/dp/B0B6L4SWB3',
          sections: [
            {
              id: 'overview',
              title: 'Project Overview',
              body: `A set of 41 custom illustrations were made for independent writer Annalisa Brizzante to be featured in her book 'SELF AWAKENING ORACLE CARDS: connect to your true potential'. The cards are printed within the book and are intended to be cut out and used as oracle cards.\n\nThe oracle cards, along with the messages from the book, help the reader overcome challenges and create a positive mindset while replacing negative blockages. Each card is unique and has a specific theme or focus, such as frustration, acceptance or sorrow. They generally incorporate a mixed media style with a variation of linework complimented by textures such as paint, ink or watercolour. The textures allowed the illustrations to have more depth and richness, using materials such as rocks, leaves and flowers to create a tactile and multi-sensory experience. Each concept was discussed with the writer to draw from the writer's identity, memory, and personal experiences.`,
            },
          ],
        },
      },
      {
        id: 4, bg: '#F0C8C0', img: 'projects/signature-balm.webp', label: 'Signature Balm',
        tags: ['Packaging', 'Label Design', 'Wellness'],
        caseStudy: {
          subtitle: 'Packaging Design · Label Design · Pattern Design',
          year: '2021',
          duration: '2 Weeks',
          location: 'United Kingdom',
          status: 'Delivered',
          client: 'SouthShore Adornments',
          website: 'https://www.southshoreadornments.com/products/signature-piercing-balm-20ml',
          sections: [
            {
              id: 'overview',
              title: 'Project Overview',
              body: `The packaging design for UK-based body jewellery brand SouthShore Adornments's "Signature Balm" was made by the studio. The Signature Balm is the company's own healing balm made to be used on piercings, tattoos, and other areas of the skin.\n\nThe company's branding incorporates a clean and modern design while still maintaining a bold and strong image that comes with body piercings. The packaging itself is clean and elegant, with a focus on the green palette to highlight the natural ingredients used in the product and the company's commitment to ethical and sustainable practices. The minimalist design also allows all necessary information to fit onto its narrow tin. A simple pattern is used in the background to add a hint of boldness and create a memorable identity.`,
            },
          ],
        },
      },
      {
        id: 5, bg: '#B8C8D8', img: null, label: 'Spurgeons: Signage',
        tags: ['Print', 'Signage', 'Charity'],
        caseStudy: {
          subtitle: 'Print Design · Signage · Festival & Event Materials',
          year: '2022–2025',
          duration: '3.5 Years',
          status: 'Ongoing',
          client: 'Spurgeons',
          sections: [
            {
              id: 'overview',
              title: 'Project Overview',
              body: `Spurgeons is one of the UK's leading children's charities, delivering community-based services to families facing poverty, abuse, and neglect. Over more than three years, Studio KAIL has designed a wide range of print and physical materials for the charity: from large-format festival banners and pull-up banners to building signage, event posters, and social media assets.\n\nThe work spans indoor and outdoor environments, seasonal campaigns, and location-specific installations, each piece designed to communicate Spurgeons' warmth, credibility, and community presence at scale.`,
            },
          ],
        },
      },
      {
        id: 6, bg: '#D4C7FF', img: null, label: 'Spurgeons: Merch',
        tags: ['Merch', 'Apparel', 'Charity'],
        caseStudy: {
          subtitle: 'Merchandise Design · Apparel · Charity Fundraising',
          year: '2023–2025',
          duration: 'Ongoing',
          status: 'Ongoing',
          client: 'Spurgeons',
          sections: [
            {
              id: 'overview',
              title: 'Project Overview',
              body: `Alongside print and signage, Studio KAIL has designed a range of merchandise for Spurgeons to wear, carry, and share at events and fundraising activities. From tote bags and t-shirts to running vests for marathon participants, each piece extends the charity's brand into the physical world, keeping Spurgeons visible and consistent wherever their people go.\n\nThe challenge with charity merch is always the same: it has to feel like something people actually want to wear. Every piece is designed with that in mind, functional, considered, and proudly Spurgeons.`,
            },
          ],
        },
      },
      {
        id: 7, bg: '#F0E4C8', img: null, label: 'Spurgeons: Flyers & Posters',
        tags: ['Print', 'Editorial', 'Charity'],
        caseStudy: {
          subtitle: 'Print Design · Flyers · Posters · Campaign Materials',
          year: '2022–2025',
          duration: 'Ongoing',
          status: 'Ongoing',
          client: 'Spurgeons',
          sections: [
            {
              id: 'overview',
              title: 'Project Overview',
              body: `A broad and ongoing body of print work for Spurgeons: flyers, posters, and campaign materials produced across multiple services, seasons, and audiences. Each piece exists to communicate something essential, a course available, a service to access, a campaign to join, quickly, clearly, and in a voice that feels human rather than institutional.\n\nThe work spans awareness campaigns, course promotion, community outreach, and internal communications. Some pieces live in waiting rooms and community centres; others are handed out at events or mailed to families. Across all of them, the principle is the same: Spurgeons' warmth on a page.`,
            },
          ],
        },
      },
    ],
  },
  {
    id: 'web',
    name: 'Web, Digital & UX Design',
    tagline: 'A portfolio that practices what it preaches.',
    description:
      'This portfolio is itself a piece of web work: custom-built with React and Vite, animated with Framer Motion, and styled entirely by hand. No templates, no component libraries, every detail considered from first principles.',
    accent: '#335CFF',
    accentDark: '#1A3ACC',
    stats: [
      { label: 'Launched',   value: '2026' },
      { label: 'Framework',  value: 'React' },
      { label: 'Custom CSS', value: '100%'  },
    ],
    slides: [
      {
        id: 1, bg: '#335CFF', img: null, label: 'Portfolio Website',
        tags: ['React', 'Vite', 'Framer Motion', 'Custom CSS'],
        caseStudy: {
          subtitle: 'React 18 + Vite · Framer Motion · Lenis · Custom CSS · GitHub Pages',
          year: '2026',
          duration: 'Ongoing',
          status: 'Live · kail.studio',
          sections: [
            {
              id: 'overview',
              body: "This portfolio is designed and built entirely from scratch: no templates, no component libraries, no shortcuts. Every layout, animation, and interaction is written by hand, a deliberate choice to ensure the site itself is a demonstration of the craft it represents.\n\nThe architecture is built on React 18 and Vite, with Framer Motion handling all scroll-triggered reveals and page transitions. Lenis provides the butter-smooth inertia scrolling. The visual system is built entirely in custom CSS, glass tokens, bento grids, motion curves, defined once and applied consistently across every section.\n\nThe result is a site that loads fast, animates fluidly, and scales cleanly across every device and screen size.",
            },
            {
              id: 'tech',
              body: 'React 18 provides the component architecture. Vite handles bundling with near-instant hot reload in development and optimised production builds. Framer Motion powers every entrance animation, reveal, and transition. Lenis is wired to a React context for smooth, inertia-based scrolling throughout. Custom CSS tokens handle the entire design system: colours, spacing, type scale, glass effects, and dark/light surface variants, all without a single line of Tailwind or Bootstrap.',
            },
          ],
        },
      },
      {
        id: 2, bg: '#E0F87D', img: null, label: 'Spurgeons: Course Portal',
        tags: ['UX Design', 'UI Redesign', 'User Testing', 'Charity'],
        caseStudy: {
          subtitle: 'UX Design · UI Redesign · User Testing · Figma',
          year: '2024',
          duration: 'Ongoing',
          status: 'Delivered',
          client: 'Spurgeons',
          sections: [
            {
              id: 'overview',
              title: 'Project Overview',
              body: 'Spurgeons received consistent complaints that their course portal sign-on experience was confusing and difficult to use. Studio KAIL was brought in to audit the existing flow, run user testing sessions, and redesign the interface from the ground up, making it easier, faster, and more welcoming for the families and professionals Spurgeons serves.',
            },
          ],
        },
      },
    ],
  },
]

// ── Single project card ──────────────────────────────────────────────
function ProjectCard({ slide, index, onCardClick }) {
  const tint = index % 2 === 0 ? 'pj-card--lilac' : 'pj-card--blue'

  return (
    <div
      className={`pj-card ${tint}`}
      onClick={() => onCardClick?.(slide)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onCardClick?.(slide)}
    >
      {/* Stacked photo cards */}
      <div className="pj-photo-area">
        <div className="pj-photo-stack">
          <div className="pj-photo-back pj-photo-back--2" />
          <div className="pj-photo-back pj-photo-back--1" />
          <div className="pj-photo-front">
            {slide.img ? (
              <div
                className="pj-photo-img"
                style={{ backgroundImage: `url(${import.meta.env.BASE_URL}${slide.img})` }}
              />
            ) : (
              <div
                className="pj-photo-placeholder"
                style={{ background: hexToRgba(slide.bg, 0.35) }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Tag chips */}
      {slide.tags && slide.tags.length > 0 && (
        <div className="pj-tags">
          {slide.tags.map((tag, i) => (
            <span key={i} className="pj-tag">{tag}</span>
          ))}
        </div>
      )}

      {/* Bordered title pill */}
      <div className="pj-footer">
        <div className="pj-title-pill">
          <span className="pj-title">{slide.label}</span>
          <span className="pj-arrow">↗</span>
        </div>
      </div>
    </div>
  )
}

// ── RAF-driven infinite auto-scroll carousel ─────────────────────────
function InlineCarousel({ slides, visible, onCardClick }) {
  const x            = useMotionValue(0)
  const pausedRef    = useRef(false)   // true while hovering (desktop)
  const rafRef       = useRef(null)
  const prevTimeRef  = useRef(null)

  // Drag state (refs avoid stale closures in RAF)
  const isDragging    = useRef(false)
  const hasDragged    = useRef(false)
  const dragStartX    = useRef(0)
  const dragStartXVal = useRef(0)
  const [grabbing, setGrabbing] = useState(false)

  const tripled     = useMemo(() => [...slides, ...slides, ...slides], [slides])
  const singleWidth = slides.length * (CARD_W + CARD_GAP)

  // RAF auto-scroll — runs on both mobile and desktop
  useEffect(() => {
    if (!visible) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      prevTimeRef.current = null
      return
    }
    const tick = (timestamp) => {
      if (prevTimeRef.current !== null && !pausedRef.current && !isDragging.current) {
        const delta = timestamp - prevTimeRef.current
        let next = x.get() - (SPEED_PPS * delta) / 1000
        if (Math.abs(next) >= singleWidth) next += singleWidth
        x.set(next)
      }
      prevTimeRef.current = timestamp
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [visible, singleWidth])

  // Suppress card click if the pointer moved (drag, not tap); pass slide up
  const handleCardClick = useCallback((slide) => {
    if (hasDragged.current) return
    onCardClick?.(slide)
  }, [onCardClick])

  // ── Pointer drag via window listeners ────────────────────────────
  // Using window listeners (not setPointerCapture) so click events
  // still reach the ProjectCard's onClick handler.
  const onPointerDown = useCallback((e) => {
    if (e.button !== undefined && e.button !== 0) return
    isDragging.current    = true
    hasDragged.current    = false
    dragStartX.current    = e.clientX
    dragStartXVal.current = x.get()
    setGrabbing(true)

    const onMove = (ev) => {
      if (!isDragging.current) return
      const delta = ev.clientX - dragStartX.current
      if (Math.abs(delta) > 4) hasDragged.current = true
      let next = dragStartXVal.current + delta
      if (next > 0)            next -= singleWidth
      if (next < -singleWidth) next += singleWidth
      x.set(next)
    }

    const onUp = () => {
      isDragging.current = false
      setGrabbing(false)
      window.removeEventListener('pointermove',   onMove)
      window.removeEventListener('pointerup',     onUp)
      window.removeEventListener('pointercancel', onUp)
    }
    window.addEventListener('pointermove',   onMove)
    window.addEventListener('pointerup',     onUp)
    window.addEventListener('pointercancel', onUp)
  }, [x, singleWidth])

  return (
    <div
      className="ic-wrap"
      onMouseEnter={() => { pausedRef.current = true }}
      onMouseLeave={() => { pausedRef.current = false }}
    >
      {/* Infinite scroll + pointer/touch drag: same on mobile and desktop */}
      <div
        className="ic-viewport"
        onPointerDown={onPointerDown}
        style={{ cursor: grabbing ? 'grabbing' : 'grab', touchAction: 'pan-y' }}
      >
        <motion.div className="ic-track" style={{ x }}>
          {tripled.map((slide, i) => (
            <ProjectCard
              key={`${slide.id}-${i}`}
              slide={slide}
              index={i % slides.length}
              onCardClick={handleCardClick}
            />
          ))}
        </motion.div>
      </div>
    </div>
  )
}

// ── Coming soon placeholder ──────────────────────────────────────────
function ComingSoonCard() {
  return (
    <div className="pf-coming-soon">
      <div className="pf-coming-soon-pill">
        <span className="pf-coming-soon-dots">
          <span className="pf-coming-soon-dot" />
          <span className="pf-coming-soon-dot" />
          <span className="pf-coming-soon-dot" />
        </span>
        <span className="pf-coming-soon-label">Coming soon</span>
      </div>
    </div>
  )
}

// ── Main section ─────────────────────────────────────────────────────
export default function PortfolioSection({ onProjectOpen }) {
  const [openId, setOpenId] = useState(null)
  const toggle = (id) => setOpenId((prev) => (prev === id ? null : id))

  return (
    <section className="pf-section" id="work">

      <div className="pf-inner">
        <div className="pf-left">

          {/* ── Hero headline glass panel ── */}
          <motion.div
            className="hero-text-glass"
            initial={{ opacity: 0, y: 22, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
          >
            <div className="pf-rotate-wrap">
              <LayoutGroup>
                <h2 className="pf-rotate-line" aria-label="From spark to screen, shelf, sales, and more">

                  <span className="pf-rotate-row">
                    <motion.span
                      style={{ display: 'inline-block' }}
                      initial={{ opacity: 0, y: 14, filter: 'blur(5px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.20 }}
                    >
                      From
                    </motion.span>

                    <motion.span
                      style={{ display: 'inline-block', position: 'relative' }}
                      initial={{ opacity: 0, y: 14, filter: 'blur(5px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.33 }}
                    >
                      spark
                      <motion.span
                        className="pf-spark-underline"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94], delay: 1.15 }}
                      />
                    </motion.span>

                    <motion.span
                      style={{ display: 'inline-block' }}
                      initial={{ opacity: 0, y: 14, filter: 'blur(5px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.41 }}
                    >
                      to
                    </motion.span>
                  </span>

                  <motion.span
                    className="pf-rotate-row"
                    layout
                    initial={{ opacity: 0, y: 14, filter: 'blur(5px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.46 }}
                  >
                    <TextRotate
                      texts={['screen', 'shelf', 'sales', 'substance', 'sustainability', 'solutions']}
                      mainClassName="pf-rotate-chip"
                      staggerFrom="last"
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '-120%' }}
                      staggerDuration={0.03}
                      splitLevelClassName="pf-rotate-char-slot"
                      transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                      rotationInterval={2200}
                    />
                  </motion.span>

                </h2>
              </LayoutGroup>
            </div>

            <motion.p
              className="pf-subtitle"
              initial={{ opacity: 0, y: 14, filter: 'blur(5px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.58 }}
            >
              and <mark className="hl-between">everything in between.</mark>
            </motion.p>
          </motion.div>

          {/* Body copy paragraph formerly lived here (.pf-body-glass), now
              moved to the intro card in PortfolioTypes.jsx, see that
              component's INTRO_PANEL. */}

          <div className="pf-cats">
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.id}
                className={`pf-cat-block${openId === cat.id ? ' open' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 + 0.1, duration: 0.5 }}
              >
                <button
                  className={`pf-pill${openId === cat.id ? ' pf-pill--open' : ''}`}
                  onClick={() => toggle(cat.id)}
                >
                  <span className="pf-pill-name">{cat.name}</span>
                  <span className={`pf-pill-icon${openId === cat.id ? ' rotated' : ''}`}>↙</span>
                </button>

                <div className="pf-carousel-inner">
                  {cat.comingSoon ? (
                    <ComingSoonCard />
                  ) : (
                    <InlineCarousel
                      slides={cat.slides}
                      visible={openId === cat.id}
                      onCardClick={(slide) => onProjectOpen?.(cat, slide)}
                    />
                  )}
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
