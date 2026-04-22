import { AUTH_CONSTANTS, REGEX_PATTERNS } from './constants';

// Basic validation utility functions
export class ValidationUtils {
    
    /** 
     * Check if value is required and not empty
     */
    static required(value: unknown, fieldName: string): string | null {
        if (value === undefined || value === null || value === '') {
            return `${fieldName} is required`;
        }
        return null;
    }

    /** 
     * Check string length
     */
    static stringLength(value: string, fieldName: string, minLength: number, maxLength: number): string | null {
        if (typeof value !== 'string') {
            return `${fieldName} must be a string`;
        }
        if (value.length < minLength) {
            return `${fieldName} must be at least ${minLength} characters`;
        }
        if (value.length > maxLength) {
            return `${fieldName} must be no more than ${maxLength} characters`;
        }
        return null;
    }

    /** 
     * Check username pattern
     */
    static usernamePattern(value: string): string | null {
        if (typeof value !== 'string') {
            return 'Username must be a string';
        }
        if (!REGEX_PATTERNS.USERNAME.test(value)) {
            return 'Username can only contain letters, numbers, underscores, and dots';
        }
        return null;
    }

    /** 
     * Check email pattern
     */
    static emailPattern(value: string): string | null {
        if (typeof value !== 'string') {
            return 'Email must be a string';
        }
        if (!REGEX_PATTERNS.EMAIL.test(value)) {
            return 'Please enter a valid email address';
        }
        return null;
    }

    /** 
     * Check password strength
     */
    static passwordStrength(value: string): string | null {
        if (typeof value !== 'string') {
            return 'Password must be a string';
        }
        if (value.length < AUTH_CONSTANTS.PASSWORD_MIN_LENGTH) {
            return `Password must be at least ${AUTH_CONSTANTS.PASSWORD_MIN_LENGTH} characters`;
        }
        if (!REGEX_PATTERNS.PASSWORD_UPPERCASE.test(value)) {
            return 'Password must contain at least one uppercase letter';
        }
        if (!REGEX_PATTERNS.PASSWORD_LOWERCASE.test(value)) {
            return 'Password must contain at least one lowercase letter';
        }
        if (!REGEX_PATTERNS.PASSWORD_NUMBER.test(value)) {
            return 'Password must contain at least one number';
        }
        if (!REGEX_PATTERNS.PASSWORD_SPECIAL.test(value)) {
            return 'Password must contain at least one special character';
        }
        return null;
    }

    /** 
     * Check if value is a valid number
     */
    static number(value: unknown, fieldName: string): string | null {
        if (typeof value !== 'number' || isNaN(value as number)) {
            return `${fieldName} must be a valid number`;
        }
        return null;
    }

    /** 
     * Check if value is a valid boolean
     */
    static boolean(value: unknown, fieldName: string): string | null {
        if (typeof value !== 'boolean') {
            return `${fieldName} must be a boolean`;
        }
        return null;
    }

    /** 
     * Check if value is a valid date
     */
    static date(value: unknown, fieldName: string): string | null {
        if (!(value instanceof Date) || isNaN(value.getTime())) {
            return `${fieldName} must be a valid date`;
        }
        return null;
    }

    /** 
     * Check if value is within a specific range
     */
    static range(value: number, fieldName: string, min: number, max: number): string | null {
        if (typeof value !== 'number') {
            return `${fieldName} must be a number`;
        }
        if (value < min) {
            return `${fieldName} must be at least ${min}`;
        }
        if (value > max) {
            return `${fieldName} must be no more than ${max}`;
        }
        return null;
    }

    /** 
     * Check if value matches a specific pattern
     */
    static pattern(value: string, fieldName: string, pattern: RegExp): string | null {
        if (typeof value !== 'string') {
            return `${fieldName} must be a string`;
        }
        if (!pattern.test(value)) {
            return `${fieldName} does not match the required pattern`;
        }
        return null;
    }

    /** 
     * Check if value is a valid UUID
     */
    static uuid(value: string, fieldName: string): string | null {
        if (typeof value !== 'string') {
            return `${fieldName} must be a string`;
        }
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
            return `${fieldName} must be a valid UUID`;
        }
        return null;
    }
}

export default ValidationUtils;