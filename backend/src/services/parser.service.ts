import mammoth from 'mammoth';
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { cleanVietnameseText } from '../utils/vietnamese';
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

export class ParserService {
  /**
   * Parse document content from buffer and mimetype
   */
  async parseFromBuffer(buffer: Buffer, mimetype: string): Promise<string> {
    if (!buffer || buffer.length === 0) return '';
    let extractedText = '';

    try {
      if (mimetype === 'application/pdf') {
        try {
          const data = await pdfParse(buffer);
          extractedText = data?.text || '';
        } catch (pdfErr: any) {
          console.warn('[ParserService] PDF parsing warning (non-fatal):', pdfErr?.message || pdfErr);
          extractedText = '';
        }
      } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimetype === 'application/msword') {
        const data = await mammoth.extractRawText({ buffer: buffer });
        extractedText = data.value || '';
      } else if (mimetype === 'text/plain') {
        extractedText = buffer.toString('utf-8');
      } else if (mimetype.includes('spreadsheetml') || mimetype.includes('excel') || mimetype === 'text/csv') {
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        extractedText = xlsx.utils.sheet_to_csv(sheet);
      }
    } catch (err: any) {
      console.warn('[ParserService] Error extracting text from buffer:', err?.message || err);
      extractedText = '';
    }

    return cleanVietnameseText(extractedText);
  }

  /**
   * Fetch a document from a URL and parse it
   */
  async parseFromUrl(url: string): Promise<string> {
    if (!url) return '';
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      
      // Attempt to determine type from extension
      let mimetype = 'application/octet-stream';
      if (url.endsWith('.pdf')) mimetype = 'application/pdf';
      else if (url.endsWith('.docx')) mimetype = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else if (url.endsWith('.txt')) mimetype = 'text/plain';

      // If it's docx specifically which we handle well:
      if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
         const data = await mammoth.extractRawText({ buffer: response.data });
         return data.value;
      }
      
      // Fallback
      return await this.parseFromBuffer(response.data, mimetype);
    } catch (error) {
      console.warn(`[ParserService] Failed to fetch and parse from URL: ${url}`, error);
      return '';
    }
  }

  /**
   * Parse a local file given its relative URL/Path in the uploads folder
   */
  async parseFromLocalPath(docUrl: string): Promise<string> {
    if (!docUrl) return '';
    try {
      const fileName = path.basename(docUrl);
      const filePath = path.join(__dirname, '../../uploads', fileName);

      if (fs.existsSync(filePath)) {
        const fileBuffer = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase();
        
        let mimetype = 'application/octet-stream';
        if (ext === '.pdf') mimetype = 'application/pdf';
        else if (ext === '.docx' || ext === '.doc') mimetype = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (ext === '.txt') mimetype = 'text/plain';
        else if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') mimetype = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        return await this.parseFromBuffer(fileBuffer, mimetype);
      }
    } catch (error) {
      console.error(`[ParserService] Failed to parse local file: ${docUrl}`, error);
    }
    return '';
  }
}

export const parserService = new ParserService();
