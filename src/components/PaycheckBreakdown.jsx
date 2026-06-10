import { fmtMoney, pct1 } from "../lib/calculations.js";

export default function PaycheckBreakdown({ tax, marginal }) {
  const g = Math.max(1, tax.gross);
  const cppLabel = tax.isQC ? "QPP / QPP2" : "CPP / CPP2";
  const rows = [
    { key: "net",  label: "Net take-home",   val: tax.net,      color: "var(--violet)" },
    { key: "fed",  label: "Federal tax",      val: tax.fedTax,   color: "var(--plum)" },
    { key: "prov", label: tax.isQC ? "Quebec tax" : "Provincial tax", val: tax.provTax, color: "var(--gold)" },
    { key: "cpp",  label: cppLabel,           val: tax.cppTotal, color: "var(--teal)" },
    ...(tax.ei > 0  ? [{ key: "ei",   label: "EI premiums", val: tax.ei,   color: "var(--blue)" }] : []),
    ...(tax.qpip > 0 ? [{ key: "qpip", label: "QPIP",       val: tax.qpip, color: "var(--rose)" }] : []),
  ];

  return (
    <div>
      <div
        style={{ display: "flex", height: 30, borderRadius: 8, overflow: "hidden", marginBottom: 6 }}
        role="img"
        aria-label="Take-home pay versus deductions"
      >
        {rows.map((r) => r.val > 0 && (
          <div
            key={r.key}
            title={`${r.label}: ${fmtMoney(r.val)}`}
            style={{ width: (r.val / g) * 100 + "%", background: r.color }}
          />
        ))}
      </div>

      <div className="pp-rates" style={{ marginTop: 14 }}>
        <div className="pp-rate-chip">
          <div className="l">Net take-home</div>
          <div className="v">{fmtMoney(tax.net)}</div>
          <div className="h">{fmtMoney(tax.netMonthly)}/mo</div>
        </div>
        <div className="pp-rate-chip">
          <div className="l">Average tax rate</div>
          <div className="v">{pct1(tax.avgRate)}</div>
          <div className="h">income tax ÷ gross</div>
        </div>
        <div className="pp-rate-chip">
          <div className="l">Marginal rate</div>
          <div className="v">{pct1(marginal)}</div>
          <div className="h">on your next dollar</div>
        </div>
      </div>

      <table className="pp-taxtable" style={{ marginTop: 18 }}>
        <tbody>
          <tr><td><span className="pp-swatch" style={{ background: "var(--ink)" }} />Gross income</td><td>{fmtMoney(tax.gross)}</td></tr>
          <tr><td><span className="pp-swatch" style={{ background: "var(--teal)" }} />{cppLabel}{tax.selfEmployed ? " (both halves)" : ""}</td><td>−{fmtMoney(tax.cppTotal)}</td></tr>
          {tax.ei > 0 && <tr><td><span className="pp-swatch" style={{ background: "var(--blue)" }} />EI premiums</td><td>−{fmtMoney(tax.ei)}</td></tr>}
          {tax.qpip > 0 && <tr><td><span className="pp-swatch" style={{ background: "var(--rose)" }} />QPIP</td><td>−{fmtMoney(tax.qpip)}</td></tr>}
          <tr><td><span className="pp-swatch" style={{ background: "var(--plum)" }} />Federal income tax</td><td>−{fmtMoney(tax.fedTax)}</td></tr>
          <tr><td><span className="pp-swatch" style={{ background: "var(--gold)" }} />{tax.isQC ? "Quebec income tax" : "Provincial income tax"}</td><td>−{fmtMoney(tax.provTax)}</td></tr>
          <tr className="tot">
            <td><span className="pp-swatch" style={{ background: "var(--violet)" }} /><b>Net take-home pay</b></td>
            <td><b>{fmtMoney(tax.net)}</b></td>
          </tr>
        </tbody>
      </table>

      {tax.isQC && (
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 10 }}>
          Quebec figures include QPP/QPP2, QPIP, Quebec provincial tax, and the 16.5% federal abatement applied to your federal tax.
        </p>
      )}
    </div>
  );
}
