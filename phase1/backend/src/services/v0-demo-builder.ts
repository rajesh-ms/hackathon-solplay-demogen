import { LoggingService } from './logging-service';
import { V0PromptData } from './v0-prompt-generator';
import { UseCaseData } from './usecase-extractor';

export interface V0DemoResult {
  success: boolean;
  demoCode?: string;
  demoUrl?: string;
  metadata: {
    useCase: string;
    category: string;
    generatedAt: Date;
    provider: string;
    duration?: number;
    enhanced?: boolean;
    model?: string;
  };
  syntheticData?: any;
  error?: string;
}

export class V0DemoBuilder {
  private logger: LoggingService;
  private v0ApiKey: string;
  private v0BaseUrl: string;
  private v0Timeout: number;

  constructor() {
    this.logger = LoggingService.getInstance();
    
    this.v0ApiKey = process.env.V0_API_KEY || '';
    this.v0BaseUrl = process.env.V0_BASE_URL || 'https://api.v0.dev/v1/chat/completions';
    this.v0Timeout = parseInt(process.env.V0_TIMEOUT || '30000');

    if (!this.v0ApiKey && process.env.AI_PROVIDER !== 'mock') {
      this.logger.warn('V0 API key not configured, falling back to mock mode', {}, 'V0DemoBuilder');
    }

    this.logger.info('V0DemoBuilder initialized', {
      baseUrl: this.v0BaseUrl,
      timeout: this.v0Timeout,
      hasApiKey: !!this.v0ApiKey
    }, 'V0DemoBuilder');
  }

  /**
   * Generates a demo using v0.dev API or mock data
   */
  async generateDemo(promptData: V0PromptData, useCase: UseCaseData): Promise<V0DemoResult> {
    const startTime = Date.now();
    
    try {
      this.logger.info('Starting demo generation', {
        useCase: useCase.title,
        category: useCase.category,
        promptLength: promptData.prompt.length
      }, 'V0DemoBuilder', 'generateDemo');

      // Check if we should use mock mode
      if (!this.v0ApiKey || process.env.AI_PROVIDER === 'mock' || process.env.ENABLE_MOCK_MODE === 'true') {
        return this.generateMockDemo(promptData, useCase, startTime);
      }

      // Call v0.dev API
      const result = await this.callV0API(promptData, useCase, startTime);
      
      // Enhance with synthetic data
      const enhancedResult = await this.enhanceWithSyntheticData(result, useCase);
      
      const duration = Date.now() - startTime;
      
      this.logger.info('Demo generation completed', {
        useCase: useCase.title,
        success: enhancedResult.success,
        duration
      }, 'V0DemoBuilder', 'generateDemo');

      return enhancedResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.logger.error('Demo generation failed', {
        useCase: useCase.title,
        error: errorMessage,
        duration
      }, 'V0DemoBuilder', 'generateDemo');

      // Log error to v0 interactions
      this.logger.logV0Interaction({
        timestamp: new Date().toISOString(),
        operation: 'api_response',
        error: errorMessage,
        duration
      });

      // Return error result
      return {
        success: false,
        error: errorMessage,
        metadata: {
          useCase: useCase.title,
          category: useCase.category,
          generatedAt: new Date(),
          provider: 'v0-error',
          duration
        }
      };
    }
  }

  /**
   * Calls the v0.dev API to generate React components
   */
  private async callV0API(promptData: V0PromptData, useCase: UseCaseData, startTime: number): Promise<V0DemoResult> {
    // v0 Model API uses OpenAI-compatible chat/completions format
    const requestData = {
      model: process.env.V0_MODEL || 'v0-1.5-md',
      messages: [
        {
          role: 'user',
          content: promptData.prompt
        }
      ],
      stream: false,
      max_completion_tokens: 4000
    };

    // Log the API request
    this.logger.logV0Interaction({
      timestamp: new Date().toISOString(),
      operation: 'api_request',
      request: requestData
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.v0Timeout);

      const response = await fetch(this.v0BaseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.v0ApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      const duration = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`V0 API error (${response.status}): ${errorText}`);
      }

      const responseData = await response.json();
      
      // Extract the generated content from OpenAI-compatible response
      const generatedContent = responseData.choices?.[0]?.message?.content || '';
      
      // Log successful API response
      this.logger.logV0Interaction({
        timestamp: new Date().toISOString(),
        operation: 'api_response',
        response: {
          status: response.status,
          hasContent: !!generatedContent,
          contentLength: generatedContent.length,
          model: responseData.model
        },
        duration
      });

      return {
        success: true,
        demoCode: generatedContent,
        demoUrl: undefined, // v0 Model API doesn't provide URLs directly
        metadata: {
          useCase: useCase.title,
          category: useCase.category,
          generatedAt: new Date(),
          provider: 'v0-model-api',
          model: responseData.model,
          duration
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Log API error
      this.logger.logV0Interaction({
        timestamp: new Date().toISOString(),
        operation: 'api_response',
        error: errorMessage,
        duration
      });

      throw error;
    }
  }

  /**
   * Generates a mock demo for development/testing
   */
  private async generateMockDemo(promptData: V0PromptData, useCase: UseCaseData, startTime: number): Promise<V0DemoResult> {
    this.logger.info('Generating mock demo', {
      useCase: useCase.title,
      category: useCase.category
    }, 'V0DemoBuilder', 'generateMockDemo');

    // Simulate API delay
    const mockDelay = parseInt(process.env.MOCK_RESPONSE_DELAY || '2000');
    await new Promise(resolve => setTimeout(resolve, mockDelay));

    const mockCode = this.generateMockReactCode(useCase);
    const duration = Date.now() - startTime;

    // Log mock interaction
    this.logger.logV0Interaction({
      timestamp: new Date().toISOString(),
      operation: 'api_response',
      response: {
        mockMode: true,
        codeLength: mockCode.length,
        useCase: useCase.title
      },
      duration
    });

    return {
      success: true,
      demoCode: mockCode,
      demoUrl: `mock://demo/${useCase.title.toLowerCase().replace(/\s+/g, '-')}`,
      metadata: {
        useCase: useCase.title,
        category: useCase.category,
        generatedAt: new Date(),
        provider: 'mock',
        duration
      }
    };
  }

  /**
   * Generates mock React code for testing
   */
  private generateMockReactCode(useCase: UseCaseData): string {
    return `import React, { useState } from 'react';

export default function ${useCase.title.replace(/\s+/g, '')}Demo() {
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);

  const handleProcess = async () => {
    setProcessing(true);
    // Simulate processing
    setTimeout(() => {
      setResults({
        title: "${useCase.title}",
        category: "${useCase.category}",
        confidence: "94%",
        metrics: ${JSON.stringify(useCase.successMetrics)},
        outputs: ${JSON.stringify(useCase.sampleData.outputs)}
      });
      setProcessing(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">${useCase.title}</h1>
          <p className="text-gray-600 mt-2">${useCase.description}</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Input Data</h2>
            <div className="space-y-4">
              ${useCase.sampleData.inputs.map(input => `
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <p className="text-gray-700">${input}</p>
              </div>`).join('')}
              <button
                onClick={handleProcess}
                disabled={processing}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Start Analysis'}
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            {processing && (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            )}
            {results && (
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-green-800">Processing Complete</p>
                  <p className="text-green-600">Confidence: {results.confidence}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Generated Outputs:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {results.outputs.map((output, idx) => (
                      <li key={idx} className="text-gray-700">{output}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Capabilities */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">AI Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${useCase.capabilities.map(capability => `
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900">${capability}</h3>
            </div>`).join('')}
          </div>
        </div>
      </div>
    </div>
  );
}`;
  }

  /**
   * Enhances the demo with realistic synthetic data
   */
  private async enhanceWithSyntheticData(result: V0DemoResult, useCase: UseCaseData): Promise<V0DemoResult> {
    if (!result.success) return result;

    try {
      const syntheticData = this.generateSyntheticData(useCase);
      
      return {
        ...result,
        syntheticData,
        metadata: {
          ...result.metadata,
          enhanced: true
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn('Failed to enhance with synthetic data', {
        error: errorMessage
      }, 'V0DemoBuilder');
      
      return result; // Return original result if enhancement fails
    }
  }

  /**
   * Generates realistic synthetic data based on use case category
   */
  private generateSyntheticData(useCase: UseCaseData): any {
    const dataGenerators = {
      'Content Generation': () => ({
        documents: ['RFP Response Document.pdf', 'Marketing Content Brief.docx', 'Proposal Template.pptx'],
        processing: { 
          duration: '3.2s', 
          confidence: '94%', 
          status: 'completed',
          steps: ['Document analysis', 'Content extraction', 'AI generation', 'Quality validation']
        },
        results: useCase.sampleData.outputs,
        metrics: {
          processingSpeed: '3.2x faster',
          accuracyRate: '94%',
          qualityScore: '4.7/5'
        }
      }),
      'Process Automation': () => ({
        workflows: ['KYC Processing', 'Loan Underwriting', 'Compliance Check', 'Risk Assessment'],
        metrics: { 
          processed: 1247, 
          accuracy: '97%', 
          timeSaved: '68%',
          costReduction: '45%'
        },
        tasks: this.generateTaskData(),
        alerts: [
          { type: 'success', message: '1,247 documents processed successfully' },
          { type: 'warning', message: '12 items require manual review' },
          { type: 'info', message: 'SLA compliance: 97.3%' }
        ]
      }),
      'Personalized Experience': () => ({
        customers: this.generateCustomerProfiles(),
        recommendations: this.generateRecommendations(),
        insights: this.generatePersonalInsights(),
        engagement: {
          satisfaction: '4.6/5',
          adoption: '87%',
          retention: '92%'
        }
      })
    };

    const generator = dataGenerators[useCase.category];
    return generator ? generator() : { message: 'Demo data for ' + useCase.category };
  }

  private generateTaskData() {
    return [
      { id: 1, title: 'KYC Document Review', status: 'completed', priority: 'high', duration: '2.3s' },
      { id: 2, title: 'Credit Score Analysis', status: 'processing', priority: 'medium', duration: '1.8s' },
      { id: 3, title: 'Compliance Validation', status: 'pending', priority: 'low', duration: null },
      { id: 4, title: 'Risk Assessment', status: 'completed', priority: 'high', duration: '3.1s' }
    ];
  }

  private generateCustomerProfiles() {
    return [
      { 
        name: 'Sarah Johnson', 
        age: 32, 
        income: '$75,000', 
        goals: ['Home Purchase', 'Emergency Fund'],
        riskProfile: 'Moderate'
      },
      { 
        name: 'Michael Chen', 
        age: 28, 
        income: '$95,000', 
        goals: ['Investment Growth', 'Retirement Planning'],
        riskProfile: 'Aggressive'
      },
      { 
        name: 'Emily Rodriguez', 
        age: 45, 
        income: '$120,000', 
        goals: ['Education Savings', 'Retirement Planning'],
        riskProfile: 'Conservative'
      }
    ];
  }

  private generateRecommendations() {
    return [
      { type: 'Investment', title: 'Diversified Portfolio Allocation', confidence: '92%' },
      { type: 'Savings', title: 'High-Yield Emergency Fund', confidence: '88%' },
      { type: 'Insurance', title: 'Term Life Insurance Policy', confidence: '95%' },
      { type: 'Credit', title: 'Mortgage Pre-Approval', confidence: '89%' }
    ];
  }

  private generatePersonalInsights() {
    return [
      { category: 'Spending', insight: '15% increase in discretionary spending vs. last quarter' },
      { category: 'Savings', insight: 'On track to meet emergency fund goal by Q3 2024' },
      { category: 'Investment', insight: 'Portfolio performance 8% above market average' },
      { category: 'Credit', insight: 'Credit score improved by 23 points in last 6 months' }
    ];
  }
}