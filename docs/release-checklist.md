# Release checklist

Use this for every public store submission. Pair with [`MANUAL_TEST_CHECKLIST.md`](MANUAL_TEST_CHECKLIST.md) (deep, per-feature) — this file is the short release-cut tick list.

## Code health

- [ ] `npm test` — full suite green (current baseline: 631+ tests)
- [ ] `npm run typecheck` — clean
- [ ] `npx expo export -p web` — bundle clean (proxy for production bundle health)
- [ ] All quality-gate detectors pass:
  - [ ] `i18n-coverage`
  - [ ] `i18n-purity`
  - [ ] `a11y-coverage`
  - [ ] `strict-mode`
- [ ] No new dependencies were added without owner approval
- [ ] `package-lock.json` committed and up to date

## Versioning (three places must agree)

- [ ] `package.json` → `version`
- [ ] `app.json` → `expo.version`, `expo.ios.buildNumber`, `expo.android.versionCode`
- [ ] `src/lib/app-info.ts` → `APP_VERSION`, `APP_BUILD`
- [ ] `CHANGELOG.md` entry added with user-facing summary

## Device smoke (real hardware, not Expo Go for biometric)

### iOS
- [ ] Cold install on real device (Face ID + passcode enrolled).
- [ ] Welcome onboarding completes; GuidedSetupCard appears on Dashboard.
- [ ] Walk through all 5 GuidedSetup CTAs → each step marks complete; card auto-dismisses after #5.
- [ ] Calculator → run a salary calc end-to-end; result persists across restart.
- [ ] Kakeibo → add expense; budget; recurring; verify BudgetComparisonSection shows row.
- [ ] Kakeibo list → trash icon → confirm dialog → entry removed.
- [ ] Dashboard FinancialHealthCard chips render when budgets / entries / salary exist.
- [ ] Documents → add residence card → notification permission flow → local reminder fires before deadline (or as scheduled).
- [ ] Trip budget → create trip → log expenses → planned-vs-actual rolls up.
- [ ] **Biometric lock** (if PR #34 merged): Settings → enable → Face ID prompt → success persists. Kill + reopen → lock screen. Background 30s+ → re-lock. Cancel → stay locked.
- [ ] Settings → "Hiện lại hướng dẫn ban đầu" / "オンボーディングを再表示" brings the GuidedSetupCard back.
- [ ] Settings → Export → JSON share sheet opens with valid payload.
- [ ] Settings → Clear all data → type-`DELETE` confirm → wipes; onboarding flow returns.
- [ ] vi ↔ ja toggle on every screen above.
- [ ] Dark mode toggle on every screen above.

### Android
Same matrix. Substitute fingerprint / face unlock for Face ID.

## Privacy & legal

- [ ] [`PRIVACY_POLICY.md`](PRIVACY_POLICY.md) hosting URL is live and matches the version shipping
- [ ] [`TERMS_OF_SERVICE.md`](TERMS_OF_SERVICE.md) hosting URL is live and matches the version shipping
- [ ] [`privacy-summary.md`](privacy-summary.md) reflects current data inventory
- [ ] App Store Connect → Privacy → "Data Not Collected" still accurate
- [ ] Play Console → Data safety → "No data collected" still accurate
- [ ] If biometric lock shipping: confirm App Store Connect / Play Console Face ID usage description matches `app.json` `NSFaceIDUsageDescription`

## Visuals & metadata

- [ ] App icon — both light + dark adaptive variants present
- [ ] Splash screen — no overlay leak on iOS (`SplashScreen.hideAsync()` runs on mount)
- [ ] Screenshots captured for store (5 per locale × 2 locales = 10 minimum)
- [ ] Screenshot captions match [`store-copy.md`](store-copy.md) → "Screenshot captions"
- [ ] Store description copied from [`store-copy.md`](store-copy.md) (no drift)
- [ ] Keywords entered per locale
- [ ] App preview video (optional) — if recorded, verify no real user data on screen

## EAS submission readiness

- [x] `eas.json` iOS submit creds — Apple Team ID, ASC App ID, Apple ID filled (see PR #40)
- [ ] `play-store-key.json` dropped at repo root (Google service-account JSON, gitignored)
- [ ] `eas build --profile production --platform all` succeeds
- [ ] Build artifacts download and install on a test device per platform
- [ ] `eas submit --platform ios` / `--platform android` reaches the stores

## After submission

- [ ] App Store review notes mention test credentials are **not required** (the app has no accounts)
- [ ] Play Store rollout target percentage set conservatively for first release
- [ ] `git tag v<X.Y.Z>` pushed
- [ ] CHANGELOG.md committed and pushed to `main`
- [ ] Open issues triaged: anything regressing the release flow gets a P0 label

## Sanity prompts (don't skip)

- [ ] Is there a feature shipping where the device smoke item is intentionally absent? Document the gap in the PR comment.
- [ ] Is there an automated test relying on a mock that won't behave like the production native module? Note it.
- [ ] Did anything new add a network call? **No.** This is the line we don't cross.
- [ ] Did anything new add analytics / telemetry? **No.** Same line.

## Sign-off

| Role | Name | Date | Signature |
|---|---|---|---|
| Owner | | | |
| QA (manual smoke) | | | |
| Release engineer | | | |
