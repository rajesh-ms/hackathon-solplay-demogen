/**
 * Enhanced Demo Generation API Routes
 * RESTful endpoints for AI-powered demo generation with Azure OpenAI integration
 */

import express, { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import winston from 'winston';
import { HybridDemoService, HybridGenerationOptions } from '../services/hybrid-demo.service';
import { UseCaseInput } from '../types/azure-openai';

const router = express.Router();

// Validation schemas
const useCaseInputSchema = Joi.object({
  useCaseTitle: Joi.string().min(3).max(200).required(),
  keyCapabilities: Joi.array().items(Joi.string().min(2).max(100)).min(1).max(10).required(),
  description: Joi.string().max(500).optional(),
  category: Joi.string().valid('Content Generation', 'Process Automation', 'Personalized Experience').optional(),
  targetAudience: Joi.string().max(100).optional(),
  industryVertical: Joi.string().max(50).optional()
});

// Enhanced generation schema extends the base use case schema
const enhancedGenerationSchema = useCaseInputSchema.keys({
  aiEnhancementOptions: Joi.object({
    enhanceDescription: Joi.boolean().default(true),
    generateSyntheticData: Joi.boolean().default(true),
    createUserJourney: Joi.boolean().default(true),
    suggestImprovements: Joi.boolean().default(true),
    confidenceThreshold: Joi.number().min(0).max(1).default(0.8)
  }).optional(),
  generationPreferences: Joi.object({
    useV0: Joi.boolean().default(true),
    useAzureOpenAI: Joi.boolean().default(true),
    fallbackToBasic: Joi.boolean().default(true),
    maxGenerationTime: Joi.number().min(30000).max(300000).default(60000)
  }).optional()
});

// Initialize service
let hybridService: HybridDemoService;
let logger: winston.Logger;

export function initializeRoutes(loggerInstance: winston.Logger): express.Router {
  logger = loggerInstance;
  hybridService = new HybridDemoService(logger);
  
  // Initialize the service
  hybridService.initialize().catch(error => {
    logger.error('Failed to initialize hybrid demo service in routes', { error });
  });

  return router;
}

/**
 * POST /api/v1/generate-demo-enhanced
 * Generate enhanced demo with both Azure OpenAI and v0.dev
 */
router.post('/generate-demo-enhanced', async (req: Request, res: Response, next: NextFunction) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    logger.info('Enhanced demo generation request received', { 
      requestId, 
      userAgent: req.headers['user-agent'],
      ip: req.ip 
    });

    // Validate input
    const { error, value } = enhancedGenerationSchema.validate(req.body);
    if (error) {
      logger.warn('Invalid request for enhanced demo generation', { 
        requestId, 
        error: error.details?.[0]?.message 
      });
      return res.status(400).json({
        error: 'Invalid input',
        message: error.details?.[0]?.message || 'Validation error',
        requestId
      });
    }

    const input: UseCaseInput = {
      useCaseTitle: value.useCaseTitle,
      keyCapabilities: value.keyCapabilities,
      description: value.description,
      category: value.category,
      targetAudience: value.targetAudience,
      industryVertical: value.industryVertical
    };

    const options: HybridGenerationOptions = {
      useV0: value.generationPreferences?.useV0 ?? true,
      useAzureOpenAI: value.generationPreferences?.useAzureOpenAI ?? true,
      fallbackToBasic: value.generationPreferences?.fallbackToBasic ?? true,
      maxGenerationTime: value.generationPreferences?.maxGenerationTime ?? 60000,
      aiEnhancementOptions: {
        enhanceDescription: value.aiEnhancementOptions?.enhanceDescription ?? true,
        generateSyntheticData: value.aiEnhancementOptions?.generateSyntheticData ?? true,
        createUserJourney: value.aiEnhancementOptions?.createUserJourney ?? true,
        suggestImprovements: value.aiEnhancementOptions?.suggestImprovements ?? true,
        confidenceThreshold: value.aiEnhancementOptions?.confidenceThreshold ?? 0.8
      }
    };

    // Generate enhanced demo
    const result = await hybridService.generateEnhancedDemo(input, options);
    
    logger.info('Enhanced demo generation completed', { 
      requestId, 
      demoId: result.demoId,
      status: result.status,
      aiUsed: result.generatedBy.azureOpenAI,
      v0Used: result.generatedBy.v0
    });

    return res.json({
      success: true,
      requestId,
      data: result
    });

  } catch (error: any) {
    logger.error('Enhanced demo generation failed', { 
      requestId, 
      error: error.message,
      stack: error.stack 
    });

    return res.status(500).json({
      error: 'Demo generation failed',
      message: error.message,
      requestId
    });
  }
});

/**
 * POST /api/v1/preview-ai-enhancements
 * Preview AI enhancements without full generation
 */
router.post('/preview-ai-enhancements', async (req: Request, res: Response, next: NextFunction) => {
  const requestId = `preview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    logger.info('AI enhancement preview request received', { requestId });

    // Validate input
    const { error, value } = useCaseInputSchema.validate(req.body);
    if (error) {
      logger.warn('Invalid request for AI preview', { 
        requestId, 
        error: error.details?.[0]?.message 
      });
      return res.status(400).json({
        error: 'Invalid input',
        message: error.details?.[0]?.message || 'Validation error',
        requestId
      });
    }

    const input: UseCaseInput = {
      useCaseTitle: value.useCaseTitle,
      keyCapabilities: value.keyCapabilities,
      description: value.description,
      category: value.category,
      targetAudience: value.targetAudience,
      industryVertical: value.industryVertical
    };

    // Generate preview
    const preview = await hybridService.previewAIEnhancements(input);
    
    logger.info('AI enhancement preview completed', { 
      requestId,
      confidence: preview.confidence
    });

    return res.json({
      success: true,
      requestId,
      data: preview
    });

  } catch (error: any) {
    logger.error('AI enhancement preview failed', { 
      requestId, 
      error: error.message 
    });

    return res.status(500).json({
      error: 'Preview generation failed',
      message: error.message,
      requestId
    });
  }
});

/**
 * POST /api/v1/generate-demo
 * Legacy endpoint for basic demo generation (v0 only)
 */
router.post('/generate-demo', async (req: Request, res: Response, next: NextFunction) => {
  const requestId = `legacy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    logger.info('Legacy demo generation request received', { requestId });

    // Validate input
    const { error, value } = useCaseInputSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Invalid input',
        message: error.details?.[0]?.message || 'Validation error',
        requestId
      });
    }

    const input: UseCaseInput = {
      useCaseTitle: value.useCaseTitle,
      keyCapabilities: value.keyCapabilities,
      description: value.description,
      category: value.category,
      targetAudience: value.targetAudience,
      industryVertical: value.industryVertical
    };

    const options: HybridGenerationOptions = {
      useV0: true,
      useAzureOpenAI: false, // Legacy mode - v0 only
      fallbackToBasic: true,
      maxGenerationTime: 30000,
      aiEnhancementOptions: {
        enhanceDescription: false,
        generateSyntheticData: false,
        createUserJourney: false,
        suggestImprovements: false,
        confidenceThreshold: 0.8
      }
    };

    // Generate basic demo
    const result = await hybridService.generateEnhancedDemo(input, options);
    
    logger.info('Legacy demo generation completed', { 
      requestId, 
      demoId: result.demoId 
    });

    return res.json({
      success: true,
      requestId,
      data: {
        demoId: result.demoId,
        component: result.demo?.v0Component,
        metadata: result.demo?.metadata,
        generatedBy: result.generatedBy
      }
    });

  } catch (error: any) {
    logger.error('Legacy demo generation failed', { 
      requestId, 
      error: error.message 
    });

    return res.status(500).json({
      error: 'Demo generation failed',
      message: error.message,
      requestId
    });
  }
});

/**
 * GET /api/v1/demo-status/:demoId
 * Get the status of a demo generation
 */
router.get('/demo-status/:demoId', async (req: Request, res: Response) => {
  const { demoId } = req.params;
  
  try {
    logger.info('Demo status requested', { demoId });

    // In a real implementation, this would check a database or cache
    // For now, return a mock response
    res.json({
      success: true,
      data: {
        demoId,
        status: 'completed',
        progress: {
          percentage: 100,
          currentStep: 'Generation completed',
          steps: {
            inputValidation: 'completed',
            aiEnhancement: 'completed',
            v0Generation: 'completed',
            contentMerging: 'completed',
            finalization: 'completed'
          }
        }
      }
    });

  } catch (error: any) {
    logger.error('Failed to get demo status', { demoId, error: error.message });

    res.status(500).json({
      error: 'Failed to get demo status',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/demos/:demoId
 * Return generated demo artifact (component code + metadata)
 */
router.get('/demos/:demoId', async (req: Request, res: Response) => {
  const { demoId } = req.params;
  try {
    const demo = await hybridService.getGeneratedDemo(demoId as string);
    if(!demo) {
      return res.status(404).json({ error: 'Demo not found', demoId });
    }
    return res.json({ success: true, data: demo });
  } catch (error:any) {
    logger.error('Failed to retrieve demo', { demoId, error: error.message });
    return res.status(500).json({ error: 'Failed to retrieve demo', message: error.message });
  }
});

/**
 * GET /api/v1/service-stats
 * Get statistics about the hybrid service
 */
router.get('/service-stats', async (req: Request, res: Response) => {
  try {
    const stats = await hybridService.getServiceStats();
    
    res.json({
      success: true,
      data: {
        services: stats,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });

  } catch (error: any) {
    logger.error('Failed to get service stats', { error: error.message });

    res.status(500).json({
      error: 'Failed to get service statistics',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/health
 * Health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        azureOpenAI: process.env.AZURE_OPENAI_ENDPOINT ? 'configured' : 'not_configured',
        v0: process.env.V0_API_KEY ? 'configured' : 'not_configured'
      },
      version: '1.0.0'
    });

  } catch (error: any) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;