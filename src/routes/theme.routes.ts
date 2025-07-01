/**
 * Theme API Routes
 */

import { Router, Request, Response } from 'express';
import { requireAuth, requireAuthAndAdmin } from '../middleware/auth.middleware';
import { 
    createTheme, 
    getTheme, 
    getThemes, 
    updateTheme, 
    deleteTheme, 
    getThemeSettings, 
    setThemeSetting,
    getUserThemePreference,
    setUserThemePreference,
    getActiveTheme,
    setActiveTheme
} from '../functions/themes';

const router = Router();

// Get all themes (public)
router.get('/', async (req: Request, res: Response) => {
    const result = await getThemes();
    if (result.success) {
        res.json({ success: true, data: result.data });
    } else {
        res.status(500).json({ success: false, message: result.message });
    }
});

// Get active theme (public)
router.get('/active', async (req: Request, res: Response) => {
    const result = await getActiveTheme();
    if (result.success) {
        if (result.data) {
            // Also get theme settings
            const settingsResult = await getThemeSettings(result.data.id);
            res.json({ 
                success: true, 
                data: {
                    theme: result.data,
                    settings: settingsResult.success ? settingsResult.data : []
                }
            });
        } else {
            res.status(404).json({ success: false, message: 'No active theme found' });
        }
    } else {
        res.status(500).json({ success: false, message: result.message });
    }
});

// Get specific theme (public)
router.get('/:id', async (req: Request, res: Response) => {
    const result = await getTheme(req.params.id);
    if (result.success) {
        if (result.data) {
            // Also get theme settings
            const settingsResult = await getThemeSettings(req.params.id);
            res.json({ 
                success: true, 
                data: {
                    theme: result.data,
                    settings: settingsResult.success ? settingsResult.data : []
                }
            });
        } else {
            res.status(404).json({ success: false, message: 'Theme not found' });
        }
    } else {
        res.status(500).json({ success: false, message: result.message });
    }
});

// Create new theme (admin only)
router.post('/', requireAuthAndAdmin, async (req: Request, res: Response) => {
    // Add the authenticated user's ID as created_by
    const themeData = {
        ...req.body,
        created_by: req.user?.id
    };
    
    const result = await createTheme(themeData);
    if (result.success) {
        res.status(201).json({ success: true, data: result.data });
    } else {
        res.status(500).json({ success: false, message: result.message });
    }
});

// Update theme (admin only)
router.put('/:id', requireAuthAndAdmin, async (req: Request, res: Response) => {
    const result = await updateTheme(req.params.id, req.body);
    if (result.success) {
        if (result.data) {
            res.json({ success: true, data: result.data });
        } else {
            res.status(404).json({ success: false, message: 'Theme not found' });
        }
    } else {
        res.status(500).json({ success: false, message: result.message });
    }
});

// Delete theme (admin only)
router.delete('/:id', requireAuthAndAdmin, async (req: Request, res: Response) => {
    const result = await deleteTheme(req.params.id);
    if (result.success) {
        res.json({ success: true, message: 'Theme deleted successfully' });
    } else {
        res.status(500).json({ success: false, message: result.message });
    }
});

// Set active theme (admin only)
router.post('/:id/activate', requireAuthAndAdmin, async (req: Request, res: Response) => {
    const result = await setActiveTheme(req.params.id);
    if (result.success) {
        res.json({ success: true, message: 'Theme activated successfully' });
    } else {
        res.status(500).json({ success: false, message: result.message });
    }
});

// Get theme settings
router.get('/:id/settings', async (req: Request, res: Response) => {
    const result = await getThemeSettings(req.params.id);
    if (result.success) {
        // Transform array of settings into key-value object
        const settingsObject: Record<string, string> = {};
        if (Array.isArray(result.data)) {
            result.data.forEach((setting: any) => {
                if (setting.setting_key && setting.setting_value !== undefined) {
                    settingsObject[setting.setting_key] = setting.setting_value;
                }
            });
        }
        res.json({ success: true, data: settingsObject });
    } else {
        res.status(500).json({ success: false, message: result.message });
    }
});

// Set theme setting (admin only)
router.post('/:id/settings', requireAuthAndAdmin, async (req: Request, res: Response) => {
    const { key, value, type = 'string' } = req.body;
    
    if (!key || value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
        res.status(400).json({ 
            success: false, 
            message: 'Key and non-empty value are required' 
        });
        return;
    }

    const result = await setThemeSetting(req.params.id, key, value.toString(), type);
    if (result.success) {
        res.json({ success: true, message: 'Theme setting updated successfully' });
    } else {
        res.status(500).json({ success: false, message: result.message });
    }
});

// Get user theme preference
router.get('/user/:userId/preference', requireAuth, async (req: Request, res: Response) => {
    // Users can only get their own preferences unless they're admin
    if (req.user?.id !== req.params.userId && !req.user?.roles.includes('admin')) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
    }

    const result = await getUserThemePreference(req.params.userId);
    if (result.success) {
        res.json({ success: true, data: result.data });
    } else {
        res.status(500).json({ success: false, message: result.message });
    }
});

// Set user theme preference
router.post('/user/:userId/preference', requireAuth, async (req: Request, res: Response) => {
    // Users can only set their own preferences unless they're admin
    if (req.user?.id !== req.params.userId && !req.user?.roles.includes('admin')) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
    }

    const { theme_id, custom_settings = {} } = req.body;
    
    if (!theme_id) {
        res.status(400).json({ 
            success: false, 
            message: 'Theme ID is required' 
        });
        return;
    }

    const result = await setUserThemePreference(req.params.userId, theme_id, custom_settings);
    if (result.success) {
        res.json({ success: true, message: 'Theme preference saved successfully' });
    } else {
        res.status(500).json({ success: false, message: result.message });
    }
});

export default router;
