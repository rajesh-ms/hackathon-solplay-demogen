import express, { Express } from 'express';
import { DemoGeneratorService } from './services/demo-generator-service';
import { V0EnhancedClient } from './services/v0-enhanced-client';
import { SyntheticDataGenerator } from './services/synthetic-data-generator';
import { DemoHostingService } from './services/demo-hosting-service';
import { LoggingService } from './services/logging-service';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/error-handler';
import { validationMiddleware } from './middleware/validation';
import Joi from 'joi';

export class DemoGeneratorAPI {
  private app: Express;
  private demoService!: DemoGeneratorService;

  constructor() {
    this.app = express();
    this.setupServices();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupServices(): void {
    const loggingService = new LoggingService();
    const v0Client = new V0EnhancedClient();
    const syntheticDataGenerator = new SyntheticDataGenerator();
    const hostingService = new DemoHostingService();

    this.demoService = new DemoGeneratorService(
      v0Client,
      syntheticDataGenerator,
      hostingService,
      loggingService
    );
  }

  private setupMiddleware(): void {
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(authMiddleware);
  }

  private setupRoutes(): void {
    const generateDemoSchema = Joi.object({
      useCaseTitle: Joi.string().required().min(3).max(200),
      keyCapabilities: Joi.array().items(Joi.string().min(2).max(100)).min(1).max(10).required(),
      category: Joi.string().valid('Content Generation', 'Process Automation', 'Personalized Experience').optional(),
      requirements: Joi.object({
        targetAudience: Joi.string().optional(),
        complexity: Joi.string().valid('simple', 'intermediate', 'advanced').optional(),
        features: Joi.array().items(Joi.string()).optional()
      }).optional()
    });

    // Generate demo endpoint
    this.app.post('/api/v1/generate-demo', 
      validationMiddleware(generateDemoSchema),
      async (req, res, next) => {
        try {
          const result = await this.demoService.generateDemo({
            useCaseTitle: req.body.useCaseTitle,
            keyCapabilities: req.body.keyCapabilities,
            category: req.body.category,
            requirements: req.body.requirements
          });

          res.status(200).json(result);
        } catch (error) {
          next(error);
        }
      }
    );

    // Get demo status endpoint
    this.app.get('/api/v1/demo-status/:demoId', async (req, res, next) => {
      try {
        const status = await this.demoService.getDemoStatus(req.params.demoId);
        res.status(200).json(status);
      } catch (error) {
        next(error);
      }
    });

    // Get demo data endpoint
    this.app.get('/api/v1/demos/:demoId', async (req, res, next) => {
      try {
        const demo = await this.demoService.getDemo(req.params.demoId);
        res.status(200).json(demo);
      } catch (error) {
        next(error);
      }
    });
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  getApp(): Express {
    return this.app;
  }

  async start(port: number = 3000): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(port, () => {
        console.log(`Demo Generator API listening on port ${port}`);
        resolve();
      });
    });
  }
}