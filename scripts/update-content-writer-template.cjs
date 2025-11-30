/**
 * Update workflow_templates với content-writer template mới
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://diexsbzqwsbpilsymnfb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('📦 Updating Content Writer workflow template...\n');

  // Check if exists
  const { data: existing } = await supabase
    .from('workflow_templates')
    .select('*')
    .eq('slug', 'content-writer')
    .single();

  const templateData = {
    name: 'Content Writer Agent',
    slug: 'content-writer',
    description: 'AI-powered content writer that generates blog posts, articles, and marketing copy using OpenAI GPT-4o Mini',
    category: 'content',
    icon: '✍️',
    required_credentials: ['openai'],
    default_config: {
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 2000,
      default_tone: 'professional',
      default_word_count: 500,
      webhook_path: '/webhook/content-writer'
    },
    config_schema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Topic to write about' },
        content_type: { 
          type: 'string', 
          enum: ['blog_post', 'article', 'social_post', 'email', 'ad_copy'],
          default: 'blog_post'
        },
        tone: {
          type: 'string',
          enum: ['professional', 'casual', 'friendly', 'formal', 'humorous'],
          default: 'professional'
        },
        word_count: { type: 'number', default: 500 }
      },
      required: ['topic']
    },
    version: '1.0.0',
    status: 'active'
  };

  if (existing) {
    console.log('📝 Updating existing template...');
    const { error } = await supabase
      .from('workflow_templates')
      .update(templateData)
      .eq('id', existing.id);
    
    if (error) {
      console.error('❌ Update failed:', error.message);
      return;
    }
    console.log('✅ Template updated!');
  } else {
    console.log('➕ Creating new template...');
    const { error } = await supabase
      .from('workflow_templates')
      .insert(templateData);
    
    if (error) {
      console.error('❌ Insert failed:', error.message);
      return;
    }
    console.log('✅ Template created!');
  }

  // Show current templates
  const { data: templates } = await supabase
    .from('workflow_templates')
    .select('name, slug, status, n8n_workflow_id')
    .order('name');

  console.log('\n📋 Current workflow templates:');
  templates?.forEach(t => {
    const status = t.n8n_workflow_id ? '🟢' : '⚪';
    console.log(`   ${status} ${t.name} (${t.slug}) - n8n: ${t.n8n_workflow_id || 'not imported'}`);
  });

  console.log('\n✨ Done! Run setup-content-writer-workflow.cjs to import to n8n');
}

main().catch(console.error);
