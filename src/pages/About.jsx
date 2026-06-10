import { useNavigate } from "react-router-dom";
import { ArrowRight, Shield } from "lucide-react";
import { Disclaimer, TaxDisclaimer } from "../components/Disclaimer.jsx";

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="pp-wrap pp-section">
      <div className="pp-topic">
        <span className="pp-eyebrow">About the club</span>
        <h1 style={{ fontSize: 42, margin: "12px 0 18px" }}>Purple Portfolio</h1>
        <div className="pp-prose">
          <p>Purple Portfolio is an investment-education club built on one belief: people make better financial decisions when they actually understand their options — not when they're sold to.</p>
          <p>We focus on Canadians. That means real explanations of the TFSA, RRSP, and FHSA, how your paycheque is actually taxed — federal and provincial tax, CPP/QPP, EI, QPIP — and the core concepts that quietly determine most of your results: fees, diversification, and time. We aim to be useful to a complete beginner and still worthwhile for someone more advanced.</p>
          <p>Crucially, we don't recommend specific investments, prepare your taxes, or promise returns. The planner organizes information around your own numbers — decoding your take-home pay, your contribution room, and an illustrative projection — so you can see possibilities and explore further. The decisions stay yours.</p>
        </div>
        <div className="pp-callout">
          <Shield size={18} style={{ flex: "none" }} />
          <span>Your privacy is part of the design: the planner runs entirely in your browser. We don't ask for an email, and your numbers are never sent anywhere or stored.</span>
        </div>
        <Disclaimer />
        <div style={{ height: 12 }} />
        <TaxDisclaimer />
        <div style={{ marginTop: 28 }}>
          <button className="pp-btn pp-btn-primary" onClick={() => navigate("/plan")}>
            Build my plan <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
