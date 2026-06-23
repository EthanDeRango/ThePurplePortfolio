import { useState } from "react";
import { X, Eye, EyeOff, Mail, Lock, Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

// view: "signin" | "register" | "reset" (request a reset email) | "recovery" (set a new password)
export default function AuthModal({ onClose, initialView = "signin" }) {
  const { signIn, signUp, resetPassword, updatePassword } = useAuth();
  const [view, setView]         = useState(initialView);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [newsletter, setNewsletter] = useState(true);
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(null);

  const isRecovery = view === "recovery";
  const goView = (v) => {
    setView(v);
    setError(null);
    setSuccess(null);
    setPassword("");
    setConfirm("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    // Client-side checks for the password-setting views.
    if (view === "register" || view === "recovery") {
      if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
      if (password !== confirm) { setError("Passwords don't match. Please re-enter."); return; }
    }
    setLoading(true);
    try {
      if (view === "signin") {
        const { error } = await signIn(email, password);
        if (error) { setError(friendlyError(error.message)); return; }
        onClose();
      } else if (view === "register") {
        const { error, data } = await signUp(email, password, newsletter);
        if (error) { setError(friendlyError(error.message)); return; }
        // Supabase returns an empty identities array when the email already exists
        if (data?.user?.identities?.length === 0) {
          setError("An account with this email already exists. Try signing in instead.");
          return;
        }
        setSuccess("Almost there! Check your email for a confirmation link, then come back and sign in.");
      } else if (view === "reset") {
        const { error } = await resetPassword(email);
        if (error) { setError(friendlyError(error.message)); return; }
        setSuccess("If an account exists for that email, a reset link is on its way. Check your inbox (and your spam folder).");
      } else if (view === "recovery") {
        const { error } = await updatePassword(password);
        if (error) { setError(friendlyError(error.message)); return; }
        setSuccess("Your password has been updated. You're all set and signed in.");
      }
    } finally {
      setLoading(false);
    }
  };

  const tagline = view === "reset"
    ? "Reset your password"
    : isRecovery
      ? "Choose a new password"
      : "Save your plan and access it from any device";

  return (
    <div
      className="pp-auth-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="pp-auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">

        <button className="pp-auth-x" onClick={onClose} aria-label="Close">
          <X size={17} />
        </button>

        {/* Header */}
        <div className="pp-auth-head">
          <img src="/logo.jpg" alt="The Purple Portfolio" className="pp-auth-modal-logo" />
          <div id="auth-title" className="pp-auth-logo-name">Purple <b>Portfolio</b></div>
          <p className="pp-auth-tagline">{tagline}</p>
        </div>

        {/* Tabs — only for the sign in / create account views */}
        {(view === "signin" || view === "register") && (
          <div className="pp-auth-tabs" role="tablist">
            <button role="tab" aria-selected={view === "signin"} className={view === "signin" ? "on" : ""} onClick={() => goView("signin")}>Sign in</button>
            <button role="tab" aria-selected={view === "register"} className={view === "register" ? "on" : ""} onClick={() => goView("register")}>Create account</button>
          </div>
        )}

        {success ? (
          <div className="pp-auth-success">
            <div className="pp-auth-success-icon">{isRecovery ? "✅" : "✉️"}</div>
            <p>{success}</p>
            <button
              className="pp-btn pp-btn-primary pp-auth-fullbtn"
              onClick={() => { if (isRecovery) { onClose(); } else { setSuccess(null); goView("signin"); } }}
            >
              {isRecovery ? "Continue" : "Back to sign in"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="pp-auth-form" noValidate>

            {/* Email — shown for every view except recovery (the link already identifies the user) */}
            {!isRecovery && (
              <div className="pp-auth-field">
                <label htmlFor="auth-email">Email</label>
                <div className="pp-auth-wrap">
                  <Mail size={15} className="pp-auth-ic" />
                  <input
                    id="auth-email" type="email" autoComplete="email"
                    placeholder="you@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} required
                  />
                </div>
              </div>
            )}

            {/* Reset view stops here — just an email + send button */}
            {view === "reset" ? (
              <>
                <p className="pp-auth-hint">Enter your account email and we'll send you a link to set a new password.</p>
                {error && <div className="pp-auth-error" role="alert">{error}</div>}
                <button type="submit" className="pp-btn pp-btn-primary pp-auth-fullbtn" disabled={loading}>
                  {loading ? "Sending…" : "Send reset link"}
                </button>
                <p className="pp-auth-swap">
                  Remembered it?{" "}
                  <button type="button" onClick={() => goView("signin")}>Back to sign in</button>
                </p>
              </>
            ) : (
              <>
                {/* Password */}
                <div className="pp-auth-field">
                  <label htmlFor="auth-pw">{isRecovery ? "New password" : "Password"}</label>
                  <div className="pp-auth-wrap">
                    <Lock size={15} className="pp-auth-ic" />
                    <input
                      id="auth-pw"
                      type={showPw ? "text" : "password"}
                      autoComplete={view === "signin" ? "current-password" : "new-password"}
                      placeholder={view === "signin" ? "Your password" : "At least 8 characters"}
                      value={password} onChange={(e) => setPassword(e.target.value)} required
                    />
                    <button type="button" className="pp-auth-eye" onClick={() => setShowPw((v) => !v)} tabIndex={-1} aria-label={showPw ? "Hide password" : "Show password"}>
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Forgot-password link — sign-in view only */}
                {view === "signin" && (
                  <div className="pp-auth-forgot">
                    <button type="button" onClick={() => goView("reset")}>Forgot password?</button>
                  </div>
                )}

                {/* Confirm password — register + recovery */}
                {(view === "register" || isRecovery) && (
                  <div className="pp-auth-field">
                    <label htmlFor="auth-confirm">Confirm password</label>
                    <div className="pp-auth-wrap">
                      <Lock size={15} className="pp-auth-ic" />
                      <input
                        id="auth-confirm"
                        type={showPw ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Same password again"
                        value={confirm} onChange={(e) => setConfirm(e.target.value)} required
                      />
                    </div>
                  </div>
                )}

                {/* Newsletter — register only */}
                {view === "register" && (
                  <label className="pp-auth-newsletter-check">
                    <input
                      type="checkbox"
                      checked={newsletter}
                      onChange={(e) => setNewsletter(e.target.checked)}
                    />
                    <span>
                      <Bell size={14} style={{ verticalAlign: "middle", marginRight: 5, color: "var(--violet)" }} />
                      <b>Club newsletters</b> — investing tips and new features.{" "}
                      <span style={{ color: "var(--muted)" }}>Unsubscribe anytime.</span>
                    </span>
                  </label>
                )}

                {error && <div className="pp-auth-error" role="alert">{error}</div>}

                <button type="submit" className="pp-btn pp-btn-primary pp-auth-fullbtn" disabled={loading}>
                  {loading ? "One moment…" : isRecovery ? "Update password" : view === "signin" ? "Sign in" : "Create account"}
                </button>

                {view === "signin" && (
                  <p className="pp-auth-swap">
                    No account?{" "}
                    <button type="button" onClick={() => goView("register")}>Create one free →</button>
                  </p>
                )}
                {view === "register" && (
                  <p className="pp-auth-swap">
                    Already have one?{" "}
                    <button type="button" onClick={() => goView("signin")}>Sign in →</button>
                  </p>
                )}
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

function friendlyError(msg) {
  if (!msg) return "Something went wrong. Please try again.";
  if (msg.includes("Invalid login credentials")) return "Incorrect email or password.";
  if (msg.includes("Email not confirmed")) return "Please confirm your email first — check your inbox.";
  if (msg.includes("User already registered")) return "This email is already registered. Try signing in.";
  if (msg.includes("New password should be different")) return "Your new password must be different from your old one.";
  if (msg.includes("rate limit") || msg.includes("Email rate")) return "Too many attempts — please wait a moment and try again.";
  return msg;
}
