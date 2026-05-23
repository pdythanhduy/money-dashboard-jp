# Build 7 release-day runbook

Exact ordered commands for the day you actually ship v0.2.0 build 7. Pair with `docs/build-7-manual-qa.md` for the smoke matrix and `docs/eas-runbook.md` for the deeper EAS reference.

**Estimated wall-clock:** ~60–90 minutes (most is EAS build queue + Apple processing — keep working on something else during the long waits).

**Hand-off points:** every step marked **[HUMAN]** requires interactive input (typing, tapping, deciding). Steps marked **[CMD]** can be copy-pasted into any terminal.

---

## 0. Pre-flight (~5 min)

- **[CMD]** Confirm main is clean and current:
  ```bash
  git checkout main
  git pull origin main
  git status   # should be clean
  npm test     # should be 721+ pass
  npm run typecheck
  ```
- **[HUMAN]** Glance over `docs/build-7-manual-qa.md` to confirm the smoke matrix covers what shipped. If something major landed since this doc was written, add a smoke row.
- **[HUMAN]** Confirm `eas whoami` returns `tt-duy` (your Expo account).
- **[HUMAN]** Confirm `./play-store-key.json` exists locally (NOT in git) before any Android submit. If missing, follow `docs/eas-runbook.md` § 2 → "Drop play-store-key.json".

## 1. Bump build numbers (~2 min)

Three places must agree. Edit each, save, verify.

**File 1 — `app.json`:**
```diff
  "ios": {
    "supportsTablet": true,
-   "buildNumber": "6",
+   "buildNumber": "7",
    ...
  },
  "android": {
    ...
-   "versionCode": 6,
+   "versionCode": 7,
    ...
  }
```

**File 2 — `src/lib/app-info.ts`:**
```diff
  export const APP_VERSION = '0.2.0';
- export const APP_BUILD = '6';
+ export const APP_BUILD = '7';
```

**File 3 — `package.json`:** version stays `0.2.0` (semver unchanged — only build number bumps).

- **[CMD]** Verify all three:
  ```bash
  grep -E "\"version\"|buildNumber|versionCode|APP_VERSION|APP_BUILD" package.json app.json src/lib/app-info.ts
  ```
  Expected output: `0.2.0` × 3 and `7` × 3 (`buildNumber "7"`, `versionCode 7`, `APP_BUILD '7'`).

## 2. Commit, PR, merge (~3 min)

- **[CMD]** Branch + commit + push:
  ```bash
  git checkout -b chore/release-build-7
  git add app.json src/lib/app-info.ts
  git commit -m "chore(release): bump build 6 -> 7

  Picks up PRs since build 6: #48 release polish + #49 weekly review +
  #50 money goals engine + #52 tax checklist engine + #53 goals UI +
  #54 tax checklist UI + #55 dashboard order polish."
  git push -u origin chore/release-build-7
  ```
- **[CMD]** Open PR + auto-merge once mergeable:
  ```bash
  gh pr create --title "chore(release): bump build 6 -> 7" \
    --body "Bump triple for build 7 cut. Same semver 0.2.0."
  # wait for the green badge in the GitHub UI, then:
  gh pr merge --squash --delete-branch
  git checkout main && git pull origin main
  ```

## 3. Post-merge gates (~3 min)

- **[CMD]**
  ```bash
  npm test
  npm run typecheck
  npx expo export -p web --output-dir /tmp/dist && rm -rf /tmp/dist
  ```
  All three must pass. **If anything fails, STOP** — diagnose before continuing. A failed local gate after a bump-only PR is almost always a snapshot test pinning an old version string; fix the test before building.

## 4. Tag v0.2.0 (already exists — verify only) (~1 min)

The git tag `v0.2.0` was pushed at `7e14206` for the initial 0.2.0 cut. Build 7 ships under the same semver so the tag does NOT need to move.

- **[CMD]** Confirm tag exists:
  ```bash
  git tag --list "v*"        # expect to see v0.2.0
  git rev-list -n 1 v0.2.0   # current tagged commit
  ```
- **[HUMAN] Optional:** if you want a separate marker for build 7 specifically, tag `v0.2.0-build7` (not strictly needed; build number lives in the binary metadata).

## 5. Production builds (~25–50 min — both platforms in parallel)

**This is the credit-spending step.** Each build consumes one EAS Build credit. Two builds = two credits.

- **[CMD]** Trigger both in parallel (returns immediately, monitor in dashboard):
  ```bash
  eas build --profile production --platform ios     --non-interactive --no-wait
  eas build --profile production --platform android --non-interactive --no-wait
  ```
- **[HUMAN]** Note the build IDs printed. Watch progress at https://expo.dev/accounts/tt-duy/projects/money-dashboard-jp/builds.
- **Expected duration:** iOS 12–25 min, Android 8–15 min. They run on EAS workers, not your laptop — you're free to do other work.
- **Common failures:**
  - "Apple credentials required" → already set up at build 3; if this surfaces, owner has changed Apple ID or revoked the cert. Re-auth via `eas credentials --platform ios`.
  - "Provisioning profile expired" → cert expires April 2027; not a concern this calendar year.
  - "Android keystore mismatch" → EAS cloud keystore should be persistent; if missing, rerun build and let EAS regenerate (does NOT change app signing key once set).
  - Bundle size unexpectedly larger by > 500KB → check the diff for accidental package additions; abort and investigate.

## 6. Internal device smoke (~10–20 min)

While the builds run OR after they finish.

- **[HUMAN]** Pull `docs/build-7-manual-qa.md` open on a second screen.
- **[HUMAN]** When iOS build finishes:
  1. Click "Install" on the EAS dashboard build page → scan the QR with the device.
  2. Trust the development profile (Settings → General → VPN & Device Management → tap profile → Trust).
  3. Walk through the §1–§9 checklist. If anything fails, mark it; minor cosmetic issues are not blockers; data-loss / crash / wrong-icon are blockers.
- **[HUMAN]** Repeat on Android.

**Decision point:** if both devices smoke clean, proceed to step 7. If iOS passes but Android fails (or vice versa), submit only the clean platform; file an issue for the broken one and ship the other.

## 7. Submit to stores (~5–15 min per platform)

- **[CMD]** iOS → TestFlight:
  ```bash
  eas submit --profile production --platform ios --latest --non-interactive
  ```
  Returns a submission ID. The IPA uploads to App Store Connect; Apple processes for 5–10 min. You'll get an email when it's "Ready to Test."

- **[CMD]** Android → Play Console internal testing track:
  ```bash
  eas submit --profile production --platform android --latest --non-interactive
  ```
  AAB uploads; Google processes for ~5–30 min depending on store load.

- **Common submit failures:**
  - iOS "ITC.apps.preReleaseBuildPlatformAttributeNotSet" → wait 10 min and resubmit; ASC pre-processing race.
  - iOS "Invalid Image — App icon contains an alpha channel" → should NOT happen (fixed at build 4 via PR #41); if it does, build 7 picked up something bad. Don't ship.
  - Android "Track 'production' not available" → first Android submit may need track to be `internal`; edit `eas.json` `submit.production.android.track` to `internal`, retry.

## 8. Post-submit (~10 min + waiting)

- **[HUMAN]** App Store Connect: watch for email "Build ready to test."
  - TestFlight → Internal Testing → add internal testers (yourself + anyone helping smoke).
  - Wait for them to install + report.
- **[HUMAN]** Play Console: Internal testing → Releases → review the new build → roll out to internal testers.
- **[HUMAN]** When ready to promote production:
  - **iOS:** App Store Connect → App Store tab → "+ Version" → 0.2.0 → submit for App Review (Apple review takes 24–48 hours typically).
  - **Android:** Play Console → Production → create release → promote from internal → roll out (start at 20% staged for first release of this version).

## 9. Closeout (~5 min)

- **[CMD]** Update CHANGELOG:
  ```bash
  # Edit CHANGELOG.md: under [0.2.0], add a "build 7" sub-section
  # listing PRs since build 6 (#48, #49, #50, #52, #53, #54, #55).
  git add CHANGELOG.md
  git commit -m "docs: CHANGELOG entry for v0.2.0 build 7"
  git push origin main   # or via PR if main is protected
  ```
- **[HUMAN]** Close any TestFlight/Play smoke issues if they passed.
- **[HUMAN]** If `docs/build-7-manual-qa.md` sign-off table was filled, archive it (move under `docs/releases/` or attach to the release issue) so the next build day starts with a fresh template.
- **[HUMAN]** Bump the QA template version: copy `docs/build-7-manual-qa.md` to `docs/build-8-manual-qa.md` and update the PR-delta list at the top — that way the next build cycle has a starting point.

## Rollback notes

**Before submit succeeds:**
- You can cancel an in-progress EAS build at any time: `eas build:cancel <build-id>`. No credit consumed if the build hasn't started compiling yet.
- You can re-trigger build for the same commit: just re-run `eas build`. Costs another credit.

**After submit, before App Store review:**
- Reject the binary in App Store Connect: My Apps → (Kakei) → TestFlight → (build) → Reject. Then submit a new one.
- Same on Play Console: Internal testing → Releases → discard.

**After App Store review, before user rollout:**
- iOS: developer-rejection still possible until "Released" status — App Store Connect → Pricing & Availability OR contact Apple support.
- Android: halt the rollout — Play Console → Production → Halt rollout.

**After users have installed:**
- iOS: there is NO way to roll back a shipped build. You ship a fixed build 8 with the bug-fix. Plan for fast-follow if a critical regression slips through.
- Android: can halt the rollout (stops new installs) but cannot un-install from devices that already got it. Same answer — ship build 8.

## Sanity prompts (don't skip)

- **[HUMAN]** Did `package.json` `version` accidentally bump? It should be `0.2.0` still — build 7 is a build-only bump.
- **[HUMAN]** Does the new build show the right icon on TestFlight after Apple processing? If not, check `assets/icon.png` palette mode (fixed at build 4 but verify).
- **[HUMAN]** Did any new dependency creep in? `git diff main~5 main -- package.json` should show only build-number changes if you've been disciplined.
- **[HUMAN]** Are the EAS env vars (`EXPO_NO_TELEMETRY=1` if you set it, or none) still what you expect? Otherwise EAS may auto-add update channels or telemetry.

## Sign-off

| Stage | Owner | Date | Build ID / SHA |
|---|---|---|---|
| Pre-flight | | | |
| Build numbers bumped + PR merged | | | |
| Post-merge gates | | | |
| iOS production build | | | |
| Android production build | | | |
| iOS device smoke | | | |
| Android device smoke | | | |
| iOS TestFlight uploaded | | | |
| Android internal testing uploaded | | | |
| Production submitted (iOS) | | | |
| Production submitted (Android) | | | |
| CHANGELOG updated | | | |
