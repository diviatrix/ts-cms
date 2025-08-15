import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';
import { TestUtils } from './helpers/test-utils';

describe('CMS Settings Test Helper', () => {
  before(async function() {
    this.timeout(10000);
    await TestUtils.backupCMSSettings();
  });

  after(async function() {
    this.timeout(10000);
    await TestUtils.restoreCMSSettings();
  });

  describe('Basic Operations', () => {
    it('should set and get a CMS setting', async function() {
      this.timeout(5000);
      
      const testKey = 'test_setting';
      const testValue = 'test_value';
      
      await TestUtils.setCMSSetting(testKey, testValue, 'string');
      
      const setting = await TestUtils.getCMSSetting(testKey);
      expect(setting.setting_key).to.equal(testKey);
      expect(setting.setting_value).to.equal(testValue);
      expect(setting.setting_type).to.equal('string');
    });

    it('should set multiple CMS settings', async function() {
      this.timeout(5000);
      
      const settings = {
        test_string: 'string_value',
        test_number: 42,
        test_boolean: true,
        test_json: { key: 'value', array: [1, 2, 3] }
      };
      
      await TestUtils.setCMSSettings(settings);
      
      // Проверяем каждую настройку
      const stringValue = await TestUtils.getCMSSettingValue<string>('test_string');
      const numberValue = await TestUtils.getCMSSettingValue<number>('test_number');
      const booleanValue = await TestUtils.getCMSSettingValue<boolean>('test_boolean');
      const jsonValue = await TestUtils.getCMSSettingValue<object>('test_json');
      
      expect(stringValue).to.equal('string_value');
      expect(numberValue).to.equal(42);
      expect(booleanValue).to.equal(true);
      expect(jsonValue).to.deep.equal({ key: 'value', array: [1, 2, 3] });
    });

    it('should verify CMS settings', async function() {
      this.timeout(5000);
      
      await TestUtils.setCMSSetting('verification_test', 'test_value');
      
      const isCorrect = await TestUtils.verifyCMSSetting('verification_test', 'test_value', 'string');
      expect(isCorrect).to.equal(true);
      
      const isIncorrect = await TestUtils.verifyCMSSetting('verification_test', 'wrong_value', 'string');
      expect(isIncorrect).to.equal(false);
    });
  });

  describe('Presets', () => {
    it('should apply testing preset', async function() {
      this.timeout(5000);
      
      await TestUtils.useCMSTestingPreset();
      
      const siteName = await TestUtils.getCMSSettingValue<string>('site_name');
      const maintenanceMode = await TestUtils.getCMSSettingValue<boolean>('maintenance_mode');
      const paginationSize = await TestUtils.getCMSSettingValue<number>('pagination_size');
      
      expect(siteName).to.equal('Test CMS');
      expect(maintenanceMode).to.equal(false);
      expect(paginationSize).to.equal(5);
    });

    it('should apply registration open preset', async function() {
      this.timeout(5000);
      
      await TestUtils.useCMSRegistrationOpenPreset();
      
      const registrationMode = await TestUtils.getCMSSettingValue<string>('registration_mode');
      const allowRegistration = await TestUtils.getCMSSettingValue<boolean>('allow_registration');
      
      expect(registrationMode).to.equal('OPEN');
      expect(allowRegistration).to.equal(true);
    });

    it('should apply maintenance preset', async function() {
      this.timeout(5000);
      
      await TestUtils.useCMSMaintenancePreset();
      
      const maintenanceMode = await TestUtils.getCMSSettingValue<boolean>('maintenance_mode');
      const allowRegistration = await TestUtils.getCMSSettingValue<boolean>('allow_registration');
      const enableSearch = await TestUtils.getCMSSettingValue<boolean>('enable_search');
      
      expect(maintenanceMode).to.equal(true);
      expect(allowRegistration).to.equal(false);
      expect(enableSearch).to.equal(false);
    });

    it('should create and apply custom preset', async function() {
      this.timeout(5000);
      
      const customSettings = {
        site_name: 'Custom Test Site',
        pagination_size: 7,
        enable_feature_x: true
      };
      
      await TestUtils.createCustomCMSPreset('Custom Test', customSettings);
      
      const siteName = await TestUtils.getCMSSettingValue<string>('site_name');
      const paginationSize = await TestUtils.getCMSSettingValue<number>('pagination_size');
      const featureX = await TestUtils.getCMSSettingValue<boolean>('enable_feature_x');
      
      expect(siteName).to.equal('Custom Test Site');
      expect(paginationSize).to.equal(7);
      expect(featureX).to.equal(true);
    });
  });

  describe('Category Operations', () => {
    it('should get settings by category', async function() {
      this.timeout(5000);
      
      const generalSettings = await TestUtils.getCMSSettingsByCategory('general');
      const securitySettings = await TestUtils.getCMSSettingsByCategory('security');
      
      expect(generalSettings).to.be.an('array');
      expect(securitySettings).to.be.an('array');
      
      // Проверяем, что все настройки имеют правильную категорию
      generalSettings.forEach(setting => {
        expect(setting.category).to.equal('general');
      });
      
      securitySettings.forEach(setting => {
        expect(setting.category).to.equal('security');
      });
    });
  });

  describe('Reset Functionality', () => {
    it('should reset settings to defaults', async function() {
      this.timeout(10000);
      
      // Изменяем несколько настроек
      await TestUtils.setCMSSettings({
        site_name: 'Modified Site',
        pagination_size: 999,
        maintenance_mode: true
      });
      
      // Сбрасываем к дефолтам
      await TestUtils.resetCMSSettingsToDefaults();
      
      // Проверяем, что настройки сброшены
      const siteName = await TestUtils.getCMSSettingValue<string>('site_name');
      const paginationSize = await TestUtils.getCMSSettingValue<number>('pagination_size');
      const maintenanceMode = await TestUtils.getCMSSettingValue<boolean>('maintenance_mode');
      
      expect(siteName).to.equal('TypeScript CMS');
      expect(paginationSize).to.equal(10);
      expect(maintenanceMode).to.equal(false);
    });
  });

  describe('Logging', () => {
    it('should enable and disable logging', () => {
      // Просто проверяем, что методы работают без ошибок
      TestUtils.enableCMSSettingsLogging(true);
      TestUtils.enableCMSSettingsLogging(false);
    });
  });
});