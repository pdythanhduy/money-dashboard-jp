# Build 7 manual QA checklist

Smoke checklist for the next physical build (v0.2.0 build 7). Cumulative deltas since the previous build on TestFlight / Play (build 6):

- PR #48 release polish (light-mode contrast, console cleanup, store-copy + privacy-summary + release-checklist docs, gitignore for service-account JSON)
- PR #49 WeeklyReviewCard (Dashboard)
- PR #50 Money Goals engine (category, status, monthlyContribution, computeGoalHealth, selectFeaturedGoal)
- PR #52 Tax checklist engine + Dashboard reminder
- PR #53 Money Goals UI (category picker, status actions, health badges, Dashboard featured-goal switch)
- PR #54 Tax checklist UI (TaxChecklistSection inside Kakutei screen)
- PR #55 Dashboard card order polish (UpcomingEventsCard moved up)

**Build target:** v0.2.0 build 7 · main HEAD `dac58f9` · 721 tests on main.
**Bumping `buildNumber` / `versionCode` / `APP_BUILD` from 6 → 7 is a separate `chore(release)` PR — do that the day you actually trigger `eas build`.**

---

## Pre-flight (before installing the dev / TestFlight build)

- [ ] Confirm version triple is consistent in the IPA / AAB you're about to install: app.json `0.2.0 / 7 / 7`, app-info.ts `'0.2.0' / '7'`, package.json `0.2.0`.
- [ ] Confirm the test device has biometrics enrolled (iOS Face ID + passcode, or Android fingerprint / face unlock). Without enrollment, the biometric section just verifies the "unavailable" path.
- [ ] **Wipe app data before starting** — Settings → "Xoá toàn bộ" → type `DELETE`. Each scenario below assumes a clean slate unless noted.

---

## 1. Fresh install

- [ ] Welcome onboarding renders (4 slides, swipeable, dots clickable).
- [ ] Finishing onboarding navigates to Dashboard.
- [ ] Dashboard with no Calculator data **renders the GuidedSetupCard** (5 steps: Salary / Fixed costs / Budget / Documents / Daily tracking). Does NOT short-circuit to the full-screen EmptyState.
- [ ] Tapping a CTA on the GuidedSetupCard navigates to the correct screen AND marks that step as complete (✓ checkmark, dim) when you return.
- [ ] Closing the GuidedSetupCard (X icon) hides it permanently — kill + reopen app → card stays hidden.
- [ ] `Settings → Hiện lại hướng dẫn ban đầu` / `オンボーディングを再表示` brings the card back, all 5 steps un-done.
- [ ] No clutter: empty Dashboard shows only Greeting + GuidedSetupCard. No phantom cards for goals / trips / kakeibo / etc.

## 2. Biometric lock (real device only — Expo Go does not support it)

- [ ] Settings → Khóa bằng Face ID / Touch ID toggle ON → biometric prompt fires immediately.
- [ ] Successful auth → toggle stays ON + "Đã bật khóa ứng dụng" / "アプリロックを有効にしました" alert.
- [ ] Toggle ON when biometrics are disabled in iOS Settings → "Thiết bị chưa hỗ trợ…" / "生体認証が利用できない…" alert; toggle stays OFF.
- [ ] Cancel the prompt → toggle stays OFF (no false positive).
- [ ] **Cold launch with lock enabled:** kill app from app switcher → reopen → lock screen renders → biometric prompt fires → success reveals app.
- [ ] **Background > 30s:** background the app, wait 35s, foreground → biometric required again.
- [ ] **Background < 30s:** background, return within 20s → no re-prompt, app stays unlocked.
- [ ] Cancel the prompt on the lock screen → stays locked, shows "Bạn đã hủy xác thực" / "認証がキャンセルされました", "Mở khóa" / "ロック解除" retry button works.
- [ ] Disable the toggle in Settings → no biometric on next reopen.
- [ ] `app.json` ships `NSFaceIDUsageDescription` (iOS) and the export-compliance form is bypassed via `ITSAppUsesNonExemptEncryption=false`. Submit shouldn't prompt for either.

## 3. Dashboard card order (with full data)

After seeding the data in §11, the Dashboard scroll order should match this exactly:

```
GreetingHeader
GuidedSetupCard            (only if first-use / not dismissed)
WallWarningBanner          (only if salary near a tax wall)
TakeHomeProgressCard
DailySpendingCard          (financial-health hero)
WeeklyReviewCard           (only when this-week OR last-week has data)
TaxChecklistReminderCard   (only Jan 1 → Mar 15 + checklist incomplete)
UpcomingEventsCard         (← moved up in PR #55; document deadlines + payday)
QuickStatsRow
… module cards (medical / furusato / kakutei / goals / trip) …
MonthlyTrendChart
```

- [ ] Visual order matches the above. Note `TaxChecklistReminderCard` is **hidden outside Jan 1 → Mar 15** even when checklist is incomplete — see §12.
- [ ] `UpcomingEventsCard` appears BEFORE `QuickStatsRow` and module cards.
- [ ] Card spacing / margins look correct on iPhone SE width.

## 4. Kakeibo

- [ ] Floating "+" FAB on Dashboard → opens QuickAddExpenseModal → save → back on Dashboard, DailySpendingCard updates today's spend.
- [ ] Kakeibo → Overview tab with no budgets → BudgetComparisonSection is HIDDEN.
- [ ] Kakeibo → Set monthly budget (e.g. Food ¥40,000) → success alert → row appears: `¥0 / ¥40,000`, caption "Còn lại ¥40,000".
- [ ] Add Food entry ¥500 → row updates to `¥500 / ¥39,500` remaining, bar still brand color.
- [ ] Push Food to ¥36k+ (≈90%) → bar + caption switch to warning orange.
- [ ] Push Food over ¥40k → bar + caption switch to danger red, caption "Vượt ¥X".
- [ ] Kakeibo → Recurring → add Rent ¥80,000 day 1 active → next month auto-posts; current month shows pending if not auto-post.
- [ ] Kakeibo → List tab → entry row → trash icon → confirm dialog → entry removed. Cancel → entry stays.
- [ ] Dashboard `WeeklyReviewCard` updates: today's entry contributes to this-week total; previous week's entries to last-week.

## 5. Money Goals

- [ ] Goals tab → "Thêm mục tiêu" → modal opens.
- [ ] **Category picker:** 7 chips render (Về Việt Nam / Quỹ dự phòng / Du lịch / Chuyển nhà / Mua sắm / Học hành / Khác). Tapping selects (brand-filled).
- [ ] **Monthly contribution:** yen input below the icon picker, placeholder "20000".
- [ ] Save with `category=home_visit`, `targetAmount=200000`, `deadline=2027-01-15`, `monthlyContribution=25000` → goal appears at top of list.
- [ ] **GoalCard health badge:** active goal with deadline + plannedMonthly ≥ required → "Đang đúng tiến độ" badge (text-secondary outline).
- [ ] Edit goal → drop monthly to ¥5000 → save → badge flips to "Đang chậm tiến độ" (warning color).
- [ ] **Status actions:** open Goal detail → action row above "+ Thêm khoản tiết kiệm":
  - active: Tạm dừng | Đánh dấu hoàn thành | Huỷ
  - paused: Tiếp tục | Đánh dấu hoàn thành | Huỷ
- [ ] Tap "Huỷ" → Alert.alert with destructive confirm → status flips to cancelled (no actions visible afterward).
- [ ] Tap "Đánh dấu hoàn thành" → status = completed, badge green, list sort order: active → paused → completed/cancelled.
- [ ] **Dashboard featured goal:** with multiple active goals (one with near deadline, one without), the Dashboard card shows the **nearest-deadline goal** (not the highest-progress one — that's the old logic from before PR #53).
- [ ] Dashboard featured goal card shows the required-monthly-saving line when the goal has a deadline.
- [ ] **Backward compat:** wipe + reinstall + manually insert a legacy goal via debug → card renders with category "Khác" + health "Chưa đặt hạn".

## 6. Tax / admin checklist

- [ ] Kakutei screen → checklist section at TOP, ABOVE the wizard step indicator.
- [ ] Header: "Việc cần làm cuối năm / 年末のチェックリスト" + year label + "0/5 xong" progress.
- [ ] Disclaimer text visible with brandSubtle background: "Đây là danh sách tự nhắc, KHÔNG phải tư vấn thuế. Xem kỹ với 税理士 nếu cần."
- [ ] 5 rows render: 源泉徴収票 / 確定申告 / ふるさと納税 / 医療費控除 / 扶養・海外送金書類.
- [ ] Tap a row → checkbox flips green-filled, title strikethrough + dimmed, body dimmed, progress count "1/5 xong".
- [ ] Check all 5 → success message "Checklist năm nay đã hoàn tất" / "今年のチェックリストは完了しました" appears above the row list (rows still shown).
- [ ] **Dashboard `TaxChecklistReminderCard` is HIDDEN today** (May 2026 — outside Jan 1 → Mar 15). This is expected. The reminder only shows during tax season AND when the year's checklist is incomplete.
- [ ] (To simulate tax-season behavior: modify your device clock to Jan 15, 2027, reopen the app → reminder card renders with "Còn 5/5 việc chưa xong cho năm 2026". Don't forget to restore device clock.)
- [ ] Year flips automatically at March 15 via `currentTaxYear`.

## 7. Documents

- [ ] Documents tab with no deadlines → EmptyState mentions 在留カード, hộ chiếu, マイナンバー.
- [ ] Add 在留カード with expiry = 45 days from today, remind 30 days before.
- [ ] Document row shows "Còn 45 ngày" badge in orange (approaching).
- [ ] Dashboard `UpcomingEventsCard` lists this reminder with real days-left — NOT a stub.
- [ ] Add passport with expiry = 180 days → shows "Còn 180 ngày" in green (far future).
- [ ] Delete a deadline → confirm → row removed; `UpcomingEventsCard` updates.
- [ ] No fake stub reminders ever appear (Phase 5V removed those).

## 8. Trip & Business Budget Planner

- [ ] Trip tab with no trips → EmptyState: "Tạo chuyến đi đầu tiên".
- [ ] Create trip "Về Tết 2027", type=leisure, 5 days, planned: Flight ¥80k / Lodging ¥30k / Food ¥40k / Gifts ¥50k / Transport ¥10k.
- [ ] Trip detail screen → planned-vs-actual section shows ¥0 actual.
- [ ] Add 2 actuals: Flight ¥75k (under), Gifts ¥55k (over).
- [ ] Stacked bars + summary update correctly; over-budget categories flagged.
- [ ] Create a business trip → planned + actual + **company advance** field; settlement shows reimbursable balance.
- [ ] Dashboard `TripBudgetCard` surfaces the active trip.

## 9. Language (vi ↔ ja)

For each newly-added surface this build:
- [ ] Switch device language vi → ja via Settings → Ngôn ngữ / 言語 → 日本語.
- [ ] **WeeklyReviewCard:** title "今週の支出", "今週は¥X使っています", "先週より¥Y多いです / 少ないです / 先週とほぼ同じです", "最多: <カテゴリ>".
- [ ] **Money Goals UI (PR #53):** category chips show 一時帰国 / 予備費 / 旅行 / 引っ越し / 買い物 / 学業・スキル / その他; monthly contribution field label "毎月の貯金額 (任意)"; status badge "一時停止 / 達成 / 中止"; health badge "順調 / 遅れ気味 / 達成済み / 期限なし"; status actions "一時停止 / 再開 / 達成にする / 目標を中止".
- [ ] **Tax checklist (PRs #52 + #54):** title "年末のチェックリスト", disclaimer "これは自己リマインダーです。税務アドバイスではありません。…", 5 item titles render in Japanese, completed message "今年のチェックリストは完了しました".
- [ ] Switch back ja → vi → all the above re-renders in Vietnamese without stale strings.

## 10. Clear all data

`Settings → Xoá toàn bộ` → type `DELETE` → confirm.

Verify these are wiped on next launch:
- [ ] Calculator history
- [ ] Onboarding completion + GuidedSetup state (welcome flow runs again)
- [ ] Multi-job jobs
- [ ] Documents + document deadlines + scheduled notifications
- [ ] Trips
- [ ] Medical expenses
- [ ] Furusato donations
- [ ] **Money Goals** (and all contributions)
- [ ] Kakeibo entries, budgets, recurrings
- [ ] Remittance log
- [ ] Kakutei wizard draft
- [ ] **Tax checklist** (all years, all items, all notes)

**Intentionally NOT cleared:**
- [ ] Settings (language, theme, payday, default prefecture / municipality, biometric toggle) — by design. Document this in the future if user feedback requests it.
- [ ] **Biometric lock setting** specifically: stays ON across clear-all-data. If you want lock OFF after clearing, toggle it manually.

## 11. Screenshot seed data (for store screenshots)

Capture per `docs/screenshot-checklist.md`. Seed data per scene:

**Scene 1 — Salary / take-home calculator**
- Calculator → seishain, annual ¥4,200,000, Tokyo, age 28, no dependents → "TÍNH TOÁN" → capture ResultCard.

**Scene 2 — Dashboard financial health**
- After Scene 1: add 3 Kakeibo entries (Food ¥1,200 today, Transport ¥800 today, Food ¥2,500 yesterday).
- Set budgets: Food ¥40,000 / Transport ¥15,000 / Entertainment ¥20,000.
- Add recurring Rent ¥80,000 day 1 active.
- Capture Dashboard scrolled so DailySpendingCard hero + chip strip (`Budget 3/3 OK · Nhiều nhất: Ăn uống · Cố định ~19%`) is centered.

**Scene 3 — Kakeibo budget comparison**
- On top of Scene 2: push Food spend to ¥38,700 (warning state, 97% of ¥40k).
- Capture Kakeibo Overview with the Food row in warning orange + safe Transport row.

**Scene 4 — Document deadline reminders**
- Documents → add 在留カード 45 days out (remind 30 days before).
- Add パスポート 180 days out (remind 60 days before).
- Grant notification permission.
- Capture Documents list with both rows + days-left badges, OR Dashboard's UpcomingEventsCard with the residence card.

**Scene 5 — Trip / business budget planner**
- Trip → "Về Tết 2027", leisure, 5 days, 2 months out, planned per §8 above.
- Add 2 actuals (Flight ¥75k under, Gifts ¥55k over).
- Capture trip detail screen with stacked bars + summary card.

**Scene 6 (optional — bonus showing new surfaces)** — Money Goals
- Add goal "Về Tết 2027" / 一時帰国, ¥200,000, deadline = 2027-01-15, monthly ¥25,000.
- Add a few contributions (e.g., ¥40,000 across 3 entries).
- Capture GoalsScreen showing the goal card with category label + health "Đang đúng tiến độ" + progress bar.

**Scene 7 (optional — bonus, tax season only)** — Tax checklist
- Set device clock to Jan 15, 2027.
- Reopen app → Dashboard shows `TaxChecklistReminderCard`. Capture.
- Tap into Kakutei → checklist section. Check 2 of 5 items. Capture.
- Restore device clock.

**Scene 8 (optional)** — Weekly Review
- Need ≥1 Kakeibo entry this week AND ≥1 last week to render.
- After Scene 2's seed data (today's entries + yesterday) the card renders. Capture.

## 12. Known expected-hidden behavior

These should be invisible during normal use; calling them out so they don't get flagged as bugs during smoke:

- **`TaxChecklistReminderCard`** on Dashboard: hidden outside Jan 1 → Mar 15. May 2026 = hidden. To see it, set device clock into the tax-season window.
- **`WeeklyReviewCard`** on Dashboard: hidden when both this week and last week have zero Kakeibo entries. Fresh install = hidden.
- **`TaxChecklistSection`** inside Kakutei: ALWAYS visible at top of the screen regardless of tax season. The Dashboard reminder is the seasonal piece; the section itself is always-accessible from the screen.
- **`BudgetComparisonSection`** inside Kakeibo Overview: hidden when user has zero budgets configured.
- **`FinancialHealthChipRow`** inside DailySpendingCard: hidden when no chips qualify (no budgets, no entries this month, no salary, no recurrings). Each chip independent.
- **`GuidedSetupCard`** on Dashboard: hidden after the user dismisses (X) OR completes all 5 steps. Re-surfaceable from Settings.
- **`GoalsScreen` legacy goals:** any goal stored before PR #50 has no `category` (defaults to `'other'`) and no `status` (derived from contributions). The UI handles this gracefully — no broken layout.
- **Apple Face ID export-compliance form:** does NOT appear in App Store Connect because `ITSAppUsesNonExemptEncryption=false` is set in `app.json`. Confirmed correct for Kakei (uses only OS-level `LocalAuthentication`).

## Pass / fail tally

Use this at the bottom to summarize:

- **§1 Fresh install:** ☐ pass ☐ fail / notes:
- **§2 Biometric lock:** ☐ pass ☐ fail / notes:
- **§3 Dashboard order:** ☐ pass ☐ fail / notes:
- **§4 Kakeibo:** ☐ pass ☐ fail / notes:
- **§5 Money Goals:** ☐ pass ☐ fail / notes:
- **§6 Tax checklist:** ☐ pass ☐ fail / notes:
- **§7 Documents:** ☐ pass ☐ fail / notes:
- **§8 Trip Budget:** ☐ pass ☐ fail / notes:
- **§9 Language switch:** ☐ pass ☐ fail / notes:
- **§10 Clear all data:** ☐ pass ☐ fail / notes:
- **§11 Screenshots captured:** ☐ done ☐ partial / notes:

**Build 7 ship readiness:** ☐ ready to `eas build --profile production --platform all` ☐ block (list reasons)

## Sign-off

| Stage | Owner | Date |
|---|---|---|
| Pre-flight version triple | | |
| Fresh install + onboarding | | |
| Biometric lock (real device) | | |
| Dashboard order | | |
| Feature smoke (Kakeibo / Goals / Tax / Documents / Trip) | | |
| Language switch | | |
| Clear-all-data | | |
| Screenshots captured | | |
| Ready for build 7 | | |
