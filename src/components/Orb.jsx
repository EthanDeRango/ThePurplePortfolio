export default function Orb() {
  return (
    <div className="pp-orb">
      <svg viewBox="0 0 400 400" width="100%" aria-hidden="true">
        <defs>
          <radialGradient id="g1" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#7C4DC4" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#7C4DC4" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="200" cy="195" r="190" fill="url(#g1)" />
        {[170, 130, 92, 56].map((r, i) => (
          <circle key={r} cx="200" cy="195" r={r} fill="none" stroke="#34185A" strokeOpacity={0.10 + i * 0.04} strokeWidth="1.2" />
        ))}
        <polyline points="40,260 100,225 150,235 210,160 270,180 340,90" fill="none" stroke="#B0822B" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        {[[40,260],[100,225],[150,235],[210,160],[270,180],[340,90]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r="3.4" fill="#34185A" />
        ))}
        <circle cx="340" cy="90" r="6" fill="none" stroke="#7C4DC4" strokeWidth="2" />
      </svg>
    </div>
  );
}
