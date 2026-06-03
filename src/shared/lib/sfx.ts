const cache = new Map<string, HTMLAudioElement>();

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

// Per-sound volumes. Sounds that fire frequently or are secondary cues sit
// lower so they don't compete with primary feedback.
const SFX_VOLUME: Record<SfxName, number> = {
  dice_roll:    0.65,  // main action — prominent
  notification: 0.50,  // general alert
  auction_bid:  0.25,  // rapid-fire during bidding, keep moderate
  passed_go:    0.70,  // celebratory moment, slightly louder
  your_turn:    0.60,  // personal cue, clear but not jarring
  paid:         0.45,  // background feedback
  chat_message: 0.05,  // very quick / frequent — barely audible
};

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

export function playSfx(name: SfxName, volume = SFX_VOLUME[name]) {
  if (typeof window === 'undefined') return;
  let audio = cache.get(name);
  if (!audio) {
    audio = new Audio(`/sfx/${name}.mp3`);
    cache.set(name, audio);
  }
  audio.currentTime = 0;
  audio.volume = Math.max(0, Math.min(1, volume));
  audio.play().catch(() => {});
}
