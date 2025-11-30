/**
 * Domain Statistics Service
 * Calculates and manages domain statistics
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Simple in-memory cache for statistics (TTL: 5 minutes)
const statsCache = new Map();

/**
 * Get domain statistics
 * @param {string} domainId - Domain ID
 * @param {string} userId - User ID
 * @param {boolean} forceRefresh - Force refresh from database
 * @returns {Promise<Object>} - Domain statistics
 */
async function getDomainStats(domainId, userId, forceRefresh = false) {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const cacheKey = `${domainId}-${userId}`;

  // Check cache
  if (!forceRefresh && statsCache.has(cacheKey)) {
    const cached = statsCache.get(cacheKey);
    if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
      // 5 minutes TTL
      return cached.data;
    }
  }

  try {
    // Trigger stats update
    const { error: updateError } = await supabase.rpc("update_domain_stats", {
      p_domain_id: domainId,
    });

    if (updateError) {
      console.error("[Domain Stats] Update error:", updateError);
    }

    // Get statistics
    const { data, error } = await supabase
      .from("brain_domain_stats")
      .select("*")
      .eq("domain_id", domainId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Stats not found, return default
        return getDefaultStats();
      }
      throw new Error(`Failed to get domain stats: ${error.message}`);
    }

    const stats = {
      totalKnowledge: data.total_knowledge_count || 0,
      thisWeek: data.knowledge_count_this_week || 0,
      thisMonth: data.knowledge_count_this_month || 0,
      lastActivity: data.last_activity_at,
      lastKnowledgeAdded: data.last_knowledge_added_at,
      lastQuery: data.last_query_at,
      totalQueries: data.total_queries || 0,
      avgSimilarity: data.avg_similarity_score || 0,
      avgContentLength: data.avg_content_length || 0,
      topTags: data.top_tags || [],
      uniqueTags: data.total_unique_tags || 0,
      computedAt: data.computed_at,
    };

    // Cache result
    statsCache.set(cacheKey, {
      data: stats,
      timestamp: Date.now(),
    });

    return stats;
  } catch (error) {
    console.error("[Domain Stats] Error:", error);
    throw error;
  }
}

/**
 * Get domain analytics (trends and patterns)
 * @param {string} domainId - Domain ID
 * @param {string} userId - User ID
 * @param {number} days - Number of days to analyze
 * @returns {Promise<Object>} - Analytics data
 */
async function getDomainAnalytics(domainId, userId, days = 30) {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get knowledge growth over time
    const { data: knowledge } = await supabase
      .from("brain_knowledge")
      .select("created_at")
      .eq("domain_id", domainId)
      .eq("user_id", userId)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    // Get query activity
    const { data: queries } = await supabase
      .from("brain_query_history")
      .select("created_at, query")
      .eq("user_id", userId)
      .contains("domain_ids", [domainId])
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    // Calculate daily growth
    const dailyGrowth = calculateDailyGrowth(knowledge || [], days);

    // Calculate query trends
    const queryTrends = calculateQueryTrends(queries || [], days);

    // Get tag distribution
    const { data: allKnowledge } = await supabase
      .from("brain_knowledge")
      .select("tags")
      .eq("domain_id", domainId)
      .eq("user_id", userId);

    const tagDistribution = calculateTagDistribution(allKnowledge || []);

    return {
      domainId,
      period: { days, startDate, endDate: new Date().toISOString() },
      knowledgeGrowth: dailyGrowth,
      queryTrends,
      tagDistribution,
      summary: {
        totalKnowledge: knowledge?.length || 0,
        totalQueries: queries?.length || 0,
        avgQueriesPerDay: (queries?.length || 0) / days,
        mostActiveDay: getMostActiveDay(queries || []),
      },
    };
  } catch (error) {
    console.error("[Domain Stats] Analytics error:", error);
    throw error;
  }
}

/**
 * Get domain trends
 * @param {string} domainId - Domain ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Trend data
 */
async function getDomainTrends(domainId, userId) {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  try {
    const stats = await getDomainStats(domainId, userId);

    // Compare with previous period
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: previousKnowledge } = await supabase
      .from("brain_knowledge")
      .select("created_at")
      .eq("domain_id", domainId)
      .eq("user_id", userId)
      .lt("created_at", thirtyDaysAgo.toISOString())
      .gte("created_at", new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const previousCount = previousKnowledge?.length || 0;
    const currentCount = stats.thisMonth;
    const growthRate = previousCount > 0 ? ((currentCount - previousCount) / previousCount) * 100 : 0;

    return {
      domainId,
      growth: {
        rate: growthRate,
        direction: growthRate > 0 ? "up" : growthRate < 0 ? "down" : "stable",
        current: currentCount,
        previous: previousCount,
      },
      activity: {
        level: getActivityLevel(stats.totalQueries, stats.lastActivity),
        trend: "increasing", // Simplified
      },
      insights: generateInsights(stats),
    };
  } catch (error) {
    console.error("[Domain Stats] Trends error:", error);
    throw error;
  }
}

/**
 * Calculate daily growth
 */
function calculateDailyGrowth(knowledge, days) {
  const growth = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const count = knowledge.filter((k) => {
      const kDate = new Date(k.created_at).toISOString().split("T")[0];
      return kDate === dateStr;
    }).length;

    growth.push({ date: dateStr, count });
  }

  return growth;
}

/**
 * Calculate query trends
 */
function calculateQueryTrends(queries, days) {
  const trends = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const count = queries.filter((q) => {
      const qDate = new Date(q.created_at).toISOString().split("T")[0];
      return qDate === dateStr;
    }).length;

    trends.push({ date: dateStr, count });
  }

  return trends;
}

/**
 * Calculate tag distribution
 */
function calculateTagDistribution(knowledge) {
  const tagCounts = new Map();

  knowledge.forEach((k) => {
    k.tags?.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

/**
 * Get most active day
 */
function getMostActiveDay(queries) {
  if (queries.length === 0) return null;

  const dayCounts = new Map();
  queries.forEach((q) => {
    const day = new Date(q.created_at).toLocaleDateString();
    dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
  });

  const mostActive = Array.from(dayCounts.entries()).sort((a, b) => b[1] - a[1])[0];
  return mostActive ? { date: mostActive[0], count: mostActive[1] } : null;
}

/**
 * Get activity level
 */
function getActivityLevel(totalQueries, lastActivity) {
  if (!lastActivity) return "none";

  const daysSinceActivity = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceActivity < 1) return "very_active";
  if (daysSinceActivity < 7) return "active";
  if (daysSinceActivity < 30) return "moderate";
  return "low";
}

/**
 * Generate insights
 */
function generateInsights(stats) {
  const insights = [];

  if (stats.thisWeek > stats.thisMonth / 4) {
    insights.push("High activity this week - domain is growing rapidly");
  }

  if (stats.avgSimilarity > 0.8) {
    insights.push("High quality knowledge - excellent relevance scores");
  }

  if (stats.topTags.length > 0) {
    const topTag = stats.topTags[0];
    insights.push(`Most common topic: ${topTag.tag} (${topTag.count} items)`);
  }

  if (stats.totalQueries === 0) {
    insights.push("No queries yet - start searching to unlock insights");
  }

  return insights;
}

/**
 * Get default stats
 */
function getDefaultStats() {
  return {
    totalKnowledge: 0,
    thisWeek: 0,
    thisMonth: 0,
    lastActivity: null,
    lastKnowledgeAdded: null,
    lastQuery: null,
    totalQueries: 0,
    avgSimilarity: 0,
    avgContentLength: 0,
    topTags: [],
    uniqueTags: 0,
    computedAt: new Date().toISOString(),
  };
}

/**
 * Clear statistics cache
 */
function clearStatsCache(domainId = null) {
  if (domainId) {
    const keysToDelete = [];
    for (const key of statsCache.keys()) {
      if (key.startsWith(`${domainId}-`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => statsCache.delete(key));
  } else {
    statsCache.clear();
  }
}

module.exports = {
  getDomainStats,
  getDomainAnalytics,
  getDomainTrends,
  clearStatsCache,
  isConfigured: !!supabase,
};

