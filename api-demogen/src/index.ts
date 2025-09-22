/**
 * API-DemoGen Server
 * Main Express application with Azure OpenAI and v0.dev integration
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import winston from 'winston';
import dotenv from 'dotenv';
import demoRoutes, { initializeRoutes } from './routes/demo.routes';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'api-demogen' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://v0.dev", "https://*.openai.azure.com"]
    }
  }
}));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000'), // 1 hour
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', limiter);

// AI-specific rate limiting
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.MAX_PARALLEL_AI_REQUESTS || '20'),
  message: {
    error: 'AI service rate limit exceeded',
    message: 'Too many AI generation requests. Please wait before trying again.'
  },
  skip: (req) => {
    return !req.path.includes('generate') && !req.path.includes('preview');
  }
});
app.use('/api/v1', aiLimiter);

// General middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
if (process.env.ENABLE_REQUEST_LOGGING === 'true') {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim())
    }
  }));
}

// Initialize routes
const demoRoutesWithLogger = initializeRoutes(logger);
app.use('/api/v1', demoRoutesWithLogger);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'API-DemoGen Service',
    version: '1.0.0',
    description: 'Professional demo generation API with Azure OpenAI and v0.dev integration',
    endpoints: {
      health: '/api/v1/health',
      generateDemo: '/api/v1/generate-demo',
      generateEnhanced: '/api/v1/generate-demo-enhanced',
      previewAI: '/api/v1/preview-ai-enhancements',
      demoStatus: '/api/v1/demo-status/:demoId',
      serviceStats: '/api/v1/service-stats'
    },
    features: {
      azureOpenAI: !!process.env.AZURE_OPENAI_ENDPOINT,
      v0Integration: !!process.env.V0_API_KEY,
      aiContentEnhancement: process.env.ENABLE_AI_CONTENT_ENHANCEMENT === 'true',
      managedIdentity: process.env.USE_MANAGED_IDENTITY === 'true'
    },
    timestamp: new Date().toISOString()
  });
});

// API documentation endpoint
app.get('/api/v1/docs', (req, res) => {
  res.json({
    title: 'API-DemoGen Documentation',
    version: '1.0.0',
    description: 'AI-powered demo generation service with Azure OpenAI and v0.dev integration',
    baseUrl: `${req.protocol}://${req.get('host')}/api/v1`,
    endpoints: [
      {
        method: 'POST',
        path: '/generate-demo-enhanced',
        description: 'Generate enhanced demo with AI content and v0.dev components',
        example: {
          useCaseTitle: 'AI-Powered Customer Support',
          keyCapabilities: ['Natural language processing', 'Automated routing'],
          aiEnhancementOptions: {
            enhanceDescription: true,
            generateSyntheticData: true
          }
        }
      },
      {
        method: 'GET',
        path: '/demos/:demoId',
        description: 'Retrieve generated demo by ID',
        response: 'Complete demo data including component code and metadata'
      },
      {
        method: 'POST',
        path: '/preview-ai-enhancements',
        description: 'Preview AI enhancements without full generation',
        example: {
          useCaseTitle: 'Document Analysis AI',
          keyCapabilities: ['OCR processing', 'Content extraction']
        }
      },
      {
        method: 'GET',
        path: '/health',
        description: 'Service health check',
        response: 'Service status and configuration'
      }
    ],
    authentication: 'API key required for production use',
    rateLimit: {
      general: '100 requests per hour',
      aiGeneration: '20 requests per 15 minutes'
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Endpoint ${req.method} ${req.originalUrl} not found`,
    availableEndpoints: [
      'GET /',
      'GET /api/v1/health',
      'GET /api/v1/docs',
      'GET /api/v1/demos/:demoId',
      'POST /api/v1/generate-demo',
      'POST /api/v1/generate-demo-enhanced',
      'POST /api/v1/preview-ai-enhancements'
    ],
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info(`API-DemoGen service started`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    features: {
      azureOpenAI: !!process.env.AZURE_OPENAI_ENDPOINT,
      v0Integration: !!process.env.V0_API_KEY,
      aiContentEnhancement: process.env.ENABLE_AI_CONTENT_ENHANCEMENT === 'true',
      managedIdentity: process.env.USE_MANAGED_IDENTITY === 'true'
    }
  });

  // Log service configuration
  logger.info('Service configuration', {
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    rateLimit: {
      window: process.env.RATE_LIMIT_WINDOW_MS || '3600000',
      maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS || '100'
    },
    azureOpenAI: {
      configured: !!process.env.AZURE_OPENAI_ENDPOINT,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT ? 'configured' : 'not_configured',
      useManagedIdentity: process.env.USE_MANAGED_IDENTITY === 'true'
    },
    v0: {
      configured: !!process.env.V0_API_KEY,
      baseUrl: process.env.V0_BASE_URL || 'https://v0.dev/api'
    }
  });
});

export default app;