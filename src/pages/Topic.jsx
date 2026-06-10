import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Sparkles, Calculator, Scale } from "lucide-react";
import { LIBRARY } from "../data/library.js";
import { Disclaimer, TaxDisclaimer } from "../components/Disclaimer.jsx";

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
