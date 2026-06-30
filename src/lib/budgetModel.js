// Pure, framework-free budget model — all the maths and data-shape logic for the
// Budget tab. Kept separate from the React page so it can be unit-tested directly.

import { STAGES, STAGE_BY_KEY, stageFromAge } from "../data/budgetStages.js";
import { TAX_YEAR } from "./tax-config.js";

export const BUDGET_STORAGE_KEY = "pp-budget-v1";
// The one budget year that syncs with the Planner (a single-tax-year tool).
export const PLANNER_YEAR = TAX_YEAR;
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Stable-ish row ids without pulling in a uuid dep. Deterministic within a session.
let _rowSeq = 0;
const newId = () => `r${Date.now().toString(36)}${(_rowSeq++).toString(36)}`;

export const emptyMonths = () => Array(12).fill("");

// Coerce a cell value to a number (blank / junk → 0).
export const num = (v) => {
  const x = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(x) ? x : 0;
};

const makeRows = (labels) => labels.map((label) => ({ id: newId(), label, months: emptyMonths() }));

// Annual total for one row = sum of its 12 months.
export const rowAnnual = (row) => row.months.reduce((a, m) => a + num(m), 0);

// Per-month column totals for a section (array of 12).
export function sectionMonthTotals(rows) {
  const out = Array(12).fill(0);
  for (const row of rows) for (let i = 0; i < 12; i++) out[i] += num(row.months[i]);
  return out;
}

// Annual total for a whole section.
export const sectionAnnual = (rows) => rows.reduce((a, r) => a + rowAnnual(r), 0);

// Net cash flow per month = income − expenses − investments.
export function netCashFlowByMonth(budget) {
  const inc = sectionMonthTotals(budget.income);
  const exp = sectionMonthTotals(budget.expenses);
  const inv = sectionMonthTotals(budget.investments);
  return inc.map((v, i) => v - exp[i] - inv[i]);
}

// Headline figures used by the summary bar and the Planner push-back.
export function budgetTotals(budget) {
  const income = sectionAnnual(budget.income);
  const expenses = sectionAnnual(budget.expenses);
  const investments = sectionAnnual(budget.investments);
  const net = income - expenses - investments;
  return {
    income, expenses, investments, net,
    monthlyIncome: income / 12,
    monthlyExpenses: expenses / 12,
    monthlyInvestments: investments / 12,
    monthlyNet: net / 12,
    // Share of income going to expenses / investing (0 when no income yet).
    expenseRate: income > 0 ? expenses / income : 0,
    investRate: income > 0 ? investments / income : 0,
  };
}

// Fresh budget for a given stage (defaults to Young Professional).
export function createBudget(stageKey = "young_pro", year = new Date().getFullYear()) {
  const stage = STAGE_BY_KEY[stageKey] || STAGE_BY_KEY.young_pro;
  return {
    lifeStage: stage.key,
    birthYear: "",
    year,
    income: makeRows(stage.income),
    expenses: makeRows(stage.expenses),
    investments: makeRows(stage.investments),
    syncDismissed: false,
    customized: false, // flips true once the user edits — guards the auto-seed
  };
}

// Relabel a section's rows to a new template, KEEPING entered amounts by position.
// Any extra rows the user added beyond the template are preserved (amounts never lost).
function relabel(rows, labels) {
  const out = labels.map((label, i) =>
    rows[i] ? { ...rows[i], label } : { id: newId(), label, months: emptyMonths() });
  for (let i = labels.length; i < rows.length; i++) out.push(rows[i]);
  return out;
}

// Template swap. With applyTemplate=true (default) the row labels + count change
// to the new stage and amounts are kept by position. With applyTemplate=false the
// user keeps their own rows exactly as they are — only the stage tag changes.
export function swapStage(budget, newStageKey, applyTemplate = true) {
  const stage = STAGE_BY_KEY[newStageKey];
  if (!stage || stage.key === budget.lifeStage) return budget;
  if (!applyTemplate) return { ...budget, lifeStage: stage.key };
  return {
    ...budget,
    lifeStage: stage.key,
    income: relabel(budget.income, stage.income),
    expenses: relabel(budget.expenses, stage.expenses),
    investments: relabel(budget.investments, stage.investments),
  };
}

export function addRow(budget, section) {
  const rows = budget[section];
  return { ...budget, [section]: [...rows, { id: newId(), label: "New row", months: emptyMonths() }] };
}

export function removeRow(budget, section, id) {
  return { ...budget, [section]: budget[section].filter((r) => r.id !== id) };
}

export function setCell(budget, section, id, monthIdx, value) {
  const rows = budget[section].map((r) => {
    if (r.id !== id) return r;
    const months = r.months.slice();
    months[monthIdx] = value;
    return { ...r, months };
  });
  return { ...budget, [section]: rows, customized: true };
}

export function setRowLabel(budget, section, id, label) {
  const rows = budget[section].map((r) => (r.id === id ? { ...r, label } : r));
  return { ...budget, [section]: rows, customized: true };
}

// Copy one cell's value across the rest of its row (every month to its right).
// Powers the "fill across" button — type $5,000 once, fill it through December.
export function fillAcross(budget, section, id, fromIdx) {
  const rows = budget[section].map((r) => {
    if (r.id !== id) return r;
    const v = r.months[fromIdx];
    const months = r.months.map((m, i) => (i > fromIdx ? v : m));
    return { ...r, months };
  });
  return { ...budget, [section]: rows, customized: true };
}

// ── Planner ↔ Budget bridge ──────────────────────────────────────────────────

// What the Planner currently implies for the budget (one-way read).
// Planner stores ANNUAL income but MONTHLY savings/expenses.
export function deriveFromPlan(plan = {}) {
  const age = num(plan.age);
  const thisYear = new Date().getFullYear();
  return {
    monthlyIncome: Math.round(num(plan.income) / 12),
    monthlyExpenses: Math.round(num(plan.livingExpenses)),
    monthlySavings: Math.round(num(plan.monthly)),
    lifeStage: stageFromAge(age),
    birthYear: num(plan.birthYear) || (age > 0 ? thisYear - age : ""),
  };
}

// Seed a fresh budget from Planner data: stage + birth year, plus the primary
// row of each section as a starting point (the Planner only knows aggregates,
// so the user redistributes from there — the sync banner says as much).
export function seedFromPlan(budget, plan) {
  const d = deriveFromPlan(plan);
  let next = { ...budget };
  if (d.lifeStage && d.lifeStage !== next.lifeStage) next = swapStage(next, d.lifeStage);
  if (d.birthYear) next.birthYear = d.birthYear;
  const fill = (section, amount) => {
    if (!(amount > 0) || !next[section][0]) return;
    const rows = next[section].slice();
    rows[0] = { ...rows[0], months: Array(12).fill(amount) };
    next[section] = rows;
  };
  fill("income", d.monthlyIncome);
  fill("expenses", d.monthlyExpenses);
  fill("investments", d.monthlySavings);
  return next;
}

// The opt-in push back into the Planner. Returns a partial plan to merge.
// Planner expects ANNUAL income, MONTHLY savings, MONTHLY essential expenses.
export function planPatchFromBudget(budget) {
  const t = budgetTotals(budget);
  const patch = {
    income: Math.round(t.income),
    monthly: Math.round(t.monthlyInvestments),
    livingExpenses: Math.round(t.monthlyExpenses),
    savingsMode: "amount", // a concrete monthly figure, not a % of income
  };
  const by = num(budget.birthYear);
  if (by > 0) {
    patch.birthYear = by;
    const age = new Date().getFullYear() - by; // keep the Planner's age in sync
    if (age > 0 && age < 120) patch.age = age;
  }
  return patch;
}

// ── Multi-year store ─────────────────────────────────────────────────────────
// Budgets are saved per year: { activeYear, years: { [year]: budget } }. Only the
// PLANNER_YEAR budget syncs with the Planner; others are standalone roll-forwards.

const cloneBudget = (b) => JSON.parse(JSON.stringify(b));

// Load (and migrate) the store from localStorage, seeding a planner-year budget
// from the Planner when there's nothing saved yet.
export function loadBudgetStore(plan) {
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(BUDGET_STORAGE_KEY)); } catch { /* ignore */ }
  if (raw && raw.years && raw.activeYear && raw.years[raw.activeYear]) return raw;
  // Migrate an older single-budget save into the per-year shape.
  if (raw && (raw.income !== undefined || raw.expenses !== undefined || raw.lifeStage)) {
    const y = num(raw.year) || PLANNER_YEAR;
    return { activeYear: y, years: { [y]: { ...raw, year: y } } };
  }
  const stage = deriveFromPlan(plan).lifeStage || "young_pro";
  const seeded = seedFromPlan(createBudget(stage, PLANNER_YEAR), plan);
  return { activeYear: PLANNER_YEAR, years: { [PLANNER_YEAR]: seeded } };
}

export const activeBudget = (store) => store.years[store.activeYear];

export function setActiveBudget(store, budget) {
  return { ...store, years: { ...store.years, [store.activeYear]: budget } };
}

export const budgetYears = (store) => Object.keys(store.years).map(Number).sort((a, b) => a - b);

export function switchBudgetYear(store, year) {
  const y = num(year);
  return store.years[y] ? { ...store, activeYear: y } : store;
}

// Add the next year, copying the latest year's rows/amounts as a starting point.
export function addBudgetYear(store) {
  const years = budgetYears(store);
  const latest = years[years.length - 1];
  const newYear = latest + 1;
  if (store.years[newYear]) return { ...store, activeYear: newYear };
  const rolled = { ...cloneBudget(store.years[latest]), year: newYear, syncDismissed: false };
  return { ...store, activeYear: newYear, years: { ...store.years, [newYear]: rolled } };
}

export { STAGES };
