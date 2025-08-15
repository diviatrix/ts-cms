import request from 'supertest';
import { expect } from 'chai';
import app from '../src/expressapi';
import { TestUtils, TEST_CONSTANTS, TestUser } from './helpers/test-utils';

describe('Authentication API', () => {
  // Настройка автоматической очистки для всех тестов в этом файле
  before(async function() {
    this.timeout(30000);
    console.log('🧹 [Auth Tests] Настройка автоматической очистки');
    TestUtils.setupTestCleanup();
  });

  // Очистка после каждого теста
  afterEach(async function() {
    this.timeout(15000);
    try {
      console.log(`🧹 [Auth Tests] Очистка после теста: ${this.currentTest?.title}`);
      await TestUtils.quickCleanup({
        users: true,
        invites: true,
        settings: false // Сохраняем настройки между тестами
      });
    } catch (error) {
      console.warn('⚠️ [Auth Tests] Ошибка очистки:', error);
    }
  });
  describe('POST /api/register', () => {
    it('should register a new user successfully with valid invite code', async () => {
      const userData = {
        login: TestUtils.generateRandomData().randomString(),
        email: TestUtils.generateRandomData().randomEmail(),
        password: 'validpass123'
      };

      // Получаем инвайт-код
      const inviteCode = await TestUtils.createInviteCode();

      const response = await request(app)
        .post(TEST_CONSTANTS.API_ENDPOINTS.REGISTER)
        .send({
          ...userData,
          inviteCode: inviteCode
        });

      TestUtils.validateApiResponse(response, TEST_CONSTANTS.HTTP_STATUS.CREATED);
      expect(response.body.data).to.have.property('id');
      expect(response.body.data).to.have.property('login', userData.login);
      expect(response.body.data).to.have.property('email', userData.email);
      expect(response.body.data).to.not.have.property('password');
      expect(response.body.message).to.equal('User registered successfully');
    });

    it('should reject registration without invite code', async () => {
      // Устанавливаем режим регистрации только по инвайтам
      await TestUtils.setCMSSetting('registration_mode', 'INVITE_ONLY', 'string');
      
      const userData = {
        login: TestUtils.generateRandomData().randomString(),
        email: TestUtils.generateRandomData().randomEmail(),
        password: 'validpass123'
      };

      const response = await request(app)
        .post(TEST_CONSTANTS.API_ENDPOINTS.REGISTER)
        .send(userData);

      TestUtils.validateErrorResponse(response, TEST_CONSTANTS.HTTP_STATUS.VALIDATION_ERROR, 'invite code is required');
    });

    it('should reject registration with invalid invite code', async () => {
      // Устанавливаем режим регистрации только по инвайтам
      await TestUtils.setCMSSetting('registration_mode', 'INVITE_ONLY', 'string');
      
      const userData = {
        login: TestUtils.generateRandomData().randomString(),
        email: TestUtils.generateRandomData().randomEmail(),
        password: 'validpass123'
      };

      const response = await request(app)
        .post(TEST_CONSTANTS.API_ENDPOINTS.REGISTER)
        .send({
          ...userData,
          inviteCode: 'INVALID_CODE'
        });

      TestUtils.validateErrorResponse(response, TEST_CONSTANTS.HTTP_STATUS.VALIDATION_ERROR, 'Invalid invite code');
    });

    it('should reject registration with invalid login (too short)', async () => {
      const userData = {
        login: 'ab', // слишком короткий
        email: TestUtils.generateRandomData().randomEmail(),
        password: 'validpass123'
      };

      const response = await request(app)
        .post(TEST_CONSTANTS.API_ENDPOINTS.REGISTER)
        .send(userData);

      TestUtils.validateErrorResponse(response, TEST_CONSTANTS.HTTP_STATUS.VALIDATION_ERROR);
    });

    it('should reject registration with invalid email format', async () => {
      const userData = {
        login: TestUtils.generateRandomData().randomString(),
        email: 'invalid-email-format',
        password: 'validpass123'
      };

      const response = await request(app)
        .post(TEST_CONSTANTS.API_ENDPOINTS.REGISTER)
        .send(userData);

      TestUtils.validateErrorResponse(response, TEST_CONSTANTS.HTTP_STATUS.VALIDATION_ERROR);
    });

    it('should reject registration with invalid password (too short)', async () => {
      const userData = {
        login: TestUtils.generateRandomData().randomString(),
        email: TestUtils.generateRandomData().randomEmail(),
        password: '123' // слишком короткий
      };

      const response = await request(app)
        .post(TEST_CONSTANTS.API_ENDPOINTS.REGISTER)
        .send(userData);

      TestUtils.validateErrorResponse(response, TEST_CONSTANTS.HTTP_STATUS.VALIDATION_ERROR);
    });

    it('should reject registration with missing required fields', async () => {
      const response = await request(app)
        .post(TEST_CONSTANTS.API_ENDPOINTS.REGISTER)
        .send({});

      TestUtils.validateErrorResponse(response, TEST_CONSTANTS.HTTP_STATUS.VALIDATION_ERROR);
    });

    it('should reject registration with duplicate login', async () => {
      const userData = {
        login: TestUtils.generateRandomData().randomString(),
        email: TestUtils.generateRandomData().randomEmail(),
        password: 'validpass123'
      };

      // Получаем инвайт-коды
      const inviteCode1 = await TestUtils.createInviteCode();
      const inviteCode2 = await TestUtils.createInviteCode();

      // Первая регистрация
      const firstResponse = await request(app)
        .post(TEST_CONSTANTS.API_ENDPOINTS.REGISTER)
        .send({
          ...userData,
          inviteCode: inviteCode1
        });

      TestUtils.validateApiResponse(firstResponse, TEST_CONSTANTS.HTTP_STATUS.CREATED);

      // Попытка дублирования с другим email но тем же login
      const duplicateResponse = await request(app)
        .post(TEST_CONSTANTS.API_ENDPOINTS.REGISTER)
        .send({
          ...userData,
          email: TestUtils.generateRandomData().randomEmail(),
          inviteCode: inviteCode2
        });

      TestUtils.validateErrorResponse(duplicateResponse, TEST_CONSTANTS.HTTP_STATUS.VALIDATION_ERROR);
    });

    it('should reject registration with duplicate email', async () => {
      const userData = {
        login: TestUtils.generateRandomData().randomString(),
        email: TestUtils.generateRandomData().randomEmail(),
        password: 'validpass123'
      };

      // Получаем инвайт-коды
      const inviteCode1 = await TestUtils.createInviteCode();
      const inviteCode2 = await TestUtils.createInviteCode();

      // Первая регистрация
      const firstResponse = await request(app)
        .post(TEST_CONSTANTS.API_ENDPOINTS.REGISTER)
        .send({
          ...userData,
          inviteCode: inviteCode1
        });

      TestUtils.validateApiResponse(firstResponse, TEST_CONSTANTS.HTTP_STATUS.CREATED);

      // Попытка дублирования с другим login но тем же email
      const duplicateResponse = await request(app)
        .post(TEST_CONSTANTS.API_ENDPOINTS.REGISTER)
        .send({
          ...userData,
          login: TestUtils.generateRandomData().randomString(),
          inviteCode: inviteCode2
        });

      TestUtils.validateErrorResponse(duplicateResponse, TEST_CONSTANTS.HTTP_STATUS.VALIDATION_ERROR);
    });
  });

  describe('POST /api/login', () => {
    let testUser: TestUser;

    beforeEach(async () => {
      // Создаем тестового пользователя через TestUtils (с инвайт-кодом)
      testUser = await TestUtils.createTestUser();
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        login: testUser.login,
        password: testUser.password
      };

      const response = await request(app)
        .post(TEST_CONSTANTS.API_ENDPOINTS.LOGIN)
        .send(loginData);

      TestUtils.validateApiResponse(response, TEST_CONSTANTS.HTTP_STATUS.OK);
      expect(response.body.data).to.have.property('token');
      expect(response.body.data.token).to.be.a('string');
      expect(response.body.data.token.length).to.be.greaterThan(0);
      expect(response.body.message).to.equal('Login successful');
    });

    it('should reject login with invalid username', async () => {
      const loginData = {
        login: 'nonexistent_user',
        password: testUser.password
      };

      const response = await request(app)
        .post(TEST_CONSTANTS.API_ENDPOINTS.LOGIN)
        .send(loginData);

      TestUtils.validateErrorResponse(response, TEST_CONSTANTS.HTTP_STATUS.UNAUTHORIZED, 'Invalid login credentials');
    });

    it('should reject login with invalid password', async () => {
      const loginData = {
        login: testUser.login,
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post(TEST_CONSTANTS.API_ENDPOINTS.LOGIN)
        .send(loginData);

      TestUtils.validateErrorResponse(response, TEST_CONSTANTS.HTTP_STATUS.UNAUTHORIZED, 'Invalid login credentials');
    });

    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post(TEST_CONSTANTS.API_ENDPOINTS.LOGIN)
        .send({});

      TestUtils.validateErrorResponse(response, TEST_CONSTANTS.HTTP_STATUS.VALIDATION_ERROR);
    });

    it('should return valid JWT token that can be used for authenticated requests', async () => {
      const loginData = {
        login: testUser.login,
        password: testUser.password
      };

      const loginResponse = await request(app)
        .post(TEST_CONSTANTS.API_ENDPOINTS.LOGIN)
        .send(loginData);

      TestUtils.validateApiResponse(loginResponse, TEST_CONSTANTS.HTTP_STATUS.OK);
      const token = loginResponse.body.data.token;

      // Проверяем, что токен работает для аутентифицированного запроса
      const profileResponse = await request(app)
        .get(TEST_CONSTANTS.API_ENDPOINTS.PROFILE)
        .set('Authorization', `Bearer ${token}`);

      // Профиль должен возвращаться успешно
      expect(profileResponse.statusCode).to.equal(TEST_CONSTANTS.HTTP_STATUS.OK);
    });
  });

  describe('Authentication Token Validation', () => {
    let testUser: TestUser;
    let validToken: string;

    beforeEach(async () => {
      testUser = await TestUtils.createTestUser();
      if (!testUser.token) {
        throw new Error('Test user token is required but not found');
      }
      validToken = testUser.token;
    });

    it('should reject requests with missing Authorization header', async () => {
      const response = await request(app)
        .get(TEST_CONSTANTS.API_ENDPOINTS.PROFILE);

      TestUtils.validateErrorResponse(response, TEST_CONSTANTS.HTTP_STATUS.UNAUTHORIZED);
    });

    it('should reject requests with invalid token format', async () => {
      const response = await request(app)
        .get(TEST_CONSTANTS.API_ENDPOINTS.PROFILE)
        .set('Authorization', 'invalid-token-format');

      TestUtils.validateErrorResponse(response, TEST_CONSTANTS.HTTP_STATUS.UNAUTHORIZED);
    });

    it('should reject requests with Bearer prefix but invalid token', async () => {
      const response = await request(app)
        .get(TEST_CONSTANTS.API_ENDPOINTS.PROFILE)
        .set('Authorization', 'Bearer invalid.token.here');

      TestUtils.validateErrorResponse(response, TEST_CONSTANTS.HTTP_STATUS.UNAUTHORIZED);
    });

    it('should accept requests with valid Bearer token', async () => {
      const response = await request(app)
        .get(TEST_CONSTANTS.API_ENDPOINTS.PROFILE)
        .set('Authorization', `Bearer ${validToken}`);

      TestUtils.validateApiResponse(response, TEST_CONSTANTS.HTTP_STATUS.OK);
    });
  });
});