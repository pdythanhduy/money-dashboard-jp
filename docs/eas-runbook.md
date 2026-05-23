# EAS build + TestFlight + Store submission runbook (v0.2.0)

Step-by-step for shipping `v0.2.0` (build 3, tag `v0.2.0` → commit `7e14206`) to TestFlight + Play Console internal testing, then promoting to production.

Pair with [`release-checklist.md`](release-checklist.md) (release-cut tick list) and [`MANUAL_TEST_CHECKLIST.md`](MANUAL_TEST_CHECKLIST.md) (deep manual test plan).

---

## 0. Pre-flight (already done by `chore(release): cut v0.2.0 build 3` / PR #37)

- ✅ Version triple in sync: `0.2.0` / `buildNumber 3` / `versionCode 3` / `APP_BUILD '3'`
- ✅ All 4 asset PNGs present in `assets/`
- ✅ `NSFaceIDUsageDescription` in `app.json` (required because biometric lock from PR #34 ships in this release)
- ✅ Bundle id consistent: `com.kakei.moneydashboardjp` (iOS + Android)
- ✅ Tag `v0.2.0` pushed at `7e14206`
- ⚠️ `assets/adaptive-icon.png` and `assets/splash-icon.png` are **identical files** — non-blocking polish-todo. Adaptive icon should be a foreground-only image with a 432×432 safe zone; splash should be a centered logo on a white background. Replace before the next build if you want a polished launch experience.
- ⚠️ `eas.json` `submit.production` has 3 placeholders + expects a Play service-account JSON path. See § 2 to fill.
- ⚠️ `PRIVACY_POLICY.md` / `TERMS_OF_SERVICE.md` hosting URLs — see § 6 for what to point to.

## 1. Install EAS CLI + log in

```bash
npm install -g eas-cli            # already installed at /c/Users/thanh/AppData/Roaming/npm/eas
eas --version                     # confirm; upgrade if prompted
eas login                          # interactive: enter your Expo account email + password
eas whoami                         # confirm logged in
```

If this is a fresh project for the Expo account:

```bash
eas project:init                   # links the local repo to an Expo project
```

The first `eas build` will also prompt for project init if the link doesn't exist.

## 2. Fill `eas.json` placeholders

Open `eas.json`. The `submit.production` block currently looks like:

```json
"submit": {
  "production": {
    "ios": {
      "ascAppId": "REPLACE_WITH_APP_STORE_CONNECT_APP_ID",
      "appleId": "REPLACE_WITH_APPLE_ID_EMAIL",
      "appleTeamId": "REPLACE_WITH_APPLE_TEAM_ID"
    },
    "android": {
      "serviceAccountKeyPath": "./play-store-key.json",
      "track": "production"
    }
  }
}
```

### Where to find each value

| Field | Where |
|---|---|
| `appleId` | The Apple ID email used to log into App Store Connect. |
| `appleTeamId` | https://developer.apple.com/account → Membership → **Team ID** (10-character alphanumeric like `ABC1234DEF`). |
| `ascAppId` | https://appstoreconnect.apple.com → My Apps → (your app, after first creation) → **App Information** → "Apple ID" field (a number like `1234567890`). If the app doesn't exist yet, create a new app entry with bundle id `com.kakei.moneydashboardjp` first. |
| `serviceAccountKeyPath` | Path to a Google Cloud service-account JSON file. Generate it once: Google Cloud Console → IAM & Admin → Service Accounts → Create. Then grant it Play Console access at Play Console → Setup → API access → **Link** the service account → grant "Release manager" role. Save the JSON to `./play-store-key.json` (already gitignored by Expo defaults; verify it's not committed). |

### Edit `eas.json`

Either edit by hand, or:

```bash
# Replace placeholders (run from repo root)
sed -i 's/REPLACE_WITH_APP_STORE_CONNECT_APP_ID/1234567890/' eas.json
sed -i 's/REPLACE_WITH_APPLE_ID_EMAIL/you@example.com/' eas.json
sed -i 's/REPLACE_WITH_APPLE_TEAM_ID/ABC1234DEF/' eas.json
```

**Do NOT commit the filled `eas.json` if it now contains real Apple credentials.** The cleanest pattern is to keep placeholders in the repo and use environment variables or `eas secret` for production submit. If you want zero-touch CI submit later, switch to `EXPO_ASC_APP_ID` / `EXPO_APPLE_ID` / `EXPO_APPLE_TEAM_ID` environment variables and revert `eas.json` to placeholders.

### Drop `play-store-key.json`

```bash
cp /path/to/your-downloaded-service-account.json ./play-store-key.json
echo "play-store-key.json" >> .gitignore   # double-check it's ignored
```

## 3. (Optional but recommended) Dev build for biometric smoke

PR #34 added biometric app lock — Expo Go cannot run it. If you haven't already smoke-tested on a real device:

```bash
eas build --profile development --platform ios
# or
eas build --profile development --platform android
```

Install the resulting build on a real device. Walk through the smoke checklist already posted on PR #34's comment thread:

- Settings → toggle ON → Face ID prompt → success → toggle ON, alert.
- Toggle ON with biometrics off in iOS Settings → "Thiết bị chưa hỗ trợ" alert → stays OFF.
- Cancel prompt → toggle stays OFF.
- Kill + reopen → lock screen → success reveals app.
- Background > 30s → return → Face ID required.
- Background < 30s → no re-prompt.
- Disable setting → no lock on reopen.

If anything fails, hot-fix on a branch before the production build.

## 4. Production build

```bash
eas build --profile production --platform ios
eas build --profile production --platform android
# or both at once:
eas build --profile production --platform all
```

Each build takes 10–25 minutes on EAS servers. You'll get a URL to monitor progress + download artifacts.

**Cost:** EAS Build is metered. Free tier covers a small number of builds/month; paid tiers scale up. Check https://expo.dev/pricing.

**Common build failures:**
- `App "Kakei" not found in App Store Connect` → create the app entry first (App Store Connect → My Apps → +).
- `Provisioning profile not found` → first run will prompt to create one; let EAS manage it (the default).
- `Bundle id already in use by another team` → bundle id is owned by the team that registered it first; if you're a member of multiple teams, set `appleTeamId` correctly.

## 5. TestFlight (iOS) + Internal testing (Android)

### iOS — TestFlight via `eas submit`

```bash
eas submit --profile production --platform ios --latest
```

`--latest` uses the most recent production build for iOS. Alternatively pass `--id <build-id>` from the EAS dashboard.

What happens:
1. EAS uploads the `.ipa` to App Store Connect.
2. ASC runs automated review (~5–15 min for first submission, faster on subsequent).
3. Once "Ready to Test" appears in TestFlight → add internal testers (App Store Connect → TestFlight → Internal Testing → + group).
4. Internal testers install the TestFlight app and accept the invite.

### Android — Internal testing via `eas submit`

```bash
eas submit --profile production --platform android --latest
```

`eas.json` `track` is set to `production`. For first submission you must promote through tracks manually:

1. EAS uploads the AAB to Play Console as an internal testing build.
2. Play Console → Internal testing → Releases → review → roll out.
3. Add testers (Play Console → Internal testing → Testers tab → manage testers list).

For subsequent submissions you can set `"track": "internal"` in `eas.json` to skip the promotion step.

## 6. App Store Connect + Play Console listing

You need actual store pages set up before promoting from internal testing to production.

### App Store Connect

- App Information: bundle id `com.kakei.moneydashboardjp`, primary language Vietnamese, category Finance, sub-category Personal Finance.
- Pricing: free (or whatever).
- App Privacy: declare **"Data Not Collected"**. See `docs/privacy-summary.md` for the exhaustive list of what's NOT collected.
- Localizations: vi (primary), ja, en.
- For each localization:
  - Name, subtitle, description, keywords → copy verbatim from `docs/store-copy.md`.
  - 5 iPhone screenshots — capture from a real device or simulator using the captions from `store-copy.md`.
  - 5 iPad screenshots — required if iPad support is on (`supportsTablet: true` in app.json — it is, so iPad shots are required).
  - Promotional text (170 chars max) — use the "Positioning lines" from `store-copy.md`.
- App Review Information:
  - Sign-in not required (the app has no accounts).
  - Demo account not needed.
  - Notes: "100% offline app. No accounts, no server, no analytics. The biometric lock toggle in Settings is optional — disabled by default. To test, enable Face ID and verify the lock flow."
- Privacy Policy URL: replace the placeholder URL in `src/locales/{vi,ja}.json` `settings.legal.privacyUrl` with the hosting URL where `PRIVACY_POLICY.md` is published. **Do this in a follow-up PR before the first store submission.**

### Play Console

- App details: free, finance category.
- Data safety form: declare **"No data collected"**. Same source: `docs/privacy-summary.md`.
- Store listing: short description (80 chars), full description (4000 chars max) → use `store-copy.md`.
- Translation: vi + ja.
- Screenshots: 5 phone shots per locale; tablet shots optional.
- Content rating: complete the questionnaire (likely PEGI 3 / Everyone — no UGC, no ads, no purchases).
- Privacy Policy URL: same as iOS.

## 7. Internal testing → Production

Once TestFlight / Internal testing builds are validated by internal users:

### iOS
- App Store Connect → TestFlight → External Testing → invite a wider beta group (optional).
- When ready, App Store Connect → App Store → + Version → 0.2.0 → submit for review → wait for Apple review (typically 24–48 hours).

### Android
- Play Console → Production → Releases → create production release → promote the AAB from internal track → review → roll out (start at 20% staged rollout for first release).

## 8. Post-submission

- [ ] Watch for App Store reviewer feedback (responses go to the email tied to your Apple ID).
- [ ] Monitor Play Console for review status (usually faster than Apple, 1–7 days).
- [ ] When approved, the listing appears live on each store within a few hours.
- [ ] Bump `CHANGELOG.md`'s `[Unreleased]` section header → `[0.2.1]` or `[0.3.0]` for the next cycle.
- [ ] If you tag a release: `git tag v0.2.0 7e14206 && git push --tags` (already done — `v0.2.0` points to `7e14206`).

## Cheat sheet — common commands

```bash
# Status
eas whoami
eas build:list --limit 5
eas submit:list --limit 5

# Cancel a stuck build
eas build:cancel <build-id>

# Rebuild from a specific commit (rare)
eas build --profile production --platform ios --no-wait

# Resubmit a previously-built artifact
eas submit --profile production --platform ios --id <build-id>

# View metadata about a build
eas build:view <build-id>
```

## What this runbook does NOT cover

- Apple Developer Program enrollment ($99/year) — must be active before any iOS submission.
- Google Play Developer Console enrollment ($25 one-time) — must be active before any Android submission.
- Hosting `PRIVACY_POLICY.md` + `TERMS_OF_SERVICE.md` somewhere reachable (GitHub Pages, your own site, etc.).
- App icon polish (the `adaptive-icon = splash-icon` duplication noted in § 0).
- Crash monitoring (intentionally not added — `privacy-summary.md` lists "no crash reporter").

## Sign-off

| Stage | Owner | Date | Notes |
|---|---|---|---|
| eas.json filled | | | |
| Dev build smoke OK | | | |
| Production build succeeded (iOS) | | | |
| Production build succeeded (Android) | | | |
| TestFlight uploaded | | | |
| Play internal testing uploaded | | | |
| Store listing pages complete (vi + ja) | | | |
| Screenshots captured (10 minimum) | | | |
| Privacy / Terms URLs live | | | |
| Submitted for review (iOS) | | | |
| Submitted for review (Android) | | | |
| Approved + live | | | |
