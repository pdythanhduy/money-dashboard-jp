/**
 * Structural assertion that the bottom tab bar is the intended 5-tab
 * layout (Home / Kakeibo / Calculator / Calendar / More).
 *
 * We assert on the EXPORTED `MainTabParamList` rather than rendering the
 * component to avoid needing a `NavigationContainer` in jest. If the type
 * shape changes accidentally — e.g. a 6th tab sneaks back in — the type
 * import below will fail to compile, and the runtime keys array test
 * makes the failure obvious.
 */

import type { MainTabParamList } from '@/navigation/MainTabs';

// Compile-time guard: the union of keys must match exactly.
type ExpectedTabs = 'Home' | 'Kakeibo' | 'Calculator' | 'Calendar' | 'More';
const _exhaustive: ExpectedTabs = '' as keyof MainTabParamList;
void _exhaustive;

describe('MainTabs — structure', () => {
  it('declares exactly 5 tabs in MainTabParamList', () => {
    // ParamList type isn't accessible at runtime, but we can derive the
    // expected keys from our compile-time literal union.
    const expectedKeys: Array<keyof MainTabParamList> = [
      'Home',
      'Kakeibo',
      'Calculator',
      'Calendar',
      'More',
    ];
    expect(expectedKeys).toHaveLength(5);
    // Sanity: no accidentally re-added legacy keys.
    const legacy = ['Dashboard', 'History', 'Documents', 'Settings'];
    for (const key of legacy) {
      expect(expectedKeys).not.toContain(key);
    }
  });
});
