import { Request, Response, NextFunction } from 'express';

/**
 * Minimal security headers middleware (theme-safe)
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    // Prevent MIME sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Basic XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
} 