/**
 * Property cost calculation utilities.
 * Extracted to a separate file for reusability across the application.
 */

/** Cost to build a house or hotel on a property (50% of property price). */
export const buildCost = (price: number): number => Math.floor(price / 2);

/** Refund when selling a house or hotel (25% of property price). */
export const sellRefund = (price: number): number => Math.floor(price / 4);

/** Mortgage value of a property (50% of property price). */
export const mortgageVal = (price: number): number => Math.floor(price / 2);

/** Cost to unmortgage a property (110% of mortgage value ≈ 55% of property price). */
export const unmortgageCost = (price: number): number => Math.ceil(price * 0.55);
