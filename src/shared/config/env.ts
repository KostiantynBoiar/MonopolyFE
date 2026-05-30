const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8002';

// Derive WS base from API URL: http → ws, https → wss
const wsUrl = apiUrl.replace(/^http/, 'ws');


// Game logic source: the mock backend (default) or a real WebSocket server.
// Flip to false (NEXT_PUBLIC_USE_MOCK_BACKEND=false) once the backend drives the game.
const useMockBackend = process.env.NEXT_PUBLIC_USE_MOCK_BACKEND !== 'false';

export const env = {
  apiUrl,
  wsUrl,
  telegramBotName: process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME ?? '',
  useMockBackend,
} as const;
