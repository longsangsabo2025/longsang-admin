/**
 * 📅 Post Scheduler Service
 * 
 * Auto-schedule posts at optimal times based on:
 * - Page analytics
 * - Audience engagement patterns
 * - Timezone (Vietnam GMT+7)
 * 
 * @author LongSang Admin
 * @version 1.0.0
 */

const { createClient } = require('@supabase/supabase-js');
const facebookPublisher = require('./facebook-publisher');

const supabaseUrl = process.env.SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Optimal posting times by day and content type (Vietnam timezone)
 */
const OPTIMAL_TIMES = {
  // General best times for Vietnamese market
  default: {
    weekday: ['09:00', '12:00', '18:00', '21:00'],
    weekend: ['10:00', '14:00', '19:00', '21:30'],
  },
  // Content-specific times
  promotion: {
    weekday: ['11:30', '17:30', '20:00'],
    weekend: ['10:00', '14:00', '20:00'],
  },
  event: {
    weekday: ['09:00', '18:00'],
    weekend: ['10:00', '15:00'],
  },
  entertainment: {
    weekday: ['12:00', '19:00', '22:00'],
    weekend: ['11:00', '15:00', '21:00'],
  },
  educational: {
    weekday: ['08:00', '13:00', '20:00'],
    weekend: ['09:00', '16:00'],
  },
};

/**
 * Schedule a post for optimal time
 * @param {object} postData - Post content and metadata
 * @param {object} options - Scheduling options
 * @returns {Promise<object>} Scheduled post info
 */
async function schedulePost(postData, options = {}) {
  try {
    const {
      pageId,
      content,
      imageUrl,
      postType = 'default',
      preferredTime = null,
      timezone = 'Asia/Ho_Chi_Minh',
    } = { ...postData, ...options };

    console.log(`[Scheduler] Scheduling ${postType} post for page ${pageId}`);

    // Calculate optimal time
    let scheduledTime;
    if (preferredTime) {
      scheduledTime = new Date(preferredTime);
    } else {
      scheduledTime = calculateOptimalTime(postType, timezone);
    }

    // Check for conflicts (avoid posting too close to other scheduled posts)
    const adjustedTime = await avoidConflicts(pageId, scheduledTime);

    // Save to scheduled_posts table
    const { data: scheduledPost, error } = await supabase
      .from('scheduled_posts')
      .insert({
        page_id: pageId,
        content,
        image_url: imageUrl,
        post_type: postType,
        scheduled_time: adjustedTime.toISOString(),
        status: 'scheduled',
        created_at: new Date().toISOString(),
        metadata: {
          originalOptimalTime: scheduledTime.toISOString(),
          adjustmentReason: adjustedTime.getTime() !== scheduledTime.getTime() 
            ? 'Conflict avoidance' 
            : null,
        },
      })
      .select()
      .single();

    if (error) {
      console.error('[Scheduler] Error saving scheduled post:', error);
      // Continue without saving to DB - still return schedule info
    }

    return {
      success: true,
      scheduledTime: adjustedTime.toISOString(),
      scheduledTimeLocal: formatLocalTime(adjustedTime, timezone),
      postId: scheduledPost?.id || `temp-${Date.now()}`,
      postType,
      status: 'scheduled',
      willPostIn: getTimeUntilPost(adjustedTime),
    };
  } catch (error) {
    console.error('[Scheduler] Error scheduling post:', error);
    throw error;
  }
}

/**
 * Calculate optimal posting time
 */
function calculateOptimalTime(postType = 'default', timezone = 'Asia/Ho_Chi_Minh') {
  const now = new Date();
  
  // Get Vietnam time
  const vietnamTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const dayOfWeek = vietnamTime.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const dayType = isWeekend ? 'weekend' : 'weekday';

  // Get optimal times for this post type
  const times = OPTIMAL_TIMES[postType]?.[dayType] || OPTIMAL_TIMES.default[dayType];
  const currentHour = vietnamTime.getHours();
  const currentMinute = vietnamTime.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinute;

  // Find next available optimal time
  let selectedTime = null;
  for (const timeStr of times) {
    const [hour, minute] = timeStr.split(':').map(Number);
    const timeMinutes = hour * 60 + minute;
    
    if (timeMinutes > currentTimeMinutes + 30) { // At least 30 min from now
      selectedTime = timeStr;
      break;
    }
  }

  // If no time found today, use first time tomorrow
  if (!selectedTime) {
    const tomorrow = new Date(vietnamTime);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowIsWeekend = tomorrow.getDay() === 0 || tomorrow.getDay() === 6;
    const tomorrowTimes = OPTIMAL_TIMES[postType]?.[tomorrowIsWeekend ? 'weekend' : 'weekday'] 
      || OPTIMAL_TIMES.default[tomorrowIsWeekend ? 'weekend' : 'weekday'];
    selectedTime = tomorrowTimes[0];
    
    const [hour, minute] = selectedTime.split(':').map(Number);
    tomorrow.setHours(hour, minute, 0, 0);
    return tomorrow;
  }

  // Set time today
  const [hour, minute] = selectedTime.split(':').map(Number);
  vietnamTime.setHours(hour, minute, 0, 0);
  return vietnamTime;
}

/**
 * Avoid conflicts with existing scheduled posts
 */
async function avoidConflicts(pageId, proposedTime) {
  try {
    // Get scheduled posts within 2 hours of proposed time
    const startWindow = new Date(proposedTime.getTime() - 2 * 60 * 60 * 1000);
    const endWindow = new Date(proposedTime.getTime() + 2 * 60 * 60 * 1000);

    const { data: conflicts } = await supabase
      .from('scheduled_posts')
      .select('scheduled_time')
      .eq('page_id', pageId)
      .eq('status', 'scheduled')
      .gte('scheduled_time', startWindow.toISOString())
      .lte('scheduled_time', endWindow.toISOString());

    if (!conflicts || conflicts.length === 0) {
      return proposedTime;
    }

    // Adjust time by adding 2 hours for each conflict
    let adjustedTime = new Date(proposedTime);
    for (let i = 0; i < conflicts.length; i++) {
      adjustedTime = new Date(adjustedTime.getTime() + 2 * 60 * 60 * 1000);
    }

    console.log(`[Scheduler] Adjusted time from ${proposedTime.toISOString()} to ${adjustedTime.toISOString()} due to ${conflicts.length} conflict(s)`);
    return adjustedTime;
  } catch (error) {
    console.warn('[Scheduler] Error checking conflicts:', error.message);
    return proposedTime;
  }
}

/**
 * Get all scheduled posts for a page
 */
async function getScheduledPosts(pageId, options = {}) {
  try {
    const { status = 'scheduled', limit = 20 } = options;

    let query = supabase
      .from('scheduled_posts')
      .select('*')
      .eq('page_id', pageId)
      .order('scheduled_time', { ascending: true })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Scheduler] Error fetching scheduled posts:', error);
      return [];
    }

    return data.map(post => ({
      ...post,
      scheduledTimeLocal: formatLocalTime(new Date(post.scheduled_time)),
      willPostIn: getTimeUntilPost(new Date(post.scheduled_time)),
    }));
  } catch (error) {
    console.error('[Scheduler] Error:', error);
    return [];
  }
}

/**
 * Cancel a scheduled post
 */
async function cancelScheduledPost(postId) {
  try {
    const { data, error } = await supabase
      .from('scheduled_posts')
      .update({ status: 'cancelled' })
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      message: `Post ${postId} cancelled`,
      post: data,
    };
  } catch (error) {
    console.error('[Scheduler] Error cancelling post:', error);
    throw error;
  }
}

/**
 * Process due scheduled posts (run by cron job)
 */
async function processDuePosts() {
  try {
    const now = new Date();
    
    // Get posts that are due (scheduled_time <= now and status = scheduled)
    const { data: duePosts, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_time', now.toISOString())
      .limit(10);

    if (error) {
      console.error('[Scheduler] Error fetching due posts:', error);
      return { processed: 0, errors: [] };
    }

    if (!duePosts || duePosts.length === 0) {
      return { processed: 0, errors: [] };
    }

    console.log(`[Scheduler] Processing ${duePosts.length} due posts`);

    const results = {
      processed: 0,
      errors: [],
    };

    for (const post of duePosts) {
      try {
        // Post to Facebook using facebookPublisher
        const postResult = await facebookPublisher.createPost(
          post.page_id,
          {
            message: post.content,
            imageUrl: post.image_url,
          }
        );

        // Update status to posted
        await supabase
          .from('scheduled_posts')
          .update({
            status: 'posted',
            posted_at: new Date().toISOString(),
            facebook_post_id: postResult.id,
          })
          .eq('id', post.id);

        results.processed++;
        console.log(`[Scheduler] Posted scheduled post ${post.id} -> FB ${postResult.id}`);
      } catch (postError) {
        console.error(`[Scheduler] Error posting ${post.id}:`, postError);
        results.errors.push({
          postId: post.id,
          error: postError.message,
        });

        // Mark as failed
        await supabase
          .from('scheduled_posts')
          .update({
            status: 'failed',
            error_message: postError.message,
          })
          .eq('id', post.id);
      }
    }

    return results;
  } catch (error) {
    console.error('[Scheduler] Error processing due posts:', error);
    throw error;
  }
}

/**
 * Get suggested times for a post
 */
function getSuggestedTimes(postType = 'default', count = 5) {
  const now = new Date();
  const suggestions = [];
  const timezone = 'Asia/Ho_Chi_Minh';

  // Get optimal times for next 3 days
  for (let dayOffset = 0; dayOffset < 3 && suggestions.length < count; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    
    const vietnamDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    const isWeekend = vietnamDate.getDay() === 0 || vietnamDate.getDay() === 6;
    const dayType = isWeekend ? 'weekend' : 'weekday';
    const times = OPTIMAL_TIMES[postType]?.[dayType] || OPTIMAL_TIMES.default[dayType];

    for (const timeStr of times) {
      if (suggestions.length >= count) break;

      const [hour, minute] = timeStr.split(':').map(Number);
      const suggestedTime = new Date(vietnamDate);
      suggestedTime.setHours(hour, minute, 0, 0);

      // Only include future times
      if (suggestedTime > now) {
        suggestions.push({
          time: suggestedTime.toISOString(),
          timeLocal: formatLocalTime(suggestedTime, timezone),
          dayType,
          reason: getTimeReason(hour, postType),
        });
      }
    }
  }

  return suggestions;
}

/**
 * Get reason for suggested time
 */
function getTimeReason(hour, postType) {
  if (hour >= 8 && hour <= 9) return 'Buổi sáng - người dùng check điện thoại đầu ngày';
  if (hour >= 11 && hour <= 12) return 'Giờ nghỉ trưa - engagement cao';
  if (hour >= 17 && hour <= 18) return 'Sau giờ làm việc - thời gian rảnh';
  if (hour >= 19 && hour <= 21) return 'Tối - peak time cho mạng xã hội';
  if (hour >= 21) return 'Tối muộn - người dùng thư giãn trước khi ngủ';
  return 'Thời điểm phù hợp cho nội dung';
}

/**
 * Format local time for Vietnam
 */
function formatLocalTime(date, timezone = 'Asia/Ho_Chi_Minh') {
  return date.toLocaleString('vi-VN', {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get human-readable time until post
 */
function getTimeUntilPost(scheduledTime) {
  const now = new Date();
  const diff = scheduledTime.getTime() - now.getTime();

  if (diff < 0) return 'Đã quá hạn';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours === 0) return `${minutes} phút nữa`;
  if (hours < 24) return `${hours} giờ ${minutes} phút nữa`;
  
  const days = Math.floor(hours / 24);
  return `${days} ngày ${hours % 24} giờ nữa`;
}

module.exports = {
  schedulePost,
  getScheduledPosts,
  cancelScheduledPost,
  processDuePosts,
  getSuggestedTimes,
  calculateOptimalTime,
  formatLocalTime,
  getTimeUntilPost,
  OPTIMAL_TIMES,
};
