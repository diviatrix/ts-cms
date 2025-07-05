import request from 'supertest';
import { expect } from 'chai';
import app from '../src/expressapi';

describe('Themes API', () => {
  describe('GET /api/themes', () => {
    it('should get a list of all themes', async () => {
      const response = await request(app)
        .get('/api/themes');

      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data).to.be.an('array');
    });
  });

  describe('GET /api/themes/active', () => {
    it('should get the active theme', async () => {
      const response = await request(app)
        .get('/api/themes/active');

      expect(response.statusCode).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property('theme');
      expect(response.body.data).to.have.property('settings');
    });
  });

  describe('GET /api/themes/:id', () => {
    it('should get a specific theme by id', async () => {
      // First get all themes to get a valid theme ID
      const listResponse = await request(app)
        .get('/api/themes');

      expect(listResponse.statusCode).to.equal(200);

      if (listResponse.body.data && listResponse.body.data.length > 0) {
        const themeId = listResponse.body.data[0].id;
        
        const response = await request(app)
          .get(`/api/themes/${themeId}`);

        expect(response.statusCode).to.equal(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.have.property('theme');
        expect(response.body.data).to.have.property('settings');
      } else {
        console.log('No themes found - skipping specific theme test');
      }
    });
  });

  describe('GET /api/themes/:id/settings', () => {
    it('should get settings for a specific theme', async () => {
      // First get all themes to get a valid theme ID
      const listResponse = await request(app)
        .get('/api/themes');

      expect(listResponse.statusCode).to.equal(200);

      if (listResponse.body.data && listResponse.body.data.length > 0) {
        const themeId = listResponse.body.data[0].id;
        
        const response = await request(app)
          .get(`/api/themes/${themeId}/settings`);

        expect(response.statusCode).to.equal(200);
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.be.an('object');
      } else {
        console.log('No themes found - skipping theme settings test');
      }
    });
  });
});
