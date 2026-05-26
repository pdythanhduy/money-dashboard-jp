import {
  aggregateCalendarEvents,
  indexEventsByDate,
  type AggregatorSources,
} from '@/features/calendar/lib/event-aggregator';

const emptySources: AggregatorSources = {
  kakeibo: [],
  medical: [],
  furusato: [],
  remittance: [],
  trips: [],
  documents: [],
  documentDeadlines: [],
  recurringExpenses: [],
};

describe('aggregateCalendarEvents', () => {
  it('returns [] when all sources empty', () => {
    expect(aggregateCalendarEvents(emptySources, 2026)).toEqual([]);
  });

  it('aggregates one event from each source kind', () => {
    const events = aggregateCalendarEvents(
      {
        ...emptySources,
        kakeibo: [
          { id: 'k1', date: '2026-05-12', amount: 1_200, category: 'food', label: 'Lawson' },
        ],
        medical: [
          { id: 'm1', date: '2026-05-13', amount: 5_000, category: 'doctor_visit' },
        ],
        furusato: [
          {
            id: 'f1',
            date: '2026-05-14',
            amount: 10_000,
            targetMunicipality: '大阪市',
          },
        ],
        remittance: [
          {
            id: 'r1',
            date: '2026-05-15',
            amountJPY: 50_000,
            feeJPY: 500,
            exchangeRate: 169.5,
            amountVND: 8_475_000,
            provider: 'wise',
            recipient: 'Mẹ',
          },
        ],
      },
      2026,
    );
    expect(events.map((e) => e.kind)).toEqual([
      'kakeibo_expense',
      'medical_expense',
      'furusato_donation',
      'remittance',
    ]);
  });

  it('filters out events from other years', () => {
    const events = aggregateCalendarEvents(
      {
        ...emptySources,
        kakeibo: [
          { id: 'k1', date: '2025-12-31', amount: 1_000, category: 'food' },
          { id: 'k2', date: '2026-01-01', amount: 1_000, category: 'food' },
          { id: 'k3', date: '2027-01-01', amount: 1_000, category: 'food' },
        ],
      },
      2026,
    );
    expect(events).toHaveLength(1);
    expect(events[0]!.id).toBe('kakeibo-k2');
  });

  it('expands trip date range into per-day events', () => {
    const events = aggregateCalendarEvents(
      {
        ...emptySources,
        trips: [
          {
            id: 't1',
            title: 'Kyoto',
            type: 'travel',
            status: 'planned',
            startDate: '2026-06-10',
            endDate: '2026-06-12',
            currency: 'JPY',
            plannedItems: [],
            actualExpenses: [],
            createdAt: '',
            updatedAt: '',
          },
        ],
      },
      2026,
    );
    expect(events.map((e) => e.date)).toEqual(['2026-06-10', '2026-06-11', '2026-06-12']);
  });

  it('skips trips with status="cancelled"', () => {
    const events = aggregateCalendarEvents(
      {
        ...emptySources,
        trips: [
          {
            id: 't1',
            title: 'Cancelled',
            type: 'travel',
            status: 'cancelled',
            startDate: '2026-06-10',
            endDate: '2026-06-12',
            currency: 'JPY',
            plannedItems: [],
            actualExpenses: [],
            createdAt: '',
            updatedAt: '',
          },
        ],
      },
      2026,
    );
    expect(events).toHaveLength(0);
  });

  it('fans out one recurring expense into 12 monthly events, clamping day-31 to month-end', () => {
    const events = aggregateCalendarEvents(
      {
        ...emptySources,
        recurringExpenses: [
          {
            id: 'r1',
            name: 'Rent',
            amount: 80_000,
            category: 'rent',
            dayOfMonth: 31,
            active: true,
            autoPost: true,
            createdAt: '',
          },
        ],
      },
      2026,
    );
    expect(events).toHaveLength(12);
    // Feb 2026 has 28 days → expect clamp to 28
    expect(events.find((e) => e.date.startsWith('2026-02'))?.date).toBe('2026-02-28');
    // June 2026 has 30 days → expect clamp to 30
    expect(events.find((e) => e.date.startsWith('2026-06'))?.date).toBe('2026-06-30');
  });

  it('skips inactive recurring expenses', () => {
    const events = aggregateCalendarEvents(
      {
        ...emptySources,
        recurringExpenses: [
          {
            id: 'r1',
            name: 'Paused Netflix',
            amount: 1_490,
            category: 'entertainment',
            dayOfMonth: 1,
            active: false,
            autoPost: true,
            createdAt: '',
          },
        ],
      },
      2026,
    );
    expect(events).toHaveLength(0);
  });

  it('returns events sorted by date ascending', () => {
    const events = aggregateCalendarEvents(
      {
        ...emptySources,
        kakeibo: [
          { id: 'k2', date: '2026-05-20', amount: 1, category: 'food' },
          { id: 'k1', date: '2026-05-10', amount: 1, category: 'food' },
          { id: 'k3', date: '2026-05-15', amount: 1, category: 'food' },
        ],
      },
      2026,
    );
    expect(events.map((e) => e.date)).toEqual(['2026-05-10', '2026-05-15', '2026-05-20']);
  });
});

describe('indexEventsByDate', () => {
  it('groups events by date for O(1) lookup', () => {
    const map = indexEventsByDate([
      {
        id: 'a',
        date: '2026-05-10',
        kind: 'kakeibo_expense',
        labelKey: 'calendar.events.kakeibo',
      },
      {
        id: 'b',
        date: '2026-05-10',
        kind: 'medical_expense',
        labelKey: 'calendar.events.medical',
      },
      {
        id: 'c',
        date: '2026-05-11',
        kind: 'remittance',
        labelKey: 'calendar.events.remittance',
      },
    ]);
    expect(map.get('2026-05-10')).toHaveLength(2);
    expect(map.get('2026-05-11')).toHaveLength(1);
    expect(map.get('2026-05-12')).toBeUndefined();
  });
});
