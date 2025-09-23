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

      // Test v0.dev connection
      const v0Available = await this.v0Client.testConnection();
      if (!v0Available) {
        this.logger.warn('v0.dev service not available - will use fallback generation');
      }

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
    const demoId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

      // Store initial demo state
      await this.storage.updateDemoStatus(demoId, response);

  // Step 1: Input Validation
      response.progress.steps.inputValidation = 'completed';
      response.progress.percentage = 20;
      
      // Step 2: AI Enhancement (if enabled)
      let enhancedUseCase: EnhancedUseCaseData | null = null;
      if (options.useAzureOpenAI && options.aiEnhancementOptions.enhanceDescription) {
        response.status = 'ai_enhancing';
        response.progress.currentStep = 'AI content enhancement';
        response.progress.steps.aiEnhancement = 'processing';
        
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

      // Step 3: v0.dev Component Generation
      let v0Component: any = null;
      if (options.useV0) {
        response.status = 'v0_generating';
        response.progress.currentStep = 'Generating React components';
        response.progress.steps.v0Generation = 'processing';
        
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
          this.logger.info('v0.dev component generated', { demoId, componentId: v0Component.componentId });

          // Update status
          await this.storage.updateDemoStatus(demoId, {
            progress: response.progress,
            generatedBy: response.generatedBy
          });
        } catch (error) {
          this.logger.error('v0.dev generation failed', { demoId, error });
          
          if (!options.fallbackToBasic) {
            throw new Error('v0.dev generation failed and fallback disabled');
          }
          
          // Create fallback component
          v0Component = this.createFallbackComponent(input);
          response.progress.steps.v0Generation = 'completed';
        }
      } else {
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
          this.logger.info('Starting local demo deployment', { demoId, componentId: v0Component.componentId });
          
          // Get code from v0 component or generate fallback
          let codeToDeploy = v0Component.code;
          if (!codeToDeploy || codeToDeploy.trim().length === 0) {
            this.logger.info('No v0 code available, generating fallback component', { demoId });
            codeToDeploy = this.generateFallbackComponent(input, enhancedUseCase);
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
            port: deploymentResult.port 
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
}