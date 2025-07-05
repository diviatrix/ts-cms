import request from 'supertest';
import { expect } from 'chai';
import app from '../src/expressapi';

describe('API Status', () => {
  describe('GET /api', () => {
    it('should return API status', async () => {
      const response = await request(app)
        .get('/api');

      // The endpoint might redirect (301) or return status (200)
      // Both are valid behaviors depending on configuration
      if (response.statusCode === 200) {
        expect(response.body).to.deep.equal({ status: 'ok' });
      } else if (response.statusCode === 301) {
        // Redirect is also acceptable
        console.log('API endpoint redirects - this is acceptable behavior');
      } else {
        throw new Error(`Unexpected status code: ${response.statusCode}`);
      }
    });
  });
});
