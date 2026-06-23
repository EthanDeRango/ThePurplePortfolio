import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Link } from "react-router-dom";
import STYLES from "./styles.js";
import { PLAN_DEFAULTS, PLAN_STORAGE_KEY } from "./data/constants.js";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import AuthModal from "./components/AuthModal.jsx";
import NewsletterPrompt from "./components/NewsletterPrompt.jsx";
import { usePlanSync } from "./hooks/usePlanSync.js";

import Home from "./pages/Home.jsx";
import Planner from "./pages/Planner.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Library from "./pages/Library.jsx";
import LibraryCategory from "./pages/LibraryCategory.jsx";
import Topic from "./pages/Topic.jsx";
import About from "./pages/About.jsx";

function loadSavedPlan() {
  try {
    const raw = localStorage.getItem(PLAN_STORAGE_KEY);
    if (raw) return { ...PLAN_DEFAULTS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return PLAN_DEFAULTS;
}

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/plan", label: "Planner" },
  { to: "/library", label: "Library" },
  { to: "/about", label: "About" },
];

function TopNav({ onReset, hasSaved, onSignIn }) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, signOut, deleteCloudData } = useAuth();
  const [showCleared, setShowCleared] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteState, setDeleteState] = useState("idle"); // idle | working | done
  const isActive = (to) => to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  const handleDeleteData = async () => {
    setDeleteState("working");
    const { error } = await deleteCloudData();
    if (error) { setDeleteState("idle"); setConfirmDelete(false); return; }
    setDeleteState("done");
    setTimeout(() => { setConfirmDelete(false); setDeleteState("idle"); }, 2200);
  };

  const handleReset = () => {
    onReset();
    setShowCleared(true);
    setTimeout(() => setShowCleared(false), 2200);
  };

  return (
    <nav className="pp-topnav" role="navigation" aria-label="Main navigation">
      <div className="pp-wrap pp-topnav-in">
        <button className="pp-brand pp-mark" onClick={() => navigate("/")} aria-label="Purple Portfolio home">
          <img src="/logo.jpg" alt="The Purple Portfolio crest" className="pp-brand-logo" />
          <span className="pp-brand-name">Purple <b>Portfolio</b></span>
        </button>

        <div className="pp-navlinks">
          {NAV_LINKS.map(({ to, label }) => (
            <Link key={to} to={to} className={"pp-navlink" + (isActive(to) ? " active" : "")} aria-current={isActive(to) ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </div>

        <div className="pp-navauth" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {(hasSaved || showCleared) && !user && (
            <div className="pp-session">
              <span className="pp-session-dot" style={showCleared ? { background: "var(--muted)" } : {}} />
              <span className="pp-session-label">{showCleared ? "Cleared" : "Auto-saved"}</span>
              {!showCleared && (
                <button className="pp-session-clear" onClick={handleReset} title="Clear session and start over">
                  · Start fresh
                </button>
              )}
            </div>
          )}

          {user ? (
            <div className="pp-auth-user">
              <div className="pp-auth-avatar">{user.email[0].toUpperCase()}</div>
              <span className="pp-auth-email">{user.email}</span>
              {confirmDelete ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {deleteState === "done" ? (
                    <span style={{ fontSize: 12.5, color: "var(--green)", fontWeight: 700 }}>Deleted ✓</span>
                  ) : (
                    <>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>Delete saved plan from our servers?</span>
                      <button className="pp-auth-delete-confirm" disabled={deleteState === "working"} onClick={handleDeleteData}>
                        {deleteState === "working" ? "Deleting…" : "Delete"}
                      </button>
                      <button className="pp-auth-signout-btn" onClick={() => setConfirmDelete(false)}>Cancel</button>
                    </>
                  )}
                </span>
              ) : (
                <>
                  <button className="pp-auth-signout-btn" onClick={() => setConfirmDelete(true)} title="Permanently delete your saved plan from our servers">Delete data</button>
                  <button className="pp-auth-signout-btn" onClick={() => signOut()}>Sign out</button>
                </>
              )}
            </div>
          ) : (
            <button className="pp-auth-signin-btn" onClick={onSignIn}>
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  const navigate = useNavigate();
  return (
    <footer className="pp-footer">
      <div className="pp-wrap pp-footer-cols">
        <div>
          <button className="pp-brand" onClick={() => navigate("/")} aria-label="Purple Portfolio home" style={{ marginBottom: 10 }}>
            <img src="/logo.jpg" alt="The Purple Portfolio crest" className="pp-brand-logo" style={{ width: 36, height: 36 }} />
            <span className="pp-brand-name" style={{ fontSize: 16 }}>Purple <b>Portfolio</b></span>
          </button>
          <p style={{ fontSize: 13, color: "#8E7AA0", marginTop: 6 }}>Canadian investing education, not advice.</p>
        </div>
        <div>
          <h5>Navigate</h5>
          <nav aria-label="Footer navigation">
            {NAV_LINKS.map(({ to, label }) => (
              <Link key={to} to={to}>{label}</Link>
            ))}
          </nav>
        </div>
        <div>
          <h5>About</h5>
          <p style={{ fontSize: 13, color: "#8E7AA0", lineHeight: 1.6 }}>Built for Canadians. Private by default. Your numbers stay in your browser unless you sign in to save across devices.</p>
        </div>
        <div>
          <h5>Contact</h5>
          <a href="mailto:uwopurpleportfolio@gmail.com" style={{ fontSize: 13, color: "#8E7AA0", textDecoration: "none", lineHeight: 2 }}>
            uwopurpleportfolio@gmail.com
          </a>
          <p style={{ fontSize: 13, color: "#8E7AA0", lineHeight: 1.6, marginTop: 4 }}>Questions, feedback, or want to get involved?</p>
        </div>
      </div>
      <div className="pp-wrap pp-footer-fine">
        Purple Portfolio is an educational tool only. It is not a registered financial adviser, broker, or tax professional. All projections are illustrative and based on your inputs; actual returns and tax outcomes will vary.
      </div>
    </footer>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function AppShell({ plan, setPlan, onReset, hasSaved }) {
  const { user, showNewsletterPrompt, recoveryMode, clearRecovery } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  usePlanSync(user, plan, setPlan, PLAN_DEFAULTS);

  return (
    <>
      <ScrollToTop />
      <TopNav onReset={onReset} hasSaved={hasSaved} onSignIn={() => setShowAuth(true)} />
      {showNewsletterPrompt && (
        <div className="pp-wrap" style={{ paddingTop: 10 }}>
          <NewsletterPrompt />
        </div>
      )}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/plan" element={<Planner plan={plan} setPlan={setPlan} />} />
          <Route path="/dashboard" element={<Dashboard plan={plan} setPlan={setPlan} />} />
          <Route path="/library" element={<Library />} />
          <Route path="/library/:cat" element={<LibraryCategory />} />
          <Route path="/library/:cat/:topic" element={<Topic />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
      {(showAuth || recoveryMode) && (
        <AuthModal
          initialView={recoveryMode ? "recovery" : "signin"}
          onClose={() => { setShowAuth(false); if (recoveryMode) clearRecovery(); }}
        />
      )}
    </>
  );
}

export default function App() {
  const [plan, setPlan]     = useState(loadSavedPlan);
  const [hasSaved, setHasSaved] = useState(() => !!localStorage.getItem(PLAN_STORAGE_KEY));

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plan));
        setHasSaved(true);
      } catch { /* storage quota exceeded */ }
    }, 400);
    return () => clearTimeout(t);
  }, [plan]);

  const resetPlan = () => {
    try { localStorage.removeItem(PLAN_STORAGE_KEY); } catch { /* ignore */ }
    setHasSaved(false);
    setPlan(PLAN_DEFAULTS);
  };

  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="pp">
          <style>{STYLES}</style>
          <AppShell plan={plan} setPlan={setPlan} onReset={resetPlan} hasSaved={hasSaved} />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
