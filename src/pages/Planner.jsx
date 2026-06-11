import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Check, Info, Shield, Sparkles,
  PiggyBank, Landmark, Home as HomeIcon, AlertTriangle,
} from "lucide-react";
import { NumberField, CurrencyField, SelectField } from "../components/InputFields.jsx";
import { n, fmtMoney, todayISO, monthIndexOf, emergencyFundTarget } from "../lib/calculations.js";
import { TAX_CONFIG, PROV_LIST, RISK, TAX_YEAR } from "../lib/tax-config.js";
import { minDownPayment } from "../lib/calculations.js";
import { GOALS } from "../data/goals.jsx";

export default function Planner({ plan, setPlan }) {
  const navigate = useNavigate();
  const set = (k, v) => setPlan((p) => ({ ...p, [k]: v }));


  const age = n(plan.age), retAge = n(plan.retAge), homeAge = n(plan.homeAge);
  const yrsRet = age > 0 && retAge > age ? retAge - age : null;
  const yrsHome = age > 0 && homeAge > age ? homeAge - age : null;

  // validation errors
  const errors = {};
  if (plan.age !== undefined && plan.age !== "" && n(plan.age) <= 0) errors.age = "Age must be a positive number.";
  if (plan.income !== undefined && plan.income !== "" && n(plan.income) < 0) errors.income = "Income cannot be negative.";
  if (plan.retAge !== undefined && plan.retAge !== "" && age > 0 && n(plan.retAge) <= age) errors.retAge = `Retirement age must be greater than your current age (${age}).`;
  const customRateNum = parseFloat(plan.customRate);
  const showRateWarn = plan.risk === "custom" && !isNaN(customRateNum) && customRateNum > 15;

  const ready = age > 0 && retAge > age && !!plan.province && (n(plan.bFhsa) <= 0 || n(plan.fhsaYearOpened) > 0);
  const onDone = () => { if (ready) navigate("/dashboard"); };
  const onExit = () => navigate("/");

  let retHelp;
  if (yrsRet == null) retHelp = <>Many Canadians target <b>60–65</b>. We've pre-filled 65 — adjust it to your own plan.</>;
  else retHelp = <>That's about <b>{yrsRet} years</b> of investing from now — {yrsRet >= 30 ? "plenty of runway for compounding to do the heavy lifting." : yrsRet >= 15 ? "a solid runway to grow steadily." : "a shorter runway, so steadier choices matter more."}</>;

  return (
    <div className="pp-wrap">
      <div className="pp-planner">
        <button className="pp-back" onClick={onExit}><ArrowLeft size={16} /> Home</button>
        <span className="pp-eyebrow" style={{ marginTop: 14, display: "block" }}><Sparkles size={14} /> Build your plan</span>
        <h1 style={{ fontSize: 38, margin: "10px 0 8px" }}>Your numbers, your plan.</h1>
        <p style={{ color: "var(--muted)", fontSize: 16, marginBottom: 28, maxWidth: "40em" }}>
          Enter your own estimates below — there are no wrong answers, and you can change anything later.
          We'll decode your paycheque, your room, and your projection.
        </p>

        {/* 1 — About you */}
        <div className="pp-fs">
          <div className="pp-fs-head"><div className="pp-fs-num">1</div><h3>About you</h3></div>
          <p className="pp-fs-sub">The basics that set your tax picture and time horizon.</p>
          <div className="pp-row2">
            <NumberField id="f-age" label="Your age" placeholder="e.g. 19" value={plan.age} onChange={(v) => set("age", v)} suffix="years" error={errors.age}
              help={<>Your age is the single biggest factor in long-term growth — earlier means more time to compound.</>} />
            <CurrencyField id="f-income" label="Annual income (CAD)" placeholder="e.g. 45,000" value={plan.income} onChange={(v) => set("income", v)} error={errors.income}
              help={<>Your gross employment income, before deductions. We use it for tax, CPP/EI, and contribution room.</>} />
          </div>
          <div className="pp-row2">
            <SelectField id="f-prov" label="Province / territory" value={plan.province} onChange={(v) => set("province", v)} options={PROV_LIST}
              help={<>Tax is provincial — this drives your brackets, rates, and credits.{plan.province === "QC" && <> Quebec uses QPP, QPIP, and the federal abatement.</>}</>} />
            <div className="pp-field">
              <label className="pp-label2">Employment type</label>
              <div className="pp-toggle">
                <button className={plan.employmentType === "employed" ? "on" : ""} onClick={() => set("employmentType", "employed")}>Employed</button>
                <button className={plan.employmentType === "self" ? "on" : ""} onClick={() => set("employmentType", "self")}>Self-employed</button>
              </div>
              <div className="pp-help">{plan.employmentType === "self" ? <>Self-employed pay <b>both</b> CPP halves and usually no EI.</> : <>Standard CPP/CPP2 and EI premiums apply.</>}</div>
            </div>
          </div>

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
                    <span>A rate above 15% is unusually high for long-term projections — most broad market funds average 7–10% over time. Consider a more conservative assumption.</span>
                  </div>
                )}
                <div className="pp-toggle" style={{ marginTop: 10 }}>
                  <button className={plan.includeMER ? "on" : ""} onClick={() => set("includeMER", true)}>Subtract MER fees</button>
                  <button className={!plan.includeMER ? "on" : ""} onClick={() => set("includeMER", false)}>Return is already net</button>
                </div>
                {plan.includeMER && (
                  <div className="pp-input-wrap" style={{ marginTop: 10, maxWidth: 220 }}>
                    <input id="f-customfee" className="pp-input" inputMode="decimal" value={plan.customFee}
                      onChange={(e) => { const raw = e.target.value.replace(/[^0-9.]/g, ""); set("customFee", raw); }} placeholder="e.g. 0.5" />
                    <span className="pp-adorn r">% MER</span>
                  </div>
                )}
                <div className="pp-help">The preset Conservative/Moderate/Aggressive rates are treated as <em>net</em> long-run returns, so no fee is applied. Only your own custom rate can optionally have an MER subtracted.</div>
              </div>
            )}
            <div className="pp-help">Those percentages are illustrative long-run averages — real returns vary year to year and aren't guaranteed. You can change this anytime on your dashboard.</div>
          </div>
        </div>

        {/* 2 — Your goals */}
        <div className="pp-fs">
          <div className="pp-fs-head"><div className="pp-fs-num">2</div><h3>Your goals</h3></div>
          <p className="pp-fs-sub">This shapes your whole dashboard — your plan, your priorities, and what we track.</p>
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

          {(plan.goals || []).includes("save") && (() => {
            const list = Array.isArray(plan.customGoals) ? plan.customGoals : [];
            const upd = (i, key, val) => { const next = list.map((g, gi) => gi === i ? { ...g, [key]: val } : g); set("customGoals", next); };
            const add = () => set("customGoals", [...list, { name: "", amount: "", years: "" }]);
            const rm = (i) => set("customGoals", list.filter((_, gi) => gi !== i));
            return (
              <div className="pp-subcard">
                <p className="pp-sub-h">What are you saving for?</p>
                <div className="pp-help" style={{ marginTop: 0 }}>Add as many separate goals as you like — a child's education, a car, a wedding, a big trip. Each gets its own plan.</div>
                {list.map((g, i) => (
                  <div key={i} className="pp-savedit">
                    <input className="pp-input" placeholder="What for? e.g. Maya's university" value={g.name || ""} onChange={(e) => upd(i, "name", e.target.value)} />
                    <div className="pp-input-wrap" style={{ maxWidth: 150 }}><span className="pp-adorn">$</span><input className="pp-input" inputMode="numeric" placeholder="amount" value={g.amount || ""} onChange={(e) => upd(i, "amount", e.target.value.replace(/[^0-9]/g, ""))} /></div>
                    <div className="pp-input-wrap" style={{ maxWidth: 130 }}><input className="pp-input" inputMode="numeric" placeholder="years" value={g.years || ""} onChange={(e) => upd(i, "years", e.target.value.replace(/[^0-9]/g, ""))} /><span className="pp-adorn r">yrs</span></div>
                    <button className="pp-savedit-rm" onClick={() => rm(i)} aria-label="Remove goal">✕</button>
                  </div>
                ))}
                <button className="pp-btn pp-btn-ghost" style={{ marginTop: 4 }} onClick={add}>+ Add a goal</button>
              </div>
            );
          })()}

          <div className="pp-row2" style={{ marginTop: 4 }}>
            <NumberField id="f-ret" label="What age do you expect to retire?" placeholder="65" value={plan.retAge} onChange={(v) => set("retAge", v)} suffix="years old" error={errors.retAge} help={retHelp} />
            <CurrencyField id="f-retspend" label="Yearly spending in retirement (today's $)" placeholder="e.g. 50,000" value={plan.retSpend} onChange={(v) => set("retSpend", v)}
              help={<>What would a comfortable year cost in <b>today's</b> money? We work out the nest egg you'd need (about 25× that) and the tax rate you'd pay. Leave blank to assume ~70% of your income.</>} />
          </div>

          <div className="pp-field" style={{ marginBottom: 0 }}>
            <label className="pp-label2" htmlFor="f-infl">Inflation rate <span style={{ fontWeight: 600, color: "var(--muted)" }}>· optional</span></label>
            <div className="pp-input-wrap" style={{ maxWidth: 200 }}>
              <input id="f-infl" className="pp-input" inputMode="decimal" value={plan.inflationRate != null ? plan.inflationRate : ""} placeholder="2"
                onChange={(e) => set("inflationRate", e.target.value.replace(/[^0-9.]/g, ""))} />
              <span className="pp-adorn r">% / yr</span>
            </div>
            <div className="pp-help">Canada has averaged about <b>2%</b> a year over the long run — that's the default. Adjust it if you'd like to be more cautious; it feeds the "today's dollars" view and your retirement target.</div>
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
                  help={yrsHome != null ? <>About <b>{yrsHome} years</b> to save a down payment{yrsHome <= 5 ? " — a short timeline usually means keeping that money safer." : " — enough time to let it grow a little."}</> : <>We'll mark this milestone on your projection.</>} />
                <CurrencyField id="f-homeprice" label="About how much will the home cost?" placeholder="e.g. 550,000" value={plan.homePrice} onChange={(v) => set("homePrice", v)}
                  help={n(plan.homePrice) > 0 ? <>Minimum down payment: <b>{fmtMoney(minDownPayment(n(plan.homePrice)))}</b>.</> : <>We'll work out your minimum down payment and track progress toward it.</>} />
              </div>
              {n(plan.homePrice) > 0 && (
                <div className="pp-callout" style={{ marginTop: 4 }}>
                  <Info size={18} style={{ flex: "none" }} />
                  <span>On a {fmtMoney(n(plan.homePrice))} home, the legal minimum down payment is <b>{fmtMoney(minDownPayment(n(plan.homePrice)))}</b>. {n(plan.homePrice) < 1500000 ? <>Putting down less than <b>20% ({fmtMoney(n(plan.homePrice) * 0.2)})</b> requires <b>CMHC mortgage insurance</b> — a premium of roughly 2.8–4% added to the mortgage.</> : <>At this price, the rules require a full <b>20%</b> down.</>}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* 3 — Your money */}
        <div className="pp-fs">
          <div className="pp-fs-head"><div className="pp-fs-num">3</div><h3>Your money</h3></div>
          <p className="pp-fs-sub">What you can add, and what you've already invested.</p>
          <div className="pp-field">
            <label className="pp-label2" htmlFor="f-asof">Today's date</label>
            <input id="f-asof" type="date" className="pp-input" style={{ maxWidth: 230 }} value={plan.asOf || todayISO()} onChange={(e) => set("asOf", e.target.value)} />
            <div className="pp-help">We project forward from this date. If it's partway through the year, your first year only counts the months you have left.</div>
          </div>
          <CurrencyField id="f-monthly" label="How much can you invest each month?" placeholder="e.g. 300" value={plan.monthly} onChange={(v) => set("monthly", v)}
            help={<>Your steady, recurring contribution — applied to every month, every year. {n(plan.monthly) > 0 && <>That's <b>{fmtMoney(n(plan.monthly) * 12)}</b> a year.</>}</>} />
          <CurrencyField id="f-lump" label="One-time lump sum to invest now (optional)" placeholder="e.g. 5,000" value={plan.lumpSum} onChange={(v) => set("lumpSum", v)}
            help={<>A single amount you can add today — a bonus, gift, or tax refund.</>} />
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

          <label className="pp-label2" style={{ marginBottom: 6, marginTop: 4 }}>What's the current value of each account today?</label>
          <div className="pp-help" style={{ marginTop: 0, marginBottom: 10 }}>Today's market value — including growth, not just what you put in.</div>
          <div className="pp-grid-money">
            <CurrencyField id="f-btfsa" label="TFSA" placeholder="0" value={plan.bTfsa} onChange={(v) => set("bTfsa", v)} />
            <CurrencyField id="f-brrsp" label="RRSP" placeholder="0" value={plan.bRrsp} onChange={(v) => set("bRrsp", v)} />
            <CurrencyField id="f-bfhsa" label="FHSA" placeholder="0" value={plan.bFhsa} onChange={(v) => set("bFhsa", v)} />
          </div>
          <div className="pp-grid-money" style={{ marginTop: 10 }}>
            <CurrencyField id="f-bnonreg" label="Non-registered (taxable)" placeholder="0" value={plan.bNonreg} onChange={(v) => set("bNonreg", v)}
              help={<>A regular investment/brokerage account — no contribution limit, but growth is taxed.</>} />
            <CurrencyField id="f-blocked" label="Locked-in (LIRA / RPP / DPSP)" placeholder="0" value={plan.bLocked} onChange={(v) => set("bLocked", v)}
              help={<>Pension money in a LIRA or similar. Taxed on withdrawal like an RRSP.</>} />
          </div>

          <div className="pp-field" style={{ marginTop: 20 }}>
            <label className="pp-label2">Do you have an emergency fund?</label>
            <div className="pp-seg2">
              <button className={plan.emergencyStatus === "full" ? "on" : ""} onClick={() => set("emergencyStatus", "full")}>Yes, fully</button>
              <button className={plan.emergencyStatus === "partial" ? "on" : ""} onClick={() => set("emergencyStatus", "partial")}>Partially</button>
              <button className={(plan.emergencyStatus || "none") === "none" ? "on" : ""} onClick={() => set("emergencyStatus", "none")}>Not yet</button>
            </div>
            <div className="pp-help">A cash cushion of essentials usually comes before serious investing — it's the foundation of the order of operations.</div>
          </div>
          {plan.emergencyStatus !== "full" && (
            <div className="pp-subcard">
              <p className="pp-sub-h">Let's size the right cushion for you.</p>
              <div className="pp-row2">
                <CurrencyField id="f-expenses" label="Your essential monthly expenses" placeholder="e.g. 2,500" value={plan.livingExpenses} onChange={(v) => set("livingExpenses", v)}
                  help={<>Rent or mortgage, food, utilities, transport, insurance — the must-pays only.</>} />
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
                <CurrencyField id="f-efsaved" label="How much have you saved so far?" placeholder="e.g. 3,000" value={plan.emergencySaved} onChange={(v) => set("emergencySaved", v)}
                  help={<>We'll show how much more gets you to a full cushion.</>} />
              )}
              {n(plan.livingExpenses) > 0 && (() => {
                const ef = emergencyFundTarget(plan.livingExpenses, plan.incomeStability);
                const gap = Math.max(0, ef.amount - n(plan.emergencySaved));
                return (
                  <div className="pp-callout" style={{ marginBottom: 0 }}>
                    <Shield size={18} style={{ flex: "none" }} />
                    <span>Aim for about <b>{fmtMoney(ef.amount)}</b> — roughly <b>{ef.months} months</b> of essentials.{plan.emergencyStatus === "partial" && n(plan.emergencySaved) > 0 ? <> You're <b>{fmtMoney(gap)}</b> away.</> : ""} Keep it in a high-interest savings account, separate from investing.</span>
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
        </div>

        {/* 4 — Contribution room */}
        <div className="pp-fs">
          <div className="pp-fs-head"><div className="pp-fs-num">4</div><h3>Contribution room</h3></div>
          <p className="pp-fs-sub">Track how much room you have <em>left</em> in each account, and get over-contribution warnings. These are optional — except your FHSA open year, which is needed once you hold an FHSA.</p>

          <div className="pp-acctgroup">
            <h4><PiggyBank size={16} style={{ color: "var(--violet)" }} /> TFSA</h4>
            <div className="pp-row2">
              <NumberField id="f-birth" label="Birth year" placeholder="e.g. 1996" value={plan.birthYear} onChange={(v) => set("birthYear", v)}
                help={<>Sets your <b>cumulative TFSA room</b> since 2009 (room starts the year you turn 18).</>} />
              <CurrencyField id="f-tfsaused" label="TFSA contributed this year" placeholder="0" value={plan.tfsaUsed} onChange={(v) => set("tfsaUsed", v)} help={<>What you've put in during {TAX_YEAR}.</>} />
            </div>
            <CurrencyField id="f-tfsaroom" label={<>Available TFSA room <span style={{ fontWeight: 500, color: "var(--muted)" }}>· from CRA My Account (optional)</span></>}
              placeholder="e.g. 47,000" value={plan.tfsaAvailableRoom} onChange={(v) => set("tfsaAvailableRoom", v)}
              help={<>Check <b>CRA My Account → TFSA</b> for your exact available room for {TAX_YEAR}. Overrides our estimate.</>} />
          </div>

          <div className="pp-acctgroup">
            <h4><Landmark size={16} style={{ color: "var(--gold)" }} /> RRSP</h4>
            <div className="pp-row2">
              <CurrencyField id="f-rrspnoa" label="RRSP contribution room" placeholder="e.g. 12,000" value={plan.rrspLimitNOA} onChange={(v) => set("rrspLimitNOA", v)}
                help={<>From your latest <b>Notice of Assessment</b> — also in CRA My Account. Blank = we estimate from income.</>} />
              <CurrencyField id="f-rrspused" label="RRSP contributed this year" placeholder="0" value={plan.rrspUsed} onChange={(v) => set("rrspUsed", v)} />
            </div>
          </div>

          <div className={"pp-acctgroup" + (n(plan.bFhsa) > 0 && !(n(plan.fhsaYearOpened) > 0) ? " need" : "")}>
            <h4>
              <HomeIcon size={16} style={{ color: "var(--rose)" }} /> FHSA{" "}
              {n(plan.bFhsa) > 0 && <span className="pp-req">{n(plan.fhsaYearOpened) > 0 ? "open year set" : "open year required"}</span>}
            </h4>
            <div className="pp-row2">
              <NumberField id="f-fhsayear" label="What year did you open your FHSA?" placeholder="e.g. 2024" value={plan.fhsaYearOpened} onChange={(v) => set("fhsaYearOpened", v)}
                help={<>The year you <b>first opened</b> an FHSA. Your room and 15-year closing deadline start here.</>} />
              <CurrencyField id="f-fhsalife" label="FHSA contributed (lifetime)" placeholder="0" value={plan.fhsaLifetimeUsed} onChange={(v) => set("fhsaLifetimeUsed", v)} help={<>Total ever contributed, toward the {fmtMoney(TAX_CONFIG.fhsa.lifetime)} cap.</>} />
            </div>
            <CurrencyField id="f-fhsayr" label="FHSA contributed this year" placeholder="0" value={plan.fhsaThisYearUsed} onChange={(v) => set("fhsaThisYearUsed", v)} />
          </div>
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
            {n(plan.bFhsa) > 0 && !(n(plan.fhsaYearOpened) > 0)
              ? "Add the year you opened your FHSA (Step 4) to continue."
              : "Enter your age, a retirement age above it, and your province to continue."}
          </p>
        )}
      </div>
    </div>
  );
}
