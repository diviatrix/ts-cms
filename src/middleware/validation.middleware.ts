import { Request, Response, NextFunction } from 'express';
import { ResponseUtils } from '../utils/response.utils';
import { VALIDATION_CONSTANTS, AUTH_CONSTANTS, REGEX_PATTERNS } from '../utils/constants';
import logger from '../utils/logger';

// Validation result interface
interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

// Basic validation utility functions
export class ValidationUtils {
    
    /**
     * Check if value is required and not empty
     */
    static required(value: any, fieldName: string): string | null {
        if (value === undefined || value === null || value === '') {
            return `${fieldName} is required`;
        }
        return null;
    }

    /**
     * Check string length constraints
     */
    static stringLength(value: string, fieldName: string, min?: number, max?: number): string | null {
        if (typeof value !== 'string') return null;
        
        if (min && value.length < min) {
            return `${fieldName} must be at least ${min} characters long`;
        }
        if (max && value.length > max) {
            return `${fieldName} must be no more than ${max} characters long`;
        }
        return null;
    }

    /**
     * Check if value is a valid email format
     */
    static email(value: string, fieldName: string): string | null {
        if (typeof value !== 'string') return null;
        
        if (!REGEX_PATTERNS.EMAIL.test(value)) {
            return `${fieldName} must be a valid email address`;
        }
        return null;
    }

    /**
     * Check if value is a boolean
     */
    static boolean(value: any, fieldName: string): string | null {
        if (typeof value !== 'boolean') {
            return `${fieldName} must be a boolean value`;
        }
        return null;
    }

    /**
     * Check if value is a valid UUID
     */
    static uuid(value: string, fieldName: string): string | null {
        if (typeof value !== 'string') return null;
        
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(value)) {
            return `${fieldName} must be a valid UUID`;
        }
        return null;
    }

    /**
     * Validate object against schema
     */
    static validateObject(data: any, schema: ValidationSchema): ValidationResult {
        const errors: string[] = [];

        for (const [fieldName, rules] of Object.entries(schema)) {
            const value = data[fieldName];

            for (const rule of rules) {
                const error = rule(value, fieldName);
                if (error) {
                    errors.push(error);
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// Validation schema type
type ValidationRule = (value: any, fieldName: string) => string | null;
type ValidationSchema = Record<string, ValidationRule[]>;

// Predefined validation schemas
export const ValidationSchemas = {
    
    // User registration validation
    register: {
        login: [
            ValidationUtils.required,
            (value: string) => ValidationUtils.stringLength(value, 'login', 4, 50)
        ],
        password: [
            ValidationUtils.required,
            (value: string) => ValidationUtils.stringLength(value, 'password', 6, 100)
        ],
        email: [
            (value: string) => value ? ValidationUtils.email(value, 'email') : null
        ]
    } as ValidationSchema,

    // User login validation
    login: {
        login: [
            ValidationUtils.required,
            (value: string) => ValidationUtils.stringLength(value, 'login', 1, 50)
        ],
        password: [
            ValidationUtils.required,
            (value: string) => ValidationUtils.stringLength(value, 'password', 1, 100)
        ]
    } as ValidationSchema,

    // Profile update validation
    profileUpdate: {
        'profile.display_name': [
            (value: string) => value ? ValidationUtils.stringLength(value, 'display_name', 1, 100) : null
        ],
        'profile.email': [
            (value: string) => value ? ValidationUtils.email(value, 'email') : null
        ],
        'profile.bio': [
            (value: string) => value ? ValidationUtils.stringLength(value, 'bio', 0, 500) : null
        ]
    } as ValidationSchema,

    // Password change validation
    passwordChange: {
        newPassword: [
            ValidationUtils.required,
            (value: string) => ValidationUtils.stringLength(value, 'newPassword', 6, 100)
        ]
    } as ValidationSchema,

    // Record creation/update validation
    record: {
        title: [
            ValidationUtils.required,
            (value: string) => ValidationUtils.stringLength(value, 'title', 1, 200)
        ],
        content: [
            ValidationUtils.required,
            (value: string) => ValidationUtils.stringLength(value, 'content', 1, 50000)
        ],
        excerpt: [
            (value: string) => value ? ValidationUtils.stringLength(value, 'excerpt', 0, 500) : null
        ],
        published: [
            (value: any) => value !== undefined ? ValidationUtils.boolean(value, 'published') : null
        ]
    } as ValidationSchema
};

// Validation middleware factory
export function validateBody(schema: ValidationSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = ValidationUtils.validateObject(req.body, schema);
        
        if (!result.isValid) {
            ResponseUtils.validationError(res, 'Validation failed', result.errors);
            return;
        }
        
        next();
    };
}

// Validation middleware factory for nested objects
export function validateNestedBody(schema: ValidationSchema, flatten: boolean = true) {
    return (req: Request, res: Response, next: NextFunction) => {
        const flattenedData = flatten ? flattenObject(req.body) : req.body;
        const result = ValidationUtils.validateObject(flattenedData, schema);
        
        if (!result.isValid) {
            ResponseUtils.validationError(res, 'Validation failed', result.errors);
            return;
        }
        
        next();
    };
}

// Parameter validation middleware factory
export function validateParams(schema: ValidationSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = ValidationUtils.validateObject(req.params, schema);
        
        if (!result.isValid) {
            ResponseUtils.validationError(res, 'Invalid parameters', result.errors);
            return;
        }
        
        next();
    };
}

// Parameter validation schemas
export const ParameterSchemas = {
    // UUID parameter validation
    uuid: {
        id: [
            ValidationUtils.required,
            ValidationUtils.uuid
        ]
    } as ValidationSchema
};

// Helper function to flatten nested objects for validation
function flattenObject(obj: any, prefix: string = ''): any {
    const flattened: any = {};
    
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const newKey = prefix ? `${prefix}.${key}` : key;
            
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                Object.assign(flattened, flattenObject(obj[key], newKey));
            } else {
                flattened[newKey] = obj[key];
            }
        }
    }
    
    return flattened;
}
