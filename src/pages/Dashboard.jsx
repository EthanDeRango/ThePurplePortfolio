import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Check, ChevronRight, Shield, Sparkles,
  AlertTriangle, Wallet, Landmark, PiggyBank, Coins, Scale,
  Receipt, Calculator, CalendarClock, ListOrdered, Printer,
  Info, Home as HomeIcon,
} from "lucide-react";
import {
  n, fmtMoney, pct1, projectSeries, projectFinal, contributedSeries,
  totalContributed, monthIndexOf, riskBy, planRate, fv,
  tfsaCumulativeRoom, rrspEstimatedLimit, fhsaRoomInfo, fhsaDeadline,
  oasClawback, emergencyFundTarget, minDownPayment, bracketInfo,
  yearsToTarget, fiTarget, simulateStrategy,
  recommendOrder, healthScore, annualInvestable, insights, accounts,
} from "../lib/calculations.js";
import { taxEngine, marginalRate, retirementMarginal, deductionSaving } from "../lib/tax-engine.js";
import { TAX_CONFIG, TAX_YEAR, RISK, MONTH_NAMES } from "../lib/tax-config.js";
import { LADDER } from "../data/constants.js";
import { GOALS } from "../data/goals.jsx";
import PaycheckBreakdown from "../components/PaycheckBreakdown.jsx";
import GrowthChart from "../components/GrowthChart.jsx";
import { Disclaimer, TaxDisclaimer } from "../components/Disclaimer.jsx";
import { CurrencyField } from "../components/InputFields.jsx";

const HBP_LIMIT = 60000;
const GOV_BENEFITS = 21000;
const ACCT_NAME = { fhsa: "FHSA", tfsa: "TFSA", rrsp: "RRSP", taxable: "Taxable" };

export default function Dashboard({ plan, setPlan }) {
  const navigate = useNavigate();
  const edit = () => navigate("/plan");

  const age = n(plan.age);
  const retAgeRaw = Math.max(age + 1, n(plan.retAge) || 65);
  const income = n(plan.income);
  const prov = plan.province || "ON";
  const empType = plan.employmentType || "employed";
  const lumpSum = n(plan.lumpSum);
  const startBal = n(plan.bTfsa) + n(plan.bRrsp) + n(plan.bFhsa) + n(plan.bNonreg) + n(plan.bLocked);
  const start = startBal + lumpSum;
  const monthsArr = plan.contribMode === "custom" ? (plan.months || null) : null;
  const emergencyFull = plan.emergencyStatus === "full";
  const emergencySaved = n(plan.emergencySaved);
  const goals = (plan.goals && plan.goals.length) ? plan.goals : ["retirement"];
  const goal = goals.includes("house") ? "house" : goals.includes("number") ? "number" : goals.includes("save") ? "save" : "retirement";
  const buyingHome = plan.buyHome || goals.includes("house");

  // tax (cheap — no memoization needed; taxEngine is O(brackets))
  const tax = useMemo(() => taxEngine(income, prov, empType), [income, prov, empType]);
  const marginal = useMemo(() => income > 0 ? marginalRate(income, prov, empType) : 0, [income, prov, empType]);
  const brk = useMemo(() => income > 0 ? bracketInfo(income, prov, empType) : null, [income, prov, empType]);

  // what-if controls
  const [monthly, setMonthly] = useState(n(plan.monthly));
  const [retAge, setRetAge] = useState(retAgeRaw);
  const [ret, setRet] = useState(planRate(plan));
  const fee = (plan.risk === "custom" && plan.includeMER) ? Math.max(0, n(plan.customFee) / 100) : 0;
  const [inflation, setInflation] = useState(false);
  const [afterTax, setAfterTax] = useState(false);


  const rrspLimit = n(plan.rrspLimitNOA) > 0 ? n(plan.rrspLimitNOA) : rrspEstimatedLimit(income);
  const [rrspPlan, setRrspPlan] = useState(() => Math.round(Math.min(6000, Math.max(0, rrspLimit))));
  const [fhsaPlan, setFhsaPlan] = useState(TAX_CONFIG.fhsa.annual);

  const startMonth = monthIndexOf(plan.asOf);
  const years = Math.max(1, retAge - age);
  const sel = plan.risk === "custom" ? { name: "custom", ret } : riskBy(plan.risk);

  // memoized expensive computations
  const selSeries = useMemo(
    () => projectSeries(ret - fee, years, start, monthly, monthsArr, startMonth),
    [ret, fee, years, start, monthly, monthsArr, startMonth]
  );
  const selFinal = selSeries[selSeries.length - 1];
  const contribSeries = useMemo(
    () => contributedSeries(years, start, monthly, monthsArr, startMonth),
    [years, start, monthly, monthsArr, startMonth]
  );
  const finals = useMemo(
    () => Object.fromEntries(RISK.map((r) => [r.key, projectFinal(r.ret - fee, years, start, monthly, monthsArr, startMonth)])),
    [fee, years, start, monthly, monthsArr, startMonth]
  );
  const scaleRef = useMemo(
    () => projectFinal(0.10, years, start, monthly, monthsArr, startMonth),
    [years, start, monthly, monthsArr, startMonth]
  );

  const contributed = totalContributed(years, start, monthly, monthsArr, startMonth);
  const growth = Math.max(0, selFinal - contributed);
  const hasData = start > 0 || monthly > 0 || (monthsArr && monthsArr.some((m) => n(m) > 0));

  const rrspShare = startBal > 0 ? (n(plan.bRrsp) + n(plan.bLocked)) / startBal : 0;
  const waitYears = 5;
  const costOfWaiting = years > waitYears ? selFinal - projectFinal(ret - fee, years - waitYears, start, monthly, monthsArr, startMonth) : 0;

  const homeAge = n(plan.homeAge);
  const homeIdx = plan.buyHome && homeAge > age && homeAge < retAge ? homeAge - age : null;
  const homeValue = homeIdx != null ? selSeries[Math.min(homeIdx, selSeries.length - 1)] : null;
  const homePrice = n(plan.homePrice);
  const homeDown = minDownPayment(homePrice);
  const homeProjAtBuy = (plan.buyHome && homePrice > 0 && homeIdx != null) ? selSeries[Math.min(homeIdx, selSeries.length - 1)] : null;
  const homeGap = homeProjAtBuy != null ? homeDown - homeProjAtBuy : null;

  const fhsaDl = fhsaDeadline(n(plan.fhsaYearOpened));
  const age71Year = age > 0 ? TAX_YEAR + (TAX_CONFIG.fhsa.closeAge - age) : null;
  let fhsaEffYearsLeft = null, fhsaCloseYear = null;
  if (fhsaDl) {
    fhsaCloseYear = fhsaDl.closeBy;
    if (age71Year != null) fhsaCloseYear = Math.min(fhsaCloseYear, age71Year);
    fhsaEffYearsLeft = fhsaCloseYear - TAX_YEAR;
  }
  const fhsaIdx = fhsaCloseYear != null ? fhsaCloseYear - TAX_YEAR : null;
  const fhsaOpenYr = n(plan.fhsaYearOpened) > 0 ? n(plan.fhsaYearOpened) : TAX_YEAR;
  const fhsaForceCloseYear = Math.min(fhsaOpenYr + TAX_CONFIG.fhsa.participationYears, age71Year != null ? age71Year : fhsaOpenYr + TAX_CONFIG.fhsa.participationYears);
  const fhsaCloseAge = age > 0 ? age + Math.max(0, fhsaForceCloseYear - TAX_YEAR) : null;

  const inflRate = n(plan.inflationRate) > 0 ? Math.min(0.1, n(plan.inflationRate) / 100) : 0.02;

  const retSpendDefault = income > 0 ? Math.round(income * 0.7) : 50000;
  const retSpend = n(plan.retSpend) > 0 ? n(plan.retSpend) : retSpendDefault;
  const retNeedToday = retSpend * 25;
  const retNeedFuture = Math.round(retNeedToday * Math.pow(1 + inflRate, years));
  // INFLATION FIX: when inflation toggle is on, the displayed balance is in today's $,
  // so compare it against retNeedToday (also today's $), not retNeedFuture (nominal $).
  const retTarget = inflation ? retNeedToday : retNeedFuture;
  const retTaxableIncome = Math.max(GOV_BENEFITS, retSpend);
  const retMarginalAuto = retTaxableIncome > 0 ? retirementMarginal(retTaxableIncome, prov) : 0;
  const retMarginal = n(plan.retTaxRate) > 0 ? Math.min(0.6, n(plan.retTaxRate) / 100) : retMarginalAuto;
  const dispVal = (v) => { let x = afterTax ? v * (1 - retMarginal * rrspShare) : v; if (inflation) x = x / Math.pow(1 + inflRate, years); return x; };

  const annInv = annualInvestable(plan);
  const restOfYearInvestable = plan.contribMode === "custom"
    ? (plan.months || []).reduce((a, b, mi) => mi >= startMonth ? a + n(b) : a, 0)
    : n(plan.monthly) * (12 - startMonth);
  const matchAmt = n(plan.employerMatch);
  const debt = n(plan.highInterestDebt);
  const fhsaCloseIdx = fhsaForceCloseYear != null ? Math.max(0, fhsaForceCloseYear - TAX_YEAR) : null;

  const simCtx = { years, r: ret - fee, income, marginal, retMarginal, startTfsa: n(plan.bTfsa), startRrsp: n(plan.bRrsp) + n(plan.bLocked), startFhsa: n(plan.bFhsa), annualInvest: annInv, homeIdx, eligFhsa: buyingHome, buyingHome, fhsaCloseIdx };
  const recOrder = recommendOrder(goal, buyingHome, marginal);
  const recSim = useMemo(() => simulateStrategy(recOrder, simCtx), [JSON.stringify(simCtx), recOrder.join(",")]);

  const stratList = [];
  if (buyingHome) stratList.push({ key: "home", name: "Home-first (FHSA)", order: ["fhsa", "tfsa", "rrsp"], goodIf: ["Buying a first home", "Want tax-free home savings", "Deduction now + tax-free out"], trade: "FHSA must go to a home (or roll to RRSP) within 15 years." });
  stratList.push({ key: "rrsp", name: "RRSP-first", order: ["rrsp", "tfsa", "fhsa"], goodIf: ["Higher tax bracket today", "Retirement is the priority", "Expect a lower rate later"], trade: "Less liquid; withdrawals are taxed as income." });
  stratList.push({ key: "tfsa", name: "TFSA-first", order: ["tfsa", "fhsa", "rrsp"], goodIf: ["Want maximum flexibility", "Unsure about big plans", "Expect income to rise"], trade: "No tax deduction today." });
  if (!buyingHome) stratList.push({ key: "bal", name: "Balanced split", order: null, mode: "balanced", goodIf: ["Want some of both", "Hedge today vs. later rates", "Flexibility + tax savings"], trade: "Neither benefit is maximized." });
  const strats = useMemo(
    () => stratList.map((s) => ({ ...s, sim: simulateStrategy(s.order, { ...simCtx, eligFhsa: buyingHome }, s.mode) })),
    [JSON.stringify(simCtx), buyingHome]
  );
  const recKey = buyingHome ? "home" : (marginal >= 0.30 ? "rrsp" : "tfsa");

  const oppAmt = 10000;
  const mGrow = (yrs) => Math.pow(1 + (ret - fee) / 12, Math.max(0, yrs) * 12);
  const gRet = mGrow(years);
  const refundNow = oppAmt * marginal;
  const refundGrownRet = refundNow * gRet;
  const oppRows = [
    { key: "tfsa", name: "TFSA", taxNow: 0, horizonY: years, gross: oppAmt * gRet, wTaxRate: 0, net: oppAmt * gRet, withdrawal: "None — tax-free" },
    { key: "rrsp", name: "RRSP", taxNow: refundNow, horizonY: years, gross: oppAmt * gRet, wTaxRate: retMarginal, net: oppAmt * gRet * (1 - retMarginal) + refundGrownRet, withdrawal: `Taxed ~${pct1(retMarginal)}` },
  ];
  if (buyingHome) oppRows.push({ key: "fhsa", name: "FHSA", taxNow: refundNow, closes: true, closeAge: fhsaCloseAge, gross: null, wTaxRate: 0, net: null, withdrawal: "None — for a home" });
  const oppNetRows = oppRows.filter((r) => r.net != null);
  const oppBest = oppNetRows.reduce((a, b) => (b.net > a.net ? b : a), oppNetRows[0]);

  const fiYrs = yearsToTarget(retNeedFuture, ret - fee, start, annInv);
  const targetNumber = n(plan.targetNumber);
  const numYrs = targetNumber > 0 ? yearsToTarget(targetNumber, ret - fee, start, annInv) : null;
  const customGoals = Array.isArray(plan.customGoals) ? plan.customGoals : [];
  const customGoalCalc = customGoals.map((g) => {
    const amt = n(g.amount), yrs = n(g.years);
    const reqMonthly = (() => {
      const N = yrs * 12, i = (ret - fee) / 12;
      if (N <= 0 || amt <= 0) return null;
      if (i <= 0) return amt / N;
      return Math.max(0, amt * i / (Math.pow(1 + i, N) - 1));
    })();
    return { ...g, amt, yrs, reqMonthly, yToReach: amt > 0 ? yearsToTarget(amt, ret - fee, 0, annInv) : null };
  });

  const downNeed = buyingHome ? (n(plan.homePrice) > 0 ? minDownPayment(n(plan.homePrice)) : 0) : 0;
  const health = healthScore({ hasEmergency: emergencyFull, income, annualInvest: annInv, buyHome: buyingHome, marginal, projRetIncome: recSim.afterTax * 0.04, targetSpend: retSpend, downProj: recSim.downAtHome || 0, downNeed });
  const scoreColor = (s) => s >= 7 ? "var(--green)" : s >= 4 ? "var(--gold)" : "var(--rose)";

  const goalProgress = (k) => {
    if (k === "house") return downNeed > 0 ? Math.min(1, (recSim.downAtHome || 0) / downNeed) : null;
    if (k === "number") return targetNumber > 0 ? Math.min(1, selFinal / targetNumber) : null;
    if (k === "save") { const tot = customGoalCalc.reduce((a, g) => a + g.amt, 0); return tot > 0 ? Math.min(1, selFinal / tot) : null; }
    // INFLATION FIX: compare dispVal(selFinal) against retTarget (consistent units)
    return retTarget > 0 ? Math.min(1, dispVal(selFinal) / retTarget) : null;
  };

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

  const rrspSaving = income > 0 && rrspPlan > 0 ? deductionSaving(income, prov, empType, rrspPlan) : 0;
  const fhsaSaving = income > 0 && fhsaPlan > 0 ? deductionSaving(income, prov, empType, fhsaPlan) : 0;

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
  const print = () => window.print();

  const Bar = ({ used, total, color }) => {
    const pu = total > 0 ? Math.min(100, (used / total) * 100) : 0;
    return <div className="pp-room-bar"><i style={{ width: pu + "%", background: color }} /></div>;
  };

  return (
    <div className="pp-wrap pp-section">
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button className="pp-back pp-noprint" onClick={edit}><ArrowLeft size={16} /> Edit my numbers</button>
      </div>

      <div className="pp-printonly" style={{ marginBottom: 12 }}>
        <b style={{ fontFamily: "var(--display)", fontSize: 20 }}>Purple Portfolio — your {TAX_YEAR} summary</b>
        <div style={{ fontSize: 12, color: "#555" }}>Educational estimates only · {TAX_CONFIG.prov[prov].name}</div>
      </div>

      {/* Head */}
      <div className="pp-dash-head" style={{ marginTop: 12 }}>
        <span className="pp-eyebrow"><Sparkles size={14} /> Your projection</span>
        {hasData ? (
          <>
            <div className="big">{fmtMoney(dispVal(selFinal))}</div>
            <div className="cap">Projected by age {retAge} ({years} years) on your <b style={{ color: "var(--gold-2)" }}>{sel.name.toLowerCase()}</b> path{fee > 0 ? `, after ~${pct1(fee)} fees` : ""}{inflation ? ", in today's dollars" : ""}{afterTax ? ", after estimated retirement tax" : ""}.</div>
            <div className="pp-scn">
              {RISK.map((r) => (
                <div className="pp-scnc" key={r.key}>
                  <div className="lab" style={{ color: r.key === plan.risk ? "var(--gold-2)" : undefined }}>{r.name} <span style={{ fontWeight: 600, opacity: 0.7 }}>· {Math.round(r.ret * 100)}%/yr</span></div>
                  <div className="val">{fmtMoney(dispVal(finals[r.key]))}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="big" style={{ fontSize: 28 }}>Add a contribution to see your future</div>
            <div className="cap">Use the sliders below, or edit your numbers, and your projection will appear here.</div>
          </>
        )}
      </div>

      {/* Snapshot */}
      <div className="pp-snap">
        {hasData && <div className="pp-snapc"><div className="l">Projected total</div><div className="v">{fmtMoney(dispVal(selFinal))}</div><div className="h">by age {retAge}</div></div>}
        {income > 0 && <div className="pp-snapc"><div className="l">Take-home pay</div><div className="v">{fmtMoney(tax.netMonthly)}</div><div className="h">per month, after tax</div></div>}
        {income > 0 && <div className="pp-snapc"><div className="l">Marginal rate</div><div className="v">{pct1(marginal)}</div><div className="h">on your next dollar</div></div>}
        <div className="pp-snapc"><div className="l">Next priority</div><div className="v" style={{ fontSize: 16, lineHeight: 1.2 }}>{firstTodo >= 0 && nextSteps[firstTodo] ? nextSteps[firstTodo].label : "Keep investing"}</div><div className="h">{firstTodo >= 0 && nextSteps[firstTodo] && nextSteps[firstTodo].amount > 0 ? fmtMoney(nextSteps[firstTodo].amount) + (["ef","debt","match"].includes(nextSteps[firstTodo].key) ? "" : "/yr") : "your action plan below"}</div></div>
      </div>

      {/* Section-jump nav — uses pp-secnav to avoid colliding with top pp-topnav */}
      <nav className="pp-secnav pp-noprint" aria-label="Jump to dashboard section">
        {[
          ["sec-plan", "Action plan"], ["sec-compare", "Compare strategies"],
          ["sec-goal", "Goal"],
          ...(income > 0 ? [["sec-pay", "Paycheque"], ["sec-tax", "Tax savings"], ["sec-vs", "TFSA vs RRSP"]] : []),
          ["sec-room", "Room"],
          ...(hasData ? [["sec-grow", "Growth"]] : []),
          ["sec-accounts", "Accounts"],
        ].map(([id, label]) => (
          <button key={id} type="button" onClick={() => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
            {label}
          </button>
        ))}
      </nav>

      <div style={{ height: 14 }} />
      <Disclaimer />

      {/* ACTION PLAN */}
      <div id="sec-plan" style={{ marginTop: 32 }}>
        <span className="pp-eyebrow"><ListOrdered size={14} /> Your action plan</span>
        <h3 className="pp-sec-h">What to do with your next dollar</h3>
        <p className="pp-sec-lead">A personalised priority order for your {goal === "house" ? "home" : goal === "number" ? "target" : goal === "save" ? "savings" : "retirement"} goal, your {pct1(marginal)} tax bracket{buyingHome ? ", and your home plans" : ""}. Fund each step, then move to the next.</p>
        {restOfYearInvestable > 0 && (
          <div className="pp-invest-banner">
            <div className="l">Based on what you told us, here's what you can invest before {TAX_YEAR + 1}:</div>
            <div className="v">{fmtMoney(restOfYearInvestable)}<span className="u"> over the rest of {TAX_YEAR}</span></div>
            <div className="h">{startMonth > 0 ? `That's ${fmtMoney(annInv / 12)}/mo across the ${12 - startMonth} months left this year` : `That's ${fmtMoney(annInv)} across the full year`} — here's the order to put it to work.</div>
          </div>
        )}
        <div className="pp-plan">
          {nextSteps.map((s, i) => (
            <div className={"pp-step" + (i === firstTodo ? " now" : s.done ? " done" : "")} key={s.key}>
              <div className="pp-step-ic">{s.done ? <Check size={16} /> : i + 1}</div>
              <div className="pp-step-b">
                <h4>{s.label} {s.amount > 0 && <span className="amt">{["ef","debt","match"].includes(s.key) ? fmtMoney(s.amount) : fmtMoney(s.amount) + "/yr"}</span>}
                  {i === firstTodo && <span className="pp-step-tag">Start here</span>}
                  {s.done && <span className="pp-step-tag ok">Done</span>}
                </h4>
                <p>{s.note}</p>
                {s.cap > 0 && <div className="pp-pbar"><i style={{ width: Math.min(100, (s.amount / s.cap) * 100) + "%" }} /></div>}
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
              <div className="pp-card rec-hero" style={{ borderColor: "var(--violet)", boxShadow: "0 0 0 2px rgba(124,77,196,.18)" }}>
                <span style={{ display: "inline-block", fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: "#fff", background: "var(--violet)", padding: "3px 9px", borderRadius: 999 }}>Recommended for you</span>
                <h4 style={{ fontFamily: "var(--display)", fontSize: 23, color: "var(--plum)", margin: "10px 0 4px" }}>{recS.name}</h4>
                <div style={{ fontSize: 14, color: "var(--muted)", marginBottom: 14 }}>Fund in this order: <b style={{ color: "var(--plum)" }}>{recOrder.filter((a) => a !== "fhsa" || buyingHome).map((a) => ACCT_NAME[a]).join(" → ")}</b></div>
                <div className="pp-grid-3">
                  <div className="pp-rate-chip"><div className="l">Tax refund, year one</div><div className="v">{fmtMoney(recS.sim.refundYr1)}</div><div className="h">from RRSP/FHSA deductions</div></div>
                  <div className="pp-rate-chip" style={{ background: "var(--violet-soft)" }}><div className="l">After-tax at {retAge}</div><div className="v">{fmtMoney(recS.sim.afterTax)}</div><div className="h">withdrawals taxed realistically</div></div>
                  {buyingHome
                    ? <div className="pp-rate-chip" style={{ background: "#F3ECDB" }}><div className="l">Down payment by {homeAge || "?"}</div><div className="v">{recS.sim.downAtHome != null ? fmtMoney(recS.sim.downAtHome) : "—"}</div><div className="h">FHSA + TFSA + HBP</div></div>
                    : <div className="pp-rate-chip" style={{ background: "#F3ECDB" }}><div className="l">Why this order</div><div className="v" style={{ fontSize: 15, lineHeight: 1.25 }}>{marginal >= 0.30 ? "Deduct high now" : "Stay flexible"}</div><div className="h">{marginal >= 0.30 ? `${pct1(marginal)} today vs ~${pct1(retMarginal)} later` : "TFSA first at your bracket"}</div></div>}
                </div>
              </div>
              <div className="pp-card" style={{ marginTop: 14, overflowX: "auto" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--plum-2)", marginBottom: 4 }}>Same {fmtMoney(annInv)}/yr, four ways — side by side</div>
                <table className="pp-cmp">
                  <thead><tr><th>Strategy</th><th>Refund yr 1</th><th>After-tax @ {retAge}</th>{buyingHome && <th>Down pmt @ {homeAge || "?"}</th>}<th>Best for</th></tr></thead>
                  <tbody>
                    {strats.map((s) => (
                      <tr key={s.key} className={s.key === recKey ? "rec" : ""}>
                        <td><span className="stratname">{s.name}</span>{s.key === recKey && <span className="recbadge">Rec</span>}<div className="ord">{(s.order || ["tfsa","rrsp"]).filter((a) => a !== "fhsa" || buyingHome).map((a) => ACCT_NAME[a]).join(" → ")}{s.mode === "balanced" ? " (50/50)" : ""}</div></td>
                        <td>{fmtMoney(s.sim.refundYr1)}</td>
                        <td className={s.sim.afterTax === bestRetire ? "best" : ""}>{fmtMoney(s.sim.afterTax)}</td>
                        {buyingHome && <td className={(s.sim.downAtHome || 0) === bestDown && bestDown > 0 ? "best" : ""}>{s.sim.downAtHome != null ? fmtMoney(s.sim.downAtHome) : "—"}</td>}
                        <td style={{ textAlign: "left", whiteSpace: "normal", fontSize: 12, color: "var(--muted)" }}>{s.goodIf[0]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 10 }}><b className="best" style={{ color: "var(--green)" }}>Green</b> marks the highest figure. Trade-off to weigh: {recS.trade}</p>
              </div>
            </>
          );
        })() : (
          <div className="pp-card"><p style={{ color: "var(--muted)" }}>Add a monthly contribution to compare strategies with real figures.</p></div>
        )}
        <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 12 }}>A model, not a guarantee: assumes steady {pct1(ret)} returns, your {pct1(marginal)} rate today and ~{pct1(retMarginal)} in retirement. Real outcomes vary.</p>
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
                        <div className="pp-rate-chip" style={{ background: "#F3ECDB" }}><div className="l">Monthly to get there · with growth</div><div className="v">{grow != null ? fmtMoney(grow) + "/mo" : "—"}</div><div className="h">invested at {pct1(ret)}{fvStart >= downNeed && start > 0 ? " — your balance already covers it" : ""}</div></div>
                      </div>
                    );
                  })()}
                </>
              ) : <p style={{ color: "var(--muted)", marginTop: 8 }}>Add your target home price and purchase age in your numbers to see your down-payment timeline.</p>}
            </div>
          );
          if (k === "save") return (
            <div className="pp-card" style={{ marginBottom: 14 }} key={k}>
              <span className="pp-eyebrow"><PiggyBank size={13} /> Save for something</span>
              {customGoalCalc.length > 0 ? (
                <div style={{ marginTop: 8 }}>
                  {customGoalCalc.map((g, gi) => (
                    <div key={gi} className="pp-savegoal">
                      <div className="nm">{g.name || "Goal " + (gi + 1)}</div>
                      <div className="pp-grid-3" style={{ marginTop: 6 }}>
                        <div className="pp-rate-chip"><div className="l">Target</div><div className="v">{fmtMoney(g.amt)}</div><div className="h">{g.yrs > 0 ? "in " + g.yrs + (g.yrs === 1 ? " year" : " years") : "no timeframe"}</div></div>
                        <div className="pp-rate-chip" style={{ background: "var(--violet-soft)" }}><div className="l">Monthly · with growth</div><div className="v">{g.reqMonthly != null ? fmtMoney(g.reqMonthly) + "/mo" : "—"}</div><div className="h">at {pct1(ret)}</div></div>
                        <div className="pp-rate-chip" style={{ background: "#F3ECDB" }}><div className="l">Monthly · as cash</div><div className="v">{g.yrs > 0 && g.amt > 0 ? fmtMoney(g.amt / (g.yrs * 12)) + "/mo" : "—"}</div><div className="h">no growth</div></div>
                      </div>
                    </div>
                  ))}
                  <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 12 }}>For goals under ~3 years, keeping the money safer usually beats investing it.</p>
                </div>
              ) : <p style={{ color: "var(--muted)", marginTop: 8 }}>Add savings goals in the planner's goal step.</p>}
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
              ) : <p style={{ color: "var(--muted)", marginTop: 8 }}>Add your target invested amount in the goal step.</p>}
            </div>
          );
          return (
            <div className="pp-card" style={{ marginBottom: 14 }} key={k}>
              <span className="pp-eyebrow"><Landmark size={13} /> Retire comfortably</span>
              <div className="pp-grid-3" style={{ marginTop: 8 }}>
                <div className="pp-rate-chip"><div className="l">You'll want to spend</div><div className="v">{fmtMoney(retSpend)}/yr</div><div className="h">today's dollars{n(plan.retSpend) > 0 ? "" : " (≈70% of income)"}</div></div>
                <div className="pp-rate-chip" style={{ background: "var(--violet-soft)" }}><div className="l">Nest egg you'll need</div><div className="v">{fmtMoney(retNeedToday)}</div><div className="h">25× spending, today's $</div></div>
                <div className="pp-rate-chip" style={{ background: "#F3ECDB" }}><div className="l">Reached around age</div><div className="v">{fiYrs != null ? age + fiYrs : "60+"}</div><div className="h">at {fmtMoney(annInv)}/yr</div></div>
              </div>
              <div className="pp-grid-2" style={{ marginTop: 12 }}>
                <div className="pp-rate-chip"><div className="l">Projected after-tax at {retAge}</div><div className="v">{fmtMoney(recSim.afterTax)}</div><div className="h">on your recommended path</div></div>
                <div className="pp-rate-chip"><div className="l">That sustainably pays</div><div className="v">{fmtMoney(recSim.afterTax * 0.04)}/yr</div><div className="h">{recSim.afterTax * 0.04 >= retNeedFuture * 0.04 ? "on track ✓" : "keep building"}</div></div>
              </div>
              <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 12 }}>The 4% rule says a nest egg of ~25× your spending — <b>{fmtMoney(retNeedToday)}</b> in today's money — can fund it for life.</p>
            </div>
          );
        })}
      </div>

      {/* OPPORTUNITY COST */}
      {income > 0 && (
        <div style={{ marginTop: 34 }}>
          <span className="pp-eyebrow"><Coins size={14} /> Opportunity cost</span>
          <h3 className="pp-sec-h">Where your next {fmtMoney(oppAmt)} ends up ahead</h3>
          <div className="pp-callout" style={{ marginBottom: 14 }}>
            <Info size={18} style={{ flex: "none" }} />
            <span><b>What's a "tax refund" here?</b> RRSP and FHSA contributions are subtracted from your taxable income. At your {pct1(marginal)} rate, putting {fmtMoney(oppAmt)} into an RRSP or FHSA returns about <b>{fmtMoney(refundNow)}</b> at tax time. A TFSA gives no refund, but it's never taxed again.</span>
          </div>
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
                    <td style={{ color: "#9A6010", fontWeight: 600, fontSize: 12 }}>Closes at age {r.closeAge ?? "—"}</td>
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
              <span>For your situation, <b>{oppBest.name}</b> comes out ahead — about <b>{fmtMoney(oppBest.net)}</b> net{oppBest.key === "rrsp" ? `, because your retirement rate (~${pct1(retMarginal)}) is below today's ${pct1(marginal)}.` : `, because paying tax now and never again wins.`}</span>
            </div>
          </div>
        </div>
      )}

      {/* SCORECARD */}
      <div style={{ marginTop: 34 }}>
        <span className="pp-eyebrow"><Shield size={14} /> Financial health</span>
        <h3 className="pp-sec-h">Your snapshot score</h3>
        <div className="pp-card">
          <div className="pp-score">
            <div className="pp-score-ring">
              <svg width="130" height="130" viewBox="0 0 130 130" aria-label={`Health score: ${health.overall} out of 100`} role="img">
                <circle cx="65" cy="65" r="54" fill="none" stroke="var(--panel)" strokeWidth="11" />
                <circle cx="65" cy="65" r="54" fill="none" stroke={scoreColor(health.overall / 10)} strokeWidth="11" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 54}
                  strokeDashoffset={2 * Math.PI * 54 * (1 - health.overall / 100)}
                  transform="rotate(-90 65 65)" />
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
                  : k === "number" ? (targetNumber > 0 ? `${fmtMoney(selFinal)} of ${fmtMoney(targetNumber)}` : "add a target amount to track")
                  : k === "save" ? (customGoalCalc.length > 0 ? `${fmtMoney(selFinal)} of ${fmtMoney(customGoalCalc.reduce((a, g) => a + g.amt, 0))} across your goals` : "add a savings goal to track")
                  : `${fmtMoney(dispVal(selFinal))} of ${fmtMoney(retTarget)} ${inflation ? "(today's $)" : "retirement target"}`;
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

      {/* PAYCHEQUE */}
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

      {/* TAX SAVINGS */}
      {income > 0 && (
        <div id="sec-tax" style={{ marginTop: 34 }}>
          <span className="pp-eyebrow"><Calculator size={14} /> Tax savings &amp; brackets</span>
          <h3 className="pp-sec-h">Your bracket, and what a deduction does to it</h3>
          {brk && (
            <div className="pp-brackets" style={{ marginBottom: 16 }}>
              <div className="pp-brk"><div className="l">Your marginal bracket</div><div className="v">{pct1(brk.cur)}</div><div className="h">Combined federal + {brk && tax.isQC ? "Quebec" : "provincial"} rate on your next dollar.</div></div>
              <div className="pp-brk up"><div className="l">Into the next bracket</div><div className="v">{brk.up != null ? "+" + fmtMoney(brk.toNext) : "—"}</div><div className="h">{brk.up != null ? <>About this much more income pushes you to <b>{pct1(brk.rateAbove)}</b>.</> : <>You're in the top bracket.</>}</div></div>
              <div className="pp-brk down"><div className="l">Down a bracket</div><div className="v">{brk.down != null ? fmtMoney(brk.toLower) : "—"}</div><div className="h">{brk.down != null ? <>Deducting about this much drops you to <b>{pct1(brk.rateBelow)}</b>.</> : <>Already in the lowest bracket.</>}</div></div>
            </div>
          )}
          <div className="pp-grid-2">
            <div className="pp-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><h4 style={{ fontSize: 19 }}>RRSP deduction</h4><PiggyBank size={20} style={{ color: "var(--violet)" }} /></div>
              <CurrencyField id="d-rrspplan" label="Amount you'd contribute" value={rrspPlan} onChange={(v) => setRrspPlan(n(v))} placeholder="e.g. 6,000"
                help={rrspLimit > 0 ? <>Your estimated room is about <b>{fmtMoney(rrspLimit)}</b>.</> : null} />
              <div className="pp-stat" style={{ marginTop: 6 }}><span>Estimated tax saved</span><b style={{ color: "var(--green)" }}>{fmtMoney(rrspSaving)}</b></div>
              <div className="pp-stat"><span>Net cost to you</span><b>{fmtMoney(Math.max(0, rrspPlan - rrspSaving))}</b></div>
              <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 10 }}>Defers tax — you'll pay income tax when you withdraw in retirement, ideally at a lower rate.</p>
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
        const claw = oasClawback(retTaxableIncome);
        const nearClaw = retTaxableIncome > TAX_CONFIG.oas.thresholdMin - 15000 && retTaxableIncome <= TAX_CONFIG.oas.thresholdMin;
        const lowIncomeRet = retTaxableIncome > 0 && retTaxableIncome < 32000;
        return (
          <div id="sec-vs" style={{ marginTop: 34 }}>
            <span className="pp-eyebrow"><Scale size={14} /> TFSA vs RRSP</span>
            <h3 className="pp-sec-h">Which wrapper fits you right now?</h3>
            <div className="pp-card">
              <div className="pp-grid-2" style={{ gap: 16 }}>
                <div className="pp-rate-chip" style={{ background: "var(--violet-soft)" }}><div className="l">Marginal rate today</div><div className="v">{pct1(marginal)}</div><div className="h">at {fmtMoney(income)} income</div></div>
                <div className="pp-rate-chip" style={{ background: "#F3ECDB" }}><div className="l">Est. rate in retirement</div><div className="v">{pct1(retMarginal)}</div><div className="h">on ~{fmtMoney(retTaxableIncome)} of taxable income</div></div>
              </div>
              <div className="pp-row2" style={{ marginTop: 14 }}>
                <div className="pp-field" style={{ marginBottom: 0 }}>
                  <label className="pp-label2" htmlFor="d-retspend">Annual spending in retirement <span style={{ fontWeight: 600, color: "var(--muted)" }}>· today's dollars</span></label>
                  <div className="pp-input-wrap"><span className="pp-adorn">$</span>
                    <input id="d-retspend" className="pp-input" inputMode="numeric" value={plan.retSpend != null ? plan.retSpend : ""} placeholder={String(retSpendDefault)}
                      onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ""); setPlan((p) => ({ ...p, retSpend: raw })); }} />
                    <span className="pp-adorn r">/yr</span></div>
                  <div className="pp-help">{n(plan.retSpend) > 0 ? <>Your figure: <b>{fmtMoney(retSpend)}</b>/yr.</> : <>Defaulting to ~70% of today's income (<b>{fmtMoney(retSpend)}</b>/yr).</>}</div>
                </div>
                <div className="pp-field" style={{ marginBottom: 0 }}>
                  <label className="pp-label2" htmlFor="d-retrate">Retirement tax rate <span style={{ fontWeight: 600, color: "var(--muted)" }}>· override</span></label>
                  <div className="pp-input-wrap">
                    <input id="d-retrate" className="pp-input" inputMode="decimal" value={plan.retTaxRate != null ? plan.retTaxRate : ""} placeholder={(retMarginalAuto * 100).toFixed(1)}
                      onChange={(e) => { const raw = e.target.value.replace(/[^0-9.]/g, ""); setPlan((p) => ({ ...p, retTaxRate: raw })); }} />
                    <span className="pp-adorn r">%</span></div>
                  <div className="pp-help">{n(plan.retTaxRate) > 0 ? "Your override." : <>Auto: <b>{pct1(retMarginalAuto)}</b>. Override if you have a better estimate.</>}</div>
                </div>
              </div>
              <div className="pp-callout" style={{ marginTop: 14, marginBottom: 0 }}>
                <Sparkles size={18} style={{ flex: "none" }} />
                <span>{marginal - retMarginal > 0.02
                  ? <>Your rate today ({pct1(marginal)}) is higher than your estimated retirement rate ({pct1(retMarginal)}), so the <b>RRSP</b> tends to come out ahead.</>
                  : retMarginal - marginal > 0.02
                  ? <>Your estimated retirement rate ({pct1(retMarginal)}) is higher than today's ({pct1(marginal)}), so the <b>TFSA</b> tends to win.</>
                  : <>Your rates today and in retirement are close — the <b>TFSA</b> wins on flexibility.</>}</span>
              </div>
              {(claw > 0 || nearClaw || lowIncomeRet) && (
                <div className="pp-callout" style={{ marginTop: 12, marginBottom: 0, background: "#F3E4C8", borderColor: "#C98A2E" }}>
                  <AlertTriangle size={18} style={{ flex: "none", color: "#9A6010" }} />
                  <span>{lowIncomeRet
                    ? <><b>Watch the GIS trap.</b> RRSP/RRIF withdrawals reduce GIS by ~50¢/dollar — but <b>TFSA withdrawals don't</b>.</>
                    : claw > 0
                    ? <><b>OAS clawback flag.</b> At {fmtMoney(retTaxableIncome)}, you'd lose about <b>{fmtMoney(claw)}/yr</b> to the 15% recovery tax. TFSA withdrawals don't count toward it.</>
                    : <><b>OAS clawback is close.</b> TFSA withdrawals won't push you over the threshold.</>}</span>
                </div>
              )}
              <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 12 }}>
                <button className="pp-inlinelink" onClick={() => navigate("/library/tax/clawbacks")}>Read how OAS &amp; GIS clawbacks work →</button>
              </p>
            </div>
          </div>
        );
      })()}

      {/* ROOM */}
      <div id="sec-room" style={{ marginTop: 34 }}>
        <span className="pp-eyebrow"><Wallet size={14} /> Contribution room</span>
        <h3 className="pp-sec-h">How much room you have left</h3>
        <div className="pp-room">
          <div className="pp-roomc">
            <h4>TFSA <PiggyBank size={18} style={{ color: "var(--violet)" }} /></h4>
            <div className="pp-room-big">{fmtMoney(tfsaCum)}</div>
            <div className="pp-room-sub">Cumulative room{n(plan.birthYear) > 0 ? " since you turned 18" : " (if 18+ since 2009)"}</div>
            <Bar used={n(plan.bTfsa)} total={tfsaCum} color="var(--violet)" />
            <div className="pp-room-legend"><span>This year: {fmtMoney(TAX_CONFIG.tfsa.annual)}</span><span>Used: {fmtMoney(tfsaUsed)}</span></div>
            <div className="pp-room-sub"><b style={{ color: "var(--plum)" }}>{fmtMoney(tfsaAnnualLeft)}</b> of this year's room left</div>
            {tfsaUsed > tfsaCum && <div className="pp-overwarn"><AlertTriangle size={15} style={{ flex: "none" }} /><span>That's more than your estimated room — <b>1%/month</b> penalty on over-contributions.</span></div>}
          </div>
          <div className="pp-roomc">
            <h4>RRSP <Landmark size={18} style={{ color: "var(--gold)" }} /></h4>
            <div className="pp-room-big">{fmtMoney(rrspLeft)}</div>
            <div className="pp-room-sub">Room left {n(plan.rrspLimitNOA) > 0 ? "(from your NOA)" : "(estimated from income)"}</div>
            <Bar used={rrspUsed} total={rrspLimit} color="var(--gold)" />
            <div className="pp-room-legend"><span>Limit: {fmtMoney(rrspLimit)}</span><span>Used: {fmtMoney(rrspUsed)}</span></div>
            {rrspOver && <div className="pp-overwarn"><AlertTriangle size={15} style={{ flex: "none" }} /><span>Over your limit by more than the {fmtMoney(TAX_CONFIG.rrsp.overBuffer)} buffer — <b>1%/month</b> penalty.</span></div>}
          </div>
          <div className="pp-roomc">
            <h4>FHSA <HomeIcon size={18} style={{ color: "var(--rose)" }} /></h4>
            <div className="pp-room-big">{fmtMoney(fhsaLifeLeft)}</div>
            <div className="pp-room-sub">{fhsaRoom.opened ? "Available room so far" : "Open an FHSA to start accruing room"}</div>
            <Bar used={fhsaLifeUsed} total={TAX_CONFIG.fhsa.lifetime} color="var(--rose)" />
            <div className="pp-room-legend"><span>Lifetime cap: {fmtMoney(TAX_CONFIG.fhsa.lifetime)}</span><span>Used: {fmtMoney(fhsaYrUsed)}</span></div>
            <div className="pp-room-sub">{fhsaRoom.opened ? <><b style={{ color: "var(--plum)" }}>{fmtMoney(fhsaYrLeft)}</b> usable this year</> : <>Get {fmtMoney(TAX_CONFIG.fhsa.annual)} the year you open one.</>}</div>
            {(fhsaLifeOver || fhsaYrOver) && <div className="pp-overwarn"><AlertTriangle size={15} style={{ flex: "none" }} /><span>{fhsaLifeOver ? "Past the $40k lifetime cap" : "Past this year's $16k max"} — <b>1%/month</b> penalty.</span></div>}
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
          <div className="pp-deadline">
            <svg className="ring" width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
              <circle cx="42" cy="42" r="36" fill="none" stroke="var(--panel)" strokeWidth="8" />
              <circle cx="42" cy="42" r="36" fill="none" stroke="var(--plum)" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 36}
                strokeDashoffset={2 * Math.PI * 36 * (1 - Math.max(0, Math.min(1, fhsaEffYearsLeft / TAX_CONFIG.fhsa.participationYears)))}
                transform="rotate(-90 42 42)" />
              <text x="42" y="47" textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--plum)" fontFamily="Fraunces">{Math.max(0, fhsaEffYearsLeft)}</text>
            </svg>
            <div>
              <div className="big">{fhsaEffYearsLeft > 0 ? `${fhsaEffYearsLeft} years left` : "Closing year reached"}</div>
              <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 4 }}>Opened in {n(plan.fhsaYearOpened)} — must close by end of <b>{fhsaCloseYear}</b>. {fhsaEffYearsLeft <= 2 && fhsaEffYearsLeft > 0 ? "That's soon — plan your purchase or RRSP rollover." : "Plenty of time, but the clock is running."}</p>
            </div>
          </div>
        </div>
      )}

      {/* GROWTH CHART + WHAT-IF */}
      {hasData && (
        <div id="sec-grow">
          <div className="pp-card pp-noprint" style={{ marginTop: 34 }}>
            <span className="pp-eyebrow">What if…</span>
            <h3 style={{ fontSize: 22, margin: "8px 0 16px" }}>Adjust the inputs — slide or type</h3>
            <div className="pp-sliders">
              <div className="pp-slider">
                <div className="top"><span className="l">Monthly contribution</span><span className="vwrap"><span className="vu">$</span><input className="vin" inputMode="numeric" value={monthly} onChange={(e) => setMonthly(Math.max(0, Number(e.target.value.replace(/[^0-9]/g,"")) || 0))} aria-label="Monthly contribution amount" /></span></div>
                <input className="pp-range" type="range" min="0" max="3000" step="25" value={Math.min(monthly, 3000)} onChange={(e) => setMonthly(Number(e.target.value))} aria-label="Monthly contribution" />
              </div>
              <div className="pp-slider">
                <div className="top"><span className="l">Retirement age</span><span className="vwrap"><input className="vin" inputMode="numeric" value={retAge} onChange={(e) => setRetAge(Number(e.target.value.replace(/[^0-9]/g,"")) || 0)} aria-label="Retirement age value" /></span></div>
                <input className="pp-range" type="range" min={age + 1} max="75" step="1" value={Math.min(Math.max(retAge, age + 1), 75)} onChange={(e) => setRetAge(Number(e.target.value))} aria-label="Retirement age" />
              </div>
              <div className="pp-slider">
                <div className="top"><span className="l">Annual return</span><span className="vwrap"><input className="vin" inputMode="decimal" value={(ret * 100).toFixed(1)} onChange={(e) => { const v = parseFloat(e.target.value.replace(/[^0-9.]/g,"")); if (!isNaN(v)) setRet(v / 100); }} aria-label="Annual return percent" /><span className="vu">%</span></span></div>
                <input className="pp-range" type="range" min="0.02" max="0.12" step="0.005" value={Math.min(Math.max(ret, 0.02), 0.12)} onChange={(e) => setRet(Number(e.target.value))} aria-label="Annual return" />
              </div>
            </div>
            <div className="pp-toggles">
              <button className={"pp-tog" + (inflation ? " on" : "")} onClick={() => setInflation((v) => !v)}><Check size={14} /> Today's dollars ({pct1(inflRate)} inflation)</button>
              <button className={"pp-tog" + (afterTax ? " on" : "")} onClick={() => setAfterTax((v) => !v)}><Check size={14} /> After estimated retirement tax</button>
            </div>
          </div>

          <div className="pp-card" style={{ marginTop: 18 }}>
            <span className="pp-eyebrow">Growth over time</span>
            <h3 style={{ fontSize: 22, margin: "8px 0 18px" }}>How your money could grow to age {retAge}</h3>
            <GrowthChart
              series={selSeries} scaleRef={scaleRef} contribSeries={contribSeries}
              years={years} startAge={age} startMonth={startMonth}
              homeIdx={homeIdx} homeAge={homeAge} fhsaIdx={fhsaIdx}
              color={plan.risk === "custom" ? "var(--violet)" : sel.color}
              inflation={inflation} inflRate={inflRate}
              afterTax={afterTax} retMarginal={retMarginal} rrspShare={rrspShare}
            />
            <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 14 }}>
              Hover / tap or use arrow keys to read any year. The line follows your <b>{pct1(ret)}</b> return{fee > 0 ? `, after ${pct1(fee)} fee` : ""} — lower the return and the curve visibly flattens. {inflation && "Values are discounted to today's dollars. "}{afterTax && (rrspShare > 0 ? `After-tax view taxes only the RRSP/locked-in share (~${pct1(rrspShare)}).` : "")}Illustrative only.
            </p>
          </div>

          {costOfWaiting > 1000 && (
            <div className="pp-callout" style={{ marginTop: 16 }}>
              <CalendarClock size={18} style={{ flex: "none" }} />
              <span>Starting now matters: waiting <b>5 years</b> would leave you roughly <b>{fmtMoney(costOfWaiting)}</b> short by age {retAge}.</span>
            </div>
          )}

          <div className="pp-grid-2" style={{ marginTop: 18 }}>
            <div className="pp-card">
              <span className="pp-eyebrow">Where the money comes from</span>
              <div style={{ marginTop: 12 }}>
                <div className="pp-stat"><span>What you put in</span><b>{fmtMoney(contributed)}</b></div>
                <div className="pp-stat"><span>Growth from compounding</span><b style={{ color: "var(--violet)" }}>{fmtMoney(growth)}</b></div>
                <div className="pp-stat"><span>Projected total</span><b style={{ color: "var(--plum)" }}>{fmtMoney(selFinal)}</b></div>
              </div>
            </div>
            <div className="pp-card">
              <span className="pp-eyebrow">{homeIdx != null ? "Your first-home milestone" : "Monthly habit"}</span>
              <div style={{ marginTop: 12 }}>
                {homeIdx != null ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}><HomeIcon size={20} style={{ color: "var(--gold)" }} /><span style={{ fontWeight: 700 }}>By age {homeAge}</span></div>
                    <div className="pp-acct"><div className="num">{fmtMoney(homeValue)}</div></div>
                  </>
                ) : (
                  <>
                    <div className="pp-acct"><div className="num">{fmtMoney(monthly)}/mo</div></div>
                    <p style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 10 }}>That's {fmtMoney(monthly * 12)} a year going to work for you.</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {plan.buyHome && homePrice > 0 && (
            <div className="pp-card" style={{ marginTop: 18 }}>
              <span className="pp-eyebrow"><HomeIcon size={14} /> Your home goal</span>
              <h3 style={{ fontSize: 22, margin: "8px 0 14px" }}>Down payment on a {fmtMoney(homePrice)} home</h3>
              <div className="pp-grid-3">
                <div className="pp-rate-chip"><div className="l">Minimum down payment</div><div className="v">{fmtMoney(homeDown)}</div><div className="h">{homePrice < 1500000 ? <>{pct1(homeDown / homePrice)} · CMHC applies under 20%</> : <>20% required</>}</div></div>
                <div className="pp-rate-chip" style={{ background: "#F3ECDB" }}><div className="l">20% (skip insurance)</div><div className="v">{fmtMoney(homePrice * 0.2)}</div></div>
                {homeProjAtBuy != null && <div className="pp-rate-chip" style={{ background: "var(--violet-soft)" }}><div className="l">Projected by age {homeAge}</div><div className="v">{fmtMoney(homeProjAtBuy)}</div></div>}
              </div>
              {homeProjAtBuy != null && (
                <div className="pp-callout" style={{ marginTop: 16, marginBottom: 0 }}>
                  {homeGap <= 0
                    ? <><Check size={18} style={{ flex: "none", color: "var(--green)" }} /><span>On track — projected <b>{fmtMoney(homeProjAtBuy)}</b> covers the <b>{fmtMoney(homeDown)}</b> minimum with about <b>{fmtMoney(-homeGap)}</b> to spare.</span></>
                    : <><AlertTriangle size={18} style={{ flex: "none", color: "#C98A2E" }} /><span>About <b>{fmtMoney(homeGap)}</b> short. Raising contributions or extending the timeline can close the gap.</span></>}
                </div>
              )}
            </div>
          )}

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

      {/* ACCOUNTS */}
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
              <button className="pp-btn pp-btn-ghost pp-btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => navigate(`/library/accounts/${ac.key}`)}>
                Learn more <ChevronRight size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="pp-noprint" style={{ display: "flex", gap: 12, marginTop: 34, flexWrap: "wrap" }}>
        <button className="pp-btn pp-btn-primary" onClick={() => navigate("/library")}>Explore the library <ArrowRight size={17} /></button>
        <button className="pp-btn pp-btn-ghost" onClick={edit}>Adjust my numbers</button>
        <button className="pp-btn pp-btn-ghost" onClick={print}><Printer size={16} /> Print / save as PDF</button>
      </div>
    </div>
  );
}
