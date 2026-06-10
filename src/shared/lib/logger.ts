import { env } from '@/shared/config/env';

export enum LogLevel {
  DEBUG = 10,
  INFO = 20,
  WARN = 30,
  ERROR = 40,
  SILENT = 50,
}

export type LogContext = Record<string, unknown>;

type LogMethod = (message: string, context?: LogContext) => void;

interface Logger {
  debug: LogMethod;
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
}

function defaultLogLevel(): LogLevel {
  return process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG;
}

function parseLogLevel(value: string | undefined): LogLevel {
  switch (value) {
    case 'debug':
      return LogLevel.DEBUG;
    case 'info':
      return LogLevel.INFO;
    case 'warn':
      return LogLevel.WARN;
    case 'error':
      return LogLevel.ERROR;
    case 'silent':
      return LogLevel.SILENT;
    default:
      return defaultLogLevel();
  }
}

function shouldLog(level: LogLevel): boolean {
  return level >= parseLogLevel(env.logLevel);
}

function writeLog(level: LogLevel, message: string, context?: LogContext): void {
  if (!shouldLog(level)) return;

  const details = context ? [context] : [];
  switch (level) {
    case LogLevel.DEBUG:
      console.debug(message, ...details);
      return;
    case LogLevel.INFO:
      console.info(message, ...details);
      return;
    case LogLevel.WARN:
      console.warn(message, ...details);
      return;
    case LogLevel.ERROR:
      console.error(message, ...details);
      return;
    case LogLevel.SILENT:
      return;
  }
}

export const logger: Logger = {
  debug: (message, context) => writeLog(LogLevel.DEBUG, message, context),
  info: (message, context) => writeLog(LogLevel.INFO, message, context),
  warn: (message, context) => writeLog(LogLevel.WARN, message, context),
  error: (message, context) => writeLog(LogLevel.ERROR, message, context),
};
