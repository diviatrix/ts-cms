/**
 * Application Constants
 * Centralized location for all application constants and magic numbers
 */

// Database constants
export const DB_CONSTANTS = {
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
    MIN_LIMIT: 1,
    TIMEOUT_MS: 5000,
} as const;

// Authentication constants
export const AUTH_CONSTANTS = {
    JWT_EXPIRES_IN: '24h',
    PASSWORD_MIN_LENGTH: 6,
    PASSWORD_MAX_LENGTH: 100,
    SALT_ROUNDS: 12,
    TOKEN_PREFIX: 'Bearer ',
} as const;

// Validation constants
export const VALIDATION_CONSTANTS = {
    USERNAME_MIN_LENGTH: 4,
    USERNAME_MAX_LENGTH: 50,
    EMAIL_MAX_LENGTH: 255,
    DISPLAY_NAME_MAX_LENGTH: 100,
    BIO_MAX_LENGTH: 500,
    TITLE_MAX_LENGTH: 255,
    CONTENT_MAX_LENGTH: 50000,
    EXCERPT_LENGTH: 200,
} as const;

// HTTP constants (re-export for consistency)
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
} as const;

// Logging levels
export const LOG_LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug',
} as const;

// Record constants
export const RECORD_CONSTANTS = {
    DEFAULT_SORT: 'created_at',
    SORT_ORDER: {
        ASC: 'ASC',
        DESC: 'DESC',
    },
    STATUS: {
        PUBLISHED: 'published',
        DRAFT: 'draft',
        ARCHIVED: 'archived',
    },
} as const;

// Role constants
export const ROLES = {
    ADMIN: 'admin',
    USER: 'user',
} as const;

// File upload constants
export const UPLOAD_CONSTANTS = {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'] as const,
    UPLOAD_DIR: 'uploads',
} as const;

// Regular expressions
export const REGEX_PATTERNS = {
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    USERNAME: /^[a-zA-Z0-9_-]+$/,
    SLUG: /^[a-z0-9-]+$/,
} as const;

// Environment constants
export const ENV = {
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
    TEST: 'test',
} as const;
