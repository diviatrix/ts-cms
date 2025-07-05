import { Request, Response, NextFunction } from 'express';
import { ResponseUtils } from '../utils/response.utils';

// Rate limiting configuration
interface RateLimitConfig {
    windowMs: number;        // Time window in milliseconds
    maxRequests: number;     // Max requests per window
    banDurationMs: number;   // Ban duration in milliseconds
    progressiveBan: boolean; // Whether to use progressive ban duration
}

// Rate limit entry for tracking
interface RateLimitEntry {
    count: number;
    resetTime: number;
    banUntil?: number;
    banCount: number;
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Default configurations
const DEFAULT_CONFIG: RateLimitConfig = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,    // 100 requests per minute
    banDurationMs: 30 * 1000, // 30 seconds
    progressiveBan: false
};

const AUTH_CONFIG: RateLimitConfig = {
    windowMs: 1000,      // 1 second
    maxRequests: 1,      // 1 request per second
    banDurationMs: 30 * 1000, // 30 seconds
    progressiveBan: true
};

/**
 * Get client identifier (IP address)
 */
function getClientId(req: Request): string {
    return req.ip || req.connection.remoteAddress || 'unknown';
}

/**
 * Clean up expired entries from the store
 */
function cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetTime < now && (!entry.banUntil || entry.banUntil < now)) {
            rateLimitStore.delete(key);
        }
    }
}

/**
 * Create rate limiting middleware
 */
export function createRateLimit(config: RateLimitConfig = DEFAULT_CONFIG) {
    return (req: Request, res: Response, next: NextFunction) => {
        // Skip rate limiting for localhost/dev/test
        if (
            process.env.NODE_ENV !== 'production' ||
            req.ip === '127.0.0.1' ||
            req.ip === '::1' ||
            req.hostname === 'localhost'
        ) {
            return next();
        }

        // Clean up expired entries periodically
        if (Math.random() < 0.01) { // 1% chance to cleanup
            cleanupExpiredEntries();
        }

        const clientId = getClientId(req);
        const now = Date.now();
        
        // Get or create rate limit entry
        let entry = rateLimitStore.get(clientId);
        if (!entry) {
            entry = {
                count: 0,
                resetTime: now + config.windowMs,
                banCount: 0
            };
            rateLimitStore.set(clientId, entry);
        }

        // Check if client is banned
        if (entry.banUntil && entry.banUntil > now) {
            const remainingBan = Math.ceil((entry.banUntil - now) / 1000);
            return ResponseUtils.tooManyRequests(res, `Rate limit exceeded. Try again in ${remainingBan} seconds.`);
        }

        // Reset counter if window has passed
        if (entry.resetTime < now) {
            entry.count = 0;
            entry.resetTime = now + config.windowMs;
        }

        // Increment request count
        entry.count++;

        // Check if rate limit exceeded
        if (entry.count > config.maxRequests) {
            // Calculate ban duration
            let banDuration = config.banDurationMs;
            if (config.progressiveBan) {
                banDuration = config.banDurationMs * Math.pow(30, entry.banCount);
                entry.banCount++;
            }

            entry.banUntil = now + banDuration;
            
            const banSeconds = Math.ceil(banDuration / 1000);
            return ResponseUtils.tooManyRequests(res, `Rate limit exceeded. Try again in ${banSeconds} seconds.`);
        }

        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', config.maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - entry.count));
        res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

        next();
    };
}

/**
 * Global rate limiting middleware (100 requests per minute)
 */
export const globalRateLimit = createRateLimit(DEFAULT_CONFIG);

/**
 * Authentication rate limiting middleware (1 request per second, progressive ban)
 */
export const authRateLimit = createRateLimit(AUTH_CONFIG);

/**
 * Apply rate limiting to specific routes
 */
export function applyRateLimits(app: any) {
    // Global rate limiting for all API routes
    app.use('/api', globalRateLimit);
    
    // Specific rate limiting for auth endpoints
    app.use('/api/register', authRateLimit);
    app.use('/api/login', authRateLimit);
} 