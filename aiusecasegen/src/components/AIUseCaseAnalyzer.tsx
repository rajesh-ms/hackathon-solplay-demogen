"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  Brain, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Eye,
  TrendingUp,
  Users,
  Zap,
  Target,
  PieChart,
  Star,
  Clock,
  Lightbulb
} from 'lucide-react';

interface UseCaseCapability {
  id: string;
  title: string;
  category: 'Content Generation' | 'Process Automation' | 'Personalized Experience';
  description: string;
  businessValue: string;
  technicalRequirements: string[];
  keyFeatures: string[];
  keyCapabilities: {
    primary: string[];
    secondary: string[];
    advanced: string[];
  };
  capabilityDescription: string;
  implementationComplexity: 'Low' | 'Medium' | 'High';
  estimatedROI: string;
  timeToValue: string;
  priority: 'High' | 'Medium' | 'Low';
  marketImpact: string;
}

interface AnalysisResult {
  fileName: string;
  fileSize: string;
  processingTime: string;
  confidence: string;
  totalUseCases: number;
  useCases: UseCaseCapability[];
  summary: {
    contentGeneration: number;
    processAutomation: number;
    personalizedExperience: number;
  };
}

const AIUseCaseAnalyzer = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.includes('pdf')) {
      setError('Please select a PDF file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setError('File size must be less than 50MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
    await analyzePDF(file);
  }, []);

  const analyzePDF = async (file: File) => {
    setIsAnalyzing(true);
    setProgress(0);
    setError(null);

    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Simulate realistic AI processing steps with visual feedback
      const steps = [
        { message: "Uploading PDF document...", duration: 1000 },
        { message: "Extracting text from PDF document...", duration: 2000 },
        { message: "Analyzing document structure and content...", duration: 1800 },
        { message: "Identifying Financial Services AI opportunities...", duration: 3200 },
        { message: "Evaluating business value and technical feasibility...", duration: 2800 },
        { message: "Generating implementation roadmaps...", duration: 2000 },
        { message: "Calculating ROI and priority scores...", duration: 1500 },
        { message: "Finalizing AI use case recommendations...", duration: 1200 }
      ];

      // Start the API call
      const apiPromise = fetch('/api/analyze-pdf', {
        method: 'POST',
        body: formData,
      });

      // Show progress with realistic timing
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i].message);
        await new Promise(resolve => setTimeout(resolve, steps[i].duration));
        setProgress(((i + 1) / steps.length) * 95); // Leave 5% for API response processing
      }

      // Wait for API response
      setCurrentStep("Processing AI analysis results...");
      const response = await apiPromise;
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze PDF');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      setProgress(100);
      setAnalysisResult(result.data);
      setCurrentStep("Analysis complete!");
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze PDF. Please try again.';
      setError(errorMessage);
      console.error('PDF Analysis Error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Content Generation': return <FileText className="h-5 w-5" />;
      case 'Process Automation': return <Zap className="h-5 w-5" />;
      case 'Personalized Experience': return <Users className="h-5 w-5" />;
      default: return <Brain className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Content Generation': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Process Automation': return 'bg-green-50 text-green-700 border-green-200';
      case 'Personalized Experience': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <Brain className="h-16 w-16 text-blue-600" />
            <div>
              <h1 className="text-5xl font-bold text-gray-900">
                AI Use Case Generator
              </h1>
              <p className="text-lg text-blue-600 font-medium">
                Financial Services Edition
              </p>
            </div>
          </div>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            Upload your Financial Services solution documents and discover comprehensive AI use cases with detailed implementation guidance, business value analysis, and strategic roadmaps.
          </p>
        </div>

        {/* Upload Section */}
        {!analysisResult && (
          <Card className="shadow-xl border-2 border-blue-100">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="flex items-center space-x-2 text-2xl">
                <Upload className="h-8 w-8 text-blue-600" />
                <span>Upload PDF Document</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {error && (
                <Alert className="mb-6 border-red-200 bg-red-50">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <AlertDescription className="text-red-700 text-lg">{error}</AlertDescription>
                </Alert>
              )}
              
              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer ${
                  isDragOver 
                    ? 'border-blue-400 bg-blue-50 scale-102' 
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />
                
                <FileText className="h-24 w-24 text-blue-400 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-gray-700 mb-3">
                  {selectedFile ? selectedFile.name : 'Drop your Financial Services PDF here'}
                </h3>
                <p className="text-gray-500 mb-6 text-lg">
                  Or click to browse • Supports PDF files up to 50MB
                </p>
                
                {selectedFile && !isAnalyzing && (
                  <div className="mt-6 p-6 bg-gray-50 rounded-xl">
                    <p className="text-gray-600 mb-4">
                      Selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                    </p>
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        analyzePDF(selectedFile);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
                      size="lg"
                    >
                      <Sparkles className="h-5 w-5 mr-2" />
                      Analyze with AI
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Processing Section */}
        {isAnalyzing && (
          <Card className="shadow-xl border-2 border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="flex items-center space-x-2 text-2xl">
                <Brain className="h-8 w-8 text-blue-600 animate-pulse" />
                <span>AI Analysis in Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 p-8">
              <div className="text-center">
                <div className="inline-flex items-center space-x-3 text-xl text-gray-700 mb-6">
                  <Sparkles className="h-6 w-6 text-blue-600 animate-spin" />
                  <span>{currentStep}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-lg text-gray-600">
                  <span>Analysis Progress</span>
                  <span className="font-semibold">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full h-3" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="text-center p-6 bg-blue-50 rounded-xl border border-blue-200">
                  <FileText className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                  <p className="font-medium text-blue-700 text-lg">Document Analysis</p>
                </div>
                <div className="text-center p-6 bg-green-50 rounded-xl border border-green-200">
                  <Brain className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <p className="font-medium text-green-700 text-lg">AI Processing</p>
                </div>
                <div className="text-center p-6 bg-purple-50 rounded-xl border border-purple-200">
                  <Target className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                  <p className="font-medium text-purple-700 text-lg">Use Case Generation</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {analysisResult && (
          <div className="space-y-8">
            {/* Analysis Summary */}
            <Card className="shadow-xl border-2 border-green-200">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="flex items-center space-x-2 text-2xl">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <span>Analysis Complete - {analysisResult.totalUseCases} AI Use Cases Identified</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600">{analysisResult.totalUseCases}</div>
                    <div className="text-gray-600 font-medium">Use Cases Found</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-green-600">{analysisResult.confidence}</div>
                    <div className="text-gray-600 font-medium">AI Confidence</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-gray-800">{analysisResult.processingTime}</div>
                    <div className="text-gray-600 font-medium">Processing Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-gray-800">{analysisResult.fileSize}</div>
                    <div className="text-gray-600 font-medium">Document Size</div>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-center space-x-4">
                  <Button 
                    onClick={() => {
                      setAnalysisResult(null);
                      setSelectedFile(null);
                    }}
                    variant="outline"
                    size="lg"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Analyze Another Document
                  </Button>
                  <Button className="bg-green-600 hover:bg-green-700" size="lg">
                    <Download className="h-5 w-5 mr-2" />
                    Export Full Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Category Summary */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-2xl">
                  <PieChart className="h-8 w-8 text-blue-600" />
                  <span>Use Case Distribution by Category</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center p-8 bg-blue-50 rounded-xl border-2 border-blue-200">
                    <FileText className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                    <div className="text-3xl font-bold text-blue-700">{analysisResult.summary.contentGeneration}</div>
                    <div className="font-medium text-blue-600">Content Generation</div>
                    <p className="text-sm text-blue-500 mt-2">AI-powered content creation and analysis</p>
                  </div>
                  <div className="text-center p-8 bg-green-50 rounded-xl border-2 border-green-200">
                    <Zap className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <div className="text-3xl font-bold text-green-700">{analysisResult.summary.processAutomation}</div>
                    <div className="font-medium text-green-600">Process Automation</div>
                    <p className="text-sm text-green-500 mt-2">Intelligent workflow and task automation</p>
                  </div>
                  <div className="text-center p-8 bg-purple-50 rounded-xl border-2 border-purple-200">
                    <Users className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                    <div className="text-3xl font-bold text-purple-700">{analysisResult.summary.personalizedExperience}</div>
                    <div className="font-medium text-purple-600">Personalized Experience</div>
                    <p className="text-sm text-purple-500 mt-2">AI-driven personalization and insights</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Use Cases Tabbed Interface */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                <Target className="h-8 w-8 text-blue-600" />
                <span>AI Use Cases & Implementation Roadmap</span>
              </h2>
              
              <Tabs defaultValue="content-generation" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8 bg-gray-100 p-1 rounded-xl">
                  <TabsTrigger 
                    value="content-generation" 
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-200"
                  >
                    <FileText className="h-5 w-5 mr-2" />
                    Content Generation ({analysisResult.summary.contentGeneration})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="process-automation"
                    className="data-[state=active]:bg-green-600 data-[state=active]:text-white transition-all duration-200"
                  >
                    <Zap className="h-5 w-5 mr-2" />
                    Process Automation ({analysisResult.summary.processAutomation})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="personalized-experience"
                    className="data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all duration-200"
                  >
                    <Users className="h-5 w-5 mr-2" />
                    Personalized Experience ({analysisResult.summary.personalizedExperience})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="content-generation" className="space-y-6">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {analysisResult.useCases
                      .filter(useCase => useCase.category === 'Content Generation')
                      .map((useCase) => (
                        <Card key={useCase.id} className="shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-blue-300 h-fit">
                          <CardHeader className="pb-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3">
                                <div className={`p-2 rounded-lg border-2 ${getCategoryColor(useCase.category)}`}>
                                  {getCategoryIcon(useCase.category)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-lg text-gray-900 leading-tight">{useCase.title}</CardTitle>
                                  <div className="flex items-center space-x-2 mt-2">
                                    <Badge className={`${getComplexityColor(useCase.implementationComplexity)} border-0`}>
                                      {useCase.implementationComplexity}
                                    </Badge>
                                    <Badge className={`${getPriorityColor(useCase.priority)} border-0`}>
                                      {useCase.priority}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xl font-bold text-green-600">{useCase.estimatedROI}</div>
                                <div className="text-xs text-gray-500 font-medium">ROI</div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4 pt-0">
                            <p className="text-gray-700 text-sm leading-relaxed">{useCase.description}</p>
                            
                            <div className="grid grid-cols-1 gap-4">
                              <div className="space-y-2">
                                <h4 className="font-semibold text-gray-900 flex items-center text-sm">
                                  <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                                  Business Value
                                </h4>
                                <p className="text-gray-600 text-sm">{useCase.businessValue}</p>
                              </div>
                              <div className="space-y-2">
                                <h4 className="font-semibold text-gray-900 flex items-center text-sm">
                                  <Clock className="h-4 w-4 mr-1 text-blue-600" />
                                  Time to Value: {useCase.timeToValue}
                                </h4>
                              </div>
                            </div>

                            {/* Key Capabilities Section */}
                            <div className="space-y-3">
                              <h4 className="font-semibold text-gray-900 flex items-center text-sm">
                                <Lightbulb className="h-4 w-4 mr-1 text-yellow-600" />
                                Key Capabilities
                              </h4>
                              <p className="text-gray-700 text-sm leading-relaxed">{useCase.capabilityDescription}</p>
                              
                              <div className="space-y-2">
                                <div className="space-y-1">
                                  <h5 className="font-medium text-gray-800 text-xs flex items-center">
                                    <Star className="h-3 w-3 mr-1 text-yellow-500" />
                                    Primary Capabilities
                                  </h5>
                                  <div className="flex flex-wrap gap-1">
                                    {useCase.keyCapabilities.primary.map((cap, idx) => (
                                      <Badge key={idx} className="bg-blue-100 text-blue-800 text-xs hover:bg-blue-200 border-0">
                                        {cap}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                
                                <div className="space-y-1">
                                  <h5 className="font-medium text-gray-800 text-xs">Secondary Capabilities</h5>
                                  <div className="flex flex-wrap gap-1">
                                    {useCase.keyCapabilities.secondary.map((cap, idx) => (
                                      <Badge key={idx} className="bg-gray-100 text-gray-700 text-xs hover:bg-gray-200 border-0">
                                        {cap}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                
                                <div className="space-y-1">
                                  <h5 className="font-medium text-gray-800 text-xs">Advanced Capabilities</h5>
                                  <div className="flex flex-wrap gap-1">
                                    {useCase.keyCapabilities.advanced.map((cap, idx) => (
                                      <Badge key={idx} className="bg-purple-100 text-purple-800 text-xs hover:bg-purple-200 border-0">
                                        {cap}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <h4 className="font-semibold text-gray-900 text-sm">Technical Requirements</h4>
                              <div className="flex flex-wrap gap-1">
                                {useCase.technicalRequirements.map((req, idx) => (
                                  <Badge key={idx} className="bg-blue-50 text-blue-700 text-xs border border-blue-200 hover:bg-blue-100">
                                    {req}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <div className="flex justify-between pt-4 border-t border-gray-100">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View Plan
                              </Button>
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                <Sparkles className="h-4 w-4 mr-1" />
                                Generate
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </TabsContent>

                <TabsContent value="process-automation" className="space-y-6">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {analysisResult.useCases
                      .filter(useCase => useCase.category === 'Process Automation')
                      .map((useCase) => (
                        <Card key={useCase.id} className="shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-green-300 h-fit">
                          <CardHeader className="pb-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3">
                                <div className={`p-2 rounded-lg border-2 ${getCategoryColor(useCase.category)}`}>
                                  {getCategoryIcon(useCase.category)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-lg text-gray-900 leading-tight">{useCase.title}</CardTitle>
                                  <div className="flex items-center space-x-2 mt-2">
                                    <Badge className={`${getComplexityColor(useCase.implementationComplexity)} border-0`}>
                                      {useCase.implementationComplexity}
                                    </Badge>
                                    <Badge className={`${getPriorityColor(useCase.priority)} border-0`}>
                                      {useCase.priority}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xl font-bold text-green-600">{useCase.estimatedROI}</div>
                                <div className="text-xs text-gray-500 font-medium">ROI</div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4 pt-0">
                            <p className="text-gray-700 text-sm leading-relaxed">{useCase.description}</p>
                            
                            <div className="grid grid-cols-1 gap-4">
                              <div className="space-y-2">
                                <h4 className="font-semibold text-gray-900 flex items-center text-sm">
                                  <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                                  Business Value
                                </h4>
                                <p className="text-gray-600 text-sm">{useCase.businessValue}</p>
                              </div>
                              <div className="space-y-2">
                                <h4 className="font-semibold text-gray-900 flex items-center text-sm">
                                  <Clock className="h-4 w-4 mr-1 text-blue-600" />
                                  Time to Value: {useCase.timeToValue}
                                </h4>
                              </div>
                            </div>

                            {/* Key Capabilities Section */}
                            <div className="space-y-3">
                              <h4 className="font-semibold text-gray-900 flex items-center text-sm">
                                <Lightbulb className="h-4 w-4 mr-1 text-yellow-600" />
                                Key Capabilities
                              </h4>
                              <p className="text-gray-700 text-sm leading-relaxed">{useCase.capabilityDescription}</p>
                              
                              <div className="space-y-2">
                                <div className="space-y-1">
                                  <h5 className="font-medium text-gray-800 text-xs flex items-center">
                                    <Star className="h-3 w-3 mr-1 text-yellow-500" />
                                    Primary Capabilities
                                  </h5>
                                  <div className="flex flex-wrap gap-1">
                                    {useCase.keyCapabilities.primary.map((cap, idx) => (
                                      <Badge key={idx} className="bg-green-100 text-green-800 text-xs hover:bg-green-200 border-0">
                                        {cap}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                
                                <div className="space-y-1">
                                  <h5 className="font-medium text-gray-800 text-xs">Secondary Capabilities</h5>
                                  <div className="flex flex-wrap gap-1">
                                    {useCase.keyCapabilities.secondary.map((cap, idx) => (
                                      <Badge key={idx} className="bg-gray-100 text-gray-700 text-xs hover:bg-gray-200 border-0">
                                        {cap}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                
                                <div className="space-y-1">
                                  <h5 className="font-medium text-gray-800 text-xs">Advanced Capabilities</h5>
                                  <div className="flex flex-wrap gap-1">
                                    {useCase.keyCapabilities.advanced.map((cap, idx) => (
                                      <Badge key={idx} className="bg-purple-100 text-purple-800 text-xs hover:bg-purple-200 border-0">
                                        {cap}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <h4 className="font-semibold text-gray-900 text-sm">Technical Requirements</h4>
                              <div className="flex flex-wrap gap-1">
                                {useCase.technicalRequirements.map((req, idx) => (
                                  <Badge key={idx} className="bg-green-50 text-green-700 text-xs border border-green-200 hover:bg-green-100">
                                    {req}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <div className="flex justify-between pt-4 border-t border-gray-100">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View Plan
                              </Button>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                <Sparkles className="h-4 w-4 mr-1" />
                                Generate
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </TabsContent>

                <TabsContent value="personalized-experience" className="space-y-6">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {analysisResult.useCases
                      .filter(useCase => useCase.category === 'Personalized Experience')
                      .map((useCase) => (
                        <Card key={useCase.id} className="shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-purple-300 h-fit">
                          <CardHeader className="pb-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3">
                                <div className={`p-2 rounded-lg border-2 ${getCategoryColor(useCase.category)}`}>
                                  {getCategoryIcon(useCase.category)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-lg text-gray-900 leading-tight">{useCase.title}</CardTitle>
                                  <div className="flex items-center space-x-2 mt-2">
                                    <Badge className={`${getComplexityColor(useCase.implementationComplexity)} border-0`}>
                                      {useCase.implementationComplexity}
                                    </Badge>
                                    <Badge className={`${getPriorityColor(useCase.priority)} border-0`}>
                                      {useCase.priority}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xl font-bold text-green-600">{useCase.estimatedROI}</div>
                                <div className="text-xs text-gray-500 font-medium">ROI</div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4 pt-0">
                            <p className="text-gray-700 text-sm leading-relaxed">{useCase.description}</p>
                            
                            <div className="grid grid-cols-1 gap-4">
                              <div className="space-y-2">
                                <h4 className="font-semibold text-gray-900 flex items-center text-sm">
                                  <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                                  Business Value
                                </h4>
                                <p className="text-gray-600 text-sm">{useCase.businessValue}</p>
                              </div>
                              <div className="space-y-2">
                                <h4 className="font-semibold text-gray-900 flex items-center text-sm">
                                  <Clock className="h-4 w-4 mr-1 text-blue-600" />
                                  Time to Value: {useCase.timeToValue}
                                </h4>
                              </div>
                            </div>

                            {/* Key Capabilities Section */}
                            <div className="space-y-3">
                              <h4 className="font-semibold text-gray-900 flex items-center text-sm">
                                <Lightbulb className="h-4 w-4 mr-1 text-yellow-600" />
                                Key Capabilities
                              </h4>
                              <p className="text-gray-700 text-sm leading-relaxed">{useCase.capabilityDescription}</p>
                              
                              <div className="space-y-2">
                                <div className="space-y-1">
                                  <h5 className="font-medium text-gray-800 text-xs flex items-center">
                                    <Star className="h-3 w-3 mr-1 text-yellow-500" />
                                    Primary Capabilities
                                  </h5>
                                  <div className="flex flex-wrap gap-1">
                                    {useCase.keyCapabilities.primary.map((cap, idx) => (
                                      <Badge key={idx} className="bg-purple-100 text-purple-800 text-xs hover:bg-purple-200 border-0">
                                        {cap}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                
                                <div className="space-y-1">
                                  <h5 className="font-medium text-gray-800 text-xs">Secondary Capabilities</h5>
                                  <div className="flex flex-wrap gap-1">
                                    {useCase.keyCapabilities.secondary.map((cap, idx) => (
                                      <Badge key={idx} className="bg-gray-100 text-gray-700 text-xs hover:bg-gray-200 border-0">
                                        {cap}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                
                                <div className="space-y-1">
                                  <h5 className="font-medium text-gray-800 text-xs">Advanced Capabilities</h5>
                                  <div className="flex flex-wrap gap-1">
                                    {useCase.keyCapabilities.advanced.map((cap, idx) => (
                                      <Badge key={idx} className="bg-indigo-100 text-indigo-800 text-xs hover:bg-indigo-200 border-0">
                                        {cap}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <h4 className="font-semibold text-gray-900 text-sm">Technical Requirements</h4>
                              <div className="flex flex-wrap gap-1">
                                {useCase.technicalRequirements.map((req, idx) => (
                                  <Badge key={idx} className="bg-purple-50 text-purple-700 text-xs border border-purple-200 hover:bg-purple-100">
                                    {req}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <div className="flex justify-between pt-4 border-t border-gray-100">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View Plan
                              </Button>
                              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                                <Sparkles className="h-4 w-4 mr-1" />
                                Generate
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIUseCaseAnalyzer;