import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzOTIxOTEsImV4cCI6MjA3NTk2ODE5MX0.Nf1wHe7EDONS25Yv987KqhgyvZu07COnu6qgC0qCy2I';

const supabase = createClient(supabaseUrl, supabaseKey);

const sampleAgents = [
  {
    name: '📝 Content Writer Agent',
    type: 'content_writer',
    description: 'Tự động tạo bài blog từ form liên hệ. Phân tích câu hỏi, research topic, và viết bài chất lượng cao.',
    status: 'active',
    config: {
      ai_model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 2000,
      tone: 'professional',
      language: 'vietnamese',
      category: 'marketing',
      prompt_template: 'Bạn là content writer chuyên nghiệp. Hãy viết bài blog về {{topic}} với tone {{tone}}.',
      capabilities: ['research', 'content_generation', 'seo_optimization'],
    },
    total_runs: 0,
    successful_runs: 0,
  },
  {
    name: '💌 Lead Nurture Agent',
    type: 'lead_nurture',
    description: 'Gửi email follow-up tự động cho leads mới. Cá nhân hóa nội dung dựa trên service mà khách quan tâm.',
    status: 'active',
    config: {
      ai_model: 'gpt-4o-mini',
      temperature: 0.8,
      max_tokens: 500,
      delay_hours: 2,
      personalization: true,
      category: 'crm',
      prompt_template: 'Viết email follow-up chuyên nghiệp cho {{contact_name}} quan tâm đến {{service}}.',
      capabilities: ['email_automation', 'personalization', 'lead_scoring'],
    },
    total_runs: 0,
    successful_runs: 0,
  },
  {
    name: '📱 Social Media Agent',
    type: 'social_media',
    description: 'Tạo posts cho Facebook, LinkedIn, Twitter từ nội dung blog. Tối ưu cho từng platform.',
    status: 'active',
    config: {
      ai_model: 'gpt-4o-mini',
      temperature: 0.9,
      platforms: ['facebook', 'linkedin', 'twitter'],
      hashtags: true,
      category: 'marketing',
      prompt_template: 'Tạo social media post cho {{platform}} từ bài blog: {{blog_title}}. Thêm hashtags phù hợp.',
      capabilities: ['content_repurposing', 'hashtag_generation', 'multi_platform'],
    },
    total_runs: 0,
    successful_runs: 0,
  },
  {
    name: '📊 Analytics Agent',
    type: 'analytics',
    description: 'Theo dõi metrics quan trọng (contacts, content, conversions). Gửi báo cáo và insights tự động.',
    status: 'active',
    config: {
      ai_model: 'gpt-4o',
      temperature: 0.3,
      metrics: ['contacts', 'content_queue', 'conversions'],
      report_frequency: 'daily',
      category: 'operations',
      prompt_template: 'Phân tích metrics: {{metrics}}. Đưa ra insights và recommendations.',
      capabilities: ['data_analysis', 'reporting', 'insights_generation'],
    },
    total_runs: 0,
    successful_runs: 0,
  },
  {
    name: '🎯 Customer Support Agent',
    type: 'customer_support',
    description: 'Trả lời câu hỏi khách hàng tự động qua email và chat. Có khả năng escalate cho người nếu cần.',
    status: 'active',
    config: {
      ai_model: 'gpt-4o',
      temperature: 0.5,
      response_time: 'instant',
      escalation_keywords: ['complaint', 'refund', 'urgent'],
      category: 'customer-service',
      prompt_template: 'Bạn là customer support agent. Trả lời câu hỏi: {{question}} một cách thân thiện và chuyên nghiệp.',
      capabilities: ['customer_service', 'auto_response', 'escalation'],
    },
    total_runs: 0,
    successful_runs: 0,
  },
];

async function seedAgents() {
  console.log('🌱 Seeding sample AI agents...\n');

  // Check if agents already exist
  const { data: existing, error: checkError } = await supabase
    .from('ai_agents')
    .select('id, name');

  if (checkError) {
    console.error('❌ Error checking existing agents:', checkError.message);
    return;
  }

  if (existing && existing.length > 0) {
    console.log(`⚠️  Found ${existing.length} existing agents:`);
    existing.forEach(agent => console.log(`   - ${agent.name}`));
    console.log('\n🔄 Clearing existing agents...');
    
    const { error: deleteError } = await supabase
      .from('ai_agents')
      .delete()
      .in('id', existing.map(a => a.id));
    
    if (deleteError) {
      console.error('❌ Error deleting agents:', deleteError.message);
      return;
    }
  }

  // Insert sample agents
  console.log('📝 Inserting sample agents...\n');
  
  for (const agent of sampleAgents) {
    const { data, error } = await supabase
      .from('ai_agents')
      .insert(agent)
      .select()
      .single();

    if (error) {
      console.error(`❌ ${agent.name}: ${error.message}`);
    } else {
      console.log(`✅ ${agent.name}`);
      console.log(`   Type: ${agent.type}`);
      console.log(`   Category: ${agent.config.category}`);
      console.log(`   Capabilities: ${agent.config.capabilities.join(', ')}`);
      console.log('');
    }
  }

  // Verify
  const { data: final, error: finalError } = await supabase
    .from('ai_agents')
    .select('count', { count: 'exact', head: true });

  if (!finalError) {
    console.log(`\n✅ Successfully seeded ${sampleAgents.length} AI agents!`);
    console.log(`📊 Total agents in database: ${final || 0}`);
  }
}

seedAgents().catch(console.error);
