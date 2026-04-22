import adapter from '../sqlite-adapter.ts';
import { ICMSSetting } from '../../types/ICMSSetting.ts';
import IResolve from '../../types/IResolve.ts';
import prep from '../../utils/prepare.ts';

export class SettingsRepository {
    private db: adapter;

    constructor(db: adapter) {
        this.db = db;
    }

    public async getCMSSettings(): Promise<IResolve<ICMSSetting[]>> {
        const query = 'SELECT * FROM cms_settings ORDER BY category, setting_key';
        const response = await this.db.executeQuery(query, []);
        return prep.response(response.success, response.message, response.data as ICMSSetting[]);
    }

    public async getCMSSetting(key: string): Promise<IResolve<ICMSSetting | null>> {
        const query = 'SELECT * FROM cms_settings WHERE setting_key = ?';
        const response = await this.db.executeQuery(query, [key]);
        const setting = response.data?.[0] as ICMSSetting | undefined;
        return prep.response(response.success, response.message, setting || null);
    }

    public async setCMSSetting(key: string, value: string, type: string = 'string', updatedBy: string): Promise<IResolve<boolean>> {
        if (!updatedBy) {
            return prep.response(false, 'updatedBy parameter is required for CMS settings', false);
        }
        
        const existingSetting = await this.getCMSSetting(key);
        const description = existingSetting.success && existingSetting.data ? existingSetting.data.description : null;
        const category = existingSetting.success && existingSetting.data ? existingSetting.data.category : 'general';
        
        const query = `INSERT OR REPLACE INTO cms_settings (setting_key, setting_value, setting_type, description, category, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`;
        const response = await this.db.executeQuery(query, [key, value, type, description || null, category, updatedBy]);
        return prep.response(response.success, response.message, response.success);
    }

    public async query(query: string, params: (string | number | boolean | null)[] = []): Promise<IResolve<unknown[]>> {
        return await this.db.executeQuery(query, params);
    }
}