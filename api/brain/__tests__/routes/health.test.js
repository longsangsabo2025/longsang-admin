/**
 * Health Check Routes Tests
 */

const request = require('supertest');
const express = require('express');
const healthRoutes = require('../../routes/health');

const app = express();
app.use(express.json());
app.use('/api/brain/health', healthRoutes);

describe('Health Check Routes', () => {
  test('GET /api/brain/health should return ok status', async () => {
    const response = await request(app).get('/api/brain/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('brain-api');
  });

  test('GET /api/brain/health/detailed should return detailed health', async () => {
    const response = await request(app).get('/api/brain/health/detailed');
    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.body.status).toBeDefined();
    expect(response.body.checks).toBeDefined();
  });

  test('GET /api/brain/health/ready should return ready status', async () => {
    const response = await request(app).get('/api/brain/health/ready');
    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.body.status).toBeDefined();
  });

  test('GET /api/brain/health/live should return alive status', async () => {
    const response = await request(app).get('/api/brain/health/live');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('alive');
  });
});


