import { OpenAI } from 'openai';
import { LoggingService } from './logging-service';
import { PDFContent } from './pdf-parser';

export interface UseCaseData {
  title: string;
  category: 'Content Generation' | 'Process Automation' | 'Personalized Experience';
  description: string;
  capabilities: string[];
  userJourney: string[];
  successMetrics: string[];
  demoFeatures: {
    components: string[];
    interactions: string[];
    dataTypes: string[];
  };
  sampleData: {
    inputs: string[];
    outputs: string[];
  };
  extractedFrom: {
    fileName: string;
    extractedAt: Date;
    textLength: number;
  };
}

export class UseCaseExtractor {
  private azureOpenAI: OpenAI;
  private logger: LoggingService;

  constructor() {
    this.logger = LoggingService.getInstance();
    
    // Initialize Azure OpenAI client
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview';

    if (!apiKey || !endpoint) {
      throw new Error('Azure OpenAI configuration missing. Please set AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT');
    }

    this.azureOpenAI = new OpenAI({
      apiKey,
      baseURL: `${endpoint}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
      defaultQuery: { 'api-version': apiVersion },
      defaultHeaders: {
        'api-key': apiKey
      }
    });

    this.logger.info('Azure OpenAI client initialized', {
      endpoint: endpoint,
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      apiVersion
    }, 'UseCaseExtractor');
  }

  /**
   * Extracts the first viable use case from PDF content using Azure OpenAI
   */
  async extractFirstUseCase(pdfContent: PDFContent): Promise<UseCaseData> {
    const startTime = Date.now();
    
    try {
      this.logger.info('Starting use case extraction', {
        fileName: pdfContent.fileName,
        textLength: pdfContent.text ? pdfContent.text.length : 0,
        totalPages: pdfContent.totalPages
      }, 'UseCaseExtractor', 'extractFirstUseCase');

      // Ensure we have valid text content
      const textContent = (pdfContent.text && typeof pdfContent.text === 'string') 
        ? pdfContent.text 
        : `Document: ${pdfContent.fileName} - Financial Services AI Use Cases`;

      // Prepare the content for analysis (limit to first 6000 characters)
      const analysisText = textContent.substring(0, 6000);
      
      const prompt = this.buildExtractionPrompt(analysisText);
      
      // Log the prompt being sent
      this.logger.logAzureOpenAIInteraction('prompt_generation', {
        operation: 'use_case_extraction',
        prompt: prompt,
        textLength: analysisText.length
      });

      const requestData = {
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4',
        messages: [
          {
            role: 'system' as const,
            content: 'You are a Financial Services solution analyst. Extract the FIRST viable use case optimized for professional demo generation. Return only valid JSON without any markdown formatting or code blocks.'
          },
          {
            role: 'user' as const,
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      };

      // Log the API request
      this.logger.logAzureOpenAIInteraction('api_request', requestData);

      const completion = await this.azureOpenAI.chat.completions.create(requestData);
      
      const duration = Date.now() - startTime;
      
      // Log the API response
      this.logger.logAzureOpenAIInteraction('api_response', {
        completion: completion,
        usage: completion.usage,
        duration
      }, duration);

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No response received from Azure OpenAI');
      }

      // Parse the JSON response
      let useCaseData: any;
      try {
        // Clean the response of any markdown formatting
        const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
        useCaseData = JSON.parse(cleanResponse);
      } catch (parseError) {
        this.logger.error('Failed to parse Azure OpenAI response as JSON', {
          response: response.substring(0, 500),
          parseError: parseError instanceof Error ? parseError.message : 'Unknown error'
        }, 'UseCaseExtractor');
        throw new Error('Invalid JSON response from Azure OpenAI');
      }

      // Validate and structure the use case data
      const structuredUseCase = this.validateAndStructureUseCase(useCaseData, pdfContent);
      
      this.logger.info('Use case extraction completed successfully', {
        fileName: pdfContent.fileName,
        extractedTitle: structuredUseCase.title,
        category: structuredUseCase.category,
        capabilitiesCount: structuredUseCase.capabilities.length,
        duration
      }, 'UseCaseExtractor', 'extractFirstUseCase');

      return structuredUseCase;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.logger.error('Use case extraction failed', {
        fileName: pdfContent.fileName,
        error: errorMessage,
        duration
      }, 'UseCaseExtractor', 'extractFirstUseCase');

      // Log the error to Azure OpenAI interactions log
      this.logger.logAzureOpenAIInteraction('api_error', {
        error: errorMessage,
        duration
      }, duration);

      throw new Error(`Failed to extract use case: ${errorMessage}`);
    }
  }

  /**
   * Builds the extraction prompt for Azure OpenAI
   */
  private buildExtractionPrompt(pdfContent: string): string {
    return `
Analyze this Financial Services PDF and extract the FIRST complete use case suitable for demo generation.

PDF Content: ${pdfContent}

Extract the FIRST viable use case with these details:
1. **Title**: Clear, descriptive name
2. **Category**: One of: Content Generation, Process Automation, Personalized Experience
3. **Description**: What business problem it solves (2-3 sentences)
4. **Key Capabilities**: List of 4-6 specific AI capabilities required
5. **User Journey**: Step-by-step user interaction flow (5-7 steps)
6. **Success Metrics**: How success is measured
7. **Demo Features**: Specific UI components needed (forms, dashboards, charts, etc.)
8. **Sample Data**: Types of synthetic data required

Return JSON format optimized for v0.dev React component generation:
{
  "title": "Use Case Name",
  "category": "Content Generation|Process Automation|Personalized Experience", 
  "description": "Business problem and solution overview",
  "capabilities": ["capability1", "capability2", "capability3", "capability4"],
  "userJourney": ["step1", "step2", "step3", "step4", "step5"],
  "successMetrics": ["metric1", "metric2", "metric3"],
  "demoFeatures": {
    "components": ["form", "dashboard", "chart", "table", "upload"],
    "interactions": ["upload", "process", "view results", "export"],
    "dataTypes": ["documents", "analytics", "recommendations"]
  },
  "sampleData": {
    "inputs": ["example input 1", "example input 2"],
    "outputs": ["example output 1", "example output 2"]
  }
}

Focus on use cases that can create compelling visual demos with forms, dashboards, and results displays.
Return ONLY the JSON object without any markdown formatting or code blocks.
`;
  }

  /**
   * Validates and structures the use case data from Azure OpenAI
   */
  private validateAndStructureUseCase(rawData: any, pdfContent: PDFContent): UseCaseData {
    try {
      // Validate required fields
      const requiredFields = ['title', 'category', 'description', 'capabilities', 'userJourney', 'successMetrics'];
      for (const field of requiredFields) {
        if (!rawData[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate category
      const validCategories = ['Content Generation', 'Process Automation', 'Personalized Experience'];
      if (!validCategories.includes(rawData.category)) {
        rawData.category = 'Content Generation'; // Default fallback
      }

      // Ensure arrays are properly structured
      const ensureArray = (value: any, defaultValue: string[] = []): string[] => {
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') return [value];
        return defaultValue;
      };

      const structuredUseCase: UseCaseData = {
        title: String(rawData.title || 'Financial Services Use Case'),
        category: rawData.category,
        description: String(rawData.description || 'AI-powered financial services solution'),
        capabilities: ensureArray(rawData.capabilities, ['AI Analysis', 'Data Processing', 'Report Generation', 'Decision Support']),
        userJourney: ensureArray(rawData.userJourney, ['Login', 'Upload Data', 'Process', 'Review Results', 'Export']),
        successMetrics: ensureArray(rawData.successMetrics, ['Processing Speed', 'Accuracy Rate', 'User Satisfaction']),
        demoFeatures: {
          components: ensureArray(rawData.demoFeatures?.components, ['form', 'dashboard', 'chart']),
          interactions: ensureArray(rawData.demoFeatures?.interactions, ['upload', 'process', 'view']),
          dataTypes: ensureArray(rawData.demoFeatures?.dataTypes, ['documents', 'analytics'])
        },
        sampleData: {
          inputs: ensureArray(rawData.sampleData?.inputs, ['Sample Document', 'Customer Data']),
          outputs: ensureArray(rawData.sampleData?.outputs, ['Analysis Report', 'Recommendations'])
        },
        extractedFrom: {
          fileName: pdfContent.fileName,
          extractedAt: new Date(),
          textLength: pdfContent.text.length
        }
      };

      this.logger.debug('Use case validation and structuring completed', {
        title: structuredUseCase.title,
        category: structuredUseCase.category,
        capabilitiesCount: structuredUseCase.capabilities.length
      }, 'UseCaseExtractor', 'validateAndStructureUseCase');

      return structuredUseCase;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Use case validation failed', {
        error: errorMessage,
        rawData: JSON.stringify(rawData, null, 2)
      }, 'UseCaseExtractor');

      // Return a fallback use case
      return this.createFallbackUseCase(pdfContent);
    }
  }

  /**
   * Creates a fallback use case when extraction fails
   */
  private createFallbackUseCase(pdfContent: PDFContent): UseCaseData {
    this.logger.warn('Creating fallback use case', {
      fileName: pdfContent.fileName
    }, 'UseCaseExtractor');

    return {
      title: 'Financial Services AI Solution',
      category: 'Content Generation',
      description: 'AI-powered solution for financial services that automates document processing and generates insights from customer data.',
      capabilities: [
        'Document Analysis',
        'Data Processing',
        'Report Generation',
        'Compliance Checking',
        'Risk Assessment',
        'Customer Insights'
      ],
      userJourney: [
        'User uploads financial documents',
        'System processes and validates data',
        'AI analyzes content and patterns',
        'System generates comprehensive report',
        'User reviews results and insights',
        'User exports or shares findings'
      ],
      successMetrics: [
        'Processing time reduction by 70%',
        'Accuracy rate of 95%+',
        'User satisfaction score 4.5/5'
      ],
      demoFeatures: {
        components: ['upload-form', 'progress-indicator', 'results-dashboard', 'export-panel'],
        interactions: ['file-upload', 'real-time-processing', 'interactive-charts', 'data-export'],
        dataTypes: ['financial-documents', 'customer-data', 'compliance-reports', 'risk-metrics']
      },
      sampleData: {
        inputs: [
          'Loan Application Documents',
          'Customer Financial Statements',
          'Regulatory Compliance Files'
        ],
        outputs: [
          'Risk Assessment Report',
          'Compliance Validation Summary',
          'Customer Credit Analysis'
        ]
      },
      extractedFrom: {
        fileName: pdfContent.fileName,
        extractedAt: new Date(),
        textLength: pdfContent.text.length
      }
    };
  }
}