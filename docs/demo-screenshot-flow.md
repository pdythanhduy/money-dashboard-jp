# Demo screenshot flow

Companion to [`screenshot-checklist.md`](screenshot-checklist.md). That file is the per-scene reference (size, naming, captions). **This file is the narrative** — a single persona and a single ready-to-paste backup JSON that seeds the app so every screenshot tells the same coherent story.

Use this when you need to refresh App Store / Play Store screenshots and don't want to hand-enter 20+ data points scene by scene.

---

## TL;DR — fastest path to a complete set of shots

1. Wipe the app (`Settings → Xoá toàn bộ dữ liệu`) on a 6.7" iPhone simulator.
2. Open `Settings → Khôi phục từ bản sao lưu`, paste the JSON in [§ Seed backup JSON](#seed-backup-json) below, tap preview, confirm.
3. Open the Calculator tab and tap "Tính toán" once with the pre-filled defaults — this fills the Dashboard hero (the seed intentionally leaves `calculatorStore` empty so the user does the live demo).
4. Capture 5 scenes per locale per the order in [§ Capture playbook](#capture-playbook).
5. Toggle `Settings → Ngôn ngữ → 日本語`, re-capture the same 5 scenes in `ja`.

Total time once seeded: ~10 minutes per locale.

---

## Persona

| Locale | Name | Status | Why this persona |
|---|---|---|---|
| `vi` | **Quỳnh** | 正社員 in Tokyo, age 27, year 3 in Japan, no dependents | Largest segment of target users — Vietnamese full-time worker on a 在留資格 visa, paid monthly via 給与所得控除. |
| `ja` | **ハオ** (Hao) | 正社員 in Tokyo, age 27, year 3 in Japan | Mirrors the Vietnamese persona; Japanese reading is for friends/employers who help review the app. |

The same backup JSON works for both — only the in-app `Ngôn ngữ / 言語` setting toggles UI text.

Quỳnh's story (used to drive the data):
- Earns ¥4,800,000/year (≈¥380k take-home/month after tax + 健保 + 厚年).
- Lives in a 1K apartment in 江東区, ¥80,000/month rent.
- Eats out 2–3 times a week, mostly weeknight bento + weekend ramen.
- Saving ¥600,000 for a MacBook (60% there) and ¥800,000 for a Tết-2027 trip home (15% there).
- Has one residence card renewal coming up in 45 days.
- Booked Tết flights early; tracking actuals vs plan.
- Visited a clinic in April, saved the receipt for the 医療費控除.

---

## Seed backup JSON

Paste verbatim into `Settings → Khôi phục từ bản sao lưu`. Schema version 2, app-build 9. Tested against the v0.3.0 import flow.

> **Calendar note:** dates are anchored to a synthetic "today" of **2026-05-28**. If you're capturing more than ~14 days after that anchor, regenerate the file by running the app, adding the same data manually, then `Settings → Xuất bản sao lưu` to get a fresh payload. Otherwise the upcoming-reminder card may show negative days.

```json
{
  "schemaVersion": 2,
  "exportedAt": "2026-05-28T09:00:00.000Z",
  "appVersion": "0.3.0",
  "appBuild": "9",
  "stores": {
    "kakei-settings-v1": "{\"state\":{\"settings\":{\"language\":\"vi\",\"theme\":\"system\",\"payday\":25,\"defaultPrefecture\":\"tokyo\",\"defaultMunicipality\":null,\"notificationsEnabled\":true,\"faceIdEnabled\":false,\"lastSeenReleaseNotesBuild\":\"9\",\"collapsedDashboardSections\":[]}},\"version\":0}",
    "kakei-onboarding-v1": "{\"state\":{\"hasCompletedOnboarding\":true,\"currentSlide\":0,\"hasSeenGuidedSetup\":true,\"completedSteps\":[\"salary\",\"fixedCosts\",\"budget\",\"documents\",\"dailyTracking\"]},\"version\":0}",
    "kakei-kakeibo-v1": "{\"state\":{\"entries\":[{\"id\":\"k-1\",\"date\":\"2026-05-28\",\"amount\":1200,\"category\":\"food\",\"label\":\"Lawson bento\"},{\"id\":\"k-2\",\"date\":\"2026-05-28\",\"amount\":800,\"category\":\"transport\",\"label\":\"JR Suica\"},{\"id\":\"k-3\",\"date\":\"2026-05-27\",\"amount\":2500,\"category\":\"food\",\"label\":\"Ramen\"},{\"id\":\"k-4\",\"date\":\"2026-05-26\",\"amount\":3800,\"category\":\"food\",\"label\":\"Weekend lunch\"},{\"id\":\"k-5\",\"date\":\"2026-05-25\",\"amount\":1200,\"category\":\"entertainment\",\"label\":\"Cafe\"},{\"id\":\"k-6\",\"date\":\"2026-05-22\",\"amount\":4500,\"category\":\"food\",\"label\":\"Groceries\"},{\"id\":\"k-7\",\"date\":\"2026-05-20\",\"amount\":24000,\"category\":\"food\",\"label\":\"Monthly groceries\"}],\"budgets\":[{\"category\":\"food\",\"limit\":40000},{\"category\":\"transport\",\"limit\":15000},{\"category\":\"entertainment\",\"limit\":20000}],\"recurrings\":[{\"id\":\"r-1\",\"name\":\"Tiền nhà\",\"amount\":80000,\"category\":\"housing\",\"dayOfMonth\":1,\"active\":true,\"autoPost\":true,\"lastGeneratedYearMonth\":\"2026-05\"},{\"id\":\"r-2\",\"name\":\"Internet\",\"amount\":4500,\"category\":\"utilities\",\"dayOfMonth\":5,\"active\":true,\"autoPost\":true,\"lastGeneratedYearMonth\":\"2026-05\"},{\"id\":\"r-3\",\"name\":\"Mobile\",\"amount\":3000,\"category\":\"utilities\",\"dayOfMonth\":10,\"active\":true,\"autoPost\":true,\"lastGeneratedYearMonth\":\"2026-05\"}]},\"version\":0}",
    "kakei-goals-v1": "{\"state\":{\"goals\":[{\"id\":\"g-1\",\"title\":\"MacBook Pro\",\"icon\":\"laptop\",\"targetAmount\":600000,\"deadline\":\"2026-09-30\",\"createdAt\":\"2026-02-01T00:00:00.000Z\",\"contributions\":[{\"id\":\"gc-1\",\"goalId\":\"g-1\",\"date\":\"2026-03-01\",\"amountJpy\":100000,\"note\":\"\"},{\"id\":\"gc-2\",\"goalId\":\"g-1\",\"date\":\"2026-04-01\",\"amountJpy\":120000,\"note\":\"\"},{\"id\":\"gc-3\",\"goalId\":\"g-1\",\"date\":\"2026-05-01\",\"amountJpy\":140000,\"note\":\"\"}],\"category\":\"electronics\"},{\"id\":\"g-2\",\"title\":\"Về Tết 2027\",\"icon\":\"airplane\",\"targetAmount\":800000,\"deadline\":\"2027-01-20\",\"createdAt\":\"2026-04-15T00:00:00.000Z\",\"contributions\":[{\"id\":\"gc-4\",\"goalId\":\"g-2\",\"date\":\"2026-05-01\",\"amountJpy\":120000,\"note\":\"\"}],\"category\":\"travel\"}]},\"version\":0}",
    "kakei-documents-v1": "{\"state\":{\"documents\":[{\"id\":\"d-1\",\"kind\":\"residence_card\",\"label\":\"在留カード\",\"expiryDate\":\"2026-07-12\",\"remindDaysBefore\":30,\"createdAt\":\"2026-01-15T00:00:00.000Z\"},{\"id\":\"d-2\",\"kind\":\"passport\",\"label\":\"Hộ chiếu Việt Nam\",\"expiryDate\":\"2026-11-24\",\"remindDaysBefore\":60,\"createdAt\":\"2026-01-15T00:00:00.000Z\"}]},\"version\":0}",
    "kakei-trip-budgets-v1": "{\"state\":{\"trips\":[{\"id\":\"t-1\",\"name\":\"Về Tết 2027\",\"kind\":\"leisure\",\"startDate\":\"2027-01-18\",\"endDate\":\"2027-01-23\",\"createdAt\":\"2026-04-20T00:00:00.000Z\",\"plannedBudgets\":[{\"category\":\"flight\",\"amount\":80000},{\"category\":\"lodging\",\"amount\":30000},{\"category\":\"food\",\"amount\":40000},{\"category\":\"gifts\",\"amount\":50000},{\"category\":\"transport\",\"amount\":10000}],\"actualExpenses\":[{\"id\":\"te-1\",\"date\":\"2026-04-21\",\"category\":\"flight\",\"amount\":75000,\"note\":\"Sky Scanner sale\"},{\"id\":\"te-2\",\"date\":\"2026-05-10\",\"category\":\"gifts\",\"amount\":55000,\"note\":\"Quà cho gia đình\"}]}]},\"version\":0}",
    "kakei-medical-v1": "{\"state\":{\"expenses\":[{\"id\":\"m-1\",\"date\":\"2026-04-14\",\"amount\":3800,\"category\":\"consultation\",\"label\":\"Khám tổng quát\",\"clinic\":\"〇〇クリニック\"}]},\"version\":0}",
    "kakei-furusato-v1": "{\"state\":{\"donations\":[],\"manualLimitOverride\":null}}",
    "kakei-document-deadlines-v1": "{\"state\":{\"documents\":[]}}",
    "kakei-tax-checklist-v1": "{\"state\":{\"items\":{}}}",
    "kakei-multi-job-v1": "{\"state\":{\"jobs\":[]}}",
    "kakei-remittance-v1": "{\"state\":{\"entries\":[],\"annualGoalJPY\":0}}",
    "kakei-kakutei-v1": "{\"state\":{\"draft\":null}}"
  }
}
```

After import, manually run the Calculator once with these inputs to fill the Dashboard:

| Field | Value | Why |
|---|---|---|
| Annual income | `4,800,000` | Typical mid-tier 正社員 income — neither minimum-wage nor edge-case high-earner. |
| Job category | 正社員 (`seishain`) | Matches the persona; triggers 健保 + 厚年 + 雇用保険 + 子ども・子育て support lines. |
| Prefecture | Tokyo | Highest 健保 standard rate; safe nationwide example. |
| Age | `27` | Excludes 介護保険 (40+) so the breakdown is cleaner. |
| Dependents | 0 | Keeps 配偶者控除 / 扶養控除 off so legend stays simple. |

---

## Capture playbook

Capture order minimises navigation churn. Each scene reuses state from the previous one.

| # | Screen | What's hero | Caption (vi) | Caption (ja) |
|---|---|---|---|---|
| **1** | Calculator → ResultCard | Monthly take-home gradient card + donut breakdown | "Tính lương thực nhận ở Nhật" | "日本での手取り月収を計算" |
| **2** | Dashboard scrolled so `TakeHomeProgressCard` is hero, with `WhatsNewCard` already dismissed | Progress bar + stats caption + upcoming-reminders card peeking | "Quản lý lương, chi tiêu và giấy tờ một nơi" | "給与・支出・書類を一つのアプリで" |
| **3** | Dashboard scrolled to Spending section — `DailySpendingCard` + `WeeklyReviewCard` | Today's spend + weekly comparison chip | "Biết mỗi ngày còn được tiêu bao nhiêu" | "今日いくら使えるかが一目で分かる" |
| **4** | Kakeibo → Overview tab → BudgetComparisonSection visible | Food row in warning state (97%) + Transport safe + Entertainment safe | "Theo dõi ngân sách tháng" | "月予算と支出を比較" |
| **5** | Calendar tab on the current month | 25 (payday badge) + a holiday cell + 7+ dotted cells from the seed kakeibo + the upcoming residence-card deadline cell | "Lịch lương, ngày lễ và hạn giấy tờ" | "給料日・祝日・期限を一覧" |

Tap `Goals` from the More tab if you need a 6th hero shot — the seed includes a 60%-progress MacBook goal that photographs well.

---

## Why these data choices

Every value in the seed was picked for a screenshot reason. Don't tweak them casually.

- **¥4.8M income**: lands at ~78% take-home ratio — high enough to feel motivating, not so high that the breakdown legend gets dominated by one slice.
- **Food budget 40k vs 35.2k spent**: hits ~88% which renders in the warning colour without crossing the limit. Lets the BudgetComparisonSection show the orange state without screaming "over budget".
- **MacBook goal 60%**: progress ring at 60% has the most visually-pleasing arc — anything under 25% looks "barely started", anything over 90% looks "almost done, why screenshot it".
- **Residence card 45 days out**: triggers the upcoming-reminder card on Dashboard (default reminder window is 30 days; 45 keeps the card visible without alarm styling).
- **Tết trip Jan-2027**: far enough out that the persona is "planning", close enough that 2 actual expenses are already logged → shows planned-vs-actual stacked bars instead of an empty trip card.
- **One medical receipt only**: just enough to surface the medical-summary card on Dashboard without dominating it. The full 医療費控除 deep-link still appears.

## Variations for additional locales

The same JSON works for `ja` — only `settings.language` controls UI text. To capture in Japanese:

1. Import the JSON (any locale).
2. `Settings → 言語 → 日本語`.
3. Recapture scenes 1-5.

The labels stored in the JSON (`Lawson bento`, `Tiền nhà`, `Hộ chiếu Việt Nam`) stay in Vietnamese — that's intentional. They illustrate the bilingual-input reality (user types Vietnamese labels even on the Japanese UI) and Apple/Google reviewers consistently approve this. If you want clean Japanese-only labels for `ja` screenshots, fork the JSON and replace the `label` fields.

## Optional: in-app demo toggle

Not implemented yet — there is no "Demo mode" switch in Settings. The seed-JSON approach above achieves the same outcome with zero permanent UI surface area and works against shipped production builds. Add a hidden toggle only if QA finds the manual paste step too brittle.

## After the shoot

- Wipe app data: `Settings → Xoá toàn bộ dữ liệu`.
- Confirm no real personal data was on the device during capture (the seed contains only synthetic data).
- Upload via the destinations listed in [`screenshot-checklist.md → After capture`](screenshot-checklist.md#after-capture).

## Maintenance

Whenever a store gains a new persisted field that's user-visible:
1. Add a representative value to the seed JSON above.
2. Re-import the seed locally and verify the new field renders correctly.
3. Note the change at the top of [`screenshot-checklist.md`](screenshot-checklist.md) so the per-scene captures stay in sync.
