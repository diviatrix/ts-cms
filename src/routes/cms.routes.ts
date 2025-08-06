import express, { Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { RoleCheck } from '../functions/roleCheck';
import { UserRoles } from '../data/groups';
import { 
    getCMSSettings, 
    getCMSSetting, 
    setCMSSetting, 
    getActiveWebsiteTheme, 
    setActiveWebsiteTheme,
    getCMSSettingsByCategory
} from '../functions/cms-settings';
import { ResponseUtils } from '../utils/response.utils';
import { asyncHandler, Errors } from '../middleware/error.middleware';
import { ContextLogger } from '../utils/context-logger';

const router = express.Router();

// Middleware to require admin access
const requireAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.user?.roles || !RoleCheck.hasRole(req.user.roles, UserRoles.ADMIN)) {
        throw Errors.forbidden('Admin access required');
    }
    next();
};

// Get all CMS settings (admin only)
router.get('/settings', requireAuth, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
    const result = await getCMSSettings();
    
    if (result.success) {
        ResponseUtils.success(res, result.data, 'CMS settings retrieved successfully');
    } else {
        throw Errors.database('Failed to retrieve CMS settings');
    }
}));

// Get CMS settings by category (admin only)
router.get('/settings/category/:category', requireAuth, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
    const { category } = req.params;
    const result = await getCMSSettingsByCategory(category);
    
    if (result.success) {
        ResponseUtils.success(res, result.data, `${category} settings retrieved successfully`);
    } else {
        throw Errors.database('Failed to retrieve category settings');
    }
}));

// Get specific CMS setting (admin only)
router.get('/settings/:key', requireAuth, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.params;
    const result = await getCMSSetting(key);
    
    if (result.success && result.data) {
        ResponseUtils.success(res, result.data, 'Setting retrieved successfully');
    } else {
        throw Errors.notFound('Setting not found');
    }
}));

// Update CMS setting (admin only)
router.put('/settings/:key', requireAuth, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.params;
    const { value, type = 'string' } = req.body;
    
    if (!value && value !== '' && value !== false && value !== 0) {
        throw Errors.validation('Setting value is required');
    }
    
    const result = await setCMSSetting(key, String(value), type, req.user!.id);
    
    if (result.success) {
        ContextLogger.operation('CMS-Settings', 'UPDATE', key, 'SUCCESS');
        ResponseUtils.success(res, null, 'Setting updated successfully');
    } else {
        throw Errors.database('Failed to update setting');
    }
}));

// Get active website theme (public endpoint)
router.get('/active-theme', asyncHandler(async (req: Request, res: Response) => {
    const result = await getActiveWebsiteTheme();
    
    if (result.success && result.data) {
        ResponseUtils.success(res, result.data, 'Active theme retrieved successfully');
    } else {
        throw Errors.notFound('No active theme found');
    }
}));

// Set active website theme (admin only)
router.put('/active-theme', requireAuth, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
    const { theme_id } = req.body;
    
    if (!theme_id) {
        throw Errors.validation('Theme ID is required');
    }
    
    const result = await setActiveWebsiteTheme(theme_id, req.user!.id);
    
    if (result.success) {
        ContextLogger.operation('CMS-Settings', 'SET_THEME', theme_id, 'SUCCESS');
        ResponseUtils.success(res, null, 'Website theme updated successfully');
    } else {
        throw Errors.database(result.message || 'Failed to update website theme');
    }
}));

// Get registration mode (public endpoint for registration form)
router.get('/registration-mode', asyncHandler(async (req: Request, res: Response) => {
    const result = await getCMSSetting('registration_mode');
    const mode = result.success && result.data ? result.data.setting_value : 'OPEN';
    
    ResponseUtils.success(res, { registration_mode: mode }, 'Registration mode retrieved successfully');
}));

// Public endpoints for site info
router.get('/public/site-name', asyncHandler(async (req: Request, res: Response) => {
    const result = await getCMSSetting('site_name');
    
    if (result.success && result.data) {
        ResponseUtils.success(res, result.data, 'Site name retrieved successfully');
    } else {
        ResponseUtils.success(res, { setting_value: 'TypeScript CMS' }, 'Using default site name');
    }
}));

router.get('/public/site-description', asyncHandler(async (req: Request, res: Response) => {
    const result = await getCMSSetting('site_description');
    
    if (result.success && result.data) {
        ResponseUtils.success(res, result.data, 'Site description retrieved successfully');
    } else {
        ResponseUtils.success(res, { setting_value: '© 2025 TypeScript CMS. All rights reserved.' }, 'Using default site description');
    }
}));

export default router;
