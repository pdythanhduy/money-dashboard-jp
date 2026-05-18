# Manual Test Checklist

Things that can't be covered by Jest — must be verified by a human on a real
device (or simulator) per sub-phase. Tick items as you go.

Run: `npx expo start`, scan QR with Expo Go on iOS + Android.

## Conventions

- Test on **both** iOS and Android when possible — system font fallback,
  safe-area insets, and dark-mode switching differ.
- "Locale switch" = device-level language change in iOS/Android Settings,
  then re-open Expo Go (app reads `expo-localization` on startup).
- A failure here is a real bug — copy/paste the failing line into a new
  GitHub issue with device + OS version + screenshot.

---

## Phase 5A — Design system, navigation, i18n

### Navigation
- [ ] All 4 tabs are visible at the bottom: **Tổng quan, Tính lương, Lịch sử, Cài đặt**
- [ ] Tapping each tab switches screens — no flash, no crash
- [ ] Tab icons render correctly (home / calculator / chart / settings)
- [ ] Active tab tint = brand navy (light mode) or brand blue (dark mode)
- [ ] Inactive tab tint = neutral gray, clearly distinguishable from active

### Theme switching
- [ ] iOS: Settings → Display & Brightness → toggle Dark Mode. Re-foreground
      the app. UI re-renders in dark palette (background near-black, text near-white)
- [ ] Android: Settings → Display → Dark theme. Same expected behavior
- [ ] StatusBar text color flips (dark text on light, light text on dark)
- [ ] No light-mode color leaks visible in dark mode (especially tab bar
      background, large-title color, placeholder icon tint)

### i18n — Vietnamese
- [ ] All 4 tab labels show Vietnamese diacritics correctly: **ổ ổ ổng, í, ị, ử, à, ặ**
- [ ] Large-title on each screen displays correctly (e.g. "Tổng quan", not "T?ng quan")
- [ ] Placeholder text "Coming soon" appears under each icon

### i18n — Japanese
- [ ] Switch device language to **日本語** (iOS: Settings → General → Language & Region;
      Android: Settings → System → Languages). Re-open Expo Go.
- [ ] Tab labels switch to: **ダッシュボード, 給与計算, 履歴, 設定**
- [ ] Large-titles switch
- [ ] Placeholder = **近日公開**
- [ ] Glyphs render without tofu (□) — kanji, hiragana, katakana all OK
- [ ] iOS: font is Hiragino Sans (visually rounded, modern)
- [ ] Android: font is Noto Sans CJK JP (system fallback)

### Safe-area
- [ ] iPhone with notch / Dynamic Island: large-title not hidden under status bar
- [ ] iPhone with home indicator: tab bar floats above the indicator (no overlap)
- [ ] Android with display cutout: same as above

### Smoke
- [ ] No red error overlay in Expo Go
- [ ] Metro logs show no `Module not found` / `Cannot resolve module` warnings
- [ ] Cold start under ~3 seconds on a modern phone

---

## Phase 5B — Calculator form + result (PLANNED)

### Income type selector
- [ ] Segmented control or two-tap toggle: **Salary (給与)** vs **Business (事業)**
- [ ] Selecting a type updates the form below (e.g. salary shows prefecture
      picker, business shows municipality picker)
- [ ] Selection persists across screen re-renders during the same session

### Form input
- [ ] Annual income field: accepts only digits; rejects letters, commas typed
      manually (formatter inserts commas on its own)
- [ ] Age field: 0 ≤ value ≤ 120; rejects 999, -1, "abc"
- [ ] Prefecture picker: shows the 8 supported (Tokyo, Osaka, Aichi, Kanagawa,
      Saitama, Chiba, Hyogo, Fukuoka) — Japanese names + Vietnamese subtitles
- [ ] Municipality picker (business only): Osaka-shi, Tokyo 23区
- [ ] Spouse checkbox: when ON, reveals spouse age input
- [ ] Dependents: add/remove rows, each row has age input
- [ ] Working student checkbox: visible only if age ≤ 30 (UX nicety, not legal)

### Validation
- [ ] Empty income → "Required" message under field, submit disabled
- [ ] Income = 0 → "Must be > 0" message (matches calculator validation)
- [ ] hasSpouse without spouseAge → blocks submit with inline message
- [ ] Unsupported prefecture → impossible to choose (picker enumerates supported)

### Submit + result
- [ ] Tap "Tính" → spinner shows briefly, then ResultCard appears
- [ ] Take-home monthly displayed prominently in large numeric type
- [ ] Tax breakdown lists each line (所得税, 住民税, 健保, 厚年, 雇用) with
      proper currency formatting (¥1,234,567 with grouping)
- [ ] Switch input → tap recalculate → result updates (no stale state)

---

## Phase 5C — Visualization (PLANNED)

### Donut chart
- [ ] Renders with 4 slices: net take-home, income tax, resident tax, social insurance
- [ ] Slice colors match theme palette (brand, danger, warning, neutral)
- [ ] Center shows take-home amount in large numeric type
- [ ] Tapping a slice highlights it + shows label

### Animated counter
- [ ] Take-home number counts up from 0 to final value over ~600ms when result first appears
- [ ] No jank (60fps on modern phones, gracefully degrades on older)
- [ ] Animation runs only on first show, not on every re-render

### Breakdown display
- [ ] Expandable rows for each deduction category
- [ ] Tax breakdown shows: gross income → 給与所得控除 → 給与所得 →
      課税所得 → bracket applied → 所得税 + 復興税
- [ ] Social insurance shows: monthly income → 標準報酬月額 grade →
      employer/employee split → annual employee total
- [ ] Source link to NTA / 協会けんぽ shown at bottom of each calc
