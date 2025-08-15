import express, { Request, Response, NextFunction } from 'express';
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
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.roles || !RoleCheck.hasRole(req.user.roles, UserRoles.ADMIN)) {
        throw Errors.forbidden('Admin access required');
    }
    next();
};

/**
 * @swagger
 * /api/cms/settings:
 *   get:
 *     tags: [CMS]
 *     summary: Получить все настройки CMS
 *     description: Возвращает все настройки системы управления контентом (только для администраторов)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Настройки CMS успешно получены
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CMSSetting'
 *                 message:
 *                   type: string
 *       401:
 *         description: Не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Нет прав администратора
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/settings', requireAuth, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
    const result = await getCMSSettings();
    
    if (result.success) {
        ResponseUtils.success(res, result.data, 'CMS settings retrieved successfully');
    } else {
        throw Errors.database('Failed to retrieve CMS settings');
    }
}));

/**
 * @swagger
 * /api/cms/settings/category/{category}:
 *   get:
 *     tags: [CMS]
 *     summary: Получить настройки CMS по категории
 *     description: Возвращает настройки CMS для определенной категории (только для администраторов)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         description: Категория настроек
 *         schema:
 *           type: string
 *           enum: [general, theme, security, content]
 *     responses:
 *       200:
 *         description: Настройки категории успешно получены
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CMSSetting'
 *                 message:
 *                   type: string
 *       401:
 *         description: Не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Нет прав администратора
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @swagger
 * /api/cms/settings/{key}:
 *   put:
 *     tags: [CMS]
 *     summary: Обновить настройку CMS
 *     description: Обновляет значение конкретной настройки CMS (только для администраторов)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         description: Ключ настройки для обновления
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CMSSettingUpdate'
 *     responses:
 *       200:
 *         description: Настройка успешно обновлена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
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
 *       403:
 *         description: Нет прав администратора
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @swagger
 * /api/cms/active-theme:
 *   get:
 *     tags: [CMS]
 *     summary: Получить активную тему сайта
 *     description: Возвращает текущую активную тему веб-сайта (публичный эндпоинт)
 *     responses:
 *       200:
 *         description: Активная тема успешно получена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Theme'
 *                 message:
 *                   type: string
 *       404:
 *         description: Активная тема не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/active-theme', asyncHandler(async (req: Request, res: Response) => {
    const result = await getActiveWebsiteTheme();
    
    if (result.success && result.data) {
        ResponseUtils.success(res, result.data, 'Active theme retrieved successfully');
    } else {
        throw Errors.notFound('No active theme found');
    }
}));

/**
 * @swagger
 * /api/cms/active-theme:
 *   put:
 *     tags: [CMS]
 *     summary: Установить активную тему сайта
 *     description: Устанавливает активную тему для веб-сайта (только для администраторов)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [theme_id]
 *             properties:
 *               theme_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID темы для активации
 *     responses:
 *       200:
 *         description: Тема сайта успешно обновлена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
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
 *       403:
 *         description: Нет прав администратора
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @swagger
 * /api/cms/registration-mode:
 *   get:
 *     tags: [CMS]
 *     summary: Получить режим регистрации
 *     description: Возвращает текущий режим регистрации пользователей (публичный эндпоинт)
 *     responses:
 *       200:
 *         description: Режим регистрации успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/RegistrationMode'
 *                 message:
 *                   type: string
 */
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

// Get default categories (public endpoint for homepage)
router.get('/public/default-categories', asyncHandler(async (req: Request, res: Response) => {
    const result = await getCMSSetting('default_categories');
    
    if (result.success && result.data) {
        ResponseUtils.success(res, result.data, 'Default categories retrieved successfully');
    } else {
        ResponseUtils.success(res, { setting_value: 'news,about,ads' }, 'Using default categories');
    }
}));

// Get enable_search setting (public endpoint for homepage)
router.get('/public/enable-search', asyncHandler(async (req: Request, res: Response) => {
    const result = await getCMSSetting('enable_search');
    
    if (result.success && result.data) {
        ResponseUtils.success(res, result.data, 'Enable search setting retrieved successfully');
    } else {
        ResponseUtils.success(res, { setting_value: 'true' }, 'Using default enable search value');
    }
}));

export default router;
