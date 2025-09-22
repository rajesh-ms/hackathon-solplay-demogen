/**
 * Demo Storage Service
 * Handles file system persistence for generated demos with comprehensive logging
 */

import fs from 'fs/promises';
import path from 'path';
import winston from 'winston';
import { EnhancedDemoResponse } from '../types/azure-openai';

export interface DemoStorageOptions {
  storageDir: string;
  logFile: string;
  enableFileBackup: boolean;
}

export class DemoStorageService {
  private logger: winston.Logger;
  private demoLogger: winston.Logger;
  private options: DemoStorageOptions;
  private inMemoryCache: Map<string, EnhancedDemoResponse> = new Map();

  constructor(logger: winston.Logger, options?: Partial<DemoStorageOptions>) {
    this.logger = logger;
    this.options = {
      storageDir: options?.storageDir || path.join(process.cwd(), 'demos'),
      logFile: options?.logFile || path.join(process.cwd(), 'demogen.log'),
      enableFileBackup: options?.enableFileBackup ?? true
    };

    // Create dedicated logger for demo generation process
    this.demoLogger = winston.createLogger({
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...metadata }) => {
          const meta = Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : '';
          return `[${timestamp}] ${level.toUpperCase()}: ${message} ${meta}`;
        })
      ),
      transports: [
        new winston.transports.File({
          filename: this.options.logFile,
          maxsize: 50 * 1024 * 1024, // 50MB max file size
          maxFiles: 5 // Keep 5 backup files
        }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });

    this.initializeStorage();
  }

  private async initializeStorage(): Promise<void> {
    try {
      await fs.mkdir(this.options.storageDir, { recursive: true });
      this.logger.info('Demo storage directory initialized', {
        directory: this.options.storageDir
      });
    } catch (error) {
      this.logger.error('Failed to initialize storage directory', {
        error,
        directory: this.options.storageDir
      });
      throw error;
    }
  }

  /**
   * Store demo with comprehensive logging
   */
  async storeDemo(demo: EnhancedDemoResponse, prompt?: string): Promise<void> {
    const startTime = Date.now();

    this.demoLogger.info('=== DEMO GENERATION STARTED ===', {
      demoId: demo.demoId,
      title: demo.demo?.metadata?.category || 'Unknown',
      timestamp: new Date().toISOString()
    });

    if (prompt) {
      this.demoLogger.info('PROMPT RECEIVED', {
        demoId: demo.demoId,
        prompt: prompt,
        promptLength: prompt.length
      });
    }

    try {
      // Store in memory cache
      this.inMemoryCache.set(demo.demoId, demo);

      // Prepare file storage
      const demoFilePath = path.join(this.options.storageDir, `${demo.demoId}.json`);
      const metadataFilePath = path.join(this.options.storageDir, `${demo.demoId}_metadata.json`);

      // Create comprehensive storage object
      const storageData = {
        demo,
        stored_at: new Date().toISOString(),
        storage_version: '1.0.0',
        generation_log: {
          prompt_received: prompt || null,
          generation_start: new Date(startTime).toISOString(),
          generation_end: new Date().toISOString(),
          total_time_ms: Date.now() - startTime,
          steps_completed: demo.progress?.steps || {},
          ai_services_used: {
            azure_openai: demo.generatedBy?.azureOpenAI || false,
            v0_dev: demo.generatedBy?.v0 || false
          },
          costs: demo.generatedBy?.costs || { total: 0, currency: 'USD' }
        }
      };

      // Extract metadata for quick access
      const metadata = {
        demoId: demo.demoId,
        status: demo.status,
        title: demo.demo?.metadata?.category || 'Unknown',
        created_at: demo.generatedBy?.timestamp,
        stored_at: new Date().toISOString(),
        file_path: demoFilePath,
        generation_time_ms: Date.now() - startTime,
        size_estimate: JSON.stringify(demo).length
      };

      // Write to file system
      await Promise.all([
        fs.writeFile(demoFilePath, JSON.stringify(storageData, null, 2)),
        fs.writeFile(metadataFilePath, JSON.stringify(metadata, null, 2))
      ]);

      this.demoLogger.info('DEMO STORED SUCCESSFULLY', {
        demoId: demo.demoId,
        status: demo.status,
        filePath: demoFilePath,
        size: JSON.stringify(storageData).length,
        generationTime: Date.now() - startTime
      });

      this.logger.info('Demo stored to file system', {
        demoId: demo.demoId,
        path: demoFilePath,
        size: JSON.stringify(storageData).length
      });

    } catch (error) {
      this.demoLogger.error('DEMO STORAGE FAILED', {
        demoId: demo.demoId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      this.logger.error('Failed to store demo', {
        demoId: demo.demoId,
        error
      });
      throw error;
    }
  }

  /**
   * Update demo status during generation
   */
  async updateDemoStatus(demoId: string, updates: Partial<EnhancedDemoResponse>): Promise<void> {
    this.demoLogger.info('DEMO STATUS UPDATE', {
      demoId,
      status: updates.status,
      currentStep: updates.progress?.currentStep,
      percentage: updates.progress?.percentage,
      timestamp: new Date().toISOString()
    });

    // Update in-memory cache
    const existing = this.inMemoryCache.get(demoId);
    if (existing) {
      const updated = { ...existing, ...updates };
      this.inMemoryCache.set(demoId, updated);

      // Update file if demo is completed
      if (updates.status === 'completed' || updates.status === 'error') {
        await this.storeDemo(updated);
      }
    }
  }

  /**
   * Retrieve demo from cache or file system
   */
  async getDemo(demoId: string): Promise<EnhancedDemoResponse | null> {
    this.demoLogger.debug('DEMO RETRIEVAL REQUEST', {
      demoId,
      timestamp: new Date().toISOString()
    });

    // Check in-memory cache first
    const cached = this.inMemoryCache.get(demoId);
    if (cached) {
      this.demoLogger.debug('DEMO RETRIEVED FROM CACHE', {
        demoId,
        status: cached.status
      });
      return cached;
    }

    // Try to load from file system
    try {
      const filePath = path.join(this.options.storageDir, `${demoId}.json`);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const storageData = JSON.parse(fileContent);

      // Update cache
      this.inMemoryCache.set(demoId, storageData.demo);

      this.demoLogger.debug('DEMO RETRIEVED FROM FILE', {
        demoId,
        status: storageData.demo.status,
        filePath
      });

      return storageData.demo;
    } catch (error) {
      this.demoLogger.warn('DEMO NOT FOUND', {
        demoId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Log prompt sent to external services
   */
  logExternalServiceCall(demoId: string, service: string, prompt: string, response?: any): void {
    this.demoLogger.info(`EXTERNAL SERVICE CALL: ${service.toUpperCase()}`, {
      demoId,
      service,
      prompt,
      promptLength: prompt.length,
      responseReceived: !!response,
      responseSize: response ? JSON.stringify(response).length : 0,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log V0.dev specific interactions
   */
  logV0DevCall(demoId: string, prompt: string, response?: any): void {
    this.demoLogger.info('V0.DEV API CALL', {
      demoId,
      prompt,
      promptLength: prompt.length,
      framework: 'react',
      styling: 'tailwindcss',
      response: response ? {
        componentId: response.componentId,
        codeLength: response.code?.length || 0,
        success: !!response.code
      } : null,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get all stored demos metadata
   */
  async getAllDemos(): Promise<any[]> {
    try {
      const files = await fs.readdir(this.options.storageDir);
      const metadataFiles = files.filter(f => f.endsWith('_metadata.json'));

      const demos = await Promise.all(
        metadataFiles.map(async (file) => {
          try {
            const content = await fs.readFile(
              path.join(this.options.storageDir, file),
              'utf-8'
            );
            return JSON.parse(content);
          } catch (error) {
            this.logger.warn('Failed to read demo metadata', { file, error });
            return null;
          }
        })
      );

      return demos.filter(Boolean);
    } catch (error) {
      this.logger.error('Failed to list demos', { error });
      return [];
    }
  }

  /**
   * Clean up old demos (older than specified days)
   */
  async cleanupOldDemos(olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const demos = await this.getAllDemos();
      let deletedCount = 0;

      for (const demo of demos) {
        const createdAt = new Date(demo.created_at);
        if (createdAt < cutoffDate) {
          try {
            await Promise.all([
              fs.unlink(path.join(this.options.storageDir, `${demo.demoId}.json`)),
              fs.unlink(path.join(this.options.storageDir, `${demo.demoId}_metadata.json`))
            ]);

            this.inMemoryCache.delete(demo.demoId);
            deletedCount++;

            this.demoLogger.info('OLD DEMO CLEANED UP', {
              demoId: demo.demoId,
              age: Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
            });
          } catch (error) {
            this.logger.warn('Failed to delete old demo', { demoId: demo.demoId, error });
          }
        }
      }

      this.logger.info('Demo cleanup completed', { deletedCount, olderThanDays });
      return deletedCount;
    } catch (error) {
      this.logger.error('Demo cleanup failed', { error });
      return 0;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<any> {
    try {
      const demos = await this.getAllDemos();
      const cacheSize = this.inMemoryCache.size;

      return {
        total_demos: demos.length,
        in_memory_cache: cacheSize,
        storage_directory: this.options.storageDir,
        log_file: this.options.logFile,
        demos_by_status: demos.reduce((acc, demo) => {
          acc[demo.status] = (acc[demo.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        last_cleanup: null // TODO: Track last cleanup time
      };
    } catch (error) {
      this.logger.error('Failed to get storage stats', { error });
      return {
        total_demos: 0,
        in_memory_cache: this.inMemoryCache.size,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}