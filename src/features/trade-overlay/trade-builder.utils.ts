import type { TradeBuilderProps } from './trade-builder.types';

export function clampTradeMoneyInput(value: string, max: number) {
  return Math.max(0, Math.min(max, Math.floor(Number(value) || 0)));
}

export function isEmptyTradeOffer({
  giveMoney,
  getMoney,
  giveCards,
  getCards,
  offerAssets,
  requestAssets,
}: Pick<
  TradeBuilderProps,
  'giveMoney' | 'getMoney' | 'giveCards' | 'getCards' | 'offerAssets' | 'requestAssets'
>) {
  return (
    giveMoney === 0 &&
    getMoney === 0 &&
    giveCards === 0 &&
    getCards === 0 &&
    offerAssets.length === 0 &&
    requestAssets.length === 0
  );
}
