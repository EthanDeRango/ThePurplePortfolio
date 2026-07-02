export default function Orb() {
  const pts = [[40,260],[100,225],[150,235],[210,160],[270,180],[340,90]];
  const lineStr = pts.map((p) => p.join(",")).join(" ");
  return (
    <div className="pp-orb">
      <svg viewBox="0 0 400 400" width="100%" aria-hidden="true">
        <defs>
          <radialGradient id="g1" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#7C4DC4" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#7C4DC4" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="orbLine" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#5B3A9E" />
            <stop offset="100%" stopColor="#B0822B" />
          </linearGradient>
          <linearGradient id="orbFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B0822B" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#B0822B" stopOpacity="0" />
          </linearGradient>
          <filter id="orbGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>
        <circle cx="200" cy="195" r="190" fill="url(#g1)" />
        {[170, 130, 92, 56].map((r, i) => (
          <circle key={r} cx="200" cy="195" r={r} fill="none" stroke="#34185A" strokeOpacity={0.10 + i * 0.04} strokeWidth="1.2" />
        ))}
        <polygon points={`40,320 ${lineStr} 340,320`} fill="url(#orbFill)" />
        <polyline points={lineStr} fill="none" stroke="url(#orbLine)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        {pts.slice(0, -1).map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r="3.4" fill="#34185A" />
        ))}
        <circle cx="340" cy="90" r="11" fill="#B0822B" fillOpacity="0.35" filter="url(#orbGlow)" />
        <circle cx="340" cy="90" r="5.5" fill="#fff" />
        <circle cx="340" cy="90" r="4.5" fill="#B0822B" />
        <circle cx="340" cy="90" r="9" fill="none" stroke="#B0822B" strokeWidth="1.5" strokeOpacity="0.5" />
      </svg>
    </div>
  );
}
