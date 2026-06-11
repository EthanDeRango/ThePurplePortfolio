import { Bell, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function NewsletterPrompt() {
  const { resolveNewsletterPrompt, dismissNewsletterPrompt } = useAuth();
  return (
    <div className="pp-newsletter-banner">
      <Bell size={18} style={{ color: "var(--violet)", flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <span style={{ fontWeight: 700, marginRight: 6 }}>Stay in the loop.</span>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>Receive club newsletters with investing tips and feature updates?</span>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button className="pp-btn pp-btn-primary" style={{ padding: "5px 14px", fontSize: 13 }} onClick={() => resolveNewsletterPrompt(true)}>
          Yes please
        </button>
        <button className="pp-btn pp-btn-ghost" style={{ padding: "5px 11px", fontSize: 13 }} onClick={() => resolveNewsletterPrompt(false)}>
          No thanks
        </button>
      </div>
      <button className="pp-auth-x" style={{ position: "static", width: 26, height: 26 }} onClick={dismissNewsletterPrompt} aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}
