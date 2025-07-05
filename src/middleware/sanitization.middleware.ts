import { Request, Response, NextFunction } from 'express';

/**
 * Remove dangerous HTML tags from a string
 */
function stripDangerousTags(input: string): string {
    if (typeof input !== 'string') return input;
    // Remove <script>, <iframe>, <object> tags (case-insensitive, multiline)
    return input
        .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
        .replace(/<\s*iframe[^>]*>[\s\S]*?<\s*\/\s*iframe\s*>/gi, '')
        .replace(/<\s*object[^>]*>[\s\S]*?<\s*\/\s*object\s*>/gi, '');
}

/**
 * Recursively sanitize an object (only string fields)
 */
function sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') return stripDangerousTags(obj);
    if (Array.isArray(obj)) return obj.map(sanitizeObject);
    if (typeof obj === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
    }
    return obj;
}

/**
 * Input sanitization middleware (POST/PUT only)
 * Removes <script>, <iframe>, <object> tags from request body
 * Allows normal HTML for theme custom CSS
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction): void {
    if ((req.method === 'POST' || req.method === 'PUT') && req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }
    next();
} 