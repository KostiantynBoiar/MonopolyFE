const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8002';

// Derive WS base from API URL: http → ws, https → wss
const wsUrl = apiUrl.replace(/^http/, 'ws');

export const env = {
  apiUrl,
  wsUrl,
  telegramBotName: process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME ?? '',
  logLevel: process.env.NEXT_PUBLIC_LOG_LEVEL,
  // When set (NEXT_PUBLIC_DEBUG_GAME_ROOM=1), logs every committed game snapshot to the console.
  debugGameRoom: process.env.NEXT_PUBLIC_DEBUG_GAME_ROOM === '1',
} as const;
