import { Request, Response, NextFunction } from 'express';
import { ResponseUtils } from '../utils/response.utils';

// Rate limiting configuration
interface RateLimitConfig {
    windowMs: number;        // Time window in milliseconds
    maxRequests: number;     // Max requests per window
    banDurationMs: number;   // Ban duration in milliseconds
    skipPublicGet?: boolean; // Skip rate limiting for public GET requests
}

// Rate limit entry for tracking with sliding window
interface RateLimitEntry {
    requests: number[];      // Array of request timestamps
    banUntil?: number;      // Ban expiry timestamp
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration for different types of endpoints
const CONFIGS = {
    // Critical auth endpoints - strict limits
    AUTH: {
        windowMs: 60 * 1000,      // 1 minute
        maxRequests: 10,          // 10 attempts per minute
        banDurationMs: 30 * 1000  // 30 seconds ban
    },
    // Data modification endpoints
    WRITE: {
        windowMs: 60 * 1000,      // 1 minute  
        maxRequests: 50,          // 50 requests per minute
        banDurationMs: 30 * 1000  // 30 seconds ban
    },
    // Authenticated read endpoints
    READ_AUTH: {
        windowMs: 60 * 1000,      // 1 minute
        maxRequests: 300,         // 300 requests per minute
        banDurationMs: 30 * 1000  // 30 seconds ban
    },
    // Global fallback for other endpoints
    GLOBAL: {
        windowMs: 60 * 1000,      // 1 minute
        maxRequests: 200,         // 200 requests per minute
        banDurationMs: 30 * 1000, // 30 seconds ban
        skipPublicGet: true       // Don't rate limit public GET requests
    }
};

/**
 * Get client identifier (IP address) with proxy support
 */
function getClientId(req: Request): string {
    // Check for proxy headers first
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
        // x-forwarded-for can contain multiple IPs, take the first one
        return (forwardedFor as string).split(',')[0].trim();
    }
    
    // Check other common proxy headers
    const realIp = req.headers['x-real-ip'];
    if (realIp) {
        return realIp as string;
    }
    
    // Cloudflare specific header
    const cfConnectingIp = req.headers['cf-connecting-ip'];
    if (cfConnectingIp) {
        return cfConnectingIp as string;
    }
    
    // Fall back to direct connection IP
    return req.ip || req.connection.remoteAddress || 'unknown';
}

/**
 * Clean up expired entries from the store
 */
function cleanupExpiredEntries(): void {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    
    for (const [key, entry] of rateLimitStore.entries()) {
        // Remove if no recent requests and no active ban
        const hasRecentRequests = entry.requests.some(timestamp => timestamp > fiveMinutesAgo);
        const hasActiveBan = entry.banUntil && entry.banUntil > now;
        
        if (!hasRecentRequests && !hasActiveBan) {
            rateLimitStore.delete(key);
        }
    }
}

/**
 * Determine which config to use based on the request
 */
function getConfigForRequest(req: Request): RateLimitConfig {
    const path = req.path;
    const method = req.method;
    
    // Auth endpoints - strictest limits
    if (path.includes('/login') || path.includes('/register')) {
        return CONFIGS.AUTH;
    }
    
    // Write operations - moderate limits
    if (method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH') {
        return CONFIGS.WRITE;
    }
    
    // Authenticated read operations
    const authHeader = req.headers['authorization'];
    if (authHeader && method === 'GET') {
        return CONFIGS.READ_AUTH;
    }
    
    // Default global config
    return CONFIGS.GLOBAL;
}

/**
 * Create rate limiting middleware with sliding window
 */
export function createRateLimit() {
    return (req: Request, res: Response, next: NextFunction) => {
        // Skip rate limiting for localhost in development
        if (
            process.env.NODE_ENV !== 'production' ||
            req.ip === '127.0.0.1' ||
            req.ip === '::1' ||
            req.hostname === 'localhost'
        ) {
            return next();
        }

        const config = getConfigForRequest(req);
        
        // Skip public GET requests if configured
        if (config.skipPublicGet && req.method === 'GET' && !req.headers['authorization']) {
            return next();
        }

        // Clean up expired entries periodically
        const currentTime = Date.now();
        const globalState = global as { lastRateLimitCleanup?: number };
        const timeSinceLastCleanup = currentTime - (globalState.lastRateLimitCleanup || 0);
        
        if (timeSinceLastCleanup > 60000 || rateLimitStore.size > 1000) {
            cleanupExpiredEntries();
            globalState.lastRateLimitCleanup = currentTime;
        }

        const clientId = getClientId(req);
        const now = Date.now();
        
        // Get or create rate limit entry
        let entry = rateLimitStore.get(clientId);
        if (!entry) {
            entry = {
                requests: []
            };
            rateLimitStore.set(clientId, entry);
        }

        // Check if client is banned
        if (entry.banUntil && entry.banUntil > now) {
            const remainingBan = Math.ceil((entry.banUntil - now) / 1000);
            return ResponseUtils.tooManyRequests(res, `Rate limit exceeded. Try again in ${remainingBan} seconds.`);
        }

        // Clean old requests outside the window (sliding window)
        const windowStart = now - config.windowMs;
        entry.requests = entry.requests.filter(timestamp => timestamp > windowStart);

        // Check if rate limit would be exceeded
        if (entry.requests.length >= config.maxRequests) {
            // Apply ban
            entry.banUntil = now + config.banDurationMs;
            const banSeconds = Math.ceil(config.banDurationMs / 1000);
            return ResponseUtils.tooManyRequests(res, `Rate limit exceeded. Try again in ${banSeconds} seconds.`);
        }

        // Add current request timestamp
        entry.requests.push(now);

        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', config.maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - entry.requests.length));
        res.setHeader('X-RateLimit-Reset', Math.ceil((windowStart + config.windowMs) / 1000));

        // Clear ban on successful auth - TEMPORARILY DISABLED due to TypeScript issues
        // TODO: Fix TypeScript types for res.end overriding
        /*
        if ((req.path.includes('/login') || req.path.includes('/register'))) {
            const originalEnd = res.end;
            res.end = function(...args: unknown[]): Response {
                // If response is successful (2xx status), clear any bans
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    const entry = rateLimitStore.get(clientId);
                    if (entry) {
                        entry.banUntil = undefined;
                    }
                }
                
                // Use rest parameters to handle all possible combinations
                return originalEnd.apply(this, args);
            };
        }
        */

        next();
    };
}

/**
 * Global rate limiting middleware
 */
export const globalRateLimit = createRateLimit();

/**
 * Apply rate limiting to specific routes
 */
export function applyRateLimits(app: { use(path: string, middleware: (req: Request, res: Response, next: NextFunction) => void): void }) {
    // Apply global rate limiting for all API routes
    app.use('/api', globalRateLimit);
}