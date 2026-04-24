const crypto = require('crypto');

function uuidv4() {
  return crypto.randomUUID();
}

// Simple in-memory vector store for MVP
class VectorStore {
  constructor() {
    this.documents = [];
    this.initialized = true;
  }

  async initialize() {
    console.log('In-memory vector store initialized');
    return true;
  }

  async addDocuments(chunks, embeddings, metadata) {
    const ids = chunks.map(() => uuidv4());
    
    chunks.forEach((chunk, index) => {
      this.documents.push({
        id: ids[index],
        document: chunk,
        embedding: embeddings[index],
        metadata: metadata[index]
      });
    });

    console.log(`Added ${chunks.length} chunks to vector store`);
    return ids;
  }

  // Cosine similarity
  cosineSimilarity(a, b) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async query(queryEmbedding, nResults = 5) {
    if (this.documents.length === 0) {
      return { documents: [], metadatas: [], distances: [] };
    }

    // Calculate similarities
    const results = this.documents.map(doc => ({
      ...doc,
      similarity: this.cosineSimilarity(queryEmbedding, doc.embedding)
    }));

    // Sort by similarity (descending)
    results.sort((a, b) => b.similarity - a.similarity);

    // Take top N
    const topResults = results.slice(0, nResults);

    return {
      documents: topResults.map(r => r.document),
      metadatas: topResults.map(r => r.metadata),
      distances: topResults.map(r => 1 - r.similarity) // Convert similarity to distance
    };
  }

  async deleteByDocumentId(documentId) {
    const initialLength = this.documents.length;
    this.documents = this.documents.filter(doc => doc.metadata.document_id !== documentId);
    const deletedCount = initialLength - this.documents.length;
    console.log(`Deleted ${deletedCount} chunks for document ${documentId}`);
    return deletedCount;
  }

  async listDocuments() {
    const documentsMap = new Map();
    
    this.documents.forEach(doc => {
      const meta = doc.metadata;
      if (meta.document_id && !documentsMap.has(meta.document_id)) {
        documentsMap.set(meta.document_id, {
          documentId: meta.document_id,
          policyName: meta.policy_name,
          insurer: meta.insurer,
          filename: meta.filename,
          uploadDate: meta.upload_date
        });
      }
    });

    return Array.from(documentsMap.values());
  }
}

// Singleton instance
const vectorStore = new VectorStore();

module.exports = vectorStore;
