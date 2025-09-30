'use client';

import React, { useState } from 'react';

export default function IntelligentCustomerServiceAutomationDemo() {
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);

  const handleProcess = async () => {
    setProcessing(true);
    // Simulate processing
    setTimeout(() => {
      setResults({
        title: "Intelligent Customer Service Automation",
        category: "Process Automation",
        confidence: "94%",
        metrics: ["60% reduction in average response time","85% customer satisfaction score improvement","40% decrease in operational costs","95% accuracy rate in intent recognition"],
        outputs: ["Automated response: 'Your current balance is $5,000. Would you like to view recent transactions?'","Sentiment score: Neutral","Escalation flag: Not required"]
      });
      setProcessing(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Intelligent Customer Service Automation</h1>
          <p className="text-gray-600 mt-2">Traditional customer service processes in financial services are slow, inconsistent, and resource-intensive. This AI-powered automation solution streamlines customer interactions, delivering instant, accurate responses while maintaining a personalized experience and ensuring regulatory compliance.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Input Data</h2>
            <div className="space-y-4">
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <p className="text-gray-700">Sample customer inquiry: 'I need help with my account balance'</p>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <p className="text-gray-700">Customer profile with transaction history</p>
              </div>
              <button
                onClick={handleProcess}
                disabled={processing}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Start Analysis'}
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            {processing && (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            )}
            {results && (
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-green-800">Processing Complete</p>
                  <p className="text-green-600">Confidence: {results.confidence}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Generated Outputs:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {results.outputs.map((output, idx) => (
                      <li key={idx} className="text-gray-700">{output}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Capabilities */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">AI Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900">Natural Language Understanding for intent recognition</h3>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900">Automated Response Generation with contextual awareness</h3>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900">Real-time Sentiment Analysis for escalation</h3>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900">Multi-channel Integration (web, mobile, voice)</h3>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900">Personalized Recommendations</h3>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900">Compliance Monitoring</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}