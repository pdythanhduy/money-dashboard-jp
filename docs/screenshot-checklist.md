# Screenshot prep checklist (App Store + Play Console)

5 scenes × 2 locales = **10 screenshots minimum** for v0.2.0 store listing. Capture per locale (vi primary, ja localization). iPhone shots required; iPad shots required because `app.json` has `supportsTablet: true`.

Captions in this file match [`store-copy.md`](store-copy.md) → "Screenshot captions". Update both files together if you tweak wording.

---

## Setup (one-time before capturing)

1. Build a fresh **production** binary (`eas build --profile production --platform ios`) so the icon, splash, and bundle match what users will see.
2. Install on the simulator OR a real device. Real device shots have crisper status bars but the simulator is faster to reset between scenes.
3. **Wipe app data** between scenes — Settings → Xoá toàn bộ → confirm. This ensures each scene starts from a known state.
4. Set the status bar mock to a clean state (iOS simulator: `xcrun simctl status_bar booted override --time 09:41 --batteryState charged --batteryLevel 100 --cellularBars 4 --wifiBars 3`).
5. Capture device chrome via iOS simulator screenshot (`Cmd+S`) or device hardware screenshot.

## Scene order (capture in this order to minimize state resets)

### Scene 1 — Salary / take-home calculator

**Screen:** Calculator tab → result view (after Tính lương).

**Data to seed manually:**
- Onboarding: complete welcome, dismiss GuidedSetupCard.
- Calculator → Annual income: ¥4,200,000 (typical seishain entry-level).
- Job type: 正社員 (seishain).
- Prefecture: Tokyo.
- Age: 28.
- Dependents: none.
- Run "TÍNH TOÁN" / "計算する".

**What to capture:** the ResultCard showing monthly take-home + breakdown list (scrolled to top so the hero number + ¥ amount + first few breakdown lines are visible).

**Caption vi:** "Tính lương thực nhận ở Nhật, đúng theo cải cách thuế mới"
**Caption ja:** "日本での手取り月収を、新しい税制でしっかり計算"

### Scene 2 — Dashboard financial health

**Screen:** Dashboard (main tab) after salary calc + a few Kakeibo entries.

**Data to seed manually (on top of Scene 1):**
- Kakeibo → add 3 expenses: Food ¥1,200 today, Transport ¥800 today, Food ¥2,500 yesterday.
- Kakeibo → Budget edit → Food ¥40,000, Transport ¥15,000, Entertainment ¥20,000.
- Kakeibo → Recurring → add Rent ¥80,000 (day 1, active, autoPost).

**What to capture:** Dashboard scrolled so DailySpendingCard (FinancialHealthCard) is the hero — status pill + today's spend + remaining + chip strip (`Budget 3/3 OK · Nhiều nhất: Ăn uống · Cố định 19%`).

**Caption vi:** "Tài chính cuộc sống — lương, chi tiêu, giấy tờ trong một nơi"
**Caption ja:** "給与・支出・書類を一つに。日々の家計サポート"

> Caption refresh in v1.1 of `store-copy.md` repositions Scene 2 as the "all-in-one Dashboard" hero rather than the daily-spending shot. The daily-spending caption moved to Scene 3 below (no recapture needed — the Dashboard already shows DailySpendingCard immediately below TakeHomeProgressCard).

### Scene 3 — Kakeibo budget comparison

**Screen:** Kakeibo → Overview tab after Scene 2 setup.

**Data to seed manually:** already in place from Scene 2. Add 1 more Food entry of ¥35,000 to push Food close to the limit (¥38,700 / ¥40,000 = 97% → warning state).

**What to capture:** Kakeibo Overview scrolled so the BudgetComparisonSection is visible — Food row in warning state (orange bar) with `¥38,700 / ¥40,000` + caption "Còn lại ¥1,300", plus a safe Transport row + Entertainment row.

**Caption vi:** "Theo dõi ngân sách tháng, không lo \"vỡ kế hoạch\""
**Caption ja:** "月予算と支出を比較、使いすぎを防ぐ"

### Scene 4 — Document deadline reminders

**Screen:** Dashboard upcoming-reminders card OR Documents tab.

**Data to seed manually:**
- Documents → add 在留カード (residence card), expiry date = 45 days from today, remind 30 days before.
- Documents → add パスポート (passport), expiry date = 180 days from today, remind 60 days before.
- (Optional) Grant notification permission when prompted so the bell icon shows "Đã bật".

**What to capture:** Documents tab showing the list with the 2 entries + days-left badges (e.g., "Còn 45 ngày" in orange for residence card, "Còn 180 ngày" in green for passport). Alternatively capture Dashboard with the upcoming-reminders card surfacing the residence card.

**Caption vi:** "Biết mỗi ngày còn được tiêu bao nhiêu"
**Caption ja:** "今日いくら使えるかが一目で分かる"

> v1.1 caption reorder: this Scene 4 slot now narrates the "daily spending" beat (capture the DailySpendingCard hero on Dashboard). The residence-card / visa-deadline messaging migrated into Scene 5 (Calendar — see below), where the upcoming-deadline cell is visible alongside paydays and holidays.

### Scene 5 — Trip / business budget planner

**Screen:** Trip Budget detail screen with planned vs actual.

**Data to seed manually:**
- Trip → Tạo chuyến đi đầu tiên.
- Name: "Về Tết 2027" / "正月帰省 2027".
- Type: leisure.
- Dates: 5 days, starting 2 months from today.
- Planned budgets: Flight ¥80,000, Lodging ¥30,000, Food ¥40,000, Gifts ¥50,000, Transport ¥10,000.
- Add 2 actual expenses: Flight ¥75,000 (booked early — under), Gifts ¥55,000 (overspent).

**What to capture:** Trip detail screen with the planned-vs-actual stacked bars, total summary card on top, and the 2 logged expenses below.

**Caption vi:** "Lịch lương, ngày lễ Nhật và hạn giấy tờ — luôn nhớ"
**Caption ja:** "給料日・祝日・在留カード期限を一覧"

> v1.1: Scene 5 swapped from Trip Budget → Calendar. The Calendar shot is a stronger breadth signal for the "Life & Finance Companion" positioning than the trip-budget detail screen (which surfaces a niche use-case). Trip Budget remains available via the optional 6th capture noted in [`demo-screenshot-flow.md`](demo-screenshot-flow.md).

---

## After capture

1. **Naming convention:** `{locale}-{N}-{scene}.png`, e.g.:
   - `vi-1-calculator.png`, `vi-2-dashboard.png`, ..., `vi-5-trip.png`
   - `ja-1-calculator.png`, ..., `ja-5-trip.png`
2. **Resolution:** iPhone 6.7" display (e.g., iPhone 15 Pro Max simulator) = 1290×2796 PNG. App Store Connect accepts this size as the only required iPhone screenshot size for newer apps.
3. **iPad:** repeat 5 scenes on iPad Pro 13" simulator (2064×2752). Required because `supportsTablet: true`.
4. **No personal data** in any shot — use the seed data above only. No real Apple ID / payment method / receipt numbers.
5. Upload via App Store Connect → My Apps → (Kakei) → Distribution → iOS → Screenshots, per locale.
6. Play Console: Setup → Store presence → Main store listing → Phone (+ Tablet) screenshots, per locale.

## What NOT to do

- **Don't** capture Settings or About screens (no marketing value).
- **Don't** show the GuidedSetupCard in screenshots — it's first-launch-only and looks unfinished in marketing.
- **Don't** include `__DEV__`-only UI (the "Reset onboarding" Settings row, etc.).
- **Don't** show real biometric prompts (Apple has its own UI rules; screenshots of the OS prompt are typically forbidden).

## Sign-off

- [ ] Scene 1 captured (vi)
- [ ] Scene 1 captured (ja)
- [ ] Scene 2 captured (vi)
- [ ] Scene 2 captured (ja)
- [ ] Scene 3 captured (vi)
- [ ] Scene 3 captured (ja)
- [ ] Scene 4 captured (vi)
- [ ] Scene 4 captured (ja)
- [ ] Scene 5 captured (vi)
- [ ] Scene 5 captured (ja)
- [ ] iPad equivalents (10 more) if `supportsTablet: true` stays on
- [ ] Uploaded to App Store Connect
- [ ] Uploaded to Play Console
