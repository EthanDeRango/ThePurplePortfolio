import { taxEngine } from "../lib/tax-engine.js";
import { fmtMoney, pct1 } from "../lib/calculations.js";
import { TAX_YEAR } from "../lib/tax-config.js";

// A real preview, not decoration: runs the same taxEngine() the rest of the app uses, on a
// representative $85,000 Ontario income, so the hero shows an actually-accurate result instead
// of an abstract shape or invented numbers.
export default function Orb() {
  const tax = taxEngine(85000, "ON", "employed");
  const g = Math.max(1, tax.gross);
  const rows = [
    { key: "net",  label: "Take-home",      val: tax.net,      color: "var(--violet)" },
    { key: "fed",  label: "Federal tax",     val: tax.fedTax,   color: "var(--plum)" },
    { key: "prov", label: "Ontario tax",     val: tax.provTax,  color: "var(--gold)" },
    { key: "cpp",  label: "CPP",             val: tax.cppTotal, color: "var(--teal)" },
    { key: "ei",   label: "EI",              val: tax.ei,       color: "var(--blue)" },
  ];

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
        <div className="pp-hero-preview-tag">A real {TAX_YEAR} example · $85,000 in Ontario</div>
        <div className="pp-hero-preview-bar">
          {rows.map((r) => r.val > 0 && (
            <div key={r.key} title={`${r.label}: ${fmtMoney(r.val)}`} style={{ width: (r.val / g) * 100 + "%", background: r.color }} />
          ))}
        </div>
        <div className="pp-hero-preview-legend">
          {rows.filter((r) => r.val > 0).map((r) => (
            <span key={r.key}><i style={{ background: r.color }} />{r.label}</span>
          ))}
        </div>
        <div className="pp-hero-preview-stats">
          <div>
            <div className="l">Take-home</div>
            <div className="v">{fmtMoney(tax.net)}</div>
          </div>
          <div>
            <div className="l">Average tax rate</div>
            <div className="v">{pct1(tax.avgRate)}</div>
          </div>
        </div>
        <div className="pp-hero-preview-fine">Real {TAX_YEAR} CRA math — not a mockup.</div>
      </div>
    </div>
  );
}
