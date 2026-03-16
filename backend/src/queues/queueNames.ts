/**
 * Centralized queue name constants.
 * Import from here instead of importing worker files in controllers —
 * importing worker files triggers BullMQ Worker instantiation at module load.
 */

export const DOCUMENT_PROCESSING_QUEUE = 'document-processing';
export const DOCUMENT_ANALYSIS_QUEUE = 'document-analysis';
export const VECTOR_INDEXER_QUEUE = 'vector-indexer';
export const METRICS_QUEUE = 'metrics-collector';
