/**
 * Property cost calculation utilities.
 *
 * Note: house/hotel build cost is a fixed per-color-group amount stored in
 * board-data.ts (HOUSE_COST), NOT derived from the property purchase price.
 * Do not add a generic buildCost(price) helper here — it would be wrong.
 */

/** Refund when selling a house or hotel (half of its build cost; ≈ 25% of property price). */
export const sellRefund = (price: number): number => Math.floor(price / 4);

/** Mortgage value of a property (50% of property price). */
export const mortgageVal = (price: number): number => Math.floor(price / 2);

/** Cost to unmortgage a property (110% of mortgage value ≈ 55% of property price). */
export const unmortgageCost = (price: number): number => Math.ceil(price * 0.55);
