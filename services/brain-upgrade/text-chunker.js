/**
 * 📝 TEXT CHUNKER MODULE
 * 
 * Split long documents into overlapping chunks for better RAG retrieval.
 * Uses token-aware splitting with semantic boundaries (paragraphs, sentences).
 * 
 * Why chunking matters:
 * - OpenAI embeddings work best on 200-500 token chunks
 * - Long docs dilute the embedding — specific info gets lost
 * - Overlapping ensures no context is cut mid-thought
 */

const CHARS_PER_TOKEN = 4; // Approximate for Vietnamese + English mixed text

/**
 * Split text into overlapping chunks
 * @param {string} text - Full document text
 * @param {Object} options
 * @param {number} options.maxTokens - Max tokens per chunk (default: 500)
 * @param {number} options.overlapTokens - Overlap between chunks (default: 100)
 * @param {string} options.title - Document title (prepended to each chunk)
 * @returns {Array<{text: string, index: number, totalChunks: number}>}
 */
function chunkText(text, options = {}) {
  const {
    maxTokens = 500,
    overlapTokens = 100,
    title = ''
  } = options;

  if (!text || text.trim().length === 0) return [];

  const maxChars = maxTokens * CHARS_PER_TOKEN;
  const overlapChars = overlapTokens * CHARS_PER_TOKEN;

  // If text fits in one chunk, return as-is
  if (text.length <= maxChars) {
    return [{
      text: title ? `# ${title}\n\n${text}` : text,
      index: 0,
      totalChunks: 1
    }];
  }

  // Split into paragraphs first (preserve semantic boundaries)
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  const chunks = [];
  let currentChunk = '';
  let chunkStart = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i].trim();
    
    // If single paragraph is too long, split by sentences
    if (para.length > maxChars) {
      // Flush current chunk first
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      // Split long paragraph by sentences
      const sentences = para.split(/(?<=[.!?。])\s+/);
      let sentenceChunk = '';
      
      for (const sentence of sentences) {
        if ((sentenceChunk + ' ' + sentence).length > maxChars && sentenceChunk) {
          chunks.push(sentenceChunk.trim());
          // Keep overlap from end of previous chunk
          const words = sentenceChunk.split(/\s+/);
          const overlapWords = Math.floor(overlapChars / 5); // ~5 chars per word
          sentenceChunk = words.slice(-overlapWords).join(' ') + ' ' + sentence;
        } else {
          sentenceChunk += (sentenceChunk ? ' ' : '') + sentence;
        }
      }
      if (sentenceChunk.trim()) {
        currentChunk = sentenceChunk;
      }
      continue;
    }

    // Check if adding this paragraph exceeds limit
    const newLength = (currentChunk + '\n\n' + para).length;
    
    if (newLength > maxChars && currentChunk.trim()) {
      chunks.push(currentChunk.trim());
      
      // Start new chunk with overlap from previous
      const prevWords = currentChunk.split(/\s+/);
      const overlapWords = Math.floor(overlapChars / 5);
      const overlap = prevWords.slice(-overlapWords).join(' ');
      currentChunk = overlap + '\n\n' + para;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // Format chunks with title prefix and metadata
  return chunks.map((chunk, index) => ({
    text: title ? `[${title} - Part ${index + 1}/${chunks.length}]\n\n${chunk}` : chunk,
    index,
    totalChunks: chunks.length
  }));
}

/**
 * Estimate token count for text
 * @param {string} text
 * @returns {number}
 */
function estimateTokens(text) {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Check if text needs chunking
 * @param {string} text
 * @param {number} maxTokens
 * @returns {boolean}
 */
function needsChunking(text, maxTokens = 500) {
  return estimateTokens(text) > maxTokens;
}

module.exports = { chunkText, estimateTokens, needsChunking };
