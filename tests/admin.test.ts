import request from 'supertest';
import { expect } from 'chai';
import app from '../src/expressapi';
import { createAndLoginTestUser, generateTestUser, cleanupTestUser, createTestUser, loginTestUser } from './helpers/test-utils';
import db from '../src/db';

// Add helper to assign admin role to a user
async function ensureAdminRole(userId: string) {
  // Add user to admin group if not already
  await db.addUserToGroup(userId, 'admin');
}

describe('Admin API', () => {
  let adminUser: any;
  let regularUser: any;

  beforeEach(async () => {
    // Create the admin user (register only)
    const firstUserData = generateTestUser('firstuser');
    adminUser = await createTestUser(firstUserData); // Only register, do not login yet
    await ensureAdminRole(adminUser.id); // Assign admin role before login
    adminUser = await loginTestUser(adminUser); // Now login, get token with admin role

    // Create a second user (will be a regular user, not admin)
    const regularUserData = generateTestUser('regular');
    regularUser = await createAndLoginTestUser(regularUserData);
  });

  afterEach(async () => {
    // Clean up both users
    if (adminUser?.id) {
      await cleanupTestUser(adminUser.id);
    }
    if (regularUser?.id) {
      await cleanupTestUser(regularUser.id);
    }
  });

  describe('GET /api/admin/users', () => {
    it('should require authentication for admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/users');

      expect(response.statusCode).to.equal(401);
      expect(response.body.success).to.be.false;
    });

    // Note: This test expects 403 since regular users don't have admin privileges
    it('should reject admin access for non-admin users', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${regularUser.token}`);

      // Regular users should get 403 Forbidden - this indicates proper access control
      expect(response.statusCode).to.equal(403);
      // The response might not have a success field, so check if it exists
      if (response.body.success !== undefined) {
        expect(response.body.success).to.be.false;
      }
      console.log('✅ Access control working correctly - non-admin user denied access');
    });

    it('should allow admin access for admin users', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminUser.token}`);

      // Admin users should get 200 OK
      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.be.true;
      // The API returns nested data structure: response.body.data.data contains the actual user array
      expect(response.body.data).to.have.property('data');
      expect(response.body.data.data).to.be.an('array');
      console.log('✅ Admin access working correctly - admin user granted access');
    });
  });
});
