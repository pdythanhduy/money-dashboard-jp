# Release QA — 0.3.0 / build 9

High-signal manual smoke checklist for the production candidate. Skip any item that requires features not in this build. Tick on the device you'd ship from (real iPhone preferred over simulator for the biometric, calendar and notification beats).

**Build target:** `0.3.0 / build 9` · main HEAD `1e56b99` · 852 tests on main · tsc clean · web export OK.

**Cumulative deltas since 0.2.x:** 5-tab IA · Kakeibo budget + recurring · Money goals · Trip budgets · Documents reminders · Medical/Furusato/Kakutei trackers · Backup export+import · Dashboard sections (some collapsible) · Calendar with 47-prefecture + 在留 deadlines · WhatsNewCard · Bug-report helper · Calculator UI modernize · 47 prefectures · 国民健康保険 manual `Other` + Furusato override.

---

## 1. Dashboard

- [ ] Cold-start on fresh install → onboarding plays once, then Dashboard EmptyState shows ("Bắt đầu hành trình" CTA → opens Calculator).
- [ ] After a Calculator run, Dashboard hero (TakeHomeProgressCard) reflects monthly take-home and proportional tax/insurance.
- [ ] Section headers feel polished (uppercase, letterSpacing 0.9, fontWeight 600). Headers don't clip on iPhone SE width.
- [ ] WhatsNewCard appears once for a brand-new install of build 9, dismiss button writes APP_BUILD to settings, never reappears.
- [ ] Tap "Trend" or "Tracking" section header → fold/unfold; restart app → fold state persists.
- [ ] Wall banner shows (and links to Calculator) when income crosses 103万 / 130万 / 160万 / 201万.
- [ ] Quick-Add expense FAB only shows when there's salary or kakeibo activity (no FAB on a truly empty dashboard).

## 2. Calculator

- [ ] Enter ¥4,800,000 / Tokyo / 27 / 正社員 → tap Tính toán → ResultCard shows take-home with donut. Disclaimer text visible below legend.
- [ ] Switch to フリーランス → Prefecture row replaced by Municipality picker. "Other" municipality option present; selecting it enables manual 国保 input.
- [ ] Try Furusato override (Settings/Dashboard → Furusato → manual limit) — overrides auto-calculated limit and persists.
- [ ] All 47 prefectures selectable. Tokyo (highest 健保 standard) renders correctly.
- [ ] Switch language vi ↔ ja in Settings → result labels swap correctly without a full restart.

## 3. Calendar

- [ ] Current month renders. Today cell has solid brand background, weekend/holiday cells coloured per legend.
- [ ] Tap a day cell → see new pressed feedback (subtle brandSubtle bg). DayDetailModal opens.
- [ ] Add a kakeibo expense for a date → dot appears on that cell next render.
- [ ] Long modal scrolls; dividers between event rows are hairline-thin (premium feel).
- [ ] Trash icon visible only on user-created kakeibo events — not on holidays, paydays, document deadlines.
- [ ] Tap previous/next month → smooth transition without layout shift. Header label doesn't cause font-shrink on first render.
- [ ] On an iPhone SE 4.7" simulator, the 6×7 grid fits without clipping. Cell aspect ratio stays 1:1.

## 4. Kakeibo

- [ ] Add 3+ expenses across categories. Sum line updates immediately.
- [ ] Set a monthly budget for one category. Budget bar fills as you log spend; warning colour at ~85%, danger at 100%.
- [ ] Add a recurring expense (rent, internet). On entering the new month (or simulating one), recurring posts once via autoPost.
- [ ] Delete an expense from Dashboard's QuickAdd recents → entry removed from kakeibo store. Confirm via Kakeibo tab.
- [ ] Switch to overview tab → 6-month trend chart renders without crashing on empty months.

## 5. Goals

- [ ] More → Goals → create a goal (title, target, deadline, icon). Goal appears as featured-goal card on Dashboard.
- [ ] Add a contribution → progress ring updates. Required-monthly-saving text matches deadline.
- [ ] Open completed goal → "Completed" badge visible; no "Add contribution" affordance.
- [ ] Delete a goal → confirms via destructive alert; gone from Dashboard.

## 6. Documents

- [ ] More → Documents → add 在留カード expiring 45 days from today. Card lists with "Còn 45 ngày" badge in warning colour.
- [ ] Grant notification permission when prompted. Bell row in Settings shows "Đã bật".
- [ ] Pull-to-refresh on Documents list. Sort order preserved (nearest expiry first).
- [ ] Dashboard's UpcomingEventsCard surfaces the residence card when within reminder window.

## 7. Backup export / import

- [ ] Settings → Xuất bản sao lưu (JSON) → system Share sheet opens with payload. Save to Files/email.
- [ ] On a different device (or after Xoá toàn bộ): Settings → Khôi phục từ bản sao lưu → paste JSON → preview screen shows per-store counts (kakeibo X bản ghi, goals X, etc.).
- [ ] Tap-to-arm red button → second tap restores. Toast confirms. Dashboard reflects restored state on next render.
- [ ] Paste invalid JSON `{ not json }` → "JSON không hợp lệ" error visible; modal stays open.
- [ ] Paste `{}` → "Đây không phải bản sao lưu" error; no destructive action runs.
- [ ] Paste a manipulated payload with `schemaVersion: 99` → "phiên bản mới hơn app" error.

## 8. Biometric lock

- [ ] Settings → Security → toggle Face ID ON. System prompt fires; on success, toggle stays on.
- [ ] Background the app, return → Face ID prompt blocks the UI until success.
- [ ] Cancel the Face ID prompt → app stays locked; retry works.
- [ ] On a device without enrolled Face ID, toggle fails gracefully with "Face ID không khả dụng" alert; toggle stays off.

## 9. More tab navigation

- [ ] More tab shows 7 rows grouped into 3 sections (Management · Japan Life · Settings).
- [ ] Each row navigates to its target screen via the root stack — back button returns to More tab.
- [ ] Dashboard deep-links to Documents / Goals / Trip Budget / Kakutei / Remittance still work (via `getParent().navigate(...)`).
- [ ] Bottom tab stays on Home → Kakeibo → Calculator → Calendar → More (5 tabs, no more crowding).

---

## Pre-build sign-off (verified by Step 2 audit)

- [x] `app.json` version `0.3.0` · `ios.buildNumber 9` · `android.versionCode 9`
- [x] `src/lib/app-info.ts` `APP_VERSION '0.3.0'` · `APP_BUILD '9'`
- [x] Bundle ID `com.kakei.moneydashboardjp` (both platforms)
- [x] Owner `ttduy8vn`, EAS projectId `13c5286c-6537-4cc6-a592-dac52e797eac`
- [x] `eas.json submit.production.ios` populated (ascAppId, appleId, appleTeamId)
- [x] All 4 asset PNGs present (icon, adaptive-icon, splash-icon, favicon)
- [x] `NSFaceIDUsageDescription` + `ITSAppUsesNonExemptEncryption: false` set
- [x] No `REPLACE_WITH_*` placeholders in production config (only in `docs/eas-runbook.md` examples)
- [x] No `TODO` / `FIXME` in `src/` outside tests
- [x] No raw `console.log` outside `__DEV__` guards
- [x] `docs/PRIVACY_POLICY.md` + `docs/TERMS_OF_SERVICE.md` bumped to 0.3.0 / 2026-05-28
- [x] Gates green on main: 852 tests · tsc · web export · 4 detectors

## Sign-off

- [ ] iPhone (real device) smoke pass — date: ____________
- [ ] iPad simulator smoke pass — date: ____________
- [ ] Approved for build by: ____________
- [ ] Approved for TestFlight submit by: ____________
