import React, { useState, useMemo } from "react";
import {
  ArrowRight, ArrowLeft, Check, ChevronRight, ChevronDown, Shield, TrendingUp,
  BookOpen, PiggyBank, Building2, Coins, Scale, Sparkles, AlertTriangle,
  Wallet, LineChart, Landmark, GraduationCap, Percent, Home as HomeIcon,
  Receipt, Calculator, CalendarClock, ListOrdered, Printer, MapPin, Info,
} from "lucide-react";

/* ============================================================
   PURPLE PORTFOLIO — V3 · "The Tax-Aware Upgrade"
   A Canadian investment-EDUCATION planner. Educational only —
   not financial, investment, or tax advice.
   Everything runs in the browser; nothing is stored or sent.

   ⚠️ ALL FIGURES BELOW ARE FOR THE 2026 TAX YEAR.
   They are centralized in TAX_CONFIG and must be re-verified
   annually (canada.ca / revenuquebec.ca). Sources noted inline.

   ── MAINTAINER NOTES ───────────────────────────────────────
   • Single-file artifact (renders in-app). For a real product,
     split TAX_CONFIG + the pure engine (taxEngine, marginalRate,
     bracketInfo, project*, contributions, *Room, oasClawback)
     into their own module and unit-test them independently.
   • The engine functions are PURE (no React/DOM) precisely so
     they can be tested in isolation.
   • runSelfTest() below contains known-good 2026 assertions.
     After any annual config update, set DEV=true once, open the
     console, and confirm "[self-test] PASS". Keep DEV=false in
     production so it never runs for users.
   • Modeling simplifications are labelled in the UI where they
     appear (after-tax view, retirement-rate estimate, constant
     returns / uncertainty band). Don't remove those captions.
   ============================================================ */
const DEV = false; // flip to true locally to run runSelfTest()

/* ------------------------------------------------------------------
   1 · TAX CONFIG — verified for 2026 (see SOURCE notes).
   Update this object once a year; the rest of the app is data-driven.
   ------------------------------------------------------------------ */
const TAX_YEAR = 2026;
const INF = Infinity;

const TAX_CONFIG = {
  year: 2026,
  // SOURCE: CRA / KPMG "Federal and Provincial/Territorial Income Tax Rates 2026"
  federal: {
    brackets: [
      { to: 58523, rate: 0.14 },
      { to: 117045, rate: 0.205 },
      { to: 181440, rate: 0.26 },
      { to: 258482, rate: 0.29 },
      { to: INF, rate: 0.33 },
    ],
    bpaBase: 14829, bpaMax: 16452,          // SOURCE: CRA — BPA $16,452 (base $14,829)
    bpaPhaseStart: 181440, bpaPhaseEnd: 258482,
    lowRate: 0.14, cea: 1501, qcAbatement: 0.165, // Quebec federal abatement 16.5%
  },
  // SOURCE: KPMG 2026 brackets + Narcity/CRA 2026 BPAs by province
  prov: {
    AB: { name: "Alberta", brackets: [{to:61200,rate:.08},{to:154259,rate:.10},{to:185111,rate:.12},{to:246813,rate:.13},{to:370220,rate:.14},{to:INF,rate:.15}], bpa: 22769, low: .08 },
    BC: { name: "British Columbia", brackets: [{to:50363,rate:.0506},{to:100728,rate:.077},{to:115648,rate:.105},{to:140430,rate:.1229},{to:190405,rate:.147},{to:265545,rate:.168},{to:INF,rate:.205}], bpa: 13216, low: .0506 },
    MB: { name: "Manitoba", brackets: [{to:47000,rate:.108},{to:100000,rate:.1275},{to:INF,rate:.174}], bpa: 15780, low: .108 },
    NB: { name: "New Brunswick", brackets: [{to:52333,rate:.094},{to:104666,rate:.14},{to:193861,rate:.16},{to:INF,rate:.195}], bpa: 13664, low: .094 },
    NL: { name: "Newfoundland & Labrador", brackets: [{to:44678,rate:.087},{to:89354,rate:.145},{to:159528,rate:.158},{to:223340,rate:.178},{to:285319,rate:.198},{to:570638,rate:.208},{to:1141275,rate:.213},{to:INF,rate:.218}], bpa: 11188, low: .087 },
    NS: { name: "Nova Scotia", brackets: [{to:30995,rate:.0879},{to:61991,rate:.1495},{to:97417,rate:.1667},{to:157124,rate:.175},{to:INF,rate:.21}], bpa: 11932, low: .0879 },
    NT: { name: "Northwest Territories", brackets: [{to:53003,rate:.059},{to:106009,rate:.086},{to:172346,rate:.122},{to:INF,rate:.1405}], bpa: 18198, low: .059 },
    NU: { name: "Nunavut", brackets: [{to:55801,rate:.04},{to:111602,rate:.07},{to:181439,rate:.09},{to:INF,rate:.115}], bpa: 19659, low: .04 },
    ON: { name: "Ontario", brackets: [{to:53891,rate:.0505},{to:107785,rate:.0915},{to:150000,rate:.1116},{to:220000,rate:.1216},{to:INF,rate:.1316}], bpa: 12989, low: .0505, surtax: [{over:5818,rate:.20},{over:7446,rate:.36}], healthPremium: true },
    PE: { name: "Prince Edward Island", brackets: [{to:33928,rate:.095},{to:65820,rate:.1347},{to:106890,rate:.166},{to:142250,rate:.1762},{to:INF,rate:.19}], bpa: 15000, low: .095 },
    QC: { name: "Quebec", brackets: [{to:54345,rate:.14},{to:108680,rate:.19},{to:132245,rate:.24},{to:INF,rate:.2575}], bpa: 18952, low: .14, isQC: true },
    SK: { name: "Saskatchewan", brackets: [{to:54532,rate:.105},{to:155805,rate:.125},{to:INF,rate:.145}], bpa: 20381, low: .105 },
    YT: { name: "Yukon", brackets: [{to:58523,rate:.064},{to:117045,rate:.09},{to:181440,rate:.109},{to:500000,rate:.128},{to:INF,rate:.15}], bpa: 16452, low: .064 },
  },
  // SOURCE: CRA — CPP 2026 (YMPE $74,600, YAMPE $85,000, rate 5.95%, CPP2 4%)
  cpp: { ympe: 74600, exemption: 3500, yampe: 85000, baseRate: .0595, creditRate: .0495, enhRate: .0100, cpp2Rate: .04, maxBase: 4230.45, maxCpp2: 416 },
  // SOURCE: Revenu Québec — QPP 2026 (base 6.3%, max $4,479.30, QPP2 4%)
  qpp: { ympe: 74600, exemption: 3500, yampe: 85000, baseRate: .063, creditRate: .054, enhRate: .009, cpp2Rate: .04, maxBase: 4479.30, maxCpp2: 416 },
  // SOURCE: CEIC — EI 2026 (MIE $68,900, 1.63%; Quebec 1.30%)
  ei: { mie: 68900, rate: .0163, max: 1123.07, qcRate: .0130, qcMax: 895.70 },
  // SOURCE: Revenu Québec — QPIP 2026 (MIE $103,000, employee 0.430%)
  qpip: { mie: 103000, rate: .00430, max: 442.90, selfRate: .00764 },
  // SOURCE: CRA — registered plan limits 2026
  tfsa: { annual: 7000, cumulative2026: 109000,
    history: { 2009:5000,2010:5000,2011:5000,2012:5000,2013:5500,2014:5500,2015:10000,2016:5500,2017:5500,2018:5500,2019:6000,2020:6000,2021:6000,2022:6000,2023:6500,2024:7000,2025:7000,2026:7000 } },
  rrsp: { pct: 0.18, dollarMax: 33810, overBuffer: 2000 }, // 18% of 2025 earned income, max $33,810
  fhsa: { annual: 8000, lifetime: 40000, carryMax: 8000, maxYear: 16000, participationYears: 15, closeAge: 71 },
  capGainsInclusion: 0.50,   // SOURCE: 66.67% proposal CANCELLED Mar 2025 — flat 50% for individuals
  eligDividend: { grossUp: 0.38, fedDTC: 0.150198 },
  // SOURCE: OAS recovery tax ("clawback"), 2026 income year — threshold $95,323, 15% recovery, full clawback ~$155k (65–74). TFSA withdrawals are excluded from net income.
  oas: { thresholdMin: 95323, rate: 0.15, maxPension: 8988 },
};

/* ------------------------------------------------------------------
   2 · TAX ENGINE — pure, testable functions.
   taxEngine(gross, prov, employmentType, deductions) -> { ... }
   ------------------------------------------------------------------ */
function bracketTax(taxable, brackets) {
  if (taxable <= 0) return 0;
  let tax = 0, lower = 0;
  for (const b of brackets) {
    const cap = Math.min(taxable, b.to);
    if (cap > lower) { tax += (cap - lower) * b.rate; lower = cap; }
    if (taxable <= b.to) break;
  }
  return tax;
}
function fedBPA(net) {
  const f = TAX_CONFIG.federal;
  if (net <= f.bpaPhaseStart) return f.bpaMax;
  if (net >= f.bpaPhaseEnd) return f.bpaBase;
  const frac = (net - f.bpaPhaseStart) / (f.bpaPhaseEnd - f.bpaPhaseStart);
  return f.bpaMax - (f.bpaMax - f.bpaBase) * frac;
}
function contributions(gross, prov, selfEmployed) {
  const isQC = prov === "QC";
  const C = isQC ? TAX_CONFIG.qpp : TAX_CONFIG.cpp;
  const pen = Math.max(0, Math.min(gross, C.ympe) - C.exemption);
  let base = pen * C.baseRate;
  const cpp2Earn = Math.max(0, Math.min(gross, C.yampe) - C.ympe);
  let cpp2 = cpp2Earn * C.cpp2Rate;
  if (selfEmployed) { base *= 2; cpp2 *= 2; }
  let ei = 0;
  if (!selfEmployed) ei = Math.min(gross, TAX_CONFIG.ei.mie) * (isQC ? TAX_CONFIG.ei.qcRate : TAX_CONFIG.ei.rate);
  let qpip = 0;
  if (isQC) qpip = Math.min(gross, TAX_CONFIG.qpip.mie) * (selfEmployed ? TAX_CONFIG.qpip.selfRate : TAX_CONFIG.qpip.rate);
  return { isQC, pen, cppBase: base, cpp2, ei, qpip, cppTotal: base + cpp2, creditRate: C.creditRate, enhRate: C.enhRate };
}
function cppDeduction(con, selfEmployed) {
  const enhanced = con.pen * con.enhRate;
  if (!selfEmployed) return enhanced + con.cpp2;
  return con.cppTotal / 2 + enhanced + con.cpp2; // self-employed (simplified estimate)
}
function ontarioHealthPremium(t) {
  if (t <= 20000) return 0;
  if (t <= 36000) return Math.min(300, 0.06 * (t - 20000));
  if (t <= 48000) return Math.min(450, 300 + 0.06 * (t - 36000));
  if (t <= 72000) return Math.min(600, 450 + 0.25 * (t - 48000));
  if (t <= 200000) return Math.min(750, 600 + 0.25 * (t - 72000));
  return Math.min(900, 750 + 0.25 * (t - 200000));
}
function taxEngine(gross, prov, employmentType, deductions = 0) {
  const selfEmployed = employmentType === "self";
  const F = TAX_CONFIG.federal;
  const P = TAX_CONFIG.prov[prov] || TAX_CONFIG.prov.ON;
  const con = contributions(gross, prov, selfEmployed);
  const cppDed = cppDeduction(con, selfEmployed);
  const taxable = Math.max(0, gross - cppDed - deductions);

  let fed = bracketTax(taxable, F.brackets);
  const fedCredits =
    fedBPA(taxable) * F.lowRate +
    con.pen * con.creditRate * F.lowRate +
    con.ei * F.lowRate +
    (!selfEmployed ? F.cea * F.lowRate : 0);
  fed = Math.max(0, fed - fedCredits);
  if (con.isQC) fed = fed * (1 - F.qcAbatement);

  let prv = bracketTax(taxable, P.brackets);
  let provCredits = P.bpa * P.low + (con.pen * con.creditRate + con.ei + (con.isQC ? con.qpip : 0)) * P.low;
  prv = Math.max(0, prv - provCredits);
  if (P.surtax) { let s = 0; for (const x of P.surtax) if (prv > x.over) s += (prv - x.over) * x.rate; prv += s; }
  if (P.healthPremium) prv += ontarioHealthPremium(taxable);

  const totalTax = fed + prv;
  const stat = con.cppTotal + con.ei + con.qpip;
  const net = gross - stat - totalTax;
  return {
    gross, prov, taxable, cppDed,
    cppBase: con.cppBase, cpp2: con.cpp2, cppTotal: con.cppTotal, ei: con.ei, qpip: con.qpip,
    fedTax: fed, provTax: prv, totalTax, statutory: stat,
    net, netMonthly: net / 12,
    avgRate: gross > 0 ? totalTax / gross : 0,
    avgRateAll: gross > 0 ? (stat + totalTax) / gross : 0,
    isQC: con.isQC, selfEmployed,
  };
}
// marginal rate on ORDINARY income (matches published combined tables)
function marginalRate(gross, prov, employmentType, deductions = 0) {
  const a = taxEngine(gross, prov, employmentType, deductions).totalTax;
  const b = taxEngine(gross, prov, employmentType, deductions - 100).totalTax;
  return (b - a) / 100;
}
// fed+prov INCOME TAX on pension/RRIF income — no CPP/EI, no CPP deduction, no employment amount
function pensionTax(income, prov) {
  const F = TAX_CONFIG.federal;
  const P = TAX_CONFIG.prov[prov] || TAX_CONFIG.prov.ON;
  const taxable = Math.max(0, income);
  let fed = Math.max(0, bracketTax(taxable, F.brackets) - fedBPA(taxable) * F.lowRate);
  if (P.isQC) fed = fed * (1 - F.qcAbatement);
  let prv = Math.max(0, bracketTax(taxable, P.brackets) - P.bpa * P.low);
  if (P.surtax) { let s = 0; for (const x of P.surtax) if (prv > x.over) s += (prv - x.over) * x.rate; prv += s; }
  if (P.healthPremium) prv += ontarioHealthPremium(taxable);
  return fed + prv;
}
// retirement (pension) marginal rate — averaged over a ±$1,000 window so health-premium "notches" don't spike it
function retirementMarginal(income, prov) {
  if (income <= 0) return 0;
  return Math.max(0, (pensionTax(income + 1000, prov) - pensionTax(Math.max(0, income - 1000), prov)) / 2000);
}
// exact tax saved from a deduction (handles bracket crossing)
function deductionSaving(gross, prov, employmentType, contribution, existing = 0) {
  const before = taxEngine(gross, prov, employmentType, existing).totalTax;
  const after = taxEngine(gross, prov, employmentType, existing + contribution).totalTax;
  return Math.max(0, before - after);
}

/* ------------------------------------------------------------------
   3 · ACCOUNT RULES — contribution room + FHSA deadline tracking
   ------------------------------------------------------------------ */
function tfsaCumulativeRoom(birthYear) {
  // room accrues from the later of 2009 and the year you turn 18
  const h = TAX_CONFIG.tfsa.history;
  if (!birthYear) return TAX_CONFIG.tfsa.cumulative2026;
  const yr18 = birthYear + 18;
  let total = 0;
  for (let y = Math.max(2009, yr18); y <= TAX_YEAR; y++) total += h[y] || 0;
  return total;
}
function rrspEstimatedLimit(prevIncome) {
  return Math.min((prevIncome || 0) * TAX_CONFIG.rrsp.pct, TAX_CONFIG.rrsp.dollarMax);
}
function fhsaDeadline(yearOpened) {
  if (!yearOpened) return null;
  const closeByParticipation = yearOpened + TAX_CONFIG.fhsa.participationYears; // 15 yrs after opening
  const yearsLeft = closeByParticipation - TAX_YEAR;
  return { closeBy: closeByParticipation, yearsLeft };
}
// FHSA room ACCRUES at $8,000/yr from the year you open it (not all $40k at once).
// available = accrued − lifetime contributed; this year you can use $8k + up to $8k carry-forward (max $16k).
function fhsaRoomInfo(yearOpened, lifetimeUsed) {
  const F = TAX_CONFIG.fhsa;
  const used = Math.max(0, n(lifetimeUsed));
  if (!yearOpened) return { opened: false, accrued: 0, available: 0, thisYearRoom: F.annual, used };
  const yearsOpen = Math.max(1, TAX_YEAR - n(yearOpened) + 1);
  const accrued = Math.min(F.lifetime, yearsOpen * F.annual);
  const available = Math.max(0, accrued - used);
  const thisYearRoom = Math.min(F.maxYear, available);
  return { opened: true, yearsOpen, accrued, available, thisYearRoom, used };
}

/* ------------------------------------------------------------------
   4 · STYLES  (V2 design tokens preserved + V3 additions)
   ------------------------------------------------------------------ */
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

.pp-nav { position: sticky; top: 0; z-index: 40; background: rgba(246,240,230,0.86); backdrop-filter: blur(10px); border-bottom: 1px solid var(--line); }
.pp-nav-in { display: flex; align-items: center; justify-content: space-between; height: 64px; gap: 16px; }
.pp-brand { display: flex; align-items: center; gap: 11px; cursor: pointer; background: none; border: 0; padding: 0; }
.pp-mark { flex: none; }
.pp-brand-name { font-family: var(--display); font-weight: 600; font-size: 19px; }
.pp-brand-name b { color: var(--violet); font-weight: 600; }
.pp-navlinks { display: flex; align-items: center; gap: 4px; }
.pp-navlink { background: none; border: 0; font-size: 14.5px; font-weight: 600; color: var(--muted); padding: 8px 12px; border-radius: 8px; }
.pp-navlink:hover { color: var(--ink); background: var(--violet-soft); }
.pp-navlink.active { color: var(--plum); }

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
.pp-toggles { display:flex; gap:10px; flex-wrap:wrap; margin-top:6px; }
.pp-tog { display:inline-flex; gap:8px; align-items:center; background:#fff; border:1.5px solid var(--line); border-radius:999px; padding:8px 14px; font-size:13px; font-weight:700; color:var(--muted); }

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

/* emergency-fund sub-card + segmented control */
.pp-subcard { border:1px dashed var(--line); border-radius:14px; padding:16px; margin:4px 0 8px; background:rgba(124,77,196,.05); }
.pp-sub-h { font-family:var(--display); font-size:16px; color:var(--plum); margin-bottom:12px; }
.pp-seg2 { display:flex; gap:8px; flex-wrap:wrap; }
.pp-seg2 button { flex:1; min-width:90px; background:#fff; border:1.5px solid var(--line); border-radius:10px; padding:9px 10px; font-size:13px; font-weight:700; color:var(--muted); cursor:pointer; }
.pp-seg2 button.on { border-color:var(--violet); background:var(--violet-soft); color:var(--plum); }
input[type="date"].pp-input { font-family:var(--sans); color:var(--ink); }
.pp-inlinelink { background:none; border:0; padding:0; color:var(--violet); font-weight:700; font-size:inherit; cursor:pointer; font-family:inherit; }
.pp-inlinelink:hover { color:var(--plum); text-decoration:underline; }

/* dashboard snapshot + section nav */
.pp-snap { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin:16px 0 8px; }
.pp-snapc { background:var(--paper-card); border:1px solid var(--line); border-radius:14px; padding:13px 15px; }
.pp-snapc .l { font-size:11px; text-transform:uppercase; letter-spacing:.05em; font-weight:700; color:var(--plum-2); }
.pp-snapc .v { font-family:var(--display); font-size:21px; font-weight:600; color:var(--plum); margin-top:3px; }
.pp-snapc .h { font-size:11.5px; color:var(--muted); margin-top:1px; }
.pp-nav { display:flex; gap:8px; flex-wrap:wrap; margin:6px 0 4px; }
.pp-nav a, .pp-nav button { font-size:12.5px; font-weight:700; color:var(--plum-2); background:var(--violet-soft); border:1px solid var(--line); border-radius:999px; padding:6px 12px; text-decoration:none; cursor:pointer; font-family:inherit; }
.pp-nav a:hover, .pp-nav button:hover { background:#fff; color:var(--plum); }
@media (max-width:760px){ .pp-snap { grid-template-columns:repeat(2,1fr); } }

/* goal selector */
.pp-goalgrid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; margin:6px 0 14px; }
.pp-goalc { text-align:left; background:#fff; border:1.5px solid var(--line); border-radius:14px; padding:14px; cursor:pointer; color:var(--plum); position:relative; }
.pp-goalcheck { position:absolute; top:10px; right:10px; width:20px; height:20px; border-radius:6px; background:var(--violet); color:#fff; display:flex; align-items:center; justify-content:center; }
.pp-goalc svg { color:var(--violet); margin-bottom:6px; }
.pp-goalc .nm { font-family:var(--display); font-size:16px; font-weight:600; }
.pp-goalc .ds { font-size:12.5px; color:var(--muted); margin-top:2px; }
.pp-goalc.on { border-color:var(--violet); background:var(--violet-soft); box-shadow:0 0 0 2px rgba(124,77,196,.15); }

/* action plan — your next dollar */
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
.pp-strat.rec .metric { background:var(--violet-soft); }
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

/* slider with a typed input */
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
.pp-cmp { width:100%; border-collapse:collapse; margin-top:6px; }
.pp-cmp th, .pp-cmp td { padding:11px 12px; font-size:13px; text-align:right; border-bottom:1px solid var(--line); white-space:nowrap; }
.pp-cmp th:first-child, .pp-cmp td:first-child { text-align:left; white-space:normal; }
.pp-cmp thead th { font-size:11px; text-transform:uppercase; letter-spacing:.04em; color:var(--plum-2); font-weight:700; }
.pp-cmp tbody tr.rec { background:var(--violet-soft); }
.pp-cmp .stratname { font-weight:700; color:var(--plum); font-family:var(--display); }
.pp-cmp .recbadge { display:inline-block; font-size:9.5px; font-weight:800; text-transform:uppercase; letter-spacing:.04em; color:#fff; background:var(--violet); padding:2px 6px; border-radius:999px; margin-left:6px; vertical-align:middle; }
.pp-cmp .ord { font-size:11.5px; color:var(--muted); font-weight:400; }
.pp-cmp .best { color:var(--green); font-weight:800; }
.pp-tip { position:absolute; pointer-events:none; background:var(--ink); color:#fff; border-radius:10px; padding:9px 12px; font-size:12.5px; transform:translate(-50%,-115%); white-space:nowrap; box-shadow:0 6px 18px rgba(0,0,0,.25); z-index:5; }
.pp-tip .ty { font-weight:700; margin-bottom:3px; color:var(--gold-2); }
.pp-tip .tr { display:flex; gap:8px; align-items:center; }
.pp-tip .tr i { width:9px;height:9px;border-radius:2px; display:inline-block; }
.pp-tip .tsub { margin-top:4px; font-size:11px; opacity:.75; }
.pp-tog.on { border-color: var(--plum); background: var(--violet-soft); color: var(--plum); }

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
.pp-footer button { display: block; background: none; border: 0; color: #C9B8D6; font-size: 14px; padding: 5px 0; text-align: left; }
.pp-footer button:hover { color: #fff; }
.pp-footer-fine { font-size: 12px; color: #7C6A8C; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; }

@media (max-width: 860px) {
  .pp-hero-grid { grid-template-columns: 1fr; gap: 10px; padding: 42px 0 52px; }
  .pp-orb { display: none; } .pp-hero h1 { font-size: 38px; }
  .pp-grid-3, .pp-grid-2, .pp-grid-money, .pp-seg, .pp-row2, .pp-scn, .pp-pay-grid, .pp-room, .pp-sliders, .pp-brackets { grid-template-columns: 1fr; }
  .pp-months { grid-template-columns: repeat(3, 1fr); }
  .pp-navlink { padding: 8px 8px; font-size: 13.5px; } .pp-brand-name { font-size: 17px; }
  .pp-section { padding: 44px 0; } .pp-footer-cols { grid-template-columns: 1fr; gap: 22px; }
  .pp-dash-head { padding: 22px; } .pp-dash-head .big { font-size: 36px; } .pp-fs-sub { margin-left: 0; }
  .pp-bar-lab { width: 104px; } .pp-bar-val { width: 80px; }
}
@media (max-width: 520px) { .pp-navlink.hide-sm { display: none; } }

/* PRINT — one-page summary */
@media print {
  .pp-nav, .pp-footer, .pp-noprint { display: none !important; }
  .pp { background:#fff; }
  .pp-card, .pp-roomc, .pp-fs { box-shadow:none; break-inside: avoid; }
  .pp-dash-head { background:#fff !important; color:#000 !important; border:1px solid #ccc; }
  .pp-dash-head .big, .pp-dash-head .cap, .pp-dash-head .pp-eyebrow { color:#000 !important; }
  .pp-section { padding: 8px 0; }
  .pp-printonly { display:block !important; }
}
.pp-printonly { display:none; }
`;

/* ------------------------------------------------------------------
   5 · HELPERS + RISK
   ------------------------------------------------------------------ */
const n = (v) => (v === "" || v == null || isNaN(Number(v)) ? 0 : Number(v));
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const monthIndexOf = (iso) => { if (!iso) return 0; const p = String(iso).split("-"); const mi = parseInt(p[1], 10) - 1; return isNaN(mi) ? 0 : Math.max(0, Math.min(11, mi)); };
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const fmtMoney = (x) => (x < 0 ? "-$" : "$") + Math.abs(Math.round(x)).toLocaleString("en-CA");
const fmtMoney2 = (x) => (x < 0 ? "-$" : "$") + Math.abs(x).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtShort = (x) => x >= 1e6 ? "$" + (x / 1e6).toFixed(x >= 1e7 ? 0 : 1) + "M" : x >= 1e3 ? "$" + Math.round(x / 1e3) + "k" : "$" + Math.round(x);
const pct1 = (x) => (x * 100).toFixed(1) + "%";
const pct2 = (x) => (x * 100).toFixed(2) + "%";

const PROV_LIST = [
  ["AB","Alberta"],["BC","British Columbia"],["MB","Manitoba"],["NB","New Brunswick"],
  ["NL","Newfoundland & Labrador"],["NS","Nova Scotia"],["NT","Northwest Territories"],
  ["NU","Nunavut"],["ON","Ontario"],["PE","Prince Edward Island"],["QC","Quebec"],
  ["SK","Saskatchewan"],["YT","Yukon"],
];

const RISK = [
  { key: "conservative", name: "Conservative", ret: 0.06, color: "#5B8C5A", desc: "Steadier, smaller swings. Leans on bonds and cash." },
  { key: "moderate", name: "Moderate", ret: 0.08, color: "#7C4DC4", desc: "A balanced mix of growth and stability." },
  { key: "aggressive", name: "Aggressive", ret: 0.10, color: "#34185A", desc: "Maximizes long-term growth; bigger ups and downs." },
];
const riskBy = (k) => RISK.find((r) => r.key === k) || RISK[1];
/* effective annual return from the plan — supports a user-entered custom % */
const planRate = (plan) => {
  if (plan && plan.risk === "custom") { const r = Number(plan.customRate); return isNaN(r) ? 0.08 : r / 100; }
  return riskBy(plan ? plan.risk : "moderate").ret;
};

/* future value: lump sum + monthly contributions, compounded monthly */
function fv(rate, months, start, monthly) {
  const i = rate / 12;
  if (i === 0) return start + monthly * months;
  const pow = Math.pow(1 + i, months);
  return start * pow + monthly * ((pow - 1) / i);
}
/* monthly-compounded projection; optional 12-length custom schedule for YEAR 1 only.
   startMonth (0=Jan) skips months already elapsed in the current calendar year.
   returns balances at each year boundary (length years+1). */
function projectSeries(rate, years, startBal, monthly, monthsArr, startMonth) {
  const i = rate / 12;
  const sm = startMonth ? Math.max(0, Math.min(11, startMonth)) : 0;
  let bal = startBal;
  const out = [bal];
  const custom = monthsArr && monthsArr.length === 12;
  for (let y = 0; y < years; y++) {
    for (let mo = 0; mo < 12; mo++) {
      if (y === 0 && mo < sm) continue; // already elapsed this year
      bal = bal * (1 + i);
      bal += (y === 0 && custom) ? n(monthsArr[mo]) : monthly;
    }
    out.push(bal);
  }
  return out;
}
function projectFinal(rate, years, startBal, monthly, monthsArr, startMonth) {
  const s = projectSeries(rate, years, startBal, monthly, monthsArr, startMonth);
  return s[s.length - 1];
}
/* total contributed (excludes growth), respecting the start month for year 1 */
function totalContributed(years, startBal, monthly, monthsArr, startMonth) {
  const custom = monthsArr && monthsArr.length === 12;
  const sm = startMonth ? Math.max(0, Math.min(11, startMonth)) : 0;
  let y1 = 0;
  for (let mo = sm; mo < 12; mo++) y1 += custom ? n(monthsArr[mo]) : monthly;
  return startBal + y1 + monthly * 12 * Math.max(0, years - 1);
}
/* cumulative contributed at each year boundary (for the chart tooltip) */
function contributedSeries(years, startBal, monthly, monthsArr, startMonth) {
  const out = [startBal];
  for (let y = 1; y <= years; y++) out.push(totalContributed(y, startBal, monthly, monthsArr, startMonth));
  return out;
}
/* Canada minimum down payment (rules effective Dec 15, 2024, current 2026) */
function minDownPayment(price) {
  if (!price || price <= 0) return 0;
  if (price >= 1500000) return price * 0.20;
  if (price <= 500000) return price * 0.05;
  return 500000 * 0.05 + (price - 500000) * 0.10;
}
/* suggested emergency fund: months of essential expenses scaled by income stability */
function emergencyFundTarget(expenses, stability) {
  const months = stability === "stable" ? 3 : stability === "risky" ? 9 : 6;
  return { months, amount: Math.max(0, n(expenses)) * months };
}
/* OAS recovery tax ("clawback") on a given retirement net income (2026 rules) */
function oasClawback(retIncome) {
  const o = TAX_CONFIG.oas;
  const over = Math.max(0, n(retIncome) - o.thresholdMin);
  return Math.min(o.maxPension, over * o.rate); // capped at full OAS recovered
}
/* bracket navigator: where the next/previous combined bracket boundary sits */
function bracketInfo(gross, prov, employmentType, deductions = 0) {
  const F = TAX_CONFIG.federal;
  const P = TAX_CONFIG.prov[prov] || TAX_CONFIG.prov.ON;
  const bounds = Array.from(new Set([...F.brackets, ...P.brackets].map((b) => b.to).filter((x) => isFinite(x)))).sort((a, b) => a - b);
  const selfEmployed = employmentType === "self";
  const con = contributions(gross, prov, selfEmployed);
  const cppDed = cppDeduction(con, selfEmployed);
  const taxable = Math.max(0, gross - cppDed - deductions);
  const cur = marginalRate(gross, prov, employmentType, deductions);
  const up = bounds.find((b) => b > taxable + 0.5);
  const belows = bounds.filter((b) => b <= taxable - 0.5);
  const down = belows.length ? belows[belows.length - 1] : null;
  let toNext = null, rateAbove = null, toLower = null, rateBelow = null;
  if (up != null) { toNext = up - taxable; rateAbove = marginalRate(gross + toNext + 300, prov, employmentType, deductions); }
  if (down != null) { toLower = taxable - down; rateBelow = marginalRate(gross, prov, employmentType, deductions + toLower + 250); }
  return { taxable, cur, up, toNext, rateAbove, down, toLower, rateBelow };
}

/* Known-good 2026 checks. Run by setting DEV=true (see header). Pure-function regression guard. */
function runSelfTest() {
  const near = (a, b, t = 0.005) => Math.abs(a - b) <= t;
  const checks = [
    ["ON $60k marginal 29.65%", near(marginalRate(60000, "ON", "employed"), 0.2965)],
    ["BC $60k marginal 28.20%", near(marginalRate(60000, "BC", "employed"), 0.2820)],
    ["ON $120k marginal 43.41%", near(marginalRate(120000, "ON", "employed"), 0.4341)],
    ["QC $85k marginal 36.12%", near(marginalRate(85000, "QC", "employed"), 0.3612)],
    ["AB $250k marginal 43.29%", near(marginalRate(250000, "AB", "employed"), 0.4329)],
    ["max CPP base $4,230.45", near(contributions(120000, "ON", false).cppBase, 4230.45, 0.5)],
    ["max EI $1,123.07", near(contributions(120000, "ON", false).ei, 1123.07, 0.5)],
    ["proj 30y $300/mo 8% = $447,108", near(projectFinal(0.08, 30, 0, 300), 447108, 50)],
    ["TFSA cum born 1990 = $109,000", tfsaCumulativeRoom(1990) === 109000],
    ["min down $1.2M = $95,000", minDownPayment(1200000) === 95000],
    ["OAS clawback $110k ≈ $2,201", near(oasClawback(110000), (110000 - 95323) * 0.15, 1)],
  ];
  const failed = checks.filter(([, ok]) => !ok);
  if (failed.length) { console.error("[self-test] FAIL:", failed.map(([n]) => n)); return false; }
  console.log("[self-test] PASS — all", checks.length, "2026 checks OK");
  return true;
}
if (DEV) { try { runSelfTest(); } catch (e) { console.error("[self-test] threw", e); } }

function Mark({ size = 34 }) {
  return (
    <svg className="pp-mark" viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
      <rect x="1" y="1" width="38" height="38" rx="10" fill="#34185A" />
      <path d="M12 28 V14 h7 a5 5 0 0 1 0 10 h-7" fill="none" stroke="#CDA052" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 28 l5 -5 l4 3 l7 -9" fill="none" stroke="#B07BE0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <circle cx="29" cy="17" r="1.7" fill="#B07BE0" />
    </svg>
  );
}
function Orb() {
  return (
    <div className="pp-orb">
      <svg viewBox="0 0 400 400" width="100%" aria-hidden="true">
        <defs><radialGradient id="g1" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#7C4DC4" stopOpacity="0.18" /><stop offset="100%" stopColor="#7C4DC4" stopOpacity="0" />
        </radialGradient></defs>
        <circle cx="200" cy="195" r="190" fill="url(#g1)" />
        {[170, 130, 92, 56].map((r, i) => (<circle key={r} cx="200" cy="195" r={r} fill="none" stroke="#34185A" strokeOpacity={0.10 + i * 0.04} strokeWidth="1.2" />))}
        <polyline points="40,260 100,225 150,235 210,160 270,180 340,90" fill="none" stroke="#B0822B" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        {[[40, 260], [100, 225], [150, 235], [210, 160], [270, 180], [340, 90]].map(([x, y], i) => (<circle key={i} cx={x} cy={y} r="3.4" fill="#34185A" />))}
        <circle cx="340" cy="90" r="6" fill="none" stroke="#7C4DC4" strokeWidth="2" />
      </svg>
    </div>
  );
}

function Disclaimer() {
  return (
    <div className="pp-disclaimer">
      <AlertTriangle size={18} style={{ flex: "none", marginTop: 1 }} />
      <span><b>Educational information, not financial advice.</b> Purple Portfolio helps you learn and explore — it doesn't recommend specific securities or guarantee results. Figures are for the {TAX_YEAR} tax year; verify current limits at canada.ca and consider a licensed advisor before deciding.</span>
    </div>
  );
}
function TaxDisclaimer() {
  return (
    <div className="pp-disclaimer tax">
      <Info size={18} style={{ flex: "none", marginTop: 1 }} />
      <span><b>Tax figures are {TAX_YEAR} estimates for education only</b> — not tax preparation or advice. They simplify some rules (other credits, deductions, and pension adjustments aren't modelled). For anything binding, check your CRA / Revenu Québec account or a tax professional.</span>
    </div>
  );
}

/* ------------------------------------------------------------------
   6 · LIBRARY DATA (V2 topics preserved + V3 tax topics added)
   ------------------------------------------------------------------ */
const LIBRARY = [
  { key: "accounts", name: "Registered Accounts", icon: Landmark, desc: "The Canadian accounts that let your money grow with major tax advantages.",
    topics: [
      { key: "tfsa", name: "TFSA", lead: "The Tax-Free Savings Account — flexible, tax-free, and the right starting point for most Canadians.",
        prose: ["A TFSA is a registered account where your investments grow completely tax-free. You pay no tax on interest, dividends, or capital gains earned inside it, and — unlike most accounts — no tax when you take money out.",
          "The trade-off: contributions are not tax-deductible, so you fund it with after-tax money. In return, everything afterward is tax-free. It's also very flexible — withdraw anytime, and the room you used returns the following calendar year.",
          "A common myth is that a TFSA is 'just a savings account.' It can hold ETFs, stocks, bonds, GICs, and mutual funds — it's really a tax-free wrapper around whatever you invest in."],
        facts: [["2026 annual room", "$7,000"], ["Cumulative since 2009", "Up to $109,000 (if 18+ in 2009)"], ["Tax on growth", "None"], ["Tax on withdrawals", "None"], ["Flexibility", "Withdraw anytime; room returns next year"]],
        callout: "Watch-out: withdrawing and re-contributing in the same year while already maxed out can cause an over-contribution — the CRA charges 1% per month on the excess.",
        good: "Flexible mid-to-long-term goals, and especially valuable in a lower or middle tax bracket." },
      { key: "rrsp", name: "RRSP", lead: "The Registered Retirement Savings Plan — a tax deduction today in exchange for taxable income later.",
        prose: ["An RRSP is built for retirement. Contributions are tax-deductible, lowering your taxable income for the year — which can mean a meaningful refund. Investments then grow tax-deferred until withdrawal.",
          "The catch is on the way out: withdrawals are taxed as regular income. It works best when your tax rate today is higher than it'll be when you withdraw — usually in retirement. That's why RRSPs tend to favour higher earners.",
          "Two features let you borrow from your own RRSP tax-free if repaid on schedule: the Home Buyers' Plan (first home) and the Lifelong Learning Plan (education)."],
        facts: [["2026 limit", "18% of 2025 earned income, up to $33,810"], ["Contributions", "Tax-deductible"], ["Tax on growth", "Deferred"], ["Tax on withdrawals", "Taxed as income"], ["Over-contribution buffer", "$2,000 lifetime"]],
        callout: "Timing tip: contributions in the first 60 days of the year can be applied to either the previous or current tax year.",
        good: "Retirement saving, and higher earners who get the most from the up-front deduction." },
      { key: "fhsa", name: "FHSA", lead: "The First Home Savings Account — combining the best features of the RRSP and the TFSA.",
        prose: ["The FHSA is the newest registered account and arguably the most generous for first-time buyers. Contributions are tax-deductible like an RRSP, and qualifying withdrawals to buy your first home are completely tax-free like a TFSA. No other account does both.",
          "You can contribute up to $8,000 per year, to a $40,000 lifetime maximum. Unused room carries forward by up to $8,000, so the most you can ever put in during one year is $16,000. Your room only starts once you open the account — so opening one early (even with a small deposit) starts the clock.",
          "There's a deadline, too: the account has a 15-year participation window and must be closed by the end of the year you turn 71. If you don't buy, the funds can roll into your RRSP without using RRSP room."],
        facts: [["Annual limit", "$8,000"], ["Lifetime limit", "$40,000"], ["Carry-forward", "Up to $8,000 (max $16,000/year)"], ["Deadline", "15 years, or age 71"], ["First-home withdrawals", "Tax-free"]],
        callout: "Open it early: contribution room only begins the year you open the account, not the year you became eligible.",
        good: "Anyone saving toward a first home — often the first account to fill for that goal." },
      { key: "resp", name: "RESP", lead: "The Registered Education Savings Plan — government grants on top of tax-deferred growth for a child's education.",
        prose: ["An RESP helps you save for a child's post-secondary education. Contributions aren't tax-deductible, but the real draw is the Canada Education Savings Grant (CESG): the government adds 20% on the first $2,500 you contribute each year — up to $500 annually, to a $7,200 lifetime maximum per child.",
          "Growth and grants are tax-deferred. When the money comes out for school, the grants and growth are taxed in the student's hands — usually at a very low (often zero) rate. Your original contributions come back tax-free.",
          "The lifetime contribution limit is $50,000 per child. Lower-income families may also qualify for the Canada Learning Bond, which adds money without requiring any contribution."],
        facts: [["Lifetime limit", "$50,000 per child"], ["CESG grant", "20% on first $2,500/yr"], ["Max grant", "$500/yr, $7,200 lifetime"], ["Growth", "Tax-deferred"], ["Withdrawals", "Taxed in the student's hands"]],
        callout: "The CESG match is essentially free money — for families saving for education, capturing the full $500/year grant is one of the highest-return moves available.",
        good: "Parents, grandparents, or guardians saving for a child's education." },
      { key: "nonreg", name: "Non-Registered Accounts", lead: "A regular taxable investment account — unlimited room, but the taxman shares in your gains.",
        prose: ["A non-registered (or 'taxable') account is a plain investment account with no contribution limits and no special tax shelter. It's where money goes once your registered room is full, or when you need flexibility the registered accounts don't offer.",
          "The cost is tax: interest is taxed fully at your marginal rate each year; eligible Canadian dividends get a gross-up and dividend tax credit; and capital gains are taxed only when you sell, at a 50% inclusion rate. Because the three are taxed so differently, what you hold here matters a lot — see Asset Location.",
          "Despite the tax, non-registered accounts are essential for larger goals and early retirement, and capital-gains-focused holdings can still be quite tax-efficient."],
        facts: [["Contribution room", "Unlimited"], ["Interest", "Fully taxed yearly"], ["Eligible dividends", "Gross-up + tax credit"], ["Capital gains", "50% inclusion, taxed on sale"], ["Best for", "Money beyond registered room"]],
        callout: "Fill your TFSA, FHSA, and RRSP room first — a non-registered account is usually the last stop, not the first.",
        good: "Investing beyond your registered room, or goals that don't fit a registered account." },
    ] },
  { key: "tax", name: "Tax & Your Money", icon: Receipt, desc: "How Canadian taxes actually work — paycheques, brackets, and the taxation of investment income.",
    topics: [
      { key: "marginalavg", name: "Marginal vs Average Tax", lead: "Two different rates that people constantly mix up — and the confusion costs real decisions.",
        prose: ["Canada uses a progressive system: income is taxed in brackets, and only the dollars inside each bracket pay that bracket's rate. Your marginal rate is the rate on your next dollar — the highest bracket you reach. Your average rate is your total tax divided by your total income, which is always lower.",
          "The classic myth is 'a raise pushed me into a higher bracket, so I take home less.' That's never true — only the portion above the threshold is taxed higher; every dollar below it is unaffected.",
          "Why it matters: deductions (like RRSP contributions) save you tax at your marginal rate, while your overall tax burden is described by your average rate. The planner shows you both for your own numbers."],
        facts: [["Marginal rate", "Rate on your next dollar"], ["Average rate", "Total tax ÷ total income"], ["Brackets", "Federal + provincial, stacked"], ["Key use", "Deductions save at the marginal rate"]],
        callout: "A higher marginal bracket never reduces your take-home — it only applies to the income above the threshold." },
      { key: "investtax", name: "Taxation of Investment Income", lead: "Interest, dividends, and capital gains are taxed three very different ways.",
        prose: ["In a non-registered account, the type of income changes how much tax you pay. Interest (from bonds, GICs, savings) is the least efficient — it's taxed fully at your marginal rate, just like employment income.",
          "Eligible Canadian dividends get special treatment: the amount is 'grossed up' by 38%, then a dividend tax credit (about 15% federally, plus a provincial credit) offsets much of the tax — recognizing the company already paid corporate tax. At lower incomes the effective rate can be very low.",
          "Capital gains — the profit when you sell an investment for more than you paid — are the most efficient for most people: only 50% of the gain is included in income (the 2024 proposal to raise this to two-thirds was cancelled in 2025), and you control the timing by choosing when to sell. Inside a TFSA, RRSP, or FHSA, none of this applies — growth is sheltered."],
        facts: [["Interest", "100% taxed at marginal rate"], ["Eligible dividends", "38% gross-up + tax credit"], ["Capital gains", "50% included, taxed on sale"], ["Inside registered accounts", "Sheltered — no tax"]],
        callout: "Because the three are taxed so differently, where you hold each asset can change your after-tax return — see Asset Location." },
      { key: "assetloc", name: "Asset Location", lead: "Putting the right asset in the right account can quietly boost your after-tax return.",
        prose: ["Asset allocation is your mix of stocks and bonds. Asset location is the next layer: deciding which account each asset sits in, so the tax system works for you rather than against you.",
          "A common framework: hold tax-inefficient assets (bonds and other interest-paying investments) inside registered accounts where the interest is sheltered; keep Canadian-dividend and capital-gains-focused holdings where their preferential treatment shines; and use the TFSA for your highest-growth assets, since all that growth comes out tax-free.",
          "It's a refinement, not a foundation — get your savings rate, diversification, and fees right first. But for investors who've filled registered room and spilled into a taxable account, thoughtful location is close to free money."],
        facts: [["Bonds / interest", "Best sheltered (RRSP/TFSA)"], ["High growth", "Great in a TFSA (tax-free)"], ["Canadian dividends", "Reasonable in taxable"], ["Priority", "After savings rate, diversification & fees"]],
        callout: "Asset location only matters once you're investing in more than one account type — for most beginners, one good account comes first." },
      { key: "clawbacks", name: "OAS & GIS Clawbacks", lead: "Why a bigger RRSP isn't always better — government benefits can be quietly taxed back in retirement.",
        prose: ["Two government benefits for seniors are income-tested, meaning they shrink as your retirement income rises. Old Age Security (OAS) is reduced by the OAS recovery tax — the 'clawback' — once your net income passes a threshold (" + fmtMoney(TAX_CONFIG.oas.thresholdMin) + " for 2026), at 15 cents per dollar above it, until OAS disappears entirely around $155,000.",
          "The Guaranteed Income Supplement (GIS), for lower-income seniors, is even more sensitive: it's reduced by roughly 50 cents for every dollar of other income. That's effectively a 50% tax on withdrawals for those who qualify.",
          "Here's the catch that flips the usual RRSP advice: RRSP and RRIF withdrawals count as income for both tests, but TFSA withdrawals do not. So for someone likely to face the OAS clawback, or especially the GIS reduction, the TFSA can beat the RRSP even when a simple marginal-rate comparison favours the RRSP. The dashboard flags this when your estimated retirement income lands in either danger zone."],
        facts: [["OAS clawback starts", fmtMoney(TAX_CONFIG.oas.thresholdMin) + " (2026)"], ["OAS recovery rate", "15¢ per $1 over"], ["GIS reduction", "~50¢ per $1 of income"], ["TFSA withdrawals", "Don't count toward either"]],
        callout: "TFSA withdrawals are invisible to the OAS and GIS income tests — a powerful, often-overlooked reason to hold TFSA room into retirement." },
    ] },
  { key: "types", name: "Investment Types", icon: LineChart, desc: "The building blocks you can hold inside any account, from simple to advanced.",
    topics: [
      { key: "etf", name: "Index ETFs", lead: "One fund that holds an entire market, traded like a stock.",
        prose: ["An index ETF holds hundreds or thousands of companies at once, tracking a market index like the S&P/TSX or a global index. You buy and sell it like a single stock.", "Because it matches the market rather than trying to beat it, fees are very low. For most people, a broad index ETF (or a single all-in-one asset-allocation ETF) is the simplest sensible foundation of a portfolio."],
        facts: [["Diversification", "Very high"], ["Typical fees", "Very low"], ["Effort", "Low"], ["Risk", "Tied to the market it tracks"]] },
      { key: "index", name: "Index Mutual Funds", lead: "The same index idea, bought through a fund provider.",
        prose: ["Index mutual funds track a market index just like ETFs, but you buy them from a provider rather than on an exchange. They can be convenient for automatic recurring investing.", "The key thing to check is the MER (management expense ratio). Older actively managed funds in Canada have historically carried high fees that quietly erode returns — index versions are usually far cheaper."],
        facts: [["Diversification", "Very high"], ["Fees", "Low for index; watch active funds"], ["Auto-invest", "Often easy"]] },
      { key: "stocks", name: "Individual Stocks", lead: "Owning a piece of a single company.",
        prose: ["Buying a stock makes you a part-owner of one company. The upside is direct exposure and control; the downside is concentration — a single company can fall hard regardless of the wider market.", "Picking stocks well takes research and a tolerance for volatility. Many investors hold a few alongside a diversified core rather than building a whole portfolio from single names."],
        facts: [["Diversification", "Low (per stock)"], ["Growth potential", "High"], ["Risk", "High — single-company risk"], ["Effort", "High"]] },
      { key: "bonds", name: "Bonds & Fixed Income", lead: "Lending money in exchange for steady interest.",
        prose: ["A bond is essentially a loan to a government or company that pays interest and returns your principal at maturity. Bonds are steadier than stocks and provide income, which is why they cushion a portfolio.", "Their quirk: when interest rates rise, the market value of existing bonds tends to fall. Over the long run they typically return less than stocks — the price of their stability. Note: bond interest is taxed fully, so bonds are often best held inside a registered account."],
        facts: [["Volatility", "Lower than stocks"], ["Income", "Yes (taxed as interest)"], ["Long-term return", "Lower than stocks"], ["Sensitive to", "Interest rates"]] },
      { key: "gic", name: "GICs & High-Interest Savings", lead: "Guaranteed, low-risk homes for money you can't lose.",
        prose: ["A GIC pays a fixed rate over a set term and protects your principal. High-interest savings accounts are similar — safe, predictable, easy to access.", "Ideal for emergency funds and money you'll need soon. The trade-off is low growth: over long periods returns may not keep pace with inflation, so they're not where long-term wealth is usually built."],
        facts: [["Principal", "Protected"], ["Return", "Low, predictable"], ["Liquidity", "High (HISA); locked (GIC)"], ["Best for", "Short-term & emergency money"]] },
      { key: "reit", name: "REITs", lead: "Real-estate exposure without buying a property.",
        prose: ["A REIT pools money to own income-producing real estate and pays out most of the rental income to investors. You get real-estate exposure and income without a mortgage or a tenant.", "REITs are sensitive to interest rates and concentrated in one sector, so they're usually a slice of a diversified portfolio rather than the whole thing."],
        facts: [["Income", "Typically high"], ["Diversification", "Single sector"], ["Sensitive to", "Interest rates"]] },
    ] },
  { key: "concepts", name: "Core Concepts", icon: GraduationCap, desc: "The handful of ideas that explain most of investing success.",
    topics: [
      { key: "riskreturn", name: "Risk & Return", lead: "Higher potential returns come with bigger ups and downs.",
        prose: ["There's no free lunch: investments that can grow faster tend to swing more. The art isn't avoiding risk — it's taking the right amount for your time horizon and temperament.", "A long horizon lets you take more risk, because you have time to recover from downturns. Money you need soon belongs in safer places, regardless of how markets look."],
        facts: [["Core idea", "Reward tracks risk"], ["Key lever", "Your time horizon"]] },
      { key: "diversification", name: "Diversification", lead: "Don't put all your eggs in one basket.",
        prose: ["Spreading money across many companies, sectors, and countries means no single failure can sink you. When one part lags, another often holds up, smoothing the ride.", "It's the closest thing to a free lunch in investing: you reduce risk without necessarily reducing expected return. A single broad or global ETF delivers a lot of diversification in one purchase."],
        facts: [["Benefit", "Lower risk for similar return"], ["Easy route", "Broad / global index funds"]] },
      { key: "compounding", name: "Compounding", lead: "Returns earning returns — time is your biggest ally.",
        prose: ["Compounding is growth on your growth. Early gains generate their own gains, and over decades the effect becomes dramatic. This is why starting early matters more than starting big.", "A modest amount invested in your twenties can outgrow a much larger amount started in your forties, purely because it had more time to compound. The planner on this site is built to show exactly this."],
        facts: [["Biggest factor", "Time invested"], ["Takeaway", "Start early, stay consistent"]] },
      { key: "fees", name: "Fees & MER", lead: "Small percentages compound into large amounts.",
        prose: ["Every fund charges a fee, the MER (management expense ratio). It sounds tiny — but it's charged every year, on your whole balance, and compounds against you.", "The gap between a 2% fee and a 0.2% fee can cost tens of thousands of dollars over a lifetime. Checking fees is one of the highest-value habits a new investor can build. Try the fee slider on your dashboard to see the drag for yourself."],
        facts: [["What to check", "MER on every fund"], ["Why it matters", "Fees compound like returns"]] },
      { key: "emergency", name: "Emergency Funds", lead: "The cash cushion that keeps a bad month from becoming a financial crisis.",
        prose: ["An emergency fund is money set aside for genuine surprises — a job loss, a car repair, a medical bill — so you don't have to sell investments at a bad time or reach for high-interest debt. A common target is three to six months of essential expenses.",
          "Because you might need it on short notice, it belongs somewhere safe and accessible: a high-interest savings account or a TFSA holding cash or a HISA fund, not the stock market. The point isn't growth, it's certainty.",
          "Building even a small starter cushion (say $1,000–$2,000) before you invest heavily is one of the most underrated moves in personal finance — it's what lets you stay invested through turbulence."],
        facts: [["Typical target", "3–6 months of essentials"], ["Where to hold it", "HISA or TFSA (cash/HISA)"], ["Starter goal", "$1,000–$2,000 first"], ["Purpose", "Certainty, not growth"]],
        callout: "A starter emergency fund usually comes before serious investing — it's the foundation that lets the rest of your plan survive a rough patch." },
      { key: "debtinvest", name: "Debt vs Invest", lead: "Sometimes the best 'investment' is paying off what you owe.",
        prose: ["Paying down debt gives you a guaranteed, tax-free return equal to the interest rate you avoid. Against high-interest debt — credit cards at 19%+, many lines of credit — almost no investment can reliably beat that, so clearing it usually comes first.",
          "Low-interest debt is different. A mortgage or student loan at a modest rate may be worth carrying while you invest, especially in a tax-advantaged account, because long-run market returns can exceed the interest cost. There's no single right answer — it depends on the rate and your comfort with risk.",
          "A useful rule of thumb: knock out high-interest debt before investing beyond any employer match, then balance lower-interest debt against investing based on the numbers and your temperament."],
        facts: [["High-interest debt", "Pay first — guaranteed return"], ["Low-interest debt", "Can run alongside investing"], ["Dividing line", "Roughly the rate vs expected return"], ["Always first", "Capture any employer match"]],
        callout: "Paying off a 20% credit card is a guaranteed 20% return — better than almost any investment, with zero risk." },
      { key: "orderops", name: "The Order of Operations", lead: "A simple priority ladder for where your next dollar should go.",
        prose: ["When money is tight, the question isn't just 'should I invest?' but 'invest in what, first?' A widely used Canadian priority ladder helps: build a small starter emergency fund, capture any employer RRSP match (free money), then crush high-interest debt.",
          "Next, top up your emergency fund to a full 3–6 months, then fill tax-advantaged room — FHSA, TFSA, and RRSP in the order that fits your goals and tax bracket. Only after that does non-registered investing usually make sense.",
          "It's a guide, not a law — your situation may reorder a step or two. The dashboard applies this ladder to your own inputs and flags where you might focus next."],
        facts: [["1", "Starter emergency fund"], ["2", "Employer RRSP match"], ["3", "High-interest debt"], ["4", "Full emergency fund"], ["5", "Fill registered room (FHSA/TFSA/RRSP)"], ["6", "Non-registered investing"]],
        callout: "The ladder front-loads guaranteed wins — free matches and avoided interest — before market-dependent investing." },
      { key: "dca", name: "Dollar-Cost Averaging", lead: "Investing steadily instead of timing the market.",
        prose: ["Dollar-cost averaging means investing a fixed amount on a schedule — say, every payday — no matter what the market is doing. You buy more when prices are low and less when high.", "It removes the stress of finding the 'perfect' moment (which almost nobody does reliably) and builds a consistent habit."],
        facts: [["Method", "Invest fixed amounts regularly"], ["Benefit", "Removes timing guesswork"]] },
      { key: "allocation", name: "Asset Allocation", lead: "Your stock/bond/cash mix drives most of your results.",
        prose: ["Asset allocation is how you split money between growth assets (stocks) and defensive ones (bonds, cash). Research consistently finds this mix explains most of a portfolio's behaviour — far more than which specific funds you pick.", "Matching your allocation to your time horizon and risk tolerance is the single most important decision you'll make."],
        facts: [["Drives", "Most of your risk & return"], ["Set by", "Time horizon + risk tolerance"]] },
    ] },
  { key: "advanced", name: "Advanced Topics", icon: Percent, desc: "Going deeper, for when the fundamentals feel comfortable.",
    topics: [
      { key: "capm", name: "CAPM", lead: "The Capital Asset Pricing Model — linking expected return to market risk.",
        prose: ["CAPM estimates the return you should expect from an asset given its sensitivity to overall market movements, measured by 'beta'. The relationship is: Expected return = risk-free rate + beta × (market return − risk-free rate).",
          "In plain terms: an asset that swings more than the market (beta above 1) should compensate you with higher expected returns; a steadier one (beta below 1) is expected to return less. So a stock with a beta of 1.5, when the market is expected to return 7% above a 3% risk-free rate, would have an expected return of 3% + 1.5 × 4% = 9%.",
          "CAPM has well-known limitations — beta is backward-looking and markets aren't perfectly efficient — but it's the foundational vocabulary for thinking about risk-adjusted return. Use the calculator below to build intuition for how beta moves expected return."],
        facts: [["Formula", "E(R) = Rf + β(Rm − Rf)"], ["Beta", "Sensitivity to the market"], ["Beta > 1", "Swings more; higher expected return"], ["Beta < 1", "Steadier; lower expected return"]],
        calc: "capm" },
      { key: "mpt", name: "Modern Portfolio Theory", lead: "Building portfolios that maximize return for a given level of risk.",
        prose: ["Modern Portfolio Theory shows that combining assets that don't move in lockstep can produce a better risk-return balance than any alone. Because their ups and downs partly cancel, the blended portfolio can have lower volatility than the average of its parts.",
          "The 'efficient frontier' is the set of portfolios offering the most expected return for each level of risk. Rational investors, the theory says, should hold a portfolio on that frontier matched to their risk tolerance.",
          "The practical takeaway is simple and powerful: thoughtful diversification isn't just safer, it can be genuinely more efficient. The two-asset mixer below lets you feel how correlation changes a portfolio's risk."],
        facts: [["Key idea", "Efficient frontier"], ["Engine", "Low correlation between assets"], ["Practical lesson", "Diversification is efficient"]],
        calc: "mpt" },
    ] },
];

/* ============================================================ APP ============================================================ */
export default function PurplePortfolio() {
  const [view, setView] = useState({ name: "home", params: {} });
  const [plan, setPlan] = useState({ risk: "moderate", customRate: 8, includeMER: false, customFee: 0.5, retAge: 65, buyHome: false, province: "ON", employmentType: "employed", lumpSum: "", contribMode: "flat", months: ["", "", "", "", "", "", "", "", "", "", "", ""], asOf: todayISO(), homePrice: "", livingExpenses: "", incomeStability: "variable", goals: ["retirement"], employerMatch: "", highInterestDebt: "", bNonreg: "", bLocked: "", emergencyStatus: "none", emergencySaved: "", retTaxRate: "" });
  const go = (name, params = {}) => { setView({ name, params }); window.scrollTo(0, 0); };
  const startPlan = () => go("plan");

  return (
    <div className="pp">
      <style>{STYLES}</style>
      <nav className="pp-nav">
        <div className="pp-wrap pp-nav-in">
          <button className="pp-brand" onClick={() => go("home")} aria-label="Purple Portfolio home"><Mark /><span className="pp-brand-name">Purple <b>Portfolio</b></span></button>
          <div className="pp-navlinks">
            <button className={"pp-navlink hide-sm" + (view.name === "home" ? " active" : "")} onClick={() => go("home")}>Home</button>
            <button className={"pp-navlink" + (view.name === "plan" || view.name === "dash" ? " active" : "")} onClick={startPlan}>The Planner</button>
            <button className={"pp-navlink" + (view.name.startsWith("lib") ? " active" : "")} onClick={() => go("lib")}>Library</button>
            <button className={"pp-navlink" + (view.name === "about" ? " active" : "")} onClick={() => go("about")}>About</button>
          </div>
        </div>
      </nav>

      {view.name === "home" && <Home go={go} start={startPlan} />}
      {view.name === "plan" && <Planner plan={plan} setPlan={setPlan} onDone={() => go("dash")} onExit={() => go("home")} />}
      {view.name === "dash" && <Dashboard plan={plan} setPlan={setPlan} go={go} edit={() => go("plan")} />}
      {view.name === "lib" && <Library go={go} />}
      {view.name === "libcat" && <LibraryCategory catKey={view.params.cat} go={go} />}
      {view.name === "libtopic" && <Topic catKey={view.params.cat} topicKey={view.params.topic} go={go} />}
      {view.name === "about" && <About go={go} start={startPlan} />}

      <footer className="pp-footer">
        <div className="pp-wrap">
          <button className="pp-brand" onClick={() => go("home")}><Mark size={30} /><span className="pp-brand-name">Purple <b>Portfolio</b></span></button>
          <div className="pp-footer-cols">
            <div><h5>The Club</h5><p style={{ fontSize: 14, color: "#B6A4C6", maxWidth: "30em" }}>A Canadian investment-education club. We help people understand their options, their accounts, their taxes, and the markets — so they can make informed decisions on their own terms.</p></div>
            <div><h5>Explore</h5><button onClick={startPlan}>The Planner</button><button onClick={() => go("lib")}>Learning Library</button><button onClick={() => go("about")}>About</button></div>
            <div><h5>Learn</h5><button onClick={() => go("libcat", { cat: "accounts" })}>Registered Accounts</button><button onClick={() => go("libcat", { cat: "tax" })}>Tax & Your Money</button><button onClick={() => go("libcat", { cat: "concepts" })}>Core Concepts</button></div>
          </div>
          <p className="pp-footer-fine">Purple Portfolio provides general educational information only and does not provide financial, investment, tax, or legal advice, nor recommendations to buy or sell any security. Tax outputs are {TAX_YEAR}-tax-year estimates, not tax preparation. Projections are illustrative and not guarantees. Figures reflect the {TAX_YEAR} tax year and may change — verify at canada.ca / revenuquebec.ca. © {new Date().getFullYear()} Purple Portfolio.</p>
        </div>
      </footer>
    </div>
  );
}

/* ============================================================ HOME ============================================================ */
function Home({ go, start }) {
  return (
    <>
      <header className="pp-hero">
        <svg className="pp-hero-deco" viewBox="0 0 400 400" aria-hidden="true">
          {[180, 140, 100, 60].map((r, i) => (<circle key={r} cx="200" cy="200" r={r} fill="none" stroke="#7C4DC4" strokeOpacity={0.10 + i * 0.03} strokeWidth="1.2" />))}
        </svg>
        <div className="pp-wrap pp-hero-grid">
          <div>
            <span className="pp-eyebrow"><Sparkles size={14} /> Tax-aware planning, built for Canadians</span>
            <h1 style={{ marginTop: 16 }}>Your paycheque,<br /><em>decoded</em>—and your<br />future, projected.</h1>
            <p className="pp-hero-sub">Purple Portfolio is a free planner and learning club. Enter your income and province and see exactly where your money goes — taxes, CPP, EI — then your contribution room, RRSP/FHSA tax savings, and a projection of your future.</p>
            <div className="pp-hero-cta">
              <button className="pp-btn pp-btn-primary" onClick={start}>Build my plan <ArrowRight size={18} /></button>
              <button className="pp-btn pp-btn-ghost" onClick={() => go("lib")}>Browse the library</button>
            </div>
            <div className="pp-hero-fine"><Shield size={15} /> Nothing is stored or shared — everything runs privately in your browser.</div>
          </div>
          <Orb />
        </div>
      </header>

      <section className="pp-section">
        <div className="pp-wrap">
          <span className="pp-eyebrow">How it works</span>
          <h2 style={{ fontSize: 34, margin: "12px 0 30px", maxWidth: "16em" }}>From a few numbers to a clear picture.</h2>
          <div className="pp-grid-3">
            {[
              { ic: <MapPin size={20} />, t: "1 · Your income & province", d: "We decode your real take-home: federal + provincial tax, CPP/CPP2, and EI — for your province." },
              { ic: <Calculator size={20} />, t: "2 · Tax savings & room", d: "See your RRSP/FHSA tax savings, what contribution room you've got left, and your FHSA deadline." },
              { ic: <TrendingUp size={20} />, t: "3 · Your projection", d: "Watch your portfolio grow to retirement, with after-tax, inflation, and fee views you control." },
            ].map((f) => (
              <div className="pp-card" key={f.t}><div className="pp-feat-ic" style={{ marginBottom: 14 }}>{f.ic}</div><h4 style={{ fontSize: 19, marginBottom: 8 }}>{f.t}</h4><p style={{ fontSize: 14.5, color: "var(--muted)" }}>{f.d}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="pp-band">
        <div className="pp-wrap pp-section">
          <div className="pp-grid-2" style={{ alignItems: "center", gap: 40 }}>
            <div>
              <span className="pp-eyebrow">Why we exist</span>
              <h2 style={{ fontSize: 32, margin: "14px 0 16px", color: "#fff" }}>We educate. We don't sell.</h2>
              <p style={{ color: "#D9C9EE", fontSize: 16.5, marginBottom: 14 }}>Most investing content is either selling you something or buried in jargon. Purple Portfolio does neither. We put your real numbers in, show the honest trade-offs — including the tax ones — and hand the decision back to you.</p>
              <p style={{ color: "#D9C9EE", fontSize: 16.5 }}>The goal is simple: help as many people as possible become confident, informed investors — whatever their budget.</p>
            </div>
            <div className="pp-grid-2" style={{ gap: 14 }}>
              {[
                { ic: <Receipt size={18} />, t: "Tax-aware", d: "Real CPP, EI, and bracket math for every province." },
                { ic: <Shield size={18} />, t: "Private by design", d: "No accounts, no tracking of your finances." },
                { ic: <Percent size={18} />, t: "Honest on fees", d: "We show the costs others gloss over." },
                { ic: <GraduationCap size={18} />, t: "Beginner-friendly", d: "Plain language, with depth when you want it." },
              ].map((c) => (
                <div key={c.t} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: 18 }}>
                  <div style={{ color: "var(--gold-2)", marginBottom: 10 }}>{c.ic}</div><h4 style={{ color: "#fff", fontSize: 16, marginBottom: 5 }}>{c.t}</h4><p style={{ color: "#C7B4DF", fontSize: 13.5 }}>{c.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pp-section">
        <div className="pp-wrap" style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: 32, marginBottom: 12 }}>Ready to see your numbers?</h2>
          <p style={{ color: "var(--muted)", fontSize: 17, margin: "0 auto 26px", maxWidth: "32em" }}>It takes about three minutes, and you'll come away with a clearer picture than most people ever get.</p>
          <button className="pp-btn pp-btn-primary" onClick={start}>Build my plan <ArrowRight size={18} /></button>
        </div>
      </section>
    </>
  );
}

/* ============================================================ INPUT FIELDS ============================================================ */
function NumberField({ label, help, value, onChange, placeholder, suffix, id }) {
  return (
    <div className="pp-field">
      <label className="pp-label2" htmlFor={id}>{label}</label>
      <div className="pp-input-wrap">
        <input id={id} className="pp-input" type="number" inputMode="numeric" value={value ?? ""} placeholder={placeholder}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} />
        {suffix && <span className="pp-adorn r">{suffix}</span>}
      </div>
      {help && <div className="pp-help">{help}</div>}
    </div>
  );
}
function CurrencyField({ label, help, value, onChange, placeholder, id }) {
  const display = value === "" || value == null ? "" : Number(value).toLocaleString("en-CA");
  return (
    <div className="pp-field">
      <label className="pp-label2" htmlFor={id}>{label}</label>
      <div className="pp-input-wrap">
        <span className="pp-adorn">$</span>
        <input id={id} className="pp-input" inputMode="numeric" value={display} placeholder={placeholder}
          onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ""); onChange(raw === "" ? "" : Number(raw)); }} />
      </div>
      {help && <div className="pp-help">{help}</div>}
    </div>
  );
}
function SelectField({ label, help, value, onChange, options, id }) {
  return (
    <div className="pp-field">
      <label className="pp-label2" htmlFor={id}>{label}</label>
      <select id={id} className="pp-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      {help && <div className="pp-help">{help}</div>}
    </div>
  );
}
function Accordion({ title, sub, open, onToggle, children }) {
  return (
    <div className="pp-acc">
      <button className="pp-acc-head" onClick={onToggle} aria-expanded={open}>
        <div><h4>{title}</h4>{sub && <div className="sub">{sub}</div>}</div>
        <ChevronDown size={20} className={"pp-chev" + (open ? " open" : "")} />
      </button>
      {open && <div className="pp-acc-body">{children}</div>}
    </div>
  );
}

/* ============================================================ PLANNER ============================================================ */
function Planner({ plan, setPlan, onDone, onExit }) {
  const set = (k, v) => setPlan((p) => ({ ...p, [k]: v }));
  const age = n(plan.age), retAge = n(plan.retAge), homeAge = n(plan.homeAge);
  const yrsRet = age > 0 && retAge > age ? retAge - age : null;
  const yrsHome = age > 0 && homeAge > age ? homeAge - age : null;
  const ready = age > 0 && retAge > age && !!plan.province && (n(plan.bFhsa) <= 0 || n(plan.fhsaYearOpened) > 0);

  let retHelp;
  if (yrsRet == null) retHelp = <>Many Canadians target <b>60–65</b>. We've pre-filled 65 — adjust it to your own plan.</>;
  else retHelp = <>That's about <b>{yrsRet} years</b> of investing from now — {yrsRet >= 30 ? "plenty of runway for compounding to do the heavy lifting." : yrsRet >= 15 ? "a solid runway to grow steadily." : "a shorter runway, so steadier choices matter more."}</>;

  return (
    <div className="pp-wrap">
      <div className="pp-planner">
        <button className="pp-back" onClick={onExit}><ArrowLeft size={16} /> Home</button>
        <span className="pp-eyebrow" style={{ marginTop: 14, display: "block" }}><Sparkles size={14} /> Build your plan</span>
        <h1 style={{ fontSize: 38, margin: "10px 0 8px" }}>Your numbers, your plan.</h1>
        <p style={{ color: "var(--muted)", fontSize: 16, marginBottom: 28, maxWidth: "40em" }}>Enter your own estimates below — there are no wrong answers, and you can change anything later. We'll decode your paycheque, your room, and your projection.</p>

        {/* 1 — About you */}
        <div className="pp-fs">
          <div className="pp-fs-head"><div className="pp-fs-num">1</div><h3>About you</h3></div>
          <p className="pp-fs-sub">The basics that set your tax picture and time horizon.</p>
          <div className="pp-row2">
            <NumberField id="f-age" label="Your age" placeholder="e.g. 19" value={plan.age} onChange={(v) => set("age", v)} suffix="years"
              help={<>Your age is the single biggest factor in long-term growth — earlier means more time to compound.</>} />
            <CurrencyField id="f-income" label="Annual income (CAD)" placeholder="e.g. 45,000" value={plan.income} onChange={(v) => set("income", v)}
              help={<>Your gross employment income, before deductions. We use it for tax, CPP/EI, and contribution room.</>} />
          </div>
          <div className="pp-row2">
            <SelectField id="f-prov" label="Province / territory" value={plan.province} onChange={(v) => set("province", v)}
              options={PROV_LIST} help={<>Tax is provincial — this drives your brackets, rates, and credits.{plan.province === "QC" && <> Quebec uses QPP, QPIP, and the federal abatement.</>}</>} />
            <div className="pp-field">
              <label className="pp-label2">Employment type</label>
              <div className="pp-toggle">
                <button className={plan.employmentType === "employed" ? "on" : ""} onClick={() => set("employmentType", "employed")}>Employed</button>
                <button className={plan.employmentType === "self" ? "on" : ""} onClick={() => set("employmentType", "self")}>Self-employed</button>
              </div>
              <div className="pp-help">{plan.employmentType === "self" ? <>Self-employed pay <b>both</b> CPP halves and usually no EI.</> : <>Standard CPP/CPP2 and EI premiums apply.</>}</div>
            </div>
          </div>
          <div className="pp-field" style={{ marginTop: 18 }}>
            <label className="pp-label2">How do you want to invest?</label>
            <div className="pp-seg">
              {RISK.map((r) => (
                <button key={r.key} className={"pp-segc" + (plan.risk === r.key ? " on" : "")} onClick={() => set("risk", r.key)}>
                  <div className="nm">{r.name} <span className="rt">~{Math.round(r.ret * 100)}%/yr</span></div>
                  <div className="ds">{r.desc}</div>
                </button>
              ))}
            </div>
            <button className={"pp-segc" + (plan.risk === "custom" ? " on" : "")} style={{ marginTop: 10, display: "block", width: "100%" }} onClick={() => set("risk", "custom")}>
              <div className="nm">Set my own rate <span className="rt">{plan.risk === "custom" ? `~${Number(plan.customRate || 0)}%/yr` : "custom"}</span></div>
              <div className="ds">Prefer your own assumption? Use any annual return you like.</div>
            </button>
            {plan.risk === "custom" && (
              <div className="pp-field" style={{ marginTop: 12, marginBottom: 0 }}>
                <label className="pp-label2" htmlFor="f-customrate">Your assumed annual return</label>
                <div className="pp-input-wrap"><input id="f-customrate" className="pp-input" inputMode="decimal" value={plan.customRate}
                  onChange={(e) => { const raw = e.target.value.replace(/[^0-9.]/g, ""); set("customRate", raw); }} placeholder="e.g. 8.5" /><span className="pp-adorn r">%</span></div>
                <div className="pp-toggle" style={{ marginTop: 10 }}>
                  <button className={plan.includeMER ? "on" : ""} onClick={() => set("includeMER", true)}>Subtract MER fees</button>
                  <button className={!plan.includeMER ? "on" : ""} onClick={() => set("includeMER", false)}>Return is already net</button>
                </div>
                {plan.includeMER && (
                  <div className="pp-input-wrap" style={{ marginTop: 10, maxWidth: 220 }}><input id="f-customfee" className="pp-input" inputMode="decimal" value={plan.customFee}
                    onChange={(e) => { const raw = e.target.value.replace(/[^0-9.]/g, ""); set("customFee", raw); }} placeholder="e.g. 0.5" /><span className="pp-adorn r">% MER</span></div>
                )}
                <div className="pp-help">The preset Conservative/Moderate/Aggressive rates are treated as <em>net</em> long-run returns, so no fee is applied. Only your own custom rate can optionally have an MER subtracted.</div>
              </div>
            )}
            <div className="pp-help">Those percentages are illustrative long-run averages — real returns vary year to year and aren't guaranteed. You can change this anytime on your dashboard.</div>
          </div>
        </div>

        {/* 2 — Your goals */}
        <div className="pp-fs">
          <div className="pp-fs-head"><div className="pp-fs-num">2</div><h3>Your goals</h3></div>
          <p className="pp-fs-sub">This shapes your whole dashboard — your plan, your priorities, and what we track.</p>
          <label className="pp-label2">What are your goals right now? <span style={{ fontWeight: 600, color: "var(--muted)" }}>· pick any that apply</span></label>
          <div className="pp-goalgrid">
            {GOALS.map((g) => { const Ic = g.icon; const on = (plan.goals || []).includes(g.key); return (
              <button key={g.key} className={"pp-goalc" + (on ? " on" : "")} onClick={() => {
                const cur = plan.goals || [];
                const next = on ? cur.filter((k) => k !== g.key) : [...cur, g.key];
                set("goals", next.length ? next : ["retirement"]);
                if (g.key === "house") set("buyHome", !on ? true : plan.buyHome);
              }}>
                {on && <span className="pp-goalcheck"><Check size={13} /></span>}
                <Ic size={20} /><div className="nm">{g.name}</div><div className="ds">{g.blurb}</div>
              </button>
            ); })}
          </div>
          {(plan.goals || []).includes("number") && (
            <CurrencyField id="f-targetnum" label="Your target invested amount" placeholder="e.g. 100,000" value={plan.targetNumber} onChange={(v) => set("targetNumber", v)}
              help={<>We'll estimate when you'd reach it at your current pace.</>} />
          )}
          <div className="pp-row2" style={{ marginTop: 4 }}>
            <NumberField id="f-ret" label="What age do you expect to retire?" placeholder="65" value={plan.retAge} onChange={(v) => set("retAge", v)} suffix="years old" help={retHelp} />
            <CurrencyField id="f-retinc" label="Estimated retirement income (optional)" placeholder="e.g. 40,000" value={plan.retIncome} onChange={(v) => set("retIncome", v)}
              help={<>Your expected taxable income in retirement. Powers the <b>TFSA-vs-RRSP</b> comparison — leave blank to estimate it from a typical replacement rate.</>} />
          </div>
          <div className="pp-field">
            <label className="pp-label2">Are you saving for a first home?</label>
            <div className="pp-toggle">
              <button className={plan.buyHome ? "on" : ""} onClick={() => set("buyHome", true)}>Yes</button>
              <button className={!plan.buyHome ? "on" : ""} onClick={() => set("buyHome", false)}>Not right now</button>
            </div>
          </div>
          {plan.buyHome && (
            <div className="pp-row2">
              <NumberField id="f-homeage" label="By what age would you like to buy?" placeholder="e.g. 28" value={plan.homeAge} onChange={(v) => set("homeAge", v)} suffix="years old"
                help={yrsHome != null ? <>About <b>{yrsHome} years</b> to save a down payment{yrsHome <= 5 ? " — a short timeline usually means keeping that money safer." : " — enough time to let it grow a little."}</> : <>We'll mark this milestone on your projection.</>} />
              <CurrencyField id="f-homeprice" label="About how much will the home cost?" placeholder="e.g. 550,000" value={plan.homePrice} onChange={(v) => set("homePrice", v)}
                help={n(plan.homePrice) > 0 ? <>Minimum down payment in Canada: <b>{fmtMoney(minDownPayment(n(plan.homePrice)))}</b>{n(plan.homePrice) < 1500000 ? <> (or {fmtMoney(n(plan.homePrice) * 0.2)} to avoid CMHC insurance)</> : <> — 20% is required at this price</>}.</> : <>We'll work out your minimum down payment and track progress toward it.</>} />
            </div>
          )}
        </div>

        {/* 3 — Your money */}
        <div className="pp-fs">
          <div className="pp-fs-head"><div className="pp-fs-num">3</div><h3>Your money</h3></div>
          <p className="pp-fs-sub">What you can add, and what you've already invested.</p>
          <div className="pp-field">
            <label className="pp-label2" htmlFor="f-asof">Today's date</label>
            <input id="f-asof" type="date" className="pp-input" style={{ maxWidth: 230 }} value={plan.asOf || todayISO()} onChange={(e) => set("asOf", e.target.value)} />
            <div className="pp-help">We project forward from this date. If it's partway through the year, your first year only counts the months you have left — so nothing is calculated as if it were January 1st.</div>
          </div>
          <CurrencyField id="f-monthly" label="How much can you invest each month?" placeholder="e.g. 300" value={plan.monthly} onChange={(v) => set("monthly", v)}
            help={<>Your steady, recurring contribution — applied to every month, every year. {n(plan.monthly) > 0 && <>That's <b>{fmtMoney(n(plan.monthly) * 12)}</b> a year.</>}</>} />
          <CurrencyField id="f-lump" label="One-time lump sum to invest now (optional)" placeholder="e.g. 5,000" value={plan.lumpSum} onChange={(v) => set("lumpSum", v)}
            help={<>A single amount you can add today — a bonus, gift, or tax refund. It joins your starting balance and compounds from day one.</>} />
          <div className="pp-field">
            <label className="pp-label2">Do your monthly amounts vary?</label>
            <div className="pp-toggle">
              <button className={(plan.contribMode || "flat") === "flat" ? "on" : ""} onClick={() => set("contribMode", "flat")}>Same every month</button>
              <button className={plan.contribMode === "custom" ? "on" : ""} onClick={() => set("contribMode", "custom")}>Set each month</button>
            </div>
            <div className="pp-help">Pick “Set each month” to enter a different amount per month for <b>this year</b> — e.g. $1,000 in January, $300 the rest. Later years fall back to the recurring monthly amount above.</div>
          </div>
          {plan.contribMode === "custom" && (
            <div className="pp-months">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((mlab, mi) => {
                const past = mi < monthIndexOf(plan.asOf);
                return (
                  <div className={"pp-month" + (past ? " past" : "")} key={mi}>
                    <label htmlFor={"f-mo" + mi}>{mlab}{past ? " ·" : ""}</label>
                    <div className="pp-input-wrap"><span className="pp-adorn">$</span><input id={"f-mo" + mi} className="pp-input" inputMode="numeric" disabled={past}
                      value={(plan.months && (plan.months[mi] === "" || plan.months[mi] == null)) ? "" : Number(plan.months[mi]).toLocaleString("en-CA")}
                      onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ""); const arr = [...(plan.months || Array(12).fill(""))]; arr[mi] = raw === "" ? "" : Number(raw); set("months", arr); }} placeholder="0" /></div>
                  </div>
                );
              })}
              <div className="pp-month-total">Remaining this year: <b>{fmtMoney((plan.months || []).reduce((a, b, mi) => mi >= monthIndexOf(plan.asOf) ? a + n(b) : a, 0))}</b>{monthIndexOf(plan.asOf) > 0 && <span style={{ color: "var(--muted)", fontWeight: 600 }}> · earlier months have passed</span>}</div>
            </div>
          )}
          <label className="pp-label2" style={{ marginBottom: 6, marginTop: 4 }}>What's the current value of each account today?</label>
          <div className="pp-help" style={{ marginTop: 0, marginBottom: 10 }}>Today's market value — including growth, not just what you put in. (We track your <em>contributions</em> separately in Step 4 to work out remaining room.)</div>
          <div className="pp-grid-money">
            <CurrencyField id="f-btfsa" label="TFSA" placeholder="0" value={plan.bTfsa} onChange={(v) => set("bTfsa", v)} />
            <CurrencyField id="f-brrsp" label="RRSP" placeholder="0" value={plan.bRrsp} onChange={(v) => set("bRrsp", v)} />
            <CurrencyField id="f-bfhsa" label="FHSA" placeholder="0" value={plan.bFhsa} onChange={(v) => set("bFhsa", v)} />
          </div>
          <div className="pp-grid-money" style={{ marginTop: 10 }}>
            <CurrencyField id="f-bnonreg" label="Non-registered (taxable)" placeholder="0" value={plan.bNonreg} onChange={(v) => set("bNonreg", v)}
              help={<>A regular investment/brokerage account — no contribution limit, but growth is taxed.</>} />
            <CurrencyField id="f-blocked" label="Locked-in (LIRA / RPP / DPSP)" placeholder="0" value={plan.bLocked} onChange={(v) => set("bLocked", v)}
              help={<>Pension money in a LIRA or similar. You can't add to it, and it's taxed on withdrawal like an RRSP.</>} />
          </div>
          <div className="pp-help" style={{ marginTop: 4 }}>Zero is perfectly fine — we'll project growth from wherever you are today.</div>

          <div className="pp-field" style={{ marginTop: 20 }}>
            <label className="pp-label2">Do you have an emergency fund?</label>
            <div className="pp-seg2">
              <button className={plan.emergencyStatus === "full" ? "on" : ""} onClick={() => set("emergencyStatus", "full")}>Yes, fully</button>
              <button className={plan.emergencyStatus === "partial" ? "on" : ""} onClick={() => set("emergencyStatus", "partial")}>Partially</button>
              <button className={(plan.emergencyStatus || "none") === "none" ? "on" : ""} onClick={() => set("emergencyStatus", "none")}>Not yet</button>
            </div>
            <div className="pp-help">A cash cushion of essentials usually comes before serious investing — it's the foundation of the order of operations.</div>
          </div>
          {plan.emergencyStatus !== "full" && (
            <div className="pp-subcard">
              <p className="pp-sub-h">Let's size the right cushion for you.</p>
              <div className="pp-row2">
                <CurrencyField id="f-expenses" label="Your essential monthly expenses" placeholder="e.g. 2,500" value={plan.livingExpenses} onChange={(v) => set("livingExpenses", v)}
                  help={<>Rent or mortgage, food, utilities, transport, insurance, minimum debt payments — the must-pays only.</>} />
                <div className="pp-field">
                  <label className="pp-label2">How steady is your income?</label>
                  <div className="pp-seg2">
                    <button className={plan.incomeStability === "stable" ? "on" : ""} onClick={() => set("incomeStability", "stable")}>Very stable</button>
                    <button className={(plan.incomeStability || "variable") === "variable" ? "on" : ""} onClick={() => set("incomeStability", "variable")}>Somewhat variable</button>
                    <button className={plan.incomeStability === "risky" ? "on" : ""} onClick={() => set("incomeStability", "risky")}>Unpredictable</button>
                  </div>
                </div>
              </div>
              {plan.emergencyStatus === "partial" && (
                <CurrencyField id="f-efsaved" label="How much have you saved so far?" placeholder="e.g. 3,000" value={plan.emergencySaved} onChange={(v) => set("emergencySaved", v)}
                  help={<>We'll show how much more gets you to a full cushion.</>} />
              )}
              {n(plan.livingExpenses) > 0 && (() => { const ef = emergencyFundTarget(plan.livingExpenses, plan.incomeStability); const gap = Math.max(0, ef.amount - n(plan.emergencySaved)); return (
                <div className="pp-callout" style={{ marginBottom: 0 }}><Shield size={18} style={{ flex: "none" }} /><span>Aim for about <b>{fmtMoney(ef.amount)}</b> — roughly <b>{ef.months} months</b> of essentials.{plan.emergencyStatus === "partial" && n(plan.emergencySaved) > 0 ? <> You're <b>{fmtMoney(gap)}</b> away.</> : ""} Keep it in a high-interest savings account, separate from investing.</span></div>
              ); })()}
            </div>
          )}
          <div className="pp-row2" style={{ marginTop: 16 }}>
            <CurrencyField id="f-match" label="Employer RRSP match (per year, optional)" placeholder="e.g. 2,000" value={plan.employerMatch} onChange={(v) => set("employerMatch", v)}
              help={<>If your employer matches RRSP contributions, that's an instant ~100% return — your plan will put it near the top.</>} />
            <CurrencyField id="f-debt" label="High-interest debt (optional)" placeholder="e.g. 5,000" value={plan.highInterestDebt} onChange={(v) => set("highInterestDebt", v)}
              help={<>Credit cards or other debt above ~10%. Paying it off is a guaranteed, tax-free return — usually before investing.</>} />
          </div>
        </div>

        {/* 4 — Contribution room by account */}
        <div className="pp-fs">
          <div className="pp-fs-head"><div className="pp-fs-num">4</div><h3>Contribution room</h3></div>
          <p className="pp-fs-sub">Track how much room you have <em>left</em> in each account, and get over-contribution warnings. These are optional — except your FHSA open year, which is needed once you hold an FHSA.</p>

          <div className="pp-acctgroup">
            <h4><PiggyBank size={16} style={{ color: "var(--violet)" }} /> TFSA</h4>
            <div className="pp-row2">
              <NumberField id="f-birth" label="Birth year" placeholder="e.g. 1996" value={plan.birthYear} onChange={(v) => set("birthYear", v)}
                help={<>Sets your <b>cumulative TFSA room</b> since 2009 (room starts the year you turn 18).</>} />
              <CurrencyField id="f-tfsaused" label="TFSA contributed this year" placeholder="0" value={plan.tfsaUsed} onChange={(v) => set("tfsaUsed", v)} help={<>What you've put in during {TAX_YEAR}.</>} />
            </div>
          </div>

          <div className="pp-acctgroup">
            <h4><Landmark size={16} style={{ color: "var(--gold)" }} /> RRSP</h4>
            <div className="pp-row2">
              <CurrencyField id="f-rrspnoa" label="RRSP contribution room" placeholder="e.g. 12,000" value={plan.rrspLimitNOA} onChange={(v) => set("rrspLimitNOA", v)}
                help={<>From your latest <b>Notice of Assessment</b> — the CRA's summary after you file (also in CRA My Account under “RRSP,” shown as “RRSP deduction limit”). Blank = we estimate from income.</>} />
              <CurrencyField id="f-rrspused" label="RRSP contributed this year" placeholder="0" value={plan.rrspUsed} onChange={(v) => set("rrspUsed", v)} />
            </div>
          </div>

          <div className={"pp-acctgroup" + (n(plan.bFhsa) > 0 && !(n(plan.fhsaYearOpened) > 0) ? " need" : "")}>
            <h4><HomeIcon size={16} style={{ color: "var(--rose)" }} /> FHSA {n(plan.bFhsa) > 0 && <span className="pp-req">{n(plan.fhsaYearOpened) > 0 ? "open year set" : "open year required"}</span>}</h4>
            <div className="pp-row2">
              <NumberField id="f-fhsayear" label="What year did you open your FHSA?" placeholder="e.g. 2024" value={plan.fhsaYearOpened} onChange={(v) => set("fhsaYearOpened", v)}
                help={<>The year you <b>first opened</b> an FHSA at any bank. Your room and your 15-year closing deadline both start from it. Haven't opened one? Leave blank.</>} />
              <CurrencyField id="f-fhsalife" label="FHSA contributed (lifetime)" placeholder="0" value={plan.fhsaLifetimeUsed} onChange={(v) => set("fhsaLifetimeUsed", v)} help={<>Total ever contributed, toward the {fmtMoney(TAX_CONFIG.fhsa.lifetime)} cap.</>} />
            </div>
            <CurrencyField id="f-fhsayr" label="FHSA contributed this year" placeholder="0" value={plan.fhsaThisYearUsed} onChange={(v) => set("fhsaThisYearUsed", v)} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
          <button className="pp-btn pp-btn-primary" disabled={!ready} style={{ opacity: ready ? 1 : 0.45 }} onClick={() => ready && onDone()}>
            See my plan <ArrowRight size={18} />
          </button>
        </div>
        {!ready && <p style={{ textAlign: "right", fontSize: 12.5, color: "var(--muted)", marginTop: 8 }}>{n(plan.bFhsa) > 0 && !(n(plan.fhsaYearOpened) > 0) ? "Add the year you opened your FHSA (Step 4) to continue." : "Enter your age, a retirement age above it, and your province to continue."}</p>}
      </div>
    </div>
  );
}

/* ============================================================ PAYCHEQUE BREAKDOWN ============================================================ */
function PaycheckBreakdown({ tax, marginal }) {
  const g = Math.max(1, tax.gross);
  const cppLabel = tax.isQC ? "QPP / QPP2" : "CPP / CPP2";
  const rows = [
    { key: "net", label: "Net take-home", val: tax.net, color: "var(--violet)" },
    { key: "fed", label: "Federal tax", val: tax.fedTax, color: "var(--plum)" },
    { key: "prov", label: tax.isQC ? "Quebec tax" : "Provincial tax", val: tax.provTax, color: "var(--gold)" },
    { key: "cpp", label: cppLabel, val: tax.cppTotal, color: "var(--teal)" },
    ...(tax.ei > 0 ? [{ key: "ei", label: "EI premiums", val: tax.ei, color: "var(--blue)" }] : []),
    ...(tax.qpip > 0 ? [{ key: "qpip", label: "QPIP", val: tax.qpip, color: "var(--rose)" }] : []),
  ];
  return (
    <div>
      {/* stacked bar */}
      <div style={{ display: "flex", height: 30, borderRadius: 8, overflow: "hidden", marginBottom: 6 }} role="img" aria-label="Take-home pay versus deductions">
        {rows.map((r) => r.val > 0 && (
          <div key={r.key} title={`${r.label}: ${fmtMoney(r.val)}`} style={{ width: (r.val / g) * 100 + "%", background: r.color }} />
        ))}
      </div>
      <div className="pp-rates" style={{ marginTop: 14 }}>
        <div className="pp-rate-chip"><div className="l">Net take-home</div><div className="v">{fmtMoney(tax.net)}</div><div className="h">{fmtMoney(tax.netMonthly)}/mo</div></div>
        <div className="pp-rate-chip"><div className="l">Average tax rate</div><div className="v">{pct1(tax.avgRate)}</div><div className="h">income tax ÷ gross</div></div>
        <div className="pp-rate-chip"><div className="l">Marginal rate</div><div className="v">{pct1(marginal)}</div><div className="h">on your next dollar</div></div>
      </div>
      <table className="pp-taxtable" style={{ marginTop: 18 }}>
        <tbody>
          <tr><td><span className="pp-swatch" style={{ background: "var(--ink)" }} />Gross income</td><td>{fmtMoney(tax.gross)}</td></tr>
          <tr><td><span className="pp-swatch" style={{ background: "var(--teal)" }} />{cppLabel}{tax.selfEmployed ? " (both halves)" : ""}</td><td>−{fmtMoney(tax.cppTotal)}</td></tr>
          {tax.ei > 0 && <tr><td><span className="pp-swatch" style={{ background: "var(--blue)" }} />EI premiums</td><td>−{fmtMoney(tax.ei)}</td></tr>}
          {tax.qpip > 0 && <tr><td><span className="pp-swatch" style={{ background: "var(--rose)" }} />QPIP</td><td>−{fmtMoney(tax.qpip)}</td></tr>}
          <tr><td><span className="pp-swatch" style={{ background: "var(--plum)" }} />Federal income tax</td><td>−{fmtMoney(tax.fedTax)}</td></tr>
          <tr><td><span className="pp-swatch" style={{ background: "var(--gold)" }} />{tax.isQC ? "Quebec income tax" : "Provincial income tax"}</td><td>−{fmtMoney(tax.provTax)}</td></tr>
          <tr className="tot"><td><span className="pp-swatch" style={{ background: "var(--violet)" }} /><b>Net take-home pay</b></td><td><b>{fmtMoney(tax.net)}</b></td></tr>
        </tbody>
      </table>
      {tax.isQC && <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 10 }}>Quebec figures include QPP/QPP2, QPIP, Quebec provincial tax, and the 16.5% federal abatement applied to your federal tax.</p>}
    </div>
  );
}

/* ============================================================ PROJECTION CHART ============================================================ */
function GrowthChart({ series, scaleRef, contribSeries, years, startAge, startMonth, homeIdx, homeAge, fhsaIdx, color, inflation, afterTax, retMarginal, rrspShare }) {
  const W = 720, H = 332, PL = 56, PR = 18, PT = 34, PB = 34;
  const plotW = W - PL - PR, plotH = H - PT - PB;
  const [hover, setHover] = useState(null); // year index
  const lineColor = color || "var(--violet)";
  const taxFactor = afterTax ? (1 - (retMarginal || 0) * (rrspShare == null ? 1 : rrspShare)) : 1;
  const adj = (v, y) => { let x = v * taxFactor; if (inflation) x = x / Math.pow(1.02, y); return x; };
  const vals = (series || [0]).map((v, y) => adj(v, y));
  // Fixed y-axis: anchored to a reference (aggressive-rate) final so lowering the return visibly flattens the line.
  const refAdj = scaleRef ? adj(scaleRef, years) : 0;
  const max = Math.max(1, refAdj, ...vals);
  const X = (y) => PL + (years === 0 ? 0 : (y / years) * plotW);
  const Y = (v) => PT + plotH - (v / max) * plotH;
  const linePts = vals.map((v, y) => `${X(y)},${Y(v)}`).join(" ");
  const areaPts = `${PL},${PT + plotH} ` + linePts + ` ${X(years)},${PT + plotH}`;
  const gy = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const xticks = Array.from(new Set([0, Math.round(years / 2), years])).filter((t) => t >= 0 && t <= years).sort((a, b) => a - b);
  const fmtY = (v) => fmtShort(v);
  // markers: stagger labels vertically so Home and FHSA don't collide
  const showFhsa = fhsaIdx != null && fhsaIdx >= 0 && fhsaIdx <= years;
  const showHome = homeIdx != null && homeIdx >= 0 && homeIdx <= years;
  const markersClose = showFhsa && showHome && Math.abs(X(fhsaIdx) - X(homeIdx)) < 90;

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const fx = (cx / rect.width) * W; // back to viewBox units
    let yi = Math.round(((fx - PL) / plotW) * years);
    yi = Math.max(0, Math.min(years, yi));
    setHover(yi);
  };

  return (
    <div className="pp-chartwrap">
      <div className="pp-chartlegend"><span className="dot" style={{ background: lineColor }} /> Total projected value — all your accounts combined</div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", touchAction: "none" }} role="img" aria-label="Projected growth chart"
        onMouseMove={onMove} onMouseLeave={() => setHover(null)} onTouchStart={onMove} onTouchMove={onMove}>
        <defs><linearGradient id="ppArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={lineColor} stopOpacity="0.18" /><stop offset="100%" stopColor={lineColor} stopOpacity="0" /></linearGradient></defs>
        {gy.map((v, i) => (
          <g key={i}>
            <line x1={PL} y1={Y(v)} x2={W - PR} y2={Y(v)} stroke="rgba(34,19,48,0.10)" strokeWidth="1" />
            <text x={PL - 8} y={Y(v) + 4} textAnchor="end" fontSize="11" fill="#6E5E78" fontFamily="Hanken Grotesk">{fmtY(v)}</text>
          </g>
        ))}
        {showHome && (
          <g>
            <line x1={X(homeIdx)} y1={PT} x2={X(homeIdx)} y2={PT + plotH} stroke="#B0822B" strokeWidth="1.5" strokeDasharray="4 4" />
            <text x={X(homeIdx)} y={PT - 18} textAnchor="middle" fontSize="10.5" fill="#B0822B" fontWeight="700" fontFamily="Hanken Grotesk">Home · age {homeAge}</text>
          </g>
        )}
        {showFhsa && (
          <g>
            <line x1={X(fhsaIdx)} y1={PT} x2={X(fhsaIdx)} y2={PT + plotH} stroke="#A8456A" strokeWidth="1.5" strokeDasharray="2 3" />
            <text x={X(fhsaIdx)} y={markersClose ? PT - 4 : PT - 18} textAnchor="middle" fontSize="10.5" fill="#A8456A" fontWeight="700" fontFamily="Hanken Grotesk">FHSA closes</text>
          </g>
        )}
        <polygon points={areaPts} fill="url(#ppArea)" />
        <polyline points={linePts} fill="none" stroke={lineColor} strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={X(years)} cy={Y(vals[years])} r="4" fill={lineColor} />
        {hover != null && (
          <g>
            <line x1={X(hover)} y1={PT} x2={X(hover)} y2={PT + plotH} stroke={lineColor} strokeWidth="1" strokeOpacity="0.5" />
            <circle cx={X(hover)} cy={Y(vals[hover])} r="5.5" fill="#fff" stroke={lineColor} strokeWidth="2.5" />
          </g>
        )}
        {xticks.map((t) => (<text key={t} x={X(t)} y={H - 10} textAnchor="middle" fontSize="11" fill="#6E5E78" fontFamily="Hanken Grotesk">{t === 0 ? "Now" : `+${t}y`}</text>))}
      </svg>
      {hover != null && (
        <div className="pp-tip" style={{ left: (X(hover) / W) * 100 + "%", top: (Y(vals[hover]) / H) * 100 + "%" }}>
          <div className="ty">{hover === 0 ? "Now" : `+${hover} ${hover === 1 ? "year" : "years"}`}{startAge > 0 ? ` · age ${startAge + hover}` : ""}</div>
          <div className="tr"><i style={{ background: lineColor }} /> {fmtMoney(vals[hover])}</div>
          {contribSeries && contribSeries[hover] != null && (() => {
            const inv = contribSeries[hover] * taxFactor / (inflation ? Math.pow(1.02, hover) : 1);
            const grw = Math.max(0, vals[hover] - inv);
            return (<div className="tsub">Invested {fmtMoney(inv)} · Growth {fmtMoney(grw)}</div>);
          })()}
        </div>
      )}
    </div>
  );
}

/* ============================================================ DASHBOARD HELPERS ============================================================ */
function accounts(plan) {
  const income = n(plan.income);
  const TFSA = { key: "tfsa", name: "TFSA", num: fmtMoney(TAX_CONFIG.tfsa.annual), numLabel: `${TAX_YEAR} annual room`, bal: n(plan.bTfsa), why: "Tax-free growth and withdrawals, fully flexible. The default starting point for most Canadians." };
  const RRSP = { key: "rrsp", name: "RRSP", num: fmtMoney(TAX_CONFIG.rrsp.dollarMax), numLabel: `${TAX_YEAR} max (18% of income)`, bal: n(plan.bRrsp), why: "A tax deduction now, growing tax-deferred. Most powerful when today's tax rate beats your future one." };
  const FHSA = { key: "fhsa", name: "FHSA", num: fmtMoney(TAX_CONFIG.fhsa.annual), numLabel: `${TAX_YEAR} annual ($40k lifetime)`, bal: n(plan.bFhsa), why: "Deduction on the way in, tax-free on the way out for a first home — the best of both worlds." };
  let recs;
  if (plan.buyHome) recs = income >= 75000 ? [FHSA, RRSP, TFSA] : [FHSA, TFSA];
  else if (income >= 75000) recs = [RRSP, TFSA];
  else { recs = [TFSA]; if (n(plan.age) > 0 && n(plan.age) <= 35) recs.push(FHSA); recs.push(RRSP); }
  return recs.slice(0, 3);
}
function insights(plan, marginal) {
  const good = [], watch = [];
  const age = n(plan.age), retAge = n(plan.retAge), monthly = n(plan.monthly), income = n(plan.income);
  const horizon = retAge - age;
  const customSum = (plan.contribMode === "custom" && plan.months) ? plan.months.reduce((a, b) => a + n(b), 0) : 0;
  const annual = plan.contribMode === "custom" ? customSum : monthly * 12;
  const lump = n(plan.lumpSum);
  const investingNow = annual > 0 || lump > 0;
  const totalBal = n(plan.bTfsa) + n(plan.bRrsp) + n(plan.bFhsa);
  if (age > 0 && age <= 30) good.push("Starting young is the single biggest advantage in investing — time does most of the heavy lifting.");
  if (horizon >= 25) good.push(`A ${horizon}-year horizon gives compounding real room to work and smooths out short-term dips.`);
  if (annual > 0) good.push(`Investing consistently — about ${fmtMoney(annual)} a year — is exactly the habit that builds wealth.`);
  if (lump > 0) good.push(`Putting ${fmtMoney(lump)} in as a lump sum gives it the most time to compound.`);
  if (totalBal > 0) good.push(`You've already started with ${fmtMoney(totalBal)} invested. Momentum matters.`);
  if (plan.emergencyStatus === "full") good.push("Having an emergency fund first means you won't be forced to sell investments at a bad time.");
  if (marginal >= 0.40) good.push(`At a ${pct1(marginal)} marginal rate, the RRSP deduction is especially valuable for you right now.`);
  if (!investingNow) watch.push("You haven't set any contributions yet. Even a small regular amount dramatically changes the long-term picture — try the controls below.");
  if (plan.emergencyStatus !== "full") watch.push("Your emergency fund isn't full yet — a cash cushion usually comes before heavy investing, so a rough month doesn't derail your plan.");
  if (annual > 7000 && income < 75000 && !plan.buyHome) watch.push(`Your ${fmtMoney(annual)}/yr exceeds the ${fmtMoney(TAX_CONFIG.tfsa.annual)} TFSA room — see how RRSP or FHSA room can absorb the rest tax-efficiently.`);
  if (horizon > 0 && horizon < 10) watch.push("Your horizon is fairly short, so be deliberate about risk — capacity matters as much as appetite.");
  if (plan.buyHome && n(plan.homeAge) - age <= 5 && n(plan.homeAge) > age) watch.push("Your home purchase is close — money you'll need soon usually belongs in safer, accessible options.");
  return { good, watch };
}
const LADDER = [
  { t: "Starter emergency fund", d: "A small cushion ($1,000–$2,000) so a surprise doesn't become debt." },
  { t: "Capture any employer RRSP match", d: "Free money — contribute enough to get the full match first." },
  { t: "Pay down high-interest debt", d: "Clearing 19%+ debt is a guaranteed, tax-free return." },
  { t: "Full emergency fund", d: "Top up to 3–6 months of essential expenses." },
  { t: "Fill tax-advantaged room", d: "FHSA / TFSA / RRSP, in the order that fits your goals and bracket." },
  { t: "Non-registered investing", d: "Once registered room is full, taxable accounts take over." },
];
const GOALS = [
  { key: "house", name: "Buy a home", icon: HomeIcon, blurb: "Save a down payment, tax-efficiently." },
  { key: "retirement", name: "Retire comfortably", icon: Landmark, blurb: "Build long-term, tax-advantaged wealth." },
  { key: "fi", name: "Financial independence", icon: TrendingUp, blurb: "Reach the point where work is optional." },
  { key: "number", name: "Hit a target number", icon: Coins, blurb: "Grow to a specific invested amount." },
];

/* ============================================================ RECOMMENDATION ENGINE (decision layer) ============================================================ */
const HBP_LIMIT = 60000; // Home Buyers' Plan withdrawal limit (raised to $60k in 2024)
function annualInvestable(plan) {
  const custom = plan.contribMode === "custom" && plan.months;
  return custom ? plan.months.reduce((a, b) => a + n(b), 0) : n(plan.monthly) * 12;
}
function allocate(pool, order, caps) {
  const a = { tfsa: 0, rrsp: 0, fhsa: 0, taxable: 0 };
  let left = pool;
  for (const acct of order) { if (left <= 0) break; const cap = caps[acct] == null ? Infinity : caps[acct]; const put = Math.max(0, Math.min(left, cap)); a[acct] += put; left -= put; }
  if (left > 0) a.taxable += left;
  return a;
}
function balancedAlloc(pool, caps) {
  const a = { tfsa: 0, rrsp: 0, fhsa: 0, taxable: 0 };
  const half = pool / 2;
  a.tfsa = Math.min(half, caps.tfsa); a.rrsp = Math.min(half, caps.rrsp);
  let left = pool - a.tfsa - a.rrsp;
  if (left > 0) { const x = Math.min(left, caps.tfsa - a.tfsa); a.tfsa += x; left -= x; }
  if (left > 0) { const x = Math.min(left, caps.rrsp - a.rrsp); a.rrsp += x; left -= x; }
  if (left > 0) a.taxable += left;
  return a;
}
function recommendOrder(goal, buyHome, marginal) {
  const high = marginal >= 0.30;
  if (buyHome || goal === "house") return high ? ["fhsa", "rrsp", "tfsa"] : ["fhsa", "tfsa", "rrsp"];
  return high ? ["rrsp", "tfsa", "fhsa"] : ["tfsa", "rrsp", "fhsa"];
}
function simulateStrategy(order, ctx, mode) {
  const { years, r, income, marginal, retMarginal, startTfsa, startRrsp, startFhsa, annualInvest, homeIdx, eligFhsa } = ctx;
  let bal = { tfsa: startTfsa, rrsp: startRrsp, fhsa: startFhsa, taxable: 0 };
  let fhsaContrib = 0, refundYr1 = 0, downAtHome = null, lastRefund = 0, yr1 = null;
  const rrspAnnual = Math.min(TAX_CONFIG.rrsp.dollarMax, Math.max(3000, income * 0.18));
  for (let y = 0; y < Math.max(1, years); y++) {
    const pool = annualInvest + (y > 0 ? lastRefund : 0);
    const fhsaCap = eligFhsa ? Math.min(TAX_CONFIG.fhsa.annual, Math.max(0, TAX_CONFIG.fhsa.lifetime - fhsaContrib)) : 0;
    const caps = { fhsa: fhsaCap, tfsa: TAX_CONFIG.tfsa.annual, rrsp: rrspAnnual };
    const alloc = mode === "balanced" ? balancedAlloc(pool, caps) : allocate(pool, order, caps);
    if (y === 0) yr1 = alloc;
    bal.tfsa += alloc.tfsa; bal.rrsp += alloc.rrsp; bal.fhsa += alloc.fhsa; bal.taxable += alloc.taxable;
    fhsaContrib += alloc.fhsa;
    const refund = (alloc.rrsp + alloc.fhsa) * marginal;
    if (y === 0) refundYr1 = refund;
    lastRefund = refund;
    bal.tfsa *= (1 + r); bal.rrsp *= (1 + r); bal.fhsa *= (1 + r); bal.taxable *= (1 + r);
    if (homeIdx != null && (y + 1) === homeIdx) downAtHome = bal.fhsa + bal.tfsa + Math.min(bal.rrsp, HBP_LIMIT);
  }
  const gross = bal.tfsa + bal.rrsp + bal.fhsa + bal.taxable;
  const afterTax = bal.tfsa + bal.fhsa + bal.taxable + bal.rrsp * (1 - retMarginal);
  return { gross, afterTax, refundYr1, downAtHome, bal, yr1 };
}
function fiTarget(annualSpend) { return { number: Math.max(0, annualSpend) * 25, swr: 0.04 }; }
function yearsToTarget(target, r, startTotal, annualInvest) {
  if (target <= 0) return 0;
  let bal = startTotal;
  for (let y = 0; y <= 70; y++) { if (bal >= target) return y; bal = bal * (1 + r) + annualInvest; }
  return null;
}
function healthScore(ctx) {
  const { hasEmergency, income, annualInvest, buyHome, marginal, projRetIncome, targetSpend, downProj, downNeed } = ctx;
  const clamp = (x) => Math.max(0, Math.min(10, Math.round(x)));
  const parts = [];
  parts.push({ key: "ef", label: "Emergency fund", score: hasEmergency ? 10 : 2, tip: hasEmergency ? "Funded — a solid foundation." : "Build 3–6 months of essentials before investing heavily." });
  const sr = income > 0 ? annualInvest / income : 0;
  parts.push({ key: "sr", label: "Savings rate", score: clamp((sr / 0.20) * 10), tip: sr >= 0.15 ? `Strong — you're investing ${pct1(sr)} of income.` : `Investing ~${pct1(sr)} of income; aiming for 15–20% accelerates every goal.` });
  let te = 5; if (annualInvest > 0) te += 3; if (buyHome) te += 2; if (marginal >= 0.40 && annualInvest > 0) te += 0; te = Math.max(3, Math.min(10, te));
  parts.push({ key: "te", label: "Tax efficiency", score: te, tip: marginal >= 0.30 ? "At your bracket, prioritizing RRSP/FHSA deductions captures the most tax." : "Your bracket is moderate — the TFSA is often the efficient first home for savings." });
  const rp = targetSpend > 0 ? clamp((projRetIncome / targetSpend) * 10) : 5;
  parts.push({ key: "ret", label: "Retirement progress", score: rp, tip: rp >= 8 ? "On track to replace your target income." : "Raising contributions or time in market lifts this most." });
  if (buyHome && downNeed > 0) parts.push({ key: "home", label: "Home readiness", score: clamp((downProj / downNeed) * 10), tip: (downProj >= downNeed) ? "On pace for your minimum down payment." : "More monthly savings or a later target date closes the gap." });
  const overall = Math.round(parts.reduce((a, p) => a + p.score, 0) / parts.length * 10);
  return { overall, parts };
}


/* ============================================================ DASHBOARD ============================================================ */
function Dashboard({ plan, setPlan, go, edit }) {
  const age = n(plan.age), retAgeRaw = Math.max(age + 1, n(plan.retAge) || 65);
  const income = n(plan.income);
  const prov = plan.province || "ON";
  const empType = plan.employmentType || "employed";
  const lumpSum = n(plan.lumpSum);
  const startBal = n(plan.bTfsa) + n(plan.bRrsp) + n(plan.bFhsa) + n(plan.bNonreg) + n(plan.bLocked);
  const start = startBal + lumpSum;
  const monthsArr = plan.contribMode === "custom" ? (plan.months || null) : null;
  // emergency fund status (3-state)
  const emergencyFull = plan.emergencyStatus === "full";
  const emergencySaved = n(plan.emergencySaved);
  // goals (multi-select) + a primary for ordering
  const goals = (plan.goals && plan.goals.length) ? plan.goals : ["retirement"];
  const goal = goals.includes("house") ? "house" : goals.includes("fi") ? "fi" : goals.includes("number") ? "number" : "retirement";
  const buyingHome = plan.buyHome || goals.includes("house");

  // tax picture (actual income)
  const tax = useMemo(() => taxEngine(income, prov, empType), [income, prov, empType]);
  const marginal = useMemo(() => (income > 0 ? marginalRate(income, prov, empType) : 0), [income, prov, empType]);
  const brk = useMemo(() => (income > 0 ? bracketInfo(income, prov, empType) : null), [income, prov, empType]);

  // what-if controls (default to plan values; editable by slider OR typed input)
  const [monthly, setMonthly] = useState(n(plan.monthly));
  const [retAge, setRetAge] = useState(retAgeRaw);
  const [ret, setRet] = useState(planRate(plan));
  const fee = (plan.risk === "custom" && plan.includeMER) ? Math.max(0, n(plan.customFee) / 100) : 0;
  const [inflation, setInflation] = useState(false);
  const [afterTax, setAfterTax] = useState(false);

  // planned contributions for the tax-savings calculator (typed)
  const rrspLimit = n(plan.rrspLimitNOA) > 0 ? n(plan.rrspLimitNOA) : rrspEstimatedLimit(income);
  const [rrspPlan, setRrspPlan] = useState(() => Math.round(Math.min(6000, Math.max(0, rrspLimit))));
  const [fhsaPlan, setFhsaPlan] = useState(TAX_CONFIG.fhsa.annual);

  const startMonth = monthIndexOf(plan.asOf);
  const years = Math.max(1, retAge - age);
  const sel = plan.risk === "custom" ? { name: "custom", ret } : riskBy(plan.risk);
  const selSeries = projectSeries(ret - fee, years, start, monthly, monthsArr, startMonth);
  const selFinal = selSeries[selSeries.length - 1];
  const contribSeries = contributedSeries(years, start, monthly, monthsArr, startMonth);
  const finals = Object.fromEntries(RISK.map((r) => [r.key, projectFinal(r.ret - fee, years, start, monthly, monthsArr, startMonth)]));
  const contributed = totalContributed(years, start, monthly, monthsArr, startMonth);
  const growth = Math.max(0, selFinal - contributed);
  const hasData = start > 0 || monthly > 0 || (monthsArr && monthsArr.some((m) => n(m) > 0));

  // fixed y-axis anchor so changing the return visibly flattens/steepens the line instead of only relabelling the axis.
  // Anchored to the aggressive (10%) projection; the chart still maxes with the live line so a higher custom rate never clips.
  const scaleRef = projectFinal(0.10, years, start, monthly, monthsArr, startMonth);
  // RRSP-like (taxed-on-withdrawal) share of starting balances — used so the "after-tax" view taxes only that money
  const rrspShare = startBal > 0 ? (n(plan.bRrsp) + n(plan.bLocked)) / startBal : 0;

  // cost of waiting 5 years (same monthly, shorter horizon)
  const waitYears = 5;
  const costOfWaiting = years > waitYears ? selFinal - projectFinal(ret - fee, years - waitYears, start, monthly, monthsArr, startMonth) : 0;

  const homeAge = n(plan.homeAge);
  const homeIdx = plan.buyHome && homeAge > age && homeAge < retAge ? homeAge - age : null;
  const homeValue = homeIdx != null ? selSeries[Math.min(homeIdx, selSeries.length - 1)] : null;
  // home goal
  const homePrice = n(plan.homePrice);
  const homeDown = minDownPayment(homePrice);
  const homeProjAtBuy = (plan.buyHome && homePrice > 0 && homeIdx != null) ? selSeries[Math.min(homeIdx, selSeries.length - 1)] : null;
  const homeGap = homeProjAtBuy != null ? homeDown - homeProjAtBuy : null;

  // FHSA deadline
  const fhsaDl = fhsaDeadline(n(plan.fhsaYearOpened));
  const age71Year = age > 0 ? TAX_YEAR + (TAX_CONFIG.fhsa.closeAge - age) : null;
  let fhsaEffYearsLeft = null, fhsaCloseYear = null;
  if (fhsaDl) {
    fhsaCloseYear = fhsaDl.closeBy;
    if (age71Year != null) fhsaCloseYear = Math.min(fhsaCloseYear, age71Year);
    fhsaEffYearsLeft = fhsaCloseYear - TAX_YEAR;
  }
  const fhsaIdx = fhsaCloseYear != null ? fhsaCloseYear - TAX_YEAR : null;
  // age at which an FHSA must close (from inputs): 15 yrs after opening, or age 71 — whichever first.
  // If not opened, assume opening this year. Capped at the 71 rule.
  const fhsaOpenYr = n(plan.fhsaYearOpened) > 0 ? n(plan.fhsaYearOpened) : TAX_YEAR;
  const fhsaForceCloseYear = Math.min(fhsaOpenYr + TAX_CONFIG.fhsa.participationYears, age71Year != null ? age71Year : fhsaOpenYr + TAX_CONFIG.fhsa.participationYears);
  const fhsaCloseAge = age > 0 ? age + Math.max(0, fhsaForceCloseYear - TAX_YEAR) : null;

  // retirement income estimate for TFSA-vs-RRSP and opportunity cost.
  // Default = rough government benefits (CPP+OAS) + a 4% draw on the projected nest egg, which is far more realistic
  // than a flat % of salary (a high earner doesn't keep a top-bracket income in retirement). Always user-editable.
  const GOV_BENEFITS = 21000; // ~CPP + OAS, rough single-person estimate
  const retIncomeEst = Math.round(GOV_BENEFITS + 0.04 * selFinal);
  const retIncome = n(plan.retIncome) > 0 ? n(plan.retIncome) : Math.max(GOV_BENEFITS, retIncomeEst);
  const retMarginalAuto = retIncome > 0 ? retirementMarginal(retIncome, prov) : 0;
  // user can override the retirement tax rate; otherwise we use the estimate derived from expected retirement income
  const retMarginal = n(plan.retTaxRate) > 0 ? Math.min(0.6, n(plan.retTaxRate) / 100) : retMarginalAuto;
  // apply the same view toggles (inflation, after-tax-on-RRSP-share) used by the chart, for a consistent headline + scenario cards
  const dispVal = (v) => { let x = afterTax ? v * (1 - retMarginal * rrspShare) : v; if (inflation) x = x / Math.pow(1.02, years); return x; };

  /* ---------- DECISION ENGINE ---------- */
  const annInv = annualInvestable(plan);
  const matchAmt = n(plan.employerMatch);
  const debt = n(plan.highInterestDebt);
  const simCtx = { years, r: ret - fee, income, marginal, retMarginal, startTfsa: n(plan.bTfsa), startRrsp: n(plan.bRrsp) + n(plan.bLocked), startFhsa: n(plan.bFhsa), annualInvest: annInv, homeIdx, eligFhsa: buyingHome };
  const recOrder = recommendOrder(goal, buyingHome, marginal);
  const recSim = simulateStrategy(recOrder, simCtx);
  // strategy menu
  const ACCT_NAME = { fhsa: "FHSA", tfsa: "TFSA", rrsp: "RRSP", taxable: "Taxable" };
  const stratList = [];
  if (buyingHome) stratList.push({ key: "home", name: "Home-first (FHSA)", order: ["fhsa", "tfsa", "rrsp"], goodIf: ["Buying a first home", "Want tax-free home savings", "Deduction now + tax-free out"], trade: "FHSA must go to a home (or roll to RRSP) within 15 years." });
  stratList.push({ key: "rrsp", name: "RRSP-first", order: ["rrsp", "tfsa", "fhsa"], goodIf: ["Higher tax bracket today", "Retirement is the priority", "Expect a lower rate later"], trade: "Less liquid; withdrawals are taxed as income." });
  stratList.push({ key: "tfsa", name: "TFSA-first", order: ["tfsa", "fhsa", "rrsp"], goodIf: ["Want maximum flexibility", "Unsure about big plans", "Expect income to rise"], trade: "No tax deduction today." });
  if (!buyingHome) stratList.push({ key: "bal", name: "Balanced split", order: null, mode: "balanced", goodIf: ["Want some of both", "Hedge today vs. later rates", "Flexibility + tax savings"], trade: "Neither benefit is maximized." });
  const strats = stratList.map((s) => ({ ...s, sim: simulateStrategy(s.order, { ...simCtx, eligFhsa: buyingHome }, s.mode) }));
  const recKey = (buyingHome ? "home" : (marginal >= 0.30 ? "rrsp" : "tfsa"));

  // ---- Opportunity cost of the next $10,000 (net, after-tax, with the refund reinvested) ----
  const oppAmt = 10000;
  const mGrow = (yrs) => Math.pow(1 + (ret - fee) / 12, Math.max(0, yrs) * 12);
  const gRet = mGrow(years);
  const refundNow = oppAmt * marginal;            // RRSP/FHSA deduction value today
  const refundGrownRet = refundNow * gRet;        // if that refund is itself invested (tax-free) to retirement
  const oppRows = [
    { key: "tfsa", name: "TFSA", taxNow: 0, horizonY: years, gross: oppAmt * gRet, wTaxRate: 0, net: oppAmt * gRet, withdrawal: "None — tax-free" },
    { key: "rrsp", name: "RRSP", taxNow: refundNow, horizonY: years, gross: oppAmt * gRet, wTaxRate: retMarginal, net: oppAmt * gRet * (1 - retMarginal) + refundGrownRet, withdrawal: `Taxed ~${pct1(retMarginal)}` },
  ];
  // FHSA can't be held to retirement — it's forced to close. Show the row but blank the @retirement value.
  if (buyingHome) {
    oppRows.push({ key: "fhsa", name: "FHSA", taxNow: refundNow, closes: true, closeAge: fhsaCloseAge, gross: null, wTaxRate: 0, net: null, withdrawal: "None — for a home" });
  }
  const oppNetRows = oppRows.filter((r) => r.net != null);
  const oppBest = oppNetRows.reduce((a, b) => (b.net > a.net ? b : a), oppNetRows[0]);

  // goal metrics
  // desired retirement spending ("comfortable income") — your stated figure, else ~70% of current income.
  // NOT your essential expenses (those size the emergency fund and are far lower than a comfortable lifestyle).
  const annualSpend = n(plan.retIncome) > 0 ? n(plan.retIncome) : (income > 0 ? Math.round(income * 0.7) : 0);
  const fi = fiTarget(annualSpend);
  const fiYrs = yearsToTarget(fi.number, ret - fee, start, annInv);
  const targetNumber = n(plan.targetNumber);
  const numYrs = targetNumber > 0 ? yearsToTarget(targetNumber, ret - fee, start, annInv) : null;

  // financial health score (goal-aware)
  const downNeed = buyingHome ? (n(plan.homePrice) > 0 ? minDownPayment(n(plan.homePrice)) : 0) : 0;
  const health = healthScore({ hasEmergency: emergencyFull, income, annualInvest: annInv, buyHome: buyingHome, marginal, projRetIncome: recSim.afterTax * 0.04, targetSpend: annualSpend, downProj: recSim.downAtHome || 0, downNeed });
  const scoreColor = (s) => s >= 7 ? "var(--green)" : s >= 4 ? "var(--gold)" : "var(--rose)";
  // progress toward each selected goal (0–1)
  const goalProgress = (k) => {
    if (k === "house") return downNeed > 0 ? Math.min(1, (recSim.downAtHome || 0) / downNeed) : null;
    if (k === "fi") return fi.number > 0 ? Math.min(1, (recSim.afterTax) / fi.number) : null;
    if (k === "number") return targetNumber > 0 ? Math.min(1, selFinal / targetNumber) : null;
    return annualSpend > 0 ? Math.min(1, (recSim.afterTax * 0.04) / annualSpend) : null;
  };

  // next-dollar action plan
  const efTargetAmt = n(plan.livingExpenses) > 0 ? emergencyFundTarget(plan.livingExpenses, plan.incomeStability).amount : 0;
  const efGap = Math.max(0, efTargetAmt - emergencySaved);
  const nextSteps = [];
  nextSteps.push({ key: "ef", label: "Emergency fund", amount: emergencyFull ? 0 : efGap, done: emergencyFull, note: emergencyFull ? "Fully funded — a solid foundation." : (efGap > 0 ? `${fmtMoney(efGap)} more gets you to ~${fmtMoney(efTargetAmt)} in a high-interest savings account.` : (efTargetAmt > 0 ? `Build ${fmtMoney(efTargetAmt)} in a high-interest savings account.` : "A 3–6 month cushion in cash, before investing.")) });
  if (matchAmt > 0) nextSteps.push({ key: "match", label: "Capture your employer RRSP match", amount: matchAmt, done: false, note: `Contribute enough to collect the full ${fmtMoney(matchAmt)} — an instant ~100% return.` });
  if (debt > 0) nextSteps.push({ key: "debt", label: "Clear high-interest debt", amount: debt, done: false, note: `Paying off ${fmtMoney(debt)} of high-interest debt is a guaranteed, tax-free return.` });
  const recYr1 = recSim.yr1 || { fhsa: 0, tfsa: 0, rrsp: 0, taxable: 0 };
  const recCaps = { fhsa: buyingHome ? TAX_CONFIG.fhsa.annual : 0, tfsa: TAX_CONFIG.tfsa.annual, rrsp: Math.min(TAX_CONFIG.rrsp.dollarMax, Math.max(3000, income * 0.18)) };
  recOrder.forEach((acct) => { if (recYr1[acct] > 0) nextSteps.push({ key: acct, label: `${ACCT_NAME[acct]} contribution`, amount: recYr1[acct], cap: recCaps[acct], done: false, note: acct === "fhsa" ? "Deduction now, tax-free for a first home." : acct === "rrsp" ? "Deductible now; taxed on withdrawal in retirement." : "Tax-free growth and fully flexible withdrawals." }); });
  if (recYr1.taxable > 0) nextSteps.push({ key: "taxable", label: "Non-registered investing", amount: recYr1.taxable, done: false, note: "Once registered room is full, a taxable account takes over." });
  const firstTodo = nextSteps.findIndex((s) => !s.done);



  // tax savings
  const rrspSaving = income > 0 && rrspPlan > 0 ? deductionSaving(income, prov, empType, rrspPlan) : 0;
  const fhsaSaving = income > 0 && fhsaPlan > 0 ? deductionSaving(income, prov, empType, fhsaPlan) : 0;

  // room
  const tfsaCum = tfsaCumulativeRoom(n(plan.birthYear));
  const tfsaUsed = n(plan.tfsaUsed);
  const tfsaAnnualLeft = Math.max(0, TAX_CONFIG.tfsa.annual - tfsaUsed);
  const tfsaLifeLeft = Math.max(0, tfsaCum - n(plan.bTfsa));
  const rrspUsed = n(plan.rrspUsed);
  const rrspLeft = Math.max(0, rrspLimit - rrspUsed);
  const rrspOver = rrspUsed - rrspLimit > TAX_CONFIG.rrsp.overBuffer;
  const fhsaRoom = fhsaRoomInfo(n(plan.fhsaYearOpened), plan.fhsaLifetimeUsed);
  const fhsaLifeUsed = fhsaRoom.used;
  const fhsaLifeLeft = fhsaRoom.available;
  const fhsaYrUsed = n(plan.fhsaThisYearUsed);
  const fhsaYrLeft = Math.max(0, fhsaRoom.thisYearRoom - fhsaYrUsed);
  const fhsaLifeOver = fhsaLifeUsed > TAX_CONFIG.fhsa.lifetime;
  const fhsaYrOver = fhsaYrUsed > TAX_CONFIG.fhsa.maxYear;

  const accts = accounts(plan);
  const ins = insights(plan, marginal);
  const focusRung = !emergencyFull ? 0 : 4;
  const print = () => window.print();

  const Bar = ({ used, total, color }) => {
    const pu = total > 0 ? Math.min(100, (used / total) * 100) : 0;
    return (<div className="pp-room-bar"><i style={{ width: pu + "%", background: color }} /><i style={{ width: (100 - pu) + "%", background: "transparent" }} /></div>);
  };

  return (
    <div className="pp-wrap pp-section">
      <button className="pp-back pp-noprint" onClick={edit}><ArrowLeft size={16} /> Edit my numbers</button>

      {/* print-only header */}
      <div className="pp-printonly" style={{ marginBottom: 12 }}><b style={{ fontFamily: "var(--display)", fontSize: 20 }}>Purple Portfolio — your {TAX_YEAR} summary</b><div style={{ fontSize: 12, color: "#555" }}>Educational estimates only · {TAX_CONFIG.prov[prov].name}</div></div>

      {/* Head */}
      <div className="pp-dash-head" style={{ marginTop: 12 }}>
        <span className="pp-eyebrow"><Sparkles size={14} /> Your projection</span>
        {hasData ? (
          <>
            <div className="big">{fmtMoney(dispVal(selFinal))}</div>
            <div className="cap">Projected by age {retAge} ({years} years) on your <b style={{ color: "var(--gold-2)" }}>{sel.name.toLowerCase()}</b> path{fee > 0 ? `, after ~${pct1(fee)} fees` : ""}{inflation ? ", in today's dollars" : ""}{afterTax ? ", after estimated retirement tax" : ""}.</div>
            <div className="pp-scn">
              {RISK.map((r) => (
                <div className="pp-scnc" key={r.key}><div className="lab" style={{ color: r.key === plan.risk ? "var(--gold-2)" : undefined }}>{r.name} <span style={{ fontWeight: 600, opacity: 0.7 }}>· {Math.round(r.ret * 100)}%/yr</span></div><div className="val">{fmtMoney(dispVal(finals[r.key]))}</div></div>
              ))}
            </div>
          </>
        ) : (
          <><div className="big" style={{ fontSize: 28 }}>Add a contribution to see your future</div><div className="cap">Use the sliders below, or edit your numbers, and your projection will appear here.</div></>
        )}
      </div>

      {/* SNAPSHOT + NAV */}
      <div className="pp-snap">
        {hasData && <div className="pp-snapc"><div className="l">Projected total</div><div className="v">{fmtMoney(dispVal(selFinal))}</div><div className="h">by age {retAge}</div></div>}
        {income > 0 && <div className="pp-snapc"><div className="l">Take-home pay</div><div className="v">{fmtMoney(tax.netMonthly)}</div><div className="h">per month, after tax</div></div>}
        {income > 0 && <div className="pp-snapc"><div className="l">Marginal rate</div><div className="v">{pct1(marginal)}</div><div className="h">on your next dollar</div></div>}
        <div className="pp-snapc"><div className="l">Next priority</div><div className="v" style={{ fontSize: 16, lineHeight: 1.2 }}>{firstTodo >= 0 && nextSteps[firstTodo] ? nextSteps[firstTodo].label : "Keep investing"}</div><div className="h">{firstTodo >= 0 && nextSteps[firstTodo] && nextSteps[firstTodo].amount > 0 ? fmtMoney(nextSteps[firstTodo].amount) + (nextSteps[firstTodo].key === "ef" || nextSteps[firstTodo].key === "debt" || nextSteps[firstTodo].key === "match" ? "" : "/yr") : "your action plan below"}</div></div>
      </div>
      <nav className="pp-nav pp-noprint" aria-label="Jump to section">
        {[["sec-plan", "Action plan"], ["sec-compare", "Compare strategies"], ["sec-goal", "Goal"], ...(income > 0 ? [["sec-pay", "Paycheque"], ["sec-tax", "Tax savings"], ["sec-vs", "TFSA vs RRSP"]] : []), ["sec-room", "Room"], ...(hasData ? [["sec-grow", "Growth"]] : []), ["sec-accounts", "Accounts"]].map(([id, label]) => (
          <button key={id} type="button" onClick={() => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }}>{label}</button>
        ))}
      </nav>

      <div style={{ height: 14 }} />
      <Disclaimer />

      {/* YOUR NEXT DOLLAR — action plan */}
      <div id="sec-plan" style={{ marginTop: 32 }}>
        <span className="pp-eyebrow"><ListOrdered size={14} /> Your action plan</span>
        <h3 className="pp-sec-h">What to do with your next dollar</h3>
        <p className="pp-sec-lead">A personalised priority order for your {goal === "house" ? "home" : goal === "fi" ? "financial-independence" : goal === "number" ? "target" : "retirement"} goal, your {pct1(marginal)} tax bracket{buyingHome ? ", and your home plans" : ""}. Fund each step, then move to the next.</p>
        <div className="pp-plan">
          {nextSteps.map((s, i) => (
            <div className={"pp-step" + (i === firstTodo ? " now" : s.done ? " done" : "")} key={s.key}>
              <div className="pp-step-ic">{s.done ? <Check size={16} /> : i + 1}</div>
              <div className="pp-step-b">
                <h4>{s.label} {s.amount > 0 && <span className="amt">{s.key === "ef" || s.key === "debt" || s.key === "match" ? fmtMoney(s.amount) : fmtMoney(s.amount) + "/yr"}</span>}
                  {i === firstTodo && <span className="pp-step-tag">Start here</span>}
                  {s.done && <span className="pp-step-tag ok">Done</span>}</h4>
                <p>{s.note}</p>
                {s.cap > 0 && <><div className="pp-pbar"><i style={{ width: Math.min(100, (s.amount / s.cap) * 100) + "%" }} /></div></>}
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 12 }}>This is a widely used Canadian priority framework applied to your inputs — a strong default, not personal advice. Your situation may justify a different order.</p>
      </div>

      {/* COMPARE STRATEGIES */}
      <div id="sec-compare" style={{ marginTop: 34 }}>
        <span className="pp-eyebrow"><Scale size={14} /> Compare strategies</span>
        <h3 className="pp-sec-h">Your recommended path — and how the alternatives stack up</h3>
        {annInv > 0 ? (() => {
          const recS = strats.find((s) => s.key === recKey) || strats[0];
          const bestRetire = Math.max(...strats.map((s) => s.sim.afterTax));
          const bestDown = buyingHome ? Math.max(...strats.map((s) => s.sim.downAtHome || 0)) : 0;
          return (
            <>
              {/* hero */}
              <div className="pp-card rec-hero" style={{ borderColor: "var(--violet)", boxShadow: "0 0 0 2px rgba(124,77,196,.18)" }}>
                <span className="badge" style={{ display: "inline-block", fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: "#fff", background: "var(--violet)", padding: "3px 9px", borderRadius: 999 }}>Recommended for you</span>
                <h4 style={{ fontFamily: "var(--display)", fontSize: 23, color: "var(--plum)", margin: "10px 0 4px" }}>{recS.name}</h4>
                <div style={{ fontSize: 14, color: "var(--muted)", marginBottom: 14 }}>Fund in this order: <b style={{ color: "var(--plum)" }}>{(recOrder).filter((a) => a !== "fhsa" || buyingHome).map((a) => ACCT_NAME[a]).join(" → ")}</b></div>
                <div className="pp-grid-3">
                  <div className="pp-rate-chip"><div className="l">Tax refund, year one</div><div className="v">{fmtMoney(recS.sim.refundYr1)}</div><div className="h">from RRSP/FHSA deductions</div></div>
                  <div className="pp-rate-chip" style={{ background: "var(--violet-soft)" }}><div className="l">After-tax at {retAge}</div><div className="v">{fmtMoney(recS.sim.afterTax)}</div><div className="h">withdrawals taxed realistically</div></div>
                  {buyingHome
                    ? <div className="pp-rate-chip" style={{ background: "#F3ECDB" }}><div className="l">Down payment by {homeAge || "?"}</div><div className="v">{recS.sim.downAtHome != null ? fmtMoney(recS.sim.downAtHome) : "—"}</div><div className="h">FHSA + TFSA + HBP</div></div>
                    : <div className="pp-rate-chip" style={{ background: "#F3ECDB" }}><div className="l">Why this order</div><div className="v" style={{ fontSize: 15, lineHeight: 1.25 }}>{marginal >= 0.30 ? "Deduct high now" : "Stay flexible"}</div><div className="h">{marginal >= 0.30 ? `${pct1(marginal)} today vs ~${pct1(retMarginal)} later` : "TFSA first at your bracket"}</div></div>}
                </div>
              </div>
              {/* comparison table */}
              <div className="pp-card" style={{ marginTop: 14, overflowX: "auto" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--plum-2)", marginBottom: 4 }}>Same {fmtMoney(annInv)}/yr, four ways — side by side</div>
                <table className="pp-cmp">
                  <thead><tr><th>Strategy</th><th>Refund yr 1</th><th>After-tax @ {retAge}</th>{buyingHome && <th>Down pmt @ {homeAge || "?"}</th>}<th>Best for</th></tr></thead>
                  <tbody>
                    {strats.map((s) => (
                      <tr key={s.key} className={s.key === recKey ? "rec" : ""}>
                        <td><span className="stratname">{s.name}</span>{s.key === recKey && <span className="recbadge">Rec</span>}<div className="ord">{(s.order || ["tfsa", "rrsp"]).filter((a) => a !== "fhsa" || buyingHome).map((a) => ACCT_NAME[a]).join(" → ")}{s.mode === "balanced" ? " (50/50)" : ""}</div></td>
                        <td>{fmtMoney(s.sim.refundYr1)}</td>
                        <td className={s.sim.afterTax === bestRetire ? "best" : ""}>{fmtMoney(s.sim.afterTax)}</td>
                        {buyingHome && <td className={(s.sim.downAtHome || 0) === bestDown && bestDown > 0 ? "best" : ""}>{s.sim.downAtHome != null ? fmtMoney(s.sim.downAtHome) : "—"}</td>}
                        <td style={{ textAlign: "left", whiteSpace: "normal", fontSize: 12, color: "var(--muted)" }}>{s.goodIf[0]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 10 }}><b className="best" style={{ color: "var(--green)" }}>Green</b> marks the highest figure in each column. Trade-off to weigh: {recS.trade}</p>
              </div>
            </>
          );
        })() : (
          <div className="pp-card"><p style={{ color: "var(--muted)" }}>Add a monthly contribution in your numbers to compare strategies with real figures.</p></div>
        )}
        <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 12 }}>A model, not a guarantee: it assumes steady {pct1(ret)} returns, your {pct1(marginal)} rate today and ~{pct1(retMarginal)} in retirement, and that tax refunds are reinvested. Real outcomes vary.</p>
      </div>

      {/* GOAL TRACKER */}
      <div id="sec-goal" style={{ marginTop: 34 }}>
        <span className="pp-eyebrow"><Sparkles size={14} /> Goal tracker</span>
        <h3 className="pp-sec-h">{goals.length > 1 ? "Your goals" : "Your goal"}</h3>
        {goals.map((k) => {
          if (k === "house") return (
            <div className="pp-card" style={{ marginBottom: 14 }} key={k}>
              <span className="pp-eyebrow"><HomeIcon size={13} /> Buy a home</span>
              {n(plan.homePrice) > 0 ? (
                <>
                <div className="pp-grid-2" style={{ marginTop: 8 }}>
                  <div className="pp-rate-chip"><div className="l">Min. down payment</div><div className="v">{fmtMoney(downNeed)}</div><div className="h">on a {fmtMoney(n(plan.homePrice))} home</div></div>
                  <div className="pp-rate-chip" style={{ background: "var(--violet-soft)" }}><div className="l">Projected by age {homeAge || "?"}</div><div className="v">{recSim.downAtHome != null ? fmtMoney(recSim.downAtHome) : "—"}</div><div className="h">FHSA + TFSA + HBP at {pct1(ret)}</div></div>
                </div>
                {(() => {
                  const N = homeIdx ? homeIdx * 12 : 0;
                  const i = (ret - fee) / 12;
                  const flat = N > 0 ? Math.max(0, (downNeed - start) / N) : null;
                  const fvStart = start * Math.pow(1 + i, N);
                  const grow = (N > 0 && i > 0) ? Math.max(0, (downNeed - fvStart) * i / (Math.pow(1 + i, N) - 1)) : flat;
                  return (
                    <div className="pp-grid-2" style={{ marginTop: 12 }}>
                      <div className="pp-rate-chip" style={{ background: "#F3ECDB" }}><div className="l">Monthly to get there · before growth</div><div className="v">{flat != null ? fmtMoney(flat) + "/mo" : "—"}</div><div className="h">if saved as plain cash</div></div>
                      <div className="pp-rate-chip" style={{ background: "#F3ECDB" }}><div className="l">Monthly to get there · with growth</div><div className="v">{grow != null ? fmtMoney(grow) + "/mo" : "—"}</div><div className="h">if invested at {pct1(ret)}{fvStart >= downNeed && start > 0 ? " — your balance already covers it" : ""}</div></div>
                    </div>
                  );
                })()}
                </>
              ) : <p style={{ color: "var(--muted)", marginTop: 8 }}>Add your target home price and purchase age in your numbers to see your down-payment timeline.</p>}
            </div>
          );
          if (k === "fi") return (
            <div className="pp-card" style={{ marginBottom: 14 }} key={k}>
              <span className="pp-eyebrow"><TrendingUp size={13} /> Financial independence</span>
              <div className="pp-grid-3" style={{ marginTop: 8 }}>
                <div className="pp-rate-chip"><div className="l">Your FI number</div><div className="v">{fmtMoney(fi.number)}</div><div className="h">{fmtMoney(annualSpend)}/yr × 25 (4% rule)</div></div>
                <div className="pp-rate-chip" style={{ background: "var(--violet-soft)" }}><div className="l">Years to FI</div><div className="v">{fiYrs != null ? fiYrs : "60+"}</div><div className="h">at {fmtMoney(annInv)}/yr invested</div></div>
                <div className="pp-rate-chip" style={{ background: "#F3ECDB" }}><div className="l">Age at FI</div><div className="v">{fiYrs != null ? age + fiYrs : "—"}</div><div className="h">work becomes optional</div></div>
              </div>
              <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 12 }}>The 4% rule: roughly 25× your annual spending can sustainably fund it. Target spending {fmtMoney(annualSpend)}/yr{n(plan.retIncome) > 0 ? " (your figure)" : " (~70% of today's income — set your retirement income to refine)"}.</p>
            </div>
          );
          if (k === "number") return (
            <div className="pp-card" style={{ marginBottom: 14 }} key={k}>
              <span className="pp-eyebrow"><Coins size={13} /> Target number</span>
              {targetNumber > 0 ? (
                <div className="pp-grid-3" style={{ marginTop: 8 }}>
                  <div className="pp-rate-chip"><div className="l">Target</div><div className="v">{fmtMoney(targetNumber)}</div><div className="h">invested</div></div>
                  <div className="pp-rate-chip" style={{ background: "var(--violet-soft)" }}><div className="l">Years to reach it</div><div className="v">{numYrs != null ? numYrs : "60+"}</div><div className="h">at {fmtMoney(annInv)}/yr</div></div>
                  <div className="pp-rate-chip" style={{ background: "#F3ECDB" }}><div className="l">You'll be</div><div className="v">{numYrs != null ? age + numYrs : "—"}</div><div className="h">years old</div></div>
                </div>
              ) : <p style={{ color: "var(--muted)", marginTop: 8 }}>Add your target invested amount in the goal step to see when you'd reach it.</p>}
            </div>
          );
          return (
            <div className="pp-card" style={{ marginBottom: 14 }} key={k}>
              <span className="pp-eyebrow"><Landmark size={13} /> Retire comfortably</span>
              <div className="pp-grid-3" style={{ marginTop: 8 }}>
                <div className="pp-rate-chip"><div className="l">After-tax at {retAge}</div><div className="v">{fmtMoney(recSim.afterTax)}</div><div className="h">on your recommended path</div></div>
                <div className="pp-rate-chip" style={{ background: "var(--violet-soft)" }}><div className="l">Sustainable income</div><div className="v">{fmtMoney(recSim.afterTax * 0.04)}/yr</div><div className="h">at a 4% draw</div></div>
                <div className="pp-rate-chip" style={{ background: "#F3ECDB" }}><div className="l">Target income</div><div className="v">{fmtMoney(annualSpend)}/yr</div><div className="h">{recSim.afterTax * 0.04 >= annualSpend ? "on track ✓" : "keep building"}</div></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* OPPORTUNITY COST */}
      {income > 0 && (
        <div style={{ marginTop: 34 }}>
          <span className="pp-eyebrow"><Coins size={14} /> Opportunity cost</span>
          <h3 className="pp-sec-h">Where your next {fmtMoney(oppAmt)} ends up ahead</h3>
          <p className="pp-sec-lead">The deduction accounts hand you {fmtMoney(refundNow)} back now (your {pct1(marginal)} rate × {fmtMoney(oppAmt)}). The fair comparison invests that refund too, then taxes each account the way it's <em>actually</em> taxed on the way out — at your estimated retirement rate, not today's.</p>
          <div className="pp-card">
            <table className="pp-opp">
              <thead><tr><th>Account</th><th>Tax back now</th><th>Grows to (age {retAge})</th><th>Tax on withdrawal</th><th>Net when used</th></tr></thead>
              <tbody>
                {oppRows.map((r) => r.closes ? (
                  <tr key={r.key}>
                    <td>{r.name}</td>
                    <td className={r.taxNow > 0 ? "good" : ""}>{fmtMoney(r.taxNow)}</td>
                    <td style={{ color: "var(--muted)" }}>—</td>
                    <td className="good">None — for a home</td>
                    <td style={{ color: "#9A6010", fontWeight: 600, fontSize: 12 }}>Closes at age {r.closeAge != null ? r.closeAge : "—"}{age71Year != null && fhsaForceCloseYear === age71Year ? " (age 71 rule)" : ""}</td>
                  </tr>
                ) : (
                  <tr key={r.key}>
                    <td>{r.name}</td>
                    <td className={r.taxNow > 0 ? "good" : ""}>{fmtMoney(r.taxNow)}</td>
                    <td>{fmtMoney(r.gross)}</td>
                    <td className={r.wTaxRate > 0 ? "bad" : "good"}>{r.withdrawal}</td>
                    <td><b>{fmtMoney(r.net)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pp-callout" style={{ marginTop: 14, marginBottom: 0 }}>
              <Sparkles size={18} style={{ flex: "none" }} />
              <span>For your situation, <b>{oppBest.name}</b> comes out ahead — about <b>{fmtMoney(oppBest.net)}</b> net{oppBest.key === "rrsp" ? `, because your retirement rate (~${pct1(retMarginal)}) is below today's ${pct1(marginal)}, and the reinvested refund compounds.` : `, because your retirement rate (~${pct1(retMarginal)}) isn't lower than today's, so paying tax now and never again wins.`}</span>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 12 }}>{buyingHome ? <>The FHSA can't be held to retirement — it must close by age {fhsaCloseAge != null ? fhsaCloseAge : "?"} (15 years after opening, or age 71). It shines for a <b>home</b> instead: see its projected value in your Goal tracker. Unused FHSA money rolls into your RRSP, then taxed like one. </> : ""}RRSP <em>and</em> FHSA deductions can also be <b>carried forward</b> — you don't have to claim them this year. If you expect a higher-income year soon, saving the deduction for then can be worth noticeably more. Assumes the refund is reinvested tax-free and steady {pct1(ret)} returns; a model, not a guarantee.</p>
          </div>
        </div>
      )}

      {/* SCORECARD */}
      <div style={{ marginTop: 34 }}>
        <span className="pp-eyebrow"><Shield size={14} /> Financial health</span>
        <h3 className="pp-sec-h">Your snapshot score</h3>
        <p className="pp-sec-lead">A rough self-check across the things that matter most — not a formal assessment. Each bar links to something you can act on.</p>
        <div className="pp-card">
          <div className="pp-score">
            <div className="pp-score-ring">
              <svg width="130" height="130" viewBox="0 0 130 130" aria-hidden="true">
                <circle cx="65" cy="65" r="54" fill="none" stroke="var(--panel)" strokeWidth="11" />
                <circle cx="65" cy="65" r="54" fill="none" stroke={scoreColor(health.overall / 10)} strokeWidth="11" strokeLinecap="round" strokeDasharray={2 * Math.PI * 54} strokeDashoffset={2 * Math.PI * 54 * (1 - health.overall / 100)} transform="rotate(-90 65 65)" />
                <text x="65" y="60" textAnchor="middle" fontSize="34" fontWeight="700" fill="var(--plum)" fontFamily="Fraunces">{health.overall}</text>
                <text x="65" y="82" textAnchor="middle" fontSize="12" fill="#6E5E78" fontFamily="Hanken Grotesk">/ 100</text>
              </svg>
            </div>
            <div className="pp-score-bars">
              {health.parts.map((p) => (
                <div className="pp-scrow" key={p.key}>
                  <div className="top"><span>{p.label}</span><b style={{ color: scoreColor(p.score) }}>{p.score}/10</b></div>
                  <div className="bar"><i style={{ width: (p.score * 10) + "%", background: scoreColor(p.score) }} /></div>
                  <div className="tip">{p.tip}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid var(--line)", marginTop: 16, paddingTop: 14 }}>
            <div className="l" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em", fontWeight: 700, color: "var(--plum-2)", marginBottom: 10 }}>Progress toward your {goals.length > 1 ? "goals" : "goal"}</div>
            <div className="pp-score-bars">
              {goals.map((k) => {
                const prog = goalProgress(k);
                const gname = (GOALS.find((g) => g.key === k) || {}).name || k;
                const pctv = prog == null ? null : Math.round(prog * 100);
                const detail = k === "house" ? (downNeed > 0 ? `${fmtMoney(recSim.downAtHome || 0)} of ${fmtMoney(downNeed)} down payment` : "add a home price to track")
                  : k === "fi" ? `${fmtMoney(recSim.afterTax)} of your ${fmtMoney(fi.number)} FI number`
                  : k === "number" ? (targetNumber > 0 ? `${fmtMoney(selFinal)} of ${fmtMoney(targetNumber)}` : "add a target amount to track")
                  : `${fmtMoney(recSim.afterTax * 0.04)}/yr of your ${fmtMoney(annualSpend)}/yr target`;
                return (
                  <div className="pp-scrow" key={k}>
                    <div className="top"><span>{gname}</span><b style={{ color: pctv == null ? "var(--muted)" : scoreColor(prog * 10) }}>{pctv == null ? "—" : pctv + "%"}</b></div>
                    <div className="bar"><i style={{ width: (pctv || 0) + "%", background: pctv == null ? "var(--muted)" : scoreColor(prog * 10) }} /></div>
                    <div className="tip">{detail}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {income > 0 && (
        <div id="sec-pay" style={{ marginTop: 30 }}>
          <span className="pp-eyebrow"><Receipt size={14} /> Your paycheque, decoded</span>
          <h3 className="pp-sec-h">Where your {fmtMoney(income)} actually goes</h3>
          <p className="pp-sec-lead">Your gross income in {TAX_CONFIG.prov[prov].name} ({empType === "self" ? "self-employed" : "employed"}), broken into tax, contributions, and take-home for {TAX_YEAR}.</p>
          <div className="pp-card">
            <PaycheckBreakdown tax={tax} marginal={marginal} />
          </div>
          <div style={{ height: 14 }} />
          <TaxDisclaimer />
        </div>
      )}

      {/* TAX SAVINGS — RRSP / FHSA */}
      {income > 0 && (
        <div id="sec-tax" style={{ marginTop: 34 }}>
          <span className="pp-eyebrow"><Calculator size={14} /> Tax savings &amp; brackets</span>
          <h3 className="pp-sec-h">Your bracket, and what a deduction does to it</h3>
          <p className="pp-sec-lead">RRSP and FHSA contributions come off your taxable income, so each dollar you deduct saves tax at your marginal rate. Here's exactly where you sit.</p>

          {/* bracket navigator */}
          {brk && (
            <div className="pp-brackets" style={{ marginBottom: 16 }}>
              <div className="pp-brk">
                <div className="l">Your marginal bracket</div>
                <div className="v">{pct1(brk.cur)}</div>
                <div className="h">Your next dollar is taxed at this combined federal + {brk && tax.isQC ? "Quebec" : "provincial"} rate, on taxable income of about {fmtMoney(brk.taxable)}.</div>
              </div>
              <div className="pp-brk up">
                <div className="l">Into the next bracket</div>
                <div className="v">{brk.up != null ? "+" + fmtMoney(brk.toNext) : "—"}</div>
                <div className="h">{brk.up != null ? <>About this much more taxable income pushes your next dollar to <b>{pct1(brk.rateAbove)}</b>.</> : <>You're already in the top bracket.</>}</div>
              </div>
              <div className="pp-brk down">
                <div className="l">Down a bracket</div>
                <div className="v">{brk.down != null ? fmtMoney(brk.toLower) : "—"}</div>
                <div className="h">{brk.down != null ? <>Deducting about this much (e.g. to an RRSP/FHSA) drops your next dollar to <b>{pct1(brk.rateBelow)}</b>.</> : <>You're already in the lowest bracket.</>}</div>
              </div>
            </div>
          )}

          <div className="pp-grid-2">
            <div className="pp-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><h4 style={{ fontSize: 19 }}>RRSP deduction</h4><PiggyBank size={20} style={{ color: "var(--violet)" }} /></div>
              <CurrencyField id="d-rrspplan" label="Amount you'd contribute" value={rrspPlan} onChange={(v) => setRrspPlan(n(v))} placeholder="e.g. 6,000"
                help={rrspLimit > 0 ? <>Your estimated room is about <b>{fmtMoney(rrspLimit)}</b>.</> : null} />
              <div className="pp-stat" style={{ marginTop: 6 }}><span>Estimated tax saved</span><b style={{ color: "var(--green)" }}>{fmtMoney(rrspSaving)}</b></div>
              <div className="pp-stat"><span>Net cost to you</span><b>{fmtMoney(Math.max(0, rrspPlan - rrspSaving))}</b></div>
              <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 10 }}>The deduction defers tax — you'll pay income tax when you withdraw in retirement, ideally at a lower rate.</p>
            </div>
            <div className="pp-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><h4 style={{ fontSize: 19 }}>FHSA deduction</h4><HomeIcon size={20} style={{ color: "var(--gold)" }} /></div>
              <CurrencyField id="d-fhsaplan" label="Amount you'd contribute" value={fhsaPlan} onChange={(v) => setFhsaPlan(n(v))} placeholder="e.g. 8,000"
                help={<>Up to {fmtMoney(TAX_CONFIG.fhsa.annual)}/year ({fmtMoney(TAX_CONFIG.fhsa.maxYear)} with carry-forward).</>} />
              <div className="pp-stat" style={{ marginTop: 6 }}><span>Estimated tax saved</span><b style={{ color: "var(--green)" }}>{fmtMoney(fhsaSaving)}</b></div>
              <div className="pp-stat"><span>Net cost to you</span><b>{fmtMoney(Math.max(0, fhsaPlan - fhsaSaving))}</b></div>
              <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 10 }}>Unlike the RRSP, a qualifying first-home FHSA withdrawal is <b>never</b> taxed — the deduction is permanent if used for a home.</p>
            </div>
          </div>
          <div style={{ height: 14 }} />
          <TaxDisclaimer />
        </div>
      )}

      {/* TFSA vs RRSP */}
      {income > 0 && (() => {
        const claw = oasClawback(retIncome);
        const nearClaw = retIncome > TAX_CONFIG.oas.thresholdMin - 15000 && retIncome <= TAX_CONFIG.oas.thresholdMin;
        const lowIncomeRet = retIncome > 0 && retIncome < 32000; // GIS / low-bracket territory
        return (
        <div id="sec-vs" style={{ marginTop: 34 }}>
          <span className="pp-eyebrow"><Scale size={14} /> TFSA vs RRSP</span>
          <h3 className="pp-sec-h">Which wrapper fits you right now?</h3>
          <p className="pp-sec-lead">The rule of thumb: the RRSP wins when your tax rate today is higher than in retirement; the TFSA wins when it's lower or equal (and always adds flexibility). This compares your rates.</p>
          <div className="pp-card">
            <div className="pp-grid-2" style={{ gap: 16 }}>
              <div className="pp-rate-chip" style={{ background: "var(--violet-soft)" }}><div className="l">Marginal rate today</div><div className="v">{pct1(marginal)}</div><div className="h">at {fmtMoney(income)} income</div></div>
              <div className="pp-rate-chip" style={{ background: "#F3ECDB" }}><div className="l">Est. rate in retirement</div><div className="v">{pct1(retMarginal)}</div><div className="h">at the income below</div></div>
            </div>
            <div className="pp-row2" style={{ marginTop: 14 }}>
              <div className="pp-field" style={{ marginBottom: 0 }}>
                <label className="pp-label2" htmlFor="d-retinc">Assumed retirement income <span style={{ fontWeight: 600, color: "var(--muted)" }}>· edit to refine</span></label>
                <div className="pp-input-wrap"><span className="pp-adorn">$</span><input id="d-retinc" className="pp-input" inputMode="numeric"
                  value={retIncome ? Number(retIncome).toLocaleString("en-CA") : ""} placeholder="estimate"
                  onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ""); setPlan((p) => ({ ...p, retIncome: raw === "" ? "" : Number(raw) })); }} /></div>
                <div className="pp-help">{n(plan.retIncome) > 0 ? "Your figure." : <>Estimated as ~{fmtMoney(GOV_BENEFITS)} of CPP/OAS plus a 4% draw on your projected savings ({fmtMoney(retIncome)}).</>}</div>
              </div>
              <div className="pp-field" style={{ marginBottom: 0 }}>
                <label className="pp-label2" htmlFor="d-retrate">Retirement tax rate <span style={{ fontWeight: 600, color: "var(--muted)" }}>· override</span></label>
                <div className="pp-input-wrap"><input id="d-retrate" className="pp-input" inputMode="decimal"
                  value={n(plan.retTaxRate) > 0 ? plan.retTaxRate : ""} placeholder={(retMarginalAuto * 100).toFixed(1)}
                  onChange={(e) => { const raw = e.target.value.replace(/[^0-9.]/g, ""); setPlan((p) => ({ ...p, retTaxRate: raw })); }} /><span className="pp-adorn r">%</span></div>
                <div className="pp-help">{n(plan.retTaxRate) > 0 ? "Your override." : <>Defaulting to <b>{pct1(retMarginalAuto)}</b> — the rate expected on withdrawals given your retirement income above. Set your own if you have a better estimate.</>}</div>
              </div>
            </div>
            <div className="pp-callout" style={{ marginTop: 14, marginBottom: 0 }}>
              <Sparkles size={18} style={{ flex: "none" }} />
              <span>{marginal - retMarginal > 0.02
                ? <>Your rate today ({pct1(marginal)}) is higher than your estimated retirement rate ({pct1(retMarginal)}), so the <b>RRSP</b> tends to come out ahead — you deduct at a high rate now and withdraw at a lower one later.</>
                : retMarginal - marginal > 0.02
                ? <>Your estimated retirement rate ({pct1(retMarginal)}) is higher than today's ({pct1(marginal)}), so the <b>TFSA</b> tends to win — pay tax now at the lower rate and never again.</>
                : <>Your rates today and in retirement are close, so it's roughly a wash on tax — which tips the decision toward the <b>TFSA</b> for its flexibility and tax-free withdrawals.</>}</span>
            </div>
            {(claw > 0 || nearClaw || lowIncomeRet) && (
              <div className="pp-callout" style={{ marginTop: 12, marginBottom: 0, background: "#F3E4C8", borderColor: "#C98A2E" }}>
                <AlertTriangle size={18} style={{ flex: "none", color: "#9A6010" }} />
                <span>{lowIncomeRet
                  ? <><b>Watch the GIS trap.</b> At a low retirement income, the Guaranteed Income Supplement is reduced by about <b>50¢ per dollar</b> of other income — and RRSP/RRIF withdrawals count, but <b>TFSA withdrawals don't</b>. For lower-income retirees the TFSA is often the better home despite the rule-of-thumb above.</>
                  : claw > 0
                  ? <><b>OAS clawback flag.</b> At {fmtMoney(retIncome)}, you'd be above the {fmtMoney(TAX_CONFIG.oas.thresholdMin)} OAS threshold, losing about <b>{fmtMoney(claw)}/yr</b> of OAS to the 15% recovery tax — effectively a hidden surtax on RRSP/RRIF withdrawals. TFSA withdrawals don't count toward it, so they can help keep you under the line.</>
                  : <><b>OAS clawback is close.</b> You're near the {fmtMoney(TAX_CONFIG.oas.thresholdMin)} OAS threshold. Large RRSP/RRIF withdrawals could tip you over (15% recovery on the excess); TFSA withdrawals won't, since they don't count as income.</>}</span>
              </div>
            )}
            <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 12 }}>A simplification: it sets aside employer matches and the FHSA (often the first choice if you're buying a home), and the retirement rate is an estimate. <button className="pp-inlinelink" onClick={() => go("libtopic", { cat: "tax", topic: "clawbacks" })}>Read how OAS &amp; GIS clawbacks work →</button></p>
          </div>
        </div>
        );
      })()}

      {/* REMAINING ROOM */}
      <div id="sec-room" style={{ marginTop: 34 }}>
        <span className="pp-eyebrow"><Wallet size={14} /> Contribution room</span>
        <h3 className="pp-sec-h">How much room you have left</h3>
        <p className="pp-sec-lead">{n(plan.birthYear) > 0 || n(plan.rrspLimitNOA) > 0 || n(plan.fhsaYearOpened) > 0 ? "Based on the details you entered." : "Add your birth year, RRSP room, and FHSA open-year in the planner's optional step for personalised numbers — these are the general limits for now."}</p>
        <div className="pp-room">
          {/* TFSA */}
          <div className="pp-roomc">
            <h4>TFSA <PiggyBank size={18} style={{ color: "var(--violet)" }} /></h4>
            <div className="pp-room-big">{fmtMoney(tfsaCum)}</div>
            <div className="pp-room-sub">Cumulative room{n(plan.birthYear) > 0 ? ` since you turned 18` : " (if 18+ since 2009)"}</div>
            <Bar used={n(plan.bTfsa)} total={tfsaCum} color="var(--violet)" />
            <div className="pp-room-legend"><span>This year: {fmtMoney(TAX_CONFIG.tfsa.annual)}</span><span>Used: {fmtMoney(tfsaUsed)}</span></div>
            <div className="pp-room-sub"><b style={{ color: "var(--plum)" }}>{fmtMoney(tfsaAnnualLeft)}</b> of this year's room left{n(plan.bTfsa) > 0 ? ` · ~${fmtMoney(tfsaLifeLeft)} cumulative (using balance as a proxy)` : ""}</div>
            {tfsaUsed > tfsaCum && <div className="pp-overwarn"><AlertTriangle size={15} style={{ flex: "none" }} /><span>That's more than your estimated room — the CRA charges <b>1% per month</b> on TFSA over-contributions.</span></div>}
          </div>
          {/* RRSP */}
          <div className="pp-roomc">
            <h4>RRSP <Landmark size={18} style={{ color: "var(--gold)" }} /></h4>
            <div className="pp-room-big">{fmtMoney(rrspLeft)}</div>
            <div className="pp-room-sub">Room left {n(plan.rrspLimitNOA) > 0 ? "(from your NOA)" : "(estimated from income)"}</div>
            <Bar used={rrspUsed} total={rrspLimit} color="var(--gold)" />
            <div className="pp-room-legend"><span>Limit: {fmtMoney(rrspLimit)}</span><span>Used: {fmtMoney(rrspUsed)}</span></div>
            <div className="pp-room-sub">Limit is the lower of 18% of last year's earned income and {fmtMoney(TAX_CONFIG.rrsp.dollarMax)}.</div>
            {rrspOver && <div className="pp-overwarn"><AlertTriangle size={15} style={{ flex: "none" }} /><span>Over your limit by more than the {fmtMoney(TAX_CONFIG.rrsp.overBuffer)} buffer — a <b>1%/month</b> penalty may apply.</span></div>}
          </div>
          {/* FHSA */}
          <div className="pp-roomc">
            <h4>FHSA <HomeIcon size={18} style={{ color: "var(--rose)" }} /></h4>
            <div className="pp-room-big">{fmtMoney(fhsaLifeLeft)}</div>
            <div className="pp-room-sub">{fhsaRoom.opened ? <>Available room so far <span style={{ color: "var(--muted)" }}>(accrued, not the full $40k)</span></> : "Open an FHSA to start accruing room"}</div>
            <Bar used={fhsaLifeUsed} total={TAX_CONFIG.fhsa.lifetime} color="var(--rose)" />
            <div className="pp-room-legend"><span>Lifetime cap: {fmtMoney(TAX_CONFIG.fhsa.lifetime)}</span><span>Used: {fmtMoney(fhsaYrUsed)}</span></div>
            <div className="pp-room-sub">{fhsaRoom.opened ? <>Room builds <b>{fmtMoney(TAX_CONFIG.fhsa.annual)}/yr</b> from {n(plan.fhsaYearOpened)} — about {fmtMoney(fhsaRoom.accrued)} accrued so far. <b style={{ color: "var(--plum)" }}>{fmtMoney(fhsaYrLeft)}</b> usable this year (up to {fmtMoney(TAX_CONFIG.fhsa.maxYear)} with carry-forward).</> : <>You get {fmtMoney(TAX_CONFIG.fhsa.annual)} the year you open one, up to {fmtMoney(TAX_CONFIG.fhsa.lifetime)} lifetime.</>}</div>
            {(fhsaLifeOver || fhsaYrOver) && <div className="pp-overwarn"><AlertTriangle size={15} style={{ flex: "none" }} /><span>{fhsaLifeOver ? "Past the $40k lifetime cap" : "Past this year's $16k max"} — the CRA charges <b>1%/month</b> on the excess.</span></div>}
          </div>
        </div>
        <div style={{ height: 14 }} />
        <TaxDisclaimer />
      </div>

      {/* FHSA DEADLINE */}
      {fhsaEffYearsLeft != null && (
        <div style={{ marginTop: 34 }}>
          <span className="pp-eyebrow"><CalendarClock size={14} /> FHSA deadline</span>
          <h3 className="pp-sec-h">Your FHSA closing clock</h3>
          <p className="pp-sec-lead">An FHSA must be closed by the end of its 15th year, or the year you turn {TAX_CONFIG.fhsa.closeAge} — whichever comes first. Unused funds can roll into your RRSP without using RRSP room.</p>
          <div className="pp-deadline">
            <svg className="ring" width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
              <circle cx="42" cy="42" r="36" fill="none" stroke="var(--panel)" strokeWidth="8" />
              <circle cx="42" cy="42" r="36" fill="none" stroke="var(--plum)" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 36} strokeDashoffset={2 * Math.PI * 36 * (1 - Math.max(0, Math.min(1, fhsaEffYearsLeft / TAX_CONFIG.fhsa.participationYears)))} transform="rotate(-90 42 42)" />
              <text x="42" y="47" textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--plum)" fontFamily="Fraunces">{Math.max(0, fhsaEffYearsLeft)}</text>
            </svg>
            <div>
              <div className="big">{fhsaEffYearsLeft > 0 ? `${fhsaEffYearsLeft} years left` : "Closing year reached"}</div>
              <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 4 }}>Opened in {n(plan.fhsaYearOpened)} — must close by end of <b>{fhsaCloseYear}</b>{age71Year != null && fhsaCloseYear === age71Year ? " (the year you turn 71)" : ""}. {fhsaEffYearsLeft <= 2 && fhsaEffYearsLeft > 0 ? "That's soon — plan your purchase or RRSP rollover." : "Plenty of time, but the clock is running."}</p>
            </div>
          </div>
        </div>
      )}

      {hasData && (
        <div id="sec-grow">
          {/* WHAT-IF + CHART */}
          <div className="pp-card pp-noprint" style={{ marginTop: 34 }}>
            <span className="pp-eyebrow">What if…</span>
            <h3 style={{ fontSize: 22, margin: "8px 0 16px" }}>Adjust the inputs — slide or type</h3>
            <div className="pp-sliders">
              <div className="pp-slider">
                <div className="top"><span className="l">Monthly contribution</span><span className="vwrap"><span className="vu">$</span><input className="vin" inputMode="numeric" value={monthly} onChange={(e) => setMonthly(Math.max(0, Number(e.target.value.replace(/[^0-9]/g, "")) || 0))} aria-label="Monthly contribution amount" /></span></div>
                <input className="pp-range" type="range" min="0" max="3000" step="25" value={Math.min(monthly, 3000)} onChange={(e) => setMonthly(Number(e.target.value))} aria-label="Monthly contribution" />
              </div>
              <div className="pp-slider">
                <div className="top"><span className="l">Retirement age</span><span className="vwrap"><input className="vin" inputMode="numeric" value={retAge} onChange={(e) => setRetAge(Number(e.target.value.replace(/[^0-9]/g, "")) || 0)} aria-label="Retirement age value" /></span></div>
                <input className="pp-range" type="range" min={age + 1} max="75" step="1" value={Math.min(Math.max(retAge, age + 1), 75)} onChange={(e) => setRetAge(Number(e.target.value))} aria-label="Retirement age" />
              </div>
              <div className="pp-slider">
                <div className="top"><span className="l">Annual return</span><span className="vwrap"><input className="vin" inputMode="decimal" value={(ret * 100).toFixed(1)} onChange={(e) => { const v = parseFloat(e.target.value.replace(/[^0-9.]/g, "")); if (!isNaN(v)) setRet(v / 100); }} aria-label="Annual return percent" /><span className="vu">%</span></span></div>
                <input className="pp-range" type="range" min="0.02" max="0.12" step="0.005" value={Math.min(Math.max(ret, 0.02), 0.12)} onChange={(e) => setRet(Number(e.target.value))} aria-label="Annual return" />
              </div>
            </div>
            <div className="pp-toggles">
              <button className={"pp-tog" + (inflation ? " on" : "")} onClick={() => setInflation((v) => !v)}><Check size={14} /> Today's dollars (2% inflation)</button>
              <button className={"pp-tog" + (afterTax ? " on" : "")} onClick={() => setAfterTax((v) => !v)}><Check size={14} /> After estimated retirement tax</button>
            </div>
          </div>

          <div className="pp-card" style={{ marginTop: 18 }}>
            <span className="pp-eyebrow">Growth over time</span>
            <h3 style={{ fontSize: 22, margin: "8px 0 18px" }}>How your money could grow to age {retAge}</h3>
            <GrowthChart series={selSeries} scaleRef={scaleRef} contribSeries={contribSeries} years={years} startAge={age} startMonth={startMonth} homeIdx={homeIdx} homeAge={homeAge} fhsaIdx={fhsaIdx} color={plan.risk === "custom" ? "var(--violet)" : sel.color} inflation={inflation} afterTax={afterTax} retMarginal={retMarginal} rrspShare={rrspShare} />
            <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 14 }}>Hover or tap the line to read your total projected balance at any year. The line follows your <b>{pct1(ret)}</b> return{fee > 0 ? `, after a ${pct1(fee)} fee` : ""} — lower the return and the curve visibly flattens (the axis is held steady so the change is real, not just relabelled). {startMonth > 0 && `Year one counts only ${12 - startMonth} remaining months from ${MONTH_NAMES[startMonth]}. `}{inflation && "Values are discounted at 2%/yr to today's dollars. "}{afterTax && (rrspShare > 0 ? `The after-tax view taxes only the RRSP/locked-in share of your balance (~${pct1(rrspShare)}) at your estimated retirement rate — TFSA and FHSA come out tax-free. ` : "The after-tax view applies your estimated retirement rate to RRSP money only; with no RRSP balance entered, it shows little change. ")}Illustrative only — returns vary and aren't guaranteed.</p>
          </div>

          {costOfWaiting > 1000 && (
            <div className="pp-callout" style={{ marginTop: 16 }}><CalendarClock size={18} style={{ flex: "none" }} /><span>Starting now matters: waiting just <b>5 years</b> to begin would leave you roughly <b>{fmtMoney(costOfWaiting)}</b> short of this figure by age {retAge} — the same contributions simply get less time to compound.</span></div>
          )}

          {/* Breakdown + home */}
          <div className="pp-grid-2" style={{ marginTop: 18 }}>
            <div className="pp-card">
              <span className="pp-eyebrow">Where the money comes from</span>
              <div style={{ marginTop: 12 }}>
                <div className="pp-stat"><span>What you put in</span><b>{fmtMoney(contributed)}</b></div>
                <div className="pp-stat"><span>Growth from compounding</span><b style={{ color: "var(--violet)" }}>{fmtMoney(growth)}</b></div>
                <div className="pp-stat"><span>Projected total</span><b style={{ color: "var(--plum)" }}>{fmtMoney(selFinal)}</b></div>
              </div>
              <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 12 }}>{growth > contributed ? "Compounding does more of the work than your own contributions — that's the power of time." : "Keep going: the longer you stay invested, the more compounding takes over."}</p>
            </div>
            <div className="pp-card">
              <span className="pp-eyebrow">{homeIdx != null ? "Your first-home milestone" : "Monthly habit"}</span>
              {homeIdx != null ? (
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}><HomeIcon size={20} style={{ color: "var(--gold)" }} /><span style={{ fontWeight: 700 }}>By age {homeAge}</span></div>
                  <div className="pp-acct"><div className="num">{fmtMoney(homeValue)}</div></div>
                  <p style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 10 }}>On your {sel.name.toLowerCase()} path, roughly what you'd have when you aim to buy. The FHSA is usually the first account to fill for this goal.</p>
                </div>
              ) : (
                <div style={{ marginTop: 12 }}>
                  <div className="pp-acct"><div className="num">{fmtMoney(monthly)}/mo</div></div>
                  <p style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 10 }}>That's {fmtMoney(monthly * 12)} a year going to work for you. Nudging it up even a little compounds into a surprisingly large difference over {years} years.</p>
                </div>
              )}
            </div>
          </div>

          {/* HOME GOAL */}
          {plan.buyHome && homePrice > 0 && (
            <div className="pp-card" style={{ marginTop: 18 }}>
              <span className="pp-eyebrow"><HomeIcon size={14} /> Your home goal</span>
              <h3 style={{ fontSize: 22, margin: "8px 0 14px" }}>Down payment on a {fmtMoney(homePrice)} home</h3>
              <div className="pp-grid-3" style={{ marginTop: 2 }}>
                <div className="pp-rate-chip"><div className="l">Minimum down payment</div><div className="v">{fmtMoney(homeDown)}</div><div className="h">{homePrice < 1500000 ? <>{pct1(homeDown / homePrice)} of price · CMHC insurance applies under 20%</> : <>20% required at this price</>}</div></div>
                <div className="pp-rate-chip" style={{ background: "#F3ECDB" }}><div className="l">20% (skip insurance)</div><div className="v">{fmtMoney(homePrice * 0.2)}</div><div className="h">Avoids the CMHC premium</div></div>
                {homeProjAtBuy != null && <div className="pp-rate-chip" style={{ background: "var(--violet-soft)" }}><div className="l">Projected by age {homeAge}</div><div className="v">{fmtMoney(homeProjAtBuy)}</div><div className="h">On your {sel.name.toLowerCase()} path</div></div>}
              </div>
              {homeProjAtBuy != null && (
                <div className="pp-callout" style={{ marginTop: 16, marginBottom: 0 }}>
                  {homeGap <= 0
                    ? <><Check size={18} style={{ flex: "none", color: "var(--green)" }} /><span>On track — your projected <b>{fmtMoney(homeProjAtBuy)}</b> by age {homeAge} covers the <b>{fmtMoney(homeDown)}</b> minimum, with about <b>{fmtMoney(-homeGap)}</b> to spare toward closing costs (typically 1.5–4%).</span></>
                    : <><AlertTriangle size={18} style={{ flex: "none", color: "#C98A2E" }} /><span>You're about <b>{fmtMoney(homeGap)}</b> short of the <b>{fmtMoney(homeDown)}</b> minimum by age {homeAge}. Raising contributions, extending the timeline, or combining the FHSA with the Home Buyers' Plan can close the gap.</span></>}
                </div>
              )}
              <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 12 }}>Canadian minimums: 5% of the first {fmtMoney(500000)}, 10% of the portion up to {fmtMoney(1500000)}, and 20% at or above {fmtMoney(1500000)} (where CMHC insurance ends). Budget another ~1.5–4% for closing costs. Educational estimate, not mortgage advice.</p>
            </div>
          )}

          {/* Strengths / considerations */}
          <div className="pp-grid-2" style={{ marginTop: 18 }}>
            <div className="pp-card">
              <span className="pp-eyebrow" style={{ color: "#4E7A4C" }}>Your strengths</span>
              <ul className="pp-list" style={{ marginTop: 14 }}>{ins.good.length ? ins.good.map((g, i) => (<li key={i}><Check className="ic pp-good" size={17} /><span>{g}</span></li>)) : <li style={{ color: "var(--muted)" }}>Add a bit more detail to surface your strengths.</li>}</ul>
            </div>
            <div className="pp-card">
              <span className="pp-eyebrow" style={{ color: "#9A6010" }}>Worth thinking about</span>
              <ul className="pp-list" style={{ marginTop: 14 }}>{ins.watch.length ? ins.watch.map((w, i) => (<li key={i}><AlertTriangle className="ic pp-warn" size={16} /><span>{w}</span></li>)) : <li style={{ color: "var(--muted)" }}>Nothing major stands out — nice work.</li>}</ul>
            </div>
          </div>
        </div>
      )}

      {/* Accounts */}
      <div id="sec-accounts" style={{ marginTop: 38 }}>
        <span className="pp-eyebrow">Accounts that may fit your goal</span>
        <h3 style={{ fontSize: 26, margin: "10px 0 20px" }}>Where to hold your investments</h3>
        <div className="pp-grid-3">
          {accts.map((ac) => (
            <div className="pp-card pp-acct" key={ac.key}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><h4 style={{ fontSize: 20 }}>{ac.name}</h4><PiggyBank size={20} style={{ color: "var(--violet)" }} /></div>
              <div className="pp-bal">Your balance: <b>{fmtMoney(ac.bal)}</b></div>
              <div><div className="num">{ac.num}</div><div className="pp-tag">{ac.numLabel}</div></div>
              <p style={{ fontSize: 14, color: "var(--muted)" }}>{ac.why}</p>
              <button className="pp-btn pp-btn-ghost pp-btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => go("libtopic", { cat: "accounts", topic: ac.key })}>Learn more <ChevronRight size={15} /></button>
            </div>
          ))}
        </div>
      </div>

      <div className="pp-noprint" style={{ display: "flex", gap: 12, marginTop: 34, flexWrap: "wrap" }}>
        <button className="pp-btn pp-btn-primary" onClick={() => go("lib")}>Explore the library <ArrowRight size={17} /></button>
        <button className="pp-btn pp-btn-ghost" onClick={edit}>Adjust my numbers</button>
        <button className="pp-btn pp-btn-ghost" onClick={print}><Printer size={16} /> Print / save as PDF</button>
      </div>
    </div>
  );
}

/* ============================================================ INTERACTIVE CALCULATORS ============================================================ */
function CapmCalc() {
  const [rf, setRf] = useState(3);
  const [rm, setRm] = useState(7);
  const [beta, setBeta] = useState(1);
  const er = rf + beta * (rm - rf);
  return (
    <div className="pp-card" style={{ margin: "8px 0 24px" }}>
      <span className="pp-eyebrow"><Calculator size={14} /> Try it: CAPM</span>
      <h4 style={{ fontSize: 18, margin: "8px 0 14px" }}>Expected return calculator</h4>
      <div className="pp-sliders">
        <div className="pp-slider"><div className="top"><span className="l">Risk-free rate (Rf)</span><span className="v">{rf.toFixed(1)}%</span></div><input className="pp-range" type="range" min="0" max="6" step="0.1" value={rf} onChange={(e) => setRf(Number(e.target.value))} aria-label="Risk-free rate" /></div>
        <div className="pp-slider"><div className="top"><span className="l">Market return (Rm)</span><span className="v">{rm.toFixed(1)}%</span></div><input className="pp-range" type="range" min="2" max="12" step="0.1" value={rm} onChange={(e) => setRm(Number(e.target.value))} aria-label="Market return" /></div>
        <div className="pp-slider"><div className="top"><span className="l">Beta (β)</span><span className="v">{beta.toFixed(2)}</span></div><input className="pp-range" type="range" min="0" max="2.5" step="0.05" value={beta} onChange={(e) => setBeta(Number(e.target.value))} aria-label="Beta" /></div>
      </div>
      <div className="pp-rate-chip" style={{ marginTop: 16 }}><div className="l">Expected return E(R) = Rf + β(Rm − Rf)</div><div className="v">{er.toFixed(2)}%</div><div className="h">{rf.toFixed(1)}% + {beta.toFixed(2)} × ({rm.toFixed(1)}% − {rf.toFixed(1)}%)</div></div>
      <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 10 }}>Notice how a beta above 1 lifts the expected return above the market, and a beta below 1 pulls it toward the risk-free rate. Illustrative only.</p>
    </div>
  );
}
function MptCalc() {
  const [w, setW] = useState(60);
  const [corr, setCorr] = useState(0.2);
  const rA = 8, rB = 3, sA = 16, sB = 6; // stylized stock vs bond, %
  const wa = w / 100, wb = 1 - wa;
  const pr = wa * rA + wb * rB;
  const pv = Math.sqrt(wa * wa * sA * sA + wb * wb * sB * sB + 2 * wa * wb * sA * sB * corr);
  return (
    <div className="pp-card" style={{ margin: "8px 0 24px" }}>
      <span className="pp-eyebrow"><Scale size={14} /> Try it: two-asset mix</span>
      <h4 style={{ fontSize: 18, margin: "8px 0 6px" }}>Risk &amp; return mixer</h4>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>A stylized stock (8% return, 16% volatility) blended with a bond (3% return, 6% volatility).</p>
      <div className="pp-sliders">
        <div className="pp-slider"><div className="top"><span className="l">Stock weight</span><span className="v">{w}% / {100 - w}%</span></div><input className="pp-range" type="range" min="0" max="100" step="5" value={w} onChange={(e) => setW(Number(e.target.value))} aria-label="Stock weight" /></div>
        <div className="pp-slider"><div className="top"><span className="l">Correlation</span><span className="v">{corr.toFixed(2)}</span></div><input className="pp-range" type="range" min="-1" max="1" step="0.05" value={corr} onChange={(e) => setCorr(Number(e.target.value))} aria-label="Correlation" /></div>
      </div>
      <div className="pp-grid-2" style={{ gap: 14, marginTop: 16 }}>
        <div className="pp-rate-chip"><div className="l">Expected return</div><div className="v">{pr.toFixed(2)}%</div></div>
        <div className="pp-rate-chip" style={{ background: "#F3ECDB" }}><div className="l">Volatility (risk)</div><div className="v">{pv.toFixed(2)}%</div></div>
      </div>
      <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 10 }}>Lower the correlation and watch volatility drop <em>below</em> the simple weighted average — that's diversification at work. Illustrative only.</p>
    </div>
  );
}

/* ============================================================ LIBRARY ============================================================ */
function Library({ go }) {
  return (
    <div className="pp-wrap pp-section">
      <span className="pp-eyebrow"><BookOpen size={14} /> Learning Library</span>
      <h1 style={{ fontSize: 42, margin: "14px 0 10px" }}>Everything, explained simply.</h1>
      <p style={{ color: "var(--muted)", fontSize: 17, maxWidth: "40em", marginBottom: 36 }}>Pick a category to dive in. Each holds bite-sized explainers in plain language — honest about both the upsides and the catches.</p>
      <div className="pp-grid-2">
        {LIBRARY.map((cat) => { const Ic = cat.icon; return (
          <button className="pp-box" key={cat.key} onClick={() => go("libcat", { cat: cat.key })}>
            <div className="pp-box-ic"><Ic size={22} /></div><h3>{cat.name}</h3><p>{cat.desc}</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}><span className="pp-box-count">{cat.topics.length} topics</span><span className="pp-box-foot">Open <ChevronRight size={15} /></span></div>
          </button>
        ); })}
      </div>
    </div>
  );
}
function LibraryCategory({ catKey, go }) {
  const cat = LIBRARY.find((c) => c.key === catKey); if (!cat) return null; const Ic = cat.icon;
  return (
    <div className="pp-wrap pp-section">
      <button className="pp-back" onClick={() => go("lib")}><ArrowLeft size={16} /> All categories</button>
      <div style={{ display: "flex", gap: 14, alignItems: "center", margin: "18px 0 8px" }}><div className="pp-box-ic"><Ic size={24} /></div><h1 style={{ fontSize: 38 }}>{cat.name}</h1></div>
      <p style={{ color: "var(--muted)", fontSize: 17, maxWidth: "40em", marginBottom: 32 }}>{cat.desc}</p>
      <div className="pp-grid-3">
        {cat.topics.map((t) => (<button className="pp-box" key={t.key} onClick={() => go("libtopic", { cat: cat.key, topic: t.key })}><h3 style={{ fontSize: 20 }}>{t.name}</h3><p>{t.lead}</p><span className="pp-box-foot" style={{ marginTop: 8 }}>Read <ChevronRight size={15} /></span></button>))}
      </div>
    </div>
  );
}
function Topic({ catKey, topicKey, go }) {
  const cat = LIBRARY.find((c) => c.key === catKey); const t = cat?.topics.find((x) => x.key === topicKey); if (!t) return null;
  const isTax = catKey === "tax" || t.key === "investtax" || t.key === "assetloc";
  return (
    <div className="pp-wrap pp-section">
      <div className="pp-topic">
        <button className="pp-back" onClick={() => go("libcat", { cat: catKey })}><ArrowLeft size={16} /> {cat.name}</button>
        <h1>{t.name}</h1><p className="pp-topic-lead">{t.lead}</p>
        <div className="pp-prose">{t.prose.map((p, i) => <p key={i}>{p}</p>)}</div>
        {t.calc === "capm" && <CapmCalc />}
        {t.calc === "mpt" && <MptCalc />}
        {t.facts && (<div className="pp-facts"><h4>Key facts</h4><dl>{t.facts.map(([k, v], i) => (<React.Fragment key={i}><dt>{k}</dt><dd>{v}</dd></React.Fragment>))}</dl></div>)}
        {t.callout && (<div className="pp-callout"><Sparkles size={18} style={{ flex: "none" }} /><span>{t.callout}</span></div>)}
        {t.good && (<p style={{ fontSize: 15.5, marginBottom: 24 }}><b style={{ color: "var(--plum)" }}>Often a good fit for:</b> {t.good}</p>)}
        {isTax ? <TaxDisclaimer /> : <Disclaimer />}
        <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}><button className="pp-btn pp-btn-ghost" onClick={() => go("libcat", { cat: catKey })}><ArrowLeft size={16} /> Back to {cat.name}</button><button className="pp-btn pp-btn-primary" onClick={() => go("lib")}>Browse all topics</button></div>
      </div>
    </div>
  );
}

/* ============================================================ ABOUT ============================================================ */
function About({ go, start }) {
  return (
    <div className="pp-wrap pp-section">
      <div className="pp-topic">
        <span className="pp-eyebrow">About the club</span>
        <h1 style={{ fontSize: 42, margin: "12px 0 18px" }}>Purple Portfolio</h1>
        <div className="pp-prose">
          <p>Purple Portfolio is an investment-education club built on one belief: people make better financial decisions when they actually understand their options — not when they're sold to.</p>
          <p>We focus on Canadians. That means real explanations of the TFSA, RRSP, and FHSA, how your paycheque is actually taxed — federal and provincial tax, CPP/QPP, EI, QPIP — and the core concepts that quietly determine most of your results: fees, diversification, and time. We aim to be useful to a complete beginner and still worthwhile for someone more advanced.</p>
          <p>Crucially, we don't recommend specific investments, prepare your taxes, or promise returns. The planner organizes information around your own numbers — decoding your take-home pay, your contribution room, and an illustrative projection — so you can see possibilities and explore further. The decisions stay yours.</p>
        </div>
        <div className="pp-callout"><Shield size={18} style={{ flex: "none" }} /><span>Your privacy is part of the design: the planner runs entirely in your browser. We don't ask for an email, and your numbers are never sent anywhere or stored.</span></div>
        <Disclaimer />
        <div style={{ height: 12 }} />
        <TaxDisclaimer />
        <div style={{ marginTop: 28 }}><button className="pp-btn pp-btn-primary" onClick={start}>Build my plan <ArrowRight size={17} /></button></div>
      </div>
    </div>
  );
}
