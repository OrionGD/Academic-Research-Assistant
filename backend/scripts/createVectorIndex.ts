import mongoose from 'mongoose';
import { logger } from '../src/utils/logger';

/**
 * Run this script to output the exact JSON structure required 
 * to deploy the Atlas Vector Search index via the MongoDB Atlas UI.
 */
export const vectorIndexDefinition = {
  name: "vector_index",
  type: "vectorSearch",
  collectionName: "document_chunks",
  fields: [
    {
      type: "vector",
      path: "embedding",
      numDimensions: 768, // Matches Gemini Embedding dimension
      similarity: "cosine" // Optimal for Gemini Embedding 2
    },
    {
      type: "filter",
      path: "userId"
    },
    {
      type: "filter",
      path: "documentId"
    }
  ]
};

const run = () => {
    logger.info("Copy the following JSON and paste it into the MongoDB Atlas Vector Search JSON editor:");
    console.log(JSON.stringify(vectorIndexDefinition, null, 2));
};

if (require.main === module) {
    run();
}
