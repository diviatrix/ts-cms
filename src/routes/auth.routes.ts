import express, { Request, Response } from 'express';
import { registerUser } from '../functions/register';
import { loginUser } from '../functions/login';
import { ResponseUtils } from '../utils/response.utils';
import { validateBody, ValidationSchemas } from '../middleware/validation.middleware';
import { asyncHandler, Errors } from '../middleware/error.middleware';
import logger from '../utils/logger';

const router = express.Router();

/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - login
 *               - email
 *               - password
 *             properties:
 *               login:
 *                 type: string
 *                 minLength: 4
 *                 description: Username for the account
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Password for the account
 *               inviteCode:
 *                 type: string
 *                 description: Invite code (required when registration_mode is INVITE_ONLY)
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       403:
 *         description: Registration is closed
 *       422:
 *         description: Validation error or invalid invite code
 */
router.post('/register', validateBody(ValidationSchemas.register), asyncHandler(async (req: Request, res: Response) => {
    const userData = req.body;
    const inviteCode = userData.inviteCode;
    
    logger.info('User registration attempt', { login: userData.login, email: userData.email, hasInvite: !!inviteCode });

    // Hash the password before passing to registerUser
    const userDataWithHash = {
        ...userData,
        password_hash: userData.password
    };
    delete userDataWithHash.password; // Remove plain password
    delete userDataWithHash.inviteCode; // Remove invite code from user data

    const result = await registerUser(userDataWithHash, inviteCode);
    if (result.success && result.data) {
        ResponseUtils.created(res, result.data, result.message || 'User registered successfully');
    } else {
        logger.warn('User registration failed', { login: userData.login, email: userData.email, error: result.message });
        throw Errors.validation(result.message || 'Registration failed. Please check your information and try again.');
    }
}));

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Authenticate user and receive JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - login
 *               - password
 *             properties:
 *               login:
 *                 type: string
 *                 description: Username
 *               password:
 *                 type: string
 *                 description: Password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT authentication token
 *                 message:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 */
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
