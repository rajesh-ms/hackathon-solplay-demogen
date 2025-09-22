/**
 * Azure OpenAI Service
 * Secure, production-ready Azure OpenAI integration for AI-powered demo content generation
 */

import { AzureOpenAI } from 'openai';
import { DefaultAzureCredential } from '@azure/identity';
import winston from 'winston';
import { 
  AzureOpenAIConfig, 
  AIContentCapabilities,
  UseCaseInput,
  EnhancedUseCaseData,
  DemoContext,
  SyntheticDataSet,
  BusinessNarrative,
  DemoScript,
  DetailedUserJourney,
  UseCaseData,
  AIRequest,
  AIResponse
} from '../types/azure-openai';

export class AzureOpenAIService implements AIContentCapabilities {
  private client: AzureOpenAI | null = null;
  private config: AzureOpenAIConfig;
  private logger: winston.Logger;
  private requestCount = 0;
  private totalCost = 0;

  constructor(logger: winston.Logger) {
    this.logger = logger;
    this.config = this.loadConfiguration();
  }

  private loadConfiguration(): AzureOpenAIConfig {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-04-01-preview';
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4-1106-preview';

    if (!endpoint) {
      throw new Error('AZURE_OPENAI_ENDPOINT is required');
    }

    return {
      endpoint,
      apiVersion,
      deploymentName,
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      contentSettings: {
        maxTokens: parseInt(process.env.AZURE_OPENAI_MAX_TOKENS || '4000'),
        temperature: parseFloat(process.env.AZURE_OPENAI_TEMPERATURE || '0.7'),
        topP: parseFloat(process.env.AZURE_OPENAI_TOP_P || '0.9'),
        presencePenalty: parseFloat(process.env.AZURE_OPENAI_PRESENCE_PENALTY || '0.1'),
        frequencyPenalty: parseFloat(process.env.AZURE_OPENAI_FREQUENCY_PENALTY || '0.1'),
      }
    };
  }

  async initialize(): Promise<void> {
    try {
      if (process.env.USE_MANAGED_IDENTITY === 'true') {
        await this.initializeWithManagedIdentity();
      } else {
        await this.initializeWithApiKey();
      }
      
      // Test connection
      await this.testConnection();
      this.logger.info('Azure OpenAI service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Azure OpenAI service', { error });
      throw error;
    }
  }

  private async initializeWithManagedIdentity(): Promise<void> {
    // Fallback: for now just log that managed identity would be used; rely on apiKey if provided
    // The new AzureOpenAI client (openai package) expects azureADTokenProvider for MI which we skip if unavailable.
    this.logger.info('Managed Identity initialization placeholder (using API key if present)');
  }

  private async initializeWithApiKey(): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('AZURE_OPENAI_API_KEY is required when not using managed identity');
    }

    this.client = new AzureOpenAI({
      endpoint: this.config.endpoint,
      apiKey: this.config.apiKey,
      apiVersion: this.config.apiVersion,
      deployment: this.config.deploymentName
    });

    this.logger.info('Azure OpenAI initialized with API Key');
  }

  private async testConnection(): Promise<void> {
    if (!this.client) {
      throw new Error('Azure OpenAI client not initialized');
    }

    const testResponse = await this.client.chat.completions.create({
      model: this.config.deploymentName,
      messages: [{ role: 'user', content: 'Test connection' }],
      max_tokens: 10,
      temperature: 0
    });

    if (!testResponse.choices?.[0]?.message?.content) {
      throw new Error('Azure OpenAI connection test failed');
    }
  }

  async enhanceUseCase(basicUseCase: UseCaseInput): Promise<EnhancedUseCaseData> {
    const prompt = this.createUseCaseEnhancementPrompt(basicUseCase);
    
    try {
      const response = await this.makeAIRequest(prompt, 2000);
      const enhanced = this.parseUseCaseEnhancement(response.content, basicUseCase);
      
      this.logger.info('Use case enhanced successfully', {
        title: basicUseCase.useCaseTitle,
        confidence: enhanced.confidence
      });
      
      return enhanced;
    } catch (error) {
      this.logger.error('Failed to enhance use case', { error, useCase: basicUseCase.useCaseTitle });
      throw error;
    }
  }

  async generateSyntheticData(context: DemoContext): Promise<SyntheticDataSet> {
    const prompt = this.createSyntheticDataPrompt(context);
    
    try {
      const response = await this.makeAIRequest(prompt, 1500);
      const syntheticData = this.parseSyntheticData(response.content, context);
      
      this.logger.info('Synthetic data generated', {
        category: context.category,
        dataSize: syntheticData.users?.length || 0
      });
      
      return syntheticData;
    } catch (error) {
      this.logger.error('Failed to generate synthetic data', { error, context });
      throw error;
    }
  }

  async createBusinessNarrative(useCase: UseCaseData): Promise<BusinessNarrative> {
    const prompt = this.createBusinessNarrativePrompt(useCase);
    
    try {
      const response = await this.makeAIRequest(prompt, 1800);
      const narrative = this.parseBusinessNarrative(response.content);
      
      this.logger.info('Business narrative created', {
        title: useCase.title,
        benefits: narrative.keyBenefits?.length || 0
      });
      
      return narrative;
    } catch (error) {
      this.logger.error('Failed to create business narrative', { error, useCase: useCase.title });
      throw error;
    }
  }

  async generateDemoScript(demoComponents: any): Promise<DemoScript> {
    const prompt = this.createDemoScriptPrompt(demoComponents);
    
    try {
      const response = await this.makeAIRequest(prompt, 2000);
      const script = this.parseDemoScript(response.content);
      
      this.logger.info('Demo script generated', {
        steps: script.demonstration?.length || 0
      });
      
      return script;
    } catch (error) {
      this.logger.error('Failed to generate demo script', { error });
      throw error;
    }
  }

  async enhanceUserJourney(basicJourney: string[]): Promise<DetailedUserJourney> {
    const prompt = this.createUserJourneyPrompt(basicJourney);
    
    try {
      const response = await this.makeAIRequest(prompt, 1500);
      const journey = this.parseUserJourney(response.content);
      
      this.logger.info('User journey enhanced', {
        steps: journey.steps?.length || 0
      });
      
      return journey;
    } catch (error) {
      this.logger.error('Failed to enhance user journey', { error, basicJourney });
      throw error;
    }
  }

  private async makeAIRequest(prompt: string, maxTokens: number): Promise<AIResponse> {
    if (!this.client) {
      throw new Error('Azure OpenAI client not initialized');
    }

    const startTime = Date.now();
    this.requestCount++;

    try {
      const response = await this.client.chat.completions.create({
        model: this.config.deploymentName,
        messages: [
          {
            role: 'system',
            content: 'You are an expert AI assistant specializing in creating professional, compelling demo applications for Financial Services. Provide detailed, realistic, and business-focused responses in JSON format when requested.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: Math.min(maxTokens, this.config.contentSettings.maxTokens),
        temperature: this.config.contentSettings.temperature,
        top_p: this.config.contentSettings.topP,
        presence_penalty: this.config.contentSettings.presencePenalty,
        frequency_penalty: this.config.contentSettings.frequencyPenalty
      });

      const duration = Date.now() - startTime;
      const cost = this.calculateCost(response.usage);
      this.totalCost += cost;

      this.logger.info('Azure OpenAI request completed', {
        duration,
        tokens: response.usage?.total_tokens || 0,
        cost: cost.toFixed(4),
        requestCount: this.requestCount
      });

      return {
        content: response.choices[0]?.message?.content || '',
        usage: response.usage as any,
        status: 200
      } as any;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error('Azure OpenAI request failed', {
        error: error.message,
        duration,
        requestCount: this.requestCount
      });
      
      throw new Error(`Azure OpenAI request failed: ${error.message}`);
    }
  }

  private calculateCost(usage: any): number {
    if (!usage) return 0;
    
    // GPT-4 pricing (approximate)
    const promptCostPer1K = 0.03;  // $0.03 per 1K prompt tokens
    const completionCostPer1K = 0.06;  // $0.06 per 1K completion tokens
    
    const promptCost = (usage.prompt_tokens / 1000) * promptCostPer1K;
    const completionCost = (usage.completion_tokens / 1000) * completionCostPer1K;
    
    return promptCost + completionCost;
  }

  private createUseCaseEnhancementPrompt(useCase: UseCaseInput): string {
    return `
Enhance this Financial Services AI use case with professional details:

**Input:**
- Title: ${useCase.useCaseTitle}
- Key Capabilities: ${useCase.keyCapabilities.join(', ')}
- Description: ${useCase.description || 'Not provided'}
- Category: ${useCase.category || 'Not specified'}
- Target Audience: ${useCase.targetAudience || 'Financial Services professionals'}
- Industry Vertical: ${useCase.industryVertical || 'Financial Services'}

**Required Response Format (JSON):**
{
  "enhancedDescription": "Detailed 2-3 sentence description highlighting business value",
  "inferredCategory": "Content Generation | Process Automation | Personalized Experience",
  "enhancedCapabilities": ["Enhanced capability 1", "Enhanced capability 2", ...],
  "detailedUserJourney": [
    {
      "step": 1,
      "title": "Journey step title",
      "description": "What happens in this step",
      "userAction": "What the user does",
      "systemResponse": "How the system responds",
      "timeEstimate": "Estimated duration"
    }
  ],
  "successMetrics": [
    {
      "name": "Metric name",
      "value": "Specific value with units",
      "improvement": "% improvement",
      "category": "efficiency | cost | quality | satisfaction"
    }
  ],
  "confidence": 0.95
}

Focus on realistic Financial Services scenarios with quantifiable business benefits.`;
  }

  private createSyntheticDataPrompt(context: DemoContext): string {
    return `
Generate realistic synthetic data for a Financial Services demo:

**Context:**
- Category: ${context.category}
- Capabilities: ${context.capabilities.join(', ')}
- Target Audience: ${context.targetAudience || 'Financial Services professionals'}
- Industry: ${context.industryVertical || 'Financial Services'}

**Required Response Format (JSON):**
{
  "users": [
    {
      "id": "user_001",
      "name": "Professional name",
      "role": "Job title",
      "department": "Department",
      "experience": "Years of experience",
      "preferences": {}
    }
  ],
  "transactions": [
    {
      "id": "txn_001",
      "type": "Transaction type",
      "amount": 1000.00,
      "currency": "USD",
      "timestamp": "ISO date",
      "status": "completed",
      "metadata": {}
    }
  ],
  "metrics": [
    {
      "name": "Performance metric",
      "current": "Current value",
      "target": "Target value",
      "trend": "up | down | stable"
    }
  ],
  "performance": {
    "responseTime": "2.3s",
    "throughput": "1,247 requests/hour",
    "accuracy": "94.7%",
    "availability": "99.9%"
  }
}

Create realistic, professional data that demonstrates clear business value.`;
  }

  private createBusinessNarrativePrompt(useCase: UseCaseData): string {
    return `
Create a compelling business narrative for this Financial Services AI solution:

**Use Case:** ${useCase.title}
**Category:** ${useCase.category}
**Description:** ${useCase.description}
**Capabilities:** ${useCase.capabilities.join(', ')}

**Required Response Format (JSON):**
{
  "executiveSummary": "2-3 sentence executive summary highlighting ROI",
  "problemStatement": "Clear problem this solves",
  "solutionOverview": "How the AI solution addresses the problem",
  "keyBenefits": [
    "Specific business benefit 1",
    "Specific business benefit 2",
    "Specific business benefit 3"
  ],
  "roi": {
    "timeSavings": "60% reduction in processing time",
    "costReduction": "$2.3M annual savings",
    "productivityIncrease": "40% increase in analyst productivity",
    "qualityImprovement": "15% improvement in accuracy"
  },
  "testimonials": [
    {
      "author": "Professional Name",
      "role": "Senior Position",
      "company": "Financial Institution",
      "quote": "Compelling testimonial quote",
      "impact": "Specific impact achieved"
    }
  ]
}

Focus on quantifiable business outcomes and realistic Financial Services scenarios.`;
  }

  private createDemoScriptPrompt(demoComponents: any): string {
    return `
Create a professional demo script for this Financial Services AI solution:

**Demo Components:** ${JSON.stringify(demoComponents, null, 2)}

**Required Response Format (JSON):**
{
  "introduction": "Engaging 30-second introduction",
  "keyDemoPoints": [
    {
      "title": "Demo point title",
      "description": "What this demonstrates",
      "duration": "2 minutes",
      "visualElements": ["UI element", "Chart", "Dashboard"]
    }
  ],
  "demonstration": [
    {
      "stepNumber": 1,
      "title": "Demo step title",
      "action": "What to do/click/show",
      "expectedOutcome": "What the audience should see",
      "talkingPoints": ["Key point 1", "Key point 2"]
    }
  ],
  "conclusion": "Strong closing with clear next steps",
  "callToAction": "Specific next step for the audience"
}

Create a compelling 5-7 minute demo flow that showcases business value.`;
  }

  private createUserJourneyPrompt(basicJourney: string[]): string {
    return `
Enhance this user journey with detailed Financial Services context:

**Basic Journey:** ${basicJourney.join(' → ')}

**Required Response Format (JSON):**
{
  "steps": [
    {
      "step": 1,
      "title": "Step title",
      "description": "Detailed step description",
      "userAction": "What the user does",
      "systemResponse": "How the system responds",
      "timeEstimate": "Estimated duration",
      "painPoint": "Current challenge (if any)",
      "improvement": "How AI improves this step"
    }
  ],
  "painPoints": ["Current pain point 1", "Current pain point 2"],
  "improvements": ["AI improvement 1", "AI improvement 2"],
  "timeline": "Total journey time with AI improvements"
}

Focus on realistic Financial Services workflows and quantifiable improvements.`;
  }

  private parseUseCaseEnhancement(content: string, originalInput: UseCaseInput): EnhancedUseCaseData {
    try {
      const parsed = JSON.parse(content);
      
      return {
        title: originalInput.useCaseTitle,
        category: parsed.inferredCategory || originalInput.category || 'Content Generation',
        description: parsed.enhancedDescription || originalInput.description || `${originalInput.useCaseTitle} demonstrating ${originalInput.keyCapabilities.join(', ')}`,
        capabilities: parsed.enhancedCapabilities || originalInput.keyCapabilities,
        userJourney: parsed.detailedUserJourney || { steps: [], painPoints: [], improvements: [], timeline: '' },
        successMetrics: parsed.successMetrics || [],
        demoFeatures: [],
        sampleData: {
          users: [],
          transactions: [],
          metrics: [],
          interactions: [],
          performance: { responseTime: '', throughput: '', accuracy: '', availability: '' },
          realistic: false
        },
        businessNarrative: {
          executiveSummary: '',
          problemStatement: '',
          solutionOverview: '',
          keyBenefits: [],
          roi: { timeSavings: '', costReduction: '', productivityIncrease: '', qualityImprovement: '' },
          testimonials: []
        },
        confidence: parsed.confidence || 0.8
      };
    } catch (error) {
      this.logger.error('Failed to parse use case enhancement', { error, content });
      throw new Error('Invalid AI response format for use case enhancement');
    }
  }

  private parseSyntheticData(content: string, context: DemoContext): SyntheticDataSet {
    try {
      const parsed = JSON.parse(content);
      
      return {
        users: parsed.users || [],
        transactions: parsed.transactions || [],
        metrics: parsed.metrics || [],
        interactions: [],
        performance: parsed.performance || {
          responseTime: '2.3s',
          throughput: '1,000 req/hr',
          accuracy: '95%',
          availability: '99.9%'
        },
        realistic: true
      };
    } catch (error) {
      this.logger.error('Failed to parse synthetic data', { error, content });
      throw new Error('Invalid AI response format for synthetic data');
    }
  }

  private parseBusinessNarrative(content: string): BusinessNarrative {
    try {
      const parsed = JSON.parse(content);
      
      return {
        executiveSummary: parsed.executiveSummary || '',
        problemStatement: parsed.problemStatement || '',
        solutionOverview: parsed.solutionOverview || '',
        keyBenefits: parsed.keyBenefits || [],
        roi: parsed.roi || {
          timeSavings: '',
          costReduction: '',
          productivityIncrease: '',
          qualityImprovement: ''
        },
        testimonials: parsed.testimonials || []
      };
    } catch (error) {
      this.logger.error('Failed to parse business narrative', { error, content });
      throw new Error('Invalid AI response format for business narrative');
    }
  }

  private parseDemoScript(content: string): DemoScript {
    try {
      const parsed = JSON.parse(content);
      
      return {
        introduction: parsed.introduction || '',
        keyDemoPoints: parsed.keyDemoPoints || [],
        demonstration: parsed.demonstration || [],
        conclusion: parsed.conclusion || '',
        callToAction: parsed.callToAction || ''
      };
    } catch (error) {
      this.logger.error('Failed to parse demo script', { error, content });
      throw new Error('Invalid AI response format for demo script');
    }
  }

  private parseUserJourney(content: string): DetailedUserJourney {
    try {
      const parsed = JSON.parse(content);
      
      return {
        steps: parsed.steps || [],
        painPoints: parsed.painPoints || [],
        improvements: parsed.improvements || [],
        timeline: parsed.timeline || ''
      };
    } catch (error) {
      this.logger.error('Failed to parse user journey', { error, content });
      throw new Error('Invalid AI response format for user journey');
    }
  }

  getStats() {
    return {
      requestCount: this.requestCount,
      totalCost: this.totalCost,
      averageCost: this.requestCount > 0 ? this.totalCost / this.requestCount : 0
    };
  }
}