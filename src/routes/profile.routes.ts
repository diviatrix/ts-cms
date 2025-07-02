import express, { Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getUserProfile, setPassword } from '../functions/user';
import { updateProfile } from '../functions/updateProfile';
import { RoleCheck } from '../functions/roleCheck';
import { UserRoles } from '../data/groups';
import database from '../db';
import { ResponseUtils } from '../utils/response.utils';
import { validateNestedBody, validateBody, ValidationSchemas } from '../middleware/validation.middleware';
import { asyncHandler, Errors } from '../middleware/error.middleware';

const router = express.Router();

// Add the profile endpoint
router.get('/profile', requireAuth, asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.user.id) {
        throw Errors.unauthorized('User information not available');
    }

    const userId = req.user.id;
    const profile = await getUserProfile(userId);
    
    if (!profile.success) {
        throw Errors.notFound(profile.message || 'Profile not found');
    }
    
    ResponseUtils.success(res, profile.data, profile.message);
}));

// Add the update profile endpoint
router.put('/profile', requireAuth, asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.user.id) {
        throw Errors.unauthorized('User information not available');
    }

    const userId = req.user.id;
    const { public_name, bio } = req.body;
    
    // Validate that at least one field is provided
    if (!public_name && !bio) {
        throw Errors.validation('At least one field (public_name or bio) must be provided');
    }
    
    const result = await updateProfile(userId, { public_name, bio });
    
    if (!result.success) {
        throw Errors.validation(result.message || 'Failed to update profile');
    }
    
    ResponseUtils.success(res, result.data, result.message);
}));

// Add the profile update endpoint
router.post('/profile', requireAuth, validateNestedBody(ValidationSchemas.profileUpdate), asyncHandler(async (req: Request, res: Response) => {
    const authenticatedUserId = req.user!.id;
    const isAuthenticatedUserAdmin = req.user!.roles && RoleCheck.hasRole(req.user!.roles, UserRoles.ADMIN);

    let targetUserId = authenticatedUserId;
    if (isAuthenticatedUserAdmin && req.body.user_id) {
        targetUserId = req.body.user_id;
    }

    const profileData = req.body.profile || {};
    const baseData = req.body.base || {};
    const incomingRoles = profileData.roles;
    delete profileData.roles;

    // Update user profile
    await database.updateUserProfile(targetUserId, profileData);

    // Handle role updates (admin only)
    if (isAuthenticatedUserAdmin && incomingRoles !== undefined) {
        const currentRolesResult = await database.getUserRoles(targetUserId);
        const currentRoles = currentRolesResult.success && currentRolesResult.data ? currentRolesResult.data : [UserRoles.GUEST];

        // Roles to add
        for (const role of incomingRoles) {
            if (!currentRoles.includes(role)) {
                await database.addUserToGroup(targetUserId, role);
            }
        }

        // Roles to remove
        for (const role of currentRoles) {
            if (!incomingRoles.includes(role)) {
                await database.removeUserFromGroup(targetUserId, role);
            }
        }
    }

    // Update base user data (only for admins)
    if (isAuthenticatedUserAdmin) {
        await database.updateUser(targetUserId, baseData);
        ResponseUtils.success(res, null, 'User profile and base data updated successfully');
    } else {
        ResponseUtils.success(res, null, 'User profile updated successfully');
    }
}));

// Add the endpoint to set user password
router.post('/profile/password/set', requireAuth, validateBody(ValidationSchemas.passwordChange), asyncHandler(async (req: Request, res: Response) => {
    const { userId, newPassword } = req.body;
    const authenticatedUserId = req.user!.id;
    const isAuthenticatedUserAdmin = req.user!.roles && RoleCheck.hasRole(req.user!.roles, UserRoles.ADMIN);

    let targetUserId = userId;

    // If userId is not provided, or if the authenticated user is not an admin,
    // they can only change their own password.
    if (!targetUserId || !isAuthenticatedUserAdmin) {
        targetUserId = authenticatedUserId;
    }

    // If an admin tries to change a password for a user that doesn't exist
    if (isAuthenticatedUserAdmin && userId && targetUserId !== userId) {
        throw Errors.validation('Invalid target user ID for admin password change');
    }

    // Call a function to handle password update (will be implemented in user.ts)
    const result = await setPassword(targetUserId, newPassword);

    if (result.success) {
        ResponseUtils.success(res, null, 'Password updated successfully');
    } else {
        throw Errors.validation(result.message || 'Password update failed');
    }
}));

export default router;
