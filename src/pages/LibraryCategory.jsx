import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { LIBRARY } from "../data/library.js";

export default function LibraryCategory() {
  const { cat: catKey } = useParams();
  const navigate = useNavigate();
  const cat = LIBRARY.find((c) => c.key === catKey);
  if (!cat) return null;
  const Ic = cat.icon;

  return (
    <div className="pp-wrap pp-section">
      <button className="pp-back" onClick={() => navigate("/library")}>
        <ArrowLeft size={16} /> All categories
      </button>
      <div style={{ display: "flex", gap: 14, alignItems: "center", margin: "18px 0 8px" }}>
        <div className="pp-box-ic"><Ic size={24} /></div>
        <h1 style={{ fontSize: 38 }}>{cat.name}</h1>
      </div>
      <p style={{ color: "var(--muted)", fontSize: 17, maxWidth: "40em", marginBottom: 32 }}>{cat.desc}</p>
      <div className="pp-grid-3">
        {cat.topics.map((t) => (
          <button
            className="pp-box"
            key={t.key}
            onClick={() => navigate(`/library/${cat.key}/${t.key}`)}
          >
            <h3 style={{ fontSize: 20 }}>{t.name}</h3>
            <p>{t.lead}</p>
            <span className="pp-box-foot" style={{ marginTop: 8 }}>Read <ChevronRight size={15} /></span>
          </button>
        ))}
      </div>
    </div>
  );
}
