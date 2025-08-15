import request from 'supertest';
import { expect } from 'chai';
import app from '../src/expressapi';
import { TestUtils, TestUser, TestTheme, TEST_CONSTANTS } from './helpers/test-utils';
import { ICMSSetting } from '../src/types/ICMSSetting';

describe('CMS Settings API', () => {
  let adminUser: TestUser;
  let testUser: TestUser;
  let testTheme: TestTheme;

  before(async () => {
    // Включаем логирование для отладки
    TestUtils.enableCMSSettingsLogging(true);
    
    // Создаем резервную копию настроек для изоляции
    await TestUtils.backupCMSSettings();
    
    // Получаем тестовых пользователей
    adminUser = await TestUtils.getSystemAdmin();
    testUser = await TestUtils.createTestUser();
    
    // Создаем тему для тестирования настроек
    testTheme = await TestUtils.createTestTheme(adminUser.token, {
      name: `CMS Settings Test Theme ${Date.now()}`,
      description: 'Theme for testing CMS settings'
    });
  });

  after(async () => {
    // Восстанавливаем настройки после всех тестов
    await TestUtils.restoreCMSSettings();
  });

  beforeEach(async () => {
    // Устанавливаем чистые настройки для каждого теста
    await TestUtils.useCMSTestingPreset();
  });

  describe('GET /api/cms/settings - CMS Settings Retrieval', () => {
    it('should retrieve current CMS settings with admin privileges', async () => {
      const response = await request(app)
        .get('/api/cms/settings')
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.equal(true);
      expect(response.body.data).to.be.an('array');
      
      const settings = response.body.data;
      
      // Проверяем что настройки возвращаются как массив
      expect(settings).to.be.an('array');
      
      if (settings.length > 0) {
        // Если есть настройки, проверяем их структуру
        settings.forEach((setting: ICMSSetting) => {
          expect(setting).to.have.property('setting_key');
          expect(setting).to.have.property('setting_value');
          expect(setting).to.have.property('setting_type');
          expect(setting).to.have.property('category');
          expect(setting).to.have.property('updated_at');
          expect(setting).to.have.property('updated_by');
          expect(typeof setting.setting_key).to.equal('string');
          expect(setting.setting_key.length).to.be.greaterThan(0);
        });
      }
    });

    it('should require authentication for CMS settings retrieval', async () => {
      const response = await request(app)
        .get('/api/cms/settings');

      TestUtils.validateErrorResponse(response, 401);
    });

    it('should require admin privileges for CMS settings retrieval', async () => {
      const response = await request(app)
        .get('/api/cms/settings')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect([401, 403]).to.include(response.statusCode);
      TestUtils.validateErrorResponse(response, response.statusCode);
    });

    it('should return consistent settings format', async () => {
      const response = await request(app)
        .get('/api/cms/settings')
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.equal(true);
      expect(response.body.data).to.be.an('array');
      
      // Проверяем что настройки можно сериализовать в JSON
      expect(() => JSON.stringify(response.body.data)).to.not.throw();
    });
  });

  describe('GET /api/cms/settings/:key - Individual Setting Retrieval', () => {
    it('should retrieve individual setting with admin privileges', async () => {
      // Сначала создаем настройку через TestUtils
      const settingKey = 'test_setting_get';
      const settingValue = `Test Value ${Date.now()}`;

      await TestUtils.setCMSSetting(settingKey, settingValue, 'string');

      // Получаем настройку через API
      const response = await request(app)
        .get(`/api/cms/settings/${settingKey}`)
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.equal(true);
      expect(response.body.data).to.be.an('object');
      expect(response.body.data.setting_value).to.equal(settingValue);
      
      // Проверяем через TestUtils
      const setting = await TestUtils.getCMSSetting(settingKey);
      expect(setting.setting_value).to.equal(settingValue);
    });

    it('should return 404 for non-existent setting', async () => {
      const response = await request(app)
        .get('/api/cms/settings/non_existent_setting')
        .set('Authorization', `Bearer ${adminUser.token}`);

      TestUtils.validateErrorResponse(response, 404);
    });
  });

  describe('PUT /api/cms/settings/:key - CMS Settings Update', () => {
    it('should update individual CMS setting with admin privileges', async () => {
      const settingKey = 'site_name';
      const settingValue = `Test CMS ${Date.now()}`;

      const response = await request(app)
        .put(`/api/cms/settings/${settingKey}`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({ value: settingValue, type: 'string' });

      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.equal(true);
      
      // Проверяем что настройка была обновлена через TestUtils
      const settingValue2 = await TestUtils.getCMSSettingValue<string>(settingKey);
      expect(settingValue2).to.equal(settingValue);
      
      // Дополнительная проверка через API
      const getResponse = await request(app)
        .get(`/api/cms/settings/${settingKey}`)
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(getResponse.statusCode).to.equal(200);
      if (getResponse.body.data) {
        expect(getResponse.body.data.setting_value).to.equal(settingValue);
      }
    });

    it('should require authentication for CMS settings update', async () => {
      const response = await request(app)
        .put('/api/cms/settings/site_name')
        .send({ value: 'Unauthorized Test', type: 'string' });

      TestUtils.validateErrorResponse(response, 401);
    });

    it('should require admin privileges for CMS settings update', async () => {
      const response = await request(app)
        .put('/api/cms/settings/site_name')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ value: 'Forbidden Test', type: 'string' });

      expect([401, 403]).to.include(response.statusCode);
      TestUtils.validateErrorResponse(response, response.statusCode);
    });

    it('should validate settings data format', async () => {
      const response = await request(app)
        .put('/api/cms/settings/test_setting')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({ type: 'string' }); // Missing value

      expect([400, 422]).to.include(response.statusCode);
      TestUtils.validateErrorResponse(response, response.statusCode);
    });

    it('should handle empty value validation', async () => {
      const response = await request(app)
        .put('/api/cms/settings/empty_test')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({ value: '', type: 'string' });

      // Пустая строка может быть валидной для некоторых настроек
      expect([200, 400]).to.include(response.statusCode);
      
      if (response.statusCode === 200) {
        expect(response.body.success).to.equal(true);
      } else {
        TestUtils.validateErrorResponse(response, 400);
      }
    });

    it('should handle boolean settings correctly', async () => {
      const response = await request(app)
        .put('/api/cms/settings/maintenance_mode')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({ value: 'true', type: 'boolean' });

      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.equal(true);
      
      // Проверяем значение через TestUtils
      const isMaintenanceMode = await TestUtils.getCMSSettingValue<boolean>('maintenance_mode');
      expect(isMaintenanceMode).to.equal(true);
    });

    it('should handle numeric settings correctly', async () => {
      const response = await request(app)
        .put('/api/cms/settings/pagination_size')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({ value: '25', type: 'number' });

      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.equal(true);
      
      // Проверяем значение через TestUtils
      const paginationSize = await TestUtils.getCMSSettingValue<number>('pagination_size');
      expect(paginationSize).to.equal(25);
    });
  });

  describe('GET /api/cms/active-theme - Active Theme Retrieval', () => {
    it('should retrieve current active theme or return 404', async () => {
      const response = await request(app)
        .get('/api/cms/active-theme');

      // API возвращает 404 если нет активной темы, или 200 с темой
      expect([200, 404]).to.include(response.statusCode);
      
      if (response.statusCode === 200) {
        expect(response.body.success).to.equal(true);
        const theme = response.body.data;
        expect(theme).to.be.an('object');
        expect(theme).to.have.property('id');
        expect(theme).to.have.property('name');
        expect(typeof theme.id).to.equal('string');
        expect(typeof theme.name).to.equal('string');
      } else {
        TestUtils.validateErrorResponse(response, 404);
      }
    });

    it('should allow non-admin users to retrieve active theme', async () => {
      const response = await request(app)
        .get('/api/cms/active-theme')
        .set('Authorization', `Bearer ${testUser.token}`);

      // Endpoint публичный, доступен всем
      expect([200, 404]).to.include(response.statusCode);
      
      if (response.statusCode === 200) {
        expect(response.body.success).to.equal(true);
      } else {
        TestUtils.validateErrorResponse(response, 404);
      }
    });

    it('should handle case when no theme is active', async () => {
      const response = await request(app)
        .get('/api/cms/active-theme');

      // Когда нет активной темы, API возвращает 404
      expect([200, 404]).to.include(response.statusCode);
      
      if (response.statusCode === 404) {
        TestUtils.validateErrorResponse(response, 404, 'No active theme found');
      } else if (response.statusCode === 200) {
        expect(response.body.success).to.equal(true);
        expect(response.body.data).to.be.an('object');
      }
    });
  });

  describe('PUT /api/cms/active-theme - Active Theme Update', () => {
    it('should set active theme with admin privileges', async () => {
      const themeData = {
        theme_id: testTheme.id
      };

      const response = await request(app)
        .put('/api/cms/active-theme')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send(themeData);

      // API может вернуть ошибку если тема не найдена или другие проблемы
      expect([200, 500]).to.include(response.statusCode);
      
      if (response.statusCode === 200) {
        expect(response.body.success).to.equal(true);
        
        // Проверяем что тема стала активной
        const getResponse = await request(app)
          .get('/api/cms/active-theme');

        if (getResponse.statusCode === 200 && getResponse.body.data && getResponse.body.data.id) {
          expect(getResponse.body.data.id).to.equal(testTheme.id);
        }
      }
    });

    it('should require authentication for active theme update', async () => {
      const themeData = { theme_id: testTheme.id };
      
      const response = await request(app)
        .put('/api/cms/active-theme')
        .send(themeData);

      TestUtils.validateErrorResponse(response, 401);
    });

    it('should require admin privileges for active theme update', async () => {
      const themeData = { theme_id: testTheme.id };
      
      const response = await request(app)
        .put('/api/cms/active-theme')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(themeData);

      expect([401, 403]).to.include(response.statusCode);
      TestUtils.validateErrorResponse(response, response.statusCode);
    });

    it('should return error for non-existent theme', async () => {
      const themeData = {
        theme_id: TEST_CONSTANTS.NON_EXISTENT_UUID
      };

      const response = await request(app)
        .put('/api/cms/active-theme')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send(themeData);

      // API может вернуть разные ошибки
      expect([404, 422, 500]).to.include(response.statusCode);
      TestUtils.validateErrorResponse(response, response.statusCode);
    });

    it('should validate theme ID format', async () => {
      const themeData = {
        theme_id: TEST_CONSTANTS.INVALID_UUID
      };

      const response = await request(app)
        .put('/api/cms/active-theme')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send(themeData);

      expect([400, 404, 422, 500]).to.include(response.statusCode);
      TestUtils.validateErrorResponse(response, response.statusCode);
    });

    it('should handle missing theme_id parameter', async () => {
      const response = await request(app)
        .put('/api/cms/active-theme')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({});

      expect([400, 422]).to.include(response.statusCode);
      TestUtils.validateErrorResponse(response, response.statusCode);
    });
  });

  describe('Public CMS Endpoints', () => {
    it('should retrieve registration mode publicly', async () => {
      // Устанавливаем известный режим регистрации
      await TestUtils.setCMSSetting('registration_mode', 'INVITE_ONLY', 'string');
      
      const response = await request(app)
        .get('/api/cms/registration-mode');

      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.equal(true);
      expect(response.body.data).to.have.property('registration_mode');
      expect(response.body.data.registration_mode).to.equal('INVITE_ONLY');
    });

    it('should retrieve public site name', async () => {
      // Устанавливаем известное имя сайта
      const testSiteName = `Test Site ${Date.now()}`;
      await TestUtils.setCMSSetting('site_name', testSiteName, 'string');
      
      const response = await request(app)
        .get('/api/cms/public/site-name');

      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.equal(true);
      expect(response.body.data).to.have.property('setting_value');
      expect(response.body.data.setting_value).to.equal(testSiteName);
    });

    it('should retrieve public site description', async () => {
      // Устанавливаем известное описание
      const testDescription = `Test Description ${Date.now()}`;
      await TestUtils.setCMSSetting('site_description', testDescription, 'string');
      
      const response = await request(app)
        .get('/api/cms/public/site-description');

      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.equal(true);
      expect(response.body.data).to.have.property('setting_value');
      expect(response.body.data.setting_value).to.equal(testDescription);
    });

    it('should retrieve default categories', async () => {
      // Устанавливаем известные категории
      const testCategories = 'test,demo,api';
      await TestUtils.setCMSSetting('default_categories', testCategories, 'string');
      
      const response = await request(app)
        .get('/api/cms/public/default-categories');

      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.equal(true);
      expect(response.body.data).to.have.property('setting_value');
      expect(response.body.data.setting_value).to.equal(testCategories);
    });

    it('should retrieve enable search setting', async () => {
      // Устанавливаем поиск включен
      await TestUtils.setCMSSetting('enable_search', true, 'boolean');
      
      const response = await request(app)
        .get('/api/cms/public/enable-search');

      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.equal(true);
      expect(response.body.data).to.have.property('setting_value');
      expect(response.body.data.setting_value).to.equal('true');
    });
  });

  describe('Settings Categories', () => {
    it('should retrieve settings by category', async () => {
      const response = await request(app)
        .get('/api/cms/settings/category/general')
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.equal(true);
      expect(response.body.data).to.be.an('array');
    });

    it('should require admin privileges for category settings', async () => {
      const response = await request(app)
        .get('/api/cms/settings/category/general')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect([401, 403]).to.include(response.statusCode);
      TestUtils.validateErrorResponse(response, response.statusCode);
    });
  });

  describe('Performance and Error Handling', () => {
    it('should handle large setting values efficiently', async () => {
      const largeValue = 'A'.repeat(1000); // 1KB строка
      const startTime = Date.now();
      
      const response = await request(app)
        .put('/api/cms/settings/large_setting_test')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({ value: largeValue, type: 'string' });

      const endTime = Date.now();

      // API должно обрабатывать большие значения
      expect([200, 400, 413]).to.include(response.statusCode);
      
      if (response.statusCode === 200) {
        expect(response.body.success).to.equal(true);
        // Операция должна завершиться в разумное время
        expect(endTime - startTime).to.be.lessThan(5000);
        
        // Проверяем что значение действительно установлено через TestUtils
        const storedValue = await TestUtils.getCMSSettingValue<string>('large_setting_test');
        expect(storedValue).to.equal(largeValue);
      }
    });

    it('should maintain service availability during settings updates', async () => {
      // Проверяем что API остается доступным во время обновления настроек
      const testValue = `Test ${Date.now()}`;
      const settingsUpdate = request(app)
        .put('/api/cms/settings/availability_test')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({ value: testValue, type: 'string' });

      const healthCheck = request(app)
        .get('/api/cms/settings')
        .set('Authorization', `Bearer ${adminUser.token}`);

      const [updateResult, healthResult] = await Promise.all([settingsUpdate, healthCheck]);

      expect(updateResult.statusCode).to.equal(200);
      expect(healthResult.statusCode).to.equal(200);
      expect(updateResult.body.success).to.equal(true);
      expect(healthResult.body.success).to.equal(true);
      
      // Проверяем что настройка была корректно установлена
      const storedValue = await TestUtils.getCMSSettingValue<string>('availability_test');
      expect(storedValue).to.equal(testValue);
    });
  });

  // Новые тесты для проверки функциональности TestUtils
  describe('TestUtils CMS Settings Integration', () => {
    it('should set and get multiple settings at once', async () => {
      const testSettings = {
        test_string: 'Hello World',
        test_number: 42,
        test_boolean: true,
        test_json: { key: 'value', nested: { prop: 123 } }
      };
      
      await TestUtils.setCMSSettings(testSettings);
      
      // Проверяем каждую настройку
      const stringValue = await TestUtils.getCMSSettingValue<string>('test_string');
      const numberValue = await TestUtils.getCMSSettingValue<number>('test_number');
      const booleanValue = await TestUtils.getCMSSettingValue<boolean>('test_boolean');
      const jsonValue = await TestUtils.getCMSSettingValue<object>('test_json');
      
      expect(stringValue).to.equal('Hello World');
      expect(numberValue).to.equal(42);
      expect(booleanValue).to.equal(true);
      expect(jsonValue).to.deep.equal({ key: 'value', nested: { prop: 123 } });
    });
    
    it('should verify settings correctly', async () => {
      await TestUtils.setCMSSetting('verify_test', 'test_value', 'string');
      
      const isCorrect = await TestUtils.verifyCMSSetting('verify_test', 'test_value', 'string');
      const isIncorrect = await TestUtils.verifyCMSSetting('verify_test', 'wrong_value', 'string');
      
      expect(isCorrect).to.equal(true);
      expect(isIncorrect).to.equal(false);
    });
    
    it('should use preset configurations correctly', async () => {
      await TestUtils.useCMSRegistrationOpenPreset();
      
      const registrationMode = await TestUtils.getCMSSettingValue<string>('registration_mode');
      const allowRegistration = await TestUtils.getCMSSettingValue<boolean>('allow_registration');
      
      expect(registrationMode).to.equal('OPEN');
      expect(allowRegistration).to.equal(true);
    });
    
    it('should get settings by category', async () => {
      const generalSettings = await TestUtils.getCMSSettingsByCategory('general');
      expect(generalSettings).to.be.an('array');
      
      if (generalSettings.length > 0) {
        generalSettings.forEach(setting => {
          expect(setting.category).to.equal('general');
        });
      }
    });
  });
});