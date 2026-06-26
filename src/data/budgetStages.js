// Life-stage budget templates — the single source of truth for the Budget tab.
//
// These mirror the "Purple_Portfolio_Budget_v5_final.xlsx" template exactly:
// the CHOOSE() formulas on the "2025 Budget" sheet and the row labels documented
// on the "Claude — Dev Instructions" sheet. Switching life stage is a TEMPLATE
// SWAP — the row labels *and* row counts change per stage.

// Order matters: it matches the CHOOSE() index (1–5) in the source workbook.
export const STAGES = [
  {
    key: "student",
    name: "Student",
    income: ["Part-time / OSAP", "Bursaries / Grants", "Other Income"],
    expenses: ["Rent / Housing", "Groceries", "Phone / Internet", "Transportation", "Tuition / Books", "Student Loan Payment", "Entertainment"],
    investments: ["TFSA", "FHSA", "Emergency Fund"],
  },
  {
    key: "young_pro",
    name: "Young Professional",
    income: ["Salary / Wages", "Side Income / Freelance", "Investment Income", "Other Income"],
    expenses: ["Rent / Mortgage", "Groceries", "Transportation", "Phone / Internet", "Dining / Social", "Subscriptions", "Health / Fitness", "Savings"],
    investments: ["TFSA", "FHSA", "RRSP", "Emergency Fund"],
  },
  {
    key: "family",
    name: "Family",
    income: ["Primary Salary", "Partner Salary", "Child Benefits (CCB)", "Investment Income", "Other"],
    expenses: ["Mortgage / Rent", "Childcare / School", "Groceries", "Transportation", "Utilities", "Insurance (Life/Health)", "Travel / Activities", "Subscriptions", "Healthcare"],
    investments: ["RRSP", "TFSA", "RESP", "Non-Registered", "Emergency Fund"],
  },
  {
    key: "mid_career",
    name: "Mid-Career",
    income: ["Primary Salary", "Bonus / Commission", "Rental Income", "Investment / Dividends", "Business Income", "Other"],
    expenses: ["Mortgage", "Property Tax", "Travel / Leisure", "Insurance (Life/Property)", "Healthcare / Dental", "Dining / Entertainment", "Subscriptions", "Children's Education", "Charitable Giving"],
    investments: ["RRSP", "TFSA", "Non-Registered", "Real Estate", "Business Investments", "Emergency Fund"],
  },
  {
    key: "retirement",
    name: "Retirement",
    income: ["CPP", "OAS / GIS", "RRIF Withdrawals", "Investment Dividends / Income", "Pension", "Other"],
    expenses: ["Housing / Maintenance", "Healthcare / Prescriptions", "Travel / Leisure", "Groceries", "Utilities", "Insurance", "Estate / Legal Fees", "Charitable Giving"],
    investments: ["RRIF", "TFSA", "Non-Registered", "Charitable Giving"],
  },
];

export const STAGE_BY_KEY = Object.fromEntries(STAGES.map((s) => [s.key, s]));

// Options for the life-stage <select> — [value, label] pairs (matches SelectField).
export const STAGE_OPTIONS = STAGES.map((s) => [s.key, s.name]);

// Age → life stage. Same age bands as the workbook's "Future Year" auto-stage logic:
// <25 Student · <35 Young Professional · <50 Family · <65 Mid-Career · else Retirement.
export function stageFromAge(age) {
  const a = Number(age) || 0;
  if (a <= 0) return null;
  if (a < 25) return "student";
  if (a < 35) return "young_pro";
  if (a < 50) return "family";
  if (a < 65) return "mid_career";
  return "retirement";
}

// Plain-language tooltips for registered-account row labels (spec: UX notes).
export const ACCOUNT_TIPS = {
  "TFSA": "Tax-Free Savings Account — growth and withdrawals are never taxed.",
  "FHSA": "First Home Savings Account — tax deduction now, tax-free for a first home.",
  "RRSP": "Registered Retirement Savings Plan — deduct now, taxed on withdrawal.",
  "RESP": "Registered Education Savings Plan — tax-sheltered, earns the CESG grant.",
  "RRIF": "Registered Retirement Income Fund — a drawn-down RRSP with mandatory withdrawals.",
  "Non-Registered": "Taxable account — no contribution limit, growth taxed yearly and on sale.",
  "Emergency Fund": "A cash cushion of 3–6 months of essentials, kept separate from investing.",
};

// "Life Stage Guide" reference sheet — mirrors sheet 3 of the source workbook.
// Used by the Excel export and the in-app reference panel.
export const LIFE_STAGE_GUIDE = [
  { stage: "Student",            income: ["Part-time work", "OSAP / student loans", "Bursaries & grants"],   expenses: ["Rent, groceries, phone", "Tuition & books", "Student loan payments"], accounts: ["TFSA, FHSA", "Emergency fund"] },
  { stage: "Young Professional", income: ["Salary / wages", "Side income / freelance", "Investment income"], expenses: ["Rent/mortgage, transport", "Dining & subscriptions", "Health & fitness"], accounts: ["TFSA, FHSA, RRSP"] },
  { stage: "Family",             income: ["Dual income", "Child benefits (CCB)", "Investment income"],       expenses: ["Mortgage, childcare", "Utilities, travel", "Insurance"],            accounts: ["RRSP, TFSA, RESP", "Non-registered"] },
  { stage: "Mid-Career",         income: ["Peak salary & bonuses", "Rental / business income", "Investment dividends"], expenses: ["Mortgage, property tax", "Travel, insurance", "Life insurance premium"], accounts: ["RRSP max, TFSA", "Non-reg, real estate", "Business investments"] },
  { stage: "Retirement",         income: ["CPP, OAS, pension", "RRIF withdrawals", "Investment dividends"],  expenses: ["Housing, healthcare", "Travel & leisure", "Estate / legal fees"],   accounts: ["RRIF, TFSA", "Non-registered", "Charitable giving"] },
];
