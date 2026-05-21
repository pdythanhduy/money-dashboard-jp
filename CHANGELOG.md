# Changelog

All notable changes to Money Dashboard JP are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

(empty — next changes land here)

## [0.2.0] - 2026-05-21

Pre-launch release. Adds Phases 5I–5Q on top of [0.1.0], polishes for App
Store / Play Store submission. 437 → 439 tests with the new strict-mode
detector.

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
- iOS `buildNumber: "2"`, Android `versionCode: 2`, app & package version
  `0.2.0`.

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
