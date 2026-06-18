# Purple Portfolio — Improvement Plan

Derived from a 5-persona product review (Alex, ambitious 24yo analyst · Sarah, skeptical wealth manager · Michael, strategy partner · Daniel, business owner · Emma, fintech product designer). This is the working backlog. Tiers are ordered by **impact ÷ effort** — do Tier 0 first, then down.

Status legend: `[ ]` todo · `[~]` in progress · `[x]` done

> **Progress — 2026-06-17:** Tiers 0–4 are **shipped and visually verified** (desktop + mobile, two persona profiles). Tier 5 is **partially shipped** (incorporated-business disclosure; kids'-home-help discoverability) with the full corporate-tax engine and variable-income modeling **deliberately deferred** — a half-accurate corp model would fail Sarah's accuracy bar ("inaccurate advice is worse than no advice"), so it's held until it can be done right. Tier 6 (retention loop, business model) remains a strategic decision, untouched.

---

## Tier 0 — Trust & clarity quick wins (hours each, do first)

These are cheap and several personas flagged them. High ratio of trust gained to effort spent.

- [ ] **Fix the privacy-copy contradiction** *(Emma — trust)*
  - Problem: `src/pages/Home.jsx` hero says *"Nothing is stored or shared — everything runs privately in your browser,"* but `AuthModal` + `hooks/usePlanSync.js` sync the plan to Supabase when signed in. A skeptic who notices distrusts everything.
  - Fix: reword to *"Private by default — your numbers stay in your browser. Sign in only if you want to save across devices."* Audit the footer (`src/App.jsx`) and About (`src/pages/About.jsx`) for the same claim.
  - Acceptance: no copy claims "nothing stored" while sign-in sync exists; signed-out path still genuinely local-only.

- [ ] **Surface the retirement tax assumption on the dashboard** *(Sarah)*
  - Problem: "spendable after tax" silently uses an assumed retirement marginal rate (`retMarginal` in `Dashboard.jsx`). Users flip RRSP-vs-TFSA decisions on a hidden number.
  - Fix: show it inline near the after-tax toggle and the recommended-order card: "Assumes ~X% tax on registered withdrawals in retirement — edit." Wire to existing `plan.retTaxRate` override.
  - Acceptance: the retirement rate driving after-tax figures is visible wherever an after-tax number appears.

- [ ] **Dated, sourced CRA-math badge** *(Michael — defensibility vs ChatGPT)*
  - Add a small, visible "2026 CRA brackets · updated <date>" badge on the Paycheque/Tax sections, sourced from `lib/tax-config.js` (`TAX_YEAR`). Turns accuracy into a feature an LLM can't credibly claim.
  - Acceptance: tax year + source visible on tax-related sections.

- [ ] **Inflation toggle: show translation, not loss** *(Emma)*
  - We fixed the copy. Next: render both numbers together when toggled — "$3.8M in {year} = $2.1M in today's money" — and animate the transition so it reads as translation. Hero block in `Dashboard.jsx`.
  - Acceptance: toggling inflation never shows a bare number drop; the relationship is always on screen.

- [ ] **"Delete my data" control for signed-in users** *(Emma)*
  - Add an explicit delete/clear-server-data action in the auth/account UI (`AuthContext.jsx` / account menu). Pairs with the privacy-copy fix.
  - Acceptance: signed-in user can delete synced data in one obvious action.

---

## Tier 1 — Guided first experience *(consensus: Alex + Daniel + Emma)*

The single most-flagged theme. New users can tell *what* the product does but not *what to do first*.

- [ ] **Dashboard "Start here" default instead of 10 equal tabs**
  - Problem: `Dashboard.jsx` `activeTabs` opens everything as peers; Alex/Daniel/Emma all drowned.
  - Fix: on first load show a single guided sequence — Action plan → recommended order → projection — with other tabs collapsed and a "next" affordance. Keep multi-tab power for return users (persist a "I've seen the guide" flag).
  - Acceptance: first-time view presents one clear path; advanced tabs remain available but not default-open.

- [ ] **Stepped planner intake with progress + early value teaser** *(Emma)*
  - Problem: `Planner.jsx` is one long scroll of 4 sections (About you / Goals / Your money / Your accounts). Long forms kill completion.
  - Fix: convert to a stepped flow with a progress bar; after step 1 (income + province) show a take-home teaser — "Here's your take-home — keep going to see your projection" — to deliver a win before asking for everything.
  - Acceptance: progress indicator present; a real result appears after step 1; can still edit any field later.

- [ ] **Deliberate empty / edge states** *(Emma)*
  - Design the 19-year-old-with-$0-and-no-income path and other low-data states explicitly, instead of blank cards. Big slice of the audience.
  - Acceptance: zero-data and partial-data dashboards show useful guidance, not empty components.

- [ ] **Mobile audit of the dashboard** *(Emma)*
  - A 10-tab dashboard on a phone is a red flag. Test and fix nav + chart legibility on small screens.
  - Acceptance: dashboard is navigable and readable at 375px width.

---

## Tier 2 — Modeling credibility *(Sarah; Michael implies)*

The projection currently looks more certain than it is. This is what gates trust for sophisticated users.

- [ ] **Stop implying the range is a risk model; add a real stress test**
  - Problem: conservative/moderate/aggressive are just fixed 6/8/10% rates (`RISK` in `lib/tax-config.js`). Our "rough decade could be ~$X" sentence implies modeled downside but only re-runs a lower constant. That is *not* sequence-of-returns risk.
  - Fix (pick one, document it): (a) a path-dependent stress scenario — e.g. first 5 years at −2%/yr then recover — or (b) a simple Monte Carlo band. At minimum, re-label the current range honestly as "different assumed average returns, not a downturn simulation."
  - Acceptance: either real downside modeling exists, or the copy no longer implies it does.

- [ ] **Tie the safe-withdrawal rate to the horizon** *(Sarah)*
  - Problem: 4% rule applied as law; too high for a 55-year-old with a 40-year horizon.
  - Fix: scale the withdrawal rate by retirement length (e.g. ~3–3.5% for 40+ years). Touches `Dashboard.jsx` retirement-income math.
  - Acceptance: withdrawal rate visibly adjusts with retirement age / horizon.

- [ ] **Apply OAS clawback to projected retirement income** *(Sarah)*
  - Problem: clawback is footnoted, not applied. We have `oasClawback()` in `lib/calculations.js` — use it in the retirement income total, not just as a flag.
  - Acceptance: projected government benefits reflect clawback at higher modeled incomes.

- [ ] **Model a career arc / contribution changes** *(Sarah)*
  - Allow income/contributions to change over time (raises, leave, gaps) rather than constant-forever. Overlaps with Alex's "life events timeline" (Tier 3).
  - Acceptance: user can express at least one future income/contribution change.

---

## Tier 3 — Net worth, milestones & life events *(Alex)*

The hooks that make a 24-year-old return.

- [ ] **Frame the projection as net worth, with milestone forecasts**
  - Add "You'll hit your first $100k around age 29" style milestones; frame the climbing line as "you at 30 / 40 / 50," not just "portfolio." Builds on existing growth chart.
  - Acceptance: at least one milestone callout; net-worth framing on the projection.

- [ ] **Make house affordability prominent** *(Alex, Daniel)*
  - "Can I afford a house, and when?" is buried in goals. Promote it to a headline answer when "house" is a goal.
  - Acceptance: house-affordability answer is a top-level card, not buried.

- [ ] **Life-events timeline** *(Alex; overlaps Sarah Tier 2)*
  - Let users add future events (raise to $95k next year, kid, home purchase) that feed the projection.
  - Acceptance: a future event changes the projection.

---

## Tier 4 — Peer benchmarking *(consensus: Alex + Daniel)*

"Am I doing better than average?" — asked independently by two personas, currently absent.

- [ ] **Net-worth / savings-rate benchmark by age + income + province**
  - Source defensible reference data (e.g. StatCan distributions). Show "you vs. median for your age/income." Frame carefully (educational, not judgmental).
  - Acceptance: a benchmark comparison appears for users with enough data; sources cited.

---

## Tier 5 — Segmentation & business owners *(Daniel; Michael)*

The highest-value users (business owners, high earners) are currently under-served — and they're who can pay.

- [ ] **Incorporated business owner module** *(Daniel)*
  - Problem: "self-employed" still models a T4 employee. Daniel's wealth is inside his corp.
  - Fix: salary vs. dividends, retained earnings invested inside the corp, small-business deduction, corp-held investments. Likely a distinct planner branch + tax-engine extension (`lib/tax-engine.js`).
  - Acceptance: an incorporated owner can model corp-held wealth and get a non-fictional projection.

- [ ] **Variable / lumpy income** *(Daniel)*
  - Allow an income range or year-by-year income ($250k–$400k swings), not a single stable salary.
  - Acceptance: user can express variable income; projection uses it.

- [ ] **Persona-aware dashboard** *(Michael, Daniel)*
  - A 24yo renter and a 51yo owner should not get the identical dashboard. Lead with the question each segment actually asks ("when can I retire / how much can I spend" for Daniel).
  - Acceptance: dashboard emphasis adapts to user profile.

- [ ] **"Can I help my kids buy a home?"** *(Daniel)*
  - A modeled answer for gifting/helping with a down payment.
  - Acceptance: an explicit scenario exists.

---

## Tier 6 — Retention & business model *(Michael)*

Strategic, not a quick fix — but it's the difference between a calculator and a product.

- [ ] **Living plan: plan vs. reality over time**
  - Use existing auth/sync to make the plan persistent and revisitable; "here's your plan vs. where you actually are." This is the retention loop that's currently missing.
  - Acceptance: a returning signed-in user sees change since last visit.

- [ ] **Sharpen the hook / focus the pitch** *(Michael)*
  - The product is paycheque-decoder + account-optimizer + retirement-projector. Pick the one front-door hook; let the rest be depth. Decision to make, then reflect in Home + nav.

- [ ] **Define "the club" / sustainability** *(Michael)*
  - "Educational learning club" with no club and no monetization path. Decide the model (membership? premium modeling? B2B2C via advisors?) and make it coherent with "we don't sell."

---

## Suggested execution order

1. **Tier 0** in one pass (privacy copy, retirement-rate visibility, CRA badge, inflation translation, delete-data) — fast trust wins.
2. **Tier 1** guided experience — biggest UX lever, consensus pick.
3. **Tier 2** modeling credibility — required before marketing this as retirement-ready.
4. **Tier 3 / Tier 4** — growth hooks (net worth, milestones, benchmarks).
5. **Tier 5 / Tier 6** — segmentation + business model, the strategic bets.

## Cross-cutting acceptance for every change
- Build stays clean (`npx vite build`).
- Plain term (ACRONYM) on first use per screen (existing house rule).
- No regression to the privacy-by-default posture.
- New assumptions are disclosed on-screen, not hidden.
