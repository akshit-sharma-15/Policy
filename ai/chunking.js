// Simple token-based chunking with overlap
class ChunkingService {
  constructor(chunkSize = 400, overlap = 50) {
    this.chunkSize = chunkSize;
    this.overlap = overlap;
  }

  // Approximate token count (rough estimate: 1 token ≈ 4 characters)
  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }

  chunkText(text) {
    const words = text.split(/\s+/);
    const chunks = [];
    let currentChunk = [];
    let currentTokens = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordTokens = this.estimateTokens(word);

      if (currentTokens + wordTokens > this.chunkSize && currentChunk.length > 0) {
        // Save current chunk
        chunks.push(currentChunk.join(' '));

        // Create overlap by keeping last N tokens
        const overlapWords = [];
        let overlapTokens = 0;
        
        for (let j = currentChunk.length - 1; j >= 0; j--) {
          const overlapWord = currentChunk[j];
          const overlapWordTokens = this.estimateTokens(overlapWord);
          
          if (overlapTokens + overlapWordTokens <= this.overlap) {
            overlapWords.unshift(overlapWord);
            overlapTokens += overlapWordTokens;
          } else {
            break;
          }
        }

        currentChunk = overlapWords;
        currentTokens = overlapTokens;
      }

      currentChunk.push(word);
      currentTokens += wordTokens;
    }

    // Add remaining chunk
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
    }

    return chunks;
  }
}

module.exports = new ChunkingService();
