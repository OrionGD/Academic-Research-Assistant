import express from 'express';
import multer from 'multer';
import { uploadDocument, getDocuments, getDocumentById, deleteDocument, compareDocuments } from '../controllers/documentController';
import { validateRequest } from '../middleware/validationMiddleware';
import { ComparisonRequestSchema } from '../utils/validationSchemas';

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});

router.post('/upload', upload.single('file'), uploadDocument);
router.get('/', getDocuments);
router.get('/:id', getDocumentById);
router.delete('/:id', deleteDocument);
router.post('/compare', validateRequest(ComparisonRequestSchema), compareDocuments);

export default router;
