import { Request, Response, NextFunction } from 'express';
import messages from '../data/messages';
import { UserRoles } from '../data/groups';

export class RoleCheck {
    public static hasRole(userRoles: string[], requiredRole: UserRoles): boolean {
        return userRoles.includes(requiredRole);
    }

    public static adminAuth(req: Request, res: Response, next: NextFunction): void {
        const user = req.user; // User is now properly typed in Express Request interface

        if (!user || !user.roles || !RoleCheck.hasRole(user.roles, UserRoles.ADMIN)) {
            res.status(403).json({ status: 'error', message: messages.forbidden });
            return;
        }
        next();
    }
}