# SolPlay DemoGen - Solution Play Demo Generator

## Overview
Intelligent platform that automatically reads Financial Services solution play PDFs, extracts Hero AI use cases, and generates interactive, demoable solutions using ARIA v4's 8-role AI development team.

## 🚀 Phase 1 - MVP Demo (Current Focus)

**Phase 1 Goal**: Build a working demo for ONE Hero AI use case with synthetic data and local file storage.

**Selected Use Case (Initial)**: **Content Generation - RFP Response Automation**
- Input: Financial Services solution play PDF
- Output: AI-generated RFP response demonstration
- Storage: Local file system (no cloud requirements)
- Security: Synthetic data only (no security focus)

### Quick Start (Phase 1)

#### Prerequisites
- Node.js 18+
- OpenAI API key
- Git

#### Installation & Setup
```bash
git clone https://github.com/rajesh-ms/hackathon-solplay-demogen.git
cd hackathon-solplay-demogen

# Navigate to Phase 1 implementation
cd phase1

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Start the Phase 1 demo
npm run dev
```

#### Running Phase 1 Demo
```bash
# Start backend server (http://localhost:3001)
npm run start:backend

# Open frontend in browser (http://localhost:3000)
# Upload the sample PDF from synthetic-data/ folder
# Watch as the system extracts use cases and generates RFP response demo
```

### Phase 1 Features Demonstrated
- ✅ **PDF Upload & Parsing**: Simple web interface for PDF upload
- ✅ **AI Use Case Extraction**: OpenAI-powered extraction of RFP response capabilities
- ✅ **Demo Generation**: Automatic creation of RFP response demonstrations
- ✅ **Synthetic Data**: Sample solution plays and RFP scenarios
- ✅ **Local Storage**: File system based storage (no cloud dependencies)
 - ✅ **(NEW) Enhanced Market Research & Analytics**: AI agent combines local extracted data with live (or synthetic fallback) web search to produce structured research insights

### Enhanced Market Research & Analytics (New Use Case)
This feature demonstrates an AI research analyst agent that:
1. Loads locally stored extracted solution play or RFP data (previous uploads)
2. Performs an external web search (Bing Web Search API or SerpAPI if keys provided, otherwise synthetic fallback)
3. Synthesizes comparative insights, opportunities, risks, and recommended actions
4. Persists a structured research report JSON for retrieval and further demo usage

#### API Endpoints
POST `/api/market-research/analyze`
Request body:
```json
{
    "topic": "enhanced market research in capital markets",
    "localDataIds": ["<processingId1>", "<processingId2>"],
    "maxWebResults": 5
}
```
Alternative: supply rawLocalData instead of localDataIds:
```json
{
    "topic": "AI driven market surveillance",
    "rawLocalData": [
        { "title": "Internal Capability Deck", "content": "Our platform ingests multi-venue trading feeds..." }
    ]
}
```
Response:
```json
{
    "success": true,
    "report": {
        "id": "uuid",
        "topic": "...",
        "comparativeInsights": ["..."],
        "opportunities": ["..."],
        "risks": ["..."],
        "recommendedActions": ["..."],
        "webFindings": [ { "title": "...", "url": "...", "snippet": "..." } ],
        "meta": { "provider": "bing|serpapi|dummy", "syntheticFallback": false }
    }
}
```

GET `/api/market-research/:id`
Returns the stored research report JSON.

#### Environment Variables
Add to `.env` (optional, improves realism):
```
BING_SEARCH_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
SERPAPI_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-.... (already used by existing AI processor)
```
If no search keys are present, a deterministic synthetic ("dummy") provider returns plausible placeholder findings; if no OpenAI key, a heuristic synthetic insight generator is used.

#### File Output
Reports stored under `phase1/data/market-research/<id>.json` with structure defined by `ResearchReport` interface.

#### Future Enhancements (Not yet implemented)
- Entity-level citation mapping and confidence scoring
- Time-series aggregation of repeated research runs
- Vector store enrichment for improved local contextualization
- Frontend UI to browse & compare reports

### Phase 1 File Structure
```
phase1/
├── backend/                    # Node.js API server
│   ├── src/
│   │   ├── app.ts             # Express server setup
│   │   ├── pdf-parser.ts      # PDF text extraction
│   │   ├── ai-processor.ts    # OpenAI integration
│   │   └── demo-builder.ts    # Demo HTML generation
│   └── package.json
├── frontend/                   # Simple web interface
│   ├── index.html             # Upload and demo UI
│   ├── style.css              # Basic styling
│   └── script.js              # Frontend interactions
├── data/                       # Local file storage
│   ├── uploads/               # Uploaded PDFs
│   ├── extracted/             # Extracted use cases
│   └── demos/                 # Generated demos
└── synthetic-data/             # Sample test data
    ├── sample-solution-play.pdf
    └── sample-rfp.pdf
```

### Demo Workflow
1. **Upload**: Upload sample Financial Services solution play PDF
2. **Process**: AI extracts RFP response automation capabilities
3. **Generate**: System creates synthetic RFP and AI-generated response
4. **Demo**: View side-by-side comparison of manual vs AI approach
5. **(Optional) Research**: Invoke market research agent to generate strategic insights incorporating latest public information

## 🔮 Future Phases (Post Phase 1)

### Phase 2 - Multi-Use Case & Enhanced UI
- Support for all 3 Hero AI use case categories
- Professional React-based interface
- Real-time processing progress
- Demo customization options

### Phase 3 - Enterprise Cloud Platform
- Azure cloud deployment
- Enterprise security & compliance
- Multi-tenant architecture
- Advanced analytics and reporting

## Architecture

### Core Components
1. **PDF Intelligence Engine** - Parses solution play PDFs and extracts use cases
2. **ARIA v4 Integration** - Processes use cases through 8-role AI development team
3. **Demo Generation Pipeline** - Creates interactive web-based demonstrations
4. **Cloud Infrastructure** - Azure-based scalable hosting platform

### Technology Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **AI/ML**: Azure OpenAI + Azure Document Intelligence
- **Database**: Azure Cosmos DB + Redis
- **Storage**: Azure Blob Storage
- **Hosting**: Azure Container Apps

## Use Cases Supported

### 1. Content Generation
- Document/Marketing content generation for various purposes
- RFP response automation leveraging organizational historical knowledge
- Sales-related content generation
- Image generation capabilities

### 2. Process Automation (Intelligent RPA + Document Understanding)
- AI automates repetitive tasks such as loan underwriting
- KYC document processing and compliance checks
- Intelligent document classification and routing

### 3. Personalized Customer Experience and Advisory
- AI-powered personalization engines analyze customer profiles
- Spending habits, savings patterns, and financial goals analysis
- Tailored product recommendations (credit cards with relevant rewards)
- Investment options aligned with risk appetite
- Personalized loan offers

## Project Structure
```
hackathon-solplay-demogen/
├── .github/
│   ├── prompts/aria.prompt.md     # ARIA v4 system prompt
│   └── copilot-instructions.md    # AI agent guidance
├── docs/                          # Solution play documents
├── phase1/                        # Phase 1 MVP implementation (ACTIVE)
│   ├── backend/                   # Node.js API server
│   ├── frontend/                  # Simple web interface
│   ├── data/                      # Local file storage
│   └── synthetic-data/            # Sample test data
├── packages/                      # Full platform packages (Future)
│   ├── frontend/                  # React web application
│   ├── backend/                   # Node.js API services
│   ├── ai-engine/                 # AI processing pipeline
│   └── shared/                    # Shared utilities and types
├── infrastructure/                # Azure infrastructure as code
├── scripts/                       # Build and deployment scripts
├── INSTRUCTIONS.md                # Comprehensive build instructions
└── README.md                      # This file
```

## Development Workflow

### Using ARIA v4
This project uses the ARIA v4 system for development. All requests are processed through:
1. **Scrum Master** - T-shirt sizing and workflow orchestration
2. **Architect** - System design and technical planning
3. **Developer** - Implementation with TDD
4. **UX Designer** - User experience design
5. **Security Engineer** - Security assessment
6. **DevOps Engineer** - Infrastructure and deployment
7. **Tester** - Quality assurance
8. **Product Manager** - Documentation and evangelization

### Contributing
1. Start with Phase 1 to understand the core concept
2. All changes must follow ARIA v4 workflow protocols
3. Use T-shirt sizing (XS/S/M/L/XL) for complexity assessment
4. Follow the appropriate workflow path (shallow/deep)
5. Ensure quality gates are met for the assigned size

## Getting Help

### Phase 1 Support
- Check `phase1/README-Phase1.md` for detailed Phase 1 instructions
- Review synthetic test data in `phase1/synthetic-data/`
- Use the OpenAI API for AI processing (requires API key)

### Full Platform Documentation
- `INSTRUCTIONS.md` - Complete enterprise platform build guide
- `.github/copilot-instructions.md` - AI agent development guidance
- `scripts/aria-cli.js` - ARIA v4 workflow management tool

## License
MIT License - see LICENSE file for details

## Contact
For questions or support, please contact the development team or open an issue on GitHub.
        

    