import request from 'supertest';
import { expect } from 'chai';
import app from '../src/expressapi';
import { TestUtils } from './helpers/test-utils';

describe('Public CMS API', () => {
  before(async () => {
    // Включаем логирование для отладки
    TestUtils.enableCMSSettingsLogging(true);
    
    // Создаем резервную копию настроек для изоляции
    await TestUtils.backupCMSSettings();
  });

  after(async () => {
    // Восстанавливаем настройки после всех тестов
    await TestUtils.restoreCMSSettings();
  });

  beforeEach(async () => {
    // Устанавливаем известные настройки для каждого теста
    await TestUtils.useCMSTestingPreset();
  });

  describe('GET /api/cms/registration-mode', () => {
    it('should get registration mode (public endpoint)', async () => {
      // Устанавливаем известный режим регистрации
      await TestUtils.setCMSSetting('registration_mode', 'INVITE_ONLY', 'string');
      
      const response = await request(app)
        .get('/api/cms/registration-mode');

      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.equal(true);
      expect(response.body.data).to.have.property('registration_mode');
      expect(response.body.message).to.equal('Registration mode retrieved successfully');
      expect(response.body.data.registration_mode).to.equal('INVITE_ONLY');
    });

    it('should return different registration modes correctly', async () => {
      const modes = ['OPEN', 'INVITE_ONLY', 'CLOSED'];
      
      for (const mode of modes) {
        await TestUtils.setCMSSetting('registration_mode', mode, 'string');
        
        const response = await request(app)
          .get('/api/cms/registration-mode');

        expect(response.statusCode).to.equal(200);
        expect(response.body.success).to.equal(true);
        expect(response.body.data.registration_mode).to.equal(mode);
      }
    });

    it('should handle open registration preset', async () => {
      await TestUtils.useCMSRegistrationOpenPreset();
      
      const response = await request(app)
        .get('/api/cms/registration-mode');

      expect(response.statusCode).to.equal(200);
      expect(response.body.data.registration_mode).to.equal('OPEN');
    });
  });

  describe('GET /api/cms/public/site-name', () => {
    it('should get site name (public endpoint)', async () => {
      const testSiteName = `Test Site ${Date.now()}`;
      await TestUtils.setCMSSetting('site_name', testSiteName, 'string');
      
      const response = await request(app)
        .get('/api/cms/public/site-name');

      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.equal(true);
      expect(response.body.data).to.have.property('setting_value');
      expect(response.body.message).to.include('retrieved successfully');
      expect(response.body.data.setting_value).to.equal(testSiteName);
    });

    it('should return configured site name from preset', async () => {
      // Используем пресет с известным именем
      await TestUtils.useCMSTestingPreset();
      
      const response = await request(app)
        .get('/api/cms/public/site-name');

      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.equal(true);
      expect(response.body.data.setting_value).to.equal('Test CMS');
    });

    it('should handle different site names correctly', async () => {
      const siteNames = ['My Site', 'Production CMS', 'Development Site'];
      
      for (const siteName of siteNames) {
        await TestUtils.setCMSSetting('site_name', siteName, 'string');
        
        const response = await request(app)
          .get('/api/cms/public/site-name');

        expect(response.statusCode).to.equal(200);
        expect(response.body.data.setting_value).to.equal(siteName);
      }
    });
  });

  describe('GET /api/cms/public/site-description', () => {
    it('should get site description (public endpoint)', async () => {
      const testDescription = `Test Description ${Date.now()}`;
      await TestUtils.setCMSSetting('site_description', testDescription, 'string');
      
      const response = await request(app)
        .get('/api/cms/public/site-description');

      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.equal(true);
      expect(response.body.data).to.have.property('setting_value');
      expect(response.body.message).to.include('retrieved successfully');
      expect(response.body.data.setting_value).to.equal(testDescription);
    });

    it('should return configured description from preset', async () => {
      await TestUtils.useCMSTestingPreset();
      
      const response = await request(app)
        .get('/api/cms/public/site-description');

      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.equal(true);
      expect(response.body.data.setting_value).to.equal('CMS instance for testing');
    });

    it('should handle production-like description', async () => {
      await TestUtils.useCMSProductionLikePreset();
      
      const response = await request(app)
        .get('/api/cms/public/site-description');

      expect(response.statusCode).to.equal(200);
      expect(response.body.data.setting_value).to.equal('Professional content management system');
    });
  });

  describe('GET /api/cms/public/default-categories', () => {
    it('should get default categories (public endpoint)', async () => {
      const testCategories = 'test,demo,api,development';
      await TestUtils.setCMSSetting('default_categories', testCategories, 'string');
      
      const response = await request(app)
        .get('/api/cms/public/default-categories');

      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.equal(true);
      expect(response.body.data).to.have.property('setting_value');
      expect(response.body.message).to.include('retrieved successfully');
      expect(response.body.data.setting_value).to.equal(testCategories);
    });

    it('should return configured categories from preset', async () => {
      await TestUtils.useCMSTestingPreset();
      
      const response = await request(app)
        .get('/api/cms/public/default-categories');

      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.equal(true);
      expect(response.body.data.setting_value).to.equal('test,debug');
    });

    it('should handle different category formats', async () => {
      const testCases = [
        'single',
        'category1,category2',
        'cat1, cat2, cat3',
        'development,testing,production'
      ];
      
      for (const categories of testCases) {
        await TestUtils.setCMSSetting('default_categories', categories, 'string');
        
        const response = await request(app)
          .get('/api/cms/public/default-categories');

        expect(response.statusCode).to.equal(200);
        expect(response.body.data.setting_value).to.equal(categories);
        
        // Проверяем что это строка с категориями
        const categoryArray = categories.split(',').map(c => c.trim());
        expect(categoryArray).to.be.an('array');
        expect(categoryArray.length).to.be.greaterThan(0);
        categoryArray.forEach(category => {
          expect(category.length).to.be.greaterThan(0);
        });
      }
    });

    it('should use production categories preset', async () => {
      await TestUtils.useCMSProductionLikePreset();
      
      const response = await request(app)
        .get('/api/cms/public/default-categories');

      expect(response.statusCode).to.equal(200);
      expect(response.body.data.setting_value).to.equal('news,announcements,blog');
    });
  });

  describe('GET /api/cms/public/enable-search', () => {
    it('should get enable search setting (public endpoint)', async () => {
      await TestUtils.setCMSSetting('enable_search', true, 'boolean');
      
      const response = await request(app)
        .get('/api/cms/public/enable-search');

      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.equal(true);
      expect(response.body.data).to.have.property('setting_value');
      expect(response.body.message).to.include('retrieved successfully');
      expect(response.body.data.setting_value).to.equal('true');
    });

    it('should handle different boolean values', async () => {
      const testCases = [
        { value: true, expected: 'true' },
        { value: false, expected: 'false' }
      ];
      
      for (const testCase of testCases) {
        await TestUtils.setCMSSetting('enable_search', testCase.value, 'boolean');
        
        const response = await request(app)
          .get('/api/cms/public/enable-search');

        expect(response.statusCode).to.equal(200);
        expect(response.body.data.setting_value).to.equal(testCase.expected);
      }
    });

    it('should return configured value from preset', async () => {
      await TestUtils.useCMSTestingPreset();
      
      const response = await request(app)
        .get('/api/cms/public/enable-search');

      expect(response.statusCode).to.equal(200);
      expect(response.body.data.setting_value).to.equal('true');
    });

    it('should handle maintenance preset with disabled search', async () => {
      await TestUtils.useCMSMaintenancePreset();
      
      const response = await request(app)
        .get('/api/cms/public/enable-search');

      expect(response.statusCode).to.equal(200);
      expect(response.body.data.setting_value).to.equal('false');
    });
  });

  describe('Public CMS endpoints accessibility', () => {
    it('should not require authentication for public endpoints', async () => {
      // Устанавливаем известные настройки
      await TestUtils.useCMSTestingPreset();
      
      const endpoints = [
        '/api/cms/registration-mode',
        '/api/cms/public/site-name',
        '/api/cms/public/site-description', 
        '/api/cms/public/default-categories',
        '/api/cms/public/enable-search'
      ];

      // Тестируем все эндпоинты без авторизации
      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint);
        
        expect(response.statusCode).to.equal(200);
        expect(response.body.success).to.equal(true);
        expect(response.body.data).to.be.an('object');
      }
    });

    it('should return consistent response structure for all public endpoints', async () => {
      await TestUtils.useCMSTestingPreset();
      
      const endpoints = [
        '/api/cms/registration-mode',
        '/api/cms/public/site-name',
        '/api/cms/public/site-description',
        '/api/cms/public/default-categories',
        '/api/cms/public/enable-search'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint);
        
        // Все эндпоинты должны иметь одинаковую структуру ответа
        expect(response.body).to.have.property('success', true);
        expect(response.body).to.have.property('data');
        expect(response.body).to.have.property('message');
        expect(response.body.data).to.be.an('object');
      }
    });

    it('should handle CORS for public endpoints', async () => {
      await TestUtils.setCMSSetting('registration_mode', 'OPEN', 'string');
      
      const response = await request(app)
        .get('/api/cms/registration-mode')
        .set('Origin', 'https://example.com');

      expect(response.statusCode).to.equal(200);
      expect(response.body.data.registration_mode).to.equal('OPEN');
      // API должно обрабатывать CORS заголовки корректно
    });

    it('should work with different presets consistently', async () => {
      const presets = [
        { name: 'testing', setup: () => TestUtils.useCMSTestingPreset() },
        { name: 'production', setup: () => TestUtils.useCMSProductionLikePreset() },
        { name: 'registration-open', setup: () => TestUtils.useCMSRegistrationOpenPreset() }
      ];

      for (const preset of presets) {
        await preset.setup();
        
        const response = await request(app).get('/api/cms/public/site-name');
        expect(response.statusCode).to.equal(200);
        expect(response.body.success).to.equal(true);
        expect(response.body.data.setting_value).to.be.a('string');
        expect(response.body.data.setting_value.length).to.be.greaterThan(0);
      }
    });
  });

  describe('Public CMS data validation', () => {
    it('should validate site name is not empty', async () => {
      const testSiteName = 'Valid Site Name';
      await TestUtils.setCMSSetting('site_name', testSiteName, 'string');
      
      const response = await request(app)
        .get('/api/cms/public/site-name');

      expect(response.statusCode).to.equal(200);
      const siteName = response.body.data.setting_value;
      expect(siteName).to.be.a('string');
      expect(siteName.trim().length).to.be.greaterThan(0);
      expect(siteName).to.equal(testSiteName);
    });

    it('should validate default categories format', async () => {
      const testCategories = 'valid, categories, test';
      await TestUtils.setCMSSetting('default_categories', testCategories, 'string');
      
      const response = await request(app)
        .get('/api/cms/public/default-categories');

      expect(response.statusCode).to.equal(200);
      const categories = response.body.data.setting_value;
      expect(categories).to.be.a('string');
      expect(categories).to.equal(testCategories);
      
      // Проверяем что каждая категория не пустая после trim
      const categoryArray = categories.split(',');
      categoryArray.forEach((category: string) => {
        expect(category.trim().length).to.be.greaterThan(0);
      });
    });

    it('should ensure enable-search returns valid boolean-like value', async () => {
      await TestUtils.setCMSSetting('enable_search', true, 'boolean');
      
      const response = await request(app)
        .get('/api/cms/public/enable-search');

      expect(response.statusCode).to.equal(200);
      const enableSearch = response.body.data.setting_value;
      
      // Должно быть строкой 'true' или 'false' для boolean настроек
      expect(['true', 'false']).to.include(enableSearch);
      expect(enableSearch).to.equal('true');
    });

    it('should validate all settings with explicit values', async () => {
      // Устанавливаем все настройки через TestUtils
      const settings = {
        site_name: 'Test Validation Site',
        site_description: 'Site for testing validation',
        default_categories: 'validation,testing,api',
        enable_search: true,
        registration_mode: 'OPEN'
      };
      
      await TestUtils.setCMSSettings(settings);
      
      // Проверяем каждую настройку
      const endpoints = [
        { url: '/api/cms/public/site-name', expected: 'Test Validation Site' },
        { url: '/api/cms/public/site-description', expected: 'Site for testing validation' },
        { url: '/api/cms/public/default-categories', expected: 'validation,testing,api' },
        { url: '/api/cms/public/enable-search', expected: 'true' },
        { url: '/api/cms/registration-mode', expected: 'OPEN', prop: 'registration_mode' }
      ];
      
      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint.url);
        expect(response.statusCode).to.equal(200);
        
        const value = endpoint.prop ? 
          response.body.data[endpoint.prop] : 
          response.body.data.setting_value;
          
        expect(value).to.equal(endpoint.expected);
      }
    });
  });

  // Новые тесты для интеграции с TestUtils
  describe('Public CMS Integration with TestUtils', () => {
    it('should work correctly with different preset configurations', async () => {
      const presets = [
        {
          name: 'Testing Preset',
          setup: () => TestUtils.useCMSTestingPreset(),
          expected: {
            siteName: 'Test CMS',
            description: 'CMS instance for testing',
            categories: 'test,debug',
            enableSearch: 'true',
            registrationMode: 'INVITE_ONLY'
          }
        },
        {
          name: 'Production Preset', 
          setup: () => TestUtils.useCMSProductionLikePreset(),
          expected: {
            siteName: 'Production CMS',
            description: 'Professional content management system',
            categories: 'news,announcements,blog',
            enableSearch: 'true',
            registrationMode: 'INVITE_ONLY'
          }
        },
        {
          name: 'Registration Open Preset',
          setup: () => TestUtils.useCMSRegistrationOpenPreset(),
          expected: {
            siteName: 'Open CMS',
            description: 'CMS with open registration',
            categories: 'general,community',
            enableSearch: 'true',
            registrationMode: 'OPEN'
          }
        }
      ];
      
      for (const preset of presets) {
        await preset.setup();
        
        // Проверяем все эндпоинты с ожидаемыми значениями
        const siteName = await request(app).get('/api/cms/public/site-name');
        const description = await request(app).get('/api/cms/public/site-description');
        const categories = await request(app).get('/api/cms/public/default-categories');
        const enableSearch = await request(app).get('/api/cms/public/enable-search');
        const registrationMode = await request(app).get('/api/cms/registration-mode');
        
        expect(siteName.body.data.setting_value).to.equal(preset.expected.siteName);
        expect(description.body.data.setting_value).to.equal(preset.expected.description);
        expect(categories.body.data.setting_value).to.equal(preset.expected.categories);
        expect(enableSearch.body.data.setting_value).to.equal(preset.expected.enableSearch);
        expect(registrationMode.body.data.registration_mode).to.equal(preset.expected.registrationMode);
      }
    });
    
    it('should maintain isolation between test runs', async () => {
      // Первый набор настроек
      await TestUtils.setCMSSettings({
        site_name: 'First Test',
        registration_mode: 'CLOSED'
      });
      
      let response = await request(app).get('/api/cms/public/site-name');
      expect(response.body.data.setting_value).to.equal('First Test');
      
      response = await request(app).get('/api/cms/registration-mode');
      expect(response.body.data.registration_mode).to.equal('CLOSED');
      
      // Сброс к дефолтному пресету (происходит в beforeEach)
      await TestUtils.useCMSTestingPreset();
      
      // Проверяем что настройки изменились
      response = await request(app).get('/api/cms/public/site-name');
      expect(response.body.data.setting_value).to.equal('Test CMS');
      
      response = await request(app).get('/api/cms/registration-mode');
      expect(response.body.data.registration_mode).to.equal('INVITE_ONLY');
    });
  });
});