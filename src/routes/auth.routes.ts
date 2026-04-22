import express, { Request, Response } from 'express';
import { authClient } from '../auth-client';
import { requireAuth } from '../middleware/auth.middleware';
import { AuthenticatedUser } from '../middleware/auth.middleware';
import logger from '../utils/logger';

const router = express.Router();

router.post('/register', async (req: Request, res: Response) => {
    try {
        const { username, password, invite_code } = req.body;
        const user = await authClient.register({ username, password, invite_code });
        res.status(201).json(user);
    } catch (error) {
        const err = error as Error & { message?: string };
        logger.warn('Registration failed', { error: err.message });
        res.status(400).json({ error: err.message || 'registration failed' });
    }
});

router.post('/login', async (req: Request, res: Response) => {
    try {
        const { login, password } = req.body;
        const user = await authClient.login({ login, password });
        res.json(user);
    } catch (error) {
        const err = error as Error & { message?: string };
        logger.authAction('login', req.body.login || 'unknown', false);
        res.status(401).json({ error: err.message || 'invalid credentials' });
    }
});

router.post('/logout', requireAuth, async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (token) {
            await authClient.logout(token);
        }
        res.json({ ok: true });
    } catch {
        res.json({ ok: true });
    }
});

router.get('/session', requireAuth, async (req: Request & { user?: AuthenticatedUser }, res: Response) => {
    res.json(req.user);
});

router.post('/change-password', requireAuth, async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        const { current_password, new_password } = req.body;
        const result = await authClient.changePassword(token!, { current_password, new_password });
        res.json(result);
    } catch (error) {
        const err = error as Error & { message?: string };
        res.status(400).json({ error: err.message || 'password change failed' });
    }
});

export default router;