import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Sparkles, Calculator, Scale, TrendingUp, CreditCard } from "lucide-react";
import { LIBRARY } from "../data/library.js";
import { Disclaimer, TaxDisclaimer } from "../components/Disclaimer.jsx";
import { fv, fmtMoney } from "../lib/calculations.js";

function CapmCalc() {
  const [rf, setRf] = useState(3);
  const [rm, setRm] = useState(7);
  const [beta, setBeta] = useState(1);
  const er = rf + beta * (rm - rf);
  return (
    <div className="pp-card" style={{ margin: "8px 0 24px" }}>
      <span className="pp-eyebrow"><Calculator size={14} /> Try it: CAPM</span>
      <h4 style={{ fontSize: 18, margin: "8px 0 14px" }}>Expected return calculator</h4>
      <div className="pp-sliders">
        <div className="pp-slider"><div className="top"><span className="l">Risk-free rate (Rf)</span><span className="v">{rf.toFixed(1)}%</span></div><input className="pp-range" type="range" min="0" max="6" step="0.1" value={rf} onChange={(e) => setRf(Number(e.target.value))} aria-label="Risk-free rate" /></div>
        <div className="pp-slider"><div className="top"><span className="l">Market return (Rm)</span><span className="v">{rm.toFixed(1)}%</span></div><input className="pp-range" type="range" min="2" max="12" step="0.1" value={rm} onChange={(e) => setRm(Number(e.target.value))} aria-label="Market return" /></div>
        <div className="pp-slider"><div className="top"><span className="l">Beta (β)</span><span className="v">{beta.toFixed(2)}</span></div><input className="pp-range" type="range" min="0" max="2.5" step="0.05" value={beta} onChange={(e) => setBeta(Number(e.target.value))} aria-label="Beta" /></div>
      </div>
      <div className="pp-rate-chip" style={{ marginTop: 16 }}>
        <div className="l">Expected return E(R) = Rf + β(Rm − Rf)</div>
        <div className="v">{er.toFixed(2)}%</div>
        <div className="h">{rf.toFixed(1)}% + {beta.toFixed(2)} × ({rm.toFixed(1)}% − {rf.toFixed(1)}%)</div>
      </div>
      <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 10 }}>Notice how a beta above 1 lifts the expected return above the market, and a beta below 1 pulls it toward the risk-free rate. Illustrative only.</p>
    </div>
  );
}

function MptCalc() {
  const [w, setW] = useState(60);
  const [corr, setCorr] = useState(0.2);
  const rA = 8, rB = 3, sA = 16, sB = 6;
  const wa = w / 100, wb = 1 - wa;
  const pr = wa * rA + wb * rB;
  const pv = Math.sqrt(wa * wa * sA * sA + wb * wb * sB * sB + 2 * wa * wb * sA * sB * corr);
  return (
    <div className="pp-card" style={{ margin: "8px 0 24px" }}>
      <span className="pp-eyebrow"><Scale size={14} /> Try it: two-asset mix</span>
      <h4 style={{ fontSize: 18, margin: "8px 0 6px" }}>Risk &amp; return mixer</h4>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>A stylized stock (8% return, 16% volatility) blended with a bond (3% return, 6% volatility).</p>
      <div className="pp-sliders">
        <div className="pp-slider"><div className="top"><span className="l">Stock weight</span><span className="v">{w}% / {100 - w}%</span></div><input className="pp-range" type="range" min="0" max="100" step="5" value={w} onChange={(e) => setW(Number(e.target.value))} aria-label="Stock weight" /></div>
        <div className="pp-slider"><div className="top"><span className="l">Correlation</span><span className="v">{corr.toFixed(2)}</span></div><input className="pp-range" type="range" min="-1" max="1" step="0.05" value={corr} onChange={(e) => setCorr(Number(e.target.value))} aria-label="Correlation" /></div>
      </div>
      <div className="pp-grid-2" style={{ gap: 14, marginTop: 16 }}>
        <div className="pp-rate-chip"><div className="l">Expected return</div><div className="v">{pr.toFixed(2)}%</div></div>
        <div className="pp-rate-chip" style={{ background: "#F3ECDB" }}><div className="l">Volatility (risk)</div><div className="v">{pv.toFixed(2)}%</div></div>
      </div>
      <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 10 }}>Lower the correlation and watch volatility drop <em>below</em> the simple weighted average — that's diversification at work. Illustrative only.</p>
    </div>
  );
}

function CompoundCalc() {
  const [monthly, setMonthly] = useState(300);
  const [years, setYears] = useState(20);
  const [rate, setRate] = useState(5.79);
  const bal = fv(rate / 100, years * 12, 0, monthly);
  const contributed = monthly * years * 12;
  const growth = bal - contributed;
  return (
    <div className="pp-card" style={{ margin: "8px 0 24px" }}>
      <span className="pp-eyebrow"><TrendingUp size={14} /> Try it: the power of compounding</span>
      <h4 style={{ fontSize: 18, margin: "8px 0 14px" }}>TFSA / RRSP growth calculator</h4>
      <div className="pp-sliders">
        <div className="pp-slider"><div className="top"><span className="l">Monthly contribution</span><span className="v">{fmtMoney(monthly)}</span></div><input className="pp-range" type="range" min="50" max="2000" step="25" value={monthly} onChange={(e) => setMonthly(Number(e.target.value))} aria-label="Monthly contribution" /></div>
        <div className="pp-slider"><div className="top"><span className="l">Years invested</span><span className="v">{years}</span></div><input className="pp-range" type="range" min="1" max="40" step="1" value={years} onChange={(e) => setYears(Number(e.target.value))} aria-label="Years invested" /></div>
        <div className="pp-slider"><div className="top"><span className="l">Assumed return</span><span className="v">{rate.toFixed(2)}%</span></div><input className="pp-range" type="range" min="2" max="10" step="0.01" value={rate} onChange={(e) => setRate(Number(e.target.value))} aria-label="Assumed annual return" /></div>
      </div>
      <div className="pp-grid-2" style={{ gap: 14, marginTop: 16 }}>
        <div className="pp-rate-chip"><div className="l">You contributed</div><div className="v">{fmtMoney(contributed)}</div></div>
        <div className="pp-rate-chip" style={{ background: "#F3ECDB" }}><div className="l">Growth on top</div><div className="v">{fmtMoney(growth)}</div></div>
      </div>
      <div className="pp-rate-chip" style={{ marginTop: 14 }}>
        <div className="l">Total balance after {years} years</div>
        <div className="v">{fmtMoney(bal)}</div>
      </div>
      <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 10 }}>The starting rate is this site's "Balanced" assumption (FP Canada's 2026 guideline for a 60/40 portfolio) — drag it to see how the mix of contributions vs. growth shifts. The longer the horizon, the more of the total comes from growth rather than what you actually put in. Illustrative only.</p>
    </div>
  );
}

function CcTrapCalc() {
  const [balance, setBalance] = useState(5000);
  const [apr, setApr] = useState(22);
  const [minPct, setMinPct] = useState(2);
  const [fixedPayment, setFixedPayment] = useState(200);

  const simulate = (paymentFn) => {
    let bal = balance;
    let totalInterest = 0;
    let months = 0;
    const maxMonths = 600; // 50 years
    let stuck = false;
    while (bal > 0 && months < maxMonths) {
      const interest = bal * (apr / 100) / 12;
      const payment = paymentFn(bal);
      if (payment <= interest) { stuck = true; totalInterest += interest; break; }
      totalInterest += interest;
      bal = bal + interest - payment;
      months++;
    }
    const neverPaysOff = stuck || bal > 0;
    return { months, totalInterest, neverPaysOff, stuck };
  };

  const fmtMonths = (r) => {
    if (r.stuck) return "never — the payment doesn't even cover the interest";
    if (r.neverPaysOff) return "still not paid off after 50 years";
    return `${Math.floor(r.months / 12)}y ${r.months % 12}mo`;
  };

  const minResult = simulate((b) => Math.max(25, b * minPct / 100));
  const fixedResult = simulate(() => fixedPayment);
  const interestSaved = minResult.neverPaysOff ? null : Math.max(0, minResult.totalInterest - fixedResult.totalInterest);

  return (
    <div className="pp-card" style={{ margin: "8px 0 24px" }}>
      <span className="pp-eyebrow"><CreditCard size={14} /> Try it: the minimum-payment trap</span>
      <h4 style={{ fontSize: 18, margin: "8px 0 6px" }}>Credit card payoff calculator</h4>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>Minimum payments are usually a floor amount or a small percentage of your balance — whichever is higher.</p>
      <div className="pp-sliders">
        <div className="pp-slider"><div className="top"><span className="l">Balance</span><span className="v">{fmtMoney(balance)}</span></div><input className="pp-range" type="range" min="500" max="15000" step="100" value={balance} onChange={(e) => setBalance(Number(e.target.value))} aria-label="Balance" /></div>
        <div className="pp-slider"><div className="top"><span className="l">Interest rate (APR)</span><span className="v">{apr}%</span></div><input className="pp-range" type="range" min="15" max="30" step="0.5" value={apr} onChange={(e) => setApr(Number(e.target.value))} aria-label="APR" /></div>
        <div className="pp-slider"><div className="top"><span className="l">Minimum payment</span><span className="v">{minPct}% of balance</span></div><input className="pp-range" type="range" min="1" max="5" step="0.5" value={minPct} onChange={(e) => setMinPct(Number(e.target.value))} aria-label="Minimum payment percent" /></div>
        <div className="pp-slider"><div className="top"><span className="l">A fixed payment you choose</span><span className="v">{fmtMoney(fixedPayment)}/mo</span></div><input className="pp-range" type="range" min="50" max="500" step="10" value={fixedPayment} onChange={(e) => setFixedPayment(Number(e.target.value))} aria-label="Fixed payment" /></div>
      </div>
      <div className="pp-grid-2" style={{ gap: 14, marginTop: 16 }}>
        <div className="pp-rate-chip"><div className="l">Minimum payments only</div><div className="v">{fmtMonths(minResult)}</div><div className="h">{minResult.neverPaysOff ? "" : `${fmtMoney(minResult.totalInterest)} in interest`}</div></div>
        <div className="pp-rate-chip" style={{ background: "#F3ECDB" }}><div className="l">At your fixed payment</div><div className="v">{fmtMonths(fixedResult)}</div><div className="h">{fixedResult.neverPaysOff ? "" : `${fmtMoney(fixedResult.totalInterest)} in interest`}</div></div>
      </div>
      <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 10 }}>{interestSaved != null ? <>Paying a fixed {fmtMoney(fixedPayment)}/mo instead of the shrinking minimum saves about <b>{fmtMoney(interestSaved)}</b> in interest here.</> : "At only the minimum, the balance barely moves — most of the payment is covering interest, not the debt itself."} Illustrative only; real cards vary in how minimums are calculated.</p>
    </div>
  );
}

export default function Topic() {
  const { cat: catKey, topic: topicKey } = useParams();
  const navigate = useNavigate();
  const cat = LIBRARY.find((c) => c.key === catKey);
  const t = cat?.topics.find((x) => x.key === topicKey);
  if (!t) return null;
  const isTax = catKey === "tax" || t.key === "investtax" || t.key === "assetloc";

  return (
    <div className="pp-wrap pp-section">
      <div className="pp-topic">
        <button className="pp-back" onClick={() => navigate(`/library/${catKey}`)}>
          <ArrowLeft size={16} /> {cat.name}
        </button>
        <h1>{t.name}</h1>
        <p className="pp-topic-lead">{t.lead}</p>
        <div className="pp-prose">{t.prose.map((p, i) => <p key={i}>{p}</p>)}</div>
        {t.calc === "capm" && <CapmCalc />}
        {t.calc === "mpt" && <MptCalc />}
        {t.calc === "compound" && <CompoundCalc />}
        {t.calc === "cctrap" && <CcTrapCalc />}
        {t.facts && (
          <div className="pp-facts">
            <h4>Key facts</h4>
            <dl>
              {t.facts.map(([k, v], i) => (
                <span key={i}><dt>{k}</dt><dd>{v}</dd></span>
              ))}
            </dl>
          </div>
        )}
        {t.callout && (
          <div className="pp-callout">
            <Sparkles size={18} style={{ flex: "none" }} />
            <span>{t.callout}</span>
          </div>
        )}
        {t.good && (
          <p style={{ fontSize: 15.5, marginBottom: 24 }}>
            <b style={{ color: "var(--plum)" }}>Often a good fit for:</b> {t.good}
          </p>
        )}
        {isTax ? <TaxDisclaimer /> : <Disclaimer />}
        <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
          <button className="pp-btn pp-btn-ghost" onClick={() => navigate(`/library/${catKey}`)}>
            <ArrowLeft size={16} /> Back to {cat.name}
          </button>
          <button className="pp-btn pp-btn-primary" onClick={() => navigate("/library")}>
            Browse all topics <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
