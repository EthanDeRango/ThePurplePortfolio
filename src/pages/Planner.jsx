import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Check, Info, Shield, Sparkles,
  PiggyBank, Landmark, Home as HomeIcon, AlertTriangle,
  GraduationCap, Heart, TrendingDown, Lock, Building2,
  Briefcase, Gift, TrendingUp,
} from "lucide-react";
import { NumberField, CurrencyField, SelectField, Accordion } from "../components/InputFields.jsx";
import { n, fmtMoney, todayISO, monthIndexOf, emergencyFundTarget } from "../lib/calculations.js";
import { TAX_CONFIG, PROV_LIST, RISK, TAX_YEAR } from "../lib/tax-config.js";
import { minDownPayment } from "../lib/calculations.js";
import { taxEngine } from "../lib/tax-engine.js";
import { GOALS } from "../data/goals.jsx";

// ─── Canadian account definitions ────────────────────────────────────────────
const CANADIAN_ACCOUNTS = [
  {
    key: "tfsa", name: "TFSA", full: "Tax-Free Savings Account",
    Icon: PiggyBank, accent: "#3D7A3B",
    blurb: "Tax-free growth. Withdraw any time, no tax ever.",
    renderDetail: (plan, set, fmt, TC) => (
      <>
        <CurrencyField id="ab-btfsa" label="Current balance" placeholder="0" value={plan.bTfsa} onChange={(v) => set("bTfsa", v)} />
        <div className="pp-row2" style={{ marginTop: 8 }}>
          <NumberField id="ab-birth" label="Birth year" placeholder="e.g. 1996" value={plan.birthYear} onChange={(v) => set("birthYear", v)}
            help="Sets your cumulative TFSA room since age 18." />
          <CurrencyField id="ab-tfsaused" label="Contributed this year" placeholder="0" value={plan.tfsaUsed} onChange={(v) => set("tfsaUsed", v)} />
        </div>
        <CurrencyField id="ab-tfsaroom"
          label={<>Available room from CRA <span style={{ color: "var(--muted)", fontWeight: 500 }}>· optional override</span></>}
          placeholder="e.g. 47,000" value={plan.tfsaAvailableRoom} onChange={(v) => set("tfsaAvailableRoom", v)}
          help="Check CRA My Account → TFSA for your exact available room." />
      </>
    ),
  },
  {
    key: "rrsp", name: "RRSP", full: "Registered Retirement Savings Plan",
    Icon: Landmark, accent: "#A8761E",
    blurb: "Tax deduction now. Taxed on withdrawal in retirement.",
    renderDetail: (plan, set) => (
      <>
        <CurrencyField id="ab-brrsp" label="Current balance" placeholder="0" value={plan.bRrsp} onChange={(v) => set("bRrsp", v)} />
        <div className="pp-row2" style={{ marginTop: 8 }}>
          <CurrencyField id="ab-rrsplimit" label="How much room you have left (optional)" placeholder="e.g. 12,000" value={plan.rrspLimitNOA} onChange={(v) => set("rrspLimitNOA", v)}
            help="Find this on your Notice of Assessment (NOA), the tax summary CRA mails after you file, or at CRA My Account online." />
          <CurrencyField id="ab-rrspused" label="Contributed this year" placeholder="0" value={plan.rrspUsed} onChange={(v) => set("rrspUsed", v)} />
        </div>
      </>
    ),
  },
  {
    key: "fhsa", name: "FHSA", full: "First Home Savings Account",
    Icon: HomeIcon, accent: "#9E3D65",
    blurb: "Tax deduction now + tax-free on withdrawal when buying your first home.",
    renderDetail: (plan, set, fmt, TC) => (
      <>
        <CurrencyField id="ab-bfhsa" label="Current balance" placeholder="0" value={plan.bFhsa} onChange={(v) => set("bFhsa", v)} />
        <div className="pp-row2" style={{ marginTop: 8 }}>
          <NumberField id="ab-fhsayear" label="Year you opened it" placeholder="e.g. 2024" value={plan.fhsaYearOpened} onChange={(v) => set("fhsaYearOpened", v)}
            help="Your 15-year closing deadline and room start from this year." />
          <CurrencyField id="ab-fhsalife" label="Contributed (lifetime total)" placeholder="0" value={plan.fhsaLifetimeUsed} onChange={(v) => set("fhsaLifetimeUsed", v)}
            help={`Toward the ${fmt(TC.fhsa.lifetime)} lifetime cap.`} />
        </div>
        <CurrencyField id="ab-fhsayrused" label="Contributed this year" placeholder="0" value={plan.fhsaThisYearUsed} onChange={(v) => set("fhsaThisYearUsed", v)} />
      </>
    ),
  },
  {
    key: "resp", name: "RESP", full: "Registered Education Savings Plan",
    Icon: GraduationCap, accent: "#2F60A8",
    blurb: "Tax-sheltered savings for a child's post-secondary education. Earns the Canada Education Savings Grant.",
    renderDetail: (plan, set) => {
      const hasEducationGoal = (plan.goals || []).includes("education");
      const hasResps = Array.isArray(plan.resps) && plan.resps.length > 0;
      if (hasEducationGoal && hasResps) {
        return (
          <div className="pp-help" style={{ marginTop: 0, fontStyle: "italic" }}>
            Your children's RESPs are managed in <b>Step 2, Your goals</b> above. Each child has their own entry there.
          </div>
        );
      }
      return (
        <>
          <CurrencyField id="ab-bresp" label="Current balance" placeholder="0" value={plan.bResp} onChange={(v) => set("bResp", v)} />
          <NumberField id="ab-respage" label="Beneficiary's current age" placeholder="e.g. 3" value={plan.respBeneficiaryAge} onChange={(v) => set("respBeneficiaryAge", v)}
            suffix="yrs" help="The child who will use the funds. The government education grant (CESG) matches 20% of contributions up to $2,500/yr. It stops at age 17." />
        </>
      );
    },
  },
  {
    key: "rdsp", name: "RDSP", full: "Registered Disability Savings Plan",
    Icon: Heart, accent: "#C05D5D",
    blurb: "Long-term savings for Canadians with disabilities. Canada Disability Savings Grant (CDSG) available.",
    renderDetail: (plan, set) => (
      <CurrencyField id="ab-brdsp" label="Current balance" placeholder="0" value={plan.bRdsp} onChange={(v) => set("bRdsp", v)} />
    ),
  },
  {
    key: "rrif", name: "RRIF", full: "Registered Retirement Income Fund",
    Icon: TrendingDown, accent: "#6B5EA8",
    blurb: "A converted RRSP you're drawing down. Mandatory annual withdrawals once open.",
    renderDetail: (plan, set) => (
      <CurrencyField id="ab-brrif" label="Current balance" placeholder="0" value={plan.bRrif} onChange={(v) => set("bRrif", v)}
        help="Taxed on withdrawal, just like an RRSP." />
    ),
  },
  {
    key: "lira", name: "LIRA", full: "Locked-In Retirement Account",
    Icon: Lock, accent: "#7A5230",
    blurb: "Old workplace pension money in a locked account. Restricted access until retirement age.",
    renderDetail: (plan, set) => (
      <CurrencyField id="ab-blocked" label="Current balance" placeholder="0" value={plan.bLocked} onChange={(v) => set("bLocked", v)}
        help="Also includes RPP and LIF transfers. Taxed like an RRSP on withdrawal." />
    ),
  },
  {
    key: "pension_db", name: "DB Pension", full: "Defined Benefit Pension",
    Icon: Building2, accent: "#2A7A5E",
    blurb: "A guaranteed monthly income from your employer in retirement, not market-based.",
    renderDetail: (plan, set) => (
      <>
        <CurrencyField id="ab-dbmonthly" label="Expected monthly income at retirement" placeholder="e.g. 2,500" value={plan.pensionDBMonthly} onChange={(v) => set("pensionDBMonthly", v)}
          help="From your pension statement or HR. Usually shown as an estimated amount at age 65." />
        <NumberField id="ab-dbstart" label="Pension start age" placeholder="65" value={plan.pensionDBStartAge} onChange={(v) => set("pensionDBStartAge", v)}
          suffix="yrs" help="Often 60 or 65. Taking it earlier usually reduces the monthly amount." />
      </>
    ),
  },
  {
    key: "pension_dc", name: "DC Pension", full: "Defined Contribution Pension",
    Icon: Briefcase, accent: "#4E7A3A",
    blurb: "You and your employer both contribute to a personal pension account. Returns depend on markets.",
    renderDetail: (plan, set) => (
      <>
        <CurrencyField id="ab-bpensiondc" label="Current balance" placeholder="0" value={plan.bPensionDC} onChange={(v) => set("bPensionDC", v)} />
        <NumberField id="ab-dcrate" label="Employer contribution" placeholder="e.g. 4" value={plan.pensionDCEmployerPct} onChange={(v) => set("pensionDCEmployerPct", v)}
          suffix="% of salary" help="Your employer adds this on top of your own contributions." />
      </>
    ),
  },
  {
    key: "dpsp", name: "DPSP", full: "Deferred Profit Sharing Plan",
    Icon: Gift, accent: "#8A6A2E",
    blurb: "Employer profit-sharing contributions to a registered plan. Vests over time.",
    renderDetail: (plan, set) => (
      <CurrencyField id="ab-bdpsp" label="Current balance (vested)" placeholder="0" value={plan.bDpsp} onChange={(v) => set("bDpsp", v)} />
    ),
  },
  {
    key: "nonreg", name: "Non-Reg", full: "Non-Registered / Taxable Account",
    Icon: TrendingUp, accent: "#5465A8",
    blurb: "No contribution limit. Growth is taxed annually (dividends, interest) and on sale (capital gains).",
    renderDetail: (plan, set) => (
      <CurrencyField id="ab-bnonreg" label="Current balance" placeholder="0" value={plan.bNonreg} onChange={(v) => set("bNonreg", v)} />
    ),
  },
];

export default function Planner({ plan, setPlan }) {
  const navigate = useNavigate();
  const set = (k, v) => setPlan((p) => ({ ...p, [k]: v }));
  const [showAssumptions, setShowAssumptions] = useState(false);


  const age = n(plan.age), retAge = n(plan.retAge), homeAge = n(plan.homeAge);
  const yrsRet = age > 0 && retAge > age ? retAge - age : null;
  const yrsHome = age > 0 && homeAge > age ? homeAge - age : null;

  // Account selection — null means not yet set (backward compat: infer from existing balances)
  const openAccts = plan.openAccounts ?? (() => {
    const auto = [];
    if (n(plan.bTfsa) > 0 || plan.birthYear || plan.tfsaUsed) auto.push("tfsa");
    if (n(plan.bRrsp) > 0 || plan.rrspLimitNOA) auto.push("rrsp");
    if (n(plan.bFhsa) > 0 || plan.fhsaYearOpened) auto.push("fhsa");
    if (n(plan.bResp) > 0) auto.push("resp");
    if (n(plan.bRdsp) > 0) auto.push("rdsp");
    if (n(plan.bRrif) > 0) auto.push("rrif");
    if (n(plan.bLocked) > 0) auto.push("lira");
    if (plan.pensionDBMonthly) auto.push("pension_db");
    if (n(plan.bPensionDC) > 0 || plan.pensionDCEmployerPct) auto.push("pension_dc");
    if (n(plan.bDpsp) > 0) auto.push("dpsp");
    if (n(plan.bNonreg) > 0) auto.push("nonreg");
    return auto;
  })();

  const toggleAcct = (key) => {
    const next = openAccts.includes(key)
      ? openAccts.filter((k) => k !== key)
      : [...openAccts, key];
    set("openAccounts", next);
  };
  const hasAcct = (key) => openAccts.includes(key);

  // validation errors
  const errors = {};
  if (plan.age !== undefined && plan.age !== "" && n(plan.age) <= 0) errors.age = "Age must be a positive number.";
  if (plan.income !== undefined && plan.income !== "" && n(plan.income) < 0) errors.income = "Income cannot be negative.";
  if (plan.retAge !== undefined && plan.retAge !== "" && age > 0 && n(plan.retAge) <= age) errors.retAge = `Retirement age must be greater than your current age (${age}).`;
  if (plan.buyHome && plan.homeAge !== undefined && plan.homeAge !== "" && age > 0 && n(plan.homeAge) <= age) errors.homeAge = `Home purchase age must be after your current age (${age}).`;
  const customRateNum = parseFloat(plan.customRate);
  const showRateWarn = plan.risk === "custom" && !isNaN(customRateNum) && customRateNum > 15;

  const hasFhsa = openAccts.includes("fhsa");
  const ready = age > 0 && retAge > age && !!plan.province && (!hasFhsa || n(plan.fhsaYearOpened) > 0);
  const onDone = () => { if (ready) navigate("/dashboard"); };
  const onExit = () => navigate("/");

  let retHelp;
  if (yrsRet == null) retHelp = <>Many Canadians target <b>60–65</b>. We've pre-filled 65; adjust it to your own plan.</>;
  else retHelp = <>That's about <b>{yrsRet} years</b> of investing from now, {yrsRet >= 30 ? "plenty of runway for compounding to do the heavy lifting." : yrsRet >= 15 ? "a solid runway to grow steadily." : "a shorter runway, so steadier choices matter more."}</>;

  // ── Progress across the 4 sections ──────────────────────────────────────────
  const step1Done = age > 0 && plan.income !== undefined && plan.income !== "" && !!plan.province;
  const step2Done = Array.isArray(plan.goals) && plan.goals.length > 0;
  const step3Done = n(plan.monthly) > 0 || n(plan.lumpSum) > 0 || n(plan.bTfsa) + n(plan.bRrsp) + n(plan.bFhsa) + n(plan.bNonreg) > 0;
  const step4Done = openAccts.length > 0;
  const steps = [
    { n: 1, label: "About you", done: step1Done },
    { n: 2, label: "Goals", done: step2Done },
    { n: 3, label: "Your money", done: step3Done },
    { n: 4, label: "Accounts", done: step4Done },
  ];
  const stepsComplete = steps.filter((s) => s.done).length;

  // ── Early value teaser: take-home pay, the moment income + province are in ───
  const teaserTax = (n(plan.income) > 0 && plan.province)
    ? taxEngine(n(plan.income), plan.province, plan.employmentType || "employed")
    : null;

  return (
    <div className="pp-wrap">
      <div className="pp-planner">
        <button className="pp-back" onClick={onExit}><ArrowLeft size={16} /> Home</button>
        <span className="pp-eyebrow" style={{ marginTop: 14, display: "block" }}><Sparkles size={14} /> Build your plan</span>
        <h1 style={{ fontSize: 38, margin: "10px 0 8px" }}>Your numbers, your plan.</h1>
        <p style={{ color: "var(--muted)", fontSize: 16, marginBottom: 16, maxWidth: "40em" }}>
          Enter your own estimates below. There are no wrong answers, and you can change anything later.
          We'll decode your paycheque, your room, and your projection.
        </p>

        <div className="pp-privacy-note">
          <Lock size={15} />
          <span><b>Private by default.</b> Everything you enter stays on this device, in your browser. Nothing is sent anywhere unless you create a free account to sync across your devices.</span>
        </div>

        {/* Progress across the 4 sections */}
        <div className="pp-progress" role="list" aria-label="Plan progress">
          {steps.map((s, i) => (
            <div key={s.n} className={"pp-progress-step" + (s.done ? " done" : "")} role="listitem">
              <span className="pp-progress-dot">{s.done ? <Check size={13} /> : s.n}</span>
              <span className="pp-progress-label">{s.label}</span>
              {i < steps.length - 1 && <span className="pp-progress-line" aria-hidden="true" />}
            </div>
          ))}
        </div>

        {/* 1 — About you */}
        <div className="pp-fs">
          <div className="pp-fs-head"><div className="pp-fs-num">1</div><h3>About you</h3></div>
          <p className="pp-fs-sub">The basics that set your tax picture and time horizon.</p>
          <div className="pp-row2">
            <NumberField id="f-age" label="Your age" placeholder="e.g. 19" value={plan.age} onChange={(v) => set("age", v)} suffix="years" error={errors.age} />
            <CurrencyField id="f-income" label="Annual income (CAD)" placeholder="e.g. 45,000" value={plan.income}
              onChange={(v) => setPlan((p) => {
                const next = { ...p, income: v };
                if (p.savingsMode === "percent") next.monthly = Math.round(n(v) * (parseFloat(p.savingsPct) || 0) / 100 / 12);
                return next;
              })} error={errors.income}
              help={<>Your total yearly pay <b>before</b> tax. Sets your tax rate, RRSP room, and payroll deductions (CPP and EI).</>} />
          </div>
          <div className="pp-row2">
            <SelectField id="f-prov" label="Province / territory" value={plan.province} onChange={(v) => set("province", v)} options={PROV_LIST}
              help={<>Tax is provincial, so this sets your brackets, rates, and credits.{plan.province === "QC" && <> Quebec uses QPP, QPIP, and the federal abatement.</>}</>} />
            <div className="pp-field">
              <label className="pp-label2">Employment type</label>
              <div className="pp-toggle">
                <button className={plan.employmentType === "employed" ? "on" : ""} onClick={() => set("employmentType", "employed")}>Employed</button>
                <button className={plan.employmentType === "self" ? "on" : ""} onClick={() => set("employmentType", "self")}>Self-employed</button>
                <button className={plan.employmentType === "incorporated" ? "on" : ""} onClick={() => set("employmentType", "incorporated")}>Incorporated</button>
              </div>
              <div className="pp-help">{plan.employmentType === "self"
                ? <>Self-employed people pay <b>both</b> the employee and employer halves of CPP (Canada Pension Plan), roughly double the normal deduction. No EI (Employment Insurance) typically applies.</>
                : plan.employmentType === "incorporated"
                  ? <>We model how you pay <i>yourself</i> personally: salary (with CPP) and/or dividends (no CPP/EI, taxed with the dividend tax credit). We do <b>not</b> model corporate tax, retained earnings, or salary-vs-dividend optimization inside the company. Your accountant handles those.</>
                  : <>Standard CPP pension contributions and EI (Employment Insurance) premiums are deducted from your pay.</>}</div>
            </div>
          </div>

          {plan.employmentType === "incorporated" && (
            <div className="pp-subcard" style={{ marginTop: 8 }}>
              <p className="pp-sub-h">How do you pay yourself?</p>
              <div className="pp-toggle">
                <button className={(plan.payMix || "salary") === "salary" ? "on" : ""} onClick={() => set("payMix", "salary")}>All salary</button>
                <button className={plan.payMix === "dividends" ? "on" : ""} onClick={() => set("payMix", "dividends")}>All dividends</button>
                <button className={plan.payMix === "mix" ? "on" : ""} onClick={() => set("payMix", "mix")}>A mix</button>
              </div>
              {plan.payMix === "mix" && (
                <div className="pp-field" style={{ marginTop: 12 }}>
                  <label className="pp-label2" htmlFor="f-salaryshare">Share taken as salary: <b>{n(plan.salaryShare) || 50}%</b> salary · {100 - (n(plan.salaryShare) || 50)}% dividends</label>
                  <input id="f-salaryshare" className="pp-range" type="range" min="0" max="100" step="5" value={n(plan.salaryShare) || 50} onChange={(e) => set("salaryShare", e.target.value)} />
                </div>
              )}
              {plan.payMix !== "salary" && (
                <div className="pp-field" style={{ marginTop: 12 }}>
                  <label className="pp-label2">Dividend type</label>
                  <div className="pp-toggle">
                    <button className={(plan.dividendType || "noneligible") === "noneligible" ? "on" : ""} onClick={() => set("dividendType", "noneligible")}>Non-eligible (small business)</button>
                    <button className={plan.dividendType === "eligible" ? "on" : ""} onClick={() => set("dividendType", "eligible")}>Eligible</button>
                  </div>
                  <div className="pp-help">Most owner-managers pay <b>non-eligible</b> dividends, from small-business-rate income. Eligible dividends come from income taxed at the general corporate rate.</div>
                </div>
              )}
              <div className="pp-help" style={{ marginTop: 10 }}>
                Heads up: <b>dividends don't create RRSP room</b> (only salary does) and don't count toward CPP. Tax figures here are <b>estimates</b>. Confirm with your accountant.
              </div>
            </div>
          )}

          <div className="pp-field" style={{ marginTop: 18 }}>
            <label className="pp-label2">How do you want to invest?</label>
            <div className="pp-seg">
              {RISK.map((r) => (
                <button key={r.key} className={"pp-segc" + (plan.risk === r.key ? " on" : "")} onClick={() => set("risk", r.key)}>
                  <div className="nm">{r.name} <span className="rt">~{Math.round(r.ret * 100)}%/yr</span></div>
                  <div className="ds">{r.desc}</div>
                </button>
              ))}
            </div>
            <button className={"pp-segc" + (plan.risk === "custom" ? " on" : "")} style={{ marginTop: 10, display: "block", width: "100%" }} onClick={() => set("risk", "custom")}>
              <div className="nm">Set my own rate <span className="rt">{plan.risk === "custom" ? `~${Number(plan.customRate || 0)}%/yr` : "custom"}</span></div>
              <div className="ds">Prefer your own assumption? Use any annual return you like.</div>
            </button>
            {plan.risk === "custom" && (
              <div className="pp-field" style={{ marginTop: 12, marginBottom: 0 }}>
                <label className="pp-label2" htmlFor="f-customrate">Your assumed annual return</label>
                <div className="pp-input-wrap">
                  <input id="f-customrate" className="pp-input" inputMode="decimal" value={plan.customRate}
                    onChange={(e) => { const raw = e.target.value.replace(/[^0-9.]/g, ""); set("customRate", raw); }} placeholder="e.g. 8.5" />
                  <span className="pp-adorn r">%</span>
                </div>
                {showRateWarn && (
                  <div className="pp-warn-rate">
                    <AlertTriangle size={15} style={{ flex: "none", marginTop: 1 }} />
                    <span>A rate above 15% is unusually high for long-term projections. Most broad market funds average 7–10% over time. Consider a more conservative assumption.</span>
                  </div>
                )}
                <div className="pp-toggle" style={{ marginTop: 10 }}>
                  <button className={plan.includeMER ? "on" : ""} onClick={() => set("includeMER", true)}>Subtract fund fees (MER)</button>
                  <button className={!plan.includeMER ? "on" : ""} onClick={() => set("includeMER", false)}>Return is already after fees</button>
                </div>
                {plan.includeMER && (
                  <div className="pp-input-wrap" style={{ marginTop: 10, maxWidth: 220 }}>
                    <input id="f-customfee" className="pp-input" inputMode="decimal" value={plan.customFee}
                      onChange={(e) => { const raw = e.target.value.replace(/[^0-9.]/g, ""); set("customFee", raw); }} placeholder="e.g. 0.5" />
                    <span className="pp-adorn r">% annual fund fee</span>
                  </div>
                )}
                <div className="pp-help">MER (Management Expense Ratio) is the annual fee your fund charges, usually 0.1–2.5%. Low-cost index ETFs are typically under 0.25%. The preset rates above already include fees.</div>
              </div>
            )}
            <div className="pp-help">Those percentages are illustrative long-run averages. Real returns vary year to year and aren't guaranteed. You can change this anytime on your dashboard.</div>
          </div>
        </div>

        {/* Early value teaser — a win before we ask for everything */}
        {teaserTax && (
          <div className="pp-teaser">
            <div className="pp-teaser-eyebrow"><Sparkles size={13} /> Already worth it</div>
            <div className="pp-teaser-row">
              <div>
                <div className="pp-teaser-big">{fmtMoney(teaserTax.netMonthly)}<span>/mo</span></div>
                <div className="pp-teaser-sub">your real take-home in {TAX_CONFIG.prov[plan.province].name}, after tax{teaserTax.cppTotal > 0 ? ", CPP" : ""}{teaserTax.ei > 0 ? " & EI" : ""}</div>
              </div>
              <div className="pp-teaser-aside">
                Keep going. Next we&apos;ll show your contribution room, tax savings, and a full projection to retirement.
              </div>
            </div>
          </div>
        )}

        {/* 2 — Your goals */}
        <div className="pp-fs">
          <div className="pp-fs-head"><div className="pp-fs-num">2</div><h3>Your goals</h3></div>
          <p className="pp-fs-sub">This shapes your whole dashboard: your plan, your priorities, and what we track.</p>
          <label className="pp-label2">What are your goals right now? <span style={{ fontWeight: 600, color: "var(--muted)" }}>· pick any that apply</span></label>
          <div className="pp-goalgrid">
            {GOALS.map((g) => {
              const Ic = g.icon;
              const on = (plan.goals || []).includes(g.key);
              return (
                <button key={g.key} className={"pp-goalc" + (on ? " on" : "")} onClick={() => {
                  const cur = plan.goals || [];
                  const next = on ? cur.filter((k) => k !== g.key) : [...cur, g.key];
                  set("goals", next.length ? next : ["retirement"]);
                  if (g.key === "house") set("buyHome", !on ? true : plan.buyHome);
                  // When adding education goal, migrate a legacy bResp into the resps array
                  if (g.key === "education" && !on && (!Array.isArray(plan.resps) || plan.resps.length === 0)) {
                    const seed = n(plan.bResp) > 0
                      ? [{ id: String(Date.now()), name: "", balance: plan.bResp, beneficiaryAge: plan.respBeneficiaryAge || "", monthlyContrib: "" }]
                      : [{ id: String(Date.now()), name: "", balance: "", beneficiaryAge: "", monthlyContrib: "" }];
                    set("resps", seed);
                  }
                }}>
                  {on && <span className="pp-goalcheck"><Check size={13} /></span>}
                  <Ic size={20} /><div className="nm">{g.name}</div><div className="ds">{g.blurb}</div>
                </button>
              );
            })}
          </div>

          {(plan.goals || []).includes("number") && (
            <CurrencyField id="f-targetnum" label="Your target invested amount" placeholder="e.g. 100,000" value={plan.targetNumber} onChange={(v) => set("targetNumber", v)}
              help={<>We'll estimate when you'd reach it at your current pace.</>} />
          )}

          {(plan.goals || []).includes("education") && (() => {
            const resps = Array.isArray(plan.resps) ? plan.resps : [];
            const updResp = (id, key, val) => set("resps", resps.map((r) => r.id === id ? { ...r, [key]: val } : r));
            const addResp = () => set("resps", [...resps, { id: String(Date.now()), name: "", balance: "", beneficiaryAge: "", monthlyContrib: "" }]);
            const rmResp = (id) => set("resps", resps.filter((r) => r.id !== id));
            return (
              <div className="pp-subcard">
                <p className="pp-sub-h">Each child's education fund</p>
                <div className="pp-help" style={{ marginTop: 0 }}>Add one entry per child. The government automatically adds a <b>20% grant (CESG)</b> on your first $2,500/yr per child, up to $500/yr of free money, until they turn 17.</div>
                {resps.map((r, i) => {
                  const age = n(r.beneficiaryAge);
                  const yearsLeft = age > 0 ? Math.max(0, 18 - age) : null;
                  const cesgYears = age > 0 ? Math.max(0, 17 - age) : null;
                  return (
                    <div key={r.id} style={{ marginTop: 14, paddingTop: 14, borderTop: i > 0 ? "1px solid var(--line-soft)" : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: "var(--plum)" }}>Child {i + 1}{r.name ? `: ${r.name}` : ""}</span>
                        {resps.length > 1 && <button className="pp-savedit-rm" onClick={() => rmResp(r.id)} aria-label="Remove">✕</button>}
                      </div>
                      <div className="pp-row2">
                        <div className="pp-field" style={{ marginBottom: 0 }}>
                          <label className="pp-label2">Child's name <span style={{ color: "var(--muted)", fontWeight: 400 }}>· optional</span></label>
                          <input className="pp-input" placeholder="e.g. Maya" value={r.name || ""} onChange={(e) => updResp(r.id, "name", e.target.value)} />
                        </div>
                        <NumberField label="Current age" placeholder="e.g. 5" value={r.beneficiaryAge} onChange={(v) => updResp(r.id, "beneficiaryAge", v)} suffix="yrs" />
                      </div>
                      <div className="pp-row2" style={{ marginTop: 8 }}>
                        <CurrencyField label="Current RESP balance" placeholder="0" value={r.balance} onChange={(v) => updResp(r.id, "balance", v)} />
                        <CurrencyField label="Monthly contribution" placeholder="e.g. 200" value={r.monthlyContrib} onChange={(v) => updResp(r.id, "monthlyContrib", v)}
                          help="A dedicated amount for this child's education, separate from your main monthly savings." />
                      </div>
                      {yearsLeft != null && (
                        <div className="pp-help" style={{ marginTop: 6, color: "var(--plum-2)" }}>
                          {yearsLeft > 0
                            ? <>{yearsLeft} years until university.{cesgYears > 0 ? <> CESG adds up to <b>$500/yr free</b> for {cesgYears} more year{cesgYears === 1 ? "" : "s"}.</> : " CESG has ended (age 17+)."}</>
                            : "University age reached. RESP can now be withdrawn for education."}
                        </div>
                      )}
                    </div>
                  );
                })}
                <button className="pp-btn pp-btn-ghost" style={{ marginTop: 14 }} onClick={addResp}>
                  + Add {resps.length === 0 ? "a child" : "another child"}
                </button>
              </div>
            );
          })()}

          {(plan.goals || []).includes("save") && (() => {
            const list = Array.isArray(plan.customGoals) ? plan.customGoals : [];
            const upd = (i, key, val) => { const next = list.map((g, gi) => gi === i ? { ...g, [key]: val } : g); set("customGoals", next); };
            const add = () => set("customGoals", [...list, { name: "", amount: "", years: "", date: "" }]);
            const rm = (i) => set("customGoals", list.filter((_, gi) => gi !== i));
            const todayStr = new Date().toISOString().slice(0, 10);
            const yrsFromDate = (d) => { const t = new Date(d + "T00:00:00"); if (isNaN(t)) return null; return (t - new Date()) / (365.25 * 24 * 3600 * 1000); };
            return (
              <div className="pp-subcard">
                <p className="pp-sub-h">What are you saving for?</p>
                <div className="pp-help" style={{ marginTop: 0 }}>Add as many separate goals as you like: a car, a wedding, a big trip, or <b>helping your kids with a home down payment</b>. Set a target amount and a due date, and the money is set aside from your projection at the right time.</div>
                {list.map((g, i) => {
                  const yd = g.date ? yrsFromDate(g.date) : null;
                  return (
                    <div key={i} className="pp-lifeevent">
                      <input className="pp-input" placeholder="What for? e.g. Maya's university" value={g.name || ""} onChange={(e) => upd(i, "name", e.target.value)} />
                      <div className="pp-lifeevent-row">
                        <div className="pp-input-wrap" style={{ maxWidth: 140 }}><span className="pp-adorn">$</span><input className="pp-input" inputMode="numeric" placeholder="amount" value={g.amount || ""} onChange={(e) => upd(i, "amount", e.target.value.replace(/[^0-9]/g, ""))} /></div>
                        <div className="pp-field" style={{ flex: 1, minWidth: 170, marginBottom: 0 }}>
                          <input type="date" className="pp-input" min={todayStr} value={g.date || ""} onChange={(e) => upd(i, "date", e.target.value)} aria-label="Due date" />
                        </div>
                        <button type="button" className="pp-lifeevent-rm" onClick={() => rm(i)} aria-label="Remove goal">✕</button>
                      </div>
                      {yd != null && (
                        <div className="pp-help" style={{ marginTop: 6 }}>
                          {yd < 0 ? "That date is in the past. Pick a future date." : yd < 3 ? <>Due in about <b>{Math.max(0, Math.round(yd))} year{Math.round(yd) === 1 ? "" : "s"}</b>. For goals under ~3 years, keeping the money in cash usually beats investing it.</> : <>Due in about <b>{Math.round(yd)} years</b>. We'll show the monthly amount to get there.</>}
                        </div>
                      )}
                    </div>
                  );
                })}
                <button className="pp-btn pp-btn-ghost" style={{ marginTop: 12 }} onClick={add}>+ Add a goal</button>
              </div>
            );
          })()}

          <div className="pp-row2" style={{ marginTop: 4 }}>
            <NumberField id="f-ret" label="What age do you expect to retire?" placeholder="65" value={plan.retAge} onChange={(v) => set("retAge", v)} suffix="years old" error={errors.retAge} help={retHelp} />
            <CurrencyField id="f-retspend" label="Yearly spending in retirement" placeholder="e.g. 50,000" value={plan.retSpend} onChange={(v) => set("retSpend", v)}
              help={<>In <b>today's</b> dollars, what would a comfortable year cost? We size the nest egg you'd need, about 25× that amount. Leave blank to assume ~70% of your income.</>} />
          </div>

          <div className="pp-field">
            <label className="pp-label2">Are you saving for a first home?</label>
            <div className="pp-toggle">
              <button className={plan.buyHome ? "on" : ""} onClick={() => set("buyHome", true)}>Yes</button>
              <button className={!plan.buyHome ? "on" : ""} onClick={() => set("buyHome", false)}>Not right now</button>
            </div>
          </div>

          {plan.buyHome && (
            <>
              <div className="pp-row2">
                <NumberField id="f-homeage" label="By what age would you like to buy?" placeholder="e.g. 28" value={plan.homeAge} onChange={(v) => set("homeAge", v)} suffix="years old"
                  error={errors.homeAge}
                  help={yrsHome != null ? <>About <b>{yrsHome} years</b> to save a down payment.{yrsHome <= 5 ? " A short timeline usually means keeping that money safer." : " Enough time to let it grow a little."}</> : <>We'll mark this milestone on your projection.</>} />
                <CurrencyField id="f-homeprice" label="About how much will the home cost?" placeholder="e.g. 550,000" value={plan.homePrice} onChange={(v) => set("homePrice", v)}
                  help={n(plan.homePrice) > 0 ? <>Minimum down payment: <b>{fmtMoney(minDownPayment(n(plan.homePrice)))}</b>.</> : <>We'll work out your minimum down payment and track progress toward it.</>} />
              </div>
              {n(plan.homePrice) > 0 && (
                <div className="pp-callout" style={{ marginTop: 4 }}>
                  <Info size={18} style={{ flex: "none" }} />
                  <span>On a {fmtMoney(n(plan.homePrice))} home, the legal minimum down payment is <b>{fmtMoney(minDownPayment(n(plan.homePrice)))}</b>. {n(plan.homePrice) < 1500000 ? <>Putting down less than <b>20% ({fmtMoney(n(plan.homePrice) * 0.2)})</b> requires <b>mortgage default insurance (CMHC)</b>, a one-time premium of roughly 2.8–4% rolled into your mortgage.</> : <>At this price, the rules require a full <b>20%</b> down, with no mortgage insurance required.</>}</span>
                </div>
              )}
            </>
          )}

          {/* Optional rate knobs, grouped out of the way with sensible defaults */}
          <Accordion
            title="Fine-tune the assumptions"
            sub="Optional. We use sensible Canadian defaults if you skip these."
            open={showAssumptions}
            onToggle={() => setShowAssumptions((v) => !v)}
          >
            <div className="pp-field" style={{ marginBottom: plan.buyHome ? 14 : 0 }}>
              <label className="pp-label2" htmlFor="f-infl">Inflation rate</label>
              <div className="pp-input-wrap" style={{ maxWidth: 200 }}>
                <input id="f-infl" className="pp-input" inputMode="decimal" value={plan.inflationRate != null ? plan.inflationRate : ""} placeholder="2"
                  onChange={(e) => set("inflationRate", e.target.value.replace(/[^0-9.]/g, ""))} />
                <span className="pp-adorn r">%/yr</span>
              </div>
              <div className="pp-help">Prices rise a little each year, so a dollar buys less over time. Canada has averaged about <b>2%</b>. We use this to show your retirement target in today's dollars. Defaults to 2%.</div>
            </div>

            {plan.buyHome && (
              <div className="pp-row2">
                <div className="pp-field" style={{ marginBottom: 0 }}>
                  <label className="pp-label2" htmlFor="f-mortgagerate">Mortgage rate</label>
                  <div className="pp-input-wrap">
                    <input id="f-mortgagerate" className="pp-input" inputMode="decimal"
                      value={plan.mortgageRate ?? ""} placeholder="5.0"
                      onChange={(e) => set("mortgageRate", e.target.value.replace(/[^0-9.]/g, ""))} />
                    <span className="pp-adorn r">%/yr</span>
                  </div>
                  <div className="pp-help">Used to project your home equity. Defaults to 5%.</div>
                </div>
                <div className="pp-field" style={{ marginBottom: 0 }}>
                  <label className="pp-label2" htmlFor="f-homeapprec">Home appreciation</label>
                  <div className="pp-input-wrap">
                    <input id="f-homeapprec" className="pp-input" inputMode="decimal"
                      value={plan.homeAppreciation ?? ""} placeholder="2.5"
                      onChange={(e) => set("homeAppreciation", e.target.value.replace(/[^0-9.]/g, ""))} />
                    <span className="pp-adorn r">%/yr</span>
                  </div>
                  <div className="pp-help">How fast the home's value grows. Defaults to 2.5%.</div>
                </div>
              </div>
            )}
          </Accordion>
        </div>

        {/* 3 — Your money */}
        <div className="pp-fs">
          <div className="pp-fs-head"><div className="pp-fs-num">3</div><h3>Your money</h3></div>
          <p className="pp-fs-sub">What you can add, and what you've already invested.</p>
          <div className="pp-field">
            <label className="pp-label2" htmlFor="f-asof">Today's date</label>
            <input id="f-asof" type="date" className="pp-input" style={{ maxWidth: 230 }} value={plan.asOf || todayISO()} onChange={(e) => set("asOf", e.target.value)} />
            <div className="pp-help">We project forward from today. A mid-year start only counts the months left this year.</div>
          </div>
          {/* Monthly savings — enter as a dollar amount or as a % of income */}
          {(() => {
            const savingsMode = plan.savingsMode === "percent" ? "percent" : "amount";
            const pctNum = parseFloat(plan.savingsPct) || 0;
            const monthlyFromPct = Math.round(n(plan.income) * pctNum / 100 / 12);
            return (
              <div className="pp-field">
                <div className="pp-label-row">
                  <label className="pp-label2" htmlFor="f-monthly" style={{ marginBottom: 0 }}>How much can you set aside each month?</label>
                  <div className="pp-toggle pp-toggle-sm">
                    <button type="button" className={savingsMode === "amount" ? "on" : ""} onClick={() => set("savingsMode", "amount")}>$ amount</button>
                    <button type="button" className={savingsMode === "percent" ? "on" : ""}
                      onClick={() => setPlan((p) => ({ ...p, savingsMode: "percent", monthly: Math.round(n(p.income) * (parseFloat(p.savingsPct) || 0) / 100 / 12) || n(p.monthly) }))}>% of income</button>
                  </div>
                </div>
                {savingsMode === "amount" ? (
                  <>
                    <div className="pp-input-wrap">
                      <span className="pp-adorn">$</span>
                      <input id="f-monthly" className="pp-input" inputMode="numeric" placeholder="e.g. 300"
                        value={plan.monthly === "" || plan.monthly == null ? "" : Number(plan.monthly).toLocaleString("en-CA")}
                        onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ""); set("monthly", raw === "" ? "" : Number(raw)); }} />
                    </div>
                    <div className="pp-help">Your total monthly savings. This one number covers everything: emergency fund, debt, <em>and</em> investing. {n(plan.monthly) > 0 && <>That's <b>{fmtMoney(n(plan.monthly) * 12)}</b> a year.</>}</div>
                  </>
                ) : (
                  <>
                    <div className="pp-input-wrap" style={{ maxWidth: 220 }}>
                      <input id="f-monthly" className="pp-input" inputMode="decimal" placeholder="e.g. 15"
                        value={plan.savingsPct ?? ""}
                        onChange={(e) => { const pct = e.target.value.replace(/[^0-9.]/g, ""); setPlan((p) => ({ ...p, savingsPct: pct, monthly: Math.round(n(p.income) * (parseFloat(pct) || 0) / 100 / 12) })); }} />
                      <span className="pp-adorn r">%</span>
                    </div>
                    {n(plan.income) > 0 && pctNum > 0
                      ? <div className="pp-help">That's about <b>{fmtMoney(monthlyFromPct)}/mo</b> ({fmtMoney(monthlyFromPct * 12)} a year) at your current income. Many people aim for around <b>15%</b>.</div>
                      : <div className="pp-help">Set your income in Step 1, then choose a percentage. Many people aim to invest around <b>15%</b> of their income.</div>}
                  </>
                )}
              </div>
            );
          })()}
          <CurrencyField id="f-lump" label="One-time lump sum to invest now (optional)" placeholder="e.g. 5,000" value={plan.lumpSum} onChange={(v) => set("lumpSum", v)} />
          <div className="pp-field">
            <label className="pp-label2" htmlFor="f-incgrowth">Do you expect your income to grow? <span style={{ fontWeight: 600, color: "var(--muted)" }}>· optional</span></label>
            <div className="pp-input-wrap" style={{ maxWidth: 220 }}>
              <input id="f-incgrowth" className="pp-input" inputMode="decimal" placeholder="e.g. 3"
                value={plan.incomeGrowth ?? ""} onChange={(e) => set("incomeGrowth", e.target.value.replace(/[^0-9.]/g, ""))} />
              <span className="pp-adorn r">%/yr</span>
            </div>
            <div className="pp-help">As your pay rises, your investing usually rises with it. We grow your monthly contributions by this each year. Canadian raises have averaged around <b>3%</b>. Leave blank to keep contributions flat.</div>
          </div>
          <div className="pp-field">
            <label className="pp-label2">Do your monthly amounts vary?</label>
            <div className="pp-toggle">
              <button className={(plan.contribMode || "flat") === "flat" ? "on" : ""} onClick={() => set("contribMode", "flat")}>Same every month</button>
              <button className={plan.contribMode === "custom" ? "on" : ""} onClick={() => set("contribMode", "custom")}>Set each month</button>
            </div>
            <div className="pp-help">Pick "Set each month" to enter a different amount per month for <b>this year</b>. Later years fall back to the recurring monthly amount above.</div>
          </div>
          {plan.contribMode === "custom" && (
            <div className="pp-months">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((mlab, mi) => {
                const past = mi < monthIndexOf(plan.asOf);
                return (
                  <div className={"pp-month" + (past ? " past" : "")} key={mi}>
                    <label htmlFor={"f-mo" + mi}>{mlab}{past ? " ·" : ""}</label>
                    <div className="pp-input-wrap">
                      <span className="pp-adorn">$</span>
                      <input id={"f-mo" + mi} className="pp-input" inputMode="numeric" disabled={past}
                        value={(plan.months && (plan.months[mi] === "" || plan.months[mi] == null)) ? "" : Number(plan.months[mi]).toLocaleString("en-CA")}
                        onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ""); const arr = [...(plan.months || Array(12).fill(""))]; arr[mi] = raw === "" ? "" : Number(raw); set("months", arr); }} placeholder="0" />
                    </div>
                  </div>
                );
              })}
              <div className="pp-month-total">
                Remaining this year: <b>{fmtMoney((plan.months || []).reduce((a, b, mi) => mi >= monthIndexOf(plan.asOf) ? a + n(b) : a, 0))}</b>
                {monthIndexOf(plan.asOf) > 0 && <span style={{ color: "var(--muted)", fontWeight: 600 }}> · earlier months have passed</span>}
              </div>
            </div>
          )}

          <div className="pp-field" style={{ marginTop: 4 }}>
            <label className="pp-label2">Do you have an emergency fund?</label>
            <div className="pp-seg2">
              <button className={plan.emergencyStatus === "full" ? "on" : ""} onClick={() => set("emergencyStatus", "full")}>Yes, fully</button>
              <button className={plan.emergencyStatus === "partial" ? "on" : ""} onClick={() => set("emergencyStatus", "partial")}>Partially</button>
              <button className={(plan.emergencyStatus || "none") === "none" ? "on" : ""} onClick={() => set("emergencyStatus", "none")}>Not yet</button>
            </div>
            <div className="pp-help">A cash cushion usually comes before serious investing. It's the foundation of the order of operations.</div>
          </div>
          {plan.emergencyStatus !== "full" && (
            <div className="pp-subcard">
              <p className="pp-sub-h">Let's size the right cushion for you.</p>
              <div className="pp-row2">
                <CurrencyField id="f-expenses" label="Your essential monthly expenses" placeholder="e.g. 2,500" value={plan.livingExpenses} onChange={(v) => set("livingExpenses", v)}
                  help={<>Rent, food, utilities, transport, insurance. Must-pays only.</>} />
                <div className="pp-field">
                  <label className="pp-label2">How steady is your income?</label>
                  <div className="pp-seg2">
                    <button className={plan.incomeStability === "stable" ? "on" : ""} onClick={() => set("incomeStability", "stable")}>Very stable</button>
                    <button className={(plan.incomeStability || "variable") === "variable" ? "on" : ""} onClick={() => set("incomeStability", "variable")}>Somewhat variable</button>
                    <button className={plan.incomeStability === "risky" ? "on" : ""} onClick={() => set("incomeStability", "risky")}>Unpredictable</button>
                  </div>
                </div>
              </div>
              {plan.emergencyStatus === "partial" && (
                <CurrencyField id="f-efsaved" label="How much have you saved so far?" placeholder="e.g. 3,000" value={plan.emergencySaved} onChange={(v) => set("emergencySaved", v)} />
              )}
              {n(plan.livingExpenses) > 0 && (() => {
                const ef = emergencyFundTarget(plan.livingExpenses, plan.incomeStability);
                const gap = Math.max(0, ef.amount - n(plan.emergencySaved));
                return (
                  <div className="pp-callout" style={{ marginBottom: 0 }}>
                    <Shield size={18} style={{ flex: "none" }} />
                    <span>Aim for about <b>{fmtMoney(ef.amount)}</b>, roughly <b>{ef.months} months</b> of essentials.{plan.emergencyStatus === "partial" && n(plan.emergencySaved) > 0 ? <> You're <b>{fmtMoney(gap)}</b> away.</> : ""} Keep it in a high-interest savings account, separate from investing.</span>
                  </div>
                );
              })()}
            </div>
          )}

          <div className="pp-row2" style={{ marginTop: 16 }}>
            <CurrencyField id="f-match" label="Employer RRSP match (per year, optional)" placeholder="e.g. 2,000" value={plan.employerMatch} onChange={(v) => set("employerMatch", v)}
              help={<>If your employer matches RRSP contributions, that's an instant ~100% return.</>} />
            <CurrencyField id="f-debt" label="High-interest debt (optional)" placeholder="e.g. 5,000" value={plan.highInterestDebt} onChange={(v) => set("highInterestDebt", v)}
              help={<>Credit cards or other debt above ~10%. Paying it off is a guaranteed, tax-free return.</>} />
          </div>

          {/* Life changes over time (optional) */}
          {(() => {
            const events = Array.isArray(plan.lifeEvents) ? plan.lifeEvents : [];
            const upd = (id, key, val) => set("lifeEvents", events.map((e) => e.id === id ? { ...e, [key]: val } : e));
            const add = () => set("lifeEvents", [...events, { id: String(Date.now()), type: "invest-more", amount: "", age: "", label: "" }]);
            const rm = (id) => set("lifeEvents", events.filter((e) => e.id !== id));
            const TYPES = [
              { v: "invest-more", label: "Free up money to invest (+$/mo)" },
              { v: "invest-less", label: "New ongoing cost (−$/mo)" },
              { v: "income", label: "Income changes to ($/yr)" },
            ];
            return (
              <div className="pp-subcard" style={{ marginTop: 16 }}>
                <p className="pp-sub-h">Life changes over time <span style={{ fontWeight: 600, color: "var(--muted)" }}>· optional</span></p>
                <div className="pp-help" style={{ marginTop: 0 }}>
                  Know something will shift? Add it and your projection follows along. For example: a child finishes university so you can invest <b>$1,200/mo more</b> at age 52, a new cost begins, or your income changes.
                </div>
                {events.map((e) => (
                  <div key={e.id} className="pp-lifeevent">
                    <input className="pp-input" placeholder="What changes? e.g. Maya finishes university"
                      value={e.label || ""} onChange={(ev) => upd(e.id, "label", ev.target.value)} />
                    <div className="pp-lifeevent-row">
                      <select className="pp-input" value={e.type} onChange={(ev) => upd(e.id, "type", ev.target.value)} aria-label="Change type">
                        {TYPES.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
                      </select>
                      <div className="pp-input-wrap" style={{ maxWidth: 130 }}><span className="pp-adorn">$</span>
                        <input className="pp-input" inputMode="numeric" placeholder={e.type === "income" ? "new income" : "amount"}
                          value={e.amount || ""} onChange={(ev) => upd(e.id, "amount", ev.target.value.replace(/[^0-9]/g, ""))} /></div>
                      <div className="pp-input-wrap" style={{ maxWidth: 120 }}>
                        <input className="pp-input" inputMode="numeric" placeholder="age" value={e.age || ""} onChange={(ev) => upd(e.id, "age", ev.target.value.replace(/[^0-9]/g, ""))} />
                        <span className="pp-adorn r">at age</span></div>
                      <button type="button" className="pp-lifeevent-rm" onClick={() => rm(e.id)} aria-label="Remove">✕</button>
                    </div>
                  </div>
                ))}
                <button type="button" className="pp-btn pp-btn-ghost" style={{ marginTop: 12 }} onClick={add}>
                  + Add a change
                </button>
              </div>
            );
          })()}
        </div>

        {/* 4 — Your accounts */}
        <div className="pp-fs">
          <div className="pp-fs-head"><div className="pp-fs-num">4</div><h3>Your accounts</h3></div>
          <p className="pp-fs-sub">Check every account type you hold, including RRSPs, TFSAs, pensions, and more. We'll ask for the details that matter for your plan.</p>

          <div className="pp-acct-grid">
            {CANADIAN_ACCOUNTS.map(({ key, name, full, Icon, accent, blurb }) => {
              const on = hasAcct(key);
              return (
                <button
                  key={key}
                  type="button"
                  className={"pp-acct-card" + (on ? " on" : "")}
                  style={on ? { borderColor: accent, background: accent + "12" } : {}}
                  onClick={() => toggleAcct(key)}
                >
                  {on && <span className="pp-goalcheck"><Check size={13} /></span>}
                  <div className="pp-acct-card-icon" style={{ color: on ? accent : "var(--muted)" }}><Icon size={20} /></div>
                  <div className="pp-acct-card-name">{name}</div>
                  <div className="pp-acct-card-full">{full}</div>
                  <div className="pp-acct-card-blurb">{blurb}</div>
                </button>
              );
            })}
          </div>

          {openAccts.length === 0 && (
            <div className="pp-callout" style={{ marginTop: 12 }}>
              <Info size={18} style={{ flex: "none" }} />
              <span>Starting from zero? No problem. Skip this section and continue; you can always come back and add accounts later.</span>
            </div>
          )}

          {CANADIAN_ACCOUNTS.filter((a) => hasAcct(a.key)).map((acct) => (
            <div key={acct.key} className="pp-acct-detail" style={{ borderLeftColor: acct.accent }}>
              <div className="pp-acct-detail-hd">
                <acct.Icon size={15} style={{ color: acct.accent, flexShrink: 0 }} />
                <span>{acct.full}</span>
                <span className="pp-acct-detail-tag">{acct.name}</span>
                {acct.key === "fhsa" && hasFhsa && !(n(plan.fhsaYearOpened) > 0) && (
                  <span className="pp-req" style={{ marginLeft: "auto" }}>open year required</span>
                )}
              </div>
              {acct.renderDetail(plan, set, fmtMoney, TAX_CONFIG)}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
          <button
            className="pp-btn pp-btn-primary"
            disabled={!ready}
            style={{ opacity: ready ? 1 : 0.45 }}
            onClick={onDone}
          >
            See my plan <ArrowRight size={18} />
          </button>
        </div>
        {!ready && (
          <p style={{ textAlign: "right", fontSize: 12.5, color: "var(--muted)", marginTop: 8 }}>
            {hasFhsa && !(n(plan.fhsaYearOpened) > 0)
              ? "Add the year you opened your FHSA in Step 4 to continue."
              : "Enter your age, a retirement age above it, and your province to continue."}
          </p>
        )}
      </div>
    </div>
  );
}
