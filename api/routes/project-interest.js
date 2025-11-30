const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

/**
 * POST /api/project/interest
 * Submit project interest (from "Quan Tâm Dự Án" button)
 */
router.post('/interest', async (req, res) => {
  try {
    const {
      projectId,
      projectSlug,
      projectName,
      fullName,
      email,
      phone,
      message
    } = req.body;

    // Validation
    if (!fullName || !email || !phone) {
      return res.status(400).json({ error: 'Missing required fields: fullName, email, phone' });
    }

    if (!projectId || !projectSlug || !projectName) {
      return res.status(400).json({ error: 'Missing project information' });
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from('project_interests')
      .insert([
        {
          project_id: projectId,
          project_slug: projectSlug,
          project_name: projectName,
          full_name: fullName,
          email,
          phone,
          message: message || null,
          status: 'new'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to submit interest', details: error.message });
    }

    // TODO: Send email notifications
    // - Thank you email to user
    // - Notification to sales team

    res.status(201).json({
      success: true,
      message: 'Your interest has been recorded successfully',
      interestId: data.id,
      data
    });

  } catch (error) {
    console.error('Error submitting project interest:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

/**
 * GET /api/project/interests
 * Get all project interests (admin only)
 */
router.get('/interests', async (req, res) => {
  try {
    const { status, projectSlug, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('project_interests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(Number.parseInt(offset, 10), Number.parseInt(offset, 10) + Number.parseInt(limit, 10) - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (projectSlug) {
      query = query.eq('project_slug', projectSlug);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch interests', details: error.message });
    }

    res.json({
      success: true,
      data,
      total: count,
      limit: Number.parseInt(limit, 10),
      offset: Number.parseInt(offset, 10)
    });

  } catch (error) {
    console.error('Error fetching project interests:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

/**
 * PATCH /api/project/interests/:id
 * Update project interest status
 */
router.patch('/interests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['new', 'contacted', 'converted', 'not_interested'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'contacted') {
      updateData.contacted_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('project_interests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Interest not found' });
      }
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to update interest', details: error.message });
    }

    res.json({
      success: true,
      message: 'Interest updated successfully',
      data
    });

  } catch (error) {
    console.error('Error updating project interest:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

/**
 * GET /api/project/interest-stats
 * Get interest statistics by project
 */
router.get('/interest-stats', async (req, res) => {
  try {
    const { projectSlug } = req.query;

    let query = supabase
      .from('project_interests')
      .select('project_slug, status, created_at');

    if (projectSlug) {
      query = query.eq('project_slug', projectSlug);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch stats', details: error.message });
    }

    // Calculate statistics
    const stats = {
      total: data.length,
      byStatus: {
        new: 0,
        contacted: 0,
        converted: 0,
        not_interested: 0
      },
      byProject: {},
      conversionRate: 0
    };

    for (const interest of data) {
      stats.byStatus[interest.status]++;

      if (!stats.byProject[interest.project_slug]) {
        stats.byProject[interest.project_slug] = {
          count: 0,
          converted: 0
        };
      }
      stats.byProject[interest.project_slug].count++;
      if (interest.status === 'converted') {
        stats.byProject[interest.project_slug].converted++;
      }
    }

    stats.conversionRate = data.length > 0 
      ? (stats.byStatus.converted / data.length * 100).toFixed(2) 
      : 0;

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching interest stats:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

module.exports = router;
