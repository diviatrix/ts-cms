import express, { Request, Response } from 'express';
import { IThemeSetting } from '../types/ITheme';
import { requireAuthAndAdmin } from '../middleware/auth.middleware';
import { AuthenticatedUser } from '../middleware/auth.middleware';
import { authClient } from '../auth-client';
import { getThemeSettings } from '../functions/themes';
import { getActiveWebsiteTheme } from '../functions/cms-settings';
import database from '../db';
import * as fs from 'fs/promises';
import * as path from 'path';

const router = express.Router();

router.get('/admin/users', requireAuthAndAdmin, async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        const result = await authClient.listUsers(token!);
        res.json({ users: result.users, total: result.total });
    } catch (error) {
        const err = error as Error & { message?: string };
        res.status(500).json({ error: err.message || 'failed to retrieve users' });
    }
});

router.get('/admin/users/:id', requireAuthAndAdmin, async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        const userId = parseInt(req.params.id);
        const user = await authClient.getUser(token!, userId);
        res.json(user);
    } catch (error) {
        const err = error as Error & { message?: string };
        if (err.message?.includes('not found')) {
            res.status(404).json({ error: 'user not found' });
        } else {
            res.status(500).json({ error: err.message || 'failed to retrieve user' });
        }
    }
});

router.delete('/admin/users/:id', requireAuthAndAdmin, async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        const userId = parseInt(req.params.id);
        await authClient.deleteUser(token!, userId);
        res.json({ ok: true });
    } catch (error) {
        const err = error as Error & { message?: string };
        if (err.message?.includes('not found')) {
            res.status(404).json({ error: 'user not found' });
        } else {
            res.status(500).json({ error: err.message || 'failed to delete user' });
        }
    }
});

router.put('/admin/users/:id/role', requireAuthAndAdmin, async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        const userId = parseInt(req.params.id);
        const { role } = req.body;
        const result = await authClient.setUserRole(token!, userId, role);
        res.json(result);
    } catch (error) {
        const err = error as Error & { message?: string };
        res.status(400).json({ error: err.message || 'failed to update user role' });
    }
});

router.put('/admin/theme/apply', requireAuthAndAdmin, async (req: Request, res: Response) => {
    const { theme_id } = req.body;
    let themeId: string;

    if (theme_id) {
        themeId = theme_id;
        const themeResult = await database.theme.getThemeById(theme_id);
        if (!themeResult.success || !themeResult.data) {
            return res.status(404).json({ error: 'Theme not found' });
        }
    } else {
        const activeThemeResult = await getActiveWebsiteTheme();
        if (!activeThemeResult.success || !activeThemeResult.data) {
            return res.status(404).json({ error: 'No theme is currently applied' });
        }
        themeId = activeThemeResult.data.id;
    }

    const settingsResult = await getThemeSettings(themeId);
    if (!settingsResult.success) {
        return res.status(500).json({ error: 'Failed to retrieve theme settings' });
    }

    const settings = settingsResult.data || [];
    const configObject: Record<string, string> = {};

    if (Array.isArray(settings)) {
        settings.forEach((setting: IThemeSetting) => {
            const keyMap: Record<string, string> = {
                'primary_color': 'primary',
                'secondary_color': 'secondary',
                'background_color': 'background',
                'surface_color': 'surface',
                'text_color': 'text',
                'border_color': 'border',
                'muted_color': 'muted',
                'error_color': 'error',
                'success_color': 'success',
                'font_family': 'font-family',
                'font_size': 'font-size',
                'radius': 'radius',
                'spacing': 'spacing',
                'shadow': 'shadow'
            };

            const cssKey = keyMap[setting.setting_key] || setting.setting_key;
            configObject[cssKey] = setting.setting_value;
        });
    }

    const customCssSetting = settings.find((s: IThemeSetting) => s.setting_key === 'custom_css');
    if (customCssSetting) {
        configObject['custom_css'] = customCssSetting.setting_value;
    }

    const configPath = path.join(process.cwd(), 'public', 'theme-config.json');
    await fs.writeFile(configPath, JSON.stringify(configObject, null, 2), 'utf-8');

    const typedReq = req as Request & { user?: AuthenticatedUser };
    const userId = typedReq.user?.id || 'system';
    await database.setActiveWebsiteTheme(themeId, userId);

    res.json(configObject);
});

export default router;