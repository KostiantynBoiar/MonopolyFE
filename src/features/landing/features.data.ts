import type { IconName } from '@/shared/ui';

export type LandingFeature = {
  icon: IconName;
  title: string;
  body: string;
};

export const landingFeatures: LandingFeature[] = [
  {
    icon: 'activity',
    title: 'Real-time tables',
    body: 'Live game state synced across every seat. Moves, rolls, and trades update instantly for all players.',
  },
  {
    icon: 'lock',
    title: 'Private rooms',
    body: 'Create a session and share an invite code. Only players with the code can join your table.',
  },
  {
    icon: 'chat',
    title: 'Built-in negotiation',
    body: 'Propose trades in-session without leaving the board. Offers and counter-offers stay in the game flow.',
  },
];
