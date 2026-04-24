const fs = require('fs').promises;
const path = require('path');
const pdf = require('pdf-parse');
const crypto = require('crypto');
const chunkingService = require('../ai/chunking');

function uuidv4() {
  return crypto.randomUUID();
}
const embeddingService = require('../ai/embeddings');
const vectorStore = require('../ai/vectorStore');

class DocumentService {
  async processDocument(filePath, filename, policyName, insurer) {
    try {
      // Extract text based on file type
      const ext = path.extname(filename).toLowerCase();
      let text = '';

      if (ext === '.pdf') {
        const dataBuffer = await fs.readFile(filePath);
        const pdfData = await pdf(dataBuffer);
        text = pdfData.text;
      } else if (ext === '.txt') {
        text = await fs.readFile(filePath, 'utf-8');
      } else if (ext === '.json') {
        const jsonData = await fs.readFile(filePath, 'utf-8');
        const parsed = JSON.parse(jsonData);
        text = JSON.stringify(parsed, null, 2);
      }

      if (!text || text.trim().length === 0) {
        throw new Error('No text content extracted from document');
      }

      // Chunk the text
      const chunks = chunkingService.chunkText(text);
      console.log(`Created ${chunks.length} chunks from document`);

      // Generate embeddings
      const embeddings = await embeddingService.generateEmbeddings(chunks);

      // Create metadata for each chunk
      const documentId = uuidv4();
      const metadata = chunks.map((chunk, index) => ({
        document_id: documentId,
        policy_name: policyName,
        insurer: insurer,
        filename: filename,
        chunk_index: index,
        upload_date: new Date().toISOString()
      }));

      // Store in vector database
      await vectorStore.addDocuments(chunks, embeddings, metadata);

      return {
        documentId,
        policyName,
        insurer,
        filename,
        chunksCreated: chunks.length,
        uploadDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error processing document:', error);
      throw error;
    }
  }

  async listDocuments() {
    return await vectorStore.listDocuments();
  }

  async deleteDocument(documentId) {
    const deletedCount = await vectorStore.deleteByDocumentId(documentId);
    
    if (deletedCount === 0) {
      throw new Error('Document not found');
    }

    return { deletedChunks: deletedCount };
  }
}

module.exports = new DocumentService();
