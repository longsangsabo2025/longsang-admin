/**
 * Marketing API Client
 * Frontend service for marketing campaigns and AI features
 */

const API_BASE = '/api/marketing';

// ==================== CAMPAIGNS ====================

/**
 * Get all campaigns for a project
 */
export async function getCampaigns(projectId: string, status?: string) {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  
  const response = await fetch(`${API_BASE}/campaigns/${projectId}?${params}`);
  return response.json();
}

/**
 * Get single campaign with posts
 */
export async function getCampaign(projectId: string, campaignId: string) {
  const response = await fetch(`${API_BASE}/campaigns/${projectId}/${campaignId}`);
  return response.json();
}

/**
 * Create new campaign
 */
export async function createCampaign(data: {
  project_id: string;
  name: string;
  type?: 'social_media' | 'email' | 'ads';
  content?: string;
  goal?: string;
  platforms?: string[];
  scheduled_at?: string;
  budget?: number;
  target_audience?: string;
}) {
  const response = await fetch(`${API_BASE}/campaigns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

/**
 * Update campaign
 */
export async function updateCampaign(campaignId: string, updates: Record<string, any>) {
  const response = await fetch(`${API_BASE}/campaigns/${campaignId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return response.json();
}

/**
 * Delete campaign
 */
export async function deleteCampaign(campaignId: string) {
  const response = await fetch(`${API_BASE}/campaigns/${campaignId}`, {
    method: 'DELETE',
  });
  return response.json();
}

/**
 * Duplicate campaign
 */
export async function duplicateCampaign(campaignId: string) {
  const response = await fetch(`${API_BASE}/campaigns/${campaignId}/duplicate`, {
    method: 'POST',
  });
  return response.json();
}

/**
 * Update campaign status
 */
export async function updateCampaignStatus(
  campaignId: string, 
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed'
) {
  const response = await fetch(`${API_BASE}/campaigns/${campaignId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return response.json();
}

// ==================== POSTS ====================

/**
 * Get all posts for a project
 */
export async function getPosts(projectId: string, filters?: {
  status?: string;
  platform?: string;
  campaign_id?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.platform) params.append('platform', filters.platform);
  if (filters?.campaign_id) params.append('campaign_id', filters.campaign_id);
  
  const response = await fetch(`${API_BASE}/posts/${projectId}?${params}`);
  return response.json();
}

/**
 * Create post(s)
 */
export async function createPosts(posts: Array<{
  campaign_id: string;
  project_id: string;
  platform: string;
  content: string;
  media_url?: string;
  media_type?: string;
  hashtags?: string[];
  scheduled_at?: string;
  visual_concept?: string;
}>) {
  const response = await fetch(`${API_BASE}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(posts),
  });
  return response.json();
}

/**
 * Update post
 */
export async function updatePost(postId: string, updates: Record<string, any>) {
  const response = await fetch(`${API_BASE}/posts/${postId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return response.json();
}

/**
 * Delete post
 */
export async function deletePost(postId: string) {
  const response = await fetch(`${API_BASE}/posts/${postId}`, {
    method: 'DELETE',
  });
  return response.json();
}

// ==================== AI FEATURES ====================

/**
 * Generate campaign strategy with AI
 */
export async function generateStrategy(data: {
  projectSlug: string;
  goal: string;
  targetAudience?: string;
  budget?: string;
}) {
  const response = await fetch(`${API_BASE}/ai/strategy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

/**
 * Generate posts from campaign with AI
 */
export async function generatePostsFromCampaign(data: {
  campaign: {
    name: string;
    content: string;
    goal?: string;
  };
  platforms: string[];
  count?: number;
}) {
  const response = await fetch(`${API_BASE}/ai/generate-posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

/**
 * Generate visual concepts with AI
 */
export async function generateVisualConcepts(data: {
  posts: Array<{ platform: string; content: string }>;
  brandColors?: Array<{ name: string; hex: string }>;
}) {
  const response = await fetch(`${API_BASE}/ai/visual-concepts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

/**
 * Generate optimal schedule with AI
 */
export async function generateSchedule(data: {
  posts: Array<{ platform: string; content: string }>;
  startDate?: string;
}) {
  const response = await fetch(`${API_BASE}/ai/schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

/**
 * Analyze campaign performance with AI
 */
export async function analyzeCampaign(campaignData: {
  totalReach?: number;
  totalEngagement?: number;
  totalClicks?: number;
  conversions?: number;
  posts?: Array<{
    platform: string;
    reach: number;
    engagement: number;
    ctr: number;
  }>;
}) {
  const response = await fetch(`${API_BASE}/ai/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaignData }),
  });
  return response.json();
}

/**
 * Quick generate a single post with AI
 */
export async function quickGeneratePost(data: {
  platform: string;
  topic: string;
  projectSlug: string;
  tone?: string;
}) {
  const response = await fetch(`${API_BASE}/ai/quick-post`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

/**
 * Full flow: Generate and save posts for a campaign
 */
export async function generateAndSaveCampaignPosts(
  campaignId: string,
  options: {
    platforms?: string[];
    count?: number;
    autoSchedule?: boolean;
  }
) {
  const response = await fetch(`${API_BASE}/campaigns/${campaignId}/generate-posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });
  return response.json();
}

// ==================== MARKETING DOCS ====================

/**
 * Get marketing overview for a project
 */
export async function getMarketingDocs(projectSlug: string) {
  const response = await fetch(`/api/marketing-docs/${projectSlug}`);
  return response.json();
}

/**
 * Get document content
 */
export async function getDocumentContent(projectSlug: string, documentId: string) {
  const response = await fetch(`/api/marketing-docs/${projectSlug}/documents/${documentId}`);
  return response.json();
}

/**
 * Create marketing pack from template
 */
export async function createMarketingPack(projectSlug: string, info: {
  name?: string;
  category?: string;
  oneLiner?: string;
  targetMarket?: string;
}) {
  const response = await fetch(`/api/marketing-docs/${projectSlug}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(info),
  });
  return response.json();
}

/**
 * Get all projects marketing status
 */
export async function getAllProjectsMarketingStatus() {
  const response = await fetch('/api/marketing-docs/all/status');
  return response.json();
}

// ==================== EXPORT ====================

export const marketingApi = {
  // Campaigns
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  duplicateCampaign,
  updateCampaignStatus,
  
  // Posts
  getPosts,
  createPosts,
  updatePost,
  deletePost,
  
  // AI
  generateStrategy,
  generatePostsFromCampaign,
  generateVisualConcepts,
  generateSchedule,
  analyzeCampaign,
  quickGeneratePost,
  generateAndSaveCampaignPosts,
  
  // Docs
  getMarketingDocs,
  getDocumentContent,
  createMarketingPack,
  getAllProjectsMarketingStatus,
};

export default marketingApi;
