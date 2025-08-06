// Re-export from new crypto module for backward compatibility
export { hashPassword, verifyPassword as comparePassword } from './crypto';