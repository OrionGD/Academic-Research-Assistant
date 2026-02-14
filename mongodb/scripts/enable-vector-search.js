// Enable Vector Search in MongoDB Atlas
// This script enables vector search capabilities for the ARAS platform

// Switch to ARAS database
db = db.getSiblingDB("aras");

// Create vector search index on documents collection
db.runCommand({
    createIndexes: "documents",
    indexes: [
        {
            name: "vector_search_index",
            key: {
                "embedding": "vector"
            },
            vectorSearchOptions: {
                dimensions: 1536, // OpenAI embedding dimensions
                similarity: "cosine" // cosine, euclidean, or dotProduct
            }
        }
    ]
});

print("Vector search index created on documents collection");

// Create vector search index for product embeddings
db.createCollection("embeddings");
db.runCommand({
    createIndexes: "embeddings",
    indexes: [
        {
            name: "embedding_vector_index",
            key: {
                "vector": "vector"
            },
            vectorSearchOptions: {
                dimensions: 1536,
                similarity: "cosine"
            }
        },
        {
            name: "content_type_index",
            key: {
                "contentType": 1
            }
        }
    ]
});

print("Vector search index created on embeddings collection");

// Create vector search configuration
db.createCollection("vector_search_config");
db.vector_search_config.insertOne({
    name: "default_config",
    enabled: true,
    dimensions: 1536,
    similarity: "cosine",
    collections: ["documents", "embeddings"],
    created: new Date(),
    updated: new Date()
});

print("Vector search configuration created");

// Enable vector search monitoring
db.createCollection("vector_search_metrics");
db.vector_search_metrics.createIndex({ "timestamp": -1 });
db.vector_search_metrics.createIndex({ "collection": 1 });

print("Vector search monitoring enabled");

// Verify vector search is enabled
const vectorIndexes = db.documents.getIndexes().filter(idx => idx.vectorSearchOptions);
print(`Vector search indexes found: ${vectorIndexes.length}`);

if (vectorIndexes.length > 0) {
    print("Vector search is enabled and ready to use");
} else {
    print("Warning: Vector search may not be properly configured");
}

print("Vector search initialization completed");