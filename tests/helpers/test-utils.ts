import request from 'supertest';
import { expect } from 'chai';
import app from '../../src/expressapi';

export interface TestUser {
  login: string;
  email: string;
  password: string;
  id?: string;
  token?: string;
}

/**
 * Create a test user with registration
 */
export async function createTestUser(userData: Omit<TestUser, 'id' | 'token'>): Promise<TestUser> {
  const response = await request(app)
    .post('/api/register')
    .send(userData);

  if (response.statusCode !== 201) {
    throw new Error(`Failed to create test user: ${response.body.message}`);
  }

  return {
    ...userData,
    id: response.body.data.id
  };
}

/**
 * Login a test user and get authentication token
 */
export async function loginTestUser(user: TestUser): Promise<TestUser> {
  const response = await request(app)
    .post('/api/login')
    .send({
      login: user.login,
      password: user.password
    });

  if (response.statusCode !== 200) {
    throw new Error(`Failed to login test user: ${response.body.message}`);
  }

  return {
    ...user,
    token: response.body.data.token
  };
}

/**
 * Create and login a test user in one step
 */
export async function createAndLoginTestUser(userData: Omit<TestUser, 'id' | 'token'>): Promise<TestUser> {
  const user = await createTestUser(userData);
  return await loginTestUser(user);
}

/**
 * Clean up test user by ID
 */
export async function cleanupTestUser(userId: string): Promise<void> {
  const database = require('../../src/db').default;
  const result = await database.deleteUser(userId);
  
  if (!result.success) {
    console.warn(`Failed to cleanup test user ${userId}: ${result.message}`);
  }
}

/**
 * Clean up multiple test users
 */
export async function cleanupTestUsers(userIds: string[]): Promise<void> {
  const promises = userIds.map(id => cleanupTestUser(id));
  await Promise.all(promises);
}

/**
 * Generate unique test user data
 */
export function generateTestUser(prefix: string = 'test'): Omit<TestUser, 'id' | 'token'> {
  const timestamp = Date.now();
  return {
    login: `${prefix}_user_${timestamp}`,
    email: `${prefix}_${timestamp}@example.com`,
    password: 'password123'
  };
}

/**
 * Common test expectations for API responses
 */
export const expectSuccess = (response: any, expectedData?: any) => {
  expect(response.body.success).to.be.true;
  if (expectedData) {
    expect(response.body.data).to.deep.include(expectedData);
  }
};

export const expectError = (response: any, expectedStatus: number, expectedMessage?: string) => {
  expect(response.statusCode).to.equal(expectedStatus);
  expect(response.body.success).to.be.false;
  if (expectedMessage) {
    expect(response.body.message).to.include(expectedMessage);
  }
};
