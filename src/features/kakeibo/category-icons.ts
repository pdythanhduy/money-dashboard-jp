import type { Ionicons } from '@expo/vector-icons';

import type { ExpenseCategory } from '@/lib/kakeibo-math';

/** Closed map: must cover every member of `ExpenseCategory`. */
export const CATEGORY_ICONS: Record<ExpenseCategory, keyof typeof Ionicons.glyphMap> = {
  rent: 'home-outline',
  food: 'restaurant-outline',
  utilities: 'flash-outline',
  communication: 'wifi-outline',
  transport: 'train-outline',
  entertainment: 'game-controller-outline',
  health: 'medkit-outline',
  shopping: 'bag-outline',
  education: 'school-outline',
  savings: 'wallet-outline',
  remittance: 'paper-plane-outline',
  other: 'ellipse-outline',
};
