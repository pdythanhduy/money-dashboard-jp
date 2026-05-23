/**
 * In-memory app-lock state. **Not persisted** — cold launch always
 * re-locks if `faceIdEnabled` is on in settings, regardless of whether
 * the user was unlocked when the process died. Keeps the threat model
 * simple: if you killed the app, you re-auth.
 *
 * `lastBackgroundAt` is a timestamp the AppState listener writes when
 * the app moves to background. On return-to-active, `AppLockGate` checks
 * whether (now - lastBackgroundAt) exceeded `LOCK_TIMEOUT_MS` and re-locks
 * if so. The constant is exported so tests can assert the boundary
 * deterministically.
 */

import { create } from 'zustand';

/** Background → foreground duration after which biometric auth is required again. */
export const LOCK_TIMEOUT_MS = 30_000;

interface AppLockState {
  /** True when the app must show the lock screen instead of children. */
  locked: boolean;
  /** Millisecond timestamp set by AppState background; null when foreground. */
  lastBackgroundAt: number | null;
  lock: () => void;
  unlock: () => void;
  markBackgrounded: (now: number) => void;
  /**
   * Called when the app becomes active again. Returns true if the gate
   * needs to re-prompt for biometric auth (i.e. it just transitioned to
   * locked). Idempotent — second call without a backgrounded interval
   * returns false.
   */
  checkLockOnForeground: (now: number) => boolean;
}

export const useAppLockStore = create<AppLockState>((set, get) => ({
  // Cold launch starts locked iff the consumer (AppLockGate) initializes
  // it to true based on settings.faceIdEnabled. Default false so tests
  // and non-locked flows render children immediately.
  locked: false,
  lastBackgroundAt: null,

  lock: () => set({ locked: true }),
  unlock: () => set({ locked: false, lastBackgroundAt: null }),

  markBackgrounded: (now) => set({ lastBackgroundAt: now }),

  checkLockOnForeground: (now) => {
    const { locked, lastBackgroundAt } = get();
    if (locked) return false; // already locked; gate handles re-prompt
    if (lastBackgroundAt === null) return false;
    if (now - lastBackgroundAt < LOCK_TIMEOUT_MS) {
      // Within grace window — clear the background timestamp and stay unlocked.
      set({ lastBackgroundAt: null });
      return false;
    }
    set({ locked: true, lastBackgroundAt: null });
    return true;
  },
}));
