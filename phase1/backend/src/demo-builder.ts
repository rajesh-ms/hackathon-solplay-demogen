export interface DemoConfig {
  title: string;
  description: string;
  scenario: any;
  steps: DemoStep[];
}

export interface DemoStep {
  stepNumber: number;
  title: string;
  description: string;
  type: 'upload' | 'processing' | 'analysis' | 'results';
  mockData?: any;
  expectedOutput?: string;
}

export class DemoBuilder {
  
  generateRFPDemo(extractedData: any): DemoConfig {
    console.log('🎬 Building interactive demo from extracted data...');
    
    const capabilities = extractedData.rfpCapabilities || [];
    const scenarios = extractedData.sampleScenarios || [];
    const metrics = extractedData.keyMetrics || {};
    
    return {
      title: "RFP Response Automation - Financial Services Demo",
      description: "Interactive demonstration of AI-powered RFP response generation for Financial Services organizations",
      scenario: scenarios[0] || this.getDefaultScenario(),
      steps: [
        {
          stepNumber: 1,
          title: "Upload RFP Document",
          description: "Upload a Financial Services RFP document for automated analysis and response generation",
          type: 'upload',
          mockData: {
            fileName: "Investment_Platform_RFP_2024.pdf",
            fileSize: "2.4 MB",
            pageCount: 45
          },
          expectedOutput: "PDF successfully uploaded and validated"
        },
        {
          stepNumber: 2, 
          title: "AI Document Analysis",
          description: "AI system analyzes RFP requirements, identifies key sections, and extracts technical specifications",
          type: 'processing',
          mockData: {
            analysisProgress: [
              "Parsing document structure...",
              "Identifying requirement sections...", 
              "Extracting technical specifications...",
              "Mapping to capability database...",
              "Generating response outline..."
            ],
            timeEstimate: "2-3 minutes"
          },
          expectedOutput: "Requirements analysis completed with 95% confidence"
        },
        {
          stepNumber: 3,
          title: "Capability Matching & Response Generation", 
          description: "System matches RFP requirements to organizational capabilities and generates tailored response sections",
          type: 'analysis',
          mockData: {
            matchedCapabilities: capabilities.slice(0, 3),
            responseMetrics: {
              sectionsGenerated: 12,
              complianceScore: "98%",
              completenessScore: "94%"
            }
          },
          expectedOutput: "Comprehensive RFP response generated with full compliance validation"
        },
        {
          stepNumber: 4,
          title: "Review Generated Response",
          description: "Review the AI-generated RFP response with highlighted sections, compliance checks, and suggested improvements",
          type: 'results',
          mockData: {
            generatedSections: [
              "Executive Summary",
              "Technical Architecture", 
              "Implementation Methodology",
              "Security & Compliance",
              "Pricing & Commercial Terms",
              "Project Timeline",
              "Team Qualifications",
              "References & Case Studies"
            ],
            businessValue: metrics,
            downloadOptions: ["PDF", "Word", "PowerPoint"]
          },
          expectedOutput: "Professional RFP response ready for review and submission"
        }
      ]
    };
  }
  
    // Backward compatibility alias (previous code referenced buildRFPDemo)
    buildRFPDemo(extractedData: any, _originalName?: string): string {
        const config = this.generateRFPDemo(extractedData);
        return this.generateDemoHTML(config);
    }
  
  private getDefaultScenario(): any {
    return {
      scenario: "Investment Management Platform RFP Response",
      inputExample: "Large financial institution seeking comprehensive portfolio management solution with advanced analytics",
      outputExample: "Complete RFP response including technical specifications, implementation plan, and competitive differentiation"
    };
  }
  
  generateDemoHTML(demoConfig: DemoConfig): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${demoConfig.title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .demo-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .demo-header {
            background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .demo-header h1 {
            font-size: 2.5rem;
            margin-bottom: 15px;
            font-weight: 700;
        }
        
        .demo-header p {
            font-size: 1.2rem;
            opacity: 0.9;
            max-width: 800px;
            margin: 0 auto;
        }
        
        .scenario-section {
            background: #f8f9fa;
            padding: 30px 40px;
            border-bottom: 1px solid #e9ecef;
        }
        
        .scenario-title {
            color: #2c3e50;
            font-size: 1.5rem;
            margin-bottom: 15px;
            font-weight: 600;
        }
        
        .scenario-content {
            color: #555;
            line-height: 1.6;
        }
        
        .steps-container {
            padding: 40px;
        }
        
        .step {
            display: flex;
            align-items: flex-start;
            margin-bottom: 40px;
            padding: 30px;
            background: #f8f9fa;
            border-radius: 12px;
            border-left: 5px solid #3498db;
            transition: all 0.3s ease;
        }
        
        .step:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .step-number {
            background: #3498db;
            color: white;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 1.2rem;
            margin-right: 25px;
            flex-shrink: 0;
        }
        
        .step-content {
            flex: 1;
        }
        
        .step-title {
            color: #2c3e50;
            font-size: 1.3rem;
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        .step-description {
            color: #555;
            line-height: 1.6;
            margin-bottom: 15px;
        }
        
        .step-details {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-top: 15px;
        }
        
        .step-type {
            display: inline-block;
            padding: 5px 12px;
            background: #e3f2fd;
            color: #1976d2;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 500;
            margin-bottom: 10px;
        }
        
        .mock-data {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
            margin: 10px 0;
        }
        
        .expected-output {
            background: #e8f5e8;
            color: #2e7d32;
            padding: 15px;
            border-radius: 6px;
            margin: 10px 0;
            border-left: 4px solid #4caf50;
        }
        
        .demo-footer {
            background: #2c3e50;
            color: white;
            padding: 30px 40px;
            text-align: center;
        }
        
        .upload-button {
            background: #3498db;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 8px;
            font-size: 1.1rem;
            cursor: pointer;
            margin-top: 20px;
            transition: background 0.3s ease;
        }
        
        .upload-button:hover {
            background: #2980b9;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .metric-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border: 2px solid #e9ecef;
        }
        
        .metric-value {
            font-size: 1.5rem;
            font-weight: bold;
            color: #3498db;
            margin-bottom: 10px;
        }
        
        .metric-label {
            color: #666;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="demo-container">
        <div class="demo-header">
            <h1>${demoConfig.title}</h1>
            <p>${demoConfig.description}</p>
        </div>
        
        <div class="scenario-section">
            <h2 class="scenario-title">Demo Scenario: ${demoConfig.scenario.scenario}</h2>
            <div class="scenario-content">
                <p><strong>Input:</strong> ${demoConfig.scenario.inputExample}</p>
                <p><strong>Expected Output:</strong> ${demoConfig.scenario.outputExample}</p>
            </div>
        </div>
        
        <div class="steps-container">
            <h2 style="text-align: center; margin-bottom: 40px; color: #2c3e50; font-size: 2rem;">Demo Walkthrough</h2>
            
            ${demoConfig.steps.map(step => `
                <div class="step">
                    <div class="step-number">${step.stepNumber}</div>
                    <div class="step-content">
                        <h3 class="step-title">${step.title}</h3>
                        <p class="step-description">${step.description}</p>
                        <div class="step-type">${step.type.toUpperCase()}</div>
                        
                        ${step.mockData ? `
                            <div class="step-details">
                                <h4>Sample Data:</h4>
                                <div class="mock-data">${JSON.stringify(step.mockData, null, 2)}</div>
                            </div>
                        ` : ''}
                        
                        ${step.expectedOutput ? `
                            <div class="expected-output">
                                <strong>Expected Result:</strong> ${step.expectedOutput}
                            </div>
                        ` : ''}
                        
                        ${step.stepNumber === 1 ? `
                            <button class="upload-button" onclick="simulateUpload()">
                                📄 Start Demo - Upload Sample RFP
                            </button>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="demo-footer">
            <h3>Business Impact Metrics</h3>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value">85%</div>
                    <div class="metric-label">Time Reduction</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">30%</div>
                    <div class="metric-label">Higher Win Rate</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">5x</div>
                    <div class="metric-label">Capacity Increase</div>
                </div>
            </div>
            <p style="margin-top: 30px; opacity: 0.8;">
                Generated by ARIA v4 AI Development Framework - Phase 1 MVP Demo
            </p>
        </div>
    </div>
    
    <script>
        function simulateUpload() {
            alert('Demo: PDF upload simulation would start here. In the full implementation, this would trigger the actual PDF processing pipeline.');
        }
        
        // Add some interactivity
        document.querySelectorAll('.step').forEach((step, index) => {
            step.addEventListener('click', () => {
                step.style.transform = 'scale(1.02)';
                setTimeout(() => {
                    step.style.transform = 'translateY(-2px)';
                }, 200);
            });
        });
    </script>
</body>
</html>`;
  }
}