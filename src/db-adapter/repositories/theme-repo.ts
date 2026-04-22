import adapter from '../sqlite-adapter.ts';
import { ITheme, IThemeSetting, IUserThemePreference } from '../../types/ITheme.ts';
import IResolve from '../../types/IResolve.ts';
import prep from '../../utils/prepare.ts';

export class ThemeRepository {
    private db: adapter;

    constructor(db: adapter) {
        this.db = db;
    }

    public async createTheme(theme: Omit<ITheme, 'id' | 'created_at' | 'updated_at'>): Promise<IResolve<ITheme>> {
        const columns = Object.keys(theme).join(', ');
        const placeholders = Object.keys(theme).map(() => '?').join(', ');
        const values = Object.values(theme);
        const query = `INSERT INTO themes (${columns}) VALUES (${placeholders})`;
        const response = await this.db.executeQuery(query, values);
        return prep.response(response.success, response.message, theme as ITheme);
    }

    public async getThemes(): Promise<IResolve<ITheme[]>> {
        const query = 'SELECT * FROM themes ORDER BY created_at DESC';
        const response = await this.db.executeQuery(query, []);
        return prep.response(response.success, response.message, response.data as ITheme[]);
    }

    public async getThemeById(id: string): Promise<IResolve<ITheme | null>> {
        const query = 'SELECT * FROM themes WHERE id = ?';
        const response = await this.db.executeQuery(query, [id]);
        const theme = response.data?.[0] as ITheme | undefined;
        return prep.response(response.success, response.message, theme || null);
    }

    public async updateTheme(id: string, updates: Partial<ITheme>): Promise<IResolve<ITheme | null>> {
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updates), id];
        const query = `UPDATE themes SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        const response = await this.db.executeQuery(query, values);
        
        if (response.success) {
            const themeResponse = await this.getThemeById(id);
            return prep.response(themeResponse.success, themeResponse.message, themeResponse.data);
        }
        return prep.response(response.success, response.message, null);
    }

    public async deleteTheme(id: string): Promise<IResolve<boolean>> {
        const query = 'DELETE FROM themes WHERE id = ?';
        const response = await this.db.executeQuery(query, [id]);
        return prep.response(response.success, response.message, response.success);
    }

    public async getActiveTheme(): Promise<IResolve<ITheme | null>> {
        const query = 'SELECT * FROM themes WHERE is_active = 1 LIMIT 1';
        const response = await this.db.executeQuery(query, []);
        const theme = response.data?.[0] as ITheme | undefined;
        
        if (!theme) {
            await this.ensureDefaultTheme();
            const retryResponse = await this.db.executeQuery(query, []);
            const retryTheme = retryResponse.data?.[0] as ITheme | undefined;
            return prep.response(retryResponse.success, retryResponse.message, retryTheme || null);
        }
        
        return prep.response(response.success, response.message, theme || null);
    }

    public async ensureDefaultTheme(): Promise<IResolve<boolean>> {
        const existingQuery = 'SELECT id FROM themes LIMIT 1';
        const existingResponse = await this.db.executeQuery(existingQuery, []);
        
        if (existingResponse.data && existingResponse.data.length > 0) {
            return prep.response(true, 'Themes already exist', true);
        }

        try {
            await (this.db as { insertDefaultTheme(): Promise<void> }).insertDefaultTheme();
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

    public async getThemeSettings(themeId: string): Promise<IResolve<IThemeSetting[]>> {
        const query = 'SELECT * FROM theme_settings WHERE theme_id = ?';
        const response = await this.db.executeQuery(query, [themeId]);
        return prep.response(response.success, response.message, response.data as IThemeSetting[]);
    }

    public async setThemeSetting(themeId: string, key: string, value: string, type: string = 'string'): Promise<IResolve<boolean>> {
        const query = `INSERT OR REPLACE INTO theme_settings (theme_id, setting_key, setting_value, setting_type) VALUES (?, ?, ?, ?)`;
        const response = await this.db.executeQuery(query, [themeId, key, value, type]);
        return prep.response(response.success, response.message, response.success);
    }

    public async getUserThemePreference(userId: string): Promise<IResolve<IUserThemePreference | null>> {
        const query = 'SELECT * FROM user_theme_preferences WHERE user_id = ?';
        const response = await this.db.executeQuery(query, [userId]);
        const preference = response.data?.[0] as IUserThemePreference | undefined;
        return prep.response(response.success, response.message, preference || null);
    }

    public async setUserThemePreference(userId: string, themeId: string, customSettings: string): Promise<IResolve<boolean>> {
        const query = `INSERT OR REPLACE INTO user_theme_preferences (user_id, theme_id, custom_settings, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`;
        const response = await this.db.executeQuery(query, [userId, themeId, customSettings]);
        return prep.response(response.success, response.message, response.success);
    }

    public async query(query: string, params: (string | number | boolean | null)[] = []): Promise<IResolve<unknown[]>> {
        return await this.db.executeQuery(query, params);
    }
}