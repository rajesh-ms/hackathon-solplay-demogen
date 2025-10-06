/**
 * V0.dev Client Service
 * Professional React component generation using v0.dev SDK
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { createClient } from 'v0-sdk';
import winston from 'winston';
import { UseCaseData } from '../types/azure-openai';

export interface V0Config {
  apiKey: string;
  baseUrl: string;
  maxTokens: number;
  timeoutMs: number;
}

export interface V0GenerationOptions {
  framework: 'react' | 'vue' | 'angular';
  styling: 'tailwindcss' | 'css' | 'styled-components';
  complexity: 'simple' | 'moderate' | 'complex';
  responsive: boolean;
}

export interface V0Response {
  componentId: string;
  code: string;
  preview: string;
  metadata: {
    framework: string;
    styling: string;
    generatedAt: string;
    complexity: string;
  };
}

export class V0ClientService {
  private client: AxiosInstance;
  private v0SDK: any;
  private config: V0Config;
  private logger: winston.Logger;
  private requestCount = 0;

  constructor(logger: winston.Logger) {
    this.logger = logger;
    this.config = this.loadConfiguration();
    this.client = this.createHttpClient();
    // Create configured v0 SDK client
    this.v0SDK = createClient({
      apiKey: this.config.apiKey
    });
  }

  private loadConfiguration(): V0Config {
    const apiKey = process.env.V0_API_KEY;
    const baseUrl = process.env.V0_BASE_URL || 'https://api.v0.dev/v1';

    if (!apiKey) {
      throw new Error('V0_API_KEY is required');
    }

    console.log('V0.dev Configuration loaded:', {
      hasApiKey: !!apiKey,
      baseUrl,
      apiKeyPrefix: apiKey ? `${apiKey.substring(0, 10)}...` : 'none'
    });

    return {
      apiKey,
      baseUrl,
      maxTokens: parseInt(process.env.V0_MAX_TOKENS || '4000'),
      timeoutMs: parseInt(process.env.V0_TIMEOUT || '60000')
    };
  }

  private createHttpClient(): AxiosInstance {
    return axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeoutMs,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'SolPlay-DemoGen/1.0'
      }
    });
  }

  async generateComponent(options: {
    prompt: string;
    framework?: string;
    styling?: string;
  }): Promise<V0Response> {
    const startTime = Date.now();
    this.requestCount++;

    try {
      this.logger.info('Starting v0.dev component generation via SDK', {
        requestCount: this.requestCount,
        framework: options.framework || 'react',
        styling: options.styling || 'tailwindcss'
      });

      // Use v0-sdk for generation with timeout
      return await Promise.race([
        this.generateWithSDK(options, startTime),
        this.createTimeoutPromise(this.config.timeoutMs)
      ]);
    } catch (error: any) {
      const duration = Date.now() - startTime;

      this.logger.error('All v0.dev generation methods failed', {
        duration,
        error,
        requestCount: this.requestCount
      });

      throw new Error(`v0.dev generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private createTimeoutPromise(timeoutMs: number): Promise<V0Response> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`v0.dev generation timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });
  }

  private async generateWithSDK(options: {
    prompt: string;
    framework?: string;
    styling?: string;
  }, startTime: number): Promise<V0Response> {
    const enhancedPrompt = `Create a comprehensive ${options.framework || 'React'} application using ${options.styling || 'Tailwind CSS'}:

${options.prompt}

CRITICAL REQUIREMENTS FOR DEMO APPLICATION:
1. **Complete Self-Contained Demo** - Use ONLY synthetic/mock data, no external APIs or file uploads needed
2. **Rich Interactive Features** - Multiple tabs, forms, charts, progress bars, and realistic user interactions
3. **Pre-populated Data** - All forms, tables, and displays should show compelling sample data immediately
4. **Professional UI** - Modern design with proper spacing, colors, and responsive layout
5. **Functional Elements** - All buttons, forms, and interactions should work and demonstrate the use case effectively
6. **Comprehensive Content** - Include executive summaries, metrics, charts, and detailed insights
7. **No External Dependencies** - Everything should work without additional setup or API keys

Make this a production-quality demo that showcases real business value with rich, interactive content.`;

    this.logger.info('Sending enhanced prompt to v0.dev SDK', {
      promptLength: enhancedPrompt.length,
      requestCount: this.requestCount
    });

    const chat: any = await this.v0SDK.chats.create({
      message: enhancedPrompt
    });

    const duration = Date.now() - startTime;

    // Handle both ChatDetail and streaming response types
    const chatId = chat.id || `v0_sdk_${Date.now()}`;

    this.logger.info('v0.dev component generated successfully via SDK', {
      duration,
      requestCount: this.requestCount,
      chatId,
      hasFiles: chat.files ? chat.files.length : 0
    });

    // Extract code from chat files if available
    let code = '';
    let preview = `https://v0.dev/chat/${chatId}`;

    if (chat.files && chat.files.length > 0) {
      this.logger.info('Extracting code from v0.dev files', {
        fileCount: chat.files.length,
        fileNames: chat.files.map((f: any) => f.name)
      });

      // Find the main component file
      const mainFile = chat.files.find((f: any) => f.name && (f.name.includes('.tsx') || f.name.includes('.jsx'))) || chat.files[0];
      if (mainFile && mainFile.content) {
        code = mainFile.content;
        this.logger.info('Successfully extracted code from v0.dev', {
          codeLength: code.length,
          fileName: mainFile.name
        });
      } else {
        this.logger.warn('No usable code found in v0.dev files', {
          files: chat.files.map((f: any) => ({ name: f.name, hasContent: !!f.content }))
        });
      }
    } else {
      this.logger.warn('No files returned from v0.dev SDK', { chatId });
    }

    // If no code was extracted, this will trigger fallback in calling method
    if (!code || code.trim().length === 0) {
      this.logger.warn('No usable code extracted from v0.dev response', { chatId });
    }

    return {
      componentId: chatId,
      code,
      preview,
      metadata: {
        framework: options.framework || 'react',
        styling: options.styling || 'tailwindcss',
        generatedAt: new Date().toISOString(),
        complexity: this.assessComplexity(code)
      }
    };
  }

  private async generateWithDirectAPI(options: {
    prompt: string;
    framework?: string;
    styling?: string;
  }, startTime: number): Promise<V0Response> {
    const enhancedPrompt = `Create a ${options.framework || 'React'} component using ${options.styling || 'Tailwind CSS'}:

${options.prompt}

CRITICAL REQUIREMENTS FOR DEMO:
- Use ONLY synthetic/mock data - NO file uploads, external APIs, or user input required
- Pre-populate ALL form fields, data tables, and content areas with realistic sample data
- Include interactive buttons and elements that simulate real functionality
- Make it a completely self-contained demo that works immediately without any setup
- Ensure all data visualizations show compelling sample metrics and charts`;

    // Use v0.dev Model API format (OpenAI-compatible)
    const response = await this.client.post('/v1/chat/completions', {
      model: 'v0-1.5-md',
      messages: [
        {
          role: 'user',
          content: enhancedPrompt
        }
      ],
      max_completion_tokens: this.config.maxTokens
    });

    const duration = Date.now() - startTime;

    // Extract content from OpenAI-compatible response
    const generatedContent = response.data.choices[0]?.message?.content || '';
    const componentId = `v0_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    this.logger.info('v0.dev component generated successfully via direct API', {
      duration,
      requestCount: this.requestCount,
      componentId,
      contentLength: generatedContent.length
    });

    return {
      componentId,
      code: generatedContent,
      preview: `https://v0.dev/chat/${componentId}`,
      metadata: {
        framework: options.framework || 'react',
        styling: options.styling || 'tailwindcss',
        generatedAt: new Date().toISOString(),
        complexity: this.assessComplexity(generatedContent)
      }
    };
  }

  generatePromptFromUseCase(useCase: UseCaseData): string {
    const categoryPrompts = {
      'Content Generation': this.getContentGenerationPrompt(useCase),
      'Process Automation': this.getProcessAutomationPrompt(useCase),
      'Personalized Experience': this.getPersonalizationPrompt(useCase)
    };

    return categoryPrompts[useCase.category as keyof typeof categoryPrompts] || this.getDefaultPrompt(useCase);
  }

  private getContentGenerationPrompt(useCase: UseCaseData): string {
    return `
Create a professional React application for "${useCase.title}" - a Financial Services content generation demo.

Requirements:
- **Business Context**: ${useCase.description}
- **Key Capabilities**: ${useCase.capabilities.join(', ')}

Build a multi-step interface with:
1. **Input Section**: Pre-filled text input forms, parameter controls (NO file upload required - use sample data)
2. **Processing View**: Loading states, progress indicators, AI processing simulation
3. **Results Dashboard**: Generated content display, confidence scores, editing tools
4. **Export Options**: Download buttons, sharing features, refinement controls

Design Requirements:
- Use Tailwind CSS with an attractive color scheme (blues, whites, grays)
- Basic responsive design that works on desktop and tablet
- Clean typography and spacing
- Interactive elements with hover states

IMPORTANT - Include comprehensive synthetic data and pre-filled examples:
- Pre-populated sample documents/text in input fields (earnings reports, analyst notes, market data, 10-K filings)
- Mock processing times (2-5 seconds) with realistic progress indicators showing: "Parsing document...", "Analyzing sentiment...", "Generating insights..."
- Confidence scores (85-98%) with detailed breakdown by category
- Generated sample insights with具体financial metrics ($2.3M cost savings, 45% efficiency gain)
- Pre-loaded demonstration data - NO actual file uploads needed
- Sample financial documents content already displayed in the interface (e.g., "Q4 2024 Earnings Report: Revenue increased 23% YoY to $156M...")
- Rich data tables with 10-20 rows of realistic financial data (transactions, holdings, performance metrics)
- Interactive charts with live data (line charts, bar charts, pie charts showing portfolio allocation, performance trends)
- Realistic dollar amounts ($25K - $5M range), percentages (5% - 95%), and dates (current year)
- Sample customer/client names, account numbers, transaction IDs
- Multi-level data: summary cards with KPIs, detailed tables, drill-down views
- Simulated real-time updates (counters incrementing, status changes, notifications appearing)
- Before/after comparisons showing AI impact with specific metrics

Create a production-ready demo that feels like a real financial services application with enterprise-grade data visualization and meaningful business insights.`;
  }

  private getProcessAutomationPrompt(useCase: UseCaseData): string {
    return `
Create a React dashboard for "${useCase.title}" - a Financial Services process automation demo.

Requirements:
- **Business Context**: ${useCase.description}
- **Automation Capabilities**: ${useCase.capabilities.join(', ')}

Build a workflow automation dashboard with:
1. **Process Overview**: Workflow visualization, status indicators, performance metrics (pre-loaded with sample data)
2. **Task Management**: Active tasks list, priority queues, assignment controls (populated with realistic examples)
3. **Analytics Dashboard**: Success rates, processing times, cost savings charts (with synthetic data)
4. **Monitoring Panel**: Real-time alerts, compliance tracking, audit logs (simulated notifications)

Design Requirements:
- Dashboard aesthetic with data visualization
- Status indicators with color coding (green/yellow/red)
- Card-based layout with clear hierarchy
- Professional Financial Services styling

IMPORTANT - Include comprehensive pre-loaded synthetic data:
- Processing volumes (1,000+ items/day, 25,000/month) with live-updating counters and sparkline trend charts
- Accuracy rates (94-99%) with multi-month trend charts showing continuous improvement
- Time savings (60-80% reduction) with before/after comparisons: "Manual: 4.5 hours → AI: 45 minutes"
- Cost optimization (30-50% savings) with financial impact metrics: "$2.8M annual savings, ROI: 340%"
- Sample workflow tasks with realistic details: "Process KYC verification for Account #AC-2024-7831 - Status: In Review - Priority: High"
- Real-time alerts and notifications: "12 new compliance alerts", "3 workflows completed", "SLA violation detected"
- Audit trail entries with timestamps, user actions, and system responses
- Realistic transaction data: amounts ($125.50 - $2.5M), merchant names, categories, risk scores
- Workflow status distribution: 65% completed, 25% in-progress, 10% pending
- Performance metrics dashboard: throughput (247 items/hour), average processing time (2.3 min), success rate (97.2%)
- Exception handling examples: flagged items, manual review queue, escalation workflows
- Compliance metrics: regulatory checks passed, risk assessment scores, approval chains
- Team productivity metrics: tasks per analyst, time saved per process, workload distribution
- NO file uploads or external data required - everything pre-populated with rich, realistic data

Create an enterprise-grade automation dashboard that demonstrates massive operational improvements and clear ROI with compelling, data-driven visuals.`;
  }

  private getPersonalizationPrompt(useCase: UseCaseData): string {
    return `
Create a React application for "${useCase.title}" - a Financial Services personalization demo.

Requirements:
- **Personalization Focus**: ${useCase.description}
- **AI Capabilities**: ${useCase.capabilities.join(', ')}

Build a personalized customer experience with:
1. **Customer Profile**: Pre-loaded demographics, preferences, financial goals, risk profile (no input required)
2. **AI Recommendations**: Personalized products, investment options, financial advice (based on synthetic profile)
3. **Insights Dashboard**: Spending analysis, savings opportunities, goal tracking (with sample data)
4. **Action Center**: Recommended actions, next steps, goal management (pre-populated)

Design Requirements:
- Customer-centric design with warm, approachable colors
- Personalized cards and recommendations
- Progress bars for financial goals
- Interactive elements for exploring options

IMPORTANT - Include comprehensive pre-loaded synthetic customer data:
- Sample customer profiles with rich details: "Sarah Chen, Age 38, Income: $125K, Risk Tolerance: Moderate-Aggressive, Goals: Retirement at 60 ($2.5M target), Children's Education ($180K needed by 2030)"
- Personalized recommendations with AI reasoning: "Based on your spending patterns and income growth, we recommend increasing 401(k) contributions to 15% (currently 8%) to reach retirement goals 3 years earlier"
- Goal tracking with detailed progress: "Retirement: $485K of $2.5M (19% complete, on track for age 62 with current trajectory)", "Emergency Fund: $32K of $50K (64% complete, excellent progress)"
- Risk assessment with portfolio allocation: "Current: 70% stocks, 25% bonds, 5% cash → Recommended: 75% stocks, 20% bonds, 5% alternative investments for better diversification"
- Investment performance metrics: "YTD Return: +12.3% (S&P 500: +10.1%), 5-year annualized: +8.7%"
- Spending patterns with actionable insights: "Dining: $850/month (+23% vs last year) - Opportunity to save $200/month by reducing to 2 restaurant visits/week"
- Savings opportunities: "Switch to high-yield savings: +$1,200/year additional interest", "Refinance mortgage: Save $15K over 5 years"
- Transaction history with categorization: 15-20 recent transactions with merchants, amounts, categories, and AI-generated tags
- Behavioral analytics: "You typically overspend by 15% in December - consider setting aside $500 extra for holiday season"
- Life event planning: "Upcoming: Home purchase in 2-3 years - recommended savings: $3,500/month for 20% down payment ($120K total)"
- Tax optimization suggestions: "Maximize Roth IRA contribution ($6,500 remaining this year) to reduce taxable income by $8,200"
- NO user input or file uploads required - everything pre-populated with realistic demo data

Create an engaging, personalized financial experience that demonstrates AI-driven insights using comprehensive synthetic customer data.`;
  }

  private getDefaultPrompt(useCase: UseCaseData): string {
    return `
Create a professional React application for "${useCase.title}" in Financial Services.

Requirements:
- **Purpose**: ${useCase.description}
- **Key Features**: ${useCase.capabilities.join(', ')}

Build a comprehensive demo application with:
1. **Main Dashboard**: Overview, key metrics, navigation (pre-loaded with sample data)
2. **Feature Showcase**: Demonstrate core capabilities (using synthetic examples)
3. **Data Visualization**: Charts, tables, progress indicators (populated with realistic data)
4. **User Interface**: Professional, clean, modern design

Design Requirements:
- Use Tailwind CSS for styling
- Responsive design for desktop and tablet
- Professional color scheme appropriate for Financial Services
- Interactive elements and smooth transitions

IMPORTANT - Include comprehensive synthetic demo data:
- Pre-populated charts, metrics, and KPIs relevant to the use case
- Sample transactions, user data, and business scenarios
- Realistic financial data, performance indicators, and analytics
- Interactive elements that demonstrate functionality without requiring external input
- NO file uploads or user data entry required - everything pre-loaded
- Compelling visual presentation suitable for live demonstrations

Make it visually appealing for presentations with fully functional demo interface using realistic synthetic data.`;
  }

  private assessComplexity(code: string): string {
    const lines = code.split('\n').length;
    const hasCharts = /chart|graph|plot/i.test(code);
    const hasAnimations = /animate|transition|motion/i.test(code);
    const hasComplexState = /useState|useEffect|useReducer/g.test(code);
    
    const complexityScore = 
      (lines > 200 ? 2 : lines > 100 ? 1 : 0) +
      (hasCharts ? 1 : 0) +
      (hasAnimations ? 1 : 0) +
      (hasComplexState ? 1 : 0);
    
    if (complexityScore >= 4) return 'complex';
    if (complexityScore >= 2) return 'moderate';
    return 'simple';
  }

  async testConnection(): Promise<boolean> {
    try {
      this.logger.info('Testing v0.dev connection with SDK', {
        sdkConfigured: !!this.v0SDK,
        apiKey: this.config.apiKey ? 'configured' : 'missing',
        baseUrl: this.config.baseUrl
      });

      // Simple connection test - just check if we can create a client
      if (!this.v0SDK) {
        this.logger.error('V0 SDK not configured');
        return false;
      }

      // Test with a simple v0 SDK call
      const testPromise = this.v0SDK.chats.create({
        message: "Test connection - create a simple React button component"
      });

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection test timeout')), 10000);
      });

      const response = await Promise.race([testPromise, timeoutPromise]);

      this.logger.info('v0.dev connection test successful', {
        chatId: response?.id,
        hasResponse: !!response
      });

      return !!(response && (response.id || response.files));
    } catch (error: any) {
      this.logger.warn('v0.dev connection test failed, will use fallback', {
        error: error?.message || error,
        errorType: error?.constructor?.name,
        apiKeyPresent: !!this.config.apiKey
      });

      // Don't fail completely - allow fallback
      return false;
    }
  }

  getStats() {
    return {
      requestCount: this.requestCount,
      baseUrl: this.config.baseUrl,
      isConfigured: !!this.config.apiKey
    };
  }
}