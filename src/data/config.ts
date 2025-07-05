import { ENV } from '../utils/constants';

/**
 * Application Configuration
 * Environment-aware configuration with defaults
 */

const isDevelopment = process.env.NODE_ENV === ENV.DEVELOPMENT;
const isProduction = process.env.NODE_ENV === ENV.PRODUCTION;

export default {
    // Environment
    environment: process.env.NODE_ENV || ENV.DEVELOPMENT,
    isDevelopment,
    isProduction,
    
    // Server configuration
    origin: process.env.CORS_ORIGIN || 'http://localhost:7331',
    api_address: process.env.API_ADDRESS || 'http://localhost',
    api_port: parseInt(process.env.API_PORT || '7331', 10),
    api_suffix: '/api',
    
    // Static files
    static_folder: process.env.STATIC_FOLDER || 'public',
    
    // Database
    db_path: process.env.DB_PATH || './data/database.db',
    
    // Security
    jwt_secret: process.env.JWT_SECRET || 'YOUR_JWT_SECRET_CHANGE_IN_PRODUCTION',
    
    // Logging
    log_level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    
    // Features
    enable_registration: process.env.ENABLE_REGISTRATION !== 'false',
    enable_file_uploads: process.env.ENABLE_FILE_UPLOADS === 'true',
    
    // Limits
    max_records_per_page: parseInt(process.env.MAX_RECORDS_PER_PAGE || '50', 10),
    max_file_size: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
} as const;