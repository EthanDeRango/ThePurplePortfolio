export default function Mark({ size = 34 }) {
  return (
    <svg className="pp-mark" viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
      <rect x="1" y="1" width="38" height="38" rx="10" fill="#34185A" />
      <path d="M12 28 V14 h7 a5 5 0 0 1 0 10 h-7" fill="none" stroke="#CDA052" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 28 l5 -5 l4 3 l7 -9" fill="none" stroke="#B07BE0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <circle cx="29" cy="17" r="1.7" fill="#B07BE0" />
    </svg>
  );
}
