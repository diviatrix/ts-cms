import Database from '../src/db';
import { ICMSSetting } from '../src/types/ICMSSetting';

interface CleanupStats {
    users: { before: number; after: number; deleted: number };
    invites: { before: number; after: number; deleted: number };
    themes: { before: number; after: number; deleted: number };
    records: { before: number; after: number; deleted: number };
    settings: { before: number; after: number; deleted: number };
}

class TestDataCleaner {
    private db = Database;

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
     * ПРОСТАЯ ЗАЩИТА АДМИНОВ - получаем всех пользователей с admin ролью
     */
    private async getProtectedUserIds(): Promise<string[]> {
        const result = await this.db.query(`
            SELECT DISTINCT u.id 
            FROM users u 
            INNER JOIN user_groups ug ON u.id = ug.user_id 
            WHERE ug.group_id = 'admin'
        `);

        if (result.success && result.data) {
            const adminIds = result.data.map((admin: any) => admin.id);
            console.log(`🛡️  Защищаем ${adminIds.length} администраторов от удаления`);
            return adminIds;
        }

        return [];
    }

    async cleanupTestUsers(): Promise<number> {
        console.log('🧹 Очистка тестовых пользователей...');
        
        // ПОЛУЧАЕМ АДМИНОВ ДЛЯ ЗАЩИТЫ
        const protectedIds = await this.getProtectedUserIds();
        
        // Удаляем пользователей с тестовыми именами/email
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

        let totalDeleted = 0;

        for (const pattern of testPatterns) {
            if (pattern.includes('@')) {
                // Поиск по email + защита админов
                const excludeClause = protectedIds.length > 0 
                    ? `AND id NOT IN (${protectedIds.map(() => '?').join(', ')})` 
                    : '';
                
                const result = await this.db.query(
                    `DELETE FROM users WHERE email LIKE ? ${excludeClause}`,
                    [pattern, ...protectedIds]
                );
                if (result.success) {
                    console.log(`  ✓ Удалены пользователи с email паттерном: ${pattern}`);
                }
            } else {
                // Поиск по login + защита админов
                const excludeClause = protectedIds.length > 0 
                    ? `AND id NOT IN (${protectedIds.map(() => '?').join(', ')})` 
                    : '';
                
                const result = await this.db.query(
                    `DELETE FROM users WHERE login LIKE ? ${excludeClause}`,
                    [pattern, ...protectedIds]
                );
                if (result.success) {
                    console.log(`  ✓ Удалены пользователи с login паттерном: ${pattern}`);
                }
            }
        }

        // Удаляем пользователей с ID содержащими test + защита админов
        const excludeClause = protectedIds.length > 0 
            ? `AND id NOT IN (${protectedIds.map(() => '?').join(', ')})` 
            : '';
        
        await this.db.query(
            `DELETE FROM users WHERE id LIKE '%test%' ${excludeClause}`,
            protectedIds
        );

        console.log(`  📊 Очистка тестовых пользователей завершена (админы защищены)`);
        return totalDeleted;
    }

    async cleanupTestInvites(): Promise<number> {
        console.log('🧹 Очистка тестовых инвайтов...');
        
        // Удаляем неиспользованные инвайты (старше 1 дня)
        const unusedResult = await this.db.query(
            `DELETE FROM invites WHERE used_by IS NULL AND datetime(created_at) < datetime('now', '-1 day')`
        );

        // Удаляем инвайты с тестовыми кодами
        const testCodeResult = await this.db.query(
            `DELETE FROM invites WHERE code LIKE 'test%' OR code LIKE 'debug%' OR code LIKE 'demo%'`
        );

        // Удаляем инвайты от несуществующих пользователей
        const orphanResult = await this.db.query(
            `DELETE FROM invites WHERE created_by NOT IN (SELECT id FROM users)`
        );

        console.log('  ✓ Удалены неиспользованные инвайты старше 1 дня');
        console.log('  ✓ Удалены инвайты с тестовыми кодами');
        console.log('  ✓ Удалены инвайты от несуществующих пользователей');

        return 0;
    }

    async cleanupTestThemes(): Promise<number> {
        console.log('🧹 Очистка тестовых тем...');
        
        // Оставляем только одну активную тему
        const defaultTheme = await this.db.query(
            `SELECT id FROM themes WHERE is_default = 1 LIMIT 1`
        );

        let keepThemeId = null;
        if (defaultTheme.success && defaultTheme.data && defaultTheme.data.length > 0) {
            keepThemeId = (defaultTheme.data[0] as any).id;
        } else {
            // Если нет темы по умолчанию, найдем первую активную
            const activeTheme = await this.db.query(
                `SELECT id FROM themes WHERE is_active = 1 LIMIT 1`
            );
            if (activeTheme.success && activeTheme.data && activeTheme.data.length > 0) {
                keepThemeId = (activeTheme.data[0] as any).id;
            } else {
                // Если нет активных тем, оставим первую
                const firstTheme = await this.db.query(
                    `SELECT id FROM themes ORDER BY created_at ASC LIMIT 1`
                );
                if (firstTheme.success && firstTheme.data && firstTheme.data.length > 0) {
                    keepThemeId = (firstTheme.data[0] as any).id;
                }
            }
        }

        if (keepThemeId) {
            // Удаляем все темы кроме выбранной
            await this.db.query(
                `DELETE FROM themes WHERE id != ?`,
                [keepThemeId]
            );

            // Убеждаемся что оставшаяся тема активна
            await this.db.query(
                `UPDATE themes SET is_active = 1, is_default = 1 WHERE id = ?`,
                [keepThemeId]
            );

            console.log(`  ✓ Оставлена только одна активная тема (ID: ${keepThemeId})`);
        }

        return 0;
    }

    async cleanupTestRecords(): Promise<number> {
        console.log('🧹 Очистка тестовых записей...');
        
        // Удаляем записи с тестовыми заголовками
        await this.db.query(
            `DELETE FROM records WHERE 
             title LIKE '%test%' OR 
             title LIKE '%debug%' OR 
             title LIKE '%sample%' OR
             title LIKE '%example%' OR
             description LIKE '%test%' OR
             content LIKE '%test%'`
        );

        // Удаляем записи от несуществующих пользователей
        await this.db.query(
            `DELETE FROM records WHERE user_id NOT IN (SELECT id FROM users)`
        );

        console.log('  ✓ Удалены записи с тестовыми заголовками/содержимым');
        console.log('  ✓ Удалены записи от несуществующих пользователей');

        return 0;
    }

    async cleanupTestSettings(): Promise<number> {
        console.log('🧹 Очистка тестовых настроек...');
        
        // Список тестовых настроек для удаления
        const testSettings = [
            'availability_test',
            'test_setting',
            'debug_mode',
            'sample_config'
        ];

        // Удаляем настройки с _test суффиксом
        await this.db.query(`DELETE FROM cms_settings WHERE setting_key LIKE '%_test'`);
        await this.db.query(`DELETE FROM cms_settings WHERE setting_key LIKE 'test_%'`);
        await this.db.query(`DELETE FROM cms_settings WHERE setting_key LIKE 'debug_%'`);

        // Удаляем конкретные тестовые настройки
        for (const setting of testSettings) {
            await this.db.query(`DELETE FROM cms_settings WHERE setting_key = ?`, [setting]);
        }

        console.log('  ✓ Удалены настройки с _test/_debug суффиксами');
        console.log('  ✓ Удалены конкретные тестовые настройки');

        return 0;
    }

    async cleanupOrphanedData(): Promise<void> {
        console.log('🧹 Очистка связанных данных...');

        // Очищаем сессии для несуществующих пользователей
        await this.db.query(`DELETE FROM sessions WHERE user_id NOT IN (SELECT id FROM users)`);
        
        // Очищаем профили для несуществующих пользователей  
        await this.db.query(`DELETE FROM user_profiles WHERE user_id NOT IN (SELECT id FROM users)`);
        
        // Очищаем группы для несуществующих пользователей
        await this.db.query(`DELETE FROM user_groups WHERE user_id NOT IN (SELECT id FROM users)`);
        
        // Очищаем настройки тем для несуществующих тем
        await this.db.query(`DELETE FROM theme_settings WHERE theme_id NOT IN (SELECT id FROM themes)`);
        
        // Очищаем пользовательские предпочтения тем
        await this.db.query(`DELETE FROM user_theme_preferences WHERE user_id NOT IN (SELECT id FROM users)`);
        await this.db.query(`DELETE FROM user_theme_preferences WHERE theme_id NOT IN (SELECT id FROM themes)`);

        console.log('  ✓ Очищены все связанные данные');
    }

    async run(): Promise<void> {
        console.log('🚀 ЗАПУСК БЕЗОПАСНОЙ ОЧИСТКИ ТЕСТОВЫХ ДАННЫХ\n');
        
        try {
            const statsBefore = await this.getStats();
            
            console.log('📊 СТАТИСТИКА ДО ОЧИСТКИ:');
            console.log(`  👥 Пользователи: ${statsBefore.users.before}`);
            console.log(`  📧 Инвайты: ${statsBefore.invites.before}`);
            console.log(`  🎨 Темы: ${statsBefore.themes.before}`);
            console.log(`  📝 Записи: ${statsBefore.records.before}`);
            console.log(`  ⚙️  Настройки: ${statsBefore.settings.before}\n`);

            // Начинаем транзакцию для безопасности
            await this.db.beginTransaction();

            try {
                // Выполняем очистку в правильном порядке (учитывая внешние ключи)
                await this.cleanupTestUsers();
                await this.cleanupTestInvites(); 
                await this.cleanupTestRecords();
                await this.cleanupTestThemes();
                await this.cleanupTestSettings();
                await this.cleanupOrphanedData();

                // Фиксируем изменения
                await this.db.commitTransaction();
                console.log('\n✅ Транзакция успешно завершена');

            } catch (error) {
                // Откатываем изменения при ошибке
                await this.db.rollbackTransaction();
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
            console.log('🎉 БЕЗОПАСНАЯ ОЧИСТКА ЗАВЕРШЕНА УСПЕШНО!');
            console.log('🛡️  АДМИНЫ ЗАЩИЩЕНЫ ОТ УДАЛЕНИЯ!');

        } catch (error) {
            console.error('❌ ОШИБКА ПРИ ОЧИСТКЕ:', error);
            throw error;
        }
    }
}

// Запуск очистки при прямом вызове скрипта
if (require.main === module) {
    const cleaner = new TestDataCleaner();
    cleaner.run()
        .then(() => {
            console.log('\nОчистка завершена. Можете проверить результат в админ-панели.');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Критическая ошибка:', error);
            process.exit(1);
        });
}

export default TestDataCleaner;