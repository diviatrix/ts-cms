import ValidationUtils from '../utils/validation-utils';
import { VALIDATION_CONSTANTS, AUTH_CONSTANTS } from '../utils/constants';

// Validation schema type
export type ValidationRule = (value: unknown, fieldName: string) => string | null;
export type ValidationSchema = Record<string, ValidationRule[]>;

// Predefined validation schemas
export const ValidationSchemas = {
    
    // User registration validation
    register: {
        login: [
            ValidationUtils.required,
            (value: string) => ValidationUtils.stringLength(value, 'login', VALIDATION_CONSTANTS.USERNAME_MIN_LENGTH, VALIDATION_CONSTANTS.USERNAME_MAX_LENGTH),
            ValidationUtils.usernamePattern
        ],
        password: [
            ValidationUtils.required,
            (value: string) => ValidationUtils.stringLength(value, 'password', AUTH_CONSTANTS.PASSWORD_MIN_LENGTH, AUTH_CONSTANTS.PASSWORD_MAX_LENGTH)
        ],
        email: [
            (value: string) => value ? ValidationUtils.emailPattern(value) : null
        ]
    } as ValidationSchema,

    // User login validation
    login: {
        login: [
            ValidationUtils.required,
            (value: string) => ValidationUtils.stringLength(value, 'login', 1, VALIDATION_CONSTANTS.USERNAME_MAX_LENGTH)
        ],
        password: [
            ValidationUtils.required,
            (value: string) => ValidationUtils.stringLength(value, 'password', 1, AUTH_CONSTANTS.PASSWORD_MAX_LENGTH)
        ]
    } as ValidationSchema,

    // Profile update validation
    profileUpdate: {
        'profile.display_name': [
            (value: string) => value ? ValidationUtils.stringLength(value, 'display_name', 1, 100) : null
        ],
        'profile.email': [
            (value: string) => value ? ValidationUtils.emailPattern(value) : null
        ],
        'profile.bio': [
            (value: string) => value ? ValidationUtils.stringLength(value, 'bio', 0, 500) : null
        ]
    } as ValidationSchema,

    // Password change validation
    passwordChange: {
        newPassword: [
            ValidationUtils.required,
            (value: string) => ValidationUtils.stringLength(value, 'newPassword', AUTH_CONSTANTS.PASSWORD_MIN_LENGTH, AUTH_CONSTANTS.PASSWORD_MAX_LENGTH)
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
            (value: unknown) => value !== undefined ? ValidationUtils.boolean(value, 'published') : null
        ]
    } as ValidationSchema
};

// Parameter validation schemas
export const ParameterSchemas = {
    uuid: [
        ValidationUtils.required,
        (value: string, fieldName: string) => {
            if (typeof value !== 'string') {
                return `${fieldName} must be a string`;
            }
            if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
                return `${fieldName} must be a valid UUID`;
            }
            return null;
        }
    ]
};
