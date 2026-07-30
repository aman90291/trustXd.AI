# TrustXD ExamOS — website

Marketing and evaluation site for TrustXD ExamOS: zero-leakage assessment
infrastructure for national competitive examinations and university entrance tests.

Static HTML/CSS/JS. No build step, no framework, no dependencies.

---

## Run it

```bash
# any static server works
python3 -m http.server 8000
# → http://localhost:8000
```

Opening `index.html` directly from the filesystem also works, though a server is
better (relative paths, fonts, and the WebGL canvas all behave more predictably).

---

## Pages

| File | What it is |
|---|---|
| `index.html` | The main site — hero, failure modes, the three locks, Modules A–E with working demos, assurance levels, exam-day runtime, edge cases, psychometric parity, control room, data lifecycle, endorsements, CTA |
| `prd.html` | **Deliverable 1** — Product Requirements Document: personas, 12 user stories with acceptance criteria, functional + non-functional requirements, 26 edge-case protocols, verdicts and appeals, retention, rollout, risks |
| `architecture.html` | **Deliverable 2** — System architecture blueprint: four SVG data-flow figures (topology, attestation sequence, binding timing, generation pipeline), delivery-gate code, threat model, scale table |
| `psychometrics.html` | **Deliverable 3** — Psychometric equivalence specification: the 3PL model, radicals vs incidentals, cold-start calibration, the ±0.05 logit derivation, form equivalence, linking, exposure control, DIF, limitations |
| `pitch.html` | **Deliverable 4** — 10-slide strategic deck. Scroll-snapped and keyboard-driven: `←` `→` `space` navigate, `Home`/`End` jump, `F` fullscreen. Prints one slide per landscape page |

---

## Files

```
assets/css/
  core.css     tokens, reset, type, layout, buttons, chips, cards, nav, footer,
               shared chart/legend/tooltip styles, motion utilities
  home.css     home-page sections
  doc.css      long-form document pages (PRD / architecture / psychometrics)
  pitch.css    the deck
assets/js/
  core.js      line-split headline reveals, scroll reveals, nav, mobile menu,
               custom cursor + magnetic buttons, counters, marquee velocity skew,
               scrollspy, the exam-day runtime timeline
  hero.js      the hero particle field (see below)
  demos.js     the five module simulations + the home-page charts
  psychometrics.js   the four IRT figures, computed from the model at render time
  pitch.js     deck navigation
```

---

## Design notes

**Palette.** Warm bone paper (`#F4F3EF`) with near-black ink and a single
signal blue (`#2540FF`). Light-locked by product decision — there is no dark
mode. Status colours (`Clear` / `Review required` / `Not assessable`) are fixed,
never reused as chart series colours, and **always ship with an icon and a text
label** so hue never carries meaning on its own.

**Chart colours** were validated with the data-viz palette checker: worst
all-pairs CVD ΔE 9.2, worst normal-vision ΔE 27.6 against the white chart
surface. Every chart carries a legend, selective direct labels, and — where
values matter — a table view.

**Type.** Inter Tight for everything structural, Instrument Serif italic for the
one emotional phrase per headline, JetBrains Mono for protocol labels,
timestamps and identifiers. Loaded from Google Fonts with system fallbacks.

**Motion.** Line-clipped headline reveals, scroll-velocity skew on the marquees,
magnetic buttons, a blend-mode cursor, and scroll-driven section states. All of
it is gated behind `prefers-reduced-motion`, which also switches the hero field
to a single static render.

### The hero particle field

`hero.js` renders a ~17,000-point cloud in raw WebGL1 (no three.js, no
dependencies) that morphs between four states — **Identity** (a sculpted facial
capture mesh), **Attestation** (a sealed silicon die), **Paper** (a JIT answer
grid) and **Scale** (a delivery shell). Morph weights are a `vec4` blended in the
vertex shader, with a turbulence spike mid-transition and a scan band sweeping
the form. It auto-advances every 7 s until the visitor picks a state, and falls
back to a canvas-2D renderer if WebGL is unavailable.

---

## Before this goes live

- [ ] **Replace the endorsement quotes** in the "Voices" section of `index.html`.
      They are clearly marked placeholders and are not attributed to real people.
- [ ] **Wire the pilot form** — it currently intercepts submit and says so. Point
      it at your CRM or form endpoint.
- [ ] **Review the illustrative figures.** Operating numbers in the control room,
      the cost index on slide 8, and the DIF values in Figure 4 are modelling
      assumptions shown to demonstrate the interface, and are labelled as such.
- [ ] Add analytics, an OG image, `robots.txt` and a sitemap.
- [ ] Self-host the fonts if the site must work offline or behind a firewall.

Exam names (NEET, JEE, UPSC, VITEEE, SRMJEEE, MET …) appear only as a statement
of format compatibility. The footnote under the ticker says so explicitly; keep
it there — no affiliation or endorsement should be implied.
