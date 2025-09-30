/**
 * Hybrid Demo Service
 * Orchestrates both v0.dev and Azure OpenAI services for comprehensive demo generation
 */

import winston from 'winston';
import { AzureOpenAIService } from './azure-openai.service';
import { V0ClientService } from './v0-client.service';
import { DemoStorageService } from './demo-storage.service';
import {
  UseCaseInput,
  EnhancedUseCaseData,
  EnhancedDemoResponse,
  ServiceCosts,
  DemoMetadata
} from '../types/azure-openai';

export interface HybridGenerationOptions {
  useV0: boolean;
  useAzureOpenAI: boolean;
  fallbackToBasic: boolean;
  maxGenerationTime: number;
  demoId?: string; // Optional predefined demo ID
  aiEnhancementOptions: {
    enhanceDescription: boolean;
    generateSyntheticData: boolean;
    createUserJourney: boolean;
    suggestImprovements: boolean;
    confidenceThreshold: number;
  };
}

export class HybridDemoService {
  private azureOpenAI: AzureOpenAIService;
  private v0Client: V0ClientService;
  private logger: winston.Logger;
  private storage: DemoStorageService;
  private demos: Map<string, EnhancedDemoResponse> = new Map();
  private localDeployer: any;

  constructor(logger: winston.Logger) {
    this.logger = logger;
    this.azureOpenAI = new AzureOpenAIService(logger);
    this.v0Client = new V0ClientService(logger);
    this.storage = new DemoStorageService(logger);
    // Enable local demo deployment
    const { LocalDemoDeployer } = require('./local-demo-deployer');
    this.localDeployer = new LocalDemoDeployer();
  }

  async initialize(): Promise<void> {
    try {
      // Initialize Azure OpenAI
      if (process.env.ENABLE_AI_CONTENT_ENHANCEMENT === 'true') {
        await this.azureOpenAI.initialize();
        this.logger.info('Azure OpenAI service initialized for content enhancement');
      }

      // Skip connection test - try V0.dev generation directly
      // Connection test often times out but actual generation may still work
      this.logger.info('Skipping v0.dev connection test - will attempt generation directly');

      this.logger.info('Hybrid demo service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize hybrid demo service', { error });
      throw error;
    }
  }

  async generateEnhancedDemo(
    input: UseCaseInput,
    options: HybridGenerationOptions
  ): Promise<EnhancedDemoResponse> {
    const startTime = Date.now();
    const demoId = options.demoId || `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // Predeclare response so we can reference it in catch block safely
    let workingResponse: EnhancedDemoResponse | undefined;

    this.logger.info('Starting enhanced demo generation', {
      demoId,
      title: input.useCaseTitle,
      options
    });

    try {
      // Initialize response
      const response: EnhancedDemoResponse = {
        demoId,
        status: 'processing',
        progress: {
          percentage: 0,
          currentStep: 'Input validation',
          estimatedTimeRemaining: options.maxGenerationTime,
          steps: {
            inputValidation: 'processing',
            aiEnhancement: 'pending',
            v0Generation: 'pending',
            contentMerging: 'pending',
            finalization: 'pending'
          }
        },
        generatedBy: {
          v0: false,
          azureOpenAI: false,
          timestamp: new Date().toISOString(),
          costs: { azureOpenAI: 0, v0: 0, total: 0, currency: 'USD' }
        }
      };

      // retain reference
      workingResponse = response;

      // Store in memory for immediate access by status polling
      this.demos.set(demoId, response);

      // Store initial demo state
      await this.storage.updateDemoStatus(demoId, response);

  // Step 1: Input Validation
      response.progress.steps.inputValidation = 'completed';
      response.progress.percentage = 20;

      // Update in-memory cache
      this.demos.set(demoId, response);
      
      // Step 2: AI Enhancement (if enabled)
      let enhancedUseCase: EnhancedUseCaseData | null = null;
      if (options.useAzureOpenAI && options.aiEnhancementOptions.enhanceDescription) {
        response.status = 'ai_enhancing';
        response.progress.currentStep = 'AI content enhancement';
        response.progress.steps.aiEnhancement = 'processing';

        // Update in-memory cache
        this.demos.set(demoId, response);
        
        try {
          enhancedUseCase = await this.azureOpenAI.enhanceUseCase(input);
          
          // Create AI preview
          response.aiPreview = {
            enhancedDescription: enhancedUseCase.description,
            suggestedCategory: enhancedUseCase.category,
            inferredCapabilities: enhancedUseCase.capabilities,
            generatedUserJourney: enhancedUseCase.userJourney.steps.map(s => s.title),
            syntheticDataPreview: enhancedUseCase.sampleData,
            confidence: enhancedUseCase.confidence
          };
          
          response.progress.steps.aiEnhancement = 'completed';
          response.generatedBy.azureOpenAI = true;
          this.logger.info('AI enhancement completed', { demoId, confidence: enhancedUseCase.confidence });
        } catch (error) {
          this.logger.error('AI enhancement failed', { demoId, error });
          response.progress.steps.aiEnhancement = 'completed'; // Continue with basic enhancement
        }
      } else {
        response.progress.steps.aiEnhancement = 'completed';
      }
      
      response.progress.percentage = 50;

      // Step 3: Component Generation (V0.dev with Enhanced Fallback)
      let v0Component: any = null;
      let usingFallback = false;

      if (options.useV0) {
        response.status = 'v0_generating';
        response.progress.currentStep = 'Generating React components';
        response.progress.steps.v0Generation = 'processing';

        // Update in-memory cache
        this.demos.set(demoId, response);

        try {
          const useCaseForPrompt = enhancedUseCase || this.createBasicUseCaseData(input);
          const prompt = this.v0Client.generatePromptFromUseCase(useCaseForPrompt);

          // Log V0.dev call
          this.storage.logV0DevCall(demoId, prompt);

          v0Component = await this.v0Client.generateComponent({
            prompt,
            framework: 'react',
            styling: 'tailwindcss'
          });

          // Log V0.dev response
          this.storage.logV0DevCall(demoId, prompt, v0Component);

          response.progress.steps.v0Generation = 'completed';
          response.generatedBy.v0 = true;
          this.logger.info('v0.dev component generated successfully', {
            demoId,
            componentId: v0Component.componentId,
            codeLength: v0Component.code ? v0Component.code.length : 0
          });

        } catch (error: any) {
          this.logger.warn('v0.dev generation failed, using enhanced fallback', {
            demoId,
            error: error?.message || error,
            errorType: error?.constructor?.name
          });

          if (!options.fallbackToBasic) {
            throw new Error('v0.dev generation failed and fallback disabled');
          }

          // Create enhanced fallback component with rich data
          v0Component = this.createEnhancedFallbackComponent(input, enhancedUseCase);
          usingFallback = true;
          response.progress.steps.v0Generation = 'completed';

          this.logger.info('Enhanced fallback component created', {
            demoId,
            componentId: v0Component.componentId,
            category: input.category,
            codeLength: v0Component.code.length
          });
        }
      } else {
        // Create enhanced fallback when V0 is disabled
        v0Component = this.createEnhancedFallbackComponent(input, enhancedUseCase);
        usingFallback = true;
        response.progress.steps.v0Generation = 'completed';
      }
      
      response.progress.percentage = 80;

      // Step 4: Content Merging
      response.progress.currentStep = 'Merging AI content with components';
      response.progress.steps.contentMerging = 'processing';
      
      const mergedContent = await this.mergeAIContentWithV0(enhancedUseCase, v0Component, options);
      
      response.progress.steps.contentMerging = 'completed';
      response.progress.percentage = 95;

      // Step 5: Finalization
      response.progress.currentStep = 'Finalizing demo';
      response.progress.steps.finalization = 'processing';
      
      const costs = this.calculateCosts();
      const metadata = this.createDemoMetadata(input, enhancedUseCase, v0Component);
      
      response.demo = {
        v0Component,
        aiEnhancedContent: enhancedUseCase,
        syntheticData: enhancedUseCase?.sampleData || {},
        demoScript: enhancedUseCase?.businessNarrative?.executiveSummary || '',
        metadata
      };

      // Deploy React demo locally and get live URL
      let liveDemoUrl: string | undefined = undefined;
      try {
        if (v0Component?.componentId) {
          this.logger.info('Starting local demo deployment', {
            demoId,
            componentId: v0Component.componentId,
            hasV0Code: !!(v0Component.code && v0Component.code.trim().length > 0),
            codeLength: v0Component.code ? v0Component.code.length : 0
          });

          // Prefer v0 code, but generate enhanced fallback if needed
          let codeToDeploy = v0Component.code;
          let usingFallback = false;

          if (!codeToDeploy || codeToDeploy.trim().length === 0) {
            this.logger.warn('No v0 code available, generating enhanced fallback component', {
              demoId,
              v0ComponentId: v0Component.componentId
            });
            codeToDeploy = this.generateFallbackComponent(input, enhancedUseCase);
            usingFallback = true;
          } else {
            this.logger.info('Using V0.dev generated code for deployment', {
              demoId,
              codeLength: codeToDeploy.length
            });
          }

          const deploymentResult = await this.localDeployer.deployReactDemo(demoId, codeToDeploy);
          liveDemoUrl = deploymentResult.url;

          // Add deployment info to metadata
          metadata.localDeployment = {
            url: deploymentResult.url,
            port: deploymentResult.port,
            directory: deploymentResult.directory,
            deployedAt: new Date().toISOString()
          };

          this.logger.info('Local demo deployment successful', {
            demoId,
            url: liveDemoUrl,
            port: deploymentResult.port,
            usingV0Code: !usingFallback
          });
        }
        response.demo.liveDemoUrl = liveDemoUrl;
      } catch (deployErr) {
        this.logger.error('Local demo deployment failed', { demoId, error: deployErr });
        // Continue without local deployment - fallback to v0 preview URL only
      }
      
      response.generatedBy.costs = costs;
      response.progress.steps.finalization = 'completed';
      response.progress.percentage = 100;
      response.status = 'completed';
      
      const totalTime = Date.now() - startTime;
      this.logger.info('Enhanced demo generation completed', {
        demoId,
        totalTime,
        costs: costs.total
      });

      // Store final demo with comprehensive logging
      await this.storage.storeDemo(response,
        enhancedUseCase ?
          JSON.stringify({ input, enhancedUseCase, options }) :
          JSON.stringify({ input, options })
      );

      // Keep in memory cache for quick access
      this.demos.set(demoId, response);

  return response;
      
    } catch (error) {
      const totalTime = Date.now() - startTime;
      this.logger.error('Enhanced demo generation failed', { 
        demoId, 
        totalTime, 
        error 
      });
      
      return {
        ...(workingResponse as EnhancedDemoResponse),
        status: 'error',
        progress: {
          ...(workingResponse?.progress as any),
          currentStep: 'Generation failed'
        }
      };
    }
  }

  async getGeneratedDemo(demoId: string): Promise<EnhancedDemoResponse | null> {
    // Check memory cache first
    const cached = this.demos.get(demoId);
    if (cached) {
      return cached;
    }

    // Load from storage
    const stored = await this.storage.getDemo(demoId);
    if (stored) {
      // Update memory cache
      this.demos.set(demoId, stored);
    }

    return stored;
  }

  async previewAIEnhancements(input: UseCaseInput): Promise<any> {
    try {
      this.logger.info('Generating AI enhancement preview', { title: input.useCaseTitle });
      
      const enhanced = await this.azureOpenAI.enhanceUseCase(input);
      const costs = this.estimateCosts(enhanced);
      
      return {
        enhancedContent: {
          description: enhanced.description,
          category: enhanced.category,
          userJourney: enhanced.userJourney.steps.map(s => s.title),
          syntheticDataSample: this.createSampleSyntheticData(enhanced.sampleData)
        },
        confidence: enhanced.confidence,
        estimatedCosts: {
          azureOpenAI: `$${costs.azureOpenAI.toFixed(2)}`,
          v0: `$${costs.v0.toFixed(2)}`
        }
      };
    } catch (error) {
      this.logger.error('Failed to generate AI enhancement preview', { error });
      throw error;
    }
  }

  private createBasicUseCaseData(input: UseCaseInput): any {
    return {
      title: input.useCaseTitle,
      category: input.category || 'Content Generation',
      description: input.description || `${input.useCaseTitle} demonstrating ${input.keyCapabilities.join(', ')}`,
      capabilities: input.keyCapabilities,
      userJourney: input.keyCapabilities.map((cap, i) => ({ title: `Step ${i + 1}: ${cap}` })),
      successMetrics: [],
      demoFeatures: { components: [], interactions: [] },
      sampleData: { inputs: [], outputs: [] }
    };
  }

  private createFallbackComponent(input: UseCaseInput): any {
    return {
      componentId: `fallback_${Date.now()}`,
      code: this.generateFallbackReactCode(input),
      preview: '',
      metadata: {
        framework: 'react',
        styling: 'tailwindcss',
        generatedAt: new Date().toISOString(),
        complexity: 'simple'
      }
    };
  }

  private createEnhancedFallbackComponent(input: UseCaseInput, enhanced?: any): any {
    const category = input.category || 'Content Generation';

    return {
      componentId: `enhanced_fallback_${Date.now()}`,
      code: this.generateEnhancedFallbackReactCode(input, enhanced),
      preview: '',
      metadata: {
        framework: 'react',
        styling: 'tailwindcss',
        generatedAt: new Date().toISOString(),
        complexity: 'moderate',
        source: 'enhanced_fallback',
        category
      }
    };
  }

  private generateFallbackReactCode(input: UseCaseInput): string {
    return `
import React, { useState, useEffect } from 'react';

export default function ${input.useCaseTitle.replace(/\s+/g, '')}Demo() {
  const [activeTab, setActiveTab] = useState('input');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [inputText, setInputText] = useState('Sample financial document: Q3 earnings report shows 15% revenue growth with strong performance in emerging markets...');

  const processDocument = () => {
    setProcessing(true);
    setProgress(0);
    setActiveTab('processing');

    // Simulate processing steps
    const steps = [
      { name: 'Document parsing', duration: 800 },
      { name: 'Language analysis', duration: 1200 },
      { name: 'Sentiment detection', duration: 1000 },
      { name: 'Insight generation', duration: 900 }
    ];

    let currentProgress = 0;
    steps.forEach((step, index) => {
      setTimeout(() => {
        currentProgress += 25;
        setProgress(currentProgress);
        if (index === steps.length - 1) {
          setTimeout(() => {
            setProcessing(false);
            setResults({
              sentiment: 'Positive (92% confidence)',
              keyInsights: [
                'Revenue growth exceeded expectations by 3%',
                'Emerging markets showing strong adoption',
                'Cost optimization initiatives successful'
              ],
              summary: 'Strong quarterly performance with revenue growth of 15% driven by emerging market expansion and operational efficiency improvements.'
            });
            setActiveTab('results');
          }, 500);
        }
      }, steps.slice(0, index + 1).reduce((sum, s) => sum + s.duration, 0));
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-lg mb-8">
        <h1 className="text-4xl font-bold mb-4">${input.useCaseTitle}</h1>
        <p className="text-blue-100 text-lg">${input.description || 'Professional AI-powered demo application'}</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-8 bg-white p-1 rounded-lg shadow-sm">
        {['input', 'processing', 'results'].map((tab) => (
          <button
            key={tab}
            onClick={() => !processing && setActiveTab(tab)}
            className={\`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors \${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            } \${processing && tab !== activeTab ? 'opacity-50 cursor-not-allowed' : ''}\`}
          >
            {tab === 'input' && '📄'}
            {tab === 'processing' && '⚡'}
            {tab === 'results' && '📊'}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Input Section */}
      {activeTab === 'input' && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Document Input</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Financial Document Text
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Paste your financial document content here..."
              />
            </div>
            <div className="flex space-x-4">
              <button
                onClick={processDocument}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                🚀 Process Document
              </button>
              <button className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors">
                📁 Upload File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Processing Section */}
      {activeTab === 'processing' && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">AI Processing</h2>
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-lg text-gray-700">
                {processing ? 'Analyzing document...' : 'Processing complete!'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: \`\${progress}%\` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">Progress: {progress}%</p>

            {/* Capability Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              ${input.keyCapabilities.map((cap, i) => `
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h3 className="font-semibold text-gray-800 mb-2">✨ ${cap}</h3>
                <p className="text-sm text-gray-600">Processing in real-time...</p>
              </div>
              `).join('')}
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {activeTab === 'results' && results && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Analysis Results</h2>

            {/* Summary Card */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-green-800 mb-2">📈 Executive Summary</h3>
              <p className="text-green-700">{results.summary}</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-600">92%</div>
                <div className="text-sm text-blue-800">Confidence Score</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-purple-600">3.2s</div>
                <div className="text-sm text-purple-800">Processing Time</div>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-indigo-600">15+</div>
                <div className="text-sm text-indigo-800">Data Points</div>
              </div>
            </div>

            {/* Key Insights */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🔍 Key Insights</h3>
              <ul className="space-y-2">
                {results.keyInsights.map((insight, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-gray-700">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Export Options */}
            <div className="flex space-x-4 mt-6">
              <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                📊 Export Report
              </button>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                📤 Share Results
              </button>
              <button className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                🔄 Process Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}`;
  }

  private async mergeAIContentWithV0(
    enhancedUseCase: EnhancedUseCaseData | null,
    v0Component: any,
    options: HybridGenerationOptions
  ): Promise<any> {
    // This would implement sophisticated content merging
    // For now, return the components as-is
    return {
      enhanced: !!enhancedUseCase,
      hasV0Component: !!v0Component,
      timestamp: new Date().toISOString()
    };
  }

  private calculateCosts(): ServiceCosts {
    const azureOpenAIStats = this.azureOpenAI.getStats();
    const v0Stats = this.v0Client.getStats();
    
    return {
      azureOpenAI: azureOpenAIStats.totalCost || 0,
      v0: v0Stats.requestCount * 0.15, // Estimated v0 cost
      total: (azureOpenAIStats.totalCost || 0) + (v0Stats.requestCount * 0.15),
      currency: 'USD'
    };
  }

  private estimateCosts(enhanced: EnhancedUseCaseData): ServiceCosts {
    return {
      azureOpenAI: 0.08, // Estimated cost for enhancement
      v0: 0.15, // Estimated cost for component generation
      total: 0.23,
      currency: 'USD'
    };
  }

  private createDemoMetadata(
    input: UseCaseInput,
    enhanced: EnhancedUseCaseData | null,
    v0Component: any
  ): DemoMetadata {
    return {
      generatedAt: new Date().toISOString(),
      generatedBy: [
        ...(enhanced ? ['Azure OpenAI'] : []),
        ...(v0Component ? ['v0.dev'] : [])
      ],
      version: '1.0.0',
      category: enhanced?.category || input.category || 'Content Generation',
      complexity: v0Component?.metadata?.complexity || 'simple',
      estimatedDemoTime: '5-7 minutes'
    };
  }

  private createSampleSyntheticData(data: any): any {
    return {
      sampleEntries: 3,
      categories: ['users', 'transactions', 'metrics'],
      realistic: true
    };
  }

  /**
   * Generate a fallback React component when v0.dev doesn't return actual code
   */
  private generateFallbackComponent(input: UseCaseInput, enhanced: EnhancedUseCaseData | null): string {
    const title = input.useCaseTitle;
    const capabilities = input.keyCapabilities.join(', ');
    const category = input.category || 'Content Generation';
    
    if (category === 'Process Automation') {
      return this.generateProcessAutomationTemplate(title, capabilities);
    } else if (category === 'Personalized Experience') {
      return this.generatePersonalizationTemplate(title, capabilities);
    } else {
      return this.generateContentGenerationTemplate(title, capabilities);
    }
  }

  private generateContentGenerationTemplate(title: string, capabilities: string): string {
    return `import React, { useState } from 'react';

export default function DemoApp() {
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);

  const handleGenerate = () => {
    setProcessing(true);
    setTimeout(() => {
      setResults({
        confidence: '94%',
        processing_time: '3.2s',
        content_generated: 'Sample generated content for ${title}',
        insights: ['Key insight 1', 'Key insight 2', 'Key insight 3']
      });
      setProcessing(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">${title}</h1>
          <p className="text-lg text-gray-600">Capabilities: ${capabilities}</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Input Configuration</h2>
            <textarea 
              className="w-full h-32 p-3 border rounded-md mb-4" 
              placeholder="Enter your content requirements here..."
              defaultValue="Sample financial analysis document needs to be generated..."
            />
            <button 
              onClick={handleGenerate}
              disabled={processing}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {processing ? 'Processing...' : 'Generate Content'}
            </button>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Generated Results</h2>
            {processing && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Processing with AI...</p>
              </div>
            )}
            {results && (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Confidence:</span>
                  <span className="font-semibold text-green-600">{results.confidence}</span>
                </div>
                <div className="flex justify-between">
                  <span>Processing Time:</span>
                  <span className="font-semibold">{results.processing_time}</span>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Generated Content:</h4>
                  <p className="text-gray-700 text-sm">{results.content_generated}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}`;
  }

  private generateProcessAutomationTemplate(title: string, capabilities: string): string {
    return `import React, { useState, useEffect } from 'react';

export default function DemoApp() {
  const [metrics, setMetrics] = useState({
    processed: 1247,
    accuracy: '97%',
    timeSaved: '68%',
    activeWorkflows: 12
  });

  const workflowItems = [
    { id: 1, name: 'Customer Onboarding', status: 'processing', priority: 'high' },
    { id: 2, name: 'Document Verification', status: 'completed', priority: 'medium' },
    { id: 3, name: 'Risk Assessment', status: 'pending', priority: 'low' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">${title}</h1>
          <p className="text-lg text-gray-600">Automation: ${capabilities}</p>
        </header>

        {/* Metrics Dashboard */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h3 className="text-2xl font-bold text-blue-600">{metrics.processed}</h3>
            <p className="text-gray-600">Items Processed</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h3 className="text-2xl font-bold text-green-600">{metrics.accuracy}</h3>
            <p className="text-gray-600">Accuracy Rate</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h3 className="text-2xl font-bold text-purple-600">{metrics.timeSaved}</h3>
            <p className="text-gray-600">Time Saved</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h3 className="text-2xl font-bold text-orange-600">{metrics.activeWorkflows}</h3>
            <p className="text-gray-600">Active Workflows</p>
          </div>
        </div>

        {/* Workflow Management */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Active Workflows</h2>
          <div className="space-y-3">
            {workflowItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center space-x-3">
                  <div className={\`w-3 h-3 rounded-full \${
                    item.status === 'completed' ? 'bg-green-500' :
                    item.status === 'processing' ? 'bg-yellow-500' : 'bg-gray-400'
                  }\`}></div>
                  <span className="font-medium">{item.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={\`px-2 py-1 text-xs rounded-full \${
                    item.priority === 'high' ? 'bg-red-100 text-red-800' :
                    item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }\`}>
                    {item.priority}
                  </span>
                  <span className="text-sm text-gray-600 capitalize">{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}`;
  }

  private generateEnhancedFallbackReactCode(input: UseCaseInput, enhanced?: any): string {
    const category = input.category || 'Content Generation';
    const title = input.useCaseTitle;
    const capabilities = input.keyCapabilities.join(', ');
    const description = input.description || `${title} demonstrating ${capabilities}`;

    // Use enhanced data if available
    const sampleData = enhanced?.sampleData || this.generateSampleData(category);
    const userJourney = enhanced?.userJourney?.steps || input.keyCapabilities.map((cap, i) => ({
      title: `${cap}`,
      description: `Advanced ${cap.toLowerCase()} functionality`
    }));

    if (category === 'Process Automation') {
      return this.generateEnhancedProcessAutomationTemplate(title, description, capabilities, sampleData);
    } else if (category === 'Personalized Experience') {
      return this.generateEnhancedPersonalizationTemplate(title, description, capabilities, sampleData);
    } else {
      return this.generateEnhancedContentGenerationTemplate(title, description, capabilities, sampleData);
    }
  }

  private generateSampleData(category: string): any {
    const baseData = {
      metrics: {
        accuracy: Math.floor(Math.random() * 5) + 94, // 94-98%
        processing_time: (Math.random() * 2 + 1).toFixed(1), // 1.0-3.0s
        confidence: Math.floor(Math.random() * 8) + 90, // 90-97%
        items_processed: Math.floor(Math.random() * 500) + 1000 // 1000-1500
      },
      trends: Array.from({length: 7}, (_, i) => ({
        day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        value: Math.floor(Math.random() * 30) + 70
      }))
    };

    if (category === 'Process Automation') {
      return {
        ...baseData,
        workflows: [
          { name: 'Customer Onboarding', status: 'active', processed: 247, success_rate: 96 },
          { name: 'Document Processing', status: 'running', processed: 189, success_rate: 94 },
          { name: 'Compliance Checks', status: 'completed', processed: 156, success_rate: 98 }
        ]
      };
    } else if (category === 'Personalized Experience') {
      return {
        ...baseData,
        profiles: [
          { name: 'Sarah Johnson', segment: 'Premium', score: 94, recommendations: 8 },
          { name: 'Mike Chen', segment: 'Growth', score: 87, recommendations: 12 },
          { name: 'Lisa Davis', segment: 'Standard', score: 91, recommendations: 6 }
        ]
      };
    } else {
      return {
        ...baseData,
        content: [
          { type: 'Reports', generated: 45, quality: 96 },
          { type: 'Summaries', generated: 78, quality: 94 },
          { type: 'Analytics', generated: 32, quality: 98 }
        ]
      };
    }
  }

  private generateEnhancedContentGenerationTemplate(title: string, description: string, capabilities: string, sampleData: any): string {
    return `import React, { useState, useEffect } from 'react';

export default function ${title.replace(/[^A-Za-z0-9]/g, '')}Demo() {
  const [activeTab, setActiveTab] = useState('overview');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [metrics, setMetrics] = useState(${JSON.stringify(sampleData.metrics)});
  const [contentData] = useState(${JSON.stringify(sampleData.content)});

  const processContent = () => {
    setProcessing(true);
    setProgress(0);
    setActiveTab('processing');

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setProcessing(false);
          setResults({
            generated_content: 'Sample content generated with AI analysis',
            quality_score: metrics.confidence,
            insights: [
              'Content optimized for target audience',
              'SEO keywords integrated successfully',
              'Readability score: Excellent (95/100)',
              'Engagement potential: High'
            ]
          });
          setActiveTab('results');
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-900">${title}</h1>
          <p className="text-gray-600 mt-2">${description}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Navigation */}
        <div className="flex space-x-1 mb-8 bg-white p-1 rounded-lg shadow-md">
          {['overview', 'processing', 'results'].map((tab) => (
            <button
              key={tab}
              onClick={() => !processing && setActiveTab(tab)}
              className={\`flex-1 py-3 px-6 rounded-md text-sm font-medium transition-all duration-200 \${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              } \${processing && tab !== activeTab ? 'opacity-50 cursor-not-allowed' : ''}\`}
            >
              {tab === 'overview' && '📊 '}
              {tab === 'processing' && '⚡ '}
              {tab === 'results' && '🎯 '}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <div className="text-3xl font-bold text-blue-600">{metrics.accuracy}%</div>
                <div className="text-gray-600 text-sm">Accuracy Rate</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                <div className="text-3xl font-bold text-green-600">{metrics.processing_time}s</div>
                <div className="text-gray-600 text-sm">Avg Processing Time</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                <div className="text-3xl font-bold text-purple-600">{metrics.items_processed}</div>
                <div className="text-gray-600 text-sm">Items Processed</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                <div className="text-3xl font-bold text-orange-600">{metrics.confidence}%</div>
                <div className="text-gray-600 text-sm">Confidence Score</div>
              </div>
            </div>

            {/* Content Generation Panel */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold mb-6">Content Generation</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Section */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Input Configuration</h3>
                  <textarea
                    className="w-full h-32 p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Enter your content requirements..."
                    defaultValue="Generate a comprehensive financial analysis report for Q3 results..."
                  />
                  <button
                    onClick={processContent}
                    disabled={processing}
                    className="mt-4 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all duration-200 font-medium"
                  >
                    {processing ? 'Processing...' : '🚀 Generate Content'}
                  </button>
                </div>

                {/* Preview Section */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Content Types</h3>
                  <div className="space-y-3">
                    {contentData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{item.type}</div>
                          <div className="text-sm text-gray-600">{item.generated} generated</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-green-600">{item.quality}%</div>
                          <div className="text-xs text-gray-500">Quality</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Processing Tab */}
        {activeTab === 'processing' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-6">AI Processing</h2>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
                <span className="text-lg">
                  {processing ? 'Analyzing and generating content...' : 'Processing complete!'}
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 h-4 rounded-full transition-all duration-300"
                  style={{ width: \`\${progress}%\` }}
                ></div>
              </div>
              <p className="text-center text-gray-600">Progress: {Math.round(progress)}%</p>

              {/* Processing Steps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <h3 className="font-semibold text-blue-800">Content Analysis</h3>
                  <p className="text-sm text-blue-700 mt-1">Analyzing input requirements and context</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <h3 className="font-semibold text-purple-800">AI Generation</h3>
                  <p className="text-sm text-purple-700 mt-1">Generating content using advanced AI models</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <h3 className="font-semibold text-green-800">Quality Check</h3>
                  <p className="text-sm text-green-700 mt-1">Validating content quality and accuracy</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                  <h3 className="font-semibold text-orange-800">Optimization</h3>
                  <p className="text-sm text-orange-700 mt-1">Optimizing for target audience and goals</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && results && (
          <div className="space-y-6">
            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Content Generated Successfully</h3>
              <p className="text-green-700">{results.generated_content}</p>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quality Metrics */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Quality Metrics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Overall Quality Score</span>
                    <span className="font-bold text-blue-600">{results.quality_score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{width: \`\${results.quality_score}%\`}}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Insights */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
                <ul className="space-y-3">
                  {results.insights.map((insight, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <span className="text-green-500 mt-1">✓</span>
                      <span className="text-gray-700">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium">
                📊 Export Report
              </button>
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                📤 Share Results
              </button>
              <button
                onClick={() => {setActiveTab('overview'); setResults(null); setProgress(0);}}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                🔄 Generate New
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}`;
  }

  private generateEnhancedProcessAutomationTemplate(title: string, description: string, capabilities: string, sampleData: any): string {
    return `import React, { useState, useEffect } from 'react';

export default function ${title.replace(/[^A-Za-z0-9]/g, '')}Demo() {
  const [metrics, setMetrics] = useState(${JSON.stringify(sampleData.metrics)});
  const [workflows] = useState(${JSON.stringify(sampleData.workflows)});
  const [selectedWorkflow, setSelectedWorkflow] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        items_processed: prev.items_processed + Math.floor(Math.random() * 3),
        processing_time: (Math.random() * 0.2 + Number(prev.processing_time)).toFixed(1)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-900">${title}</h1>
          <p className="text-gray-600 mt-2">${description}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <h3 className="text-3xl font-bold text-blue-600">{metrics.items_processed}</h3>
            <p className="text-gray-600 mt-1">Items Processed Today</p>
            <div className="text-xs text-green-600 mt-2">+{Math.floor(Math.random() * 20 + 10)}% from yesterday</div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <h3 className="text-3xl font-bold text-green-600">{metrics.accuracy}%</h3>
            <p className="text-gray-600 mt-1">Accuracy Rate</p>
            <div className="text-xs text-green-600 mt-2">Above target (90%)</div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <h3 className="text-3xl font-bold text-purple-600">{metrics.processing_time}s</h3>
            <p className="text-gray-600 mt-1">Avg Processing Time</p>
            <div className="text-xs text-green-600 mt-2">-15% from last week</div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <h3 className="text-3xl font-bold text-orange-600">{workflows.length}</h3>
            <p className="text-gray-600 mt-1">Active Workflows</p>
            <div className="text-xs text-blue-600 mt-2">All systems operational</div>
          </div>
        </div>

        {/* Workflow Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Workflow List */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Active Workflows</h2>
            <div className="space-y-4">
              {workflows.map((workflow, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedWorkflow(index)}
                  className={\`p-4 border rounded-lg cursor-pointer transition-all \${
                    selectedWorkflow === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }\`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={\`w-3 h-3 rounded-full \${
                        workflow.status === 'active' ? 'bg-green-500' :
                        workflow.status === 'running' ? 'bg-yellow-500 animate-pulse' : 'bg-blue-500'
                      }\`}></div>
                      <span className="font-medium">{workflow.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{workflow.processed}</div>
                      <div className="text-xs text-gray-500">processed</div>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-gray-600">Success Rate: {workflow.success_rate}%</span>
                    <span className={\`px-2 py-1 rounded-full text-xs \${
                      workflow.status === 'active' ? 'bg-green-100 text-green-800' :
                      workflow.status === 'running' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                    }\`}>
                      {workflow.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Workflow Details */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Workflow Details</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-lg">{workflows[selectedWorkflow].name}</h3>
                <p className="text-gray-600">Automated processing workflow with AI validation</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-600">Items Processed</div>
                  <div className="text-xl font-semibold">{workflows[selectedWorkflow].processed}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-600">Success Rate</div>
                  <div className="text-xl font-semibold text-green-600">{workflows[selectedWorkflow].success_rate}%</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{workflows[selectedWorkflow].success_rate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{width: \`\${workflows[selectedWorkflow].success_rate}%\`}}
                  ></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-4">
                <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors">
                  View Details
                </button>
                <button className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors">
                  Configure
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {['Document processed successfully', 'Workflow automation completed', 'Quality check passed', 'Report generated'].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{activity}</span>
                <span className="ml-auto text-sm text-gray-500">{Math.floor(Math.random() * 30 + 1)} min ago</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}`;
  }

  private generateEnhancedPersonalizationTemplate(title: string, description: string, capabilities: string, sampleData: any): string {
    return `import React, { useState } from 'react';

export default function ${title.replace(/[^A-Za-z0-9]/g, '')}Demo() {
  const [selectedProfile, setSelectedProfile] = useState(0);
  const [profiles] = useState(${JSON.stringify(sampleData.profiles)});
  const [metrics] = useState(${JSON.stringify(sampleData.metrics)});

  const currentProfile = profiles[selectedProfile];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-900">${title}</h1>
          <p className="text-gray-600 mt-2">${description}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Customer Profile Selector */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-6">Customer Profiles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {profiles.map((profile, index) => (
              <div
                key={index}
                onClick={() => setSelectedProfile(index)}
                className={\`p-6 border-2 rounded-xl cursor-pointer transition-all \${
                  selectedProfile === index
                    ? 'border-purple-500 bg-purple-50 shadow-lg'
                    : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                }\`}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl">
                    {profile.name.charAt(0)}
                  </div>
                  <h3 className="font-semibold text-lg">{profile.name}</h3>
                  <p className="text-gray-600 mb-2">{profile.segment} Customer</p>
                  <div className="flex justify-between text-sm">
                    <span>Score: {profile.score}%</span>
                    <span>{profile.recommendations} recs</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Personalization Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Details */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Profile Analysis</h2>
            <div className="space-y-6">
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold text-lg">{currentProfile.name}</h3>
                <p className="text-gray-600">{currentProfile.segment} Customer Segment</p>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{currentProfile.score}%</div>
                  <div className="text-sm text-purple-800">Personalization Score</div>
                </div>
                <div className="bg-pink-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-pink-600">{currentProfile.recommendations}</div>
                  <div className="text-sm text-pink-800">Active Recommendations</div>
                </div>
              </div>

              {/* Progress Indicators */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Engagement Score</span>
                    <span>{currentProfile.score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                      style={{width: \`\${currentProfile.score}%\`}}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Satisfaction</span>
                    <span>{Math.floor(Math.random() * 10) + 85}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{width: \`\${Math.floor(Math.random() * 10) + 85}%\`}}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-6">AI Recommendations</h2>
            <div className="space-y-4">
              {Array.from({length: currentProfile.recommendations}, (_, i) => ({
                title: [
                  'Premium Investment Portfolio',
                  'Personalized Savings Plan',
                  'Risk-Adjusted Strategy',
                  'Growth Opportunities',
                  'Retirement Planning',
                  'Tax Optimization',
                  'Insurance Coverage',
                  'Financial Advisory Session'
                ][i % 8],
                confidence: Math.floor(Math.random() * 15) + 85,
                category: ['Investment', 'Savings', 'Planning'][Math.floor(Math.random() * 3)]
              })).map((rec, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-lg">{rec.title}</h4>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                      {rec.confidence}% match
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Personalized {rec.category.toLowerCase()} recommendation based on {currentProfile.name}'s profile and preferences.
                  </p>
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-xs text-gray-500">{rec.category}</span>
                    <button className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6">Personalization Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{metrics.accuracy}%</div>
              <div className="text-gray-600">Recommendation Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{metrics.items_processed}</div>
              <div className="text-gray-600">Profiles Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{metrics.processing_time}s</div>
              <div className="text-gray-600">Avg Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{metrics.confidence}%</div>
              <div className="text-gray-600">AI Confidence</div>
            </div>
          </div>
        </div>

        {/* Action Center */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-6 text-white">
          <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-3 rounded-lg transition-all">
              📊 Generate Report
            </button>
            <button className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-3 rounded-lg transition-all">
              📧 Send Recommendations
            </button>
            <button className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-3 rounded-lg transition-all">
              🔄 Refresh Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}`;
  }

  private generatePersonalizationTemplate(title: string, capabilities: string): string {
    return `import React, { useState } from 'react';

export default function DemoApp() {
  const [selectedProfile, setSelectedProfile] = useState('executive');
  
  const profiles = {
    executive: {
      name: 'Sarah Johnson',
      role: 'Senior Executive',
      goals: ['Portfolio Growth', 'Risk Management'],
      recommendations: ['Diversified ETF Portfolio', 'Treasury Bonds', 'Real Estate Investment']
    },
    entrepreneur: {
      name: 'Mike Chen', 
      role: 'Tech Entrepreneur',
      goals: ['Business Expansion', 'Tax Optimization'],
      recommendations: ['Growth Stocks', 'Startup Investments', 'Business Credit Line']
    }
  };

  const currentProfile = profiles[selectedProfile];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">${title}</h1>
          <p className="text-lg text-gray-600">Personalization: ${capabilities}</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Selection */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Customer Profile</h2>
            <div className="space-y-3 mb-6">
              {Object.entries(profiles).map(([key, profile]) => (
                <label key={key} className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="radio" 
                    name="profile" 
                    value={key}
                    checked={selectedProfile === key}
                    onChange={(e) => setSelectedProfile(e.target.value)}
                    className="text-blue-600"
                  />
                  <span className="font-medium">{profile.name} - {profile.role}</span>
                </label>
              ))}
            </div>
            
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Financial Goals:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                {currentProfile.goals.map((goal, index) => (
                  <li key={index}>{goal}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Personalized Recommendations */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">AI Recommendations</h2>
            <div className="space-y-4">
              {currentProfile.recommendations.map((rec, index) => (
                <div key={index} className="p-4 border rounded-md bg-blue-50">
                  <h4 className="font-semibold text-blue-900">{rec}</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Tailored for {currentProfile.name}'s {currentProfile.role.toLowerCase()} profile
                  </p>
                  <div className="mt-2">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      95% Match
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`;
  }

  async getServiceStats() {
    const storageStats = await this.storage.getStorageStats();
    return {
      azureOpenAI: this.azureOpenAI.getStats(),
      v0: this.v0Client.getStats(),
      storage: storageStats,
      initialized: true
    };
  }

  /**
   * Validate a specific demo's health and restart if needed
   */
  async validateDemoHealth(demoId: string) {
    return await this.localDeployer.validateDemoHealth(demoId);
  }

  /**
   * Validate all active demos and restart unhealthy ones
   */
  async validateAllDemos() {
    return await this.localDeployer.validateAllDemos();
  }
}