import adapter from './db-adapter/sqlite-adapter.ts';
import { RecordRepository } from './db-adapter/repositories/record-repo.ts';
import { ThemeRepository } from './db-adapter/repositories/theme-repo.ts';
import { SettingsRepository } from './db-adapter/repositories/settings-repo.ts';
import { DatabaseChecker } from './utils/database-checker.ts';
import IResolve from './types/IResolve.ts';
import prep from './utils/prepare.ts';

class Database {
    private static instance: Database;
    private db: adapter;
    public record: RecordRepository;
    public theme: ThemeRepository;
    public settings: SettingsRepository;

    private constructor() {
        this.db = new adapter();
        this.record = new RecordRepository(this.db);
        this.theme = new ThemeRepository(this.db);
        this.settings = new SettingsRepository(this.db);
        this.initialize();
    }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    private async initialize() {
        const checker = new DatabaseChecker();
        const result = await checker.checkDatabase(true);
        
        if (!result.success) {
            console.error('❌ Database initialization failed:', result.message);
            if (result.data) {
                if (result.data.missingTables.length > 0) {
                    console.error('   Missing tables:', result.data.missingTables.join(', '));
                }
                if (result.data.missingColumns.length > 0) {
                    console.error('   Missing columns:', result.data.missingColumns.map(mc => `${mc.table}.${mc.column}`).join(', '));
                }
            }
            process.exit(1);
        } else {
            console.log('✓ Database initialized');
        }
    }

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

    public async getActiveWebsiteTheme() {
        const themeIdSetting = await this.settings.getCMSSetting('active_theme_id');
        if (themeIdSetting.success && themeIdSetting.data && themeIdSetting.data.setting_value) {
            const theme = await this.theme.getThemeById(themeIdSetting.data.setting_value);
            if (theme.success && theme.data) {
                return theme;
            }
        }
        return { success: false, message: 'No theme is applied to the website', data: null };
    }

    public async setActiveWebsiteTheme(themeId: string, updatedBy: string) {
        const theme = await this.theme.getThemeById(themeId);
        if (!theme.success || !theme.data) {
            return { success: false, message: 'Theme not found' };
        }
        return await this.settings.setCMSSetting('active_theme_id', themeId, 'string', updatedBy);
    }

    public async cleanupAllTestData(): Promise<IResolve<string>> {
        return await this.db.cleanupAllTestData();
    }

    public async query(query: string, params: (string | number | boolean | null)[] = []): Promise<IResolve<unknown[]>> {
        return await this.db.executeQuery(query, params);
    }
}

export default Database.getInstance();