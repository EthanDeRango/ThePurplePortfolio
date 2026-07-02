import { useState } from "react";
import { fmtMoney, fmtShort } from "../lib/calculations.js";

// Round a value up to a clean axis maximum (1/2/5 × 10ⁿ) for tidy gridlines.
function niceCeil(v) {
  if (v <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / mag;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * mag;
}

// stackedSeries: [{key, label, color, values: number[]}] — when provided, renders stacked
// areas instead of a single line. Each layer stacks on top of the previous one.
export default function GrowthChart({
  series, optSeries, contribSeries, years, startAge,
  homeIdx, homeAge, fhsaIdx, color, inflation, inflRate = 0.02,
  afterTax, retMarginal, rrspShare,
  milestones,
  stackedSeries,
  noContribSeries,
}) {
  const lineColor = color || "var(--violet)";
  const [hover, setHover] = useState(null);

  // ── Data (full horizon) ───────────────────────────────────────────────────────
  const taxFactor = afterTax ? (1 - (retMarginal || 0) * (rrspShare == null ? 1 : rrspShare)) : 1;
  const adj = (v, y) => { let x = v * taxFactor; if (inflation) x /= Math.pow(1 + inflRate, y); return x; };
  const vals = (series || [0]).map((v, y) => adj(v, y));
  const optVals = (optSeries && !stackedSeries) ? optSeries.map((v, y) => adj(v, y)) : null;
  const ncVals = noContribSeries ? noContribSeries.map((v, y) => adj(v, y)) : null;
  const showNoContrib = !!(ncVals && ncVals[0] > 0);

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

  // ── Horizon window — keep the near term readable; full journey on demand ───────
  const presets = [...new Set([Math.min(10, years), Math.min(25, years), years])]
    .filter((v) => v >= 1).sort((a, b) => a - b);
  const [view, setView] = useState(years > 12 ? presets[0] : years);
  const vYears = Math.min(Math.max(1, view), years);

  // ── Geometry (scaled to the visible window only) ──────────────────────────────
  // PT reserves a label band above the plot so milestone titles never sit on the curve.
  const W = 720, H = 314, PL = 54, PR = 70, PT = 50, PB = 30;
  const plotW = W - PL - PR, plotH = H - PT - PB;
  const winMax = niceCeil(Math.max(
    1,
    ...totalSeries.slice(0, vYears + 1),
    ...(optVals ? optVals.slice(0, vYears + 1) : []),
  ));
  const X = (y) => PL + (vYears === 0 ? 0 : (y / vYears) * plotW);
  const Y = (v) => PT + plotH - (Math.min(v, winMax) / winMax) * plotH;
  const gy = [0, 0.25, 0.5, 0.75, 1].map((f) => f * winMax);
  const xticks = [...new Set([0, Math.round(vYears / 2), vYears])].filter((t) => t >= 0 && t <= vYears).sort((a, b) => a - b);

  const seg = (arr) => arr.slice(0, vYears + 1).map((v, y) => `${X(y)},${Y(v)}`).join(" ");

  const showFhsa = fhsaIdx != null && fhsaIdx >= 0 && fhsaIdx <= vYears;
  const showHome = homeIdx != null && homeIdx >= 0 && homeIdx <= vYears;
  const visibleMilestones = (milestones || []).filter((m) => m.year >= 0 && m.year <= vYears);

  // ── Interaction ───────────────────────────────────────────────────────────────
  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const fx = (cx / rect.width) * W;
    setHover(Math.max(0, Math.min(vYears, Math.round(((fx - PL) / plotW) * vYears))));
  };
  const onKey = (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); setHover((h) => Math.min(vYears, (h ?? 0) + 1)); }
    if (e.key === "ArrowLeft")  { e.preventDefault(); setHover((h) => Math.max(0, (h ?? vYears) - 1)); }
    if (e.key === "Escape") setHover(null);
  };

  // ── Fixed readout (defaults to the end of the view; follows the cursor on hover) ─
  const rIdx = hover != null ? hover : vYears;
  const rTotal = totalSeries[rIdx];
  const rAge = startAge > 0 ? startAge + rIdx : null;
  const rWhen = rIdx === 0 ? "Today" : `+${rIdx} ${rIdx === 1 ? "year" : "years"}`;
  const rBreakdown = stackedLayers
    ? [...stackedLayers].reverse()
        .map((l) => ({ label: l.label, color: l.color, val: l.top[rIdx] - l.bottom[rIdx] }))
        .filter((b) => b.val > 50)
    : (contribSeries && contribSeries[rIdx] != null
        ? (() => {
            const inv = contribSeries[rIdx] * taxFactor / (inflation ? Math.pow(1 + inflRate, rIdx) : 1);
            return [
              { label: "Invested", color: "#8E7AA0", val: inv },
              { label: "Growth", color: lineColor, val: Math.max(0, vals[rIdx] - inv) },
            ];
          })()
        : []);
  const retTotal = totalSeries[years];
  const retAge = startAge > 0 ? startAge + years : null;

  // Milestone titles live in the label band; greedy row assignment keeps them from
  // overlapping (two share a row only when their widths genuinely won't collide).
  const mYearVal = (yr) => (stackedLayers ? totalSeries : vals)[Math.min(yr, totalSeries.length - 1)];
  const LABEL_ROWS = [13, 28, 43];
  const CHAR_PX = 5.6; // ~px per char at the 10px label size
  const markerList = [
    ...(showHome ? [{ key: "home", year: homeIdx, label: `Home · age ${homeAge}`, color: "#B0822B" }] : []),
    ...(showFhsa ? [{ key: "fhsa", year: fhsaIdx, label: "FHSA closes", color: "#A8456A" }] : []),
    ...visibleMilestones.map((m) => ({ key: `m${m.year}`, year: m.year, label: m.label, color: m.color })),
  ].sort((a, b) => a.year - b.year);
  const halfW = (mk) => Math.ceil((mk.label || "").length * CHAR_PX / 2) + 7;
  const placed = [];
  markerList.forEach((mk) => {
    mk.x = X(mk.year);
    const taken = placed.filter((p) => Math.abs(p.x - mk.x) < halfW(mk) + halfW(p)).map((p) => p.rowIdx);
    let rowIdx = 0;
    while (taken.includes(rowIdx) && rowIdx < LABEL_ROWS.length - 1) rowIdx++;
    mk.rowIdx = rowIdx;
    mk.labelY = LABEL_ROWS[rowIdx];
    placed.push(mk);
  });

  return (
    <div className="pp-chartwrap">
      {/* Header: legend + horizon toggle */}
      <div className="pp-chart-head">
        <div className="pp-chartlegend" style={stackedSeries ? { flexWrap: "wrap", gap: "5px 12px" } : {}}>
          {stackedSeries ? (
            <>
              {[...stackedSeries].reverse().map((layer) => (
                <span key={layer.key} className="pp-leg-item">
                  <span style={{ width: 11, height: 11, borderRadius: 3, background: layer.color, display: "inline-block", flexShrink: 0 }} />
                  {layer.label}
                </span>
              ))}
              {showNoContrib && (
                <span className="pp-leg-item" style={{ opacity: 0.7 }}>
                  <svg width="14" height="8" aria-hidden="true"><line x1="0" y1="4" x2="14" y2="4" stroke="rgba(110,94,120,0.8)" strokeWidth="1.5" strokeDasharray="3 2.5" /></svg>
                  If you stopped saving today
                </span>
              )}
            </>
          ) : (
            <>
              <span className="pp-leg-item"><span className="dot" style={{ background: lineColor }} /> Your path</span>
              {optVals && <span className="pp-leg-item"><span style={{ border: "2px dashed #2E8B57", width: 10, height: 10, display: "inline-block", borderRadius: "50%" }} /> Reinvest tax refund</span>}
              {showNoContrib && <span className="pp-leg-item" style={{ opacity: 0.7 }}><svg width="14" height="8" aria-hidden="true"><line x1="0" y1="4" x2="14" y2="4" stroke="rgba(110,94,120,0.8)" strokeWidth="1.5" strokeDasharray="3 2.5" /></svg> If you stopped saving today</span>}
            </>
          )}
        </div>
        {presets.length > 1 && (
          <div className="pp-chart-horizon" role="group" aria-label="Time horizon">
            {presets.map((p) => (
              <button key={p} type="button" className={view === p ? "on" : ""}
                onClick={() => { setView(p); setHover(null); }}
                aria-pressed={view === p}>
                {p === years ? (retAge ? `To ${retAge}` : "Full") : `${p}y`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fixed readout — always visible, updates as you scrub; never covers the plot */}
      <div className="pp-chart-readout" aria-live="polite">
        <div className="pp-chart-readout-main">
          <span className="ro-when">{rWhen}{rAge ? ` · age ${rAge}` : ""}{hover == null ? " (end of view)" : ""}</span>
          <span className="ro-total">{fmtMoney(rTotal)}</span>
        </div>
        <div className="pp-chart-readout-break">
          {rBreakdown.map((b) => (
            <span key={b.label} className="ro-chip"><i style={{ background: b.color }} />{b.label} {fmtMoney(b.val)}</span>
          ))}
          {showNoContrib && ncVals[rIdx] != null && rTotal > ncVals[rIdx] + 100 && (
            <span className="ro-chip muted"><i style={{ background: "rgba(110,94,120,0.6)" }} />If you stopped saving today: {fmtMoney(ncVals[rIdx])}</span>
          )}
          {vYears < years && retTotal > rTotal && (
            <span className="ro-chip gold">→ {fmtMoney(retTotal)} by {retAge}</span>
          )}
        </div>
      </div>

      <div
        className="pp-chartfocus"
        tabIndex={0}
        role="img"
        aria-label={`Projected growth to ${vYears} years. Use arrow keys to step through years. ${rTotal != null ? `${rWhen}: ${fmtMoney(rTotal)}` : ""}`}
        onKeyDown={onKey}
        onMouseLeave={() => setHover(null)}
        onBlur={() => setHover(null)}
        style={{ outline: "none" }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", touchAction: "none", cursor: "crosshair" }}
          aria-hidden="true" onMouseMove={onMove} onClick={onMove} onTouchStart={onMove} onTouchMove={onMove}>
          <defs>
            <linearGradient id="ppArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.24" />
              <stop offset="55%" stopColor={lineColor} stopOpacity="0.07" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
            </linearGradient>
            <filter id="ppLineGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodColor={stackedLayers ? "#2E1452" : lineColor} floodOpacity="0.3" />
            </filter>
            {stackedLayers && stackedLayers.map((layer) => (
              <linearGradient key={`g-${layer.key}`} id={`ppLayer-${layer.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={layer.color} stopOpacity="1" />
                <stop offset="100%" stopColor={layer.color} stopOpacity="0.78" />
              </linearGradient>
            ))}
          </defs>

          {/* Gridlines + y labels */}
          {gy.map((v, i) => (
            <g key={i}>
              <line x1={PL} y1={Y(v)} x2={W - PR} y2={Y(v)} stroke="rgba(34,19,48,0.09)" strokeWidth="1" />
              <text x={PL - 8} y={Y(v) + 4} textAnchor="end" fontSize="11" fill="#8E7AA0" fontFamily="Hanken Grotesk">{fmtShort(v)}</text>
            </g>
          ))}

          {/* Milestone connector lines — from the label band down to the marker dot */}
          {markerList.map((mk) => (
            <line key={"gl" + mk.key} x1={mk.x} y1={mk.labelY + 4} x2={mk.x} y2={Y(mYearVal(mk.year))}
              stroke={mk.color} strokeOpacity="0.4" strokeWidth="1.25" strokeDasharray="4 4" />
          ))}

          {/* Areas / line */}
          {stackedLayers ? (
            <>
              {stackedLayers.map((layer) => {
                const pts = [
                  ...Array.from({ length: vYears + 1 }, (_, y) => `${X(y)},${Y(layer.top[y])}`),
                  ...Array.from({ length: vYears + 1 }, (_, i) => `${X(vYears - i)},${Y(layer.bottom[vYears - i])}`),
                ].join(" ");
                return <polygon key={layer.key} points={pts} fill={`url(#ppLayer-${layer.key})`}
                  stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" strokeLinejoin="round" />;
              })}
              {showNoContrib && ncVals && (
                <polyline points={seg(ncVals)} fill="none" stroke="rgba(110,94,120,0.6)" strokeWidth="1.8"
                  strokeDasharray="5 4" strokeLinejoin="round" strokeLinecap="round" />
              )}
              <polyline points={seg(totalSeries)} fill="none" stroke="rgba(34,19,48,0.35)" strokeWidth="1.4"
                strokeLinejoin="round" strokeLinecap="round" filter="url(#ppLineGlow)" />
            </>
          ) : (
            <>
              <polygon points={`${PL},${PT + plotH} ${seg(vals)} ${X(vYears)},${PT + plotH}`} fill="url(#ppArea)" />
              {showNoContrib && ncVals && (
                <polyline points={seg(ncVals)} fill="none" stroke="rgba(110,94,120,0.5)" strokeWidth="1.5"
                  strokeDasharray="5 4" strokeLinejoin="round" strokeLinecap="round" />
              )}
              {optVals && (
                <polyline points={seg(optVals)} fill="none" stroke="#2E8B57" strokeWidth="2" strokeDasharray="7 4"
                  strokeLinejoin="round" strokeLinecap="round" opacity="0.75" />
              )}
              <polyline points={seg(vals)} fill="none" stroke={lineColor} strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" filter="url(#ppLineGlow)" />
            </>
          )}

          {/* Endpoint dot + direct value label */}
          {(() => {
            const ev = totalSeries[vYears];
            const ey = Y(ev);
            return (
              <g>
                <circle cx={X(vYears)} cy={ey} r="9" fill={stackedLayers ? "#3A2168" : lineColor} fillOpacity="0.14" />
                <circle cx={X(vYears)} cy={ey} r="4.5" fill="#fff" />
                <circle cx={X(vYears)} cy={ey} r="4" fill={stackedLayers ? "#3A2168" : lineColor} />
                <text x={X(vYears) + 8} y={ey - 4} fontSize="12" fontWeight="800" fill="var(--plum)" fontFamily="Hanken Grotesk">{fmtShort(ev)}</text>
                {rAge != null && <text x={X(vYears) + 8} y={ey + 9} fontSize="9.5" fill="#8E7AA0" fontFamily="Hanken Grotesk">age {startAge + vYears}</text>}
              </g>
            );
          })()}

          {/* Milestone dots (on the curve) + titles (in the label band, no overlap) */}
          {markerList.map((mk) => {
            const cx = mk.x, cy = Y(mYearVal(mk.year));
            return (
              <g key={mk.key}>
                <circle cx={cx} cy={cy} r="9" fill={mk.color} fillOpacity="0.14" />
                <circle cx={cx} cy={cy} r="4.5" fill={mk.color} />
                <text x={cx} y={mk.labelY} textAnchor="middle" fontSize="10.5" fontWeight="700" fill={mk.color} fontFamily="Hanken Grotesk">{mk.label}</text>
              </g>
            );
          })}

          {/* Hover crosshair */}
          {hover != null && (
            <g>
              <line x1={X(hover)} y1={PT} x2={X(hover)} y2={PT + plotH} stroke="rgba(34,19,48,0.28)" strokeWidth="1" />
              <circle cx={X(hover)} cy={Y(totalSeries[hover])} r="5.5" fill="#fff" stroke={stackedLayers ? "#3A2168" : lineColor} strokeWidth="2.5" />
            </g>
          )}

          {/* "Now" starting value — drawn last, over a white halo so the curve never hides it */}
          {(() => {
            const label = `now ${fmtShort(totalSeries[0])}`;
            const ny = Math.min(Y(totalSeries[0]) - 10, PT + plotH - 8);
            const w = label.length * 6 + 10;
            return (
              <g>
                <rect x={PL + 1} y={ny - 11} width={w} height={15} rx="4" fill="#fff" fillOpacity="0.85" />
                <text x={PL + 6} y={ny} fontSize="10.5" fontWeight="700" fill="#5B3A9E" fontFamily="Hanken Grotesk">{label}</text>
              </g>
            );
          })()}

          {/* X ticks */}
          {xticks.map((t) => (
            <text key={t} x={X(t)} y={H - 9} textAnchor="middle" fontSize="11" fill="#8E7AA0" fontFamily="Hanken Grotesk">
              {t === 0 ? "Now" : `+${t}y`}
            </text>
          ))}
        </svg>
      </div>

      <p className="pp-chartkey">
        Scrub or use ← → to read any year · the box above updates{presets.length > 1 ? " · switch the time range top-right" : ""}
      </p>
    </div>
  );
}
