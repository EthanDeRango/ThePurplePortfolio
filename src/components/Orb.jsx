import { taxEngine } from "../lib/tax-engine.js";
import { fmtMoney, pct1 } from "../lib/calculations.js";
import { TAX_YEAR } from "../lib/tax-config.js";

// A real preview, not decoration: runs the same taxEngine() the rest of the app uses, on an
// incorporated owner splitting pay between salary and dividends — a deliberately less "basic
// paycheque calculator" example, so the hero itself proves the tool handles real complexity
// instead of just claiming to.
export default function Orb() {
  const salary = 110000, dividends = 110000;
  const tax = taxEngine(salary, "ON", "incorporated", 0, { nonEligible: dividends });
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
        <div className="pp-hero-preview-tag">A real {TAX_YEAR} example · $220,000, incorporated, Ontario</div>
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
        <p className="pp-hero-preview-note">
          Pays themselves <b>{fmtMoney(salary)}</b> salary + <b>{fmtMoney(dividends)}</b> in dividends — taxed differently (no CPP/EI on dividends), tracked correctly.
        </p>
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
