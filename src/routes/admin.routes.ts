import express, { Request, Response } from 'express';
import { requireAuthAndAdmin } from '../middleware/auth.middleware';
import { getAllBaseUsers } from '../functions/users';
import { getUser } from '../functions/user';
import { ResponseUtils } from '../utils/response.utils';
import { validateParams, ParameterSchemas } from '../middleware/validation.middleware';
import { asyncHandler, Errors } from '../middleware/error.middleware';
import logger from '../utils/logger';
import { getActiveTheme, getThemeSettings } from '../functions/themes';
import { getActiveWebsiteTheme } from '../functions/cms-settings';
import database from '../db';
import * as fs from 'fs/promises';
import * as path from 'path';

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

// Write theme config to frontend
router.put('/admin/theme/write-config', requireAuthAndAdmin, asyncHandler(async (req: Request, res: Response) => {
    logger.apiRequest('PUT', '/api/admin/theme/write-config', req.user?.id);
    
    // Get theme_id from request body or fall back to active theme
    const { theme_id } = req.body;
    let themeId: string;
    let themeName: string;
    
    if (theme_id) {
        // Use provided theme_id
        themeId = theme_id;
        const themeResult = await database.getThemeById(theme_id);
        if (!themeResult.success || !themeResult.data) {
            throw Errors.notFound('Theme not found');
        }
        themeName = themeResult.data.name;
    } else {
        // Fall back to active theme for backward compatibility
        const activeThemeResult = await getActiveWebsiteTheme();
        if (!activeThemeResult.success || !activeThemeResult.data) {
            throw Errors.notFound('No theme is currently applied to the website. Please apply a theme first.');
        }
        themeId = activeThemeResult.data.id;
        themeName = activeThemeResult.data.name;
    }
    
    const settingsResult = await getThemeSettings(themeId);
    if (!settingsResult.success) {
        throw Errors.database('Failed to retrieve theme settings');
    }
    
    // Transform settings array to object
    const settings = settingsResult.data || [];
    const configObject: Record<string, string> = {};
    
    if (Array.isArray(settings)) {
        settings.forEach((setting: any) => {
            // Map old names to new CSS variable names
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
    
    // Add custom CSS if present
    const customCssSetting = settings.find((s: any) => s.setting_key === 'custom_css');
    if (customCssSetting) {
        configObject['custom_css'] = customCssSetting.setting_value;
    }
    
    // Write to file
    const configPath = path.join(process.cwd(), 'public', 'theme-config.json');
    await fs.writeFile(configPath, JSON.stringify(configObject, null, 2), 'utf-8');
    
    logger.info('Theme config written to frontend', { 
        themeId: themeId,
        themeName: themeName,
        adminId: req.user?.id 
    });
    
    ResponseUtils.success(res, configObject, `Theme "${themeName}" config written successfully`);
}));

export default router;
