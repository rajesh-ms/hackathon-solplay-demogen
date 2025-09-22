import dotenv from 'dotenv';
import { AppConfig } from '../types';

// Load environment variables
dotenv.config();

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  
  api: {
    version: process.env.API_VERSION || 'v1',
    basePath: process.env.API_BASE_PATH || '/api/v1'
  },
  
  security: {
    jwtSecret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    apiKeyPrefix: process.env.API_KEY_PREFIX || 'demogen_dev_',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10)
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000', 10), // 1 hour
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    burst: parseInt(process.env.RATE_LIMIT_BURST || '10', 10)
  },
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/api_demogen_dev',
    pool: {
      min: 2,
      max: 10
    }
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  
  azure: {
    storageConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
    keyVaultUrl: process.env.AZURE_KEY_VAULT_URL || '',
    tenantId: process.env.AZURE_TENANT_ID || '',
    clientId: process.env.AZURE_CLIENT_ID || '',
    clientSecret: process.env.AZURE_CLIENT_SECRET || ''
  },
  
  v0: {
    apiKey: process.env.V0_API_KEY || '',
    baseUrl: process.env.V0_BASE_URL || 'https://v0.dev/api',
    maxTokens: parseInt(process.env.V0_MAX_TOKENS || '4000', 10),
    timeoutMs: parseInt(process.env.V0_TIMEOUT_MS || '30000', 10)
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: (process.env.LOG_FORMAT as 'json' | 'simple') || 'json',
    enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING === 'true'
  },
  
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000']
  },
  
  demo: {
    cacheTtl: parseInt(process.env.DEMO_CACHE_TTL || '3600', 10), // 1 hour
    maxSizeMB: parseInt(process.env.MAX_DEMO_SIZE_MB || '10', 10),
    cleanupIntervalHours: parseInt(process.env.DEMO_CLEANUP_INTERVAL_HOURS || '24', 10)
  }
};

// Validation function
export function validateConfig(): void {
  const required = [
    'V0_API_KEY',
    'JWT_SECRET',
    'DATABASE_URL',
    'REDIS_URL'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  if (config.nodeEnv === 'production') {
    const productionRequired = [
      'AZURE_STORAGE_CONNECTION_STRING',
      'AZURE_KEY_VAULT_URL',
      'AZURE_TENANT_ID',
      'AZURE_CLIENT_ID',
      'AZURE_CLIENT_SECRET'
    ];
    
    const missingProduction = productionRequired.filter(key => !process.env[key]);
    
    if (missingProduction.length > 0) {
      console.warn(`Missing production environment variables: ${missingProduction.join(', ')}`);
    }
  }
}

export default config;