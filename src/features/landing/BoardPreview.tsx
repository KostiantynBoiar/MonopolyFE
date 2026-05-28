const TOP_BAND = [
  'band-brown',
  'band-cyan',
  'band-pink',
  'band-orange',
  'band-red',
  'band-yellow',
  'band-green',
] as const;

const BOTTOM_BAND = [
  'band-blue',
  'band-green',
  'band-yellow',
  'band-red',
  'band-orange',
  'band-pink',
  'band-brown',
] as const;

const RIGHT_BAND = ['band-blue', 'band-orange', 'band-pink', 'band-cyan'] as const;

const LEFT_BAND = ['band-cyan', 'band-pink', 'band-orange', 'band-blue'] as const;

const bandBg: Record<string, string> = {
  'band-brown': 'bg-band-brown',
  'band-cyan': 'bg-band-cyan',
  'band-pink': 'bg-band-pink',
  'band-orange': 'bg-band-orange',
  'band-red': 'bg-band-red',
  'band-yellow': 'bg-band-yellow',
  'band-green': 'bg-band-green',
  'band-blue': 'bg-band-blue',
};

function getCellClass(row: number, col: number): string {
  if (row === 0) return bandBg[TOP_BAND[col]] ?? 'bg-navy-700';
  if (row === 6) return bandBg[BOTTOM_BAND[col]] ?? 'bg-navy-700';
  if (col === 6 && row > 0 && row < 6) return bandBg[RIGHT_BAND[row - 1]] ?? 'bg-navy-700';
  if (col === 0 && row > 0 && row < 6) return bandBg[LEFT_BAND[row - 1]] ?? 'bg-navy-700';
  if (row >= 2 && row <= 4 && col >= 2 && col <= 4) return 'bg-navy';
  return 'bg-navy-700/50';
}

export function BoardPreview() {
  const cells = Array.from({ length: 49 }, (_, index) => {
    const row = Math.floor(index / 7);
    const col = index % 7;
    const isCenterMark = row === 3 && col === 3;

    return (
      <div
        key={index}
        className={`flex items-center justify-center rounded-sm ${getCellClass(row, col)}`}
      >
        {isCenterMark && (
          <span className="font-display text-2xl font-semibold text-gold md:text-4xl">T</span>
        )}
      </div>
    );
  });

  return (
    <div
      className="aspect-square w-full max-w-md justify-self-center rounded-lg bg-navy p-3 shadow-lg md:max-w-none"
      aria-hidden="true"
    >
      <div className="grid h-full w-full grid-cols-7 grid-rows-7 gap-0.5">{cells}</div>
    </div>
  );
}
