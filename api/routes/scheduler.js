/**
 * Post Scheduler API Routes
 * 
 * Endpoints for scheduling and managing scheduled posts
 * 
 * @author LongSang Admin
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const postScheduler = require('../services/post-scheduler');

/**
 * POST /api/scheduler/schedule
 * Schedule a new post
 */
router.post('/schedule', async (req, res) => {
  try {
    const { pageId, content, imageUrl, postType, preferredTime, urgent } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'content is required',
      });
    }

    const result = await postScheduler.schedulePost({
      pageId: pageId || 'sabo_arena',
      content,
      imageUrl,
      postType: postType || 'default',
      preferredTime,
      urgent,
    });

    res.json(result);
  } catch (error) {
    console.error('❌ Schedule post error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/scheduler/list
 * List scheduled posts
 */
router.get('/list', async (req, res) => {
  try {
    const { pageId, status, limit } = req.query;

    const posts = await postScheduler.getScheduledPosts(pageId, {
      status: status || 'scheduled',
      limit: parseInt(limit) || 50,
    });

    res.json({
      success: true,
      count: posts.length,
      posts: posts.map(p => ({
        id: p.id,
        pageId: p.page_id,
        contentPreview: p.content?.substring(0, 100) + '...',
        hasImage: !!p.image_url,
        scheduledFor: p.scheduled_for,
        status: p.status,
        postType: p.post_type,
        createdAt: p.created_at,
      })),
    });
  } catch (error) {
    console.error('❌ List scheduled posts error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/scheduler/:postId
 * Get scheduled post details
 */
router.get('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await postScheduler.getScheduledPost(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Scheduled post not found',
      });
    }

    res.json({
      success: true,
      post,
    });
  } catch (error) {
    console.error('❌ Get scheduled post error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/scheduler/:postId
 * Update a scheduled post
 */
router.put('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, imageUrl, scheduledFor, postType } = req.body;

    const result = await postScheduler.updateScheduledPost(postId, {
      content,
      imageUrl,
      scheduledFor,
      postType,
    });

    res.json(result);
  } catch (error) {
    console.error('❌ Update scheduled post error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/scheduler/:postId/cancel
 * Cancel a scheduled post
 */
router.post('/:postId/cancel', async (req, res) => {
  try {
    const { postId } = req.params;
    const result = await postScheduler.cancelScheduledPost(postId);
    res.json(result);
  } catch (error) {
    console.error('❌ Cancel scheduled post error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/scheduler/:postId/publish-now
 * Publish a scheduled post immediately
 */
router.post('/:postId/publish-now', async (req, res) => {
  try {
    const { postId } = req.params;
    const result = await postScheduler.publishNow(postId);
    res.json(result);
  } catch (error) {
    console.error('❌ Publish now error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/scheduler/suggested-times
 * Get suggested posting times
 */
router.get('/suggested/times', async (req, res) => {
  try {
    const { postType, count } = req.query;
    const suggestions = postScheduler.getSuggestedTimes(
      postType || 'default',
      parseInt(count) || 5
    );

    res.json({
      success: true,
      postType: postType || 'default',
      suggestions,
    });
  } catch (error) {
    console.error('❌ Get suggested times error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/scheduler/analytics
 * Get scheduler analytics
 */
router.get('/analytics/summary', async (req, res) => {
  try {
    const { pageId, days } = req.query;
    const analytics = await postScheduler.getAnalytics(pageId, parseInt(days) || 30);
    res.json({
      success: true,
      ...analytics,
    });
  } catch (error) {
    console.error('❌ Get analytics error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/scheduler/process
 * Manually trigger processing of due posts (admin only)
 */
router.post('/process/now', async (req, res) => {
  try {
    const result = await postScheduler.processDuePosts();
    res.json(result);
  } catch (error) {
    console.error('❌ Process posts error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
