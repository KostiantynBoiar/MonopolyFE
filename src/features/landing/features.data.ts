import type { IconName } from '@/shared/ui';

export type LandingFeature = {
  icon: IconName;
  key: 'realTimeTables' | 'privateRooms' | 'builtInNegotiation';
};

export const landingFeatures: LandingFeature[] = [
  {
    icon: 'activity',
    key: 'realTimeTables',
  },
  {
    icon: 'lock',
    key: 'privateRooms',
  },
  {
    icon: 'chat',
    key: 'builtInNegotiation',
  },
];
