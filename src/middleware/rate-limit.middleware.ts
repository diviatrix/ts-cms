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
    lastActivity: number; // Track last activity for ban count reset
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
    windowMs: 10 * 1000,      // 10 seconds window
    maxRequests: 5,           // 5 requests per 10 seconds (more reasonable)
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
    const entriesToDelete: string[] = [];
    
    // First pass: identify entries to delete
    for (const [key, entry] of rateLimitStore.entries()) {
        const isWindowExpired = entry.resetTime < now;
        const isBanExpired = !entry.banUntil || entry.banUntil < now;
        const isInactive = now - entry.lastActivity > 30 * 60 * 1000; // 30 minutes inactive
        
        // Delete if: (window expired AND not banned) OR (ban expired) OR (inactive for 30+ minutes)
        if ((isWindowExpired && isBanExpired) || isInactive) {
            entriesToDelete.push(key);
        }
    }
    
    // Second pass: batch delete for better performance
    for (const key of entriesToDelete) {
        rateLimitStore.delete(key);
    }
    
    // Log cleanup stats (only in development)
    if (process.env.NODE_ENV !== 'production' && entriesToDelete.length > 0) {
        console.log(`[RATELIMIT] Cleaned up ${entriesToDelete.length} expired entries. Store size: ${rateLimitStore.size}`);
    }
}

/**
 * Create rate limiting middleware
 */
export function createRateLimit(config: RateLimitConfig = DEFAULT_CONFIG) {
    return (req: Request, res: Response, next: NextFunction) => {
        // Skip rate limiting for localhost/dev/test
        // IMPORTANT: Rate limiting is ONLY active when NODE_ENV is explicitly set to 'production'
        if (
            process.env.NODE_ENV !== 'production' ||
            req.ip === '127.0.0.1' ||
            req.ip === '::1' ||
            req.hostname === 'localhost'
        ) {
            return next();
        }

        // Clean up expired entries based on time and memory pressure
        const currentTime = Date.now();
        const timeSinceLastCleanup = currentTime - (global as any).lastRateLimitCleanup || 0;
        
        // Clean up every 60 seconds OR if we have too many entries (>1000)
        if (timeSinceLastCleanup > 60000 || rateLimitStore.size > 1000) {
            cleanupExpiredEntries();
            (global as any).lastRateLimitCleanup = currentTime;
        }

        const clientId = getClientId(req);
        const now = Date.now();
        
        // Get or create rate limit entry
        let entry = rateLimitStore.get(clientId);
        if (!entry) {
            entry = {
                count: 0,
                resetTime: now + config.windowMs,
                banCount: 0,
                lastActivity: now
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

        // Reset ban count if user has been good for a while (5 minutes)
        if (entry.banCount > 0 && now - entry.lastActivity > 5 * 60 * 1000) {
            entry.banCount = 0;
        }

        // Update last activity
        entry.lastActivity = now;

        // Increment request count
        entry.count++;

        // Check if rate limit exceeded
        if (entry.count > config.maxRequests) {
            // Calculate ban duration
            let banDuration = config.banDurationMs;
            if (config.progressiveBan) {
                // More reasonable progressive ban: 30s, 60s, 120s, 300s (5 min), 600s (10 min), max 1800s (30 min)
                const multiplier = Math.min(Math.pow(2, entry.banCount), 60); // Max multiplier of 60 (30 min)
                banDuration = config.banDurationMs * multiplier;
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

        // Reset ban count on successful authentication attempts
        if (req.path.includes('/login') || req.path.includes('/register')) {
            // Store entry reference for successful response handling
            res.locals.rateLimitEntry = entry;
            
            // Override res.end to detect successful responses
            const originalEnd = res.end;
            res.end = function(chunk?: any, encoding?: any): any {
                // If response is successful (2xx status), reset ban count
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    entry.banCount = 0;
                    entry.lastActivity = Date.now();
                    
                    // Log successful auth and ban reset (only in development)
                    if (process.env.NODE_ENV !== 'production') {
                        console.log(`[RATELIMIT] Successful auth for ${clientId}. Ban count reset to 0.`);
                    }
                }
                return originalEnd.call(this, chunk, encoding);
            };
        }

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