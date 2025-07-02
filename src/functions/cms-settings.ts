/**
 * CMS Settings management functions
 */

import database from '../db';
import { ICMSSetting } from '../types/ICMSSetting';
import prep from '../utils/prepare';
import IResolve from '../types/IResolve';
import { ITheme } from '../types/ITheme';

/**
 * Get all CMS settings
 */
export async function getCMSSettings(): Promise<IResolve<ICMSSetting[]>> {
    return await database.getCMSSettings();
}

/**
 * Get specific CMS setting by key
 */
export async function getCMSSetting(key: string): Promise<IResolve<ICMSSetting | null>> {
    return await database.getCMSSetting(key);
}

/**
 * Set CMS setting
 */
export async function setCMSSetting(key: string, value: string, type: string = 'string', updatedBy: string): Promise<IResolve<boolean>> {
    return await database.setCMSSetting(key, value, type, updatedBy);
}

/**
 * Get active website theme
 */
export async function getActiveWebsiteTheme(): Promise<IResolve<ITheme | null>> {
    return await database.getActiveWebsiteTheme();
}

/**
 * Set active website theme
 */
export async function setActiveWebsiteTheme(themeId: string, updatedBy: string): Promise<IResolve<boolean>> {
    return await database.setActiveWebsiteTheme(themeId, updatedBy);
}

/**
 * Get CMS settings by category
 */
export async function getCMSSettingsByCategory(category: string): Promise<IResolve<ICMSSetting[]>> {
    const allSettings = await getCMSSettings();
    if (!allSettings.success || !allSettings.data) {
        return allSettings;
    }

    const filtered = allSettings.data.filter(setting => setting.category === category);
    return prep.response(true, 'Settings retrieved successfully', filtered);
}

/**
 * Initialize default CMS settings if they don't exist
 */
export async function initializeDefaultCMSSettings(systemUserId: string): Promise<IResolve<boolean>> {
    try {
        const { defaultCMSSettings } = await import('../db-adapter/sql-schemas');
        
        for (const setting of defaultCMSSettings) {
            const existing = await getCMSSetting(setting.key);
            if (!existing.success || !existing.data) {
                await setCMSSetting(setting.key, setting.value, setting.type, systemUserId);
            }
        }

        return prep.response(true, 'Default CMS settings initialized', true);
    } catch (error) {
        return prep.response(false, `Failed to initialize CMS settings: ${error}`, false);
    }
}
