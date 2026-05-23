# Changelog

All notable changes to Money Dashboard JP are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

(empty — next changes land here)

## [0.2.0] - 2026-05-23

Pre-launch release. Adds Phases 5I–5Q + 5U–5W + the May 23 release-polish
wave on top of [0.1.0], polishes for App Store / Play Store submission.
**iOS buildNumber `3`, Android versionCode `3`** (semver unchanged from
the 2026-05-21 checkpoint; build bumped because substantive work landed
between checkpoint and ship). Final test count on main: **655** across
66 suites.

### Added

#### Phase 5I — Multi-job + theme expansion
- Multi-job income store (5 jobs max), aggregated total surfaced in Dashboard.

#### Phase 5J — Multi-job advanced
- Per-job hourly rate / hours / days inputs; auto-total annualization.

#### Phase 5K — Documents + expiry reminders
- 在留カード / マイナンバー / passport expiry tracking with 5-tier urgency
  colors (expired / red / orange / yellow / green).
- Local notification reminders via `expo-notifications` (no remote push).
- Settings panel surfaces current notification permission status.

#### Phase 5L — Medical expenses (医療費控除)
- Per-expense store with categories (consult / pharmacy / dental / vision /
  other), receipt-storage scaffold, deductible calc against the ¥100,000 /
  5%-of-income threshold.
- Dashboard medical card with refund estimate when over threshold.

#### Phase 5M — ふるさと納税
- Donation log, derived `寄付上限` from latest Calculator result, per-portal
  attribution (さとふる / 楽天 / ふるなび / other), municipality field.
- Dashboard remaining-capacity card.

#### Phase 5N — Goals & savings tracking
- Up to 20 goals with target + optional deadline + 9 preset icons.
- Pure `goals-math` library: monthly target, savings-rate-required, months
  at 20% default pace.
- Per-goal contribution ledger with quick chips (¥1K / ¥5K / ¥10K / ¥50K).
- Dashboard surfaces the highest-progress active goal.

#### Phase 5O — Kakeibo (家計簿)
- 5,000-entry manual expense log + per-category monthly budgets across 12
  categories (rent / food / utilities / communication / transport /
  entertainment / health / shopping / education / savings / remittance /
  other).
- Auto-suggest budgets from take-home using 50/30/20-inspired ratios.
- Budget severity (safe / warning / over), MonthComparisonCard with top
  movers vs previous month.

#### Phase 5P — Remittance tracking
- 500-entry log of transfers to Vietnam across 7 providers (Wise /
  Remitly / SBI Remit / セブン銀行 / Western Union / Shinhan / other).
- Manual rate + fee entry from confirmation emails — no portal API.
- Yearly summary with weighted average rate, best/worst rates, provider
  comparison by effective rate.
- Annual JPY goal + days-to-EOY projection.
- 暦年贈与 warning at 80% / 100% of the ¥1,100,000 per-recipient threshold.

#### Phase 5Q — 確定申告 wizard
- 5-step wizard pulling income from Calculator, medical from Phase 5L,
  furusato from Phase 5M; manual inputs for 生命保険 / 地震保険 / 国民年金.
- `kakutei-shinkoku` library computes refund vs due with 復興税.
- Export summary as JSON or CSV via OS share sheet.
- Dashboard surfaces March 15 countdown when within 90 days.

#### Pre-launch QA + polish
- Trilingual Privacy Policy + Terms of Service (vi / ja / en) in
  [`docs/PRIVACY_POLICY.md`](docs/PRIVACY_POLICY.md) +
  [`docs/TERMS_OF_SERVICE.md`](docs/TERMS_OF_SERVICE.md).
- [`docs/MANUAL_TEST_CHECKLIST.md`](docs/MANUAL_TEST_CHECKLIST.md) — release
  test plan covering all 17 phases.
- `eas.json` skeleton for EAS Build (development / preview / production
  profiles + submit metadata).
- README "Building for production" section.
- iOS `buildNumber: "3"`, Android `versionCode: 3`, app & package version
  `0.2.0` (bumped from build 2 at the 2026-05-21 checkpoint after the
  Phase 5U–5W + release-polish wave landed).

#### Phase 5U — Kakeibo daily UX (#25)
- Recurring expense templates (manual + auto-post) with monthly idempotency
  via `lastGeneratedYearMonth`.
- Quick-add expense modal + floating-action button on Dashboard.
- Daily-spending hero card with salary-anchored allowance + 7-day mini
  chart.

#### Phase 5V + 5W — Kakeibo charts, insights, hardening
- Real document deadlines (Dashboard upcoming reminders no longer use
  stubs).
- Kakeibo Charts tab: daily / monthly / category SVG charts + 5 rule-
  based insights (top category, MoM delta, daily-allowance breach, high
  food ratio, safe-month signal).
- Hardening: safe_month gating, high_food floor, list-only category
  filter, app display name "Kakei".

#### Phase 6A — Trip & Business Budget Planner (#27)
- Plan a trip's budget by category, log actual expenses as you go,
  compare planned vs actual, and (for business trips) settle reimbursable
  spend against a company advance.
- Dashboard `TripBudgetCard` surfaces active trips.

#### Issue #26 — Kakeibo monthly budget comparison visibility (#28)
- New `BudgetComparisonSection` on Kakeibo Overview renders every saved
  budget (icon · spent / limit · progress bar · remaining-or-over caption)
  regardless of severity (safe / warning / over).
- Replaces the prior warning-only block.
- Save toast confirms successful budget save.

#### Issue #30 — FinancialHealthCard / DailySpendingCard upgrade (#32)
- New pure helper `computeFinancialHealth` composes existing
  `computeLivingCost` + `buildMonthlyReport.byCategory[0]` +
  `computeAllBudgetStatuses` + `computeDailySpending` — no new math.
- `DailySpendingCard` extended in place with a compact chip strip:
  `Budget X/Y OK · Nhiều nhất: <cat> · Cố định N%`. Each chip is
  independent; strip hidden when no chips qualify; first-launch UX
  unchanged.

#### Kakeibo daily usability + light-mode contrast (#33)
- Light-mode tokens tightened: `background` slate-50 → slate-100,
  `border` slate-200 → slate-300, `borderStrong` slate-300 → slate-400.
  Dark mode untouched.
- Direct delete per row on Kakeibo list — trash icon → confirm dialog
  → `removeEntry`. Nested `Pressable` owns its hit area; no swipe
  gesture dep.

#### Issue #31 — Biometric app lock (#34)
- New dependency: `expo-local-authentication ~17.0.8` (SDK 54-aligned,
  first-party Expo module, no network).
- `src/lib/biometric-auth.ts` — pure wrappers around `LocalAuthentication`
  with discriminated result shapes (`cancelled` / `failed` / `unavailable`
  / `unknown`).
- `src/store/appLockStore.ts` — in-memory only; cold launch always
  re-locks if `faceIdEnabled` is on. Exports `LOCK_TIMEOUT_MS = 30_000`.
- `src/features/security/AppLockGate.tsx` wraps `RootNavigator`; AppState
  listener stamps background timestamps; on `active` re-locks if elapsed
  ≥ `LOCK_TIMEOUT_MS`.
- Settings toggle gates on availability + auth — only persists `true`
  after a successful prompt.
- iOS: `NSFaceIDUsageDescription` added to `app.json`.
- Replaces the placeholder "coming soon" toggle that flipped a boolean
  no part of the app consumed.

#### First-use onboarding — GuidedSetupCard (#35)
- Compact 5-step card on Dashboard (salary → fixed costs → budget →
  documents → daily tracking). Each row has a numbered chip + title +
  1-line body + CTA pill. Done steps show a checkmark + dim.
- Permanent dismiss via close (X). Auto-dismisses when all 5 marked
  complete.
- Settings → "Hiện lại hướng dẫn ban đầu" / "オンボーディングを再表示"
  resets the flag so the card returns.
- Sits below `AppLockGate` — biometric prompt always wins over onboarding.

#### Release polish docs (#36)
- `docs/store-copy.md` — App Store / Play Store title, subtitle,
  positioning, long description, 5 feature bullets, screenshot captions,
  keywords (vi / ja / en).
- `docs/privacy-summary.md` — plain-language complement to
  `PRIVACY_POLICY.md` inventorying every store, listing what is NOT
  done (no account / no server / no analytics / no crash reporter /
  no ad SDK), and walking through GDPR rights.
- `docs/release-checklist.md` — short release-cut tick list pairing
  with `MANUAL_TEST_CHECKLIST.md`.
- README — onboarding bullet refreshed to mention `GuidedSetupCard`;
  new biometric app lock bullet; quickstart test count refreshed.

### Polish
- Accessibility audit: every Pressable / Touchable / Switch under `src/`
  declares `accessibilityRole` and a label or visible text. Enforced by
  `src/lib/__tests__/a11y-coverage.test.ts` (fs-scan detector).
- Strict-mode detector at `src/lib/__tests__/strict-mode.test.ts` — bans
  `: any` annotations and `@ts-ignore` / `@ts-expect-error` outside an
  explicit whitelist.
- Dashboard zero-income edge state — explicit explainer instead of a ¥0
  progress bar when the latest calculation rounds to nothing.
- Calculator soft warning when 年収 > ¥100,000,000 (does not block submit).
- README, MIT LICENSE.

### Changed
- `EmptyState` accepts optional `title` / `subtitle` overrides (reused by
  the zero-income state).
- `settings.export.noData` copy now points the user to the Calculator tab.
- `TrendChart` layout math wrapped in `useMemo` (skip recompute on theme
  flip / orientation change).
- `PaydayPicker` day buttons extracted to a `React.memo`-wrapped `DayChip`
  so selecting a day no longer re-renders the other 30 chips.

## [0.1.0] - 2026-05-19

First feature-complete pre-release. All four tabs functional. ~225 tests.

### Added

#### Phase 5A — Foundation
- Expo SDK 54 project, TypeScript strict (`noUncheckedIndexedAccess`).
- Design system: light + dark color palettes, typography scale, spacing,
  radius tokens. `ThemeProvider` + `useTheme` hook.
- Navigation skeleton: `RootNavigator` + `MainTabs` (4 placeholder tabs).
- i18n: `i18next` + `expo-localization`, vi + ja locale files.
- `ErrorBoundary` root component for production crash surfacing.

#### Phase 5B — Calculator
- `useCalculator` hook with `SalaryInput` builder, validation, persisted
  `lastInput` / `lastResult`.
- Salary form, prefecture picker, dependents stepper, blue-return picker.
- Result card + breakdown list (~20 tax/insurance line items with sources).
- Tax engine: FY2026 brackets verified against 国税庁 / 協会けんぽ /
  日本年金機構 / 厚生労働省.

#### Phase 5C — Dashboard
- Real-time proportional take-home for the current month.
- Greeting header, payday countdown badge, retention rate, quick stats.
- Trend / reminders stubs.

#### Phase 5D — History
- `historyStore` + persisted entries (max 1000).
- Auto-save on every Calculator submit.
- 6-month SVG trend chart with tappable dots (no chart library).
- Filter chips (all / salary / business), edit / delete entry modal.
- One-shot 5C → 5D migration: seeds first entry from latest calculation.

#### Phase 5E — Settings + Onboarding
- 4-slide swipe-paginated onboarding (FlatList paging + tappable dots).
- Settings tab with 7 sections: personal, salary, notifications stub,
  security stub, data (export / clear), legal, app.
- Reactive theme + i18n: change in Settings re-renders without restart.
- Two-stage clear-data flow; type "DELETE" to confirm (language-independent).
- Export user data as JSON via the OS Share sheet.

#### Phase 5F — Polish
- `settings.payday` flows through Dashboard countdown.
- Batched `updateSettings()` for multi-field commits (onboarding finish).
- Hydration gate in `App.tsx` — no flicker of defaults before AsyncStorage rehydrate.

#### Phase 5G — UX glue
- `useCalculator` pre-fills prefecture / municipality from
  `settings.defaultPrefecture` / `defaultMunicipality` on first use.
- MunicipalityPicker row in Settings hidden until user goes freelance or
  has previously set a default — keeps the screen clean for salary users.
- `i18n-coverage.test.ts` enforces vi/ja key parity at CI time.
- ExportPayload gains `schemaVersion: 1` for forward-compatible migrations.

### Compliance

- 100% offline. No network requests beyond user-initiated share intents.
- No PII leaves the device. Every store persists to AsyncStorage only.
- Right to portability (export) + right to be forgotten (clear-data) wired.

[Unreleased]: https://github.com/pdythanhduy/money-dashboard-jp/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/pdythanhduy/money-dashboard-jp/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/pdythanhduy/money-dashboard-jp/releases/tag/v0.1.0
