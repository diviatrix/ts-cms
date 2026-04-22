// Rate limiting configuration for different endpoint types
export interface RateLimitConfig {
    windowMs: number;        // Time window in milliseconds
    maxRequests: number;     // Max requests per window
    banDurationMs: number;   // Ban duration in milliseconds
    skipPublicGet?: boolean; // Skip rate limiting for public GET requests
}

export const CONFIGS = {
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
