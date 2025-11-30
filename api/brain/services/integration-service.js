/**
 * Integration Service
 * External integrations: Slack, email, webhooks, import/export
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Send Slack notification
 */
async function sendSlackNotification(userId, message) {
  if (!supabase) throw new Error('Supabase not configured');

  // Get user's Slack integration
  const { data: integration, error } = await supabase
    .from('brain_integrations')
    .select('config')
    .eq('user_id', userId)
    .eq('integration_type', 'slack')
    .eq('is_active', true)
    .single();

  if (error || !integration) {
    throw new Error('Slack integration not configured');
  }

  const webhookUrl = integration.config.webhook_url;
  if (!webhookUrl) {
    throw new Error('Slack webhook URL not configured');
  }

  // Send to Slack webhook
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: message,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send Slack notification: ${response.statusText}`);
  }

  return { success: true };
}

/**
 * Send email (placeholder - would use email service)
 */
async function sendEmail(userId, subject, body) {
  // This would integrate with an email service (SendGrid, AWS SES, etc.)
  // For now, just log
  console.log(`[Integration Service] Email to user ${userId}: ${subject}`);
  return { success: true, message: 'Email sent (simulated)' };
}

/**
 * Trigger webhook
 */
async function triggerWebhook(userId, webhookId, payload) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data: integration, error } = await supabase
    .from('brain_integrations')
    .select('config')
    .eq('id', webhookId)
    .eq('user_id', userId)
    .eq('integration_type', 'webhook')
    .eq('is_active', true)
    .single();

  if (error || !integration) {
    throw new Error('Webhook not found or inactive');
  }

  const webhookUrl = integration.config.url;
  if (!webhookUrl) {
    throw new Error('Webhook URL not configured');
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(integration.config.headers || {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.statusText}`);
  }

  return { success: true };
}

/**
 * Import from Notion (placeholder)
 */
async function importFromNotion(userId, notionData) {
  // This would integrate with Notion API
  // For now, just return placeholder
  console.log(`[Integration Service] Importing from Notion for user ${userId}`);
  return { success: true, message: 'Notion import (simulated)', items: [] };
}

/**
 * Export to Markdown
 */
async function exportToMarkdown(knowledgeId) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data: knowledge, error } = await supabase
    .from('brain_knowledge')
    .select('*')
    .eq('id', knowledgeId)
    .single();

  if (error || !knowledge) {
    throw new Error(`Knowledge item not found: ${knowledgeId}`);
  }

  // Convert to Markdown format
  const markdown = `# ${knowledge.title || 'Untitled'}

${knowledge.content || ''}

${knowledge.tags && knowledge.tags.length > 0 ? `\nTags: ${knowledge.tags.join(', ')}` : ''}

Created: ${new Date(knowledge.created_at).toLocaleString()}
Updated: ${new Date(knowledge.updated_at || knowledge.created_at).toLocaleString()}
`;

  return {
    content: markdown,
    filename: `${knowledge.title || 'knowledge'}.md`,
  };
}

/**
 * Export to PDF (placeholder - would use PDF library)
 */
async function exportToPDF(knowledgeId) {
  // This would use a PDF generation library (puppeteer, pdfkit, etc.)
  // For now, return markdown as placeholder
  const markdown = await exportToMarkdown(knowledgeId);
  return {
    content: markdown.content, // Would be PDF buffer in real implementation
    filename: markdown.filename.replace('.md', '.pdf'),
    format: 'pdf',
  };
}

module.exports = {
  supabase,
  sendSlackNotification,
  sendEmail,
  triggerWebhook,
  importFromNotion,
  exportToMarkdown,
  exportToPDF,
};

