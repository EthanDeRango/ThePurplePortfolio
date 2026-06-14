import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Check, ChevronRight, Shield, Sparkles,
  AlertTriangle, Wallet, Landmark, PiggyBank, Coins, Scale,
  Receipt, Calculator, CalendarClock, ListOrdered, Printer,
  Info, Home as HomeIcon, TrendingUp,
} from "lucide-react";
import {
  n, fmtMoney, fmtShort, pct1, projectSeries, projectSeriesWithWithdrawals, projectFinal, contributedSeries,
  totalContributed, monthIndexOf, riskBy, planRate, fv,
  tfsaCumulativeRoom, rrspEstimatedLimit, fhsaRoomInfo, fhsaDeadline,
  oasClawback, emergencyFundTarget, minDownPayment, bracketInfo,
  yearsToTarget, fiTarget, simulateStrategy,
  recommendOrder, healthScore, annualInvestable, insights, accounts,
  projectByAccount, mortgageEquitySeries,
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
  const startBal = n(plan.bTfsa) + n(plan.bRrsp) + n(plan.bFhsa) + n(plan.bNonreg)
    + n(plan.bLocked) + n(plan.bRrif) + n(plan.bPensionDC) + n(plan.bDpsp);
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
  const [showGuide, setShowGuide] = useState(false);


  const rrspLimit = n(plan.rrspLimitNOA) > 0 ? n(plan.rrspLimitNOA) : rrspEstimatedLimit(income);
  const [rrspPlan, setRrspPlan] = useState(() => Math.round(Math.min(6000, Math.max(0, rrspLimit))));
  const [fhsaPlan, setFhsaPlan] = useState(TAX_CONFIG.fhsa.annual);

  const startMonth = monthIndexOf(plan.asOf);
  const years = Math.max(1, retAge - age);
  const sel = plan.risk === "custom" ? { name: "custom", ret } : riskBy(plan.risk);

  // Home purchase data — needed before projection so withdrawals are baked in
  const homeAge = n(plan.homeAge);
  const homeIdx = plan.buyHome && homeAge > age && homeAge < retAge ? homeAge - age : null;
  const homePrice = n(plan.homePrice);
  const homeDown = minDownPayment(homePrice);

  // Withdrawal events: home down payment + custom savings goals
  const goalWithdrawals = [
    ...(homeIdx != null && homeDown > 0 ? [{ year: homeIdx, amount: homeDown }] : []),
    ...(Array.isArray(plan.customGoals) ? plan.customGoals : [])
      .filter((g) => n(g.years) >= 1 && n(g.years) <= years && n(g.amount) > 0)
      .map((g) => ({ year: n(g.years), amount: n(g.amount) })),
  ];
  const gwKey = JSON.stringify(goalWithdrawals);

  // memoized expensive computations
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const selSeries = useMemo(
    () => projectSeriesWithWithdrawals(ret - fee, years, start, monthly, monthsArr, startMonth, goalWithdrawals),
    // gwKey serializes goalWithdrawals so the memo only re-runs when goal data actually changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ret, fee, years, start, monthly, monthsArr, startMonth, gwKey]
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

  const rrspShare = startBal > 0
    ? (n(plan.bRrsp) + n(plan.bLocked) + n(plan.bRrif) + n(plan.bPensionDC) + n(plan.bDpsp)) / startBal
    : 0;
  const waitYears = 5;
  const costOfWaiting = years > waitYears ? selFinal - projectFinal(ret - fee, years - waitYears, start, monthly, monthsArr, startMonth) : 0;

  // Pre-withdrawal value at home purchase year — what the portfolio holds before the down payment is taken.
  // Use projectFinal (no withdrawals) so the display shows "available to buy with" not "leftover after".
  const homePreBuyValue = homeIdx != null
    ? projectFinal(ret - fee, homeIdx, start, monthly, monthsArr, startMonth)
    : null;
  const homeValue = homePreBuyValue;
  const homeProjAtBuy = plan.buyHome && homePrice > 0 && homeIdx != null ? homePreBuyValue : null;
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

  // "This year only" projection — what does just this year's new money grow to?
  // Step 1: what's the balance at end of year 1 from new contributions (no starting balance)
  const yr1FromNew = (monthly > 0 || (monthsArr && monthsArr.some((m) => n(m) > 0)))
    ? projectFinal(ret - fee, 1, 0, monthly, monthsArr, startMonth)
    : 0;
  // Step 2: grow that end-of-year-1 balance forward for the remaining years
  const thisYearInvest = restOfYearInvestable + lumpSum;
  const thisYearFV = (() => {
    if (years <= 0 || thisYearInvest <= 0) return 0;
    const lumpFV = lumpSum > 0 ? fv(ret - fee, years * 12, lumpSum, 0) : 0;
    const monthlyFV = yr1FromNew > 0
      ? (years > 1 ? fv(ret - fee, (years - 1) * 12, yr1FromNew, 0) : yr1FromNew)
      : 0;
    return lumpFV + monthlyFV;
  })();
  const thisYearMultiple = thisYearInvest > 0 && thisYearFV > thisYearInvest
    ? Math.round(thisYearFV / thisYearInvest)
    : 0;
  const fhsaCloseIdx = fhsaForceCloseYear != null ? Math.max(0, fhsaForceCloseYear - TAX_YEAR) : null;

  const simCtx = { years, r: ret - fee, income, marginal, retMarginal, startTfsa: n(plan.bTfsa), startRrsp: n(plan.bRrsp) + n(plan.bLocked), startFhsa: n(plan.bFhsa), annualInvest: annInv, homeIdx, eligFhsa: buyingHome, buyingHome, fhsaCloseIdx };
  const recOrder = recommendOrder(goal, buyingHome, marginal);
  const recSim = useMemo(() => simulateStrategy(recOrder, simCtx), [JSON.stringify(simCtx), recOrder.join(",")]);

  // Optimal-path series: current monthly + reinvested tax refund from RRSP/FHSA contributions
  const optRefundMonthly = (recSim.refundYr1 || 0) / 12;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const optSeries = useMemo(() => {
    if (optRefundMonthly < 1 || !hasData) return null;
    return projectSeriesWithWithdrawals(ret - fee, years, start, monthly + optRefundMonthly, monthsArr, startMonth, goalWithdrawals);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ret, fee, years, start, monthly, optRefundMonthly, monthsArr, startMonth, gwKey]);
  const optFinal = optSeries ? optSeries[optSeries.length - 1] : null;
  const optBoost = optFinal != null ? Math.max(0, optFinal - selFinal) : 0;

  // ── Per-account stacked series ────────────────────────────────────────────────
  const mortgageRateDecimal = n(plan.mortgageRate)     > 0 ? n(plan.mortgageRate) / 100     : 0.05;
  const homeApprecDecimal   = n(plan.homeAppreciation) > 0 ? n(plan.homeAppreciation) / 100 : 0.025;
  const planAcctKey = JSON.stringify({
    bTfsa: plan.bTfsa, bRrsp: plan.bRrsp, bLocked: plan.bLocked, bRrif: plan.bRrif,
    bFhsa: plan.bFhsa, bPensionDC: plan.bPensionDC, bDpsp: plan.bDpsp,
    bNonreg: plan.bNonreg, bResp: plan.bResp, bRdsp: plan.bRdsp,
    fhsaYearOpened: plan.fhsaYearOpened, income: plan.income,
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const byAcct = useMemo(
    () => hasData ? projectByAccount(plan, ret - fee, years, monthly, monthsArr, startMonth, homeIdx, fhsaCloseIdx) : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasData, planAcctKey, ret, fee, years, monthly, monthsArr, startMonth, homeIdx, fhsaCloseIdx]
  );
  const fhsaAtPurchase = (byAcct && homeIdx != null && homeIdx > 0)
    ? (byAcct.fhsaAtClose || n(plan.bFhsa)) : n(plan.bFhsa);
  const homeEquityArr = useMemo(
    () => (buyingHome && homePrice > 0 && homeIdx != null)
      ? mortgageEquitySeries(homePrice, fhsaAtPurchase, mortgageRateDecimal, homeApprecDecimal, years, homeIdx)
      : new Array(years + 1).fill(0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [buyingHome, homePrice, fhsaAtPurchase, mortgageRateDecimal, homeApprecDecimal, years, homeIdx]
  );
  const stackedSeries = useMemo(() => {
    if (!byAcct) return null;
    const hasPension  = n(plan.bPensionDC) + n(plan.bDpsp) > 0;
    const hasFhsaData = n(plan.bFhsa) > 0 || n(plan.fhsaYearOpened) > 0;
    const hasNonreg   = n(plan.bNonreg) + n(plan.bResp) + n(plan.bRdsp) > 0;
    const hasHomeEq   = homeEquityArr.some((v) => v > 0);
    const layers = [
      { key: "tfsa",    label: "TFSA",              color: "#2D7A2B", values: byAcct.tfsa    },
      { key: "rrsp",    label: "RRSP / Registered", color: "#A8761E", values: byAcct.rrsp    },
      hasFhsaData ? { key: "fhsa",    label: "FHSA",           color: "#9E3D65", values: byAcct.fhsa    } : null,
      hasPension  ? { key: "pension", label: "Pension / DC",   color: "#5B7EC4", values: byAcct.pension  } : null,
      (hasNonreg || monthly > 0) ? { key: "nonreg", label: "Non-reg", color: "#7044BE", values: byAcct.nonreg } : null,
      hasHomeEq   ? { key: "home",    label: "Home equity",    color: "#C68D3F", values: homeEquityArr   } : null,
    ].filter(Boolean).filter((l) => l.values.some((v) => v > 0));
    return layers.length > 1 ? layers : null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byAcct, plan.bFhsa, plan.fhsaYearOpened, plan.bPensionDC, plan.bDpsp, plan.bNonreg, plan.bResp, plan.bRdsp, monthly, homeEquityArr]);

  // Accounts the user should open (eligible but not in their openAccounts list)
  const openAccts = plan.openAccounts ?? (() => {
    const a = [];
    if (n(plan.bTfsa) > 0 || plan.birthYear) a.push("tfsa");
    if (n(plan.bRrsp) > 0 || plan.rrspLimitNOA) a.push("rrsp");
    if (n(plan.bFhsa) > 0 || plan.fhsaYearOpened) a.push("fhsa");
    if (n(plan.bNonreg) > 0) a.push("nonreg");
    if (n(plan.bLocked) > 0) a.push("lira");
    if (n(plan.bRrif) > 0) a.push("rrif");
    if (n(plan.bPensionDC) > 0) a.push("pension_dc");
    if (n(plan.bDpsp) > 0) a.push("dpsp");
    return a;
  })();
  const eligibleUnopened = [
    age >= 18 && !openAccts.includes("tfsa") && { key: "tfsa", name: "TFSA", color: "#3D7A3B", benefit: `${fmtMoney(TAX_CONFIG.tfsa.annual)}/yr completely tax-free`, why: "Grows and withdraws tax-free — for any goal, any time." },
    income > 0 && !openAccts.includes("rrsp") && { key: "rrsp", name: "RRSP", color: "#A8761E", benefit: `Save ~${fmtMoney(Math.round(income * 0.18 * marginal))} in taxes this year`, why: "Deduct contributions from taxable income today." },
    buyingHome && age >= 18 && income > 0 && !openAccts.includes("fhsa") && { key: "fhsa", name: "FHSA", color: "#9E3D65", benefit: `Save ~${fmtMoney(Math.round(TAX_CONFIG.fhsa.annual * marginal))} + tax-free home withdrawal`, why: "Best of both worlds: deduction now, tax-free out for your first home." },
  ].filter(Boolean);

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

  // Milestone dots on the growth chart for each custom savings goal
  const GOAL_COLORS = ["#7044BE", "#2E8B57", "#C05D5D", "#C0955D", "#5D80C0"];
  const chartMilestones = customGoalCalc
    .filter((g) => g.yrs >= 1 && g.yrs <= years && g.amt > 0)
    .map((g, i) => ({
      year: g.yrs,
      label: (g.name || "Goal") + " −" + fmtShort(g.amt),
      color: GOAL_COLORS[i % GOAL_COLORS.length],
    }));

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
  // Use CRA-provided room if entered (includes carryforward); otherwise fall back to this year's annual room only
  const tfsaProvidedRoom = n(plan.tfsaAvailableRoom);
  const tfsaRoomStart = tfsaProvidedRoom > 0 ? tfsaProvidedRoom : TAX_CONFIG.tfsa.annual;
  const tfsaRoomLeft = Math.max(0, tfsaRoomStart - tfsaUsed);
  const tfsaOver = tfsaUsed > tfsaRoomStart;
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
            <div style={{ marginTop: 10, fontSize: 13.5, color: "rgba(220,205,240,.9)", background: "rgba(255,255,255,.09)", borderRadius: 10, padding: "8px 14px", display: "inline-block" }}>
              In plain terms: that could pay you ~<b style={{ color: "#fff" }}>{fmtMoney(dispVal(selFinal) * 0.04)}/yr</b> throughout retirement without running out.
            </div>
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

      {/* This year's contribution impact */}
      {thisYearInvest > 0 && thisYearFV > 0 && (
        <div className="pp-thisyear pp-noprint">
          <div className="pp-thisyear-eyebrow">{TAX_YEAR} — what your money this year actually does</div>
          <div className="pp-thisyear-flow">
            <div className="pp-thisyear-pill">
              <div className="pp-thisyear-amt">{fmtMoney(thisYearInvest)}</div>
              <div className="pp-thisyear-lbl">invested this year{lumpSum > 0 && monthly > 0 ? ` (${fmtMoney(lumpSum)} lump + ${fmtMoney(restOfYearInvestable)} monthly)` : ""}</div>
            </div>
            <div className="pp-thisyear-arrow">
              <svg width="56" height="14" viewBox="0 0 56 14" aria-hidden="true">
                <line x1="0" y1="7" x2="48" y2="7" stroke="currentColor" strokeWidth="1.5" />
                <polyline points="42,2 52,7 42,12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{years} yr{years !== 1 ? "s" : ""} compounding at {pct1(ret - fee)}</span>
            </div>
            <div className="pp-thisyear-pill pp-thisyear-pill-future">
              <div className="pp-thisyear-amt">{fmtMoney(thisYearFV)}</div>
              <div className="pp-thisyear-lbl">by age {retAge} — without adding another dollar</div>
            </div>
          </div>
          {thisYearMultiple > 1 && (
            <div className="pp-thisyear-note">
              <b style={{ color: "var(--violet)" }}>{thisYearMultiple}× your money</b> from compound growth alone.
              {" "}Every year you invest, another {thisYearMultiple}× seed is planted.
            </div>
          )}
        </div>
      )}

      {/* Snapshot */}
      <div className="pp-snap">
        {hasData && <div className="pp-snapc"><div className="l">Projected total</div><div className="v">{fmtMoney(dispVal(selFinal))}</div><div className="h">by age {retAge}</div></div>}
        {income > 0 && <div className="pp-snapc"><div className="l">Take-home pay</div><div className="v">{fmtMoney(tax.netMonthly)}</div><div className="h">per month, after tax</div></div>}
        {income > 0 && <div className="pp-snapc"><div className="l">Your tax rate</div><div className="v">{pct1(marginal)}</div><div className="h">on your next dollar earned</div></div>}
        <div className="pp-snapc"><div className="l">Next priority</div><div className="v" style={{ fontSize: 16, lineHeight: 1.2 }}>{firstTodo >= 0 && nextSteps[firstTodo] ? nextSteps[firstTodo].label : "Keep investing"}</div><div className="h">{firstTodo >= 0 && nextSteps[firstTodo] && nextSteps[firstTodo].amount > 0 ? fmtMoney(nextSteps[firstTodo].amount) + (["ef","debt","match"].includes(nextSteps[firstTodo].key) ? "" : "/yr") : "your action plan below"}</div></div>
      </div>

      {/* Section-jump nav — uses pp-secnav to avoid colliding with top pp-topnav */}
      <nav className="pp-secnav pp-noprint" aria-label="Jump to dashboard section">
        {[
          ["sec-plan", "Action plan"], ["sec-compare", "Accounts"],
          ...(income > 0 ? [["sec-taxplan", "Tax plan"]] : []),
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

      {/* BEGINNER GUIDE */}
      <div style={{ marginTop: 20 }}>
        <button
          onClick={() => setShowGuide((v) => !v)}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "var(--violet-soft)", border: "1px solid var(--violet-mid)",
            borderRadius: showGuide ? "18px 18px 0 0" : 18, padding: "15px 20px",
            cursor: "pointer", fontFamily: "var(--sans)", textAlign: "left", transition: "border-radius .15s",
          }}
          aria-expanded={showGuide}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".10em", color: "var(--plum-2)", marginBottom: 3 }}>New to investing?</div>
            <span style={{ fontFamily: "var(--display)", fontSize: 17, fontWeight: 600, color: "var(--plum)" }}>Understand what this dashboard is showing you</span>
          </div>
          <ChevronRight size={20} style={{ color: "var(--plum-2)", transform: showGuide ? "rotate(90deg)" : "none", transition: "transform .2s", flexShrink: 0 }} />
        </button>
        {showGuide && (
          <div style={{ background: "var(--paper-card)", border: "1px solid var(--violet-mid)", borderTop: 0, borderRadius: "0 0 18px 18px", padding: "22px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
            <p style={{ fontSize: 14.5, color: "var(--ink)", lineHeight: 1.75, margin: 0 }}>
              <b>The big idea:</b> Money sitting in a regular bank account grows slowly (1–2%/year). Invested money — in the stock market or index funds — has historically grown 6–10%/year. More importantly, your gains earn their own gains, called <b>compounding</b>. This dashboard shows where your money ends up if you invest consistently over {years} years.
            </p>

            {/* The three accounts */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--plum-2)", marginBottom: 10 }}>Your three investment accounts</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                <div style={{ background: "#EAF5EA", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ fontWeight: 800, fontSize: 13.5, color: "#245A24", marginBottom: 6 }}>TFSA — Tax-Free Savings</div>
                  <p style={{ fontSize: 13, color: "#245A24", lineHeight: 1.65, margin: 0 }}>Like a magic jar. Put money in, it grows, take it out — the government never taxes any of it. Use it for anything, any time, with no paperwork.</p>
                </div>
                <div style={{ background: "#F8F0E0", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ fontWeight: 800, fontSize: 13.5, color: "#5C400A", marginBottom: 6 }}>RRSP — Retirement Savings</div>
                  <p style={{ fontSize: 13, color: "#5C400A", lineHeight: 1.65, margin: 0 }}>A deal with the government: invest now, get a tax refund today. When you retire and take the money out, you pay some tax — but usually at a lower rate than you do now.</p>
                </div>
                <div style={{ background: "#FAE8EF", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ fontWeight: 800, fontSize: 13.5, color: "#6B1A35", marginBottom: 6 }}>FHSA — First Home Savings</div>
                  <p style={{ fontSize: 13, color: "#6B1A35", lineHeight: 1.65, margin: 0 }}>For first-time buyers only. Get a tax refund each year you contribute, AND pay zero tax when you use it to buy your home. Best of both worlds.</p>
                </div>
              </div>
            </div>

            {/* Key terms */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--plum-2)", marginBottom: 12 }}>Key terms, explained simply</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {[
                  { term: `Tax refund on investing`, def: `When you contribute to an RRSP or FHSA, the government refunds some of the income tax you already paid — because you're saving for your future. At your current rate of ${pct1(marginal)}, every $1,000 you put in returns about ${fmtMoney(marginal * 1000)} at tax time. It shows up like a bonus cheque when you file.` },
                  { term: `Your tax rate — ${pct1(marginal)}`, def: `If you earned one more dollar of income today, ${pct1(marginal)} of it would go to tax. This is called your "marginal rate." It's why RRSP and FHSA contributions are valuable — every dollar you contribute saves you ${pct1(marginal)} in tax right now.` },
                  { term: `4% rule`, def: `A widely-used retirement guideline: if you withdraw 4% of your savings each year, it should last your entire lifetime without running out. ${fmtMoney(dispVal(selFinal) > 0 ? dispVal(selFinal) : 500000)} in savings → ${fmtMoney((dispVal(selFinal) > 0 ? dispVal(selFinal) : 500000) * 0.04)}/yr to live on.` },
                  { term: `After-tax value`, def: `RRSP money gets taxed when you take it out in retirement. "After-tax" shows the amount left after that future tax — your actual spending power. TFSA withdrawals are always after-tax (because they're never taxed at all).` },
                  { term: `Sustainable income`, def: `The annual amount you could pay yourself from your savings without ever running out of money — calculated using the 4% rule above. Think of it like a salary you pay yourself from your investment pot.` },
                ].map(({ term, def }) => (
                  <div key={term} style={{ display: "flex", gap: 14, alignItems: "flex-start", paddingBottom: 11, borderBottom: "1px solid var(--line-soft)" }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--plum)", minWidth: 185, flexShrink: 0, lineHeight: 1.5, paddingTop: 1 }}>{term}</div>
                    <div style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.65 }}>{def}</div>
                  </div>
                ))}
              </div>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
              Still have questions? The <button className="pp-inlinelink" onClick={() => navigate("/library")}>Library</button> has full articles on every account type, tax brackets, and more.
            </p>
          </div>
        )}
      </div>

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
        {eligibleUnopened.length > 0 && (
          <div className="pp-opt-open">
            <div className="pp-opt-open-hd"><Sparkles size={13} /> Accounts you should open</div>
            <div className="pp-opt-open-list">
              {eligibleUnopened.map((a) => (
                <div key={a.key} className="pp-opt-open-row" style={{ borderLeftColor: a.color }}>
                  <div className="pp-opt-open-name" style={{ color: a.color }}>{a.name}</div>
                  <div className="pp-opt-open-benefit">{a.benefit}</div>
                  <div className="pp-opt-open-why">{a.why}</div>
                </div>
              ))}
            </div>
            <p className="pp-opt-open-note">These accounts are available to you based on your age, income, and goals. Your plan would be stronger with them in it.</p>
          </div>
        )}

        <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 12 }}>This is a widely used Canadian priority framework applied to your inputs — a strong default, not personal advice. Your situation may justify a different order.</p>
      </div>

      {/* ACCOUNT BREAKDOWN + COMPARE STRATEGIES */}
      <div id="sec-compare" style={{ marginTop: 34 }}>
        <span className="pp-eyebrow"><Scale size={14} /> Account breakdown</span>
        <h3 className="pp-sec-h">What each account does for you</h3>
        <p className="pp-sec-lead">Same money, different wrappers — the difference is when and how much tax you pay.</p>

        {annInv > 0 ? (() => {
          const tfsaS = strats.find((s) => s.key === "tfsa");
          const rrspS = strats.find((s) => s.key === "rrsp");
          const homeS = strats.find((s) => s.key === "home");
          const recS  = strats.find((s) => s.key === recKey) || strats[0];
          const bestAfterTax = Math.max(...strats.map((s) => s.sim.afterTax));
          const bestDown = buyingHome ? Math.max(...strats.map((s) => s.sim.downAtHome || 0)) : 0;
          return (
            <>
              {/* Per-account cards */}
              <div style={{ display: "grid", gridTemplateColumns: buyingHome ? "repeat(3, 1fr)" : "repeat(2, 1fr)", gap: 14, marginBottom: 20 }}>

                {/* TFSA */}
                <div className="pp-card" style={{ borderTop: "3px solid var(--green)", padding: "22px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#EAF5EA", display: "grid", placeItems: "center", color: "var(--green)", flexShrink: 0 }}><PiggyBank size={18} /></div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--green)" }}>TFSA</div>
                      <div style={{ fontSize: 12.5, color: "var(--muted)" }}>Grows tax-free. Withdraw any time, no tax — ever.</div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 3 }}>If you prioritize TFSA first</div>
                    <div style={{ fontFamily: "var(--display)", fontSize: 32, fontWeight: 600, color: "var(--plum)", lineHeight: 1.05 }}>{tfsaS ? fmtMoney(tfsaS.sim.afterTax) : "—"}</div>
                    <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 3 }}>after-tax at {retAge} · {tfsaS ? fmtMoney(tfsaS.sim.afterTax * 0.04) + "/yr" : "—"} sustainable</div>
                  </div>
                  <div style={{ borderTop: "1px solid var(--line-soft)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 7 }}>
                    <div className="pp-stat" style={{ padding: "3px 0" }}><span>Tax refund now</span><span style={{ fontWeight: 700, color: "var(--muted)" }}>None</span></div>
                    <div className="pp-stat" style={{ padding: "3px 0" }}><span>Tax on withdrawal</span><span style={{ fontWeight: 700, color: "var(--green)" }}>None — ever ✓</span></div>
                    <div className="pp-stat" style={{ padding: "3px 0", borderBottom: 0 }}><span>Room this year</span><span style={{ fontWeight: 700 }}>{fmtMoney(TAX_CONFIG.tfsa.annual)}</span></div>
                  </div>
                  <div style={{ marginTop: 12, padding: "10px 12px", background: "#EAF5EA", borderRadius: 10, fontSize: 12.5, color: "#245A24", lineHeight: 1.55 }}>
                    <b>Best if</b> you want full flexibility, or expect your income (and tax rate) to rise.
                  </div>
                </div>

                {/* RRSP */}
                <div className="pp-card" style={{ borderTop: "3px solid var(--gold)", padding: "22px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#F8F0E0", display: "grid", placeItems: "center", color: "var(--gold)", flexShrink: 0 }}><Landmark size={18} /></div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--gold)" }}>RRSP</div>
                      <div style={{ fontSize: 12.5, color: "var(--muted)" }}>Tax refund today. Pay tax in retirement — usually less.</div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 3 }}>If you prioritize RRSP first</div>
                    <div style={{ fontFamily: "var(--display)", fontSize: 32, fontWeight: 600, color: "var(--plum)", lineHeight: 1.05 }}>{rrspS ? fmtMoney(rrspS.sim.afterTax) : "—"}</div>
                    <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 3 }}>after-tax at {retAge} · {rrspS ? fmtMoney(rrspS.sim.afterTax * 0.04) + "/yr" : "—"} sustainable</div>
                  </div>
                  <div style={{ borderTop: "1px solid var(--line-soft)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 7 }}>
                    {income > 0 && <div className="pp-stat" style={{ padding: "3px 0" }}><span>Refund on {fmtMoney(rrspPlan)}</span><span style={{ fontWeight: 700, color: "var(--green)" }}>+{fmtMoney(rrspSaving)}</span></div>}
                    <div className="pp-stat" style={{ padding: "3px 0" }}><span>Tax on withdrawal</span><span style={{ fontWeight: 700, color: "#9A6010" }}>~{pct1(retMarginal)} in retirement</span></div>
                    <div className="pp-stat" style={{ padding: "3px 0", borderBottom: 0 }}><span>Room available</span><span style={{ fontWeight: 700 }}>{fmtMoney(rrspLeft)}</span></div>
                  </div>
                  <div style={{ marginTop: 12, padding: "10px 12px", background: "#F8F0E0", borderRadius: 10, fontSize: 12.5, color: "#5C400A", lineHeight: 1.55 }}>
                    <b>Best if</b> your {pct1(marginal)} rate today is higher than your estimated ~{pct1(retMarginal)} retirement rate.
                  </div>
                </div>

                {/* FHSA — only shown when buying a home */}
                {buyingHome && (
                  <div className="pp-card" style={{ borderTop: "3px solid var(--rose)", padding: "22px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FAE8EF", display: "grid", placeItems: "center", color: "var(--rose)", flexShrink: 0 }}><HomeIcon size={18} /></div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--rose)" }}>FHSA</div>
                        <div style={{ fontSize: 12.5, color: "var(--muted)" }}>Tax refund now + zero tax when you buy your home.</div>
                      </div>
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 3 }}>Projected for your down payment</div>
                      <div style={{ fontFamily: "var(--display)", fontSize: 32, fontWeight: 600, color: "var(--plum)", lineHeight: 1.05 }}>{homeS?.sim?.downAtHome ? fmtMoney(homeS.sim.downAtHome) : "—"}</div>
                      <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 3 }}>FHSA + TFSA + HBP by age {homeAge || "?"}</div>
                    </div>
                    <div style={{ borderTop: "1px solid var(--line-soft)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 7 }}>
                      {income > 0 && <div className="pp-stat" style={{ padding: "3px 0" }}><span>Refund on {fmtMoney(fhsaPlan)}</span><span style={{ fontWeight: 700, color: "var(--green)" }}>+{fmtMoney(fhsaSaving)}</span></div>}
                      <div className="pp-stat" style={{ padding: "3px 0" }}><span>Home withdrawal tax</span><span style={{ fontWeight: 700, color: "var(--green)" }}>None ✓</span></div>
                      <div className="pp-stat" style={{ padding: "3px 0", borderBottom: 0 }}><span>Closes</span><span style={{ fontWeight: 700 }}>{fhsaCloseYear ?? "—"}</span></div>
                    </div>
                    <div style={{ marginTop: 12, padding: "10px 12px", background: "#FAE8EF", borderRadius: 10, fontSize: 12.5, color: "#6B1A35", lineHeight: 1.55 }}>
                      <b>Best for</b> first-time home buyers. Deduction now + tax-free withdrawal. Stacks with HBP.
                    </div>
                  </div>
                )}
              </div>

              {/* Recommended strategy callout */}
              <div className="pp-card" style={{ borderColor: "var(--violet)", boxShadow: "0 0 0 2px rgba(112,68,190,.14)", marginBottom: 14, padding: "22px 24px" }}>
                <span style={{ display: "inline-block", fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: "#fff", background: "linear-gradient(135deg, var(--plum), var(--plum-2))", padding: "3px 10px", borderRadius: 999, marginBottom: 12 }}>
                  Recommended for your situation
                </span>
                <h4 style={{ fontFamily: "var(--display)", fontSize: 24, color: "var(--plum)", margin: "0 0 6px" }}>{recS.name}</h4>
                <div style={{ fontSize: 14, color: "var(--muted)", marginBottom: 12 }}>
                  Fund in order: <b style={{ color: "var(--plum)" }}>{recOrder.filter((a) => a !== "fhsa" || buyingHome).map((a) => ACCT_NAME[a]).join(" → ")}</b>
                </div>
                <p style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.65, margin: "0 0 18px" }}>
                  {marginal >= 0.30
                    ? <>At your <b>{pct1(marginal)}</b> tax rate, putting money into an RRSP gives you a real cash refund today — and you'll likely pay only <b>~{pct1(retMarginal)}</b> when you take it out in retirement. That gap of {pct1(Math.max(0, marginal - retMarginal))} per dollar is money you keep.</>
                    : marginal - retMarginal > 0.02
                    ? <>Your tax rate today (<b>{pct1(marginal)}</b>) is higher than what you're likely to pay in retirement (<b>~{pct1(retMarginal)}</b>). That makes RRSP contributions worthwhile — you save at a higher rate than you'll pay.</>
                    : <>Your tax rate today and in retirement are close. The TFSA is the better pick — your money grows completely tax-free and you can withdraw it any time without any tax or paperwork.</>}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  <div className="pp-rate-chip"><div className="l">Tax refund, year 1</div><div className="v">{fmtMoney(recS.sim.refundYr1)}</div><div className="h">back at tax time</div></div>
                  <div className="pp-rate-chip" style={{ background: "var(--violet-soft)" }}><div className="l">After-tax at {retAge}</div><div className="v">{fmtMoney(recS.sim.afterTax)}</div><div className="h">realistic withdrawals</div></div>
                  <div className="pp-rate-chip" style={{ background: "#F3ECDB" }}><div className="l">Sustainable income</div><div className="v">{fmtMoney(recS.sim.afterTax * 0.04)}/yr</div><div className="h">4% rule applied</div></div>
                </div>
              </div>

              {/* All strategies comparison table */}
              <div className="pp-card" style={{ overflowX: "auto" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--plum-2)", marginBottom: 10 }}>
                  All strategies — same {fmtMoney(annInv)}/yr, different outcomes
                </div>
                <table className="pp-cmp">
                  <thead>
                    <tr>
                      <th>Strategy</th>
                      <th>Order</th>
                      <th>Tax refund yr 1</th>
                      <th>After-tax at {retAge}</th>
                      <th>Annual income</th>
                      {buyingHome && <th>Down pmt @ {homeAge || "?"}</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {strats.map((s) => (
                      <tr key={s.key} className={s.key === recKey ? "rec" : ""}>
                        <td><span className="stratname">{s.name}</span>{s.key === recKey && <span className="recbadge">Rec</span>}</td>
                        <td style={{ fontSize: 12, color: "var(--muted)" }}>{(s.order || ["tfsa","rrsp"]).filter((a) => a !== "fhsa" || buyingHome).map((a) => ACCT_NAME[a]).join(" → ")}{s.mode === "balanced" ? " (50/50)" : ""}</td>
                        <td>{fmtMoney(s.sim.refundYr1)}</td>
                        <td className={s.sim.afterTax === bestAfterTax ? "best" : ""}>{fmtMoney(s.sim.afterTax)}</td>
                        <td>{fmtMoney(s.sim.afterTax * 0.04)}/yr</td>
                        {buyingHome && <td className={(s.sim.downAtHome || 0) === bestDown && bestDown > 0 ? "best" : ""}>{s.sim.downAtHome != null ? fmtMoney(s.sim.downAtHome) : "—"}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
                  <b style={{ color: "var(--green)" }}>Green</b> = highest in that column. Assumes {fmtMoney(annInv)}/yr at {pct1(ret)} returns, {pct1(marginal)} rate today, ~{pct1(retMarginal)} in retirement.
                </p>
              </div>
            </>
          );
        })() : (
          <div className="pp-card"><p style={{ color: "var(--muted)" }}>Add a monthly contribution in the planner to compare strategies with real figures.</p></div>
        )}
      </div>

      {/* OPTIMIZED TAX PLAN */}
      {income > 0 && (
        <div id="sec-taxplan" style={{ marginTop: 34 }}>
          <span className="pp-eyebrow"><Calculator size={14} /> Optimized tax plan</span>
          <h3 className="pp-sec-h">Exactly what to do with your money in {TAX_YEAR}</h3>
          <p className="pp-sec-lead">Based on your {fmtMoney(income)} income and {pct1(marginal)} marginal rate — the optimal order with the tax math shown.</p>
          {(() => {
            const yr1 = recSim.yr1 || { fhsa: 0, tfsa: 0, rrsp: 0, taxable: 0 };
            const deductibleTotal = (yr1.rrsp || 0) + (yr1.fhsa || 0);
            const totalTaxSaved = deductibleTotal > 0 ? deductionSaving(income, prov, empType, deductibleTotal) : 0;
            const netInvested = (yr1.rrsp || 0) + (yr1.fhsa || 0) + (yr1.tfsa || 0) + (yr1.taxable || 0);

            const taxSteps = [];
            taxSteps.push({
              key: "ef", done: emergencyFull,
              icon: <Shield size={16} />, accentColor: emergencyFull ? "var(--green)" : "#3D7A3B", accentBg: emergencyFull ? "var(--violet-soft)" : "#EAF5EA",
              label: "Emergency fund",
              badge: emergencyFull ? "Complete" : null,
              math: null,
              detail: emergencyFull
                ? "Fully funded — solid foundation for everything else."
                : `Build ${fmtMoney(efTargetAmt > 0 ? efTargetAmt : 0)} in a high-interest savings account (3–6 months of expenses). This comes before investing.`,
            });
            if (matchAmt > 0) taxSteps.push({
              key: "match", done: false,
              icon: <Landmark size={16} />, accentColor: "var(--gold)", accentBg: "#F8F0E0",
              label: "Capture your employer RRSP match",
              badge: "Free money",
              math: `${fmtMoney(matchAmt)} from you → ${fmtMoney(matchAmt)} matched = instant 100% return`,
              detail: "The highest guaranteed return you'll find anywhere. Always do this before anything else.",
            });
            if (debt > 0) taxSteps.push({
              key: "debt", done: false,
              icon: <AlertTriangle size={16} />, accentColor: "var(--rose)", accentBg: "#FAE8EF",
              label: "Pay off high-interest debt",
              badge: null,
              math: `Guaranteed, tax-free return — beats most investments`,
              detail: `Clearing ${fmtMoney(debt)} of high-interest debt is better than most investment returns.`,
            });
            if ((yr1.rrsp || 0) > 0) {
              const rrspSave = deductionSaving(income, prov, empType, yr1.rrsp || 0);
              taxSteps.push({
                key: "rrsp", done: false,
                icon: <Landmark size={16} />, accentColor: "var(--gold)", accentBg: "#F8F0E0",
                label: `RRSP — ${fmtMoney(yr1.rrsp)}/yr`,
                badge: rrspSave > 0 ? `+${fmtMoney(rrspSave)} refund` : null,
                math: `${fmtMoney(yr1.rrsp)} × ${pct1(marginal)} = ${fmtMoney(rrspSave)} tax back → your net cost is ${fmtMoney(Math.max(0, (yr1.rrsp || 0) - rrspSave))}`,
                detail: `The government sends you a refund cheque at tax time — your real cost to have $${(yr1.rrsp||0).toLocaleString()} invested is just ${fmtMoney(Math.max(0,(yr1.rrsp||0)-deductionSaving(income,prov,empType,yr1.rrsp||0)))}. The money then grows until retirement, when you pay ~${pct1(retMarginal)} tax on withdrawals — lower than today's ${pct1(marginal)}, so you come out ahead.`,
              });
            }
            if ((yr1.fhsa || 0) > 0 && buyingHome) {
              const rrspAlready = yr1.rrsp || 0;
              const combinedSave = deductionSaving(income, prov, empType, rrspAlready + (yr1.fhsa || 0));
              const rrspSaveAlone = rrspAlready > 0 ? deductionSaving(income, prov, empType, rrspAlready) : 0;
              const fhsaInc = combinedSave - rrspSaveAlone;
              taxSteps.push({
                key: "fhsa", done: false,
                icon: <HomeIcon size={16} />, accentColor: "var(--rose)", accentBg: "#FAE8EF",
                label: `FHSA — ${fmtMoney(yr1.fhsa)}/yr`,
                badge: fhsaInc > 0 ? `+${fmtMoney(fhsaInc)} refund` : null,
                math: `${fmtMoney(yr1.fhsa)} × ~${pct1(marginal)} ≈ ${fmtMoney(fhsaInc)} refund AND tax-free when you buy your home`,
                detail: `Unlike the RRSP, you'll never pay tax on this money when you use it to buy your home — it's tax-free on both sides. If you don't end up buying a home, you can move the whole balance to your RRSP with no tax hit. Closes ${fhsaCloseYear ? "by " + fhsaCloseYear : "after 15 years"}.`,
              });
            }
            if ((yr1.tfsa || 0) > 0) taxSteps.push({
              key: "tfsa", done: false,
              icon: <PiggyBank size={16} />, accentColor: "#3D7A3B", accentBg: "#EAF5EA",
              label: `TFSA — ${fmtMoney(yr1.tfsa)}/yr`,
              badge: null,
              math: "No refund now — but grows and withdraws tax-free, forever.",
              detail: "This money grows completely tax-free — dividends, gains, none of it taxed. Take it out any time for any reason (vacation, emergency, retirement). No forms, no tax. Room refills the next January after a withdrawal.",
            });
            if ((yr1.taxable || 0) > 0) taxSteps.push({
              key: "taxable", done: false,
              icon: <Wallet size={16} />, accentColor: "var(--blue)", accentBg: "#ECF0FA",
              label: `Non-registered — ${fmtMoney(yr1.taxable)}/yr`,
              badge: null,
              math: "All registered accounts are full — overflow goes here.",
              detail: "Growth is taxed at reduced rates (capital gains, eligible dividends). Still worth it once registered room is maxed.",
            });

            const firstUndoneIdx = taxSteps.findIndex((s) => !s.done);

            return (
              <div className="pp-card" style={{ padding: "6px 0" }}>
                {taxSteps.map((s, i) => (
                  <div key={s.key} style={{
                    display: "flex", gap: 16, alignItems: "flex-start",
                    padding: "18px 24px",
                    borderBottom: i < taxSteps.length - 1 ? "1px solid var(--line-soft)" : "none",
                    opacity: s.done ? 0.6 : 1,
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                      background: s.done ? "var(--violet-soft)" : s.accentBg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: s.accentColor,
                      outline: i === firstUndoneIdx && !s.done ? `2.5px solid ${s.accentColor}` : "none",
                      outlineOffset: "1px",
                    }}>
                      {s.done ? <Check size={17} style={{ color: "var(--green)" }} /> : s.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 7 }}>
                        <span style={{ fontFamily: "var(--display)", fontSize: 17, fontWeight: 600, color: "var(--plum)" }}>{s.label}</span>
                        {i === firstUndoneIdx && !s.done && (
                          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", background: "var(--violet)", color: "#fff", padding: "2px 8px", borderRadius: 999 }}>Do this now</span>
                        )}
                        {s.done && <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", background: "var(--green)", color: "#fff", padding: "2px 8px", borderRadius: 999 }}>Complete</span>}
                        {s.badge && !s.done && (
                          <span style={{ fontSize: 12, fontWeight: 800, color: "var(--green)", background: "#EAF5EA", padding: "2px 9px", borderRadius: 999, border: "1px solid rgba(61,122,59,.2)" }}>{s.badge}</span>
                        )}
                      </div>
                      {s.math && (
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--plum-2)", padding: "6px 11px", background: "rgba(112,68,190,.07)", borderRadius: 9, display: "inline-block", marginBottom: 8, lineHeight: 1.5 }}>
                          {s.math}
                        </div>
                      )}
                      <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>{s.detail}</p>
                    </div>
                  </div>
                ))}

                {/* Summary strip */}
                {(totalTaxSaved > 0 || recSim.afterTax > 0) && (
                  <div style={{ margin: "6px 24px 18px", padding: "16px 20px", background: "linear-gradient(120deg, var(--violet-soft), #F3ECDB)", borderRadius: 14, display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
                    {totalTaxSaved > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--plum-2)" }}>Tax saved this year</div>
                        <div style={{ fontFamily: "var(--display)", fontSize: 30, fontWeight: 600, color: "var(--green)", lineHeight: 1.1 }}>{fmtMoney(totalTaxSaved)}</div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>from RRSP{buyingHome ? " + FHSA" : ""} deductions</div>
                      </div>
                    )}
                    {totalTaxSaved > 0 && netInvested > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--plum-2)" }}>Real cost to invest</div>
                        <div style={{ fontFamily: "var(--display)", fontSize: 30, fontWeight: 600, color: "var(--plum)", lineHeight: 1.1 }}>{fmtMoney(Math.max(0, netInvested - totalTaxSaved))}</div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>after your tax refund</div>
                      </div>
                    )}
                    {recSim.afterTax > 0 && (
                      <div style={{ marginLeft: "auto" }}>
                        <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--plum-2)" }}>After-tax at {retAge}</div>
                        <div style={{ fontFamily: "var(--display)", fontSize: 30, fontWeight: 600, color: "var(--plum)", lineHeight: 1.1 }}>{fmtMoney(recSim.afterTax)}</div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>on your recommended path</div>
                      </div>
                    )}
                  </div>
                )}
                <p style={{ fontSize: 12, color: "var(--muted)", padding: "0 24px 18px", margin: 0 }}>
                  Estimates based on {TAX_YEAR} rules and your inputs — not personal financial advice. Limits, rates, and income may change.
                </p>
              </div>
            );
          })()}
        </div>
      )}

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
            <div className="pp-room-big">{fmtMoney(tfsaRoomLeft)}</div>
            <div className="pp-room-sub">
              {tfsaProvidedRoom > 0 ? "Room left (from your CRA figure)" : "This year's remaining room (no carryforward entered)"}
              {n(plan.birthYear) > 0 && <> · {fmtMoney(tfsaCum)} accumulated since 18</>}
            </div>
            <Bar used={tfsaUsed} total={tfsaRoomStart} color="var(--violet)" />
            <div className="pp-room-legend">
              <span>{tfsaProvidedRoom > 0 ? "CRA room" : "Annual room"}: {fmtMoney(tfsaRoomStart)}</span>
              <span>Contributed: {fmtMoney(tfsaUsed)}</span>
            </div>
            {tfsaOver && <div className="pp-overwarn"><AlertTriangle size={15} style={{ flex: "none" }} /><span>You've contributed more than your available room — <b>1%/month</b> penalty applies to the excess.</span></div>}
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
              series={selSeries} optSeries={stackedSeries ? null : optSeries}
              scaleRef={scaleRef} contribSeries={contribSeries}
              years={years} startAge={age} startMonth={startMonth}
              homeIdx={homeIdx} homeAge={homeAge} fhsaIdx={fhsaIdx}
              color={plan.risk === "custom" ? "var(--violet)" : sel.color}
              inflation={inflation} inflRate={inflRate}
              afterTax={afterTax} retMarginal={retMarginal} rrspShare={rrspShare}
              milestones={chartMilestones}
              stackedSeries={stackedSeries}
            />
            <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 14 }}>
              Hover / tap or use arrow keys to read any year.{" "}
              {stackedSeries
                ? <>Each coloured band shows one account type — they stack to your total wealth{homeEquityArr.some((v) => v > 0) ? ` (including home equity assuming a ${pct1(mortgageRateDecimal)} mortgage rate and ${pct1(homeApprecDecimal)} annual appreciation)` : ""}. Account balances shown before retirement tax.</>
                : <>The line follows your <b>{pct1(ret)}</b> return{fee > 0 ? `, after ${pct1(fee)} fee` : ""} — lower the return and the curve visibly flattens. {goalWithdrawals.length > 0 && `Dips show goal spending (${goalWithdrawals.map((w) => fmtMoney(w.amount)).join(" + ")} withdrawn). `}{inflation && "Values are discounted to today's dollars. "}{afterTax && (rrspShare > 0 ? `After-tax view taxes only the RRSP/locked-in share (~${pct1(rrspShare)}).` : "")}</>
              }{" "}Illustrative only.
            </p>
          </div>

          {optBoost > 1000 && (
            <div className="pp-opt-callout">
              <div className="pp-opt-callout-icon"><TrendingUp size={18} /></div>
              <div>
                <div className="pp-opt-callout-hd">
                  Optimal strategy adds <span>{fmtMoney(optBoost)}</span> to retirement
                </div>
                <div className="pp-opt-callout-body">
                  The <b style={{ color: "#2E8B57" }}>green dashed line</b> models what happens when you reinvest your ~{fmtMoney(Math.round(recSim.refundYr1))}/yr tax refund from {recOrder.filter(k => k === "rrsp" || k === "fhsa").map(k => k.toUpperCase()).join(" + ")} contributions back into your portfolio. Same income, same monthly amount — just smarter account use.
                </div>
              </div>
            </div>
          )}

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
