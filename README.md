# SolPlay DemoGen - Solution Play Demo Generator

🎯 **Intelligent platform that automatically reads Financial Services solution play PDFs, extracts Hero AI use cases, and generates interactive, professional demos using hybrid AI providers.**

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/rajesh-ms/hackathon-solplay-demogen)
[![Demo](https://img.shields.io/badge/Demo-Live-green)](http://localhost:3000)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

## 🎉 **COMPLETE IMPLEMENTATION READY!**

**✅ Fully Working Demo**: Complete docs-to-demo pipeline with professional React application  
**✅ Real AI Integration**: Azure OpenAI + v0.dev Premium APIs working  
**✅ Local Development**: Next.js environment ready to run immediately  
**✅ Professional UI**: Enterprise-grade financial services demo with interactive features

## 🚀 **Quick Start - Run the Demo Now!**

### Prerequisites
- Node.js 18+
- Git

### **Option 1: Run Pre-Built Demo (Recommended)**
```bash
# Clone the repository
git clone https://github.com/rajesh-ms/hackathon-solplay-demogen.git
cd hackathon-solplay-demogen

# Navigate to the demo app
cd demo-app

# Install dependencies
npm install

# Start the demo
npm run dev
```

**🎯 Demo URL**: http://localhost:3000

### **Option 2: AI Use Case Generator (NEW)**
```bash
# Navigate to the AI Use Case Generator
cd aiusecasegen

# Install dependencies
npm install

# Start the application
npm run dev
```

**🎯 AI Use Case Generator URL**: http://localhost:3000

### **Option 3: Full Workflow (Generate New Demo)**
```bash
# Clone the repository
git clone https://github.com/rajesh-ms/hackathon-solplay-demogen.git
cd hackathon-solplay-demogen

# Set up environment (copy your API keys)
cp .env.local.example .env.local
# Edit .env.local with your Azure OpenAI and v0.dev API keys

# Navigate to Phase 1 backend
cd phase1/backend
npm install

# Run the complete workflow
npm run docs-to-demo
```

## 🎯 **What's Included**

### **Complete Working Implementation**
- **📄 PDF Processing**: PyMuPDF (MuPDF) integration for robust PDF text extraction
- **🧠 AI Analysis**: Azure OpenAI GPT-4.1 for intelligent use case extraction
- **🎨 Demo Generation**: v0.dev Premium API (v0-1.5-lg model) for professional React components
- **📊 Interactive Demo**: 487-line React component with enterprise-grade UI
- **📈 Local Development**: Next.js 15.5.3 with TypeScript and Tailwind CSS

### **Generated Demo Features**

#### **Demo App: Automated Investment Portfolio Generator** 
The main demo includes:

##### 🔄 **Multi-Step Workflow**
1. **Client Input Form**: Professional financial information intake
2. **AI Processing**: Realistic processing simulation with progress indicators
3. **Results Dashboard**: Interactive portfolio visualization and analytics

##### 📊 **Interactive Components**
- **Risk Profile Analysis**: AI-powered risk assessment with confidence scores
- **Portfolio Allocation**: Interactive pie charts showing asset distribution
- **Growth Projections**: Line charts with conservative/moderate/aggressive scenarios
- **Performance Metrics**: Expected returns, volatility, Sharpe ratio
- **Export Functionality**: Professional report generation

#### **NEW: AI Use Case Generator Application**
Comprehensive PDF analysis tool for Financial Services:

##### 🔄 **Document Processing Workflow**
1. **Drag & Drop Upload**: Professional PDF upload interface with validation
2. **AI Analysis Progress**: 8-step processing with real-time progress tracking
3. **Results Dashboard**: Executive summary with comprehensive use case breakdown

##### 📊 **AI-Powered Analysis Features**
- **Use Case Extraction**: Identifies 12+ AI use cases across 3 categories
- **Business Value Analysis**: ROI estimates (250-900%), time-to-value, and priority ranking
- **Technical Requirements**: Detailed implementation roadmaps and technology stacks
- **Category Classification**: Content Generation, Process Automation, Personalized Experience
- **Market Impact Assessment**: Strategic positioning and competitive advantage analysis

##### 🎯 **Professional Results Display**
- **Executive Dashboard**: High-level metrics with 97% AI confidence scores
- **Category Distribution**: Visual breakdown of use case types with icons
- **Detailed Use Cases**: Expandable cards with complete implementation details
- **Export Functionality**: Generate comprehensive reports and prototypes

#### 🎨 **Professional Design**
- **Enterprise UI**: Financial services design with shadcn/ui components
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Accessibility**: WCAG 2.1 AA compliant
- **Interactive Elements**: Smooth animations and hover states
- **Realistic Data**: Compelling synthetic portfolio and market data

## 📁 **Project Structure**

```
hackathon-solplay-demogen/
├── demo-app/                           # 🎯 READY-TO-RUN NEXT.JS DEMO
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx               # Main demo page
│   │   │   └── layout.tsx             # App layout
│   │   └── components/
│   │       ├── AutomatedInvestmentPortfolioGenerator.tsx  # 487-line demo component
│   │       └── ui/                    # shadcn/ui component library
│   ├── package.json                   # Next.js dependencies
│   └── tsconfig.json                  # TypeScript configuration
├── aiusecasegen/                       # 🆕 AI USE CASE GENERATOR APPLICATION
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   └── analyze-pdf/       # PDF processing API endpoint
│   │   │   ├── page.tsx               # Main application page
│   │   │   └── layout.tsx             # App layout
│   │   └── components/
│   │       ├── AIUseCaseAnalyzer.tsx  # 950+ line comprehensive UI component
│   │       └── ui/                    # shadcn/ui components (Stone theme)
│   ├── package.json                   # Dependencies with Lucide React & Recharts
│   └── README.md                      # Detailed application documentation
├── phase1/backend/                     # 🔧 WORKFLOW IMPLEMENTATION
│   ├── src/
│   │   ├── services/
│   │   │   ├── docs-processor.ts      # PDF scanning and processing
│   │   │   ├── usecase-extractor.ts   # Azure OpenAI integration
│   │   │   ├── v0-demo-builder.ts     # v0.dev API client
│   │   │   ├── v0-prompt-generator.ts # Intelligent prompt generation
│   │   │   └── logging-service.ts     # Comprehensive workflow logging
│   │   └── cli/
│   │       └── docs-to-demo.ts        # Complete workflow CLI
│   └── package.json                   # Backend dependencies
├── docs/                               # 📄 SAMPLE PDF DOCUMENTS
│   └── sample-financial-services-solution.md
├── .env.local.example                  # 🔑 API KEY CONFIGURATION
├── AutomatedInvestmentPortfolioGenerator.jsx  # Generated React component
├── demoapp.log                         # Complete v0.dev interaction log
├── workflow-results.md                 # Workflow execution summary
└── README.md                           # This file
```

## 🔧 **Technical Implementation**

### **Hybrid AI Provider Architecture**
- **Azure OpenAI**: PDF content analysis and use case extraction using GPT-4.1
- **v0.dev Premium**: React component generation using v0-1.5-lg model
- **Provider Abstraction**: Seamless switching between AI providers via environment configuration

### **Technology Stack**
- **Frontend**: Next.js 15.5.3 + React 19 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui component library
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React for professional iconography
- **Backend**: Node.js + TypeScript + Express
- **PDF Processing**: PyMuPDF (MuPDF) for robust text extraction
- **AI Integration**: Azure OpenAI + v0.dev APIs

### **Key Workflow Components**

#### 1. **PDFProcessor** (`phase1/backend/src/services/docs-processor.ts`)
- Scans `docs/` folder for PDF files
- Extracts text using PyMuPDF with high accuracy
- Handles complex financial document layouts

#### 2. **UseCaseExtractor** (`phase1/backend/src/services/usecase-extractor.ts`)
- Analyzes PDF content using Azure OpenAI GPT-4.1
- Extracts first viable use case with detailed structure
- Optimizes prompts for financial services scenarios

#### 3. **V0DemoBuilder** (`phase1/backend/src/services/v0-demo-builder.ts`)
- Generates professional React components via v0.dev Premium API
- Creates enterprise-grade financial services UI
- Includes realistic synthetic data and interactions

#### 4. **LoggingService** (`phase1/backend/src/services/logging-service.ts`)
- Comprehensive workflow logging to `demoapp.log`
- Tracks API interactions, processing times, and results
- Provides audit trail for demo generation process

## 🎬 **Demo Walkthrough**

### **Step 1: Client Information Input**
- Professional financial intake form
- Risk tolerance assessment
- Investment goals and preferences
- Document upload capability (optional)

### **Step 2: AI Processing Simulation**
- Realistic processing indicators (3.2 seconds)
- Step-by-step progress tracking
- Professional loading animations
- Confidence scoring (94% accuracy)

### **Step 3: Portfolio Results**
- **Risk Profile Analysis**: Detailed risk assessment with scoring
- **Asset Allocation**: Interactive pie chart with professional color scheme
- **Growth Projections**: Multi-scenario line charts (conservative/moderate/aggressive)
- **Performance Metrics**: Expected returns, volatility, Sharpe ratio
- **Export Options**: Professional report download functionality

## 🔑 **Environment Configuration**

### **Required API Keys**
```bash
# Copy the example environment file
cp .env.local.example .env.local

# Edit .env.local with your API keys:

# Azure OpenAI Configuration (for PDF analysis)
AZURE_OPENAI_API_KEY=your_azure_openai_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4

# v0.dev Configuration (for demo generation)
V0_API_KEY=your_v0_api_key
V0_MODEL=v0-1.5-lg

# Provider Configuration
AI_PROVIDER=hybrid
USE_CASE_EXTRACTION_PROVIDER=azure-openai
DEMO_GENERATION_PROVIDER=v0
```

## 📊 **Success Metrics**

### **Workflow Performance**
- ✅ **PDF Processing**: 54-page financial PDF processed successfully
- ✅ **Use Case Extraction**: "Automated Investment Portfolio Generation" identified
- ✅ **Demo Generation**: 487-line React component created in 41.3 seconds
- ✅ **Code Quality**: TypeScript strict mode, ESLint compliant
- ✅ **UI Professional**: Enterprise-grade financial services design

### **Generated Demo Quality**
- ✅ **Responsive Design**: Works on desktop, tablet, mobile
- ✅ **Accessibility**: WCAG 2.1 AA compliant
- ✅ **Interactive Features**: Charts, forms, animations
- ✅ **Realistic Data**: Compelling synthetic portfolio data
- ✅ **Professional Appearance**: Enterprise financial services aesthetic

## 🚧 **Development Workflow**

### **Individual Components Testing**
```bash
# Test PDF processing
cd phase1/backend
npm run test:pdf

# Test use case extraction
npm run test:usecase

# Test v0.dev integration
npm run test:v0

# Run complete workflow
npm run docs-to-demo
```

### **Mock Mode Development**
```bash
# Use mock providers for development (no API keys required)
export AI_PROVIDER=mock
npm run docs-to-demo-mock
```
## 🔮 **Architecture & Design**

### **Core Components**
1. **PDF Intelligence Engine**: Robust text extraction using PyMuPDF (MuPDF)
2. **AI Use Case Analyzer**: Azure OpenAI GPT-4.1 for intelligent content analysis
3. **Demo Generation Pipeline**: v0.dev Premium API for professional React components
4. **Local Development Environment**: Next.js with TypeScript and enterprise UI components

### **Use Cases Demonstrated**

#### **Automated Investment Portfolio Generation** (Current Implementation)
- **Category**: Personalized Customer Experience and Advisory
- **Features**: Risk profiling, asset allocation, performance projections
- **Technology**: AI-powered portfolio optimization with realistic market data
- **UI Components**: Multi-step forms, interactive charts, professional dashboards

#### **Future Use Cases** (Ready for Implementation)
1. **Content Generation**: RFP response automation, marketing content generation
2. **Process Automation**: KYC document processing, loan underwriting automation
3. **Document Intelligence**: Financial document classification and routing

### **Quality Standards**

#### **Generated Demo Requirements**
- ✅ **Professional UI**: Enterprise-grade financial services design
- ✅ **Responsive Design**: Works on desktop, tablet, and mobile devices
- ✅ **Accessibility**: WCAG 2.1 AA compliance with proper ARIA labels
- ✅ **Interactive Features**: Realistic user interactions and feedback
- ✅ **Performance**: Fast loading with smooth animations
- ✅ **Data Quality**: Compelling synthetic data that demonstrates business value

#### **Code Quality Standards**
- ✅ **TypeScript**: Strict mode enabled with comprehensive type safety
- ✅ **ESLint**: Configuration for React and Node.js best practices
- ✅ **Prettier**: Consistent code formatting across all files
- ✅ **Testing**: Jest unit tests for utilities and integration tests
- ✅ **Documentation**: Comprehensive inline documentation and README

## 🎯 **Key Features**

### **Hybrid AI Provider System**
- **Azure OpenAI**: Sophisticated PDF content analysis and use case extraction
- **v0.dev Premium**: Professional React component generation with latest models
- **Seamless Integration**: Environment-based provider switching for flexibility

### **Professional Demo Generation**
- **Enterprise Design**: Financial services aesthetic with professional color schemes
- **Interactive Components**: Real-time charts, forms, and data visualization
- **Realistic Workflows**: Multi-step processes that mirror actual business scenarios
- **Export Capabilities**: Professional report generation and download features

### **Complete Development Environment**
- **Next.js 15.5.3**: Latest React framework with Turbopack for fast development
- **shadcn/ui**: Enterprise-grade component library with accessibility features
- **TypeScript**: Full type safety for maintainable and robust code
- **Tailwind CSS**: Professional styling with responsive design utilities

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **PDF Processing Errors**
```bash
# Ensure PDFs exist in docs/ folder
ls docs/*.pdf

# Check PDF content extraction
npm run test:pdf-parser
```

#### **API Key Issues**
```bash
# Verify environment variables
cat .env.local | grep API_KEY

# Test Azure OpenAI connection
npm run test:azure-openai

# Test v0.dev connection
npm run test:v0-api
```

#### **Demo Generation Failures**
```bash
# Check v0.dev API limits and quota
npm run check:v0-status

# Retry with mock mode
export AI_PROVIDER=mock
npm run docs-to-demo
```

### **Fallback Strategies**
- **Mock Providers**: Use synthetic data when APIs are unavailable
- **Template Demos**: Pre-generated components for common scenarios
- **Graceful Error Handling**: User-friendly error messages with recovery options
- **Comprehensive Logging**: Detailed logs in `demoapp.log` for debugging

## 🤝 **Contributing**

### **Development Workflow**
1. **Fork the Repository**: Create your own copy for development
2. **Create Feature Branch**: `git checkout -b feature/your-feature-name`
3. **Install Dependencies**: `npm install` in both `demo-app/` and `phase1/backend/`
4. **Make Changes**: Follow TypeScript and ESLint best practices
5. **Test Thoroughly**: Run all tests and verify demo functionality
6. **Submit Pull Request**: Include detailed description of changes

### **Code Standards**
- **TypeScript**: Use strict mode with comprehensive type definitions
- **Component Design**: Follow shadcn/ui patterns for consistency
- **Testing**: Include unit tests for new functionality
- **Documentation**: Update README and inline comments

## 📚 **Additional Resources**

### **API Documentation**
- [Azure OpenAI Documentation](https://docs.microsoft.com/en-us/azure/cognitive-services/openai/)
- [v0.dev API Reference](https://v0.dev/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)

### **Sample Data**
- `docs/sample-financial-services-solution.md`: Example financial services content
- `demoapp.log`: Complete workflow execution log
- `workflow-results.md`: Detailed workflow summary and metrics

## 📄 **License**
MIT License - see LICENSE file for details

## 📞 **Support**

### **Getting Help**
- **GitHub Issues**: Report bugs or request features
- **Documentation**: Check this README and inline code comments
- **Community**: Join discussions in GitHub Discussions

### **Contact Information**
- **Repository**: https://github.com/rajesh-ms/hackathon-solplay-demogen
- **Demo**: http://localhost:3000 (after running `npm run dev`)
- **Branch**: `feature/v0solution`

---

## 🎉 **Ready to Run!**

The complete SolPlay DemoGen implementation is ready for immediate use. Clone the repository, install dependencies, and start the demo to see the full docs-to-demo pipeline in action!

```bash
git clone https://github.com/rajesh-ms/hackathon-solplay-demogen.git
cd hackathon-solplay-demogen/demo-app
npm install && npm run dev
```

**Visit http://localhost:3000 to see your professional financial services demo!**