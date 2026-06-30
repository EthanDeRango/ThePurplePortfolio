import { useState, useEffect, useRef } from "react";
import {
  Wallet, Download, RefreshCw, Plus, X, Check, Info, Sparkles, Lock, Send, ChevronsRight,
} from "lucide-react";
import { fmtMoney } from "../lib/calculations.js";
import { STAGE_OPTIONS, STAGE_BY_KEY, ACCOUNT_TIPS, LIFE_STAGE_GUIDE } from "../data/budgetStages.js";
import {
  BUDGET_STORAGE_KEY, MONTHS, num, PLANNER_YEAR,
  deriveFromPlan, seedFromPlan, swapStage,
  addRow, removeRow, setCell, setRowLabel, fillAcross,
  sectionMonthTotals, sectionAnnual, netCashFlowByMonth, budgetTotals, planPatchFromBudget,
  loadBudgetStore, activeBudget, setActiveBudget, budgetYears, switchBudgetYear, addBudgetYear,
} from "../lib/budgetModel.js";

const cellDisplay = (v) => (v === "" || v == null ? "" : Number(v).toLocaleString("en-CA"));
const parseCell = (s) => { const raw = String(s).replace(/[^0-9]/g, ""); return raw === "" ? "" : Number(raw); };

const SECTIONS = [
  { key: "income", title: "Income", tone: "inc" },
  { key: "expenses", title: "Expenses", tone: "exp" },
  { key: "investments", title: "Investments & Savings", tone: "inv" },
];

export default function Budget({ plan, setPlan }) {
  const [store, setStore] = useState(() => loadBudgetStore(plan));
  const [pendingStage, setPendingStage] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportErr, setExportErr] = useState(false);
  const [pushState, setPushState] = useState("idle"); // idle | confirm | done
  const [showGuide, setShowGuide] = useState(false);
  const [refreshed, setRefreshed] = useState(false);
  const firstLoad = useRef(true);

  const budget = activeBudget(store);
  const isPlannerYear = num(store.activeYear) === PLANNER_YEAR;
  const setBudget = (updater) =>
    setStore((s) => setActiveBudget(s, typeof updater === "function" ? updater(activeBudget(s)) : updater));

  // Auto-save the whole multi-year store (debounced).
  useEffect(() => {
    if (firstLoad.current) { firstLoad.current = false; return; }
    const t = setTimeout(() => {
      try { localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(store)); } catch { /* quota */ }
    }, 400);
    return () => clearTimeout(t);
  }, [store]);

  // On the planner-year budget only: if it loaded without a birth year but the
  // Planner can supply one, fill it in once on mount (never clobbers a value).
  useEffect(() => {
    if (num(budget.year) !== PLANNER_YEAR) return;
    const d = deriveFromPlan(plan);
    if (!num(budget.birthYear) && d.birthYear) {
      setBudget((b) => (num(b.birthYear) ? b : { ...b, birthYear: d.birthYear }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const derived = deriveFromPlan(plan);
  const totals = budgetTotals(budget);
  const ncf = netCashFlowByMonth(budget);
  const stageName = (STAGE_BY_KEY[budget.lifeStage] || {}).name || budget.lifeStage;

  const upd = (fn) => setBudget((b) => fn(b));

  const onStageSelect = (key) => { if (key !== budget.lifeStage) setPendingStage(key); };
  const confirmSwap = (applyTemplate) => { upd((b) => swapStage(b, pendingStage, applyTemplate)); setPendingStage(null); };

  const refreshFromPlanner = () => {
    upd((b) => seedFromPlan(b, plan));
    setRefreshed(true);
    setTimeout(() => setRefreshed(false), 2400);
  };

  const applyToPlanner = () => {
    setPlan((p) => ({ ...p, ...planPatchFromBudget(budget) }));
    setPushState("done");
    setTimeout(() => setPushState("idle"), 2600);
  };

  const onExport = async () => {
    setExporting(true); setExportErr(false);
    try {
      const { exportBudget } = await import("../lib/budgetExport.js");
      await exportBudget(budget);
    } catch (e) {
      console.error("Budget export failed", e);
      setExportErr(true);
    } finally {
      setExporting(false);
    }
  };

  const hasPlannerData = derived.monthlyIncome > 0 || derived.monthlyExpenses > 0 || derived.monthlySavings > 0 || !!derived.lifeStage;

  return (
    <div className="pp-wrap pp-section">
      <span className="pp-eyebrow"><Wallet size={14} /> Budget Workbook</span>
      <div className="pp-bud-head">
        <h1 style={{ fontSize: 40, margin: "12px 0 8px" }}>Your month-by-month budget.</h1>
        <p style={{ color: "var(--muted)", fontSize: 16, maxWidth: "42em" }}>
          Optional, and built for the detail-minded. Fill in a real year, watch your net cash flow,
          and (if you like) push the numbers back to sharpen your Planner. Download it as an Excel
          workbook any time.
        </p>
      </div>

      <div className="pp-privacy-note">
        <Lock size={15} />
        <span><b>Private by default.</b> Everything here stays in your browser. Nothing is sent anywhere, and completing it is entirely optional.</span>
      </div>
      {exportErr && (
        <div className="pp-bud-alert err"><Info size={15} /> Couldn't build the Excel file. Please try again.</div>
      )}

      {/* Planner sync banner (informational) — planner-year budget only */}
      {hasPlannerData && isPlannerYear && !budget.syncDismissed && (
        <div className="pp-bud-sync">
          <div className="pp-bud-sync-main">
            <Check size={16} className="pp-bud-sync-tick" />
            <div>
              <b>Planner data loaded</b> — override any field to customise.
              <div className="pp-bud-sync-vals">
                {derived.lifeStage && <span><i>Stage</i> {(STAGE_BY_KEY[derived.lifeStage] || {}).name}</span>}
                <span><i>Income</i> {fmtMoney(derived.monthlyIncome)}/mo</span>
                <span><i>Expenses</i> {fmtMoney(derived.monthlyExpenses)}/mo</span>
                <span><i>Savings</i> {fmtMoney(derived.monthlySavings)}/mo</span>
              </div>
            </div>
          </div>
          <button className="pp-bud-sync-x" onClick={() => upd((b) => ({ ...b, syncDismissed: true }))} aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Toolbar: stage / birth year / year on the left, actions on the right */}
      <div className="pp-bud-toolbar">
        <div className="pp-bud-toolbar-fields">
          <div className="pp-field" style={{ marginBottom: 0 }}>
            <label className="pp-label2" htmlFor="bud-stage">Life stage</label>
            <select id="bud-stage" className="pp-select" value={budget.lifeStage} onChange={(e) => onStageSelect(e.target.value)}>
              {STAGE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="pp-field" style={{ marginBottom: 0 }}>
            <label className="pp-label2" htmlFor="bud-birth">Birth year</label>
            <div className="pp-input-wrap" style={{ maxWidth: 120 }}>
              <input id="bud-birth" className="pp-input" inputMode="numeric" placeholder="e.g. 2000"
                value={budget.birthYear ?? ""}
                onChange={(e) => upd((b) => ({ ...b, birthYear: parseCell(e.target.value), customized: true }))} />
            </div>
          </div>
          <div className="pp-field" style={{ marginBottom: 0 }}>
            <label className="pp-label2" htmlFor="bud-year">Budget year</label>
            <div className="pp-bud-yearpick">
              <select id="bud-year" className="pp-select" value={store.activeYear}
                onChange={(e) => setStore((s) => switchBudgetYear(s, e.target.value))}>
                {budgetYears(store).map((y) => (
                  <option key={y} value={y}>{y}{y === PLANNER_YEAR ? "  ·  tax year" : ""}</option>
                ))}
              </select>
              <button type="button" className="pp-bud-addyear" onClick={() => setStore((s) => addBudgetYear(s))}
                title="Add the next year, rolled forward from this one">
                <Plus size={14} /> Add year
              </button>
            </div>
          </div>
        </div>
        <div className="pp-bud-toolbar-actions">
          {hasPlannerData && isPlannerYear && (
            <button className={"pp-btn pp-btn-ghost pp-bud-refresh" + (refreshed ? " done" : "")} onClick={refreshFromPlanner}
              title="Re-pull stage, birth year and starting amounts from your Planner">
              {refreshed ? <><Check size={15} /> Refreshed</> : <><RefreshCw size={14} /> Refresh from Planner</>}
            </button>
          )}
          <button className="pp-btn pp-btn-primary" onClick={onExport} disabled={exporting}>
            <Download size={17} /> {exporting ? "Building…" : "Export to Excel"}
          </button>
        </div>
      </div>

      {/* Non-planner year: explain why Planner sync isn't here */}
      {!isPlannerYear && (
        <div className="pp-bud-yearnote">
          <Info size={15} style={{ flex: "none", marginTop: 1 }} />
          <span>You're editing your <b>{store.activeYear}</b> budget — it started as a copy of the prior year; adjust anything freely. Planner sync (pre-fill, refresh, apply) lives on your <b>{PLANNER_YEAR}</b> budget, since the Planner is a {PLANNER_YEAR} tax-year tool.</span>
        </div>
      )}

      {/* Stage-swap confirm — amounts are always kept; user picks label behaviour */}
      {pendingStage && (
        <div className="pp-bud-confirm">
          <Info size={18} style={{ flex: "none", marginTop: 1 }} />
          <div className="pp-bud-confirm-body">
            <span>Switching to <b>{(STAGE_BY_KEY[pendingStage] || {}).name}</b>. Your amounts stay put — choose what happens to the row labels:</span>
            <div className="pp-bud-confirm-actions">
              <button className="pp-btn pp-btn-primary" onClick={() => confirmSwap(true)}>Use {(STAGE_BY_KEY[pendingStage] || {}).name} labels</button>
              <button className="pp-btn pp-btn-ghost" onClick={() => confirmSwap(false)}>Keep my own rows</button>
              <button className="pp-bud-confirm-cancel" onClick={() => setPendingStage(null)}>Cancel</button>
            </div>
            <span className="pp-bud-confirm-hint">“Keep my own rows” leaves every label exactly as you have it; only the stage tag changes. You can always rename individual rows by clicking them.</span>
          </div>
        </div>
      )}

      {/* Summary bar */}
      <div className="pp-bud-summary">
        <div className="pp-bud-stat"><span>Annual income</span><b>{fmtMoney(totals.income)}</b></div>
        <div className="pp-bud-stat">
          <span>Annual expenses</span><b>{fmtMoney(totals.expenses)}</b>
          {totals.income > 0 && <em className="pp-bud-stat-sub">{Math.round(totals.expenseRate * 100)}% of income</em>}
        </div>
        <div className="pp-bud-stat">
          <span>Annual invested</span><b>{fmtMoney(totals.investments)}</b>
          {totals.income > 0 && <em className="pp-bud-stat-sub">{Math.round(totals.investRate * 100)}% of income</em>}
        </div>
        <div className={"pp-bud-stat net" + (totals.net < 0 ? " neg" : "")}>
          <span>Net cash flow</span><b>{fmtMoney(totals.net)}</b>
        </div>
        <div className="pp-bud-push">
          {!isPlannerYear ? (
            <span className="pp-bud-push-note">Planner sync is on your {PLANNER_YEAR} budget</span>
          ) : pushState === "done" ? (
            <span className="pp-bud-push-done"><Check size={15} /> Applied to your Planner</span>
          ) : pushState === "confirm" ? (
            <span className="pp-bud-push-confirm">
              <span>Update Planner income, savings &amp; expenses from this budget?</span>
              <button className="pp-btn pp-btn-primary" onClick={applyToPlanner}>Apply</button>
              <button className="pp-btn pp-btn-ghost" onClick={() => setPushState("idle")}>Cancel</button>
            </span>
          ) : (
            <button className="pp-btn pp-btn-gold" onClick={() => setPushState("confirm")} disabled={totals.income <= 0 && totals.expenses <= 0}>
              <Send size={15} /> Apply to my Planner
            </button>
          )}
        </div>
      </div>

      {/* The grid */}
      <div className="pp-bud-scroll">
        <table className="pp-bud-table">
          <thead>
            <tr>
              <th className="pp-bud-cat">Category</th>
              {MONTHS.map((m) => <th key={m}>{m}</th>)}
              <th className="pp-bud-annual-h">Annual</th>
            </tr>
          </thead>
          <tbody>
            {SECTIONS.map((sec) => {
              const rows = budget[sec.key];
              const monthTotals = sectionMonthTotals(rows);
              const annual = sectionAnnual(rows);
              return (
                <SectionBlock
                  key={sec.key}
                  sec={sec} rows={rows} monthTotals={monthTotals} annual={annual}
                  onCell={(id, mi, v) => upd((b) => setCell(b, sec.key, id, mi, v))}
                  onLabel={(id, v) => upd((b) => setRowLabel(b, sec.key, id, v))}
                  onAdd={() => upd((b) => addRow(b, sec.key))}
                  onRemove={(id) => upd((b) => removeRow(b, sec.key, id))}
                  onFill={(id, mi) => upd((b) => fillAcross(b, sec.key, id, mi))}
                />
              );
            })}
            {/* Net cash flow */}
            <tr className={"pp-bud-ncf" + (totals.net < 0 ? " neg" : "")}>
              <td className="pp-bud-cat">Net cash flow</td>
              {ncf.map((v, i) => <td key={i} className="pp-bud-num">{v ? fmtMoney(v) : "—"}</td>)}
              <td className="pp-bud-num pp-bud-annual">{fmtMoney(totals.net)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="pp-help" style={{ marginTop: 10 }}>
        Tip: enter an amount, then click the <b>»</b> that appears to copy it across the rest of the year.
        Click any row label to rename it, add your own rows, or scroll sideways for later months — the <b>Annual</b> column and totals update as you type.
      </p>

      {/* Life stage reference */}
      <div className="pp-bud-guidewrap">
        <button className="pp-bud-guidetoggle" onClick={() => setShowGuide((v) => !v)} aria-expanded={showGuide}>
          <Sparkles size={14} /> {showGuide ? "Hide" : "Show"} the life-stage guide
        </button>
        {showGuide && (
          <div className="pp-bud-guide">
            {LIFE_STAGE_GUIDE.map((g) => (
              <div key={g.stage} className={"pp-bud-guidecard" + (g.stage === stageName ? " on" : "")}>
                <h4>{g.stage}</h4>
                <div><i>Income</i><ul>{g.income.map((x) => <li key={x}>{x}</li>)}</ul></div>
                <div><i>Expenses</i><ul>{g.expenses.map((x) => <li key={x}>{x}</li>)}</ul></div>
                <div><i>Accounts</i><ul>{g.accounts.map((x) => <li key={x}>{x}</li>)}</ul></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionBlock({ sec, rows, monthTotals, annual, onCell, onLabel, onAdd, onRemove, onFill }) {
  return (
    <>
      <tr className={"pp-bud-sechead " + sec.tone}>
        <td className="pp-bud-cat" colSpan={14}>{sec.title}</td>
      </tr>
      {rows.map((row) => {
        const tip = ACCOUNT_TIPS[row.label];
        return (
          <tr key={row.id} className={"pp-bud-row " + sec.tone}>
            <td className="pp-bud-cat">
              <div className="pp-bud-labelwrap">
                <input className="pp-bud-label" value={row.label} title={tip || "Click to rename"}
                  onChange={(e) => onLabel(row.id, e.target.value)} aria-label="Row label" />
                {tip && <span className="pp-bud-tip" title={tip}><Info size={12} /></span>}
                <button className="pp-bud-rmrow" onClick={() => onRemove(row.id)} aria-label={`Remove ${row.label}`}>
                  <X size={13} />
                </button>
              </div>
            </td>
            {row.months.map((v, mi) => (
              <td key={mi} className="pp-bud-numcell">
                <div className="pp-bud-cellwrap">
                  <input className="pp-bud-cell" inputMode="numeric" value={cellDisplay(v)} placeholder="0"
                    onChange={(e) => onCell(row.id, mi, parseCell(e.target.value))} aria-label={`${row.label} ${MONTHS[mi]}`} />
                  {v !== "" && v != null && mi < 11 && (
                    <button type="button" className="pp-bud-fill" tabIndex={-1}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => onFill(row.id, mi)}
                      title={`Fill ${cellDisplay(v)} across to ${MONTHS[11]}`}
                      aria-label={`Fill ${cellDisplay(v)} across the rest of ${row.label}`}>
                      <ChevronsRight size={13} />
                    </button>
                  )}
                </div>
              </td>
            ))}
            <td className="pp-bud-num pp-bud-annual">{fmtMoney(row.months.reduce((a, m) => a + num(m), 0))}</td>
          </tr>
        );
      })}
      <tr className={"pp-bud-total " + sec.tone}>
        <td className="pp-bud-cat">
          <button className="pp-bud-addrow" onClick={onAdd}><Plus size={13} /> Add row</button>
        </td>
        {monthTotals.map((v, i) => <td key={i} className="pp-bud-num">{v ? fmtMoney(v) : "—"}</td>)}
        <td className="pp-bud-num pp-bud-annual">{fmtMoney(annual)}</td>
      </tr>
    </>
  );
}
