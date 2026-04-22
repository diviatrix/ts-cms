import { Request, Response, NextFunction } from 'express';
import { ResponseUtils } from '../utils/response.utils';
export { Errors } from '../constants/error-factory';

// Async handler wrapper type
type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

// Error types for classification
export enum ErrorType {
    VALIDATION = 'VALIDATION',
    AUTHENTICATION = 'AUTHENTICATION',
    AUTHORIZATION = 'AUTHORIZATION',
    NOT_FOUND = 'NOT_FOUND',
    CONFLICT = 'CONFLICT',
    DATABASE = 'DATABASE',
    INTERNAL = 'INTERNAL'
}

// Custom error class with type classification
export class AppError extends Error {
    public readonly type: ErrorType;
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(
        message: string,
        type: ErrorType = ErrorType.INTERNAL,
        statusCode: number = 500,
        isOperational: boolean = true
    ) {
        super(message);
        this.type = type;
        this.statusCode = statusCode;
        this.isOperational = isOperational;

        Error.captureStackTrace(this, this.constructor);
    }
}

// Async error wrapper - eliminates try-catch repetition
export function asyncHandler(handler: AsyncHandler) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await handler(req, res, next);
        } catch (error) {
            next(error);
        }
    };
}

// Database transaction wrapper
export function withTransaction<T>(
    operation: (transaction?: unknown) => Promise<T>
): Promise<T> {
    // This would integrate with your database's transaction system
    // For now, it's a placeholder that just calls the operation
    return operation();
}

// Error classification helper
export function createError(
    message: string,
    type: ErrorType,
    statusCode?: number
): AppError {
    const defaultStatusCodes: Record<ErrorType, number> = {
        [ErrorType.VALIDATION]: 422,
        [ErrorType.AUTHENTICATION]: 401,
        [ErrorType.AUTHORIZATION]: 403,
        [ErrorType.NOT_FOUND]: 404,
        [ErrorType.CONFLICT]: 409,
        [ErrorType.DATABASE]: 500,
        [ErrorType.INTERNAL]: 500
    };

    return new AppError(
        message,
        type,
        statusCode || defaultStatusCodes[type]
    );
}

// Centralized error handling middleware
export function errorHandler(
    error: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    // Check if this is being called as regular middleware (error parameter missing/invalid)
    if (!error || !req || !res) {
        // This shouldn't happen, but if it does, call next() to continue
        console.error('Error handler called with invalid parameters:', { error, req: !!req, res: !!res });
        return next();
    }

    let statusCode = 500;
    let message = 'Internal server error';
    let type = ErrorType.INTERNAL;

    // Handle custom AppError
    if (error instanceof AppError) {
        statusCode = error.statusCode;
        message = error.message;
        type = error.type;
    }
    // Handle known error types
    else if (error.name === 'ValidationError') {
        statusCode = 422;
        message = 'Validation failed';
        type = ErrorType.VALIDATION;
    }
    else if (error.name === 'UnauthorizedError' || (error.message && error.message.includes('jwt'))) {
        statusCode = 401;
        message = 'Authentication failed';
        type = ErrorType.AUTHENTICATION;
    }
    else if (error.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid data format';
        type = ErrorType.VALIDATION;
    }
    // Database errors
    else if (error.message && (error.message.includes('SQLITE_') || error.message.includes('database'))) {
        statusCode = 500;
        message = 'Database operation failed';
        type = ErrorType.DATABASE;
    }

    // Log error for debugging (with diagnostic info)
    console.error(`[${type}] ${error.message || 'No error message'}`, {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        statusCode,
        stack: error.stack,
        errorName: error.name,
        errorHasMessage: !!error.message,
        errorType: typeof error.message
    });

    // Send appropriate response based on error type
    switch (type) {
        case ErrorType.VALIDATION:
            ResponseUtils.validationError(res, message);
            break;
        case ErrorType.AUTHENTICATION:
            ResponseUtils.unauthorized(res, message);
            break;
        case ErrorType.AUTHORIZATION:
            ResponseUtils.forbidden(res, message);
            break;
        case ErrorType.NOT_FOUND:
            ResponseUtils.notFound(res, message);
            break;
        case ErrorType.CONFLICT:
            ResponseUtils.conflict(res, message);
            break;
        case ErrorType.DATABASE:
        case ErrorType.INTERNAL:
        default:
            ResponseUtils.internalError(res, message);
            break;
    }
}

