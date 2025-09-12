import pdf from 'pdf-parse';
import fs from 'fs/promises';

export class PDFParser {
  async extractText(filePath: string): Promise<string> {
    try {
      const pdfBuffer = await fs.readFile(filePath);
      const data = await pdf(pdfBuffer);
      
      // Basic text cleaning
      let text = data.text;
      text = text.replace(/\s+/g, ' '); // Normalize whitespace
      text = text.replace(/[^\w\s.,!?;:()\-]/g, ''); // Remove special chars
      
      console.log(`📄 Extracted ${text.length} characters from PDF`);
      console.log(`📊 Preview: ${text.substring(0, 200)}...`);
      
      return text;
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Extract metadata from PDF
  async extractMetadata(filePath: string): Promise<any> {
    try {
      const pdfBuffer = await fs.readFile(filePath);
      const data = await pdf(pdfBuffer);
      
      return {
        pages: data.numpages,
        title: data.info?.Title || 'Unknown',
        author: data.info?.Author || 'Unknown',
        subject: data.info?.Subject || '',
        creator: data.info?.Creator || '',
        producer: data.info?.Producer || '',
        creationDate: data.info?.CreationDate || null,
        modificationDate: data.info?.ModDate || null
      };
    } catch (error) {
      console.error('PDF metadata extraction error:', error);
      return {};
    }
  }
}