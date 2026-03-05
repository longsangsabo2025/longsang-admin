/**
 * LLM Provider Abstraction
 * Single interface for OpenAI, Gemini, Anthropic
 * Default: gpt-4o-mini (cheap, fast, good enough for 90% of tasks)
 * 
 * Langfuse integration: Every LLM call is traced for observability.
 * Set LANGFUSE_SECRET_KEY + LANGFUSE_PUBLIC_KEY + LANGFUSE_HOST in .env to enable.
 */
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

const providers = {};
let langfuse = null;

// ─── LANGFUSE INIT ──────────────────────────────────────────
function getLangfuse() {
  if (langfuse !== undefined && langfuse !== null) return langfuse;
  if (langfuse === false) return null; // Already tried, not configured

  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const host = process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com';

  if (!secretKey || !publicKey) {
    langfuse = false;
    return null;
  }

  try {
    // Dynamic import — only load if configured
    import('langfuse').then(({ Langfuse }) => {
      langfuse = new Langfuse({ secretKey, publicKey, baseUrl: host });
      console.log(`[LLM] Langfuse observability enabled → ${host}`);
    }).catch(() => {
      langfuse = false;
      console.log('[LLM] Langfuse package not installed — run: npm i langfuse');
    });
  } catch {
    langfuse = false;
  }
  return null; // Will be available on next call
}

function getOpenAI() {
  if (!providers.openai) {
    providers.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return providers.openai;
}

function getGemini() {
  if (!providers.gemini) {
    providers.gemini = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  }
  return providers.gemini;
}

/**
 * Universal chat completion
 * @param {object} opts
 * @param {string} opts.model - Model name (gpt-4o-mini, gemini-2.0-flash, etc.)
 * @param {string} opts.systemPrompt - System instructions
 * @param {string} opts.userMessage - User message
 * @param {number} opts.temperature - 0-1
 * @param {number} opts.maxTokens - Max output tokens
 * @param {string} opts.responseFormat - 'text' or 'json'
 * @returns {Promise<{content: string, tokens: {input: number, output: number}, model: string}>}
 */
// Initialize Langfuse on first import
getLangfuse();

// ─── Retry helper with exponential backoff ──────────────────
const GEMINI_FALLBACK_CHAIN = [
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
];

async function withRetry(fn, { maxRetries = 3, baseDelayMs = 2000, label = 'LLM' } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const is429 = err.status === 429 || err.message?.includes('429') || err.message?.includes('Resource exhausted');
      const is503 = err.status === 503 || err.message?.includes('503') || err.message?.includes('overloaded');
      if ((is429 || is503) && attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000;
        console.log(`[${label}] ${is429 ? '429 Rate Limited' : '503 Overloaded'} — retry ${attempt + 1}/${maxRetries} in ${(delay / 1000).toFixed(1)}s`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export async function chat({
  model = 'gpt-4o-mini',
  systemPrompt = '',
  userMessage,
  temperature = 0.7,
  maxTokens = 4096,
  responseFormat = 'text',
  agentId = 'unknown',
  pipelineId = '',
}) {
  const startTime = Date.now();
  let result;

  // --- OpenAI models ---
  if (model.startsWith('gpt-') || model.startsWith('o1') || model.startsWith('o3')) {
    const openai = getOpenAI();
    const params = {
      model,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: userMessage },
      ],
      temperature,
      max_tokens: maxTokens,
    };
    if (responseFormat === 'json') {
      params.response_format = { type: 'json_object' };
    }
    result = await withRetry(async () => {
      const res = await openai.chat.completions.create(params);
      return {
        content: res.choices[0].message.content,
        tokens: {
          input: res.usage?.prompt_tokens || 0,
          output: res.usage?.completion_tokens || 0,
        },
        model,
        durationMs: Date.now() - startTime,
      };
    }, { label: `OpenAI:${model}` });
  }

  // --- Gemini models (with fallback chain) ---
  else if (model.startsWith('gemini')) {
    const genai = getGemini();

    // Build fallback order: requested model first, then others in chain
    const modelsToTry = [model, ...GEMINI_FALLBACK_CHAIN.filter(m => m !== model)];

    for (const tryModel of modelsToTry) {
      try {
        result = await withRetry(async () => {
          const genModel = genai.getGenerativeModel({
            model: tryModel,
            systemInstruction: systemPrompt || undefined,
            generationConfig: {
              temperature,
              maxOutputTokens: maxTokens,
              responseMimeType: responseFormat === 'json' ? 'application/json' : 'text/plain',
            },
          });
          const res = await genModel.generateContent(userMessage);
          const response = res.response;
          return {
            content: response.text(),
            tokens: {
              input: response.usageMetadata?.promptTokenCount || 0,
              output: response.usageMetadata?.candidatesTokenCount || 0,
            },
            model: tryModel,
            durationMs: Date.now() - startTime,
          };
        }, { maxRetries: 2, label: `Gemini:${tryModel}` });
        if (tryModel !== model) {
          console.log(`[LLM] ⚡ Fallback: ${model} → ${tryModel} succeeded`);
        }
        break; // success — exit fallback loop
      } catch (err) {
        const is429 = err.status === 429 || err.message?.includes('429') || err.message?.includes('Resource exhausted');
        if (is429 && tryModel !== modelsToTry[modelsToTry.length - 1]) {
          console.log(`[LLM] ${tryModel} exhausted — trying next fallback model...`);
          continue;
        }
        throw err;
      }
    }
  }

  else {
    throw new Error(`Unsupported model: ${model}. Use gpt-* or gemini-*`);
  }

  // ─── LANGFUSE TRACE ─────────────────────────────────────
  try {
    const lf = getLangfuse();
    if (lf && result) {
      const trace = lf.trace({
        name: `${agentId}:chat`,
        metadata: { pipelineId, agentId },
      });
      trace.generation({
        name: model,
        model,
        input: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt.substring(0, 500) }] : []),
          { role: 'user', content: userMessage.substring(0, 1000) },
        ],
        output: result.content.substring(0, 1000),
        usage: {
          promptTokens: result.tokens.input,
          completionTokens: result.tokens.output,
        },
        metadata: {
          temperature,
          maxTokens,
          responseFormat,
          durationMs: result.durationMs,
          cost: estimateCost(model, result.tokens.input, result.tokens.output),
        },
      });
    }
  } catch {
    // Langfuse tracing is non-critical — never block LLM calls
  }

  return result;
}

/**
 * Estimate cost in USD
 */
export function estimateCost(model, inputTokens, outputTokens) {
  const pricing = {
    'gpt-4o-mini': { input: 0.15, output: 0.60 }, // per 1M tokens
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gemini-2.0-flash': { input: 0.10, output: 0.40 },
    'gemini-2.5-flash-preview-04-17': { input: 0.15, output: 0.60 },
  };
  const p = pricing[model] || pricing['gpt-4o-mini'];
  return (inputTokens * p.input + outputTokens * p.output) / 1_000_000;
}
