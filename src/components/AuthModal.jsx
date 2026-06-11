import { useState } from "react";
import { X, Eye, EyeOff, Mail, Lock, Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import Mark from "./Mark.jsx";

export default function AuthModal({ onClose }) {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [tab, setTab]           = useState("signin");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [newsletter, setNewsletter] = useState(true);
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(null);

  const switchTab = (t) => {
    setTab(t);
    setError(null);
    setSuccess(null);
    setPassword("");
    setConfirm("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (tab === "register") {
      if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
      if (password !== confirm) { setError("Passwords don't match — please re-enter."); return; }
    }
    setLoading(true);
    try {
      if (tab === "signin") {
        const { error } = await signIn(email, password);
        if (error) { setError(friendlyError(error.message)); return; }
        onClose();
      } else {
        const { error, data } = await signUp(email, password, newsletter);
        if (error) { setError(friendlyError(error.message)); return; }
        // Supabase returns an empty identities array when the email already exists
        if (data?.user?.identities?.length === 0) {
          setError("An account with this email already exists. Try signing in instead.");
          return;
        }
        setSuccess("Almost there! Check your email for a confirmation link, then come back and sign in.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    setError(null);
    signInWithGoogle();
    // OAuth redirects the page — modal closes naturally on return
  };

  return (
    <div
      className="pp-auth-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="pp-auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">

        <button className="pp-auth-x" onClick={onClose} aria-label="Close sign-in">
          <X size={17} />
        </button>

        {/* Header */}
        <div className="pp-auth-head">
          <Mark size={30} />
          <div id="auth-title" className="pp-auth-logo-name">Purple <b>Portfolio</b></div>
          <p className="pp-auth-tagline">Save your plan — access it from any device</p>
        </div>

        {/* Tabs */}
        <div className="pp-auth-tabs" role="tablist">
          <button role="tab" aria-selected={tab === "signin"} className={tab === "signin" ? "on" : ""} onClick={() => switchTab("signin")}>Sign in</button>
          <button role="tab" aria-selected={tab === "register"} className={tab === "register" ? "on" : ""} onClick={() => switchTab("register")}>Create account</button>
        </div>

        {success ? (
          <div className="pp-auth-success">
            <div className="pp-auth-success-icon">✉️</div>
            <p>{success}</p>
            <button className="pp-btn pp-btn-primary pp-auth-fullbtn" onClick={() => { setSuccess(null); switchTab("signin"); }}>
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="pp-auth-form" noValidate>

            {/* Email */}
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

            {/* Password */}
            <div className="pp-auth-field">
              <label htmlFor="auth-pw">Password</label>
              <div className="pp-auth-wrap">
                <Lock size={15} className="pp-auth-ic" />
                <input
                  id="auth-pw"
                  type={showPw ? "text" : "password"}
                  autoComplete={tab === "signin" ? "current-password" : "new-password"}
                  placeholder={tab === "register" ? "At least 8 characters" : "Your password"}
                  value={password} onChange={(e) => setPassword(e.target.value)} required
                />
                <button type="button" className="pp-auth-eye" onClick={() => setShowPw((v) => !v)} tabIndex={-1} aria-label={showPw ? "Hide password" : "Show password"}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Register-only fields */}
            {tab === "register" && (
              <>
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
              </>
            )}

            {error && <div className="pp-auth-error" role="alert">{error}</div>}

            <button type="submit" className="pp-btn pp-btn-primary pp-auth-fullbtn" disabled={loading}>
              {loading ? "One moment…" : tab === "signin" ? "Sign in" : "Create account"}
            </button>

            <div className="pp-auth-divider"><span>or</span></div>

            <button type="button" className="pp-auth-google-btn" onClick={handleGoogle} disabled={loading}>
              <GoogleIcon />
              Continue with Google
            </button>

            {tab === "signin" ? (
              <p className="pp-auth-swap">
                No account?{" "}
                <button type="button" onClick={() => switchTab("register")}>Create one free →</button>
              </p>
            ) : (
              <p className="pp-auth-swap">
                Already have one?{" "}
                <button type="button" onClick={() => switchTab("signin")}>Sign in →</button>
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17.64 9.2045c0-.638-.0573-1.2518-.164-1.8409H9v3.4814h4.8436c-.2086 1.1254-.8427 2.0791-1.7959 2.7177v2.2581h2.9087c1.7018-1.567 2.6836-3.874 2.6836-6.6163z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.4673-.8059 5.9564-2.1818l-2.9087-2.2581c-.8059.54-1.8368.859-3.0477.859-2.3445 0-4.3282-1.5836-5.036-3.7104H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71c-.18-.54-.2827-1.1168-.2827-1.71s.1027-1.17.2827-1.71V4.9582H.9574C.3477 6.173 0 7.5482 0 9s.3477 2.827.9574 4.0418L3.964 10.71z" fill="#FBBC05"/>
      <path d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5813C13.4627.8918 11.4255 0 9 0 5.4818 0 2.4382 2.0168.9574 4.9582L3.964 7.29C4.6718 5.1632 6.6555 3.5795 9 3.5795z" fill="#EA4335"/>
    </svg>
  );
}

function friendlyError(msg) {
  if (!msg) return "Something went wrong. Please try again.";
  if (msg.includes("Invalid login credentials")) return "Incorrect email or password.";
  if (msg.includes("Email not confirmed")) return "Please confirm your email first — check your inbox.";
  if (msg.includes("User already registered")) return "This email is already registered. Try signing in.";
  if (msg.includes("rate limit")) return "Too many attempts — please wait a moment and try again.";
  return msg;
}
