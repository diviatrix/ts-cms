import request from 'supertest';
import { expect } from 'chai';
import app from '../src/expressapi';
import { createAndLoginTestUser, generateTestUser, cleanupTestUser } from './helpers/test-utils';

describe('Profile API', () => {
  let testUser: any;

  beforeEach(async () => {
    // Create and login a test user for each test
    const userData = generateTestUser('profile');
    testUser = await createAndLoginTestUser(userData);
  });

  afterEach(async () => {
    // Clean up test user
    if (testUser?.id) {
      await cleanupTestUser(testUser.id);
    }
  });

  describe('GET /api/profile', () => {
    it('should get user profile with valid authentication', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data).to.be.an('object');
      expect(response.body.data).to.have.property('user_id', testUser.id);
      expect(response.body.data).to.have.property('public_name');
      expect(response.body.data).to.have.property('bio');
      expect(response.body.data).to.have.property('profile_picture_url');
    });

    it('should reject profile access without authentication', async () => {
      const response = await request(app)
        .get('/api/profile');

      expect(response.statusCode).to.equal(401);
      expect(response.body.success).to.be.false;
    });

    it('should reject profile access with invalid token', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.statusCode).to.equal(401);
      expect(response.body.success).to.be.false;
    });
  });

  describe('PUT /api/profile', () => {
    it('should update profile with valid data', async () => {
      const updateData = {
        public_name: 'Updated Test User',
        bio: 'Updated bio for testing'
      };

      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(updateData);

      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('updated successfully');

      // Verify the update
      const verifyResponse = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(verifyResponse.body.data.public_name).to.equal(updateData.public_name);
      expect(verifyResponse.body.data.bio).to.equal(updateData.bio);
    });

    it('should update only public_name when bio is not provided', async () => {
      const updateData = {
        public_name: 'Name Only Update'
      };

      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(updateData);

      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.be.true;

      // Verify the update
      const verifyResponse = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(verifyResponse.body.data.public_name).to.equal(updateData.public_name);
    });

    it('should update only bio when public_name is not provided', async () => {
      const updateData = {
        bio: 'Bio only update for testing'
      };

      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(updateData);

      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.be.true;

      // Verify the update
      const verifyResponse = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(verifyResponse.body.data.bio).to.equal(updateData.bio);
    });

    it('should reject update with no fields provided', async () => {
      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({});

      expect(response.statusCode).to.equal(422);
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.include('At least one field');
    });

    it('should reject update without authentication', async () => {
      const updateData = {
        public_name: 'Unauthorized Update'
      };

      const response = await request(app)
        .put('/api/profile')
        .send(updateData);

      expect(response.statusCode).to.equal(401);
      expect(response.body.success).to.be.false;
    });
  });

  describe('POST /api/profile', () => {
    it('should update profile using POST with nested structure', async () => {
      const updateData = {
        profile: {
          public_name: 'POST Updated User',
          bio: 'POST updated bio',
          profile_picture_url: '/img/test-avatar.png'
        }
      };

      const response = await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(updateData);

      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('updated successfully');

      // Verify the update
      const verifyResponse = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(verifyResponse.body.data.public_name).to.equal('POST Updated User');
      expect(verifyResponse.body.data.bio).to.equal('POST updated bio');
      expect(verifyResponse.body.data.profile_picture_url).to.equal('/img/test-avatar.png');
    });

    it('should reject POST update without authentication', async () => {
      const updateData = {
        profile: {
          public_name: 'Unauthorized POST Update'
        }
      };

      const response = await request(app)
        .post('/api/profile')
        .send(updateData);

      expect(response.statusCode).to.equal(401);
      expect(response.body.success).to.be.false;
    });

    it('should handle empty profile object in POST request', async () => {
      const updateData = {
        profile: {}
      };

      const response = await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(updateData);

      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.be.true;
    });
  });
});
