import config from './data/config';
import messages from './data/messages';
import adapter from './db-adapter/sqlite-adapter';
import IUser from './types/IUser';
import IUserProfile from './types/IUserProfile';
import IResolve from './types/IResolve';
import prep from './utils/prepare'
import IRecord from './types/IRecord';

class Database {
    private static instance: Database;
    private db: adapter;

    private constructor() {
        this.db = new adapter();
        this.initialize();
    }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    private async initialize() {
        await this.db.checkTables();
    }

    public async registerUser(user: IUser): Promise<IResolve<IUser>> {
        const columns = Object.keys(user).join(', ');
        const placeholders = Object.keys(user).map(() => '?').join(', ');
        const values = Object.values(user);
        const query = `INSERT INTO users (${columns}) VALUES (${placeholders})`;
        const response = await this.db.executeQuery(query, values);
        return prep.response(response.success, response.message, user);
    }

    public async saveSession(sessionId: string, userId: string, token: string): Promise<IResolve<string>>  {
        const sessionQuery = `INSERT INTO sessions (id, user_id, token) VALUES (?, ?, ?)`;
        const response = await this.db.executeQuery(sessionQuery, [sessionId, userId, token]);
        return prep.response(response.success, response.message, sessionId);
    }

    public async deleteSessionByUserId(userId: string): Promise<IResolve<string>> {
        const query = `DELETE FROM sessions WHERE user_id = ?`;
        const response = await this.db.executeQuery(query, [userId]);
        return prep.response(response.success, response.message, userId);
    }

    public async getUserProfile(userId: string): Promise<IResolve<IUserProfile | undefined>> {
        const query = `SELECT user_id, public_name, profile_picture_url, bio, created_at, updated_at FROM user_profiles WHERE user_id = ?`;
        const response = await this.db.executeQuery(query, [userId]);
        const data = (response.data && response.data.length > 0)
            ? (response.data[0] as unknown as IUserProfile)
            : undefined;
        // Roles are now fetched separately
        return prep.response(response.success, response.message, data);
    }

    public async createUserProfile(userId: string): Promise<IResolve<IUserProfile>> {
        // Define the default profile data based on the IUserProfile interface
        const defaultProfile: IUserProfile = {
            user_id: userId,
            public_name: 'User', // Default public name
            profile_picture_url: '/img/placeholder-square.png',
            bio: 'Я родился', // Default empty bio
            created_at: new Date(),
            updated_at: new Date()
        };
        const columns = Object.keys(defaultProfile).join(', ');
        const placeholders = Object.keys(defaultProfile).map(() => '?').join(', ');
        const values = Object.values(defaultProfile).map(value => typeof value === 'object' ? JSON.stringify(value) : value); // Stringify roles array
        const query = `INSERT INTO user_profiles (${columns}) VALUES (${placeholders})`;
        const response = await this.db.executeQuery(query, values);
        if (response.success) {
            // Add user to default 'user' group
            await this.addUserToGroup(userId, 'user');
            // If successful, return the defaultProfile as the created profile
            return prep.response(true, messages.success, defaultProfile);
        } else {
            return prep.response(false, messages.failure, undefined as unknown as IUserProfile);
        }
    }

    

    public async findUserByLogin(login: string): Promise<IResolve<IUser | undefined>> {
        const response = await this.db.executeQuery(`SELECT * FROM users WHERE login = ? OR email = ?`, [login, login]);
        const data = response.data && response.data.length > 0 ? (response.data[0] as unknown as IUser) : undefined;
        return prep.response(response.success, response.message, data);
    }

    public async getUser(id: string): Promise<IResolve<IUser | undefined>> {
        const response = await this.db.executeQuery(`SELECT * FROM users WHERE id = ?`, [id]);
        const data = response.data && response.data.length > 0 ? (response.data[0] as unknown as IUser) : undefined;
        return prep.response(response.success, response.message, data);
    }

    public async getAllBaseUsers(): Promise<IResolve<IUser[] | undefined>> {
        const response = await this.db.executeQuery("SELECT * FROM users", []);
        const users = Array.isArray(response.data) ? (response.data as unknown as IUser[]) : undefined;
        return prep.response(response.success, response.message, users);
    }

    public async getUserProfileById(userId: string): Promise<IResolve<IUserProfile>> {
        const response = await this.db.executeQuery("SELECT * FROM user_profiles WHERE user_id = ?", [userId]);
        const data = response.data && response.data.length > 0 ? (response.data[0] as unknown as IUserProfile) : undefined;
        // Roles are now fetched separately
        return prep.response(response.success, response.message, data);
    }

    public async getUserRoles(userId: string): Promise<IResolve<string[]>> {
        const query = `SELECT group_id FROM user_groups WHERE user_id = ?`;
        const response = await this.db.executeQuery(query, [userId]);
        if (response.success && Array.isArray(response.data)) {
            const roles = response.data.map((row: any) => row.group_id);
            return prep.response(true, messages.success, roles);
        }
        return prep.response(false, messages.failure, []);
    }

    public async getUserCount(): Promise<IResolve<number>> {
        const query = `SELECT COUNT(*) as count FROM users`;
        const response = await this.db.executeQuery(query, []);
        if (response.success && Array.isArray(response.data) && response.data.length > 0) {
            const count = (response.data[0] as any).count;
            return prep.response(true, messages.success, count);
        }
        return prep.response(false, messages.failure, 0);
    }

    public async addUserToGroup(userId: string, groupId: string): Promise<IResolve<boolean>> {
        const query = `INSERT OR IGNORE INTO user_groups (user_id, group_id) VALUES (?, ?)`;
        const response = await this.db.executeQuery(query, [userId, groupId]);
        return prep.response(response.success, response.message, response.success);
    }

    public async removeUserFromGroup(userId: string, groupId: string): Promise<IResolve<boolean>> {
        const query = `DELETE FROM user_groups WHERE user_id = ? AND group_id = ?`;
        const response = await this.db.executeQuery(query, [userId, groupId]);
        return prep.response(response.success, response.message, response.success);
    }

    public async updateUserProfile(userId: string, profile: Partial<IUserProfile>): Promise<IResolve<IUserProfile | undefined>> {
        const fieldsToUpdate = Object.keys(profile).filter(key => (profile as any)[key] !== undefined);
        
        if (fieldsToUpdate.length === 0) {
            return prep.response(true, messages.success, undefined); // Nothing to update
        }

        const setClauses = fieldsToUpdate.map(field => `${field} = ?`).join(', ');

        const values = fieldsToUpdate.map(field => {
            return (profile as any)[field];
        });
        values.push(userId);

        const query = `UPDATE user_profiles SET ${setClauses} WHERE user_id = ?`;
        const response = await this.db.executeQuery(query, values);
        return prep.response(response.success, response.message, undefined);
    }

    public async updateUser(userId: string, userData: Partial<IUser>): Promise<IResolve<IUser | undefined>> {
        const fieldsToUpdate = Object.keys(userData).filter(key => (userData as any)[key] !== undefined);

        if (fieldsToUpdate.length === 0) {
            return prep.response(true, messages.success, undefined); // Nothing to update
        }

        const setClauses = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
        const values = fieldsToUpdate.map(field => (userData as any)[field]);
        values.push(userId);

        const query = `UPDATE users SET ${setClauses} WHERE id = ?`;
        const response = await this.db.executeQuery(query, values);
        return prep.response(response.success, response.message, undefined);
    }

    public async createRecord(record: IRecord): Promise<IResolve<IRecord>> {
        const columns = ['id', 'title', 'description', 'content', 'image_url', 'user_id', 'tags', 'categories', 'is_published', 'created_at', 'updated_at'].join(', ');
        const placeholders = ['?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?'].join(', ');
        const values = [
            record.id,
            record.title,
            record.description,
            record.content,
            record.image_url || null,
            record.user_id,
            JSON.stringify(record.tags),
            JSON.stringify(record.categories),
            record.is_published ? 1 : 0,
            record.created_at.toISOString(),
            record.updated_at.toISOString(),
        ];
        const query = `INSERT INTO records (${columns}) VALUES (${placeholders})`;
        const response = await this.db.executeQuery(query, values);
        return prep.response(response.success, response.message, record);
    }

    public async getRecordById(id: string, publishedOnly: boolean = false): Promise<IResolve<IRecord | undefined>> {
        let query = `SELECT * FROM records WHERE id = ?`;
        const params = [id];
        if (publishedOnly) {
            query += ` AND is_published = 1`;
        }
        const response = await this.db.executeQuery(query, params);
        const data = response.data && response.data.length > 0 ? (response.data[0] as unknown as IRecord) : undefined;
        if (data) {
            data.tags = JSON.parse(data.tags as unknown as string);
            data.categories = JSON.parse(data.categories as unknown as string);
            data.is_published = Boolean(data.is_published);
            data.created_at = new Date(data.created_at);
            data.updated_at = new Date(data.updated_at);
        }
        return prep.response(response.success, response.message, data);
    }

    public async updateRecord(id: string, updates: Partial<IRecord>): Promise<IResolve<IRecord | undefined>> {
        const fieldsToUpdate = Object.keys(updates).filter(key => (updates as any)[key] !== undefined);

        if (fieldsToUpdate.length === 0) {
            return prep.response(true, messages.success, undefined); // Nothing to update
        }

        const setClauses = fieldsToUpdate.map(field => {
            if (field === 'tags' || field === 'categories') {
                return `${field} = ?`;
            } else if (field === 'is_published') {
                return `${field} = ?`;
            } else if (field === 'created_at' || field === 'updated_at') {
                return `${field} = ?`;
            }
            return `${field} = ?`;
        }).join(', ');

        const values = fieldsToUpdate.map(field => {
            if (field === 'tags' || field === 'categories') return JSON.stringify((updates as any)[field]);
            if (field === 'is_published') return (updates as any)[field] ? 1 : 0;
            if (field === 'created_at' || field === 'updated_at') return (updates as any)[field].toISOString();
            return (updates as any)[field];
        });
        values.push(id);

        const query = `UPDATE records SET ${setClauses} WHERE id = ?`;
        const response = await this.db.executeQuery(query, values);
        return prep.response(response.success, response.message, undefined);
    }

    public async deleteRecord(id: string): Promise<IResolve<boolean>> {
        const query = `DELETE FROM records WHERE id = ?`;
        const response = await this.db.executeQuery(query, [id]);
        return prep.response(response.success, response.message, response.success);
    }

    public async getAllRecords(publishedOnly: boolean = false): Promise<IResolve<(IRecord & { public_name: string })[] | undefined>> {
        let query = `
            SELECT
                r.id, r.title, r.description, r.content, r.image_url, r.user_id,
                r.tags, r.categories, r.is_published, r.created_at, r.updated_at,
                COALESCE(up.public_name, 'Admin') as public_name
            FROM records r
            LEFT JOIN user_profiles up ON r.user_id = up.user_id
        `;
        const params: any[] = [];
        if (publishedOnly) {
            query += ` WHERE r.is_published = 1`;
        }
        const response = await this.db.executeQuery(query, params);
        const data = Array.isArray(response.data) ? (response.data as unknown as (IRecord & { public_name: string })[]) : undefined;
        if (data) {
            data.forEach(record => {
                record.tags = JSON.parse(record.tags as unknown as string);
                record.categories = JSON.parse(record.categories as unknown as string);
                record.is_published = Boolean(record.is_published);
                record.created_at = new Date(record.created_at);
                record.updated_at = new Date(record.updated_at);
            });
        }
        return prep.response(response.success, response.message, data);
    }

    // Transaction management methods
    public async beginTransaction(): Promise<IResolve<boolean>> {
        const response = await this.db.executeQuery('BEGIN TRANSACTION', []);
        return prep.response(response.success, response.message, response.success);
    }

    public async commitTransaction(): Promise<IResolve<boolean>> {
        const response = await this.db.executeQuery('COMMIT', []);
        return prep.response(response.success, response.message, response.success);
    }

    public async rollbackTransaction(): Promise<IResolve<boolean>> {
        const response = await this.db.executeQuery('ROLLBACK', []);
        return prep.response(response.success, response.message, response.success);
    }

    // Theme management methods
    public async createTheme(theme: any): Promise<IResolve<any>> {
        const columns = Object.keys(theme).join(', ');
        const placeholders = Object.keys(theme).map(() => '?').join(', ');
        const values = Object.values(theme);
        const query = `INSERT INTO themes (${columns}) VALUES (${placeholders})`;
        const response = await this.db.executeQuery(query, values);
        return prep.response(response.success, response.message, theme);
    }

    public async getThemes(): Promise<IResolve<any[]>> {
        const query = 'SELECT * FROM themes ORDER BY created_at DESC';
        const response = await this.db.executeQuery(query, []);
        return prep.response(response.success, response.message, response.data);
    }

    public async getThemeById(id: string): Promise<IResolve<any>> {
        const query = 'SELECT * FROM themes WHERE id = ?';
        const response = await this.db.executeQuery(query, [id]);
        const theme = response.data?.[0];
        return prep.response(response.success, response.message, theme);
    }

    public async updateTheme(id: string, updates: any): Promise<IResolve<any>> {
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updates), id];
        const query = `UPDATE themes SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        const response = await this.db.executeQuery(query, values);
        
        if (response.success) {
            return await this.getThemeById(id);
        }
        return prep.response(response.success, response.message, null);
    }

    public async deleteTheme(id: string): Promise<IResolve<boolean>> {
        const query = 'DELETE FROM themes WHERE id = ?';
        const response = await this.db.executeQuery(query, [id]);
        return prep.response(response.success, response.message, response.success);
    }

    public async getActiveTheme(): Promise<IResolve<any>> {
        const query = 'SELECT * FROM themes WHERE is_active = 1 LIMIT 1';
        const response = await this.db.executeQuery(query, []);
        const theme = response.data?.[0];
        
        // If no active theme exists, ensure default theme is created
        if (!theme) {
            await this.ensureDefaultTheme();
            // Try again after creating default theme
            const retryResponse = await this.db.executeQuery(query, []);
            const retryTheme = retryResponse.data?.[0];
            return prep.response(retryResponse.success, retryResponse.message, retryTheme);
        }
        
        return prep.response(response.success, response.message, theme);
    }

    public async ensureDefaultTheme(): Promise<IResolve<boolean>> {
        // Check if any theme exists
        const existingQuery = 'SELECT id FROM themes LIMIT 1';
        const existingResponse = await this.db.executeQuery(existingQuery, []);
        
        if (existingResponse.data && existingResponse.data.length > 0) {
            return prep.response(true, 'Themes already exist', true);
        }

        // Create default theme using the database adapter method
        try {
            await (this.db as any).insertDefaultTheme();
            return prep.response(true, 'Default theme created successfully', true);
        } catch (error) {
            return prep.response(false, `Failed to create default theme: ${error}`, false);
        }
    }

    public async setActiveTheme(themeId: string): Promise<IResolve<boolean>> {
        const queries = [
            'UPDATE themes SET is_active = 0',
            'UPDATE themes SET is_active = 1 WHERE id = ?'
        ];
        
        for (let i = 0; i < queries.length; i++) {
            const values = i === 1 ? [themeId] : [];
            const response = await this.db.executeQuery(queries[i], values);
            if (!response.success) {
                return prep.response(false, response.message, false);
            }
        }
        return prep.response(true, 'Theme activated successfully', true);
    }

    public async getThemeSettings(themeId: string): Promise<IResolve<any[]>> {
        const query = 'SELECT * FROM theme_settings WHERE theme_id = ?';
        const response = await this.db.executeQuery(query, [themeId]);
        return prep.response(response.success, response.message, response.data);
    }

    public async setThemeSetting(themeId: string, key: string, value: string, type: string = 'string'): Promise<IResolve<boolean>> {
        const query = `INSERT OR REPLACE INTO theme_settings (theme_id, setting_key, setting_value, setting_type) VALUES (?, ?, ?, ?)`;
        const response = await this.db.executeQuery(query, [themeId, key, value, type]);
        return prep.response(response.success, response.message, response.success);
    }

    public async getUserThemePreference(userId: string): Promise<IResolve<any>> {
        const query = 'SELECT * FROM user_theme_preferences WHERE user_id = ?';
        const response = await this.db.executeQuery(query, [userId]);
        const preference = response.data?.[0];
        return prep.response(response.success, response.message, preference);
    }

    public async setUserThemePreference(userId: string, themeId: string, customSettings: string): Promise<IResolve<boolean>> {
        const query = `INSERT OR REPLACE INTO user_theme_preferences (user_id, theme_id, custom_settings, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`;
        const response = await this.db.executeQuery(query, [userId, themeId, customSettings]);
        return prep.response(response.success, response.message, response.success);
    }

    public async deleteUser(userId: string): Promise<IResolve<boolean>> {
        // Delete user with proper cascade (sessions, profiles, groups)
        const queries = [
            'DELETE FROM sessions WHERE user_id = ?',
            'DELETE FROM user_profiles WHERE user_id = ?', 
            'DELETE FROM user_groups WHERE user_id = ?',
            'DELETE FROM users WHERE id = ?'
        ];
        
        for (const query of queries) {
            const response = await this.db.executeQuery(query, [userId]);
            if (!response.success) {
                return prep.response(false, `Failed to delete user: ${response.message}`, false);
            }
        }
        
        return prep.response(true, 'User deleted successfully', true);
    }

    // CMS Settings management methods
    public async getCMSSettings(): Promise<IResolve<any[]>> {
        const query = 'SELECT * FROM cms_settings ORDER BY category, setting_key';
        const response = await this.db.executeQuery(query, []);
        return prep.response(response.success, response.message, response.data);
    }

    public async getCMSSetting(key: string): Promise<IResolve<any>> {
        const query = 'SELECT * FROM cms_settings WHERE setting_key = ?';
        const response = await this.db.executeQuery(query, [key]);
        const setting = response.data?.[0];
        return prep.response(response.success, response.message, setting);
    }

    public async setCMSSetting(key: string, value: string, type: string = 'string', updatedBy: string): Promise<IResolve<boolean>> {
        const query = `INSERT OR REPLACE INTO cms_settings (setting_key, setting_value, setting_type, updated_at, updated_by) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)`;
        const response = await this.db.executeQuery(query, [key, value, type, updatedBy]);
        return prep.response(response.success, response.message, response.success);
    }

    public async getActiveWebsiteTheme(): Promise<IResolve<any>> {
        // First try to get from CMS settings
        const themeIdSetting = await this.getCMSSetting('active_theme_id');
        if (themeIdSetting.success && themeIdSetting.data && themeIdSetting.data.setting_value) {
            const theme = await this.getThemeById(themeIdSetting.data.setting_value);
            if (theme.success && theme.data) {
                return theme;
            }
        }
        
        // Fallback to active theme from themes table
        return await this.getActiveTheme();
    }

    public async setActiveWebsiteTheme(themeId: string, updatedBy: string): Promise<IResolve<boolean>> {
        // Verify theme exists
        const theme = await this.getThemeById(themeId);
        if (!theme.success || !theme.data) {
            return prep.response(false, 'Theme not found', false);
        }

        // ONLY update CMS setting - do NOT sync with themes table
        // The themes.is_active should be independent of website theme
        const cmsResult = await this.setCMSSetting('active_theme_id', themeId, 'string', updatedBy);
        return cmsResult;
    }
}

export default Database.getInstance();
