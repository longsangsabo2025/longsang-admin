/**
 * 🐙 GITHUB API ROUTES
 * 
 * Provides endpoints for GitHub integration:
 * - Workflow runs status
 * - Pull requests
 * - Auto-fix status
 * 
 * @author LongSang Admin
 */

const express = require('express');
const router = express.Router();

// GitHub config
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO_OWNER = process.env.GITHUB_REPO_OWNER || 'longsangsabo2025';
const GITHUB_REPO_NAME = process.env.GITHUB_REPO_NAME || 'ainewbie-vision';

/**
 * GET /api/github/status
 * Check GitHub integration status
 */
router.get('/status', (req, res) => {
  res.json({
    configured: !!GITHUB_TOKEN,
    hasToken: !!GITHUB_TOKEN,
    repoOwner: GITHUB_REPO_OWNER,
    repoName: GITHUB_REPO_NAME,
    features: {
      autofix: !!GITHUB_TOKEN,
      prReview: !!GITHUB_TOKEN,
      webhooks: true
    }
  });
});

/**
 * GET /api/github/workflow-runs
 * Get recent workflow runs
 */
router.get('/workflow-runs', async (req, res) => {
  try {
    if (!GITHUB_TOKEN) {
      return res.status(400).json({ 
        success: false, 
        error: 'GITHUB_TOKEN not configured',
        runs: []
      });
    }

    const { workflow = 'sentry-autofix.yml', per_page = 10 } = req.query;

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/actions/workflows/${workflow}/runs?per_page=${per_page}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${GITHUB_TOKEN}`
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GitHub] Failed to fetch workflow runs:', errorText);
      return res.status(response.status).json({ 
        success: false, 
        error: 'Failed to fetch workflow runs',
        runs: []
      });
    }

    const data = await response.json();

    const runs = (data.workflow_runs || []).map(run => ({
      id: run.id,
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
      branch: run.head_branch,
      commit: run.head_sha?.substring(0, 7),
      createdAt: run.created_at,
      updatedAt: run.updated_at,
      url: run.html_url,
      triggeredBy: run.triggering_actor?.login || 'system'
    }));

    res.json({ 
      success: true, 
      total: data.total_count || 0,
      runs 
    });

  } catch (error) {
    console.error('[GitHub] Error fetching workflow runs:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      runs: []
    });
  }
});

/**
 * GET /api/github/pull-requests
 * Get recent pull requests (especially auto-fix PRs)
 */
router.get('/pull-requests', async (req, res) => {
  try {
    if (!GITHUB_TOKEN) {
      return res.status(400).json({ 
        success: false, 
        error: 'GITHUB_TOKEN not configured',
        pullRequests: []
      });
    }

    const { state = 'all', per_page = 10, labels = 'auto-fix' } = req.query;

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/pulls?state=${state}&per_page=${per_page}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${GITHUB_TOKEN}`
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GitHub] Failed to fetch PRs:', errorText);
      return res.status(response.status).json({ 
        success: false, 
        error: 'Failed to fetch pull requests',
        pullRequests: []
      });
    }

    const data = await response.json();

    // Filter by label if specified
    let prs = data;
    if (labels) {
      const labelList = labels.split(',');
      prs = data.filter(pr => 
        pr.labels?.some(label => labelList.includes(label.name))
      );
    }

    const pullRequests = prs.map(pr => ({
      id: pr.id,
      number: pr.number,
      title: pr.title,
      state: pr.state,
      merged: pr.merged_at !== null,
      branch: pr.head?.ref,
      baseBranch: pr.base?.ref,
      author: pr.user?.login,
      labels: pr.labels?.map(l => l.name) || [],
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      mergedAt: pr.merged_at,
      url: pr.html_url,
      isAutoFix: pr.labels?.some(l => l.name === 'auto-fix') || pr.title?.includes('Auto-Fix')
    }));

    res.json({ 
      success: true, 
      total: pullRequests.length,
      pullRequests 
    });

  } catch (error) {
    console.error('[GitHub] Error fetching PRs:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      pullRequests: []
    });
  }
});

/**
 * GET /api/github/issues
 * Get issues (especially auto-fix related)
 */
router.get('/issues', async (req, res) => {
  try {
    if (!GITHUB_TOKEN) {
      return res.status(400).json({ 
        success: false, 
        error: 'GITHUB_TOKEN not configured',
        issues: []
      });
    }

    const { state = 'all', per_page = 10, labels = 'auto-fix' } = req.query;

    const url = labels 
      ? `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/issues?state=${state}&per_page=${per_page}&labels=${labels}`
      : `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/issues?state=${state}&per_page=${per_page}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${GITHUB_TOKEN}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GitHub] Failed to fetch issues:', errorText);
      return res.status(response.status).json({ 
        success: false, 
        error: 'Failed to fetch issues',
        issues: []
      });
    }

    const data = await response.json();

    // Filter out PRs (GitHub API returns PRs in issues endpoint)
    const issues = data
      .filter(item => !item.pull_request)
      .map(issue => ({
        id: issue.id,
        number: issue.number,
        title: issue.title,
        state: issue.state,
        labels: issue.labels?.map(l => l.name) || [],
        author: issue.user?.login,
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
        closedAt: issue.closed_at,
        url: issue.html_url,
        isAutoFix: issue.labels?.some(l => l.name === 'auto-fix') || issue.title?.includes('Auto-Fix')
      }));

    res.json({ 
      success: true, 
      total: issues.length,
      issues 
    });

  } catch (error) {
    console.error('[GitHub] Error fetching issues:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      issues: []
    });
  }
});

/**
 * POST /api/github/trigger-workflow
 * Manually trigger a workflow
 */
router.post('/trigger-workflow', async (req, res) => {
  try {
    if (!GITHUB_TOKEN) {
      return res.status(400).json({ 
        success: false, 
        error: 'GITHUB_TOKEN not configured'
      });
    }

    const { workflow = 'sentry-autofix.yml', ref = 'master', inputs = {} } = req.body;

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/actions/workflows/${workflow}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ref,
          inputs
        })
      }
    );

    if (response.ok || response.status === 204) {
      console.log(`[GitHub] ✅ Workflow ${workflow} triggered`);
      res.json({ 
        success: true, 
        message: `Workflow ${workflow} triggered successfully`
      });
    } else {
      const errorText = await response.text();
      console.error('[GitHub] Failed to trigger workflow:', errorText);
      res.status(response.status).json({ 
        success: false, 
        error: 'Failed to trigger workflow',
        details: errorText
      });
    }

  } catch (error) {
    console.error('[GitHub] Error triggering workflow:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

/**
 * GET /api/github/autofix-stats
 * Get auto-fix statistics
 */
router.get('/autofix-stats', async (req, res) => {
  try {
    if (!GITHUB_TOKEN) {
      return res.json({
        configured: false,
        stats: null
      });
    }

    // Fetch workflow runs for sentry-autofix
    const runsResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/actions/workflows/sentry-autofix.yml/runs?per_page=100`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${GITHUB_TOKEN}`
        }
      }
    );

    // Fetch auto-fix PRs
    const prsResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/pulls?state=all&per_page=100`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${GITHUB_TOKEN}`
        }
      }
    );

    const runs = runsResponse.ok ? (await runsResponse.json()).workflow_runs || [] : [];
    const prs = prsResponse.ok ? await prsResponse.json() : [];

    // Calculate stats
    const autoFixPRs = prs.filter(pr => 
      pr.labels?.some(l => l.name === 'auto-fix') || 
      pr.title?.includes('Auto-Fix')
    );

    const stats = {
      totalWorkflowRuns: runs.length,
      successfulRuns: runs.filter(r => r.conclusion === 'success').length,
      failedRuns: runs.filter(r => r.conclusion === 'failure').length,
      inProgressRuns: runs.filter(r => r.status === 'in_progress').length,
      totalAutoFixPRs: autoFixPRs.length,
      mergedPRs: autoFixPRs.filter(pr => pr.merged_at).length,
      openPRs: autoFixPRs.filter(pr => pr.state === 'open').length,
      successRate: runs.length > 0 
        ? Math.round((runs.filter(r => r.conclusion === 'success').length / runs.length) * 100)
        : 0,
      lastRunAt: runs[0]?.created_at || null,
      lastRunStatus: runs[0]?.conclusion || runs[0]?.status || null
    };

    res.json({
      configured: true,
      stats
    });

  } catch (error) {
    console.error('[GitHub] Error fetching autofix stats:', error.message);
    res.json({
      configured: !!GITHUB_TOKEN,
      stats: null,
      error: error.message
    });
  }
});

module.exports = router;
