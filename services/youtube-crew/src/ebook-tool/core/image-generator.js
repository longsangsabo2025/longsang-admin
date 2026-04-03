/**
 * 🎨 Generic Image Generator — Gemini API + File Cache
 * Reusable across all channels. Handles retries, rate limiting, caching.
 */
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { getRotatedGeminiKey } from '../../core/llm.js';

const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';
const GEMINI_IMAGE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent`;

/**
 * Generate a single image from a prompt via Gemini
 * @param {string} prompt - Image description
 * @param {object} style - { base, palette, mood } from channel config
 * @returns {{ dataUrl: string, mimeType: string }}
 */
export async function generateImage(prompt, style = {}) {
  const apiKey = getRotatedGeminiKey();
  const fullPrompt = [
    `Generate an image: ${prompt}`,
    style.base || '',
    style.palette || '',
    style.mood || '',
  ].filter(Boolean).join(' ');

  const res = await fetch(`${GEMINI_IMAGE_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Image API error ${res.status}: ${err.error?.message || 'unknown'}`);
  }

  const data = await res.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.mimeType?.startsWith('image/')) {
      const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      return { dataUrl, mimeType: part.inlineData.mimeType };
    }
  }
  throw new Error('No image in Gemini response');
}

/**
 * Generate image with file-based caching
 * @param {string} prompt - Image prompt
 * @param {string} cacheDir - Directory for .b64 cache files
 * @param {string} cacheKey - Filename without extension
 * @param {object} style - Image style config
 * @returns {string} dataUrl
 */
export async function generateImageCached(prompt, cacheDir, cacheKey, style = {}) {
  await mkdir(cacheDir, { recursive: true });
  const cacheFile = join(cacheDir, `${cacheKey}.b64`);

  if (existsSync(cacheFile)) {
    const cached = await readFile(cacheFile, 'utf-8');
    console.log(`   🖼️  Cached: ${cacheKey}`);
    return cached;
  }

  console.log(`   🎨 Generating: ${cacheKey}...`);
  const { dataUrl } = await generateImage(prompt, style);
  await writeFile(cacheFile, dataUrl, 'utf-8');
  // Rate limit between API calls
  await new Promise(r => setTimeout(r, 2000));
  return dataUrl;
}

/**
 * Generate cover + intro images for an ebook
 * @param {object} ebook - Ebook definition
 * @param {object} coverPrompts - { cover: string, intro?: string }
 * @param {string} outputDir - Base output directory
 * @param {object} style - Image style config
 * @returns {object} { cover?: string, intro?: string }
 */
export async function generateCoverImages(ebook, coverPrompts, outputDir, style = {}) {
  if (!coverPrompts) return {};
  const cacheDir = join(outputDir, ebook.id, 'images');
  const result = {};

  for (const [key, prompt] of Object.entries(coverPrompts)) {
    try {
      result[key] = await generateImageCached(prompt, cacheDir, key, style);
    } catch (err) {
      console.warn(`   ⚠️  ${key} image failed: ${err.message}`);
    }
  }
  return result;
}

/**
 * Generate chapter illustrations by matching patterns
 * @param {Array} chapters - Array of { title, content } from rebuilt chapters
 * @param {Array} imagePrompts - Array of { match: RegExp, prompt: string } or { id: string, prompt: string }
 * @param {string} cacheDir - Path to cache directory
 * @param {object} style - Image style config
 * @returns {Map} chapterIndex → dataUrl
 */
export async function generateChapterImagesByPattern(chapters, imagePrompts, cacheDir, style = {}) {
  await mkdir(cacheDir, { recursive: true });
  const result = new Map();

  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    const matchedPrompt = imagePrompts.find(p => {
      if (p.match instanceof RegExp) return p.match.test(ch.title);
      if (p.id) return ch.id === p.id;
      return false;
    });

    if (matchedPrompt) {
      try {
        const cacheKey = `ch${i}`;
        const dataUrl = await generateImageCached(matchedPrompt.prompt, cacheDir, cacheKey, style);
        result.set(i, dataUrl);
      } catch (err) {
        console.warn(`   ⚠️  Chapter image ${i} failed: ${err.message}`);
      }
    }
  }
  return result;
}

/**
 * Generate chapter illustrations by chapter ID  (for markdown-based builders)
 * @param {object} ebook - Ebook definition with chapters array
 * @param {Array} imagePrompts - Array of { id: string, prompt: string }
 * @param {string} cacheDir - Path to cache directory
 * @param {object} style - Image style config
 * @returns {Map} chapterId → dataUrl
 */
export async function generateChapterImagesById(ebook, imagePrompts, cacheDir, style = {}) {
  await mkdir(cacheDir, { recursive: true });
  const result = new Map();

  for (const imgDef of imagePrompts) {
    try {
      const dataUrl = await generateImageCached(imgDef.prompt, cacheDir, imgDef.id, style);
      result.set(imgDef.id, dataUrl);
    } catch (err) {
      console.warn(`   ⚠️  Image ${imgDef.id} failed: ${err.message}`);
    }
  }
  return result;
}
