// Canadian reference benchmarks — for "am I doing better than average?" context.
// These are population reference points, not targets. Sources are cited so a skeptical
// user (or advisor) can check them. Net-worth figures include home equity and pensions,
// so they are NOT directly comparable to the investment balances this tool projects —
// we present them as context, never as a verdict.

// Median household net worth by age of the major income earner.
// SOURCE: Statistics Canada, Survey of Financial Security, 2019 (Table 11-10-0049-01),
// median net worth (assets minus debts), rounded.
export const NET_WORTH_BY_AGE = [
  { maxAge: 34, median: 48800,  label: "under 35" },
  { maxAge: 44, median: 234400, label: "35–44" },
  { maxAge: 54, median: 521100, label: "45–54" },
  { maxAge: 64, median: 690000, label: "55–64" },
  { maxAge: 200, median: 543200, label: "65+" },
];

export function netWorthBenchmark(age) {
  const a = Number(age) || 0;
  return NET_WORTH_BY_AGE.find((b) => a <= b.maxAge) || NET_WORTH_BY_AGE[NET_WORTH_BY_AGE.length - 1];
}

// Personal savings-rate reference points (share of gross income saved/invested per year).
// The household savings rate hovers in the mid-single digits; personal-finance guidance
// commonly frames 15%+ as a strong long-term rate and 20%+ as aggressive.
// SOURCE: Statistics Canada household saving rate (Table 36-10-0112-01) for the low end;
// 15–20% is a widely-used planning convention, not an official statistic.
export const SAVINGS_RATE = {
  typical: 0.06,   // roughly the household average in recent years
  solid: 0.15,     // a strong personal rate
  strong: 0.20,    // aggressive
};

export function savingsRateVerdict(rate) {
  if (rate >= SAVINGS_RATE.strong) return { tier: "strong", label: "Well ahead", color: "var(--green)" };
  if (rate >= SAVINGS_RATE.solid)  return { tier: "solid",  label: "Ahead of most", color: "var(--green)" };
  if (rate >= SAVINGS_RATE.typical) return { tier: "typical", label: "About average", color: "var(--gold)" };
  return { tier: "below", label: "Room to grow", color: "var(--gold)" };
}
