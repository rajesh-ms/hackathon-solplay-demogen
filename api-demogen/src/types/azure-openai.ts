/**
 * Azure OpenAI Integration Types
 * Enhanced types for AI-powered demo generation capabilities
 */

import { DefaultAzureCredential } from '@azure/identity';

export interface AzureOpenAIConfig {
  endpoint: string;
  apiKey?: string | undefined;
  apiVersion: string;
  deploymentName: string;
  
  // Managed Identity (Preferred)
  credential?: DefaultAzureCredential;
  tokenProvider?: any;
  
  // Content Generation Settings
  contentSettings: {
    maxTokens: number;
    temperature: number;
    topP: number;
    presencePenalty: number;
    frequencyPenalty: number;
  };
}

export interface AIContentCapabilities {
  enhanceUseCase(basicUseCase: UseCaseInput): Promise<EnhancedUseCaseData>;
  generateSyntheticData(context: DemoContext): Promise<SyntheticDataSet>;
  createBusinessNarrative(useCase: UseCaseData): Promise<BusinessNarrative>;
  generateDemoScript(demoComponents: any): Promise<DemoScript>;
  enhanceUserJourney(basicJourney: string[]): Promise<DetailedUserJourney>;
}

export interface UseCaseInput {
  useCaseTitle: string;
  keyCapabilities: string[];
  description?: string;
  category?: string;
  targetAudience?: string;
  industryVertical?: string;
}

export interface EnhancedUseCaseData {
  title: string;
  category: string;
  description: string;
  capabilities: string[];
  userJourney: DetailedUserJourney;
  successMetrics: SuccessMetric[];
  demoFeatures: DemoFeature[]; // flattened list of features
  sampleData: SyntheticDataSet; // synthetic data set
  businessNarrative: BusinessNarrative;
  confidence: number;
}

export interface DemoContext {
  category: string;
  capabilities: string[];
  targetAudience?: string;
  industryVertical?: string;
}

export interface SyntheticDataSet {
  users: any[];
  transactions: any[];
  metrics: any[];
  interactions: any[];
  performance: PerformanceMetrics;
  realistic: boolean;
}

export interface BusinessNarrative {
  executiveSummary: string;
  problemStatement: string;
  solutionOverview: string;
  keyBenefits: string[];
  roi: ROIMetrics;
  testimonials: Testimonial[];
}

export interface DemoScript {
  introduction: string;
  keyDemoPoints: DemoPoint[];
  demonstration: DemoStep[];
  conclusion: string;
  callToAction: string;
}

export interface DetailedUserJourney {
  steps: JourneyStep[];
  painPoints: string[];
  improvements: string[];
  timeline: string;
}

export interface JourneyStep {
  step: number;
  title: string;
  description: string;
  userAction: string;
  systemResponse: string;
  timeEstimate: string;
  painPoint?: string;
  improvement?: string;
}

export interface SuccessMetric {
  name: string;
  value: string;
  improvement: string;
  category: 'efficiency' | 'cost' | 'quality' | 'satisfaction';
}

export interface DemoFeature {
  name: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  complexity: 'simple' | 'moderate' | 'complex';
  components: string[];
  interactions: string[];
}

export interface PerformanceMetrics {
  responseTime: string;
  throughput: string;
  accuracy: string;
  availability: string;
}

export interface ROIMetrics {
  timeSavings: string;
  costReduction: string;
  productivityIncrease: string;
  qualityImprovement: string;
}

export interface Testimonial {
  author: string;
  role: string;
  company: string;
  quote: string;
  impact: string;
}

export interface DemoPoint {
  title: string;
  description: string;
  duration: string;
  visualElements: string[];
}

export interface DemoStep {
  stepNumber: number;
  title: string;
  action: string;
  expectedOutcome: string;
  talkingPoints: string[];
}

export interface UseCaseData {
  title: string;
  category: string;
  description: string;
  capabilities: string[];
  userJourney: string[];
  successMetrics: string[];
  demoFeatures: any;
  sampleData: any;
}

export interface AIRequest {
  prompt: string;
  maxTokens: number;
  temperature: number;
  estimatedTokens: number;
  deployment: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  status?: number;
  error?: string;
}

export interface SecurityViolation {
  type: string;
  userAgent: string;
  ip: string;
  path: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ServiceCosts {
  azureOpenAI: number;
  v0: number;
  total: number;
  currency: string;
}

export interface DemoMetadata {
  generatedAt: string;
  generatedBy: string[];
  version: string;
  category: string;
  complexity: string;
  estimatedDemoTime: string;
  localDeployment?: {
    url: string;
    port: number;
    directory: string;
    deployedAt: string;
  };
}

export interface EnhancedDemoResponse {
  demoId: string;
  status: 'processing' | 'ai_enhancing' | 'v0_generating' | 'completed' | 'error';
  
  progress: {
    percentage: number;
    currentStep: string;
    estimatedTimeRemaining: number;
    steps: {
      inputValidation: 'completed' | 'processing' | 'pending';
      aiEnhancement: 'completed' | 'processing' | 'pending';
      v0Generation: 'completed' | 'processing' | 'pending';
      contentMerging: 'completed' | 'processing' | 'pending';
      finalization: 'completed' | 'processing' | 'pending';
    };
  };
  
  aiPreview?: {
    enhancedDescription: string;
    suggestedCategory: string;
    inferredCapabilities: string[];
    generatedUserJourney: string[];
    syntheticDataPreview: any;
    confidence: number;
  };
  
  demo?: {
    v0Component: any;
    aiEnhancedContent: any;
    syntheticData: any;
    demoScript: string;
    metadata: DemoMetadata;
    liveDemoUrl?: string | undefined;
  };
  
  generatedBy: {
    v0: boolean;
    azureOpenAI: boolean;
    timestamp: string;
    costs: ServiceCosts;
  };
}