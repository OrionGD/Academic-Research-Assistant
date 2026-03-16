import { extractTextFromPdfBuffer } from '../services/pdfExtractor';
import { chunkText } from '../services/textChunker';
import { generateEmbedding } from '../services/embeddingService';
import { DocumentChunk } from '../models/DocumentChunk';
import { DocumentModel } from '../models/Document';
import { downloadFileToBuffer } from '../services/storageService';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const runDocumentProcessingPipeline = async (
  documentId: string,
  userId: string,
  storagePath: string
) => {
  try {
    if (!mongoose.isValidObjectId(documentId) || !mongoose.isValidObjectId(userId)) {
      throw new Error('Invalid ObjectId provided');
    }
    const docObjId = new mongoose.Types.ObjectId(documentId);
    const userObjId = new mongoose.Types.ObjectId(userId);
    
    // Update status
    await DocumentModel.findByIdAndUpdate(docObjId, { status: 'processing' });
    const pdfBuffer = await downloadFileToBuffer(storagePath);
    const fullText = await extractTextFromPdfBuffer(pdfBuffer);
    
    // Step 4: Split text into semantic chunks
    const chunks = await chunkText(fullText, 700, 150);
    
    logger.info(`Generated ${chunks.length} chunks for document ${documentId}`);

    // Step 5 & 6: Generate embeddings and store chunks
    const chunkDocs = [];
    for (let i = 0; i < chunks.length; i++) {
        const text = chunks[i];
        
        // Minor delay to prevent rate limits on large docs, if using APIs
        // await new Promise(r => setTimeout(r, 100));
        
        const embedding = await generateEmbedding(text);
        
        chunkDocs.push({
            documentId: docObjId,
            userId: userObjId,
            chunkIndex: i,
            chunkText: text,
            embedding,
            metadata: { contentLength: text.length }
        });
    }

    // Insert all chunks to MongoDB
    await DocumentChunk.insertMany(chunkDocs);
    
    // Document is successfully processed regarding embeddings
    // In actual implementation, we'll trigger the AI analysis pipeline using background jobs (BullMQ).
    // The status stays 'processing' until the analysis finishes if they run synchronously.
    
    logger.info(`Successfully stored embeddings for document ${documentId}`);

    return { success: true, chunksCount: chunks.length, textBuffer: fullText };

  } catch (error: any) {
    logger.error(`Error in document processing pipeline for doc ${documentId}:`, error);
    await DocumentModel.findByIdAndUpdate(documentId, { 
        status: 'failed', 
        errorMessage: error.message || 'Unknown processing error' 
    });
    throw error;
  }
};
