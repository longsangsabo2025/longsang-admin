/**
 * Embedding Service
 * Generates vector embeddings using OpenAI API
 */

const OpenAI = require("openai");

const openaiApiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || "";
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

// Simple in-memory cache to avoid duplicate API calls
// In production, consider using Redis or similar
const embeddingCache = new Map();

/**
 * Generate embedding for text using OpenAI
 * @param {string} text - Text to generate embedding for
 * @param {boolean} useCache - Whether to use cache (default: true)
 * @returns {Promise<number[]>} - Embedding vector (1536 dimensions)
 */
async function generateEmbedding(text, useCache = true) {
  if (!openai) {
    throw new Error("OpenAI API key not configured");
  }

  if (!text || text.trim().length === 0) {
    throw new Error("Text cannot be empty");
  }

  // Normalize text for caching (trim and lowercase)
  const normalizedText = text.trim().toLowerCase();

  // Check cache first
  if (useCache && embeddingCache.has(normalizedText)) {
    console.log(`[Embedding] Cache hit for text: ${normalizedText.substring(0, 50)}...`);
    return embeddingCache.get(normalizedText);
  }

  try {
    console.log(`[Embedding] Generating embedding for text: ${text.substring(0, 50)}...`);

    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    const embedding = response.data[0].embedding;

    // Cache the result
    if (useCache) {
      embeddingCache.set(normalizedText, embedding);
      // Limit cache size to prevent memory issues
      if (embeddingCache.size > 1000) {
        const firstKey = embeddingCache.keys().next().value;
        embeddingCache.delete(firstKey);
      }
    }

    console.log(`[Embedding] Generated embedding (${embedding.length} dimensions)`);
    return embedding;
  } catch (error) {
    console.error("[Embedding] Error generating embedding:", error);

    // Handle specific OpenAI errors
    if (error.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    if (error.status === 401) {
      throw new Error("OpenAI API key is invalid or missing.");
    }

    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * @param {string[]} texts - Array of texts to generate embeddings for
 * @returns {Promise<number[][]>} - Array of embedding vectors
 */
async function generateEmbeddingsBatch(texts) {
  if (!openai) {
    throw new Error("OpenAI API key not configured");
  }

  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error("Texts must be a non-empty array");
  }

  try {
    console.log(`[Embedding] Generating batch embeddings for ${texts.length} texts`);

    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: texts,
    });

    const embeddings = response.data.map((item) => item.embedding);

    console.log(`[Embedding] Generated ${embeddings.length} embeddings`);
    return embeddings;
  } catch (error) {
    console.error("[Embedding] Error generating batch embeddings:", error);

    if (error.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    if (error.status === 401) {
      throw new Error("OpenAI API key is invalid or missing.");
    }

    throw new Error(`Failed to generate batch embeddings: ${error.message}`);
  }
}

/**
 * Clear the embedding cache
 */
function clearCache() {
  embeddingCache.clear();
  console.log("[Embedding] Cache cleared");
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  return {
    size: embeddingCache.size,
    maxSize: 1000,
  };
}

module.exports = {
  generateEmbedding,
  generateEmbeddingsBatch,
  clearCache,
  getCacheStats,
  isConfigured: !!openai,
};
