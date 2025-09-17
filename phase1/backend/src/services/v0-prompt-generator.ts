import { LoggingService } from './logging-service';
import { UseCaseData } from './usecase-extractor';

export interface V0PromptData {
  prompt: string;
  category: string;
  metadata: {
    useCase: string;
    components: string[];
    interactions: string[];
    generatedAt: Date;
  };
}

export class V0PromptGenerator {
  private logger: LoggingService;

  constructor() {
    this.logger = LoggingService.getInstance();
  }

  /**
   * Generates a v0.dev optimized prompt based on the use case
   */
  generatePrompt(useCase: UseCaseData): V0PromptData {
    try {
      this.logger.info('Generating v0.dev prompt', {
        title: useCase.title,
        category: useCase.category,
        componentsCount: useCase.demoFeatures.components.length
      }, 'V0PromptGenerator', 'generatePrompt');

      const prompt = this.getCategoryPrompt(useCase);
      
      const promptData: V0PromptData = {
        prompt,
        category: useCase.category,
        metadata: {
          useCase: useCase.title,
          components: useCase.demoFeatures.components,
          interactions: useCase.demoFeatures.interactions,
          generatedAt: new Date()
        }
      };

      // Log the generated prompt
      this.logger.logV0Interaction({
        timestamp: new Date().toISOString(),
        operation: 'prompt_generation',
        prompt: prompt
      });

      this.logger.info('V0 prompt generation completed', {
        title: useCase.title,
        promptLength: prompt.length,
        category: useCase.category
      }, 'V0PromptGenerator', 'generatePrompt');

      return promptData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('V0 prompt generation failed', {
        title: useCase.title,
        error: errorMessage
      }, 'V0PromptGenerator', 'generatePrompt');

      throw new Error(`Failed to generate v0 prompt: ${errorMessage}`);
    }
  }

  /**
   * Routes to category-specific prompt generation
   */
  private getCategoryPrompt(useCase: UseCaseData): string {
    const categoryPrompts = {
      'Content Generation': () => this.getContentGenerationPrompt(useCase),
      'Process Automation': () => this.getProcessAutomationPrompt(useCase), 
      'Personalized Experience': () => this.getPersonalizationPrompt(useCase)
    };

    const promptGenerator = categoryPrompts[useCase.category];
    return promptGenerator ? promptGenerator() : this.getDefaultPrompt(useCase);
  }

  /**
   * Content Generation category prompt
   */
  private getContentGenerationPrompt(useCase: UseCaseData): string {
    return `
Create a professional React application for "${useCase.title}" - a Financial Services content generation demo.

## Business Context
${useCase.description}

## Key AI Capabilities
${useCase.capabilities.map(cap => `• ${cap}`).join('\n')}

## User Journey Flow
${useCase.userJourney.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

## Application Requirements

### Multi-Step Interface Design:
1. **Input Section**: 
   - Document upload area with drag-and-drop functionality
   - Text input forms for parameters and customization
   - File type validation and progress indicators
   - Parameter controls for AI processing options

2. **Processing View**: 
   - Real-time loading states with progress bars
   - Step-by-step progress indicators showing AI analysis phases
   - Estimated time remaining and processing status
   - Cancel/pause processing options

3. **Results Dashboard**: 
   - Generated content display with syntax highlighting
   - Confidence scores and quality metrics (85-98%)
   - Side-by-side comparison with original content
   - Interactive editing tools and refinement options

4. **Export & Actions**: 
   - Multiple download formats (PDF, Word, JSON)
   - Sharing features with collaboration tools
   - Save to workspace functionality
   - Refinement and regeneration controls

### Design Requirements:
- Use Tailwind CSS with professional financial services color palette:
  - Primary: Navy blue (#1e3a8a), Deep blue (#1e40af)
  - Secondary: Light gray (#f8fafc), Medium gray (#64748b)
  - Accent: Green (#059669) for success, Orange (#ea580c) for warnings
- Responsive design optimized for desktop (1440px+) and tablet (768px+)
- WCAG 2.1 AA accessibility compliance with proper ARIA labels
- Professional typography using Inter or similar sans-serif fonts
- Smooth transitions and micro-interactions for enhanced UX
- Loading skeletons and optimistic UI updates

### Sample Data Integration:
**Input Examples:**
${useCase.sampleData.inputs.map(input => `• ${input}`).join('\n')}

**Output Examples:**
${useCase.sampleData.outputs.map(output => `• ${output}`).join('\n')}

### Realistic AI Simulation:
- Mock processing times: 2-5 seconds with realistic progress
- Confidence scores: 85-98% with detailed breakdowns
- Progress indicators showing: "Analyzing content...", "Generating output...", "Finalizing results..."
- Professional financial services content examples with industry terminology

### Required Components:
${useCase.demoFeatures.components.map(comp => `• ${comp}`).join('\n')}

### User Interactions:
${useCase.demoFeatures.interactions.map(interaction => `• ${interaction}`).join('\n')}

### Success Metrics Display:
${useCase.successMetrics.map(metric => `• ${metric}`).join('\n')}

Create a production-ready enterprise AI application with polished UX that demonstrates clear business value and ROI for financial services organizations.

The application should feel like a real SaaS product that financial professionals would use daily, with enterprise-grade performance, security considerations, and professional branding.
`;
  }

  /**
   * Process Automation category prompt
   */
  private getProcessAutomationPrompt(useCase: UseCaseData): string {
    return `
Create a comprehensive React dashboard for "${useCase.title}" - a Financial Services process automation demo.

## Business Context
${useCase.description}

## Automation Capabilities
${useCase.capabilities.map(cap => `• ${cap}`).join('\n')}

## Workflow Automation Steps
${useCase.userJourney.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

## Dashboard Architecture

### 1. Process Overview Panel:
- Visual workflow diagram with interactive nodes
- Real-time status indicators (Running, Completed, Failed, Pending)
- Overall performance metrics and SLA tracking
- Workflow health monitoring with alerts

### 2. Task Management Center:
- Active tasks queue with priority levels (High, Medium, Low)
- Task assignment and routing controls
- Automated task distribution algorithms
- Manual override and escalation options

### 3. Analytics & Performance Dashboard:
- Success rates with trend analysis (94-99% accuracy)
- Processing time metrics with historical comparisons
- Cost savings calculations with ROI projections
- Throughput and capacity utilization charts

### 4. Monitoring & Compliance Panel:
- Real-time alerts and notification system
- Compliance tracking with regulatory requirements
- Audit logs with searchable transaction history
- Risk assessment and exception handling

### Design Specifications:
- Enterprise dashboard aesthetic with data-driven design
- Use Chart.js or Recharts for interactive data visualizations
- Status indicators with intuitive color coding:
  - Green (#10b981): Success, Completed, On Track
  - Yellow (#f59e0b): Warning, In Progress, Needs Attention
  - Red (#ef4444): Error, Failed, Critical Issues
  - Blue (#3b82f6): Information, Scheduled, Pending
- Professional card-based layout with clear information hierarchy
- Responsive grid system for multiple screen sizes

### Sample Automation Metrics:
**Process Performance:**
${useCase.successMetrics.map(metric => `• ${metric}`).join('\n')}

**Workflow Examples:**
${useCase.sampleData.inputs.map(input => `• ${input}`).join('\n')}

**Automation Results:**
${useCase.sampleData.outputs.map(output => `• ${output}`).join('\n')}

### Realistic Automation Data:
- Daily processing volumes: 1,000-5,000 items
- Accuracy rates: 94-99% with error categorization
- Time savings: 60-80% reduction in manual effort
- Cost optimization: 30-50% operational savings
- SLA compliance: 95-98% on-time completion

### Required Components:
${useCase.demoFeatures.components.map(comp => `• ${comp}`).join('\n')}

### Interactive Features:
- Drill-down capabilities for detailed analysis
- Real-time updates with WebSocket simulation
- Export functionality for reports and analytics
- Filtering and search across all data points

Demonstrate clear business value with compelling automation metrics and ROI calculations that would convince C-level executives to invest in the solution.
`;
  }

  /**
   * Personalized Experience category prompt
   */
  private getPersonalizationPrompt(useCase: UseCaseData): string {
    return `
Create an engaging React application for "${useCase.title}" - a Financial Services personalization demo.

## Personalization Focus
${useCase.description}

## AI Capabilities for Personalization
${useCase.capabilities.map(cap => `• ${cap}`).join('\n')}

## Customer Journey Mapping
${useCase.userJourney.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

## Personalized Experience Architecture

### 1. Customer Profile Intelligence:
- Comprehensive demographic and psychographic data
- Financial goals and investment preferences
- Risk tolerance assessment with visual indicators
- Behavioral patterns and transaction history
- Life stage analysis (Career Growth, Family Planning, Retirement)

### 2. AI-Powered Recommendations Engine:
- Personalized product recommendations with reasoning
- Investment portfolio optimization suggestions
- Financial planning advice tailored to goals
- Risk-adjusted strategy recommendations
- Cross-selling opportunities with relevance scoring

### 3. Interactive Insights Dashboard:
- Spending analysis with category breakdowns
- Savings opportunities with actionable recommendations
- Goal tracking with progress visualization
- Predictive analytics for financial outcomes
- Comparative benchmarking with peer groups

### 4. Personalized Action Center:
- Priority-ranked recommended actions
- Next best steps for financial optimization
- Goal management with milestone tracking
- Educational content personalized to knowledge level
- Appointment scheduling with advisors

### Design Philosophy:
- Customer-centric design with warm, approachable color palette:
  - Primary: Warm blue (#2563eb), Trustworthy navy (#1e40af)
  - Secondary: Soft green (#059669), Neutral gray (#6b7280)
  - Accent: Gold (#d97706) for premium features
- Personalized card-based interface with individual customization
- Progress bars and achievement indicators for goal tracking
- Interactive elements that respond to user preferences
- Micro-animations that celebrate achievements and milestones

### Sample Personalization Scenarios:
**Customer Profiles:**
${useCase.sampleData.inputs.map(input => `• ${input}`).join('\n')}

**Personalized Recommendations:**
${useCase.sampleData.outputs.map(output => `• ${output}`).join('\n')}

### Realistic Customer Data:
- Customer personas: Young Professional (25-35), Growing Family (35-45), Pre-Retirement (50-65)
- Income ranges: $50K-$75K, $75K-$150K, $150K+
- Financial goals: Emergency Fund, Home Purchase, Retirement Planning, Education Savings
- Risk profiles: Conservative, Moderate, Aggressive with detailed explanations
- Personalized recommendations with confidence levels and expected outcomes

### Success Metrics to Showcase:
${useCase.successMetrics.map(metric => `• ${metric}`).join('\n')}

### Required Components:
${useCase.demoFeatures.components.map(comp => `• ${comp}`).join('\n')}

### Personalization Features:
- Dynamic content that adapts to user preferences
- Contextual help and guidance based on user behavior
- Personalized dashboard layouts and widget preferences
- Intelligent notifications and alerts
- Adaptive UI that learns from user interactions

Create an engaging, personalized financial experience that demonstrates how AI can make complex financial services feel simple, relevant, and valuable to each individual customer.

The application should showcase the power of personalization in building customer loyalty and driving engagement in financial services.
`;
  }

  /**
   * Default prompt for unrecognized categories
   */
  private getDefaultPrompt(useCase: UseCaseData): string {
    return `
Create a professional React application for "${useCase.title}" - a comprehensive Financial Services demo.

## Business Context
${useCase.description}

## Key Capabilities
${useCase.capabilities.map(cap => `• ${cap}`).join('\n')}

## User Journey
${useCase.userJourney.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

## Application Requirements

Build a comprehensive financial services application with:

### Core Interface Components:
1. **Main Dashboard**: Overview of key metrics and status indicators
2. **Data Input Section**: Forms and upload areas for user data
3. **Processing Interface**: Progress indicators and real-time updates  
4. **Results Display**: Charts, tables, and detailed analytics
5. **Action Panel**: Export, sharing, and next steps

### Design Requirements:
- Professional financial services design with Tailwind CSS
- Navy blue and gray color scheme for trust and reliability
- Responsive design for desktop and tablet devices
- Accessibility compliance (WCAG 2.1 AA)
- Smooth animations and professional typography

### Sample Data:
**Inputs:** ${useCase.sampleData.inputs.join(', ')}
**Outputs:** ${useCase.sampleData.outputs.join(', ')}

### Success Metrics:
${useCase.successMetrics.map(metric => `• ${metric}`).join('\n')}

### Components Needed:
${useCase.demoFeatures.components.map(comp => `• ${comp}`).join('\n')}

Create a production-ready application that demonstrates clear business value for financial services organizations.
`;
  }
}