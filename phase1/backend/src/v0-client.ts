import fetch from 'node-fetch';

export interface V0ComponentRequest {
  prompt: string;
  framework?: 'react' | 'vue' | 'svelte';
  styling?: 'tailwind' | 'css' | 'styled-components';
  complexity?: 'simple' | 'medium' | 'complex';
}

export interface V0ComponentResponse {
  id: string;
  code: string;
  preview_url?: string;
  dependencies: string[];
  framework: string;
  styling: string;
  status: 'success' | 'error' | 'pending';
  error_message?: string;
}

export interface DemoResult {
  components: V0ComponentResponse[];
  html: string;
  css: string;
  javascript: string;
  metadata: {
    useCase: string;
    generatedAt: string;
    provider: string;
  };
}

export class V0Client {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.apiKey = process.env.V0_API_KEY || '';
    this.baseUrl = process.env.V0_BASE_URL || 'https://v0.dev/api';
    this.timeout = 30000; // 30 seconds

    if (!this.apiKey) {
      console.warn('V0_API_KEY not found. V0Client will operate in mock mode.');
    }
  }

  async generateComponent(request: V0ComponentRequest): Promise<V0ComponentResponse> {
    if (!this.apiKey) {
      return this.mockComponentResponse(request);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: request.prompt,
          framework: request.framework || 'react',
          styling: request.styling || 'tailwind',
          complexity: request.complexity || 'medium',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`V0 API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as V0ComponentResponse;
      return data;
    } catch (error) {
      console.error('V0Client error:', error);
      return {
        id: `mock-${Date.now()}`,
        code: this.generateFallbackComponent(request.prompt),
        dependencies: ['react', '@types/react'],
        framework: 'react',
        styling: 'tailwind',
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async generateDemo(useCase: string, context: any): Promise<DemoResult> {
    const prompt = this.buildPromptFromUseCase(useCase, context);
    
    // Generate main component
    const mainComponent = await this.generateComponent({
      prompt: prompt.main,
      framework: 'react',
      styling: 'tailwind',
      complexity: 'medium',
    });

    // Generate supporting components if needed
    const supportingComponents = await Promise.all(
      prompt.supporting.map(p => this.generateComponent({
        prompt: p,
        framework: 'react',
        styling: 'tailwind',
        complexity: 'simple',
      }))
    );

    const allComponents = [mainComponent, ...supportingComponents];
    
    return {
      components: allComponents,
      html: this.assembleHTML(allComponents),
      css: this.assembleTailwindCSS(),
      javascript: this.assembleJavaScript(allComponents),
      metadata: {
        useCase,
        generatedAt: new Date().toISOString(),
        provider: 'v0.dev',
      },
    };
  }

  private buildPromptFromUseCase(useCase: string, context: any): { main: string; supporting: string[] } {
    const basePrompt = `Create a professional demo interface for the following financial services use case: ${useCase}`;
    
    if (useCase.toLowerCase().includes('rfp')) {
      return {
        main: `${basePrompt}
        
Create a split-screen interface showing:
- Left side: RFP document upload and requirements display
- Right side: AI-generated response with professional formatting
- Include progress indicators and confidence scores
- Use modern financial services styling with blue/white color scheme
- Add interactive elements like tabs, buttons, and form inputs`,
        supporting: [
          'Create a file upload component with drag-and-drop for PDF files',
          'Create a progress indicator component with steps for RFP processing',
          'Create a confidence score display component with visual indicators',
        ],
      };
    }

    if (useCase.toLowerCase().includes('content generation')) {
      return {
        main: `${basePrompt}
        
Create an interface for content generation featuring:
- Input area for content requirements
- Generated content display with editing capabilities
- Content type selector (marketing, technical, proposals)
- Export options and sharing features`,
        supporting: [
          'Create a content type selector with icons',
          'Create an export options dropdown component',
        ],
      };
    }

    // Default/generic use case
    return {
      main: `${basePrompt}
      
Create a clean, professional interface that demonstrates the AI capability with:
- Input section for user requirements
- Processing visualization
- Results display with formatting
- Action buttons for next steps`,
      supporting: [
        'Create a loading spinner component for AI processing',
        'Create an action buttons component',
      ],
    };
  }

  private mockComponentResponse(request: V0ComponentRequest): V0ComponentResponse {
    return {
      id: `mock-${Date.now()}`,
      code: this.generateFallbackComponent(request.prompt),
      dependencies: ['react', '@types/react', 'tailwindcss'],
      framework: 'react',
      styling: 'tailwind',
      status: 'success',
    };
  }

  private generateFallbackComponent(prompt: string): string {
    return `import React from 'react';

export default function GeneratedComponent() {
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        AI-Generated Demo
      </h2>
      <div className="bg-blue-50 p-4 rounded-md mb-4">
        <p className="text-sm text-blue-800">
          <strong>Prompt:</strong> ${prompt.slice(0, 100)}${prompt.length > 100 ? '...' : ''}
        </p>
      </div>
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="font-semibold text-gray-700 mb-2">Demo Features</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Interactive user interface</li>
            <li>Real-time AI processing</li>
            <li>Professional styling</li>
            <li>Responsive design</li>
          </ul>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
          Try Demo
        </button>
      </div>
    </div>
  );
}`;
  }

  private assembleHTML(components: V0ComponentResponse[]): string {
    const mainComponent = components[0];
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI-Generated Demo</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        ${mainComponent.code}
        
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<GeneratedComponent />);
    </script>
</body>
</html>`;
  }

  private assembleTailwindCSS(): string {
    return `/* Tailwind CSS will be loaded via CDN in production demo */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom styles for financial services theme */
.finance-primary { @apply bg-blue-600 text-white; }
.finance-secondary { @apply bg-gray-100 text-gray-800; }
.finance-accent { @apply bg-green-600 text-white; }`;
  }

  private assembleJavaScript(components: V0ComponentResponse[]): string {
    return `// Generated JavaScript for demo functionality
window.DemoConfig = {
  components: ${JSON.stringify(components.map(c => ({ id: c.id, framework: c.framework })))},
  generatedAt: '${new Date().toISOString()}',
  provider: 'v0.dev'
};

// Add any additional demo-specific JavaScript here
console.log('Demo loaded with', window.DemoConfig.components.length, 'components');`;
  }
}

export const v0Client = new V0Client();