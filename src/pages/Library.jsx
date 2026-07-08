import { useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight } from "lucide-react";
import { LIBRARY, LIBRARY_GROUPS } from "../data/library.js";

export default function Library() {
  const navigate = useNavigate();

  return (
    <div className="pp-wrap pp-section">
      <span className="pp-eyebrow"><BookOpen size={14} /> Learning Library</span>
      <h1 style={{ fontSize: 42, margin: "14px 0 10px" }}>Everything, explained simply.</h1>
      <p style={{ color: "var(--muted)", fontSize: 17, maxWidth: "40em", marginBottom: 36 }}>
        Pick a category to dive in. Each holds bite-sized explainers in plain language — honest about
        both the upsides and the catches.
      </p>
      {LIBRARY_GROUPS.map((g, gi) => {
        const cats = LIBRARY.filter((cat) => cat.group === g.name);
        if (!cats.length) return null;
        return (
          <div key={g.name} style={{ marginTop: gi === 0 ? 0 : 40 }}>
            <h2 style={{ fontSize: 22, margin: "0 0 4px" }}>{g.name}</h2>
            <p style={{ color: "var(--muted)", fontSize: 14.5, marginBottom: 18 }}>{g.desc}</p>
            <div className="pp-grid-2">
              {cats.map((cat) => {
                const Ic = cat.icon;
                return (
                  <button className="pp-box" key={cat.key} onClick={() => navigate(`/library/${cat.key}`)}>
                    <div className="pp-box-ic"><Ic size={22} /></div>
                    <h3>{cat.name}</h3>
                    <p>{cat.desc}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                      <span className="pp-box-count">{cat.topics.length} topics</span>
                      <span className="pp-box-foot">Open <ChevronRight size={15} /></span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
