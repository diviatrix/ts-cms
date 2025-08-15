import express, { Request, Response } from 'express';
import { IThemeSetting } from '../types/ITheme';
import { requireAuthAndAdmin } from '../middleware/auth.middleware';
import { getAllBaseUsers } from '../functions/users';
import { getUser } from '../functions/user';
import { ResponseUtils } from '../utils/response.utils';
import { validateParams, ParameterSchemas } from '../middleware/validation.middleware';
import { asyncHandler, Errors } from '../middleware/error.middleware';
import logger from '../utils/logger';
import { getThemeSettings } from '../functions/themes';
import { getActiveWebsiteTheme } from '../functions/cms-settings';
import { createInvite, getAllInvitesWithInfo, deleteInvite } from '../functions/invites';
import database from '../db';
import * as fs from 'fs/promises';
import * as path from 'path';

const router = express.Router();

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Получить всех пользователей
 *     description: Возвращает список всех пользователей системы (только для администраторов)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список пользователей успешно получен
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
 *                     $ref: '#/components/schemas/User'
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
router.get('/admin/users', requireAuthAndAdmin, asyncHandler(async (req: Request, res: Response) => {
    logger.apiRequest('GET', '/api/admin/users', req.user?.id);
    const users = await getAllBaseUsers();
    if (!users) {
        throw Errors.database('Failed to retrieve users from database');
    }
    logger.info('Users retrieved successfully for admin', { count: users.data?.length });
    ResponseUtils.success(res, users, 'Users retrieved successfully');
}));

/**
 * @swagger
 * /api/profile/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Получить профиль пользователя по ID
 *     description: Возвращает профиль конкретного пользователя (только для администраторов)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Уникальный идентификатор пользователя
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Профиль пользователя успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
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
 *       404:
 *         description: Пользователь не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @swagger
 * /api/admin/theme/write-config:
 *   put:
 *     tags: [Admin]
 *     summary: Записать конфигурацию темы
 *     description: Записывает конфигурацию темы в frontend файл (только для администраторов)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ThemeConfigRequest'
 *     responses:
 *       200:
 *         description: Конфигурация темы успешно записана
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ThemeSettings'
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
 *       404:
 *         description: Тема не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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
        settings.forEach((setting: IThemeSetting) => {
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
    const customCssSetting = settings.find((s: IThemeSetting) => s.setting_key === 'custom_css');
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

/**
 * @swagger
 * /api/admin/invites:
 *   post:
 *     tags: [Admin]
 *     summary: Создать приглашение
 *     description: Создает новое приглашение для регистрации (только для администраторов)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Приглашение успешно создано
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Invite'
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
router.post('/admin/invites', requireAuthAndAdmin, asyncHandler(async (req: Request, res: Response) => {
    logger.apiRequest('POST', '/api/admin/invites', req.user?.id);
    
    const result = await createInvite(req.user!.id);
    if (result.success && result.data) {
        logger.info('Invite created successfully', { inviteId: result.data.id, adminId: req.user?.id });
        ResponseUtils.created(res, result.data, 'Invite created successfully');
    } else {
        throw Errors.database(result.message || 'Failed to create invite');
    }
}));

/**
 * @swagger
 * /api/admin/invites:
 *   get:
 *     tags: [Admin]
 *     summary: Получить все приглашения
 *     description: Возвращает список всех приглашений с информацией об использовании (только для администраторов)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список приглашений успешно получен
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
 *                     $ref: '#/components/schemas/Invite'
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
router.get('/admin/invites', requireAuthAndAdmin, asyncHandler(async (req: Request, res: Response) => {
    logger.apiRequest('GET', '/api/admin/invites', req.user?.id);
    
    const result = await getAllInvitesWithInfo();
    if (result.success) {
        logger.info('Invites retrieved successfully', { count: result.data?.length, adminId: req.user?.id });
        ResponseUtils.success(res, result.data, 'Invites retrieved successfully');
    } else {
        throw Errors.database(result.message || 'Failed to retrieve invites');
    }
}));

/**
 * @swagger
 * /api/admin/invites/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Удалить приглашение
 *     description: Удаляет приглашение по ID (только неиспользованные, только для администраторов)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Уникальный идентификатор приглашения
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Приглашение успешно удалено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     deleted:
 *                       type: boolean
 *                       example: true
 *                 message:
 *                   type: string
 *       400:
 *         description: Ошибка валидации (попытка удалить использованное приглашение)
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
 *       404:
 *         description: Приглашение не найдено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/admin/invites/:id', requireAuthAndAdmin, validateParams(ParameterSchemas.uuid), asyncHandler(async (req: Request, res: Response) => {
    const inviteId = req.params.id;
    logger.apiRequest('DELETE', `/api/admin/invites/${inviteId}`, req.user?.id);
    
    const result = await deleteInvite(inviteId);
    if (result.success) {
        logger.info('Invite deleted successfully', { inviteId, adminId: req.user?.id });
        ResponseUtils.success(res, { deleted: true }, 'Invite deleted successfully');
    } else {
        if (result.message?.includes('not found')) {
            throw Errors.notFound('Invite not found');
        } else if (result.message?.includes('Cannot delete used invite')) {
            throw Errors.validation('Cannot delete used invite');
        } else {
            throw Errors.database(result.message || 'Failed to delete invite');
        }
    }
}));

export default router;
