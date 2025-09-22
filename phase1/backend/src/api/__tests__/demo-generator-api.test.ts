import request from 'supertest';
import { app } from '../app';
import { DemoGeneratorAPI } from '../demo-generator-api';

describe('Demo Generator API', () => {
  describe('POST /api/v1/generate-demo', () => {
    it('should generate demo from use case title and capabilities', async () => {
      const requestBody = {
        useCaseTitle: 'AI-Powered Customer Service Automation',
        keyCapabilities: [
          'Natural Language Understanding',
          'Sentiment Analysis',
          'Automated Response Generation',
          'Performance Analytics'
        ],
        category: 'Process Automation'
      };

      const response = await request(app)
        .post('/api/v1/generate-demo')
        .send(requestBody)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        demoId: expect.any(String),
        demoUrl: expect.stringMatching(/^https:\/\/demo-.*\.vercel\.app$/),
        componentCode: expect.stringContaining('React'),
        syntheticData: expect.any(Object),
        metadata: {
          generatedAt: expect.any(String),
          processingTime: expect.any(Number),
          capabilities: requestBody.keyCapabilities
        }
      });

      expect(response.body.metadata.processingTime).toBeLessThan(5000);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/generate-demo')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'useCaseTitle',
            message: 'Use case title is required'
          }),
          expect.objectContaining({
            field: 'keyCapabilities',
            message: 'Key capabilities are required'
          })
        ])
      });
    });

    it('should sanitize malicious input', async () => {
      const maliciousInput = {
        useCaseTitle: '<script>alert("xss")</script>Legitimate Title',
        keyCapabilities: ['<img src=x onerror=alert(1)>', 'Valid Capability']
      };

      const response = await request(app)
        .post('/api/v1/generate-demo')
        .send(maliciousInput)
        .expect(200);

      expect(response.body.componentCode).not.toContain('<script>');
      expect(response.body.componentCode).not.toContain('onerror=');
      expect(response.body.componentCode).toContain('Legitimate Title');
    });

    it('should enforce rate limiting', async () => {
      const requestBody = {
        useCaseTitle: 'Test Case',
        keyCapabilities: ['Test Capability']
      };

      // Make requests up to the limit
      for (let i = 0; i < 100; i++) {
        await request(app)
          .post('/api/v1/generate-demo')
          .send(requestBody);
      }

      // 101st request should be rate limited
      const response = await request(app)
        .post('/api/v1/generate-demo')
        .send(requestBody)
        .expect(429);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Rate limit exceeded'
      });
    });

    it('should require valid API key', async () => {
      const response = await request(app)
        .post('/api/v1/generate-demo')
        .send({
          useCaseTitle: 'Test Case',
          keyCapabilities: ['Test Capability']
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid or missing API key'
      });
    });

    it('should handle v0.dev service failures gracefully', async () => {
      // Mock v0.dev service failure
      jest.spyOn(require('../services/v0-enhanced-client'), 'V0EnhancedClient')
        .mockImplementation(() => ({
          generateDemo: jest.fn().mockRejectedValue(new Error('V0 service unavailable'))
        }));

      const response = await request(app)
        .post('/api/v1/generate-demo')
        .set('Authorization', 'Bearer valid-api-key')
        .send({
          useCaseTitle: 'Test Case',
          keyCapabilities: ['Test Capability']
        })
        .expect(503);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Demo generation service temporarily unavailable'
      });
    });
  });

  describe('GET /api/v1/demo-status/:demoId', () => {
    it('should return demo generation status', async () => {
      const response = await request(app)
        .get('/api/v1/demo-status/demo-123')
        .set('Authorization', 'Bearer valid-api-key')
        .expect(200);

      expect(response.body).toMatchObject({
        demoId: 'demo-123',
        status: expect.oneOf(['pending', 'processing', 'completed', 'failed']),
        progress: expect.any(Number)
      });
    });
  });

  describe('GET /api/v1/demos/:demoId', () => {
    it('should return cached demo data', async () => {
      const response = await request(app)
        .get('/api/v1/demos/demo-123')
        .set('Authorization', 'Bearer valid-api-key')
        .expect(200);

      expect(response.body).toMatchObject({
        demoId: 'demo-123',
        demoUrl: expect.any(String),
        componentCode: expect.any(String),
        syntheticData: expect.any(Object),
        createdAt: expect.any(String)
      });
    });
  });
});