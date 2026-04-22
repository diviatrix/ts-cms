import * as sqlite3 from 'sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import config from '../data/config';
import schemas, { defaultRoles, defaultThemeSettings, defaultTheme, defaultCMSSettings } from './sql-schemas';
import messages from '../data/messages';
import IResolve from '../types/IResolve';
import prep from '../utils/prepare';
import { ContextLogger } from '../utils/context-logger';
import { generateGuid } from '../utils/guid';

// For more detailed logs from the sqlite3 driver, you can uncomment the next line:
// const sqlite = sqlite3.verbose();

export default class SQLiteAdapter {
    private db: sqlite3.Database | null = null;

    constructor() {
        this.connect();
    }

    public async connect() {
        // Ensure directory exists
        const dbDir = path.dirname(config.db_path);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
        
        this.db = new sqlite3.Database(config.db_path, (err) => {
            if (err) {
                console.error(messages.sql_connect_error, err);
            }
            // Removed console.log for cleaner startup - DatabaseChecker handles notifications
        });
    }

    // Legacy checkTables method removed - now using DatabaseChecker in db.ts
    // The DatabaseChecker class provides more comprehensive validation and auto-fix capabilities

    public async getTables(): Promise<IResolve<string[]>> {
        const query = "SELECT name FROM sqlite_master WHERE type='table'";
        const result = await this.executeQuery(query);

        if (result.success && Array.isArray(result.data)) {
            const rows = result.data as unknown[];
            const tableNames = (rows as Array<{ name: string }>).map(row => row.name);
            return prep.response(true, messages.sql_query_success, tableNames);
        }
        return prep.response(result.success, result.message, []); // Return the original error result from executeQuery
    }

    public async createTables(tables: string[]): Promise<IResolve<string[]>> {
        // First, create all tables
        for (const table of tables) {
            const schema = schemas[table as keyof typeof schemas];
            if (schema) {
                const response = await this.executeQuery(schema);
                if (!response.success) {
                    console.error(messages.sql_create_table_error, table, response.message);
                }                
            } else {
                console.error(messages.sql_schema_not_found, table);
            }
        }

        // After all tables are created, insert default data
        if (tables.includes('roles')) {
            await this.insertDefaultRoles();
        }
        if (tables.includes('themes') && tables.includes('theme_settings')) {
            await this.insertDefaultTheme();
        }
        if (tables.includes('cms_settings')) {
            await this.insertDefaultCMSSettings();
        }

        // После создания всех таблиц, добавляем first_admin в группу admin если он существует
        await this.ensureFirstAdminHasAdminRole();

        return prep.response(true, messages.success, tables);
    }

    private async ensureFirstAdminHasAdminRole(): Promise<void> {
        try {
            // Проверяем, существует ли пользователь first_admin
            const adminQuery = `SELECT id FROM users WHERE login = 'first_admin' LIMIT 1`;
            const adminResult = await this.executeQuery(adminQuery);
            
            if (adminResult.success && adminResult.data && Array.isArray(adminResult.data) && adminResult.data.length > 0) {
                const firstAdmin = (adminResult.data as { id: string }[])[0];
                
                // Добавляем в группу admin
                const addAdminRoleQuery = `INSERT OR IGNORE INTO user_groups (user_id, group_id) VALUES (?, ?)`;
                await this.executeQuery(addAdminRoleQuery, [firstAdmin.id, 'admin']);
                console.log('Ensured first_admin has admin role');
            }
        } catch (error) {
            console.warn('Failed to ensure first_admin has admin role:', error);
        }
    }

    private async insertDefaultRoles(): Promise<void> {
        for (const role of defaultRoles) {
            const query = `INSERT OR IGNORE INTO roles (id, name, description, weight, perms) VALUES (?, ?, ?, ?, ?)`;
            await this.executeQuery(query, [role.id, role.name, role.description, role.weight, role.perms]);
            console.log(`Inserted default role: ${role.name}`);
        }
    }

    public async insertDefaultTheme(): Promise<void> {
        // Check if a default theme already exists
        const existingThemeQuery = `SELECT id FROM themes WHERE is_default = 1 LIMIT 1`;
        const existingResult = await this.executeQuery(existingThemeQuery);
        
        if (existingResult.success && existingResult.data && Array.isArray(existingResult.data) && existingResult.data.length > 0) {
            console.log('Default theme already exists, skipping creation');
            return;
        }

        
        // Try to get the first user, if no users exist, create a system user
        let createdBy = 'system-user';
        
        const adminQuery = `SELECT id FROM users LIMIT 1`;
        const adminResult = await this.executeQuery(adminQuery);
        if (adminResult.success && adminResult.data && Array.isArray(adminResult.data) && adminResult.data.length > 0) {
            const firstUser = (adminResult.data as { id: string }[])[0];
            createdBy = firstUser.id;
        } else {
            // Create a system user to satisfy foreign key constraint
            const systemUserId = generateGuid();
            const systemUserQuery = `INSERT OR IGNORE INTO users (id, login, email, password_hash, is_active) VALUES (?, ?, ?, ?, ?)`;
            await this.executeQuery(systemUserQuery, [
                systemUserId,
                'system',
                'system@localhost',
                'system-placeholder-hash',
                false
            ]);
            
            // Add system user to admin group
            const addAdminRoleQuery = `INSERT OR IGNORE INTO user_groups (user_id, group_id) VALUES (?, ?)`;
            await this.executeQuery(addAdminRoleQuery, [systemUserId, 'admin']);
            
            createdBy = systemUserId;
            console.log('Created system user with admin role for theme creation');
        }
        
        const themeData = {
            id: generateGuid(),
            ...defaultTheme,
            created_by: createdBy
        };

        // Insert default theme
        const themeQuery = `INSERT OR IGNORE INTO themes (id, name, description, is_active, is_default, created_by) VALUES (?, ?, ?, ?, ?, ?)`;
        const themeResult = await this.executeQuery(themeQuery, [
            themeData.id, 
            themeData.name, 
            themeData.description, 
            themeData.is_active, 
            themeData.is_default, 
            themeData.created_by
        ]);

        if (!themeResult.success) {
            console.warn('Failed to insert default theme:', themeResult.message);
            return;
        }

        // Insert default theme settings
        for (const setting of defaultThemeSettings) {
            const settingQuery = `INSERT OR IGNORE INTO theme_settings (theme_id, setting_key, setting_value) VALUES (?, ?, ?)`;
            await this.executeQuery(settingQuery, [themeData.id, setting.key, setting.value]);
        }

        console.log(`Inserted default theme: ${themeData.name} with ${defaultThemeSettings.length} settings`);
    }

    private async insertDefaultCMSSettings(): Promise<void> {
        // Check if CMS settings already exist
        const existingQuery = `SELECT setting_key FROM cms_settings LIMIT 1`;
        const existingResult = await this.executeQuery(existingQuery);
        
        if (existingResult.success && existingResult.data && Array.isArray(existingResult.data) && existingResult.data.length > 0) {
            console.log('CMS settings already exist, skipping creation');
            return;
        }

        // Get system user ID for CMS settings
        let systemUserId = 'system-user';
        const userQuery = `SELECT id FROM users WHERE login = 'system' LIMIT 1`;
        const userResult = await this.executeQuery(userQuery);
        if (userResult.success && userResult.data && Array.isArray(userResult.data) && userResult.data.length > 0) {
            const systemUser = (userResult.data as { id: string }[])[0];
            systemUserId = systemUser.id;
        }

        // Insert default CMS settings
        for (const setting of defaultCMSSettings) {
            const settingQuery = `INSERT OR IGNORE INTO cms_settings (setting_key, setting_value, setting_type, description, category, updated_by) VALUES (?, ?, ?, ?, ?, ?)`;
            await this.executeQuery(settingQuery, [
                setting.key, 
                setting.value, 
                setting.type, 
                setting.description, 
                setting.category, 
                systemUserId
            ]);
        }

        console.log(`Inserted ${defaultCMSSettings.length} default CMS settings`);
    }

    public async createTable(schema: string): Promise<IResolve<string[]>> {
        const response = await this.executeQuery(schema);
        return prep.response(response.success, response.message, response.data as string[]);
    }

    public async close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error(messages.sql_close_error, err);
                } else {
                    console.log(messages.sql_close_success);
                }
            });
        }
    }

    public async executeQuery(query: string, params: (string | number | boolean | null)[] = []): Promise<IResolve<unknown[]>> {
        if (query.trim() === '') {
            return prep.response(false, messages.sql_query_error, ["Query cannot be empty."]);
        } else {
            // Removed console.log here to prevent duplicate logging
        }
        return new Promise((resolve) => {
            this.db?.all(query, params, (err, rows: unknown[]) => {
                if (err) {
                    resolve(prep.response(false, messages.sql_query_error, [err.toString()]));
                } else {
                    resolve(prep.response(true, messages.sql_query_success, rows as unknown[]));
                }
            });
        });
    }

    public async getByTableColValue(table: string, col: string, value: string | number): Promise<IResolve<unknown>> {
        return new Promise((resolve) => {
            this.db?.get(`SELECT * FROM ${table} WHERE ${col} = ?`, [value], (err, row) => {
                if (err) {
                    resolve(prep.response(false, messages.sql_query_error, err.toString()));
                } else  {
                    resolve(prep.response(true, messages.sql_query_success, row));
                }
            });
        });
    }

    public async getStatus(): Promise<IResolve<string>> {
        return new Promise((resolve) => {
            this.db?.get("SELECT sqlite_version() AS version", (err, row: { version: string }) => {
                if (err) {
                    resolve(prep.response(false, messages.sql_connect_error, err.toString()));
                } else {
                    resolve(prep.response(true, messages.sql_connect_success, row.version));
                }
            });
        });
    }

    // Test-only method for cleaning up test users
    public async cleanupTestUsers(): Promise<IResolve<number>> {
        const testUserPatterns = ['testuser', 'debug_user', 'state_check_user'];
        let deletedCount = 0;
        
        for (const pattern of testUserPatterns) {
            const deleteQuery = `DELETE FROM users WHERE login = ? AND login != 'system'`;
            const result = await this.executeQuery(deleteQuery, [pattern]);
            if (result.success) {
                deletedCount++;
                ContextLogger.operation('TEST', 'Cleanup', pattern, 'DELETED', 0);
            }
        }
        
        return prep.response(true, `Deleted ${deletedCount} test users`, deletedCount);
    }

    // Enhanced test cleanup method for comprehensive data cleanup
    public async cleanupAllTestData(): Promise<IResolve<string>> {
        const tables = [
            'user_theme_preferences',
            'theme_settings',
            'sessions',
            'records',
            'invites',
            'user_groups',
            'themes',
            'users'
        ];

        const cleanupLog: string[] = [];

        try {
            for (const table of tables) {
                // Skip system users and admin users for users table
                if (table === 'users') {
                    const deleteQuery = `DELETE FROM users WHERE login LIKE 'testuser_%' OR login LIKE 'test_%' OR (login != 'first_admin' AND login != 'system')`;
                    const result = await this.executeQuery(deleteQuery);
                    if (result.success) {
                        cleanupLog.push(`Cleaned test users from ${table}`);
                    }
                } else if (table === 'themes') {
                    // Keep default theme, remove test themes
                    const deleteQuery = `DELETE FROM themes WHERE name LIKE '%Test Theme%' OR name LIKE '%test%' OR (is_default = 0 AND is_active = 0)`;
                    const result = await this.executeQuery(deleteQuery);
                    if (result.success) {
                        cleanupLog.push(`Cleaned test themes from ${table}`);
                    }
                } else if (table === 'user_groups') {
                    // Clean user_groups for non-existent users
                    const deleteQuery = `DELETE FROM user_groups WHERE user_id NOT IN (SELECT id FROM users)`;
                    const result = await this.executeQuery(deleteQuery);
                    if (result.success) {
                        cleanupLog.push(`Cleaned orphaned entries from ${table}`);
                    }
                } else {
                    // For other tables, delete entries that reference non-existent users
                    let deleteQuery = '';
                    if (table === 'records') {
                        deleteQuery = `DELETE FROM records WHERE user_id NOT IN (SELECT id FROM users)`;
                    } else if (table === 'sessions') {
                        deleteQuery = `DELETE FROM sessions WHERE user_id NOT IN (SELECT id FROM users)`;
                    } else if (table === 'invites') {
                        deleteQuery = `DELETE FROM invites WHERE created_by NOT IN (SELECT id FROM users)`;
                    } else if (table === 'user_theme_preferences') {
                        deleteQuery = `DELETE FROM user_theme_preferences WHERE user_id NOT IN (SELECT id FROM users)`;
                    } else if (table === 'theme_settings') {
                        deleteQuery = `DELETE FROM theme_settings WHERE theme_id NOT IN (SELECT id FROM themes)`;
                    }
                    
                    if (deleteQuery) {
                        const result = await this.executeQuery(deleteQuery);
                        if (result.success) {
                            cleanupLog.push(`Cleaned orphaned entries from ${table}`);
                        }
                    }
                }
            }

            return prep.response(true, 'Test data cleanup completed', cleanupLog.join('; '));
        } catch (error) {
            return prep.response(false, `Test data cleanup failed: ${error}`, '');
        }
    }
};