# What's New — 0.3.0 / build 9

Copy-paste-ready release notes for **App Store Connect** ("What to Test" for TestFlight + "What's New in This Version" for the App Store release).

Use the Japanese block as the primary (TestFlight reviewers in Japan + most beta testers are JP-native). Use Vietnamese as the secondary for the localized listing. Use English only as a fallback.

> Character counts verified ≤ 4000 (App Store hard cap). Keep bullets short — most users skim TestFlight notes for under 5 seconds.

---

## 日本語 (primary)

```
バージョン 0.3.0 — 「日本のお金と暮らしのコンパニオン」へアップデート

【新機能】
• 家計簿：カテゴリ別の月予算で使いすぎを防止
• 固定費の自動投入：家賃・通信費を毎月再入力する必要なし
• 貯金目標：パソコン・帰省・結婚式などをトラッキング
• 旅行・出張の予算プランニング（計画 vs 実績）
• 統合カレンダー：給料日・祝日・在留カード期限・確定申告期限を一覧
• 医療費控除・ふるさと納税の入力サポート
• JSONバックアップの書き出し／復元（端末間データ移行）

【改善】
• ダッシュボードを5セクションに整理（畳めるセクションあり）
• タブ構成をすっきり5つに（Home / Kakeibo / 計算 / カレンダー / その他）
• 47都道府県すべてに対応
• 国民健康保険：23区・大阪市以外は手入力可能
• Face ID / Touch IDロック（オプション）
• 令和8年度（FY2026）の健保・厚年レートに対応

データはすべて端末内に保存。サーバーなし、トラッキングなし、広告なし。
```

---

## Tiếng Việt (secondary)

```
Phiên bản 0.3.0 — Tài chính & Cuộc sống ở Nhật, gọn trong một app

[Tính năng mới]
• Sổ chi tiêu Kakeibo với ngân sách tháng theo từng danh mục
• Chi phí cố định lặp hàng tháng (tiền nhà, internet) — tự động ghi
• Mục tiêu tiết kiệm (mua máy, về Tết, đám cưới…)
• Lập kế hoạch chi phí chuyến đi: so sánh kế hoạch vs thực tế
• Lịch tổng hợp: ngày lương, ngày lễ Nhật, hạn 在留カード, hạn thuế
• Theo dõi 医療費控除 và ふるさと納税
• Xuất / nhập bản sao lưu JSON — chuyển sang máy khác dễ dàng

[Cải thiện]
• Trang chủ chia thành 5 nhóm (có thể thu gọn từng nhóm)
• 5 tab gọn gàng (Home / Kakeibo / Tính / Lịch / Thêm)
• Đủ 47 tỉnh thành Nhật Bản
• 国民健康保険: ngoài 23区 và Osaka-shi, có thể tự nhập số tiền
• Khóa Face ID / Touch ID (tuỳ chọn)
• Cải cách thuế FY2026 (令和8年度) — tỷ lệ 健保・厚年 mới nhất

Mọi dữ liệu lưu duy nhất trên thiết bị. Không server, không tracking, không quảng cáo.
```

---

## English (fallback)

```
v0.3.0 — Japan Life & Money Companion

NEW
• Kakeibo monthly budgets per category
• Recurring fixed costs (rent, utilities) auto-post each month
• Savings goals with deadlines (laptop, trip home, wedding…)
• Trip budget planner with planned-vs-actual tracking
• Unified Calendar: paydays, Japanese holidays, residence-card deadlines, tax deadlines
• Medical expense and Furusato Nouzei trackers
• JSON backup export / import for device migration

IMPROVED
• Dashboard regrouped into 5 sections (collapsible)
• Clean 5-tab navigation (Home / Kakeibo / Calculator / Calendar / More)
• All 47 prefectures supported
• National health insurance manual entry for non-23-ku / non-Osaka cities
• Face ID / Touch ID lock (optional)
• FY2026 (Reiwa 8) health + pension insurance rates

All data stays on your device. No servers, no tracking, no ads.
```

---

## TestFlight "What to Test" (shorter — internal/external testers)

For the TestFlight tab specifically. Apple shows this above the "Test" button in the TestFlight app, so keep it tight.

### 日本語
```
0.3.0 ビルド9のテスト項目：

1. ホーム画面のセクション折りたたみ（「最近の傾向」「振り返り」をタップ）
2. 設定 → バックアップ書き出し → 別端末や別シミュレータで復元
3. カレンダータブで日付をタップ → イベント一覧 → 家計簿エントリの削除
4. 計算機で「その他」自治体を選び国保を手入力
5. Face IDロックのON/OFF（対応端末のみ）

不具合報告：設定 → バグ報告 から診断情報をコピーして送付ください。
```

### Tiếng Việt
```
Các điểm cần test cho 0.3.0 build 9:

1. Trang chủ — gập/mở các section "Theo dõi" / "Xu hướng"
2. Cài đặt → Xuất bản sao lưu → Khôi phục trên máy khác hoặc simulator khác
3. Tab Lịch — tap vào ngày → xem event → xóa kakeibo entry
4. Tính lương → chọn "Other" municipality → tự nhập 国保
5. Bật/tắt Face ID lock (chỉ máy hỗ trợ)

Báo lỗi: Cài đặt → Báo lỗi → copy thông tin chẩn đoán rồi gửi cho mình.
```

---

## Alignment with in-app WhatsNewCard

The in-app card (rendered for users on first cold-start of build 9) highlights only 3 hero items — that's intentional to keep the card scannable. The store release notes above are the long-form version.

In-app card items (from `vi.json` / `ja.json` `releaseNotes.v030.items`):
1. **賞与 / Bonus** — bonus calculator updated for FY2026 health + pension rates
2. **Calendar / カレンダー** — new Calendar tab unifying paydays + tax deadlines + plans
3. **Deductions / 控除** — iDeCo, life insurance, spouse special, earthquake, medical deductions

Keep the in-app card and store notes telling the same story — if either gets edited, the other should follow.
