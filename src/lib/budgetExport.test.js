import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { unzipSync } from "fflate";
import { createBudget, setCell } from "./budgetModel.js";
import { buildWorkbook, injectFutureChart } from "./budgetExport.js";

const fill = (b, sec, v) => {
  let next = b;
  for (let m = 0; m < 12; m++) next = setCell(next, sec, b[sec][0].id, m, v);
  return next;
};

describe("budget export workbook", () => {
  it("builds the three required sheets with live formulas", async () => {
    let b = createBudget("young_pro", 2025);
    b = fill(b, "income", 5000);
    b = fill(b, "expenses", 2000);
    b = fill(b, "investments", 800);

    const { wb } = buildWorkbook(ExcelJS, b, null);
    const buf = await wb.xlsx.writeBuffer();

    const wb2 = new ExcelJS.Workbook();
    await wb2.xlsx.load(buf);
    expect(wb2.worksheets.map((w) => w.name)).toEqual(["2025 Budget", "Future Year", "Life Stage Guide"]);

    const ws = wb2.getWorksheet("2025 Budget");
    let salaryRow = null, ncfRow = null;
    ws.eachRow((row, r) => {
      if (row.getCell(1).value === "Salary / Wages") salaryRow = r;
      if (row.getCell(1).value === "NET CASH FLOW") ncfRow = r;
    });
    // Annual column is a live SUM of the 12 months, not a baked number.
    expect(ws.getCell(salaryRow, 14).value).toEqual({ formula: `SUM(B${salaryRow}:M${salaryRow})`, result: undefined });
    // Net cash flow subtracts the expense and investment totals from income.
    expect(ws.getCell(ncfRow, 2).value.formula).toMatch(/^B\d+-B\d+-B\d+$/);
  });

  it("shows every template row so the sheet mirrors the website grid", async () => {
    let b = createBudget("young_pro", 2026);
    b = fill(b, "income", 5000); // only Salary filled, but all rows should still appear
    const { wb } = buildWorkbook(ExcelJS, b, null);
    const buf = await wb.xlsx.writeBuffer();
    const wb2 = new ExcelJS.Workbook();
    await wb2.xlsx.load(buf);
    const ws = wb2.getWorksheet("2026 Budget");
    const labels = [];
    ws.eachRow((row) => labels.push(row.getCell(1).value));
    // Every young-pro template row is present, including the blank ones.
    expect(labels).toContain("Salary / Wages");
    expect(labels).toContain("Investment Income");
    expect(labels).toContain("Other Income");
    expect(labels).toContain("Rent / Mortgage");
  });

  it("injects a native chart wired into the Future Year sheet", async () => {
    let b = createBudget("young_pro", 2026);
    b = fill(b, "income", 5000);
    const { wb, chart } = buildWorkbook(ExcelJS, b, null);
    let buf = await wb.xlsx.writeBuffer();
    buf = await injectFutureChart(buf, chart);

    const files = unzipSync(new Uint8Array(buf));
    const names = Object.keys(files);
    const dec = (k) => new TextDecoder().decode(files[k]);

    // A chart part exists, a drawing rels wires it in, and content types declares it.
    expect(names.some((k) => /^xl\/charts\/chart\d+\.xml$/.test(k))).toBe(true);
    expect(names.filter((k) => /drawings\/_rels/.test(k)).some((k) => /relationships\/chart/.test(dec(k)))).toBe(true);
    expect(dec("[Content_Types].xml")).toMatch(/drawingml\.chart\+xml/);
    // The chart references the dynamic base year's budget sheet, not a hardcoded 2025.
    const chartXml = dec(names.find((k) => /^xl\/charts\/chart\d+\.xml$/.test(k)));
    expect(chartXml).toMatch(/'Future Year'/);
  });
});
