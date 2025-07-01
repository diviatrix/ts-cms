import * as sqlite3 from 'sqlite3';
import config from '../data/config';
import schemas from './sql-schemas';
import messages from '../data/messages';
import IResolve from '../types/IResolve';
import prep from '../utils/prepare'

// For more detailed logs from the sqlite3 driver, you can uncomment the next line:
// const sqlite = sqlite3.verbose();

export default class SQLiteAdapter {
    private db: sqlite3.Database | null = null;

    constructor() {
        console.log('SQLiteAdapter constructor called.');
        this.connect();
    }

    public async connect() {
        const fs = require('fs');
        const path = require('path');
        
        // Ensure directory exists
        const dbDir = path.dirname(config.db_path);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
        
        this.db = new sqlite3.Database(config.db_path, (err) => {
            if (err) {
                console.error(messages.sql_connect_error, err);
            } else {
                console.log(messages.sql_connect_success + ': ' + config.db_path);
            }
        });
    }

    public async checkTables(): Promise<IResolve<string[]>> {
        if (!this.db) {
            console.error(messages.sql_connect_error);
            return prep.response(false, messages.sql_connect_error);
        }

        const tablesResult = await this.getTables();
        
        if (!tablesResult.success || !Array.isArray(tablesResult.data)) {
            console.error("Failed to get table list from database:", tablesResult.message);
            return prep.response(false, "Failed to check tables due to a database error.");
        }

        const existingTables = tablesResult.data as string[]; // Cast the data to string[]
        const missingTables = Object.keys(schemas).filter((table) => !existingTables.includes(table));

        if (missingTables.length > 0) {
            console.log(messages.sql_missing_tables, missingTables);
            await this.createTables(missingTables);
            return prep.response(true, `Tables created: ${missingTables.join(', ')}`);
        } else {
            return prep.response(true, messages.sql_all_tables_exist);
        }
    }

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
        for (const table of tables) {
            const schema = schemas[table as keyof typeof schemas];
            if (schema) {
                const response = await this.executeQuery(schema);
                if (response.success) {
                    console.log(messages.sql_create_table_success, table);
                    // If roles table was just created, insert default roles
                    if (table === 'roles') {
                        await this.insertDefaultRoles();
                    }
                    // If themes table was just created, insert default theme
                    if (table === 'themes') {
                        await this.insertDefaultTheme();
                    }
                } else {
                    console.error(messages.sql_create_table_error, table, response.message);
                }                
            } else {
                console.error(messages.sql_schema_not_found, table);
            }
        }

        return prep.response(true, messages.success, tables);
    }

    private async insertDefaultRoles(): Promise<void> {
        const defaultRoles = [
            { id: 'user', name: 'User', description: 'Standard user role', weight: 10, perms: '[]' },
            { id: 'admin', name: 'Admin', description: 'Administrator role with full access', weight: 100, perms: '[]' },
            { id: 'guest', name: 'Guest', description: 'Guest user role with limited access', weight: 0, perms: '[]' },
        ];

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

        const { generateGuid } = require('../utils/guid');
        
        // Try to get the first user, if no users exist, create a system user
        let createdBy = 'system-user';
        
        const adminQuery = `SELECT id FROM users LIMIT 1`;
        const adminResult = await this.executeQuery(adminQuery);
        if (adminResult.success && adminResult.data && Array.isArray(adminResult.data) && adminResult.data.length > 0) {
            const firstUser = (adminResult.data as any[])[0];
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
            createdBy = systemUserId;
            console.log('Created system user for theme creation');
        }
        
        const defaultTheme = {
            id: generateGuid(),
            name: 'Default Theme',
            description: 'Default TypeScript CMS theme with modern dark styling',
            is_active: true,
            is_default: true,
            created_by: createdBy
        };

        // Insert default theme
        const themeQuery = `INSERT OR IGNORE INTO themes (id, name, description, is_active, is_default, created_by) VALUES (?, ?, ?, ?, ?, ?)`;
        const themeResult = await this.executeQuery(themeQuery, [
            defaultTheme.id, 
            defaultTheme.name, 
            defaultTheme.description, 
            defaultTheme.is_active, 
            defaultTheme.is_default, 
            defaultTheme.created_by
        ]);

        if (!themeResult.success) {
            console.warn('Failed to insert default theme:', themeResult.message);
            return;
        }

        // Insert default theme settings (matching existing dark theme)
        const defaultSettings = [
            { key: 'primary_color', value: '#00FF00' },      // Neon green (accent)
            { key: 'secondary_color', value: '#FFD700' },    // Warm yellow (accent)
            { key: 'background_color', value: '#222222' },   // Dark grey (main background)
            { key: 'surface_color', value: '#444444' },      // Grey (cards, surfaces)
            { key: 'text_color', value: '#E0E0E0' },         // Light grey (primary text)
            { key: 'text_secondary', value: '#C0C0C0' },     // Medium grey (secondary text)
            { key: 'text_muted', value: '#A0A0A0' },         // Darker grey (muted text)
            { key: 'border_color', value: '#00FF00' },       // Neon green (borders)
            { key: 'font_family', value: "'Share Tech Mono', monospace" },
            { key: 'custom_css', value: '' },
            { key: 'favicon_url', value: '' },
            { key: 'logo_url', value: '' },
            { key: 'footer_text', value: '© 2025 TypeScript CMS. Built with modern web technologies.' },
            { key: 'footer_links', value: '[]' },
            { key: 'menu_links', value: '[]' }
        ];

        for (const setting of defaultSettings) {
            const settingQuery = `INSERT OR IGNORE INTO theme_settings (theme_id, setting_key, setting_value) VALUES (?, ?, ?)`;
            await this.executeQuery(settingQuery, [defaultTheme.id, setting.key, setting.value]);
        }

        console.log(`Inserted default theme: ${defaultTheme.name} with ${defaultSettings.length} settings`);
    }

    public async createTable(schema: string): Promise<IResolve<string[]>> {
        const response = await this.executeQuery(schema);
        return prep.response(response.success, response.message, response.data);
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

    public async executeQuery(query: string, params: any[] = []): Promise<IResolve<string[]>> {
        if (query.trim() === '') {
            return prep.response(false, messages.sql_query_error, ["Query cannot be empty."]);
        } else {
            // Removed console.log here to prevent duplicate logging
        }
        return new Promise((resolve) => {
            this.db?.all(query, params, (err, rows: any[]) => {
                if (err) {
                    resolve(prep.response(false, messages.sql_query_error, [err.toString()]));
                } else {
                    resolve(prep.response(true, messages.sql_query_success, rows));
                }
            });
        });
    }

    public async getByTableColValue(table: string, col: string, value: any): Promise<IResolve<string>> {
        return new Promise((resolve) => {
            this.db?.get(`SELECT * FROM ${table} WHERE ${col} = ?`, [value], (err, row) => {
                if (err) {
                    resolve(prep.response(false, messages.sql_query_error, err.toString()));
                } else  {
                    resolve(prep.response(true, messages.sql_query_success, row as unknown as string));
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
};