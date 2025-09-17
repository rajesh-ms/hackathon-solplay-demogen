import { DocsProcessor } from './docs-processor';
import { PDFParser } from './pdf-parser';
import { UseCaseExtractor } from './usecase-extractor';
import { V0PromptGenerator } from './v0-prompt-generator';
import { V0DemoBuilder } from './v0-demo-builder';
import { LoggingService } from './logging-service';

export interface WorkflowResult {
  success: boolean;
  stages: {
    docsScanning: { success: boolean; data?: any; error?: string };
    pdfExtraction: { success: boolean; data?: any; error?: string };
    useCaseExtraction: { success: boolean; data?: any; error?: string };
    promptGeneration: { success: boolean; data?: any; error?: string };
    demoGeneration: { success: boolean; data?: any; error?: string };
  };
  finalDemo?: any;
  error?: string;
  metadata: {
    startTime: Date;
    endTime: Date;
    totalDuration: number;
    pdfFileName?: string;
    useCaseTitle?: string;
    category?: string;
  };
}

export class DocsToDemo {
  private docsProcessor: DocsProcessor;
  private pdfParser: PDFParser;
  private useCaseExtractor: UseCaseExtractor;
  private promptGenerator: V0PromptGenerator;
  private demoBuilder: V0DemoBuilder;
  private logger: LoggingService;

  constructor(docsPath?: string) {
    this.docsProcessor = new DocsProcessor(docsPath);
    this.pdfParser = new PDFParser();
    this.useCaseExtractor = new UseCaseExtractor();
    this.promptGenerator = new V0PromptGenerator();
    this.demoBuilder = new V0DemoBuilder();
    this.logger = LoggingService.getInstance();

    this.logger.info('DocsToDemo orchestrator initialized', {
      docsPath: docsPath || 'default'
    }, 'DocsToDemo');
  }

  /**
   * Executes the complete docs-to-demo workflow
   */
  async executeWorkflow(): Promise<WorkflowResult> {
    const startTime = new Date();
    
    // Clear previous logs for this workflow run
    this.logger.clearV0Log();
    
    this.logger.info('Starting complete docs-to-demo workflow', {
      timestamp: startTime.toISOString()
    }, 'DocsToDemo', 'executeWorkflow');

    const result: WorkflowResult = {
      success: false,
      stages: {
        docsScanning: { success: false },
        pdfExtraction: { success: false },
        useCaseExtraction: { success: false },
        promptGeneration: { success: false },
        demoGeneration: { success: false }
      },
      metadata: {
        startTime,
        endTime: new Date(),
        totalDuration: 0
      }
    };

    try {
      // Stage 1: Scan docs folder and get first PDF
      this.logger.info('Stage 1: Scanning docs folder', {}, 'DocsToDemo', 'executeWorkflow');
      const firstPDF = await this.docsProcessor.getFirstPDF();
      
      if (!firstPDF) {
        throw new Error('No PDF files found in docs folder');
      }

      const isValid = await this.docsProcessor.validatePDF(firstPDF);
      if (!isValid) {
        throw new Error('PDF validation failed');
      }

      result.stages.docsScanning = { 
        success: true, 
        data: { fileName: firstPDF.fileName, size: firstPDF.size }
      };
      result.metadata.pdfFileName = firstPDF.fileName;

      // Stage 2: Extract text from PDF
      this.logger.info('Stage 2: Extracting text from PDF', {
        fileName: firstPDF.fileName
      }, 'DocsToDemo', 'executeWorkflow');
      
      const pdfContent = await this.pdfParser.extractText(firstPDF);
      const processedText = this.pdfParser.preprocessText(pdfContent);
      
      result.stages.pdfExtraction = { 
        success: true, 
        data: { 
          textLength: processedText.length, 
          totalPages: pdfContent.totalPages,
          extractedAt: pdfContent.extractedAt
        }
      };

      // Stage 3: Extract use case with Azure OpenAI
      this.logger.info('Stage 3: Extracting use case with Azure OpenAI', {
        textLength: processedText.length
      }, 'DocsToDemo', 'executeWorkflow');
      
      const useCase = await this.useCaseExtractor.extractFirstUseCase({
        ...pdfContent,
        text: processedText
      });
      
      result.stages.useCaseExtraction = { 
        success: true, 
        data: { 
          title: useCase.title, 
          category: useCase.category,
          capabilitiesCount: useCase.capabilities.length
        }
      };
      result.metadata.useCaseTitle = useCase.title;
      result.metadata.category = useCase.category;

      // Stage 4: Generate v0.dev prompt
      this.logger.info('Stage 4: Generating v0.dev prompt', {
        useCaseTitle: useCase.title,
        category: useCase.category
      }, 'DocsToDemo', 'executeWorkflow');
      
      const promptData = this.promptGenerator.generatePrompt(useCase);
      
      result.stages.promptGeneration = { 
        success: true, 
        data: { 
          promptLength: promptData.prompt.length,
          category: promptData.category
        }
      };

      // Stage 5: Generate demo with v0.dev
      this.logger.info('Stage 5: Generating demo with v0.dev', {
        promptLength: promptData.prompt.length
      }, 'DocsToDemo', 'executeWorkflow');
      
      const demoResult = await this.demoBuilder.generateDemo(promptData, useCase);
      
      result.stages.demoGeneration = { 
        success: demoResult.success, 
        data: demoResult.success ? {
          hasCode: !!demoResult.demoCode,
          hasUrl: !!demoResult.demoUrl,
          provider: demoResult.metadata.provider,
          hasSyntheticData: !!demoResult.syntheticData
        } : undefined,
        error: demoResult.error
      };

      if (demoResult.success) {
        result.finalDemo = demoResult;
        result.success = true;
      }

      // Complete workflow
      const endTime = new Date();
      result.metadata.endTime = endTime;
      result.metadata.totalDuration = endTime.getTime() - startTime.getTime();

      this.logger.info('Docs-to-demo workflow completed', {
        success: result.success,
        totalDuration: result.metadata.totalDuration,
        pdfFileName: result.metadata.pdfFileName,
        useCaseTitle: result.metadata.useCaseTitle,
        category: result.metadata.category,
        stagesCompleted: Object.values(result.stages).filter(s => s.success).length
      }, 'DocsToDemo', 'executeWorkflow');

      return result;
    } catch (error) {
      const endTime = new Date();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      result.metadata.endTime = endTime;
      result.metadata.totalDuration = endTime.getTime() - startTime.getTime();
      result.error = errorMessage;

      this.logger.error('Docs-to-demo workflow failed', {
        error: errorMessage,
        totalDuration: result.metadata.totalDuration,
        stagesCompleted: Object.values(result.stages).filter(s => s.success).length
      }, 'DocsToDemo', 'executeWorkflow');

      return result;
    }
  }

  /**
   * Executes individual workflow stages for testing/debugging
   */
  async executeStage(stageName: string, previousData?: any): Promise<any> {
    this.logger.info(`Executing individual stage: ${stageName}`, {
      stageName,
      hasPreviousData: !!previousData
    }, 'DocsToDemo', 'executeStage');

    try {
      switch (stageName) {
        case 'scan':
          return await this.docsProcessor.getFirstPDF();
          
        case 'extract':
          if (!previousData?.pdf) throw new Error('PDF data required');
          return await this.pdfParser.extractText(previousData.pdf);
          
        case 'usecase':
          if (!previousData?.content) throw new Error('PDF content required');
          return await this.useCaseExtractor.extractFirstUseCase(previousData.content);
          
        case 'prompt':
          if (!previousData?.useCase) throw new Error('Use case data required');
          return this.promptGenerator.generatePrompt(previousData.useCase);
          
        case 'demo':
          if (!previousData?.prompt || !previousData?.useCase) {
            throw new Error('Prompt and use case data required');
          }
          return await this.demoBuilder.generateDemo(previousData.prompt, previousData.useCase);
          
        default:
          throw new Error(`Unknown stage: ${stageName}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Stage execution failed: ${stageName}`, {
        stageName,
        error: errorMessage
      }, 'DocsToDemo', 'executeStage');
      throw error;
    }
  }

  /**
   * Gets workflow status and logs information
   */
  getWorkflowInfo(): any {
    return {
      logPath: this.logger.getV0LogPath(),
      services: {
        docsProcessor: 'DocsProcessor - Scans docs folder for PDFs',
        pdfParser: 'PDFParser - Extracts text from PDF files',
        useCaseExtractor: 'UseCaseExtractor - Uses Azure OpenAI for use case analysis',
        promptGenerator: 'V0PromptGenerator - Creates v0.dev optimized prompts',
        demoBuilder: 'V0DemoBuilder - Generates React demos via v0.dev API'
      },
      environment: {
        aiProvider: process.env.AI_PROVIDER || 'hybrid',
        hasAzureOpenAI: !!(process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT),
        hasV0ApiKey: !!process.env.V0_API_KEY,
        mockMode: process.env.ENABLE_MOCK_MODE === 'true'
      }
    };
  }
}