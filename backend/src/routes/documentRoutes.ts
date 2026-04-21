import express from 'express';
import multer from 'multer';
import {
  uploadDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
  reprocessDocument,
  downloadDocument,
  viewDocument,
  streamDocumentContent,
  analyzeDocument,
} from '../controllers/documentController';
import { validatePdfFile } from '../middleware/fileValidation';
import { uploadLimiter } from '../middleware/rateLimiter';
import { usageGate } from '../middleware/usageGate';
import { auditLog } from '../middleware/auditLogger';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// Upload: rate limited + usage metered + audit logged
router.post(
  '/upload',
  uploadLimiter,
  usageGate('upload'),
  upload.single('file'),
  validatePdfFile,
  auditLog('UPLOAD_DOCUMENT', 'document'),
  uploadDocument
);

router.get('/', getDocuments);
router.get('/:id', getDocumentById);
router.get('/:id/view', viewDocument);
router.get('/:id/content', streamDocumentContent);
router.get('/:id/download', downloadDocument);
router.post('/:id/analyze', analyzeDocument);
router.delete('/:id', auditLog('DELETE_DOCUMENT', 'document'), deleteDocument);
router.post('/:id/reprocess', reprocessDocument);

export default router;
