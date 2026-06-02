import { CornerVariant, SpaceType, TileEdge } from '@/features/game-board/game-board.enums';
import { PropertyColor } from '@/shared/protocol/game-state.enums';
import type { BoardSpace } from '@/features/game-board/game-board.types';
import { N, NW, W } from '@/shared/config/constants';

// Board spaces use Ukrainian city streets and landmarks as property names.
// Grouped by city/region per color: Kyiv-Podil (brown), Kyiv-Obolon (cyan),
// Kyiv-Solomyanka (pink), Kyiv-Pechersk (orange), Lviv (red),
// Odesa (yellow), Kharkiv (green), Kyiv landmarks (blue).
export const BOARD: BoardSpace[] = [
  { pos: 0,  type: SpaceType.CORNER,   name: 'TYCOON',                    corner: CornerVariant.GO },
  { pos: 1,  type: SpaceType.PROPERTY, name: 'вул. Константинівська',      price: 60,  color: PropertyColor.BROWN },
  { pos: 2,  type: SpaceType.CHEST,    name: 'Скарбниця' },
  { pos: 3,  type: SpaceType.PROPERTY, name: 'вул. Іллінська',             price: 60,  color: PropertyColor.BROWN },
  { pos: 4,  type: SpaceType.TAX,      name: 'Прибутковий податок',        price: 200 },
  { pos: 5,  type: SpaceType.RAILROAD, name: 'Ст. Київ-Пасажирський',      price: 200 },
  { pos: 6,  type: SpaceType.PROPERTY, name: 'просп. Оболонський',         price: 100, color: PropertyColor.CYAN },
  { pos: 7,  type: SpaceType.CHANCE,   name: 'Шанс' },
  { pos: 8,  type: SpaceType.PROPERTY, name: 'вул. Тимошенка',             price: 100, color: PropertyColor.CYAN },
  { pos: 9,  type: SpaceType.PROPERTY, name: 'вул. Героїв Дніпра',         price: 120, color: PropertyColor.CYAN },
  { pos: 10, type: SpaceType.CORNER,   name: 'Тюрма',                      corner: CornerVariant.JAIL },
  { pos: 11, type: SpaceType.PROPERTY, name: 'вул. Жилянська',             price: 140, color: PropertyColor.PINK },
  { pos: 12, type: SpaceType.UTILITY,  name: 'Енергетична компанія',       price: 150 },
  { pos: 13, type: SpaceType.PROPERTY, name: 'вул. Велика Васильківська',   price: 140, color: PropertyColor.PINK },
  { pos: 14, type: SpaceType.PROPERTY, name: 'вул. Антоновича',            price: 160, color: PropertyColor.PINK },
  { pos: 15, type: SpaceType.RAILROAD, name: 'Ст. Львів',                  price: 200 },
  { pos: 16, type: SpaceType.PROPERTY, name: 'вул. Інститутська',          price: 180, color: PropertyColor.ORANGE },
  { pos: 17, type: SpaceType.CHEST,    name: 'Скарбниця' },
  { pos: 18, type: SpaceType.PROPERTY, name: 'вул. Липська',               price: 180, color: PropertyColor.ORANGE },
  { pos: 19, type: SpaceType.PROPERTY, name: 'вул. Грушевського',          price: 200, color: PropertyColor.ORANGE },
  { pos: 20, type: SpaceType.CORNER,   name: 'Вільне паркування',          corner: CornerVariant.PARKING },
  { pos: 21, type: SpaceType.PROPERTY, name: 'пл. Ринок',                  price: 220, color: PropertyColor.RED },
  { pos: 22, type: SpaceType.CHANCE,   name: 'Шанс' },
  { pos: 23, type: SpaceType.PROPERTY, name: 'вул. Шевченка (Львів)',       price: 220, color: PropertyColor.RED },
  { pos: 24, type: SpaceType.PROPERTY, name: 'просп. Свободи',             price: 240, color: PropertyColor.RED },
  { pos: 25, type: SpaceType.RAILROAD, name: 'Ст. Харків-Пасажирський',    price: 200 },
  { pos: 26, type: SpaceType.PROPERTY, name: 'вул. Дерибасівська',         price: 260, color: PropertyColor.YELLOW },
  { pos: 27, type: SpaceType.PROPERTY, name: 'Приморський бульвар',        price: 260, color: PropertyColor.YELLOW },
  { pos: 28, type: SpaceType.UTILITY,  name: 'Водоканал',                  price: 150 },
  { pos: 29, type: SpaceType.PROPERTY, name: 'вул. Рішельєвська',          price: 280, color: PropertyColor.YELLOW },
  { pos: 30, type: SpaceType.CORNER,   name: 'До тюрми',                   corner: CornerVariant.GOTO_JAIL },
  { pos: 31, type: SpaceType.PROPERTY, name: 'просп. Науки',               price: 300, color: PropertyColor.GREEN },
  { pos: 32, type: SpaceType.PROPERTY, name: 'вул. Сумська',               price: 300, color: PropertyColor.GREEN },
  { pos: 33, type: SpaceType.CHEST,    name: 'Скарбниця' },
  { pos: 34, type: SpaceType.PROPERTY, name: 'Майдан Свободи',             price: 320, color: PropertyColor.GREEN },
  { pos: 35, type: SpaceType.RAILROAD, name: 'Ст. Одеса-Головна',          price: 200 },
  { pos: 36, type: SpaceType.CHANCE,   name: 'Шанс' },
  { pos: 37, type: SpaceType.PROPERTY, name: 'Хрещатик',                   price: 350, color: PropertyColor.BLUE },
  { pos: 38, type: SpaceType.TAX,      name: 'Податок на розкіш',          price: 100 },
  { pos: 39, type: SpaceType.PROPERTY, name: 'Майдан Незалежності',        price: 400, color: PropertyColor.BLUE },
];

export function getGridPos(pos: number): { col: number; row: number } {
  if (pos <= 10) return { col: 10 - pos, row: 10 };
  if (pos <= 20) return { col: 0, row: 20 - pos };
  if (pos <= 30) return { col: pos - 20, row: 0 };
  return { col: 10, row: pos - 30 };
}

export function getTileEdge(pos: number): TileEdge {
  if (pos % 10 === 0) return TileEdge.CORNER;
  if (pos < 10)       return TileEdge.BOTTOM;
  if (pos < 20)       return TileEdge.LEFT;
  if (pos < 30)       return TileEdge.TOP;
  return TileEdge.RIGHT;
}

/** Returns each intermediate board position (inclusive of `to`, exclusive of `from`) walking clockwise. */
export function getWalkSteps(from: number, to: number): number[] {
  const steps: number[] = [];
  let cur = from;
  while (cur !== to) {
    cur = (cur + 1) % 40;
    steps.push(cur);
  }
  return steps;
}

/** Returns the pixel center of a board tile in the unscaled 686px coordinate space. */
export function getTileCenter(pos: number): { x: number; y: number } {
  const { col, row } = getGridPos(pos);
  const colStart  = col === 0 ? 0 : col === 10 ? W + 9 * NW : W + (col - 1) * NW;
  const rowStart  = row === 0 ? 0 : row === 10 ? W + 9 * N  : W + (row - 1) * N;
  const colWidth  = col === 0 || col === 10 ? W : NW;
  const rowHeight = row === 0 || row === 10 ? W : N;
  return { x: colStart + colWidth / 2, y: rowStart + rowHeight / 2 };
}
