/**
 * 🔄 Campaign Sync Hook - Sync marketing_campaigns to content_queue
 * 
 * FLOW:
 * 1. marketing_campaigns (scheduled) → content_queue (scheduled)
 * 2. content_queue displays in Content Queue page with calendar view
 * 3. When publish time arrives → post to platforms
 */
import { supabase } from '@/lib/supabase';

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  content: string;
  platforms: string[];
  scheduled_at: string | null;
  target_audience?: Record<string, any>;
}

/**
 * Sync a marketing campaign to content_queue
 * This creates entries for each platform in the campaign
 */
export async function syncCampaignToQueue(campaign: Campaign) {
  if (!campaign.scheduled_at || campaign.status !== 'scheduled') {
    console.log('Campaign not scheduled, skipping sync');
    return [];
  }

  const results = [];
  
  for (const platform of campaign.platforms) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('content_queue')
      .select('id')
      .eq('metadata->campaign_id', campaign.id)
      .eq('metadata->platform', platform)
      .maybeSingle();
    
    if (existing) {
      console.log(`Already synced: ${campaign.name} → ${platform}`);
      continue;
    }

    // Create content_queue entry
    const { data, error } = await supabase
      .from('content_queue')
      .insert([{
        title: `[${platform.toUpperCase()}] ${campaign.name}`,
        content_type: 'social_media',
        content: campaign.content,
        status: 'scheduled',
        priority: 8,
        scheduled_for: campaign.scheduled_at,
        metadata: {
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          platform: platform,
          target_audience: campaign.target_audience,
          source: 'marketing_campaign'
        }
      }])
      .select()
      .single();
    
    if (error) {
      console.error(`Error syncing ${campaign.name} → ${platform}:`, error);
    } else {
      results.push(data);
      console.log(`✅ Synced: ${campaign.name} → ${platform}`);
    }
  }
  
  return results;
}

/**
 * Sync ALL scheduled campaigns to content_queue
 */
export async function syncAllScheduledCampaigns() {
  console.log('🔄 Starting campaign sync...');
  
  // Get all scheduled campaigns
  const { data: campaigns, error } = await supabase
    .from('marketing_campaigns')
    .select('*')
    .eq('status', 'scheduled');
  
  if (error) {
    console.error('Error fetching campaigns:', error);
    return { synced: 0, errors: 1 };
  }

  let synced = 0;
  let errors = 0;

  for (const campaign of campaigns || []) {
    try {
      const results = await syncCampaignToQueue(campaign);
      synced += results.length;
    } catch (err) {
      console.error(`Error syncing campaign ${campaign.name}:`, err);
      errors++;
    }
  }

  console.log(`✅ Sync complete: ${synced} items synced, ${errors} errors`);
  return { synced, errors };
}

/**
 * Get calendar events from content_queue (scheduled items)
 */
export async function getCalendarEvents(startDate?: Date, endDate?: Date) {
  let query = supabase
    .from('content_queue')
    .select('id, title, content_type, status, scheduled_for, metadata')
    .not('scheduled_for', 'is', null)
    .order('scheduled_for', { ascending: true });
  
  if (startDate) {
    query = query.gte('scheduled_for', startDate.toISOString());
  }
  if (endDate) {
    query = query.lte('scheduled_for', endDate.toISOString());
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching calendar events:', error);
    return [];
  }

  // Transform to calendar event format
  return (data || []).map(item => ({
    id: item.id,
    title: item.title,
    start: new Date(item.scheduled_for!),
    end: new Date(item.scheduled_for!),
    type: item.content_type,
    status: item.status,
    platform: item.metadata?.platform || 'unknown',
    campaignId: item.metadata?.campaign_id,
    color: getEventColor(item.metadata?.platform)
  }));
}

function getEventColor(platform?: string): string {
  const colors: Record<string, string> = {
    facebook: '#1877F2',
    instagram: '#E4405F',
    linkedin: '#0A66C2',
    twitter: '#1DA1F2',
    threads: '#000000',
    tiktok: '#FF0050',
    youtube: '#FF0000'
  };
  return colors[platform || ''] || '#6B7280';
}

export default { syncCampaignToQueue, syncAllScheduledCampaigns, getCalendarEvents };
