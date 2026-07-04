# Mukiria Trainer Dashboard — Design Brainstorm

## Three Stylistic Approaches

### Approach A — "Deep Navy Command Center"
A dark, authoritative interface inspired by mission-critical operations software. Deep navy backgrounds with electric-cyan accents, sharp typography, and data-forward layouts that feel like a control room. Probability: 0.07

### Approach B — "Institutional Glassmorphism" *(CHOSEN)*
A sophisticated dark-mode dashboard with deep slate/charcoal backgrounds, frosted-glass card surfaces, and emerald-green accents that evoke academic credibility and institutional trust. Clean, modern, and professional — the kind of interface that commands respect in a training institution. Probability: 0.09

### Approach C — "Warm Academic"
A light-mode, warm-toned interface with cream backgrounds, terracotta accents, and serif typography — evoking traditional academic gravitas. Probability: 0.04

---

## Chosen Approach: "Institutional Glassmorphism"

### Design Movement
**Dark Glassmorphism + Institutional Modernism** — Combining the depth and tactility of glassmorphism with the structured authority of institutional design systems (think NASA mission control meets modern SaaS).

### Core Principles
1. **Depth through glass** — Every card is a frosted-glass surface floating above a rich dark background, creating tangible z-depth.
2. **Data legibility first** — Typography hierarchy is strict: numbers and scores are always the largest, most prominent elements.
3. **Emerald authority** — A single signature emerald-green accent color anchors all interactive elements, status indicators, and CTAs.
4. **Structured asymmetry** — Sidebar navigation + content area layout, never centered hero layouts.

### Color Philosophy
- Background: `oklch(0.13 0.015 240)` — Deep slate-navy, not pure black, giving warmth and depth
- Glass cards: `oklch(0.18 0.012 240 / 0.7)` with `backdrop-blur-xl` — frosted glass effect
- Primary accent: `oklch(0.72 0.18 160)` — Emerald green, ownable and institutional
- Secondary accent: `oklch(0.65 0.15 200)` — Teal-cyan for secondary actions
- Danger/destructive: `oklch(0.65 0.22 25)` — Warm red for errors
- Text primary: `oklch(0.95 0.005 240)` — Near-white with slight blue tint
- Text muted: `oklch(0.60 0.01 240)` — Subdued slate for secondary info

### Layout Paradigm
Persistent left sidebar (240px) with icon + label navigation. Main content area uses a 12-column grid. Top bar shows institution name, current user, and quick actions. No centered hero — every pixel is functional.

### Signature Elements
1. **Frosted glass cards** with `backdrop-blur-xl`, subtle white border (`border-white/10`), and inner glow on hover
2. **Emerald status badges** — glowing dot indicators for live/active states
3. **Data tables with alternating glass rows** — zebra striping using opacity variation

### Interaction Philosophy
Interactions feel deliberate and precise — like operating specialized equipment. Hover states reveal depth (card lifts with shadow). Button presses have tactile scale feedback. Transitions are swift (150-200ms) with ease-out curves.

### Animation
- Card entrance: `opacity: 0 → 1` + `translateY(8px → 0)` at 200ms ease-out, staggered 50ms per card
- Sidebar items: subtle left-border slide on active state
- Data updates: number counters animate on load
- Modal/dialog: scale from 0.96 + fade, 220ms

### Typography System
- **Display/Headings**: `Syne` (700-800 weight) — geometric, authoritative
- **Body/UI**: `Inter` (400-500 weight) — readable, familiar
- **Monospace/Data**: `JetBrains Mono` — for scores, codes, timestamps
- Hierarchy: 36px display → 24px h1 → 18px h2 → 14px body → 12px caption

### Brand Essence
*The operating system for Kenya's technical educators — precise, trusted, always on.*
Personality: **Authoritative · Precise · Modern**

### Brand Voice
Headlines sound like institutional announcements: "Grade with Confidence. Teach with Data."
CTAs are action-forward: "Generate Exam", "View Submissions", "Export Transcript"
Never: "Welcome to our platform" or "Get started today"

### Wordmark & Logo
A bold geometric shield mark with an embedded graduation cap silhouette — rendered in emerald on dark background. The wordmark "MTTI" in Syne 800 with a thin emerald underline.

### Signature Brand Color
**Emerald** `oklch(0.72 0.18 160)` — institutional, trustworthy, unmistakably Mukiria TTI.
