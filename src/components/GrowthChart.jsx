import { useState } from "react";
import { fmtMoney, fmtShort } from "../lib/calculations.js";

export default function GrowthChart({
  series, optSeries, scaleRef, contribSeries, years, startAge, startMonth,
  homeIdx, homeAge, fhsaIdx, color, inflation, inflRate = 0.02,
  afterTax, retMarginal, rrspShare,
  milestones,  // [{year, label, color}] — goal markers drawn on the curve
}) {
  const W = 720, H = 332, PL = 56, PR = 18, PT = 34, PB = 34;
  const plotW = W - PL - PR, plotH = H - PT - PB;
  const [hover, setHover] = useState(null);
  const lineColor = color || "var(--violet)";
  const taxFactor = afterTax ? (1 - (retMarginal || 0) * (rrspShare == null ? 1 : rrspShare)) : 1;
  const adj = (v, y) => { let x = v * taxFactor; if (inflation) x = x / Math.pow(1 + inflRate, y); return x; };
  const vals = (series || [0]).map((v, y) => adj(v, y));
  const optVals = optSeries ? optSeries.map((v, y) => adj(v, y)) : null;
  const refAdj = scaleRef ? adj(scaleRef, years) : 0;
  const max = Math.max(1, refAdj, ...vals, ...(optVals || []));
  const X = (y) => PL + (years === 0 ? 0 : (y / years) * plotW);
  const Y = (v) => PT + plotH - (v / max) * plotH;
  const linePts = vals.map((v, y) => `${X(y)},${Y(v)}`).join(" ");
  const areaPts = `${PL},${PT + plotH} ` + linePts + ` ${X(years)},${PT + plotH}`;
  const gy = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const xticks = Array.from(new Set([0, Math.round(years / 2), years]))
    .filter((t) => t >= 0 && t <= years)
    .sort((a, b) => a - b);

  const showFhsa = fhsaIdx != null && fhsaIdx >= 0 && fhsaIdx <= years;
  const showHome = homeIdx != null && homeIdx >= 0 && homeIdx <= years;
  const markersClose = showFhsa && showHome && Math.abs(X(fhsaIdx) - X(homeIdx)) < 90;

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const fx = (cx / rect.width) * W;
    let yi = Math.round(((fx - PL) / plotW) * years);
    setHover(Math.max(0, Math.min(years, yi)));
  };

  const onKey = (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); setHover((h) => Math.min(years, (h ?? 0) + 1)); }
    if (e.key === "ArrowLeft")  { e.preventDefault(); setHover((h) => Math.max(0, (h ?? years) - 1)); }
    if (e.key === "Escape")     setHover(null);
  };

  // Tooltip edge detection: flip to left side when close to right edge to avoid viewport clipping
  const tipFlip = hover != null && hover > years * 0.65;
  const tipStyle = hover != null ? {
    top: (Y(vals[hover]) / H) * 100 + "%",
    ...(tipFlip
      ? { right: ((W - X(hover)) / W) * 100 + "%", left: "auto", transform: "translateY(-50%)" }
      : { left: (X(hover) / W) * 100 + "%", right: "auto", transform: "translate(-50%, -50%)" }),
  } : {};

  return (
    <div className="pp-chartwrap">
      <div className="pp-chartlegend">
        <span className="dot" style={{ background: lineColor }} />
        Your current path
        {optVals && (
          <>
            <span style={{ marginLeft: 14, border: "2px dashed #2E8B57", width: 10, height: 10, display: "inline-block", borderRadius: "50%", verticalAlign: "middle", flexShrink: 0 }} />
            <span style={{ marginLeft: 4 }}>Optimal strategy (reinvest tax refund)</span>
          </>
        )}
      </div>

      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        className="pp-chartfocus"
        tabIndex={0}
        role="img"
        aria-label={`Projected growth chart. Use arrow keys to step through years. ${hover != null ? `Age ${startAge + hover}: ${fmtMoney(vals[hover])}` : ""}`}
        aria-live="polite"
        onKeyDown={onKey}
        onMouseLeave={() => setHover(null)}
        onBlur={() => setHover(null)}
        style={{ outline: "none" }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          style={{ display: "block", touchAction: "none" }}
          aria-hidden="true"
          onMouseMove={onMove}
          onTouchStart={onMove}
          onTouchMove={onMove}
        >
          <defs>
            <linearGradient id="ppArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.18" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          {gy.map((v, i) => (
            <g key={i}>
              <line x1={PL} y1={Y(v)} x2={W - PR} y2={Y(v)} stroke="rgba(34,19,48,0.10)" strokeWidth="1" />
              <text x={PL - 8} y={Y(v) + 4} textAnchor="end" fontSize="11" fill="#6E5E78" fontFamily="Hanken Grotesk">{fmtShort(v)}</text>
            </g>
          ))}

          {showHome && (
            <g>
              <line x1={X(homeIdx)} y1={PT} x2={X(homeIdx)} y2={PT + plotH} stroke="#B0822B" strokeWidth="1.5" strokeDasharray="4 4" />
              <text x={X(homeIdx)} y={PT - 18} textAnchor="middle" fontSize="10.5" fill="#B0822B" fontWeight="700" fontFamily="Hanken Grotesk">Home · age {homeAge}</text>
            </g>
          )}
          {showFhsa && (
            <g>
              <line x1={X(fhsaIdx)} y1={PT} x2={X(fhsaIdx)} y2={PT + plotH} stroke="#A8456A" strokeWidth="1.5" strokeDasharray="2 3" />
              <text x={X(fhsaIdx)} y={markersClose ? PT - 4 : PT - 18} textAnchor="middle" fontSize="10.5" fill="#A8456A" fontWeight="700" fontFamily="Hanken Grotesk">FHSA closes</text>
            </g>
          )}

          <polygon points={areaPts} fill="url(#ppArea)" />
          {optVals && (
            <polyline
              points={optVals.map((v, y) => `${X(y)},${Y(v)}`).join(" ")}
              fill="none" stroke="#2E8B57" strokeWidth="2" strokeDasharray="7 4"
              strokeLinejoin="round" strokeLinecap="round" opacity="0.75"
            />
          )}
          <polyline points={linePts} fill="none" stroke={lineColor} strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={X(years)} cy={Y(vals[years])} r="4" fill={lineColor} />
          {optVals && <circle cx={X(years)} cy={Y(optVals[years])} r="4" fill="#2E8B57" />}

          {/* Goal milestones — dots on the curve with labels */}
          {milestones?.filter((m) => m.year >= 0 && m.year <= years).map((m, mi, arr) => {
            const vIdx = Math.min(m.year, vals.length - 1);
            const cx = X(m.year), cy = Y(vals[vIdx]);
            // Stagger label if close to another marker (home, fhsa, or another milestone)
            const allX = [
              ...(showHome ? [X(homeIdx)] : []),
              ...(showFhsa ? [X(fhsaIdx)] : []),
              ...arr.filter((_, oi) => oi !== mi).map((o) => X(o.year)),
            ];
            const tooClose = allX.some((ox) => Math.abs(ox - cx) < 72);
            return (
              <g key={mi}>
                <circle cx={cx} cy={cy} r="9" fill={m.color} fillOpacity="0.15" />
                <circle cx={cx} cy={cy} r="4.5" fill={m.color} />
                <text x={cx} y={tooClose ? PT - 4 : PT - 18} textAnchor="middle" fontSize="10.5"
                  fill={m.color} fontWeight="700" fontFamily="Hanken Grotesk">
                  {m.label}
                </text>
              </g>
            );
          })}

          {hover != null && (
            <g>
              <line x1={X(hover)} y1={PT} x2={X(hover)} y2={PT + plotH} stroke={lineColor} strokeWidth="1" strokeOpacity="0.5" />
              <circle cx={X(hover)} cy={Y(vals[hover])} r="5.5" fill="#fff" stroke={lineColor} strokeWidth="2.5" />
            </g>
          )}

          {xticks.map((t) => (
            <text key={t} x={X(t)} y={H - 10} textAnchor="middle" fontSize="11" fill="#6E5E78" fontFamily="Hanken Grotesk">
              {t === 0 ? "Now" : `+${t}y`}
            </text>
          ))}
        </svg>

        {hover != null && (
          <div className="pp-tip" style={tipStyle}>
            <div className="ty">
              {hover === 0 ? "Now" : `+${hover} ${hover === 1 ? "year" : "years"}`}
              {startAge > 0 ? ` · age ${startAge + hover}` : ""}
            </div>
            <div className="tr">
              <i style={{ background: lineColor }} /> {fmtMoney(vals[hover])}
            </div>
            {optVals && optVals[hover] != null && (
              <div className="tr" style={{ color: "#2E8B57" }}>
                <i style={{ background: "#2E8B57" }} /> {fmtMoney(optVals[hover])} optimal
              </div>
            )}
            {contribSeries && contribSeries[hover] != null && (() => {
              const inv = contribSeries[hover] * taxFactor / (inflation ? Math.pow(1 + inflRate, hover) : 1);
              const grw = Math.max(0, vals[hover] - inv);
              return <div className="tsub">Invested {fmtMoney(inv)} · Growth {fmtMoney(grw)}</div>;
            })()}
          </div>
        )}
      </div>

      <p className="pp-chartkey">Use ← → arrow keys to step through years</p>
    </div>
  );
}
