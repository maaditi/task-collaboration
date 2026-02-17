const request = require('supertest');
const { app } = require('../server');

describe('Auth Endpoints', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'password123'
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('token');
  });

  it('should login user', async () => {
    // First register
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Login Test',
        email: `login${Date.now()}@example.com`,
        password: 'password123'
      });

    const email = registerRes.body.data.email;

    // Then login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email,
        password: 'password123'
      });
    
    expect(loginRes.statusCode).toEqual(200);
    expect(loginRes.body).toHaveProperty('success', true);
    expect(loginRes.body.data).toHaveProperty('token');
  });
});
