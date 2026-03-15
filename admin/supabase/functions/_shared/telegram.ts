// Shared Telegram notification utility for all Edge Functions

/**
 * Escape special characters for Telegram Markdown (legacy mode)
 * Special chars in legacy Markdown: _ * ` [
 */
export function escapeMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\/g, "\\\\")
    .replace(/_/g, "\\_")
    .replace(/\*/g, "\\*")
    .replace(/`/g, "\\`")
    .replace(/\[/g, "\\[");
}

/**
 * Send a Telegram message. Gracefully handles missing credentials.
 */
export async function sendTelegram(message: string): Promise<void> {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
  if (!botToken || !chatId) {
    console.warn("⚠️ Telegram credentials not configured — skipping notification");
    return;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("Telegram send failed:", res.status, body);
    }
  } catch (err) {
    console.error("Telegram send error:", err);
  }
}
