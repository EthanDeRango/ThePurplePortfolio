// Pure tax-calculation functions — no React, fully testable in isolation.
import { TAX_CONFIG } from './tax-config.js';

export function bracketTax(taxable, brackets) {
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
  if (net >= f.bpaPhaseEnd)   return f.bpaBase;
  const frac = (net - f.bpaPhaseStart) / (f.bpaPhaseEnd - f.bpaPhaseStart);
  return f.bpaMax - (f.bpaMax - f.bpaBase) * frac;
}

const num = (x) => { const v = typeof x === "number" ? x : parseFloat(x); return isNaN(v) ? 0 : v; };

// employmentType: "employed" | "self" | "incorporated"
// - self: pays both halves of CPP, no EI
// - incorporated (owner-manager on salary): employee CPP only (corp pays the employer half),
//   and EI-exempt (controlling owners don't pay EI). Dividends carry no CPP/EI at all.
export function contributions(gross, prov, employmentType) {
  const selfEmployed = employmentType === "self" || employmentType === true; // accept legacy boolean
  const incorporated = employmentType === "incorporated";
  const isQC = prov === "QC";
  const C = isQC ? TAX_CONFIG.qpp : TAX_CONFIG.cpp;
  const pen = Math.max(0, Math.min(gross, C.ympe) - C.exemption);
  let base = pen * C.baseRate;
  const cpp2Earn = Math.max(0, Math.min(gross, C.yampe) - C.ympe);
  let cpp2 = cpp2Earn * C.cpp2Rate;
  if (selfEmployed) { base *= 2; cpp2 *= 2; }
  let ei = 0;
  if (!selfEmployed && !incorporated) ei = Math.min(gross, TAX_CONFIG.ei.mie) * (isQC ? TAX_CONFIG.ei.qcRate : TAX_CONFIG.ei.rate);
  let qpip = 0;
  if (isQC && !incorporated) qpip = Math.min(gross, TAX_CONFIG.qpip.mie) * (selfEmployed ? TAX_CONFIG.qpip.selfRate : TAX_CONFIG.qpip.rate);
  return { isQC, pen, cppBase: base, cpp2, ei, qpip, cppTotal: base + cpp2, creditRate: C.creditRate, enhRate: C.enhRate };
}

function cppDeduction(con, selfEmployed) {
  const enhanced = con.pen * con.enhRate;
  if (!selfEmployed) return enhanced + con.cpp2;
  return con.cppTotal / 2 + enhanced + con.cpp2;
}

export function ontarioHealthPremium(t) {
  if (t <= 20000) return 0;
  if (t <= 36000) return Math.min(300,  0.06 * (t - 20000));
  if (t <= 48000) return Math.min(450,  300  + 0.06 * (t - 36000));
  if (t <= 72000) return Math.min(600,  450  + 0.25 * (t - 48000));
  if (t <= 200000) return Math.min(750, 600  + 0.25 * (t - 72000));
  return Math.min(900, 750 + 0.25 * (t - 200000));
}

// dividends (optional): { eligible, nonEligible } — CASH dividend amounts paid to the person.
// They carry NO CPP/EI, are grossed up for tax, then a dividend tax credit is applied.
export function taxEngine(gross, prov, employmentType, deductions = 0, dividends = null) {
  const selfEmployed = employmentType === "self";
  const F = TAX_CONFIG.federal;
  const P = TAX_CONFIG.prov[prov] || TAX_CONFIG.prov.ON;
  const con = contributions(gross, prov, employmentType);
  const cppDed = cppDeduction(con, selfEmployed);

  // Dividends: gross-up + dividend tax credit (personal-side, for incorporated owners)
  const eligCash    = dividends ? num(dividends.eligible) : 0;
  const nonEligCash = dividends ? num(dividends.nonEligible) : 0;
  const eligGross    = eligCash * (1 + TAX_CONFIG.eligDividend.grossUp);
  const nonEligGross = nonEligCash * (1 + TAX_CONFIG.nonEligDividend.grossUp);
  const divTaxable   = eligGross + nonEligGross;
  const ddtc = TAX_CONFIG.provDivDTC[prov] || TAX_CONFIG.provDivDTC.ON;
  const fedDivCredit  = eligGross * TAX_CONFIG.eligDividend.fedDTC + nonEligGross * TAX_CONFIG.nonEligDividend.fedDTC;
  const provDivCredit = eligGross * ddtc.elig + nonEligGross * ddtc.nonElig;

  const taxable = Math.max(0, gross - cppDed - deductions) + divTaxable;

  let fed = bracketTax(taxable, F.brackets);
  const fedCredits =
    fedBPA(taxable) * F.lowRate +
    con.pen * con.creditRate * F.lowRate +
    con.ei * F.lowRate +
    (!selfEmployed && employmentType !== "incorporated" ? F.cea * F.lowRate : 0);
  fed = Math.max(0, fed - fedCredits - fedDivCredit);
  if (con.isQC) fed = fed * (1 - F.qcAbatement);

  let prv = bracketTax(taxable, P.brackets);
  let provCredits = P.bpa * P.low + (con.pen * con.creditRate + con.ei + (con.isQC ? con.qpip : 0)) * P.low;
  prv = Math.max(0, prv - provCredits - provDivCredit);
  if (P.surtax) { let s = 0; for (const x of P.surtax) if (prv > x.over) s += (prv - x.over) * x.rate; prv += s; }
  if (P.healthPremium) prv += ontarioHealthPremium(taxable);

  const totalTax = fed + prv;
  const stat = con.cppTotal + con.ei + con.qpip;
  const cashIncome = gross + eligCash + nonEligCash;
  const net = cashIncome - stat - totalTax;
  return {
    gross: cashIncome, salary: gross, prov, taxable, cppDed,
    eligDiv: eligCash, nonEligDiv: nonEligCash, divTaxable, divCredit: fedDivCredit + provDivCredit,
    cppBase: con.cppBase, cpp2: con.cpp2, cppTotal: con.cppTotal, ei: con.ei, qpip: con.qpip,
    fedTax: fed, provTax: prv, totalTax, statutory: stat,
    net, netMonthly: net / 12,
    avgRate: cashIncome > 0 ? totalTax / cashIncome : 0,
    avgRateAll: cashIncome > 0 ? (stat + totalTax) / cashIncome : 0,
    isQC: con.isQC, selfEmployed,
  };
}

// Marginal rate on ORDINARY income (matches published combined tables).
// Uses a ±$100 deduction window to smooth health-premium notches.
export function marginalRate(gross, prov, employmentType, deductions = 0) {
  const a = taxEngine(gross, prov, employmentType, deductions).totalTax;
  const b = taxEngine(gross, prov, employmentType, deductions - 100).totalTax;
  return (b - a) / 100;
}

// Federal + provincial INCOME TAX on pension/RRIF income — no CPP/EI, no employment amount.
export function pensionTax(income, prov) {
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

// Retirement (pension) marginal rate — averaged over ±$1,000 to smooth health-premium notches.
export function retirementMarginal(income, prov) {
  if (income <= 0) return 0;
  return Math.max(0, (pensionTax(income + 1000, prov) - pensionTax(Math.max(0, income - 1000), prov)) / 2000);
}

// Exact tax saved from a deduction (handles bracket crossing).
export function deductionSaving(gross, prov, employmentType, contribution, existing = 0) {
  const before = taxEngine(gross, prov, employmentType, existing).totalTax;
  const after  = taxEngine(gross, prov, employmentType, existing + contribution).totalTax;
  return Math.max(0, before - after);
}
