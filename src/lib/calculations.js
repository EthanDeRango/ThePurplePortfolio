// Pure calculation helpers — no React. Import anywhere (tests, engine, UI).
import { TAX_CONFIG, TAX_YEAR, RISK, HBP_LIMIT } from './tax-config.js';
import { taxEngine, marginalRate, retirementMarginal, deductionSaving } from './tax-engine.js';

// ── Numeric helpers ───────────────────────────────────────────────────────────
export const n = (v) => (v === "" || v == null || isNaN(Number(v)) ? 0 : Number(v));
export const fmtMoney  = (x) => (x < 0 ? "-$" : "$") + Math.abs(Math.round(x)).toLocaleString("en-CA");
export const fmtMoney2 = (x) => (x < 0 ? "-$" : "$") + Math.abs(x).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmtShort  = (x) => x >= 1e6 ? "$" + (x / 1e6).toFixed(x >= 1e7 ? 0 : 1) + "M" : x >= 1e3 ? "$" + Math.round(x / 1e3) + "k" : "$" + Math.round(x);
export const pct1 = (x) => (x * 100).toFixed(1) + "%";
export const pct2 = (x) => (x * 100).toFixed(2) + "%";

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const monthIndexOf = (iso) => {
  if (!iso) return 0;
  const p = String(iso).split("-");
  const mi = parseInt(p[1], 10) - 1;
  return isNaN(mi) ? 0 : Math.max(0, Math.min(11, mi));
};

// ── Risk / return ─────────────────────────────────────────────────────────────
export const riskBy   = (k) => RISK.find((r) => r.key === k) || RISK[1];
export const planRate = (plan) => {
  if (plan && plan.risk === "custom") { const r = Number(plan.customRate); return isNaN(r) ? 0.08 : r / 100; }
  return riskBy(plan ? plan.risk : "moderate").ret;
};

// ── Projection maths ──────────────────────────────────────────────────────────
export function fv(rate, months, start, monthly) {
  const i = rate / 12;
  if (i === 0) return start + monthly * months;
  const pow = Math.pow(1 + i, months);
  return start * pow + monthly * ((pow - 1) / i);
}

// Monthly-compounded projection; optional 12-length custom schedule for year 1.
// startMonth (0=Jan) skips months already elapsed in the current calendar year.
export function projectSeries(rate, years, startBal, monthly, monthsArr, startMonth) {
  const i  = rate / 12;
  const sm = startMonth ? Math.max(0, Math.min(11, startMonth)) : 0;
  let bal  = startBal;
  const out    = [bal];
  const custom = monthsArr && monthsArr.length === 12;
  for (let y = 0; y < years; y++) {
    for (let mo = 0; mo < 12; mo++) {
      if (y === 0 && mo < sm) continue;
      bal = bal * (1 + i);
      bal += (y === 0 && custom) ? n(monthsArr[mo]) : monthly;
    }
    out.push(bal);
  }
  return out;
}

export function projectFinal(rate, years, startBal, monthly, monthsArr, startMonth) {
  const s = projectSeries(rate, years, startBal, monthly, monthsArr, startMonth);
  return s[s.length - 1];
}

export function totalContributed(years, startBal, monthly, monthsArr, startMonth) {
  const custom = monthsArr && monthsArr.length === 12;
  const sm = startMonth ? Math.max(0, Math.min(11, startMonth)) : 0;
  let y1 = 0;
  for (let mo = sm; mo < 12; mo++) y1 += custom ? n(monthsArr[mo]) : monthly;
  return startBal + y1 + monthly * 12 * Math.max(0, years - 1);
}

export function contributedSeries(years, startBal, monthly, monthsArr, startMonth) {
  const out = [startBal];
  for (let y = 1; y <= years; y++) out.push(totalContributed(y, startBal, monthly, monthsArr, startMonth));
  return out;
}

// ── Canadian financial rules ──────────────────────────────────────────────────
export function minDownPayment(price) {
  if (!price || price <= 0) return 0;
  if (price >= 1500000) return price * 0.20;
  if (price <= 500000)  return price * 0.05;
  return 500000 * 0.05 + (price - 500000) * 0.10;
}

export function emergencyFundTarget(expenses, stability) {
  const months = stability === "stable" ? 3 : stability === "risky" ? 6 : 4;
  return { months, amount: Math.max(0, n(expenses)) * months };
}

export function oasClawback(retIncome) {
  const o = TAX_CONFIG.oas;
  const over = Math.max(0, n(retIncome) - o.thresholdMin);
  return Math.min(o.maxPension, over * o.rate);
}

// ── TFSA / RRSP / FHSA room ───────────────────────────────────────────────────
export function tfsaCumulativeRoom(birthYear) {
  const h = TAX_CONFIG.tfsa.history;
  if (!birthYear) return TAX_CONFIG.tfsa.cumulative2026;
  const yr18 = birthYear + 18;
  let total = 0;
  for (let y = Math.max(2009, yr18); y <= TAX_YEAR; y++) total += h[y] || 0;
  return total;
}

export function rrspEstimatedLimit(prevIncome) {
  return Math.min((prevIncome || 0) * TAX_CONFIG.rrsp.pct, TAX_CONFIG.rrsp.dollarMax);
}

export function fhsaDeadline(yearOpened) {
  if (!yearOpened) return null;
  const closeByParticipation = yearOpened + TAX_CONFIG.fhsa.participationYears;
  const yearsLeft = closeByParticipation - TAX_YEAR;
  return { closeBy: closeByParticipation, yearsLeft };
}

// FHSA room ACCRUES at $8k/yr from the year you open it (not all $40k at once).
export function fhsaRoomInfo(yearOpened, lifetimeUsed) {
  const F    = TAX_CONFIG.fhsa;
  const used = Math.max(0, n(lifetimeUsed));
  if (!yearOpened) return { opened: false, accrued: 0, available: 0, thisYearRoom: F.annual, used };
  const yearsOpen   = Math.max(1, TAX_YEAR - n(yearOpened) + 1);
  const accrued     = Math.min(F.lifetime, yearsOpen * F.annual);
  const available   = Math.max(0, accrued - used);
  const thisYearRoom = Math.min(F.maxYear, available);
  return { opened: true, yearsOpen, accrued, available, thisYearRoom, used };
}

// ── Bracket navigator ─────────────────────────────────────────────────────────
export function bracketInfo(gross, prov, employmentType, deductions = 0) {
  const F = TAX_CONFIG.federal;
  const P = TAX_CONFIG.prov[prov] || TAX_CONFIG.prov.ON;
  const bounds = Array.from(
    new Set([...F.brackets, ...P.brackets].map((b) => b.to).filter((x) => isFinite(x)))
  ).sort((a, b) => a - b);
  const selfEmployed = employmentType === "self";
  const { taxable } = taxEngine(gross, prov, employmentType, deductions);
  const cur  = marginalRate(gross, prov, employmentType, deductions);
  const up   = bounds.find((b) => b > taxable + 0.5);
  const belows = bounds.filter((b) => b <= taxable - 0.5);
  const down = belows.length ? belows[belows.length - 1] : null;
  let toNext = null, rateAbove = null, toLower = null, rateBelow = null;
  if (up   != null) { toNext  = up - taxable;     rateAbove = marginalRate(gross + toNext + 300, prov, employmentType, deductions); }
  if (down != null) { toLower = taxable - down;   rateBelow = marginalRate(gross, prov, employmentType, deductions + toLower + 250); }
  return { taxable, cur, up, toNext, rateAbove, down, toLower, rateBelow };
}

// ── Strategy simulation ───────────────────────────────────────────────────────
export function annualInvestable(plan) {
  const custom = plan.contribMode === "custom" && plan.months;
  return custom ? plan.months.reduce((a, b) => a + n(b), 0) : n(plan.monthly) * 12;
}

function allocate(pool, order, caps) {
  const a = { tfsa: 0, rrsp: 0, fhsa: 0, taxable: 0 };
  let left = pool;
  for (const acct of order) {
    if (left <= 0) break;
    const cap = caps[acct] == null ? Infinity : caps[acct];
    const put = Math.max(0, Math.min(left, cap));
    a[acct] += put; left -= put;
  }
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

export function recommendOrder(goal, buyHome, marginal) {
  const high = marginal >= 0.30;
  if (buyHome || goal === "house") return high ? ["fhsa", "rrsp", "tfsa"] : ["fhsa", "tfsa", "rrsp"];
  return high ? ["rrsp", "tfsa", "fhsa"] : ["tfsa", "rrsp", "fhsa"];
}

export function simulateStrategy(order, ctx, mode) {
  const { years, r, income, marginal, retMarginal, startTfsa, startRrsp, startFhsa, annualInvest, homeIdx, eligFhsa, buyingHome, fhsaCloseIdx } = ctx;
  let bal = { tfsa: startTfsa, rrsp: startRrsp, fhsa: startFhsa, taxable: 0 };
  let fhsaContrib = 0, refundYr1 = 0, downAtHome = null, lastRefund = 0, yr1 = null, fhsaClosed = false;
  const rrspAnnual = Math.min(TAX_CONFIG.rrsp.dollarMax, Math.max(3000, income * 0.18));
  const closeIdx = buyingHome
    ? homeIdx
    : Math.min(fhsaCloseIdx != null ? fhsaCloseIdx : years, years);

  for (let y = 0; y < Math.max(1, years); y++) {
    const pool    = annualInvest + (y > 0 ? lastRefund : 0);
    const fhsaCap = (eligFhsa && !fhsaClosed)
      ? Math.min(TAX_CONFIG.fhsa.annual, Math.max(0, TAX_CONFIG.fhsa.lifetime - fhsaContrib))
      : 0;
    const caps  = { fhsa: fhsaCap, tfsa: TAX_CONFIG.tfsa.annual, rrsp: rrspAnnual };
    const alloc = mode === "balanced" ? balancedAlloc(pool, caps) : allocate(pool, order, caps);
    if (y === 0) yr1 = alloc;
    bal.tfsa += alloc.tfsa; bal.rrsp += alloc.rrsp; bal.fhsa += alloc.fhsa; bal.taxable += alloc.taxable;
    fhsaContrib += alloc.fhsa;
    const refund = (alloc.rrsp + alloc.fhsa) * marginal;
    if (y === 0) refundYr1 = refund;
    lastRefund = refund;
    bal.tfsa *= (1 + r); bal.rrsp *= (1 + r); bal.fhsa *= (1 + r); bal.taxable *= (1 + r);
    if (homeIdx != null && (y + 1) === homeIdx) downAtHome = bal.fhsa + bal.tfsa + Math.min(bal.rrsp, HBP_LIMIT);
    if (closeIdx != null && (y + 1) === closeIdx && !fhsaClosed) {
      if (buyingHome) { bal.fhsa = 0; }
      else            { bal.rrsp += bal.fhsa; bal.fhsa = 0; }
      fhsaClosed = true;
    }
  }
  const gross    = bal.tfsa + bal.rrsp + bal.fhsa + bal.taxable;
  const afterTax = bal.tfsa + bal.fhsa + bal.taxable + bal.rrsp * (1 - retMarginal);
  return { gross, afterTax, refundYr1, downAtHome, bal, yr1 };
}

export function fiTarget(annualSpend) { return { number: Math.max(0, annualSpend) * 25, swr: 0.04 }; }

export function yearsToTarget(target, r, startTotal, annualInvest) {
  if (target <= 0) return 0;
  let bal = startTotal;
  for (let y = 0; y <= 70; y++) {
    if (bal >= target) return y;
    bal = bal * (1 + r) + annualInvest;
  }
  return null;
}

export function healthScore(ctx) {
  const { hasEmergency, income, annualInvest, buyHome, marginal, projRetIncome, targetSpend, downProj, downNeed } = ctx;
  const clamp = (x) => Math.max(0, Math.min(10, Math.round(x)));
  const parts = [];
  parts.push({ key: "ef", label: "Emergency fund", score: hasEmergency ? 10 : 2, tip: hasEmergency ? "Funded — a solid foundation." : "Build 3–6 months of essentials before investing heavily." });
  const sr = income > 0 ? annualInvest / income : 0;
  parts.push({ key: "sr", label: "Savings rate", score: clamp((sr / 0.20) * 10), tip: sr >= 0.15 ? `Strong — you're investing ${pct1(sr)} of income.` : `Investing ~${pct1(sr)} of income; aiming for 15–20% accelerates every goal.` });
  let te = 5; if (annualInvest > 0) te += 3; if (buyHome) te += 2; te = Math.max(3, Math.min(10, te));
  parts.push({ key: "te", label: "Tax efficiency", score: te, tip: marginal >= 0.30 ? "At your bracket, prioritizing RRSP/FHSA deductions captures the most tax." : "Your bracket is moderate — the TFSA is often the efficient first home for savings." });
  const rp = targetSpend > 0 ? clamp((projRetIncome / targetSpend) * 10) : 5;
  parts.push({ key: "ret", label: "Retirement progress", score: rp, tip: rp >= 8 ? "On track to replace your target income." : "Raising contributions or time in market lifts this most." });
  if (buyHome && downNeed > 0) parts.push({ key: "home", label: "Home readiness", score: clamp((downProj / downNeed) * 10), tip: (downProj >= downNeed) ? "On pace for your minimum down payment." : "More monthly savings or a later target date closes the gap." });
  const overall = Math.round(parts.reduce((a, p) => a + p.score, 0) / parts.length * 10);
  return { overall, parts };
}

// ── Dashboard helpers ─────────────────────────────────────────────────────────
export function accounts(plan) {
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

export function insights(plan, marginal) {
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
