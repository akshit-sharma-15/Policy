const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class EmbeddingService {
  async generateEmbedding(text) {
    try {
      // For testing without API quota, use mock embeddings
      if (process.env.USE_MOCK_EMBEDDINGS === 'true') {
        return this.generateMockEmbedding(text);
      }

      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error.message);
      // Fallback to mock if API fails
      console.log('Falling back to mock embeddings');
      return this.generateMockEmbedding(text);
    }
  }

  async generateEmbeddings(texts) {
    try {
      // For testing without API quota, use mock embeddings
      if (process.env.USE_MOCK_EMBEDDINGS === 'true') {
        return texts.map(text => this.generateMockEmbedding(text));
      }

      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: texts
      });

      return response.data.map(item => item.embedding);
    } catch (error) {
      console.error('Error generating embeddings:', error.message);
      // Fallback to mock if API fails
      console.log('Falling back to mock embeddings');
      return texts.map(text => this.generateMockEmbedding(text));
    }
  }

  // Generate deterministic mock embedding based on text content
  generateMockEmbedding(text) {
    const dimension = 1536; // Same as text-embedding-3-small
    const embedding = new Array(dimension);
    
    // Create a simple hash-based embedding
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash = hash & hash;
    }
    
    // Generate pseudo-random but deterministic values
    for (let i = 0; i < dimension; i++) {
      const seed = hash + i;
      const x = Math.sin(seed) * 10000;
      embedding[i] = (x - Math.floor(x)) * 2 - 1; // Normalize to [-1, 1]
    }
    
    // Normalize the vector
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / norm);
  }
}

module.exports = new EmbeddingService();
