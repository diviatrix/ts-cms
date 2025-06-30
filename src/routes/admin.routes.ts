import express, { Request, Response } from 'express';
import { requireAuthAndAdmin } from '../middleware/auth.middleware';
import { getAllBaseUsers } from '../functions/users';
import { getUser } from '../functions/user';
import { ResponseUtils } from '../utils/response.utils';
import { validateParams, ParameterSchemas } from '../middleware/validation.middleware';
import { asyncHandler, Errors } from '../middleware/error.middleware';
import logger from '../utils/logger';

const router = express.Router();

// Add the endpoint to get all users (for admin)
router.get('/admin/users', requireAuthAndAdmin, asyncHandler(async (req: Request, res: Response) => {
    logger.apiRequest('GET', '/api/admin/users', req.user?.id);
    const users = await getAllBaseUsers();
    if (!users) {
        throw Errors.database('Failed to retrieve users from database');
    }
    logger.info('Users retrieved successfully for admin', { count: users.data?.length });
    ResponseUtils.success(res, users, 'Users retrieved successfully');
}));

// Add the endpoint to get specific user profile (admin only)
router.get('/profile/:id', requireAuthAndAdmin, validateParams(ParameterSchemas.uuid), asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id;
    logger.apiRequest('GET', `/api/profile/${userId}`, req.user?.id);
    const user = await getUser(userId);
    if (!user) {
        throw Errors.notFound('User not found');
    }
    logger.info('User profile retrieved successfully', { targetUserId: userId, adminId: req.user?.id });
    ResponseUtils.success(res, user, 'User profile retrieved successfully');
}));

export default router;
