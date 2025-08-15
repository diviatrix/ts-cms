import { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../utils/jwt';

// User type for authenticated requests
export interface AuthenticatedUser {
    id: string;
    login: string;
    roles: string[];
}

// Extend Express Request interface to include user property
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}

// Centralized authentication middleware
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            status: 'error',
            message: 'Authentication required - no token provided'
        });
    }
    
    authenticateToken(req, res, () => {
        if (!req.user) {
            return res.status(401).json({
                status: 'error',
                message: 'Authentication failed - invalid token'
            });
        }
        next();
    });
};

// Optional authentication middleware (for endpoints that work with or without auth)
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
    // Try to authenticate, but don't fail if no token provided
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No token provided, continue without user
        return next();
    }
    
    // Token provided, try to authenticate
    authenticateToken(req, res, next);
};

// Admin role middleware (requires authentication first)
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ 
            status: 'error', 
            message: 'Authentication required' 
        });
    }
    
    if (!req.user.roles || !req.user.roles.includes('admin')) {
        return res.status(403).json({ 
            status: 'error', 
            message: 'Admin access required' 
        });
    }
    
    next();
};

// Combined auth + admin middleware
export const requireAuthAndAdmin = [requireAuth, requireAdmin];
