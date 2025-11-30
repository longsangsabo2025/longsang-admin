/**
 * 📊 Social Media Analytics Dashboard
 * 
 * Displays analytics from Supabase tables:
 * - platform_analytics: Platform-level metrics
 * - content_performance: Individual post performance
 * - ai_usage: AI API usage and costs
 * 
 * @author LongSang Admin
 * @version 1.0.0
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  Users,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Facebook,
  Instagram,
  Linkedin,
  AtSign,
  Calendar,
  Zap,
  DollarSign,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Types
interface PlatformMetric {
  platform: string;
  followers: number;
  engagement_rate: number;
  posts_count: number;
  reach: number;
  impressions: number;
  period: string;
}

interface ContentPerformance {
  id: string;
  post_id: string;
  platform: string;
  content_preview: string;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  engagement_rate: number;
  posted_at: string;
  page_id: string;
}

interface AIUsage {
  id: string;
  model: string;
  tokens_used: number;
  cost_estimate: number;
  action_type: string;
  created_at: string;
}

interface DashboardState {
  platformMetrics: PlatformMetric[];
  contentPerformance: ContentPerformance[];
  aiUsage: AIUsage[];
  loading: boolean;
  error: string | null;
  dateRange: '7d' | '30d' | '90d';
}

// Platform colors
const PLATFORM_COLORS: Record<string, string> = {
  facebook: '#1877F2',
  instagram: '#E4405F',
  linkedin: '#0A66C2',
  threads: '#000000',
  tiktok: '#000000',
};

const CHART_COLORS = ['#e94560', '#16213e', '#0f3460', '#533483', '#e94560'];

// Platform icons
const PlatformIcon: React.FC<{ platform: string; className?: string }> = ({ platform, className }) => {
  switch (platform.toLowerCase()) {
    case 'facebook':
      return <Facebook className={className} />;
    case 'instagram':
      return <Instagram className={className} />;
    case 'linkedin':
      return <Linkedin className={className} />;
    case 'threads':
      return <AtSign className={className} />;
    default:
      return <Activity className={className} />;
  }
};

export const SocialAnalyticsDashboard: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    platformMetrics: [],
    contentPerformance: [],
    aiUsage: [],
    loading: true,
    error: null,
    dateRange: '30d',
  });

  // Fetch analytics data
  const fetchAnalytics = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const daysAgo = state.dateRange === '7d' ? 7 : state.dateRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      
      // Fetch platform analytics
      const { data: platformData, error: platformError } = await supabase
        .from('platform_analytics')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });
      
      if (platformError) throw platformError;
      
      // Fetch content performance
      const { data: contentData, error: contentError } = await supabase
        .from('content_performance')
        .select('*')
        .gte('posted_at', startDate.toISOString())
        .order('engagement_rate', { ascending: false })
        .limit(20);
      
      if (contentError) throw contentError;
      
      // Fetch AI usage
      const { data: aiData, error: aiError } = await supabase
        .from('ai_usage')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });
      
      if (aiError) throw aiError;
      
      setState(prev => ({
        ...prev,
        platformMetrics: platformData || [],
        contentPerformance: contentData || [],
        aiUsage: aiData || [],
        loading: false,
      }));
    } catch (error: any) {
      console.error('Analytics fetch error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load analytics',
      }));
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [state.dateRange]);

  // Calculate summary metrics
  const totalFollowers = state.platformMetrics.reduce((sum, p) => sum + (p.followers || 0), 0);
  const avgEngagement = state.platformMetrics.length > 0
    ? (state.platformMetrics.reduce((sum, p) => sum + (p.engagement_rate || 0), 0) / state.platformMetrics.length).toFixed(2)
    : '0';
  const totalPosts = state.platformMetrics.reduce((sum, p) => sum + (p.posts_count || 0), 0);
  const totalReach = state.platformMetrics.reduce((sum, p) => sum + (p.reach || 0), 0);
  
  const totalAICost = state.aiUsage.reduce((sum, u) => sum + (u.cost_estimate || 0), 0);
  const totalTokens = state.aiUsage.reduce((sum, u) => sum + (u.tokens_used || 0), 0);

  // Prepare chart data
  const engagementByPlatform = state.platformMetrics.reduce((acc: any[], metric) => {
    const existing = acc.find(p => p.platform === metric.platform);
    if (existing) {
      existing.engagement = Math.max(existing.engagement, metric.engagement_rate);
      existing.followers = Math.max(existing.followers, metric.followers);
    } else {
      acc.push({
        platform: metric.platform,
        engagement: metric.engagement_rate,
        followers: metric.followers,
        reach: metric.reach,
      });
    }
    return acc;
  }, []);

  const topContent = state.contentPerformance.slice(0, 5);

  const aiUsageByModel = state.aiUsage.reduce((acc: Record<string, number>, usage) => {
    acc[usage.model] = (acc[usage.model] || 0) + usage.tokens_used;
    return acc;
  }, {});

  const aiChartData = Object.entries(aiUsageByModel).map(([model, tokens]) => ({
    name: model,
    tokens,
  }));

  if (state.loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-7 h-7 text-primary" />
            Social Media Analytics
          </h1>
          <p className="text-gray-400 mt-1">Real-time performance across all platforms</p>
        </div>
        
        {/* Date Range Selector */}
        <div className="flex items-center gap-2 bg-dark-surface rounded-lg p-1">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setState(prev => ({ ...prev, dateRange: range }))}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                state.dateRange === range
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:text-white hover:bg-dark-bg'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {state.error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
          {state.error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-surface border border-gray-700 rounded-xl p-5"
        >
          <div className="flex items-center justify-between">
            <Users className="w-8 h-8 text-blue-400" />
            <span className="text-green-400 text-sm flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />+12%
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{totalFollowers.toLocaleString()}</div>
            <div className="text-gray-400 text-sm">Total Followers</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-dark-surface border border-gray-700 rounded-xl p-5"
        >
          <div className="flex items-center justify-between">
            <Heart className="w-8 h-8 text-pink-400" />
            <span className="text-green-400 text-sm flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />+8%
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{avgEngagement}%</div>
            <div className="text-gray-400 text-sm">Avg Engagement Rate</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-dark-surface border border-gray-700 rounded-xl p-5"
        >
          <div className="flex items-center justify-between">
            <Eye className="w-8 h-8 text-cyan-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{totalReach.toLocaleString()}</div>
            <div className="text-gray-400 text-sm">Total Reach</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-dark-surface border border-gray-700 rounded-xl p-5"
        >
          <div className="flex items-center justify-between">
            <Calendar className="w-8 h-8 text-purple-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{totalPosts}</div>
            <div className="text-gray-400 text-sm">Posts Published</div>
          </div>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement by Platform */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-dark-surface border border-gray-700 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Engagement by Platform
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementByPlatform}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="platform" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="engagement" fill="#e94560" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Followers Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-dark-surface border border-gray-700 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Followers Distribution
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={engagementByPlatform}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="followers"
                  nameKey="platform"
                  label={({ platform, percent }) => `${platform} ${(percent * 100).toFixed(0)}%`}
                >
                  {engagementByPlatform.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={PLATFORM_COLORS[entry.platform.toLowerCase()] || CHART_COLORS[index % CHART_COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Top Performing Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dark-surface border border-gray-700 rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Top Performing Content
        </h3>
        
        {topContent.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No content performance data available yet
          </div>
        ) : (
          <div className="space-y-3">
            {topContent.map((content, index) => (
              <div
                key={content.id}
                className="flex items-center gap-4 p-4 bg-dark-bg rounded-lg border border-gray-700"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {index + 1}
                </div>
                <div className="flex-shrink-0">
                  <PlatformIcon 
                    platform={content.platform} 
                    className="w-5 h-5"
                    style={{ color: PLATFORM_COLORS[content.platform.toLowerCase()] || '#9CA3AF' } as any}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">
                    {content.content_preview || 'No preview available'}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {new Date(content.posted_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-pink-400">
                    <Heart className="w-4 h-4" />
                    {content.likes}
                  </div>
                  <div className="flex items-center gap-1 text-blue-400">
                    <MessageCircle className="w-4 h-4" />
                    {content.comments}
                  </div>
                  <div className="flex items-center gap-1 text-green-400">
                    <Share2 className="w-4 h-4" />
                    {content.shares}
                  </div>
                  <div className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-medium">
                    {content.engagement_rate?.toFixed(2)}% engagement
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* AI Usage Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Cost Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-surface border border-gray-700 rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">AI Costs</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-3xl font-bold text-white">
                ${totalAICost.toFixed(4)}
              </div>
              <div className="text-gray-400 text-sm">Total estimated cost</div>
            </div>
            <div>
              <div className="text-xl font-semibold text-cyan-400">
                {totalTokens.toLocaleString()}
              </div>
              <div className="text-gray-400 text-sm">Tokens used</div>
            </div>
            <div>
              <div className="text-lg text-gray-300">
                {state.aiUsage.length} API calls
              </div>
              <div className="text-gray-400 text-sm">In selected period</div>
            </div>
          </div>
        </motion.div>

        {/* AI Usage by Model */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-dark-surface border border-gray-700 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Token Usage by Model
          </h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aiChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="tokens" 
                  stroke="#e94560" 
                  fill="#e94560" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {engagementByPlatform.map((platform, index) => (
          <motion.div
            key={platform.platform}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-dark-surface border border-gray-700 rounded-xl p-5"
            style={{ borderColor: PLATFORM_COLORS[platform.platform.toLowerCase()] + '40' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: PLATFORM_COLORS[platform.platform.toLowerCase()] + '20' }}
              >
                <PlatformIcon 
                  platform={platform.platform}
                  className="w-5 h-5"
                  style={{ color: PLATFORM_COLORS[platform.platform.toLowerCase()] } as any}
                />
              </div>
              <div>
                <div className="font-semibold text-white capitalize">{platform.platform}</div>
                <div className="text-gray-400 text-xs">{platform.followers.toLocaleString()} followers</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-lg font-bold text-white">{platform.engagement}%</div>
                <div className="text-gray-500 text-xs">Engagement</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">{platform.reach?.toLocaleString() || 0}</div>
                <div className="text-gray-500 text-xs">Reach</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SocialAnalyticsDashboard;
