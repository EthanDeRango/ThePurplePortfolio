// Known-good 2026 regression tests. Run by setting DEV=true in App.jsx.
// Add a check here whenever TAX_CONFIG changes — if all pass, the engine is good.
import { TAX_CONFIG } from './tax-config.js';
import { contributions, taxEngine, marginalRate, pensionTax, retirementMarginal, deductionSaving } from './tax-engine.js';
import { projectFinal, projectSeriesSchedule, contributedSeriesSchedule, yearsUntil, minDownPayment, tfsaCumulativeRoom, rrspEstimatedLimit, fhsaRoomInfo, oasClawback, emergencyFundTarget, splitIncome, govBenefitsEstimate, retirementWithdrawal, savingsEventsFor, savingsSchedule } from './calculations.js';

export function runSelfTest() {
  const near = (a, b, t = 0.005) => Math.abs(a - b) <= t;
  const nearAbs = (a, b, tol = 1) => Math.abs(a - b) <= tol;
  const C = TAX_CONFIG;

  const checks = [
    // ── Marginal rates (employed) ────────────────────────────────────────────
    ["ON $60k marginal 29.65%",   near(marginalRate(60000,  "ON", "employed"), 0.2965)],
    ["BC $60k marginal 28.20%",   near(marginalRate(60000,  "BC", "employed"), 0.2820)],
    ["ON $120k marginal 43.41%",  near(marginalRate(120000, "ON", "employed"), 0.4341)],
    ["QC $85k marginal 36.12%",   near(marginalRate(85000,  "QC", "employed"), 0.3612)],
    ["AB $250k marginal 43.29%",  near(marginalRate(250000, "AB", "employed"), 0.4329)],
    // marginal rate must be > 0 for any positive income
    ["NS $40k marginal > 0",      marginalRate(40000, "NS", "employed") > 0],
    ["MB $80k marginal > 0",      marginalRate(80000, "MB", "employed") > 0],
    ["SK $100k marginal > 0",     marginalRate(100000, "SK", "employed") > 0],
    // marginal rate rises (or stays equal) with income in the same province
    ["ON rate increases at $150k vs $60k", marginalRate(150000, "ON", "employed") > marginalRate(60000, "ON", "employed")],
    ["BC rate increases at $200k vs $60k", marginalRate(200000, "BC", "employed") > marginalRate(60000, "BC", "employed")],
    // self-employed pays both CPP halves — marginal rate should be higher at the same gross
    ["ON self-employed $80k marginal >= employed", marginalRate(80000, "ON", "self") >= marginalRate(80000, "ON", "employed") - 0.005],

    // ── CPP / EI contributions ────────────────────────────────────────────────
    ["max CPP base $4,230.45",    nearAbs(contributions(120000, "ON", false).cppBase, 4230.45, 0.5)],
    ["max EI $1,123.07",          nearAbs(contributions(120000, "ON", false).ei,      1123.07, 0.5)],
    ["CPP base at exemption = 0", contributions(3500,   "ON", false).cppBase === 0],
    ["CPP base ON $50k",          nearAbs(contributions(50000, "ON", false).cppBase, (Math.min(50000, C.cpp.ympe) - C.cpp.exemption) * C.cpp.baseRate, 1)],
    ["QPP rate higher than CPP",  contributions(60000, "QC", false).cppBase > contributions(60000, "ON", false).cppBase],
    ["EI = 0 for self-employed",  contributions(80000, "ON", true).ei === 0],
    ["QC EI rate lower than ON",  contributions(60000, "QC", false).ei < contributions(60000, "ON", false).ei],

    // ── taxEngine sanity ──────────────────────────────────────────────────────
    ["ON $0 income net = 0",    taxEngine(0, "ON", "employed").net === 0],
    ["net < gross for $60k ON", taxEngine(60000, "ON", "employed").net < 60000],
    ["QC abatement reduces fed", taxEngine(60000, "QC", "employed").fedTax < taxEngine(60000, "ON", "employed").fedTax],
    ["deduction lowers total tax", deductionSaving(80000, "ON", "employed", 5000) > 0],
    ["deduction saving ≤ contribution", deductionSaving(80000, "ON", "employed", 5000) <= 5000],
    ["RRSP $10k saving at $120k > $30k", deductionSaving(120000, "ON", "employed", 10000) > deductionSaving(30000, "ON", "employed", 10000)],

    // ── Projection maths ──────────────────────────────────────────────────────
    ["proj 30y $300/mo 8% ≈ $447,108", nearAbs(projectFinal(0.08, 30, 0, 300), 447108, 50)],
    ["proj 0% rate is simple addition", nearAbs(projectFinal(0, 10, 1000, 100), 1000 + 100*12*10, 1)],
    ["proj 0 years returns startBal",   nearAbs(projectFinal(0.08, 0, 5000, 0), 5000, 1)],
    ["proj grows with more years",      projectFinal(0.08, 20, 0, 300) < projectFinal(0.08, 30, 0, 300)],
    ["proj grows with higher rate",     projectFinal(0.06, 30, 0, 300) < projectFinal(0.10, 30, 0, 300)],

    // ── TFSA cumulative room ──────────────────────────────────────────────────
    ["TFSA cum born 1990 = $109,000",  tfsaCumulativeRoom(1990) === 109000],
    ["TFSA cum born 1995 = $89,000",   tfsaCumulativeRoom(1995) === 89000],
    ["TFSA cum born 2008 = $7,000",    tfsaCumulativeRoom(2008) === 7000],  // turns 18 in 2026
    ["TFSA cum born 2007 = $14,000",   tfsaCumulativeRoom(2007) === 14000], // turns 18 in 2025, 2 years
    ["TFSA cum born 2100 = 0",         tfsaCumulativeRoom(2100) === 0],     // future — no room yet

    // ── RRSP estimated limit ──────────────────────────────────────────────────
    ["RRSP limit $0 income = 0",        rrspEstimatedLimit(0) === 0],
    ["RRSP limit $70k = $12,600",       rrspEstimatedLimit(70000) === 12600],
    ["RRSP limit $200k capped $33,810", rrspEstimatedLimit(200000) === 33810],

    // ── Minimum down payment ──────────────────────────────────────────────────
    ["min down $1.2M = $95,000",    minDownPayment(1200000) === 95000],
    ["min down $300k = $15,000",    minDownPayment(300000)  === 15000],
    ["min down $500k = $25,000",    minDownPayment(500000)  === 25000],
    ["min down $600k = $35,000",    minDownPayment(600000)  === 35000],
    ["min down $1.5M = $300,000",   minDownPayment(1500000) === 300000],
    ["min down $1M = $75,000",      minDownPayment(1000000) === 75000],
    ["min down $0 = 0",             minDownPayment(0) === 0],

    // ── OAS clawback ──────────────────────────────────────────────────────────
    ["OAS clawback $95,323 = 0",    oasClawback(95323) === 0],
    ["OAS clawback $110k ≈ $2,201", nearAbs(oasClawback(110000), (110000 - 95323) * 0.15, 1)],
    ["OAS clawback $200k capped",   nearAbs(oasClawback(200000), C.oas.maxPension, 1)],
    ["OAS clawback increases",      oasClawback(120000) > oasClawback(100000)],

    // ── FHSA room ─────────────────────────────────────────────────────────────
    ["FHSA not opened = 0 accrued", fhsaRoomInfo(null, 0).accrued === 0],
    ["FHSA opened 2026 = $8k accrued", fhsaRoomInfo(2026, 0).accrued === 8000],
    ["FHSA opened 2024 = $24k accrued", fhsaRoomInfo(2024, 0).accrued === 24000],
    ["FHSA opened 2024 $16k used = $8k left", fhsaRoomInfo(2024, 16000).available === 8000],
    ["FHSA lifetime capped at $40k", fhsaRoomInfo(2010, 0).accrued === 40000], // >15 yrs capped

    // ── Emergency fund target ─────────────────────────────────────────────────
    ["EF stable 3 months",   emergencyFundTarget(3000, "stable").months === 3],
    ["EF variable 4 months",  emergencyFundTarget(3000, "variable").months === 4],
    ["EF risky 6 months",     emergencyFundTarget(3000, "risky").months === 6],
    ["EF amount = months × expenses", emergencyFundTarget(2500, "stable").amount === 7500],

    // ── pensionTax / retirementMarginal ───────────────────────────────────────
    ["pensionTax $0 = 0",                pensionTax(0, "ON") === 0],
    ["pensionTax $50k ON > 0",           pensionTax(50000, "ON") > 0],
    ["retirementMarginal $0 = 0",        retirementMarginal(0, "ON") === 0],
    ["retirementMarginal increases",     retirementMarginal(80000, "ON") > retirementMarginal(30000, "ON")],

    // ── Dividends / incorporated (personal-side) ──────────────────────────────
    ["non-elig gross-up config = 15%",   C.nonEligDividend.grossUp === 0.15],
    ["elig $100k → taxable $138k",       nearAbs(taxEngine(0, "ON", "incorporated", 0, { eligible: 100000 }).taxable, 138000, 0.01)],
    ["non-elig $100k → taxable $115k",   nearAbs(taxEngine(0, "ON", "incorporated", 0, { nonEligible: 100000 }).taxable, 115000, 0.01)],
    ["dividends carry no CPP",           taxEngine(0, "ON", "incorporated", 0, { nonEligible: 80000 }).cppTotal === 0],
    ["dividends carry no EI",            taxEngine(0, "ON", "incorporated", 0, { nonEligible: 80000 }).ei === 0],
    ["incorporated salary: no EI",       taxEngine(80000, "ON", "incorporated").ei === 0],
    ["incorporated salary: has CPP",     taxEngine(80000, "ON", "incorporated").cppBase > 0],
    ["~$50k eligible div ≈ $0 federal",  taxEngine(0, "ON", "incorporated", 0, { eligible: 50000 }).fedTax < 1],
    ["non-elig taxed more than eligible",taxEngine(0, "ON", "incorporated", 0, { nonEligible: 100000 }).totalTax > taxEngine(0, "ON", "incorporated", 0, { eligible: 100000 }).totalTax],
    ["dividend net > salary net @100k",  taxEngine(0, "ON", "incorporated", 0, { nonEligible: 100000 }).net > taxEngine(100000, "ON", "employed").net],
    ["QC has its own dividend credit",   C.provDivDTC.QC.elig > 0 && C.provDivDTC.ON.elig > 0],

    // ── Schedule-aware projection (life events) ───────────────────────────────
    ["constant schedule == projectFinal", nearAbs(projectSeriesSchedule(0.08, 30, 0, new Array(30).fill(300), 0, null).slice(-1)[0], projectFinal(0.08, 30, 0, 300), 1)],
    ["rising schedule beats flat",        projectSeriesSchedule(0.08, 10, 0, [100,100,100,100,100,500,500,500,500,500], 0, null).slice(-1)[0] > projectSeriesSchedule(0.08, 10, 0, new Array(10).fill(100), 0, null).slice(-1)[0]],
    ["schedule withdrawal reduces total", projectSeriesSchedule(0.08, 10, 0, new Array(10).fill(300), 0, [{ year: 5, amount: 10000 }]).slice(-1)[0] < projectSeriesSchedule(0.08, 10, 0, new Array(10).fill(300), 0, null).slice(-1)[0]],
    ["contributed schedule $300×12×10",   contributedSeriesSchedule(10, 0, new Array(10).fill(300), 0).slice(-1)[0] === 36000],

    // ── yearsUntil (goal due dates) ───────────────────────────────────────────
    ["yearsUntil(null) = null",          yearsUntil(null) === null],
    ["yearsUntil(garbage) = null",       yearsUntil("not-a-date") === null],
    ["yearsUntil future > 0",            yearsUntil("2099-12-31") > 50],
    ["yearsUntil past < 0",              yearsUntil("2000-01-01") < 0],

    // ── splitIncome (extracted dashboard logic) ───────────────────────────────
    ["employed → all salary",            splitIncome(100000, "employed").salaryIncome === 100000 && splitIncome(100000, "employed").dividendIncome === 0],
    ["incorporated all dividends",       splitIncome(100000, "incorporated", "dividends").dividendIncome === 100000 && splitIncome(100000, "incorporated", "dividends").salaryIncome === 0],
    ["incorporated all salary",          splitIncome(100000, "incorporated", "salary").salaryIncome === 100000],
    ["incorporated 60/40 mix",           splitIncome(100000, "incorporated", "mix", 60).salaryIncome === 60000 && splitIncome(100000, "incorporated", "mix", 60).dividendIncome === 40000],
    ["incorporated mix defaults 50/50",  splitIncome(100000, "incorporated", "mix").salaryIncome === 50000],

    // ── retirementWithdrawal (horizon → rate) ─────────────────────────────────
    ["retire 65 → 4.0% / 25×",           retirementWithdrawal(65).rate === 0.040 && retirementWithdrawal(65).multiple === 25],
    ["retire 70 → 4.5% / 22×",           retirementWithdrawal(70).rate === 0.045 && retirementWithdrawal(70).multiple === 22],
    ["retire 55 → 3.5%",                 retirementWithdrawal(55).rate === 0.035],
    ["retire 50 → 3.3%",                 retirementWithdrawal(50).rate === 0.033],
    ["earlier retirement, lower rate",   retirementWithdrawal(55).rate < retirementWithdrawal(65).rate],

    // ── govBenefitsEstimate (CPP/OAS + clawback) ──────────────────────────────
    ["gov benefits before 60 = 0",       govBenefitsEstimate(80000, 55, 50000).govBenefits === 0],
    ["gov benefits @65 $80k = $23,200",  govBenefitsEstimate(80000, 65, 50000).govBenefits === 23200],
    ["no OAS clawback at modest spend",  govBenefitsEstimate(80000, 65, 50000).oasClawApplied === 0],
    ["full OAS clawback at $200k spend", govBenefitsEstimate(300000, 65, 200000).oasClawApplied === 8800],
    ["retiring at 60 lowers CPP",        govBenefitsEstimate(80000, 60, 50000).govBenefits < govBenefitsEstimate(80000, 65, 50000).govBenefits],

    // ── savingsSchedule / savingsEventsFor (life events) ──────────────────────
    ["flat schedule when no events",     savingsSchedule(1000, 40, 5, []).every((m) => m === 1000)],
    ["invest-more bumps from its age",   (() => { const ev = savingsEventsFor([{ type: "invest-more", amount: 500, age: 42 }], 40, 65); const s = savingsSchedule(1000, 40, 5, ev); return s[0] === 1000 && s[2] === 1500; })()],
    ["invest-less floors at 0",          savingsSchedule(300, 40, 3, [{ type: "invest-less", amount: 1000, age: 41 }])[1] === 0],
    ["event at current age excluded",    savingsEventsFor([{ type: "invest-more", amount: 500, age: 40 }], 40, 65).length === 0],
    ["event after retirement excluded",  savingsEventsFor([{ type: "invest-more", amount: 500, age: 70 }], 40, 65).length === 0],
  ];

  const failed = checks.filter(([, ok]) => !ok);
  if (failed.length) {
    console.error("[self-test] FAIL:", failed.map(([name]) => name));
    return false;
  }
  console.log(`[self-test] PASS — all ${checks.length} 2026 checks OK`);
  return true;
}
