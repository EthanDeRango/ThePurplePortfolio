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
            <stop offset="0%" stopColor="#7C4DC4" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#7C4DC4" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="200" cy="200" r="190" fill="url(#heroGlow)" />
      </svg>

      <div className="pp-hero-preview" aria-hidden="true">
        <div className="pp-hero-preview-tag">A real {TAX_YEAR} example · {fmtMoney(contrib)} RRSP contribution</div>
        <div className="pp-hero-preview-flow">
          <span>{fmtMoney(income)} income</span>
          <span className="arrow">→</span>
          <span>{fmtMoney(contrib)} into your RRSP</span>
        </div>
        <div className="pp-hero-preview-stats">
          <div>
            <div className="l">Tax refund</div>
            <div className="v">{fmtMoney(refund)}</div>
          </div>
          <div>
            <div className="l">Real cost to invest</div>
            <div className="v">{fmtMoney(realCost)}</div>
          </div>
        </div>
        <p className="pp-hero-preview-callout">
          A flat-rate estimate would say <b>{fmtMoney(flatGuess)}</b> — bracket-aware math gets it right.
        </p>
        <div className="pp-hero-preview-fine">Real {TAX_YEAR} CRA math — not a mockup.</div>
      </div>
    </div>
  );
}
