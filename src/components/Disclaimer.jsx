import { AlertTriangle, Info } from "lucide-react";
import { TAX_YEAR } from "../lib/tax-config.js";

export function Disclaimer() {
  return (
    <div className="pp-disclaimer">
      <AlertTriangle size={18} style={{ flex: "none", marginTop: 1 }} />
      <span>
        <b>Educational information, not financial advice.</b> Purple Portfolio helps you learn
        and explore — it doesn't recommend specific securities or guarantee results. Figures are
        for the {TAX_YEAR} tax year; verify current limits at canada.ca and consider a licensed
        advisor before deciding.
      </span>
    </div>
  );
}

export function TaxDisclaimer() {
  return (
    <div className="pp-disclaimer tax">
      <Info size={18} style={{ flex: "none", marginTop: 1 }} />
      <span>
        <b>Tax figures are {TAX_YEAR} estimates for education only</b> — not tax preparation or
        advice. They simplify some rules (other credits, deductions, and pension adjustments
        aren't modelled). For anything binding, check your CRA / Revenu Québec account or a
        tax professional.
      </span>
    </div>
  );
}
