# Release build commands — 0.3.0 / build 9

**STATUS: NOT EXECUTED.** This file documents the exact commands to run.
Run only after manually signing off on `docs/release-qa-0.3.0.md`.

The user (`ttduy8vn`) must trigger the build personally. The AI assistant
will not run `eas build` or `eas submit` without explicit go-ahead.

---

## Pre-flight (do these one more time before the build)

```bash
# 1. Confirm you're on main at the expected commit.
git checkout main && git pull --ff-only
git log -1 --format='%h %s'
# Expect: 1e56b99 chore: final UI and store polish for 0.3.0

# 2. Confirm the version triple is still 0.3.0 / 9.
grep -E '"version"|"buildNumber"|"versionCode"' app.json
# Expect: "version": "0.3.0", "buildNumber": "9", "versionCode": 9

# 3. Confirm gates one more time.
npm test --silent && npx tsc --noEmit && npx expo export -p web
# Expect: 852/852 tests, no tsc output, "Exported: dist".

# 4. Confirm EAS CLI is logged in as the right account.
eas whoami
# Expect: ttduy8vn
```

---

## iOS — build only

```bash
eas build --platform ios --profile production
```

What this does:
- Uploads the source archive to EAS Build (free-tier queue, ~10-25 min wait + ~20-30 min build).
- Uses `production` profile from `eas.json`: `autoIncrement: false` (build stays at 9).
- Signs with the credentials EAS has on file for `ttduy8vn` + Team `2NQXMZ6626`.
- Outputs an `.ipa` you can download from the EAS dashboard.

If the build queues for longer than expected, do **not** cancel and re-run — that consumes
two of the 15 monthly free-tier builds. Open https://expo.dev/accounts/ttduy8vn/projects/money-dashboard-jp/builds
in a browser to watch the queue.

---

## iOS — submit to TestFlight

Run only after the build finishes successfully:

```bash
eas submit --platform ios --latest
```

What this does:
- Picks the latest finished production iOS build (the .ipa from the step above).
- Uses `submit.production.ios` from `eas.json`:
  - `ascAppId: 6772192074`
  - `appleId: thanhduy8vn@gmail.com`
  - `appleTeamId: 2NQXMZ6626`
- Uploads to App Store Connect; App Store routes to TestFlight Processing → External Testing.
- Submission queue is separate from build queue and free-tier-throttled.

The build will not auto-promote to the App Store. After TestFlight processing finishes
(~10-30 min), the build is testable. To promote to the public App Store, do the
App Store Connect web flow ("Distribute" → "App Store") — that step is NOT automatable.

---

## Android — build only (optional; same release cycle)

```bash
eas build --platform android --profile production
```

Produces an `.aab` app bundle (per `eas.json`'s `production.android.buildType: "app-bundle"`).

---

## Android — submit to Play Console

```bash
eas submit --platform android --latest
```

Requires `play-store-key.json` (Google service-account credentials) at the repo root.
That file is NOT committed; obtain from the Google Cloud Console project that owns
the Play Store entry, drop it at `./play-store-key.json`, then run the submit.
`eas.json` targets the `production` track — switch to `internal` first if you want
to test the bundle on Internal Testing before promoting.

---

## Rollback notes — if the build is rejected

### Apple rejection (ITMS-xxxxx) at submit time

1. Read the exact ITMS code in App Store Connect → My Apps → Activity → the rejected build.
   Common ones for this project's posture:
   - **ITMS-90683** (Missing purpose string) → check `app.json` `ios.infoPlist` for any usage description we use but didn't declare. We currently declare `NSFaceIDUsageDescription` + `ITSAppUsesNonExemptEncryption`. If we ever start using camera/photos/contacts, add the matching `NS*UsageDescription`.
   - **ITMS-90809** (Deprecated API usage) → usually triggers when an Expo dependency falls behind iOS. Run `npx expo install --check` to surface mismatches.
   - **ITMS-91053** (Privacy manifest required) → app needs `PrivacyInfo.xcprivacy`. We use AsyncStorage which requires the `NSPrivacyAccessedAPICategoryUserDefaults` entry. Expo SDK 54 should auto-emit this; if not, add manually under `ios.privacyManifests` in `app.json`.

2. If the rejection is configuration-only (purpose string, manifest entry), edit `app.json`,
   bump `ios.buildNumber 9 → 10`, also bump `APP_BUILD '9' → '10'` and `android.versionCode 9 → 10`,
   commit with a `release(0.3.x):` prefix, then rerun `eas build --platform ios --profile production`.
   Do NOT bump the marketing version (`0.3.0`) — that's the same release.

3. If the rejection is a content / guideline issue (Apple Reviewer says copy or screenshots
   don't match policy), edit App Store Connect-side fields without rebuilding. The IPA is fine.

### App Review (human) rejection during TestFlight or App Store review

1. Read the resolution centre message verbatim. The categories that historically apply here:
   - **2.1 (App Completeness)** → Apple opened a screen that crashed or showed placeholder
     copy. Verify nothing in `docs/release-qa-0.3.0.md` was skipped.
   - **5.1.1 (Data Collection)** → Apple thinks we're collecting data we said we don't.
     We don't. Reply with the privacy policy URL + a sentence pointing to `data-actions.ts`
     showing all storage is on-device. Don't ship a new build.
   - **2.3.10 (Inaccurate Metadata)** → screenshot caption doesn't match what the screenshot
     shows. Update captions per `docs/store-copy.md` + `docs/screenshot-checklist.md` — no
     rebuild needed.

2. Reply via Resolution Centre with the fix description + estimated turnaround. Apple usually
   re-reviews within 24h.

### EAS build itself fails (not Apple)

1. Open the failed-build log in the EAS dashboard.
2. Most common: TypeScript / Metro bundle errors from a dep version mismatch. Run
   `npx expo install --check` locally, accept the suggested upgrades, re-test gates,
   re-commit, rerun the build.
3. If credentials expired (Apple p12 / provisioning profile): EAS will offer to regenerate.
   Accept; this does NOT count against the free-tier build quota.

---

## What NOT to do during this release

- ❌ Do not bump `APP_VERSION` past `0.3.0` — this is the 0.3.0 candidate.
- ❌ Do not bump `APP_BUILD` past `9` unless a rebuild is needed (and only by exactly 1).
- ❌ Do not run `eas build --auto-submit` — the staged build + submit flow is intentional
  so we can ship the IPA to TestFlight as Internal first, then push to External.
- ❌ Do not submit Android until iOS is stable on TestFlight. Two-platform rollback at
  the same time is operationally painful.
- ❌ Do not skip `docs/release-qa-0.3.0.md` even if the diff "feels small". The smoke
  list is calibrated to the 0.3.0 surface area.
