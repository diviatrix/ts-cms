import { Request, Response, NextFunction } from 'express';
import messages from '../data/messages';
import { UserRoles } from '../data/groups';

export class RoleCheck {
    public static hasRole(userRoles: string[], requiredRole: UserRoles): boolean {
        return userRoles.includes(requiredRole);
    }

    public static adminAuth(req: Request, res: Response, next: NextFunction): void {
        const user = (req as any).user; // Assuming user is attached to req by authenticateToken middleware
        console.log('RoleCheck: User object:', user);
        console.log('RoleCheck: User roles:', user?.roles);

        if (!user || !user.roles || !RoleCheck.hasRole(user.roles, UserRoles.ADMIN)) {
            console.log('RoleCheck: Access forbidden for user:', user?.id);
            res.status(403).json({ status: 'error', message: messages.forbidden });
            return;
        }
        console.log('RoleCheck: Access granted for user:', user?.id);
        next();
    }
}