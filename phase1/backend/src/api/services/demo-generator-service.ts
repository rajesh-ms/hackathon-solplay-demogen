import { V0EnhancedClient } from './v0-enhanced-client';
import { SyntheticDataGenerator } from './synthetic-data-generator';
import { DemoHostingService } from './demo-hosting-service';
import { LoggingService } from '../services/logging-service';

export interface DemoGenerationRequest {
  useCaseTitle: string;
  keyCapabilities: string[];
  category?: 'Content Generation' | 'Process Automation' | 'Personalized Experience';
  requirements?: {
    targetAudience?: string;
    complexity?: 'simple' | 'intermediate' | 'advanced';
    features?: string[];
  };
}

export interface DemoGenerationResult {
  success: boolean;
  demoId?: string;
  demoUrl?: string;
  componentCode?: string;
  syntheticData?: any;
  metadata?: any;
  error?: string;
}

export interface DemoStatus {
  demoId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

export interface CachedDemo {
  demoId: string;
  demoUrl: string;
  componentCode: string;
  syntheticData: any;
  createdAt: string;
  metadata: any;
}

export class DemoGeneratorService {
  private v0Client: V0EnhancedClient;
  private syntheticDataGenerator: SyntheticDataGenerator;
  private hostingService: DemoHostingService;
  private logger: LoggingService;
  private demoCache: Map<string, CachedDemo> = new Map();
  private statusCache: Map<string, DemoStatus> = new Map();

  constructor(
    v0Client?: V0EnhancedClient,
    syntheticDataGenerator?: SyntheticDataGenerator,
    hostingService?: DemoHostingService,
    logger?: LoggingService
  ) {
    this.v0Client = v0Client || new V0EnhancedClient();
    this.syntheticDataGenerator = syntheticDataGenerator || new SyntheticDataGenerator();
    this.hostingService = hostingService || new DemoHostingService();
    this.logger = logger || new LoggingService();
  }

  async generateDemo(request: DemoGenerationRequest): Promise<DemoGenerationResult> {
    const demoId = `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      this.logger.info('Starting demo generation', {
        demoId,
        useCaseTitle: request.useCaseTitle,
        capabilities: request.keyCapabilities
      });

      // Update status to processing
      this.statusCache.set(demoId, {
        demoId,
        status: 'processing',
        progress: 10
      });

      // Generate synthetic data based on capabilities
      this.updateProgress(demoId, 25);
      const syntheticData = await this.syntheticDataGenerator.generateForCapabilities(
        request.keyCapabilities,
        request.category || 'Content Generation',
        'professional'
      );

      // Create enhanced prompt for v0.dev
      this.updateProgress(demoId, 50);
      const enhancedPrompt = this.createEnhancedPrompt(request, syntheticData);
      
      // Generate component with v0.dev
      this.updateProgress(demoId, 75);
      const componentResult = await this.v0Client.generateComponent({
        prompt: enhancedPrompt,
        framework: 'react',
        styling: 'tailwindcss'
      });

      if (!componentResult.success) {
        throw new Error(componentResult.error || 'Component generation failed');
      }

      // Host the demo
      this.updateProgress(demoId, 90);
      const demoUrl = await this.hostingService.deployDemo({
        demoId,
        componentCode: componentResult.code!,
        syntheticData,
        metadata: {
          useCaseTitle: request.useCaseTitle,
          capabilities: request.keyCapabilities,
          category: request.category,
          style: 'professional'
        }
      });

      // Cache the result
      const cachedDemo: CachedDemo = {
        demoId,
        demoUrl,
        componentCode: componentResult.code!,
        syntheticData,
        createdAt: new Date().toISOString(),
        metadata: {
          useCaseTitle: request.useCaseTitle,
          capabilities: request.keyCapabilities,
          category: request.category,
          style: 'professional',
          model: componentResult.metadata?.model
        }
      };

      this.demoCache.set(demoId, cachedDemo);

      // Update status to completed
      this.statusCache.set(demoId, {
        demoId,
        status: 'completed',
        progress: 100
      });

      this.logger.info('Demo generation completed', {
        demoId,
        demoUrl,
        success: true
      });

      return {
        success: true,
        demoId,
        demoUrl,
        componentCode: componentResult.code!,
        syntheticData,
        metadata: {
          model: componentResult.metadata?.model,
          generatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.statusCache.set(demoId, {
        demoId,
        status: 'failed',
        progress: 0,
        error: errorMessage
      });

      this.logger.error('Demo generation failed', {
        demoId,
        error: errorMessage
      });

      // Check if it's a v0.dev service issue
      if (errorMessage.includes('V0 service') || errorMessage.includes('rate limit')) {
        return {
          success: false,
          error: 'Demo generation service temporarily unavailable'
        };
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async getDemoStatus(demoId: string): Promise<DemoStatus | null> {
    return this.statusCache.get(demoId) || null;
  }

  async getCachedDemo(demoId: string): Promise<CachedDemo | null> {
    return this.demoCache.get(demoId) || null;
  }

  private updateProgress(demoId: string, progress: number) {
    const currentStatus = this.statusCache.get(demoId);
    if (currentStatus) {
      this.statusCache.set(demoId, {
        ...currentStatus,
        progress
      });
    }
  }

  private createEnhancedPrompt(request: DemoGenerationRequest, syntheticData: any): string {
    const categoryPrompts = {
      'Content Generation': this.getContentGenerationPrompt,
      'Process Automation': this.getProcessAutomationPrompt,
      'Personalized Experience': this.getPersonalizationPrompt
    };

    const promptGenerator = categoryPrompts[request.category as keyof typeof categoryPrompts] || this.getGenericPrompt;
    return promptGenerator.call(this, request, syntheticData);
  }

  private getContentGenerationPrompt(request: DemoGenerationRequest, syntheticData: any): string {
    return `
Create a professional React application for "${request.useCaseTitle}" - a Content Generation demo.

## Key Capabilities to Showcase:
${request.keyCapabilities.map(cap => `• ${cap}`).join('\n')}

## Requirements:
Build a multi-step interface with:
1. **Input Section**: Document upload, text input forms, parameter controls
2. **Processing View**: Loading states, progress indicators, AI processing simulation  
3. **Results Dashboard**: Generated content display, confidence scores, editing tools
4. **Export Options**: Download buttons, sharing features, refinement controls

## Design Requirements:
- Use Tailwind CSS with professional financial services color scheme
- Responsive design (desktop and tablet)
- WCAG 2.1 AA accessibility compliance
- Professional typography and smooth transitions

## Synthetic Data Integration:
Use this realistic data in your component:
\`\`\`json
${JSON.stringify(syntheticData, null, 2)}
\`\`\`

## Component Requirements:
- Interactive forms for each capability
- Real-time progress simulation (2-5 seconds)
- Professional results display with confidence scores (85-98%)
- Export functionality with multiple formats
- Error handling and loading states

Make it look like a production-ready enterprise AI application with polished UX.
`;
  }

  private getProcessAutomationPrompt(request: DemoGenerationRequest, syntheticData: any): string {
    return `
Create a React dashboard for "${request.useCaseTitle}" - a Process Automation demo.

## Automation Capabilities to Showcase:
${request.keyCapabilities.map(cap => `• ${cap}`).join('\n')}

## Requirements:
Build a workflow automation dashboard with:
1. **Process Overview**: Workflow visualization, status indicators, performance metrics
2. **Task Management**: Active tasks list, priority queues, assignment controls
3. **Analytics Dashboard**: Success rates, processing times, cost savings charts
4. **Monitoring Panel**: Real-time alerts, compliance tracking, audit logs

## Design Requirements:
- Enterprise dashboard aesthetic with data visualization
- Use Chart.js or Recharts for analytics displays
- Status indicators with color coding (green/yellow/red)
- Professional card-based layout with clear hierarchy

## Synthetic Data Integration:
Use this realistic automation data:
\`\`\`json
${JSON.stringify(syntheticData, null, 2)}
\`\`\`

## Success Metrics to Display:
- Processing volumes (1000+ items/day)
- Accuracy rates (94-99%)
- Time savings (60-80% reduction)
- Cost optimization (30-50% savings)

Create a compelling demonstration of clear business value with automation metrics.
`;
  }

  private getPersonalizationPrompt(request: DemoGenerationRequest, syntheticData: any): string {
    return `
Create a React application for "${request.useCaseTitle}" - a Personalized Experience demo.

## Personalization Capabilities to Showcase:
${request.keyCapabilities.map(cap => `• ${cap}`).join('\n')}

## Requirements:
Build a personalized customer experience with:
1. **Customer Profile**: Demographics, preferences, goals, behavior analysis
2. **AI Recommendations**: Personalized products, services, content recommendations
3. **Insights Dashboard**: Behavior analysis, preference tracking, engagement metrics
4. **Action Center**: Recommended actions, next steps, personalization controls

## Design Requirements:
- Customer-centric design with warm, approachable colors
- Personalized cards and recommendations with reasoning
- Progress bars for goals and achievements
- Interactive elements for exploring options

## Synthetic Data Integration:
Use this realistic personalization data:
\`\`\`json
${JSON.stringify(syntheticData, null, 2)}
\`\`\`

## Personalization Features:
- Dynamic customer profiles with realistic scenarios
- AI-driven recommendations with confidence scores
- Goal tracking and progress visualization
- A/B testing results and optimization insights

Create an engaging, personalized experience that demonstrates AI-driven insights and business value.
`;
  }

  private getGenericPrompt(request: DemoGenerationRequest, syntheticData: any): string {
    return `
Create a professional React application for "${request.useCaseTitle}".

## Key Capabilities to Showcase:
${request.keyCapabilities.map(cap => `• ${cap}`).join('\n')}

## Requirements:
Build a comprehensive application that demonstrates all capabilities with:
- Professional UI using Tailwind CSS
- Interactive components for each capability
- Realistic data visualization
- Responsive design for desktop and tablet

## Synthetic Data Integration:
\`\`\`json
${JSON.stringify(syntheticData, null, 2)}
\`\`\`

Create a polished, production-ready application that clearly demonstrates the business value of each capability.
`;
  }

  async getDemo(demoId: string): Promise<CachedDemo | null> {
    return this.demoCache.get(demoId) || null;
  }
}