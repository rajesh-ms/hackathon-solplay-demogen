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
      res.status(400).json({
        error: 'Invalid input',
        message: error.details?.[0]?.message || 'Validation error',
        requestId
      });
      return;
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

    // Generate demo ID immediately and start async generation
    const demoId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    logger.info('Starting async demo generation', {
      requestId,
      demoId,
      options
    });

    // Return immediately with demo ID
    res.json({
      success: true,
      requestId,
      data: {
        demoId,
        status: 'generating',
        progress: {
          percentage: 5,
          currentStep: 'Initializing demo generation...'
        },
        generatedBy: {
          azureOpenAI: false,
          v0: false
        }
      }
    });

    // Start async generation (don't await)
    const optionsWithDemoId = { ...options };
    optionsWithDemoId.demoId = demoId;
    hybridService.generateEnhancedDemo(input, optionsWithDemoId)
      .then(result => {
        logger.info('Async demo generation completed', {
          requestId,
          demoId: result.demoId,
          status: result.status,
          aiUsed: result.generatedBy.azureOpenAI,
          v0Used: result.generatedBy.v0
        });
      })
      .catch(error => {
        logger.error('Async demo generation failed', {
          requestId,
          demoId,
          error: error.message,
          stack: error.stack
        });
      });

    // Response already sent
    return;

  } catch (error: any) {
    logger.error('Enhanced demo generation failed', {
      requestId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
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

    // Get actual demo status from hybrid service
    const demo = await hybridService.getGeneratedDemo(demoId as string);

    if (!demo) {
      return res.status(404).json({
        success: false,
        error: 'Demo not found',
        message: `Demo with ID ${demoId} was not found`
      });
    }

    return res.json({
      success: true,
      data: {
        demoId: demo.demoId,
        status: demo.status,
        progress: demo.progress,
        generatedBy: demo.generatedBy,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    logger.error('Failed to get demo status', { demoId, error: error.message });

    return res.status(500).json({
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
 * GET /api/v1/latest-demo
 * Get the latest demo URL dynamically
 */
router.get('/latest-demo', async (req: Request, res: Response) => {
  try {
    // Get all demo files sorted by date
    const fs = require('fs').promises;
    const path = require('path');
    const demosDir = path.join(__dirname, '../../demos');

    try {
      const files = await fs.readdir(demosDir);
      const jsonFiles = files.filter((f: string) =>
        f.endsWith('.json') && !f.includes('_metadata')
      );

      if (jsonFiles.length === 0) {
        return res.json({
          success: true,
          data: {
            hasDemo: false,
            message: 'No demos available yet'
          }
        });
      }

      // Get the latest demo file
      const demoStats = await Promise.all(
        jsonFiles.map(async (file: string) => {
          const stat = await fs.stat(path.join(demosDir, file));
          return { file, mtime: stat.mtime };
        })
      );

      demoStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
      const latestDemoFile = demoStats[0].file;

      // Read the latest demo file
      const demoContent = await fs.readFile(
        path.join(demosDir, latestDemoFile),
        'utf-8'
      );
      const demoData = JSON.parse(demoContent);

      // Extract the live demo URL
      const liveDemoUrl = demoData.demo?.demo?.liveDemoUrl ||
                         demoData.demo?.liveDemoUrl ||
                         null;

      const demoId = latestDemoFile.replace('.json', '');

      return res.json({
        success: true,
        data: {
          hasDemo: true,
          demoId,
          liveDemoUrl,
          createdAt: demoStats[0].mtime,
          metadata: demoData.demo?.demo?.metadata || demoData.demo?.metadata
        }
      });

    } catch (error: any) {
      logger.error('Error reading demos directory', { error: error.message });
      return res.json({
        success: true,
        data: {
          hasDemo: false,
          message: 'Unable to access demos'
        }
      });
    }

  } catch (error: any) {
    logger.error('Failed to get latest demo', { error: error.message });
    return res.status(500).json({
      error: 'Failed to get latest demo',
      message: error.message
    });
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
 * POST /api/v1/validate-demo/:demoId
 * Validate a specific demo's health and restart if needed
 * TEMPORARILY DISABLED - TODO: Fix TypeScript issues
 */
/*
router.post('/validate-demo/:demoId', async (req: Request, res: Response) => {
  const { demoId } = req.params;

  if (!demoId) {
    return res.status(400).json({
      error: 'Demo ID is required',
      message: 'Missing demoId parameter'
    });
  }

  try {
    logger.info('Demo validation requested', { demoId });

    const result = await hybridService.validateDemoHealth(demoId as string);

    return res.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    logger.error('Failed to validate demo', { demoId, error: error.message });

    return res.status(500).json({
      error: 'Failed to validate demo',
      message: error.message,
      demoId
    });
  }
});
*/

/**
 * POST /api/v1/validate-all-demos
 * Validate all active demos and restart unhealthy ones
 * TEMPORARILY DISABLED - TODO: Fix TypeScript issues
 */
/*
router.post('/validate-all-demos', async (req: Request, res: Response) => {
  try {
    logger.info('All demos validation requested');

    const results = await hybridService.validateAllDemos();

    return res.json({
      success: true,
      data: results
    });

  } catch (error: any) {
    logger.error('Failed to validate all demos', { error: error.message });

    return res.status(500).json({
      error: 'Failed to validate demos',
      message: error.message
    });
  }
});
*/

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