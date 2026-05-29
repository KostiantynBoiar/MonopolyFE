export enum TradeStatus {
  PENDING    = 'pending',
  COUNTERED  = 'countered',
  ACCEPTED   = 'accepted',
  REJECTED   = 'rejected',
  CANCELLED  = 'cancelled',
}

export enum TradeParty {
  PROPOSER = 'proposer',
  TARGET   = 'target',
  OBSERVER = 'observer',
}
