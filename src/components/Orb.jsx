import { Sparkles } from "lucide-react";
import { deductionSaving, marginalRate } from "../lib/tax-engine.js";
import { fmtMoney } from "../lib/calculations.js";
import { TAX_YEAR } from "../lib/tax-config.js";

// A real preview, not decoration: runs the same deductionSaving() the rest of the app uses, on
// a contribution that actually crosses a tax bracket — proving the refund is bracket-aware math,
// not a flat "contribution × your rate" guess a basic calculator would give.
export default function Orb() {
  const income = 122000, contrib = 12000, prov = "ON", empType = "employed";
  const refund = Math.round(deductionSaving(income, prov, empType, contrib));
  const flatGuess = Math.round(contrib * marginalRate(income, prov, empType));
  const realCost = contrib - refund;

  return (
    <div className="pp-orb">
      <svg className="pp-orb-glow" viewBox="0 0 400 400" aria-hidden="true">
        <defs>
          <radialGradient id="heroGlow" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#7C4DC4" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#7C4DC4" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="heroGlowGold" cx="70%" cy="80%" r="45%">
            <stop offset="0%" stopColor="#C99A42" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#C99A42" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="200" cy="200" r="190" fill="url(#heroGlow)" />
        <circle cx="260" cy="260" r="150" fill="url(#heroGlowGold)" />
      </svg>

      <div className="pp-hero-preview" aria-hidden="true">
        <span className="pp-hero-preview-tag"><Sparkles size={11} /> A real {TAX_YEAR} example</span>

        <div className="pp-hero-preview-flow">
          <span>{fmtMoney(income)} income</span>
          <span className="arrow">→</span>
          <span>{fmtMoney(contrib)} RRSP contribution</span>
        </div>

        <div className="pp-hero-preview-hero">
          <div className="l">Your real tax refund</div>
          <div className="vrow">
            <span className="v">{fmtMoney(refund)}</span>
            <span className="was">{fmtMoney(flatGuess)}</span>
          </div>
          <div className="cap">Bracket-aware math beats a flat-rate guess.</div>
        </div>

        <div className="pp-hero-preview-sub">
          Real cost to invest: <b>{fmtMoney(realCost)}</b> — the government covers the rest.
        </div>

        <div className="pp-hero-preview-fine">Real {TAX_YEAR} CRA math — not a mockup.</div>
      </div>
    </div>
  );
}
