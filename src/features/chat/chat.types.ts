import { type TokenColor } from '@/features/player-panel';
import { ActionKey } from './chat.enums';

export type ChatMessage = {
  id: string;
  kind: 'chat' | 'event';
  author?: string;
  token?: TokenColor;
  text: string;
  ts: number;
};

export type ChatLogProps = {
  messages: ChatMessage[];
};

export type DiceRoll = {
  die1: number;
  die2: number;
  isDoubles: boolean;
};

export type StickerPack = {
  id: string;
  name: string;
  stickers: string[];
};

export type Action = {
  key: ActionKey;
  label: string;
  primary?: boolean;
  enabled: boolean;
  handler?: () => void;
};

export type BoardCenterPanelProps = {
  messages: ChatMessage[];
  diceRoll?: DiceRoll | null;
  isRolling?: boolean;
  canRoll?: boolean;
  canBuy?: boolean;
  canBuild?: boolean;
  canTrade?: boolean;
  onRoll?: () => void;
  onBuy?: () => void;
  onBuild?: () => void;
  onTrade?: () => void;
  onSendMessage?: (text: string) => void;
};