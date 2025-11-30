/**
 * =================================================================
 * SOCIAL MEDIA POST API
 * =================================================================
 * POST /api/social/post - Post to a single social account
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Platform posting handlers
const PLATFORM_HANDLERS = {
  facebook: postToFacebook,
  instagram: postToInstagram,
  linkedin: postToLinkedIn,
  twitter: postToTwitter,
  threads: postToThreads,
  youtube: postToYouTube,
  tiktok: postToTikTok,
  telegram: postToTelegram,
  discord: postToDiscord,
};

/**
 * GET /api/social - Get all social accounts overview
 */
router.get('/', async (req, res) => {
  try {
    const platforms = Object.keys(PLATFORM_HANDLERS);
    
    res.json({
      success: true,
      platforms,
      message: 'Social Media API ready',
      endpoints: {
        post: 'POST /api/social/post',
        accounts: 'GET /api/social/accounts/:projectId',
        scheduled: 'GET /api/social/scheduled'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/social/scheduled
 * Get scheduled posts
 */
router.get('/scheduled', async (req, res) => {
  try {
    if (!supabase) {
      return res.json({ success: true, data: [], message: 'Database not configured' });
    }

    const { data, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(20);

    if (error && error.code !== '42P01') {
      throw error;
    }

    res.json({ success: true, data: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, data: [] });
  }
});

/**
 * POST /api/social/post
 * Post content to a social media account
 */
router.post('/post', async (req, res) => {
  try {
    const { accountId, credentialId, platform, content, imageUrl, pageId } = req.body;

    if (!platform || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: platform, content'
      });
    }

    const handler = PLATFORM_HANDLERS[platform.toLowerCase()];
    if (!handler) {
      return res.status(400).json({
        success: false,
        error: `Unsupported platform: ${platform}`
      });
    }

    // Get credentials from database if credentialId provided
    let credentials = null;
    if (credentialId) {
      credentials = await getCredentials(credentialId);
    }

    const result = await handler({
      accountId,
      content,
      imageUrl,
      pageId,
      credentials
    });

    return res.json(result);
  } catch (error) {
    console.error('Social post error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to post'
    });
  }
});

/**
 * GET /api/social/accounts/:projectId
 * Get social accounts for a project
 */
router.get('/accounts/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // This would query from Supabase
    // For now, return mock data
    return res.json({
      success: true,
      accounts: []
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper to get credentials from database
async function getCredentials(credentialId) {
  // TODO: Implement Supabase query
  // For now return null
  return null;
}

// Platform handlers
async function postToFacebook({ content, imageUrl, pageId, credentials }) {
  // Facebook Graph API
  if (!credentials?.access_token) {
    return { success: false, error: 'No Facebook access token' };
  }

  try {
    const url = `https://graph.facebook.com/v18.0/${pageId || 'me'}/feed`;
    const params = new URLSearchParams({
      message: content,
      access_token: credentials.access_token
    });

    if (imageUrl) {
      params.append('link', imageUrl);
    }

    const response = await fetch(url, {
      method: 'POST',
      body: params
    });

    const data = await response.json();
    
    if (data.error) {
      return { success: false, error: data.error.message };
    }

    return { success: true, postId: data.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function postToInstagram({ content, imageUrl, credentials }) {
  // Instagram requires media
  if (!imageUrl) {
    return { success: false, error: 'Instagram requires an image' };
  }

  if (!credentials?.access_token || !credentials?.instagram_account_id) {
    return { success: false, error: 'No Instagram credentials' };
  }

  try {
    // Step 1: Create media container
    const containerUrl = `https://graph.facebook.com/v18.0/${credentials.instagram_account_id}/media`;
    const containerResponse = await fetch(containerUrl, {
      method: 'POST',
      body: new URLSearchParams({
        image_url: imageUrl,
        caption: content,
        access_token: credentials.access_token
      })
    });
    
    const containerData = await containerResponse.json();
    if (containerData.error) {
      return { success: false, error: containerData.error.message };
    }

    // Step 2: Publish the media
    const publishUrl = `https://graph.facebook.com/v18.0/${credentials.instagram_account_id}/media_publish`;
    const publishResponse = await fetch(publishUrl, {
      method: 'POST',
      body: new URLSearchParams({
        creation_id: containerData.id,
        access_token: credentials.access_token
      })
    });

    const publishData = await publishResponse.json();
    if (publishData.error) {
      return { success: false, error: publishData.error.message };
    }

    return { success: true, postId: publishData.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function postToLinkedIn({ content, imageUrl, credentials }) {
  if (!credentials?.access_token || !credentials?.person_urn) {
    return { success: false, error: 'No LinkedIn credentials' };
  }

  try {
    const url = 'https://api.linkedin.com/v2/ugcPosts';
    const body = {
      author: credentials.person_urn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: content },
          shareMediaCategory: imageUrl ? 'ARTICLE' : 'NONE',
          ...(imageUrl && {
            media: [{
              status: 'READY',
              originalUrl: imageUrl
            }]
          })
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.access_token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    if (data.status && data.status >= 400) {
      return { success: false, error: data.message };
    }

    return { success: true, postId: data.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function postToTwitter({ content, credentials }) {
  if (!credentials?.access_token) {
    return { success: false, error: 'No Twitter credentials' };
  }

  try {
    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: content })
    });

    const data = await response.json();
    
    if (data.errors) {
      return { success: false, error: data.errors[0]?.message };
    }

    return { success: true, postId: data.data?.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function postToThreads({ content, credentials }) {
  if (!credentials?.access_token || !credentials?.threads_user_id) {
    return { success: false, error: 'No Threads credentials' };
  }

  try {
    // Step 1: Create media container
    const containerUrl = `https://graph.threads.net/v1.0/${credentials.threads_user_id}/threads`;
    const containerResponse = await fetch(containerUrl, {
      method: 'POST',
      body: new URLSearchParams({
        media_type: 'TEXT',
        text: content,
        access_token: credentials.access_token
      })
    });

    const containerData = await containerResponse.json();
    if (containerData.error) {
      return { success: false, error: containerData.error.message };
    }

    // Step 2: Publish
    const publishUrl = `https://graph.threads.net/v1.0/${credentials.threads_user_id}/threads_publish`;
    const publishResponse = await fetch(publishUrl, {
      method: 'POST',
      body: new URLSearchParams({
        creation_id: containerData.id,
        access_token: credentials.access_token
      })
    });

    const publishData = await publishResponse.json();
    if (publishData.error) {
      return { success: false, error: publishData.error.message };
    }

    return { success: true, postId: publishData.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function postToYouTube({ content, credentials }) {
  // YouTube community posts require specific permissions
  return { 
    success: false, 
    error: 'YouTube community posts not yet implemented' 
  };
}

async function postToTikTok({ content, credentials }) {
  // TikTok requires video content
  return { 
    success: false, 
    error: 'TikTok posting requires video content' 
  };
}

async function postToTelegram({ content, credentials }) {
  if (!credentials?.bot_token || !credentials?.chat_id) {
    return { success: false, error: 'No Telegram credentials' };
  }

  try {
    const url = `https://api.telegram.org/bot${credentials.bot_token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: credentials.chat_id,
        text: content,
        parse_mode: 'HTML'
      })
    });

    const data = await response.json();
    
    if (!data.ok) {
      return { success: false, error: data.description };
    }

    return { success: true, postId: String(data.result.message_id) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function postToDiscord({ content, credentials }) {
  if (!credentials?.webhook_url) {
    return { success: false, error: 'No Discord webhook URL' };
  }

  try {
    const response = await fetch(credentials.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    return { success: true, postId: 'webhook-post' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = router;
