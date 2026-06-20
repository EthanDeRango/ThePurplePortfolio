# Build plan — 2026-06-17 (round 2)

Decisions locked (user): incorporated = **personal pay only**; future changes = **life-events timeline**;
RRSP room = **estimate but flag + warn, never hard-cap**; simplify = **propose cuts for approval first**.

Status: `[ ]` todo · `[~]` in progress · `[x]` done

> **DONE — 2026-06-17:** All four items shipped + verified (desktop & mobile, light/dark). Plus the
> SIMPLIFY consolidation (dashboard **10 tabs → 6**, no content lost) and a **goal due-date** field.

## 1. Mobile parity & tabs
- [ ] Add `color-scheme: light` (index.html meta + `.pp` CSS) — root cause of phone color discrepancy (OS dark-mode recolouring form controls)
- [ ] Tone down `backdrop-filter: saturate(1.9)` → ~1.1 (over-saturates on iOS Safari) on topnav + modal
- [ ] Fix section-tab nav on mobile: group labels become block-level mini-headers, hide vertical divider < 640px, pills wrap cleanly
- [ ] Verify with Playwright at 390px in BOTH light and dark emulated colorScheme; compare to desktop

## 3. RRSP room — stop guessing, warn on over-limit (safety; do early)
- [ ] When NOA not provided: label estimated RRSP room as "estimate," never treat it as a hard cap that encourages maxing
- [ ] Add over-limit warnings (RRSP, TFSA, FHSA) when planned/recommended contribution exceeds known/estimated room
- [ ] Prompt to enter NOA for an exact figure; if absent, cap recommended RRSP step conservatively + disclose
- [ ] Audit every place room is shown as if certain; soften copy where it's estimated

## 2. Life-events timeline (future income/expense changes)
- [ ] Data model: `plan.lifeEvents = [{ id, age, kind: 'expense'|'income'|'savings', mode: 'delta'|'set', amount, label }]`
- [ ] Planner UI: add events ("at age X, expenses −$Y/mo — kid finishes university")
- [ ] Projection: derive per-year savings capacity from events; reflect in projection line + retirement need
- [ ] Dashboard: show a compact "what changes over time" timeline; feed retirement-spend changes into the nest-egg math
- [ ] Shares the per-year schedule engine with #4 (variable income)

## 4. Variable income + incorporated (personal pay only)
- [ ] Tax engine: add dividend handling (eligible + non-eligible gross-up & dividend tax credit, fed + provincial)
- [ ] Employment type: add "Incorporated" → split salary vs dividends you pay yourself; no CPP/EI on dividends
- [ ] Variable income via timeline income events; per-period tax used for projection capacity (not just current year)
- [ ] Heavy disclosure: we model PERSONAL pay, not the corporation's tax. Accuracy-checked against known cases.

## SIMPLIFY (propose → await approval before removing)
Audit finding: dashboard has **10 tabs**, with heavy overlap among the four tax/account sections.
Proposed consolidation (pending approval):
- Merge **TFSA vs RRSP** into **Accounts** (the "see why" expander already compares them)
- Merge **Tax savings & brackets** into **Paycheque** → one "Paycheque & tax" section
- Fold **Tax plan** (optimized order) into **Action plan** (both prescribe what to do)
- Move **Account types** (encyclopedia) to the Library, or collapse behind disclosure
- Net: 10 tabs → ~5 (Action plan · Accounts · Goals & score · Paycheque & tax · Growth)

## Cross-cutting
- Keep new features behind progressive disclosure so they don't bloat the core path.
- Build + Playwright-verify after each item. Do not push until all verified and nothing degrades.
