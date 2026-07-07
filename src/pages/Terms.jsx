import { useNavigate } from "react-router-dom";
import { ArrowRight, AlertTriangle } from "lucide-react";

const EFFECTIVE_DATE = "July 2026";

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="pp-wrap pp-section">
      <div className="pp-topic">
        <span className="pp-eyebrow">Legal</span>
        <h1 style={{ fontSize: 42, margin: "12px 0 6px" }}>Terms of Use</h1>
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 22 }}>Effective {EFFECTIVE_DATE}</p>

        <div className="pp-callout">
          <AlertTriangle size={18} style={{ flex: "none" }} />
          <span>Short version: this is a free educational planning tool, not financial, tax, or legal advice. Use it to learn and organize your own numbers — the decisions, and responsibility for them, stay yours.</span>
        </div>

        <div className="pp-prose">
          <h3>Who we are</h3>
          <p>The Purple Portfolio ("we," "us") is an independent, unincorporated educational project. We are not a registered investment adviser, portfolio manager, broker-dealer, insurance provider, or tax professional, and nothing on this site is prepared or reviewed by one on your behalf. By using this site, you agree to these terms.</p>

          <h3>What this is — and isn't</h3>
          <p>The Purple Portfolio helps you learn about Canadian personal finance and organize your own numbers: decoding a paycheque, estimating contribution room, and illustrating a projection based on assumptions you can see and edit. It does not recommend specific securities, prepare your taxes, manage your money, or guarantee any outcome. Every figure — tax estimates, projections, "suggested" account orders — is a simplified illustration built from the numbers you enter and general rules; it is not personalized advice and may not reflect your complete financial or tax situation. Before making decisions with real money, speak with a licensed financial advisor, accountant, or other qualified professional.</p>

          <h3>No warranty</h3>
          <p>This site is provided "as is," without warranty of any kind. We work to keep the tax rules, contribution limits, and calculations accurate and current, but we don't guarantee they're complete, error-free, or up to date, and rules can change after we publish them. You're responsible for verifying anything important — start with the Canada Revenue Agency (canada.ca) or Revenu Québec for authoritative figures.</p>

          <h3>Limitation of liability</h3>
          <p>To the fullest extent permitted by law, The Purple Portfolio and anyone involved in creating it are not liable for any loss or damage arising from your use of this site or reliance on anything it shows you, including financial decisions made using its projections or estimates.</p>

          <h3>Your account</h3>
          <p>Creating an account is optional and only used to sync your plan across devices. You're responsible for keeping your login credentials secure. You can delete your account data at any time — see our <button type="button" className="pp-inlinelink" onClick={() => navigate("/privacy")} style={{ fontSize: "inherit" }}>Privacy Policy</button> for details.</p>

          <h3>Acceptable use</h3>
          <p>Please don't misuse the site — for example, attempting to disrupt it, scrape it at scale, or use it to impersonate someone else. We may suspend access for accounts that do.</p>

          <h3>Intellectual property</h3>
          <p>The Purple Portfolio name, branding, and original content on this site belong to us. You're welcome to use the planning tools for your own personal use; please don't reproduce or redistribute the site's content or code without asking first.</p>

          <h3>Governing law</h3>
          <p>These terms are governed by the laws of the Province of Ontario and the federal laws of Canada applicable within it.</p>

          <h3>Changes to these terms</h3>
          <p>We may update these terms as the site evolves. If we make a meaningful change, we'll update the effective date above.</p>

          <h3>Contact</h3>
          <p>Questions about these terms? Reach us at <a href="mailto:uwopurpleportfolio@gmail.com" style={{ color: "var(--violet)", fontWeight: 700, textDecoration: "none" }}>uwopurpleportfolio@gmail.com</a>.</p>
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
