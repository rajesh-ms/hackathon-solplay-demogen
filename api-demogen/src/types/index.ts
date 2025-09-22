import { z } from 'zod';

// API Request/Response Types
export const DemoGenerationRequestSchema = z.object({
  useCaseTitle: z.string()
    .min(3, 'Use case title must be at least 3 characters')
    .max(200, 'Use case title must be less than 200 characters')
    .regex(/^[a-zA-Z0-9\s\-_.,!?()]+$/, 'Use case title contains invalid characters'),
  
  keyCapabilities: z.array(
    z.string()
      .min(2, 'Capability must be at least 2 characters')
      .max(100, 'Capability must be less than 100 characters')
      .regex(/^[a-zA-Z0-9\s\-_.,!?()]+$/, 'Capability contains invalid characters')
  )
    .min(1, 'At least one capability is required')
    .max(10, 'Maximum 10 capabilities allowed'),
  
  targetAudience: z.string()
    .max(100, 'Target audience must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_.,!?()]*$/, 'Target audience contains invalid characters')
    .optional(),
  
  industryVertical: z.enum(['fintech', 'healthcare', 'ecommerce', 'education', 'manufacturing', 'other'])
    .optional(),
  
  uiStylePreferences: z.object({
    colorScheme: z.enum(['light', 'dark', 'auto']).optional(),
    componentLibrary: z.enum(['shadcn', 'mui', 'chakra', 'tailwind']).optional(),
    layoutStyle: z.enum(['dashboard', 'landing', 'app', 'portal']).optional()
  }).optional(),
  
  syntheticDataRequirements: z.object({
    dataTypes: z.array(
      z.enum(['user_profiles', 'transactions', 'analytics', 'inventory', 'communications', 'documents'])
    ).max(5, 'Maximum 5 data types allowed'),
    recordCount: z.number().min(10).max(1000).optional(),
    realismLevel: z.enum(['basic', 'detailed', 'enterprise']).optional()
  }).optional()
});

export type DemoGenerationRequest = z.infer<typeof DemoGenerationRequestSchema>;

export interface DemoGenerationResponse {
  demoId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  demoUrl?: string;
  componentCode?: string;
  syntheticData?: any;
  v0PromptLogs?: V0PromptLog[];
  metadata: {
    generatedAt: string;
    processingTime?: number;
    tokensUsed?: number;
    capabilities: string[];
    uiComponents?: string[];
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface DemoStatusResponse {
  demoId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  estimatedCompletion?: string;
  currentStep?: string;
  error?: {
    code: string;
    message: string;
  };
}

// v0 SDK Integration Types
export interface V0GenerationRequest {
  prompt: string;
  framework: 'react' | 'vue' | 'angular';
  styling: 'tailwindcss' | 'css' | 'styled-components';
  options?: {
    typescript?: boolean;
    responsive?: boolean;
    darkMode?: boolean;
  };
}

export interface V0GenerationResponse {
  id: string;
  code: string;
  preview_url?: string;
  assets?: string[];
  metadata: {
    tokens_used: number;
    generation_time: number;
    framework: string;
    styling: string;
  };
}

export interface V0PromptLog {
  id: string;
  demoId: string;
  timestamp: string;
  prompt: string;
  response?: V0GenerationResponse;
  error?: string;
  tokenCount: number;
  processingTime: number;
  requestHash: string;
}

// Security Types
export interface APIKeyData {
  id: string;
  key: string;
  hashedKey: string;
  name: string;
  permissions: {
    rateLimit: number;
    allowedEndpoints: string[];
    ipWhitelist?: string[];
    refererWhitelist?: string[];
  };
  usage: {
    requestCount: number;
    lastUsed?: string;
    totalTokensUsed: number;
  };
  status: 'active' | 'suspended' | 'revoked';
  createdAt: string;
  expiresAt?: string;
}

export interface SecurityEvent {
  eventId: string;
  eventType: 'RATE_LIMIT_EXCEEDED' | 'INVALID_API_KEY' | 'SUSPICIOUS_INPUT' | 'CODE_INJECTION_ATTEMPT' | 'UNAUTHORIZED_ACCESS';
  timestamp: string;
  sourceIP: string;
  apiKey?: string;
  endpoint: string;
  userAgent: string;
  payload?: any;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  action?: 'LOGGED' | 'BLOCKED' | 'RATE_LIMITED' | 'KEY_REVOKED';
}

export interface AuditEvent {
  eventId: string;
  timestamp: string;
  userId?: string;
  apiKey: string;
  action: string;
  resource: string;
  outcome: 'SUCCESS' | 'FAILURE';
  ipAddress: string;
  userAgent: string;
  changes?: any;
  signature?: string;
  hash?: string;
}

// Synthetic Data Types
export interface SyntheticDataConfig {
  type: 'user_profiles' | 'transactions' | 'analytics' | 'inventory' | 'communications' | 'documents';
  count: number;
  realism: 'basic' | 'detailed' | 'enterprise';
  industry?: string;
  locale?: string;
}

export interface GeneratedSyntheticData {
  type: string;
  data: any[];
  metadata: {
    count: number;
    generatedAt: string;
    schema: any;
    quality: 'basic' | 'detailed' | 'enterprise';
  };
}

// Configuration Types
export interface AppConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  api: {
    version: string;
    basePath: string;
  };
  security: {
    jwtSecret: string;
    jwtExpiresIn: string;
    apiKeyPrefix: string;
    bcryptRounds: number;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    burst: number;
  };
  database: {
    url: string;
    pool: {
      min: number;
      max: number;
    };
  };
  redis: {
    url: string;
  };
  azure: {
    storageConnectionString: string;
    keyVaultUrl: string;
    tenantId: string;
    clientId: string;
    clientSecret: string;
  };
  v0: {
    apiKey: string;
    baseUrl: string;
    maxTokens: number;
    timeoutMs: number;
  };
  logging: {
    level: string;
    format: 'json' | 'simple';
    enableRequestLogging: boolean;
  };
  cors: {
    origins: string[];
  };
  demo: {
    cacheTtl: number;
    maxSizeMB: number;
    cleanupIntervalHours: number;
  };
}

// Database Models
export interface Demo {
  id: string;
  title: string;
  capabilities: string[];
  targetAudience?: string;
  industryVertical?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  componentCode?: string;
  syntheticData?: any;
  demoUrl?: string;
  metadata: any;
  createdAt: string;
  updatedAt: string;
  createdBy: string; // API key ID
}

export interface DemoTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  industryVertical: string;
  capabilities: string[];
  templateCode: string;
  syntheticDataTemplate: any;
  metadata: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Error Types
export interface APIError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
  timestamp: string;
  requestId: string;
}

export class APIErrorClass extends Error {
  public code: string;
  public statusCode: number;
  public details?: any;
  public timestamp: string;
  public requestId: string;

  constructor(code: string, message: string, statusCode: number = 500, details?: any, requestId?: string) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.requestId = requestId || '';
  }
}

// Express Request Extensions
declare global {
  namespace Express {
    interface Request {
      apiKey?: APIKeyData;
      user?: any;
      requestId: string;
      startTime: number;
    }
  }
}