# Azure OpenAI PDF Use Case Extraction

## Overview

This application now uses Azure OpenAI to extract actual AI use cases from uploaded PDF documents. The system analyzes the PDF content and generates contextually relevant use cases with detailed capabilities and implementation guidance.

## Features

### ✅ **Real PDF Processing**
- Extracts text from PDF files using `pdf-parse`
- Analyzes document content with Azure OpenAI GPT-4
- No mock responses - all data comes from actual PDF analysis

### ✅ **Temperature Control**
- Adjustable AI temperature (0.1 - 1.0) via slider
- Conservative (0.1-0.3): Focus on obvious use cases
- Balanced (0.4-0.7): Mix of practical and innovative ideas  
- Creative (0.8-1.0): Explore innovative AI opportunities

### ✅ **Smart Use Case Extraction**
- Extracts use cases directly mentioned in the PDF
- Categorizes into: Content Generation, Process Automation, Personalized Experience
- Generates detailed capability descriptions
- Provides realistic ROI and implementation timelines

### ✅ **Enhanced UI**
- Tabbed interface for organized use case display
- Temperature slider with real-time feedback
- Professional temperature guidance
- Color-coded capability badges

## Setup Instructions

### 1. Azure OpenAI Configuration

1. **Create Azure OpenAI Resource**:
   - Go to Azure Portal
   - Create a new Azure OpenAI resource
   - Deploy GPT-4 or GPT-35-turbo model

2. **Get Configuration Details**:
   ```
   - API Key: From Azure OpenAI resource keys
   - Endpoint: https://your-resource.openai.azure.com/
   - Deployment Name: Your model deployment name (e.g., "gpt-4")
   ```

3. **Environment Setup**:
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your Azure OpenAI credentials:
   ```env
   AZURE_OPENAI_API_KEY=your_actual_api_key
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
   AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
   AZURE_OPENAI_API_VERSION=2024-02-15-preview
   ```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Application

```bash
npm run dev
```

## How It Works

### PDF Processing Pipeline

1. **File Upload**: User uploads PDF with temperature setting
2. **Text Extraction**: `pdf-parse` extracts text content
3. **AI Analysis**: Azure OpenAI analyzes content for use cases
4. **Structured Response**: Parsed into organized use case data
5. **UI Display**: Rendered in tabbed interface with capabilities

### Temperature Effects

- **Low (0.1-0.3)**: Conservative analysis focusing on explicitly mentioned use cases
- **Medium (0.4-0.7)**: Balanced approach finding both obvious and implied opportunities  
- **High (0.8-1.0)**: Creative exploration discovering innovative AI applications

### Use Case Categories

- **Content Generation**: Document analysis, report writing, content creation
- **Process Automation**: Workflow automation, compliance monitoring, data processing
- **Personalized Experience**: Client insights, recommendation engines, custom services

## API Reference

### POST /api/analyze-pdf

**Request**:
```typescript
FormData {
  file: File,           // PDF file to analyze
  temperature: string   // AI temperature (0.1-1.0)
}
```

**Response**:
```typescript
{
  success: boolean,
  data: {
    fileName: string,
    fileSize: string,
    processingTime: string,
    confidence: string,
    totalUseCases: number,
    useCases: UseCaseStructure[],
    summary: {
      contentGeneration: number,
      processAutomation: number,
      personalizedExperience: number
    }
  }
}
```

## Error Handling

- **Missing Configuration**: Clear error if Azure OpenAI credentials missing
- **PDF Processing Errors**: Handles corrupted or text-light PDFs
- **AI Processing Failures**: Graceful error messages for API issues
- **Validation**: Ensures proper JSON structure from AI responses

## Security Notes

- API keys stored in environment variables
- `.env.local` excluded from git
- No sensitive data logged
- PDF content processed securely

## Development

### Key Files

- `src/app/api/analyze-pdf/route.ts`: Main API endpoint with Azure OpenAI integration
- `src/components/AIUseCaseAnalyzer.tsx`: UI component with temperature slider
- `.env.example`: Template for environment configuration

### Adding New Features

1. Update `UseCaseStructure` interface for new fields
2. Modify Azure OpenAI prompt in `generateUseCaseExtractionPrompt`
3. Update UI components for new data display
4. Test with various PDF types and temperatures

## Troubleshooting

### Common Issues

1. **"Azure OpenAI configuration is missing"**
   - Check `.env.local` file exists
   - Verify all required environment variables set
   - Ensure no extra spaces in values

2. **"PDF contains insufficient text content"**
   - PDF may be image-based (needs OCR)
   - PDF may be corrupted
   - Try different PDF file

3. **AI processing timeouts**
   - Azure OpenAI may be rate limited
   - Check Azure resource quota
   - Verify deployment is active

### Debugging

Enable detailed logging by checking console output for:
- PDF text extraction results
- Azure OpenAI request/response details
- JSON parsing errors
- Temperature effects on responses