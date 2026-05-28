# Store copy (App Store / Play Store)

Single source of truth for store-front text. Update here first, then mirror into App Store Connect / Play Console screens. All Vietnamese / Japanese strings should also exist in `src/locales/{vi,ja}.json` if they appear inside the app — store copy is purely external.

---

## App identity

| Field | Value |
|---|---|
| Display name (Apple + Google) | **Kakei** |
| Internal SKU / bundle id | `com.kakei.moneydashboardjp` (iOS), `com.kakei.moneydashboardjp` (Android) |
| Category (App Store) | Finance |
| Category (Play Store) | Finance |
| Content rating | 4+ / Everyone (no UGC, no ads, no purchases) |
| Languages | Vietnamese (primary), Japanese, English (fallback) |

## Positioning

**One-line product description**, used to anchor everything below:

> Life & Finance Companion for Vietnamese in Japan.

Past versions framed Kakei as "the salary calculator". As of v0.3+, the app spans calculator, kakeibo, monthly budget, money goals, trip budgets, residence-card reminders, medical receipts, ふるさと納税, and a unified calendar — far beyond a calculator. Copy below should reflect that breadth without losing the (still load-bearing) take-home-pay value prop.

## Title / subtitle

### Vietnamese (vi-VN)
- **Title:** Kakei — Tài chính & Cuộc sống ở Nhật
- **Subtitle:** Lương, chi tiêu, mục tiêu, giấy tờ — một app, offline

### Japanese (ja-JP)
- **Title:** Kakei — 家計サポート (ベトナム人向け)
- **Subtitle:** 給与・支出・目標・書類を一つに。オフライン保存。

### English (fallback, en-US)
- **Title:** Kakei — Japan Life & Money Companion
- **Subtitle:** Salary, spending, goals, documents — one app, offline.

> **Char-budget reminder:** App Store subtitle is hard-capped at 30 chars; Play Store short description at 80 chars. The Japanese subtitle above is 26 chars (safe). Vietnamese is 53 chars (Play OK; for App Store subtitle use the shorter "Lương, chi tiêu, giấy tờ — offline" = 35 chars and append goals into the long description).

## Positioning lines (one-paragraph elevator pitch)

### Vietnamese
> Kakei là người bạn tài chính dành cho người Việt sống ở Nhật. Một app duy nhất cho lương thực nhận, sổ chi tiêu, mục tiêu tiết kiệm, kế hoạch chuyến đi và nhắc hạn 在留カード — tất cả lưu duy nhất trên máy của bạn.

### Japanese
> Kakeiは、日本で暮らすベトナム人のための家計コンパニオンです。手取り計算、家計簿、貯金目標、旅行予算、在留カードの期限管理を一つのアプリで。データは端末内のみに保存されます。

### English
> Kakei is the everyday money companion for Vietnamese living in Japan. One app for take-home pay, daily spending, savings goals, trip budgets, and residence-card reminders — every byte stays on your device.

## App description (long-form)

Lead with the companion framing, then back it with concrete features. Calculator is one bullet, not the headline.

### Vietnamese
```
Kakei là người bạn tài chính dành cho người Việt sống ở Nhật.
Một app duy nhất cho mọi việc liên quan đến tiền và cuộc sống hằng ngày.

LƯƠNG & THUẾ
✦ Tính lương thực nhận chính xác theo cải cách thuế 令和7年12月 (FY2026)
✦ Hỗ trợ cả 正社員 lẫn フリーランス (国民健康保険)
✦ Cảnh báo "vách lương" 103万 / 130万 / 160万 / 201万

CHI TIÊU HÀNG NGÀY
✦ Sổ chi tiêu (kakeibo) so với ngân sách tháng tự đặt
✦ Chi phí cố định lặp hàng tháng — không cần nhập lại
✦ Tổng kết tuần, biểu đồ xu hướng 6 tháng

MỤC TIÊU & KẾ HOẠCH
✦ Đặt mục tiêu tiết kiệm (mua máy, về quê, đám cưới...)
✦ Lập kế hoạch chi phí chuyến đi (du lịch / công tác)
✦ Theo dõi ふるさと納税 và 医療費控除

GIẤY TỜ & LỊCH
✦ Nhắc hạn 在留カード, hộ chiếu, visa, マイナンバー
✦ Lịch tổng hợp ngày lương, ngày lễ Nhật, hạn nộp thuế
✦ Bật/tắt thông báo nhắc trong Cài đặt

BẢO MẬT & RIÊNG TƯ
✦ Khóa app bằng Face ID / Touch ID (tuỳ chọn)
✦ Xuất / nhập bản sao lưu JSON để chuyển máy
✦ 100% offline — không server, không tracking, không quảng cáo

Hỗ trợ đủ 47 tỉnh thành Nhật Bản, song ngữ Tiếng Việt / 日本語.
Mọi dữ liệu lưu duy nhất trên thiết bị của bạn.
```

### Japanese
```
Kakeiは、日本で暮らすベトナム人のための家計コンパニオンです。
お金と生活に関わるあらゆる場面を、一つのアプリで。

給与・税金
✦ 令和7年12月改正に対応した手取り計算（FY2026レート）
✦ 正社員・フリーランス（国民健康保険）の両方に対応
✦ 103万・130万・160万・201万の「壁」アラート

毎日の家計
✦ 月予算と支出を自動比較する家計簿
✦ 固定費の自動投入、再入力不要
✦ 週次サマリー、6ヶ月トレンドグラフ

目標・プランニング
✦ 貯金目標（パソコン購入、帰省、結婚式など）
✦ 旅行・出張の予算プランニング
✦ ふるさと納税・医療費控除のトラッキング

書類・カレンダー
✦ 在留カード・パスポート・ビザ・マイナンバーの期限通知
✦ 給料日・祝日・確定申告期限を一つのカレンダーに
✦ 通知の有効・無効は設定画面から

セキュリティとプライバシー
✦ Face ID / Touch IDでアプリをロック（オプション）
✦ JSONバックアップで端末間移行
✦ 100%オフライン — サーバーなし、トラッキングなし、広告なし

47都道府県に対応、ベトナム語・日本語のバイリンガル。
データは端末内にのみ保存されます。
```

## Feature bullets (5, for Play Store short description / App Store promo text)

The first bullet sets the framing. Don't lead with "calculator" — lead with the breadth.

### Vietnamese
1. Lương, chi tiêu, mục tiêu, giấy tờ — gọn trong một app
2. Tính lương thực nhận theo cải cách thuế FY2026
3. Ngân sách tháng + chi phí cố định lặp tự động
4. Nhắc hạn 在留カード, visa, hộ chiếu
5. 100% offline, không tracking, mở khóa Face ID

### Japanese
1. 給与・支出・目標・書類を一つのアプリで
2. 令和7年12月改正に対応した手取り計算
3. 月予算と固定費の自動投入
4. 在留カード・ビザの期限通知
5. 完全オフライン、Face IDロック対応

## Privacy-first section

### Vietnamese
> **Quyền riêng tư tuyệt đối**
>
> Kakei không có tài khoản, không server, không phân tích. Mọi thứ bạn nhập — lương, chi tiêu, giấy tờ — chỉ lưu trên máy của bạn. Có nút xuất dữ liệu và xoá sạch trong Cài đặt.

### Japanese
> **完全プライベート**
>
> Kakeiにはアカウントもサーバーも分析もありません。給与・支出・書類などのデータはすべて端末内に保存され、外部に送信されることはありません。設定からいつでも書き出し・削除できます。

### English
> **Private by design.** No account, no server, no analytics. Your salary, expenses, and documents stay on your device. Export anytime or wipe everything from Settings.

## Screenshot captions (5 — match the captured order)

Captions are reordered for the v1.1 positioning: the Dashboard (the "companion" hero) is scene 2; the Calendar (the breadth shot) is scene 5. The new captions trade per-feature accuracy for emotional framing — App Store reviewers and store browsers spend ~1 second per caption, and "feels like a companion" sells the app better than feature lists.

### Vietnamese
1. Tính lương thực nhận ở Nhật, đúng theo cải cách thuế mới
2. Tài chính cuộc sống — lương, chi tiêu, giấy tờ trong một nơi
3. Biết mỗi ngày còn được tiêu bao nhiêu
4. Theo dõi ngân sách tháng, không lo "vỡ kế hoạch"
5. Lịch lương, ngày lễ Nhật và hạn giấy tờ — luôn nhớ

### Japanese
1. 日本での手取り月収を、新しい税制でしっかり計算
2. 給与・支出・書類を一つに。日々の家計サポート
3. 今日いくら使えるかが一目で分かる
4. 月予算と支出を比較、使いすぎを防ぐ
5. 給料日・祝日・在留カード期限を一覧

### English (fallback)
1. Japan take-home pay, FY2026 reform-ready
2. Salary, spending and documents in one place
3. See how much you can still spend today
4. Stay under monthly budget without overthinking it
5. Paydays, holidays and residence-card deadlines, unified

> See [`screenshot-checklist.md`](screenshot-checklist.md) for the per-scene seed data. The companion narrative + ready-to-paste backup JSON lives in [`demo-screenshot-flow.md`](demo-screenshot-flow.md). Keep all three files' captions in sync with this section.

## Keywords

App Store Connect keywords field is hard-capped at 100 characters per locale (includes commas + spaces). Counts below verified.

### Vietnamese (98 / 100 chars)
```
lương nhật,kakeibo,chi tiêu,ngân sách,mục tiêu,visa,trong nhật,người việt,tài chính
```

### Japanese (95 / 100 chars)
```
家計簿,手取り,給与計算,ベトナム,在留カード,予算,目標,旅行,医療費,オフライン,生活
```

### English (98 / 100 chars)
```
japan,salary,kakeibo,budget,goals,trip,residence card,vietnamese,life,money,offline
```

**Keyword rationale** — v1.1 adds: `mục tiêu` / `目標` / `goals` (highlights money-goals feature), `tài chính` / `生活` / `life` (companion framing), `trip` / `旅行` (trip-budget feature). Drops: `家族` / `gia đình` (not the primary use-case anymore), `expat money` (low-volume English search). Apple ASO rule of thumb: lifestyle-adjacent keywords boost discoverability for the broader "money in Japan" search intent without competing against giant kakeibo apps on their core terms.

## What's NOT in the copy

- **No "free" claim** — paid/free TBD per release.
- **No "AI" / "smart" claims** — the app is rule-based.
- **No "tax-filing" claim** — estimates only; the Terms repeat this.
- **No medical / immigration advice claim** — Documents is a reminder list, not legal/medical advice.
- **No comparative claims** vs. other Japanese money apps.

## Versioning

When the store-front strings change, bump the doc-only header below and mirror to App Store Connect + Play Console in the same release window.

| Version of this doc | Date | Changed |
|---|---|---|
| 1.0.0 | 2026-05-23 | Initial release copy for v0.2.0. |
| 1.1.0 | 2026-05-28 | Reposition from "salary calculator" → "Life & Finance Companion in Japan". Refreshed title, subtitle, long description (now grouped: Salary/Tax · Daily · Goals · Documents · Privacy), feature bullets (lead with breadth), keywords (add `mục tiêu` / `目標` / `life`; drop `gia đình` / `expat money`), and screenshot captions (scene 2 now showcases the all-in-one Dashboard). Companion document [`demo-screenshot-flow.md`](demo-screenshot-flow.md) provides a single seed JSON for capture. |
