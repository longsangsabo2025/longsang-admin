/**
 * Auto-Seeder — Post-pipeline social media distribution & engagement seeding
 *
 * Fires after a YouTube video is uploaded. Two responsibilities:
 *   1. ANNOUNCE — Push the video to owned channels (Telegram, Twitter/X, Facebook, Reddit)
 *   2. SEED    — Buy initial engagement via forlike.pro (likes, views, comments)
 *
 * Config comes from .env (see .env.example for all vars).
 * Every action is logged to Supabase `seeding_log` table.
 */
import 'dotenv/config';

// ─── Platform Templates ─────────────────────────────────────────────────────

function telegramTemplate({ title, description, videoUrl, tags }) {
  const hashtags = (tags || []).slice(0, 5).map(t => `#${t.replaceAll(/\s+/g, '')}`).join(' ');
  return `🎬 *VIDEO MỚI*

📌 *${title}*

${(description || '').split('\n').slice(0, 4).join('\n')}

🔗 ${videoUrl}

${hashtags}

👉 Xem ngay & cho mình biết ý kiến của bạn nhé!`;
}

function twitterTemplate({ title, videoUrl, tags }) {
  const hashtags = (tags || []).slice(0, 3).map(t => `#${t.replaceAll(/\s+/g, '')}`).join(' ');
  const maxTitle = title.length > 120 ? title.substring(0, 117) + '...' : title;
  return `🎬 ${maxTitle}\n\n${videoUrl}\n\n${hashtags}`;
}

function facebookTemplate({ title, description, videoUrl, tags }) {
  const hashtags = (tags || []).slice(0, 8).map(t => `#${t.replaceAll(/\s+/g, '')}`).join(' ');
  return `🎬 VIDEO MỚI: ${title}

${(description || '').split('\n').slice(0, 6).join('\n')}

🔗 Xem ngay: ${videoUrl}

${hashtags}

Bạn nghĩ gì? Comment cho mình biết nhé! 👇`;
}

function redditTemplate({ title, videoUrl }) {
  return {
    title: `[Video] ${title}`,
    url: videoUrl,
    text: `Mình vừa ra video mới về chủ đề này. Xem và cho ý kiến nhé!\n\n${videoUrl}`,
  };
}

const TEMPLATES = {
  telegram: telegramTemplate,
  twitter: twitterTemplate,
  facebook: facebookTemplate,
  reddit: redditTemplate,
};

// ─── Platform Posters ────────────────────────────────────────────────────────

async function postToTelegram(content, config) {
  const { botToken, channelId } = config;
  if (!botToken || !channelId) return { skipped: true, reason: 'missing TELEGRAM_SEED_BOT_TOKEN or TELEGRAM_SEED_CHANNEL_ID' };

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: channelId,
      text: content,
      parse_mode: 'Markdown',
      disable_web_page_preview: false,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Telegram ${res.status}: ${body}`);
  }
  return await res.json();
}

async function postToTwitter(content, config) {
  const { bearerToken } = config;
  if (!bearerToken) return { skipped: true, reason: 'missing TWITTER_BEARER_TOKEN' };

  const res = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: content }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Twitter ${res.status}: ${body}`);
  }
  return await res.json();
}

async function postToFacebook(content, config) {
  const { pageToken, pageId } = config;
  if (!pageToken || !pageId) return { skipped: true, reason: 'missing FB_PAGE_TOKEN or FB_PAGE_ID' };

  const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: content,
      access_token: pageToken,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Facebook ${res.status}: ${body}`);
  }
  return await res.json();
}

async function postToReddit(content, config) {
  const { accessToken, subreddit } = config;
  if (!accessToken || !subreddit) return { skipped: true, reason: 'missing REDDIT_ACCESS_TOKEN or REDDIT_SUBREDDIT' };

  const res = await fetch('https://oauth.reddit.com/api/submit', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'AutoSeeder/1.0',
    },
    body: new URLSearchParams({
      kind: 'link',
      sr: subreddit,
      title: content.title,
      url: content.url,
      resubmit: 'true',
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Reddit ${res.status}: ${body}`);
  }
  return await res.json();
}

// ─── Forlike Engagement Seeding ──────────────────────────────────────────────

async function seedViaForlike(videoUrl, config) {
  const { forlikeToken, forlikeBaseUrl } = config;
  if (!forlikeToken) return { skipped: true, reason: 'missing FORLIKE_TOKEN' };

  const baseUrl = forlikeBaseUrl || 'http://my.forlike.pro';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${forlikeToken}`,
  };

  async function getServicePacks(urlService) {
    const res = await fetch(`${baseUrl}/api/service/${urlService}/packs`, { headers });
    if (!res.ok) throw new Error(`Forlike packs ${res.status}`);
    return await res.json();
  }

  async function createOrder(orderData) {
    const res = await fetch(`${baseUrl}/api/order/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(orderData),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Forlike order ${res.status}: ${body}`);
    }
    return await res.json();
  }

  const ytPreset = [
    { urlService: 'tang-like-youtube', role: 'like' },
    { urlService: 'tang-view-youtube', role: 'view' },
    { urlService: 'tang-comment-youtube', role: 'comment' },
  ];

  const results = [];
  for (const svc of ytPreset) {
    try {
      const packs = await getServicePacks(svc.urlService);
      const activePacks = (packs || []).filter(p => p.status === 1 && p.quantitymin > 0);
      if (!activePacks.length) {
        results.push({ role: svc.role, skipped: true, reason: 'no active packs' });
        continue;
      }
      activePacks.sort((a, b) => (a.quantitymin || 50) - (b.quantitymin || 50));
      const pack = activePacks[0];
      const qty = pack.quantitymin || 50;

      const orderData = { quantity: qty, uid: videoUrl, pack: pack.id || pack._id };
      if (svc.role === 'like') orderData.reaction = 'like';

      const result = await createOrder(orderData);
      results.push({ role: svc.role, success: true, orderId: result?.code || result?.orderId, qty });
    } catch (err) {
      results.push({ role: svc.role, success: false, error: err.message });
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  return results;
}

// ─── Supabase Logger ─────────────────────────────────────────────────────────

async function logToSupabase(entry) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) return;

  try {
    await fetch(`${url}/rest/v1/seeding_log`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(entry),
    });
  } catch (err) {
    console.warn(`[AutoSeeder] Supabase log failed: ${err.message}`);
  }
}

// ─── Main Entry Point ────────────────────────────────────────────────────────

function getPlatformConfigs() {
  return {
    telegram: {
      poster: postToTelegram,
      config: { botToken: process.env.TELEGRAM_SEED_BOT_TOKEN, channelId: process.env.TELEGRAM_SEED_CHANNEL_ID },
    },
    twitter: {
      poster: postToTwitter,
      config: { bearerToken: process.env.TWITTER_BEARER_TOKEN },
    },
    facebook: {
      poster: postToFacebook,
      config: { pageToken: process.env.FB_PAGE_TOKEN, pageId: process.env.FB_PAGE_ID },
    },
    reddit: {
      poster: postToReddit,
      config: { accessToken: process.env.REDDIT_ACCESS_TOKEN, subreddit: process.env.REDDIT_SUBREDDIT },
    },
  };
}

async function announceToplatforms(videoData, platforms, log) {
  const { title, description, videoUrl, tags } = videoData;
  const configs = getPlatformConfigs();
  const announceResults = {};

  for (const platform of platforms) {
    const tmpl = TEMPLATES[platform];
    const cfg = configs[platform];
    if (!tmpl || !cfg) continue;

    try {
      const content = tmpl({ title, description, videoUrl, tags });
      const result = await cfg.poster(content, cfg.config);
      announceResults[platform] = { success: !result.skipped, ...result };
      const msg = result.skipped ? 'skipped — ' + result.reason : 'posted successfully';
      log(`${platform}: ${msg}`, result.skipped ? 'warn' : 'info');
    } catch (err) {
      announceResults[platform] = { success: false, error: err.message };
      log(`${platform}: failed — ${err.message}`, 'error');
    }
  }
  return announceResults;
}

/**
 * @param {object} videoData
 * @param {string} videoData.videoUrl   — YouTube video URL
 * @param {string} videoData.videoId    — YouTube video ID
 * @param {string} videoData.title      — Video title
 * @param {string} videoData.description — Video description
 * @param {string[]} videoData.tags     — Video tags
 * @param {string} videoData.pipelineId — Pipeline run ID
 * @param {object} [opts]
 * @param {boolean} [opts.announce=true]  — Post to social channels
 * @param {boolean} [opts.seed=true]      — Buy engagement via forlike
 * @param {string[]} [opts.platforms]     — Subset of ['telegram','twitter','facebook','reddit']
 * @param {(msg: string, level?: string) => void} [opts.log] — Logger
 */
export async function autoSeed(videoData, opts = {}) {
  const { videoUrl, videoId, title, pipelineId } = videoData;
  const log = opts.log || ((msg) => console.log(`[AutoSeeder] ${msg}`));
  const platforms = opts.platforms || ['telegram', 'twitter', 'facebook', 'reddit'];

  if (!videoUrl) {
    log('No videoUrl provided — skipping auto-seed', 'warn');
    return { skipped: true, reason: 'no_video_url' };
  }

  log(`Starting auto-seed for: ${title || videoUrl}`, 'info');
  const results = { announce: {}, seed: null, timestamp: new Date().toISOString() };

  if (opts.announce !== false) {
    results.announce = await announceToplatforms(videoData, platforms, log);
  }

  // ─── 2. SEED engagement via forlike.pro ─────────────────────────────────
  if (opts.seed !== false) {
    try {
      results.seed = await seedViaForlike(videoUrl, {
        forlikeToken: process.env.FORLIKE_TOKEN,
        forlikeBaseUrl: process.env.FORLIKE_BASE_URL,
      });
      const seedSuccess = (results.seed || []).filter(r => r.success).length;
      log(`Forlike seeding: ${seedSuccess}/${(results.seed || []).length} orders placed`, 'info');
    } catch (err) {
      results.seed = { error: err.message };
      log(`Forlike seeding failed: ${err.message}`, 'error');
    }
  }

  // ─── 3. LOG to Supabase ─────────────────────────────────────────────────
  await logToSupabase({
    pipeline_id: pipelineId || null,
    video_id: videoId || null,
    video_url: videoUrl,
    video_title: title || null,
    platforms_announced: Object.keys(results.announce),
    announce_results: results.announce,
    seed_results: results.seed,
    created_at: results.timestamp,
  });

  log('Auto-seed complete', 'info');
  return results;
}

/**
 * Webhook handler — receives POST from n8n social-media-post trigger
 * Expected body: { videoUrl, videoTitle, topic, videoId, description, tags }
 */
export async function handleSeedWebhook(body) {
  return autoSeed({
    videoUrl: body.videoUrl || body.video_url,
    videoId: body.videoId || body.video_id,
    title: body.videoTitle || body.video_title || body.topic,
    description: body.description || '',
    tags: body.tags || [],
    pipelineId: body.pipelineId || body.pipeline_id,
  });
}

export default autoSeed;
