// Professional .xlsx export for the Budget tab — three sheets ("{year} Budget",
// "Future Year", "Life Stage Guide") styled like something a wealth manager
// would actually hand a client: a clean white letterhead, restrained colour,
// accounting number formats, and live formulas. A native bar chart is injected
// into the Future Year sheet afterwards (ExcelJS has no chart support of its own).
//
// ExcelJS and fflate are dynamically imported inside exportBudget() so they stay
// out of the main app bundle.

import { STAGE_BY_KEY, LIFE_STAGE_GUIDE } from "../data/budgetStages.js";
import { num, budgetTotals } from "./budgetModel.js";

// ── Palette (ARGB) — muted, banker-grade ─────────────────────────────────────
const PLUM = "FF2E1452";      // primary brand dark
const PLUM_SOFT = "FFEDE8F6"; // light lavender — section headers / totals
const PLUM_LINE = "FFC9B6EE"; // lavender rule
const GOLD = "FFB8972E";
const INK = "FF1E1128";
const GREY = "FF6A5872";
const ZEBRA = "FFF8F7FC";     // subtle alternating row
const LINE = "FFE7E3F0";      // hairline gridline
const SLATE = "FFECEFF4";     // net-cash-flow band on the Future sheet
const WHITE = "FFFFFFFF";

// Accounting format: positive · red negative in parens · blank when zero.
const MONEY = '$#,##0;[Red]($#,##0);""';
const FONT = "Calibri";
const COLS = 14; // A = Category, B–M = Jan–Dec, N = Annual

const solid = (argb) => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
const border = (style, argb) => ({ style, color: { argb } });

function colLetter(c) {
  let s = "";
  while (c > 0) { const m = (c - 1) % 26; s = String.fromCharCode(65 + m) + s; c = (c - m - 1) / 26; }
  return s;
}

async function loadLogo() {
  try {
    const res = await fetch("/logo.jpg");
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result).split(",")[1] || null);
      fr.onerror = () => resolve(null);
      fr.readAsDataURL(blob);
    });
  } catch { return null; }
}

// White letterhead: floating logo (on white, so it never clashes), wordmark,
// subtitle, and a thin gold rule. Shared by all three sheets.
function letterhead(ws, wb, logo, title, subtitle, lastCol) {
  // The logo lives only on the Budget sheet (so it never collides with the
  // injected chart's drawing on the Future sheet). Without it, the title starts
  // at column A. When present, columns A–B are reserved for the crest.
  const startCol = logo ? 3 : 1;
  if (logo) {
    const id = wb.addImage({ base64: logo, extension: "jpeg" });
    ws.addImage(id, { tl: { col: 0.18, row: 0.12 }, ext: { width: 44, height: 42 } });
  }
  ws.mergeCells(1, startCol, 1, lastCol);
  const t = ws.getCell(1, startCol);
  t.value = title;
  t.font = { name: FONT, size: 16, bold: true, color: { argb: PLUM } };
  t.alignment = { vertical: "middle", horizontal: "left" };
  ws.getRow(1).height = 26;

  ws.mergeCells(2, startCol, 2, lastCol);
  const s = ws.getCell(2, startCol);
  s.value = subtitle;
  s.font = { name: FONT, size: 10.5, color: { argb: GREY } };
  s.alignment = { vertical: "middle", horizontal: "left" };
  ws.getRow(2).height = 16;

  // Gold rule across row 3.
  for (let c = 1; c <= lastCol; c++) {
    ws.getCell(3, c).border = { bottom: border("medium", GOLD) };
  }
  ws.getRow(3).height = 6;
}

// ── Sheet 1: the budget grid ─────────────────────────────────────────────────
function buildBudgetSheet(wb, budget, logo) {
  const ws = wb.addWorksheet(`${budget.year} Budget`, { views: [{ showGridLines: false }] });
  ws.getColumn(1).width = 28;
  for (let c = 2; c <= 13; c++) ws.getColumn(c).width = 10.5;
  ws.getColumn(COLS).width = 13;

  const stageName = (STAGE_BY_KEY[budget.lifeStage] || {}).name || budget.lifeStage;
  const sub = `${budget.year} Budget Planner   ·   Life Stage: ${stageName}` + (budget.birthYear ? `   ·   Born ${budget.birthYear}` : "");
  letterhead(ws, wb, logo, "THE PURPLE PORTFOLIO", sub, COLS);

  // Column header row.
  let r = 5;
  const headers = ["CATEGORY", "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "ANNUAL"];
  headers.forEach((h, i) => {
    const cell = ws.getCell(r, i + 1);
    cell.value = h;
    cell.fill = solid(PLUM);
    cell.font = { name: FONT, size: 10.5, bold: true, color: { argb: i === COLS - 1 ? GOLD : WHITE } };
    cell.alignment = { vertical: "middle", horizontal: i === 0 ? "left" : "center" };
    cell.border = { bottom: border("medium", GOLD) };
  });
  ws.getRow(r).height = 22;

  const totalRows = {};
  const sections = [
    { title: "INCOME", key: "income" },
    { title: "EXPENSES", key: "expenses" },
    { title: "INVESTMENTS & SAVINGS", key: "investments" },
  ];

  for (const sec of sections) {
    // Show every template row for the stage, so the sheet mirrors the website grid.
    r += 2; // a little air before each section
    ws.getRow(r - 1).height = 6;
    // Section header band — soft lavender, plum text, a single gold accent.
    ws.mergeCells(r, 1, r, COLS);
    const hc = ws.getCell(r, 1);
    hc.value = sec.title;
    hc.font = { name: FONT, size: 11, bold: true, color: { argb: PLUM } };
    hc.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    for (let c = 1; c <= COLS; c++) ws.getCell(r, c).fill = solid(PLUM_SOFT);
    ws.getCell(r, 1).border = { left: border("thick", GOLD), bottom: border("thin", PLUM_LINE) };
    ws.getRow(r).height = 19;

    const firstDataRow = r + 1;
    budget[sec.key].forEach((row, idx) => {
      r += 1;
      const zebra = idx % 2 === 1;
      const label = ws.getCell(r, 1);
      label.value = row.label;
      label.font = { name: FONT, size: 10.5, bold: true, color: { argb: INK } };
      label.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
      for (let c = 2; c <= 13; c++) {
        const v = num(row.months[c - 2]);
        const cell = ws.getCell(r, c);
        cell.value = v !== 0 ? v : null;
        cell.numFmt = MONEY;
        cell.font = { name: FONT, size: 10.5, color: { argb: INK } };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      }
      const annual = ws.getCell(r, COLS);
      annual.value = { formula: `SUM(B${r}:M${r})` };
      annual.numFmt = MONEY;
      annual.font = { name: FONT, size: 10.5, bold: true, color: { argb: PLUM } };
      annual.alignment = { vertical: "middle", horizontal: "center" };
      // fills + hairlines; thin rule separates the label column from the months
      for (let c = 1; c <= COLS; c++) {
        const cell = ws.getCell(r, c);
        if (!cell.fill) cell.fill = solid(zebra ? ZEBRA : WHITE);
        cell.border = { bottom: border("thin", LINE), ...(c === 1 ? { right: border("thin", PLUM_LINE) } : {}) };
      }
      ws.getCell(r, COLS).fill = solid(zebra ? "FFF1ECF9" : "FFF6F1FC");
      ws.getRow(r).height = 18;
    });
    const lastDataRow = r;

    // TOTAL row — stronger lavender, gold accent, bold plum.
    r += 1;
    ws.getCell(r, 1).value = `Total ${sec.title.toLowerCase()}`;
    for (let c = 2; c <= COLS; c++) {
      const L = colLetter(c);
      ws.getCell(r, c).value = { formula: `SUM(${L}${firstDataRow}:${L}${lastDataRow})` };
      ws.getCell(r, c).numFmt = MONEY;
    }
    for (let c = 1; c <= COLS; c++) {
      const cell = ws.getCell(r, c);
      cell.fill = solid("FFE3D9F2");
      cell.font = { name: FONT, size: 10.5, bold: true, color: { argb: PLUM } };
      cell.alignment = { vertical: "middle", horizontal: c === 1 ? "left" : "center" };
      cell.border = { top: border("medium", PLUM), bottom: border("thin", PLUM_LINE), ...(c === 1 ? { left: border("thick", GOLD) } : {}) };
    }
    ws.getCell(r, 1).alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    totalRows[sec.key] = r;
  }

  // NET CASH FLOW — the punchline: solid plum band, white bold, gold annual.
  // Parens for negatives (white on plum, no jarring red).
  r += 2;
  ws.getRow(r - 1).height = 8;
  ws.getCell(r, 1).value = "NET CASH FLOW";
  for (let c = 2; c <= COLS; c++) {
    const L = colLetter(c);
    ws.getCell(r, c).value = { formula: `${L}${totalRows.income}-${L}${totalRows.expenses}-${L}${totalRows.investments}` };
    ws.getCell(r, c).numFmt = '$#,##0;($#,##0);""';
  }
  for (let c = 1; c <= COLS; c++) {
    const cell = ws.getCell(r, c);
    cell.fill = solid(PLUM);
    // Crisp white throughout; the annual total a touch larger so it still pops.
    cell.font = { name: FONT, size: c === COLS ? 12 : 11.5, bold: true, color: { argb: WHITE } };
    cell.alignment = { vertical: "middle", horizontal: c === 1 ? "left" : "center" };
    cell.border = { top: border("medium", GOLD), bottom: border("medium", GOLD) };
  }
  ws.getCell(r, 1).alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(r).height = 24;
  const netRowNum = r;

  // Savings-rate footnote (the wealth-manager headline, in one quiet line).
  const t = budgetTotals(budget);
  if (t.income > 0) {
    r += 1;
    ws.mergeCells(r, 1, r, COLS);
    const fn = ws.getCell(r, 1);
    fn.value = `Savings rate: ${Math.round(t.investRate * 100)}% of income invested   ·   Net surplus: ${Math.round((t.net / t.income) * 100)}% of income`;
    fn.font = { name: FONT, size: 9.5, italic: true, color: { argb: GREY } };
    fn.alignment = { horizontal: "right" };
    ws.getRow(r).height = 16;
  }

  return {
    sheetName: `${budget.year} Budget`,
    incomeTotal: `N${totalRows.income}`,
    expenseTotal: `N${totalRows.expenses}`,
    investTotal: `N${totalRows.investments}`,
    netTotal: `N${netRowNum}`,
  };
}

// ── Sheet 2: future-year projections ─────────────────────────────────────────
// Returns the chart's data ranges so a native chart can be injected afterwards.
function buildFutureSheet(wb, budget, ref, logo) {
  const ws = wb.addWorksheet("Future Year", { views: [{ showGridLines: false }] });
  const base = num(budget.year) || new Date().getFullYear();
  const LAST = 12; // columns A..L  (A label + base..base+10 = 11 years)
  ws.getColumn(1).width = 22;
  for (let c = 2; c <= LAST; c++) ws.getColumn(c).width = 12;

  letterhead(ws, wb, logo, "FUTURE-YEAR PROJECTIONS",
    `Starting from your ${base} budget. Edit the growth rates and every projected year updates.`, LAST);

  const q = (a) => `'${ref.sheetName}'!${a}`;
  const sectionHead = (row, text, span) => {
    ws.mergeCells(row, 1, row, span);
    const c = ws.getCell(row, 1);
    c.value = text;
    c.font = { name: FONT, size: 11, bold: true, color: { argb: PLUM } };
    c.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    for (let i = 1; i <= span; i++) ws.getCell(row, i).fill = solid(PLUM_SOFT);
    ws.getCell(row, 1).border = { left: border("thick", GOLD) };
    ws.getRow(row).height = 19;
  };

  // ── Growth assumptions (3 simple, editable rates) ──
  let r = 5;
  sectionHead(r, "GROWTH ASSUMPTIONS  ·  edit these", LAST);
  r += 1;
  ["Category", "Annual growth", "What this assumes"].forEach((h, i) => {
    const cell = ws.getCell(r, i + 1);
    cell.value = h;
    cell.font = { name: FONT, size: 10, bold: true, color: { argb: GREY } };
    cell.alignment = { horizontal: i === 1 ? "center" : "left" };
    cell.border = { bottom: border("thin", PLUM_LINE) };
  });
  ws.mergeCells(r, 3, r, LAST);

  const growth = [
    { label: "Income", pct: 0.04, note: "Pay tends to rise with your career" },
    { label: "Expenses", pct: 0.03, note: "Roughly inflation" },
    { label: "Investments", pct: 0.05, note: "You invest a little more each year" },
  ];
  const growthRow = {};
  growth.forEach((g) => {
    r += 1;
    ws.getCell(r, 1).value = g.label;
    ws.getCell(r, 1).font = { name: FONT, size: 10.5, bold: true, color: { argb: INK } };
    const pc = ws.getCell(r, 2);
    pc.value = g.pct; pc.numFmt = "0%";
    pc.font = { name: FONT, size: 11, bold: true, color: { argb: PLUM } };
    pc.alignment = { horizontal: "center" };
    pc.fill = solid("FFFBF6E8"); // faint gold = "editable"
    pc.border = { outline: border("thin", GOLD) };
    ws.mergeCells(r, 3, r, LAST);
    const nc = ws.getCell(r, 3);
    nc.value = g.note;
    nc.font = { name: FONT, size: 10, italic: true, color: { argb: GREY } };
    growthRow[g.label] = r;
  });

  // ── Multi-year projection ──
  r += 2;
  sectionHead(r, `PROJECTION  ·  ${base}–${base + 10}`, LAST);

  // Year header row.
  r += 1;
  const yearRow = r;
  ws.getCell(r, 1).value = "";
  const years = [];
  for (let y = base; y <= base + 10; y++) years.push(y);
  years.forEach((y, i) => {
    const cell = ws.getCell(r, i + 2);
    cell.value = y;
    cell.font = { name: FONT, size: 10.5, bold: true, color: { argb: i === 0 ? GOLD : WHITE } };
    cell.fill = solid(PLUM);
    cell.alignment = { horizontal: "center" };
  });
  const baseLabel = ws.getCell(r, 1);
  baseLabel.value = "$ per year";
  baseLabel.font = { name: FONT, size: 9.5, italic: true, color: { argb: GREY } };

  // Rows: Income, Expenses, Investments, Net cash flow.
  const projRows = [
    { label: "Income", base: q(ref.incomeTotal), grow: growthRow.Income },
    { label: "Expenses", base: q(ref.expenseTotal), grow: growthRow.Expenses },
    { label: "Investments", base: q(ref.investTotal), grow: growthRow.Investments },
  ];
  const rowOf = {};
  projRows.forEach((pr, idx) => {
    r += 1;
    rowOf[pr.label] = r;
    ws.getCell(r, 1).value = pr.label;
    ws.getCell(r, 1).font = { name: FONT, size: 10.5, bold: true, color: { argb: INK } };
    ws.getCell(r, 1).border = { left: border("thick", GOLD) };
    years.forEach((y, i) => {
      const cell = ws.getCell(r, i + 2);
      const L = colLetter(i + 2);
      const prev = colLetter(i + 1);
      cell.value = i === 0 ? { formula: pr.base } : { formula: `${prev}${r}*(1+$B$${pr.grow})` };
      cell.numFmt = MONEY;
      cell.font = { name: FONT, size: 10.5, color: { argb: INK } };
      cell.alignment = { horizontal: "center" };
      cell.fill = solid(idx % 2 ? ZEBRA : WHITE);
      cell.border = { bottom: border("thin", LINE) };
    });
  });
  // Net cash flow = income − expenses − investments per year.
  r += 1;
  const netRow = r;
  ws.getCell(r, 1).value = "Net cash flow";
  years.forEach((y, i) => {
    const L = colLetter(i + 2);
    const cell = ws.getCell(r, i + 2);
    cell.value = { formula: `${L}${rowOf.Income}-${L}${rowOf.Expenses}-${L}${rowOf.Investments}` };
    cell.numFmt = MONEY;
  });
  for (let c = 1; c <= LAST; c++) {
    const cell = ws.getCell(r, c);
    cell.fill = solid(SLATE);
    cell.font = { name: FONT, size: 10.5, bold: true, color: { argb: INK } };
    cell.alignment = { horizontal: c === 1 ? "left" : "center" };
    cell.border = { top: border("medium", PLUM) };
  }

  // Footnote.
  r += 2;
  ws.mergeCells(r, 1, r, LAST);
  const note = ws.getCell(r, 1);
  note.value = `${base} is your current budget. Later years grow each prior year by the rates above. The chart below tracks income, expenses and net cash flow over time.`;
  note.font = { name: FONT, size: 9.5, italic: true, color: { argb: GREY } };
  note.alignment = { wrapText: true, vertical: "top" };
  ws.getRow(r).height = 26;

  return {
    chartAnchorRow: r + 1, // chart sits below the note
    yearRow, incomeRow: rowOf.Income, expenseRow: rowOf.Expenses, netRow,
    firstCol: 2, lastCol: LAST,
  };
}

// ── Sheet 3: life-stage reference guide ──────────────────────────────────────
function buildGuideSheet(wb, logo) {
  const ws = wb.addWorksheet("Life Stage Guide", { views: [{ showGridLines: false }] });
  ws.getColumn(1).width = 20;
  ws.getColumn(2).width = 32; ws.getColumn(3).width = 32; ws.getColumn(4).width = 30;
  letterhead(ws, wb, logo, "LIFE STAGE GUIDE", "How income, spending and accounts shift as life changes.", 4);

  let r = 5;
  ["Life Stage", "Key Income Sources", "Key Expenses", "Key Accounts"].forEach((h, i) => {
    const cell = ws.getCell(r, i + 1);
    cell.value = h;
    cell.fill = solid(PLUM);
    cell.font = { name: FONT, size: 10.5, bold: true, color: { argb: i === 0 ? GOLD : WHITE } };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = { bottom: border("medium", GOLD) };
  });
  ws.getRow(r).height = 20;

  LIFE_STAGE_GUIDE.forEach((g, idx) => {
    r += 1;
    ws.getCell(r, 1).value = g.stage;
    ws.getCell(r, 2).value = g.income.join("\n");
    ws.getCell(r, 3).value = g.expenses.join("\n");
    ws.getCell(r, 4).value = g.accounts.join("\n");
    for (let c = 1; c <= 4; c++) {
      const cell = ws.getCell(r, c);
      cell.fill = solid(idx % 2 ? ZEBRA : WHITE);
      cell.font = { name: FONT, size: 10.5, color: { argb: INK } };
      cell.alignment = { vertical: "top", wrapText: true };
      cell.border = { bottom: border("thin", LINE) };
    }
    ws.getCell(r, 1).font = { name: FONT, size: 11, bold: true, color: { argb: PLUM } };
    ws.getRow(r).height = 54;
  });
}

export function buildWorkbook(ExcelJS, budget, logo = null) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Purple Portfolio";
  wb.created = new Date();
  const ref = buildBudgetSheet(wb, budget, logo);
  // Future & Guide use a text letterhead (no logo) so the Future sheet's only
  // drawing is the chart we inject below.
  const chart = buildFutureSheet(wb, budget, ref, null);
  buildGuideSheet(wb, null);
  return { wb, chart };
}

// ── Native bar chart injection (post-process the ExcelJS zip with fflate) ─────
function chartXml(c) {
  const ref = (r) => `'Future Year'!$${colLetter(c.firstCol)}$${r}:$${colLetter(c.lastCol)}$${r}`;
  const ser = (idx, name, row, rgb) => `
    <c:ser><c:idx val="${idx}"/><c:order val="${idx}"/>
      <c:tx><c:strRef><c:f>'Future Year'!$A$${row}</c:f><c:strCache><c:ptCount val="1"/><c:pt idx="0"><c:v>${name}</c:v></c:pt></c:strCache></c:strRef></c:tx>
      <c:spPr><a:solidFill><a:srgbClr val="${rgb}"/></a:solidFill><a:ln><a:solidFill><a:srgbClr val="${rgb}"/></a:solidFill></a:ln></c:spPr>
      <c:cat><c:numRef><c:f>${ref(c.yearRow)}</c:f></c:numRef></c:cat>
      <c:val><c:numRef><c:f>${ref(row)}</c:f></c:numRef></c:val>
    </c:ser>`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <c:chart>
    <c:title><c:tx><c:rich><a:bodyPr/><a:p><a:pPr><a:defRPr sz="1100" b="1"><a:solidFill><a:srgbClr val="2E1452"/></a:solidFill></a:defRPr></a:pPr><a:r><a:rPr lang="en-CA" sz="1100" b="1"><a:solidFill><a:srgbClr val="2E1452"/></a:solidFill></a:rPr><a:t>Income, expenses &amp; net cash flow over time</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title>
    <c:autoTitleDeleted val="0"/>
    <c:plotArea><c:layout/>
      <c:barChart><c:barDir val="col"/><c:grouping val="clustered"/><c:varyColors val="0"/>
        ${ser(0, "Income", c.incomeRow, "5B3A9E")}
        ${ser(1, "Expenses", c.expenseRow, "B05468")}
        ${ser(2, "Net cash flow", c.netRow, "2E8B63")}
        <c:gapWidth val="80"/>
        <c:axId val="111111111"/><c:axId val="222222222"/>
      </c:barChart>
      <c:catAx><c:axId val="111111111"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:numFmt formatCode="General" sourceLinked="0"/><c:majorTickMark val="out"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:crossAx val="222222222"/></c:catAx>
      <c:valAx><c:axId val="222222222"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="l"/><c:majorGridlines><c:spPr><a:ln><a:solidFill><a:srgbClr val="E7E3F0"/></a:solidFill></a:ln></c:spPr></c:majorGridlines><c:numFmt formatCode="$#,##0" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:crossAx val="111111111"/></c:valAx>
    </c:plotArea>
    <c:legend><c:legendPos val="b"/><c:overlay val="0"/></c:legend>
    <c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/>
  </c:chart>
</c:chartSpace>`;
}

function drawingXml(anchorRow) {
  const top = anchorRow - 1; // 0-indexed
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <xdr:twoCellAnchor editAs="oneCell">
    <xdr:from><xdr:col>1</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${top}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>
    <xdr:to><xdr:col>10</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${top + 19}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>
    <xdr:graphicFrame macro="">
      <xdr:nvGraphicFramePr><xdr:cNvPr id="2" name="Projection Chart"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr>
      <xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm>
      <a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rId1"/></a:graphicData></a:graphic>
    </xdr:graphicFrame>
    <xdr:clientData/>
  </xdr:twoCellAnchor>
</xdr:wsDr>`;
}

export async function injectFutureChart(buffer, chart) {
  const fflate = await import("fflate");
  const files = fflate.unzipSync(new Uint8Array(buffer));
  const dec = (k) => new TextDecoder().decode(files[k]);
  const enc = (s) => new TextEncoder().encode(s);
  const has = (k) => Object.prototype.hasOwnProperty.call(files, k);

  // Find the Future Year worksheet file via workbook.xml → rels.
  const wbXml = dec("xl/workbook.xml");
  const sheetEl = (wbXml.match(/<sheet\b[^>]*\/>/g) || []).find((s) => /name="Future Year"/.test(s));
  if (!sheetEl) return buffer; // no chart if we can't locate the sheet
  const rid = (sheetEl.match(/r:id="([^"]+)"/) || [])[1];
  const relsXml = dec("xl/_rels/workbook.xml.rels");
  const relEl = (relsXml.match(/<Relationship\b[^>]*\/>/g) || []).find((rel) => new RegExp(`Id="${rid}"`).test(rel));
  const target = (relEl.match(/Target="([^"]+)"/) || [])[1]; // e.g. worksheets/sheet2.xml
  const sheetPath = "xl/" + target.replace(/^\//, "");
  const sheetBase = sheetPath.split("/").pop().replace(/\.xml$/, "");

  // Next free chart / drawing indices.
  const maxIdx = (re) => Object.keys(files).reduce((m, k) => { const x = re.exec(k); return x ? Math.max(m, +x[1]) : m; }, 0);
  const cnum = maxIdx(/^xl\/charts\/chart(\d+)\.xml$/) + 1;
  const dnum = maxIdx(/^xl\/drawings\/drawing(\d+)\.xml$/) + 1;

  files[`xl/charts/chart${cnum}.xml`] = enc(chartXml(chart));
  files[`xl/drawings/drawing${dnum}.xml`] = enc(drawingXml(chart.chartAnchorRow));
  files[`xl/drawings/_rels/drawing${dnum}.xml.rels`] = enc(
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart${cnum}.xml"/></Relationships>`);

  // Wire the drawing into the worksheet's rels (create or append).
  const sheetRelsPath = `xl/worksheets/_rels/${sheetBase}.xml.rels`;
  let drawingRid;
  if (has(sheetRelsPath)) {
    const sr = dec(sheetRelsPath);
    const used = [...sr.matchAll(/Id="rId(\d+)"/g)].map((m) => +m[1]);
    drawingRid = "rId" + ((used.length ? Math.max(...used) : 0) + 1);
    files[sheetRelsPath] = enc(sr.replace("</Relationships>",
      `<Relationship Id="${drawingRid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing${dnum}.xml"/></Relationships>`));
  } else {
    drawingRid = "rId1";
    files[sheetRelsPath] = enc(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing${dnum}.xml"/></Relationships>`);
  }

  // Add <drawing> to the worksheet XML (before </worksheet>).
  let sheetXml = dec(sheetPath);
  if (!/<drawing\b/.test(sheetXml)) {
    sheetXml = sheetXml.replace("</worksheet>", `<drawing r:id="${drawingRid}"/></worksheet>`);
    files[sheetPath] = enc(sheetXml);
  }

  // Declare the new parts in [Content_Types].xml.
  let ct = dec("[Content_Types].xml");
  const overrides =
    `<Override PartName="/xl/charts/chart${cnum}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>` +
    `<Override PartName="/xl/drawings/drawing${dnum}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`;
  ct = ct.replace("</Types>", overrides + "</Types>");
  files["[Content_Types].xml"] = enc(ct);

  return fflate.zipSync(files).buffer;
}

// ── Public entry point ───────────────────────────────────────────────────────
export async function exportBudget(budget) {
  const ExcelJS = (await import("exceljs")).default;
  const logo = await loadLogo();
  const { wb, chart } = buildWorkbook(ExcelJS, budget, logo);

  let buffer = await wb.xlsx.writeBuffer();
  try {
    buffer = await injectFutureChart(buffer, chart);
  } catch (e) {
    console.warn("Chart injection skipped:", e); // the workbook is still valid without it
  }

  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `PurplePortfolio_Budget_${budget.year}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
