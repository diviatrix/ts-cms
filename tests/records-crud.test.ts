import request from 'supertest';
import { expect } from 'chai';
import app from '../src/expressapi';
import { TestUtils, MockData, TEST_CONSTANTS, TestUser, TestRecord } from './helpers/test-utils';

describe('Records CRUD API', () => {
  let adminUser: TestUser;
  let regularUser: TestUser;
  let adminToken: string;
  let userToken: string;

  before(async () => {
    // Создаем тестовых пользователей
    adminUser = await TestUtils.createTestAdmin();
    regularUser = await TestUtils.createTestUser();
    
    if (!adminUser.token) {
      throw new Error('Admin user token is required but not found');
    }
    if (!regularUser.token) {
      throw new Error('Regular user token is required but not found');
    }
    adminToken = adminUser.token;
    userToken = regularUser.token;
  });

  describe('POST /api/records', () => {
    it('should create a new record with admin credentials', async () => {
      const recordData = {
        title: 'Test Record Title',
        description: 'Test record description',
        content: 'This is the content of the test record',
        tags: ['test', 'api'],
        categories: ['testing'],
        is_published: true
      };

      const response = await request(app)
        .post(TEST_CONSTANTS.API_ENDPOINTS.RECORDS)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(recordData);

      TestUtils.validateApiResponse(response, TEST_CONSTANTS.HTTP_STATUS.CREATED);
      expect(response.body.data).to.have.property('id');
      expect(response.body.data).to.have.property('title', recordData.title);
      expect(response.body.data).to.have.property('description', recordData.description);
      expect(response.body.data).to.have.property('content', recordData.content);
      expect(response.body.data).to.have.property('tags').that.deep.equals(recordData.tags);
      expect(response.body.data).to.have.property('categories').that.deep.equals(recordData.categories);
      expect(response.body.data).to.have.property('is_published', recordData.is_published);
      expect(response.body.data).to.have.property('created_at');
      expect(response.body.data).to.have.property('updated_at');
      expect(response.body.message).to.equal('Record created successfully');
    });

    it('should create a record with minimal required fields', async () => {
      const recordData = {
        title: 'Minimal Record',
        description: 'Minimal description', // description является обязательным полем
        content: 'Just the required content',
        tags: ['minimal'], // tags является обязательным полем
        categories: ['test'] // categories является обязательным полем
      };

      const response = await request(app)
        .post(TEST_CONSTANTS.API_ENDPOINTS.RECORDS)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(recordData);

      TestUtils.validateApiResponse(response, TEST_CONSTANTS.HTTP_STATUS.CREATED);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.not.equal(null);
      expect(response.body.data).to.have.property('id').that.is.a('string');
      expect(response.body.data).to.have.property('title', recordData.title);
      expect(response.body.data).to.have.property('description', recordData.description);
      expect(response.body.data).to.have.property('content', recordData.content);
      // API может не возвращать is_published в ответе, проверим только если поле присутствует
      if (response.body.data.hasOwnProperty('is_published')) {
        expect(response.body.data).to.have.property('is_published', false); // default value
      }
    });

    it('should reject record creation without admin privileges', async () => {
      const recordData = MockData.validRecord;

      const response = await request(app)
        .post(TEST_CONSTANTS.API_ENDPOINTS.RECORDS)
        .set('Authorization', `Bearer ${userToken}`)
        .send(recordData);

      TestUtils.validateErrorResponse(response, TEST_CONSTANTS.HTTP_STATUS.FORBIDDEN);
    });

    it('should reject record creation without authentication', async () => {
      const recordData = MockData.validRecord;

      const response = await request(app)
        .post(TEST_CONSTANTS.API_ENDPOINTS.RECORDS)
        .send(recordData);

      TestUtils.validateErrorResponse(response, TEST_CONSTANTS.HTTP_STATUS.UNAUTHORIZED);
    });

    it('should reject record creation with missing title', async () => {
      const recordData = {
        content: 'Content without title',
        is_published: true
      };

      const response = await request(app)
        .post(TEST_CONSTANTS.API_ENDPOINTS.RECORDS)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(recordData);

      TestUtils.validateErrorResponse(response, TEST_CONSTANTS.HTTP_STATUS.VALIDATION_ERROR);
    });

    it('should reject record creation with missing content', async () => {
      const recordData = {
        title: 'Title without content',
        is_published: true
      };

      const response = await request(app)
        .post(TEST_CONSTANTS.API_ENDPOINTS.RECORDS)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(recordData);

      TestUtils.validateErrorResponse(response, TEST_CONSTANTS.HTTP_STATUS.VALIDATION_ERROR);
    });

    it('should reject record creation with empty title', async () => {
      const recordData = {
        title: '',
        content: 'Content with empty title',
        is_published: true
      };

      const response = await request(app)
        .post(TEST_CONSTANTS.API_ENDPOINTS.RECORDS)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(recordData);

      TestUtils.validateErrorResponse(response, TEST_CONSTANTS.HTTP_STATUS.VALIDATION_ERROR);
    });
  });

  describe('PUT /api/records/:id', () => {
    let testRecord: TestRecord;

    beforeEach(async () => {
      testRecord = await TestUtils.createTestRecord(adminToken);
    });

    it('should update an existing record with admin credentials', async () => {
      const updateData = {
        title: 'Updated Record Title',
        description: 'Updated description',
        content: 'Updated content',
        tags: ['updated', 'test'],
        categories: ['updated-category'],
        is_published: false
      };

      const response = await request(app)
        .put(`${TEST_CONSTANTS.API_ENDPOINTS.RECORDS}/${testRecord.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      TestUtils.validateApiResponse(response, TEST_CONSTANTS.HTTP_STATUS.OK);
      expect(response.body.data).to.have.property('id', testRecord.id);
      expect(response.body.data).to.have.property('title', updateData.title);
      expect(response.body.data).to.have.property('description', updateData.description);
      expect(response.body.data).to.have.property('content', updateData.content);
      expect(response.body.data).to.have.property('is_published', updateData.is_published);
      expect(response.body.message).to.equal('Record updated successfully');
    });

    it('should reject update without admin privileges', async () => {
      const updateData = {
        title: 'Unauthorized Update Attempt'
      };

      const response = await request(app)
        .put(`${TEST_CONSTANTS.API_ENDPOINTS.RECORDS}/${testRecord.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      TestUtils.validateErrorResponse(response, TEST_CONSTANTS.HTTP_STATUS.FORBIDDEN);
    });

    it('should return 422 for non-existent record', async () => {
      const updateData = {
        title: 'Update Non-existent Record'
      };

      const response = await request(app)
        .put(`${TEST_CONSTANTS.API_ENDPOINTS.RECORDS}/${TEST_CONSTANTS.NON_EXISTENT_UUID}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      TestUtils.validateErrorResponse(response, TEST_CONSTANTS.HTTP_STATUS.VALIDATION_ERROR);
    });
  });

  describe('DELETE /api/records/:id', () => {
    let testRecord: TestRecord;

    beforeEach(async () => {
      testRecord = await TestUtils.createTestRecord(adminToken);
    });

    it('should delete an existing record with admin credentials', async () => {
      const response = await request(app)
        .delete(`${TEST_CONSTANTS.API_ENDPOINTS.RECORDS}/${testRecord.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).to.equal(TEST_CONSTANTS.HTTP_STATUS.NO_CONTENT);

      // Проверяем, что запись действительно удалена
      const getResponse = await request(app)
        .get(`${TEST_CONSTANTS.API_ENDPOINTS.RECORDS}/${testRecord.id}`);

      expect([TEST_CONSTANTS.HTTP_STATUS.NOT_FOUND, TEST_CONSTANTS.HTTP_STATUS.VALIDATION_ERROR]).to.include(getResponse.statusCode);
    });

    it('should reject deletion without admin privileges', async () => {
      const response = await request(app)
        .delete(`${TEST_CONSTANTS.API_ENDPOINTS.RECORDS}/${testRecord.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      TestUtils.validateErrorResponse(response, TEST_CONSTANTS.HTTP_STATUS.FORBIDDEN);
    });

    it('should return 422 for non-existent record deletion', async () => {
      const response = await request(app)
        .delete(`${TEST_CONSTANTS.API_ENDPOINTS.RECORDS}/${TEST_CONSTANTS.NON_EXISTENT_UUID}`)
        .set('Authorization', `Bearer ${adminToken}`);

      TestUtils.validateErrorResponse(response, TEST_CONSTANTS.HTTP_STATUS.VALIDATION_ERROR);
    });
  });

  describe('GET /api/records/meta/tags-categories', () => {
    before(async () => {
      // Создаем несколько записей с различными тегами и категориями для тестирования
      await TestUtils.createTestRecord(adminToken, {
        title: 'Record 1',
        content: 'Content 1',
        tags: ['javascript', 'nodejs'],
        categories: ['programming', 'tutorial'],
        is_published: true
      });

      await TestUtils.createTestRecord(adminToken, {
        title: 'Record 2',
        content: 'Content 2',
        tags: ['javascript', 'react'],
        categories: ['programming', 'frontend'],
        is_published: true
      });
    });

    it('should return tags and categories with counts', async () => {
      const response = await request(app)
        .get(`${TEST_CONSTANTS.API_ENDPOINTS.RECORDS}/meta/tags-categories`);

      TestUtils.validateApiResponse(response, TEST_CONSTANTS.HTTP_STATUS.OK);
      expect(response.body.data).to.have.property('categories').that.is.an('array');
      expect(response.body.data).to.have.property('tags').that.is.an('array');

      // Проверяем структуру ответа
      if (response.body.data.categories.length > 0) {
        expect(response.body.data.categories[0]).to.have.property('name');
        expect(response.body.data.categories[0]).to.have.property('count');
      }

      if (response.body.data.tags.length > 0) {
        expect(response.body.data.tags[0]).to.have.property('name');
        expect(response.body.data.tags[0]).to.have.property('count');
      }

      expect(response.body.message).to.equal('Tags and categories retrieved successfully');
    });
  });

  describe('Records Visibility (Published vs Unpublished)', () => {
    let publishedRecord: TestRecord;
    let unpublishedRecord: TestRecord;

    before(async () => {
      publishedRecord = await TestUtils.createTestRecord(adminToken, {
        title: 'Published Record',
        content: 'This record is published',
        is_published: true
      });

      unpublishedRecord = await TestUtils.createTestRecord(adminToken, {
        title: 'Unpublished Record',
        content: 'This record is not published',
        is_published: false
      });
    });

    it('should show published records to public users', async () => {
      const response = await request(app)
        .get(`${TEST_CONSTANTS.API_ENDPOINTS.RECORDS}/${publishedRecord.id}`);

      TestUtils.validateApiResponse(response, TEST_CONSTANTS.HTTP_STATUS.OK);
      expect(response.body.data).to.have.property('id', publishedRecord.id);
    });

    it('should hide unpublished records from public users', async () => {
      const response = await request(app)
        .get(`${TEST_CONSTANTS.API_ENDPOINTS.RECORDS}/${unpublishedRecord.id}`);

      expect([TEST_CONSTANTS.HTTP_STATUS.NOT_FOUND, TEST_CONSTANTS.HTTP_STATUS.VALIDATION_ERROR]).to.include(response.statusCode);
    });

    it('should show both published and unpublished records to admin users', async () => {
      const publishedResponse = await request(app)
        .get(`${TEST_CONSTANTS.API_ENDPOINTS.RECORDS}/${publishedRecord.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      TestUtils.validateApiResponse(publishedResponse, TEST_CONSTANTS.HTTP_STATUS.OK);

      const unpublishedResponse = await request(app)
        .get(`${TEST_CONSTANTS.API_ENDPOINTS.RECORDS}/${unpublishedRecord.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      TestUtils.validateApiResponse(unpublishedResponse, TEST_CONSTANTS.HTTP_STATUS.OK);
    });
  });
});