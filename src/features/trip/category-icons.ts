import type { Ionicons } from '@expo/vector-icons';

import type { TripExpenseCategory } from '@/types/trip-budget';

/** Closed map — must cover every `TripExpenseCategory`. */
export const TRIP_CATEGORY_ICONS: Record<TripExpenseCategory, keyof typeof Ionicons.glyphMap> = {
  transport: 'airplane-outline',
  hotel: 'bed-outline',
  food: 'restaurant-outline',
  shopping: 'bag-outline',
  ticket: 'ticket-outline',
  souvenir: 'gift-outline',
  local_transport: 'train-outline',
  communication: 'wifi-outline',
  insurance: 'shield-outline',
  business: 'briefcase-outline',
  other: 'ellipse-outline',
};
