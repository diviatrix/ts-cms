import express, { Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { authClient } from '../auth-client';

const router = express.Router();

router.get('/profile', requireAuth, async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        const user = await authClient.validateToken(token!);
        if (!user) {
            return res.status(401).json({ error: 'not authenticated' });
        }
        res.json({
            id: user.id.toString(),
            username: user.username,
            role: user.role,
            must_change_password: user.must_change_password
        });
    } catch {
        res.status(500).json({ error: 'failed to get profile' });
    }
});

router.put('/profile', requireAuth, async (req: Request, res: Response) => {
    res.json({ message: 'Profile update not supported - use auth.hole.icu' });
});

router.post('/profile/password/set', requireAuth, async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { newPassword } = req.body;
    try {
        await authClient.changePassword(token!, { current_password: '', new_password: newPassword });
        res.json({ message: 'Password changed' });
    } catch {
        res.status(400).json({ error: 'Failed to change password' });
    }
});

export default router;