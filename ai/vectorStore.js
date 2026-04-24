const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

const STORAGE_DIR = path.join(__dirname, '..', 'uploads');
const STORE_FILE = path.join(STORAGE_DIR, 'vectorStore.json');

function uuidv4() {
  return crypto.randomUUID();
}

// File-backed vector store for Render persistence
class VectorStore {
  constructor() {
    this.documents = [];
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return true;
    try {
      await fs.mkdir(STORAGE_DIR, { recursive: true });
      try {
        const data = await fs.readFile(STORE_FILE, 'utf8');
        this.documents = JSON.parse(data);
        console.log(`Loaded ${this.documents.length} chunks from disk.`);
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
        console.log('No existing vector store found on disk, starting fresh.');
      }
      this.initialized = true;
      return true;
    } catch (err) {
      console.error('Failed to initialize vector store:', err);
      return false;
    }
  }

  async _saveStore() {
    try {
      await fs.writeFile(STORE_FILE, JSON.stringify(this.documents), 'utf8');
    } catch (err) {
      console.error('Failed to save vector store to disk:', err);
    }
  }

  async addDocuments(chunks, embeddings, metadata) {
    await this.initialize();
    const ids = chunks.map(() => uuidv4());
    
    chunks.forEach((chunk, index) => {
      this.documents.push({
        id: ids[index],
        document: chunk,
        embedding: embeddings[index],
        metadata: metadata[index]
      });
    });

    await this._saveStore();
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
    await this.initialize();
    
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
    await this.initialize();
    const initialLength = this.documents.length;
    this.documents = this.documents.filter(doc => doc.metadata.document_id !== documentId);
    
    await this._saveStore();
    const deletedCount = initialLength - this.documents.length;
    console.log(`Deleted ${deletedCount} chunks for document ${documentId}`);
    return deletedCount;
  }

  async listDocuments() {
    await this.initialize();
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
