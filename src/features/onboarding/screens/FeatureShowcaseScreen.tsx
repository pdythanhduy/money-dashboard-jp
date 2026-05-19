import type { Ionicons } from '@expo/vector-icons';

import { OnboardingSlide } from '@/features/onboarding/components/OnboardingSlide';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  bullets: string[];
}

export function FeatureShowcaseScreen({ icon, title, bullets }: Props) {
  return <OnboardingSlide icon={icon} title={title} bullets={bullets} />;
}
