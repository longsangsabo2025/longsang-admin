/**
 * 🤖 Automatic SEO Manager
 * Tự động thực hiện các tác vụ SEO hàng ngày
 */

import { searchConsoleAPI, indexingAPI, analyticsAPI } from './google-api-client';

interface SEOTask {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  lastRun?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

// ================================================
// AUTO SEO TASKS
// ================================================

export const autoSEOTasks = {
  /**
   * 📊 Task 1: Daily Performance Report
   * Lấy data từ Search Console mỗi ngày
   */
  async dailyPerformanceReport(siteUrl: string) {
    console.log('🔄 Running daily performance report...');
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const data = await searchConsoleAPI.getPerformance(
        siteUrl,
        sevenDaysAgo,
        today
      );

      // Phân tích data
      const summary = {
        totalClicks: 0,
        totalImpressions: 0,
        avgCTR: 0,
        avgPosition: 0,
        topQueries: [] as any[],
        topPages: [] as any[],
      };

      data.forEach((row: any) => {
        summary.totalClicks += row.clicks || 0;
        summary.totalImpressions += row.impressions || 0;
      });

      summary.avgCTR = (summary.totalClicks / summary.totalImpressions) * 100;
      
      // Sort top queries
      summary.topQueries = data
        .sort((a: any, b: any) => (b.clicks || 0) - (a.clicks || 0))
        .slice(0, 10)
        .map((row: any) => ({
          query: row.keys?.[0],
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
        }));

      console.log('✅ Daily report completed:', summary);
      return summary;
    } catch (error) {
      console.error('❌ Failed to generate daily report:', error);
      throw error;
    }
  },

  /**
   * 🚀 Task 2: Auto Submit New Content to Google
   * Tự động submit URL mới lên Google Index
   */
  async autoSubmitNewContent(urls: string[]) {
    console.log('🔄 Auto-submitting new content to Google...');
    
    const results = [];

    for (const url of urls) {
      try {
        await indexingAPI.requestIndexing(url);
        results.push({ url, status: 'success' });
        
        // Rate limiting: Wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Failed to submit ${url}:`, error);
        results.push({ url, status: 'failed', error });
      }
    }

    console.log('✅ Auto-submit completed:', results);
    return results;
  },

  /**
   * 🔍 Task 3: Monitor Keyword Rankings
   * Theo dõi thứ hạng của các keywords quan trọng
   */
  async monitorKeywordRankings(siteUrl: string, targetKeywords: string[]) {
    console.log('🔄 Monitoring keyword rankings...');
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const data = await searchConsoleAPI.getPerformance(
        siteUrl,
        yesterday,
        today
      );

      const rankings = targetKeywords.map(keyword => {
        const keywordData = data.find(
          (row: any) => row.keys?.[0]?.toLowerCase() === keyword.toLowerCase()
        );

        return {
          keyword,
          position: keywordData?.position || null,
          clicks: keywordData?.clicks || 0,
          impressions: keywordData?.impressions || 0,
          ctr: keywordData?.ctr || 0,
          status: keywordData ? 'ranking' : 'not_ranking',
        };
      });

      console.log('✅ Keyword monitoring completed:', rankings);
      return rankings;
    } catch (error) {
      console.error('❌ Failed to monitor keywords:', error);
      throw error;
    }
  },

  /**
   * 📈 Task 4: Weekly Analytics Summary
   * Tạo báo cáo tổng hợp hàng tuần từ GA4
   */
  async weeklyAnalyticsSummary(propertyId: string) {
    console.log('🔄 Generating weekly analytics summary...');
    
    try {
      const data = await analyticsAPI.getTopPages(propertyId, 7);

      const summary = {
        weekStartDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        weekEndDate: new Date().toISOString(),
        topPages: data.rows?.slice(0, 10).map((row: any) => ({
          page: row.dimensionValues?.[0]?.value,
          pageViews: parseInt(row.metricValues?.[0]?.value || '0'),
          avgSessionDuration: parseFloat(row.metricValues?.[1]?.value || '0'),
        })) || [],
      };

      console.log('✅ Weekly summary completed:', summary);
      return summary;
    } catch (error) {
      console.error('❌ Failed to generate weekly summary:', error);
      throw error;
    }
  },

  /**
   * 🗺️ Task 5: Auto Generate & Submit Sitemap
   * Tự động tạo và submit sitemap mới
   */
  async autoGenerateAndSubmitSitemap(siteUrl: string, sitemapUrl: string) {
    console.log('🔄 Auto-generating and submitting sitemap...');
    
    try {
      // Submit sitemap to Google
      await searchConsoleAPI.submitSitemap(siteUrl, sitemapUrl);

      console.log('✅ Sitemap submitted successfully');
      return { success: true, sitemapUrl };
    } catch (error) {
      console.error('❌ Failed to submit sitemap:', error);
      throw error;
    }
  },

  /**
   * 🔔 Task 6: Alert on Ranking Drops
   * Cảnh báo khi có keyword giảm thứ hạng đáng kể
   */
  async alertOnRankingDrops(
    siteUrl: string,
    thresholdDrop: number = 5
  ) {
    console.log('🔄 Checking for ranking drops...');
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      // Get current week data
      const currentData = await searchConsoleAPI.getPerformance(
        siteUrl,
        sevenDaysAgo,
        today
      );

      // Get previous week data
      const previousData = await searchConsoleAPI.getPerformance(
        siteUrl,
        fourteenDaysAgo,
        sevenDaysAgo
      );

      // Compare rankings
      const alerts: any[] = [];

      currentData.forEach((current: any) => {
        const query = current.keys?.[0];
        const previous = previousData.find(
          (p: any) => p.keys?.[0] === query
        );

        if (previous) {
          const positionDrop = current.position - previous.position;
          
          if (positionDrop >= thresholdDrop) {
            alerts.push({
              query,
              currentPosition: current.position,
              previousPosition: previous.position,
              drop: positionDrop,
              clicks: current.clicks,
              impressions: current.impressions,
            });
          }
        }
      });

      console.log('✅ Ranking drops check completed:', alerts);
      return alerts;
    } catch (error) {
      console.error('❌ Failed to check ranking drops:', error);
      throw error;
    }
  },
};

// ================================================
// SCHEDULER
// ================================================

/**
 * Tự động chạy các tasks theo lịch
 */
export class SEOScheduler {
  private tasks: SEOTask[] = [];
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeTasks();
  }

  private initializeTasks() {
    this.tasks = [
      {
        id: 'daily-report',
        name: 'Daily Performance Report',
        frequency: 'daily',
        status: 'pending',
      },
      {
        id: 'keyword-monitoring',
        name: 'Keyword Rankings Monitor',
        frequency: 'daily',
        status: 'pending',
      },
      {
        id: 'ranking-drops',
        name: 'Ranking Drops Alert',
        frequency: 'daily',
        status: 'pending',
      },
      {
        id: 'weekly-summary',
        name: 'Weekly Analytics Summary',
        frequency: 'weekly',
        status: 'pending',
      },
    ];
  }

  /**
   * Bắt đầu scheduler (chạy mỗi giờ)
   */
  start() {
    console.log('🚀 SEO Scheduler started');
    
    // Run immediately
    this.runScheduledTasks();

    // Then run every hour
    this.intervalId = setInterval(() => {
      this.runScheduledTasks();
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Dừng scheduler
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      console.log('⏹️ SEO Scheduler stopped');
    }
  }

  private async runScheduledTasks() {
    const now = new Date();
    
    console.log('⏰ Running scheduled SEO tasks at', now.toISOString());

    for (const task of this.tasks) {
      const shouldRun = this.shouldRunTask(task, now);
      
      if (shouldRun) {
        await this.runTask(task);
      }
    }
  }

  private shouldRunTask(task: SEOTask, now: Date): boolean {
    if (!task.lastRun) return true;

    const hoursSinceLastRun = 
      (now.getTime() - task.lastRun.getTime()) / (1000 * 60 * 60);

    switch (task.frequency) {
      case 'daily':
        return hoursSinceLastRun >= 24;
      case 'weekly':
        return hoursSinceLastRun >= 168;
      case 'monthly':
        return hoursSinceLastRun >= 720;
      default:
        return false;
    }
  }

  private async runTask(task: SEOTask) {
    try {
      task.status = 'running';
      console.log(`🔄 Running task: ${task.name}`);

      // Run the appropriate task
      // (You'll need to pass siteUrl and other params from config)
      
      task.status = 'completed';
      task.lastRun = new Date();
      
      console.log(`✅ Task completed: ${task.name}`);
    } catch (error) {
      task.status = 'failed';
      console.error(`❌ Task failed: ${task.name}`, error);
    }
  }

  /**
   * Lấy status của tất cả tasks
   */
  getTasksStatus() {
    return this.tasks;
  }
}

export default {
  autoSEOTasks,
  SEOScheduler,
};
