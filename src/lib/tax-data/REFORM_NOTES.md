# Tax Reform Notes (令和7年・令和8年)

Marketing-grade summary of what changed and why it matters. Source material
for blog posts, landing-page copy, and "why this calculator is correct when
others are wrong" claims.

## The 令和7年12月 reform — what changed

A package of personal-tax cuts was passed in December 2025 and applies to
**令和7年 and 令和8年 returns** (i.e. starting with calendar year 2025 income,
filed in 2026). Three of our calculator's data files needed FY2026 values:

### 1. 給与所得控除 floor: ¥550,000 → ¥650,000

The minimum 給与所得控除 (employment income deduction) was raised by
¥100,000. The lowest bracket boundary moved from ¥1,625,000 up to ¥1,900,000.

| Income range          | Old formula              | New formula              |
| --------------------- | ------------------------ | ------------------------ |
| ≤ ¥1,625,000          | ¥550,000 (floor)         | (gone — absorbed below)  |
| ≤ ¥1,800,000 (old)    | income × 40 % − ¥100,000 | (gone)                   |
| ≤ ¥1,900,000 (new)    | (n/a)                    | ¥650,000 (floor)         |
| ≤ ¥3,600,000          | income × 30 % + ¥80,000  | income × 30 % + ¥80,000  |
| ... (above unchanged) | ...                      | ...                      |

### 2. 基礎控除 went from flat ¥480,000 to a tiered table topping out at ¥950,000

Anyone with 合計所得金額 ≤ ¥1,320,000 now gets a ¥950,000 basic deduction —
nearly double the old amount. The benefit shrinks for middle incomes but is
still elevated vs the old flat ¥480k for incomes up to ¥6.55M.

| 合計所得金額         | OLD 基礎控除 | NEW 基礎控除 | Δ        |
| -------------------- | ------------ | ------------ | -------- |
| ≤ ¥1,320,000         | ¥480,000     | ¥950,000     | +¥470,000 |
| ¥1,320,001 – ¥3,360,000 | ¥480,000  | ¥580,000     | +¥100,000 |
| ¥3,360,001 – ¥4,890,000 | ¥480,000  | ¥680,000     | +¥200,000 |
| ¥4,890,001 – ¥6,550,000 | ¥480,000  | ¥630,000     | +¥150,000 |
| ¥6,550,001 – ¥23,500,000 | ¥480,000 | ¥580,000     | +¥100,000 |
| > ¥23,500,000        | (phaseout)   | (phaseout)   | unchanged |

### 3. Working-student income ceiling: ¥750,000 → ¥850,000

勤労学生控除 (¥270k 所得税) now stays available up to ¥850k of total income.

## The "103万円の壁" became the "160万円の壁"

The famous psychological line where a 学生 / 配偶者 starts owing income tax
moved up:

- **OLD threshold**: ¥550,000 (給与所得控除) + ¥480,000 (基礎控除) = **¥1,030,000**
- **NEW threshold**: ¥650,000 (給与所得控除) + ¥950,000 (基礎控除) = **¥1,600,000**

A 勤労学生 stacks an additional ¥270,000 deduction, pushing their personal
break-even to **¥1,870,000** before they owe a yen of 所得税.

> **Caveat to flag in any UI copy:** the 住民税 basic deduction was NOT
> raised — it stays at ¥430,000 with no equivalent tier table. So the
> resident-tax-free threshold is much lower than the income-tax-free
> threshold. Users who pass 所得税 = 0 may still owe 住民税.

## What this means for Vietnamese workers in Japan

Most VN workers we target are in one of three buckets:

1. **Students with バイト income.** The most dramatic winners — many who paid
   tax in 令和6年 will pay zero in 令和7年.
2. **新卒 (first-year salaried)** at ~¥3M. The reform shaves roughly
   ¥10,000 / year off 所得税.
3. **Mid-career salaried** at ¥5M–¥8M. Smaller absolute gain (~¥20–30k) but
   compounded with the new 給与所得控除 floor for the lowest months.

## Why most online calculators are wrong (as of 2026-05)

The 令和7年12月 reform passed late and many web calculators have not been
updated. As of this writing the following common services still use 令和6年
numbers when set to FY2026:

- TODO: collect screenshots and dates from competitor calculators for
  landing-page comparison table.

Our calculator publishes its version manifest in `RATES_VERSION.md` so users
can audit *which* rate is in effect.

## 復興特別所得税 changes from 令和9年 (2027)

For reference (not in scope until 2027):

- 2.1 % → 1.1 %
- End date extended from 令和19年 (2037) → 令和29年 (2047)

When the calendar rolls over to FY2027 we need to:

1. Update `RECONSTRUCTION_SURTAX_RATE` from 0.021 to 0.011.
2. Re-run all four test fixtures and update expected values.
3. Bump `RATES_VERSION.md`.
