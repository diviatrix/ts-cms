import request from 'supertest';
import { expect } from 'chai';
import app from '../src/expressapi';
import { createTestUser, generateTestUser, cleanupTestUser } from './helpers/test-utils';

describe('Authentication API', () => {
  const testUsers: string[] = [];

  afterEach(async () => {
    // Clean up any test users created during tests
    if (testUsers.length > 0) {
      const database = require('../src/db').default;
      for (const userId of testUsers) {
        await database.deleteUser(userId);
      }
      testUsers.length = 0;
    }
  });

  describe('POST /api/register', () => {
    it('should register a new user successfully', async () => {
      const userData = generateTestUser('register');

      const response = await request(app)
        .post('/api/register')
        .send(userData);

      expect(response.statusCode).to.equal(201);
      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('id');
      expect(response.body.data.login).to.equal(userData.login);
      expect(response.body.data.email).to.equal(userData.email);
      expect(response.body.message).to.equal('User registered successfully');

      // Track for cleanup
      testUsers.push(response.body.data.id);
    });

    it('should reject registration with invalid email', async () => {
      const userData = {
        login: 'testuser',
        email: 'invalid-email',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/register')
        .send(userData);

      expect(response.statusCode).to.equal(422);
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Validation failed');
    });

    it('should reject registration with short password', async () => {
      const userData = {
        login: 'testuser',
        email: 'test@example.com',
        password: '123'
      };

      const response = await request(app)
        .post('/api/register')
        .send(userData);

      expect(response.statusCode).to.equal(422);
      expect(response.body.success).to.be.false;
    });

    it('should reject registration with missing fields', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({});

      expect(response.statusCode).to.equal(422);
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Validation failed');
    });

    it('should reject duplicate email registration', async () => {
      const userData = generateTestUser('duplicate');
      
      // Register first user
      const firstResponse = await request(app)
        .post('/api/register')
        .send(userData);

      expect(firstResponse.statusCode).to.equal(201);
      testUsers.push(firstResponse.body.data.id);

      // Try to register with same email
      const duplicateUserData = {
        login: 'different_login',
        email: userData.email, // Same email
        password: 'password123'
      };

      const duplicateResponse = await request(app)
        .post('/api/register')
        .send(duplicateUserData);

      expect(duplicateResponse.statusCode).to.equal(422);
      expect(duplicateResponse.body.success).to.be.false;
      expect(duplicateResponse.body.message).to.include('failed');
    });
  });

  describe('POST /api/login', () => {
    let testUser: any;

    beforeEach(async () => {
      // Create a test user for login tests
      const userData = generateTestUser('login');
      testUser = await createTestUser(userData);
      testUsers.push(testUser.id);
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          login: testUser.login,
          password: testUser.password
        });

      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('token');
      expect(response.body.message).to.equal('Login successful');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          login: testUser.login,
          password: 'wrongpassword'
        });

      expect(response.statusCode).to.equal(401);
      expect(response.body.success).to.be.false;
    });

    it('should reject login with non-existent user', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          login: 'nonexistent_user',
          password: 'password123'
        });

      expect(response.statusCode).to.equal(401);
      expect(response.body.success).to.be.false;
    });

    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({});

      expect(response.statusCode).to.equal(422);
      expect(response.body.success).to.be.false;
    });
  });
});
