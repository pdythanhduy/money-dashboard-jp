import { selectFeaturedTrip } from '@/lib/trip-dashboard';
import type { TripBudget, TripStatus, TripType } from '@/types/trip-budget';

function trip(overrides: Partial<TripBudget> = {}): TripBudget {
  return {
    id: overrides.id ?? 't1',
    title: overrides.title ?? 'Trip',
    type: (overrides.type ?? 'travel') as TripType,
    status: (overrides.status ?? 'planned') as TripStatus,
    startDate: overrides.startDate ?? '2026-06-10',
    endDate: overrides.endDate ?? '2026-06-12',
    currency: 'JPY',
    plannedItems: overrides.plannedItems ?? [],
    actualExpenses: overrides.actualExpenses ?? [],
    createdAt: overrides.createdAt ?? '2026-05-01T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-05-01T00:00:00.000Z',
  };
}

describe('selectFeaturedTrip', () => {
  const now = new Date(2026, 5, 11); // Jun 11 2026

  it('returns the active trip when one exists', () => {
    const active = trip({ id: 'active', startDate: '2026-06-10', endDate: '2026-06-12' });
    const upcoming = trip({ id: 'upcoming', startDate: '2026-08-01', endDate: '2026-08-03' });
    expect(selectFeaturedTrip([upcoming, active], now)?.id).toBe('active');
  });

  it('falls back to nearest upcoming when no active', () => {
    const soon = trip({ id: 'soon', startDate: '2026-06-15', endDate: '2026-06-18' });
    const later = trip({ id: 'later', startDate: '2026-08-01', endDate: '2026-08-03' });
    expect(selectFeaturedTrip([later, soon], now)?.id).toBe('soon');
  });

  it('falls back to recently-ended (≤ 7 days) when no active / upcoming', () => {
    // Trip ended Jun 8 (3 days ago), within the 7-day window.
    const recent = trip({ id: 'recent', startDate: '2026-06-05', endDate: '2026-06-08' });
    expect(selectFeaturedTrip([recent], now)?.id).toBe('recent');
  });

  it('ignores ended trips older than 7 days', () => {
    // Ended May 1 — way outside the 7-day window.
    const old = trip({ id: 'old', startDate: '2026-04-28', endDate: '2026-05-01' });
    expect(selectFeaturedTrip([old], now)).toBeNull();
  });

  it('ignores cancelled trips even if they would otherwise win', () => {
    const cancelledActive = trip({
      id: 'c-active',
      status: 'cancelled',
      startDate: '2026-06-10',
      endDate: '2026-06-12',
    });
    expect(selectFeaturedTrip([cancelledActive], now)).toBeNull();
  });

  it('returns null on empty list', () => {
    expect(selectFeaturedTrip([], now)).toBeNull();
  });
});
