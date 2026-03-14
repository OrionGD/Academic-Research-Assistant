import pdfParse from 'pdf-parse';
import { logger } from '../utils/logger';

export const extractTextFromPdfBuffer = async (buffer: Buffer): Promise<string> => {
  try {
    const data = await pdfParse(buffer);
    return cleanExtractedText(data.text);
  } catch (error) {
    logger.error('PDF Extraction Error:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

const cleanExtractedText = (text: string): string => {
  // Remove excessive whitespace, normalize newlines, etc.
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};
