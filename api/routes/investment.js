const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

/**
 * POST /api/investment/apply
 * Submit investment application
 */
router.post('/apply', async (req, res) => {
  try {
    const {
      projectId,
      projectSlug,
      projectName,
      fullName,
      email,
      phone,
      address,
      investmentAmount,
      investorType,
      companyName,
      investmentPurpose,
      investmentExperience,
      riskTolerance,
      identityDocument,
      agreeTerms,
      agreeRisk,
      agreePrivacy
    } = req.body;

    // Validation
    if (!fullName || !email || !phone || !address) {
      return res.status(400).json({ error: 'Missing required personal information' });
    }

    if (!investmentAmount || !investorType || !investmentPurpose) {
      return res.status(400).json({ error: 'Missing required investment details' });
    }

    if (!investmentExperience || !riskTolerance || !identityDocument) {
      return res.status(400).json({ error: 'Missing required verification information' });
    }

    if (!agreeTerms || !agreeRisk || !agreePrivacy) {
      return res.status(400).json({ error: 'You must agree to all terms and conditions' });
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from('investment_applications')
      .insert([
        {
          project_id: projectId,
          project_slug: projectSlug,
          project_name: projectName,
          full_name: fullName,
          email,
          phone,
          address,
          investment_amount: investmentAmount,
          investor_type: investorType,
          company_name: companyName || null,
          investment_purpose: investmentPurpose,
          investment_experience: investmentExperience,
          risk_tolerance: riskTolerance,
          identity_document: identityDocument,
          agree_terms: agreeTerms,
          agree_risk: agreeRisk,
          agree_privacy: agreePrivacy,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to submit application', details: error.message });
    }

    // TODO: Send email notifications
    // - Welcome email to investor
    // - Notification to admin team

    res.status(201).json({
      success: true,
      message: 'Investment application submitted successfully',
      applicationId: data.id,
      data
    });

  } catch (error) {
    console.error('Error submitting investment application:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

/**
 * GET /api/investment/applications
 * Get all investment applications (admin only)
 */
router.get('/applications', async (req, res) => {
  try {
    const { status, projectSlug, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('investment_applications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (projectSlug) {
      query = query.eq('project_slug', projectSlug);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch applications', details: error.message });
    }

    res.json({
      success: true,
      data,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Error fetching investment applications:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

/**
 * GET /api/investment/applications/:id
 * Get single investment application
 */
router.get('/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('investment_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Application not found' });
      }
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch application', details: error.message });
    }

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error fetching investment application:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

/**
 * PATCH /api/investment/applications/:id
 * Update investment application status (admin only)
 */
router.patch('/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (status) {
      const validStatuses = ['pending', 'reviewing', 'approved', 'rejected', 'contacted'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
      updateData.status = status;
      updateData.reviewed_at = new Date().toISOString();
    }

    if (adminNotes !== undefined) {
      updateData.admin_notes = adminNotes;
    }

    const { data, error } = await supabase
      .from('investment_applications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Application not found' });
      }
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to update application', details: error.message });
    }

    res.json({
      success: true,
      message: 'Application updated successfully',
      data
    });

  } catch (error) {
    console.error('Error updating investment application:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

/**
 * GET /api/investment/stats
 * Get investment statistics by project
 */
router.get('/stats', async (req, res) => {
  try {
    const { projectSlug } = req.query;

    let query = supabase
      .from('investment_applications')
      .select('project_slug, status, investment_amount');

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
        pending: 0,
        reviewing: 0,
        approved: 0,
        rejected: 0,
        contacted: 0
      },
      totalAmount: 0,
      averageAmount: 0,
      byProject: {}
    };

    data.forEach(app => {
      stats.byStatus[app.status]++;
      stats.totalAmount += parseFloat(app.investment_amount || 0);

      if (!stats.byProject[app.project_slug]) {
        stats.byProject[app.project_slug] = {
          count: 0,
          totalAmount: 0
        };
      }
      stats.byProject[app.project_slug].count++;
      stats.byProject[app.project_slug].totalAmount += parseFloat(app.investment_amount || 0);
    });

    stats.averageAmount = data.length > 0 ? stats.totalAmount / data.length : 0;

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching investment stats:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

module.exports = router;
