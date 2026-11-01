// Structured logging service with levels per PRD Section 8 Layer 13.

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: unknown;
  timestamp: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  /**
   * Internal formatted log output router.
   * Why needed: Keeps console logs out of production builds while aiding local development.
   */
  private log(level: LogLevel, message: string, context?: unknown): void {
    if (!this.isDevelopment && level === 'debug') {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
    };

    if (level === 'error') {
      console.error(`[${entry.timestamp}] [ERROR] ${message}`, context || '');
    } else if (level === 'warn') {
      console.warn(`[${entry.timestamp}] [WARN] ${message}`, context || '');
    } else if (level === 'info') {
      console.info(`[${entry.timestamp}] [INFO] ${message}`, context || '');
    }
  }

  debug(message: string, context?: unknown): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: unknown): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: unknown): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: unknown): void {
    this.log('error', message, context);
  }
}

export const logger = new Logger();

