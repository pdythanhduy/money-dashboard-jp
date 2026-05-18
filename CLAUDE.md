@AGENTS.md

# Money Dashboard JP

A React Native (Expo) mobile app that helps Vietnamese workers living in Japan
calculate their take-home salary, Japanese income tax, resident tax, and the
social insurance contributions (health, pension, employment, long-term care)
deducted from their paychecks.

## Core principles

- **100% local-first.** All user data (income records, calculator inputs,
  settings) is persisted in on-device SQLite via `expo-sqlite`. No backend, no
  analytics SDK, no telemetry. The app must work fully offline.
- **No PII leaves the device.** Never add network calls that send salary,
  identity, or location data. Crash reporters and analytics are off-limits
  unless the user explicitly opts in.
- **Bilingual UI: Vietnamese + Japanese.** All user-facing strings live in
  `src/locales/{vi,ja}.json`. Code identifiers, comments, and commit messages
  stay in English.

## Tech stack

| Concern              | Choice                                              |
| -------------------- | --------------------------------------------------- |
| Runtime              | Expo SDK 54 (managed workflow)                      |
| Language             | TypeScript, `strict` + `noUncheckedIndexedAccess`   |
| State                | Zustand                                             |
| Persistence          | `expo-sqlite`                                       |
| Navigation           | `@react-navigation/native` + native-stack + tabs    |
| i18n                 | `i18next` + `react-i18next` + `expo-localization`   |
| Date math            | `date-fns`                                          |
| Vector graphics      | `react-native-svg`                                  |

## Folder layout

```
src/
├── features/    Self-contained feature modules (one folder per domain)
├── components/  Reusable presentational components (no business logic)
├── lib/         Pure calculators: income tax, residence tax, insurance, etc.
├── types/       Shared TypeScript domain types
├── store/       Zustand stores (UI/session state; persistent data → SQLite)
└── locales/     i18n config + per-language JSON resources
```

Path alias `@/*` resolves to `src/*` (see `tsconfig.json`).

## Conventions

- New domain calculations go in `src/lib/` as **pure functions** with unit
  tests in mind — no React, no SQLite, no I/O. Easier to verify against the
  NTA (国税庁) formulas.
- `src/store/` is for in-memory state. Anything the user expects to survive
  app restart belongs in SQLite, not Zustand `persist`.
- New user-facing strings: add to both `vi.json` and `ja.json` in the same
  commit. Never hard-code Vietnamese/Japanese text in components.
- Currency: store amounts as **integer yen** (JPY has no minor unit). Never
  use floats for money.

## What this app is NOT

- Not a tax-filing service. We compute estimates; users are responsible for
  filing.
- Not a remittance app. No bank or money-movement integrations.
- Not multi-user. One device = one user; no accounts, no sync.
