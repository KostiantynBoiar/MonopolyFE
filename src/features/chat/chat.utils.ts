import type { ChatMessage } from './chat.types';

export function formatChatTime(ts: number) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(ts);
}

export function getStickerUrl(text: string) {
  const match = text.match(/^\[sticker:(.+?)\]$/);
  return match?.[1] ?? null;
}

export function isTgsSticker(url: string) {
  return url.toLowerCase().endsWith('.tgs');
}

export function clampMessage(text: string) {
  return text.slice(0, 128);
}

export function isOwnMessage(message: ChatMessage, viewerUserId?: string) {
  return Boolean(viewerUserId && message.fromUserId === viewerUserId);
}

export function sameSender(a: ChatMessage, b: ChatMessage) {
  const keyA = a.fromUserId ?? `name:${a.author ?? ''}`;
  const keyB = b.fromUserId ?? `name:${b.author ?? ''}`;
  return keyA === keyB;
}

export function dedupeAndSortChatMessages(messages: ChatMessage[] = []) {
  const seen = new Set<string>();
  return messages
    .filter((message) => (seen.has(message.id) ? false : (seen.add(message.id), true)))
    .sort((a, b) => a.ts - b.ts);
}
