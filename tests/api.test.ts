import request from 'supertest';
import { expect } from 'chai';
import app from '../src/expressapi'; // Import the Express app for testing

describe('GET /api', () => {
  it('should return a status message', (done) => {
    request(app)
      .get('/api')
      .end((err, res) => {
        expect(res.statusCode).to.equal(200);
        expect(res.body).to.deep.equal({ status: 'ok' });
        done();
      });
  });
});

describe('Authentication', () => {
  it('should register a new user', (done) => {
    request(app)
      .post('/api/register')
      .send({
        login: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      })
      .end((err, res) => {
        expect(res.statusCode).to.equal(200);
        expect(res.body.success).to.be.true;
        expect(res.body.data).to.have.property('id');
        expect(res.body.data.login).to.equal('testuser');
        expect(res.body.data.email).to.equal('test@example.com');
        expect(res.body.message).to.equal('User registered successfully');
        done();
      });
  });

  it('should login the user', (done) => {
    request(app)
      .post('/api/login')
      .send({
        login: 'testuser',
        password: 'password123',
      })
      .end((err, res) => {
        expect(res.statusCode).to.equal(200);
        expect(res.body.success).to.be.true;
        expect(res.body.data).to.have.property('token');
        expect(res.body.message).to.equal('Login successful');
        done();
      });
  });
});

describe('Records', () => {
  it('should get a list of published records', (done) => {
    request(app)
      .get('/api/records')
      .end((err, res) => {
        expect(res.statusCode).to.equal(200);
        expect(res.body.success).to.be.true;
        expect(res.body.data).to.be.an('array');
        expect(res.body.message).to.equal('Records retrieved successfully');
        done();
      });
  });

  it('should get a specific published record', (done) => {
    // Use the actual record ID from the database output
    const recordId = 'dc2a6063-6112-40ab-9105-abcb57f04cb3';
    request(app)
      .get(`/api/records/${recordId}`)
      .end((err, res) => {
        expect(res.statusCode).to.equal(200);
        expect(res.body.success).to.be.true;
        expect(res.body.data).to.have.property('id');
        expect(res.body.data.is_published).to.be.true;
        expect(res.body.message).to.equal('Record retrieved successfully');
        done();
      });
  });
});

describe('Themes', () => {
  it('should get a list of all themes', (done) => {
    request(app)
      .get('/api/themes')
      .end((err, res) => {
        expect(res.statusCode).to.equal(200);
        expect(res.body.success).to.be.true;
        expect(res.body.data).to.be.an('array');
        done();
      });
  });

  it('should get the active theme', (done) => {
    request(app)
      .get('/api/themes/active')
      .end((err, res) => {
        expect(res.statusCode).to.equal(200);
        expect(res.body.success).to.be.true;
        expect(res.body.data).to.have.property('theme');
        expect(res.body.data).to.have.property('settings');
        done();
      });
  });

  it('should get a specific theme by id', (done) => {
    // Use the actual theme ID from the database output
    const themeId = '985ed02d-df49-47d1-8152-1149ccf2775d';
    request(app)
      .get(`/api/themes/${themeId}`)
      .end((err, res) => {
        expect(res.statusCode).to.equal(200);
        expect(res.body.success).to.be.true;
        expect(res.body.data).to.have.property('theme');
        expect(res.body.data).to.have.property('settings');
        done();
      });
  });

  it('should get settings for a specific theme', (done) => {
    // Use the actual theme ID from the database output  
    const themeId = '985ed02d-df49-47d1-8152-1149ccf2775d';
    request(app)
      .get(`/api/themes/${themeId}/settings`)
      .end((err, res) => {
        expect(res.statusCode).to.equal(200);
        expect(res.body.success).to.be.true;
        expect(res.body.data).to.be.an('object');
        done();
      });
  });
});
