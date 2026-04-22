/**
 * Settings Checker
 * Responsible for verifying and fixing CMS settings
 *
 * @module utils/checkers/SettingsChecker
 */

import adapter from '../../db-adapter/sqlite-adapter';
import { SchemaParser } from '../schema-parser';
import IResolve from '../../types/IResolve';
import prep from '../../utils/prepare';

/**
 * SettingsChecker handles CMS configuration validation and initialization
 */
export class SettingsChecker {
    private db: adapter;
    private schemaParser: SchemaParser;

    constructor(db: adapter, schemaParser: SchemaParser) {
        this.db = db;
        this.schemaParser = schemaParser;
    }

    /**
     * Check and optionally fix CMS settings
     *
     * @param autoFix - If true, automatically insert missing settings
     * @returns Promise resolving to void on success
     */
    public async checkCMSSettings(autoFix: boolean = false): Promise<IResolve<void>> {
        try {
            const defaultSettings = this.schemaParser.getDefaultCMSSettings();

            // Get system user ID for creating settings
            const systemUserResult = await this.db.executeQuery(
                "SELECT id FROM users WHERE login = 'system' LIMIT 1",
                []
            );

            const systemUserId = systemUserResult.success &&
                systemUserResult.data &&
                systemUserResult.data.length > 0
                ? (systemUserResult.data[0] as { id: string }).id
                : 'system';

            // Check each default setting
            for (const setting of defaultSettings) {
                const checkResult = await this.db.executeQuery(
                    'SELECT setting_key FROM cms_settings WHERE setting_key = ?',
                    [setting.key]
                );

                // If setting doesn't exist
                if (checkResult.success && checkResult.data && checkResult.data.length === 0) {
                    if (autoFix) {
                        const insertResult = await this.db.executeQuery(
                            `INSERT INTO cms_settings (setting_key, setting_value, setting_type, description, category, updated_by, updated_at)
                             VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                            [
                                setting.key,
                                setting.value,
                                setting.type || 'string',
                                setting.description || '',
                                setting.category || 'general',
                                systemUserId
                            ]
                        );

                        if (!insertResult.success) {
                            console.error(`Failed to add CMS setting ${setting.key}: ${insertResult.message}`);
                        } else {
                            console.log(`✓ Added missing CMS setting: ${setting.key}`);
                        }
                    } else {
                        console.log(`Missing CMS setting: ${setting.key}`);
                    }
                }
            }

            return prep.response(true, 'CMS settings checked successfully');
        } catch (error) {
            return prep.response(false, `Error checking CMS settings: ${error}`);
        }
    }
}