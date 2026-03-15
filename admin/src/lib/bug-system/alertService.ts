/**
 * Alert Service - Real-time notifications for critical errors
 *
 * Supports: Slack, Discord, Email webhooks
 * "If there's a critical error at 3AM, someone needs to know." - Elon
 */

import { supabase } from '../supabase';
import { logger } from '../utils/logger';
import type { ErrorSeverity } from './errorHandler';

export interface AlertConfig {
  slackWebhookUrl?: string;
  discordWebhookUrl?: string;
  emailWebhookUrl?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  enabledChannels: ('slack' | 'discord' | 'email' | 'telegram')[];
  minSeverity: ErrorSeverity;
}

export interface AlertPayload {
  title: string;
  message: string;
  severity: ErrorSeverity;
  errorId?: string;
  timestamp: string;
  projectName: string;
  pageUrl?: string;
  stackTrace?: string;
  context?: Record<string, any>;
}

class AlertService {
  private config: AlertConfig = {
    slackWebhookUrl: import.meta.env.VITE_SLACK_WEBHOOK_URL,
    discordWebhookUrl: import.meta.env.VITE_DISCORD_WEBHOOK_URL,
    telegramBotToken: import.meta.env.VITE_TELEGRAM_BOT_TOKEN,
    telegramChatId: import.meta.env.VITE_TELEGRAM_CHAT_ID,
    enabledChannels: ['slack', 'discord', 'telegram'],
    minSeverity: 'critical',
  };

  private readonly severityOrder: Record<ErrorSeverity, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  private readonly severityEmoji: Record<ErrorSeverity, string> = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢',
  };

  private readonly severityColors: Record<ErrorSeverity, number> = {
    critical: 0xff0000, // Red
    high: 0xff8c00, // Dark Orange
    medium: 0xffd700, // Gold
    low: 0x00ff00, // Green
  };

  /**
   * Send alert for an error
   */
  async sendAlert(payload: AlertPayload): Promise<void> {
    // Check if severity meets minimum threshold
    if (this.severityOrder[payload.severity] < this.severityOrder[this.config.minSeverity]) {
      return;
    }

    const promises: Promise<void>[] = [];

    if (this.config.enabledChannels.includes('slack') && this.config.slackWebhookUrl) {
      promises.push(this.sendSlackAlert(payload));
    }

    if (this.config.enabledChannels.includes('discord') && this.config.discordWebhookUrl) {
      promises.push(this.sendDiscordAlert(payload));
    }

    if (this.config.enabledChannels.includes('telegram') && this.config.telegramBotToken) {
      promises.push(this.sendTelegramAlert(payload));
    }

    // Log alert to database
    promises.push(this.logAlert(payload));

    await Promise.allSettled(promises);
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(payload: AlertPayload): Promise<void> {
    if (!this.config.slackWebhookUrl) return;

    try {
      const slackPayload = {
        username: '🐛 Bug System',
        icon_emoji: this.severityEmoji[payload.severity],
        attachments: [
          {
            color:
              payload.severity === 'critical'
                ? 'danger'
                : payload.severity === 'high'
                  ? 'warning'
                  : 'good',
            title: `${this.severityEmoji[payload.severity]} ${payload.title}`,
            text: payload.message,
            fields: [
              {
                title: 'Severity',
                value: payload.severity.toUpperCase(),
                short: true,
              },
              {
                title: 'Project',
                value: payload.projectName,
                short: true,
              },
              {
                title: 'Time',
                value: new Date(payload.timestamp).toLocaleString('vi-VN'),
                short: true,
              },
              {
                title: 'Page',
                value: payload.pageUrl || 'Unknown',
                short: true,
              },
            ],
            footer: 'LongSang Bug System',
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      };

      if (payload.stackTrace) {
        slackPayload.attachments[0].fields.push({
          title: 'Stack Trace',
          value: `\`\`\`${payload.stackTrace.slice(0, 500)}...\`\`\``,
          short: false,
        });
      }

      await fetch(this.config.slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackPayload),
      });

      logger.info('Slack alert sent', { severity: payload.severity });
    } catch (error) {
      logger.warn('Failed to send Slack alert', error as Error, 'AlertService');
    }
  }

  /**
   * Send Discord alert
   */
  private async sendDiscordAlert(payload: AlertPayload): Promise<void> {
    if (!this.config.discordWebhookUrl) return;

    try {
      const discordPayload = {
        username: '🐛 Bug System',
        embeds: [
          {
            title: `${this.severityEmoji[payload.severity]} ${payload.title}`,
            description: payload.message,
            color: this.severityColors[payload.severity],
            fields: [
              {
                name: '📊 Severity',
                value: payload.severity.toUpperCase(),
                inline: true,
              },
              {
                name: '📁 Project',
                value: payload.projectName,
                inline: true,
              },
              {
                name: '🕐 Time',
                value: new Date(payload.timestamp).toLocaleString('vi-VN'),
                inline: true,
              },
              {
                name: '🔗 Page',
                value: payload.pageUrl || 'Unknown',
                inline: false,
              },
            ],
            footer: {
              text: 'LongSang Bug System',
            },
            timestamp: payload.timestamp,
          },
        ],
      };

      if (payload.stackTrace) {
        discordPayload.embeds[0].fields.push({
          name: '📜 Stack Trace',
          value: `\`\`\`${payload.stackTrace.slice(0, 1000)}\`\`\``,
          inline: false,
        });
      }

      await fetch(this.config.discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordPayload),
      });

      logger.info('Discord alert sent', { severity: payload.severity });
    } catch (error) {
      logger.warn('Failed to send Discord alert', error as Error, 'AlertService');
    }
  }

  /**
   * Send Telegram alert
   */
  private async sendTelegramAlert(payload: AlertPayload): Promise<void> {
    if (!this.config.telegramBotToken || !this.config.telegramChatId) return;

    try {
      const emoji = this.severityEmoji[payload.severity];
      const text = `
${emoji} *${payload.title}*

📊 *Severity:* ${payload.severity.toUpperCase()}
📁 *Project:* ${payload.projectName}
🕐 *Time:* ${new Date(payload.timestamp).toLocaleString('vi-VN')}
🔗 *Page:* ${payload.pageUrl || 'Unknown'}

💬 *Message:*
${payload.message}

${payload.stackTrace ? `📜 *Stack Trace:*\n\`\`\`${payload.stackTrace.slice(0, 500)}\`\`\`` : ''}
      `.trim();

      const url = `https://api.telegram.org/bot${this.config.telegramBotToken}/sendMessage`;

      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.config.telegramChatId,
          text,
          parse_mode: 'Markdown',
        }),
      });

      logger.info('Telegram alert sent', { severity: payload.severity });
    } catch (error) {
      logger.warn('Failed to send Telegram alert', error as Error, 'AlertService');
    }
  }

  /**
   * Log alert to database for tracking
   */
  private async logAlert(payload: AlertPayload): Promise<void> {
    try {
      await supabase.from('alert_logs').insert({
        error_id: payload.errorId,
        severity: payload.severity,
        title: payload.title,
        message: payload.message,
        channels: this.config.enabledChannels,
        project_name: payload.projectName,
        sent_at: payload.timestamp,
      });
    } catch (error) {
      // Silently fail - logging alert should not break the flow
      logger.debug('Failed to log alert', error as Error, 'AlertService');
    }
  }

  /**
   * Update alert configuration
   */
  updateConfig(newConfig: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration (without sensitive data)
   */
  getConfig(): Omit<AlertConfig, 'slackWebhookUrl' | 'discordWebhookUrl' | 'telegramBotToken'> {
    return {
      enabledChannels: this.config.enabledChannels,
      minSeverity: this.config.minSeverity,
      telegramChatId: this.config.telegramChatId,
    };
  }

  /**
   * Test alert configuration
   */
  async testAlert(): Promise<{ success: boolean; channels: string[] }> {
    const testPayload: AlertPayload = {
      title: '🧪 Test Alert',
      message:
        'This is a test alert from LongSang Bug System. If you see this, alerts are working!',
      severity: 'medium',
      timestamp: new Date().toISOString(),
      projectName: 'longsang-admin',
      pageUrl: window.location.href,
    };

    try {
      await this.sendAlert(testPayload);
      return { success: true, channels: this.config.enabledChannels };
    } catch (error) {
      return { success: false, channels: [] };
    }
  }
}

export const alertService = new AlertService();
export default alertService;
