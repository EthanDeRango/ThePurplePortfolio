import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Shield, TrendingUp, Calculator, MapPin,
  Receipt, Percent, GraduationCap, Sparkles,
} from "lucide-react";
import Orb from "../components/Orb.jsx";

export default function Home() {
  const navigate = useNavigate();
  const start = () => navigate("/plan");

  return (
    <>
      <header className="pp-hero">
        <svg className="pp-hero-deco" viewBox="0 0 400 400" aria-hidden="true">
          {[180, 140, 100, 60].map((r) => (
            <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="#7C4DC4" strokeOpacity="0.12" strokeWidth="1.2" />
          ))}
        </svg>
        <div className="pp-wrap pp-hero-grid">
          <div>
            <span className="pp-eyebrow"><Sparkles size={14} /> Tax-aware planning, built for Canadians</span>
            <h1 style={{ marginTop: 16 }}>Your paycheque,<br /><em>decoded</em>—and your<br />future, projected.</h1>
            <p className="pp-hero-sub">
              Purple Portfolio is a free planner and learning club. Enter your income and province
              and see exactly where your money goes — taxes, CPP, EI — then your contribution room,
              RRSP/FHSA tax savings, and a projection of your future.
            </p>
            <div className="pp-hero-cta">
              <button className="pp-btn pp-btn-primary" onClick={start}>Build my plan <ArrowRight size={18} /></button>
              <button className="pp-btn pp-btn-ghost" onClick={() => navigate("/library")}>Browse the library</button>
            </div>
            <div className="pp-hero-fine">
              <Shield size={15} /> Private by default — your numbers stay in your browser. Sign in only if you want to save across devices.
            </div>
          </div>
          <Orb />
        </div>
      </header>

      <section className="pp-section">
        <div className="pp-wrap">
          <span className="pp-eyebrow">How it works</span>
          <h2 style={{ fontSize: 34, margin: "12px 0 30px", maxWidth: "16em" }}>From a few numbers to a clear picture.</h2>
          <div className="pp-grid-3">
            {[
              { ic: <MapPin size={20} />,     t: "1 · Your income & province", d: "We decode your real take-home: federal + provincial tax, CPP/CPP2, and EI — for your province." },
              { ic: <Calculator size={20} />, t: "2 · Tax savings & room",      d: "See your RRSP/FHSA tax savings, what contribution room you've got left, and your FHSA deadline." },
              { ic: <TrendingUp size={20} />, t: "3 · Your projection",          d: "Watch your portfolio grow to retirement, with after-tax, inflation, and fee views you control." },
            ].map((f) => (
              <div className="pp-card" key={f.t}>
                <div className="pp-feat-ic" style={{ marginBottom: 14 }}>{f.ic}</div>
                <h4 style={{ fontSize: 19, marginBottom: 8 }}>{f.t}</h4>
                <p style={{ fontSize: 14.5, color: "var(--muted)" }}>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pp-band">
        <div className="pp-wrap pp-section">
          <div className="pp-grid-2" style={{ alignItems: "center", gap: 40 }}>
            <div>
              <span className="pp-eyebrow">Why we exist</span>
              <h2 style={{ fontSize: 32, margin: "14px 0 16px", color: "#fff" }}>We educate. We don't sell.</h2>
              <p style={{ color: "#D9C9EE", fontSize: 16.5, marginBottom: 14 }}>
                Most investing content is either selling you something or buried in jargon. Purple Portfolio
                does neither. We put your real numbers in, show the honest trade-offs — including the tax
                ones — and hand the decision back to you.
              </p>
              <p style={{ color: "#D9C9EE", fontSize: 16.5 }}>
                The goal is simple: help as many people as possible become confident, informed investors —
                whatever their budget.
              </p>
            </div>
            <div className="pp-grid-2" style={{ gap: 14 }}>
              {[
                { ic: <Receipt size={18} />,       t: "Tax-aware",       d: "Real CPP, EI, and bracket math for every province." },
                { ic: <Shield size={18} />,         t: "Private by design", d: "Runs in your browser. Accounts are optional — no tracking, no selling." },
                { ic: <Percent size={18} />,        t: "Honest on fees",  d: "We show the costs others gloss over." },
                { ic: <GraduationCap size={18} />,  t: "Beginner-friendly", d: "Plain language, with depth when you want it." },
              ].map((c) => (
                <div key={c.t} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: 18 }}>
                  <div style={{ color: "var(--gold-2)", marginBottom: 10 }}>{c.ic}</div>
                  <h4 style={{ color: "#fff", fontSize: 16, marginBottom: 5 }}>{c.t}</h4>
                  <p style={{ color: "#C7B4DF", fontSize: 13.5 }}>{c.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pp-section">
        <div className="pp-wrap" style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: 32, marginBottom: 12 }}>Ready to see your numbers?</h2>
          <p style={{ color: "var(--muted)", fontSize: 17, margin: "0 auto 26px", maxWidth: "32em" }}>
            It takes about three minutes, and you'll come away with a clearer picture than most people ever get.
          </p>
          <button className="pp-btn pp-btn-primary" onClick={start}>Build my plan <ArrowRight size={18} /></button>
        </div>
      </section>
    </>
  );
}
