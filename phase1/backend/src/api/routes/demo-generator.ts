import { Router } from 'express';
import Joi from 'joi';
import DOMPurify from 'isomorphic-dompurify';
import { DemoGeneratorService } from '../services/demo-generator-service';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';

const router = Router();
const demoGeneratorService = new DemoGeneratorService();

// Input validation schemas
const generateDemoSchema = Joi.object({
  useCaseTitle: Joi.string()
    .min(3)
    .max(200)
    .pattern(/^[a-zA-Z0-9\s\-_.,!?()\[\]]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Use case title contains invalid characters',
      'any.required': 'Use case title is required'
    }),
  keyCapabilities: Joi.array()
    .items(
      Joi.string()
        .min(2)
        .max(100)
        .pattern(/^[a-zA-Z0-9\s\-_.,()&]+$/)
    )
    .min(1)
    .max(10)
    .required()
    .messages({
      'array.min': 'At least one capability is required',
      'array.max': 'Maximum 10 capabilities allowed',
      'any.required': 'Key capabilities are required'
    }),
  category: Joi.string()
    .valid('Content Generation', 'Process Automation', 'Personalized Experience')
    .optional(),
  templateStyle: Joi.string()
    .valid('financial', 'healthcare', 'retail', 'generic')
    .default('generic'),
  customization: Joi.object({
    primaryColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
    secondaryColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
    companyName: Joi.string().max(50).optional(),
    logo: Joi.string().uri().optional()
  }).optional()
});

// Sanitize input function
const sanitizeInput = (input: any): any => {
  if (typeof input === 'string') {
    return DOMPurify.sanitize(input, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
};

// POST /api/v1/generate-demo
router.post('/generate-demo', async (req: AuthenticatedRequest, res, next) => {
  try {
    // Validate input
    const { error, value } = generateDemoSchema.validate(req.body);
    
    if (error) {
      const validationError = new AppError('Validation failed');
      validationError.statusCode = 400;
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    // Sanitize input
    const sanitizedInput = sanitizeInput(value);

    // Generate demo
    const startTime = Date.now();
    const result = await demoGeneratorService.generateDemo({
      ...sanitizedInput,
      apiKey: req.apiKey!,
      requestId: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });

    const processingTime = Date.now() - startTime;

    if (!result.success) {
      const serviceError = new AppError(result.error || 'Demo generation failed');
      serviceError.statusCode = result.error?.includes('unavailable') ? 503 : 500;
      throw serviceError;
    }

    res.json({
      success: true,
      demoId: result.demoId,
      demoUrl: result.demoUrl,
      componentCode: result.componentCode,
      syntheticData: result.syntheticData,
      metadata: {
        generatedAt: new Date().toISOString(),
        processingTime,
        model: result.metadata?.model || 'v0-1.5-lg',
        capabilities: sanitizedInput.keyCapabilities,
        category: sanitizedInput.category,
        templateStyle: sanitizedInput.templateStyle
      }
    });

  } catch (error) {
    next(error);
  }
});

// GET /api/v1/demo-status/:demoId
router.get('/demo-status/:demoId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { demoId } = req.params;
    
    const status = await demoGeneratorService.getDemoStatus(demoId);
    
    if (!status) {
      const notFoundError = new AppError('Demo not found');
      notFoundError.statusCode = 404;
      throw notFoundError;
    }

    res.json(status);
    
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/demos/:demoId
router.get('/demos/:demoId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { demoId } = req.params;
    
    const demo = await demoGeneratorService.getCachedDemo(demoId);
    
    if (!demo) {
      const notFoundError = new AppError('Demo not found');
      notFoundError.statusCode = 404;
      throw notFoundError;
    }

    res.json(demo);
    
  } catch (error) {
    next(error);
  }
});

export { router as demoGeneratorRouter };