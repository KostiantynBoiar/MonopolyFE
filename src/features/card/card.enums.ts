export enum CardKind {
  CHANCE        = 'chance',
  COMMUNITY_CHEST = 'community_chest',
}

export enum CardFlipState {
  IDLE      = 'idle',
  FLIPPING  = 'flipping',
  REVEALED  = 'revealed',
}

export enum CardEffectType {
  ADVANCE_TO              = 'advance_to',
  ADVANCE_TO_NEAREST      = 'advance_to_nearest',
  GO_TO_JAIL              = 'go_to_jail',
  GO_BACK                 = 'go_back',
  COLLECT                 = 'collect',
  PAY                     = 'pay',
  COLLECT_FROM_EACH_PLAYER = 'collect_from_each_player',
  PAY_EACH_PLAYER         = 'pay_each_player',
  GET_OUT_OF_JAIL_FREE    = 'get_out_of_jail_free',
  REPAIRS                 = 'repairs',
}
