import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, TrendingUp, Download, BarChart3, PieChart, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from 'recharts';

const AutomatedInvestmentPortfolioGenerator = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [clientData, setClientData] = useState({
    name: '',
    age: '',
    income: '',
    goals: '',
    riskTolerance: '',
    investmentPreferences: ''
  });
  const [portfolio, setPortfolio] = useState(null);
  const [riskProfile, setRiskProfile] = useState(null);

  const fileInputRef = useRef(null);

  const handleInputChange = (field, value) => {
    setClientData(prev => ({ ...prev, [field]: value }));
  };

  const generatePortfolio = async () => {
    setIsProcessing(true);
    setCurrentStep(2);
    
    // Simulate AI processing with realistic steps
    const steps = [
      { message: "Analyzing client profile...", duration: 1000 },
      { message: "Calculating risk score...", duration: 1500 },
      { message: "Optimizing portfolio allocation...", duration: 2000 },
      { message: "Generating performance projections...", duration: 1500 },
      { message: "Finalizing recommendations...", duration: 1000 }
    ];

    let totalProgress = 0;
    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, steps[i].duration));
      totalProgress = ((i + 1) / steps.length) * 100;
      setProgress(totalProgress);
    }

    // Generate mock portfolio and risk profile
    const mockRiskProfile = {
      score: 7.2,
      category: "Moderate-Aggressive",
      confidence: "94%",
      factors: {
        age: clientData.age || "35",
        income: clientData.income || "$85,000",
        timeHorizon: "15-20 years",
        riskCapacity: "High"
      }
    };

    const mockPortfolio = {
      allocation: [
        { name: "US Equity", value: 45, color: "#1e3a8a" },
        { name: "International Equity", value: 25, color: "#1e40af" },
        { name: "Bonds", value: 20, color: "#64748b" },
        { name: "REITs", value: 7, color: "#059669" },
        { name: "Commodities", value: 3, color: "#ea580c" }
      ],
      projectedReturns: [
        { year: "Year 1", conservative: 68000, moderate: 72000, aggressive: 76000 },
        { year: "Year 5", conservative: 85000, moderate: 95000, aggressive: 108000 },
        { year: "Year 10", conservative: 115000, moderate: 140000, aggressive: 170000 },
        { year: "Year 15", conservative: 155000, moderate: 205000, aggressive: 275000 },
        { year: "Year 20", conservative: 210000, moderate: 300000, aggressive: 445000 }
      ],
      recommendations: [
        { type: "Core Holdings", funds: ["Vanguard Total Stock Market ETF", "iShares Core S&P 500 ETF"] },
        { type: "International", funds: ["Vanguard Total International Stock ETF", "iShares MSCI EAFE ETF"] },
        { type: "Fixed Income", funds: ["Vanguard Total Bond Market ETF", "iShares Core U.S. Aggregate Bond ETF"] }
      ],
      metrics: {
        expectedReturn: "8.2%",
        volatility: "12.4%",
        sharpeRatio: "0.66",
        expenseRatio: "0.15%"
      }
    };

    setRiskProfile(mockRiskProfile);
    setPortfolio(mockPortfolio);
    setIsProcessing(false);
    setCurrentStep(3);
  };

  const exportReport = () => {
    // Mock export functionality
    const reportData = {
      client: clientData,
      riskProfile,
      portfolio,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-report-${clientData.name || 'client'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setCurrentStep(1);
    setProgress(0);
    setClientData({
      name: '',
      age: '',
      income: '',
      goals: '',
      riskTolerance: '',
      investmentPreferences: ''
    });
    setPortfolio(null);
    setRiskProfile(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Automated Investment Portfolio Generator
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            AI-powered portfolio creation that aligns with your risk profile and financial goals
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              1
            </div>
            <div className={`flex-1 h-1 mx-2 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              2
            </div>
            <div className={`flex-1 h-1 mx-2 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              3
            </div>
          </div>
          <div className="flex justify-between max-w-md mx-auto mt-2">
            <span className="text-sm text-slate-600">Input</span>
            <span className="text-sm text-slate-600">Processing</span>
            <span className="text-sm text-slate-600">Results</span>
          </div>
        </div>

        {/* Step 1: Input Form */}
        {currentStep === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={clientData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={clientData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      placeholder="35"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="income">Annual Income</Label>
                  <Input
                    id="income"
                    value={clientData.income}
                    onChange={(e) => handleInputChange('income', e.target.value)}
                    placeholder="$85,000"
                  />
                </div>
                <div>
                  <Label htmlFor="goals">Investment Goals</Label>
                  <Input
                    id="goals"
                    value={clientData.goals}
                    onChange={(e) => handleInputChange('goals', e.target.value)}
                    placeholder="Retirement planning, home purchase"
                  />
                </div>
                <div>
                  <Label htmlFor="risk">Risk Tolerance</Label>
                  <Select onValueChange={(value) => handleInputChange('riskTolerance', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select risk tolerance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">Conservative</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="aggressive">Aggressive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="preferences">Investment Preferences</Label>
                  <Input
                    id="preferences"
                    value={clientData.investmentPreferences}
                    onChange={(e) => handleInputChange('investmentPreferences', e.target.value)}
                    placeholder="ESG funds, technology sector"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                  Document Upload (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                  />
                  <div className="text-gray-500">
                    <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-lg font-medium">Upload Financial Documents</p>
                    <p className="text-sm">Support for PDF, Word documents</p>
                  </div>
                </div>
                
                <Button 
                  onClick={generatePortfolio}
                  className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
                  disabled={!clientData.name || !clientData.age}
                >
                  Generate AI Portfolio
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Processing */}
        {currentStep === 2 && isProcessing && (
          <Card className="max-w-2xl mx-auto shadow-lg">
            <CardHeader>
              <CardTitle className="text-center text-2xl">AI Portfolio Generation in Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-lg text-slate-600">Please wait while our AI analyzes your profile...</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">Risk Analysis</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <PieChart className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">Asset Allocation</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <BarChart3 className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">Performance Modeling</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Results */}
        {currentStep === 3 && portfolio && riskProfile && (
          <div className="space-y-8">
            {/* Risk Profile Card */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <AlertCircle className="h-6 w-6 text-blue-600" />
                  Risk Profile Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{riskProfile.score}</div>
                    <div className="text-sm text-slate-600">Risk Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-slate-800">{riskProfile.category}</div>
                    <div className="text-sm text-slate-600">Risk Category</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">{riskProfile.confidence}</div>
                    <div className="text-sm text-slate-600">Confidence Level</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-slate-800">{riskProfile.factors.timeHorizon}</div>
                    <div className="text-sm text-slate-600">Time Horizon</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Portfolio Allocation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Portfolio Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        dataKey="value"
                        data={portfolio.allocation}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({name, value}) => `${name}: ${value}%`}
                      >
                        {portfolio.allocation.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Projected Portfolio Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={portfolio.projectedReturns}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                      <Line type="monotone" dataKey="conservative" stroke="#64748b" strokeWidth={2} />
                      <Line type="monotone" dataKey="moderate" stroke="#1e40af" strokeWidth={2} />
                      <Line type="monotone" dataKey="aggressive" stroke="#059669" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Portfolio Metrics and Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Portfolio Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Expected Return</span>
                    <span className="font-semibold">{portfolio.metrics.expectedReturn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Volatility</span>
                    <span className="font-semibold">{portfolio.metrics.volatility}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Sharpe Ratio</span>
                    <span className="font-semibold">{portfolio.metrics.sharpeRatio}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Expense Ratio</span>
                    <span className="font-semibold text-green-600">{portfolio.metrics.expenseRatio}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Success Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Generation Time</span>
                    <span className="font-semibold text-green-600">3.2 seconds</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Risk Profiling Accuracy</span>
                    <span className="font-semibold text-green-600">94%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">User Satisfaction</span>
                    <span className="font-semibold text-green-600">4.8/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Model Accuracy</span>
                    <span className="font-semibold text-green-600">96%</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={exportReport}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                  <Button 
                    onClick={() => setCurrentStep(1)}
                    variant="outline"
                    className="w-full"
                  >
                    Request Adjustment
                  </Button>
                  <Button 
                    onClick={resetForm}
                    variant="outline"
                    className="w-full"
                  >
                    New Portfolio
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutomatedInvestmentPortfolioGenerator;