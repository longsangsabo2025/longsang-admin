/**
 * YouTube Pipeline API — HTTP Server Wrapper
 *
 * Thin Express layer around the existing Conductor pipeline.
 * Designed to run locally or on Render (Docker / worker service).
 *
 * Routes:
 *   GET  /health                       → liveness check
 *   POST /api/youtube-crew/trigger     → start podcast pipeline
 *   GET  /api/youtube-crew/status/:id  → pipeline run status
 *   POST /api/youtube-crew/shorts-batch → start shorts batch
 */
import 'dotenv/config';
import express from 'express';
import { Conductor } from './core/conductor.js';
import { HarvesterAgent } from './agents/harvester.js';
import { BrainCuratorAgent } from './agents/brain-curator.js';
import { ScriptWriterAgent } from './agents/script-writer.js';
import { VoiceProducerAgent } from './agents/voice-producer.js';
import { VisualDirectorAgent } from './agents/visual-director.js';
import { VideoComposerAgent } from './agents/video-composer.js';
import { PublisherAgent } from './agents/publisher.js';
import { ShortsScriptWriterAgent } from './agents/shorts-script-writer.js';
import { youtubePodcastPipeline } from './pipelines/youtube-podcast.js';
import { youtubeShortsPipeline } from './pipelines/youtube-shorts.js';
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  getKnowledgeStats,
  loadTranscriptIndex,
  searchTranscripts,
  loadTranscript,
  getTranscriptsByCategory,
  loadBrain,
  loadVoice,
  searchBrain,
  searchBooks,
} from './knowledge/loader.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Read version from package.json ──────────────
let PKG_VERSION = '0.1.0';
try {
  const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));
  PKG_VERSION = pkg.version || PKG_VERSION;
} catch { /* fallback */ }

// ─── Bootstrap Conductor (singleton) ─────────────
function createConductor() {
  const conductor = new Conductor();

  const agents = [
    new HarvesterAgent(),
    new BrainCuratorAgent(),
    new ScriptWriterAgent(),
    new ShortsScriptWriterAgent(),
    new VoiceProducerAgent(),
    new VisualDirectorAgent(),
    new VideoComposerAgent(),
    new PublisherAgent(),
  ];

  for (const agent of agents) {
    conductor.registerAgent(agent);
  }

  conductor.registerPipeline(youtubePodcastPipeline);
  conductor.registerPipeline(youtubeShortsPipeline);

  return conductor;
}

const conductor = createConductor();
const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3001;
const startedAt = Date.now();

// ─── Middleware ───────────────────────────────────
app.use(express.json());

// Simple request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ─── Routes ──────────────────────────────────────

/**
 * GET /health — Liveness probe
 */
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.round((Date.now() - startedAt) / 1000),
    version: PKG_VERSION,
    activeRuns: conductor.activeRuns.size,
  });
});

/**
 * POST /api/youtube-crew/trigger — Start a podcast pipeline
 *
 * Body: { videoUrl?, topic?, channel?, latest?, dryRun?, maxCost? }
 */
app.post('/api/youtube-crew/trigger', async (req, res) => {
  try {
    const { videoUrl, topic, channel, latest, dryRun, maxCost, resume } = req.body || {};

    if (!videoUrl && !topic && !channel && !resume) {
      return res.status(400).json({
        error: 'Missing input. Provide at least one of: videoUrl, topic, channel, or resume.',
      });
    }

    const input = {};
    if (videoUrl) input.videoUrl = videoUrl;
    if (topic) input.topic = topic;
    if (channel) input.channel = channel;
    if (latest) input.latest = true;
    if (dryRun) input.dryRun = true;

    const opts = {};
    if (resume) opts.resume = resume;
    if (maxCost) opts.maxCost = parseFloat(maxCost);

    // Fire-and-forget: return the run ID immediately, execute in background
    const pipelinePromise = conductor.executePipeline('youtube-podcast', input, opts);

    // Wait briefly to get the run info from activeRuns
    await new Promise((r) => setTimeout(r, 100));

    // Find the latest run
    const runs = [...conductor.activeRuns.values()];
    const latestRun = runs[runs.length - 1];

    res.status(202).json({
      message: 'Pipeline started',
      runId: latestRun?.id || null,
      pipelineId: latestRun?.pipelineId || null,
    });

    // Let the pipeline continue in the background
    pipelinePromise.catch((err) => {
      console.error(`[Pipeline Error] ${latestRun?.pipelineId}: ${err.message}`);
    });
  } catch (err) {
    console.error('[Trigger Error]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/youtube-crew/status/:id — Get pipeline run status
 *
 * :id can be a runId or pipelineId
 */
app.get('/api/youtube-crew/status/:id', (req, res) => {
  const { id } = req.params;

  // Try direct runId lookup
  let run = conductor.activeRuns.get(id);

  // Try pipelineId lookup
  if (!run) {
    for (const r of conductor.activeRuns.values()) {
      if (r.pipelineId === id) {
        run = r;
        break;
      }
    }
  }

  if (!run) {
    return res.status(404).json({ error: `Run not found: ${id}` });
  }

  res.json({
    runId: run.id,
    pipelineId: run.pipelineId,
    pipelineName: run.pipelineName,
    status: run.status,
    durationMs: run.durationMs || Date.now() - run.startTime,
    totalCost: run.totalCost ?? null,
    stageResults: run.stageResults,
    errors: run.errors,
  });
});

/**
 * POST /api/youtube-crew/shorts-batch — Start a batch of shorts pipelines
 *
 * Body: { topics: string[], maxCost?, dryRun? }
 */
app.post('/api/youtube-crew/shorts-batch', async (req, res) => {
  try {
    const { topics, maxCost, dryRun } = req.body || {};

    if (!Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({ error: 'Provide a non-empty "topics" array.' });
    }

    const batchId = `shorts-batch-${Date.now()}`;
    const results = [];

    for (const topic of topics) {
      const input = { topic };
      if (dryRun) input.dryRun = true;

      const opts = {};
      if (maxCost) opts.maxCost = parseFloat(maxCost);

      // Fire each pipeline (non-blocking)
      const promise = conductor.executePipeline('youtube-shorts', input, opts);

      // Brief wait to capture run info
      await new Promise((r) => setTimeout(r, 100));
      const runs = [...conductor.activeRuns.values()];
      const latestRun = runs[runs.length - 1];

      results.push({
        topic,
        runId: latestRun?.id || null,
        pipelineId: latestRun?.pipelineId || null,
      });

      // Let it run in background
      promise.catch((err) => {
        console.error(`[Shorts Error] ${topic}: ${err.message}`);
      });
    }

    res.status(202).json({
      message: `Shorts batch started: ${topics.length} topics`,
      batchId,
      runs: results,
    });
  } catch (err) {
    console.error('[Shorts Batch Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Serve Admin UI static files ─────────────────
app.use('/admin', express.static(join(__dirname, '..', 'admin-ui')));

// ─── Admin API Routes ────────────────────────────

/**
 * GET /api/admin/stats — Knowledge base overview stats
 */
app.get('/api/admin/stats', async (_req, res) => {
  try {
    const stats = await getKnowledgeStats();
    // Add pipeline runs info
    const runs = [...conductor.activeRuns.values()];
    const completedRuns = runs.filter(r => r.status === 'completed');
    const failedRuns = runs.filter(r => r.status === 'failed');
    
    // Check output directory for generated videos
    const outputDir = join(__dirname, '..', 'output');
    let videoCount = 0;
    try {
      if (existsSync(outputDir)) {
        const outputDirs = readdirSync(outputDir).filter(f => {
          const fp = join(outputDir, f);
          return statSync(fp).isDirectory();
        });
        videoCount = outputDirs.length;
      }
    } catch {}
    
    res.json({
      ...stats,
      pipeline: {
        activeRuns: conductor.activeRuns.size,
        completedRuns: completedRuns.length,
        failedRuns: failedRuns.length,
      },
      videosGenerated: videoCount,
      uptime: Math.round((Date.now() - startedAt) / 1000),
      version: PKG_VERSION,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/knowledge/videos — List all videos (paginated)
 * Query: ?source=&category=&q=&page=1&limit=50
 */
app.get('/api/admin/knowledge/videos', async (req, res) => {
  try {
    const { source, category, q, page = 1, limit = 50 } = req.query;
    
    if (q) {
      // Search mode
      const results = await searchTranscripts(q, parseInt(limit), source || null);
      return res.json({ videos: results, total: results.length, page: 1, query: q });
    }
    
    const index = await loadTranscriptIndex(source || null);
    let videos = index.videos;
    
    // Filter by category
    if (category) {
      videos = videos.filter(v => v.category === category);
    }
    
    // Sort by views descending
    videos.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    
    // Paginate
    const start = (parseInt(page) - 1) * parseInt(limit);
    const paginated = videos.slice(start, start + parseInt(limit));
    
    res.json({
      videos: paginated.map(v => ({
        videoId: v.videoId,
        title: v.title,
        category: v.category,
        source: v.source,
        sourceLabel: v.sourceLabel,
        viewCount: v.viewCount,
        file: v.file,
      })),
      total: videos.length,
      page: parseInt(page),
      totalPages: Math.ceil(videos.length / parseInt(limit)),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/knowledge/video/:videoId — Get full transcript
 */
app.get('/api/admin/knowledge/video/:videoId', async (req, res) => {
  try {
    const transcript = await loadTranscript(req.params.videoId);
    if (!transcript) return res.status(404).json({ error: 'Video not found' });
    res.json(transcript);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/knowledge/brain — Get BRAIN.md content
 */
app.get('/api/admin/knowledge/brain', async (_req, res) => {
  try {
    const brain = await loadBrain();
    const voice = await loadVoice();
    res.json({ brain, voice, brainSize: brain.length, voiceSize: voice.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/knowledge/search — Search across all knowledge
 * Query: ?q=keyword&source=&maxResults=10
 */
app.get('/api/admin/knowledge/search', async (req, res) => {
  try {
    const { q, source, maxResults = 10 } = req.query;
    if (!q) return res.status(400).json({ error: 'Missing query parameter "q"' });
    
    const [transcripts, books, brainExcerpt] = await Promise.all([
      searchTranscripts(q, parseInt(maxResults), source || null),
      searchBooks(q, 5),
      searchBrain(q, 2000),
    ]);
    
    res.json({ transcripts, books, brainExcerpt, query: q });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/pipeline/runs — List pipeline runs
 */
app.get('/api/admin/pipeline/runs', (_req, res) => {
  const runs = [...conductor.activeRuns.values()].map(r => ({
    runId: r.id,
    pipelineId: r.pipelineId,
    pipelineName: r.pipelineName,
    status: r.status,
    durationMs: r.durationMs || Date.now() - r.startTime,
    totalCost: r.totalCost ?? null,
    stageResults: r.stageResults ? Object.keys(r.stageResults) : [],
    errors: r.errors,
  }));
  res.json({ runs, total: runs.length });
});

/**
 * GET /api/admin/outputs — List generated videos
 */
app.get('/api/admin/outputs', (_req, res) => {
  try {
    const outputDir = join(__dirname, '..', 'output');
    if (!existsSync(outputDir)) return res.json({ outputs: [], total: 0 });
    
    // Internal/system directories to exclude from output listing
    const INTERNAL_DIRS = new Set(['.checkpoints', '_stage_tests', '_pre_generated', '_batch', '_video-factory']);
    
    const outputs = [];
    
    // 1) Main pipeline outputs (youtube-podcast_*, standalone_*)
    const topDirs = readdirSync(outputDir).filter(f => {
      const fp = join(outputDir, f);
      return statSync(fp).isDirectory() && !INTERNAL_DIRS.has(f);
    });
    
    for (const dir of topDirs) {
      const dirPath = join(outputDir, dir);
      const files = readdirSync(dirPath).filter(f => !statSync(join(dirPath, f)).isDirectory());
      const hasVideo = files.some(f => f.endsWith('.mp4'));
      const hasScript = files.some(f => f === 'script.txt' || f === 'script.json');
      const hasAudio = readdirSync(dirPath).some(f => f === 'audio');
      
      // Extract title from metadata or script
      let title = dir;
      let metadata = null;
      const metaFile = files.find(f => f === 'metadata.json');
      if (metaFile) {
        try {
          metadata = JSON.parse(readFileSync(join(dirPath, metaFile), 'utf-8'));
          // Handle nested metadata structure: metadata.metadata.youtube.title
          title = metadata?.metadata?.youtube?.title || metadata?.title || dir;
        } catch {}
      }
      if (title === dir) {
        const scriptMeta = files.find(f => f === 'script.json');
        if (scriptMeta) {
          try { title = JSON.parse(readFileSync(join(dirPath, scriptMeta), 'utf-8'))?.title || dir; } catch {}
        }
      }
      
      outputs.push({
        id: dir,
        type: dir.startsWith('youtube-podcast') ? 'pipeline' : 'standalone',
        title,
        files,
        hasVideo,
        hasScript,
        hasAudio,
        metadata,
        createdAt: statSync(dirPath).mtime.toISOString(),
      });
    }
    
    // 2) Video Factory scripts (from ✍️ Tạo Script & tools/video-factory)
    const vfDir = join(outputDir, '_video-factory');
    if (existsSync(vfDir)) {
      const vfDirs = readdirSync(vfDir).filter(f => statSync(join(vfDir, f)).isDirectory());
      for (const dir of vfDirs) {
        const dirPath = join(vfDir, dir);
        const files = readdirSync(dirPath).filter(f => !statSync(join(dirPath, f)).isDirectory());
        let title = dir.replace(/_\d+$/, '').replace(/-/g, ' ');
        const scriptMeta = files.find(f => f === 'script.json');
        if (scriptMeta) {
          try { title = JSON.parse(readFileSync(join(dirPath, scriptMeta), 'utf-8'))?.title || title; } catch {}
        }
        outputs.push({
          id: `_video-factory/${dir}`,
          type: 'script',
          title,
          files,
          hasVideo: false,
          hasScript: files.some(f => f === 'script.txt'),
          hasAudio: false,
          metadata: null,
          createdAt: statSync(dirPath).mtime.toISOString(),
        });
      }
    }
    
    // 3) Batch results
    const batchDir = join(outputDir, '_batch');
    if (existsSync(batchDir)) {
      const batchDirs = readdirSync(batchDir).filter(f => statSync(join(batchDir, f)).isDirectory());
      for (const dir of batchDirs) {
        const dirPath = join(batchDir, dir);
        const files = readdirSync(dirPath).filter(f => !statSync(join(dirPath, f)).isDirectory());
        const scriptFiles = files.filter(f => f.endsWith('.txt'));
        let report = null;
        if (files.includes('_report.json')) {
          try { report = JSON.parse(readFileSync(join(dirPath, '_report.json'), 'utf-8')); } catch {}
        }
        outputs.push({
          id: `_batch/${dir}`,
          type: 'batch',
          title: `Batch: ${scriptFiles.length} scripts`,
          files,
          hasVideo: false,
          hasScript: scriptFiles.length > 0,
          hasAudio: false,
          metadata: report,
          createdAt: statSync(dirPath).mtime.toISOString(),
        });
      }
    }
    
    // Sort newest first
    outputs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({ outputs, total: outputs.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Content Calendar API ────────────────────────
const CALENDAR_PATH = join(__dirname, '..', 'data', 'calendar.json');

function loadCalendar() {
  try {
    if (existsSync(CALENDAR_PATH)) {
      return JSON.parse(readFileSync(CALENDAR_PATH, 'utf-8'));
    }
  } catch {}
  return { version: 1, settings: {}, schedule: [], history: [] };
}

function saveCalendar(cal) {
  const dir = join(__dirname, '..', 'data');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  cal.lastUpdated = new Date().toISOString();
  writeFileSync(CALENDAR_PATH, JSON.stringify(cal, null, 2), 'utf-8');
}

/**
 * GET /api/admin/calendar — Get full calendar
 */
app.get('/api/admin/calendar', (_req, res) => {
  try {
    const cal = loadCalendar();
    res.json(cal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/calendar/add — Add scheduled item
 * Body: { title, description?, category?, scheduledDate, scheduledTime? }
 */
app.post('/api/admin/calendar/add', (req, res) => {
  try {
    const { title, description, category, scheduledDate, scheduledTime } = req.body;
    if (!title || !scheduledDate) {
      return res.status(400).json({ error: 'title and scheduledDate required' });
    }
    const cal = loadCalendar();
    const item = {
      id: `cal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title,
      description: description || '',
      category: category || 'general',
      scheduledDate,
      scheduledTime: scheduledTime || cal.settings?.publishTime || '18:00',
      status: 'planned',       // planned → generating → generated → published
      scriptFile: null,
      createdAt: new Date().toISOString(),
    };
    cal.schedule.push(item);
    saveCalendar(cal);
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/admin/calendar/update/:id — Update a scheduled item
 */
app.put('/api/admin/calendar/update/:id', (req, res) => {
  try {
    const cal = loadCalendar();
    const idx = cal.schedule.findIndex(s => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    cal.schedule[idx] = { ...cal.schedule[idx], ...req.body, id: req.params.id };
    saveCalendar(cal);
    res.json({ success: true, item: cal.schedule[idx] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/admin/calendar/delete/:id — Remove a scheduled item
 */
app.delete('/api/admin/calendar/delete/:id', (req, res) => {
  try {
    const cal = loadCalendar();
    const idx = cal.schedule.findIndex(s => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const removed = cal.schedule.splice(idx, 1)[0];
    cal.history.push({ ...removed, removedAt: new Date().toISOString() });
    saveCalendar(cal);
    res.json({ success: true, removed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/admin/calendar/settings — Update calendar settings
 */
app.put('/api/admin/calendar/settings', (req, res) => {
  try {
    const cal = loadCalendar();
    cal.settings = { ...cal.settings, ...req.body };
    saveCalendar(cal);
    res.json({ success: true, settings: cal.settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Script Generation API (from Admin) ──────────
/**
 * POST /api/admin/generate-script — Generate a single script
 * Body: { topic, model? }
 */
app.post('/api/admin/generate-script', async (req, res) => {
  try {
    const t0 = Date.now();
    const { topic, model, tone, customPrompt, wordTarget } = req.body;
    if (!topic) return res.status(400).json({ error: 'topic required' });

    const scriptModel = model || process.env.SCRIPT_WRITER_MODEL || 'gemini-2.0-flash';
    const targetWords = wordTarget || 2500;

    // Build knowledge context — parallel loading for speed
    const t1 = Date.now();
    let knowledgeBlock = '';
    let voiceText = '';
    try {
      const [brainCtx, books, transcripts, voice] = await Promise.allSettled([
        searchBrain(topic, 2000),
        searchBooks(topic, 2),
        searchTranscripts(topic, 2),
        loadVoice(),
      ]);
      const brainVal = brainCtx.status === 'fulfilled' ? brainCtx.value : '';
      const booksVal = books.status === 'fulfilled' ? books.value : [];
      const transVal = transcripts.status === 'fulfilled' ? transcripts.value : [];
      voiceText = voice.status === 'fulfilled' ? voice.value.substring(0, 1500) : '';
      knowledgeBlock = [
        brainVal ? `[BRAIN]\n${brainVal}` : '',
        booksVal.length ? `[SÁCH]\n${booksVal.map(b => `${b.title}: ${b.excerpt}`).join('\n')}` : '',
        transVal.length ? `[VIDEO]\n${transVal.map(t => `${t.title}: ${t.excerpt}`).join('\n')}` : '',
      ].filter(Boolean).join('\n\n');
    } catch {}
    console.log(`[Script] Knowledge loaded in ${Date.now() - t1}ms`);

    const t2 = Date.now();
    const { chat: llmChat, estimateCost: estCost } = await import('./core/llm.js');
    // Build system prompt from tone + custom prompt
    const toneMap = {
      'dark-philosophical': 'Giọng: Triết gia bóng tối. Đầy uy lực, mỗi câu như một cú đấm vào tâm trí.',
      'motivational': 'Giọng: Motivational speaker. Truyền cảm hứng mạnh mẽ, năng lượng tích cực.',
      'storytelling': 'Giọng: Storyteller. Kể chuyện cuốn hút, thân mật như mentor chia sẻ ở quán cà phê.',
      'educational': 'Giọng: Giáo viên chuyên nghiệp. Rõ ràng, dễ hiểu, có hệ thống.',
      'humorous': 'Giọng: Hài hước, châm biếm thông minh. Dùng ví dụ vui nhưng sâu sắc.',
    };
    const toneInstruction = toneMap[tone] || toneMap['dark-philosophical'];
    const customBlock = customPrompt ? `\n\n## CUSTOM INSTRUCTIONS\n${customPrompt}` : '';

    const systemPrompt = `Bạn là Script Writer chuyên nghiệp. ${toneInstruction} TỐI THIỂU: ${targetWords} từ.${customBlock}`;

    const result = await llmChat({
      model: scriptModel,
      systemPrompt,
      userMessage: `Viết script podcast: "${topic}"\n\n--- VOICE ---\n${voiceText}\n\n--- KNOWLEDGE ---\n${knowledgeBlock}\n\nFormat: --- [TIMESTAMP] SECTION --- (HOOK, SIGNATURE_INTRO, BOI_CANH, GIAI_PHAU, TWIST, DUNG_DAY, KET)\n\nWord target: ${targetWords} từ.`,
      temperature: 0.85,
      maxTokens: 16384,
      agentId: 'admin-script-gen',
    });
    console.log(`[Script] LLM done in ${Date.now() - t2}ms | Total: ${Date.now() - t0}ms`);

    // Save to output
    const slug = topic.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]/g, '-').substring(0, 50);
    const outDir = join(__dirname, '..', 'output', '_video-factory', `${slug}_${Date.now()}`);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'script.txt'), result.content, 'utf-8');
    writeFileSync(join(outDir, 'script.json'), JSON.stringify({
      title: topic,
      model: scriptModel,
      wordCount: result.content.split(/\s+/).filter(Boolean).length,
      tokens: result.tokens,
      cost: estCost(scriptModel, result.tokens.input, result.tokens.output),
      generatedAt: new Date().toISOString(),
    }, null, 2), 'utf-8');

    const wordCount = result.content.split(/\s+/).filter(Boolean).length;
    const cost = estCost(scriptModel, result.tokens.input, result.tokens.output);

    res.json({
      success: true,
      title: topic,
      script: result.content,
      wordCount,
      tokens: result.tokens,
      cost,
      model: scriptModel,
      outputDir: outDir,
    });
  } catch (err) {
    console.error('[Generate Error]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/generate-storyboard — Generate storyboard from script
 * Body: { script, topic?, scenes?, duration?, style? }
 */
app.post('/api/admin/generate-storyboard', async (req, res) => {
  try {
    const { script, topic, scenes = 12, duration = 6, style = 'Dark Cinematic', aspectRatio, visualIdentity, customPrompt: sbCustomPrompt } = req.body;
    if (!script) return res.status(400).json({ error: 'script required' });

    const storyboardModel = process.env.DEFAULT_MODEL || 'gpt-4o-mini';

    // Build visual identity block from UI config
    const vi = visualIdentity || {};
    const viBlock = vi.colorPalette ? `\n## VISUAL IDENTITY (Maintain consistency across ALL scenes)\n- Color Palette: ${vi.colorPalette}\n- Lighting: ${vi.lighting || 'cinematic'}\n- Camera: ${vi.cameraStyle || 'close-up focus'}\n- Character: ${vi.characterPresence === 'none' ? 'No characters' : `${vi.characterPresence}${vi.characterDesc ? ' — ' + vi.characterDesc : ''}`}\n- Environment: ${vi.environment || 'varies'}\n- Mood: ${vi.moodKeywords || 'cinematic, dramatic'}\n- Negative (AVOID): ${vi.negativePrompt || 'text, watermark, logo'}\n` : '';
    const sbCustomBlock = sbCustomPrompt ? `\n## CUSTOM STORYBOARD INSTRUCTIONS\n${sbCustomPrompt}\n` : '';
    const arBlock = aspectRatio ? `Aspect ratio: ${aspectRatio}. ` : '';

    const STORYBOARD_PROMPT = `You are a Visual Director — you design the visual layer for podcast-style YouTube videos.

## YOUR MISSION
Create a visual storyboard for a podcast video.  
Each scene = ~${duration}s of footage. Create exactly ${scenes} scenes.
Style: ${style}. ${arBlock}Language: Vietnamese.
${viBlock}${sbCustomBlock}

## OUTPUT FORMAT (JSON only, no markdown)
{
  "scenes": [
    {
      "scene": 1,
      "timestamp": "0:00-0:${String(duration).padStart(2, '0')}",
      "scriptSection": "hook",
      "dialogue": "Exact Vietnamese narration for this segment",
      "prompt": "Hailuo 2.3 prompt: [Subject] + [Action] + [Camera] + [Style] — cinematic, 4K",
      "motion": "slow zoom in",
      "transition": "fade through black",
      "duration": ${duration}
    }
  ],
  "thumbnail": {
    "concept": "Thumbnail description",
    "textOverlay": "Main text on thumbnail (max 6 words)",
    "mood": "dramatic"
  },
  "style": { "name": "${style}", "colorDesc": "dark tones with gold accents", "moodWords": "mysterious, powerful" },
  "config": { "scenes": ${scenes}, "duration": ${duration} },
  "totalScenes": ${scenes}
}

## RULES
- Each scene MUST have a detailed Hailuo 2.3 image/video prompt (English)
- dialogue must be the exact Vietnamese text spoken during that scene
- prompt must be specific: subject, action, camera angle, lighting, style
- motion: slow zoom in, pan left, dolly forward, static, etc.
- transition: fade, cut, dissolve, zoom transition
- ALWAYS output valid JSON only (no markdown code blocks)`;

    const { chat: llmChat, estimateCost: estCost } = await import('./core/llm.js');
    const result = await llmChat({
      model: storyboardModel,
      systemPrompt: STORYBOARD_PROMPT,
      userMessage: `Create a ${scenes}-scene storyboard for this script:\n\nTOPIC: ${topic || 'N/A'}\n\nSCRIPT:\n${script.substring(0, 12000)}`,
      temperature: 0.8,
      maxTokens: 8192,
      agentId: 'admin-storyboard-gen',
    });

    // Parse JSON from response
    let storyboard;
    try {
      const cleaned = result.content.replace(/```json\n?/g, '').replace(/```/g, '').trim();
      storyboard = JSON.parse(cleaned);
    } catch {
      // Try to extract JSON from response
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        storyboard = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse storyboard JSON from AI response');
      }
    }

    // Generate prompts.txt (one prompt per line)
    const promptsTxt = (storyboard.scenes || [])
      .map((s, i) => `[Scene ${i + 1}] ${s.prompt}`)
      .join('\n\n');

    // Generate storyboard.md (markdown table)
    const storyboardMd = [
      `# Storyboard — ${topic || 'Video'}`,
      `Style: ${style} | Scenes: ${scenes} | Duration: ${duration}s each\n`,
      '| Scene | Timestamp | Dialogue | Prompt | Motion | Transition |',
      '|-------|-----------|----------|--------|--------|------------|',
      ...(storyboard.scenes || []).map(s =>
        `| ${s.scene} | ${s.timestamp || ''} | ${(s.dialogue || '').substring(0, 60)}... | ${(s.prompt || '').substring(0, 80)}... | ${s.motion || ''} | ${s.transition || ''} |`
      ),
      '',
      '## Hailuo 2.3 Prompts (Copy-Paste Ready)\n',
      ...(storyboard.scenes || []).map((s, i) =>
        `### Scene ${i + 1}\n\`\`\`\n${s.prompt}\n\`\`\`\n`
      ),
    ].join('\n');

    // Save to output
    const slug = (topic || 'storyboard').replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]/g, '-').substring(0, 50);
    const outDir = join(__dirname, '..', 'output', '_video-factory', `${slug}_${Date.now()}`);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'storyboard.json'), JSON.stringify(storyboard, null, 2), 'utf-8');
    writeFileSync(join(outDir, 'storyboard.md'), storyboardMd, 'utf-8');
    writeFileSync(join(outDir, 'prompts.txt'), promptsTxt, 'utf-8');

    const cost = estCost(storyboardModel, result.tokens.input, result.tokens.output);

    res.json({
      success: true,
      storyboard,
      storyboardMd,
      promptsTxt,
      scenes: storyboard.scenes?.length || 0,
      tokens: result.tokens,
      cost,
      model: storyboardModel,
      outputDir: outDir,
    });
  } catch (err) {
    console.error('[Storyboard Error]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/batch-generate — Generate multiple scripts
 * Body: { topics: string[], auto?: number, concurrency?: number }
 */
app.post('/api/admin/batch-generate', async (req, res) => {
  try {
    const { topics, auto, concurrency = 1 } = req.body;
    let topicList = [];

    if (auto && auto > 0) {
      // Auto-generate topics
      const { chat: llmChat } = await import('./core/llm.js');
      const brain = await loadBrain();
      const genModel = process.env.DEFAULT_MODEL || 'gemini-2.0-flash';
      const result = await llmChat({
        model: genModel,
        systemPrompt: 'Content Strategist for "ĐỨNG DẬY ĐI" YouTube channel.',
        userMessage: `Đề xuất ${auto} chủ đề video mới, độc đáo, gây tò mò. Output JSON: { "topics": [{ "title": "...", "category": "..." }] }`,
        temperature: 0.9,
        maxTokens: 2048,
        responseFormat: 'json',
        agentId: 'admin-auto-topics',
      });
      try {
        const parsed = JSON.parse(result.content);
        topicList = (parsed.topics || []).map(t => t.title || t);
      } catch { topicList = []; }
    } else if (Array.isArray(topics) && topics.length > 0) {
      topicList = topics;
    } else {
      return res.status(400).json({ error: 'Provide topics array or auto count' });
    }

    // Start batch in background
    const batchId = `batch_${Date.now()}`;
    const batchDir = join(__dirname, '..', 'output', '_batch', batchId);
    mkdirSync(batchDir, { recursive: true });

    // Return immediately
    res.json({
      success: true,
      batchId,
      topics: topicList,
      total: topicList.length,
      status: 'started',
      message: `Batch started: ${topicList.length} scripts`,
    });

    // Generate in background (don't await)
    (async () => {
      const { chat: llmChat, estimateCost: estCost } = await import('./core/llm.js');
      const results = [];
      
      for (let i = 0; i < topicList.length; i++) {
        const topic = topicList[i];
        try {
          let knowledge = '';
          try {
            const brainCtx = await searchBrain(topic, 1500);
            knowledge = brainCtx || '';
          } catch {}

          const scriptModel = process.env.SCRIPT_WRITER_MODEL || 'gemini-2.0-flash';
          const result = await llmChat({
            model: scriptModel,
            systemPrompt: 'Script Writer cho "ĐỨNG DẬY ĐI". Tối thiểu 1800 từ.',
            userMessage: `Viết script podcast: "${topic}"\n\nKnowledge:\n${knowledge.substring(0, 2000)}\n\nFormat: --- [TIMESTAMP] SECTION ---`,
            temperature: 0.85,
            maxTokens: 16384,
            agentId: 'batch-gen',
          });

          const slug = topic.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]/g, '-').substring(0, 50);
          writeFileSync(join(batchDir, `${i + 1}_${slug}.txt`), result.content, 'utf-8');
          
          results.push({ title: topic, wordCount: result.content.split(/\s+/).length, status: 'success' });
          console.log(`[Batch ${batchId}] ${i + 1}/${topicList.length} ✅ ${topic}`);
        } catch (err) {
          results.push({ title: topic, error: err.message, status: 'failed' });
          console.error(`[Batch ${batchId}] ${i + 1}/${topicList.length} ❌ ${topic}: ${err.message}`);
        }
      }

      // Save report
      writeFileSync(join(batchDir, '_report.json'), JSON.stringify({
        batchId,
        completedAt: new Date().toISOString(),
        total: topicList.length,
        success: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'failed').length,
        results,
      }, null, 2), 'utf-8');
      console.log(`[Batch ${batchId}] Completed: ${results.filter(r => r.status === 'success').length}/${topicList.length}`);
    })().catch(err => console.error(`[Batch Error] ${batchId}: ${err.message}`));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/batches — List batch runs
 */
app.get('/api/admin/batches', (_req, res) => {
  try {
    const batchDir = join(__dirname, '..', 'output', '_batch');
    if (!existsSync(batchDir)) return res.json({ batches: [], total: 0 });

    const dirs = readdirSync(batchDir).filter(f => {
      const fp = join(batchDir, f);
      return statSync(fp).isDirectory();
    }).sort().reverse();

    const batches = dirs.map(dir => {
      const dirPath = join(batchDir, dir);
      const reportFile = join(dirPath, '_report.json');
      const batchReportFile = join(dirPath, '_batch-report.json');
      let report = null;
      
      if (existsSync(reportFile)) {
        try { report = JSON.parse(readFileSync(reportFile, 'utf-8')); } catch {}
      } else if (existsSync(batchReportFile)) {
        try { report = JSON.parse(readFileSync(batchReportFile, 'utf-8')); } catch {}
      }

      const files = readdirSync(dirPath).filter(f => f.endsWith('.txt'));

      return {
        id: dir,
        scripts: files.length,
        report,
        createdAt: statSync(dirPath).mtime.toISOString(),
      };
    });

    res.json({ batches, total: batches.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/script/:outputId — Read a generated script
 * Supports outputId like: youtube-podcast_xxx, _video-factory/dir, _batch/dir
 */
app.get('/api/admin/script/:outputId(*)', (req, res) => {
  try {
    const outputId = req.params.outputId;
    const outputBase = join(__dirname, '..', 'output');
    
    // Search in multiple locations
    const candidates = [
      join(outputBase, outputId),                          // direct (youtube-podcast_*, standalone_*)
      join(outputBase, '_video-factory', outputId),        // legacy single-segment lookup
      join(outputBase, '_batch', outputId),                // legacy single-segment lookup
    ];
    
    for (const dir of candidates) {
      if (!existsSync(dir)) continue;
      
      // For batch dirs, list all script files
      const files = readdirSync(dir).filter(f => !statSync(join(dir, f)).isDirectory());
      const scriptFile = files.find(f => f === 'script.txt');
      const txtFiles = files.filter(f => f.endsWith('.txt') && f !== '_report.json');
      
      if (scriptFile) {
        // Single script output
        const script = readFileSync(join(dir, scriptFile), 'utf-8');
        let meta = null;
        if (files.includes('script.json')) {
          try { meta = JSON.parse(readFileSync(join(dir, 'script.json'), 'utf-8')); } catch {}
        }
        let pipelineMeta = null;
        if (files.includes('metadata.json')) {
          try { pipelineMeta = JSON.parse(readFileSync(join(dir, 'metadata.json'), 'utf-8')); } catch {}
        }
        let results = null;
        if (files.includes('results.json')) {
          try { results = JSON.parse(readFileSync(join(dir, 'results.json'), 'utf-8')); } catch {}
        }
        return res.json({
          script,
          metadata: meta,
          pipelineMeta,
          results,
          outputId,
          files,
          wordCount: script.split(/\s+/).filter(Boolean).length,
        });
      } else if (txtFiles.length > 0) {
        // Batch dir with multiple scripts
        const scripts = txtFiles.map(f => ({
          filename: f,
          content: readFileSync(join(dir, f), 'utf-8'),
          wordCount: readFileSync(join(dir, f), 'utf-8').split(/\s+/).filter(Boolean).length,
        }));
        let report = null;
        if (files.includes('_report.json')) {
          try { report = JSON.parse(readFileSync(join(dir, '_report.json'), 'utf-8')); } catch {}
        }
        return res.json({
          scripts,
          report,
          outputId,
          files,
          type: 'batch',
        });
      }
    }
    
    res.status(404).json({ error: 'Script not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Error handling middleware ────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// ─── Start server ────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`\n🚀 YouTube Pipeline API running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Env:    ${process.env.NODE_ENV || 'development'}\n`);
});

// ─── Graceful shutdown ───────────────────────────
function shutdown(signal) {
  console.log(`\n⏳ ${signal} received — shutting down gracefully...`);
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
  // Force exit after 10s
  setTimeout(() => {
    console.error('⚠️  Forced exit after timeout');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
