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
Generate comprehensive, realistic synthetic data for a Financial Services demo:

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
      "name": "Sarah Chen",
      "role": "Senior Financial Analyst",
      "department": "Investment Banking",
      "experience": "8 years",
      "preferences": {
        "riskTolerance": "moderate-aggressive",
        "communicationChannel": "email",
        "dashboardLayout": "advanced"
      },
      "performance": {
        "tasksCompleted": 1247,
        "accuracy": "97.3%",
        "avgResponseTime": "2.1 hours"
      }
    }
  ],
  "transactions": [
    {
      "id": "txn_2024_087631",
      "type": "Securities Trade",
      "amount": 2456789.50,
      "currency": "USD",
      "timestamp": "2025-01-15T10:32:18Z",
      "status": "completed",
      "counterparty": "Goldman Sachs",
      "security": "AAPL - Apple Inc.",
      "quantity": 15000,
      "pricePerShare": 163.79,
      "riskScore": 0.23,
      "complianceChecks": ["AML: Passed", "KYC: Verified", "Sanctions: Clear"],
      "metadata": {
        "trader": "John Martinez",
        "desk": "Equity Trading",
        "clientAccount": "ACC-847293",
        "commission": 2456.79
      }
    }
  ],
  "portfolios": [
    {
      "accountId": "PORT-2024-4521",
      "customerName": "Michael Johnson",
      "totalValue": 2456789.00,
      "allocation": {
        "stocks": 65,
        "bonds": 25,
        "cash": 5,
        "alternatives": 5
      },
      "performance": {
        "ytdReturn": 12.3,
        "oneYearReturn": 18.7,
        "fiveYearReturn": 9.2,
        "benchmarkComparison": "+2.2% vs S&P 500"
      },
      "holdings": [
        {
          "symbol": "AAPL",
          "name": "Apple Inc.",
          "shares": 1500,
          "currentPrice": 173.50,
          "totalValue": 260250,
          "percentOfPortfolio": 10.6,
          "gainLoss": "+$35,420",
          "gainLossPercent": 15.7
        }
      ]
    }
  ],
  "metrics": [
    {
      "name": "Processing Speed",
      "current": "2.3 minutes",
      "target": "5.0 minutes",
      "improvement": "54% faster",
      "trend": "up",
      "historicalData": [3.2, 2.9, 2.5, 2.3]
    },
    {
      "name": "Cost Savings",
      "current": "$2.8M annually",
      "target": "$2.0M annually",
      "improvement": "40% above target",
      "trend": "up",
      "breakdown": {
        "laborCosts": "$1.6M",
        "operationalEfficiency": "$800K",
        "errorReduction": "$400K"
      }
    },
    {
      "name": "Accuracy Rate",
      "current": "97.3%",
      "target": "95.0%",
      "improvement": "+2.3 percentage points",
      "trend": "stable",
      "errorTypes": {
        "dataEntry": "1.2%",
        "calculation": "0.8%",
        "validation": "0.7%"
      }
    }
  ],
  "performance": {
    "responseTime": "2.3s avg (p50: 1.8s, p95: 4.2s, p99: 7.1s)",
    "throughput": "1,247 requests/hour (peak: 2,100/hour)",
    "accuracy": "97.3% (improved from 89.2% baseline)",
    "availability": "99.94% uptime (SLA: 99.5%)",
    "errorRate": "0.06% (target: <0.1%)",
    "customerSatisfaction": "4.7/5.0 (Net Promoter Score: +68)"
  },
  "workflows": [
    {
      "id": "WF-2024-09831",
      "name": "KYC Document Verification",
      "status": "In Progress",
      "priority": "High",
      "assignedTo": "Sarah Chen",
      "customer": "Acme Financial Corp",
      "accountNumber": "ACC-847293",
      "startTime": "2025-01-15T09:15:00Z",
      "estimatedCompletion": "2025-01-15T11:30:00Z",
      "progress": 65,
      "checksPassed": 12,
      "checksFailed": 0,
      "checksPending": 6,
      "riskLevel": "Low",
      "complianceFlags": []
    }
  ],
  "alerts": [
    {
      "id": "ALERT-2024-1523",
      "severity": "Medium",
      "type": "Compliance",
      "message": "Transaction pattern anomaly detected for Account ACC-738291",
      "timestamp": "2025-01-15T10:42:00Z",
      "status": "Under Review",
      "assignedTo": "Compliance Team",
      "affectedAccounts": ["ACC-738291"],
      "recommendedAction": "Review transaction history for past 30 days"
    }
  ],
  "insights": [
    {
      "category": "Cost Optimization",
      "title": "Automate repetitive data entry tasks",
      "description": "45% of analyst time spent on manual data entry could be automated, saving $1.2M annually",
      "impact": "High",
      "effort": "Medium",
      "roi": "340%",
      "timeToValue": "3-4 months"
    }
  ]
}

Create rich, professional data with specific financial details, realistic metrics, and clear business value demonstration. Include at least 3-5 items in each array.`;
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