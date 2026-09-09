import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('LifeShelf API Integration Endpoints', () => {
  const app = createApp();

  it('GET /api/health should return 200 OK with status information', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('lifeshelf-backend');
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('GET /api/docs.json should serve the OpenAPI Swagger specification', async () => {
    const res = await request(app).get('/api/docs.json');

    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.0');
    expect(res.body.info.title).toBe('LifeShelf API');
  });

  it('Protected route GET /api/movies should return 401 when token is missing', async () => {
    const res = await request(app).get('/api/movies');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('Non-existent route should return 404 with standardized error format', async () => {
    const res = await request(app).get('/api/unknown-route-12345');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
  });
});
