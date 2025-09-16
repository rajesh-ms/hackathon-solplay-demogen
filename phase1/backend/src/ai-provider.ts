import { OpenAI } from 'openai';
import { v0Client, DemoResult, V0ComponentResponse } from './v0-client.js';

export type AIProviderType = 'openai' | 'v0' | 'mock';

export { DemoResult, V0ComponentResponse };

export interface AIProvider {
  generateDemo(useCase: string, context: any): Promise<DemoResult>;
  generateComponent?(prompt: string): Promise<any>;
  generateText?(prompt: string): Promise<string>;
}

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateDemo(useCase: string, context: any): Promise<DemoResult> {
    const prompt = this.buildPrompt(useCase, context);
    
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating HTML demos for financial services AI use cases. Generate clean, professional HTML with embedded CSS and JavaScript.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 2000,
      });

      const generatedContent = completion.choices[0]?.message?.content || '';
      
      return {
        components: [{
          id: `openai-${Date.now()}`,
          code: this.extractHTMLFromContent(generatedContent),
          dependencies: [],
          framework: 'html',
          styling: 'css',
          status: 'success' as const,
        }],
        html: this.extractHTMLFromContent(generatedContent),
        css: this.extractCSSFromContent(generatedContent),
        javascript: this.extractJSFromContent(generatedContent),
        metadata: {
          useCase,
          generatedAt: new Date().toISOString(),
          provider: 'openai',
        },
      };
    } catch (error) {
      console.error('OpenAI Provider error:', error);
      return this.getFallbackDemo(useCase);
    }
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
      });

      return completion.choices[0]?.message?.content || 'Failed to generate content';
    } catch (error) {
      console.error('OpenAI text generation error:', error);
      return 'Error generating content with OpenAI';
    }
  }

  private buildPrompt(useCase: string, context: any): string {
    return `Create a professional HTML demo for this financial services use case: ${useCase}

Context: ${JSON.stringify(context, null, 2)}

Requirements:
- Create a complete HTML page with embedded CSS and JavaScript
- Use a professional financial services color scheme (blues, whites, grays)
- Include interactive elements that demonstrate the AI capability
- Make it responsive and accessible
- Add realistic sample data and content
- Include proper loading states and success indicators

Please provide the complete HTML file with embedded styles and scripts.`;
  }

  private extractHTMLFromContent(content: string): string {
    const htmlMatch = content.match(/```html\n([\s\S]*?)\n```/);
    if (htmlMatch) return htmlMatch[1];
    
    // If no code block, assume the entire content is HTML
    if (content.includes('<!DOCTYPE html') || content.includes('<html')) {
      return content;
    }
    
    return this.createFallbackHTML(content);
  }

  private extractCSSFromContent(content: string): string {
    const cssMatch = content.match(/```css\n([\s\S]*?)\n```/);
    return cssMatch ? cssMatch[1] : '';
  }

  private extractJSFromContent(content: string): string {
    const jsMatch = content.match(/```javascript\n([\s\S]*?)\n```/);
    return jsMatch ? jsMatch[1] : '';
  }

  private createFallbackHTML(content: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI-Generated Demo</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .demo-container { background: #f8f9fa; padding: 20px; border-radius: 8px; }
        .content { background: white; padding: 15px; border-radius: 4px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="demo-container">
        <h1>AI-Generated Demo</h1>
        <div class="content">
            <pre>${content}</pre>
        </div>
    </div>
</body>
</html>`;
  }

  private getFallbackDemo(useCase: string): DemoResult {
    return {
      components: [{
        id: `fallback-${Date.now()}`,
        code: '<div>Fallback demo content</div>',
        dependencies: [],
        framework: 'html',
        styling: 'css',
        status: 'error' as const,
        error_message: 'OpenAI generation failed',
      }],
      html: this.createFallbackHTML(`Demo for: ${useCase}`),
      css: '',
      javascript: '',
      metadata: {
        useCase,
        generatedAt: new Date().toISOString(),
        provider: 'openai-fallback',
      },
    };
  }
}

export class V0Provider implements AIProvider {
  async generateDemo(useCase: string, context: any): Promise<DemoResult> {
    return await v0Client.generateDemo(useCase, context);
  }

  async generateComponent(prompt: string) {
    return await v0Client.generateComponent({ prompt });
  }
}

export class MockProvider implements AIProvider {
  async generateDemo(useCase: string, context: any): Promise<DemoResult> {
    return {
      components: [{
        id: `mock-${Date.now()}`,
        code: this.getMockComponent(useCase),
        dependencies: ['react', 'tailwindcss'],
        framework: 'react',
        styling: 'tailwind',
        status: 'success' as const,
      }],
      html: this.getMockHTML(useCase),
      css: this.getMockCSS(),
      javascript: this.getMockJS(),
      metadata: {
        useCase,
        generatedAt: new Date().toISOString(),
        provider: 'mock',
      },
    };
  }

  async generateText(prompt: string): Promise<string> {
    return `Mock response for: ${prompt.slice(0, 50)}...`;
  }

  private getMockComponent(useCase: string): string {
    return `import React from 'react';

export default function MockDemo() {
  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-900 mb-6">
        ${useCase} - Demo
      </h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg border border-blue-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Input</h2>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded border-2 border-dashed border-gray-300 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-600">Upload document or enter requirements</p>
            </div>
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors">
              Process with AI
            </button>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-green-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">AI-Generated Output</h2>
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-800">Processing Complete</span>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">98% Confidence</span>
              </div>
              <p className="text-sm text-gray-700">
                Mock AI-generated content for ${useCase}. This would contain the actual AI-processed results
                in a real implementation.
              </p>
            </div>
            <div className="flex space-x-2">
              <button className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700 transition-colors">
                Export Results
              </button>
              <button className="flex-1 bg-gray-600 text-white py-2 px-3 rounded text-sm hover:bg-gray-700 transition-colors">
                Refine
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Demo Features Demonstrated</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• AI-powered document processing</li>
          <li>• Real-time analysis and generation</li>
          <li>• Professional financial services interface</li>
          <li>• Confidence scoring and validation</li>
          <li>• Export and refinement capabilities</li>
        </ul>
      </div>
    </div>
  );
}`;
  }

  private getMockHTML(useCase: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${useCase} - AI Demo</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; }
    </style>
</head>
<body class="bg-gray-100 min-h-screen py-8">
    <div class="max-w-4xl mx-auto px-4">
        <div class="bg-white rounded-lg shadow-lg p-6">
            <h1 class="text-3xl font-bold text-blue-900 mb-6">${useCase} - AI Demo</h1>
            <div class="grid md:grid-cols-2 gap-6">
                <div class="border border-blue-200 rounded-lg p-4">
                    <h2 class="text-xl font-semibold mb-4">Input Section</h2>
                    <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <p class="text-gray-600">Upload files or enter requirements here</p>
                        <button class="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                            Start Processing
                        </button>
                    </div>
                </div>
                <div class="border border-green-200 rounded-lg p-4">
                    <h2 class="text-xl font-semibold mb-4">AI Results</h2>
                    <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-green-800 font-medium">Processing Complete</span>
                            <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">95% Confidence</span>
                        </div>
                        <p class="text-gray-700 text-sm">Mock AI-generated results for demonstration purposes.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  private getMockCSS(): string {
    return `/* Mock CSS for demo styling */
.demo-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
.input-section, .output-section { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.confidence-score { background: #10b981; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; }`;
  }

  private getMockJS(): string {
    return `// Mock JavaScript for demo interactivity
document.addEventListener('DOMContentLoaded', function() {
  console.log('Mock demo loaded for use case');
  
  // Simulate processing delay
  const processButton = document.querySelector('button');
  if (processButton) {
    processButton.addEventListener('click', function() {
      this.textContent = 'Processing...';
      setTimeout(() => {
        this.textContent = 'Complete!';
      }, 2000);
    });
  }
});`;
  }
}

export function createAIProvider(type?: AIProviderType): AIProvider {
  const providerType = type || (process.env.AI_PROVIDER as AIProviderType) || 'mock';
  
  switch (providerType) {
    case 'openai':
      return new OpenAIProvider();
    case 'v0':
      return new V0Provider();
    case 'mock':
    default:
      return new MockProvider();
  }
}

export const aiProvider = createAIProvider();