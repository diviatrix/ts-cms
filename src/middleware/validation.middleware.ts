import { Request, Response, NextFunction } from 'express';
import { ResponseUtils } from '../utils/response.utils';
import { ValidationSchemas } from '../constants/validation-schemas';
import type { ValidationSchema, ValidationRule } from '../constants/validation-schemas';
import ValidationUtils from '../utils/validation-utils';

export { ValidationSchemas };

// Validation middleware for request body
export function validateBody(schema: ValidationSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
        const errors: string[] = [];
        
        // Validate each field according to the schema
        for (const field in schema) {
            const rules = schema[field];
            const value = req.body[field];
            
            for (const rule of rules) {
                const error = rule(value, field);
                if (error) {
                    errors.push(error);
                    break; // Stop checking rules for this field once an error is found
                }
            }
        }
        
        if (errors.length > 0) {
            return ResponseUtils.error(res, errors.join(', '), 400);
        }
        
        next();
    };
}

// Validation middleware for nested objects (same as validateBody for now)
export function validateNestedBody(schema: ValidationSchema) {
    return validateBody(schema);
}

// Validation middleware for URL parameters
export function validateParams(schema: ValidationRule[], paramName: string = 'id') {
    return (req: Request, res: Response, next: NextFunction) => {
        const errors: string[] = [];
        
        // Validate each parameter according to the schema
        for (const rule of schema) {
            const error = rule(req.params[paramName], paramName);
            if (error) {
                errors.push(error);
                break; // Stop checking rules once an error is found
            }
        }
        
        if (errors.length > 0) {
            return ResponseUtils.error(res, errors.join(', '), 400);
        }
        
        next();
    };
}

export default ValidationUtils;