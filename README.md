# Money Dashboard JP

A 100% offline mobile app that helps Vietnamese workers living in Japan
estimate their take-home salary, taxes, and social insurance — built on
verified FY2026 (令和8年度) rates from 国税庁 / 協会けんぽ / 日本年金機構 /
厚生労働省.

> **Brand name:** Kakei (家計). Repo name (`money-dashboard-jp`) is legacy.

## Features

- **Calculator** — Compute 所得税, 復興特別所得税, 住民税, 健康保険,
  介護保険, 厚生年金, 雇用保険 (salary) OR 国民健康保険 + 国民年金
  (freelance). Supports 8 prefectures + Osaka-shi / Tokyo 23-ku NHI.
- **Dashboard** — Real-time proportional take-home for the current month,
  payday countdown (configurable day-of-month), retention rate, mini stats.
- **History** — Persistent log of every calculation with a 6-month trend
  chart (SVG, no chart-library dep) and editable label / note per entry.
- **Settings** — Language (vi / ja / system), theme (light / dark / system),
  default prefecture & payday, GDPR-friendly export + clear-data flows.
- **Onboarding** — 4-slide swipe-paginated welcome with quick-setup.

## Compliance

- ✅ **No PII leaves the device.** Every store persists to AsyncStorage only.
- ✅ **No network requests** at runtime (besides the user's own export-share
  intent if they choose to share).
- ✅ **No analytics SDK, no crash reporter, no ad tracking.**
- ✅ **Right to portability:** `Settings → Export data` produces a versioned
  JSON snapshot via the OS Share sheet.
- ✅ **Right to be forgotten:** `Settings → Clear all data` wipes every store
  and AsyncStorage. A two-stage confirm (type `DELETE`) prevents misfires.

## Tech stack

| Layer        | Choice                                                  |
| ------------ | ------------------------------------------------------- |
| Runtime      | Expo SDK 54 (managed workflow), React Native 0.81       |
| Language     | TypeScript, `strict` + `noUncheckedIndexedAccess`        |
| State        | Zustand + AsyncStorage persist                          |
| Navigation   | `@react-navigation/native` v7 + native-stack + bottom-tabs |
| i18n         | `i18next` + `react-i18next` + `expo-localization`        |
| Date math    | `date-fns`                                               |
| Charts       | `react-native-svg` (hand-rolled, no chart library)       |
| Test         | `jest-expo`, react-test-renderer                         |

## Quickstart

```bash
npm install
npm test            # ≥ 215 tests across calc / dashboard / history / settings / i18n / a11y
npm run typecheck   # tsc --noEmit
npm start           # expo start, scan QR with Expo Go
```

## Folder layout

```
src/
├── features/    Self-contained feature modules (calculator/dashboard/history/settings/onboarding)
├── components/  Reusable presentational primitives (ErrorBoundary, PlaceholderScreen)
├── lib/         Pure calculators + format + date-helpers + i18n setup
├── store/       Zustand stores (calculator / history / settings / onboarding)
├── types/       Shared TS types
├── locales/     vi.json + ja.json
├── navigation/  RootNavigator + MainTabs
└── theme/       colors / typography / spacing / radius + ThemeProvider
```

## Tax data sources

All FY2026 rates verified against official sources on 2026-05-18. See
[`src/lib/tax-data/RATES_VERSION.md`](src/lib/tax-data/RATES_VERSION.md)
for the full manifest of source URLs + fetched dates per rate.

## License

MIT — see [`LICENSE`](LICENSE).

## Status

Pre-1.0. Feature-complete for the four primary tabs. Pending before App
Store / Play submission: real Privacy Policy & Terms URLs, app icon polish,
optional EAS Build for production binaries.
