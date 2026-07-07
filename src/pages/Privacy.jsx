import { useNavigate } from "react-router-dom";
import { ArrowRight, Shield } from "lucide-react";

const EFFECTIVE_DATE = "July 2026";

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="pp-wrap pp-section">
      <div className="pp-topic">
        <span className="pp-eyebrow">Legal</span>
        <h1 style={{ fontSize: 42, margin: "12px 0 6px" }}>Privacy Policy</h1>
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 22 }}>Effective {EFFECTIVE_DATE}</p>

        <div className="pp-callout">
          <Shield size={18} style={{ flex: "none" }} />
          <span>Short version: your numbers stay in your browser unless you choose to create an account. We don't sell or share your data, and we don't run ad trackers or analytics of any kind.</span>
        </div>

        <div className="pp-prose">
          <h3>What we collect</h3>
          <p>By default, everything you enter into the Planner or Budget tools — income, balances, goals, and every other figure — is stored only in your own browser's local storage. It never reaches our servers, and we never see it, unless you take the extra step of creating an account.</p>
          <p>If you choose to create an account, we collect the email address you sign up with and the plan/budget data you've entered, so it can sync across your devices. You can also sign in using your Google account; if you do, we receive the basic profile information Google shares for sign-in (typically your name and email), and Google's own privacy policy governs that exchange.</p>
          <p>If you opt in to our newsletter, we collect your email address for that purpose only. Opting in is always a separate, explicit choice — never a pre-checked box — and every newsletter includes an unsubscribe option.</p>

          <h3>Where account data lives</h3>
          <p>Signed-in account data (your email and synced plan) is stored with Supabase, our database and authentication provider. Our Supabase project is hosted in the United States, which means that data is processed and stored outside Canada. If you'd prefer your information never leaves your device, simply don't create an account — the planner and budget tools work fully without one.</p>

          <h3>What we don't do</h3>
          <p>We don't sell, rent, or share your data with third parties for marketing or advertising. We don't run analytics scripts, ad pixels, or behavioural trackers on this site. We don't use your numbers for anything other than showing them back to you.</p>

          <h3>Your controls</h3>
          <p>If you've created an account, you can permanently delete your synced data at any time using the <b>Delete data</b> button in the account menu at the top of the site — this removes your plan and profile from our servers immediately. Signing out or clearing your browser storage removes everything stored locally.</p>

          <h3>Cookies &amp; local storage</h3>
          <p>We use your browser's local storage to save your plan between visits and, if you sign in, a small amount of technical storage to keep you logged in. None of this is used for tracking or advertising.</p>

          <h3>Children</h3>
          <p>This site is intended for general audiences learning about personal finance and is not directed at young children. If you believe a child has provided us personal information without appropriate consent, contact us and we'll remove it.</p>

          <h3>Changes to this policy</h3>
          <p>If this policy changes in a meaningful way, we'll update the effective date above. Significant changes will also be noted on this page.</p>

          <h3>Contact</h3>
          <p>Questions about this policy or your data? Reach us at <a href="mailto:uwopurpleportfolio@gmail.com" style={{ color: "var(--violet)", fontWeight: 700, textDecoration: "none" }}>uwopurpleportfolio@gmail.com</a>.</p>
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
