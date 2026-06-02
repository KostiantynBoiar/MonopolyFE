const cache = new Map<string, HTMLAudioElement>();

const VOLUME = 0.55;

export type SfxName = 'dice_roll' | 'notification' | 'auction_bid' | 'passed_go' | 'paid';

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
