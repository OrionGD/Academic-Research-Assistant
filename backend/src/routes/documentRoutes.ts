import express from 'express';
import multer from 'multer';
import {
  uploadDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
  reprocessDocument,
} from '../controllers/documentController';
import { validatePdfFile } from '../middleware/fileValidation';
import { uploadLimiter } from '../middleware/rateLimiter';

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

router.post('/upload', uploadLimiter, upload.single('file'), validatePdfFile, uploadDocument);
router.get('/', getDocuments);
router.get('/:id', getDocumentById);
router.delete('/:id', deleteDocument);
router.post('/:id/reprocess', reprocessDocument);

export default router;
