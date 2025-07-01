/**
 * Theme management functions
 */

import database from '../db';
import { ITheme, IThemeSetting, IUserThemePreference } from '../types/ITheme';
import { generateGuid } from '../utils/guid';
import prep from '../utils/prepare';
import IResolve from '../types/IResolve';

/**
 * Create a new theme
 */
export async function createTheme(themeData: Omit<ITheme, 'id' | 'created_at' | 'updated_at'>): Promise<IResolve<ITheme>> {
    // Validate that created_by is present
    if (!themeData.created_by) {
        return prep.response(false, 'created_by field is required', {} as ITheme);
    }
    
    const id = generateGuid();
    const now = new Date().toISOString();
    
    const theme: ITheme = {
        ...themeData,
        id,
        created_at: now,
        updated_at: now
    };

    return await database.createTheme(theme);
}

/**
 * Get all themes
 */
export async function getThemes(): Promise<IResolve<ITheme[]>> {
    return await database.getThemes();
}

/**
 * Get theme by ID
 */
export async function getTheme(id: string): Promise<IResolve<ITheme | null>> {
    return await database.getThemeById(id);
}

/**
 * Update theme
 */
export async function updateTheme(id: string, updates: Partial<ITheme>): Promise<IResolve<ITheme>> {
    // Remove fields that shouldn't be updated
    const { id: _, created_at, ...allowedUpdates } = updates as any;
    
    return await database.updateTheme(id, allowedUpdates);
}

/**
 * Delete theme
 */
export async function deleteTheme(id: string): Promise<IResolve<boolean>> {
    return await database.deleteTheme(id);
}

/**
 * Get active theme
 */
export async function getActiveTheme(): Promise<IResolve<ITheme | null>> {
    return await database.getActiveTheme();
}

/**
 * Set active theme
 */
export async function setActiveTheme(themeId: string): Promise<IResolve<boolean>> {
    return await database.setActiveTheme(themeId);
}

/**
 * Get theme settings
 */
export async function getThemeSettings(themeId: string): Promise<IResolve<IThemeSetting[]>> {
    return await database.getThemeSettings(themeId);
}

/**
 * Set theme setting
 */
export async function setThemeSetting(themeId: string, key: string, value: string, type: string = 'string'): Promise<IResolve<boolean>> {
    return await database.setThemeSetting(themeId, key, value, type);
}

/**
 * Get user theme preference
 */
export async function getUserThemePreference(userId: string): Promise<IResolve<IUserThemePreference | null>> {
    const result = await database.getUserThemePreference(userId);
    
    if (result.success && result.data) {
        // Parse custom_settings JSON
        try {
            result.data.custom_settings = JSON.parse(result.data.custom_settings || '{}');
        } catch (error) {
            result.data.custom_settings = {};
        }
    }
    
    return result;
}

/**
 * Set user theme preference
 */
export async function setUserThemePreference(userId: string, themeId: string, customSettings: Record<string, any> = {}): Promise<IResolve<boolean>> {
    const customSettingsJson = JSON.stringify(customSettings);
    return await database.setUserThemePreference(userId, themeId, customSettingsJson);
}
