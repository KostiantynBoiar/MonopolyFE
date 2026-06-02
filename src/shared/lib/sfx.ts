const cache = new Map<string, HTMLAudioElement>();

const VOLUME = 0.55;

export enum Sfx {
  DiceRoll   = 'dice_roll',
  Notification = 'notification',
  AuctionBid = 'auction_bid',
  PassedGo   = 'passed_go',
  Paid       = 'paid',
}

export type SfxName = `${Sfx}`;

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
