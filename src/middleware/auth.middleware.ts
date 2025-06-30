import { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../utils/jwt';

// Extend Express Request interface to include user property
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                login: string;
                roles: string[];
            };
        }
    }
}

// Centralized authentication middleware
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    authenticateToken(req, res, (error?: any) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: 'Authentication error',
                data: null
            });
        }
        
        // Check if user was successfully authenticated
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Please log in.',
                data: null
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
