# Manual Test Checklist — v0.2.0

Run before every release. Covers all 17 phases (5A–5Q). Automated tests
(jest, i18n-coverage, a11y-coverage, strict-mode) cover the logic;
this list covers what humans need to eyeball on real devices.

> **Devices:** Run at least once on iOS (any model post-iPhone X for safe-area)
> and once on a mid-range Android (Pixel 6a or similar). Web/Expo Go counts
> as smoke only — not a release blocker by itself.

## Pre-flight

- [ ] `npm install` clean.
- [ ] `npm run typecheck` exits 0.
- [ ] `npm test` exits 0 with ≥ 439 tests.
- [ ] `npx expo export --platform web` succeeds; dist/ size ≤ 4 MB.
- [ ] `app.json` version matches `src/lib/app-info.ts` matches `package.json`.
- [ ] `CHANGELOG.md` has an entry for this version.

---

## Phase 5A — Foundation

- [ ] Cold launch: app reaches Dashboard within 3s on real device.
- [ ] Light + dark theme toggle (Settings → Theme) flips colors without restart.
- [ ] vi → ja language switch (Settings → Language) flips strings without restart.
- [ ] Tab bar shows 5 tabs: Tổng quan / Tính lương / Lịch sử / Giấy tờ / Cài đặt.
- [ ] Force-crash trigger (uncomment a `throw` in a screen, run once) lands on
      `ErrorBoundary` with a recover button.

## Phase 5B — Calculator

- [ ] Enter ¥3,600,000 salary, Tokyo, age 24, no dependents → result card shows
      take-home roughly ¥2.85M / month ≈ ¥237K (sanity check vs RATES_VERSION).
- [ ] Toggle salary → business (freelance): pension + insurance lines switch
      from 厚生年金/協会けんぽ to 国民年金/国保.
- [ ] Add 1 dependent age 16: 扶養控除 ¥380K appears in breakdown.
- [ ] Wall warning triggers at ¥1,030,000 (103万の壁) and ¥1,300,000.
- [ ] Soft warning shows at ¥100,000,001+ (does NOT block submit).

## Phase 5C — Dashboard

- [ ] After a Calculator submit, Dashboard shows proportional take-home for
      today's progress through the month (e.g. day 15 → ~50% of monthly).
- [ ] Greeting changes by hour (morning / afternoon / evening).
- [ ] Payday countdown badge counts down to `settings.payday`.
- [ ] Zero-income explainer renders when last calc rounds to ¥0/month.

## Phase 5D — History

- [ ] After 2+ Calculator submits, History tab lists them DESC by time.
- [ ] Trend chart shows 6 dots max; tap a dot → that entry highlights.
- [ ] Filter chips (Tất cả / Lương / Freelance) work.
- [ ] Edit entry label → label persists after app restart.
- [ ] Delete entry confirms; entry gone after restart.

## Phase 5E — Settings + Onboarding

- [ ] Fresh install: onboarding shows 4 slides; swipe + dots both navigate.
- [ ] "Finish" on slide 4 batches: prefecture + payday persist atomically.
- [ ] Settings → Export data: share sheet shows valid JSON with `schemaVersion: 1`.
- [ ] Settings → Clear all data: type "DELETE" → every store wiped after restart.
- [ ] Onboarding does NOT re-show after restart.

## Phase 5F — Hydration polish

- [ ] No flash of default settings on cold launch (theme + language correct from frame 0).
- [ ] Multi-field batched update (onboarding finish) does NOT cause double render.

## Phase 5G — UX glue

- [ ] After setting `defaultPrefecture = Osaka` in Settings, fresh Calculator
      pre-fills Osaka without manual selection.
- [ ] MunicipalityPicker row in Settings is HIDDEN until first business calc.

## Phase 5H — Multi-job income (Phase 5J in some docs)

- [ ] Add 2 jobs (e.g. 主たる正社員 + コンビニ) → multi-job total appears in Dashboard.
- [ ] Edit hourly rate of job 2 → totals update.
- [ ] Delete job → store updates after restart.

## Phase 5I — Theme expansion + polish

- [ ] Dark theme: text contrast on all surfaces ≥ 4.5:1 (eyeball or contrast checker).
- [ ] System-theme mode flips when OS changes light/dark.

## Phase 5J — Multi-job (advanced)

- [ ] Multi-job MAX cap (5) refuses 6th add with toast / inline message.
- [ ] Multi-job entries persist across cold launches.

## Phase 5K — Documents + expiry reminders

- [ ] Add 在留カード with expiry 30 days out → urgency tier "orange".
- [ ] Expiry 7 days out → urgency tier "red".
- [ ] Expiry 5 days past → urgency tier "expired".
- [ ] Grant notification permission → local reminder scheduled (verify via OS notif center).
- [ ] Revoke notification permission via OS Settings → Settings panel reflects new status.
- [ ] Clear-all-data also cancels scheduled reminders (Settings → Notif center empty after).

## Phase 5L — Medical expenses (医療費控除)

- [ ] Add ¥150,000 in expenses → 医療費控除 calc shows ¥50,000 deductible
      (threshold = ¥100,000 for income > ¥2M).
- [ ] Lower income to ¥1.5M → threshold drops to ¥75,000 → deductible rises.
- [ ] Category filter chips (consult / pharmacy / dental / vision / other) all work.
- [ ] Dashboard medical card surfaces above-threshold refund estimate.

## Phase 5M — ふるさと納税

- [ ] Add 3 donations totalling ¥40,000 → remainingCapacity decreases by ¥40K.
- [ ] LimitCalculator card shows derived 寄付上限 from latest Calculator result.
- [ ] DonationCard sort: most recent date first.

## Phase 5N — Goals & savings tracking

- [ ] Create goal "Mua iPhone 15" with ¥150,000 target, deadline 3 months out.
- [ ] Add ¥10K savings → progress bar updates; monthlyTarget recomputes.
- [ ] Mark deadline in past → wizard shows "Đã quá hạn" + ¥0 monthlyTarget.
- [ ] Completed goal moves below active goals in list.
- [ ] Dashboard surfaces highest-progress active goal.

## Phase 5O — Kakeibo (家計簿)

- [ ] Add 5 expenses across 3 categories → totalSpent + entryCount match.
- [ ] BudgetEditScreen → "Đặt budget tự động" populates 12 rows from take-home.
- [ ] Spend ¥48K of ¥50K food budget → warning chip (severity = warning).
- [ ] Spend ¥55K of ¥50K → over chip (severity = over).
- [ ] Month selector scrubs forward/back; data reflects per-month buckets.
- [ ] Dashboard kakeibo card shows current-month total + percent-of-income.

## Phase 5P — Remittance

- [ ] Add ¥50,000 transfer via Wise at rate 169.5 → list shows 8,475,000 ₫.
- [ ] Edit exchangeRate to 172 → amountVND auto-recomputes.
- [ ] Add 3 transfers across Wise/Remitly/WU → ProviderComparisonCard ranks them
      by effective rate (Wise first if low fee).
- [ ] Single recipient > ¥880K total → 暦年贈与 warning card appears (≥ 80% of threshold).
- [ ] Set annual goal ¥1M → progress bar + monthlyTargetRemaining render.

## Phase 5Q — 確定申告 wizard

- [ ] Without Calculator result: Step 2 shows "open Calculator" CTA.
- [ ] With Calculator result + medical + furusato data: Step 3 lists all auto deductions.
- [ ] Step 4: enter ¥60K life insurance → live preview shows ¥35,000 deduction.
- [ ] Step 4: enter ¥30K earthquake → preview ¥30,000.
- [ ] Step 5: refund case (medical 800K) → green +¥amount.
- [ ] Step 5: due case (no extra deductions, withheld=0) → red ¥amount.
- [ ] Export JSON → share sheet shows valid JSON with all summary fields.
- [ ] Export CSV → share sheet shows valid CSV with header + rows.
- [ ] Save summary → restart app → step 5 still shows saved snapshot.
- [ ] Dashboard kakutei card appears within 90 days of March 15.

## Cross-cutting

- [ ] Hot-swap vi ↔ ja while a modal is open → no crash, text re-renders.
- [ ] Background app for 10 minutes → resume → no white flash, state intact.
- [ ] Airplane mode for the entire test → every feature still works (proves no
      network dep).
- [ ] Settings → Privacy: opens browser to in-repo PRIVACY_POLICY.md (or your hosted URL).
- [ ] Settings → Terms: opens browser to in-repo TERMS_OF_SERVICE.md (or hosted URL).
- [ ] About → Version shows 0.2.0 / build 2.

## Sign-off

| Tester | Device | OS | Date | Result |
| ------ | ------ | -- | ---- | ------ |
|        |        |    |      |        |
