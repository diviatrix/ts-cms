import { Request, Response, NextFunction } from 'express';
import { authClient, AuthUser } from '../auth-client';

export interface AuthenticatedUser {
    id: string;
    login: string;
    roles: string[];
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            status: 'error',
            message: 'Authentication required - no session'
        });
    }

    const token = authHeader.replace('Bearer ', '');

    authClient.validateToken(token)
        .then((user: AuthUser | null) => {
            if (!user) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Authentication failed - invalid session'
                });
            }

const r = req as unknown as { user?: AuthenticatedUser };
            r.user = {
                id: user.id.toString(),
                login: user.username,
                roles: [user.role]
            };
            next();
        })
        .catch((error) => {
            console.error('Auth validation error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Authentication error'
            });
        });
}

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.replace('Bearer ', '');

    authClient.validateToken(token)
        .then((user: AuthUser | null) => {
if (user) {
                const r = req as unknown as { user?: AuthenticatedUser };
                r.user = {
                    id: user.id.toString(),
                    login: user.username,
                    roles: [user.role]
                };
            }
            next();
        })
        .catch(() => {
            next();
        });
};

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
    const r = req as unknown as { user?: AuthenticatedUser };
    const user = r.user;
    if (!user) {
        return res.status(401).json({
            status: 'error',
            message: 'Authentication required'
        });
    }

    if (!user.roles || !user.roles.includes('admin')) {
        return res.status(403).json({
            status: 'error',
            message: 'Admin access required'
        });
    }

    next();
}

export const requireAuthAndAdmin = [requireAuth, requireAdmin];