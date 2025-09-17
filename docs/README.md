# Financial Services Solution Play Documents

## Instructions

This folder should contain PDF files of Financial Services solution plays that will be automatically processed by the SolPlay DemoGen system.

### How to Use

1. **Add PDF Files**: Place your Financial Services solution play PDF files in this folder
2. **Run the Workflow**: Execute `npm run generate-demo-from-docs` from the `phase1/backend` directory
3. **System Behavior**: The system will automatically:
   - Scan this folder for PDF files
   - Select the first PDF alphabetically
   - Extract the first viable use case
   - Generate a professional React demo

### Sample Content

We've included `sample-financial-services-solution.md` as an example of the type of content that should be in your PDF files. For the actual workflow, you need to:

1. Convert this markdown to PDF, or
2. Add your own Financial Services solution play PDFs, or
3. Use mock mode for testing: `npm run generate-demo-mock`

### Expected PDF Content Structure

Your PDF files should contain:
- **Executive Summary**: Overview of the AI solution
- **Use Cases**: Specific business scenarios with:
  - Business problem description
  - Solution overview
  - Key AI capabilities (4-6 specific features)
  - User journey (5-7 steps)
  - Success metrics
  - Demo requirements (UI components, interactions)
  - Sample data (inputs and outputs)

### Mock Mode

If you don't have PDF files yet, you can test the system in mock mode:

```bash
cd phase1/backend
npm run generate-demo-mock
```

This will simulate the entire workflow without requiring actual PDF files or API keys.

### Workflow Output

After processing, you'll find:
- **Application logs**: `logs/application.log`
- **V0 interactions**: `demoapp.log` (contains all prompts sent to v0.dev)
- **Generated demo**: React component code and metadata

### Supported Formats

- **PDF files only** (`.pdf` extension)
- **Maximum file size**: 10MB (configurable via `MAX_PDF_SIZE_MB` environment variable)
- **Content**: Should be text-based (not image-only PDFs)

### Next Steps

1. Add your PDF files to this folder
2. Configure your `.env.local` with API keys
3. Run the workflow: `npm run generate-demo-from-docs`
4. Check the generated demos and logs