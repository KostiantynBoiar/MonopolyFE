const cache = new Map<string, HTMLAudioElement>();

const VOLUME = 0.55;

// `as const` instead of `enum` — safer with SWC + isolatedModules.
export const Sfx = {
  DICE_ROLL:    'dice_roll',
  NOTIFICATION: 'notification',
  AUCTION_BID:  'auction_bid',
  PASSED_GO:    'passed_go',
  YOUR_TURN:    'your_turn',
  PAID:         'paid',
  CHAT_MESSAGE: 'chat_message',
} as const;

export type Sfx     = typeof Sfx[keyof typeof Sfx];
export type SfxName = Sfx;

export function preloadSfx(...names: SfxName[]) {
  if (typeof window === 'undefined') return;
  for (const name of names) {
    if (!cache.has(name)) {
      const audio = new Audio(`/sfx/${name}.mp3`);
      audio.preload = 'auto';
      cache.set(name, audio);
    }
  }
}

export function playSfx(name: SfxName) {
  if (typeof window === 'undefined') return;
  let audio = cache.get(name);
  if (!audio) {
    audio = new Audio(`/sfx/${name}.mp3`);
    cache.set(name, audio);
  }
  audio.currentTime = 0;
  audio.volume = VOLUME;
  audio.play().catch(() => {});
}
