import { createError, ErrorType } from '../middleware/error.middleware';

// Specialized error creators for common scenarios
export const Errors = {
    notFound: (resource: string = 'Resource') => 
        createError(`${resource} not found`, ErrorType.NOT_FOUND),
    
    unauthorized: (message: string = 'Authentication required') => 
        createError(message, ErrorType.AUTHENTICATION),
    
    forbidden: (message: string = 'Access forbidden') => 
        createError(message, ErrorType.AUTHORIZATION),
    
    validation: (message: string = 'Validation failed') => 
        createError(message, ErrorType.VALIDATION),
    
    conflict: (resource: string = 'Resource') => 
        createError(`${resource} already exists`, ErrorType.CONFLICT),
    
    database: (operation: string = 'Database operation') => 
        createError(`${operation} failed`, ErrorType.DATABASE)
};
