/**
 * 🗄️ Image Library — Index of all generated images with prompts for reuse
 *
 * Collects images from completed pipeline runs and builds a searchable index.
 * When generating new images, searches the library first to reuse existing ones
 * instead of regenerating — saves API quota and time.
 *
 * Storage: localStorage + Supabase app_settings for persistence.
 * Matching: keyword extraction + cosine-like similarity on prompt tokens.
 */

import { supabase } from '@/integrations/supabase/client';
import { getAllRuns } from './run-tracker';

export interface LibraryImage {
  /** Unique ID */
  id: string;
  /** Public URL of the image */
  url: string;
  /** The prompt used to generate this image */
  prompt: string;
  /** Extracted keywords (lowercase, deduplicated) for fast matching */
  keywords: string[];
  /** Channel that generated this image */
  channelId: string;
  /** Run that generated this image */
  runId: string;
  /** Scene number in the original storyboard */
  scene: number;
  /** When this image was generated */
  createdAt: string;
}

const STORAGE_KEY = 'pipeline-image-library';
const DB_KEY = 'pipeline-image-library';
const DB_CATEGORY = 'pipeline';
const MAX_LIBRARY_SIZE = 5000; // Max images to keep in index

let _cache: LibraryImage[] | null = null;
let _dbSynced = false;

// ─── Stop words to exclude from keyword matching ───
const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'from',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'can',
  'shall',
  'not',
  'no',
  'nor',
  'so',
  'if',
  'then',
  'than',
  'that',
  'this',
  'these',
  'those',
  'it',
  'its',
  'as',
  'up',
  'out',
  'about',
  'into',
  'over',
  'after',
  'before',
  'between',
  'under',
  'above',
  'below',
  'each',
  'every',
  'all',
  'both',
  'few',
  'more',
  'most',
  'other',
  'some',
  'such',
  'only',
  'very',
  'just',
  'also',
  'any',
  'image',
  'generate',
  'ratio',
  'aspect',
  'quality',
  'include',
  'photorealistic',
  'cinematic',
]);

/** Extract meaningful keywords from a prompt */
export function extractKeywords(prompt: string): string[] {
  const words = prompt
    .toLowerCase()
    .replace(/[^a-zA-ZÀ-ỹ0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  // Deduplicate
  return Array.from(new Set(words));
}

/** Calculate similarity score between two keyword sets (0-1) */
export function keywordSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }
  // Jaccard similarity
  const union = new Set([...a, ...b]).size;
  return union > 0 ? intersection / union : 0;
}

// ─── Library CRUD ───

function loadFromLocalStorage(): LibraryImage[] {
  if (_cache) return _cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    _cache = raw ? JSON.parse(raw) : [];
  } catch {
    _cache = [];
  }
  return _cache!;
}

function saveToLocalStorage(images: LibraryImage[]) {
  _cache = images;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
  } catch {
    // localStorage quota — trim older images
    const trimmed = images.slice(-Math.floor(MAX_LIBRARY_SIZE / 2));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      _cache = trimmed;
    } catch {
      /* give up */
    }
  }
}

/** Sync library to Supabase for cross-device persistence */
async function syncToDb(images: LibraryImage[]) {
  try {
    await supabase.from('app_settings').upsert(
      {
        key: DB_KEY,
        value: JSON.stringify(images),
        category: DB_CATEGORY,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );
  } catch {
    /* non-critical */
  }
}

// ── Debounced DB sync: batch rapid addToLibrary calls into one write ──
let _syncTimer: ReturnType<typeof setTimeout> | null = null;
const SYNC_DEBOUNCE_MS = 5000; // wait 5s before writing, catches full pipeline run as one batch

function scheduleSyncToDb(images: LibraryImage[]) {
  if (_syncTimer) clearTimeout(_syncTimer);
  _syncTimer = setTimeout(() => {
    _syncTimer = null;
    syncToDb(images).catch(() => {});
  }, SYNC_DEBOUNCE_MS);
}

/** Load library from Supabase (once per session) */
async function hydrateFromDb(): Promise<LibraryImage[]> {
  if (_dbSynced) return loadFromLocalStorage();
  _dbSynced = true;

  try {
    const { data } = await supabase.from('app_settings').select('value').eq('key', DB_KEY).single();

    if (data?.value) {
      const dbImages: LibraryImage[] = JSON.parse(data.value as string);
      const local = loadFromLocalStorage();

      // Merge: DB may have images from other devices
      const urlSet = new Set(local.map((i) => i.url));
      let merged = [...local];
      for (const img of dbImages) {
        if (!urlSet.has(img.url)) {
          merged.push(img);
          urlSet.add(img.url);
        }
      }

      // Trim to max
      if (merged.length > MAX_LIBRARY_SIZE) {
        merged = merged.slice(-MAX_LIBRARY_SIZE);
      }

      saveToLocalStorage(merged);
      return merged;
    }
  } catch {
    /* non-critical */
  }

  return loadFromLocalStorage();
}

/** Get full library */
export async function getLibrary(): Promise<LibraryImage[]> {
  return hydrateFromDb();
}

/** Get library size */
export function getLibrarySize(): number {
  return loadFromLocalStorage().length;
}

/** Add images to the library (deduplicates by URL) */
export function addToLibrary(images: LibraryImage[]) {
  const existing = loadFromLocalStorage();
  const urlSet = new Set(existing.map((i) => i.url));

  let added = 0;
  for (const img of images) {
    if (!urlSet.has(img.url) && img.url && !img.url.startsWith('data:')) {
      existing.push(img);
      urlSet.add(img.url);
      added++;
    }
  }

  if (added > 0) {
    // Trim to max
    const trimmed =
      existing.length > MAX_LIBRARY_SIZE ? existing.slice(-MAX_LIBRARY_SIZE) : existing;
    saveToLocalStorage(trimmed);
    // Debounced sync: batches rapid batch-generation calls into one DB write
    scheduleSyncToDb(trimmed);
  }

  return added;
}

/**
 * Build library from all completed pipeline runs.
 * Call this on first load or to rebuild after data loss.
 */
export function rebuildLibraryFromRuns(): number {
  const runs = getAllRuns();
  const newImages: LibraryImage[] = [];

  for (const run of runs) {
    if (run.status !== 'completed' && run.status !== 'interrupted') continue;
    const imagesJson = run.result?.files?.['images.json'] as
      | {
          images?: Array<{ scene: number; url: string; prompt: string; mimeType?: string }>;
        }
      | undefined;

    if (!imagesJson?.images) continue;

    for (const img of imagesJson.images) {
      if (!img.url || img.url.startsWith('data:')) continue;
      newImages.push({
        id: `${run.id}_scene_${img.scene}`,
        url: img.url,
        prompt: img.prompt || '',
        keywords: extractKeywords(img.prompt || ''),
        channelId: run.channelId || 'unknown',
        runId: run.id,
        scene: img.scene,
        createdAt: run.startedAt || new Date().toISOString(),
      });
    }
  }

  return addToLibrary(newImages);
}

/**
 * 🔍 Search library for images matching a prompt.
 *
 * Returns images sorted by similarity score (best match first).
 * Only returns images above the minimum similarity threshold.
 *
 * @param prompt - The visual prompt to match against
 * @param channelId - Optional: prefer images from the same channel
 * @param minSimilarity - Minimum keyword similarity (0-1), default 0.3
 * @param limit - Max results to return, default 5
 */
export function searchLibrary(
  prompt: string,
  channelId?: string,
  minSimilarity = 0.3,
  limit = 5
): Array<LibraryImage & { similarity: number }> {
  const library = loadFromLocalStorage();
  if (library.length === 0) return [];

  const queryKeywords = extractKeywords(prompt);
  if (queryKeywords.length === 0) return [];

  const scored = library
    .map((img) => {
      let similarity = keywordSimilarity(queryKeywords, img.keywords);
      // Boost same-channel images slightly (visual consistency)
      if (channelId && img.channelId === channelId) {
        similarity = Math.min(1, similarity * 1.15);
      }
      return { ...img, similarity };
    })
    .filter((img) => img.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return scored;
}

/**
 * 🎯 Find the best matching image for a prompt.
 * Returns null if no match above threshold.
 */
export function findBestMatch(
  prompt: string,
  channelId?: string,
  minSimilarity = 0.35
): (LibraryImage & { similarity: number }) | null {
  const results = searchLibrary(prompt, channelId, minSimilarity, 1);
  return results.length > 0 ? results[0] : null;
}

/** Clear the entire library */
export function clearLibrary() {
  _cache = [];
  saveToLocalStorage([]);
  syncToDb([]).catch(() => {});
}

/** Get library stats by channel */
export function getLibraryStats(): Record<string, number> {
  const library = loadFromLocalStorage();
  const stats: Record<string, number> = { total: library.length };
  for (const img of library) {
    stats[img.channelId] = (stats[img.channelId] || 0) + 1;
  }
  return stats;
}
