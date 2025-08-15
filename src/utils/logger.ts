import { LOG_LEVELS } from './constants';

type LogLevel = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];

/**
 * Structured logging utility with different log levels
 */
class Logger {
    private level: LogLevel;

    constructor(level: LogLevel = LOG_LEVELS.INFO) {
        this.level = level;
    }

    private shouldLog(level: LogLevel): boolean {
        const levels: LogLevel[] = [LOG_LEVELS.ERROR, LOG_LEVELS.WARN, LOG_LEVELS.INFO, LOG_LEVELS.DEBUG];
        return levels.indexOf(level) <= levels.indexOf(this.level);
    }

    private formatMessage(level: LogLevel, message: string, context?: unknown): string {
        const timestamp = new Date().toISOString();
        const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
        return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
    }

    error(message: string, context?: unknown): void {
        if (this.shouldLog(LOG_LEVELS.ERROR)) {
            console.error(this.formatMessage(LOG_LEVELS.ERROR, message, context));
        }
    }

    warn(message: string, context?: unknown): void {
        if (this.shouldLog(LOG_LEVELS.WARN)) {
            console.warn(this.formatMessage(LOG_LEVELS.WARN, message, context));
        }
    }

    info(message: string, context?: unknown): void {
        if (this.shouldLog(LOG_LEVELS.INFO)) {
            console.log(this.formatMessage(LOG_LEVELS.INFO, message, context));
        }
    }

    debug(message: string, context?: unknown): void {
        if (this.shouldLog(LOG_LEVELS.DEBUG)) {
            console.log(this.formatMessage(LOG_LEVELS.DEBUG, message, context));
        }
    }

    // Convenience methods for common use cases
    apiRequest(method: string, url: string, userId?: string): void {
        this.info(`API Request: ${method} ${url}`, { userId });
    }

    authAction(action: string, userId: string, success: boolean): void {
        this.info(`Auth Action: ${action}`, { userId, success });
    }
}

// Create a singleton logger instance
const getLogLevel = (): LogLevel => {
    const envLevel = process.env.LOG_LEVEL;
    const validLevels = Object.values(LOG_LEVELS);
    return validLevels.includes(envLevel as LogLevel) ? envLevel as LogLevel : LOG_LEVELS.INFO;
};

const logger = new Logger(getLogLevel());

export default logger;
