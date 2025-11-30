/**
 * Document Processor Service
 * Process uploaded files (PDF, DOCX, TXT) and index to RAG
 */

const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const embeddingService = require('./embedding-service');
const { getAPIKeys } = require('./env-loader');

const keys = getAPIKeys();

/**
 * Process uploaded file and extract text
 */
async function processFile(filePath, fileType) {
  try {
    let text = '';

    switch (fileType) {
      case 'application/pdf':
        const pdfBuffer = await fs.readFile(filePath);
        const pdfData = await pdfParse(pdfBuffer);
        text = pdfData.text;
        break;

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        const docxBuffer = await fs.readFile(filePath);
        const docxResult = await mammoth.extractRawText({ buffer: docxBuffer });
        text = docxResult.value;
        break;

      case 'text/plain':
        text = await fs.readFile(filePath, 'utf-8');
        break;

      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    return text.trim();
  } catch (error) {
    console.error('[Document Processor] Error processing file:', error);
    throw error;
  }
}

/**
 * Split text into chunks
 */
function splitIntoChunks(text, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.substring(start, end);
    chunks.push(chunk);
    start = end - overlap; // Overlap to maintain context
  }

  return chunks;
}

/**
 * Process and index document to RAG
 */
async function processAndIndexDocument({
  filePath,
  fileName,
  fileType,
  fileSize,
  userId,
  assistantType,
}) {
  try {
    // 1. Extract text from file
    console.log(`[Document Processor] Processing file: ${fileName}`);
    const text = await processFile(filePath, fileType);

    if (!text || text.length === 0) {
      throw new Error('File is empty or could not extract text');
    }

    // 2. Split into chunks
    const chunks = splitIntoChunks(text);
    console.log(`[Document Processor] Split into ${chunks.length} chunks`);

    // 3. Generate embeddings and store
    const documentIds = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await embeddingService.embed(chunk);

      const document = await embeddingService.storeDocument({
        content: chunk,
        embedding,
        userId,
        metadata: {
          source_type: 'upload',
          source_id: fileName,
          chunk_index: i,
          total_chunks: chunks.length,
          file_type: fileType,
          file_size: fileSize,
        },
        sourceType: assistantType,
      });

      documentIds.push(document.id);
    }

    // 4. Clean up temp file
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.warn('[Document Processor] Could not delete temp file:', err);
    }

    return {
      success: true,
      documentIds,
      chunksCount: chunks.length,
      textLength: text.length,
    };
  } catch (error) {
    console.error('[Document Processor] Error processing document:', error);
    throw error;
  }
}

module.exports = {
  processFile,
  splitIntoChunks,
  processAndIndexDocument,
};

