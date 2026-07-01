import { describe, it, expect } from "vitest";
import { STAGE_BY_KEY, stageFromAge } from "../data/budgetStages.js";
import {
  createBudget, swapStage, addRow, removeRow, setCell, setRowLabel, fillAcross,
  sectionMonthTotals, sectionAnnual, netCashFlowByMonth, budgetTotals,
  deriveFromPlan, seedFromPlan, planPatchFromBudget, num,
  BUDGET_STORAGE_KEY, PLANNER_YEAR,
  loadBudgetStore, activeBudget, setActiveBudget, budgetYears, switchBudgetYear, addBudgetYear,
} from "./budgetModel.js";

// Helper: set every month of a row to the same value.
const fillRow = (b, section, idx, v) => {
  let next = b;
  for (let m = 0; m < 12; m++) next = setCell(next, section, b[section][idx].id, m, v);
  return next;
};

describe("createBudget", () => {
  it("builds the right row counts per stage", () => {
    const s = createBudget("student");
    expect(s.income).toHaveLength(3);
    expect(s.expenses).toHaveLength(7);
    expect(s.investments).toHaveLength(3);

    const f = createBudget("family");
    expect(f.income).toHaveLength(5);
    expect(f.expenses).toHaveLength(9);
    expect(f.investments).toHaveLength(5);
  });

  it("uses the template's labels", () => {
    const r = createBudget("retirement");
    expect(r.income.map((x) => x.label)).toEqual(STAGE_BY_KEY.retirement.income);
  });

  it("defaults to young_pro for an unknown stage", () => {
    expect(createBudget("nope").lifeStage).toBe("young_pro");
  });
});

describe("stageFromAge", () => {
  it("maps age bands like the workbook", () => {
    expect(stageFromAge(20)).toBe("student");
    expect(stageFromAge(28)).toBe("young_pro");
    expect(stageFromAge(40)).toBe("family");
    expect(stageFromAge(55)).toBe("mid_career");
    expect(stageFromAge(70)).toBe("retirement");
    expect(stageFromAge(0)).toBeNull();
  });
});

describe("swapStage", () => {
  it("keeps entered amounts by position and relabels", () => {
    let b = createBudget("young_pro");
    b = fillRow(b, "income", 0, 1000); // primary income row = $1000/mo
    const swapped = swapStage(b, "family");
    expect(swapped.lifeStage).toBe("family");
    expect(swapped.income[0].label).toBe(STAGE_BY_KEY.family.income[0]); // "Primary Salary"
    expect(sectionAnnual(swapped.income)).toBe(12000); // amount preserved
  });

  it("preserves extra user rows when downsizing stages", () => {
    let b = createBudget("mid_career"); // 6 income rows
    b = fillRow(b, "income", 5, 500);   // last row has data
    const swapped = swapStage(b, "student"); // student has only 3 income labels
    // extra rows beyond the new template are kept, so no amount is lost
    expect(sectionAnnual(swapped.income)).toBe(6000);
    expect(swapped.income.length).toBeGreaterThanOrEqual(6);
  });

  it("is a no-op when the stage is unchanged", () => {
    const b = createBudget("family");
    expect(swapStage(b, "family")).toBe(b);
  });

  it("keeps the user's own rows untouched when applyTemplate is false", () => {
    let b = createBudget("young_pro");
    b = setRowLabel(b, "income", b.income[0].id, "Consulting");
    b = fillRow(b, "income", 0, 1000);
    const kept = swapStage(b, "retirement", false);
    expect(kept.lifeStage).toBe("retirement");      // stage tag changes
    expect(kept.income[0].label).toBe("Consulting"); // but labels are preserved
    expect(kept.income).toHaveLength(4);             // young_pro row count, not retirement's
    expect(sectionAnnual(kept.income)).toBe(12000);
  });
});

describe("totals", () => {
  it("sums months, sections, and net cash flow", () => {
    let b = createBudget("young_pro");
    b = fillRow(b, "income", 0, 5000);       // 60,000/yr income
    b = fillRow(b, "expenses", 0, 2000);     // 24,000/yr expenses
    b = fillRow(b, "investments", 0, 1000);  // 12,000/yr invested

    expect(sectionMonthTotals(b.income)[0]).toBe(5000);
    expect(sectionAnnual(b.income)).toBe(60000);

    const t = budgetTotals(b);
    expect(t.income).toBe(60000);
    expect(t.net).toBe(60000 - 24000 - 12000); // 24,000
    expect(netCashFlowByMonth(b)[0]).toBe(2000);
  });

  it("computes expense and invest rates as a share of income", () => {
    let b = createBudget("young_pro");
    b = fillRow(b, "income", 0, 5000);       // 60,000
    b = fillRow(b, "expenses", 0, 2000);     // 24,000 → 40%
    b = fillRow(b, "investments", 0, 1000);  // 12,000 → 20%
    const t = budgetTotals(b);
    expect(Math.round(t.expenseRate * 100)).toBe(40);
    expect(Math.round(t.investRate * 100)).toBe(20);
  });

  it("rates are 0 when there is no income yet (no divide-by-zero)", () => {
    let b = createBudget("young_pro");
    b = fillRow(b, "expenses", 0, 2000);
    expect(budgetTotals(b).expenseRate).toBe(0);
    expect(budgetTotals(b).investRate).toBe(0);
  });
});

describe("row editing", () => {
  it("adds and removes rows", () => {
    let b = createBudget("student");
    const beforeLen = b.expenses.length;
    b = addRow(b, "expenses");
    expect(b.expenses).toHaveLength(beforeLen + 1);
    const id = b.expenses[b.expenses.length - 1].id;
    b = removeRow(b, "expenses", id);
    expect(b.expenses).toHaveLength(beforeLen);
  });

  it("renames a row and marks the budget customized", () => {
    let b = createBudget("student");
    b = setRowLabel(b, "income", b.income[0].id, "Scholarship");
    expect(b.income[0].label).toBe("Scholarship");
    expect(b.customized).toBe(true);
  });

  it("fills a cell across the rest of the row", () => {
    let b = createBudget("young_pro");
    const id = b.income[0].id;
    b = setCell(b, "income", id, 0, 5000);     // Jan = 5,000
    b = fillAcross(b, "income", id, 0);         // copy across Feb–Dec
    expect(b.income[0].months.every((m) => m === 5000)).toBe(true);
    expect(sectionAnnual(b.income)).toBe(60000);
  });

  it("fill across only touches months to the right of the source", () => {
    let b = createBudget("young_pro");
    const id = b.expenses[0].id;
    b = setCell(b, "expenses", id, 0, 100);    // Jan = 100 (left of source, untouched)
    b = setCell(b, "expenses", id, 5, 800);    // Jun = 800 (source)
    b = fillAcross(b, "expenses", id, 5);
    expect(b.expenses[0].months[0]).toBe(100); // Jan unchanged
    expect(b.expenses[0].months[6]).toBe(800); // Jul filled
    expect(b.expenses[0].months[11]).toBe(800); // Dec filled
  });
});

describe("Planner bridge", () => {
  const plan = { income: 60000, livingExpenses: 2000, monthly: 800, age: 28, birthYear: 1998 };

  it("derives monthly figures and stage from the plan", () => {
    const d = deriveFromPlan(plan);
    expect(d.monthlyIncome).toBe(5000);   // 60,000 / 12
    expect(d.monthlyExpenses).toBe(2000);
    expect(d.monthlySavings).toBe(800);
    expect(d.lifeStage).toBe("young_pro");
    expect(d.birthYear).toBe(1998);
  });

  it("falls back to deriving birth year from age", () => {
    const d = deriveFromPlan({ age: 30 });
    expect(d.birthYear).toBe(new Date().getFullYear() - 30);
  });

  it("seeds the primary row of each section", () => {
    const seeded = seedFromPlan(createBudget("young_pro"), plan);
    expect(seeded.income[0].months.every((m) => m === 5000)).toBe(true);
    expect(seeded.investments[0].months.every((m) => m === 800)).toBe(true);
    expect(seeded.birthYear).toBe(1998);
  });

  it("does not classify an employed under-25 as a student", () => {
    const d = deriveFromPlan({ ...plan, age: 22, employmentType: "employed" });
    expect(d.lifeStage).toBe("young_pro");
  });

  it("still classifies an under-25 with no job/income as a student", () => {
    const d = deriveFromPlan({ age: 20, income: 0 });
    expect(d.lifeStage).toBe("student");
  });

  it("refreshing from the Planner does not clobber a renamed row 0", () => {
    let b = createBudget("young_pro");
    b = setRowLabel(b, "income", b.income[0].id, "Rental income");
    const seeded = seedFromPlan(b, plan);
    expect(seeded.income[0].label).toBe("Rental income");
    expect(seeded.income[0].months.every((m) => m === "")).toBe(true); // untouched
  });

  it("round-trips back into a Planner patch (annual income, monthly savings/expenses)", () => {
    let b = createBudget("young_pro");
    b = fillRow(b, "income", 0, 5000);      // 60,000/yr
    b = fillRow(b, "investments", 0, 800);  // 9,600/yr -> 800/mo
    b = fillRow(b, "expenses", 0, 2000);    // 24,000/yr -> 2,000/mo
    const patch = planPatchFromBudget(b);
    expect(patch.income).toBe(60000);
    expect(patch.monthly).toBe(800);
    expect(patch.livingExpenses).toBe(2000);
    expect(patch.savingsMode).toBe("amount");
  });

  it("syncs birth year and a derived age back to the Planner", () => {
    let b = createBudget("young_pro");
    b = fillRow(b, "income", 0, 5000);
    b.birthYear = 1990;
    const patch = planPatchFromBudget(b);
    expect(patch.birthYear).toBe(1990);
    expect(patch.age).toBe(new Date().getFullYear() - 1990);
  });
});

describe("multi-year store", () => {
  it("rolls a new year forward from the latest, keeping amounts, as an independent copy", () => {
    let b = createBudget("young_pro", PLANNER_YEAR);
    b = fillRow(b, "income", 0, 5000);
    const store = { activeYear: PLANNER_YEAR, years: { [PLANNER_YEAR]: b } };
    const next = addBudgetYear(store);
    expect(next.activeYear).toBe(PLANNER_YEAR + 1);
    expect(budgetYears(next)).toEqual([PLANNER_YEAR, PLANNER_YEAR + 1]);
    expect(next.years[PLANNER_YEAR + 1].year).toBe(PLANNER_YEAR + 1);
    expect(sectionAnnual(next.years[PLANNER_YEAR + 1].income)).toBe(60000); // copied forward
    // editing the new year must not touch the old one
    const edited = setActiveBudget(next, fillRow(next.years[PLANNER_YEAR + 1], "income", 0, 9000));
    expect(sectionAnnual(edited.years[PLANNER_YEAR + 1].income)).toBe(108000);
  });

  it("advances the life-stage key as the user ages into a rolled-forward year, without relabeling rows", () => {
    let b = createBudget("student", PLANNER_YEAR);
    b.birthYear = PLANNER_YEAR - 24; // turns 25 (young_pro band) in PLANNER_YEAR + 1
    b = setRowLabel(b, "income", b.income[0].id, "My custom label");
    const store = { activeYear: PLANNER_YEAR, years: { [PLANNER_YEAR]: b } };
    const next = addBudgetYear(store);
    expect(next.years[PLANNER_YEAR + 1].lifeStage).toBe("young_pro");
    expect(next.years[PLANNER_YEAR + 1].income[0].label).toBe("My custom label"); // untouched
  });

  it("switches the active year", () => {
    const store = { activeYear: PLANNER_YEAR, years: {
      [PLANNER_YEAR]: createBudget("young_pro", PLANNER_YEAR),
      [PLANNER_YEAR + 1]: createBudget("family", PLANNER_YEAR + 1),
    } };
    const sw = switchBudgetYear(store, PLANNER_YEAR + 1);
    expect(sw.activeYear).toBe(PLANNER_YEAR + 1);
    expect(activeBudget(sw).lifeStage).toBe("family");
  });

  it("migrates an old single-budget save into the per-year store", () => {
    let b = createBudget("young_pro", PLANNER_YEAR);
    b = fillRow(b, "income", 0, 5000);
    localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(b)); // legacy single-budget shape
    const store = loadBudgetStore({});
    expect(store.activeYear).toBe(PLANNER_YEAR);
    expect(sectionAnnual(activeBudget(store).income)).toBe(60000);
    localStorage.clear();
  });
});

describe("num", () => {
  it("coerces blanks and junk to 0", () => {
    expect(num("")).toBe(0);
    expect(num(null)).toBe(0);
    expect(num("1,200")).toBe(1200);
    expect(num(42)).toBe(42);
  });
});
