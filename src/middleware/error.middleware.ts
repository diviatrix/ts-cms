import { Request, Response, NextFunction } from 'express';
import { ResponseUtils } from '../utils/response.utils';

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
    operation: (transaction?: any) => Promise<T>
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
    else if (error.name === 'UnauthorizedError' || error.message.includes('jwt')) {
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
    else if (error.message.includes('SQLITE_') || error.message.includes('database')) {
        statusCode = 500;
        message = 'Database operation failed';
        type = ErrorType.DATABASE;
    }

    // Log error for debugging
    console.error(`[${type}] ${error.message}`, {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        statusCode,
        stack: error.stack
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

// Specialized error creators for common scenarios
export const Errors = {
    notFound: (resource: string = 'Resource') => 
        createError(`${resource} not found`, ErrorType.NOT_FOUND),
    
    unauthorized: (message: string = 'Authentication required') => 
        createError(message, ErrorType.AUTHENTICATION),
    
    forbidden: (message: string = 'Access forbidden') => 
        createError(message, ErrorType.AUTHORIZATION),
    
    validation: (message: string = 'Validation failed') => 
        createError(message, ErrorType.VALIDATION),
    
    conflict: (resource: string = 'Resource') => 
        createError(`${resource} already exists`, ErrorType.CONFLICT),
    
    database: (operation: string = 'Database operation') => 
        createError(`${operation} failed`, ErrorType.DATABASE)
};
