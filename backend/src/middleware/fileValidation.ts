import { Request, Response, NextFunction } from 'express';

// Magic bytes for PDF: %PDF → bytes 0x25 0x50 0x44 0x46
const PDF_MAGIC_BYTES = Buffer.from([0x25, 0x50, 0x44, 0x46]);

export const validatePdfFile = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { mimetype, buffer } = req.file;

  // Check MIME type
  if (mimetype !== 'application/pdf') {
    return res.status(400).json({ error: 'Only PDF files are accepted' });
  }

  // Check magic bytes (first 4 bytes must be %PDF)
  if (!buffer || buffer.length < 4) {
    return res.status(400).json({ error: 'File is too small to be a valid PDF' });
  }

  const fileMagic = buffer.subarray(0, 4);
  if (!fileMagic.equals(PDF_MAGIC_BYTES)) {
    return res.status(400).json({ error: 'File content does not match PDF format' });
  }

  // Size limit: 50MB
  const MAX_SIZE = 50 * 1024 * 1024;
  if (buffer.length > MAX_SIZE) {
    return res.status(400).json({ error: 'File size exceeds the 50MB limit' });
  }

  next();
};
