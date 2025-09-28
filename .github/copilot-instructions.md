# AI Coding Agent Instructions for SolPlay DemoGen

## Project Overview

**SolPlay DemoGen** is an intelligent platform that accepts use case data directly via API and generates interactive, appealing demos using the v0.dev SDK. This project implements ARIA v4's 8-role AI development framework with a focus on demo generation from structured input.

## Key Architecture

### Direct Input System
- **API Input**: Accept use case title, key capabilities, and other structured data directly
- **v0.dev SDK**: React component generation and UI creation
- **Demo Generation**: Transform use case data into compelling visual demonstrations

### Core Components

## Critical Workflow: Docs Folder to Demo Generation and Local Deployment

The complete workflow now includes automatic deployment and local execution of generated demos.

### Complete Workflow Overview
```
docs → scan PDF → extract text → use case extraction → v0 prompt → generate code → deploy to demo-app → install deps → start server
```

### Local Demo Deployment & Live URL Passback

**Goal:**
- When a demo is generated via `api-demogen` (using v0-sdk), deploy the generated React app locally (e.g., as a standalone server on a unique port).
- Pass back the local URL (including port) to the frontend UI so the user can access and interact with the live demo.

**Implementation Plan:**
1. **Demo Generation (existing):**
  - Continue using v0-sdk to generate React component code.
2. **Local Deployment:**
  - After generation, write the React code to a temporary directory.
  - Use a tool like `serve`, `vite`, or a minimal Express/Next.js server to host the generated app on a unique port (e.g., 4000+N).
  - Start the server programmatically and track the port.
3. **API Response:**
  - When returning the demo result, include the local URL (e.g., `http://localhost:4001`) in the response payload.
4. **Frontend UI:**
  - On demo generation, display a link/button to open the live demo at the returned URL.
5. **Cleanup:**
  - Optionally, implement a TTL or manual cleanup for old demo servers.

**Next Steps:**
- Add a service to `api-demogen` to deploy and serve generated React code on a dynamic port.
- Update the demo generation route to include the live URL in its response.
- Ensure the frontend UI uses this URL for user access.
## Critical Workflow: Direct Input to Demo Generation

### Phase 1: API Input Validation and Processing
```typescript
// Implementation in api-demogen/src/services/input-processor.ts
export class InputProcessor {
  async validateUseCaseInput(input: any): Promise<UseCaseData> {
    const schema = Joi.object({
      useCaseTitle: Joi.string().min(3).max(200).required(),
      keyCapabilities: Joi.array().items(Joi.string().min(2).max(100)).min(1).max(10).required(),
      description: Joi.string().max(500).optional(),
      category: Joi.string().valid('Content Generation', 'Process Automation', 'Personalized Experience').optional(),
      targetAudience: Joi.string().max(100).optional(),
      industryVertical: Joi.string().max(50).optional()
    });

    const { error, value } = schema.validate(input);
    if (error) {
      throw new ValidationError(`Invalid input: ${error.details[0].message}`);
    }

    return this.enrichUseCaseData(value);
  }

  private enrichUseCaseData(input: any): UseCaseData {
    // Enrich basic input with demo-specific data structure
    return {
      title: input.useCaseTitle,
      category: input.category || this.inferCategory(input.keyCapabilities),
      description: input.description || `${input.useCaseTitle} demonstrating ${input.keyCapabilities.join(', ')}`,
      capabilities: input.keyCapabilities,
      userJourney: this.generateUserJourney(input.keyCapabilities),
      successMetrics: this.generateSuccessMetrics(input.category),
      demoFeatures: this.inferDemoFeatures(input.keyCapabilities),
      sampleData: this.generateSampleData(input.keyCapabilities)
    };
  }
}
```

### Phase 2: Use Case Enhancement and Enrichment
```typescript
// Implementation in api-demogen/src/services/usecase-enricher.ts
export class UseCaseEnricher {
  async enrichUseCase(basicInput: UseCaseInput): Promise<UseCaseData> {
    // Generate comprehensive use case data from basic input
    const enrichedData: UseCaseData = {
      title: basicInput.useCaseTitle,
      category: basicInput.category || this.inferCategory(basicInput.keyCapabilities),
      description: basicInput.description || this.generateDescription(basicInput),
      capabilities: basicInput.keyCapabilities,
      userJourney: this.generateUserJourney(basicInput),
      successMetrics: this.generateSuccessMetrics(basicInput),
      demoFeatures: this.generateDemoFeatures(basicInput),
      sampleData: this.generateSampleData(basicInput)
    };

    return enrichedData;
  }

  private inferCategory(capabilities: string[]): string {
    const contentWords = ['generate', 'create', 'write', 'content', 'document'];
    const automationWords = ['automate', 'process', 'workflow', 'approve', 'analyze'];
    const personalizationWords = ['personalize', 'recommend', 'tailor', 'customize', 'profile'];

    const capabilityText = capabilities.join(' ').toLowerCase();
    
    if (contentWords.some(word => capabilityText.includes(word))) {
      return 'Content Generation';
    } else if (automationWords.some(word => capabilityText.includes(word))) {
      return 'Process Automation';
    } else if (personalizationWords.some(word => capabilityText.includes(word))) {
      return 'Personalized Experience';
    }
    
    return 'Content Generation'; // Default fallback
  }
}
```

### Phase 3: V0 Prompt Generation
```typescript
// Implementation in phase1/backend/src/services/v0-prompt-generator.ts
export class V0PromptGenerator {
  generatePrompt(useCase: UseCaseData): string {
    const categoryPrompts = {
      'Content Generation': this.getContentGenerationPrompt(useCase),
      'Process Automation': this.getProcessAutomationPrompt(useCase), 
      'Personalized Experience': this.getPersonalizationPrompt(useCase)
    };

    return categoryPrompts[useCase.category] || this.getDefaultPrompt(useCase);
  }

  private getContentGenerationPrompt(useCase: UseCaseData): string {
    return `
Create a professional React application for "${useCase.title}" - a Financial Services content generation demo.

Requirements:
- **Business Context**: ${useCase.description}
- **Key Capabilities**: ${useCase.capabilities.join(', ')}
- **User Journey**: ${useCase.userJourney.join(' → ')}

Build a multi-step interface with:
1. **Input Section**: Document upload area, text input forms, parameter controls
2. **Processing View**: Loading states, progress indicators, AI processing simulation
3. **Results Dashboard**: Generated content display, confidence scores, editing tools
4. **Export Options**: Download buttons, sharing features, refinement controls

Design Requirements:
- Use Tailwind CSS with an attractive color scheme (blues, whites, grays)
- Basic responsive design that works on desktop and tablet
- Clean typography and spacing
- Interactive elements with hover states

Sample Data to Include:
- Input Examples: ${useCase.sampleData.inputs.join(', ')}
- Output Examples: ${useCase.sampleData.outputs.join(', ')}

Include sample synthetic data that demonstrates the AI capability:
- Mock processing times (2-5 seconds)
- Confidence scores (85-98%)
- Progress indicators showing analysis steps
- Demo-appropriate content examples

Components Needed: ${useCase.demoFeatures.components.join(', ')}
Interactions: ${useCase.demoFeatures.interactions.join(', ')}

Make it look like an appealing demo application with engaging UX.
`;
  }

  private getProcessAutomationPrompt(useCase: UseCaseData): string {
    return `
Create a React dashboard for "${useCase.title}" - a Financial Services process automation demo.

Requirements:
- **Business Context**: ${useCase.description}
- **Automation Capabilities**: ${useCase.capabilities.join(', ')}
- **Workflow Steps**: ${useCase.userJourney.join(' → ')}

Build a workflow automation dashboard with:
1. **Process Overview**: Workflow visualization, status indicators, performance metrics
2. **Task Management**: Active tasks list, priority queues, assignment controls
3. **Analytics Dashboard**: Success rates, processing times, cost savings charts
4. **Monitoring Panel**: Real-time alerts, compliance tracking, audit logs

Design Requirements:
- Dashboard aesthetic with data visualization
- Use Chart.js or Recharts for analytics displays
- Status indicators with color coding (green/yellow/red)
- Card-based layout with clear hierarchy

Sample Data Integration:
- Process Metrics: ${useCase.successMetrics.join(', ')}
- Workflow Examples: ${useCase.sampleData.inputs.join(', ')}
- Automation Results: ${useCase.sampleData.outputs.join(', ')}

Include realistic automation metrics:
- Processing volumes (1000+ items/day)
- Accuracy rates (94-99%)
- Time savings (60-80% reduction)
- Cost optimization (30-50% savings)

Components: ${useCase.demoFeatures.components.join(', ')}
Make it demonstrate clear business value with compelling metrics.
`;
  }

  private getPersonalizationPrompt(useCase: UseCaseData): string {
    return `
Create a React application for "${useCase.title}" - a Financial Services personalization demo.

Requirements:
- **Personalization Focus**: ${useCase.description}
- **AI Capabilities**: ${useCase.capabilities.join(', ')}
- **Customer Journey**: ${useCase.userJourney.join(' → ')}

Build a personalized customer experience with:
1. **Customer Profile**: Demographics, preferences, financial goals, risk profile
2. **AI Recommendations**: Personalized products, investment options, financial advice
3. **Insights Dashboard**: Spending analysis, savings opportunities, goal tracking
4. **Action Center**: Recommended actions, next steps, goal management

Design Requirements:
- Customer-centric design with warm, approachable colors
- Personalized cards and recommendations
- Progress bars for financial goals
- Interactive elements for exploring options

Sample Personalization Data:
- Customer Types: ${useCase.sampleData.inputs.join(', ')}
- Recommendation Types: ${useCase.sampleData.outputs.join(', ')}

Include realistic customer scenarios:
- Customer profiles (age, income, goals)
- Personalized recommendations with reasoning
- Goal tracking and progress visualization
- Risk assessment and investment options

Success Metrics Display: ${useCase.successMetrics.join(', ')}
Components: ${useCase.demoFeatures.components.join(', ')}

Create an engaging, personalized financial experience that demonstrates AI-driven insights.
`;
  }
}
```

### Phase 4: V0 SDK Integration and Demo Generation
```typescript
// Implementation in phase1/backend/src/services/v0-demo-builder.ts
export class V0DemoBuilder {
  private v0Client: V0Client;
  private promptGenerator: V0PromptGenerator;

  async generateDemo(useCase: UseCaseData): Promise<DemoResult> {
    // 1. Generate optimized v0 prompt
    const prompt = this.promptGenerator.generatePrompt(useCase);
    
    // 2. Call v0.dev API for React component generation
    const v0Response = await this.v0Client.generateComponent({ 
      prompt,
      framework: 'react',
      styling: 'tailwindcss'
    });
    
    // 3. Enhance with synthetic data
    const enhancedDemo = await this.enhanceWithSyntheticData(v0Response, useCase);
    
    // 4. Add professional finishing touches
    return this.addProfessionalFeatures(enhancedDemo, useCase);
  }

  private async enhanceWithSyntheticData(demo: any, useCase: UseCaseData): Promise<any> {
    // Add realistic synthetic data based on use case type
    const syntheticData = this.generateSyntheticData(useCase);
    
    // Inject data into component props and state
    return {
      ...demo,
      syntheticData,
      metadata: {
        useCase: useCase.title,
        category: useCase.category,
        generatedAt: new Date().toISOString(),
        provider: 'v0-enhanced'
      }
    };
  }

  private generateSyntheticData(useCase: UseCaseData): any {
    const dataGenerators = {
      'Content Generation': () => ({
        documents: ['RFP Response Document', 'Marketing Content', 'Proposal Template'],
        processing: { duration: '3.2s', confidence: '94%', status: 'completed' },
        results: useCase.sampleData.outputs
      }),
      'Process Automation': () => ({
        workflows: ['KYC Processing', 'Loan Underwriting', 'Compliance Check'],
        metrics: { processed: 1247, accuracy: '97%', timeSaved: '68%' },
        tasks: this.generateTaskData()
      }),
      'Personalized Experience': () => ({
        customers: this.generateCustomerProfiles(),
        recommendations: this.generateRecommendations(),
        insights: this.generatePersonalInsights()
      })
    };

    return dataGenerators[useCase.category]?.() || {};
  }
}
```

### Phase 5: Demo Deployment to Local Environment
```typescript
// Implementation in phase1/backend/src/services/demo-deployer.ts
export class DemoDeployer {
  async deployDemo(demoResult: V0DemoResult, useCaseTitle: string): Promise<DeploymentResult> {
    // 1. Ensure demo-app directory structure exists
    await this.ensureDemoAppStructure();

    // 2. Generate component name from use case title
    const componentName = this.generateComponentName(useCaseTitle);

    // 3. Save component to demo-app/src/components/
    const componentPath = await this.saveComponent(componentName, demoResult.demoCode);

    // 4. Update demo-app/src/app/page.tsx to import and render component
    await this.updateMainPage(componentName);

    return { success: true, componentPath, pageUpdated: true };
  }

  private generateComponentName(title: string): string {
    // Convert "Automated Investment Portfolio" -> "AutomatedInvestmentPortfolio"
    return title
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  private async saveComponent(componentName: string, code: string): Promise<string> {
    const componentPath = path.join(this.demoAppPath, 'src', 'components', `${componentName}.tsx`);

    // Extract code from markdown blocks if present
    let cleanCode = code;
    const codeBlockMatch = code.match(/```(?:tsx|typescript|jsx|javascript)?\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
      cleanCode = codeBlockMatch[1];
    }

    // Ensure 'use client' directive and React import
    if (!cleanCode.includes('use client')) {
      cleanCode = `'use client';\n\n${cleanCode}`;
    }

    await fs.writeFile(componentPath, cleanCode, 'utf-8');
    return componentPath;
  }
}
```

### Phase 6: Dependency Detection and Installation
```typescript
// Implementation in phase1/backend/src/services/dependency-installer.ts
export class DependencyInstaller {
  detectDependencies(code: string): string[] {
    const dependencies = new Set<string>();

    // Detect common libraries used in v0.dev components
    const importPatterns = [
      { pattern: /from ['"]recharts['"]/g, package: 'recharts' },
      { pattern: /from ['"]lucide-react['"]/g, package: 'lucide-react' },
      { pattern: /from ['"]@radix-ui\/(.*?)['"]/g, package: '@radix-ui/' },
      { pattern: /from ['"]framer-motion['"]/g, package: 'framer-motion' },
      // ... more patterns
    ];

    for (const { pattern, package: pkg } of importPatterns) {
      if (pattern.test(code)) {
        dependencies.add(pkg);
      }
    }

    return Array.from(dependencies);
  }

  async installDependencies(dependencies: string[]): Promise<DependencyInstallResult> {
    // 1. Check which dependencies are already installed
    const { installed, missing } = await this.checkInstalledDependencies(dependencies);

    if (missing.length === 0) {
      return { success: true, alreadyInstalled: installed };
    }

    // 2. Install missing dependencies
    const installCommand = `npm install ${missing.join(' ')}`;
    await execAsync(installCommand, {
      cwd: this.demoAppPath,
      timeout: 120000
    });

    return { success: true, installed: missing, alreadyInstalled: installed };
  }
}
```

### Phase 7: Development Server Management
```typescript
// Implementation in phase1/backend/src/services/dev-server.ts
export class DevServer {
  private serverProcess: ChildProcess | null = null;
  private serverUrl: string = 'http://localhost:3000';

  async startServer(): Promise<DevServerResult> {
    // 1. Spawn npm run dev process
    this.serverProcess = spawn('npm', ['run', 'dev'], {
      cwd: this.demoAppPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true
    });

    // 2. Monitor stdout for ready signal
    let serverStarted = false;
    this.serverProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Local:') || output.includes('localhost:3000') || output.includes('Ready in')) {
        serverStarted = true;
      }
    });

    // 3. Wait for server to be ready (max 30 seconds)
    const maxWaitTime = 30000;
    const checkInterval = 500;
    let waited = 0;

    while (!serverStarted && waited < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waited += checkInterval;
    }

    return {
      success: true,
      serverUrl: this.serverUrl,
      processId: this.serverProcess.pid
    };
  }

  async stopServer(): Promise<{ success: boolean }> {
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');
      this.serverProcess = null;
    }
    return { success: true };
  }

  getStatus(): DevServerStatus {
    const running = this.serverProcess !== null && !this.serverProcess.killed;
    return {
      running,
      processId: this.serverProcess?.pid,
      serverUrl: running ? this.serverUrl : undefined
    };
  }
}
```

### Phase 8: Complete Workflow Orchestration
```typescript
// Implementation in phase1/backend/src/services/docs-to-demo.ts
export class DocsToDemo {
  async executeWorkflow(): Promise<WorkflowResult> {
    // Stages 1-5: Original workflow (scan, extract, usecase, prompt, demo)
    // ... (existing code)

    // Stage 6: Deploy to demo-app
    if (demoResult.success) {
      const deployResult = await this.deployer.deployDemo(demoResult, useCase.title);
      result.stages.deployment = { success: deployResult.success, data: deployResult };

      // Stage 7: Install dependencies
      if (deployResult.success && demoResult.demoCode) {
        const depResult = await this.dependencyInstaller.detectAndInstall(demoResult.demoCode);
        result.stages.dependencyInstall = { success: depResult.success, data: depResult };

        // Stage 8: Start dev server
        const serverResult = await this.devServer.startServer();
        result.stages.serverStart = { success: serverResult.success, data: serverResult };

        if (serverResult.success) {
          result.metadata.serverUrl = serverResult.serverUrl;
          result.success = true;
        }
      }
    }

    return result;
  }
}
```

## Environment Configuration

### Required Environment Variables
```bash
# v0.dev Configuration (for demo generation)
V0_API_KEY=your_v0_api_key
V0_BASE_URL=https://v0.dev/api

# Provider Configuration
AI_PROVIDER=v0  # Uses v0 for demo generation
DEMO_GENERATION_PROVIDER=v0
```

## Development Workflow

### 1. Run Complete Workflow (Recommended)
```bash
npm run generate-demo-from-docs
```

This single command now:
- Scans docs folder for PDFs
- Extracts text from first PDF
- Analyzes content with Azure OpenAI
- Generates v0.dev prompt
- Creates React demo with v0.dev API
- **Deploys code to demo-app/**
- **Installs required dependencies**
- **Starts dev server at http://localhost:3000**

### 2. Individual Stage Execution
```bash
# Stage 1: Scan docs folder
npm run scan-docs

# Stage 2: Extract use case from first PDF
npm run extract-usecase

# Stage 3: Generate v0 prompt
npm run generate-prompt

# Stage 4: Create demo with v0
npm run generate-demo

# Stage 5: Deploy to demo-app
npm run deploy-demo

# Stage 6: Install dependencies
npm run install-deps

# Stage 7: Start dev server
npm run start-demo

# Stage 8: Stop dev server
npm run stop-demo
```

### 3. Alternative: Run API Server for Direct Input
```bash
cd api-demogen
npm run dev
```

### 4. Test API with Sample Data
```bash
# Test with sample use case data
curl -X POST http://localhost:3000/api/v1/generate-demo \
  -H "Content-Type: application/json" \
  -d '{
    "useCaseTitle": "AI-Powered Customer Support",
    "keyCapabilities": ["Natural language processing", "Automated ticket routing", "Sentiment analysis", "Response generation"],
    "category": "Process Automation",
    "description": "Automate customer support workflows using AI"
  }'
```

### 3. Monitor Demo Generation
```bash
# Check status
curl http://localhost:3000/api/v1/demo-status/{demoId}

# View generated demo
curl http://localhost:3000/api/v1/demos/{demoId}
```

### 4. Local Development Workflow
After running the complete workflow:
```bash
# Demo is automatically deployed and running at http://localhost:3000

# To stop the dev server
npm run stop-demo

# To restart the server
npm run start-demo
```

## Quality Standards

### Generated Demo Requirements
- **Appealing UI**: Attractive design suitable for demonstrations
- **Responsive**: Works on desktop and tablet
- **Interactive**: Engaging user interactions and feedback
- **Data-Rich**: Compelling synthetic data that tells a story
- **Functional**: Smooth operation for demo purposes

### Code Quality
- TypeScript for type safety
- Basic linting for code consistency
- Prettier formatting
- Simple validation for demo functionality

## Troubleshooting

### Common Issues
- **Invalid Input Data**: Ensure use case title and capabilities are provided
- **v0.dev Rate Limits**: Implement exponential backoff and queuing
- **Missing Required Fields**: Check API validation error messages
- **Demo Generation Errors**: v0 prompt may need refinement for specific use cases

### Fallback Strategies
- Use mock providers when APIs are unavailable
- Pre-generated use case templates for common scenarios
- Static demo templates as fallbacks
- Graceful error handling with user-friendly messages

## Key Principles for AI Agents

1. **Direct Input Strategy**: Accept structured use case data directly via API for immediate processing
2. **v0 Focus**: Use v0.dev SDK as the primary tool for React component generation
3. **Input Validation**: Ensure robust validation of incoming use case data structure
4. **Demo Quality**: Generate appealing demos suitable for presentations and demonstrations
5. **Synthetic Data Integration**: Include realistic, compelling data that demonstrates business value
6. **Responsive Design**: Ensure demos work across desktop and tablet devices
7. **Error Resilience**: Provide graceful fallbacks when services are unavailable
8. **Automatic Deployment**: Generated demos are automatically deployed to demo-app and running locally
9. **Dependency Management**: Required npm packages are detected and installed automatically
10. **Local Execution**: Dev server is started automatically and accessible at http://localhost:3000

## Workflow Summary

This complete workflow transforms static solution play PDFs into **live, running, interactive demos** automatically:

1. **PDF Processing** → Scan and extract text from docs folder
2. **AI Analysis** → Azure OpenAI extracts use cases and requirements
3. **Code Generation** → v0.dev creates professional React components
4. **Deployment** → Code is saved to demo-app/src/components/
5. **Dependency Installation** → Required packages detected and installed via npm
6. **Server Start** → Next.js dev server launched at http://localhost:3000
7. **Result** → **Live demo running locally, ready to view in browser**

The entire process is automated and requires only one command: `npm run generate-demo-from-docs`

This workflow transforms structured use case input into interactive, appealing demos automatically using the power of v0.dev for React component generation.
