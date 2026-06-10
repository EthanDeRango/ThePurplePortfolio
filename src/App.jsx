import { useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Link } from "react-router-dom";
import STYLES from "./styles.js";
import { PLAN_DEFAULTS } from "./data/constants.js";
import Mark from "./components/Mark.jsx";

import Home from "./pages/Home.jsx";
import Planner from "./pages/Planner.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Library from "./pages/Library.jsx";
import LibraryCategory from "./pages/LibraryCategory.jsx";
import Topic from "./pages/Topic.jsx";
import About from "./pages/About.jsx";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/plan", label: "Planner" },
  { to: "/library", label: "Library" },
  { to: "/about", label: "About" },
];

function TopNav({ onBrand }) {
  const location = useLocation();
  const navigate = useNavigate();
  // Mark a link active when the current path starts with its `to`
  // (with a special case so "/" only matches exactly)
  const isActive = (to) => to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <nav className="pp-topnav" role="navigation" aria-label="Main navigation">
      <div className="pp-wrap pp-topnav-in">
        <button className="pp-brand pp-mark" onClick={() => navigate("/")} aria-label="Purple Portfolio home">
          <Mark size={34} />
          <span className="pp-brand-name">Purple <b>Portfolio</b></span>
        </button>

        <div className="pp-navlinks">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={"pp-navlink" + (isActive(to) ? " active" : "")}
              aria-current={isActive(to) ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
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
            <Mark size={28} />
            <span className="pp-brand-name" style={{ fontSize: 16 }}>Purple <b>Portfolio</b></span>
          </button>
          <p style={{ fontSize: 13, color: "#8E7AA0", marginTop: 6 }}>Canadian investing education — not advice.</p>
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
          <p style={{ fontSize: 13, color: "#8E7AA0", lineHeight: 1.6 }}>Built for Canadians. Runs in your browser — your numbers never leave your device.</p>
        </div>
      </div>
      <div className="pp-wrap pp-footer-fine">
        Purple Portfolio is an educational tool only. It is not a registered financial adviser, broker, or tax professional. All projections are illustrative and based on your inputs — actual returns and tax outcomes will vary.
      </div>
    </footer>
  );
}

function AppShell({ plan, setPlan }) {
  return (
    <>
      <TopNav />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/plan" element={<Planner plan={plan} setPlan={setPlan} />} />
          <Route path="/dashboard" element={<Dashboard plan={plan} setPlan={setPlan} />} />
          <Route path="/library" element={<Library />} />
          <Route path="/library/:cat" element={<LibraryCategory />} />
          <Route path="/library/:cat/:topic" element={<Topic />} />
          <Route path="/about" element={<About />} />
          {/* Catch-all → home */}
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  const [plan, setPlan] = useState(PLAN_DEFAULTS);

  return (
    <BrowserRouter>
      <div className="pp">
        <style>{STYLES}</style>
        <AppShell plan={plan} setPlan={setPlan} />
      </div>
    </BrowserRouter>
  );
}
