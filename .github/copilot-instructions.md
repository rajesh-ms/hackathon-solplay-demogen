# AI Coding Agent Instructions for SolPlay DemoGen

## Project Overview

**SolPlay DemoGen** is an intelligent platform that automatically reads Financial Services solution play PDFs from the `docs/` folder, extracts the first viable use case using Azure OpenAI, and generates interactive, professional demos using the v0.dev SDK. This project implements ARIA v4's 8-role AI development framework with a hybrid AI provider architecture.

## Key Architecture

### Hybrid AI Provider System
- **Azure OpenAI**: PDF content analysis and use case extraction 
- **v0.dev SDK**: React component generation and UI creation
- **Provider Abstraction**: Seamless switching between AI providers via `AI_PROVIDER` env var

### Core Components
- **PDFProcessor** (`phase1/backend/src/pdf-parser.ts`): Extract text from solution play PDFs using PyMuPDF (MuPDF)
- **AIProcessor** (`phase1/backend/src/ai-processor.ts`): Use Azure OpenAI for content analysis  
- **UseCaseExtractor**: Identify first viable use case from PDF content
- **V0Client** (`phase1/backend/src/v0-client.ts`): Generate React components via v0.dev API
- **DemoBuilder** (`phase1/backend/src/demo-builder.ts`): Assemble complete demo applications

## Critical Workflow: Docs Folder to Demo Generation

### Phase 1: PDF Auto-Discovery and Reading
```typescript
// Implementation in phase1/backend/src/services/docs-processor.ts
export class DocsProcessor {
  async scanDocsFolder(): Promise<string[]> {
    const docsPath = path.join(process.cwd(), 'docs');
    const files = await fs.readdir(docsPath);
    return files.filter(file => file.toLowerCase().endsWith('.pdf'));
  }

  async readFirstPDF(): Promise<{filePath: string, content: string}> {
    const pdfFiles = await this.scanDocsFolder();
    if (pdfFiles.length === 0) throw new Error('No PDF files found in docs folder');
    
    const firstPDF = pdfFiles[0]; // Pick first PDF alphabetically
    const filePath = path.join(process.cwd(), 'docs', firstPDF);
    const content = await this.pdfParser.extractText(filePath);
    
    return { filePath, content };
  }
}
```

### Phase 2: Use Case Extraction with Azure OpenAI
```typescript
// Implementation in phase1/backend/src/services/usecase-extractor.ts
export class UseCaseExtractor {
  private azureOpenAI: OpenAI;

  constructor() {
    this.azureOpenAI = new OpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      baseURL: process.env.AZURE_OPENAI_ENDPOINT,
      defaultQuery: { 'api-version': '2024-02-15-preview' }
    });
  }

  async extractFirstUseCase(pdfContent: string): Promise<UseCaseData> {
    const prompt = `
Analyze this Financial Services PDF and extract the FIRST complete use case suitable for demo generation.

PDF Content: ${pdfContent.substring(0, 6000)}

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
`;

    const completion = await this.azureOpenAI.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a Financial Services solution analyst. Extract the FIRST viable use case optimized for professional demo generation.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const response = completion.choices[0]?.message?.content;
    return JSON.parse(response);
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
- Use Tailwind CSS with a professional financial services color scheme (navy blues, whites, light grays)
- Responsive design that works on desktop and tablet
- Accessibility compliance (WCAG 2.1 AA)
- Professional typography and spacing
- Interactive elements with hover states and smooth transitions

Sample Data to Include:
- Input Examples: ${useCase.sampleData.inputs.join(', ')}
- Output Examples: ${useCase.sampleData.outputs.join(', ')}

Include realistic synthetic data that demonstrates the AI capability:
- Mock processing times (2-5 seconds)
- Confidence scores (85-98%)
- Progress indicators showing analysis steps
- Professional financial services content examples

Components Needed: ${useCase.demoFeatures.components.join(', ')}
Interactions: ${useCase.demoFeatures.interactions.join(', ')}

Make it look like a production-ready enterprise AI application with polished UX.
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
- Enterprise dashboard aesthetic with data visualization
- Use Chart.js or Recharts for analytics displays
- Status indicators with color coding (green/yellow/red)
- Professional card-based layout with clear hierarchy

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
// Implementation in phase1/backend/src/services/demo-generator.ts
export class DemoGenerator {
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

## Environment Configuration

### Required Environment Variables
```bash
# Azure OpenAI Configuration (for PDF analysis)
AZURE_OPENAI_API_KEY=your_azure_openai_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4

# v0.dev Configuration (for demo generation)
V0_API_KEY=your_v0_api_key
V0_BASE_URL=https://v0.dev/api

# Provider Configuration
AI_PROVIDER=hybrid  # Uses Azure OpenAI for analysis, v0 for generation
USE_CASE_EXTRACTION_PROVIDER=azure-openai
DEMO_GENERATION_PROVIDER=v0
```

## Development Workflow

### 1. Run Complete Workflow
```bash
cd phase1/backend
npm run generate-demo-from-docs
```

### 2. Individual Steps
```bash
# Step 1: Scan docs folder
npm run scan-docs

# Step 2: Extract use case from first PDF
npm run extract-usecase

# Step 3: Generate v0 prompt
npm run generate-prompt

# Step 4: Create demo with v0
npm run generate-demo
```

### 3. Test with Mock Data
```bash
# Use mock providers for development
export AI_PROVIDER=mock
npm run generate-demo-mock
```

## Quality Standards

### Generated Demo Requirements
- **Professional UI**: Enterprise-grade financial services design
- **Responsive**: Works on desktop, tablet, and mobile
- **Accessible**: WCAG 2.1 AA compliance
- **Interactive**: Realistic user interactions and feedback
- **Data-Rich**: Compelling synthetic data that tells a story
- **Performance**: Fast loading and smooth animations

### Code Quality
- TypeScript strict mode enabled
- ESLint configuration for React and Node.js
- Prettier formatting
- Jest unit tests for all utilities
- Integration tests for the complete workflow

## Troubleshooting

### Common Issues
- **No PDFs Found**: Ensure PDF files exist in `docs/` folder
- **Azure OpenAI Errors**: Verify API key and endpoint configuration
- **v0.dev Rate Limits**: Implement exponential backoff and queuing
- **Use Case Extraction Fails**: PDF content may be too complex or corrupted
- **Demo Generation Errors**: v0 prompt may need refinement for specific use cases

### Fallback Strategies
- Use mock providers when APIs are unavailable
- Pre-generated use case templates for common scenarios
- Static demo templates as fallbacks
- Graceful error handling with user-friendly messages

## Key Principles for AI Agents

1. **Hybrid AI Strategy**: Use the right AI tool for each task (Azure OpenAI for analysis, v0 for generation)
2. **Docs-First Approach**: Always start by reading the actual docs folder content
3. **First Use Case Focus**: Extract and build demos for the first viable use case found
4. **Professional Quality**: Generate enterprise-grade demos that could be shown to clients
5. **Synthetic Data Integration**: Include realistic, compelling data that demonstrates business value
6. **Responsive Design**: Ensure demos work across all device types
7. **Error Resilience**: Provide graceful fallbacks when services are unavailable

This workflow transforms static solution play PDFs into interactive, professional demos automatically using the power of Azure OpenAI for content understanding and v0.dev for React component generation.