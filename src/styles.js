// Global CSS string — injected once by App.jsx via <style>{STYLES}</style>
// pp-topnav  = sticky top navigation bar
// pp-secnav  = dashboard section-jump nav (renamed from pp-nav to avoid cascade collision)
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400&family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap');

/* Keeps section-jump targets (scrollIntoView + #anchors) from landing under the sticky topnav. */
html { scroll-padding-top: 90px; }

.pp * { box-sizing: border-box; }
.pp {
  color-scheme: light;
  --paper: #F5EFE5;
  --paper-card: #FEFCF9;
  --panel: #EDE3D3;
  --ink: #1E1128;
  --plum: #2E1452;
  --plum-2: #43208A;
  --violet: #7044BE;
  --violet-soft: #EDE5F8;
  --violet-mid: #D8C8F2;
  --gold: #8A6420; /* darkened from #A8761E — ~4.8:1 on --paper, meets WCAG AA for the eyebrow/tag text that sits on light backgrounds */
  --gold-2: #C99A42; /* lighter gold — only used on dark plum backgrounds, where contrast is already fine */
  --muted: #6A5872;
  --line: rgba(30,17,40,0.13);
  --line-soft: rgba(30,17,40,0.07);
  --green: #3D7A3B;
  --teal: #2E726B;
  --rose: #9E3D65;
  --blue: #2F60A8;
  --shadow-sm: inset 0 1px 0 rgba(255,255,255,.55), 0 1px 3px rgba(30,17,40,.05), 0 4px 14px rgba(30,17,40,.08);
  --shadow-md: inset 0 1px 0 rgba(255,255,255,.55), 0 2px 6px rgba(30,17,40,.06), 0 8px 24px rgba(30,17,40,.10);
  --shadow-lg: inset 0 1px 0 rgba(255,255,255,.55), 0 4px 12px rgba(30,17,40,.07), 0 16px 40px rgba(30,17,40,.11);
  /* Subtle grain texture layered onto dark gradient surfaces for a premium, less "flat vector" feel. */
  --noise: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  --display: 'Fraunces', Georgia, serif;
  --sans: 'Hanken Grotesk', system-ui, sans-serif;
  font-family: var(--sans);
  color: var(--ink);
  background: var(--paper);
  line-height: 1.55;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.pp button { font-family: var(--sans); cursor: pointer; }
.pp h1, .pp h2, .pp h3, .pp h4 {
  font-family: var(--display);
  font-weight: 600;
  line-height: 1.07;
  letter-spacing: -0.015em;
  margin: 0;
}
.pp p { margin: 0; }
.pp a { color: inherit; }

.pp-wrap { max-width: 1060px; margin: 0 auto; padding: 0 24px; }
.pp-section { padding: 64px 0; }
.pp-eyebrow {
  font-size: 11px;
  letter-spacing: 0.20em;
  text-transform: uppercase;
  font-weight: 800;
  color: var(--gold);
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-family: var(--sans);
}

/* ── Top navigation bar ──────────────────────────────────────────────────── */
.pp-topnav {
  position: sticky;
  top: 0;
  z-index: 40;
  background: rgba(245,239,229,0.92);
  backdrop-filter: blur(18px) saturate(1.1);
  -webkit-backdrop-filter: blur(18px) saturate(1.1);
  border-bottom: 1px solid rgba(30,17,40,0.09);
  box-shadow: 0 1px 0 rgba(30,17,40,.04), 0 2px 16px rgba(30,17,40,.07);
}
.pp-topnav-in {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 68px;
  gap: 16px;
}
.pp-brand { display: flex; align-items: center; gap: 11px; cursor: pointer; background: none; border: 0; padding: 0; }
.pp-mark { flex: none; }
.pp-brand-name { font-family: var(--display); font-weight: 600; font-size: 19px; letter-spacing: -.01em; color: var(--ink); }
.pp-brand-name b { color: var(--violet); font-weight: 700; }
.pp-navlinks { display: flex; align-items: center; gap: 2px; }
.pp-navlink {
  background: none;
  border: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--muted);
  padding: 7px 13px;
  border-radius: 9px;
  transition: color .14s, background .14s;
  text-decoration: none;
  display: inline-block;
}
.pp-navlink:hover { color: var(--plum); background: var(--violet-soft); }
.pp-navlink.active, .pp-navlink[aria-current="page"] {
  color: var(--plum);
  background: var(--violet-mid);
  font-weight: 700;
}

/* ── Session indicator (auto-save status in nav) ─────────────────────────── */
.pp-session {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
  flex: none;
}
.pp-session-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #3D7A3B;
  box-shadow: 0 0 0 2.5px rgba(61,122,59,.18);
  flex: none;
  transition: background .3s;
}
.pp-session-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
  white-space: nowrap;
}
.pp-session-clear {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  background: none;
  border: 0;
  cursor: pointer;
  padding: 0;
  font-family: var(--sans);
  transition: color .13s;
  white-space: nowrap;
}
.pp-session-clear:hover { color: var(--rose); }
@media (max-width: 600px) { .pp-session { display: none; } }
/* Phone nav: wrap to two rows so brand + Sign in never overflow the row.
   Row 1 = brand (left) + auth (right); Row 2 = nav links, centered. */
@media (max-width: 560px) {
  .pp-topnav-in { flex-wrap: wrap; height: auto; min-height: 56px; padding: 9px 0; row-gap: 9px; }
  .pp-brand { order: 1; }
  .pp-navauth { order: 2; margin-left: auto; }
  .pp-navlinks { order: 3; flex-basis: 100%; justify-content: center; gap: 4px; }
}

/* ── Buttons ──────────────────────────────────────────────────────────────── */
.pp-btn {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 15px;
  padding: 13px 24px;
  border: 1px solid transparent;
  transition: transform .15s, box-shadow .15s, background .15s, opacity .15s;
  letter-spacing: .005em;
}
.pp-btn:active { transform: translateY(1px) !important; }
.pp-btn:focus-visible,
.pp-navlink:focus-visible,
.pp-segc:focus-visible,
.pp-back:focus-visible,
.pp-box:focus-visible,
.pp-toggle button:focus-visible,
.pp-select:focus-visible {
  outline: 2.5px solid var(--violet);
  outline-offset: 2px;
}
.pp-btn-primary {
  background: linear-gradient(155deg, #2B1250 0%, #4A2596 55%, #5D35AD 100%);
  color: #fff;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.16), 0 2px 4px rgba(46,20,82,.18), 0 8px 28px rgba(46,20,82,.28);
}
.pp-btn-primary:hover {
  background: linear-gradient(155deg, #381860 0%, #5830AE 55%, #6D43BF 100%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.22), 0 4px 8px rgba(46,20,82,.2), 0 16px 40px rgba(112,68,190,.34);
  transform: translateY(-1.5px);
}
.pp-btn-ghost {
  background: rgba(255,255,255,.7);
  color: var(--plum);
  border-color: rgba(30,17,40,.16);
  box-shadow: 0 1px 3px rgba(30,17,40,.06);
}
.pp-btn-ghost:hover {
  background: #fff;
  border-color: var(--violet);
  box-shadow: 0 2px 8px rgba(112,68,190,.18);
  transform: translateY(-1px);
}
.pp-btn-sm { padding: 9px 16px; font-size: 13px; }
.pp-btn[disabled] { cursor: not-allowed; opacity: .55; }

/* ── Hero ─────────────────────────────────────────────────────────────────── */
.pp-hero {
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid var(--line);
  background:
    var(--noise),
    radial-gradient(ellipse 85% 75% at 82% 10%, rgba(112,68,190,.14) 0%, transparent 60%),
    radial-gradient(ellipse 65% 60% at 100% 60%, rgba(201,154,66,.09) 0%, transparent 65%),
    radial-gradient(ellipse 70% 55% at 0% 100%, rgba(112,68,190,.08) 0%, transparent 65%),
    var(--paper);
}
.pp-hero-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 40px;
  align-items: center;
  padding: 68px 0 76px;
}
.pp-hero h1 { font-size: 60px; letter-spacing: -0.025em; line-height: 1.05; }
.pp-hero h1 em { font-style: italic; color: var(--violet); }
.pp-hero-sub { font-size: 18px; color: var(--muted); margin-top: 34px; max-width: 30em; line-height: 1.6; }
.pp-hero-cta { display: flex; gap: 12px; margin-top: 32px; flex-wrap: wrap; }
.pp-hero-fine { margin-top: 22px; font-size: 13px; color: var(--muted); display: flex; align-items: center; gap: 8px; }
.pp-orb { position: relative; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; }
.pp-orb-glow { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.pp-hero-deco { position: absolute; right: -120px; top: -80px; width: 520px; height: 520px; opacity: 0.5; pointer-events: none; }

.pp-hero-preview {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 340px;
  background: var(--paper-card);
  border: 1px solid rgba(30,17,40,.08);
  border-radius: 20px;
  padding: 24px 26px;
  box-shadow: var(--shadow-lg);
}
.pp-hero-preview-tag { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; color: var(--plum-2); margin-bottom: 16px; }
.pp-hero-preview-flow { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 15px; font-weight: 600; color: var(--ink); }
.pp-hero-preview-flow .arrow { color: var(--gold); font-weight: 400; }
.pp-hero-preview-callout { font-size: 12.5px; color: #5C400A; line-height: 1.5; margin: 16px 0 0; background: #F8F0E0; border: 1px solid rgba(168,118,30,.25); border-radius: 10px; padding: 10px 12px; }
.pp-hero-preview-callout b { color: #5C400A; }
.pp-hero-preview-stats { display: flex; gap: 26px; margin: 18px 0 14px; padding-top: 14px; border-top: 1px solid rgba(30,17,40,.08); }
.pp-hero-preview-stats .l { font-size: 10.5px; text-transform: uppercase; letter-spacing: .06em; font-weight: 800; color: var(--plum-2); }
.pp-hero-preview-stats .v { font-family: var(--display); font-size: 25px; font-weight: 600; color: var(--plum); margin-top: 3px; }
.pp-hero-preview-fine { font-size: 11.5px; color: var(--muted); }

/* ── Cards ─────────────────────────────────────────────────────────────────── */
.pp-card {
  background: var(--paper-card);
  border: 1px solid rgba(30,17,40,.08);
  border-radius: 20px;
  padding: 26px 28px;
  box-shadow: var(--shadow-sm);
  transition: box-shadow .2s ease;
}
.pp-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.pp-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }

.pp-feat-ic {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(145deg, var(--plum) 0%, var(--plum-2) 100%);
  color: var(--gold-2);
  display: grid;
  place-items: center;
  flex: none;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.14), 0 4px 12px rgba(46,20,82,.28);
}
.pp-featcard { transition: transform .2s ease, box-shadow .2s ease; }
.pp-featcard:hover { transform: translateY(-4px); box-shadow: 0 6px 20px rgba(46,20,82,.12), 0 20px 40px rgba(46,20,82,.08); border-color: var(--violet); }
.pp-band {
  background: var(--noise), radial-gradient(ellipse 60% 90% at 15% 0%, rgba(112,68,190,.28) 0%, transparent 60%), linear-gradient(155deg, #24103F 0%, var(--plum) 55%, #3A1C6C 100%);
  color: #EFE6F7;
  position: relative;
}
.pp-band .pp-eyebrow { color: var(--gold-2); }

/* Library boxes */
.pp-box {
  text-align: left;
  background: var(--paper-card);
  border: 1px solid rgba(30,17,40,.09);
  border-radius: 18px;
  padding: 24px;
  transition: transform .16s, box-shadow .16s, border-color .16s;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  box-shadow: var(--shadow-sm);
}
.pp-box:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(46,20,82,.12), 0 20px 40px rgba(46,20,82,.08);
  border-color: var(--violet);
}
.pp-box-ic {
  width: 48px;
  height: 48px;
  border-radius: 13px;
  background: linear-gradient(145deg, var(--plum) 0%, var(--plum-2) 100%);
  color: var(--gold-2);
  display: grid;
  place-items: center;
  box-shadow: 0 4px 12px rgba(46,20,82,.25);
}
.pp-box h3 { font-size: 20px; }
.pp-box p { font-size: 14px; color: var(--muted); }
.pp-box-foot { margin-top: auto; font-size: 13px; font-weight: 700; color: var(--violet); display: inline-flex; align-items: center; gap: 6px; }
.pp-box-count { font-size: 12px; color: var(--muted); font-weight: 600; }

/* ── Planner ──────────────────────────────────────────────────────────────── */
.pp-planner { max-width: 760px; margin: 0 auto; padding: 44px 0 88px; }
.pp-fs {
  background: var(--paper-card);
  border: 1px solid rgba(30,17,40,.09);
  border-radius: 20px;
  padding: 28px 30px;
  margin-bottom: 20px;
  box-shadow: var(--shadow-sm);
}

/* ── Planner progress bar ─────────────────────────────────────────────────── */
.pp-timeline {
  margin-top: 16px; padding: 16px 18px; border-radius: 14px;
  background: var(--paper-card); border: 1px solid var(--line);
}
.pp-timeline-hd {
  display: flex; align-items: center; gap: 7px; font-size: 11px; font-weight: 800;
  text-transform: uppercase; letter-spacing: .06em; color: var(--plum-2); margin-bottom: 12px;
}
.pp-timeline-track { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px; -webkit-overflow-scrolling: touch; }
.pp-timeline-node {
  flex: 1; min-width: 130px; padding: 11px 13px; border-radius: 11px;
  background: var(--violet-soft); border: 1px solid var(--violet-mid);
}
.pp-timeline-node.now { background: var(--panel); border-color: var(--line); }
.pp-timeline-node .age { font-size: 11px; font-weight: 800; color: var(--plum); text-transform: uppercase; letter-spacing: .04em; }
.pp-timeline-node .lbl { font-size: 13px; color: var(--ink); margin-top: 3px; font-weight: 600; }
.pp-timeline-node .chg { font-size: 12.5px; color: var(--muted); margin-top: 3px; }
.pp-timeline-note { font-size: 12px; color: var(--muted); margin-top: 10px; }

.pp-lifeevent { padding: 12px 0; border-top: 1px solid var(--line); }
.pp-lifeevent:first-of-type { border-top: none; }
.pp-lifeevent > .pp-input { margin-bottom: 8px; }
.pp-lifeevent-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.pp-lifeevent-row > select.pp-input { flex: 1; min-width: 180px; }
.pp-lifeevent-rm {
  background: none; border: 1px solid var(--line); border-radius: 8px; color: var(--muted);
  width: 34px; height: 34px; flex: none; cursor: pointer; font-size: 14px;
}
.pp-lifeevent-rm:hover { color: #B73737; border-color: #B73737; }

.pp-progress { display: flex; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 4px 0; }
.pp-progress-step { display: flex; align-items: center; flex: 1; min-width: 0; background: none; border: none; padding: 0; font-family: inherit; cursor: pointer; }
.pp-progress-step.current .pp-progress-dot { border-color: var(--plum); color: var(--plum); box-shadow: 0 0 0 3px rgba(112,68,190,.16); }
.pp-progress-step.current.done .pp-progress-dot { background: var(--plum); border-color: var(--plum); color: #fff; }
.pp-progress-step.current .pp-progress-label { color: var(--plum); }
.pp-wizard-nav { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 18px; }
.pp-wizard-count { font-size: 12.5px; font-weight: 700; color: var(--muted); }
@media (max-width: 480px) { .pp-wizard-count { display: none; } }
.pp-progress-dot {
  width: 26px; height: 26px; border-radius: 999px; flex: none;
  display: grid; place-items: center; font-size: 12.5px; font-weight: 700;
  background: #fff; border: 1.5px solid var(--line); color: var(--muted);
  transition: all .2s ease;
}
.pp-progress-step.done .pp-progress-dot { background: var(--green); border-color: var(--green); color: #fff; }
.pp-progress-label { font-size: 12.5px; font-weight: 700; color: var(--muted); margin: 0 8px; white-space: nowrap; }
.pp-progress-step.done .pp-progress-label { color: var(--plum); }
.pp-progress-line { flex: 1; height: 2px; background: var(--line); min-width: 12px; }
.pp-progress-step.done .pp-progress-line { background: var(--green); }

/* ── Planner early-value teaser ───────────────────────────────────────────── */
.pp-teaser {
  background: var(--noise), linear-gradient(135deg, var(--plum) 0%, #2E1A40 100%);
  color: #fff; border-radius: 18px; padding: 20px 24px; margin-bottom: 20px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 6px 20px rgba(30,17,40,.18);
}
.pp-teaser-eyebrow {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em;
  color: var(--gold-2); margin-bottom: 10px;
}
.pp-teaser-row { display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
.pp-teaser-big { font-family: var(--display); font-size: 38px; font-weight: 600; line-height: 1; }
.pp-teaser-big span { font-size: 17px; font-weight: 500; color: #C9B4E4; }
.pp-teaser-sub { font-size: 13.5px; color: #D9C9EE; margin-top: 5px; }
.pp-teaser-aside { font-size: 13.5px; color: #C9B4E4; line-height: 1.55; max-width: 22em; }
@media (max-width: 560px) { .pp-progress-label { display: none; } }
.pp-fs-head { display: flex; gap: 14px; align-items: center; }
.pp-fs-num {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: linear-gradient(145deg, var(--plum) 0%, var(--plum-2) 100%);
  color: var(--gold-2);
  display: grid;
  place-items: center;
  font-family: var(--display);
  font-weight: 700;
  font-size: 15px;
  flex: none;
  box-shadow: 0 3px 10px rgba(46,20,82,.28);
}
.pp-fs h3 { font-size: 22px; }
.pp-fs-sub { color: var(--muted); font-size: 14px; margin: 3px 0 24px 46px; line-height: 1.5; }
.pp-field { margin-bottom: 18px; }
.pp-field:last-child { margin-bottom: 0; }
.pp-label2 { display: block; font-weight: 700; font-size: 14px; margin-bottom: 7px; color: var(--plum); }
.pp-help { font-size: 12.5px; color: var(--muted); margin-top: 7px; line-height: 1.5; }
.pp-help b { color: var(--plum-2); }
.pp-privacy-note { display: flex; align-items: flex-start; gap: 9px; background: var(--violet-soft); border: 1px solid var(--violet-mid); border-radius: 12px; padding: 11px 15px; font-size: 13px; color: var(--plum-2); margin: 0 0 22px; max-width: 46em; line-height: 1.5; }
.pp-privacy-note svg { flex: none; margin-top: 2px; color: var(--violet); }
.pp-privacy-note b { color: var(--plum); }
.pp-input-wrap {
  display: flex;
  align-items: center;
  background: #fff;
  border: 1.5px solid rgba(30,17,40,.17);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(30,17,40,.045);
  transition: border-color .14s, box-shadow .14s;
}
.pp-input-wrap:focus-within {
  border-color: var(--violet);
  box-shadow: inset 0 1px 2px rgba(30,17,40,.03), 0 0 0 3px rgba(112,68,190,.13);
}
.pp-adorn { padding: 0 4px 0 14px; color: var(--muted); font-weight: 700; font-size: 15px; }
.pp-adorn.r { padding: 0 14px 0 4px; }
.pp-input {
  border: 0;
  outline: 0;
  padding: 14px;
  font-size: 16px;
  font-family: var(--sans);
  font-weight: 600;
  color: var(--ink);
  width: 100%;
  background: transparent;
}
.pp-input::-webkit-outer-spin-button, .pp-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.pp-select {
  width: 100%;
  background: #fff;
  border: 1.5px solid rgba(30,17,40,.17);
  border-radius: 12px;
  padding: 14px 42px 14px 14px;
  font-size: 16px;
  font-family: var(--sans);
  font-weight: 600;
  color: var(--ink);
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236A5872' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  transition: border-color .14s, box-shadow .14s;
}
.pp-select:focus { outline: 0; border-color: var(--violet); box-shadow: 0 0 0 3px rgba(112,68,190,.13); }
.pp-grid-money { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
.pp-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.pp-seg { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
.pp-segc {
  text-align: left;
  background: #fff;
  border: 1.5px solid rgba(30,17,40,.14);
  border-radius: 14px;
  padding: 15px;
  transition: all .14s;
  box-shadow: 0 1px 3px rgba(30,17,40,.04);
}
.pp-segc:hover { border-color: var(--violet); box-shadow: 0 2px 10px rgba(112,68,190,.14); transform: translateY(-1px); }
.pp-segc.on { border-color: var(--plum); background: linear-gradient(160deg, #F1E9FA 0%, var(--violet-soft) 100%); box-shadow: inset 0 1px 0 rgba(255,255,255,.7), 0 0 0 2px rgba(112,68,190,.2), 0 4px 14px rgba(112,68,190,.12); }
.pp-segc .nm { font-weight: 700; font-size: 15.5px; display: flex; justify-content: space-between; align-items: center; }
.pp-segc .rt { font-size: 12px; color: var(--gold); font-weight: 800; }
.pp-segc .ds { font-size: 12.5px; color: var(--muted); margin-top: 5px; }
.pp-segc .who { font-size: 11.5px; color: var(--plum-2); margin-top: 8px; padding-top: 8px; border-top: 1px dashed rgba(30,17,40,.12); line-height: 1.5; }
.pp-segc .who i { font-style: normal; color: var(--ink); }
.pp-toggle { display: flex; gap: 10px; }
.pp-toggle button {
  flex: 1;
  background: #fff;
  border: 1.5px solid rgba(30,17,40,.14);
  border-radius: 12px;
  padding: 12px;
  font-weight: 700;
  font-size: 14.5px;
  color: var(--muted);
  transition: all .14s;
}
.pp-toggle button.on { border-color: var(--plum); background: linear-gradient(160deg, #F1E9FA 0%, var(--violet-soft) 100%); color: var(--plum); box-shadow: inset 0 1px 0 rgba(255,255,255,.6); }
/* Compact inline toggle (e.g. $ amount / % of income beside a field label) */
.pp-label-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; }
.pp-toggle-sm { gap: 6px; flex: none; }
.pp-toggle-sm button { flex: 0 0 auto; padding: 5px 12px; font-size: 12.5px; font-weight: 700; border-radius: 9px; }

/* validation */
.pp-error { font-size: 12.5px; color: var(--rose); margin-top: 6px; font-weight: 600; }
.pp-input-wrap.err { border-color: var(--rose); }
.pp-warn-rate {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  background: #FBE9E9;
  border: 1px solid #E7B9B9;
  border-radius: 11px;
  padding: 11px 14px;
  font-size: 12.5px;
  color: #8A3030;
  margin-top: 8px;
}

/* local-storage save banner */
.pp-savebanner {
  display: flex;
  gap: 10px;
  align-items: center;
  background: var(--violet-soft);
  border: 1px solid var(--violet-mid);
  border-radius: 14px;
  padding: 14px 18px;
  font-size: 13.5px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  box-shadow: 0 2px 8px rgba(112,68,190,.1);
}
.pp-savebanner b { color: var(--plum); }

/* expandable advanced section */
.pp-acc {
  border: 1px dashed rgba(30,17,40,.14);
  border-radius: 14px;
  background: rgba(255,255,255,.5);
  margin-top: 4px;
}
.pp-acc-head { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 10px; background: none; border: 0; padding: 16px 18px; text-align: left; }
.pp-acc-head h4 { font-size: 16.5px; }
.pp-acc-head .sub { font-size: 12.5px; color: var(--muted); margin-top: 2px; }
.pp-acc-body { padding: 0 18px 18px; }
.pp-chev { transition: transform .2s; color: var(--muted); flex: none; }
.pp-chev.open { transform: rotate(180deg); }

/* ── Dashboard ─────────────────────────────────────────────────────────────── */
.pp-dash-head {
  background:
    var(--noise),
    radial-gradient(ellipse 70% 60% at 88% 8%, rgba(201,154,66,.16) 0%, transparent 60%),
    linear-gradient(138deg, #1E0C40 0%, #2C1458 40%, #3D2080 75%, #4E2D9E 100%);
  color: #fff;
  border-radius: 26px;
  padding: 38px 40px;
  box-shadow: 0 1px 0 rgba(255,255,255,.06) inset, 0 4px 12px rgba(30,17,40,.18), 0 20px 56px rgba(30,17,40,.28);
  position: relative;
  overflow: hidden;
}
.pp-dash-head::before {
  content: '';
  position: absolute;
  top: -40%;
  right: -10%;
  width: 55%;
  height: 200%;
  background: radial-gradient(ellipse, rgba(112,68,190,.35) 0%, transparent 70%);
  pointer-events: none;
}
.pp-dash-head .pp-eyebrow { color: var(--gold-2); position: relative; }
.pp-dash-head .big {
  font-family: var(--display);
  font-size: 54px;
  font-weight: 600;
  margin: 10px 0 4px;
  letter-spacing: -0.02em;
  position: relative;
  background: linear-gradient(100deg, #fff 0%, #fff 55%, #E8D9F7 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 24px rgba(112,68,190,.35);
}
.pp-dash-head .cap { color: rgba(222,210,242,.85); font-size: 15px; position: relative; }
.pp-scn {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 20px;
  position: relative;
}
.pp-scnc {
  border-radius: 14px;
  padding: 16px 18px;
  background: rgba(255,255,255,.09);
  border: 1px solid rgba(255,255,255,.14);
  backdrop-filter: blur(4px);
  transition: background .18s, border-color .18s, transform .18s;
}
.pp-scnc:hover { background: rgba(255,255,255,.13); border-color: rgba(255,255,255,.22); transform: translateY(-2px); }
.pp-scnc .lab {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .07em;
  color: rgba(200,180,235,.9);
}
.pp-scnc .val {
  font-family: var(--display);
  font-size: 24px;
  font-weight: 600;
  margin-top: 5px;
  color: #fff;
}
.pp-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--line-soft);
  font-size: 15px;
}
.pp-stat:last-child { border-bottom: 0; }
.pp-stat b { font-family: var(--display); font-weight: 600; font-size: 17px; }
.pp-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: var(--violet-soft);
  color: var(--plum-2);
  border-radius: 999px;
  padding: 6px 13px;
  font-size: 13px;
  font-weight: 700;
}
.pp-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
.pp-list li { display: flex; gap: 11px; align-items: flex-start; font-size: 14.5px; line-height: 1.5; }
.pp-list .ic { flex: none; margin-top: 2px; }
.pp-good { color: #3D7A3B; }
.pp-warn { color: #9A6010; }
.pp-acct .num { font-family: var(--display); font-size: 22px; font-weight: 600; color: var(--plum); }
.pp-tag { font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gold); }
.pp-bal { font-size: 13px; color: var(--muted); }
.pp-bal b { color: var(--ink); }
/* Room/limit figure is supporting info, not "your money" — kept visually smaller than the balance above it. */
.pp-acct-room { display: flex; align-items: baseline; gap: 6px; margin-top: 6px; }
.pp-acct-room-label { font-size: 10.5px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
.pp-acct-room-val { font-size: 14px; font-weight: 700; color: var(--gold); }

/* section heading helper */
.pp-sec-h { font-size: 28px; margin: 10px 0 8px; }
.pp-sec-lead { color: var(--muted); font-size: 15px; max-width: 46em; margin-bottom: 18px; line-height: 1.6; }

/* Chapter heading — one per dashboard tab, sized well above pp-sec-h so the tab you're in is
   unmistakable at a glance. Restrained/editorial on purpose (quiet rule + inline numbering,
   not a badge) — this app may be shown to wealth managers, so "clear" beats "loud". */
.pp-chapter { border-top: 1px solid var(--line); padding-top: 40px; margin-top: 8px; }
.pp-chapter .pp-eyebrow { font-size: 12.5px; font-weight: 800; letter-spacing: 0.2em; }
.pp-chapter-num { color: var(--gold); font-weight: 800; margin-right: 1px; }
.pp-chapter-h { font-size: 46px; margin: 10px 0 14px; letter-spacing: -0.02em; line-height: 1.04; }
@media (max-width: 760px) {
  .pp-chapter-h { font-size: 32px; }
  .pp-chapter { padding-top: 28px; }
}

/* ── Paycheque breakdown ──────────────────────────────────────────────────── */
.pp-pay-grid { display: grid; grid-template-columns: 1.15fr 1fr; gap: 24px; align-items: start; }
.pp-waterfall { width: 100%; }
.pp-bar-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.pp-bar-lab { width: 132px; font-size: 13px; font-weight: 600; flex: none; color: var(--ink); }
.pp-bar-track { flex: 1; height: 28px; background: var(--panel); border-radius: 8px; overflow: hidden; position: relative; }
.pp-bar-fill { height: 100%; border-radius: 8px; transition: width .55s cubic-bezier(.4,0,.2,1); }
.pp-bar-val { width: 92px; text-align: right; font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums; flex: none; }
.pp-taxtable { width: 100%; border-collapse: collapse; font-size: 14px; }
.pp-taxtable td { padding: 10px 0; border-bottom: 1px solid var(--line-soft); }
.pp-taxtable td:last-child { text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }
.pp-taxtable tr.tot td { border-top: 2px solid var(--line); border-bottom: 0; padding-top: 13px; font-size: 15.5px; }
.pp-taxtable tr.tot td b { font-family: var(--display); }
.pp-swatch { display: inline-block; width: 11px; height: 11px; border-radius: 3px; margin-right: 8px; vertical-align: middle; }
.pp-rates { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 14px; }
.pp-rate-chip {
  background: var(--violet-soft);
  border-radius: 14px;
  padding: 14px 18px;
  flex: 1;
  min-width: 130px;
  border: 1px solid var(--violet-mid);
}
.pp-rate-chip .l { font-size: 11px; text-transform: uppercase; letter-spacing: .07em; font-weight: 800; color: var(--plum-2); }
.pp-rate-chip .v { font-family: var(--display); font-size: 26px; font-weight: 600; color: var(--plum); margin-top: 4px; }
.pp-rate-chip .h { font-size: 11.5px; color: var(--muted); margin-top: 3px; }

/* ── Room tracking ────────────────────────────────────────────────────────── */
.pp-room { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.pp-roomc {
  background: var(--paper-card);
  border: 1px solid rgba(30,17,40,.09);
  border-radius: 18px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 9px;
  box-shadow: var(--shadow-sm);
}
.pp-roomc h4 { font-size: 20px; display: flex; justify-content: space-between; align-items: center; }
.pp-room-bar { height: 10px; background: var(--panel); border-radius: 999px; overflow: hidden; display: flex; }
.pp-room-bar i { height: 100%; display: block; border-radius: 999px; transition: width .4s ease; }
.pp-room-legend { font-size: 12px; color: var(--muted); display: flex; justify-content: space-between; }
.pp-room-big { font-family: var(--display); font-size: 28px; font-weight: 600; color: var(--plum); }
.pp-room-sub { font-size: 12.5px; color: var(--muted); }
.pp-overwarn {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  background: #FBE9E9;
  border: 1px solid #E7B9B9;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 12.5px;
  color: #8A3030;
  margin-top: 4px;
}
.pp-roomnote {
  display: flex; gap: 8px; align-items: flex-start;
  background: #F8F0E0; border: 1px solid rgba(168,118,30,.25);
  border-radius: 10px; padding: 10px 12px; font-size: 12px; color: #5C400A;
  margin-top: 8px; line-height: 1.5;
}
.pp-roomnote b { color: var(--gold); }

/* ── Deadline ─────────────────────────────────────────────────────────────── */
.pp-deadline {
  display: flex;
  gap: 20px;
  align-items: center;
  background: linear-gradient(120deg, var(--violet-soft) 0%, #F3ECDB 100%);
  border: 1px solid var(--violet-mid);
  border-radius: 18px;
  padding: 22px 26px;
  box-shadow: var(--shadow-sm);
}
.pp-deadline .ring { flex: none; }
.pp-deadline .big { font-family: var(--display); font-size: 32px; font-weight: 600; color: var(--plum); }

/* ── Sliders ──────────────────────────────────────────────────────────────── */
.pp-sliders { display: grid; grid-template-columns: 1fr 1fr; gap: 20px 28px; }
.pp-slider .top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 7px; }
.pp-slider .top .l { font-weight: 700; font-size: 14px; color: var(--plum); }
.pp-slider .top .v { font-family: var(--display); font-weight: 600; color: var(--plum); font-size: 16px; }
.pp-range {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: var(--panel);
  outline: none;
}
.pp-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(145deg, var(--plum) 0%, var(--plum-2) 100%);
  border: 3px solid var(--paper-card);
  box-shadow: 0 2px 6px rgba(46,20,82,.40);
  cursor: pointer;
  transition: transform .12s;
}
.pp-range::-webkit-slider-thumb:hover { transform: scale(1.15); }
.pp-range::-moz-range-thumb {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(145deg, var(--plum) 0%, var(--plum-2) 100%);
  border: 3px solid var(--paper-card);
  cursor: pointer;
}
.pp-range:focus-visible { outline: 2px solid var(--violet); outline-offset: 2px; }
.pp-toggles { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px; }
.pp-tog {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  background: rgba(255,255,255,.8);
  border: 1.5px solid rgba(30,17,40,.14);
  border-radius: 999px;
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
  transition: all .14s;
}
.pp-tog.on { border-color: var(--plum); background: var(--violet-soft); color: var(--plum); }

/* per-month contribution grid */
.pp-months { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 4px 0 18px; }
.pp-month label { display: block; font-size: 11px; font-weight: 800; color: var(--muted); margin-bottom: 4px; text-transform: uppercase; letter-spacing: .05em; }
.pp-month .pp-input { padding: 9px 10px; font-size: 14px; }
.pp-month .pp-adorn { padding: 0 2px 0 10px; }
.pp-month-total { grid-column: 1 / -1; font-size: 13.5px; color: var(--muted); text-align: right; }
.pp-month-total b { color: var(--plum); font-family: var(--display); }
.pp-month.past .pp-input { background: #EFEAE0; color: var(--muted); }
.pp-month.past label { opacity: .6; }

/* account groups */
.pp-acctgroup { border: 1px solid rgba(30,17,40,.10); border-radius: 16px; padding: 18px 18px 6px; margin-bottom: 16px; background: var(--paper-card); }
.pp-acctgroup > h4 { display: flex; align-items: center; gap: 7px; font-size: 15.5px; font-family: var(--display); color: var(--plum); margin-bottom: 14px; }
.pp-acctgroup.need { border-color: #C98A2E; box-shadow: 0 0 0 2px rgba(201,138,46,.15); }
.pp-req { font-family: var(--sans); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; color: #9A6010; background: #F3E4C8; padding: 2px 8px; border-radius: 999px; margin-left: auto; }

/* emergency-fund sub-card */
.pp-subcard { border: 1px dashed rgba(30,17,40,.13); border-radius: 14px; padding: 16px; margin: 4px 0 8px; background: rgba(112,68,190,.04); }
.pp-sub-h { font-family: var(--display); font-size: 16px; color: var(--plum); margin-bottom: 12px; }
.pp-seg2 { display: flex; gap: 8px; flex-wrap: wrap; }
.pp-seg2 button { flex: 1; min-width: 90px; background: #fff; border: 1.5px solid rgba(30,17,40,.14); border-radius: 10px; padding: 9px 10px; font-size: 13px; font-weight: 700; color: var(--muted); cursor: pointer; transition: all .12s; }
.pp-seg2 button.on { border-color: var(--violet); background: var(--violet-soft); color: var(--plum); }
input[type="date"].pp-input { font-family: var(--sans); color: var(--ink); }
.pp-inlinelink { background: none; border: 0; padding: 0; color: var(--violet); font-weight: 700; font-size: inherit; cursor: pointer; font-family: inherit; }
.pp-inlinelink:hover { color: var(--plum); text-decoration: underline; }

/* ── Dashboard snapshot row ───────────────────────────────────────────────── */
.pp-snap { display: grid; grid-template-columns: repeat(auto-fit, minmax(165px, 1fr)); gap: 14px; margin: 18px 0 10px; }
.pp-snapc {
  background: var(--paper-card);
  border: 1px solid rgba(30,17,40,.09);
  border-radius: 16px;
  padding: 16px 18px;
  box-shadow: var(--shadow-sm);
}
.pp-snapc .l { font-size: 10.5px; text-transform: uppercase; letter-spacing: .07em; font-weight: 800; color: var(--plum-2); }
.pp-snapc .v { font-family: var(--display); font-size: 22px; font-weight: 600; color: var(--plum); margin-top: 4px; line-height: 1.1; }
.pp-snapc .h { font-size: 11.5px; color: var(--muted); margin-top: 2px; }
@media (max-width: 760px) { .pp-snap { grid-template-columns: repeat(2, 1fr); } }

/* ── Section-jump nav ─────────────────────────────────────────────────────── */
.pp-secnav-guide {
  font-size: 13px; color: var(--muted); line-height: 1.55;
  background: var(--violet-soft); border: 1px solid var(--violet-mid);
  border-radius: 12px; padding: 11px 16px; margin: 14px 0 10px;
}
.pp-secnav-guide b { color: var(--plum); }
.pp-secnav { display: flex; gap: 7px; flex-wrap: wrap; align-items: center; margin: 8px 0 6px; }
.pp-secnav-label {
  font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: .07em;
  color: var(--muted); margin-right: 2px;
}
.pp-secnav-divider { width: 1px; height: 22px; background: var(--line); margin: 0 4px; }
@media (max-width: 640px) {
  .pp-secnav { gap: 8px 7px; }
  .pp-secnav-label { width: 100%; flex-basis: 100%; margin: 4px 0 0; }
  .pp-secnav-divider { display: none; }
}
.pp-next-link {
  display: inline-flex; align-items: center; gap: 7px; margin-top: 16px;
  font-size: 13.5px; font-weight: 700; color: var(--violet);
  background: var(--violet-soft); border: 1px solid var(--violet);
  border-radius: 999px; padding: 9px 18px; cursor: pointer; font-family: var(--sans);
  transition: background .15s ease;
}
.pp-next-link:hover { background: #EDE3FA; }
.pp-secnav button.core {
  background: #fff; border-color: var(--violet); color: var(--plum);
}
.pp-secnav button.core.active { background: var(--plum); color: #fff; border-color: var(--plum); }
.pp-secnav a, .pp-secnav button {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--plum-2);
  background: rgba(255,255,255,.75);
  border: 1px solid rgba(30,17,40,.12);
  border-radius: 999px;
  padding: 6px 14px;
  text-decoration: none;
  cursor: pointer;
  font-family: inherit;
  box-shadow: 0 1px 3px rgba(30,17,40,.06);
  transition: all .13s;
}
.pp-secnav a:hover, .pp-secnav button:hover {
  background: #fff;
  color: var(--plum);
  border-color: var(--violet);
  box-shadow: 0 2px 8px rgba(112,68,190,.14);
}
.pp-secnav button.active {
  background: var(--plum);
  color: #fff;
  border-color: var(--plum);
  box-shadow: 0 2px 8px rgba(30,17,40,.20);
}
/* Collapse all / Expand all — a subtle text action, pushed to the right of the tabs */
.pp-secnav button.pp-secnav-all {
  margin-left: auto; background: none; border: none; box-shadow: none;
  color: var(--violet); text-decoration: underline; padding: 6px 8px;
}
.pp-secnav button.pp-secnav-all:hover { background: none; border: none; box-shadow: none; color: var(--plum); }
@media (max-width: 760px) { .pp-secnav button.pp-secnav-all { margin-left: 0; } }

/* ── Goal selector ────────────────────────────────────────────────────────── */
.pp-goalgrid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 6px 0 14px; }
.pp-goalc { text-align: left; background: #fff; border: 1.5px solid rgba(30,17,40,.12); border-radius: 16px; padding: 16px; cursor: pointer; color: var(--plum); position: relative; transition: all .14s; }
.pp-goalcheck { position: absolute; top: 10px; right: 10px; width: 22px; height: 22px; border-radius: 7px; background: var(--violet); color: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(112,68,190,.35); }
.pp-goalc svg { color: var(--violet); margin-bottom: 7px; }
.pp-goalc .nm { font-family: var(--display); font-size: 17px; font-weight: 600; }
.pp-goalc .ds { font-size: 12.5px; color: var(--muted); margin-top: 3px; }
.pp-goalc.on { border-color: var(--violet); background: linear-gradient(160deg, #F1E9FA 0%, var(--violet-soft) 100%); box-shadow: inset 0 1px 0 rgba(255,255,255,.7), 0 0 0 2px rgba(112,68,190,.16), 0 4px 14px rgba(112,68,190,.1); }

/* ── Action plan ──────────────────────────────────────────────────────────── */
.pp-plan { display: flex; flex-direction: column; gap: 10px; }
.pp-step {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 16px 18px;
  border: 1px solid rgba(30,17,40,.09);
  border-radius: 16px;
  background: var(--paper-card);
  box-shadow: 0 1px 3px rgba(30,17,40,.04);
}
.pp-step.now {
  border-color: var(--violet);
  background: var(--violet-soft);
  box-shadow: 0 0 0 2px rgba(112,68,190,.16), 0 4px 14px rgba(112,68,190,.12);
}
.pp-step.urgent {
  border-color: rgba(183,55,55,.45);
  background: #FBEEEC;
  box-shadow: 0 0 0 2px rgba(183,55,55,.12), 0 4px 14px rgba(183,55,55,.10);
}
.pp-step.urgent .pp-step-ic { background: #B73737; color: #fff; border-color: #B73737; box-shadow: 0 3px 10px rgba(183,55,55,.35); }
.pp-step.done { opacity: .6; }
.pp-thismonth {
  margin: 14px 0 4px;
  padding: 14px 18px;
  border-radius: 14px;
  background: var(--noise), linear-gradient(135deg, var(--plum) 0%, #2E1A40 100%);
  color: #fff;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 4px 16px rgba(30,17,40,.18);
}
.pp-thismonth-lbl {
  font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em;
  color: var(--gold-2); margin-bottom: 4px;
}
.pp-thismonth-line { font-size: 16px; line-height: 1.5; color: #F2EAFA; }
.pp-thismonth-line b { font-family: var(--display); color: #fff; font-weight: 700; }
.pp-thismonth-line b.urgent { color: #FFB4A8; }
.pp-step-ic {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 1px solid rgba(30,17,40,.13);
  font-weight: 800;
  color: var(--plum);
  font-family: var(--display);
  font-size: 15px;
  box-shadow: 0 1px 4px rgba(30,17,40,.08);
}
.pp-step.now .pp-step-ic { background: var(--violet); color: #fff; border-color: var(--violet); box-shadow: 0 3px 10px rgba(112,68,190,.35); }
.pp-step-b { flex: 1; }
.pp-step-b h4 { font-size: 15.5px; color: var(--plum); display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; }
.pp-step-b .amt { font-family: var(--display); color: var(--violet); font-weight: 700; }
.pp-step-b p { font-size: 12.5px; color: var(--muted); margin-top: 3px; line-height: 1.5; }
.pp-step-tag { font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; color: #fff; background: var(--violet); padding: 3px 9px; border-radius: 999px; box-shadow: 0 2px 6px rgba(112,68,190,.3); }
.pp-step-tag.ok { background: var(--green); }
.pp-step-tag.urgent { background: #B73737; box-shadow: 0 2px 6px rgba(183,55,55,.3); }
.pp-step-tag.warn { background: var(--gold); box-shadow: 0 2px 6px rgba(168,118,30,.3); }
.pp-pbar { height: 5px; border-radius: 999px; background: var(--panel); overflow: hidden; margin-top: 9px; }
.pp-pbar > i { display: block; height: 100%; background: var(--violet); border-radius: 999px; }

/* ── Strategy comparison ──────────────────────────────────────────────────── */
.pp-strats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
.pp-strat { border: 1px solid rgba(30,17,40,.09); border-radius: 18px; padding: 20px; background: var(--paper-card); display: flex; flex-direction: column; box-shadow: var(--shadow-sm); }
.pp-strat.rec { border-color: var(--violet); box-shadow: 0 0 0 2px rgba(112,68,190,.18), var(--shadow-sm); background: #fff; }
.pp-strat .badge { align-self: flex-start; font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; color: #fff; background: linear-gradient(135deg, var(--plum), var(--plum-2)); padding: 3px 10px; border-radius: 999px; margin-bottom: 8px; }
.pp-strat h4 { font-family: var(--display); font-size: 20px; color: var(--plum); }
.pp-strat .ord { font-size: 12.5px; color: var(--muted); margin: 5px 0 13px; }
.pp-strat .metric { background: var(--violet-soft); border-radius: 11px; padding: 11px 14px; margin-bottom: 10px; }
.pp-strat .metric .l { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; font-weight: 800; color: var(--plum-2); }
.pp-strat .metric .v { font-family: var(--display); font-size: 22px; font-weight: 600; color: var(--plum); }
.pp-strat .why { font-size: 12.5px; color: var(--ink); margin-bottom: 6px; }
.pp-strat ul { list-style: none; display: flex; flex-direction: column; gap: 5px; margin: 2px 0 10px; }
.pp-strat ul li { font-size: 12.5px; color: var(--muted); display: flex; gap: 7px; align-items: flex-start; }
.pp-strat .trade { font-size: 12px; color: #9A6010; background: #F6EFDD; border-radius: 9px; padding: 9px 11px; margin-top: auto; border: 1px solid rgba(201,138,46,.2); }

/* ── Scorecard ────────────────────────────────────────────────────────────── */
.pp-score { display: grid; grid-template-columns: 150px 1fr; gap: 24px; align-items: center; }
.pp-score-ring { text-align: center; }
.pp-score-ring .num { font-family: var(--display); font-size: 40px; font-weight: 600; }
.pp-score-ring .out { font-size: 12px; color: var(--muted); }
.pp-score-bars { display: flex; flex-direction: column; gap: 12px; }
.pp-scrow .top { display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; color: var(--plum); }
.pp-scrow .top b { font-family: var(--display); }
.pp-scrow .bar { height: 7px; border-radius: 999px; background: var(--panel); overflow: hidden; margin-top: 5px; }
.pp-scrow .bar > i { display: block; height: 100%; border-radius: 999px; }
.pp-scrow .tip { font-size: 11.5px; color: var(--muted); margin-top: 4px; }

/* ── Opportunity cost table ───────────────────────────────────────────────── */
.pp-opp { width: 100%; border-collapse: collapse; margin-top: 4px; }
.pp-opp th, .pp-opp td { text-align: right; padding: 11px 14px; font-size: 13.5px; border-bottom: 1px solid var(--line-soft); }
.pp-opp th:first-child, .pp-opp td:first-child { text-align: left; font-weight: 700; color: var(--plum); }
.pp-opp thead th { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--plum-2); background: var(--panel); padding: 10px 14px; font-weight: 800; }
.pp-opp thead th:first-child { border-radius: 10px 0 0 0; }
.pp-opp thead th:last-child { border-radius: 0 10px 0 0; }
.pp-opp tbody tr:hover { background: rgba(112,68,190,.04); }
.pp-opp .good { color: var(--green); font-weight: 700; }
.pp-opp .bad { color: #9A6010; }

/* ── Bracket navigator ────────────────────────────────────────────────────── */
.pp-brackets { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.pp-brk { border: 1px solid rgba(30,17,40,.09); border-radius: 16px; padding: 18px; background: var(--paper-card); box-shadow: var(--shadow-sm); }
.pp-brk .l { font-size: 11px; text-transform: uppercase; letter-spacing: .07em; font-weight: 800; color: var(--plum-2); }
.pp-brk .v { font-family: var(--display); font-size: 24px; font-weight: 600; color: var(--plum); margin: 5px 0; }
.pp-brk .h { font-size: 12.5px; color: var(--muted); line-height: 1.5; }
.pp-brk.up { background: #F5EDD9; border-color: rgba(168,118,30,.2); }
.pp-brk.down { background: var(--violet-soft); border-color: var(--violet-mid); }

/* ── Chart ────────────────────────────────────────────────────────────────── */
.pp-chartwrap { position: relative; }
.pp-chartlegend { display: flex; align-items: center; gap: 6px 12px; flex-wrap: wrap; font-size: 12px; font-weight: 700; color: var(--plum-2); }
.pp-leg-item { display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; }
.pp-leg-item .dot { width: 14px; height: 3px; border-radius: 2px; display: inline-block; }
.pp-chartfocus { outline: none; }
.pp-chartfocus:focus-visible { outline: 2px solid var(--violet); outline-offset: 3px; border-radius: 10px; }
.pp-cmp { width: 100%; border-collapse: collapse; margin-top: 6px; }
.pp-cmp th, .pp-cmp td { padding: 12px 14px; font-size: 13px; text-align: right; border-bottom: 1px solid var(--line-soft); white-space: nowrap; }
.pp-cmp th:first-child, .pp-cmp td:first-child { text-align: left; white-space: normal; }
.pp-cmp thead th { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--plum-2); font-weight: 800; background: var(--panel); padding: 11px 14px; }
.pp-cmp thead th:first-child { border-radius: 10px 0 0 0; }
.pp-cmp thead th:last-child { border-radius: 0 10px 0 0; }
.pp-cmp tbody tr:nth-child(even) { background: rgba(30,17,40,.02); }
.pp-cmp tbody tr:hover { background: rgba(112,68,190,.04); }
.pp-cmp tbody tr.rec { background: var(--violet-soft); }
.pp-cmp tbody tr.rec:hover { background: var(--violet-mid); }
.pp-cmp .stratname { font-weight: 700; color: var(--plum); font-family: var(--display); }
.pp-cmp .recbadge { display: inline-block; font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; color: #fff; background: var(--violet); padding: 2px 7px; border-radius: 999px; margin-left: 6px; vertical-align: middle; }
.pp-cmp .ord { font-size: 11.5px; color: var(--muted); font-weight: 400; }
.pp-cmp .best { color: var(--green); font-weight: 800; }
/* Chart header: legend + horizon toggle */
.pp-chart-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; }
.pp-chart-horizon { display: inline-flex; background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 2px; flex: none; }
.pp-chart-horizon button { border: none; background: none; cursor: pointer; font-family: inherit; font-weight: 700; font-size: 12px; color: var(--muted); padding: 5px 11px; border-radius: 8px; }
.pp-chart-horizon button.on { background: #fff; color: var(--plum); box-shadow: 0 1px 3px rgba(30,17,40,.12); }
.pp-chart-horizon button:hover:not(.on) { color: var(--plum-2); }

/* Fixed readout strip — always visible, updates on scrub, never over the plot */
.pp-chart-readout { background: var(--paper-card); border: 1px solid var(--line); border-radius: 12px; padding: 9px 14px; margin-bottom: 8px; }
.pp-chart-readout-main { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.ro-when { font-size: 12px; font-weight: 700; color: var(--muted); }
.ro-total { font-size: 19px; font-weight: 800; color: var(--plum); font-variant-numeric: tabular-nums; }
.pp-chart-readout-break { display: flex; flex-wrap: wrap; gap: 5px 12px; margin-top: 5px; }
.ro-chip { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; font-weight: 700; color: var(--ink); white-space: nowrap; }
.ro-chip i { width: 9px; height: 9px; border-radius: 2px; display: inline-block; flex: none; }
.ro-chip.muted { color: var(--muted); }
.ro-chip.gold { color: var(--gold); font-weight: 800; }
.pp-chartkey { font-size: 12px; color: var(--muted); margin-top: 6px; }

/* ── Order of operations ──────────────────────────────────────────────────── */
.pp-ladder { display: flex; flex-direction: column; gap: 0; }
.pp-rung { display: flex; gap: 14px; align-items: flex-start; padding: 14px 0; border-bottom: 1px solid var(--line-soft); }
.pp-rung:last-child { border-bottom: 0; }
.pp-rung-n { width: 30px; height: 30px; border-radius: 999px; flex: none; display: grid; place-items: center; font-family: var(--display); font-weight: 600; font-size: 15px; background: var(--violet-soft); color: var(--plum-2); }
.pp-rung.flag .pp-rung-n { background: linear-gradient(145deg, var(--gold) 0%, #C99A42 100%); color: #fff; }
.pp-rung-b h4 { font-size: 16px; }
.pp-rung-b p { font-size: 13.5px; color: var(--muted); margin-top: 2px; }
.pp-rung-tip { font-size: 12.5px; color: var(--gold); font-weight: 700; margin-top: 5px; display: inline-flex; gap: 6px; align-items: center; }

/* ── Library topic ────────────────────────────────────────────────────────── */
.pp-topic { max-width: 760px; margin: 0 auto; }
.pp-topic h1 { font-size: 42px; margin: 14px 0 10px; }
.pp-topic-lead { font-size: 18.5px; color: var(--muted); margin-bottom: 32px; line-height: 1.6; }
.pp-prose p { font-size: 16px; margin-bottom: 18px; color: #30203C; line-height: 1.7; }
.pp-facts {
  background: var(--paper-card);
  border: 1px solid rgba(30,17,40,.09);
  border-radius: 18px;
  padding: 24px;
  margin: 26px 0;
  box-shadow: var(--shadow-sm);
}
.pp-facts h4 { font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; font-family: var(--sans); font-weight: 800; color: var(--plum); margin-bottom: 16px; }
.pp-facts dl { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 10px 20px; }
.pp-facts dt { font-weight: 700; font-size: 14px; }
.pp-facts dd { margin: 0; font-size: 14px; color: var(--muted); line-height: 1.5; }
.pp-callout {
  display: flex;
  gap: 13px;
  background: linear-gradient(135deg, var(--violet-soft) 0%, rgba(236,226,247,.7) 100%);
  border: 1px solid var(--violet-mid);
  border-radius: 16px;
  padding: 18px 20px;
  font-size: 14px;
  color: var(--plum-2);
  margin: 22px 0;
  box-shadow: 0 1px 4px rgba(112,68,190,.08);
}
.pp-back {
  background: none;
  border: 0;
  color: var(--muted);
  font-weight: 700;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 0;
  transition: color .13s;
}
.pp-back:hover { color: var(--plum); }
.pp-disclaimer {
  display: flex;
  gap: 14px;
  background: #FBF3E1;
  border: 1px solid rgba(168,118,30,.25);
  border-radius: 14px;
  padding: 16px 20px;
  font-size: 13.5px;
  color: #5E4312;
  line-height: 1.55;
}
.pp-disclaimer.tax { background: #EDF0FA; border-color: rgba(62,107,176,.2); color: #2E4070; }

/* ── Footer ───────────────────────────────────────────────────────────────── */
.pp-footer {
  background: var(--noise), linear-gradient(160deg, #1A0B38 0%, #221040 60%, #2A1450 100%);
  color: #C2AED6;
  padding: 52px 0 42px;
  position: relative;
}
.pp-footer .pp-brand-name { color: #fff; }
.pp-footer .pp-brand-name b { color: var(--gold-2); }
.pp-footer-cols { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 32px; margin: 28px 0; }
.pp-footer h5 { font-family: var(--sans); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #7A6692; margin: 0 0 12px; font-weight: 800; }
.pp-footer button, .pp-footer a { display: block; background: none; border: 0; color: #B09CC6; font-size: 14px; padding: 5px 0; text-align: left; text-decoration: none; transition: color .13s; }
.pp-footer button:hover, .pp-footer a:hover { color: #fff; }
.pp-footer-fine { font-size: 12px; color: #6A5882; border-top: 1px solid rgba(255,255,255,.08); padding-top: 22px; line-height: 1.65; }
.pp-footer-legal { display: flex; align-items: center; gap: 10px; margin-top: 10px; font-size: 12px; }
.pp-footer-legal a { display: inline; padding: 0; color: #8672A0; }
.pp-footer-legal a:hover { color: #fff; }
.pp-footer-legal span { color: #4A3D62; }

/* ── Invest banner + custom savings goals ─────────────────────────────────── */
.pp-invest-banner {
  background: var(--noise), radial-gradient(ellipse 65% 100% at 100% 0%, rgba(201,154,66,.14) 0%, transparent 60%), linear-gradient(135deg, var(--plum) 0%, #3D1D70 50%, #5230A0 100%);
  color: #fff;
  border-radius: 18px;
  padding: 20px 24px;
  margin: 4px 0 18px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 4px 14px rgba(46,20,82,.25);
}
.pp-invest-banner .l { font-size: 12.5px; color: #D8C6EE; font-weight: 700; }
.pp-invest-banner .v { font-family: var(--display); font-size: 34px; font-weight: 600; margin: 2px 0; line-height: 1.05; }
.pp-invest-banner .v .u { font-size: 15px; font-weight: 500; color: #C9B4E4; }
.pp-invest-banner .h { font-size: 13px; color: #C9B4E4; }
.pp-savedit { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; flex-wrap: wrap; }
.pp-savedit .pp-input { min-width: 0; }
.pp-savedit > .pp-input:first-child { flex: 1 1 180px; }
.pp-savedit-rm { flex: none; width: 34px; height: 34px; border-radius: 9px; border: 1px solid var(--line); background: #fff; color: var(--rose); cursor: pointer; font-size: 14px; }
.pp-savegoal { padding: 12px 0; border-top: 1px solid var(--line); }
.pp-savegoal:first-child { border-top: none; padding-top: 4px; }
.pp-savegoal .nm { font-weight: 700; color: var(--plum); font-family: var(--display); font-size: 16px; }
/* Goal affordability verdict banner */
.pp-goal-verdict { display: flex; gap: 9px; align-items: flex-start; border-radius: 12px; padding: 11px 15px; font-size: 13.5px; line-height: 1.5; margin-bottom: 6px; }
.pp-goal-verdict b { font-weight: 800; }
.pp-goal-verdict.ok { background: #EDF7ED; border: 1px solid #BFE3BF; color: #1F5A2E; }
.pp-goal-verdict.ok b { color: #14431F; }
.pp-goal-verdict.warn { background: #FBF1DC; border: 1px solid #E7C98C; color: #7A5A1E; }
.pp-goal-verdict.warn b { color: #5E4310; }
.pp-goal-verdict.neutral { background: var(--violet-soft); border: 1px solid var(--violet-mid); color: var(--plum-2); }

.pp-emptyguide {
  margin-top: 16px; text-align: center; padding: 32px 28px;
  background: var(--paper-card); border: 1.5px dashed var(--violet-mid); border-radius: 18px;
}
.pp-emptyguide-ic {
  width: 52px; height: 52px; border-radius: 14px; margin: 0 auto 14px;
  display: grid; place-items: center; color: var(--violet); background: var(--violet-soft);
}
.pp-emptyguide h3 { font-size: 22px; color: var(--plum); margin-bottom: 8px; }
.pp-emptyguide p { font-size: 14.5px; color: var(--muted); line-height: 1.6; max-width: 40em; margin: 0 auto 18px; }

.pp-stress {
  margin-top: 16px; padding: 16px 18px; border-radius: 14px;
  background: #FBEEEC; border: 1px solid rgba(183,55,55,.28);
}
.pp-stress-hd {
  display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 800;
  color: #B73737; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 12px;
}
.pp-stress-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.pp-stress-col { flex: 1; min-width: 120px; }
.pp-stress-lbl { font-size: 11.5px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
.pp-stress-val { font-family: var(--display); font-size: 28px; font-weight: 600; color: var(--plum); line-height: 1.1; }
.pp-stress-col.down .pp-stress-val { color: #B73737; }
.pp-stress-delta { font-size: 12.5px; font-weight: 700; color: #B73737; margin-top: 2px; }
.pp-stress-arrow { font-size: 22px; color: var(--muted); flex: none; }
.pp-stress p { font-size: 12.5px; color: var(--muted); line-height: 1.55; margin-top: 12px; }
.pp-stress p b { color: #B73737; }

.pp-cra-badge {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 11.5px; font-weight: 600; color: var(--teal, #1B7A6E);
  background: #E9F4F1; border: 1px solid rgba(27,122,110,.22);
  padding: 5px 11px; border-radius: 999px; margin-bottom: 14px;
}

.pp-tog-state {
  margin-top: 10px; padding: 9px 14px; border-radius: 10px;
  font-size: 13px; line-height: 1.5; color: #5C400A;
  background: #F8F0E0; border: 1px solid rgba(168,118,30,.25);
}
.pp-tog-state b { color: var(--gold); }
.pp-tog-state.today { color: #245A24; background: #EAF5EA; border-color: rgba(45,122,43,.25); }
.pp-tog-state.today b { color: var(--green); }

.pp-seewhy { margin-bottom: 14px; }
.pp-seewhy > summary {
  cursor: pointer; list-style: none; user-select: none;
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 13.5px; font-weight: 700; color: var(--violet);
  padding: 9px 16px; border: 1px solid var(--violet); border-radius: 999px;
  background: var(--violet-soft); transition: background .15s ease;
}
.pp-seewhy > summary:hover { background: #EDE3FA; }
.pp-seewhy > summary::-webkit-details-marker { display: none; }
.pp-seewhy > summary::before { content: "▸"; font-size: 11px; transition: transform .15s ease; }
.pp-seewhy[open] > summary::before { transform: rotate(90deg); }
.pp-seewhy-body { margin-top: 16px; }

.pp-resp-detail { margin-top: 12px; border-top: 1px solid var(--line); padding-top: 10px; }
.pp-resp-detail > summary {
  cursor: pointer; list-style: none; font-size: 13px; font-weight: 700; color: var(--violet);
  display: flex; align-items: center; gap: 6px; user-select: none;
}
.pp-resp-detail > summary::-webkit-details-marker { display: none; }
.pp-resp-detail > summary::before { content: "▸"; font-size: 11px; transition: transform .15s ease; }
.pp-resp-detail[open] > summary::before { transform: rotate(90deg); }
.pp-resp-detail-body { margin-top: 8px; }
.pp-resp-detail-body p { font-size: 12.5px; color: var(--muted); line-height: 1.55; margin-top: 8px; }
.pp-resp-detail-body p:first-child { margin-top: 0; }
.pp-resp-detail-body b { color: var(--plum); font-weight: 700; }

/* slider with typed input */
.pp-slider .top .vwrap { display: inline-flex; align-items: center; gap: 6px; }
.pp-slider .top .vin {
  width: 78px;
  background: #fff;
  border: 1.5px solid rgba(30,17,40,.15);
  border-radius: 9px;
  padding: 5px 8px;
  font-family: var(--display);
  font-weight: 600;
  color: var(--plum);
  font-size: 15px;
  text-align: right;
  box-shadow: 0 1px 3px rgba(30,17,40,.06);
}
.pp-slider .top .vin:focus { outline: 0; border-color: var(--violet); box-shadow: 0 0 0 3px rgba(112,68,190,.12); }
.pp-slider .top .vu { font-size: 13px; color: var(--muted); font-weight: 700; }

/* rec-hero card inside compare strategies */
.rec-hero { background: linear-gradient(145deg, #FDFAFF 0%, #F7F1FD 100%); }

/* ── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 860px) {
  .pp-hero-grid { grid-template-columns: 1fr; gap: 10px; padding: 46px 0 56px; }
  .pp-orb { display: none; }
  .pp-hero h1 { font-size: 38px; }
  .pp-grid-3, .pp-grid-2, .pp-grid-money, .pp-seg, .pp-row2, .pp-scn, .pp-pay-grid, .pp-room, .pp-sliders, .pp-brackets { grid-template-columns: 1fr; }
  .pp-months { grid-template-columns: repeat(3, 1fr); }
  .pp-navlink { padding: 7px 9px; font-size: 13.5px; }
  .pp-brand-name { font-size: 17px; }
  .pp-section { padding: 48px 0; }
  .pp-footer-cols { grid-template-columns: 1fr; gap: 22px; }
  .pp-dash-head { padding: 24px 26px; }
  .pp-dash-head .big { font-size: 40px; }
  .pp-fs-sub { margin-left: 0; }
  .pp-bar-lab { width: 104px; }
  .pp-bar-val { width: 80px; }
}
@media (max-width: 560px) {
  .pp-wrap { padding: 0 16px; }
  .pp-hero h1 { font-size: 30px; line-height: 1.1; }
  .pp-sec-h { font-size: 22px; }
  .pp-dash-head { padding: 20px; border-radius: 18px; }
  .pp-dash-head .big { font-size: 32px; }
  .pp-card { padding: 18px; border-radius: 16px; }
  .pp-snap { grid-template-columns: 1fr; }
  .pp-goalgrid { grid-template-columns: 1fr; }
  .pp-opp, .pp-cmp { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .pp-invest-banner .v { font-size: 28px; }
  .pp-savedit { gap: 6px; }
  .pp-savedit > .pp-input:first-child { flex: 1 1 100%; }
  .pp-btn { width: 100%; justify-content: center; }
  .pp-secnav button { font-size: 12px; padding: 5px 10px; }
  .pp-rate-chip .v { font-size: 20px; }
}
@media (max-width: 520px) { .pp-navlink.hide-sm { display: none; } }
@media (max-width: 860px) { .pp-score { grid-template-columns: 1fr; gap: 14px; } .pp-opp th, .pp-opp td { padding: 8px 7px; font-size: 12px; } .pp-goalgrid, .pp-strats { grid-template-columns: 1fr; } }

/* ── Print ────────────────────────────────────────────────────────────────── */
@media print {
  /* Hide chrome and interactive-only controls */
  .pp-topnav, .pp-footer, .pp-noprint, .pp-back, .pp-orb,
  .pp-chart-horizon, .pp-secnav, .pp-secnav-guide, .pp-secnav-all { display: none !important; }
  /* Keep every colour (chips, goal verdicts, chart bands, badges) in the printout */
  .pp, .pp * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .pp { background: #fff !important; }
  .pp-wrap { max-width: 100%; padding: 0; }
  /* Don't split cards, goals, verdicts, or the chart across pages */
  .pp-card, .pp-roomc, .pp-fs, .pp-invest-banner, .pp-brk,
  .pp-savegoal, .pp-goal-verdict, .pp-chartwrap, .pp-stress, .pp-deadline { box-shadow: none !important; break-inside: avoid; page-break-inside: avoid; }
  .pp-section { padding: 8px 0; }
  .pp-sec-h, h1, h2, h3, h4 { page-break-after: avoid; }
  svg { max-width: 100%; }
  /* The projection hero is white-on-dark on screen; in print force ALL its text
     (incl. inline color:#fff) dark, drop the decorative glow, and outline the cards. */
  .pp-dash-head, .pp-invest-banner { background: #fff !important; color: #1E1128 !important; border: 1px solid #ccc; }
  .pp-dash-head::before { display: none !important; }
  .pp-dash-head *, .pp-invest-banner * { color: #1E1128 !important; }
  /* The hero number uses a background-clip:text gradient on screen — force it back to solid dark text for print. */
  .pp-dash-head .big { background: none !important; -webkit-text-fill-color: #1E1128 !important; text-shadow: none !important; }
  .pp-dash-head .pp-scnc { background: #F5F2FB !important; border-color: #D8D0E8 !important; }
  .pp-printonly { display: block !important; }
  a[href]:after { content: ""; }
}
@page { margin: 14mm; }
.pp-printonly { display: none; }

/* ── This-year contribution card ─────────────────────────────────────────── */
.pp-thisyear {
  background: var(--paper-card);
  border: 1.5px solid var(--violet-mid);
  border-radius: 18px;
  padding: 18px 22px;
  margin-top: 16px;
  box-shadow: var(--shadow-sm);
}
.pp-thisyear-eyebrow {
  font-size: 11px; font-weight: 700; letter-spacing: .07em;
  text-transform: uppercase; color: var(--violet); margin-bottom: 14px;
}
.pp-thisyear-flow {
  display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
}
.pp-thisyear-pill {
  background: var(--paper); border: 1.5px solid var(--border);
  border-radius: 12px; padding: 10px 18px; text-align: center;
  min-width: 120px; flex-shrink: 0;
}
.pp-thisyear-pill-future {
  background: var(--violet-soft); border-color: var(--violet-mid);
}
.pp-thisyear-amt {
  font-family: var(--display); font-size: 22px; font-weight: 700; color: var(--plum);
  line-height: 1.1;
}
.pp-thisyear-pill-future .pp-thisyear-amt { color: var(--violet); }
.pp-thisyear-lbl {
  font-size: 11.5px; color: var(--muted); margin-top: 3px; line-height: 1.3;
}
.pp-thisyear-arrow {
  display: flex; flex-direction: column; align-items: center; gap: 5px;
  color: var(--muted); font-size: 11px; flex: 1; min-width: 70px;
}
.pp-thisyear-note {
  margin-top: 13px; font-size: 13px; color: var(--ink); line-height: 1.55;
  border-top: 1px solid var(--border); padding-top: 11px;
}

/* ── Brand logo image ─────────────────────────────────────────────────────── */
.pp-brand-logo {
  width: 42px; height: 42px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
  box-shadow: 0 1px 6px rgba(0,0,0,.18);
}
.pp-auth-modal-logo {
  width: 72px; height: 72px;
  border-radius: 14px;
  object-fit: cover;
  box-shadow: 0 4px 18px rgba(0,0,0,.35);
  margin-bottom: 2px;
}

/* ── Auth modal ────────────────────────────────────────────────────────────── */
.pp-auth-backdrop {
  position: fixed; inset: 0;
  background: rgba(18,9,30,.72);
  backdrop-filter: blur(8px) saturate(1.1);
  -webkit-backdrop-filter: blur(8px) saturate(1.1);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: ppFadeIn .18s ease;
}
@keyframes ppFadeIn { from { opacity: 0; } to { opacity: 1; } }

.pp-auth-modal {
  background: var(--paper-card);
  border-radius: 22px;
  box-shadow: 0 24px 72px rgba(18,9,30,.45), 0 4px 18px rgba(18,9,30,.2);
  width: 100%;
  max-width: 416px;
  position: relative;
  overflow: hidden;
  animation: ppSlideUp .22s cubic-bezier(.34,1.2,.64,1);
}
@keyframes ppSlideUp { from { opacity: 0; transform: translateY(18px) scale(.97); } to { opacity: 1; transform: none; } }

.pp-auth-x {
  position: absolute; top: 14px; right: 14px;
  background: rgba(255,255,255,.15); border: none; cursor: pointer;
  color: rgba(255,255,255,.7); border-radius: 8px;
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  transition: background .15s, color .15s; z-index: 5;
}
.pp-auth-x:hover { background: rgba(255,255,255,.25); color: #fff; }

.pp-auth-head {
  background: var(--noise), linear-gradient(138deg,#1E0C40 0%,#2C1458 40%,#3D2080 75%,#4E2D9E 100%);
  padding: 26px 28px 22px;
  text-align: center; color: #fff;
}
.pp-auth-logo-name {
  font-family: var(--display); font-size: 19px;
  color: #fff; margin-top: 8px; letter-spacing: -.3px;
}
.pp-auth-tagline {
  font-size: 12.5px; color: rgba(220,205,240,.8); margin-top: 3px;
}

.pp-auth-tabs {
  display: flex; border-bottom: 1.5px solid var(--border);
}
.pp-auth-tabs button {
  flex: 1; padding: 13px 16px;
  background: none; border: none; cursor: pointer;
  font-family: var(--sans); font-size: 14px; font-weight: 500;
  color: var(--muted); border-bottom: 2.5px solid transparent;
  margin-bottom: -1.5px; transition: all .15s;
}
.pp-auth-tabs button.on {
  color: var(--plum); border-bottom-color: var(--violet); font-weight: 700;
}

.pp-auth-form {
  padding: 22px 24px;
  display: flex; flex-direction: column; gap: 13px;
}
.pp-auth-field {
  display: flex; flex-direction: column; gap: 5px;
}
.pp-auth-field label {
  font-size: 12.5px; font-weight: 600; color: var(--ink);
}
.pp-auth-wrap {
  position: relative; display: flex; align-items: center;
}
.pp-auth-ic {
  position: absolute; left: 11px; color: var(--muted); pointer-events: none; flex-shrink: 0;
}
.pp-auth-wrap input {
  width: 100%; padding: 10px 11px 10px 34px;
  border: 1.5px solid var(--border); border-radius: 10px;
  font-family: var(--sans); font-size: 14px;
  background: #fff; color: var(--ink);
  outline: none; transition: border-color .15s;
}
.pp-auth-wrap input:focus { border-color: var(--violet); box-shadow: 0 0 0 3px rgba(112,68,190,.1); }
.pp-auth-eye {
  position: absolute; right: 9px;
  background: none; border: none; cursor: pointer; color: var(--muted);
  padding: 5px; display: flex; align-items: center; border-radius: 6px;
}
.pp-auth-eye:hover { color: var(--ink); }

.pp-auth-newsletter-check {
  display: flex; gap: 10px; align-items: flex-start; cursor: pointer;
  background: var(--violet-soft); border: 1.5px solid var(--violet-mid);
  border-radius: 10px; padding: 11px 13px;
  font-size: 13px; line-height: 1.5; color: var(--ink);
}
.pp-auth-newsletter-check input[type="checkbox"] {
  margin-top: 2px; width: 15px; height: 15px;
  accent-color: var(--violet); flex-shrink: 0; cursor: pointer;
}

.pp-auth-error {
  background: #FEF2F2; border: 1px solid #FECACA;
  color: #991B1B; border-radius: 8px; padding: 9px 12px; font-size: 13px;
}
.pp-auth-fullbtn { width: 100%; }

.pp-auth-divider {
  display: flex; align-items: center; gap: 10px;
  color: var(--muted); font-size: 12px;
}
.pp-auth-divider::before, .pp-auth-divider::after {
  content: ""; flex: 1; height: 1px; background: var(--border);
}

.pp-auth-google-btn {
  display: flex; align-items: center; justify-content: center; gap: 9px;
  width: 100%; padding: 10px 16px;
  background: #fff; border: 1.5px solid var(--border); border-radius: 10px;
  font-family: var(--sans); font-size: 14px; font-weight: 600; color: var(--ink);
  cursor: pointer; transition: border-color .15s, box-shadow .15s;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
}
.pp-auth-google-btn:hover { border-color: #bbb; box-shadow: 0 2px 10px rgba(0,0,0,.1); }

.pp-auth-swap {
  text-align: center; font-size: 13px; color: var(--muted); margin: 0;
}
.pp-auth-swap button {
  background: none; border: none; cursor: pointer;
  color: var(--violet); font-weight: 600; padding: 0; font-family: var(--sans); font-size: 13px;
}
.pp-auth-swap button:hover { text-decoration: underline; }

/* Forgot-password link (right-aligned under the password field) */
.pp-auth-forgot { text-align: right; margin-top: -4px; }
.pp-auth-forgot button {
  background: none; border: none; cursor: pointer; padding: 0;
  color: var(--violet); font-weight: 600; font-family: var(--sans); font-size: 12.5px;
}
.pp-auth-forgot button:hover { text-decoration: underline; }
.pp-auth-hint { font-size: 13px; color: var(--muted); margin: 0; line-height: 1.5; }

.pp-auth-success {
  padding: 30px 24px; text-align: center;
  font-size: 14px; line-height: 1.6; color: var(--ink);
}
.pp-auth-success-icon { font-size: 36px; margin-bottom: 10px; }

/* ── Nav auth elements ────────────────────────────────────────────────────── */
.pp-auth-signin-btn {
  display: flex; align-items: center;
  padding: 6px 15px; border-radius: 20px;
  font-family: var(--sans); font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all .15s;
  background: rgba(112,68,190,.1); color: var(--violet);
  border: 1.5px solid rgba(112,68,190,.3);
}
.pp-auth-signin-btn:hover { background: rgba(112,68,190,.18); border-color: var(--violet); }

.pp-auth-user {
  display: flex; align-items: center; gap: 8px;
}
.pp-auth-avatar {
  width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg,var(--violet),#4E2D9E);
  color: #fff; font-size: 13px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.pp-auth-email {
  font-size: 13px; color: var(--plum); font-weight: 500;
  max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.pp-auth-signout-btn {
  font-size: 12px; color: var(--muted); background: none; border: none;
  cursor: pointer; padding: 0; text-decoration: underline; font-family: var(--sans);
}
.pp-auth-signout-btn:hover { color: var(--ink); }
.pp-auth-delete-confirm {
  font-size: 12px; color: #fff; background: #B73737; border: none;
  cursor: pointer; padding: 4px 10px; border-radius: 6px; font-family: var(--sans); font-weight: 700;
}
.pp-auth-delete-confirm:hover { background: #9d2e2e; }
.pp-auth-delete-confirm:disabled { opacity: .6; cursor: default; }

/* ── Newsletter prompt banner ─────────────────────────────────────────────── */
.pp-newsletter-banner {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  background: var(--paper-card); border: 1.5px solid var(--violet-mid);
  border-radius: 14px; padding: 12px 16px; margin-bottom: 4px;
  box-shadow: var(--shadow-sm);
}

/* ── Optimal strategy callout (Dashboard) ───────────────────────────────── */
.pp-opt-callout {
  display: flex; gap: 14px; align-items: flex-start;
  background: #EAF5EA; border: 1.5px solid #A8D5A8;
  border-radius: 14px; padding: 16px 18px; margin-top: 16px;
}
.pp-opt-callout-icon {
  color: #2E8B57; flex-shrink: 0; margin-top: 2px;
}
.pp-opt-callout-hd {
  font-size: 15px; font-weight: 700; color: #1A4D2A; margin-bottom: 5px;
}
.pp-opt-callout-hd span { color: #2E8B57; }
.pp-opt-callout-body { font-size: 13.5px; color: #2A5C35; line-height: 1.6; }

/* ── Accounts to open (Action plan) ────────────────────────────────────── */
.pp-opt-open {
  margin-top: 20px; background: var(--paper-card);
  border: 1.5px solid var(--violet-mid); border-radius: 14px; padding: 16px 18px;
}
.pp-opt-open-hd {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 800; text-transform: uppercase;
  letter-spacing: .09em; color: var(--plum-2); margin-bottom: 12px;
}
.pp-opt-open-list { display: flex; flex-direction: column; gap: 10px; }
.pp-opt-open-row {
  border-left: 3px solid var(--violet); padding: 10px 14px;
  background: var(--paper); border-radius: 0 10px 10px 0;
}
.pp-opt-open-name { font-size: 13px; font-weight: 800; margin-bottom: 2px; }
.pp-opt-open-benefit { font-size: 13.5px; font-weight: 600; color: var(--ink); }
.pp-opt-open-why { font-size: 12px; color: var(--muted); margin-top: 2px; }
.pp-opt-open-note {
  font-size: 12px; color: var(--muted); margin-top: 12px; margin-bottom: 0;
}

/* ── Account selector (Planner section 4) ────────────────────────────────── */
.pp-acct-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 10px;
  margin-top: 12px;
  margin-bottom: 4px;
}
.pp-acct-card {
  position: relative;
  background: var(--paper-card);
  border: 1.5px solid var(--line);
  border-radius: 14px;
  padding: 14px 13px 12px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
}
.pp-acct-card:hover {
  border-color: var(--violet-mid);
  box-shadow: var(--shadow-sm);
}
.pp-acct-card.on {
  box-shadow: var(--shadow-sm);
}
.pp-acct-card-icon {
  margin-bottom: 8px;
  transition: color 0.18s;
}
.pp-acct-card-name {
  font-family: var(--display);
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
  margin-bottom: 2px;
  line-height: 1.1;
}
.pp-acct-card-full {
  font-size: 10.5px;
  color: var(--muted);
  font-weight: 500;
  margin-bottom: 6px;
  line-height: 1.35;
  letter-spacing: 0.01em;
}
.pp-acct-card-blurb {
  font-size: 11.5px;
  color: var(--muted);
  line-height: 1.45;
}

.pp-acct-detail {
  border-left: 3px solid var(--violet);
  padding: 14px 18px 16px;
  background: var(--paper-card);
  border-radius: 0 12px 12px 0;
  margin-top: 14px;
  box-shadow: var(--shadow-sm);
}
.pp-acct-detail-hd {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 14px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}
.pp-acct-detail-tag {
  font-family: var(--display);
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
  background: var(--panel);
  padding: 2px 7px;
  border-radius: 20px;
  margin-left: 2px;
}
@media (max-width: 600px) {
  .pp-acct-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .pp-acct-card { padding: 12px 10px 10px; }
  .pp-acct-card-name { font-size: 13px; }
  .pp-acct-card-blurb { display: none; }
  .pp-acct-detail { padding: 12px 14px 14px; }
}

/* ─── Budget tab ─────────────────────────────────────────────────────────── */
.pp-bud-head { margin-bottom: 4px; }
.pp-btn-gold {
  background: linear-gradient(135deg, #C99A42 0%, #B8972E 100%);
  color: #2A1A05; border: none; font-weight: 800;
}
.pp-btn-gold:hover { filter: brightness(1.05); }
.pp-bud-alert { display: flex; align-items: center; gap: 8px; font-size: 13px; border-radius: 10px; padding: 10px 14px; margin: 0 0 16px; }
.pp-bud-alert.err { background: #FFF0F0; border: 1px solid #E7B5B5; color: #9A3030; }

/* Planner sync banner (informational) */
.pp-bud-sync {
  display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap;
  background: linear-gradient(135deg, #2D6A4F 0%, #245741 100%); color: #EAF7F0;
  border-radius: 14px; padding: 13px 16px; margin: 0 0 16px;
}
.pp-bud-sync-main { display: flex; align-items: flex-start; gap: 11px; }
.pp-bud-sync-tick { flex: none; margin-top: 2px; color: #BFF0D6; }
.pp-bud-sync-main b { color: #fff; }
.pp-bud-sync-vals { display: flex; flex-wrap: wrap; gap: 7px 16px; margin-top: 7px; font-size: 13px; }
.pp-bud-sync-vals span { white-space: nowrap; }
.pp-bud-sync-vals i { color: #A8D8BF; font-style: normal; font-weight: 700; margin-right: 5px; text-transform: uppercase; font-size: 10.5px; letter-spacing: .04em; }
.pp-bud-sync-x { background: none; border: none; color: #CDEBDB; cursor: pointer; padding: 4px; border-radius: 6px; display: flex; flex: none; }
.pp-bud-sync-x:hover { background: rgba(255,255,255,.18); color: #fff; }

/* Toolbar — fields on the left, Refresh + Export on the right */
.pp-bud-toolbar { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin: 6px 0 18px; }
.pp-bud-toolbar-fields { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-end; }
.pp-bud-toolbar-fields .pp-select { min-width: 190px; }
.pp-bud-toolbar-actions { display: flex; gap: 10px; align-items: center; }
.pp-bud-refresh.done { color: #2D6A4F; border-color: #9AD6B6; background: #EAF7F0; }
.pp-bud-yearpick { display: flex; align-items: center; gap: 8px; }
.pp-bud-yearpick .pp-select { min-width: 150px; }
.pp-bud-addyear {
  display: inline-flex; align-items: center; gap: 5px; flex: none; cursor: pointer; font-family: inherit;
  background: #fff; border: 1px solid var(--violet-mid); color: var(--plum); font-weight: 700;
  font-size: 12.5px; padding: 9px 12px; border-radius: 10px; white-space: nowrap;
}
.pp-bud-addyear:hover { background: var(--violet-soft); border-color: var(--plum); }
.pp-bud-yearnote {
  display: flex; align-items: flex-start; gap: 9px; font-size: 13px; line-height: 1.5;
  background: var(--violet-soft); border: 1px solid var(--violet-mid); color: var(--plum-2);
  border-radius: 12px; padding: 11px 15px; margin: 0 0 18px;
}
.pp-bud-yearnote b { color: var(--plum); }
.pp-bud-push-note { font-size: 12.5px; font-weight: 700; color: var(--muted); font-style: italic; }

/* Stage-swap confirm */
.pp-bud-confirm {
  display: flex; align-items: flex-start; gap: 11px;
  background: var(--violet-soft); border: 1px solid var(--violet-mid); color: var(--plum-2);
  border-radius: 12px; padding: 13px 16px; font-size: 13.5px; margin: 0 0 18px;
}
.pp-bud-confirm-body { display: flex; flex-direction: column; gap: 10px; }
.pp-bud-confirm-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.pp-bud-confirm .pp-btn { padding: 7px 14px; font-size: 13px; }
.pp-bud-confirm-cancel { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 13px; font-weight: 700; padding: 7px 6px; font-family: inherit; }
.pp-bud-confirm-cancel:hover { color: var(--plum); }
.pp-bud-confirm-hint { font-size: 12px; color: var(--muted); line-height: 1.5; }

/* Summary bar */
.pp-bud-summary {
  display: flex; flex-wrap: wrap; gap: 10px 26px; align-items: center;
  background: var(--paper-card); border: 1px solid var(--line); border-radius: 14px;
  padding: 15px 20px; margin: 0 0 18px;
}
.pp-bud-stat { display: flex; flex-direction: column; gap: 1px; }
.pp-bud-stat span { font-size: 11.5px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
.pp-bud-stat b { font-size: 19px; color: var(--plum); font-variant-numeric: tabular-nums; }
.pp-bud-stat-sub { font-style: normal; font-size: 11.5px; font-weight: 700; color: var(--gold); margin-top: 1px; }
.pp-bud-stat.net b { color: #2D6A4F; }
.pp-bud-stat.net.neg b { color: #B33; }
.pp-bud-push { margin-left: auto; }
.pp-bud-push-done { display: inline-flex; align-items: center; gap: 7px; color: #2D6A4F; font-weight: 800; font-size: 14px; }
.pp-bud-push-confirm { display: inline-flex; align-items: center; gap: 9px; flex-wrap: wrap; font-size: 13px; color: var(--muted); }
.pp-bud-push-confirm .pp-btn { padding: 7px 14px; font-size: 13px; }

/* ── Grid ─────────────────────────────────────────────────────────────── */
.pp-bud-scroll { overflow-x: auto; border: 1px solid var(--line); border-radius: 14px; background: #fff; }
.pp-bud-table { border-collapse: separate; border-spacing: 0; width: 100%; min-width: 1080px; font-size: 13px; }
.pp-bud-table th, .pp-bud-table td { border-bottom: 1px solid #ECEAF2; }

/* Header */
.pp-bud-table thead th {
  background: #2E1452; color: #EDE6F7; font-weight: 700; font-size: 11px; letter-spacing: .04em;
  text-transform: uppercase; text-align: right; padding: 11px 10px; position: sticky; top: 0; z-index: 2;
}
.pp-bud-table thead th.pp-bud-cat { text-align: left; color: #C9B6EE; }
.pp-bud-table thead th.pp-bud-annual-h { color: #E7C969; }

/* Category column — a distinct label panel, clearly set apart from the data grid */
.pp-bud-cat {
  text-align: left; min-width: 196px; position: sticky; left: 0; z-index: 1;
  background: #F6F4FA; border-right: 2px solid #DDD5EC;
}
.pp-bud-table thead th.pp-bud-cat { z-index: 3; }
.pp-bud-num, .pp-bud-numcell { text-align: right; min-width: 78px; font-variant-numeric: tabular-nums; }
.pp-bud-num { padding: 8px 10px; color: var(--ink); }
.pp-bud-annual { font-weight: 800; color: var(--plum); background: #F3EFFA; }

/* Section header rows — the main colour cue between sections */
.pp-bud-sechead td { font-weight: 800; font-size: 12px; letter-spacing: .05em; text-transform: uppercase; padding: 8px 14px; color: #fff; }
.pp-bud-sechead.inc td { background: #3A2168; }
.pp-bud-sechead.exp td { background: #7A2E3E; }
.pp-bud-sechead.inv td { background: #1F5A3F; }
.pp-bud-sechead td.pp-bud-cat { border-right-color: transparent; }

/* Data rows — neutral cells so labels and numbers read cleanly; section shown by a left accent on the label column */
.pp-bud-row td { background: #fff; }
.pp-bud-row:nth-of-type(even) td { background: #FBFAFE; }
.pp-bud-row .pp-bud-cat { background: #F6F4FA; border-left: 4px solid transparent; }
.pp-bud-row:nth-of-type(even) .pp-bud-cat { background: #F1EEF8; }
.pp-bud-row.inc .pp-bud-cat { border-left-color: #6A48B0; }
.pp-bud-row.exp .pp-bud-cat { border-left-color: #B05468; }
.pp-bud-row.inv .pp-bud-cat { border-left-color: #2E8B63; }
.pp-bud-row:hover td { background: #F8F4FD; }
.pp-bud-row:hover .pp-bud-cat { background: #EBE5F6; }

.pp-bud-labelwrap { display: flex; align-items: center; gap: 4px; padding: 3px 8px 3px 11px; }
.pp-bud-label {
  flex: 1; min-width: 0; border: 1px solid transparent; background: transparent; border-radius: 6px;
  font-size: 13px; font-weight: 700; color: var(--ink); padding: 5px 6px; font-family: inherit;
}
.pp-bud-label:hover { border-color: #D8D0E8; background: #fff; }
.pp-bud-label:focus { outline: none; border-color: var(--plum); background: #fff; }
.pp-bud-tip { color: var(--muted); display: inline-flex; cursor: help; flex: none; }
.pp-bud-rmrow {
  flex: none; opacity: 0; border: none; background: none; color: var(--muted); cursor: pointer;
  padding: 3px; border-radius: 6px; display: inline-flex; transition: opacity .12s;
}
.pp-bud-row:hover .pp-bud-rmrow { opacity: 1; }
.pp-bud-rmrow:hover { background: #FFE3E3; color: #B33; }

.pp-bud-numcell { padding: 0; border-right: 1px solid #F1EFF6; }
.pp-bud-cellwrap { position: relative; display: flex; }
.pp-bud-cell {
  width: 100%; border: 1.5px solid transparent; background: transparent; text-align: right;
  font-size: 13px; padding: 8px 10px; color: var(--ink); font-family: inherit; font-variant-numeric: tabular-nums;
}
.pp-bud-cell::placeholder { color: #CFC8DE; }
.pp-bud-cell:focus { outline: none; border-color: #B8972E; background: #fff; border-radius: 6px; box-shadow: 0 0 0 2px rgba(184,151,46,.18); }
/* Fill-across handle — appears when you focus a filled cell; copies it rightward */
.pp-bud-fill {
  position: absolute; right: 3px; top: 50%; transform: translateY(-50%);
  width: 19px; height: 19px; padding: 0; display: inline-flex; align-items: center; justify-content: center;
  border: none; border-radius: 5px; cursor: pointer; background: #B8972E; color: #fff;
  opacity: 0; pointer-events: none; transition: opacity .12s ease;
}
.pp-bud-fill:hover { background: #9C7F24; }
.pp-bud-cellwrap:focus-within .pp-bud-fill { opacity: 1; pointer-events: auto; }
.pp-bud-cellwrap:focus-within .pp-bud-cell { padding-right: 26px; }

/* Section total rows — bold, light, with a clear top rule */
.pp-bud-total td { background: #EEE9F7; color: var(--plum); padding: 9px 10px; font-weight: 800; border-top: 2px solid #C9B6EE; }
.pp-bud-total .pp-bud-cat { background: #EEE9F7; border-left: 4px solid transparent; }
.pp-bud-total .pp-bud-annual { color: var(--plum); background: #E6DDF5; }
.pp-bud-addrow {
  display: inline-flex; align-items: center; gap: 5px; background: #fff;
  border: 1px solid #C9B6EE; color: var(--plum); cursor: pointer;
  padding: 5px 11px; border-radius: 8px; font-size: 12px; font-weight: 700; font-family: inherit;
}
.pp-bud-addrow:hover { background: var(--plum); color: #fff; border-color: var(--plum); }

/* Net cash flow — one clear summary band */
.pp-bud-ncf td { background: #2D6A4F; color: #fff; font-weight: 800; font-size: 13.5px; padding: 12px 10px; border-bottom: none; border-top: 2px solid #1F5A3F; }
.pp-bud-ncf .pp-bud-cat { background: #2D6A4F; border-left: 4px solid transparent; border-right-color: rgba(255,255,255,.2); }
.pp-bud-ncf.neg td { background: #9E3D44; border-top-color: #7E2E34; }
.pp-bud-ncf.neg .pp-bud-cat { background: #9E3D44; }
.pp-bud-ncf .pp-bud-annual { color: #fff; }

/* Life-stage guide */
.pp-bud-guidewrap { margin-top: 22px; }
.pp-bud-guidetoggle {
  display: inline-flex; align-items: center; gap: 7px; background: var(--violet-soft);
  border: 1px solid var(--violet-mid); color: var(--plum-2); cursor: pointer;
  padding: 9px 16px; border-radius: 10px; font-size: 13px; font-weight: 700; font-family: inherit;
}
.pp-bud-guidetoggle:hover { background: var(--violet-mid); }
.pp-bud-guide { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 14px; }
.pp-bud-guidecard { border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; background: var(--paper-card); }
.pp-bud-guidecard.on { border-color: var(--plum); box-shadow: 0 0 0 2px rgba(112,68,190,.16); }
.pp-bud-guidecard h4 { font-size: 14px; color: var(--plum); margin: 0 0 10px; }
.pp-bud-guidecard > div { margin-bottom: 9px; }
.pp-bud-guidecard i { font-style: normal; font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; color: var(--gold); }
.pp-bud-guidecard ul { margin: 3px 0 0; padding-left: 16px; }
.pp-bud-guidecard li { font-size: 12.5px; color: var(--muted); line-height: 1.5; }

@media (max-width: 700px) {
  .pp-bud-summary { gap: 10px 18px; }
  .pp-bud-stat b { font-size: 17px; }
  .pp-bud-push { margin-left: 0; width: 100%; }
  .pp-bud-toolbar { align-items: stretch; }
  .pp-bud-toolbar-actions { width: 100%; }
  .pp-bud-toolbar-actions .pp-btn { flex: 1; justify-content: center; }
}
`;

export default STYLES;
