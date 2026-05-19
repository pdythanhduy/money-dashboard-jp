# Changelog

All notable changes to Money Dashboard JP are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Accessibility audit: every Pressable / Touchable / Switch under `src/`
  now declares `accessibilityRole` and a label or visible text. Enforced by
  `src/lib/__tests__/a11y-coverage.test.ts` (fs-scan detector).
- Dashboard zero-income edge state — explicit explainer instead of a ¥0
  progress bar when the latest calculation rounds to nothing.
- Calculator soft warning when 年収 > ¥100,000,000 (does not block submit).
- README, MIT LICENSE, and this CHANGELOG.

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

[Unreleased]: https://github.com/pdythanhduy/money-dashboard-jp/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/pdythanhduy/money-dashboard-jp/releases/tag/v0.1.0
