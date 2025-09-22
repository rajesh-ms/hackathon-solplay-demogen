import request from 'supertest';
import winston from 'winston';
import express from 'express';
import { initializeRoutes } from '../../src/routes/demo.routes';

// Mock external service classes BEFORE importing service under test
jest.mock('../../src/services/v0-client.service', () => require('../__mocks__/v0-client.service.mock'));
jest.mock('../../src/services/azure-openai.service', () => require('../__mocks__/azure-openai.service.mock'));

describe('Demo Routes Integration (Mocked)', () => {
  const logger = winston.createLogger({ transports: [new winston.transports.Console({ silent: true })] });
  const app = express();
  app.use(express.json());
  const router = initializeRoutes(logger);
  app.use('/api/v1', router);

  const basePayload = {
    useCaseTitle: 'AI-Powered Customer Support',
    keyCapabilities: ['Natural language processing', 'Automated routing']
  };

  test('POST /generate-demo-enhanced returns success with demoId', async () => {
    const res = await request(app).post('/api/v1/generate-demo-enhanced').send(basePayload);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.demoId).toBeDefined();
    expect(res.body.data.status).toBe('completed');
  });

  test('POST /generate-demo (legacy) returns basic component', async () => {
    const res = await request(app).post('/api/v1/generate-demo').send(basePayload);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.demoId).toBeDefined();
  });

  test('POST /preview-ai-enhancements returns preview with confidence', async () => {
    const res = await request(app).post('/api/v1/preview-ai-enhancements').send(basePayload);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.confidence).toBeGreaterThan(0);
  });

  test('Validation failure returns 400', async () => {
    const res = await request(app).post('/api/v1/generate-demo-enhanced').send({
      useCaseTitle: 'Hi', // too short capabilities array will fail
      keyCapabilities: []
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid input');
  });

  test('GET /demos/:demoId returns stored demo', async () => {
    const gen = await request(app).post('/api/v1/generate-demo-enhanced').send(basePayload);
    const demoId = gen.body.data.demoId;
    const res = await request(app).get(`/api/v1/demos/${demoId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.demoId).toBe(demoId);
    expect(res.body.data.demo).toBeDefined();
  });

  test('GET /demos/:demoId unknown returns 404', async () => {
    const res = await request(app).get('/api/v1/demos/does_not_exist');
    expect(res.status).toBe(404);
  });

  test('GET /health responds with healthy status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });
});
