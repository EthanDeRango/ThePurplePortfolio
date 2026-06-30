// App-level constants (non-tax, non-React)

export const LADDER = [
  { t: "Starter emergency fund",        d: "A small cushion ($1,000–$2,000) so a surprise doesn't become debt." },
  { t: "Capture any employer RRSP match", d: "Free money — contribute enough to get the full match first." },
  { t: "Pay down high-interest debt",    d: "Clearing 19%+ debt is a guaranteed, tax-free return." },
  { t: "Full emergency fund",            d: "Top up to 3–6 months of essential expenses." },
  { t: "Fill tax-advantaged room",       d: "FHSA / TFSA / RRSP, in the order that fits your goals and bracket." },
  { t: "Non-registered investing",       d: "Once registered room is full, taxable accounts take over." },
];

export const PLAN_DEFAULTS = {
  risk: "moderate", customRate: 8, includeMER: false, customFee: 0.5, retAge: 65,
  buyHome: false, province: "ON", employmentType: "employed", lumpSum: "", contribMode: "flat",
  months: ["","","","","","","","","","","",""], asOf: null, homePrice: "", livingExpenses: "",
  incomeStability: "variable", goals: ["retirement"], employerMatch: "", highInterestDebt: "",
  employerMatchMode: "amount", employerMatchPct: "", // RRSP match as $/yr or % of pay
  bNonreg: "", bLocked: "", emergencyStatus: "none", emergencySaved: "", retTaxRate: "",
  retSpend: "", inflationRate: 2, customGoals: [],
  // Account selection (null = not yet set; infer from existing balances for backward compat)
  openAccounts: null,
  // New account balances
  bRrif: "", bPensionDC: "", bDpsp: "", bResp: "", bRdsp: "",
  // RESP — array of per-child entries (replaces bResp/respBeneficiaryAge for education goal)
  resps: [],
  // Account-specific details (legacy single-RESP fields kept for backward compat)
  respBeneficiaryAge: "",
  pensionDCEmployerPct: "",
  pensionDBMonthly: "", pensionDBStartAge: "",
  // Home purchase projection assumptions (optional overrides)
  mortgageRate: "", homeAppreciation: "",
  // Buying with a partner: split the down payment, track only your share
  homeWithPartner: false, homeYourShare: 50,
  // Life events — future changes to savings/income at a given age.
  // [{ id, age, type: 'invest-more'|'invest-less'|'income', amount, label }]
  lifeEvents: [],
  // Incorporated business owner: how they pay themselves (personal-side modeling only)
  payMix: "salary", // 'salary' | 'dividends' | 'mix'
  dividendType: "noneligible", // 'eligible' | 'noneligible' — small-biz dividends are usually non-eligible
  salaryShare: 50, // when payMix === 'mix', % of income taken as salary
};

export const PLAN_STORAGE_KEY = "pp-plan-v1";
