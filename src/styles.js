// Global CSS string — injected once by App.jsx via <style>{STYLES}</style>
// pp-topnav  = sticky top navigation bar
// pp-secnav  = dashboard section-jump nav (renamed from pp-nav to avoid cascade collision)
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400&family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap');

.pp * { box-sizing: border-box; }
.pp {
  --paper: #F6F0E6; --paper-card: #FCF8F1; --panel: #F0E7D7;
  --ink: #221330; --plum: #34185A; --plum-2: #4A2580; --violet: #7C4DC4;
  --violet-soft: #ECE2F7; --gold: #B0822B; --gold-2: #CDA052; --muted: #6E5E78;
  --line: rgba(34,19,48,0.14); --line-soft: rgba(34,19,48,0.08);
  --green: #5B8C5A; --teal:#3F7E78; --rose:#A8456A; --blue:#3E6BB0;
  --display: 'Fraunces', Georgia, serif; --sans: 'Hanken Grotesk', system-ui, sans-serif;
  font-family: var(--sans); color: var(--ink); background: var(--paper);
  line-height: 1.55; min-height: 100vh; -webkit-font-smoothing: antialiased;
}
.pp button { font-family: var(--sans); cursor: pointer; }
.pp h1,.pp h2,.pp h3,.pp h4 { font-family: var(--display); font-weight: 600; line-height: 1.08; letter-spacing: -0.01em; margin: 0; }
.pp p { margin: 0; }

.pp-wrap { max-width: 1060px; margin: 0 auto; padding: 0 22px; }
.pp-section { padding: 60px 0; }
.pp-eyebrow { font-size: 11.5px; letter-spacing: 0.18em; text-transform: uppercase; font-weight: 700; color: var(--gold); display: inline-flex; align-items: center; gap: 8px; }

/* ── Top navigation bar ──────────────────────────────────────────────────── */
.pp-topnav { position: sticky; top: 0; z-index: 40; background: rgba(246,240,230,0.86); backdrop-filter: blur(10px); border-bottom: 1px solid var(--line); }
.pp-topnav-in { display: flex; align-items: center; justify-content: space-between; height: 64px; gap: 16px; }
.pp-brand { display: flex; align-items: center; gap: 11px; cursor: pointer; background: none; border: 0; padding: 0; }
.pp-mark { flex: none; }
.pp-brand-name { font-family: var(--display); font-weight: 600; font-size: 19px; }
.pp-brand-name b { color: var(--violet); font-weight: 600; }
.pp-navlinks { display: flex; align-items: center; gap: 4px; }
.pp-navlink { background: none; border: 0; font-size: 14.5px; font-weight: 600; color: var(--muted); padding: 8px 12px; border-radius: 8px; }
.pp-navlink:hover { color: var(--ink); background: var(--violet-soft); }
.pp-navlink.active { color: var(--plum); }
.pp-navlink[aria-current="page"] { color: var(--plum); }

.pp-btn { display: inline-flex; align-items: center; gap: 9px; border-radius: 999px; font-weight: 700; font-size: 15px; padding: 13px 22px; border: 1px solid transparent; transition: transform .12s, box-shadow .12s, background .15s; }
.pp-btn:active { transform: translateY(1px); }
.pp-btn:focus-visible, .pp-navlink:focus-visible, .pp-segc:focus-visible, .pp-back:focus-visible, .pp-box:focus-visible, .pp-toggle button:focus-visible, .pp-select:focus-visible { outline: 2.5px solid var(--violet); outline-offset: 2px; }
.pp-btn-primary { background: var(--plum); color: var(--paper); box-shadow: 0 8px 22px rgba(52,24,90,0.22); }
.pp-btn-primary:hover { background: var(--plum-2); }
.pp-btn-ghost { background: transparent; color: var(--plum); border-color: var(--line); }
.pp-btn-ghost:hover { background: var(--paper-card); border-color: var(--violet); }
.pp-btn-sm { padding: 9px 15px; font-size: 13.5px; }
.pp-btn[disabled]{ cursor: not-allowed; }

.pp-hero { position: relative; overflow: hidden; border-bottom: 1px solid var(--line); }
.pp-hero-grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 40px; align-items: center; padding: 62px 0 70px; }
.pp-hero h1 { font-size: 54px; letter-spacing: -0.02em; }
.pp-hero h1 em { font-style: italic; color: var(--violet); }
.pp-hero-sub { font-size: 18px; color: var(--muted); margin-top: 22px; max-width: 31em; }
.pp-hero-cta { display: flex; gap: 12px; margin-top: 30px; flex-wrap: wrap; }
.pp-hero-fine { margin-top: 22px; font-size: 13px; color: var(--muted); display: flex; align-items: center; gap: 8px; }
.pp-orb { position: relative; aspect-ratio: 1; }
.pp-hero-deco { position: absolute; right: -120px; top: -80px; width: 520px; height: 520px; opacity: 0.5; pointer-events: none; }

.pp-card { background: var(--paper-card); border: 1px solid var(--line); border-radius: 18px; padding: 24px; }
.pp-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.pp-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }

.pp-feat-ic { width: 42px; height: 42px; border-radius: 11px; background: var(--violet-soft); color: var(--plum-2); display: grid; place-items: center; flex: none; }
.pp-band { background: var(--plum); color: #EFE6F7; }
.pp-band .pp-eyebrow { color: var(--gold-2); }

.pp-box { text-align: left; background: var(--paper-card); border: 1px solid var(--line); border-radius: 16px; padding: 22px; transition: transform .14s, box-shadow .14s, border-color .14s; display: flex; flex-direction: column; gap: 10px; width: 100%; }
.pp-box:hover { transform: translateY(-3px); box-shadow: 0 14px 30px rgba(52,24,90,0.12); border-color: var(--violet); }
.pp-box-ic { width: 46px; height: 46px; border-radius: 12px; background: var(--plum); color: var(--gold-2); display: grid; place-items: center; }
.pp-box h3 { font-size: 19px; }
.pp-box p { font-size: 14px; color: var(--muted); }
.pp-box-foot { margin-top: auto; font-size: 13px; font-weight: 700; color: var(--violet); display: inline-flex; align-items: center; gap: 6px; }
.pp-box-count { font-size: 12px; color: var(--muted); font-weight: 600; }

/* planner */
.pp-planner { max-width: 760px; margin: 0 auto; padding: 40px 0 80px; }
.pp-fs { background: var(--paper-card); border: 1px solid var(--line); border-radius: 18px; padding: 26px; margin-bottom: 18px; }
.pp-fs-head { display: flex; gap: 12px; align-items: center; }
.pp-fs-num { width: 30px; height: 30px; border-radius: 999px; background: var(--plum); color: var(--gold-2); display: grid; place-items: center; font-family: var(--display); font-weight: 600; font-size: 15px; flex: none; }
.pp-fs h3 { font-size: 21px; }
.pp-fs-sub { color: var(--muted); font-size: 14px; margin: 2px 0 22px 42px; }
.pp-field { margin-bottom: 18px; }
.pp-field:last-child { margin-bottom: 0; }
.pp-label2 { display: block; font-weight: 700; font-size: 14.5px; margin-bottom: 7px; }
.pp-help { font-size: 12.5px; color: var(--muted); margin-top: 7px; }
.pp-help b { color: var(--plum-2); }
.pp-input-wrap { display: flex; align-items: center; background: #fff; border: 1.5px solid var(--line); border-radius: 11px; overflow: hidden; transition: border-color .12s; }
.pp-input-wrap:focus-within { border-color: var(--violet); }
.pp-adorn { padding: 0 4px 0 14px; color: var(--muted); font-weight: 700; }
.pp-adorn.r { padding: 0 14px 0 4px; }
.pp-input { border: 0; outline: 0; padding: 13px 14px; font-size: 16px; font-family: var(--sans); font-weight: 600; color: var(--ink); width: 100%; background: transparent; }
.pp-input::-webkit-outer-spin-button,.pp-input::-webkit-inner-spin-button{ -webkit-appearance:none; margin:0; }
.pp-select { width: 100%; background: #fff; border: 1.5px solid var(--line); border-radius: 11px; padding: 13px 14px; font-size: 16px; font-family: var(--sans); font-weight: 600; color: var(--ink); appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236E5E78' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; }
.pp-select:focus { outline: 0; border-color: var(--violet); }
.pp-grid-money { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
.pp-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.pp-seg { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
.pp-segc { text-align: left; background: #fff; border: 1.5px solid var(--line); border-radius: 13px; padding: 14px; transition: all .12s; }
.pp-segc:hover { border-color: var(--violet); }
.pp-segc.on { border-color: var(--plum); background: var(--violet-soft); }
.pp-segc .nm { font-weight: 700; font-size: 15.5px; display: flex; justify-content: space-between; align-items: center; }
.pp-segc .rt { font-size: 12px; color: var(--gold); font-weight: 700; }
.pp-segc .ds { font-size: 12.5px; color: var(--muted); margin-top: 5px; }
.pp-toggle { display: flex; gap: 10px; }
.pp-toggle button { flex: 1; background: #fff; border: 1.5px solid var(--line); border-radius: 11px; padding: 12px; font-weight: 700; font-size: 14.5px; color: var(--muted); }
.pp-toggle button.on { border-color: var(--plum); background: var(--violet-soft); color: var(--plum); }

/* validation */
.pp-error { font-size: 12.5px; color: var(--rose); margin-top: 5px; font-weight: 600; }
.pp-input-wrap.err { border-color: var(--rose); }
.pp-warn-rate { display:flex; gap:8px; align-items:flex-start; background:#FBE9E9; border:1px solid #E7B9B9; border-radius:10px; padding:10px 12px; font-size:12.5px; color:#8A3030; margin-top:6px; }

/* local-storage save banner */
.pp-savebanner { display:flex; gap:10px; align-items:center; background:var(--violet-soft); border:1px solid var(--line); border-radius:12px; padding:12px 16px; font-size:13.5px; margin-bottom:18px; flex-wrap:wrap; }
.pp-savebanner b { color:var(--plum); }

/* expandable advanced section */
.pp-acc { border: 1px dashed var(--line); border-radius: 14px; background: rgba(255,255,255,0.4); margin-top: 4px; }
.pp-acc-head { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 10px; background: none; border: 0; padding: 16px 18px; text-align: left; }
.pp-acc-head h4 { font-size: 16.5px; } .pp-acc-head .sub { font-size: 12.5px; color: var(--muted); margin-top: 2px; }
.pp-acc-body { padding: 0 18px 18px; }
.pp-chev { transition: transform .2s; color: var(--muted); flex: none; }
.pp-chev.open { transform: rotate(180deg); }

/* dashboard */
.pp-dash-head { background: var(--plum); color: #fff; border-radius: 22px; padding: 32px; }
.pp-dash-head .pp-eyebrow { color: var(--gold-2); }
.pp-dash-head .big { font-family: var(--display); font-size: 46px; font-weight: 600; margin: 8px 0 2px; }
.pp-dash-head .cap { color: #DAC9EE; font-size: 15px; }
.pp-legend { display: flex; gap: 18px; flex-wrap: wrap; margin-top: 8px; }
.pp-legend span { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 600; color: var(--muted); }
.pp-legend i { width: 16px; height: 3px; border-radius: 2px; display: inline-block; }
.pp-scn { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; margin-top: 16px; }
.pp-scnc { border-radius: 14px; padding: 15px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.14); }
.pp-scnc .lab { font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #C7B4DF; }
.pp-scnc .val { font-family: var(--display); font-size: 23px; font-weight: 600; margin-top: 4px; color: #fff; }
.pp-stat { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--line-soft); font-size: 15px; }
.pp-stat:last-child { border-bottom: 0; }
.pp-stat b { font-family: var(--display); font-weight: 600; font-size: 17px; }
.pp-pill { display: inline-flex; align-items: center; gap: 7px; background: var(--violet-soft); color: var(--plum-2); border-radius: 999px; padding: 6px 13px; font-size: 13px; font-weight: 700; }
.pp-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 11px; }
.pp-list li { display: flex; gap: 11px; align-items: flex-start; font-size: 14.5px; }
.pp-list .ic { flex: none; margin-top: 1px; }
.pp-good { color: #4E7A4C; } .pp-warn { color: #9A6010; }
.pp-acct .num { font-family: var(--display); font-size: 22px; font-weight: 600; color: var(--plum); }
.pp-tag { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gold); }
.pp-bal { font-size: 13px; color: var(--muted); }
.pp-bal b { color: var(--ink); }

/* section heading helper */
.pp-sec-h { font-size: 26px; margin: 10px 0 6px; }
.pp-sec-lead { color: var(--muted); font-size: 15px; max-width: 46em; margin-bottom: 18px; }

/* paycheque breakdown */
.pp-pay-grid { display: grid; grid-template-columns: 1.15fr 1fr; gap: 22px; align-items: start; }
.pp-waterfall { width: 100%; }
.pp-bar-row { display: flex; align-items: center; gap: 12px; margin-bottom: 9px; }
.pp-bar-lab { width: 132px; font-size: 13px; font-weight: 600; flex: none; color: var(--ink); }
.pp-bar-track { flex: 1; height: 26px; background: var(--panel); border-radius: 7px; overflow: hidden; position: relative; }
.pp-bar-fill { height: 100%; border-radius: 7px; transition: width .5s ease; }
.pp-bar-val { width: 92px; text-align: right; font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums; flex: none; }
.pp-taxtable { width: 100%; border-collapse: collapse; font-size: 14px; }
.pp-taxtable td { padding: 9px 0; border-bottom: 1px solid var(--line-soft); }
.pp-taxtable td:last-child { text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }
.pp-taxtable tr.tot td { border-top: 2px solid var(--line); border-bottom: 0; padding-top: 12px; font-size: 15.5px; }
.pp-taxtable tr.tot td b { font-family: var(--display); }
.pp-swatch { display: inline-block; width: 11px; height: 11px; border-radius: 3px; margin-right: 8px; vertical-align: middle; }
.pp-rates { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 14px; }
.pp-rate-chip { background: var(--violet-soft); border-radius: 12px; padding: 12px 16px; flex: 1; min-width: 130px; }
.pp-rate-chip .l { font-size: 11.5px; text-transform: uppercase; letter-spacing: .06em; font-weight: 700; color: var(--plum-2); }
.pp-rate-chip .v { font-family: var(--display); font-size: 24px; font-weight: 600; color: var(--plum); margin-top: 2px; }
.pp-rate-chip .h { font-size: 11.5px; color: var(--muted); margin-top: 2px; }

/* room tracking */
.pp-room { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
.pp-roomc { background: var(--paper-card); border: 1px solid var(--line); border-radius: 16px; padding: 20px; display:flex; flex-direction:column; gap: 8px; }
.pp-roomc h4 { font-size: 19px; display: flex; justify-content: space-between; align-items:center; }
.pp-room-bar { height: 12px; background: var(--panel); border-radius: 999px; overflow: hidden; display: flex; }
.pp-room-bar i { height: 100%; display:block; }
.pp-room-legend { font-size: 12px; color: var(--muted); display:flex; justify-content: space-between; }
.pp-room-big { font-family: var(--display); font-size: 26px; font-weight: 600; color: var(--plum); }
.pp-room-sub { font-size: 12.5px; color: var(--muted); }
.pp-overwarn { display:flex; gap: 8px; align-items:flex-start; background:#FBE9E9; border:1px solid #E7B9B9; border-radius:10px; padding:10px 12px; font-size:12.5px; color:#8A3030; margin-top:4px; }

/* deadline */
.pp-deadline { display:flex; gap: 18px; align-items:center; background: linear-gradient(120deg, var(--violet-soft), #F3ECDB); border:1px solid var(--line); border-radius:16px; padding: 20px 22px; }
.pp-deadline .ring { flex:none; }
.pp-deadline .big { font-family: var(--display); font-size: 30px; font-weight: 600; color: var(--plum); }

/* sliders */
.pp-sliders { display:grid; grid-template-columns: 1fr 1fr; gap: 18px 26px; }
.pp-slider .top { display:flex; justify-content: space-between; align-items:baseline; margin-bottom: 6px; }
.pp-slider .top .l { font-weight: 700; font-size: 14px; }
.pp-slider .top .v { font-family: var(--display); font-weight: 600; color: var(--plum); font-size: 16px; }
.pp-range { -webkit-appearance:none; appearance:none; width:100%; height:6px; border-radius:999px; background: var(--panel); outline:none; }
.pp-range::-webkit-slider-thumb { -webkit-appearance:none; width:20px; height:20px; border-radius:50%; background: var(--plum); border:3px solid var(--paper-card); box-shadow:0 1px 4px rgba(52,24,90,.4); cursor:pointer; }
.pp-range::-moz-range-thumb { width:20px; height:20px; border-radius:50%; background: var(--plum); border:3px solid var(--paper-card); cursor:pointer; }
.pp-range:focus-visible { outline: 2px solid var(--violet); outline-offset: 2px; }
.pp-toggles { display:flex; gap:10px; flex-wrap:wrap; margin-top:6px; }
.pp-tog { display:inline-flex; gap:8px; align-items:center; background:#fff; border:1.5px solid var(--line); border-radius:999px; padding:8px 14px; font-size:13px; font-weight:700; color:var(--muted); }
.pp-tog.on { border-color: var(--plum); background: var(--violet-soft); color: var(--plum); }

/* per-month contribution grid */
.pp-months { display:grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 4px 0 18px; }
.pp-month label { display:block; font-size:11px; font-weight:700; color:var(--muted); margin-bottom:4px; text-transform:uppercase; letter-spacing:.05em; }
.pp-month .pp-input { padding:9px 10px; font-size:14px; }
.pp-month .pp-adorn { padding:0 2px 0 10px; }
.pp-month-total { grid-column: 1 / -1; font-size:13.5px; color:var(--muted); text-align:right; }
.pp-month-total b { color:var(--plum); font-family:var(--display); }
.pp-month.past .pp-input { background:#EFEAE0; color:var(--muted); }
.pp-month.past label { opacity:.6; }

/* account groups in the room step */
.pp-acctgroup { border:1px solid var(--line); border-radius:14px; padding:16px 16px 4px; margin-bottom:14px; background:var(--paper-card); }
.pp-acctgroup > h4 { display:flex; align-items:center; gap:7px; font-size:15px; font-family:var(--display); color:var(--plum); margin-bottom:12px; }
.pp-acctgroup.need { border-color:#C98A2E; box-shadow:0 0 0 2px rgba(201,138,46,.15); }
.pp-req { font-family:var(--sans); font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:#9A6010; background:#F3E4C8; padding:2px 8px; border-radius:999px; margin-left:auto; }

/* emergency-fund sub-card */
.pp-subcard { border:1px dashed var(--line); border-radius:14px; padding:16px; margin:4px 0 8px; background:rgba(124,77,196,.05); }
.pp-sub-h { font-family:var(--display); font-size:16px; color:var(--plum); margin-bottom:12px; }
.pp-seg2 { display:flex; gap:8px; flex-wrap:wrap; }
.pp-seg2 button { flex:1; min-width:90px; background:#fff; border:1.5px solid var(--line); border-radius:10px; padding:9px 10px; font-size:13px; font-weight:700; color:var(--muted); cursor:pointer; }
.pp-seg2 button.on { border-color:var(--violet); background:var(--violet-soft); color:var(--plum); }
input[type="date"].pp-input { font-family:var(--sans); color:var(--ink); }
.pp-inlinelink { background:none; border:0; padding:0; color:var(--violet); font-weight:700; font-size:inherit; cursor:pointer; font-family:inherit; }
.pp-inlinelink:hover { color:var(--plum); text-decoration:underline; }

/* dashboard snapshot */
.pp-snap { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin:16px 0 8px; }
.pp-snapc { background:var(--paper-card); border:1px solid var(--line); border-radius:14px; padding:13px 15px; }
.pp-snapc .l { font-size:11px; text-transform:uppercase; letter-spacing:.05em; font-weight:700; color:var(--plum-2); }
.pp-snapc .v { font-family:var(--display); font-size:21px; font-weight:600; color:var(--plum); margin-top:3px; }
.pp-snapc .h { font-size:11.5px; color:var(--muted); margin-top:1px; }
@media (max-width:760px){ .pp-snap { grid-template-columns:repeat(2,1fr); } }

/* ── Dashboard section-jump nav (renamed from pp-nav to avoid cascade collision) */
.pp-secnav { display:flex; gap:8px; flex-wrap:wrap; margin:6px 0 4px; }
.pp-secnav a, .pp-secnav button { font-size:12.5px; font-weight:700; color:var(--plum-2); background:var(--violet-soft); border:1px solid var(--line); border-radius:999px; padding:6px 12px; text-decoration:none; cursor:pointer; font-family:inherit; }
.pp-secnav a:hover, .pp-secnav button:hover { background:#fff; color:var(--plum); }

/* goal selector */
.pp-goalgrid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; margin:6px 0 14px; }
.pp-goalc { text-align:left; background:#fff; border:1.5px solid var(--line); border-radius:14px; padding:14px; cursor:pointer; color:var(--plum); position:relative; }
.pp-goalcheck { position:absolute; top:10px; right:10px; width:20px; height:20px; border-radius:6px; background:var(--violet); color:#fff; display:flex; align-items:center; justify-content:center; }
.pp-goalc svg { color:var(--violet); margin-bottom:6px; }
.pp-goalc .nm { font-family:var(--display); font-size:16px; font-weight:600; }
.pp-goalc .ds { font-size:12.5px; color:var(--muted); margin-top:2px; }
.pp-goalc.on { border-color:var(--violet); background:var(--violet-soft); box-shadow:0 0 0 2px rgba(124,77,196,.15); }

/* action plan */
.pp-plan { display:flex; flex-direction:column; gap:10px; }
.pp-step { display:flex; gap:14px; align-items:flex-start; padding:14px 16px; border:1px solid var(--line); border-radius:14px; background:var(--paper-card); }
.pp-step.now { border-color:var(--violet); background:var(--violet-soft); box-shadow:0 0 0 2px rgba(124,77,196,.15); }
.pp-step.done { opacity:.62; }
.pp-step-ic { width:30px; height:30px; border-radius:9px; flex:none; display:flex; align-items:center; justify-content:center; background:#fff; border:1px solid var(--line); font-weight:800; color:var(--plum); font-family:var(--display); }
.pp-step.now .pp-step-ic { background:var(--violet); color:#fff; border-color:var(--violet); }
.pp-step-b { flex:1; }
.pp-step-b h4 { font-size:15.5px; color:var(--plum); display:flex; gap:8px; align-items:baseline; flex-wrap:wrap; }
.pp-step-b .amt { font-family:var(--display); color:var(--violet); font-weight:700; }
.pp-step-b p { font-size:12.5px; color:var(--muted); margin-top:3px; }
.pp-step-tag { font-size:10.5px; font-weight:800; text-transform:uppercase; letter-spacing:.05em; color:#fff; background:var(--violet); padding:3px 8px; border-radius:999px; }
.pp-step-tag.ok { background:var(--green); }
.pp-pbar { height:6px; border-radius:999px; background:var(--panel); overflow:hidden; margin-top:8px; }
.pp-pbar > i { display:block; height:100%; background:var(--violet); }

/* strategy comparison */
.pp-strats { display:grid; grid-template-columns:repeat(2,1fr); gap:14px; }
.pp-strat { border:1px solid var(--line); border-radius:16px; padding:18px; background:var(--paper-card); display:flex; flex-direction:column; }
.pp-strat.rec { border-color:var(--violet); box-shadow:0 0 0 2px rgba(124,77,196,.18); background:#fff; }
.pp-strat .badge { align-self:flex-start; font-size:10.5px; font-weight:800; text-transform:uppercase; letter-spacing:.05em; color:#fff; background:var(--violet); padding:3px 9px; border-radius:999px; margin-bottom:8px; }
.pp-strat h4 { font-family:var(--display); font-size:19px; color:var(--plum); }
.pp-strat .ord { font-size:12.5px; color:var(--muted); margin:6px 0 12px; }
.pp-strat .metric { background:var(--violet-soft); border-radius:10px; padding:10px 12px; margin-bottom:10px; }
.pp-strat .metric .l { font-size:11px; text-transform:uppercase; letter-spacing:.05em; font-weight:700; color:var(--plum-2); }
.pp-strat .metric .v { font-family:var(--display); font-size:22px; font-weight:600; color:var(--plum); }
.pp-strat .why { font-size:12.5px; color:var(--ink); margin-bottom:6px; }
.pp-strat ul { list-style:none; display:flex; flex-direction:column; gap:5px; margin:2px 0 10px; }
.pp-strat ul li { font-size:12.5px; color:var(--muted); display:flex; gap:7px; align-items:flex-start; }
.pp-strat .trade { font-size:12px; color:#9A6010; background:#F6EFDD; border-radius:8px; padding:8px 10px; margin-top:auto; }

/* scorecard */
.pp-score { display:grid; grid-template-columns: 150px 1fr; gap:22px; align-items:center; }
.pp-score-ring { text-align:center; }
.pp-score-ring .num { font-family:var(--display); font-size:40px; font-weight:600; }
.pp-score-ring .out { font-size:12px; color:var(--muted); }
.pp-score-bars { display:flex; flex-direction:column; gap:11px; }
.pp-scrow .top { display:flex; justify-content:space-between; font-size:13px; font-weight:600; color:var(--plum); }
.pp-scrow .top b { font-family:var(--display); }
.pp-scrow .bar { height:7px; border-radius:999px; background:var(--panel); overflow:hidden; margin-top:4px; }
.pp-scrow .bar > i { display:block; height:100%; border-radius:999px; }
.pp-scrow .tip { font-size:11.5px; color:var(--muted); margin-top:3px; }

/* opportunity cost table */
.pp-opp { width:100%; border-collapse:collapse; margin-top:4px; }
.pp-opp th, .pp-opp td { text-align:right; padding:10px 12px; font-size:13.5px; border-bottom:1px solid var(--line); }
.pp-opp th:first-child, .pp-opp td:first-child { text-align:left; font-weight:700; color:var(--plum); }
.pp-opp thead th { font-size:11px; text-transform:uppercase; letter-spacing:.04em; color:var(--plum-2); }
.pp-opp .good { color:var(--green); font-weight:700; }
.pp-opp .bad { color:#9A6010; }

@media (max-width:760px){ .pp-goalgrid, .pp-strats { grid-template-columns:1fr; } .pp-score { grid-template-columns:1fr; gap:14px; } .pp-opp th, .pp-opp td { padding:8px 7px; font-size:12px; } }

/* slider with typed input */
.pp-slider .top .vwrap { display:inline-flex; align-items:center; gap:6px; }
.pp-slider .top .vin { width:74px; background:#fff; border:1.5px solid var(--line); border-radius:8px; padding:4px 8px; font-family:var(--display); font-weight:600; color:var(--plum); font-size:15px; text-align:right; }
.pp-slider .top .vin:focus { outline:0; border-color:var(--violet); }
.pp-slider .top .vu { font-size:13px; color:var(--muted); font-weight:700; }

/* bracket navigator */
.pp-brackets { display:grid; grid-template-columns: repeat(3,1fr); gap:14px; }
.pp-brk { border:1px solid var(--line); border-radius:14px; padding:16px; background:var(--paper-card); }
.pp-brk .l { font-size:11.5px; text-transform:uppercase; letter-spacing:.06em; font-weight:700; color:var(--plum-2); }
.pp-brk .v { font-family:var(--display); font-size:22px; font-weight:600; color:var(--plum); margin:4px 0; }
.pp-brk .h { font-size:12.5px; color:var(--muted); }
.pp-brk.up { background:#F3ECDB; } .pp-brk.down { background:var(--violet-soft); }

/* chart hover tooltip */
.pp-chartwrap { position:relative; }
.pp-chartlegend { display:flex; align-items:center; gap:7px; font-size:12px; font-weight:700; color:var(--plum-2); margin-bottom:8px; }
.pp-chartlegend .dot { width:14px; height:3px; border-radius:2px; display:inline-block; }
.pp-chartfocus { outline:none; }
.pp-chartfocus:focus-visible { outline: 2px solid var(--violet); outline-offset: 3px; border-radius:8px; }
.pp-cmp { width:100%; border-collapse:collapse; margin-top:6px; }
.pp-cmp th, .pp-cmp td { padding:11px 12px; font-size:13px; text-align:right; border-bottom:1px solid var(--line); white-space:nowrap; }
.pp-cmp th:first-child, .pp-cmp td:first-child { text-align:left; white-space:normal; }
.pp-cmp thead th { font-size:11px; text-transform:uppercase; letter-spacing:.04em; color:var(--plum-2); font-weight:700; }
.pp-cmp tbody tr.rec { background:var(--violet-soft); }
.pp-cmp .stratname { font-weight:700; color:var(--plum); font-family:var(--display); }
.pp-cmp .recbadge { display:inline-block; font-size:9.5px; font-weight:800; text-transform:uppercase; letter-spacing:.04em; color:#fff; background:var(--violet); padding:2px 6px; border-radius:999px; margin-left:6px; vertical-align:middle; }
.pp-cmp .ord { font-size:11.5px; color:var(--muted); font-weight:400; }
.pp-cmp .best { color:var(--green); font-weight:800; }
/* tooltip: smart positioning via inline style; base styles here */
.pp-tip { position:absolute; pointer-events:none; background:var(--ink); color:#fff; border-radius:10px; padding:9px 12px; font-size:12.5px; white-space:nowrap; box-shadow:0 6px 18px rgba(0,0,0,.25); z-index:5; }
.pp-tip .ty { font-weight:700; margin-bottom:3px; color:var(--gold-2); }
.pp-tip .tr { display:flex; gap:8px; align-items:center; }
.pp-tip .tr i { width:9px;height:9px;border-radius:2px; display:inline-block; }
.pp-tip .tsub { margin-top:4px; font-size:11px; opacity:.75; }
.pp-chartkey { font-size:12px; color:var(--muted); margin-top:6px; }

/* order of operations */
.pp-ladder { display:flex; flex-direction:column; gap:0; }
.pp-rung { display:flex; gap:14px; align-items:flex-start; padding:14px 0; border-bottom:1px solid var(--line-soft); }
.pp-rung:last-child { border-bottom:0; }
.pp-rung-n { width:30px;height:30px;border-radius:999px;flex:none;display:grid;place-items:center;font-family:var(--display);font-weight:600;font-size:15px; background: var(--violet-soft); color: var(--plum-2); }
.pp-rung.flag .pp-rung-n { background: var(--gold); color:#fff; }
.pp-rung-b h4 { font-size:16px; } .pp-rung-b p { font-size:13.5px; color:var(--muted); margin-top:2px; }
.pp-rung-tip { font-size:12.5px; color:var(--gold); font-weight:700; margin-top:5px; display:inline-flex; gap:6px; align-items:center; }

/* topic */
.pp-topic { max-width: 760px; margin: 0 auto; }
.pp-topic h1 { font-size: 40px; margin: 14px 0 8px; }
.pp-topic-lead { font-size: 18px; color: var(--muted); margin-bottom: 30px; }
.pp-prose p { font-size: 16px; margin-bottom: 16px; color: #34233F; }
.pp-facts { background: var(--paper-card); border: 1px solid var(--line); border-radius: 16px; padding: 22px; margin: 24px 0; }
.pp-facts h4 { font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; font-family: var(--sans); font-weight: 800; color: var(--plum); margin-bottom: 14px; }
.pp-facts dl { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 10px 18px; }
.pp-facts dt { font-weight: 700; font-size: 14px; } .pp-facts dd { margin: 0; font-size: 14px; color: var(--muted); }
.pp-callout { display: flex; gap: 12px; background: var(--violet-soft); border-radius: 14px; padding: 16px 18px; font-size: 14px; color: var(--plum-2); margin: 22px 0; }

.pp-back { background: none; border: 0; color: var(--muted); font-weight: 700; font-size: 14px; display: inline-flex; align-items: center; gap: 6px; padding: 6px 0; }
.pp-back:hover { color: var(--plum); }
.pp-disclaimer { display: flex; gap: 13px; background: #FBF3E2; border: 1px solid #E7D2A6; border-radius: 14px; padding: 16px 18px; font-size: 13.5px; color: #6B5320; }
.pp-disclaimer.tax { background:#EEF1FA; border-color:#C7D2EC; color:#3C4A6B; }

.pp-footer { background: var(--ink); color: #C9B8D6; padding: 46px 0 40px; }
.pp-footer .pp-brand-name { color: #fff; } .pp-footer .pp-brand-name b { color: var(--gold-2); }
.pp-footer-cols { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 30px; margin: 26px 0; }
.pp-footer h5 { font-family: var(--sans); font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: #8E7AA0; margin: 0 0 12px; }
.pp-footer button, .pp-footer a { display: block; background: none; border: 0; color: #C9B8D6; font-size: 14px; padding: 5px 0; text-align: left; text-decoration: none; }
.pp-footer button:hover, .pp-footer a:hover { color: #fff; }
.pp-footer-fine { font-size: 12px; color: #7C6A8C; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; }

/* invest-this-year banner + custom savings goals */
.pp-invest-banner { background:linear-gradient(135deg, var(--plum), var(--violet)); color:#fff; border-radius:16px; padding:18px 20px; margin:4px 0 16px; }
.pp-invest-banner .l { font-size:12.5px; color:#E7D9F7; font-weight:600; }
.pp-invest-banner .v { font-family:var(--display); font-size:32px; font-weight:600; margin:2px 0; line-height:1.05; }
.pp-invest-banner .v .u { font-size:14px; font-weight:500; color:#DAC9EE; }
.pp-invest-banner .h { font-size:13px; color:#DAC9EE; }
.pp-savedit { display:flex; gap:8px; align-items:center; margin-bottom:8px; flex-wrap:wrap; }
.pp-savedit .pp-input { min-width:0; }
.pp-savedit > .pp-input:first-child { flex:1 1 180px; }
.pp-savedit-rm { flex:none; width:34px; height:34px; border-radius:9px; border:1px solid var(--line); background:#fff; color:var(--rose); cursor:pointer; font-size:14px; }
.pp-savegoal { padding:12px 0; border-top:1px solid var(--line); }
.pp-savegoal:first-child { border-top:none; padding-top:4px; }
.pp-savegoal .nm { font-weight:700; color:var(--plum); font-family:var(--display); font-size:16px; }

@media (max-width: 860px) {
  .pp-hero-grid { grid-template-columns: 1fr; gap: 10px; padding: 42px 0 52px; }
  .pp-orb { display: none; } .pp-hero h1 { font-size: 34px; }
  .pp-grid-3, .pp-grid-2, .pp-grid-money, .pp-seg, .pp-row2, .pp-scn, .pp-pay-grid, .pp-room, .pp-sliders, .pp-brackets { grid-template-columns: 1fr; }
  .pp-months { grid-template-columns: repeat(3, 1fr); }
  .pp-navlink { padding: 8px 8px; font-size: 13.5px; } .pp-brand-name { font-size: 17px; }
  .pp-section { padding: 44px 0; } .pp-footer-cols { grid-template-columns: 1fr; gap: 22px; }
  .pp-dash-head { padding: 22px; } .pp-dash-head .big { font-size: 36px; } .pp-fs-sub { margin-left: 0; }
  .pp-bar-lab { width: 104px; } .pp-bar-val { width: 80px; }
}
@media (max-width: 560px) {
  .pp-wrap { padding: 0 14px; }
  .pp-hero h1 { font-size: 28px; line-height: 1.12; }
  .pp-sec-h { font-size: 21px; }
  .pp-dash-head { padding: 18px; border-radius: 16px; } .pp-dash-head .big { font-size: 30px; }
  .pp-card { padding: 16px; border-radius: 14px; }
  .pp-snap { grid-template-columns: 1fr; }
  .pp-goalgrid { grid-template-columns: 1fr; }
  .pp-opp, .pp-cmp { display: block; overflow-x: auto; white-space: nowrap; -webkit-overflow-scrolling: touch; }
  .pp-opp thead, .pp-cmp thead, .pp-opp tbody, .pp-cmp tbody, .pp-opp tr, .pp-cmp tr { display: table; width: 100%; table-layout: fixed; }
  .pp-opp th, .pp-opp td, .pp-cmp th, .pp-cmp td { padding: 8px 6px; font-size: 11.5px; white-space: normal; }
  .pp-invest-banner .v { font-size: 26px; }
  .pp-savedit { gap: 6px; } .pp-savedit > .pp-input:first-child { flex: 1 1 100%; }
  .pp-btn { width: 100%; justify-content: center; }
  .pp-secnav button { font-size: 12px; padding: 5px 10px; }
  .pp-rate-chip .v { font-size: 18px; }
}
@media (max-width: 520px) { .pp-navlink.hide-sm { display: none; } }

@media print {
  .pp-topnav, .pp-footer, .pp-noprint, .pp-back, .pp-orb { display: none !important; }
  .pp { background:#fff !important; }
  .pp-wrap { max-width: 100%; padding: 0; }
  .pp-card, .pp-roomc, .pp-fs, .pp-invest-banner { box-shadow:none !important; break-inside: avoid; page-break-inside: avoid; }
  .pp-section { padding: 8px 0; }
  .pp-dash-head, .pp-invest-banner { background:#fff !important; color:#000 !important; border:1px solid #ccc; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .pp-dash-head .big, .pp-dash-head .cap, .pp-dash-head .pp-eyebrow, .pp-invest-banner .l, .pp-invest-banner .v, .pp-invest-banner .h, .pp-invest-banner .v .u { color:#000 !important; }
  .pp-printonly { display:block !important; }
  a[href]:after { content: ""; }
}
.pp-printonly { display:none; }
`;

export default STYLES;
