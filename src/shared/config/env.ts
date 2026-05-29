export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
  telegramBotName: process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME ?? '',
} as const;
