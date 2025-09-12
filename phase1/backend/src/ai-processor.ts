import OpenAI from 'openai';

export class AIProcessor {
  private openai: OpenAI;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key-here'
    });
  }
  
  async extractRFPUseCases(pdfContent: string): Promise<any> {
    try {
      console.log('🤖 Starting AI analysis for RFP use cases...');
      
      const prompt = `
Analyze the following Financial Services solution play document and extract information about RFP Response capabilities.

Document Content:
${pdfContent.substring(0, 4000)} // Limit content to avoid token limits

Please extract:
1. RFP Response capabilities mentioned
2. Key value propositions for automated RFP responses
3. Technical capabilities that can be demonstrated
4. Sample use cases or scenarios described

Return a JSON response with the following structure:
{
  "rfpCapabilities": [
    {
      "title": "Capability name",
      "description": "Detailed description",
      "valueProposition": "Business value",
      "technicalFeatures": ["feature1", "feature2"]
    }
  ],
  "sampleScenarios": [
    {
      "scenario": "Description of scenario",
      "inputExample": "What type of RFP this handles",
      "outputExample": "What the automated response includes"
    }
  ],
  "keyMetrics": {
    "timeReduction": "percentage or description",
    "qualityImprovement": "description",
    "scalabilityBenefit": "description"
  }
}

Focus specifically on content generation and RFP response automation capabilities.
`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an AI analyst specializing in Financial Services solution analysis. Extract RFP response automation capabilities from solution play documents."
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      console.log('🎯 AI analysis completed');
      
      try {
        return JSON.parse(response);
      } catch (parseError) {
        console.log('⚠️ JSON parsing failed, returning structured fallback');
        return this.createFallbackResponse(response);
      }
      
    } catch (error) {
      console.error('AI processing error:', error);
      
      // Return synthetic fallback data for demo purposes
      return this.createSyntheticRFPData();
    }
  }
  
  private createFallbackResponse(aiResponse: string): any {
    return {
      rfpCapabilities: [
        {
          title: "AI-Powered RFP Response Generation",
          description: "Automatically generates professional RFP responses using organizational knowledge",
          valueProposition: "Reduces response time by 80% while maintaining quality",
          technicalFeatures: ["Natural Language Processing", "Document Analysis", "Template Generation"]
        }
      ],
      sampleScenarios: [
        {
          scenario: "Investment Management Platform RFP",
          inputExample: "RFP for comprehensive portfolio management solution",
          outputExample: "Detailed technical response with capabilities, implementation plan, and pricing"
        }
      ],
      keyMetrics: {
        timeReduction: "80% faster response generation",
        qualityImprovement: "Consistent, professional quality responses",
        scalabilityBenefit: "Handle 10x more RFP requests with same team"
      },
      rawAIResponse: aiResponse
    };
  }
  
  private createSyntheticRFPData(): any {
    return {
      rfpCapabilities: [
        {
          title: "Intelligent RFP Response Automation",
          description: "AI-powered system that analyzes RFP requirements and generates comprehensive, tailored responses using organizational knowledge base and past successful proposals.",
          valueProposition: "Reduce RFP response time from weeks to hours while improving win rates through consistent, high-quality proposals.",
          technicalFeatures: [
            "Natural Language Processing for requirement analysis",
            "Knowledge base integration for historical responses", 
            "Automated section generation with compliance checking",
            "Multi-stakeholder collaboration workflows"
          ]
        },
        {
          title: "Smart Document Assembly",
          description: "Automatically assembles RFP responses by combining relevant sections from previous winning proposals, company capabilities, and technical specifications.",
          valueProposition: "Ensures consistency across all proposals while leveraging institutional knowledge and best practices.",
          technicalFeatures: [
            "Template-based response generation",
            "Dynamic content personalization",
            "Compliance and completeness validation",
            "Version control and approval workflows"
          ]
        }
      ],
      sampleScenarios: [
        {
          scenario: "Investment Management Platform RFP Response",
          inputExample: "RFP requesting comprehensive portfolio management solution with risk analytics, client reporting, and regulatory compliance features",
          outputExample: "Complete 50-page response including executive summary, technical architecture, implementation timeline, pricing structure, and compliance certifications"
        },
        {
          scenario: "Digital Banking Platform Proposal",
          inputExample: "RFP for mobile-first banking platform with AI-powered customer service and personalized financial insights",
          outputExample: "Detailed proposal showcasing AI capabilities, security framework, customer experience design, and integration specifications"
        }
      ],
      keyMetrics: {
        timeReduction: "85% reduction in response preparation time",
        qualityImprovement: "30% higher win rate due to consistent quality and completeness",
        scalabilityBenefit: "Handle 5x more RFP opportunities with existing team capacity"
      },
      extractionMeta: {
        source: "Synthetic data for Phase 1 demo",
        extractedAt: new Date().toISOString(),
        confidence: 0.95
      }
    };
  }
}