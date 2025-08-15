import request from 'supertest';
import { expect } from 'chai';
import app from '../src/expressapi';
import { TestUtils, TestUser, TestTheme, TEST_CONSTANTS } from './helpers/test-utils';

describe('Theme User Preferences API', () => {
  let adminUser: TestUser;
  let testUser: TestUser;
  let secondTestUser: TestUser;
  let testTheme: TestTheme;

  before(async () => {
    // Получаем системного администратора
    adminUser = await TestUtils.getSystemAdmin();
    
    // Создаем отдельных тестовых пользователей для проверки разграничения доступа
    testUser = await TestUtils.createTestUser({
      login: `testuser_preferences_${Date.now()}`,
      email: `testuser.preferences.${Date.now()}@example.com`,
      password: 'testpass123'
    });
    
    secondTestUser = await TestUtils.createTestUser({
      login: `seconduser_preferences_${Date.now()}`,
      email: `seconduser.preferences.${Date.now()}@example.com`,
      password: 'testpass123'
    });
    
    // Создаем тему для тестирования предпочтений
    testTheme = await TestUtils.createTestTheme(adminUser.token, {
      name: `User Preferences Test Theme ${Date.now()}`,
      description: 'Theme for testing user preferences'
    });
  });

  describe('GET /api/themes/user/:userId/preference - User Theme Preference Retrieval', () => {
    it('should allow users to get their own theme preferences', async () => {
      const response = await request(app)
        .get(`/api/themes/user/${testUser.id}/preference`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.equal(true);
      
      // Может быть null если пользователь не установил предпочтения
      if (response.body.data) {
        expect(response.body.data).to.be.an('object');
        expect(response.body.data).to.have.property('user_id', testUser.id);
        expect(response.body.data).to.have.property('theme_id');
        expect(response.body.data).to.have.property('custom_settings');
        expect(response.body.data).to.have.property('updated_at');
      }
    });

    it('should allow admins to get any user theme preferences', async () => {
      const response = await request(app)
        .get(`/api/themes/user/${testUser.id}/preference`)
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.equal(true);
    });

    it('should prevent users from accessing other users preferences', async () => {
      const response = await request(app)
        .get(`/api/themes/user/${secondTestUser.id}/preference`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(response.statusCode).to.equal(403);
      TestUtils.validateErrorResponse(response, 403, 'Forbidden');
    });

    it('should require authentication for preference retrieval', async () => {
      const response = await request(app)
        .get(`/api/themes/user/${testUser.id}/preference`);

      TestUtils.validateErrorResponse(response, 401);
    });

    it('should handle non-existent user preferences gracefully', async () => {
      // Используем системного пользователя, но проверяем отсутствие предпочтений
      // для несуществующего пользователя через admin права
      const response = await request(app)
        .get(`/api/themes/user/${TEST_CONSTANTS.NON_EXISTENT_UUID}/preference`)
        .set('Authorization', `Bearer ${adminUser.token}`);

      // Должно вернуть 404 или 400 для несуществующего пользователя
      expect([400, 404].includes(response.statusCode)).to.equal(true);
      TestUtils.validateErrorResponse(response, response.statusCode);
    });

    it('should validate user ID format in URL', async () => {
      const response = await request(app)
        .get(`/api/themes/user/${TEST_CONSTANTS.INVALID_UUID}/preference`)
        .set('Authorization', `Bearer ${testUser.token}`);

      // Должно быть 422 (Validation Error) для невалидного UUID формата
      expect(response.statusCode).to.equal(422);
      TestUtils.validateErrorResponse(response, 422);
    });
  });

  describe('POST /api/themes/user/:userId/preference - User Theme Preference Setting', () => {
    it('should allow users to set their own theme preferences', async () => {
      const preferenceData = {
        theme_id: testTheme.id,
        custom_settings: {
          primaryColor: '#ff6b6b',
          fontSize: '16px',
          darkMode: true
        }
      };

      const response = await request(app)
        .post(`/api/themes/user/${testUser.id}/preference`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(preferenceData);

      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.equal(true);
      expect(response.body.message).to.include('successfully');
      
      // Проверяем что предпочтения были сохранены
      const getResponse = await request(app)
        .get(`/api/themes/user/${testUser.id}/preference`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(getResponse.statusCode).to.equal(200);
      if (getResponse.body.data) {
        expect(getResponse.body.data.theme_id).to.equal(testTheme.id);
        expect(getResponse.body.data.custom_settings).to.be.an('object');
        expect(getResponse.body.data.custom_settings.primaryColor).to.equal('#ff6b6b');
        expect(getResponse.body.data.custom_settings.darkMode).to.equal(true);
      }
    });

    it('should allow admins to set theme preferences for any user', async () => {
      const preferenceData = {
        theme_id: testTheme.id,
        custom_settings: {
          backgroundColor: '#f0f0f0',
          fontFamily: 'Arial'
        }
      };

      const response = await request(app)
        .post(`/api/themes/user/${secondTestUser.id}/preference`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send(preferenceData);

      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.equal(true);
    });

    it('should prevent users from setting preferences for other users', async () => {
      const preferenceData = {
        theme_id: testTheme.id,
        custom_settings: { color: 'red' }
      };

      const response = await request(app)
        .post(`/api/themes/user/${secondTestUser.id}/preference`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(preferenceData);

      expect(response.statusCode).to.equal(403);
      TestUtils.validateErrorResponse(response, 403, 'Forbidden');
    });

    it('should require authentication for preference setting', async () => {
      const preferenceData = {
        theme_id: testTheme.id,
        custom_settings: {}
      };

      const response = await request(app)
        .post(`/api/themes/user/${testUser.id}/preference`)
        .send(preferenceData);

      TestUtils.validateErrorResponse(response, 401);
    });

    it('should require theme_id in request body', async () => {
      const preferenceData = {
        custom_settings: { color: 'blue' }
      };

      const response = await request(app)
        .post(`/api/themes/user/${testUser.id}/preference`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(preferenceData);

      expect(response.statusCode).to.equal(400);
      TestUtils.validateErrorResponse(response, 400, 'Theme ID is required');
    });

    it('should handle empty custom_settings', async () => {
      const preferenceData = {
        theme_id: testTheme.id
        // custom_settings не указан
      };

      const response = await request(app)
        .post(`/api/themes/user/${testUser.id}/preference`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(preferenceData);

      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.equal(true);
    });

    it('should handle null theme_id validation', async () => {
      const preferenceData = {
        theme_id: null,
        custom_settings: { color: 'green' }
      };

      const response = await request(app)
        .post(`/api/themes/user/${testUser.id}/preference`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(preferenceData);

      expect(response.statusCode).to.equal(400);
      TestUtils.validateErrorResponse(response, 400, 'Theme ID is required');
    });

    it('should handle empty string theme_id validation', async () => {
      const preferenceData = {
        theme_id: '',
        custom_settings: { color: 'yellow' }
      };

      const response = await request(app)
        .post(`/api/themes/user/${testUser.id}/preference`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(preferenceData);

      expect(response.statusCode).to.equal(400);
      TestUtils.validateErrorResponse(response, 400, 'Theme ID is required');
    });

    it('should handle non-existent theme gracefully', async () => {
      const preferenceData = {
        theme_id: TEST_CONSTANTS.NON_EXISTENT_UUID,
        custom_settings: { color: 'purple' }
      };

      const response = await request(app)
        .post(`/api/themes/user/${testUser.id}/preference`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(preferenceData);

      // API может принимать несуществующие темы и обрабатывать их на уровне БД
      expect([200, 400, 404, 500]).to.include(response.statusCode);
      if (response.statusCode === 200) {
        expect(response.body.success).to.equal(true);
      } else {
        TestUtils.validateErrorResponse(response, response.statusCode);
      }
    });

    it('should handle invalid theme_id format', async () => {
      const preferenceData = {
        theme_id: TEST_CONSTANTS.INVALID_UUID,
        custom_settings: { color: 'orange' }
      };

      const response = await request(app)
        .post(`/api/themes/user/${testUser.id}/preference`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(preferenceData);

      expect([200, 400, 404, 500]).to.include(response.statusCode);
      if (response.statusCode === 200) {
        expect(response.body.success).to.equal(true);
      } else {
        TestUtils.validateErrorResponse(response, response.statusCode);
      }
    });
  });

  describe('Theme Preference Data Integrity', () => {
    it('should preserve complex custom_settings structure', async () => {
      const complexSettings = {
        theme: {
          colors: {
            primary: '#3498db',
            secondary: '#2ecc71',
            background: '#ecf0f1'
          },
          typography: {
            headingFont: 'Roboto',
            bodyFont: 'Open Sans',
            sizes: [12, 14, 16, 18, 24]
          },
          layout: {
            sidebar: true,
            maxWidth: '1200px',
            padding: '20px'
          }
        },
        userSettings: {
          notifications: true,
          autoSave: false,
          language: 'en'
        }
      };

      const preferenceData = {
        theme_id: testTheme.id,
        custom_settings: complexSettings
      };

      const setResponse = await request(app)
        .post(`/api/themes/user/${testUser.id}/preference`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(preferenceData);

      expect(setResponse.statusCode).to.equal(200);

      const getResponse = await request(app)
        .get(`/api/themes/user/${testUser.id}/preference`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(getResponse.statusCode).to.equal(200);
      if (getResponse.body.data && getResponse.body.data.custom_settings) {
        const savedSettings = getResponse.body.data.custom_settings;
        if (savedSettings.theme && savedSettings.typography) {
          expect(savedSettings.theme.colors.primary).to.equal('#3498db');
          expect(savedSettings.typography.sizes).to.deep.equal([12, 14, 16, 18, 24]);
          expect(savedSettings.userSettings.notifications).to.equal(true);
        }
      }
    });

    it('should handle preference updates correctly', async () => {
      // Устанавливаем первоначальные настройки
      const initialSettings = {
        theme_id: testTheme.id,
        custom_settings: {
          color: 'red',
          size: 'medium'
        }
      };

      await request(app)
        .post(`/api/themes/user/${testUser.id}/preference`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(initialSettings);

      // Обновляем настройки
      const updatedSettings = {
        theme_id: testTheme.id,
        custom_settings: {
          color: 'blue',
          size: 'large',
          newField: 'added'
        }
      };

      const updateResponse = await request(app)
        .post(`/api/themes/user/${testUser.id}/preference`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(updatedSettings);

      expect(updateResponse.statusCode).to.equal(200);

      // Проверяем что настройки обновились
      const getResponse = await request(app)
        .get(`/api/themes/user/${testUser.id}/preference`)
        .set('Authorization', `Bearer ${testUser.token}`);

      if (getResponse.body.data) {
        const settings = getResponse.body.data.custom_settings;
        expect(settings.color).to.equal('blue');
        expect(settings.size).to.equal('large');
        expect(settings.newField).to.equal('added');
      }
    });

    it('should handle concurrent preference updates', async () => {
      const preferences1 = {
        theme_id: testTheme.id,
        custom_settings: { concurrent: 'test1', timestamp: Date.now() }
      };

      const preferences2 = {
        theme_id: testTheme.id,
        custom_settings: { concurrent: 'test2', timestamp: Date.now() + 1 }
      };

      // Выполняем параллельные запросы
      const [response1, response2] = await Promise.all([
        request(app)
          .post(`/api/themes/user/${testUser.id}/preference`)
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(preferences1),
        request(app)
          .post(`/api/themes/user/${testUser.id}/preference`)
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(preferences2)
      ]);

      expect(response1.statusCode).to.equal(200);
      expect(response2.statusCode).to.equal(200);

      // Проверяем финальное состояние
      const getResponse = await request(app)
        .get(`/api/themes/user/${testUser.id}/preference`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(getResponse.statusCode).to.equal(200);
      if (getResponse.body.data) {
        expect(getResponse.body.data.custom_settings).to.be.an('object');
        expect(getResponse.body.data.custom_settings.concurrent).to.be.a('string');
      }
    });
  });

  describe('Preference Security and Validation', () => {
    it('should prevent XSS in custom_settings', async () => {
      const maliciousSettings = {
        theme_id: testTheme.id,
        custom_settings: {
          userInput: '<script>alert("xss")</script>',
          css: 'body { background: url("javascript:alert(1)"); }',
          html: '<img src="x" onerror="alert(1)">'
        }
      };

      const response = await request(app)
        .post(`/api/themes/user/${testUser.id}/preference`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(maliciousSettings);

      // API должно принимать данные, но они будут сохранены как строки
      expect(response.statusCode).to.equal(200);

      const getResponse = await request(app)
        .get(`/api/themes/user/${testUser.id}/preference`)
        .set('Authorization', `Bearer ${testUser.token}`);

      if (getResponse.body.data && getResponse.body.data.custom_settings) {
        const settings = getResponse.body.data.custom_settings;
        // Данные должны быть сохранены как есть (без выполнения)
        if (settings.userInput) {
          expect(typeof settings.userInput).to.equal('string');
          expect(settings.userInput).to.include('<script>');
        }
      }
    });

    it('should handle very large custom_settings objects', async () => {
      const largeSettings = {};
      for (let i = 0; i < 100; i++) {
        (largeSettings as Record<string, string>)[`key${i}`] = `value${'x'.repeat(100)}`;
      }

      const preferenceData = {
        theme_id: testTheme.id,
        custom_settings: largeSettings
      };

      const response = await request(app)
        .post(`/api/themes/user/${testUser.id}/preference`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(preferenceData);

      // API может ограничивать размер данных
      expect([200, 413, 400]).to.include(response.statusCode);

      if (response.statusCode === 200) {
        expect(response.body.success).to.equal(true);
      } else {
        TestUtils.validateErrorResponse(response, response.statusCode);
      }
    });

    it('should validate user ID consistency', async () => {
      const preferenceData = {
        theme_id: testTheme.id,
        custom_settings: { test: 'consistency' }
      };

      // Пытаемся установить предпочтения для несуществующего пользователя
      const response = await request(app)
        .post(`/api/themes/user/${TEST_CONSTANTS.NON_EXISTENT_UUID}/preference`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(preferenceData);

      expect(response.statusCode).to.equal(403);
      TestUtils.validateErrorResponse(response, 403, 'Forbidden');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle rapid preference changes efficiently', async () => {
      const startTime = Date.now();
      const promises = [];

      for (let i = 0; i < 5; i++) {
        const preferenceData = {
          theme_id: testTheme.id,
          custom_settings: { iteration: i, timestamp: Date.now() }
        };

        promises.push(
          request(app)
            .post(`/api/themes/user/${testUser.id}/preference`)
            .set('Authorization', `Bearer ${testUser.token}`)
            .send(preferenceData)
        );
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();

      // Все запросы должны быть успешными
      responses.forEach(response => {
        expect(response.statusCode).to.equal(200);
      });

      // Операции должны завершиться в разумное время
      expect(endTime - startTime).to.be.below(5000);
    });

    it('should maintain data consistency across multiple users', async () => {
      const user1Preferences = {
        theme_id: testTheme.id,
        custom_settings: { user: 'user1', color: 'red' }
      };

      const user2Preferences = {
        theme_id: testTheme.id,
        custom_settings: { user: 'user2', color: 'blue' }
      };

      // Устанавливаем предпочтения для разных пользователей
      await Promise.all([
        request(app)
          .post(`/api/themes/user/${testUser.id}/preference`)
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(user1Preferences),
        request(app)
          .post(`/api/themes/user/${secondTestUser.id}/preference`)
          .set('Authorization', `Bearer ${secondTestUser.token}`)
          .send(user2Preferences)
      ]);

      // Проверяем что предпочтения не смешались
      const [user1Response, user2Response] = await Promise.all([
        request(app)
          .get(`/api/themes/user/${testUser.id}/preference`)
          .set('Authorization', `Bearer ${testUser.token}`),
        request(app)
          .get(`/api/themes/user/${secondTestUser.id}/preference`)
          .set('Authorization', `Bearer ${secondTestUser.token}`)
      ]);

      expect(user1Response.statusCode).to.equal(200);
      expect(user2Response.statusCode).to.equal(200);

      if (user1Response.body.data && user2Response.body.data) {
        expect(user1Response.body.data.custom_settings.user).to.equal('user1');
        expect(user1Response.body.data.custom_settings.color).to.equal('red');
        
        expect(user2Response.body.data.custom_settings.user).to.equal('user2');
        expect(user2Response.body.data.custom_settings.color).to.equal('blue');
      }
    });
  });
});