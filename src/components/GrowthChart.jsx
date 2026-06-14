import { useState } from "react";
import { fmtMoney, fmtShort } from "../lib/calculations.js";

// stackedSeries: [{key, label, color, values: number[]}] — when provided, renders stacked
// areas instead of a single line. Each layer stacks on top of the previous one.
export default function GrowthChart({
  series, optSeries, scaleRef, contribSeries, years, startAge, startMonth,
  homeIdx, homeAge, fhsaIdx, color, inflation, inflRate = 0.02,
  afterTax, retMarginal, rrspShare,
  milestones,
  stackedSeries,
}) {
  // Increased top padding gives 3 staggered label rows without shrinking plotH (264px).
  const W = 720, H = 354, PL = 56, PR = 18, PT = 56, PB = 34;
  const plotW = W - PL - PR, plotH = H - PT - PB;
  const LABEL_ROWS = [PT - 14, PT - 28, PT - 42];
  const OVERLAP_PX = 82;

  const [hover, setHover] = useState(null);
  const lineColor = color || "var(--violet)";
  const taxFactor = afterTax ? (1 - (retMarginal || 0) * (rrspShare == null ? 1 : rrspShare)) : 1;
  const adj = (v, y) => { let x = v * taxFactor; if (inflation) x /= Math.pow(1 + inflRate, y); return x; };
  const vals = (series || [0]).map((v, y) => adj(v, y));
  const optVals = (optSeries && !stackedSeries) ? optSeries.map((v, y) => adj(v, y)) : null;

  // ── Stacked mode ─────────────────────────────────────────────────────────────
  // Each layer gets a cumulative bottom/top. Inflation is applied but not after-tax,
  // since we're showing account balances rather than retirement withdrawal amounts.
  let stackedLayers = null;
  if (stackedSeries && stackedSeries.length > 0) {
    const cumTop = new Array(years + 1).fill(0);
    stackedLayers = stackedSeries.map((layer) => {
      const av = layer.values.map((v, y) => {
        const val = Math.max(0, v);
        return inflation ? val / Math.pow(1 + inflRate, y) : val;
      });
      const bottom = [...cumTop];
      av.forEach((v, y) => { cumTop[y] += v; });
      return { ...layer, av, bottom, top: [...cumTop] };
    });
  }

  const totalSeries = stackedLayers ? stackedLayers[stackedLayers.length - 1].top : vals;
  const refAdj = scaleRef ? adj(scaleRef, years) : 0;
  const max = Math.max(1, refAdj, ...totalSeries, ...(optVals || []));
  const X = (y) => PL + (years === 0 ? 0 : (y / years) * plotW);
  const Y = (v) => PT + plotH - (v / max) * plotH;
  const linePts = vals.map((v, y) => `${X(y)},${Y(v)}`).join(" ");
  const areaPts = `${PL},${PT + plotH} ${linePts} ${X(years)},${PT + plotH}`;
  const gy = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const xticks = Array.from(new Set([0, Math.round(years / 2), years]))
    .filter((t) => t >= 0 && t <= years).sort((a, b) => a - b);

  const showFhsa = fhsaIdx != null && fhsaIdx >= 0 && fhsaIdx <= years;
  const showHome = homeIdx != null && homeIdx >= 0 && homeIdx <= years;
  const visibleMilestones = (milestones || []).filter((m) => m.year >= 0 && m.year <= years);

  // ── Greedy label-row assignment ───────────────────────────────────────────────
  const allMarkers = [
    ...(showHome ? [{ key: "home", xv: X(homeIdx) }] : []),
    ...(showFhsa ? [{ key: "fhsa", xv: X(fhsaIdx) }] : []),
    ...visibleMilestones.map((m) => ({ key: `m${m.year}`, xv: X(m.year) })),
  ].sort((a, b) => a.xv - b.xv);

  const placed = [];
  const rowOf = {};
  for (const mk of allMarkers) {
    const taken = placed.filter((p) => Math.abs(p.xv - mk.xv) < OVERLAP_PX).map((p) => p.row);
    let row = 0;
    while (taken.includes(row) && row < LABEL_ROWS.length - 1) row++;
    rowOf[mk.key] = row;
    placed.push({ xv: mk.xv, row });
  }
  const labelY = (key) => LABEL_ROWS[rowOf[key] ?? 0];

  // ── Interaction ───────────────────────────────────────────────────────────────
  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const fx = (cx / rect.width) * W;
    setHover(Math.max(0, Math.min(years, Math.round(((fx - PL) / plotW) * years))));
  };
  const onKey = (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); setHover((h) => Math.min(years, (h ?? 0) + 1)); }
    if (e.key === "ArrowLeft")  { e.preventDefault(); setHover((h) => Math.max(0, (h ?? years) - 1)); }
    if (e.key === "Escape") setHover(null);
  };

  const hoverTotal = hover != null ? totalSeries[hover] : null;
  const tipFlip = hover != null && hover > years * 0.65;
  const tipStyle = hoverTotal != null ? {
    top: (Y(hoverTotal) / H) * 100 + "%",
    ...(tipFlip
      ? { right: ((W - X(hover)) / W) * 100 + "%", left: "auto", transform: "translateY(-50%)" }
      : { left: (X(hover) / W) * 100 + "%", right: "auto", transform: "translate(-50%, -50%)" }),
  } : {};

  return (
    <div className="pp-chartwrap">

      {/* Legend */}
      <div className="pp-chartlegend" style={stackedSeries ? { flexWrap: "wrap", gap: "6px 14px" } : {}}>
        {stackedSeries ? (
          // Show layers in reverse (top → bottom) so most prominent comes first
          [...(stackedSeries)].reverse().map((layer) => (
            <span key={layer.key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5 }}>
              <span style={{ width: 11, height: 11, borderRadius: 3, background: layer.color, display: "inline-block", flexShrink: 0 }} />
              {layer.label}
            </span>
          ))
        ) : (
          <>
            <span className="dot" style={{ background: lineColor }} />
            Your current path
            {optVals && (
              <>
                <span style={{ marginLeft: 14, border: "2px dashed #2E8B57", width: 10, height: 10, display: "inline-block", borderRadius: "50%", verticalAlign: "middle", flexShrink: 0 }} />
                <span style={{ marginLeft: 4 }}>Optimal strategy (reinvest tax refund)</span>
              </>
            )}
          </>
        )}
      </div>

      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        className="pp-chartfocus"
        tabIndex={0}
        role="img"
        aria-label={`Projected growth chart. Use arrow keys to step through years. ${hoverTotal != null ? `Age ${startAge + hover}: ${fmtMoney(hoverTotal)} total` : ""}`}
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

          {/* Grid */}
          {gy.map((v, i) => (
            <g key={i}>
              <line x1={PL} y1={Y(v)} x2={W - PR} y2={Y(v)} stroke="rgba(34,19,48,0.10)" strokeWidth="1" />
              <text x={PL - 8} y={Y(v) + 4} textAnchor="end" fontSize="11" fill="#6E5E78" fontFamily="Hanken Grotesk">{fmtShort(v)}</text>
            </g>
          ))}

          {/* Event markers */}
          {showHome && (
            <g>
              <line x1={X(homeIdx)} y1={PT} x2={X(homeIdx)} y2={PT + plotH} stroke="#B0822B" strokeWidth="1.5" strokeDasharray="4 4" />
              <text x={X(homeIdx)} y={labelY("home")} textAnchor="middle" fontSize="10.5" fill="#B0822B" fontWeight="700" fontFamily="Hanken Grotesk">
                Home · age {homeAge}
              </text>
            </g>
          )}
          {showFhsa && (
            <g>
              <line x1={X(fhsaIdx)} y1={PT} x2={X(fhsaIdx)} y2={PT + plotH} stroke="#A8456A" strokeWidth="1.5" strokeDasharray="2 3" />
              <text x={X(fhsaIdx)} y={labelY("fhsa")} textAnchor="middle" fontSize="10.5" fill="#A8456A" fontWeight="700" fontFamily="Hanken Grotesk">
                FHSA closes
              </text>
            </g>
          )}

          {/* ── STACKED areas ─────────────────────────────────────────────── */}
          {stackedLayers ? (
            <>
              {stackedLayers.map((layer) => {
                const pts = [
                  ...Array.from({ length: years + 1 }, (_, y) => `${X(y)},${Y(layer.top[y])}`),
                  ...Array.from({ length: years + 1 }, (_, i) => `${X(years - i)},${Y(layer.bottom[years - i])}`),
                ].join(" ");
                return (
                  <polygon key={layer.key} points={pts} fill={layer.color} fillOpacity="0.88"
                    stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" strokeLinejoin="round" />
                );
              })}
              {/* Subtle total outline */}
              <polyline
                points={totalSeries.map((v, y) => `${X(y)},${Y(v)}`).join(" ")}
                fill="none" stroke="rgba(34,19,48,0.28)" strokeWidth="1.2"
                strokeLinejoin="round" strokeLinecap="round"
              />
            </>
          ) : (
            /* ── SINGLE LINE ─────────────────────────────────────────────── */
            <>
              <polygon points={areaPts} fill="url(#ppArea)" />
              {optVals && (
                <polyline
                  points={optVals.map((v, y) => `${X(y)},${Y(v)}`).join(" ")}
                  fill="none" stroke="#2E8B57" strokeWidth="2" strokeDasharray="7 4"
                  strokeLinejoin="round" strokeLinecap="round" opacity="0.75"
                />
              )}
              <polyline points={linePts} fill="none" stroke={lineColor} strokeWidth="2.8"
                strokeLinejoin="round" strokeLinecap="round" />
              <circle cx={X(years)} cy={Y(vals[years])} r="4" fill={lineColor} />
              {optVals && <circle cx={X(years)} cy={Y(optVals[years])} r="4" fill="#2E8B57" />}
            </>
          )}

          {/* Milestone dots (reference total series for y position) */}
          {visibleMilestones.map((m) => {
            const vRef = stackedLayers ? totalSeries : vals;
            const vIdx = Math.min(m.year, vRef.length - 1);
            const cx = X(m.year), cy = Y(vRef[vIdx]);
            return (
              <g key={m.year}>
                <circle cx={cx} cy={cy} r="9" fill={m.color} fillOpacity="0.15" />
                <circle cx={cx} cy={cy} r="4.5" fill={m.color} />
                <text x={cx} y={labelY(`m${m.year}`)} textAnchor="middle" fontSize="10.5"
                  fill={m.color} fontWeight="700" fontFamily="Hanken Grotesk">{m.label}</text>
              </g>
            );
          })}

          {/* Hover crosshair */}
          {hover != null && hoverTotal != null && (
            <g>
              <line x1={X(hover)} y1={PT} x2={X(hover)} y2={PT + plotH}
                stroke="rgba(34,19,48,0.22)" strokeWidth="1" />
              <circle cx={X(hover)} cy={Y(hoverTotal)} r="5.5"
                fill="#fff" stroke={stackedLayers ? "rgba(34,19,48,0.45)" : lineColor} strokeWidth="2.5" />
            </g>
          )}

          {/* X-axis ticks */}
          {xticks.map((t) => (
            <text key={t} x={X(t)} y={H - 10} textAnchor="middle" fontSize="11" fill="#6E5E78" fontFamily="Hanken Grotesk">
              {t === 0 ? "Now" : `+${t}y`}
            </text>
          ))}
        </svg>

        {/* Tooltip */}
        {hover != null && hoverTotal != null && (
          <div className="pp-tip" style={tipStyle}>
            <div className="ty">
              {hover === 0 ? "Now" : `+${hover} ${hover === 1 ? "year" : "years"}`}
              {startAge > 0 ? ` · age ${startAge + hover}` : ""}
            </div>

            {stackedLayers ? (
              // Stacked tooltip: show each account value (reversed so top account is first)
              <>
                {[...stackedLayers].reverse()
                  .filter((l) => (l.top[hover] - l.bottom[hover]) > 50)
                  .map((l) => (
                    <div key={l.key} className="tr">
                      <i style={{ background: l.color, borderRadius: 2 }} />
                      <span style={{ fontSize: 10.5, opacity: 0.85 }}>{l.label}:</span>
                      {" "}{fmtMoney(l.top[hover] - l.bottom[hover])}
                    </div>
                  ))}
                <div className="tr" style={{ borderTop: "1px solid rgba(255,255,255,0.18)", marginTop: 3, paddingTop: 3, fontWeight: 700 }}>
                  <i style={{ background: "rgba(255,255,255,0.55)", borderRadius: 2 }} />
                  Total: {fmtMoney(hoverTotal)}
                </div>
              </>
            ) : (
              // Single-line tooltip
              <>
                <div className="tr"><i style={{ background: lineColor }} /> {fmtMoney(vals[hover])}</div>
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
              </>
            )}
          </div>
        )}
      </div>

      <p className="pp-chartkey">
        Use ← → arrow keys to step through years{stackedSeries ? " · hover to see breakdown by account" : ""}
      </p>
    </div>
  );
}
