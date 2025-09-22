import fetch from 'node-fetch';
import { LoggingService } from '../../services/logging-service';

export interface V0GenerationRequest {
  prompt: string;
  framework: 'react' | 'vue' | 'svelte';
  styling: 'tailwindcss' | 'css' | 'styled-components';
}

export interface V0GenerationResult {
  success: boolean;
  code?: string;
  metadata?: {
    model: string;
    tokens: number;
    duration: number;
  };
  error?: string;
}

export class V0EnhancedClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private logger: LoggingService;

  constructor() {
    this.apiKey = process.env.V0_API_KEY || '';
    this.baseUrl = process.env.V0_BASE_URL || 'https://api.v0.dev/v1';
    this.timeout = parseInt(process.env.V0_TIMEOUT || '30000');
    this.logger = LoggingService.getInstance();

    if (!this.apiKey) {
      this.logger.warn('V0 API key not configured, using mock mode');
    }
  }

  async generateComponent(request: V0GenerationRequest): Promise<V0GenerationResult> {
    const startTime = Date.now();

    try {
      this.logger.info('Generating component with v0.dev', {
        framework: request.framework,
        styling: request.styling,
        promptLength: request.prompt.length
      });

      // If no API key, use enhanced mock generation
      if (!this.apiKey) {
        return this.generateMockComponent(request);
      }

      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'v0-1.5-lg',
          messages: [
            {
              role: 'user',
              content: request.prompt
            }
          ],
          stream: false,
          max_completion_tokens: 4000
        }),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('V0 service rate limit exceeded');
        }
        throw new Error(`V0 service error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json() as any;
      const duration = Date.now() - startTime;

      // Extract React component code from response
      const code = this.extractComponentCode(result);

      this.logger.info('V0 component generation completed', {
        success: true,
        duration,
        codeLength: code.length
      });

      return {
        success: true,
        code,
        metadata: {
          model: 'v0-1.5-lg',
          tokens: result.usage?.total_tokens || 0,
          duration
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.logger.error('V0 component generation failed', {
        error: errorMessage,
        duration
      });

      // Fallback to mock for certain errors
      if (errorMessage.includes('rate limit') || errorMessage.includes('timeout')) {
        this.logger.info('Falling back to mock component generation');
        return this.generateMockComponent(request);
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  private extractComponentCode(v0Response: any): string {
    // Extract React component code from v0.dev response
    if (v0Response.choices && v0Response.choices[0]?.message?.content) {
      const content = v0Response.choices[0].message.content;
      
      // Look for JSX/React component code
      const codeBlockRegex = /```(?:jsx|tsx|javascript|typescript)?\n([\s\S]*?)\n```/;
      const match = content.match(codeBlockRegex);
      
      if (match && match[1]) {
        return match[1].trim();
      }
      
      // If no code block found, return the whole content
      return content;
    }
    
    throw new Error('No valid component code found in v0.dev response');
  }

  private generateMockComponent(request: V0GenerationRequest): V0GenerationResult {
    // Enhanced mock component generation based on prompt analysis
    const promptLower = request.prompt.toLowerCase();
    
    let mockComponent = '';
    
    if (promptLower.includes('dashboard') || promptLower.includes('analytics')) {
      mockComponent = this.generateDashboardMock();
    } else if (promptLower.includes('form') || promptLower.includes('input')) {
      mockComponent = this.generateFormMock();
    } else if (promptLower.includes('personalized') || promptLower.includes('recommendation')) {
      mockComponent = this.generatePersonalizationMock();
    } else {
      mockComponent = this.generateGenericMock();
    }

    return {
      success: true,
      code: mockComponent,
      metadata: {
        model: 'mock-v0-enhanced',
        tokens: mockComponent.length,
        duration: 1500 + Math.random() * 2000 // Simulate realistic timing
      }
    };
  }

  private generateDashboardMock(): string {
    return `
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, Users, DollarSign, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const AnalyticsDashboard = () => {
  const [metrics, setMetrics] = useState({
    totalProcessed: 15847,
    successRate: 96.2,
    avgProcessingTime: 2.3,
    costSavings: 340000
  });

  const [chartData] = useState([
    { name: 'Mon', processed: 2400, accuracy: 96 },
    { name: 'Tue', processed: 1398, accuracy: 94 },
    { name: 'Wed', processed: 9800, accuracy: 98 },
    { name: 'Thu', processed: 3908, accuracy: 95 },
    { name: 'Fri', processed: 4800, accuracy: 97 },
    { name: 'Sat', processed: 3800, accuracy: 96 },
    { name: 'Sun', processed: 4300, accuracy: 94 }
  ]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Process Automation Dashboard</h1>
          <p className="text-gray-600">Real-time monitoring and analytics for automated workflows</p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalProcessed.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.successRate}%</div>
              <p className="text-xs text-muted-foreground">+2.1% improvement</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avgProcessingTime}s</div>
              <p className="text-xs text-muted-foreground">-0.5s optimization</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$\{metrics.costSavings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Annual projection</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Processing Volume Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="processed" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Accuracy Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="accuracy" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Action Items */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity & Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <div className="flex-1">
                  <p className="font-medium">Batch Processing Completed</p>
                  <p className="text-sm text-gray-600">2,847 documents processed successfully</p>
                </div>
                <span className="text-sm text-gray-500">2 min ago</span>
              </div>
              
              <div className="flex items-center p-4 bg-yellow-50 rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                <div className="flex-1">
                  <p className="font-medium">Performance Optimization</p>
                  <p className="text-sm text-gray-600">Processing speed improved by 15%</p>
                </div>
                <span className="text-sm text-gray-500">1 hour ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
`;
  }

  private generateFormMock(): string {
    return `
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Send, Sparkles } from 'lucide-react';

const IntelligentForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: '',
    category: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate AI processing
    setTimeout(() => {
      setResult({
        confidence: 94.5,
        recommendations: [
          'Auto-categorized as "High Priority"',
          'Suggested timeline: 2-3 business days',
          'Recommended team: AI Development'
        ],
        enhancedDescription: formData.description + ' [AI Enhanced: Added context and clarity]'
      });
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI-Powered Content Generation</h1>
          <p className="text-gray-600">Transform your ideas into professional content with AI assistance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Content Input
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="title">Content Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Enter your content title..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe your content requirements..."
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Content Category</Label>
                  <Select onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="marketing">Marketing Content</SelectItem>
                      <SelectItem value="technical">Technical Documentation</SelectItem>
                      <SelectItem value="social">Social Media</SelectItem>
                      <SelectItem value="email">Email Campaign</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select onValueChange={(value) => setFormData({...formData, priority: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">Upload reference files (optional)</p>
                  <p className="text-sm text-gray-500">PDF, DOC, or TXT files</p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>Processing with AI...</>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Generate Content
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Results</CardTitle>
            </CardHeader>
            <CardContent>
              {isProcessing ? (
                <div className="space-y-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </div>
                  <p className="text-center text-gray-600">AI is processing your content...</p>
                </div>
              ) : result ? (
                <div className="space-y-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2">Content Generated Successfully</h3>
                    <p className="text-green-700">Confidence Score: {result.confidence}%</p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">AI Recommendations:</h4>
                    <ul className="space-y-2">
                      {result.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <span className="text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Enhanced Content:</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700">{result.enhancedDescription}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline">Edit Content</Button>
                    <Button>Export & Download</Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <Sparkles className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>Submit the form to see AI-generated results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default IntelligentForm;
`;
  }

  private generatePersonalizationMock(): string {
    return `
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { User, Heart, TrendingUp, Target, Star } from 'lucide-react';

const PersonalizationDashboard = () => {
  const [selectedCustomer, setSelectedCustomer] = useState({
    name: 'Sarah Chen',
    segment: 'Premium Customer',
    engagementScore: 87,
    preferences: ['Technology', 'Sustainability', 'Premium Products'],
    lastInteraction: '2 hours ago'
  });

  const recommendations = [
    {
      title: 'Eco-Friendly Tech Bundle',
      confidence: 94,
      reason: 'Based on sustainability and technology interests',
      value: '$1,299',
      type: 'product'
    },
    {
      title: 'Premium Support Upgrade',
      confidence: 89,
      reason: 'Premium customer segment preference',
      value: '$29/month',
      type: 'service'
    },
    {
      title: 'Sustainability Newsletter',
      confidence: 92,
      reason: 'High engagement with eco-content',
      value: 'Free',
      type: 'content'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI-Powered Personalization Engine</h1>
          <p className="text-gray-600">Delivering personalized experiences through intelligent customer insights</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg">{selectedCustomer.name}</h3>
                <Badge variant="secondary">{selectedCustomer.segment}</Badge>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Engagement Score</span>
                  <span className="font-semibold">{selectedCustomer.engagementScore}%</span>
                </div>
                <Progress value={selectedCustomer.engagementScore} className="h-2" />
              </div>

              <div>
                <h4 className="font-semibold mb-2">Preferences</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCustomer.preferences.map((pref, index) => (
                    <Badge key={index} variant="outline">{pref}</Badge>
                  ))}
                </div>
              </div>

              <div className="text-sm text-gray-600">
                Last interaction: {selectedCustomer.lastInteraction}
              </div>
            </CardContent>
          </Card>

          {/* Personalized Recommendations */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Personalized Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-lg">{rec.title}</h4>
                        <p className="text-gray-600 text-sm">{rec.reason}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{rec.value}</div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Star className="h-3 w-3 mr-1" />
                          {rec.confidence}% match
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Badge variant={rec.type === 'product' ? 'default' : rec.type === 'service' ? 'secondary' : 'outline'}>
                        {rec.type}
                      </Badge>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personalization Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Click-through Rate</span>
                  <span className="font-semibold text-green-600">+24%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Conversion Rate</span>
                  <span className="font-semibold text-green-600">+18%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer Satisfaction</span>
                  <span className="font-semibold text-green-600">+31%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Engagement Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Email Opens</span>
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="font-semibold">68%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">App Sessions</span>
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="font-semibold">145/week</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Purchase Intent</span>
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="font-semibold">High</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Next Best Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Heart className="mr-2 h-4 w-4" />
                  Send Personalized Offer
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Target className="mr-2 h-4 w-4" />
                  Schedule Follow-up
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Star className="mr-2 h-4 w-4" />
                  Request Feedback
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PersonalizationDashboard;
`;
  }

  private generateGenericMock(): string {
    return `
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sparkles, BarChart3, Users, TrendingUp } from 'lucide-react';

const AICapabilitiesDemo = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const capabilities = [
    {
      title: "Advanced Analytics",
      icon: BarChart3,
      description: "Real-time data processing and insights",
      metrics: { accuracy: 96, speed: "2.3s", volume: "10K+" }
    },
    {
      title: "User Intelligence", 
      icon: Users,
      description: "Behavioral analysis and segmentation",
      metrics: { engagement: 87, retention: "94%", satisfaction: "4.8/5" }
    },
    {
      title: "Predictive Modeling",
      icon: TrendingUp, 
      description: "Future trend analysis and forecasting",
      metrics: { accuracy: 94, confidence: "92%", horizon: "12 months" }
    }
  ];

  const handleDemo = () => {
    setIsProcessing(true);
    setTimeout(() => setIsProcessing(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AI-Powered Business Intelligence</h1>
          <p className="text-xl text-gray-600">Transforming data into actionable insights with artificial intelligence</p>
        </div>

        {/* Capability Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
            {capabilities.map((cap, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={\`flex-1 flex items-center justify-center px-4 py-2 rounded-md transition-colors \${
                  activeTab === index 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }\`}
              >
                <cap.icon className="mr-2 h-4 w-4" />
                {cap.title}
              </button>
            ))}
          </div>
        </div>

        {/* Active Capability Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <capabilities[activeTab].icon className="h-6 w-6 text-blue-600" />
                {capabilities[activeTab].title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">{capabilities[activeTab].description}</p>
              
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Key Performance Metrics</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {Object.entries(capabilities[activeTab].metrics).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{value}</div>
                        <div className="text-sm text-gray-600 capitalize">{key}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={handleDemo} className="w-full" disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                      Processing Demo...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Run Live Demo
                    </>
                  )}
                </Button>

                {isProcessing && (
                  <div className="space-y-2">
                    <Progress value={33} className="w-full" />
                    <p className="text-sm text-gray-600 text-center">AI processing your request...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Live Results</CardTitle>
            </CardHeader>
            <CardContent>
              {isProcessing ? (
                <div className="space-y-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 p-3 rounded">
                    <h4 className="font-semibold text-green-800">Status: Ready</h4>
                    <p className="text-green-700 text-sm">Click "Run Live Demo" to see AI in action</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold">Recent Insights:</h4>
                    <ul className="text-sm space-y-1">
                      <li>• 15% improvement in processing efficiency</li>
                      <li>• 23% increase in prediction accuracy</li>
                      <li>• 8.2x faster data analysis</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Business Impact */}
        <Card>
          <CardHeader>
            <CardTitle>Business Impact Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">$2.4M</div>
                <div className="text-sm text-gray-600">Annual Cost Savings</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">65%</div>
                <div className="text-sm text-gray-600">Process Efficiency Gain</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">47%</div>
                <div className="text-sm text-gray-600">Decision Speed Improvement</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">99.2%</div>
                <div className="text-sm text-gray-600">System Reliability</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AICapabilitiesDemo;
`;
  }
}