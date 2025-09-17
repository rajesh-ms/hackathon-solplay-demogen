import * as fs from 'fs/promises';
import * as path from 'path';
import { LoggingService } from './logging-service';

export interface PDFFile {
  fileName: string;
  filePath: string;
  size: number;
  lastModified: Date;
}

export class DocsProcessor {
  private logger: LoggingService;
  private docsPath: string;

  constructor(docsPath?: string) {
    this.logger = LoggingService.getInstance();
    this.docsPath = docsPath || path.join(process.cwd(), 'docs');
  }

  /**
   * Scans the docs folder and returns all PDF files found
   */
  async scanDocsFolder(): Promise<PDFFile[]> {
    try {
      this.logger.info('Scanning docs folder for PDF files', { docsPath: this.docsPath });
      
      // Check if docs folder exists
      try {
        await fs.access(this.docsPath);
      } catch (error) {
        throw new Error(`Docs folder not found: ${this.docsPath}`);
      }

      const files = await fs.readdir(this.docsPath, { withFileTypes: true });
      const pdfFiles: PDFFile[] = [];

      for (const file of files) {
        if (file.isFile() && file.name.toLowerCase().endsWith('.pdf')) {
          const filePath = path.join(this.docsPath, file.name);
          const stats = await fs.stat(filePath);
          
          pdfFiles.push({
            fileName: file.name,
            filePath,
            size: stats.size,
            lastModified: stats.mtime
          });
        }
      }

      // Sort by filename alphabetically to ensure consistent "first" PDF selection
      pdfFiles.sort((a, b) => a.fileName.localeCompare(b.fileName));

      this.logger.info('PDF scan completed', { 
        totalFiles: pdfFiles.length,
        files: pdfFiles.map(f => ({ name: f.fileName, size: f.size }))
      });

      return pdfFiles;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Error scanning docs folder', { error: errorMessage, docsPath: this.docsPath });
      throw error;
    }
  }

  /**
   * Gets the first PDF file from the docs folder
   */
  async getFirstPDF(): Promise<PDFFile | null> {
    const pdfFiles = await this.scanDocsFolder();
    
    if (pdfFiles.length === 0) {
      this.logger.warn('No PDF files found in docs folder', { docsPath: this.docsPath });
      return null;
    }

    const firstPDF = pdfFiles[0];
    this.logger.info('Selected first PDF for processing', { 
      fileName: firstPDF.fileName,
      filePath: firstPDF.filePath,
      size: firstPDF.size
    });

    return firstPDF;
  }

  /**
   * Validates if a PDF file is suitable for processing
   */
  async validatePDF(pdfFile: PDFFile): Promise<boolean> {
    try {
      // Check file size (limit from environment or default 10MB)
      const maxSizeMB = parseInt(process.env.MAX_PDF_SIZE_MB || '10');
      const maxSizeBytes = maxSizeMB * 1024 * 1024;

      if (pdfFile.size > maxSizeBytes) {
        this.logger.warn('PDF file too large', { 
          fileName: pdfFile.fileName,
          size: pdfFile.size,
          maxSize: maxSizeBytes
        });
        return false;
      }

      // Check if file still exists and is readable
      await fs.access(pdfFile.filePath, fs.constants.R_OK);

      this.logger.info('PDF validation successful', { fileName: pdfFile.fileName });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('PDF validation failed', { 
        fileName: pdfFile.fileName,
        error: errorMessage
      });
      return false;
    }
  }
}