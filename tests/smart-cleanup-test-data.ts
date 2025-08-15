import Database from '../src/db';
import { ICMSSetting } from '../src/types/ICMSSetting';

interface CleanupStats {
    users: { before: number; after: number; deleted: number };
    invites: { before: number; after: number; deleted: number };
    themes: { before: number; after: number; deleted: number };
    records: { before: number; after: number; deleted: number };
    settings: { before: number; after: number; deleted: number };
}

interface CleanupOptions {
    preserveAdmins?: boolean;
    preserveProduction?: boolean;
    onlyRecentData?: boolean;
    hoursThreshold?: number;
    dryRun?: boolean;
}

class SmartTestDataCleaner {
    private db = Database;
    private options: CleanupOptions;

    constructor(options: CleanupOptions = {}) {
        this.options = {
            preserveAdmins: true,
            preserveProduction: true,
            onlyRecentData: true,
            hoursThreshold: 24, // Удаляем только данные младше 24 часов
            dryRun: false,
            ...options
        };
    }

    async getStats(): Promise<CleanupStats> {
        const userCount = await this.db.query('SELECT COUNT(*) as count FROM users');
        const inviteCount = await this.db.query('SELECT COUNT(*) as count FROM invites');
        const themeCount = await this.db.query('SELECT COUNT(*) as count FROM themes');
        const recordCount = await this.db.query('SELECT COUNT(*) as count FROM records');
        const settingCount = await this.db.query('SELECT COUNT(*) as count FROM cms_settings');

        return {
            users: {
                before: (userCount.data?.[0] as any)?.count || 0,
                after: 0,
                deleted: 0
            },
            invites: {
                before: (inviteCount.data?.[0] as any)?.count || 0,
                after: 0,
                deleted: 0
            },
            themes: {
                before: (themeCount.data?.[0] as any)?.count || 0,
                after: 0,
                deleted: 0
            },
            records: {
                before: (recordCount.data?.[0] as any)?.count || 0,
                after: 0,
                deleted: 0
            },
            settings: {
                before: (settingCount.data?.[0] as any)?.count || 0,
                after: 0,
                deleted: 0
            }
        };
    }

    /**
     * Получает список админов для защиты от удаления
     */
    private async getAdminUsers(): Promise<string[]> {
        if (!this.options.preserveAdmins) {
            return [];
        }

        const result = await this.db.query(`
            SELECT DISTINCT u.id, u.login, u.email 
            FROM users u 
            INNER JOIN user_groups ug ON u.id = ug.user_id 
            WHERE ug.group_id = 'admin'
        `);

        if (result.success && result.data) {
            const adminIds = result.data.map((admin: any) => admin.id);
            console.log(`🛡️  Найдено ${adminIds.length} администраторов для защиты:`);
            result.data.forEach((admin: any) => {
                console.log(`   - ${admin.login} (${admin.email})`);
            });
            return adminIds;
        }

        return [];
    }

    /**
     * Создает SQL условие для времени создания
     */
    private getTimeCondition(column: string = 'created_at'): string {
        if (!this.options.onlyRecentData) {
            return '';
        }
        
        return `AND datetime(${column}) > datetime('now', '-${this.options.hoursThreshold} hours')`;
    }

    /**
     * Выполняет SQL запрос с учетом dry-run режима
     */
    private async executeQuery(query: string, params: any[] = []): Promise<any> {
        if (this.options.dryRun) {
            console.log(`[DRY RUN] ${query}`, params.length > 0 ? `with params: ${JSON.stringify(params)}` : '');
            
            // Для dry-run заменяем DELETE на SELECT COUNT
            if (query.trim().toUpperCase().startsWith('DELETE')) {
                const countQuery = query.replace(/^DELETE/, 'SELECT COUNT(*) as count');
                const result = await this.db.query(countQuery, params);
                return { success: true, data: result.data, rowsAffected: (result.data?.[0] as any)?.count || 0 };
            }
            
            return { success: true, data: [], rowsAffected: 0 };
        }

        return await this.db.query(query, params);
    }

    async cleanupTestUsers(): Promise<number> {
        console.log('🧹 Умная очистка пользователей...');

        // Получаем админов для защиты
        const adminIds = await this.getAdminUsers();
        let totalDeleted = 0;

        // Создаем исключения для админов
        const adminExclusion = adminIds.length > 0 
            ? `AND id NOT IN (${adminIds.map(() => '?').join(', ')})`
            : '';

        // Паттерны для определения тестовых пользователей
        const testPatterns = [
            'test%',
            'debug%', 
            'demo%',
            'sample%',
            'example%',
            '%@test.%',
            '%@example.%',
            '%@localhost%'
        ];

        for (const pattern of testPatterns) {
            let query: string;
            let params: any[];

            if (pattern.includes('@')) {
                // Поиск по email
                query = `DELETE FROM users WHERE email LIKE ? ${adminExclusion} ${this.getTimeCondition('created_at')}`;
                params = [pattern, ...adminIds];
            } else {
                // Поиск по login
                query = `DELETE FROM users WHERE login LIKE ? ${adminExclusion} ${this.getTimeCondition('created_at')}`;
                params = [pattern, ...adminIds];
            }

            const result = await this.executeQuery(query, params);
            if (result.success) {
                const deleted = result.rowsAffected || 0;
                totalDeleted += deleted;
                if (deleted > 0) {
                    console.log(`  ✓ Удалено ${deleted} пользователей с паттерном: ${pattern}`);
                }
            }
        }

        // Удаляем пользователей с ID содержащими test (но не админов)
        const testIdQuery = `DELETE FROM users WHERE id LIKE '%test%' ${adminExclusion} ${this.getTimeCondition('created_at')}`;
        const testIdResult = await this.executeQuery(testIdQuery, adminIds);
        if (testIdResult.success) {
            totalDeleted += testIdResult.rowsAffected || 0;
        }

        console.log(`  📊 Всего удалено пользователей: ${totalDeleted}`);
        return totalDeleted;
    }

    async cleanupTestInvites(): Promise<number> {
        console.log('🧹 Умная очистка инвайтов...');
        let totalDeleted = 0;

        // Удаляем старые неиспользованные инвайты
        const unusedQuery = `DELETE FROM invites WHERE used_by IS NULL ${this.getTimeCondition('created_at')}`;
        const unusedResult = await this.executeQuery(unusedQuery);
        if (unusedResult.success) {
            totalDeleted += unusedResult.rowsAffected || 0;
        }

        // Удаляем инвайты с тестовыми кодами
        const testCodeQuery = `DELETE FROM invites WHERE (code LIKE 'test%' OR code LIKE 'debug%' OR code LIKE 'demo%') ${this.getTimeCondition('created_at')}`;
        const testCodeResult = await this.executeQuery(testCodeQuery);
        if (testCodeResult.success) {
            totalDeleted += testCodeResult.rowsAffected || 0;
        }

        // Удаляем инвайты от несуществующих пользователей
        const orphanQuery = `DELETE FROM invites WHERE created_by NOT IN (SELECT id FROM users)`;
        const orphanResult = await this.executeQuery(orphanQuery);
        if (orphanResult.success) {
            totalDeleted += orphanResult.rowsAffected || 0;
        }

        console.log(`  📊 Всего удалено инвайтов: ${totalDeleted}`);
        return totalDeleted;
    }

    async cleanupTestThemes(): Promise<number> {
        console.log('🧹 Умная очистка тем...');

        if (!this.options.preserveProduction) {
            console.log('  ⚠️  Режим production отключен - удаляем все тестовые темы');
        }

        // Находим default/активные темы для защиты
        const protectedThemes = await this.db.query(`
            SELECT id, name FROM themes 
            WHERE is_default = 1 OR is_active = 1
        `);

        const protectedIds = protectedThemes.success && protectedThemes.data 
            ? protectedThemes.data.map((theme: any) => theme.id)
            : [];

        if (protectedIds.length > 0 && this.options.preserveProduction) {
            console.log(`  🛡️  Защищаем ${protectedIds.length} production тем`);
        }

        // Удаляем тестовые темы (но не default/активные)
        const protectionClause = protectedIds.length > 0 && this.options.preserveProduction
            ? `AND id NOT IN (${protectedIds.map(() => '?').join(', ')})`
            : '';

        const query = `DELETE FROM themes WHERE (name LIKE '%test%' OR name LIKE '%Test%' OR name LIKE '%DEBUG%') ${protectionClause} ${this.getTimeCondition('created_at')}`;
        const result = await this.executeQuery(query, protectedIds);

        const deleted = result.success ? (result.rowsAffected || 0) : 0;
        console.log(`  📊 Удалено тестовых тем: ${deleted}`);
        return deleted;
    }

    async cleanupTestRecords(): Promise<number> {
        console.log('🧹 Умная очистка записей...');
        let totalDeleted = 0;

        // Удаляем записи с тестовыми заголовками/содержимым
        const testContentQuery = `DELETE FROM records WHERE 
            (title LIKE '%test%' OR 
             title LIKE '%debug%' OR 
             title LIKE '%sample%' OR
             title LIKE '%example%' OR
             description LIKE '%test%' OR
             content LIKE '%test%')
            ${this.getTimeCondition('created_at')}`;

        const testContentResult = await this.executeQuery(testContentQuery);
        if (testContentResult.success) {
            totalDeleted += testContentResult.rowsAffected || 0;
        }

        // Удаляем записи от несуществующих пользователей
        const orphanQuery = `DELETE FROM records WHERE user_id NOT IN (SELECT id FROM users)`;
        const orphanResult = await this.executeQuery(orphanQuery);
        if (orphanResult.success) {
            totalDeleted += orphanResult.rowsAffected || 0;
        }

        console.log(`  📊 Всего удалено записей: ${totalDeleted}`);
        return totalDeleted;
    }

    async cleanupTestSettings(): Promise<number> {
        console.log('🧹 Умная очистка настроек...');
        let totalDeleted = 0;

        // Список важных production настроек (НЕ удаляем)
        const productionSettings = [
            'site_name',
            'site_description', 
            'active_theme_id',
            'maintenance_mode',
            'allow_registration',
            'registration_mode',
            'default_user_role',
            'default_categories',
            'pagination_size',
            'pagination_max_size',
            'enable_search'
        ];

        const protectionClause = this.options.preserveProduction 
            ? `AND setting_key NOT IN (${productionSettings.map(() => '?').join(', ')})`
            : '';

        // Удаляем настройки с тестовыми суффиксами/префиксами
        const testPrefixQuery = `DELETE FROM cms_settings WHERE 
            (setting_key LIKE '%_test' OR 
             setting_key LIKE 'test_%' OR 
             setting_key LIKE 'debug_%' OR
             setting_key LIKE '%_debug' OR
             setting_key LIKE 'sample_%')
            ${protectionClause}
            ${this.getTimeCondition('updated_at')}`;

        const params = this.options.preserveProduction ? productionSettings : [];
        const result = await this.executeQuery(testPrefixQuery, params);
        if (result.success) {
            totalDeleted += result.rowsAffected || 0;
        }

        console.log(`  📊 Удалено тестовых настроек: ${totalDeleted}`);
        return totalDeleted;
    }

    async cleanupOrphanedData(): Promise<void> {
        console.log('🧹 Очистка связанных данных...');

        const queries = [
            'DELETE FROM sessions WHERE user_id NOT IN (SELECT id FROM users)',
            'DELETE FROM user_profiles WHERE user_id NOT IN (SELECT id FROM users)',
            'DELETE FROM user_groups WHERE user_id NOT IN (SELECT id FROM users)',
            'DELETE FROM theme_settings WHERE theme_id NOT IN (SELECT id FROM themes)',
            'DELETE FROM user_theme_preferences WHERE user_id NOT IN (SELECT id FROM users)',
            'DELETE FROM user_theme_preferences WHERE theme_id NOT IN (SELECT id FROM themes)'
        ];

        for (const query of queries) {
            await this.executeQuery(query);
        }

        console.log('  ✓ Очищены все связанные данные');
    }

    async run(): Promise<void> {
        const mode = this.options.dryRun ? '🔍 ТЕСТОВЫЙ ЗАПУСК (DRY RUN)' : '🚀 РЕАЛЬНАЯ ОЧИСТКА';
        console.log(`${mode} УМНОЙ ОЧИСТКИ ТЕСТОВЫХ ДАННЫХ\n`);
        
        console.log('⚙️  Настройки очистки:');
        console.log(`  🛡️  Сохранять админов: ${this.options.preserveAdmins ? 'ДА' : 'НЕТ'}`);
        console.log(`  🏭 Сохранять production данные: ${this.options.preserveProduction ? 'ДА' : 'НЕТ'}`);
        console.log(`  ⏰ Только недавние данные: ${this.options.onlyRecentData ? `ДА (${this.options.hoursThreshold}ч)` : 'НЕТ'}`);
        console.log('');

        try {
            const statsBefore = await this.getStats();
            
            console.log('📊 СТАТИСТИКА ДО ОЧИСТКИ:');
            console.log(`  👥 Пользователи: ${statsBefore.users.before}`);
            console.log(`  📧 Инвайты: ${statsBefore.invites.before}`);
            console.log(`  🎨 Темы: ${statsBefore.themes.before}`);
            console.log(`  📝 Записи: ${statsBefore.records.before}`);
            console.log(`  ⚙️  Настройки: ${statsBefore.settings.before}\n`);

            if (!this.options.dryRun) {
                await this.db.beginTransaction();
            }

            try {
                await this.cleanupTestUsers();
                await this.cleanupTestInvites(); 
                await this.cleanupTestRecords();
                await this.cleanupTestThemes();
                await this.cleanupTestSettings();
                await this.cleanupOrphanedData();

                if (!this.options.dryRun) {
                    await this.db.commitTransaction();
                    console.log('\n✅ Транзакция успешно завершена');
                }

            } catch (error) {
                if (!this.options.dryRun) {
                    await this.db.rollbackTransaction();
                }
                throw error;
            }

            const statsAfter = await this.getStats();
            
            console.log('\n📊 СТАТИСТИКА ПОСЛЕ ОЧИСТКИ:');
            console.log(`  👥 Пользователи: ${statsAfter.users.before} (удалено: ${statsBefore.users.before - statsAfter.users.before})`);
            console.log(`  📧 Инвайты: ${statsAfter.invites.before} (удалено: ${statsBefore.invites.before - statsAfter.invites.before})`);
            console.log(`  🎨 Темы: ${statsAfter.themes.before} (удалено: ${statsBefore.themes.before - statsAfter.themes.before})`);
            console.log(`  📝 Записи: ${statsAfter.records.before} (удалено: ${statsBefore.records.before - statsAfter.records.before})`);
            console.log(`  ⚙️  Настройки: ${statsAfter.settings.before} (удалено: ${statsBefore.settings.before - statsAfter.settings.before})`);

            const totalDeleted = 
                (statsBefore.users.before - statsAfter.users.before) +
                (statsBefore.invites.before - statsAfter.invites.before) +
                (statsBefore.themes.before - statsAfter.themes.before) +
                (statsBefore.records.before - statsAfter.records.before) +
                (statsBefore.settings.before - statsAfter.settings.before);

            console.log(`\n🎯 ИТОГО УДАЛЕНО: ${totalDeleted} записей`);
            
            if (this.options.dryRun) {
                console.log('🔍 ЭТО БЫЛ ТЕСТОВЫЙ ЗАПУСК - ДАННЫЕ НЕ ИЗМЕНЕНЫ!');
            } else {
                console.log('🎉 УМНАЯ ОЧИСТКА ЗАВЕРШЕНА УСПЕШНО!');
            }

        } catch (error) {
            console.error('❌ ОШИБКА ПРИ ОЧИСТКЕ:', error);
            throw error;
        }
    }
}

// Запуск очистки при прямом вызове скрипта
if (require.main === module) {
    const dryRun = process.argv.includes('--dry-run');
    const preserveAdmins = !process.argv.includes('--no-preserve-admins');
    const preserveProduction = !process.argv.includes('--no-preserve-production');
    const hoursThreshold = parseInt(process.argv.find(arg => arg.startsWith('--hours='))?.split('=')[1] || '24');
    
    const cleaner = new SmartTestDataCleaner({
        dryRun,
        preserveAdmins,
        preserveProduction,
        hoursThreshold
    });
    
    cleaner.run()
        .then(() => {
            console.log('\n✅ Умная очистка завершена успешно!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Критическая ошибка:', error);
            process.exit(1);
        });
}

export default SmartTestDataCleaner;