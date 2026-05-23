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

## Title / subtitle

### Vietnamese (vi-VN)
- **Title:** Kakei — Lương & Chi tiêu ở Nhật
- **Subtitle:** Tính lương thực nhận, theo dõi chi tiêu, nhắc hạn giấy tờ

### Japanese (ja-JP)
- **Title:** Kakei — 家計・手取り計算 (ベトナム人向け)
- **Subtitle:** 給与・税金・在留期限を一括管理。オフライン保存。

### English (fallback, en-US)
- **Title:** Kakei — Japan Salary & Money for Vietnamese
- **Subtitle:** Take-home pay, daily spending, document deadlines. Offline.

## Positioning lines

### Vietnamese
> Kakei giúp người Việt ở Nhật tính lương thực nhận, theo dõi chi tiêu, quản lý giấy tờ và lập kế hoạch tài chính hằng tháng — dữ liệu chỉ lưu trên máy.

### Japanese
> Kakeiは、日本で暮らすベトナム人向けの家計・手取り・書類期限管理アプリです。データは端末内に保存されます。

### English
> Kakei is the offline money app for Vietnamese workers in Japan. Calculate take-home pay (FY2026 rates), track daily spending, and never miss a residence-card or visa deadline. Your data never leaves your device.

## App description (long-form)

### Vietnamese
```
Kakei là app tính lương Nhật và theo dõi chi tiêu được làm cho người Việt ở Nhật.

✦ Tính chính xác lương thực nhận theo cải cách thuế 令和7年12月 (FY2026)
✦ Theo dõi chi tiêu mỗi ngày, so với ngân sách tháng tự đặt
✦ Nhắc hạn 在留カード, hộ chiếu, visa, マイナンバー — không quên ngày
✦ Lập kế hoạch chuyến đi / công tác với ngân sách theo nhóm
✦ Khóa app bằng Face ID / Touch ID (tuỳ chọn)
✦ 100% offline — không server, không tracking, không quảng cáo

Hỗ trợ 8 tỉnh chính (Tokyo, Osaka, Aichi, Kanagawa, Saitama, Chiba, Hyogo, Fukuoka)
+ 国民健康保険 cho Osaka-shi và 東京23区. Cập nhật cải cách 基礎控除 từ ¥480,000 lên ¥950,000,
ngưỡng 103万 → 160万.

Mọi dữ liệu lưu duy nhất trên thiết bị của bạn. Có nút "Xuất dữ liệu" để
mang đi nơi khác và "Xoá toàn bộ" để xoá sạch bất cứ lúc nào.
```

### Japanese
```
Kakeiは、日本で暮らすベトナム人のための家計・手取り計算アプリです。

✦ 令和7年12月の税制改正に対応した手取り計算（FY2026レート）
✦ 毎日の支出を記録し、月予算と自動比較
✦ 在留カード・パスポート・ビザ・マイナンバーの期限通知
✦ 旅行・出張の予算をカテゴリ別に計画
✦ Face ID / Touch IDでアプリをロック（オプション）
✦ 100%オフライン — サーバーなし、トラッキングなし、広告なし

対応都道府県：東京、大阪、愛知、神奈川、埼玉、千葉、兵庫、福岡
国民健康保険：大阪市、東京23区
新基礎控除（¥950,000）、新「160万円の壁」に対応済み。

データは端末内にのみ保存されます。「データを書き出す」でいつでも持ち出し、
「すべて削除」で完全に削除できます。
```

## Feature bullets (5, for Play Store short description / App Store promo text)

### Vietnamese
1. Tính lương thực nhận chính xác theo cải cách thuế FY2026
2. Sổ chi tiêu hằng ngày so với ngân sách tháng
3. Nhắc hạn thẻ cư trú, visa, hộ chiếu
4. Lập kế hoạch chi phí du lịch / công tác
5. Khóa Face ID + 100% offline, không tracking

### Japanese
1. 令和7年12月改正に対応した手取り計算
2. 月予算と毎日の支出をひと目で比較
3. 在留カード・ビザの期限通知
4. 旅行・出張の予算管理
5. Face IDロック・完全オフライン

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

### Vietnamese
1. Tính lương thực nhận ở Nhật
2. Biết mỗi ngày còn được tiêu bao nhiêu
3. Theo dõi chi tiêu và ngân sách tháng
4. Nhắc hạn thẻ cư trú, visa, hộ chiếu
5. Lập kế hoạch chi phí du lịch / công tác

### Japanese
1. 日本での手取り月収を計算
2. 今日いくら使えるかが一目で分かる
3. 月予算と支出を比較
4. 在留カード・ビザの期限管理
5. 旅行・出張の予算プランニング

### English (fallback)
1. Japan take-home pay, FY2026 rates
2. See how much you can still spend today
3. Track monthly budget vs actual
4. Residence-card and visa reminders
5. Plan trip and business-travel budgets

## Keywords

### Vietnamese (≤ 100 chars combined, comma-separated for App Store)
```
lương nhật, tính lương, chi tiêu, ngân sách, gia đình, người việt ở nhật, kakeibo, visa, hộ chiếu
```

### Japanese (≤ 100 chars)
```
家計簿, 手取り, 給与計算, ベトナム, 在留カード, 予算, 出張, 旅行, オフライン
```

### English (≤ 100 chars)
```
japan salary, take-home, kakeibo, budget, vietnamese, residence card, expat money
```

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
