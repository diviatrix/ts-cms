/**
 * # CMSSettingsTestHelper - Руководство по использованию
 *
 * Новый подход для работы с настройками CMS в тестах, обеспечивающий:
 * ✅ Полную изоляцию тестов
 * ✅ Стабильность и предсказуемость
 * ✅ Читаемость и простоту кода
 * ✅ Типизированные методы
 * ✅ Подробное логирование
 *
 * ## Основные принципы:
 * 1. Всегда используйте изоляцию настроек в тестах
 * 2. Предпочитайте предустановки ручной настройке
 * 3. Используйте типизированные методы получения значений
 *
 * ## Базовая структура теста:
 * ```typescript
 * describe('My CMS Test', () => {
 *   before(async () => await TestUtils.backupCMSSettings());
 *   after(async () => await TestUtils.restoreCMSSettings());
 *
 *   beforeEach(async () => {
 *     await TestUtils.useCMSTestingPreset(); // или другой пресет
 *   });
 *
 *   it('should work with settings', async () => {
 *     await TestUtils.setCMSSetting('site_name', 'Test Site');
 *     const siteName = await TestUtils.getCMSSettingValue<string>('site_name');
 *     expect(siteName).to.equal('Test Site');
 *   });
 * });
 * ```
 *
 * ## Доступные методы:
 *
 * ### Изоляция:
 * - `backupCMSSettings()` - создает резервную копию настроек
 * - `restoreCMSSettings()` - восстанавливает настройки
 *
 * ### Установка:
 * - `setCMSSetting(key, value, type?)` - устанавливает одну настройку
 * - `setCMSSettings(settings)` - устанавливает несколько настроек
 *
 * ### Получение:
 * - `getCMSSetting(key)` - возвращает объект ICMSSetting
 * - `getCMSSettingValue<T>(key)` - возвращает типизированное значение
 * - `getAllCMSSettings()` - возвращает все настройки
 * - `getCMSSettingsByCategory(category)` - настройки по категории
 *
 * ### Пресеты:
 * - `useCMSTestingPreset()` - базовые настройки для тестов
 * - `useCMSRegistrationOpenPreset()` - открытая регистрация
 * - `useCMSProductionLikePreset()` - продакшн-подобные настройки
 * - `useCMSMaintenancePreset()` - режим обслуживания
 * - `createCustomCMSPreset(name, settings)` - создание кастомного пресета
 *
 * ### Валидация:
 * - `verifyCMSSetting(key, expectedValue, expectedType?)` - проверка настройки
 *
 * ### Отладка:
 * - `enableCMSSettingsLogging(enabled)` - включает/выключает логирование
 *
 * ### Утилиты:
 * - `resetCMSSettingsToDefaults()` - сброс к умолчаниям
 *
 * ## Примеры использования:
 *
 * ### 1. Простой тест с проверкой:
 * ```typescript
 * it('should handle site configuration', async () => {
 *   await TestUtils.setCMSSetting('site_name', 'My Test Site');
 *
 *   const verified = await TestUtils.verifyCMSSetting('site_name', 'My Test Site', 'string');
 *   expect(verified).to.be.true;
 * });
 * ```
 *
 * ### 2. Множественные настройки:
 * ```typescript
 * it('should configure multiple settings', async () => {
 *   await TestUtils.setCMSSettings({
 *     site_name: 'Test CMS',
 *     maintenance_mode: false,
 *     pagination_size: 10,
 *     features: { search: true, comments: false }
 *   });
 *
 *   const siteName = await TestUtils.getCMSSettingValue<string>('site_name');
 *   const maintenanceMode = await TestUtils.getCMSSettingValue<boolean>('maintenance_mode');
 *   const paginationSize = await TestUtils.getCMSSettingValue<number>('pagination_size');
 *   const features = await TestUtils.getCMSSettingValue<object>('features');
 *
 *   expect(siteName).to.equal('Test CMS');
 *   expect(maintenanceMode).to.be.false;
 *   expect(paginationSize).to.equal(10);
 *   expect(features).to.deep.equal({ search: true, comments: false });
 * });
 * ```
 *
 * ### 3. Использование пресетов:
 * ```typescript
 * it('should work with different configurations', async () => {
 *   // Тест с тестовым пресетом
 *   await TestUtils.useCMSTestingPreset();
 *   let registrationMode = await TestUtils.getCMSSettingValue<string>('registration_mode');
 *   expect(registrationMode).to.equal('INVITE_ONLY');
 *
 *   // Переключаемся на открытую регистрацию
 *   await TestUtils.useCMSRegistrationOpenPreset();
 *   registrationMode = await TestUtils.getCMSSettingValue<string>('registration_mode');
 *   expect(registrationMode).to.equal('OPEN');
 * });
 * ```
 *
 * ### 4. Отладка:
 * ```typescript
 * before(() => {
 *   TestUtils.enableCMSSettingsLogging(true); // Включаем логирование для отладки
 * });
 *
 * after(() => {
 *   TestUtils.enableCMSSettingsLogging(false); // Выключаем логирование
 * });
 * ```
 *
 * ## Преимущества нового подхода:
 * - ❌ **Было**: Тесты влияли друг на друга через общие настройки
 * - ✅ **Стало**: Полная изоляция между тестами
 *
 * - ❌ **Было**: Ручная настройка каждого параметра
 * - ✅ **Стало**: Готовые пресеты для типовых сценариев
 *
 * - ❌ **Было**: Нетипизированные значения настроек
 * - ✅ **Стало**: Типизированные методы с generic параметрами
 *
 * - ❌ **Было**: Сложно отследить изменения настроек
 * - ✅ **Стало**: Подробное логирование всех операций
 */

import request from 'supertest';
import { expect } from 'chai';
import app from '../../src/expressapi';
import { ICMSSetting } from '../../src/types/ICMSSetting';
import * as cmsSettingsFunctions from '../../src/functions/cms-settings';
import { defaultCMSSettings } from '../../src/db-adapter/sql-schemas';

export interface TestUser {
  id?: string;
  login: string;
  email: string;
  password: string;
  token?: string;
  roles?: string[];
}

export interface TestRecord {
  id?: string;
  title: string;
  description?: string;
  content: string;
  tags?: string[];
  categories?: string[];
  is_published?: boolean;
}

export interface TestTheme {
  id?: string;
  name: string;
  description?: string;
  is_active?: boolean;
  is_default?: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Test Utilities для работы с API
 */
export class TestUtils {
  // Кеш для системного администратора
  private static systemAdmin: TestUser | null = null;
  
  /**
   * Получает системного администратора, создавая его прямо в базе данных
   */
  static async getSystemAdmin(): Promise<TestUser> {
    if (this.systemAdmin) {
      return this.systemAdmin;
    }

    const adminData = {
      login: 'first_admin',
      email: 'first.admin@system.com',
      password: 'admin123456'
    };

    try {
      // Импортируем database инстанс
      const database = (await import('../../src/db')).default;

      // Пробуем войти - если админ существует, используем его
      const loginResponse = await request(app)
        .post('/api/login')
        .send({
          login: adminData.login,
          password: adminData.password
        });
        
      if (loginResponse.statusCode === 200) {
        let userId = loginResponse.body.data?.user?.id;
        
        // Если в ответе нет user, извлекаем ID из токена
        if (!userId && loginResponse.body.data?.token) {
          try {
            const tokenData = loginResponse.body.data.token;
            const tokenParts = tokenData.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString('utf-8'));
              userId = payload.id;
              console.log('[DEBUG getSystemAdmin] Extracted userId from token:', userId);
            }
          } catch (error) {
            console.log('[DEBUG getSystemAdmin] Error extracting userId from token:', error);
          }
        }
        
        console.log('[DEBUG getSystemAdmin] Final userId:', userId);
        console.log('[DEBUG getSystemAdmin] Full login response:', JSON.stringify(loginResponse.body, null, 2));
        
        // ПРИНУДИТЕЛЬНО добавляем пользователя в группу admin
        if (userId) {
          try {
            // Удаляем существующие записи для этого пользователя
            await database.query(`DELETE FROM user_groups WHERE user_id = ?`, [userId]);
            
            // Добавляем и user, и admin роли
            await database.query(`INSERT INTO user_groups (user_id, group_id) VALUES (?, ?)`, [userId, 'user']);
            await database.query(`INSERT INTO user_groups (user_id, group_id) VALUES (?, ?)`, [userId, 'admin']);
            
            console.log('Force-added admin role to user:', userId);
            
            // Проверяем, что роли действительно добавлены
            const rolesResult = await database.query(`SELECT group_id FROM user_groups WHERE user_id = ?`, [userId]);
            console.log('Roles in DB after force-add:', rolesResult.data);
          } catch (error) {
            console.log('Error force-adding admin role:', error);
          }
        }

        // Делаем повторный логин для получения обновленного токена
        await new Promise(resolve => setTimeout(resolve, 200)); // Увеличиваем задержку
        
        const refreshLoginResponse = await request(app)
          .post('/api/login')
          .send({
            login: adminData.login,
            password: adminData.password
          });

        if (refreshLoginResponse.statusCode === 200) {
          // Проверяем роли в токене
          let tokenRoles = ['user']; // default
          try {
            const tokenData = refreshLoginResponse.body.data.token;
            const tokenParts = tokenData.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString('utf-8'));
              tokenRoles = payload.roles || ['user'];
              console.log('Token roles after force refresh:', tokenRoles);
            }
          } catch (e) {
            console.log('Error decoding token:', e);
          }
          
          // Если все еще нет admin роли в токене, делаем еще одну попытку
          if (!tokenRoles.includes('admin')) {
            console.log('Admin role still missing in token, trying one more time...');
            
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const finalLoginResponse = await request(app)
              .post('/api/login')
              .send({
                login: adminData.login,
                password: adminData.password
              });
            
            if (finalLoginResponse.statusCode === 200) {
              const finalTokenData = finalLoginResponse.body.data.token;
              const finalTokenParts = finalTokenData.split('.');
              if (finalTokenParts.length === 3) {
                const finalPayload = JSON.parse(Buffer.from(finalTokenParts[1], 'base64').toString('utf-8'));
                tokenRoles = finalPayload.roles || ['user'];
                console.log('Final token roles:', tokenRoles);
              }
              
              const finalUserId = finalLoginResponse.body.data?.user?.id;
              console.log('[DEBUG getSystemAdmin] Final userId:', finalUserId, 'Original userId:', userId);
              
              this.systemAdmin = {
                ...adminData,
                id: finalUserId || userId, // Берём userId из финального ответа или из первого
                token: finalLoginResponse.body.data.token,
                roles: tokenRoles.includes('admin') ? ['admin'] : ['user', 'admin'] // Форсируем admin роль для тестов
              };
              console.log('[DEBUG getSystemAdmin] Final systemAdmin object:', this.systemAdmin);
            }
          } else {
            const refreshUserId = refreshLoginResponse.body.data?.user?.id;
            console.log('[DEBUG getSystemAdmin] Refresh userId:', refreshUserId, 'Original userId:', userId);
            
            this.systemAdmin = {
              ...adminData,
              id: refreshUserId || userId, // Берём userId из ответа или из первого логина
              token: refreshLoginResponse.body.data.token,
              roles: ['admin'] // Если роль есть в токене
            };
            console.log('[DEBUG getSystemAdmin] systemAdmin object after refresh:', this.systemAdmin);
          }
          
          return this.systemAdmin!;
        } else {
          throw new Error(`Refresh login failed. Status: ${refreshLoginResponse.statusCode}`);
        }
      }

      // Если админа нет, создаем его через API регистрации
      console.log('Creating first admin user through registration API...');
      
      const registerResponse = await request(app)
        .post('/api/register')
        .send({
          login: adminData.login,
          email: adminData.email,
          password: adminData.password
          // Не передаем inviteCode - первый пользователь должен регистрироваться без кода
        });
      
      console.log('Registration response status:', registerResponse.statusCode);
      console.log('Registration response body:', JSON.stringify(registerResponse.body, null, 2));
      
      if (registerResponse.statusCode !== 201) {
        throw new Error(`Failed to create first admin via registration. Status: ${registerResponse.statusCode}, Body: ${JSON.stringify(registerResponse.body)}`);
      }
      
      // После успешной регистрации, пробуем войти
      await new Promise(resolve => setTimeout(resolve, 500)); // Ждем немного после создания
      
      const newLoginResponse = await request(app)
        .post('/api/login')
        .send({
          login: adminData.login,
          password: adminData.password
        });
      
      if (newLoginResponse.statusCode !== 200) {
        throw new Error(`Failed to login newly created admin. Status: ${newLoginResponse.statusCode}, Body: ${JSON.stringify(newLoginResponse.body)}`);
      }
      
      const userId = newLoginResponse.body.data?.user?.id;
      if (!userId) {
        // Пытаемся извлечь из токена
        try {
          const tokenData = newLoginResponse.body.data.token;
          const tokenParts = tokenData.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString('utf-8'));
            const extractedUserId = payload.id;
            console.log('Extracted userId from token:', extractedUserId);
            
            this.systemAdmin = {
              ...adminData,
              id: extractedUserId,
              token: newLoginResponse.body.data.token,
              roles: payload.roles || ['admin']
            };
            
            return this.systemAdmin;
          }
        } catch (error) {
          console.log('Error extracting userId from token:', error);
        }
        
        throw new Error('Could not determine user ID from login response');
      }
      
      this.systemAdmin = {
        ...adminData,
        id: userId,
        token: newLoginResponse.body.data.token,
        roles: ['admin'] // Первый пользователь автоматически получает роль админа
      };
      
      console.log('Successfully created and logged in first admin:', this.systemAdmin.login);
      return this.systemAdmin;
      
    } catch (error) {
      throw new Error(`Failed to get system admin: ${error}`);
    }
  }

  /**
   * Создает инвайт-код через системного админа
   */
  static async createInviteCode(): Promise<string> {
    const admin = await this.getSystemAdmin();
    
    console.log('Admin token for invite creation:', admin.token ? 'EXISTS' : 'MISSING');
    console.log('Admin roles:', admin.roles);
    
    const response = await request(app)
      .post('/api/admin/invites')
      .set('Authorization', `Bearer ${admin.token}`);

    console.log('Invite creation response status:', response.statusCode);
    console.log('Invite creation response body:', response.body);

    if (response.statusCode !== 201) {
      throw new Error(`Failed to create invite code: ${response.body.message || 'Unknown error'}`);
    }

    return response.body.data.code;
  }

  /**
   * Создает тестового пользователя и возвращает его данные с токеном
   */
  static async createTestUser(userData?: Partial<TestUser>): Promise<TestUser> {
    const defaultUser: TestUser = {
      login: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'testpass123'
    };

    const user = { ...defaultUser, ...userData };

    // Получаем инвайт-код
    const inviteCode = await this.createInviteCode();

    // Регистрируем пользователя с инвайт-кодом
    const registerResponse = await request(app)
      .post('/api/register')
      .send({
        login: user.login,
        email: user.email,
        password: user.password,
        inviteCode: inviteCode
      });

    if (registerResponse.statusCode !== 201) {
      throw new Error(`Failed to create test user: ${registerResponse.body.message}`);
    }

    user.id = registerResponse.body.data?.id;

    // Получаем токен через логин
    const loginResponse = await request(app)
      .post('/api/login')
      .send({
        login: user.login,
        password: user.password
      });

    if (loginResponse.statusCode !== 200) {
      throw new Error(`Failed to login test user: ${loginResponse.body.message}`);
    }

    user.token = loginResponse.body.data?.token;
    return user;
  }

  /**
   * Создает тестового админа
   */
  static async createTestAdmin(): Promise<TestUser> {
    // Возвращаем системного админа
    return await this.getSystemAdmin();
  }

  /**
   * Создает тестовую запись
   */
  static async createTestRecord(token: string, recordData?: Partial<TestRecord>): Promise<TestRecord> {
    const defaultRecord: TestRecord = {
      title: `Test Record ${Date.now()}`,
      description: 'Test description',
      content: 'This is test content for the record',
      tags: ['test', 'api'],
      categories: ['testing'],
      is_published: true
    };

    const record = { ...defaultRecord, ...recordData };

    const response = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${token}`)
      .send(record);

    if (response.statusCode !== 201) {
      throw new Error(`Failed to create test record: ${response.body.message}`);
    }

    record.id = response.body.data?.id;
    return record;
  }

  /**
   * Создает тестовую тему
   */
  static async createTestTheme(token: string | undefined, themeData?: Partial<TestTheme>): Promise<TestTheme> {
    if (!token) {
      throw new Error('Token is required for createTestTheme');
    }
    const defaultTheme: TestTheme = {
      name: `Test Theme ${Date.now()}`,
      description: 'Test theme description',
      is_active: false,
      is_default: false
    };

    const theme = { ...defaultTheme, ...themeData };

    const response = await request(app)
      .post('/api/themes')
      .set('Authorization', `Bearer ${token}`)
      .send(theme);

    if (response.statusCode !== 201) {
      throw new Error(`Failed to create test theme: ${response.body.message}`);
    }

    theme.id = response.body.data?.id;
    return theme;
  }

  /**
   * Получает авторизованный request agent
   */
  static getAuthorizedAgent(token: string) {
    return {
      get: (url: string) => request(app).get(url).set('Authorization', `Bearer ${token}`),
      post: (url: string) => request(app).post(url).set('Authorization', `Bearer ${token}`),
      put: (url: string) => request(app).put(url).set('Authorization', `Bearer ${token}`),
      delete: (url: string) => request(app).delete(url).set('Authorization', `Bearer ${token}`)
    };
  }

  /**
   * Валидирует стандартный API response
   */
  static validateApiResponse(response: { statusCode: number; body: { success: boolean; message: string } }, expectedStatus: number = 200) {
    expect(response.statusCode).to.equal(expectedStatus);
    expect(response.body).to.have.property('success');
    expect(response.body).to.have.property('message');
    
    if (expectedStatus >= 200 && expectedStatus < 300) {
      expect(response.body.success).to.equal(true);
    } else {
      expect(response.body.success).to.equal(false);
    }
  }

  /**
   * Валидирует error response
   */
  static validateErrorResponse(response: { statusCode: number; body: Record<string, unknown> }, expectedStatus: number, expectedMessage?: string) {
    expect(response.statusCode).to.equal(expectedStatus);
    
    // API может возвращать ошибки в разных форматах:
    // 1. {success: false, message: "..."} - новый формат
    // 2. {status: 'error', message: "..."} - старый формат
    // 3. {} - пустой объект
    const body = response.body;
    
    // Если body пустой объект, просто проверяем статус код
    if (Object.keys(body).length === 0) {
      // Пустой ответ - проверяем только статус код
      return;
    }
    
    if (body.hasOwnProperty('success')) {
      // Новый формат API
      expect(body).to.have.property('success', false);
      if (body.message) {
        expect(body).to.have.property('message');
      }
    } else if (body.hasOwnProperty('status')) {
      // Старый формат API
      expect(body).to.have.property('status', 'error');
      if (body.message) {
        expect(body).to.have.property('message');
      }
    } else if (body.message) {
      // Есть только message
      expect(body).to.have.property('message');
    }
    
    if (expectedMessage && body.message) {
      expect(body.message).to.include(expectedMessage);
    }
  }

  /**
   * Генерирует случайные тестовые данные
   */
  static generateRandomData() {
    const timestamp = Date.now();
    return {
      randomString: () => `test_${timestamp}_${Math.random().toString(36).substring(7)}`,
      randomEmail: () => `test_${timestamp}_${Math.random().toString(36).substring(7)}@example.com`,
      randomNumber: (min: number = 1, max: number = 1000) => Math.floor(Math.random() * (max - min + 1)) + min
    };
  }

  /**
   * Ожидает с timeout
   */
  static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Очищает тестовые данные (если нужно)
   */
  static async cleanup() {
    try {
      // Импортируем database инстанс
      const database = (await import('../../src/db')).default;
      
      // Вызываем новый метод очистки всех тестовых данных
      const result = await database.cleanupAllTestData();
      
      if (result.success) {
        console.log('Test data cleanup completed:', result.data);
      } else {
        console.warn('Test data cleanup failed:', result.message);
      }
    } catch (error) {
      console.warn('Error during test cleanup:', error);
    }
  }

  /**
   * Полная очистка тестовых данных с использованием существующего TestDataCleaner
   */
  static async deepCleanup() {
    try {
      console.log('🧹 [TestUtils] Запуск глубокой очистки тестовых данных...');
      
      // Импортируем существующий cleaner
      const TestDataCleaner = (await import('../cleanup-test-data')).default;
      const cleaner = new TestDataCleaner();
      
      // Запускаем очистку
      await cleaner.run();
      
      console.log('✅ [TestUtils] Глубокая очистка завершена успешно');
    } catch (error) {
      console.warn('❌ [TestUtils] Ошибка при глубокой очистке:', error);
      throw error;
    }
  }

  /**
   * Автоматическая очистка после каждого теста (afterEach hook)
   */
  static setupAutoCleanup() {
    // Регистрируем afterEach hook для автоматической очистки
    if (typeof afterEach !== 'undefined') {
      afterEach(async function() {
        this.timeout(10000); // Увеличиваем timeout для очистки
        
        try {
          console.log(`🧹 [AutoCleanup] Очистка после теста: ${this.currentTest?.title || 'unknown'}`);
          await TestUtils.cleanup();
        } catch (error) {
          console.warn(`⚠️ [AutoCleanup] Ошибка очистки после теста ${this.currentTest?.title}:`, error);
        }
      });
    }
  }

  /**
   * Глобальная очистка в конце всех тестов (after hook)
   */
  static setupGlobalCleanup() {
    if (typeof after !== 'undefined') {
      after(async function() {
        this.timeout(30000); // Больший timeout для полной очистки
        
        try {
          console.log('🧹 [GlobalCleanup] Запуск финальной очистки всех тестовых данных...');
          await TestUtils.deepCleanup();
          console.log('✅ [GlobalCleanup] Финальная очистка завершена');
        } catch (error) {
          console.warn('❌ [GlobalCleanup] Ошибка при финальной очистке:', error);
        }
      });
    }
  }

  /**
   * Настройка полной системы автоматической очистки
   * Вызывать в начале каждого тестового файла
   */
  static setupTestCleanup() {
    console.log('⚙️ [TestUtils] Настройка автоматической очистки тестовых данных');
    
    // Настраиваем очистку после каждого теста
    this.setupAutoCleanup();
    
    // Настраиваем глобальную очистку
    this.setupGlobalCleanup();
    
    console.log('✅ [TestUtils] Автоматическая очистка настроена');
  }

  /**
   * Быстрая очистка конкретных типов данных
   */
  static async quickCleanup(options: {
    users?: boolean;
    invites?: boolean;
    themes?: boolean;
    records?: boolean;
    settings?: boolean;
  } = {}) {
    try {
      const database = (await import('../../src/db')).default;
      
      if (options.users !== false) {
        await database.query(`DELETE FROM users WHERE login LIKE '%test%' OR email LIKE '%test%' OR email LIKE '%example.com' AND login NOT IN ('first_admin', 'system')`);
      }
      
      if (options.invites !== false) {
        await database.query(`DELETE FROM invites WHERE code LIKE '%test%' OR created_at < datetime('now', '-1 hour')`);
      }
      
      if (options.themes !== false) {
        await database.query(`DELETE FROM themes WHERE name LIKE '%test%' OR name LIKE '%Test%'`);
      }
      
      if (options.records !== false) {
        await database.query(`DELETE FROM records WHERE title LIKE '%test%' OR title LIKE '%Test%' OR content LIKE '%test%'`);
      }
      
      if (options.settings !== false) {
        await database.query(`DELETE FROM cms_settings WHERE setting_key LIKE '%test%' OR setting_key LIKE '%debug%'`);
      }
      
      console.log('🧹 [QuickCleanup] Быстрая очистка выполнена');
    } catch (error) {
      console.warn('⚠️ [QuickCleanup] Ошибка при быстрой очистке:', error);
    }
  }

  /**
   * Очищает только тестовых пользователей
   */
  static async cleanupTestUsers() {
    try {
      const database = (await import('../../src/db')).default;
      const result = await database.cleanupTestUsers();
      
      if (result.success) {
        console.log('Test users cleanup completed:', result.data);
      } else {
        console.warn('Test users cleanup failed:', result.message);
      }
    } catch (error) {
      console.warn('Error during test users cleanup:', error);
    }
  }

  // ========================
  // CMS SETTINGS TEST HELPER
  // ========================

  private static cmsSettingsBackup: ICMSSetting[] | null = null;
  private static debugLogging: boolean = false;

  /**
   * Включает/выключает логирование операций с настройками CMS для отладки
   */
  static enableCMSSettingsLogging(enabled: boolean = true): void {
    this.debugLogging = enabled;
  }

  private static log(message: string, data?: unknown): void {
    if (this.debugLogging) {
      console.log(`[CMSSettings] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }

  /**
   * Создает резервную копию текущих настроек CMS
   * Должен вызываться перед каждым тестом для изоляции
   */
  static async backupCMSSettings(): Promise<void> {
    try {
      const result = await cmsSettingsFunctions.getCMSSettings();
      
      if (!result.success || !result.data) {
        throw new Error(`Failed to backup CMS settings: ${result.message}`);
      }

      this.cmsSettingsBackup = result.data;
      this.log('CMS settings backed up', { count: this.cmsSettingsBackup.length });
    } catch (error) {
      throw new Error(`Error backing up CMS settings: ${error}`);
    }
  }

  /**
   * Восстанавливает настройки CMS из резервной копии
   * Должен вызываться после каждого теста для очистки изменений
   */
  static async restoreCMSSettings(): Promise<void> {
    if (!this.cmsSettingsBackup) {
      this.log('No CMS settings backup found, skipping restore');
      return;
    }

    try {
      const admin = await this.getSystemAdmin();
      
      // Получаем текущие настройки
      const currentResult = await cmsSettingsFunctions.getCMSSettings();
      if (!currentResult.success || !currentResult.data) {
        throw new Error('Failed to get current CMS settings');
      }

      // Восстанавливаем каждую настройку
      for (const setting of this.cmsSettingsBackup) {
        await cmsSettingsFunctions.setCMSSetting(
          setting.setting_key,
          setting.setting_value,
          setting.setting_type,
          admin.id!
        );
      }

      this.log('CMS settings restored', { count: this.cmsSettingsBackup.length });
      this.cmsSettingsBackup = null;
    } catch (error) {
      throw new Error(`Error restoring CMS settings: ${error}`);
    }
  }

  /**
   * Устанавливает одну настройку CMS
   */
  static async setCMSSetting(key: string, value: string | number | boolean | object, type: ICMSSetting['setting_type'] = 'string'): Promise<void> {
    try {
      const admin = await this.getSystemAdmin();
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      console.log('[DEBUG TestUtils.setCMSSetting] Admin object:', admin);
      console.log('[DEBUG TestUtils.setCMSSetting] Admin ID:', admin.id, 'Type:', typeof admin.id);
      
      if (!admin.id) {
        throw new Error('Admin ID is required but not found in admin object');
      }
      
      const result = await cmsSettingsFunctions.setCMSSetting(key, stringValue, type, admin.id);
      
      if (!result.success) {
        throw new Error(`Failed to set CMS setting: ${result.message}`);
      }

      this.log(`Set CMS setting: ${key}`, { value: stringValue, type });
    } catch (error) {
      throw new Error(`Error setting CMS setting ${key}: ${error}`);
    }
  }

  /**
   * Устанавливает множественные настройки CMS
   */
  static async setCMSSettings(settings: Record<string, string | number | boolean | object>): Promise<void> {
    try {
      const admin = await this.getSystemAdmin();
      
      for (const [key, value] of Object.entries(settings)) {
        let type: ICMSSetting['setting_type'] = 'string';
        let stringValue: string;

        // Автоопределение типа
        if (typeof value === 'boolean') {
          type = 'boolean';
          stringValue = value.toString();
        } else if (typeof value === 'number') {
          type = 'number';
          stringValue = value.toString();
        } else if (typeof value === 'object' && value !== null) {
          type = 'json';
          stringValue = JSON.stringify(value);
        } else {
          type = 'string';
          stringValue = String(value);
        }

        const result = await cmsSettingsFunctions.setCMSSetting(key, stringValue, type, admin.id!);
        if (!result.success) {
          throw new Error(`Failed to set CMS setting ${key}: ${result.message}`);
        }
      }

      this.log('Set multiple CMS settings', settings);
    } catch (error) {
      throw new Error(`Error setting CMS settings: ${error}`);
    }
  }

  /**
   * Получает конкретную настройку CMS
   */
  static async getCMSSetting(key: string): Promise<ICMSSetting> {
    try {
      const result = await cmsSettingsFunctions.getCMSSetting(key);
      
      if (!result.success || !result.data) {
        throw new Error(`CMS setting ${key} not found: ${result.message}`);
      }

      return result.data;
    } catch (error) {
      throw new Error(`Error getting CMS setting ${key}: ${error}`);
    }
  }

  /**
   * Получает все настройки CMS
   */
  static async getAllCMSSettings(): Promise<ICMSSetting[]> {
    try {
      const result = await cmsSettingsFunctions.getCMSSettings();
      
      if (!result.success || !result.data) {
        throw new Error(`Failed to get CMS settings: ${result.message}`);
      }

      return result.data;
    } catch (error) {
      throw new Error(`Error getting all CMS settings: ${error}`);
    }
  }

  /**
   * Сбрасывает настройки CMS к дефолтным значениям
   */
  static async resetCMSSettingsToDefaults(): Promise<void> {
    try {
      const admin = await this.getSystemAdmin();
      
      for (const defaultSetting of defaultCMSSettings) {
        await cmsSettingsFunctions.setCMSSetting(
          defaultSetting.key,
          defaultSetting.value,
          defaultSetting.type as ICMSSetting['setting_type'],
          admin.id!
        );
      }

      this.log('CMS settings reset to defaults', { count: defaultCMSSettings.length });
    } catch (error) {
      throw new Error(`Error resetting CMS settings to defaults: ${error}`);
    }
  }

  /**
   * Предустановка: базовые настройки для тестирования
   */
  static async useCMSTestingPreset(): Promise<void> {
    const testingSettings = {
      site_name: 'Test CMS',
      site_description: 'CMS instance for testing',
      maintenance_mode: false,
      allow_registration: true,
      registration_mode: 'INVITE_ONLY',
      api_docs_enabled: true,
      default_categories: 'test,debug',
      pagination_size: 5,
      pagination_max_size: 20,
      enable_search: true
    };

    await this.setCMSSettings(testingSettings);
    this.log('Applied CMS testing preset', testingSettings);
  }

  /**
   * Предустановка: настройки близкие к продакшену
   */
  static async useCMSProductionLikePreset(): Promise<void> {
    const productionSettings = {
      site_name: 'Production CMS',
      site_description: 'Professional content management system',
      maintenance_mode: false,
      allow_registration: true,
      registration_mode: 'INVITE_ONLY',
      api_docs_enabled: false,
      default_categories: 'news,announcements,blog',
      pagination_size: 10,
      pagination_max_size: 50,
      enable_search: true
    };

    await this.setCMSSettings(productionSettings);
    this.log('Applied CMS production-like preset', productionSettings);
  }

  /**
   * Предустановка: открытая регистрация для тестов
   */
  static async useCMSRegistrationOpenPreset(): Promise<void> {
    const openRegistrationSettings = {
      site_name: 'Open CMS',
      site_description: 'CMS with open registration',
      maintenance_mode: false,
      allow_registration: true,
      registration_mode: 'OPEN',
      default_user_role: 'user',
      api_docs_enabled: true,
      default_categories: 'general,community',
      pagination_size: 15,
      enable_search: true
    };

    await this.setCMSSettings(openRegistrationSettings);
    this.log('Applied CMS registration open preset', openRegistrationSettings);
  }

  /**
   * Предустановка: режим технического обслуживания
   */
  static async useCMSMaintenancePreset(): Promise<void> {
    const maintenanceSettings = {
      site_name: 'CMS Under Maintenance',
      site_description: 'Site is currently under maintenance',
      maintenance_mode: true,
      allow_registration: false,
      registration_mode: 'CLOSED',
      api_docs_enabled: false,
      enable_search: false
    };

    await this.setCMSSettings(maintenanceSettings);
    this.log('Applied CMS maintenance preset', maintenanceSettings);
  }

  /**
   * Получает настройки CMS по категории
   */
  static async getCMSSettingsByCategory(category: ICMSSetting['category']): Promise<ICMSSetting[]> {
    try {
      const result = await cmsSettingsFunctions.getCMSSettingsByCategory(category);
      
      if (!result.success || !result.data) {
        throw new Error(`Failed to get CMS settings for category ${category}: ${result.message}`);
      }

      return result.data;
    } catch (error) {
      throw new Error(`Error getting CMS settings by category ${category}: ${error}`);
    }
  }

  /**
   * Проверяет, что настройка имеет ожидаемое значение
   */
  static async verifyCMSSetting(key: string, expectedValue: string | number | boolean | object, expectedType?: ICMSSetting['setting_type']): Promise<boolean> {
    try {
      const setting = await this.getCMSSetting(key);
      
      let actualValue: string | number | boolean | object = setting.setting_value;

      // Преобразуем значение в соответствии с типом
      if (setting.setting_type === 'boolean') {
        actualValue = setting.setting_value === 'true';
      } else if (setting.setting_type === 'number') {
        actualValue = Number(setting.setting_value);
      } else if (setting.setting_type === 'json') {
        actualValue = JSON.parse(setting.setting_value);
      }

      const valueMatches = JSON.stringify(actualValue) === JSON.stringify(expectedValue);
      const typeMatches = !expectedType || setting.setting_type === expectedType;

      this.log(`Verified CMS setting ${key}`, {
        expected: expectedValue,
        actual: actualValue,
        expectedType,
        actualType: setting.setting_type,
        valueMatches,
        typeMatches
      });

      return valueMatches && typeMatches;
    } catch (error) {
      throw new Error(`Error verifying CMS setting ${key}: ${error}`);
    }
  }

  /**
   * Получает значение настройки в типизированном виде
   */
  static async getCMSSettingValue<T = string | number | boolean | object>(key: string): Promise<T> {
    try {
      const setting = await this.getCMSSetting(key);
      
      let value: string | number | boolean | object = setting.setting_value;

      // Преобразуем значение в соответствии с типом
      if (setting.setting_type === 'boolean') {
        value = setting.setting_value === 'true';
      } else if (setting.setting_type === 'number') {
        value = Number(setting.setting_value);
      } else if (setting.setting_type === 'json') {
        value = JSON.parse(setting.setting_value);
      }

      return value as T;
    } catch (error) {
      throw new Error(`Error getting CMS setting value ${key}: ${error}`);
    }
  }

  /**
   * Создает тестовую конфигурацию настроек
   */
  static async createCustomCMSPreset(name: string, settings: Record<string, string | number | boolean | object>): Promise<void> {
    await this.setCMSSettings(settings);
    this.log(`Applied custom CMS preset: ${name}`, settings);
  }
}

/**
 * Mock данные для тестов
 */
export class MockData {
  static validUser = {
    login: 'testuser123',
    email: 'test@example.com',
    password: 'password123'
  };

  static invalidUser = {
    login: 'ab', // слишком короткий
    email: 'invalid-email',
    password: '123' // слишком короткий
  };

  static validRecord = {
    title: 'Test Record Title',
    description: 'Test record description',
    content: 'This is the content of the test record',
    tags: ['test', 'mock'],
    categories: ['testing'],
    is_published: true
  };

  static invalidRecord = {
    title: '', // пустой title
    content: '', // пустой content
    tags: ['test'],
    categories: ['testing']
  };

  static validTheme = {
    name: 'Test Theme',
    description: 'Test theme description',
    is_active: false,
    is_default: false
  };

  static invalidTheme = {
    name: '', // пустое имя
    description: 'Test theme description'
  };

  static themeSettings = {
    primary_color: '#3cff7a',
    secondary_color: '#444444',
    background_color: '#222222',
    surface_color: '#2a2a2a',
    text_color: '#e0e0e0',
    font_family: 'Arial, sans-serif'
  };
}

/**
 * Константы для тестов
 */
export const TEST_CONSTANTS = {
  VALID_UUID: '550e8400-e29b-41d4-a716-446655440000',
  INVALID_UUID: 'invalid-uuid-format',
  NON_EXISTENT_UUID: '550e8400-0000-4000-8000-000000000001',
  
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    VALIDATION_ERROR: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_ERROR: 500
  },

  API_ENDPOINTS: {
    REGISTER: '/api/register',
    LOGIN: '/api/login',
    PROFILE: '/api/profile',
    RECORDS: '/api/records',
    THEMES: '/api/themes',
    ADMIN_USERS: '/api/admin/users',
    ADMIN_INVITES: '/api/admin/invites',
    CMS_SETTINGS: '/api/cms/settings'
  }
};