#!/usr/bin/env node

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { DocsToDemo } from '../services/docs-to-demo';
import { LoggingService } from '../services/logging-service';

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' }); // Also load .env.local if it exists

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure we're in the correct working directory
const projectRoot = path.resolve(__dirname, '../../../..');
process.chdir(projectRoot);

interface CLIOptions {
  docsPath?: string;
  stage?: string;
  verbose?: boolean;
  help?: boolean;
}

class DocsTodemoCLI {
  private logger: LoggingService;

  constructor() {
    this.logger = LoggingService.getInstance();
  }

  /**
   * Parses command line arguments
   */
  private parseArgs(args: string[]): CLIOptions {
    const options: CLIOptions = {};
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
        case '--docs-path':
        case '-d':
          options.docsPath = args[++i];
          break;
        case '--stage':
        case '-s':
          options.stage = args[++i];
          break;
        case '--verbose':
        case '-v':
          options.verbose = true;
          process.env.ENABLE_VERBOSE_LOGGING = 'true';
          break;
        case '--help':
        case '-h':
          options.help = true;
          break;
      }
    }
    
    return options;
  }

  /**
   * Displays help information
   */
  private showHelp(): void {
    console.log(`
SolPlay DemoGen - Docs to Demo Workflow CLI

USAGE:
  npm run generate-demo-from-docs [OPTIONS]

OPTIONS:
  --docs-path, -d    Path to docs folder (default: ./docs)
  --stage, -s        Run specific stage only (scan|extract|usecase|prompt|demo)
  --verbose, -v      Enable verbose logging
  --help, -h         Show this help message

EXAMPLES:
  # Run complete workflow
  npm run generate-demo-from-docs

  # Run with custom docs path
  npm run generate-demo-from-docs --docs-path /path/to/pdfs

  # Run specific stage only
  npm run generate-demo-from-docs --stage scan

  # Enable verbose logging
  npm run generate-demo-from-docs --verbose

ENVIRONMENT VARIABLES:
  AZURE_OPENAI_API_KEY      Your Azure OpenAI API key
  AZURE_OPENAI_ENDPOINT     Your Azure OpenAI endpoint
  V0_API_KEY                Your v0.dev API key
  AI_PROVIDER               Provider strategy (hybrid|openai|v0|mock)
  ENABLE_MOCK_MODE          Use mock mode (true|false)

WORKFLOW STAGES:
  1. scan     - Scan docs folder for PDF files
  2. extract  - Extract text content from PDF
  3. usecase  - Extract use case with Azure OpenAI
  4. prompt   - Generate v0.dev optimized prompt
  5. demo     - Generate React demo with v0.dev

LOGS:
  Application logs: logs/application.log
  V0 interactions:  demoapp.log

For more information, see the README.md file.
`);
  }

  /**
   * Validates environment configuration
   */
  private validateEnvironment(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const aiProvider = process.env.AI_PROVIDER || 'hybrid';

    // Check Azure OpenAI configuration
    if (aiProvider === 'hybrid' || aiProvider === 'azure-openai') {
      if (!process.env.AZURE_OPENAI_API_KEY) {
        errors.push('AZURE_OPENAI_API_KEY is required');
      }
      if (!process.env.AZURE_OPENAI_ENDPOINT) {
        errors.push('AZURE_OPENAI_ENDPOINT is required');
      }
      if (!process.env.AZURE_OPENAI_DEPLOYMENT_NAME) {
        errors.push('AZURE_OPENAI_DEPLOYMENT_NAME is required');
      }
    }

    // Check v0.dev configuration
    if (aiProvider === 'hybrid' || aiProvider === 'v0') {
      if (!process.env.V0_API_KEY && process.env.ENABLE_MOCK_MODE !== 'true') {
        errors.push('V0_API_KEY is required (or set ENABLE_MOCK_MODE=true)');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Runs the complete workflow
   */
  private async runCompleteWorkflow(docsPath?: string): Promise<void> {
    console.log('🚀 Starting complete docs-to-demo workflow...\n');
    
    const orchestrator = new DocsToDemo(docsPath);
    const startTime = Date.now();
    
    try {
      const result = await orchestrator.executeWorkflow();
      const duration = Date.now() - startTime;
      
      console.log('📊 Workflow Results:');
      console.log('==================');
      console.log(`✅ Overall Success: ${result.success ? 'YES' : 'NO'}`);
      console.log(`⏱️  Total Duration: ${duration}ms`);
      console.log(`📄 PDF File: ${result.metadata.pdfFileName || 'N/A'}`);
      console.log(`📝 Use Case: ${result.metadata.useCaseTitle || 'N/A'}`);
      console.log(`🏷️  Category: ${result.metadata.category || 'N/A'}`);
      
      console.log('\n📋 Stage Results:');
      console.log('=================');
      Object.entries(result.stages).forEach(([stage, data]) => {
        const status = data.success ? '✅' : '❌';
        console.log(`${status} ${stage}: ${data.success ? 'SUCCESS' : 'FAILED'}`);
        if (data.error) {
          console.log(`   Error: ${data.error}`);
        }
      });
      
      if (result.finalDemo) {
        console.log('\n🎨 Demo Generation:');
        console.log('==================');
        console.log(`Provider: ${result.finalDemo.metadata.provider}`);
        console.log(`Has Code: ${!!result.finalDemo.demoCode}`);
        console.log(`Has URL: ${!!result.finalDemo.demoUrl}`);
        console.log(`Enhanced: ${!!result.finalDemo.syntheticData}`);
        
        if (result.finalDemo.demoUrl) {
          console.log(`Demo URL: ${result.finalDemo.demoUrl}`);
        }
      }
      
      console.log(`\\n📄 Log Files:`);
      console.log(`Application: logs/application.log`);
      console.log(`V0 Interactions: demoapp.log`);
      
      if (!result.success) {
        console.log(`\\n❌ Workflow failed: ${result.error}`);
        process.exit(1);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`\\n❌ Workflow execution failed: ${errorMessage}`);
      process.exit(1);
    }
  }

  /**
   * Runs a specific workflow stage
   */
  private async runSpecificStage(stage: string, docsPath?: string): Promise<void> {
    console.log(`🎯 Running specific stage: ${stage}\\n`);
    
    const orchestrator = new DocsToDemo(docsPath);
    
    try {
      const result = await orchestrator.executeStage(stage);
      console.log(`✅ Stage '${stage}' completed successfully:`);
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Stage '${stage}' failed: ${errorMessage}`);
      process.exit(1);
    }
  }

  /**
   * Main CLI entry point
   */
  async run(args: string[]): Promise<void> {
    const options = this.parseArgs(args);
    
    if (options.help) {
      this.showHelp();
      return;
    }
    
    console.log('📚 SolPlay DemoGen - Docs to Demo Workflow');
    console.log('==========================================\\n');
    
    // Validate environment
    const envValidation = this.validateEnvironment();
    if (!envValidation.valid) {
      console.error('❌ Environment validation failed:');
      envValidation.errors.forEach(error => console.error(`   • ${error}`));
      console.error('\\nPlease check your .env.local file or environment variables.');
      process.exit(1);
    }
    
    console.log('✅ Environment validation passed');
    
    // Show configuration
    const orchestrator = new DocsToDemo(options.docsPath);
    const info = orchestrator.getWorkflowInfo();
    
    console.log('\\n⚙️  Configuration:');
    console.log('==================');
    console.log(`AI Provider: ${info.environment.aiProvider}`);
    console.log(`Azure OpenAI: ${info.environment.hasAzureOpenAI ? 'Configured' : 'Missing'}`);
    console.log(`V0 API Key: ${info.environment.hasV0ApiKey ? 'Configured' : 'Missing'}`);
    console.log(`Mock Mode: ${info.environment.mockMode ? 'Enabled' : 'Disabled'}`);
    console.log(`Docs Path: ${options.docsPath || './docs'}`);
    console.log(`Log Path: ${info.logPath}`);
    
    console.log('\\n');
    
    // Run workflow
    if (options.stage) {
      await this.runSpecificStage(options.stage, options.docsPath);
    } else {
      await this.runCompleteWorkflow(options.docsPath);
    }
  }
}

// CLI entry point
console.log('🚀 Starting SolPlay DemoGen CLI...');
console.log('📁 Current working directory:', process.cwd());
console.log('📋 Command arguments:', process.argv.slice(2));
console.log('🔍 import.meta.url:', import.meta.url);
console.log('🔍 process.argv[1]:', process.argv[1]);

// Always run CLI since this is the entry point
console.log('✅ Running CLI');
const cli = new DocsTodemoCLI();
const args = process.argv.slice(2);

cli.run(args).catch(error => {
  console.error('❌ CLI execution failed:', error.message);
  process.exit(1);
});

export { DocsTodemoCLI };