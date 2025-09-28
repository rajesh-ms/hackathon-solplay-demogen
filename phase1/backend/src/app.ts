import express, { type Request, type Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { PDFParser } from './services/pdf-parser';
import { AIProcessor } from './ai-processor';
import { DemoBuilder } from './demo-builder';
import { MarketResearchAgent } from './market-research-agent';
import fsExtra from 'fs/promises';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../frontend')));

// File upload configuration
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../data/uploads'),
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req: Request, file: Express.Multer.File, cb: (error: Error | null, acceptFile?: boolean) => void) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Initialize services
const pdfParser = new PDFParser();
const aiProcessor = new AIProcessor();
const demoBuilder = new DemoBuilder();
const marketResearchAgent = new MarketResearchAgent(path.join(__dirname, '../../data'));

// Processing status tracking
const processingStatus = new Map<string, {
  status: 'uploading' | 'parsing' | 'extracting' | 'generating' | 'completed' | 'error';
  progress: number;
  message: string;
  result?: any;
  error?: string;
}>();

// Routes

// Upload PDF file
app.post('/api/upload', upload.single('pdf'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const processingId = uuidv4();
    const filePath = req.file.path;
    
    // Initialize processing status
    processingStatus.set(processingId, {
      status: 'uploading',
      progress: 10,
      message: 'PDF uploaded successfully'
    });

    // Start async processing
    processDocument(processingId, filePath, req.file.originalname);

    res.json({
      processingId,
      message: 'PDF uploaded and processing started',
      filename: req.file.originalname
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Check processing status
app.get('/api/status/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const status = processingStatus.get(id);
  
  if (!status) {
    return res.status(404).json({ error: 'Processing ID not found' });
  }
  
  res.json(status);
});

// Get generated demo
app.get('/api/demos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const demoPath = path.join(__dirname, '../../data/demos', `${id}.html`);
    
    const demoExists = await fs.access(demoPath).then(() => true).catch(() => false);
    if (!demoExists) {
      return res.status(404).json({ error: 'Demo not found' });
    }
    
    const demoContent = await fs.readFile(demoPath, 'utf8');
    res.setHeader('Content-Type', 'text/html');
    res.send(demoContent);
    
  } catch (error) {
    console.error('Demo retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve demo' });
  }
});

// Enhanced Market Research & Analytics endpoint
app.post('/api/market-research/analyze', async (req: Request, res: Response) => {
  try {
    const { topic, localDataIds, rawLocalData, maxWebResults } = req.body || {};
    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'Missing required field: topic' });
    }
    const report = await marketResearchAgent.run({ topic, localDataIds, rawLocalData, maxWebResults });
    res.json({ success: true, report });
  } catch (error) {
    console.error('Market research error:', error);
    res.status(500).json({ error: 'Failed to generate market research report' });
  }
});

// Retrieve stored research report
app.get('/api/market-research/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const filePath = path.join(__dirname, '../../data/market-research', `${id}.json`);
    const exists = await fs.access(filePath).then(()=>true).catch(()=>false);
    if (!exists) return res.status(404).json({ error: 'Report not found' });
    const content = await fsExtra.readFile(filePath, 'utf8');
    res.json(JSON.parse(content));
  } catch (error) {
    console.error('Retrieve report error:', error);
    res.status(500).json({ error: 'Failed to retrieve report' });
  }
});

// Serve frontend
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

// Async document processing function
async function processDocument(processingId: string, filePath: string, originalName: string) {
  try {
    // Step 1: Parse PDF
    processingStatus.set(processingId, {
      status: 'parsing',
      progress: 25,
      message: 'Extracting text from PDF...'
    });

    const pdfContent = await pdfParser.extractText(filePath);
    
    // Step 2: Extract use cases using AI
    processingStatus.set(processingId, {
      status: 'extracting',
      progress: 50,
      message: 'Analyzing content for RFP response capabilities...'
    });

    const extractedUseCases = await aiProcessor.extractRFPUseCases(pdfContent);
    
    // Save extracted data
    const extractedPath = path.join(__dirname, '../../data/extracted', `${processingId}.json`);
    await fs.writeFile(extractedPath, JSON.stringify({
      processingId,
      originalName,
      extractedAt: new Date().toISOString(),
      pdfContent: pdfContent.substring(0, 1000) + '...', // Truncated for storage
      useCases: extractedUseCases
    }, null, 2));

    // Step 3: Generate demo
    processingStatus.set(processingId, {
      status: 'generating',
      progress: 75,
      message: 'Generating RFP response demo...'
    });

    const demoHtml = await demoBuilder.buildRFPDemo(extractedUseCases, originalName);
    
    // Save demo
    const demoPath = path.join(__dirname, '../../data/demos', `${processingId}.html`);
    await fs.writeFile(demoPath, demoHtml);

    // Complete processing
    processingStatus.set(processingId, {
      status: 'completed',
      progress: 100,
      message: 'RFP response demo generated successfully!',
      result: {
        demoUrl: `/api/demos/${processingId}`,
        useCases: extractedUseCases,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Processing error:', error);
    processingStatus.set(processingId, {
      status: 'error',
      progress: 0,
      message: 'Processing failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

app.listen(port, () => {
  console.log(`🚀 SolPlay Phase 1 Demo Server running at http://localhost:${port}`);
  console.log(`📁 Data directory: ${path.join(__dirname, '../../data')}`);
});

export default app;