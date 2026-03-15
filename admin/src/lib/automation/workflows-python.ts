// ================================================
// WORKFLOWS - Python Backend Integration
// Orchestrates agent execution via Python AI system
// ================================================

import { supabase } from '@/integrations/supabase/client';
import * as AI from './ai-service-python';

/**
 * Execute Content Writer Agent workflow
 */
export async function executeContentWriterWorkflow(contactId: string) {
  const startTime = Date.now();
  const agentId = 'content_writer';

  try {
    // 1. Get contact data
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (contactError) throw contactError;

    // 2. Extract topic from message using AI
    const topic = await AI.extractTopicFromMessage(contact.message);

    // 3. Log start
    await supabase.from('activity_logs').insert({
      agent_id: agentId,
      action: `generate_blog_from_contact`,
      status: 'processing',
      details: { contact_id: contactId, topic },
    });

    // 4. Generate blog post via Python backend
    const blog = await AI.generateBlogPost(topic, {
      contact_id: contactId,
      tone: 'professional',
    });

    // 5. Add to content queue
    const { data: queueItem, error: queueError } = await supabase
      .from('content_queue')
      .insert({
        agent_id: agentId,
        title: blog.title,
        content: blog.content,
        content_type: 'blog_post',
        metadata: {
          seo_title: blog.seo_title,
          seo_description: blog.seo_description,
          tags: blog.tags,
          contact_id: contactId,
          ai_generated: true,
        },
        priority: 5,
        status: 'pending',
      })
      .select()
      .single();

    if (queueError) throw queueError;

    // 6. Log success
    const duration = Date.now() - startTime;
    await supabase.from('activity_logs').insert({
      agent_id: agentId,
      action: 'blog_generated',
      status: 'success',
      duration_ms: duration,
      details: {
        contact_id: contactId,
        topic,
        queue_item_id: queueItem.id,
        title: blog.title,
      },
    });

    // 7. Update agent stats
    await supabase.rpc('increment_agent_runs', {
      p_agent_id: agentId,
      p_success: true,
    });

    return {
      success: true,
      blog,
      queueItemId: queueItem.id,
    };
  } catch (error: any) {
    // Log error
    const duration = Date.now() - startTime;
    await supabase.from('activity_logs').insert({
      agent_id: agentId,
      action: 'blog_generation_failed',
      status: 'error',
      duration_ms: duration,
      error_message: error.message,
      details: { contact_id: contactId },
    });

    // Update agent stats
    await supabase.rpc('increment_agent_runs', {
      p_agent_id: agentId,
      p_success: false,
    });

    throw error;
  }
}

/**
 * Execute Lead Nurture Agent workflow
 */
export async function executeLeadNurtureWorkflow(contactId: string, followUpNumber: number = 1) {
  const startTime = Date.now();
  const agentId = 'lead_nurture';

  try {
    // 1. Get contact
    const { data: contact, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (error) throw error;

    // 2. Generate email via Python backend
    const email = await AI.generateFollowUpEmail(
      contact.name,
      contact.email,
      contact.service || 'our services',
      contact.message,
      followUpNumber
    );

    // 3. Add to content queue
    const { data: queueItem } = await supabase
      .from('content_queue')
      .insert({
        agent_id: agentId,
        title: email.subject,
        content: email.body,
        content_type: 'email',
        metadata: {
          contact_id: contactId,
          contact_email: contact.email,
          follow_up_number: followUpNumber,
          ai_generated: true,
        },
        priority: 8,
        status: 'pending',
      })
      .select()
      .single();

    // 4. Log success
    const duration = Date.now() - startTime;
    await supabase.from('activity_logs').insert({
      agent_id: agentId,
      action: 'email_generated',
      status: 'success',
      duration_ms: duration,
      details: {
        contact_id: contactId,
        subject: email.subject,
        queue_item_id: queueItem?.id,
      },
    });

    await supabase.rpc('increment_agent_runs', {
      p_agent_id: agentId,
      p_success: true,
    });

    return {
      success: true,
      email,
      queueItemId: queueItem?.id,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    await supabase.from('activity_logs').insert({
      agent_id: agentId,
      action: 'email_generation_failed',
      status: 'error',
      duration_ms: duration,
      error_message: error.message,
    });

    await supabase.rpc('increment_agent_runs', {
      p_agent_id: agentId,
      p_success: false,
    });

    throw error;
  }
}

/**
 * Execute Social Media Agent workflow
 */
export async function executeSocialMediaWorkflow(blogQueueItemId: string) {
  const startTime = Date.now();
  const agentId = 'social_media';

  try {
    // 1. Get blog from queue
    const { data: blogItem, error } = await supabase
      .from('content_queue')
      .select('*')
      .eq('id', blogQueueItemId)
      .single();

    if (error) throw error;

    // 2. Generate social posts via Python backend
    const blogUrl = `https://yourblog.com/posts/${blogQueueItemId}`;
    const posts = await AI.generateSocialPosts(blogItem.title, blogItem.content, blogUrl, [
      'linkedin',
      'twitter',
      'facebook',
    ]);

    // 3. Add each platform post to queue
    const queuePromises = Object.entries(posts).map(([platform, post]: [string, any]) =>
      supabase.from('content_queue').insert({
        agent_id: agentId,
        title: `[${platform}] ${blogItem.title}`,
        content: post.text,
        content_type: 'social_post',
        metadata: {
          platform,
          hashtags: post.hashtags,
          parent_blog_id: blogQueueItemId,
          ai_generated: true,
        },
        priority: 6,
        status: 'pending',
      })
    );

    await Promise.all(queuePromises);

    // 4. Log success
    const duration = Date.now() - startTime;
    await supabase.from('activity_logs').insert({
      agent_id: agentId,
      action: 'social_posts_generated',
      status: 'success',
      duration_ms: duration,
      details: {
        blog_queue_id: blogQueueItemId,
        platforms: Object.keys(posts),
      },
    });

    await supabase.rpc('increment_agent_runs', {
      p_agent_id: agentId,
      p_success: true,
    });

    return {
      success: true,
      posts,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    await supabase.from('activity_logs').insert({
      agent_id: agentId,
      action: 'social_generation_failed',
      status: 'error',
      duration_ms: duration,
      error_message: error.message,
    });

    await supabase.rpc('increment_agent_runs', {
      p_agent_id: agentId,
      p_success: false,
    });

    throw error;
  }
}

/**
 * Execute Analytics Agent workflow
 */
export async function executeAnalyticsWorkflow() {
  const startTime = Date.now();
  const agentId = 'analytics';

  try {
    // 1. Gather metrics (mock for now)
    const metrics = {
      total_contacts: 0,
      total_blog_posts: 0,
      total_emails_sent: 0,
      avg_response_time: 0,
    };

    // Get actual counts
    const [contacts, blogs, emails] = await Promise.all([
      supabase.from('contacts').select('id', { count: 'exact', head: true }),
      supabase
        .from('content_queue')
        .select('id', { count: 'exact', head: true })
        .eq('content_type', 'blog_post'),
      supabase
        .from('content_queue')
        .select('id', { count: 'exact', head: true })
        .eq('content_type', 'email'),
    ]);

    metrics.total_contacts = contacts.count || 0;
    metrics.total_blog_posts = blogs.count || 0;
    metrics.total_emails_sent = emails.count || 0;

    // 2. Generate insights via Python backend
    const insights = await AI.generateAnalyticsInsights(metrics, 'weekly');

    // 3. Log insights
    const duration = Date.now() - startTime;
    await supabase.from('activity_logs').insert({
      agent_id: agentId,
      action: 'insights_generated',
      status: 'success',
      duration_ms: duration,
      details: {
        metrics,
        summary: insights.summary,
        trends: insights.trends,
      },
    });

    await supabase.rpc('increment_agent_runs', {
      p_agent_id: agentId,
      p_success: true,
    });

    return {
      success: true,
      metrics,
      insights,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    await supabase.from('activity_logs').insert({
      agent_id: agentId,
      action: 'insights_failed',
      status: 'error',
      duration_ms: duration,
      error_message: error.message,
    });

    await supabase.rpc('increment_agent_runs', {
      p_agent_id: agentId,
      p_success: false,
    });

    throw error;
  }
}

/**
 * Manual trigger any agent
 */
export async function triggerAgent(agentType: string, context: any = {}) {
  switch (agentType) {
    case 'content_writer':
      if (context.contact_id) {
        return executeContentWriterWorkflow(context.contact_id);
      }
      throw new Error('contact_id required for Content Writer');

    case 'lead_nurture':
      if (context.contact_id) {
        return executeLeadNurtureWorkflow(context.contact_id, context.follow_up_number || 1);
      }
      throw new Error('contact_id required for Lead Nurture');

    case 'social_media':
      if (context.blog_queue_id) {
        return executeSocialMediaWorkflow(context.blog_queue_id);
      }
      throw new Error('blog_queue_id required for Social Media');

    case 'analytics':
      return executeAnalyticsWorkflow();

    default:
      throw new Error(`Unknown agent type: ${agentType}`);
  }
}
