/**
 * Trip / business-trip budget model.
 *
 * Phase 6A is JPY-only (no FX, no receipt image, no OCR, no maps).
 * A trip carries:
 *
 *   plannedItems  — what the user expected to spend, by category
 *   actualExpenses — what they actually spent, dated
 *   companyAdvanceAmount — for `business` trips, the amount the company
 *                          pre-paid; settles against `reimbursable` actuals
 *
 * The pure math lib (`@/lib/trip-budget-math`) turns this into summary,
 * comparison, daily series, lifecycle status, and insights.
 */

export type TripType = 'travel' | 'business' | 'home_visit' | 'other';

export type TripStatus = 'planned' | 'active' | 'completed' | 'cancelled';

export type TripExpenseCategory =
  | 'transport'
  | 'hotel'
  | 'food'
  | 'shopping'
  | 'ticket'
  | 'souvenir'
  | 'local_transport'
  | 'communication'
  | 'insurance'
  | 'business'
  | 'other';

export const ALL_TRIP_TYPES: readonly TripType[] = [
  'travel',
  'business',
  'home_visit',
  'other',
];

export const ALL_TRIP_EXPENSE_CATEGORIES: readonly TripExpenseCategory[] = [
  'transport',
  'hotel',
  'food',
  'shopping',
  'ticket',
  'souvenir',
  'local_transport',
  'communication',
  'insurance',
  'business',
  'other',
];

export interface TripPlanItem {
  id: string;
  category: TripExpenseCategory;
  label?: string;
  plannedAmount: number;
  note?: string;
}

export interface TripActualExpense {
  id: string;
  /** ISO date "YYYY-MM-DD". */
  date: string;
  category: TripExpenseCategory;
  amount: number;
  label?: string;
  note?: string;
  /** Mainly for business trips — flagged to settle against companyAdvanceAmount. */
  reimbursable?: boolean;
}

export interface TripBudget {
  id: string;
  title: string;
  type: TripType;
  status: TripStatus;
  destination?: string;
  /** ISO "YYYY-MM-DD". */
  startDate: string;
  endDate: string;
  /** Phase 6A: JPY only. Extend later for VND/USD if needed. */
  currency: 'JPY';
  plannedItems: TripPlanItem[];
  actualExpenses: TripActualExpense[];
  /** Company advance / per-diem for business trips. 0 or undefined → none. */
  companyAdvanceAmount?: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}
