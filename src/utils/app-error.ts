/**
 * Centralized error handling with context
 * Following modern Node.js 2025 practices
 */

export enum ErrorCode {
    // Client errors
    BAD_REQUEST = 'BAD_REQUEST',
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    NOT_FOUND = 'NOT_FOUND',
    CONFLICT = 'CONFLICT',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    
    // Server errors
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    DATABASE_ERROR = 'DATABASE_ERROR',
    EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
    NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
}

interface ErrorContext {
    userId?: string;
    requestId?: string;
    path?: string;
    method?: string;
    ip?: string;
    [key: string]: unknown;
}

export class AppError extends Error {
    public readonly code: ErrorCode;
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly context: ErrorContext;
    public readonly timestamp: Date;
    public readonly details?: unknown;

    constructor(
        code: ErrorCode,
        message: string,
        statusCode: number = 500,
        isOperational: boolean = true,
        context: ErrorContext = {},
        details?: unknown
    ) {
        super(message);
        
        // Maintain proper prototype chain
        Object.setPrototypeOf(this, AppError.prototype);
        
        this.code = code;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.context = context;
        this.timestamp = new Date();
        this.details = details;
        
        // Capture stack trace
        Error.captureStackTrace(this, this.constructor);
        
        // Set error name for better debugging
        this.name = `AppError[${code}]`;
    }

    /**
     * Factory methods for common error types
     */
    static badRequest(message: string, context?: ErrorContext, details?: unknown): AppError {
        return new AppError(
            ErrorCode.BAD_REQUEST,
            message,
            400,
            true,
            context,
            details
        );
    }

    static unauthorized(message: string = 'Authentication required', context?: ErrorContext): AppError {
        return new AppError(
            ErrorCode.UNAUTHORIZED,
            message,
            401,
            true,
            context
        );
    }

    static forbidden(message: string = 'Access denied', context?: ErrorContext): AppError {
        return new AppError(
            ErrorCode.FORBIDDEN,
            message,
            403,
            true,
            context
        );
    }

    static notFound(resource: string = 'Resource', context?: ErrorContext): AppError {
        return new AppError(
            ErrorCode.NOT_FOUND,
            `${resource} not found`,
            404,
            true,
            context
        );
    }

    static conflict(message: string, context?: ErrorContext): AppError {
        return new AppError(
            ErrorCode.CONFLICT,
            message,
            409,
            true,
            context
        );
    }

    static validation(errors: string[] | string, context?: ErrorContext): AppError {
        const message = Array.isArray(errors) ? errors.join(', ') : errors;
        return new AppError(
            ErrorCode.VALIDATION_ERROR,
            message,
            422,
            true,
            context,
            Array.isArray(errors) ? errors : undefined
        );
    }

    static rateLimitExceeded(retryAfter: number, context?: ErrorContext): AppError {
        return new AppError(
            ErrorCode.RATE_LIMIT_EXCEEDED,
            `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
            429,
            true,
            { ...context, retryAfter }
        );
    }

    static database(message: string, originalError?: Error, context?: ErrorContext): AppError {
        return new AppError(
            ErrorCode.DATABASE_ERROR,
            message,
            500,
            false, // Database errors are not operational
            context,
            originalError?.message
        );
    }

    static internal(message: string = 'Internal server error', originalError?: Error, context?: ErrorContext): AppError {
        return new AppError(
            ErrorCode.INTERNAL_ERROR,
            message,
            500,
            false,
            context,
            originalError?.stack
        );
    }

    /**
     * Convert to JSON for API responses
     */
    toJSON() {
        return {
            code: this.code,
            message: this.message,
            statusCode: this.statusCode,
            timestamp: this.timestamp.toISOString(),
            ...(process.env.NODE_ENV !== 'production' && {
                context: this.context,
                details: this.details,
                stack: this.stack
            })
        };
    }

    /**
     * Convert to response format
     */
    toResponse() {
        const response: {
            success: false;
            error: {
                code: ErrorCode;
                message: string;
            };
            errors?: unknown[];
            timestamp: string;
        } = {
            success: false,
            error: {
                code: this.code,
                message: this.message
            },
            timestamp: this.timestamp.toISOString()
        };

        if (this.details) {
            response.errors = Array.isArray(this.details) ? this.details : [this.details];
        }

        return response;
    }

    /**
     * Check if error is an AppError instance
     */
    static isAppError(error: unknown): error is AppError {
        return error instanceof AppError;
    }

    /**
     * Check if error is operational (expected)
     */
    static isOperational(error: Error): boolean {
        if (error instanceof AppError) {
            return error.isOperational;
        }
        return false;
    }
}