// TAX CONFIG — verified for 2026 (see SOURCE notes).
// Update this object once a year; the rest of the app is data-driven.

export const TAX_YEAR = 2026;
export const INF = Infinity;

export const TAX_CONFIG = {
  year: 2026,
  // SOURCE: CRA / KPMG "Federal and Provincial/Territorial Income Tax Rates 2026"
  federal: {
    brackets: [
      { to: 58523, rate: 0.14 },
      { to: 117045, rate: 0.205 },
      { to: 181440, rate: 0.26 },
      { to: 258482, rate: 0.29 },
      { to: INF, rate: 0.33 },
    ],
    bpaBase: 14829, bpaMax: 16452,
    bpaPhaseStart: 181440, bpaPhaseEnd: 258482,
    lowRate: 0.14, cea: 1501, qcAbatement: 0.165,
  },
  // SOURCE: KPMG 2026 brackets + Narcity/CRA 2026 BPAs by province
  prov: {
    AB: { name: "Alberta", brackets: [{to:61200,rate:.08},{to:154259,rate:.10},{to:185111,rate:.12},{to:246813,rate:.13},{to:370220,rate:.14},{to:INF,rate:.15}], bpa: 22769, low: .08 },
    BC: { name: "British Columbia", brackets: [{to:50363,rate:.0506},{to:100728,rate:.077},{to:115648,rate:.105},{to:140430,rate:.1229},{to:190405,rate:.147},{to:265545,rate:.168},{to:INF,rate:.205}], bpa: 13216, low: .0506 },
    MB: { name: "Manitoba", brackets: [{to:47000,rate:.108},{to:100000,rate:.1275},{to:INF,rate:.174}], bpa: 15780, low: .108 },
    NB: { name: "New Brunswick", brackets: [{to:52333,rate:.094},{to:104666,rate:.14},{to:193861,rate:.16},{to:INF,rate:.195}], bpa: 13664, low: .094 },
    NL: { name: "Newfoundland & Labrador", brackets: [{to:44678,rate:.087},{to:89354,rate:.145},{to:159528,rate:.158},{to:223340,rate:.178},{to:285319,rate:.198},{to:570638,rate:.208},{to:1141275,rate:.213},{to:INF,rate:.218}], bpa: 11188, low: .087 },
    NS: { name: "Nova Scotia", brackets: [{to:30995,rate:.0879},{to:61991,rate:.1495},{to:97417,rate:.1667},{to:157124,rate:.175},{to:INF,rate:.21}], bpa: 11932, low: .0879 },
    NT: { name: "Northwest Territories", brackets: [{to:53003,rate:.059},{to:106009,rate:.086},{to:172346,rate:.122},{to:INF,rate:.1405}], bpa: 18198, low: .059 },
    NU: { name: "Nunavut", brackets: [{to:55801,rate:.04},{to:111602,rate:.07},{to:181439,rate:.09},{to:INF,rate:.115}], bpa: 19659, low: .04 },
    ON: { name: "Ontario", brackets: [{to:53891,rate:.0505},{to:107785,rate:.0915},{to:150000,rate:.1116},{to:220000,rate:.1216},{to:INF,rate:.1316}], bpa: 12989, low: .0505, surtax: [{over:5818,rate:.20},{over:7446,rate:.36}], healthPremium: true },
    PE: { name: "Prince Edward Island", brackets: [{to:33928,rate:.095},{to:65820,rate:.1347},{to:106890,rate:.166},{to:142250,rate:.1762},{to:INF,rate:.19}], bpa: 15000, low: .095 },
    QC: { name: "Quebec", brackets: [{to:54345,rate:.14},{to:108680,rate:.19},{to:132245,rate:.24},{to:INF,rate:.2575}], bpa: 18952, low: .14, isQC: true },
    SK: { name: "Saskatchewan", brackets: [{to:54532,rate:.105},{to:155805,rate:.125},{to:INF,rate:.145}], bpa: 20381, low: .105 },
    YT: { name: "Yukon", brackets: [{to:58523,rate:.064},{to:117045,rate:.09},{to:181440,rate:.109},{to:500000,rate:.128},{to:INF,rate:.15}], bpa: 16452, low: .064 },
  },
  // SOURCE: CRA — CPP 2026 (YMPE $74,600, YAMPE $85,000, rate 5.95%, CPP2 4%)
  cpp: { ympe: 74600, exemption: 3500, yampe: 85000, baseRate: .0595, creditRate: .0495, enhRate: .0100, cpp2Rate: .04, maxBase: 4230.45, maxCpp2: 416 },
  // SOURCE: Revenu Québec — QPP 2026 (base 6.3%, max $4,479.30, QPP2 4%)
  qpp: { ympe: 74600, exemption: 3500, yampe: 85000, baseRate: .063, creditRate: .054, enhRate: .009, cpp2Rate: .04, maxBase: 4479.30, maxCpp2: 416 },
  // SOURCE: CEIC — EI 2026 (MIE $68,900, 1.63%; Quebec 1.30%)
  ei: { mie: 68900, rate: .0163, max: 1123.07, qcRate: .0130, qcMax: 895.70 },
  // SOURCE: Revenu Québec — QPIP 2026 (MIE $103,000, employee 0.430%)
  qpip: { mie: 103000, rate: .00430, max: 442.90, selfRate: .00764 },
  // SOURCE: CRA — registered plan limits 2026
  tfsa: {
    annual: 7000, cumulative2026: 109000,
    history: { 2009:5000,2010:5000,2011:5000,2012:5000,2013:5500,2014:5500,2015:10000,2016:5500,2017:5500,2018:5500,2019:6000,2020:6000,2021:6000,2022:6000,2023:6500,2024:7000,2025:7000,2026:7000 },
  },
  rrsp: { pct: 0.18, dollarMax: 33810, overBuffer: 2000 },
  fhsa: { annual: 8000, lifetime: 40000, carryMax: 8000, maxYear: 16000, participationYears: 15, closeAge: 71 },
  capGainsInclusion: 0.50, // SOURCE: 66.67% proposal CANCELLED Mar 2025 — flat 50% for individuals
  eligDividend: { grossUp: 0.38, fedDTC: 0.150198 },
  // SOURCE: OAS recovery tax ("clawback"), 2026 — threshold $95,323, 15% recovery, full clawback ~$155k
  oas: { thresholdMin: 95323, rate: 0.15, maxPension: 8988 },
};

export const PROV_LIST = [
  ["AB","Alberta"],["BC","British Columbia"],["MB","Manitoba"],["NB","New Brunswick"],
  ["NL","Newfoundland & Labrador"],["NS","Nova Scotia"],["NT","Northwest Territories"],
  ["NU","Nunavut"],["ON","Ontario"],["PE","Prince Edward Island"],["QC","Quebec"],
  ["SK","Saskatchewan"],["YT","Yukon"],
];

export const RISK = [
  { key: "conservative", name: "Conservative", ret: 0.06, color: "#5B8C5A", desc: "Steadier, smaller swings. Leans on bonds and cash." },
  { key: "moderate",     name: "Moderate",     ret: 0.08, color: "#7C4DC4", desc: "A balanced mix of growth and stability." },
  { key: "aggressive",   name: "Aggressive",   ret: 0.10, color: "#34185A", desc: "Maximizes long-term growth; bigger ups and downs." },
];

export const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export const HBP_LIMIT = 60000; // Home Buyers' Plan withdrawal limit (raised to $60k in 2024)
