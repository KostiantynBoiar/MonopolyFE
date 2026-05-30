/**
 * Server-computed permissions scoped to the viewer's identity.
 * The UI reflects this set; it never recomputes it.
 */
export type ActionSet = {
  canRoll:        boolean;
  canBuy:         boolean;
  canBuild:       boolean;
  canSellBuildings: boolean;
  canMortgage:    boolean;
  canUnmortgage:  boolean;
  canTrade:       boolean;
  canEndTurn:     boolean;
  canPayJailFine: boolean;
  canUseJailCard: boolean;
  canBid:         boolean;
};
