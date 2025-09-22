// Manual mock for AzureOpenAIService used in tests
export class AzureOpenAIService {
  constructor() {}
  async initialize(): Promise<void> { return; }
  async enhanceUseCase(input: any) {
    return {
      title: input.useCaseTitle,
      description: `${input.useCaseTitle} enhanced description`,
      category: input.category || 'Content Generation',
      capabilities: input.keyCapabilities,
      confidence: 0.92,
      userJourney: { steps: input.keyCapabilities.map((c: string, i: number) => ({ title: `Step ${i+1}: ${c}` })) },
      sampleData: { inputs: ['sample in'], outputs: ['sample out'] },
      businessNarrative: { executiveSummary: 'Executive summary', roiRationale: 'ROI rationale' }
    };
  }
  getStats() { return { totalCost: 0.05, enhancementCount: 1 }; }
}
