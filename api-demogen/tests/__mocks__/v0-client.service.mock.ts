// Manual mock for V0ClientService used in tests
export class V0ClientService {
  private requestCount = 0;
  constructor() {}
  async testConnection(): Promise<boolean> { return true; }
  generatePromptFromUseCase(useCase: any): string { return `Prompt for ${useCase.title}`; }
  async generateComponent(): Promise<any> {
    this.requestCount++;
    return {
      componentId: 'mock-component',
      code: '<div>Mock Component</div>',
      preview: '',
      metadata: {
        framework: 'react',
        styling: 'tailwindcss',
        generatedAt: new Date().toISOString(),
        complexity: 'simple'
      }
    };
  }
  getStats() { return { requestCount: this.requestCount, baseUrl: 'mock', isConfigured: true }; }
}
