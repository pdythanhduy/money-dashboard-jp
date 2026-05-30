# Privacy Policy / Chính sách bảo mật / プライバシーポリシー

**Effective date / Ngày hiệu lực / 施行日:** 2026-05-30
**App / Ứng dụng / アプリ:** Kakei (家計) — Money Dashboard JP
**Version / Phiên bản / バージョン:** 0.3.1

---

## English

### 1. Summary

Kakei is a 100% local-first mobile app. All data you enter — income,
expenses, tax inputs, savings goals, remittance history, kakeibo entries,
medical receipts, ふるさと納税 donations, documents, and 確定申告 drafts —
is stored on your device only, inside Expo SQLite and AsyncStorage. We
do not operate a server. We never see your data.

### 2. Data we collect

**None.** Specifically:

- No account / login / signup is required or supported.
- No analytics SDK (e.g. Google Analytics, Firebase Analytics, Amplitude,
  Mixpanel) is bundled.
- No crash reporter (e.g. Sentry, Bugsnag, Crashlytics) is bundled.
- No advertising SDK and no IDFA / Advertising ID is read.
- No cookies, no tracking pixels, no fingerprinting.

### 3. Network requests

The app makes **no automatic network requests** at runtime. The only
network traffic that can originate from the app is initiated by you:

- Tapping a "share" button invokes the OS share sheet. The destination
  app (Mail, Messages, LINE, ...) is outside our control.
- Tapping an external URL (e.g. Privacy Policy, Terms of Service, NTA
  source links in Settings → About) opens your default browser.

### 4. On-device data

The following categories live on your device under app-specific storage,
never transmitted off-device:

- Salary calculator inputs and results (Phase 5B)
- Calculation history (Phase 5D)
- Settings (language, theme, default prefecture, payday, theme) (Phase 5E)
- Onboarding completion flag (Phase 5E)
- Multi-job income entries (Phase 5J)
- Documents (在留カード expiry, etc.) and local notification IDs (Phase 5K)
- Medical expenses (医療費) (Phase 5L)
- ふるさと納税 donations (Phase 5M)
- Savings goals (Phase 5N)
- Kakeibo expense entries and budgets (Phase 5O)
- Remittance transfers (Phase 5P)
- 確定申告 wizard draft (Phase 5Q)

### 5. Your rights

- **Export:** `Settings → Export data` produces a JSON snapshot via the
  OS share sheet. Save it where you wish.
- **Erasure:** `Settings → Clear all data` wipes every store and
  AsyncStorage. A two-stage confirm protects against misfires.
- **Portability:** the exported JSON is human-readable and machine-readable.

### 6. Notifications

The app uses local OS notifications (e.g. document expiry reminders).
These are scheduled by the device's notification subsystem. Permission
is requested only at the moment of first use; you can revoke it any time
via the OS Settings.

### 7. Children

The app is not directed at children under 13.

### 8. Changes

Material changes to this policy will bump the app version and surface a
notice on first launch after update.

### 9. Contact

Repository issues: https://github.com/pdythanhduy/money-dashboard-jp/issues

---

## Tiếng Việt

### 1. Tóm tắt

Kakei là ứng dụng 100% local-first. Mọi dữ liệu bạn nhập — lương, chi
tiêu, đầu vào thuế, mục tiêu tiết kiệm, lịch sử gửi tiền, sổ chi tiêu
hằng ngày, hoá đơn y tế, ふるさと納税, giấy tờ, draft 確定申告 — được
lưu **chỉ trên thiết bị của bạn**, trong Expo SQLite + AsyncStorage.
Chúng tôi không vận hành server. Chúng tôi không bao giờ nhìn thấy dữ
liệu của bạn.

### 2. Dữ liệu thu thập

**Không.** Cụ thể:

- Không cần tài khoản / đăng nhập / đăng ký.
- Không SDK analytics nào được tích hợp.
- Không crash reporter (Sentry, Bugsnag, Crashlytics) nào.
- Không SDK quảng cáo, không đọc IDFA / Advertising ID.
- Không cookies, không tracking pixels, không fingerprinting.

### 3. Network

App **không gửi network request tự động** lúc runtime. Network duy nhất
xảy ra khi bạn chủ động:

- Bấm nút "share" → mở OS share sheet → app đích (Mail, Messages, LINE,
  ...) xử lý phần còn lại.
- Bấm URL bên ngoài (Chính sách bảo mật, Điều khoản, link nguồn NTA
  trong Settings → About) → mở browser mặc định.

### 4. Dữ liệu trên thiết bị

Các nhóm dữ liệu sau lưu trên thiết bị, không bao giờ rời:

- Đầu vào và kết quả Calculator (Phase 5B)
- Lịch sử tính toán (Phase 5D)
- Settings (ngôn ngữ, theme, default prefecture, payday) (Phase 5E)
- Cờ hoàn thành onboarding (Phase 5E)
- Multi-job income (Phase 5J)
- Documents (在留カード hạn) + ID notification (Phase 5K)
- 医療費 (Phase 5L)
- ふるさと納税 donations (Phase 5M)
- Mục tiêu tiết kiệm (Phase 5N)
- Sổ chi tiêu + budgets (Phase 5O)
- Gửi tiền về VN (Phase 5P)
- Draft 確定申告 (Phase 5Q)

### 5. Quyền của bạn

- **Xuất dữ liệu:** `Settings → Xuất dữ liệu` → JSON snapshot qua share sheet.
- **Xoá:** `Settings → Xoá toàn bộ dữ liệu` → wipe mọi store + AsyncStorage.
- **Khả dụng:** JSON xuất ra đọc được bằng người và máy.

### 6. Notification

App dùng local notification (vd nhắc hạn giấy tờ). Permission xin lúc
dùng lần đầu; có thể tắt bất cứ lúc nào trong OS Settings.

### 7. Trẻ em

Không hướng đến trẻ em dưới 13 tuổi.

### 8. Thay đổi

Thay đổi quan trọng sẽ bump app version + hiện thông báo lần mở app
đầu tiên sau update.

### 9. Liên hệ

Issues: https://github.com/pdythanhduy/money-dashboard-jp/issues

---

## 日本語

### 1. 概要

Kakei (家計) は100%ローカルファーストのモバイルアプリです。入力された全
データ — 給与、支出、税計算入力、貯金目標、送金履歴、家計簿、医療費、
ふるさと納税、書類、確定申告ドラフト — はExpo SQLiteとAsyncStorage内、
**端末上のみ** に保存されます。サーバーは運用していません。データを閲
覧することはありません。

### 2. 収集するデータ

**なし。** 具体的には:

- アカウント / ログイン / 登録は不要・未対応。
- アナリティクスSDK (Google Analytics、Firebase Analytics等) は同梱
  していません。
- クラッシュレポーター (Sentry、Crashlytics等) は同梱していません。
- 広告SDKなし。IDFA / Advertising IDの読み取りなし。
- Cookieなし、トラッキングピクセルなし、フィンガープリントなし。

### 3. ネットワーク通信

ランタイムでの **自動ネットワーク通信は一切ありません**。発生し得る通信
は全てユーザー主導です:

- 「共有」ボタン → OS共有シート → 送信先アプリ (メール、Messages、LINE等)
  が制御。
- 外部URLタップ (プライバシーポリシー、利用規約、設定 → アバウト内のNTA
  ソースリンク) → デフォルトブラウザを起動。

### 4. 端末上データ

以下のカテゴリは端末上のアプリ専用領域に保存され、端末外に送信されません:

- 給与計算入力と結果 (Phase 5B)
- 計算履歴 (Phase 5D)
- 設定 (言語、テーマ、デフォルト都道府県、給料日) (Phase 5E)
- オンボーディング完了フラグ (Phase 5E)
- 複数収入源 (Phase 5J)
- 書類 (在留カード有効期限等) + 通知ID (Phase 5K)
- 医療費 (Phase 5L)
- ふるさと納税 (Phase 5M)
- 貯金目標 (Phase 5N)
- 家計簿 + 予算 (Phase 5O)
- ベトナム送金 (Phase 5P)
- 確定申告ドラフト (Phase 5Q)

### 5. ユーザーの権利

- **エクスポート:** `設定 → データ出力` でOS共有シート経由のJSONスナップショット。
- **削除:** `設定 → 全データ削除` で全ストア + AsyncStorageを消去。
- **可搬性:** 出力JSONは人間と機械両方が読める。

### 6. 通知

ローカル通知のみ使用 (例: 書類期限リマインダー)。初回利用時に許可をお願
いします。OS設定からいつでも取消可能。

### 7. 児童

13歳未満を対象としていません。

### 8. 変更

重要な変更はアプリバージョンを更新し、アップデート後初回起動時に通知し
ます。

### 9. お問い合わせ

リポジトリのIssues: https://github.com/pdythanhduy/money-dashboard-jp/issues
