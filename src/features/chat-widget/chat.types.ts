import type { TokenColor } from '@/shared/protocol/game-state.enums';
import type { LogEntry } from '@/shared/protocol/game-state';

export interface ChatMessage {
  id: string;
  kind: 'chat' | 'event';
  /** Sender's user id — the source of truth for "is this mine" (tokens aren't unique). */
  fromUserId?: string;
  author?: string;
  token?: TokenColor;
  text: string;
  ts: number;
}

export interface ChatWindowProps {
  log: LogEntry[];
  /** Live, server-sourced chat messages from ALL players (reactive). */
  externalMessages?: ChatMessage[];
  viewerToken?: TokenColor;
  /** Authenticated viewer's user id — used to right-align the viewer's own messages. */
  viewerUserId?: string;
  onSendMessage?: (text: string) => void;
  onSendSticker?: (url: string) => void;
}

export interface StickerPack {
  id: string;
  name: string;
  stickers: string[];
}
