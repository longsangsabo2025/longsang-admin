// ================================================
// AUTOMATION WORKFLOWS - Core automation logic
// ================================================

import { supabase } from '@/integrations/supabase/client';
import { 
  createActivityLog, 
  createContentItem, 
  updateAgent,
  getAgent 
} from './api';
import {
  extractTopicFromMessage,
  generateBlogPost,
  generateFollowUpEmail,
  generateSocialPosts,
  generateAnalyticsInsights,
} from './ai-service';
import { sendFollowUpEmail } from './email-service';
import { postToSocialMedia } from './social-media-service';
import type { AIAgent } from '@/types/automation';

// ================================================
// CONTENT WRITER WORKFLOW
// ================================================

/**
 * Execute Content Writer Agent workflow
 * Triggered when new contact form is submitted
 */
export async function executeContentWriterWorkflow(contactId: string, agentId: string) {
  const startTime = Date.now();
  let agent: AIAgent | null = null;

  try {
    // 1. Get agent config
    agent = await getAgent(agentId);
    
    // 2. Get contact data
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      throw new Error('Contact not found');
    }

    await createActivityLog({
      agent_id: agentId,
      action: 'Processing new contact',
      details: {
        contact_id: contactId,
        contact_name: contact.name,
        service: contact.service,
      },
      status: 'info',
    });

    // 3. Extract topic from contact message
    const topic = await extractTopicFromMessage(
      contact.message,
      { model: agent.config.ai_model }
    );

    await createActivityLog({
      agent_id: agentId,
      action: 'Topic extracted',
      details: { topic, source: contact.message.substring(0, 100) },
      status: 'success',
    });

    // 4. Generate blog post
    const blogPost = await generateBlogPost(topic, {
      model: agent.config.ai_model,
      temperature: 0.7,
    });

    await createActivityLog({
      agent_id: agentId,
      action: 'Blog post generated',
      details: {
        title: blogPost.title,
        word_count: blogPost.content.length,
      },
      status: 'success',
    });

    // 5. Add to content queue
    await createContentItem({
      agent_id: agentId,
      content_type: 'blog_post',
      title: blogPost.title,
      content: {
        topic,
        ...blogPost,
        source_contact_id: contactId,
      },
      metadata: {
        contact_name: contact.name,
        service: contact.service,
      },
      status: agent.config.auto_publish ? 'pending' : 'pending',
      priority: 7,
    });

    // 6. Update agent stats
    const duration = Date.now() - startTime;
    await updateAgent(agentId, {
      last_run: new Date().toISOString(),
      total_runs: agent.total_runs + 1,
      successful_runs: agent.successful_runs + 1,
    });

    await createActivityLog({
      agent_id: agentId,
      action: 'Content Writer workflow completed',
      details: {
        contact_id: contactId,
        topic,
        blog_title: blogPost.title,
      },
      status: 'success',
      duration_ms: duration,
    });

    return { success: true, blogPost };

  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    await createActivityLog({
      agent_id: agentId,
      action: 'Content Writer workflow failed',
      details: { error: error.message },
      status: 'error',
      error_message: error.message,
      duration_ms: duration,
    });

    if (agent) {
      await updateAgent(agentId, {
        last_run: new Date().toISOString(),
        total_runs: agent.total_runs + 1,
        last_error: error.message,
        status: 'error',
      });
    }

    throw error;
  }
}

// ================================================
// LEAD NURTURE WORKFLOW
// ================================================

/**
 * Execute Lead Nurture Agent workflow
 * Sends follow-up emails to contacts
 */
export async function executeLeadNurtureWorkflow(contactId: string, agentId: string) {
  const startTime = Date.now();
  let agent: AIAgent | null = null;

  try {
    agent = await getAgent(agentId);

    // Get contact
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      throw new Error('Contact not found');
    }

    // Generate personalized follow-up email
    const email = await generateFollowUpEmail(
      contact.name,
      contact.service,
      contact.message,
      { model: agent.config.ai_model }
    );

    // Send email immediately or add to queue based on config
    const sendNow = agent.config.send_immediately !== false;
    
    if (sendNow) {
      // Send email directly
      const emailResult = await sendFollowUpEmail(
        contact.email,
        contact.name,
        email.subject,
        email.body
      );

      if (!emailResult.success) {
        throw new Error(`Email sending failed: ${emailResult.error}`);
      }

      await createActivityLog({
        agent_id: agentId,
        action: 'Email sent to contact',
        details: {
          contact_id: contactId,
          email: contact.email,
          subject: email.subject,
          message_id: emailResult.messageId,
        },
        status: 'success',
      });
    } else {
      // Add email to content queue for scheduled sending
      await createContentItem({
        agent_id: agentId,
        content_type: 'email',
        title: email.subject,
        content: {
          to: contact.email,
          from: 'contact@longsang.org',
          subject: email.subject,
          body: email.body,
          tone: email.tone,
        },
        metadata: {
          contact_id: contactId,
          contact_name: contact.name,
        },
        status: 'pending',
        priority: 8,
        scheduled_for: new Date(Date.now() + (agent.config.follow_up_delay_hours || 24) * 60 * 60 * 1000).toISOString(),
      });
    }

    const duration = Date.now() - startTime;

    await updateAgent(agentId, {
      last_run: new Date().toISOString(),
      total_runs: agent.total_runs + 1,
      successful_runs: agent.successful_runs + 1,
    });

    await createActivityLog({
      agent_id: agentId,
      action: 'Follow-up email generated',
      details: {
        contact_id: contactId,
        email_subject: email.subject,
      },
      status: 'success',
      duration_ms: duration,
    });

    return { success: true, email };

  } catch (error: any) {
    const duration = Date.now() - startTime;

    await createActivityLog({
      agent_id: agentId,
      action: 'Lead Nurture workflow failed',
      details: { error: error.message },
      status: 'error',
      error_message: error.message,
      duration_ms: duration,
    });

    if (agent) {
      await updateAgent(agentId, {
        last_run: new Date().toISOString(),
        total_runs: agent.total_runs + 1,
        last_error: error.message,
      });
    }

    throw error;
  }
}

// ================================================
// SOCIAL MEDIA WORKFLOW
// ================================================

/**
 * Execute Social Media Agent workflow
 * Generates social posts from blog content
 */
export async function executeSocialMediaWorkflow(contentId: string, agentId: string) {
  const startTime = Date.now();
  let agent: AIAgent | null = null;

  try {
    agent = await getAgent(agentId);

    // Get blog post from content queue
    const { data: blogContent, error: contentError } = await supabase
      .from('content_queue')
      .select('*')
      .eq('id', contentId)
      .single();

    if (contentError || !blogContent) {
      throw new Error('Blog content not found');
    }

    // Generate social media posts
    const socialPosts = await generateSocialPosts(
      blogContent.title || 'Untitled',
      blogContent.content.content || '',
      agent.config.platforms || ['linkedin', 'twitter', 'facebook'],
      { model: agent.config.ai_model }
    );

    // Publish immediately or add to queue based on config
    const publishNow = agent.config.publish_immediately === true;
    
    if (publishNow) {
      // Publish directly to social media
      const publishResults = [];
      
      for (const [platform, post] of Object.entries(socialPosts)) {
        try {
          const result = await postToSocialMedia({
            platform: platform as 'linkedin' | 'twitter' | 'facebook',
            text: post.text,
            hashtags: post.hashtags,
          });

          publishResults.push({
            platform,
            success: result.success,
            postId: result.postId,
            postUrl: result.postUrl,
            error: result.error,
          });

          await createActivityLog({
            agent_id: agentId,
            action: `Published to ${platform}`,
            details: {
              platform,
              post_id: result.postId,
              post_url: result.postUrl,
            },
            status: result.success ? 'success' : 'error',
            error_message: result.error,
          });
        } catch (error: any) {
          publishResults.push({
            platform,
            success: false,
            error: error.message,
          });
        }
      }
    } else {
      // Add each platform's post to queue
      for (const [platform, post] of Object.entries(socialPosts)) {
        await createContentItem({
          agent_id: agentId,
          content_type: 'social_post',
          title: `${platform} post for: ${blogContent.title}`,
          content: {
            platform,
            text: post.text,
            hashtags: post.hashtags,
            source_content_id: contentId,
          },
          metadata: {
            platform,
            blog_title: blogContent.title,
          },
          status: agent.config.auto_schedule ? 'scheduled' : 'pending',
          priority: 6,
        });
      }
    }

    const duration = Date.now() - startTime;

    await updateAgent(agentId, {
      last_run: new Date().toISOString(),
      total_runs: agent.total_runs + 1,
      successful_runs: agent.successful_runs + 1,
    });

    await createActivityLog({
      agent_id: agentId,
      action: 'Social media posts generated',
      details: {
        source_content_id: contentId,
        platforms: Object.keys(socialPosts),
        posts_created: Object.keys(socialPosts).length,
      },
      status: 'success',
      duration_ms: duration,
    });

    return { success: true, socialPosts };

  } catch (error: any) {
    const duration = Date.now() - startTime;

    await createActivityLog({
      agent_id: agentId,
      action: 'Social Media workflow failed',
      details: { error: error.message },
      status: 'error',
      error_message: error.message,
      duration_ms: duration,
    });

    if (agent) {
      await updateAgent(agentId, {
        last_run: new Date().toISOString(),
        total_runs: agent.total_runs + 1,
        last_error: error.message,
      });
    }

    throw error;
  }
}

// ================================================
// MANUAL TRIGGER
// ================================================

/**
 * Manually trigger an agent workflow
 */
export async function manuallyTriggerAgent(agentId: string, context?: Record<string, any>) {
  const agent = await getAgent(agentId);

  await createActivityLog({
    agent_id: agentId,
    action: 'Manual trigger initiated',
    details: { context, triggered_by: 'user' },
    status: 'info',
  });

  // Call Edge Function for Content Writer
  if (agent.type === 'content_writer') {
    const { data, error } = await supabase.functions.invoke('trigger-content-writer', {
      body: {
        agent_id: agentId,
        context: context || {},
      },
    });

    if (error) {
      await createActivityLog({
        agent_id: agentId,
        action: 'Manual trigger failed',
        error_message: error.message,
        status: 'error',
      });
      throw error;
    }

    await createActivityLog({
      agent_id: agentId,
      action: 'Manual trigger completed',
      details: data,
      status: 'success',
    });

    return data;
  }

  // Legacy workflow for other agent types
  switch (agent.type) {
    case 'lead_nurture':
      if (context?.contact_id) {
        return executeLeadNurtureWorkflow(context.contact_id, agentId);
      }
      throw new Error('contact_id required for Lead Nurture agent');

    case 'social_media':
      if (context?.content_id) {
        return executeSocialMediaWorkflow(context.content_id, agentId);
      }
      throw new Error('content_id required for Social Media agent');

    default:
      throw new Error(`Unknown agent type: ${agent.type}`);
  }
}
