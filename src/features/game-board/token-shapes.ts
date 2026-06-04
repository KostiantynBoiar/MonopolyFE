// Material Design 3 "Expressive" shape silhouettes for player tokens.
//
// Every shape is baked into a single SVG path string on a 0..100 viewBox,
// centred on (50, 50). Tokens render the path as a clip (for avatars) and as a
// fill + ring (for plain colour tokens), so the token's outline IS the shape.
//
// Paths are generated once at module load from a few composable geometry
// helpers — keeping each helper to one job — and frozen into TOKEN_SHAPE_PATH.

import { seededShuffle } from '@/shared/lib/seeded-random';

export enum TokenShape {
  CIRCLE = 'circle',
  TRIANGLE = 'triangle',
  SQUARE = 'square',
  PENTAGON = 'pentagon',
  SLANTED = 'slanted',
  SUNNY = 'sunny',
  COOKIE_4 = 'cookie4',
  COOKIE_6 = 'cookie6',
  GEM = 'gem',
  GHOSTISH = 'ghostish',
}

// ─── Geometry primitives ─────────────────────────────────────────────────────

interface Point {
  x: number;
  y: number;
}

const CENTER = 50;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Vertices of a regular polygon, first vertex placed at `rotationDeg`. */
function regularPolygonPoints(sides: number, radius: number, rotationDeg: number): Point[] {
  const rotation = (rotationDeg * Math.PI) / 180;
  return Array.from({ length: sides }, (_, i) => {
    const angle = rotation + (i * 2 * Math.PI) / sides;
    return {
      x: CENTER + radius * Math.cos(angle),
      y: CENTER + radius * Math.sin(angle),
    };
  });
}

/** Shear points horizontally around the centre — turns a square into a slant. */
function shearX(points: Point[], k: number): Point[] {
  return points.map((p) => ({ x: p.x + k * (p.y - CENTER), y: p.y }));
}

function unit(from: Point, to: Point): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

/** Closed polygon with straight edges and arc-rounded corners. */
function roundedPolygonPath(points: Point[], cornerRadius: number): string {
  const n = points.length;
  const entries: Point[] = [];
  const exits: Point[] = [];

  for (let i = 0; i < n; i++) {
    const v = points[i];
    const prev = points[(i - 1 + n) % n];
    const next = points[(i + 1) % n];
    // Clamp the cut so adjacent corners never overlap on short edges.
    const r = Math.min(cornerRadius, Math.hypot(prev.x - v.x, prev.y - v.y) / 2, Math.hypot(next.x - v.x, next.y - v.y) / 2);
    const toPrev = unit(v, prev);
    const toNext = unit(v, next);
    entries.push({ x: v.x + toPrev.x * r, y: v.y + toPrev.y * r });
    exits.push({ x: v.x + toNext.x * r, y: v.y + toNext.y * r });
  }

  let d = `M ${round2(exits[0].x)} ${round2(exits[0].y)}`;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    d += ` L ${round2(entries[j].x)} ${round2(entries[j].y)}`;
    d += ` Q ${round2(points[j].x)} ${round2(points[j].y)} ${round2(exits[j].x)} ${round2(exits[j].y)}`;
  }
  return `${d} Z`;
}

/** Plain circle as a two-arc path. */
function circlePath(radius: number): string {
  const left = CENTER - radius;
  const right = CENTER + radius;
  return `M ${left} ${CENTER} A ${radius} ${radius} 0 1 0 ${right} ${CENTER} A ${radius} ${radius} 0 1 0 ${left} ${CENTER} Z`;
}

/** Smooth closed path through points via Catmull-Rom → cubic Bézier. */
function smoothClosedPath(points: Point[]): string {
  const n = points.length;
  let d = `M ${round2(points[0].x)} ${round2(points[0].y)}`;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${round2(c1x)} ${round2(c1y)} ${round2(c2x)} ${round2(c2y)} ${round2(p2.x)} ${round2(p2.y)}`;
  }
  return `${d} Z`;
}

/** Scalloped "flower" — radius oscillates between rMax (lobe) and rMin (valley). */
function flowerPath(lobes: number, rMax: number, rMin: number): string {
  const mid = (rMax + rMin) / 2;
  const amp = (rMax - rMin) / 2;
  const steps = lobes * 6; // dense enough that the Catmull-Rom reads as smooth
  const points: Point[] = Array.from({ length: steps }, (_, i) => {
    const angle = (i * 2 * Math.PI) / steps - Math.PI / 2;
    const r = mid + amp * Math.cos(lobes * (angle + Math.PI / 2));
    return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) };
  });
  return smoothClosedPath(points);
}

/** Classic ghost: domed top, straight sides, three scalloped feet. */
function ghostishPath(): string {
  const left = 14;
  const right = 86;
  const shoulder = 50; // where the dome meets the vertical sides
  const foot = 80;
  const bumpWidth = (right - left) / 3;
  let d = `M ${left} ${shoulder}`;
  d += ` A 36 36 0 0 1 ${right} ${shoulder}`; // dome over the top
  d += ` L ${right} ${foot}`; // right side down
  for (let i = 0; i < 3; i++) {
    const x = right - bumpWidth * (i + 1);
    d += ` Q ${round2(x + bumpWidth / 2)} ${foot + 14} ${round2(x)} ${foot}`; // foot scallops, right→left
  }
  return `${d} L ${left} ${shoulder} Z`;
}

// ─── Baked path table ────────────────────────────────────────────────────────

const R = 44; // outer radius, leaves room for the stroke ring within the viewBox

export const TOKEN_SHAPE_PATH: Record<TokenShape, string> = Object.freeze({
  [TokenShape.CIRCLE]: circlePath(R),
  [TokenShape.TRIANGLE]: roundedPolygonPath(regularPolygonPoints(3, R, -90), 10),
  [TokenShape.SQUARE]: roundedPolygonPath(regularPolygonPoints(4, R, 45), 12),
  [TokenShape.PENTAGON]: roundedPolygonPath(regularPolygonPoints(5, R, -90), 9),
  [TokenShape.SLANTED]: roundedPolygonPath(shearX(regularPolygonPoints(4, R, 45), 0.26), 12),
  [TokenShape.SUNNY]: flowerPath(8, R, 37),
  [TokenShape.COOKIE_4]: flowerPath(4, R, 26),
  [TokenShape.COOKIE_6]: flowerPath(6, R, 31),
  [TokenShape.GEM]: roundedPolygonPath(regularPolygonPoints(6, R, -90), 7),
  [TokenShape.GHOSTISH]: ghostishPath(),
});

/** Canonical ordering — also the pool that gets shuffled per game. */
export const TOKEN_SHAPE_ORDER: readonly TokenShape[] = Object.freeze([
  TokenShape.CIRCLE,
  TokenShape.TRIANGLE,
  TokenShape.SQUARE,
  TokenShape.PENTAGON,
  TokenShape.SLANTED,
  TokenShape.SUNNY,
  TokenShape.COOKIE_4,
  TokenShape.COOKIE_6,
  TokenShape.GEM,
  TokenShape.GHOSTISH,
]);

export function resolveTokenShape(gameId: string, turnOrder: number): TokenShape {
  const shuffled = seededShuffle(TOKEN_SHAPE_ORDER, gameId);
  return shuffled[turnOrder % shuffled.length];
}
