/**
 * Telegram Notifier — Pipeline event alerts to Telegram
 *
 * Sends real-time notifications about pipeline events, errors, and system
 * status to a Telegram chat via the Bot API.
 *
 * Env vars: TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_CHAT_ID
 * Gracefully no-ops when not configured.
 */
import 'dotenv/config';

const RATE_LIMIT_MS = 3000;
const ADMIN_DASHBOARD_URL = process.env.ADMIN_DASHBOARD_URL || 'http://localhost:5173/admin';

let lastSendTime = 0;
const messageQueue = [];
let flushTimer = null;

// ─── MarkdownV2 Escaping ─────────────────────────────────────────────────────

const MD2_SPECIAL = /([_*\[\]()~`>#+\-=|{}.!\\])/g;

function esc(text) {
  if (text == null) return '';
  return String(text).replace(MD2_SPECIAL, '\\$1');
}

function timestamp() {
  return new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

// ─── Core Send ───────────────────────────────────────────────────────────────

function getConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  return { token, chatId, configured: !!(token && chatId) };
}

async function sendRaw(text, opts = {}) {
  const { token, chatId, configured } = getConfig();
  if (!configured) return null;

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: opts.disablePreview ?? true,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.warn(`[TelegramNotifier] API ${res.status}: ${body}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn(`[TelegramNotifier] Send failed: ${err.message}`);
    return null;
  }
}

async function flushQueue() {
  if (messageQueue.length === 0) return;

  const now = Date.now();
  const elapsed = now - lastSendTime;

  if (elapsed < RATE_LIMIT_MS) {
    if (!flushTimer) {
      flushTimer = setTimeout(() => {
        flushTimer = null;
        flushQueue();
      }, RATE_LIMIT_MS - elapsed);
    }
    return;
  }

  const { text, opts } = messageQueue.shift();
  lastSendTime = Date.now();
  await sendRaw(text, opts);

  if (messageQueue.length > 0) {
    flushTimer = setTimeout(() => {
      flushTimer = null;
      flushQueue();
    }, RATE_LIMIT_MS);
  }
}

function queueMessage(text, opts = {}) {
  const { configured } = getConfig();
  if (!configured) return;
  messageQueue.push({ text, opts });
  flushQueue();
}

// ─── Notification Builders ───────────────────────────────────────────────────

export function notifyPipelineStarted({ topic, pipelineId, maxCost }) {
  const lines = [
    `🚀 *Pipeline started*`,
    ``,
    `📌 Topic: ${esc(topic || 'N/A')}`,
    `🆔 Run: \`${esc(pipelineId)}\``,
  ];
  if (maxCost) lines.push(`💰 Budget: \\$${esc(String(maxCost))}`);
  lines.push(`🕐 ${esc(timestamp())}`);
  lines.push(``, `[Dashboard](${esc(ADMIN_DASHBOARD_URL + '/pipeline')})`);
  queueMessage(lines.join('\n'));
}

export function notifyPipelineCompleted({ title, pipelineId, durationMs, totalCost, videoUrl }) {
  const duration = durationMs
    ? durationMs >= 60000
      ? `${(durationMs / 60000).toFixed(1)}min`
      : `${(durationMs / 1000).toFixed(1)}s`
    : '?';
  const cost = (totalCost || 0).toFixed(4);
  const lines = [
    `🎬 *VIDEO READY\\!*`,
    ``,
    `📹 ${esc(title || 'Untitled')}`,
    `⏱ ${esc(duration)} \\| 💰 \\$${esc(cost)}`,
    `🆔 \`${esc(pipelineId)}\``,
  ];
  if (videoUrl) lines.push(`🔗 [Watch](${esc(videoUrl)})`);
  lines.push(`🕐 ${esc(timestamp())}`);
  lines.push(``, `[View in Dashboard](${esc(ADMIN_DASHBOARD_URL + '/pipeline')})`);
  queueMessage(lines.join('\n'));
}

export function notifyPipelineFailed({ pipelineId, stageIndex, stageName, error }) {
  const stageNum = stageIndex != null ? stageIndex + 1 : '?';
  const lines = [
    `💀 *PIPELINE FAILED*`,
    ``,
    `📍 Stage ${esc(String(stageNum))}/7 \\(${esc(stageName || 'unknown')}\\)`,
    `💥 \`${esc(String(error).substring(0, 200))}\``,
    `💾 Resume: \`${esc(pipelineId)}\``,
    `🕐 ${esc(timestamp())}`,
    ``,
    `[Resume from Dashboard](${esc(ADMIN_DASHBOARD_URL + '/pipeline')})`,
  ];
  queueMessage(lines.join('\n'));
}

export function notifyStageCompleted({ stageIndex, totalStages, stageName, durationMs, cost }) {
  const secs = ((durationMs || 0) / 1000).toFixed(1);
  let text = `✅ Stage ${esc(String(stageIndex + 1))}/${esc(String(totalStages || 7))} *${esc(stageName)}* done \\(${esc(secs)}s`;
  if (cost != null) text += `, \\$${esc(Number(cost).toFixed(4))}`;
  text += `\\)`;
  queueMessage(text);
}

export function notifyStageFailed({ stageIndex, totalStages, stageName, error }) {
  const stageNum = stageIndex != null ? stageIndex + 1 : '?';
  const lines = [
    `❌ Stage ${esc(String(stageNum))}/${esc(String(totalStages || 7))} *${esc(stageName || 'unknown')}* FAILED`,
    `💥 \`${esc(String(error).substring(0, 200))}\``,
  ];
  queueMessage(lines.join('\n'));
}

export function notifyCostAlert({ amount, limit }) {
  const lines = [
    `💰 *Cost alert*`,
    ``,
    `Spent: \\$${esc(String(Number(amount).toFixed(4)))}`,
    `Budget: \\$${esc(String(Number(limit).toFixed(2)))}`,
    `🕐 ${esc(timestamp())}`,
  ];
  queueMessage(lines.join('\n'));
}

export function notifyServiceDown(serviceName) {
  const text = `🔴 *${esc(serviceName)} offline\\!*\n🕐 ${esc(timestamp())}`;
  queueMessage(text);
}

export function notifyServiceUp(serviceName) {
  const text = `🟢 *${esc(serviceName)} back online*\n🕐 ${esc(timestamp())}`;
  queueMessage(text);
}

export function notifyAutoSeedDone({ platforms, videoUrl }) {
  const platList = Array.isArray(platforms) ? platforms.join(', ') : String(platforms || 'none');
  const lines = [
    `📢 *Seeded to ${esc(platList)}*`,
  ];
  if (videoUrl) lines.push(`🔗 ${esc(videoUrl)}`);
  lines.push(`🕐 ${esc(timestamp())}`);
  queueMessage(lines.join('\n'));
}

export function notifyDailySummary({ videoCount, totalCost, estimatedViews, topVideo }) {
  const lines = [
    `📊 *Daily Report*`,
    ``,
    `🎬 Videos: ${esc(String(videoCount || 0))}`,
    `💰 Cost: \\$${esc(String(Number(totalCost || 0).toFixed(4)))}`,
    `👁 Est\\. views: ${esc(String(estimatedViews || 'N/A'))}`,
  ];
  if (topVideo) lines.push(`🏆 Top: ${esc(topVideo)}`);
  lines.push(`🕐 ${esc(timestamp())}`);
  queueMessage(lines.join('\n'));
}

export function notifyCustom(message) {
  queueMessage(esc(message));
}

/**
 * Send a test notification to verify the setup works.
 */
export async function sendTestNotification() {
  const { configured } = getConfig();
  if (!configured) {
    return { ok: false, error: 'TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID not set' };
  }

  const text = [
    `🧪 *Test notification*`,
    ``,
    `LongSang Admin Dashboard → Telegram link works\\!`,
    `🕐 ${esc(timestamp())}`,
    ``,
    `[Open Dashboard](${esc(ADMIN_DASHBOARD_URL + '/pipeline')})`,
  ].join('\n');

  const result = await sendRaw(text);
  return result ? { ok: true } : { ok: false, error: 'Failed to send — check bot token and chat ID' };
}

/**
 * Check if Telegram notifications are configured (non-destructive).
 */
export function isConfigured() {
  return getConfig().configured;
}

// ─── Convenience: wrap entire pipeline lifecycle ─────────────────────────────

/**
 * Create a set of lifecycle hooks for the Conductor to call.
 * Usage in conductor: const tg = createPipelineHooks(); tg.onStart({...});
 */
export function createPipelineHooks() {
  return {
    onStart: notifyPipelineStarted,
    onStageComplete: notifyStageCompleted,
    onStageFail: notifyStageFailed,
    onComplete: notifyPipelineCompleted,
    onFail: notifyPipelineFailed,
    onCostAlert: notifyCostAlert,
    onServiceDown: notifyServiceDown,
    onServiceUp: notifyServiceUp,
    onAutoSeedDone: notifyAutoSeedDone,
    onDailySummary: notifyDailySummary,
  };
}

export default {
  notifyPipelineStarted,
  notifyPipelineCompleted,
  notifyPipelineFailed,
  notifyStageCompleted,
  notifyStageFailed,
  notifyCostAlert,
  notifyServiceDown,
  notifyServiceUp,
  notifyAutoSeedDone,
  notifyDailySummary,
  notifyCustom,
  sendTestNotification,
  isConfigured,
  createPipelineHooks,
};
