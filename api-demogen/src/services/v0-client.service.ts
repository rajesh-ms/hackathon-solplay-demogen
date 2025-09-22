/**
 * V0.dev Client Service
 * Professional React component generation using v0.dev SDK
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { v0 } from 'v0-sdk';
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
    // v0 SDK automatically uses V0_API_KEY environment variable
    this.v0SDK = v0;
  }

  private loadConfiguration(): V0Config {
    const apiKey = process.env.V0_API_KEY;
    const baseUrl = process.env.V0_BASE_URL || 'https://api.v0.dev';

    if (!apiKey) {
      throw new Error('V0_API_KEY is required');
    }

    return {
      apiKey,
      baseUrl,
      maxTokens: parseInt(process.env.V0_MAX_TOKENS || '4000'),
      timeoutMs: parseInt(process.env.V0_TIMEOUT_MS || '30000')
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

      // Try SDK first, fallback to direct API
      try {
        return await this.generateWithSDK(options, startTime);
      } catch (sdkError) {
        this.logger.warn('SDK generation failed, falling back to direct API', { sdkError });
        return await this.generateWithDirectAPI(options, startTime);
      }
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.error('All v0.dev generation methods failed', {
        duration,
        error,
        requestCount: this.requestCount
      });

      throw new Error(`v0.dev generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateWithSDK(options: {
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

    const chat: any = await this.v0SDK.chats.create({
      message: enhancedPrompt
    });

    const duration = Date.now() - startTime;

    // Handle both ChatDetail and streaming response types
    const chatId = chat.id || `v0_sdk_${Date.now()}`;

    this.logger.info('v0.dev component generated successfully via SDK', {
      duration,
      requestCount: this.requestCount,
      chatId
    });

    // Extract code from chat files if available
    let code = '';
    let preview = `https://v0.dev/chat/${chatId}`;

    if (chat.files && chat.files.length > 0) {
      // Find the main component file
      const mainFile = chat.files.find((f: any) => f.name && (f.name.includes('.tsx') || f.name.includes('.jsx'))) || chat.files[0];
      if (mainFile && mainFile.content) {
        code = mainFile.content;
      }
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
- Pre-populated sample documents/text in input fields (earnings reports, analyst notes, market data)
- Mock processing times (2-5 seconds) with realistic progress indicators
- Confidence scores (85-98%) with detailed breakdown
- Generated sample insights, summaries, and analytics
- Pre-loaded demonstration data - NO actual file uploads needed
- Sample financial documents content already displayed in the interface

Make it a fully functional demo with realistic synthetic data that showcases the AI capabilities without requiring any file uploads.`;
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
- Processing volumes (1000+ items/day) with live-updating counters
- Accuracy rates (94-99%) with trend charts
- Time savings (60-80% reduction) with before/after comparisons
- Cost optimization (30-50% savings) with financial impact metrics
- Sample workflow tasks, alerts, and audit trail entries
- Realistic transaction names, amounts, and processing statuses
- NO file uploads or external data required - everything pre-populated

Make it demonstrate clear business value with compelling pre-loaded metrics and fully functional demo interface.`;
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
- Sample customer profiles (age 35, income $85K, retirement goals, etc.)
- Personalized recommendations with AI reasoning explanations
- Goal tracking with progress visualization (40% to retirement goal, etc.)
- Risk assessment results and investment portfolio suggestions
- Spending patterns, savings opportunities, and financial insights
- Transaction history and behavioral analytics
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
      // Test with a minimal API call to v0.dev Model API
      const response = await this.client.post('/v1/chat/completions', {
        model: 'v0-1.5-md',
        messages: [
          {
            role: 'user',
            content: 'Hello, this is a connection test.'
          }
        ],
        max_completion_tokens: 10
      }, { timeout: 5000 });

      return response.status === 200 && response.data.choices && response.data.choices.length > 0;
    } catch (error) {
      this.logger.warn('v0.dev connection test failed', { error });
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