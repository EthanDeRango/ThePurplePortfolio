import { AlertTriangle, Info } from "lucide-react";
import { TAX_YEAR } from "../lib/tax-config.js";

export function Disclaimer() {
  return (
    <div className="pp-disclaimer">
      <AlertTriangle size={18} style={{ flex: "none", marginTop: 1 }} />
      <span>
        <b>This is a planning tool, not financial advice.</b> The Purple Portfolio helps you learn,
        explore, and organize your own numbers — it doesn't recommend specific securities, tell you
        what to buy, or guarantee results. Figures are for the {TAX_YEAR} tax year; verify current
        limits at canada.ca and talk to a licensed advisor before making decisions with real money.
      </span>
    </div>
  );
}

export function TaxDisclaimer() {
  return (
    <div className="pp-disclaimer tax">
      <Info size={18} style={{ flex: "none", marginTop: 1 }} />
      <span>
        <b>Tax figures are {TAX_YEAR} estimates for education only</b>, not tax preparation or
        advice. They simplify some rules (other credits, deductions, and pension adjustments
        aren't modelled). For anything binding, check your CRA / Revenu Québec account or a
        tax professional.
      </span>
    </div>
  );
}
