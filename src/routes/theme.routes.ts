/**
 * Theme API Routes
 */

import { Router, Request, Response } from 'express';
import { IThemeSetting } from '../types/ITheme';
import { IResolveWithStatus } from '../types/IResolve';
import { requireAuth, requireAuthAndAdmin } from '../middleware/auth.middleware';
import { validateParams, ValidationUtils } from '../middleware/validation.middleware';
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

// User ID parameter validation schema
const UserIdParameterSchema = {
    userId: [
        ValidationUtils.required,
        ValidationUtils.uuid
    ]
};

const router = Router();

/**
 * @swagger
 * /api/themes:
 *   get:
 *     tags: [Themes]
 *     summary: Получить все темы
 *     description: Возвращает список всех доступных тем оформления
 *     responses:
 *       200:
 *         description: Список тем успешно получен
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
 *                     $ref: '#/components/schemas/Theme'
 *       500:
 *         description: Ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', async (req: Request, res: Response) => {
    const result = await getThemes();
    if (result.success) {
        res.json({ success: true, data: result.data });
    } else {
        res.status(500).json({ success: false, message: result.message });
    }
});

/**
 * @swagger
 * /api/themes/active:
 *   get:
 *     tags: [Themes]
 *     summary: Получить активную тему
 *     description: Возвращает текущую активную тему с настройками
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
 *                   $ref: '#/components/schemas/ThemeWithSettings'
 *       404:
 *         description: Активная тема не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @swagger
 * /api/themes/{id}:
 *   get:
 *     tags: [Themes]
 *     summary: Получить тему по ID
 *     description: Возвращает информацию о конкретной теме и её настройках
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Уникальный идентификатор темы
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Тема успешно получена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ThemeWithSettings'
 *       404:
 *         description: Тема не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @swagger
 * /api/themes:
 *   post:
 *     tags: [Themes]
 *     summary: Создать новую тему
 *     description: Создает новую тему оформления (только для администраторов)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ThemeCreateRequest'
 *     responses:
 *       201:
 *         description: Тема успешно создана
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
 *       500:
 *         description: Ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @swagger
 * /api/themes/{id}:
 *   put:
 *     tags: [Themes]
 *     summary: Обновить тему
 *     description: Обновляет информацию о теме (только для администраторов)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Уникальный идентификатор темы
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ThemeUpdateRequest'
 *     responses:
 *       200:
 *         description: Тема успешно обновлена
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
 *       500:
 *         description: Ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:id', requireAuthAndAdmin, async (req: Request, res: Response) => {
    const result = await updateTheme(req.params.id, req.body);
    if (result.success) {
        if (result.data) {
            res.json({ success: true, data: result.data });
        } else {
            res.status(404).json({ success: false, message: 'Theme not found' });
        }
    } else {
        // Check if it's a 404 error from updateTheme function
        const resultWithStatus = result as IResolveWithStatus<unknown>;
        const statusCode = resultWithStatus.statusCode || 500;
        res.status(statusCode).json({ success: false, message: result.message });
    }
});

/**
 * @swagger
 * /api/themes/{id}:
 *   delete:
 *     tags: [Themes]
 *     summary: Удалить тему
 *     description: Удаляет тему оформления (только для администраторов)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Уникальный идентификатор темы
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Тема успешно удалена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Theme deleted successfully"
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
 *       500:
 *         description: Ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', requireAuthAndAdmin, async (req: Request, res: Response) => {
    const result = await deleteTheme(req.params.id);
    if (result.success) {
        res.json({ success: true, message: 'Theme deleted successfully' });
    } else {
        res.status(500).json({ success: false, message: result.message });
    }
});

/**
 * @swagger
 * /api/themes/{id}/activate:
 *   post:
 *     tags: [Themes]
 *     summary: Активировать тему
 *     description: Устанавливает тему как активную (только для администраторов)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Уникальный идентификатор темы
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Тема успешно активирована
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Theme activated successfully"
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
 *       500:
 *         description: Ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/:id/activate', requireAuthAndAdmin, async (req: Request, res: Response) => {
    const result = await setActiveTheme(req.params.id);
    if (result.success) {
        res.json({ success: true, message: 'Theme activated successfully' });
    } else {
        res.status(500).json({ success: false, message: result.message });
    }
});

/**
 * @swagger
 * /api/themes/{id}/settings:
 *   get:
 *     tags: [Themes]
 *     summary: Получить настройки темы
 *     description: Возвращает настройки конкретной темы в виде объекта ключ-значение
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Уникальный идентификатор темы
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Настройки темы успешно получены
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
 *       500:
 *         description: Ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id/settings', async (req: Request, res: Response) => {
    const result = await getThemeSettings(req.params.id);
    if (result.success) {
        // Transform array of settings into key-value object
        const settingsObject: Record<string, string> = {};
        if (Array.isArray(result.data)) {
            result.data.forEach((setting: IThemeSetting) => {
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

/**
 * @swagger
 * /api/themes/{id}/settings:
 *   post:
 *     tags: [Themes]
 *     summary: Установить настройку темы
 *     description: Устанавливает или обновляет настройку темы (только для администраторов)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Уникальный идентификатор темы
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ThemeSettingRequest'
 *     responses:
 *       200:
 *         description: Настройка темы успешно обновлена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Theme setting updated successfully"
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
 *       500:
 *         description: Ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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
        // Use statusCode from result if available, otherwise default to 500
        const resultWithStatus = result as IResolveWithStatus<boolean>;
        const statusCode = resultWithStatus.statusCode || 500;
        res.status(statusCode).json({ success: false, message: result.message });
    }
});

// Get user theme preference
router.get('/user/:userId/preference', requireAuth, validateParams(UserIdParameterSchema), async (req: Request, res: Response) => {
    const { userId } = req.params;
    
    // Users can only get their own preferences unless they're admin
    if (req.user?.id !== userId && !req.user?.roles.includes('admin')) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
    }

    const result = await getUserThemePreference(userId);
    if (result.success) {
        if (result.data === null && result.message === 'User not found') {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        res.json({ success: true, data: result.data });
    } else {
        if (result.message === 'User not found') {
            res.status(404).json({ success: false, message: result.message });
        } else {
            res.status(500).json({ success: false, message: result.message });
        }
    }
});

// Set user theme preference
router.post('/user/:userId/preference', requireAuth, validateParams(UserIdParameterSchema), async (req: Request, res: Response) => {
    const { userId } = req.params;
    
    const { theme_id, custom_settings = {} } = req.body;
    
    if (!theme_id) {
        res.status(400).json({
            success: false,
            message: 'Theme ID is required'
        });
        return;
    }

    // Users can only set their own preferences unless they're admin
    if (req.user?.id !== userId && !req.user?.roles.includes('admin')) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
    }

    const result = await setUserThemePreference(userId, theme_id, custom_settings);
    if (result.success) {
        res.json({ success: true, message: 'Theme preference saved successfully' });
    } else {
        if (result.message === 'User not found') {
            res.status(404).json({ success: false, message: result.message });
        } else {
            res.status(500).json({ success: false, message: result.message });
        }
    }
});

export default router;
