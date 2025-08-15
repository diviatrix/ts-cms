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

/**
 * @swagger
 * /api/profile:
 *   get:
 *     tags: [Profile]
 *     summary: Получить профиль пользователя
 *     description: Возвращает профиль текущего авторизованного пользователя
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Профиль успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *                 message:
 *                   type: string
 *       401:
 *         description: Не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Профиль не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @swagger
 * /api/profile:
 *   put:
 *     tags: [Profile]
 *     summary: Обновить профиль пользователя
 *     description: Обновляет публичное имя и/или биографию пользователя
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProfileUpdateRequest'
 *     responses:
 *       200:
 *         description: Профиль успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @swagger
 * /api/profile:
 *   post:
 *     tags: [Profile]
 *     summary: Обновить расширенный профиль пользователя
 *     description: Обновляет профиль пользователя с возможностью изменения ролей (для администраторов)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID пользователя (только для администраторов)
 *               profile:
 *                 type: object
 *                 properties:
 *                   public_name:
 *                     type: string
 *                   bio:
 *                     type: string
 *               base:
 *                 type: object
 *                 properties:
 *                   login:
 *                     type: string
 *                   email:
 *                     type: string
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Роли пользователя (только для администраторов)
 *     responses:
 *       200:
 *         description: Профиль успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 */
router.post('/profile', requireAuth, validateNestedBody(ValidationSchemas.profileUpdate), asyncHandler(async (req: Request, res: Response) => {
    const authenticatedUserId = req.user!.id;
    const isAuthenticatedUserAdmin = req.user!.roles && RoleCheck.hasRole(req.user!.roles, UserRoles.ADMIN);

    let targetUserId = authenticatedUserId;
    if (isAuthenticatedUserAdmin && req.body.user_id) {
        targetUserId = req.body.user_id;
    }

    const profileData = req.body.profile || {};
    const baseData = req.body.base || {};
    const incomingRoles = req.body.roles; // Roles are at root level
    delete profileData.roles; // Just in case

    // Update user profile
    await database.updateUserProfile(targetUserId, profileData);

    // Handle role updates (admin only)
    if (isAuthenticatedUserAdmin && incomingRoles !== undefined) {
        const currentRolesResult = await database.getUserRoles(targetUserId);
        const currentRoles = currentRolesResult.success && currentRolesResult.data ? currentRolesResult.data : [UserRoles.GUEST];

        // Roles to add
        for (const role of incomingRoles) {
            if (!currentRoles.includes(role)) {
                const result = await database.addUserToGroup(targetUserId, role);
                if (!result.success) {
                    console.error(`Failed to add role ${role} to user ${targetUserId}:`, result.message);
                }
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

/**
 * @swagger
 * /api/profile/password/set:
 *   post:
 *     tags: [Profile]
 *     summary: Изменить пароль пользователя
 *     description: Устанавливает новый пароль для пользователя (администраторы могут менять пароли других пользователей)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordChangeRequest'
 *     responses:
 *       200:
 *         description: Пароль успешно изменен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password updated successfully"
 *       400:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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
