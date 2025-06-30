import express, { Request, Response } from 'express';
import { registerUser } from '../functions/register';
import { loginUser } from '../functions/login';
import { ResponseUtils } from '../utils/response.utils';
import { validateBody, ValidationSchemas } from '../middleware/validation.middleware';
import { asyncHandler, Errors } from '../middleware/error.middleware';
import logger from '../utils/logger';

const router = express.Router();

// Add the registration endpoint
router.post('/register', validateBody(ValidationSchemas.register), asyncHandler(async (req: Request, res: Response) => {
    const userData = req.body;
    logger.info('User registration attempt', { login: userData.login, email: userData.email });

    const result = await registerUser(userData);
    if (result) {
        ResponseUtils.created(res, result, 'User registered successfully');
    } else {
        logger.warn('User registration failed', { login: userData.login, email: userData.email });
        throw Errors.validation('Registration failed');
    }
}));

// Add the login endpoint
router.post('/login', validateBody(ValidationSchemas.login), asyncHandler(async (req: Request, res: Response) => {
    const { login, password } = req.body;
    logger.info('User login attempt', { login });

    const result = await loginUser(login, password);
    if (result && result.success && result.data) {
        logger.authAction('login', result.data.user.id, true);
        ResponseUtils.success(res, { token: result.data?.token }, 'Login successful');
    } else {
        logger.authAction('login', login, false);
        throw Errors.unauthorized(result.message || 'Login failed');
    }
}));

export default router;
