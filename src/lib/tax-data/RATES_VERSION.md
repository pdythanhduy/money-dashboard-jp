# Rates Version Manifest

Last verified: **2026-05-18**
App fiscal year: **令和8年度 (FY2026)** — 2026-04-01 → 2027-03-31

This file is the single source of truth for "where every rate came from."
If a rate value in `src/lib/tax-data/*.ts` does not match a row here, the data
file is wrong. When updating, replace the file value AND bump the row below.

## Update calendar

| Rate group              | Typically published | Action window         |
| ----------------------- | ------------------- | --------------------- |
| 国民年金保険料           | Late Jan – early Feb | Update by mid-Feb     |
| 協会けんぽ 都道府県別     | Early Feb (effective March) | Update by 1 Mar |
| 雇用保険料率             | Mid-Feb (effective April)   | Update by 1 Apr |
| 介護保険料率 (協会けんぽ) | Same as 協会けんぽ          | Same                  |
| 所得税 / 給与所得控除     | December tax reform (税制改正大綱) | Per reform |
| 住民税                   | Same as 所得税              | Per reform            |
| 国民健康保険 (市町村)     | March – April               | Update by end of Apr  |

## All rates

| Rate                         | File                         | FY    | Value                            | Source                                                                                              | Status |
| ---------------------------- | ---------------------------- | ----- | -------------------------------- | --------------------------------------------------------------------------------------------------- | ------ |
| 所得税 7 brackets             | income-tax-brackets.ts       | 2026  | 5/10/20/23/33/40/45 %            | https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2260.htm                                    | ✅ verified |
| 復興特別所得税               | income-tax-brackets.ts       | 2026  | 2.1 % (→ 1.1 % from 令和9年)     | https://www.all-senmonka.jp/moneyizm/money/314224/                                                  | ✅ verified |
| 給与所得控除 (reformed)       | employment-income-deduction.ts | 2026 | floor ¥650k, cap ¥1.95M           | https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1410.htm                                    | ✅ verified |
| 基礎控除 所得税 (reformed)    | basic-deduction.ts           | 2026  | tiered ¥0–¥950k                  | https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1199.htm                                    | ✅ verified |
| 基礎控除 住民税 (unchanged)   | basic-deduction.ts           | 2026  | flat ¥430k (phaseout >¥24M)      | https://biz.moneyforward.com/payroll/basic/111924/                                                  | ✅ verified |
| 配偶者控除                   | other-deductions.ts          | 2026  | ¥380k general / ¥480k 70+        | https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1191.htm                                    | ✅ verified |
| 扶養控除                     | other-deductions.ts          | 2026  | ¥380k / ¥630k / ¥580k / ¥480k    | https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1180.htm                                    | ✅ verified |
| 勤労学生控除                  | other-deductions.ts          | 2026  | ¥270k (income cap ¥850k)         | https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1175.htm                                    | ✅ verified |
| 標準報酬月額 grade table      | standard-remuneration.ts     | 2026  | 50 grades ¥58k–¥1.39M            | https://www.cells.co.jp/hyoujyun/hyoujyunhousyu.php                                                 | ✅ verified |
| 健康保険 東京                 | kenpo-rates.ts               | 2026  | 9.85 %                           | https://www.kyoukaikenpo.or.jp/about/business/insurance_rate/rate_prefectures/r08/index.html        | ✅ verified |
| 健康保険 大阪                 | kenpo-rates.ts               | 2026  | 10.13 %                          | (同上)                                                                                              | ✅ verified |
| 健康保険 愛知                 | kenpo-rates.ts               | 2026  | 9.93 %                           | (同上)                                                                                              | ✅ verified |
| 健康保険 神奈川               | kenpo-rates.ts               | 2026  | 9.92 %                           | (同上)                                                                                              | ✅ verified |
| 健康保険 埼玉                 | kenpo-rates.ts               | 2026  | 9.67 %                           | (同上)                                                                                              | ✅ verified |
| 健康保険 千葉                 | kenpo-rates.ts               | 2026  | 9.73 %                           | (同上)                                                                                              | ✅ verified |
| 健康保険 兵庫                 | kenpo-rates.ts               | 2026  | 10.12 %                          | (同上)                                                                                              | ✅ verified |
| 健康保険 福岡                 | kenpo-rates.ts               | 2026  | 10.11 %                          | (同上)                                                                                              | ✅ verified |
| 介護保険 (全国一律)           | kenpo-rates.ts               | 2026  | 1.62 % (age 40-64)               | (同上)                                                                                              | ✅ verified |
| 厚生年金 (固定)              | pension.ts                   | 2026  | 18.3 % total / 9.15 % employee   | https://www.nenkin.go.jp/service/kounen/hokenryo/hoshu/20150515-01.html                             | ✅ verified |
| 国民年金 月額                 | pension.ts                   | 2026  | ¥17,920/month (+¥410 vs FY25)    | https://seikatsunomado.com/2026/01/24/令和8年度の年金額/                                            | ✅ verified |
| 雇用保険 (一般事業) 労働者    | employment-insurance.ts      | 2026  | 0.5 % (DOWN from 0.6 % in FY25)  | https://www.chukidan.jp/navi/column/insurance/13837/ — https://www.mhlw.go.jp/content/001692566.pdf | ✅ verified |
| 住民税 所得割                 | resident-tax.ts              | 2026  | 10 % (4 % 都 + 6 % 区)           | https://www.tax.metro.tokyo.lg.jp/kazei/kojin_ju.html                                               | ✅ verified |
| 住民税 均等割                 | resident-tax.ts              | 2026  | ¥5,000/year (incl. 森林環境税)   | (同上)                                                                                              | ✅ verified |
| 国保 大阪市 (4 components)    | kokuho-rates.ts              | 2026  | 医療 9.50 / 支援 3.06 / 介護 2.60 / 子 0.28 % | https://www.city.osaka.lg.jp/fukushi/cmsfiles/contents/0000007/7173/R7-2-4-3_houkoku2.pdf | ✅ verified |
| 国保 東京23区 (3 components, unified) | kokuho-rates.ts      | 2026  | 基礎 7.51 / 支援 2.80 / 介護 2.43 %       | https://www.city.nerima.tokyo.jp/kurashi/nenkinhoken/kokuminkenkohoken/hoken_hokenryo/keisan_hoho.html | ✅ verified |

## Skipped in Phase 1 (revisit later)

- **協会けんぽ 子ども・子育て支援金率** 0.23 % (FY2026) — collected via the
  same payroll structure but the official guidance on employee-portion impact
  is still settling. Once treatment confirmed, add to `kenpo-rates.ts`.
- **青色申告特別控除** (¥100k / ¥550k / ¥650k) for freelance — needs a UI
  toggle for filing method. Phase 1 assumes standard ¥0.
- **配偶者特別控除** — spouse income between ¥580k and ¥1.33M.
- **iDeCo / 小規模企業共済等掛金控除, 生命保険料控除, 地震保険料控除, 医療費控除,
  寡婦・ひとり親控除, 障害者控除** — additional 所得控除 not modeled.
- **Non-general industry 雇用保険** (agriculture, construction, sake brewing).
- **Prefectural 住民税 surcharges** like 神奈川県 ¥300 水源環境税.
