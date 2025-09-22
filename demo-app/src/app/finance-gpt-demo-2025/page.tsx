"use client";

import React, { useState } from 'react';

export default function FinanceGPTAnalyticsPlatformDemo() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const mockData = {
    sentiment: { positive: 65, negative: 20, neutral: 15 },
    earnings: [
      { company: 'AAPL', quarter: 'Q3 2024', sentiment: 'Positive', risk: 'Low' },
      { company: 'GOOGL', quarter: 'Q3 2024', sentiment: 'Neutral', risk: 'Medium' },
      { company: 'MSFT', quarter: 'Q3 2024', sentiment: 'Positive', risk: 'Low' }
    ],
    recommendations: [
      { stock: 'AAPL', action: 'BUY', confidence: '92%', target: '$185' },
      { stock: 'NVDA', action: 'HOLD', confidence: '78%', target: '$450' },
      { stock: 'TSLA', action: 'SELL', confidence: '85%', target: '$220' }
    ]
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => setIsAnalyzing(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">FinanceGPT Analytics Platform</h1>
              <p className="text-blue-200 text-lg">AI-Powered Financial Research & Analytics Enhancement</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">40-60% ROI</div>
              <div className="text-blue-200">Expected Return</div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            {['dashboard', 'analytics', 'earnings', 'recommendations'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'earnings' ? 'Earnings Calls' : tab}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Content Summarization</h3>
                <p className="text-gray-600">AI-powered document analysis and summarization</p>
                <div className="mt-4 text-3xl font-bold text-green-600">2,847</div>
                <p className="text-sm text-gray-500">Documents processed</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Market Sentiment</h3>
                <p className="text-gray-600">Real-time sentiment analysis from multiple sources</p>
                <div className="mt-4 text-3xl font-bold text-blue-600">87%</div>
                <p className="text-sm text-gray-500">Accuracy rate</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Automated Analytics</h3>
                <p className="text-gray-600">Machine learning-driven insights and predictions</p>
                <div className="mt-4 text-3xl font-bold text-purple-600">156</div>
                <p className="text-sm text-gray-500">Active models</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Key Business Value</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Operational Efficiency</h4>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Increases accuracy and speed of market predictions</li>
                    <li>• Reduces operational costs through automation</li>
                    <li>• Boosts research analyst productivity</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Strategic Benefits</h4>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Empowers more informed investment decisions</li>
                    <li>• Accelerates decision-making processes</li>
                    <li>• Enhances competitive advantage</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Market Sentiment Analysis</h3>
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{mockData.sentiment.positive}%</div>
                  <div className="text-green-700">Positive</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">{mockData.sentiment.neutral}%</div>
                  <div className="text-gray-700">Neutral</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{mockData.sentiment.negative}%</div>
                  <div className="text-red-700">Negative</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Advanced Capabilities</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  'Earnings call transcription',
                  'Risk assessment',
                  'Investment recommendations',
                  'Workflow automation',
                  'Predictive modeling',
                  'Real-time monitoring'
                ].map((capability, index) => (
                  <div key={index} className="flex items-center p-3 bg-blue-50 rounded-lg">
                    <div className="w-3 h-3 bg-blue-600 rounded-full mr-3"></div>
                    <span className="text-gray-800">{capability}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold">Recent Earnings Call Analysis</h3>
              <p className="text-gray-600 mt-2">AI-generated summaries and sentiment analysis</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quarter</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sentiment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {mockData.earnings.map((earning, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{earning.company}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{earning.quarter}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          earning.sentiment === 'Positive' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {earning.sentiment}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          earning.risk === 'Low' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {earning.risk}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">AI Investment Recommendations</h3>
              <p className="text-gray-600 mb-6">Generated based on comprehensive analysis of market data, earnings calls, and sentiment</p>
              <div className="space-y-4">
                {mockData.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="font-semibold text-lg">{rec.stock}</div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        rec.action === 'BUY' ? 'bg-green-100 text-green-800' :
                        rec.action === 'HOLD' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {rec.action}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{rec.target}</div>
                      <div className="text-sm text-gray-500">Confidence: {rec.confidence}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Time to Value: 6-12 months</h4>
              <p className="text-blue-700">This AI-driven financial research platform can be implemented and delivering value within 6-12 months, with immediate improvements in research efficiency and decision-making speed.</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">FinanceGPT Analytics Platform Demo</h3>
            <p className="text-gray-400">
              Powered by AI • Generated with api-demogen • Demo ID: demo_1758551444524_yfhubfzrq
            </p>
            <p className="text-gray-400 mt-2">
              Target: Financial Research Analysts & Investment Managers in Financial Services
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}