/**
 * YouTube Upload Utility — Standalone, reusable YouTube Data API v3 uploader
 *
 * Features:
 *   - OAuth2 authentication via env vars (YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN)
 *   - Resumable upload for large files
 *   - Exponential-backoff retry on transient errors
 *   - Thumbnail upload after video insert
 *   - Progress callback support
 *
 * Usage:
 *   import { uploadVideo, createOAuth2Client } from './utils/youtube-uploader.js';
 *   const result = await uploadVideo({ videoPath, title, description, tags });
 *   // → { videoId, videoUrl, uploadStatus }
 */
import { google } from 'googleapis';
import { createReadStream, existsSync, statSync } from 'fs';

const YOUTUBE_CATEGORIES = {
  Education: '27',
  Entertainment: '24',
  'People & Blogs': '22',
  'Science & Technology': '28',
  'News & Politics': '25',
  'Film & Animation': '1',
  'Music': '10',
  'Howto & Style': '26',
};

const DEFAULT_RETRY = { maxAttempts: 3, baseDelayMs: 2000 };

// ── OAuth2 Client ────────────────────────────────────────────────────────

/**
 * Create a Google OAuth2 client from environment variables.
 * Automatically refreshes expired access tokens using the refresh token.
 *
 * @param {object} [opts]
 * @param {string} [opts.clientId]       - defaults to YOUTUBE_CLIENT_ID
 * @param {string} [opts.clientSecret]   - defaults to YOUTUBE_CLIENT_SECRET
 * @param {string} [opts.refreshToken]   - defaults to YOUTUBE_REFRESH_TOKEN
 * @param {string} [opts.accessToken]    - defaults to YOUTUBE_ACCESS_TOKEN
 * @param {(msg: string) => void} [opts.onTokenRefresh] - callback when token refreshes
 * @returns {import('googleapis').Auth.OAuth2Client}
 */
export function createOAuth2Client(opts = {}) {
  const clientId = opts.clientId || process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = opts.clientSecret || process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = opts.refreshToken || process.env.YOUTUBE_REFRESH_TOKEN;
  const accessToken = opts.accessToken || process.env.YOUTUBE_ACCESS_TOKEN;

  if (!clientId || !clientSecret) {
    throw new Error(
      'YouTube OAuth2 requires YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET in .env'
    );
  }
  if (!refreshToken) {
    throw new Error(
      'YouTube OAuth2 requires YOUTUBE_REFRESH_TOKEN in .env (run OAuth flow once to obtain it)'
    );
  }

  const oauth2 = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'http://localhost:3000/oauth/callback'
  );

  oauth2.setCredentials({
    access_token: accessToken || undefined,
    refresh_token: refreshToken,
  });

  oauth2.on('tokens', (tokens) => {
    if (tokens.access_token) {
      process.env.YOUTUBE_ACCESS_TOKEN = tokens.access_token;
    }
    opts.onTokenRefresh?.(`Token refreshed, expires ${tokens.expiry_date}`);
  });

  return oauth2;
}

// ── Retry Helpers ────────────────────────────────────────────────────────

function isRetryable(error) {
  const code = error?.code || error?.response?.status;
  if ([408, 429, 500, 502, 503].includes(code)) return true;
  if (error.message?.includes('ECONNRESET')) return true;
  if (error.message?.includes('socket hang up')) return true;
  return false;
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function withRetry(fn, { maxAttempts, baseDelayMs } = DEFAULT_RETRY, log) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts && isRetryable(err)) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 500;
        log?.(`Attempt ${attempt}/${maxAttempts} failed (${err.code || err.message}), retrying in ${Math.round(delay)}ms...`);
        await sleep(delay);
      }
    }
  }
  throw lastError;
}

// ── Video Upload ─────────────────────────────────────────────────────────

/**
 * Upload a video to YouTube via the Data API v3 (resumable upload).
 *
 * @param {object} params
 * @param {string}   params.videoPath     - Absolute path to the video file
 * @param {string}   params.title         - Video title (max 100 chars)
 * @param {string}   [params.description] - Video description (max 5000 chars)
 * @param {string[]} [params.tags]        - Tags (max 30)
 * @param {string}   [params.thumbnailPath] - Path to thumbnail image (png/jpg)
 * @param {string}   [params.category]    - Category name (default: Education)
 * @param {string}   [params.privacy]     - private | unlisted | public (default: private)
 * @param {boolean}  [params.madeForKids] - COPPA flag (default: false)
 * @param {string}   [params.scheduledTime] - ISO 8601 publish time (makes video private + scheduled)
 * @param {string}   [params.language]    - Default language (default: vi)
 * @param {import('googleapis').Auth.OAuth2Client} [params.auth] - Pre-built OAuth2 client
 * @param {object}   [params.retry]       - { maxAttempts, baseDelayMs }
 * @param {(msg: string, level?: string) => void} [params.log] - Logger function
 * @param {(progress: { bytesRead: number, totalBytes: number, percent: number }) => void} [params.onProgress]
 * @returns {Promise<{ videoId: string, videoUrl: string, uploadStatus: string, thumbnailSet: boolean }>}
 */
export async function uploadVideo({
  videoPath,
  title,
  description = '',
  tags = [],
  thumbnailPath,
  category = 'Education',
  privacy = 'private',
  madeForKids = false,
  scheduledTime,
  language = 'vi',
  auth,
  retry = DEFAULT_RETRY,
  log = () => {},
  onProgress,
}) {
  // Validate inputs
  if (!videoPath || !existsSync(videoPath)) {
    throw new Error(`Video file not found: ${videoPath}`);
  }
  const fileSize = statSync(videoPath).size;
  if (fileSize === 0) {
    throw new Error(`Video file is empty: ${videoPath}`);
  }

  // Auth
  const oauthClient = auth || createOAuth2Client({ onTokenRefresh: log });

  // Force-refresh token before upload to avoid mid-upload expiry on large files
  try {
    const { token } = await oauthClient.getAccessToken();
    if (token) log('Access token verified/refreshed', 'info');
  } catch (e) {
    log(`Token pre-refresh failed: ${e.message} — proceeding anyway`, 'warn');
  }

  const youtube = google.youtube({ version: 'v3', auth: oauthClient });

  const categoryId = YOUTUBE_CATEGORIES[category] || YOUTUBE_CATEGORIES.Education;
  log(`Uploading ${(fileSize / 1024 / 1024).toFixed(1)} MB | privacy=${privacy} | category=${category} (${categoryId})`, 'info');

  // Build status object
  const statusObj = {
    privacyStatus: privacy,
    selfDeclaredMadeForKids: madeForKids,
  };
  if (scheduledTime) {
    statusObj.privacyStatus = 'private';
    statusObj.publishAt = scheduledTime;
  }

  // Resumable upload with retry
  const res = await withRetry(
    () =>
      youtube.videos.insert(
        {
          part: ['snippet', 'status'],
          requestBody: {
            snippet: {
              title: (title || 'Untitled').substring(0, 100),
              description: description.substring(0, 5000),
              tags: tags.slice(0, 30),
              categoryId,
              defaultLanguage: language,
              defaultAudioLanguage: language,
            },
            status: statusObj,
          },
          media: {
            body: createReadStream(videoPath),
          },
        },
        {
          onUploadProgress: (evt) => {
            const percent = Math.round((evt.bytesRead / fileSize) * 100);
            onProgress?.({ bytesRead: evt.bytesRead, totalBytes: fileSize, percent });
            if (percent % 10 === 0) log(`Upload progress: ${percent}%`, 'info');
          },
        }
      ),
    retry,
    log
  );

  const videoId = res.data.id;
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const uploadStatus = res.data.status?.uploadStatus || 'unknown';
  log(`Upload complete! ${videoUrl} (status: ${uploadStatus})`, 'success');

  // Thumbnail
  let thumbnailSet = false;
  if (thumbnailPath && existsSync(thumbnailPath) && videoId) {
    thumbnailSet = await setThumbnail({ videoId, thumbnailPath, auth: oauthClient, retry, log });
  }

  return { videoId, videoUrl, uploadStatus, thumbnailSet };
}

// ── Thumbnail ────────────────────────────────────────────────────────────

/**
 * Set a custom thumbnail for an uploaded video.
 *
 * @param {object} params
 * @param {string} params.videoId        - YouTube video ID
 * @param {string} params.thumbnailPath  - Path to thumbnail image
 * @param {import('googleapis').Auth.OAuth2Client} [params.auth]
 * @param {object} [params.retry]
 * @param {(msg: string, level?: string) => void} [params.log]
 * @returns {Promise<boolean>}
 */
export async function setThumbnail({
  videoId,
  thumbnailPath,
  auth,
  retry = DEFAULT_RETRY,
  log = () => {},
}) {
  if (!thumbnailPath || !existsSync(thumbnailPath)) {
    log('Thumbnail path missing or file not found, skipping', 'warn');
    return false;
  }

  const oauthClient = auth || createOAuth2Client({ onTokenRefresh: log });
  const youtube = google.youtube({ version: 'v3', auth: oauthClient });

  const ext = thumbnailPath.split('.').pop()?.toLowerCase();
  const mimeMap = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };
  const mimeType = mimeMap[ext] || 'image/png';

  try {
    await withRetry(
      () =>
        youtube.thumbnails.set({
          videoId,
          media: { mimeType, body: createReadStream(thumbnailPath) },
        }),
      retry,
      log
    );
    log(`Thumbnail set for ${videoId}`, 'success');
    return true;
  } catch (err) {
    log(`Thumbnail upload failed: ${err.message}`, 'error');
    return false;
  }
}

// ── Credential Check ─────────────────────────────────────────────────────

/**
 * Quick check whether YouTube upload credentials are configured.
 * @returns {{ ready: boolean, missing: string[] }}
 */
export function checkCredentials() {
  const required = ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET', 'YOUTUBE_REFRESH_TOKEN'];
  const missing = required.filter((k) => !process.env[k]);
  return { ready: missing.length === 0, missing };
}

export default { uploadVideo, setThumbnail, createOAuth2Client, checkCredentials };
