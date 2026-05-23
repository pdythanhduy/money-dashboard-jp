import { LOCK_TIMEOUT_MS, useAppLockStore } from '@/store/appLockStore';

beforeEach(() => {
  useAppLockStore.setState({ locked: false, lastBackgroundAt: null });
});

describe('appLockStore', () => {
  it('starts unlocked with no background timestamp', () => {
    expect(useAppLockStore.getState().locked).toBe(false);
    expect(useAppLockStore.getState().lastBackgroundAt).toBeNull();
  });

  it('lock() sets locked = true', () => {
    useAppLockStore.getState().lock();
    expect(useAppLockStore.getState().locked).toBe(true);
  });

  it('unlock() clears locked and lastBackgroundAt', () => {
    useAppLockStore.setState({ locked: true, lastBackgroundAt: 12_345 });
    useAppLockStore.getState().unlock();
    expect(useAppLockStore.getState().locked).toBe(false);
    expect(useAppLockStore.getState().lastBackgroundAt).toBeNull();
  });

  it('markBackgrounded stores the timestamp', () => {
    useAppLockStore.getState().markBackgrounded(99_999);
    expect(useAppLockStore.getState().lastBackgroundAt).toBe(99_999);
  });

  describe('checkLockOnForeground', () => {
    it('returns false and stays unlocked when foreground duration is under LOCK_TIMEOUT_MS', () => {
      const t0 = 1_000_000;
      useAppLockStore.getState().markBackgrounded(t0);
      const justUnder = t0 + LOCK_TIMEOUT_MS - 1;
      const triggered = useAppLockStore.getState().checkLockOnForeground(justUnder);
      expect(triggered).toBe(false);
      expect(useAppLockStore.getState().locked).toBe(false);
      expect(useAppLockStore.getState().lastBackgroundAt).toBeNull();
    });

    it('returns true and locks when foreground duration meets LOCK_TIMEOUT_MS', () => {
      const t0 = 1_000_000;
      useAppLockStore.getState().markBackgrounded(t0);
      const atBoundary = t0 + LOCK_TIMEOUT_MS;
      const triggered = useAppLockStore.getState().checkLockOnForeground(atBoundary);
      expect(triggered).toBe(true);
      expect(useAppLockStore.getState().locked).toBe(true);
      expect(useAppLockStore.getState().lastBackgroundAt).toBeNull();
    });

    it('returns false when never backgrounded (cold path on first launch)', () => {
      const triggered = useAppLockStore.getState().checkLockOnForeground(Date.now());
      expect(triggered).toBe(false);
      expect(useAppLockStore.getState().locked).toBe(false);
    });

    it('returns false when already locked (gate is responsible for the re-prompt, not this method)', () => {
      useAppLockStore.setState({ locked: true, lastBackgroundAt: 0 });
      const triggered = useAppLockStore.getState().checkLockOnForeground(LOCK_TIMEOUT_MS + 1);
      expect(triggered).toBe(false);
      expect(useAppLockStore.getState().locked).toBe(true);
    });
  });
});
