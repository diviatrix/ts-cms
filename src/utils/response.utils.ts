import { Response } from 'express';
import { HTTP_STATUS } from '../constants/http-status';
export { HTTP_STATUS } from '../constants/http-status';

// Standard response interfaces
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: string[];
    timestamp?: string;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T> {
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Response utility functions
export class ResponseUtils {
    
    /**
     * Send standardized success response
     */
    static success<T>(
        res: Response,
        data?: T,
        message?: string,
        statusCode: number = HTTP_STATUS.OK
    ): void {
        const response: ApiResponse<T> = {
            success: true,
            data,
            message,
            timestamp: new Date().toISOString(),
        };

        // Guard against invalid response object
        if (!res || typeof res.status !== 'function' || typeof res.json !== 'function') {
            console.error('ResponseUtils.success called with invalid response object:', { res, data, message, statusCode });
            // Try to send a basic response if possible
            if (res && typeof res.send === 'function') {
                res.send(`Success: ${message}`);
            }
            return;
        }

        res.status(statusCode).json(response);
    }

    /**
     * Send standardized error response
     */
    static error(
        res: Response,
        message: string,
        statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
        errors?: string[]
    ): void {
        const response: ApiResponse = {
            success: false,
            message,
            errors,
            timestamp: new Date().toISOString(),
        };

        // Guard against invalid response object
        if (!res || typeof res.status !== 'function' || typeof res.json !== 'function') {
            console.error('ResponseUtils.error called with invalid response object:', { res, message, statusCode });
            // Try to send a basic response if possible
            if (res && typeof res.send === 'function') {
                res.send(`Error: ${message}`);
            }
            return;
        }

        res.status(statusCode).json(response);
    }

    /**
     * Send created response (201)
     */
    static created<T>(res: Response, data: T, message?: string): void {
        this.success(res, data, message || 'Resource created successfully', HTTP_STATUS.CREATED);
    }

    /**
     * Send no content response (204)
     */
    static noContent(res: Response): void {
        res.status(HTTP_STATUS.NO_CONTENT).send();
    }

    /**
     * Send bad request response (400)
     */
    static badRequest(res: Response, message: string = 'Bad request', errors?: string[]): void {
        this.error(res, message, HTTP_STATUS.BAD_REQUEST, errors);
    }

    /**
     * Send unauthorized response (401)
     */
    static unauthorized(res: Response, message: string = 'Authentication required'): void {
        this.error(res, message, HTTP_STATUS.UNAUTHORIZED);
    }

    /**
     * Send forbidden response (403)
     */
    static forbidden(res: Response, message: string = 'Access forbidden'): void {
        this.error(res, message, HTTP_STATUS.FORBIDDEN);
    }

    /**
     * Send not found response (404)
     */
    static notFound(res: Response, message: string = 'Resource not found'): void {
        this.error(res, message, HTTP_STATUS.NOT_FOUND);
    }

    /**
     * Send conflict response (409)
     */
    static conflict(res: Response, message: string = 'Resource conflict'): void {
        this.error(res, message, HTTP_STATUS.CONFLICT);
    }

    /**
     * Send validation error response (422)
     */
    static validationError(res: Response, message: string = 'Validation failed', errors?: string[]): void {
        this.error(res, message, HTTP_STATUS.UNPROCESSABLE_ENTITY, errors);
    }

    /**
     * Send too many requests response (429)
     */
    static tooManyRequests(res: Response, message: string = 'Too many requests'): void {
        this.error(res, message, HTTP_STATUS.TOO_MANY_REQUESTS);
    }

    /**
     * Send internal server error response (500)
     */
    static internalError(res: Response, message: string = 'Internal server error'): void {
        this.error(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    /**
     * Send paginated response
     */
    static paginated<T>(
        res: Response, 
        data: T[], 
        pagination: { page: number; limit: number; total: number },
        message?: string
    ): void {
        const response: PaginatedResponse<T[]> = {
            success: true,
            data,
            message,
            pagination: {
                ...pagination,
                totalPages: Math.ceil(pagination.total / pagination.limit),
            },
            timestamp: new Date().toISOString(),
        };
        
        res.status(HTTP_STATUS.OK).json(response);
    }
}
