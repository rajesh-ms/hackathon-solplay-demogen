export class SyntheticDataGenerator {
  async generateForCapabilities(
    capabilities: string[], 
    category: string, 
    templateStyle: string
  ): Promise<any> {
    
    const baseData = {
      generatedAt: new Date().toISOString(),
      category,
      templateStyle,
      capabilities: capabilities
    };

    // Generate capability-specific data
    const capabilityData: any = {};
    
    for (const capability of capabilities) {
      capabilityData[this.normalizeCapabilityName(capability)] = 
        this.generateCapabilityData(capability, category, templateStyle);
    }

    // Add category-specific base data
    const categoryData = this.generateCategoryData(category, templateStyle);
    
    // Add template-specific styling and data
    const templateData = this.generateTemplateData(templateStyle);

    return {
      ...baseData,
      ...categoryData,
      ...templateData,
      capabilities: capabilityData,
      metadata: {
        dataPoints: Object.keys(capabilityData).length,
        complexity: 'high',
        realism: 95
      }
    };
  }

  private normalizeCapabilityName(capability: string): string {
    return capability
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private generateCapabilityData(capability: string, category: string, templateStyle: string): any {
    const capLower = capability.toLowerCase();
    
    // Natural Language Processing
    if (capLower.includes('natural language') || capLower.includes('nlp')) {
      return {
        processedTexts: [
          {
            id: 'text_001',
            input: 'Customer inquiry about product features',
            output: 'Positive sentiment, product interest detected',
            confidence: 0.94,
            entities: ['product', 'features', 'inquiry'],
            sentiment: 'positive'
          },
          {
            id: 'text_002', 
            input: 'Complaint about delivery delay',
            output: 'Negative sentiment, delivery issue identified',
            confidence: 0.89,
            entities: ['complaint', 'delivery', 'delay'],
            sentiment: 'negative'
          }
        ],
        metrics: {
          accuracy: 94.2,
          avgProcessingTime: 0.3,
          languagesSupported: 15
        }
      };
    }

    // Sentiment Analysis
    if (capLower.includes('sentiment')) {
      return {
        sentimentResults: [
          { text: 'Love this new feature!', sentiment: 'positive', score: 0.92 },
          { text: 'Could be better designed', sentiment: 'neutral', score: 0.15 },
          { text: 'Terrible customer service', sentiment: 'negative', score: -0.87 }
        ],
        trends: [
          { date: '2025-09-01', positive: 76, neutral: 18, negative: 6 },
          { date: '2025-09-15', positive: 82, neutral: 14, negative: 4 }
        ],
        overallScore: 0.74
      };
    }

    // Automated Response Generation
    if (capLower.includes('response') || capLower.includes('generation')) {
      return {
        generatedResponses: [
          {
            trigger: 'Product inquiry',
            response: 'Thank you for your interest! Our product features include...',
            confidence: 0.91,
            personalizations: ['customer_name', 'product_category']
          },
          {
            trigger: 'Complaint',
            response: 'We sincerely apologize for the inconvenience. Let me help resolve this...',
            confidence: 0.88,
            personalizations: ['issue_type', 'customer_tier']
          }
        ],
        metrics: {
          responseTime: 1.2,
          satisfactionRate: 87,
          resolutionRate: 94
        }
      };
    }

    // Performance Analytics  
    if (capLower.includes('analytics') || capLower.includes('performance')) {
      return {
        kpis: [
          { name: 'Processing Speed', value: '2.3s', trend: '+15%' },
          { name: 'Accuracy Rate', value: '96.2%', trend: '+2.1%' },
          { name: 'User Satisfaction', value: '4.8/5', trend: '+0.3' }
        ],
        timeSeriesData: [
          { date: '2025-09-01', processed: 1240, accuracy: 94.1 },
          { date: '2025-09-02', processed: 1356, accuracy: 95.2 },
          { date: '2025-09-03', processed: 1489, accuracy: 96.2 }
        ],
        insights: [
          'Peak performance during 2-4 PM',
          'Accuracy improved 15% this month',
          'Cost per transaction reduced by 23%'
        ]
      };
    }

    // Process Automation
    if (capLower.includes('automation') || capLower.includes('workflow')) {
      return {
        workflows: [
          {
            name: 'Document Processing',
            status: 'active',
            efficiency: 94,
            avgTime: '3.2 minutes',
            volume: 2847
          },
          {
            name: 'Quality Assessment',
            status: 'optimizing', 
            efficiency: 89,
            avgTime: '1.8 minutes',
            volume: 1263
          }
        ],
        automation_metrics: {
          totalProcessed: 15847,
          errorRate: 0.8,
          costSavings: 340000,
          timeReduction: 67
        }
      };
    }

    // Personalization
    if (capLower.includes('personalization') || capLower.includes('recommendation')) {
      return {
        recommendations: [
          {
            userId: 'user_123',
            items: ['Premium Plan Upgrade', 'Advanced Analytics Add-on'],
            confidence: 0.89,
            reasoning: 'Based on usage patterns and feature engagement'
          }
        ],
        segments: [
          { name: 'Power Users', size: 1250, engagement: 94 },
          { name: 'New Users', size: 3400, engagement: 67 },
          { name: 'Enterprise', size: 450, engagement: 91 }
        ],
        personalization_lift: {
          ctr: 24,
          conversion: 18,
          satisfaction: 31
        }
      };
    }

    // Generic capability data
    return {
      processedItems: Math.floor(Math.random() * 5000) + 1000,
      accuracy: Math.round((Math.random() * 10 + 90) * 10) / 10,
      status: 'active',
      lastUpdated: new Date().toISOString(),
      metadata: {
        confidence: Math.round((Math.random() * 20 + 80) * 10) / 10,
        processingTime: Math.round((Math.random() * 5 + 1) * 10) / 10
      }
    };
  }

  private generateCategoryData(category: string, templateStyle: string): any {
    switch (category) {
      case 'Content Generation':
        return {
          contentTypes: ['Articles', 'Social Posts', 'Email Campaigns', 'Product Descriptions'],
          generationMetrics: {
            avgLength: 847,
            readabilityScore: 92,
            engagementRate: 76,
            seoScore: 89
          },
          recentGenerated: [
            { type: 'Blog Post', title: 'AI in Modern Business', wordCount: 1245, score: 94 },
            { type: 'Email', title: 'Weekly Newsletter', wordCount: 423, score: 91 }
          ]
        };

      case 'Process Automation':
        return {
          processes: [
            { name: 'Document Review', automated: 89, manual: 11 },
            { name: 'Data Entry', automated: 95, manual: 5 },
            { name: 'Quality Control', automated: 78, manual: 22 }
          ],
          efficiency_gains: {
            timeReduction: 67,
            errorReduction: 84,
            costSavings: 240000
          }
        };

      case 'Personalized Experience':
        return {
          personalizationPoints: [
            'Content Recommendations',
            'Product Suggestions', 
            'Interface Customization',
            'Communication Preferences'
          ],
          engagementMetrics: {
            clickThroughRate: 18.7,
            conversionRate: 12.3,
            timeOnSite: 324,
            returnVisits: 67
          }
        };

      default:
        return {
          generalMetrics: {
            performance: 92,
            reliability: 99.2,
            userSatisfaction: 4.7
          }
        };
    }
  }

  private generateTemplateData(templateStyle: string): any {
    switch (templateStyle) {
      case 'financial':
        return {
          branding: {
            primaryColor: '#1a365d',
            secondaryColor: '#3182ce',
            accentColor: '#38a169'
          },
          financialMetrics: {
            portfolioValue: 2450000,
            monthlyReturn: 8.7,
            riskScore: 6.2,
            diversificationIndex: 0.84
          },
          sampleTransactions: [
            { type: 'Investment', amount: 50000, asset: 'Tech ETF', date: '2025-09-15' },
            { type: 'Dividend', amount: 2340, asset: 'REIT Portfolio', date: '2025-09-12' }
          ]
        };

      case 'healthcare':
        return {
          branding: {
            primaryColor: '#319795',
            secondaryColor: '#3182ce',
            accentColor: '#e53e3e'
          },
          healthMetrics: {
            patientSatisfaction: 94.5,
            treatmentSuccessRate: 89.2,
            avgWaitTime: 12,
            staffEfficiency: 91.7
          },
          patientData: [
            { id: 'P001', condition: 'Routine Checkup', status: 'Completed', satisfaction: 5 },
            { id: 'P002', condition: 'Follow-up', status: 'Scheduled', priority: 'High' }
          ]
        };

      case 'retail':
        return {
          branding: {
            primaryColor: '#805ad5',
            secondaryColor: '#dd6b20',
            accentColor: '#38a169'
          },
          retailMetrics: {
            conversionRate: 14.6,
            avgOrderValue: 127.50,
            customerLifetimeValue: 890,
            inventoryTurnover: 8.2
          },
          products: [
            { name: 'Premium Widget', sales: 1247, rating: 4.8, revenue: 62350 },
            { name: 'Smart Device', sales: 856, rating: 4.6, revenue: 85600 }
          ]
        };

      default:
        return {
          branding: {
            primaryColor: '#3b82f6',
            secondaryColor: '#64748b',
            accentColor: '#10b981'
          },
          genericMetrics: {
            efficiency: 92.3,
            uptime: 99.8,
            userGrowth: 23.7
          }
        };
    }
  }
}