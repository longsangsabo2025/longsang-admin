/**
 * Knowledge Loader — Loads book knowledge + video transcripts for agents
 * 
 * Reads from:
 * - BRAIN.md (condensed knowledge map with hooks + mental models)
 * - books.json (full 28-book content for deep search)
 * - VOICE.md (voice DNA profile)
 * - 4 transcript sources: HiddenSelf (315), THUATTAIVAN (210), Hormozi (120), AkBiMatLuatNgam (170)
 *   Total: 815 video transcripts across 8 categories
 * 
 * Agents get knowledge injected into their context automatically.
 */
import { readFile, readdir } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_DIR = join(__dirname, '..', 'knowledge');

// ─── Multi-Source Configuration ──────────────────
const SOURCES = [
  { id: 'hiddenself',       dir: 'transcripts',        label: 'THE HIDDEN SELF',        viewField: 'viewCount' },
  { id: 'thuattaivan',      dir: 'thuattaivan',         label: 'THUẬT TÀI VẬN',         viewField: 'views' },
  { id: 'hormozi',          dir: 'hormozi',             label: 'Alex Hormozi',           viewField: 'views' },
  { id: 'akbimatluatngam',  dir: 'akbimatluatngam',     label: 'Ẩn Bí Mật Luật Ngầm',   viewField: 'views' },
];

let _brainCache = null;
let _booksCache = null;
let _voiceCache = null;
let _allTranscriptsCache = null; // Unified index across all sources

/**
 * Load the condensed BRAIN.md knowledge map
 * This is the primary knowledge source for Script Writer
 */
export async function loadBrain() {
  if (_brainCache) return _brainCache;
  try {
    _brainCache = await readFile(join(KNOWLEDGE_DIR, 'BRAIN.md'), 'utf-8');
    return _brainCache;
  } catch {
    console.warn('[Knowledge] BRAIN.md not found — agents will work without book knowledge');
    return '';
  }
}

/**
 * Load the Voice DNA profile (VOICE.md)
 * This defines the target writing voice for Script Writer
 */
export async function loadVoice() {
  if (_voiceCache) return _voiceCache;
  try {
    _voiceCache = await readFile(join(KNOWLEDGE_DIR, 'VOICE.md'), 'utf-8');
    return _voiceCache;
  } catch {
    console.warn('[Knowledge] VOICE.md not found — Script Writer will use default voice');
    return '';
  }
}

/**
 * Load full books JSON (28 books, ~330K chars)
 * Use sparingly — only for deep research
 */
export async function loadBooks() {
  if (_booksCache) return _booksCache;
  try {
    const raw = await readFile(join(KNOWLEDGE_DIR, 'books.json'), 'utf-8');
    _booksCache = JSON.parse(raw);
    return _booksCache;
  } catch {
    console.warn('[Knowledge] books.json not found');
    return [];
  }
}

/**
 * Search books by keywords (word-level scoring)
 * Splits query into individual words and scores books by match count
 */
export async function searchBooks(query, maxResults = 3) {
  const books = await loadBooks();
  if (!query || !books.length) return [];

  // Split query into meaningful words (>= 2 chars, Vietnamese-aware)
  const queryWords = query.toLowerCase()
    .split(/[\s,;.!?\-—]+/)
    .filter(w => w.length >= 2);
  
  if (queryWords.length === 0) return [];

  const scored = [];
  for (const book of books) {
    const contentLower = (book.content + ' ' + book.title).toLowerCase();
    let score = 0;
    let bestIdx = -1;
    
    for (const word of queryWords) {
      const idx = contentLower.indexOf(word);
      if (idx !== -1) {
        score++;
        if (bestIdx === -1) bestIdx = idx;
      }
    }

    // Also check title match (bonus)
    const titleLower = book.title.toLowerCase();
    for (const word of queryWords) {
      if (titleLower.includes(word)) score += 2;
    }

    if (score > 0) {
      // Extract context around best match
      const start = Math.max(0, bestIdx - 200);
      const end = Math.min(book.content.length, bestIdx + 300);
      scored.push({
        title: book.title,
        category: book.category,
        excerpt: book.content.substring(start, end),
        score,
      });
    }
  }

  // Sort by score descending, return top N
  return scored.sort((a, b) => b.score - a.score).slice(0, maxResults);
}

/**
 * Search BRAIN.md for topic-relevant sections
 * Returns the most relevant brain themes + hooks for a topic
 */
export async function searchBrain(topic, maxChars = 3000) {
  const brain = await loadBrain();
  if (!brain || !topic) return brain?.substring(0, maxChars) || '';

  const topicWords = topic.toLowerCase()
    .split(/[\s,;.!?\-—]+/)
    .filter(w => w.length >= 2);

  // Split brain into sections (## headers)
  const sections = brain.split(/(?=^## )/m).filter(s => s.trim());
  
  // Score each section by keyword relevance
  const scored = sections.map(section => {
    const sectionLower = section.toLowerCase();
    let score = 0;
    for (const word of topicWords) {
      if (sectionLower.includes(word)) score++;
    }
    // Bonus for hooks and formulas
    if (sectionLower.includes('hook:')) score += 1;
    if (sectionLower.includes('vn:')) score += 1;
    return { section, score };
  });

  // Always include the header/library section (first), then top scored sections
  const header = scored.shift();
  const topSections = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);

  // Build result within char limit
  let result = header?.section?.substring(0, 500) || '';
  for (const { section } of topSections) {
    if (result.length + section.length > maxChars) {
      // Add truncated if space allows
      const remaining = maxChars - result.length;
      if (remaining > 200) result += '\n' + section.substring(0, remaining);
      break;
    }
    result += '\n' + section;
  }

  // If nothing matched, return first N chars as fallback
  if (topSections.length === 0) return brain.substring(0, maxChars);
  return result;
}

/**
 * Load ALL transcript indexes from all sources (unified)
 * Returns { videos: [...], totalVideos: N, sources: [...] }
 */
export async function loadTranscriptIndex(sourceFilter = null) {
  if (_allTranscriptsCache && !sourceFilter) return _allTranscriptsCache;
  
  const allVideos = [];
  const sourceSummaries = [];
  
  for (const source of SOURCES) {
    if (sourceFilter && source.id !== sourceFilter) continue;
    
    const indexPath = join(KNOWLEDGE_DIR, source.dir, '_index.json');
    try {
      if (!existsSync(indexPath)) continue;
      const raw = readFileSync(indexPath, 'utf-8');
      const index = JSON.parse(raw);
      
      const videos = (index.videos || []).map(v => ({
        ...v,
        source: source.id,
        sourceLabel: source.label,
        viewCount: v[source.viewField] || v.viewCount || v.views || 0,
        _dir: source.dir,
      }));
      
      allVideos.push(...videos);
      sourceSummaries.push({
        id: source.id,
        label: source.label,
        totalVideos: index.totalVideos || videos.length,
        categories: index.categories || {},
      });
    } catch (err) {
      console.warn(`[Knowledge] ${source.label} index not found: ${err.message}`);
    }
  }
  
  const result = {
    videos: allVideos,
    totalVideos: allVideos.length,
    sources: sourceSummaries,
    categories: allVideos.reduce((acc, v) => {
      acc[v.category] = (acc[v.category] || 0) + 1;
      return acc;
    }, {}),
  };
  
  if (!sourceFilter) _allTranscriptsCache = result;
  return result;
}

/**
 * Load a single transcript file content from the correct source directory
 */
async function loadTranscriptFile(filePath, sourceDir) {
  try {
    const fullPath = join(KNOWLEDGE_DIR, sourceDir, filePath);
    const content = await readFile(fullPath, 'utf-8');
    // Strip YAML frontmatter
    const bodyMatch = content.match(/^---[\s\S]*?---\s*\n([\s\S]*)$/);
    return bodyMatch ? bodyMatch[1].trim() : content;
  } catch {
    return '';
  }
}

/**
 * Search video transcripts across ALL sources by keywords (word-level scoring)
 * Searches title + first 500 chars of transcript for relevance
 * Returns matched transcripts with excerpts
 * 
 * @param {string} query - Search query
 * @param {number} maxResults - Max results to return (default 5)
 * @param {string} sourceFilter - Optional: filter by source id
 */
export async function searchTranscripts(query, maxResults = 5, sourceFilter = null) {
  const index = await loadTranscriptIndex(sourceFilter);
  if (!query || !index.videos?.length) return [];

  const queryWords = query.toLowerCase()
    .split(/[\s,;.!?\-—]+/)
    .filter(w => w.length >= 2);
  
  if (queryWords.length === 0) return [];

  // Phase 1: Score by title from index (fast, no file reads)
  const candidates = [];
  for (const video of index.videos) {
    const titleLower = (video.title || '').toLowerCase();
    let score = 0;
    for (const word of queryWords) {
      if (titleLower.includes(word)) score += 3; // Title match = high value
    }
    // Bonus for high-view videos (popular = likely better reference)
    const views = video.viewCount || 0;
    if (views > 1000000) score += 2;
    else if (views > 100000) score += 1;
    
    candidates.push({ ...video, score });
  }

  // Phase 2: For top candidates, read actual transcript for deeper scoring
  const topCandidates = candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(50, candidates.length)); // Read at most 50 files

  const scored = [];
  for (const candidate of topCandidates) {
    if (candidate.score === 0 && scored.length >= maxResults) continue; // Skip zero-score if enough
    
    const content = await loadTranscriptFile(candidate.file, candidate._dir);
    if (!content) continue;

    // Score against transcript content (first 2000 chars for speed)
    const contentSample = content.substring(0, 2000).toLowerCase();
    let contentScore = candidate.score;
    for (const word of queryWords) {
      // Count occurrences (capped at 5 per word)
      let count = 0;
      let searchFrom = 0;
      while (count < 5) {
        const idx = contentSample.indexOf(word, searchFrom);
        if (idx === -1) break;
        count++;
        searchFrom = idx + word.length;
      }
      contentScore += count;
    }

    if (contentScore > 0) {
      // Find best excerpt around keyword match
      let bestIdx = 0;
      for (const word of queryWords) {
        const idx = content.toLowerCase().indexOf(word);
        if (idx !== -1) { bestIdx = idx; break; }
      }
      const start = Math.max(0, bestIdx - 150);
      const end = Math.min(content.length, bestIdx + 350);

      scored.push({
        videoId: candidate.videoId,
        title: candidate.title,
        category: candidate.category,
        source: candidate.source,
        sourceLabel: candidate.sourceLabel,
        viewCount: candidate.viewCount,
        excerpt: content.substring(start, end),
        score: contentScore,
        file: candidate.file,
      });
    }
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, maxResults);
}

/**
 * Get transcripts by category (across all sources)
 */
export async function getTranscriptsByCategory(category, sourceFilter = null) {
  const index = await loadTranscriptIndex(sourceFilter);
  const catMap = {
    'psychology': 'tam-ly',
    'finance': 'tai-chinh',
    'development': 'phat-trien',
    'culture': 'van-hoa',
    'geopolitics': 'dia-chinh-tri',
    'business': 'kinh-doanh',
    'society': 'xa-hoi',
    'health': 'suc-khoe',
    'philosophy': 'triet-hoc',
    'tâm lý': 'tam-ly',
    'tài chính': 'tai-chinh',
    'phát triển': 'phat-trien',
    'văn hóa': 'van-hoa',
    'địa chính trị': 'dia-chinh-tri',
    'kinh doanh': 'kinh-doanh',
    'xã hội': 'xa-hoi',
    'sức khỏe': 'suc-khoe',
    'triết học': 'triet-hoc',
  };
  const targetCat = catMap[category.toLowerCase()] || category.toLowerCase();
  return index.videos.filter(v => v.category === targetCat);
}

/**
 * Load full transcript content for a specific video
 */
export async function loadTranscript(videoId) {
  const index = await loadTranscriptIndex();
  const video = index.videos.find(v => v.videoId === videoId);
  if (!video) return null;
  const content = await loadTranscriptFile(video.file, video._dir);
  return { ...video, content };
}

/**
 * Get knowledge stats — used by admin dashboard
 */
export async function getKnowledgeStats() {
  const index = await loadTranscriptIndex();
  const brain = await loadBrain();
  const books = await loadBooks();
  
  return {
    totalVideos: index.totalVideos,
    sources: index.sources,
    categories: index.categories,
    totalBooks: books.length,
    brainSize: brain.length,
    brainExists: brain.length > 0,
  };
}

/**
 * Get books by category
 */
export async function getBooksByCategory(category) {
  const books = await loadBooks();
  const catMap = {
    'finance': 'Tài chính',
    'psychology': 'Tâm lý',
    'management': 'Quản trị',
    'deepwork': 'Deepwork',
    'discipline': 'Kỷ luật',
    'tài chính': 'Tài chính',
    'tâm lý': 'Tâm lý',
    'quản trị': 'Quản trị',
  };
  const targetCat = catMap[category.toLowerCase()] || category;
  return books.filter(b => b.category === targetCat);
}

/**
 * Get a random viral hook from the brain
 */
export async function getRandomHook() {
  const brain = await loadBrain();
  const hookRegex = /\*"(.+?)"\*/g;
  const hooks = [];
  let match;
  while ((match = hookRegex.exec(brain)) !== null) {
    hooks.push(match[1]);
  }
  if (hooks.length === 0) return null;
  return hooks[Math.floor(Math.random() * hooks.length)];
}

/**
 * Build knowledge context string for an agent
 * Tailored by topic relevance
 */
export async function buildKnowledgeContext(topic = '') {
  const brain = await loadBrain();
  const voice = await loadVoice();
  
  if (!topic) return brain;

  // If topic relates to specific themes, prioritize those sections
  const topicLower = topic.toLowerCase();
  const themeMap = {
    'đầu tư|invest|cổ phiếu|chứng khoán|stock': 'THEME 2',
    'tiền|money|tài chính|giàu|wealth|fastlane': 'THEME 1',
    'tâm lý|psychology|thiên kiến|bias|quyết định': 'THEME 3',
    'thuyết phục|persuasion|marketing|bán hàng': 'THEME 4',
    'startup|khởi nghiệp|kinh doanh|business': 'THEME 5',
    'quản lý|leadership|lãnh đạo|team': 'THEME 6',
    'kỷ luật|habit|năng suất|deep work': 'THEME 7',
    'cảm xúc|EQ|giao tiếp|communication': 'THEME 8',
  };

  // Find matching themes
  const relevantThemes = [];
  for (const [pattern, theme] of Object.entries(themeMap)) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(topicLower)) {
      relevantThemes.push(theme);
    }
  }

  // Always include hooks and mental model map
  let context = '';
  
  if (relevantThemes.length > 0) {
    context += `[RELEVANT KNOWLEDGE for topic "${topic}"]\n\n`;
    // Extract relevant sections from BRAIN.md
    for (const theme of relevantThemes) {
      const themeRegex = new RegExp(`## ${theme}[\\s\\S]*?(?=## THEME|## TOP|## MENTAL|$)`, 'g');
      const themeMatch = brain.match(themeRegex);
      if (themeMatch) {
        context += themeMatch[0] + '\n\n';
      }
    }
  }

  // Always append hooks
  const hooksSection = brain.match(/## TOP 20 VIRAL HOOKS[\s\S]*?(?=## MENTAL|$)/);
  if (hooksSection) {
    context += hooksSection[0] + '\n';
  }

  // Always append mental model
  const modelSection = brain.match(/## MENTAL MODEL MAP[\s\S]*/);
  if (modelSection) {
    context += modelSection[0] + '\n';
  }

  // Search transcripts for relevant reference videos (ALL SOURCES)
  const transcriptResults = topic ? await searchTranscripts(topic, 4) : [];
  const transcriptContext = transcriptResults.length > 0
    ? transcriptResults.map(t => 
        `[Video: ${t.title} (${t.sourceLabel} | ${t.category}, ${t.viewCount} views)]\n${t.excerpt}`
      ).join('\n\n')
    : '';
  
  if (transcriptContext) {
    context += `\n[REFERENCE VIDEOS — 815 videos across 4 channels]\n${transcriptContext}\n`;
  }

  const combined = `${voice ? `[VOICE DNA]\n${voice}\n\n` : ''}${context || brain}`;
  return combined; // Fallback to full brain if no match
}

export default {
  loadBrain,
  loadVoice,
  loadBooks,
  searchBooks,
  searchBrain,
  getBooksByCategory,
  getRandomHook,
  buildKnowledgeContext,
  loadTranscriptIndex,
  searchTranscripts,
  getTranscriptsByCategory,
  loadTranscript,
  getKnowledgeStats,
  SOURCES,
};
