import { useNavigate } from "react-router-dom";
import { ArrowRight, Shield } from "lucide-react";
import { Disclaimer, TaxDisclaimer } from "../components/Disclaimer.jsx";

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="pp-wrap pp-section">
      <div className="pp-topic">
        <span className="pp-eyebrow">About the club</span>
        <h1 style={{ fontSize: 42, margin: "12px 0 18px" }}>The Purple Portfolio</h1>
        <div className="pp-prose">
          <p>The Purple Portfolio is an investment-education club built on one belief: people make better financial decisions when they actually understand their options — not when they're sold to.</p>
          <p>We focus on Canadians. That means real explanations of the TFSA, RRSP, and FHSA, how your paycheque is actually taxed — federal and provincial tax, CPP/QPP, EI, QPIP — and the core concepts that quietly determine most of your results: fees, diversification, and time. We aim to be useful to a complete beginner and still worthwhile for someone more advanced.</p>
          <p>Crucially, we don't recommend specific investments, prepare your taxes, or promise returns. The planner organizes information around your own numbers — decoding your take-home pay, your contribution room, and an illustrative projection — so you can see possibilities and explore further. The decisions stay yours.</p>
        </div>
        <div className="pp-callout">
          <Shield size={18} style={{ flex: "none" }} />
          <span>Your privacy is part of the design: the planner runs entirely in your browser. Creating an account is optional — it only saves your plan across devices. Your numbers are never shared or sold.</span>
        </div>
        <Disclaimer />
        <div style={{ height: 12 }} />
        <TaxDisclaimer />
        <div style={{ marginTop: 32, padding: "20px 24px", background: "var(--paper-card)", borderRadius: 16, border: "1.5px solid var(--line)" }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".09em", color: "var(--plum-2)", marginBottom: 8 }}>Get in touch</div>
          <p style={{ fontSize: 14.5, color: "var(--muted)", lineHeight: 1.7, margin: "0 0 10px" }}>Questions, feedback, or want to get involved with the club? We'd love to hear from you.</p>
          <a href="mailto:uwopurpleportfolio@gmail.com" style={{ fontWeight: 700, color: "var(--violet)", fontSize: 15, textDecoration: "none" }}>
            uwopurpleportfolio@gmail.com
          </a>
        </div>
        <div style={{ marginTop: 28 }}>
          <button className="pp-btn pp-btn-primary" onClick={() => navigate("/plan")}>
            Build my plan <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
