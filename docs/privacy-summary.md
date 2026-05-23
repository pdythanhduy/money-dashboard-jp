# Privacy summary

A plain-language summary of how Kakei handles your data. For the full legal text, see [`PRIVACY_POLICY.md`](PRIVACY_POLICY.md).

## TL;DR

**Kakei is 100% on-device. No account, no server, no analytics.**

## What Kakei stores on your device

- Salary calculator inputs and results
- Kakeibo daily expense entries
- Monthly budgets per category
- Recurring fixed-cost templates (rent, utilities, etc.)
- Document deadlines you add (residence card, visa, passport)
- Goals, ふるさと納税 plans, 医療費 receipts, 仕送り logs, 確定申告 prep
- Trip and business-travel budgets + actual spend
- Settings (language, theme, payday, default prefecture, biometric-lock toggle)
- Onboarding completion flags

All of the above persists via Expo's local AsyncStorage and `expo-sqlite`. None of it leaves your device unless **you** initiate an action that involves another app:

- **Export** (Settings → "Xuất dữ liệu" / "データを書き出す") opens the OS share sheet so you can save / send a JSON snapshot to wherever you choose.
- **Share** any individual card / chart, if a "Share" button is present.

In both cases the destination is the app you pick (Messages, Email, Files, etc.). Kakei has no idea where the data ends up.

## What Kakei does NOT do

- ❌ No account. No login. No password.
- ❌ No server / no backend / no sync.
- ❌ No analytics SDK (Firebase Analytics, Mixpanel, Amplitude, etc.).
- ❌ No crash reporter (Sentry, Bugsnag, Crashlytics, etc.).
- ❌ No advertising SDK, no ad tracking, no ad personalization.
- ❌ No remote configuration / feature flags pulled from a server.
- ❌ No push notifications from a remote server. (Local-only notifications for document deadlines, scheduled by the OS, never originate from a server.)
- ❌ No remote credentials, API keys, or third-party API calls.

## Biometric lock

If you enable Face ID / Touch ID in **Settings → Bảo mật**:

- The biometric prompt is handled entirely by your **operating system** (iOS or Android). Kakei never sees, stores, or transmits your biometric data.
- Kakei stores **only** the boolean "lock is enabled" in local Settings. There's no fingerprint, no face scan, no template anywhere in the app's data.
- Disabling the lock removes the requirement immediately. Your data is still there.

## Notifications

Document-deadline reminders are local notifications scheduled by `expo-notifications`. They are queued by the OS and fire even if Kakei is closed. They never call a server.

If you decline notification permission, the app still works — you just won't get pre-deadline reminders.

## What happens when you uninstall

iOS / Android removes the app's sandbox, including AsyncStorage and the SQLite database. After uninstall, there is nothing to delete on a server because there was never anything on a server.

## What happens when you press "Xoá toàn bộ" / "Clear all data"

Wipes every store the app uses. Goes through a two-stage confirm (type `DELETE` to proceed) to prevent accidental taps. After confirmation:

- All AsyncStorage keys are removed.
- All SQLite tables are dropped.
- Onboarding flag is reset (you'll see the welcome flow again on next launch).

There is nothing else to clear because there is nothing else.

## Your rights (GDPR / Vietnam / Japan)

- **Right of access:** open the app and look at your data — that's literally all of it.
- **Right of portability:** "Xuất dữ liệu" produces a versioned JSON file via the OS share sheet.
- **Right to erasure:** "Xoá toàn bộ" wipes everything in one action.
- **Right to object to processing:** Kakei does not process your data on any server.

## Children

Kakei is not directed at children under 13. The content (Japanese salary / tax math) is intended for working-age adults. Knowingly does not collect data from children because it does not collect data from anyone.

## Changes to this summary

If a future version of Kakei changes the privacy posture (e.g., introduces cloud sync, or an optional analytics opt-in), this file will be updated and the change called out in `CHANGELOG.md` for the affected version. The default will always be: **off** + **opt-in**, never opt-out.

## Contact

Questions or concerns: open an issue at https://github.com/pdythanhduy/money-dashboard-jp/issues (or whatever support channel is current at release time).
