jest.mock('@react-native-async-storage/async-storage', () => {
  let storage: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((k: string) => Promise.resolve(storage[k] ?? null)),
      setItem: jest.fn((k: string, v: string) => {
        storage[k] = v;
        return Promise.resolve();
      }),
      removeItem: jest.fn((k: string) => {
        delete storage[k];
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        storage = {};
        return Promise.resolve();
      }),
    },
  };
});

jest.mock('expo-crypto', () => {
  let n = 0;
  return { randomUUID: jest.fn(() => `job-${++n}`) };
});

import { MAX_JOBS, useMultiJobStore } from '@/store/multiJobStore';
import type { HourlyJobInput } from '@/lib/hourly-wage-calculator';

const sampleInput: HourlyJobInput = { hourlyRate: 1_200, hoursPerDay: 8, daysPerWeek: 5 };

beforeEach(() => {
  useMultiJobStore.setState({ jobs: [] });
});

describe('multiJobStore.addJob', () => {
  it('returns added=true with an id', () => {
    const r = useMultiJobStore.getState().addJob('Combini sáng', sampleInput);
    expect(r.added).toBe(true);
    expect(r.job?.id).toMatch(/^job-/);
    expect(r.job?.name).toBe('Combini sáng');
    expect(useMultiJobStore.getState().jobs).toHaveLength(1);
  });

  it('refuses to add past MAX_JOBS', () => {
    for (let i = 0; i < MAX_JOBS; i++) {
      useMultiJobStore.getState().addJob(`Job ${i}`, sampleInput);
    }
    const r = useMultiJobStore.getState().addJob('Overflow', sampleInput);
    expect(r.added).toBe(false);
    expect(r.reason).toBe('limit_reached');
    expect(useMultiJobStore.getState().jobs).toHaveLength(MAX_JOBS);
  });
});

describe('multiJobStore.updateJob', () => {
  it('mutates only the matching id', () => {
    const { addJob, updateJob } = useMultiJobStore.getState();
    const a = addJob('A', sampleInput).job!;
    const b = addJob('B', sampleInput).job!;
    updateJob(a.id, { name: 'A renamed' });
    const jobs = useMultiJobStore.getState().jobs;
    expect(jobs.find((j) => j.id === a.id)?.name).toBe('A renamed');
    expect(jobs.find((j) => j.id === b.id)?.name).toBe('B');
  });
});

describe('multiJobStore.removeJob + clearAll', () => {
  it('remove takes out one, clearAll wipes', () => {
    const { addJob, removeJob, clearAll } = useMultiJobStore.getState();
    const a = addJob('A', sampleInput).job!;
    addJob('B', sampleInput);
    removeJob(a.id);
    expect(useMultiJobStore.getState().jobs).toHaveLength(1);
    clearAll();
    expect(useMultiJobStore.getState().jobs).toEqual([]);
  });
});
